import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Settings, 
  Zap, 
  Send, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Eye,
  Phone,
  Mail,
  User,
  Calendar,
  BarChart3,
  ArrowLeft,
  Wifi,
  WifiOff,
  Loader2,
  Search,
  Filter,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos
interface WhatsappConfig {
  id: number | null;
  stevoApiKey: string | null;
  stevoInstanceName: string | null;
  stevoServer: string;
  connectionStatus: string;
  connectedPhone: string | null;
  connectedName: string | null;
}

interface Automation {
  id: number;
  name: string;
  description: string | null;
  trigger: string;
  targetType: string | null;
  messageTemplate: string;
  isActive: boolean;
  delayMinutes: number | null;
  sendWindowStart: string | null;
  sendWindowEnd: string | null;
  sendOnWeekends: boolean | null;
  excludeExistingPersonals: boolean | null;
  excludeRecentMessages: number | null;
  totalSent: number | null;
  totalDelivered: number | null;
  totalRead: number | null;
  totalReplied: number | null;
  createdAt: string | Date;
}

interface Message {
  id: number;
  recipientType: string;
  recipientId: number;
  recipientPhone: string;
  recipientName: string | null;
  direction: string;
  message: string;
  status: string | null;
  createdAt: string | Date;
  sentAt: string | Date | null;
}

interface Lead {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string | Date;
  studentsCount: string | null;
  recommendedProfile: string | null;
}

// Mapeamento de triggers para labels amigáveis
const triggerLabels: Record<string, string> = {
  lead_trial_signup: "Cadastro no Trial",
  lead_trial_2days_before: "2 dias antes do Trial vencer",
  lead_trial_expired: "Trial expirado",
  lead_followup_7days: "Follow-up 7 dias",
  personal_payment_2days: "Lembrete 2 dias antes",
  personal_payment_dueday: "Lembrete dia do vencimento",
  personal_payment_overdue: "Pagamento em atraso",
  personal_payment_confirmed: "Pagamento confirmado",
  personal_reengagement_30days: "Reengajamento 30 dias",
  custom: "Personalizado",
};

// Mapeamento de status para badges
const statusBadges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  sent: { label: "Enviado", variant: "default" },
  delivered: { label: "Entregue", variant: "default" },
  read: { label: "Lido", variant: "default" },
  failed: { label: "Falhou", variant: "destructive" },
};

