/**
 * Configuração dos planos FitPrime
 * Baseado na estratégia de precificação
 */

export interface Plan {
  id: string;
  name: string;
  price: number;
  studentLimit: number;
  extraStudentPrice: number;
  description: string;
  offerId: string;
  checkoutUrl: string;
  features: string[];
}

export const PLANS: Record<string, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 97,
    studentLimit: 15,
    extraStudentPrice: 6.47,
    description: "Perfeito para começar",
    offerId: "32rof96",
    checkoutUrl: "https://pay.cakto.com.br/32rof96",
    features: [
      "Até 15 alunos",
      "Agenda completa",
      "Montagem de treinos",
      "WhatsApp integrado",
      "Portal do aluno",
      "Relatórios básicos"
    ]
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 147,
    studentLimit: 25,
    extraStudentPrice: 5.88,
    description: "Para personais em crescimento",
    offerId: "onb2wr2",
    checkoutUrl: "https://pay.cakto.com.br/onb2wr2",
    features: [
      "Até 25 alunos",
      "Tudo do Starter +",
      "Cobranças automáticas",
      "Relatórios avançados",
      "Análise de evolução",
      "Suporte prioritário"
    ]
  },
  business: {
    id: "business",
    name: "Business",
    price: 197,
    studentLimit: 40,
    extraStudentPrice: 4.03,
    description: "Para personais consolidados",
    offerId: "zh3rnh6",
    checkoutUrl: "https://pay.cakto.com.br/zh3rnh6",
    features: [
      "Até 40 alunos",
      "Tudo do Pro +",
      "Múltiplos personais",
      "Dashboard gerencial",
      "Integração com APIs",
      "Suporte 24/7"
    ]
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 297,
    studentLimit: 70,
    extraStudentPrice: 4.24,
    description: "Para estúdios pequenos",
    offerId: "kbevbfw",
    checkoutUrl: "https://pay.cakto.com.br/kbevbfw",
    features: [
      "Até 70 alunos",
      "Tudo do Business +",
      "Gestão de múltiplos estúdios",
      "Relatórios customizados",
      "API completa",
      "Onboarding dedicado"
    ]
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 497,
    studentLimit: 150,
    extraStudentPrice: 3.31,
    description: "Para grandes estúdios",
    offerId: "apzipd3",
    checkoutUrl: "https://pay.cakto.com.br/apzipd3",
    features: [
      "Até 150 alunos",
      "Tudo do Premium +",
      "Suporte dedicado",
      "Implementação customizada",
      "Integração de sistemas",
      "SLA garantido"
    ]
  }
};

/**
 * Encontra o plano adequado baseado no número de alunos
 */
export function findPlanForStudentCount(studentCount: number): Plan | null {
  // Encontra o plano com menor custo que acomoda o número de alunos
  const suitablePlans = Object.values(PLANS).filter(
    plan => plan.studentLimit >= studentCount
  );

  if (suitablePlans.length === 0) {
    return null; // Precisa de upgrade ou plano customizado
  }

  // Retorna o plano mais barato que acomoda
  return suitablePlans.reduce((cheapest, plan) =>
    plan.price < cheapest.price ? plan : cheapest
  );
}

/**
 * Calcula o custo de alunos excedentes
 */
export function calculateExtraStudentCost(
  plan: Plan,
  studentCount: number
): number {
  if (studentCount <= plan.studentLimit) {
    return 0;
  }

  const extraStudents = studentCount - plan.studentLimit;
  return extraStudents * plan.extraStudentPrice;
}

/**
 * Calcula o custo total mensal
 */
export function calculateTotalMonthlyCost(
  plan: Plan,
  studentCount: number
): number {
  const extraCost = calculateExtraStudentCost(plan, studentCount);
  return plan.price + extraCost;
}

/**
 * Obtém recomendação de plano com economia
 */
export function getPlanRecommendation(studentCount: number) {
  const currentPlan = findPlanForStudentCount(studentCount);

  if (!currentPlan) {
    return {
      current: null,
      recommended: null,
      savings: 0
    };
  }

  // Verifica se há um plano melhor (mais alunos inclusos com menor custo extra)
  const allPlans = Object.values(PLANS);
  const betterPlans = allPlans.filter(
    plan => plan.price > currentPlan.price && plan.studentLimit >= studentCount
  );

  if (betterPlans.length === 0) {
    return {
      current: currentPlan,
      recommended: null,
      savings: 0
    };
  }

  const recommended = betterPlans[0]; // Próximo plano mais barato
  const currentCost = calculateTotalMonthlyCost(currentPlan, studentCount);
  const recommendedCost = calculateTotalMonthlyCost(recommended, studentCount);
  const savings = currentCost - recommendedCost;

  return {
    current: currentPlan,
    recommended: savings > 0 ? recommended : null,
    savings: Math.max(0, savings)
  };
}
