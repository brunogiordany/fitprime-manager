/**
 * FitPrime Manager - Componente de Timer de Descanso
 * 
 * Timer visual para intervalos entre séries durante o treino
 * Inclui sons de alerta e vibração quando disponível
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Minus, 
  Volume2, 
  VolumeX,
  Timer,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RestTimerProps {
  defaultSeconds?: number;
  onComplete?: () => void;
  onClose?: () => void;
  exerciseName?: string;
  compact?: boolean;
}

// Presets de tempo em segundos
const TIME_PRESETS = [30, 45, 60, 90, 120, 180];

export default function RestTimer({ 
  defaultSeconds = 60, 
  onComplete, 
  onClose,
  exerciseName,
  compact = false 
}: RestTimerProps) {
  const [timeLeft, setTimeLeft] = useState(defaultSeconds);
  const [totalTime, setTotalTime] = useState(defaultSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Criar elemento de áudio para o alerta
  useEffect(() => {
    // Criar um beep usando Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioRef.current = new Audio();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Função para tocar o som de alerta
  const playAlert = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      
      // Beep triplo
      setTimeout(() => {
        oscillator.frequency.value = 1000;
      }, 150);
      setTimeout(() => {
        oscillator.frequency.value = 1200;
      }, 300);
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 450);
      
      // Vibrar se disponível
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (e) {
      console.log('Audio not available');
    }
  }, [soundEnabled]);

  // Timer countdown
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            playAlert();
            onComplete?.();
            return 0;
          }
          // Alerta nos últimos 3 segundos
          if (prev <= 4 && soundEnabled) {
            try {
              const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              oscillator.frequency.value = 600;
              oscillator.type = 'sine';
              gainNode.gain.value = 0.1;
              oscillator.start();
              setTimeout(() => {
                oscillator.stop();
                audioContext.close();
              }, 100);
            } catch (e) {}
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, soundEnabled, playAlert, onComplete]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
  };

  const adjustTime = (delta: number) => {
    const newTime = Math.max(5, Math.min(600, totalTime + delta));
    setTotalTime(newTime);
    if (!isRunning) {
      setTimeLeft(newTime);
    }
  };

  const setPresetTime = (seconds: number) => {
    setTotalTime(seconds);
    setTimeLeft(seconds);
    setIsRunning(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;
  const isAlmostDone = timeLeft <= 3 && timeLeft > 0;
  const isDone = timeLeft === 0;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 p-2 rounded-lg transition-all",
        isDone ? "bg-emerald-100 dark:bg-emerald-900/30" : 
        isAlmostDone ? "bg-red-100 dark:bg-red-900/30 animate-pulse" :
        isRunning ? "bg-blue-100 dark:bg-blue-900/30" : 
        "bg-gray-100 dark:bg-gray-800"
      )}>
        <Timer className={cn(
          "h-4 w-4",
          isDone ? "text-emerald-600" :
          isAlmostDone ? "text-red-600" :
          isRunning ? "text-blue-600" :
          "text-gray-600"
        )} />
        <span className={cn(
          "font-mono font-bold text-lg min-w-[50px]",
          isDone ? "text-emerald-600" :
          isAlmostDone ? "text-red-600" :
          isRunning ? "text-blue-600" :
          "text-gray-900 dark:text-gray-100"
        )}>
          {formatTime(timeLeft)}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={toggleTimer}
        >
          {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={resetTimer}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={cn(
      "overflow-hidden transition-all",
      isDone ? "border-emerald-500 shadow-emerald-100" : 
      isAlmostDone ? "border-red-500 shadow-red-100 animate-pulse" :
      isRunning ? "border-blue-500 shadow-blue-100" : ""
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className={cn(
              "h-5 w-5",
              isDone ? "text-emerald-600" :
              isAlmostDone ? "text-red-600" :
              isRunning ? "text-blue-600" :
              "text-gray-600"
            )} />
            <span className="font-medium">
              {exerciseName ? `Descanso - ${exerciseName}` : 'Timer de Descanso'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
            </Button>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress Ring */}
        <div className="relative flex items-center justify-center py-4">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-gray-700"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={2 * Math.PI * 70}
              strokeDashoffset={2 * Math.PI * 70 * (1 - progress / 100)}
              strokeLinecap="round"
              className={cn(
                "transition-all duration-1000",
                isDone ? "text-emerald-500" :
                isAlmostDone ? "text-red-500" :
                isRunning ? "text-blue-500" :
                "text-gray-400"
              )}
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className={cn(
              "font-mono text-4xl font-bold",
              isDone ? "text-emerald-600" :
              isAlmostDone ? "text-red-600" :
              isRunning ? "text-blue-600" :
              "text-gray-900 dark:text-gray-100"
            )}>
              {formatTime(timeLeft)}
            </span>
            {isDone && (
              <Badge variant="default" className="mt-2 bg-emerald-500">
                Pronto!
              </Badge>
            )}
          </div>
        </div>

        {/* Controles de tempo */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustTime(-15)}
            disabled={isRunning}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[60px] text-center">
            {formatTime(totalTime)}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => adjustTime(15)}
            disabled={isRunning}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2 justify-center">
          {TIME_PRESETS.map(seconds => (
            <Button
              key={seconds}
              variant={totalTime === seconds ? "default" : "outline"}
              size="sm"
              onClick={() => setPresetTime(seconds)}
              disabled={isRunning}
              className="text-xs"
            >
              {formatTime(seconds)}
            </Button>
          ))}
        </div>

        {/* Botões de controle */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={resetTimer}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button
            className={cn(
              "flex-1",
              isRunning 
                ? "bg-yellow-500 hover:bg-yellow-600" 
                : "bg-emerald-500 hover:bg-emerald-600"
            )}
            onClick={toggleTimer}
          >
            {isRunning ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                {timeLeft === totalTime ? 'Iniciar' : 'Continuar'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hook para usar o timer de descanso em qualquer componente
 */
export function useRestTimer(defaultSeconds: number = 60) {
  const [isOpen, setIsOpen] = useState(false);
  const [exerciseName, setExerciseName] = useState<string | undefined>();

  const openTimer = (name?: string) => {
    setExerciseName(name);
    setIsOpen(true);
  };

  const closeTimer = () => {
    setIsOpen(false);
    setExerciseName(undefined);
  };

  return {
    isOpen,
    exerciseName,
    openTimer,
    closeTimer,
    defaultSeconds,
  };
}
