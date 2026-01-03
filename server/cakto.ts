/**
 * Cakto Payment Integration Module
 * 
 * Handles OAuth2 authentication and webhook processing for Cakto payments.
 */

const CAKTO_API_URL = "https://api.cakto.com.br";

// Token cache to avoid unnecessary token requests
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get OAuth2 access token from Cakto
 */
export async function getCaktoToken(): Promise<string> {
  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  const clientId = process.env.CAKTO_CLIENT_ID;
  const clientSecret = process.env.CAKTO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Cakto credentials not configured");
  }

  const response = await fetch(`${CAKTO_API_URL}/public_api/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Cakto authentication failed: ${response.status}`);
  }

  const data = await response.json();
  
  // Cache the token
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  return cachedToken.token;
}

/**
 * Make authenticated request to Cakto API
 */
export async function caktoRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getCaktoToken();

  return fetch(`${CAKTO_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

/**
 * List orders from Cakto
 */
export async function listOrders(filters?: Record<string, string>) {
  const params = new URLSearchParams(filters);
  const response = await caktoRequest(`/public_api/orders/?${params}`);
  
  if (!response.ok) {
    throw new Error(`Failed to list orders: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a specific order by ID
 */
export async function getOrder(orderId: string) {
  const response = await caktoRequest(`/public_api/orders/${orderId}/`);
  
  if (!response.ok) {
    throw new Error(`Failed to get order: ${response.status}`);
  }

  return response.json();
}

/**
 * Webhook event types from Cakto
 */
export type CaktoWebhookEvent = 
  | "initiate_checkout"
  | "checkout_abandonment"
  | "purchase_approved"
  | "purchase_refused"
  | "pix_gerado"
  | "boleto_gerado"
  | "picpay_gerado"
  | "openfinance_nubank_gerado"
  | "chargeback"
  | "refund"
  | "subscription_created"
  | "subscription_canceled"
  | "subscription_renewed"
  | "subscription_renewal_refused";

/**
 * Webhook payload structure from Cakto
 */
export interface CaktoWebhookPayload {
  event: CaktoWebhookEvent;
  data: {
    id: string;
    refId: string;
    status: string;
    type: "unique" | "subscription";
    amount: string;
    baseAmount: string;
    discount: string;
    paymentMethod: string;
    installments: number;
    createdAt: string;
    paidAt: string | null;
    refundedAt: string | null;
    canceledAt: string | null;
    customer: {
      name: string;
      email: string;
      phone: string;
      docType: string;
      docNumber: string;
    };
    product: {
      id: string;
      name: string;
      price: number;
      type: string;
    };
    subscription?: {
      id: string;
      status: string;
      nextBillingDate: string | null;
    };
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
  secret?: string;
}

/**
 * Verify webhook signature (if secret is provided)
 */
export function verifyWebhookSignature(
  payload: CaktoWebhookPayload,
  expectedSecret?: string
): boolean {
  if (!expectedSecret) {
    return true; // No secret configured, skip verification
  }
  
  return payload.secret === expectedSecret;
}

/**
 * Process webhook event from Cakto
 * Returns the action to take based on the event
 */
export function processWebhookEvent(payload: CaktoWebhookPayload): {
  action: "activate" | "deactivate" | "renew" | "none";
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  productId: string;
  productName: string;
  orderId: string;
  amount: number;
  subscriptionId?: string;
} {
  const { event, data } = payload;

  const result = {
    customerEmail: data.customer.email,
    customerPhone: data.customer.phone,
    customerName: data.customer.name,
    productId: data.product.id,
    productName: data.product.name,
    orderId: data.id,
    amount: parseFloat(data.amount),
    subscriptionId: data.subscription?.id,
  };

  switch (event) {
    case "purchase_approved":
    case "subscription_created":
      return { ...result, action: "activate" };
    
    case "subscription_renewed":
      return { ...result, action: "renew" };
    
    case "refund":
    case "chargeback":
    case "subscription_canceled":
      return { ...result, action: "deactivate" };
    
    default:
      return { ...result, action: "none" };
  }
}

/**
 * Create a webhook in Cakto
 */
export async function createWebhook(
  name: string,
  url: string,
  events: CaktoWebhookEvent[],
  productIds?: string[]
) {
  const body: Record<string, unknown> = {
    name,
    url,
    events,
    status: "active",
  };

  if (productIds && productIds.length > 0) {
    body.products = productIds;
  }

  const response = await caktoRequest("/public_api/webhook/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create webhook: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * List webhooks from Cakto
 */
export async function listWebhooks() {
  const response = await caktoRequest("/public_api/webhook/");
  
  if (!response.ok) {
    throw new Error(`Failed to list webhooks: ${response.status}`);
  }

  return response.json();
}

/**
 * Delete a webhook from Cakto
 */
export async function deleteWebhook(webhookId: string) {
  const response = await caktoRequest(`/public_api/webhook/${webhookId}/`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete webhook: ${response.status}`);
  }

  return true;
}
