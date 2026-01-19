/**
 * Configuração dos planos FitPrime
 * Baseado na estratégia de precificação
 * 
 * Plano Anual: 20% de desconto + 20% mais alunos
 */

export interface Plan {
  id: string;
  name: string;
  price: number;
  annualPrice: number; // Preço anual total com 20% de desconto
  annualMonthlyPrice: number; // Preço mensal equivalente no plano anual
  studentLimit: number;
  annualStudentLimit: number; // Limite de alunos no plano anual (+20%)
  extraStudentPrice: number;
  description: string;
  offerId: string;
  annualOfferId: string;
  checkoutUrl: string;
  annualCheckoutUrl: string;
  features: string[];
}

export const PLANS: Record<string, Plan> = {
  trial: {
    id: "trial",
    name: "Trial",
    price: 0,
    annualPrice: 0,
    annualMonthlyPrice: 0,
    studentLimit: 5,
    annualStudentLimit: 5,
    extraStudentPrice: 0,
    description: "Teste grátis por 24 horas",
    offerId: "",
    annualOfferId: "",
    checkoutUrl: "",
    annualCheckoutUrl: "",
    features: [
      "Até 5 alunos",
      "Acesso por 24 horas",
      "Montagem de treinos com IA",
      "Portal do aluno",
      "Sem cartão de crédito"
    ]
  },
  beginner: {
    id: "beginner",
    name: "Beginner",
    price: 39.90,
    annualPrice: 383, // R$39.90 x 12 x 0.8 = R$383.04 ≈ R$383
    annualMonthlyPrice: 31.92, // R$383 / 12
    studentLimit: 5,
    annualStudentLimit: 6, // 5 x 1.2 = 6
    extraStudentPrice: 7.98,
    description: "Para quem está começando",
    offerId: "beginner_offer",
    annualOfferId: "beginner_annual_offer",
    checkoutUrl: "https://pay.cakto.com.br/beginner",
    annualCheckoutUrl: "https://pay.cakto.com.br/beginner_annual",
    features: [
      "Até 5 alunos",
      "Montagem de treinos",
      "Portal do aluno",
      "Agenda básica",
      "Suporte por email"
    ]
  },
  starter: {
    id: "starter",
    name: "Starter",
    price: 97,
    annualPrice: 932, // R$97 x 12 x 0.8 = R$931.20 ≈ R$932
    annualMonthlyPrice: 77.67, // R$932 / 12
    studentLimit: 15,
    annualStudentLimit: 18, // 15 x 1.2 = 18
    extraStudentPrice: 6.47,
    description: "Perfeito para começar",
    offerId: "32rof96",
    annualOfferId: "38m8qgq",
    checkoutUrl: "https://pay.cakto.com.br/32rof96",
    annualCheckoutUrl: "https://pay.cakto.com.br/38m8qgq",
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
    annualPrice: 1411, // R$147 x 12 x 0.8 = R$1411.20 ≈ R$1411
    annualMonthlyPrice: 117.58, // R$1411 / 12
    studentLimit: 25,
    annualStudentLimit: 30, // 25 x 1.2 = 30
    extraStudentPrice: 5.88,
    description: "Para personais em crescimento",
    offerId: "onb2wr2",
    annualOfferId: "3bz5zr8",
    checkoutUrl: "https://pay.cakto.com.br/onb2wr2",
    annualCheckoutUrl: "https://pay.cakto.com.br/3bz5zr8",
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
    annualPrice: 1891, // R$197 x 12 x 0.8 = R$1891.20 ≈ R$1891
    annualMonthlyPrice: 157.58, // R$1891 / 12
    studentLimit: 40,
    annualStudentLimit: 48, // 40 x 1.2 = 48
    extraStudentPrice: 4.03,
    description: "Para personais consolidados",
    offerId: "zh3rnh6",
    annualOfferId: "q6oeohx",
    checkoutUrl: "https://pay.cakto.com.br/zh3rnh6",
    annualCheckoutUrl: "https://pay.cakto.com.br/q6oeohx",
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
    annualPrice: 2851, // R$297 x 12 x 0.8 = R$2851.20 ≈ R$2851
    annualMonthlyPrice: 237.58, // R$2851 / 12
    studentLimit: 70,
    annualStudentLimit: 84, // 70 x 1.2 = 84
    extraStudentPrice: 4.24,
    description: "Para estúdios pequenos",
    offerId: "kbevbfw",
    annualOfferId: "32e6rsr",
    checkoutUrl: "https://pay.cakto.com.br/kbevbfw",
    annualCheckoutUrl: "https://pay.cakto.com.br/32e6rsr",
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
    annualPrice: 4771, // R$497 x 12 x 0.8 = R$4771.20 ≈ R$4771
    annualMonthlyPrice: 397.58, // R$4771 / 12
    studentLimit: 150,
    annualStudentLimit: 180, // 150 x 1.2 = 180
    extraStudentPrice: 3.31,
    description: "Para grandes estúdios",
    offerId: "apzipd3",
    annualOfferId: "ndnczxn",
    checkoutUrl: "https://pay.cakto.com.br/apzipd3",
    annualCheckoutUrl: "https://pay.cakto.com.br/ndnczxn",
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
export function findPlanForStudentCount(studentCount: number, isAnnual: boolean = false): Plan | null {
  const suitablePlans = Object.values(PLANS).filter(plan => {
    const limit = isAnnual ? plan.annualStudentLimit : plan.studentLimit;
    return limit >= studentCount;
  });

  if (suitablePlans.length === 0) {
    return null;
  }

  return suitablePlans.reduce((cheapest, plan) =>
    plan.price < cheapest.price ? plan : cheapest
  );
}

/**
 * Calcula o custo de alunos excedentes
 */
export function calculateExtraStudentCost(
  plan: Plan,
  studentCount: number,
  isAnnual: boolean = false
): number {
  const limit = isAnnual ? plan.annualStudentLimit : plan.studentLimit;
  if (studentCount <= limit) {
    return 0;
  }

  const extraStudents = studentCount - limit;
  return extraStudents * plan.extraStudentPrice;
}

/**
 * Calcula o custo total mensal
 */
export function calculateTotalMonthlyCost(
  plan: Plan,
  studentCount: number,
  isAnnual: boolean = false
): number {
  const basePrice = isAnnual ? plan.annualMonthlyPrice : plan.price;
  const extraCost = calculateExtraStudentCost(plan, studentCount, isAnnual);
  return basePrice + extraCost;
}

/**
 * Calcula economia anual comparado ao mensal
 */
export function calculateAnnualSavings(plan: Plan): number {
  const monthlyTotal = plan.price * 12;
  return monthlyTotal - plan.annualPrice;
}

/**
 * Obtém recomendação de plano com economia
 */
export function getPlanRecommendation(studentCount: number, isAnnual: boolean = false) {
  const currentPlan = findPlanForStudentCount(studentCount, isAnnual);

  if (!currentPlan) {
    return {
      current: null,
      recommended: null,
      savings: 0
    };
  }

  const allPlans = Object.values(PLANS);
  const betterPlans = allPlans.filter(
    plan => plan.price > currentPlan.price && 
    (isAnnual ? plan.annualStudentLimit : plan.studentLimit) >= studentCount
  );

  if (betterPlans.length === 0) {
    return {
      current: currentPlan,
      recommended: null,
      savings: 0
    };
  }

  const recommended = betterPlans[0];
  const currentCost = calculateTotalMonthlyCost(currentPlan, studentCount, isAnnual);
  const recommendedCost = calculateTotalMonthlyCost(recommended, studentCount, isAnnual);
  const savings = currentCost - recommendedCost;

  return {
    current: currentPlan,
    recommended: savings > 0 ? recommended : null,
    savings: Math.max(0, savings)
  };
}
