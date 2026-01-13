import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Eye, 
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Target,
  DollarSign,
  Zap,
  ChevronLeft,
  Loader2
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AdminAnalyticsDashboard() {
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
  const { data: funnelStats, isLoading: loadingStats, refetch: refetchStats } = trpc.quiz.getFunnelStats.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  const { data: dailyData, isLoading: loadingDaily } = trpc.quiz.getResponsesByDay.useQuery({
    days: period === "today" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 90,
  });

  // Buscar trials criados
  const { data: trialsData } = trpc.trial.getTrialStats.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });

  // Buscar conversões (pagamentos) - usando dados do quiz por enquanto
  // TODO: Integrar com Stripe para dados reais de pagamento
  
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
  const revenue = 0; // TODO: Integrar com Stripe para receita real

  // Calcular taxas de conversão
  const conversionRates = useMemo(() => ({
    quizComplete: funnel.total > 0 ? ((funnel.qualified / funnel.total) * 100).toFixed(1) : "0",
    trialRate: funnel.qualified > 0 ? ((trials / funnel.qualified) * 100).toFixed(1) : "0",
    conversionRate: trials > 0 ? ((conversions / trials) * 100).toFixed(1) : "0",
    overallConversion: funnel.total > 0 ? ((conversions / funnel.total) * 100).toFixed(2) : "0",
  }), [funnel, trials, conversions]);

  // Preparar dados para o gráfico
  const chartData = dailyData?.map((day: any) => ({
    date: new Date(day.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    quizzes: day.total || 0,
    qualificados: day.qualified || 0,
    convertidos: day.converted || 0,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Métricas do funil de vendas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Filtro de período */}
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
              
              <Button variant="outline" size="icon" onClick={() => refetchStats()}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
              
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <>
            {/* KPIs Principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Quiz Completos</p>
                      <p className="text-3xl font-bold">{funnel.total.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {funnel.qualified} qualificados ({conversionRates.quizComplete}%)
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Target className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Trials Criados</p>
                      <p className="text-3xl font-bold">{trials.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conversionRates.trialRate}% dos qualificados
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Conversões</p>
                      <p className="text-3xl font-bold">{conversions.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conversionRates.conversionRate}% dos trials
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Receita</p>
                      <p className="text-3xl font-bold text-emerald-600">
                        R$ {revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        No período selecionado
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Funil de Conversão Visual */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Funil de Conversão
                </CardTitle>
                <CardDescription>
                  Visualização do fluxo de visitantes até a conversão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Quiz Completos */}
                  <div className="relative">
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">Quiz Completo</div>
                      <div className="flex-1 h-10 bg-purple-500 rounded-lg flex items-center justify-end pr-4" style={{ width: '100%' }}>
                        <span className="text-white font-bold">{funnel.total.toLocaleString()}</span>
                      </div>
                      <div className="w-20 text-sm text-muted-foreground">100%</div>
                    </div>
                  </div>
                  
                  {/* Qualificados */}
                  <div className="relative">
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">Qualificados</div>
                      <div 
                        className="flex-1 h-10 bg-indigo-500 rounded-lg flex items-center justify-end pr-4" 
                        style={{ width: `${funnel.total > 0 ? (funnel.qualified / funnel.total) * 100 : 0}%`, minWidth: '60px' }}
                      >
                        <span className="text-white font-bold">{funnel.qualified.toLocaleString()}</span>
                      </div>
                      <div className="w-20 text-sm text-muted-foreground">{conversionRates.quizComplete}%</div>
                    </div>
                  </div>
                  
                  {/* Trials */}
                  <div className="relative">
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">Trials</div>
                      <div 
                        className="flex-1 h-10 bg-emerald-500 rounded-lg flex items-center justify-end pr-4" 
                        style={{ width: `${funnel.total > 0 ? (trials / funnel.total) * 100 : 0}%`, minWidth: '60px' }}
                      >
                        <span className="text-white font-bold">{trials}</span>
                      </div>
                      <div className="w-20 text-sm text-muted-foreground">
                        {funnel.total > 0 ? ((trials / funnel.total) * 100).toFixed(1) : "0"}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Conversões */}
                  <div className="relative">
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-sm font-medium">Conversões</div>
                      <div 
                        className="flex-1 h-10 bg-amber-500 rounded-lg flex items-center justify-end pr-4" 
                        style={{ width: `${funnel.total > 0 ? (conversions / funnel.total) * 100 : 0}%`, minWidth: '60px' }}
                      >
                        <span className="text-white font-bold">{conversions}</span>
                      </div>
                      <div className="w-20 text-sm text-muted-foreground">{conversionRates.overallConversion}%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Tendência */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Tendência por Dia
                </CardTitle>
                <CardDescription>
                  Evolução de quizzes e conversões no período
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="quizzes" stroke="#8b5cf6" name="Quiz Completos" strokeWidth={2} />
                      <Line type="monotone" dataKey="qualificados" stroke="#10b981" name="Qualificados" strokeWidth={2} />
                      <Line type="monotone" dataKey="convertidos" stroke="#f59e0b" name="Convertidos" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Distribuições */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Por Perfil */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Por Perfil Recomendado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {funnelStats?.distributions?.profile?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm">{item.profile || "Não definido"}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${funnel.total > 0 ? (item.count / funnel.total) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">{item.count}</span>
                        </div>
                      </div>
                    )) || <p className="text-gray-500 text-center py-4">Sem dados</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Por Quantidade de Alunos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Por Quantidade de Alunos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {funnelStats?.distributions?.students?.map((item: any, index: number) => {
                      const label = item.students === "1-5" ? "1-5 alunos" : 
                                    item.students === "6-15" ? "6-15 alunos" :
                                    item.students === "16-30" ? "16-30 alunos" :
                                    item.students === "31-50" ? "31-50 alunos" :
                                    item.students === "51-100" ? "51-100 alunos" :
                                    item.students === "100+" ? "100+ alunos" : item.students || "N/A";
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{label}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${funnel.total > 0 ? (item.count / funnel.total) * 100 : 0}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{item.count}</span>
                          </div>
                        </div>
                      );
                    }) || <p className="text-gray-500 text-center py-4">Sem dados</p>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Link para Quiz Dashboard */}
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
                      Ver Respostas
                      <Zap className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
