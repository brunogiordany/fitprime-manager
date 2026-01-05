import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { 
  Activity,
  TrendingUp, 
  TrendingDown,
  Timer,
  MapPin,
  Flame,
  Heart,
  BarChart3,
  Calendar,
  Users,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import { useState, useMemo } from "react";
import { format, subMonths, subWeeks, subDays, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

// Labels para tipos de cardio
const cardioTypeLabels: Record<string, string> = {
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
  boxing: "Boxe/Muay Thai",
  crossfit: "CrossFit",
  sports: "Esportes",
  other: "Outro",
};

// Cores para tipos de cardio
const cardioTypeColors: Record<string, string> = {
  treadmill: "fill-blue-500",
  outdoor_run: "fill-green-500",
  stationary_bike: "fill-orange-500",
  outdoor_bike: "fill-yellow-500",
  elliptical: "fill-purple-500",
  rowing: "fill-cyan-500",
  stair_climber: "fill-red-500",
  swimming: "fill-sky-500",
  jump_rope: "fill-pink-500",
  hiit: "fill-rose-500",
  walking: "fill-emerald-500",
  hiking: "fill-lime-500",
  dance: "fill-fuchsia-500",
  boxing: "fill-amber-500",
  crossfit: "fill-indigo-500",
  sports: "fill-teal-500",
  other: "fill-gray-500",
};

// Componente de gráfico de linha com área
function AreaLineChart({ data, color = "emerald", label = "Valor", unit = "" }: { 
  data: { date: string; value: number }[];
  color?: string;
  label?: string;
  unit?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground">
        Sem dados para exibir
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 80 - 10;
    return { x, y, value: d.value, date: d.date };
  });

  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = `0,100 ${linePoints} 100,100`;

  const colorClasses: Record<string, { stroke: string; fill: string; dot: string }> = {
    emerald: { stroke: "stroke-emerald-500", fill: "fill-emerald-500/20", dot: "fill-emerald-500" },
    blue: { stroke: "stroke-blue-500", fill: "fill-blue-500/20", dot: "fill-blue-500" },
    orange: { stroke: "stroke-orange-500", fill: "fill-orange-500/20", dot: "fill-orange-500" },
    red: { stroke: "stroke-red-500", fill: "fill-red-500/20", dot: "fill-red-500" },
    purple: { stroke: "stroke-purple-500", fill: "fill-purple-500/20", dot: "fill-purple-500" },
  };

  const colors = colorClasses[color] || colorClasses.emerald;

  return (
    <div className="relative">
      <div className="h-48">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Área preenchida */}
          <polygon
            points={areaPoints}
            className={colors.fill}
          />
          {/* Linha */}
          <polyline
            points={linePoints}
            fill="none"
            className={colors.stroke}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {/* Pontos */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              className={colors.dot}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
      </div>
      {/* Labels do eixo X */}
      <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
        {data.length <= 7 ? (
          data.map((d, i) => {
            try {
              const dateStr = d.date.length === 7 ? d.date + '-01' : d.date;
              const parsed = parseISO(dateStr);
              if (isNaN(parsed.getTime())) return <span key={i}>{d.date}</span>;
              return (
                <span key={i} className="text-center truncate" style={{ maxWidth: `${100 / data.length}%` }}>
                  {d.date.length === 7 ? format(parsed, 'MMM', { locale: ptBR }) : format(parsed, 'dd/MM', { locale: ptBR })}
                </span>
              );
            } catch {
              return <span key={i}>{d.date}</span>;
            }
          })
        ) : (
          <>
            <span>
              {(() => {
                try {
                  const dateStr = data[0].date.length === 7 ? data[0].date + '-01' : data[0].date;
                  const parsed = parseISO(dateStr);
                  if (isNaN(parsed.getTime())) return data[0].date;
                  return data[0].date.length === 7 ? format(parsed, 'MMM/yy', { locale: ptBR }) : format(parsed, 'dd/MM', { locale: ptBR });
                } catch {
                  return data[0].date;
                }
              })()}
            </span>
            <span>
              {(() => {
                try {
                  const dateStr = data[data.length - 1].date.length === 7 ? data[data.length - 1].date + '-01' : data[data.length - 1].date;
                  const parsed = parseISO(dateStr);
                  if (isNaN(parsed.getTime())) return data[data.length - 1].date;
                  return data[data.length - 1].date.length === 7 ? format(parsed, 'MMM/yy', { locale: ptBR }) : format(parsed, 'dd/MM', { locale: ptBR });
                } catch {
                  return data[data.length - 1].date;
                }
              })()}
            </span>
          </>
        )}
      </div>
      {/* Valores min/max */}
      <div className="absolute left-0 top-0 h-48 flex flex-col justify-between text-xs text-muted-foreground">
        <span>{maxValue.toFixed(unit === 'km' ? 1 : 0)}{unit}</span>
        <span>{minValue.toFixed(unit === 'km' ? 1 : 0)}{unit}</span>
      </div>
    </div>
  );
}

// Componente de gráfico de barras horizontal
function HorizontalBarChart({ data, maxValue, formatValue }: { 
  data: { label: string; value: number; color?: string }[]; 
  maxValue: number;
  formatValue?: (v: number) => string;
}) {
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground truncate max-w-[60%]">{item.label}</span>
            <span className="font-medium">{formatValue ? formatValue(item.value) : item.value}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${item.color || 'bg-emerald-500'} transition-all duration-500`}
              style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente de gráfico de pizza/donut
function DonutChart({ data, size = 140 }: { 
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  let currentAngle = -90;
  
  const segments = data.filter(d => d.value > 0).map((d) => {
    const angle = (d.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = ((startAngle + angle) * Math.PI) / 180;
    
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return {
      ...d,
      path: `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`,
      percentage: Math.round((d.value / total) * 100),
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100" className="shrink-0">
        {segments.map((segment, i) => (
          <path
            key={i}
            d={segment.path}
            className={segment.color}
            stroke="white"
            strokeWidth="1"
          />
        ))}
        <circle cx="50" cy="50" r="25" className="fill-background" />
        <text x="50" y="47" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-sm font-bold">
          {total}
        </text>
        <text x="50" y="58" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[8px]">
          sessões
        </text>
      </svg>
      <div className="grid grid-cols-2 sm:grid-cols-1 gap-1 text-sm">
        {segments.slice(0, 6).map((segment, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${segment.color}`} />
            <span className="text-muted-foreground truncate max-w-[100px]">{segment.label}</span>
            <span className="font-medium">{segment.percentage}%</span>
          </div>
        ))}
        {segments.length > 6 && (
          <div className="text-muted-foreground text-xs">+{segments.length - 6} outros</div>
        )}
      </div>
    </div>
  );
}

