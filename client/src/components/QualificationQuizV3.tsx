import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle2 } from "lucide-react";

interface QuizQuestion {
  id: string;
  title: string;
  description?: string;
  type: "single" | "multiple";
  options: {
    value: string;
    label: string;
    pain: string;
    score: number;
  }[];
}

interface QuizResult {
  profile: "beginner" | "starter" | "pro" | "business";
  planName: string;
  price: number;
  studentLimit: number;
  extraStudentPrice: number;
  score: number;
  pains: string[];
  message: string;
  urgency: "low" | "medium" | "high";
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  // PERGUNTA 1: Quantidade de alunos (base para plano)
  {
    id: "students_count",
    title: "Quantos alunos você atende hoje?",
    description: "Isso nos ajuda a encontrar o plano perfeito para você",
    type: "multiple",
    options: [
      {
        value: "none",
        label: "Ainda não tenho alunos",
        pain: "Sem alunos",
        score: -100,
      },
      {
        value: "1_5",
        label: "1 a 5 alunos",
        pain: "Iniciante",
        score: 1,
      },
      {
        value: "6_15",
        label: "6 a 15 alunos",
        pain: "Crescendo",
        score: 1,
      },
      {
        value: "16_30",
        label: "16 a 30 alunos",
        pain: "Consolidado",
        score: 1,
      },
      {
        value: "over_30",
        label: "Mais de 30 alunos",
        pain: "Escalado",
        score: 1,
      },
    ],
  },
  // PERGUNTA 2: Renda (desqualificação + ajuste de plano)
  {
    id: "revenue",
    title: "Qual sua renda mensal com personal training?",
    description: "Seja honesto, isso ajuda a recomendar o melhor investimento",
    type: "multiple",
    options: [
      {
        value: "no_revenue",
        label: "Ainda não gero renda com personal",
        pain: "Sem renda",
        score: -100,
      },
      {
        value: "under_2k",
        label: "Menos de R$ 2.000/mês",
        pain: "Renda baixa",
        score: 1,
      },
      {
        value: "2k_5k",
        label: "R$ 2.000 a R$ 5.000/mês",
        pain: "Renda média",
        score: 1,
      },
      {
        value: "5k_10k",
        label: "R$ 5.000 a R$ 10.000/mês",
        pain: "Renda boa",
        score: 1,
      },
      {
        value: "over_10k",
        label: "Mais de R$ 10.000/mês",
        pain: "Renda alta",
        score: 1,
      },
    ],
  },
  // PERGUNTA 3: Dor principal - Gestão
  {
    id: "management_pain",
    title: "Você já perdeu informação importante de algum aluno?",
    description: "Treino, evolução, pagamento, horário...",
    type: "multiple",
    options: [
      {
        value: "always",
        label: "Sim, acontece sempre e me dá dor de cabeça",
        pain: "Perda de informações crítica",
        score: 2,
      },
      {
        value: "sometimes",
        label: "Já aconteceu algumas vezes",
        pain: "Perda de informações ocasional",
        score: 1,
      },
      {
        value: "rarely",
        label: "Raramente, mas tenho medo de acontecer",
        pain: "Medo de perder informações",
        score: 1,
      },
      {
        value: "never",
        label: "Nunca, tenho tudo organizado",
        pain: "Organizado",
        score: 0,
      },
    ],
  },
  // PERGUNTA 4: Dor principal - Tempo
  {
    id: "time_pain",
    title: "Quanto tempo por semana você gasta com tarefas administrativas?",
    description: "Cobranças, WhatsApp, planilhas, agendamentos...",
    type: "multiple",
    options: [
      {
        value: "over_10h",
        label: "Mais de 10 horas - é exaustivo",
        pain: "Tempo excessivo com admin",
        score: 2,
      },
      {
        value: "5_10h",
        label: "5 a 10 horas - toma muito do meu tempo",
        pain: "Muito tempo com admin",
        score: 2,
      },
      {
        value: "2_5h",
        label: "2 a 5 horas - ainda é muito",
        pain: "Tempo moderado com admin",
        score: 1,
      },
      {
        value: "under_2h",
        label: "Menos de 2 horas - tranquilo",
        pain: "Pouco tempo com admin",
        score: 0,
      },
    ],
  },
  // PERGUNTA 5: Dor principal - Retenção
  {
    id: "retention_pain",
    title: "Nos últimos 6 meses, quantos alunos você perdeu?",
    description: "Desistências, cancelamentos, sumiram...",
    type: "multiple",
    options: [
      {
        value: "many",
        label: "Mais de 5 - é frustrante",
        pain: "Alta evasão de alunos",
        score: 2,
      },
      {
        value: "some",
        label: "3 a 5 alunos",
        pain: "Evasão moderada",
        score: 1,
      },
      {
        value: "few",
        label: "1 a 2 alunos",
        pain: "Baixa evasão",
        score: 1,
      },
      {
        value: "none",
        label: "Nenhum - todos continuam comigo",
        pain: "Excelente retenção",
        score: 0,
      },
    ],
  },
  // PERGUNTA 6: Dor principal - Cobranças
  {
    id: "billing_pain",
    title: "Você já teve problemas com cobranças ou inadimplência?",
    description: "Aluno que não paga, esquece, atrasa...",
    type: "multiple",
    options: [
      {
        value: "always",
        label: "Sim, é um problema constante",
        pain: "Inadimplência crítica",
        score: 2,
      },
      {
        value: "sometimes",
        label: "Às vezes, tenho que ficar cobrando",
        pain: "Inadimplência ocasional",
        score: 1,
      },
      {
        value: "rarely",
        label: "Raramente, mas é constrangedor cobrar",
        pain: "Desconforto com cobranças",
        score: 1,
      },
      {
        value: "never",
        label: "Nunca, todos pagam em dia",
        pain: "Sem problemas de cobrança",
        score: 0,
      },
    ],
  },
  // PERGUNTA 7: O que mais quer resolver (prioridade)
  {
    id: "priority",
    title: "Se você pudesse resolver UM problema agora, qual seria?",
    description: "Escolha o mais urgente para você",
    type: "multiple",
    options: [
      {
        value: "organization",
        label: "Organizar tudo em um só lugar",
        pain: "Desorganização",
        score: 1,
      },
      {
        value: "time",
        label: "Ter mais tempo para treinar e viver",
        pain: "Falta de tempo",
        score: 1,
      },
      {
        value: "retention",
        label: "Parar de perder alunos",
        pain: "Evasão de alunos",
        score: 1,
      },
      {
        value: "billing",
        label: "Automatizar cobranças",
        pain: "Problemas com cobranças",
        score: 1,
      },
      {
        value: "growth",
        label: "Crescer e ganhar mais",
        pain: "Falta de crescimento",
        score: 1,
      },
      {
        value: "professionalism",
        label: "Parecer mais profissional para os alunos",
        pain: "Falta de profissionalismo",
        score: 1,
      },
    ],
  },
];

