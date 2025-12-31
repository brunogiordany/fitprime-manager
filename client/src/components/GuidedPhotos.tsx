import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Camera, Upload, X, Check, ChevronDown, ChevronUp, Image as ImageIcon, Trash2, History, Calendar, RefreshCw, Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Definição das poses com suas imagens de referência
const POSE_CATEGORIES = [
  {
    id: "corpo-inteiro",
    name: "Corpo Inteiro",
    poses: [
      { id: "frontal-relaxado", name: "Frontal Relaxado", description: "Fique de frente, braços relaxados ao lado do corpo", image: "/poses/frontal-relaxado.png" },
      { id: "frontal-contraido", name: "Frontal Contraído", description: "Fique de frente, flexione os músculos (pose duplo bíceps)", image: "/poses/frontal-contraido.png" },
      { id: "lateral-esquerda", name: "Lateral Esquerda", description: "Fique de lado esquerdo, braços relaxados", image: "/poses/lateral-esquerda.png" },
      { id: "lateral-direita", name: "Lateral Direita", description: "Fique de lado direito, braços relaxados", image: "/poses/lateral-direita.png" },
      { id: "costas-relaxado", name: "Costas Relaxado", description: "Fique de costas, braços relaxados ao lado do corpo", image: "/poses/costas-relaxado.png" },
      { id: "costas-contraido", name: "Costas Contraído", description: "Fique de costas, abra as costas (pose lat spread)", image: "/poses/costas-contraido.png" },
    ]
  },
  {
    id: "biceps",
    name: "Bíceps",
    poses: [
      { id: "biceps-direito", name: "Bíceps Direito", description: "Flexione o bíceps direito em 90 graus", image: "/poses/biceps-direito.png" },
      { id: "biceps-esquerdo", name: "Bíceps Esquerdo", description: "Flexione o bíceps esquerdo em 90 graus", image: "/poses/biceps-esquerdo.png" },
    ]
  },
  {
    id: "pernas",
    name: "Pernas",
    poses: [
      { id: "perna-direita-relaxada", name: "Perna Direita Relaxada", description: "Perna direita à frente, relaxada", image: "/poses/perna-direita-relaxada.png" },
      { id: "perna-direita-contraida", name: "Perna Direita Contraída", description: "Perna direita à frente, contraída", image: "/poses/perna-direita-contraida.png" },
      { id: "perna-esquerda-relaxada", name: "Perna Esquerda Relaxada", description: "Perna esquerda à frente, relaxada", image: "/poses/perna-esquerda-relaxada.png" },
      { id: "perna-esquerda-contraida", name: "Perna Esquerda Contraída", description: "Perna esquerda à frente, contraída", image: "/poses/perna-esquerda-contraida.png" },
    ]
  }
];

interface GuidedPhotosProps {
  studentId: number;
  measurementId?: number; // Se fornecido, vincula as fotos a uma medição específica
  onPhotosUploaded?: (photos: { poseId: string; url: string }[]) => void;
  existingPhotos?: { poseId: string; url: string }[];
  readOnly?: boolean;
}

