import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trackPageView, trackPricingViewed, trackPlanSelected } from "@/lib/analytics";
import { pixelEvents } from "@/lib/tracking-pixels";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight, Zap, ExternalLink } from "lucide-react";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import { FITPRIME_PLANS, getCheckoutUrl } from "../../../shared/caktoPlans";

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

export default function DynamicPricingPage() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<string>("beginner");
  const [quizResult, setQuizResult] = useState<any>(null);

  // Tracking de page view e ViewContent
  useEffect(() => {
    trackPageView('/pricing');
    trackPricingViewed('dynamic_pricing_page');
    // Meta Pixel - ViewContent para página de preços
    pixelEvents.viewContent({
      contentId: 'pricing_page',
      contentName: 'Página de Preços Dinâmica',
      contentType: 'product_group',
      contentCategory: 'pricing',
    });
  }, []);

  useEffect(() => {
    // Obter profile da URL
    const params = new URLSearchParams(search);
    const urlProfile = params.get("profile") || "beginner";
    setProfile(urlProfile);

    // Obter resultado do quiz do localStorage
    const stored = localStorage.getItem("quizResult");
    if (stored) {
      setQuizResult(JSON.parse(stored));
    }
  }, [search]);

  const plans = PLANS_BY_PROFILE[profile] || PLANS_BY_PROFILE.beginner;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4">
      <ExitIntentPopup enabled={true} delay={5000} />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Planos Personalizados para Você</h1>
          <p className="text-xl text-gray-600 mb-2">
            Baseado nas suas respostas, aqui estão os 3 melhores planos para seu negócio
          </p>
          {quizResult && (
            <p className="text-lg text-emerald-600 font-semibold">
              ✨ {quizResult.message}
            </p>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
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
                {/* Preço */}
                <div>
                  <div className="text-4xl font-bold mb-1">
                    R$ {plan.price.toFixed(2)}
                  </div>
                  <p className="text-gray-600">/mês</p>
                </div>

                {/* Detalhes */}
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

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => {
                    // Tracking de seleção de plano
                    trackPlanSelected(plan.id, plan.name, plan.price);
                    
                    // Usar link direto da Cakto se disponível
                    const checkoutUrl = getCheckoutUrl(plan.id);
                    if (checkoutUrl) {
                      window.location.href = checkoutUrl;
                    } else {
                      window.location.href = `/checkout?plan=${plan.id}`;
                    }
                  }}
                  className={`w-full h-12 text-base ${
                    plan.highlighted
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                  }`}
                >
                  {plan.cta} <ExternalLink className="ml-2 w-4 h-4" />
                </Button>

                {/* Garantia */}
                <p className="text-center text-sm text-gray-500">
                  ✓ 30 dias de teste gratuito  
                  ✓ Sem cartão de crédito
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Dúvidas Frequentes</h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso mudar de plano depois?</CardTitle>
              </CardHeader>
              <CardContent>
                Sim! Você pode fazer upgrade ou downgrade a qualquer momento. A mudança entra em vigor no próximo ciclo de cobrança.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">E se eu ultrapassar o limite de alunos?</CardTitle>
              </CardHeader>
              <CardContent>
                Sem problema! Você paga apenas pelos alunos extras. Por exemplo, no Starter com 20 alunos: R$ 97 + (5 × R$ 6,47) = R$ 129,35.
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posso cancelar quando quiser?</CardTitle>
              </CardHeader>
              <CardContent>
                Claro! Sem multa, sem burocracia. Você pode cancelar a qualquer momento pelo painel.
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
