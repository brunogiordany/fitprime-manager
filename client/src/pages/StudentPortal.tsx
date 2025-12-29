import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  Dumbbell, 
  Calendar,
  CreditCard,
  FileText,
  Camera,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ChevronRight,
  Activity
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function StudentPortal() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const { data: profile, isLoading: profileLoading } = trpc.studentPortal.profile.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: workouts, isLoading: workoutsLoading } = trpc.studentPortal.workouts.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: sessions, isLoading: sessionsLoading } = trpc.studentPortal.sessions.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: charges, isLoading: chargesLoading } = trpc.studentPortal.charges.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: photos, isLoading: photosLoading } = trpc.studentPortal.photos.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: anamnesis, isLoading: anamnesisLoading } = trpc.studentPortal.anamnesis.useQuery(
    undefined,
    { enabled: !!user }
  );

  const isLoading = authLoading || profileLoading;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Portal do Aluno</CardTitle>
            <CardDescription>
              Faça login para acessar seus treinos, agenda e mais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você não está cadastrado como aluno. Entre em contato com seu personal trainer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatCurrency = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700">Agendada</Badge>;
      case 'confirmed':
        return <Badge className="bg-emerald-100 text-emerald-700">Confirmada</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-700">Concluída</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getChargeStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-emerald-100 text-emerald-700">Pago</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Atrasado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const upcomingSessions = sessions?.filter(s => 
    new Date(s.scheduledAt) >= new Date() && s.status !== 'cancelled'
  ).slice(0, 3) || [];

  const pendingCharges = charges?.filter(c => 
    c.status === 'pending' || c.status === 'overdue'
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">FitPrime</h1>
              <p className="text-xs text-muted-foreground">Portal do Aluno</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              Olá, {profile.name?.split(' ')[0]}
            </span>
            <Button variant="ghost" size="icon" onClick={() => logout()}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Card */}
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile.name}</h2>
                <p className="text-emerald-100">
                  {profile.status === 'active' ? 'Aluno Ativo' : 'Status: ' + profile.status}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <Calendar className="h-6 w-6 mx-auto text-emerald-600 mb-2" />
              <p className="text-2xl font-bold">{upcomingSessions.length}</p>
              <p className="text-xs text-muted-foreground">Próximas Sessões</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Dumbbell className="h-6 w-6 mx-auto text-blue-600 mb-2" />
              <p className="text-2xl font-bold">{workouts?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Treinos Ativos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <Camera className="h-6 w-6 mx-auto text-purple-600 mb-2" />
              <p className="text-2xl font-bold">{photos?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Fotos de Evolução</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <CreditCard className="h-6 w-6 mx-auto text-yellow-600 mb-2" />
              <p className="text-2xl font-bold">{pendingCharges.length}</p>
              <p className="text-xs text-muted-foreground">Pagamentos Pendentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="workouts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="workouts" className="text-xs sm:text-sm">
              <Dumbbell className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Treinos</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="text-xs sm:text-sm">
              <Calendar className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs sm:text-sm">
              <CreditCard className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Pagamentos</span>
            </TabsTrigger>
            <TabsTrigger value="photos" className="text-xs sm:text-sm">
              <Camera className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Fotos</span>
            </TabsTrigger>
            <TabsTrigger value="anamnesis" className="text-xs sm:text-sm">
              <FileText className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Anamnese</span>
            </TabsTrigger>
          </TabsList>

          {/* Workouts Tab */}
          <TabsContent value="workouts" className="space-y-4">
            {workoutsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : workouts && workouts.length > 0 ? (
              workouts.map((workout) => (
                <Card key={workout.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{workout.name}</CardTitle>
                      <Badge variant={workout.status === 'active' ? "default" : "secondary"}>
                        {workout.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    {workout.description && (
                      <CardDescription>{workout.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground mb-4">
                      <p>Tipo: {workout.type || 'Não especificado'}</p>
                      {workout.difficulty && <p>Dificuldade: {workout.difficulty}</p>}
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                      onClick={() => setLocation(`/portal/treino/${workout.id}`)}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Registrar Treino
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Dumbbell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">Nenhum treino disponível</p>
                  <p className="text-muted-foreground text-sm">
                    Seu personal trainer ainda não criou treinos para você
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            {sessionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : sessions && sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session: any) => (
                  <Card key={session.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            session.status === 'completed' 
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {format(new Date(session.scheduledAt), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(session.scheduledAt), "HH:mm")}
                              {session.location && (
                                <>
                                  <span>•</span>
                                  <span>{session.location}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(session.status)}
                      </div>
                      
                      {/* Treino Vinculado */}
                      {session.workoutInfo && (
                        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                          <div className="flex items-center gap-2 mb-2">
                            <Dumbbell className="h-4 w-4 text-emerald-600" />
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              Treino {String.fromCharCode(65 + (session.workoutDayIndex || 0))}: {session.workoutInfo.dayName || 'Treino do Dia'}
                            </span>
                          </div>
                          {session.workoutInfo.exercises && session.workoutInfo.exercises.length > 0 && (
                            <div className="space-y-1">
                              {session.workoutInfo.exercises.map((exercise: any, idx: number) => (
                                <div key={idx} className="text-sm flex justify-between items-center py-1 border-b border-emerald-100 dark:border-emerald-900 last:border-0">
                                  <span className="text-gray-700 dark:text-gray-300">{exercise.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {exercise.sets}x{exercise.reps} {exercise.rest && `• ${exercise.rest}s`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">Nenhuma sessão agendada</p>
                  <p className="text-muted-foreground text-sm">
                    Entre em contato com seu personal para agendar
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            {chargesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : charges && charges.length > 0 ? (
              <div className="space-y-3">
                {charges.map((charge) => (
                  <Card key={charge.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{charge.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {format(new Date(charge.dueDate), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(charge.amount)}</p>
                          {getChargeStatusBadge(charge.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CreditCard className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">Nenhuma cobrança</p>
                  <p className="text-muted-foreground text-sm">
                    Você não possui cobranças registradas
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-4">
            {photosLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square" />
                ))}
              </div>
            ) : photos && photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {photos.map((photo) => (
                  <Card key={photo.id} className="overflow-hidden">
                    <div className="aspect-square bg-muted relative">
                      <img 
                        src={photo.url} 
                        alt={photo.category || 'Foto de evolução'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(photo.photoDate), "dd/MM/yyyy")}
                      </p>
                      {photo.category && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {photo.category}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Camera className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">Nenhuma foto de evolução</p>
                  <p className="text-muted-foreground text-sm">
                    Seu personal trainer ainda não adicionou fotos
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Anamnesis Tab */}
          <TabsContent value="anamnesis" className="space-y-4">
            {anamnesisLoading ? (
              <Skeleton className="h-64" />
            ) : anamnesis ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Sua Anamnese
                  </CardTitle>
                  <CardDescription>
                    Última atualização: {format(new Date(anamnesis.updatedAt), "dd/MM/yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {anamnesis.mainGoal && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Objetivo Principal</h4>
                      <Badge variant="outline">{anamnesis.mainGoal}</Badge>
                    </div>
                  )}
                  {anamnesis.medicalHistory && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Histórico Médico</h4>
                      <p>{anamnesis.medicalHistory}</p>
                    </div>
                  )}
                  {anamnesis.injuries && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Lesões</h4>
                      <p>{anamnesis.injuries}</p>
                    </div>
                  )}
                  {anamnesis.medications && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Medicamentos</h4>
                      <p>{anamnesis.medications}</p>
                    </div>
                  )}
                  {anamnesis.lifestyle && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Nível de Atividade</h4>
                      <Badge variant="outline">{anamnesis.lifestyle}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">Anamnese não preenchida</p>
                  <p className="text-muted-foreground text-sm">
                    Seu personal trainer ainda não registrou sua anamnese
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
