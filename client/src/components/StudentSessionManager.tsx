import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, isBefore, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface Session {
  id: number;
  scheduledAt: string | Date;
  status: string;
  duration: number;
  notes?: string | null;
}

interface StudentSessionManagerProps {
  sessions: Session[];
  onUpdate: () => void;
}

export default function StudentSessionManager({
  sessions,
  onUpdate,
}: StudentSessionManagerProps) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; dayOfWeek: string; time: string } | null>(null);

  // Mutation para confirmar sessão
  const confirmSessionMutation = trpc.studentPortal.confirmSession.useMutation({
    onSuccess: () => {
      toast.success("Presença confirmada!");
      setConfirmDialogOpen(false);
      setSelectedSession(null);
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao confirmar sessão");
    },
  });

  // Mutation para cancelar sessão
  const cancelSessionMutation = trpc.studentPortal.cancelSession.useMutation({
    onSuccess: () => {
      toast.success("Sessão cancelada com sucesso");
      setCancelDialogOpen(false);
      setSelectedSession(null);
      setCancelReason("");
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao cancelar sessão");
    },
  });

  // Query para sugestões de reagendamento
  const { data: rescheduleSlots, isLoading: loadingSlots } = trpc.studentPortal.suggestReschedule.useQuery(
    { sessionId: selectedSession?.id || 0 },
    { enabled: rescheduleDialogOpen && !!selectedSession }
  );

  // Mutation para reagendar
  const rescheduleMutation = trpc.studentPortal.requestReschedule.useMutation({
    onSuccess: () => {
      toast.success("Sessão reagendada com sucesso!");
      setRescheduleDialogOpen(false);
      setSelectedSession(null);
      setSelectedSlot(null);
      setRescheduleReason("");
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao reagendar sessão");
    },
  });

  const handleConfirm = (session: Session) => {
    setSelectedSession(session);
    setConfirmDialogOpen(true);
  };

  const handleCancel = (session: Session) => {
    setSelectedSession(session);
    setCancelDialogOpen(true);
  };

  const handleReschedule = (session: Session) => {
    setSelectedSession(session);
    setSelectedSlot(null);
    setRescheduleReason("");
    setRescheduleDialogOpen(true);
  };

  const submitReschedule = () => {
    if (!selectedSession || !selectedSlot) return;
    rescheduleMutation.mutate({
      sessionId: selectedSession.id,
      newDate: selectedSlot.date.toISOString(),
      reason: rescheduleReason || undefined,
    });
  };

  const submitConfirm = () => {
    if (!selectedSession) return;
    confirmSessionMutation.mutate({ sessionId: selectedSession.id });
  };

  const submitCancel = () => {
    if (!selectedSession) return;
    cancelSessionMutation.mutate({
      sessionId: selectedSession.id,
      reason: cancelReason || undefined,
    });
  };

  // Filtrar sessões futuras
  const now = new Date();
  const upcomingSessions = sessions
    .filter((s) => {
      const sessionDate = new Date(s.scheduledAt);
      return sessionDate > now && s.status !== "cancelled";
    })
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  // Sessões passadas
  const pastSessions = sessions
    .filter((s) => {
      const sessionDate = new Date(s.scheduledAt);
      return sessionDate <= now || s.status === "cancelled";
    })
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 10);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Agendada
          </Badge>
        );
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Confirmada
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Realizada
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            Cancelada
          </Badge>
        );
      case "no_show":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Falta
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canConfirm = (session: Session) => {
    const sessionDate = new Date(session.scheduledAt);
    const hoursUntil = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return session.status === "scheduled" && hoursUntil <= 48 && hoursUntil > 0;
  };

  const canCancel = (session: Session) => {
    const sessionDate = new Date(session.scheduledAt);
    const hoursUntil = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    // Pode cancelar até 24h antes
    return (session.status === "scheduled" || session.status === "confirmed") && hoursUntil > 24;
  };

  const canReschedule = (session: Session) => {
    const sessionDate = new Date(session.scheduledAt);
    const hoursUntil = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    // Pode reagendar até 24h antes
    return (session.status === "scheduled" || session.status === "confirmed") && hoursUntil > 24;
  };

  return (
    <div className="space-y-6">
      {/* Próximas Sessões */}
      <Card className="premium:bg-[#0d1520] premium:border-cyan-500/40 premium:shadow-[0_0_15px_rgba(0,200,255,0.15)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 premium:text-white">
            <Calendar className="h-5 w-5 text-emerald-500 premium:text-cyan-400" />
            Próximas Sessões
          </CardTitle>
          <CardDescription className="premium:text-gray-400">
            Confirme sua presença ou cancele com antecedência
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length > 0 ? (
            <div className="space-y-4">
              {upcomingSessions.map((session) => {
                const sessionDate = new Date(session.scheduledAt);
                const hoursUntil = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);

                return (
                  <div
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 premium:bg-[#0a0f1a] premium:border premium:border-cyan-500/30 rounded-lg gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {format(sessionDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          {format(sessionDate, "HH:mm")} - {session.duration} min
                        </div>
                        {hoursUntil < 24 && (
                          <p className="text-xs text-amber-600 mt-1">
                            <AlertCircle className="h-3 w-3 inline mr-1" />
                            Em menos de 24 horas
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(session.status)}

                      {canConfirm(session) && (
                        <Button
                          size="sm"
                          onClick={() => handleConfirm(session)}
                          className="bg-emerald-600 hover:bg-emerald-700 premium:bg-[#00FF88] premium:text-[#0a0f1a] premium:hover:bg-[#00FF88]/90 premium:shadow-[0_0_10px_rgba(0,255,136,0.5)]"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Confirmar
                        </Button>
                      )}

                      {canCancel(session) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCancel(session)}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      )}

                      {canReschedule(session) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReschedule(session)}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Reagendar
                        </Button>
                      )}

                      {!canConfirm(session) && !canCancel(session) && session.status === "scheduled" && (
                        <span className="text-xs text-gray-500">
                          Confirme até 48h antes
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Nenhuma sessão agendada</p>
              <p className="text-sm">Entre em contato com seu personal para agendar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card className="premium:bg-[#0d1520] premium:border-violet-500/40 premium:shadow-[0_0_15px_rgba(139,92,246,0.15)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 premium:text-white">
            <Clock className="h-5 w-5 text-gray-500 premium:text-violet-400" />
            Histórico de Sessões
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pastSessions.length > 0 ? (
            <div className="space-y-3">
              {pastSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border-b last:border-0 dark:border-gray-700 premium:border-violet-500/20"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {format(new Date(session.scheduledAt), "dd/MM/yyyy - HH:mm")}
                    </p>
                    <p className="text-xs text-gray-500">{session.duration} min</p>
                  </div>
                  {getStatusBadge(session.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">
              Nenhuma sessão no histórico
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Confirmação */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Confirmar Presença
            </DialogTitle>
            <DialogDescription>
              Confirme sua presença na sessão de treino
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="py-4">
              <div className="bg-emerald-50 rounded-lg p-4">
                <p className="font-medium">
                  {format(new Date(selectedSession.scheduledAt), "EEEE, dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedSession.scheduledAt), "HH:mm")} -{" "}
                  {selectedSession.duration} min
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submitConfirm}
              disabled={confirmSessionMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {confirmSessionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirmar Presença
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Cancelamento */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Cancelar Sessão
            </DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento (opcional)
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4 py-4">
              <div className="bg-red-50 rounded-lg p-4">
                <p className="font-medium">
                  {format(new Date(selectedSession.scheduledAt), "EEEE, dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedSession.scheduledAt), "HH:mm")} -{" "}
                  {selectedSession.duration} min
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Motivo do cancelamento</Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Compromisso de trabalho, consulta médica..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-700">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  O cancelamento será notificado ao seu personal trainer
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={submitCancel}
              disabled={cancelSessionMutation.isPending}
            >
              {cancelSessionMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Reagendamento */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              Reagendar Sessão
            </DialogTitle>
            <DialogDescription>
              Escolha um novo horário disponível
            </DialogDescription>
          </DialogHeader>

          {selectedSession && (
            <div className="space-y-4 py-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-700">Sessão atual:</p>
                <p className="font-medium">
                  {format(new Date(selectedSession.scheduledAt), "EEEE, dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </p>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedSession.scheduledAt), "HH:mm")} -{" "}
                  {selectedSession.duration} min
                </p>
              </div>

              <div className="space-y-2">
                <Label>Horários disponíveis</Label>
                {loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                  </div>
                ) : rescheduleSlots && rescheduleSlots.length > 0 ? (
                  <ScrollArea className="h-[200px] rounded-md border p-2">
                    <div className="space-y-2">
                      {rescheduleSlots.map((slot: any, index: number) => (
                        <button
                          key={index}
                          onClick={() => setSelectedSlot({ ...slot, date: new Date(slot.date) })}
                          className={`w-full p-3 rounded-lg text-left transition-colors ${
                            selectedSlot && new Date(selectedSlot.date).getTime() === new Date(slot.date).getTime()
                              ? "bg-blue-100 border-2 border-blue-500"
                              : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                          }`}
                        >
                          <p className="font-medium text-sm">{slot.dayOfWeek}</p>
                          <p className="text-xs text-gray-600">
                            {format(new Date(slot.date), "dd/MM")} às {slot.time}
                          </p>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum horário disponível nos próximos 14 dias
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="rescheduleReason">Motivo (opcional)</Label>
                <Textarea
                  id="rescheduleReason"
                  placeholder="Ex: Compromisso de trabalho..."
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={submitReschedule}
              disabled={!selectedSlot || rescheduleMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {rescheduleMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Confirmar Reagendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
