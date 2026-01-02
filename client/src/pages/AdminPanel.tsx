import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Shield, 
  Users, 
  Gift, 
  Ban, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Search,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  UserPlus,
  Zap,
  Eye,
  Settings,
  Bell,
  Download,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";

// Componente de gráfico simples de barras
function SimpleBarChart({ data, label }: { data: { date: string; count: number }[]; label: string }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Sem dados disponíveis
      </div>
    );
  }
  
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-end gap-1 h-32">
        {data.slice(-14).map((item, i) => (
          <div 
            key={i} 
            className="flex-1 bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
            style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '4px' : '0' }}
            title={`${item.date}: ${item.count} novos`}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.date?.split('-').slice(1).join('/')}</span>
        <span>{data[data.length - 1]?.date?.split('-').slice(1).join('/')}</span>
      </div>
    </div>
  );
}

// Componente de gráfico de pizza simples
function SimplePieChart({ data }: { data: { status: string; count: number }[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        Sem dados disponíveis
      </div>
    );
  }
  
  const total = data.reduce((acc, d) => acc + d.count, 0);
  const colors: Record<string, string> = {
    active: 'bg-green-500',
    trial: 'bg-blue-500',
    cancelled: 'bg-gray-500',
    expired: 'bg-red-500',
  };
  const labels: Record<string, string> = {
    active: 'Ativos',
    trial: 'Trial',
    cancelled: 'Cancelados',
    expired: 'Expirados',
  };
  
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${colors[item.status] || 'bg-gray-400'}`} />
          <span className="flex-1 text-sm">{labels[item.status] || item.status}</span>
          <span className="text-sm font-medium">{item.count}</span>
          <span className="text-xs text-muted-foreground">
            ({total > 0 ? Math.round((item.count / total) * 100) : 0}%)
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPanel() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonal, setSelectedPersonal] = useState<any>(null);
  const [grantDays, setGrantDays] = useState(30);
  const [activateDays, setActivateDays] = useState(30);
  const [dialogType, setDialogType] = useState<'grant' | 'revoke' | 'activate' | 'cancel' | 'details' | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Verificar se é o owner
  const { data: ownerCheck, isLoading: checkingOwner } = trpc.admin.isOwner.useQuery();
  
  // Métricas do dashboard
  const { data: metrics, isLoading: loadingMetrics, refetch: refetchMetrics } = trpc.admin.dashboardMetrics.useQuery(undefined, {
    enabled: ownerCheck?.isOwner === true,
  });
  
  // Dados de crescimento
  const { data: growthData } = trpc.admin.growthData.useQuery({ days: 30 }, {
    enabled: ownerCheck?.isOwner === true,
  });
  
  // Distribuição de assinaturas
  const { data: subscriptionDist } = trpc.admin.subscriptionDistribution.useQuery(undefined, {
    enabled: ownerCheck?.isOwner === true,
  });
  
  // Top personais
  const { data: topPersonals } = trpc.admin.topPersonalsByStudents.useQuery({ limit: 5 }, {
    enabled: ownerCheck?.isOwner === true,
  });
  
  // Personais mais ativos
  const { data: activePersonals } = trpc.admin.mostActivePersonals.useQuery({ limit: 5 }, {
    enabled: ownerCheck?.isOwner === true,
  });
  
  // Assinaturas expirando
  const { data: expiringSubscriptions } = trpc.admin.expiringSubscriptions.useQuery({ days: 7 }, {
    enabled: ownerCheck?.isOwner === true,
  });
  
  // Atividade recente
  const { data: recentActivity } = trpc.admin.recentActivity.useQuery({ limit: 10 }, {
    enabled: ownerCheck?.isOwner === true,
  });
  
  // Métricas de receita
  const { data: revenueMetrics } = trpc.admin.revenueMetrics.useQuery(undefined, {
    enabled: ownerCheck?.isOwner === true,
  });
  
  // Dados de conversão
  const { data: conversionData } = trpc.admin.conversionData.useQuery(undefined, {
    enabled: ownerCheck?.isOwner === true,
  });
  
  // Listar todos os personais
  const { data: personals, isLoading, refetch } = trpc.admin.listPersonals.useQuery(undefined, {
    enabled: ownerCheck?.isOwner === true,
  });
  
  // Detalhes do personal selecionado
  const { data: personalDetails } = trpc.admin.personalDetails.useQuery(
    { personalId: selectedPersonal?.id || 0 },
    { enabled: !!selectedPersonal && dialogType === 'details' }
  );

  // Mutations
  const grantTestAccess = trpc.admin.grantTestAccess.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      refetchMetrics();
      setDialogType(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const revokeTestAccess = trpc.admin.revokeTestAccess.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      refetchMetrics();
      setDialogType(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const activateSubscription = trpc.admin.activateSubscription.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      refetchMetrics();
      setDialogType(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const cancelSubscription = trpc.admin.cancelSubscription.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
      refetchMetrics();
      setDialogType(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Se não é owner, redirecionar
  if (!checkingOwner && !ownerCheck?.isOwner) {
    return <Redirect to="/dashboard" />;
  }

  if (checkingOwner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Filtrar personais
  const filteredPersonals = personals?.filter((p: any) => {
    const search = searchTerm.toLowerCase();
    return (
      p.userName?.toLowerCase().includes(search) ||
      p.userEmail?.toLowerCase().includes(search) ||
      p.businessName?.toLowerCase().includes(search) ||
      p.whatsappNumber?.includes(search)
    );
  }) || [];

  // Helpers para status
  const getStatusBadge = (personal: any) => {
    const now = new Date();
    
    // Verificar acesso de teste
    if (personal.testAccessEndsAt && new Date(personal.testAccessEndsAt) > now) {
      const daysLeft = Math.ceil((new Date(personal.testAccessEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return (
        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
          <Gift className="w-3 h-3 mr-1" />
          Teste ({daysLeft}d)
        </Badge>
      );
    }
    
    // Verificar status da assinatura
    if (personal.subscriptionStatus === 'active') {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle className="w-3 h-3 mr-1" />
          Ativo
        </Badge>
      );
    }
    
    if (personal.subscriptionStatus === 'trial') {
      // Verificar se trial expirou
      if (personal.trialEndsAt && new Date(personal.trialEndsAt) < now) {
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Trial Expirado
          </Badge>
        );
      }
      // Calcular horas restantes do trial
      const createdAt = new Date(personal.createdAt);
      const trialEnd = personal.trialEndsAt ? new Date(personal.trialEndsAt) : new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      if (trialEnd < now) {
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Trial Expirado
          </Badge>
        );
      }
      const hoursLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Clock className="w-3 h-3 mr-1" />
          Trial ({hoursLeft}h)
        </Badge>
      );
    }
    
    if (personal.subscriptionStatus === 'cancelled') {
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
          <Ban className="w-3 h-3 mr-1" />
          Cancelado
        </Badge>
      );
    }
    
    if (personal.subscriptionStatus === 'expired') {
      return (
        <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expirado
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline">
        Desconhecido
      </Badge>
    );
  };

  const handleAction = (personal: any, action: 'grant' | 'revoke' | 'activate' | 'cancel' | 'details') => {
    setSelectedPersonal(personal);
    setDialogType(action);
  };

  const confirmAction = () => {
    if (!selectedPersonal) return;

    switch (dialogType) {
      case 'grant':
        grantTestAccess.mutate({ personalId: selectedPersonal.id, days: grantDays });
        break;
      case 'revoke':
        revokeTestAccess.mutate({ personalId: selectedPersonal.id });
        break;
      case 'activate':
        activateSubscription.mutate({ personalId: selectedPersonal.id, days: activateDays });
        break;
      case 'cancel':
        cancelSubscription.mutate({ personalId: selectedPersonal.id });
        break;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Shield className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Painel de Administração</h1>
                <p className="text-sm text-gray-500">FitPrime Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => { refetch(); refetchMetrics(); }}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="personals" className="gap-2">
              <Users className="w-4 h-4" />
              Personais
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="w-4 h-4" />
              Atividade
            </TabsTrigger>
          </TabsList>

          {/* Tab: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Personais</p>
                      <p className="text-3xl font-bold">{metrics?.personals.total || 0}</p>
                      <p className="text-xs text-emerald-600 flex items-center mt-1">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        +{metrics?.personals.new7Days || 0} esta semana
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                      <p className="text-3xl font-bold">{metrics?.personals.active || 0}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {metrics?.personals.testAccess || 0} em teste
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">MRR Estimado</p>
                      <p className="text-3xl font-bold">{formatCurrency(revenueMetrics?.estimatedMRR || 0)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ARR: {formatCurrency(revenueMetrics?.estimatedARR || 0)}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <DollarSign className="w-6 h-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                      <p className="text-3xl font-bold">{conversionData?.conversionRate || 0}%</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {conversionData?.converted || 0} de {conversionData?.totalTrial || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-full">
                      <TrendingUp className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos e Listas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Crescimento de Usuários */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Crescimento de Usuários</CardTitle>
                  <CardDescription>Novos cadastros nos últimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart 
                    data={growthData || []} 
                    label={`Total: ${metrics?.personals.new30Days || 0} novos no período`}
                  />
                </CardContent>
              </Card>

              {/* Distribuição de Assinaturas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição de Status</CardTitle>
                  <CardDescription>Status das assinaturas</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimplePieChart data={subscriptionDist || []} />
                </CardContent>
              </Card>

              {/* Top Personais por Alunos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Personais por Alunos</CardTitle>
                  <CardDescription>Personais com mais alunos ativos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPersonals?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum dado disponível
                      </p>
                    )}
                    {topPersonals?.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-sm font-bold text-emerald-600">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{p.userName}</p>
                            <p className="text-xs text-muted-foreground">{p.businessName || 'Sem empresa'}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{p.studentCount} alunos</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Personais Mais Ativos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personais Mais Ativos</CardTitle>
                  <CardDescription>Mais sessões nos últimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activePersonals?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum dado disponível
                      </p>
                    )}
                    {activePersonals?.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{p.userName}</p>
                            <p className="text-xs text-muted-foreground">{p.businessName || 'Sem empresa'}</p>
                          </div>
                        </div>
                        <Badge variant="secondary">{p.sessionCount} sessões</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertas e Expirações */}
            {expiringSubscriptions && expiringSubscriptions.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                    <AlertTriangle className="w-5 h-5" />
                    Assinaturas Expirando em 7 Dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expiringSubscriptions.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg">
                        <div>
                          <p className="font-medium">{p.userName}</p>
                          <p className="text-sm text-muted-foreground">{p.userEmail}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-orange-600">
                            Expira em {formatDate(p.subscriptionExpiresAt || p.testAccessEndsAt)}
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-1"
                            onClick={() => handleAction(p, 'grant')}
                          >
                            Estender
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Personais */}
          <TabsContent value="personals" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Total Personais</p>
                      <p className="text-2xl font-bold">{metrics?.personals.total || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Ativos</p>
                      <p className="text-2xl font-bold">{metrics?.personals.active || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Gift className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Acesso Teste</p>
                      <p className="text-2xl font-bold">{metrics?.personals.testAccess || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Em Trial</p>
                      <p className="text-2xl font-bold">{metrics?.personals.trial || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabela de Personais */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personais Cadastrados</CardTitle>
                    <CardDescription>Gerencie acessos de teste e assinaturas</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Busca */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome, email, empresa ou WhatsApp..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Tabela */}
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Personal</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ) : filteredPersonals.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            Nenhum personal encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPersonals.map((personal: any) => (
                          <TableRow key={personal.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{personal.userName || 'Sem nome'}</p>
                                <p className="text-sm text-muted-foreground">{personal.businessName || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="text-sm">{personal.userEmail || '-'}</p>
                                <p className="text-sm text-muted-foreground">{personal.whatsappNumber || '-'}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {getStatusBadge(personal)}
                                {personal.testAccessGrantedBy && (
                                  <p className="text-xs text-muted-foreground">
                                    Por: {personal.testAccessGrantedBy}
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatDate(personal.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction(personal, 'details')}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAction(personal, 'grant')}
                                >
                                  <Gift className="w-4 h-4 mr-1" />
                                  Teste
                                </Button>
                                {personal.testAccessEndsAt && new Date(personal.testAccessEndsAt) > new Date() && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleAction(personal, 'revoke')}
                                  >
                                    <Ban className="w-4 h-4 mr-1" />
                                    Revogar
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-green-600 hover:text-green-700"
                                  onClick={() => handleAction(personal, 'activate')}
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Ativar
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Assinaturas */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Métricas de Receita */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                    Métricas de Receita
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-lg">
                      <p className="text-sm text-emerald-600">MRR (Mensal)</p>
                      <p className="text-2xl font-bold text-emerald-700">
                        {formatCurrency(revenueMetrics?.estimatedMRR || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">ARR (Anual)</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {formatCurrency(revenueMetrics?.estimatedARR || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                    <p className="text-xl font-bold">{revenueMetrics?.activeSubscriptions || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Base de cálculo: R$ 49,90/mês por assinatura
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Conversão */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Funil de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm">Total que iniciou trial</span>
                      <span className="font-bold">{conversionData?.totalTrial || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm">Em trial atualmente</span>
                      <span className="font-bold">{conversionData?.inTrial || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm">Converteram para pagante</span>
                      <span className="font-bold">{conversionData?.converted || 0}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <p className="text-sm text-purple-600">Taxa de Conversão</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {conversionData?.conversionRate || 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribuição de Status */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {subscriptionDist?.map((item: any, i: number) => {
                    const colors: Record<string, string> = {
                      active: 'bg-green-100 text-green-700 border-green-200',
                      trial: 'bg-blue-100 text-blue-700 border-blue-200',
                      cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
                      expired: 'bg-red-100 text-red-700 border-red-200',
                    };
                    const labels: Record<string, string> = {
                      active: 'Ativos',
                      trial: 'Trial',
                      cancelled: 'Cancelados',
                      expired: 'Expirados',
                    };
                    return (
                      <div key={i} className={`p-4 rounded-lg border ${colors[item.status] || 'bg-gray-50'}`}>
                        <p className="text-sm font-medium">{labels[item.status] || item.status}</p>
                        <p className="text-2xl font-bold">{item.count}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Atividade */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Estatísticas Gerais */}
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-600">Total de Alunos</p>
                      <p className="text-2xl font-bold text-blue-700">{metrics?.students.total || 0}</p>
                      <p className="text-xs text-muted-foreground">{metrics?.students.active || 0} ativos</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-purple-600">Sessões Realizadas</p>
                      <p className="text-2xl font-bold text-purple-700">{metrics?.sessions.total || 0}</p>
                      <p className="text-xs text-muted-foreground">{metrics?.sessions.last30Days || 0} nos últimos 30 dias</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total de Usuários</p>
                    <p className="text-xl font-bold">{metrics?.users.total || 0}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Atividade Recente */}
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>Últimos cadastros no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {recentActivity?.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma atividade recente
                      </p>
                    )}
                    {recentActivity?.map((activity: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-emerald-100 rounded-full">
                          <UserPlus className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.userName}</p>
                          <p className="text-xs text-muted-foreground">{activity.userEmail}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(activity.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog para ações */}
      <Dialog open={dialogType !== null && dialogType !== 'details'} onOpenChange={() => setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'grant' && 'Liberar Acesso de Teste'}
              {dialogType === 'revoke' && 'Revogar Acesso de Teste'}
              {dialogType === 'activate' && 'Ativar Assinatura'}
              {dialogType === 'cancel' && 'Cancelar Assinatura'}
            </DialogTitle>
            <DialogDescription>
              {selectedPersonal && (
                <span>
                  Personal: <strong>{selectedPersonal.userName}</strong>
                  {selectedPersonal.businessName && ` (${selectedPersonal.businessName})`}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {dialogType === 'grant' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Dias de acesso</label>
                <Input
                  type="number"
                  value={grantDays}
                  onChange={(e) => setGrantDays(Number(e.target.value))}
                  min={1}
                  max={365}
                />
              </div>
            </div>
          )}

          {dialogType === 'activate' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Dias de assinatura</label>
                <Input
                  type="number"
                  value={activateDays}
                  onChange={(e) => setActivateDays(Number(e.target.value))}
                  min={1}
                  max={365}
                />
              </div>
            </div>
          )}

          {dialogType === 'revoke' && (
            <p className="text-muted-foreground">
              Tem certeza que deseja revogar o acesso de teste deste personal?
            </p>
          )}

          {dialogType === 'cancel' && (
            <p className="text-muted-foreground">
              Tem certeza que deseja cancelar a assinatura deste personal?
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmAction}
              className={
                dialogType === 'revoke' || dialogType === 'cancel'
                  ? 'bg-red-600 hover:bg-red-700'
                  : ''
              }
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de detalhes */}
      <Dialog open={dialogType === 'details'} onOpenChange={() => setDialogType(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Personal</DialogTitle>
          </DialogHeader>
          {personalDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome</p>
                  <p className="font-medium">{personalDetails.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{personalDetails.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <p className="font-medium">{personalDetails.businessName || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">WhatsApp</p>
                  <p className="font-medium">{personalDetails.whatsappNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  {getStatusBadge(personalDetails)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cadastro</p>
                  <p className="font-medium">{formatDate(personalDetails.createdAt)}</p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">Estatísticas</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-700">{personalDetails.stats?.studentCount || 0}</p>
                    <p className="text-xs text-blue-600">Alunos</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-700">{personalDetails.stats?.sessionCount || 0}</p>
                    <p className="text-xs text-purple-600">Sessões (30d)</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-emerald-700">{personalDetails.stats?.workoutCount || 0}</p>
                    <p className="text-xs text-emerald-600">Treinos</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogType(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
