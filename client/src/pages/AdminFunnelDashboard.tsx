import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Eye, Users, TrendingUp, Target, CheckCircle2 } from "lucide-react";

interface FunnelMetrics {
  stage: string;
  count: number;
  percentage: number;
  conversionRate: number;
}

interface QuizResponse {
  id: string;
  profile: string;
  pains: string[];
  timestamp: string;
  converted: boolean;
}

export default function AdminFunnelDashboard() {
  const [funnelData] = useState<FunnelMetrics[]>([
    { stage: "Visitantes", count: 1000, percentage: 100, conversionRate: 0 },
    { stage: "Quiz Iniciado", count: 450, percentage: 45, conversionRate: 45 },
    { stage: "Quiz Completo", count: 320, percentage: 32, conversionRate: 71 },
    { stage: "LP Visualizada", count: 280, percentage: 28, conversionRate: 87.5 },
    { stage: "Checkout", count: 95, percentage: 9.5, conversionRate: 34 },
    { stage: "Pagamento Confirmado", count: 72, percentage: 7.2, conversionRate: 76 },
  ]);

  const [painDistribution] = useState([
    { name: "Desorganização", value: 45, color: "#ef4444" },
    { name: "Churn", value: 38, color: "#f97316" },
    { name: "Falta de Tempo", value: 52, color: "#eab308" },
    { name: "Problemas Financeiros", value: 28, color: "#06b6d4" },
    { name: "Falta de Dados", value: 35, color: "#8b5cf6" },
    { name: "Falta de Crescimento", value: 42, color: "#ec4899" },
  ]);

  const [conversionByProfile] = useState([
    { profile: "Beginner", visits: 250, conversions: 18, rate: "7.2%" },
    { profile: "Starter", visits: 450, conversions: 34, rate: "7.6%" },
    { profile: "Pro", visits: 200, conversions: 15, rate: "7.5%" },
    { profile: "Business", visits: 100, conversions: 5, rate: "5%" },
  ]);

  const [dailyConversions] = useState([
    { date: "Jan 1", quizzes: 45, conversions: 3, revenue: 290 },
    { date: "Jan 2", quizzes: 52, conversions: 4, revenue: 388 },
    { date: "Jan 3", quizzes: 48, conversions: 3, revenue: 291 },
    { date: "Jan 4", quizzes: 61, conversions: 5, revenue: 485 },
    { date: "Jan 5", quizzes: 55, conversions: 4, revenue: 388 },
    { date: "Jan 6", quizzes: 67, conversions: 6, revenue: 582 },
    { date: "Jan 7", quizzes: 72, conversions: 5, revenue: 485 },
  ]);

  const [slugs] = useState([
    { slug: "fitprime-manager.com/quiz", visits: 450, conversions: 32, rate: "7.1%" },
    { slug: "fitprime-manager.com/pricing", visits: 280, conversions: 18, rate: "6.4%" },
    { slug: "fitprime-manager.com/pricing-complete", visits: 95, conversions: 72, rate: "75.8%" },
    { slug: "fitprime-manager.com/checkout", visits: 72, conversions: 72, rate: "100%" },
  ]);

  const totalVisitors = funnelData[0].count;
  const totalConversions = funnelData[funnelData.length - 1].count;
  const overallConversionRate = ((totalConversions / totalVisitors) * 100).toFixed(2);
  const totalRevenue = (totalConversions * 97).toFixed(2); // Média de R$ 97 por conversão

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Dashboard de Funil</h1>
            <p className="text-gray-600 mt-2">KPI completo da jornada do cliente</p>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700">
            <Download className="mr-2 w-4 h-4" />
            Exportar Relatório
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total de Visitantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalVisitors.toLocaleString()}</div>
              <p className="text-xs text-gray-500 mt-1">Últimos 7 dias</p>
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
              <CardTitle className="text-sm font-medium text-gray-600">Receita Gerada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">R$ {totalRevenue}</div>
              <p className="text-xs text-gray-500 mt-1">Últimos 7 dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Quizzes Completados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">320</div>
              <p className="text-xs text-gray-500 mt-1">71% de conclusão</p>
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
                      style={{ width: `${stage.percentage}%` }}
                    >
                      {stage.percentage > 10 && `${stage.percentage.toFixed(1)}%`}
                    </div>
                  </div>
                  {idx < funnelData.length - 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Conversão: {stage.conversionRate.toFixed(1)}%
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
              <CardTitle>Conversões por Dia</CardTitle>
              <CardDescription>Últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyConversions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Receita por Dia */}
          <Card>
            <CardHeader>
              <CardTitle>Receita por Dia</CardTitle>
              <CardDescription>Últimos 7 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyConversions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value}`} />
                  <Bar dataKey="revenue" fill="#06b6d4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Dores Identificadas */}
        <Card>
          <CardHeader>
            <CardTitle>Dores Mais Comuns</CardTitle>
            <CardDescription>Distribuição de dores identificadas no quiz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={painDistribution} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {painDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-3">
                {painDistribution.map((pain, idx) => (
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

        {/* Conversão por Perfil */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Perfil</CardTitle>
            <CardDescription>Taxa de conversão por tipo de cliente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">Perfil</th>
                    <th className="text-right py-3 px-4 font-semibold">Visitantes</th>
                    <th className="text-right py-3 px-4 font-semibold">Conversões</th>
                    <th className="text-right py-3 px-4 font-semibold">Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {conversionByProfile.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{row.profile}</td>
                      <td className="text-right py-3 px-4">{row.visits}</td>
                      <td className="text-right py-3 px-4 font-semibold text-emerald-600">{row.conversions}</td>
                      <td className="text-right py-3 px-4">
                        <Badge className="bg-emerald-100 text-emerald-800">{row.rate}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Slugs Registradas */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por URL</CardTitle>
            <CardDescription>Todas as slugs registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">URL</th>
                    <th className="text-right py-3 px-4 font-semibold">Visitantes</th>
                    <th className="text-right py-3 px-4 font-semibold">Conversões</th>
                    <th className="text-right py-3 px-4 font-semibold">Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {slugs.map((slug, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{slug.slug}</td>
                      <td className="text-right py-3 px-4">{slug.visits}</td>
                      <td className="text-right py-3 px-4 font-semibold text-emerald-600">{slug.conversions}</td>
                      <td className="text-right py-3 px-4">
                        <Badge className={slug.rate === "100%" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                          {slug.rate}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Jornada do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle>Jornada Completa do Cliente</CardTitle>
            <CardDescription>Fluxo passo a passo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: 1, title: "Landing Page", desc: "Personal vê anúncio e clica", icon: Eye },
                { step: 2, title: "Quiz de Qualificação", desc: "Responde 5 perguntas sobre dores", icon: Target },
                { step: 3, title: "Resultado do Quiz", desc: "Vê score e plano recomendado", icon: CheckCircle2 },
                { step: 4, title: "LP Completa", desc: "Visualiza benefícios, dores, testimoniais", icon: Users },
                { step: 5, title: "Checkout", desc: "Escolhe plano e insere dados", icon: TrendingUp },
                { step: 6, title: "Pagamento", desc: "Confirma pagamento e começa", icon: CheckCircle2 },
              ].map((journey, idx) => {
                const Icon = journey.icon;
                return (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                        {journey.step}
                      </div>
                      {idx < 5 && <div className="w-1 h-12 bg-gray-300 mt-2"></div>}
                    </div>
                    <div className="pt-1">
                      <p className="font-semibold">{journey.title}</p>
                      <p className="text-sm text-gray-600">{journey.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