export function GuidedPhotos({ studentId, measurementId, onPhotosUploaded, existingPhotos = [], readOnly = false }: GuidedPhotosProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["corpo-inteiro"]);
  const [uploadingPose, setUploadingPose] = useState<string | null>(null);
  const [selectedPose, setSelectedPose] = useState<{ id: string; name: string; description: string; image: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<{ poseId: string; url: string }[]>(existingPhotos);
  const [showHistory, setShowHistory] = useState<string | null>(null); // poseId para mostrar histórico
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Buscar fotos guiadas com histórico
  const { data: guidedPhotosData } = trpc.studentPortal.guidedPhotos.useQuery(undefined, {
    enabled: !readOnly,
  });

  const analyzePhotosMutation = trpc.studentPortal.analyzePhotos.useMutation({
    onSuccess: (data) => {
      setAiAnalysis(data.analysis);
      setAnalyzingAI(false);
    },
    onError: (error) => {
      toast.error("Erro ao analisar fotos: " + error.message);
      setAnalyzingAI(false);
    }
  });

  const uploadMutation = trpc.studentPortal.uploadPhoto.useMutation({
    onSuccess: (data) => {
      if (selectedPose) {
        const newPhotos = [...uploadedPhotos.filter(p => p.poseId !== selectedPose.id), { poseId: selectedPose.id, url: data.url }];
        setUploadedPhotos(newPhotos);
        onPhotosUploaded?.(newPhotos);
        toast.success("Foto enviada com sucesso!");
      }
      setUploadingPose(null);
      setSelectedPose(null);
      setPreviewImage(null);
    },
    onError: (error) => {
      toast.error("Erro ao enviar foto: " + error.message);
      setUploadingPose(null);
    }
  });

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handlePoseClick = (pose: { id: string; name: string; description: string; image: string }) => {
    if (readOnly) return;
    setSelectedPose(pose);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedPose) {
      // Preview da imagem
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!previewImage || !selectedPose) return;
    
    setUploadingPose(selectedPose.id);
    
    // Converter base64 para blob
    const response = await fetch(previewImage);
    const blob = await response.blob();
    
    // Converter para base64 para enviar via tRPC
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadMutation.mutate({
        poseId: selectedPose.id,
        imageBase64: base64,
        fileName: `${selectedPose.id}-${Date.now()}.jpg`
      });
    };
    reader.readAsDataURL(blob);
  };

  const getPhotoForPose = (poseId: string) => {
    // Primeiro verifica nas fotos recém enviadas, depois no histórico
    const recentPhoto = uploadedPhotos.find(p => p.poseId === poseId)?.url;
    if (recentPhoto) return recentPhoto;
    
    // Buscar a foto mais recente do histórico
    const historyPhotos = guidedPhotosData?.photosByPose?.[poseId];
    if (historyPhotos && historyPhotos.length > 0) {
      return historyPhotos[0].url;
    }
    return undefined;
  };
  
  const getPhotoHistory = (poseId: string) => {
    return guidedPhotosData?.photosByPose?.[poseId] || [];
  };

  const removePhoto = (poseId: string) => {
    const newPhotos = uploadedPhotos.filter(p => p.poseId !== poseId);
    setUploadedPhotos(newPhotos);
    onPhotosUploaded?.(newPhotos);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Fotos de Evolução
          </CardTitle>
          <CardDescription>
            Tire fotos seguindo as poses de referência para acompanhar sua evolução física
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {POSE_CATEGORIES.map((category) => (
            <div key={category.id} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="font-medium">{category.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {category.poses.filter(p => getPhotoForPose(p.id)).length}/{category.poses.length} fotos
                  </span>
                  {expandedCategories.includes(category.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>
              
              {expandedCategories.includes(category.id) && (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {category.poses.map((pose) => {
                    const uploadedPhoto = getPhotoForPose(pose.id);
                    return (
                      <div
                        key={pose.id}
                        className={`relative border rounded-lg overflow-hidden ${!readOnly ? 'cursor-pointer hover:border-primary transition-colors' : ''}`}
                        onClick={() => handlePoseClick(pose)}
                      >
                        {/* Imagem de referência ou foto enviada */}
                        <div className="aspect-[3/4] relative bg-muted">
                          {uploadedPhoto ? (
                            <>
                              <img
                                src={uploadedPhoto}
                                alt={pose.name}
                                className="w-full h-full object-cover"
                              />
                              {/* Botões de ação */}
                              <div className="absolute top-2 left-2 right-2 flex justify-between">
                                {/* Botão de histórico - sempre visível */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowHistory(pose.id);
                                  }}
                                  className="p-1.5 bg-blue-500 text-white rounded-full hover:bg-blue-600 flex items-center gap-1"
                                  title="Ver histórico de evolução"
                                >
                                  <History className="h-3 w-3" />
                                  <span className="text-[10px] font-medium">{getPhotoHistory(pose.id).length}</span>
                                </button>
                                {/* Botão de excluir */}
                                {!readOnly && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removePhoto(pose.id);
                                    }}
                                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    title="Excluir foto atual"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                              {/* Barra inferior com ação de atualizar */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                {!readOnly && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePoseClick(pose);
                                    }}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs py-1.5 px-2 rounded flex items-center justify-center gap-1 transition-colors"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                    Atualizar Foto
                                  </button>
                                )}
                                {readOnly && (
                                  <div className="text-white text-xs text-center">
                                    {getPhotoHistory(pose.id).length} {getPhotoHistory(pose.id).length === 1 ? 'foto' : 'fotos'}
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            <>
                              <img
                                src={pose.image}
                                alt={pose.name}
                                className="w-full h-full object-contain opacity-50"
                              />
                              {!readOnly && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-primary/90 text-primary-foreground rounded-full p-3">
                                    <Camera className="h-5 w-5" />
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        
                        {/* Nome da pose e data */}
                        <div className="p-2 text-center">
                          <p className="text-xs font-medium truncate">{pose.name}</p>
                          {uploadedPhoto && getPhotoHistory(pose.id).length > 0 && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(getPhotoHistory(pose.id)[0].date).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Modal de upload */}
      <Dialog open={!!selectedPose} onOpenChange={(open) => !open && setSelectedPose(null)}>
        <DialogContent className="max-w-lg" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{selectedPose?.name}</DialogTitle>
            <DialogDescription>{selectedPose?.description}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Comparação lado a lado */}
            <div className="grid grid-cols-2 gap-4">
              {/* Imagem de referência */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">Referência</p>
                <div className="aspect-[3/4] border rounded-lg overflow-hidden bg-muted">
                  {selectedPose && (
                    <img
                      src={selectedPose.image}
                      alt="Referência"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
              
              {/* Sua foto */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-center">Sua Foto</p>
                <div 
                  className="aspect-[3/4] border rounded-lg overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Clique para selecionar</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedPose(null);
                  setPreviewImage(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpload}
                disabled={!previewImage || uploadingPose === selectedPose?.id}
              >
                {uploadingPose === selectedPose?.id ? (
                  "Enviando..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Confirmar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal de histórico de fotos */}
      <Dialog open={!!showHistory} onOpenChange={(open) => !open && setShowHistory(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Evolução
            </DialogTitle>
            <DialogDescription>
              {showHistory && POSE_CATEGORIES.flatMap(c => c.poses).find(p => p.id === showHistory)?.name}
            </DialogDescription>
          </DialogHeader>
          
          {showHistory && (
            <div className="space-y-4">
              {/* Timeline de fotos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {getPhotoHistory(showHistory).map((photo, index, arr) => {
                  // Calcular tempo desde a foto anterior
                  const prevPhoto = arr[index + 1];
                  let timeDiff = '';
                  if (prevPhoto) {
                    const diffMs = new Date(photo.date).getTime() - new Date(prevPhoto.date).getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    if (diffDays === 0) timeDiff = 'mesmo dia';
                    else if (diffDays === 1) timeDiff = '1 dia depois';
                    else if (diffDays < 7) timeDiff = `${diffDays} dias depois`;
                    else if (diffDays < 30) timeDiff = `${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''} depois`;
                    else timeDiff = `${Math.floor(diffDays / 30)} mês${Math.floor(diffDays / 30) > 1 ? 'es' : ''} depois`;
                  }
                  
                  return (
                    <div key={photo.id} className="relative">
                      <div className="aspect-[3/4] border rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photo.url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="mt-1 text-center space-y-0.5">
                        <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(photo.date).toLocaleDateString('pt-BR')}
                        </p>
                        {index === 0 && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                            Mais recente
                          </span>
                        )}
                        {index === arr.length - 1 && arr.length > 1 && (
                          <span className="text-xs bg-muted-foreground/20 text-muted-foreground px-2 py-0.5 rounded-full">
                            Primeira foto
                          </span>
                        )}
                        {timeDiff && index > 0 && index < arr.length - 1 && (
                          <p className="text-[10px] text-blue-500 font-medium">
                            {timeDiff}
                          </p>
                        )}
                        {timeDiff && index === 0 && (
                          <p className="text-[10px] text-green-500 font-medium">
                            +{timeDiff.replace(' depois', '')}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Comparação lado a lado (primeira vs última) */}
              {getPhotoHistory(showHistory).length >= 2 && (() => {
                const history = getPhotoHistory(showHistory);
                const firstPhoto = history[history.length - 1];
                const lastPhoto = history[0];
                const diffMs = new Date(lastPhoto.date).getTime() - new Date(firstPhoto.date).getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                let totalTime = '';
                if (diffDays === 0) totalTime = 'Mesmo dia';
                else if (diffDays === 1) totalTime = '1 dia de evolução';
                else if (diffDays < 7) totalTime = `${diffDays} dias de evolução`;
                else if (diffDays < 30) totalTime = `${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) > 1 ? 's' : ''} de evolução`;
                else if (diffDays < 365) totalTime = `${Math.floor(diffDays / 30)} mês${Math.floor(diffDays / 30) > 1 ? 'es' : ''} de evolução`;
                else totalTime = `${Math.floor(diffDays / 365)} ano${Math.floor(diffDays / 365) > 1 ? 's' : ''} de evolução`;
                
                return (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-1 text-center">Comparação: Primeira vs Mais Recente</h4>
                    <p className="text-sm text-center text-green-600 font-medium mb-3">
                      📈 {totalTime}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-center text-muted-foreground">Primeira foto</p>
                        <div className="aspect-[3/4] border rounded-lg overflow-hidden bg-muted">
                          <img
                            src={firstPhoto.url}
                            alt="Primeira foto"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                          {new Date(firstPhoto.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-center text-muted-foreground">Mais recente</p>
                        <div className="aspect-[3/4] border rounded-lg overflow-hidden bg-muted">
                          <img
                            src={lastPhoto.url}
                            alt="Foto mais recente"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                          {new Date(lastPhoto.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  {/* Botão de Análise com IA */}
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      className="w-full"
                      variant={aiAnalysis ? "outline" : "default"}
                      disabled={analyzingAI}
                      onClick={() => {
                        setAnalyzingAI(true);
                        setAiAnalysis(null);
                        const poseName = POSE_CATEGORIES.flatMap(c => c.poses).find(p => p.id === showHistory)?.name || '';
                        analyzePhotosMutation.mutate({
                          poseId: showHistory!,
                          firstPhotoUrl: firstPhoto.url,
                          lastPhotoUrl: lastPhoto.url,
                          poseName,
                          daysBetween: diffDays,
                        });
                      }}
                    >
                      {analyzingAI ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analisando com IA...
                        </>
                      ) : aiAnalysis ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Analisar Novamente
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analisar Evolução com IA
                        </>
                      )}
                    </Button>
                    
                    {/* Resultado da Análise */}
                    {aiAnalysis && (
                      <div className="mt-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                        <h5 className="font-medium flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          Análise da IA
                        </h5>
                        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {aiAnalysis}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </DialogContent>
    </Dialog>
  </div>
);
}

// Componente simplificado para uso no modal de medição
export function MeasurementPhotos({ 
  photos, 
  onPhotosChange 
}: { 
  photos: { poseId: string; url: string }[];
  onPhotosChange: (photos: { poseId: string; url: string }[]) => void;
}) {
  const [showFullGallery, setShowFullGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedPoseId, setSelectedPoseId] = useState<string | null>(null);

  // Poses principais para medição (simplificado)
  const mainPoses = [
    { id: "frontal-relaxado", name: "Frontal", image: "/poses/frontal-relaxado.png" },
    { id: "lateral-direita", name: "Lateral", image: "/poses/lateral-direita.png" },
    { id: "costas-relaxado", name: "Costas", image: "/poses/costas-relaxado.png" },
  ];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedPoseId) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const newPhotos = [...photos.filter(p => p.poseId !== selectedPoseId), { poseId: selectedPoseId, url }];
        onPhotosChange(newPhotos);
        setSelectedPoseId(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const getPhotoForPose = (poseId: string) => {
    return photos.find(p => p.poseId === poseId)?.url;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-primary" />
          Fotos de Evolução (opcional)
        </p>
        <Button variant="link" size="sm" onClick={() => setShowFullGallery(true)}>
          Ver todas as poses
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {mainPoses.map((pose) => {
          const photo = getPhotoForPose(pose.id);
          return (
            <div
              key={pose.id}
              className="relative aspect-[3/4] border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
              onClick={() => {
                setSelectedPoseId(pose.id);
                fileInputRef.current?.click();
              }}
            >
              {photo ? (
                <>
                  <img src={photo} alt={pose.name} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-green-500/90 text-white text-xs p-1 text-center">
                    <Check className="h-3 w-3 inline" />
                  </div>
                </>
              ) : (
                <>
                  <img src={pose.image} alt={pose.name} className="w-full h-full object-contain opacity-40" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Camera className="h-5 w-5 text-muted-foreground" />
                  </div>
                </>
              )}
              <div className="absolute top-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                {pose.name}
              </div>
            </div>
          );
        })}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {photos.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {photos.length} foto(s) selecionada(s)
        </p>
      )}
    </div>
  );
}
