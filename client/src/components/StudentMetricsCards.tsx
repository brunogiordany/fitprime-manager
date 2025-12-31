/**
 * FitPrime Manager - Cards de Métricas do Dashboard do Aluno
 * 
 * Exibe métricas visuais de progresso do aluno:
 * - Treinos completados no mês
 * - Sequência de treinos (streak)
 * - Evolução de peso/medidas
 * - Próxima sessão agendada
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dumbbell, 
  Flame, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Target,
  Award,
  Scale,
  Ruler,
  Activity,
  Clock,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  progress?: number;
  color?: 'emerald' | 'blue' | 'orange' | 'purple' | 'red';
  badge?: string;
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue,
  progress,
  color = 'emerald',
  badge
}: MetricCardProps) {
  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      text: 'text-emerald-600 dark:text-emerald-400',
      progress: '[&>div]:bg-emerald-500',
    },
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      progress: '[&>div]:bg-blue-500',
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-600 dark:text-orange-400',
      progress: '[&>div]:bg-orange-500',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      progress: '[&>div]:bg-purple-500',
    },
    red: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      progress: '[&>div]:bg-red-500',
    },
  };

  const colors = colorClasses[color];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className={cn("p-2 rounded-lg", colors.bg)}>
            <div className={colors.text}>{icon}</div>
          </div>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold">{value}</span>
            {trend && trendValue && (
              <span className={cn(
                "flex items-center text-xs font-medium",
                trend === 'up' ? 'text-emerald-600' :
                trend === 'down' ? 'text-red-600' :
                'text-gray-500'
              )}>
                {trend === 'up' && <ArrowUp className="h-3 w-3 mr-0.5" />}
                {trend === 'down' && <ArrowDown className="h-3 w-3 mr-0.5" />}
                {trend === 'neutral' && <Minus className="h-3 w-3 mr-0.5" />}
                {trendValue}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {progress !== undefined && (
          <Progress 
            value={progress} 
            className={cn("h-1.5 mt-3", colors.progress)}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface StudentMetricsCardsProps {
  // Dados de treinos
  workoutsThisMonth?: number;
  workoutsGoal?: number;
  currentStreak?: number;
  bestStreak?: number;
  
  // Dados de evolução
  currentWeight?: number;
  previousWeight?: number;
  weightGoal?: number;
  bodyFatCurrent?: number;
  bodyFatPrevious?: number;
  
  // Próxima sessão
  nextSession?: {
    date: Date;
    workoutName?: string;
  } | null;
  
  // Estados de loading
  isLoading?: boolean;
}

export default function StudentMetricsCards({
  workoutsThisMonth = 0,
  workoutsGoal = 12,
  currentStreak = 0,
  bestStreak = 0,
  currentWeight,
  previousWeight,
  weightGoal,
  bodyFatCurrent,
  bodyFatPrevious,
  nextSession,
  isLoading = false,
}: StudentMetricsCardsProps) {
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-4 w-20 mt-3" />
              <Skeleton className="h-8 w-16 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calcular progresso do mês
  const monthProgress = workoutsGoal > 0 
    ? Math.min(100, Math.round((workoutsThisMonth / workoutsGoal) * 100))
    : 0;

  // Calcular variação de peso
  const weightChange = currentWeight && previousWeight 
    ? currentWeight - previousWeight 
    : null;
  const weightTrend = weightChange === null ? undefined :
    weightChange < 0 ? 'down' : weightChange > 0 ? 'up' : 'neutral';
  const weightTrendValue = weightChange !== null 
    ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg`
    : undefined;

  // Calcular variação de BF
  const bfChange = bodyFatCurrent && bodyFatPrevious 
    ? bodyFatCurrent - bodyFatPrevious 
    : null;
  const bfTrend = bfChange === null ? undefined :
    bfChange < 0 ? 'down' : bfChange > 0 ? 'up' : 'neutral';
  const bfTrendValue = bfChange !== null 
    ? `${bfChange > 0 ? '+' : ''}${bfChange.toFixed(1)}%`
    : undefined;

  // Formatar próxima sessão
  const formatNextSession = () => {
    if (!nextSession) return { value: '-', subtitle: 'Nenhuma sessão agendada' };
    
    const now = new Date();
    const sessionDate = new Date(nextSession.date);
    const diffDays = Math.ceil((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return { 
        value: 'Hoje', 
        subtitle: sessionDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
    } else if (diffDays === 1) {
      return { 
        value: 'Amanhã', 
        subtitle: sessionDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
    } else if (diffDays <= 7) {
      return { 
        value: `${diffDays} dias`, 
        subtitle: sessionDate.toLocaleDateString('pt-BR', { weekday: 'long' })
      };
    } else {
      return { 
        value: sessionDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        subtitle: nextSession.workoutName || 'Sessão agendada'
      };
    }
  };

  const nextSessionInfo = formatNextSession();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Treinos do Mês */}
      <MetricCard
        title="Treinos este mês"
        value={workoutsThisMonth}
        subtitle={`Meta: ${workoutsGoal} treinos`}
        icon={<Dumbbell className="h-5 w-5" />}
        progress={monthProgress}
        color="emerald"
        badge={monthProgress >= 100 ? '🎯 Meta!' : undefined}
      />

      {/* Sequência de Treinos */}
      <MetricCard
        title="Sequência atual"
        value={`${currentStreak} dias`}
        subtitle={`Recorde: ${bestStreak} dias`}
        icon={<Flame className="h-5 w-5" />}
        color={currentStreak >= 7 ? 'orange' : 'blue'}
        badge={currentStreak >= 7 ? '🔥' : undefined}
      />

      {/* Peso Atual */}
      {currentWeight !== undefined ? (
        <MetricCard
          title="Peso atual"
          value={`${currentWeight.toFixed(1)}kg`}
          subtitle={weightGoal ? `Meta: ${weightGoal}kg` : undefined}
          icon={<Scale className="h-5 w-5" />}
          trend={weightTrend}
          trendValue={weightTrendValue}
          color="purple"
        />
      ) : (
        <MetricCard
          title="Peso atual"
          value="-"
          subtitle="Adicione sua primeira medida"
          icon={<Scale className="h-5 w-5" />}
          color="purple"
        />
      )}

      {/* Próxima Sessão */}
      <MetricCard
        title="Próxima sessão"
        value={nextSessionInfo.value}
        subtitle={nextSessionInfo.subtitle}
        icon={<Calendar className="h-5 w-5" />}
        color="blue"
        badge={nextSession && new Date(nextSession.date).toDateString() === new Date().toDateString() ? '📍 Hoje' : undefined}
      />
    </div>
  );
}

