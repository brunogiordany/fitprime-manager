import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Target,
  Sparkles,
  Heart,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

// Tipos
interface QuizOption {
  id: string;
  text: string;
  emoji?: string;
  painLevel?: number; // 1-5 para perguntas de dor
  value?: string | number;
}

interface QuizQuestion {
  id: string;
  category: "pain" | "solution" | "financial" | "goals";
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  options: QuizOption[];
  multiple?: boolean;
}

// Perguntas do Quiz - Funil de Dores
const QUIZ_QUESTIONS: QuizQuestion[] = [
  // === BLOCO 1: DORES (mostrar que está "fodido") ===
  {
    id: "pain_organization",
    category: "pain",
    title: "Como você organiza os treinos dos seus alunos hoje?",
    subtitle: "Seja honesto, estamos aqui para ajudar",
    icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
    options: [
      { id: "excel", text: "Planilhas no Excel/Google Sheets", emoji: "📊", painLevel: 4 },
      { id: "paper", text: "Papel e caneta", emoji: "📝", painLevel: 5 },
      { id: "whatsapp", text: "Mando por WhatsApp mesmo", emoji: "📱", painLevel: 4 },
      { id: "memory", text: "Guardo tudo na memória", emoji: "🧠", painLevel: 5 },
      { id: "app", text: "Uso um app/sistema", emoji: "💻", painLevel: 2 },
    ],
  },
  {
    id: "pain_time",
    category: "pain",
    title: "Quanto tempo você gasta por semana com tarefas administrativas?",
    subtitle: "Cobranças, planilhas, mensagens, organização...",
    icon: <Clock className="w-6 h-6 text-red-500" />,
    options: [
      { id: "2h", text: "Menos de 2 horas", emoji: "😌", painLevel: 1, value: 2 },
      { id: "5h", text: "Entre 2 e 5 horas", emoji: "😐", painLevel: 2, value: 5 },
      { id: "10h", text: "Entre 5 e 10 horas", emoji: "😰", painLevel: 4, value: 10 },
      { id: "15h", text: "Mais de 10 horas", emoji: "😫", painLevel: 5, value: 15 },
    ],
  },
  {
    id: "pain_payment",
    category: "pain",
    title: "Com que frequência você precisa cobrar alunos inadimplentes?",
    subtitle: "Aquela situação constrangedora...",
    icon: <DollarSign className="w-6 h-6 text-red-500" />,
    options: [
      { id: "never", text: "Nunca, todos pagam em dia", emoji: "🎉", painLevel: 1 },
      { id: "rarely", text: "Raramente, 1-2 vezes por mês", emoji: "😊", painLevel: 2 },
      { id: "sometimes", text: "Às vezes, toda semana tem alguém", emoji: "😓", painLevel: 4 },
      { id: "always", text: "Sempre, é uma luta constante", emoji: "😤", painLevel: 5 },
    ],
  },
  {
    id: "pain_churn",
    category: "pain",
    title: "Quantos alunos você perdeu nos últimos 3 meses?",
    subtitle: "Desistiram, sumiram, cancelaram...",
    icon: <Users className="w-6 h-6 text-red-500" />,
    options: [
      { id: "0", text: "Nenhum", emoji: "💪", painLevel: 1, value: 0 },
      { id: "1-2", text: "1 a 2 alunos", emoji: "😕", painLevel: 2, value: 2 },
      { id: "3-5", text: "3 a 5 alunos", emoji: "😰", painLevel: 4, value: 5 },
      { id: "5+", text: "Mais de 5 alunos", emoji: "😱", painLevel: 5, value: 7 },
    ],
  },

  // === BLOCO 2: SOLUÇÕES (arrancar "sim" com base no PWA) ===
  {
    id: "solution_auto_billing",
    category: "solution",
    title: "Você gostaria que as cobranças fossem 100% automáticas?",
    subtitle: "Sem precisar lembrar, sem constrangimento, sem atraso",
    icon: <Zap className="w-6 h-6 text-emerald-500" />,
    options: [
      { id: "yes_urgent", text: "SIM! Preciso muito disso", emoji: "🙌", value: 3 },
      { id: "yes", text: "Sim, seria ótimo", emoji: "👍", value: 2 },
      { id: "maybe", text: "Talvez, depende de como funciona", emoji: "🤔", value: 1 },
      { id: "no", text: "Não, prefiro cobrar manualmente", emoji: "👎", value: 0 },
    ],
  },
  {
    id: "solution_ai_training",
    category: "solution",
    title: "E se uma IA criasse treinos personalizados em segundos?",
    subtitle: "Baseado na anamnese, objetivos e histórico do aluno",
    icon: <Sparkles className="w-6 h-6 text-purple-500" />,
    options: [
      { id: "yes_urgent", text: "SIM! Isso mudaria minha vida", emoji: "🚀", value: 3 },
      { id: "yes", text: "Sim, economizaria muito tempo", emoji: "⏰", value: 2 },
      { id: "curious", text: "Interessante, quero saber mais", emoji: "🧐", value: 1 },
      { id: "no", text: "Prefiro criar tudo manualmente", emoji: "✍️", value: 0 },
    ],
  },
  {
    id: "solution_dashboard",
    category: "solution",
    title: "Gostaria de ter tudo em um só lugar?",
    subtitle: "Alunos, treinos, cobranças, evolução, mensagens...",
    icon: <Target className="w-6 h-6 text-blue-500" />,
    options: [
      { id: "yes_urgent", text: "SIM! Estou cansado de usar 5 apps diferentes", emoji: "😩", value: 3 },
      { id: "yes", text: "Sim, facilitaria muito", emoji: "✅", value: 2 },
      { id: "maybe", text: "Talvez, se for fácil de usar", emoji: "🤷", value: 1 },
      { id: "no", text: "Não, estou bem com meu sistema atual", emoji: "😌", value: 0 },
    ],
  },

  // === BLOCO 3: FINANCEIRO ===
  {
    id: "financial_students",
    category: "financial",
    title: "Quantos alunos você atende atualmente?",
    subtitle: "Contando todos os ativos",
    icon: <Users className="w-6 h-6 text-blue-500" />,
    options: [
      { id: "1-5", text: "1 a 5 alunos", emoji: "🌱", value: 5 },
      { id: "6-15", text: "6 a 15 alunos", emoji: "🌿", value: 15 },
      { id: "16-30", text: "16 a 30 alunos", emoji: "🌳", value: 30 },
      { id: "30+", text: "Mais de 30 alunos", emoji: "🏆", value: 40 },
    ],
  },
  {
    id: "financial_revenue",
    category: "financial",
    title: "Qual sua renda mensal atual como personal?",
    subtitle: "Aproximadamente, só para entendermos seu momento",
    icon: <DollarSign className="w-6 h-6 text-green-500" />,
    options: [
      { id: "2k", text: "Até R$ 2.000", emoji: "💵", value: 2000 },
      { id: "5k", text: "R$ 2.000 a R$ 5.000", emoji: "💰", value: 5000 },
      { id: "10k", text: "R$ 5.000 a R$ 10.000", emoji: "💎", value: 10000 },
      { id: "10k+", text: "Mais de R$ 10.000", emoji: "🏅", value: 15000 },
    ],
  },

  // === BLOCO 4: OBJETIVOS E BENEFÍCIOS ===
  {
    id: "goals_revenue",
    category: "goals",
    title: "Qual renda mensal você gostaria de alcançar?",
    subtitle: "Sonhe grande, estamos aqui para ajudar",
    icon: <TrendingUp className="w-6 h-6 text-emerald-500" />,
    options: [
      { id: "5k", text: "R$ 5.000 por mês", emoji: "🎯", value: 5000 },
      { id: "10k", text: "R$ 10.000 por mês", emoji: "🚀", value: 10000 },
      { id: "15k", text: "R$ 15.000 por mês", emoji: "💫", value: 15000 },
      { id: "20k+", text: "R$ 20.000+ por mês", emoji: "🏆", value: 20000 },
    ],
  },
  {
    id: "goals_benefits",
    category: "goals",
    title: "O que você mais deseja ao resolver esses problemas?",
    subtitle: "Escolha o que mais importa para você",
    icon: <Heart className="w-6 h-6 text-pink-500" />,
    multiple: true,
    options: [
      { id: "time", text: "Mais tempo livre", emoji: "⏰" },
      { id: "freedom", text: "Liberdade financeira", emoji: "🦅" },
      { id: "peace", text: "Paz de espírito", emoji: "🧘" },
      { id: "growth", text: "Crescer meu negócio", emoji: "📈" },
      { id: "quality", text: "Melhor qualidade de vida", emoji: "🌟" },
      { id: "family", text: "Mais tempo com a família", emoji: "👨‍👩‍👧‍👦" },
    ],
  },
];

