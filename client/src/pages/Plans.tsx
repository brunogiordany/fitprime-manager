import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  FileText,
  Edit,
  Trash2,
  MoreHorizontal,
  Package
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Plans() {
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    type: "recurring" as "recurring" | "fixed" | "sessions",
    billingCycle: "monthly" as "weekly" | "biweekly" | "monthly",
    durationMonths: "",
    totalSessions: "",
    price: "",
    sessionsPerWeek: "",
    sessionDuration: "60",
  });

  const utils = trpc.useUtils();

  const { data: plans, isLoading } = trpc.plans.list.useQuery();

  const createMutation = trpc.plans.create.useMutation({
    onSuccess: () => {
      toast.success("Plano criado com sucesso!");
      setIsNewDialogOpen(false);
      resetForm();
      utils.plans.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao criar plano: " + error.message);
    },
  });

  const updateMutation = trpc.plans.update.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado!");
      setEditingPlan(null);
      resetForm();
      utils.plans.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = trpc.plans.delete.useMutation({
    onSuccess: () => {
      toast.success("Plano removido!");
      utils.plans.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao remover: " + error.message);
    },
  });

  const resetForm = () => {
    setNewPlan({
      name: "",
      description: "",
      type: "recurring",
      billingCycle: "monthly",
      durationMonths: "",
      totalSessions: "",
      price: "",
      sessionsPerWeek: "",
      sessionDuration: "60",
    });
  };

  const handleCreatePlan = () => {
    if (!newPlan.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    if (!newPlan.price || parseFloat(newPlan.price) <= 0) {
      toast.error("Informe um preço válido");
      return;
    }
    createMutation.mutate({
      name: newPlan.name,
      description: newPlan.description || undefined,
      type: newPlan.type,
      billingCycle: newPlan.type === 'recurring' ? newPlan.billingCycle : undefined,
      durationMonths: newPlan.durationMonths ? parseInt(newPlan.durationMonths) : undefined,
      totalSessions: newPlan.totalSessions ? parseInt(newPlan.totalSessions) : undefined,
      price: newPlan.price,
      sessionsPerWeek: newPlan.sessionsPerWeek ? parseInt(newPlan.sessionsPerWeek) : undefined,
      sessionDuration: newPlan.sessionDuration ? parseInt(newPlan.sessionDuration) : undefined,
    });
  };

  const handleUpdatePlan = () => {
    if (!editingPlan) return;
    updateMutation.mutate({
      id: editingPlan.id,
      name: newPlan.name,
      description: newPlan.description || undefined,
      type: newPlan.type,
      billingCycle: newPlan.type === 'recurring' ? newPlan.billingCycle : undefined,
      durationMonths: newPlan.durationMonths ? parseInt(newPlan.durationMonths) : undefined,
      totalSessions: newPlan.totalSessions ? parseInt(newPlan.totalSessions) : undefined,
      price: newPlan.price,
      sessionsPerWeek: newPlan.sessionsPerWeek ? parseInt(newPlan.sessionsPerWeek) : undefined,
      sessionDuration: newPlan.sessionDuration ? parseInt(newPlan.sessionDuration) : undefined,
    });
  };

  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setNewPlan({
      name: plan.name,
      description: plan.description || "",
      type: plan.type,
      billingCycle: plan.billingCycle || "monthly",
      durationMonths: plan.durationMonths?.toString() || "",
      totalSessions: plan.totalSessions?.toString() || "",
      price: plan.price,
      sessionsPerWeek: plan.sessionsPerWeek?.toString() || "",
      sessionDuration: plan.sessionDuration?.toString() || "60",
    });
    setIsNewDialogOpen(true);
  };

  const handleDeletePlan = (planId: number) => {
    if (confirm('Tem certeza que deseja remover este plano?')) {
      deleteMutation.mutate({ id: planId });
    }
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'recurring':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Recorrente</Badge>;
      case 'fixed':
        return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Período Fixo</Badge>;
      case 'sessions':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Pacote de Sessões</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getBillingCycleText = (cycle: string) => {
    switch (cycle) {
      case 'weekly':
        return 'Semanal';
      case 'biweekly':
        return 'Quinzenal';
      case 'monthly':
        return 'Mensal';
      default:
        return cycle;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Planos e Pacotes</h1>
            <p className="text-muted-foreground">
              Configure os planos e pacotes oferecidos aos alunos
            </p>
          </div>
          <Button onClick={() => { resetForm(); setEditingPlan(null); setIsNewDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        {/* Plans Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="card-hover">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {plan.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditPlan(plan)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        {formatCurrency(plan.price)}
                      </span>
                      {getTypeBadge(plan.type)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      {plan.type === 'recurring' && plan.billingCycle && (
                        <p>Cobrança: {getBillingCycleText(plan.billingCycle)}</p>
                      )}
                      {plan.type === 'fixed' && plan.durationMonths && (
                        <p>Duração: {plan.durationMonths} meses</p>
                      )}
                      {plan.type === 'sessions' && plan.totalSessions && (
                        <p>Sessões: {plan.totalSessions}</p>
                      )}
                      {plan.sessionsPerWeek && (
                        <p>{plan.sessionsPerWeek}x por semana</p>
                      )}
                      {plan.sessionDuration && (
                        <p>Sessões de {plan.sessionDuration} min</p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Badge variant={plan.isActive ? "default" : "secondary"}>
                        {plan.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">Nenhum plano cadastrado</p>
              <p className="text-muted-foreground mb-4">
                Crie planos para oferecer aos seus alunos
              </p>
              <Button onClick={() => setIsNewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Plano
              </Button>
            </CardContent>
          </Card>
        )}

        {/* New/Edit Plan Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={(open) => {
          setIsNewDialogOpen(open);
          if (!open) {
            setEditingPlan(null);
            resetForm();
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
              <DialogDescription>
                {editingPlan ? 'Atualize as informações do plano.' : 'Configure um novo plano para seus alunos.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome *</Label>
                <Input
                  placeholder="Ex: Plano Mensal Premium"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva o que está incluso no plano..."
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={newPlan.type}
                    onValueChange={(value: "recurring" | "fixed" | "sessions") => 
                      setNewPlan({ ...newPlan, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recurring">Recorrente</SelectItem>
                      <SelectItem value="fixed">Período Fixo</SelectItem>
                      <SelectItem value="sessions">Pacote de Sessões</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Preço *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                  />
                </div>
              </div>

              {newPlan.type === 'recurring' && (
                <div className="grid gap-2">
                  <Label>Ciclo de Cobrança</Label>
                  <Select
                    value={newPlan.billingCycle}
                    onValueChange={(value: "weekly" | "biweekly" | "monthly") => 
                      setNewPlan({ ...newPlan, billingCycle: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newPlan.type === 'fixed' && (
                <div className="grid gap-2">
                  <Label>Duração (meses)</Label>
                  <Select
                    value={newPlan.durationMonths}
                    onValueChange={(value) => setNewPlan({ ...newPlan, durationMonths: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 meses</SelectItem>
                      <SelectItem value="6">6 meses</SelectItem>
                      <SelectItem value="12">12 meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {newPlan.type === 'sessions' && (
                <div className="grid gap-2">
                  <Label>Total de Sessões</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 10"
                    value={newPlan.totalSessions}
                    onChange={(e) => setNewPlan({ ...newPlan, totalSessions: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Sessões por Semana</Label>
                  <Select
                    value={newPlan.sessionsPerWeek}
                    onValueChange={(value) => setNewPlan({ ...newPlan, sessionsPerWeek: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1x por semana</SelectItem>
                      <SelectItem value="2">2x por semana</SelectItem>
                      <SelectItem value="3">3x por semana</SelectItem>
                      <SelectItem value="4">4x por semana</SelectItem>
                      <SelectItem value="5">5x por semana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Duração da Sessão</Label>
                  <Select
                    value={newPlan.sessionDuration}
                    onValueChange={(value) => setNewPlan({ ...newPlan, sessionDuration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 minutos</SelectItem>
                      <SelectItem value="45">45 minutos</SelectItem>
                      <SelectItem value="60">60 minutos</SelectItem>
                      <SelectItem value="90">90 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={editingPlan ? handleUpdatePlan : handleCreatePlan} 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? "Salvando..." 
                  : editingPlan ? "Atualizar" : "Criar Plano"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
