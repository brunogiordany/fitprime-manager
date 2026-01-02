/**
 * Extra Charges Service
 * 
 * Sistema de escalonamento de cobranças por aluno excedente
 * Segue a estratégia de precificação definida no documento
 * 
 * Planos:
 * - Starter: 15 alunos, R$ 6,47 por aluno extra
 * - Pro: 25 alunos, R$ 5,88 por aluno extra
 * - Business: 40 alunos, R$ 4,93 por aluno extra
 * - Premium: 70 alunos, R$ 4,24 por aluno extra
 * - Enterprise: 150 alunos, R$ 3,31 por aluno extra
 */

export const PLAN_LIMITS = {
  starter: {
    limit: 15,
    extraPrice: 6.47,
  },
  pro: {
    limit: 25,
    extraPrice: 5.88,
  },
  business: {
    limit: 40,
    extraPrice: 4.93,
  },
  premium: {
    limit: 70,
    extraPrice: 4.24,
  },
  enterprise: {
    limit: 150,
    extraPrice: 3.31,
  },
};

export interface ExtraChargeCalculation {
  currentStudents: number;
  studentLimit: number;
  extraStudents: number;
  extraStudentPrice: number;
  totalExtraCharge: number;
  accumulatedCharge: number;
  nextBillingDate: Date;
}

/**
 * Calcula cobranças extras baseado no número de alunos
 * 
 * @param planId - ID do plano (starter, pro, business, premium, enterprise)
 * @param currentStudents - Número de alunos ativos
 * @param accumulatedCharge - Valor já acumulado de cobranças extras
 * @returns Cálculo detalhado das cobranças
 */
export function calculateExtraCharges(
  planId: string,
  currentStudents: number,
  accumulatedCharge: number = 0
): ExtraChargeCalculation {
  // Normalizar planId
  const normalizedPlanId = planId.toLowerCase().replace(/[^a-z]/g, '');
  
  // Buscar limites do plano
  const planConfig = PLAN_LIMITS[normalizedPlanId as keyof typeof PLAN_LIMITS];
  
  if (!planConfig) {
    throw new Error(`Plano inválido: ${planId}`);
  }

  // Calcular alunos excedentes
  const extraStudents = Math.max(0, currentStudents - planConfig.limit);
  
  // Calcular cobrança nova (apenas desta vez)
  const newExtraCharge = extraStudents * planConfig.extraPrice;
  
  // Acumular para próxima fatura
  const totalAccumulated = accumulatedCharge + newExtraCharge;

  // Próxima data de cobrança (30 dias a partir de agora)
  const nextBillingDate = new Date();
  nextBillingDate.setDate(nextBillingDate.getDate() + 30);

  return {
    currentStudents,
    studentLimit: planConfig.limit,
    extraStudents,
    extraStudentPrice: planConfig.extraPrice,
    totalExtraCharge: newExtraCharge,
    accumulatedCharge: totalAccumulated,
    nextBillingDate,
  };
}

/**
 * Formata o cálculo de cobranças para exibição
 */
export function formatExtraCharges(calculation: ExtraChargeCalculation): string {
  if (calculation.extraStudents === 0) {
    return `✅ Nenhum aluno excedente. Você tem ${calculation.currentStudents}/${calculation.studentLimit} alunos.`;
  }

  return `
⚠️ ALUNOS EXCEDENTES DETECTADOS

Limite do plano: ${calculation.studentLimit} alunos
Alunos ativos: ${calculation.currentStudents}
Alunos excedentes: ${calculation.extraStudents}

Preço por aluno extra: R$ ${calculation.extraStudentPrice.toFixed(2)}
Cobrança desta vez: R$ ${calculation.totalExtraCharge.toFixed(2)}
Acumulado para próxima fatura: R$ ${calculation.accumulatedCharge.toFixed(2)}

Próxima cobrança: ${calculation.nextBillingDate.toLocaleDateString('pt-BR')}
  `.trim();
}

