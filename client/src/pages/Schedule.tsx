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
  AlertCircle
} from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { format, addDays, startOfWeek, endOfWeek, isSameDay, addWeeks, subWeeks } from "date-fns";
import { ptBR } from "date-fns/locale";

type ViewMode = "day" | "week";

export default function Schedule() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const showNewDialog = searchParams.includes('new=true');
  const preselectedStudentId = new URLSearchParams(searchParams).get('studentId') || '';
  
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(showNewDialog);
  const [newSession, setNewSession] = useState({
    studentId: preselectedStudentId || "",
    scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    duration: "60",
    type: "regular" as "regular" | "trial" | "makeup" | "extra",
    location: "",
    notes: "",
  });

  const utils = trpc.useUtils();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const { data: sessions, isLoading } = trpc.sessions.list.useQuery({
    startDate: viewMode === "week" 
      ? format(weekStart, "yyyy-MM-dd")
      : format(currentDate, "yyyy-MM-dd"),
    endDate: viewMode === "week"
      ? format(weekEnd, "yyyy-MM-dd")
      : format(currentDate, "yyyy-MM-dd"),
  });

  const { data: students } = trpc.students.list.useQuery({});

  const createMutation = trpc.sessions.create.useMutation({
    onSuccess: () => {
      toast.success("Sessão agendada com sucesso!");
      setIsNewDialogOpen(false);
      setNewSession({
        studentId: "",
        scheduledAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        duration: "60",
        type: "regular",
        location: "",
        notes: "",
      });
      utils.sessions.list.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao agendar sessão: " + error.message);
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

  const handleCreateSession = () => {
    if (!newSession.studentId) {
      toast.error("Selecione um aluno");
      return;
    }
    createMutation.mutate({
      studentId: parseInt(newSession.studentId),
      scheduledAt: newSession.scheduledAt,
      duration: parseInt(newSession.duration),
      type: newSession.type,
      location: newSession.location || undefined,
      notes: newSession.notes || undefined,
    });
  };

  const handleStatusChange = (sessionId: number, status: "completed" | "no_show" | "cancelled") => {
    updateMutation.mutate({ id: sessionId, status });
  };

  const navigateDate = (direction: "prev" | "next") => {
    if (viewMode === "week") {
      setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === "prev" ? addDays(currentDate, -1) : addDays(currentDate, 1));
    }
  };

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const getSessionsForDay = (date: Date) => {
    return sessions?.filter(s => isSameDay(new Date(s.scheduledAt), date)) || [];
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
              </SelectContent>
            </Select>
            <Button onClick={() => setIsNewDialogOpen(true)}>
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
                <h2 className="text-lg font-semibold">
                  {viewMode === "week" 
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
                    onClick={() => setIsNewDialogOpen(true)}
                  >
                    Agendar nova sessão
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* New Session Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Agendar Nova Sessão</DialogTitle>
              <DialogDescription>
                Preencha os dados para agendar uma nova sessão de treino.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Aluno *</Label>
                <Select
                  value={newSession.studentId}
                  onValueChange={(value) => setNewSession({ ...newSession, studentId: value })}
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
                  <Label>Duração (min)</Label>
                  <Select
                    value={newSession.duration}
                    onValueChange={(value) => setNewSession({ ...newSession, duration: value })}
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
                  <Label>Local</Label>
                  <Input
                    placeholder="Ex: Academia, Casa do aluno"
                    value={newSession.location}
                    onChange={(e) => setNewSession({ ...newSession, location: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Notas sobre a sessão..."
                  value={newSession.notes}
                  onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateSession} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Agendando..." : "Agendar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
