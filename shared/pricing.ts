/**
 * FitPrime Manager - Configuração Oficial de Precificação
 * 
 * REGRA-MÃE: O usuário paga pelo que escala. Nunca paga para "desbloquear crescimento".
 */

export type Country = 'BR' | 'US';
export type Currency = 'BRL' | 'USD';

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  studentLimit: number;
  costPerStudent: number;
  features: string[];
}

export interface ExtraStudentConfig {
  pricePerStudent: number;
  currency: Currency;
}

export interface B2CPlan {
  id: string;
  name: string;
  price: number;
  currency: Currency;
  interval: 'month' | 'year';
  features: string[];
}

// ============================================
// 🇧🇷 BRASIL - PLANOS B2B (PERSONAL TRAINER)
// ============================================

export const PLANS_BR: PlanConfig[] = [
  {
    id: 'fitprime_br_starter',
    name: 'Starter',
    price: 97,
    currency: 'BRL',
    studentLimit: 15,
    costPerStudent: 6.46,
    features: [
      'Até 15 alunos',
      'Treinos personalizados',
      'Agenda básica',
      'Chat com alunos',
      'Evolução com gráficos',
    ],
  },
  {
    id: 'fitprime_br_growth',
    name: 'Growth',
    price: 147,
    currency: 'BRL',
    studentLimit: 25,
    costPerStudent: 5.88,
    features: [
      'Até 25 alunos',
      'Tudo do Starter',
      'Automações WhatsApp',
      'Cobranças automáticas',
      'Relatórios avançados',
    ],
  },
  {
    id: 'fitprime_br_pro',
    name: 'Pro',
    price: 197,
    currency: 'BRL',
    studentLimit: 40,
    costPerStudent: 4.92,
    features: [
      'Até 40 alunos',
      'Tudo do Growth',
      'Análise IA de treinos',
      'White label básico',
      'Suporte prioritário',
    ],
  },
  {
    id: 'fitprime_br_scale',
    name: 'Scale',
    price: 297,
    currency: 'BRL',
    studentLimit: 75,
    costPerStudent: 3.96,
    features: [
      'Até 75 alunos',
      'Tudo do Pro',
      'Multi-personal (equipe)',
      'API access',
      'Onboarding dedicado',
    ],
  },
  {
    id: 'fitprime_br_advanced',
    name: 'Advanced',
    price: 497,
    currency: 'BRL',
    studentLimit: 120,
    costPerStudent: 4.14,
    features: [
      'Até 120 alunos',
      'Tudo do Scale',
      'Domínio personalizado',
      'SLA garantido',
      'Customizações',
    ],
  },
  {
    id: 'fitprime_br_authority',
    name: 'Authority',
    price: 997,
    currency: 'BRL',
    studentLimit: 200,
    costPerStudent: 4.97,
    features: [
      'Até 200 alunos',
      'Tudo do Advanced',
      'Gerente de conta dedicado',
      'Treinamento da equipe',
      'Integrações customizadas',
    ],
  },
];

export const EXTRA_STUDENT_BR: ExtraStudentConfig = {
  pricePerStudent: 6.46,
  currency: 'BRL',
};

// ============================================
// 🇺🇸 ESTADOS UNIDOS - PLANOS B2B (PERSONAL TRAINER)
// ============================================

export const PLANS_US: PlanConfig[] = [
  {
    id: 'fitprime_us_starter',
    name: 'Starter',
    price: 47,
    currency: 'USD',
    studentLimit: 15,
    costPerStudent: 3.13,
    features: [
      'Up to 15 clients',
      'Custom workouts',
      'Basic scheduling',
      'Client chat',
      'Progress tracking',
    ],
  },
  {
    id: 'fitprime_us_growth',
    name: 'Growth',
    price: 67,
    currency: 'USD',
    studentLimit: 25,
    costPerStudent: 2.68,
    features: [
      'Up to 25 clients',
      'Everything in Starter',
      'WhatsApp automations',
      'Automatic billing',
      'Advanced reports',
    ],
  },
  {
    id: 'fitprime_us_pro',
    name: 'Pro',
    price: 97,
    currency: 'USD',
    studentLimit: 40,
    costPerStudent: 2.42,
    features: [
      'Up to 40 clients',
      'Everything in Growth',
      'AI workout analysis',
      'Basic white label',
      'Priority support',
    ],
  },
  {
    id: 'fitprime_us_scale',
    name: 'Scale',
    price: 147,
    currency: 'USD',
    studentLimit: 75,
    costPerStudent: 1.96,
    features: [
      'Up to 75 clients',
      'Everything in Pro',
      'Multi-trainer (team)',
      'API access',
      'Dedicated onboarding',
    ],
  },
  {
    id: 'fitprime_us_advanced',
    name: 'Advanced',
    price: 247,
    currency: 'USD',
    studentLimit: 150,
    costPerStudent: 1.65,
    features: [
      'Up to 150 clients',
      'Everything in Scale',
      'Custom domain',
      'SLA guarantee',
      'Customizations',
    ],
  },
  {
    id: 'fitprime_us_authority',
    name: 'Authority',
    price: 497,
    currency: 'USD',
    studentLimit: 400,
    costPerStudent: 1.24,
    features: [
      'Up to 400 clients',
      'Everything in Advanced',
      'Dedicated account manager',
      'Team training',
      'Custom integrations',
    ],
  },
  {
    id: 'fitprime_us_enterprise',
    name: 'Enterprise Coach',
    price: 997,
    currency: 'USD',
    studentLimit: 1000,
    costPerStudent: 0.99,
    features: [
      'Up to 1,000 clients',
      'Everything in Authority',
      'Enterprise SLA',
      'Custom development',
      'White glove service',
    ],
  },
];

