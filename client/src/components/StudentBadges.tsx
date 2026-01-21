import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trophy, Lock, Loader2 } from "lucide-react";

interface BadgeInfo {
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface StudentBadgeData {
  id: number;
  badgeType: string;
  earnedAt: Date | string;
  info: BadgeInfo;
}

const ALL_BADGES = [
  "first_session",
  "streak_7",
  "streak_30",
  "streak_90",
  "perfect_month",
  "sessions_10",
  "sessions_50",
  "sessions_100",
  "first_measurement",
  "weight_goal",
  "body_fat_goal",
  "muscle_gain",
  "profile_complete",
  "early_bird",
  "night_owl",
  "weekend_warrior",
  "anniversary_1",
  "comeback",
];

const BADGE_INFO: Record<string, BadgeInfo> = {
  first_session: { name: "Primeiro Passo", description: "Completou sua primeira sessão de treino", icon: "🎯", color: "emerald" },
  streak_7: { name: "Consistência", description: "7 sessões de treino consistentes", icon: "🔥", color: "orange" },
  streak_30: { name: "Dedicação", description: "30 dias de treino consistente", icon: "💪", color: "red" },
  streak_90: { name: "Lenda", description: "90 dias de treino consistente", icon: "🏆", color: "yellow" },
  perfect_month: { name: "Mês Perfeito", description: "Um mês inteiro sem faltas", icon: "⭐", color: "purple" },
  sessions_10: { name: "Aquecendo", description: "10 sessões realizadas", icon: "🌟", color: "blue" },
  sessions_50: { name: "Em Forma", description: "50 sessões realizadas", icon: "💎", color: "cyan" },
  sessions_100: { name: "Centurião", description: "100 sessões realizadas", icon: "👑", color: "gold" },
  first_measurement: { name: "Ponto de Partida", description: "Primeira avaliação física registrada", icon: "📏", color: "teal" },
  weight_goal: { name: "Meta Alcançada", description: "Atingiu sua meta de peso", icon: "🎉", color: "green" },
  body_fat_goal: { name: "Definição", description: "Atingiu sua meta de gordura corporal", icon: "💯", color: "pink" },
  muscle_gain: { name: "Hipertrofia", description: "Ganho significativo de massa muscular", icon: "💪", color: "red" },
  profile_complete: { name: "Perfil Completo", description: "Preencheu toda a anamnese", icon: "✅", color: "green" },
  early_bird: { name: "Madrugador", description: "5 treinos antes das 7h", icon: "🌅", color: "amber" },
  night_owl: { name: "Coruja", description: "5 treinos depois das 20h", icon: "🌙", color: "indigo" },
  weekend_warrior: { name: "Guerreiro de Fim de Semana", description: "10 treinos no fim de semana", icon: "⚔️", color: "slate" },
  anniversary_1: { name: "Aniversário", description: "1 ano de treino", icon: "🎂", color: "pink" },
  comeback: { name: "Retorno Triunfal", description: "Voltou após período de inatividade", icon: "🔄", color: "blue" },
};

export default function StudentBadges() {
  const { data: earnedBadges, isLoading } = trpc.studentPortal.badges.useQuery();
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        </CardContent>
      </Card>
    );
  }
  
  const earnedBadgeTypes = new Set(earnedBadges?.map((b: StudentBadgeData) => b.badgeType) || []);
  const earnedCount = earnedBadgeTypes.size;
  const totalCount = ALL_BADGES.length;
  
  return (
    <div className="space-y-6">
      {/* Resumo */}
      <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Suas Conquistas</h2>
              <p className="text-emerald-100">Continue treinando para desbloquear mais!</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{earnedCount}/{totalCount}</div>
              <p className="text-emerald-100 text-sm">badges conquistados</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Badges Conquistados */}
      {earnedBadges && earnedBadges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Conquistados
            </CardTitle>
            <CardDescription>Parabéns por suas conquistas!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {earnedBadges.map((badge: StudentBadgeData) => (
                <div
                  key={badge.id}
                  className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/50 text-center hover:shadow-md transition-shadow"
                >
                  <div className="text-4xl mb-2">{badge.info.icon}</div>
                  <h3 className="font-semibold text-sm">{badge.info.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{badge.info.description}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {format(new Date(badge.earnedAt), "dd/MM/yyyy", { locale: ptBR })}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Badges Bloqueados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-gray-400" />
            A Conquistar
          </CardTitle>
          <CardDescription>Continue treinando para desbloquear</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {ALL_BADGES.filter(type => !earnedBadgeTypes.has(type)).map((type) => {
              const info = BADGE_INFO[type];
              return (
                <div
                  key={type}
                  className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/50 text-center opacity-60"
                >
                  <div className="text-4xl mb-2 grayscale">{info.icon}</div>
                  <h3 className="font-semibold text-sm text-gray-600 dark:text-gray-300">{info.name}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{info.description}</p>
                  <Badge variant="outline" className="mt-2 text-xs bg-gray-100">
                    <Lock className="h-3 w-3 mr-1" />
                    Bloqueado
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
