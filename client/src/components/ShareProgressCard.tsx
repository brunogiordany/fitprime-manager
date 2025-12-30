import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import {
  Share2,
  Download,
  Twitter,
  Copy,
  CheckCircle2,
  Loader2,
  Scale,
  Ruler,
  Dumbbell,
  TrendingUp,
  TrendingDown,
  Calendar,
  Award,
  Flame,
  Target,
} from "lucide-react";

// Tipos de contexto para compartilhamento
export type ShareContext = 
  | "measurements" // Medidas corporais
  | "sessions" // Sessões de treino
  | "evolution" // Evolução geral
  | "achievements" // Conquistas
  | "workout"; // Treino específico

interface MeasurementsData {
  currentWeight?: number;
  initialWeight?: number;
  weightChange?: number;
  currentBodyFat?: number;
  initialBodyFat?: number;
  bodyFatChange?: number;
  waistChange?: number;
  period?: string; // ex: "3 meses"
}

interface SessionsData {
  totalSessions: number;
  completedSessions: number;
  currentStreak: number;
  bestStreak?: number;
  attendanceRate?: number; // % de presença
  totalHours?: number;
}

interface EvolutionData {
  weightChange?: number;
  bodyFatChange?: number;
  muscleGain?: number;
  measurementsCount: number;
  sessionsCount: number;
  period: string;
  goal?: string;
}

interface AchievementsData {
  totalBadges: number;
  recentBadges: string[];
  level?: string;
  points?: number;
}

interface WorkoutData {
  workoutName: string;
  exercisesCount: number;
  duration: number;
  date: Date;
  personalRecord?: boolean;
}

interface ShareProgressCardProps {
  context: ShareContext;
  studentName: string;
  data: MeasurementsData | SessionsData | EvolutionData | AchievementsData | WorkoutData;
  variant?: "button" | "icon"; // Como exibir o trigger
  className?: string;
}

