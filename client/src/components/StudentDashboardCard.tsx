import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Dumbbell, Activity, Target, TrendingUp, BarChart3 } from "lucide-react";
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
  students: Array<{ id: number; name: string }>;
  isLoading?: boolean;
}

export default function StudentDashboardCard({ students, isLoading }: StudentDashboardCardProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  
  // Buscar dashboard de treino do aluno selecionado
  const { data: dashboardData, isLoading: dashboardLoading } = trpc.trainingDiary.dashboard.useQuery(
    selectedStudentId !== "all" ? { studentId: parseInt(selectedStudentId) } : {},
    { enabled: true }
  );
  
  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
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
  
  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-blue-700">
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
          
          <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
            <SelectTrigger className="w-[200px] bg-white">
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
            {/* Cards de Resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/80 rounded-lg p-4 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 rounded-lg">
                    <Dumbbell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-emerald-700">{dashboard.totalWorkouts}</p>
                    <p className="text-xs text-emerald-600">Total de Treinos</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700">
                      {((dashboard.totalVolume || 0) / 1000).toFixed(1)}t
                    </p>
                    <p className="text-xs text-blue-600">Volume Total</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700">{dashboard.totalSets}</p>
                    <p className="text-xs text-purple-600">Total de Séries</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/80 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-700">{dashboard.totalReps}</p>
                    <p className="text-xs text-orange-600">Total de Reps</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Gráfico de Treinos por Mês */}
            {dashboard.workoutsByMonth && dashboard.workoutsByMonth.length > 0 && (
              <div className="bg-white/80 rounded-lg p-4 border border-blue-200">
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
        )}
      </CardContent>
    </Card>
  );
}