/**
 * Determina se deve fazer upgrade de plano
 * 
 * Recomenda upgrade se:
 * - Alunos excedentes > 10% do limite
 * - Cobrança acumulada > 50% do preço do plano
 */
export function shouldRecommendUpgrade(
  calculation: ExtraChargeCalculation,
  currentPlanPrice: number
): boolean {
  const percentageOverLimit = (calculation.extraStudents / calculation.studentLimit) * 100;
  const accumulatedPercentageOfPlan = (calculation.accumulatedCharge / currentPlanPrice) * 100;

  return percentageOverLimit > 10 || accumulatedPercentageOfPlan > 50;
}

/**
 * Sugestão de upgrade para o próximo plano
 */
export function getUpgradeSuggestion(
  currentPlanId: string,
  calculation: ExtraChargeCalculation
): { nextPlanId: string; savings: number } | null {
  const planOrder = ['starter', 'pro', 'business', 'premium', 'enterprise'];
  const currentIndex = planOrder.indexOf(currentPlanId.toLowerCase());

  if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
    return null; // Plano inválido ou já é Enterprise
  }

  const nextPlanId = planOrder[currentIndex + 1];
  const nextPlanConfig = PLAN_LIMITS[nextPlanId as keyof typeof PLAN_LIMITS];

  // Calcular economia se fizer upgrade
  const newExtraStudents = Math.max(0, calculation.currentStudents - nextPlanConfig.limit);
  const newExtraCharge = newExtraStudents * nextPlanConfig.extraPrice;
  const savings = calculation.totalExtraCharge - newExtraCharge;

  return {
    nextPlanId,
    savings: Math.max(0, savings),
  };
}

/**
 * Gera relatório de cobranças extras para o personal
 */
export function generateExtraChargesReport(
  personalId: number,
  planId: string,
  currentStudents: number,
  accumulatedCharge: number,
  currentPlanPrice: number
): {
  summary: string;
  recommendation: string;
  nextSteps: string[];
} {
  const calculation = calculateExtraCharges(planId, currentStudents, accumulatedCharge);
  const shouldUpgrade = shouldRecommendUpgrade(calculation, currentPlanPrice);
  const upgradeSuggestion = getUpgradeSuggestion(planId, calculation);

  let recommendation = '';
  let nextSteps: string[] = [];

  if (calculation.extraStudents === 0) {
    recommendation = '✅ Você está dentro do limite de alunos do seu plano.';
    nextSteps = [
      'Continue monitorando o número de alunos',
      'Considere fazer upgrade quando atingir 80% do limite',
    ];
  } else if (shouldUpgrade && upgradeSuggestion) {
    const savings = upgradeSuggestion.savings;
    recommendation = `
⭐ RECOMENDAÇÃO DE UPGRADE

Você tem ${calculation.extraStudents} alunos excedentes, o que está custando R$ ${calculation.totalExtraCharge.toFixed(2)}/mês.

Fazendo upgrade para o plano ${upgradeSuggestion.nextPlanId.toUpperCase()}, você economizaria R$ ${savings.toFixed(2)}/mês!

Isso representa uma economia de ${((savings / calculation.totalExtraCharge) * 100).toFixed(0)}% em cobranças extras.
    `.trim();
    nextSteps = [
      `Fazer upgrade para ${upgradeSuggestion.nextPlanId.toUpperCase()}`,
      `Economizar R$ ${(savings * 12).toFixed(2)}/ano`,
    ];
  } else {
    recommendation = `
⚠️ COBRANÇAS EXTRAS

Você tem ${calculation.extraStudents} alunos excedentes.
Cobrança acumulada: R$ ${calculation.accumulatedCharge.toFixed(2)}

Será cobrado na próxima renovação: ${calculation.nextBillingDate.toLocaleDateString('pt-BR')}
    `.trim();
    nextSteps = [
      `Pagar R$ ${calculation.accumulatedCharge.toFixed(2)} na próxima fatura`,
      'Considerar upgrade se continuar crescendo',
    ];
  }

  return {
    summary: formatExtraCharges(calculation),
    recommendation,
    nextSteps,
  };
}
