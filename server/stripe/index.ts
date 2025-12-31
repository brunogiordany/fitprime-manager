import Stripe from 'stripe';
import { ENV } from '../_core/env';

// Inicializar cliente Stripe apenas se a chave estiver configurada
const stripeKey = ENV.stripeSecretKey || process.env.STRIPE_SECRET_KEY;

// Criar instância do Stripe com verificação de chave
let stripe: Stripe | null = null;

if (stripeKey && stripeKey.length > 0) {
  stripe = new Stripe(stripeKey, {
    apiVersion: '2025-12-15.clover' as any,
  });
}

// Helper para verificar se Stripe está configurado
function getStripe(): Stripe {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return stripe;
}

// Criar ou recuperar cliente Stripe
export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
): Promise<Stripe.Customer> {
  const s = getStripe();
  // Buscar cliente existente pelo email
  const existingCustomers = await s.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Criar novo cliente
  return s.customers.create({
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
  return getStripe().products.create({
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
  return getStripe().prices.create({
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
  return getStripe().checkout.sessions.create({
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
  const s = getStripe();
  // Criar produto temporário
  const product = await s.products.create({
    name: options.description,
    metadata: options.metadata,
  });

  // Criar preço
  const price = await s.prices.create({
    product: product.id,
    unit_amount: options.amount,
    currency: options.currency || 'brl',
  });

  // Criar link de pagamento
  return s.paymentLinks.create({
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
    return getStripe().subscriptions.cancel(subscriptionId);
  }
  return getStripe().subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

// Buscar assinatura
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.retrieve(subscriptionId);
}

// Buscar pagamentos de um cliente
export async function getCustomerPayments(
  customerId: string,
  limit: number = 10
): Promise<Stripe.PaymentIntent[]> {
  const paymentIntents = await getStripe().paymentIntents.list({
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
  return getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
}

// Verificar se Stripe está configurado
export function isStripeConfigured(): boolean {
  return stripe !== null;
}

export { stripe, Stripe };
