/**
 * Testes do Webhook Cakto - Integração com Personal Subscriptions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PLANS } from '../../shared/plans';

// Mock do módulo db
vi.mock('../db', () => ({
  getUserByEmail: vi.fn(),
  updateUserSubscription: vi.fn(),
  getPersonalByUserId: vi.fn(),
  getPersonalSubscription: vi.fn(),
  createPersonalSubscription: vi.fn(),
  updatePersonalSubscriptionFull: vi.fn(),
  createPendingActivation: vi.fn(),
}));

// Mock do módulo email
vi.mock('../email', () => ({
  sendPurchaseActivationEmail: vi.fn(),
}));

// Importar funções auxiliares do webhook (precisamos exportá-las para testar)
// Por enquanto, vamos testar a lógica de mapeamento

describe('Cakto Webhook - Plan Mapping', () => {
  const CAKTO_OFFER_TO_PLAN: Record<string, { planId: string; isAnnual: boolean }> = {
    // Planos mensais
    "32rof96": { planId: "starter", isAnnual: false },
    "onb2wr2": { planId: "pro", isAnnual: false },
    "zh3rnh6": { planId: "business", isAnnual: false },
    "kbevbfw": { planId: "premium", isAnnual: false },
    "apzipd3": { planId: "enterprise", isAnnual: false },
    // Planos anuais
    "starter_anual": { planId: "starter", isAnnual: true },
    "pro_anual": { planId: "pro", isAnnual: true },
    "business_anual": { planId: "business", isAnnual: true },
    "premium_anual": { planId: "premium", isAnnual: true },
    "enterprise_anual": { planId: "enterprise", isAnnual: true },
  };

  describe('Offer ID Mapping', () => {
    it('deve mapear offer ID mensal do Starter corretamente', () => {
      const mapping = CAKTO_OFFER_TO_PLAN["32rof96"];
      expect(mapping).toBeDefined();
      expect(mapping.planId).toBe("starter");
      expect(mapping.isAnnual).toBe(false);
    });

    it('deve mapear offer ID mensal do Pro corretamente', () => {
      const mapping = CAKTO_OFFER_TO_PLAN["onb2wr2"];
      expect(mapping).toBeDefined();
      expect(mapping.planId).toBe("pro");
      expect(mapping.isAnnual).toBe(false);
    });

    it('deve mapear offer ID anual do Starter corretamente', () => {
      const mapping = CAKTO_OFFER_TO_PLAN["starter_anual"];
      expect(mapping).toBeDefined();
      expect(mapping.planId).toBe("starter");
      expect(mapping.isAnnual).toBe(true);
    });

    it('deve mapear offer ID anual do Business corretamente', () => {
      const mapping = CAKTO_OFFER_TO_PLAN["business_anual"];
      expect(mapping).toBeDefined();
      expect(mapping.planId).toBe("business");
      expect(mapping.isAnnual).toBe(true);
    });
  });

  describe('Period Calculation', () => {
    function calculatePeriodDates(isAnnual: boolean): { start: Date; end: Date } {
      const now = new Date();
      const start = new Date(now);
      const end = new Date(now);
      
      if (isAnnual) {
        end.setFullYear(end.getFullYear() + 1);
      } else {
        end.setMonth(end.getMonth() + 1);
      }
      
      return { start, end };
    }

    it('deve calcular período mensal corretamente', () => {
      const { start, end } = calculatePeriodDates(false);
      
      // Período deve ser de aproximadamente 30 dias
      const diffMs = end.getTime() - start.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      expect(diffDays).toBeGreaterThanOrEqual(28);
      expect(diffDays).toBeLessThanOrEqual(31);
    });

    it('deve calcular período anual corretamente', () => {
      const { start, end } = calculatePeriodDates(true);
      
      // Período deve ser de aproximadamente 365 dias
      const diffMs = end.getTime() - start.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      expect(diffDays).toBeGreaterThanOrEqual(365);
      expect(diffDays).toBeLessThanOrEqual(366);
    });
  });

  describe('Plan Configuration', () => {
    it('deve ter todos os planos configurados corretamente', () => {
      expect(PLANS.starter).toBeDefined();
      expect(PLANS.pro).toBeDefined();
      expect(PLANS.business).toBeDefined();
      expect(PLANS.premium).toBeDefined();
      expect(PLANS.enterprise).toBeDefined();
    });

    it('deve ter preços anuais com 20% de desconto', () => {
      const starter = PLANS.starter;
      const expectedAnnualPrice = Math.round(starter.price * 12 * 0.8);
      
      // Permitir margem de erro de R$5
      expect(Math.abs(starter.annualPrice - expectedAnnualPrice)).toBeLessThan(5);
    });

    it('deve ter limites de alunos anuais 20% maiores', () => {
      const starter = PLANS.starter;
      const expectedAnnualLimit = Math.round(starter.studentLimit * 1.2);
      
      expect(starter.annualStudentLimit).toBe(expectedAnnualLimit);
    });
  });

  describe('Subscription Data Structure', () => {
    it('deve criar estrutura de subscription correta para plano mensal', () => {
      const planId = 'starter';
      const isAnnual = false;
      const plan = PLANS[planId];
      
      const subscriptionData = {
        planId: `fitprime_br_${planId}`,
        planName: plan.name,
        studentLimit: isAnnual ? plan.annualStudentLimit : plan.studentLimit,
        planPrice: isAnnual ? plan.annualPrice : plan.price,
        extraStudentPrice: plan.extraStudentPrice,
        status: 'active' as const,
        billingPeriod: isAnnual ? 'annual' : 'monthly',
      };
      
      expect(subscriptionData.planId).toBe('fitprime_br_starter');
      expect(subscriptionData.planName).toBe('Starter');
      expect(subscriptionData.studentLimit).toBe(15);
      expect(subscriptionData.planPrice).toBe(97);
      expect(subscriptionData.billingPeriod).toBe('monthly');
    });

    it('deve criar estrutura de subscription correta para plano anual', () => {
      const planId = 'pro';
      const isAnnual = true;
      const plan = PLANS[planId];
      
      const subscriptionData = {
        planId: `fitprime_br_${planId}`,
        planName: plan.name,
        studentLimit: isAnnual ? plan.annualStudentLimit : plan.studentLimit,
        planPrice: isAnnual ? plan.annualPrice : plan.price,
        extraStudentPrice: plan.extraStudentPrice,
        status: 'active' as const,
        billingPeriod: isAnnual ? 'annual' : 'monthly',
      };
      
      expect(subscriptionData.planId).toBe('fitprime_br_pro');
      expect(subscriptionData.planName).toBe('Pro');
      expect(subscriptionData.studentLimit).toBe(30); // 25 * 1.2
      expect(subscriptionData.planPrice).toBe(1411);
      expect(subscriptionData.billingPeriod).toBe('annual');
    });
  });
});
