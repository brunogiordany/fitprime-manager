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
// StudentProgressShare removido - agora usamos ShareProgressCard contextual
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
  Trophy,
  Play,
  Plus,
  Minus
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  lifestyle: string | null;
  medicalHistory: string | null;
  medications: string | null;
  injuries: string | null;
  surgeries: string | null;
  allergies: string | null;
  mainGoal: string | null;
  secondaryGoals: string | null;
  targetWeight: string | null;
  exerciseExperience: string | null;
  observations: string | null;
  // Nutrição
  mealsPerDay: number | null;
  waterIntake: string | null;
  dailyCalories: number | null;
  dietRestrictions: string | null;
  supplements: string | null;
  doesCardio: boolean;
  cardioActivities: string | null;
  // Preferências de treino
  weeklyFrequency: number | null;
  sessionDuration: number | null;
  preferredTime: string | null;
  trainingLocation: string | null;
  availableEquipment: string | null;
  // Restrições e ênfases
  trainingRestrictions: string | null;
  restrictionNotes: string | null;
  muscleEmphasis: string | null;
}

export default function StudentPortalPage() {
  const [, setLocation] = useLocation();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isEditingAnamnesis, setIsEditingAnamnesis] = useState(false);
  const [anamnesisForm, setAnamnesisForm] = useState<Partial<AnamnesisData>>({});
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [diaryExercises, setDiaryExercises] = useState<any[]>([]);
  const [diaryNotes, setDiaryNotes] = useState("");
  const [diaryFeeling, setDiaryFeeling] = useState<string>("");
  const [diaryDuration, setDiaryDuration] = useState(60);
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

  // Buscar registros de treino do aluno (para o diário)
  const { data: workoutLogs, refetch: refetchWorkoutLogs } = trpc.studentPortal.workoutLogs.useQuery(
    undefined,
    { enabled: !!studentData?.id }
  );

  // Buscar sessões do portal do aluno (com informações de treino)
  const { data: portalSessions, refetch: refetchPortalSessions } = trpc.studentPortal.sessions.useQuery(
    undefined,
    { enabled: !!studentData?.id }
  );

  // Mutation para criar registro de treino
  const createWorkoutLogMutation = trpc.studentPortal.createWorkoutLog.useMutation({
    onSuccess: () => {
      toast.success("Treino registrado com sucesso!");
      setShowDiaryModal(false);
      setSelectedSession(null);
      setDiaryExercises([]);
      setDiaryNotes("");
      setDiaryFeeling("");
      refetchWorkoutLogs();
      refetchPortalSessions();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar treino");
    },
  });

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
      const anamnesisAny = anamnesis as any;
      setAnamnesisForm({
        occupation: anamnesis.occupation || "",
        sleepHours: anamnesis.sleepHours || undefined,
        stressLevel: anamnesis.stressLevel || "",
        lifestyle: anamnesisAny.lifestyle || "",
        medicalHistory: anamnesis.medicalHistory || "",
        medications: anamnesis.medications || "",
        injuries: anamnesis.injuries || "",
        surgeries: anamnesisAny.surgeries || "",
        allergies: anamnesis.allergies || "",
        mainGoal: anamnesis.mainGoal || "",
        secondaryGoals: anamnesis.secondaryGoals || "",
        targetWeight: anamnesis.targetWeight || "",
        exerciseExperience: anamnesisAny.exerciseExperience || "",
        observations: anamnesis.observations || "",
        // Nutrição
        mealsPerDay: anamnesisAny.mealsPerDay || undefined,
        waterIntake: anamnesisAny.waterIntake || "",
        dailyCalories: anamnesisAny.dailyCalories || undefined,
        dietRestrictions: anamnesisAny.dietRestrictions || "",
        supplements: anamnesisAny.supplements || "",
        doesCardio: anamnesisAny.doesCardio || false,
        cardioActivities: anamnesisAny.cardioActivities || null,
        // Preferências de treino
        weeklyFrequency: anamnesisAny.weeklyFrequency || undefined,
        sessionDuration: anamnesisAny.sessionDuration || undefined,
        preferredTime: anamnesisAny.preferredTime || "",
        trainingLocation: anamnesisAny.trainingLocation || "",
        availableEquipment: anamnesisAny.availableEquipment || null,
        // Restrições e ênfases
        trainingRestrictions: anamnesisAny.trainingRestrictions || null,
        restrictionNotes: anamnesisAny.restrictionNotes || "",
        muscleEmphasis: anamnesisAny.muscleEmphasis || null,
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
      lifestyle: anamnesisForm.lifestyle as any || undefined,
      medicalHistory: anamnesisForm.medicalHistory || undefined,
      medications: anamnesisForm.medications || undefined,
      injuries: anamnesisForm.injuries || undefined,
      surgeries: anamnesisForm.surgeries || undefined,
      allergies: anamnesisForm.allergies || undefined,
      mainGoal: anamnesisForm.mainGoal as any || undefined,
      secondaryGoals: anamnesisForm.secondaryGoals || undefined,
      targetWeight: anamnesisForm.targetWeight || undefined,
      exerciseExperience: anamnesisForm.exerciseExperience as any || undefined,
      observations: anamnesisForm.observations || undefined,
      // Nutrição
      mealsPerDay: anamnesisForm.mealsPerDay || undefined,
      waterIntake: anamnesisForm.waterIntake as any || undefined,
      dailyCalories: anamnesisForm.dailyCalories || undefined,
      dietRestrictions: anamnesisForm.dietRestrictions || undefined,
      supplements: anamnesisForm.supplements || undefined,
      doesCardio: anamnesisForm.doesCardio || false,
      cardioActivities: anamnesisForm.cardioActivities || undefined,
      // Preferências de treino
      weeklyFrequency: anamnesisForm.weeklyFrequency || undefined,
      sessionDuration: anamnesisForm.sessionDuration || undefined,
      preferredTime: anamnesisForm.preferredTime as any || undefined,
      trainingLocation: anamnesisForm.trainingLocation as any || undefined,
      availableEquipment: anamnesisForm.availableEquipment || undefined,
      // Restrições e ênfases
      trainingRestrictions: anamnesisForm.trainingRestrictions || undefined,
      restrictionNotes: anamnesisForm.restrictionNotes || undefined,
      muscleEmphasis: anamnesisForm.muscleEmphasis || undefined,
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
            <TabsTrigger value="diary" className="flex flex-col sm:flex-row items-center gap-1 py-2 px-2 text-xs sm:text-sm">
              <FileText className="h-4 w-4" />
              <span>Diário</span>
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
                      {upcomingSessions.map((session: any) => (
                        <div key={session.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
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
                          {(session.workoutName || session.workoutDayName) && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <p className="text-sm text-emerald-600 font-medium flex items-center gap-1">
                                <Dumbbell className="h-3 w-3" />
                                {session.workoutDayName || session.workoutName}
                              </p>
                              {session.workoutDayName && session.workoutName && (
                                <p className="text-xs text-gray-500">{session.workoutName}</p>
                              )}
                            </div>
                          )}
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

          {/* Diário de Treino Tab */}
          <TabsContent value="diary" className="space-y-6">
            {/* Sessões para Registrar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-emerald-500" />
                  Registrar Treino
                </CardTitle>
                <CardDescription>Selecione uma sessão para registrar seu treino</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const todaySessions = (portalSessions || []).filter((s: any) => {
                    const sessionDate = new Date(s.scheduledAt);
                    sessionDate.setHours(0, 0, 0, 0);
                    return sessionDate.getTime() === today.getTime() && 
                           (s.status === 'scheduled' || s.status === 'confirmed' || s.status === 'completed');
                  });
                  
                  const pendingSessions = (portalSessions || []).filter((s: any) => {
                    const sessionDate = new Date(s.scheduledAt);
                    sessionDate.setHours(0, 0, 0, 0);
                    return sessionDate.getTime() < today.getTime() && 
                           (s.status === 'scheduled' || s.status === 'confirmed');
                  });
                  
                  const upcomingSessions = (portalSessions || []).filter((s: any) => {
                    const sessionDate = new Date(s.scheduledAt);
                    sessionDate.setHours(0, 0, 0, 0);
                    return sessionDate.getTime() > today.getTime() && 
                           (s.status === 'scheduled' || s.status === 'confirmed');
                  }).slice(0, 5);
                  
                  const allSessions = [...todaySessions, ...pendingSessions, ...upcomingSessions];
                  
                  if (allSessions.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">Nenhuma sessão disponível</p>
                        <p className="text-sm">Você não tem sessões agendadas para registrar.</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-4">
                      {todaySessions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-emerald-600 mb-2 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Hoje
                          </h4>
                          <div className="space-y-2">
                            {todaySessions.map((session: any) => (
                              <div
                                key={session.id}
                                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={() => {
                                  if (session.workoutInfo) {
                                    setSelectedSession(session);
                                    setDiaryExercises(session.workoutInfo.exercises.map((ex: any) => ({
                                      exerciseId: 0,
                                      exerciseName: ex.name,
                                      sets: Array(ex.sets || 3).fill(null).map(() => ({ weight: '', reps: ex.reps || 0 })),
                                      notes: '',
                                      completed: false,
                                    })));
                                    setShowDiaryModal(true);
                                  } else {
                                    toast.error("Esta sessão não tem treino vinculado");
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {format(new Date(session.scheduledAt), "HH:mm", { locale: ptBR })}
                                    </p>
                                    {session.workoutInfo && (
                                      <p className="text-sm text-gray-500">
                                        {session.workoutInfo.workoutName} - {session.workoutInfo.dayName}
                                      </p>
                                    )}
                                  </div>
                                  <Button size="sm" variant="outline">
                                    <Play className="h-4 w-4 mr-1" />
                                    Registrar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {pendingSessions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-amber-600 mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Pendentes
                          </h4>
                          <div className="space-y-2">
                            {pendingSessions.map((session: any) => (
                              <div
                                key={session.id}
                                className="p-4 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 cursor-pointer transition-colors"
                                onClick={() => {
                                  if (session.workoutInfo) {
                                    setSelectedSession(session);
                                    setDiaryExercises(session.workoutInfo.exercises.map((ex: any) => ({
                                      exerciseId: 0,
                                      exerciseName: ex.name,
                                      sets: Array(ex.sets || 3).fill(null).map(() => ({ weight: '', reps: ex.reps || 0 })),
                                      notes: '',
                                      completed: false,
                                    })));
                                    setShowDiaryModal(true);
                                  } else {
                                    toast.error("Esta sessão não tem treino vinculado");
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {format(new Date(session.scheduledAt), "dd/MM - HH:mm", { locale: ptBR })}
                                    </p>
                                    {session.workoutInfo && (
                                      <p className="text-sm text-amber-700">
                                        {session.workoutInfo.workoutName} - {session.workoutInfo.dayName}
                                      </p>
                                    )}
                                  </div>
                                  <Button size="sm" variant="outline" className="border-amber-500 text-amber-700">
                                    <Play className="h-4 w-4 mr-1" />
                                    Registrar
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {upcomingSessions.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-600 mb-2 flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Próximas
                          </h4>
                          <div className="space-y-2">
                            {upcomingSessions.map((session: any) => (
                              <div
                                key={session.id}
                                className="p-4 border rounded-lg opacity-75"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {format(new Date(session.scheduledAt), "dd/MM - HH:mm", { locale: ptBR })}
                                    </p>
                                    {session.workoutInfo && (
                                      <p className="text-sm text-gray-500">
                                        {session.workoutInfo.workoutName} - {session.workoutInfo.dayName}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant="outline">Agendada</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
            
            {/* Histórico de Treinos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-500" />
                  Histórico de Treinos
                </CardTitle>
                <CardDescription>Seus treinos registrados</CardDescription>
              </CardHeader>
              <CardContent>
                {(!workoutLogs || workoutLogs.length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-medium">Nenhum treino registrado</p>
                    <p className="text-sm">Registre seu primeiro treino acima!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workoutLogs.slice(0, 10).map((log: any) => (
                      <div key={log.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{log.dayName || 'Treino'}</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(log.trainingDate), "dd/MM/yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant={log.status === 'completed' ? 'default' : 'outline'}>
                              {log.status === 'completed' ? 'Concluído' : 'Em andamento'}
                            </Badge>
                            {log.feeling && (
                              <p className="text-sm mt-1">
                                {log.feeling === 'excellent' && '🔥'}
                                {log.feeling === 'good' && '💪'}
                                {log.feeling === 'normal' && '😐'}
                                {log.feeling === 'tired' && '😓'}
                                {log.feeling === 'exhausted' && '😵'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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

                    {/* Estilo de Vida */}
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Estilo de Vida
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nível de atividade</Label>
                          <Select
                            value={anamnesisForm.lifestyle || ""}
                            onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, lifestyle: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sedentary">Sedentário</SelectItem>
                              <SelectItem value="light">Levemente ativo</SelectItem>
                              <SelectItem value="moderate">Moderadamente ativo</SelectItem>
                              <SelectItem value="active">Ativo</SelectItem>
                              <SelectItem value="very_active">Muito ativo</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Experiência com exercícios</Label>
                          <Select
                            value={anamnesisForm.exerciseExperience || ""}
                            onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, exerciseExperience: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma</SelectItem>
                              <SelectItem value="beginner">Iniciante (menos de 6 meses)</SelectItem>
                              <SelectItem value="intermediate">Intermediário (6 meses a 2 anos)</SelectItem>
                              <SelectItem value="advanced">Avançado (mais de 2 anos)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>Cirurgias</Label>
                        <Textarea
                          value={anamnesisForm.surgeries || ""}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, surgeries: e.target.value })}
                          placeholder="Cirurgias realizadas..."
                        />
                      </div>
                    </div>

                    {/* Nutrição */}
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Nutrição
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Refeições por dia</Label>
                          <Select
                            value={anamnesisForm.mealsPerDay?.toString() || ""}
                            onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, mealsPerDay: parseInt(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 refeição</SelectItem>
                              <SelectItem value="2">2 refeições</SelectItem>
                              <SelectItem value="3">3 refeições</SelectItem>
                              <SelectItem value="4">4 refeições</SelectItem>
                              <SelectItem value="5">5 refeições</SelectItem>
                              <SelectItem value="6">6+ refeições</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Consumo de água</Label>
                          <Select
                            value={anamnesisForm.waterIntake || ""}
                            onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, waterIntake: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="less_1l">Menos de 1L</SelectItem>
                              <SelectItem value="1_2l">1-2L</SelectItem>
                              <SelectItem value="2_3l">2-3L</SelectItem>
                              <SelectItem value="more_3l">Mais de 3L</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Calorias diárias (aproximado)</Label>
                          <Input
                            type="number"
                            value={anamnesisForm.dailyCalories || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, dailyCalories: parseInt(e.target.value) || undefined })}
                            placeholder="Ex: 2000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Faz cardio?</Label>
                          <Select
                            value={anamnesisForm.doesCardio ? "yes" : "no"}
                            onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, doesCardio: v === "yes" })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Sim</SelectItem>
                              <SelectItem value="no">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {anamnesisForm.doesCardio && (
                        <div className="space-y-2 mt-4">
                          <Label>Atividades cardio</Label>
                          <Input
                            value={anamnesisForm.cardioActivities || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, cardioActivities: e.target.value })}
                            placeholder="Ex: Corrida, Bicicleta, Natação..."
                          />
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                          <Label>Restrições alimentares</Label>
                          <Input
                            value={anamnesisForm.dietRestrictions || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, dietRestrictions: e.target.value })}
                            placeholder="Ex: Vegetariano, Intolerância a lactose..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Suplementos</Label>
                          <Input
                            value={anamnesisForm.supplements || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, supplements: e.target.value })}
                            placeholder="Ex: Whey, Creatina..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preferências de Treino */}
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Dumbbell className="h-4 w-4" />
                        Preferências de Treino
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Frequência semanal desejada</Label>
                          <Select
                            value={anamnesisForm.weeklyFrequency?.toString() || ""}
                            onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, weeklyFrequency: parseInt(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1x por semana</SelectItem>
                              <SelectItem value="2">2x por semana</SelectItem>
                              <SelectItem value="3">3x por semana</SelectItem>
                              <SelectItem value="4">4x por semana</SelectItem>
                              <SelectItem value="5">5x por semana</SelectItem>
                              <SelectItem value="6">6x por semana</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Duração da sessão (minutos)</Label>
                          <Select
                            value={anamnesisForm.sessionDuration?.toString() || ""}
                            onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, sessionDuration: parseInt(v) })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30 minutos</SelectItem>
                              <SelectItem value="45">45 minutos</SelectItem>
                              <SelectItem value="60">60 minutos</SelectItem>
                              <SelectItem value="75">75 minutos</SelectItem>
                              <SelectItem value="90">90 minutos</SelectItem>
                              <SelectItem value="120">120 minutos</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Horário preferido</Label>
                          <Select
                            value={anamnesisForm.preferredTime || ""}
                            onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, preferredTime: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="early_morning">Manhã cedo (5h-8h)</SelectItem>
                              <SelectItem value="morning">Manhã (8h-12h)</SelectItem>
                              <SelectItem value="afternoon">Tarde (12h-18h)</SelectItem>
                              <SelectItem value="evening">Noite (18h-22h)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Local de treino</Label>
                          <Select
                            value={anamnesisForm.trainingLocation || ""}
                            onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, trainingLocation: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="full_gym">Academia Completa</SelectItem>
                              <SelectItem value="home_gym">Academia em Casa</SelectItem>
                              <SelectItem value="home_basic">Casa (equipamentos básicos)</SelectItem>
                              <SelectItem value="outdoor">Ar Livre</SelectItem>
                              <SelectItem value="studio">Estúdio</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label>Equipamentos disponíveis</Label>
                        <Textarea
                          value={anamnesisForm.availableEquipment || ""}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, availableEquipment: e.target.value })}
                          placeholder="Ex: Halteres, Barra, Elásticos, Máquinas..."
                        />
                      </div>
                    </div>

                    {/* Restrições e Ênfases */}
                    <div>
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        Restrições e Ênfases
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Restrições de treino</Label>
                          <Textarea
                            value={anamnesisForm.trainingRestrictions || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, trainingRestrictions: e.target.value })}
                            placeholder="Ex: Evitar exercícios de impacto, Problemas no joelho..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Notas sobre restrições</Label>
                          <Textarea
                            value={anamnesisForm.restrictionNotes || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, restrictionNotes: e.target.value })}
                            placeholder="Detalhes adicionais sobre restrições..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ênfases musculares</Label>
                          <Textarea
                            value={anamnesisForm.muscleEmphasis || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, muscleEmphasis: e.target.value })}
                            placeholder="Ex: Glúteos, Peito, Costas..."
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
                    
                    {/* Botões Salvar e Cancelar no final do formulário */}
                    <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setIsEditingAnamnesis(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSaveAnamnesis}
                        disabled={updateAnamneseMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {updateAnamneseMutation.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</>
                        ) : (
                          <><Save className="h-4 w-4 mr-2" /> Salvar</>
                        )}
                      </Button>
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
      
      {/* Modal de Registro de Treino */}
      <Dialog open={showDiaryModal} onOpenChange={setShowDiaryModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-emerald-500" />
              Registrar Treino
            </DialogTitle>
            <DialogDescription>
              {selectedSession?.workoutInfo && (
                <span>
                  {selectedSession.workoutInfo.workoutName} - {selectedSession.workoutInfo.dayName} • 
                  {format(new Date(selectedSession.scheduledAt), " dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Exercícios */}
            <div className="space-y-4">
              <h4 className="font-medium">Exercícios</h4>
              {diaryExercises.map((exercise, exIndex) => (
                <Card key={exIndex} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium">{exercise.exerciseName}</h5>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        const updated = [...diaryExercises];
                        updated[exIndex].completed = !updated[exIndex].completed;
                        setDiaryExercises(updated);
                      }}
                      className={exercise.completed ? "text-emerald-600" : "text-gray-400"}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {exercise.sets.map((set: any, setIndex: number) => (
                      <div key={setIndex} className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 w-8">S{setIndex + 1}</span>
                        <Input
                          type="number"
                          placeholder="Carga"
                          value={set.weight}
                          onChange={(e) => {
                            const updated = [...diaryExercises];
                            updated[exIndex].sets[setIndex].weight = e.target.value;
                            setDiaryExercises(updated);
                          }}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500">kg</span>
                        <Input
                          type="number"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) => {
                            const updated = [...diaryExercises];
                            updated[exIndex].sets[setIndex].reps = parseInt(e.target.value) || 0;
                            setDiaryExercises(updated);
                          }}
                          className="w-20"
                        />
                        <span className="text-sm text-gray-500">reps</span>
                      </div>
                    ))}
                    
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const updated = [...diaryExercises];
                          updated[exIndex].sets.push({ weight: '', reps: 0 });
                          setDiaryExercises(updated);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Série
                      </Button>
                      {exercise.sets.length > 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const updated = [...diaryExercises];
                            updated[exIndex].sets.pop();
                            setDiaryExercises(updated);
                          }}
                        >
                          <Minus className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <Input
                      placeholder="Observações do exercício..."
                      value={exercise.notes}
                      onChange={(e) => {
                        const updated = [...diaryExercises];
                        updated[exIndex].notes = e.target.value;
                        setDiaryExercises(updated);
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Duração */}
            <div>
              <Label>Duração (minutos)</Label>
              <Input
                type="number"
                value={diaryDuration}
                onChange={(e) => setDiaryDuration(parseInt(e.target.value) || 60)}
                className="mt-1"
              />
            </div>
            
            {/* Como se sentiu */}
            <div>
              <Label>Como você se sentiu?</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { value: 'excellent', label: '🔥 Excelente', color: 'emerald' },
                  { value: 'good', label: '💪 Bom', color: 'green' },
                  { value: 'normal', label: '😐 Normal', color: 'gray' },
                  { value: 'tired', label: '😓 Cansado', color: 'amber' },
                  { value: 'exhausted', label: '😵 Exausto', color: 'red' },
                ].map((feeling) => (
                  <Button
                    key={feeling.value}
                    type="button"
                    variant={diaryFeeling === feeling.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDiaryFeeling(feeling.value)}
                    className={diaryFeeling === feeling.value ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                  >
                    {feeling.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Observações gerais */}
            <div>
              <Label>Observações gerais</Label>
              <Textarea
                value={diaryNotes}
                onChange={(e) => setDiaryNotes(e.target.value)}
                placeholder="Como foi o treino? Alguma observação importante..."
                className="mt-1"
              />
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDiaryModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!selectedSession?.workoutInfo) return;
                
                createWorkoutLogMutation.mutate({
                  workoutId: selectedSession.workoutId || 0,
                  workoutDayId: 0,
                  trainingDate: new Date(selectedSession.scheduledAt).toISOString().split('T')[0],
                  duration: diaryDuration,
                  notes: diaryNotes + (diaryFeeling ? ` | Sentimento: ${diaryFeeling}` : ''),
                  exercises: diaryExercises.map((ex) => ({
                    exerciseId: ex.exerciseId || 0,
                    exerciseName: ex.exerciseName,
                    set1Weight: ex.sets[0]?.weight || '',
                    set1Reps: ex.sets[0]?.reps || 0,
                    set2Weight: ex.sets[1]?.weight || '',
                    set2Reps: ex.sets[1]?.reps || 0,
                    set3Weight: ex.sets[2]?.weight || '',
                    set3Reps: ex.sets[2]?.reps || 0,
                    set4Weight: ex.sets[3]?.weight || '',
                    set4Reps: ex.sets[3]?.reps || 0,
                    set5Weight: ex.sets[4]?.weight || '',
                    set5Reps: ex.sets[4]?.reps || 0,
                    notes: ex.notes,
                    completed: ex.completed,
                  })),
                });
              }}
              disabled={createWorkoutLogMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createWorkoutLogMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Treino
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
