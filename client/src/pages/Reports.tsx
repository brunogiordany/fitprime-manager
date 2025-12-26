import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Activity,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useState, useMemo } from "react";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

// Componente simples de gráfico de barras
function SimpleBarChart({ data, maxValue, color = "bg-emerald-500" }: { 
  data: { label: string; value: number }[]; 
  maxValue: number;
  color?: string;
}) {
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.label}</span>
            <span className="font-medium">{item.value}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full ${color} transition-all duration-500`}
              style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Componente de gráfico de linha simples
function SimpleLineChart({ data, color = "stroke-emerald-500" }: { 
  data: { label: string; value: number }[];
  color?: string;
}) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative h-48">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          className={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1 || 1)) * 100;
          const y = 100 - ((d.value - minValue) / range) * 100;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              className="fill-emerald-500"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        {data.map((d, i) => (
          <span key={i} className="text-center" style={{ width: `${100 / data.length}%` }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Componente de gráfico de pizza/donut
function DonutChart({ data, size = 120 }: { 
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  let currentAngle = -90;
  
  const segments = data.map((d) => {
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
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 100 100">
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
        <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" className="fill-foreground text-xs font-bold">
          {total}
        </text>
        <text x="50" y="58" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[6px]">
          total
        </text>
      </svg>
      <div className="space-y-1">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${segment.color}`} />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="font-medium">{segment.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Reports() {
  const [period, setPeriod] = useState("6");
  
  // Buscar dados do dashboard
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  
  // Buscar todos os alunos
  const { data: students, isLoading: studentsLoading } = trpc.students.list.useQuery();
  
  // Buscar todas as sessões
  const { data: sessions, isLoading: sessionsLoading } = trpc.sessions.list.useQuery({});
  
  // Buscar todas as cobranças
  const { data: charges, isLoading: chargesLoading } = trpc.charges.list.useQuery({});

  // Calcular dados para os gráficos
  const monthlyData = useMemo(() => {
    if (!sessions || !charges) return [];
    
    const months = parseInt(period);
    const now = new Date();
    const startDate = subMonths(now, months - 1);
    
    const monthsRange = eachMonthOfInterval({
      start: startOfMonth(startDate),
      end: endOfMonth(now),
    });
    
    return monthsRange.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthSessions = sessions.filter((s: any) => {
        const sessionDate = new Date(s.date);
        return sessionDate >= monthStart && sessionDate <= monthEnd;
      });
      
      const monthCharges = charges.filter((c: any) => {
        const chargeDate = new Date(c.paidAt || c.dueDate);
        return chargeDate >= monthStart && chargeDate <= monthEnd && c.status === 'paid';
      });
      
      const revenue = monthCharges.reduce((acc: number, c: any) => acc + (parseFloat(c.amount) || 0), 0);
      
      return {
        label: format(month, "MMM", { locale: ptBR }),
        fullLabel: format(month, "MMMM yyyy", { locale: ptBR }),
        sessions: monthSessions.length,
        completed: monthSessions.filter((s: any) => s.status === 'completed').length,
        noShow: monthSessions.filter((s: any) => s.status === 'no_show').length,
        revenue,
      };
    });
  }, [sessions, charges, period]);

  // Calcular estatísticas de presença
  const attendanceStats = useMemo(() => {
    if (!sessions) return { completed: 0, noShow: 0, cancelled: 0, scheduled: 0 };
    
    const completed = sessions.filter((s: any) => s.status === 'completed').length;
    const noShow = sessions.filter((s: any) => s.status === 'no_show').length;
    const cancelled = sessions.filter((s: any) => s.status === 'cancelled').length;
    const scheduled = sessions.filter((s: any) => s.status === 'scheduled' || s.status === 'confirmed').length;
    
    return { completed, noShow, cancelled, scheduled };
  }, [sessions]);

  // Calcular receita por status
  const revenueStats = useMemo(() => {
    if (!charges) return { paid: 0, pending: 0, overdue: 0 };
    
    const paid = charges.filter((c: any) => c.status === 'paid').reduce((acc: number, c: any) => acc + (parseFloat(c.amount) || 0), 0);
    const pending = charges.filter((c: any) => c.status === 'pending').reduce((acc: number, c: any) => acc + (parseFloat(c.amount) || 0), 0);
    const overdue = charges.filter((c: any) => c.status === 'overdue').reduce((acc: number, c: any) => acc + (parseFloat(c.amount) || 0), 0);
    
    return { paid, pending, overdue };
  }, [charges]);

  // Top alunos por frequência
  const topStudentsByAttendance = useMemo(() => {
    if (!students || !sessions) return [];
    
    return students
      .map((student: any) => {
        const studentSessions = sessions.filter((s: any) => s.studentId === student.id);
        const completed = studentSessions.filter((s: any) => s.status === 'completed').length;
        const total = studentSessions.length;
        const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
          id: student.id,
          name: student.name,
          completed,
          total,
          rate,
        };
      })
      .filter((s: any) => s.total > 0)
      .sort((a: any, b: any) => b.rate - a.rate)
      .slice(0, 5);
  }, [students, sessions]);

  const isLoading = statsLoading || studentsLoading || sessionsLoading || chargesLoading;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Relatórios de Desempenho
            </h1>
            <p className="text-muted-foreground">
              Análise detalhada da evolução e frequência dos alunos
            </p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
              <p className="text-xs text-muted-foreground">
                ativos no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attendanceStats.completed + attendanceStats.noShow > 0
                  ? Math.round((attendanceStats.completed / (attendanceStats.completed + attendanceStats.noShow)) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {attendanceStats.completed} de {attendanceStats.completed + attendanceStats.noShow} sessões
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {(stats?.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                este mês
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessões do Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.sessionsThisMonth || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.completedSessions || 0} realizadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs com gráficos */}
        <Tabs defaultValue="attendance" className="space-y-4">
          <TabsList>
            <TabsTrigger value="attendance">Frequência</TabsTrigger>
            <TabsTrigger value="revenue">Receita</TabsTrigger>
            <TabsTrigger value="students">Alunos</TabsTrigger>
          </TabsList>

          {/* Aba Frequência */}
          <TabsContent value="attendance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Gráfico de sessões por mês */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Sessões por Mês
                  </CardTitle>
                  <CardDescription>
                    Evolução do número de sessões realizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart
                    data={monthlyData.map(m => ({ label: m.label, value: m.completed }))}
                    maxValue={Math.max(...monthlyData.map(m => m.completed), 1)}
                    color="bg-emerald-500"
                  />
                </CardContent>
              </Card>

              {/* Distribuição de status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Distribuição de Sessões
                  </CardTitle>
                  <CardDescription>
                    Status das sessões no período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart
                    data={[
                      { label: "Realizadas", value: attendanceStats.completed, color: "fill-emerald-500" },
                      { label: "Faltas", value: attendanceStats.noShow, color: "fill-red-500" },
                      { label: "Canceladas", value: attendanceStats.cancelled, color: "fill-gray-400" },
                      { label: "Agendadas", value: attendanceStats.scheduled, color: "fill-blue-500" },
                    ]}
                  />
                </CardContent>
              </Card>

              {/* Taxa de presença por mês */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Taxa de Presença Mensal
                  </CardTitle>
                  <CardDescription>
                    Percentual de sessões realizadas vs agendadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleLineChart
                    data={monthlyData.map(m => ({
                      label: m.label,
                      value: m.sessions > 0 ? Math.round((m.completed / m.sessions) * 100) : 0,
                    }))}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Receita */}
          <TabsContent value="revenue" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Receita por mês */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Receita Mensal
                  </CardTitle>
                  <CardDescription>
                    Evolução da receita ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart
                    data={monthlyData.map(m => ({ 
                      label: m.label, 
                      value: Math.round(m.revenue) 
                    }))}
                    maxValue={Math.max(...monthlyData.map(m => m.revenue), 1)}
                    color="bg-blue-500"
                  />
                </CardContent>
              </Card>

              {/* Status de pagamentos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Status de Pagamentos
                  </CardTitle>
                  <CardDescription>
                    Distribuição por status
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DonutChart
                    data={[
                      { label: "Pagos", value: Math.round(revenueStats.paid), color: "fill-emerald-500" },
                      { label: "Pendentes", value: Math.round(revenueStats.pending), color: "fill-yellow-500" },
                      { label: "Atrasados", value: Math.round(revenueStats.overdue), color: "fill-red-500" },
                    ]}
                  />
                </CardContent>
              </Card>

              {/* Resumo financeiro */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="font-medium text-emerald-700">Recebido</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-700">
                        R$ {revenueStats.paid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-700">Pendente</span>
                      </div>
                      <p className="text-2xl font-bold text-yellow-700">
                        R$ {revenueStats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-700">Atrasado</span>
                      </div>
                      <p className="text-2xl font-bold text-red-700">
                        R$ {revenueStats.overdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Alunos */}
          <TabsContent value="students" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Top alunos por frequência */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Alunos por Frequência
                  </CardTitle>
                  <CardDescription>
                    Alunos com melhor taxa de presença
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topStudentsByAttendance.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum dado disponível
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {topStudentsByAttendance.map((student: any, index: number) => (
                        <div key={student.id} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-amber-600' :
                            'bg-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {student.completed} de {student.total} sessões
                            </p>
                          </div>
                          <Badge variant={student.rate >= 80 ? "default" : student.rate >= 60 ? "secondary" : "destructive"}>
                            {student.rate}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Estatísticas gerais */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Estatísticas Gerais
                  </CardTitle>
                  <CardDescription>
                    Visão geral do desempenho
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Total de Sessões</span>
                      <span className="font-bold">{Array.isArray(sessions) ? sessions.length : 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Sessões Realizadas</span>
                      <span className="font-bold text-emerald-600">{attendanceStats.completed}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Faltas</span>
                      <span className="font-bold text-red-600">{attendanceStats.noShow}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Média de Sessões/Aluno</span>
                      <span className="font-bold">
                        {students && students.length > 0 
                          ? Math.round((Array.isArray(sessions) ? sessions.length : 0) / students.length)
                          : 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <span className="text-muted-foreground">Receita Média/Aluno</span>
                      <span className="font-bold">
                        R$ {students && students.length > 0 
                          ? (revenueStats.paid / students.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                          : '0,00'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
