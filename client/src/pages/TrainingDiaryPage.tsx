import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Calendar, 
  Dumbbell, 
  Clock, 
  Target, 
  TrendingUp, 
  CheckCircle2, 
  Edit2, 
  Trash2, 
  Save,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Activity,
  Weight,
  Repeat,
  Timer,
  Flame,
  User,
  FileText,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

// Tipos de série
const SET_TYPES = [
  { value: "warmup", label: "Aquecimento", color: "bg-yellow-500" },
  { value: "feeler", label: "Reconhecimento", color: "bg-blue-500" },
  { value: "working", label: "Série Válida", color: "bg-green-500" },
  { value: "drop", label: "Drop Set", color: "bg-purple-500" },
  { value: "rest_pause", label: "Rest-Pause", color: "bg-orange-500" },
  { value: "failure", label: "Falha", color: "bg-red-500" },
];

// Sentimentos
const FEELINGS = [
  { value: "great", label: "Excelente", emoji: "🔥" },
  { value: "good", label: "Bom", emoji: "💪" },
  { value: "normal", label: "Normal", emoji: "😐" },
  { value: "tired", label: "Cansado", emoji: "😓" },
  { value: "exhausted", label: "Exausto", emoji: "😵" },
];

// Interface para série
// Interface para drop set individual
interface DropData {
  weight?: number;
  reps?: number;
  restTime?: number;
}

// Interface para pausa rest-pause individual
interface RestPauseData {
  weight?: number;
  reps?: number;
  pauseTime?: number;
}

interface SetData {
  id?: number;
  setNumber: number;
  setType?: string;
  weight?: number;
  reps?: number;
  restTime?: number;
  isDropSet?: boolean;
  dropWeight?: number;
  dropReps?: number;
  drops?: DropData[]; // Múltiplos drops
  isRestPause?: boolean;
  restPauseWeight?: number;
  restPauseReps?: number;
  restPausePause?: number;
  restPauses?: RestPauseData[]; // Múltiplas pausas
  rpe?: number;
  isCompleted?: boolean;
  notes?: string;
}

// Interface para exercício
interface ExerciseData {
  id?: number;
  exerciseId?: number;
  exerciseName: string;
  muscleGroup?: string;
  plannedSets?: number;
  plannedReps?: string;
  plannedRest?: number;
  notes?: string;
  isCompleted?: boolean;
  sets: SetData[];
  isExpanded?: boolean;
}

