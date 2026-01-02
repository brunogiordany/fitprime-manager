import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
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
        "Até 5 alunos",
        "Treinos personalizados",
        "Acompanhamento básico",
        "Cobranças automáticas",
        "Suporte por email",
      ],
      cta: "Começar Agora",
    },
    {
      id: "starter",
      name: "Starter",
      description: "Próximo passo do seu crescimento",
      price: 97,
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
      highlighted: true,
      cta: "Testar 7 Dias",
    },
    {
      id: "pro",
      name: "Pro",
      description: "Para profissionais em crescimento",
      price: 147,
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
      cta: "Agendar Demo",
    },
  ],
  starter: [
    {
      id: "starter",
      name: "Starter",
      description: "Seu plano atual recomendado",
      price: 97,
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
      highlighted: true,
      cta: "Começar Agora",
    },
    {
      id: "pro",
      name: "Pro",
      description: "Próximo passo para crescer",
      price: 147,
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
      cta: "Testar 7 Dias",
    },
    {
      id: "business",
      name: "Business",
      description: "Para negócios em escala",
      price: 197,
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
      cta: "Falar com Especialista",
    },
  ],
  pro: [
    {
      id: "pro",
      name: "Pro",
      description: "Seu plano atual recomendado",
      price: 147,
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
      highlighted: true,
      cta: "Começar Agora",
    },
    {
      id: "business",
      name: "Business",
      description: "Próximo passo para escalar",
      price: 197,
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
      cta: "Testar 7 Dias",
    },
    {
      id: "premium",
      name: "Premium",
      description: "Solução completa",
      price: 297,
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
      cta: "Falar com Especialista",
    },
  ],
  business: [
    {
      id: "business",
      name: "Business",
      description: "Seu plano atual recomendado",
      price: 197,
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
      highlighted: true,
      cta: "Começar Agora",
    },
    {
      id: "premium",
      name: "Premium",
      description: "Próximo nível de crescimento",
      price: 297,
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
      cta: "Testar 7 Dias",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Solução customizada",
      price: 497,
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
      cta: "Falar com Especialista",
    },
  ],
};

