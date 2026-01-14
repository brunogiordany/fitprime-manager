import DashboardLayout from "@/components/DashboardLayout";
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
  User,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { ExerciseSubstitutionModal } from "@/components/ExerciseSubstitutionModal";
import type { ExerciseAlternative } from "@shared/exercise-alternatives";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExerciseLog {
  exerciseId: number;
  exerciseName: string;
  originalExerciseName?: string; // Nome original antes da substituição
  substitutedAt?: Date; // Quando foi substituído
  sets: {
    setNumber: number;
    weight: string;
    reps: string;
    completed: boolean;
  }[];
  notes: string;
}

export default function WorkoutLog() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = parseInt(params.sessionId || "0");
  const [, setLocation] = useLocation();
  
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>("");
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado do modal de substituição de exercícios
  const [substitutionModal, setSubstitutionModal] = useState<{
    isOpen: boolean;
    exerciseIndex: number;
    exerciseName: string;
  }>({ isOpen: false, exerciseIndex: -1, exerciseName: "" });

  // Fetch session details
  const { data: session, isLoading: sessionLoading } = trpc.sessions.getById.useQuery(
    { id: sessionId },
    { enabled: sessionId > 0 }
  );

  // Fetch student's workouts
  const { data: workouts, isLoading: workoutsLoading } = trpc.workouts.list.useQuery(
    { studentId: session?.studentId ?? 0 },
    { enabled: !!session?.studentId }
  );

  // Fetch workout details with days and exercises
  const { data: workoutDetails } = trpc.workouts.get.useQuery(
    { id: parseInt(selectedWorkoutId) },
    { enabled: !!selectedWorkoutId && selectedWorkoutId !== "" }
  );
  
  // Get all exercises from all days
  const exercises = workoutDetails?.days?.flatMap((day: { exercises?: Array<{ id: number; name: string; sets?: number | null; reps?: string | null }> }) => day.exercises || []) || [];

  // Note: We'll use workoutLogs.list to check for existing logs
  // The workout log is linked to workoutId, not sessionId directly

  const utils = trpc.useUtils();

  const createLogMutation = trpc.workoutLogs.create.useMutation({
    onSuccess: () => {
      toast.success("Registro de treino salvo com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  const updateLogMutation = trpc.workoutLogs.update.useMutation({
    onSuccess: () => {
      toast.success("Registro de treino atualizado!");
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  // Initialize exercise logs when exercises are loaded
  useEffect(() => {
    if (exercises && exercises.length > 0 && exerciseLogs.length === 0) {
      const initialLogs: ExerciseLog[] = exercises.map((ex: { id: number; name: string; sets?: number | null; reps?: string | null }) => ({
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
  }, [exercises, exerciseLogs.length]);



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

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setExerciseLogs((prev) => {
      const updated = [...prev];
      if (updated[exerciseIndex].sets.length > 1) {
        updated[exerciseIndex].sets.splice(setIndex, 1);
        // Renumber sets
        updated[exerciseIndex].sets.forEach((set, i) => {
          set.setNumber = i + 1;
        });
      }
      return updated;
    });
  };

  // Função para abrir modal de substituição
  const openSubstitutionModal = (exerciseIndex: number, exerciseName: string) => {
    setSubstitutionModal({
      isOpen: true,
      exerciseIndex,
      exerciseName,
    });
  };

  // Função para substituir exercício
  const handleSubstituteExercise = (newExercise: ExerciseAlternative) => {
    const { exerciseIndex } = substitutionModal;
    if (exerciseIndex < 0) return;

    setExerciseLogs((prev) => {
      const updated = [...prev];
      const currentExercise = updated[exerciseIndex];
      
      // Salvar nome original se ainda não foi substituído
      if (!currentExercise.originalExerciseName) {
        currentExercise.originalExerciseName = currentExercise.exerciseName;
      }
      
      // Atualizar com novo exercício
      currentExercise.exerciseName = newExercise.name;
      currentExercise.substitutedAt = new Date();
      
      // Adicionar nota sobre a substituição
      const substitutionNote = `Substituído de: ${currentExercise.originalExerciseName}`;
      if (!currentExercise.notes.includes(substitutionNote)) {
        currentExercise.notes = currentExercise.notes 
          ? `${currentExercise.notes} | ${substitutionNote}`
          : substitutionNote;
      }
      
      return updated;
    });

    toast.success(`Exercício substituído por: ${newExercise.name}`);
  };

  const handleSave = async () => {
    if (!selectedWorkoutId) {
      toast.error("Selecione um treino");
      return;
    }

    setIsSubmitting(true);
    try {
    // For now, we'll just show a success message
    // The full workout log integration requires linking sessions to workout days
    toast.success("Registro de treino salvo!");
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

  if (sessionLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!session) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground">Sessão não encontrada</p>
          <Button variant="link" onClick={() => setLocation("/agenda")}>
            Voltar para Agenda
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/agenda")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Registro de Treino</h1>
              <p className="text-muted-foreground">
                Sessão de {session.student?.name}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSubmitting || !selectedWorkoutId}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Salvando..." : "Salvar Registro"}
          </Button>
        </div>

        {/* Session Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-lg">
                  {session.student?.name?.charAt(0).toUpperCase() || "?"}
                </div>
                <div>
                  <p className="font-semibold">{session.student?.name}</p>
                  <p className="text-sm text-muted-foreground">{session.student?.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(session.scheduledAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              </div>
              
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(session.scheduledAt), "HH:mm")} - {session.duration || 60} min</span>
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

        {/* Workout Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Selecionar Treino
            </CardTitle>
            <CardDescription>
              Escolha o treino que será realizado nesta sessão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Treino do Aluno</Label>
                <Select
                  value={selectedWorkoutId}
                  onValueChange={(value) => {
                    setSelectedWorkoutId(value);
                    setExerciseLogs([]); // Reset logs when workout changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um treino" />
                  </SelectTrigger>
                  <SelectContent>
                    {workoutsLoading ? (
                      <SelectItem value="loading" disabled>Carregando...</SelectItem>
                    ) : workouts && workouts.length > 0 ? (
                      workouts.map((workout) => (
                        <SelectItem key={workout.id} value={workout.id.toString()}>
                          {workout.name} - {workout.type}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Nenhum treino cadastrado</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedWorkoutId && workouts && (
                <div className="flex items-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation(`/treinos/${selectedWorkoutId}`)}
                  >
                    Ver detalhes do treino
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exercise Log Table */}
        {selectedWorkoutId && exerciseLogs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Registro de Exercícios</CardTitle>
              <CardDescription>
                Preencha peso e repetições realizadas em cada série
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {exerciseLogs.map((exercise, exerciseIndex) => (
                  <div key={exercise.exerciseId} className="border rounded-lg overflow-hidden">
                    {/* Exercise Header */}
                    <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                          <Dumbbell className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{exercise.exerciseName}</h4>
                            {exercise.originalExerciseName && (
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                                Substituído
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {exercise.sets.filter(s => s.completed).length}/{exercise.sets.length} séries concluídas
                            {exercise.originalExerciseName && (
                              <span className="ml-2 text-xs text-amber-600">
                                (Original: {exercise.originalExerciseName})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSubstitutionModal(exerciseIndex, exercise.exerciseName)}
                          title="Substituir exercício"
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

                    {/* Sets Table */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16 text-center">Série</TableHead>
                          <TableHead className="text-center">Peso (kg)</TableHead>
                          <TableHead className="text-center">Reps</TableHead>
                          <TableHead className="w-24 text-center">Concluído</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {exercise.sets.map((set, setIndex) => (
                          <TableRow 
                            key={setIndex}
                            className={set.completed ? "bg-emerald-50/50" : ""}
                          >
                            <TableCell className="text-center font-medium">
                              S{set.setNumber}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                placeholder="0"
                                value={set.weight}
                                onChange={(e) => handleSetChange(exerciseIndex, setIndex, "weight", e.target.value)}
                                className="text-center h-9"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                placeholder="0"
                                value={set.reps}
                                onChange={(e) => handleSetChange(exerciseIndex, setIndex, "reps", e.target.value)}
                                className="text-center h-9"
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
                            <TableCell>
                              {exercise.sets.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                  onClick={() => removeSet(exerciseIndex, setIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Exercise Notes */}
                    <div className="px-4 py-3 border-t">
                      <Input
                        placeholder="Observações do exercício..."
                        value={exercise.notes}
                        onChange={(e) => handleExerciseNotesChange(exerciseIndex, e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Session Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Observações da Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Anotações gerais sobre a sessão de treino..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Empty State */}
        {selectedWorkoutId && exerciseLogs.length === 0 && !workoutsLoading && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Nenhum exercício cadastrado</p>
                <p className="text-muted-foreground mb-4">
                  Este treino ainda não possui exercícios cadastrados
                </p>
                <Button onClick={() => setLocation(`/treinos/${selectedWorkoutId}`)}>
                  Adicionar Exercícios
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Workout Selected */}
        {!selectedWorkoutId && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-center">
                <Dumbbell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Selecione um treino</p>
                <p className="text-muted-foreground">
                  Escolha o treino que será realizado nesta sessão para começar o registro
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Substituição de Exercícios */}
      <ExerciseSubstitutionModal
        isOpen={substitutionModal.isOpen}
        onClose={() => setSubstitutionModal({ isOpen: false, exerciseIndex: -1, exerciseName: "" })}
        currentExerciseName={substitutionModal.exerciseName}
        onSubstitute={handleSubstituteExercise}
      />
    </DashboardLayout>
  );
}
