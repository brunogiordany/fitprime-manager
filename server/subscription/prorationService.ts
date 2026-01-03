/**
 * FitPrime Manager - Serviço de Proration (Upgrade Proporcional)
 * 
 * Calcula o valor proporcional a ser cobrado quando o usuário faz upgrade
 * de plano no meio do período de assinatura.
 */

import { PLANS, type Plan } from "../../shared/plans";

export type BillingPeriod = 'monthly' | 'annual';

export interface ProrationCalculation {
  currentPlan: Plan;
  newPlan: Plan;
  billingPeriod: BillingPeriod;
  
  // Valores do período atual
  currentPlanPrice: number; // Preço do plano atual (mensal ou anual total)
  newPlanPrice: number; // Preço do novo plano (mensal ou anual total)
  priceDifference: number; // Diferença de preço entre os planos
  
  // Tempo restante
  daysRemaining: number; // Dias restantes no período atual
  totalDaysInPeriod: number; // Total de dias no período (30 para mensal, 365 para anual)
  percentageRemaining: number; // Porcentagem do período restante (0-1)
  
  // Valor a cobrar
  prorationAmount: number; // Valor proporcional a cobrar pelo upgrade
  
  // Informações adicionais
  effectiveDate: Date; // Data de início do novo plano
  currentPeriodEnd: Date; // Data de término do período atual
  
  // Benefícios do upgrade
  additionalStudents: number; // Alunos adicionais que ganha com upgrade
  newStudentLimit: number; // Novo limite de alunos
}

/**
 * Calcula o proration para upgrade de plano
 */
export function calculateProration(
  currentPlanId: string,
  newPlanId: string,
  billingPeriod: BillingPeriod,
  subscriptionStartDate: Date,
  currentPeriodEnd?: Date
): ProrationCalculation | null {
  const currentPlan = PLANS[currentPlanId];
  const newPlan = PLANS[newPlanId];
  
  if (!currentPlan || !newPlan) {
    return null;
  }
  
  // Não permite downgrade via proration
  if (newPlan.price <= currentPlan.price) {
    return null;
  }
  
  const now = new Date();
  
  // Calcular período total e dias restantes
  const totalDaysInPeriod = billingPeriod === 'annual' ? 365 : 30;
  
  // Se não temos a data de fim do período, calcular baseado na data de início
  let periodEnd: Date;
  if (currentPeriodEnd) {
    periodEnd = new Date(currentPeriodEnd);
  } else {
    periodEnd = new Date(subscriptionStartDate);
    if (billingPeriod === 'annual') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }
  }
  
  // Calcular dias restantes
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysRemaining = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / msPerDay));
  const percentageRemaining = daysRemaining / totalDaysInPeriod;
  
  // Preços baseados no período
  const currentPlanPrice = billingPeriod === 'annual' ? currentPlan.annualPrice : currentPlan.price;
  const newPlanPrice = billingPeriod === 'annual' ? newPlan.annualPrice : newPlan.price;
  const priceDifference = newPlanPrice - currentPlanPrice;
  
  // Calcular valor proporcional
  // Fórmula: (Diferença de preço) × (Porcentagem do período restante)
  const prorationAmount = Math.round(priceDifference * percentageRemaining * 100) / 100;
  
  // Limites de alunos baseados no período
  const currentStudentLimit = billingPeriod === 'annual' ? currentPlan.annualStudentLimit : currentPlan.studentLimit;
  const newStudentLimit = billingPeriod === 'annual' ? newPlan.annualStudentLimit : newPlan.studentLimit;
  const additionalStudents = newStudentLimit - currentStudentLimit;
  
  return {
    currentPlan,
    newPlan,
    billingPeriod,
    currentPlanPrice,
    newPlanPrice,
    priceDifference,
    daysRemaining,
    totalDaysInPeriod,
    percentageRemaining,
    prorationAmount,
    effectiveDate: now,
    currentPeriodEnd: periodEnd,
    additionalStudents,
    newStudentLimit,
  };
}

/**
 * Formata o valor de proration para exibição
 */
export function formatProrationSummary(calculation: ProrationCalculation): string {
  const periodLabel = calculation.billingPeriod === 'annual' ? 'ano' : 'mês';
  const daysLabel = calculation.daysRemaining === 1 ? 'dia' : 'dias';
  
  return `Upgrade de ${calculation.currentPlan.name} para ${calculation.newPlan.name}:
- Diferença de plano: R$ ${calculation.priceDifference.toFixed(2)}/${periodLabel}
- Período restante: ${calculation.daysRemaining} ${daysLabel} (${Math.round(calculation.percentageRemaining * 100)}%)
- Valor proporcional: R$ ${calculation.prorationAmount.toFixed(2)}
- Alunos adicionais: +${calculation.additionalStudents} (novo limite: ${calculation.newStudentLimit})`;
}

/**
 * Gera descrição para o checkout do Cakto
 */
export function generateUpgradeDescription(calculation: ProrationCalculation): string {
  return `Upgrade ${calculation.currentPlan.name} → ${calculation.newPlan.name} (${calculation.daysRemaining} dias restantes)`;
}

/**
 * Valida se o upgrade é permitido
 */