const RESULT_MESSAGES: Record<number, Omit<QuizResult, "pains">> = {
  0: {
    profile: "beginner",
    planName: "Beginner",
    price: 39.9,
    studentLimit: 5,
    extraStudentPrice: 7.98,
    score: 0,
    message:
      "Parece que você já tem um sistema bem organizado! Mas mesmo assim, FitPrime pode ajudar você a crescer 10x mais rápido.",
    urgency: "low",
  },
  1: {
    profile: "beginner",
    planName: "Beginner",
    price: 39.9,
    studentLimit: 5,
    extraStudentPrice: 7.98,
    score: 1,
    message:
      "Você está começando a sentir as primeiras dores. Agora é a hora de implementar um sistema antes que cresça demais.",
    urgency: "low",
  },
  2: {
    profile: "starter",
    planName: "Starter",
    price: 97,
    studentLimit: 15,
    extraStudentPrice: 6.47,
    score: 2,
    message:
      "Identificamos que você está perdendo tempo com admin e alunos. FitPrime foi feito exatamente para resolver isso.",
    urgency: "medium",
  },
  3: {
    profile: "starter",
    planName: "Starter",
    price: 97,
    studentLimit: 15,
    extraStudentPrice: 6.47,
    score: 3,
    message:
      "Você está na mesma situação de 73% dos personals que começaram com FitPrime. Eles cresceram em média 3x em 6 meses.",
    urgency: "medium",
  },
  4: {
    profile: "pro",
    planName: "Pro",
    price: 147,
    studentLimit: 25,
    extraStudentPrice: 5.88,
    score: 4,
    message:
      "Você está na mesma situação de 87% dos personals que começaram com FitPrime. Eles cresceram em média 3x em 6 meses.",
    urgency: "high",
  },
  5: {
    profile: "business",
    planName: "Business",
    price: 197,
    studentLimit: 40,
    extraStudentPrice: 4.93,
    score: 5,
    message:
      "Você está em situação crítica. Mas temos boas notícias: FitPrime foi feito para salvar personals como você. 92% dos clientes em sua situação triplicaram a receita em 6 meses.",
    urgency: "high",
  },
};

interface QualificationQuizV3Props {
  onComplete?: (result: QuizResult) => void;
}