export const EXTRA_STUDENT_US: ExtraStudentConfig = {
  pricePerStudent: 2.99,
  currency: 'USD',
};

// ============================================
// 🔵 MODELO B2C - ATHLETE MODE
// ============================================

export const ATHLETE_PLANS_BR: B2CPlan[] = [
  {
    id: 'athlete_br_monthly',
    name: 'Athlete Mensal',
    price: 34.90,
    currency: 'BRL',
    interval: 'month',
    features: [
      'Acesso completo à plataforma',
      'Treinos personalizados por IA',
      'Ranking global (opt-in)',
      'Gamificação e conquistas',
      'Histórico de evolução',
    ],
  },
  {
    id: 'athlete_br_yearly',
    name: 'Athlete Anual',
    price: 349,
    currency: 'BRL',
    interval: 'year',
    features: [
      'Tudo do plano mensal',
      '2 meses grátis',
      'Acesso antecipado a novidades',
      'Badge exclusivo de membro anual',
    ],
  },
];

export const ATHLETE_PLANS_US: B2CPlan[] = [
  {
    id: 'athlete_us_base',
    name: 'Athlete Base',
    price: 14.90,
    currency: 'USD',
    interval: 'month',
    features: [
      'Full platform access',
      'Workout tracking',
      'Global ranking (opt-in)',
      'Gamification & badges',
      'Progress history',
    ],
  },
  {
    id: 'athlete_us_elite',
    name: 'Athlete Elite',
    price: 19.90,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Base',
      'AI-powered workout generation',
      'Advanced analytics',
      'Priority support',
      'Exclusive elite badge',
    ],
  },
];

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================

/**
 * Retorna os planos B2B baseado no país
 */
export function getPlans(country: Country): PlanConfig[] {
  return country === 'BR' ? PLANS_BR : PLANS_US;
}

/**
 * Retorna a configuração de aluno extra baseado no país
 */
export function getExtraStudentConfig(country: Country): ExtraStudentConfig {
  return country === 'BR' ? EXTRA_STUDENT_BR : EXTRA_STUDENT_US;
}

/**
 * Retorna os planos B2C (Athlete Mode) baseado no país
 */
export function getAthletePlans(country: Country): B2CPlan[] {
  return country === 'BR' ? ATHLETE_PLANS_BR : ATHLETE_PLANS_US;
}

/**
 * Encontra o plano adequado baseado no número de alunos
 */
export function findSuitablePlan(studentCount: number, country: Country): PlanConfig | null {
  const plans = getPlans(country);
  return plans.find(plan => plan.studentLimit >= studentCount) || null;
}

/**
 * Calcula o custo de alunos extras
 */
export function calculateExtraStudentCost(
  currentPlan: PlanConfig,
  studentCount: number,
  country: Country
): { extraStudents: number; extraCost: number; currency: Currency } {
  const extraConfig = getExtraStudentConfig(country);
  const extraStudents = Math.max(0, studentCount - currentPlan.studentLimit);
  
  return {
    extraStudents,
    extraCost: extraStudents * extraConfig.pricePerStudent,
    currency: extraConfig.currency,
  };
}

/**
 * Sugere upgrade de plano se houver economia
 */
export function suggestUpgrade(
  currentPlan: PlanConfig,
  studentCount: number,
  country: Country
): { shouldUpgrade: boolean; suggestedPlan: PlanConfig | null; savings: number } {
  const plans = getPlans(country);
  const extraConfig = getExtraStudentConfig(country);
  
  // Custo atual (plano + extras)
  const extraStudents = Math.max(0, studentCount - currentPlan.studentLimit);
  const currentTotalCost = currentPlan.price + (extraStudents * extraConfig.pricePerStudent);
  
  // Encontra próximo plano que comporta todos os alunos
  const nextPlan = plans.find(
    plan => plan.studentLimit >= studentCount && plan.price > currentPlan.price
  );
  
  if (!nextPlan) {
    return { shouldUpgrade: false, suggestedPlan: null, savings: 0 };
  }
  
  // Se o próximo plano for mais barato que plano atual + extras
  const savings = currentTotalCost - nextPlan.price;
  
  return {
    shouldUpgrade: savings > 0,
    suggestedPlan: nextPlan,
    savings: Math.max(0, savings),
  };
}

/**
 * Formata preço para exibição
 */
export function formatPrice(price: number, currency: Currency): string {
  if (currency === 'BRL') {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }
  return `$${price.toFixed(2)}`;
}

/**
 * Detecta país baseado em timezone ou locale
 */
export function detectCountry(): Country {
  if (typeof window === 'undefined') return 'BR';
  
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = navigator.language;
  
  // Se timezone é dos EUA ou locale é en-US
  if (
    timezone.startsWith('America/') && 
    !timezone.includes('Sao_Paulo') && 
    !timezone.includes('Brasilia')
  ) {
    if (locale.startsWith('en')) {
      return 'US';
    }
  }
  
  // Se locale é português do Brasil
  if (locale === 'pt-BR' || locale === 'pt') {
    return 'BR';
  }
  
  // Default para BR
  return 'BR';
}
