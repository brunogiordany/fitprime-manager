import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  ArrowRight, 
  Users, 
  Zap,
  Star,
  Shield,
  Clock,
  TrendingUp
} from "lucide-react";

// Definição dos planos
const PLANS = {
  beginner: {
    name: "Beginner",
    price: 39.90,
    maxStudents: 5,
    extraPerStudent: 7.98,
    color: "emerald",
    caktoUrl: "https://pay.cakto.com.br/beginner-fitprime",
    features: [
      "Até 5 alunos",
      "Treinos com IA",
      "Agenda inteligente",
      "Cobranças automáticas",
      "Portal do aluno",
      "Suporte por chat"
    ],
    ideal: "Ideal para quem está começando"
  },
  starter: {
    name: "Starter",
    price: 97,
    maxStudents: 15,
    extraPerStudent: 6.47,
    color: "blue",
    caktoUrl: "https://pay.cakto.com.br/starter-fitprime",
    features: [
      "Até 15 alunos",
      "Treinos com IA",
      "Agenda inteligente",
      "Cobranças automáticas",
      "Portal do aluno",
      "Automações WhatsApp",
      "Relatórios básicos"
    ],
    ideal: "Ideal para personals em crescimento"
  },
  pro: {
    name: "Pro",
    price: 147,
    maxStudents: 30,
    extraPerStudent: 4.90,
    color: "purple",
    caktoUrl: "https://pay.cakto.com.br/pro-fitprime",
    features: [
      "Até 30 alunos",
      "Treinos com IA ilimitados",
      "Agenda inteligente",
      "Cobranças automáticas",
      "Portal do aluno premium",
      "Automações WhatsApp",
      "Relatórios avançados",
      "Análise de evolução"
    ],
    ideal: "Ideal para personals consolidados"
  },
  business: {
    name: "Business",
    price: 197,
    maxStudents: 50,
    extraPerStudent: 3.94,
    color: "orange",
    caktoUrl: "https://pay.cakto.com.br/business-fitprime",
    features: [
      "Até 50 alunos",
      "Treinos com IA ilimitados",
      "Agenda inteligente",
      "Cobranças automáticas",
      "Portal do aluno premium",
      "Automações WhatsApp",
      "Relatórios avançados",
      "Análise de evolução",
      "Suporte prioritário"
    ],
    ideal: "Ideal para negócios em expansão"
  },
  premium: {
    name: "Premium",
    price: 297,
    maxStudents: 100,
    extraPerStudent: 2.97,
    color: "amber",
    caktoUrl: "https://pay.cakto.com.br/premium-fitprime",
    features: [
      "Até 100 alunos",
      "Treinos com IA ilimitados",
      "Agenda inteligente",
      "Cobranças automáticas",
      "Portal do aluno premium",
      "Automações WhatsApp",
      "Relatórios avançados",
      "Análise de evolução",
      "Suporte VIP",
      "Consultoria mensal"
    ],
    ideal: "Ideal para studios e equipes"
  },
  enterprise: {
    name: "Enterprise",
    price: 497,
    maxStudents: 999,
    extraPerStudent: 0,
    color: "rose",
    caktoUrl: "https://pay.cakto.com.br/enterprise-fitprime",
    features: [
      "Alunos ilimitados",
      "Treinos com IA ilimitados",
      "Agenda inteligente",
      "Cobranças automáticas",
      "Portal do aluno premium",
      "Automações WhatsApp",
      "Relatórios avançados",
      "Análise de evolução",
      "Suporte VIP dedicado",
      "Consultoria semanal",
      "API personalizada"
    ],
    ideal: "Ideal para grandes operações"
  }
};

// Plano Beginner sempre aparece como opção
const BEGINNER_PLAN = PLANS.beginner;

interface QuizData {
  currentStudents: number;
  currentRevenue: number;
  goalRevenue: number;
  painScore: number;
  recommendedPlan: string;
}