// Componente de Opção
function QuizOptionCard({ 
  option, 
  selected, 
  onClick,
  category
}: { 
  option: QuizOption; 
  selected: boolean; 
  onClick: () => void;
  category: string;
}) {
  const getBorderColor = () => {
    if (!selected) return "border-gray-200 hover:border-gray-300";
    if (category === "pain") return "border-amber-500 bg-amber-50";
    if (category === "solution") return "border-emerald-500 bg-emerald-50";
    if (category === "financial") return "border-blue-500 bg-blue-50";
    return "border-purple-500 bg-purple-50";
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-xl border-2 transition-all duration-200 text-left",
        "hover:shadow-md active:scale-[0.98]",
        getBorderColor()
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{option.emoji}</span>
        <span className="font-medium text-gray-800">{option.text}</span>
        {selected && (
          <CheckCircle2 className="w-5 h-5 ml-auto text-emerald-600" />
        )}
      </div>
    </button>
  );
}

// Componente Principal
interface QualificationQuizV4Props {
  onComplete?: (result: QuizResult) => void;
}

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

export default function QualificationQuizV4({ onComplete }: QualificationQuizV4Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [sessionId] = useState(() => `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const saveQuizMutation = trpc.quiz.saveResponse.useMutation();

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;
  const isLastQuestion = currentStep === QUIZ_QUESTIONS.length - 1;

  // Categoria atual para estilo
  const getCategoryLabel = () => {
    switch (currentQuestion?.category) {
      case "pain": return { label: "Diagnóstico", color: "bg-amber-100 text-amber-800" };
      case "solution": return { label: "Soluções", color: "bg-emerald-100 text-emerald-800" };
      case "financial": return { label: "Financeiro", color: "bg-blue-100 text-blue-800" };
      case "goals": return { label: "Objetivos", color: "bg-purple-100 text-purple-800" };
      default: return { label: "", color: "" };
    }
  };

  const handleOptionClick = (optionId: string) => {
    if (currentQuestion.multiple) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleNext = () => {
    if (selectedOptions.length === 0) return;

    const newAnswers = {
      ...answers,
      [currentQuestion.id]: currentQuestion.multiple ? selectedOptions : selectedOptions[0],
    };
    setAnswers(newAnswers);

    if (isLastQuestion) {
      // Calcular resultado
      const quizResult = calculateResult(newAnswers);
      setResult(quizResult);
      
      // Salvar no banco
      saveQuizMutation.mutate({
        visitorId: `visitor_${Date.now()}`,
        sessionId,
        allAnswers: newAnswers,
        studentsCount: quizResult.currentStudents.toString(),
        revenue: quizResult.currentRevenue.toString(),
        recommendedPlan: quizResult.recommendedPlan,
        recommendedProfile: quizResult.painScore > 15 ? "high_pain" : quizResult.painScore > 10 ? "medium_pain" : "low_pain",
        totalScore: quizResult.painScore + quizResult.solutionScore,
      });

      if (onComplete) {
        onComplete(quizResult);
      }
    } else {
      setCurrentStep(prev => prev + 1);
      setSelectedOptions([]);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      const prevQuestion = QUIZ_QUESTIONS[currentStep - 1];
      const prevAnswer = answers[prevQuestion.id];
      setSelectedOptions(Array.isArray(prevAnswer) ? prevAnswer : prevAnswer ? [prevAnswer] : []);
    }
  };

  const calculateResult = (allAnswers: Record<string, string | string[]>): QuizResult => {
    let painScore = 0;
    let solutionScore = 0;
    let currentStudents = 10;
    let currentRevenue = 3000;
    let goalRevenue = 10000;
    let desiredBenefits: string[] = [];

    QUIZ_QUESTIONS.forEach(q => {
      const answer = allAnswers[q.id];
      if (!answer) return;

      const selectedIds = Array.isArray(answer) ? answer : [answer];
      
      selectedIds.forEach(id => {
        const option = q.options.find(o => o.id === id);
        if (!option) return;

        if (q.category === "pain" && option.painLevel) {
          painScore += option.painLevel;
        }
        if (q.category === "solution" && typeof option.value === "number") {
          solutionScore += option.value;
        }
        if (q.id === "financial_students" && typeof option.value === "number") {
          currentStudents = option.value;
        }
        if (q.id === "financial_revenue" && typeof option.value === "number") {
          currentRevenue = option.value;
        }
        if (q.id === "goals_revenue" && typeof option.value === "number") {
          goalRevenue = option.value;
        }
        if (q.id === "goals_benefits") {
          desiredBenefits.push(id);
        }
      });
    });

    // Determinar plano recomendado
    let recommendedPlan = "starter";
    if (currentStudents <= 5) recommendedPlan = "beginner";
    else if (currentStudents <= 15) recommendedPlan = "starter";
    else if (currentStudents <= 25) recommendedPlan = "pro";
    else if (currentStudents <= 40) recommendedPlan = "business";
    else if (currentStudents <= 70) recommendedPlan = "premium";
    else recommendedPlan = "enterprise";

    return {
      painScore,
      solutionScore,
      currentStudents,
      currentRevenue,
      goalRevenue,
      desiredBenefits,
      recommendedPlan,
      answers: allAnswers,
    };
  };

  // Tela de resultado
  if (result) {
    const painLevel = result.painScore > 15 ? "alto" : result.painScore > 10 ? "médio" : "baixo";
    const potentialGain = result.goalRevenue - result.currentRevenue;
    const timeSaved = result.painScore > 15 ? "10+" : result.painScore > 10 ? "5-10" : "2-5";

    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Análise Completa!
                </h2>
                <p className="text-gray-600">
                  Identificamos seu perfil e temos uma solução personalizada
                </p>
              </div>

              {/* Diagnóstico */}
              <div className="space-y-4 mb-8">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-amber-800">Nível de Dor: {painLevel.toUpperCase()}</span>
                  </div>
                  <p className="text-sm text-amber-700">
                    Você está perdendo aproximadamente <strong>{timeSaved} horas por semana</strong> com tarefas que poderiam ser automatizadas.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-800">Potencial de Crescimento</span>
                  </div>
                  <p className="text-sm text-emerald-700">
                    Com as ferramentas certas, você pode aumentar sua renda em até <strong>R$ {potentialGain.toLocaleString('pt-BR')}/mês</strong>.
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Plano Ideal para Você</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Baseado nos seus <strong>{result.currentStudents} alunos</strong> e objetivos, recomendamos o plano <strong className="uppercase">{result.recommendedPlan}</strong>.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-3">
                <Button 
                  className="w-full h-14 text-lg bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => window.location.href = "/quiz-resultado"}
                >
                  Ver Meus Planos Recomendados
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.href = "/pricing"}
                >
                  Ver Todos os Planos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tela do Quiz
  const categoryInfo = getCategoryLabel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <Badge className={categoryInfo.color}>
              {categoryInfo.label}
            </Badge>
            <span className="text-sm text-gray-500">
              {currentStep + 1} de {QUIZ_QUESTIONS.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            {/* Question Header */}
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-gray-100 rounded-xl">
                {currentQuestion.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {currentQuestion.title}
                </h2>
                {currentQuestion.subtitle && (
                  <p className="text-gray-500 text-sm">
                    {currentQuestion.subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-6">
              {currentQuestion.options.map(option => (
                <QuizOptionCard
                  key={option.id}
                  option={option}
                  selected={selectedOptions.includes(option.id)}
                  onClick={() => handleOptionClick(option.id)}
                  category={currentQuestion.category}
                />
              ))}
            </div>

            {currentQuestion.multiple && (
              <p className="text-sm text-gray-500 text-center mb-4">
                Você pode selecionar mais de uma opção
              </p>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              )}
              <Button 
                onClick={handleNext}
                disabled={selectedOptions.length === 0}
                className={cn(
                  "flex-1",
                  currentStep === 0 ? "w-full" : "",
                  "bg-emerald-600 hover:bg-emerald-700"
                )}
              >
                {isLastQuestion ? "Ver Resultado" : "Próxima"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
