import { useState, useEffect, useMemo, useRef } from "react";
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
import { Switch } from "@/components/ui/switch";
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
  AlertCircle,
  Heart,
  Bike,
  Footprints,
  Waves,
  Mountain,
  Zap,
  CloudOff,
  RefreshCw,
  Wifi,
  WifiOff,
  Scale,
  Loader2
} from "lucide-react";
import { useOfflineTraining } from "@/hooks/useOfflineTraining";
import { toast } from "sonner";
import CardioEvolutionDashboard from "@/components/CardioEvolutionDashboard";
import { ExerciseSubstitutionModal } from "@/components/ExerciseSubstitutionModal";
import type { ExerciseAlternative } from "@shared/exercise-alternatives";

// Tipos de série
const SET_TYPES = [
  { value: "warmup", label: "Aquecimento", color: "bg-yellow-500" },
  { value: "feeler", label: "Reconhecimento", color: "bg-blue-500" },
  { value: "working", label: "Série Válida", color: "bg-green-500" },
  { value: "drop", label: "Drop Set", color: "bg-purple-500" },
  { value: "rest_pause", label: "Rest-Pause", color: "bg-orange-500" },
  { value: "failure", label: "Falha", color: "bg-red-500" },
];

type LoadType = "kg" | "bodyweight" | "bodyweight_plus" | "no_load";

const LOAD_TYPES: { value: LoadType; label: string; shortLabel: string }[] = [
  { value: "kg", label: "Carga (kg)", shortLabel: "kg" },
  { value: "bodyweight", label: "Peso corporal", shortLabel: "PC" },
  { value: "bodyweight_plus", label: "Peso corporal + carga", shortLabel: "PC + kg" },
  { value: "no_load", label: "Sem carga / máquina", shortLabel: "Sem carga" },
];

const isMeasuredLoad = (loadType?: LoadType) =>
  (loadType || "kg") === "kg" || loadType === "bodyweight_plus";

const isSetPerformed = (set: { reps?: number; isCompleted?: boolean }) =>
  (set.reps || 0) > 0 || set.isCompleted === true;

// Sentimentos
const FEELINGS = [
  { value: "great", label: "Excelente", emoji: "🔥" },
  { value: "good", label: "Bom", emoji: "💪" },
  { value: "normal", label: "Normal", emoji: "😐" },
  { value: "tired", label: "Cansado", emoji: "😓" },
  { value: "exhausted", label: "Exausto", emoji: "😵" },
];

// Tipos de cardio
const CARDIO_TYPES = [
  { value: "treadmill", label: "Esteira", icon: "Footprints" },
  { value: "outdoor_run", label: "Corrida ao ar livre", icon: "Footprints" },
  { value: "stationary_bike", label: "Bicicleta ergométrica", icon: "Bike" },
  { value: "outdoor_bike", label: "Ciclismo", icon: "Bike" },
  { value: "elliptical", label: "Elíptico", icon: "Activity" },
  { value: "rowing", label: "Remo", icon: "Waves" },
  { value: "stair_climber", label: "Escada", icon: "Mountain" },
  { value: "swimming", label: "Natação", icon: "Waves" },
  { value: "jump_rope", label: "Pular corda", icon: "Zap" },
  { value: "hiit", label: "HIIT", icon: "Zap" },
  { value: "walking", label: "Caminhada", icon: "Footprints" },
  { value: "hiking", label: "Trilha", icon: "Mountain" },
  { value: "dance", label: "Dança", icon: "Activity" },
  { value: "boxing", label: "Boxe/Luta", icon: "Zap" },
  { value: "crossfit", label: "CrossFit", icon: "Zap" },
  { value: "sports", label: "Esportes", icon: "Activity" },
  { value: "other", label: "Outro", icon: "Activity" },
];

// Intensidades de cardio
const CARDIO_INTENSITIES = [
  { value: "very_light", label: "Muito leve", color: "bg-blue-300", description: "50-60% FC máx" },
  { value: "light", label: "Leve", color: "bg-green-400", description: "60-70% FC máx" },
  { value: "moderate", label: "Moderado", color: "bg-yellow-400", description: "70-80% FC máx" },
  { value: "vigorous", label: "Vigoroso", color: "bg-orange-500", description: "80-90% FC máx" },
  { value: "maximum", label: "Máximo", color: "bg-red-500", description: "90-100% FC máx" },
];

// Sensações de cardio
const CARDIO_FEELINGS = [
  { value: "terrible", label: "Péssimo", emoji: "😫" },
  { value: "bad", label: "Ruim", emoji: "😟" },
  { value: "okay", label: "Ok", emoji: "😐" },
  { value: "good", label: "Bom", emoji: "😊" },
  { value: "great", label: "Ótimo", emoji: "🔥" },
];

// Clima
const WEATHER_OPTIONS = [
  { value: "indoor", label: "Indoor/Academia" },
  { value: "sunny", label: "Ensolarado" },
  { value: "cloudy", label: "Nublado" },
  { value: "rainy", label: "Chuvoso" },
  { value: "cold", label: "Frio" },
  { value: "hot", label: "Quente" },
  { value: "humid", label: "Úmido" },
];

// Função helper para criar Date de forma segura (evita RangeError: Invalid time value)
// IMPORTANTE: Preserva a data local sem conversão de timezone
const safeDate = (dateValue: Date | string | null | undefined): Date => {
  if (!dateValue) return new Date();
  try {
    // Se for string no formato ISO (YYYY-MM-DDTHH:mm:ss), extrair a data local
    if (typeof dateValue === 'string') {
      // Se tiver 'T' ou 'Z', pode ter problema de timezone
      if (dateValue.includes('T') || dateValue.includes('Z')) {
        // Extrair apenas a parte da data (YYYY-MM-DD) e criar como data local ao meio-dia
        const datePart = dateValue.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        // Criar data local ao meio-dia para evitar problemas de timezone
        return new Date(year, month - 1, day, 12, 0, 0);
      }
      // Se for apenas YYYY-MM-DD, criar como data local
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        const [year, month, day] = dateValue.split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0);
      }
    }
    
    const date = new Date(dateValue);
    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      console.warn('[safeDate] Data inválida:', dateValue);
      return new Date();
    }
    return date;
  } catch (error) {
    console.warn('[safeDate] Erro ao criar data:', dateValue, error);
    return new Date();
  }
};

