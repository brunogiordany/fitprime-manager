import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity, 
  Clock, 
  Flame,
  Heart,
  Calendar,
  CheckCircle2,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Mapeamento de tipos de cardio para labels
const CARDIO_TYPE_LABELS: Record<string, string> = {
  treadmill: "Esteira",
  outdoor_run: "Corrida",
  stationary_bike: "Bike Ergométrica",
  outdoor_bike: "Ciclismo",
  elliptical: "Elíptico",
  rowing: "Remo",
  stair_climber: "Escada",
  swimming: "Natação",
  jump_rope: "Pular Corda",
  hiit: "HIIT",
  walking: "Caminhada",
  hiking: "Trilha",
  dance: "Dança",
  boxing: "Boxe/Luta",
  crossfit: "CrossFit",
  sports: "Esportes",
  hipismo: "Hipismo",
  corrida: "Corrida",
  caminhada: "Caminhada",
  ciclismo: "Ciclismo",
  natacao: "Natação",
  danca: "Dança",
  luta: "Luta",
  yoga: "Yoga/Pilates",
  outro: "Outro",
  other: "Outro",
};

// Cores para gráficos
const CHART_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
];

interface CardioEvolutionDashboardProps {
  studentId: number;
  studentName?: string;
  period?: number; // dias
}

