import { useState } from "react";
import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  Users,
  DollarSign,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Smartphone,
  Globe,
  Calendar,
  TrendingUp,
  Heart,
  Zap,
  Sparkles,
  Phone,
  Mail,
  ExternalLink,
  Loader2,
  Copy,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

// Mapeamento de IDs para textos legíveis
const ANSWER_LABELS: Record<string, Record<string, string>> = {
  pain_organization: {
    excel: "Planilhas no Excel/Google Sheets",
    paper: "Papel e caneta",
    whatsapp: "Mando por WhatsApp mesmo",
    memory: "Guardo tudo na memória",
    app: "Uso um app/sistema",
  },
  pain_time: {
    "2h": "Menos de 2 horas",
    "5h": "Entre 2 e 5 horas",
    "10h": "Entre 5 e 10 horas",
    "15h": "Mais de 10 horas",
  },
  pain_payment: {
    never: "Nunca, todos pagam em dia",
    rarely: "Raramente, 1-2 vezes por mês",
    sometimes: "Às vezes, toda semana tem alguém",
    always: "Sempre, é uma luta constante",
  },
  pain_churn: {
    "0": "Nenhum",
    "1-2": "1 a 2 alunos",
    "3-5": "3 a 5 alunos",
    "5+": "Mais de 5 alunos",
  },
  solution_auto_billing: {
    yes_urgent: "SIM! Preciso muito disso",
    yes: "Sim, seria ótimo",
    maybe: "Talvez, depende de como funciona",
    no: "Não, prefiro cobrar manualmente",
  },
  solution_ai_training: {
    yes_urgent: "SIM! Isso mudaria minha vida",
    yes: "Sim, economizaria muito tempo",
    curious: "Interessante, quero saber mais",
    no: "Prefiro criar tudo manualmente",
  },
  solution_dashboard: {
    yes_urgent: "SIM! Estou cansado de usar 5 apps diferentes",
    yes: "Sim, facilitaria muito",
    maybe: "Talvez, se for fácil de usar",
    no: "Não, estou bem com meu sistema atual",
  },
  financial_students: {
    "1-5": "1 a 5 alunos",
    "6-15": "6 a 15 alunos",
    "16-30": "16 a 30 alunos",
    "31-50": "31 a 50 alunos",
    "51-100": "51 a 100 alunos",
    "100+": "Mais de 100 alunos",
  },
  financial_revenue: {
    no_income: "Ainda não tenho renda como personal",
    "2k": "Até R$ 2.000",
    "5k": "R$ 2.000 a R$ 5.000",
    "10k": "R$ 5.000 a R$ 10.000",
    "10k+": "Mais de R$ 10.000",
  },
  goals_revenue: {
    "5k": "R$ 5.000 por mês",
    "10k": "R$ 10.000 por mês",
    "15k": "R$ 15.000 por mês",
    "20k+": "R$ 20.000+ por mês",
  },
  goals_benefits: {
    time: "Mais tempo livre",
    freedom: "Liberdade financeira",
    peace: "Paz de espírito",
    growth: "Crescer meu negócio",
    quality: "Melhor qualidade de vida",
    family: "Mais tempo com a família",
  },
};

const QUESTION_LABELS: Record<string, { title: string; icon: React.ReactNode; category: string }> = {
  pain_organization: { title: "Como organiza os treinos", icon: <AlertTriangle className="w-4 h-4 text-amber-500" />, category: "Dores" },
  pain_time: { title: "Tempo gasto com burocracia", icon: <Clock className="w-4 h-4 text-red-500" />, category: "Dores" },
  pain_payment: { title: "Frequência de cobrança", icon: <DollarSign className="w-4 h-4 text-red-500" />, category: "Dores" },
  pain_churn: { title: "Alunos perdidos (3 meses)", icon: <Users className="w-4 h-4 text-red-500" />, category: "Dores" },
  solution_auto_billing: { title: "Interesse em cobranças automáticas", icon: <Zap className="w-4 h-4 text-emerald-500" />, category: "Soluções" },
  solution_ai_training: { title: "Interesse em IA para treinos", icon: <Sparkles className="w-4 h-4 text-purple-500" />, category: "Soluções" },
  solution_dashboard: { title: "Interesse em centralização", icon: <Target className="w-4 h-4 text-blue-500" />, category: "Soluções" },
  financial_students: { title: "Quantidade de alunos", icon: <Users className="w-4 h-4 text-blue-500" />, category: "Financeiro" },
  financial_revenue: { title: "Renda atual", icon: <DollarSign className="w-4 h-4 text-green-500" />, category: "Financeiro" },
  goals_revenue: { title: "Meta de renda", icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, category: "Objetivos" },
  goals_benefits: { title: "Benefícios desejados", icon: <Heart className="w-4 h-4 text-pink-500" />, category: "Objetivos" },
};