export default function TrainingDiaryPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("sessoes");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [showNewLogModal, setShowNewLogModal] = useState(false);
  const [showLogDetailModal, setShowLogDetailModal] = useState(false);
  const [showSessionLogModal, setShowSessionLogModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  
  // Estado para gráfico de evolução de carga
  const [progressExercise, setProgressExercise] = useState<string>("");
  const [selectedProgressDay, setSelectedProgressDay] = useState<number | null>(null); // Índice do dia selecionado no gráfico
  const [progressPeriod, setProgressPeriod] = useState<string>("3months"); // Filtro de período
  const [expandedHistoryItem, setExpandedHistoryItem] = useState<number | null>(null); // Item expandido no histórico
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estado do novo registro
  const [newLog, setNewLog] = useState({
    studentId: 0,
    workoutId: 0,
    workoutDayId: 0,
    trainingDate: new Date().toISOString().split('T')[0],
    dayName: "",
    startTime: "",
    notes: "",
    feeling: "" as string,
  });
  
  // Estado dos exercícios do registro atual
  const [currentExercises, setCurrentExercises] = useState<ExerciseData[]>([]);
  
  // Queries
  const { data: students } = trpc.students.list.useQuery();
  const { data: logs, refetch: refetchLogs } = trpc.trainingDiary.list.useQuery(
    selectedStudentId ? { studentId: parseInt(selectedStudentId) } : {}
  );
  const { data: logDetail, refetch: refetchLogDetail } = trpc.trainingDiary.get.useQuery(
    { id: selectedLogId! },
    { enabled: !!selectedLogId }
  );
  const { data: dashboard } = trpc.trainingDiary.dashboard.useQuery(
    selectedStudentId ? { studentId: parseInt(selectedStudentId) } : {}
  );
  const { data: muscleGroupData } = trpc.trainingDiary.muscleGroupAnalysis.useQuery(
    selectedStudentId ? { studentId: parseInt(selectedStudentId) } : {}
  );
  const { data: workouts } = trpc.workouts.list.useQuery({ studentId: 0 });
  
  // Query para buscar sessões do período (hoje e próximos 7 dias + últimos 7 dias)
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);
  
  const { data: upcomingSessions, refetch: refetchSessions } = trpc.sessions.list.useQuery({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    studentId: selectedStudentId && selectedStudentId !== 'all' ? parseInt(selectedStudentId) : undefined,
  });
  // Buscar dias do treino selecionado
  const { data: selectedWorkout } = trpc.workouts.get.useQuery(
    { id: newLog.workoutId },
    { enabled: newLog.workoutId > 0 }
  );
  const workoutDays = selectedWorkout?.days || [];
  const dayExercises = workoutDays.find((d: any) => d.id === newLog.workoutDayId)?.exercises || [];
  
  // Query para buscar histórico de evolução de carga
  const { data: exerciseProgress } = trpc.trainingDiary.exerciseProgress.useQuery(
    { 
      studentId: selectedStudentId ? parseInt(selectedStudentId) : undefined, 
      exerciseName: progressExercise,
      limit: 30
    },
    { enabled: !!progressExercise }
  );
  
  // Mutations
  const createLog = trpc.trainingDiary.create.useMutation({
    onMutate: (variables) => {
      console.log('=== createLog.onMutate ===');
      console.log('Variables:', variables);
    },
    onSuccess: (data) => {
      console.log('=== createLog.onSuccess ===');
      console.log('Data:', data);
      toast.success("Registro criado com sucesso!");
      setShowNewLogModal(false);
      refetchLogs();
      resetNewLog();
    },
    onError: (error) => {
      console.log('=== createLog.onError ===');
      console.log('Error:', error);
      toast.error("Erro ao criar registro", { description: error.message });
    },
  });
  
  const updateLog = trpc.trainingDiary.update.useMutation({
    onSuccess: () => {
      toast.success("Registro atualizado!");
      refetchLogDetail();
    },
  });
  
  const completeLog = trpc.trainingDiary.complete.useMutation({
    onSuccess: (data) => {
      toast.success("Treino finalizado!", {
        description: `Volume total: ${data.stats.totalVolume.toFixed(0)}kg | ${data.stats.totalSets} séries | ${data.stats.totalReps} reps`
      });
      refetchLogDetail();
      refetchLogs();
    },
  });
  
  const addSet = trpc.trainingDiary.addSet.useMutation({
    onSuccess: () => {
      refetchLogDetail();
    },
  });
  
  const updateSet = trpc.trainingDiary.updateSet.useMutation({
    onSuccess: () => {
      refetchLogDetail();
    },
  });
  
  const deleteSet = trpc.trainingDiary.deleteSet.useMutation({
    onSuccess: () => {
      refetchLogDetail();
    },
  });
  
  // Efeito para carregar exercícios quando abre modal de sessão com treino vinculado
  useEffect(() => {
    if (showSessionLogModal && selectedSession?.workoutId && selectedWorkout?.days) {
      // Encontrar o dia do treino baseado no workoutDayIndex
      const dayIndex = selectedSession.workoutDayIndex ?? 0;
      const day = selectedWorkout.days[dayIndex];
      if (day?.exercises && day.exercises.length > 0) {
        const exercises: ExerciseData[] = day.exercises.map((ex: any) => ({
          exerciseId: ex.id,
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
          plannedSets: ex.sets || 3,
          plannedReps: ex.reps || "8-12",
          plannedRest: ex.restTime || 60,
          notes: "",
          isCompleted: false,
          sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
            setNumber: i + 1,
            setType: i === 0 ? "warmup" : "working",
            weight: undefined,
            reps: undefined,
            restTime: ex.restTime || 60,
            isCompleted: false,
          })),
          isExpanded: true,
        }));
        setCurrentExercises(exercises);
        // Atualizar o workoutDayId no newLog
        if (day.id) {
          setNewLog(prev => ({ ...prev, workoutDayId: day.id }));
        }
      }
    }
  }, [showSessionLogModal, selectedSession, selectedWorkout]);
  
  // Efeito para carregar exercícios do treino selecionado
  useEffect(() => {
    if (dayExercises && dayExercises.length > 0) {
      const exercises: ExerciseData[] = dayExercises.map((ex: any) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        plannedSets: ex.sets || 3,
        plannedReps: ex.reps || "8-12",
        plannedRest: ex.restTime || 60,
        notes: "",
        isCompleted: false,
        sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
          setNumber: i + 1,
          setType: i === 0 ? "warmup" : "working",
          weight: undefined,
          reps: undefined,
          restTime: ex.restTime || 60,
          isCompleted: false,
        })),
        isExpanded: true,
      }));
      setCurrentExercises(exercises);
    }
  }, [dayExercises]);
  
  // Efeito para carregar detalhes do log selecionado
  useEffect(() => {
    if (logDetail && logDetail.exercises) {
      const exercises: ExerciseData[] = logDetail.exercises.map((ex: any) => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup,
        plannedSets: ex.plannedSets,
        plannedReps: ex.plannedReps,
        plannedRest: ex.plannedRest,
        notes: ex.notes,
        isCompleted: ex.isCompleted,
        sets: ex.sets.map((s: any) => ({
          id: s.id,
          setNumber: s.setNumber,
          setType: s.setType,
          weight: s.weight ? parseFloat(s.weight) : undefined,
          reps: s.reps,
          restTime: s.restTime,
          isDropSet: s.isDropSet,
          dropWeight: s.dropWeight ? parseFloat(s.dropWeight) : undefined,
          dropReps: s.dropReps,
          isRestPause: s.isRestPause,
          restPauseWeight: s.restPauseWeight ? parseFloat(s.restPauseWeight) : undefined,
          restPauseReps: s.restPauseReps,
          restPausePause: s.restPausePause,
          rpe: s.rpe,
          isCompleted: s.isCompleted,
          notes: s.notes,
        })),
        isExpanded: true,
      }));
      setCurrentExercises(exercises);
    }
  }, [logDetail]);
  
  const resetNewLog = () => {
    setNewLog({
      studentId: 0,
      workoutId: 0,
      workoutDayId: 0,
      trainingDate: new Date().toISOString().split('T')[0],
      dayName: "",
      startTime: "",
      notes: "",
      feeling: "",
    });
    setCurrentExercises([]);
  };
  
  const handleCreateLog = () => {
    console.log('=== handleCreateLog INICIADO ===');
    console.log('newLog:', newLog);
    console.log('currentExercises:', currentExercises);
    
    if (!newLog.studentId || newLog.studentId <= 0) {
      console.log('Validation failed: studentId missing or invalid', newLog.studentId);
      toast.error("Selecione um aluno");
      return;
    }
    
    if (!newLog.trainingDate) {
      console.log('Validation failed: trainingDate missing');
      toast.error("Selecione a data do treino");
      return;
    }
    
    console.log('Validation passed, calling createLog.mutate');
    
    createLog.mutate({
      studentId: newLog.studentId,
      workoutId: newLog.workoutId || undefined,
      workoutDayId: newLog.workoutDayId || undefined,
      trainingDate: newLog.trainingDate,
      dayName: newLog.dayName || undefined,
      startTime: newLog.startTime || undefined,
      notes: newLog.notes || undefined,
      exercises: currentExercises.map(ex => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup,
        plannedSets: ex.plannedSets,
        plannedReps: ex.plannedReps,
        plannedRest: ex.plannedRest,
        notes: ex.notes,
        sets: ex.sets.map(s => ({
          setNumber: s.setNumber,
          setType: s.setType as any,
          weight: s.weight,
          reps: s.reps,
          restTime: s.restTime,
          isDropSet: s.isDropSet,
          dropWeight: s.dropWeight,
          dropReps: s.dropReps,
          isRestPause: s.isRestPause,
          restPauseWeight: s.restPauseWeight,
          restPauseReps: s.restPauseReps,
          restPausePause: s.restPausePause,
          rpe: s.rpe,
          isCompleted: s.isCompleted,
          notes: s.notes,
        })),
      })),
    });
  };
  
  const handleUpdateSet = (exerciseIndex: number, setIndex: number, field: string, value: any) => {
    const updatedExercises = [...currentExercises];
    const set = updatedExercises[exerciseIndex].sets[setIndex];
    (set as any)[field] = value;
    setCurrentExercises(updatedExercises);
    
    // Se estiver editando um log existente, salvar automaticamente
    if (set.id && isEditing) {
      updateSet.mutate({
        id: set.id,
        [field]: value,
      });
    }
  };
  
  const handleAddSet = (exerciseIndex: number) => {
    const updatedExercises = [...currentExercises];
    const exercise = updatedExercises[exerciseIndex];
    const newSetNumber = exercise.sets.length + 1;
    
    const newSet: SetData = {
      setNumber: newSetNumber,
      setType: "working",
      weight: undefined,
      reps: undefined,
      restTime: exercise.plannedRest || 60,
      isCompleted: false,
    };
    
    exercise.sets.push(newSet);
    setCurrentExercises(updatedExercises);
    
    // Se estiver editando um log existente, criar a série no banco
    if (exercise.id && isEditing) {
      addSet.mutate({
        workoutLogExerciseId: exercise.id,
        setNumber: newSetNumber,
        setType: "working",
        restTime: exercise.plannedRest || 60,
      });
    }
  };
  
  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...currentExercises];
    const set = updatedExercises[exerciseIndex].sets[setIndex];
    
    // Se a série tem ID, deletar do banco
    if (set.id) {
      deleteSet.mutate({ id: set.id });
    }
    
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
    // Renumerar séries
    updatedExercises[exerciseIndex].sets.forEach((s, i) => {
      s.setNumber = i + 1;
    });
    setCurrentExercises(updatedExercises);
  };
  
  const handleCompleteLog = () => {
    if (!selectedLogId) return;
    
    completeLog.mutate({
      id: selectedLogId,
      feeling: newLog.feeling as any || undefined,
      notes: newLog.notes || undefined,
    });
  };
  
  const toggleExerciseExpand = (index: number) => {
    const updatedExercises = [...currentExercises];
    updatedExercises[index].isExpanded = !updatedExercises[index].isExpanded;
    setCurrentExercises(updatedExercises);
  };
  
  const openLogDetail = (logId: number) => {
    setSelectedLogId(logId);
    setShowLogDetailModal(true);
    setIsEditing(true);
  };
  
  const getSetTypeColor = (type?: string) => {
    const found = SET_TYPES.find(t => t.value === type);
    return found?.color || "bg-gray-500";
  };
  
  const getSetTypeLabel = (type?: string) => {
    const found = SET_TYPES.find(t => t.value === type);
    return found?.label || "Série";
  };
  
  const getFeelingEmoji = (feeling?: string) => {
    const found = FEELINGS.find(f => f.value === feeling);
    return found?.emoji || "";
  };
  
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };
  
  // Calcular progresso do treino atual
  const calculateProgress = () => {
    if (currentExercises.length === 0) return 0;
    
    let totalSets = 0;
    let completedSets = 0;
    
    currentExercises.forEach(ex => {
      ex.sets.forEach(set => {
        totalSets++;
        // Considera como "feita" se tem peso E reps preenchidos
        if (set.weight && set.reps) completedSets++;
      });
    });
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Dumbbell className="h-6 w-6 text-primary" />
              Diário de Treino do Maromba
            </h1>
            <p className="text-muted-foreground">
              Registre e acompanhe a evolução dos treinos dos seus alunos
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrar por aluno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os alunos</SelectItem>
                {students?.map((student: any) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={() => setShowNewLogModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Registro
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessoes" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sessões
            </TabsTrigger>
            <TabsTrigger value="registros" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Registros
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
          </TabsList>
          
          {/* Tab: Sessões */}
          <TabsContent value="sessoes" className="space-y-4">
            {upcomingSessions && upcomingSessions.length > 0 ? (
              <div className="space-y-6">
                {/* Sessões de Hoje */}
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const todaySessions = upcomingSessions.filter((s: any) => {
                    const sessionDate = new Date(s.scheduledAt).toISOString().split('T')[0];
                    return sessionDate === todayStr;
                  });
                  
                  if (todaySessions.length === 0) return null;
                  
                  return (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Hoje ({new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })})
                      </h3>
                      <div className="grid gap-3">
                        {todaySessions.map((session: any) => (
                          <Card 
                            key={session.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              session.status === 'completed' ? 'border-green-500 bg-green-50/50' :
                              session.status === 'cancelled' ? 'border-red-300 bg-red-50/50 opacity-60' :
                              'hover:border-primary'
                            }`}
onClick={() => {
                                              if (session.status !== 'cancelled') {
                                                // Se a sessão já tem um registro de treino, abrir detalhes
                                                if (session.status === 'completed' && session.workoutLogId) {
                                                  openLogDetail(session.workoutLogId);
                                                } else {
                                                  // Senão, abrir modal para registrar treino
                                                  setSelectedSession(session);
                                                  setNewLog({
                                                    studentId: session.studentId,
                                                    workoutId: session.workoutId || 0,
                                                    workoutDayId: 0,
                                                    trainingDate: new Date(session.scheduledAt).toISOString().split('T')[0],
                                                    dayName: session.workoutDayIndex !== null ? `Treino ${String.fromCharCode(65 + session.workoutDayIndex)}` : '',
                                                    startTime: new Date(session.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                                    notes: session.notes || '',
                                                    feeling: '',
                                                  });
                                                  setShowSessionLogModal(true);
                                                }
                                              }
                                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                                    session.status === 'completed' ? 'bg-green-100' :
                                    session.status === 'cancelled' ? 'bg-red-100' :
                                    'bg-primary/10'
                                  }`}>
                                    {session.status === 'completed' ? (
                                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    ) : session.status === 'cancelled' ? (
                                      <AlertCircle className="h-6 w-6 text-red-500" />
                                    ) : (
                                      <Dumbbell className="h-6 w-6 text-primary" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{session.student?.name || 'Aluno'}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(session.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                      {session.duration && ` • ${session.duration}min`}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {session.workoutId && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Dumbbell className="h-3 w-3" />
                                      Treino {session.workoutDayIndex !== null ? String.fromCharCode(65 + session.workoutDayIndex) : ''}
                                    </Badge>
                                  )}
                                  <Badge variant={
                                    session.status === 'completed' ? 'default' :
                                    session.status === 'cancelled' ? 'destructive' :
                                    session.status === 'confirmed' ? 'default' :
                                    'secondary'
                                  }>
                                    {session.status === 'completed' ? 'Concluído' :
                                     session.status === 'cancelled' ? 'Cancelado' :
                                     session.status === 'confirmed' ? 'Confirmado' :
                                     session.status === 'no_show' ? 'Faltou' :
                                     'Agendado'}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Próximas Sessões */}
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const futureSessions = upcomingSessions.filter((s: any) => {
                    const sessionDate = new Date(s.scheduledAt).toISOString().split('T')[0];
                    return sessionDate > todayStr && s.status !== 'cancelled';
                  }).sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
                  
                  if (futureSessions.length === 0) return null;
                  
                  return (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-500" />
                        Próximas Sessões
                      </h3>
                      <div className="grid gap-3">
                        {futureSessions.slice(0, 10).map((session: any) => (
                          <Card 
                            key={session.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${session.status === 'completed' ? 'border-green-500 bg-green-50/50' : 'hover:border-primary'}`}
                            onClick={() => {
                              // Se a sessão já tem um registro de treino, abrir detalhes
                              if (session.status === 'completed' && session.workoutLogId) {
                                openLogDetail(session.workoutLogId);
                              } else {
                                // Senão, abrir modal para registrar treino
                                setSelectedSession(session);
                                setNewLog({
                                  studentId: session.studentId,
                                  workoutId: session.workoutId || 0,
                                  workoutDayId: 0,
                                  trainingDate: new Date(session.scheduledAt).toISOString().split('T')[0],
                                  dayName: session.workoutDayIndex !== null ? `Treino ${String.fromCharCode(65 + session.workoutDayIndex)}` : '',
                                  startTime: new Date(session.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                  notes: session.notes || '',
                                  feeling: '',
                                });
                                setShowSessionLogModal(true);
                              }
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{session.student?.name || 'Aluno'}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(session.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                      {' às '}
                                      {new Date(session.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {session.workoutId && (
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Dumbbell className="h-3 w-3" />
                                      Treino {session.workoutDayIndex !== null ? String.fromCharCode(65 + session.workoutDayIndex) : ''}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                {/* Sessões Passadas (sem registro) */}
                {(() => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const pastSessions = upcomingSessions.filter((s: any) => {
                    const sessionDate = new Date(s.scheduledAt).toISOString().split('T')[0];
                    return sessionDate < todayStr && s.status !== 'cancelled' && s.status !== 'completed';
                  }).sort((a: any, b: any) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
                  
                  if (pastSessions.length === 0) return null;
                  
                  return (
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-5 w-5" />
                        Pendentes de Registro
                      </h3>
                      <div className="grid gap-3">
                        {pastSessions.map((session: any) => (
                          <Card 
                            key={session.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${session.status === 'completed' && session.workoutLogId ? 'border-green-500 bg-green-50/50' : 'border-amber-300 bg-amber-50/50'}`}
                            onClick={() => {
                              // Se a sessão já tem um registro de treino, abrir detalhes
                              if (session.status === 'completed' && session.workoutLogId) {
                                openLogDetail(session.workoutLogId);
                              } else {
                                // Senão, abrir modal para registrar treino
                                setSelectedSession(session);
                                setNewLog({
                                  studentId: session.studentId,
                                  workoutId: session.workoutId || 0,
                                  workoutDayId: 0,
                                  trainingDate: new Date(session.scheduledAt).toISOString().split('T')[0],
                                  dayName: session.workoutDayIndex !== null ? `Treino ${String.fromCharCode(65 + session.workoutDayIndex)}` : '',
                                  startTime: new Date(session.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                  notes: session.notes || '',
                                  feeling: '',
                                });
                                setShowSessionLogModal(true);
                              }
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                                    <AlertCircle className="h-6 w-6 text-amber-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold">{session.student?.name || 'Aluno'}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(session.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                      {' às '}
                                      {new Date(session.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                  Sem registro
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma sessão encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Não há sessões agendadas para os próximos dias.
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = '/agenda'}>
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar Sessão
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab: Registros */}
          <TabsContent value="registros" className="space-y-4">
            {logs && logs.length > 0 ? (
              <div className="grid gap-4">
                {logs.map((log: any) => (
                  <Card 
                    key={log.id} 
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => openLogDetail(log.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Dumbbell className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{log.student?.name || "Aluno"}</h3>
                              {log.feeling && (
                                <span className="text-lg">{getFeelingEmoji(log.feeling)}</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {log.dayName || "Treino"} • {formatDate(log.trainingDate)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={log.status === 'completed' ? 'default' : 'secondary'}>
                            {log.status === 'completed' ? 'Concluído' : 
                             log.status === 'in_progress' ? 'Em andamento' : 'Cancelado'}
                          </Badge>
                          
                          {log.totalVolume && parseFloat(log.totalVolume) > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Weight className="h-3 w-3" />
                              {parseFloat(log.totalVolume).toFixed(0)}kg
                            </Badge>
                          )}
                          
                          {log.totalSets && log.totalSets > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Repeat className="h-3 w-3" />
                              {log.totalSets} séries
                            </Badge>
                          )}
                          
                          {log.totalDuration && log.totalDuration > 0 && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {log.totalDuration}min
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum registro encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece a registrar os treinos dos seus alunos para acompanhar a evolução.
                  </p>
                  <Button onClick={() => setShowNewLogModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Registro
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab: Dashboard */}
          <TabsContent value="dashboard" className="space-y-4">
            {dashboard ? (
              <>
                {/* Cards de resumo */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Dumbbell className="h-4 w-4" />
                        <span className="text-sm">Treinos</span>
                      </div>
                      <p className="text-2xl font-bold">{dashboard.totalWorkouts}</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Weight className="h-4 w-4" />
                        <span className="text-sm">Volume Total</span>
                      </div>
                      <p className="text-2xl font-bold">{dashboard.totalVolume.toLocaleString('pt-BR')}kg</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Repeat className="h-4 w-4" />
                        <span className="text-sm">Séries</span>
                      </div>
                      <p className="text-2xl font-bold">{dashboard.totalSets}</p>
                    </CardContent>
                  </Card>
                  
                </div>
                
                {/* Gráfico de treinos por mês */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Treinos por Mês
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between gap-2 h-40">
                      {dashboard.workoutsByMonth?.map((item: any, index: number) => {
                        const maxCount = Math.max(...dashboard.workoutsByMonth.map((i: any) => i.count));
                        const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs font-medium">{item.count}</span>
                            <div 
                              className="w-full bg-primary rounded-t transition-all"
                              style={{ height: `${Math.max(height, 5)}%` }}
                            />
                            <span className="text-xs text-muted-foreground">{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Gráfico de volume por mês */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Volume por Mês (kg)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between gap-2 h-40">
                      {dashboard.volumeByMonth?.map((item: any, index: number) => {
                        const maxVolume = Math.max(...dashboard.volumeByMonth.map((i: any) => i.volume));
                        const height = maxVolume > 0 ? (item.volume / maxVolume) * 100 : 0;
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-1">
                            <span className="text-xs font-medium">{item.volume.toLocaleString('pt-BR')}kg</span>
                            <div 
                              className="w-full bg-green-500 rounded-t transition-all"
                              style={{ height: `${Math.max(height, 5)}%` }}
                            />
                            <span className="text-xs text-muted-foreground">{item.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Análise por Grupo Muscular */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Análise por Grupo Muscular
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Volume e frequência de treino por grupo muscular</p>
                  </CardHeader>
                  <CardContent>
                    {muscleGroupData && muscleGroupData.length > 0 ? (
                      <div className="space-y-4">
                        {/* Gráfico de barras horizontais */}
                        <div className="space-y-3">
                          {muscleGroupData.map((group: any, index: number) => {
                            const maxVolume = Math.max(...muscleGroupData.map((g: any) => g.volume));
                            const percentage = maxVolume > 0 ? (group.volume / maxVolume) * 100 : 0;
                            const colors = [
                              'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500',
                              'bg-pink-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-red-500',
                              'bg-indigo-500', 'bg-teal-500', 'bg-lime-500', 'bg-amber-500'
                            ];
                            const color = colors[index % colors.length];
                            return (
                              <div key={group.name} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{group.name}</span>
                                  <span className="text-muted-foreground">
                                    {group.volume.toLocaleString('pt-BR')}kg · {group.sets} séries · {group.exercises} exercícios
                                  </span>
                                </div>
                                <div className="h-4 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${color} rounded-full transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Resumo */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t">
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <p className="text-lg font-bold">{muscleGroupData.length}</p>
                            <p className="text-xs text-muted-foreground">Grupos</p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <p className="text-lg font-bold">
                              {muscleGroupData.reduce((sum: number, g: any) => sum + g.volume, 0).toLocaleString('pt-BR')}kg
                            </p>
                            <p className="text-xs text-muted-foreground">Volume Total</p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <p className="text-lg font-bold">
                              {muscleGroupData.reduce((sum: number, g: any) => sum + g.sets, 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">Séries Totais</p>
                          </div>
                          <div className="text-center p-2 bg-muted/50 rounded-lg">
                            <p className="text-lg font-bold">
                              {muscleGroupData.reduce((sum: number, g: any) => sum + g.exercises, 0)}
                            </p>
                            <p className="text-xs text-muted-foreground">Exercícios</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum dado de grupo muscular disponível</p>
                        <p className="text-sm">Registre treinos com exercícios para ver a análise</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Distribuição de sentimento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Como se Sentiram
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      {FEELINGS.map((feeling) => {
                        const count = (dashboard.feelingDistribution as Record<string, number>)?.[feeling.value] || 0;
                        return (
                          <div key={feeling.value} className="flex items-center gap-2">
                            <span className="text-2xl">{feeling.emoji}</span>
                            <div>
                              <p className="font-medium">{count}</p>
                              <p className="text-xs text-muted-foreground">{feeling.label}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                
                {/* Gráfico de Evolução de Carga por Exercício */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Evolução de Carga por Exercício
                    </CardTitle>
                    <CardDescription>
                      Acompanhe a progressão de carga ao longo do tempo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Filtros */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Exercício</Label>
                        <Input
                          placeholder="Digite o nome do exercício"
                          value={progressExercise}
                          onChange={(e) => {
                            setProgressExercise(e.target.value);
                            setExpandedHistoryItem(null);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Período</Label>
                        <Select value={progressPeriod} onValueChange={setProgressPeriod}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o período" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="week">Última semana</SelectItem>
                            <SelectItem value="month">Último mês</SelectItem>
                            <SelectItem value="3months">Últimos 3 meses</SelectItem>
                            <SelectItem value="6months">Últimos 6 meses</SelectItem>
                            <SelectItem value="year">Último ano</SelectItem>
                            <SelectItem value="all">Todo o período</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Conteúdo */}
                    {exerciseProgress && exerciseProgress.length > 0 ? (() => {
                      // Filtrar por período
                      const now = new Date();
                      const filteredProgress = exerciseProgress.filter((item: any) => {
                        const itemDate = new Date(item.date);
                        const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
                        switch (progressPeriod) {
                          case 'week': return diffDays <= 7;
                          case 'month': return diffDays <= 30;
                          case '3months': return diffDays <= 90;
                          case '6months': return diffDays <= 180;
                          case 'year': return diffDays <= 365;
                          default: return true;
                        }
                      });
                      
                      if (filteredProgress.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>Nenhum registro encontrado neste período.</p>
                            <p className="text-sm">Tente selecionar um período maior.</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-4">
                          {/* Resumo compacto */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                              <p className="text-xl font-bold text-primary">
                                {Math.max(...filteredProgress.map((i: any) => i.maxWeight || 0))}kg
                              </p>
                              <p className="text-xs text-muted-foreground">Recorde</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-xl font-bold">
                                {(filteredProgress.reduce((sum: number, i: any) => sum + (i.maxWeight || 0), 0) / filteredProgress.length).toFixed(1)}kg
                              </p>
                              <p className="text-xs text-muted-foreground">Média</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-xl font-bold">
                                {filteredProgress.length}
                              </p>
                              <p className="text-xs text-muted-foreground">Treinos</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-xl font-bold">
                                {filteredProgress.reduce((sum: number, i: any) => sum + (i.totalReps || 0), 0)}
                              </p>
                              <p className="text-xs text-muted-foreground">Reps</p>
                            </div>
                          </div>
                          
                          {/* Gráfico de linha compacto */}
                          <div className="border rounded-lg p-4 bg-muted/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">Tendência de Carga Máxima</span>
                              <span className="text-xs text-muted-foreground">
                                {filteredProgress.length} registros
                              </span>
                            </div>
                            <div className="relative h-24">
                              {/* Linha de tendência SVG */}
                              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                                {/* Linha de fundo */}
                                <line x1="0" y1="35" x2="100" y2="35" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
                                <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
                                <line x1="0" y1="5" x2="100" y2="5" stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
                                
                                {/* Linha de evolução */}
                                {(() => {
                                  const maxW = Math.max(...filteredProgress.map((i: any) => i.maxWeight || 0));
                                  const minW = Math.min(...filteredProgress.map((i: any) => i.maxWeight || 0));
                                  const range = maxW - minW || 1;
                                  const points = filteredProgress.slice().reverse().map((item: any, idx: number) => {
                                    const x = (idx / Math.max(filteredProgress.length - 1, 1)) * 100;
                                    const y = 35 - ((item.maxWeight - minW) / range) * 30;
                                    return `${x},${y}`;
                                  }).join(' ');
                                  return (
                                    <>
                                      <polyline
                                        fill="none"
                                        stroke="hsl(var(--primary))"
                                        strokeWidth="1.5"
                                        points={points}
                                      />
                                      {/* Pontos */}
                                      {filteredProgress.slice().reverse().map((item: any, idx: number) => {
                                        const x = (idx / Math.max(filteredProgress.length - 1, 1)) * 100;
                                        const y = 35 - ((item.maxWeight - minW) / range) * 30;
                                        return (
                                          <circle
                                            key={idx}
                                            cx={x}
                                            cy={y}
                                            r="1.5"
                                            fill="hsl(var(--primary))"
                                          />
                                        );
                                      })}
                                    </>
                                  );
                                })()}
                              </svg>
                              {/* Labels */}
                              <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-muted-foreground">
                                <span>{new Date(filteredProgress[filteredProgress.length - 1]?.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                                <span>{new Date(filteredProgress[0]?.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Histórico detalhado expansível */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted/50 px-4 py-2 font-medium text-sm flex items-center justify-between">
                              <span>Histórico Detalhado</span>
                              <span className="text-xs text-muted-foreground">Clique para expandir</span>
                            </div>
                            <div className="divide-y max-h-[500px] overflow-y-auto">
                              {filteredProgress.map((item: any, index: number) => {
                                const date = new Date(item.date);
                                const isExpanded = expandedHistoryItem === index;
                                return (
                                  <div key={index} className="bg-background">
                                    {/* Cabeçalho clicável */}
                                    <div 
                                      className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
                                      onClick={() => setExpandedHistoryItem(isExpanded ? null : index)}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={`p-1.5 rounded-full transition-colors ${isExpanded ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </div>
                                        <div>
                                          <div className="font-medium text-sm">
                                            {date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                          </div>
                                          <div className="text-xs text-muted-foreground">
                                            {item.exerciseName}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                        <div className="text-right">
                                          <div className="font-bold text-primary">{item.maxWeight}kg</div>
                                          <div className="text-xs text-muted-foreground">
                                            {item.totalSets} séries • {item.totalReps} reps
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Detalhes expandidos */}
                                    {isExpanded && (
                                      <div className="px-4 pb-4 bg-muted/30">
                                        <div className="overflow-x-auto">
                                          <table className="w-full text-sm">
                                            <thead>
                                              <tr className="border-b">
                                                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Série</th>
                                                <th className="text-left py-2 px-2 font-medium text-muted-foreground">Tipo</th>
                                                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Carga</th>
                                                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Reps</th>
                                                <th className="text-right py-2 px-2 font-medium text-muted-foreground">Descanso</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {item.sets && item.sets.length > 0 ? (
                                                item.sets.map((set: any, setIndex: number) => {
                                                  const setTypeLabel = SET_TYPES.find(t => t.value === set.setType)?.label || set.setType || 'Válida';
                                                  const setTypeColor = SET_TYPES.find(t => t.value === set.setType)?.color || 'bg-green-500';
                                                  return (
                                                    <tr key={setIndex} className="border-b last:border-b-0">
                                                      <td className="py-2 px-2">
                                                        <span className="font-medium">S{set.setNumber || setIndex + 1}</span>
                                                      </td>
                                                      <td className="py-2 px-2">
                                                        <Badge variant="outline" className={`${setTypeColor} text-white border-0 text-xs`}>
                                                          {setTypeLabel}
                                                        </Badge>
                                                      </td>
                                                      <td className="py-2 px-2 text-right font-bold">
                                                        {set.weight ? `${set.weight}kg` : '-'}
                                                      </td>
                                                      <td className="py-2 px-2 text-right">
                                                        {set.reps || '-'}
                                                      </td>
                                                      <td className="py-2 px-2 text-right text-muted-foreground">
                                                        {set.restTime ? `${set.restTime}s` : '-'}
                                                      </td>
                                                    </tr>
                                                  );
                                                })
                                              ) : (
                                                <tr>
                                                  <td colSpan={5} className="py-4 text-center text-muted-foreground">
                                                    Nenhuma série registrada
                                                  </td>
                                                </tr>
                                              )}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })() : progressExercise ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum registro encontrado para este exercício.</p>
                        <p className="text-sm">Registre treinos para ver a evolução.</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Digite o nome do exercício</p>
                        <p className="text-sm">para ver a evolução de carga ao longo do tempo.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sem dados suficientes</h3>
                  <p className="text-muted-foreground">
                    Registre treinos para visualizar estatísticas e gráficos de evolução.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Modal: Novo Registro */}
        <Dialog open={showNewLogModal} onOpenChange={setShowNewLogModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Novo Registro de Treino
              </DialogTitle>
              <DialogDescription>
                Registre um novo treino para acompanhar a evolução do aluno
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aluno *</Label>
                  <Select 
                    value={newLog.studentId > 0 ? newLog.studentId.toString() : ""} 
                    onValueChange={(v) => {
                      console.log('Aluno selecionado:', v);
                      setNewLog({ ...newLog, studentId: parseInt(v) });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map((student: any) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Data do Treino *</Label>
                  <Input
                    type="date"
                    value={newLog.trainingDate}
                    onChange={(e) => setNewLog({ ...newLog, trainingDate: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Treino</Label>
                  <Select 
                    value={newLog.workoutId.toString()} 
                    onValueChange={(v) => setNewLog({ ...newLog, workoutId: parseInt(v), workoutDayId: 0 })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o treino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Treino livre</SelectItem>
                      {workouts?.map((workout: any) => (
                        <SelectItem key={workout.id} value={workout.id.toString()}>
                          {workout.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {newLog.workoutId > 0 && workoutDays && workoutDays.length > 0 && (
                  <div className="space-y-2">
                    <Label>Dia do Treino</Label>
                    <Select 
                      value={newLog.workoutDayId.toString()} 
                      onValueChange={(v) => {
                        const dayId = parseInt(v);
                        const day = workoutDays.find((d: any) => d.id === dayId);
                        setNewLog({ 
                          ...newLog, 
                          workoutDayId: dayId,
                          dayName: day?.name || ""
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o dia" />
                      </SelectTrigger>
                      <SelectContent>
                        {workoutDays.map((day: any) => (
                          <SelectItem key={day.id} value={day.id.toString()}>
                            {day.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label>Horário de Início</Label>
                  <Input
                    type="time"
                    value={newLog.startTime}
                    onChange={(e) => setNewLog({ ...newLog, startTime: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Nome do Dia (opcional)</Label>
                  <Input
                    placeholder="Ex: Treino A - Peito e Tríceps"
                    value={newLog.dayName}
                    onChange={(e) => setNewLog({ ...newLog, dayName: e.target.value })}
                  />
                </div>
              </div>
              
              {/* Exercícios */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Exercícios
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentExercises([...currentExercises, {
                        exerciseName: "",
                        muscleGroup: "",
                        plannedSets: 3,
                        plannedReps: "8-12",
                        plannedRest: 60,
                        notes: "",
                        isCompleted: false,
                        sets: [
                          { setNumber: 1, setType: "warmup", isCompleted: false },
                          { setNumber: 2, setType: "working", isCompleted: false },
                          { setNumber: 3, setType: "working", isCompleted: false },
                        ],
                        isExpanded: true,
                      }]);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Exercício
                  </Button>
                </div>
                
                {currentExercises.length === 0 ? (
                  <Card>
                    <CardContent className="p-4 text-center text-muted-foreground">
                      <p>Selecione um treino/dia ou adicione exercícios manualmente</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {currentExercises.map((exercise, exIndex) => (
                      <Card key={exIndex} className="overflow-hidden">
                        <CardHeader 
                          className="p-3 cursor-pointer hover:bg-muted/50"
                          onClick={() => toggleExerciseExpand(exIndex)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold text-primary">{exIndex + 1}</span>
                              <div>
                                <Input
                                  className="font-semibold border-0 p-0 h-auto focus-visible:ring-0"
                                  placeholder="Nome do exercício"
                                  value={exercise.exerciseName}
                                  onChange={(e) => {
                                    const updated = [...currentExercises];
                                    updated[exIndex].exerciseName = e.target.value;
                                    setCurrentExercises(updated);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {exercise.muscleGroup && (
                                  <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {exercise.sets.filter(s => s.weight && s.reps).length}/{exercise.sets.length} séries
                              </Badge>
                              {exercise.isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        
                        {exercise.isExpanded && (
                          <CardContent className="p-0">
                            {/* Lista de séries - layout compacto sem rolagem */}
                            <div className="divide-y">
                              {exercise.sets.map((set, setIndex) => (
                                <div key={setIndex} className="p-3">
                                  {/* Linha principal da série */}
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold flex-shrink-0 ${getSetTypeColor(set.setType)}`}>
                                      {set.setNumber}
                                    </span>
                                    
                                    <Select
                                      value={set.setType || "working"}
                                      onValueChange={(v) => {
                                        handleUpdateSet(exIndex, setIndex, 'setType', v);
                                        // Auto-ativar flags quando seleciona drop ou rest_pause
                                        if (v === 'drop') {
                                          handleUpdateSet(exIndex, setIndex, 'isDropSet', true);
                                        } else if (v === 'rest_pause') {
                                          handleUpdateSet(exIndex, setIndex, 'isRestPause', true);
                                        } else {
                                          handleUpdateSet(exIndex, setIndex, 'isDropSet', false);
                                          handleUpdateSet(exIndex, setIndex, 'isRestPause', false);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-[120px] text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {SET_TYPES.map((type) => (
                                          <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        className="h-8 w-16 text-center text-sm"
                                        placeholder="0"
                                        value={set.weight || ""}
                                        onChange={(e) => handleUpdateSet(exIndex, setIndex, 'weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                      />
                                      <span className="text-xs text-muted-foreground">kg</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        className="h-8 w-14 text-center text-sm"
                                        placeholder="0"
                                        value={set.reps || ""}
                                        onChange={(e) => handleUpdateSet(exIndex, setIndex, 'reps', e.target.value ? parseInt(e.target.value) : undefined)}
                                      />
                                      <span className="text-xs text-muted-foreground">reps</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <Input
                                        type="number"
                                        className="h-8 w-14 text-center text-sm"
                                        placeholder="60"
                                        value={set.restTime || ""}
                                        onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restTime', e.target.value ? parseInt(e.target.value) : undefined)}
                                      />
                                      <span className="text-xs text-muted-foreground">s</span>
                                    </div>
                                    
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-destructive ml-auto"
                                      onClick={() => handleRemoveSet(exIndex, setIndex)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                  
                                  {/* Área expandida para Drop Set */}
                                  {(set.setType === 'drop' || set.isDropSet) && (
                                    <div className="mt-2 ml-9 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-purple-500 text-white text-xs">Drop Set</Badge>
                                        <span className="text-xs text-muted-foreground">Redução de carga após a série principal</span>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              className="h-8 w-16 text-center text-sm"
                                              placeholder="0"
                                              value={set.dropWeight || ""}
                                              onChange={(e) => handleUpdateSet(exIndex, setIndex, 'dropWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                            />
                                            <span className="text-xs text-muted-foreground">kg</span>
                                          </div>
                                          <span className="text-muted-foreground">×</span>
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              className="h-8 w-14 text-center text-sm"
                                              placeholder="0"
                                              value={set.dropReps || ""}
                                              onChange={(e) => handleUpdateSet(exIndex, setIndex, 'dropReps', e.target.value ? parseInt(e.target.value) : undefined)}
                                            />
                                            <span className="text-xs text-muted-foreground">reps</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* Área expandida para Rest-Pause */}
                                  {(set.setType === 'rest_pause' || set.isRestPause) && (
                                    <div className="mt-2 ml-9 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge className="bg-orange-500 text-white text-xs">Rest-Pause</Badge>
                                        <span className="text-xs text-muted-foreground">Pausa curta e continuação</span>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              className="h-8 w-16 text-center text-sm"
                                              placeholder="0"
                                              value={set.restPauseWeight || ""}
                                              onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restPauseWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                            />
                                            <span className="text-xs text-muted-foreground">kg</span>
                                          </div>
                                          <span className="text-muted-foreground">×</span>
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              className="h-8 w-14 text-center text-sm"
                                              placeholder="0"
                                              value={set.restPauseReps || ""}
                                              onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restPauseReps', e.target.value ? parseInt(e.target.value) : undefined)}
                                            />
                                            <span className="text-xs text-muted-foreground">reps</span>
                                          </div>
                                          <span className="text-muted-foreground">|</span>
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              className="h-8 w-14 text-center text-sm"
                                              placeholder="15"
                                              value={set.restPausePause || ""}
                                              onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restPausePause', e.target.value ? parseInt(e.target.value) : undefined)}
                                            />
                                            <span className="text-xs text-muted-foreground">s pausa</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Botão adicionar série */}
                            <div className="p-2 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => handleAddSet(exIndex)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar Série
                              </Button>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações Gerais</Label>
                <Textarea
                  placeholder="Anotações sobre o treino..."
                  value={newLog.notes}
                  onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setShowNewLogModal(false)}>
                Cancelar
              </Button>
              <Button 
                type="button"
                onClick={handleCreateLog}
                disabled={createLog.isPending}
              >
                {createLog.isPending ? "Salvando..." : "Criar Registro"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Modal: Detalhe do Registro */}
        <Dialog open={showLogDetailModal} onOpenChange={(open) => {
          setShowLogDetailModal(open);
          if (!open) {
            setSelectedLogId(null);
            setIsEditing(false);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span className="flex items-center gap-2">
                    {logDetail?.dayName || "Registro de Treino"}
                    {logDetail?.feeling && (
                      <span className="text-lg">{getFeelingEmoji(logDetail.feeling)}</span>
                    )}
                  </span>
                  <p className="text-sm font-normal text-muted-foreground">
                    {logDetail?.student?.name}
                  </p>
                </div>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {logDetail && formatDate(logDetail.trainingDate)}
                </span>
                {logDetail?.startTime && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {logDetail.startTime}
                    {logDetail.endTime && ` - ${logDetail.endTime}`}
                  </span>
                )}

              </DialogDescription>
            </DialogHeader>
            
            {logDetail && (
              <div className="space-y-6">
                {/* Status e progresso */}
                <div className="flex items-center justify-between">
                  <Badge variant={logDetail.status === 'completed' ? 'default' : 'secondary'}>
                    {logDetail.status === 'completed' ? 'Concluído' : 
                     logDetail.status === 'in_progress' ? 'Em andamento' : 'Cancelado'}
                  </Badge>
                  
                  {logDetail.status === 'in_progress' && (
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${calculateProgress()}%` }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">{calculateProgress()}%</span>
                    </div>
                  )}
                </div>
                
                {/* Estatísticas */}
                {logDetail.status === 'completed' && (
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="p-3 text-center">
                        <Weight className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{parseFloat(logDetail.totalVolume || '0').toFixed(0)}kg</p>
                        <p className="text-xs text-muted-foreground">Volume</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <Repeat className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{logDetail.totalSets || 0}</p>
                        <p className="text-xs text-muted-foreground">Séries</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-3 text-center">
                        <Target className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{logDetail.totalReps || 0}</p>
                        <p className="text-xs text-muted-foreground">Reps</p>
                      </CardContent>
                    </Card>

                  </div>
                )}
                
                {/* Exercícios */}
                <div className="space-y-4">
                  {currentExercises.map((exercise, exIndex) => (
                    <Card key={exIndex} className="overflow-hidden">
                      <CardHeader 
                        className="p-3 cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleExerciseExpand(exIndex)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-primary">{exIndex + 1}</span>
                            <div>
                              <h4 className="font-semibold">{exercise.exerciseName}</h4>
                              {exercise.muscleGroup && (
                                <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {exercise.sets.filter(s => s.weight && s.reps).length}/{exercise.sets.length} séries
                            </Badge>
                            {exercise.isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      {exercise.isExpanded && (
                        <CardContent className="p-0">
                          {/* Lista de séries - layout compacto */}
                          <div className="divide-y">
                            {exercise.sets.map((set, setIndex) => (
                              <div key={setIndex} className="p-3">
                                {/* Linha principal da série */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold flex-shrink-0 ${getSetTypeColor(set.setType)}`}>
                                    {set.setNumber}
                                  </span>
                                  
                                  {isEditing ? (
                                    <Select
                                      value={set.setType || "working"}
                                      onValueChange={(v) => {
                                        handleUpdateSet(exIndex, setIndex, 'setType', v);
                                        if (v === 'drop') {
                                          handleUpdateSet(exIndex, setIndex, 'isDropSet', true);
                                        } else if (v === 'rest_pause') {
                                          handleUpdateSet(exIndex, setIndex, 'isRestPause', true);
                                        } else {
                                          handleUpdateSet(exIndex, setIndex, 'isDropSet', false);
                                          handleUpdateSet(exIndex, setIndex, 'isRestPause', false);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="h-8 w-[120px] text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {SET_TYPES.map((type) => (
                                          <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">{getSetTypeLabel(set.setType)}</Badge>
                                  )}
                                  
                                  {isEditing ? (
                                    <>
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          className="h-8 w-16 text-center text-sm"
                                          placeholder="0"
                                          value={set.weight || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                        <span className="text-xs text-muted-foreground">kg</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          className="h-8 w-14 text-center text-sm"
                                          placeholder="0"
                                          value={set.reps || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'reps', e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                        <span className="text-xs text-muted-foreground">reps</span>
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <Input
                                          type="number"
                                          className="h-8 w-14 text-center text-sm"
                                          placeholder="60"
                                          value={set.restTime || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restTime', e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                        <span className="text-xs text-muted-foreground">s</span>
                                      </div>
                                      
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive ml-auto"
                                        onClick={() => handleRemoveSet(exIndex, setIndex)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </>
                                  ) : (
                                    <div className="flex items-center gap-3 flex-1">
                                      <span className="font-semibold text-foreground">
                                        {set.weight || 0}kg
                                      </span>
                                      <span className="text-muted-foreground">×</span>
                                      <span className="font-semibold text-foreground">
                                        {set.reps || 0} reps
                                      </span>
                                      {set.restTime && (
                                        <span className="text-xs text-muted-foreground ml-auto">
                                          ⏱️ {set.restTime}s
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Área expandida para Drop Set */}
                                {(set.setType === 'drop' || set.isDropSet) && (
                                  <div className="mt-2 ml-9 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className="bg-purple-500 text-white text-xs">Drop Set</Badge>
                                    </div>
                                    {isEditing ? (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            className="h-8 w-16 text-center text-sm"
                                            placeholder="0"
                                            value={set.dropWeight || ""}
                                            onChange={(e) => handleUpdateSet(exIndex, setIndex, 'dropWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                          />
                                          <span className="text-xs text-muted-foreground">kg</span>
                                        </div>
                                        <span className="text-muted-foreground">×</span>
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            className="h-8 w-14 text-center text-sm"
                                            placeholder="0"
                                            value={set.dropReps || ""}
                                            onChange={(e) => handleUpdateSet(exIndex, setIndex, 'dropReps', e.target.value ? parseInt(e.target.value) : undefined)}
                                          />
                                          <span className="text-xs text-muted-foreground">reps</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-sm">{set.dropWeight}kg × {set.dropReps} reps</span>
                                    )}
                                  </div>
                                )}
                                
                                {/* Área expandida para Rest-Pause */}
                                {(set.setType === 'rest_pause' || set.isRestPause) && (
                                  <div className="mt-2 ml-9 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge className="bg-orange-500 text-white text-xs">Rest-Pause</Badge>
                                    </div>
                                    {isEditing ? (
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            className="h-8 w-16 text-center text-sm"
                                            placeholder="0"
                                            value={set.restPauseWeight || ""}
                                            onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restPauseWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                          />
                                          <span className="text-xs text-muted-foreground">kg</span>
                                        </div>
                                        <span className="text-muted-foreground">×</span>
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            className="h-8 w-14 text-center text-sm"
                                            placeholder="0"
                                            value={set.restPauseReps || ""}
                                            onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restPauseReps', e.target.value ? parseInt(e.target.value) : undefined)}
                                          />
                                          <span className="text-xs text-muted-foreground">reps</span>
                                        </div>
                                        <span className="text-muted-foreground">|</span>
                                        <div className="flex items-center gap-1">
                                          <Input
                                            type="number"
                                            className="h-8 w-14 text-center text-sm"
                                            placeholder="15"
                                            value={set.restPausePause || ""}
                                            onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restPausePause', e.target.value ? parseInt(e.target.value) : undefined)}
                                          />
                                          <span className="text-xs text-muted-foreground">s pausa</span>
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-sm">{set.restPauseWeight}kg × {set.restPauseReps} reps (pausa: {set.restPausePause}s)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Botão adicionar série */}
                          {isEditing && (
                            <div className="p-2 border-t">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full"
                                onClick={() => handleAddSet(exIndex)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar Série
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
                
                {/* Observações e sentimento */}
                {logDetail.status === 'in_progress' && isEditing && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Como o aluno estava?</Label>
                      <div className="flex flex-wrap gap-2">
                        {FEELINGS.map((feeling) => (
                          <Button
                            key={feeling.value}
                            variant={newLog.feeling === feeling.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setNewLog({ ...newLog, feeling: feeling.value })}
                          >
                            {feeling.emoji} {feeling.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea
                        placeholder="Anotações sobre o treino..."
                        value={newLog.notes}
                        onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                      />
                    </div>
                  </div>
                )}
                
                {logDetail.notes && logDetail.status === 'completed' && (
                  <Card className="bg-muted/30 border-dashed">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Observações do treino</p>
                          <p className="text-sm">{logDetail.notes}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            <DialogFooter>
              {logDetail?.status === 'in_progress' && (
                <>
                  <Button variant="outline" onClick={() => setShowLogDetailModal(false)}>
                    Fechar
                  </Button>
                  <Button onClick={handleCompleteLog} disabled={completeLog.isPending}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {completeLog.isPending ? "Finalizando..." : "Finalizar Treino"}
                  </Button>
                </>
              )}
              {logDetail?.status === 'completed' && (
                <Button onClick={() => setShowLogDetailModal(false)}>
                  Fechar
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Modal: Registrar Treino da Sessão */}
        <Dialog open={showSessionLogModal} onOpenChange={(open) => {
          setShowSessionLogModal(open);
          if (!open) {
            setSelectedSession(null);
            resetNewLog();
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Registrar Treino - {selectedSession?.student?.name || 'Aluno'}
              </DialogTitle>
              <DialogDescription>
                {selectedSession && (
                  <span>
                    {new Date(selectedSession.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {' às '}
                    {new Date(selectedSession.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    {selectedSession.workoutId && ` • Treino ${selectedSession.workoutDayIndex !== null ? String.fromCharCode(65 + selectedSession.workoutDayIndex) : ''}`}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Data do Treino</Label>
                  <div 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-muted/50"
                    onClick={(e) => {
                      const input = e.currentTarget.querySelector('input');
                      if (input) input.showPicker?.();
                    }}
                  >
                    <input
                      type="date"
                      className="sr-only"
                      value={newLog.trainingDate}
                      onChange={(e) => setNewLog({ ...newLog, trainingDate: e.target.value })}
                    />
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {newLog.trainingDate ? new Date(newLog.trainingDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Selecionar data'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Horário de Início</Label>
                  <Input
                    type="time"
                    value={newLog.startTime}
                    onChange={(e) => setNewLog({ ...newLog, startTime: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Treino</Label>
                  <Select 
                    value={newLog.workoutId.toString()} 
                    onValueChange={(v) => setNewLog({ ...newLog, workoutId: parseInt(v), workoutDayId: 0 })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o treino" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Treino livre</SelectItem>
                      {workouts?.map((workout: any) => (
                        <SelectItem key={workout.id} value={workout.id.toString()}>
                          {workout.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Seleção do dia do treino */}
              {newLog.workoutId > 0 && workoutDays && workoutDays.length > 0 && (
                <div className="space-y-2">
                  <Label>Dia do Treino</Label>
                  <div className="flex flex-wrap gap-2">
                    {workoutDays.map((day: any, index: number) => (
                      <Button
                        key={day.id}
                        variant={newLog.workoutDayId === day.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setNewLog({ 
                          ...newLog, 
                          workoutDayId: day.id,
                          dayName: day.name || `Treino ${String.fromCharCode(65 + index)}`
                        })}
                      >
                        {day.name || `Treino ${String.fromCharCode(65 + index)}`}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Exercícios */}
              {currentExercises.length > 0 && (
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Exercícios</Label>
                  {currentExercises.map((exercise, exIndex) => (
                    <Card key={exIndex}>
                      <CardHeader className="p-3 cursor-pointer" onClick={() => {
                        const updated = [...currentExercises];
                        updated[exIndex].isExpanded = !updated[exIndex].isExpanded;
                        setCurrentExercises(updated);
                      }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Dumbbell className="h-4 w-4 text-primary" />
                            <span className="font-medium">{exercise.exerciseName}</span>
                            {exercise.muscleGroup && (
                              <Badge variant="outline" className="text-xs">{exercise.muscleGroup}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {exercise.plannedSets}x{exercise.plannedReps}
                            </span>
                            {exercise.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </CardHeader>
                      
                      {exercise.isExpanded && (
                        <CardContent className="p-3 pt-0">
                          <div className="divide-y">
                            {exercise.sets.map((set, setIndex) => (
                              <div key={setIndex} className="py-3">
                                {/* Linha principal da série */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold flex-shrink-0 ${SET_TYPES.find(t => t.value === set.setType)?.color || 'bg-green-500'}`}>
                                    {set.setNumber}
                                  </span>
                                  
                                  <Select
                                    value={set.setType || 'working'}
                                    onValueChange={(v) => {
                                      const updated = [...currentExercises];
                                      updated[exIndex].sets[setIndex].setType = v;
                                      // Auto-ativar flags quando seleciona drop ou rest_pause
                                      if (v === 'drop') {
                                        updated[exIndex].sets[setIndex].isDropSet = true;
                                      } else if (v === 'rest_pause') {
                                        updated[exIndex].sets[setIndex].isRestPause = true;
                                      } else {
                                        updated[exIndex].sets[setIndex].isDropSet = false;
                                        updated[exIndex].sets[setIndex].isRestPause = false;
                                      }
                                      setCurrentExercises(updated);
                                    }}
                                  >
                                    <SelectTrigger className="h-8 w-[120px] text-xs">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {SET_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${type.color}`} />
                                            {type.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      className="h-8 w-16 text-center text-sm"
                                      placeholder="0"
                                      value={set.weight || ''}
                                      onChange={(e) => {
                                        const updated = [...currentExercises];
                                        updated[exIndex].sets[setIndex].weight = e.target.value ? parseFloat(e.target.value) : undefined;
                                        setCurrentExercises(updated);
                                      }}
                                    />
                                    <span className="text-xs text-muted-foreground">kg</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      className="h-8 w-14 text-center text-sm"
                                      placeholder="0"
                                      value={set.reps || ''}
                                      onChange={(e) => {
                                        const updated = [...currentExercises];
                                        updated[exIndex].sets[setIndex].reps = e.target.value ? parseInt(e.target.value) : undefined;
                                        setCurrentExercises(updated);
                                      }}
                                    />
                                    <span className="text-xs text-muted-foreground">reps</span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <Input
                                      type="number"
                                      className="h-8 w-14 text-center text-sm"
                                      placeholder="60"
                                      value={set.restTime || ''}
                                      onChange={(e) => {
                                        const updated = [...currentExercises];
                                        updated[exIndex].sets[setIndex].restTime = e.target.value ? parseInt(e.target.value) : undefined;
                                        setCurrentExercises(updated);
                                      }}
                                    />
                                    <span className="text-xs text-muted-foreground">s</span>
                                  </div>
                                  
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive ml-auto"
                                    onClick={() => {
                                      const updated = [...currentExercises];
                                      updated[exIndex].sets.splice(setIndex, 1);
                                      // Renumerar séries
                                      updated[exIndex].sets.forEach((s, i) => {
                                        s.setNumber = i + 1;
                                      });
                                      setCurrentExercises(updated);
                                    }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                
                                {/* Área expandida para Drop Set */}
                                {(set.setType === 'drop' || set.isDropSet) && (
                                  <div className="mt-2 ml-9 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <Badge className="bg-purple-500 text-white text-xs">Drop Set</Badge>
                                        <span className="text-xs text-muted-foreground">Reduções de carga</span>
                                      </div>
                                    </div>
                                    
                                    {/* Lista de drops */}
                                    <div className="space-y-2">
                                      {(set.drops && set.drops.length > 0 ? set.drops : [{ weight: set.dropWeight, reps: set.dropReps, restTime: undefined }]).map((drop, dropIndex) => (
                                        <div key={dropIndex} className="flex items-center gap-2 flex-wrap bg-white/50 dark:bg-black/20 p-2 rounded">
                                          <span className="text-xs font-medium text-purple-600 dark:text-purple-400 w-14">Drop {dropIndex + 1}</span>
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              className="h-7 w-14 text-center text-sm"
                                              placeholder="0"
                                              value={drop.weight || ''}
                                              onChange={(e) => {
                                                const updated = [...currentExercises];
                                                const drops = updated[exIndex].sets[setIndex].drops || [{ weight: set.dropWeight, reps: set.dropReps }];
                                                drops[dropIndex] = { ...drops[dropIndex], weight: e.target.value ? parseFloat(e.target.value) : undefined };
                                                updated[exIndex].sets[setIndex].drops = drops;
                                                // Manter compatibilidade com campos antigos
                                                if (dropIndex === 0) {
                                                  updated[exIndex].sets[setIndex].dropWeight = drops[0].weight;
                                                }
                                                setCurrentExercises(updated);
                                              }}
                                            />
                                            <span className="text-xs text-muted-foreground">kg</span>
                                          </div>
                                          <span className="text-muted-foreground">×</span>
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              className="h-7 w-12 text-center text-sm"
                                              placeholder="0"
                                              value={drop.reps || ''}
                                              onChange={(e) => {
                                                const updated = [...currentExercises];
                                                const drops = updated[exIndex].sets[setIndex].drops || [{ weight: set.dropWeight, reps: set.dropReps }];
                                                drops[dropIndex] = { ...drops[dropIndex], reps: e.target.value ? parseInt(e.target.value) : undefined };
                                                updated[exIndex].sets[setIndex].drops = drops;
                                                if (dropIndex === 0) {
                                                  updated[exIndex].sets[setIndex].dropReps = drops[0].reps;
                                                }
                                                setCurrentExercises(updated);
                                              }}
                                            />
                                            <span className="text-xs text-muted-foreground">reps</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              className="h-7 w-12 text-center text-sm"
                                              placeholder="0"
                                              value={drop.restTime || ''}
                                              onChange={(e) => {
                                                const updated = [...currentExercises];
                                                const drops = updated[exIndex].sets[setIndex].drops || [{ weight: set.dropWeight, reps: set.dropReps }];
                                                drops[dropIndex] = { ...drops[dropIndex], restTime: e.target.value ? parseInt(e.target.value) : undefined };
                                                updated[exIndex].sets[setIndex].drops = drops;
                                                setCurrentExercises(updated);
                                              }}
                                            />
                                            <span className="text-xs text-muted-foreground">s</span>
                                          </div>
                                          {(set.drops?.length || 0) > 1 && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-destructive"
                                              onClick={() => {
                                                const updated = [...currentExercises];
                                                const drops = [...(updated[exIndex].sets[setIndex].drops || [])];
                                                drops.splice(dropIndex, 1);
                                                updated[exIndex].sets[setIndex].drops = drops;
                                                setCurrentExercises(updated);
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Botão adicionar drop */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30"
                                      onClick={() => {
                                        const updated = [...currentExercises];
                                        const drops = updated[exIndex].sets[setIndex].drops || [{ weight: set.dropWeight, reps: set.dropReps }];
                                        drops.push({ weight: undefined, reps: undefined, restTime: undefined });
                                        updated[exIndex].sets[setIndex].drops = drops;
                                        setCurrentExercises(updated);
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Adicionar Drop
                                    </Button>
                                  </div>
                                )}
                                
                                {/* Área expandida para Rest-Pause */}
                                {(set.setType === 'rest_pause' || set.isRestPause) && (
                                  <div className="mt-2 ml-9 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <Badge className="bg-orange-500 text-white text-xs">Rest-Pause</Badge>
                                        <span className="text-xs text-muted-foreground">Pausas curtas e continuações</span>
                                      </div>
                                    </div>
                                    
                                    {/* Lista de pausas */}
                                    <div className="space-y-2">
                                      {(set.restPauses && set.restPauses.length > 0 ? set.restPauses : [{ weight: set.restPauseWeight, reps: set.restPauseReps, pauseTime: set.restPausePause }]).map((pause, pauseIndex) => (
                                        <div key={pauseIndex} className="flex items-center gap-2 flex-wrap bg-white/50 dark:bg-black/20 p-2 rounded">
                                          <span className="text-xs font-medium text-orange-600 dark:text-orange-400 w-14">Pausa {pauseIndex + 1}</span>
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              className="h-7 w-12 text-center text-sm"
                                              placeholder="15"
                                              value={pause.pauseTime || ''}
                                              onChange={(e) => {
                                                const updated = [...currentExercises];
                                                const pauses = updated[exIndex].sets[setIndex].restPauses || [{ weight: set.restPauseWeight, reps: set.restPauseReps, pauseTime: set.restPausePause }];
                                                pauses[pauseIndex] = { ...pauses[pauseIndex], pauseTime: e.target.value ? parseInt(e.target.value) : undefined };
                                                updated[exIndex].sets[setIndex].restPauses = pauses;
                                                if (pauseIndex === 0) {
                                                  updated[exIndex].sets[setIndex].restPausePause = pauses[0].pauseTime;
                                                }
                                                setCurrentExercises(updated);
                                              }}
                                            />
                                            <span className="text-xs text-muted-foreground">s</span>
                                          </div>
                                          <span className="text-muted-foreground">→</span>
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              className="h-7 w-14 text-center text-sm"
                                              placeholder="0"
                                              value={pause.weight || ''}
                                              onChange={(e) => {
                                                const updated = [...currentExercises];
                                                const pauses = updated[exIndex].sets[setIndex].restPauses || [{ weight: set.restPauseWeight, reps: set.restPauseReps, pauseTime: set.restPausePause }];
                                                pauses[pauseIndex] = { ...pauses[pauseIndex], weight: e.target.value ? parseFloat(e.target.value) : undefined };
                                                updated[exIndex].sets[setIndex].restPauses = pauses;
                                                if (pauseIndex === 0) {
                                                  updated[exIndex].sets[setIndex].restPauseWeight = pauses[0].weight;
                                                }
                                                setCurrentExercises(updated);
                                              }}
                                            />
                                            <span className="text-xs text-muted-foreground">kg</span>
                                          </div>
                                          <span className="text-muted-foreground">×</span>
                                          <div className="flex items-center gap-1">
                                            <Input
                                              type="number"
                                              className="h-7 w-12 text-center text-sm"
                                              placeholder="0"
                                              value={pause.reps || ''}
                                              onChange={(e) => {
                                                const updated = [...currentExercises];
                                                const pauses = updated[exIndex].sets[setIndex].restPauses || [{ weight: set.restPauseWeight, reps: set.restPauseReps, pauseTime: set.restPausePause }];
                                                pauses[pauseIndex] = { ...pauses[pauseIndex], reps: e.target.value ? parseInt(e.target.value) : undefined };
                                                updated[exIndex].sets[setIndex].restPauses = pauses;
                                                if (pauseIndex === 0) {
                                                  updated[exIndex].sets[setIndex].restPauseReps = pauses[0].reps;
                                                }
                                                setCurrentExercises(updated);
                                              }}
                                            />
                                            <span className="text-xs text-muted-foreground">reps</span>
                                          </div>
                                          {(set.restPauses?.length || 0) > 1 && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-6 w-6 text-destructive"
                                              onClick={() => {
                                                const updated = [...currentExercises];
                                                const pauses = [...(updated[exIndex].sets[setIndex].restPauses || [])];
                                                pauses.splice(pauseIndex, 1);
                                                updated[exIndex].sets[setIndex].restPauses = pauses;
                                                setCurrentExercises(updated);
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </Button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Botão adicionar pausa */}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="mt-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:text-orange-400 dark:hover:bg-orange-900/30"
                                      onClick={() => {
                                        const updated = [...currentExercises];
                                        const pauses = updated[exIndex].sets[setIndex].restPauses || [{ weight: set.restPauseWeight, reps: set.restPauseReps, pauseTime: set.restPausePause }];
                                        pauses.push({ weight: undefined, reps: undefined, pauseTime: 15 });
                                        updated[exIndex].sets[setIndex].restPauses = pauses;
                                        setCurrentExercises(updated);
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Adicionar Pausa
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Botão adicionar série */}
                          <div className="mt-2 pt-2 border-t">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full"
                              onClick={() => {
                                const updated = [...currentExercises];
                                const lastSet = updated[exIndex].sets[updated[exIndex].sets.length - 1];
                                updated[exIndex].sets.push({
                                  setNumber: (lastSet?.setNumber || 0) + 1,
                                  setType: 'working',
                                  restTime: lastSet?.restTime || 60,
                                  isCompleted: false,
                                });
                                setCurrentExercises(updated);
                              }}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Adicionar Série
                            </Button>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Sentimento */}
              <div className="space-y-2">
                <Label>Como o aluno estava?</Label>
                <div className="flex flex-wrap gap-2">
                  {FEELINGS.map((feeling) => (
                    <Button
                      key={feeling.value}
                      variant={newLog.feeling === feeling.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNewLog({ ...newLog, feeling: feeling.value })}
                    >
                      {feeling.emoji} {feeling.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Observações */}
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Anotações sobre o treino..."
                  value={newLog.notes}
                  onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSessionLogModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  console.log('=== BOTAO SALVAR CLICADO ===');
                  console.log('newLog:', newLog);
                  console.log('currentExercises:', currentExercises);
                  // Criar o registro de treino
                  createLog.mutate({
                    studentId: newLog.studentId,
                    sessionId: selectedSession?.id, // Associar ao sessionId da sessão
                    workoutId: newLog.workoutId || undefined,
                    workoutDayId: newLog.workoutDayId || undefined,
                    trainingDate: newLog.trainingDate,
                    dayName: newLog.dayName || undefined,
                    startTime: newLog.startTime || undefined,
                    notes: newLog.notes || undefined,
                    exercises: currentExercises.map(ex => ({
                      exerciseId: ex.exerciseId,
                      exerciseName: ex.exerciseName,
                      muscleGroup: ex.muscleGroup,
                      plannedSets: ex.plannedSets,
                      plannedReps: ex.plannedReps,
                      plannedRest: ex.plannedRest,
                      notes: ex.notes,
                      sets: ex.sets.map(s => ({
                        setNumber: s.setNumber,
                        setType: s.setType as any,
                        weight: s.weight,
                        reps: s.reps,
                        restTime: s.restTime,
                        isDropSet: s.isDropSet,
                        dropWeight: s.dropWeight,
                        dropReps: s.dropReps,
                        isRestPause: s.isRestPause,
                        restPauseWeight: s.restPauseWeight,
                        restPauseReps: s.restPauseReps,
                        restPausePause: s.restPausePause,
                        rpe: s.rpe,
                        isCompleted: s.isCompleted,
                        notes: s.notes,
                      })),
                    })),
                  }, {
                    onSuccess: () => {
                      setShowSessionLogModal(false);
                      setSelectedSession(null);
                      resetNewLog();
                      refetchSessions();
                    }
                  });
                }}
                disabled={createLog.isPending}
              >
                {createLog.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Registro
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
