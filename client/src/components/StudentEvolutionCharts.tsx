import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StudentMeasurementForm from "./StudentMeasurementForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  Ruler,
  Activity,
  Target,
  Calendar,
  Dumbbell,
  Plus,
  Lock,
} from "lucide-react";

interface Measurement {
  id: number;
  measureDate: string | Date;
  weight?: string | null;
  height?: string | null;
  bodyFat?: string | null;
  muscleMass?: string | null;
  bmi?: string | null;
  chest?: string | null;
  waist?: string | null;
  hip?: string | null;
  rightArm?: string | null;
  leftArm?: string | null;
  rightThigh?: string | null;
  leftThigh?: string | null;
  rightCalf?: string | null;
  leftCalf?: string | null;
  neck?: string | null;
}

interface Session {
  id: number;
  scheduledAt: string | Date | number;
  status: string;
  duration: number;
}

interface StudentEvolutionChartsProps {
  measurements: Measurement[];
  sessions: Session[];
  canEditMeasurements?: boolean;
  onMeasurementsUpdate?: () => void;
  studentName?: string;
  studentGender?: string;
  studentHeight?: string;
}

export default function StudentEvolutionCharts({
  measurements,
  sessions,
  canEditMeasurements = false,
  onMeasurementsUpdate,
  studentName,
  studentGender,
  studentHeight,
}: StudentEvolutionChartsProps) {
  // Buscar estatísticas de sessão do servidor (para dados mais precisos)
  const { data: serverSessionStats } = trpc.studentPortal.sessionStats.useQuery();

  // Função auxiliar para criar data válida
  const parseDate = (dateValue: string | Date | number | null | undefined): Date | null => {
    if (!dateValue) return null;
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  };

  // Processar dados de peso
  const weightData = useMemo(() => {
    return measurements
      .filter((m) => m.weight && parseDate(m.measureDate))
      .map((m) => {
        const date = parseDate(m.measureDate)!;
        return {
          date: format(date, "dd/MM", { locale: ptBR }),
          fullDate: format(date, "dd/MM/yyyy", { locale: ptBR }),
          peso: parseFloat(m.weight || "0"),
          timestamp: date.getTime(),
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [measurements]);

  // Processar dados de medidas corporais
  const bodyMeasurementsData = useMemo(() => {
    return measurements
      .filter((m) => (m.waist || m.hip || m.chest) && parseDate(m.measureDate))
      .map((m) => {
        const date = parseDate(m.measureDate)!;
        return {
          date: format(date, "dd/MM", { locale: ptBR }),
          fullDate: format(date, "dd/MM/yyyy", { locale: ptBR }),
          cintura: m.waist ? parseFloat(m.waist) : null,
          quadril: m.hip ? parseFloat(m.hip) : null,
          peito: m.chest ? parseFloat(m.chest) : null,
          timestamp: date.getTime(),
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [measurements]);

  // Processar dados de composição corporal
  const compositionData = useMemo(() => {
    return measurements
      .filter((m) => (m.bodyFat || m.muscleMass) && parseDate(m.measureDate))
      .map((m) => {
        const date = parseDate(m.measureDate)!;
        return {
          date: format(date, "dd/MM", { locale: ptBR }),
          fullDate: format(date, "dd/MM/yyyy", { locale: ptBR }),
          gordura: m.bodyFat ? parseFloat(m.bodyFat) : null,
          massaMagra: m.muscleMass ? parseFloat(m.muscleMass) : null,
          timestamp: date.getTime(),
        };
      })
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [measurements]);

  // Processar dados de sessões por mês
  const sessionsData = useMemo(() => {
    const monthlyData: Record<string, { total: number; completed: number; missed: number }> = {};

    sessions.forEach((session) => {
      // Tratar diferentes formatos de data
      let sessionDate: Date;
      if (typeof session.scheduledAt === 'number') {
        sessionDate = new Date(session.scheduledAt);
      } else if (session.scheduledAt) {
        sessionDate = new Date(session.scheduledAt);
      } else {
        return; // Pular sessões sem data válida
      }
      
      // Verificar se a data é válida
      if (isNaN(sessionDate.getTime())) {
        return; // Pular datas inválidas
      }
      
      const monthKey = format(sessionDate, "MMM/yy", { locale: ptBR });
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, completed: 0, missed: 0 };
      }
      monthlyData[monthKey].total++;
      if (session.status === "completed") {
        monthlyData[monthKey].completed++;
      } else if (session.status === "no_show") {
        monthlyData[monthKey].missed++;
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      realizadas: data.completed,
      faltas: data.missed,
      total: data.total,
    }));
  }, [sessions]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const sortedMeasurements = [...measurements]
      .filter((m) => m.weight && parseDate(m.measureDate))
      .sort((a, b) => {
        const dateA = parseDate(a.measureDate);
        const dateB = parseDate(b.measureDate);
        return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
      });

    const firstWeightStr = sortedMeasurements[0]?.weight;
    const firstWeight = firstWeightStr ? parseFloat(firstWeightStr) : null;
    const lastWeightStr = sortedMeasurements[sortedMeasurements.length - 1]?.weight;
    const lastWeight = lastWeightStr ? parseFloat(lastWeightStr) : null;
    const weightChange = firstWeight && lastWeight ? lastWeight - firstWeight : null;

    // Usar dados do servidor se disponíveis, senão calcular localmente
    const completedSessions = serverSessionStats?.completed ?? sessions.filter((s) => s.status === "completed").length;
    const noShowSessions = serverSessionStats?.noShow ?? sessions.filter((s) => s.status === "no_show").length;
    const totalSessions = serverSessionStats?.total ?? sessions.length;
    const attendanceRate = serverSessionStats?.attendanceRate ?? (totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0);
    const thisMonth = serverSessionStats?.thisMonth ?? 0;
    const lastMonth = serverSessionStats?.lastMonth ?? 0;

    return {
      firstWeight,
      lastWeight,
      weightChange,
      completedSessions,
      noShowSessions,
      totalSessions,
      attendanceRate,
      thisMonth,
      lastMonth,
    };
  }, [measurements, sessions, serverSessionStats]);

  const getTrendIcon = (change: number | null) => {
    if (change === null) return <Minus className="h-4 w-4 text-gray-400" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-green-500" />;
    if (change > 0) return <TrendingUp className="h-4 w-4 text-amber-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-sm mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value?.toFixed(1)} {entry.name === "peso" ? "kg" : entry.name.includes("gordura") ? "%" : "cm"}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas - Linha 1: Peso e Frequência */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="premium:bg-[#0d1520] premium:border-emerald-500/40 premium:shadow-[0_0_15px_rgba(0,255,136,0.15)]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Scale className="h-8 w-8 text-emerald-500 premium:text-[#00FF88]" />
              {getTrendIcon(stats.weightChange)}
            </div>
            <p className="text-2xl font-bold mt-2">
              {stats.lastWeight ? `${stats.lastWeight.toFixed(1)} kg` : "-"}
            </p>
            <p className="text-xs text-muted-foreground">Peso Atual</p>
            {stats.weightChange !== null && (
              <Badge
                variant="outline"
                className={
                  stats.weightChange < 0
                    ? "bg-green-50 text-green-700 border-green-200 mt-2"
                    : stats.weightChange > 0
                    ? "bg-amber-50 text-amber-700 border-amber-200 mt-2"
                    : "mt-2"
                }
              >
                {stats.weightChange > 0 ? "+" : ""}
                {stats.weightChange.toFixed(1)} kg
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="premium:bg-[#0d1520] premium:border-cyan-500/40 premium:shadow-[0_0_15px_rgba(0,200,255,0.15)]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Target className="h-8 w-8 text-emerald-500 premium:text-cyan-400" />
              <Calendar className="h-4 w-4 text-emerald-400 premium:text-cyan-400" />
            </div>
            <p className="text-2xl font-bold mt-2 text-emerald-600 premium:text-cyan-400">{stats.attendanceRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">Taxa de Presença</p>
            <Badge
              variant="outline"
              className={
                stats.attendanceRate >= 80
                  ? "bg-green-50 text-green-700 border-green-200 mt-2"
                  : stats.attendanceRate >= 60
                  ? "bg-amber-50 text-amber-700 border-amber-200 mt-2"
                  : "bg-red-50 text-red-700 border-red-200 mt-2"
              }
            >
              {stats.attendanceRate >= 80 ? "Excelente" : stats.attendanceRate >= 60 ? "Bom" : "Precisa melhorar"}
            </Badge>
          </CardContent>
        </Card>

        <Card className="premium:bg-[#0d1520] premium:border-blue-500/40 premium:shadow-[0_0_15px_rgba(59,130,246,0.15)]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Dumbbell className="h-8 w-8 text-blue-500 premium:text-blue-400" />
              <Activity className="h-4 w-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold mt-2 premium:text-blue-400">{stats.completedSessions}</p>
            <p className="text-xs text-muted-foreground">Sessões Realizadas</p>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mt-2 premium:bg-blue-500/20 premium:text-blue-400 premium:border-blue-500/50">
              de {stats.totalSessions} agendadas
            </Badge>
          </CardContent>
        </Card>

        <Card className="premium:bg-[#0d1520] premium:border-amber-500/40 premium:shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-amber-500 premium:text-amber-400" />
            </div>
            <p className="text-2xl font-bold mt-2 text-amber-600 premium:text-amber-400">{stats.noShowSessions}</p>
            <p className="text-xs text-muted-foreground">Faltas</p>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 mt-2 premium:bg-amber-500/20 premium:text-amber-400 premium:border-amber-500/50">
              {stats.noShowSessions === 0 ? "Nenhuma falta!" : "total"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Cards de Estatísticas - Linha 2: Este Mês e Avaliações */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="premium:bg-[#0d1520] premium:border-violet-500/40 premium:shadow-[0_0_15px_rgba(139,92,246,0.15)]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-purple-500 premium:text-violet-400" />
            </div>
            <p className="text-2xl font-bold mt-2 premium:text-violet-400">{stats.thisMonth}</p>
            <p className="text-xs text-muted-foreground">Este Mês</p>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 mt-2 premium:bg-violet-500/20 premium:text-violet-400 premium:border-violet-500/50">
              sessões realizadas
            </Badge>
          </CardContent>
        </Card>

        <Card className="premium:bg-[#0d1520] premium:border-gray-500/40 premium:shadow-[0_0_15px_rgba(107,114,128,0.15)]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Calendar className="h-8 w-8 text-gray-500 premium:text-gray-400" />
            </div>
            <p className="text-2xl font-bold mt-2 premium:text-gray-300">{stats.lastMonth}</p>
            <p className="text-xs text-muted-foreground">Mês Passado</p>
            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 mt-2 premium:bg-gray-500/20 premium:text-gray-400 premium:border-gray-500/50">
              sessões realizadas
            </Badge>
          </CardContent>
        </Card>

        <Card className="premium:bg-[#0d1520] premium:border-teal-500/40 premium:shadow-[0_0_15px_rgba(20,184,166,0.15)]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Ruler className="h-8 w-8 text-teal-500 premium:text-teal-400" />
            </div>
            <p className="text-2xl font-bold mt-2 premium:text-teal-400">{measurements.length}</p>
            <p className="text-xs text-muted-foreground">Avaliações Físicas</p>
            <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 mt-2 premium:bg-teal-500/20 premium:text-teal-400 premium:border-teal-500/50">
              registradas
            </Badge>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 dark:from-emerald-900/20 dark:to-emerald-900/30 dark:border-emerald-800 premium:from-[#0d1520] premium:to-[#0a0f1a] premium:border-emerald-500/40 premium:shadow-[0_0_15px_rgba(0,255,136,0.15)]">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <TrendingUp className="h-8 w-8 text-emerald-600 premium:text-[#00FF88]" />
            </div>
            <p className="text-2xl font-bold mt-2 text-emerald-700 premium:text-[#00FF88]">
              {stats.thisMonth > stats.lastMonth ? "+" : ""}
              {stats.thisMonth - stats.lastMonth}
            </p>
            <p className="text-xs text-emerald-600 premium:text-emerald-400">vs Mês Anterior</p>
            <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 mt-2 premium:bg-emerald-500/20 premium:text-emerald-400 premium:border-emerald-500/50">
              {stats.thisMonth >= stats.lastMonth ? "Progredindo!" : "Manter foco"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Cadastro de Medidas */}
      {canEditMeasurements ? (
        <StudentMeasurementForm
          measurements={measurements}
          onUpdate={onMeasurementsUpdate || (() => {})}
          studentName={studentName}
          studentGender={studentGender}
          studentHeight={studentHeight}
        />
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Edição de medidas bloqueada</p>
                <p className="text-sm text-amber-700">Solicite ao seu personal para liberar a edição de medidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <Tabs defaultValue="weight" className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="weight">Peso</TabsTrigger>
          <TabsTrigger value="measurements">Medidas</TabsTrigger>
          <TabsTrigger value="composition">Composição</TabsTrigger>
          <TabsTrigger value="sessions">Frequência</TabsTrigger>
        </TabsList>

        <TabsContent value="weight">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-emerald-500" />
                Evolução do Peso
              </CardTitle>
              <CardDescription>Acompanhe sua evolução de peso ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {weightData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weightData}>
                      <defs>
                        <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                      <YAxis
                        stroke="#9ca3af"
                        fontSize={12}
                        domain={["dataMin - 2", "dataMax + 2"]}
                        tickFormatter={(value) => `${value} kg`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="peso"
                        name="peso"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPeso)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Scale className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum registro de peso encontrado</p>
                    <p className="text-sm">Peça ao seu personal para registrar suas medidas</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="measurements">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5 text-blue-500" />
                Medidas Corporais
              </CardTitle>
              <CardDescription>Cintura, quadril e peito ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              {bodyMeasurementsData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bodyMeasurementsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `${value} cm`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="cintura"
                        name="Cintura"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: "#f59e0b" }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="quadril"
                        name="Quadril"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: "#8b5cf6" }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="peito"
                        name="Peito"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6" }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Ruler className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma medida corporal registrada</p>
                    <p className="text-sm">Peça ao seu personal para registrar suas medidas</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="composition">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-500" />
                Composição Corporal
              </CardTitle>
              <CardDescription>Percentual de gordura e massa magra</CardDescription>
            </CardHeader>
            <CardContent>
              {compositionData.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={compositionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `${value}%`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="gordura"
                        name="% Gordura"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444" }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="massaMagra"
                        name="Massa Magra"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: "#22c55e" }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum dado de composição corporal</p>
                    <p className="text-sm">Peça ao seu personal para registrar sua avaliação</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-500" />
                Frequência de Treinos
              </CardTitle>
              <CardDescription>Sessões realizadas vs faltas por mês (últimos 6 meses)</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Usar dados do servidor se disponíveis, senão usar dados locais */}
              {(() => {
                const chartData = serverSessionStats?.monthlyData || sessionsData.map(s => ({
                  month: s.month,
                  presencas: s.realizadas,
                  faltas: s.faltas,
                }));
                
                return chartData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="presencas" name="Presenças" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="faltas" name="Faltas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma sessão registrada</p>
                      <p className="text-sm">Suas sessões aparecerão aqui</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
