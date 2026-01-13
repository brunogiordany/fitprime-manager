import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  BarChart3,
  Calendar,
  Filter,
  Download,
  ArrowRight,
  Loader2,
  PieChartIcon,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  ComposedChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

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

// Ordem para quantidade de alunos
const STUDENTS_ORDER = ["1-5", "6-15", "15", "16-30", "30", "31-50", "50", "51-100", "100", "100+", "over_30"];

// Ordem para renda
const REVENUE_ORDER = ["no_income", "no_revenue", "2k", "2000", "under_2k", "5k", "5000", "2k_5k", "10k", "10000", "5k_10k", "10k+", "15000", "over_10k", "15k+"];

export default function AdminQuizDashboard() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: funnelStats, isLoading: loadingStats } = trpc.quiz.getFunnelStats.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: dailyData, isLoading: loadingDaily } = trpc.quiz.getResponsesByDay.useQuery({
    days: 30,
  });

  const { data: responsesData, isLoading: loadingResponses } = trpc.quiz.listResponses.useQuery({
    page: 1,
    limit: 100,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  if (loadingStats || loadingDaily) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const funnel = funnelStats?.funnel || {
    total: 0,
    qualified: 0,
    disqualified: 0,
    converted: 0,
  };

  const rates = funnelStats?.conversionRates || {
    qualificationRate: "0",
    conversionRate: "0",
  };

  const distributions = funnelStats?.distributions || {
    profile: [],
    pain: [],
    students: [],
    revenue: [],
    device: [],
    source: [],
  };

  // Preparar dados para gráficos
  const profileData = distributions.profile?.map((p: any) => ({
    name: p.profile === "high_pain" ? "Alta Dor" : 
          p.profile === "medium_pain" ? "Média Dor" : 
          p.profile === "low_pain" ? "Baixa Dor" : 
          p.profile === "business" ? "Negócio" : p.profile || "Não definido",
    value: p.count,
  })) || [];

  const painData = distributions.pain?.map((p: any) => ({
    name: p.pain === "high_pain" ? "Alta Dor" : 
          p.pain === "medium_pain" ? "Média Dor" : 
          p.pain === "low_pain" ? "Baixa Dor" : p.pain || "Não definido",
    value: p.count,
  })) || [];

  // Dados de quantidade de alunos - ordenados e com labels
  const studentsData = distributions.students?.map((s: any) => ({
    name: STUDENTS_LABELS[s.students] || s.students || "N/A",
    value: s.count,
    rawValue: s.students,
  })).sort((a: any, b: any) => {
    const aIndex = STUDENTS_ORDER.indexOf(a.rawValue);
    const bIndex = STUDENTS_ORDER.indexOf(b.rawValue);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  }) || [];

  // Dados de renda - ordenados e com labels
  const revenueData = distributions.revenue?.map((r: any) => ({
    name: REVENUE_LABELS[r.revenue] || `R$ ${r.revenue}` || "N/A",
    value: r.count,
    rawValue: r.revenue,
  })).sort((a: any, b: any) => {
    const aIndex = REVENUE_ORDER.indexOf(a.rawValue);
    const bIndex = REVENUE_ORDER.indexOf(b.rawValue);
    return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
  }) || [];

  const deviceData = distributions.device?.map((d: any) => ({
    name: d.device || "Desconhecido",
    value: d.count,
  })) || [];

  // Dados combinados para scatter plot (alunos x renda)
  const scatterData = responsesData?.responses?.map((r: any) => {
    const studentsMap: Record<string, number> = {
      "1-5": 3, "6-15": 10, "15": 10, "16-30": 23, "30": 23, 
      "31-50": 40, "50": 40, "51-100": 75, "100": 75, "100+": 120
    };
    const revenueMap: Record<string, number> = {
      "no_income": 0, "no_revenue": 0, "2k": 2000, "2000": 2000, "under_2k": 1500,
      "5k": 5000, "5000": 5000, "2k_5k": 3500, "10k": 10000, "10000": 10000,
      "5k_10k": 7500, "10k+": 15000, "15000": 15000, "over_10k": 12500, "15k+": 20000
    };
    return {
      students: studentsMap[r.studentsCount] || parseInt(r.studentsCount) || 0,
      revenue: revenueMap[r.revenue] || parseInt(r.revenue) || 0,
      name: `Lead #${r.id}`,
      qualified: r.isQualified,
    };
  }).filter((d: any) => d.students > 0 || d.revenue > 0) || [];

  // Calcular médias
  const avgStudents = scatterData.length > 0 
    ? Math.round(scatterData.reduce((sum: number, d: any) => sum + d.students, 0) / scatterData.length)
    : 0;
  const avgRevenue = scatterData.length > 0 
    ? Math.round(scatterData.reduce((sum: number, d: any) => sum + d.revenue, 0) / scatterData.length)
    : 0;

  // Calcular ticket médio por aluno
  const ticketPerStudent = scatterData.length > 0
    ? scatterData.filter((d: any) => d.students > 0).map((d: any) => ({
        ...d,
        ticketPerStudent: d.students > 0 ? Math.round(d.revenue / d.students) : 0
      }))
    : [];

  const avgTicket = ticketPerStudent.length > 0
    ? Math.round(ticketPerStudent.reduce((sum: number, d: any) => sum + d.ticketPerStudent, 0) / ticketPerStudent.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard do Quiz</h1>
            <p className="text-gray-600">Análise completa dos dados financeiros dos personal trainers</p>
          </div>
          
          {/* Filtros */}
          <div className="flex gap-2 items-center">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
              placeholder="Data inicial"
            />
            <span className="text-gray-500">até</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
              placeholder="Data final"
            />
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPIs Financeiros */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Total de Leads</span>
              </div>
              <p className="text-2xl font-bold">{funnel.total}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <CheckCircle className="h-4 w-4" />
                <span className="text-xs">Qualificados</span>
              </div>
              <p className="text-2xl font-bold">{funnel.qualified}</p>
              <p className="text-xs text-gray-500">{rates.qualificationRate}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Média de Alunos</span>
              </div>
              <p className="text-2xl font-bold">{avgStudents}</p>
              <p className="text-xs text-gray-500">por personal</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs">Renda Média</span>
              </div>
              <p className="text-2xl font-bold">R$ {avgRevenue.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-500">por personal</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs">Ticket Médio</span>
              </div>
              <p className="text-2xl font-bold">R$ {avgTicket.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-gray-500">por aluno</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="text-xs">Convertidos</span>
              </div>
              <p className="text-2xl font-bold">{funnel.converted || 0}</p>
              <p className="text-xs text-gray-500">{rates.conversionRate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para diferentes visualizações */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="financial">Dados Financeiros</TabsTrigger>
            <TabsTrigger value="analysis">Análise Cruzada</TabsTrigger>
            <TabsTrigger value="leads">Lista de Leads</TabsTrigger>
          </TabsList>

          {/* Tab Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* Gráfico de Tendência */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendência dos Últimos 30 Dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Total" strokeWidth={2} />
                      <Line type="monotone" dataKey="qualified" stroke="#10b981" name="Qualificados" strokeWidth={2} />
                      <Line type="monotone" dataKey="converted" stroke="#f59e0b" name="Convertidos" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráficos de Distribuição */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Por Perfil */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Por Perfil Recomendado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={profileData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {profileData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Por Dispositivo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Por Dispositivo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {deviceData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Funil Visual */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Funil de Conversão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "Iniciaram Quiz", value: funnel.total, color: "bg-blue-200" },
                      { label: "Qualificados", value: funnel.qualified, color: "bg-emerald-200" },
                      { label: "Convertidos", value: funnel.converted || 0, color: "bg-emerald-400" },
                    ].map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div 
                          className={`h-10 ${step.color} rounded flex items-center justify-end pr-3 transition-all`}
                          style={{ width: `${Math.max(15, (step.value / Math.max(funnel.total, 1)) * 100)}%` }}
                        >
                          <span className="text-sm font-bold">{step.value}</span>
                        </div>
                        <span className="text-sm text-gray-600 whitespace-nowrap">{step.label}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Dados Financeiros */}
          <TabsContent value="financial" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Gráfico de Quantidade de Alunos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Distribuição por Quantidade de Alunos
                  </CardTitle>
                  <CardDescription>
                    Quantos alunos cada personal trainer possui atualmente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={studentsData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip 
                          formatter={(value: number) => [`${value} personal trainers`, 'Quantidade']}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                          {studentsData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Insight:</strong> A maioria dos leads possui entre {studentsData[0]?.name || "N/A"}, 
                      indicando um mercado de personal trainers em fase de crescimento.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Renda */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    Distribuição por Faixa de Renda
                  </CardTitle>
                  <CardDescription>
                    Renda mensal atual dos personal trainers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip 
                          formatter={(value: number) => [`${value} personal trainers`, 'Quantidade']}
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                          {revenueData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Insight:</strong> Renda média de R$ {avgRevenue.toLocaleString('pt-BR')}/mês 
                      com ticket médio de R$ {avgTicket.toLocaleString('pt-BR')} por aluno.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico Combinado - Alunos vs Renda */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Comparativo: Quantidade de Alunos vs Renda
                </CardTitle>
                <CardDescription>
                  Visualização lado a lado das distribuições
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={studentsData.map((s: any, i: number) => ({
                        ...s,
                        revenue: revenueData[i]?.value || 0,
                        revenueName: revenueData[i]?.name || "",
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="value" fill="#3b82f6" name="Por Qtd Alunos" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Por Renda" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Análise Cruzada */}
          <TabsContent value="analysis" className="space-y-6">
            {/* Scatter Plot - Alunos x Renda */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Análise Cruzada: Alunos x Renda
                </CardTitle>
                <CardDescription>
                  Cada ponto representa um personal trainer. Veja a correlação entre quantidade de alunos e renda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        type="number" 
                        dataKey="students" 
                        name="Alunos" 
                        label={{ value: 'Quantidade de Alunos', position: 'bottom', offset: -5 }}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="revenue" 
                        name="Renda" 
                        tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`}
                        label={{ value: 'Renda Mensal (R$)', angle: -90, position: 'insideLeft' }}
                      />
                      <ZAxis range={[100, 500]} />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        formatter={(value: number, name: string) => {
                          if (name === 'Renda') return [`R$ ${value.toLocaleString('pt-BR')}`, name];
                          return [value, name];
                        }}
                      />
                      <Legend />
                      <Scatter 
                        name="Personal Trainers" 
                        data={scatterData} 
                        fill="#8b5cf6"
                      >
                        {scatterData.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.qualified ? "#10b981" : "#ef4444"} 
                          />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex gap-4 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                    <span className="text-sm text-gray-600">Qualificado</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-600">Não Qualificado</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cards de Insights */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-700">Perfil Mais Comum</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-blue-600">{avgStudents} alunos</p>
                    <p className="text-sm text-blue-600">Média de alunos por personal</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Personal trainers com essa quantidade de alunos são o público-alvo ideal para o FitPrime.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="text-lg text-green-700">Potencial de Mercado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-green-600">R$ {avgRevenue.toLocaleString('pt-BR')}</p>
                    <p className="text-sm text-green-600">Renda média mensal</p>
                    <p className="text-xs text-gray-600 mt-2">
                      Com ticket médio de R$ {avgTicket}/aluno, há espaço para crescimento com automação.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader>
                  <CardTitle className="text-lg text-purple-700">Oportunidade</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-3xl font-bold text-purple-600">{funnel.qualified}</p>
                    <p className="text-sm text-purple-600">Leads qualificados</p>
                    <p className="text-xs text-gray-600 mt-2">
                      {rates.qualificationRate}% dos leads são qualificados e prontos para conversão.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Lista de Leads */}
          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Últimas Respostas</span>
                  <Badge variant="outline">{responsesData?.total || 0} total</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Data</th>
                        <th className="text-left py-2 px-3">Alunos</th>
                        <th className="text-left py-2 px-3">Renda</th>
                        <th className="text-left py-2 px-3">Ticket/Aluno</th>
                        <th className="text-left py-2 px-3">Perfil</th>
                        <th className="text-left py-2 px-3">Status</th>
                        <th className="text-left py-2 px-3">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {responsesData?.responses?.map((response: any) => {
                        const students = parseInt(response.studentsCount) || 0;
                        const revenue = parseInt(response.revenue) || 0;
                        const ticket = students > 0 ? Math.round(revenue / students) : 0;
                        
                        return (
                          <tr 
                            key={response.id} 
                            className="border-b hover:bg-gray-50 cursor-pointer" 
                            onClick={() => window.location.href = `/admin/quiz/${response.id}`}
                          >
                            <td className="py-2 px-3">
                              {new Date(response.createdAt).toLocaleDateString("pt-BR")}
                            </td>
                            <td className="py-2 px-3 font-medium">
                              {STUDENTS_LABELS[response.studentsCount] || response.studentsCount || "-"}
                            </td>
                            <td className="py-2 px-3 font-medium text-green-600">
                              {REVENUE_LABELS[response.revenue] || (response.revenue ? `R$ ${response.revenue}` : "-")}
                            </td>
                            <td className="py-2 px-3 text-purple-600">
                              {ticket > 0 ? `R$ ${ticket}` : "-"}
                            </td>
                            <td className="py-2 px-3">
                              <Badge variant="outline">
                                {response.recommendedProfile === "high_pain" ? "Alta Dor" :
                                 response.recommendedProfile === "medium_pain" ? "Média Dor" :
                                 response.recommendedProfile === "low_pain" ? "Baixa Dor" :
                                 response.recommendedProfile || "-"}
                              </Badge>
                            </td>
                            <td className="py-2 px-3">
                              {response.isQualified ? (
                                <Badge className="bg-emerald-100 text-emerald-700">Qualificado</Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700">Desqualificado</Badge>
                              )}
                            </td>
                            <td className="py-2 px-3">
                              <Button variant="ghost" size="sm">
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
