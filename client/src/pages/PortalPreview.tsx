import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Eye, ExternalLink, Users, Dumbbell, Calendar, CreditCard, Activity, Camera } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function PortalPreview() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  
  const { data: students, isLoading: loadingStudents } = trpc.students.list.useQuery();
  
  const selectedStudent = students?.find(s => s.id.toString() === selectedStudentId);
  
  // Buscar dados do aluno selecionado
  const { data: workouts } = trpc.workouts.list.useQuery(
    { studentId: parseInt(selectedStudentId) },
    { enabled: !!selectedStudentId }
  );
  
  const { data: sessions } = trpc.sessions.list.useQuery(
    { studentId: parseInt(selectedStudentId) },
    { enabled: !!selectedStudentId }
  );
  
  const { data: charges } = trpc.charges.listByStudent.useQuery(
    { studentId: parseInt(selectedStudentId) },
    { enabled: !!selectedStudentId }
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Filtrar sessões futuras
  const futureSessions = sessions?.filter(s => {
    const sessionDate = new Date(s.scheduledAt);
    return sessionDate >= new Date() && s.status !== 'cancelled';
  }).slice(0, 5) || [];

  // Cobranças pendentes
  const pendingCharges = charges?.filter(c => c.status === 'pending').slice(0, 5) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Eye className="h-6 w-6 text-emerald-600" />
            Portal do Aluno
          </h1>
          <p className="text-muted-foreground">
            Visualize como seus alunos veem o portal deles
          </p>
        </div>
      </div>

      {/* Seletor de Aluno */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecione um Aluno
          </CardTitle>
          <CardDescription>
            Escolha um aluno para visualizar como está o portal dele
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="w-full sm:w-[300px]">
              <SelectValue placeholder="Selecione um aluno..." />
            </SelectTrigger>
            <SelectContent>
              {students?.map((student) => (
                <SelectItem key={student.id} value={student.id.toString()}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    {student.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Preview do Portal */}
      {selectedStudent && (
        <div className="space-y-6">
          {/* Header do Portal */}
          <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-white/30">
                  <AvatarFallback className="text-xl bg-white/20 text-white">
                    {getInitials(selectedStudent.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedStudent.name}</h2>
                  <p className="text-white/80">Portal do Aluno</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <Dumbbell className="h-8 w-8 mx-auto text-emerald-600 mb-2" />
                <p className="text-2xl font-bold">{workouts?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Treinos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Calendar className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold">{futureSessions.length}</p>
                <p className="text-sm text-muted-foreground">Sessões Agendadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <CreditCard className="h-8 w-8 mx-auto text-amber-600 mb-2" />
                <p className="text-2xl font-bold">{pendingCharges.length}</p>
                <p className="text-sm text-muted-foreground">Pagamentos Pendentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Activity className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <p className="text-2xl font-bold">{sessions?.filter(s => s.status === 'completed').length || 0}</p>
                <p className="text-sm text-muted-foreground">Treinos Realizados</p>
              </CardContent>
            </Card>
          </div>

          {/* Treinos do Aluno */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-emerald-600" />
                Meus Treinos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workouts && workouts.length > 0 ? (
                <div className="space-y-3">
                  {workouts.slice(0, 3).map((workout: any) => (
                    <div key={workout.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{workout.name}</p>
                        <p className="text-sm text-muted-foreground">{workout.description || 'Sem descrição'}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toast.info("Funcionalidade disponível apenas no portal real do aluno")}
                      >
                        Ver Treino
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum treino cadastrado</p>
              )}
            </CardContent>
          </Card>

          {/* Próximas Sessões */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Próximas Sessões
              </CardTitle>
            </CardHeader>
            <CardContent>
              {futureSessions.length > 0 ? (
                <div className="space-y-3">
                  {futureSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {new Date(session.scheduledAt).toLocaleDateString('pt-BR', { 
                            weekday: 'long', 
                            day: '2-digit', 
                            month: '2-digit' 
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.scheduledAt).getUTCHours().toString().padStart(2, '0')}:{new Date(session.scheduledAt).getUTCMinutes().toString().padStart(2, '0')} - {session.duration} min
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        session.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {session.status === 'confirmed' ? 'Confirmada' :
                         session.status === 'scheduled' ? 'Agendada' : session.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhuma sessão agendada</p>
              )}
            </CardContent>
          </Card>

          {/* Pagamentos Pendentes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-amber-600" />
                Pagamentos Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingCharges.length > 0 ? (
                <div className="space-y-3">
                  {pendingCharges.map((charge) => (
                    <div key={charge.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{charge.description}</p>
                        <p className="text-sm text-muted-foreground">
                          Vence em {new Date(charge.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">
                          R$ {Number(charge.amount).toFixed(2)}
                        </p>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-700">
                          Pendente
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Nenhum pagamento pendente</p>
              )}
            </CardContent>
          </Card>

          {/* Link para o perfil completo */}
          <div className="flex justify-center">
            <Link href={`/alunos/${selectedStudentId}`}>
              <Button variant="outline" className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Ver Perfil Completo do Aluno
              </Button>
            </Link>
          </div>
        </div>
      )}

      {!selectedStudentId && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione um aluno</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Escolha um aluno acima para visualizar como está o portal dele. 
              Você poderá ver os treinos, sessões agendadas e pagamentos pendentes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
