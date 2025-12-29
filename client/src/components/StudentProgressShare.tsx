import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Share2,
  Download,
  Instagram,
  Facebook,
  Twitter,
  Copy,
  CheckCircle2,
  TrendingUp,
  Dumbbell,
  Calendar,
  Award,
  Loader2,
} from "lucide-react";

interface ProgressData {
  totalSessions: number;
  completedSessions: number;
  currentStreak: number;
  totalBadges: number;
  weightChange?: number;
  memberSince: Date | string;
}

interface StudentProgressShareProps {
  studentName: string;
  progressData: ProgressData;
}

export default function StudentProgressShare({ studentName, progressData }: StudentProgressShareProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const generateShareText = () => {
    const lines = [
      `🏋️ Meu progresso no FitPrime!`,
      ``,
      `✅ ${progressData.completedSessions} sessões realizadas`,
      `🔥 ${progressData.currentStreak} dias de sequência`,
      `🏆 ${progressData.totalBadges} conquistas desbloqueadas`,
    ];
    
    if (progressData.weightChange) {
      const direction = progressData.weightChange > 0 ? "+" : "";
      lines.push(`⚖️ ${direction}${progressData.weightChange.toFixed(1)}kg de evolução`);
    }
    
    lines.push(``);
    lines.push(`#FitPrime #Treino #Evolução #Fitness`);
    
    return lines.join("\n");
  };

  const handleCopyText = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Texto copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar texto");
    }
  };

  const handleShare = async (platform: string) => {
    const text = encodeURIComponent(generateShareText());
    const url = encodeURIComponent(window.location.origin);
    
    let shareUrl = "";
    
    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${text}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?quote=${text}`;
        break;
      case "native":
        if (navigator.share) {
          try {
            await navigator.share({
              title: "Meu progresso no FitPrime",
              text: generateShareText(),
              url: window.location.origin,
            });
            return;
          } catch (err) {
            // User cancelled or error
          }
        }
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  };

  const handleDownloadCard = async () => {
    setGenerating(true);
    
    try {
      // Criar um canvas com o card de progresso
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not supported");
      
      // Dimensões do card (formato story)
      canvas.width = 1080;
      canvas.height = 1920;
      
      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#059669");
      gradient.addColorStop(1, "#047857");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Padrão decorativo
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      for (let i = 0; i < 20; i++) {
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
      
      // Subtítulo
      ctx.font = "40px system-ui, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillText("Meu Progresso", canvas.width / 2, 280);
      
      // Nome do aluno
      ctx.font = "bold 60px system-ui, sans-serif";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(studentName, canvas.width / 2, 450);
      
      // Card de estatísticas
      const cardY = 550;
      const cardHeight = 800;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.roundRect(80, cardY, canvas.width - 160, cardHeight, 40);
      ctx.fill();
      
      // Estatísticas
      ctx.fillStyle = "#1f2937";
      ctx.textAlign = "left";
      const stats = [
        { icon: "✅", label: "Sessões Realizadas", value: progressData.completedSessions.toString() },
        { icon: "🔥", label: "Dias de Sequência", value: progressData.currentStreak.toString() },
        { icon: "🏆", label: "Conquistas", value: progressData.totalBadges.toString() },
      ];
      
      if (progressData.weightChange) {
        const direction = progressData.weightChange > 0 ? "+" : "";
        stats.push({
          icon: "⚖️",
          label: "Evolução de Peso",
          value: `${direction}${progressData.weightChange.toFixed(1)}kg`,
        });
      }
      
      let statY = cardY + 100;
      for (const stat of stats) {
        ctx.font = "60px system-ui, sans-serif";
        ctx.fillText(stat.icon, 140, statY);
        
        ctx.font = "36px system-ui, sans-serif";
        ctx.fillStyle = "#6b7280";
        ctx.fillText(stat.label, 240, statY - 20);
        
        ctx.font = "bold 56px system-ui, sans-serif";
        ctx.fillStyle = "#059669";
        ctx.fillText(stat.value, 240, statY + 40);
        
        statY += 170;
      }
      
      // Hashtags
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "32px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("#FitPrime #Treino #Evolução", canvas.width / 2, canvas.height - 100);
      
      // Download
      const link = document.createElement("a");
      link.download = `fitprime-progresso-${studentName.toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Card de progresso baixado!");
    } catch (err) {
      toast.error("Erro ao gerar imagem");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-purple-700 text-lg">
            <Share2 className="h-5 w-5" />
            Compartilhe seu Progresso
          </CardTitle>
          <CardDescription>
            Mostre sua evolução nas redes sociais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-emerald-600">{progressData.completedSessions}</p>
              <p className="text-xs text-gray-500">Sessões</p>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <p className="text-2xl font-bold text-orange-500">{progressData.currentStreak}</p>
              <p className="text-xs text-gray-500">Sequência</p>
            </div>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-purple-500" />
              Compartilhar Progresso
            </DialogTitle>
            <DialogDescription>
              Escolha como deseja compartilhar sua evolução
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview do card */}
            <div
              ref={cardRef}
              className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl p-6 text-white"
            >
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold">FitPrime</h3>
                <p className="text-sm opacity-80">Meu Progresso</p>
              </div>
              <div className="bg-white/90 rounded-lg p-4 text-gray-800">
                <p className="font-bold text-lg mb-3 text-center">{studentName}</p>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-emerald-600">{progressData.completedSessions}</p>
                    <p className="text-xs text-gray-500">Sessões</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-500">{progressData.currentStreak}</p>
                    <p className="text-xs text-gray-500">Sequência</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">{progressData.totalBadges}</p>
                    <p className="text-xs text-gray-500">Conquistas</p>
                  </div>
                  {progressData.weightChange && (
                    <div>
                      <p className="text-2xl font-bold text-blue-600">
                        {progressData.weightChange > 0 ? "+" : ""}{progressData.weightChange.toFixed(1)}kg
                      </p>
                      <p className="text-xs text-gray-500">Evolução</p>
                    </div>
                  )}
                </div>
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
