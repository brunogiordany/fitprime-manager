import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageSquarePlus,
  Star,
  Zap,
  Heart,
  ThumbsUp,
  Dumbbell,
  Loader2,
  CheckCircle2,
  Smile,
  Meh,
  Frown,
} from "lucide-react";

interface Session {
  id: number;
  scheduledAt: Date | string;
  duration: number | null;
}

const MOOD_OPTIONS = [
  { value: "great", label: "Ótimo", icon: "😄", color: "text-green-500" },
  { value: "good", label: "Bem", icon: "🙂", color: "text-emerald-500" },
  { value: "neutral", label: "Normal", icon: "😐", color: "text-yellow-500" },
  { value: "tired", label: "Cansado", icon: "😓", color: "text-orange-500" },
  { value: "exhausted", label: "Exausto", icon: "😫", color: "text-red-500" },
];

export default function StudentFeedback() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState({
    energyLevel: 3,
    painLevel: 1,
    satisfactionLevel: 4,
    difficultyLevel: 3,
    mood: "good" as "great" | "good" | "neutral" | "tired" | "exhausted",
    highlights: "",
    improvements: "",
    notes: "",
  });

  const { data: sessionsNeedingFeedback, refetch } = trpc.studentPortal.sessionsNeedingFeedback.useQuery();

  const submitFeedbackMutation = trpc.studentPortal.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success("Feedback enviado com sucesso!");
      setDialogOpen(false);
      setSelectedSession(null);
      resetFeedback();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar feedback");
    },
  });

  const resetFeedback = () => {
    setFeedback({
      energyLevel: 3,
      painLevel: 1,
      satisfactionLevel: 4,
      difficultyLevel: 3,
      mood: "good",
      highlights: "",
      improvements: "",
      notes: "",
    });
  };

  const handleOpenFeedback = (session: Session) => {
    setSelectedSession(session);
    resetFeedback();
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!selectedSession) return;
    submitFeedbackMutation.mutate({
      sessionId: selectedSession.id,
      ...feedback,
    });
  };

  const RatingStars = ({
    value,
    onChange,
    label,
    icon: Icon,
  }: {
    value: number;
    onChange: (v: number) => void;
    label: string;
    icon: any;
  }) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 rounded transition-colors ${
              star <= value ? "text-yellow-400" : "text-gray-300"
            } hover:text-yellow-400`}
          >
            <Star className="h-6 w-6 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );

  if (!sessionsNeedingFeedback || sessionsNeedingFeedback.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-emerald-700">
            <MessageSquarePlus className="h-5 w-5" />
            Como foi seu treino?
          </CardTitle>
          <CardDescription>
            Dê seu feedback para ajudar seu personal a melhorar seus treinos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sessionsNeedingFeedback.map((session: Session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border"
              >
                <div>
                  <p className="font-medium text-sm">
                    {format(new Date(session.scheduledAt), "EEEE, dd/MM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(session.scheduledAt), "HH:mm")} - {session.duration} min
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleOpenFeedback(session)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <MessageSquarePlus className="h-4 w-4 mr-1" />
                  Avaliar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-emerald-500" />
              Avalie seu treino
            </DialogTitle>
            <DialogDescription>
              {selectedSession && (
                <>
                  {format(new Date(selectedSession.scheduledAt), "EEEE, dd 'de' MMMM", {
                    locale: ptBR,
                  })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Humor */}
            <div className="space-y-2">
              <Label>Como você está se sentindo?</Label>
              <div className="flex gap-2 justify-between">
                {MOOD_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFeedback({ ...feedback, mood: option.value as any })}
                    className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                      feedback.mood === option.value
                        ? "bg-emerald-100 border-2 border-emerald-500"
                        : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-2xl">{option.icon}</span>
                    <span className="text-xs mt-1">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Avaliações */}
            <div className="grid grid-cols-2 gap-4">
              <RatingStars
                value={feedback.energyLevel}
                onChange={(v) => setFeedback({ ...feedback, energyLevel: v })}
                label="Energia"
                icon={Zap}
              />
              <RatingStars
                value={feedback.satisfactionLevel}
                onChange={(v) => setFeedback({ ...feedback, satisfactionLevel: v })}
                label="Satisfação"
                icon={ThumbsUp}
              />
              <RatingStars
                value={feedback.difficultyLevel}
                onChange={(v) => setFeedback({ ...feedback, difficultyLevel: v })}
                label="Dificuldade"
                icon={Dumbbell}
              />
              <RatingStars
                value={feedback.painLevel}
                onChange={(v) => setFeedback({ ...feedback, painLevel: v })}
                label="Dor/Desconforto"
                icon={Heart}
              />
            </div>

            {/* Campos de texto */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="highlights">O que mais gostou?</Label>
                <Textarea
                  id="highlights"
                  placeholder="Ex: Gostei muito dos exercícios de perna..."
                  value={feedback.highlights}
                  onChange={(e) => setFeedback({ ...feedback, highlights: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="improvements">O que pode melhorar?</Label>
                <Textarea
                  id="improvements"
                  placeholder="Ex: Poderia ter mais tempo de descanso..."
                  value={feedback.improvements}
                  onChange={(e) => setFeedback({ ...feedback, improvements: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Outras observações..."
                  value={feedback.notes}
                  onChange={(e) => setFeedback({ ...feedback, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitFeedbackMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {submitFeedbackMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Enviar Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
