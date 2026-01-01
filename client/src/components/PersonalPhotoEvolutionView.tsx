import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Camera, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Loader2,
  ArrowLeftRight,
  History,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  BarChart3
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format, differenceInDays, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  [key: string]: any; // Allow additional fields from DB
}

interface PersonalPhotoEvolutionViewProps {
  studentId: number;
  studentName: string;
  photos: Photo[];
  measurements?: Measurement[];
  onRefresh?: () => void;
}

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

export function PersonalPhotoEvolutionView({ 
  studentId, 
  studentName, 
  photos, 
  measurements = [],
  onRefresh 
}: PersonalPhotoEvolutionViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<{ before: Photo | null; after: Photo | null }>({ before: null, after: null });
  const [sliderPosition, setSliderPosition] = useState(50);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // Mutation para análise (usando endpoint do personal)
  const analyzeMutation = trpc.anamnesis.analyzeEvolution.useMutation({
    onSuccess: (data) => {
      const analysisText = typeof data.analysis === 'string' ? data.analysis : String(data.analysis);
      setAnalysisResult(analysisText);
      toast.success("Análise concluída!");
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Erro ao analisar evolução");
    }
  });

  // Organizar fotos por pose
  const photosByPose = useMemo(() => {
    const grouped: Record<string, Photo[]> = {};
    
    photos.forEach(photo => {
      const poseMatch = photo.notes?.match(/^pose:(.+)$/);
      const poseId = poseMatch ? poseMatch[1] : 'geral';
      
      if (!grouped[poseId]) grouped[poseId] = [];
      grouped[poseId].push(photo);
    });
    
    // Ordenar cada grupo por data
    Object.keys(grouped).forEach(poseId => {
      grouped[poseId].sort((a, b) => {
        const dateA = new Date(a.photoDate || a.createdAt).getTime();
        const dateB = new Date(b.photoDate || b.createdAt).getTime();
        return dateB - dateA;
      });
    });
    
    return grouped;
  }, [photos]);

  // Estatísticas
  const stats = useMemo(() => {
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

  // Medidas para exibição
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
        // Garantir ordem cronológica
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

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Camera className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma foto de evolução</h3>
          <p className="text-gray-500 text-sm">
            {studentName} ainda não enviou fotos de evolução pelo portal.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      {stats && (
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
                    {stats.totalPhotos} fotos • {stats.daysBetween} dias de acompanhamento
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
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
                <p className="text-xl font-bold text-emerald-600">{stats.totalPhotos}</p>
                <p className="text-xs text-gray-500">Fotos</p>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <p className="text-xl font-bold text-blue-600">{stats.posesCount}</p>
                <p className="text-xs text-gray-500">Poses</p>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <p className="text-xl font-bold text-purple-600">{stats.daysBetween}</p>
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

      {/* Evolução das medidas (se houver) */}
      {measurementsDiff && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-emerald-600" />
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
                    <p className={`text-xs font-medium ${
                      isGood ? 'text-emerald-600' : isBad ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}{unit}
                    </p>
                  </div>
                );
              })}
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
                        <img
                          src={photo.url}
                          alt={POSE_NAMES[poseId] || poseId}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Data */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                        <p className="text-[10px] text-white text-center">
                          {format(new Date(photo.photoDate || photo.createdAt), 'dd/MM/yy')}
                        </p>
                      </div>
                      
                      {/* Badge de seleção */}
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
              
              {/* Comparação rápida se tiver 2+ fotos */}
              {posePhotos.length >= 2 && !compareMode && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2 text-center text-gray-600">
                    Comparação: Primeira vs Atual
                  </p>
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Primeira</p>
                      <div className="aspect-[3/4] border rounded-lg overflow-hidden">
                        <img
                          src={posePhotos[posePhotos.length - 1].url}
                          alt="Primeira"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(posePhotos[posePhotos.length - 1].photoDate || posePhotos[posePhotos.length - 1].createdAt), 'dd/MM/yy')}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Atual</p>
                      <div className="aspect-[3/4] border rounded-lg overflow-hidden">
                        <img
                          src={posePhotos[0].url}
                          alt="Atual"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(posePhotos[0].photoDate || posePhotos[0].createdAt), 'dd/MM/yy')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
                    <img
                      src={photo.url}
                      alt="Foto"
                      className="w-full h-full object-cover"
                    />
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

      {/* Modal de visualização */}
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
              <img
                src={selectedPhoto.url}
                alt="Foto"
                className="w-full h-full object-contain rounded-lg"
              />
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
                <img
                  src={comparePhotos.after.url}
                  alt="Depois"
                  className="absolute inset-0 w-full h-full object-contain bg-gray-100"
                />
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img
                    src={comparePhotos.before.url}
                    alt="Antes"
                    className="w-full h-full object-contain bg-gray-100"
                  />
                </div>
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <ArrowLeftRight className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                  Antes
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                  Depois
                </div>
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
    </div>
  );
}
