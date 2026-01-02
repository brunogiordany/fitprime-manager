import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Target,
  ArrowRight,
  Users,
  DollarSign,
  Clock,
  Sparkles,
  Star,
  Zap,
  Crown,
  Gift,
  Heart,
  Shield,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { FITPRIME_PLANS, getCheckoutUrl } from "../../../shared/caktoPlans";
import ExitIntentPopup from "@/components/ExitIntentPopup";

interface QuizResult {
  painScore: number;
  solutionScore: number;
  currentStudents: number;
  currentRevenue: number;
  goalRevenue: number;
  desiredBenefits: string[];
  recommendedPlan: string;
  answers: Record<string, string | string[]>;
}

interface RecommendedPlan {
  id: string;
  name: string;
  price: number;
  studentLimit: number;
  extraStudentPrice: number;
  description: string;
  features: string[];
  matchScore: number;
  isRecommended: boolean;
  badge?: string;
  icon: React.ReactNode;
}

// Função para calcular os 3 melhores planos baseado no quiz
function getRecommendedPlans(result: QuizResult): RecommendedPlan[] {
  const students = result.currentStudents || 5;
  const goalRevenue = result.goalRevenue || 5000;
  const painScore = result.painScore || 0;
  const solutionScore = result.solutionScore || 0;

  // Definir todos os planos com scores de match
  const allPlans: RecommendedPlan[] = [
    {
      id: "beginner",
      name: "Beginner",
      price: 39.9,
      studentLimit: 5,
      extraStudentPrice: 7.98,
      description: "Ideal para quem está começando",
      features: [
        "Até 5 alunos",
        "Treinos personalizados",
        "Acompanhamento básico",
        "Cobranças automáticas",
        "Suporte por email",
      ],
      matchScore: 0,
      isRecommended: false,
      icon: <Gift className="w-6 h-6" />,
    },
    {
      id: "starter",
      name: "Starter",
      price: 97,
      studentLimit: 15,
      extraStudentPrice: 6.47,
      description: "Para personais em crescimento",
      features: [
        "Até 15 alunos",
        "Treinos com IA básica",
        "Acompanhamento completo",
        "Cobranças automáticas",
        "Relatórios detalhados",
        "Suporte prioritário",
      ],
      matchScore: 0,
      isRecommended: false,
      icon: <Rocket className="w-6 h-6" />,
    },
    {
      id: "pro",
      name: "Pro",
      price: 147,
      studentLimit: 25,
      extraStudentPrice: 5.88,
      description: "Para profissionais consolidados",
      features: [
        "Até 25 alunos",
        "Treinos com IA avançada",
        "Acompanhamento 24/7",
        "Cobranças automáticas",
        "Relatórios avançados",
        "Integração com apps",
        "Suporte dedicado",
      ],
      matchScore: 0,
      isRecommended: false,
      badge: "Mais Popular",
      icon: <Star className="w-6 h-6" />,
    },
    {
      id: "business",
      name: "Business",
      price: 197,
      studentLimit: 40,
      extraStudentPrice: 4.93,
      description: "Para estúdios pequenos",
      features: [
        "Até 40 alunos",
        "Treinos com IA premium",
        "Múltiplos personais",
        "Cobranças automáticas",
        "API completa",
        "Onboarding dedicado",
        "Suporte 24/7",
      ],
      matchScore: 0,
      isRecommended: false,
      icon: <Shield className="w-6 h-6" />,
    },
    {
      id: "premium",
      name: "Premium",
      price: 297,
      studentLimit: 70,
      extraStudentPrice: 4.24,
      description: "Para grandes operações",
      features: [
        "Até 70 alunos",
        "Tudo do Business +",
        "Gestão multi-unidades",
        "Consultoria estratégica",
        "SLA garantido",
        "Gerente de conta",
      ],
      matchScore: 0,
      isRecommended: false,
      icon: <Crown className="w-6 h-6" />,
    },
  ];

  // Calcular score de match para cada plano
  allPlans.forEach((plan) => {
    let score = 0;

    // Score baseado no número de alunos (40%)
    if (students <= plan.studentLimit) {
      const utilizationRatio = students / plan.studentLimit;
      if (utilizationRatio >= 0.5 && utilizationRatio <= 0.9) {
        score += 40; // Ideal: usando 50-90% da capacidade
      } else if (utilizationRatio < 0.5) {
        score += 20; // Plano grande demais
      } else {
        score += 30; // Quase no limite
      }
    } else {
      score += 10; // Plano pequeno demais
    }

    // Score baseado no objetivo de receita (30%)
    const estimatedRevenue = plan.studentLimit * 200; // Média de R$200/aluno
    if (estimatedRevenue >= goalRevenue * 0.8) {
      score += 30;
    } else if (estimatedRevenue >= goalRevenue * 0.5) {
      score += 20;
    } else {
      score += 10;
    }

    // Score baseado no nível de dor (15%)
    if (painScore >= 15) {
      // Alta dor = precisa de mais recursos
      if (plan.id === "pro" || plan.id === "business") score += 15;
      else if (plan.id === "starter") score += 10;
      else score += 5;
    } else if (painScore >= 10) {
      if (plan.id === "starter" || plan.id === "pro") score += 15;
      else score += 8;
    } else {
      if (plan.id === "beginner" || plan.id === "starter") score += 15;
      else score += 5;
    }

    // Score baseado no interesse em soluções (15%)
    if (solutionScore >= 7) {
      // Alto interesse em automação
      if (plan.id === "pro" || plan.id === "business" || plan.id === "premium") score += 15;
      else score += 8;
    } else {
      score += 10;
    }

    plan.matchScore = score;
  });

  // Ordenar por score e pegar os 3 melhores
  const sortedPlans = allPlans.sort((a, b) => b.matchScore - a.matchScore);
  const top3 = sortedPlans.slice(0, 3);

  // Marcar o melhor como recomendado
  top3[0].isRecommended = true;

  return top3;
}

