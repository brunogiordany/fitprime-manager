import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList } from "recharts";
import { Download, Users, TrendingUp, Target, CheckCircle2, RefreshCw, ChevronLeft, Loader2, Activity, DollarSign, Tag, User, Clock, ChevronRight, Calculator, ExternalLink, BarChart3, PieChartIcon, Eye, Zap, Filter, MessageCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { Label } from "@/components/ui/label";

const COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

// Labels para quantidade de alunos
const STUDENTS_LABELS: Record<string, string> = {
  "1-5": "1-5 alunos",
  "6-15": "6-15 alunos",
  "16-30": "16-30 alunos",
  "31-50": "31-50 alunos",
  "51-100": "51-100 alunos",
  "100+": "100+ alunos",
  "1_5": "1-5 alunos",
  "6_15": "6-15 alunos",
  "16_30": "16-30 alunos",
  "over_30": "30+ alunos",
  "none": "Nenhum",
  "15": "6-15 alunos",
  "30": "16-30 alunos",
  "50": "31-50 alunos",
  "100": "51-100 alunos",
};

// Labels para renda
const REVENUE_LABELS: Record<string, string> = {
  "no_income": "Sem renda",
  "2k": "Até R$ 2k",
  "5k": "R$ 2k-5k",
  "10k": "R$ 5k-10k",
  "10k+": "Mais de R$ 10k",
  "15k+": "Mais de R$ 15k",
  "under_2k": "Até R$ 2k",
  "2k_5k": "R$ 2k-5k",
  "5k_10k": "R$ 5k-10k",
  "over_10k": "Mais de R$ 10k",
  "no_revenue": "Sem renda",
  "2000": "Até R$ 2k",
  "5000": "R$ 2k-5k",
  "10000": "R$ 5k-10k",
  "15000": "Mais de R$ 10k",
};

export default function AdminFunnelDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState("7d");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Campos de custo para calcular CPL/CPA
  const [adSpend, setAdSpend] = useState("");

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

  // Quiz stats são obtidos via funnelStats.distributions

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
  
  // Calcular CPL e CPA
  const adSpendNum = parseFloat(adSpend) || 0;
  const cpl = totalVisitors > 0 && adSpendNum > 0 ? (adSpendNum / totalVisitors).toFixed(2) : "0";
  const cpa = totalConversions > 0 && adSpendNum > 0 ? (adSpendNum / totalConversions).toFixed(2) : "0";
  const roas = adSpendNum > 0 ? ((parseFloat(totalRevenue) / adSpendNum) * 100).toFixed(0) : "0";

  // Preparar dados para o funil visual
  const funnelData = [
    { stage: "Quiz Completo", count: funnel.total, percentage: 100, conversionRate: 0, fill: "#3b82f6" },
    { stage: "Qualificados", count: funnel.qualified, percentage: funnel.total > 0 ? (funnel.qualified / funnel.total) * 100 : 0, conversionRate: funnel.total > 0 ? (funnel.qualified / funnel.total) * 100 : 0, fill: "#8b5cf6" },
    { stage: "Trials Criados", count: trials, percentage: funnel.total > 0 ? (trials / funnel.total) * 100 : 0, conversionRate: funnel.qualified > 0 ? (trials / funnel.qualified) * 100 : 0, fill: "#10b981" },
    { stage: "Conversões", count: conversions, percentage: funnel.total > 0 ? (conversions / funnel.total) * 100 : 0, conversionRate: trials > 0 ? (conversions / trials) * 100 : 0, fill: "#f59e0b" },
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
    conversions: 0,
    rate: "0%",
  })) || [];

  // Preparar dados diários
  const dailyConversions = dailyData?.map((day: any) => ({
    date: new Date(day.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    quizzes: day.total || 0,
    conversions: day.converted || 0,
    revenue: (day.converted || 0) * avgTicket,
  })) || [];

  // Dados de distribuição do quiz (usando funnelStats)
  const studentsDistribution = funnelStats?.distributions?.students?.map((item: any, index: number) => ({
    name: STUDENTS_LABELS[item.students] || item.students || "Não informado",
    value: item.count,
    color: COLORS[index % COLORS.length],
  })) || [];

  const revenueDistribution = funnelStats?.distributions?.revenue?.map((item: any, index: number) => ({
    name: REVENUE_LABELS[item.revenue] || item.revenue || "Não informado",
    value: item.count,
    color: COLORS[index % COLORS.length],
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Central de Funil</h1>
              <p className="text-gray-600 mt-1">Análise completa da jornada do cliente</p>
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
              Exportar
            </Button>
          </div>
        </div>

        {/* Tabs de Navegação */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="funnel" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Funil Visual</span>
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-2">
              <PieChartIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Quiz Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Eventos Meta</span>
            </TabsTrigger>
            <TabsTrigger value="costs" className="gap-2">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Custos/ROI</span>
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              {/* Tab: Visão Geral */}
              <TabsContent value="overview" className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Quiz Completos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{totalVisitors.toLocaleString()}</div>
                      <p className="text-xs text-gray-500 mt-1">No período</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Trials Criados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{trials}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        {funnel.qualified > 0 ? ((trials / funnel.qualified) * 100).toFixed(1) : "0"}% dos qualificados
                      </p>
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
                      <p className="text-xs text-gray-500 mt-1">Ticket médio R$ {avgTicket}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                  <Card>
                    <CardHeader>
                      <CardTitle>Receita por Dia</CardTitle>
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

                {/* Links Rápidos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("funnel")}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Filter className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Funil Visual</h3>
                          <p className="text-sm text-muted-foreground">Ver jornada completa</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("quiz")}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <PieChartIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Quiz Analytics</h3>
                          <p className="text-sm text-muted-foreground">Análise de respostas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("costs")}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Calculator className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Custos & ROI</h3>
                          <p className="text-sm text-muted-foreground">CPL, CPA e ROAS</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab: Funil Visual */}
              <TabsContent value="funnel" className="space-y-6">
                {/* Funil de Conversão Visual */}
                <Card>
                  <CardHeader>
                    <CardTitle>Funil de Conversão</CardTitle>
                    <CardDescription>Jornada completa do cliente com taxas de conversão entre etapas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {funnelData.map((stage, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.fill }}></div>
                              <span className="font-medium">{stage.stage}</span>
                            </div>
                            <span className="text-sm text-gray-600">
                              {stage.count.toLocaleString()} ({stage.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-10 overflow-hidden">
                            <div
                              className="h-full flex items-center justify-end pr-3 text-white text-sm font-semibold transition-all duration-500"
                              style={{ 
                                width: `${Math.max(stage.percentage, 5)}%`,
                                backgroundColor: stage.fill
                              }}
                            >
                              {stage.percentage > 10 && `${stage.percentage.toFixed(1)}%`}
                            </div>
                          </div>
                          {idx > 0 && (
                            <div className="flex items-center gap-2 mt-1">
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                              <p className="text-xs text-gray-500">
                                Taxa de conversão da etapa anterior: <span className="font-semibold text-emerald-600">{stage.conversionRate.toFixed(1)}%</span>
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Fluxo Visual do Funil */}
                <Card>
                  <CardHeader>
                    <CardTitle>Fluxo do Funil de Conversão</CardTitle>
                    <CardDescription>Visualização do funil de eventos personalizados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between overflow-x-auto py-4">
                      {/* Etapa 1 */}
                      <div className="flex flex-col items-center min-w-[120px]">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                          <User className="h-8 w-8 text-blue-600" />
                        </div>
                        <span className="text-xs font-medium text-center">Lead Capture</span>
                        <span className="text-lg font-bold">{funnel.total}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <ChevronRight className="h-6 w-6 text-gray-300" />
                        <span className="text-xs text-emerald-600 font-medium">
                          {funnel.total > 0 ? ((funnel.qualified / funnel.total) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      
                      {/* Etapa 2 */}
                      <div className="flex flex-col items-center min-w-[120px]">
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-2">
                          <CheckCircle2 className="h-8 w-8 text-purple-600" />
                        </div>
                        <span className="text-xs font-medium text-center">Qualificados</span>
                        <span className="text-lg font-bold">{funnel.qualified}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <ChevronRight className="h-6 w-6 text-gray-300" />
                        <span className="text-xs text-emerald-600 font-medium">
                          {funnel.qualified > 0 ? ((trials / funnel.qualified) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      
                      {/* Etapa 3 */}
                      <div className="flex flex-col items-center min-w-[120px]">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                          <Users className="h-8 w-8 text-emerald-600" />
                        </div>
                        <span className="text-xs font-medium text-center">Trial Criado</span>
                        <span className="text-lg font-bold">{trials}</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <ChevronRight className="h-6 w-6 text-gray-300" />
                        <span className="text-xs text-emerald-600 font-medium">
                          {trials > 0 ? ((conversions / trials) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                      
                      {/* Etapa 4 */}
                      <div className="flex flex-col items-center min-w-[120px]">
                        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
                          <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                        <span className="text-xs font-medium text-center">Checkout</span>
                        <span className="text-lg font-bold">-</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <ChevronRight className="h-6 w-6 text-gray-300" />
                        <span className="text-xs text-emerald-600 font-medium">-</span>
                      </div>
                      
                      {/* Etapa 5 */}
                      <div className="flex flex-col items-center min-w-[120px]">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-2">
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        </div>
                        <span className="text-xs font-medium text-center">Conversão</span>
                        <span className="text-lg font-bold text-green-600">{conversions}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Distribuição por Perfil */}
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
              </TabsContent>

              {/* Tab: Quiz Analytics */}
              <TabsContent value="quiz" className="space-y-6">
                {/* KPIs do Quiz */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Total Respostas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{funnel.total || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Qualificados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-emerald-600">{funnel.qualified || 0}</div>
                      <p className="text-xs text-gray-500">
                        {funnel.total ? ((funnel.qualified / funnel.total) * 100).toFixed(1) : 0}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Desqualificados</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">{funnel.disqualified || 0}</div>
                      <p className="text-xs text-gray-500">
                        {funnel.total ? ((funnel.disqualified / funnel.total) * 100).toFixed(1) : 0}%
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">Convertidos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{funnel.converted || 0}</div>
                      <p className="text-xs text-gray-500">
                        {funnel.qualified ? ((funnel.converted / funnel.qualified) * 100).toFixed(1) : 0}% dos qualificados
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Gráficos de Distribuição */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Distribuição por Quantidade de Alunos */}
                  {studentsDistribution.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Quantidade de Alunos</CardTitle>
                        <CardDescription>Distribuição por faixa de alunos</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie 
                              data={studentsDistribution} 
                              cx="50%" 
                              cy="50%" 
                              labelLine={false} 
                              label={({ name, value }) => `${name}: ${value}`} 
                              outerRadius={100} 
                              fill="#8884d8" 
                              dataKey="value"
                            >
                              {studentsDistribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}

                  {/* Distribuição por Renda */}
                  {revenueDistribution.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Faixa de Renda</CardTitle>
                        <CardDescription>Distribuição por faixa de renda mensal</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie 
                              data={revenueDistribution} 
                              cx="50%" 
                              cy="50%" 
                              labelLine={false} 
                              label={({ name, value }) => `${name}: ${value}`} 
                              outerRadius={100} 
                              fill="#8884d8" 
                              dataKey="value"
                            >
                              {revenueDistribution.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
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

                {/* Link para Quiz Dashboard Completo */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Ver Respostas Detalhadas</h3>
                        <p className="text-sm text-muted-foreground">
                          Acesse o dashboard completo do quiz para ver todas as respostas individuais
                        </p>
                      </div>
                      <Link href="/admin/quiz">
                        <Button>
                          Ver Anamneses
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Eventos Meta */}
              <TabsContent value="events" className="space-y-6">
                {/* Cabeçalho */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold">Eventos do Facebook Pixel</h2>
                    <p className="text-sm text-gray-500">Eventos personalizados para criar públicos de remarketing</p>
                  </div>
                  <Button variant="outline" onClick={() => window.open('https://business.facebook.com/events_manager', '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver no Events Manager
                  </Button>
                </div>
                
                {/* Cards de Eventos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        FP_LeadCapture
                      </CardTitle>
                      <CardDescription>Captura de dados no quiz-trial</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{funnel.total}</div>
                      <p className="text-xs text-gray-500">Eventos disparados</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        FP_QuizCompleted
                      </CardTitle>
                      <CardDescription>Quiz finalizado</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{funnel.total}</div>
                      <p className="text-xs text-gray-500">Eventos disparados</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                        FP_TrialCreated
                      </CardTitle>
                      <CardDescription>Conta trial criada</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{trials}</div>
                      <p className="text-xs text-gray-500">Eventos disparados</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                        FP_Purchase
                      </CardTitle>
                      <CardDescription>Compra finalizada</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{conversions}</div>
                      <p className="text-xs text-gray-500">Eventos disparados</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Instruções para criar públicos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Tag className="h-5 w-5" />
                      Como criar públicos personalizados
                    </CardTitle>
                    <CardDescription>Use os eventos FP_* para criar públicos de remarketing segmentados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">Público: Leads Quentes</h4>
                        <p className="text-sm text-blue-700">Pessoas que completaram o quiz mas não criaram conta trial</p>
                        <code className="text-xs bg-blue-100 px-2 py-1 rounded mt-2 inline-block">FP_QuizCompleted - FP_TrialCreated</code>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">Público: Abandonaram Checkout</h4>
                        <p className="text-sm text-green-700">Pessoas que iniciaram checkout mas não finalizaram</p>
                        <code className="text-xs bg-green-100 px-2 py-1 rounded mt-2 inline-block">FP_CheckoutStarted - FP_Purchase</code>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-medium text-purple-900 mb-2">Público: Trial Expirado</h4>
                        <p className="text-sm text-purple-700">Pessoas cujo trial expirou sem converter</p>
                        <code className="text-xs bg-purple-100 px-2 py-1 rounded mt-2 inline-block">FP_TrialExpired - FP_Purchase</code>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <h4 className="font-medium text-orange-900 mb-2">Público: Clientes Ativos</h4>
                        <p className="text-sm text-orange-700">Pessoas que finalizaram a compra (para upsell)</p>
                        <code className="text-xs bg-orange-100 px-2 py-1 rounded mt-2 inline-block">FP_Purchase ou FP_Subscription</code>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab: Custos/ROI */}
              <TabsContent value="costs" className="space-y-6">
                {/* Input de Custo de Anúncios */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Calculadora de Custos
                    </CardTitle>
                    <CardDescription>Insira o valor gasto em anúncios para calcular CPL, CPA e ROAS</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 max-w-xs">
                        <Label htmlFor="adSpend">Gasto em Anúncios (R$)</Label>
                        <Input
                          id="adSpend"
                          type="number"
                          placeholder="Ex: 1000"
                          value={adSpend}
                          onChange={(e) => setAdSpend(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground pt-6">
                        Período: {period === "today" ? "Hoje" : period === "7d" ? "Últimos 7 dias" : period === "30d" ? "Últimos 30 dias" : period === "90d" ? "Últimos 90 dias" : "Personalizado"}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* KPIs de Custo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">CPL (Custo por Lead)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">R$ {cpl}</div>
                      <p className="text-xs text-gray-500 mt-1">{totalVisitors} leads capturados</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">CPT (Custo por Trial)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">
                        R$ {trials > 0 && adSpendNum > 0 ? (adSpendNum / trials).toFixed(2) : "0"}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{trials} trials criados</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">CPA (Custo por Aquisição)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-emerald-600">R$ {cpa}</div>
                      <p className="text-xs text-gray-500 mt-1">{totalConversions} conversões</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-600">ROAS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-3xl font-bold ${parseFloat(roas) >= 100 ? "text-green-600" : "text-red-600"}`}>
                        {roas}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Retorno sobre investimento</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Resumo Financeiro */}
                <Card>
                  <CardHeader>
                    <CardTitle>Resumo Financeiro</CardTitle>
                    <CardDescription>Análise de investimento vs retorno</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold">Métrica</th>
                            <th className="text-right py-3 px-4 font-semibold">Valor</th>
                            <th className="text-right py-3 px-4 font-semibold">Observação</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b">
                            <td className="py-3 px-4">Investimento em Ads</td>
                            <td className="text-right py-3 px-4 font-semibold">R$ {adSpendNum.toFixed(2)}</td>
                            <td className="text-right py-3 px-4 text-muted-foreground">Valor informado</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-4">Receita Estimada</td>
                            <td className="text-right py-3 px-4 font-semibold text-green-600">R$ {totalRevenue}</td>
                            <td className="text-right py-3 px-4 text-muted-foreground">Ticket médio R$ {avgTicket}</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-4">Lucro/Prejuízo</td>
                            <td className={`text-right py-3 px-4 font-semibold ${parseFloat(totalRevenue) - adSpendNum >= 0 ? "text-green-600" : "text-red-600"}`}>
                              R$ {(parseFloat(totalRevenue) - adSpendNum).toFixed(2)}
                            </td>
                            <td className="text-right py-3 px-4 text-muted-foreground">
                              {parseFloat(totalRevenue) - adSpendNum >= 0 ? "Positivo" : "Negativo"}
                            </td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-3 px-4">Taxa de Conversão Geral</td>
                            <td className="text-right py-3 px-4 font-semibold">{overallConversionRate}%</td>
                            <td className="text-right py-3 px-4 text-muted-foreground">Lead → Conversão</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4">LTV Estimado (12 meses)</td>
                            <td className="text-right py-3 px-4 font-semibold text-blue-600">R$ {(avgTicket * 12).toFixed(2)}</td>
                            <td className="text-right py-3 px-4 text-muted-foreground">Assinatura anual</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Dicas de Otimização */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dicas de Otimização</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {parseFloat(cpl) > 20 && (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                          <h4 className="font-medium text-yellow-900">CPL Alto</h4>
                          <p className="text-sm text-yellow-700">Seu CPL está acima de R$ 20. Considere otimizar seus anúncios ou segmentação.</p>
                        </div>
                      )}
                      {parseFloat(cpa) > 100 && (
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                          <h4 className="font-medium text-orange-900">CPA Alto</h4>
                          <p className="text-sm text-orange-700">Seu CPA está acima de R$ 100. Foque em melhorar a taxa de conversão do funil.</p>
                        </div>
                      )}
                      {parseFloat(roas) < 100 && adSpendNum > 0 && (
                        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                          <h4 className="font-medium text-red-900">ROAS Negativo</h4>
                          <p className="text-sm text-red-700">Você está gastando mais do que está gerando. Revise sua estratégia de aquisição.</p>
                        </div>
                      )}
                      {parseFloat(roas) >= 200 && (
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <h4 className="font-medium text-green-900">Excelente ROAS!</h4>
                          <p className="text-sm text-green-700">Seu ROAS está acima de 200%. Considere escalar seu investimento em anúncios.</p>
                        </div>
                      )}
                      {adSpendNum === 0 && (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-900">Insira o valor gasto</h4>
                          <p className="text-sm text-blue-700">Para ver as métricas de custo, insira o valor gasto em anúncios no campo acima.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
