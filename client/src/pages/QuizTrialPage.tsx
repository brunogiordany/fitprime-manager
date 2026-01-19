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
  Zap,
  Gift,
  User,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import { trackPageView, trackQuizCompleted } from "@/lib/analytics";
import { pixelEvents } from "@/lib/tracking-pixels";
import { getTrackingData, saveUtmParams } from "@/lib/tracking";

// Tipos
interface QuizOption {
  id: string;
  text: string;
  emoji?: string;
  painLevel?: number;
  value?: string | number;
  plan?: string;
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

// Dados de contato do lead
interface LeadData {
  name: string;
  email: string;
  phone: string;
  city: string;
}

// Perguntas do Quiz - Funil de Dores
const QUIZ_QUESTIONS: QuizQuestion[] = [
  // === BLOCO 1: DORES ===
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

  // === BLOCO 2: SOLUÇÕES ===
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
      { id: "1-5", text: "1 a 5 alunos", emoji: "🌱", value: 5, plan: "beginner" },
      { id: "6-15", text: "6 a 15 alunos", emoji: "🌿", value: 15, plan: "starter" },
      { id: "16-30", text: "16 a 30 alunos", emoji: "🌳", value: 30, plan: "pro" },
      { id: "31-50", text: "31 a 50 alunos", emoji: "🌴", value: 50, plan: "business" },
      { id: "51-100", text: "51 a 100 alunos", emoji: "🏆", value: 100, plan: "premium" },
      { id: "100+", text: "Mais de 100 alunos", emoji: "👑", value: 150, plan: "enterprise" },
    ],
  },
  {
    id: "financial_revenue",
    category: "financial",
    title: "Qual sua renda mensal atual como personal?",
    subtitle: "Aproximadamente, só para entendermos seu momento",
    icon: <DollarSign className="w-6 h-6 text-green-500" />,
    options: [
      { id: "no_income", text: "Ainda não tenho renda como personal", emoji: "🌱", value: 0 },
      { id: "2k", text: "Até R$ 2.000", emoji: "💵", value: 2000 },
      { id: "5k", text: "R$ 2.000 a R$ 5.000", emoji: "💰", value: 5000 },
      { id: "10k", text: "R$ 5.000 a R$ 10.000", emoji: "💎", value: 10000 },
      { id: "10k+", text: "Mais de R$ 10.000", emoji: "🏅", value: 15000 },
    ],
  },

  // === BLOCO 4: OBJETIVOS ===
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

