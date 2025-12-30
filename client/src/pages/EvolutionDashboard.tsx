import { useState, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity,
  Dumbbell,
  Target,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function EvolutionDashboard() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [exerciseSearchFilter, setExerciseSearchFilter] = useState<string>("");
  const [period, setPeriod] = useState<string>("month");
  const [chartType, setChartType] = useState<string>("line");

  // Queries
  const { data: students } = trpc.students.list.useQuery();
  
  const { data: uniqueExercises } = trpc.trainingDiary.uniqueExercises.useQuery(
    { studentId: selectedStudentId ? parseInt(selectedStudentId) : undefined },
    { enabled: true }
  );

  const { data: exerciseProgress } = trpc.trainingDiary.exerciseProgress.useQuery(
    { 
      studentId: selectedStudentId ? parseInt(selectedStudentId) : undefined, 
      exerciseName: selectedExercise,
      limit: 50
    },
    { enabled: !!selectedExercise }
  );

  const { data: muscleGroupAnalysis } = trpc.trainingDiary.muscleGroupAnalysis.useQuery(
    { studentId: selectedStudentId ? parseInt(selectedStudentId) : undefined },
    { enabled: true }
  );

  // Exercícios filtrados e ordenados
  const filteredExercises = useMemo(() => {
    if (!uniqueExercises) return [];
    return uniqueExercises
      .filter(name => name.toLowerCase().includes(exerciseSearchFilter.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [uniqueExercises, exerciseSearchFilter]);

  // Filtrar dados por período
  const filteredProgress = useMemo(() => {
    if (!exerciseProgress) return [];
    const now = new Date();
    return exerciseProgress.filter((item: any) => {
      const itemDate = new Date(item.date);
      const diffDays = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));
      switch (period) {
        case 'week': return diffDays <= 7;
        case 'month': return diffDays <= 30;
        case '3months': return diffDays <= 90;
        case '6months': return diffDays <= 180;
        case 'year': return diffDays <= 365;
        default: return true;
      }
    }).slice().reverse(); // Reverter para ordem cronológica
  }, [exerciseProgress, period]);

  // Dados formatados para gráficos
  const chartData = useMemo(() => {
    return filteredProgress.map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      fullDate: new Date(item.date).toLocaleDateString('pt-BR'),
      carga: item.maxWeight || 0,
      volume: item.totalVolume || 0,
      reps: item.totalReps || 0,
      series: item.totalSets || 0,
    }));
  }, [filteredProgress]);

  // Dados para gráfico de pizza (grupos musculares)
  const muscleGroupData = useMemo(() => {
    if (!muscleGroupAnalysis) return [];
    return muscleGroupAnalysis.map((group: any) => ({
      name: group.muscleGroup,
      value: group.totalSets,
      exercises: group.exerciseCount,
    }));
  }, [muscleGroupAnalysis]);

  // Estatísticas
  const stats = useMemo(() => {
    if (filteredProgress.length === 0) return null;
    const weights = filteredProgress.map((i: any) => i.maxWeight || 0);
    const maxWeight = Math.max(...weights);
    const minWeight = Math.min(...weights);
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    const totalVolume = filteredProgress.reduce((sum: number, i: any) => sum + (i.totalVolume || 0), 0);
    const totalReps = filteredProgress.reduce((sum: number, i: any) => sum + (i.totalReps || 0), 0);
    
    // Tendência (comparar primeira e última metade)
    const half = Math.floor(weights.length / 2);
    const firstHalfAvg = weights.slice(0, half).reduce((a, b) => a + b, 0) / (half || 1);
    const secondHalfAvg = weights.slice(half).reduce((a, b) => a + b, 0) / ((weights.length - half) || 1);
    const trend = secondHalfAvg > firstHalfAvg ? 'up' : secondHalfAvg < firstHalfAvg ? 'down' : 'stable';
    
    return { maxWeight, minWeight, avgWeight, totalVolume, totalReps, trend, count: filteredProgress.length };
  }, [filteredProgress]);

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <TrendingUp className="h-12 w-12 mb-2 opacity-50" />
          <p>Selecione um exercício para ver a evolução</p>
        </div>
      );
    }

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Legend />
              <Line type="monotone" dataKey="carga" name="Carga (kg)" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="carga" name="Carga (kg)" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Area type="monotone" dataKey="carga" name="Carga (kg)" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'volume':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
              />
              <Legend />
              <Bar dataKey="volume" name="Volume (kg×reps)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            Dashboard de Evolução
          </h1>
          <p className="text-muted-foreground">
            Acompanhe a progressão de carga e volume dos seus alunos
          </p>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm">Aluno</Label>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os alunos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos os alunos</SelectItem>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm">Buscar Exercício</Label>
                <Input
                  placeholder="Digite para filtrar..."
                  value={exerciseSearchFilter}
                  onChange={(e) => setExerciseSearchFilter(e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-sm">Exercício</Label>
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um exercício" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {filteredExercises.length > 0 ? (
                      filteredExercises.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Nenhum exercício encontrado
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm">Período</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Última semana</SelectItem>
                    <SelectItem value="month">Último mês</SelectItem>
                    <SelectItem value="3months">Últimos 3 meses</SelectItem>
                    <SelectItem value="6months">Últimos 6 meses</SelectItem>
                    <SelectItem value="year">Último ano</SelectItem>
                    <SelectItem value="all">Todo o período</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold text-primary">
                  {stats.maxWeight}kg
                  <Target className="h-5 w-5" />
                </div>
                <p className="text-xs text-muted-foreground">Recorde</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{stats.avgWeight.toFixed(1)}kg</p>
                <p className="text-xs text-muted-foreground">Média</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{stats.minWeight}kg</p>
                <p className="text-xs text-muted-foreground">Mínimo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{stats.totalVolume.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Volume Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold">{stats.totalReps}</p>
                <p className="text-xs text-muted-foreground">Reps Totais</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-bold">
                  {stats.trend === 'up' && <ArrowUp className="h-5 w-5 text-green-500" />}
                  {stats.trend === 'down' && <ArrowDown className="h-5 w-5 text-red-500" />}
                  {stats.trend === 'stable' && <Minus className="h-5 w-5 text-yellow-500" />}
                  {stats.count}
                </div>
                <p className="text-xs text-muted-foreground">Treinos</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gráfico Principal */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Evolução de Carga
                  {selectedExercise && <span className="text-primary">- {selectedExercise}</span>}
                </CardTitle>
                <CardDescription>
                  Visualize a progressão ao longo do tempo
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={chartType === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('line')}
                >
                  <Activity className="h-4 w-4 mr-1" />
                  Linha
                </Button>
                <Button
                  variant={chartType === 'bar' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Barras
                </Button>
                <Button
                  variant={chartType === 'area' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('area')}
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Área
                </Button>
                <Button
                  variant={chartType === 'volume' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setChartType('volume')}
                >
                  <Dumbbell className="h-4 w-4 mr-1" />
                  Volume
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {renderChart()}
          </CardContent>
        </Card>

        {/* Gráfico de Grupos Musculares */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                Distribuição por Grupo Muscular
              </CardTitle>
              <CardDescription>
                Séries totais por grupo muscular
              </CardDescription>
            </CardHeader>
            <CardContent>
              {muscleGroupData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={muscleGroupData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {muscleGroupData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number, name: string) => [`${value} séries`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <PieChartIcon className="h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Séries por Grupo Muscular
              </CardTitle>
              <CardDescription>
                Comparativo de volume por grupo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {muscleGroupData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={muscleGroupData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" width={100} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number) => [`${value} séries`, 'Total']}
                    />
                    <Bar dataKey="value" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mb-2 opacity-50" />
                  <p>Nenhum dado disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Lista de Exercícios Disponíveis */}
        {!selectedExercise && filteredExercises.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5" />
                Exercícios Disponíveis ({filteredExercises.length})
              </CardTitle>
              <CardDescription>
                Clique em um exercício para ver sua evolução
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                {filteredExercises.map((name) => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedExercise(name)}
                  >
                    {name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
