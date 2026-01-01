import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Camera, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Loader2,
  ArrowLeftRight,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Dumbbell,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  Scale,
  Ruler,
  ZoomIn,
  Plus,
  History,
  FileText
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format, differenceInDays, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const POSE_NAMES: Record<string, string> = {
  'frontal-relaxado': 'Frontal Relaxado',
  'frontal-contraido': 'Frontal Contraído',
  'lateral-esquerda': 'Lateral Esquerda',
  'lateral-direita': 'Lateral Direita',
  'costas-relaxado': 'Costas Relaxado',
  'costas-contraido': 'Costas Contraído',
  'biceps-direito': 'Bíceps Direito',
  'biceps-esquerdo': 'Bíceps Esquerdo',
  'perna-direita-relaxada': 'Perna Direita Relaxada',
  'perna-direita-contraida': 'Perna Direita Contraída',
  'perna-esquerda-relaxada': 'Perna Esquerda Relaxada',
  'perna-esquerda-contraida': 'Perna Esquerda Contraída',
};

interface Photo {
  id: number;
  url: string;
  photoDate?: Date | string;
  createdAt: Date | string;
  notes?: string | null;
  category?: string | null;
}

interface Measurement {
  id: number;
  measureDate: Date | string;
  weight?: string | null;
  bodyFat?: string | null;
  chest?: string | null;
  waist?: string | null;
  hip?: string | null;
  rightArm?: string | null;
  leftArm?: string | null;
  rightThigh?: string | null;
  leftThigh?: string | null;
  [key: string]: any;
}

interface UnifiedEvolutionDashboardProps {
  studentId: number;
  studentName: string;
  photos?: Photo[];
  measurements?: Measurement[];
  onRefresh?: () => void;
  showStudentSelector?: boolean; // Para a página do menu lateral
  embedded?: boolean; // Para quando está embutido no perfil do aluno
}