export default function QuizResultPage() {
  const [, setLocation] = useLocation();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [recommendedPlans, setRecommendedPlans] = useState<RecommendedPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar resultado do localStorage
    const storedResult = localStorage.getItem("quizResult");
    if (storedResult) {
      try {
        const parsed = JSON.parse(storedResult);
        setResult(parsed);
        setRecommendedPlans(getRecommendedPlans(parsed));
      } catch (e) {
        console.error("Erro ao carregar resultado do quiz:", e);
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Resultado não encontrado</h1>
          <p className="text-gray-600 mb-6">
            Parece que você ainda não completou o quiz de qualificação.
          </p>
          <Button onClick={() => setLocation("/quiz")} className="bg-emerald-600 hover:bg-emerald-700">
            Fazer o Quiz Agora
          </Button>
        </div>
      </div>
    );
  }

  // Calcular métricas do diagnóstico com valores padrão
  const painScore = result.painScore || 0;
  const currentStudents = result.currentStudents || 5;
  const currentRevenue = result.currentRevenue || 0;
  const goalRevenue = result.goalRevenue || 5000;
  
  const painLevel = painScore >= 15 ? "alto" : painScore >= 10 ? "médio" : "baixo";
  const timeSaved = Math.round(painScore * 0.8) || 2;
  const potentialGain = Math.round((goalRevenue - currentRevenue) * 0.3) || 1500;

  const handleSelectPlan = (planId: string) => {
    const checkoutUrl = getCheckoutUrl(planId);
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank");
    } else {
      setLocation(`/checkout?plan=${planId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8 px-4">
      <ExitIntentPopup enabled={true} delay={5000} />
      
      <div className="max-w-6xl mx-auto">
        {/* Header com Diagnóstico */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full mb-4">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Análise Completa!</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Seu Diagnóstico Personalizado
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Baseado nas suas respostas, identificamos seu perfil e selecionamos os 3 melhores planos para você
          </p>
        </div>

        {/* Cards de Diagnóstico */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <span className="font-semibold text-amber-800">Nível de Dor</span>
              </div>
              <p className="text-2xl font-bold text-amber-900 mb-1 capitalize">{painLevel}</p>
              <p className="text-sm text-amber-700">
                Você perde ~{timeSaved}h/semana com tarefas manuais
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="font-semibold text-emerald-800">Potencial de Ganho</span>
              </div>
              <p className="text-2xl font-bold text-emerald-900 mb-1">
                +R$ {potentialGain.toLocaleString("pt-BR")}/mês
              </p>
              <p className="text-sm text-emerald-700">
                Crescimento estimado com automação
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="font-semibold text-blue-800">Seus Alunos</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mb-1">{currentStudents} ativos</p>
              <p className="text-sm text-blue-700">
                Meta: R$ {goalRevenue.toLocaleString("pt-BR")}/mês
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Título dos Planos */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Os 3 Planos Ideais Para Você
          </h2>
          <p className="text-gray-600">
            Selecionados com base no seu perfil e objetivos
          </p>
        </div>

        {/* Cards de Planos */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {recommendedPlans.map((plan, index) => (
            <Card
              key={plan.id}
              className={cn(
                "relative overflow-hidden transition-all duration-300 hover:shadow-xl",
                plan.isRecommended
                  ? "border-2 border-emerald-500 shadow-lg scale-[1.02]"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              {/* Badge de Recomendado */}
              {plan.isRecommended && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center py-2 text-sm font-semibold">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Recomendado para Você
                </div>
              )}

              {/* Badge do Plano */}
              {plan.badge && !plan.isRecommended && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-center py-2 text-sm font-semibold">
                  <Star className="w-4 h-4 inline mr-1" />
                  {plan.badge}
                </div>
              )}

              <CardHeader className={cn("pb-4", (plan.isRecommended || plan.badge) && "pt-12")}>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      plan.isRecommended ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {plan.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </div>
                </div>

                {/* Match Score */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-500">Compatibilidade</span>
                    <span className="font-semibold text-emerald-600">{plan.matchScore}%</span>
                  </div>
                  <Progress value={plan.matchScore} className="h-2" />
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Preço */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900">
                      R$ {plan.price.toFixed(2).replace(".", ",")}
                    </span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Até {plan.studentLimit} alunos • R$ {plan.extraStudentPrice.toFixed(2).replace(".", ",")}/aluno extra
                  </p>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={cn(
                    "w-full",
                    plan.isRecommended
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      : "bg-gray-800 hover:bg-gray-900"
                  )}
                >
                  {plan.isRecommended ? "Começar Agora" : "Escolher Plano"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Benefícios Desejados */}
        {result.desiredBenefits && result.desiredBenefits.length > 0 && (
          <Card className="mb-10 border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Heart className="w-5 h-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-purple-800">O que você mais deseja alcançar:</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.desiredBenefits.map((benefit) => (
                  <Badge key={benefit} variant="secondary" className="bg-purple-100 text-purple-800">
                    {benefit === "time" && "⏰ Mais tempo livre"}
                    {benefit === "freedom" && "🦅 Liberdade financeira"}
                    {benefit === "peace" && "🧘 Paz de espírito"}
                    {benefit === "growth" && "📈 Crescer meu negócio"}
                    {benefit === "quality" && "🌟 Melhor qualidade de vida"}
                    {benefit === "family" && "👨‍👩‍👧‍👦 Mais tempo com a família"}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Final */}
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Não encontrou o plano ideal?{" "}
            <button
              onClick={() => setLocation("/pricing-complete")}
              className="text-emerald-600 font-semibold hover:underline"
            >
              Ver todos os planos
            </button>
          </p>
          <p className="text-sm text-gray-500">
            Dúvidas? Fale com nosso suporte pelo chat ou WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}