export default function ShareProgressCard({ 
  context, 
  studentName, 
  data, 
  variant = "button",
  className = ""
}: ShareProgressCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const getContextTitle = () => {
    switch (context) {
      case "measurements": return "Evolução Corporal";
      case "sessions": return "Histórico de Treinos";
      case "evolution": return "Meu Progresso";
      case "achievements": return "Minhas Conquistas";
      case "workout": return "Treino Realizado";
      default: return "Meu Progresso";
    }
  };

  const getContextIcon = () => {
    switch (context) {
      case "measurements": return Scale;
      case "sessions": return Dumbbell;
      case "evolution": return TrendingUp;
      case "achievements": return Award;
      case "workout": return Target;
      default: return Share2;
    }
  };

  const generateShareText = () => {
    const lines = [`🏋️ ${getContextTitle()} no FitPrime!`, ""];

    switch (context) {
      case "measurements": {
        const d = data as MeasurementsData;
        if (d.weightChange) {
          const icon = d.weightChange < 0 ? "📉" : "📈";
          lines.push(`${icon} ${Math.abs(d.weightChange).toFixed(1)}kg ${d.weightChange < 0 ? "eliminados" : "ganhos"}`);
        }
        if (d.bodyFatChange) {
          lines.push(`💪 ${Math.abs(d.bodyFatChange).toFixed(1)}% de gordura ${d.bodyFatChange < 0 ? "a menos" : "a mais"}`);
        }
        if (d.waistChange) {
          lines.push(`📏 ${Math.abs(d.waistChange).toFixed(1)}cm ${d.waistChange < 0 ? "a menos" : "a mais"} na cintura`);
        }
        if (d.period) {
          lines.push(`⏱️ Em ${d.period} de dedicação`);
        }
        break;
      }
      case "sessions": {
        const d = data as SessionsData;
        lines.push(`✅ ${d.completedSessions} sessões realizadas`);
        if (d.currentStreak > 0) {
          lines.push(`🔥 ${d.currentStreak} dias de sequência`);
        }
        if (d.attendanceRate) {
          lines.push(`📊 ${d.attendanceRate.toFixed(0)}% de presença`);
        }
        if (d.totalHours) {
          lines.push(`⏱️ ${d.totalHours.toFixed(0)}h de treino`);
        }
        break;
      }
      case "evolution": {
        const d = data as EvolutionData;
        if (d.weightChange) {
          const icon = d.weightChange < 0 ? "📉" : "📈";
          lines.push(`${icon} ${Math.abs(d.weightChange).toFixed(1)}kg de evolução`);
        }
        if (d.bodyFatChange) {
          lines.push(`💪 ${Math.abs(d.bodyFatChange).toFixed(1)}% gordura ${d.bodyFatChange < 0 ? "reduzida" : ""}`);
        }
        lines.push(`✅ ${d.sessionsCount} treinos realizados`);
        lines.push(`📊 ${d.measurementsCount} avaliações físicas`);
        if (d.goal) {
          lines.push(`🎯 Objetivo: ${d.goal}`);
        }
        break;
      }
      case "achievements": {
        const d = data as AchievementsData;
        lines.push(`🏆 ${d.totalBadges} conquistas desbloqueadas`);
        if (d.level) {
          lines.push(`⭐ Nível: ${d.level}`);
        }
        if (d.recentBadges.length > 0) {
          lines.push(`🎖️ Últimas: ${d.recentBadges.slice(0, 3).join(", ")}`);
        }
        break;
      }
      case "workout": {
        const d = data as WorkoutData;
        lines.push(`💪 ${d.workoutName}`);
        lines.push(`📋 ${d.exercisesCount} exercícios`);
        lines.push(`⏱️ ${d.duration} minutos`);
        if (d.personalRecord) {
          lines.push(`🏅 Novo recorde pessoal!`);
        }
        break;
      }
    }

    lines.push("");
    lines.push("#FitPrime #Treino #Evolução #Fitness");
    return lines.join("\n");
  };

  const handleCopyText = async () => {
    const text = generateShareText();
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      toast.success("Texto copiado!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Erro ao copiar texto");
    }
  };

  const handleShare = async (platform: string) => {
    const text = encodeURIComponent(generateShareText());
    let shareUrl = "";

    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
        break;
      case "native":
        if (navigator.share) {
          try {
            await navigator.share({
              title: getContextTitle(),
              text: generateShareText(),
              url: window.location.origin,
            });
            return;
          } catch (err) {
            // User cancelled
          }
        }
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const getGradientColors = () => {
    switch (context) {
      case "measurements": return { from: "#059669", to: "#047857" }; // Emerald
      case "sessions": return { from: "#2563eb", to: "#1d4ed8" }; // Blue
      case "evolution": return { from: "#7c3aed", to: "#6d28d9" }; // Purple
      case "achievements": return { from: "#f59e0b", to: "#d97706" }; // Amber
      case "workout": return { from: "#ef4444", to: "#dc2626" }; // Red
      default: return { from: "#059669", to: "#047857" };
    }
  };

  const handleDownloadCard = async () => {
    setGenerating(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");

      // Dimensões do card (formato story)
      canvas.width = 1080;
      canvas.height = 1920;

      const colors = getGradientColors();

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, colors.from);
      gradient.addColorStop(1, colors.to);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Padrão decorativo
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      for (let i = 0; i < 15; i++) {
        ctx.beginPath();
        ctx.arc(
          Math.random() * canvas.width,
          Math.random() * canvas.height,
          Math.random() * 100 + 50,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Logo/Título
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 80px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("FitPrime", canvas.width / 2, 200);

      // Subtítulo (contexto)
      ctx.font = "40px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText(getContextTitle(), canvas.width / 2, 280);

      // Nome do aluno
      ctx.font = "bold 56px system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(studentName, canvas.width / 2, 420);

      // Card de estatísticas
      const cardY = 500;
      const cardHeight = 900;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.roundRect(80, cardY, canvas.width - 160, cardHeight, 40);
      ctx.fill();

      // Renderizar estatísticas baseado no contexto
      ctx.textAlign = "left";
      let statY = cardY + 100;
      const statSpacing = 160;

      const renderStat = (icon: string, label: string, value: string, highlight = false) => {
        ctx.font = "60px system-ui, sans-serif";
        ctx.fillStyle = "#1f2937";
        ctx.fillText(icon, 140, statY);

        ctx.font = "32px system-ui, sans-serif";
        ctx.fillStyle = "#6b7280";
        ctx.fillText(label, 240, statY - 20);

        ctx.font = highlight ? "bold 64px system-ui, sans-serif" : "bold 52px system-ui, sans-serif";
        ctx.fillStyle = highlight ? colors.from : "#1f2937";
        ctx.fillText(value, 240, statY + 45);

        statY += statSpacing;
      };

      switch (context) {
        case "measurements": {
          const d = data as MeasurementsData;
          if (d.weightChange !== undefined) {
            const icon = d.weightChange < 0 ? "📉" : "📈";
            renderStat(icon, "Variação de Peso", `${d.weightChange > 0 ? "+" : ""}${d.weightChange.toFixed(1)} kg`, true);
          }
          if (d.currentWeight) {
            renderStat("⚖️", "Peso Atual", `${d.currentWeight.toFixed(1)} kg`);
          }
          if (d.bodyFatChange !== undefined) {
            renderStat("💪", "Variação % Gordura", `${d.bodyFatChange > 0 ? "+" : ""}${d.bodyFatChange.toFixed(1)}%`, true);
          }
          if (d.waistChange !== undefined) {
            renderStat("📏", "Variação Cintura", `${d.waistChange > 0 ? "+" : ""}${d.waistChange.toFixed(1)} cm`);
          }
          if (d.period) {
            renderStat("⏱️", "Período", d.period);
          }
          break;
        }
        case "sessions": {
          const d = data as SessionsData;
          renderStat("✅", "Sessões Realizadas", d.completedSessions.toString(), true);
          if (d.currentStreak > 0) {
            renderStat("🔥", "Sequência Atual", `${d.currentStreak} dias`);
          }
          if (d.bestStreak) {
            renderStat("🏆", "Melhor Sequência", `${d.bestStreak} dias`);
          }
          if (d.attendanceRate) {
            renderStat("📊", "Taxa de Presença", `${d.attendanceRate.toFixed(0)}%`);
          }
          if (d.totalHours) {
            renderStat("⏱️", "Horas de Treino", `${d.totalHours.toFixed(0)}h`);
          }
          break;
        }
        case "evolution": {
          const d = data as EvolutionData;
          if (d.weightChange !== undefined) {
            const icon = d.weightChange < 0 ? "📉" : "📈";
            renderStat(icon, "Evolução de Peso", `${d.weightChange > 0 ? "+" : ""}${d.weightChange.toFixed(1)} kg`, true);
          }
          if (d.bodyFatChange !== undefined) {
            renderStat("💪", "% Gordura", `${d.bodyFatChange > 0 ? "+" : ""}${d.bodyFatChange.toFixed(1)}%`);
          }
          renderStat("✅", "Treinos Realizados", d.sessionsCount.toString());
          renderStat("📊", "Avaliações Físicas", d.measurementsCount.toString());
          if (d.goal) {
            renderStat("🎯", "Objetivo", d.goal);
          }
          break;
        }
        case "achievements": {
          const d = data as AchievementsData;
          renderStat("🏆", "Conquistas", d.totalBadges.toString(), true);
          if (d.level) {
            renderStat("⭐", "Nível", d.level);
          }
          if (d.points) {
            renderStat("💎", "Pontos", d.points.toString());
          }
          break;
        }
        case "workout": {
          const d = data as WorkoutData;
          renderStat("💪", "Treino", d.workoutName, true);
          renderStat("📋", "Exercícios", d.exercisesCount.toString());
          renderStat("⏱️", "Duração", `${d.duration} min`);
          if (d.personalRecord) {
            renderStat("🏅", "Recorde", "Novo PR!");
          }
          break;
        }
      }

      // Hashtags
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "32px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("#FitPrime #Treino #Evolução", canvas.width / 2, canvas.height - 100);

      // Download
      const link = document.createElement("a");
      link.download = `fitprime-${context}-${studentName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("Card de progresso baixado!");
    } catch (err) {
      toast.error("Erro ao gerar imagem");
    } finally {
      setGenerating(false);
    }
  };

  const renderPreviewContent = () => {
    switch (context) {
      case "measurements": {
        const d = data as MeasurementsData;
        return (
          <div className="grid grid-cols-2 gap-3 text-center">
            {d.weightChange !== undefined && (
              <div className="col-span-2">
                <p className="text-3xl font-bold text-emerald-600">
                  {d.weightChange > 0 ? "+" : ""}{d.weightChange.toFixed(1)} kg
                </p>
                <p className="text-xs text-gray-500">Variação de Peso</p>
              </div>
            )}
            {d.currentWeight && (
              <div>
                <p className="text-xl font-bold text-gray-700">{d.currentWeight.toFixed(1)} kg</p>
                <p className="text-xs text-gray-500">Peso Atual</p>
              </div>
            )}
            {d.bodyFatChange !== undefined && (
              <div>
                <p className="text-xl font-bold text-blue-600">
                  {d.bodyFatChange > 0 ? "+" : ""}{d.bodyFatChange.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">% Gordura</p>
              </div>
            )}
            {d.waistChange !== undefined && (
              <div>
                <p className="text-xl font-bold text-purple-600">
                  {d.waistChange > 0 ? "+" : ""}{d.waistChange.toFixed(1)} cm
                </p>
                <p className="text-xs text-gray-500">Cintura</p>
              </div>
            )}
            {d.period && (
              <div>
                <p className="text-xl font-bold text-orange-500">{d.period}</p>
                <p className="text-xs text-gray-500">Período</p>
              </div>
            )}
          </div>
        );
      }
      case "sessions": {
        const d = data as SessionsData;
        return (
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-600">{d.completedSessions}</p>
              <p className="text-xs text-gray-500">Sessões</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-500">{d.currentStreak}</p>
              <p className="text-xs text-gray-500">Sequência</p>
            </div>
            {d.attendanceRate !== undefined && (
              <div>
                <p className="text-2xl font-bold text-blue-600">{d.attendanceRate.toFixed(0)}%</p>
                <p className="text-xs text-gray-500">Presença</p>
              </div>
            )}
            {d.totalHours !== undefined && (
              <div>
                <p className="text-2xl font-bold text-purple-600">{d.totalHours.toFixed(0)}h</p>
                <p className="text-xs text-gray-500">Total</p>
              </div>
            )}
          </div>
        );
      }
      case "evolution": {
        const d = data as EvolutionData;
        return (
          <div className="grid grid-cols-2 gap-3 text-center">
            {d.weightChange !== undefined && (
              <div className="col-span-2">
                <p className="text-3xl font-bold text-emerald-600">
                  {d.weightChange > 0 ? "+" : ""}{d.weightChange.toFixed(1)} kg
                </p>
                <p className="text-xs text-gray-500">Evolução de Peso</p>
              </div>
            )}
            <div>
              <p className="text-xl font-bold text-blue-600">{d.sessionsCount}</p>
              <p className="text-xs text-gray-500">Treinos</p>
            </div>
            <div>
              <p className="text-xl font-bold text-purple-600">{d.measurementsCount}</p>
              <p className="text-xs text-gray-500">Avaliações</p>
            </div>
            {d.goal && (
              <div className="col-span-2">
                <p className="text-sm font-medium text-gray-700">🎯 {d.goal}</p>
              </div>
            )}
          </div>
        );
      }
      case "achievements": {
        const d = data as AchievementsData;
        return (
          <div className="text-center space-y-3">
            <p className="text-4xl font-bold text-amber-500">{d.totalBadges}</p>
            <p className="text-sm text-gray-500">Conquistas Desbloqueadas</p>
            {d.level && (
              <p className="text-lg font-medium text-gray-700">⭐ Nível: {d.level}</p>
            )}
          </div>
        );
      }
      case "workout": {
        const d = data as WorkoutData;
        return (
          <div className="text-center space-y-2">
            <p className="text-xl font-bold text-gray-800">{d.workoutName}</p>
            <div className="flex justify-center gap-4 text-sm">
              <span className="text-gray-600">📋 {d.exercisesCount} exercícios</span>
              <span className="text-gray-600">⏱️ {d.duration} min</span>
            </div>
            {d.personalRecord && (
              <p className="text-amber-500 font-medium">🏅 Novo Recorde Pessoal!</p>
            )}
          </div>
        );
      }
    }
  };

  const getCardGradient = () => {
    switch (context) {
      case "measurements": return "from-emerald-500 to-emerald-700";
      case "sessions": return "from-blue-500 to-blue-700";
      case "evolution": return "from-purple-500 to-purple-700";
      case "achievements": return "from-amber-500 to-amber-700";
      case "workout": return "from-red-500 to-red-700";
      default: return "from-emerald-500 to-emerald-700";
    }
  };

  const Icon = getContextIcon();

  return (
    <>
      {variant === "button" ? (
        <Button
          onClick={() => setDialogOpen(true)}
          variant="outline"
          className={`gap-2 ${className}`}
        >
          <Share2 className="h-4 w-4" />
          Compartilhar
        </Button>
      ) : (
        <Button
          onClick={() => setDialogOpen(true)}
          variant="ghost"
          size="icon"
          className={className}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Compartilhar {getContextTitle()}
            </DialogTitle>
            <DialogDescription>
              Escolha como deseja compartilhar sua evolução
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview do card */}
            <div className={`bg-gradient-to-br ${getCardGradient()} rounded-xl p-6 text-white`}>
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">FitPrime</h3>
                <p className="text-sm opacity-80">{getContextTitle()}</p>
              </div>
              <div className="bg-white/95 rounded-lg p-4 text-gray-800">
                <p className="font-bold text-lg mb-3 text-center">{studentName}</p>
                {renderPreviewContent()}
              </div>
            </div>

            {/* Botões de compartilhamento */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => handleShare("whatsapp")}
                className="flex items-center gap-2"
              >
                <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("twitter")}
                className="flex items-center gap-2"
              >
                <Twitter className="h-5 w-5 text-blue-400" />
                Twitter
              </Button>
              <Button
                variant="outline"
                onClick={handleCopyText}
                className="flex items-center gap-2"
              >
                {copied ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <Copy className="h-5 w-5" />
                )}
                {copied ? "Copiado!" : "Copiar Texto"}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleShare("native")}
                className="flex items-center gap-2"
              >
                <Share2 className="h-5 w-5" />
                Mais opções
              </Button>
            </div>

            {/* Download do card */}
            <Button
              onClick={handleDownloadCard}
              disabled={generating}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Baixar Card para Stories
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
