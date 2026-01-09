/**
 * Integração com Payt - Plataforma de vendas para afiliados e influenciadores
 * 
 * Documentação: https://github.com/ventuinha/payt-postback
 * 
 * Eventos principais:
 * - paid: Pagamento aprovado
 * - subscription_activated: Assinatura ativada
 * - subscription_renewed: Assinatura renovada
 * - subscription_canceled: Assinatura cancelada
 * - subscription_overdue: Assinatura em atraso
 */

// Tipos baseados na documentação oficial da Payt
export interface PaytCustomer {
  name: string;
  fake_email: boolean;
  email: string;
  doc: string; // CPF ou CNPJ
  phone: string;
  ip: string;
  billing_address?: PaytAddress;
  origin?: PaytOrigin;
  code: string;
  url: string;
}

export interface PaytAddress {
  zipcode: string;
  street: string;
  street_number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  country: string;
}

export interface PaytOrigin {
  name: string;
  code: string;
  query_params?: Record<string, string>;
}

export interface PaytProduct {
  name: string;
  price: number; // em centavos
  code: string;
  sku: string;
  type: 'physical' | 'digital' | 'grouped';
  quantity: number;
  items?: PaytProduct[];
}

export interface PaytTransaction {
  payment_method: 'credit_card' | 'boleto' | 'pix';
  payment_status: PaytPaymentStatus;
  total_price: number; // em centavos
  quantity: number;
  upsell_from?: string;
  payment_url?: string;
  modifiers?: PaytPaymentModifier[];
  paid_at?: string;
  created_at: string;
  updated_at: string;
  // Credit Card specific
  installments?: number;
  installment_price?: number;
  error_message?: string;
  // Boleto specific
  bankslip_url?: string;
  bankslip_code?: string;
  expires_at?: string;
  // Pix specific
  pix_url?: string;
  pix_code?: string;
}

export interface PaytPaymentModifier {
  name: string;
  reason: 'coupon';
  method: 'fixed' | 'percentage';
  amount: number;
}

export interface PaytSubscription {
  code: string;
  plan_name: string;
  charges: number; // Número de cobranças já realizadas
  periodicity: '7 day' | '15 day' | '1 month' | '2 month' | '3 month' | '6 month' | '1 year';
  next_charge_at: string;
  status: PaytSubscriptionStatus;
  started_at: string;
}

export interface PaytCommission {
  name: string;
  email: string;
  type: 'platform' | 'producer' | 'affiliate';
  amount: number; // em centavos
}

export interface PaytLink {
  title: string;
  url: string;
  admin_url?: string;
  available_coupons?: PaytCoupon[];
  sources?: Record<string, string>;
  query_params?: Record<string, string>;
  seller_email?: string;
}

export interface PaytCoupon {
  code: string;
  method: 'number' | 'percentage';
  amount: number;
  min_price: number;
  expires_at: string;
}

export type PaytPostbackStatus = 
  | 'waiting_payment'
  | 'paid'
  | 'billed'
  | 'separation'
  | 'collected'
  | 'shipping'
  | 'shipped'
  | 'canceled'
  | 'lost_cart'
  | 'subscription_canceled'
  | 'subscription_activated'
  | 'subscription_overdue'
  | 'subscription_reactivated'
  | 'subscription_renewed';

export type PaytPaymentStatus =
  | 'waiting_payment'
  | 'paid'
  | 'refused'
  | 'one_click_buy_refused'
  | 'canceled'
  | 'reprocessed'
  | 'chargeback_presented'
  | 'chargeback'
  | 'expired'
  | 'pending_refund'
  | 'one_click_buy_refunded'
  | 'refunded'
  | 'one_click_buy_refunded_partial'
  | 'refunded_partial';

export type PaytSubscriptionStatus =
  | 'active'
  | 'pending'
  | 'canceled_by_overdue'
  | 'overdue'
  | 'finished'
  | 'inactive'
  | 'canceled_by_customer'
  | 'canceled_by_tenant'
  | 'canceled_by_admin';

export interface PaytWebhookPayload {
  integration_key: string;
  transaction_id: string;
  seller_id: string;
  test: boolean;
  type: 'order' | 'upsell' | 'manual_upsell' | 'abandoned-cart' | 'cash_on_delivery';
  status: PaytPostbackStatus;
  tangible: boolean;
  cart_recovered?: boolean;
  cart_id: string;
  upsell_code?: string;
  shipping?: PaytShipping;
  customer: PaytCustomer;
  product: PaytProduct;
  order_bumps?: PaytOrderBump[];
  link: PaytLink;
  transaction: PaytTransaction;
  subscription?: PaytSubscription;
  commission?: PaytCommission[];
  started_at: string;
  updated_at: string;
}

