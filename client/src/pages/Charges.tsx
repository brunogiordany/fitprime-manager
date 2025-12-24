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
} from "lucide-react";
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

export default function Charges() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const showNewDialog = searchParams.includes('new=true');
  const preselectedStudentId = new URLSearchParams(searchParams).get('studentId') || '';
  
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(showNewDialog);
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
  const [newCharge, setNewCharge] = useState({
    studentId: preselectedStudentId,
    description: "",
    amount: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    type: "monthly" as "monthly" | "session" | "package" | "other",
    notes: "",
  });

  const utils = trpc.useUtils();

  const { data: charges, isLoading } = trpc.charges.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  const { data: students } = trpc.students.list.useQuery({});

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
            <h1 className="text-2xl font-bold tracking-tight">Cobranças</h1>
            <p className="text-muted-foreground">
              Gerencie cobranças e acompanhe métricas financeiras
            </p>
          </div>
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Cobrança
          </Button>
        </div>

        {/* Métricas SaaS */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <RefreshCw className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ARR</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(saasMetrics?.arr || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Receita anual recorrente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              <Percent className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {(saasMetrics?.churnRate || 0).toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {saasMetrics?.churnedStudents || 0} alunos cancelaram
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">LTV</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(stats?.totalPending || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.pendingCount || 0} cobranças
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Atrasado</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats?.totalOverdue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.overdueCount || 0} cobranças
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recebido no Mês</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(stats?.totalPaidThisMonth || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.paidThisMonthCount || 0} pagamentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {saasMetrics?.activeStudents || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                de {saasMetrics?.totalStudents || 0} cadastrados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
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
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Cobranças por Aluno
            </CardTitle>
            <CardDescription>
              {filteredChargesByStudent.length} alunos com cobranças
            </CardDescription>
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
                            {item.charges.map((chargeItem) => (
                              <div 
                                key={chargeItem.charge.id}
                                className="flex items-center justify-between p-4 hover:bg-accent/30"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                    <Calendar className="h-4 w-4 text-gray-500" />
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
      </div>
    </DashboardLayout>
  );
}
