import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { 
  Dumbbell, 
  Plus, 
  ArrowLeft,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Calendar,
  Clock,
  Target,
  Repeat,
  Weight,
  Timer,
  GripVertical,
  Save,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useParams, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Segunda-feira', short: 'Seg' },
  { value: 'tuesday', label: 'Terça-feira', short: 'Ter' },
  { value: 'wednesday', label: 'Quarta-feira', short: 'Qua' },
  { value: 'thursday', label: 'Quinta-feira', short: 'Qui' },
  { value: 'friday', label: 'Sexta-feira', short: 'Sex' },
  { value: 'saturday', label: 'Sábado', short: 'Sáb' },
  { value: 'sunday', label: 'Domingo', short: 'Dom' },
];

const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Antebraço',
  'Abdômen', 'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha',
  'Trapézio', 'Lombar', 'Core', 'Cardio', 'Corpo Inteiro'
];

export default function WorkoutDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const workoutId = parseInt(params.id || '0');

  const [isEditingWorkout, setIsEditingWorkout] = useState(false);
  const [isAddDayDialogOpen, setIsAddDayDialogOpen] = useState(false);
  const [isEditDayDialogOpen, setIsEditDayDialogOpen] = useState(false);
  const [isAddExerciseDialogOpen, setIsAddExerciseDialogOpen] = useState(false);
  const [isEditExerciseDialogOpen, setIsEditExerciseDialogOpen] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<number | null>(null);
  const [editingDay, setEditingDay] = useState<any>(null);
  const [editingExercise, setEditingExercise] = useState<any>(null);

  const [workoutForm, setWorkoutForm] = useState({
    name: '',
    description: '',
    type: 'strength' as const,
    difficulty: 'intermediate' as const,
    notes: '',
  });

  const [newDay, setNewDay] = useState({
    dayOfWeek: 'monday' as const,
    name: '',
    notes: '',
  });

  const [editDayForm, setEditDayForm] = useState({
    dayOfWeek: 'monday' as const,
    name: '',
    notes: '',
  });

  const [exerciseForm, setExerciseForm] = useState({
    name: '',
    muscleGroup: '',
    sets: 3,
    reps: '10-12',
    weight: '',
    restSeconds: 60,
    tempo: '',
    notes: '',
    videoUrl: '',
  });

  const utils = trpc.useUtils();

  const { data: workout, isLoading, refetch } = trpc.workouts.get.useQuery(
    { id: workoutId },
    { enabled: workoutId > 0 }
  );

  const updateWorkoutMutation = trpc.workouts.update.useMutation({
    onSuccess: () => {
      toast.success("Treino atualizado!");
      setIsEditingWorkout(false);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const createDayMutation = trpc.workoutDays.create.useMutation({
    onSuccess: () => {
      toast.success("Dia adicionado!");
      setIsAddDayDialogOpen(false);
      setNewDay({ dayOfWeek: 'monday', name: '', notes: '' });
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar dia: " + error.message);
    },
  });

  const updateDayMutation = trpc.workoutDays.update.useMutation({
    onSuccess: () => {
      toast.success("Dia atualizado!");
      setIsEditDayDialogOpen(false);
      setEditingDay(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar dia: " + error.message);
    },
  });

  const deleteDayMutation = trpc.workoutDays.delete.useMutation({
    onSuccess: () => {
      toast.success("Dia removido!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao remover dia: " + error.message);
    },
  });

  const createExerciseMutation = trpc.exercises.create.useMutation({
    onSuccess: () => {
      toast.success("Exercício adicionado!");
      setIsAddExerciseDialogOpen(false);
      resetExerciseForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar exercício: " + error.message);
    },
  });

  const updateExerciseMutation = trpc.exercises.update.useMutation({
    onSuccess: () => {
      toast.success("Exercício atualizado!");
      setIsEditExerciseDialogOpen(false);
      setEditingExercise(null);
      resetExerciseForm();
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar exercício: " + error.message);
    },
  });

  const deleteExerciseMutation = trpc.exercises.delete.useMutation({
    onSuccess: () => {
      toast.success("Exercício removido!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao remover exercício: " + error.message);
    },
  });

  useEffect(() => {
    if (workout) {
      setWorkoutForm({
        name: workout.name,
        description: workout.description || '',
        type: workout.type as any || 'strength',
        difficulty: workout.difficulty as any || 'intermediate',
        notes: workout.notes || '',
      });
    }
  }, [workout]);

  const resetExerciseForm = () => {
    setExerciseForm({
      name: '',
      muscleGroup: '',
      sets: 3,
      reps: '10-12',
      weight: '',
      restSeconds: 60,
      tempo: '',
      notes: '',
      videoUrl: '',
    });
  };

  const handleSaveWorkout = () => {
    updateWorkoutMutation.mutate({
      id: workoutId,
      ...workoutForm,
    });
  };

  const handleAddDay = () => {
    createDayMutation.mutate({
      workoutId,
      ...newDay,
    });
  };

  const handleDeleteDay = (dayId: number) => {
    if (confirm('Tem certeza que deseja remover este dia e todos os exercícios?')) {
      deleteDayMutation.mutate({ id: dayId });
    }
  };

  const handleEditDay = (day: any) => {
    setEditingDay(day);
    setEditDayForm({
      dayOfWeek: day.dayOfWeek || 'monday',
      name: day.name || '',
      notes: day.notes || '',
    });
    setIsEditDayDialogOpen(true);
  };

  const handleUpdateDay = () => {
    if (!editingDay) return;
    updateDayMutation.mutate({
      id: editingDay.id,
      ...editDayForm,
    });
  };

  const handleAddExercise = () => {
    if (!selectedDayId) return;
    createExerciseMutation.mutate({
      workoutDayId: selectedDayId,
      ...exerciseForm,
      sets: exerciseForm.sets || undefined,
      restSeconds: exerciseForm.restSeconds || undefined,
    });
  };

  const handleEditExercise = (exercise: any) => {
    setEditingExercise(exercise);
    setExerciseForm({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup || '',
      sets: exercise.sets || 3,
      reps: exercise.reps || '10-12',
      weight: exercise.weight || '',
      restSeconds: exercise.restSeconds || 60,
      tempo: exercise.tempo || '',
      notes: exercise.notes || '',
      videoUrl: exercise.videoUrl || '',
    });
    setIsEditExerciseDialogOpen(true);
  };

  const handleUpdateExercise = () => {
    if (!editingExercise) return;
    updateExerciseMutation.mutate({
      id: editingExercise.id,
      ...exerciseForm,
      sets: exerciseForm.sets || undefined,
      restSeconds: exerciseForm.restSeconds || undefined,
    });
  };

  const handleDeleteExercise = (exerciseId: number) => {
    if (confirm('Tem certeza que deseja remover este exercício?')) {
      deleteExerciseMutation.mutate({ id: exerciseId });
    }
  };

  const openAddExerciseDialog = (dayId: number) => {
    setSelectedDayId(dayId);
    resetExerciseForm();
    setIsAddExerciseDialogOpen(true);
  };

  const getTypeBadge = (type: string | null) => {
    const types: Record<string, { label: string; className: string }> = {
      strength: { label: "Força", className: "bg-red-100 text-red-700" },
      cardio: { label: "Cardio", className: "bg-blue-100 text-blue-700" },
      flexibility: { label: "Flexibilidade", className: "bg-purple-100 text-purple-700" },
      functional: { label: "Funcional", className: "bg-orange-100 text-orange-700" },
      mixed: { label: "Misto", className: "bg-gray-100 text-gray-700" },
    };
    return types[type || "mixed"] || types.mixed;
  };

  const getDifficultyBadge = (difficulty: string | null) => {
    const levels: Record<string, { label: string; className: string }> = {
      beginner: { label: "Iniciante", className: "bg-green-100 text-green-700" },
      intermediate: { label: "Intermediário", className: "bg-yellow-100 text-yellow-700" },
      advanced: { label: "Avançado", className: "bg-red-100 text-red-700" },
    };
    return levels[difficulty || "intermediate"] || levels.intermediate;
  };

  const getDayLabel = (dayOfWeek: string) => {
    return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label || dayOfWeek;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
        </div>
      </DashboardLayout>
    );
  }

  if (!workout) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Dumbbell className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium">Treino não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation('/treinos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Treinos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const typeBadge = getTypeBadge(workout.type);
  const difficultyBadge = getDifficultyBadge(workout.difficulty);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/treinos')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              {isEditingWorkout ? (
                <Input
                  value={workoutForm.name}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, name: e.target.value })}
                  className="text-2xl font-bold h-auto py-1 px-2"
                />
              ) : (
                <h1 className="text-2xl font-bold tracking-tight">{workout.name}</h1>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge className={typeBadge.className}>{typeBadge.label}</Badge>
                <Badge className={difficultyBadge.className}>{difficultyBadge.label}</Badge>
                <Badge variant={workout.status === 'active' ? 'default' : 'secondary'}>
                  {workout.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isEditingWorkout ? (
              <>
                <Button variant="outline" onClick={() => setIsEditingWorkout(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSaveWorkout} disabled={updateWorkoutMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditingWorkout(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button onClick={() => setIsAddDayDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Dia
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Workout Info */}
        {isEditingWorkout && (
          <Card>
            <CardHeader>
              <CardTitle>Informações do Treino</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Textarea
                  value={workoutForm.description}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, description: e.target.value })}
                  placeholder="Descreva o objetivo do treino..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Tipo</Label>
                  <Select 
                    value={workoutForm.type} 
                    onValueChange={(v) => setWorkoutForm({ ...workoutForm, type: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strength">Força</SelectItem>
                      <SelectItem value="cardio">Cardio</SelectItem>
                      <SelectItem value="flexibility">Flexibilidade</SelectItem>
                      <SelectItem value="functional">Funcional</SelectItem>
                      <SelectItem value="mixed">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Dificuldade</Label>
                  <Select 
                    value={workoutForm.difficulty} 
                    onValueChange={(v) => setWorkoutForm({ ...workoutForm, difficulty: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  value={workoutForm.notes}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description Card */}
        {!isEditingWorkout && workout.description && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{workout.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Workout Days */}
        <div className="space-y-4">
          {workout.days && workout.days.length > 0 ? (
            workout.days.map((day: any) => (
              <Card key={day.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {day.name || getDayLabel(day.dayOfWeek)}
                        </CardTitle>
                        {day.name && (
                          <CardDescription>{getDayLabel(day.dayOfWeek)}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openAddExerciseDialog(day.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Exercício
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleEditDay(day)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar Dia
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDeleteDay(day.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Remover Dia
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {day.exercises && day.exercises.length > 0 ? (
                    <div className="space-y-3">
                      {day.exercises.map((exercise: any, index: number) => (
                        <div 
                          key={exercise.id}
                          className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{exercise.name}</p>
                              {exercise.muscleGroup && (
                                <Badge variant="outline" className="text-xs">
                                  {exercise.muscleGroup}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              {exercise.sets && (
                                <span className="flex items-center gap-1">
                                  <Repeat className="h-3 w-3" />
                                  {exercise.sets} séries
                                </span>
                              )}
                              {exercise.reps && (
                                <span className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {exercise.reps} reps
                                </span>
                              )}
                              {exercise.weight && (
                                <span className="flex items-center gap-1">
                                  <Weight className="h-3 w-3" />
                                  {exercise.weight}
                                </span>
                              )}
                              {exercise.restSeconds && (
                                <span className="flex items-center gap-1">
                                  <Timer className="h-3 w-3" />
                                  {exercise.restSeconds}s
                                </span>
                              )}
                            </div>
                            {exercise.notes && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                {exercise.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleEditExercise(exercise)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteExercise(exercise.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum exercício adicionado</p>
                      <Button 
                        variant="link" 
                        className="mt-2"
                        onClick={() => openAddExerciseDialog(day.id)}
                      >
                        Adicionar primeiro exercício
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Nenhum dia configurado</p>
                <p className="text-muted-foreground text-sm mb-4">
                  Adicione dias da semana para organizar os exercícios
                </p>
                <Button onClick={() => setIsAddDayDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Dia
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Dialog: Adicionar Dia */}
        <Dialog open={isAddDayDialogOpen} onOpenChange={setIsAddDayDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Dia de Treino</DialogTitle>
              <DialogDescription>
                Escolha o dia da semana e dê um nome opcional
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Dia da Semana *</Label>
                <Select 
                  value={newDay.dayOfWeek} 
                  onValueChange={(v) => setNewDay({ ...newDay, dayOfWeek: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Nome (opcional)</Label>
                <Input
                  placeholder="Ex: Treino A - Peito e Tríceps"
                  value={newDay.name}
                  onChange={(e) => setNewDay({ ...newDay, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações sobre este dia..."
                  value={newDay.notes}
                  onChange={(e) => setNewDay({ ...newDay, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDayDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddDay} disabled={createDayMutation.isPending}>
                {createDayMutation.isPending ? "Adicionando..." : "Adicionar Dia"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Editar Dia */}
        <Dialog open={isEditDayDialogOpen} onOpenChange={setIsEditDayDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Dia de Treino</DialogTitle>
              <DialogDescription>
                Atualize as informações do dia
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Dia da Semana *</Label>
                <Select 
                  value={editDayForm.dayOfWeek} 
                  onValueChange={(v) => setEditDayForm({ ...editDayForm, dayOfWeek: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Nome do Dia</Label>
                <Input
                  placeholder="Ex: Treino A - Peito e Tríceps"
                  value={editDayForm.name}
                  onChange={(e) => setEditDayForm({ ...editDayForm, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações sobre este dia..."
                  value={editDayForm.notes}
                  onChange={(e) => setEditDayForm({ ...editDayForm, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDayDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateDay} disabled={updateDayMutation.isPending}>
                {updateDayMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Adicionar Exercício */}
        <Dialog open={isAddExerciseDialogOpen} onOpenChange={setIsAddExerciseDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Adicionar Exercício</DialogTitle>
              <DialogDescription>
                Configure os detalhes do exercício
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label>Nome do Exercício *</Label>
                <Input
                  placeholder="Ex: Supino Reto"
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Grupo Muscular</Label>
                <Select 
                  value={exerciseForm.muscleGroup} 
                  onValueChange={(v) => setExerciseForm({ ...exerciseForm, muscleGroup: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo muscular" />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Séries</Label>
                  <Input
                    type="number"
                    min={1}
                    value={exerciseForm.sets}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, sets: parseInt(e.target.value) || 3 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Repetições</Label>
                  <Input
                    placeholder="Ex: 10-12 ou 15"
                    value={exerciseForm.reps}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Carga/Peso</Label>
                  <Input
                    placeholder="Ex: 20kg ou progressivo"
                    value={exerciseForm.weight}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, weight: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descanso (segundos)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={exerciseForm.restSeconds}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, restSeconds: parseInt(e.target.value) || 60 })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Tempo (cadência)</Label>
                <Input
                  placeholder="Ex: 3-1-2 (excêntrico-pausa-concêntrico)"
                  value={exerciseForm.tempo}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, tempo: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>URL do Vídeo</Label>
                <Input
                  placeholder="Link para vídeo demonstrativo"
                  value={exerciseForm.videoUrl}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, videoUrl: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Dicas de execução, variações, etc."
                  value={exerciseForm.notes}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddExerciseDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleAddExercise} 
                disabled={createExerciseMutation.isPending || !exerciseForm.name.trim()}
              >
                {createExerciseMutation.isPending ? "Adicionando..." : "Adicionar Exercício"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Editar Exercício */}
        <Dialog open={isEditExerciseDialogOpen} onOpenChange={setIsEditExerciseDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Exercício</DialogTitle>
              <DialogDescription>
                Atualize os detalhes do exercício
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label>Nome do Exercício *</Label>
                <Input
                  placeholder="Ex: Supino Reto"
                  value={exerciseForm.name}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Grupo Muscular</Label>
                <Select 
                  value={exerciseForm.muscleGroup} 
                  onValueChange={(v) => setExerciseForm({ ...exerciseForm, muscleGroup: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo muscular" />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Séries</Label>
                  <Input
                    type="number"
                    min={1}
                    value={exerciseForm.sets}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, sets: parseInt(e.target.value) || 3 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Repetições</Label>
                  <Input
                    placeholder="Ex: 10-12 ou 15"
                    value={exerciseForm.reps}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, reps: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Carga/Peso</Label>
                  <Input
                    placeholder="Ex: 20kg ou progressivo"
                    value={exerciseForm.weight}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, weight: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Descanso (segundos)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={exerciseForm.restSeconds}
                    onChange={(e) => setExerciseForm({ ...exerciseForm, restSeconds: parseInt(e.target.value) || 60 })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Tempo (cadência)</Label>
                <Input
                  placeholder="Ex: 3-1-2 (excêntrico-pausa-concêntrico)"
                  value={exerciseForm.tempo}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, tempo: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>URL do Vídeo</Label>
                <Input
                  placeholder="Link para vídeo demonstrativo"
                  value={exerciseForm.videoUrl}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, videoUrl: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Dicas de execução, variações, etc."
                  value={exerciseForm.notes}
                  onChange={(e) => setExerciseForm({ ...exerciseForm, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditExerciseDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdateExercise} 
                disabled={updateExerciseMutation.isPending || !exerciseForm.name.trim()}
              >
                {updateExerciseMutation.isPending ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
