import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRight } from "lucide-react";

interface QuizQuestion {
  id: string;
  title: string;
  description?: string;
  options: {
    value: string;
    label: string;
    icon?: string;
  }[];
}

interface QuizResult {
  profile: "beginner" | "starter" | "pro" | "business";
  planName: string;
  price: number;
  studentLimit: number;
  extraStudentPrice: number;
  message: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "students",
    title: "Quantos alunos você tem atualmente?",
    description: "Isso nos ajuda a entender seu estágio de crescimento",
    options: [
      { value: "1-5", label: "1 a 5 alunos", icon: "👤" },
      { value: "6-15", label: "6 a 15 alunos", icon: "👥" },
      { value: "16-30", label: "16 a 30 alunos", icon: "👨‍👩‍👧‍👦" },
      { value: "31+", label: "31+ alunos", icon: "🏢" },
    ],
  },
  {
    id: "challenge",
    title: "Qual é seu maior desafio?",
    description: "Escolha o que mais te tira o sono",
    options: [
      { value: "organization", label: "Organizar treinos e acompanhamento" },
      { value: "billing", label: "Cobranças e inadimplência" },
      { value: "growth", label: "Conquistar novos alunos" },
      { value: "time", label: "Falta de tempo" },
    ],
  },
  {
    id: "revenue",
    title: "Qual é sua receita mensal?",
    description: "Nos ajuda a personalizar a melhor solução",
    options: [
      { value: "under_2k", label: "Até R$ 2.000" },
      { value: "2k_5k", label: "R$ 2.000 - R$ 5.000" },
      { value: "5k_10k", label: "R$ 5.000 - R$ 10.000" },
      { value: "over_10k", label: "Acima de R$ 10.000" },
    ],
  },
];

const QUIZ_RESULTS: Record<string, QuizResult> = {
  "1-5_under_2k": {
    profile: "beginner",
    planName: "Beginner",
    price: 39.9,
    studentLimit: 5,
    extraStudentPrice: 7.98,
    message: "Perfeito para você começar com o pé direito! 🚀",
  },
  "1-5_2k_5k": {
    profile: "beginner",
    planName: "Beginner",
    price: 39.9,
    studentLimit: 5,
    extraStudentPrice: 7.98,
    message: "Você está pronto para crescer! Comece com Beginner 📈",
  },
  "6-15_under_2k": {
    profile: "starter",
    planName: "Starter",
    price: 97,
    studentLimit: 15,
    extraStudentPrice: 6.47,
    message: "Starter é ideal para você neste momento! 💪",
  },
  "6-15_2k_5k": {
    profile: "starter",
    planName: "Starter",
    price: 97,
    studentLimit: 15,
    extraStudentPrice: 6.47,
    message: "Starter vai acelerar seu crescimento! 🎯",
  },
  "6-15_5k_10k": {
    profile: "pro",
    planName: "Pro",
    price: 147,
    studentLimit: 25,
    extraStudentPrice: 5.88,
    message: "Pro é o próximo passo para você! 🌟",
  },
  "16-30_2k_5k": {
    profile: "pro",
    planName: "Pro",
    price: 147,
    studentLimit: 25,
    extraStudentPrice: 5.88,
    message: "Pro vai organizar seus 25+ alunos perfeitamente! 🎊",
  },
  "16-30_5k_10k": {
    profile: "pro",
    planName: "Pro",
    price: 147,
    studentLimit: 25,
    extraStudentPrice: 5.88,
    message: "Pro é feito para você! 🚀",
  },
  "16-30_over_10k": {
    profile: "business",
    planName: "Business",
    price: 197,
    studentLimit: 40,
    extraStudentPrice: 4.93,
    message: "Business vai levar seu negócio ao próximo nível! 🏆",
  },
  "31+_5k_10k": {
    profile: "business",
    planName: "Business",
    price: 197,
    studentLimit: 40,
    extraStudentPrice: 4.93,
    message: "Business é perfeito para sua escala! 💎",
  },
  "31+_over_10k": {
    profile: "business",
    planName: "Business",
    price: 197,
    studentLimit: 40,
    extraStudentPrice: 4.93,
    message: "Premium é a solução completa para você! 👑",
  },
};

interface QualificationQuizProps {
  onComplete?: (result: QuizResult) => void;
}

export function QualificationQuiz({ onComplete }: QualificationQuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);

  const currentQuestion = QUIZ_QUESTIONS[currentStep];
  const progress = ((currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion.id]: value,
    });
  };

  const handleNext = () => {
    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calcular resultado
      const key = `${answers.students}_${answers.revenue}`;
      const quizResult = QUIZ_RESULTS[key] || QUIZ_RESULTS["1-5_under_2k"];
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
  const canProceed = isAnswered && currentStep === QUIZ_QUESTIONS.length - 1;

  if (result) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-2 border-green-500">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <CardTitle className="text-3xl">Perfeito! 🎉</CardTitle>
          <CardDescription className="text-lg mt-2">{result.message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              ✅ Organize seus alunos sem caos  
              ✅ Cobranças automáticas  
              ✅ Acompanhamento em tempo real  
              ✅ Suporte dedicado
            </p>
          </div>

          <Button
            onClick={() => {
              // Redirecionar para checkout com plano pré-selecionado
              window.location.href = `/checkout?plan=${result.profile}`;
            }}
            className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700"
          >
            Começar Agora <ArrowRight className="ml-2 w-5 h-5" />
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
              <CardTitle>Encontre o Plano Perfeito</CardTitle>
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
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label
                  htmlFor={option.value}
                  className="flex-1 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 transition"
                >
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  {option.label}
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
