import QualificationQuizV4Whatsapp from "@/components/QualificationQuizV4Whatsapp";
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

export default function QuizPage2() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    trackPageView('/quiz-2');
  }, []);

  const handleQuizComplete = (result: QuizResult) => {
    // Armazenar resultado no localStorage para usar na página de resultado
    localStorage.setItem("quizResult", JSON.stringify(result));
    
    // Tracking de conversão
    trackQuizCompleted(result.painScore + result.solutionScore, result.answers);
    console.log("Quiz 2 completed:", result);
  };

  return <QualificationQuizV4Whatsapp onComplete={handleQuizComplete} />;
}
