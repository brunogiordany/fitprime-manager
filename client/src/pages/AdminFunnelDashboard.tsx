import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Users, TrendingUp, Target, CheckCircle2, RefreshCw, ChevronLeft, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";

const COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function AdminFunnelDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState("7d");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");

  // Calcular datas baseado no período selecionado
  const dateRange = useMemo(() => {
    const now = new Date();
    let startDate: string | undefined;
    let endDate: string | undefined;
    
    if (period === "custom" && customDateFrom && customDateTo) {
      startDate = customDateFrom;
      endDate = customDateTo;
    } else {
      const days = period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const start = new Date(now);
      start.setDate(start.getDate() - days);
      startDate = start.toISOString().split("T")[0];
      endDate = now.toISOString().split("T")[0];
    }
    
    return { startDate, endDate };
  }, [period, customDateFrom, customDateTo]);

  // Buscar dados reais do banco
  const { data: funnelStats, isLoading: loadingStats, refetch } = trpc.quiz.getFunnelStats.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: dailyData, isLoading: loadingDaily } = trpc.quiz.getResponsesByDay.useQuery({
    days: period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90,
  });

  const { data: trialsData } = trpc.trial.getTrialStats.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Verificar se é admin
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!user || user.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  const isLoading = loadingStats || loadingDaily;

  // Dados do funil
  const funnel = funnelStats?.funnel || { total: 0, qualified: 0, disqualified: 0, converted: 0 };
  const trials = trialsData?.total || 0;
  const conversions = funnel.converted || 0;

  // Calcular métricas
  const totalVisitors = funnel.total;
  const totalConversions = conversions;
  const overallConversionRate = totalVisitors > 0 ? ((totalConversions / totalVisitors) * 100).toFixed(2) : "0";
  const avgTicket = 97; // Valor médio do plano
  const totalRevenue = (totalConversions * avgTicket).toFixed(2);

  // Preparar dados para o funil
  const funnelData = [
    { stage: "Quiz Completo", count: funnel.total, percentage: 100, conversionRate: 0 },
    { stage: "Qualificados", count: funnel.qualified, percentage: funnel.total > 0 ? (funnel.qualified / funnel.total) * 100 : 0, conversionRate: funnel.total > 0 ? (funnel.qualified / funnel.total) * 100 : 0 },
    { stage: "Trials Criados", count: trials, percentage: funnel.total > 0 ? (trials / funnel.total) * 100 : 0, conversionRate: funnel.qualified > 0 ? (trials / funnel.qualified) * 100 : 0 },
    { stage: "Conversões", count: conversions, percentage: funnel.total > 0 ? (conversions / funnel.total) * 100 : 0, conversionRate: trials > 0 ? (conversions / trials) * 100 : 0 },
  ];

  // Preparar dados de dores (prioridades)
  const painDistribution = funnelStats?.distributions?.pain?.map((item: any, index: number) => ({
    name: item.pain === "organization" ? "Organização" :
          item.pain === "time" ? "Tempo" :
          item.pain === "retention" ? "Retenção" :
          item.pain === "billing" ? "Cobrança" :
          item.pain === "growth" ? "Crescimento" : item.pain || "Outros",
    value: item.count,
    color: COLORS[index % COLORS.length],
  })) || [];

  // Preparar dados de perfil
  const conversionByProfile = funnelStats?.distributions?.profile?.map((item: any) => ({
    profile: item.profile || "Não definido",
    visits: item.count,
    conversions: 0, // TODO: Calcular conversões por perfil
    rate: "0%",
  })) || [];

  // Preparar dados diários
  const dailyConversions = dailyData?.map((day: any) => ({
    date: new Date(day.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    quizzes: day.total || 0,
    conversions: day.converted || 0,
    revenue: (day.converted || 0) * avgTicket,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Dashboard de Funil</h1>
              <p className="text-gray-600 mt-2">KPI completo da jornada do cliente</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            
            {period === "custom" && (
              <div className="flex items-center gap-2">
                <Input 
                  type="date" 
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-36"
                />
                <span className="text-muted-foreground">até</span>
                <Input 
                  type="date" 
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-36"
                />
              </div>
            )}
            
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Download className="mr-2 w-4 h-4" />
              Exportar Relatório
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Quiz Completos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{totalVisitors.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 mt-1">No período selecionado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Conversões</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-600">{totalConversions}</div>
                  <p className="text-xs text-gray-500 mt-1">{overallConversionRate}% de taxa</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Receita Estimada</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">R$ {totalRevenue}</div>
                  <p className="text-xs text-gray-500 mt-1">Baseado em R$ {avgTicket}/conversão</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Trials Ativos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{trials}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {funnel.qualified > 0 ? ((trials / funnel.qualified) * 100).toFixed(1) : "0"}% dos qualificados
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Funil de Conversão */}
            <Card>
              <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>Jornada completa do cliente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelData.map((stage, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{stage.stage}</span>
                        <span className="text-sm text-gray-600">
                          {stage.count.toLocaleString()} ({stage.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full flex items-center justify-end pr-3 text-white text-sm font-semibold"
                          style={{ width: `${Math.max(stage.percentage, 5)}%` }}
                        >
                          {stage.percentage > 10 && `${stage.percentage.toFixed(1)}%`}
                        </div>
                      </div>
                      {idx < funnelData.length - 1 && idx > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Taxa de conversão: {stage.conversionRate.toFixed(1)}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Conversões por Dia */}
              <Card>
                <CardHeader>
                  <CardTitle>Quizzes por Dia</CardTitle>
                  <CardDescription>Evolução no período</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyConversions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="quizzes" stroke="#8b5cf6" name="Quizzes" strokeWidth={2} />
                      <Line type="monotone" dataKey="conversions" stroke="#10b981" name="Conversões" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Receita por Dia */}
              <Card>
                <CardHeader>
                  <CardTitle>Receita Estimada por Dia</CardTitle>
                  <CardDescription>Baseado em conversões</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyConversions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => `R$ ${value}`} />
                      <Bar dataKey="revenue" fill="#06b6d4" name="Receita" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Dores Identificadas */}
            {painDistribution.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Prioridades Identificadas</CardTitle>
                  <CardDescription>Distribuição de prioridades selecionadas no quiz</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie 
                          data={painDistribution} 
                          cx="50%" 
                          cy="50%" 
                          labelLine={false} 
                          label={({ name, value }) => `${name}: ${value}`} 
                          outerRadius={100} 
                          fill="#8884d8" 
                          dataKey="value"
                        >
                          {painDistribution.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="space-y-3">
                      {painDistribution.map((pain: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: pain.color }}></div>
                          <span className="flex-1">{pain.name}</span>
                          <Badge variant="outline">{pain.value} respostas</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conversão por Perfil */}
            {conversionByProfile.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Perfil</CardTitle>
                  <CardDescription>Quantidade de leads por perfil recomendado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Perfil</th>
                          <th className="text-right py-3 px-4 font-semibold">Quantidade</th>
                          <th className="text-right py-3 px-4 font-semibold">% do Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversionByProfile.map((row: any, idx: number) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">{row.profile}</td>
                            <td className="text-right py-3 px-4 font-semibold">{row.visits}</td>
                            <td className="text-right py-3 px-4">
                              <Badge className="bg-emerald-100 text-emerald-800">
                                {funnel.total > 0 ? ((row.visits / funnel.total) * 100).toFixed(1) : "0"}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Link para ver respostas detalhadas */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Ver Respostas Detalhadas</h3>
                    <p className="text-sm text-muted-foreground">
                      Acesse o dashboard do quiz para ver todas as respostas e fazer abordagem personalizada
                    </p>
                  </div>
                  <Link href="/admin/quiz">
                    <Button>
                      Ver Anamneses
                      <Target className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
