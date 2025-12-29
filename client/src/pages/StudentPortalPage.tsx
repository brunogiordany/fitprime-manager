import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import StudentOnboarding from "@/components/StudentOnboarding";
import StudentEvolutionCharts from "@/components/StudentEvolutionCharts";
import StudentSessionManager from "@/components/StudentSessionManager";
import StudentChat from "@/components/StudentChat";
import StudentBadges from "@/components/StudentBadges";
import StudentFeedback from "@/components/StudentFeedback";
import StudentTrainingTips from "@/components/StudentTrainingTips";
import StudentProgressShare from "@/components/StudentProgressShare";
import { 
  Calendar, 
  Dumbbell, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronRight,
  User,
  Heart,
  Target,
  Activity,
  FileText,
  LogOut,
  Edit,
  Save,
  Loader2,
  MessageCircle,
  Trophy
} from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface StudentData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  createdAt: number;
  goal?: string | null;
}

interface AnamnesisData {
  id: number;
  occupation: string | null;
  sleepHours: number | null;
  stressLevel: string | null;
  medicalHistory: string | null;
  medications: string | null;
  injuries: string | null;
  allergies: string | null;
  mainGoal: string | null;
  secondaryGoals: string | null;
  targetWeight: string | null;
  observations: string | null;
}

