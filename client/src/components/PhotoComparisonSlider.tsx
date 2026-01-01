import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeftRight, 
  Calendar,
  TrendingUp,
  Sparkles,
  Loader2,
  RotateCcw,
  Maximize2
} from "lucide-react";
import { format, differenceInDays, differenceInWeeks, differenceInMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Photo {
  id: number;
  url: string;
  photoDate: string | Date;
  poseId?: string;
}

interface PhotoComparisonSliderProps {
  beforePhoto: Photo;
  afterPhoto: Photo;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
  analysisResult?: string;
  measurements?: {
    before?: {
      weight?: number;
      bodyFat?: number;
      chest?: number;
      waist?: number;
      hips?: number;
      arm?: number;
      thigh?: number;
    };
    after?: {
      weight?: number;
      bodyFat?: number;
      chest?: number;
      waist?: number;
      hips?: number;
      arm?: number;
      thigh?: number;
    };
  };
}

export function PhotoComparisonSlider({
  beforePhoto,
  afterPhoto,
  onAnalyze,
  isAnalyzing = false,
  analysisResult,
  measurements
}: PhotoComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcular tempo de evolução
  const getEvolutionTime = () => {
    const startDate = new Date(beforePhoto.photoDate);
    const endDate = new Date(afterPhoto.photoDate);
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

  // Calcular diferenças nas medidas
  const getMeasurementDiff = (before?: number, after?: number) => {
    if (before === undefined || after === undefined) return null;
    const diff = after - before;
    return {
      value: Math.abs(diff).toFixed(1),
      isPositive: diff > 0,
      isNegative: diff < 0,
      isNeutral: diff === 0
    };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const evolutionTime = getEvolutionTime();

  const SliderContent = ({ isFullscreen = false }: { isFullscreen?: boolean }) => (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden rounded-lg cursor-ew-resize select-none ${
        isFullscreen ? 'h-[70vh]' : 'aspect-[3/4] max-h-[400px]'
      }`}
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchEnd={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Foto "depois" (fundo) */}
      <img
        src={afterPhoto.url}
        alt="Depois"
        className="absolute inset-0 w-full h-full object-contain bg-gray-100"
        draggable={false}
      />
      
      {/* Foto "antes" (com clip) */}
      <div 
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforePhoto.url}
          alt="Antes"
          className="w-full h-full object-contain bg-gray-100"
          draggable={false}
        />
      </div>
      
      {/* Linha divisória com handle */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Handle circular */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-gray-200">
          <ArrowLeftRight className="h-5 w-5 text-gray-600" />
        </div>
        
        {/* Setas indicativas */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
          <div className="w-0 h-0 border-t-4 border-b-4 border-r-8 border-transparent border-r-white/80" />
          <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-white/80" />
        </div>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
          <div className="w-0 h-0 border-t-4 border-b-4 border-r-8 border-transparent border-r-white/80" />
          <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-white/80" />
        </div>
      </div>
      
      {/* Labels */}
      <div className="absolute top-3 left-3">
        <Badge variant="secondary" className="bg-black/60 text-white border-0">
          <Calendar className="h-3 w-3 mr-1" />
          {format(new Date(beforePhoto.photoDate), 'dd/MM/yy')}
        </Badge>
      </div>
      <div className="absolute top-3 right-3">
        <Badge className="bg-emerald-500 text-white border-0">
          <Calendar className="h-3 w-3 mr-1" />
          {format(new Date(afterPhoto.photoDate), 'dd/MM/yy')}
        </Badge>
      </div>
      
      {/* Tempo de evolução */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <Badge className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-0 px-3 py-1">
          <TrendingUp className="h-3 w-3 mr-1" />
          {evolutionTime} de evolução
        </Badge>
      </div>
      
      {/* Botão fullscreen */}
      {!isFullscreen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowFullscreen(true);
          }}
          className="absolute bottom-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
            Comparação Antes/Depois
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSliderPosition(50)}
            className="text-gray-500"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Resetar
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Slider de comparação */}
        <SliderContent />
        
        {/* Controle de slider */}
        <div className="px-2">
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Antes</span>
            <span>Depois</span>
          </div>
        </div>
        
        {/* Comparação de medidas */}
        {measurements && (measurements.before || measurements.after) && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Evolução das Medidas
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'weight', label: 'Peso', unit: 'kg', invertColor: true },
                { key: 'bodyFat', label: 'Gordura', unit: '%', invertColor: true },
                { key: 'chest', label: 'Peito', unit: 'cm', invertColor: false },
                { key: 'waist', label: 'Cintura', unit: 'cm', invertColor: true },
                { key: 'hips', label: 'Quadril', unit: 'cm', invertColor: false },
                { key: 'arm', label: 'Braço', unit: 'cm', invertColor: false },
                { key: 'thigh', label: 'Coxa', unit: 'cm', invertColor: false },
              ].map(({ key, label, unit, invertColor }) => {
                const before = measurements.before?.[key as keyof typeof measurements.before];
                const after = measurements.after?.[key as keyof typeof measurements.after];
                const diff = getMeasurementDiff(before, after);
                
                if (!diff) return null;
                
                const isGood = invertColor ? diff.isNegative : diff.isPositive;
                const isBad = invertColor ? diff.isPositive : diff.isNegative;
                
                return (
                  <div key={key} className="text-center p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-lg font-semibold">
                      {after}{unit}
                    </p>
                    {!diff.isNeutral && (
                      <p className={`text-xs font-medium ${
                        isGood ? 'text-emerald-600' : isBad ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {diff.isPositive ? '+' : '-'}{diff.value}{unit}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Botão de análise IA */}
        {onAnalyze && (
          <Button 
            className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600"
            onClick={onAnalyze}
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
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl border border-emerald-200">
            <h5 className="font-medium flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              Análise da Evolução
            </h5>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {analysisResult}
            </div>
          </div>
        )}
      </CardContent>
      
      {/* Modal fullscreen */}
      <Dialog open={showFullscreen} onOpenChange={setShowFullscreen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Comparação em Tela Cheia
            </DialogTitle>
          </DialogHeader>
          <SliderContent isFullscreen />
          <div className="px-4">
            <input
              type="range"
              min="0"
              max="100"
              value={sliderPosition}
              onChange={(e) => setSliderPosition(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
