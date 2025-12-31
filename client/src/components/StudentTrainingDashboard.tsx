import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Dumbbell, 
  Calendar, 
  TrendingUp, 
  Flame,
  BarChart3,
  Target,
  Activity
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface StudentTrainingDashboardProps {
  studentId: number;
}

export default function StudentTrainingDashboard({ studentId }: StudentTrainingDashboardProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  
  // Buscar dados do dashboard
  const { data: dashboardData, isLoading: dashboardLoading } = trpc.studentPortal.dashboard.useQuery();
  const { data: muscleGroupData, isLoading: muscleLoading } = trpc.studentPortal.muscleGroupAnalysis.useQuery();
  const { data: uniqueExercises, isLoading: exercisesLoading } = trpc.studentPortal.uniqueExercises.useQuery();
  const { data: exerciseProgress, isLoading: progressLoading } = trpc.studentPortal.exerciseProgress.useQuery(
    { exerciseName: selectedExercise },
    { enabled: !!selectedExercise }
  );
  
  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  const dashboard = dashboardData || {
    totalWorkouts: 0,
    totalVolume: 0,
    totalSets: 0,
    totalReps: 0,
    workoutsByMonth: [],
    volumeByMonth: [],
    feelingDistribution: {},
  };
  
  const muscleGroups = muscleGroupData || [];
  const exercises = uniqueExercises || [];
  const progress = exerciseProgress || [];
  
  // Calcular max volume para escala do gráfico de grupos musculares
  const maxVolume = Math.max(...muscleGroups.map(g => g.volume), 1);
  
  // Emojis para sentimentos
  const feelingEmojis: Record<string, { emoji: string; label: string; color: string }> = {
    'great': { emoji: '😄', label: 'Ótimo', color: 'bg-green-100 text-green-700' },
    'good': { emoji: '🙂', label: 'Bom', color: 'bg-blue-100 text-blue-700' },
    'normal': { emoji: '😐', label: 'Normal', color: 'bg-yellow-100 text-yellow-700' },
    'tired': { emoji: '😓', label: 'Cansado', color: 'bg-orange-100 text-orange-700' },
    'bad': { emoji: '😞', label: 'Ruim', color: 'bg-red-100 text-red-700' },
  };
  
  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 rounded-lg">
                <Dumbbell className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-700">{dashboard.totalWorkouts}</p>
                <p className="text-xs text-emerald-600">Total de Treinos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{(dashboard.totalVolume / 1000).toFixed(1)}t</p>
                <p className="text-xs text-blue-600">Volume Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{dashboard.totalSets}</p>
                <p className="text-xs text-purple-600">Total de Séries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-lg">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{dashboard.totalReps}</p>
                <p className="text-xs text-orange-600">Total de Reps</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Gráficos de Treinos e Volume */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Treinos por Mês */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              Treinos por Mês
            </CardTitle>
            <CardDescription>Frequência de treinos nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.workoutsByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dashboard.workoutsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: number) => [`${value} treinos`, 'Treinos']}
                  />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum treino registrado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Volume por Mês */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5 text-blue-500" />
              Volume por Mês
            </CardTitle>
            <CardDescription>Volume total de carga nos últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.volumeByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dashboard.volumeByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}t`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    formatter={(value: number) => [`${(value/1000).toFixed(1)} toneladas`, 'Volume']}
                  />
                  <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum volume registrado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Análise por Grupo Muscular e Sentimento */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Grupos Musculares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Dumbbell className="h-5 w-5 text-purple-500" />
              Grupos Musculares
            </CardTitle>
            <CardDescription>Distribuição de volume por grupo muscular</CardDescription>
          </CardHeader>
          <CardContent>
            {muscleGroups.length > 0 ? (
              <div className="space-y-3">
                {muscleGroups.slice(0, 8).map((group, idx) => (
                  <div key={group.name} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{group.name}</span>
                      <span className="text-gray-500">{group.sets} séries • {group.exercises} exercícios</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${(group.volume / maxVolume) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{(group.volume / 1000).toFixed(1)}t de volume</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum exercício registrado ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Distribuição de Sentimento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              Como Você Se Sentiu
            </CardTitle>
            <CardDescription>Distribuição de sentimento nos treinos</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(dashboard.feelingDistribution).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(dashboard.feelingDistribution).map(([feeling, count]) => {
                  const info = feelingEmojis[feeling] || { emoji: '❓', label: feeling, color: 'bg-gray-100 text-gray-700' };
                  return (
                    <div 
                      key={feeling}
                      className={`p-4 rounded-xl ${info.color} text-center transition-transform hover:scale-105`}
                    >
                      <span className="text-3xl">{info.emoji}</span>
                      <p className="font-bold text-lg mt-1">{count}</p>
                      <p className="text-xs opacity-75">{info.label}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-5xl mb-4 block">😊</span>
                <p>Nenhum sentimento registrado ainda</p>
                <p className="text-sm">Registre como você se sentiu após cada treino!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Evolução de Carga por Exercício */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Evolução de Carga
          </CardTitle>
          <CardDescription>Acompanhe sua progressão em cada exercício</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger className="w-full md:w-80">
                <SelectValue placeholder="Selecione um exercício" />
              </SelectTrigger>
              <SelectContent>
                {exercises.map((exercise) => (
                  <SelectItem key={exercise} value={exercise}>
                    {exercise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedExercise ? (
            progress.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={progress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      labelFormatter={(date) => {
                        const d = new Date(date);
                        return d.toLocaleDateString('pt-BR');
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'maxWeight') return [`${value} kg`, 'Carga Máxima'];
                        if (name === 'totalVolume') return [`${value} kg`, 'Volume Total'];
                        return [value, name];
                      }}
                    />
                    <Legend 
                      formatter={(value) => {
                        if (value === 'maxWeight') return 'Carga Máxima (kg)';
                        if (value === 'totalVolume') return 'Volume Total (kg)';
                        return value;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="maxWeight" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={{ fill: '#10b981', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalVolume" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                
                {/* Tabela de histórico */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">Data</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-600">Carga Máx</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-600">Séries</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-600">Reps</th>
                        <th className="px-4 py-2 text-center font-medium text-gray-600">Volume</th>
                      </tr>
                    </thead>
                    <tbody>
                      {progress.slice(-10).reverse().map((p, idx) => (
                        <tr key={idx} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-2">{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                          <td className="px-4 py-2 text-center font-medium">{p.maxWeight} kg</td>
                          <td className="px-4 py-2 text-center">{p.sets}</td>
                          <td className="px-4 py-2 text-center">{p.reps}</td>
                          <td className="px-4 py-2 text-center">{p.totalVolume} kg</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum registro encontrado para este exercício</p>
              </div>
            )
          ) : (
            <div className="text-center py-8 text-gray-500">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Selecione um exercício para ver sua evolução</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