export default function StudentPortalPage() {
  const [, setLocation] = useLocation();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isEditingAnamnesis, setIsEditingAnamnesis] = useState(false);
  const [anamnesisForm, setAnamnesisForm] = useState<Partial<AnamnesisData>>({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAnamnesisModal, setShowAnamnesisModal] = useState(false);

  // Verificar token do aluno
  useEffect(() => {
    const token = localStorage.getItem("studentToken");
    const storedData = localStorage.getItem("studentData");
    
    if (!token || !storedData) {
      setLocation("/login-aluno");
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setStudentData(data);
    } catch {
      localStorage.removeItem("studentToken");
      localStorage.removeItem("studentData");
      setLocation("/login-aluno");
    }
  }, [setLocation]);

  // Buscar anamnese do aluno
  const { data: anamnesis, refetch: refetchAnamnesis } = trpc.anamnesis.get.useQuery(
    { studentId: studentData?.id || 0 },
    { enabled: !!studentData?.id }
  );

  // Buscar sessões do aluno
  const { data: sessions, refetch: refetchSessions } = trpc.sessions.listByStudent.useQuery(
    { studentId: studentData?.id || 0 },
    { enabled: !!studentData?.id }
  );

  // Buscar medidas do aluno
  const { data: measurements, refetch: refetchMeasurements } = trpc.studentPortal.measurements.useQuery(
    undefined,
    { enabled: !!studentData?.id }
  );

  // Buscar permissões de edição do aluno
  const { data: editPermissions } = trpc.studentPortal.editPermissions.useQuery(
    undefined,
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

  // Mutation para atualizar anamnese
  const updateAnamneseMutation = trpc.anamnesis.saveWithMeasurements.useMutation({
    onSuccess: () => {
      toast.success("Anamnese atualizada com sucesso!");
      setIsEditingAnamnesis(false);
      refetchAnamnesis();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar anamnese");
    },
  });

  // Verificar se é primeiro acesso (sem anamnese preenchida)
  useEffect(() => {
    if (studentData && anamnesis !== undefined) {
      const hasAnamnesis = anamnesis && (
        anamnesis.mainGoal || 
        anamnesis.occupation || 
        anamnesis.medicalHistory
      );
      if (!hasAnamnesis) {
        setShowOnboarding(true);
      }
    }
  }, [studentData, anamnesis]);

  const handleLogout = () => {
    localStorage.removeItem("studentToken");
    localStorage.removeItem("studentData");
    setLocation("/login-aluno");
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    refetchAnamnesis();
  };

  const handleEditAnamnesis = () => {
    if (anamnesis) {
      setAnamnesisForm({
        occupation: anamnesis.occupation || "",
        sleepHours: anamnesis.sleepHours || undefined,
        stressLevel: anamnesis.stressLevel || "",
        medicalHistory: anamnesis.medicalHistory || "",
        medications: anamnesis.medications || "",
        injuries: anamnesis.injuries || "",
        allergies: anamnesis.allergies || "",
        mainGoal: anamnesis.mainGoal || "",
        secondaryGoals: anamnesis.secondaryGoals || "",
        targetWeight: anamnesis.targetWeight || "",
        observations: anamnesis.observations || "",
      });
    }
    setIsEditingAnamnesis(true);
  };

  const handleSaveAnamnesis = () => {
    if (!studentData) return;
    
    updateAnamneseMutation.mutate({
      studentId: studentData.id,
      occupation: anamnesisForm.occupation || undefined,
      sleepHours: anamnesisForm.sleepHours || undefined,
      stressLevel: anamnesisForm.stressLevel as any || undefined,
      medicalHistory: anamnesisForm.medicalHistory || undefined,
      medications: anamnesisForm.medications || undefined,
      injuries: anamnesisForm.injuries || undefined,
      allergies: anamnesisForm.allergies || undefined,
      mainGoal: anamnesisForm.mainGoal as any || undefined,
      secondaryGoals: anamnesisForm.secondaryGoals || undefined,
      targetWeight: anamnesisForm.targetWeight || undefined,
      observations: anamnesisForm.observations || undefined,
    });
  };

  if (!studentData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <StudentOnboarding
        studentId={studentData.id}
        studentName={studentData.name}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Filtrar sessões
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingSessions = sessions?.filter(s => {
    const sessionDate = new Date(s.date);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate >= today && s.status !== 'cancelled';
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 5) || [];

  const pendingCharges = charges?.filter(c => c.status === 'pending') || [];

  // Calcular progresso do perfil
  const profileFields = [
    anamnesis?.occupation,
    anamnesis?.mainGoal,
    anamnesis?.medicalHistory,
    anamnesis?.sleepHours,
    anamnesis?.stressLevel,
  ];
  const filledFields = profileFields.filter(f => f).length;
  const profileProgress = Math.round((filledFields / profileFields.length) * 100);

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

  const getGoalLabel = (goal: string | null) => {
    const goals: Record<string, string> = {
      weight_loss: "Perder peso",
      muscle_gain: "Ganhar massa muscular",
      conditioning: "Melhorar condicionamento",
      health: "Melhorar saúde geral",
      rehabilitation: "Reabilitação",
      sports: "Performance esportiva",
      other: "Outro",
    };
    return goal ? goals[goal] || goal : "-";
  };

  const getStressLabel = (level: string | null) => {
    const levels: Record<string, string> = {
      low: "Baixo",
      moderate: "Médio",
      high: "Alto",
      very_high: "Muito alto",
    };
    return level ? levels[level] || level : "-";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg">FitPrime</h1>
              <p className="text-sm text-gray-500">Portal do Aluno</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-medium">{studentData.name}</p>
              <p className="text-sm text-gray-500">{studentData.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Profile Progress */}
        {profileProgress < 100 && (
          <Card 
            className="mb-6 border-emerald-200 bg-emerald-50 cursor-pointer hover:bg-emerald-100 transition-colors"
            onClick={() => {
              setActiveTab("anamnesis");
              setIsEditingAnamnesis(true);
            }}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-emerald-800">Complete seu perfil</span>
                <span className="text-sm text-emerald-600">{profileProgress}%</span>
              </div>
              <Progress value={profileProgress} className="h-2" />
              <p className="text-xs text-emerald-700 mt-2">
                Preencha sua anamnese para que seu personal possa criar treinos personalizados
              </p>
              <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700">
                <Edit className="h-4 w-4 mr-2" />
                Completar Agora
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Menu de navegação em grid para mobile */}
          <TabsList className="bg-white border grid grid-cols-4 sm:flex sm:flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="dashboard" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs sm:text-sm">
              <Calendar className="h-4 w-4" />
              <span>Início</span>
            </TabsTrigger>
            <TabsTrigger value="evolution" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs sm:text-sm">
              <Activity className="h-4 w-4" />
              <span>Evolução</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs sm:text-sm">
              <Clock className="h-4 w-4" />
              <span>Sessões</span>
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs sm:text-sm">
              <Dumbbell className="h-4 w-4" />
              <span>Treinos</span>
            </TabsTrigger>
            <TabsTrigger value="anamnesis" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4" />
              <span>Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs sm:text-sm">
              <CreditCard className="h-4 w-4" />
              <span>Pagar</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs sm:text-sm">
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs sm:text-sm">
              <Trophy className="h-4 w-4" />
              <span>Conquistas</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Feedback pendente */}
            <StudentFeedback />
            
            {/* Lembretes de Treino */}
            <StudentTrainingTips 
              nextSession={upcomingSessions[0]} 
              studentGoal={studentData?.goal || undefined}
            />
            
            {/* Compartilhar Progresso */}
            {studentData && (
              <StudentProgressShare
                studentName={studentData.name}
                progressData={{
                  totalSessions: upcomingSessions.length + (sessions?.filter((s: any) => s.status === 'completed').length || 0),
                  completedSessions: sessions?.filter((s: any) => s.status === 'completed').length || 0,
                  currentStreak: 0, // Calculado baseado em sessões consecutivas
                  totalBadges: 0, // Seria buscado via query
                  memberSince: new Date(studentData.createdAt),
                }}
              />
            )}
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Próximas Sessões */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-500" />
                    Próximas Sessões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingSessions.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingSessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {format(new Date(session.date), "EEEE, dd/MM", { locale: ptBR })}
                            </p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(session.date), "HH:mm")} - {session.duration} min
                            </p>
                          </div>
                          {getStatusBadge(session.status)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Nenhuma sessão agendada</p>
                  )}
                </CardContent>
              </Card>

              {/* Cobranças Pendentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-amber-500" />
                    Cobranças Pendentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendingCharges.length > 0 ? (
                    <div className="space-y-3">
                      {pendingCharges.slice(0, 5).map((charge) => (
                        <div key={charge.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                          <div>
                            <p className="font-medium">{charge.description}</p>
                            <p className="text-sm text-gray-500">
                              Vence: {format(new Date(charge.dueDate), "dd/MM/yyyy")}
                            </p>
                          </div>
                          <span className="font-bold text-amber-600">
                            R$ {(Number(charge.amount) / 100).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-500">Nenhuma cobrança pendente</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Evolution Tab */}
          <TabsContent value="evolution" className="space-y-6">
            <StudentEvolutionCharts
              measurements={measurements || []}
              sessions={sessions || []}
              canEditMeasurements={editPermissions?.canEditMeasurements || false}
              onMeasurementsUpdate={() => refetchMeasurements()}
            />
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <StudentSessionManager
              sessions={sessions || []}
              onUpdate={() => refetchSessions()}
            />
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts" className="space-y-6">
            {editPermissions?.canViewWorkouts === false ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-amber-800 mb-2">Acesso Bloqueado</h3>
                  <p className="text-amber-700">A visualização de treinos está bloqueada pelo seu personal.</p>
                </CardContent>
              </Card>
            ) : (
            <Card>
              <CardHeader>
                <CardTitle>Meus Treinos</CardTitle>
                <CardDescription>Treinos criados pelo seu personal trainer</CardDescription>
              </CardHeader>
              <CardContent>
                {workouts && workouts.length > 0 ? (
                  <div className="space-y-4">
                    {workouts.map((workout) => (
                      <div key={workout.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{workout.name}</h3>
                          <Badge variant={workout.status === 'active' ? 'default' : 'secondary'}>
                            {workout.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        {workout.description && (
                          <p className="text-sm text-gray-600 mb-3">{workout.description}</p>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full mt-2"
                          onClick={() => setLocation(`/meu-portal/treino/${workout.id}`)}
                        >
                          <Dumbbell className="h-4 w-4 mr-2" />
                          Ver Treino
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Dumbbell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum treino cadastrado ainda</p>
                    <p className="text-sm text-gray-400">Seu personal irá criar seus treinos em breve</p>
                  </div>
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* Anamnesis Tab */}
          <TabsContent value="anamnesis" className="space-y-6">
            {/* Aviso de permissão bloqueada - só mostra se perfil já foi preenchido */}
            {!editPermissions?.canEditAnamnesis && profileProgress >= 100 && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="font-medium text-amber-800">Edição de anamnese bloqueada</p>
                      <p className="text-sm text-amber-700">Solicite ao seu personal para liberar a edição da anamnese</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Minha Anamnese</CardTitle>
                  <CardDescription>Suas informações de saúde e objetivos</CardDescription>
                </div>
                {/* Permitir edição se: 1) personal liberou OU 2) perfil ainda não foi preenchido */}
                {(editPermissions?.canEditAnamnesis || profileProgress < 100) && (
                  !isEditingAnamnesis ? (
                    <Button onClick={handleEditAnamnesis} variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsEditingAnamnesis(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleSaveAnamnesis} disabled={updateAnamneseMutation.isPending}>
                        {updateAnamneseMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar
                      </Button>
                    </div>
                  )
                )}
              </CardHeader>
              <CardContent>
                {isEditingAnamnesis ? (
                  <div className="space-y-6">
                    {/* Dados Pessoais */}
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Dados Pessoais
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Ocupação</Label>
                          <Input
                            value={anamnesisForm.occupation || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, occupation: e.target.value })}
                            placeholder="Ex: Desenvolvedor, Professor..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Horas de sono</Label>
                          <Select
                            value={anamnesisForm.sleepHours?.toString() || ""}
                            onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, sleepHours: parseInt(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="4">Menos de 5h</SelectItem>
                              <SelectItem value="5">5-6h</SelectItem>
                              <SelectItem value="7">7-8h</SelectItem>
                              <SelectItem value="9">Mais de 8h</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Nível de estresse</Label>
                          <Select
                            value={anamnesisForm.stressLevel || ""}
                            onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, stressLevel: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Baixo</SelectItem>
                              <SelectItem value="moderate">Médio</SelectItem>
                              <SelectItem value="high">Alto</SelectItem>
                              <SelectItem value="very_high">Muito alto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Saúde */}
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Saúde
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Histórico médico</Label>
                          <Textarea
                            value={anamnesisForm.medicalHistory || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, medicalHistory: e.target.value })}
                            placeholder="Condições de saúde, doenças crônicas..."
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Medicamentos</Label>
                            <Input
                              value={anamnesisForm.medications || ""}
                              onChange={(e) => setAnamnesisForm({ ...anamnesisForm, medications: e.target.value })}
                              placeholder="Medicamentos em uso"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Alergias</Label>
                            <Input
                              value={anamnesisForm.allergies || ""}
                              onChange={(e) => setAnamnesisForm({ ...anamnesisForm, allergies: e.target.value })}
                              placeholder="Alergias conhecidas"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Lesões ou limitações</Label>
                          <Textarea
                            value={anamnesisForm.injuries || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, injuries: e.target.value })}
                            placeholder="Lesões, cirurgias, limitações físicas..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Objetivos */}
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Objetivos
                      </h3>
                      <div className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Objetivo principal</Label>
                            <Select
                              value={anamnesisForm.mainGoal || ""}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, mainGoal: v })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="weight_loss">Perder peso</SelectItem>
                                <SelectItem value="muscle_gain">Ganhar massa muscular</SelectItem>
                                <SelectItem value="conditioning">Melhorar condicionamento</SelectItem>
                                <SelectItem value="health">Melhorar saúde geral</SelectItem>
                                <SelectItem value="rehabilitation">Reabilitação</SelectItem>
                                <SelectItem value="sports">Performance esportiva</SelectItem>
                                <SelectItem value="other">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Peso desejado (kg)</Label>
                            <Input
                              value={anamnesisForm.targetWeight || ""}
                              onChange={(e) => setAnamnesisForm({ ...anamnesisForm, targetWeight: e.target.value })}
                              placeholder="Ex: 70"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Objetivos secundários</Label>
                          <Textarea
                            value={anamnesisForm.secondaryGoals || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, secondaryGoals: e.target.value })}
                            placeholder="Outros objetivos que você gostaria de alcançar..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Observações */}
                    <div className="space-y-2">
                      <Label>Observações adicionais</Label>
                      <Textarea
                        value={anamnesisForm.observations || ""}
                        onChange={(e) => setAnamnesisForm({ ...anamnesisForm, observations: e.target.value })}
                        placeholder="Outras informações que você gostaria de compartilhar..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Visualização */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Dados Pessoais
                        </h3>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Ocupação:</dt>
                            <dd>{anamnesis?.occupation || "-"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Horas de sono:</dt>
                            <dd>{anamnesis?.sleepHours ? `${anamnesis.sleepHours}h` : "-"}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Nível de estresse:</dt>
                            <dd>{getStressLabel(anamnesis?.stressLevel || null)}</dd>
                          </div>
                        </dl>
                      </div>

                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Objetivos
                        </h3>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Objetivo principal:</dt>
                            <dd>{getGoalLabel(anamnesis?.mainGoal || null)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Peso desejado:</dt>
                            <dd>{anamnesis?.targetWeight ? `${anamnesis.targetWeight} kg` : "-"}</dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Saúde
                      </h3>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-gray-500">Histórico médico:</dt>
                          <dd className="mt-1">{anamnesis?.medicalHistory || "-"}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Medicamentos:</dt>
                          <dd className="mt-1">{anamnesis?.medications || "-"}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Lesões/Limitações:</dt>
                          <dd className="mt-1">{anamnesis?.injuries || "-"}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-500">Alergias:</dt>
                          <dd className="mt-1">{anamnesis?.allergies || "-"}</dd>
                        </div>
                      </dl>
                    </div>

                    {anamnesis?.observations && (
                      <div>
                        <h3 className="font-semibold mb-3">Observações</h3>
                        <p className="text-sm text-gray-600">{anamnesis.observations}</p>
                      </div>
                    )}

                    {!anamnesis?.mainGoal && (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Anamnese não preenchida</p>
                        <Button className="mt-4" onClick={() => setShowOnboarding(true)}>
                          Preencher agora
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-6">
            {editPermissions?.canViewCharges === false ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="font-semibold text-amber-800 mb-2">Acesso Bloqueado</h3>
                  <p className="text-amber-700">A visualização de cobranças está bloqueada pelo seu personal.</p>
                </CardContent>
              </Card>
            ) : (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Pagamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {charges && charges.length > 0 ? (
                  <div className="space-y-3">
                    {charges.map((charge) => (
                      <div key={charge.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{charge.description}</p>
                          <p className="text-sm text-gray-500">
                            Vencimento: {format(new Date(charge.dueDate), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">R$ {(Number(charge.amount) / 100).toFixed(2)}</p>
                          <Badge variant={charge.status === 'paid' ? 'default' : charge.status === 'pending' ? 'secondary' : 'destructive'}>
                            {charge.status === 'paid' ? 'Pago' : charge.status === 'pending' ? 'Pendente' : 'Cancelado'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Nenhuma cobrança encontrada</p>
                )}
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <StudentChat />
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-6">
            <StudentBadges />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
