import QualificationQuizV4 from "@/components/QualificationQuizV4";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trackPageView, trackQuizCompleted } from "@/lib/analytics";

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

  useEffect(() => {
    trackPageView('/quiz');
  }, []);

  const handleQuizComplete = (result: QuizResult) => {
    // Armazenar resultado no localStorage para usar na página de pricing
    localStorage.setItem("quizResult", JSON.stringify(result));
    
    // Tracking de conversão
    trackQuizCompleted(result.painScore + result.solutionScore, result.answers);
    console.log("Quiz completed:", result);
  };

  return <QualificationQuizV4 onComplete={handleQuizComplete} />;
}
