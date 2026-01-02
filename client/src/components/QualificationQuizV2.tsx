import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";

interface QuizQuestion {
  id: string;
  title: string;
  description?: string;
  options: {
    value: string;
    label: string;
    pain: string; // Qual dor identifica
    score: number; // 0 ou 1
  }[];
}

interface QuizResult {
  profile: "beginner" | "starter" | "pro" | "business";
  planName: string;
  price: number;
  studentLimit: number;
  extraStudentPrice: number;
  score: number;
  message: string;
  urgency: "low" | "medium" | "high";
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "management",
    title: "Como você gerencia seus alunos atualmente?",
    description: "Escolha a opção que melhor descreve sua realidade",
    options: [
      {
        value: "spreadsheet",
        label: "Planilhas Excel + WhatsApp",
        pain: "Desorganização",
        score: 1,
      },
      {
        value: "notebook",
        label: "Caderno e anotações",
        pain: "Falta de controle",
        score: 1,
      },
      {
        value: "head",
        label: "Tudo na minha cabeça",
        pain: "Risco de perder informações",
        score: 1,
      },
      {
        value: "system",
        label: "Já uso um sistema",
        pain: "Nenhuma (qualificado)",
        score: 0,
      },
    ],
  },
  {
    id: "frustration",
    title: "Qual situação mais te frustra com seus alunos?",
    description: "Seja honesto - qual é o seu maior incômodo?",
    options: [
      {
        value: "dropout",
        label: "Alunos desistem sem avisar",
        pain: "Perda de receita",
        score: 1,
      },
      {
        value: "no_progress",
        label: "Alunos não veem progresso e saem",
        pain: "Falta de acompanhamento",
        score: 1,
      },
      {
        value: "price_sensitive",
        label: "Alunos desistem porque acham caro",
        pain: "Falta de valor demonstrado",
        score: 1,
      },
      {
        value: "loyal",
        label: "Meus alunos são muito fiéis",
        pain: "Nenhuma (qualificado)",
        score: 0,
      },
    ],
  },
  {
    id: "admin_time",
    title: "Quanto tempo você gasta por semana com admin?",
    description: "Planilhas, WhatsApp, cobranças, anotações...",
    options: [
      {
        value: "over_10",
        label: "Mais de 10 horas",
        pain: "Tempo perdido",
        score: 1,
      },
      {
        value: "5_10",
        label: "5-10 horas",
        pain: "Falta de tempo para crescer",
        score: 1,
      },
      {
        value: "2_5",
        label: "2-5 horas",
        pain: "Ainda é muito",
        score: 1,
      },
      {
        value: "under_2",
        label: "Menos de 2 horas",
        pain: "Nenhuma (qualificado)",
        score: 0,
      },
    ],
  },
  {
    id: "fear",
    title: "Qual é seu maior medo como personal?",
    description: "O que te mantém acordado à noite?",
    options: [
      {
        value: "lose_students",
        label: "Perder alunos por falta de acompanhamento",
        pain: "Churn",
        score: 1,
      },
      {
        value: "no_growth",
        label: "Não conseguir crescer porque não tenho tempo",
        pain: "Falta de tempo + crescimento",
        score: 1,
      },
      {
        value: "no_results",
        label: "Alunos não veem resultados e saem",
        pain: "Falta de dados/inteligência",
        score: 1,
      },
      {
        value: "no_fear",
        label: "Não tenho medo, tudo está sob controle",
        pain: "Nenhuma (qualificado)",
        score: 0,
      },
    ],
  },
  {
    id: "priority",
    title: "Se você pudesse resolver UM problema, qual seria?",
    description: "Qual é o mais urgente?",
    options: [
      {
        value: "time",
        label: "Ter mais tempo para crescer",
        pain: "Falta de tempo",
        score: 1,
      },
      {
        value: "retention",
        label: "Parar de perder alunos",
        pain: "Churn",
        score: 1,
      },
      {
        value: "data",
        label: "Ter dados para tomar decisões melhores",
        pain: "Falta de inteligência",
        score: 1,
      },
      {
        value: "billing",
        label: "Automatizar cobranças e inadimplência",
        pain: "Problemas financeiros",
        score: 1,
      },
    ],
  },
];

const RESULT_MESSAGES: Record<number, QuizResult> = {
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
      "Identificamos que você está perdendo tempo com admin e alunos. FitPrime foi feito exatamente para resolver isso. Vamos mostrar como você pode recuperar 5+ horas por semana.",
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
      "Você está na mesma situação de 73% dos personals que começaram com FitPrime. Mas a boa notícia? Eles cresceram em média 3x em 6 meses.",
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
      "Você está na mesma situação de 87% dos personals que começaram com FitPrime. Eles cresceram em média 3x em 6 meses. Você quer fazer o mesmo?",
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

interface QualificationQuizV2Props {
  onComplete?: (result: QuizResult) => void;
}

export function QualificationQuizV2({ onComplete }: QualificationQuizV2Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scores, setScores] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleAnswer = (value: string) => {
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

  const handleNext = () => {
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calcular score total
      const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
      const quizResult = RESULT_MESSAGES[totalScore] || RESULT_MESSAGES[0];
      setResult(quizResult);
      onComplete?.(quizResult);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isAnswered = answers[currentQuestion?.id];

  if (result) {
    return (
      <Card className={`w-full max-w-2xl mx-auto border-2 ${
        result.urgency === "high"
          ? "border-red-500"
          : result.urgency === "medium"
            ? "border-yellow-500"
            : "border-green-500"
      }`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {result.urgency === "high" ? (
              <AlertCircle className="w-16 h-16 text-red-500" />
            ) : (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            )}
          </div>
          <CardTitle className="text-3xl">
            {result.urgency === "high" ? "Situação Crítica! 🚨" : "Perfeito! 🎉"}
          </CardTitle>
          <CardDescription className="text-lg mt-2">{result.message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
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

          {/* Benefícios */}
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-semibold">O que você vai ganhar:</p>
            <p className="text-sm text-gray-700">
              ✅ Recuperar 5+ horas por semana  
              ✅ Parar de perder alunos  
              ✅ Cobranças automáticas  
              ✅ Dados para crescer inteligentemente
            </p>
          </div>

          {/* CTA */}
          <Button
            onClick={() => {
              window.location.href = `/checkout?plan=${result.profile}`;
            }}
            className={`w-full h-12 text-lg ${
              result.urgency === "high"
                ? "bg-red-600 hover:bg-red-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {result.urgency === "high" ? "Resolver Agora" : "Começar Agora"}{" "}
            <ArrowRight className="ml-2 w-5 h-5" />
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

        <RadioGroup value={answers[currentQuestion.id] || ""} onValueChange={handleAnswer}>
          <div className="space-y-3">
            {currentQuestion.options.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                <Label
                  htmlFor={option.value}
                  className="flex-1 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition"
                >
                  <p className="font-medium">{option.label}</p>
                  <p className="text-xs text-gray-500 mt-1">Dor identificada: {option.pain}</p>
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

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
