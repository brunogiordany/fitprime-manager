import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { 
  Dumbbell, 
  Plus, 
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Eye,
  Users,
  Sparkles,
  FileText,
  Target,
  Loader2,
  Check,
  ChevronRight,
  Zap,
  Brain,
  ListChecks,
  RefreshCw,
  X,
  Replace,
  RotateCcw,
  GitCompare,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Workouts() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [goalFilter, setGoalFilter] = useState<string>("all");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [aiPreview, setAiPreview] = useState<any>(null);
  const [editingExercise, setEditingExercise] = useState<{dayIndex: number, exIndex: number, exercise: any} | null>(null);
  const [workoutToDuplicate, setWorkoutToDuplicate] = useState<any>(null);
  const [duplicateTargetStudent, setDuplicateTargetStudent] = useState<string>("");
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState(false);
  const [compareWorkout1, setCompareWorkout1] = useState<string>("");
  const [compareWorkout2, setCompareWorkout2] = useState<string>("");
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [newWorkout, setNewWorkout] = useState({
    name: "",
    description: "",
    type: "strength" as const,
    difficulty: "intermediate" as const,
  });

  const { data: students, isLoading: studentsLoading } = trpc.students.list.useQuery({});
  const { data: templatesData } = trpc.workouts.templates.useQuery();
  
  const { data: workouts, isLoading: workoutsLoading, refetch } = trpc.workouts.list.useQuery(
    { studentId: parseInt(selectedStudent) },
    { enabled: !!selectedStudent }
  );

  const createMutation = trpc.workouts.create.useMutation({
    onSuccess: () => {
      toast.success("Treino criado com sucesso!");
      setIsNewDialogOpen(false);
      setNewWorkout({
        name: "",
        description: "",
        type: "strength",
        difficulty: "intermediate",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar treino: " + error.message);
    },
  });

  const createFromTemplateMutation = trpc.workouts.createFromTemplate.useMutation({
    onSuccess: (data) => {
      toast.success(`Treino "${data.name}" criado com sucesso!`);
      setIsTemplateDialogOpen(false);
      setSelectedTemplate("");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao criar treino: " + error.message);
    },
  });

  const generateAIMutation = trpc.workouts.generateWithAI.useMutation({
    onSuccess: (data) => {
      setAiPreview(data);
      toast.success("Treino gerado! Revise e salve.");
    },
    onError: (error) => {
      toast.error("Erro ao gerar treino: " + error.message);
    },
  });

  const generateAdaptedMutation = trpc.workouts.generateAdaptedWorkout.useMutation({
    onSuccess: (data) => {
      setAiPreview({
        ...data,
        preview: data.preview,
        isAdapted: true,
        adaptationInfo: {
          version: data.version,
          previousWorkoutName: data.previousWorkoutName,
          measurementEvolution: data.measurementEvolution,
          workoutPerformance: data.workoutPerformance,
          adaptationReason: data.preview.adaptationReason,
          deficitsAddressed: data.preview.deficitsAddressed,
          improvements: data.preview.improvements,
        }
      });
      toast.success(`Treino ${data.version}.0 adaptado gerado! Revise e salve.`);
    },
    onError: (error) => {
      toast.error("Erro ao gerar treino adaptado: " + error.message);
    },
  });

  const saveAIMutation = trpc.workouts.saveAIGenerated.useMutation({
    onSuccess: (data) => {
      toast.success(`Treino "${data.name}" salvo com sucesso!`);
      setIsAIDialogOpen(false);
      setAiPreview(null);
      setCustomPrompt("");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao salvar treino: " + error.message);
    },
  });

  const duplicateMutation = trpc.workouts.duplicate.useMutation({
    onSuccess: (data) => {
      toast.success(`Treino duplicado: "${data.name}"`);
      setIsDuplicateDialogOpen(false);
      setWorkoutToDuplicate(null);
      setDuplicateTargetStudent("");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao duplicar: " + error.message);
    },
  });

  const deleteMutation = trpc.workouts.delete.useMutation({
    onSuccess: () => {
      toast.success("Treino movido para lixeira!");
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const handleCreateWorkout = () => {
    if (!selectedStudent) {
      toast.error("Selecione um aluno primeiro");
      return;
    }
    if (!newWorkout.name.trim()) {
      toast.error("Nome do treino é obrigatório");
      return;
    }
    createMutation.mutate({
      studentId: parseInt(selectedStudent),
      name: newWorkout.name,
      description: newWorkout.description || undefined,
      type: newWorkout.type,
      difficulty: newWorkout.difficulty,
    });
  };

  const handleCreateFromTemplate = () => {
    if (!selectedStudent) {
      toast.error("Selecione um aluno primeiro");
      return;
    }
    if (!selectedTemplate) {
      toast.error("Selecione um template");
      return;
    }
    createFromTemplateMutation.mutate({
      studentId: parseInt(selectedStudent),
      templateId: selectedTemplate,
    });
  };

  const handleGenerateAI = () => {
    if (!selectedStudent) {
      toast.error("Selecione um aluno primeiro");
      return;
    }
    generateAIMutation.mutate({
      studentId: parseInt(selectedStudent),
      customPrompt: customPrompt || undefined,
    });
  };

  const handleSaveAIWorkout = () => {
    if (!aiPreview || !selectedStudent) return;
    saveAIMutation.mutate({
      studentId: parseInt(selectedStudent),
      workout: aiPreview.preview,
    });
  };

  // Funções para editar exercícios do treino gerado pela IA
  const handleDeleteExercise = (dayIndex: number, exIndex: number) => {
    if (!aiPreview) return;
    
    const newPreview = { ...aiPreview };
    const newDays = [...newPreview.preview.days];
    const newExercises = [...newDays[dayIndex].exercises];
    
    // Remove o exercício
    newExercises.splice(exIndex, 1);
    newDays[dayIndex] = { ...newDays[dayIndex], exercises: newExercises };
    
    // Se o dia ficou sem exercícios, remove o dia também
    if (newExercises.length === 0) {
      newDays.splice(dayIndex, 1);
      toast.info("Dia removido pois não tinha mais exercícios");
    }
    
    newPreview.preview = { ...newPreview.preview, days: newDays };
    setAiPreview(newPreview);
    toast.success("Exercício removido");
  };

  const handleUpdateExercise = (dayIndex: number, exIndex: number, updatedExercise: any) => {
    if (!aiPreview) return;
    
    const newPreview = { ...aiPreview };
    const newDays = [...newPreview.preview.days];
    const newExercises = [...newDays[dayIndex].exercises];
    
    newExercises[exIndex] = updatedExercise;
    newDays[dayIndex] = { ...newDays[dayIndex], exercises: newExercises };
    newPreview.preview = { ...newPreview.preview, days: newDays };
    
    setAiPreview(newPreview);
    setEditingExercise(null);
    toast.success("Exercício atualizado");
  };

  const handleDuplicate = () => {
    if (!workoutToDuplicate || !duplicateTargetStudent) {
      toast.error("Selecione o aluno de destino");
      return;
    }
    duplicateMutation.mutate({
      workoutId: workoutToDuplicate.id,
      targetStudentId: parseInt(duplicateTargetStudent),
    });
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

  const getGoalBadge = (goal: string | null) => {
    const goals: Record<string, { label: string; className: string }> = {
      hypertrophy: { label: "Hipertrofia", className: "bg-purple-100 text-purple-700" },
      weight_loss: { label: "Emagrecimento", className: "bg-green-100 text-green-700" },
      recomposition: { label: "Recomposição", className: "bg-blue-100 text-blue-700" },
      conditioning: { label: "Condicionamento", className: "bg-cyan-100 text-cyan-700" },
      strength: { label: "Força", className: "bg-red-100 text-red-700" },
      bulking: { label: "Bulking", className: "bg-orange-100 text-orange-700" },
      cutting: { label: "Cutting", className: "bg-pink-100 text-pink-700" },
      general: { label: "Geral", className: "bg-gray-100 text-gray-700" },
    };
    return goals[goal || "general"] || goals.general;
  };

  const filteredWorkouts = workouts?.filter(workout => {
    const matchesSearch = workout.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || workout.status === statusFilter;
    const matchesGoal = goalFilter === "all" || (workout as any).goal === goalFilter;
    return matchesSearch && matchesStatus && matchesGoal;
  });

  const selectedStudentData = students?.find(s => s.id.toString() === selectedStudent);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Treinos</h1>
            <p className="text-muted-foreground">
              Gerencie os treinos dos seus alunos
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Botão IA */}
            <Dialog open={isAIDialogOpen} onOpenChange={(open) => {
              setIsAIDialogOpen(open);
              if (!open) {
                setAiPreview(null);
                setCustomPrompt("");
              }
            }}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar com IA
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[98vw] max-w-6xl h-[90vh] flex flex-col p-0">
                <div className="px-6 pt-6 pb-4 border-b">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      Gerar Treino com Inteligência Artificial
                    </DialogTitle>
                    <DialogDescription>
                      A IA criará um treino personalizado baseado na anamnese e medidas do aluno
                    </DialogDescription>
                  </DialogHeader>
                </div>
                
                {!aiPreview ? (
                  <div className="flex-1 overflow-y-auto px-6 py-4">
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label>Aluno *</Label>
                        <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o aluno" />
                          </SelectTrigger>
                          <SelectContent>
                            {students?.map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {selectedStudentData && (
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm font-medium mb-2">Dados do aluno que serão usados:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Anamnese (objetivo, experiência, limitações)</li>
                            <li>• Medidas corporais (peso, altura, composição)</li>
                            <li>• Frequência semanal disponível</li>
                            <li>• Equipamentos e local de treino</li>
                          </ul>
                        </div>
                      )}
                      
                      <div className="grid gap-2">
                        <Label>Instruções adicionais (opcional)</Label>
                        <Textarea
                          placeholder="Ex: Foco em exercícios para lombar, evitar agachamento livre, incluir mais cardio..."
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          rows={3}
                        />
                      </div>
                      
                      <Button 
                        onClick={handleGenerateAI}
                        disabled={!selectedStudent || generateAIMutation.isPending}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                      >
                        {generateAIMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Gerando treino...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Gerar Treino com IA
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Conteúdo com scroll */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                      <div className="space-y-4">
                        <div className={`rounded-lg p-4 border ${aiPreview.isAdapted ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100' : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100'}`}>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{aiPreview.preview.name}</h3>
                            <div className="flex gap-2 flex-wrap">
                              {aiPreview.isAdapted && (
                                <Badge className="bg-orange-100 text-orange-700">
                                  Treino {aiPreview.adaptationInfo?.version}.0
                                </Badge>
                              )}
                              <Badge className={getGoalBadge(aiPreview.preview.goal).className}>
                                {getGoalBadge(aiPreview.preview.goal).label}
                              </Badge>
                              <Badge className={getDifficultyBadge(aiPreview.preview.difficulty).className}>
                                {getDifficultyBadge(aiPreview.preview.difficulty).label}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{aiPreview.preview.description}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Para: {aiPreview.studentName}
                          </p>
                          
                          {/* Informações de Adaptação */}
                          {aiPreview.isAdapted && aiPreview.adaptationInfo && (
                            <div className="mt-4 space-y-3">
                              {aiPreview.adaptationInfo.previousWorkoutName && (
                                <p className="text-xs text-orange-600">
                                  <strong>Baseado em:</strong> {aiPreview.adaptationInfo.previousWorkoutName}
                                </p>
                              )}
                              
                              {aiPreview.adaptationInfo.adaptationReason && (
                                <div className="bg-white/50 rounded p-2">
                                  <p className="text-xs font-medium text-orange-700">Motivo da Adaptação:</p>
                                  <p className="text-xs text-muted-foreground">{aiPreview.adaptationInfo.adaptationReason}</p>
                                </div>
                              )}
                              
                              {aiPreview.adaptationInfo.deficitsAddressed?.length > 0 && (
                                <div className="bg-white/50 rounded p-2">
                                  <p className="text-xs font-medium text-orange-700">Déficits Abordados:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {aiPreview.adaptationInfo.deficitsAddressed.map((deficit: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                        {deficit}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {aiPreview.adaptationInfo.improvements?.length > 0 && (
                                <div className="bg-white/50 rounded p-2">
                                  <p className="text-xs font-medium text-orange-700">Melhorias:</p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {aiPreview.adaptationInfo.improvements.map((improvement: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                        {improvement}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {aiPreview.adaptationInfo.measurementEvolution && (
                                <div className="bg-white/50 rounded p-2">
                                  <p className="text-xs font-medium text-orange-700">Evolução das Medidas ({aiPreview.adaptationInfo.measurementEvolution.periodDays} dias):</p>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                                    {aiPreview.adaptationInfo.measurementEvolution.weightChange !== null && (
                                      <div className="text-xs">
                                        <span className="text-muted-foreground">Peso:</span>
                                        <span className={aiPreview.adaptationInfo.measurementEvolution.weightChange < 0 ? 'text-green-600' : 'text-red-600'}>
                                          {' '}{aiPreview.adaptationInfo.measurementEvolution.weightChange > 0 ? '+' : ''}{aiPreview.adaptationInfo.measurementEvolution.weightChange}kg
                                        </span>
                                      </div>
                                    )}
                                    {aiPreview.adaptationInfo.measurementEvolution.bodyFatChange !== null && (
                                      <div className="text-xs">
                                        <span className="text-muted-foreground">Gordura:</span>
                                        <span className={aiPreview.adaptationInfo.measurementEvolution.bodyFatChange < 0 ? 'text-green-600' : 'text-red-600'}>
                                          {' '}{aiPreview.adaptationInfo.measurementEvolution.bodyFatChange > 0 ? '+' : ''}{aiPreview.adaptationInfo.measurementEvolution.bodyFatChange}%
                                        </span>
                                      </div>
                                    )}
                                    {aiPreview.adaptationInfo.measurementEvolution.muscleMassChange !== null && (
                                      <div className="text-xs">
                                        <span className="text-muted-foreground">Músculo:</span>
                                        <span className={aiPreview.adaptationInfo.measurementEvolution.muscleMassChange > 0 ? 'text-green-600' : 'text-red-600'}>
                                          {' '}{aiPreview.adaptationInfo.measurementEvolution.muscleMassChange > 0 ? '+' : ''}{aiPreview.adaptationInfo.measurementEvolution.muscleMassChange}kg
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {aiPreview.adaptationInfo.workoutPerformance && (
                                <div className="bg-white/50 rounded p-2">
                                  <p className="text-xs font-medium text-orange-700">Desempenho (Últimos 30 dias):</p>
                                  <div className="grid grid-cols-3 gap-2 mt-1">
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Treinos:</span>
                                      <span className="font-medium"> {aiPreview.adaptationInfo.workoutPerformance.totalWorkouts}</span>
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Média/semana:</span>
                                      <span className="font-medium"> {aiPreview.adaptationInfo.workoutPerformance.averagePerWeek}</span>
                                    </div>
                                    <div className="text-xs">
                                      <span className="text-muted-foreground">Consistência:</span>
                                      <span className="font-medium"> {aiPreview.adaptationInfo.workoutPerformance.consistency}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          {aiPreview.preview.days.map((day: any, dayIndex: number) => (
                            <Card key={dayIndex}>
                              <CardHeader className="py-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                                    {dayIndex + 1}
                                  </div>
                                  <span className="truncate">{day.name}</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="py-2">
                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead>
                                      <tr className="border-b">
                                        <th className="text-left py-2 pr-4 font-medium">Exercício</th>
                                        <th className="text-left py-2 pr-4 font-medium">Grupo</th>
                                        <th className="text-center py-2 px-2 font-medium">Séries</th>
                                        <th className="text-center py-2 px-2 font-medium">Reps</th>
                                        <th className="text-center py-2 px-2 font-medium">Descanso</th>
                                        <th className="text-center py-2 pl-2 font-medium w-[80px]">Ações</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {day.exercises.map((ex: any, exIndex: number) => (
                                        <tr key={exIndex} className="border-b last:border-0 group hover:bg-muted/50">
                                          <td className="py-2 pr-4 font-medium">{ex.name}</td>
                                          <td className="py-2 pr-4 text-muted-foreground">{ex.muscleGroup}</td>
                                          <td className="py-2 px-2 text-center">{ex.sets}</td>
                                          <td className="py-2 px-2 text-center">{ex.reps}</td>
                                          <td className="py-2 px-2 text-center">{ex.restSeconds}s</td>
                                          <td className="py-2 pl-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                onClick={() => setEditingExercise({ dayIndex, exIndex, exercise: { ...ex } })}
                                                title="Editar exercício"
                                              >
                                                <Edit className="h-3.5 w-3.5" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => handleDeleteExercise(dayIndex, exIndex)}
                                                title="Remover exercício"
                                              >
                                                <X className="h-3.5 w-3.5" />
                                              </Button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Botões fixos no rodapé - SEMPRE VISÍVEIS */}
                    <div className="border-t bg-background px-6 py-4 flex-shrink-0">
                      <p className="text-sm text-muted-foreground text-center mb-3">
                        Revise o treino acima. Após salvar, você poderá editar os exercícios.
                      </p>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setAiPreview(null)}
                          className="flex-1"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Gerar Novo
                        </Button>
                        <Button 
                          onClick={handleSaveAIWorkout}
                          disabled={saveAIMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                        >
                          {saveAIMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              Salvar e Editar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </DialogContent>
            </Dialog>

            {/* Modal de Edição de Exercício */}
            <Dialog open={!!editingExercise} onOpenChange={(open) => !open && setEditingExercise(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Edit className="h-5 w-5 text-blue-600" />
                    Editar Exercício
                  </DialogTitle>
                  <DialogDescription>
                    Modifique os detalhes do exercício ou substitua por outro
                  </DialogDescription>
                </DialogHeader>
                
                {editingExercise && (
                  <div className="space-y-4 py-2">
                    <div className="grid gap-2">
                      <Label>Nome do Exercício</Label>
                      <Input
                        value={editingExercise.exercise.name}
                        onChange={(e) => setEditingExercise({
                          ...editingExercise,
                          exercise: { ...editingExercise.exercise, name: e.target.value }
                        })}
                        placeholder="Ex: Supino Reto com Barra"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Grupo Muscular</Label>
                      <Select
                        value={editingExercise.exercise.muscleGroup}
                        onValueChange={(value) => setEditingExercise({
                          ...editingExercise,
                          exercise: { ...editingExercise.exercise, muscleGroup: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o grupo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Peito">Peito</SelectItem>
                          <SelectItem value="Costas">Costas</SelectItem>
                          <SelectItem value="Ombros">Ombros</SelectItem>
                          <SelectItem value="Bíceps">Bíceps</SelectItem>
                          <SelectItem value="Tríceps">Tríceps</SelectItem>
                          <SelectItem value="Antebraço">Antebraço</SelectItem>
                          <SelectItem value="Abdômen">Abdômen</SelectItem>
                          <SelectItem value="Core">Core</SelectItem>
                          <SelectItem value="Glúteos">Glúteos</SelectItem>
                          <SelectItem value="Quadríceps">Quadríceps</SelectItem>
                          <SelectItem value="Posterior">Posterior</SelectItem>
                          <SelectItem value="Panturrilha">Panturrilha</SelectItem>
                          <SelectItem value="Pernas">Pernas</SelectItem>
                          <SelectItem value="Geral">Geral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="grid gap-2">
                        <Label>Séries</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={editingExercise.exercise.sets}
                          onChange={(e) => setEditingExercise({
                            ...editingExercise,
                            exercise: { ...editingExercise.exercise, sets: parseInt(e.target.value) || 1 }
                          })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Repetições</Label>
                        <Input
                          value={editingExercise.exercise.reps}
                          onChange={(e) => setEditingExercise({
                            ...editingExercise,
                            exercise: { ...editingExercise.exercise, reps: e.target.value }
                          })}
                          placeholder="12 ou 8-12"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Descanso (s)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="300"
                          value={editingExercise.exercise.restSeconds}
                          onChange={(e) => setEditingExercise({
                            ...editingExercise,
                            exercise: { ...editingExercise.exercise, restSeconds: parseInt(e.target.value) || 60 }
                          })}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setEditingExercise(null)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={() => handleUpdateExercise(
                          editingExercise.dayIndex,
                          editingExercise.exIndex,
                          editingExercise.exercise
                        )}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Salvar Alterações
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Botão Templates */}
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto flex flex-col">
                <DialogHeader>
                  <DialogTitle>Templates de Treino</DialogTitle>
                  <DialogDescription>
                    Escolha um template pré-programado para criar rapidamente
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-2 py-2">
                  <Label>Aluno *</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <ScrollArea className="flex-1 pr-4">
                  <div className="grid gap-3 py-2">
                    {templatesData?.templates.map((template) => (
                      <Card 
                        key={template.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTemplate === template.id ? 'ring-2 ring-emerald-500 bg-emerald-50/50' : ''
                        }`}
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{template.name}</h4>
                                {selectedTemplate === template.id && (
                                  <Check className="h-4 w-4 text-emerald-600" />
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {template.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge className={getGoalBadge(template.goal).className}>
                                  {templatesData?.goalLabels[template.goal]}
                                </Badge>
                                <Badge className={getDifficultyBadge(template.difficulty === 'none' ? 'beginner' : template.difficulty).className}>
                                  {templatesData?.levelLabels[template.difficulty]}
                                </Badge>
                                <Badge variant="outline">
                                  {template.daysPerWeek}x por semana
                                </Badge>
                                <Badge variant="outline">
                                  {template.days.length} dias
                                </Badge>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateFromTemplate}
                    disabled={!selectedStudent || !selectedTemplate || createFromTemplateMutation.isPending}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600"
                  >
                    {createFromTemplateMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Criando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Usar Template
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Botão Novo Treino Manual */}
            <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Treino
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Treino</DialogTitle>
                  <DialogDescription>
                    Crie um novo treino do zero
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label>Aluno *</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        {students?.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Nome do Treino *</Label>
                    <Input
                      placeholder="Ex: Treino A - Peito e Tríceps"
                      value={newWorkout.name}
                      onChange={(e) => setNewWorkout({ ...newWorkout, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Descrição</Label>
                    <Textarea
                      placeholder="Descreva o objetivo do treino..."
                      value={newWorkout.description}
                      onChange={(e) => setNewWorkout({ ...newWorkout, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Tipo</Label>
                      <Select 
                        value={newWorkout.type} 
                        onValueChange={(v) => setNewWorkout({ ...newWorkout, type: v as any })}
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
                        value={newWorkout.difficulty} 
                        onValueChange={(v) => setNewWorkout({ ...newWorkout, difficulty: v as any })}
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
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateWorkout}
                    disabled={createMutation.isPending}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600"
                  >
                    {createMutation.isPending ? "Criando..." : "Criar Treino"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Actions */}
        {selectedStudent && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card 
              className="cursor-pointer hover:shadow-md transition-all border-purple-100 hover:border-purple-300"
              onClick={() => setIsAIDialogOpen(true)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Gerar com IA</h3>
                  <p className="text-sm text-muted-foreground">
                    Treino personalizado automático
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-md transition-all border-blue-100 hover:border-blue-300"
              onClick={() => setIsTemplateDialogOpen(true)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100">
                  <ListChecks className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Usar Template</h3>
                  <p className="text-sm text-muted-foreground">
                    {templatesData?.templates.length || 0} templates disponíveis
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-md transition-all border-emerald-100 hover:border-emerald-300"
              onClick={() => setIsNewDialogOpen(true)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100">
                  <Dumbbell className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Criar do Zero</h3>
                  <p className="text-sm text-muted-foreground">
                    Montar treino manualmente
                  </p>
                </div>
              </CardContent>
            </Card>
            
            {/* Card de Treino Adaptado - só aparece se já houver treinos */}
            {workouts && workouts.length > 0 && (
              <>
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all border-orange-100 hover:border-orange-300"
                  onClick={() => {
                    generateAdaptedMutation.mutate({
                      studentId: parseInt(selectedStudent),
                    });
                  }}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100">
                      <RefreshCw className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Treino Adaptado (2.0)</h3>
                      <p className="text-sm text-muted-foreground">
                        IA cria novo treino focando nos déficits
                      </p>
                    </div>
                    {generateAdaptedMutation.isPending && (
                      <Loader2 className="h-5 w-5 animate-spin text-orange-600" />
                    )}
                  </CardContent>
                </Card>
                
                {/* Card de Comparar Treinos */}
                {workouts.length >= 2 && (
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-all border-indigo-100 hover:border-indigo-300"
                    onClick={() => setIsCompareDialogOpen(true)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100">
                        <GitCompare className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Comparar Treinos</h3>
                        <p className="text-sm text-muted-foreground">
                          Visualize diferenças entre versões
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-64">
                <Label className="mb-2 block">Aluno</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="mb-2 block">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar treino..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full sm:w-40">
                <Label className="mb-2 block">Objetivo</Label>
                <Select value={goalFilter} onValueChange={setGoalFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="hypertrophy">Hipertrofia</SelectItem>
                    <SelectItem value="weight_loss">Emagrecimento</SelectItem>
                    <SelectItem value="recomposition">Recomposição</SelectItem>
                    <SelectItem value="bulking">Bulking</SelectItem>
                    <SelectItem value="cutting">Cutting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-40">
                <Label className="mb-2 block">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workouts List */}
        {!selectedStudent ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">Selecione um aluno</p>
              <p className="text-muted-foreground text-sm">
                Escolha um aluno acima para ver e gerenciar seus treinos
              </p>
            </CardContent>
          </Card>
        ) : workoutsLoading ? (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : filteredWorkouts && filteredWorkouts.length > 0 ? (
          <div className="space-y-3">
            {filteredWorkouts.map((workout) => {
              const typeBadge = getTypeBadge(workout.type);
              const difficultyBadge = getDifficultyBadge(workout.difficulty);
              const goalBadge = getGoalBadge((workout as any).goal);
              return (
                <Card key={workout.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation(`/treinos/${workout.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {(workout as any).generatedByAI && (
                            <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
                          )}
                          <h3 className="font-medium truncate">{workout.name}</h3>
                        </div>
                        {workout.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {workout.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <Badge className={goalBadge.className} variant="outline">
                            {goalBadge.label}
                          </Badge>
                          <Badge className={typeBadge.className} variant="outline">
                            {typeBadge.label}
                          </Badge>
                          <Badge className={difficultyBadge.className} variant="outline">
                            {difficultyBadge.label}
                          </Badge>
                          <Badge variant={workout.status === 'active' ? 'default' : 'secondary'}>
                            {workout.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Criado em {format(new Date(workout.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="flex-shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/treinos/${workout.id}?mode=view`); }}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setLocation(`/treinos/${workout.id}?mode=edit`); }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            setWorkoutToDuplicate(workout);
                            setIsDuplicateDialogOpen(true);
                          }}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar para Outro Aluno
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Mover treino para a lixeira?")) {
                                deleteMutation.mutate({ id: workout.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Dumbbell className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium">Nenhum treino encontrado</p>
              <p className="text-muted-foreground text-sm mb-4">
                Este aluno ainda não possui treinos cadastrados
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => setIsAIDialogOpen(true)}
                  className="border-purple-200 text-purple-700 hover:bg-purple-50"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar com IA
                </Button>
                <Button 
                  onClick={() => setIsNewDialogOpen(true)}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Treino
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Duplicar para Outro Aluno */}
        <Dialog open={isDuplicateDialogOpen} onOpenChange={(open) => {
          setIsDuplicateDialogOpen(open);
          if (!open) {
            setWorkoutToDuplicate(null);
            setDuplicateTargetStudent("");
          }
        }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Duplicar Treino</DialogTitle>
              <DialogDescription>
                {workoutToDuplicate && (
                  <>Duplicar "{workoutToDuplicate.name}" para outro aluno</>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Aluno de destino *</Label>
                <Select value={duplicateTargetStudent} onValueChange={setDuplicateTargetStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.filter(s => s.id.toString() !== selectedStudent).map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDuplicateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleDuplicate}
                disabled={!duplicateTargetStudent || duplicateMutation.isPending}
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                {duplicateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Duplicando...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Modal de Comparação de Treinos */}
        <Dialog open={isCompareDialogOpen} onOpenChange={setIsCompareDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-indigo-600" />
                Comparar Treinos
              </DialogTitle>
              <DialogDescription>
                Selecione dois treinos para comparar lado a lado
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Seletores de Treino */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Treino 1 (Anterior)</Label>
                  <Select value={compareWorkout1} onValueChange={setCompareWorkout1}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o treino" />
                    </SelectTrigger>
                    <SelectContent>
                      {workouts?.map((w: any) => (
                        <SelectItem key={w.id} value={w.id.toString()}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Treino 2 (Atual)</Label>
                  <Select value={compareWorkout2} onValueChange={setCompareWorkout2}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o treino" />
                    </SelectTrigger>
                    <SelectContent>
                      {workouts?.filter((w: any) => w.id.toString() !== compareWorkout1).map((w: any) => (
                        <SelectItem key={w.id} value={w.id.toString()}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Botão Comparar */}
              {compareWorkout1 && compareWorkout2 && (
                <Button
                  onClick={async () => {
                    setIsComparing(true);
                    try {
                      const response = await fetch('/api/trpc/workouts.compareWorkoutEfficiency', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          studentId: parseInt(selectedStudent),
                          workout1Id: parseInt(compareWorkout1),
                          workout2Id: parseInt(compareWorkout2),
                        }),
                      });
                      const result = await response.json();
                      if (result.result?.data) {
                        setComparisonResult(result.result.data);
                      }
                    } catch (error) {
                      toast.error('Erro ao comparar treinos');
                    } finally {
                      setIsComparing(false);
                    }
                  }}
                  disabled={isComparing}
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
                >
                  {isComparing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Comparando...
                    </>
                  ) : (
                    <>
                      <GitCompare className="h-4 w-4 mr-2" />
                      Comparar Eficiência
                    </>
                  )}
                </Button>
              )}
              
              {/* Resultado da Comparação */}
              {comparisonResult && (
                <div className="space-y-4">
                  {/* Cards de Comparação */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Treino 1 */}
                    <Card className="border-gray-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {comparisonResult.workout1?.name || 'Treino 1'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sessões</span>
                          <span className="font-medium">{comparisonResult.workout1?.sessions || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duração Média</span>
                          <span className="font-medium">{comparisonResult.workout1?.avgDuration || 0} min</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Consistência</span>
                          <span className="font-medium">{comparisonResult.workout1?.consistency || 0}%</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Treino 2 */}
                    <Card className="border-indigo-200 bg-indigo-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {comparisonResult.workout2?.name || 'Treino 2'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Sessões</span>
                          <span className="font-medium">{comparisonResult.workout2?.sessions || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duração Média</span>
                          <span className="font-medium">{comparisonResult.workout2?.avgDuration || 0} min</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Consistência</span>
                          <span className="font-medium">{comparisonResult.workout2?.consistency || 0}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Resultado da Eficiência */}
                  <Card className={`border-2 ${
                    comparisonResult.efficiencyChange > 0 
                      ? 'border-green-200 bg-green-50' 
                      : comparisonResult.efficiencyChange < 0 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-gray-200'
                  }`}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-center gap-4">
                        {comparisonResult.efficiencyChange > 0 ? (
                          <TrendingUp className="h-8 w-8 text-green-600" />
                        ) : comparisonResult.efficiencyChange < 0 ? (
                          <TrendingDown className="h-8 w-8 text-red-600" />
                        ) : (
                          <ArrowRight className="h-8 w-8 text-gray-600" />
                        )}
                        <div className="text-center">
                          <p className="text-2xl font-bold">
                            {comparisonResult.efficiencyChange > 0 ? '+' : ''}
                            {comparisonResult.efficiencyChange}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {comparisonResult.efficiencyChange > 0 
                              ? 'Mais eficiente' 
                              : comparisonResult.efficiencyChange < 0 
                                ? 'Menos eficiente' 
                                : 'Mesma eficiência'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Análise da IA */}
                  {comparisonResult.analysis && (
                    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-600" />
                          Análise da IA
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{comparisonResult.analysis}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Recomendações */}
                  {comparisonResult.recommendations && comparisonResult.recommendations.length > 0 && (
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base text-blue-700 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Recomendações
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1">
                          {comparisonResult.recommendations.map((r: string, i: number) => (
                            <li key={i} className="text-sm text-blue-700">{r}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