export function validateUpgrade(
  currentPlanId: string,
  newPlanId: string,
  currentStudentCount: number
): { valid: boolean; reason?: string } {
  const currentPlan = PLANS[currentPlanId];
  const newPlan = PLANS[newPlanId];
  
  if (!currentPlan) {
    return { valid: false, reason: 'Plano atual não encontrado' };
  }
  
  if (!newPlan) {
    return { valid: false, reason: 'Novo plano não encontrado' };
  }
  
  if (newPlan.price <= currentPlan.price) {
    return { valid: false, reason: 'Não é possível fazer downgrade via proration. Entre em contato com o suporte.' };
  }
  
  // Verifica se o novo plano comporta os alunos atuais
  if (currentStudentCount > newPlan.studentLimit) {
    return { 
      valid: false, 
      reason: `O plano ${newPlan.name} suporta até ${newPlan.studentLimit} alunos. Você tem ${currentStudentCount} alunos ativos.` 
    };
  }
  
  return { valid: true };
}

/**
 * Lista todos os planos disponíveis para upgrade
 */
export function getAvailableUpgrades(
  currentPlanId: string,
  billingPeriod: BillingPeriod,
  subscriptionStartDate: Date,
  currentPeriodEnd?: Date
): ProrationCalculation[] {
  const currentPlan = PLANS[currentPlanId];
  if (!currentPlan) return [];
  
  const upgrades: ProrationCalculation[] = [];
  
  for (const [planId, plan] of Object.entries(PLANS)) {
    if (plan.price > currentPlan.price) {
      const calculation = calculateProration(
        currentPlanId,
        planId,
        billingPeriod,
        subscriptionStartDate,
        currentPeriodEnd
      );
      
      if (calculation) {
        upgrades.push(calculation);
      }
    }
  }
  
  // Ordenar por preço
  return upgrades.sort((a, b) => a.newPlan.price - b.newPlan.price);
}

/**
 * Interface para opções de upgrade completas (mensal e anual)
 */
export interface UpgradeOption {
  planId: string;
  planName: string;
  
  // Opção mensal
  monthly: {
    price: number;
    checkoutUrl: string;
    studentLimit: number;
    prorationAmount: number;
    priceDifference: number;
  };
  
  // Opção anual
  annual: {
    price: number;
    monthlyEquivalent: number;
    checkoutUrl: string;
    studentLimit: number;
    prorationAmount: number;
    priceDifference: number;
    savings: number; // Economia comparado ao mensal
  };
  
  additionalStudentsMonthly: number;
  additionalStudentsAnnual: number;
}

/**
 * Calcula todas as opções de upgrade disponíveis (mensal e anual)
 */
export function getAllUpgradeOptions(
  currentPlanId: string,
  currentBillingPeriod: BillingPeriod,
  subscriptionStartDate: Date,
  currentPeriodEnd?: Date
): UpgradeOption[] {
  const currentPlan = PLANS[currentPlanId];
  if (!currentPlan) return [];
  
  const options: UpgradeOption[] = [];
  const planOrder = ['starter', 'pro', 'business', 'premium', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlanId);
  
  // Pegar apenas planos superiores ao atual
  const availablePlans = planOrder.slice(currentIndex + 1);
  
  for (const planId of availablePlans) {
    const plan = PLANS[planId];
    if (!plan) continue;
    
    // Calcular proration para mensal
    const monthlyProration = calculateProration(
      currentPlanId,
      planId,
      'monthly',
      subscriptionStartDate,
      currentPeriodEnd
    );
    
    // Calcular proration para anual
    const annualProration = calculateProration(
      currentPlanId,
      planId,
      'annual',
      subscriptionStartDate,
      currentPeriodEnd
    );
    
    // Calcular economia anual
    const monthlyTotal = plan.price * 12;
    const annualSavings = monthlyTotal - plan.annualPrice;
    
    // Limites de alunos baseados no plano atual
    const currentMonthlyLimit = currentPlan.studentLimit;
    const currentAnnualLimit = currentPlan.annualStudentLimit;
    
    options.push({
      planId,
      planName: plan.name,
      monthly: {
        price: plan.price,
        checkoutUrl: plan.checkoutUrl,
        studentLimit: plan.studentLimit,
        prorationAmount: monthlyProration?.prorationAmount || 0,
        priceDifference: plan.price - currentPlan.price,
      },
      annual: {
        price: plan.annualPrice,
        monthlyEquivalent: plan.annualMonthlyPrice,
        checkoutUrl: plan.annualCheckoutUrl,
        studentLimit: plan.annualStudentLimit,
        prorationAmount: annualProration?.prorationAmount || 0,
        priceDifference: plan.annualPrice - currentPlan.annualPrice,
        savings: annualSavings,
      },
      additionalStudentsMonthly: plan.studentLimit - currentMonthlyLimit,
      additionalStudentsAnnual: plan.annualStudentLimit - currentAnnualLimit,
    });
  }
  
  return options;
}

/**
 * Gera URL de checkout do Cakto com parâmetros de upgrade
 */
export function generateUpgradeCheckoutUrl(
  plan: Plan,
  isAnnual: boolean,
  customerEmail?: string,
  customerName?: string
): string {
  const baseUrl = isAnnual ? plan.annualCheckoutUrl : plan.checkoutUrl;
  const params = new URLSearchParams();
  
  if (customerEmail) {
    params.set('email', customerEmail);
  }
  if (customerName) {
    params.set('name', customerName);
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}