export default function CompletePricingPage() {
  const search = useSearch();
  const [profile, setProfile] = useState<string>("beginner");
  const [quizResult, setQuizResult] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const urlProfile = params.get("profile") || "beginner";
    setProfile(urlProfile);

    const stored = localStorage.getItem("quizResult");
    if (stored) {
      setQuizResult(JSON.parse(stored));
    }
  }, [search]);

  const plans = PLANS_BY_PROFILE[profile] || PLANS_BY_PROFILE.beginner;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">Transforme Seu Negócio de Personal</h1>
          <p className="text-2xl text-gray-600 mb-2">Organize, cresça e ganhe mais com FitPrime</p>
          {quizResult && (
            <p className="text-lg text-emerald-600 font-semibold">
              ✨ {quizResult.message}
            </p>
          )}
        </div>
      </section>

      {/* Benefícios Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Por Que FitPrime?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: "Recupere 10+ Horas por Semana",
                description:
                  "Automatize admin, treinos e cobranças. Tenha tempo para crescer e treinar seus alunos.",
              },
              {
                icon: TrendingUp,
                title: "Cresça 3x em 6 Meses",
                description:
                  "Nossos clientes crescem em média 3x. Você pode ser o próximo.",
              },
              {
                icon: Users,
                title: "Retenha Seus Alunos",
                description:
                  "Acompanhamento automático reduz churn. Alunos veem progresso e ficam.",
              },
              {
                icon: BarChart3,
                title: "Dados que Vendem",
                description:
                  "Relatórios que mostram progresso. Alunos veem resultados e renovam.",
              },
              {
                icon: MessageSquare,
                title: "Comunicação Automática",
                description:
                  "Mensagens, lembretes e atualizações automáticas. Sem esquecer ninguém.",
              },
              {
                icon: Shield,
                title: "Segurança e Confiança",
                description:
                  "Seus dados protegidos. Cobranças seguras. Compliance garantido.",
              },
            ].map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <Card key={idx} className="border border-gray-200">
                  <CardHeader>
                    <Icon className="w-12 h-12 text-emerald-600 mb-4" />
                    <CardTitle>{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dores que Resolvemos */}
      <section className="py-20 px-4 bg-red-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Seus Problemas, Nossa Solução</h2>
          <p className="text-center text-gray-600 mb-16 text-lg">
            Identificamos {quizResult?.pains?.length || 0} dores no seu negócio. FitPrime resolve todas elas.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                pain: "Desorganização",
                problem: "Alunos em planilhas, WhatsApp, caderno... Você não sabe quem é quem.",
                solution: "Tudo centralizado. Um lugar para tudo. Organização automática.",
              },
              {
                pain: "Churn (Perda de Alunos)",
                problem: "Alunos desistem sem avisar. Você não sabe por quê.",
                solution: "Acompanhamento automático. Alunos se sentem cuidados. Ficam.",
              },
              {
                pain: "Falta de Tempo",
                problem: "10+ horas por semana com admin. Sem tempo para crescer.",
                solution: "Automação completa. Recupere seu tempo. Foque em treinar.",
              },
              {
                pain: "Problemas Financeiros",
                problem: "Cobranças manuais, inadimplência, alunos que esquecem de pagar.",
                solution: "Cobranças automáticas. Receba no dia. Zero inadimplência.",
              },
              {
                pain: "Falta de Dados",
                problem: "Não sabe qual treino funciona. Decisões baseadas em achismo.",
                solution: "Relatórios inteligentes. Dados que vendem. Decisões baseadas em fatos.",
              },
              {
                pain: "Falta de Crescimento",
                problem: "Está preso no mesmo lugar. Não consegue escalar.",
                solution: "Sistema que cresce com você. De 5 para 150 alunos sem caos.",
              },
            ].map((item, idx) => (
              <Card key={idx} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <CardTitle className="text-red-600">{item.pain}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold mb-1">O Problema:</p>
                    <p className="text-gray-700">{item.problem}</p>
                  </div>
                  <div>
                    <p className="text-sm text-emerald-600 font-semibold mb-1">Nossa Solução:</p>
                    <p className="text-gray-700">{item.solution}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Planos Personalizados para Você</h2>
          <p className="text-center text-gray-600 mb-16 text-lg">
            Baseado nas suas respostas, aqui estão os 3 melhores planos para seu negócio
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative transition-all ${
                  plan.highlighted
                    ? "md:scale-105 border-2 border-emerald-500 shadow-2xl"
                    : "border border-gray-200"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-emerald-600 text-white px-4 py-1">
                      <Zap className="w-3 h-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className={plan.highlighted ? "pt-8" : ""}>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                  <div>
                    <div className="text-4xl font-bold mb-1">R$ {plan.price.toFixed(2)}</div>
                    <p className="text-gray-600">/mês</p>
                  </div>

                  <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Alunos Inclusos:</span>
                      <span className="font-semibold">{plan.studentLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Aluno Extra:</span>
                      <span className="font-semibold">+ R$ {plan.extraStudentPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => {
                      window.location.href = `/checkout?plan=${plan.id}`;
                    }}
                    className={`w-full h-12 text-base ${
                      plan.highlighted
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}
                  >
                    {plan.cta} <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>

                  <p className="text-center text-sm text-gray-500">
                    ✓ 30 dias de teste gratuito  
                    ✓ Sem cartão de crédito
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-emerald-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">O Que Nossos Clientes Dizem</h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Bruno Giordany",
                role: "Personal Trainer",
                text: "Triplicamos nossos alunos em 6 meses. FitPrime fez toda a diferença.",
                rating: 5,
              },
              {
                name: "Ana Silva",
                role: "Proprietária de Academia",
                text: "Recuperei 15 horas por semana. Agora tenho tempo para crescer.",
                rating: 5,
              },
              {
                name: "Carlos Santos",
                role: "Personal Trainer",
                text: "Cobranças automáticas resolveram meu problema de inadimplência.",
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <Card key={idx} className="border border-emerald-200">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>{testimonial.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">Dúvidas Frequentes</h2>

          <div className="space-y-4">
            {[
              {
                q: "Posso mudar de plano depois?",
                a: "Sim! Você pode fazer upgrade ou downgrade a qualquer momento. A mudança entra em vigor no próximo ciclo de cobrança.",
              },
              {
                q: "E se eu ultrapassar o limite de alunos?",
                a: "Sem problema! Você paga apenas pelos alunos extras. Por exemplo, no Starter com 20 alunos: R$ 97 + (5 × R$ 6,47) = R$ 129,35.",
              },
              {
                q: "Posso cancelar quando quiser?",
                a: "Claro! Sem multa, sem burocracia. Você pode cancelar a qualquer momento pelo painel.",
              },
              {
                q: "Quanto tempo leva para começar?",
                a: "Menos de 5 minutos! Você cria a conta, importa seus alunos e pronto. Está rodando.",
              },
              {
                q: "Meus dados estão seguros?",
                a: "100% seguro. Usamos criptografia de ponta a ponta. Seus dados nunca são compartilhados.",
              },
            ].map((faq, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.q}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-emerald-600 to-teal-600">
        <div className="max-w-2xl mx-auto text-center text-white">
          <h2 className="text-4xl font-bold mb-4">Pronto para Transformar Seu Negócio?</h2>
          <p className="text-xl mb-8">
            Escolha seu plano e comece agora. 30 dias de teste gratuito, sem cartão de crédito.
          </p>
          <Button
            onClick={() => {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="bg-white text-emerald-600 hover:bg-gray-100 text-lg h-12 px-8"
          >
            Ver Planos <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
