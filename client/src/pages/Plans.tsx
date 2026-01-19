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
  Package,
  Calculator,
  ArrowRightLeft,
  Copy,
  Sparkles,
  Send
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

type BillingCycle = "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannual" | "annual";
type PlanType = "recurring" | "fixed" | "sessions";

// Função para calcular número de sessões no período baseado no ciclo
const getSessionsInPeriod = (sessionsPerWeek: number, billingCycle: BillingCycle): number => {
  const weeksInCycle: Record<BillingCycle, number> = {
    weekly: 1,
    biweekly: 2,
    monthly: 4,
    quarterly: 12,
    semiannual: 24,
    annual: 48,
  };
  return sessionsPerWeek * weeksInCycle[billingCycle];
};

// Função para calcular meses no ciclo
const getMonthsInCycle = (billingCycle: BillingCycle): number => {
  const monthsInCycle: Record<BillingCycle, number> = {
    weekly: 0.25,
    biweekly: 0.5,
    monthly: 1,
    quarterly: 3,
    semiannual: 6,
    annual: 12,
  };
  return monthsInCycle[billingCycle];
};

export default function Plans() {
  const [, setLocation] = useLocation();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [calcMode, setCalcMode] = useState<'total' | 'session'>('total'); // Modo de cálculo
  
  const [newPlan, setNewPlan] = useState({
    name: "",
    description: "",
    type: "recurring" as PlanType,
    billingCycle: "monthly" as BillingCycle,
    durationMonths: "",
    totalSessions: "",
    price: "", // Preço total do plano
    pricePerSession: "", // Preço por sessão
    sessionsPerWeek: "3",
    sessionDuration: "60",
    billingDay: "5", // Dia de vencimento
  });

  const utils = trpc.useUtils();

  const { data: plans, isLoading } = trpc.plans.list.useQuery();

  // Planos pré-definidos para facilitar a criação
  const presetPlans = [
    { name: "Mensal 2x/semana", type: "recurring" as PlanType, billingCycle: "monthly" as BillingCycle, sessionsPerWeek: "2", sessionDuration: "60", price: "400" },
    { name: "Mensal 3x/semana", type: "recurring" as PlanType, billingCycle: "monthly" as BillingCycle, sessionsPerWeek: "3", sessionDuration: "60", price: "550" },
    { name: "Mensal 4x/semana", type: "recurring" as PlanType, billingCycle: "monthly" as BillingCycle, sessionsPerWeek: "4", sessionDuration: "60", price: "700" },
    { name: "Mensal 5x/semana", type: "recurring" as PlanType, billingCycle: "monthly" as BillingCycle, sessionsPerWeek: "5", sessionDuration: "60", price: "850" },
    { name: "Trimestral 3x/semana", type: "recurring" as PlanType, billingCycle: "quarterly" as BillingCycle, sessionsPerWeek: "3", sessionDuration: "60", price: "1500" },
    { name: "Semestral 3x/semana", type: "recurring" as PlanType, billingCycle: "semiannual" as BillingCycle, sessionsPerWeek: "3", sessionDuration: "60", price: "2800" },
    { name: "Anual 3x/semana", type: "recurring" as PlanType, billingCycle: "annual" as BillingCycle, sessionsPerWeek: "3", sessionDuration: "60", price: "5000" },
    { name: "Pacote 10 Sessões", type: "sessions" as PlanType, billingCycle: "monthly" as BillingCycle, sessionsPerWeek: "2", sessionDuration: "60", totalSessions: "10", price: "600" },
    { name: "Pacote 20 Sessões", type: "sessions" as PlanType, billingCycle: "monthly" as BillingCycle, sessionsPerWeek: "2", sessionDuration: "60", totalSessions: "20", price: "1100" },
  ];

  const handleUsePreset = (preset: typeof presetPlans[0]) => {
    setNewPlan({
      name: preset.name,
      description: "",
      type: preset.type,
      billingCycle: preset.billingCycle,
      durationMonths: "",
      totalSessions: preset.totalSessions || "",
      price: preset.price,
      pricePerSession: "",
      sessionsPerWeek: preset.sessionsPerWeek,
      sessionDuration: preset.sessionDuration,
      billingDay: "5",
    });
    setEditingPlan(null);
    setIsNewDialogOpen(true);
  };

  const handleDuplicatePlan = (plan: any) => {
    setNewPlan({
      name: `${plan.name} (Cópia)`,
      description: plan.description || "",
      type: plan.type,
      billingCycle: plan.billingCycle || "monthly",
      durationMonths: plan.durationMonths?.toString() || "",
      totalSessions: plan.totalSessions?.toString() || "",
      price: plan.price,
      pricePerSession: "",
      sessionsPerWeek: plan.sessionsPerWeek?.toString() || "3",
      sessionDuration: plan.sessionDuration?.toString() || "60",
      billingDay: "5",
    });
    setEditingPlan(null);
    setIsNewDialogOpen(true);
    toast.info("Plano duplicado! Edite as informações e salve.");
  };

  // Cálculo automático bidirecional
  useEffect(() => {
    const sessionsPerWeek = parseInt(newPlan.sessionsPerWeek) || 0;
    const billingCycle = newPlan.billingCycle;
    
    if (sessionsPerWeek > 0 && newPlan.type === 'recurring') {
      const sessionsInPeriod = getSessionsInPeriod(sessionsPerWeek, billingCycle);
      
      if (calcMode === 'session' && newPlan.pricePerSession) {
        // Calcular preço total a partir do preço por sessão
        const pricePerSession = parseFloat(newPlan.pricePerSession) || 0;
        const totalPrice = (pricePerSession * sessionsInPeriod).toFixed(2);
        if (newPlan.price !== totalPrice) {
          setNewPlan(prev => ({ ...prev, price: totalPrice }));
        }
      } else if (calcMode === 'total' && newPlan.price) {
        // Calcular preço por sessão a partir do preço total
        const totalPrice = parseFloat(newPlan.price) || 0;
        const pricePerSession = sessionsInPeriod > 0 ? (totalPrice / sessionsInPeriod).toFixed(2) : "0";
        if (newPlan.pricePerSession !== pricePerSession) {
          setNewPlan(prev => ({ ...prev, pricePerSession }));
        }
      }
    }
  }, [newPlan.price, newPlan.pricePerSession, newPlan.sessionsPerWeek, newPlan.billingCycle, calcMode, newPlan.type]);

  // Informações calculadas para exibição
  const calculatedInfo = useMemo(() => {
    const sessionsPerWeek = parseInt(newPlan.sessionsPerWeek) || 0;
    const billingCycle = newPlan.billingCycle;
    const price = parseFloat(newPlan.price) || 0;
    
    if (sessionsPerWeek > 0 && newPlan.type === 'recurring') {
      const sessionsInPeriod = getSessionsInPeriod(sessionsPerWeek, billingCycle);
      const pricePerSession = sessionsInPeriod > 0 ? price / sessionsInPeriod : 0;
      const monthsInCycle = getMonthsInCycle(billingCycle);
      const monthlyValue = monthsInCycle > 0 ? price / monthsInCycle : 0;
      
      return {
        sessionsInPeriod,
        pricePerSession,
        monthlyValue,
      };
    }
    return null;
  }, [newPlan.price, newPlan.sessionsPerWeek, newPlan.billingCycle, newPlan.type]);

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
      pricePerSession: "",
      sessionsPerWeek: "3",
      sessionDuration: "60",
      billingDay: "5",
    });
    setCalcMode('total');
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
      pricePerSession: "",
      sessionsPerWeek: plan.sessionsPerWeek?.toString() || "3",
      sessionDuration: plan.sessionDuration?.toString() || "60",
      billingDay: "5",
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
    const cycles: Record<string, string> = {
      weekly: 'Semanal',
      biweekly: 'Quinzenal',
      monthly: 'Mensal',
      quarterly: 'Trimestral',
      semiannual: 'Semestral',
      annual: 'Anual',
    };
    return cycles[cycle] || cycle;
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
          <Button 
            onClick={() => { resetForm(); setEditingPlan(null); setIsNewDialogOpen(true); }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        {/* Planos Pré-definidos */}
        {(!plans || plans.length === 0) && (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Planos Sugeridos
              </CardTitle>
              <CardDescription>
                Clique em um plano para usá-lo como base. Você pode editar os valores depois.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {presetPlans.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleUsePreset(preset)}
                    className="p-4 text-left border rounded-lg hover:border-primary hover:bg-accent/50 transition-colors"
                  >
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {preset.sessionsPerWeek}x/semana • {preset.sessionDuration}min
                    </p>
                    <p className="text-lg font-bold text-primary mt-1">
                      {formatCurrency(preset.price)}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                        <DropdownMenuItem onClick={() => handleDuplicatePlan(plan)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setLocation(`/cobrancas?planId=${plan.id}&planName=${encodeURIComponent(plan.name)}&planPrice=${plan.price}`)}>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar Cobrança
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
                      {/* Calcular e mostrar valor por sessão */}
                      {plan.type === 'recurring' && plan.sessionsPerWeek && plan.billingCycle && (
                        <p className="text-emerald-600 font-medium">
                          ≈ {formatCurrency(
                            parseFloat(plan.price) / getSessionsInPeriod(plan.sessionsPerWeek, plan.billingCycle as BillingCycle)
                          )}/sessão
                        </p>
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
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
                    onValueChange={(value: PlanType) => 
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
                
                {newPlan.type === 'recurring' && (
                  <div className="grid gap-2">
                    <Label>Ciclo de Cobrança</Label>
                    <Select
                      value={newPlan.billingCycle}
                      onValueChange={(value: BillingCycle) => 
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
                        <SelectItem value="quarterly">Trimestral (3 meses)</SelectItem>
                        <SelectItem value="semiannual">Semestral (6 meses)</SelectItem>
                        <SelectItem value="annual">Anual (12 meses)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

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
                      <SelectItem value="1">1 mês</SelectItem>
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
                      <SelectItem value="6">6x por semana</SelectItem>
                      <SelectItem value="7">7x por semana</SelectItem>
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
                      <SelectItem value="120">120 minutos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dia de Vencimento */}
              <div className="grid gap-2">
                <Label>Dia de Vencimento</Label>
                <Select
                  value={newPlan.billingDay}
                  onValueChange={(value) => setNewPlan({ ...newPlan, billingDay: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o dia" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        Dia {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Dia do mês em que a cobrança será gerada
                </p>
              </div>

              {/* Seção de Preços com Cálculo Automático */}
              {newPlan.type === 'recurring' && (
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Calculadora de Preços
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Preencha um valor e o outro será calculado automaticamente
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Toggle de modo */}
                    <div className="flex items-center justify-between p-2 bg-background rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${calcMode === 'session' ? 'font-medium' : 'text-muted-foreground'}`}>
                          Valor por Sessão
                        </span>
                        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                        <span className={`text-sm ${calcMode === 'total' ? 'font-medium' : 'text-muted-foreground'}`}>
                          Valor Total
                        </span>
                      </div>
                      <Switch
                        checked={calcMode === 'total'}
                        onCheckedChange={(checked) => setCalcMode(checked ? 'total' : 'session')}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className={calcMode === 'session' ? 'font-medium text-primary' : ''}>
                          Valor por Sessão {calcMode === 'session' && '*'}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className={`pl-10 ${calcMode === 'session' ? 'border-primary' : 'bg-muted'}`}
                            value={newPlan.pricePerSession}
                            onChange={(e) => {
                              setCalcMode('session');
                              setNewPlan({ ...newPlan, pricePerSession: e.target.value });
                            }}
                            disabled={calcMode === 'total'}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label className={calcMode === 'total' ? 'font-medium text-primary' : ''}>
                          Valor Total do Plano {calcMode === 'total' && '*'}
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            className={`pl-10 ${calcMode === 'total' ? 'border-primary' : 'bg-muted'}`}
                            value={newPlan.price}
                            onChange={(e) => {
                              setCalcMode('total');
                              setNewPlan({ ...newPlan, price: e.target.value });
                            }}
                            disabled={calcMode === 'session'}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Resumo do cálculo */}
                    {calculatedInfo && (
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">
                          Resumo do Plano:
                        </p>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Sessões no período</p>
                            <p className="font-medium">{calculatedInfo.sessionsInPeriod}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valor/sessão</p>
                            <p className="font-medium">{formatCurrency(calculatedInfo.pricePerSession)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Valor mensal equiv.</p>
                            <p className="font-medium">{formatCurrency(calculatedInfo.monthlyValue)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Preço simples para outros tipos */}
              {newPlan.type !== 'recurring' && (
                <div className="grid gap-2">
                  <Label>Preço *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      className="pl-10"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={editingPlan ? handleUpdatePlan : handleCreatePlan}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                {createMutation.isPending || updateMutation.isPending 
                  ? 'Salvando...' 
                  : editingPlan ? 'Atualizar Plano' : 'Criar Plano'
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
