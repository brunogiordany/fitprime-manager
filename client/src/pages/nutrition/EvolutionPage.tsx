import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  ArrowLeft,
  Loader2,
  User,
  Scale,
  Activity,
  Target,
  Calendar,
  ArrowDown,
  ArrowUp,
  Minus
} from "lucide-react";

export default function EvolutionPage() {
  const [, setLocation] = useLocation();
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [period, setPeriod] = useState("3m");

  // Pegar paciente da URL se existir
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pacienteId = urlParams.get("paciente");
    if (pacienteId) {
      setSelectedStudent(parseInt(pacienteId));
    }
  }, []);

  // Queries
  const { data: students } = trpc.students.list.useQuery({});

  const { data: assessments, isLoading } = trpc.nutrition.assessments.list.useQuery(
    { studentId: selectedStudent || 0 },
    { enabled: !!selectedStudent }
  );

  // Calcular evolução
  const getEvolution = () => {
    if (!assessments || assessments.length < 2) return null;
    
    const sorted = [...assessments].sort((a, b) => 
      new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime()
    );
    
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    
    const weightChange = first.weight && last.weight 
      ? parseFloat(last.weight) - parseFloat(first.weight)
      : null;
    
    const bmiChange = first.bmi && last.bmi
      ? parseFloat(last.bmi) - parseFloat(first.bmi)
      : null;
    
    const bodyFatChange = first.bodyFatPercentage && last.bodyFatPercentage
      ? parseFloat(last.bodyFatPercentage) - parseFloat(first.bodyFatPercentage)
      : null;
    
    const muscleMassChange = first.muscleMass && last.muscleMass
      ? parseFloat(last.muscleMass) - parseFloat(first.muscleMass)
      : null;
    
    return {
      weightChange,
      bmiChange,
      bodyFatChange,
      muscleMassChange,
      firstDate: first.assessmentDate,
      lastDate: last.assessmentDate,
      totalAssessments: assessments.length,
    };
  };

  const evolution = getEvolution();

  const getTrendIcon = (value: number | null, inverse = false) => {
    if (value === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const isPositive = inverse ? value < 0 : value > 0;
    const isNegative = inverse ? value > 0 : value < 0;
    
    if (isPositive) return <ArrowUp className="h-4 w-4 text-green-500" />;
    if (isNegative) return <ArrowDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  const formatChange = (value: number | null, unit: string) => {
    if (value === null) return "-";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)} ${unit}`;
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
                <TrendingUp className="h-6 w-6 text-indigo-600" />
                Evolução Nutricional
              </h1>
              <p className="text-muted-foreground">
                Acompanhamento da evolução do paciente
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Select 
                  value={selectedStudent?.toString() || ""} 
                  onValueChange={(v) => setSelectedStudent(v ? parseInt(v) : null)}
                >
                  <SelectTrigger>
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Selecione um paciente" />
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
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[150px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Último mês</SelectItem>
                  <SelectItem value="3m">Últimos 3 meses</SelectItem>
                  <SelectItem value="6m">Últimos 6 meses</SelectItem>
                  <SelectItem value="1y">Último ano</SelectItem>
                  <SelectItem value="all">Todo período</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {!selectedStudent ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">
                  Selecione um paciente para ver a evolução
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !assessments?.length ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">
                  Nenhuma avaliação registrada para este paciente
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setLocation(`/nutrition/avaliacao?paciente=${selectedStudent}`)}
                >
                  Registrar primeira avaliação
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Cards de Evolução */}
            {evolution && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Variação de Peso
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(evolution.weightChange, true)}
                      <span className="text-2xl font-bold">
                        {formatChange(evolution.weightChange, "kg")}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Variação de IMC
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(evolution.bmiChange, true)}
                      <span className="text-2xl font-bold">
                        {formatChange(evolution.bmiChange, "")}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Variação % Gordura
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(evolution.bodyFatChange, true)}
                      <span className="text-2xl font-bold">
                        {formatChange(evolution.bodyFatChange, "%")}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Variação Massa Muscular
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(evolution.muscleMassChange)}
                      <span className="text-2xl font-bold">
                        {formatChange(evolution.muscleMassChange, "kg")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Histórico de Avaliações */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Avaliações</CardTitle>
                <CardDescription>
                  {assessments.length} avaliação(ões) registrada(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessments.map((assessment: any, index: number) => (
                    <div 
                      key={assessment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                          <span className="text-sm font-medium text-indigo-600">
                            {assessments.length - index}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {new Date(assessment.assessmentDate).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric"
                            })}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {assessment.weight && (
                              <span>Peso: {assessment.weight} kg</span>
                            )}
                            {assessment.bmi && (
                              <span>IMC: {parseFloat(assessment.bmi).toFixed(1)}</span>
                            )}
                            {assessment.bodyFatPercentage && (
                              <span>Gordura: {assessment.bodyFatPercentage}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setLocation(`/nutrition/avaliacao/${assessment.id}`)}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Placeholder para Gráficos */}
            <Card>
              <CardHeader>
                <CardTitle>Gráficos de Evolução</CardTitle>
                <CardDescription>
                  Visualização gráfica da evolução ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">
                      Gráficos de evolução serão implementados em breve
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
