import Stripe from 'stripe';
import { ENV } from '../_core/env';

// Inicializar cliente Stripe
export const stripe = new Stripe(ENV.stripeSecretKey || '', {
  apiVersion: '2025-12-15.clover',
});

// Criar ou recuperar cliente Stripe
export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  // Buscar cliente existente pelo email
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Criar novo cliente
  return stripe.customers.create({
    email,
    name,
    metadata,
  });
}

// Criar produto no Stripe
export async function createStripeProduct(
  name: string,
  description: string,
  metadata?: Record<string, string>
): Promise<Stripe.Product> {
  return stripe.products.create({
    name,
    description,
    metadata,
  });
}

// Criar preço no Stripe
export async function createStripePrice(
  productId: string,
  unitAmount: number, // em centavos
  currency: string = 'brl',
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year';
    interval_count?: number;
  }
): Promise<Stripe.Price> {
  return stripe.prices.create({
    product: productId,
    unit_amount: unitAmount,
    currency,
    ...(recurring && { recurring }),
  });
}

// Criar sessão de checkout
export async function createCheckoutSession(options: {
  customerId?: string;
  customerEmail?: string;
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
  clientReferenceId?: string;
  allowPromotionCodes?: boolean;
}): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.create({
    customer: options.customerId,
    customer_email: options.customerId ? undefined : options.customerEmail,
    line_items: [
      {
        price: options.priceId,
        quantity: 1,
      },
    ],
    mode: options.mode,
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: options.metadata,
    client_reference_id: options.clientReferenceId,
    allow_promotion_codes: options.allowPromotionCodes ?? true,
  });
}

// Criar link de pagamento para cobrança avulsa
export async function createPaymentLink(options: {
  amount: number; // em centavos
  currency?: string;
  description: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentLink> {
  // Criar produto temporário
  const product = await stripe.products.create({
    name: options.description,
    metadata: options.metadata,
  });

  // Criar preço
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: options.amount,
    currency: options.currency || 'brl',
  });

  // Criar link de pagamento
  return stripe.paymentLinks.create({
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    metadata: options.metadata,
    allow_promotion_codes: true,
  });
}

// Cancelar assinatura
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Buscar assinatura
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return stripe.subscriptions.retrieve(subscriptionId);
}

// Buscar pagamentos de um cliente
export async function getCustomerPayments(
  customerId: string,
  limit: number = 10
): Promise<Stripe.PaymentIntent[]> {
  const paymentIntents = await stripe.paymentIntents.list({
    customer: customerId,
    limit,
  });
  return paymentIntents.data;
}

// Verificar assinatura do Stripe
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

export { Stripe };
