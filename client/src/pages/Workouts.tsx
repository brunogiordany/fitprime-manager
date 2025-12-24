import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  Calendar
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Workouts() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [newWorkout, setNewWorkout] = useState({
    name: "",
    description: "",
    type: "strength" as const,
    difficulty: "intermediate" as const,
  });

  const { data: students, isLoading: studentsLoading } = trpc.students.list.useQuery({});
  
  // Get workouts for selected student
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

  const deleteMutation = trpc.workouts.delete.useMutation({
    onSuccess: () => {
      toast.success("Treino excluído!");
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

  const filteredWorkouts = workouts?.filter(workout => {
    const matchesSearch = workout.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || workout.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                  Crie um novo treino para um aluno
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
                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                    onClick={handleCreateWorkout}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Criando..." : "Criar Treino"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label className="mb-2 block">Aluno</Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um aluno para ver treinos" />
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
                    return (
                      <TableRow key={workout.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{workout.name}</p>
                            {workout.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {workout.description}
                              </p>
                            )}
                          </div>
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
                              <DropdownMenuItem onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                                <Copy className="h-4 w-4 mr-2" />
                                Duplicar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm("Tem certeza que deseja excluir este treino?")) {
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
              <Button 
                onClick={() => setIsNewDialogOpen(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Treino
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
