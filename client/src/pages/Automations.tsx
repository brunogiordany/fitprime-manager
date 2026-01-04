import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  MessageSquare,
  Edit,
  Trash2,
  MoreHorizontal,
  Clock,
  Zap,
  AlertCircle,
  Send,
  Users,
  Loader2
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Automations() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingAutomation, setEditingAutomation] = useState<any>(null);
  const [newAutomation, setNewAutomation] = useState({
    name: "",
    trigger: "session_reminder" as string,
    messageTemplate: "",
    sendBefore: "24",
    isActive: true,
    windowStart: "08:00",
    windowEnd: "20:00",
    maxPerDay: "5",
  });

  const utils = trpc.useUtils();

  const { data: automations, isLoading } = trpc.automations.list.useQuery();

  const createMutation = trpc.automations.create.useMutation({
    onSuccess: () => {
      toast.success("Automação criada com sucesso!");
      setIsNewDialogOpen(false);
      resetForm();
      utils.automations.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao criar automação: " + error.message);
    },
  });

  const updateMutation = trpc.automations.update.useMutation({
    onSuccess: () => {
      toast.success("Automação atualizada!");
      setEditingAutomation(null);
      resetForm();
      utils.automations.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = trpc.automations.delete.useMutation({
    onSuccess: () => {
      toast.success("Automação removida!");
      utils.automations.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  const triggerManualMutation = trpc.automations.triggerManual.useMutation({
    onSuccess: (result) => {
      if (result.sent > 0) {
        toast.success(`Mensagens enviadas: ${result.sent} sucesso, ${result.failed} falhas`);
      } else {
        toast.error("Nenhuma mensagem foi enviada");
      }
      if (result.errors.length > 0) {
        console.error("Erros:", result.errors);
      }
    },
    onError: (error) => {
      toast.error("Erro ao disparar: " + error.message);
    },
  });

  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(true);

  // Buscar alunos elegíveis (ativos, com telefone e opt-in)
  const { data: eligibleStudents } = trpc.students.list.useQuery();
  const filteredStudents = useMemo(() => 
    eligibleStudents?.filter(
      (s: any) => s.phone && s.whatsappOptIn && s.status === 'active'
    ) || [],
    [eligibleStudents]
  );

  // Quando abre o modal, seleciona todos por padrão
  useEffect(() => {
    if (sendDialogOpen && filteredStudents.length > 0 && selectAll) {
      setSelectedStudents(filteredStudents.map((s: any) => s.id));
    }
  }, [sendDialogOpen, filteredStudents.length, selectAll]);

  const resetForm = () => {
    setNewAutomation({
      name: "",
      trigger: "session_reminder",
      messageTemplate: "",
      sendBefore: "24",
      isActive: true,
      windowStart: "08:00",
      windowEnd: "20:00",
      maxPerDay: "5",
    });
  };

  const handleCreateAutomation = () => {
    if (!newAutomation.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!newAutomation.messageTemplate.trim()) {
      toast.error("Mensagem é obrigatória");
      return;
    }
    createMutation.mutate({
      name: newAutomation.name,
      trigger: newAutomation.trigger as "session_reminder" | "session_confirmation" | "payment_reminder" | "payment_overdue" | "birthday" | "inactive_student" | "welcome" | "custom",
      messageTemplate: newAutomation.messageTemplate,
      triggerHoursBefore: parseInt(newAutomation.sendBefore),
      sendWindowStart: newAutomation.windowStart,
      sendWindowEnd: newAutomation.windowEnd,
      maxMessagesPerDay: parseInt(newAutomation.maxPerDay),
    });
  };

  const handleUpdateAutomation = () => {
    if (!editingAutomation) return;
    updateMutation.mutate({
      id: editingAutomation.id,
      name: newAutomation.name,
      messageTemplate: newAutomation.messageTemplate,
      isActive: newAutomation.isActive,
      triggerHoursBefore: parseInt(newAutomation.sendBefore),
      sendWindowStart: newAutomation.windowStart,
      sendWindowEnd: newAutomation.windowEnd,
      maxMessagesPerDay: parseInt(newAutomation.maxPerDay),
    });
  };

  const handleToggleActive = (automation: any) => {
    updateMutation.mutate({
      id: automation.id,
      isActive: !automation.isActive,
    });
  };

  const handleEditAutomation = (automation: any) => {
    setEditingAutomation(automation);
    setNewAutomation({
      name: automation.name,
      trigger: automation.trigger,
      messageTemplate: automation.messageTemplate,
      sendBefore: automation.triggerHoursBefore?.toString() || "24",
      isActive: automation.isActive,
      windowStart: automation.sendWindowStart || "08:00",
      windowEnd: automation.sendWindowEnd || "20:00",
      maxPerDay: automation.maxMessagesPerDay?.toString() || "5",
    });
    setIsNewDialogOpen(true);
  };

  const handleDeleteAutomation = (automationId: number) => {
    if (confirm('Tem certeza que deseja remover esta automação?')) {
      deleteMutation.mutate({ id: automationId });
    }
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'session_reminder':
        return 'Lembrete de Sessão';
      case 'payment_reminder':
        return 'Lembrete de Pagamento';
      case 'payment_reminder_2days':
        return 'Lembrete 2 dias antes';
      case 'payment_reminder_dueday':
        return 'Lembrete no vencimento';
      case 'payment_overdue':
        return 'Pagamento em atraso';
      case 'birthday':
        return 'Aniversário';
      case 'inactive_student':
        return 'Aluno Inativo';
      case 'welcome':
        return 'Boas-vindas';
      case 'mothers_day':
        return 'Dia das Mães';
      case 'fathers_day':
        return 'Dia dos Pais';
      case 'christmas':
        return 'Natal';
      case 'new_year':
        return 'Ano Novo';
      case 'womens_day':
        return 'Dia da Mulher';
      case 'mens_day':
        return 'Dia do Homem';
      case 'customer_day':
        return 'Dia do Cliente';
      case 'reengagement_30days':
        return 'Reengajamento 30 dias';
      default:
        return trigger;
    }
  };

  const getTriggerBadge = (trigger: string) => {
    switch (trigger) {
      case 'session_reminder':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Sessão</Badge>;
      case 'payment_reminder':
      case 'payment_reminder_2days':
      case 'payment_reminder_dueday':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pagamento</Badge>;
      case 'payment_overdue':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">payment_overdue</Badge>;
      case 'birthday':
        return <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">Aniversário</Badge>;
      case 'inactive_student':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Inatividade</Badge>;
      case 'welcome':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Boas-vindas</Badge>;
      case 'mothers_day':
        return <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">Dia das Mães</Badge>;
      case 'fathers_day':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Dia dos Pais</Badge>;
      case 'christmas':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Natal</Badge>;
      case 'new_year':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Ano Novo</Badge>;
      case 'womens_day':
        return <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">Dia da Mulher</Badge>;
      case 'mens_day':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Dia do Homem</Badge>;
      case 'customer_day':
        return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Dia do Cliente</Badge>;
      case 'reengagement_30days':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Reengajamento</Badge>;
      default:
        return <Badge variant="outline">{trigger}</Badge>;
    }
  };

  const getMessagePlaceholders = (trigger: string) => {
    switch (trigger) {
      case 'session_reminder':
        return '{nome}, {data}, {hora}, {local}';
      case 'payment_reminder':
        return '{nome}, {valor}, {vencimento}';
      case 'birthday':
        return '{nome}';
      case 'inactive_student':
        return '{nome}, {dias_inativo}';
      case 'welcome':
        return '{nome}';
      case 'reengagement_30days':
        return '{nome}, {dias_inativo}, {ultima_sessao}';
      default:
        return '{nome}';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Automações</h1>
            <p className="text-muted-foreground">
              Configure mensagens automáticas via WhatsApp
            </p>
          </div>
          <Button onClick={() => { resetForm(); setEditingAutomation(null); setIsNewDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Automação
          </Button>
        </div>

        {/* Info Card */}
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-blue-900">Integração com Stevo (WhatsApp)</p>
                <p className="text-sm text-blue-700">
                  As automações utilizam o <a href="https://stevo.chat" target="_blank" rel="noopener noreferrer" className="underline font-medium">Stevo</a> para envio de mensagens WhatsApp. 
                  Configure suas credenciais nas Configurações para ativar o envio automático.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Automations List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : automations && automations.length > 0 ? (
          <div className="space-y-4">
            {automations.map((automation) => (
              <Card key={automation.id} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                        automation.isActive 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Zap className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{automation.name}</h3>
                          {getTriggerBadge(automation.trigger)}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {automation.messageTemplate}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {automation.triggerHoursBefore}h antes
                          </span>
                          <span>
                            Janela: {automation.sendWindowStart} - {automation.sendWindowEnd}
                          </span>
                          <span>
                            Máx: {automation.maxMessagesPerDay}/dia
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={automation.isActive}
                          onCheckedChange={() => handleToggleActive(automation)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {automation.isActive ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedAutomation(automation);
                              setSendDialogOpen(true);
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Agora
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditAutomation(automation)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteAutomation(automation.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">Nenhuma automação configurada</p>
              <p className="text-muted-foreground mb-4">
                Crie automações para enviar mensagens automáticas aos seus alunos
              </p>
              <Button onClick={() => setIsNewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Automação
              </Button>
            </CardContent>
          </Card>
        )}

        {/* New/Edit Automation Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={(open) => {
          setIsNewDialogOpen(open);
          if (!open) {
            setEditingAutomation(null);
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingAutomation ? 'Editar Automação' : 'Nova Automação'}</DialogTitle>
              <DialogDescription>
                {editingAutomation ? 'Atualize as configurações da automação.' : 'Configure uma nova automação de mensagens.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Lembrete de Treino"
                  value={newAutomation.name}
                  onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
                />
              </div>
              
              <div className="grid gap-2">
                <Label>Gatilho *</Label>
                <Select
                  value={newAutomation.trigger}
                  onValueChange={(value) => setNewAutomation({ ...newAutomation, trigger: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session_reminder">Lembrete de Sessão</SelectItem>
                    <SelectItem value="payment_reminder">Lembrete de Pagamento (3 dias)</SelectItem>
                    <SelectItem value="payment_reminder_2days">Lembrete de Pagamento (2 dias)</SelectItem>
                    <SelectItem value="payment_reminder_dueday">Lembrete no Vencimento</SelectItem>
                    <SelectItem value="payment_overdue">Pagamento em Atraso</SelectItem>
                    <SelectItem value="birthday">Aniversário</SelectItem>
                    <SelectItem value="inactive_student">Aluno Inativo</SelectItem>
                    <SelectItem value="welcome">Boas-vindas</SelectItem>
                    <SelectItem value="mothers_day">Dia das Mães</SelectItem>
                    <SelectItem value="fathers_day">Dia dos Pais</SelectItem>
                    <SelectItem value="christmas">Natal</SelectItem>
                    <SelectItem value="new_year">Ano Novo</SelectItem>
                    <SelectItem value="womens_day">Dia da Mulher</SelectItem>
                    <SelectItem value="mens_day">Dia do Homem</SelectItem>
                    <SelectItem value="customer_day">Dia do Cliente</SelectItem>
                    <SelectItem value="reengagement_30days">Reengajamento 30 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Mensagem *</Label>
                <Textarea
                  placeholder="Digite a mensagem..."
                  value={newAutomation.messageTemplate}
                  onChange={(e) => setNewAutomation({ ...newAutomation, messageTemplate: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis disponíveis: {getMessagePlaceholders(newAutomation.trigger)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Enviar com antecedência (horas)</Label>
                  <Select
                    value={newAutomation.sendBefore}
                    onValueChange={(value) => setNewAutomation({ ...newAutomation, sendBefore: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hora</SelectItem>
                      <SelectItem value="2">2 horas</SelectItem>
                      <SelectItem value="6">6 horas</SelectItem>
                      <SelectItem value="12">12 horas</SelectItem>
                      <SelectItem value="24">24 horas</SelectItem>
                      <SelectItem value="48">48 horas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Máximo por dia/aluno</Label>
                  <Select
                    value={newAutomation.maxPerDay}
                    onValueChange={(value) => setNewAutomation({ ...newAutomation, maxPerDay: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 mensagem</SelectItem>
                      <SelectItem value="2">2 mensagens</SelectItem>
                      <SelectItem value="3">3 mensagens</SelectItem>
                      <SelectItem value="5">5 mensagens</SelectItem>
                      <SelectItem value="10">10 mensagens</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Janela de Envio - Início</Label>
                  <Input
                    type="time"
                    value={newAutomation.windowStart}
                    onChange={(e) => setNewAutomation({ ...newAutomation, windowStart: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Janela de Envio - Fim</Label>
                  <Input
                    type="time"
                    value={newAutomation.windowEnd}
                    onChange={(e) => setNewAutomation({ ...newAutomation, windowEnd: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={newAutomation.isActive}
                  onCheckedChange={(checked) => setNewAutomation({ ...newAutomation, isActive: checked })}
                />
                <Label>Automação ativa</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={editingAutomation ? handleUpdateAutomation : handleCreateAutomation} 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? "Salvando..." 
                  : editingAutomation ? "Atualizar" : "Criar Automação"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send Automation Dialog */}
        <Dialog open={sendDialogOpen} onOpenChange={(open) => {
          setSendDialogOpen(open);
          if (!open) {
            setSelectedStudents([]);
            setSelectAll(true);
          }
        }}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Enviar Automação Manualmente</DialogTitle>
              <DialogDescription>
                Dispare a automação "{selectedAutomation?.name}" para os alunos selecionados.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
              {/* Seleção de Alunos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Selecionar Alunos</span>
                    <Badge variant="secondary">{selectedStudents.length} de {filteredStudents.length}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedStudents.length === filteredStudents.length) {
                        setSelectedStudents([]);
                        setSelectAll(false);
                      } else {
                        setSelectedStudents(filteredStudents.map((s: any) => s.id));
                        setSelectAll(true);
                      }
                    }}
                  >
                    {selectedStudents.length === filteredStudents.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </Button>
                </div>
                
                {filteredStudents.length === 0 ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-yellow-700">
                      Nenhum aluno elegível encontrado. Verifique se seus alunos possuem telefone cadastrado e opt-in de WhatsApp ativado.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[200px] border rounded-lg">
                    <div className="p-2 space-y-1">
                      {filteredStudents.map((student: any) => (
                        <div 
                          key={student.id} 
                          className="flex items-center gap-3 p-2 rounded hover:bg-accent cursor-pointer"
                          onClick={() => {
                            if (selectedStudents.includes(student.id)) {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                              setSelectAll(false);
                            } else {
                              setSelectedStudents([...selectedStudents, student.id]);
                            }
                          }}
                        >
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStudents([...selectedStudents, student.id]);
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                                setSelectAll(false);
                              }
                            }}
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                              {student.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{student.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{student.phone}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
              
              {/* Prévia da Mensagem */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium mb-2">Prévia da mensagem:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedAutomation?.messageTemplate}
                </p>
              </div>
            </div>
            <DialogFooter className="border-t pt-4">
              <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (selectedAutomation && selectedStudents.length > 0) {
                    // Enviar para alunos selecionados
                    selectedStudents.forEach(studentId => {
                      triggerManualMutation.mutate({ 
                        automationId: selectedAutomation.id,
                        studentId 
                      });
                    });
                    setSendDialogOpen(false);
                  }
                }}
                disabled={triggerManualMutation.isPending || selectedStudents.length === 0}
              >
                {triggerManualMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar para {selectedStudents.length} aluno{selectedStudents.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
