import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Camera, 
  TrendingUp, 
  Calendar,
  Sparkles,
  Loader2,
  ArrowLeftRight,
  History,
  Plus,
  ChevronRight
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { GuidedPhotos } from "./GuidedPhotos";
import { PhotoEvolutionTimeline } from "./PhotoEvolutionTimeline";
import { PhotoComparisonSlider } from "./PhotoComparisonSlider";

interface PhotoEvolutionSectionProps {
  studentId: number;
  measurements?: Array<{
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
  }>;
}

export function PhotoEvolutionSection({ studentId, measurements = [] }: PhotoEvolutionSectionProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "timeline" | "compare">("upload");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [selectedPhotosForComparison, setSelectedPhotosForComparison] = useState<{
    before: any | null;
    after: any | null;
  }>({ before: null, after: null });

  // Buscar fotos do aluno
  const { data: photosData, refetch: refetchPhotos } = trpc.studentPortal.guidedPhotos.useQuery();
  
  // Mutation para análise completa
  const analyzeFullMutation = trpc.studentPortal.analyzeFullEvolution.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      toast.success("Análise concluída!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao analisar evolução");
    }
  });

  // Processar fotos para timeline
  const allPhotos = useMemo(() => {
    if (!photosData?.photosByPose) return [];
    
    const photos: any[] = [];
    Object.entries(photosData.photosByPose).forEach(([poseId, posePhotos]) => {
      (posePhotos as any[]).forEach((photo: any) => {
        photos.push({
          ...photo,
          poseId,
          photoDate: photo.date,
        });
      });
    });
    
    return photos.sort((a, b) => 
      new Date(b.photoDate).getTime() - new Date(a.photoDate).getTime()
    );
  }, [photosData]);

  // Estatísticas
  const stats = useMemo(() => {
    if (allPhotos.length === 0) return null;
    
    const firstPhoto = allPhotos[allPhotos.length - 1];
    const lastPhoto = allPhotos[0];
    const daysBetween = differenceInDays(
      new Date(lastPhoto.photoDate),
      new Date(firstPhoto.photoDate)
    );
    
    return {
      totalPhotos: allPhotos.length,
      firstDate: new Date(firstPhoto.photoDate),
      lastDate: new Date(lastPhoto.photoDate),
      daysBetween,
      posesWithPhotos: Object.keys(photosData?.photosByPose || {}).length,
    };
  }, [allPhotos, photosData]);

  // Preparar medidas para comparação
  const measurementsForComparison = useMemo(() => {
    if (measurements.length < 2) return undefined;
    
    const sorted = [...measurements].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    const toNumber = (val: string | number | null | undefined): number | undefined => {
      if (val === null || val === undefined) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    };
    
    return {
      before: {
        weight: toNumber(first.weight),
        bodyFat: toNumber(first.bodyFat),
        chest: toNumber(first.chest),
        waist: toNumber(first.waist),
        hips: toNumber(first.hips),
        arm: toNumber(first.rightArm),
        thigh: toNumber(first.rightThigh),
      },
      after: {
        weight: toNumber(last.weight),
        bodyFat: toNumber(last.bodyFat),
        chest: toNumber(last.chest),
        waist: toNumber(last.waist),
        hips: toNumber(last.hips),
        arm: toNumber(last.rightArm),
        thigh: toNumber(last.rightThigh),
      }
    };
  }, [measurements]);

  const handleAnalyzeEvolution = (before: any, after: any) => {
    setSelectedPhotosForComparison({ before, after });
    analyzeFullMutation.mutate({
      beforePhotoUrl: before.url,
      afterPhotoUrl: after.url,
    });
  };

  const handleQuickAnalysis = () => {
    if (allPhotos.length < 2) {
      toast.error("Você precisa de pelo menos 2 fotos para análise de evolução");
      return;
    }
    
    const firstPhoto = allPhotos[allPhotos.length - 1];
    const lastPhoto = allPhotos[0];
    
    setSelectedPhotosForComparison({ before: firstPhoto, after: lastPhoto });
    analyzeFullMutation.mutate({
      beforePhotoUrl: firstPhoto.url,
      afterPhotoUrl: lastPhoto.url,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      {stats && stats.totalPhotos > 0 && (
        <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <Camera className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sua Evolução em Fotos</h3>
                  <p className="text-sm text-gray-600">
                    {stats.totalPhotos} {stats.totalPhotos === 1 ? 'foto' : 'fotos'} 
                    {stats.daysBetween > 0 && ` • ${stats.daysBetween} dias de acompanhamento`}
                  </p>
                </div>
              </div>
              
              {stats.totalPhotos >= 2 && (
                <Button 
                  onClick={handleQuickAnalysis}
                  disabled={analyzeFullMutation.isPending}
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
                >
                  {analyzeFullMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Analisar Evolução
                </Button>
              )}
            </div>
            
            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <p className="text-2xl font-bold text-emerald-600">{stats.totalPhotos}</p>
                <p className="text-xs text-gray-500">Fotos</p>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.posesWithPhotos}</p>
                <p className="text-xs text-gray-500">Poses</p>
              </div>
              <div className="text-center p-2 bg-white/60 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{stats.daysBetween}</p>
                <p className="text-xs text-gray-500">Dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs de navegação */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            <span className="hidden sm:inline">Comparar</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Adicionar Fotos */}
        <TabsContent value="upload" className="mt-4">
          <GuidedPhotos 
            studentId={studentId}
            onPhotosUploaded={() => {
              refetchPhotos();
              toast.success("Foto adicionada! Veja sua evolução na aba Timeline.");
            }}
          />
        </TabsContent>

        {/* Tab: Timeline */}
        <TabsContent value="timeline" className="mt-4">
          {allPhotos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Camera className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma foto ainda</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Adicione fotos para começar a acompanhar sua evolução.
                </p>
                <Button onClick={() => setActiveTab("upload")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Foto
                </Button>
              </CardContent>
            </Card>
          ) : (
            <PhotoEvolutionTimeline
              photos={allPhotos}
              onAnalyzeEvolution={handleAnalyzeEvolution}
              isAnalyzing={analyzeFullMutation.isPending}
              analysisResult={analysisResult || undefined}
              showAnalysisButton={true}
            />
          )}
        </TabsContent>

        {/* Tab: Comparar */}
        <TabsContent value="compare" className="mt-4">
          {allPhotos.length < 2 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ArrowLeftRight className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">Precisa de mais fotos</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Adicione pelo menos 2 fotos para fazer comparações antes/depois.
                </p>
                <Button onClick={() => setActiveTab("upload")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Fotos
                </Button>
              </CardContent>
            </Card>
          ) : selectedPhotosForComparison.before && selectedPhotosForComparison.after ? (
            <div className="space-y-4">
              <PhotoComparisonSlider
                beforePhoto={{
                  id: selectedPhotosForComparison.before.id,
                  url: selectedPhotosForComparison.before.url,
                  photoDate: selectedPhotosForComparison.before.photoDate || selectedPhotosForComparison.before.date,
                }}
                afterPhoto={{
                  id: selectedPhotosForComparison.after.id,
                  url: selectedPhotosForComparison.after.url,
                  photoDate: selectedPhotosForComparison.after.photoDate || selectedPhotosForComparison.after.date,
                }}
                measurements={measurementsForComparison}
                onAnalyze={() => handleAnalyzeEvolution(
                  selectedPhotosForComparison.before,
                  selectedPhotosForComparison.after
                )}
                isAnalyzing={analyzeFullMutation.isPending}
                analysisResult={analysisResult || undefined}
              />
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setSelectedPhotosForComparison({ before: null, after: null })}
              >
                Escolher Outras Fotos
              </Button>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
                  Selecione as Fotos para Comparar
                </CardTitle>
                <CardDescription>
                  Escolha uma foto "antes" e uma "depois" para ver sua evolução
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Seletor de foto "antes" */}
                  <div>
                    <p className="text-sm font-medium mb-2 text-gray-600">Foto Antes</p>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {allPhotos.map((photo) => (
                        <button
                          key={`before-${photo.id}`}
                          onClick={() => setSelectedPhotosForComparison(prev => ({ ...prev, before: photo }))}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedPhotosForComparison.before?.id === photo.id
                              ? 'border-emerald-500 ring-2 ring-emerald-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                            <p className="text-[10px] text-white text-center">
                              {format(new Date(photo.photoDate || photo.date), 'dd/MM/yy')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Seletor de foto "depois" */}
                  <div>
                    <p className="text-sm font-medium mb-2 text-gray-600">Foto Depois</p>
                    <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                      {allPhotos.map((photo) => (
                        <button
                          key={`after-${photo.id}`}
                          onClick={() => setSelectedPhotosForComparison(prev => ({ ...prev, after: photo }))}
                          disabled={selectedPhotosForComparison.before?.id === photo.id}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            selectedPhotosForComparison.after?.id === photo.id
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : selectedPhotosForComparison.before?.id === photo.id
                                ? 'border-gray-100 opacity-50 cursor-not-allowed'
                                : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={photo.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                            <p className="text-[10px] text-white text-center">
                              {format(new Date(photo.photoDate || photo.date), 'dd/MM/yy')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                {selectedPhotosForComparison.before && selectedPhotosForComparison.after && (
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                    onClick={() => {}}
                  >
                    <ChevronRight className="h-4 w-4 mr-2" />
                    Ver Comparação
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Resultado da análise (se houver e não estiver na comparação) */}
      {analysisResult && activeTab !== "compare" && !selectedPhotosForComparison.before && (
        <Card className="border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              Análise da Sua Evolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {analysisResult}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
