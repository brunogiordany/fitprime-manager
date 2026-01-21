import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  Search,
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  MoreHorizontal,
  Percent,
  Calendar,
  RefreshCw,
  Trash2,
  ListChecks,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation, useSearch } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Charges() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const urlParams = new URLSearchParams(searchParams);
  const showNewDialog = searchParams.includes('new=true');
  const preselectedStudentId = urlParams.get('studentId') || '';
  const preselectedPlanId = urlParams.get('planId') || '';
  const preselectedPlanName = urlParams.get('planName') || '';
  const preselectedPlanPrice = urlParams.get('planPrice') || '';
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(showNewDialog || !!preselectedPlanId);
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
  const [selectedCharges, setSelectedCharges] = useState<Set<number>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [batchAction, setBatchAction] = useState<'paid' | 'cancelled' | 'delete' | null>(null);
  const [newCharge, setNewCharge] = useState({
    studentId: preselectedStudentId,
    description: preselectedPlanName ? `Cobrança - ${decodeURIComponent(preselectedPlanName)}` : "",
    amount: preselectedPlanPrice || "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    type: "monthly" as "monthly" | "session" | "package" | "other",
    notes: preselectedPlanId ? `Plano ID: ${preselectedPlanId}` : "",
    planId: preselectedPlanId,
  });

  const utils = trpc.useUtils();

  const { data: charges, isLoading } = trpc.charges.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const { data: students } = trpc.students.list.useQuery({});

  const { data: plans } = trpc.plans.list.useQuery();

  const { data: stats } = trpc.charges.stats.useQuery();

  const createMutation = trpc.charges.create.useMutation({
    onSuccess: () => {
      toast.success("Cobrança criada com sucesso!");
      setIsNewDialogOpen(false);
      setNewCharge({
        studentId: "",
        description: "",
        amount: "",
        dueDate: format(new Date(), "yyyy-MM-dd"),
        type: "monthly",
        notes: "",
        planId: "",
      });
      utils.charges.list.invalidate();
      utils.charges.stats.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao criar cobrança: " + error.message);
    },
  });

  const updateMutation = trpc.charges.update.useMutation({
    onSuccess: () => {
      toast.success("Cobrança atualizada!");
      utils.charges.list.invalidate();
      utils.charges.stats.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = trpc.charges.delete.useMutation({
    onSuccess: () => {
      utils.charges.list.invalidate();
      utils.charges.stats.invalidate();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  // Funções de seleção em lote
  const toggleChargeSelection = (chargeId: number) => {
    const newSelected = new Set(selectedCharges);
    if (newSelected.has(chargeId)) {
      newSelected.delete(chargeId);
    } else {
      newSelected.add(chargeId);
    }
    setSelectedCharges(newSelected);
  };

  const selectAllChargesForStudent = (studentCharges: { charge: { id: number; status: string } }[]) => {
    const newSelected = new Set(selectedCharges);
    const actionableCharges = studentCharges.filter(c => c.charge.status !== 'paid');
    const allSelected = actionableCharges.every(c => selectedCharges.has(c.charge.id));
    
    if (allSelected) {
      actionableCharges.forEach(c => newSelected.delete(c.charge.id));
    } else {
      actionableCharges.forEach(c => newSelected.add(c.charge.id));
    }
    setSelectedCharges(newSelected);
  };

  const clearSelection = () => {
    setSelectedCharges(new Set());
    setIsBatchMode(false);
  };

  const handleBatchAction = async () => {
    if (!batchAction || selectedCharges.size === 0) return;
    
    const chargeIds = Array.from(selectedCharges);
    let successCount = 0;
    let errorCount = 0;

    for (const chargeId of chargeIds) {
      try {
        if (batchAction === 'delete') {
          await deleteMutation.mutateAsync({ id: chargeId });
        } else {
          await updateMutation.mutateAsync({ id: chargeId, status: batchAction });
        }
        successCount++;
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      const actionText = batchAction === 'paid' ? 'marcadas como pagas' : 
                         batchAction === 'cancelled' ? 'canceladas' : 'excluídas';
      toast.success(`${successCount} cobrança(s) ${actionText}!`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} cobrança(s) não puderam ser processadas`);
    }

    setIsBatchDialogOpen(false);
    setBatchAction(null);
    clearSelection();
  };

  useEffect(() => {
    if (showNewDialog) {
      setIsNewDialogOpen(true);
      setLocation('/cobrancas', { replace: true });
    }
  }, [showNewDialog, setLocation]);

  // Agrupar cobranças por aluno
  const chargesByStudent = useMemo(() => {
    if (!charges) return [];
    
    const grouped = new Map<number, {
      student: typeof charges[0]['student'];
      charges: typeof charges;
      totalPending: number;
      totalPaid: number;
      totalOverdue: number;
    }>();

    charges.forEach(item => {
      if (!item.student) return;
      
      const existing = grouped.get(item.student.id);
      const amount = parseFloat(item.charge.amount || '0');
      
      if (existing) {
        existing.charges.push(item);
        if (item.charge.status === 'pending') existing.totalPending += amount;
        if (item.charge.status === 'paid') existing.totalPaid += amount;
        if (item.charge.status === 'overdue') existing.totalOverdue += amount;
      } else {
        grouped.set(item.student.id, {
          student: item.student,
          charges: [item],
          totalPending: item.charge.status === 'pending' ? amount : 0,
          totalPaid: item.charge.status === 'paid' ? amount : 0,
          totalOverdue: item.charge.status === 'overdue' ? amount : 0,
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => {
      // Ordenar por total pendente + atrasado (maior primeiro)
      const aPriority = a.totalPending + a.totalOverdue;
      const bPriority = b.totalPending + b.totalOverdue;
      return bPriority - aPriority;
    });
  }, [charges]);

  // Filtrar por busca
  const filteredChargesByStudent = useMemo(() => {
    if (!search) return chargesByStudent;
    const searchLower = search.toLowerCase();
    return chargesByStudent.filter(item => 
      item.student?.name?.toLowerCase().includes(searchLower)
    );
  }, [chargesByStudent, search]);

  // Calcular métricas SaaS
  const saasMetrics = useMemo(() => {
    if (!charges || !students) return null;

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    // MRR: soma de todas as cobranças recorrentes pagas este mês
    const paidThisMonth = charges.filter(c => {
      if (c.charge.status !== 'paid' || !c.charge.paidAt) return false;
      const paidDate = new Date(c.charge.paidAt);
      return paidDate.getMonth() === thisMonth && paidDate.getFullYear() === thisYear;
    });
    const mrr = paidThisMonth.reduce((sum, c) => sum + parseFloat(c.charge.amount || '0'), 0);

    // MRR do mês passado para calcular crescimento
    const paidLastMonth = charges.filter(c => {
      if (c.charge.status !== 'paid' || !c.charge.paidAt) return false;
      const paidDate = new Date(c.charge.paidAt);
      return paidDate.getMonth() === lastMonth && paidDate.getFullYear() === lastMonthYear;
    });
    const lastMrr = paidLastMonth.reduce((sum, c) => sum + parseFloat(c.charge.amount || '0'), 0);

    // Crescimento MRR
    const mrrGrowth = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr * 100) : 0;

    // ARR: MRR * 12
    const arr = mrr * 12;

    // Alunos ativos (com cobranças pagas nos últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeStudentIds = new Set(
      charges
        .filter(c => c.charge.status === 'paid' && c.charge.paidAt && new Date(c.charge.paidAt) >= thirtyDaysAgo)
        .map(c => c.student?.id)
        .filter(Boolean)
    );
    const activeStudents = activeStudentIds.size;

    // Churn: alunos que tinham cobranças pagas no mês passado mas não neste
    const lastMonthStudentIds = new Set(
      paidLastMonth.map(c => c.student?.id).filter(Boolean)
    );
    const thisMonthStudentIds = new Set(
      paidThisMonth.map(c => c.student?.id).filter(Boolean)
    );
    const churnedStudents = Array.from(lastMonthStudentIds).filter(id => !thisMonthStudentIds.has(id)).length;
    const churnRate = lastMonthStudentIds.size > 0 ? (churnedStudents / lastMonthStudentIds.size * 100) : 0;

    // Ticket Médio
    const avgTicket = paidThisMonth.length > 0 ? mrr / paidThisMonth.length : 0;

    // LTV: Ticket Médio * Tempo médio de retenção (estimado em 12 meses se churn < 10%)
    const avgRetentionMonths = churnRate > 0 ? Math.min(100 / churnRate, 24) : 12;
    const ltv = avgTicket * avgRetentionMonths;

    return {
      mrr,
      mrrGrowth,
      arr,
      activeStudents,
      totalStudents: students.length,
      churnRate,
      churnedStudents,
      avgTicket,
      ltv,
    };
  }, [charges, students]);

  const handleCreateCharge = () => {
    if (!newCharge.studentId) {
      toast.error("Selecione um aluno");
      return;
    }
    if (!newCharge.amount || parseFloat(newCharge.amount) <= 0) {
      toast.error("Informe um valor válido");
      return;
    }
    createMutation.mutate({
      studentId: parseInt(newCharge.studentId),
      description: newCharge.description || `Mensalidade - ${format(new Date(), "MMMM yyyy", { locale: ptBR })}`,
      amount: newCharge.amount,
      dueDate: newCharge.dueDate,
      notes: newCharge.notes || undefined,
    });
  };

  const handleMarkAsPaid = (chargeId: number) => {
    updateMutation.mutate({
      id: chargeId,
      status: "paid",
    });
  };

  const handleMarkAsCancelled = (chargeId: number) => {
    if (confirm('Tem certeza que deseja cancelar esta cobrança?')) {
      updateMutation.mutate({
        id: chargeId,
        status: "cancelled",
      });
    }
  };

  // Stripe payment
  const createPaymentLinkMutation = trpc.charges.createPaymentLink.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecionando para pagamento...");
        window.open(data.url, '_blank');
      }
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao criar link de pagamento: " + error.message);
    },
  });

  const handleStripePayment = (chargeId: number) => {
    createPaymentLinkMutation.mutate({ chargeId });
  };

  const toggleStudentExpanded = (studentId: number) => {
    setExpandedStudents(prev => {
      const next = new Set(prev);
      if (next.has(studentId)) {
        next.delete(studentId);
      } else {
        next.add(studentId);
      }
      return next;
    });
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pendente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Atrasado</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight premium:text-white">Cobranças</h1>
            <p className="text-muted-foreground premium:text-gray-400">
              Gerencie cobranças e acompanhe métricas financeiras
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation('/cobrancas/agenda')}>
              <Calendar className="h-4 w-4 mr-2" />
              Agenda
            </Button>
            <Button onClick={() => setIsNewDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Cobrança
            </Button>
          </div>
        </div>

        {/* Métricas SaaS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="premium:bg-[#0d1520] premium:border-emerald-500/40 premium:shadow-[0_0_15px_rgba(0,255,136,0.15)] card-glow-green">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium premium:text-emerald-400">MRR</CardTitle>
              <RefreshCw className="h-4 w-4 text-emerald-600 premium:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 premium:text-[#00FF88]">
                {formatCurrency(saasMetrics?.mrr || 0)}
              </div>
              <div className="flex items-center gap-1 text-xs">
                {(saasMetrics?.mrrGrowth || 0) >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span className={(saasMetrics?.mrrGrowth || 0) >= 0 ? "text-emerald-600" : "text-red-600"}>
                  {(saasMetrics?.mrrGrowth || 0).toFixed(1)}%
                </span>
                <span className="text-muted-foreground">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="premium:bg-[#0d1520] premium:border-cyan-500/40 premium:shadow-[0_0_15px_rgba(0,200,255,0.15)] card-glow-cyan">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium premium:text-cyan-400">ARR</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600 premium:text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 premium:text-cyan-300">
                {formatCurrency(saasMetrics?.arr || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita anual recorrente
              </p>
            </CardContent>
          </Card>

          <Card className="premium:bg-[#0d1520] premium:border-amber-500/40 premium:shadow-[0_0_15px_rgba(245,158,11,0.15)] card-glow-amber">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium premium:text-amber-400">Churn Rate</CardTitle>
              <Percent className="h-4 w-4 text-amber-600 premium:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 premium:text-amber-300">
                {(saasMetrics?.churnRate || 0).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {saasMetrics?.churnedStudents || 0} alunos cancelaram
              </p>
            </CardContent>
          </Card>

          <Card className="premium:bg-[#0d1520] premium:border-violet-500/40 premium:shadow-[0_0_15px_rgba(139,92,246,0.15)] card-glow-violet">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium premium:text-violet-400">LTV</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600 premium:text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 premium:text-violet-300">
                {formatCurrency(saasMetrics?.ltv || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ticket médio: {formatCurrency(saasMetrics?.avgTicket || 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats Operacionais */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="premium:bg-[#0d1520] premium:border-yellow-500/30 card-glow-amber">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium premium:text-yellow-400">Total Pendente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600 premium:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 premium:text-yellow-300">
                {formatCurrency(stats?.totalPending || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingCount || 0} cobranças
              </p>
            </CardContent>
          </Card>

          <Card className="premium:bg-[#0d1520] premium:border-red-500/30 card-glow-red">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium premium:text-red-400">Total Atrasado</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600 premium:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 premium:text-red-300">
                {formatCurrency(stats?.totalOverdue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.overdueCount || 0} cobranças
              </p>
            </CardContent>
          </Card>

          <Card className="premium:bg-[#0d1520] premium:border-emerald-500/30 card-glow-green">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium premium:text-emerald-400">Recebido no Mês</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 premium:text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600 premium:text-[#00FF88]">
                {formatCurrency(stats?.totalPaidThisMonth || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.paidThisMonthCount || 0} pagamentos
              </p>
            </CardContent>
          </Card>

          <Card className="premium:bg-[#0d1520] premium:border-cyan-500/30 card-glow-cyan">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium premium:text-cyan-400">Alunos Ativos</CardTitle>
              <Users className="h-4 w-4 text-blue-600 premium:text-cyan-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 premium:text-cyan-300">
                {saasMetrics?.activeStudents || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                de {saasMetrics?.totalStudents || 0} cadastrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="premium:bg-[#0d1520] premium:border-emerald-500/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por aluno..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="overdue">Atrasados</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="cancelled">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Cobranças Agrupadas por Aluno */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Cobranças por Aluno
                </CardTitle>
                <CardDescription>
                  {filteredChargesByStudent.length} alunos com cobranças
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {isBatchMode ? (
                  <>
                    <span className="text-sm text-muted-foreground">
                      {selectedCharges.size} selecionada(s)
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBatchAction('paid');
                        setIsBatchDialogOpen(true);
                      }}
                      disabled={selectedCharges.size === 0}
                      className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Pagar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBatchAction('cancelled');
                        setIsBatchDialogOpen(true);
                      }}
                      disabled={selectedCharges.size === 0}
                      className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Cancelar</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBatchAction('delete');
                        setIsBatchDialogOpen(true);
                      }}
                      disabled={selectedCharges.size === 0}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Excluir</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsBatchMode(true)}
                  >
                    <ListChecks className="h-4 w-4 mr-2" />
                    Ações em Lote
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredChargesByStudent.length > 0 ? (
              <div className="space-y-3">
                {filteredChargesByStudent.map((item) => (
                  <Collapsible
                    key={item.student?.id}
                    open={expandedStudents.has(item.student?.id || 0)}
                    onOpenChange={() => toggleStudentExpanded(item.student?.id || 0)}
                  >
                    <div className="border rounded-lg overflow-hidden">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                          <div className="flex items-center gap-4">
                            {isBatchMode && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={item.charges.filter(c => c.charge.status !== 'paid').every(c => selectedCharges.has(c.charge.id)) && item.charges.filter(c => c.charge.status !== 'paid').length > 0}
                                  onCheckedChange={() => selectAllChargesForStudent(item.charges)}
                                  className="h-5 w-5 border-2 border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                />
                              </div>
                            )}
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={item.student?.avatarUrl || undefined} />
                              <AvatarFallback className="bg-emerald-100 text-emerald-700">
                                {item.student?.name?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{item.student?.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.charges.length} cobrança{item.charges.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                              {item.totalOverdue > 0 && (
                                <p className="text-sm text-red-600 font-medium">
                                  {formatCurrency(item.totalOverdue)} atrasado
                                </p>
                              )}
                              {item.totalPending > 0 && (
                                <p className="text-sm text-yellow-600">
                                  {formatCurrency(item.totalPending)} pendente
                                </p>
                              )}
                              {item.totalPaid > 0 && item.totalPending === 0 && item.totalOverdue === 0 && (
                                <p className="text-sm text-emerald-600">
                                  {formatCurrency(item.totalPaid)} pago
                                </p>
                              )}
                            </div>
                            {expandedStudents.has(item.student?.id || 0) ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent>
                        <div className="border-t bg-accent/20">
                          <div className="divide-y">
                            {[...item.charges]
                              .sort((a, b) => {
                                // Ordenar por data de vencimento (mais próximo primeiro)
                                const dateA = new Date(a.charge.dueDate).getTime();
                                const dateB = new Date(b.charge.dueDate).getTime();
                                return dateA - dateB;
                              })
                              .map((chargeItem) => (
                              <div 
                                key={chargeItem.charge.id}
                                className={`flex items-center justify-between p-4 hover:bg-accent/30 ${isBatchMode && selectedCharges.has(chargeItem.charge.id) ? 'bg-primary/10' : ''}`}
                              >
                                <div className="flex items-center gap-4">
                                  {isBatchMode && chargeItem.charge.status !== 'paid' && (
                                    <Checkbox
                                      checked={selectedCharges.has(chargeItem.charge.id)}
                                      onCheckedChange={() => toggleChargeSelection(chargeItem.charge.id)}
                                      className="h-5 w-5 border-2 border-emerald-500 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                    />
                                  )}
                                  {isBatchMode && chargeItem.charge.status === 'paid' && (
                                    <div className="h-5 w-5" /> // Placeholder para manter alinhamento
                                  )}
                                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">
                                      {chargeItem.charge.description || 'Mensalidade'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Vencimento: {format(new Date(chargeItem.charge.dueDate), "dd/MM/yyyy")}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <p className="font-medium">
                                      {formatCurrency(chargeItem.charge.amount || 0)}
                                    </p>
                                    {getStatusBadge(chargeItem.charge.status)}
                                  </div>
                                  {chargeItem.charge.status !== 'paid' && chargeItem.charge.status !== 'cancelled' && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem 
                                          onClick={() => handleStripePayment(chargeItem.charge.id)}
                                          disabled={createPaymentLinkMutation.isPending}
                                        >
                                          <CreditCard className="h-4 w-4 mr-2" />
                                          {createPaymentLinkMutation.isPending ? 'Gerando link...' : 'Pagar com Cartão'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleMarkAsPaid(chargeItem.charge.id)}>
                                          <Check className="h-4 w-4 mr-2" />
                                          Marcar como Pago
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={() => handleMarkAsCancelled(chargeItem.charge.id)}
                                          className="text-red-600"
                                        >
                                          <X className="h-4 w-4 mr-2" />
                                          Cancelar
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-lg font-medium">Nenhuma cobrança encontrada</p>
                <p className="text-muted-foreground mb-4">
                  {search ? 'Tente buscar por outro termo' : 'Crie sua primeira cobrança'}
                </p>
                {!search && (
                  <Button onClick={() => setIsNewDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cobrança
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog Nova Cobrança */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Cobrança</DialogTitle>
              <DialogDescription>
                Crie uma nova cobrança para um aluno
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Aluno *</Label>
                <Select
                  value={newCharge.studentId}
                  onValueChange={(value) => setNewCharge({ ...newCharge, studentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Plano (opcional)</Label>
                <Select
                  value={newCharge.planId || 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setNewCharge({ ...newCharge, planId: '' });
                      return;
                    }
                    const selectedPlan = plans?.find(p => p.id.toString() === value);
                    if (selectedPlan) {
                      setNewCharge({ 
                        ...newCharge, 
                        planId: value,
                        description: `Cobrança - ${selectedPlan.name}`,
                        amount: selectedPlan.price?.toString() || '',
                        notes: `Plano: ${selectedPlan.name}`,
                      });
                    } else {
                      setNewCharge({ ...newCharge, planId: '' });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum (cobrança manual)</SelectItem>
                    {plans?.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.name} - {formatCurrency(parseFloat(plan.price || '0'))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Input
                  placeholder="Ex: Mensalidade Janeiro 2025"
                  value={newCharge.description}
                  onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Valor *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={newCharge.amount}
                    onChange={(e) => setNewCharge({ ...newCharge, amount: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Vencimento *</Label>
                  <Input
                    type="date"
                    value={newCharge.dueDate}
                    onChange={(e) => setNewCharge({ ...newCharge, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={newCharge.notes}
                  onChange={(e) => setNewCharge({ ...newCharge, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateCharge} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar Cobrança"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AlertDialog de Confirmação de Ações em Lote */}
        <AlertDialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {batchAction === 'paid' && 'Marcar como Pagas'}
                {batchAction === 'cancelled' && 'Cancelar Cobranças'}
                {batchAction === 'delete' && 'Excluir Cobranças'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {batchAction === 'paid' && (
                  <>Você está prestes a marcar <strong>{selectedCharges.size}</strong> cobrança(s) como paga(s). Esta ação pode ser revertida posteriormente.</>
                )}
                {batchAction === 'cancelled' && (
                  <>Você está prestes a cancelar <strong>{selectedCharges.size}</strong> cobrança(s). As cobranças canceladas não serão cobradas.</>
                )}
                {batchAction === 'delete' && (
                  <>Você está prestes a excluir <strong>{selectedCharges.size}</strong> cobrança(s). <span className="text-red-600 font-medium">Esta ação não pode ser desfeita!</span></>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setBatchAction(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleBatchAction}
                className={batchAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : batchAction === 'cancelled' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-emerald-600 hover:bg-emerald-700'}
              >
                {batchAction === 'paid' && 'Marcar como Pagas'}
                {batchAction === 'cancelled' && 'Cancelar Cobranças'}
                {batchAction === 'delete' && 'Excluir Permanentemente'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
