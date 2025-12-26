import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  Dumbbell, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  User
} from "lucide-react";
import { useLocation } from "wouter";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Buscar dados do aluno logado
  const { data: studentData } = trpc.students.getByUserId.useQuery(
    { userId: user?.openId || "" },
    { enabled: !!user?.openId }
  );

  // Buscar sessões do aluno
  const { data: sessions } = trpc.sessions.listByStudent.useQuery(
    { studentId: studentData?.id || 0 },
    { enabled: !!studentData?.id }
  );

  // Buscar treinos do aluno
  const { data: workouts } = trpc.workouts.list.useQuery(
    { studentId: studentData?.id || 0 },
    { enabled: !!studentData?.id }
  );

  // Buscar cobranças do aluno
  const { data: charges } = trpc.charges.listByStudent.useQuery(
    { studentId: studentData?.id || 0 },
    { enabled: !!studentData?.id }
  );

  // Filtrar sessões
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingSessions = sessions?.filter(s => {
    const sessionDate = new Date(s.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate >= today && s.status !== 'cancelled';
  }).slice(0, 5) || [];

  const pastSessions = sessions?.filter(s => {
    const sessionDate = new Date(s.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate < today;
  }).slice(0, 10) || [];

  // Filtrar cobranças pendentes
  const pendingCharges = charges?.filter(c => c.status === 'pending') || [];
  const paidCharges = charges?.filter(c => c.status === 'paid') || [];

  // Estatísticas
  const totalSessions = sessions?.length || 0;
  const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;
  const missedSessions = sessions?.filter(s => s.status === 'no_show').length || 0;
  const attendanceRate = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Agendada</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Confirmada</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Realizada</Badge>;
      case 'missed':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Falta</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getChargeStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendente</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pago</Badge>;
      case 'overdue':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Atrasado</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!studentData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Conta não vinculada</h2>
            <p className="text-muted-foreground">
              Sua conta ainda não está vinculada a um perfil de aluno.
              Entre em contato com seu personal trainer.
            </p>
          </div>
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
            <h1 className="text-2xl font-bold tracking-tight">
              Olá, {studentData.name?.split(' ')[0]}!
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Próximas Sessões</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingSessions.length}</div>
              <p className="text-xs text-muted-foreground">agendadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Presença</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">{completedSessions} realizadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Treinos Ativos</CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workouts?.length || 0}</div>
              <p className="text-xs text-muted-foreground">disponíveis</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingCharges.length}</div>
              <p className="text-xs text-muted-foreground">
                {pendingCharges.length > 0 
                  ? `R$ ${pendingCharges.reduce((acc, c) => acc + (Number(c.amount) || 0), 0).toFixed(2)}`
                  : 'em dia'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="agenda" className="space-y-4">
          <TabsList>
            <TabsTrigger value="agenda">Agenda</TabsTrigger>
            <TabsTrigger value="treinos">Treinos</TabsTrigger>
            <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
          </TabsList>

          {/* Aba Agenda */}
          <TabsContent value="agenda" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Próximas Sessões */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Próximas Sessões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingSessions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma sessão agendada
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                              <span className="text-xs font-medium">
                                {format(new Date(session.date), "MMM", { locale: ptBR }).toUpperCase()}
                              </span>
                              <span className="text-lg font-bold">
                                {format(new Date(session.date), "dd")}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">
                                {format(new Date(session.date), "EEEE", { locale: ptBR })}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(session.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {session.duration} min
                              </p>
                            </div>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Histórico */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Histórico Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pastSessions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhuma sessão realizada
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {pastSessions.map((session) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <p className="font-medium">
                              {format(new Date(session.date), "dd/MM/yyyy")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(session.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {session.duration} min
                            </p>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Treinos */}
          <TabsContent value="treinos" className="space-y-4">
            {workouts?.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum treino disponível</h3>
                    <p className="text-muted-foreground">
                      Seu personal ainda não criou treinos para você.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workouts?.map((workout: any) => (
                  <Card 
                    key={workout.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setLocation(`/treino/${workout.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{workout.name}</span>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        {workout.description || "Sem descrição"}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{workout.type}</Badge>
                        <Badge variant="outline">{workout.difficulty}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba Pagamentos */}
          <TabsContent value="pagamentos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Pendentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Pagamentos Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingCharges.length === 0 ? (
                    <div className="text-center py-4">
                      <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                      <p className="text-muted-foreground">Você está em dia!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pendingCharges.map((charge) => (
                        <div
                          key={charge.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-yellow-50"
                        >
                          <div>
                            <p className="font-medium">
                              {charge.description || "Mensalidade"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Vencimento: {format(new Date(charge.dueDate), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              R$ {(Number(charge.amount) || 0).toFixed(2)}
                            </p>
                            {getChargeStatusBadge(charge.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Histórico de Pagamentos */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Histórico de Pagamentos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paidCharges.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Nenhum pagamento registrado
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {paidCharges.slice(0, 10).map((charge) => (
                        <div
                          key={charge.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <p className="font-medium">
                              {charge.description || "Mensalidade"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Pago em: {charge.paidAt ? format(new Date(charge.paidAt), "dd/MM/yyyy") : "-"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              R$ {(Number(charge.amount) || 0).toFixed(2)}
                            </p>
                            {getChargeStatusBadge(charge.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