// Componente de card de métrica com variação
function MetricCard({ 
  title, 
  value, 
  unit, 
  change, 
  icon: Icon,
  color = "emerald"
}: { 
  title: string; 
  value: string | number; 
  unit?: string;
  change?: number | null;
  icon: React.ElementType;
  color?: string;
}) {
  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-500",
    blue: "text-blue-500",
    orange: "text-orange-500",
    red: "text-red-500",
    purple: "text-purple-500",
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[color] || 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}{unit && <span className="text-lg font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
        {change !== undefined && change !== null && (
          <div className={`flex items-center text-xs mt-1 ${change > 0 ? 'text-emerald-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
            {change > 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : change < 0 ? <ArrowDown className="h-3 w-3 mr-1" /> : <Minus className="h-3 w-3 mr-1" />}
            {Math.abs(change)}% vs período anterior
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CardioReports() {
  const [period, setPeriod] = useState("30");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  
  // Buscar todos os alunos
  const { data: students, isLoading: studentsLoading } = trpc.students.list.useQuery();
  
  // Calcular datas do período
  const { startDate, endDate, prevStartDate, prevEndDate } = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;
    
    if (period === "custom" && customStartDate && customEndDate) {
      start = parseISO(customStartDate);
      end = parseISO(customEndDate);
    } else {
      const days = parseInt(period);
      start = subDays(now, days);
    }
    
    // Período anterior para comparação
    const periodLength = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - periodLength);
    
    return {
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd'),
      prevStartDate: format(prevStart, 'yyyy-MM-dd'),
      prevEndDate: format(prevEnd, 'yyyy-MM-dd'),
    };
  }, [period, customStartDate, customEndDate]);

  // Buscar dados de evolução
  const { data: evolutionData, isLoading: evolutionLoading } = trpc.cardio.evolution.useQuery(
    {
      studentId: selectedStudentId === "all" ? 0 : parseInt(selectedStudentId),
      startDate,
      endDate,
      groupBy,
    },
    { enabled: selectedStudentId !== "all" }
  );

  // Buscar comparativo
  const { data: comparisonData, isLoading: comparisonLoading } = trpc.cardio.comparison.useQuery(
    {
      studentId: selectedStudentId === "all" ? 0 : parseInt(selectedStudentId),
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      previousPeriodStart: prevStartDate,
      previousPeriodEnd: prevEndDate,
    },
    { enabled: selectedStudentId !== "all" }
  );

  // Buscar estatísticas por tipo
  const { data: byTypeData, isLoading: byTypeLoading } = trpc.cardio.byType.useQuery(
    {
      studentId: selectedStudentId === "all" ? 0 : parseInt(selectedStudentId),
      startDate,
      endDate,
    },
    { enabled: selectedStudentId !== "all" }
  );

  // Buscar estatísticas gerais (todos os alunos)
  const { data: overallStats, isLoading: overallLoading } = trpc.cardio.overallStats.useQuery(
    { startDate, endDate },
    { enabled: selectedStudentId === "all" }
  );

  const isLoading = studentsLoading || evolutionLoading || comparisonLoading || byTypeLoading || overallLoading;

  // Preparar dados para gráficos
  const distanceChartData = useMemo(() => {
    if (!evolutionData) return [];
    return evolutionData.map(d => ({ date: d.date, value: d.totalDistance }));
  }, [evolutionData]);

  const durationChartData = useMemo(() => {
    if (!evolutionData) return [];
    return evolutionData.map(d => ({ date: d.date, value: d.totalDuration }));
  }, [evolutionData]);

  const heartRateChartData = useMemo(() => {
    if (!evolutionData) return [];
    return evolutionData.filter(d => d.avgHeartRate).map(d => ({ date: d.date, value: d.avgHeartRate! }));
  }, [evolutionData]);

  const sessionsChartData = useMemo(() => {
    if (!evolutionData) return [];
    return evolutionData.map(d => ({ date: d.date, value: d.sessionCount }));
  }, [evolutionData]);

  const typeDistributionData = useMemo(() => {
    if (!byTypeData) return [];
    return byTypeData.map(t => ({
      label: cardioTypeLabels[t.type] || t.type,
      value: t.sessionCount,
      color: cardioTypeColors[t.type] || "fill-gray-500",
    }));
  }, [byTypeData]);

  if (isLoading && !students) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Activity className="h-6 w-6 text-emerald-500" />
              Relatórios de Cardio
            </h1>
            <p className="text-muted-foreground">
              Análise detalhada da evolução das atividades cardiovasculares
            </p>
          </div>
          
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
            {/* Filtro por aluno */}
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Selecione um aluno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Visão Geral (Todos)</SelectItem>
                {students?.map((student: any) => (
                  <SelectItem key={student.id} value={String(student.id)}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por período */}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Última semana</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Último mês</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="180">Últimos 6 meses</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {/* Agrupamento */}
            {selectedStudentId !== "all" && (
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "day" | "week" | "month")}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Agrupar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Por dia</SelectItem>
                  <SelectItem value="week">Por semana</SelectItem>
                  <SelectItem value="month">Por mês</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Datas personalizadas */}
          {period === "custom" && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border rounded-md text-sm bg-background"
              />
              <span className="text-muted-foreground hidden sm:inline">até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border rounded-md text-sm bg-background"
              />
            </div>
          )}
        </div>

        {/* Conteúdo baseado na seleção */}
        {selectedStudentId === "all" ? (
          /* Visão Geral - Todos os Alunos */
          <div className="space-y-6">
            {/* KPIs Gerais */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <MetricCard
                title="Total de Sessões"
                value={overallStats?.totalSessions || 0}
                icon={Activity}
                color="emerald"
              />
              <MetricCard
                title="Tempo Total"
                value={Math.round((overallStats?.totalDuration || 0) / 60)}
                unit="h"
                icon={Timer}
                color="blue"
              />
              <MetricCard
                title="Distância Total"
                value={(overallStats?.totalDistance || 0).toFixed(1)}
                unit="km"
                icon={MapPin}
                color="orange"
              />
              <MetricCard
                title="Calorias Queimadas"
                value={(overallStats?.totalCalories || 0).toLocaleString('pt-BR')}
                unit="kcal"
                icon={Flame}
                color="red"
              />
              <MetricCard
                title="Alunos Ativos"
                value={overallStats?.uniqueStudents || 0}
                icon={Users}
                color="purple"
              />
            </div>

            {/* Top Alunos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Alunos em Cardio
                </CardTitle>
                <CardDescription>
                  Alunos com mais sessões de cardio no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                {overallStats?.topStudents && overallStats.topStudents.length > 0 ? (
                  <HorizontalBarChart
                    data={overallStats.topStudents.map(s => ({
                      label: s.name,
                      value: s.sessions,
                      color: "bg-emerald-500",
                    }))}
                    maxValue={Math.max(...overallStats.topStudents.map(s => s.sessions), 1)}
                    formatValue={(v) => `${v} sessões`}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Nenhum registro de cardio no período selecionado
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Métricas adicionais */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Média por Aluno</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallStats?.avgSessionsPerStudent || 0}</div>
                  <p className="text-xs text-muted-foreground">sessões/aluno</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{overallStats?.avgDurationPerSession || 0}</div>
                  <p className="text-xs text-muted-foreground">minutos/sessão</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Período Analisado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    {format(parseISO(startDate), 'dd/MM', { locale: ptBR })} - {format(parseISO(endDate), 'dd/MM/yy', { locale: ptBR })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Math.ceil((parseISO(endDate).getTime() - parseISO(startDate).getTime()) / (1000 * 60 * 60 * 24))} dias
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Visão Individual do Aluno */
          <div className="space-y-6">
            {/* KPIs com comparativo */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Sessões de Cardio"
                value={comparisonData?.current.sessionCount || 0}
                change={comparisonData?.changes.sessionCount}
                icon={Activity}
                color="emerald"
              />
              <MetricCard
                title="Tempo Total"
                value={comparisonData?.current.totalDuration || 0}
                unit="min"
                change={comparisonData?.changes.totalDuration}
                icon={Timer}
                color="blue"
              />
              <MetricCard
                title="Distância Total"
                value={(comparisonData?.current.totalDistance || 0).toFixed(1)}
                unit="km"
                change={comparisonData?.changes.totalDistance}
                icon={MapPin}
                color="orange"
              />
              <MetricCard
                title="Calorias Queimadas"
                value={(comparisonData?.current.totalCalories || 0).toLocaleString('pt-BR')}
                unit="kcal"
                change={comparisonData?.changes.totalCalories}
                icon={Flame}
                color="red"
              />
            </div>

            {/* Tabs com gráficos */}
            <Tabs defaultValue="distance" className="space-y-4">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="distance">Distância</TabsTrigger>
                <TabsTrigger value="duration">Tempo</TabsTrigger>
                <TabsTrigger value="heartrate">Freq. Cardíaca</TabsTrigger>
                <TabsTrigger value="sessions">Sessões</TabsTrigger>
                <TabsTrigger value="types">Por Tipo</TabsTrigger>
              </TabsList>

              {/* Aba Distância */}
              <TabsContent value="distance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-orange-500" />
                      Evolução da Distância
                    </CardTitle>
                    <CardDescription>
                      Distância percorrida ao longo do tempo (km)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AreaLineChart
                      data={distanceChartData}
                      color="orange"
                      label="Distância"
                      unit="km"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Tempo */}
              <TabsContent value="duration" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5 text-blue-500" />
                      Evolução do Tempo
                    </CardTitle>
                    <CardDescription>
                      Duração das atividades ao longo do tempo (minutos)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AreaLineChart
                      data={durationChartData}
                      color="blue"
                      label="Duração"
                      unit="min"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Frequência Cardíaca */}
              <TabsContent value="heartrate" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500" />
                      Evolução da Frequência Cardíaca
                    </CardTitle>
                    <CardDescription>
                      Frequência cardíaca média por período (BPM)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {heartRateChartData.length > 0 ? (
                      <AreaLineChart
                        data={heartRateChartData}
                        color="red"
                        label="FC Média"
                        unit="bpm"
                      />
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted-foreground">
                        Sem dados de frequência cardíaca registrados
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Sessões */}
              <TabsContent value="sessions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-emerald-500" />
                      Frequência de Treinos
                    </CardTitle>
                    <CardDescription>
                      Número de sessões de cardio por período
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AreaLineChart
                      data={sessionsChartData}
                      color="emerald"
                      label="Sessões"
                      unit=""
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Aba Por Tipo */}
              <TabsContent value="types" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-purple-500" />
                        Distribuição por Tipo
                      </CardTitle>
                      <CardDescription>
                        Tipos de cardio mais praticados
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {typeDistributionData.length > 0 ? (
                        <DonutChart data={typeDistributionData} />
                      ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground">
                          Sem dados no período selecionado
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Detalhes por Tipo
                      </CardTitle>
                      <CardDescription>
                        Tempo e distância por modalidade
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {byTypeData && byTypeData.length > 0 ? (
                        <div className="space-y-4">
                          {byTypeData.slice(0, 5).map((t, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <div>
                                <div className="font-medium">{cardioTypeLabels[t.type] || t.type}</div>
                                <div className="text-xs text-muted-foreground">
                                  {t.sessionCount} sessões
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{t.totalDuration} min</div>
                                <div className="text-xs text-muted-foreground">
                                  {t.totalDistance.toFixed(1)} km
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground">
                          Sem dados no período selecionado
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Comparativo de Períodos */}
            {comparisonData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Comparativo de Períodos
                  </CardTitle>
                  <CardDescription>
                    Período atual vs período anterior
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-1">Sessões</div>
                      <div className="text-xl font-bold">{comparisonData.current.sessionCount}</div>
                      <div className="text-xs text-muted-foreground">
                        anterior: {comparisonData.previous.sessionCount}
                      </div>
                      <Badge variant={comparisonData.changes.sessionCount >= 0 ? "default" : "destructive"} className="mt-1">
                        {comparisonData.changes.sessionCount >= 0 ? '+' : ''}{comparisonData.changes.sessionCount}%
                      </Badge>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-1">Tempo Total</div>
                      <div className="text-xl font-bold">{comparisonData.current.totalDuration} min</div>
                      <div className="text-xs text-muted-foreground">
                        anterior: {comparisonData.previous.totalDuration} min
                      </div>
                      <Badge variant={comparisonData.changes.totalDuration >= 0 ? "default" : "destructive"} className="mt-1">
                        {comparisonData.changes.totalDuration >= 0 ? '+' : ''}{comparisonData.changes.totalDuration}%
                      </Badge>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-1">Distância</div>
                      <div className="text-xl font-bold">{comparisonData.current.totalDistance} km</div>
                      <div className="text-xs text-muted-foreground">
                        anterior: {comparisonData.previous.totalDistance} km
                      </div>
                      <Badge variant={comparisonData.changes.totalDistance >= 0 ? "default" : "destructive"} className="mt-1">
                        {comparisonData.changes.totalDistance >= 0 ? '+' : ''}{comparisonData.changes.totalDistance}%
                      </Badge>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-1">Calorias</div>
                      <div className="text-xl font-bold">{comparisonData.current.totalCalories}</div>
                      <div className="text-xs text-muted-foreground">
                        anterior: {comparisonData.previous.totalCalories}
                      </div>
                      <Badge variant={comparisonData.changes.totalCalories >= 0 ? "default" : "destructive"} className="mt-1">
                        {comparisonData.changes.totalCalories >= 0 ? '+' : ''}{comparisonData.changes.totalCalories}%
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