export default function CardioEvolutionDashboard({ 
  studentId, 
  studentName,
  period = 30 
}: CardioEvolutionDashboardProps) {
  const today = new Date();
  const startDate = format(subDays(today, period), 'yyyy-MM-dd');
  const endDate = format(today, 'yyyy-MM-dd');
  
  // Queries
  const { data: preferredActivities, isLoading: loadingPreferred } = trpc.cardio.preferredActivities.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );
  
  const { data: compliance, isLoading: loadingCompliance } = trpc.cardio.complianceAnalysis.useQuery(
    { studentId, days: period },
    { enabled: studentId > 0 }
  );
  
  const { data: evolution, isLoading: loadingEvolution } = trpc.cardio.evolution.useQuery(
    { studentId, startDate, endDate, groupBy: period > 30 ? 'week' : 'day' },
    { enabled: studentId > 0 }
  );
  
  const { data: stats, isLoading: loadingStats } = trpc.cardio.stats.useQuery(
    { studentId, days: period },
    { enabled: studentId > 0 }
  );
  
  const { data: byType, isLoading: loadingByType } = trpc.cardio.byType.useQuery(
    { studentId, startDate, endDate },
    { enabled: studentId > 0 }
  );
  
  const isLoading = loadingPreferred || loadingCompliance || loadingEvolution || loadingStats || loadingByType;
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Preparar dados para gráfico de evolução
  const evolutionChartData = evolution?.map((item: any) => ({
    date: format(new Date(item.date), 'dd/MM', { locale: ptBR }),
    sessoes: item.sessionCount,
    duracao: item.totalDuration,
    distancia: item.totalDistance || 0,
    calorias: item.totalCalories || 0,
  })) || [];
  
  // Preparar dados para gráfico de pizza por tipo
  const typeChartData = byType?.map((item: any, index: number) => ({
    name: CARDIO_TYPE_LABELS[item.type] || item.type,
    value: item.sessionCount || 0,
    duration: item.totalDuration,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];
  
  // Calcular tendência
  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return { direction: 'neutral', percentage: 0 };
    const change = ((current - previous) / previous) * 100;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(Math.round(change)),
    };
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Evolução de Cardio</h2>
          {studentName && (
            <p className="text-muted-foreground">{studentName} - Últimos {period} dias</p>
          )}
        </div>
        {preferredActivities?.doesCardio && (
          <Badge variant="outline" className="text-emerald-600 border-emerald-600">
            <Activity className="w-3 h-3 mr-1" />
            Pratica Cardio
          </Badge>
        )}
      </div>
      
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sessões</p>
                <p className="text-3xl font-bold">{stats?.totalSessions || 0}</p>
              </div>
              <div className="p-3 bg-emerald-100 rounded-full">
                <Calendar className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            {compliance?.compliance?.frequency !== null && compliance?.compliance?.frequency !== undefined && (
              <div className="mt-2">
                <Progress value={compliance.compliance.frequency} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {compliance.compliance.frequency}% da meta semanal
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Total</p>
                <p className="text-3xl font-bold">{stats?.totalDuration || 0}<span className="text-lg">min</span></p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Média: {stats?.avgDuration || 0} min/sessão
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Distância</p>
                <p className="text-3xl font-bold">{(stats?.totalDistance || 0).toFixed(1)}<span className="text-lg">km</span></p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Média: {(stats?.avgDistance || 0).toFixed(1)} km/sessão
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calorias</p>
                <p className="text-3xl font-bold">{stats?.totalCalories || 0}<span className="text-lg">kcal</span></p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Flame className="w-6 h-6 text-red-600" />
              </div>
            </div>
            {stats?.avgHeartRate && (
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Heart className="w-3 h-3" /> FC Média: {stats.avgHeartRate} bpm
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Aderência ao Plano */}
      {compliance && compliance.planned.weeklyFrequency > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Aderência ao Plano da Anamnese
            </CardTitle>
            <CardDescription>
              Comparação entre o planejado na anamnese e o realizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Frequência */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Frequência Semanal</span>
                  {compliance.compliance.frequency !== null && (
                    <Badge variant={compliance.compliance.frequency >= 80 ? "default" : compliance.compliance.frequency >= 50 ? "secondary" : "destructive"}>
                      {compliance.compliance.frequency}%
                    </Badge>
                  )}
                </div>
                <Progress value={compliance.compliance.frequency || 0} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Real: {compliance.actual.weeklyFrequency}x/sem</span>
                  <span>Meta: {compliance.planned.weeklyFrequency}x/sem</span>
                </div>
              </div>
              
              {/* Duração */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Duração Média</span>
                  {compliance.compliance.duration !== null && (
                    <Badge variant={compliance.compliance.duration >= 80 ? "default" : compliance.compliance.duration >= 50 ? "secondary" : "destructive"}>
                      {compliance.compliance.duration}%
                    </Badge>
                  )}
                </div>
                <Progress value={compliance.compliance.duration || 0} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Real: {compliance.actual.avgDuration}min</span>
                  <span>Meta: {compliance.planned.avgDuration}min</span>
                </div>
              </div>
              
              {/* Aderência Geral */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Aderência Geral</span>
                  {compliance.compliance.overall !== null && (
                    <Badge variant={compliance.compliance.overall >= 80 ? "default" : compliance.compliance.overall >= 50 ? "secondary" : "destructive"}>
                      {compliance.compliance.overall}%
                    </Badge>
                  )}
                </div>
                <Progress value={compliance.compliance.overall || 0} className="h-3" />
                <div className="flex items-center gap-2 text-xs">
                  {compliance.compliance.overall !== null && compliance.compliance.overall >= 80 ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Excelente aderência!
                    </span>
                  ) : compliance.compliance.overall !== null && compliance.compliance.overall >= 50 ? (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Pode melhorar
                    </span>
                  ) : (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Atenção necessária
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Atividades Planejadas */}
            {compliance.planned.activities.length > 0 && (
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm font-medium mb-3">Atividades Planejadas na Anamnese:</p>
                <div className="flex flex-wrap gap-2">
                  {compliance.planned.activities.map((activity, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {CARDIO_TYPE_LABELS[activity.activity] || activity.activity} 
                      ({activity.frequency}x/sem, {activity.duration}min)
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Gráficos */}
      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="evolution">Evolução</TabsTrigger>
          <TabsTrigger value="types">Por Tipo</TabsTrigger>
        </TabsList>
        
        <TabsContent value="evolution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Evolução ao Longo do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {evolutionChartData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis yAxisId="left" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="duracao" 
                        name="Duração (min)"
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6' }}
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="calorias" 
                        name="Calorias"
                        stroke="#ef4444" 
                        strokeWidth={2}
                        dot={{ fill: '#ef4444' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum registro de cardio no período
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Atividade</CardTitle>
            </CardHeader>
            <CardContent>
              {typeChartData.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {typeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {typeChartData.map((type, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: type.color }}
                          />
                          <span className="font-medium">{type.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{type.value} sessões</p>
                          <p className="text-xs text-muted-foreground">{type.duration}min total</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Nenhum registro de cardio no período
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
