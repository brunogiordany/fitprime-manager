import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TrendingUp, Users } from "lucide-react";
import { UnifiedEvolutionDashboard } from "@/components/UnifiedEvolutionDashboard";

export default function EvolutionDashboard() {
  const { user } = useAuth();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  // Queries
  const { data: students } = trpc.students.list.useQuery();
  
  // Query para fotos do aluno selecionado
  const { data: photos, refetch: refetchPhotos } = trpc.photos.list.useQuery(
    { studentId: parseInt(selectedStudentId) },
    { enabled: !!selectedStudentId && selectedStudentId !== 'all' }
  );

  // Query para medidas do aluno selecionado
  const { data: measurements } = trpc.measurements.list.useQuery(
    { studentId: parseInt(selectedStudentId) },
    { enabled: !!selectedStudentId && selectedStudentId !== 'all' }
  );

  // Encontrar nome do aluno selecionado
  const selectedStudent = students?.find(s => s.id === parseInt(selectedStudentId));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Evolução
            </h1>
            <p className="text-muted-foreground">
              Acompanhe a evolução completa dos seus alunos: fotos, medidas e treinos
            </p>
          </div>
        </div>

        {/* Seletor de Aluno */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <Label className="text-sm font-medium">Selecione um aluno:</Label>
              </div>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="Escolha um aluno para ver a evolução" />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Conteúdo */}
        {!selectedStudentId ? (
          <Card>
            <CardContent className="py-12 text-center">
              <TrendingUp className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Selecione um aluno</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Escolha um aluno acima para visualizar sua evolução completa: fotos de progresso, 
                medidas corporais e evolução nos treinos.
              </p>
            </CardContent>
          </Card>
        ) : (
          <UnifiedEvolutionDashboard
            studentId={parseInt(selectedStudentId)}
            studentName={selectedStudent?.name || 'Aluno'}
            photos={photos || []}
            measurements={measurements || []}
            onRefresh={() => refetchPhotos()}
            showStudentSelector={false}
            embedded={false}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
