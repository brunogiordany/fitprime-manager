import { describe, it, expect, vi } from 'vitest';

// Mock the stripe module before importing
vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      customers: {
        create: vi.fn().mockResolvedValue({ id: 'cus_test123' }),
        list: vi.fn().mockResolvedValue({ data: [] }),
      },
      checkout: {
        sessions: {
          create: vi.fn().mockResolvedValue({ 
            id: 'cs_test123', 
            url: 'https://checkout.stripe.com/test' 
          }),
        },
      },
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue({
          id: 'sub_test123',
          status: 'active',
          current_period_end: 1735689600,
          cancel_at_period_end: false,
        }),
        cancel: vi.fn().mockResolvedValue({ id: 'sub_test123', status: 'canceled' }),
        update: vi.fn().mockResolvedValue({ id: 'sub_test123' }),
      },
      paymentLinks: {
        create: vi.fn().mockResolvedValue({ 
          id: 'plink_test123', 
          url: 'https://buy.stripe.com/test' 
        }),
      },
      products: {
        create: vi.fn().mockResolvedValue({ id: 'prod_test123' }),
      },
      prices: {
        create: vi.fn().mockResolvedValue({ id: 'price_test123' }),
      },
    })),
  };
});

describe('Stripe Integration', () => {
  describe('Price Conversion', () => {
    it('should convert price to cents correctly', async () => {
      const { priceToCents } = await import('./stripe/products');
      
      expect(priceToCents(100)).toBe(10000);
      expect(priceToCents(99.99)).toBe(9999);
      expect(priceToCents(0.01)).toBe(1);
      expect(priceToCents(1500.50)).toBe(150050);
    });
  });

  describe('Billing Cycle Mapping', () => {
    it('should map billing cycles to Stripe intervals', async () => {
      const { billingCycleToStripeInterval } = await import('./stripe/products');
      
      expect(billingCycleToStripeInterval.monthly).toEqual({ interval: 'month', intervalCount: 1 });
      expect(billingCycleToStripeInterval.weekly).toEqual({ interval: 'week', intervalCount: 1 });
      expect(billingCycleToStripeInterval.quarterly).toEqual({ interval: 'month', intervalCount: 3 });
      expect(billingCycleToStripeInterval.annual).toEqual({ interval: 'year', intervalCount: 1 });
    });
  });

  describe('Stripe Customer', () => {
    it('should create a new customer when none exists', async () => {
      const { getOrCreateStripeCustomer } = await import('./stripe');
      
      const customer = await getOrCreateStripeCustomer(
        'test@example.com',
        'Test User',
        { student_id: '123' }
      );
      
      expect(customer).toBeDefined();
      expect(customer.id).toBe('cus_test123');
    });
  });

  describe('Checkout Session', () => {
    it('should create a checkout session', async () => {
      const { createCheckoutSession } = await import('./stripe');
      
      const session = await createCheckoutSession({
        customerId: 'cus_test123',
        priceId: 'price_test123',
        mode: 'payment',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });
      
      expect(session).toBeDefined();
      expect(session.url).toBe('https://checkout.stripe.com/test');
    });
  });

  describe('Subscription Management', () => {
    it('should get subscription status', async () => {
      const { getSubscription } = await import('./stripe');
      
      const subscription = await getSubscription('sub_test123');
      
      expect(subscription).toBeDefined();
      expect(subscription.status).toBe('active');
    });

    it('should cancel subscription', async () => {
      const { cancelSubscription } = await import('./stripe');
      
      const result = await cancelSubscription('sub_test123', true);
      
      expect(result).toBeDefined();
    });
  });

  describe('Payment Link', () => {
    it('should create a payment link', async () => {
      const { createPaymentLink } = await import('./stripe');
      
      const link = await createPaymentLink({
        amount: 10000,
        description: 'Test Payment',
        metadata: { charge_id: '123' },
      });
      
      expect(link).toBeDefined();
      expect(link.url).toBe('https://buy.stripe.com/test');
    });
  });
});
