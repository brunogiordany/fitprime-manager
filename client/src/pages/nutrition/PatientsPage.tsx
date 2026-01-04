import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  Users, 
  Search, 
  ArrowLeft,
  Loader2,
  ClipboardList,
  Activity,
  FileText,
  TestTube,
  ChevronRight,
  User,
  Phone,
  Mail,
  Calendar,
  Target
} from "lucide-react";

export default function PatientsPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  // Buscar alunos (pacientes são os mesmos alunos)
  const { data: students, isLoading } = trpc.students.list.useQuery({
    status: "active",
    search: search || undefined,
  });

  // Buscar estatísticas de nutrição
  const { data: stats } = trpc.nutrition.dashboard.stats.useQuery();

  const filteredStudents = students?.filter((student: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        student.name?.toLowerCase().includes(searchLower) ||
        student.email?.toLowerCase().includes(searchLower) ||
        student.phone?.includes(search)
      );
    }
    return true;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
                <Users className="h-6 w-6 text-blue-600" />
                Pacientes
              </h1>
              <p className="text-muted-foreground">
                Gerencie os dados nutricionais dos seus alunos
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-blue-700 dark:text-blue-400">
                  Integração com Alunos
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Os pacientes de nutrição são os mesmos alunos cadastrados no sistema. 
                  Todas as informações de treino, medidas e anamnese são compartilhadas 
                  entre os módulos para uma visão completa da evolução.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Busca */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pacientes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Lista de Pacientes */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredStudents?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Nenhum paciente encontrado</p>
              <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => setLocation("/alunos")}
              >
                Ir para Alunos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents?.map((student: any) => (
              <Card 
                key={student.id} 
                className="cursor-pointer hover:shadow-lg transition-all hover:scale-[1.01]"
                onClick={() => setLocation(`/nutrition/pacientes/${student.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {getInitials(student.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{student.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {student.email && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{student.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {student.goal && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Target className="h-3 w-3" />
                        <span className="truncate">{student.goal}</span>
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{student.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/nutrition/planos-alimentares?paciente=${student.id}`);
                      }}
                    >
                      <ClipboardList className="h-3 w-3 mr-1" />
                      Planos
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/nutrition/avaliacao?paciente=${student.id}`);
                      }}
                    >
                      <Activity className="h-3 w-3 mr-1" />
                      Avaliação
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/nutrition/anamnese?paciente=${student.id}`);
                      }}
                    >
                      <FileText className="h-3 w-3 mr-1" />
                      Anamnese
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/nutrition/exames?paciente=${student.id}`);
                      }}
                    >
                      <TestTube className="h-3 w-3 mr-1" />
                      Exames
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