export default function AdminQuizDetail() {
  const [, params] = useRoute("/admin/quiz/:id");
  const quizId = params?.id;

  const { data: response, isLoading } = trpc.quiz.getResponseById.useQuery(
    { id: Number(quizId) },
    { enabled: !!quizId }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!response) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Resposta não encontrada</h2>
            <p className="text-gray-600 mb-4">O quiz solicitado não existe ou foi removido.</p>
            <Link href="/admin/quiz">
              <Button>Voltar ao Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answers = response.allAnswers ? JSON.parse(response.allAnswers) : {};
  const createdAt = new Date(response.createdAt);

  // Calcular score de interesse
  const interestScore = calculateInterestScore(answers);

  // Agrupar respostas por categoria
  const groupedAnswers = Object.entries(answers).reduce((acc, [key, value]) => {
    const question = QUESTION_LABELS[key];
    if (question) {
      const category = question.category;
      if (!acc[category]) acc[category] = [];
      acc[category].push({ key, value, ...question });
    }
    return acc;
  }, {} as Record<string, any[]>);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const message = encodeURIComponent(`Olá! Vi que você fez o quiz do FitPrime e gostaria de conversar sobre como podemos ajudar seu negócio de personal trainer.`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/admin/quiz">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">
              {response.leadName ? `Anamnese de ${response.leadName}` : `Anamnese do Lead #${response.id}`}
            </h1>
            <p className="text-gray-600">
              Preenchido em {createdAt.toLocaleDateString("pt-BR")} às {createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div className="flex gap-2">
            {response.isQualified ? (
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Qualificado
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700">
                <XCircle className="w-3 h-3 mr-1" />
                Desqualificado
              </Badge>
            )}
            {response.converted && (
              <Badge className="bg-amber-100 text-amber-700">Convertido</Badge>
            )}
          </div>
        </div>

        {/* Dados de Contato do Lead */}
        {(response.leadName || response.leadEmail || response.leadPhone) && (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                <User className="h-5 w-5" />
                Dados do Personal Trainer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nome</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{response.leadName || "-"}</span>
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-1">Email</p>
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <p className="font-medium text-gray-900 truncate flex-1 min-w-0" title={response.leadEmail || "-"}>
                      {response.leadEmail || "-"}
                    </p>
                    {response.leadEmail && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 flex-shrink-0"
                        onClick={() => copyToClipboard(response.leadEmail)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 mb-1">WhatsApp</p>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <p className="font-medium text-gray-900 truncate flex-1 min-w-0">{response.leadPhone || "-"}</p>
                    {response.leadPhone && (
                      <div className="flex items-center flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(response.leadPhone)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                          onClick={() => openWhatsApp(response.leadPhone)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cidade</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{response.leadCity || "-"}</span>
                  </p>
                </div>
              </div>
              {response.leadPhone && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => openWhatsApp(response.leadPhone)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar WhatsApp
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Aviso se não tem dados de contato */}
        {!response.leadName && !response.leadEmail && !response.leadPhone && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Dados de contato não capturados</p>
                  <p className="text-sm text-amber-700">Este lead preencheu o quiz antes da atualização que captura nome, email e telefone.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards de Resumo */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Alunos Atuais</span>
              </div>
              <p className="text-xl font-bold">
                {ANSWER_LABELS.financial_students?.[answers.financial_students] || answers.financial_students || "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Renda Atual</span>
              </div>
              <p className="text-xl font-bold">
                {ANSWER_LABELS.financial_revenue?.[answers.financial_revenue] || answers.financial_revenue || "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">Meta de Renda</span>
              </div>
              <p className="text-xl font-bold">
                {ANSWER_LABELS.goals_revenue?.[answers.goals_revenue] || answers.goals_revenue || "-"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs">Score de Interesse</span>
              </div>
              <p className={`text-xl font-bold ${interestScore >= 70 ? "text-emerald-600" : interestScore >= 50 ? "text-amber-600" : "text-red-600"}`}>
                {interestScore}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Informações do Dispositivo e UTM */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Informações de Rastreamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Dispositivo</p>
                <p className="font-medium flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  {response.deviceType || "Desconhecido"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Navegador</p>
                <p className="font-medium">{response.browser || "Desconhecido"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Sistema</p>
                <p className="font-medium">{response.os || "Desconhecido"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Página de Origem</p>
                <p className="font-medium text-sm truncate">{response.landingPage || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Fonte UTM</p>
                <p className="font-medium">{response.utmSource || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Campanha UTM</p>
                <p className="font-medium">{response.utmCampaign || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Respostas do Quiz */}
        <Tabs defaultValue="dores" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dores">Dores</TabsTrigger>
            <TabsTrigger value="solucoes">Soluções</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
          </TabsList>

          {["Dores", "Soluções", "Financeiro", "Objetivos"].map((category) => (
            <TabsContent key={category} value={category.toLowerCase().replace("ç", "c").replace("õ", "o")}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{category}</CardTitle>
                  <CardDescription>
                    Respostas relacionadas a {category.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {groupedAnswers[category]?.map((item: any) => (
                      <div key={item.key} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                          {item.icon}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.title}</p>
                          <p className="text-gray-600 mt-1">
                            {Array.isArray(item.value) 
                              ? item.value.map((v: string) => ANSWER_LABELS[item.key]?.[v] || v).join(", ")
                              : ANSWER_LABELS[item.key]?.[item.value] || item.value || "-"
                            }
                          </p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-4">Nenhuma resposta nesta categoria</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Insights para Abordagem */}
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
              <Sparkles className="h-5 w-5" />
              Insights para Abordagem Personalizada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {generateInsights(answers).map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5" />
                  <p className="text-gray-700">{insight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dados Brutos (JSON) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Dados Brutos</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(answers, null, 2))}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar JSON
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(answers, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Função para calcular score de interesse baseado nas respostas
function calculateInterestScore(answers: Record<string, any>): number {
  let score = 0;
  let maxScore = 0;

  // Interesse em soluções
  const solutionQuestions = ["solution_auto_billing", "solution_ai_training", "solution_dashboard"];
  solutionQuestions.forEach((q) => {
    maxScore += 3;
    const answer = answers[q];
    if (answer === "yes_urgent") score += 3;
    else if (answer === "yes") score += 2;
    else if (answer === "maybe" || answer === "curious") score += 1;
  });

  // Dores (quanto mais dor, mais interesse potencial)
  const painQuestions = ["pain_organization", "pain_time", "pain_payment", "pain_churn"];
  painQuestions.forEach((q) => {
    maxScore += 2;
    const answer = answers[q];
    // Respostas que indicam mais dor
    if (["paper", "memory", "15h", "always", "5+"].includes(answer)) score += 2;
    else if (["excel", "whatsapp", "10h", "sometimes", "3-5"].includes(answer)) score += 1.5;
    else if (["5h", "rarely", "1-2"].includes(answer)) score += 1;
  });

  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

// Função para gerar insights baseados nas respostas
function generateInsights(answers: Record<string, any>): string[] {
  const insights: string[] = [];

  // Organização
  if (answers.pain_organization === "paper" || answers.pain_organization === "memory") {
    insights.push("Este lead usa métodos muito básicos de organização. Destaque a facilidade de migrar para o sistema digital.");
  } else if (answers.pain_organization === "excel") {
    insights.push("Já usa planilhas, então entende a importância de organização. Mostre como o FitPrime automatiza o que ele faz manualmente.");
  }

  // Tempo
  if (answers.pain_time === "15h" || answers.pain_time === "10h") {
    insights.push("Gasta muito tempo com burocracia. Enfatize a economia de tempo (até 10h/semana) como principal benefício.");
  }

  // Cobrança
  if (answers.pain_payment === "always" || answers.pain_payment === "sometimes") {
    insights.push("Tem problemas frequentes com inadimplência. O sistema de cobranças automáticas é um forte argumento de venda.");
  }

  // Interesse em IA
  if (answers.solution_ai_training === "yes_urgent" || answers.solution_ai_training === "yes") {
    insights.push("Demonstrou alto interesse em IA para treinos. Destaque essa funcionalidade na demonstração.");
  }

  // Quantidade de alunos
  if (answers.financial_students === "1-5" || answers.financial_students === "6-15") {
    insights.push("Está em fase de crescimento. Mostre como o sistema ajuda a escalar sem perder qualidade no atendimento.");
  } else if (answers.financial_students === "31-50" || answers.financial_students === "51-100") {
    insights.push("Já tem uma base sólida de alunos. Foque em eficiência operacional e métricas de negócio.");
  }

  // Meta de renda
  const currentRevenue = answers.financial_revenue;
  const goalRevenue = answers.goals_revenue;
  if (goalRevenue && currentRevenue) {
    const revenueMap: Record<string, number> = { "no_income": 0, "2k": 2000, "5k": 5000, "10k": 10000, "10k+": 15000, "15k": 15000, "20k+": 20000 };
    const current = revenueMap[currentRevenue] || 0;
    const goal = revenueMap[goalRevenue] || 0;
    if (goal > current * 2) {
      insights.push(`Quer mais que dobrar a renda (de ${currentRevenue} para ${goalRevenue}). Mostre cases de sucesso de crescimento.`);
    }
  }

  // Benefícios desejados
  const benefits = answers.goals_benefits;
  if (Array.isArray(benefits)) {
    if (benefits.includes("time") || benefits.includes("family")) {
      insights.push("Valoriza tempo livre e família. Enfatize a automação que libera tempo para o que importa.");
    }
    if (benefits.includes("freedom") || benefits.includes("growth")) {
      insights.push("Busca crescimento e liberdade financeira. Mostre o potencial de escala do negócio com o sistema.");
    }
  }

  if (insights.length === 0) {
    insights.push("Faça uma abordagem consultiva, entendendo melhor as necessidades específicas deste lead.");
  }

  return insights;
}