export default function QuizResultPlan() {
  const [, setLocation] = useLocation();
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [recommendedPlan, setRecommendedPlan] = useState<keyof typeof PLANS>("starter");

  useEffect(() => {
    // Pegar dados do quiz do localStorage
    const savedData = localStorage.getItem("quizResult");
    if (savedData) {
      const data = JSON.parse(savedData) as QuizData;
      setQuizData(data);
      
      // Determinar plano baseado na quantidade de alunos
      if (data.currentStudents <= 5) setRecommendedPlan("beginner");
      else if (data.currentStudents <= 15) setRecommendedPlan("starter");
      else if (data.currentStudents <= 30) setRecommendedPlan("pro");
      else if (data.currentStudents <= 50) setRecommendedPlan("business");
      else if (data.currentStudents <= 100) setRecommendedPlan("premium");
      else setRecommendedPlan("enterprise");
    } else {
      // Se não tiver dados, redirecionar para o quiz
      setLocation("/quiz");
    }
  }, [setLocation]);

  if (!quizData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  const idealPlan = PLANS[recommendedPlan];
  const showBeginnerOption = recommendedPlan !== "beginner";

  // Cálculos de impacto
  const hoursPerMonth = quizData.painScore > 15 ? 40 : quizData.painScore > 10 ? 30 : 15;
  const potentialExtraStudents = Math.round(hoursPerMonth / 4);
  const avgRevenuePerStudent = quizData.currentStudents > 0 ? quizData.currentRevenue / quizData.currentStudents : 300;
  const potentialExtraRevenue = potentialExtraStudents * avgRevenuePerStudent;
  const yearlyPotentialGain = potentialExtraRevenue * 12;

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
      emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500", text: "text-emerald-400", badge: "bg-emerald-500" },
      blue: { bg: "bg-blue-500/10", border: "border-blue-500", text: "text-blue-400", badge: "bg-blue-500" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500", text: "text-purple-400", badge: "bg-purple-500" },
      orange: { bg: "bg-orange-500/10", border: "border-orange-500", text: "text-orange-400", badge: "bg-orange-500" },
      amber: { bg: "bg-amber-500/10", border: "border-amber-500", text: "text-amber-400", badge: "bg-amber-500" },
      rose: { bg: "bg-rose-500/10", border: "border-rose-500", text: "text-rose-400", badge: "bg-rose-500" },
    };
    return colors[color] || colors.emerald;
  };

  const idealColors = getColorClasses(idealPlan.color);
  const beginnerColors = getColorClasses(BEGINNER_PLAN.color);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="bg-emerald-500 text-white mb-4">
            Resultado do Diagnóstico
          </Badge>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            Encontramos o plano perfeito para você!
          </h1>
          <p className="text-gray-400">
            Com base nos seus {quizData.currentStudents} alunos e suas necessidades
          </p>
        </div>

        {/* Resumo do Impacto */}
        <Card className="border-0 shadow-2xl bg-gray-800/50 backdrop-blur mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Seu Potencial com o FitPrime
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-500/10 rounded-xl">
                <p className="text-2xl font-bold text-emerald-400">{hoursPerMonth}h</p>
                <p className="text-xs text-gray-400">Horas recuperadas/mês</p>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-xl">
                <p className="text-2xl font-bold text-blue-400">+{potentialExtraStudents}</p>
                <p className="text-xs text-gray-400">Alunos extras possíveis</p>
              </div>
              <div className="text-center p-4 bg-purple-500/10 rounded-xl">
                <p className="text-2xl font-bold text-purple-400">R$ {potentialExtraRevenue.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-gray-400">Potencial extra/mês</p>
              </div>
              <div className="text-center p-4 bg-amber-500/10 rounded-xl">
                <p className="text-2xl font-bold text-amber-400">R$ {yearlyPotentialGain.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-gray-400">Potencial extra/ano</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Planos */}
        <div className={`grid ${showBeginnerOption ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-xl mx-auto'} gap-6 mb-8`}>
          {/* Plano Ideal (Recomendado) */}
          <Card className={`border-2 ${idealColors.border} shadow-2xl bg-gray-800/50 backdrop-blur relative overflow-hidden`}>
            <div className={`absolute top-0 left-0 right-0 ${idealColors.badge} text-white text-center py-2 text-sm font-bold`}>
              ⭐ RECOMENDADO PARA VOCÊ
            </div>
            <CardContent className="p-6 pt-14">
              <div className="text-center mb-6">
                <h3 className={`text-2xl font-bold ${idealColors.text} mb-1`}>
                  Plano {idealPlan.name}
                </h3>
                <p className="text-gray-400 text-sm">{idealPlan.ideal}</p>
                <div className="mt-4">
                  <span className="text-4xl font-black text-white">R$ {idealPlan.price.toFixed(2).replace('.', ',')}</span>
                  <span className="text-gray-400">/mês</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Até {idealPlan.maxStudents} alunos inclusos
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {idealPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-300">
                    <CheckCircle2 className={`w-5 h-5 ${idealColors.text} flex-shrink-0`} />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full h-14 text-lg font-bold ${idealColors.badge} hover:opacity-90`}
                onClick={() => window.open(idealPlan.caktoUrl, '_blank')}
              >
                Começar com {idealPlan.name}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              <p className="text-center text-xs text-gray-500 mt-3">
                Aluno extra: R$ {idealPlan.extraPerStudent.toFixed(2).replace('.', ',')}
              </p>
            </CardContent>
          </Card>

          {/* Plano Beginner (Opção Econômica) - Só aparece se não for o recomendado */}
          {showBeginnerOption && (
            <Card className={`border-2 ${beginnerColors.border} shadow-xl bg-gray-800/30 backdrop-blur`}>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Badge className="bg-gray-600 text-white mb-2">
                    💰 Opção Econômica
                  </Badge>
                  <h3 className={`text-2xl font-bold ${beginnerColors.text} mb-1`}>
                    Plano {BEGINNER_PLAN.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{BEGINNER_PLAN.ideal}</p>
                  <div className="mt-4">
                    <span className="text-4xl font-black text-white">R$ {BEGINNER_PLAN.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-gray-400">/mês</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Até {BEGINNER_PLAN.maxStudents} alunos inclusos
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  {BEGINNER_PLAN.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-300">
                      <CheckCircle2 className={`w-5 h-5 ${beginnerColors.text} flex-shrink-0`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  variant="outline"
                  className={`w-full h-12 ${beginnerColors.border} ${beginnerColors.text} hover:${beginnerColors.bg}`}
                  onClick={() => window.open(BEGINNER_PLAN.caktoUrl, '_blank')}
                >
                  Começar com {BEGINNER_PLAN.name}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                <p className="text-center text-xs text-gray-500 mt-3">
                  Aluno extra: R$ {BEGINNER_PLAN.extraPerStudent.toFixed(2).replace('.', ',')}
                </p>

                {quizData.currentStudents > 5 && (
                  <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                    <p className="text-xs text-amber-400 text-center">
                      ⚠️ Você tem {quizData.currentStudents} alunos. Com este plano, pagará R$ {((quizData.currentStudents - 5) * BEGINNER_PLAN.extraPerStudent).toFixed(2).replace('.', ',')} extra por mês pelos {quizData.currentStudents - 5} alunos excedentes.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Garantias */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="text-center p-4 bg-gray-800/30 rounded-xl">
            <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Garantia de 7 dias</p>
          </div>
          <div className="text-center p-4 bg-gray-800/30 rounded-xl">
            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Cancele quando quiser</p>
          </div>
          <div className="text-center p-4 bg-gray-800/30 rounded-xl">
            <Zap className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Acesso imediato</p>
          </div>
          <div className="text-center p-4 bg-gray-800/30 rounded-xl">
            <Star className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Suporte incluso</p>
          </div>
        </div>

        {/* CTA Final */}
        <div className="text-center">
          <p className="text-gray-400 mb-4">
            Ainda tem dúvidas? <a href="/" className="text-emerald-400 hover:underline">Volte para a página inicial</a> ou <a href="/quiz" className="text-emerald-400 hover:underline">refaça o diagnóstico</a>
          </p>
        </div>
      </div>
    </div>
  );
}
