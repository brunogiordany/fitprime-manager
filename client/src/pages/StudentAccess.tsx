import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Shield, 
  User, 
  FileText, 
  Ruler, 
  Camera, 
  CreditCard, 
  Calendar, 
  XCircle, 
  MessageSquare, 
  Dumbbell,
  Lock,
  Unlock,
  Search,
  Users,
  CheckCircle2
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Permission {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const PERMISSIONS: Permission[] = [
  {
    key: "canEditAnamnesis",
    label: "Editar Anamnese",
    description: "Permite que o aluno edite suas informações de saúde e objetivos",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    key: "canEditMeasurements",
    label: "Editar Medidas",
    description: "Permite que o aluno registre e edite suas medidas corporais",
    icon: <Ruler className="h-5 w-5" />,
  },
  {
    key: "canEditPhotos",
    label: "Enviar Fotos",
    description: "Permite que o aluno envie fotos de progresso",
    icon: <Camera className="h-5 w-5" />,
  },
  {
    key: "canViewCharges",
    label: "Ver Cobranças",
    description: "Permite que o aluno visualize suas cobranças e pagamentos",
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    key: "canScheduleSessions",
    label: "Agendar Sessões",
    description: "Permite que o aluno agende sessões de treino",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    key: "canCancelSessions",
    label: "Cancelar Sessões",
    description: "Permite que o aluno cancele sessões agendadas",
    icon: <XCircle className="h-5 w-5" />,
  },
  {
    key: "canSendMessages",
    label: "Enviar Mensagens",
    description: "Permite que o aluno envie mensagens pelo chat",
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    key: "canViewWorkouts",
    label: "Ver Treinos",
    description: "Permite que o aluno visualize seus treinos",
    icon: <Dumbbell className="h-5 w-5" />,
  },
];

export default function StudentAccess() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: students, isLoading } = trpc.students.listWithPermissions.useQuery();
  const utils = trpc.useUtils();
  
  const updatePermission = trpc.students.updatePermissions.useMutation({
    onSuccess: () => {
      utils.students.listWithPermissions.invalidate();
      toast.success("Permissão atualizada com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar permissão");
    },
  });

  const handleTogglePermission = (studentId: number, permissionKey: string, currentValue: boolean) => {
    updatePermission.mutate({
      studentId,
      [permissionKey]: !currentValue,
    });
  };

  const handleToggleAll = (studentId: number, enable: boolean) => {
    const permissions: Record<string, boolean> = {};
    PERMISSIONS.forEach(p => {
      permissions[p.key] = enable;
    });
    updatePermission.mutate({
      studentId,
      ...permissions,
    });
  };

  // Filtrar alunos
  const filteredStudents = students?.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (student.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = selectedStudentId === "all" || student.id.toString() === selectedStudentId;
    return matchesSearch && matchesFilter;
  }) || [];

  // Contar permissões bloqueadas por aluno
  const getBlockedCount = (student: any) => {
    return PERMISSIONS.filter(p => !student[p.key as keyof typeof student]).length;
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-emerald-600" />
              Acessos do Aluno
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gerencie as permissões e funcionalidades disponíveis para cada aluno
            </p>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-64">
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <Users className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os alunos</SelectItem>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Alunos com Permissões */}
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum aluno encontrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredStudents.map((student) => {
              const blockedCount = getBlockedCount(student);
              const allEnabled = blockedCount === 0;
              
              return (
                <Card key={student.id}>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={student.avatarUrl || undefined} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {student.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{student.name}</CardTitle>
                          <CardDescription>
                            {student.email || student.phone || "Sem contato"}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {blockedCount > 0 ? (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800">
                            <Lock className="h-3 w-3 mr-1" />
                            {blockedCount} bloqueado{blockedCount > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Acesso total
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleAll(student.id, !allEnabled)}
                          disabled={updatePermission.isPending}
                        >
                          {allEnabled ? (
                            <>
                              <Lock className="h-4 w-4 mr-1" />
                              Bloquear Tudo
                            </>
                          ) : (
                            <>
                              <Unlock className="h-4 w-4 mr-1" />
                              Liberar Tudo
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {PERMISSIONS.map((permission) => {
                        const isEnabled = student[permission.key as keyof typeof student] as boolean;
                        
                        return (
                          <div
                            key={permission.key}
                            className={`p-4 rounded-lg border transition-colors ${
                              isEnabled 
                                ? 'bg-white dark:bg-card border-gray-200 dark:border-border' 
                                : 'bg-gray-50 dark:bg-secondary border-gray-300 dark:border-border'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${
                                  isEnabled 
                                    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600' 
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                }`}>
                                  {permission.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Label 
                                    htmlFor={`${student.id}-${permission.key}`}
                                    className="font-medium text-sm cursor-pointer"
                                  >
                                    {permission.label}
                                  </Label>
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                    {permission.description}
                                  </p>
                                </div>
                              </div>
                              <Switch
                                id={`${student.id}-${permission.key}`}
                                checked={isEnabled}
                                onCheckedChange={() => handleTogglePermission(student.id, permission.key, isEnabled)}
                                disabled={updatePermission.isPending}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info */}
        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 h-fit">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-300">Como funciona?</h3>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Por padrão, todos os alunos têm acesso total às funcionalidades do portal. 
                  Você pode bloquear funcionalidades específicas conforme necessário. 
                  As alterações são aplicadas imediatamente no portal do aluno.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
