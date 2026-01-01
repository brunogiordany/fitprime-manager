import { describe, it, expect } from 'vitest';

// Função de verificação de assinatura (extraída do router para teste)
function isSubscriptionValid(personal: { 
  subscriptionStatus: string; 
  subscriptionExpiresAt: Date | null 
}): { valid: boolean; daysOverdue: number; status: string } {
  // Trial sempre é válido
  if (personal.subscriptionStatus === 'trial') {
    return { valid: true, daysOverdue: 0, status: 'trial' };
  }
  
  // Cancelado ou expirado
  if (personal.subscriptionStatus === 'cancelled' || personal.subscriptionStatus === 'expired') {
    return { valid: false, daysOverdue: 999, status: personal.subscriptionStatus };
  }
  
  // Verificar data de expiração com 1 dia de tolerância
  if (personal.subscriptionExpiresAt) {
    const now = new Date();
    const expiresAt = new Date(personal.subscriptionExpiresAt);
    const gracePeriodEnd = new Date(expiresAt);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 1); // 1 dia de tolerância
    
    if (now > gracePeriodEnd) {
      const daysOverdue = Math.floor((now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24));
      return { valid: false, daysOverdue, status: 'overdue' };
    }
  }
  
  return { valid: true, daysOverdue: 0, status: 'active' };
}

describe('Payment Status Verification', () => {
  it('should allow access for trial status', () => {
    const personal = {
      subscriptionStatus: 'trial',
      subscriptionExpiresAt: null
    };
    
    const result = isSubscriptionValid(personal);
    
    expect(result.valid).toBe(true);
    expect(result.status).toBe('trial');
    expect(result.daysOverdue).toBe(0);
  });

  it('should block access for cancelled status', () => {
    const personal = {
      subscriptionStatus: 'cancelled',
      subscriptionExpiresAt: new Date()
    };
    
    const result = isSubscriptionValid(personal);
    
    expect(result.valid).toBe(false);
    expect(result.status).toBe('cancelled');
  });

  it('should block access for expired status', () => {
    const personal = {
      subscriptionStatus: 'expired',
      subscriptionExpiresAt: new Date()
    };
    
    const result = isSubscriptionValid(personal);
    
    expect(result.valid).toBe(false);
    expect(result.status).toBe('expired');
  });

  it('should allow access during 1 day grace period', () => {
    // Expirou há 12 horas (ainda dentro do período de tolerância)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() - 12);
    
    const personal = {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: expiresAt
    };
    
    const result = isSubscriptionValid(personal);
    
    expect(result.valid).toBe(true);
    expect(result.status).toBe('active');
  });

  it('should block access after 1 day grace period', () => {
    // Expirou há 2 dias (fora do período de tolerância)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() - 2);
    
    const personal = {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: expiresAt
    };
    
    const result = isSubscriptionValid(personal);
    
    expect(result.valid).toBe(false);
    expect(result.status).toBe('overdue');
    expect(result.daysOverdue).toBe(2);
  });

  it('should allow access for active subscription not expired', () => {
    // Expira em 30 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    const personal = {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: expiresAt
    };
    
    const result = isSubscriptionValid(personal);
    
    expect(result.valid).toBe(true);
    expect(result.status).toBe('active');
    expect(result.daysOverdue).toBe(0);
  });

  it('should calculate correct days overdue', () => {
    // Expirou há 5 dias
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() - 5);
    
    const personal = {
      subscriptionStatus: 'active',
      subscriptionExpiresAt: expiresAt
    };
    
    const result = isSubscriptionValid(personal);
    
    expect(result.valid).toBe(false);
    expect(result.daysOverdue).toBe(5);
  });
});
