import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { pixelEvents } from "@/lib/tracking-pixels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ArrowRight,
  Zap,
  Users,
  TrendingUp,
  Clock,
  BarChart3,
  MessageSquare,
  Shield,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  Target,
  Sparkles,
  Brain,
  CreditCard,
  Calendar,
  Bell,
} from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  studentLimit: number;
  extraStudentPrice: number;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

// TODOS os planos disponíveis (para mostrar todas as opções)
const ALL_PLANS: PricingPlan[] = [
  {
    id: "beginner",
    name: "Beginner",
    description: "Começando sua jornada",
    price: 39.9,
    studentLimit: 5,
    extraStudentPrice: 7.98,
    features: [
      "Até 5 alunos inclusos",
      "Gestão completa de alunos",
      "Treinos personalizados",
      "Cobranças automáticas",
      "Relatórios básicos",
      "Suporte por email",
    ],
    cta: "Ativar e Começar a Faturar",
  },
  {
    id: "starter",
    name: "Starter",
    description: "Mais popular",
    price: 97,
    studentLimit: 15,
    extraStudentPrice: 6.47,
    features: [
      "Até 15 alunos inclusos",
      "Tudo do Beginner +",
      "Treinos com IA",
      "Análise de evolução",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
    highlighted: true,
    cta: "Ativar Agora - 7 Dias Grátis",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para crescer mais",
    price: 147,
    studentLimit: 25,
    extraStudentPrice: 5.88,
    features: [
      "Até 25 alunos inclusos",
      "Tudo do Starter +",
      "IA avançada",
      "Automações completas",
      "Integrações",
      "Suporte dedicado",
    ],
    cta: "Escalar Meu Faturamento",
  },
  {
    id: "business",
    name: "Business",
    description: "Para escalar",
    price: 197,
    studentLimit: 40,
    extraStudentPrice: 4.93,
    features: [
      "Até 40 alunos inclusos",
      "Tudo do Pro +",
      "Multi-personal",
      "API completa",
      "Onboarding VIP",
      "Gerente de conta",
    ],
    cta: "Dominar e Faturar Alto",
  },
  {
    id: "premium",
    name: "Premium",
    description: "Máximo poder",
    price: 297,
    studentLimit: 70,
    extraStudentPrice: 4.24,
    features: [
      "Até 70 alunos inclusos",
      "Tudo do Business +",
      "White-label",
      "Suporte 24/7",
      "Consultoria mensal",
      "Recursos exclusivos",
    ],
    cta: "Ser Referência no Mercado",
  },
];

// Planos por perfil
const PLANS_BY_PROFILE: Record<string, PricingPlan[]> = {
  beginner: [
    {
      id: "beginner",
      name: "Beginner",
      description: "Perfeito para começar",
      price: 39.9,
      studentLimit: 5,
      extraStudentPrice: 7.98,
      features: [
        "Até 5 alunos inclusos",
        "Gestão completa de alunos",
        "Treinos personalizados",
        "Cobranças automáticas",
        "Relatórios básicos",
        "Suporte por email",
      ],
      cta: "Ativar e Faturar Mais",
    },
    {
      id: "starter",
      name: "Starter",
      description: "Mais popular",
      price: 97,
      studentLimit: 15,
      extraStudentPrice: 6.47,
      features: [
        "Até 15 alunos inclusos",
        "Tudo do Beginner +",
        "Treinos com IA",
        "Análise de evolução",
        "Relatórios avançados",
        "Suporte prioritário",
      ],
      highlighted: true,
      cta: "Ativar Agora - Teste Grátis",
    },
    {
      id: "pro",
      name: "Pro",
      description: "Para crescer mais",
      price: 147,
      studentLimit: 25,
      extraStudentPrice: 5.88,
      features: [
        "Até 25 alunos inclusos",
        "Tudo do Starter +",
        "IA avançada",
        "Automações completas",
        "Integrações",
        "Suporte dedicado",
      ],
      cta: "Escalar Meu Negócio",
    },
  ],
  starter: [
    {
      id: "starter",
      name: "Starter",
      description: "Ideal para você",
      price: 97,
      studentLimit: 15,
      extraStudentPrice: 6.47,
      features: [
        "Até 15 alunos inclusos",
        "Gestão completa de alunos",
        "Treinos com IA",
        "Cobranças automáticas",
        "Análise de evolução",
        "Relatórios avançados",
        "Suporte prioritário",
      ],
      highlighted: true,
      cta: "Ativar Agora - Teste Grátis",
    },
    {
      id: "pro",
      name: "Pro",
      description: "Para crescer mais",
      price: 147,
      studentLimit: 25,
      extraStudentPrice: 5.88,
      features: [
        "Até 25 alunos inclusos",
        "Tudo do Starter +",
        "IA avançada",
        "Automações completas",
        "Integrações",
        "Suporte dedicado",
      ],
      cta: "Escalar Meu Negócio",
    },
    {
      id: "business",
      name: "Business",
      description: "Para escalar",
      price: 197,
      studentLimit: 40,
      extraStudentPrice: 4.93,
      features: [
        "Até 40 alunos inclusos",
        "Tudo do Pro +",
        "Multi-personal",
        "API completa",
        "Onboarding VIP",
        "Gerente de conta",
      ],
      cta: "Faturar no Próximo Nível",
    },
  ],
  pro: [
    {
      id: "pro",
      name: "Pro",
      description: "Ideal para você",
      price: 147,
      studentLimit: 25,
      extraStudentPrice: 5.88,
      features: [
        "Até 25 alunos inclusos",
        "Gestão completa de alunos",
        "Treinos com IA avançada",
        "Cobranças automáticas",
        "Automações completas",
        "Integrações",
        "Suporte dedicado",
      ],
      highlighted: true,
      cta: "Ativar Agora - Teste Grátis",
    },
    {
      id: "business",
      name: "Business",
      description: "Para escalar",
      price: 197,
      studentLimit: 40,
      extraStudentPrice: 4.93,
      features: [
        "Até 40 alunos inclusos",
        "Tudo do Pro +",
        "Multi-personal",
        "API completa",
        "Onboarding VIP",
        "Gerente de conta",
      ],
      cta: "Escalar Meu Negócio",
    },
    {
      id: "premium",
      name: "Premium",
      description: "Máximo poder",
      price: 297,
      studentLimit: 70,
      extraStudentPrice: 4.24,
      features: [
        "Até 70 alunos inclusos",
        "Tudo do Business +",
        "White-label",
        "Suporte 24/7",
        "Consultoria mensal",
        "Recursos exclusivos",
      ],
      cta: "Faturar no Próximo Nível",
    },
  ],
  business: [
    {
      id: "business",
      name: "Business",
      description: "Ideal para você",
      price: 197,
      studentLimit: 40,
      extraStudentPrice: 4.93,
      features: [
        "Até 40 alunos inclusos",
        "Gestão completa de alunos",
        "Treinos com IA avançada",
        "Cobranças automáticas",
        "Multi-personal",
        "API completa",
        "Gerente de conta",
      ],
      highlighted: true,
      cta: "Ativar Agora - Teste Grátis",
    },
    {
      id: "premium",
      name: "Premium",
      description: "Máximo poder",
      price: 297,
      studentLimit: 70,
      extraStudentPrice: 4.24,
      features: [
        "Até 70 alunos inclusos",
        "Tudo do Business +",
        "White-label",
        "Suporte 24/7",
        "Consultoria mensal",
        "Recursos exclusivos",
      ],
      cta: "Escalar Meu Negócio",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Ilimitado",
      price: 497,
      studentLimit: 150,
      extraStudentPrice: 3.31,
      features: [
        "Até 150 alunos inclusos",
        "Tudo do Premium +",
        "Infraestrutura dedicada",
        "SLA garantido",
        "Desenvolvimento custom",
        "Suporte VIP",
      ],
      cta: "Faturar no Próximo Nível",
    },
  ],
};

// Dores que FitPrime resolve
const PAIN_SOLUTIONS = [
  {
    pain: "Perda de informações",
    icon: AlertTriangle,
    problem: "Você perde dados de alunos em planilhas, WhatsApp e cadernos",
    solution: "Tudo centralizado em um só lugar, acessível de qualquer dispositivo",
  },
  {
    pain: "Tempo com admin",
    icon: Clock,
    problem: "Gasta horas por semana com cobranças, agendamentos e mensagens",
    solution: "Automações que fazem o trabalho chato por você",
  },
  {
    pain: "Alunos desistindo",
    icon: Users,
    problem: "Alunos somem sem avisar e você não sabe o motivo",
    solution: "Alertas de risco e análise de engajamento para agir antes",
  },
  {
    pain: "Inadimplência",
    icon: CreditCard,
    problem: "Tem que ficar cobrando aluno e é constrangedor",
    solution: "Cobranças automáticas por PIX, cartão ou boleto",
  },
  {
    pain: "Falta de profissionalismo",
    icon: Target,
    problem: "Seus alunos não veem você como um profissional sério",
    solution: "App próprio com sua marca para impressionar seus alunos",
  },
  {
    pain: "Sem dados para crescer",
    icon: BarChart3,
    problem: "Não sabe quais alunos estão evoluindo ou quem vai cancelar",
    solution: "Dashboards e relatórios que mostram tudo em tempo real",
  },
];

// Benefícios principais
const BENEFITS = [
  {
    icon: Brain,
    title: "IA que cria treinos",
    description: "Treinos personalizados gerados em segundos pela nossa IA",
  },
  {
    icon: CreditCard,
    title: "Cobranças automáticas",
    description: "PIX, cartão ou boleto. Você não precisa cobrar ninguém",
  },
  {
    icon: Calendar,
    title: "Agenda inteligente",
    description: "Seus alunos marcam horários direto no app, sem WhatsApp",
  },
  {
    icon: TrendingUp,
    title: "Análise de evolução",
    description: "Mostre aos alunos o progresso deles com gráficos bonitos",
  },
  {
    icon: Bell,
    title: "Alertas de risco",
    description: "Saiba quem vai cancelar antes que aconteça",
  },
  {
    icon: Shield,
    title: "Dados seguros",
    description: "Seus dados e dos seus alunos protegidos com criptografia",
  },
];

// Testimoniais
const TESTIMONIALS = [
  {
    name: "Carlos Silva",
    role: "Personal Trainer há 5 anos",
    avatar: "CS",
    text: "Antes eu gastava 10 horas por semana com admin. Agora gasto menos de 1 hora. Consegui pegar mais 8 alunos porque tenho tempo.",
    students: "De 12 para 20 alunos",
    revenue: "+67% de receita",
  },
  {
    name: "Ana Paula",
    role: "Personal Trainer há 3 anos",
    avatar: "AP",
    text: "Meus alunos adoram ver a evolução deles no app. A retenção melhorou muito, quase não perco mais alunos.",
    students: "De 8 para 15 alunos",
    revenue: "+88% de receita",
  },
  {
    name: "Roberto Santos",
    role: "Personal Trainer há 8 anos",
    avatar: "RS",
    text: "A cobrança automática mudou minha vida. Não preciso mais ficar constrangido cobrando aluno. O dinheiro cai sozinho.",
    students: "25 alunos",
    revenue: "Zero inadimplência",
  },
];

// FAQ
const FAQ_ITEMS = [
  {
    question: "Posso testar antes de pagar?",
    answer: "Sim! Você tem 7 dias grátis para testar todas as funcionalidades. Se não gostar, cancela sem pagar nada.",
  },
  {
    question: "E se eu tiver mais alunos que o limite do plano?",
    answer: "Sem problemas! Você paga um valor extra por aluno adicional. É mais barato que fazer upgrade de plano se você só precisa de alguns alunos a mais.",
  },
  {
    question: "Meus alunos precisam baixar algum app?",
    answer: "Não obrigatoriamente. Eles podem acessar pelo navegador. Mas se quiserem, podem baixar o app para uma experiência melhor.",
  },
  {
    question: "Consigo migrar meus dados de outro sistema?",
    answer: "Sim! Nossa equipe ajuda você a migrar todos os dados de alunos, treinos e histórico gratuitamente.",
  },
  {
    question: "E se eu quiser cancelar?",
    answer: "Você pode cancelar a qualquer momento, sem multa. Seus dados ficam disponíveis por 30 dias para você exportar.",
  },
  {
    question: "Funciona para personal online também?",
    answer: "Sim! FitPrime funciona perfeitamente para personal presencial, online ou híbrido.",
  },
];

export default function CompletePricingPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const profile = params.get("profile") || "starter";
  const painsParam = params.get("pains") || "";
  const userPains = painsParam ? painsParam.split(",") : [];
  
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [showAllPlans, setShowAllPlans] = useState(true); // Mostrar todos os planos por padrão
  const [, setLocation] = useLocation();

  // Se showAllPlans = true, mostra todos os planos, senão mostra baseado no perfil
  const plans = showAllPlans ? ALL_PLANS : (PLANS_BY_PROFILE[profile] || PLANS_BY_PROFILE.starter);

  // Meta Pixel - ViewContent para página de preços completa
  useEffect(() => {
    pixelEvents.viewContent({
      contentId: 'pricing_complete',
      contentName: 'Página de Preços Completa',
      contentType: 'product_group',
      contentCategory: 'pricing',
    });
  }, []);

  // Scroll suave para seção de planos
  const scrollToPlans = () => {
    document.getElementById("plans-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
        <div className="relative max-w-6xl mx-auto text-center">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            Baseado nas suas respostas
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Chega de perder tempo com{" "}
            <span className="text-emerald-600">planilhas e WhatsApp</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            FitPrime é o sistema completo que vai organizar seus alunos, automatizar suas cobranças 
            e te dar tempo para fazer o que você ama: treinar pessoas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 text-lg px-8"
              onClick={scrollToPlans}
            >
              Ver Planos <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8"
              onClick={() => window.open("https://wa.me/5511999999999", "_blank")}
            >
              Falar com Consultor
            </Button>
          </div>
          
          {/* Social Proof */}
          <div className="mt-12 flex flex-wrap justify-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              <span><strong>2.500+</strong> personals usam</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span><strong>4.9/5</strong> de avaliação</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span><strong>+67%</strong> de receita média</span>
            </div>
          </div>
        </div>
      </section>

      {/* Dores que Resolvemos */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Identificamos seus desafios
            </h2>
            <p className="text-xl text-gray-600">
              E temos a solução para cada um deles
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PAIN_SOLUTIONS.map((item, index) => (
              <Card key={index} className="border-2 hover:border-emerald-200 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <item.icon className="h-6 w-6 text-red-600" />
                    </div>
                    <CardTitle className="text-lg">{item.pain}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-2">
                    <X className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-600 text-sm">{item.problem}</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-900 text-sm font-medium">{item.solution}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 px-4 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600">
              Funcionalidades que vão transformar seu negócio
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BENEFITS.map((benefit, index) => (
              <div key={index} className="flex gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg h-fit">
                  <benefit.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Personals que transformaram seus negócios
            </h2>
            <p className="text-xl text-gray-600">
              Veja o que eles têm a dizer
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {TESTIMONIALS.map((testimonial, index) => (
              <Card key={index} className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex gap-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Alunos</p>
                      <p className="font-semibold text-emerald-600">{testimonial.students}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Resultado</p>
                      <p className="font-semibold text-emerald-600">{testimonial.revenue}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Planos */}
      <section id="plans-section" className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
              Plano recomendado para você
            </Badge>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Escolha o plano ideal
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              Todos os planos incluem 7 dias grátis para testar
            </p>
            {!showAllPlans && (
              <Button 
                variant="link" 
                className="text-emerald-600 hover:text-emerald-700"
                onClick={() => setShowAllPlans(true)}
              >
                Ver todos os planos disponíveis <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            )}
            {showAllPlans && (
              <Button 
                variant="link" 
                className="text-emerald-600 hover:text-emerald-700"
                onClick={() => setShowAllPlans(false)}
              >
                Ver planos recomendados <ChevronUp className="ml-1 h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className={`grid gap-6 ${showAllPlans ? 'md:grid-cols-5' : 'md:grid-cols-3'}`}>
            {plans.map((plan, index) => (
              <Card 
                key={plan.id} 
                className={`relative ${plan.highlighted ? "border-2 border-emerald-500 shadow-lg scale-105" : "border"}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-emerald-500 text-white">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <span className="text-4xl font-bold text-gray-900">
                      R$ {plan.price.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Alunos Inclusos:</span>
                      <span className="font-semibold">{plan.studentLimit}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Aluno Extra:</span>
                      <span className="font-semibold">+ R$ {plan.extraStudentPrice.toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.highlighted ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <p className="text-center text-xs text-gray-500">
                    ✓ 7 dias grátis ✓ Sem cartão de crédito
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Dúvidas Frequentes
            </h2>
          </div>
          
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:border-emerald-200 transition-colors"
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
              >
                <CardContent className="py-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">{item.question}</h3>
                    {expandedFaq === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                  {expandedFaq === index && (
                    <p className="mt-3 text-gray-600">{item.answer}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Pronto para transformar seu negócio?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a mais de 2.500 personals que já estão crescendo com FitPrime
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-emerald-600 hover:bg-gray-100 text-lg px-8"
              onClick={scrollToPlans}
            >
              Começar Agora <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          <p className="mt-6 text-sm opacity-75">
            7 dias grátis • Sem cartão de crédito • Cancele quando quiser
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400 text-center text-sm">
        <p>© 2024 FitPrime Manager. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
