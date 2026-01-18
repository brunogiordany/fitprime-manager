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
  TrendingUp, 
  TrendingDown,
  Users, 
  Target,
  DollarSign,
  RefreshCw,
  ChevronLeft,
  Loader2,
  ArrowRight,
  UserPlus,
  CreditCard,
  Filter
} from "lucide-react";
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
  Cell,
  PieChart,
  Pie,
} from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function AdminConversionDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  
  // Buscar dados de métricas de conversão
  const { data: metrics, isLoading, refetch } = trpc.conversionMetrics.getConversionMetrics.useQuery({
    period,
    startDate: customDateFrom || undefined,
    endDate: customDateTo || undefined,
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

  // Preparar dados para gráficos
  const funnelData = metrics?.funnel || [];
  const trendsData = (metrics?.trends || []).map((t: any) => ({
    date: new Date(t.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    leads: t.leads || 0,
    qualified: t.qualified || 0,
    trials: t.trials || 0,
    paid: t.paid || 0,
  }));

  const profileData = (metrics?.profileDistribution || []).map((p: any, idx: number) => ({
    name: p.profile === "beginner" ? "Iniciante" :
          p.profile === "starter" ? "Starter" :
          p.profile === "pro" ? "Pro" :
          p.profile === "business" ? "Business" : p.profile || "Outros",
    value: p.count || 0,
    converted: p.converted || 0,
    color: COLORS[idx % COLORS.length],
  }));

  const sourceData = (metrics?.sourceDistribution || []).map((s: any) => ({
    source: s.source || "Direto",
    leads: s.count || 0,
    converted: s.converted || 0,
    rate: s.count > 0 ? ((s.converted / s.count) * 100).toFixed(1) : "0.0",
  }));

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
              <h1 className="text-3xl md:text-4xl font-bold">Dashboard de Conversão</h1>
              <p className="text-gray-600 mt-2">Métricas do funil: Leads → Trials → Assinantes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={period} onValueChange={(v) => setPeriod(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            {/* KPIs Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.summary.totalLeads || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.summary.qualifiedLeads || 0} qualificados ({metrics?.rates.qualificationRate || 0}%)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trials Criados</CardTitle>
                  <UserPlus className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.summary.convertedToTrial || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Taxa: {metrics?.rates.leadToTrialRate || 0}% dos leads
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assinantes Pagos</CardTitle>
                  <CreditCard className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.summary.convertedToPaid || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Taxa: {metrics?.rates.trialToPaidRate || 0}% dos trials
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conversão Total</CardTitle>
                  <Target className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">{metrics?.rates.overallConversionRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    Lead → Assinante pago
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Funil Visual */}
            <Card>
              <CardHeader>
                <CardTitle>Funil de Conversão</CardTitle>
                <CardDescription>Visualização das etapas do funil de vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-8">
                  {funnelData.map((stage: any, index: number) => (
                    <div key={stage.stage} className="flex items-center">
                      <div 
                        className="flex flex-col items-center p-6 rounded-lg text-center"
                        style={{ 
                          backgroundColor: `${COLORS[index]}20`,
                          borderLeft: `4px solid ${COLORS[index]}`,
                          minWidth: "150px"
                        }}
                      >
                        <span className="text-3xl font-bold" style={{ color: COLORS[index] }}>
                          {stage.count}
                        </span>
                        <span className="text-sm font-medium text-gray-700 mt-1">{stage.stage}</span>
                        <span className="text-xs text-gray-500 mt-1">
                          {stage.percentage.toFixed(1)}%
                        </span>
                      </div>
                      {index < funnelData.length - 1 && (
                        <ArrowRight className="h-6 w-6 text-gray-400 mx-2 hidden md:block" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tendência Temporal */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Conversão</CardTitle>
                  <CardDescription>Evolução diária do funil</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="qualified" name="Qualificados" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="trials" name="Trials" stroke="#8b5cf6" strokeWidth={2} />
                        <Line type="monotone" dataKey="paid" name="Pagos" stroke="#f59e0b" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição por Perfil */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Perfil</CardTitle>
                  <CardDescription>Leads por perfil recomendado</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={profileData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {profileData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Origens */}
            <Card>
              <CardHeader>
                <CardTitle>Conversão por Origem</CardTitle>
                <CardDescription>Performance por fonte de tráfego (UTM Source)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Origem</th>
                        <th className="text-right py-3 px-4 font-medium">Leads</th>
                        <th className="text-right py-3 px-4 font-medium">Convertidos</th>
                        <th className="text-right py-3 px-4 font-medium">Taxa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sourceData.map((source: any, index: number) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">{source.source}</td>
                          <td className="text-right py-3 px-4">{source.leads}</td>
                          <td className="text-right py-3 px-4">{source.converted}</td>
                          <td className="text-right py-3 px-4">
                            <Badge variant={parseFloat(source.rate) > 5 ? "default" : "secondary"}>
                              {source.rate}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {sourceData.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-8 text-gray-500">
                            Nenhum dado disponível para o período selecionado
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