/**
 * Versão expandida com mais métricas
 */
export function StudentMetricsExpanded({
  workoutsThisMonth = 0,
  workoutsGoal = 12,
  currentStreak = 0,
  bestStreak = 0,
  currentWeight,
  previousWeight,
  weightGoal,
  bodyFatCurrent,
  bodyFatPrevious,
  nextSession,
  totalWorkouts = 0,
  averageWorkoutsPerWeek = 0,
  lastWorkoutDate,
  isLoading = false,
}: StudentMetricsCardsProps & {
  totalWorkouts?: number;
  averageWorkoutsPerWeek?: number;
  lastWorkoutDate?: Date;
}) {
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 w-20 mt-3" />
                <Skeleton className="h-8 w-16 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calcular progresso do mês
  const monthProgress = workoutsGoal > 0 
    ? Math.min(100, Math.round((workoutsThisMonth / workoutsGoal) * 100))
    : 0;

  // Calcular variação de peso
  const weightChange = currentWeight && previousWeight 
    ? currentWeight - previousWeight 
    : null;
  const weightTrend = weightChange === null ? undefined :
    weightChange < 0 ? 'down' : weightChange > 0 ? 'up' : 'neutral';
  const weightTrendValue = weightChange !== null 
    ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg`
    : undefined;

  // Calcular variação de BF
  const bfChange = bodyFatCurrent && bodyFatPrevious 
    ? bodyFatCurrent - bodyFatPrevious 
    : null;
  const bfTrend = bfChange === null ? undefined :
    bfChange < 0 ? 'down' : bfChange > 0 ? 'up' : 'neutral';
  const bfTrendValue = bfChange !== null 
    ? `${bfChange > 0 ? '+' : ''}${bfChange.toFixed(1)}%`
    : undefined;

  // Formatar último treino
  const formatLastWorkout = () => {
    if (!lastWorkoutDate) return 'Nunca';
    const now = new Date();
    const last = new Date(lastWorkoutDate);
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays <= 7) return `${diffDays} dias atrás`;
    return last.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Linha 1: Métricas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Treinos este mês"
          value={workoutsThisMonth}
          subtitle={`Meta: ${workoutsGoal} treinos`}
          icon={<Dumbbell className="h-5 w-5" />}
          progress={monthProgress}
          color="emerald"
          badge={monthProgress >= 100 ? '🎯 Meta!' : undefined}
        />

        <MetricCard
          title="Sequência atual"
          value={`${currentStreak} dias`}
          subtitle={`Recorde: ${bestStreak} dias`}
          icon={<Flame className="h-5 w-5" />}
          color={currentStreak >= 7 ? 'orange' : 'blue'}
          badge={currentStreak >= 7 ? '🔥' : undefined}
        />

        {currentWeight !== undefined ? (
          <MetricCard
            title="Peso atual"
            value={`${currentWeight.toFixed(1)}kg`}
            subtitle={weightGoal ? `Meta: ${weightGoal}kg` : undefined}
            icon={<Scale className="h-5 w-5" />}
            trend={weightTrend}
            trendValue={weightTrendValue}
            color="purple"
          />
        ) : (
          <MetricCard
            title="Peso atual"
            value="-"
            subtitle="Adicione sua primeira medida"
            icon={<Scale className="h-5 w-5" />}
            color="purple"
          />
        )}

        {bodyFatCurrent !== undefined ? (
          <MetricCard
            title="Gordura corporal"
            value={`${bodyFatCurrent.toFixed(1)}%`}
            icon={<Activity className="h-5 w-5" />}
            trend={bfTrend}
            trendValue={bfTrendValue}
            color={bfTrend === 'down' ? 'emerald' : bfTrend === 'up' ? 'red' : 'blue'}
          />
        ) : (
          <MetricCard
            title="Gordura corporal"
            value="-"
            subtitle="Faça uma avaliação"
            icon={<Activity className="h-5 w-5" />}
            color="blue"
          />
        )}
      </div>

      {/* Linha 2: Métricas secundárias */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total de treinos"
          value={totalWorkouts}
          subtitle="Desde o início"
          icon={<Award className="h-5 w-5" />}
          color="emerald"
        />

        <MetricCard
          title="Média semanal"
          value={averageWorkoutsPerWeek.toFixed(1)}
          subtitle="treinos/semana"
          icon={<Target className="h-5 w-5" />}
          color="blue"
        />

        <MetricCard
          title="Último treino"
          value={formatLastWorkout()}
          icon={<Clock className="h-5 w-5" />}
          color="orange"
        />

        <MetricCard
          title="Consistência"
          value={`${Math.min(100, Math.round((averageWorkoutsPerWeek / 4) * 100))}%`}
          subtitle="Base: 4x/semana"
          icon={<CheckCircle2 className="h-5 w-5" />}
          progress={Math.min(100, Math.round((averageWorkoutsPerWeek / 4) * 100))}
          color="purple"
        />
      </div>
    </div>
  );
}
