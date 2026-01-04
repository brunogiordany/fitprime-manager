import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { 
  ClipboardList, 
  Search, 
  Plus, 
  ArrowLeft,
  Loader2,
  Sparkles,
  Edit,
  Trash2,
  Eye,
  Copy,
  Send,
  MoreHorizontal,
  Target,
  Calendar,
  User,
  Flame,
  Beef,
  Wheat,
  Droplet
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const objectives = [
  { value: "weight_loss", label: "Emagrecimento" },
  { value: "muscle_gain", label: "Ganho de Massa" },
  { value: "maintenance", label: "Manutenção" },
  { value: "health", label: "Saúde Geral" },
  { value: "performance", label: "Performance" },
];

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 border-gray-300",
  active: "bg-green-100 text-green-700 border-green-300",
  completed: "bg-blue-100 text-blue-700 border-blue-300",
  cancelled: "bg-red-100 text-red-700 border-red-300",
};

const statusLabels: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default function MealPlansPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form state para geração com IA
  const [generateForm, setGenerateForm] = useState({
    studentId: 0,
    objective: "weight_loss" as const,
    mealsPerDay: 5,
    restrictions: [] as string[],
    allergies: [] as string[],
    preferences: "",
    targetCalories: undefined as number | undefined,
  });

  // Queries
  const { data: plans, isLoading, refetch } = trpc.nutrition.mealPlans.list.useQuery({
    status: statusFilter !== "all" ? statusFilter as any : undefined,
  });

  const { data: students } = trpc.students.list.useQuery({});

  // Mutations
  const generatePlan = trpc.nutrition.mealPlans.generateWithAI.useMutation({
    onSuccess: (data) => {
      toast.success("Plano alimentar gerado com sucesso!");
      setIsGenerateOpen(false);
      setIsGenerating(false);
      refetch();
      // Redirecionar para o plano criado
      if (data?.id) {
        setLocation(`/nutrition/planos-alimentares/${data.id}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao gerar plano alimentar");
      setIsGenerating(false);
    },
  });

  const deletePlan = trpc.nutrition.mealPlans.delete.useMutation({
    onSuccess: () => {
      toast.success("Plano excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir plano");
    },
  });

  // Duplicar plano - implementar depois
  const handleDuplicate = (id: number) => {
    toast.info("Funcionalidade em desenvolvimento");
  };

  const handleGenerate = () => {
    if (!generateForm.studentId) {
      toast.error("Selecione um paciente");
      return;
    }
    setIsGenerating(true);
    generatePlan.mutate({
      ...generateForm,
      preferences: generateForm.preferences ? generateForm.preferences.split(',').map(s => s.trim()).filter(Boolean) : [],
    });
  };

  const filteredPlans = plans?.plans?.filter((plan: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        plan.name?.toLowerCase().includes(searchLower) ||
        plan.studentName?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/nutrition")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ClipboardList className="h-6 w-6 text-emerald-600" />
                Planos Alimentares
              </h1>
              <p className="text-muted-foreground">
                {plans?.total || 0} planos cadastrados
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/nutrition/planos-alimentares/novo")}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Manual
            </Button>
            <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar com IA
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Gerar Plano com IA
                  </DialogTitle>
                  <DialogDescription>
                    A IA irá criar um plano alimentar personalizado baseado nos dados do paciente
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Paciente *</Label>
                    <Select 
                      value={generateForm.studentId.toString()} 
                      onValueChange={(v) => setGenerateForm({ ...generateForm, studentId: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
                      </SelectTrigger>
                      <SelectContent>
                        {students?.map((student: any) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Objetivo</Label>
                    <Select 
                      value={generateForm.objective} 
                      onValueChange={(v: any) => setGenerateForm({ ...generateForm, objective: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {objectives.map((obj) => (
                          <SelectItem key={obj.value} value={obj.value}>
                            {obj.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Refeições por dia</Label>
                    <Select 
                      value={generateForm.mealsPerDay.toString()} 
                      onValueChange={(v) => setGenerateForm({ ...generateForm, mealsPerDay: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[3, 4, 5, 6].map((n) => (
                          <SelectItem key={n} value={n.toString()}>
                            {n} refeições
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Calorias alvo (opcional)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 2000"
                      value={generateForm.targetCalories || ""}
                      onChange={(e) => setGenerateForm({ 
                        ...generateForm, 
                        targetCalories: e.target.value ? parseInt(e.target.value) : undefined 
                      })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para cálculo automático baseado nos dados do paciente
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Preferências/Observações</Label>
                    <Textarea
                      placeholder="Ex: Prefere café da manhã leve, não gosta de peixe..."
                      value={generateForm.preferences}
                      onChange={(e) => setGenerateForm({ ...generateForm, preferences: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar Plano
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar planos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Planos */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !filteredPlans || filteredPlans.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Nenhum plano alimentar encontrado</p>
                <Button 
                  variant="outline" 
                  className="mt-4" 
                  onClick={() => setIsGenerateOpen(true)}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar primeiro plano com IA
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plano</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Objetivo</TableHead>
                    <TableHead className="text-center">Macros</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlans?.map((plan: any) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {plan.name}
                            {plan.generatedByAI && (
                              <Sparkles className="h-3 w-3 text-purple-500" />
                            )}
                          </div>
                          {plan.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {plan.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {plan.studentName || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          {objectives.find(o => o.value === plan.objective)?.label || plan.objective}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-3 text-xs">
                          <div className="flex items-center gap-1" title="Calorias">
                            <Flame className="h-3 w-3 text-orange-500" />
                            {plan.targetCalories || "-"}
                          </div>
                          <div className="flex items-center gap-1" title="Proteína">
                            <Beef className="h-3 w-3 text-red-500" />
                            {plan.targetProtein || "-"}g
                          </div>
                          <div className="flex items-center gap-1" title="Carboidratos">
                            <Wheat className="h-3 w-3 text-amber-500" />
                            {plan.targetCarbs || "-"}g
                          </div>
                          <div className="flex items-center gap-1" title="Gordura">
                            <Droplet className="h-3 w-3 text-yellow-500" />
                            {plan.targetFat || "-"}g
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[plan.status]}>
                          {statusLabels[plan.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(plan.createdAt).toLocaleDateString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLocation(`/nutrition/planos-alimentares/${plan.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/nutrition/planos-alimentares/${plan.id}/editar`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(plan.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                              <Send className="h-4 w-4 mr-2" />
                              Enviar para paciente
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("Excluir este plano?")) {
                                  deletePlan.mutate({ id: plan.id });
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
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