export interface PaytShipping {
  price: number;
  status: string;
  service: string;
  tracking_code?: string;
  tracking_url?: string;
  address: PaytAddress;
}

export interface PaytOrderBump {
  name: string;
  code: string;
  product: PaytProduct;
}

// Mapeamento de produtos da Payt para planos do FitPrime
// Você precisará criar os produtos na Payt e atualizar esses códigos
export const PAYT_PLAN_MAPPING: Record<string, {
  planId: string;
  planName: string;
  price: number;
  maxStudents: number;
  isAnnual: boolean;
}> = {
  // Planos Mensais
  'FITPRIME_BEGINNER': { planId: 'beginner', planName: 'Beginner', price: 3990, maxStudents: 5, isAnnual: false },
  'FITPRIME_STARTER': { planId: 'starter', planName: 'Starter', price: 9700, maxStudents: 15, isAnnual: false },
  'FITPRIME_PRO': { planId: 'pro', planName: 'Pro', price: 14700, maxStudents: 30, isAnnual: false },
  'FITPRIME_BUSINESS': { planId: 'business', planName: 'Business', price: 19700, maxStudents: 50, isAnnual: false },
  'FITPRIME_PREMIUM': { planId: 'premium', planName: 'Premium', price: 29700, maxStudents: 100, isAnnual: false },
  'FITPRIME_ENTERPRISE': { planId: 'enterprise', planName: 'Enterprise', price: 49700, maxStudents: 999999, isAnnual: false },
  
  // Planos Anuais (20% desconto)
  'FITPRIME_STARTER_ANUAL': { planId: 'starter', planName: 'Starter Anual', price: 93200, maxStudents: 18, isAnnual: true },
  'FITPRIME_PRO_ANUAL': { planId: 'pro', planName: 'Pro Anual', price: 141100, maxStudents: 36, isAnnual: true },
  'FITPRIME_BUSINESS_ANUAL': { planId: 'business', planName: 'Business Anual', price: 189100, maxStudents: 60, isAnnual: true },
  'FITPRIME_PREMIUM_ANUAL': { planId: 'premium', planName: 'Premium Anual', price: 285100, maxStudents: 120, isAnnual: true },
  'FITPRIME_ENTERPRISE_ANUAL': { planId: 'enterprise', planName: 'Enterprise Anual', price: 477100, maxStudents: 999999, isAnnual: true },
};

/**
 * Valida se o webhook é legítimo comparando a integration_key
 */
export function validatePaytWebhook(payload: PaytWebhookPayload, expectedKey: string): boolean {
  return payload.integration_key === expectedKey;
}

/**
 * Extrai informações do plano baseado no produto
 */
export function getPlanFromProduct(productCode: string): typeof PAYT_PLAN_MAPPING[string] | null {
  return PAYT_PLAN_MAPPING[productCode] || null;
}

/**
 * Verifica se é a primeira cobrança da assinatura (para comissão de afiliado)
 */
export function isFirstCharge(subscription?: PaytSubscription): boolean {
  if (!subscription) return true; // Compra única
  return subscription.charges === 1;
}

/**
 * Calcula a comissão do afiliado (apenas no primeiro pagamento)
 */
export function calculateAffiliateCommission(
  payload: PaytWebhookPayload,
  commissionPercentage: number = 100 // 100% do primeiro pagamento
): number {
  // Só paga comissão no primeiro pagamento
  if (!isFirstCharge(payload.subscription)) {
    return 0;
  }

  // Encontra a comissão do afiliado
  const affiliateCommission = payload.commission?.find(c => c.type === 'affiliate');
  if (affiliateCommission) {
    return affiliateCommission.amount;
  }

  // Se não tem comissão definida, calcula baseado no percentual
  return Math.round(payload.transaction.total_price * (commissionPercentage / 100));
}

/**
 * Formata o valor de centavos para reais
 */
export function formatCentsToReais(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
}

/**
 * Extrai dados do cliente para criação de conta
 */
export function extractCustomerData(customer: PaytCustomer): {
  name: string;
  email: string;
  phone: string;
  cpf: string;
} {
  return {
    name: customer.name,
    email: customer.fake_email ? '' : customer.email,
    phone: customer.phone,
    cpf: customer.doc,
  };
}