// Função helper para formatar data de forma segura
const safeDateFormat = (dateValue: Date | string | null | undefined, options?: Intl.DateTimeFormatOptions): string => {
  const date = safeDate(dateValue);
  try {
    return date.toLocaleDateString('pt-BR', options || { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (error) {
    console.warn('[safeDateFormat] Erro ao formatar data:', dateValue, error);
    return 'Data inválida';
  }
};

// Função helper para extrair data local no formato YYYY-MM-DD sem conversão UTC
const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


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
  loadType?: LoadType;
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
  originalExerciseName?: string; // Nome original antes da substituição
  substitutedAt?: Date; // Data/hora da substituição
  muscleGroup?: string;
  loadType?: LoadType;
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
  
  // Hook para modo offline
  const offlineTraining = useOfflineTraining({ source: 'personal' });

  const [activeTab, setActiveTab] = useState("sessoes");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [muscleMetric, setMuscleMetric] = useState<'sets' | 'exercises' | 'volume'>('sets');
  const [musclePeriod, setMusclePeriod] = useState<string>('all'); // Filtro de período para análise muscular
  const [includeInProgress, setIncludeInProgress] = useState(false); // Incluir registros em andamento

  const [showNewLogModal, setShowNewLogModal] = useState(false);
  const [showLogDetailModal, setShowLogDetailModal] = useState(false);
  const [showSessionLogModal, setShowSessionLogModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  
  // Estado para gráfico de evolução de carga
  const [progressExercise, setProgressExercise] = useState<string>("");
  const [selectedProgressDay, setSelectedProgressDay] = useState<number | null>(null); // Índice do dia selecionado no gráfico
  const [progressPeriod, setProgressPeriod] = useState<string>("week"); // Filtro de período - padrão 1 semana
  const [expandedHistoryItem, setExpandedHistoryItem] = useState<number | null>(null); // Item expandido no histórico
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Estados para substituição de exercícios
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [substitutingExerciseIndex, setSubstitutingExerciseIndex] = useState<number | null>(null);
  
  // Estados para Cardio
  const [showCardioModal, setShowCardioModal] = useState(false);
  const [showCardioDetailModal, setShowCardioDetailModal] = useState(false);
  const [selectedCardioId, setSelectedCardioId] = useState<number | null>(null);
  const [cardioForm, setCardioForm] = useState({
    studentId: 0,
    cardioDate: getLocalDateString(new Date()),
    cardioType: '' as string,
    cardioTypeName: '',
    durationMinutes: 0,
    distanceKm: '',
    caloriesBurned: undefined as number | undefined,
    avgHeartRate: undefined as number | undefined,
    maxHeartRate: undefined as number | undefined,
    minHeartRate: undefined as number | undefined,
    intensity: '' as string,
    avgSpeed: '',
    maxSpeed: '',
    avgPace: '',
    incline: '',
    resistance: undefined as number | undefined,
    laps: undefined as number | undefined,
    steps: undefined as number | undefined,
    perceivedEffort: undefined as number | undefined,
    feelingBefore: '' as string,
    feelingAfter: '' as string,
    weather: 'indoor' as string,
    location: '',
    notes: '',
    startTime: '',
    endTime: '',
  });
  
  // Estado do novo registro
  const [newLog, setNewLog] = useState({
    studentId: 0,
    workoutId: 0,
    workoutDayId: 0,
    trainingDate: getLocalDateString(new Date()),
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
  // Calcular datas para filtro de período da análise muscular
  const muscleAnalysisFilters = useMemo(() => {
    const now = new Date();
    const today = getLocalDateString(now);
    
    // Calcular data de início baseado no período selecionado
    let startDate: string | undefined;
    let endDate: string | undefined = today;
    
    switch (musclePeriod) {
      case 'today':
        startDate = today;
        break;
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = getLocalDateString(yesterday);
        endDate = startDate;
        break;
      }
      case '7days': {
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = getLocalDateString(weekAgo);
        break;
      }
      case '30days': {
        const monthAgo = new Date(now);
        monthAgo.setDate(monthAgo.getDate() - 30);
        startDate = getLocalDateString(monthAgo);
        break;
      }
      case '90days': {
        const quarterAgo = new Date(now);
        quarterAgo.setDate(quarterAgo.getDate() - 90);
        startDate = getLocalDateString(quarterAgo);
        break;
      }
      case 'all':
      default:
        // Sem filtro de data
        startDate = undefined;
        endDate = undefined;
        break;
    }
    
    return {
      studentId: selectedStudentId ? parseInt(selectedStudentId) : undefined,
      startDate,
      endDate,
      includeInProgress,
    };
  }, [selectedStudentId, musclePeriod, includeInProgress]);
  
  const { data: muscleGroupData } = trpc.trainingDiary.muscleGroupAnalysis.useQuery(
    muscleAnalysisFilters
  );
  
  // Ordenar dados de grupos musculares pela métrica selecionada
  const sortedMuscleGroupData = useMemo(() => {
    if (!muscleGroupData || muscleGroupData.length === 0) return [];
    return [...muscleGroupData].sort((a: any, b: any) => {
      const valueA = muscleMetric === 'sets' ? a.sets : 
                     muscleMetric === 'exercises' ? a.exercises : a.volume;
      const valueB = muscleMetric === 'sets' ? b.sets : 
                     muscleMetric === 'exercises' ? b.exercises : b.volume;
      return valueB - valueA; // Ordem decrescente
    });
  }, [muscleGroupData, muscleMetric]);

  // Análise de equilíbrio muscular - pares antagonistas
  const muscleBalanceAnalysis = useMemo(() => {
    if (!muscleGroupData || muscleGroupData.length === 0) return [];
    
    // Definir pares antagonistas
    const antagonistPairs = [
      { muscle1: 'Peito', muscle2: 'Costas', name: 'Peito vs Costas' },
      { muscle1: 'Bíceps', muscle2: 'Tríceps', name: 'Bíceps vs Tríceps' },
      { muscle1: 'Quadríceps', muscle2: 'Posteriores da Coxa', name: 'Quadríceps vs Posteriores' },
      { muscle1: 'Ombros', muscle2: 'Costas', name: 'Ombros vs Costas (postura)' },
      { muscle1: 'Abdômen', muscle2: 'Costas', name: 'Core (Abdômen vs Lombar)' },
    ];
    
    const analysis: any[] = [];
    
    antagonistPairs.forEach(pair => {
      const muscle1Data = muscleGroupData.find((g: any) => 
        g.name.toLowerCase().includes(pair.muscle1.toLowerCase())
      );
      const muscle2Data = muscleGroupData.find((g: any) => 
        g.name.toLowerCase().includes(pair.muscle2.toLowerCase())
      );
      
      if (muscle1Data && muscle2Data) {
        const sets1 = muscle1Data.sets || 0;
        const sets2 = muscle2Data.sets || 0;
        const total = sets1 + sets2;
        
        if (total > 0) {
          const ratio = sets1 / (sets2 || 1);
          const percentage1 = (sets1 / total) * 100;
          const percentage2 = (sets2 / total) * 100;
          
          // Determinar status do equilíbrio
          let status: 'balanced' | 'warning' | 'imbalanced' = 'balanced';
          let message = 'Equilíbrio adequado';
          
          if (ratio > 2 || ratio < 0.5) {
            status = 'imbalanced';
            message = ratio > 2 
              ? `${pair.muscle1} muito dominante (${ratio.toFixed(1)}:1)`
              : `${pair.muscle2} muito dominante (${(1/ratio).toFixed(1)}:1)`;
          } else if (ratio > 1.5 || ratio < 0.67) {
            status = 'warning';
            message = ratio > 1.5
              ? `${pair.muscle1} levemente dominante`
              : `${pair.muscle2} levemente dominante`;
          }
          
          analysis.push({
            name: pair.name,
            muscle1: { name: pair.muscle1, sets: sets1, percentage: percentage1 },
            muscle2: { name: pair.muscle2, sets: sets2, percentage: percentage2 },
            ratio,
            status,
            message
          });
        }
      }
    });
    
    return analysis;
  }, [muscleGroupData]);
  
  const { data: workouts } = trpc.workouts.list.useQuery({ studentId: 0 });
  
  // Query para buscar treinos do aluno selecionado no modal de novo registro
  const { data: studentWorkouts } = trpc.workouts.list.useQuery(
    { studentId: newLog.studentId },
    { enabled: newLog.studentId > 0 }
  );
  
  // Query para buscar sessões do período (hoje e próximos 7 dias + últimos 7 dias)
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 7);
  
  const { data: upcomingSessions, refetch: refetchSessions } = trpc.sessions.list.useQuery({
    startDate: getLocalDateString(startDate),
    endDate: getLocalDateString(endDate),
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
  
  // Query para buscar todos os exercícios únicos do aluno
  const { data: uniqueExercises } = trpc.trainingDiary.uniqueExercises.useQuery(
    { studentId: selectedStudentId ? parseInt(selectedStudentId) : undefined },
    { enabled: true }
  );
  
  // Queries de Cardio
  const { data: cardioLogs, refetch: refetchCardioLogs } = trpc.cardio.list.useQuery(
    { studentId: selectedStudentId ? parseInt(selectedStudentId) : 0 },
    { enabled: true }
  );
  const { data: cardioStats, refetch: refetchCardioStats } = trpc.cardio.stats.useQuery(
    selectedStudentId ? { studentId: parseInt(selectedStudentId), days: 30 } : { studentId: 0, days: 30 },
    { enabled: !!selectedStudentId }
  );
  const { data: cardioDetail } = trpc.cardio.get.useQuery(
    { id: selectedCardioId! },
    { enabled: !!selectedCardioId }
  );
  
  // Estado para filtro de busca de exercícios
  const [exerciseSearchFilter, setExerciseSearchFilter] = useState<string>("");
  
  // Exercícios filtrados e ordenados alfabeticamente
  const filteredExercises = useMemo(() => {
    if (!uniqueExercises) return [];
    return uniqueExercises
      .filter(name => name.toLowerCase().includes(exerciseSearchFilter.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [uniqueExercises, exerciseSearchFilter]);
  
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
  
  const updateExercise = trpc.trainingDiary.updateExercise.useMutation({
    onError: (error) => {
      toast.error("Erro ao atualizar exercício", { description: error.message });
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
  
  const deleteLog = trpc.trainingDiary.delete.useMutation({
    onSuccess: () => {
      toast.success("Registro excluído com sucesso!");
      setShowLogDetailModal(false);
      setSelectedLogId(null);
      refetchLogs();
    },
    onError: (error) => {
      toast.error("Erro ao excluir registro", { description: error.message });
    },
  });
  
  const [showDeleteLogConfirm, setShowDeleteLogConfirm] = useState(false);
  
  // Mutations de Cardio
  const createCardio = trpc.cardio.create.useMutation({
    onSuccess: () => {
      toast.success("Cardio registrado com sucesso!");
      setShowCardioModal(false);
      refetchCardioLogs();
      refetchCardioStats();
      resetCardioForm();
    },
    onError: (error) => {
      toast.error("Erro ao registrar cardio", { description: error.message });
    },
  });
  
  const updateCardio = trpc.cardio.update.useMutation({
    onSuccess: () => {
      toast.success("Cardio atualizado!");
      refetchCardioLogs();
      refetchCardioStats();
      setShowCardioDetailModal(false);
    },
    onError: (error) => {
      toast.error("Erro ao atualizar cardio", { description: error.message });
    },
  });
  
  const deleteCardio = trpc.cardio.delete.useMutation({
    onSuccess: () => {
      toast.success("Cardio excluído!");
      refetchCardioLogs();
      refetchCardioStats();
      setShowCardioDetailModal(false);
      setSelectedCardioId(null);
    },
    onError: (error) => {
      toast.error("Erro ao excluir cardio", { description: error.message });
    },
  });
  
  // Função para resetar o formulário de cardio
  const resetCardioForm = () => {
    setCardioForm({
      studentId: 0,
      cardioDate: getLocalDateString(new Date()),
      cardioType: '',
      cardioTypeName: '',
      durationMinutes: 0,
      distanceKm: '',
      caloriesBurned: undefined,
      avgHeartRate: undefined,
      maxHeartRate: undefined,
      minHeartRate: undefined,
      intensity: '',
      avgSpeed: '',
      maxSpeed: '',
      avgPace: '',
      incline: '',
      resistance: undefined,
      laps: undefined,
      steps: undefined,
      perceivedEffort: undefined,
      feelingBefore: '',
      feelingAfter: '',
      weather: 'indoor',
      location: '',
      notes: '',
      startTime: '',
      endTime: '',
    });
  };
  
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
          loadType: "kg",
          plannedSets: ex.sets || 3,
          plannedReps: ex.reps || "8-12",
          plannedRest: ex.restTime || 60,
          notes: "",
          isCompleted: false,
          sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
            setNumber: i + 1,
            setType: i === 0 ? "warmup" : "working",
            loadType: "kg",
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
  // Usamos useRef para controlar se já carregamos os exercícios para este workoutDayId
  const lastLoadedDayIdRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Só carrega se:
    // 1. Tem exercícios do dia
    // 2. É um dia diferente do último carregado (evita sobrescrever ao re-render)
    // 3. Não estamos editando um log existente (logDetail)
    if (dayExercises && dayExercises.length > 0 && newLog.workoutDayId !== lastLoadedDayIdRef.current && !logDetail) {
      const exercises: ExerciseData[] = dayExercises.map((ex: any) => ({
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        loadType: "kg",
        plannedSets: ex.sets || 3,
        plannedReps: ex.reps || "8-12",
        plannedRest: ex.restTime || 60,
        notes: "",
        isCompleted: false,
        sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
          setNumber: i + 1,
          setType: i === 0 ? "warmup" : "working",
          loadType: "kg",
          weight: undefined,
          reps: undefined,
          restTime: ex.restTime || 60,
          isCompleted: false,
        })),
        isExpanded: true,
      }));
      setCurrentExercises(exercises);
      lastLoadedDayIdRef.current = newLog.workoutDayId;
    }
  }, [dayExercises, newLog.workoutDayId, logDetail]);
  
  // Efeito para carregar detalhes do log selecionado
  useEffect(() => {
    if (logDetail && logDetail.exercises) {
      const exercises: ExerciseData[] = logDetail.exercises.map((ex: any) => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        muscleGroup: ex.muscleGroup,
        loadType: (ex.loadType || "kg") as LoadType,
        plannedSets: ex.plannedSets,
        plannedReps: ex.plannedReps,
        plannedRest: ex.plannedRest,
        notes: ex.notes,
        isCompleted: ex.isCompleted,
        sets: ex.sets.map((s: any) => ({
          id: s.id,
          setNumber: s.setNumber,
          setType: s.setType,
          loadType: (s.loadType || ex.loadType || "kg") as LoadType,
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
  
  // Funções para substituição de exercícios
  const openSubstitutionModal = (exerciseIndex: number) => {
    setSubstitutingExerciseIndex(exerciseIndex);
    setShowSubstitutionModal(true);
  };

  const handleExerciseSubstitution = (newExercise: ExerciseAlternative) => {
    if (substitutingExerciseIndex === null) return;
    
    const currentExercise = currentExercises[substitutingExerciseIndex];
    if (!currentExercise) return;
    
    const originalName = currentExercise.originalExerciseName || currentExercise.exerciseName;
    const nextNotes = currentExercise.notes 
      ? `${currentExercise.notes} | Substituído: ${originalName} → ${newExercise.name}`
      : `Substituído: ${originalName} → ${newExercise.name}`;
    
    const updated = [...currentExercises];
    updated[substitutingExerciseIndex] = {
      ...currentExercise,
      exerciseName: newExercise.name,
      originalExerciseName: originalName,
      substitutedAt: new Date(),
      notes: nextNotes,
    };
    setCurrentExercises(updated);
    
    // Em registros em andamento, a troca precisa persistir no banco imediatamente.
    if (currentExercise.id && isEditing) {
      updateExercise.mutate({
        id: currentExercise.id,
        exerciseName: newExercise.name,
        loadType: currentExercise.loadType || "kg",
        notes: nextNotes,
      });
    }
    
    toast.success(`Exercício substituído para: ${newExercise.name}`);
    setShowSubstitutionModal(false);
    setSubstitutingExerciseIndex(null);
  };
  
  const handleExerciseNameChange = (exerciseIndex: number, name: string) => {
    const updated = [...currentExercises];
    updated[exerciseIndex] = { ...updated[exerciseIndex], exerciseName: name };
    setCurrentExercises(updated);
  };
  
  const persistExerciseName = (exerciseIndex: number) => {
    const exercise = currentExercises[exerciseIndex];
    if (!exercise) return;
    
    const trimmedName = exercise.exerciseName.trim();
    if (!trimmedName) {
      toast.error("Informe o nome do exercício");
      return;
    }
    
    if (trimmedName !== exercise.exerciseName) {
      const updated = [...currentExercises];
      updated[exerciseIndex] = { ...exercise, exerciseName: trimmedName };
      setCurrentExercises(updated);
    }
    
    if (exercise.id && isEditing) {
      updateExercise.mutate({
        id: exercise.id,
        exerciseName: trimmedName,
      });
    }
  };
  
  const handleExerciseLoadTypeChange = (exerciseIndex: number, loadType: LoadType) => {
    const exercise = currentExercises[exerciseIndex];
    if (!exercise) return;
    
    const updated = [...currentExercises];
    updated[exerciseIndex] = { ...exercise, loadType };
    setCurrentExercises(updated);
    
    if (exercise.id && isEditing) {
      updateExercise.mutate({
        id: exercise.id,
        loadType,
        notes: exercise.notes,
      });
    }
  };
  
  const getLoadTypeLabel = (loadType?: LoadType) =>
    LOAD_TYPES.find(item => item.value === (loadType || "kg"))?.label || "Carga (kg)";
  
  const formatLoadValueByType = (loadType: LoadType | undefined, weight: number | string | null | undefined) => {
    const normalized = loadType || "kg";
    const parsedWeight = weight === null || weight === undefined || weight === ""
      ? undefined
      : Number(weight);
    if (normalized === "bodyweight") return "PC";
    if (normalized === "no_load") return "—";
    if (normalized === "bodyweight_plus") {
      return parsedWeight && parsedWeight > 0 ? `PC + ${parsedWeight}kg` : "PC";
    }
    return parsedWeight !== undefined && !Number.isNaN(parsedWeight) ? `${parsedWeight}kg` : "-";
  };
  
  const formatLoadValue = (exercise: ExerciseData, set: SetData) =>
    formatLoadValueByType(exercise.loadType, set.weight);
  
  const resetNewLog = () => {
    setNewLog({
      studentId: 0,
      workoutId: 0,
      workoutDayId: 0,
      trainingDate: getLocalDateString(new Date()),
      dayName: "",
      startTime: "",
      notes: "",
      feeling: "",
    });
    setCurrentExercises([]);
    lastLoadedDayIdRef.current = null; // Reset para permitir carregar novamente
  };
  
  const handleCreateLog = async () => {
    console.log('=== handleCreateLog INICIADO ===');
    console.log('newLog:', newLog);
    console.log('currentExercises:', currentExercises);
    console.log('isOnline:', offlineTraining.isOnline);
    
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
    
    if (currentExercises.some(ex => !ex.exerciseName.trim())) {
      toast.error("Preencha o nome de todos os exercícios");
      return;
    }
    
    // Se estiver offline, salvar localmente
    if (!offlineTraining.isOnline) {
      console.log('Offline mode: saving locally');
      try {
        // Converter exercícios para formato offline
        const offlineSets = currentExercises.flatMap(ex => 
          ex.sets.map(s => ({
            exerciseName: ex.exerciseName,
            muscleGroup: ex.muscleGroup,
            loadType: s.loadType || ex.loadType || "kg",
            setNumber: s.setNumber,
            weight: s.weight,
            reps: s.reps,
            rpe: s.rpe,
            setType: s.setType || 'working',
            notes: s.notes,
            completed: !!s.isCompleted,
          }))
        );
        
        await offlineTraining.startOfflineTraining({
          studentId: newLog.studentId,
          workoutId: newLog.workoutId || undefined,
          workoutDayId: newLog.workoutDayId || undefined,
          date: newLog.trainingDate,
        });
        
        // Adicionar séries
        for (const set of offlineSets) {
          await offlineTraining.addOfflineSet(set);
        }
        
        // Finalizar treino
        await offlineTraining.completeOfflineTraining(newLog.feeling, newLog.notes);
        
        setShowNewLogModal(false);
        resetNewLog();
        return;
      } catch (error) {
        console.error('Erro ao salvar offline:', error);
        toast.error('Erro ao salvar treino offline');
        return;
      }
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
        loadType: ex.loadType || "kg",
        plannedSets: ex.plannedSets,
        plannedReps: ex.plannedReps,
        plannedRest: ex.plannedRest,
        notes: ex.notes,
        sets: ex.sets.map(s => ({
          setNumber: s.setNumber,
          setType: s.setType as any,
          loadType: s.loadType || ex.loadType || "kg",
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
  
  const renderLoadTypeSelector = (exercise: ExerciseData, exerciseIndex: number) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-3 py-2 border-b bg-muted/20">
      <Label className="text-xs text-muted-foreground whitespace-nowrap">Tipo de carga</Label>
      <Select
        value={exercise.loadType || "kg"}
        onValueChange={(value) => handleExerciseLoadTypeChange(exerciseIndex, value as LoadType)}
      >
        <SelectTrigger className="h-9 w-full sm:w-[210px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LOAD_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-xs text-muted-foreground sm:ml-auto">
        {exercise.loadType === "bodyweight"
          ? "Séries contam pelas repetições, sem exigir kg."
          : exercise.loadType === "bodyweight_plus"
            ? "Informe apenas a carga adicionada ao peso corporal."
            : exercise.loadType === "no_load"
              ? "Ideal para máquina/nível sem carga em kg."
              : "Informe a carga externa em kg."}
      </span>
    </div>
  );
  
  const renderLoadEditor = (exercise: ExerciseData, exerciseIndex: number, set: SetData, setIndex: number) => {
    const loadType = exercise.loadType || "kg";
    
    if (loadType === "bodyweight") {
      return (
        <Badge variant="outline" className="h-8 px-2.5 whitespace-nowrap">
          PC
        </Badge>
      );
    }
    
    if (loadType === "no_load") {
      return (
        <Badge variant="outline" className="h-8 px-2.5 whitespace-nowrap text-muted-foreground">
          Sem carga
        </Badge>
      );
    }
    
    return (
      <div className="flex items-center gap-1">
        {loadType === "bodyweight_plus" && (
          <span className="text-xs font-semibold text-muted-foreground">+</span>
        )}
        <Input
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          className="h-8 w-16 text-center text-sm"
          placeholder="0"
          value={set.weight ?? ""}
          onChange={(e) => handleUpdateSet(
            exerciseIndex,
            setIndex,
            "weight",
            e.target.value ? parseFloat(e.target.value) : undefined
          )}
        />
        <span className="text-xs text-muted-foreground">kg</span>
      </div>
    );
  };
  
  const renderTechniqueLoadEditor = (
    exercise: ExerciseData,
    value: number | undefined,
    onChange: (value: number | undefined) => void
  ) => {
    const loadType = exercise.loadType || "kg";
    
    if (loadType === "bodyweight") {
      return <Badge variant="outline" className="h-8 px-2.5">PC</Badge>;
    }
    if (loadType === "no_load") {
      return <Badge variant="outline" className="h-8 px-2.5 text-muted-foreground">Sem carga</Badge>;
    }
    
    return (
      <div className="flex items-center gap-1">
        {loadType === "bodyweight_plus" && (
          <span className="text-xs font-semibold text-muted-foreground">+</span>
        )}
        <Input
          type="number"
          inputMode="decimal"
          step="0.5"
          min="0"
          className="h-8 w-16 text-center text-sm"
          placeholder="0"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
        />
        <span className="text-xs text-muted-foreground">kg</span>
      </div>
    );
  };
  
  const handleAddSet = (exerciseIndex: number) => {
    const updatedExercises = [...currentExercises];
    const exercise = updatedExercises[exerciseIndex];
    const newSetNumber = exercise.sets.length + 1;
    
    const newSet: SetData = {
      setNumber: newSetNumber,
      setType: "working",
      loadType: exercise.sets[exercise.sets.length - 1]?.loadType || exercise.loadType || "kg",
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
        loadType: newSet.loadType,
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
    return safeDate(date).toLocaleDateString('pt-BR', {
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
        // Peso corporal/sem carga também contam como série realizada.
        if (isSetPerformed(set)) completedSets++;
      });
    });
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 pb-24 sm:pb-0">
        {/* Banner de Status Offline */}
        {!offlineTraining.isOnline && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700">
                <WifiOff className="h-5 w-5" />
                <span className="font-medium">Modo Offline</span>
                <span className="text-sm">- Os registros serão salvos localmente</span>
              </div>
              {offlineTraining.pendingCount.personal > 0 && (
                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300">
                  {offlineTraining.pendingCount.personal} pendente(s)
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Banner de Registros Pendentes (quando online) */}
        {offlineTraining.isOnline && offlineTraining.pendingCount.personal > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <CloudOff className="h-5 w-5" />
                <span className="font-medium">{offlineTraining.pendingCount.personal} registro(s) aguardando sincronização</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="text-blue-700 border-blue-300 hover:bg-blue-100"
                onClick={() => offlineTraining.syncPendingLogs()}
                disabled={offlineTraining.isSyncing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${offlineTraining.isSyncing ? 'animate-spin' : ''}`} />
                {offlineTraining.isSyncing ? 'Sincronizando...' : 'Sincronizar'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <div className="flex items-start gap-2">
              <Dumbbell className="h-5 w-5 sm:h-6 sm:w-6 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold leading-tight">
                    Diário de Treino do Maromba
                  </h1>
                  {/* Indicador de status de conexão */}
                  {offlineTraining.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-amber-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-sm sm:text-base text-muted-foreground mt-1 leading-relaxed">
                  Registre e acompanhe a evolução dos treinos dos seus alunos
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:min-w-[200px]">
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-full sm:w-[200px] h-11 sm:h-10">
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
            
            <Button className="h-11 sm:h-10 text-base sm:text-sm" onClick={() => setShowNewLogModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Registro Maromba
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="grid w-full grid-cols-5 gap-1 p-1 h-auto rounded-xl bg-muted/50">
              <TabsTrigger value="sessoes" className="min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 text-[10px] sm:text-sm leading-none sm:leading-normal rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-full">Sessões</span>
              </TabsTrigger>
              <TabsTrigger value="registros" className="min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 text-[10px] sm:text-sm leading-none sm:leading-normal rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Dumbbell className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-full">Registros</span>
              </TabsTrigger>
              <TabsTrigger value="cardio" className="min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 text-[10px] sm:text-sm leading-none sm:leading-normal rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Heart className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-full">Cardio</span>
              </TabsTrigger>
              <TabsTrigger value="cardio-stats" className="min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 text-[10px] sm:text-sm leading-none sm:leading-normal rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <TrendingUp className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-full">Evolução</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-2 text-[10px] sm:text-sm leading-none sm:leading-normal rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate max-w-full">Análise</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Tab: Sessões - Mostra apenas sessões NÃO preenchidas (sem workoutLog) */}
          <TabsContent value="sessoes" className="space-y-4">
            {upcomingSessions && upcomingSessions.filter((s: any) => !s.hasWorkoutLog && s.status !== 'cancelled').length > 0 ? (
              <div className="grid gap-4">
                {upcomingSessions.filter((s: any) => !s.hasWorkoutLog && s.status !== 'cancelled').map((session: any) => {
                  const sessionDate = safeDate(session.scheduledAt);
                  const isToday = sessionDate.toDateString() === new Date().toDateString();
                  const isPast = sessionDate < new Date() && !isToday;
                  const statusColor = session.status === 'completed' ? 'bg-green-500' : 
                                     session.status === 'cancelled' ? 'bg-red-500' : 
                                     isToday ? 'bg-yellow-500' : 'bg-blue-500';
                  
                  return (
                    <Card 
                      key={session.id} 
                      className={`cursor-pointer hover:border-primary transition-colors ${isPast && session.status !== 'completed' ? 'opacity-60' : ''}`}
                      onClick={() => {
                        setSelectedSession(session);
                        setNewLog({
                          studentId: session.studentId,
                          workoutId: session.workoutId || 0,
                          workoutDayId: 0,
                          trainingDate: getLocalDateString(safeDate(session.scheduledAt)),
                          dayName: session.notes || `Sessão ${session.time}`,
                          startTime: session.time || '',
                          notes: '',
                          feeling: '',
                        });
                        setShowSessionLogModal(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-full ${statusColor}/20 flex items-center justify-center`}>
                              <Calendar className={`h-6 w-6 ${statusColor.replace('bg-', 'text-')}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{session.student?.name || 'Aluno'}</h3>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {session.notes || 'Sessão de treino'} • {safeDateFormat(session.scheduledAt)}
                              </p>
                              {session.time && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3" />
                                  {session.time}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={session.status === 'completed' ? 'default' : 
                                          session.status === 'cancelled' ? 'destructive' : 
                                          isToday ? 'secondary' : 'outline'}>
                              {session.status === 'completed' ? 'Concluído' : 
                               session.status === 'cancelled' ? 'Cancelado' : 
                               isToday ? 'Hoje' : 
                               isPast ? 'Pendente' : 'Agendado'}
                            </Badge>
                            
                            {session.workout?.name && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Dumbbell className="h-3 w-3" />
                                {session.workout.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Tudo em dia!</h3>
                  <p className="text-muted-foreground mb-4">
                    Não há sessões pendentes de registro. As sessões já preenchidas aparecem na aba "Registros Maromba".
                  </p>
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
          
          {/* Tab: Cardio */}
          <TabsContent value="cardio" className="space-y-4">
            {/* Botão de novo cardio */}
            <div className="flex justify-end">
              <Button onClick={() => setShowCardioModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cardio
              </Button>
            </div>
            
            {/* Estatísticas de Cardio */}
            {cardioStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">Sessões</span>
                    </div>
                    <p className="text-2xl font-bold">{cardioStats.totalSessions || 0}</p>
                    <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Timer className="h-4 w-4" />
                      <span className="text-sm">Tempo Total</span>
                    </div>
                    <p className="text-2xl font-bold">{cardioStats.totalDuration || 0}min</p>
                    <p className="text-xs text-muted-foreground">Média: {cardioStats.avgDuration || 0}min/sessão</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Footprints className="h-4 w-4" />
                      <span className="text-sm">Distância</span>
                    </div>
                    <p className="text-2xl font-bold">{cardioStats.totalDistance?.toFixed(1) || 0}km</p>
                    <p className="text-xs text-muted-foreground">Média: {cardioStats.avgDistance?.toFixed(1) || 0}km/sessão</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Flame className="h-4 w-4" />
                      <span className="text-sm">Calorias</span>
                    </div>
                    <p className="text-2xl font-bold">{cardioStats.totalCalories || 0}</p>
                    <p className="text-xs text-muted-foreground">FC Média: {cardioStats.avgHeartRate || '-'} bpm</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* Distribuição por Tipo */}
            {cardioStats?.byType && Object.keys(cardioStats.byType).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Distribuição por Tipo de Cardio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {Object.entries(cardioStats.byType).map(([type, data]: [string, any]) => {
                      const cardioType = CARDIO_TYPES.find(t => t.value === type);
                      return (
                        <div key={type} className="p-3 rounded-lg bg-muted/50 border">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">{cardioType?.label || type}</span>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <p>{data.count} sessões</p>
                            <p>{data.duration}min total</p>
                            <p>{data.distance?.toFixed(1) || 0}km</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Lista de Registros de Cardio */}
            {cardioLogs && cardioLogs.length > 0 ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Histórico de Cardio</h3>
                {cardioLogs.map((log: any) => {
                  const cardioType = CARDIO_TYPES.find(t => t.value === log.cardioType);
                  const intensity = CARDIO_INTENSITIES.find(i => i.value === log.intensity);
                  return (
                    <Card 
                      key={log.id} 
                      className="cursor-pointer hover:border-primary transition-colors"
                      onClick={() => {
                        setSelectedCardioId(log.id);
                        setShowCardioDetailModal(true);
                      }}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                              <Heart className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{log.student?.name || "Aluno"}</h3>
                                {log.feelingAfter && (
                                  <span className="text-lg">
                                    {CARDIO_FEELINGS.find(f => f.value === log.feelingAfter)?.emoji}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {cardioType?.label || log.cardioType} • {formatDate(log.cardioDate)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {log.durationMinutes}min
                            </Badge>
                            
                            {log.distanceKm && parseFloat(log.distanceKm) > 0 && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Footprints className="h-3 w-3" />
                                {parseFloat(log.distanceKm).toFixed(1)}km
                              </Badge>
                            )}
                            
                            {log.caloriesBurned && log.caloriesBurned > 0 && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                {log.caloriesBurned}kcal
                              </Badge>
                            )}
                            
                            {log.avgHeartRate && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {log.avgHeartRate}bpm
                              </Badge>
                            )}
                            
                            {intensity && (
                              <Badge className={`${intensity.color} text-white`}>
                                {intensity.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum cardio registrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Comece a registrar as atividades cardiovasculares dos seus alunos.
                  </p>
                  <Button onClick={() => setShowCardioModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Primeiro Cardio
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab: Estatísticas Cardio */}
          <TabsContent value="cardio-stats" className="space-y-4">
            {selectedStudentId ? (
              <CardioEvolutionDashboard 
                studentId={parseInt(selectedStudentId)} 
                studentName={students?.find((s: any) => s.id === parseInt(selectedStudentId))?.name}
                period={30}
              />
            ) : (
              <CardioStatsTab studentId={selectedStudentId} />
            )}
          </TabsContent>
          
          {/* Tab: Dashboard */}
          <TabsContent value="dashboard" className="space-y-4">
            {dashboard ? (
              <>
                {/* Cards de resumo - compactos no mobile */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <Card className="shadow-sm">
                    <CardContent className="p-2 sm:p-4">
                      <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground mb-0.5 sm:mb-1">
                        <Dumbbell className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">Treinos</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold">{dashboard.totalWorkouts}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm">
                    <CardContent className="p-2 sm:p-4">
                      <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground mb-0.5 sm:mb-1">
                        <Weight className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">Volume</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold">{(dashboard.totalVolume / 1000).toFixed(1)}t</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="shadow-sm">
                    <CardContent className="p-2 sm:p-4">
                      <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground mb-0.5 sm:mb-1">
                        <Repeat className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm">Séries</span>
                      </div>
                      <p className="text-lg sm:text-2xl font-bold">{dashboard.totalSets}</p>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Gráfico de treinos por mês */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                      Treinos por Mês
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 sm:pb-6">
                    <div className="flex items-end justify-between gap-1 sm:gap-2 h-28 sm:h-40">
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
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 sm:pb-4">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                      Volume por Mês (kg)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 sm:pb-6">
                    <div className="flex items-end justify-between gap-1 sm:gap-2 h-28 sm:h-40">
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
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 sm:pb-4">
                    <div className="flex flex-col gap-3">
                      {/* Título e botões de métrica */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                          <Target className="h-4 w-4 sm:h-5 sm:w-5" />
                          Análise por Grupo Muscular
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant={muscleMetric === 'sets' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMuscleMetric('sets')}
                            className="text-xs h-6 sm:h-7 px-2 sm:px-3"
                          >
                            Séries
                          </Button>
                          <Button
                            variant={muscleMetric === 'exercises' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMuscleMetric('exercises')}
                            className="text-xs h-6 sm:h-7 px-2 sm:px-3"
                          >
                            Exercícios
                          </Button>
                          <Button
                            variant={muscleMetric === 'volume' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setMuscleMetric('volume')}
                            className="text-xs h-6 sm:h-7 px-2 sm:px-3"
                          >
                            Volume
                          </Button>
                        </div>
                      </div>
                      
                      {/* Filtros de período e toggle in_progress */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        {/* Seletor de período */}
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <Select value={musclePeriod} onValueChange={setMusclePeriod}>
                            <SelectTrigger className="h-7 sm:h-8 w-[130px] sm:w-[150px] text-xs sm:text-sm">
                              <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="today">Hoje</SelectItem>
                              <SelectItem value="yesterday">Ontem</SelectItem>
                              <SelectItem value="7days">Últimos 7 dias</SelectItem>
                              <SelectItem value="30days">Últimos 30 dias</SelectItem>
                              <SelectItem value="90days">Últimos 90 dias</SelectItem>
                              <SelectItem value="all">Todo período</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Toggle para incluir em andamento */}
                        <div className="flex items-center gap-2">
                          <Switch
                            id="include-in-progress"
                            checked={includeInProgress}
                            onCheckedChange={setIncludeInProgress}
                            className="h-4 w-7"
                          />
                          <Label htmlFor="include-in-progress" className="text-xs sm:text-sm text-muted-foreground cursor-pointer">
                            Incluir em andamento
                          </Label>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      {muscleMetric === 'sets' ? 'Ordenado por séries realizadas' : 
                       muscleMetric === 'exercises' ? 'Ordenado por quantidade de exercícios' : 
                       'Ordenado por volume (kg) movimentado'}
                      {musclePeriod !== 'all' && (
                        <span className="ml-1">
                          ({musclePeriod === 'today' ? 'hoje' : 
                            musclePeriod === 'yesterday' ? 'ontem' : 
                            musclePeriod === '7days' ? 'últimos 7 dias' : 
                            musclePeriod === '30days' ? 'últimos 30 dias' : 'últimos 90 dias'})
                        </span>
                      )}
                      {includeInProgress && <span className="ml-1 text-amber-500">• incl. em andamento</span>}
                    </p>
                  </CardHeader>
                  <CardContent>
                    {muscleGroupData && muscleGroupData.length > 0 ? (
                      <div className="space-y-4">
                        {/* Gráfico de barras horizontais - compacto no mobile */}
                        <div className="space-y-2 sm:space-y-3">
                          {sortedMuscleGroupData.map((group: any, index: number) => {
                            const metricValue = muscleMetric === 'sets' ? group.sets : 
                                             muscleMetric === 'exercises' ? group.exercises : group.volume;
                            const maxMetric = Math.max(...sortedMuscleGroupData.map((g: any) => 
                              muscleMetric === 'sets' ? g.sets : 
                              muscleMetric === 'exercises' ? g.exercises : g.volume
                            ));
                            const percentage = maxMetric > 0 ? (metricValue / maxMetric) * 100 : 0;
                            const colors = [
                              'bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500',
                              'bg-pink-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-red-500',
                              'bg-indigo-500', 'bg-teal-500', 'bg-lime-500', 'bg-amber-500'
                            ];
                            const color = colors[index % colors.length];
                            return (
                              <div key={group.name} className="space-y-0.5 sm:space-y-1">
                                <div className="flex items-center justify-between text-xs sm:text-sm">
                                  <span className="font-medium truncate max-w-[100px] sm:max-w-none">{group.name}</span>
                                  <span className="text-muted-foreground text-xs">
                                    <strong>{muscleMetric === 'sets' ? `${group.sets} séries` : 
                                            muscleMetric === 'exercises' ? `${group.exercises} exerc.` : 
                                            `${(group.volume/1000).toFixed(1)}t`}</strong>
                                    <span className="hidden sm:inline"> · {group.exercises} exercícios · {group.volume.toLocaleString('pt-BR')}kg</span>
                                  </span>
                                </div>
                                <div className="h-2.5 sm:h-4 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${color} rounded-full transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        {/* Resumo - compacto no mobile */}
                        <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
                          <div className="text-center p-1.5 sm:p-2 bg-muted/50 rounded-lg">
                            <p className="text-sm sm:text-lg font-bold">{muscleGroupData.length}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Grupos</p>
                          </div>
                          <div className="text-center p-1.5 sm:p-2 bg-muted/50 rounded-lg">
                            <p className="text-sm sm:text-lg font-bold">
                              {(muscleGroupData.reduce((sum: number, g: any) => sum + g.volume, 0) / 1000).toFixed(1)}t
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Volume</p>
                          </div>
                          <div className="text-center p-1.5 sm:p-2 bg-muted/50 rounded-lg">
                            <p className="text-sm sm:text-lg font-bold">
                              {muscleGroupData.reduce((sum: number, g: any) => sum + g.sets, 0)}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Séries</p>
                          </div>
                          <div className="text-center p-1.5 sm:p-2 bg-muted/50 rounded-lg">
                            <p className="text-sm sm:text-lg font-bold">
                              {muscleGroupData.reduce((sum: number, g: any) => sum + g.exercises, 0)}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Exerc.</p>
                          </div>
                        </div>
                        
                        {/* Análise de Equilíbrio Muscular - compacto no mobile */}
                        {muscleBalanceAnalysis && muscleBalanceAnalysis.length > 0 && (
                          <div className="pt-3 sm:pt-4 border-t">
                            <h4 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                              <Scale className="h-3 w-3 sm:h-4 sm:w-4" />
                              Equilíbrio Muscular
                            </h4>
                            <div className="space-y-2 sm:space-y-3">
                              {muscleBalanceAnalysis.map((pair: any) => (
                                <div key={pair.name} className="space-y-0.5 sm:space-y-1">
                                  <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                    <span className="font-medium truncate max-w-[80px] sm:max-w-none">{pair.name}</span>
                                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${
                                      pair.status === 'balanced' ? 'bg-green-500/20 text-green-600' :
                                      pair.status === 'warning' ? 'bg-yellow-500/20 text-yellow-600' :
                                      'bg-red-500/20 text-red-600'
                                    }`}>
                                      {pair.message}
                                    </span>
                                  </div>
                                  <div className="flex h-2 sm:h-3 rounded-full overflow-hidden bg-muted">
                                    <div 
                                      className="bg-blue-500 transition-all"
                                      style={{ width: `${pair.muscle1.percentage}%` }}
                                      title={`${pair.muscle1.name}: ${pair.muscle1.sets} séries`}
                                    />
                                    <div 
                                      className="bg-purple-500 transition-all"
                                      style={{ width: `${pair.muscle2.percentage}%` }}
                                      title={`${pair.muscle2.name}: ${pair.muscle2.sets} séries`}
                                    />
                                  </div>
                                  <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
                                    <span>{pair.muscle1.name}: {pair.muscle1.sets}s</span>
                                    <span>{pair.muscle2.name}: {pair.muscle2.sets}s</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
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
                
                {/* Seção de Cardio no Dashboard */}
                {cardioStats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" />
                        Resumo de Cardio (Últimos 30 dias)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-red-500/10 rounded-lg">
                          <Heart className="h-5 w-5 mx-auto text-red-500 mb-1" />
                          <p className="text-xl font-bold">{cardioStats.totalSessions || 0}</p>
                          <p className="text-xs text-muted-foreground">Sessões</p>
                        </div>
                        <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                          <Timer className="h-5 w-5 mx-auto text-blue-500 mb-1" />
                          <p className="text-xl font-bold">{cardioStats.totalDuration || 0}min</p>
                          <p className="text-xs text-muted-foreground">Tempo Total</p>
                        </div>
                        <div className="text-center p-3 bg-green-500/10 rounded-lg">
                          <Footprints className="h-5 w-5 mx-auto text-green-500 mb-1" />
                          <p className="text-xl font-bold">{cardioStats.totalDistance?.toFixed(1) || 0}km</p>
                          <p className="text-xs text-muted-foreground">Distância</p>
                        </div>
                        <div className="text-center p-3 bg-orange-500/10 rounded-lg">
                          <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                          <p className="text-xl font-bold">{cardioStats.totalCalories || 0}</p>
                          <p className="text-xs text-muted-foreground">Calorias</p>
                        </div>
                      </div>
                      
                      {/* Gráfico de barras por tipo de cardio */}
                      {cardioStats.byType && Object.keys(cardioStats.byType).length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium text-sm text-muted-foreground">Distribuição por Tipo</h4>
                          {Object.entries(cardioStats.byType).map(([type, data]: [string, any]) => {
                            const cardioType = CARDIO_TYPES.find(t => t.value === type);
                            const maxDuration = Math.max(...Object.values(cardioStats.byType).map((d: any) => d.duration));
                            const percentage = maxDuration > 0 ? (data.duration / maxDuration) * 100 : 0;
                            return (
                              <div key={type} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{cardioType?.label || type}</span>
                                  <span className="text-muted-foreground">
                                    {data.count} sessões · {data.duration}min · {data.distance?.toFixed(1) || 0}km
                                  </span>
                                </div>
                                <div className="h-3 bg-muted rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Média de FC */}
                      {cardioStats.avgHeartRate && cardioStats.avgHeartRate > 0 && (
                        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Frequência Cardíaca Média</span>
                            <span className="font-bold text-red-500">{cardioStats.avgHeartRate} bpm</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
                
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm">Buscar Exercício</Label>
                        <Input
                          placeholder="Digite para filtrar..."
                          value={exerciseSearchFilter}
                          onChange={(e) => setExerciseSearchFilter(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Exercício Selecionado</Label>
                        <Select value={progressExercise} onValueChange={(v) => {
                          setProgressExercise(v);
                          setExpandedHistoryItem(null);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um exercício" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {filteredExercises.length > 0 ? (
                              filteredExercises.map((name) => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                Nenhum exercício encontrado
                              </div>
                            )}
                          </SelectContent>
                        </Select>
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
                    
                    {/* Mensagem quando não há exercício selecionado */}
                    {!progressExercise && filteredExercises.length > 0 && (
                      <div className="border rounded-lg p-3 sm:p-4 bg-muted/20 text-center">
                        <p className="text-sm text-muted-foreground">
                          Selecione um exercício acima para ver a evolução
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {filteredExercises.length} exercícios disponíveis
                        </p>
                      </div>
                    )}
                    
                    {/* Conteúdo */}
                    {exerciseProgress && exerciseProgress.length > 0 ? (() => {
                      // Filtrar por período
                      const now = new Date();
                      const filteredProgress = exerciseProgress.filter((item: any) => {
                        const itemDate = safeDate(item.date);
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
                      
                      const progressLoadType = (filteredProgress[0]?.loadType || "kg") as LoadType;
                      const progressUsesLoad = isMeasuredLoad(progressLoadType);
                      const progressMetric = (item: any) =>
                        progressUsesLoad ? (item.maxWeight || 0) : (item.maxReps || 0);
                      const progressUnit = progressUsesLoad ? "kg" : " reps";
                      const progressMetricLabel = progressUsesLoad ? "Carga Máxima" : "Repetições Máximas";
                      
                      return (
                        <div className="space-y-4">
                          {/* Resumo compacto */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                              <p className="text-xl font-bold text-primary">
                                {Math.max(...filteredProgress.map(progressMetric))}{progressUnit}
                              </p>
                              <p className="text-xs text-muted-foreground">Recorde</p>
                            </div>
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-xl font-bold">
                                {(filteredProgress.reduce((sum: number, i: any) => sum + progressMetric(i), 0) / filteredProgress.length).toFixed(1)}{progressUnit}
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
                              <span className="text-sm font-medium">Tendência de {progressMetricLabel}</span>
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
                                  const maxW = Math.max(...filteredProgress.map(progressMetric));
                                  const minW = Math.min(...filteredProgress.map(progressMetric));
                                  const range = maxW - minW || 1;
                                  const points = filteredProgress.slice().reverse().map((item: any, idx: number) => {
                                    const x = (idx / Math.max(filteredProgress.length - 1, 1)) * 100;
                                    const y = 35 - ((progressMetric(item) - minW) / range) * 30;
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
                                        const y = 35 - ((progressMetric(item) - minW) / range) * 30;
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
                                <span>{safeDateFormat(filteredProgress[filteredProgress.length - 1]?.date, { day: '2-digit', month: '2-digit' })}</span>
                                <span>{safeDateFormat(filteredProgress[0]?.date, { day: '2-digit', month: '2-digit' })}</span>
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
                                const date = safeDate(item.date);
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
                                          <div className="font-bold text-primary">
                                            {progressUsesLoad ? `${item.maxWeight || 0}kg` : `${item.maxReps || 0} reps`}
                                          </div>
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
                                                        {formatLoadValueByType(item.loadType as LoadType | undefined, set.weight)}
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
                        <p className="text-sm">para ver a evolução ao longo do tempo.</p>
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
          <DialogContent className="max-w-4xl sm:max-w-4xl flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Novo Registro de Treino
              </DialogTitle>
              <DialogDescription>
                Registre um novo treino para acompanhar a evolução do aluno
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto -mx-4 px-4 sm:-mx-6 sm:px-6">
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
                    disabled={!newLog.studentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={newLog.studentId ? "Selecione o treino" : "Selecione o aluno primeiro"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Treino livre</SelectItem>
                      {studentWorkouts && studentWorkouts.length > 0 ? (
                        <>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b">
                            Treinos do Aluno
                          </div>
                          {studentWorkouts.map((workout: any) => (
                            <SelectItem key={workout.id} value={workout.id.toString()}>
                              <div className="flex items-center gap-2">
                                <Dumbbell className="h-3 w-3 text-emerald-500" />
                                {workout.name}
                              </div>
                            </SelectItem>
                          ))}
                        </>
                      ) : newLog.studentId > 0 ? (
                        <div className="px-2 py-2 text-xs text-muted-foreground text-center">
                          Nenhum treino cadastrado para este aluno
                        </div>
                      ) : null}
                    </SelectContent>
                  </Select>
                  {newLog.studentId > 0 && studentWorkouts && studentWorkouts.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {studentWorkouts.length} treino(s) disponível(is) para este aluno
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Horário de Início</Label>
                  <Input
                    type="time"
                    value={newLog.startTime}
                    onChange={(e) => setNewLog({ ...newLog, startTime: e.target.value })}
                  />
                </div>
              </div>
              
              {newLog.workoutId > 0 && workoutDays && workoutDays.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  
                  <div className="space-y-2">
                    <Label>Nome do Dia (opcional)</Label>
                    <Input
                      placeholder="Ex: Treino A - Peito e Tríceps"
                      value={newLog.dayName}
                      onChange={(e) => setNewLog({ ...newLog, dayName: e.target.value })}
                    />
                  </div>
                </div>
              )}
              
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
                        loadType: "kg",
                        plannedSets: 3,
                        plannedReps: "8-12",
                        plannedRest: 60,
                        notes: "",
                        isCompleted: false,
                        sets: [
                          { setNumber: 1, setType: "warmup", loadType: "kg", isCompleted: false },
                          { setNumber: 2, setType: "working", loadType: "kg", isCompleted: false },
                          { setNumber: 3, setType: "working", loadType: "kg", isCompleted: false },
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
                                  onChange={(e) => handleExerciseNameChange(exIndex, e.target.value)}
                                  onBlur={() => persistExerciseName(exIndex)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                {exercise.muscleGroup && (
                                  <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {exercise.sets.filter(isSetPerformed).length}/{exercise.sets.length} séries
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
                            {renderLoadTypeSelector(exercise, exIndex)}
                            {/* Lista de séries - layout compacto sem rolagem */}
                            <div className="divide-y">
                              {exercise.sets.map((set, setIndex) => (
                                <div key={setIndex} className="p-3">
                                  {/* Linha principal da série */}
                                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
                                    
                                    {renderLoadEditor(exercise, exIndex, set, setIndex)}
                                    
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
                                          {renderTechniqueLoadEditor(
                                            exercise,
                                            set.dropWeight,
                                            (value) => handleUpdateSet(exIndex, setIndex, 'dropWeight', value)
                                          )}
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
                                          {renderTechniqueLoadEditor(
                                            exercise,
                                            set.restPauseWeight,
                                            (value) => handleUpdateSet(exIndex, setIndex, 'restPauseWeight', value)
                                          )}
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
            </div>
            
            <DialogFooter className="gap-2 flex-shrink-0 border-t pt-4 mt-4">
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
          <DialogContent className="w-auto max-w-none h-auto max-h-none sm:w-full sm:max-w-4xl sm:max-h-[90vh] flex flex-col overflow-hidden p-4 sm:p-6" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader className="flex-shrink-0 pr-6">
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
            
            <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain -mx-4 px-4 sm:-mx-6 sm:px-6 pb-2 [scrollbar-gutter:stable]">
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
                      <CardHeader className="p-3 sm:p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-3 cursor-pointer flex-1 min-w-0" onClick={() => toggleExerciseExpand(exIndex)}>
                            <span className="text-lg font-bold text-primary flex-shrink-0">{exIndex + 1}</span>
                            <div className="min-w-0 flex-1">
                              {isEditing && logDetail.status === 'in_progress' ? (
                                <Input
                                  className="font-semibold text-sm sm:text-base h-9"
                                  value={exercise.exerciseName}
                                  placeholder="Nome do exercício"
                                  onChange={(e) => handleExerciseNameChange(exIndex, e.target.value)}
                                  onBlur={() => persistExerciseName(exIndex)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <h4 className="font-semibold text-sm sm:text-base leading-snug break-words">{exercise.exerciseName}</h4>
                              )}
                              {exercise.originalExerciseName && (
                                <p className="text-xs text-blue-600 flex items-center gap-1">
                                  <RefreshCw className="h-3 w-3" />
                                  Substituído de: {exercise.originalExerciseName}
                                </p>
                              )}
                              {exercise.muscleGroup && !exercise.originalExerciseName && (
                                <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pl-10 sm:pl-0">
                            {isEditing && logDetail.status === 'in_progress' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openSubstitutionModal(exIndex);
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2.5 text-xs"
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Trocar
                              </Button>
                            )}
                            <Badge variant="outline" className="text-xs whitespace-nowrap">
                              {exercise.sets.filter(isSetPerformed).length}/{exercise.sets.length} séries
                            </Badge>
                            <div className="cursor-pointer h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted flex-shrink-0" onClick={() => toggleExerciseExpand(exIndex)}>
                              {exercise.isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {exercise.isExpanded && (
                        <CardContent className="p-0">
                          {isEditing && logDetail.status === 'in_progress' ? (
                            renderLoadTypeSelector(exercise, exIndex)
                          ) : (
                            <div className="px-3 py-2 border-b bg-muted/20">
                              <Badge variant="outline">{getLoadTypeLabel(exercise.loadType)}</Badge>
                            </div>
                          )}
                          {/* Lista de séries - layout compacto */}
                          <div className="divide-y">
                            {exercise.sets.map((set, setIndex) => (
                              <div key={setIndex} className="p-3">
                                {/* Linha principal da série */}
                                <div className="space-y-2">
                                  {/* Linha 1: Número + Tipo de série + Botão remover */}
                                  <div className="flex items-center gap-2">
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
                                        <SelectTrigger className="h-8 flex-1 text-xs">
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
                                    
                                    {isEditing && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive flex-shrink-0"
                                        onClick={() => handleRemoveSet(exIndex, setIndex)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                  
                                  {/* Linha 2: Peso + Reps + Descanso */}
                                  {isEditing ? (
                                    <div className="flex items-center gap-3 pl-9">
                                      {renderLoadEditor(exercise, exIndex, set, setIndex)}
                                      
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
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-3 pl-9">
                                      <span className="font-semibold text-foreground">
                                        {formatLoadValue(exercise, set)}
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
                                        {renderTechniqueLoadEditor(
                                          exercise,
                                          set.dropWeight,
                                          (value) => handleUpdateSet(exIndex, setIndex, 'dropWeight', value)
                                        )}
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
                                        {renderTechniqueLoadEditor(
                                          exercise,
                                          set.restPauseWeight,
                                          (value) => handleUpdateSet(exIndex, setIndex, 'restPauseWeight', value)
                                        )}
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
            </div>
            
                        <DialogFooter className="flex-shrink-0 border-t mt-2 pt-3 sm:pt-4 bg-background pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
              {logDetail?.status === 'in_progress' && (
                <div className="w-full grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto h-11 sm:h-10 px-2"
                    onClick={() => setShowLogDetailModal(false)}
                  >
                    Fechar
                  </Button>
                  <Button 
                    variant="secondary"
                    className="w-full sm:w-auto h-11 sm:h-10 px-2"
                    onClick={() => {
                      // Salvar nome/tipo de carga dos exercícios e todas as séries atuais
                      currentExercises.forEach((ex) => {
                        if (ex.id && ex.exerciseName.trim()) {
                          updateExercise.mutate({
                            id: ex.id,
                            exerciseName: ex.exerciseName.trim(),
                            loadType: ex.loadType || "kg",
                            notes: ex.notes,
                          });
                        }
                        ex.sets.forEach((set) => {
                          if (set.id) {
                            updateSet.mutate({
                              id: set.id,
                              weight: set.weight,
                              reps: set.reps,
                              restTime: set.restTime,
                              setType: set.setType,
                              isDropSet: set.isDropSet,
                              dropWeight: set.dropWeight,
                              dropReps: set.dropReps,
                              isRestPause: set.isRestPause,
                              restPauseWeight: set.restPauseWeight,
                              restPauseReps: set.restPauseReps,
                              restPausePause: set.restPausePause,
                            });
                          }
                        });
                      });
                      toast.success("Alterações salvas!");
                    }} 
                    disabled={updateSet.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSet.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                  <Button
                    className="w-full sm:w-auto h-11 sm:h-10 px-2 text-sm sm:min-w-[170px]"
                    onClick={handleCompleteLog}
                    disabled={completeLog.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {completeLog.isPending ? "Finalizando..." : "Finalizar Treino"}
                  </Button>
                  <Button 
                    variant="destructive"
                    className="w-full sm:w-auto h-11 sm:h-10 px-2"
                    onClick={() => setShowDeleteLogConfirm(true)}
                    disabled={deleteLog.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </Button>
                </div>
              )}
              {logDetail?.status === 'completed' && (
                <Button className="w-full sm:w-auto h-11 sm:h-10" onClick={() => setShowLogDetailModal(false)}>
                  Fechar
                </Button>
              )}
            </DialogFooter>
            
            {/* Modal de Confirmação de Exclusão */}
            {showDeleteLogConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl">
                  <h3 className="text-lg font-semibold mb-2">Confirmar Exclusão</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Tem certeza que deseja excluir este registro de treino? Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowDeleteLogConfirm(false)}>
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (selectedLogId) {
                          deleteLog.mutate({ id: selectedLogId });
                        }
                        setShowDeleteLogConfirm(false);
                      }}
                      disabled={deleteLog.isPending}
                    >
                      {deleteLog.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Excluir
                    </Button>
                  </div>
                </div>
              </div>
            )}
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
          <DialogContent className="max-w-4xl sm:max-w-4xl flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Registrar Treino - {selectedSession?.student?.name || 'Aluno'}
              </DialogTitle>
              <DialogDescription>
                {selectedSession && (
                  <span>
                    {safeDateFormat(selectedSession?.scheduledAt, { weekday: 'long', day: 'numeric', month: 'long' })}
                    {' às '}
                    {selectedSession?.scheduledAt ? safeDate(selectedSession.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                    {selectedSession.workoutId && ` • Treino ${selectedSession.workoutDayIndex !== null ? String.fromCharCode(65 + selectedSession.workoutDayIndex) : ''}`}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto -mx-4 px-4 sm:-mx-6 sm:px-6">
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
                      {newLog.trainingDate ? safeDateFormat(newLog.trainingDate + 'T12:00:00', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Selecionar data'}
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
                      <CardHeader className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => {
                            const updated = [...currentExercises];
                            updated[exIndex].isExpanded = !updated[exIndex].isExpanded;
                            setCurrentExercises(updated);
                          }}>
                            <Dumbbell className="h-4 w-4 text-primary" />
                            <div className="flex flex-col flex-1 min-w-0">
                              <Input
                                className="font-medium h-9"
                                value={exercise.exerciseName}
                                placeholder="Nome do exercício"
                                onChange={(e) => handleExerciseNameChange(exIndex, e.target.value)}
                                onBlur={() => persistExerciseName(exIndex)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              {exercise.originalExerciseName && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <RefreshCw className="h-3 w-3" />
                                  Substituído de: {exercise.originalExerciseName}
                                </span>
                              )}
                            </div>
                            {exercise.muscleGroup && (
                              <Badge variant="outline" className="text-xs">{exercise.muscleGroup}</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                openSubstitutionModal(exIndex);
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-7 px-2"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Trocar
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              {exercise.plannedSets}x{exercise.plannedReps}
                            </span>
                            <div className="cursor-pointer" onClick={() => {
                              const updated = [...currentExercises];
                              updated[exIndex].isExpanded = !updated[exIndex].isExpanded;
                              setCurrentExercises(updated);
                            }}>
                              {exercise.isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {exercise.isExpanded && (
                        <CardContent className="p-0">
                          {renderLoadTypeSelector(exercise, exIndex)}
                          <div className="divide-y px-3">
                            {exercise.sets.map((set, setIndex) => (
                              <div key={setIndex} className="py-3">
                                {/* Linha principal da série */}
                                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
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
                                  
                                  {renderLoadEditor(exercise, exIndex, set, setIndex)}
                                  
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
                                
                                {/* Botões Toggle para Drop Set e Rest-Pause */}
                                <div className="flex gap-2 mt-2 ml-9">
                                  <Button
                                    size="sm"
                                    variant={set.isDropSet || set.setType === 'drop' ? 'default' : 'outline'}
                                    className={`h-7 text-xs ${set.isDropSet || set.setType === 'drop' ? 'bg-purple-500 hover:bg-purple-600 text-white' : 'border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-950/30'}`}
                                    onClick={() => {
                                      const updated = [...currentExercises];
                                      const isActive = updated[exIndex].sets[setIndex].isDropSet || updated[exIndex].sets[setIndex].setType === 'drop';
                                      updated[exIndex].sets[setIndex].isDropSet = !isActive;
                                      if (!isActive) {
                                        // Ativando - inicializar drops se necessário
                                        if (!updated[exIndex].sets[setIndex].drops || updated[exIndex].sets[setIndex].drops.length === 0) {
                                          updated[exIndex].sets[setIndex].drops = [{ weight: undefined, reps: undefined, restTime: undefined }];
                                        }
                                      } else {
                                        // Desativando - limpar drops
                                        updated[exIndex].sets[setIndex].drops = [];
                                        if (updated[exIndex].sets[setIndex].setType === 'drop') {
                                          updated[exIndex].sets[setIndex].setType = 'working';
                                        }
                                      }
                                      setCurrentExercises(updated);
                                    }}
                                  >
                                    Drop Set
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={set.isRestPause || set.setType === 'rest_pause' ? 'default' : 'outline'}
                                    className={`h-7 text-xs ${set.isRestPause || set.setType === 'rest_pause' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/30'}`}
                                    onClick={() => {
                                      const updated = [...currentExercises];
                                      const isActive = updated[exIndex].sets[setIndex].isRestPause || updated[exIndex].sets[setIndex].setType === 'rest_pause';
                                      updated[exIndex].sets[setIndex].isRestPause = !isActive;
                                      if (!isActive) {
                                        // Ativando - inicializar restPauses se necessário
                                        if (!updated[exIndex].sets[setIndex].restPauses || updated[exIndex].sets[setIndex].restPauses.length === 0) {
                                          updated[exIndex].sets[setIndex].restPauses = [{ pauseTime: 15, weight: undefined, reps: undefined }];
                                        }
                                      } else {
                                        // Desativando - limpar restPauses
                                        updated[exIndex].sets[setIndex].restPauses = [];
                                        if (updated[exIndex].sets[setIndex].setType === 'rest_pause') {
                                          updated[exIndex].sets[setIndex].setType = 'working';
                                        }
                                      }
                                      setCurrentExercises(updated);
                                    }}
                                  >
                                    Rest-Pause
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
            </div>
            
            <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
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
        
        {/* Modal: Novo Cardio */}
        <Dialog open={showCardioModal} onOpenChange={setShowCardioModal}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader className="pb-2">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <Heart className="h-5 w-5 text-red-500" />
                Novo Registro de Cardio
              </DialogTitle>
              <DialogDescription className="text-sm">
                Registre uma atividade cardiovascular do aluno
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Aluno e Data - Responsivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">Aluno *</Label>
                  <Select 
                    value={cardioForm.studentId.toString()} 
                    onValueChange={(v) => setCardioForm({ ...cardioForm, studentId: parseInt(v) })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map((s: any) => (
                        <SelectItem key={s.id} value={s.id.toString()}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm">Data *</Label>
                  <Input
                    type="date"
                    className="h-10"
                    value={cardioForm.cardioDate}
                    onChange={(e) => setCardioForm({ ...cardioForm, cardioDate: e.target.value })}
                  />
                </div>
              </div>
              
              {/* Tipo de Cardio */}
              <div>
                <Label className="text-sm">Tipo de Cardio *</Label>
                <Select 
                  value={cardioForm.cardioType} 
                  onValueChange={(v) => setCardioForm({ ...cardioForm, cardioType: v })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARDIO_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {cardioForm.cardioType === 'other' && (
                  <Input
                    className="mt-2 h-10"
                    placeholder="Nome do cardio (ex: Patinação)"
                    value={cardioForm.cardioTypeName}
                    onChange={(e) => setCardioForm({ ...cardioForm, cardioTypeName: e.target.value })}
                  />
                )}
              </div>
              
              {/* Métricas Principais - Grid 3 colunas */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Duração (min) *</Label>
                  <Input
                    type="number"
                    className="h-10 text-center"
                    placeholder="30"
                    value={cardioForm.durationMinutes || ''}
                    onChange={(e) => setCardioForm({ ...cardioForm, durationMinutes: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Distância (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    className="h-10 text-center"
                    placeholder="5.0"
                    value={cardioForm.distanceKm}
                    onChange={(e) => setCardioForm({ ...cardioForm, distanceKm: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Calorias</Label>
                  <Input
                    type="number"
                    className="h-10 text-center"
                    placeholder="300"
                    value={cardioForm.caloriesBurned || ''}
                    onChange={(e) => setCardioForm({ ...cardioForm, caloriesBurned: parseInt(e.target.value) || undefined })}
                  />
                </div>
              </div>
              
              {/* Frequência Cardíaca - Card compacto */}
              <div className="bg-muted/30 rounded-lg p-3">
                <Label className="flex items-center gap-2 text-sm mb-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Frequência Cardíaca
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Média</Label>
                    <Input
                      type="number"
                      className="h-9 text-center text-sm"
                      placeholder="140"
                      value={cardioForm.avgHeartRate || ''}
                      onChange={(e) => setCardioForm({ ...cardioForm, avgHeartRate: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Máxima</Label>
                    <Input
                      type="number"
                      className="h-9 text-center text-sm"
                      placeholder="170"
                      value={cardioForm.maxHeartRate || ''}
                      onChange={(e) => setCardioForm({ ...cardioForm, maxHeartRate: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Mínima</Label>
                    <Input
                      type="number"
                      className="h-9 text-center text-sm"
                      placeholder="110"
                      value={cardioForm.minHeartRate || ''}
                      onChange={(e) => setCardioForm({ ...cardioForm, minHeartRate: parseInt(e.target.value) || undefined })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Intensidade - Botões compactos */}
              <div>
                <Label className="text-sm">Intensidade</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {CARDIO_INTENSITIES.map((intensity) => (
                    <Button
                      key={intensity.value}
                      type="button"
                      variant={cardioForm.intensity === intensity.value ? "default" : "outline"}
                      size="sm"
                      className={`h-8 px-3 text-xs ${cardioForm.intensity === intensity.value ? intensity.color : ""}`}
                      onClick={() => setCardioForm({ ...cardioForm, intensity: intensity.value })}
                    >
                      {intensity.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Sensações - Layout compacto lado a lado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Antes</Label>
                  <div className="flex gap-1 mt-1">
                    {CARDIO_FEELINGS.map((feeling) => (
                      <Button
                        key={feeling.value}
                        type="button"
                        variant={cardioForm.feelingBefore === feeling.value ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCardioForm({ ...cardioForm, feelingBefore: feeling.value })}
                      >
                        {feeling.emoji}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Depois</Label>
                  <div className="flex gap-1 mt-1">
                    {CARDIO_FEELINGS.map((feeling) => (
                      <Button
                        key={feeling.value}
                        type="button"
                        variant={cardioForm.feelingAfter === feeling.value ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => setCardioForm({ ...cardioForm, feelingAfter: feeling.value })}
                      >
                        {feeling.emoji}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Clima e Local - Compacto */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Clima/Ambiente</Label>
                  <Select 
                    value={cardioForm.weather} 
                    onValueChange={(v) => setCardioForm({ ...cardioForm, weather: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEATHER_OPTIONS.map((w) => (
                        <SelectItem key={w.value} value={w.value}>
                          {w.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Local</Label>
                  <Input
                    className="h-9"
                    placeholder="Ex: Academia"
                    value={cardioForm.location}
                    onChange={(e) => setCardioForm({ ...cardioForm, location: e.target.value })}
                  />
                </div>
              </div>
              
              {/* Observações - Compacto */}
              <div>
                <Label className="text-xs text-muted-foreground">Observações</Label>
                <Textarea
                  className="min-h-[60px] text-sm"
                  placeholder="Anotações sobre o treino..."
                  value={cardioForm.notes}
                  onChange={(e) => setCardioForm({ ...cardioForm, notes: e.target.value })}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCardioModal(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (!cardioForm.studentId || !cardioForm.cardioType || !cardioForm.durationMinutes) {
                    toast.error("Preencha os campos obrigatórios");
                    return;
                  }
                  createCardio.mutate({
                    studentId: cardioForm.studentId,
                    cardioDate: cardioForm.cardioDate,
                    cardioType: cardioForm.cardioType as any,
                    cardioTypeName: cardioForm.cardioTypeName || undefined,
                    durationMinutes: cardioForm.durationMinutes,
                    distanceKm: cardioForm.distanceKm || undefined,
                    caloriesBurned: cardioForm.caloriesBurned,
                    avgHeartRate: cardioForm.avgHeartRate,
                    maxHeartRate: cardioForm.maxHeartRate,
                    minHeartRate: cardioForm.minHeartRate,
                    intensity: cardioForm.intensity as any || undefined,
                    feelingBefore: cardioForm.feelingBefore as any || undefined,
                    feelingAfter: cardioForm.feelingAfter as any || undefined,
                    weather: cardioForm.weather as any || undefined,
                    location: cardioForm.location || undefined,
                    notes: cardioForm.notes || undefined,
                  });
                }}
                disabled={createCardio.isPending}
              >
                {createCardio.isPending ? "Salvando..." : "Salvar Cardio"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Modal: Detalhe do Cardio */}
        <Dialog open={showCardioDetailModal} onOpenChange={setShowCardioDetailModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                Detalhes do Cardio
              </DialogTitle>
            </DialogHeader>
            
            {cardioDetail && (
              <div className="space-y-6">
                {/* Informações básicas */}
                <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Heart className="h-8 w-8 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {students?.find((s: any) => s.id === cardioDetail.studentId)?.name || 'Aluno'}
                    </h3>
                    <p className="text-muted-foreground">
                      {CARDIO_TYPES.find(t => t.value === cardioDetail.cardioType)?.label || cardioDetail.cardioType}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(cardioDetail.cardioDate)}
                    </p>
                  </div>
                </div>
                
                {/* Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <Timer className="h-5 w-5 mx-auto text-primary mb-1" />
                    <p className="text-xl font-bold">{cardioDetail.durationMinutes}min</p>
                    <p className="text-xs text-muted-foreground">Duração</p>
                  </div>
                  {cardioDetail.distanceKm && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <Footprints className="h-5 w-5 mx-auto text-primary mb-1" />
                      <p className="text-xl font-bold">{parseFloat(cardioDetail.distanceKm).toFixed(1)}km</p>
                      <p className="text-xs text-muted-foreground">Distância</p>
                    </div>
                  )}
                  {cardioDetail.caloriesBurned && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <Flame className="h-5 w-5 mx-auto text-orange-500 mb-1" />
                      <p className="text-xl font-bold">{cardioDetail.caloriesBurned}</p>
                      <p className="text-xs text-muted-foreground">Calorias</p>
                    </div>
                  )}
                  {cardioDetail.avgHeartRate && (
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                      <Heart className="h-5 w-5 mx-auto text-red-500 mb-1" />
                      <p className="text-xl font-bold">{cardioDetail.avgHeartRate}bpm</p>
                      <p className="text-xs text-muted-foreground">FC Média</p>
                    </div>
                  )}
                </div>
                
                {/* Detalhes adicionais */}
                {(cardioDetail.intensity || cardioDetail.feelingBefore || cardioDetail.feelingAfter) && (
                  <div className="space-y-3">
                    {cardioDetail.intensity && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Intensidade:</span>
                        <Badge className={CARDIO_INTENSITIES.find(i => i.value === cardioDetail.intensity)?.color}>
                          {CARDIO_INTENSITIES.find(i => i.value === cardioDetail.intensity)?.label}
                        </Badge>
                      </div>
                    )}
                    {cardioDetail.feelingBefore && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Sensação antes:</span>
                        <span>{CARDIO_FEELINGS.find(f => f.value === cardioDetail.feelingBefore)?.emoji} {CARDIO_FEELINGS.find(f => f.value === cardioDetail.feelingBefore)?.label}</span>
                      </div>
                    )}
                    {cardioDetail.feelingAfter && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Sensação depois:</span>
                        <span>{CARDIO_FEELINGS.find(f => f.value === cardioDetail.feelingAfter)?.emoji} {CARDIO_FEELINGS.find(f => f.value === cardioDetail.feelingAfter)?.label}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Notas */}
                {cardioDetail.notes && (
                  <div>
                    <Label className="text-muted-foreground">Observações</Label>
                    <p className="mt-1 p-3 bg-muted/50 rounded-lg">{cardioDetail.notes}</p>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (selectedCardioId && confirm("Tem certeza que deseja excluir este registro?")) {
                    deleteCardio.mutate({ id: selectedCardioId });
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
              <Button variant="outline" onClick={() => setShowCardioDetailModal(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Modal de Substituição de Exercício */}
        <ExerciseSubstitutionModal
          isOpen={showSubstitutionModal}
          onClose={() => {
            setShowSubstitutionModal(false);
            setSubstitutingExerciseIndex(null);
          }}
          currentExerciseName={substitutingExerciseIndex !== null ? currentExercises[substitutingExerciseIndex]?.exerciseName || '' : ''}
          currentMuscleGroup={substitutingExerciseIndex !== null ? currentExercises[substitutingExerciseIndex]?.muscleGroup : undefined}
          onSubstitute={handleExerciseSubstitution}
        />
      </div>
    </DashboardLayout>
  );
}

// Componente de Estatísticas de Cardio
function CardioStatsTab({ studentId }: { studentId: string }) {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30");
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("day");
  
  // Calcular datas baseado no período
  const endDate = getLocalDateString(new Date());
  const startDate = (() => {
    const date = new Date();
    date.setDate(date.getDate() - parseInt(period));
    return getLocalDateString(date);
  })();
  
  // Buscar dados de evolução
  const { data: evolutionData, isLoading: loadingEvolution } = trpc.cardio.evolution.useQuery(
    { 
      studentId: parseInt(studentId), 
      startDate, 
      endDate, 
      groupBy 
    },
    { enabled: !!studentId && !!user }
  );
  
  // Buscar comparação de períodos
  const { data: comparisonData } = trpc.cardio.comparison.useQuery(
    {
      studentId: parseInt(studentId),
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      previousPeriodStart: (() => {
        const date = new Date();
        date.setDate(date.getDate() - parseInt(period) * 2);
        return getLocalDateString(date);
      })(),
      previousPeriodEnd: startDate
    },
    { enabled: !!studentId && !!user }
  );
  
  // Buscar estatísticas por tipo
  const { data: typeStats } = trpc.cardio.byType.useQuery(
    { studentId: parseInt(studentId), startDate, endDate },
    { enabled: !!studentId && !!user }
  );
  
  // Mutation para exportar PDF (deve estar antes de qualquer early return)
  const exportPDFMutation = trpc.cardio.exportPDF.useMutation({
    onSuccess: (data) => {
      // Criar blob e fazer download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Criar link de download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF exportado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao exportar PDF: ' + error.message);
    },
  });
  
  const handleExportPDF = () => {
    exportPDFMutation.mutate({
      studentId: parseInt(studentId),
      period: parseInt(period),
      groupBy,
    });
  };
  
  if (!studentId) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">Selecione um Aluno</h3>
          <p className="text-muted-foreground">
            Escolha um aluno no filtro acima para ver as estatísticas de cardio.
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (loadingEvolution) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Preparar dados para gráficos
  const distanceData = evolutionData?.map((d: any) => ({ date: d.date, value: d.totalDistance || 0 })) || [];
  const durationData = evolutionData?.map((d: any) => ({ date: d.date, value: d.totalDuration || 0 })) || [];
  const heartRateData = evolutionData?.filter((d: any) => d.avgHeartRate > 0).map((d: any) => ({ date: d.date, value: d.avgHeartRate || 0 })) || [];
  const sessionsData = evolutionData?.map((d: any) => ({ date: d.date, value: d.sessionCount || 0 })) || [];
  
  // Calcular totais
  const totals = evolutionData?.reduce((acc: any, d: any) => ({
    sessions: acc.sessions + (d.sessionCount || 0),
    duration: acc.duration + (d.totalDuration || 0),
    distance: acc.distance + (d.totalDistance || 0),
    calories: acc.calories + (d.totalCalories || 0),
  }), { sessions: 0, duration: 0, distance: 0, calories: 0 }) || { sessions: 0, duration: 0, distance: 0, calories: 0 };
  
  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="14">Últimos 14 dias</SelectItem>
            <SelectItem value="30">Último mês</SelectItem>
            <SelectItem value="90">Últimos 3 meses</SelectItem>
            <SelectItem value="180">Últimos 6 meses</SelectItem>
            <SelectItem value="365">Último ano</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={groupBy} onValueChange={(v) => setGroupBy(v as "day" | "week" | "month")}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Agrupar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Por dia</SelectItem>
            <SelectItem value="week">Por semana</SelectItem>
            <SelectItem value="month">Por mês</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex-1" />
        
        <Button
          variant="outline"
          onClick={handleExportPDF}
          disabled={exportPDFMutation.isPending || !evolutionData || evolutionData.length === 0}
          className="gap-2"
        >
          <FileText className="h-4 w-4" />
          {exportPDFMutation.isPending ? 'Gerando PDF...' : 'Exportar PDF'}
        </Button>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="h-4 w-4" />
              <span className="text-sm">Sessões</span>
            </div>
            <p className="text-2xl font-bold">{totals.sessions}</p>
            {comparisonData?.changes?.sessionCount !== undefined && (
              <p className={`text-xs ${comparisonData.changes.sessionCount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {comparisonData.changes.sessionCount >= 0 ? '↑' : '↓'} {Math.abs(comparisonData.changes.sessionCount)}% vs período anterior
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Timer className="h-4 w-4" />
              <span className="text-sm">Tempo Total</span>
            </div>
            <p className="text-2xl font-bold">
              {totals.duration >= 60 
                ? `${Math.floor(totals.duration / 60)}h ${totals.duration % 60}min`
                : `${totals.duration}min`
              }
            </p>
            {comparisonData?.changes?.totalDuration !== undefined && (
              <p className={`text-xs ${comparisonData.changes.totalDuration >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {comparisonData.changes.totalDuration >= 0 ? '↑' : '↓'} {Math.abs(comparisonData.changes.totalDuration)}% vs período anterior
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Footprints className="h-4 w-4" />
              <span className="text-sm">Distância</span>
            </div>
            <p className="text-2xl font-bold">{totals.distance.toFixed(1)} km</p>
            {comparisonData?.changes?.totalDistance !== undefined && (
              <p className={`text-xs ${comparisonData.changes.totalDistance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {comparisonData.changes.totalDistance >= 0 ? '↑' : '↓'} {Math.abs(comparisonData.changes.totalDistance)}% vs período anterior
              </p>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Flame className="h-4 w-4" />
              <span className="text-sm">Calorias</span>
            </div>
            <p className="text-2xl font-bold">{totals.calories.toLocaleString('pt-BR')}</p>
            {comparisonData?.changes?.totalCalories !== undefined && (
              <p className={`text-xs ${comparisonData.changes.totalCalories >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {comparisonData.changes.totalCalories >= 0 ? '↑' : '↓'} {Math.abs(comparisonData.changes.totalCalories)}% vs período anterior
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Gráficos de Evolução */}
      {evolutionData && evolutionData.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Gráfico de Distância */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Footprints className="h-4 w-4 text-green-500" />
                Evolução da Distância
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={distanceData} color="green" unit="km" />
            </CardContent>
          </Card>
          
          {/* Gráfico de Tempo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-500" />
                Evolução do Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleLineChart data={durationData} color="blue" unit="min" />
            </CardContent>
          </Card>
          
          {/* Gráfico de Frequência Cardíaca */}
          {heartRateData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Frequência Cardíaca Média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleLineChart data={heartRateData} color="red" unit="bpm" />
              </CardContent>
            </Card>
          )}
          
          {/* Gráfico de Sessões */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                Frequência de Treinos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={sessionsData} color="purple" />
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Sem dados de cardio</h3>
            <p className="text-muted-foreground">
              Não há registros de cardio para este aluno no período selecionado.
            </p>
          </CardContent>
        </Card>
      )}
      
      {/* Distribuição por Tipo */}
      {typeStats && typeStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Distribuição por Tipo de Cardio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {typeStats.map((stat: any) => {
                const cardioType = CARDIO_TYPES.find(t => t.value === stat.type);
                const maxDuration = Math.max(...typeStats.map((s: any) => s.totalDuration));
                const percentage = maxDuration > 0 ? (stat.totalDuration / maxDuration) * 100 : 0;
                return (
                  <div key={stat.type} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cardioType?.label || stat.type}</span>
                      <span className="text-muted-foreground">
                        {stat.sessionCount} sessões · {stat.totalDuration}min · {stat.totalDistance?.toFixed(1) || 0}km
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente de gráfico de linha simples
function SimpleLineChart({ data, color, unit }: { data: { date: string; value: number }[]; color: string; unit: string }) {
  if (data.length === 0) {
    return <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>;
  }
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 80 - 10;
    return { x, y, value: d.value, date: d.date };
  });
  
  const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPoints = `0,100 ${linePoints} 100,100`;
  
  const colorMap: Record<string, { stroke: string; fill: string }> = {
    green: { stroke: "stroke-green-500", fill: "fill-green-500/20" },
    blue: { stroke: "stroke-blue-500", fill: "fill-blue-500/20" },
    red: { stroke: "stroke-red-500", fill: "fill-red-500/20" },
    purple: { stroke: "stroke-purple-500", fill: "fill-purple-500/20" },
  };
  
  const colors = colorMap[color] || colorMap.green;
  
  return (
    <div className="relative">
      <div className="h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points={areaPoints} className={colors.fill} />
          <polyline points={linePoints} fill="none" className={colors.stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2" className={colors.stroke.replace('stroke', 'fill')} vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
      <div className="absolute left-0 top-0 h-32 flex flex-col justify-between text-xs text-muted-foreground">
        <span>{maxValue.toFixed(unit === 'km' ? 1 : 0)}{unit}</span>
        <span>{minValue.toFixed(unit === 'km' ? 1 : 0)}{unit}</span>
      </div>
    </div>
  );
}

// Componente de gráfico de barras simples
function SimpleBarChart({ data, color }: { data: { date: string; value: number }[]; color: string }) {
  if (data.length === 0) {
    return <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">Sem dados</div>;
  }
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  const colorMap: Record<string, string> = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };
  
  const barColor = colorMap[color] || colorMap.green;
  
  return (
    <div>
      <div className="h-32 flex items-end gap-1">
        {data.map((d, i) => {
          const height = maxValue > 0 ? (d.value / maxValue) * 100 : 0;
          return (
            <div 
              key={i} 
              className="flex-1 flex flex-col items-center justify-end"
              title={`${d.date}: ${d.value}`}
            >
              <span className="text-[10px] text-muted-foreground mb-1">{d.value}</span>
              <div 
                className={`w-full ${barColor} rounded-t transition-all duration-300`}
                style={{ height: `${Math.max(height, 5)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>{data[0]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
