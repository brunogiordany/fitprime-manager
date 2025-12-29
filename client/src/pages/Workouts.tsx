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
  RefreshCw
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
  const [workoutToDuplicate, setWorkoutToDuplicate] = useState<any>(null);
  const [duplicateTargetStudent, setDuplicateTargetStudent] = useState<string>("");
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
              <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    Gerar Treino com Inteligência Artificial
                  </DialogTitle>
                  <DialogDescription>
                    A IA criará um treino personalizado baseado na anamnese e medidas do aluno
                  </DialogDescription>
                </DialogHeader>
                
                {!aiPreview ? (
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
                ) : (
                  <ScrollArea className="flex-1 pr-2">
                    <div className="space-y-4 py-4">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{aiPreview.preview.name}</h3>
                          <div className="flex gap-2">
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
                      </div>
                      
                      <div className="space-y-4">
                        {aiPreview.preview.days.map((day: any, dayIndex: number) => (
                          <Card key={dayIndex}>
                            <CardHeader className="py-3">
                              <CardTitle className="text-base flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                                  {dayIndex + 1}
                                </div>
                                {day.name}
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="py-2">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="min-w-[200px]">Exercício</TableHead>
                                    <TableHead className="min-w-[100px]">Grupo</TableHead>
                                    <TableHead className="w-[60px]">Séries</TableHead>
                                    <TableHead className="w-[60px]">Reps</TableHead>
                                    <TableHead className="w-[80px]">Descanso</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {day.exercises.map((ex: any, exIndex: number) => (
                                    <TableRow key={exIndex}>
                                      <TableCell className="font-medium">{ex.name}</TableCell>
                                      <TableCell>{ex.muscleGroup}</TableCell>
                                      <TableCell>{ex.sets}</TableCell>
                                      <TableCell>{ex.reps}</TableCell>
                                      <TableCell>{ex.restSeconds}s</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      <div className="flex flex-col gap-3 pt-4 border-t">
                        <p className="text-sm text-muted-foreground text-center">
                          Revise o treino acima. Após salvar, você poderá editar os exercícios, séries e repetições.
                        </p>
                        <div className="flex gap-2">
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
                            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600"
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
                    </div>
                  </ScrollArea>
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
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Dificuldade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkouts.map((workout) => {
                    const typeBadge = getTypeBadge(workout.type);
                    const difficultyBadge = getDifficultyBadge(workout.difficulty);
                    const goalBadge = getGoalBadge((workout as any).goal);
                    return (
                      <TableRow key={workout.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(workout as any).generatedByAI && (
                              <Sparkles className="h-4 w-4 text-purple-500" />
                            )}
                            <div>
                              <p className="font-medium">{workout.name}</p>
                              {workout.description && (
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {workout.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={goalBadge.className}>
                            {goalBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={typeBadge.className}>
                            {typeBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={difficultyBadge.className}>
                            {difficultyBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={workout.status === 'active' ? 'default' : 'secondary'}>
                            {workout.status === 'active' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(workout.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setLocation(`/treinos/${workout.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setLocation(`/treinos/${workout.id}`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setWorkoutToDuplicate(workout);
                                setIsDuplicateDialogOpen(true);
                              }}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar para Outro Aluno
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
      </div>
    </DashboardLayout>
  );
}
