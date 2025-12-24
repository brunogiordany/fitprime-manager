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
  AlertCircle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
      case 'birthday':
        return 'Aniversário';
      case 'inactive_student':
        return 'Aluno Inativo';
      case 'welcome':
        return 'Boas-vindas';
      default:
        return trigger;
    }
  };

  const getTriggerBadge = (trigger: string) => {
    switch (trigger) {
      case 'session_reminder':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Sessão</Badge>;
      case 'payment_reminder':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pagamento</Badge>;
      case 'birthday':
        return <Badge className="bg-pink-100 text-pink-700 hover:bg-pink-100">Aniversário</Badge>;
      case 'inactive_student':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Inatividade</Badge>;
      case 'welcome':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Boas-vindas</Badge>;
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
                    <SelectItem value="payment_reminder">Lembrete de Pagamento</SelectItem>
                    <SelectItem value="birthday">Aniversário</SelectItem>
                    <SelectItem value="inactive_student">Aluno Inativo</SelectItem>
                    <SelectItem value="welcome">Boas-vindas</SelectItem>
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
      </div>
    </DashboardLayout>
  );
}
