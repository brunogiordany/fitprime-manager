// Configuração dos planos FitPrime com links de checkout da Cakto

export interface FitPrimePlan {
  id: string;
  name: string;
  description: string;
  price: number;
  studentLimit: number;
  extraStudentPrice: number;
  checkoutUrl: string;
  features: string[];
  popular?: boolean;
}

export const FITPRIME_PLANS: FitPrimePlan[] = [
  {
    id: "beginner",
    name: "Beginner",
    description: "Perfeito para começar",
    price: 39.90,
    studentLimit: 5,
    extraStudentPrice: 9.90,
    checkoutUrl: "https://pay.cakto.com.br/75u9x53",
    features: [
      "Até 5 alunos",
      "Treinos personalizados",
      "Cobranças automáticas",
      "App do aluno",
      "Suporte por email",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "Para profissionais em crescimento",
    price: 97.00,
    studentLimit: 15,
    extraStudentPrice: 7.90,
    checkoutUrl: "https://pay.cakto.com.br/y9iqj9q_706332",
    features: [
      "Até 15 alunos",
      "Treinos com IA básica",
      "Relatórios de evolução",
      "Cobranças automáticas",
      "Notificações WhatsApp",
      "Suporte prioritário",
    ],
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para profissionais estabelecidos",
    price: 147.00,
    studentLimit: 25,
    extraStudentPrice: 6.90,
    checkoutUrl: "https://pay.cakto.com.br/onb2wr2",
    features: [
      "Até 25 alunos",
      "IA avançada para treinos",
      "Análise de fotos com IA",
      "Dashboard completo",
      "Automações avançadas",
      "Suporte dedicado",
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "Para escalar seu negócio",
    price: 197.00,
    studentLimit: 40,
    extraStudentPrice: 5.90,
    checkoutUrl: "https://pay.cakto.com.br/zh3rnh6",
    features: [
      "Até 40 alunos",
      "IA premium ilimitada",
      "Multi-personal (equipe)",
      "Relatórios avançados",
      "API de integração",
      "Consultor dedicado",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Próximo nível de crescimento",
    price: 297.00,
    studentLimit: 70,
    extraStudentPrice: 4.90,
    checkoutUrl: "https://pay.cakto.com.br/kbevbfw",
    features: [
      "Até 70 alunos",
      "IA ultra premium",
      "White-label (sua marca)",
      "Suporte VIP 24/7",
      "Treinamento exclusivo",
      "Prioridade em novidades",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Solução customizada",
    price: 497.00,
    studentLimit: 150,
    extraStudentPrice: 3.90,
    checkoutUrl: "https://pay.cakto.com.br/apzipd3",
    features: [
      "Até 150 alunos",
      "IA enterprise dedicada",
      "Infraestrutura dedicada",
      "SLA garantido",
      "Desenvolvimento custom",
      "Gerente de sucesso",
    ],
  },
];

// Função para obter plano por ID
export function getPlanById(planId: string): FitPrimePlan | undefined {
  return FITPRIME_PLANS.find(p => p.id === planId);
}

// Função para obter plano recomendado baseado no número de alunos
export function getRecommendedPlan(studentCount: number): FitPrimePlan {
  if (studentCount <= 5) return FITPRIME_PLANS[0]; // Beginner
  if (studentCount <= 15) return FITPRIME_PLANS[1]; // Starter
  if (studentCount <= 25) return FITPRIME_PLANS[2]; // Pro
  if (studentCount <= 40) return FITPRIME_PLANS[3]; // Business
  if (studentCount <= 70) return FITPRIME_PLANS[4]; // Premium
  return FITPRIME_PLANS[5]; // Enterprise
}

// Função para obter URL de checkout
export function getCheckoutUrl(planId: string): string {
  const plan = getPlanById(planId);
  return plan?.checkoutUrl || "";
}
