/**
 * Testes para o sistema de Trial e Acesso de Teste
 * 
 * Cenários testados:
 * 1. Trial de 1 dia para novos usuários
 * 2. Acesso de teste de 30 dias (liberado pelo owner)
 * 3. Assinatura ativa
 * 4. Assinatura expirada/cancelada
 */

import { describe, it, expect } from 'vitest';

// Função de validação de assinatura (copiada do routers.ts para teste isolado)
function isSubscriptionValid(personal: { 
  subscriptionStatus: string; 
  subscriptionExpiresAt: Date | null;
  trialEndsAt?: Date | null;
  testAccessEndsAt?: Date | null;
  createdAt?: Date | null;
}): { valid: boolean; daysOverdue: number } {
  const now = new Date();
  
  // 1. Verificar acesso de teste (liberado pelo owner - 30 dias)
  if (personal.testAccessEndsAt) {
    const testEndsAt = new Date(personal.testAccessEndsAt);
    if (now <= testEndsAt) {
      return { valid: true, daysOverdue: 0 };
    }
  }
  
  // 2. Verificar trial de 1 dia (novos usuários)
  if (personal.subscriptionStatus === 'trial') {
    // Verificar se tem data de término do trial
    if (personal.trialEndsAt) {
      const trialEndsAt = new Date(personal.trialEndsAt);
      if (now <= trialEndsAt) {
        return { valid: true, daysOverdue: 0 };
      } else {
        // Trial expirou
        const daysOverdue = Math.floor((now.getTime() - trialEndsAt.getTime()) / (1000 * 60 * 60 * 24));
        return { valid: false, daysOverdue };
      }
    }
    // Trial sem data definida (legado) - considerar válido por 1 dia a partir do cadastro
    if (personal.createdAt) {
      const createdAt = new Date(personal.createdAt);
      const trialEnd = new Date(createdAt);
      trialEnd.setDate(trialEnd.getDate() + 1); // 1 dia de trial
      
      if (now <= trialEnd) {
        return { valid: true, daysOverdue: 0 };
      } else {
        const daysOverdue = Math.floor((now.getTime() - trialEnd.getTime()) / (1000 * 60 * 60 * 24));
        return { valid: false, daysOverdue };
      }
    }
    // Fallback: trial sem data de criação - considerar válido
    return { valid: true, daysOverdue: 0 };
  }
  
  // 3. Cancelado ou expirado
  if (personal.subscriptionStatus === 'cancelled' || personal.subscriptionStatus === 'expired') {
    return { valid: false, daysOverdue: 999 };
  }
  
  // 4. Verificar data de expiração com 1 dia de tolerância (assinatura ativa)
  if (personal.subscriptionExpiresAt) {
    const expiresAt = new Date(personal.subscriptionExpiresAt);
    const gracePeriodEnd = new Date(expiresAt);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 1); // 1 dia de tolerância
    
    if (now > gracePeriodEnd) {
      const daysOverdue = Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24));
      return { valid: false, daysOverdue };
    }
  }
  
  return { valid: true, daysOverdue: 0 };
}

