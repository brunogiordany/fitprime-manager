import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  TrendingUp,
  Target,
  CheckCircle,
  XCircle,
  Eye,
  MousePointer,
  CreditCard,
  BarChart3,
  Calendar,
  Filter,
  Download,
  ArrowRight,
  Loader2,
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
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function AdminQuizDashboard() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: funnelStats, isLoading: loadingStats } = trpc.quiz.getFunnelStats.useQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const { data: dailyData, isLoading: loadingDaily } = trpc.quiz.getResponsesByDay.useQuery({
    days: 30,
  });

  const { data: responsesData, isLoading: loadingResponses } = trpc.quiz.listResponses.useQuery({
    page: 1,
    limit: 10,
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
    viewedPricing: 0,
    clickedCta: 0,
    convertedTrial: 0,
    convertedPaid: 0,
  };

  const rates = funnelStats?.conversionRates || {
    qualificationRate: "0",
    pricingViewRate: "0",
    ctaClickRate: "0",
    trialConversionRate: "0",
    paidConversionRate: "0",
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
    name: p.profile || "Não definido",
    value: p.count,
  })) || [];

  const painData = distributions.pain?.map((p: any) => ({
    name: p.pain || "Não definido",
    value: p.count,
  })) || [];

  const studentsData = distributions.students?.map((s: any) => ({
    name: s.students === "1_5" ? "1-5" : 
          s.students === "6_15" ? "6-15" :
          s.students === "16_30" ? "16-30" :
          s.students === "over_30" ? "30+" :
          s.students === "none" ? "Nenhum" : s.students || "N/A",
    value: s.count,
  })) || [];

  const revenueData = distributions.revenue?.map((r: any) => ({
    name: r.revenue === "under_2k" ? "< R$ 2k" :
          r.revenue === "2k_5k" ? "R$ 2k-5k" :
          r.revenue === "5k_10k" ? "R$ 5k-10k" :
          r.revenue === "over_10k" ? "> R$ 10k" :
          r.revenue === "no_revenue" ? "Sem renda" : r.revenue || "N/A",
    value: r.count,
  })) || [];

  const deviceData = distributions.device?.map((d: any) => ({
    name: d.device || "Desconhecido",
    value: d.count,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard do Quiz</h1>
            <p className="text-gray-600">Análise completa do funil de qualificação</p>
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

        {/* KPIs do Funil */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-gray-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs">Iniciaram</span>
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
              <div className="flex items-center gap-2 text-red-500 mb-1">
                <XCircle className="h-4 w-4" />
                <span className="text-xs">Desqualificados</span>
              </div>
              <p className="text-2xl font-bold">{funnel.disqualified}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Eye className="h-4 w-4" />
                <span className="text-xs">Viram Preços</span>
              </div>
              <p className="text-2xl font-bold">{funnel.viewedPricing}</p>
              <p className="text-xs text-gray-500">{rates.pricingViewRate}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <MousePointer className="h-4 w-4" />
                <span className="text-xs">Clicaram CTA</span>
              </div>
              <p className="text-2xl font-bold">{funnel.clickedCta}</p>
              <p className="text-xs text-gray-500">{rates.ctaClickRate}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-amber-600 mb-1">
                <Target className="h-4 w-4" />
                <span className="text-xs">Trial</span>
              </div>
              <p className="text-2xl font-bold">{funnel.convertedTrial}</p>
              <p className="text-xs text-gray-500">{rates.trialConversionRate}%</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <CreditCard className="h-4 w-4" />
                <span className="text-xs">Pagos</span>
              </div>
              <p className="text-2xl font-bold">{funnel.convertedPaid}</p>
              <p className="text-xs text-gray-500">{rates.paidConversionRate}%</p>
            </CardContent>
          </Card>
        </div>

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

          {/* Por Quantidade de Alunos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Por Quantidade de Alunos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Por Renda */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Por Faixa de Renda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Por Prioridade/Dor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Por Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={painData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {painData.map((entry: any, index: number) => (
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
                  { label: "Iniciaram Quiz", value: funnel.total, color: "bg-gray-200" },
                  { label: "Qualificados", value: funnel.qualified, color: "bg-emerald-200" },
                  { label: "Viram Preços", value: funnel.viewedPricing, color: "bg-blue-200" },
                  { label: "Clicaram CTA", value: funnel.clickedCta, color: "bg-purple-200" },
                  { label: "Trial", value: funnel.convertedTrial, color: "bg-amber-200" },
                  { label: "Pagos", value: funnel.convertedPaid, color: "bg-emerald-400" },
                ].map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div 
                      className={`h-8 ${step.color} rounded flex items-center justify-end pr-2`}
                      style={{ width: `${Math.max(10, (step.value / Math.max(funnel.total, 1)) * 100)}%` }}
                    >
                      <span className="text-sm font-medium">{step.value}</span>
                    </div>
                    <span className="text-sm text-gray-600 whitespace-nowrap">{step.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Últimas Respostas */}
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
                    <th className="text-left py-2 px-3">Perfil</th>
                    <th className="text-left py-2 px-3">Status</th>
                    <th className="text-left py-2 px-3">Conversão</th>
                  </tr>
                </thead>
                <tbody>
                  {responsesData?.responses?.map((response: any) => (
                    <tr key={response.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3">
                        {new Date(response.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-2 px-3">{response.studentsCount || "-"}</td>
                      <td className="py-2 px-3">{response.revenue || "-"}</td>
                      <td className="py-2 px-3">
                        <Badge variant="outline">{response.recommendedProfile || "-"}</Badge>
                      </td>
                      <td className="py-2 px-3">
                        {response.isQualified ? (
                          <Badge className="bg-emerald-100 text-emerald-700">Qualificado</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">Desqualificado</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1">
                          {response.viewedPricing && <Badge variant="outline" className="text-xs">Viu preços</Badge>}
                          {response.clickedCta && <Badge variant="outline" className="text-xs">Clicou CTA</Badge>}
                          {response.convertedToTrial && <Badge className="bg-amber-100 text-amber-700 text-xs">Trial</Badge>}
                          {response.convertedToPaid && <Badge className="bg-emerald-100 text-emerald-700 text-xs">Pago</Badge>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