export default function QuizTrialPage() {
  const [showLeadForm, setShowLeadForm] = useState(true); // Começa com o formulário de lead
  const [leadData, setLeadData] = useState<LeadData>({ name: "", email: "", phone: "", city: "" });
  const [leadErrors, setLeadErrors] = useState<Partial<LeadData>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [eliminated, setEliminated] = useState(false);
  const [sessionId] = useState(() => `quiz_trial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const saveQuizMutation = trpc.quiz.saveResponse.useMutation();
  
  // Capturar dados de tracking ao carregar
  const [trackingData] = useState(() => getTrackingData());

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

  useEffect(() => {
    trackPageView('/quiz-trial');
    saveUtmParams();
  }, []);

  // Validar dados do lead
  const validateLeadData = (): boolean => {
    const errors: Partial<LeadData> = {};
    
    if (!leadData.name.trim()) {
      errors.name = "Nome é obrigatório";
    }
    
    if (!leadData.email.trim()) {
      errors.email = "Email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadData.email)) {
      errors.email = "Email inválido";
    }
    
    if (!leadData.phone.trim()) {
      errors.phone = "WhatsApp é obrigatório";
    } else if (leadData.phone.replace(/\D/g, '').length < 10) {
      errors.phone = "WhatsApp inválido";
    }
    
    setLeadErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Formatar telefone
  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
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

  const handleNext = async () => {
    // Salvar resposta
    const newAnswers = {
      ...answers,
      [currentQuestion.id]: currentQuestion.multiple ? selectedOptions : selectedOptions[0]
    };
    setAnswers(newAnswers);

    // Verificar eliminação (sem renda)
    if (currentQuestion.id === "financial_revenue" && selectedOptions[0] === "no_income") {
      setEliminated(true);
      return;
    }

    // Próxima pergunta ou resultado
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
      setSelectedOptions([]);
    } else {
      // Calcular resultado
      const finalResult = calculateResult(newAnswers);
      setResult(finalResult);
      
      // Salvar no banco com dados do lead e tracking
      try {
        await saveQuizMutation.mutateAsync({
          visitorId: sessionId,
          sessionId,
          leadName: leadData.name,
          leadEmail: leadData.email,
          leadPhone: leadData.phone,
          leadCity: leadData.city,
          allAnswers: newAnswers,
          studentsCount: finalResult.currentStudents.toString(),
          revenue: finalResult.currentRevenue.toString(),
          recommendedPlan: finalResult.recommendedPlan,
          totalScore: finalResult.painScore + finalResult.solutionScore,
          isQualified: true,
          // Dados de tracking
          ...trackingData,
        });
      } catch (error) {
        console.error('Erro ao salvar quiz:', error);
      }

      // Tracking
      trackQuizCompleted(finalResult.painScore + finalResult.solutionScore, newAnswers);
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
    let currentStudents = 0;
    let currentRevenue = 0;
    let goalRevenue = 0;
    let recommendedPlan = "starter";
    const desiredBenefits: string[] = [];

    QUIZ_QUESTIONS.forEach(question => {
      const answer = allAnswers[question.id];
      if (!answer) return;

      const answers = Array.isArray(answer) ? answer : [answer];
      
      answers.forEach(ans => {
        const option = question.options.find(o => o.id === ans);
        if (!option) return;

        if (question.category === "pain" && option.painLevel) {
          painScore += option.painLevel;
        }
        if (question.category === "solution" && typeof option.value === "number") {
          solutionScore += option.value;
        }
        if (question.id === "financial_students" && option.value) {
          currentStudents = option.value as number;
          if (option.plan) recommendedPlan = option.plan;
        }
        if (question.id === "financial_revenue" && option.value) {
          currentRevenue = option.value as number;
        }
        if (question.id === "goals_revenue" && option.value) {
          goalRevenue = option.value as number;
        }
        if (question.id === "goals_benefits") {
          desiredBenefits.push(ans);
        }
      });
    });

    return {
      painScore,
      solutionScore,
      currentStudents,
      currentRevenue,
      goalRevenue,
      desiredBenefits,
      recommendedPlan,
      answers: allAnswers
    };
  };

  const getCategoryLabel = () => {
    switch (currentQuestion.category) {
      case "pain": return { label: "Diagnóstico", color: "bg-amber-100 text-amber-700" };
      case "solution": return { label: "Soluções", color: "bg-emerald-100 text-emerald-700" };
      case "financial": return { label: "Financeiro", color: "bg-blue-100 text-blue-700" };
      case "goals": return { label: "Objetivos", color: "bg-purple-100 text-purple-700" };
      default: return { label: "", color: "" };
    }
  };

  const isLastQuestion = currentStep === QUIZ_QUESTIONS.length - 1;

  // Tela de captura de dados do lead
  if (showLeadForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="border-0 shadow-xl bg-gray-800/50 backdrop-blur">
            <CardContent className="p-8">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-emerald-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  Teste Grátis por 24 Horas
                </h1>
                <p className="text-gray-400">
                  Responda algumas perguntas e ganhe acesso completo ao FitPrime
                </p>
              </div>

              {/* Formulário */}
              <div className="space-y-4 mb-6">
                <div>
                  <Label htmlFor="name" className="flex items-center gap-2 mb-2 text-gray-300">
                    <User className="w-4 h-4 text-gray-500" />
                    Seu nome completo
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ex: João Silva"
                    value={leadData.name}
                    onChange={(e) => setLeadData({ ...leadData, name: e.target.value })}
                    className={cn("bg-gray-700/50 border-gray-600 text-white", leadErrors.name && "border-red-500")}
                  />
                  {leadErrors.name && (
                    <p className="text-red-500 text-sm mt-1">{leadErrors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center gap-2 mb-2 text-gray-300">
                    <Mail className="w-4 h-4 text-gray-500" />
                    Seu melhor email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Ex: joao@email.com"
                    value={leadData.email}
                    onChange={(e) => setLeadData({ ...leadData, email: e.target.value })}
                    className={cn("bg-gray-700/50 border-gray-600 text-white", leadErrors.email && "border-red-500")}
                  />
                  {leadErrors.email && (
                    <p className="text-red-500 text-sm mt-1">{leadErrors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center gap-2 mb-2 text-gray-300">
                    <Phone className="w-4 h-4 text-gray-500" />
                    WhatsApp
                  </Label>
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={leadData.phone}
                    onChange={(e) => setLeadData({ ...leadData, phone: formatPhone(e.target.value) })}
                    className={cn("bg-gray-700/50 border-gray-600 text-white", leadErrors.phone && "border-red-500")}
                  />
                  {leadErrors.phone && (
                    <p className="text-red-500 text-sm mt-1">{leadErrors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="city" className="flex items-center gap-2 mb-2 text-gray-300">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    Cidade (opcional)
                  </Label>
                  <Input
                    id="city"
                    placeholder="Ex: São Paulo - SP"
                    value={leadData.city}
                    onChange={(e) => setLeadData({ ...leadData, city: e.target.value })}
                    className="bg-gray-700/50 border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Benefícios */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-emerald-400 mb-2">O que você vai ganhar:</h3>
                <ul className="text-emerald-300 text-sm space-y-1">
                  <li>✓ 24 horas de acesso completo ao FitPrime</li>
                  <li>✓ Crie treinos com IA ilimitados</li>
                  <li>✓ Cadastre até 5 alunos</li>
                  <li>✓ Sem cartão de crédito</li>
                </ul>
              </div>

              {/* Botão */}
              <Button 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-lg font-semibold"
                onClick={() => {
                  if (validateLeadData()) {
                    // Disparar eventos do Facebook ANTES de ir para o quiz
                    const userData = {
                      email: leadData.email,
                      phone: leadData.phone,
                      firstName: leadData.name.split(' ')[0],
                      lastName: leadData.name.split(' ').slice(1).join(' '),
                      city: leadData.city,
                    };
                    // Evento padrão Lead para otimização de campanhas
                    pixelEvents.lead(userData, {
                      contentName: 'Quiz Trial Lead Capture',
                      contentCategory: 'quiz_trial',
                      value: 0,
                    });
                    // Evento personalizado FP_LeadCapture para públicos customizados
                    pixelEvents.fpLeadCapture(userData, 'quiz_trial');
                    setShowLeadForm(false);
                  }
                }}
              >
                Começar Teste Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-center text-gray-500 text-xs mt-4">
                Leva menos de 2 minutos • 100% gratuito
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Tela de eliminação
  if (eliminated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full bg-gray-800/50 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Você ainda está começando!
            </h2>
            <p className="text-gray-400 mb-6">
              O FitPrime é ideal para personal trainers que já têm alunos e renda. 
              Quando você começar a atender, volte aqui que teremos a solução perfeita para você!
            </p>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => window.location.href = "/pv01"}
              >
                Voltar ao Início
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Tela de resultado - redireciona para cadastro trial
  if (result) {
    const hoursPerMonth = Math.round((answers["pain_time"] === "2h" ? 2 : answers["pain_time"] === "5h" ? 5 : answers["pain_time"] === "10h" ? 10 : 15) * 4);
    const potentialGain = result.goalRevenue - result.currentRevenue;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6 space-y-6">
              {/* Header */}
              <div className="text-center">
                <Badge className="bg-emerald-500/20 text-emerald-400 mb-4">
                  <Gift className="w-3 h-3 mr-1" />
                  Teste Grátis por 24h
                </Badge>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Seu diagnóstico está pronto!
                </h2>
                <p className="text-gray-400">
                  Veja o que descobrimos sobre seu negócio
                </p>
              </div>

              {/* Diagnóstico */}
              <div className="space-y-4">
                {/* Situação atual */}
                <div className="p-5 bg-red-500/10 rounded-xl border border-red-500/30">
                  <p className="text-red-400 text-sm mb-2">SUA SITUAÇÃO ATUAL:</p>
                  <p className="text-white text-lg">
                    Você atende <span className="text-red-400 font-bold">{result.currentStudents} alunos</span> e ganha <span className="text-red-400 font-bold">R$ {result.currentRevenue.toLocaleString('pt-BR')}/mês</span>
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    E perde <span className="text-red-400 font-semibold">{hoursPerMonth}+ horas por mês</span> com burocracia
                  </p>
                </div>

                {/* O que quer */}
                <div className="p-5 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                  <p className="text-emerald-400 text-sm mb-2">O QUE VOCÊ QUER:</p>
                  <p className="text-white text-lg">
                    Chegar em <span className="text-emerald-400 font-bold">R$ {result.goalRevenue.toLocaleString('pt-BR')}/mês</span>
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Isso significa ganhar <span className="text-emerald-400 font-semibold">+R$ {potentialGain.toLocaleString('pt-BR')}</span> a mais todo mês
                  </p>
                </div>

                {/* Solução */}
                <div className="p-5 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-xl border border-emerald-500/50">
                  <p className="text-emerald-400 text-sm mb-2">COM O FITPRIME:</p>
                  <p className="text-white text-lg font-semibold">
                    Você recupera essas {hoursPerMonth}+ horas e pode finalmente chegar nos <span className="text-emerald-400">R$ {result.goalRevenue.toLocaleString('pt-BR')}/mês</span>
                  </p>
                  <ul className="text-gray-300 text-sm mt-3 space-y-1">
                    <li>✓ Cobranças automáticas (sem constrangimento)</li>
                    <li>✓ Treinos gerados por IA em segundos</li>
                    <li>✓ Agenda inteligente que se organiza sozinha</li>
                    <li>✓ Tudo em um só lugar</li>
                  </ul>
                </div>
              </div>

              {/* CTA - Redireciona para cadastro trial */}
              <div className="space-y-3">
                <Button 
                  className="w-full h-14 text-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-bold"
                  onClick={() => {
                    // Salvar dados do quiz no localStorage para usar na página de trial
                    localStorage.setItem('quizTrialResult', JSON.stringify({
                      currentStudents: result.currentStudents,
                      currentRevenue: result.currentRevenue,
                      goalRevenue: result.goalRevenue,
                      painScore: result.painScore,
                      recommendedPlan: result.recommendedPlan,
                      answers: result.answers,
                      leadName: leadData.name,
                      leadEmail: leadData.email,
                      leadPhone: leadData.phone,
                    }));
                    // Também salvar no quizResult para compatibilidade
                    localStorage.setItem('quizResult', JSON.stringify({
                      leadName: leadData.name,
                      leadEmail: leadData.email,
                      leadPhone: leadData.phone,
                    }));
                    window.location.href = "/cadastro-trial";
                  }}
                >
                  <Gift className="w-5 h-5 mr-2" />
                  COMEÇAR MEU TESTE GRÁTIS
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-center text-gray-500 text-sm">
                  24 horas de acesso completo • Sem cartão de crédito
                </p>
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
        {/* Header */}
        <div className="text-center mb-6">
          <Badge className="bg-emerald-100 text-emerald-700 mb-2">
            <Gift className="w-3 h-3 mr-1" />
            Teste Grátis 24h
          </Badge>
          <h1 className="text-xl font-bold text-gray-900">
            Descubra se o FitPrime é para você
          </h1>
        </div>

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
