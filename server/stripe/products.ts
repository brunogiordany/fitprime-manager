// Definição de produtos e preços do Stripe para o FitPrime Manager
// Os produtos são criados dinamicamente baseados nos planos cadastrados pelo personal

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  priceId?: string;
  price: number; // em centavos
  currency: string;
  interval?: 'day' | 'week' | 'month' | 'year';
  intervalCount?: number;
  type: 'one_time' | 'recurring';
}

// Mapeamento de ciclos de cobrança para intervalos do Stripe
export const billingCycleToStripeInterval = {
  weekly: { interval: 'week' as const, intervalCount: 1 },
  biweekly: { interval: 'week' as const, intervalCount: 2 },
  monthly: { interval: 'month' as const, intervalCount: 1 },
  quarterly: { interval: 'month' as const, intervalCount: 3 },
  semiannual: { interval: 'month' as const, intervalCount: 6 },
  annual: { interval: 'year' as const, intervalCount: 1 },
};

// Função para converter preço em reais para centavos
export function priceToCents(price: number): number {
  return Math.round(price * 100);
}

// Função para converter centavos para reais
export function centsToPrice(cents: number): number {
  return cents / 100;
}
