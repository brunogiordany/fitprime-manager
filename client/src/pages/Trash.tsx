import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, RotateCcw, AlertTriangle, Dumbbell, Users, Calendar, FileText } from "lucide-react";
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

export default function Trash() {
  const [activeTab, setActiveTab] = useState("workouts");

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

  const totalItems = 
    (deletedWorkouts?.length || 0) + 
    (deletedStudents?.length || 0) + 
    (deletedSessions?.length || 0);

  const formatDeletedDate = (date: Date | string | null) => {
    if (!date) return "Data desconhecida";
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lixeira</h1>
          <p className="text-muted-foreground">
            Itens excluídos podem ser restaurados ou removidos permanentemente
          </p>
        </div>
        {totalItems > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
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
        <TabsList>
          <TabsTrigger value="workouts" className="gap-2">
            <Dumbbell className="h-4 w-4" />
            Treinos
            {(deletedWorkouts?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1">
                {deletedWorkouts?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="students" className="gap-2">
            <Users className="h-4 w-4" />
            Alunos
            {(deletedStudents?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1">
                {deletedStudents?.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Calendar className="h-4 w-4" />
            Sessões
            {(deletedSessions?.length || 0) > 0 && (
              <Badge variant="secondary" className="ml-1">
                {deletedSessions?.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Treinos */}
        <TabsContent value="workouts" className="mt-4">
          {deletedWorkouts && deletedWorkouts.length > 0 ? (
            <div className="grid gap-4">
              {deletedWorkouts.map((workout) => (
                <Card key={workout.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium">{workout.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Aluno: {workout.studentName} • Excluído em: {formatDeletedDate(workout.deletedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreWorkoutMutation.mutate({ id: workout.id })}
                        disabled={restoreWorkoutMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
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
            <div className="grid gap-4">
              {deletedStudents.map((student) => (
                <Card key={student.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {student.email || student.phone || "Sem contato"} • Excluído em: {formatDeletedDate(student.deletedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreStudentMutation.mutate({ id: student.id })}
                        disabled={restoreStudentMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
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
        <TabsContent value="sessions" className="mt-4">
          {deletedSessions && deletedSessions.length > 0 ? (
            <div className="grid gap-4">
              {deletedSessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Sessão com {session.studentName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(session.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} • 
                          Excluído em: {formatDeletedDate(session.deletedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreSessionMutation.mutate({ id: session.id })}
                        disabled={restoreSessionMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restaurar
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
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
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhuma sessão na lixeira</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Aviso */}
      {totalItems > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center gap-3 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <p className="text-sm text-amber-800">
              Itens na lixeira serão excluídos permanentemente após 30 dias.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
