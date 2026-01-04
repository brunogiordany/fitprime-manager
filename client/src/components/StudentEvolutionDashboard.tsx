import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Camera, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Loader2,
  ArrowLeftRight,
  BarChart3,
  Activity,
  Dumbbell,
  Scale,
  Ruler,
  Plus,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  History,
  FileText
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
import { GuidedPhotos } from "./GuidedPhotos";

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

interface StudentEvolutionDashboardProps {
  studentId: number;
  measurements?: Measurement[];
}

export function StudentEvolutionDashboard({ studentId, measurements = [] }: StudentEvolutionDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "photos">("overview");
  
  // Estados para comparação de fotos
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<{ before: Photo | null; after: Photo | null }>({ before: null, after: null });
  const [sliderPosition, setSliderPosition] = useState(50);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
  // Estados para modais
  const [showNewMeasurementModal, setShowNewMeasurementModal] = useState(false);
  const [showAnalysisHistoryModal, setShowAnalysisHistoryModal] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({
    weight: '', bodyFat: '', chest: '', waist: '', hip: '',
    rightArm: '', leftArm: '', rightThigh: '', leftThigh: '',
  });

  // Buscar fotos do aluno
  const { data: photosData, refetch: refetchPhotos } = trpc.studentPortal.guidedPhotos.useQuery();
  const photos = Array.isArray(photosData) ? photosData : (photosData?.allPhotos || []);

  // Buscar exercícios únicos do aluno
  const { data: uniqueExercises } = trpc.studentPortal.uniqueExercises.useQuery();
  
  // Estado para exercício selecionado
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  
  // Buscar progresso do exercício
  const { data: exerciseProgress } = trpc.studentPortal.exerciseProgress.useQuery(
    { exerciseName: selectedExercise, limit: 50 },
    { enabled: !!selectedExercise }
  );

  // Mutation para análise de fotos
  const analyzeMutation = trpc.studentPortal.analyzeFullEvolution.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      toast.success("Análise concluída!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao analisar evolução");
    }
  });

  // Mutation para criar nova medida
  const createMeasurementMutation = trpc.studentPortal.addMeasurement.useMutation({
    onSuccess: () => {
      toast.success("Medida registrada com sucesso!");
      setShowNewMeasurementModal(false);
      setNewMeasurement({
        weight: '', bodyFat: '', chest: '', waist: '', hip: '',
        rightArm: '', leftArm: '', rightThigh: '', leftThigh: '',
      });
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao registrar medida");
    }
  });

  // Query para histórico de análises (usando análises salvas localmente por enquanto)
  const analysisHistory: any[] = [];

  // Organizar fotos por pose
  const photosByPose = useMemo(() => {
    const grouped: Record<string, Photo[]> = {};
    photos.forEach((photo: Photo) => {
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

  // Dados de treino
  const trainingChartData = useMemo(() => {
    if (!exerciseProgress) return [];
    return exerciseProgress.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      fullDate: new Date(item.date).toLocaleDateString('pt-BR'),
      carga: item.maxWeight || 0,
      volume: item.totalVolume || 0,
      reps: item.totalReps || 0,
    })).reverse();
  }, [exerciseProgress]);

  // Estatísticas de treino
  const trainingStats = useMemo(() => {
    if (!exerciseProgress || exerciseProgress.length === 0) return null;
    const weights = exerciseProgress.map((i: any) => i.maxWeight || 0);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const avgWeight = weights.reduce((a: number, b: number) => a + b, 0) / weights.length;
    const totalVolume = exerciseProgress.reduce((sum: number, i: any) => sum + (i.totalVolume || 0), 0);
    const totalReps = exerciseProgress.reduce((sum: number, i: any) => sum + (i.totalReps || 0), 0);
    
    const half = Math.floor(weights.length / 2);
    const firstHalfAvg = weights.slice(0, half).reduce((a: number, b: number) => a + b, 0) / (half || 1);
    const secondHalfAvg = weights.slice(half).reduce((a: number, b: number) => a + b, 0) / ((weights.length - half) || 1);
    const trend = secondHalfAvg > firstHalfAvg ? 'up' : secondHalfAvg < firstHalfAvg ? 'down' : 'stable';
    
    return { maxWeight, minWeight, avgWeight, totalVolume, totalReps, trend, count: exerciseProgress.length };
  }, [exerciseProgress]);

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
      beforePhotoUrl: comparePhotos.before.url,
      afterPhotoUrl: comparePhotos.after.url,
    });
  };

  const cancelComparison = () => {
    setCompareMode(false);
    setComparePhotos({ before: null, after: null });
    setAnalysisResult(null);
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="flex items-center gap-1">
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">Fotos</span>
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

          {/* Última foto vs Primeira */}
          {photos.length >= 2 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4 text-emerald-600" />
                  Sua Evolução: Primeira vs Atual
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
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setActiveTab("photos");
                      setCompareMode(true);
                    }}
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Comparar outras fotos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Fotos */}
        <TabsContent value="photos" className="space-y-4">
          {/* Adicionar novas fotos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Fotos
              </CardTitle>
              <CardDescription>
                Tire fotos seguindo as poses de referência para acompanhar sua evolução
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GuidedPhotos studentId={studentId} onPhotosUploaded={() => refetchPhotos()} />
            </CardContent>
          </Card>

          {photos.length > 0 && (
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
                          <h3 className="font-semibold text-gray-900">Sua Evolução</h3>
                          <p className="text-sm text-gray-600">
                            {photoStats.totalPhotos} fotos • {photoStats.daysBetween} dias de acompanhamento
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowAnalysisHistoryModal(true)}>
                          <History className="h-4 w-4 mr-2" />
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
        <DialogContent 
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-blue-600" />
              Nova Medição
            </DialogTitle>
            <DialogDescription>
              Registre suas medidas corporais atuais
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
              Todas as análises de evolução realizadas
            </DialogDescription>
          </DialogHeader>
          
          {analysisHistory.length === 0 ? (
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
