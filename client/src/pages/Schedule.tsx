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
  CreditCard
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
        : format(currentDate, "yyyy-MM-dd"),
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
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
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
    return sessions?.filter(s => isSameDay(new Date(s.scheduledAt), date)) || [];
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
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <h2 className="text-lg font-semibold capitalize">
                  {viewMode === "month"
                    ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })
                    : viewMode === "week" 
                      ? `${format(weekStart, "dd MMM", { locale: ptBR })} - ${format(weekEnd, "dd MMM yyyy", { locale: ptBR })}`
                      : format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </h2>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                  Hoje
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateDate("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
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
                              onClick={() => setLocation(`/alunos/${session.studentId}`)}
                              title={`${format(new Date(session.scheduledAt), "HH:mm")} - ${session.student?.name}`}
                            >
                              <span className="font-medium">{format(new Date(session.scheduledAt), "HH:mm")}</span>
                              {' '}{session.student?.name?.split(' ')[0]}
                            </div>
                          ))}
                          {daySessions.length > 3 && (
                            <div className="text-xs text-primary font-medium px-1 cursor-pointer hover:underline">
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
                          onClick={() => setLocation(`/alunos/${session.studentId}`)}
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
      </div>
    </DashboardLayout>
  );
}
