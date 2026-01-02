import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateExtraCharges,
  formatExtraCharges,
  shouldRecommendUpgrade,
  getUpgradeSuggestion,
  generateExtraChargesReport,
  PLAN_LIMITS,
} from './extraChargesService';

describe('Extra Charges Service', () => {
  describe('calculateExtraCharges', () => {
    it('deve calcular sem alunos excedentes', () => {
      const result = calculateExtraCharges('starter', 10);
      
      expect(result.currentStudents).toBe(10);
      expect(result.studentLimit).toBe(15);
      expect(result.extraStudents).toBe(0);
      expect(result.totalExtraCharge).toBe(0);
      expect(result.accumulatedCharge).toBe(0);
    });

    it('deve calcular com alunos excedentes', () => {
      const result = calculateExtraCharges('starter', 20);
      
      expect(result.currentStudents).toBe(20);
      expect(result.studentLimit).toBe(15);
      expect(result.extraStudents).toBe(5);
      expect(result.extraStudentPrice).toBe(6.47);
      expect(result.totalExtraCharge).toBeCloseTo(32.35, 2);
      expect(result.accumulatedCharge).toBeCloseTo(32.35, 2);
    });

    it('deve acumular cobranças', () => {
      const result = calculateExtraCharges('pro', 28, 50);
      
      expect(result.extraStudents).toBe(3);
      expect(result.extraStudentPrice).toBe(5.88);
      expect(result.totalExtraCharge).toBeCloseTo(17.64, 2);
      expect(result.accumulatedCharge).toBeCloseTo(67.64, 2);
    });

    it('deve lançar erro para plano inválido', () => {
      expect(() => calculateExtraCharges('invalid', 10)).toThrow();
    });

    it('deve funcionar com diferentes formatos de planId', () => {
      const result1 = calculateExtraCharges('STARTER', 20);
      const result2 = calculateExtraCharges('fitprime_br_starter', 20);
      const result3 = calculateExtraCharges('starter', 20);
      
      expect(result1.extraStudents).toBe(result2.extraStudents);
      expect(result2.extraStudents).toBe(result3.extraStudents);
    });

    it('deve calcular próxima data de cobrança', () => {
      const result = calculateExtraCharges('starter', 20);
      const now = new Date();
      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() + 30);
      
      // Verificar se está dentro de 1 minuto
      const diff = Math.abs(result.nextBillingDate.getTime() - expectedDate.getTime());
      expect(diff).toBeLessThan(60000);
    });
  });

  describe('formatExtraCharges', () => {
    it('deve formatar sem alunos excedentes', () => {
      const calculation = calculateExtraCharges('starter', 10);
      const formatted = formatExtraCharges(calculation);
      
      expect(formatted).toContain('✅');
      expect(formatted).toContain('10/15');
    });

    it('deve formatar com alunos excedentes', () => {
      const calculation = calculateExtraCharges('starter', 20);
      const formatted = formatExtraCharges(calculation);
      
      expect(formatted).toContain('⚠️');
      expect(formatted).toContain('5');
      expect(formatted).toContain('32.35');
    });
  });

  describe('shouldRecommendUpgrade', () => {
    it('não deve recomendar upgrade com poucos excedentes', () => {
      const calculation = calculateExtraCharges('starter', 16);
      const shouldUpgrade = shouldRecommendUpgrade(calculation, 97);
      
      expect(shouldUpgrade).toBe(false);
    });

    it('deve recomendar upgrade com muitos excedentes', () => {
      const calculation = calculateExtraCharges('starter', 18);
      const shouldUpgrade = shouldRecommendUpgrade(calculation, 97);
      
      expect(shouldUpgrade).toBe(true);
    });

    it('deve recomendar upgrade se cobrança > 50% do plano', () => {
      const calculation = calculateExtraCharges('starter', 30, 0);
      const shouldUpgrade = shouldRecommendUpgrade(calculation, 97);
      
      expect(shouldUpgrade).toBe(true);
    });
  });

  describe('getUpgradeSuggestion', () => {
    it('deve sugerir upgrade para próximo plano', () => {
      const calculation = calculateExtraCharges('starter', 20);
      const suggestion = getUpgradeSuggestion('starter', calculation);
      
      expect(suggestion).not.toBeNull();
      expect(suggestion?.nextPlanId).toBe('pro');
    });

    it('deve calcular economia do upgrade', () => {
      const calculation = calculateExtraCharges('starter', 20);
      const suggestion = getUpgradeSuggestion('starter', calculation);
      
      // Com 20 alunos no Pro (limite 25), não há excedentes
      expect(suggestion?.savings).toBeGreaterThan(0);
    });

    it('não deve sugerir upgrade para Enterprise', () => {
      const calculation = calculateExtraCharges('enterprise', 160);
      const suggestion = getUpgradeSuggestion('enterprise', calculation);
      
      expect(suggestion).toBeNull();
    });

    it('não deve sugerir upgrade para plano inválido', () => {
      const calculation = calculateExtraCharges('starter', 20);
      const suggestion = getUpgradeSuggestion('invalid', calculation);
      
      expect(suggestion).toBeNull();
    });
  });

  describe('generateExtraChargesReport', () => {
    it('deve gerar relatório sem excedentes', () => {
      const report = generateExtraChargesReport(1, 'starter', 10, 0, 97);
      
      expect(report.summary).toContain('✅');
      expect(report.recommendation).toContain('dentro do limite');
      expect(report.nextSteps.length).toBeGreaterThan(0);
    });

    it('deve gerar relatório com excedentes', () => {
      const report = generateExtraChargesReport(1, 'starter', 20, 0, 97);
      
      expect(report.summary).toContain('⚠️');
      expect(report.nextSteps.length).toBeGreaterThan(0);
    });

    it('deve recomendar upgrade quando apropriado', () => {
      const report = generateExtraChargesReport(1, 'starter', 18, 0, 97);
      
      expect(report.recommendation).toContain('⭐');
      expect(report.recommendation).toContain('UPGRADE');
    });
  });

  describe('PLAN_LIMITS', () => {
    it('deve ter todos os planos configurados', () => {
      expect(PLAN_LIMITS.starter).toBeDefined();
      expect(PLAN_LIMITS.pro).toBeDefined();
      expect(PLAN_LIMITS.business).toBeDefined();
      expect(PLAN_LIMITS.premium).toBeDefined();
      expect(PLAN_LIMITS.enterprise).toBeDefined();
    });

    it('deve ter limites crescentes', () => {
      expect(PLAN_LIMITS.starter.limit).toBeLessThan(PLAN_LIMITS.pro.limit);
      expect(PLAN_LIMITS.pro.limit).toBeLessThan(PLAN_LIMITS.business.limit);
      expect(PLAN_LIMITS.business.limit).toBeLessThan(PLAN_LIMITS.premium.limit);
      expect(PLAN_LIMITS.premium.limit).toBeLessThan(PLAN_LIMITS.enterprise.limit);
    });

    it('deve ter preços decrescentes por aluno extra', () => {
      expect(PLAN_LIMITS.starter.extraPrice).toBeGreaterThan(PLAN_LIMITS.pro.extraPrice);
      expect(PLAN_LIMITS.pro.extraPrice).toBeGreaterThan(PLAN_LIMITS.business.extraPrice);
      expect(PLAN_LIMITS.business.extraPrice).toBeGreaterThan(PLAN_LIMITS.premium.extraPrice);
      expect(PLAN_LIMITS.premium.extraPrice).toBeGreaterThan(PLAN_LIMITS.enterprise.extraPrice);
    });

    it('deve ter preços corretos conforme estratégia', () => {
      expect(PLAN_LIMITS.starter.limit).toBe(15);
      expect(PLAN_LIMITS.starter.extraPrice).toBe(6.47);
      
      expect(PLAN_LIMITS.pro.limit).toBe(25);
      expect(PLAN_LIMITS.pro.extraPrice).toBe(5.88);
      
      expect(PLAN_LIMITS.business.limit).toBe(40);
      expect(PLAN_LIMITS.business.extraPrice).toBe(4.93);
      
      expect(PLAN_LIMITS.premium.limit).toBe(70);
      expect(PLAN_LIMITS.premium.extraPrice).toBe(4.24);
      
      expect(PLAN_LIMITS.enterprise.limit).toBe(150);
      expect(PLAN_LIMITS.enterprise.extraPrice).toBe(3.31);
    });
  });
});
