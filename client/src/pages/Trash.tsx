import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, RotateCcw, AlertTriangle, Dumbbell, Users, Calendar, FileText, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Helper para formatar horário em UTC
const formatTimeUTC = (date: Date) => {
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export default function Trash() {
  const [activeTab, setActiveTab] = useState("workouts");
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>("all");
  const [showBulkRestoreDialog, setShowBulkRestoreDialog] = useState(false);

  // Queries para buscar itens excluídos
  const { data: deletedWorkouts, refetch: refetchWorkouts } = trpc.workouts.listDeleted.useQuery();
  const { data: deletedStudents, refetch: refetchStudents } = trpc.students.listDeleted.useQuery();
  const { data: deletedSessions, refetch: refetchSessions } = trpc.sessions.listDeleted.useQuery();

  // Mutations para restaurar e excluir permanentemente
  const restoreWorkoutMutation = trpc.workouts.restore.useMutation({
    onSuccess: () => {
      toast.success("Treino restaurado com sucesso!");
      refetchWorkouts();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao restaurar treino: " + error.message);
    },
  });

  const deleteWorkoutPermanentlyMutation = trpc.workouts.permanentDelete.useMutation({
    onSuccess: () => {
      toast.success("Treino excluído permanentemente!");
      refetchWorkouts();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao excluir treino: " + error.message);
    },
  });

  const restoreStudentMutation = trpc.students.restore.useMutation({
    onSuccess: () => {
      toast.success("Aluno restaurado com sucesso!");
      refetchStudents();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao restaurar aluno: " + error.message);
    },
  });

  const deleteStudentPermanentlyMutation = trpc.students.deletePermanently.useMutation({
    onSuccess: () => {
      toast.success("Aluno excluído permanentemente!");
      refetchStudents();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao excluir aluno: " + error.message);
    },
  });

  const restoreSessionMutation = trpc.sessions.restore.useMutation({
    onSuccess: () => {
      toast.success("Sessão restaurada com sucesso!");
      refetchSessions();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao restaurar sessão: " + error.message);
    },
  });

  const deleteSessionPermanentlyMutation = trpc.sessions.deletePermanently.useMutation({
    onSuccess: () => {
      toast.success("Sessão excluída permanentemente!");
      refetchSessions();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao excluir sessão: " + error.message);
    },
  });

  // Mutation para esvaziar lixeira
  const emptyTrashMutation = trpc.trash.emptyAll.useMutation({
    onSuccess: () => {
      toast.success("Lixeira esvaziada com sucesso!");
      refetchWorkouts();
      refetchStudents();
      refetchSessions();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao esvaziar lixeira: " + error.message);
    },
  });

  // Obter lista única de alunos das sessões excluídas
  const studentsWithDeletedSessions = useMemo(() => {
    if (!deletedSessions) return [];
    const uniqueStudents = new Map<number, string>();
    deletedSessions.forEach(session => {
      if (session.studentId && session.studentName) {
        uniqueStudents.set(session.studentId, session.studentName);
      }
    });
    return Array.from(uniqueStudents, ([id, name]) => ({ id, name }));
  }, [deletedSessions]);

  // Filtrar sessões por aluno
  const filteredSessions = useMemo(() => {
    if (!deletedSessions) return [];
    if (selectedStudentFilter === "all") return deletedSessions;
    return deletedSessions.filter(s => s.studentId === parseInt(selectedStudentFilter));
  }, [deletedSessions, selectedStudentFilter]);

  // Restaurar todas as sessões (filtradas ou todas)
  const handleBulkRestore = async () => {
    const sessionsToRestore = filteredSessions;
    if (sessionsToRestore.length === 0) return;

    let successCount = 0;
    let errorCount = 0;

    for (const session of sessionsToRestore) {
      try {
        await restoreSessionMutation.mutateAsync({ id: session.id });
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    if (errorCount === 0) {
      toast.success(`${successCount} sessões restauradas com sucesso!`);
    } else {
      toast.warning(`${successCount} restauradas, ${errorCount} erros`);
    }
    
    setShowBulkRestoreDialog(false);
    refetchSessions();
  };

  const totalItems = 
    (deletedWorkouts?.length || 0) + 
    (deletedStudents?.length || 0) + 
    (deletedSessions?.length || 0);

  const formatDeletedDate = (date: Date | string | null) => {
    if (!date) return "Data desconhecida";
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Lixeira</h1>
          <p className="text-muted-foreground">
            Itens excluídos podem ser restaurados ou removidos permanentemente
          </p>
        </div>
        {totalItems > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="shrink-0">
                <Trash2 className="h-4 w-4 mr-2" />
                Esvaziar Lixeira
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Esvaziar Lixeira?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá excluir permanentemente todos os {totalItems} itens da lixeira.
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => emptyTrashMutation.mutate()}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Esvaziar Lixeira
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="inline-flex w-auto min-w-full sm:min-w-0">
            <TabsTrigger value="workouts" className="gap-2 whitespace-nowrap">
              <Dumbbell className="h-4 w-4" />
              <span className="hidden sm:inline">Treinos</span>
              {(deletedWorkouts?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {deletedWorkouts?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="students" className="gap-2 whitespace-nowrap">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Alunos</span>
              {(deletedStudents?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {deletedStudents?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2 whitespace-nowrap">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Sessões</span>
              {(deletedSessions?.length || 0) > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {deletedSessions?.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Treinos */}
        <TabsContent value="workouts" className="mt-4">
          {deletedWorkouts && deletedWorkouts.length > 0 ? (
            <div className="space-y-3">
              {deletedWorkouts.map((workout) => (
                <Card key={workout.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                          <Dumbbell className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{workout.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            Aluno: {workout.studentName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Excluído em: {formatDeletedDate(workout.deletedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreWorkoutMutation.mutate({ id: workout.id })}
                          disabled={restoreWorkoutMutation.isPending}
                          className="flex-1 sm:flex-none"
                        >
                          <RotateCcw className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Restaurar</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="shrink-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O treino "{workout.name}" será excluído permanentemente.
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteWorkoutPermanentlyMutation.mutate({ id: workout.id })}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir Permanentemente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Dumbbell className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum treino na lixeira</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Alunos */}
        <TabsContent value="students" className="mt-4">
          {deletedStudents && deletedStudents.length > 0 ? (
            <div className="space-y-3">
              {deletedStudents.map((student) => (
                <Card key={student.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{student.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {student.email || student.phone || "Sem contato"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Excluído em: {formatDeletedDate(student.deletedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => restoreStudentMutation.mutate({ id: student.id })}
                          disabled={restoreStudentMutation.isPending}
                          className="flex-1 sm:flex-none"
                        >
                          <RotateCcw className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Restaurar</span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="shrink-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                              <AlertDialogDescription>
                                O aluno "{student.name}" será excluído permanentemente junto com todos os seus dados.
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteStudentPermanentlyMutation.mutate({ id: student.id })}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir Permanentemente
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum aluno na lixeira</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Sessões */}
        <TabsContent value="sessions" className="mt-4 space-y-4">
          {/* Filtros e ações em massa para sessões */}
          {deletedSessions && deletedSessions.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                    <Select value={selectedStudentFilter} onValueChange={setSelectedStudentFilter}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <Users className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filtrar por aluno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os alunos</SelectItem>
                        {studentsWithDeletedSessions.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      {filteredSessions.length} sessão(ões) {selectedStudentFilter !== "all" ? "deste aluno" : "na lixeira"}
                    </p>
                  </div>
                  
                  {filteredSessions.length > 0 && (
                    <AlertDialog open={showBulkRestoreDialog} onOpenChange={setShowBulkRestoreDialog}>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" className="w-full sm:w-auto">
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Restaurar {selectedStudentFilter !== "all" ? "do Aluno" : "Todas"} ({filteredSessions.length})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restaurar sessões em massa?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {selectedStudentFilter !== "all" 
                              ? `Serão restauradas ${filteredSessions.length} sessões do aluno selecionado.`
                              : `Serão restauradas todas as ${filteredSessions.length} sessões da lixeira.`
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleBulkRestore}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restaurar Sessões
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {filteredSessions && filteredSessions.length > 0 ? (
            <div className="space-y-3">
              {filteredSessions.map((session) => {
                const sessionDate = new Date(session.scheduledAt);
                return (
                  <Card key={session.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                            <Calendar className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">
                              Sessão com {session.studentName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(sessionDate, "dd/MM/yyyy", { locale: ptBR })} às {formatTimeUTC(sessionDate)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Excluído em: {formatDeletedDate(session.deletedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => restoreSessionMutation.mutate({ id: session.id })}
                            disabled={restoreSessionMutation.isPending}
                            className="flex-1 sm:flex-none"
                          >
                            <RotateCcw className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Restaurar</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="shrink-0">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  A sessão será excluída permanentemente.
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteSessionPermanentlyMutation.mutate({ id: session.id })}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Excluir Permanentemente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {selectedStudentFilter !== "all" 
                    ? "Nenhuma sessão deste aluno na lixeira"
                    : "Nenhuma sessão na lixeira"
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Aviso */}
      {totalItems > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              Itens na lixeira serão excluídos permanentemente após 30 dias.
            </p>
          </CardContent>
        </Card>
      )}
      </div>
    </DashboardLayout>
  );
}
