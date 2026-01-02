import { useState } from "react";
import { QualificationQuiz } from "@/components/QualificationQuiz";
import { useLocation } from "wouter";

interface QuizResult {
  profile: "beginner" | "starter" | "pro" | "business";
  planName: string;
  price: number;
  studentLimit: number;
  extraStudentPrice: number;
  message: string;
}

export default function QuizPage() {
  const [, setLocation] = useLocation();

  const handleQuizComplete = (result: QuizResult) => {
    // Armazenar resultado no localStorage para usar na LP
    localStorage.setItem("quizResult", JSON.stringify(result));
    
    // Redirecionar para LP dinâmica
    setTimeout(() => {
      setLocation(`/pricing?profile=${result.profile}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2">Encontre o Plano Perfeito</h1>
          <p className="text-xl text-gray-600">
            Responda 3 perguntas rápidas e descobriremos qual plano vai turbinar seu negócio
          </p>
        </div>

        {/* Quiz */}
        <QualificationQuiz onComplete={handleQuizComplete} />

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Leva menos de 1 minuto ⏱️</p>
        </div>
      </div>
    </div>
  );
}
