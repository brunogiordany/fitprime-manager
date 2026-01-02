import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  Mail,
  Phone,
  Key,
  Lock,
  Unlock,
  FileSpreadsheet,
  MessageSquare,
  User,
  Building,
  CreditCard,
  Dumbbell,
  CalendarDays,
  X,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";

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
    test_access: 'bg-purple-500',
    expired: 'bg-red-500',
    cancelled: 'bg-gray-500',
  };
  const labels: Record<string, string> = {
    active: 'Ativo',
    trial: 'Trial',
    test_access: 'Teste',
    expired: 'Expirado',
    cancelled: 'Cancelado',
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

// Componente de detalhes do Personal (Sheet lateral)
function PersonalDetailsSheet({ 
  personalId, 
  open, 
  onClose 
}: { 
  personalId: number | null; 
  open: boolean; 
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");
  
  const { data: students, isLoading: loadingStudents } = trpc.admin.personalStudents.useQuery(
    { personalId: personalId! },
    { enabled: !!personalId && open }
  );
  
  const { data: stats, isLoading: loadingStats } = trpc.admin.personalDetailedStats.useQuery(
    { personalId: personalId! },
    { enabled: !!personalId && open }
  );
  
  const { data: loginInfo, isLoading: loadingLogin } = trpc.admin.personalLoginInfo.useQuery(
    { personalId: personalId! },
    { enabled: !!personalId && open }
  );
  
  const { data: config, isLoading: loadingConfig } = trpc.admin.personalConfig.useQuery(
    { personalId: personalId! },
    { enabled: !!personalId && open }
  );
  
  const { data: growthData, isLoading: loadingGrowth } = trpc.admin.personalGrowthChart.useQuery(
    { personalId: personalId!, months: 6 },
    { enabled: !!personalId && open }
  );
  
  const resetPasswordMutation = trpc.admin.resetPersonalPassword.useMutation({
    onSuccess: (data) => {
      toast.success(`Link de recuperação enviado para ${data.email}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const blockMutation = trpc.admin.togglePersonalBlock.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };
  
  const exportStudentsCSV = () => {
    if (!students || students.length === 0) {
      toast.error("Nenhum aluno para exportar");
      return;
    }
    
    const headers = ["Nome", "Email", "WhatsApp", "Status", "Opt-in WhatsApp", "Cadastro"];
    const rows = students.map(s => [
      s.name,
      s.email || "",
      s.phone || "",
      s.status,
      s.whatsappOptIn ? "Sim" : "Não",
      s.createdAt ? new Date(s.createdAt).toLocaleDateString("pt-BR") : "",
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `alunos_personal_${personalId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
  };
  
  const isLoading = loadingStudents || loadingStats || loadingLogin || loadingConfig || loadingGrowth;
  
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Personal
          </SheetTitle>
          <SheetDescription>
            Informações completas e ações administrativas
          </SheetDescription>
        </SheetHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Informações básicas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informações do Usuário
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Nome</p>
                    <p className="font-medium">{loginInfo?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Empresa</p>
                    <p className="font-medium">{config?.businessName || "N/A"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{loginInfo?.email || "N/A"}</span>
                  {loginInfo?.email && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(loginInfo.email!, "Email")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">{loginInfo?.phone || config?.whatsappNumber || "N/A"}</span>
                  {(loginInfo?.phone || config?.whatsappNumber) && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => copyToClipboard(loginInfo?.phone || config?.whatsappNumber || "", "Telefone")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Último Login</p>
                    <p>{loginInfo?.lastSignedIn ? new Date(loginInfo.lastSignedIn).toLocaleString("pt-BR") : "Nunca"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cadastro</p>
                    <p>{loginInfo?.accountCreatedAt ? new Date(loginInfo.accountCreatedAt).toLocaleDateString("pt-BR") : "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Estatísticas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-600">{stats?.students?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Alunos</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <CalendarDays className="h-5 w-5 mx-auto mb-1 text-green-600" />
                    <p className="text-2xl font-bold text-green-600">{stats?.sessions?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Sessões</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <Dumbbell className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                    <p className="text-2xl font-bold text-purple-600">{stats?.workouts?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Treinos</p>
                  </div>
                  <div className="text-center p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <DollarSign className="h-5 w-5 mx-auto mb-1 text-amber-600" />
                    <p className="text-2xl font-bold text-amber-600">
                      R$ {stats?.revenue?.totalRevenue?.toFixed(0) || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Receita</p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Alunos Ativos</p>
                    <p className="font-medium">{stats?.students?.active || 0} de {stats?.students?.total || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Novos (30 dias)</p>
                    <p className="font-medium text-green-600">+{stats?.students?.new30Days || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Sessões Realizadas</p>
                    <p className="font-medium">{stats?.sessions?.completed || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taxa de Presença</p>
                    <p className="font-medium">{stats?.sessions?.attendanceRate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cobranças Pagas</p>
                    <p className="font-medium">{stats?.revenue?.paidCharges || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pendentes</p>
                    <p className="font-medium text-amber-600">
                      {stats?.revenue?.pendingCharges || 0} (R$ {stats?.revenue?.pendingAmount?.toFixed(0) || 0})
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Gráfico de Crescimento de Alunos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Crescimento de Alunos
                </CardTitle>
                <CardDescription>
                  Evolução nos últimos 6 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {growthData && growthData.length > 0 ? (
                  <div className="space-y-4">
                    {/* Gráfico de barras */}
                    <div className="h-40">
                      <div className="flex items-end justify-between gap-2 h-32">
                        {growthData.map((item, i) => {
                          const maxCount = Math.max(...growthData.map(d => d.count), 1);
                          const height = (item.count / maxCount) * 100;
                          return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                              <div 
                                className="w-full bg-emerald-500 rounded-t transition-all hover:bg-emerald-600 relative group"
                                style={{ height: `${height}%`, minHeight: item.count > 0 ? '8px' : '4px' }}
                              >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                  {item.count} alunos
                                </div>
                              </div>
                              <span className="text-xs text-muted-foreground">{item.month}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Indicadores de crescimento */}
                    <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Primeiro Mês</p>
                        <p className="text-lg font-bold">{growthData[0]?.count || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Atual</p>
                        <p className="text-lg font-bold">{growthData[growthData.length - 1]?.count || 0}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Crescimento</p>
                        {(() => {
                          const first = growthData[0]?.count || 0;
                          const last = growthData[growthData.length - 1]?.count || 0;
                          const growth = last - first;
                          const percent = first > 0 ? ((growth / first) * 100).toFixed(0) : '0';
                          return (
                            <p className={`text-lg font-bold flex items-center justify-center gap-1 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {growth >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                              {growth >= 0 ? '+' : ''}{growth} ({percent}%)
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                    
                    {/* Novos alunos por mês */}
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground mb-2">Novos alunos por mês</p>
                      <div className="flex items-center gap-2">
                        {growthData.map((item, i) => (
                          <div key={i} className="flex-1 text-center">
                            <div className={`text-sm font-medium ${item.newStudents > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                              {item.newStudents > 0 ? `+${item.newStudents}` : '0'}
                            </div>
                            <div className="text-xs text-muted-foreground">{item.month}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-muted-foreground">
                    Sem dados de crescimento disponíveis
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Lista de Alunos */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Alunos ({students?.length || 0})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={exportStudentsCSV}>
                    <Download className="h-4 w-4 mr-1" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {students && students.length > 0 ? (
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {students.map((student) => (
                        <div 
                          key={student.id} 
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{student.name}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              {student.email && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="h-3 w-3" />
                                  {student.email}
                                </span>
                              )}
                              {student.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {student.phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                              {student.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {student.email && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(student.email!, "Email")}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                            {student.phone && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(student.phone!, "WhatsApp")}
                              >
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum aluno cadastrado
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Configurações e Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configurações & Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">CREF</p>
                    <p className="font-medium">{config?.cref || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status Assinatura</p>
                    <Badge variant={config?.subscriptionStatus === 'active' ? 'default' : 'secondary'}>
                      {config?.subscriptionStatus || "N/A"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Expira em</p>
                    <p className="font-medium">
                      {config?.subscriptionExpiresAt 
                        ? new Date(config.subscriptionExpiresAt).toLocaleDateString("pt-BR")
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Stevo Conectado</p>
                    <Badge variant={config?.evolutionInstance ? 'default' : 'outline'}>
                      {config?.evolutionInstance ? "Sim" : "Não"}
                    </Badge>
                  </div>
                </div>
                
                {config?.testAccessEndsAt && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <p className="text-xs text-muted-foreground">Acesso de Teste</p>
                    <p className="font-medium text-purple-600">
                      Até {new Date(config.testAccessEndsAt).toLocaleDateString("pt-BR")}
                      {config.testAccessGrantedBy && ` (por ${config.testAccessGrantedBy})`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Ações Administrativas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Ações Administrativas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => personalId && resetPasswordMutation.mutate({ personalId })}
                    disabled={resetPasswordMutation.isPending}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Resetar Senha
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => personalId && blockMutation.mutate({ 
                      personalId, 
                      blocked: config?.subscriptionStatus !== 'cancelled' 
                    })}
                    disabled={blockMutation.isPending}
                  >
                    {config?.subscriptionStatus === 'cancelled' ? (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Desbloquear
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Bloquear
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      if (loginInfo?.email) {
                        window.open(`mailto:${loginInfo.email}`, '_blank');
                      } else {
                        toast.error("Email não disponível");
                      }
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar Email
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="justify-start"
                    onClick={() => {
                      const phone = loginInfo?.phone || config?.whatsappNumber;
                      if (phone) {
                        const cleanPhone = phone.replace(/\D/g, '');
                        window.open(`https://wa.me/55${cleanPhone}`, '_blank');
                      } else {
                        toast.error("WhatsApp não disponível");
                      }
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Componente principal
export default function AdminPanel() {
  const auth = useAuth();
  const user = auth.user;
  const authLoading = auth.loading ?? false;
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPersonalId, setSelectedPersonalId] = useState<number | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [showTestAccessDialog, setShowTestAccessDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [testAccessDays, setTestAccessDays] = useState(30);
  const [activateDays, setActivateDays] = useState(30);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showContactsDialog, setShowContactsDialog] = useState(false);
  
  // Verificar se é owner
  const { data: ownerCheck, isLoading: ownerLoading } = trpc.admin.isOwner.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Dados do dashboard
  const { data: metrics, refetch: refetchMetrics } = trpc.admin.dashboardMetrics.useQuery(undefined, {
    enabled: ownerCheck?.isOwner,
  });
  
  const { data: growthData } = trpc.admin.growthData.useQuery({ days: 30 }, {
    enabled: ownerCheck?.isOwner,
  });
  
  const { data: topByStudents } = trpc.admin.topPersonalsByStudents.useQuery({ limit: 5 }, {
    enabled: ownerCheck?.isOwner,
  });
  
  const { data: mostActive } = trpc.admin.mostActivePersonals.useQuery({ limit: 5 }, {
    enabled: ownerCheck?.isOwner,
  });
  
  const { data: subscriptionDist } = trpc.admin.subscriptionDistribution.useQuery(undefined, {
    enabled: ownerCheck?.isOwner,
  });
  
  const { data: expiringList } = trpc.admin.expiringSubscriptions.useQuery({ days: 7 }, {
    enabled: ownerCheck?.isOwner,
  });
  
  const { data: recentActivity } = trpc.admin.recentActivity.useQuery({ limit: 10 }, {
    enabled: ownerCheck?.isOwner,
  });
  
  const { data: revenueMetrics } = trpc.admin.revenueMetrics.useQuery(undefined, {
    enabled: ownerCheck?.isOwner,
  });
  
  const { data: conversionData } = trpc.admin.conversionData.useQuery(undefined, {
    enabled: ownerCheck?.isOwner,
  });
  
  const { data: personals, refetch: refetchPersonals } = trpc.admin.listPersonals.useQuery(undefined, {
    enabled: ownerCheck?.isOwner,
  });
  
  const { data: allContacts } = trpc.admin.allStudentContacts.useQuery(undefined, {
    enabled: ownerCheck?.isOwner && showContactsDialog,
  });
  
  const { data: exportPersonals } = trpc.admin.exportAllPersonals.useQuery(undefined, {
    enabled: ownerCheck?.isOwner && showExportDialog,
  });
  
  // Mutations
  const grantTestAccessMutation = trpc.admin.grantTestAccess.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowTestAccessDialog(false);
      refetchPersonals();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const revokeTestAccessMutation = trpc.admin.revokeTestAccess.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchPersonals();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const activateSubscriptionMutation = trpc.admin.activateSubscription.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowActivateDialog(false);
      refetchPersonals();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const cancelSubscriptionMutation = trpc.admin.cancelSubscription.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetchPersonals();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  // Filtrar personais
  const filteredPersonals = useMemo(() => {
    if (!personals) return [];
    if (!searchTerm) return personals;
    
    const term = searchTerm.toLowerCase();
    return personals.filter(p => 
      p.userName?.toLowerCase().includes(term) ||
      p.userEmail?.toLowerCase().includes(term) ||
      p.businessName?.toLowerCase().includes(term) ||
      p.whatsappNumber?.includes(term)
    );
  }, [personals, searchTerm]);
  
  // Funções de exportação
  const exportPersonalsCSV = () => {
    if (!exportPersonals || exportPersonals.length === 0) {
      toast.error("Nenhum personal para exportar");
      return;
    }
    
    const headers = ["ID", "Nome", "Email", "Telefone", "Empresa", "CREF", "Status", "Expira", "Último Login", "Alunos", "Cadastro"];
    const rows = exportPersonals.map(p => [
      p.id,
      p.name,
      p.email,
      p.phone,
      p.businessName,
      p.cref,
      p.subscriptionStatus,
      p.subscriptionExpiresAt ? new Date(p.subscriptionExpiresAt).toLocaleDateString("pt-BR") : "",
      p.lastSignedIn ? new Date(p.lastSignedIn).toLocaleDateString("pt-BR") : "",
      p.studentCount,
      p.createdAt ? new Date(p.createdAt).toLocaleDateString("pt-BR") : "",
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c || ''}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `personais_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
    setShowExportDialog(false);
  };
  
  const exportContactsCSV = () => {
    if (!allContacts || allContacts.length === 0) {
      toast.error("Nenhum contato para exportar");
      return;
    }
    
    const headers = ["Nome Aluno", "Email", "WhatsApp", "Status", "Opt-in", "Personal"];
    const rows = allContacts.map(c => [
      c.studentName,
      c.studentEmail || "",
      c.studentPhone || "",
      c.status,
      c.whatsappOptIn ? "Sim" : "Não",
      c.personalName,
    ]);
    
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contatos_alunos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado com sucesso!");
    setShowContactsDialog(false);
  };
  
  // Loading states
  if (authLoading || ownerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Redirect if not owner
  if (!ownerCheck?.isOwner) {
    return <Redirect to="/dashboard" />;
  }
  
  const getStatusBadge = (personal: any) => {
    if (personal.subscriptionStatus === 'active') {
      return <Badge className="bg-green-500">Ativo</Badge>;
    }
    if (personal.testAccessEndsAt && new Date(personal.testAccessEndsAt) > new Date()) {
      const daysLeft = Math.ceil((new Date(personal.testAccessEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return <Badge className="bg-purple-500">Teste ({daysLeft}d)</Badge>;
    }
    if (personal.subscriptionStatus === 'trial') {
      if (personal.trialEndsAt && new Date(personal.trialEndsAt) > new Date()) {
        return <Badge className="bg-blue-500">Trial</Badge>;
      }
      return <Badge variant="destructive">Trial Expirado</Badge>;
    }
    if (personal.subscriptionStatus === 'cancelled') {
      return <Badge variant="secondary">Cancelado</Badge>;
    }
    return <Badge variant="outline">Expirado</Badge>;
  };
  
  const refetchAll = () => {
    refetchMetrics();
    refetchPersonals();
    toast.success("Dados atualizados!");
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Painel de Administração</h1>
                <p className="text-sm text-muted-foreground">FitPrime Manager</p>
              </div>
            </div>
            <Button onClick={refetchAll} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="container py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="personals" className="gap-2">
              <Users className="h-4 w-4" />
              Personais
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2">
              <Phone className="h-4 w-4" />
              Contatos
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <Activity className="h-4 w-4" />
              Atividade
            </TabsTrigger>
          </TabsList>
          
          {/* Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Personais</p>
                      <p className="text-3xl font-bold">{metrics?.personals?.total || 0}</p>
                      {metrics?.personals?.new7Days ? (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3" />
                          +{metrics.personals.new7Days} esta semana
                        </p>
                      ) : null}
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                      <p className="text-3xl font-bold">{metrics?.personals?.active || 0}</p>
                      <p className="text-xs text-muted-foreground">
                        {metrics?.personals?.testAccess || 0} em teste
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">MRR Estimado</p>
                      <p className="text-3xl font-bold">
                        R$ {((revenueMetrics?.estimatedMRR || 0)).toFixed(0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ARR: R$ {((revenueMetrics?.estimatedARR || 0)).toFixed(0)}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
                      <DollarSign className="h-6 w-6 text-amber-600" />
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
                      <p className="text-xs text-muted-foreground">
                        {conversionData?.converted || 0} de {conversionData?.totalTrial || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Links Rápidos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/admin/quiz">
                <Card className="cursor-pointer hover:border-emerald-500 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                        <BarChart3 className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">Quiz Dashboard</p>
                        <p className="text-xs text-muted-foreground">Análise de respostas</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/funil">
                <Card className="cursor-pointer hover:border-blue-500 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Funil de Vendas</p>
                        <p className="text-xs text-muted-foreground">Jornada do cliente</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/suporte">
                <Card className="cursor-pointer hover:border-purple-500 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Chat Suporte</p>
                        <p className="text-xs text-muted-foreground">Conversas com leads</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/admin/extra-charges">
                <Card className="cursor-pointer hover:border-amber-500 transition-colors">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900 rounded-lg">
                        <DollarSign className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium">Cobranças Extras</p>
                        <p className="text-xs text-muted-foreground">Alunos excedentes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
            
            {/* Gráficos */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Crescimento de Usuários</CardTitle>
                  <CardDescription>Novos cadastros nos últimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimpleBarChart 
                    data={growthData || []} 
                    label="Novos personais por dia"
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribuição de Status</CardTitle>
                  <CardDescription>Status das assinaturas</CardDescription>
                </CardHeader>
                <CardContent>
                  <SimplePieChart data={subscriptionDist || []} />
                </CardContent>
              </Card>
            </div>
            
            {/* Rankings e Alertas */}
            <div className="grid lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Personais por Alunos</CardTitle>
                  <CardDescription>Personais com mais alunos ativos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topByStudents?.slice(0, 5).map((p, i) => (
                      <div key={p.personalId} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-amber-500 text-white' : 
                          i === 1 ? 'bg-gray-400 text-white' : 
                          i === 2 ? 'bg-amber-700 text-white' : 
                          'bg-muted text-muted-foreground'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.userName}</p>
                          <p className="text-xs text-muted-foreground">{p.businessName}</p>
                        </div>
                        <Badge variant="secondary">{p.studentCount} alunos</Badge>
                      </div>
                    ))}
                    {(!topByStudents || topByStudents.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">Sem dados</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Personais Mais Ativos</CardTitle>
                  <CardDescription>Mais sessões nos últimos 30 dias</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mostActive?.slice(0, 5).map((p, i) => (
                      <div key={p.personalId} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-green-500 text-white' : 
                          i === 1 ? 'bg-green-400 text-white' : 
                          i === 2 ? 'bg-green-300 text-white' : 
                          'bg-muted text-muted-foreground'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.userName}</p>
                          <p className="text-xs text-muted-foreground">{p.businessName}</p>
                        </div>
                        <Badge variant="secondary">{p.sessionCount} sessões</Badge>
                      </div>
                    ))}
                    {(!mostActive || mostActive.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">Sem dados</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Expirando em 7 dias
                  </CardTitle>
                  <CardDescription>Assinaturas que precisam de atenção</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {expiringList?.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                          <Clock className="h-3 w-3 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            Expira: {p.subscriptionExpiresAt ? new Date(p.subscriptionExpiresAt).toLocaleDateString("pt-BR") : p.testAccessEndsAt ? new Date(p.testAccessEndsAt).toLocaleDateString("pt-BR") : "N/A"}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedPersonalId(p.id);
                            setShowDetailsSheet(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {(!expiringList || expiringList.length === 0) && (
                      <p className="text-center text-muted-foreground py-4">
                        Nenhuma assinatura expirando
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Personais */}
          <TabsContent value="personals" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Personais Cadastrados</CardTitle>
                    <CardDescription>Gerencie acessos de teste e assinaturas</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowExportDialog(true)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{metrics?.personals?.total || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Personais</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{metrics?.personals?.active || 0}</p>
                    <p className="text-xs text-muted-foreground">Ativos</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{metrics?.personals?.testAccess || 0}</p>
                    <p className="text-xs text-muted-foreground">Acesso Teste</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{metrics?.personals?.trial || 0}</p>
                    <p className="text-xs text-muted-foreground">Em Trial</p>
                  </div>
                </div>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email, empresa ou WhatsApp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {/* Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Personal</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Alunos</TableHead>
                        <TableHead>Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPersonals.map((personal) => (
                        <TableRow key={personal.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{personal.userName || "Sem nome"}</p>
                              <p className="text-xs text-muted-foreground">{personal.businessName || "-"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {personal.userEmail || "-"}
                              </p>
                              <p className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {personal.whatsappNumber || "-"}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(personal)}
                            {personal.testAccessGrantedBy && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Por: {personal.testAccessGrantedBy}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{(personal as any).studentCount || 0}</Badge>
                          </TableCell>
                          <TableCell>
                            {personal.createdAt 
                              ? new Date(personal.createdAt).toLocaleDateString("pt-BR")
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedPersonalId(personal.id);
                                  setShowDetailsSheet(true);
                                }}
                                title="Ver detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  setSelectedPersonalId(personal.id);
                                  setShowTestAccessDialog(true);
                                }}
                              >
                                <Gift className="h-4 w-4 mr-1" />
                                Teste
                              </Button>
                              
                              {personal.testAccessEndsAt && new Date(personal.testAccessEndsAt) > new Date() && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => revokeTestAccessMutation.mutate({ personalId: personal.id })}
                                >
                                  <Ban className="h-4 w-4 mr-1" />
                                  Revogar
                                </Button>
                              )}
                              
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-green-600"
                                onClick={() => {
                                  setSelectedPersonalId(personal.id);
                                  setShowActivateDialog(true);
                                }}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Ativar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredPersonals.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum personal encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Assinaturas */}
          <TabsContent value="subscriptions" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Métricas de Receita
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-sm text-muted-foreground">MRR (Mensal)</p>
                      <p className="text-3xl font-bold text-green-600">
                        R$ {((revenueMetrics?.estimatedMRR || 0)).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-muted-foreground">ARR (Anual)</p>
                      <p className="text-3xl font-bold text-blue-600">
                        R$ {((revenueMetrics?.estimatedARR || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Assinaturas Ativas</p>
                    <p className="text-2xl font-bold">{revenueMetrics?.activeSubscriptions || 0}</p>
                    <p className="text-xs text-muted-foreground">
                      Base de cálculo: R$ 49,90/mês por assinatura
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Funil de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span>Total que iniciou trial</span>
                      <Badge variant="secondary">{conversionData?.totalTrial || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <span>Em trial atualmente</span>
                      <Badge className="bg-blue-500">{conversionData?.inTrial || 0}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <span>Converteram para pagante</span>
                      <Badge className="bg-green-500">{conversionData?.converted || 0}</Badge>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-950 dark:to-emerald-950 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                    <p className="text-4xl font-bold text-green-600">
                      {conversionData?.conversionRate || 0}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {subscriptionDist?.map((item) => {
                    const colors: Record<string, string> = {
                      active: 'bg-green-500',
                      trial: 'bg-blue-500',
                      test_access: 'bg-purple-500',
                      expired: 'bg-red-500',
                      cancelled: 'bg-gray-500',
                    };
                    const labels: Record<string, string> = {
                      active: 'Ativo',
                      trial: 'Trial',
                      test_access: 'Teste',
                      expired: 'Expirado',
                      cancelled: 'Cancelado',
                    };
                    return (
                      <div key={item.status} className="text-center p-4 rounded-lg bg-muted">
                        <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${colors[item.status] || 'bg-gray-400'}`} />
                        <p className="text-2xl font-bold">{item.count}</p>
                        <p className="text-xs text-muted-foreground">{labels[item.status] || item.status}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Contatos */}
          <TabsContent value="contacts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Central de Contatos
                    </CardTitle>
                    <CardDescription>
                      Acesso a todos os emails e WhatsApp de alunos do sistema
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowContactsDialog(true)}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar Todos os Contatos
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                    <Mail className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold">{metrics?.students?.total || 0}</p>
                    <p className="text-sm text-muted-foreground">Total de Alunos</p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                    <MessageSquare className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold">{metrics?.students?.active || 0}</p>
                    <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <p className="text-2xl font-bold">{metrics?.personals?.total || 0}</p>
                    <p className="text-sm text-muted-foreground">Personais</p>
                  </div>
                </div>
                
                <div className="p-6 border-2 border-dashed rounded-lg text-center">
                  <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-semibold mb-2">Exportar Contatos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Exporte todos os emails e WhatsApp de alunos em formato CSV para usar em campanhas de marketing ou comunicação.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button variant="outline" onClick={() => setShowContactsDialog(true)}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Alunos (CSV)
                    </Button>
                    <Button variant="outline" onClick={() => setShowExportDialog(true)}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Personais (CSV)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Atividade */}
          <TabsContent value="activity" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estatísticas do Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total de Alunos</p>
                      <p className="text-3xl font-bold text-blue-600">{metrics?.students?.total || 0}</p>
                      <p className="text-xs text-muted-foreground">{metrics?.students?.active || 0} ativos</p>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-sm text-muted-foreground">Sessões Realizadas</p>
                      <p className="text-3xl font-bold text-green-600">{metrics?.sessions?.total || 0}</p>
                      <p className="text-xs text-muted-foreground">{metrics?.sessions?.last30Days || 0} nos últimos 30 dias</p>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <p className="text-sm text-muted-foreground">Total de Usuários</p>
                      <p className="text-3xl font-bold text-purple-600">{metrics?.users?.total || 0}</p>
                    </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
                    <p className="text-sm text-muted-foreground">Personais Ativos</p>
                    <p className="text-3xl font-bold text-amber-600">{metrics?.personals?.active || 0}</p>
                  </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>Últimos cadastros no sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-3">
                      {recentActivity?.map((activity, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserPlus className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{activity.userName}</p>
                            <p className="text-xs text-muted-foreground">{activity.userEmail}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {activity.createdAt 
                              ? new Date(activity.createdAt).toLocaleDateString("pt-BR")
                              : "-"}
                          </span>
                        </div>
                      ))}
                      {(!recentActivity || recentActivity.length === 0) && (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhuma atividade recente
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Sheet de Detalhes */}
      <PersonalDetailsSheet
        personalId={selectedPersonalId}
        open={showDetailsSheet}
        onClose={() => {
          setShowDetailsSheet(false);
          setSelectedPersonalId(null);
        }}
      />
      
      {/* Dialog de Acesso de Teste */}
      <Dialog open={showTestAccessDialog} onOpenChange={setShowTestAccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liberar Acesso de Teste</DialogTitle>
            <DialogDescription>
              Defina quantos dias de acesso de teste deseja liberar para este personal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Dias de acesso</label>
            <Input
              type="number"
              value={testAccessDays}
              onChange={(e) => setTestAccessDays(parseInt(e.target.value) || 30)}
              min={1}
              max={365}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestAccessDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedPersonalId) {
                  grantTestAccessMutation.mutate({ 
                    personalId: selectedPersonalId, 
                    days: testAccessDays 
                  });
                }
              }}
              disabled={grantTestAccessMutation.isPending}
            >
              {grantTestAccessMutation.isPending ? "Liberando..." : "Liberar Acesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Ativar Assinatura */}
      <Dialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ativar Assinatura</DialogTitle>
            <DialogDescription>
              Ative a assinatura manualmente para este personal.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium">Dias de assinatura</label>
            <Input
              type="number"
              value={activateDays}
              onChange={(e) => setActivateDays(parseInt(e.target.value) || 30)}
              min={1}
              max={365}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowActivateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (selectedPersonalId) {
                  activateSubscriptionMutation.mutate({ 
                    personalId: selectedPersonalId, 
                    days: activateDays 
                  });
                }
              }}
              disabled={activateSubscriptionMutation.isPending}
            >
              {activateSubscriptionMutation.isPending ? "Ativando..." : "Ativar Assinatura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Exportar Personais */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Personais</DialogTitle>
            <DialogDescription>
              Exporte a lista completa de personais em formato CSV.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              O arquivo CSV incluirá: Nome, Email, Telefone, Empresa, CREF, Status, Data de Expiração, Último Login, Quantidade de Alunos e Data de Cadastro.
            </p>
            <p className="text-sm font-medium mt-4">
              Total de registros: {exportPersonals?.length || 0}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={exportPersonalsCSV}>
              <Download className="h-4 w-4 mr-2" />
              Baixar CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog de Exportar Contatos */}
      <Dialog open={showContactsDialog} onOpenChange={setShowContactsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Contatos de Alunos</DialogTitle>
            <DialogDescription>
              Exporte todos os emails e WhatsApp de alunos em formato CSV.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              O arquivo CSV incluirá: Nome do Aluno, Email, WhatsApp, Status, Opt-in WhatsApp e Nome do Personal.
            </p>
            <p className="text-sm font-medium mt-4">
              Total de contatos: {allContacts?.length || 0}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactsDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={exportContactsCSV}>
              <Download className="h-4 w-4 mr-2" />
              Baixar CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
