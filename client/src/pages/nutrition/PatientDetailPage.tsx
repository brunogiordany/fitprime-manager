import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { 
  ArrowLeft,
  Loader2,
  ClipboardList,
  Activity,
  FileText,
  TestTube,
  TrendingUp,
  User,
  Phone,
  Mail,
  Calendar,
  Target,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Plus,
  ChevronRight,
  Scale,
  Ruler,
  Heart
} from "lucide-react";

export default function PatientDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const studentId = parseInt(params.id || "0");

  // Buscar dados do aluno
  const { data: student, isLoading: loadingStudent } = trpc.students.get.useQuery(
    { id: studentId },
    { enabled: !!studentId }
  );

  // Buscar planos alimentares do paciente
  const { data: mealPlans } = trpc.nutrition.mealPlans.list.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  // Buscar avaliações nutricionais
  const { data: assessments } = trpc.nutrition.assessments.list.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  // Buscar exames
  const { data: exams } = trpc.nutrition.labExams.list.useQuery(
    { studentId },
    { enabled: !!studentId }
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loadingStudent) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <User className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">Paciente não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/nutrition/pacientes")}>
            Voltar para Pacientes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Pegar último plano ativo
  const activePlan = mealPlans?.plans?.find((p: any) => p.status === "active");
  const lastAssessment = assessments?.[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/nutrition/pacientes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-4 flex-1">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl">
                {getInitials(student.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{student.name}</h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {student.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {student.email}
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {student.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation(`/alunos/${studentId}`)}>
              <User className="h-4 w-4 mr-2" />
              Ver Perfil Completo
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Plano Ativo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activePlan ? (
                <div>
                  <p className="font-medium">{activePlan.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {activePlan.targetCalories} kcal/dia
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum plano ativo</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Scale className="h-4 w-4" />
                Peso Atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastAssessment?.weight ? (
                <div>
                  <p className="text-2xl font-bold">{lastAssessment.weight} kg</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(lastAssessment.assessmentDate).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Não registrado</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objetivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{(student as any).goal || "Não definido"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                IMC
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lastAssessment?.bmi ? (
                <div>
                  <p className="text-2xl font-bold">{parseFloat(lastAssessment.bmi).toFixed(1)}</p>
                  <p className="text-sm text-muted-foreground">
                    {parseFloat(lastAssessment.bmi) < 18.5 ? "Abaixo do peso" :
                     parseFloat(lastAssessment.bmi) < 25 ? "Peso normal" :
                     parseFloat(lastAssessment.bmi) < 30 ? "Sobrepeso" : "Obesidade"}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Não calculado</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="plans" className="space-y-4">
          <TabsList>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Planos Alimentares
            </TabsTrigger>
            <TabsTrigger value="assessments" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="evolution" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Evolução
            </TabsTrigger>
            <TabsTrigger value="exams" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Exames
            </TabsTrigger>
            <TabsTrigger value="anamnesis" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Anamnese
            </TabsTrigger>
          </TabsList>

          {/* Planos Alimentares */}
          <TabsContent value="plans">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Planos Alimentares</CardTitle>
                    <CardDescription>
                      Histórico de planos alimentares do paciente
                    </CardDescription>
                  </div>
                  <Button onClick={() => setLocation(`/nutrition/planos-alimentares?paciente=${studentId}`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Plano
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!mealPlans?.plans?.length ? (
                  <div className="text-center py-8">
                    <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">Nenhum plano alimentar criado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mealPlans.plans.map((plan: any) => (
                      <div 
                        key={plan.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setLocation(`/nutrition/planos-alimentares/${plan.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <ClipboardList className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium">{plan.name}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{new Date(plan.createdAt).toLocaleDateString("pt-BR")}</span>
                              <div className="flex items-center gap-2">
                                <Flame className="h-3 w-3 text-orange-500" />
                                {plan.targetCalories || "-"} kcal
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                            {plan.status === "active" ? "Ativo" : 
                             plan.status === "draft" ? "Rascunho" : 
                             plan.status === "completed" ? "Concluído" : plan.status}
                          </Badge>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avaliações */}
          <TabsContent value="assessments">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Avaliações Nutricionais</CardTitle>
                    <CardDescription>
                      Histórico de avaliações antropométricas
                    </CardDescription>
                  </div>
                  <Button onClick={() => setLocation(`/nutrition/avaliacao?paciente=${studentId}`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Avaliação
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!assessments?.length ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">Nenhuma avaliação registrada</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {assessments.map((assessment: any) => (
                      <div 
                        key={assessment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setLocation(`/nutrition/avaliacao/${assessment.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Activity className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              Avaliação de {new Date(assessment.date).toLocaleDateString("pt-BR")}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Scale className="h-3 w-3" />
                                {assessment.weight} kg
                              </div>
                              {assessment.height && (
                                <div className="flex items-center gap-1">
                                  <Ruler className="h-3 w-3" />
                                  {assessment.height} cm
                                </div>
                              )}
                              {assessment.bmi && (
                                <div className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  IMC: {assessment.bmi.toFixed(1)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evolução */}
          <TabsContent value="evolution">
            <Card>
              <CardHeader>
                <CardTitle>Evolução Nutricional</CardTitle>
                <CardDescription>
                  Acompanhamento da evolução do paciente ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">
                    Gráficos de evolução serão exibidos aqui
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setLocation(`/nutrition/evolucao?paciente=${studentId}`)}
                  >
                    Ver Evolução Completa
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exames */}
          <TabsContent value="exams">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Exames Laboratoriais</CardTitle>
                    <CardDescription>
                      Registro de exames do paciente
                    </CardDescription>
                  </div>
                  <Button onClick={() => setLocation(`/nutrition/exames?paciente=${studentId}`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Exame
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!exams?.length ? (
                  <div className="text-center py-8">
                    <TestTube className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">Nenhum exame registrado</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exams.map((exam: any) => (
                      <div 
                        key={exam.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => setLocation(`/nutrition/exames/${exam.id}`)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <TestTube className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium">{exam.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(exam.date).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Anamnese */}
          <TabsContent value="anamnesis">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Anamnese Nutricional</CardTitle>
                    <CardDescription>
                      Informações complementares de nutrição
                    </CardDescription>
                  </div>
                  <Button onClick={() => setLocation(`/nutrition/anamnese?paciente=${studentId}`)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Editar Anamnese
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">
                    Anamnese nutricional complementar
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
