import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { 
  Mail,
  Eye,
  MousePointer,
  Send,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  Loader2,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle
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

export default function AdminEmailEngagement() {
  const { user, loading: authLoading } = useAuth();
  const [days, setDays] = useState(30);
  const [selectedSequence, setSelectedSequence] = useState<number | undefined>(undefined);
  
  // Buscar métricas de email
  const { data: metrics, isLoading: loadingMetrics, refetch: refetchMetrics } = trpc.leadEmail.getEmailMetrics.useQuery({});
  
  // Buscar tendências
  const { data: trends, isLoading: loadingTrends } = trpc.leadEmail.getEmailTrends.useQuery({
    days,
    sequenceId: selectedSequence,
  });
  
  // Buscar sequências para filtro
  const { data: sequences } = trpc.leadEmail.listSequences.useQuery();
  
  // Buscar histórico de envios
  const { data: sends, isLoading: loadingSends } = trpc.leadEmail.listSends.useQuery({
    page: 1,
    limit: 10,
    status: "all",
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

  const isLoading = loadingMetrics || loadingTrends;

  // Preparar dados para gráficos
  const trendsData = (trends?.trends || []).map((t: any) => ({
    date: t.date,
    enviados: t.sent || 0,
    aberturas: t.opens || 0,
    cliques: t.clicks || 0,
  }));

  // Dados de status para pie chart
  const statusData = [
    { name: "Enviados", value: metrics?.sentCount || 0, color: "#10b981" },
    { name: "Pendentes", value: metrics?.pendingCount || 0, color: "#f59e0b" },
    { name: "Falhos", value: metrics?.failedCount || 0, color: "#ef4444" },
    { name: "Bounced", value: metrics?.bouncedCount || 0, color: "#6b7280" },
  ].filter(d => d.value > 0);

  // Métricas por sequência
  const sequenceMetrics = metrics?.metricsBySequence || [];

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
              <h1 className="text-3xl md:text-4xl font-bold">Engajamento de Emails</h1>
              <p className="text-gray-600 mt-2">Métricas de abertura, cliques e entrega</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={selectedSequence?.toString() || "all"} 
              onValueChange={(v) => setSelectedSequence(v === "all" ? undefined : parseInt(v))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Todas as sequências" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as sequências</SelectItem>
                {(sequences || []).map((seq: any) => (
                  <SelectItem key={seq.id} value={seq.id.toString()}>
                    {seq.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="outline" onClick={() => refetchMetrics()}>
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
                  <CardTitle className="text-sm font-medium">Total Enviados</CardTitle>
                  <Send className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.sentCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    de {metrics?.totalSends || 0} agendados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Abertura</CardTitle>
                  <Eye className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{metrics?.openRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.totalOpens || 0} aberturas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Clique</CardTitle>
                  <MousePointer className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{metrics?.clickRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.totalClicks || 0} cliques
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{metrics?.pendingCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {metrics?.failedCount || 0} falhos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tendência de Engajamento */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendência de Engajamento</CardTitle>
                  <CardDescription>Envios, aberturas e cliques por dia</CardDescription>
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
                        <Line type="monotone" dataKey="enviados" name="Enviados" stroke="#10b981" strokeWidth={2} />
                        <Line type="monotone" dataKey="aberturas" name="Aberturas" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="cliques" name="Cliques" stroke="#8b5cf6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Distribuição de Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Status dos Emails</CardTitle>
                  <CardDescription>Distribuição por status de envio</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
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

            {/* Performance por Sequência */}
            <Card>
              <CardHeader>
                <CardTitle>Performance por Sequência</CardTitle>
                <CardDescription>Métricas de cada campanha de email</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sequenceMetrics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="sequenceName" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="totalSends" name="Total" fill="#6b7280" />
                      <Bar dataKey="sentCount" name="Enviados" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Últimos Envios */}
            <Card>
              <CardHeader>
                <CardTitle>Últimos Envios</CardTitle>
                <CardDescription>Histórico recente de emails enviados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Email</th>
                        <th className="text-left py-3 px-4 font-medium">Assunto</th>
                        <th className="text-left py-3 px-4 font-medium">Sequência</th>
                        <th className="text-center py-3 px-4 font-medium">Status</th>
                        <th className="text-center py-3 px-4 font-medium">Aberturas</th>
                        <th className="text-center py-3 px-4 font-medium">Cliques</th>
                        <th className="text-left py-3 px-4 font-medium">Enviado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(sends?.sends || []).map((send: any) => (
                        <tr key={send.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{send.leadEmail}</td>
                          <td className="py-3 px-4 text-sm max-w-[200px] truncate">{send.subject}</td>
                          <td className="py-3 px-4 text-sm">{send.sequenceName || "-"}</td>
                          <td className="py-3 px-4 text-center">
                            <Badge 
                              variant={
                                send.status === "sent" ? "default" :
                                send.status === "pending" ? "secondary" :
                                send.status === "failed" ? "destructive" : "outline"
                              }
                            >
                              {send.status === "sent" ? "Enviado" :
                               send.status === "pending" ? "Pendente" :
                               send.status === "failed" ? "Falhou" :
                               send.status === "bounced" ? "Bounced" : send.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="flex items-center justify-center gap-1">
                              <Eye className="h-3 w-3 text-blue-500" />
                              {send.opens || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="flex items-center justify-center gap-1">
                              <MousePointer className="h-3 w-3 text-purple-500" />
                              {send.clicks || 0}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {send.sentAt ? new Date(send.sentAt).toLocaleString("pt-BR") : "-"}
                          </td>
                        </tr>
                      ))}
                      {(!sends?.sends || sends.sends.length === 0) && (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-500">
                            Nenhum email enviado ainda
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {sends && sends.totalPages > 1 && (
                  <div className="flex justify-center mt-4">
                    <Link href="/admin/emails">
                      <Button variant="outline">Ver todos os envios</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo do Período */}
            <Card className="bg-gradient-to-r from-emerald-50 to-blue-50">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Resumo do Período ({days} dias)</h3>
                    <p className="text-gray-600 mt-1">
                      {trends?.summary?.totalSent || 0} emails enviados com {trends?.summary?.openRate || 0}% de abertura
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-600">{trends?.summary?.totalSent || 0}</div>
                      <div className="text-xs text-gray-500">Enviados</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{trends?.summary?.totalOpens || 0}</div>
                      <div className="text-xs text-gray-500">Aberturas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{trends?.summary?.totalClicks || 0}</div>
                      <div className="text-xs text-gray-500">Cliques</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