export function UnifiedEvolutionDashboard({ 
  studentId, 
  studentName,
  photos = [],
  measurements = [],
  onRefresh,
  showStudentSelector = false,
  embedded = false
}: UnifiedEvolutionDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "photos" | "measurements" | "training">("overview");
  const [period, setPeriod] = useState<string>("month");
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [exerciseSearchFilter, setExerciseSearchFilter] = useState<string>("");
  const [chartType, setChartType] = useState<string>("line");
  
  // Estados para comparação de fotos
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<{ before: Photo | null; after: Photo | null }>({ before: null, after: null });
  const [sliderPosition, setSliderPosition] = useState(50);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  // Estados para modais de adição
  const [showNewMeasurementModal, setShowNewMeasurementModal] = useState(false);
  const [showNewPhotoModal, setShowNewPhotoModal] = useState(false);
  const [showAnalysisHistoryModal, setShowAnalysisHistoryModal] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({
    weight: '',
    bodyFat: '',
    chest: '',
    waist: '',
    hip: '',
    rightArm: '',
    leftArm: '',
    rightThigh: '',
    leftThigh: '',
  });

  // Queries para treinos
  const { data: uniqueExercises } = trpc.trainingDiary.uniqueExercises.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  const { data: exerciseProgress } = trpc.trainingDiary.exerciseProgress.useQuery(
    { studentId, exerciseName: selectedExercise, limit: 50 },
    { enabled: !!selectedExercise && !!studentId }
  );

  const { data: muscleGroupAnalysis } = trpc.trainingDiary.muscleGroupAnalysis.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  // Mutation para análise de fotos
  const analyzeMutation = trpc.anamnesis.analyzeEvolution.useMutation({
    onSuccess: (data) => {
      const analysisText = typeof data.analysis === 'string' ? data.analysis : String(data.analysis);
      setAnalysisResult(analysisText);
      toast.success("Análise concluída!");
      onRefresh?.();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao analisar evolução");
    }
  });

  // Mutation para criar nova medida
  const createMeasurementMutation = trpc.measurements.create.useMutation({
    onSuccess: () => {
      toast.success("Medida registrada com sucesso!");
      setShowNewMeasurementModal(false);
      setNewMeasurement({
        weight: '', bodyFat: '', chest: '', waist: '', hip: '',
        rightArm: '', leftArm: '', rightThigh: '', leftThigh: '',
      });
      onRefresh?.();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao registrar medida");
    }
  });

  // Query para histórico de análises
  const { data: analysisHistory } = trpc.photos.getAnalyses.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  // Exercícios filtrados
  const filteredExercises = useMemo(() => {
    if (!uniqueExercises) return [];
    return uniqueExercises
      .filter(name => name.toLowerCase().includes(exerciseSearchFilter.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [uniqueExercises, exerciseSearchFilter]);

  // Filtrar dados por período
  const filteredProgress = useMemo(() => {
    if (!exerciseProgress) return [];
    const now = new Date();
    return exerciseProgress.filter((item: any) => {
      const itemDate = new Date(item.date);
      const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      switch (period) {
        case 'week': return diffDays <= 7;
        case 'month': return diffDays <= 30;
        case '3months': return diffDays <= 90;
        case '6months': return diffDays <= 180;
        case 'year': return diffDays <= 365;
        default: return true;
      }
    }).slice().reverse();
  }, [exerciseProgress, period]);

  // Dados para gráficos de treino
  const chartData = useMemo(() => {
    return filteredProgress.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      fullDate: new Date(item.date).toLocaleDateString('pt-BR'),
      carga: item.maxWeight || 0,
      volume: item.totalVolume || 0,
      reps: item.totalReps || 0,
      series: item.totalSets || 0,
    }));
  }, [filteredProgress]);

  // Dados para gráfico de pizza
  const muscleGroupData = useMemo(() => {
    if (!muscleGroupAnalysis) return [];
    return muscleGroupAnalysis.map((group: any) => ({
      name: group.muscleGroup,
      value: group.totalSets,
      exercises: group.exerciseCount,
    }));
  }, [muscleGroupAnalysis]);

  // Estatísticas de treino
  const trainingStats = useMemo(() => {
    if (filteredProgress.length === 0) return null;
    const weights = filteredProgress.map((i: any) => i.maxWeight || 0);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const totalVolume = filteredProgress.reduce((sum: number, i: any) => sum + (i.totalVolume || 0), 0);
    const totalReps = filteredProgress.reduce((sum: number, i: any) => sum + (i.totalReps || 0), 0);
    
    const half = Math.floor(weights.length / 2);
    const firstHalfAvg = weights.slice(0, half).reduce((a, b) => a + b, 0) / (half || 1);
    const secondHalfAvg = weights.slice(half).reduce((a, b) => a + b, 0) / ((weights.length - half) || 1);
    const trend = secondHalfAvg > firstHalfAvg ? 'up' : secondHalfAvg < firstHalfAvg ? 'down' : 'stable';
    
    return { maxWeight, minWeight, avgWeight, totalVolume, totalReps, trend, count: filteredProgress.length };
  }, [filteredProgress]);

  // Organizar fotos por pose
  const photosByPose = useMemo(() => {
    const grouped: Record<string, Photo[]> = {};
    photos.forEach(photo => {
      const poseMatch = photo.notes?.match(/^pose:(.+)$/);
      const poseId = poseMatch ? poseMatch[1] : 'geral';
      if (!grouped[poseId]) grouped[poseId] = [];
      grouped[poseId].push(photo);
    });
    Object.keys(grouped).forEach(poseId => {
      grouped[poseId].sort((a, b) => {
        const dateA = new Date(a.photoDate || a.createdAt).getTime();
        const dateB = new Date(b.photoDate || b.createdAt).getTime();
        return dateB - dateA;
      });
    });
    return grouped;
  }, [photos]);

  // Estatísticas de fotos
  const photoStats = useMemo(() => {
    if (photos.length === 0) return null;
    const sortedPhotos = [...photos].sort((a, b) => {
      const dateA = new Date(a.photoDate || a.createdAt).getTime();
      const dateB = new Date(b.photoDate || b.createdAt).getTime();
      return dateA - dateB;
    });
    const firstPhoto = sortedPhotos[0];
    const lastPhoto = sortedPhotos[sortedPhotos.length - 1];
    const firstDate = new Date(firstPhoto.photoDate || firstPhoto.createdAt);
    const lastDate = new Date(lastPhoto.photoDate || lastPhoto.createdAt);
    return {
      totalPhotos: photos.length,
      posesCount: Object.keys(photosByPose).filter(k => k !== 'geral').length,
      daysBetween: differenceInDays(lastDate, firstDate),
      monthsBetween: differenceInMonths(lastDate, firstDate),
      firstDate,
      lastDate,
    };
  }, [photos, photosByPose]);

  // Dados de medidas para gráficos
  const measurementsChartData = useMemo(() => {
    if (measurements.length === 0) return [];
    const sorted = [...measurements].sort((a, b) => 
      new Date(a.measureDate).getTime() - new Date(b.measureDate).getTime()
    );
    return sorted.map(m => ({
      date: format(new Date(m.measureDate), 'dd/MM'),
      fullDate: format(new Date(m.measureDate), 'dd/MM/yyyy'),
      peso: m.weight ? parseFloat(m.weight) : null,
      gordura: m.bodyFat ? parseFloat(m.bodyFat) : null,
      peito: m.chest ? parseFloat(m.chest) : null,
      cintura: m.waist ? parseFloat(m.waist) : null,
      braco: m.rightArm ? parseFloat(m.rightArm) : null,
      coxa: m.rightThigh ? parseFloat(m.rightThigh) : null,
    }));
  }, [measurements]);

  // Diferença de medidas
  const measurementsDiff = useMemo(() => {
    if (measurements.length < 2) return null;
    const sorted = [...measurements].sort((a, b) => 
      new Date(a.measureDate).getTime() - new Date(b.measureDate).getTime()
    );
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const toNum = (v: string | null | undefined) => v ? parseFloat(v) : null;
    const diff = (before: number | null | undefined, after: number | null | undefined) => {
      if (before == null || after == null) return null;
      return {
        before,
        after,
        change: after - before,
        changePercent: ((after - before) / before * 100).toFixed(1)
      };
    };
    return {
      weight: diff(toNum(first.weight), toNum(last.weight)),
      bodyFat: diff(toNum(first.bodyFat), toNum(last.bodyFat)),
      chest: diff(toNum(first.chest), toNum(last.chest)),
      waist: diff(toNum(first.waist), toNum(last.waist)),
      arm: diff(toNum(first.rightArm), toNum(last.rightArm)),
      thigh: diff(toNum(first.rightThigh), toNum(last.rightThigh)),
    };
  }, [measurements]);

  const handlePhotoClick = (photo: Photo) => {
    if (compareMode) {
      if (!comparePhotos.before) {
        setComparePhotos({ before: photo, after: null });
      } else if (!comparePhotos.after && photo.id !== comparePhotos.before.id) {
        const beforeDate = new Date(comparePhotos.before.photoDate || comparePhotos.before.createdAt);
        const afterDate = new Date(photo.photoDate || photo.createdAt);
        if (beforeDate > afterDate) {
          setComparePhotos({ before: photo, after: comparePhotos.before });
        } else {
          setComparePhotos({ ...comparePhotos, after: photo });
        }
      }
    } else {
      setSelectedPhoto(photo);
    }
  };

  const handleAnalyze = () => {
    if (!comparePhotos.before || !comparePhotos.after) return;
    analyzeMutation.mutate({
      studentId,
      beforePhotoUrl: comparePhotos.before.url,
      afterPhotoUrl: comparePhotos.after.url,
    });
  };

  const cancelComparison = () => {
    setCompareMode(false);
    setComparePhotos({ before: null, after: null });
    setAnalysisResult(null);
  };

  const renderTrainingChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <TrendingUp className="h-12 w-12 mb-2 opacity-50" />
          <p>Selecione um exercício para ver a evolução</p>
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Line type="monotone" dataKey="carga" name="Carga (kg)" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Bar dataKey="carga" name="Carga (kg)" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'volume':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Bar dataKey="volume" name="Volume (kg×reps)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Evolução de {studentName}
            </h2>
            <p className="text-sm text-muted-foreground">
              Acompanhamento completo: fotos, medidas e treinos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewPhotoModal(true)}>
              <Camera className="h-4 w-4 mr-2" />
              Nova Foto
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowNewMeasurementModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Medida
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAnalysisHistoryModal(true)}>
              <History className="h-4 w-4 mr-2" />
              Histórico
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-1">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Fotos</span>
          </TabsTrigger>
          <TabsTrigger value="measurements" className="flex items-center gap-1">
            <Scale className="h-4 w-4" />
            <span className="hidden sm:inline">Medidas</span>
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-1">
            <Dumbbell className="h-4 w-4" />
            <span className="hidden sm:inline">Treinos</span>
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <Camera className="h-6 w-6 mx-auto text-emerald-600 mb-1" />
                <p className="text-2xl font-bold">{photos.length}</p>
                <p className="text-xs text-muted-foreground">Fotos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Scale className="h-6 w-6 mx-auto text-blue-600 mb-1" />
                <p className="text-2xl font-bold">{measurements.length}</p>
                <p className="text-xs text-muted-foreground">Medições</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Dumbbell className="h-6 w-6 mx-auto text-purple-600 mb-1" />
                <p className="text-2xl font-bold">{uniqueExercises?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Exercícios</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Calendar className="h-6 w-6 mx-auto text-orange-600 mb-1" />
                <p className="text-2xl font-bold">{photoStats?.daysBetween || 0}</p>
                <p className="text-xs text-muted-foreground">Dias</p>
              </CardContent>
            </Card>
          </div>

          {/* Resumo de Medidas */}
          {measurementsDiff && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Scale className="h-4 w-4 text-blue-600" />
                  Evolução das Medidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { key: 'weight', label: 'Peso', unit: 'kg', invertGood: true },
                    { key: 'bodyFat', label: 'Gordura', unit: '%', invertGood: true },
                    { key: 'chest', label: 'Peito', unit: 'cm', invertGood: false },
                    { key: 'waist', label: 'Cintura', unit: 'cm', invertGood: true },
                    { key: 'arm', label: 'Braço', unit: 'cm', invertGood: false },
                    { key: 'thigh', label: 'Coxa', unit: 'cm', invertGood: false },
                  ].map(({ key, label, unit, invertGood }) => {
                    const data = measurementsDiff[key as keyof typeof measurementsDiff];
                    if (!data) return null;
                    const isGood = invertGood ? data.change < 0 : data.change > 0;
                    const isBad = invertGood ? data.change > 0 : data.change < 0;
                    return (
                      <div key={key} className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className="text-sm font-semibold">{data.after}{unit}</p>
                        <p className={`text-xs font-medium ${isGood ? 'text-emerald-600' : isBad ? 'text-red-500' : 'text-gray-500'}`}>
                          {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}{unit}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Distribuição por Grupo Muscular */}
          {muscleGroupData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-purple-600" />
                  Distribuição por Grupo Muscular
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={muscleGroupData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {muscleGroupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Última foto vs Primeira */}
          {photos.length >= 2 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4 text-emerald-600" />
                  Comparação: Primeira vs Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  {(() => {
                    const sortedPhotos = [...photos].sort((a, b) => 
                      new Date(a.photoDate || a.createdAt).getTime() - new Date(b.photoDate || b.createdAt).getTime()
                    );
                    const firstPhoto = sortedPhotos[0];
                    const lastPhoto = sortedPhotos[sortedPhotos.length - 1];
                    return (
                      <>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Primeira</p>
                          <div className="aspect-[3/4] border rounded-lg overflow-hidden">
                            <img src={firstPhoto.url} alt="Primeira" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(firstPhoto.photoDate || firstPhoto.createdAt), 'dd/MM/yy')}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 mb-1">Atual</p>
                          <div className="aspect-[3/4] border rounded-lg overflow-hidden">
                            <img src={lastPhoto.url} alt="Atual" className="w-full h-full object-cover" />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(lastPhoto.photoDate || lastPhoto.createdAt), 'dd/MM/yy')}
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fotos */}
        <TabsContent value="photos" className="space-y-4">
          {photos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Camera className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma foto de evolução</h3>
                <p className="text-gray-500 text-sm mb-4">
                  {studentName} ainda não enviou fotos de evolução.
                </p>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setShowNewPhotoModal(true)}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Adicionar Primeira Foto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Header com estatísticas */}
              {photoStats && (
                <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
                  <CardContent className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl shadow-sm">
                          <TrendingUp className="h-6 w-6 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Evolução de {studentName}</h3>
                          <p className="text-sm text-gray-600">
                            {photoStats.totalPhotos} fotos • {photoStats.daysBetween} dias de acompanhamento
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowNewPhotoModal(true)}>
                          <Camera className="h-4 w-4 mr-1" />
                          Nova Foto
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowAnalysisHistoryModal(true)}>
                          <History className="h-4 w-4 mr-1" />
                          Histórico
                        </Button>
                        {compareMode ? (
                          <>
                            <Button variant="outline" size="sm" onClick={cancelComparison}>
                              Cancelar
                            </Button>
                            {comparePhotos.before && comparePhotos.after && (
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-700"
                                onClick={handleAnalyze}
                                disabled={analyzeMutation.isPending}
                              >
                                {analyzeMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                  <Sparkles className="h-4 w-4 mr-2" />
                                )}
                                Analisar com IA
                              </Button>
                            )}
                          </>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setCompareMode(true)}
                          >
                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                            Comparar Fotos
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {compareMode && (
                      <div className="mt-4 p-3 bg-white/80 rounded-lg border border-emerald-200">
                        <p className="text-sm text-emerald-700">
                          {!comparePhotos.before 
                            ? "📸 Selecione a primeira foto (antes)" 
                            : !comparePhotos.after 
                              ? "📸 Agora selecione a segunda foto (depois)"
                              : "✅ Fotos selecionadas! Clique em 'Analisar com IA'."
                          }
                        </p>
                      </div>
                    )}
                    
                    {/* Mini stats */}
                    <div className="grid grid-cols-4 gap-3 mt-4">
                      <div className="text-center p-2 bg-white/60 rounded-lg">
                        <p className="text-xl font-bold text-emerald-600">{photoStats.totalPhotos}</p>
                        <p className="text-xs text-gray-500">Fotos</p>
                      </div>
                      <div className="text-center p-2 bg-white/60 rounded-lg">
                        <p className="text-xl font-bold text-blue-600">{photoStats.posesCount}</p>
                        <p className="text-xs text-gray-500">Poses</p>
                      </div>
                      <div className="text-center p-2 bg-white/60 rounded-lg">
                        <p className="text-xl font-bold text-purple-600">{photoStats.daysBetween}</p>
                        <p className="text-xs text-gray-500">Dias</p>
                      </div>
                      <div className="text-center p-2 bg-white/60 rounded-lg">
                        <p className="text-xl font-bold text-orange-600">{measurements.length}</p>
                        <p className="text-xs text-gray-500">Medições</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Fotos por pose */}
              {Object.entries(photosByPose).map(([poseId, posePhotos]) => {
                if (poseId === 'geral') return null;
                return (
                  <Card key={poseId}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{POSE_NAMES[poseId] || poseId}</CardTitle>
                        <Badge variant="secondary">{posePhotos.length} fotos</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {posePhotos.map((photo) => {
                          const isSelected = compareMode && (
                            comparePhotos.before?.id === photo.id || 
                            comparePhotos.after?.id === photo.id
                          );
                          const selectionLabel = comparePhotos.before?.id === photo.id 
                            ? "Antes" 
                            : comparePhotos.after?.id === photo.id 
                              ? "Depois" 
                              : null;
                          return (
                            <div
                              key={photo.id}
                              className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                                isSelected 
                                  ? 'border-emerald-500 ring-2 ring-emerald-200' 
                                  : 'border-transparent hover:border-gray-300'
                              }`}
                              onClick={() => handlePhotoClick(photo)}
                            >
                              <div className="aspect-[3/4]">
                                <img src={photo.url} alt={POSE_NAMES[poseId] || poseId} className="w-full h-full object-cover" />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                                <p className="text-[10px] text-white text-center">
                                  {format(new Date(photo.photoDate || photo.createdAt), 'dd/MM/yy')}
                                </p>
                              </div>
                              {selectionLabel && (
                                <div className="absolute top-1 left-1">
                                  <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500">
                                    {selectionLabel}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Fotos gerais */}
              {photosByPose['geral'] && photosByPose['geral'].length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Outras Fotos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {photosByPose['geral'].map((photo) => (
                        <div
                          key={photo.id}
                          className="relative cursor-pointer rounded-lg overflow-hidden border hover:border-gray-300 transition-all"
                          onClick={() => handlePhotoClick(photo)}
                        >
                          <div className="aspect-square">
                            <img src={photo.url} alt="Foto" className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                            <p className="text-[10px] text-white text-center">
                              {format(new Date(photo.photoDate || photo.createdAt), 'dd/MM/yy')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Medidas */}
        <TabsContent value="measurements" className="space-y-4">
          {/* Botões de ação */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowNewMeasurementModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nova Medida
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAnalysisHistoryModal(true)}>
              <History className="h-4 w-4 mr-1" />
              Histórico de Análises
            </Button>
          </div>
          
          {measurements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Scale className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma medição registrada</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Registre as medidas corporais do aluno para acompanhar a evolução.
                </p>
                <Button onClick={() => setShowNewMeasurementModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Primeira Medida
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Resumo de Medidas */}
              {measurementsDiff && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Scale className="h-4 w-4 text-blue-600" />
                      Evolução das Medidas
                    </CardTitle>
                    <CardDescription>
                      Comparação entre primeira e última medição
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {[
                        { key: 'weight', label: 'Peso', unit: 'kg', invertGood: true },
                        { key: 'bodyFat', label: 'Gordura', unit: '%', invertGood: true },
                        { key: 'chest', label: 'Peito', unit: 'cm', invertGood: false },
                        { key: 'waist', label: 'Cintura', unit: 'cm', invertGood: true },
                        { key: 'arm', label: 'Braço', unit: 'cm', invertGood: false },
                        { key: 'thigh', label: 'Coxa', unit: 'cm', invertGood: false },
                      ].map(({ key, label, unit, invertGood }) => {
                        const data = measurementsDiff[key as keyof typeof measurementsDiff];
                        if (!data) return null;
                        const isGood = invertGood ? data.change < 0 : data.change > 0;
                        const isBad = invertGood ? data.change > 0 : data.change < 0;
                        return (
                          <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                            <p className="text-lg font-semibold">{data.after}{unit}</p>
                            <p className={`text-sm font-medium ${isGood ? 'text-emerald-600' : isBad ? 'text-red-500' : 'text-gray-500'}`}>
                              {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}{unit}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Gráfico de Peso */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Evolução do Peso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={measurementsChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Circunferências */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Evolução das Circunferências
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={measurementsChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Legend />
                      <Line type="monotone" dataKey="peito" name="Peito" stroke="#22c55e" strokeWidth={2} connectNulls />
                      <Line type="monotone" dataKey="cintura" name="Cintura" stroke="#ef4444" strokeWidth={2} connectNulls />
                      <Line type="monotone" dataKey="braco" name="Braço" stroke="#8b5cf6" strokeWidth={2} connectNulls />
                      <Line type="monotone" dataKey="coxa" name="Coxa" stroke="#f59e0b" strokeWidth={2} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Gráfico de Gordura Corporal */}
              {measurementsChartData.some(m => m.gordura !== null) && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Evolução da Gordura Corporal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={measurementsChartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" domain={[0, 'dataMax + 5']} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Area type="monotone" dataKey="gordura" name="Gordura (%)" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} connectNulls />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Treinos */}
        <TabsContent value="training" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="pt-4">
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
                  <Label className="text-sm">Exercício</Label>
                  <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um exercício" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {filteredExercises.length > 0 ? (
                        filteredExercises.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
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
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger>
                      <SelectValue />
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
            </CardContent>
          </Card>

          {/* Estatísticas */}
          {trainingStats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-xl font-bold text-primary">
                    {trainingStats.maxWeight}kg
                    <Target className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-muted-foreground">Recorde</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-xl font-bold">{trainingStats.avgWeight.toFixed(1)}kg</p>
                  <p className="text-xs text-muted-foreground">Média</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-xl font-bold">{trainingStats.minWeight}kg</p>
                  <p className="text-xs text-muted-foreground">Mínimo</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-xl font-bold">{trainingStats.totalVolume.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Volume Total</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <p className="text-xl font-bold">{trainingStats.totalReps}</p>
                  <p className="text-xs text-muted-foreground">Reps Totais</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-xl font-bold">
                    {trainingStats.trend === 'up' && <ArrowUp className="h-4 w-4 text-green-500" />}
                    {trainingStats.trend === 'down' && <ArrowDown className="h-4 w-4 text-red-500" />}
                    {trainingStats.trend === 'stable' && <Minus className="h-4 w-4 text-yellow-500" />}
                    {trainingStats.count}
                  </div>
                  <p className="text-xs text-muted-foreground">Treinos</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Gráfico de Evolução de Carga */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Evolução de Carga
                    {selectedExercise && <span className="text-primary">- {selectedExercise}</span>}
                  </CardTitle>
                  <CardDescription>
                    Visualize a progressão ao longo do tempo
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant={chartType === 'line' ? 'default' : 'outline'} size="sm" onClick={() => setChartType('line')}>
                    <Activity className="h-4 w-4 mr-1" />
                    Linha
                  </Button>
                  <Button variant={chartType === 'bar' ? 'default' : 'outline'} size="sm" onClick={() => setChartType('bar')}>
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Barras
                  </Button>
                  <Button variant={chartType === 'volume' ? 'default' : 'outline'} size="sm" onClick={() => setChartType('volume')}>
                    <Dumbbell className="h-4 w-4 mr-1" />
                    Volume
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {renderTrainingChart()}
            </CardContent>
          </Card>

          {/* Gráficos de Grupos Musculares */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4" />
                  Distribuição por Grupo Muscular
                </CardTitle>
              </CardHeader>
              <CardContent>
                {muscleGroupData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={muscleGroupData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {muscleGroupData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                    <PieChartIcon className="h-12 w-12 mb-2 opacity-50" />
                    <p>Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Séries por Grupo Muscular
                </CardTitle>
              </CardHeader>
              <CardContent>
                {muscleGroupData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={muscleGroupData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" className="text-xs" width={80} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[250px] text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mb-2 opacity-50" />
                    <p>Nenhum dado disponível</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lista de Exercícios */}
          {!selectedExercise && filteredExercises.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Dumbbell className="h-4 w-4" />
                  Exercícios Disponíveis ({filteredExercises.length})
                </CardTitle>
                <CardDescription>
                  Clique em um exercício para ver sua evolução
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                  {filteredExercises.map((name) => (
                    <Button key={name} variant="outline" size="sm" onClick={() => setSelectedExercise(name)}>
                      {name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de visualização de foto */}
      <Dialog open={!!selectedPhoto && !compareMode} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foto de Evolução</DialogTitle>
            {selectedPhoto && (
              <DialogDescription>
                {format(new Date(selectedPhoto.photoDate || selectedPhoto.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </DialogDescription>
            )}
          </DialogHeader>
          {selectedPhoto && (
            <div className="aspect-[3/4] max-h-[60vh] mx-auto">
              <img src={selectedPhoto.url} alt="Foto" className="w-full h-full object-contain rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de comparação */}
      <Dialog 
        open={compareMode && !!comparePhotos.before && !!comparePhotos.after} 
        onOpenChange={() => cancelComparison()}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Comparação de Evolução
            </DialogTitle>
            {comparePhotos.before && comparePhotos.after && (
              <DialogDescription>
                {differenceInDays(
                  new Date(comparePhotos.after.photoDate || comparePhotos.after.createdAt),
                  new Date(comparePhotos.before.photoDate || comparePhotos.before.createdAt)
                )} dias de evolução
              </DialogDescription>
            )}
          </DialogHeader>
          
          {comparePhotos.before && comparePhotos.after && (
            <div className="space-y-4">
              {/* Slider de comparação */}
              <div className="relative aspect-[3/4] max-h-[50vh] mx-auto overflow-hidden rounded-lg">
                <img src={comparePhotos.after.url} alt="Depois" className="absolute inset-0 w-full h-full object-contain bg-gray-100" />
                <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
                  <img src={comparePhotos.before.url} alt="Antes" className="w-full h-full object-contain bg-gray-100" />
                </div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${sliderPosition}%` }}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <ArrowLeftRight className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">Antes</div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-white text-xs">Depois</div>
              </div>
              
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="w-full"
              />
              
              <div className="flex justify-between text-sm text-gray-500">
                <span>{format(new Date(comparePhotos.before.photoDate || comparePhotos.before.createdAt), 'dd/MM/yyyy')}</span>
                <span>{format(new Date(comparePhotos.after.photoDate || comparePhotos.after.createdAt), 'dd/MM/yyyy')}</span>
              </div>
              
              <Button 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending}
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analisando evolução...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analisar Evolução com IA
                  </>
                )}
              </Button>
              
              {analysisResult && (
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg border border-emerald-200 max-h-60 overflow-y-auto">
                  <h5 className="font-medium flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    Análise da Evolução
                  </h5>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {analysisResult}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Medida */}
      <Dialog open={showNewMeasurementModal} onOpenChange={setShowNewMeasurementModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-600" />
              Nova Medição
            </DialogTitle>
            <DialogDescription>
              Registre as medidas corporais de {studentName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="Ex: 75.5"
                value={newMeasurement.weight}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, weight: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="bodyFat">Gordura (%)</Label>
              <Input
                id="bodyFat"
                type="number"
                step="0.1"
                placeholder="Ex: 15.0"
                value={newMeasurement.bodyFat}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, bodyFat: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="chest">Peito (cm)</Label>
              <Input
                id="chest"
                type="number"
                step="0.1"
                placeholder="Ex: 100"
                value={newMeasurement.chest}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, chest: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="waist">Cintura (cm)</Label>
              <Input
                id="waist"
                type="number"
                step="0.1"
                placeholder="Ex: 80"
                value={newMeasurement.waist}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, waist: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="hip">Quadril (cm)</Label>
              <Input
                id="hip"
                type="number"
                step="0.1"
                placeholder="Ex: 95"
                value={newMeasurement.hip}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, hip: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="rightArm">Braço D (cm)</Label>
              <Input
                id="rightArm"
                type="number"
                step="0.1"
                placeholder="Ex: 35"
                value={newMeasurement.rightArm}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, rightArm: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="leftArm">Braço E (cm)</Label>
              <Input
                id="leftArm"
                type="number"
                step="0.1"
                placeholder="Ex: 34"
                value={newMeasurement.leftArm}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, leftArm: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="rightThigh">Coxa D (cm)</Label>
              <Input
                id="rightThigh"
                type="number"
                step="0.1"
                placeholder="Ex: 55"
                value={newMeasurement.rightThigh}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, rightThigh: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="leftThigh">Coxa E (cm)</Label>
              <Input
                id="leftThigh"
                type="number"
                step="0.1"
                placeholder="Ex: 54"
                value={newMeasurement.leftThigh}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, leftThigh: e.target.value }))}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMeasurementModal(false)}>
              Cancelar
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                createMeasurementMutation.mutate({
                  studentId,
                  measureDate: new Date().toISOString().split('T')[0],
                  weight: newMeasurement.weight || undefined,
                  bodyFat: newMeasurement.bodyFat || undefined,
                  chest: newMeasurement.chest || undefined,
                  waist: newMeasurement.waist || undefined,
                  hip: newMeasurement.hip || undefined,
                  rightArm: newMeasurement.rightArm || undefined,
                  leftArm: newMeasurement.leftArm || undefined,
                  rightThigh: newMeasurement.rightThigh || undefined,
                  leftThigh: newMeasurement.leftThigh || undefined,
                });
              }}
              disabled={createMeasurementMutation.isPending}
            >
              {createMeasurementMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</>
              ) : (
                <><Plus className="h-4 w-4 mr-2" />Salvar Medida</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Histórico de Análises */}
      <Dialog open={showAnalysisHistoryModal} onOpenChange={setShowAnalysisHistoryModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-purple-600" />
              Histórico de Análises
            </DialogTitle>
            <DialogDescription>
              Todas as análises de evolução realizadas para {studentName}
            </DialogDescription>
          </DialogHeader>
          
          {!analysisHistory || analysisHistory.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p>Nenhuma análise realizada ainda.</p>
              <p className="text-sm">Compare fotos para gerar uma análise.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analysisHistory.map((analysis: any) => (
                <Card key={analysis.id} className="border-l-4 border-l-purple-500">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-purple-600">
                        {format(new Date(analysis.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </Badge>
                      {analysis.overallScore && (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          Score: {analysis.overallScore}/10
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {analysis.analysisText}
                    </div>
                    {(analysis.muscleGainScore || analysis.fatLossScore || analysis.postureScore) && (
                      <div className="flex gap-4 mt-3 pt-3 border-t">
                        {analysis.muscleGainScore && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Músculo</p>
                            <p className="font-semibold text-emerald-600">{analysis.muscleGainScore}/10</p>
                          </div>
                        )}
                        {analysis.fatLossScore && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Gordura</p>
                            <p className="font-semibold text-blue-600">{analysis.fatLossScore}/10</p>
                          </div>
                        )}
                        {analysis.postureScore && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500">Postura</p>
                            <p className="font-semibold text-purple-600">{analysis.postureScore}/10</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Nova Foto */}
      <Dialog open={showNewPhotoModal} onOpenChange={setShowNewPhotoModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-600" />
              Nova Foto de Evolução
            </DialogTitle>
            <DialogDescription>
              Adicione uma nova foto para acompanhar a evolução de {studentName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-sm text-gray-600 mb-3">
                Para adicionar fotos, acesse o <strong>Perfil do Aluno</strong> &gt; aba <strong>Fotos</strong>
              </p>
              <p className="text-xs text-gray-500">
                Lá você poderá tirar fotos guiadas seguindo as poses de referência
              </p>
            </div>
            
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <h4 className="font-medium text-emerald-800 mb-2">Dicas para fotos de evolução:</h4>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Use sempre a mesma iluminação e fundo</li>
                <li>• Mantenha a mesma distância da câmera</li>
                <li>• Siga as poses de referência (frontal, lateral, costas)</li>
                <li>• Tire fotos no mesmo horário do dia</li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPhotoModal(false)}>
              Fechar
            </Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                setShowNewPhotoModal(false);
                // Redirecionar para o perfil do aluno na aba de fotos
                window.location.href = `/alunos/${studentId}?tab=photos`;
              }}
            >
              <Camera className="h-4 w-4 mr-2" />
              Ir para Fotos do Aluno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
