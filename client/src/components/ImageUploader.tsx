import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Upload, 
  Image as ImageIcon, 
  Link2, 
  Crop, 
  RotateCw, 
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Check,
  X,
  Loader2,
  Download
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface ImageUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImageSelect: (url: string, metadata?: ImageMetadata) => void;
  pageId?: number;
}

interface ImageMetadata {
  width: number;
  height: number;
  filename: string;
  fileSize: number;
  mimeType: string;
}

export function ImageUploader({ open, onOpenChange, onImageSelect, pageId }: ImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "library">("upload");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  
  // Estados de edição
  const [showEditor, setShowEditor] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  
  // Crop
  const [cropMode, setCropMode] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 100, y: 100 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Buscar assets da biblioteca
  const { data: libraryAssets = [], isLoading: loadingAssets } = trpc.pageAssets.list.useQuery(
    { type: "image" },
    { enabled: activeTab === "library" }
  );
  
  const uploadAssetMutation = trpc.pageAssets.upload.useMutation();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }
    
    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10MB");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewImage(dataUrl);
      setOriginalImage(dataUrl);
      setShowEditor(true);
      resetEdits();
    };
    reader.readAsDataURL(file);
  }, []);

  const resetEdits = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setZoom(100);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setCropMode(false);
    setCropStart({ x: 0, y: 0 });
    setCropEnd({ x: 100, y: 100 });
  };

  const handleUrlSubmit = () => {
    if (!imageUrl.trim()) {
      toast.error("Digite uma URL de imagem");
      return;
    }
    
    // Validar URL
    try {
      new URL(imageUrl);
    } catch {
      toast.error("URL inválida");
      return;
    }
    
    setPreviewImage(imageUrl);
    setOriginalImage(imageUrl);
    setShowEditor(true);
    resetEdits();
  };

  const handleLibrarySelect = (asset: any) => {
    onImageSelect(asset.url, {
      width: asset.width || 0,
      height: asset.height || 0,
      filename: asset.filename,
      fileSize: asset.fileSize || 0,
      mimeType: asset.mimeType || 'image/jpeg'
    });
    onOpenChange(false);
  };

  const applyEdits = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return null;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;
    
    if (!ctx || !img.complete) return null;
    
    // Calcular dimensões com rotação
    const radians = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(radians));
    const cos = Math.abs(Math.cos(radians));
    
    const newWidth = img.naturalWidth * cos + img.naturalHeight * sin;
    const newHeight = img.naturalWidth * sin + img.naturalHeight * cos;
    
    canvas.width = newWidth * (zoom / 100);
    canvas.height = newHeight * (zoom / 100);
    
    ctx.save();
    
    // Aplicar transformações
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(radians);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.scale(zoom / 100, zoom / 100);
    
    // Aplicar filtros
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    
    // Desenhar imagem
    ctx.drawImage(
      img,
      -img.naturalWidth / 2,
      -img.naturalHeight / 2,
      img.naturalWidth,
      img.naturalHeight
    );
    
    ctx.restore();
    
    return canvas.toDataURL('image/jpeg', 0.9);
  }, [rotation, flipH, flipV, zoom, brightness, contrast, saturation]);

  const handleConfirmEdit = async () => {
    setIsUploading(true);
    
    try {
      const editedDataUrl = applyEdits();
      if (!editedDataUrl) {
        throw new Error("Erro ao processar imagem");
      }
      
      // Converter dataURL para blob
      const response = await fetch(editedDataUrl);
      const blob = await response.blob();
      
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('file', blob, `image-${Date.now()}.jpg`);
      
      // Upload para S3 via API
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error("Erro no upload");
      }
      
      const { url, key } = await uploadResponse.json();
      
      // Salvar no banco de assets
      if (pageId) {
        await uploadAssetMutation.mutateAsync({
          pageId,
          filename: key,
          url,
          type: 'image',
          mimeType: 'image/jpeg',
        });
      }
      
      onImageSelect(url, {
        width: canvasRef.current?.width || 0,
        height: canvasRef.current?.height || 0,
        filename: key,
        fileSize: blob.size,
        mimeType: 'image/jpeg'
      });
      
      toast.success("Imagem salva com sucesso!");
      onOpenChange(false);
      resetState();
    } catch (error) {
      console.error('Erro ao salvar imagem:', error);
      toast.error("Erro ao salvar imagem. Tente novamente.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUseWithoutEdit = () => {
    if (previewImage) {
      onImageSelect(previewImage);
      onOpenChange(false);
      resetState();
    }
  };

  const resetState = () => {
    setPreviewImage(null);
    setOriginalImage(null);
    setShowEditor(false);
    setImageUrl("");
    resetEdits();
  };

  const handleDownload = () => {
    const editedDataUrl = applyEdits();
    if (!editedDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `imagem-editada-${Date.now()}.jpg`;
    link.href = editedDataUrl;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) resetState();
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            {showEditor ? "Editar Imagem" : "Selecionar Imagem"}
          </DialogTitle>
          <DialogDescription>
            {showEditor 
              ? "Ajuste a imagem antes de inserir" 
              : "Faça upload, cole uma URL ou escolha da biblioteca"}
          </DialogDescription>
        </DialogHeader>
        
        {!showEditor ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url">
                <Link2 className="h-4 w-4 mr-2" />
                URL
              </TabsTrigger>
              <TabsTrigger value="library">
                <ImageIcon className="h-4 w-4 mr-2" />
                Biblioteca
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="mt-4">
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Clique para selecionar</p>
                <p className="text-sm text-muted-foreground">ou arraste e solte uma imagem aqui</p>
                <p className="text-xs text-muted-foreground mt-2">PNG, JPG, GIF, WebP (máx. 10MB)</p>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="url" className="mt-4 space-y-4">
              <div>
                <Label>URL da Imagem</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    placeholder="https://exemplo.com/imagem.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                  />
                  <Button onClick={handleUrlSubmit}>
                    Carregar
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="library" className="mt-4">
              {loadingAssets ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : libraryAssets.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma imagem na biblioteca</p>
                  <p className="text-sm">Faça upload de imagens para usar aqui</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3 max-h-[400px] overflow-y-auto p-1">
                  {libraryAssets.map((asset: any) => (
                    <div 
                      key={asset.id}
                      className="aspect-square rounded-lg overflow-hidden border cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all"
                      onClick={() => handleLibrarySelect(asset)}
                    >
                      <img 
                        src={asset.url} 
                        alt={asset.alt || asset.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-4">
            {/* Preview da imagem com edições */}
            <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  ref={imageRef}
                  src={originalImage || ''}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1}) scale(${zoom / 100})`,
                    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
                  }}
                  crossOrigin="anonymous"
                />
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>
            
            {/* Controles de edição */}
            <div className="grid grid-cols-2 gap-4">
              {/* Transformações */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Transformar</h4>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setRotation((r) => (r - 90) % 360)}
                  >
                    <RotateCw className="h-4 w-4 mr-1" style={{ transform: 'scaleX(-1)' }} />
                    -90°
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                  >
                    <RotateCw className="h-4 w-4 mr-1" />
                    +90°
                  </Button>
                  <Button 
                    variant={flipH ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFlipH(!flipH)}
                  >
                    <FlipHorizontal className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={flipV ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFlipV(!flipV)}
                  >
                    <FlipVertical className="h-4 w-4" />
                  </Button>
                </div>
                
                <div>
                  <Label className="text-xs">Zoom: {zoom}%</Label>
                  <div className="flex items-center gap-2">
                    <ZoomOut className="h-4 w-4 text-muted-foreground" />
                    <Slider 
                      value={[zoom]}
                      onValueChange={([v]) => setZoom(v)}
                      min={10}
                      max={200}
                      step={5}
                      className="flex-1"
                    />
                    <ZoomIn className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
              
              {/* Ajustes */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Ajustes</h4>
                <div>
                  <Label className="text-xs">Brilho: {brightness}%</Label>
                  <Slider 
                    value={[brightness]}
                    onValueChange={([v]) => setBrightness(v)}
                    min={0}
                    max={200}
                    step={5}
                  />
                </div>
                <div>
                  <Label className="text-xs">Contraste: {contrast}%</Label>
                  <Slider 
                    value={[contrast]}
                    onValueChange={([v]) => setContrast(v)}
                    min={0}
                    max={200}
                    step={5}
                  />
                </div>
                <div>
                  <Label className="text-xs">Saturação: {saturation}%</Label>
                  <Slider 
                    value={[saturation]}
                    onValueChange={([v]) => setSaturation(v)}
                    min={0}
                    max={200}
                    step={5}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={resetEdits}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Resetar
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-1" />
                  Baixar
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditor(false)}>
                  <X className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <Button variant="outline" onClick={handleUseWithoutEdit}>
                  Usar Original
                </Button>
                <Button onClick={handleConfirmEdit} disabled={isUploading}>
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Aplicar e Inserir
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ImageUploader;
