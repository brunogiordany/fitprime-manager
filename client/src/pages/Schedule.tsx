import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  UserPlus,
  CreditCard,
  Dumbbell,
  Filter,
  X,
  MessageCircle,
  Phone,
  Edit,
  Repeat,
  Bell,
  MoreHorizontal,
  Save,
  CalendarDays,
  RotateCcw
} from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { 
  format, 
  addDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth,
  endOfMonth,
  isSameDay, 
  isSameMonth,
  addWeeks, 
  subWeeks,
  addMonths,
  subMonths,
  getDay,
  eachDayOfInterval
} from "date-fns";
import { ptBR } from "date-fns/locale";

type ViewMode = "day" | "week" | "month";

export default function Schedule() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const showNewDialog = searchParams.includes('new=true');
  const preselectedStudentId = new URLSearchParams(searchParams).get('studentId') || '';
  
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(showNewDialog);
  const [isNewStudentDialogOpen, setIsNewStudentDialogOpen] = useState(false);
  const [dialogStep, setDialogStep] = useState<"select" | "create" | "plan">("select");
  const [studentSearch, setStudentSearch] = useState("");
  
  const [newSession, setNewSession] = useState({
    studentId: preselectedStudentId || "",
    scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    duration: "60",
    type: "regular" as "regular" | "trial" | "makeup" | "extra",
    location: "",
    notes: "",
    planId: "",
    generateCharges: false,
    billingDay: "5",
  });

  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  // Filtros de status
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const allStatuses = [
    { value: 'scheduled', label: 'Agendada', color: 'bg-blue-500' },
    { value: 'confirmed', label: 'Confirmada', color: 'bg-emerald-500' },
    { value: 'completed', label: 'Realizada', color: 'bg-green-500' },
    { value: 'no_show', label: 'Falta', color: 'bg-red-500' },
    { value: 'cancelled', label: 'Cancelada', color: 'bg-gray-400' },
  ];

  // Modal de edição de sessão
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    status: '',
    scheduledAt: '',
    duration: '60',
    notes: '',
    sendReminder: true,
    encaixar: false,
    recurrenceFrequency: 'none',
    recurrenceRepeat: '1',
  });

  // Modal de lista de sessões do dia (+X more)
  const [isDayListOpen, setIsDayListOpen] = useState(false);
  const [selectedDaySessions, setSelectedDaySessions] = useState<any[]>([]);
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);

  const utils = trpc.useUtils();

  // Calculate date ranges based on view mode
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Domingo
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // For month view, we need to get sessions for the entire visible calendar
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const { data: sessions, isLoading } = trpc.sessions.list.useQuery({
    startDate: viewMode === "month" 
      ? format(calendarStart, "yyyy-MM-dd")
      : viewMode === "week" 
        ? format(weekStart, "yyyy-MM-dd")
        : format(currentDate, "yyyy-MM-dd"),
    endDate: viewMode === "month"
      ? format(calendarEnd, "yyyy-MM-dd")
      : viewMode === "week"
        ? format(weekEnd, "yyyy-MM-dd")
        : format(addDays(currentDate, 1), "yyyy-MM-dd"),
  });

  const { data: students } = trpc.students.list.useQuery({});
  const { data: plans } = trpc.plans.list.useQuery();

  const createSessionMutation = trpc.sessions.create.useMutation({
    onSuccess: () => {
      toast.success("Sessão agendada com sucesso!");
      setIsNewDialogOpen(false);
      resetNewSession();
      utils.sessions.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao agendar sessão: " + error.message);
    },
  });

  const generateChargesMutation = trpc.charges.generateFromPackage.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.charges.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao gerar cobranças: " + error.message);
    },
  });

  const createStudentMutation = trpc.students.create.useMutation({
    onSuccess: (data) => {
      toast.success("Aluno cadastrado com sucesso!");
      setNewSession({ ...newSession, studentId: data.id.toString() });
      setDialogStep("plan");
      setIsNewStudentDialogOpen(false);
      utils.students.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar aluno: " + error.message);
    },
  });

  const updateMutation = trpc.sessions.update.useMutation({
    onSuccess: () => {
      toast.success("Sessão atualizada!");
      utils.sessions.list.invalidate();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      toast.success("Sessão excluída!");
      utils.sessions.list.invalidate();
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  useEffect(() => {
    if (showNewDialog) {
      setIsNewDialogOpen(true);
      setLocation('/agenda', { replace: true });
    }
  }, [showNewDialog, setLocation]);

  const resetNewSession = () => {
    setNewSession({
      studentId: "",
      scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      duration: "60",
      type: "regular",
      location: "",
      notes: "",
      planId: "",
      generateCharges: false,
      billingDay: "5",
    });
    setDialogStep("select");
    setStudentSearch("");
  };

  const handleCreateSession = () => {
    if (!newSession.studentId) {
      toast.error("Selecione um aluno");
      return;
    }
    
    // Criar sessão
    createSessionMutation.mutate({
      studentId: parseInt(newSession.studentId),
      scheduledAt: newSession.scheduledAt,
      duration: parseInt(newSession.duration),
      type: newSession.type,
      location: newSession.location || undefined,
      notes: newSession.notes || undefined,
    });
    
    // Gerar cobranças automáticas se selecionado
    if (newSession.generateCharges && newSession.planId && newSession.planId !== "none") {
      generateChargesMutation.mutate({
        studentId: parseInt(newSession.studentId),
        planId: parseInt(newSession.planId),
        startDate: newSession.scheduledAt.split('T')[0],
        billingDay: parseInt(newSession.billingDay),
      });
    }
  };

  const handleCreateStudent = () => {
    if (!newStudent.name) {
      toast.error("Nome é obrigatório");
      return;
    }
    createStudentMutation.mutate({
      name: newStudent.name,
      email: newStudent.email || undefined,
      phone: newStudent.phone || undefined,
      notes: newStudent.notes || undefined,
    });
  };

  const handleStatusChange = (sessionId: number, status: "completed" | "no_show" | "cancelled") => {
    updateMutation.mutate({ id: sessionId, status });
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? addDays(currentDate, -1) : addDays(currentDate, 1));
    }
  };

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Generate calendar days for month view
  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [calendarStart, calendarEnd]);

  // Group calendar days into weeks
  const calendarWeeks = useMemo(() => {
    const weeks: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    return weeks;
  }, [calendarDays]);

  const getSessionsForDay = (date: Date) => {
    let daySessions = sessions?.filter(s => isSameDay(new Date(s.scheduledAt), date)) || [];
    // Aplicar filtro de status se houver filtros selecionados
    if (statusFilter.length > 0) {
      daySessions = daySessions.filter(s => statusFilter.includes(s.status));
    }
    return daySessions;
  };

  const toggleStatusFilter = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setStatusFilter([]);
  };

  // Funções para modal de edição de sessão
  const openEditDialog = (session: any) => {
    setEditingSession(session);
    setEditForm({
      status: session.status,
      scheduledAt: format(new Date(session.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
      duration: session.duration?.toString() || '60',
      notes: session.notes || '',
      sendReminder: true,
      encaixar: false,
      recurrenceFrequency: 'none',
      recurrenceRepeat: '1',
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingSession) return;
    
    // Garantir que scheduledAt seja válido
    let scheduledAtValue = editForm.scheduledAt;
    if (!scheduledAtValue || !scheduledAtValue.includes('T') || isNaN(new Date(scheduledAtValue).getTime())) {
      // Usar a data original da sessão se o novo valor for inválido
      scheduledAtValue = format(new Date(editingSession.scheduledAt), "yyyy-MM-dd'T'HH:mm");
    }
    
    updateMutation.mutate({
      id: editingSession.id,
      status: editForm.status as any,
      scheduledAt: scheduledAtValue,
      duration: parseInt(editForm.duration),
      notes: editForm.notes || undefined,
    }, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
        setEditingSession(null);
      }
    });
  };

  // Funções para modal de lista do dia (+X more)
  const openDayList = (date: Date, daySessions: any[]) => {
    setSelectedDayDate(date);
    setSelectedDaySessions(daySessions);
    setIsDayListOpen(true);
  };

  const openWhatsApp = (phone: string | undefined) => {
    if (!phone) {
      toast.error('Número de telefone não cadastrado');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}`, '_blank');
  };

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    if (!studentSearch) return students;
    const search = studentSearch.toLowerCase();
    return students.filter(s => 
      s.name.toLowerCase().includes(search) ||
      s.phone?.toLowerCase().includes(search) ||
      s.email?.toLowerCase().includes(search)
    );
  }, [students, studentSearch]);

  const selectedStudent = useMemo(() => {
    if (!newSession.studentId || !students) return null;
    return students.find(s => s.id.toString() === newSession.studentId);
  }, [newSession.studentId, students]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'confirmed': return 'bg-emerald-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-gray-400';
      case 'no_show': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Agendada</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Confirmada</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Realizada</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelada</Badge>;
      case 'no_show':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Falta</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'regular':
        return null;
      case 'trial':
        return <Badge variant="secondary" className="text-xs">Experimental</Badge>;
      case 'makeup':
        return <Badge variant="secondary" className="text-xs">Reposição</Badge>;
      case 'extra':
        return <Badge variant="secondary" className="text-xs">Extra</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Agenda</h1>
            <p className="text-muted-foreground">
              Gerencie suas sessões e acompanhe a agenda
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={viewMode} onValueChange={(v: ViewMode) => setViewMode(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Diário</SelectItem>
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensal</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => { resetNewSession(); setIsNewDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Sessão
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold capitalize min-w-[280px] text-center">
                {viewMode === "month"
                  ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
                  : viewMode === "week" 
                    ? `${format(weekStart, "dd MMM", { locale: ptBR })} - ${format(weekEnd, "dd MMM yyyy", { locale: ptBR })}`
                    : format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </h2>
              <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Filtros de Status */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="h-4 w-4" />
                <span>Filtrar:</span>
              </div>
              {allStatuses.map((status) => (
                <button
                  key={status.value}
                  onClick={() => toggleStatusFilter(status.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    statusFilter.includes(status.value)
                      ? `${status.color} text-white shadow-sm`
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusFilter.includes(status.value) ? 'bg-white' : status.color}`} />
                  {status.label}
                </button>
              ))}
              {statusFilter.length > 0 && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <X className="h-3 w-3" />
                  Limpar
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-7">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : viewMode === "month" ? (
          /* Month View - Similar to Belasis */
          <Card>
            <CardContent className="p-0">
              {/* Week day headers */}
              <div className="grid grid-cols-7 border-b">
                {['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              {calendarWeeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 border-b last:border-b-0">
                  {week.map((day) => {
                    const daySessions = getSessionsForDay(day);
                    const isToday = isSameDay(day, new Date());
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-[120px] p-1 border-r last:border-r-0 ${
                          !isCurrentMonth ? 'bg-muted/30' : ''
                        } ${isToday ? 'bg-primary/5' : ''}`}
                      >
                        <div className={`text-right text-sm p-1 ${
                          isToday 
                            ? 'font-bold text-primary' 
                            : !isCurrentMonth 
                              ? 'text-muted-foreground' 
                              : ''
                        }`}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {daySessions.slice(0, 3).map((session) => (
                            <div
                              key={session.id}
                              className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 text-white ${getStatusColor(session.status)}`}
                              onClick={() => openEditDialog(session)}
                              title={`${format(new Date(session.scheduledAt), "HH:mm")} - ${session.student?.name}`}
                            >
                              <span className="font-medium">{format(new Date(session.scheduledAt), "HH:mm")}</span>
                              {' '}{session.student?.name?.split(' ')[0]}
                            </div>
                          ))}
                          {daySessions.length > 3 && (
                            <div 
                              className="text-xs text-primary font-medium px-1 cursor-pointer hover:underline"
                              onClick={() => openDayList(day, daySessions)}
                            >
                              +{daySessions.length - 3} mais
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : viewMode === "week" ? (
          <div className="grid gap-4 md:grid-cols-7">
            {weekDays.map((day) => {
              const daySessions = getSessionsForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <Card key={day.toISOString()} className={isToday ? "ring-2 ring-primary" : ""}>
                  <CardHeader className="pb-2">
                    <CardTitle className={`text-sm ${isToday ? "text-primary" : ""}`}>
                      {format(day, "EEE", { locale: ptBR })}
                    </CardTitle>
                    <CardDescription className={`text-lg font-semibold ${isToday ? "text-primary" : ""}`}>
                      {format(day, "dd")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {daySessions.length > 0 ? (
                      daySessions.map((session) => (
                        <div
                          key={session.id}
                          className="p-2 rounded-lg bg-accent/50 hover:bg-accent cursor-pointer text-sm"
                          onClick={() => openEditDialog(session)}
                        >
                          <div className="flex items-center gap-1 font-medium">
                            <Clock className="h-3 w-3" />
                            {format(new Date(session.scheduledAt), "HH:mm")}
                          </div>
                          <p className="truncate">{session.student?.name}</p>
                          <div className="mt-1">
                            {getStatusBadge(session.status)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        Sem sessões
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Day View */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Sessões do Dia
              </CardTitle>
              <CardDescription>
                {getSessionsForDay(currentDate).length} sessões agendadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getSessionsForDay(currentDate).length > 0 ? (
                <div className="space-y-4">
                  {getSessionsForDay(currentDate).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                          {session.student?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{session.student?.name}</p>
                            {session.type && getTypeBadge(session.type)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(session.scheduledAt), "HH:mm")} - {session.duration || 60} min
                            </span>
                            {session.location && (
                              <span>{session.location}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(session.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => setLocation(`/sessao/${session.id}/treino`)}
                        >
                          <Dumbbell className="h-4 w-4" />
                          Treino
                        </Button>
                        {session.status === 'scheduled' && (
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleStatusChange(session.id, "completed")}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleStatusChange(session.id, "no_show")}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Nenhuma sessão agendada para este dia</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => { resetNewSession(); setIsNewDialogOpen(true); }}
                  >
                    Agendar nova sessão
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* New Session Dialog - Multi-step */}
        <Dialog open={isNewDialogOpen} onOpenChange={(open) => { setIsNewDialogOpen(open); if (!open) resetNewSession(); }}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Novo Agendamento</DialogTitle>
              <DialogDescription>
                {dialogStep === "select" && "Selecione ou cadastre um cliente para agendar"}
                {dialogStep === "create" && "Cadastre um novo cliente"}
                {dialogStep === "plan" && "Configure o agendamento"}
              </DialogDescription>
            </DialogHeader>
            
            {dialogStep === "select" && (
              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Digite para buscar..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {/* Student List */}
                <ScrollArea className="flex-1 -mx-6 px-6" style={{ maxHeight: '300px' }}>
                  <div className="space-y-2">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors ${
                          newSession.studentId === student.id.toString() ? 'ring-2 ring-primary bg-accent/50' : ''
                        }`}
                        onClick={() => {
                          setNewSession({ ...newSession, studentId: student.id.toString() });
                          setDialogStep("plan");
                        }}
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                          {student.avatarUrl ? (
                            <img src={student.avatarUrl} alt={student.name} className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            student.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{student.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{student.phone || student.email || 'Sem contato'}</p>
                        </div>
                      </div>
                    ))}
                    
                    {filteredStudents.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum cliente encontrado</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                
                {/* Create new student button */}
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setDialogStep("create")}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Criar cliente
                  </Button>
                </div>
              </div>
            )}

            {dialogStep === "create" && (
              <div className="space-y-4 py-4">
                <div className="grid gap-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Nome completo"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Telefone</Label>
                    <Input
                      placeholder="(00) 00000-0000"
                      value={newStudent.phone}
                      onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      value={newStudent.email}
                      onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Notas sobre o cliente..."
                    value={newStudent.notes}
                    onChange={(e) => setNewStudent({ ...newStudent, notes: e.target.value })}
                  />
                </div>
                
                <DialogFooter className="pt-4">
                  <Button variant="outline" onClick={() => setDialogStep("select")}>
                    Voltar
                  </Button>
                  <Button onClick={handleCreateStudent} disabled={createStudentMutation.isPending}>
                    {createStudentMutation.isPending ? "Cadastrando..." : "Cadastrar e Continuar"}
                  </Button>
                </DialogFooter>
              </div>
            )}

            {dialogStep === "plan" && (
              <div className="space-y-4 py-4">
                {/* Selected student info */}
                {selectedStudent && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 mb-4">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{selectedStudent.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedStudent.phone || selectedStudent.email}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setDialogStep("select")}>
                      Trocar
                    </Button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Data e Hora *</Label>
                    <Input
                      type="datetime-local"
                      value={newSession.scheduledAt}
                      onChange={(e) => setNewSession({ ...newSession, scheduledAt: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Duração</Label>
                    <Select
                      value={newSession.duration}
                      onValueChange={(value) => setNewSession({ ...newSession, duration: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="45">45 min</SelectItem>
                        <SelectItem value="60">60 min</SelectItem>
                        <SelectItem value="90">90 min</SelectItem>
                        <SelectItem value="120">120 min</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Tipo</Label>
                    <Select
                      value={newSession.type}
                      onValueChange={(value: "regular" | "trial" | "makeup" | "extra") => 
                        setNewSession({ ...newSession, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="trial">Experimental</SelectItem>
                        <SelectItem value="makeup">Reposição</SelectItem>
                        <SelectItem value="extra">Extra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Plano (opcional)</Label>
                    <Select
                      value={newSession.planId}
                      onValueChange={(value) => setNewSession({ ...newSession, planId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sem plano</SelectItem>
                        {plans?.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id.toString()}>
                            {plan.name} - R$ {Number(plan.price).toFixed(2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Local</Label>
                  <Input
                    placeholder="Ex: Academia, Casa do aluno"
                    value={newSession.location}
                    onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                  />
                </div>

                {/* Opção de gerar cobranças automáticas */}
                {newSession.planId && newSession.planId !== "none" && (
                  <div className="p-4 border rounded-lg bg-accent/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-base">Gerar cobranças automáticas</Label>
                        <p className="text-sm text-muted-foreground">
                          Criar cobranças recorrentes baseadas no plano selecionado
                        </p>
                      </div>
                      <Switch
                        checked={newSession.generateCharges}
                        onCheckedChange={(checked) => setNewSession({ ...newSession, generateCharges: checked })}
                      />
                    </div>
                    
                    {newSession.generateCharges && (
                      <div className="grid gap-2">
                        <Label>Dia de vencimento</Label>
                        <Select
                          value={newSession.billingDay}
                          onValueChange={(value) => setNewSession({ ...newSession, billingDay: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                Dia {day}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid gap-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Notas sobre a sessão..."
                    value={newSession.notes}
                    onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                  />
                </div>

                <DialogFooter className="pt-4">
                  <Button variant="outline" onClick={() => setDialogStep("select")}>
                    Voltar
                  </Button>
                  <Button onClick={handleCreateSession} disabled={createSessionMutation.isPending}>
                    {createSessionMutation.isPending ? "Agendando..." : "Agendar"}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Edição de Sessão - Estilo Belasis */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-xl">Editando agendamento</DialogTitle>
            </DialogHeader>
            
            {editingSession && (
              <div className="flex flex-col">
                {/* Informações do Cliente */}
                <div className="p-4 mx-4 bg-muted/30 rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm">Informações</h4>
                  <div 
                    className="flex items-center gap-3 cursor-pointer hover:bg-muted/50 p-2 -mx-2 rounded-lg transition-colors"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setLocation(`/alunos/${editingSession.studentId}`);
                    }}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-primary">{editingSession.student?.name}</p>
                      <p className="text-sm text-muted-foreground">{editingSession.student?.phone || 'Sem telefone'}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex gap-2 pt-2 border-t">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                      onClick={() => openWhatsApp(editingSession.student?.phone)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Conversar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-primary hover:bg-primary/10"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setLocation(`/alunos/${editingSession.studentId}`);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Ver cliente
                    </Button>
                  </div>
                </div>

                {/* Data clicável */}
                <div className="px-4 py-3 border-b">
                  <div className="flex items-center justify-between cursor-pointer hover:bg-muted/30 p-2 -mx-2 rounded-lg transition-colors">
                    <span className="text-sm">
                      {editForm.scheduledAt && !isNaN(new Date(editForm.scheduledAt).getTime()) 
                        ? format(new Date(editForm.scheduledAt), "EEEE, dd/MM/yyyy", { locale: ptBR })
                        : 'Data não definida'}
                    </span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>

                {/* Status com cor */}
                <div className="px-4 py-3 border-b">
                  <Select
                    value={editForm.status}
                    onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                  >
                    <SelectTrigger className="border-0 p-0 h-auto shadow-none focus:ring-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded ${
                          editForm.status === 'confirmed' ? 'bg-emerald-500' :
                          editForm.status === 'completed' ? 'bg-green-500' :
                          editForm.status === 'no_show' ? 'bg-red-500' :
                          editForm.status === 'cancelled' ? 'bg-gray-400' :
                          'bg-blue-500'
                        }`} />
                        <span className="text-sm">
                          {editForm.status === 'confirmed' ? 'Confirmado' :
                           editForm.status === 'completed' ? 'Realizada' :
                           editForm.status === 'no_show' ? 'Falta' :
                           editForm.status === 'cancelled' ? 'Cancelado' :
                           'Não confirmado'}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded bg-blue-500" />
                          Não confirmado
                        </div>
                      </SelectItem>
                      <SelectItem value="confirmed">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded bg-emerald-500" />
                          Confirmado
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded bg-green-500" />
                          Realizada
                        </div>
                      </SelectItem>
                      <SelectItem value="no_show">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded bg-red-500" />
                          Falta
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded bg-gray-400" />
                          Cancelado
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Serviços */}
                <div className="p-4 mx-4 mt-4 bg-muted/30 rounded-lg space-y-4">
                  <h4 className="font-semibold text-sm">Serviços</h4>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Descrição</Label>
                    <Select defaultValue="sessao">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sessao">Sessão de treino</SelectItem>
                        <SelectItem value="avaliacao">Avaliação física</SelectItem>
                        <SelectItem value="consultoria">Consultoria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Horário</Label>
                      <Input
                        type="time"
                        value={editForm.scheduledAt?.includes('T') ? editForm.scheduledAt.split('T')[1]?.substring(0, 5) || '' : ''}
                        onChange={(e) => {
                          // Usar a data da sessão original se disponível
                          let date = editForm.scheduledAt?.includes('T') ? editForm.scheduledAt.split('T')[0] : '';
                          if (!date && editingSession?.scheduledAt) {
                            date = format(new Date(editingSession.scheduledAt), 'yyyy-MM-dd');
                          }
                          if (!date) {
                            date = format(new Date(), 'yyyy-MM-dd');
                          }
                          setEditForm({ ...editForm, scheduledAt: `${date}T${e.target.value}:00` });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Duração</Label>
                      <Select
                        value={editForm.duration}
                        onValueChange={(value) => setEditForm({ ...editForm, duration: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 min</SelectItem>
                          <SelectItem value="10">10 min</SelectItem>
                          <SelectItem value="15">15 min</SelectItem>
                          <SelectItem value="20">20 min</SelectItem>
                          <SelectItem value="25">25 min</SelectItem>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="35">35 min</SelectItem>
                          <SelectItem value="40">40 min</SelectItem>
                          <SelectItem value="45">45 min</SelectItem>
                          <SelectItem value="50">50 min</SelectItem>
                          <SelectItem value="55">55 min</SelectItem>
                          <SelectItem value="60">1h</SelectItem>
                          <SelectItem value="65">1h 5min</SelectItem>
                          <SelectItem value="70">1h 10min</SelectItem>
                          <SelectItem value="75">1h 15min</SelectItem>
                          <SelectItem value="80">1h 20min</SelectItem>
                          <SelectItem value="85">1h 25min</SelectItem>
                          <SelectItem value="90">1h 30min</SelectItem>
                          <SelectItem value="95">1h 35min</SelectItem>
                          <SelectItem value="100">1h 40min</SelectItem>
                          <SelectItem value="105">1h 45min</SelectItem>
                          <SelectItem value="110">1h 50min</SelectItem>
                          <SelectItem value="115">1h 55min</SelectItem>
                          <SelectItem value="120">2h</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" className="text-primary p-0 h-auto">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Serviço
                  </Button>
                </div>

                {/* Ações */}
                <div className="p-4 mx-4 mt-4 bg-muted/30 rounded-lg space-y-3">
                  <h4 className="font-semibold text-sm">Ações</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Enviar lembrete</span>
                    </div>
                    <Switch
                      checked={editForm.sendReminder}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, sendReminder: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Encaixar agendamento</span>
                    </div>
                    <Switch
                      checked={editForm.encaixar}
                      onCheckedChange={(checked) => setEditForm({ ...editForm, encaixar: checked })}
                    />
                  </div>
                </div>

                {/* Recorrência */}
                <div className="p-4 mx-4 mt-4 bg-muted/30 rounded-lg space-y-4">
                  <h4 className="font-semibold text-sm">Recorrência</h4>
                  
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Frequência</Label>
                    <Select
                      value={editForm.recurrenceFrequency}
                      onValueChange={(value) => setEditForm({ ...editForm, recurrenceFrequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Agendamento não se repete" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Agendamento não se repete</SelectItem>
                        <SelectItem value="daily">Diário</SelectItem>
                        <SelectItem value="weekly">Semanal</SelectItem>
                        <SelectItem value="biweekly">Quinzenal</SelectItem>
                        <SelectItem value="monthly">Mensal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {editForm.recurrenceFrequency !== 'none' && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Além deste, repetir mais</Label>
                      <Select
                        value={editForm.recurrenceRepeat}
                        onValueChange={(value) => setEditForm({ ...editForm, recurrenceRepeat: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 vez</SelectItem>
                          <SelectItem value="2">2 vezes</SelectItem>
                          <SelectItem value="3">3 vezes</SelectItem>
                          <SelectItem value="4">4 vezes</SelectItem>
                          <SelectItem value="5">5 vezes</SelectItem>
                          <SelectItem value="10">10 vezes</SelectItem>
                          <SelectItem value="20">20 vezes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Observação */}
                <div className="p-4 mx-4 mt-4 bg-muted/30 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Observação</h4>
                  <Textarea
                    placeholder="Escreva aqui"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="resize-none"
                  />
                </div>

                {/* Botões fixos no rodapé */}
                <div className="sticky bottom-0 bg-background border-t p-4 mt-4 flex gap-2">
                  <Select
                    onValueChange={(value) => {
                      if (value === 'delete') {
                        if (confirm('Tem certeza que deseja excluir esta sessão?')) {
                          deleteMutation.mutate({ id: editingSession.id });
                        }
                      } else if (value === 'duplicate') {
                        toast.info('Funcionalidade em desenvolvimento');
                      } else if (value === 'reschedule') {
                        toast.info('Use o campo de data acima para reagendar');
                      } else if (value === 'cancel') {
                        setEditForm({ ...editForm, status: 'cancelled' });
                        toast.info('Status alterado para Cancelada. Clique em Salvar para confirmar.');
                      } else if (value === 'no_show') {
                        setEditForm({ ...editForm, status: 'no_show' });
                        toast.info('Status alterado para Falta. Clique em Salvar para confirmar.');
                      }
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Outros" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cancel">Cancelar</SelectItem>
                      <SelectItem value="no_show">Falta</SelectItem>
                      <SelectItem value="delete">Excluir</SelectItem>
                      <SelectItem value="duplicate">Duplicar</SelectItem>
                      <SelectItem value="reschedule">Reagendar</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={handleSaveEdit} 
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                  >
                    Criar comanda
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Lista do Dia (+X more) - Estilo Belasis */}
        <Dialog open={isDayListOpen} onOpenChange={setIsDayListOpen}>
          <DialogContent className="max-w-sm p-0">
            <DialogHeader className="p-4 pb-2 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base">
                  {selectedDayDate && format(selectedDayDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </DialogTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsDayListOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh]">
              <div className="p-2 space-y-1">
                {selectedDaySessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg cursor-pointer hover:opacity-90 text-white transition-all ${getStatusColor(session.status)}`}
                    onClick={() => {
                      setIsDayListOpen(false);
                      openEditDialog(session);
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">
                        {format(new Date(session.scheduledAt), "HH:mm")}
                      </span>
                    </div>
                    <p className="font-medium text-sm">{session.student?.name}</p>
                    <p className="text-xs opacity-90">
                      {session.type === 'regular' ? 'Sessão de treino' : 
                       session.type === 'trial' ? 'Experimental' :
                       session.type === 'makeup' ? 'Reposição' : 'Extra'}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
