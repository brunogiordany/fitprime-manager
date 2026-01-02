import QualificationQuizV4 from "@/components/QualificationQuizV4";
import { useLocation } from "wouter";

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

export default function QuizPage() {
  const [, setLocation] = useLocation();

  const handleQuizComplete = (result: QuizResult) => {
    // Armazenar resultado no localStorage para usar na página de pricing
    localStorage.setItem("quizResult", JSON.stringify(result));
    
    // O componente já redireciona internamente, mas podemos usar isso para tracking
    console.log("Quiz completed:", result);
  };

  return <QualificationQuizV4 onComplete={handleQuizComplete} />;
}
