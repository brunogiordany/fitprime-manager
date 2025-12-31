import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  MessageCircle,
  User,
  ChevronRight,
  Brain,
  Sparkles
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: todaySessions, isLoading: sessionsLoading } = trpc.dashboard.todaySessions.useQuery();
  const { data: studentsNeedingAnalysis } = trpc.students.needsAnalysis.useQuery();
  const utils = trpc.useUtils();
  
  // Estado para modal de edição de sessão
  const [editingSession, setEditingSession] = useState<any>(null);
  const [editSessionStatus, setEditSessionStatus] = useState<string>('');
  const [editSessionNotes, setEditSessionNotes] = useState<string>('');
  const [sendReminder, setSendReminder] = useState(false);
  
  const updateSessionMutation = trpc.sessions.update.useMutation({
    onSuccess: () => {
      toast.success("Sessão atualizada com sucesso!");
      utils.dashboard.todaySessions.invalidate();
      utils.dashboard.stats.invalidate();
      setEditingSession(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar sessão: " + error.message);
    },
  });

  const openEditModal = (session: any, student: any) => {
    setEditingSession({ ...session, student });
    setEditSessionStatus(session.status);
    setEditSessionNotes(session.notes || '');
    setSendReminder(false);
  };

  const handleSaveSession = () => {
    if (editingSession) {
      updateSessionMutation.mutate({
        id: editingSession.id,
        status: editSessionStatus as any,
        notes: editSessionNotes,
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation('/alunos?new=true')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Aluno
            </Button>
            <Button onClick={() => setLocation('/agenda?new=true')}>
              <Calendar className="h-4 w-4 mr-2" />
              Nova Sessão
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.totalStudents || 0}</div>
                  <p className="text-xs text-muted-foreground">alunos ativos</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-28" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.monthlyRevenue || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.pendingCharges || 0} cobranças pendentes
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sessões do Mês</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.sessionsThisMonth || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.completedSessions || 0} realizadas
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.attendanceRate || 0}%</div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.noShowSessions || 0} faltas no mês
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alunos que Precisam de Análise */}
        {studentsNeedingAnalysis && studentsNeedingAnalysis.length > 0 && (
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Brain className="h-5 w-5" />
                Análise de Evolução Pendente
              </CardTitle>
              <CardDescription>
                {studentsNeedingAnalysis.length} aluno(s) precisam de nova análise (mais de 30 dias)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {studentsNeedingAnalysis.slice(0, 5).map((student) => (
                  <div 
                    key={student.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-white/80 hover:bg-white transition-colors cursor-pointer border border-purple-100"
                    onClick={() => setLocation(`/alunos/${student.id}/medidas`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-sm font-semibold">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{student.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.daysSinceAnalysis 
                            ? `Última análise há ${student.daysSinceAnalysis} dias`
                            : 'Nunca analisado'
                          }
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-purple-600 hover:text-purple-700 hover:bg-purple-100">
                      <Sparkles className="h-4 w-4 mr-1" />
                      Analisar
                    </Button>
                  </div>
                ))}
                {studentsNeedingAnalysis.length > 5 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-purple-600 hover:text-purple-700"
                    onClick={() => setLocation('/alunos')}
                  >
                    Ver todos os {studentsNeedingAnalysis.length} alunos
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Agenda de Hoje
            </CardTitle>
            <CardDescription>
              {todaySessions?.length || 0} sessões agendadas para hoje
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            ) : todaySessions && todaySessions.length > 0 ? (
              <div className="space-y-4">
                {todaySessions.map(({ session, student }) => (
                  <div 
                    key={session.id} 
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => openEditModal(session, student)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.scheduledAt), "HH:mm")} - {session.duration || 60} min
                        </p>
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
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSessionMutation.mutate({ id: session.id, status: 'completed' });
                            }}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSessionMutation.mutate({ id: session.id, status: 'no_show' });
                            }}
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
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhuma sessão agendada para hoje</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => setLocation('/agenda?new=true')}
                >
                  Agendar nova sessão
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="card-hover cursor-pointer" onClick={() => setLocation('/cobrancas')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600" />
                Cobranças Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">{stats?.pendingCharges || 0}</p>
              <p className="text-sm text-muted-foreground">cobranças aguardando pagamento</p>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer" onClick={() => setLocation('/alunos')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Gerenciar Alunos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">{stats?.totalStudents || 0}</p>
              <p className="text-sm text-muted-foreground">alunos cadastrados</p>
            </CardContent>
          </Card>

          <Card className="card-hover cursor-pointer" onClick={() => setLocation('/agenda')}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                Ver Agenda Completa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">{stats?.sessionsThisMonth || 0}</p>
              <p className="text-sm text-muted-foreground">sessões este mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Modal de Edição de Sessão */}
        <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editando agendamento</DialogTitle>
            </DialogHeader>
            
            {editingSession && (
              <div className="space-y-6">
                {/* Informações do Cliente */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Informações</h4>
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-muted rounded-lg p-2 -mx-2"
                    onClick={() => {
                      setEditingSession(null);
                      setLocation(`/alunos/${editingSession.student.id}`);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                        {editingSession.student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-primary">{editingSession.student.name}</p>
                        <p className="text-sm text-muted-foreground">{editingSession.student.phone || 'Sem telefone'}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  
                  <div className="flex gap-4 mt-3 pt-3 border-t">
                    {editingSession.student.phone && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex-1 text-emerald-600"
                        onClick={() => window.open(`https://wa.me/55${editingSession.student.phone?.replace(/\D/g, '')}`, '_blank')}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Conversar
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex-1 text-blue-600"
                      onClick={() => {
                        setEditingSession(null);
                        setLocation(`/alunos/${editingSession.student.id}`);
                      }}
                    >
                      <User className="h-4 w-4 mr-2" />
                      Ver cliente
                    </Button>
                  </div>
                </div>

                {/* Data e Horário */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(editingSession.scheduledAt), "EEEE, dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  {/* Status */}
                  <div className="mb-3">
                    <Select value={editSessionStatus} onValueChange={setEditSessionStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            Agendada
                          </div>
                        </SelectItem>
                        <SelectItem value="confirmed">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            Confirmada
                          </div>
                        </SelectItem>
                        <SelectItem value="completed">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            Realizada
                          </div>
                        </SelectItem>
                        <SelectItem value="no_show">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            Falta
                          </div>
                        </SelectItem>
                        <SelectItem value="cancelled">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-500" />
                            Cancelada
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Horário e Duração */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Horário</Label>
                      <p className="font-medium">{format(new Date(editingSession.scheduledAt), "HH:mm")}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Duração</Label>
                      <p className="font-medium">{editingSession.duration || 60} min</p>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Ações</h4>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="send-reminder">Enviar lembrete</Label>
                    <Switch 
                      id="send-reminder" 
                      checked={sendReminder} 
                      onCheckedChange={setSendReminder} 
                    />
                  </div>
                </div>

                {/* Observação */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Observação</h4>
                  <Textarea
                    placeholder="Escreva aqui"
                    value={editSessionNotes}
                    onChange={(e) => setEditSessionNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditingSession(null)} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveSession}
                disabled={updateSessionMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateSessionMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
