import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Activity, 
  Search, 
  Plus, 
  ArrowLeft,
  Loader2,
  Scale,
  Ruler,
  Heart,
  User,
  Calendar,
  Calculator,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function AssessmentPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    studentId: 0,
    date: new Date().toISOString().split("T")[0],
    weight: "",
    height: "",
    waistCircumference: "",
    hipCircumference: "",
    armCircumference: "",
    chestCircumference: "",
    thighCircumference: "",
    calfCircumference: "",
    bodyFatPercentage: "",
    muscleMass: "",
    visceralFat: "",
    basalMetabolicRate: "",
    notes: "",
  });

  // Pegar paciente da URL se existir
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pacienteId = urlParams.get("paciente");
    if (pacienteId) {
      setSelectedStudent(parseInt(pacienteId));
      setFormData(prev => ({ ...prev, studentId: parseInt(pacienteId) }));
    }
  }, []);

  // Queries
  const { data: assessments, isLoading, refetch } = trpc.nutrition.assessments.list.useQuery(
    { studentId: selectedStudent || 0 },
    { enabled: !!selectedStudent }
  );

  const { data: students } = trpc.students.list.useQuery({});

  // Mutations
  const createAssessment = trpc.nutrition.assessments.create.useMutation({
    onSuccess: () => {
      toast.success("Avaliação registrada com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar avaliação");
    },
  });

  // Delete não está disponível no router, usando toast
  const handleDelete = (id: number) => {
    toast.info("Funcionalidade de exclusão em desenvolvimento");
  };
  
  // Placeholder para delete
  const deleteAssessmentPlaceholder = {
    isPending: false
  };

  const resetForm = () => {
    setFormData({
      studentId: selectedStudent || 0,
      date: new Date().toISOString().split("T")[0],
      weight: "",
      height: "",
      waistCircumference: "",
      hipCircumference: "",
      armCircumference: "",
      chestCircumference: "",
      thighCircumference: "",
      calfCircumference: "",
      bodyFatPercentage: "",
      muscleMass: "",
      visceralFat: "",
      basalMetabolicRate: "",
      notes: "",
    });
  };

  const calculateBMI = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height) / 100; // converter cm para m
    if (weight && height) {
      return (weight / (height * height)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Abaixo do peso", color: "text-blue-600" };
    if (bmi < 25) return { label: "Peso normal", color: "text-green-600" };
    if (bmi < 30) return { label: "Sobrepeso", color: "text-yellow-600" };
    if (bmi < 35) return { label: "Obesidade I", color: "text-orange-600" };
    if (bmi < 40) return { label: "Obesidade II", color: "text-red-600" };
    return { label: "Obesidade III", color: "text-red-800" };
  };

  const handleCreate = () => {
    if (!formData.studentId) {
      toast.error("Selecione um paciente");
      return;
    }
    if (!formData.weight) {
      toast.error("O peso é obrigatório");
      return;
    }

    createAssessment.mutate({
      studentId: formData.studentId,
      assessmentDate: formData.date,
      weight: formData.weight,
      height: formData.height || undefined,
      waistCircumference: formData.waistCircumference || undefined,
      hipCircumference: formData.hipCircumference || undefined,
      bodyFatPercentage: formData.bodyFatPercentage || undefined,
      muscleMass: formData.muscleMass || undefined,
      clinicalObservations: formData.notes || undefined,
    });
  };

  const bmi = calculateBMI();
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

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
                <Activity className="h-6 w-6 text-purple-600" />
                Avaliação Nutricional
              </h1>
              <p className="text-muted-foreground">
                Antropometria e composição corporal
              </p>
            </div>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Avaliação Nutricional</DialogTitle>
                <DialogDescription>
                  Registre os dados antropométricos do paciente
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Paciente *</Label>
                    <Select 
                      value={formData.studentId.toString()} 
                      onValueChange={(v) => setFormData({ ...formData, studentId: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o paciente" />
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
                  <div className="space-y-2">
                    <Label>Data *</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                {/* Medidas Básicas */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Medidas Básicas
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Peso (kg) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="70.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Altura (cm)</Label>
                      <Input
                        type="number"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                        placeholder="175"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>IMC Calculado</Label>
                      <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center justify-between">
                        <span className="font-medium">{bmi || "-"}</span>
                        {bmiCategory && (
                          <span className={`text-xs ${bmiCategory.color}`}>
                            {bmiCategory.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Circunferências */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Circunferências (cm)
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cintura</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.waistCircumference}
                        onChange={(e) => setFormData({ ...formData, waistCircumference: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quadril</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.hipCircumference}
                        onChange={(e) => setFormData({ ...formData, hipCircumference: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Braço</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.armCircumference}
                        onChange={(e) => setFormData({ ...formData, armCircumference: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tórax</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.chestCircumference}
                        onChange={(e) => setFormData({ ...formData, chestCircumference: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Coxa</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.thighCircumference}
                        onChange={(e) => setFormData({ ...formData, thighCircumference: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Panturrilha</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.calfCircumference}
                        onChange={(e) => setFormData({ ...formData, calfCircumference: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Composição Corporal */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Composição Corporal
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>% Gordura Corporal</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.bodyFatPercentage}
                        onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Massa Muscular (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.muscleMass}
                        onChange={(e) => setFormData({ ...formData, muscleMass: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gordura Visceral</Label>
                      <Input
                        type="number"
                        value={formData.visceralFat}
                        onChange={(e) => setFormData({ ...formData, visceralFat: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa Metabólica Basal (kcal)</Label>
                      <Input
                        type="number"
                        value={formData.basalMetabolicRate}
                        onChange={(e) => setFormData({ ...formData, basalMetabolicRate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createAssessment.isPending}>
                  {createAssessment.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Avaliação
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Select 
                  value={selectedStudent?.toString() || "all"} 
                  onValueChange={(v) => setSelectedStudent(v === "all" ? null : parseInt(v))}
                >
                  <SelectTrigger>
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar por paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os pacientes</SelectItem>
                    {students?.map((student: any) => (
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

        {/* Lista de Avaliações */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !assessments?.length ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Nenhuma avaliação encontrada</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar primeira avaliação
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-center">Peso</TableHead>
                    <TableHead className="text-center">Altura</TableHead>
                    <TableHead className="text-center">IMC</TableHead>
                    <TableHead className="text-center">% Gordura</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessments.map((assessment: any) => {
                    const assessmentBmi = assessment.bmi || (
                      assessment.weight && assessment.height 
                        ? (assessment.weight / Math.pow(assessment.height / 100, 2)).toFixed(1)
                        : null
                    );
                    const category = assessmentBmi ? getBMICategory(parseFloat(assessmentBmi)) : null;
                    
                    return (
                      <TableRow key={assessment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {assessment.studentName || "Paciente"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(assessment.date).toLocaleDateString("pt-BR")}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {assessment.weight} kg
                        </TableCell>
                        <TableCell className="text-center">
                          {assessment.height ? `${assessment.height} cm` : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {assessmentBmi ? (
                            <div>
                              <span className="font-medium">{assessmentBmi}</span>
                              {category && (
                                <Badge variant="outline" className={`ml-2 text-xs ${category.color}`}>
                                  {category.label}
                                </Badge>
                              )}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          {assessment.bodyFatPercentage ? `${assessment.bodyFatPercentage}%` : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => {
                                  if (confirm("Excluir esta avaliação?")) {
                                    handleDelete(assessment.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
