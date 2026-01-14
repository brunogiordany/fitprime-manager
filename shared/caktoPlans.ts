// Configuração dos planos FitPrime com links de checkout da Cakto
// ATUALIZADO EM 14/01/2026 - Números corretos de alunos e valores de adicional
//
// TABELA DE PLANOS FITPRIME
// | Plano      | Preço     | Alunos | Adicional/aluno |
// |------------|-----------|--------|------------------|
// | BEGINNER   | R$ 39,90  | 5      | R$ 7,98          |
// | STARTER    | R$ 97,00  | 15     | R$ 6,46          |
// | PRO        | R$ 147,00 | 25     | R$ 5,88          |
// | BUSINESS   | R$ 197,00 | 35     | R$ 5,62          |
// | PREMIUM    | R$ 297,00 | 55     | R$ 5,40          |
// | ENTERPRISE | R$ 497,00 | 100    | R$ 4,97          |
//
// Custo mínimo por aluno aceito: R$ 4,97

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
    extraStudentPrice: 7.98,
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
    extraStudentPrice: 6.46,
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
    extraStudentPrice: 5.88,
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
    studentLimit: 35,
    extraStudentPrice: 5.62,
    checkoutUrl: "https://pay.cakto.com.br/zh3rnh6",
    features: [
      "Até 35 alunos",
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
    studentLimit: 55,
    extraStudentPrice: 5.40,
    checkoutUrl: "https://pay.cakto.com.br/kbevbfw",
    features: [
      "Até 55 alunos",
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
    studentLimit: 100,
    extraStudentPrice: 4.97,
    checkoutUrl: "https://pay.cakto.com.br/apzipd3",
    features: [
      "Até 100 alunos",
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
  if (studentCount <= 35) return FITPRIME_PLANS[3]; // Business
  if (studentCount <= 55) return FITPRIME_PLANS[4]; // Premium
  return FITPRIME_PLANS[5]; // Enterprise
}

// Função para obter URL de checkout
export function getCheckoutUrl(planId: string): string {
  const plan = getPlanById(planId);
  return plan?.checkoutUrl || "";
}
