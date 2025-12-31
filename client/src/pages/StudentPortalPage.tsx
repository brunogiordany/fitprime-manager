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
import StudentPortalLayout from "@/components/StudentPortalLayout";
import StudentEvolutionCharts from "@/components/StudentEvolutionCharts";
import StudentSessionManager from "@/components/StudentSessionManager";
import StudentChat from "@/components/StudentChat";
import StudentBadges from "@/components/StudentBadges";
import StudentFeedback from "@/components/StudentFeedback";
import StudentTrainingTips from "@/components/StudentTrainingTips";
import StudentTrainingDashboard from "@/components/StudentTrainingDashboard";
import { GuidedPhotos } from "@/components/GuidedPhotos";
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
  Minus,
  X,
  Flame,
  TrendingUp,
  BarChart3
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
  const [showManualDiaryModal, setShowManualDiaryModal] = useState(false);
  const [manualDiaryDate, setManualDiaryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [manualDiaryExercises, setManualDiaryExercises] = useState<any[]>([{
    exerciseName: '',
    sets: [{ weight: '', reps: '', setType: 'working', restTime: 60 }],
    notes: '',
    isExpanded: true
  }]);
  const [manualDiaryNotes, setManualDiaryNotes] = useState('');
  const [manualDiaryFeeling, setManualDiaryFeeling] = useState('');
  const [manualDiaryDuration, setManualDiaryDuration] = useState(60);
  const [diarySubTab, setDiarySubTab] = useState<'sessions' | 'records' | 'dashboard'>('sessions');
  const [editingWorkoutLog, setEditingWorkoutLog] = useState<any>(null);
  const [showWorkoutLogModal, setShowWorkoutLogModal] = useState(false);

  // Restaurar dados do formulário de anamnese do localStorage ao carregar
  useEffect(() => {
    const savedDraft = localStorage.getItem('anamnesisFormDraft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setAnamnesisForm(parsed);
        // Se tinha dados salvos, mostrar que está editando
        if (Object.keys(parsed).some(k => parsed[k])) {
          setIsEditingAnamnesis(true);
          toast.info('Dados do formulário restaurados. Clique em Salvar para concluir.');
        }
      } catch (e) {
        console.error('Erro ao restaurar dados do formulário:', e);
      }
    }
  }, []);

  // Salvar dados do formulário no localStorage quando mudar
  useEffect(() => {
    if (isEditingAnamnesis && Object.keys(anamnesisForm).some(k => (anamnesisForm as any)[k])) {
      localStorage.setItem('anamnesisFormDraft', JSON.stringify(anamnesisForm));
    }
  }, [anamnesisForm, isEditingAnamnesis]);

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

  // Buscar anamnese do aluno (usa endpoint do studentPortal para autenticação correta)
  const { data: anamnesis, refetch: refetchAnamnesis } = trpc.studentPortal.anamnesis.useQuery(
    undefined,
    { enabled: !!studentData?.id }
  );

  // Buscar sessões do aluno (usa endpoint do studentPortal para autenticação correta)
  const { data: sessions, refetch: refetchSessions } = trpc.studentPortal.sessions.useQuery(
    undefined,
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
  const { data: workouts } = trpc.studentPortal.workouts.useQuery(
    undefined,
    { enabled: !!studentData?.id }
  );

  // Buscar cobranças do aluno (usando endpoint do portal que valida o aluno logado)
  const { data: charges } = trpc.studentPortal.charges.useQuery(
    undefined,
    { enabled: !!studentData?.id }
  );

  // Buscar registros de treino do aluno (para o diário)
  const { data: workoutLogs, refetch: refetchWorkoutLogs, isLoading: workoutLogsLoading } = trpc.studentPortal.workoutLogs.useQuery(
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

  // Mutation para criar registro de treino manual
  const createManualWorkoutLogMutation = trpc.studentPortal.createManualWorkoutLog.useMutation({
    onSuccess: () => {
      toast.success("Treino manual registrado com sucesso!");
      setShowManualDiaryModal(false);
      setManualDiaryExercises([{
        exerciseName: '',
        sets: [{ weight: '', reps: '', setType: 'working', restTime: 60 }],
        notes: '',
        isExpanded: true
      }]);
      setManualDiaryNotes('');
      setManualDiaryFeeling('');
      refetchWorkoutLogs();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar treino manual");
    },
  });

  // Mutation para atualizar anamnese (usa studentProcedure para autenticação do aluno)
  const updateAnamneseMutation = trpc.studentPortal.saveWithMeasurements.useMutation({
    onSuccess: () => {
      toast.success("Anamnese atualizada com sucesso!");
      setIsEditingAnamnesis(false);
      refetchAnamnesis();
      // Limpar dados salvos no localStorage após sucesso
      localStorage.removeItem('anamnesisFormDraft');
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
    
    // Função auxiliar para converter strings vazias em undefined
    const cleanValue = (val: any) => (val === '' || val === null) ? undefined : val;
    const cleanEnum = (val: any, validValues: string[]) => {
      if (!val || val === '') return undefined;
      return validValues.includes(val) ? val : undefined;
    };
    
    // Usa o endpoint studentPortal.saveWithMeasurements (studentProcedure)
    // Todos os campos são opcionais - aluno pode salvar parcialmente
    updateAnamneseMutation.mutate({
      occupation: cleanValue(anamnesisForm.occupation),
      sleepHours: anamnesisForm.sleepHours || undefined,
      stressLevel: cleanEnum(anamnesisForm.stressLevel, ['low', 'moderate', 'high', 'very_high']),
      lifestyle: cleanEnum(anamnesisForm.lifestyle, ['sedentary', 'light', 'moderate', 'active', 'very_active']),
      medicalHistory: cleanValue(anamnesisForm.medicalHistory),
      medications: cleanValue(anamnesisForm.medications),
      injuries: cleanValue(anamnesisForm.injuries),
      surgeries: cleanValue(anamnesisForm.surgeries),
      allergies: cleanValue(anamnesisForm.allergies),
      mainGoal: cleanEnum(anamnesisForm.mainGoal, ['weight_loss', 'muscle_gain', 'conditioning', 'health', 'rehabilitation', 'sports', 'other']),
      secondaryGoals: cleanValue(anamnesisForm.secondaryGoals),
      targetWeight: cleanValue(anamnesisForm.targetWeight),
      exerciseExperience: cleanEnum(anamnesisForm.exerciseExperience, ['none', 'beginner', 'intermediate', 'advanced']),
      observations: cleanValue(anamnesisForm.observations),
      // Nutrição
      mealsPerDay: anamnesisForm.mealsPerDay || undefined,
      waterIntake: cleanValue(anamnesisForm.waterIntake),
      dailyCalories: anamnesisForm.dailyCalories || undefined,
      dietRestrictions: cleanValue(anamnesisForm.dietRestrictions),
      supplements: cleanValue(anamnesisForm.supplements),
      doesCardio: anamnesisForm.doesCardio || false,
      cardioActivities: cleanValue(anamnesisForm.cardioActivities),
      // Preferências de treino
      weeklyFrequency: anamnesisForm.weeklyFrequency || undefined,
      sessionDuration: anamnesisForm.sessionDuration || undefined,
      preferredTime: cleanEnum(anamnesisForm.preferredTime, ['morning', 'afternoon', 'evening', 'flexible']),
      trainingLocation: cleanEnum(anamnesisForm.trainingLocation, ['full_gym', 'home_gym', 'home_basic', 'outdoor', 'studio']),
      availableEquipment: cleanValue(anamnesisForm.availableEquipment),
      // Restrições e ênfases
      // Converter arrays para strings JSON se necessário
      trainingRestrictions: (() => {
        const val = anamnesisForm.trainingRestrictions;
        if (!val || val === '') return undefined;
        // Se já é uma string JSON válida, usar diretamente
        if (typeof val === 'string') {
          // Se parece com array JSON, manter como está
          if (val.startsWith('[')) return val;
          // Se é texto simples, converter para string
          return val;
        }
        // Se é array, converter para JSON string
        if (Array.isArray(val)) return JSON.stringify(val);
        return String(val);
      })(),
      restrictionNotes: cleanValue(anamnesisForm.restrictionNotes),
      muscleEmphasis: (() => {
        const val = anamnesisForm.muscleEmphasis;
        if (!val || val === '') return undefined;
        // Se já é uma string JSON válida, usar diretamente
        if (typeof val === 'string') {
          // Se parece com array JSON, manter como está
          if (val.startsWith('[')) return val;
          // Se é texto simples, converter para string
          return val;
        }
        // Se é array, converter para JSON string
        if (Array.isArray(val)) return JSON.stringify(val);
        return String(val);
      })(),
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
    const sessionDate = new Date(s.scheduledAt);
    sessionDate.setHours(0, 0, 0, 0);
    return sessionDate >= today && s.status !== 'cancelled';
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()).slice(0, 5) || [];

  const pendingCharges = charges?.filter(c => c.status === 'pending') || [];

  // Calcular progresso do perfil (inclui anamnese + medidas corporais)
  const anamnesisFields = [
    anamnesis?.occupation,
    anamnesis?.mainGoal,
    anamnesis?.medicalHistory,
    anamnesis?.sleepHours,
    anamnesis?.stressLevel,
  ];
  const filledAnamnesisFields = anamnesisFields.filter(f => f).length;
  
  // Verificar se tem pelo menos uma medida corporal registrada
  const hasMeasurements = measurements && measurements.length > 0;
  const latestMeasurement = hasMeasurements ? measurements[0] : null;
  const measurementFields = latestMeasurement ? [
    latestMeasurement.weight,
    latestMeasurement.height,
  ] : [];
  const filledMeasurementFields = measurementFields.filter(f => f).length;
  
  // Progresso total: 5 campos de anamnese + 2 campos de medidas = 7 campos
  const totalFields = 7;
  const filledFields = filledAnamnesisFields + filledMeasurementFields;
  const profileProgress = Math.round((filledFields / totalFields) * 100);
  
  // Perfil completo quando tem anamnese básica E medidas corporais
  const isProfileComplete = filledAnamnesisFields >= 3 && hasMeasurements;

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
    <StudentPortalLayout
      studentData={studentData}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        {/* Profile Progress - Esconde quando perfil está completo (anamnese + medidas) */}
        {!isProfileComplete && (
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
          {/* Navegação agora é feita apenas pela sidebar - TabsList removida para evitar duplicação */}

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
                                {format(new Date(session.scheduledAt), "EEEE, dd/MM", { locale: ptBR })}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(session.scheduledAt), "HH:mm")} - {session.duration} min
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

          {/* Photos Tab */}
          <TabsContent value="photos" className="space-y-6">
            <GuidedPhotos
              studentId={studentData?.id || 0}
              readOnly={!editPermissions?.canEditPhotos}
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
            {/* Sub-tabs do Diário */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Diário de Treino</h2>
                <p className="text-sm text-gray-500">Registre e acompanhe seus treinos</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={diarySubTab === 'sessions' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiarySubTab('sessions')}
                  className="gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  Sessões
                </Button>
                <Button
                  variant={diarySubTab === 'records' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiarySubTab('records')}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Registros
                </Button>
                <Button
                  variant={diarySubTab === 'dashboard' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiarySubTab('dashboard')}
                  className="gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Button>
              </div>
            </div>

            {/* Sub-tab: Dashboard */}
            {diarySubTab === 'dashboard' && studentData && (
              <StudentTrainingDashboard studentId={studentData.id} />
            )}

            {/* Sub-tab: Sessões */}
            {diarySubTab === 'sessions' && (
              <>
                {/* Botão de Criar Registro Manual */}
                <div className="flex justify-end">
              <Button 
                onClick={() => {
                  setManualDiaryExercises([{
                    exerciseName: '',
                    sets: [{ weight: '', reps: '', setType: 'working', restTime: 60 }],
                    notes: '',
                    isExpanded: true
                  }]);
                  setManualDiaryDate(format(new Date(), 'yyyy-MM-dd'));
                  setManualDiaryNotes('');
                  setManualDiaryFeeling('');
                  setManualDiaryDuration(60);
                  setShowManualDiaryModal(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Registro Manual
              </Button>
            </div>

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
                                    setDiaryExercises(session.workoutInfo.exercises.map((ex: any, idx: number) => ({
                                      exerciseId: 0,
                                      exerciseName: ex.name,
                                      sets: Array(ex.sets || 3).fill(null).map(() => ({ weight: '', reps: ex.reps || 0, setType: 'working', restTime: 60 })),
                                      notes: '',
                                      completed: false,
                                      isExpanded: idx === 0, // Primeiro exercício expandido por padrão
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
                                    setDiaryExercises(session.workoutInfo.exercises.map((ex: any, idx: number) => ({
                                      exerciseId: 0,
                                      exerciseName: ex.name,
                                      sets: Array(ex.sets || 3).fill(null).map(() => ({ weight: '', reps: ex.reps || 0, setType: 'working', restTime: 60 })),
                                      notes: '',
                                      completed: false,
                                      isExpanded: idx === 0, // Primeiro exercício expandido por padrão
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
                      <details key={log.id} className="group border rounded-lg overflow-hidden">
                        <summary className="p-4 cursor-pointer hover:bg-gray-50 list-none">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-emerald-100 rounded-lg">
                                <Dumbbell className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium">{log.dayName || (log.isManual ? 'Treino Manual' : 'Treino')}</p>
                                  {log.isManual && (
                                    <Badge variant="outline" className="text-xs">Manual</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(log.trainingDate), "dd/MM/yyyy", { locale: ptBR })}
                                  {log.duration && ` • ${log.duration} min`}
                                  {log.exerciseCount > 0 && ` • ${log.exerciseCount} exercícios`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {log.feeling && (
                                <span className="text-lg">
                                  {log.feeling === 'excellent' || log.feeling === 'great' ? '🔥' : ''}
                                  {log.feeling === 'good' ? '💪' : ''}
                                  {log.feeling === 'normal' ? '😐' : ''}
                                  {log.feeling === 'tired' ? '😓' : ''}
                                  {log.feeling === 'exhausted' ? '😵' : ''}
                                </span>
                              )}
                              <Badge variant={log.status === 'completed' ? 'default' : 'outline'} className="bg-emerald-600">
                                {log.status === 'completed' ? 'Concluído' : 'Em andamento'}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-open:rotate-90 transition-transform" />
                            </div>
                          </div>
                        </summary>
                        <div className="px-4 pb-4 pt-2 border-t bg-gray-50">
                          {log.notes && (
                            <p className="text-sm text-gray-600 mb-3 italic">"{log.notes}"</p>
                          )}
                          {log.exerciseLogs && log.exerciseLogs.length > 0 ? (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700">Exercícios realizados:</p>
                              {log.exerciseLogs.map((ex: any, idx: number) => (
                                <div key={ex.id || idx} className="bg-white p-3 rounded border">
                                  <p className="font-medium text-sm">{ex.exerciseName}</p>
                                  {ex.sets && ex.sets.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {ex.sets.map((set: any, setIdx: number) => (
                                        <span key={setIdx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                          {set.weight && `${set.weight}kg`} {set.reps && `x${set.reps}`}
                                          {set.setType && set.setType !== 'working' && (
                                            <span className="text-gray-500 ml-1">({set.setType})</span>
                                          )}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {ex.notes && <p className="text-xs text-gray-500 mt-1">{ex.notes}</p>}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Nenhum detalhe de exercício registrado</p>
                          )}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Gráfico de Frequência de Treinos */}
            {workoutLogs && workoutLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Frequência de Treinos
                  </CardTitle>
                  <CardDescription>Últimas 8 semanas</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Calcular treinos por semana nas últimas 8 semanas
                    const weeks: { week: string; treinos: number }[] = [];
                    const today = new Date();
                    
                    for (let i = 7; i >= 0; i--) {
                      const weekStart = new Date(today);
                      weekStart.setDate(today.getDate() - (i * 7) - today.getDay());
                      weekStart.setHours(0, 0, 0, 0);
                      
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekStart.getDate() + 6);
                      weekEnd.setHours(23, 59, 59, 999);
                      
                      const count = (workoutLogs || []).filter((log: any) => {
                        const logDate = new Date(log.trainingDate);
                        return logDate >= weekStart && logDate <= weekEnd;
                      }).length;
                      
                      weeks.push({
                        week: format(weekStart, "dd/MM", { locale: ptBR }),
                        treinos: count
                      });
                    }
                    
                    const maxTreinos = Math.max(...weeks.map(w => w.treinos), 1);
                    
                    return (
                      <div className="space-y-4">
                        <div className="flex items-end gap-2 h-32">
                          {weeks.map((week, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                              <div 
                                className="w-full bg-emerald-500 rounded-t transition-all"
                                style={{ 
                                  height: `${(week.treinos / maxTreinos) * 100}%`,
                                  minHeight: week.treinos > 0 ? '8px' : '2px',
                                  backgroundColor: week.treinos > 0 ? '#10b981' : '#e5e7eb'
                                }}
                              />
                              <span className="text-xs text-gray-500">{week.week}</span>
                              <span className="text-xs font-medium">{week.treinos}</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-center text-sm text-gray-500">
                          Média: {(weeks.reduce((acc, w) => acc + w.treinos, 0) / weeks.length).toFixed(1)} treinos/semana
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
              </>
            )}

            {/* Sub-tab: Registros */}
            {diarySubTab === 'records' && (
              <>
                {/* Botão de Criar Registro Manual */}
                <div className="flex justify-end">
                  <Button 
                    onClick={() => {
                      setManualDiaryExercises([{
                        exerciseName: '',
                        sets: [{ weight: '', reps: '', setType: 'working', restTime: 60 }],
                        notes: '',
                        isExpanded: true
                      }]);
                      setManualDiaryNotes('');
                      setManualDiaryFeeling('');
                      setManualDiaryDuration(60);
                      setManualDiaryDate(format(new Date(), 'yyyy-MM-dd'));
                      setShowManualDiaryModal(true);
                    }}
                    className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Plus className="h-4 w-4" />
                    Criar Registro Manual
                  </Button>
                </div>

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
                    {workoutLogsLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                      </div>
                    ) : !workoutLogs || workoutLogs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Nenhum treino registrado ainda</p>
                        <p className="text-sm">Registre seu primeiro treino!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {workoutLogs.map((log: any) => (
                          <div
                            key={log.id}
                            className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg">
                                  <Dumbbell className="h-5 w-5 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-medium">
                                    {format(new Date(log.trainingDate), "dd 'de' MMMM", { locale: ptBR })}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {log.workoutName || 'Treino Manual'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {log.feeling && (
                                  <span className="text-xl">
                                    {log.feeling === 'great' && '😄'}
                                    {log.feeling === 'good' && '🙂'}
                                    {log.feeling === 'normal' && '😐'}
                                    {log.feeling === 'tired' && '😓'}
                                    {log.feeling === 'bad' && '😞'}
                                  </span>
                                )}
                                {log.duration && (
                                  <Badge variant="outline" className="gap-1">
                                    <Clock className="h-3 w-3" />
                                    {log.duration}min
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-gray-500 hover:text-emerald-600"
                                  onClick={() => {
                                    setEditingWorkoutLog(log);
                                    setShowWorkoutLogModal(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            {log.exercises && log.exercises.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <p className="text-sm text-gray-600 mb-1">
                                  {log.exercises.length} exercício(s)
                                </p>
                                <div className="flex flex-wrap gap-1">
                                  {log.exercises.slice(0, 4).map((ex: any, idx: number) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {ex.exerciseName}
                                    </Badge>
                                  ))}
                                  {log.exercises.length > 4 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{log.exercises.length - 4} mais
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
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
              <CardHeader className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Minha Anamnese</CardTitle>
                    <CardDescription>Suas informações de saúde e objetivos</CardDescription>
                  </div>
                  {/* Permitir edição se: 1) personal liberou OU 2) perfil ainda não foi preenchido */}
                  {(editPermissions?.canEditAnamnesis || profileProgress < 100) && (
                    !isEditingAnamnesis ? (
                      <Button onClick={handleEditAnamnesis} variant="outline" className="w-full sm:w-auto">
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    ) : (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={() => setIsEditingAnamnesis(false)} className="flex-1 sm:flex-none">
                          Cancelar
                        </Button>
                        <Button onClick={handleSaveAnamnesis} disabled={updateAnamneseMutation.isPending} className="flex-1 sm:flex-none">
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
                </div>
              </CardHeader>
              <CardContent>
                {isEditingAnamnesis ? (
                  <div className="space-y-8">
                    {/* Dados Pessoais */}
                    <div className="p-4 rounded-lg border bg-muted/20">
                      <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                        <User className="h-4 w-4" />
                        Dados Pessoais
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Ocupação</Label>
                          <Input
                            value={anamnesisForm.occupation || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, occupation: e.target.value })}
                            placeholder="Ex: Desenvolvedor, Professor..."
                            className="bg-background"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Horas de sono</Label>
                            <Select
                              value={anamnesisForm.sleepHours?.toString() || ""}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, sleepHours: parseInt(v) })}
                            >
                              <SelectTrigger className="bg-background">
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
                            <Label className="text-sm">Nível de estresse</Label>
                            <Select
                              value={anamnesisForm.stressLevel || ""}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, stressLevel: v })}
                            >
                              <SelectTrigger className="bg-background">
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
                    </div>

                    {/* Saúde */}
                    <div className="p-4 rounded-lg border bg-red-50/30 dark:bg-red-950/10">
                      <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                        <Heart className="h-4 w-4" />
                        Saúde
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Histórico médico</Label>
                          <Textarea
                            value={anamnesisForm.medicalHistory || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, medicalHistory: e.target.value })}
                            placeholder="Condições de saúde, doenças crônicas..."
                            className="bg-background"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Medicamentos</Label>
                            <Input
                              value={anamnesisForm.medications || ""}
                              onChange={(e) => setAnamnesisForm({ ...anamnesisForm, medications: e.target.value })}
                              placeholder="Medicamentos em uso"
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Alergias</Label>
                            <Input
                              value={anamnesisForm.allergies || ""}
                              onChange={(e) => setAnamnesisForm({ ...anamnesisForm, allergies: e.target.value })}
                              placeholder="Alergias conhecidas"
                              className="bg-background"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Lesões ou limitações</Label>
                          <Textarea
                            value={anamnesisForm.injuries || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, injuries: e.target.value })}
                            placeholder="Lesões, cirurgias, limitações físicas..."
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Objetivos */}
                    <div className="p-4 rounded-lg border bg-emerald-50/30 dark:bg-emerald-950/10">
                      <h3 className="font-semibold mb-4 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <Target className="h-4 w-4" />
                        Objetivos
                      </h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Objetivo principal</Label>
                            <Select
                              value={anamnesisForm.mainGoal || ""}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, mainGoal: v })}
                            >
                              <SelectTrigger className="bg-background">
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
                            <Label className="text-sm">Peso desejado (kg)</Label>
                            <Input
                              value={anamnesisForm.targetWeight || ""}
                              onChange={(e) => setAnamnesisForm({ ...anamnesisForm, targetWeight: e.target.value })}
                              placeholder="Ex: 70"
                              className="bg-background"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Objetivos secundários</Label>
                          <Textarea
                            value={anamnesisForm.secondaryGoals || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, secondaryGoals: e.target.value })}
                            placeholder="Outros objetivos que você gostaria de alcançar..."
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Estilo de Vida */}
                    <div className="p-4 rounded-lg border bg-blue-50/30 dark:bg-blue-950/10">
                      <h3 className="font-semibold mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                        <Activity className="h-4 w-4" />
                        Estilo de Vida
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Nível de atividade</Label>
                            <Select
                              value={anamnesisForm.lifestyle || ""}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, lifestyle: v })}
                            >
                              <SelectTrigger className="bg-background">
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
                            <Label className="text-sm">Experiência com exercícios</Label>
                            <Select
                              value={anamnesisForm.exerciseExperience || ""}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, exerciseExperience: v })}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Nenhuma</SelectItem>
                                <SelectItem value="beginner">Iniciante (&lt;6 meses)</SelectItem>
                                <SelectItem value="intermediate">Intermediário (6m-2 anos)</SelectItem>
                                <SelectItem value="advanced">Avançado (&gt;2 anos)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Cirurgias</Label>
                          <Textarea
                            value={anamnesisForm.surgeries || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, surgeries: e.target.value })}
                            placeholder="Cirurgias realizadas..."
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Nutrição */}
                    <div className="p-4 rounded-lg border bg-orange-50/30 dark:bg-orange-950/10">
                      <h3 className="font-semibold mb-4 flex items-center gap-2 text-orange-600 dark:text-orange-400">
                        <FileText className="h-4 w-4" />
                        Nutrição
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Refeições por dia</Label>
                            <Select
                              value={anamnesisForm.mealsPerDay?.toString() || ""}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, mealsPerDay: parseInt(v) })}
                            >
                              <SelectTrigger className="bg-background">
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
                            <Label className="text-sm">Consumo de água</Label>
                            <Select
                              value={anamnesisForm.waterIntake || ""}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, waterIntake: v })}
                            >
                              <SelectTrigger className="bg-background">
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
                            <Label className="text-sm">Calorias diárias (aproximado)</Label>
                            <Input
                              type="number"
                              value={anamnesisForm.dailyCalories || ""}
                              onChange={(e) => setAnamnesisForm({ ...anamnesisForm, dailyCalories: parseInt(e.target.value) || undefined })}
                              placeholder="Ex: 2000"
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Faz cardio?</Label>
                            <Select
                              value={anamnesisForm.doesCardio ? "yes" : "no"}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, doesCardio: v === "yes" })}
                            >
                              <SelectTrigger className="bg-background">
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
                          <div className="space-y-2">
                            <Label className="text-sm">Atividades cardio</Label>
                            <Input
                              value={anamnesisForm.cardioActivities || ""}
                              onChange={(e) => setAnamnesisForm({ ...anamnesisForm, cardioActivities: e.target.value })}
                              placeholder="Ex: Corrida, Bicicleta, Natação..."
                              className="bg-background"
                            />
                          </div>
                        )}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Restrições alimentares</Label>
                            <Input
                              value={anamnesisForm.dietRestrictions || ""}
                              onChange={(e) => setAnamnesisForm({ ...anamnesisForm, dietRestrictions: e.target.value })}
                              placeholder="Ex: Vegetariano, Intolerância a lactose..."
                              className="bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Suplementos</Label>
                            <Input
                              value={anamnesisForm.supplements || ""}
                              onChange={(e) => setAnamnesisForm({ ...anamnesisForm, supplements: e.target.value })}
                              placeholder="Ex: Whey, Creatina..."
                              className="bg-background"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preferências de Treino */}
                    <div className="p-4 rounded-lg border bg-purple-50/30 dark:bg-purple-950/10">
                      <h3 className="font-semibold mb-4 flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <Dumbbell className="h-4 w-4" />
                        Preferências de Treino
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm">Frequência semanal</Label>
                            <Select
                              value={anamnesisForm.weeklyFrequency?.toString() || ""}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, weeklyFrequency: parseInt(v) })}
                            >
                              <SelectTrigger className="bg-background">
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
                            <Label className="text-sm">Duração da sessão</Label>
                            <Select
                              value={anamnesisForm.sessionDuration?.toString() || ""}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, sessionDuration: parseInt(v) })}
                            >
                              <SelectTrigger className="bg-background">
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
                            <Label className="text-sm">Horário preferido</Label>
                            <Select
                              value={anamnesisForm.preferredTime || ""}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, preferredTime: v })}
                            >
                              <SelectTrigger className="bg-background">
                                <SelectValue placeholder="Selecione" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="morning">Manhã (6h-12h)</SelectItem>
                                <SelectItem value="afternoon">Tarde (12h-18h)</SelectItem>
                                <SelectItem value="evening">Noite (18h-22h)</SelectItem>
                                <SelectItem value="flexible">Flexível</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm">Local de treino</Label>
                            <Select
                              value={anamnesisForm.trainingLocation || ""}
                              onValueChange={(v) => setAnamnesisForm({ ...anamnesisForm, trainingLocation: v })}
                            >
                              <SelectTrigger className="bg-background">
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
                        <div className="space-y-2">
                          <Label className="text-sm">Equipamentos disponíveis</Label>
                          <Textarea
                            value={anamnesisForm.availableEquipment || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, availableEquipment: e.target.value })}
                            placeholder="Ex: Halteres, Barra, Elásticos, Máquinas..."
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Restrições e Ênfases */}
                    <div className="p-4 rounded-lg border bg-amber-50/30 dark:bg-amber-950/10">
                      <h3 className="font-semibold mb-4 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-4 w-4" />
                        Restrições e Ênfases
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm">Restrições de treino</Label>
                          <Textarea
                            value={anamnesisForm.trainingRestrictions || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, trainingRestrictions: e.target.value })}
                            placeholder="Ex: Evitar exercícios de impacto, Problemas no joelho..."
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Notas sobre restrições</Label>
                          <Textarea
                            value={anamnesisForm.restrictionNotes || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, restrictionNotes: e.target.value })}
                            placeholder="Detalhes adicionais sobre restrições..."
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Ênfases musculares</Label>
                          <Textarea
                            value={anamnesisForm.muscleEmphasis || ""}
                            onChange={(e) => setAnamnesisForm({ ...anamnesisForm, muscleEmphasis: e.target.value })}
                            placeholder="Ex: Glúteos, Peito, Costas..."
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Observações */}
                    <div className="p-4 rounded-lg border bg-slate-50/30 dark:bg-slate-950/10">
                      <h3 className="font-semibold mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <FileText className="h-4 w-4" />
                        Observações
                      </h3>
                      <div className="space-y-2">
                        <Label className="text-sm">Observações adicionais</Label>
                        <Textarea
                          value={anamnesisForm.observations || ""}
                          onChange={(e) => setAnamnesisForm({ ...anamnesisForm, observations: e.target.value })}
                          placeholder="Outras informações que você gostaria de compartilhar..."
                          className="bg-background"
                        />
                      </div>
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
                    {/* Visualização Melhorada */}
                    {anamnesis?.mainGoal ? (
                      <>
                        {/* Cards de Resumo */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="h-4 w-4 text-emerald-600" />
                              <span className="text-xs font-medium text-emerald-700">Objetivo</span>
                            </div>
                            <p className="text-sm font-semibold text-emerald-900">{getGoalLabel(anamnesis?.mainGoal || null)}</p>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity className="h-4 w-4 text-blue-600" />
                              <span className="text-xs font-medium text-blue-700">Experiência</span>
                            </div>
                            <p className="text-sm font-semibold text-blue-900">
                              {anamnesis?.exerciseExperience === 'none' ? 'Nenhuma' :
                               anamnesis?.exerciseExperience === 'beginner' ? 'Iniciante' :
                               anamnesis?.exerciseExperience === 'intermediate' ? 'Intermediário' :
                               anamnesis?.exerciseExperience === 'advanced' ? 'Avançado' : '-'}
                            </p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <span className="text-xs font-medium text-purple-700">Frequência</span>
                            </div>
                            <p className="text-sm font-semibold text-purple-900">
                              {anamnesis?.weeklyFrequency ? `${anamnesis.weeklyFrequency}x/semana` : '-'}
                            </p>
                          </div>
                          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Clock className="h-4 w-4 text-amber-600" />
                              <span className="text-xs font-medium text-amber-700">Duração</span>
                            </div>
                            <p className="text-sm font-semibold text-amber-900">
                              {anamnesis?.sessionDuration ? `${anamnesis.sessionDuration} min` : '-'}
                            </p>
                          </div>
                        </div>

                        {/* Seções Detalhadas */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Dados Pessoais */}
                          <Card className="border-gray-200">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-600" />
                                Dados Pessoais
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <dl className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b">
                                  <dt className="text-gray-500">Ocupação</dt>
                                  <dd className="font-medium">{anamnesis?.occupation || "-"}</dd>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b">
                                  <dt className="text-gray-500">Horas de sono</dt>
                                  <dd className="font-medium">{anamnesis?.sleepHours ? `${anamnesis.sleepHours}h` : "-"}</dd>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                  <dt className="text-gray-500">Nível de estresse</dt>
                                  <dd>
                                    <Badge variant="outline" className={`${
                                      anamnesis?.stressLevel === 'low' ? 'border-green-500 text-green-700 bg-green-50' :
                                      anamnesis?.stressLevel === 'moderate' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                                      anamnesis?.stressLevel === 'high' ? 'border-orange-500 text-orange-700 bg-orange-50' :
                                      anamnesis?.stressLevel === 'very_high' ? 'border-red-500 text-red-700 bg-red-50' : ''
                                    }`}>
                                      {getStressLabel(anamnesis?.stressLevel || null)}
                                    </Badge>
                                  </dd>
                                </div>
                              </dl>
                            </CardContent>
                          </Card>

                          {/* Objetivos */}
                          <Card className="border-emerald-200 bg-emerald-50/30">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Target className="h-4 w-4 text-emerald-600" />
                                Objetivos
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <dl className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                                  <dt className="text-gray-500">Objetivo principal</dt>
                                  <dd className="font-medium text-emerald-700">{getGoalLabel(anamnesis?.mainGoal || null)}</dd>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-emerald-200">
                                  <dt className="text-gray-500">Peso desejado</dt>
                                  <dd className="font-medium">{anamnesis?.targetWeight ? `${anamnesis.targetWeight} kg` : "-"}</dd>
                                </div>
                                {anamnesis?.secondaryGoals && (
                                  <div className="py-2">
                                    <dt className="text-gray-500 mb-1">Objetivos secundários</dt>
                                    <dd className="text-gray-700">{anamnesis.secondaryGoals}</dd>
                                  </div>
                                )}
                              </dl>
                            </CardContent>
                          </Card>

                          {/* Saúde */}
                          <Card className="border-red-200 bg-red-50/30">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Heart className="h-4 w-4 text-red-600" />
                                Saúde
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <dl className="space-y-3 text-sm">
                                {anamnesis?.medicalHistory && (
                                  <div className="py-2 border-b border-red-200">
                                    <dt className="text-gray-500 mb-1">Histórico médico</dt>
                                    <dd className="text-gray-700">{anamnesis.medicalHistory}</dd>
                                  </div>
                                )}
                                {anamnesis?.medications && (
                                  <div className="py-2 border-b border-red-200">
                                    <dt className="text-gray-500 mb-1">Medicamentos</dt>
                                    <dd className="text-gray-700">{anamnesis.medications}</dd>
                                  </div>
                                )}
                                {anamnesis?.injuries && (
                                  <div className="py-2 border-b border-red-200">
                                    <dt className="text-gray-500 mb-1">Lesões/Limitações</dt>
                                    <dd className="text-gray-700">{anamnesis.injuries}</dd>
                                  </div>
                                )}
                                {anamnesis?.allergies && (
                                  <div className="py-2">
                                    <dt className="text-gray-500 mb-1">Alergias</dt>
                                    <dd className="text-gray-700">{anamnesis.allergies}</dd>
                                  </div>
                                )}
                                {!anamnesis?.medicalHistory && !anamnesis?.medications && !anamnesis?.injuries && !anamnesis?.allergies && (
                                  <p className="text-gray-400 text-center py-4">Nenhuma informação de saúde registrada</p>
                                )}
                              </dl>
                            </CardContent>
                          </Card>

                          {/* Preferências de Treino */}
                          <Card className="border-blue-200 bg-blue-50/30">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Dumbbell className="h-4 w-4 text-blue-600" />
                                Preferências de Treino
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <dl className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                                  <dt className="text-gray-500">Horário preferido</dt>
                                  <dd className="font-medium">
                                    {anamnesis?.preferredTime === 'morning' ? 'Manhã (8h-12h)' :
                                     anamnesis?.preferredTime === 'afternoon' ? 'Tarde (12h-18h)' :
                                     anamnesis?.preferredTime === 'evening' ? 'Noite (18h-22h)' :
                                     anamnesis?.preferredTime === 'flexible' ? 'Flexível' : '-'}
                                  </dd>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-blue-200">
                                  <dt className="text-gray-500">Local de treino</dt>
                                  <dd className="font-medium">
                                    {anamnesis?.trainingLocation === 'full_gym' ? 'Academia Completa' :
                                     anamnesis?.trainingLocation === 'home_gym' ? 'Academia em Casa' :
                                     anamnesis?.trainingLocation === 'home_basic' ? 'Casa (básico)' :
                                     anamnesis?.trainingLocation === 'outdoor' ? 'Ar Livre' :
                                     anamnesis?.trainingLocation === 'studio' ? 'Estúdio' : '-'}
                                  </dd>
                                </div>
                                {anamnesis?.availableEquipment && (
                                  <div className="py-2">
                                    <dt className="text-gray-500 mb-1">Equipamentos disponíveis</dt>
                                    <dd className="text-gray-700">{anamnesis.availableEquipment}</dd>
                                  </div>
                                )}
                              </dl>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Nutrição */}
                        {(anamnesis?.mealsPerDay || anamnesis?.waterIntake || anamnesis?.supplements) && (
                          <Card className="border-orange-200 bg-orange-50/30">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <FileText className="h-4 w-4 text-orange-600" />
                                Nutrição
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="grid md:grid-cols-3 gap-4">
                                {anamnesis?.mealsPerDay && (
                                  <div className="text-center p-3 bg-white rounded-lg border">
                                    <p className="text-2xl font-bold text-orange-600">{anamnesis.mealsPerDay}</p>
                                    <p className="text-xs text-gray-500">Refeições/dia</p>
                                  </div>
                                )}
                                {anamnesis?.waterIntake && (
                                  <div className="text-center p-3 bg-white rounded-lg border">
                                    <p className="text-2xl font-bold text-blue-600">
                                      {anamnesis.waterIntake === 'less_1l' ? '<1L' :
                                       anamnesis.waterIntake === '1_2l' ? '1-2L' :
                                       anamnesis.waterIntake === '2_3l' ? '2-3L' :
                                       anamnesis.waterIntake === 'more_3l' ? '>3L' : '-'}
                                    </p>
                                    <p className="text-xs text-gray-500">Água/dia</p>
                                  </div>
                                )}
                                {anamnesis?.dailyCalories && (
                                  <div className="text-center p-3 bg-white rounded-lg border">
                                    <p className="text-2xl font-bold text-green-600">{anamnesis.dailyCalories}</p>
                                    <p className="text-xs text-gray-500">Calorias/dia</p>
                                  </div>
                                )}
                              </div>
                              {anamnesis?.supplements && (
                                <div className="mt-4">
                                  <p className="text-sm text-gray-500 mb-1">Suplementos</p>
                                  <p className="text-sm">{anamnesis.supplements}</p>
                                </div>
                              )}
                              {anamnesis?.dietRestrictions && (
                                <div className="mt-3">
                                  <p className="text-sm text-gray-500 mb-1">Restrições alimentares</p>
                                  <p className="text-sm">{anamnesis.dietRestrictions}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        {/* Ênfases e Restrições */}
                        {(anamnesis?.muscleEmphasis || anamnesis?.trainingRestrictions) && (
                          <Card className="border-purple-200 bg-purple-50/30">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-purple-600" />
                                Ênfases e Restrições
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="grid md:grid-cols-2 gap-4">
                                {anamnesis?.muscleEmphasis && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-2">Ênfases musculares</p>
                                    <div className="flex flex-wrap gap-2">
                                      {anamnesis.muscleEmphasis.split(',').map((muscle, i) => (
                                        <Badge key={i} variant="outline" className="bg-purple-100 border-purple-300 text-purple-700">
                                          {muscle.trim()}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {anamnesis?.trainingRestrictions && (
                                  <div>
                                    <p className="text-sm text-gray-500 mb-2">Restrições de treino</p>
                                    <p className="text-sm text-red-700 bg-red-50 p-2 rounded border border-red-200">
                                      {anamnesis.trainingRestrictions}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Observações */}
                        {anamnesis?.observations && (
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-base">Observações</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <p className="text-sm text-gray-600">{anamnesis.observations}</p>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Anamnese não preenchida</h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          Preencha sua anamnese para que seu personal possa criar treinos personalizados para você.
                        </p>
                        <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowOnboarding(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Preencher Agora
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
          <TabsContent value="chat" className="h-full">
            <StudentChat />
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-6">
            <StudentBadges />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modal de Registro de Treino */}
      <Dialog open={showDiaryModal} onOpenChange={setShowDiaryModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
            {/* Barra de Progresso */}
            {diaryExercises.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-emerald-700 font-medium">Progresso do Treino</span>
                    <span className="text-emerald-600">
                      {diaryExercises.filter(ex => ex.completed).length}/{diaryExercises.length} exercícios
                    </span>
                  </div>
                  <Progress 
                    value={(diaryExercises.filter(ex => ex.completed).length / diaryExercises.length) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            )}
            
            {/* Exercícios */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-500" />
                  Exercícios
                </h4>
              </div>
              {diaryExercises.map((exercise, exIndex) => (
                <Card key={exIndex} className={`overflow-hidden transition-all ${exercise.completed ? 'border-emerald-300 bg-emerald-50/50' : ''}`}>
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      const updated = [...diaryExercises];
                      updated[exIndex].isExpanded = !updated[exIndex].isExpanded;
                      setDiaryExercises(updated);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-bold ${exercise.completed ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                          {exIndex + 1}
                        </span>
                        <div>
                          <h5 className="font-medium">{exercise.exerciseName}</h5>
                          <p className="text-xs text-gray-500">
                            {exercise.sets.filter((s: any) => s.weight && s.reps).length}/{exercise.sets.length} séries preenchidas
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            const updated = [...diaryExercises];
                            updated[exIndex].completed = !updated[exIndex].completed;
                            setDiaryExercises(updated);
                          }}
                          className={exercise.completed ? "text-emerald-600" : "text-gray-400"}
                        >
                          <CheckCircle2 className="h-5 w-5" />
                        </Button>
                        <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${exercise.isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>
                  
                  {exercise.isExpanded && (
                    <div className="border-t p-4 bg-gray-50/50">
                      <div className="space-y-3">
                        {exercise.sets.map((set: any, setIndex: number) => (
                          <div key={setIndex} className="p-3 bg-white rounded-lg border space-y-2">
                            {/* Linha 1: Número + Tipo de série */}
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold flex-shrink-0 ${
                                set.setType === 'warmup' ? 'bg-yellow-500' :
                                set.setType === 'feeler' ? 'bg-blue-500' :
                                set.setType === 'failure' ? 'bg-red-500' :
                                'bg-green-500'
                              }`}>
                                {setIndex + 1}
                              </span>
                              
                              <Select
                                value={set.setType || 'working'}
                                onValueChange={(v) => {
                                  const updated = [...diaryExercises];
                                  updated[exIndex].sets[setIndex].setType = v;
                                  setDiaryExercises(updated);
                                }}
                              >
                                <SelectTrigger className="h-8 flex-1 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="warmup">Aquecimento</SelectItem>
                                  <SelectItem value="feeler">Reconhecimento</SelectItem>
                                  <SelectItem value="working">Série Válida</SelectItem>
                                  <SelectItem value="failure">Falha</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              {/* Botão remover série */}
                              {exercise.sets.length > 1 && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-red-500 hover:text-red-700 flex-shrink-0"
                                  onClick={() => {
                                    const updated = [...diaryExercises];
                                    updated[exIndex].sets.splice(setIndex, 1);
                                    setDiaryExercises(updated);
                                  }}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            {/* Linha 2: Peso + Reps + Descanso */}
                            <div className="flex items-center gap-3 pl-9">
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={set.weight}
                                  onChange={(e) => {
                                    const updated = [...diaryExercises];
                                    updated[exIndex].sets[setIndex].weight = e.target.value;
                                    setDiaryExercises(updated);
                                  }}
                                  className="h-8 w-16 text-center text-sm"
                                />
                                <span className="text-xs text-gray-500">kg</span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  placeholder="0"
                                  value={set.reps}
                                  onChange={(e) => {
                                    const updated = [...diaryExercises];
                                    updated[exIndex].sets[setIndex].reps = parseInt(e.target.value) || 0;
                                    setDiaryExercises(updated);
                                  }}
                                  className="h-8 w-14 text-center text-sm"
                                />
                                <span className="text-xs text-gray-500">reps</span>
                              </div>
                              
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  placeholder="60"
                                  value={set.restTime || ''}
                                  onChange={(e) => {
                                    const updated = [...diaryExercises];
                                    updated[exIndex].sets[setIndex].restTime = parseInt(e.target.value) || 0;
                                    setDiaryExercises(updated);
                                  }}
                                  className="h-8 w-14 text-center text-sm"
                                />
                                <span className="text-xs text-gray-500">s</span>
                              </div>
                            </div>
                            
                            {/* Linha 3: Botões Drop Set e Rest-Pause DENTRO da série */}
                            <div className="flex gap-2 pl-9 mt-2">
                              <Button
                                size="sm"
                                variant={set.hasDropSet ? 'default' : 'outline'}
                                className={`h-7 text-xs ${set.hasDropSet ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'border-purple-300 text-purple-600 hover:bg-purple-50'}`}
                                onClick={() => {
                                  const updated = [...diaryExercises];
                                  updated[exIndex].sets[setIndex].hasDropSet = !updated[exIndex].sets[setIndex].hasDropSet;
                                  if (!updated[exIndex].sets[setIndex].hasDropSet) {
                                    updated[exIndex].sets[setIndex].drops = [];
                                  } else if (!updated[exIndex].sets[setIndex].drops || updated[exIndex].sets[setIndex].drops.length === 0) {
                                    updated[exIndex].sets[setIndex].drops = [{ weight: '', reps: '', restTime: '' }];
                                  }
                                  setDiaryExercises(updated);
                                }}
                              >
                                Drop Set
                              </Button>
                              <Button
                                size="sm"
                                variant={set.hasRestPause ? 'default' : 'outline'}
                                className={`h-7 text-xs ${set.hasRestPause ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'border-orange-300 text-orange-600 hover:bg-orange-50'}`}
                                onClick={() => {
                                  const updated = [...diaryExercises];
                                  updated[exIndex].sets[setIndex].hasRestPause = !updated[exIndex].sets[setIndex].hasRestPause;
                                  if (!updated[exIndex].sets[setIndex].hasRestPause) {
                                    updated[exIndex].sets[setIndex].restPauses = [];
                                  } else if (!updated[exIndex].sets[setIndex].restPauses || updated[exIndex].sets[setIndex].restPauses.length === 0) {
                                    updated[exIndex].sets[setIndex].restPauses = [{ pauseTime: '', reps: '' }];
                                  }
                                  setDiaryExercises(updated);
                                }}
                              >
                                Rest-Pause
                              </Button>
                            </div>
                            
                            {/* Drop Set expandido DENTRO da série */}
                            {set.hasDropSet && (
                              <div className="ml-9 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-purple-500 text-white text-xs">Drop Set</Badge>
                                  <span className="text-xs text-gray-500">Reduza a carga e continue</span>
                                </div>
                                <div className="space-y-2">
                                  {(set.drops || [{ weight: '', reps: '', restTime: '' }]).map((drop: any, dropIndex: number) => (
                                    <div key={dropIndex} className="flex items-center gap-2 flex-wrap bg-white/50 dark:bg-black/20 p-2 rounded">
                                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400 w-12">Drop {dropIndex + 1}</span>
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          value={drop.weight || ''}
                                          onChange={(e) => {
                                            const updated = [...diaryExercises];
                                            const drops = updated[exIndex].sets[setIndex].drops || [{ weight: '', reps: '', restTime: '' }];
                                            drops[dropIndex] = { ...drops[dropIndex], weight: e.target.value };
                                            updated[exIndex].sets[setIndex].drops = drops;
                                            // Compatibilidade com campos antigos
                                            if (dropIndex === 0) {
                                              updated[exIndex].sets[setIndex].dropWeight = parseFloat(e.target.value) || undefined;
                                            }
                                            setDiaryExercises(updated);
                                          }}
                                          className="h-7 w-14 text-center text-sm"
                                        />
                                        <span className="text-xs text-gray-500">kg</span>
                                      </div>
                                      <span className="text-gray-400">×</span>
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          value={drop.reps || ''}
                                          onChange={(e) => {
                                            const updated = [...diaryExercises];
                                            const drops = updated[exIndex].sets[setIndex].drops || [{ weight: '', reps: '', restTime: '' }];
                                            drops[dropIndex] = { ...drops[dropIndex], reps: e.target.value };
                                            updated[exIndex].sets[setIndex].drops = drops;
                                            if (dropIndex === 0) {
                                              updated[exIndex].sets[setIndex].dropReps = parseInt(e.target.value) || undefined;
                                            }
                                            setDiaryExercises(updated);
                                          }}
                                          className="h-7 w-12 text-center text-sm"
                                        />
                                        <span className="text-xs text-gray-500">reps</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          value={drop.restTime || ''}
                                          onChange={(e) => {
                                            const updated = [...diaryExercises];
                                            const drops = updated[exIndex].sets[setIndex].drops || [{ weight: '', reps: '', restTime: '' }];
                                            drops[dropIndex] = { ...drops[dropIndex], restTime: e.target.value };
                                            updated[exIndex].sets[setIndex].drops = drops;
                                            setDiaryExercises(updated);
                                          }}
                                          className="h-7 w-12 text-center text-sm"
                                        />
                                        <span className="text-xs text-gray-500">s</span>
                                      </div>
                                      {(set.drops?.length || 0) > 1 && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-red-500 hover:text-red-700"
                                          onClick={() => {
                                            const updated = [...diaryExercises];
                                            const drops = [...(updated[exIndex].sets[setIndex].drops || [])];
                                            drops.splice(dropIndex, 1);
                                            updated[exIndex].sets[setIndex].drops = drops;
                                            setDiaryExercises(updated);
                                          }}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 h-7 text-xs"
                                  onClick={() => {
                                    const updated = [...diaryExercises];
                                    const drops = updated[exIndex].sets[setIndex].drops || [{ weight: '', reps: '', restTime: '' }];
                                    drops.push({ weight: '', reps: '', restTime: '' });
                                    updated[exIndex].sets[setIndex].drops = drops;
                                    setDiaryExercises(updated);
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Adicionar Drop
                                </Button>
                              </div>
                            )}
                            
                            {/* Rest-Pause expandido DENTRO da série */}
                            {set.hasRestPause && (
                              <div className="ml-9 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-orange-500 text-white text-xs">Rest-Pause</Badge>
                                  <span className="text-xs text-gray-500">Pausa curta e continue</span>
                                </div>
                                <div className="space-y-2">
                                  {(set.restPauses || [{ pauseTime: '', reps: '' }]).map((rp: any, rpIndex: number) => (
                                    <div key={rpIndex} className="flex items-center gap-2 flex-wrap bg-white/50 dark:bg-black/20 p-2 rounded">
                                      <span className="text-xs font-medium text-orange-600 dark:text-orange-400 w-12">Pausa {rpIndex + 1}</span>
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          placeholder="15"
                                          value={rp.pauseTime || ''}
                                          onChange={(e) => {
                                            const updated = [...diaryExercises];
                                            const restPauses = updated[exIndex].sets[setIndex].restPauses || [{ pauseTime: '', reps: '' }];
                                            restPauses[rpIndex] = { ...restPauses[rpIndex], pauseTime: e.target.value };
                                            updated[exIndex].sets[setIndex].restPauses = restPauses;
                                            if (rpIndex === 0) {
                                              updated[exIndex].sets[setIndex].restPausePause = parseInt(e.target.value) || undefined;
                                            }
                                            setDiaryExercises(updated);
                                          }}
                                          className="h-7 w-12 text-center text-sm"
                                        />
                                        <span className="text-xs text-gray-500">s</span>
                                      </div>
                                      <span className="text-gray-400">→</span>
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          placeholder="0"
                                          value={rp.reps || ''}
                                          onChange={(e) => {
                                            const updated = [...diaryExercises];
                                            const restPauses = updated[exIndex].sets[setIndex].restPauses || [{ pauseTime: '', reps: '' }];
                                            restPauses[rpIndex] = { ...restPauses[rpIndex], reps: e.target.value };
                                            updated[exIndex].sets[setIndex].restPauses = restPauses;
                                            if (rpIndex === 0) {
                                              updated[exIndex].sets[setIndex].restPauseReps = parseInt(e.target.value) || undefined;
                                            }
                                            setDiaryExercises(updated);
                                          }}
                                          className="h-7 w-12 text-center text-sm"
                                        />
                                        <span className="text-xs text-gray-500">reps</span>
                                      </div>
                                      {(set.restPauses?.length || 0) > 1 && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-red-500 hover:text-red-700"
                                          onClick={() => {
                                            const updated = [...diaryExercises];
                                            const restPauses = [...(updated[exIndex].sets[setIndex].restPauses || [])];
                                            restPauses.splice(rpIndex, 1);
                                            updated[exIndex].sets[setIndex].restPauses = restPauses;
                                            setDiaryExercises(updated);
                                          }}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:text-orange-400 h-7 text-xs"
                                  onClick={() => {
                                    const updated = [...diaryExercises];
                                    const restPauses = updated[exIndex].sets[setIndex].restPauses || [{ pauseTime: '', reps: '' }];
                                    restPauses.push({ pauseTime: '', reps: '' });
                                    updated[exIndex].sets[setIndex].restPauses = restPauses;
                                    setDiaryExercises(updated);
                                  }}
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Adicionar Pausa
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {/* Botão adicionar série */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const updated = [...diaryExercises];
                            updated[exIndex].sets.push({ weight: '', reps: 0, setType: 'working', restTime: 60 });
                            setDiaryExercises(updated);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Série
                        </Button>
                      </div>
                      
                      {/* Observações do exercício */}
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
                    </div>
                  )}
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
                    set1Type: (ex.sets[0]?.setType as any) || 'working',
                    set2Weight: ex.sets[1]?.weight || '',
                    set2Reps: ex.sets[1]?.reps || 0,
                    set2Type: (ex.sets[1]?.setType as any) || 'working',
                    set3Weight: ex.sets[2]?.weight || '',
                    set3Reps: ex.sets[2]?.reps || 0,
                    set3Type: (ex.sets[2]?.setType as any) || 'working',
                    set4Weight: ex.sets[3]?.weight || '',
                    set4Reps: ex.sets[3]?.reps || 0,
                    set4Type: (ex.sets[3]?.setType as any) || 'working',
                    set5Weight: ex.sets[4]?.weight || '',
                    set5Reps: ex.sets[4]?.reps || 0,
                    set5Type: (ex.sets[4]?.setType as any) || 'working',
                    notes: ex.notes,
                    completed: ex.completed,
                    // Drop set extras
                    dropWeight: ex.dropWeight || undefined,
                    dropReps: ex.dropReps || undefined,
                    // Rest-pause extras
                    restPausePause: ex.restPausePause || undefined,
                    restPauseReps: ex.restPauseReps || undefined,
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

      {/* Modal de Registro Manual de Treino */}
      <Dialog open={showManualDiaryModal} onOpenChange={setShowManualDiaryModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              Criar Registro Manual de Treino
            </DialogTitle>
            <DialogDescription>
              Registre um treino que você fez por conta própria
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Data e Duração */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data do Treino</Label>
                <Input
                  type="date"
                  value={manualDiaryDate}
                  onChange={(e) => setManualDiaryDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Duração (minutos)</Label>
                <Input
                  type="number"
                  value={manualDiaryDuration}
                  onChange={(e) => setManualDiaryDuration(parseInt(e.target.value) || 60)}
                  min={1}
                />
              </div>
            </div>
            
            {/* Sentimento */}
            <div className="space-y-2">
              <Label>Como você se sentiu?</Label>
              <div className="flex gap-2">
                {[
                  { value: 'great', label: 'Excelente', emoji: '🔥' },
                  { value: 'good', label: 'Bom', emoji: '💪' },
                  { value: 'normal', label: 'Normal', emoji: '😐' },
                  { value: 'tired', label: 'Cansado', emoji: '😓' },
                  { value: 'exhausted', label: 'Exausto', emoji: '😵' },
                ].map((f) => (
                  <Button
                    key={f.value}
                    type="button"
                    variant={manualDiaryFeeling === f.value ? 'default' : 'outline'}
                    className={manualDiaryFeeling === f.value ? 'bg-emerald-600' : ''}
                    onClick={() => setManualDiaryFeeling(f.value)}
                  >
                    {f.emoji} {f.label}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Exercícios */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Exercícios</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setManualDiaryExercises([...manualDiaryExercises, {
                      exerciseName: '',
                      sets: [{ weight: '', reps: '', setType: 'working', restTime: 60 }],
                      notes: '',
                      isExpanded: true
                    }]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Exercício
                </Button>
              </div>
              
              {manualDiaryExercises.map((exercise, exIndex) => (
                <Card key={exIndex} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Nome do exercício (ex: Supino Reto)"
                        value={exercise.exerciseName}
                        onChange={(e) => {
                          const updated = [...manualDiaryExercises];
                          updated[exIndex].exerciseName = e.target.value;
                          setManualDiaryExercises(updated);
                        }}
                        className="flex-1"
                      />
                      {manualDiaryExercises.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            const updated = manualDiaryExercises.filter((_, i) => i !== exIndex);
                            setManualDiaryExercises(updated);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    {/* Séries */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Séries</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updated = [...manualDiaryExercises];
                            updated[exIndex].sets.push({ weight: '', reps: '', setType: 'working', restTime: 60 });
                            setManualDiaryExercises(updated);
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Série
                        </Button>
                      </div>
                      
                      {exercise.sets.map((set: any, setIndex: number) => (
                        <div key={setIndex} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                          <span className="text-sm font-medium w-8">#{setIndex + 1}</span>
                          <Input
                            type="text"
                            placeholder="Peso (kg)"
                            value={set.weight}
                            onChange={(e) => {
                              const updated = [...manualDiaryExercises];
                              updated[exIndex].sets[setIndex].weight = e.target.value;
                              setManualDiaryExercises(updated);
                            }}
                            className="w-24"
                          />
                          <Input
                            type="number"
                            placeholder="Reps"
                            value={set.reps}
                            onChange={(e) => {
                              const updated = [...manualDiaryExercises];
                              updated[exIndex].sets[setIndex].reps = e.target.value;
                              setManualDiaryExercises(updated);
                            }}
                            className="w-20"
                          />
                          <Select
                            value={set.setType || 'working'}
                            onValueChange={(v) => {
                              const updated = [...manualDiaryExercises];
                              updated[exIndex].sets[setIndex].setType = v;
                              setManualDiaryExercises(updated);
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="warmup">Aquecimento</SelectItem>
                              <SelectItem value="feeler">Reconhecimento</SelectItem>
                              <SelectItem value="working">Série Válida</SelectItem>
                              <SelectItem value="drop">Drop Set</SelectItem>
                              <SelectItem value="rest_pause">Rest-Pause</SelectItem>
                              <SelectItem value="failure">Falha</SelectItem>
                            </SelectContent>
                          </Select>
                          {exercise.sets.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-700 p-1"
                              onClick={() => {
                                const updated = [...manualDiaryExercises];
                                updated[exIndex].sets = updated[exIndex].sets.filter((_: any, i: number) => i !== setIndex);
                                setManualDiaryExercises(updated);
                              }}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Notas do exercício */}
                    <Input
                      placeholder="Observações do exercício (opcional)"
                      value={exercise.notes || ''}
                      onChange={(e) => {
                        const updated = [...manualDiaryExercises];
                        updated[exIndex].notes = e.target.value;
                        setManualDiaryExercises(updated);
                      }}
                    />
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Notas gerais */}
            <div className="space-y-2">
              <Label>Observações gerais (opcional)</Label>
              <Textarea
                value={manualDiaryNotes}
                onChange={(e) => setManualDiaryNotes(e.target.value)}
                placeholder="Como foi o treino? Alguma observação importante?"
                rows={3}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowManualDiaryModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                // Validar que tem pelo menos um exercício com nome
                const validExercises = manualDiaryExercises.filter(ex => ex.exerciseName.trim());
                if (validExercises.length === 0) {
                  toast.error('Adicione pelo menos um exercício');
                  return;
                }
                
                createManualWorkoutLogMutation.mutate({
                  trainingDate: manualDiaryDate,
                  duration: manualDiaryDuration,
                  notes: manualDiaryNotes,
                  feeling: manualDiaryFeeling,
                  exercises: validExercises.map(ex => ({
                    exerciseName: ex.exerciseName,
                    sets: ex.sets.map((s: any) => ({
                      weight: s.weight || undefined,
                      reps: s.reps ? parseInt(s.reps) : undefined,
                      setType: s.setType || 'working',
                      restTime: s.restTime || 60,
                    })),
                    notes: ex.notes || undefined,
                  })),
                });
              }}
              disabled={createManualWorkoutLogMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {createManualWorkoutLogMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Treino
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição de Registro de Treino */}
      <Dialog open={showWorkoutLogModal} onOpenChange={(open) => {
        setShowWorkoutLogModal(open);
        if (!open) setEditingWorkoutLog(null);
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-emerald-500" />
              Editar Registro de Treino
            </DialogTitle>
            <DialogDescription>
              Ajuste os dados do seu treino
            </DialogDescription>
          </DialogHeader>
          
          {editingWorkoutLog && (
            <EditWorkoutLogForm
              log={editingWorkoutLog}
              onClose={() => {
                setShowWorkoutLogModal(false);
                setEditingWorkoutLog(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </StudentPortalLayout>
  );
}

// Componente separado para o formulário de edição
function EditWorkoutLogForm({ log, onClose }: { log: any; onClose: () => void }) {
  const [editDate, setEditDate] = useState(format(new Date(log.trainingDate), 'yyyy-MM-dd'));
  const [editDuration, setEditDuration] = useState(log.duration || 60);
  const [editNotes, setEditNotes] = useState(log.notes || '');
  const [editFeeling, setEditFeeling] = useState(log.feeling || '');
  const [editStatus, setEditStatus] = useState(log.status || 'completed');
  const [editExercises, setEditExercises] = useState<any[]>(() => {
    if (log.exercises && log.exercises.length > 0) {
      return log.exercises.map((ex: any) => ({
        exerciseName: ex.exerciseName || '',
        sets: ex.sets && ex.sets.length > 0 ? ex.sets.map((s: any) => ({
          weight: s.weight || '',
          reps: s.reps || '',
          setType: s.setType || 'working',
          restTime: s.restTime || 60,
        })) : [{ weight: '', reps: '', setType: 'working', restTime: 60 }],
        notes: ex.notes || '',
        isExpanded: true,
      }));
    }
    return [{ exerciseName: '', sets: [{ weight: '', reps: '', setType: 'working', restTime: 60 }], notes: '', isExpanded: true }];
  });

  const utils = trpc.useUtils();
  const updateMutation = trpc.studentPortal.updateWorkoutLog.useMutation({
    onSuccess: () => {
      toast.success('Registro atualizado com sucesso!');
      utils.studentPortal.workoutLogs.invalidate();
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar registro');
    },
  });

  const handleSave = () => {
    const validExercises = editExercises.filter(ex => ex.exerciseName.trim());
    
    updateMutation.mutate({
      logId: log.id,
      trainingDate: editDate,
      duration: editDuration,
      notes: editNotes,
      feeling: editFeeling,
      status: editStatus as 'in_progress' | 'completed',
      exercises: validExercises.length > 0 ? validExercises.map(ex => ({
        exerciseName: ex.exerciseName,
        sets: ex.sets.map((s: any) => ({
          weight: s.weight || undefined,
          reps: s.reps ? parseInt(s.reps) : undefined,
          setType: s.setType || 'working',
          restTime: s.restTime || 60,
        })),
        notes: ex.notes || undefined,
      })) : undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Data, Duração e Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Data do Treino</Label>
          <Input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Duração (min)</Label>
          <Input
            type="number"
            value={editDuration}
            onChange={(e) => setEditDuration(parseInt(e.target.value) || 60)}
            min={1}
          />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={editStatus} onValueChange={setEditStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_progress">Em andamento</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Sentimento */}
      <div className="space-y-2">
        <Label>Como você se sentiu?</Label>
        <div className="flex gap-2">
          {[
            { value: 'great', emoji: '😄', label: 'Ótimo' },
            { value: 'good', emoji: '🙂', label: 'Bem' },
            { value: 'normal', emoji: '😐', label: 'Normal' },
            { value: 'tired', emoji: '😓', label: 'Cansado' },
            { value: 'bad', emoji: '😞', label: 'Ruim' },
          ].map((f) => (
            <Button
              key={f.value}
              type="button"
              variant={editFeeling === f.value ? 'default' : 'outline'}
              className={editFeeling === f.value ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
              onClick={() => setEditFeeling(f.value)}
            >
              <span className="text-lg mr-1">{f.emoji}</span>
              <span className="text-xs">{f.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Exercícios */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Exercícios</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditExercises([...editExercises, {
              exerciseName: '',
              sets: [{ weight: '', reps: '', setType: 'working', restTime: 60 }],
              notes: '',
              isExpanded: true,
            }])}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Exercício
          </Button>
        </div>

        {editExercises.map((ex, exIndex) => (
          <div key={exIndex} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Nome do exercício"
                value={ex.exerciseName}
                onChange={(e) => {
                  const updated = [...editExercises];
                  updated[exIndex].exerciseName = e.target.value;
                  setEditExercises(updated);
                }}
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700"
                onClick={() => {
                  const updated = editExercises.filter((_, i) => i !== exIndex);
                  setEditExercises(updated.length > 0 ? updated : [{
                    exerciseName: '',
                    sets: [{ weight: '', reps: '', setType: 'working', restTime: 60 }],
                    notes: '',
                    isExpanded: true,
                  }]);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Séries */}
            <div className="space-y-2">
              {ex.sets.map((set: any, setIndex: number) => (
                <div key={setIndex} className="flex items-center gap-2 text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-medium">
                    {setIndex + 1}
                  </span>
                  <Select
                    value={set.setType}
                    onValueChange={(v) => {
                      const updated = [...editExercises];
                      updated[exIndex].sets[setIndex].setType = v;
                      setEditExercises(updated);
                    }}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warmup">Aquecimento</SelectItem>
                      <SelectItem value="feeler">Feeler</SelectItem>
                      <SelectItem value="working">Série Válida</SelectItem>
                      <SelectItem value="drop">Drop Set</SelectItem>
                      <SelectItem value="failure">Falha</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Peso"
                    value={set.weight}
                    onChange={(e) => {
                      const updated = [...editExercises];
                      updated[exIndex].sets[setIndex].weight = e.target.value;
                      setEditExercises(updated);
                    }}
                    className="w-20"
                  />
                  <span className="text-gray-500">kg</span>
                  <Input
                    type="number"
                    placeholder="Reps"
                    value={set.reps}
                    onChange={(e) => {
                      const updated = [...editExercises];
                      updated[exIndex].sets[setIndex].reps = e.target.value;
                      setEditExercises(updated);
                    }}
                    className="w-20"
                  />
                  <span className="text-gray-500">reps</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                    onClick={() => {
                      const updated = [...editExercises];
                      updated[exIndex].sets = updated[exIndex].sets.filter((_: any, i: number) => i !== setIndex);
                      if (updated[exIndex].sets.length === 0) {
                        updated[exIndex].sets = [{ weight: '', reps: '', setType: 'working', restTime: 60 }];
                      }
                      setEditExercises(updated);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-emerald-600"
                onClick={() => {
                  const updated = [...editExercises];
                  updated[exIndex].sets.push({ weight: '', reps: '', setType: 'working', restTime: 60 });
                  setEditExercises(updated);
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar Série
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          value={editNotes}
          onChange={(e) => setEditNotes(e.target.value)}
          placeholder="Como foi o treino? Alguma observação importante?"
          rows={3}
        />
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
