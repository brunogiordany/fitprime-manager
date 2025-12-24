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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  MoreHorizontal,
  Eye,
  Check,
  X
} from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useState, useEffect } from "react";
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
    onError: (error) => {
      toast.error("Erro ao criar cobrança: " + error.message);
    },
  });

  const updateMutation = trpc.charges.update.useMutation({
    onSuccess: () => {
      toast.success("Cobrança atualizada!");
      utils.charges.list.invalidate();
      utils.charges.stats.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  useEffect(() => {
    if (showNewDialog) {
      setIsNewDialogOpen(true);
      setLocation('/cobrancas', { replace: true });
    }
  }, [showNewDialog, setLocation]);

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

  const filteredCharges = charges?.filter(item => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.student?.name?.toLowerCase().includes(searchLower) ||
      item.charge.description?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cobranças</h1>
            <p className="text-muted-foreground">
              Gerencie cobranças e pagamentos dos alunos
            </p>
          </div>
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Cobrança
          </Button>
        </div>

        {/* Stats */}
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
              <CardTitle className="text-sm font-medium">Previsão do Mês</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(stats?.expectedThisMonth || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                total esperado
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
                  placeholder="Buscar por aluno ou descrição..."
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

        {/* Charges Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Lista de Cobranças
            </CardTitle>
            <CardDescription>
              {filteredCharges?.length || 0} cobranças encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredCharges && filteredCharges.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCharges.map((item) => (
                      <TableRow key={item.charge.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold">
                              {item.student?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="font-medium">{item.student?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{item.charge.description}</TableCell>
                        <TableCell>
                          {format(new Date(item.charge.dueDate), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(item.charge.amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(item.charge.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setLocation(`/alunos/${item.charge.studentId}?tab=payments`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Aluno
                              </DropdownMenuItem>
                              {item.charge.status === 'pending' || item.charge.status === 'overdue' ? (
                                <>
                                  <DropdownMenuItem onClick={() => handleMarkAsPaid(item.charge.id)}>
                                    <Check className="h-4 w-4 mr-2" />
                                    Marcar como Pago
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleMarkAsCancelled(item.charge.id)}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Cancelar
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Nenhuma cobrança encontrada</p>
                <p className="text-muted-foreground mb-4">
                  {search || statusFilter !== "all"
                    ? "Tente ajustar os filtros de busca"
                    : "Comece criando sua primeira cobrança"}
                </p>
                {!search && statusFilter === "all" && (
                  <Button onClick={() => setIsNewDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cobrança
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Charge Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Nova Cobrança</DialogTitle>
              <DialogDescription>
                Crie uma nova cobrança para um aluno.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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
                <Label>Tipo</Label>
                <Select
                  value={newCharge.type}
                  onValueChange={(value: "monthly" | "session" | "package" | "other") => 
                    setNewCharge({ ...newCharge, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensalidade</SelectItem>
                    <SelectItem value="session">Sessão Avulsa</SelectItem>
                    <SelectItem value="package">Pacote</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Notas adicionais..."
                  value={newCharge.notes}
                  onChange={(e) => setNewCharge({ ...newCharge, notes: e.target.value })}
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