describe('Sistema de Trial e Acesso de Teste', () => {
  describe('Trial de 1 dia', () => {
    it('deve ser válido para usuário criado há menos de 1 dia', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 horas atrás
      
      const personal = {
        subscriptionStatus: 'trial',
        subscriptionExpiresAt: null,
        trialEndsAt: null,
        testAccessEndsAt: null,
        createdAt,
      };
      
      const result = isSubscriptionValid(personal);
      expect(result.valid).toBe(true);
      expect(result.daysOverdue).toBe(0);
    });
    
    it('deve ser inválido para usuário criado há mais de 1 dia', () => {
      const now = new Date();
      const createdAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 dias atrás
      
      const personal = {
        subscriptionStatus: 'trial',
        subscriptionExpiresAt: null,
        trialEndsAt: null,
        testAccessEndsAt: null,
        createdAt,
      };
      
      const result = isSubscriptionValid(personal);
      expect(result.valid).toBe(false);
      expect(result.daysOverdue).toBeGreaterThanOrEqual(2);
    });
    
    it('deve usar trialEndsAt quando definido', () => {
      const now = new Date();
      const trialEndsAt = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 horas no futuro
      
      const personal = {
        subscriptionStatus: 'trial',
        subscriptionExpiresAt: null,
        trialEndsAt,
        testAccessEndsAt: null,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás (seria inválido sem trialEndsAt)
      };
      
      const result = isSubscriptionValid(personal);
      expect(result.valid).toBe(true);
      expect(result.daysOverdue).toBe(0);
    });
  });
  
  describe('Acesso de Teste (30 dias)', () => {
    it('deve ser válido quando testAccessEndsAt está no futuro', () => {
      const now = new Date();
      const testAccessEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias no futuro
      
      const personal = {
        subscriptionStatus: 'trial', // mesmo com trial expirado
        subscriptionExpiresAt: null,
        trialEndsAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // trial expirado há 10 dias
        testAccessEndsAt,
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      };
      
      const result = isSubscriptionValid(personal);
      expect(result.valid).toBe(true);
      expect(result.daysOverdue).toBe(0);
    });
    
    it('deve ser inválido quando testAccessEndsAt expirou', () => {
      const now = new Date();
      const testAccessEndsAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 dias atrás
      
      const personal = {
        subscriptionStatus: 'trial',
        subscriptionExpiresAt: null,
        trialEndsAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // trial expirado há 10 dias
        testAccessEndsAt,
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      };
      
      const result = isSubscriptionValid(personal);
      expect(result.valid).toBe(false);
    });
    
    it('acesso de teste deve ter prioridade sobre trial expirado', () => {
      const now = new Date();
      
      const personal = {
        subscriptionStatus: 'trial',
        subscriptionExpiresAt: null,
        trialEndsAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // trial expirado há 30 dias
        testAccessEndsAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // acesso teste válido por mais 15 dias
        createdAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000),
      };
      
      const result = isSubscriptionValid(personal);
      expect(result.valid).toBe(true);
      expect(result.daysOverdue).toBe(0);
    });
  });
  
  describe('Assinatura Ativa', () => {
    it('deve ser válido quando assinatura está ativa e não expirou', () => {
      const now = new Date();
      const subscriptionExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias no futuro
      
      const personal = {
        subscriptionStatus: 'active',
        subscriptionExpiresAt,
        trialEndsAt: null,
        testAccessEndsAt: null,
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      };
      
      const result = isSubscriptionValid(personal);
      expect(result.valid).toBe(true);
      expect(result.daysOverdue).toBe(0);
    });
    
    it('deve ter 1 dia de tolerância após expiração', () => {
      const now = new Date();
      const subscriptionExpiresAt = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 horas atrás (dentro do período de tolerância)
      
      const personal = {
        subscriptionStatus: 'active',
        subscriptionExpiresAt,
        trialEndsAt: null,
        testAccessEndsAt: null,
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      };
      
      const result = isSubscriptionValid(personal);
      expect(result.valid).toBe(true);
      expect(result.daysOverdue).toBe(0);
    });
    
    it('deve ser inválido após período de tolerância', () => {
      const now = new Date();
      const subscriptionExpiresAt = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 dias atrás
      
      const personal = {
        subscriptionStatus: 'active',
        subscriptionExpiresAt,
        trialEndsAt: null,
        testAccessEndsAt: null,
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      };
      
      const result = isSubscriptionValid(personal);
      expect(result.valid).toBe(false);
      expect(result.daysOverdue).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('Assinatura Cancelada/Expirada', () => {
    it('deve ser inválido quando status é cancelled', () => {
      const personal = {
        subscriptionStatus: 'cancelled',
        subscriptionExpiresAt: null,
        trialEndsAt: null,
        testAccessEndsAt: null,
        createdAt: new Date(),
      };
      
      const result = isSubscriptionValid(personal);
      expect(result.valid).toBe(false);
      expect(result.daysOverdue).toBe(999);
    });
    
    it('deve ser inválido quando status é expired', () => {
      const personal = {
        subscriptionStatus: 'expired',
        subscriptionExpiresAt: null,
        trialEndsAt: null,
        testAccessEndsAt: null,
        createdAt: new Date(),
      };
      
      const result = isSubscriptionValid(personal);
      expect(result.valid).toBe(false);
      expect(result.daysOverdue).toBe(999);
    });
    
    it('acesso de teste deve sobrescrever status cancelado', () => {
      const now = new Date();
      
      const personal = {
        subscriptionStatus: 'cancelled',
        subscriptionExpiresAt: null,
        trialEndsAt: null,
        testAccessEndsAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // acesso teste válido
        createdAt: new Date(),
      };
      
      const result = isSubscriptionValid(personal);
      expect(result.valid).toBe(true);
      expect(result.daysOverdue).toBe(0);
    });
  });
});
