import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft, 
  Save, 
  Dumbbell, 
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  LogOut,
  RefreshCw
} from "lucide-react";
import { ExerciseSubstitutionModal } from "@/components/ExerciseSubstitutionModal";
import type { ExerciseAlternative } from "@shared/exercise-alternatives";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getLoginUrl } from "@/const";

interface ExerciseLog {
  exerciseId: number;
  exerciseName: string;
  originalExerciseName?: string; // Nome original antes da substituição
  substitutedAt?: Date; // Data/hora da substituição
  sets: {
    setNumber: number;
    weight: string;
    reps: string;
    completed: boolean;
  }[];
  notes: string;
}

export default function StudentWorkoutLog() {
  const params = useParams<{ workoutId: string }>();
  const workoutId = parseInt(params.workoutId || "0");
  const [, setLocation] = useLocation();
  const { user, loading: authLoading, logout } = useAuth();
  
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [duration, setDuration] = useState("60");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para modal de substituição de exercício
  const [substitutionModalOpen, setSubstitutionModalOpen] = useState(false);
  const [substitutingExerciseIndex, setSubstitutingExerciseIndex] = useState<number | null>(null);

  // Buscar perfil do aluno
  const { data: profile, isLoading: profileLoading } = trpc.studentPortal.profile.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Buscar detalhes do treino
  const { data: workout, isLoading: workoutLoading } = trpc.studentPortal.workout.useQuery(
    { id: workoutId },
    { enabled: workoutId > 0 && !!user }
  );

  const utils = trpc.useUtils();

  const createLogMutation = trpc.studentPortal.createWorkoutLog.useMutation({
    onSuccess: () => {
      toast.success("Treino registrado com sucesso! Seu personal foi notificado.");
      setLocation("/portal");
    },
    onError: (error) => {
      toast.error("Erro ao registrar treino: " + error.message);
    },
  });

  // Inicializar logs de exercícios quando um dia é selecionado
  useEffect(() => {
    if (selectedDayId && workout?.days) {
      const day = workout.days.find((d: any) => d.id === parseInt(selectedDayId));
      if (day?.exercises) {
        const initialLogs: ExerciseLog[] = day.exercises.map((ex: any) => ({
          exerciseId: ex.id,
          exerciseName: ex.name,
          sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
            setNumber: i + 1,
            weight: "",
            reps: ex.reps || "",
            completed: false,
          })),
          notes: "",
        }));
        setExerciseLogs(initialLogs);
      }
    }
  }, [selectedDayId, workout]);

  const handleSetChange = (
    exerciseIndex: number,
    setIndex: number,
    field: "weight" | "reps" | "completed",
    value: string | boolean
  ) => {
    setExerciseLogs((prev) => {
      const updated = [...prev];
      if (field === "completed") {
        updated[exerciseIndex].sets[setIndex].completed = value as boolean;
      } else {
        updated[exerciseIndex].sets[setIndex][field] = value as string;
      }
      return updated;
    });
  };

  const handleExerciseNotesChange = (exerciseIndex: number, notes: string) => {
    setExerciseLogs((prev) => {
      const updated = [...prev];
      updated[exerciseIndex].notes = notes;
      return updated;
    });
  };

  const addSet = (exerciseIndex: number) => {
    setExerciseLogs((prev) => {
      const updated = [...prev];
      const lastSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1];
      updated[exerciseIndex].sets.push({
        setNumber: updated[exerciseIndex].sets.length + 1,
        weight: lastSet?.weight || "",
        reps: lastSet?.reps || "",
        completed: false,
      });
      return updated;
    });
  };

  // Abrir modal de substituição
  const openSubstitutionModal = (exerciseIndex: number) => {
    setSubstitutingExerciseIndex(exerciseIndex);
    setSubstitutionModalOpen(true);
  };

  // Processar substituição de exercício
  const handleExerciseSubstitution = (newExercise: ExerciseAlternative) => {
    if (substitutingExerciseIndex === null) return;
    
    setExerciseLogs((prev) => {
      const updated = [...prev];
      const currentExercise = updated[substitutingExerciseIndex];
      
      // Salvar nome original se ainda não foi substituído
      const originalName = currentExercise.originalExerciseName || currentExercise.exerciseName;
      
      // Atualizar exercício
      updated[substitutingExerciseIndex] = {
        ...currentExercise,
        exerciseName: newExercise.name,
        originalExerciseName: originalName,
        substitutedAt: new Date(),
        notes: currentExercise.notes 
          ? `${currentExercise.notes} | Substituído: ${originalName} → ${newExercise.name}`
          : `Substituído: ${originalName} → ${newExercise.name}`,
      };
      
      return updated;
    });
    
    toast.success(`Exercício substituído para: ${newExercise.name}`);
    setSubstitutionModalOpen(false);
    setSubstitutingExerciseIndex(null);
  };

  const handleSave = async () => {
    if (!selectedDayId) {
      toast.error("Selecione um dia de treino");
      return;
    }

    setIsSubmitting(true);
    try {
      // Converter exerciseLogs para o formato esperado pela API
      const exercises = exerciseLogs.map((ex) => ({
        exerciseId: ex.exerciseId,
        exerciseName: ex.exerciseName,
        set1Weight: ex.sets[0]?.weight,
        set1Reps: ex.sets[0]?.reps ? parseInt(ex.sets[0].reps) : undefined,
        set2Weight: ex.sets[1]?.weight,
        set2Reps: ex.sets[1]?.reps ? parseInt(ex.sets[1].reps) : undefined,
        set3Weight: ex.sets[2]?.weight,
        set3Reps: ex.sets[2]?.reps ? parseInt(ex.sets[2].reps) : undefined,
        set4Weight: ex.sets[3]?.weight,
        set4Reps: ex.sets[3]?.reps ? parseInt(ex.sets[3].reps) : undefined,
        set5Weight: ex.sets[4]?.weight,
        set5Reps: ex.sets[4]?.reps ? parseInt(ex.sets[4].reps) : undefined,
        notes: ex.notes,
        completed: ex.sets.some(s => s.completed),
      }));

      await createLogMutation.mutateAsync({
        workoutId,
        workoutDayId: parseInt(selectedDayId),
        trainingDate: new Date().toISOString(),
        duration: parseInt(duration),
        notes: sessionNotes,
        exercises,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedSets = exerciseLogs.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  const totalSets = exerciseLogs.reduce((acc, ex) => acc + ex.sets.length, 0);
  const progressPercent = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
              <Dumbbell className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Portal do Aluno</CardTitle>
            <CardDescription>
              Faça login para registrar seu treino
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <CardTitle>Acesso Restrito</CardTitle>
            <CardDescription>
              Você não está cadastrado como aluno. Entre em contato com seu personal trainer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => logout()}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (workoutLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <header className="bg-white border-b sticky top-0 z-50">
          <div className="container max-w-4xl mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container max-w-4xl mx-auto px-4 py-6">
          <Skeleton className="h-[400px] w-full" />
        </main>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle>Treino não encontrado</CardTitle>
            <CardDescription>
              Este treino não existe ou não está disponível para você.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full" onClick={() => setLocation("/portal")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/portal")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">Registrar Treino</h1>
              <p className="text-xs text-muted-foreground">{workout.name}</p>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={isSubmitting || !selectedDayId}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-20 h-8"
                  min="1"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>

              {totalSets > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{progressPercent}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Day Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Selecionar Dia de Treino
            </CardTitle>
            <CardDescription>
              Escolha qual dia do treino você vai realizar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedDayId} onValueChange={setSelectedDayId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o dia..." />
              </SelectTrigger>
              <SelectContent>
                {workout.days?.map((day: any) => (
                  <SelectItem key={day.id} value={day.id.toString()}>
                    {day.name} - {day.exercises?.length || 0} exercícios
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Exercise Logs */}
        {selectedDayId && exerciseLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Exercícios</CardTitle>
              <CardDescription>
                Registre o peso e repetições de cada série
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {exerciseLogs.map((exercise, exerciseIndex) => (
                  <div key={exercise.exerciseId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col gap-1">
                        <h4 className="font-semibold text-lg">{exercise.exerciseName}</h4>
                        {exercise.originalExerciseName && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <RefreshCw className="h-3 w-3" />
                            Substituído de: {exercise.originalExerciseName}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSubstitutionModal(exerciseIndex)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Trocar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addSet(exerciseIndex)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Série
                        </Button>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Série</TableHead>
                          <TableHead>Peso (kg)</TableHead>
                          <TableHead>Reps</TableHead>
                          <TableHead className="w-16 text-center">✓</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exercise.sets.map((set, setIndex) => (
                          <TableRow key={setIndex}>
                            <TableCell className="font-medium">S{set.setNumber}</TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                value={set.weight}
                                onChange={(e) => handleSetChange(exerciseIndex, setIndex, "weight", e.target.value)}
                                placeholder="0"
                                className="w-20 h-8"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                value={set.reps}
                                onChange={(e) => handleSetChange(exerciseIndex, setIndex, "reps", e.target.value)}
                                placeholder="0"
                                className="w-20 h-8"
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox
                                checked={set.completed}
                                onCheckedChange={(checked) => 
                                  handleSetChange(exerciseIndex, setIndex, "completed", checked as boolean)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <div className="mt-3">
                      <Input
                        placeholder="Observações do exercício..."
                        value={exercise.notes}
                        onChange={(e) => handleExerciseNotesChange(exerciseIndex, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Notes */}
        {selectedDayId && (
          <Card>
            <CardHeader>
              <CardTitle>Observações Gerais</CardTitle>
              <CardDescription>
                Adicione notas sobre o treino de hoje
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Como foi o treino? Alguma dificuldade ou conquista?"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {selectedDayId && exerciseLogs.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">Nenhum exercício neste dia</p>
              <p className="text-muted-foreground text-sm">
                Este dia de treino não possui exercícios cadastrados
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      
      {/* Modal de Substituição de Exercício */}
      <ExerciseSubstitutionModal
        isOpen={substitutionModalOpen}
        onClose={() => {
          setSubstitutionModalOpen(false);
          setSubstitutingExerciseIndex(null);
        }}
        currentExerciseName={substitutingExerciseIndex !== null ? exerciseLogs[substitutingExerciseIndex]?.exerciseName || '' : ''}
        currentMuscleGroup={undefined}
        onSubstitute={handleExerciseSubstitution}
      />
    </div>
  );
}
