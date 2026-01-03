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
  TrendingDown,
  Share2,
  MessageCircle,
  Download,
  History,
  ExternalLink
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { format } from "date-fns";
import CrefPopup from "@/components/CrefPopup";
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
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [showCrefPopup, setShowCrefPopup] = useState(false);
  const [pendingAIAction, setPendingAIAction] = useState<'generate' | 'analysis' | null>(null);
  const [studentAnalysis, setStudentAnalysis] = useState<any>(null);
  const [showPdfExportModal, setShowPdfExportModal] = useState(false);
  const [showAnalysisHistoryModal, setShowAnalysisHistoryModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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
      // Detectar erro de CREF e mostrar popup
      if (error.message?.includes('CREF')) {
        setPendingAIAction('generate');
        setShowCrefPopup(true);
      } else {
        toast.error("Erro ao gerar treino: " + error.message);
      }
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
      setIsAIDialogOpen(true); // Abrir o modal para mostrar a preview
      toast.success(`Treino ${data.version}.0 adaptado gerado! Revise e salve.`);
    },
    onError: (error) => {
      if (error.message?.includes('CREF')) {
        setPendingAIAction('generate');
        setShowCrefPopup(true);
      } else {
        toast.error("Erro ao gerar treino adaptado: " + error.message);
      }
    },
  });

  const getAnalysisMutation = trpc.workouts.getStudentAnalysis.useMutation({
    onSuccess: (data) => {
      setStudentAnalysis(data);
      setIsAnalysisDialogOpen(true);
      toast.success("Análise gerada com sucesso!");
    },
    onError: (error) => {
      if (error.message?.includes('CREF')) {
        setPendingAIAction('analysis');
        setShowCrefPopup(true);
      } else {
        toast.error("Erro ao gerar análise: " + error.message);
      }
    },
  });

  const saveAIMutation = trpc.workouts.saveAIGenerated.useMutation({
    onSuccess: (data) => {
      toast.success(`Treino "${data.name}" salvo com sucesso!`);
      setIsAIDialogOpen(false);
      setAiPreview(null);
      setCustomPrompt("");
      setIsAnalysisDialogOpen(false);
      setStudentAnalysis(null);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao salvar treino: " + error.message);
    },
  });

  // Mutation para marcar análise como compartilhada
  const markAnalysisSharedMutation = trpc.workouts.markAnalysisShared.useMutation({
    onSuccess: () => {
      // Silencioso - não precisa de feedback
    },
  });

  // Query para histórico de análises
  const { data: analysisHistory, refetch: refetchHistory } = trpc.workouts.getAnalysisHistory.useQuery(
    { studentId: parseInt(selectedStudent), limit: 20 },
    { enabled: !!selectedStudent && showAnalysisHistoryModal }
  );

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
              <DialogContent className="w-[95vw] max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b">
                  <DialogHeader className="pr-8">
                    <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 shrink-0" />
                      <span>Gerar Treino com Inteligência Artificial</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
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
                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 sm:px-6 py-4">
                      <div className="space-y-3 sm:space-y-4">
                        <div className={`rounded-lg p-3 sm:p-4 border ${aiPreview.isAdapted ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-100' : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-100'}`}>
                          <div className="flex flex-col gap-2 mb-2">
                            <h3 className="font-semibold text-sm sm:text-lg break-words">{aiPreview.preview.name}</h3>
                            <div className="flex gap-1.5 flex-wrap">
                              {aiPreview.isAdapted && (
                                <Badge className="bg-orange-100 text-orange-700 text-[10px] sm:text-xs">
                                  Treino {aiPreview.adaptationInfo?.version}.0
                                </Badge>
                              )}
                              <Badge className={`text-[10px] sm:text-xs ${getGoalBadge(aiPreview.preview.goal).className}`}>
                                {getGoalBadge(aiPreview.preview.goal).label}
                              </Badge>
                              <Badge className={`text-[10px] sm:text-xs ${getDifficultyBadge(aiPreview.preview.difficulty).className}`}>
                                {getDifficultyBadge(aiPreview.preview.difficulty).label}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">{aiPreview.preview.description}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                            Para: {aiPreview.studentName}
                          </p>
                          
                          {/* Informações de Adaptação */}
                          {aiPreview.isAdapted && aiPreview.adaptationInfo && (
                            <div className="mt-3 space-y-2">
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
                              <CardContent className="py-2 px-3">
                                <div className="space-y-2">
                                  {day.exercises.map((ex: any, exIndex: number) => (
                                    <div key={exIndex} className="border rounded-lg p-2 bg-muted/30 hover:bg-muted/50">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-sm truncate">{ex.name}</p>
                                          <p className="text-xs text-muted-foreground">{ex.muscleGroup}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => setEditingExercise({ dayIndex, exIndex, exercise: { ...ex } })}
                                            title="Editar exercício"
                                          >
                                            <Edit className="h-3 w-3" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDeleteExercise(dayIndex, exIndex)}
                                            title="Remover exercício"
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 mt-1 text-xs">
                                        <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{ex.sets} séries</span>
                                        <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{ex.reps} reps</span>
                                        <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">{ex.restSeconds}s desc.</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Botões fixos no rodapé - SEMPRE VISÍVEIS */}
                    <div className="border-t bg-background px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
                      <p className="text-xs sm:text-sm text-muted-foreground text-center mb-2 sm:mb-3">
                        Revise o treino acima. Após salvar, você poderá editar os exercícios.
                      </p>
                      <div className="flex gap-2 sm:gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setAiPreview(null)}
                          className="flex-1 text-xs sm:text-sm"
                        >
                          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Gerar Novo
                        </Button>
                        <Button 
                          onClick={handleSaveAIWorkout}
                          disabled={saveAIMutation.isPending}
                          className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs sm:text-sm"
                        >
                          {saveAIMutation.isPending ? (
                            <>
                              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 animate-spin" />
                              Salvando...
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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
            
            {/* Card de Análise do Aluno - sempre aparece quando tem aluno selecionado */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-all border-cyan-100 hover:border-cyan-300"
              onClick={() => {
                getAnalysisMutation.mutate({
                  studentId: parseInt(selectedStudent),
                });
              }}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100">
                  <Brain className="h-6 w-6 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Análise do Aluno</h3>
                  <p className="text-sm text-muted-foreground">
                    IA analisa evolução e sugere adaptações
                  </p>
                </div>
                {getAnalysisMutation.isPending && (
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-600" />
                )}
              </CardContent>
            </Card>
            
            {/* Card de Comparar Treinos - só aparece se tiver 2+ treinos */}
            {workouts && workouts.length >= 2 && (
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
          <DialogContent className="w-full max-w-[95vw] sm:max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <GitCompare className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 flex-shrink-0" />
                <span className="truncate">Comparar Treinos</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Selecione dois treinos para comparar
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {/* Seletores de Treino */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Treino 1 (Anterior)</Label>
                  <Select value={compareWorkout1} onValueChange={setCompareWorkout1}>
                    <SelectTrigger className="w-full text-xs sm:text-sm">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {workouts?.map((w: any) => (
                        <SelectItem key={w.id} value={w.id.toString()} className="text-xs sm:text-sm">
                          <span className="truncate block max-w-[200px]">{w.name}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">Treino 2 (Atual)</Label>
                  <Select value={compareWorkout2} onValueChange={setCompareWorkout2}>
                    <SelectTrigger className="w-full text-xs sm:text-sm">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {workouts?.filter((w: any) => w.id.toString() !== compareWorkout1).map((w: any) => (
                        <SelectItem key={w.id} value={w.id.toString()} className="text-xs sm:text-sm">
                          <span className="truncate block max-w-[200px]">{w.name}</span>
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
                    if (!selectedStudent) {
                      toast.error('Selecione um aluno primeiro');
                      return;
                    }
                    setIsComparing(true);
                    try {
                      const response = await fetch('/api/trpc/workouts.compareWorkoutEfficiency?batch=1', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          "0": {
                            json: {
                              studentId: parseInt(selectedStudent),
                              workoutId1: parseInt(compareWorkout1),
                              workoutId2: parseInt(compareWorkout2),
                            }
                          }
                        }),
                      });
                      const result = await response.json();
                      if (result[0]?.result?.data?.json) {
                        setComparisonResult(result[0].result.data.json);
                        toast.success('Comparação realizada!');
                      } else if (result[0]?.error) {
                        toast.error(result[0].error.message || 'Erro ao comparar treinos');
                      } else {
                        toast.error('Erro ao comparar treinos');
                      }
                    } catch (error) {
                      console.error('Erro ao comparar:', error);
                      toast.error('Erro ao comparar treinos');
                    } finally {
                      setIsComparing(false);
                    }
                  }}
                  disabled={isComparing || !selectedStudent}
                  className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-sm sm:text-base"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Treino 1 */}
                    <Card className="border-gray-200">
                      <CardHeader className="pb-2 px-3 sm:px-6">
                        <CardTitle className="text-sm sm:text-base truncate">
                          {comparisonResult.workout1?.name || 'Treino 1'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1.5 sm:space-y-2 px-3 sm:px-6">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Sessões</span>
                          <span className="font-medium">{comparisonResult.workout1?.metrics?.totalSessions || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Duração Média</span>
                          <span className="font-medium">{Math.round(comparisonResult.workout1?.metrics?.averageDuration || 0)} min</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Treino 2 */}
                    <Card className="border-indigo-200 bg-indigo-50/50">
                      <CardHeader className="pb-2 px-3 sm:px-6">
                        <CardTitle className="text-sm sm:text-base truncate">
                          {comparisonResult.workout2?.name || 'Treino 2'}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-1.5 sm:space-y-2 px-3 sm:px-6">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Sessões</span>
                          <span className="font-medium">{comparisonResult.workout2?.metrics?.totalSessions || 0}</span>
                        </div>
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">Duração Média</span>
                          <span className="font-medium">{Math.round(comparisonResult.workout2?.metrics?.averageDuration || 0)} min</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Análise da IA */}
                  {comparisonResult.analysis && (
                    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                      <CardHeader className="pb-2 px-3 sm:px-6">
                        <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                          <Brain className="h-4 w-4 text-purple-600 flex-shrink-0" />
                          Análise da IA
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 sm:px-6">
                        <p className="text-xs sm:text-sm whitespace-pre-wrap" style={{ wordBreak: 'break-word' }}>{comparisonResult.analysis}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Modal de Análise do Aluno */}
        <Dialog open={isAnalysisDialogOpen} onOpenChange={(open) => {
          setIsAnalysisDialogOpen(open);
          if (!open) {
            setStudentAnalysis(null);
          }
        }}>
          <DialogContent className="w-[95vw] max-w-lg max-h-[85vh] overflow-y-auto overflow-x-hidden p-3 sm:p-4">
            <DialogHeader className="pr-8">
              <DialogTitle className="flex items-center gap-2 flex-wrap text-base sm:text-lg">
                <Brain className="h-5 w-5 text-cyan-600 shrink-0" />
                <span className="break-words">Análise: {studentAnalysis?.studentName}</span>
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Evolução e recomendações da IA
              </DialogDescription>
            </DialogHeader>
            
            {studentAnalysis && (
              <div className="space-y-3 w-full">
                {/* Resumo */}
                <Card className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50">
                  <CardContent className="p-3">
                    <p className="text-xs sm:text-sm leading-relaxed break-words" style={{ wordBreak: 'break-word' }}>{studentAnalysis.analysis.summary}</p>
                  </CardContent>
                </Card>
                
                {/* Métricas Rápidas */}
                <div className="grid grid-cols-2 gap-2">
                  {studentAnalysis.latestMeasurement?.weight && (
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Peso</p>
                      <p className="text-sm sm:text-lg font-bold">{studentAnalysis.latestMeasurement.weight} kg</p>
                    </div>
                  )}
                  {studentAnalysis.latestMeasurement?.bodyFat && (
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Gordura</p>
                      <p className="text-sm sm:text-lg font-bold">{studentAnalysis.latestMeasurement.bodyFat}%</p>
                    </div>
                  )}
                  {studentAnalysis.workoutPerformance && (
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Treinos (30d)</p>
                      <p className="text-sm sm:text-lg font-bold">{studentAnalysis.workoutPerformance.totalWorkouts}</p>
                    </div>
                  )}
                  {studentAnalysis.workoutPerformance?.consistency && (
                    <div className="bg-gray-50 rounded-lg p-2 sm:p-3 text-center">
                      <p className="text-[10px] sm:text-xs text-muted-foreground">Consistência</p>
                      <p className="text-sm sm:text-lg font-bold">{studentAnalysis.workoutPerformance.consistency}</p>
                    </div>
                  )}
                </div>
                
                {/* Evolução das Medidas */}
                {studentAnalysis.measurementEvolution && (
                  <Card>
                    <CardHeader className="p-3 pb-1 sm:pb-2">
                      <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                        <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                        Evolução ({studentAnalysis.measurementEvolution.periodDays} dias)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        {studentAnalysis.measurementEvolution.weightChange !== null && (
                          <div className="text-center">
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Peso</p>
                            <p className={`text-xs sm:text-sm font-bold ${studentAnalysis.measurementEvolution.weightChange < 0 ? 'text-green-600' : studentAnalysis.measurementEvolution.weightChange > 0 ? 'text-red-600' : ''}`}>
                              {studentAnalysis.measurementEvolution.weightChange > 0 ? '+' : ''}{studentAnalysis.measurementEvolution.weightChange.toFixed(1)} kg
                            </p>
                          </div>
                        )}
                        {studentAnalysis.measurementEvolution.bodyFatChange !== null && (
                          <div className="text-center">
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Gordura</p>
                            <p className={`text-xs sm:text-sm font-bold ${studentAnalysis.measurementEvolution.bodyFatChange < 0 ? 'text-green-600' : studentAnalysis.measurementEvolution.bodyFatChange > 0 ? 'text-red-600' : ''}`}>
                              {studentAnalysis.measurementEvolution.bodyFatChange > 0 ? '+' : ''}{studentAnalysis.measurementEvolution.bodyFatChange.toFixed(1)}%
                            </p>
                          </div>
                        )}
                        {studentAnalysis.measurementEvolution.muscleMassChange !== null && (
                          <div className="text-center">
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Músculo</p>
                            <p className={`text-xs sm:text-sm font-bold ${studentAnalysis.measurementEvolution.muscleMassChange > 0 ? 'text-green-600' : studentAnalysis.measurementEvolution.muscleMassChange < 0 ? 'text-red-600' : ''}`}>
                              {studentAnalysis.measurementEvolution.muscleMassChange > 0 ? '+' : ''}{studentAnalysis.measurementEvolution.muscleMassChange.toFixed(1)} kg
                            </p>
                          </div>
                        )}
                        {studentAnalysis.measurementEvolution.waistChange !== null && (
                          <div className="text-center">
                            <p className="text-[10px] sm:text-xs text-muted-foreground">Cintura</p>
                            <p className={`text-xs sm:text-sm font-bold ${studentAnalysis.measurementEvolution.waistChange < 0 ? 'text-green-600' : studentAnalysis.measurementEvolution.waistChange > 0 ? 'text-red-600' : ''}`}>
                              {studentAnalysis.measurementEvolution.waistChange > 0 ? '+' : ''}{studentAnalysis.measurementEvolution.waistChange.toFixed(1)} cm
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Pontos Fortes e Déficits */}
                <div className="grid gap-3">
                  {studentAnalysis.analysis.strengths?.length > 0 && (
                    <Card className="border-green-200">
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs sm:text-sm text-green-700 flex items-center gap-2">
                          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                          Pontos Fortes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <ul className="space-y-1">
                          {studentAnalysis.analysis.strengths.map((s: string, i: number) => (
                            <li key={i} className="text-xs sm:text-sm flex items-start gap-2">
                              <span className="text-green-500 mt-0.5 shrink-0">•</span>
                              <span className="break-words" style={{ wordBreak: 'break-word' }}>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  
                  {studentAnalysis.analysis.deficits?.length > 0 && (
                    <Card className="border-red-200">
                      <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs sm:text-sm text-red-700 flex items-center gap-2">
                          <X className="h-3 w-3 sm:h-4 sm:w-4" />
                          Déficits / Atenção
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <ul className="space-y-1">
                          {studentAnalysis.analysis.deficits.map((d: string, i: number) => (
                            <li key={i} className="text-xs sm:text-sm flex items-start gap-2">
                              <span className="text-red-500 mt-0.5 shrink-0">•</span>
                              <span className="break-words" style={{ wordBreak: 'break-word' }}>{d}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {/* Grupos Musculares */}
                <div className="grid gap-3">
                  {studentAnalysis.analysis.muscleGroupsProgressing?.length > 0 && (
                    <div>
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5">Grupos Evoluindo Bem</p>
                      <div className="flex flex-wrap gap-1">
                        {studentAnalysis.analysis.muscleGroupsProgressing.map((g: string, i: number) => (
                          <Badge key={i} className="bg-green-100 text-green-700 text-[10px] sm:text-xs px-1.5 py-0.5">{g}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {studentAnalysis.analysis.muscleGroupsToFocus?.length > 0 && (
                    <div>
                      <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5">Grupos para Focar</p>
                      <div className="flex flex-wrap gap-1">
                        {studentAnalysis.analysis.muscleGroupsToFocus.map((g: string, i: number) => (
                          <Badge key={i} className="bg-orange-100 text-orange-700 text-[10px] sm:text-xs px-1.5 py-0.5">{g}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Recomendações */}
                {studentAnalysis.analysis.recommendations?.length > 0 && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="p-3 pb-1">
                      <CardTitle className="text-xs sm:text-sm text-blue-700 flex items-center gap-2">
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                        Recomendações
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <ul className="space-y-1">
                        {studentAnalysis.analysis.recommendations.map((r: string, i: number) => (
                          <li key={i} className="text-xs sm:text-sm text-blue-700 flex items-start gap-2">
                            <span className="mt-0.5 shrink-0">{i + 1}.</span>
                            <span className="break-words" style={{ wordBreak: 'break-word' }}>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                
                {/* Botão de Gerar Treino 2.0 */}
                <Card className={`border-2 ${studentAnalysis.analysis.shouldAdaptWorkout ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50' : 'border-gray-200'}`}>
                  <CardContent className="p-3">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <RefreshCw className={`h-4 w-4 shrink-0 ${studentAnalysis.analysis.shouldAdaptWorkout ? 'text-orange-600' : 'text-gray-400'}`} />
                          <h4 className="text-xs sm:text-sm font-semibold">
                            {studentAnalysis.analysis.shouldAdaptWorkout ? 'Recomendado: Criar Treino' : 'Adaptação Não Necessária'}
                          </h4>
                          {studentAnalysis.analysis.adaptationPriority && studentAnalysis.analysis.adaptationPriority !== 'none' && (
                            <Badge className={`text-[10px] sm:text-xs ${{
                              high: 'bg-red-100 text-red-700',
                              medium: 'bg-orange-100 text-orange-700',
                              low: 'bg-yellow-100 text-yellow-700',
                            }[studentAnalysis.analysis.adaptationPriority as 'high' | 'medium' | 'low'] || 'bg-gray-100'}`}>
                              {{
                                high: 'Alta',
                                medium: 'Média',
                                low: 'Baixa',
                              }[studentAnalysis.analysis.adaptationPriority as 'high' | 'medium' | 'low']}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground break-words" style={{ wordBreak: 'break-word' }}>
                          {studentAnalysis.analysis.adaptationReason}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          generateAdaptedMutation.mutate({
                            studentId: parseInt(selectedStudent),
                          });
                        }}
                        disabled={generateAdaptedMutation.isPending}
                        className={`w-full text-xs sm:text-sm ${studentAnalysis.analysis.shouldAdaptWorkout 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600' 
                          : ''}`}
                      >
                        {generateAdaptedMutation.isPending ? (
                          <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        )}
                        Gerar Treino {studentAnalysis.totalWorkouts + 1}.0
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Info do Treino Atual */}
                {studentAnalysis.currentWorkout && (
                  <p className="text-xs text-muted-foreground text-center">
                    Treino atual: <strong>{studentAnalysis.currentWorkout.name}</strong> ({studentAnalysis.currentWorkout.daysCount} dias)
                  </p>
                )}
                
                {/* Botões de Ações */}
                <div className="border-t pt-3 mt-3">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Exportar PDF */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs flex items-center justify-center gap-2 border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setShowPdfExportModal(true);
                      }}
                    >
                      <Download className="h-3 w-3" />
                      Exportar PDF
                    </Button>
                    
                    {/* Histórico */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs flex items-center justify-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
                      onClick={() => {
                        setShowAnalysisHistoryModal(true);
                      }}
                    >
                      <History className="h-3 w-3" />
                      Histórico
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Popup de CREF */}
        <CrefPopup
          open={showCrefPopup}
          onOpenChange={setShowCrefPopup}
          onSuccess={() => {
            // Após salvar CREF, tentar novamente a ação pendente
            if (pendingAIAction === 'generate' && selectedStudent) {
              generateAIMutation.mutate({
                studentId: parseInt(selectedStudent),
                customPrompt: customPrompt || undefined,
              });
            } else if (pendingAIAction === 'analysis' && selectedStudent) {
              getAnalysisMutation.mutate({
                studentId: parseInt(selectedStudent),
              });
            }
            setPendingAIAction(null);
          }}
        />
        
        {/* Modal de Exportar PDF */}
        <Dialog open={showPdfExportModal} onOpenChange={setShowPdfExportModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-red-600" />
                Exportar Análise em PDF
              </DialogTitle>
            </DialogHeader>
            
            {studentAnalysis && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Conteúdo do PDF:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Resumo da análise</li>
                    <li>• Pontos fortes e déficits</li>
                    <li>• Evolução das medidas</li>
                    <li>• Grupos musculares em foco</li>
                    <li>• Recomendações personalizadas</li>
                    <li>• Data e hora da análise</li>
                  </ul>
                </div>
                
                <Button
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                  disabled={isGeneratingPdf}
                  onClick={async () => {
                    setIsGeneratingPdf(true);
                    try {
                      // Gerar HTML para PDF
                      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .summary { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .section { margin: 20px 0; }
    .badge { display: inline-block; background: #e5e7eb; padding: 4px 12px; border-radius: 20px; margin: 4px; font-size: 12px; }
    .badge-green { background: #d1fae5; color: #047857; }
    .badge-orange { background: #ffedd5; color: #c2410c; }
    ul { padding-left: 20px; }
    li { margin: 8px 0; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; }
    .metrics { display: flex; gap: 20px; flex-wrap: wrap; }
    .metric { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; min-width: 100px; }
    .metric-value { font-size: 24px; font-weight: bold; color: #111827; }
    .metric-label { font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <h1>📊 Análise de Evolução</h1>
  <p><strong>Aluno:</strong> ${studentAnalysis.studentName}</p>
  <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
  
  <div class="summary">
    <h2 style="margin-top: 0;">📝 Resumo</h2>
    <p>${studentAnalysis.analysis.summary}</p>
  </div>
  
  ${studentAnalysis.latestMeasurement ? `
  <div class="section">
    <h2>📏 Métricas Atuais</h2>
    <div class="metrics">
      ${studentAnalysis.latestMeasurement.weight ? `<div class="metric"><div class="metric-value">${studentAnalysis.latestMeasurement.weight}</div><div class="metric-label">Peso (kg)</div></div>` : ''}
      ${studentAnalysis.latestMeasurement.bodyFat ? `<div class="metric"><div class="metric-value">${studentAnalysis.latestMeasurement.bodyFat}%</div><div class="metric-label">Gordura</div></div>` : ''}
      ${studentAnalysis.workoutPerformance?.totalWorkouts ? `<div class="metric"><div class="metric-value">${studentAnalysis.workoutPerformance.totalWorkouts}</div><div class="metric-label">Treinos (30d)</div></div>` : ''}
      ${studentAnalysis.workoutPerformance?.consistency ? `<div class="metric"><div class="metric-value">${studentAnalysis.workoutPerformance.consistency}</div><div class="metric-label">Consistência</div></div>` : ''}
    </div>
  </div>
  ` : ''}
  
  ${studentAnalysis.analysis.strengths?.length > 0 ? `
  <div class="section">
    <h2>✅ Pontos Fortes</h2>
    <ul>
      ${studentAnalysis.analysis.strengths.map((s: string) => `<li>${s}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
  
  ${studentAnalysis.analysis.deficits?.length > 0 ? `
  <div class="section">
    <h2>⚠️ Pontos de Atenção</h2>
    <ul>
      ${studentAnalysis.analysis.deficits.map((d: string) => `<li>${d}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
  
  ${studentAnalysis.analysis.muscleGroupsProgressing?.length > 0 ? `
  <div class="section">
    <h2>💪 Grupos Musculares Evoluindo</h2>
    <div>
      ${studentAnalysis.analysis.muscleGroupsProgressing.map((g: string) => `<span class="badge badge-green">${g}</span>`).join('')}
    </div>
  </div>
  ` : ''}
  
  ${studentAnalysis.analysis.muscleGroupsToFocus?.length > 0 ? `
  <div class="section">
    <h2>🎯 Grupos para Focar</h2>
    <div>
      ${studentAnalysis.analysis.muscleGroupsToFocus.map((g: string) => `<span class="badge badge-orange">${g}</span>`).join('')}
    </div>
  </div>
  ` : ''}
  
  ${studentAnalysis.analysis.recommendations?.length > 0 ? `
  <div class="section">
    <h2>💡 Recomendações</h2>
    <ol>
      ${studentAnalysis.analysis.recommendations.map((r: string) => `<li>${r}</li>`).join('')}
    </ol>
  </div>
  ` : ''}
  
  <div class="section">
    <h2>🏋️ Próximos Passos</h2>
    <p><strong>Prioridade:</strong> ${{
      high: '🔴 Alta - Ação imediata recomendada',
      medium: '🟡 Média - Ajustes sugeridos',
      low: '🟢 Baixa - Manter acompanhamento',
      none: '✅ Nenhuma ação necessária'
    }[studentAnalysis.analysis.adaptationPriority as string] || 'Não definida'}</p>
    <p>${studentAnalysis.analysis.adaptationReason}</p>
  </div>
  
  <div class="footer">
    <p>Relatório gerado automaticamente por FitPrime</p>
    <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
  </div>
</body>
</html>
                      `;
                      
                      // Criar blob e download
                      const blob = new Blob([htmlContent], { type: 'text/html' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `analise-${studentAnalysis.studentName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.html`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                      
                      toast.success("Relatório exportado! Abra o arquivo HTML no navegador e use Ctrl+P para salvar como PDF.");
                      setShowPdfExportModal(false);
                    } catch (error) {
                      toast.error("Erro ao exportar relatório");
                    } finally {
                      setIsGeneratingPdf(false);
                    }
                  }}
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Baixar Relatório
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  O arquivo será baixado em HTML. Abra no navegador e use Ctrl+P (ou Cmd+P) para salvar como PDF.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Modal de Histórico de Análises */}
        <Dialog open={showAnalysisHistoryModal} onOpenChange={setShowAnalysisHistoryModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                Histórico de Análises
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-3">
              {!analysisHistory || analysisHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhuma análise anterior encontrada</p>
                  <p className="text-xs mt-1">As análises serão salvas automaticamente</p>
                </div>
              ) : (
                analysisHistory.map((analysis: any) => (
                  <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {format(new Date(analysis.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </Badge>
                            {analysis.sharedViaWhatsapp && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Compartilhado
                              </Badge>
                            )}
                            {analysis.exportedAsPdf && (
                              <Badge className="bg-red-100 text-red-700 text-xs">
                                <Download className="h-3 w-3 mr-1" />
                                PDF
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {analysis.summary}
                          </p>
                          
                          <div className="flex flex-wrap gap-2">
                            {analysis.mainRecommendationPriority && (
                              <Badge className={`text-xs ${
                                analysis.mainRecommendationPriority === 'high' ? 'bg-red-100 text-red-700' :
                                analysis.mainRecommendationPriority === 'medium' ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                Prioridade: {{
                                  high: 'Alta',
                                  medium: 'Média',
                                  low: 'Baixa'
                                }[analysis.mainRecommendationPriority as string]}
                              </Badge>
                            )}
                            {analysis.consistencyScore && (
                              <Badge variant="outline" className="text-xs">
                                Consistência: {analysis.consistencyScore}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => {
                            // Carregar análise completa
                            setStudentAnalysis({
                              analysisId: analysis.id,
                              studentName: analysis.studentName,
                              analysis: {
                                summary: analysis.summary,
                                strengths: analysis.strengths,
                                deficits: analysis.attentionPoints,
                                recommendations: analysis.recommendations,
                                muscleGroupsProgressing: analysis.muscleGroupsEvolving,
                                muscleGroupsToFocus: analysis.muscleGroupsToFocus,
                                adaptationPriority: analysis.mainRecommendationPriority,
                                adaptationReason: analysis.mainRecommendation,
                                shouldAdaptWorkout: analysis.mainRecommendationPriority !== 'low',
                              },
                              latestMeasurement: analysis.measurementSnapshot,
                              workoutPerformance: analysis.workoutSnapshot,
                            });
                            setShowAnalysisHistoryModal(false);
                            setIsAnalysisDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