export default function AdminWhatsappDashboard() {
  const queryClient = useQueryClient();
  
  // Estados
  const [activeTab, setActiveTab] = useState("overview");
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [automationDialogOpen, setAutomationDialogOpen] = useState(false);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [searchLeads, setSearchLeads] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [bulkMessage, setBulkMessage] = useState("");
  
  // Form states
  const [configForm, setConfigForm] = useState({
    stevoApiKey: "",
    stevoInstanceName: "",
    stevoServer: "sm15",
  });
  
  const [automationForm, setAutomationForm] = useState({
    name: "",
    description: "",
    trigger: "lead_trial_signup" as const,
    targetType: "lead" as const,
    messageTemplate: "",
    isActive: true,
    delayMinutes: 0,
    sendWindowStart: "08:00",
    sendWindowEnd: "20:00",
    sendOnWeekends: false,
    excludeExistingPersonals: true,
    excludeRecentMessages: 24,
  });
  
  // Queries
  const { data: config, isLoading: configLoading } = trpc.adminWhatsapp.getConfig.useQuery();
  
  const { data: automations, isLoading: automationsLoading } = trpc.adminWhatsapp.listAutomations.useQuery();
  
  const { data: messages, isLoading: messagesLoading } = trpc.adminWhatsapp.listMessages.useQuery({ limit: 50 });
  
  const { data: stats } = trpc.adminWhatsapp.getStats.useQuery();
  
  const { data: leads } = trpc.adminWhatsapp.listLeadsForMessaging.useQuery({ search: searchLeads, limit: 100 });
  
  // Mutations
  const saveConfigMutation = trpc.adminWhatsapp.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração salva! WhatsApp configurado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["adminWhatsapp"] });
      setConfigDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  
  const testConnectionMutation = trpc.adminWhatsapp.testConnection.useMutation({
    onSuccess: () => {
      toast.success("Conexão OK! WhatsApp conectado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["adminWhatsapp", "config"] });
    },
    onError: (error: any) => {
      toast.error(`Erro de conexão: ${error.message}`);
    },
  });
  
  const createAutomationMutation = trpc.adminWhatsapp.createAutomation.useMutation({
    onSuccess: () => {
      toast.success("Automação criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["adminWhatsapp", "automations"] });
      setAutomationDialogOpen(false);
      resetAutomationForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  
  const updateAutomationMutation = trpc.adminWhatsapp.updateAutomation.useMutation({
    onSuccess: () => {
      toast.success("Automação atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["adminWhatsapp", "automations"] });
      setAutomationDialogOpen(false);
      setSelectedAutomation(null);
      resetAutomationForm();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  
  const deleteAutomationMutation = trpc.adminWhatsapp.deleteAutomation.useMutation({
    onSuccess: () => {
      toast.success("Automação excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["adminWhatsapp", "automations"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  
  const createDefaultAutomationsMutation = trpc.adminWhatsapp.createDefaultAutomations.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.created} automações padrão criadas!`);
      queryClient.invalidateQueries({ queryKey: ["adminWhatsapp", "automations"] });
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  
  const sendBulkMessageMutation = trpc.adminWhatsapp.sendBulkToLeads.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.sent} mensagens enviadas, ${data.failed} falharam.`);
      queryClient.invalidateQueries({ queryKey: ["adminWhatsapp"] });
      setSendMessageDialogOpen(false);
      setSelectedLeads([]);
      setBulkMessage("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
  
  // Helpers
  const resetAutomationForm = () => {
    setAutomationForm({
      name: "",
      description: "",
      trigger: "lead_trial_signup" as const,
      targetType: "lead" as const,
      messageTemplate: "",
      isActive: true,
      delayMinutes: 0,
      sendWindowStart: "08:00",
      sendWindowEnd: "20:00",
      sendOnWeekends: false,
      excludeExistingPersonals: true,
      excludeRecentMessages: 24,
    });
  };
  
  const openEditAutomation = (automation: Automation) => {
    setSelectedAutomation(automation);
    setAutomationForm({
      name: automation.name,
      description: automation.description || "",
      trigger: automation.trigger as "lead_trial_signup",
      targetType: (automation.targetType || "lead") as "lead",
      messageTemplate: automation.messageTemplate,
      isActive: automation.isActive,
      delayMinutes: automation.delayMinutes ?? 0,
      sendWindowStart: automation.sendWindowStart ?? "08:00",
      sendWindowEnd: automation.sendWindowEnd ?? "20:00",
      sendOnWeekends: automation.sendOnWeekends ?? false,
      excludeExistingPersonals: automation.excludeExistingPersonals ?? true,
      excludeRecentMessages: automation.excludeRecentMessages ?? 24,
    });
    setAutomationDialogOpen(true);
  };
  
  const handleSaveAutomation = () => {
    if (selectedAutomation) {
      updateAutomationMutation.mutate({ id: selectedAutomation.id, ...automationForm });
    } else {
      createAutomationMutation.mutate(automationForm);
    }
  };
  
  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeads(prev => 
      prev.includes(leadId) 
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };
  
  const selectAllLeads = () => {
    if (leads) {
      setSelectedLeads(leads.map((l: Lead) => l.id));
    }
  };
  
  const isConnected = config?.connectionStatus === "connected";
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6 text-green-600" />
                <h1 className="text-xl font-semibold">WhatsApp Admin</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge variant="default" className="bg-green-500">
                  <Wifi className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Desconectado
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={() => setConfigDialogOpen(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">
              <BarChart3 className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="automations">
              <Zap className="h-4 w-4 mr-2" />
              Automações
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Mensagens
            </TabsTrigger>
            <TabsTrigger value="send">
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Total de Mensagens</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Mensagens Hoje</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.messagesToday || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Automações Ativas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeAutomations || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Status da Conexão</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                        <span className="text-green-600 font-medium">Conectado</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5 text-red-500" />
                        <span className="text-red-600 font-medium">Desconectado</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Status por tipo de mensagem */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Status das Mensagens</CardTitle>
                <CardDescription>Distribuição por status de entrega</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(stats?.messagesByStatus || {}).map(([status, count]) => (
                    <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">{count as number}</div>
                      <div className="text-sm text-gray-500 capitalize">{status}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Últimas mensagens */}
            <Card>
              <CardHeader>
                <CardTitle>Últimas Mensagens</CardTitle>
                <CardDescription>Mensagens enviadas recentemente</CardDescription>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.slice(0, 5).map((msg: Message) => (
                      <div key={msg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium">{msg.recipientName || msg.recipientPhone}</div>
                            <div className="text-sm text-gray-500 truncate max-w-md">{msg.message}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={msg.status ? (statusBadges[msg.status]?.variant || "secondary") : "secondary"}>
                            {msg.status ? (statusBadges[msg.status]?.label || msg.status) : "Desconhecido"}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {format(new Date(msg.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Nenhuma mensagem enviada ainda
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Automations Tab */}
          <TabsContent value="automations">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Automações de WhatsApp</h2>
                <p className="text-sm text-gray-500">Configure mensagens automáticas para leads e personals</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => createDefaultAutomationsMutation.mutate()}
                  disabled={createDefaultAutomationsMutation.isPending}
                >
                  {createDefaultAutomationsMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Criar Padrões
                </Button>
                <Button onClick={() => { resetAutomationForm(); setSelectedAutomation(null); setAutomationDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Automação
                </Button>
              </div>
            </div>
            
            {automationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : automations && automations.length > 0 ? (
              <div className="grid gap-4">
                {automations.map((automation: Automation) => (
                  <Card key={automation.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${automation.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                            <Zap className={`h-6 w-6 ${automation.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{automation.name}</h3>
                              <Badge variant={automation.isActive ? "default" : "secondary"}>
                                {automation.isActive ? "Ativa" : "Inativa"}
                              </Badge>
                              <Badge variant="outline">
                                {automation.targetType === "lead" ? "Leads" : automation.targetType === "personal" ? "Personals" : "Ambos"}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">
                              {triggerLabels[automation.trigger] || automation.trigger}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right text-sm">
                            <div className="text-gray-500">Enviadas: <span className="font-medium text-gray-900">{automation.totalSent}</span></div>
                            <div className="text-gray-500">Lidas: <span className="font-medium text-gray-900">{automation.totalRead}</span></div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditAutomation(automation)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-500 hover:text-red-600"
                              onClick={() => deleteAutomationMutation.mutate({ id: automation.id })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma automação configurada</h3>
                  <p className="text-gray-500 mb-4">Crie automações para enviar mensagens automáticas</p>
                  <Button onClick={() => createDefaultAutomationsMutation.mutate()}>
                    <Zap className="h-4 w-4 mr-2" />
                    Criar Automações Padrão
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Mensagens</CardTitle>
                <CardDescription>Todas as mensagens enviadas pelo sistema</CardDescription>
              </CardHeader>
              <CardContent>
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : messages && messages.length > 0 ? (
                  <div className="space-y-3">
                    {messages.map((msg: Message) => (
                      <div key={msg.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{msg.recipientName || "Sem nome"}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-500">{msg.recipientPhone}</span>
                            <Badge variant={msg.status ? (statusBadges[msg.status]?.variant || "secondary") : "secondary"} className="ml-auto">
                              {msg.status ? (statusBadges[msg.status]?.label || msg.status) : "Desconhecido"}
                            </Badge>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(msg.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {msg.recipientType === "lead" ? "Lead" : "Personal"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p>Nenhuma mensagem enviada ainda</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Send Tab */}
          <TabsContent value="send">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lista de Leads */}
              <Card>
                <CardHeader>
                  <CardTitle>Selecionar Leads</CardTitle>
                  <CardDescription>Escolha os leads para enviar mensagem</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Buscar por nome, email ou telefone..." 
                        className="pl-10"
                        value={searchLeads}
                        onChange={(e) => setSearchLeads(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" onClick={selectAllLeads}>
                      Selecionar Todos
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg max-h-96 overflow-y-auto">
                    {leads && leads.length > 0 ? (
                      leads.map((lead: Lead) => (
                        <div 
                          key={lead.id} 
                          className={`flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${selectedLeads.includes(lead.id) ? 'bg-green-50' : ''}`}
                          onClick={() => toggleLeadSelection(lead.id)}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedLeads.includes(lead.id)}
                            onChange={() => {}}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{lead.name || "Sem nome"}</div>
                            <div className="text-sm text-gray-500 truncate">{lead.phone}</div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {lead.recommendedProfile || "N/A"}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        Nenhum lead encontrado
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    {selectedLeads.length} lead(s) selecionado(s)
                  </div>
                </CardContent>
              </Card>
              
              {/* Formulário de Mensagem */}
              <Card>
                <CardHeader>
                  <CardTitle>Compor Mensagem</CardTitle>
                  <CardDescription>Escreva a mensagem para enviar aos leads selecionados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>Mensagem</Label>
                      <Textarea 
                        placeholder="Digite sua mensagem aqui...

Use {{nome}} para personalizar com o nome do lead."
                        className="min-h-[200px] mt-2"
                        value={bulkMessage}
                        onChange={(e) => setBulkMessage(e.target.value)}
                      />
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Variáveis disponíveis:</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="cursor-pointer" onClick={() => setBulkMessage(prev => prev + "{{nome}}")}>
                          {"{{nome}}"}
                        </Badge>
                        <Badge variant="outline" className="cursor-pointer" onClick={() => setBulkMessage(prev => prev + "{{email}}")}>
                          {"{{email}}"}
                        </Badge>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      size="lg"
                      disabled={selectedLeads.length === 0 || !bulkMessage.trim() || sendBulkMessageMutation.isPending || !isConnected}
                      onClick={() => sendBulkMessageMutation.mutate({ leadIds: selectedLeads, message: bulkMessage })}
                    >
                      {sendBulkMessageMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar para {selectedLeads.length} lead(s)
                        </>
                      )}
                    </Button>
                    
                    {!isConnected && (
                      <p className="text-sm text-red-500 text-center">
                        Configure o WhatsApp antes de enviar mensagens
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Config Dialog */}
      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar WhatsApp</DialogTitle>
            <DialogDescription>
              Configure as credenciais da Stevo API para conectar o WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>API Key (Token)</Label>
              <Input 
                placeholder="Seu token da Stevo"
                value={configForm.stevoApiKey}
                onChange={(e) => setConfigForm(prev => ({ ...prev, stevoApiKey: e.target.value }))}
              />
            </div>
            <div>
              <Label>Instance Name (ID)</Label>
              <Input 
                placeholder="Nome da instância"
                value={configForm.stevoInstanceName}
                onChange={(e) => setConfigForm(prev => ({ ...prev, stevoInstanceName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Servidor</Label>
              <Select 
                value={configForm.stevoServer} 
                onValueChange={(value) => setConfigForm(prev => ({ ...prev, stevoServer: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sm12">SM12</SelectItem>
                  <SelectItem value="sm15">SM15</SelectItem>
                  <SelectItem value="sm16">SM16</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => saveConfigMutation.mutate(configForm)}
              disabled={saveConfigMutation.isPending}
            >
              {saveConfigMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Automation Dialog */}
      <Dialog open={automationDialogOpen} onOpenChange={setAutomationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedAutomation ? "Editar Automação" : "Nova Automação"}</DialogTitle>
            <DialogDescription>
              Configure uma automação de mensagens WhatsApp
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <Input 
                  placeholder="Nome da automação"
                  value={automationForm.name}
                  onChange={(e) => setAutomationForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Gatilho</Label>
                <Select 
                  value={automationForm.trigger} 
                  onValueChange={(value) => setAutomationForm(prev => ({ ...prev, trigger: value as typeof prev.trigger }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Descrição</Label>
              <Input 
                placeholder="Descrição da automação"
                value={automationForm.description}
                onChange={(e) => setAutomationForm(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div>
              <Label>Tipo de Destinatário</Label>
              <Select 
                value={automationForm.targetType} 
                onValueChange={(value) => setAutomationForm(prev => ({ ...prev, targetType: value as typeof prev.targetType }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Leads</SelectItem>
                  <SelectItem value="personal">Personals</SelectItem>
                  <SelectItem value="both">Ambos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Template da Mensagem</Label>
              <Textarea 
                placeholder="Digite a mensagem...

Use {{nome}}, {{email}} para personalizar."
                className="min-h-[150px]"
                value={automationForm.messageTemplate}
                onChange={(e) => setAutomationForm(prev => ({ ...prev, messageTemplate: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Delay (minutos)</Label>
                <Input 
                  type="number"
                  value={automationForm.delayMinutes}
                  onChange={(e) => setAutomationForm(prev => ({ ...prev, delayMinutes: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <Label>Horário Início</Label>
                <Input 
                  type="time"
                  value={automationForm.sendWindowStart}
                  onChange={(e) => setAutomationForm(prev => ({ ...prev, sendWindowStart: e.target.value }))}
                />
              </div>
              <div>
                <Label>Horário Fim</Label>
                <Input 
                  type="time"
                  value={automationForm.sendWindowEnd}
                  onChange={(e) => setAutomationForm(prev => ({ ...prev, sendWindowEnd: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch 
                  checked={automationForm.isActive}
                  onCheckedChange={(checked) => setAutomationForm(prev => ({ ...prev, isActive: checked }))}
                />
                <Label>Automação ativa</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={automationForm.sendOnWeekends}
                  onCheckedChange={(checked) => setAutomationForm(prev => ({ ...prev, sendOnWeekends: checked }))}
                />
                <Label>Enviar nos finais de semana</Label>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch 
                checked={automationForm.excludeExistingPersonals}
                onCheckedChange={(checked) => setAutomationForm(prev => ({ ...prev, excludeExistingPersonals: checked }))}
              />
              <Label>Não enviar para quem já é personal</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAutomationDialogOpen(false); setSelectedAutomation(null); }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveAutomation}
              disabled={createAutomationMutation.isPending || updateAutomationMutation.isPending}
            >
              {(createAutomationMutation.isPending || updateAutomationMutation.isPending) ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {selectedAutomation ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
