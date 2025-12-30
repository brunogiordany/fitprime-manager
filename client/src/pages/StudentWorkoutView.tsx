import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Dumbbell, 
  Calendar,
  Clock,
  Target,
  ChevronDown,
  ChevronUp,
  Play,
  Info,
  Lightbulb,
  Send
} from "lucide-react";
import { useLocation, useParams } from "wouter";

interface StudentData {
  id: number;
  name: string;
  email: string;
}

export default function StudentWorkoutView() {
  const params = useParams<{ workoutId: string }>();
  const workoutId = parseInt(params.workoutId || "0");
  const [, setLocation] = useLocation();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [expandedDays, setExpandedDays] = useState<number[]>([]);
  
  // Estados para modal de sugestão
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<{ id: number; name: string } | null>(null);
  const [suggestionType, setSuggestionType] = useState<string>('');
  const [currentValue, setCurrentValue] = useState('');
  const [suggestedValue, setSuggestedValue] = useState('');
  const [suggestionReason, setSuggestionReason] = useState('');
  
  // Mutation para criar sugestão
  const createSuggestion = trpc.studentPortal.createWorkoutSuggestion.useMutation({
    onSuccess: () => {
      toast.success('Sugestão enviada com sucesso! Seu personal irá analisar.');
      setShowSuggestionModal(false);
      resetSuggestionForm();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao enviar sugestão');
    },
  });
  
  const resetSuggestionForm = () => {
    setSelectedExercise(null);
    setSuggestionType('');
    setCurrentValue('');
    setSuggestedValue('');
    setSuggestionReason('');
  };
  
  const openSuggestionModal = (exercise?: { id: number; name: string }) => {
    if (exercise) {
      setSelectedExercise(exercise);
    }
    setShowSuggestionModal(true);
  };
  
  const handleSubmitSuggestion = () => {
    if (!suggestionType || !suggestedValue) {
      toast.error('Preencha o tipo e a sugestão');
      return;
    }
    
    createSuggestion.mutate({
      workoutId,
      exerciseId: selectedExercise?.id,
      suggestionType: suggestionType as any,
      currentValue: currentValue || undefined,
      suggestedValue,
      reason: suggestionReason || undefined,
    });
  };

  // Verificar token do aluno
  useEffect(() => {
    const token = localStorage.getItem("studentToken");
    const storedData = localStorage.getItem("studentData");
    
    if (!token || !storedData) {
      setLocation("/login-aluno");
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setStudentData(data);
      // Expandir todos os dias por padrão
      setExpandedDays([]);
    } catch {
      localStorage.removeItem("studentToken");
      localStorage.removeItem("studentData");
      setLocation("/login-aluno");
    }
  }, [setLocation]);

  // Buscar detalhes do treino com dias e exercícios
  const { data: workout, isLoading } = trpc.workouts.get.useQuery(
    { id: workoutId },
    { enabled: workoutId > 0 && !!studentData?.id }
  );

  // Expandir o primeiro dia quando carregar
  useEffect(() => {
    if (workout?.days && workout.days.length > 0 && expandedDays.length === 0) {
      setExpandedDays([workout.days[0].id]);
    }
  }, [workout]);

  const toggleDay = (dayId: number) => {
    setExpandedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(id => id !== dayId)
        : [...prev, dayId]
    );
  };

  const getDayOfWeekLabel = (dayOfWeek: string | null) => {
    const days: Record<string, string> = {
      monday: "Segunda-feira",
      tuesday: "Terça-feira",
      wednesday: "Quarta-feira",
      thursday: "Quinta-feira",
      friday: "Sexta-feira",
      saturday: "Sábado",
      sunday: "Domingo",
    };
    return dayOfWeek ? days[dayOfWeek] || dayOfWeek : "";
  };

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <Skeleton className="h-8 w-48" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <Skeleton className="h-[400px] w-full" />
        </main>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Dumbbell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <CardTitle>Treino não encontrado</CardTitle>
            <CardDescription>
              Este treino não existe ou não está disponível.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setLocation("/meu-portal")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const workoutDays = workout.days || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/meu-portal")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">{workout.name}</h1>
              <p className="text-sm text-gray-500">Detalhes do treino</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Info do Treino */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Dumbbell className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-semibold text-lg">{workout.name}</h2>
                  <Badge variant={workout.status === 'active' ? 'default' : 'secondary'}>
                    {workout.status === 'active' ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                {workout.description && (
                  <p className="text-gray-600 text-sm">{workout.description}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dias do Treino */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" />
            Dias do Treino
          </h3>

          {workoutDays.length > 0 ? (
            workoutDays.map((day: any, dayIndex: number) => {
              const isExpanded = expandedDays.includes(day.id);
              const exercises = day.exercises || [];
              
              return (
                <Card key={day.id}>
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleDay(day.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <span className="font-bold text-emerald-600">{dayIndex + 1}</span>
                        </div>
                        <div>
                          <CardTitle className="text-base">{day.name || `Dia ${dayIndex + 1}`}</CardTitle>
                          {day.dayOfWeek && (
                            <CardDescription>{getDayOfWeekLabel(day.dayOfWeek)}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {exercises.length} exercício{exercises.length !== 1 ? 's' : ''}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5" />
                          ) : (
                            <ChevronDown className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0">
                      {exercises.length > 0 ? (
                        <div className="space-y-3">
                          {exercises.map((exercise: any, exIndex: number) => (
                            <div 
                              key={exercise.id}
                              className="p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex items-start gap-3">
                                <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-medium">
                                  {exIndex + 1}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="font-medium">{exercise.name}</h4>
                                      {exercise.muscleGroup && (
                                        <Badge variant="outline" className="text-xs">
                                          {exercise.muscleGroup}
                                        </Badge>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openSuggestionModal({ id: exercise.id, name: exercise.name });
                                      }}
                                    >
                                      <Lightbulb className="h-4 w-4 mr-1" />
                                      Sugerir
                                    </Button>
                                  </div>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 flex-wrap">
                                    {exercise.sets && (
                                      <span className="flex items-center gap-1">
                                        <Target className="h-3 w-3" />
                                        {exercise.sets} séries
                                      </span>
                                    )}
                                    {exercise.reps && (
                                      <span className="flex items-center gap-1">
                                        <Play className="h-3 w-3" />
                                        {exercise.reps} reps
                                      </span>
                                    )}
                                    {exercise.restSeconds && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {exercise.restSeconds}s
                                      </span>
                                    )}
                                  </div>
                                  {exercise.notes && (
                                    <p className="text-sm text-gray-500 mt-2 italic">
                                      {exercise.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-4">
                          Nenhum exercício cadastrado neste dia
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <Info className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum dia de treino cadastrado ainda</p>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Botão flutuante para sugestão geral */}
        <div className="fixed bottom-6 right-6">
          <Button
            onClick={() => openSuggestionModal()}
            className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg rounded-full h-14 px-6"
          >
            <Lightbulb className="h-5 w-5 mr-2" />
            Sugerir Alteração
          </Button>
        </div>
      </main>
      
      {/* Modal de Sugestão */}
      <Dialog open={showSuggestionModal} onOpenChange={setShowSuggestionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              Sugerir Alteração no Treino
            </DialogTitle>
            <DialogDescription>
              {selectedExercise 
                ? `Sugestão para: ${selectedExercise.name}`
                : 'Envie uma sugestão de alteração para seu personal analisar'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo de Sugestão *</Label>
              <Select value={suggestionType} onValueChange={setSuggestionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight_change">Alterar Carga</SelectItem>
                  <SelectItem value="reps_change">Alterar Repetições</SelectItem>
                  <SelectItem value="exercise_change">Trocar Exercício</SelectItem>
                  <SelectItem value="add_exercise">Adicionar Exercício</SelectItem>
                  <SelectItem value="remove_exercise">Remover Exercício</SelectItem>
                  <SelectItem value="note">Observação Geral</SelectItem>
                  <SelectItem value="other">Outra Sugestão</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(suggestionType === 'weight_change' || suggestionType === 'reps_change' || suggestionType === 'exercise_change') && (
              <div className="space-y-2">
                <Label>Valor Atual (opcional)</Label>
                <Input
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  placeholder={suggestionType === 'weight_change' ? 'Ex: 20kg' : suggestionType === 'reps_change' ? 'Ex: 12 reps' : 'Ex: Supino Reto'}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Sua Sugestão *</Label>
              <Input
                value={suggestedValue}
                onChange={(e) => setSuggestedValue(e.target.value)}
                placeholder={suggestionType === 'weight_change' ? 'Ex: 25kg' : suggestionType === 'reps_change' ? 'Ex: 15 reps' : suggestionType === 'exercise_change' ? 'Ex: Supino Inclinado' : suggestionType === 'add_exercise' ? 'Ex: Rosca Direta' : 'Descreva sua sugestão'}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={suggestionReason}
                onChange={(e) => setSuggestionReason(e.target.value)}
                placeholder="Explique por que você sugere essa alteração..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSuggestionModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmitSuggestion}
              disabled={createSuggestion.isPending || !suggestionType || !suggestedValue}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {createSuggestion.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Enviando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Enviar Sugestão
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
