import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format, isSameDay, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, 
  Filter, 
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit,
  MoreHorizontal,
  X,
  Ban,
  Trash2,
  AlertTriangle,
  Plus,
  CalendarDays
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useLocation } from "wouter";

// Helper para formatar horário em UTC
const formatTimeUTC = (date: Date) => {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  scheduled: { label: "Agendada", color: "bg-blue-500", icon: Calendar },
  confirmed: { label: "Confirmada", color: "bg-emerald-500", icon: CheckCircle },
  completed: { label: "Realizada", color: "bg-green-500", icon: CheckCircle },
  no_show: { label: "Falta", color: "bg-red-500", icon: XCircle },
  cancelled: { label: "Cancelada", color: "bg-gray-400", icon: AlertCircle },
};

export default function Sessions() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [studentFilter, setStudentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Modal de edição
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    scheduledDate: "",
    scheduledTime: "",
    duration: 60,
    status: "scheduled",
    notes: "",
  });

  // Modal de ações em lote
  const [showBatchSessionModal, setShowBatchSessionModal] = useState(false);
  const [batchAction, setBatchAction] = useState<'cancel' | 'delete'>('cancel');
  const [batchFromDate, setBatchFromDate] = useState('');
  const [batchToDate, setBatchToDate] = useState('');
  const [batchReason, setBatchReason] = useState('');

  const utils = trpc.useUtils();
  
  // Buscar sessões do mês atual
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);
  
  const { data: sessions, isLoading } = trpc.sessions.list.useQuery({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });
  
  const { data: students } = trpc.students.list.useQuery();
  
  const updateSession = trpc.sessions.update.useMutation({
    onSuccess: () => {
      toast.success("Sessão atualizada com sucesso!");
      utils.sessions.list.invalidate();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar sessão", { description: error.message });
    },
  });

  // Mutations para ações em lote
  const cancelFutureSessionsMutation = trpc.sessions.cancelFuture.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.sessions.list.invalidate();
      setShowBatchSessionModal(false);
      setBatchFromDate('');
      setBatchToDate('');
      setBatchReason('');
    },
    onError: (error: any) => {
      toast.error("Erro ao cancelar sessões: " + error.message);
    },
  });

  const deleteFutureSessionsMutation = trpc.sessions.deleteFuture.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.sessions.list.invalidate();
      setShowBatchSessionModal(false);
      setBatchFromDate('');
      setBatchToDate('');
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir sessões: " + error.message);
    },
  });

  // Funções para marcar sessão como realizada ou falta
  const handleMarkCompleted = (sessionId: number) => {
    updateSession.mutate({ id: sessionId, status: "completed" });
  };

  const handleMarkNoShow = (sessionId: number) => {
    updateSession.mutate({ id: sessionId, status: "no_show" });
  };

  // Filtrar sessões
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    
    let result = [...sessions];
    
    // Filtro por aluno
    if (studentFilter !== "all") {
      result = result.filter(s => s.studentId === parseInt(studentFilter));
    }
    
    // Filtro por status
    if (statusFilter.length > 0) {
      result = result.filter(s => statusFilter.includes(s.status));
    }
    
    // Filtro por busca (nome do aluno)
    if (searchTerm) {
      result = result.filter(s => 
        s.student?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Ordenar por data
    result.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    
    return result;
  }, [sessions, studentFilter, statusFilter, searchTerm]);

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setStatusFilter([]);
    setStudentFilter("all");
    setSearchTerm("");
  };

  const openEditDialog = (session: any) => {
    setEditingSession(session);
    const date = new Date(session.scheduledAt);
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    
    setEditForm({
      scheduledDate: `${year}-${month}-${day}`,
      scheduledTime: `${hours}:${minutes}`,
      duration: session.duration,
      status: session.status,
      notes: session.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateSession = () => {
    if (!editingSession) return;
    
    const [year, month, day] = editForm.scheduledDate.split('-').map(Number);
    const [hours, minutes] = editForm.scheduledTime.split(':').map(Number);
    const scheduledAt = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    
    updateSession.mutate({
      id: editingSession.id,
      scheduledAt: scheduledAt.toISOString(),
      duration: editForm.duration,
      status: editForm.status as any,
      notes: editForm.notes || undefined,
    });
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth(prev => direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1));
  };

  const openBatchModal = (action: 'cancel' | 'delete') => {
    setBatchAction(action);
    setBatchFromDate('');
    setBatchToDate('');
    setBatchReason('');
    setShowBatchSessionModal(true);
  };

  const handleBatchAction = () => {
    // Precisa ter um aluno selecionado para ações em lote
    if (studentFilter === "all") {
      toast.error("Selecione um aluno para executar ações em lote");
      return;
    }
    
    const studentId = parseInt(studentFilter);
    
    if (batchAction === 'cancel') {
      cancelFutureSessionsMutation.mutate({
        studentId,
        fromDate: batchFromDate || undefined,
        toDate: batchToDate || undefined,
        reason: batchReason || undefined,
      });
    } else {
      deleteFutureSessionsMutation.mutate({
        studentId,
        fromDate: batchFromDate || undefined,
        toDate: batchToDate || undefined,
      });
    }
  };

  const hasActiveFilters = statusFilter.length > 0 || studentFilter !== "all" || searchTerm !== "";

  // Encontrar nome do aluno selecionado
  const selectedStudent = students?.find(s => s.id.toString() === studentFilter);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Sessões</h1>
            <p className="text-muted-foreground">
              Gerencie todas as sessões de treino
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => navigateMonth("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button variant="outline" size="icon" onClick={() => navigateMonth("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button 
              onClick={() => setLocation('/agenda?new=true')}
              className="bg-emerald-600 hover:bg-emerald-700 ml-2"
            >
              <CalendarDays className="h-4 w-4 mr-2" />
              Nova Sessão
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Busca e filtro de aluno */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome do aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={studentFilter} onValueChange={setStudentFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Todos os alunos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os alunos</SelectItem>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtros de status */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Filter className="h-4 w-4" />
                  <span>Status:</span>
                </div>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <button
                    key={value}
                    onClick={() => toggleStatusFilter(value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      statusFilter.includes(value)
                        ? `${config.color} text-white shadow-sm`
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusFilter.includes(value) ? 'bg-white' : config.color}`} />
                    {config.label}
                  </button>
                ))}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                  >
                    <X className="h-3 w-3" />
                    Limpar filtros
                  </button>
                )}
              </div>

              {/* Ações em lote - só aparece quando um aluno está selecionado */}
              {studentFilter !== "all" && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Ações em lote para {selectedStudent?.name}:</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openBatchModal('cancel')}
                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    Cancelar Sessões
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openBatchModal('delete')}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Sessões
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de sessões */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Sessões do Mês
            </CardTitle>
            <CardDescription>
              {filteredSessions.length} sessões encontradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma sessão encontrada</p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={clearFilters} className="mt-2">
                    Limpar filtros
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSessions.map((session) => {
                  const config = statusConfig[session.status] || statusConfig.scheduled;
                  const StatusIcon = config.icon;
                  const sessionDate = new Date(session.scheduledAt);
                  const isToday = isSameDay(sessionDate, new Date());
                  
                  return (
                    <div
                      key={session.id}
                      onClick={() => openEditDialog(session)}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer ${
                        isToday ? "ring-2 ring-primary/50" : ""
                      }`}
                    >
                      {/* Avatar e info do aluno */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {session.student?.name?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <span
                            onClick={(e) => { e.stopPropagation(); window.location.href = `/alunos/${session.studentId}`; }}
                            className="font-medium truncate hover:text-primary cursor-pointer hover:underline"
                          >
                              {session.student?.name || "Aluno"}
                          </span>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {format(sessionDate, "EEE, dd/MM", { locale: ptBR })}
                            </span>
                            <Clock className="h-3.5 w-3.5 ml-1" />
                            <span>
                              {formatTimeUTC(sessionDate)} - {session.duration}min
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status e ações */}
                      <div className="flex items-center gap-2 justify-between sm:justify-end">
                        <Badge className={`${config.color} text-white shrink-0`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                        
                        <div className="flex items-center gap-1">
                          {(session.status === "scheduled" || session.status === "confirmed") && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={(e) => { e.stopPropagation(); handleMarkCompleted(session.id); }}
                                title="Marcar como realizada"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => { e.stopPropagation(); handleMarkNoShow(session.id); }}
                                title="Marcar como falta"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(session)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/alunos/${session.studentId}`}>
                                  <User className="h-4 w-4 mr-2" />
                                  Ver aluno
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => {
                                  setStudentFilter(session.studentId.toString());
                                  openBatchModal('cancel');
                                }}
                                className="text-amber-600"
                              >
                                <Ban className="h-4 w-4 mr-2" />
                                Cancelar sessões do aluno
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => {
                                  setStudentFilter(session.studentId.toString());
                                  openBatchModal('delete');
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir sessões do aluno
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Sessão</DialogTitle>
            <DialogDescription>
              {editingSession?.student?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Data e Horário</Label>
              <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {editForm.scheduledDate && editForm.scheduledTime ? 
                    `${editForm.scheduledDate.split('-').reverse().join('/')} às ${editForm.scheduledTime}` :
                    'Carregando...'
                  }
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Alterar data</Label>
                  <Input
                    type="date"
                    value={editForm.scheduledDate}
                    onChange={(e) => setEditForm({ ...editForm, scheduledDate: e.target.value })}
                    className="mt-1"
                    tabIndex={-1}
                    onFocus={(e) => e.target.blur()}
                    onClick={(e) => {
                      e.currentTarget.focus();
                      e.currentTarget.showPicker?.();
                    }}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Alterar horário</Label>
                  <Input
                    type="time"
                    value={editForm.scheduledTime}
                    onChange={(e) => setEditForm({ ...editForm, scheduledTime: e.target.value })}
                    className="mt-1"
                    tabIndex={-1}
                    onFocus={(e) => e.target.blur()}
                    onClick={(e) => {
                      e.currentTarget.focus();
                      e.currentTarget.showPicker?.();
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duração</Label>
                <Select
                  value={editForm.duration.toString()}
                  onValueChange={(v) => setEditForm({ ...editForm, duration: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1h</SelectItem>
                    <SelectItem value="75">1h15</SelectItem>
                    <SelectItem value="90">1h30</SelectItem>
                    <SelectItem value="120">2h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) => setEditForm({ ...editForm, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Notas sobre a sessão..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateSession} disabled={updateSession.isPending}>
              {updateSession.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de ações em lote */}
      <Dialog open={showBatchSessionModal} onOpenChange={setShowBatchSessionModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {batchAction === 'cancel' ? (
                <><Ban className="h-5 w-5" /> Cancelar Sessões Futuras</>
              ) : (
                <><Trash2 className="h-5 w-5 text-red-600" /> Excluir Sessões Futuras</>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedStudent && (
              <div className="bg-primary/10 rounded-lg p-3">
                <p className="text-sm font-medium">Aluno: {selectedStudent.name}</p>
              </div>
            )}
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm font-medium mb-1">Deixe os campos de data vazios para afetar TODAS as sessões do aluno.</p>
              <p className="text-xs text-muted-foreground">Ou preencha para filtrar por período específico.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>De (opcional)</Label>
                <Input
                  type="date"
                  value={batchFromDate}
                  onChange={(e) => setBatchFromDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Até (opcional)</Label>
                <Input
                  type="date"
                  value={batchToDate}
                  onChange={(e) => setBatchToDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            {batchAction === 'cancel' && (
              <div className="space-y-2">
                <Label>Motivo do cancelamento (opcional)</Label>
                <Textarea
                  value={batchReason}
                  onChange={(e) => setBatchReason(e.target.value)}
                  placeholder="Ex: Viagem, férias, etc."
                />
              </div>
            )}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                {batchAction === 'cancel' 
                  ? 'As sessões serão marcadas como canceladas e não poderão ser revertidas automaticamente.'
                  : 'As sessões serão movidas para a lixeira. Você pode restaurá-las depois se necessário.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchSessionModal(false)}>
              Voltar
            </Button>
            <Button
              variant={batchAction === 'delete' ? 'destructive' : 'default'}
              onClick={handleBatchAction}
              disabled={cancelFutureSessionsMutation.isPending || deleteFutureSessionsMutation.isPending}
            >
              {(cancelFutureSessionsMutation.isPending || deleteFutureSessionsMutation.isPending) 
                ? 'Processando...' 
                : batchAction === 'cancel' ? 'Cancelar Sessões' : 'Excluir Sessões'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
