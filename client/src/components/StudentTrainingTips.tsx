import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format, differenceInHours, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Apple,
  Moon,
  Dumbbell,
  Clock,
  X,
  Flame,
  Heart,
  Zap,
} from "lucide-react";

interface Session {
  id: number;
  date?: Date | string;
  scheduledAt?: Date | string;
  duration: number | null;
  status: string;
}

interface StudentTrainingTipsProps {
  nextSession?: Session | null;
  studentGoal?: string;
}

interface Tip {
  id: string;
  icon: any;
  title: string;
  description: string;
  timing: string;
  color: string;
  bgColor: string;
}

const PRE_WORKOUT_TIPS: Tip[] = [
  {
    id: "meal-pre",
    icon: Apple,
    title: "Alimentação Pré-Treino",
    description: "Faça uma refeição leve com carboidratos e proteínas",
    timing: "1-2h antes",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: "sleep",
    icon: Moon,
    title: "Descanso",
    description: "Certifique-se de ter dormido bem na noite anterior",
    timing: "Noite anterior",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    id: "warmup",
    icon: Flame,
    title: "Aquecimento",
    description: "Chegue 10 minutos antes para aquecer",
    timing: "10min antes",
    color: "text-orange-600",
    bgColor: "bg-orange-50",
  },
];

const POST_WORKOUT_TIPS: Tip[] = [
  {
    id: "meal-post",
    icon: Apple,
    title: "Alimentação Pós-Treino",
    description: "Consuma proteínas e carboidratos em até 1 hora",
    timing: "Até 1h após",
    color: "text-green-600",
    bgColor: "bg-green-50",
  },
  {
    id: "stretch",
    icon: Heart,
    title: "Alongamento",
    description: "Faça 5-10 minutos de alongamento para recuperação",
    timing: "Após treino",
    color: "text-pink-600",
    bgColor: "bg-pink-50",
  },
  {
    id: "rest",
    icon: Moon,
    title: "Descanso",
    description: "Durma bem para maximizar a recuperação muscular",
    timing: "À noite",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

const GOAL_TIPS: Record<string, Tip[]> = {
  emagrecimento: [
    {
      id: "deficit",
      icon: Flame,
      title: "Déficit Calórico",
      description: "Mantenha um déficit de 300-500 calorias por dia",
      timing: "Diário",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      id: "cardio",
      icon: Zap,
      title: "Cardio",
      description: "Inclua 20-30 min de cardio após a musculação",
      timing: "Pós-treino",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ],
  hipertrofia: [
    {
      id: "protein",
      icon: Apple,
      title: "Proteína",
      description: "Consuma 1.6-2.2g de proteína por kg de peso",
      timing: "Diário",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      id: "surplus",
      icon: Flame,
      title: "Superávit Calórico",
      description: "Mantenha um superávit de 200-300 calorias",
      timing: "Diário",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ],
  condicionamento: [
    {
      id: "consistency",
      icon: Dumbbell,
      title: "Consistência",
      description: "Mantenha a frequência de treinos semanal",
      timing: "Semanal",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ],
};

export default function StudentTrainingTips({ nextSession, studentGoal }: StudentTrainingTipsProps) {
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);

  // Carregar dicas dispensadas do localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`dismissedTips_${today}`);
    if (stored) {
      setDismissedTips(JSON.parse(stored));
    } else {
      setDismissedTips([]);
    }
  }, []);

  const dismissTip = (tipId: string) => {
    const today = new Date().toDateString();
    const newDismissed = [...dismissedTips, tipId];
    setDismissedTips(newDismissed);
    localStorage.setItem(`dismissedTips_${today}`, JSON.stringify(newDismissed));
  };

  // Determinar quais dicas mostrar baseado na próxima sessão
  const getRelevantTips = (): Tip[] => {
    if (!nextSession) return [];
    
    const sessionDate = new Date(nextSession.scheduledAt || nextSession.date!);
    const hoursUntil = differenceInHours(sessionDate, new Date());
    
    let tips: Tip[] = [];
    
    // Se o treino é hoje ou amanhã, mostrar dicas pré-treino
    if (hoursUntil > 0 && hoursUntil <= 24) {
      tips = [...PRE_WORKOUT_TIPS];
    }
    
    // Adicionar dicas baseadas no objetivo
    if (studentGoal && GOAL_TIPS[studentGoal.toLowerCase()]) {
      tips = [...tips, ...GOAL_TIPS[studentGoal.toLowerCase()]];
    }
    
    // Filtrar dicas já dispensadas
    return tips.filter(tip => !dismissedTips.includes(tip.id));
  };

  const relevantTips = getRelevantTips();
  const sessionDate = nextSession ? new Date(nextSession.scheduledAt || nextSession.date!) : null;
  const hoursUntil = sessionDate ? differenceInHours(sessionDate, new Date()) : null;

  return (
    <div className="space-y-4">
      {/* Próximo Treino */}
      {nextSession && sessionDate && hoursUntil !== null && hoursUntil > 0 && hoursUntil <= 48 && (
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-emerald-700 text-lg">
              <Dumbbell className="h-5 w-5" />
              Próximo Treino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-emerald-800">
                  {isToday(sessionDate)
                    ? "Hoje"
                    : isTomorrow(sessionDate)
                    ? "Amanhã"
                    : format(sessionDate, "EEEE", { locale: ptBR })}
                </p>
                <p className="text-sm text-emerald-600">
                  {format(sessionDate, "HH:mm")} - {nextSession.duration || 60} min
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <Clock className="h-3 w-3 mr-1" />
                Em {hoursUntil}h
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dicas de Treino */}
      {relevantTips.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-gray-700 text-lg">
              <Zap className="h-5 w-5 text-yellow-500" />
              Dicas para seu Treino
            </CardTitle>
            <CardDescription>
              Siga essas dicas para maximizar seus resultados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relevantTips.slice(0, 4).map((tip) => (
                <div
                  key={tip.id}
                  className={`flex items-start gap-3 p-3 rounded-lg ${tip.bgColor} relative group`}
                >
                  <div className={`p-2 rounded-full bg-white ${tip.color}`}>
                    <tip.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium text-sm ${tip.color}`}>{tip.title}</p>
                      <Badge variant="outline" className="text-xs">
                        {tip.timing}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-0.5">{tip.description}</p>
                  </div>
                  <button
                    onClick={() => dismissTip(tip.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 rounded"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
