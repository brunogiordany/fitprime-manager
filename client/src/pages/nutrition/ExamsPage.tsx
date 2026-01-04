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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  TestTube, 
  Plus, 
  ArrowLeft,
  Loader2,
  User,
  Calendar,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";

export default function ExamsPage() {
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  
  // Form state para exames laboratoriais completos
  const [formData, setFormData] = useState({
    studentId: 0,
    examDate: new Date().toISOString().split("T")[0],
    labName: "",
    // Hemograma
    hemoglobin: "",
    hematocrit: "",
    // Perfil lipídico
    totalCholesterol: "",
    hdlCholesterol: "",
    ldlCholesterol: "",
    triglycerides: "",
    // Glicemia
    fastingGlucose: "",
    hba1c: "",
    insulin: "",
    // Função renal
    creatinine: "",
    urea: "",
    uricAcid: "",
    // Função hepática
    ast: "",
    alt: "",
    ggt: "",
    // Tireoide
    tsh: "",
    t4Free: "",
    // Vitaminas
    vitaminD: "",
    vitaminB12: "",
    ferritin: "",
    // Hormônios
    testosterone: "",
    cortisol: "",
    // Inflamação
    crp: "",
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
  const { data: exams, isLoading, refetch } = trpc.nutrition.labExams.list.useQuery(
    { studentId: selectedStudent || 0 },
    { enabled: !!selectedStudent }
  );

  const { data: students } = trpc.students.list.useQuery({});

  // Mutations
  const createExam = trpc.nutrition.labExams.create.useMutation({
    onSuccess: () => {
      toast.success("Exame registrado com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar exame");
    },
  });

  const resetForm = () => {
    setFormData({
      studentId: selectedStudent || 0,
      examDate: new Date().toISOString().split("T")[0],
      labName: "",
      hemoglobin: "",
      hematocrit: "",
      totalCholesterol: "",
      hdlCholesterol: "",
      ldlCholesterol: "",
      triglycerides: "",
      fastingGlucose: "",
      hba1c: "",
      insulin: "",
      creatinine: "",
      urea: "",
      uricAcid: "",
      ast: "",
      alt: "",
      ggt: "",
      tsh: "",
      t4Free: "",
      vitaminD: "",
      vitaminB12: "",
      ferritin: "",
      testosterone: "",
      cortisol: "",
      crp: "",
      notes: "",
    });
  };

  const handleCreate = () => {
    if (!formData.studentId) {
      toast.error("Selecione um paciente");
      return;
    }

    // Filtrar campos vazios
    const data: any = {
      studentId: formData.studentId,
      examDate: formData.examDate,
    };

    if (formData.labName) data.labName = formData.labName;
    if (formData.hemoglobin) data.hemoglobin = formData.hemoglobin;
    if (formData.hematocrit) data.hematocrit = formData.hematocrit;
    if (formData.totalCholesterol) data.totalCholesterol = formData.totalCholesterol;
    if (formData.hdlCholesterol) data.hdlCholesterol = formData.hdlCholesterol;
    if (formData.ldlCholesterol) data.ldlCholesterol = formData.ldlCholesterol;
    if (formData.triglycerides) data.triglycerides = formData.triglycerides;
    if (formData.fastingGlucose) data.fastingGlucose = formData.fastingGlucose;
    if (formData.hba1c) data.hba1c = formData.hba1c;
    if (formData.insulin) data.insulin = formData.insulin;
    if (formData.creatinine) data.creatinine = formData.creatinine;
    if (formData.urea) data.urea = formData.urea;
    if (formData.uricAcid) data.uricAcid = formData.uricAcid;
    if (formData.ast) data.ast = formData.ast;
    if (formData.alt) data.alt = formData.alt;
    if (formData.ggt) data.ggt = formData.ggt;
    if (formData.tsh) data.tsh = formData.tsh;
    if (formData.t4Free) data.t4Free = formData.t4Free;
    if (formData.vitaminD) data.vitaminD = formData.vitaminD;
    if (formData.vitaminB12) data.vitaminB12 = formData.vitaminB12;
    if (formData.ferritin) data.ferritin = formData.ferritin;
    if (formData.testosterone) data.testosterone = formData.testosterone;
    if (formData.cortisol) data.cortisol = formData.cortisol;
    if (formData.crp) data.crp = formData.crp;
    if (formData.notes) data.notes = formData.notes;

    createExam.mutate(data);
  };

  const getValueStatus = (value: string | null, min: number, max: number) => {
    if (!value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    if (num < min) return "low";
    if (num > max) return "high";
    return "normal";
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    switch (status) {
      case "normal":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Normal
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Baixo
          </Badge>
        );
      case "high":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Alto
          </Badge>
        );
      default:
        return null;
    }
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
                <TestTube className="h-6 w-6 text-red-600" />
                Exames Laboratoriais
              </h1>
              <p className="text-muted-foreground">
                Registro e acompanhamento de exames
              </p>
            </div>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Exame
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Exames Laboratoriais</DialogTitle>
                <DialogDescription>
                  Preencha os valores dos exames realizados
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
                        <SelectValue placeholder="Selecione" />
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
                    <Label>Data do Exame *</Label>
                    <Input
                      type="date"
                      value={formData.examDate}
                      onChange={(e) => setFormData({ ...formData, examDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Laboratório</Label>
                  <Input
                    value={formData.labName}
                    onChange={(e) => setFormData({ ...formData, labName: e.target.value })}
                    placeholder="Nome do laboratório"
                  />
                </div>

                <Tabs defaultValue="lipidico" className="w-full">
                  <TabsList className="grid grid-cols-5 w-full">
                    <TabsTrigger value="lipidico">Lipídico</TabsTrigger>
                    <TabsTrigger value="glicemia">Glicemia</TabsTrigger>
                    <TabsTrigger value="renal">Renal</TabsTrigger>
                    <TabsTrigger value="hepatico">Hepático</TabsTrigger>
                    <TabsTrigger value="outros">Outros</TabsTrigger>
                  </TabsList>

                  <TabsContent value="lipidico" className="space-y-4 mt-4">
                    <h4 className="font-medium">Perfil Lipídico</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Colesterol Total (mg/dL)</Label>
                        <Input
                          type="number"
                          value={formData.totalCholesterol}
                          onChange={(e) => setFormData({ ...formData, totalCholesterol: e.target.value })}
                          placeholder="< 200"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>HDL (mg/dL)</Label>
                        <Input
                          type="number"
                          value={formData.hdlCholesterol}
                          onChange={(e) => setFormData({ ...formData, hdlCholesterol: e.target.value })}
                          placeholder="> 40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>LDL (mg/dL)</Label>
                        <Input
                          type="number"
                          value={formData.ldlCholesterol}
                          onChange={(e) => setFormData({ ...formData, ldlCholesterol: e.target.value })}
                          placeholder="< 100"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Triglicerídeos (mg/dL)</Label>
                        <Input
                          type="number"
                          value={formData.triglycerides}
                          onChange={(e) => setFormData({ ...formData, triglycerides: e.target.value })}
                          placeholder="< 150"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="glicemia" className="space-y-4 mt-4">
                    <h4 className="font-medium">Glicemia e Metabolismo</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Glicemia Jejum (mg/dL)</Label>
                        <Input
                          type="number"
                          value={formData.fastingGlucose}
                          onChange={(e) => setFormData({ ...formData, fastingGlucose: e.target.value })}
                          placeholder="70-99"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>HbA1c (%)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.hba1c}
                          onChange={(e) => setFormData({ ...formData, hba1c: e.target.value })}
                          placeholder="< 5.7"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Insulina (µU/mL)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.insulin}
                          onChange={(e) => setFormData({ ...formData, insulin: e.target.value })}
                          placeholder="2-25"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="renal" className="space-y-4 mt-4">
                    <h4 className="font-medium">Função Renal</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Creatinina (mg/dL)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.creatinine}
                          onChange={(e) => setFormData({ ...formData, creatinine: e.target.value })}
                          placeholder="0.7-1.3"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ureia (mg/dL)</Label>
                        <Input
                          type="number"
                          value={formData.urea}
                          onChange={(e) => setFormData({ ...formData, urea: e.target.value })}
                          placeholder="15-40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ácido Úrico (mg/dL)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.uricAcid}
                          onChange={(e) => setFormData({ ...formData, uricAcid: e.target.value })}
                          placeholder="2.5-7.0"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="hepatico" className="space-y-4 mt-4">
                    <h4 className="font-medium">Função Hepática</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>TGO/AST (U/L)</Label>
                        <Input
                          type="number"
                          value={formData.ast}
                          onChange={(e) => setFormData({ ...formData, ast: e.target.value })}
                          placeholder="< 40"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>TGP/ALT (U/L)</Label>
                        <Input
                          type="number"
                          value={formData.alt}
                          onChange={(e) => setFormData({ ...formData, alt: e.target.value })}
                          placeholder="< 41"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>GGT (U/L)</Label>
                        <Input
                          type="number"
                          value={formData.ggt}
                          onChange={(e) => setFormData({ ...formData, ggt: e.target.value })}
                          placeholder="< 60"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="outros" className="space-y-4 mt-4">
                    <h4 className="font-medium">Tireoide</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>TSH (mUI/L)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.tsh}
                          onChange={(e) => setFormData({ ...formData, tsh: e.target.value })}
                          placeholder="0.4-4.0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>T4 Livre (ng/dL)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.t4Free}
                          onChange={(e) => setFormData({ ...formData, t4Free: e.target.value })}
                          placeholder="0.8-1.8"
                        />
                      </div>
                    </div>

                    <h4 className="font-medium mt-4">Vitaminas e Minerais</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Vitamina D (ng/mL)</Label>
                        <Input
                          type="number"
                          value={formData.vitaminD}
                          onChange={(e) => setFormData({ ...formData, vitaminD: e.target.value })}
                          placeholder="> 30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Vitamina B12 (pg/mL)</Label>
                        <Input
                          type="number"
                          value={formData.vitaminB12}
                          onChange={(e) => setFormData({ ...formData, vitaminB12: e.target.value })}
                          placeholder="200-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ferritina (ng/mL)</Label>
                        <Input
                          type="number"
                          value={formData.ferritin}
                          onChange={(e) => setFormData({ ...formData, ferritin: e.target.value })}
                          placeholder="30-300"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Observações adicionais..."
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createExam.isPending}>
                  {createExam.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Exames
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
            </div>
          </CardContent>
        </Card>

        {/* Lista de Exames */}
        <Card>
          <CardContent className="p-0">
            {!selectedStudent ? (
              <div className="text-center py-12">
                <User className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Selecione um paciente para ver os exames</p>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : !exams?.length ? (
              <div className="text-center py-12">
                <TestTube className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Nenhum exame encontrado</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar primeiro exame
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Laboratório</TableHead>
                    <TableHead className="text-center">Glicemia</TableHead>
                    <TableHead className="text-center">Col. Total</TableHead>
                    <TableHead className="text-center">HDL</TableHead>
                    <TableHead className="text-center">LDL</TableHead>
                    <TableHead className="text-center">Triglicerídeos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((exam: any) => (
                    <TableRow key={exam.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(exam.examDate).toLocaleDateString("pt-BR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        {exam.labName || "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {exam.fastingGlucose ? (
                          <div className="flex items-center justify-center gap-1">
                            <span>{exam.fastingGlucose}</span>
                            {getStatusBadge(getValueStatus(exam.fastingGlucose, 70, 99))}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {exam.totalCholesterol ? (
                          <div className="flex items-center justify-center gap-1">
                            <span>{exam.totalCholesterol}</span>
                            {getStatusBadge(getValueStatus(exam.totalCholesterol, 0, 200))}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {exam.hdlCholesterol ? (
                          <div className="flex items-center justify-center gap-1">
                            <span>{exam.hdlCholesterol}</span>
                            {getStatusBadge(getValueStatus(exam.hdlCholesterol, 40, 999))}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {exam.ldlCholesterol ? (
                          <div className="flex items-center justify-center gap-1">
                            <span>{exam.ldlCholesterol}</span>
                            {getStatusBadge(getValueStatus(exam.ldlCholesterol, 0, 100))}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {exam.triglycerides ? (
                          <div className="flex items-center justify-center gap-1">
                            <span>{exam.triglycerides}</span>
                            {getStatusBadge(getValueStatus(exam.triglycerides, 0, 150))}
                          </div>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toast.info("Visualização detalhada em desenvolvimento")}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
