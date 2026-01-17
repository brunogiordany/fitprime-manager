import { useState } from "react";

import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
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
  TrendingUp
} from "lucide-react";

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
  
  // Queries - usando tRPC hooks
  const { data: sequences, refetch: refetchSequences } = trpc.leadEmail.listSequences.useQuery();
  
  const { data: templates, refetch: refetchTemplates } = trpc.leadEmail.listTemplates.useQuery(
    { sequenceId: selectedSequence?.id || 0 },
    { enabled: !!selectedSequence }
  );
  
  const { data: metrics } = trpc.leadEmail.getEmailMetrics.useQuery({});
  
  const { data: sends, refetch: refetchSends } = trpc.leadEmail.listSends.useQuery({ page: 1, limit: 50, status: "all" });
  
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
    <DashboardLayout>
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
            <TabsTrigger value="history">Histórico de Envios</TabsTrigger>
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
        </Tabs>
        
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
    </DashboardLayout>
  );
}
