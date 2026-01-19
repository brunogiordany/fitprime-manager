import { useState } from "react";

import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Eye, 
  Send, 
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Users,
  MousePointer,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  RefreshCw,
  Loader2
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";

// Tipos
interface EmailSequence {
  id: number;
  name: string;
  description: string | null;
  trigger: string;
  triggerDays: number | null;
  isActive: boolean;
  priority: number | null;
  templateCount?: number;
  totalSends?: number;
}

interface EmailTemplate {
  id: number;
  sequenceId: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  delayDays: number;
  delayHours: number;
  position: number;
  isActive: boolean;
}

interface EmailSend {
  id: number;
  leadEmail: string;
  subject: string;
  status: string;
  scheduledAt: Date | string;
  sentAt: Date | string | null;
  sequenceName: string | null;
  templateName: string | null;
  opens?: number;
  clicks?: number;
}

export default function EmailAutomationPage() {
  // toast is imported from sonner
  const [activeTab, setActiveTab] = useState("sequences");
  const [selectedSequence, setSelectedSequence] = useState<EmailSequence | null>(null);
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [editingSequence, setEditingSequence] = useState<EmailSequence | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [trendsPeriod, setTrendsPeriod] = useState(30); // Período em dias para gráficos
  const [trendsSequenceId, setTrendsSequenceId] = useState<number | undefined>(undefined); // Filtro por campanha
  const [trendsTemplateId, setTrendsTemplateId] = useState<number | undefined>(undefined); // Filtro por tipo de email
  const [viewEmailId, setViewEmailId] = useState<number | null>(null); // ID do email para visualizar
  const [resendingEmailId, setResendingEmailId] = useState<number | null>(null); // ID do email sendo reenviado
  
  // Estados para Duplicados e Relatório
  const [reportPeriod, setReportPeriod] = useState("30days"); // today, 7days, 15days, 30days, 90days, custom
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [isDeletingDuplicates, setIsDeletingDuplicates] = useState(false);
  
  // Queries - usando tRPC hooks
  const { data: sequences, refetch: refetchSequences } = trpc.leadEmail.listSequences.useQuery();
  
  // Query para duplicados
  const { data: duplicates, refetch: refetchDuplicates } = trpc.leadEmail.listDuplicateEmails.useQuery({ page: 1, limit: 50 });
  
  // Query para relatório por período
  const { data: emailReport } = trpc.leadEmail.getEmailReportByPeriod.useQuery({ 
    period: reportPeriod as any,
    startDate: reportPeriod === 'custom' ? reportStartDate : undefined,
    endDate: reportPeriod === 'custom' ? reportEndDate : undefined,
  });
  
  // Mutation para deletar duplicados
  const deleteDuplicatesMutation = trpc.leadEmail.deleteDuplicateEmails.useMutation();
  
  const { data: templates, refetch: refetchTemplates } = trpc.leadEmail.listTemplates.useQuery(
    { sequenceId: selectedSequence?.id || 0 },
    { enabled: !!selectedSequence }
  );
  
  // Templates para o filtro de tendências (baseado na sequência selecionada no filtro)
  const { data: trendsTemplates } = trpc.leadEmail.listTemplates.useQuery(
    { sequenceId: trendsSequenceId || 0 },
    { enabled: !!trendsSequenceId }
  );
  
  const { data: metrics } = trpc.leadEmail.getEmailMetrics.useQuery({});
  
  const { data: sends, refetch: refetchSends } = trpc.leadEmail.listSends.useQuery({ page: 1, limit: 50, status: "all" });
  
  const { data: trends } = trpc.leadEmail.getEmailTrends.useQuery({ 
    days: trendsPeriod,
    sequenceId: trendsSequenceId,
    templateId: trendsTemplateId,
  });
  
  // Query para detalhes do email (visualização)
  const { data: emailDetails, isLoading: isLoadingEmailDetails } = trpc.leadEmail.getEmailSendDetails.useQuery(
    { sendId: viewEmailId! },
    { enabled: !!viewEmailId }
  );
  
  // Mutations
  const createSequenceMutation = trpc.leadEmail.createSequence.useMutation({
    onSuccess: () => {
      toast.success("Sequência criada com sucesso!");
      refetchSequences();
      setIsSequenceDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao criar sequência: " + error.message);
    },
  });
  
  const updateSequenceMutation = trpc.leadEmail.updateSequence.useMutation({
    onSuccess: () => {
      toast.success("Sequência atualizada!");
      refetchSequences();
      setIsSequenceDialogOpen(false);
      setEditingSequence(null);
    },
  });
  
  const deleteSequenceMutation = trpc.leadEmail.deleteSequence.useMutation({
    onSuccess: () => {
      toast.success("Sequência excluída!");
      refetchSequences();
      if (selectedSequence) setSelectedSequence(null);
    },
  });
  
  const resendEmailMutation = trpc.leadEmail.resendEmail.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || "Email reenviado com sucesso!");
      refetchSends();
      setResendingEmailId(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao reenviar email: " + error.message);
      setResendingEmailId(null);
    },
  });
  
  // Função para reenviar email
  const handleResendEmail = (sendId: number) => {
    if (confirm("Tem certeza que deseja reenviar este email?")) {
      setResendingEmailId(sendId);
      resendEmailMutation.mutate({ sendId });
    }
  };
  
  const createTemplateMutation = trpc.leadEmail.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template criado com sucesso!");
      refetchTemplates();
      setIsTemplateDialogOpen(false);
    },
  });
  
  const updateTemplateMutation = trpc.leadEmail.updateTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template atualizado!");
      refetchTemplates();
      setIsTemplateDialogOpen(false);
      setEditingTemplate(null);
    },
  });
  
  const deleteTemplateMutation = trpc.leadEmail.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template excluído!");
      refetchTemplates();
    },
  });
  
  const createDefaultsMutation = trpc.leadEmail.createDefaultSequences.useMutation({
    onSuccess: () => {
      toast.success("Sequências padrão criadas!");
      refetchSequences();
    },
  });
  
  // Helpers
  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      quiz_completed: "Quiz Completado",
      quiz_qualified: "Lead Qualificado",
      quiz_disqualified: "Lead Desqualificado",
      days_without_conversion: "Dias sem Conversão",
      manual: "Manual",
    };
    return labels[trigger] || trigger;
  };
  
  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "Pendente", variant: "secondary" },
      sent: { label: "Enviado", variant: "default" },
      failed: { label: "Falhou", variant: "destructive" },
      bounced: { label: "Retornou", variant: "destructive" },
      cancelled: { label: "Cancelado", variant: "outline" },
    };
    const { label, variant } = config[status] || { label: status, variant: "secondary" as const };
    return <Badge variant={variant}>{label}</Badge>;
  };
  
  return (
    <AdminLayout 
      title="Automação de Emails" 
      description="Gerencie sequências de emails automáticos para leads"
      activeTab="email-automation"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="h-6 w-6 text-green-600" />
              Automação de Emails
            </h1>
            <p className="text-muted-foreground">
              Gerencie sequências de emails automáticos para leads
            </p>
          </div>
          <Button onClick={() => createDefaultsMutation.mutate()} variant="outline">
            <Zap className="h-4 w-4 mr-2" />
            Criar Sequências Padrão
          </Button>
        </div>
        
        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Enviados</p>
                  <p className="text-2xl font-bold">{metrics?.sentCount || 0}</p>
                </div>
                <Send className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Abertura</p>
                  <p className="text-2xl font-bold">{metrics?.openRate || 0}%</p>
                </div>
                <Eye className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Clique</p>
                  <p className="text-2xl font-bold">{metrics?.clickRate || 0}%</p>
                </div>
                <MousePointer className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold">{metrics?.pendingCount || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="sequences">Sequências</TabsTrigger>
            <TabsTrigger value="trends">Tendências</TabsTrigger>
            <TabsTrigger value="history">Histórico de Envios</TabsTrigger>
            <TabsTrigger value="duplicates">Duplicados</TabsTrigger>
            <TabsTrigger value="report">Relatório</TabsTrigger>
          </TabsList>
          
          {/* Sequências */}
          <TabsContent value="sequences" className="space-y-4">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Lista de Sequências */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Sequências</h3>
                  <Button size="sm" onClick={() => { setEditingSequence(null); setIsSequenceDialogOpen(true); }}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nova
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {sequences?.map((seq: EmailSequence) => (
                    <Card 
                      key={seq.id} 
                      className={`cursor-pointer transition-colors ${selectedSequence?.id === seq.id ? 'border-green-500 bg-green-50' : 'hover:border-gray-300'}`}
                      onClick={() => setSelectedSequence(seq)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{seq.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              {getTriggerLabel(seq.trigger)}
                              {(seq.triggerDays ?? 0) > 0 && ` (${seq.triggerDays} dias)`}
                            </p>
                          </div>
                          <Switch checked={seq.isActive} />
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{seq.templateCount || 0} emails</Badge>
                          <Badge variant="secondary">{seq.totalSends || 0} envios</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {(!sequences || sequences.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma sequência criada</p>
                      <Button 
                        variant="link" 
                        onClick={() => createDefaultsMutation.mutate()}
                        className="mt-2"
                      >
                        Criar sequências padrão
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Templates da Sequência Selecionada */}
              <div className="md:col-span-2 space-y-4">
                {selectedSequence ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{selectedSequence.name}</h3>
                        <p className="text-sm text-muted-foreground">{selectedSequence.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => { setEditingSequence(selectedSequence); setIsSequenceDialogOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => deleteSequenceMutation.mutate({ id: selectedSequence.id })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => { setEditingTemplate(null); setIsTemplateDialogOpen(true); }}>
                          <Plus className="h-4 w-4 mr-1" />
                          Novo Email
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {templates?.map((template: EmailTemplate, index: number) => (
                        <Card key={template.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <h4 className="font-medium">{template.name}</h4>
                                  <p className="text-sm text-muted-foreground">{template.subject}</p>
                                  <div className="flex gap-2 mt-2">
                                    {(template.delayDays > 0 || template.delayHours > 0) && (
                                      <Badge variant="outline">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {template.delayDays > 0 && `${template.delayDays}d`}
                                        {template.delayHours > 0 && ` ${template.delayHours}h`}
                                      </Badge>
                                    )}
                                    {index === 0 && <Badge>Imediato</Badge>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setPreviewTemplate(template)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => { setEditingTemplate(template); setIsTemplateDialogOpen(true); }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-red-500"
                                  onClick={() => deleteTemplateMutation.mutate({ id: template.id })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {(!templates || templates.length === 0) && (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                          <p>Nenhum email nesta sequência</p>
                          <Button 
                            variant="link" 
                            onClick={() => { setEditingTemplate(null); setIsTemplateDialogOpen(true); }}
                          >
                            Adicionar primeiro email
                          </Button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-muted-foreground">
                    <div className="text-center">
                      <Mail className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Selecione uma sequência para ver os emails</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Tendências */}
          <TabsContent value="trends" className="space-y-6">
            {/* Filtros */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center gap-4">
                  {/* Seletor de Período */}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Período:</span>
                    <div className="flex gap-1">
                      <Button 
                        variant={trendsPeriod === 7 ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setTrendsPeriod(7)}
                      >
                        7 dias
                      </Button>
                      <Button 
                        variant={trendsPeriod === 30 ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setTrendsPeriod(30)}
                      >
                        30 dias
                      </Button>
                      <Button 
                        variant={trendsPeriod === 90 ? "default" : "outline"} 
                        size="sm"
                        onClick={() => setTrendsPeriod(90)}
                      >
                        90 dias
                      </Button>
                    </div>
                  </div>
                  
                  {/* Separador */}
                  <div className="h-8 w-px bg-border" />
                  
                  {/* Filtro por Campanha */}
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Campanha:</span>
                    <Select 
                      value={trendsSequenceId?.toString() || "all"} 
                      onValueChange={(value) => {
                        setTrendsSequenceId(value === "all" ? undefined : parseInt(value));
                        setTrendsTemplateId(undefined); // Limpar template ao mudar campanha
                      }}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todas as campanhas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as campanhas</SelectItem>
                        {sequences?.map((seq: EmailSequence) => (
                          <SelectItem key={seq.id} value={seq.id.toString()}>
                            {seq.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Filtro por Tipo de Email (só aparece se campanha selecionada) */}
                  {trendsSequenceId && (
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Tipo:</span>
                      <Select 
                        value={trendsTemplateId?.toString() || "all"} 
                        onValueChange={(value) => setTrendsTemplateId(value === "all" ? undefined : parseInt(value))}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os tipos</SelectItem>
                          {trendsTemplates?.map((tmpl: EmailTemplate) => (
                            <SelectItem key={tmpl.id} value={tmpl.id.toString()}>
                              {tmpl.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Botão Limpar Filtros */}
                  {(trendsSequenceId || trendsTemplateId) && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setTrendsSequenceId(undefined);
                        setTrendsTemplateId(undefined);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Limpar filtros
                    </Button>
                  )}
                </div>
                
                {/* Indicador de filtros ativos */}
                {(trendsSequenceId || trendsTemplateId) && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Filtros ativos:</span>
                    {trendsSequenceId && (
                      <Badge variant="secondary">
                        Campanha: {sequences?.find((s: EmailSequence) => s.id === trendsSequenceId)?.name}
                      </Badge>
                    )}
                    {trendsTemplateId && (
                      <Badge variant="secondary">
                        Tipo: {trendsTemplates?.find((t: EmailTemplate) => t.id === trendsTemplateId)?.name}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Cards de Resumo do Período */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Enviados</p>
                  <p className="text-xl font-bold">{trends?.summary?.totalSent || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Aberturas</p>
                  <p className="text-xl font-bold text-blue-600">{trends?.summary?.totalOpens || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Cliques</p>
                  <p className="text-xl font-bold text-purple-600">{trends?.summary?.totalClicks || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Taxa Abertura</p>
                  <p className="text-xl font-bold text-blue-600">{trends?.summary?.openRate || 0}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">Taxa Clique</p>
                  <p className="text-xl font-bold text-purple-600">{trends?.summary?.clickRate || 0}%</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Gráfico de Envios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emails Enviados</CardTitle>
                <CardDescription>Volume de envios por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends?.trends || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('pt-BR');
                        }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="sent" 
                        name="Enviados"
                        stroke="#22c55e" 
                        fill="#22c55e" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Gráfico de Aberturas e Cliques */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Engajamento</CardTitle>
                <CardDescription>Aberturas e cliques por dia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trends?.trends || []}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => {
                          const date = new Date(value);
                          return date.toLocaleDateString('pt-BR');
                        }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="opens" 
                        name="Aberturas"
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="clicks" 
                        name="Cliques"
                        stroke="#a855f7" 
                        strokeWidth={2}
                        dot={{ fill: '#a855f7', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {(!trends?.trends || trends.trends.length === 0) && (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum dado disponível para o período selecionado</p>
              </div>
            )}
          </TabsContent>
          
          {/* Histórico de Envios */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Envios</CardTitle>
                <CardDescription>Últimos emails enviados para leads</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Assunto</TableHead>
                      <TableHead>Sequência</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Aberturas</TableHead>
                      <TableHead className="text-center">Cliques</TableHead>
                      <TableHead>Agendado</TableHead>
                      <TableHead>Enviado</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sends?.sends?.map((send: EmailSend) => (
                      <TableRow key={send.id}>
                        <TableCell className="font-medium">{send.leadEmail}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{send.subject}</TableCell>
                        <TableCell>{send.sequenceName || "-"}</TableCell>
                        <TableCell>{getStatusBadge(send.status)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Eye className="h-3 w-3 text-blue-500" />
                            <span className={send.opens && send.opens > 0 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
                              {send.opens || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <MousePointer className="h-3 w-3 text-purple-500" />
                            <span className={send.clicks && send.clicks > 0 ? "text-purple-600 font-medium" : "text-muted-foreground"}>
                              {send.clicks || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(send.scheduledAt).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>
                          {send.sentAt ? new Date(send.sentAt).toLocaleString("pt-BR") : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewEmailId(send.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleResendEmail(send.id)}
                                disabled={resendingEmailId === send.id}
                              >
                                {resendingEmailId === send.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                )}
                                Reenviar email
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    
                    {(!sends?.sends || sends.sends.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          Nenhum email enviado ainda
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aba de Duplicados */}
          <TabsContent value="duplicates">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-500" />
                      Emails Duplicados
                    </CardTitle>
                    <CardDescription>
                      Gerencie emails que foram enviados mais de uma vez para o mesmo destinatário
                    </CardDescription>
                  </div>
                  <Button 
                    variant="destructive"
                    disabled={isDeletingDuplicates}
                    onClick={async () => {
                      if (confirm("Tem certeza que deseja deletar TODOS os emails duplicados? Esta ação não pode ser desfeita.")) {
                        setIsDeletingDuplicates(true);
                        try {
                          const result = await deleteDuplicatesMutation.mutateAsync({ deleteAll: true });
                          toast.success(result.message);
                          refetchDuplicates();
                        } catch (error: any) {
                          toast.error("Erro ao deletar duplicados: " + error.message);
                        } finally {
                          setIsDeletingDuplicates(false);
                        }
                      }
                    }}
                  >
                    {isDeletingDuplicates ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Deletando...</>
                    ) : (
                      <><Trash2 className="h-4 w-4 mr-2" />Deletar Todos Duplicados</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Resumo */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-orange-600">{duplicates?.total || 0}</div>
                      <p className="text-sm text-muted-foreground">Grupos com duplicados</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-red-600">{duplicates?.totalDuplicates || 0}</div>
                      <p className="text-sm text-muted-foreground">Emails duplicados</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-2xl font-bold text-green-600">
                        {duplicates?.totalDuplicates ? `R$ ${((duplicates.totalDuplicates * 0.001) || 0).toFixed(2)}` : "R$ 0.00"}
                      </div>
                      <p className="text-sm text-muted-foreground">Custo evitável (estimado)</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Tabela de Duplicados */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Template</TableHead>
                      <TableHead>Sequência</TableHead>
                      <TableHead className="text-center">Envios</TableHead>
                      <TableHead>Primeiro Envio</TableHead>
                      <TableHead>Último Envio</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {duplicates?.duplicates?.map((dup: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{dup.leadEmail}</TableCell>
                        <TableCell>{dup.templateName || "-"}</TableCell>
                        <TableCell>{dup.sequenceName || "-"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive">{dup.sendCount}x</Badge>
                        </TableCell>
                        <TableCell>{new Date(dup.firstSent).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>{new Date(dup.lastSent).toLocaleString("pt-BR")}</TableCell>
                        <TableCell className="text-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={async () => {
                              if (confirm(`Deletar ${dup.sendCount - 1} email(s) duplicado(s) para ${dup.leadEmail}?`)) {
                                try {
                                  const result = await deleteDuplicatesMutation.mutateAsync({ 
                                    leadEmail: dup.leadEmail, 
                                    templateId: dup.templateId 
                                  });
                                  toast.success(result.message);
                                  refetchDuplicates();
                                } catch (error: any) {
                                  toast.error("Erro: " + error.message);
                                }
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!duplicates?.duplicates || duplicates.duplicates.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                          <p>Nenhum email duplicado encontrado!</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Aba de Relatório */}
          <TabsContent value="report">
            <div className="space-y-6">
              {/* Filtros de Período */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <CardTitle>Relatório de Emails</CardTitle>
                      <CardDescription>Análise detalhada de envios por período</CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={reportPeriod} onValueChange={setReportPeriod}>
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Período" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Hoje</SelectItem>
                          <SelectItem value="7days">Últimos 7 dias</SelectItem>
                          <SelectItem value="15days">Últimos 15 dias</SelectItem>
                          <SelectItem value="30days">Últimos 30 dias</SelectItem>
                          <SelectItem value="90days">Últimos 90 dias</SelectItem>
                          <SelectItem value="custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                      {reportPeriod === 'custom' && (
                        <>
                          <Input 
                            type="date" 
                            value={reportStartDate}
                            onChange={(e) => setReportStartDate(e.target.value)}
                            className="w-[140px]"
                          />
                          <span className="text-gray-500">até</span>
                          <Input 
                            type="date" 
                            value={reportEndDate}
                            onChange={(e) => setReportEndDate(e.target.value)}
                            className="w-[140px]"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>
              
              {/* Cards de Métricas */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-blue-600">{emailReport?.summary?.sent || 0}</div>
                    <p className="text-sm text-muted-foreground">Enviados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{emailReport?.rates?.openRate?.toFixed(1) || 0}%</div>
                    <p className="text-sm text-muted-foreground">Taxa de Abertura</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-purple-600">{emailReport?.rates?.clickRate?.toFixed(1) || 0}%</div>
                    <p className="text-sm text-muted-foreground">Taxa de Clique</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-emerald-600">{emailReport?.rates?.deliveryRate?.toFixed(1) || 0}%</div>
                    <p className="text-sm text-muted-foreground">Taxa de Entrega</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-red-600">{emailReport?.rates?.bounceRate?.toFixed(1) || 0}%</div>
                    <p className="text-sm text-muted-foreground">Taxa de Bounce</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Gráfico por Dia */}
              <Card>
                <CardHeader>
                  <CardTitle>Envios por Dia</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={emailReport?.byDay || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="sent" name="Enviados" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="opens" name="Aberturas" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="clicks" name="Cliques" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Desempenho por Sequência */}
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho por Sequência</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sequência</TableHead>
                        <TableHead className="text-center">Enviados</TableHead>
                        <TableHead className="text-center">Aberturas</TableHead>
                        <TableHead className="text-center">Cliques</TableHead>
                        <TableHead className="text-center">Taxa Abertura</TableHead>
                        <TableHead className="text-center">Taxa Clique</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emailReport?.bySequence?.map((seq: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{seq.name}</TableCell>
                          <TableCell className="text-center">{seq.sent}</TableCell>
                          <TableCell className="text-center">{seq.opens}</TableCell>
                          <TableCell className="text-center">{seq.clicks}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={seq.openRate > 20 ? "default" : "secondary"}>
                              {seq.openRate?.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={seq.clickRate > 5 ? "default" : "secondary"}>
                              {seq.clickRate?.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!emailReport?.bySequence || emailReport.bySequence.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            Nenhum dado disponível para o período selecionado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Dialog: Visualizar Email Enviado */}
        <Dialog open={!!viewEmailId} onOpenChange={(open) => !open && setViewEmailId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Detalhes do Email Enviado
              </DialogTitle>
              <DialogDescription>
                Visualize o conteúdo e métricas do email
              </DialogDescription>
            </DialogHeader>
            
            {isLoadingEmailDetails ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : emailDetails ? (
              <div className="space-y-6">
                {/* Informações do Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Destinatário</Label>
                    <p className="font-medium">{emailDetails.leadEmail}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p>{getStatusBadge(emailDetails.status)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Campanha</Label>
                    <p className="font-medium">{emailDetails.sequenceName || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Template</Label>
                    <p className="font-medium">{emailDetails.templateName || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Agendado para</Label>
                    <p>{emailDetails.scheduledAt ? new Date(emailDetails.scheduledAt).toLocaleString("pt-BR") : "-"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Enviado em</Label>
                    <p>{emailDetails.sentAt ? new Date(emailDetails.sentAt).toLocaleString("pt-BR") : "-"}</p>
                  </div>
                </div>
                
                {/* Métricas de Engajamento */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Aberturas</p>
                          <p className="text-2xl font-bold text-blue-600">{emailDetails.opens}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <MousePointer className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Cliques</p>
                          <p className="text-2xl font-bold text-purple-600">{emailDetails.clicks}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Assunto */}
                <div>
                  <Label className="text-muted-foreground">Assunto</Label>
                  <p className="font-medium text-lg mt-1">{emailDetails.subject}</p>
                </div>
                
                {/* Conteúdo do Email */}
                <div>
                  <Label className="text-muted-foreground">Conteúdo do Email</Label>
                  <div className="mt-2 border rounded-lg overflow-hidden">
                    {emailDetails.htmlContent ? (
                      <iframe
                        srcDoc={emailDetails.htmlContent}
                        className="w-full h-[400px] bg-white"
                        title="Email Preview"
                        sandbox="allow-same-origin"
                      />
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        Conteúdo não disponível para este email
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Histórico de Eventos */}
                {emailDetails.trackingEvents && emailDetails.trackingEvents.length > 0 && (
                  <div>
                    <Label className="text-muted-foreground">Histórico de Eventos</Label>
                    <div className="mt-2 space-y-2">
                      {emailDetails.trackingEvents.map((event: any) => (
                        <div key={event.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg text-sm">
                          {event.eventType === "open" ? (
                            <Eye className="h-4 w-4 text-blue-500" />
                          ) : event.eventType === "click" ? (
                            <MousePointer className="h-4 w-4 text-purple-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-medium">
                            {event.eventType === "open" ? "Abriu o email" : 
                             event.eventType === "click" ? "Clicou em link" : "Descadastrou"}
                          </span>
                          {event.linkUrl && (
                            <span className="text-muted-foreground truncate max-w-[200px]" title={event.linkUrl}>
                              {event.linkUrl}
                            </span>
                          )}
                          <span className="ml-auto text-muted-foreground">
                            {new Date(event.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Erro (se houver) */}
                {emailDetails.errorMessage && (
                  <div>
                    <Label className="text-red-500">Erro no Envio</Label>
                    <p className="mt-1 p-2 bg-red-50 text-red-700 rounded-lg text-sm">
                      {emailDetails.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Email não encontrado
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewEmailId(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Dialog: Criar/Editar Sequência */}
        <Dialog open={isSequenceDialogOpen} onOpenChange={setIsSequenceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSequence ? "Editar Sequência" : "Nova Sequência"}</DialogTitle>
              <DialogDescription>
                Configure quando os emails serão disparados automaticamente
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                name: formData.get("name") as string,
                description: formData.get("description") as string,
                trigger: formData.get("trigger") as "quiz_completed" | "quiz_qualified" | "quiz_disqualified" | "days_without_conversion" | "manual",
                triggerDays: parseInt(formData.get("triggerDays") as string) || 0,
                isActive: true,
                priority: parseInt(formData.get("priority") as string) || 0,
              };
              
              if (editingSequence) {
                updateSequenceMutation.mutate({ id: editingSequence.id, ...data });
              } else {
                createSequenceMutation.mutate(data);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Sequência</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    defaultValue={editingSequence?.name || ""} 
                    placeholder="Ex: Boas-vindas"
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea 
                    id="description" 
                    name="description" 
                    defaultValue={editingSequence?.description || ""} 
                    placeholder="Descreva o objetivo desta sequência"
                  />
                </div>
                
                <div>
                  <Label htmlFor="trigger">Gatilho</Label>
                  <Select name="trigger" defaultValue={editingSequence?.trigger || "quiz_completed"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quiz_completed">Quiz Completado</SelectItem>
                      <SelectItem value="quiz_qualified">Lead Qualificado</SelectItem>
                      <SelectItem value="quiz_disqualified">Lead Desqualificado</SelectItem>
                      <SelectItem value="days_without_conversion">Dias sem Conversão</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="triggerDays">Dias após gatilho (para follow-up)</Label>
                  <Input 
                    id="triggerDays" 
                    name="triggerDays" 
                    type="number" 
                    defaultValue={editingSequence?.triggerDays || 0} 
                    min={0}
                  />
                </div>
                
                <div>
                  <Label htmlFor="priority">Prioridade (maior = primeiro)</Label>
                  <Input 
                    id="priority" 
                    name="priority" 
                    type="number" 
                    defaultValue={editingSequence?.priority || 0} 
                  />
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsSequenceDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSequence ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Dialog: Criar/Editar Template */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTemplate ? "Editar Email" : "Novo Email"}</DialogTitle>
              <DialogDescription>
                Configure o conteúdo do email. Use variáveis como {"{{leadName}}"}, {"{{leadEmail}}"}, {"{{recommendedPlan}}"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const data = {
                sequenceId: selectedSequence!.id,
                name: formData.get("name") as string,
                subject: formData.get("subject") as string,
                htmlContent: formData.get("htmlContent") as string,
                delayDays: parseInt(formData.get("delayDays") as string) || 0,
                delayHours: parseInt(formData.get("delayHours") as string) || 0,
                position: parseInt(formData.get("position") as string) || 0,
                isActive: true,
              };
              
              if (editingTemplate) {
                updateTemplateMutation.mutate({ id: editingTemplate.id, ...data });
              } else {
                createTemplateMutation.mutate(data);
              }
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Nome do Email</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      defaultValue={editingTemplate?.name || ""} 
                      placeholder="Ex: Email de Boas-vindas"
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Posição na Sequência</Label>
                    <Input 
                      id="position" 
                      name="position" 
                      type="number" 
                      defaultValue={editingTemplate?.position || (templates?.length || 0) + 1} 
                      min={1}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="subject">Assunto do Email</Label>
                  <Input 
                    id="subject" 
                    name="subject" 
                    defaultValue={editingTemplate?.subject || ""} 
                    placeholder="Ex: {{leadName}}, bem-vindo ao FitPrime!"
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="delayDays">Delay (dias)</Label>
                    <Input 
                      id="delayDays" 
                      name="delayDays" 
                      type="number" 
                      defaultValue={editingTemplate?.delayDays || 0} 
                      min={0}
                    />
                  </div>
                  <div>
                    <Label htmlFor="delayHours">Delay (horas)</Label>
                    <Input 
                      id="delayHours" 
                      name="delayHours" 
                      type="number" 
                      defaultValue={editingTemplate?.delayHours || 0} 
                      min={0}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="htmlContent">Conteúdo HTML</Label>
                  <Textarea 
                    id="htmlContent" 
                    name="htmlContent" 
                    defaultValue={editingTemplate?.htmlContent || ""} 
                    placeholder="Cole o HTML do email aqui..."
                    className="min-h-[300px] font-mono text-sm"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Variáveis disponíveis: {"{{leadName}}"}, {"{{leadEmail}}"}, {"{{recommendedPlan}}"}, {"{{studentsCount}}"}, {"{{revenue}}"}, {"{{unsubscribeUrl}}"}
                  </p>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingTemplate ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        {/* Dialog: Preview Template */}
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview: {previewTemplate?.name}</DialogTitle>
              <DialogDescription>
                Assunto: {previewTemplate?.subject}
              </DialogDescription>
            </DialogHeader>
            
            <div className="border rounded-lg p-4 bg-white">
              <div 
                dangerouslySetInnerHTML={{ __html: previewTemplate?.htmlContent || "" }}
                className="prose max-w-none"
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
