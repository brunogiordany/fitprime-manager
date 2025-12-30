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
  isRestPause?: boolean;
  restPauseWeight?: number;
  restPauseReps?: number;
  restPausePause?: number;
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
    selectedStudentId ? { studentId: parseInt(selectedStudentId) } : undefined
  );
  const { data: logDetail, refetch: refetchLogDetail } = trpc.trainingDiary.get.useQuery(
    { id: selectedLogId! },
    { enabled: !!selectedLogId }
  );
  const { data: dashboard } = trpc.trainingDiary.dashboard.useQuery(
    selectedStudentId ? { studentId: parseInt(selectedStudentId) } : undefined
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
        if (set.isCompleted) completedSets++;
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
                                setSelectedSession(session);
                                // Pré-preencher o formulário com dados da sessão
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
                            className="cursor-pointer transition-all hover:shadow-md hover:border-primary"
                            onClick={() => {
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
                            className="cursor-pointer transition-all hover:shadow-md border-amber-300 bg-amber-50/50"
                            onClick={() => {
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                      <p className="text-2xl font-bold">{(dashboard.totalVolume / 1000).toFixed(1)}t</p>
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
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Timer className="h-4 w-4" />
                        <span className="text-sm">Duração Média</span>
                      </div>
                      <p className="text-2xl font-bold">{dashboard.avgDuration}min</p>
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
                            <span className="text-xs font-medium">{(item.volume / 1000).toFixed(1)}t</span>
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
                                {exercise.sets.filter(s => s.isCompleted).length}/{exercise.sets.length} séries
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
                            {/* Tabela de séries estilo planilha */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                  <tr>
                                    <th className="p-2 text-left w-16">Série</th>
                                    <th className="p-2 text-left w-24">Tipo</th>
                                    <th className="p-2 text-center w-24">Peso (kg)</th>
                                    <th className="p-2 text-center w-20">Reps</th>
                                    <th className="p-2 text-center w-24">Descanso</th>
                                    <th className="p-2 text-center w-20">Drop</th>
                                    <th className="p-2 text-center w-20">R-P</th>
                                    <th className="p-2 text-center w-16">✓</th>
                                    <th className="p-2 w-10"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {exercise.sets.map((set, setIndex) => (
                                    <tr key={setIndex} className={`border-t ${set.isCompleted ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                                      <td className="p-2">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${getSetTypeColor(set.setType)}`}>
                                          {set.setNumber}
                                        </span>
                                      </td>
                                      <td className="p-2">
                                        <Select
                                          value={set.setType || "working"}
                                          onValueChange={(v) => handleUpdateSet(exIndex, setIndex, 'setType', v)}
                                        >
                                          <SelectTrigger className="h-8 text-xs">
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
                                      </td>
                                      <td className="p-2">
                                        <Input
                                          type="number"
                                          className="h-8 text-center"
                                          placeholder="0"
                                          value={set.weight || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                      </td>
                                      <td className="p-2">
                                        <Input
                                          type="number"
                                          className="h-8 text-center"
                                          placeholder="0"
                                          value={set.reps || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'reps', e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                      </td>
                                      <td className="p-2">
                                        <Input
                                          type="number"
                                          className="h-8 text-center"
                                          placeholder="60"
                                          value={set.restTime || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restTime', e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                      </td>
                                      <td className="p-2 text-center">
                                        <Checkbox
                                          checked={set.isDropSet || false}
                                          onCheckedChange={(v) => handleUpdateSet(exIndex, setIndex, 'isDropSet', v)}
                                        />
                                      </td>
                                      <td className="p-2 text-center">
                                        <Checkbox
                                          checked={set.isRestPause || false}
                                          onCheckedChange={(v) => handleUpdateSet(exIndex, setIndex, 'isRestPause', v)}
                                        />
                                      </td>
                                      <td className="p-2 text-center">
                                        <Checkbox
                                          checked={set.isCompleted || false}
                                          onCheckedChange={(v) => handleUpdateSet(exIndex, setIndex, 'isCompleted', v)}
                                        />
                                      </td>
                                      <td className="p-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-destructive"
                                          onClick={() => handleRemoveSet(exIndex, setIndex)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            
                            {/* Campos de Drop Set e Rest-Pause quando ativados */}
                            {exercise.sets.some(s => s.isDropSet || s.isRestPause) && (
                              <div className="p-3 border-t bg-muted/30">
                                <p className="text-xs font-medium mb-2">Técnicas Avançadas:</p>
                                {exercise.sets.map((set, setIndex) => (
                                  <div key={setIndex}>
                                    {set.isDropSet && (
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="secondary" className="text-xs">S{set.setNumber} Drop</Badge>
                                        <Input
                                          type="number"
                                          className="h-7 w-20"
                                          placeholder="Peso"
                                          value={set.dropWeight || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'dropWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                        <span className="text-xs">kg</span>
                                        <Input
                                          type="number"
                                          className="h-7 w-16"
                                          placeholder="Reps"
                                          value={set.dropReps || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'dropReps', e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                        <span className="text-xs">reps</span>
                                      </div>
                                    )}
                                    {set.isRestPause && (
                                      <div className="flex items-center gap-2 mb-2">
                                        <Badge variant="secondary" className="text-xs">S{set.setNumber} R-P</Badge>
                                        <Input
                                          type="number"
                                          className="h-7 w-20"
                                          placeholder="Peso"
                                          value={set.restPauseWeight || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restPauseWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                        <span className="text-xs">kg</span>
                                        <Input
                                          type="number"
                                          className="h-7 w-16"
                                          placeholder="Reps"
                                          value={set.restPauseReps || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restPauseReps', e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                        <span className="text-xs">reps</span>
                                        <Input
                                          type="number"
                                          className="h-7 w-16"
                                          placeholder="Pausa"
                                          value={set.restPausePause || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restPausePause', e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                        <span className="text-xs">s</span>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            
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
                <Dumbbell className="h-5 w-5" />
                {logDetail?.dayName || "Registro de Treino"}
                {logDetail?.feeling && (
                  <span className="text-lg">{getFeelingEmoji(logDetail.feeling)}</span>
                )}
              </DialogTitle>
              <DialogDescription>
                {logDetail?.student?.name} • {logDetail && formatDate(logDetail.trainingDate)}
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
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    <Card>
                      <CardContent className="p-3 text-center">
                        <Timer className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-lg font-bold">{logDetail.totalDuration || 0}min</p>
                        <p className="text-xs text-muted-foreground">Duração</p>
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
                              {exercise.sets.filter(s => s.isCompleted).length}/{exercise.sets.length} séries
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
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="p-2 text-left w-16">Série</th>
                                  <th className="p-2 text-left w-24">Tipo</th>
                                  <th className="p-2 text-center w-24">Peso (kg)</th>
                                  <th className="p-2 text-center w-20">Reps</th>
                                  <th className="p-2 text-center w-24">Descanso</th>
                                  <th className="p-2 text-center w-20">Drop</th>
                                  <th className="p-2 text-center w-20">R-P</th>
                                  <th className="p-2 text-center w-16">✓</th>
                                  {isEditing && <th className="p-2 w-10"></th>}
                                </tr>
                              </thead>
                              <tbody>
                                {exercise.sets.map((set, setIndex) => (
                                  <tr key={setIndex} className={`border-t ${set.isCompleted ? 'bg-green-50 dark:bg-green-950/20' : ''}`}>
                                    <td className="p-2">
                                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${getSetTypeColor(set.setType)}`}>
                                        {set.setNumber}
                                      </span>
                                    </td>
                                    <td className="p-2">
                                      {isEditing ? (
                                        <Select
                                          value={set.setType || "working"}
                                          onValueChange={(v) => handleUpdateSet(exIndex, setIndex, 'setType', v)}
                                        >
                                          <SelectTrigger className="h-8 text-xs">
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
                                        <span className="text-xs">{getSetTypeLabel(set.setType)}</span>
                                      )}
                                    </td>
                                    <td className="p-2">
                                      {isEditing ? (
                                        <Input
                                          type="number"
                                          className="h-8 text-center"
                                          placeholder="0"
                                          value={set.weight || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        />
                                      ) : (
                                        <span className="text-center block">{set.weight || "-"}</span>
                                      )}
                                    </td>
                                    <td className="p-2">
                                      {isEditing ? (
                                        <Input
                                          type="number"
                                          className="h-8 text-center"
                                          placeholder="0"
                                          value={set.reps || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'reps', e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                      ) : (
                                        <span className="text-center block">{set.reps || "-"}</span>
                                      )}
                                    </td>
                                    <td className="p-2">
                                      {isEditing ? (
                                        <Input
                                          type="number"
                                          className="h-8 text-center"
                                          placeholder="60"
                                          value={set.restTime || ""}
                                          onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restTime', e.target.value ? parseInt(e.target.value) : undefined)}
                                        />
                                      ) : (
                                        <span className="text-center block">{set.restTime || "-"}s</span>
                                      )}
                                    </td>
                                    <td className="p-2 text-center">
                                      <Checkbox
                                        checked={set.isDropSet || false}
                                        onCheckedChange={(v) => handleUpdateSet(exIndex, setIndex, 'isDropSet', v)}
                                        disabled={!isEditing}
                                      />
                                    </td>
                                    <td className="p-2 text-center">
                                      <Checkbox
                                        checked={set.isRestPause || false}
                                        onCheckedChange={(v) => handleUpdateSet(exIndex, setIndex, 'isRestPause', v)}
                                        disabled={!isEditing}
                                      />
                                    </td>
                                    <td className="p-2 text-center">
                                      <Checkbox
                                        checked={set.isCompleted || false}
                                        onCheckedChange={(v) => handleUpdateSet(exIndex, setIndex, 'isCompleted', v)}
                                        disabled={!isEditing}
                                      />
                                    </td>
                                    {isEditing && (
                                      <td className="p-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-destructive"
                                          onClick={() => handleRemoveSet(exIndex, setIndex)}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          
                          {/* Campos de Drop Set e Rest-Pause */}
                          {exercise.sets.some(s => s.isDropSet || s.isRestPause) && (
                            <div className="p-3 border-t bg-muted/30">
                              <p className="text-xs font-medium mb-2">Técnicas Avançadas:</p>
                              {exercise.sets.map((set, setIndex) => (
                                <div key={setIndex}>
                                  {set.isDropSet && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="secondary" className="text-xs">S{set.setNumber} Drop</Badge>
                                      {isEditing ? (
                                        <>
                                          <Input
                                            type="number"
                                            className="h-7 w-20"
                                            placeholder="Peso"
                                            value={set.dropWeight || ""}
                                            onChange={(e) => handleUpdateSet(exIndex, setIndex, 'dropWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                          />
                                          <span className="text-xs">kg</span>
                                          <Input
                                            type="number"
                                            className="h-7 w-16"
                                            placeholder="Reps"
                                            value={set.dropReps || ""}
                                            onChange={(e) => handleUpdateSet(exIndex, setIndex, 'dropReps', e.target.value ? parseInt(e.target.value) : undefined)}
                                          />
                                          <span className="text-xs">reps</span>
                                        </>
                                      ) : (
                                        <span className="text-xs">{set.dropWeight}kg × {set.dropReps} reps</span>
                                      )}
                                    </div>
                                  )}
                                  {set.isRestPause && (
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="secondary" className="text-xs">S{set.setNumber} R-P</Badge>
                                      {isEditing ? (
                                        <>
                                          <Input
                                            type="number"
                                            className="h-7 w-20"
                                            placeholder="Peso"
                                            value={set.restPauseWeight || ""}
                                            onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restPauseWeight', e.target.value ? parseFloat(e.target.value) : undefined)}
                                          />
                                          <span className="text-xs">kg</span>
                                          <Input
                                            type="number"
                                            className="h-7 w-16"
                                            placeholder="Reps"
                                            value={set.restPauseReps || ""}
                                            onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restPauseReps', e.target.value ? parseInt(e.target.value) : undefined)}
                                          />
                                          <span className="text-xs">reps</span>
                                          <Input
                                            type="number"
                                            className="h-7 w-16"
                                            placeholder="Pausa"
                                            value={set.restPausePause || ""}
                                            onChange={(e) => handleUpdateSet(exIndex, setIndex, 'restPausePause', e.target.value ? parseInt(e.target.value) : undefined)}
                                          />
                                          <span className="text-xs">s</span>
                                        </>
                                      ) : (
                                        <span className="text-xs">{set.restPauseWeight}kg × {set.restPauseReps} reps (pausa: {set.restPausePause}s)</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
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
                      <Label>Como se sentiu?</Label>
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
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-sm text-muted-foreground">{logDetail.notes}</p>
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
                  <Input
                    type="date"
                    value={newLog.trainingDate}
                    onChange={(e) => setNewLog({ ...newLog, trainingDate: e.target.value })}
                  />
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
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="p-2 text-left w-16">Série</th>
                                  <th className="p-2 text-left">Tipo</th>
                                  <th className="p-2 text-left w-24">Carga (kg)</th>
                                  <th className="p-2 text-left w-20">Reps</th>
                                  <th className="p-2 text-left w-24">Descanso (s)</th>
                                  <th className="p-2 text-center w-16">Drop</th>
                                  <th className="p-2 text-center w-16">R-P</th>
                                  <th className="p-2 text-center w-12">✓</th>
                                </tr>
                              </thead>
                              <tbody>
                                {exercise.sets.map((set, setIndex) => (
                                  <tr key={setIndex} className="border-b last:border-0">
                                    <td className="p-2 font-medium">S{set.setNumber}</td>
                                    <td className="p-2">
                                      <Select
                                        value={set.setType || 'working'}
                                        onValueChange={(v) => {
                                          const updated = [...currentExercises];
                                          updated[exIndex].sets[setIndex].setType = v;
                                          setCurrentExercises(updated);
                                        }}
                                      >
                                        <SelectTrigger className="h-8 w-32">
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
                                    </td>
                                    <td className="p-2">
                                      <Input
                                        type="number"
                                        className="h-8 w-20"
                                        placeholder="0"
                                        value={set.weight || ''}
                                        onChange={(e) => {
                                          const updated = [...currentExercises];
                                          updated[exIndex].sets[setIndex].weight = e.target.value ? parseFloat(e.target.value) : undefined;
                                          setCurrentExercises(updated);
                                        }}
                                      />
                                    </td>
                                    <td className="p-2">
                                      <Input
                                        type="number"
                                        className="h-8 w-16"
                                        placeholder="0"
                                        value={set.reps || ''}
                                        onChange={(e) => {
                                          const updated = [...currentExercises];
                                          updated[exIndex].sets[setIndex].reps = e.target.value ? parseInt(e.target.value) : undefined;
                                          setCurrentExercises(updated);
                                        }}
                                      />
                                    </td>
                                    <td className="p-2">
                                      <Input
                                        type="number"
                                        className="h-8 w-20"
                                        placeholder="60"
                                        value={set.restTime || ''}
                                        onChange={(e) => {
                                          const updated = [...currentExercises];
                                          updated[exIndex].sets[setIndex].restTime = e.target.value ? parseInt(e.target.value) : undefined;
                                          setCurrentExercises(updated);
                                        }}
                                      />
                                    </td>
                                    <td className="p-2 text-center">
                                      <Checkbox
                                        checked={set.isDropSet || false}
                                        onCheckedChange={(v) => {
                                          const updated = [...currentExercises];
                                          updated[exIndex].sets[setIndex].isDropSet = !!v;
                                          setCurrentExercises(updated);
                                        }}
                                      />
                                    </td>
                                    <td className="p-2 text-center">
                                      <Checkbox
                                        checked={set.isRestPause || false}
                                        onCheckedChange={(v) => {
                                          const updated = [...currentExercises];
                                          updated[exIndex].sets[setIndex].isRestPause = !!v;
                                          setCurrentExercises(updated);
                                        }}
                                      />
                                    </td>
                                    <td className="p-2 text-center">
                                      <Checkbox
                                        checked={set.isCompleted || false}
                                        onCheckedChange={(v) => {
                                          const updated = [...currentExercises];
                                          updated[exIndex].sets[setIndex].isCompleted = !!v;
                                          setCurrentExercises(updated);
                                        }}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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
                <Label>Como se sentiu?</Label>
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
                  // Criar o registro de treino
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