export function QualificationQuizV3({ onComplete }: QualificationQuizV3Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [selectedPains, setSelectedPains] = useState<string[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [disqualified, setDisqualified] = useState<{ reason: string; message: string } | null>(null);

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

  // Função para verificar desqualificação
  const checkDisqualification = (questionId: string, selectedValues: string[]): { reason: string; message: string } | null => {
    if (questionId === "students_count" && selectedValues.includes("none")) {
      return {
        reason: "Sem alunos",
        message: "O FitPrime é ideal para personals que já têm alunos. Quando você conquistar seus primeiros alunos, volte aqui que teremos a solução perfeita para você! 💪"
      };
    }
    if (questionId === "revenue" && selectedValues.includes("no_revenue")) {
      return {
        reason: "Sem renda",
        message: "O FitPrime é feito para personals que já geram renda com seus alunos. Quando você começar a faturar, volte aqui que vamos te ajudar a escalar! 🚀"
      };
    }
    return null;
  };

  const handleSingleAnswer = (value: string) => {
    const option = currentQuestion.options.find((opt) => opt.value === value);
    if (!option) return;

    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    });

    setScores({
      ...scores,
      [currentQuestion.id]: option.score,
    });
  };

  const handleMultipleAnswer = (value: string, checked: boolean) => {
    const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
    let newAnswers: string[];

    if (checked) {
      newAnswers = [...currentAnswers, value];
    } else {
      newAnswers = currentAnswers.filter((a) => a !== value);
    }

    setAnswers({
      ...answers,
      [currentQuestion.id]: newAnswers,
    });

    // Calcular score para múltipla seleção
    const totalScore = newAnswers.reduce((sum, val) => {
      const option = currentQuestion.options.find((opt) => opt.value === val);
      return sum + (option?.score || 0);
    }, 0);

    setScores({
      ...scores,
      [currentQuestion.id]: totalScore,
    });

    // Rastrear dores selecionadas
    const pains = newAnswers.map((val) => {
      const option = currentQuestion.options.find((opt) => opt.value === val);
      return option?.pain || "";
    });
    setSelectedPains([...selectedPains.filter((p) => !currentQuestion.options.map((o) => o.pain).includes(p)), ...pains]);
  };

  const handleNext = () => {
    // Verificar desqualificação antes de avançar
    const currentAnswers = (answers[currentQuestion.id] as string[]) || [];
    const disqualificationResult = checkDisqualification(currentQuestion.id, currentAnswers);
    
    if (disqualificationResult) {
      setDisqualified(disqualificationResult);
      return;
    }

    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Determinar plano baseado na quantidade de alunos (prioridade principal)
      const studentAnswer = answers["students_count"] as string[] || [];
      const revenueAnswer = answers["revenue"] as string[] || [];
      
      let recommendedProfile: "beginner" | "starter" | "pro" | "business" = "beginner";
      
      // Lógica baseada em alunos
      if (studentAnswer.includes("1_5")) {
        recommendedProfile = "beginner";
      } else if (studentAnswer.includes("6_15")) {
        recommendedProfile = "starter";
      } else if (studentAnswer.includes("16_30")) {
        recommendedProfile = "pro";
      } else if (studentAnswer.includes("over_30")) {
        recommendedProfile = "business";
      }
      
      // Ajustar se renda for muito baixa (não pode pagar plano caro)
      if (revenueAnswer.includes("under_2k")) {
        // Se ganha menos de 2k, máximo é Starter
        if (recommendedProfile === "pro" || recommendedProfile === "business") {
          recommendedProfile = "starter";
        }
      }
      
      // Mapear profile para resultado
      const profileToResult: Record<string, Omit<QuizResult, "pains">> = {
        beginner: {
          profile: "beginner",
          planName: "Beginner",
          price: 39.9,
          studentLimit: 5,
          extraStudentPrice: 7.98,
          score: 1,
          message: "Perfeito para quem está começando! Com até 5 alunos, o plano Beginner é ideal para organizar seu negócio sem pesar no bolso.",
          urgency: "low",
        },
        starter: {
          profile: "starter",
          planName: "Starter",
          price: 97,
          studentLimit: 15,
          extraStudentPrice: 6.47,
          score: 2,
          message: "Você já tem uma base sólida de alunos! O plano Starter vai te ajudar a organizar tudo e crescer ainda mais.",
          urgency: "medium",
        },
        pro: {
          profile: "pro",
          planName: "Pro",
          price: 147,
          studentLimit: 25,
          extraStudentPrice: 5.88,
          score: 3,
          message: "Seu negócio está crescendo! O plano Pro tem tudo que você precisa para gerenciar até 25 alunos com eficiência.",
          urgency: "medium",
        },
        business: {
          profile: "business",
          planName: "Business",
          price: 197,
          studentLimit: 40,
          extraStudentPrice: 4.93,
          score: 4,
          message: "Você é um personal de sucesso! O plano Business foi feito para profissionais como você que precisam escalar.",
          urgency: "high",
        },
      };
      
      const baseResult = profileToResult[recommendedProfile];
      
      const quizResult: QuizResult = {
        ...baseResult,
        pains: Array.from(new Set(selectedPains)),
      };
      
      setResult(quizResult);
      onComplete?.(quizResult);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isAnswered =
    currentQuestion.type === "single"
      ? answers[currentQuestion.id]
      : (answers[currentQuestion.id] as string[])?.length > 0;

  // Tela de desqualificação
  if (disqualified) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-2 border-gray-300">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-4xl">😔</span>
            </div>
          </div>
          <CardTitle className="text-2xl text-gray-700">Ops! Ainda não é o momento certo</CardTitle>
          <CardDescription className="text-lg mt-4 text-gray-600">
            {disqualified.message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
            <p className="text-gray-600 mb-4">
              Enquanto isso, que tal seguir nossas dicas gratuitas para conquistar seus primeiros alunos?
            </p>
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
              className="mr-2"
            >
              Voltar ao Início
            </Button>
            <Button
              onClick={() => window.open("https://instagram.com/fitprimemanager", "_blank")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Seguir no Instagram
            </Button>
          </div>

          <p className="text-center text-sm text-gray-500">
            Quando estiver pronto, volte aqui! Estaremos te esperando. 💚
          </p>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    return (
      <Card
        className={`w-full max-w-2xl mx-auto border-2 ${
          result.urgency === "high"
            ? "border-red-500"
            : result.urgency === "medium"
              ? "border-yellow-500"
              : "border-green-500"
        }`}
      >
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl">Análise Completa! 🎯</CardTitle>
          <CardDescription className="text-lg mt-2">{result.message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Dores Identificadas */}
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="font-bold text-lg mb-3">Dores Identificadas:</h3>
            <div className="flex flex-wrap gap-2">
              {result.pains.map((pain, idx) => (
                <span key={idx} className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {pain}
                </span>
              ))}
            </div>
          </div>

          {/* Score Visual */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
            <div className="text-center mb-4">
              <p className="text-gray-600 text-sm">Seu Score de Dor</p>
              <div className="text-5xl font-bold text-emerald-600">{result.score}/5</div>
            </div>
            <Progress value={(result.score / 5) * 100} className="h-3" />
          </div>

          {/* Plano Recomendado */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-lg border border-emerald-200">
            <h3 className="font-bold text-xl mb-4">Seu Plano Recomendado:</h3>
            <div className="space-y-3">
              <div>
                <p className="text-gray-600">Plano</p>
                <p className="text-2xl font-bold text-emerald-600">{result.planName}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Preço/Mês</p>
                  <p className="text-xl font-bold">R$ {result.price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Alunos Inclusos</p>
                  <p className="text-xl font-bold">{result.studentLimit}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Aluno Extra</p>
                <p className="text-lg font-semibold">+ R$ {result.extraStudentPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={() => {
              // Salvar resultado no localStorage
              localStorage.setItem("quizResult", JSON.stringify(result));
              window.location.href = `/pricing-complete?profile=${result.profile}`;
            }}
            className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Ver Landing Page Completa <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <p className="text-center text-sm text-gray-500">
            30 dias de teste gratuito. Sem cartão de crédito.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <CardTitle>Descubra Seu Plano Ideal</CardTitle>
              <span className="text-sm text-gray-500">
                {currentStep + 1} de {QUIZ_QUESTIONS.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">{currentQuestion.title}</h2>
          {currentQuestion.description && (
            <p className="text-gray-600">{currentQuestion.description}</p>
          )}
        </div>

        <div className="space-y-3">
          {currentQuestion.type === "single" ? (
            currentQuestion.options.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <input
                  type="radio"
                  id={option.value}
                  name={currentQuestion.id}
                  value={option.value}
                  checked={answers[currentQuestion.id] === option.value}
                  onChange={() => handleSingleAnswer(option.value)}
                  className="mt-1 w-4 h-4"
                />
                <Label
                  htmlFor={option.value}
                  className="flex-1 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition"
                >
                  <p className="font-medium">{option.label}</p>
                </Label>
              </div>
            ))
          ) : (
            currentQuestion.options.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <Checkbox
                  id={option.value}
                  checked={((answers[currentQuestion.id] as string[]) || []).includes(option.value)}
                  onCheckedChange={(checked) => handleMultipleAnswer(option.value, checked as boolean)}
                  className="mt-1"
                />
                <Label
                  htmlFor={option.value}
                  className="flex-1 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition"
                >
                  <p className="font-medium">{option.label}</p>
                </Label>
              </div>
            ))
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
            className="flex-1"
          >
            Voltar
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isAnswered}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            {currentStep === QUIZ_QUESTIONS.length - 1 ? "Ver Resultado" : "Próxima"}{" "}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
