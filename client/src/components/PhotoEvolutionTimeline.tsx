import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp, 
  Clock,
  Camera,
  Sparkles,
  Loader2,
  ZoomIn,
  ArrowLeftRight
} from "lucide-react";
import { format, differenceInDays, differenceInWeeks, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Photo {
  id: number;
  url: string;
  photoDate: string | Date;
  poseId?: string;
  category?: string;
  aiAnalysis?: string;
  muscleScore?: number;
  bodyFatEstimate?: number;
  postureScore?: number;
}

interface PhotoEvolutionTimelineProps {
  photos: Photo[];
  onAnalyzeEvolution?: (beforePhoto: Photo, afterPhoto: Photo) => void;
  isAnalyzing?: boolean;
  analysisResult?: string;
  showAnalysisButton?: boolean;
}

export function PhotoEvolutionTimeline({ 
  photos, 
  onAnalyzeEvolution,
  isAnalyzing = false,
  analysisResult,
  showAnalysisButton = true
}: PhotoEvolutionTimelineProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhotos, setComparePhotos] = useState<{ before: Photo | null; after: Photo | null }>({ before: null, after: null });
  const [sliderPosition, setSliderPosition] = useState(50);

  // Ordenar fotos por data (mais recente primeiro)
  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => 
      new Date(b.photoDate).getTime() - new Date(a.photoDate).getTime()
    );
  }, [photos]);

  // Agrupar fotos por mês
  const photosByMonth = useMemo(() => {
    const groups: { [key: string]: Photo[] } = {};
    sortedPhotos.forEach(photo => {
      const date = new Date(photo.photoDate);
      const key = format(date, 'MMMM yyyy', { locale: ptBR });
      if (!groups[key]) groups[key] = [];
      groups[key].push(photo);
    });
    return groups;
  }, [sortedPhotos]);

  // Calcular tempo de evolução
  const getEvolutionTime = (startDate: Date, endDate: Date) => {
    const days = differenceInDays(endDate, startDate);
    const weeks = differenceInWeeks(endDate, startDate);
    const months = differenceInMonths(endDate, startDate);

    if (months >= 1) {
      return `${months} ${months === 1 ? 'mês' : 'meses'}`;
    } else if (weeks >= 1) {
      return `${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
    } else {
      return `${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
  };

  const handlePhotoClick = (photo: Photo, index: number) => {
    if (compareMode) {
      if (!comparePhotos.before) {
        setComparePhotos({ before: photo, after: null });
      } else if (!comparePhotos.after && photo.id !== comparePhotos.before.id) {
        // Garantir que "before" é a foto mais antiga
        const beforeDate = new Date(comparePhotos.before.photoDate);
        const afterDate = new Date(photo.photoDate);
        if (beforeDate > afterDate) {
          setComparePhotos({ before: photo, after: comparePhotos.before });
        } else {
          setComparePhotos({ ...comparePhotos, after: photo });
        }
      }
    } else {
      setSelectedPhotoIndex(index);
    }
  };

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null) return;
    const newIndex = direction === 'prev' 
      ? Math.max(0, selectedPhotoIndex - 1)
      : Math.min(sortedPhotos.length - 1, selectedPhotoIndex + 1);
    setSelectedPhotoIndex(newIndex);
  };

  const startComparison = () => {
    setCompareMode(true);
    setComparePhotos({ before: null, after: null });
  };

  const cancelComparison = () => {
    setCompareMode(false);
    setComparePhotos({ before: null, after: null });
  };

  if (photos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Camera className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma foto de evolução</h3>
          <p className="text-gray-500 text-sm">
            Adicione fotos para acompanhar sua evolução ao longo do tempo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const firstPhoto = sortedPhotos[sortedPhotos.length - 1];
  const lastPhoto = sortedPhotos[0];
  const totalEvolutionTime = sortedPhotos.length > 1 
    ? getEvolutionTime(new Date(firstPhoto.photoDate), new Date(lastPhoto.photoDate))
    : null;

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Timeline de Evolução</h3>
                <p className="text-sm text-gray-600">
                  {photos.length} {photos.length === 1 ? 'foto' : 'fotos'} registradas
                  {totalEvolutionTime && ` • ${totalEvolutionTime} de acompanhamento`}
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
                      onClick={() => onAnalyzeEvolution?.(comparePhotos.before!, comparePhotos.after!)}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Analisar
                    </Button>
                  )}
                </>
              ) : (
                photos.length >= 2 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={startComparison}
                  >
                    <ArrowLeftRight className="h-4 w-4 mr-2" />
                    Comparar Fotos
                  </Button>
                )
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
                    : "✅ Fotos selecionadas! Clique em 'Analisar' para ver a evolução."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline por mês */}
      {Object.entries(photosByMonth).map(([month, monthPhotos]) => (
        <div key={month} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            <h4 className="text-sm font-medium text-gray-600 capitalize">{month}</h4>
            <Badge variant="secondary" className="text-xs">
              {monthPhotos.length} {monthPhotos.length === 1 ? 'foto' : 'fotos'}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {monthPhotos.map((photo, idx) => {
              const globalIndex = sortedPhotos.findIndex(p => p.id === photo.id);
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
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    isSelected 
                      ? 'border-emerald-500 ring-2 ring-emerald-200' 
                      : 'border-transparent hover:border-gray-300'
                  }`}
                  onClick={() => handlePhotoClick(photo, globalIndex)}
                >
                  <div className="aspect-square">
                    <img
                      src={photo.url}
                      alt={`Foto de ${format(new Date(photo.photoDate), 'dd/MM/yyyy')}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Overlay com data */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                    <p className="text-[10px] text-white text-center">
                      {format(new Date(photo.photoDate), 'dd/MM')}
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
                  
                  {/* Indicadores de análise */}
                  {photo.aiAnalysis && (
                    <div className="absolute top-1 right-1">
                      <div className="p-1 bg-purple-500 rounded-full">
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white" />
                  </div>
                  
                  {/* Badges de primeira/última foto */}
                  {globalIndex === sortedPhotos.length - 1 && (
                    <div className="absolute top-1 left-1">
                      <Badge variant="secondary" className="text-[9px] px-1 py-0">
                        1ª
                      </Badge>
                    </div>
                  )}
                  {globalIndex === 0 && sortedPhotos.length > 1 && (
                    <div className="absolute top-1 left-1">
                      <Badge className="text-[9px] px-1 py-0 bg-emerald-500">
                        Atual
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Modal de visualização de foto */}
      <Dialog open={selectedPhotoIndex !== null && !compareMode} onOpenChange={() => setSelectedPhotoIndex(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Foto de Evolução
            </DialogTitle>
            {selectedPhotoIndex !== null && (
              <DialogDescription>
                {format(new Date(sortedPhotos[selectedPhotoIndex].photoDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                {selectedPhotoIndex < sortedPhotos.length - 1 && (
                  <span className="ml-2 text-emerald-600">
                    • +{getEvolutionTime(
                      new Date(sortedPhotos[sortedPhotos.length - 1].photoDate),
                      new Date(sortedPhotos[selectedPhotoIndex].photoDate)
                    )} desde o início
                  </span>
                )}
              </DialogDescription>
            )}
          </DialogHeader>
          
          {selectedPhotoIndex !== null && (
            <div className="space-y-4">
              <div className="relative aspect-[3/4] max-h-[60vh] mx-auto">
                <img
                  src={sortedPhotos[selectedPhotoIndex].url}
                  alt="Foto de evolução"
                  className="w-full h-full object-contain rounded-lg"
                />
                
                {/* Navegação */}
                {selectedPhotoIndex > 0 && (
                  <button
                    onClick={() => navigatePhoto('next')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
                {selectedPhotoIndex < sortedPhotos.length - 1 && (
                  <button
                    onClick={() => navigatePhoto('prev')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}
              </div>
              
              {/* Scores se disponíveis */}
              {(sortedPhotos[selectedPhotoIndex].muscleScore || 
                sortedPhotos[selectedPhotoIndex].bodyFatEstimate || 
                sortedPhotos[selectedPhotoIndex].postureScore) && (
                <div className="grid grid-cols-3 gap-3">
                  {sortedPhotos[selectedPhotoIndex].muscleScore && (
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600">
                        {sortedPhotos[selectedPhotoIndex].muscleScore}
                      </p>
                      <p className="text-xs text-gray-500">Músculo</p>
                    </div>
                  )}
                  {sortedPhotos[selectedPhotoIndex].bodyFatEstimate && (
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <p className="text-2xl font-bold text-orange-600">
                        {sortedPhotos[selectedPhotoIndex].bodyFatEstimate}%
                      </p>
                      <p className="text-xs text-gray-500">Gordura Est.</p>
                    </div>
                  )}
                  {sortedPhotos[selectedPhotoIndex].postureScore && (
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-2xl font-bold text-purple-600">
                        {sortedPhotos[selectedPhotoIndex].postureScore}
                      </p>
                      <p className="text-xs text-gray-500">Postura</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Análise IA se disponível */}
              {sortedPhotos[selectedPhotoIndex].aiAnalysis && (
                <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                  <h5 className="font-medium flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Análise da IA
                  </h5>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {sortedPhotos[selectedPhotoIndex].aiAnalysis}
                  </p>
                </div>
              )}
              
              {/* Indicador de posição */}
              <div className="flex items-center justify-center gap-1">
                {sortedPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      idx === selectedPhotoIndex ? 'bg-emerald-500' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de comparação lado a lado */}
      <Dialog 
        open={compareMode && comparePhotos.before !== null && comparePhotos.after !== null} 
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
                {getEvolutionTime(
                  new Date(comparePhotos.before.photoDate),
                  new Date(comparePhotos.after.photoDate)
                )} de evolução
              </DialogDescription>
            )}
          </DialogHeader>
          
          {comparePhotos.before && comparePhotos.after && (
            <div className="space-y-4">
              {/* Comparação com slider */}
              <div className="relative aspect-[3/4] max-h-[50vh] mx-auto overflow-hidden rounded-lg">
                {/* Foto "depois" (fundo) */}
                <img
                  src={comparePhotos.after.url}
                  alt="Depois"
                  className="absolute inset-0 w-full h-full object-contain"
                />
                
                {/* Foto "antes" (com clip) */}
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <img
                    src={comparePhotos.before.url}
                    alt="Antes"
                    className="w-full h-full object-contain"
                  />
                </div>
                
                {/* Linha divisória */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                    <ArrowLeftRight className="h-4 w-4 text-gray-600" />
                  </div>
                </div>
                
                {/* Labels */}
                <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                  Antes
                </div>
                <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-white text-xs">
                  Depois
                </div>
              </div>
              
              {/* Slider control */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="w-full"
              />
              
              {/* Datas */}
              <div className="flex justify-between text-sm text-gray-500">
                <span>{format(new Date(comparePhotos.before.photoDate), 'dd/MM/yyyy')}</span>
                <span>{format(new Date(comparePhotos.after.photoDate), 'dd/MM/yyyy')}</span>
              </div>
              
              {/* Botão de análise */}
              {showAnalysisButton && onAnalyzeEvolution && (
                <Button 
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => onAnalyzeEvolution(comparePhotos.before!, comparePhotos.after!)}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? (
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
              )}
              
              {/* Resultado da análise */}
              {analysisResult && (
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-lg border border-emerald-200">
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
