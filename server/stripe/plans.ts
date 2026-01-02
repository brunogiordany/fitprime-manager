// Planos do FitPrime Manager com IDs do Stripe
// Estes produtos e preços precisam ser criados no Stripe Dashboard ou via API

export interface FitPrimePlan {
  id: string;
  name: string;
  description: string;
  price: number; // em reais
  studentLimit: number;
  extraStudentPrice: number;
  features: string[];
  stripePriceId?: string; // ID do preço no Stripe (será preenchido após criar no Stripe)
  stripeProductId?: string; // ID do produto no Stripe
}

// Planos disponíveis
export const FITPRIME_PLANS: FitPrimePlan[] = [
  {
    id: "beginner",
    name: "Beginner",
    description: "Perfeito para começar",
    price: 39.90,
    studentLimit: 5,
    extraStudentPrice: 7.98,
    features: [
      "Até 5 alunos",
      "Treinos personalizados",
      "Acompanhamento básico",
      "Cobranças automáticas",
      "Suporte por email",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "Para profissionais em crescimento",
    price: 97.00,
    studentLimit: 15,
    extraStudentPrice: 6.47,
    features: [
      "Até 15 alunos",
      "Treinos avançados com IA",
      "Acompanhamento completo",
      "Cobranças automáticas",
      "Relatórios detalhados",
      "Suporte prioritário",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para profissionais estabelecidos",
    price: 147.00,
    studentLimit: 25,
    extraStudentPrice: 5.88,
    features: [
      "Até 25 alunos",
      "Treinos com IA avançada",
      "Acompanhamento 24/7",
      "Cobranças automáticas",
      "Relatórios avançados",
      "Integração com apps",
      "Suporte dedicado",
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "Para escalar seu negócio",
    price: 197.00,
    studentLimit: 40,
    extraStudentPrice: 4.93,
    features: [
      "Até 40 alunos",
      "Treinos com IA premium",
      "Acompanhamento VIP",
      "Cobranças automáticas",
      "Relatórios executivos",
      "Integrações ilimitadas",
      "Suporte 24/7",
      "Consultor dedicado",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Próximo nível de crescimento",
    price: 297.00,
    studentLimit: 70,
    extraStudentPrice: 4.24,
    features: [
      "Até 70 alunos",
      "Treinos com IA ultra premium",
      "Acompanhamento VIP 24/7",
      "Cobranças automáticas",
      "Relatórios em tempo real",
      "Integrações ilimitadas",
      "Suporte VIP 24/7",
      "Consultor dedicado",
      "Treinamento personalizado",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Solução customizada",
    price: 497.00,
    studentLimit: 150,
    extraStudentPrice: 3.31,
    features: [
      "Até 150 alunos",
      "Treinos com IA enterprise",
      "Acompanhamento VIP ilimitado",
      "Cobranças automáticas",
      "Relatórios customizados",
      "Integrações ilimitadas",
      "Suporte VIP 24/7",
      "Consultor dedicado",
      "Treinamento completo",
      "API customizada",
    ],
  },
];

// Função para obter plano por ID
export function getPlanById(planId: string): FitPrimePlan | undefined {
  return FITPRIME_PLANS.find(plan => plan.id === planId);
}

// Função para obter preço em centavos
export function getPlanPriceInCents(planId: string): number {
  const plan = getPlanById(planId);
  return plan ? Math.round(plan.price * 100) : 0;
}
