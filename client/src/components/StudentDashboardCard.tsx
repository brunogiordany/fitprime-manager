import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { 
  Dumbbell, Activity, Target, TrendingUp, TrendingDown, BarChart3, 
  Trophy, AlertTriangle, Calendar, ArrowUp, ArrowDown, Minus, 
  FileDown, MessageSquare, Users, Clock, Download, Loader2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StudentDashboardCardProps {
  students: Array<{ id: number; name: string; phone?: string | null; lastWorkoutDate?: Date | null }>;
  isLoading?: boolean;
}

export default function StudentDashboardCard({ students, isLoading }: StudentDashboardCardProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [exportPeriod, setExportPeriod] = useState<string>("90");
  
  // Mutation para exportar PDF
  const exportPDFMutation = trpc.trainingDiary.exportEvolutionPDF.useMutation({
    onSuccess: (data) => {
      try {
        // Criar blob e fazer download
        const byteCharacters = atob(data.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Erro ao processar PDF:', error);
        alert('Erro ao gerar PDF. Tente novamente.');
      }
    },
    onError: (error) => {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF: ' + error.message);
    },
  });
  
  const handleExportPDF = () => {
    exportPDFMutation.mutate({
      studentId: selectedStudentId !== "all" ? parseInt(selectedStudentId) : undefined,
      period: exportPeriod as "30" | "90" | "180" | "365",
    });
  };
  
  // Buscar dashboard de treino do aluno selecionado
  const { data: dashboardData, isLoading: dashboardLoading } = trpc.trainingDiary.dashboard.useQuery(
    selectedStudentId !== "all" ? { studentId: parseInt(selectedStudentId) } : {},
    { enabled: true }
  );
  
  // Calcular métricas adicionais
  const extendedMetrics = useMemo(() => {
    if (!dashboardData) return null;
    
    const { workoutsByMonth = [], totalWorkouts = 0 } = dashboardData;
    
    // Média de treinos por semana (baseado nos últimos 30 dias)
    const last30Days = workoutsByMonth.slice(-1)[0]?.count || 0;
    const avgPerWeek = (last30Days / 4).toFixed(1);
    
    // Comparativo com mês anterior
    const currentMonth = workoutsByMonth[workoutsByMonth.length - 1]?.count || 0;
    const previousMonth = workoutsByMonth[workoutsByMonth.length - 2]?.count || 0;
    const monthVariation = previousMonth > 0 
      ? Math.round(((currentMonth - previousMonth) / previousMonth) * 100)
      : currentMonth > 0 ? 100 : 0;
    
    return {
      avgPerWeek: parseFloat(avgPerWeek),
      currentMonth,
      previousMonth,
      monthVariation,
    };
  }, [dashboardData]);
  
  // Calcular ranking de alunos mais ativos (baseado em treinos recentes)
  const { data: allStudentsDashboard } = trpc.trainingDiary.dashboard.useQuery(
    {},
    { enabled: selectedStudentId === "all" }
  );
  
  // Ranking de alunos mais ativos (simulado - idealmente viria do backend)
  const topStudents = useMemo(() => {
    // Ordenar alunos por data do último treino (mais recentes primeiro)
    return students
      .filter(s => s.lastWorkoutDate)
      .sort((a, b) => {
        const dateA = a.lastWorkoutDate ? new Date(a.lastWorkoutDate).getTime() : 0;
        const dateB = b.lastWorkoutDate ? new Date(b.lastWorkoutDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [students]);
  
  // Buscar alunos inativos do backend
  const { data: inactiveStudentsData } = trpc.dashboard.inactiveStudents.useQuery(
    { inactiveDays: 7 },
    { enabled: selectedStudentId === "all" }
  );
  
  // Buscar estatísticas de atividade
  const { data: activityStats } = trpc.dashboard.activityStats.useQuery(
    undefined,
    { enabled: selectedStudentId === "all" }
  );
  
  // Usar dados do backend ou fallback para cálculo local
  const inactiveStudents = useMemo(() => {
    if (inactiveStudentsData && inactiveStudentsData.length > 0) {
      return inactiveStudentsData;
    }
    // Fallback para cálculo local
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return students.filter(s => {
      if (!s.lastWorkoutDate) return true;
      return new Date(s.lastWorkoutDate) < sevenDaysAgo;
    }).map(s => ({
      ...s,
      daysInactive: s.lastWorkoutDate 
        ? Math.floor((Date.now() - new Date(s.lastWorkoutDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999,
      neverTrained: !s.lastWorkoutDate,
    }));
  }, [inactiveStudentsData, students]);
  
  if (isLoading) {
    return (
      <Card className="border-blue-200 dark:border-blue-800/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const dashboard = dashboardData || {
    totalWorkouts: 0,
    totalVolume: 0,
    totalSets: 0,
    totalReps: 0,
    workoutsByMonth: [],
    volumeByMonth: [],
  };
  
  const selectedStudent = students.find(s => s.id.toString() === selectedStudentId);
  
  // Função para renderizar indicador de tendência
  const TrendIndicator = ({ value, suffix = "%" }: { value: number; suffix?: string }) => {
    if (value > 0) {
      return (
        <span className="flex items-center text-xs text-emerald-600 font-medium">
          <ArrowUp className="h-3 w-3" />
          +{value}{suffix}
        </span>
      );
    } else if (value < 0) {
      return (
        <span className="flex items-center text-xs text-red-600 font-medium">
          <ArrowDown className="h-3 w-3" />
          {value}{suffix}
        </span>
      );
    }
    return (
      <span className="flex items-center text-xs text-gray-500 font-medium">
        <Minus className="h-3 w-3" />
        0{suffix}
      </span>
    );
  };
  
  return (
    <Card className="border-blue-200 dark:border-blue-800/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <BarChart3 className="h-5 w-5" />
              Dashboard de Treinos
            </CardTitle>
            <CardDescription>
              {selectedStudentId === "all" 
                ? "Visão geral de todos os alunos" 
                : `Estatísticas de ${selectedStudent?.name || 'aluno'}`
              }
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800 dark:border-slate-700">
                <SelectValue placeholder="Filtrar por aluno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Alunos</SelectItem>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={exportPeriod} onValueChange={setExportPeriod}>
              <SelectTrigger className="w-[140px] bg-white dark:bg-slate-800 dark:border-slate-700">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Último mês</SelectItem>
                <SelectItem value="90">Últimos 3 meses</SelectItem>
                <SelectItem value="180">Últimos 6 meses</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exportPDFMutation.isPending}
              className="bg-white dark:bg-secondary hover:bg-blue-50 dark:hover:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
            >
              {exportPDFMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {dashboardLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cards de Resumo - Linha 1 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/80 dark:bg-emerald-950/40 premium:bg-emerald-950/50 rounded-lg p-4 border border-emerald-200 dark:border-emerald-700 premium:border-emerald-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <Dumbbell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{dashboard.totalWorkouts}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500">Total de Treinos</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-blue-950/40 premium:bg-blue-950/50 rounded-lg p-4 border border-blue-200 dark:border-blue-700 premium:border-blue-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {((dashboard.totalVolume || 0) / 1000).toFixed(1)}t
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">Volume Total</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-purple-950/40 premium:bg-purple-950/50 rounded-lg p-4 border border-purple-200 dark:border-purple-700 premium:border-purple-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{dashboard.totalSets}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-500">Total de Séries</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-orange-950/40 premium:bg-orange-950/50 rounded-lg p-4 border border-orange-200 dark:border-orange-700 premium:border-orange-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{dashboard.totalReps}</p>
                    <p className="text-xs text-orange-600 dark:text-orange-500">Total de Reps</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Cards de Resumo - Linha 2 (Novas Métricas) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/80 dark:bg-cyan-950/40 premium:bg-cyan-950/50 rounded-lg p-4 border border-cyan-200 dark:border-cyan-700 premium:border-cyan-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500 rounded-lg">
                    <Calendar className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{extendedMetrics?.avgPerWeek || 0}</p>
                    <p className="text-xs text-cyan-600 dark:text-cyan-500">Média/Semana</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-indigo-950/40 premium:bg-indigo-950/50 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700 premium:border-indigo-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-500 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{extendedMetrics?.currentMonth || 0}</p>
                      {extendedMetrics && <TrendIndicator value={extendedMetrics.monthVariation} />}
                    </div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-500">Este Mês</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-gray-800/40 premium:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600 premium:border-gray-500">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-500 rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{extendedMetrics?.previousMonth || 0}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Mês Anterior</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 dark:bg-amber-950/40 premium:bg-amber-950/50 rounded-lg p-4 border border-amber-200 dark:border-amber-700 premium:border-amber-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{students.length}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">Total Alunos</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Alerta de Alunos Inativos */}
            {inactiveStudents.length > 0 && selectedStudentId === "all" && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h4 className="font-medium text-red-700 dark:text-red-400">
                    Alunos Inativos ({inactiveStudents.length})
                  </h4>
                  <Badge variant="destructive" className="ml-auto">
                    +7 dias sem treinar
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {inactiveStudents.slice(0, 6).map((student: any) => (
                    <div 
                      key={student.id} 
                      className="flex items-center justify-between bg-white rounded-lg p-2 border border-red-100"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-700 truncate block">
                          {student.name}
                        </span>
                        <span className="text-xs text-red-500">
                          {student.neverTrained 
                            ? 'Nunca treinou' 
                            : `${student.daysInactive || '?'} dias inativo`
                          }
                        </span>
                      </div>
                      {student.phone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 flex-shrink-0"
                          onClick={() => {
                            const phone = student.phone?.replace(/\D/g, '');
                            const message = encodeURIComponent(`Olá ${student.name}! Sentimos sua falta nos treinos. Está tudo bem? 💪`);
                            window.open(`https://wa.me/55${phone}?text=${message}`, '_blank');
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {inactiveStudents.length > 6 && (
                  <p className="text-xs text-red-600 mt-2 text-center">
                    + {inactiveStudents.length - 6} alunos inativos
                  </p>
                )}
              </div>
            )}
            
            {/* Ranking de Alunos Mais Ativos + Gráfico */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ranking */}
              {selectedStudentId === "all" && topStudents.length > 0 && (
                <div className="bg-white/80 rounded-lg p-4 border border-yellow-200">
                  <h4 className="text-sm font-medium text-yellow-700 mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Top 5 Alunos Mais Ativos
                  </h4>
                  <div className="space-y-2">
                    {topStudents.map((student, index) => (
                      <div 
                        key={student.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50"
                      >
                        <div className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                          ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                            index === 1 ? 'bg-gray-300 text-gray-700' : 
                            index === 2 ? 'bg-amber-600 text-white' : 
                            'bg-gray-200 text-gray-600'}
                        `}>
                          {index + 1}
                        </div>
                        <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                          {student.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {student.lastWorkoutDate 
                            ? new Date(student.lastWorkoutDate).toLocaleDateString('pt-BR')
                            : 'Nunca'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Gráfico de Treinos por Mês */}
              {dashboard.workoutsByMonth && dashboard.workoutsByMonth.length > 0 && (
                <div className={`bg-white/80 rounded-lg p-4 border border-blue-200 ${selectedStudentId !== "all" || topStudents.length === 0 ? 'md:col-span-2' : ''}`}>
                  <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Treinos por Mês
                  </h4>
                  <div className="h-[150px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dashboard.workoutsByMonth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6366f1" />
                        <YAxis tick={{ fontSize: 12 }} stroke="#6366f1" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #c7d2fe',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Treinos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
