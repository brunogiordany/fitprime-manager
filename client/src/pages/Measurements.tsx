import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft,
  Plus,
  Ruler,
  Scale,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  Heart,
  Clipboard,
  Calculator,
  Upload,
  FileText,
  Image,
  Loader2,
  Sparkles,
  Brain,
} from "lucide-react";
import { useLocation, useParams, useSearch } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";

export default function Measurements() {
  const [, setLocation] = useLocation();
  const params = useParams<{ studentId: string }>();
  const searchParams = useSearch();
  const studentId = parseInt(params.studentId || "0");
  
  // Verificar se há parâmetro edit na URL
  const editParam = searchParams ? new URLSearchParams(searchParams).get('edit') : null;
  const editMeasurementId = editParam ? parseInt(editParam) : null;
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    measureDate: format(new Date(), "yyyy-MM-dd"),
    weight: "",
    height: "",
    bodyFat: "",
    muscleMass: "",
    chest: "",
    waist: "",
    hip: "",
    rightArm: "",
    leftArm: "",
    rightThigh: "",
    leftThigh: "",
    rightCalf: "",
    leftCalf: "",
    neck: "",
    notes: "",
    // Bioimpedância (manual)
    bioBodyFat: "",
    bioMuscleMass: "",
    bioFatMass: "",
    bioVisceralFat: "",
    bioBasalMetabolism: "",
    // Adipômetro (manual)
    adipBodyFat: "",
    adipMuscleMass: "",
    adipFatMass: "",
    // Dobras cutâneas
    tricepsFold: "",
    subscapularFold: "",
    suprailiacFold: "",
    abdominalFold: "",
    thighFold: "",
    chestFold: "",
    axillaryFold: "",
  });
  const [activeTab, setActiveTab] = useState("basic");
  
  // Estados para upload de bioimpedância
  const [bioFile, setBioFile] = useState<File | null>(null);
  const [isUploadingBio, setIsUploadingBio] = useState(false);
  const [bioAnalysis, setBioAnalysis] = useState<any>(null);
  
  // Estado para análise completa do aluno
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fullAnalysis, setFullAnalysis] = useState<any>(null);
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  
  // Cálculos automáticos
  const calculateIMC = (weight: string, height: string): string => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100; // converter cm para metros
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return '';
  };

  // Fórmula da Marinha dos EUA para BF estimado
  const calculateEstimatedBF = (gender: string, waist: string, neck: string, hip: string, height: string): string => {
    const w = parseFloat(waist);
    const n = parseFloat(neck);
    const h = parseFloat(height);
    const hp = parseFloat(hip);
    
    if (gender === 'male' && w > 0 && n > 0 && h > 0) {
      // Fórmula masculina: 495 / (1.0324 - 0.19077 * log10(cintura - pescoço) + 0.15456 * log10(altura)) - 450
      const bf = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
      return Math.max(0, bf).toFixed(1);
    } else if (gender === 'female' && w > 0 && n > 0 && h > 0 && hp > 0) {
      // Fórmula feminina: 495 / (1.29579 - 0.35004 * log10(cintura + quadril - pescoço) + 0.22100 * log10(altura)) - 450
      const bf = 495 / (1.29579 - 0.35004 * Math.log10(w + hp - n) + 0.22100 * Math.log10(h)) - 450;
      return Math.max(0, bf).toFixed(1);
    }
    return '';
  };

  // Calcular massa gorda e massa magra estimadas
  const calculateFatMass = (weight: string, bf: string): string => {
    const w = parseFloat(weight);
    const b = parseFloat(bf);
    if (w > 0 && b > 0) {
      return ((w * b) / 100).toFixed(1);
    }
    return '';
  };

  const calculateLeanMass = (weight: string, bf: string): string => {
    const w = parseFloat(weight);
    const b = parseFloat(bf);
    if (w > 0 && b > 0) {
      return (w - (w * b) / 100).toFixed(1);
    }
    return '';
  };

  const utils = trpc.useUtils();
  
  const { data: student, isLoading: studentLoading } = trpc.students.get.useQuery(
    { id: studentId },
    { enabled: studentId > 0 }
  );

  const { data: measurements, isLoading } = trpc.measurements.list.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  // Abrir modal de edição automaticamente se parâmetro edit estiver presente
  useEffect(() => {
    if (editMeasurementId && measurements) {
      const measurementToEdit = measurements.find(m => m.id === editMeasurementId);
      if (measurementToEdit) {
        handleEdit(measurementToEdit);
        // Limpar o parâmetro da URL após abrir
        setLocation(`/alunos/${studentId}/medidas`, { replace: true });
      }
    }
  }, [editMeasurementId, measurements]);

  // Valores calculados em tempo real
  const calculatedIMC = calculateIMC(formData.weight, formData.height);
  const calculatedBF = calculateEstimatedBF(
    student?.gender || 'male',
    formData.waist,
    formData.neck,
    formData.hip,
    formData.height
  );
  const calculatedFatMass = calculateFatMass(formData.weight, formData.bodyFat || calculatedBF);
  const calculatedLeanMass = calculateLeanMass(formData.weight, formData.bodyFat || calculatedBF);

  const createMutation = trpc.measurements.create.useMutation({
    onSuccess: () => {
      toast.success("Medidas registradas com sucesso!");
      setIsDialogOpen(false);
      resetForm();
      utils.measurements.list.invalidate({ studentId });
    },
    onError: (error) => {
      toast.error("Erro ao registrar: " + error.message);
    },
  });

  const updateMutation = trpc.measurements.update.useMutation({
    onSuccess: () => {
      toast.success("Medidas atualizadas com sucesso!");
      setIsDialogOpen(false);
      setEditingId(null);
      resetForm();
      utils.measurements.list.invalidate({ studentId });
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const deleteMutation = trpc.measurements.delete.useMutation({
    onSuccess: () => {
      toast.success("Medida excluída com sucesso!");
      utils.measurements.list.invalidate({ studentId });
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      measureDate: format(new Date(), "yyyy-MM-dd"),
      weight: "",
      height: "",
      bodyFat: "",
      muscleMass: "",
      chest: "",
      waist: "",
      hip: "",
      rightArm: "",
      leftArm: "",
      rightThigh: "",
      leftThigh: "",
      rightCalf: "",
      leftCalf: "",
      neck: "",
      notes: "",
      // Bioimpedância (manual)
      bioBodyFat: "",
      bioMuscleMass: "",
      bioFatMass: "",
      bioVisceralFat: "",
      bioBasalMetabolism: "",
      // Adipômetro (manual)
      adipBodyFat: "",
      adipMuscleMass: "",
      adipFatMass: "",
      // Dobras cutâneas
      tricepsFold: "",
      subscapularFold: "",
      suprailiacFold: "",
      abdominalFold: "",
      thighFold: "",
      chestFold: "",
      axillaryFold: "",
    });
    setActiveTab("basic");
  };

  const handleEdit = (measurement: any) => {
    setEditingId(measurement.id);
    setFormData({
      measureDate: format(new Date(measurement.measureDate), "yyyy-MM-dd"),
      weight: measurement.weight || "",
      height: measurement.height || "",
      bodyFat: measurement.bodyFat || "",
      muscleMass: measurement.muscleMass || "",
      chest: measurement.chest || "",
      waist: measurement.waist || "",
      hip: measurement.hip || "",
      rightArm: measurement.rightArm || "",
      leftArm: measurement.leftArm || "",
      rightThigh: measurement.rightThigh || "",
      leftThigh: measurement.leftThigh || "",
      rightCalf: measurement.rightCalf || "",
      leftCalf: measurement.leftCalf || "",
      neck: measurement.neck || "",
      notes: measurement.notes || "",
      // Bioimpedância (manual)
      bioBodyFat: measurement.bioBodyFat || "",
      bioMuscleMass: measurement.bioMuscleMass || "",
      bioFatMass: measurement.bioFatMass || "",
      bioVisceralFat: measurement.bioVisceralFat || "",
      bioBasalMetabolism: measurement.bioBasalMetabolism || "",
      // Adipômetro (manual)
      adipBodyFat: measurement.adipBodyFat || "",
      adipMuscleMass: measurement.adipMuscleMass || "",
      adipFatMass: measurement.adipFatMass || "",
      // Dobras cutâneas
      tricepsFold: measurement.tricepsFold || "",
      subscapularFold: measurement.subscapularFold || "",
      suprailiacFold: measurement.suprailiacFold || "",
      abdominalFold: measurement.abdominalFold || "",
      thighFold: measurement.thighFold || "",
      chestFold: measurement.chestFold || "",
      axillaryFold: measurement.axillaryFold || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        studentId,
        ...formData,
      });
    } else {
      createMutation.mutate({
        studentId,
        ...formData,
      });
    }
  };

  // Preparar dados para gráficos
  const chartData = measurements?.map(m => ({
    date: format(new Date(m.measureDate), "dd/MM", { locale: ptBR }),
    fullDate: format(new Date(m.measureDate), "dd/MM/yyyy", { locale: ptBR }),
    peso: parseFloat(m.weight || "0"),
    gordura: parseFloat(m.bodyFat || "0"),
    musculo: parseFloat(m.muscleMass || "0"),
    imc: parseFloat(m.bmi || "0"),
    cintura: parseFloat(m.waist || "0"),
    quadril: parseFloat(m.hip || "0"),
  })).reverse() || [];

  const circumferenceData = measurements?.map(m => ({
    date: format(new Date(m.measureDate), "dd/MM", { locale: ptBR }),
    peito: parseFloat(m.chest || "0"),
    cintura: parseFloat(m.waist || "0"),
    quadril: parseFloat(m.hip || "0"),
    bracoDireito: parseFloat(m.rightArm || "0"),
    bracoEsquerdo: parseFloat(m.leftArm || "0"),
    coxaDireita: parseFloat(m.rightThigh || "0"),
    coxaEsquerda: parseFloat(m.leftThigh || "0"),
  })).reverse() || [];

  // Calcular variações
  const getVariation = (current: string | null | undefined, previous: string | null | undefined) => {
    if (!current || !previous) return null;
    const curr = parseFloat(current);
    const prev = parseFloat(previous);
    if (prev === 0) return null;
    return ((curr - prev) / prev * 100).toFixed(1);
  };

  const latestMeasurement = measurements?.[0];
  const previousMeasurement = measurements?.[1];

  const weightVariation = getVariation(latestMeasurement?.weight ?? null, previousMeasurement?.weight ?? null);
  const fatVariation = getVariation(latestMeasurement?.bodyFat ?? null, previousMeasurement?.bodyFat ?? null);
  const waistVariation = getVariation(latestMeasurement?.waist ?? null, previousMeasurement?.waist ?? null);

  if (studentLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Aluno não encontrado</p>
          <Button variant="link" onClick={() => setLocation('/alunos')}>
            Voltar para lista de alunos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation(`/alunos/${studentId}`)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Medidas Corporais</h1>
              <p className="text-muted-foreground">{student.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                setIsAnalyzing(true);
                try {
                  const response = await fetch('/api/trpc/studentPortal.getFullAnalysis', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentId }),
                  });
                  const result = await response.json();
                  if (result.result?.data) {
                    setFullAnalysis(result.result.data);
                    setIsAnalysisModalOpen(true);
                  }
                } catch (error) {
                  toast.error('Erro ao gerar análise');
                } finally {
                  setIsAnalyzing(false);
                }
              }}
              disabled={isAnalyzing}
              className="border-purple-200 hover:bg-purple-50"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2 text-purple-600" />
                  Análise Completa IA
                </>
              )}
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingId(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Medição
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Editar Medição' : 'Nova Medição'}</DialogTitle>
                <DialogDescription>
                  Registre as medidas corporais do aluno. O BF estimado é calculado automaticamente.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Data da Medição *</Label>
                    <Input
                      type="date"
                      value={formData.measureDate}
                      onChange={(e) => setFormData({ ...formData, measureDate: e.target.value })}
                    />
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic" className="flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Básico
                    </TabsTrigger>
                    <TabsTrigger value="bio" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Bioimpedância
                    </TabsTrigger>
                    <TabsTrigger value="adip" className="flex items-center gap-2">
                      <Clipboard className="h-4 w-4" />
                      Adipômetro
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6 mt-4">
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Composição Corporal
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="grid gap-2">
                          <Label>Peso (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="70.5"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Altura (cm)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="175"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>% Gordura</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="15.5"
                        value={formData.bodyFat}
                        onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Massa Muscular (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="35.0"
                        value={formData.muscleMass}
                        onChange={(e) => setFormData({ ...formData, muscleMass: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Cálculos Automáticos */}
                {(calculatedIMC || calculatedBF) && (
                  <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <h4 className="font-semibold flex items-center gap-2 mb-3 text-emerald-800">
                      <Calculator className="h-4 w-4" />
                      Cálculos Automáticos
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {calculatedIMC && (
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-emerald-600">{calculatedIMC}</p>
                          <p className="text-xs text-muted-foreground">IMC</p>
                          <p className="text-xs text-emerald-600">
                            {parseFloat(calculatedIMC) < 18.5 ? 'Abaixo do peso' :
                             parseFloat(calculatedIMC) < 25 ? 'Peso normal' :
                             parseFloat(calculatedIMC) < 30 ? 'Sobrepeso' : 'Obesidade'}
                          </p>
                        </div>
                      )}
                      {calculatedBF && (
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-emerald-600">{calculatedBF}%</p>
                          <p className="text-xs text-muted-foreground">BF Estimado</p>
                          <p className="text-xs text-emerald-600">Fórmula Marinha EUA</p>
                        </div>
                      )}
                      {calculatedFatMass && (
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-amber-600">{calculatedFatMass} kg</p>
                          <p className="text-xs text-muted-foreground">Massa Gorda Est.</p>
                        </div>
                      )}
                      {calculatedLeanMass && (
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{calculatedLeanMass} kg</p>
                          <p className="text-xs text-muted-foreground">Massa Magra Est.</p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      * BF estimado requer: altura, pescoço, cintura{student?.gender === 'female' ? ' e quadril' : ''}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Ruler className="h-4 w-4" />
                    Circunferências (cm)
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>Pescoço</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="38"
                        value={formData.neck}
                        onChange={(e) => setFormData({ ...formData, neck: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Peito</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="100"
                        value={formData.chest}
                        onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Cintura</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="80"
                        value={formData.waist}
                        onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Quadril</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="95"
                        value={formData.hip}
                        onChange={(e) => setFormData({ ...formData, hip: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Braço Direito</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="35"
                        value={formData.rightArm}
                        onChange={(e) => setFormData({ ...formData, rightArm: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Braço Esquerdo</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="34.5"
                        value={formData.leftArm}
                        onChange={(e) => setFormData({ ...formData, leftArm: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Coxa Direita</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="55"
                        value={formData.rightThigh}
                        onChange={(e) => setFormData({ ...formData, rightThigh: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Coxa Esquerda</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="54.5"
                        value={formData.leftThigh}
                        onChange={(e) => setFormData({ ...formData, leftThigh: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Panturrilha Direita</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="38"
                        value={formData.rightCalf}
                        onChange={(e) => setFormData({ ...formData, rightCalf: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Panturrilha Esquerda</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="37.5"
                        value={formData.leftCalf}
                        onChange={(e) => setFormData({ ...formData, leftCalf: e.target.value })}
                      />
                    </div>
                  </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Observações</Label>
                      <Textarea
                        placeholder="Anotações sobre a medição..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="bio" className="space-y-6 mt-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">
                        <strong>Bioimpedância:</strong> Preencha manualmente ou faça upload do PDF/foto do exame para extração automática por IA.
                      </p>
                    </div>
                    
                    {/* Upload de Bioimpedância com IA */}
                    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-600" />
                          Upload com Análise por IA
                        </CardTitle>
                        <CardDescription>
                          Envie o PDF ou foto do exame de bioimpedância e a IA extrairá os dados automaticamente
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Verificar tamanho
                                  const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
                                  if (file.size > maxSize) {
                                    toast.error(`Arquivo muito grande. Máximo: ${file.type === 'application/pdf' ? '10MB' : '5MB'}`);
                                    return;
                                  }
                                  setBioFile(file);
                                  setBioAnalysis(null);
                                }
                              }}
                              className="hidden"
                              id="bio-upload"
                            />
                            <label
                              htmlFor="bio-upload"
                              className="flex-1 border-2 border-dashed border-purple-300 rounded-lg p-4 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50/50 transition-colors"
                            >
                              {bioFile ? (
                                <div className="flex items-center justify-center gap-2">
                                  {bioFile.type === 'application/pdf' ? (
                                    <FileText className="h-5 w-5 text-purple-600" />
                                  ) : (
                                    <Image className="h-5 w-5 text-purple-600" />
                                  )}
                                  <span className="text-sm font-medium text-purple-700">{bioFile.name}</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <Upload className="h-8 w-8 text-purple-400" />
                                  <span className="text-sm text-muted-foreground">
                                    Clique para selecionar PDF ou foto
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Máx: 5MB (fotos) / 10MB (PDF)
                                  </span>
                                </div>
                              )}
                            </label>
                          </div>
                          
                          {bioFile && (
                            <Button
                              onClick={async () => {
                                if (!bioFile) return;
                                setIsUploadingBio(true);
                                try {
                                  const formDataUpload = new FormData();
                                  formDataUpload.append('file', bioFile);
                                  formDataUpload.append('studentId', studentId.toString());
                                  
                                  const response = await fetch('/api/upload-bioimpedance', {
                                    method: 'POST',
                                    body: formDataUpload,
                                  });
                                  
                                  if (!response.ok) throw new Error('Erro no upload');
                                  
                                  const result = await response.json();
                                  setBioAnalysis(result);
                                  
                                  // Preencher campos automaticamente
                                  if (result.extractedData) {
                                    const data = result.extractedData;
                                    setFormData(prev => ({
                                      ...prev,
                                      bioBodyFat: data.bodyFatPercentage?.toString() || prev.bioBodyFat,
                                      bioMuscleMass: data.muscleMass?.toString() || prev.bioMuscleMass,
                                      bioFatMass: data.fatMass?.toString() || prev.bioFatMass,
                                      bioVisceralFat: data.visceralFat?.toString() || prev.bioVisceralFat,
                                      bioBasalMetabolism: data.basalMetabolism?.toString() || prev.bioBasalMetabolism,
                                    }));
                                    toast.success('Dados extraídos com sucesso!');
                                  }
                                } catch (error) {
                                  toast.error('Erro ao processar arquivo');
                                } finally {
                                  setIsUploadingBio(false);
                                }
                              }}
                              disabled={isUploadingBio}
                              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                            >
                              {isUploadingBio ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Analisando com IA...
                                </>
                              ) : (
                                <>
                                  <Brain className="h-4 w-4 mr-2" />
                                  Analisar e Extrair Dados
                                </>
                              )}
                            </Button>
                          )}
                          
                          {bioAnalysis && (
                            <div className="p-3 bg-white rounded-lg border border-purple-200">
                              <p className="text-xs font-medium text-purple-700 mb-2">Análise da IA:</p>
                              <p className="text-sm text-muted-foreground">{bioAnalysis.analysis}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">ou preencha manualmente</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="grid gap-2">
                        <Label>% Gordura (Bio)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="15.5"
                          value={formData.bioBodyFat}
                          onChange={(e) => setFormData({ ...formData, bioBodyFat: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Massa Muscular (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="35.0"
                          value={formData.bioMuscleMass}
                          onChange={(e) => setFormData({ ...formData, bioMuscleMass: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Massa Gorda (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="12.0"
                          value={formData.bioFatMass}
                          onChange={(e) => setFormData({ ...formData, bioFatMass: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Gordura Visceral</Label>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="8"
                          value={formData.bioVisceralFat}
                          onChange={(e) => setFormData({ ...formData, bioVisceralFat: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Metabolismo Basal (kcal)</Label>
                        <Input
                          type="number"
                          step="1"
                          placeholder="1800"
                          value={formData.bioBasalMetabolism}
                          onChange={(e) => setFormData({ ...formData, bioBasalMetabolism: e.target.value })}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="adip" className="space-y-6 mt-4">
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-700">
                        <strong>Adipômetro:</strong> Preencha com os dados obtidos em avaliação com adipômetro profissional.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold">Resultados</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label>% Gordura (Adip)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="15.5"
                            value={formData.adipBodyFat}
                            onChange={(e) => setFormData({ ...formData, adipBodyFat: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Massa Muscular (kg)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="35.0"
                            value={formData.adipMuscleMass}
                            onChange={(e) => setFormData({ ...formData, adipMuscleMass: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Massa Gorda (kg)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="12.0"
                            value={formData.adipFatMass}
                            onChange={(e) => setFormData({ ...formData, adipFatMass: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold">Dobras Cutâneas (mm)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="grid gap-2">
                          <Label>Tríceps</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="12"
                            value={formData.tricepsFold}
                            onChange={(e) => setFormData({ ...formData, tricepsFold: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Subescapular</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="14"
                            value={formData.subscapularFold}
                            onChange={(e) => setFormData({ ...formData, subscapularFold: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Supra-ilíaca</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="18"
                            value={formData.suprailiacFold}
                            onChange={(e) => setFormData({ ...formData, suprailiacFold: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Abdominal</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="20"
                            value={formData.abdominalFold}
                            onChange={(e) => setFormData({ ...formData, abdominalFold: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Coxa</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="16"
                            value={formData.thighFold}
                            onChange={(e) => setFormData({ ...formData, thighFold: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Peitoral</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="10"
                            value={formData.chestFold}
                            onChange={(e) => setFormData({ ...formData, chestFold: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Axilar Média</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="12"
                            value={formData.axillaryFold}
                            onChange={(e) => setFormData({ ...formData, axillaryFold: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {/* Modal de Análise Completa por IA */}
        <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Análise Completa por IA - {student.name}
              </DialogTitle>
              <DialogDescription>
                Relatório gerado pela IA cruzando todos os dados do aluno
              </DialogDescription>
            </DialogHeader>
            {fullAnalysis && (
              <div className="space-y-6 py-4">
                {/* Resumo Geral */}
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Resumo Geral</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{fullAnalysis.summary}</p>
                  </CardContent>
                </Card>
                
                {/* Pontos Fortes */}
                {fullAnalysis.strengths && fullAnalysis.strengths.length > 0 && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-green-700 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Pontos Fortes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {fullAnalysis.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-green-700">{s}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                
                {/* Déficits Identificados */}
                {fullAnalysis.deficits && fullAnalysis.deficits.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-amber-700 flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Déficits Identificados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {fullAnalysis.deficits.map((d: string, i: number) => (
                          <li key={i} className="text-sm text-amber-700">{d}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                
                {/* Recomendações */}
                {fullAnalysis.recommendations && fullAnalysis.recommendations.length > 0 && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-blue-700 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Recomendações
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1">
                        {fullAnalysis.recommendations.map((r: string, i: number) => (
                          <li key={i} className="text-sm text-blue-700">{r}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                
                {/* Análise Detalhada */}
                {fullAnalysis.detailedAnalysis && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Análise Detalhada</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                        {fullAnalysis.detailedAnalysis}
                      </p>
                    </CardContent>
                  </Card>
                )}
                
                {/* Botões de Ação */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsAnalysisModalOpen(false)}>
                    Fechar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // Gerar PDF da análise
                      const printContent = document.createElement('div');
                      printContent.innerHTML = `
                        <html>
                          <head>
                            <title>Análise Completa - ${student.name}</title>
                            <style>
                              body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                              h1 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
                              h2 { color: #374151; margin-top: 30px; }
                              .section { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 15px 0; }
                              .strength { background: #dcfce7; border-left: 4px solid #22c55e; }
                              .deficit { background: #fef3c7; border-left: 4px solid #f59e0b; }
                              .recommendation { background: #dbeafe; border-left: 4px solid #3b82f6; }
                              ul { margin: 10px 0; padding-left: 20px; }
                              li { margin: 5px 0; }
                              .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
                            </style>
                          </head>
                          <body>
                            <h1>Análise Completa por IA</h1>
                            <p><strong>Aluno:</strong> ${student.name}</p>
                            <p><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</p>
                            
                            <h2>Resumo Geral</h2>
                            <div class="section">
                              <p>${fullAnalysis.summary || 'Não disponível'}</p>
                            </div>
                            
                            ${fullAnalysis.strengths?.length ? `
                              <h2>Pontos Fortes</h2>
                              <div class="section strength">
                                <ul>
                                  ${fullAnalysis.strengths.map((s: string) => `<li>${s}</li>`).join('')}
                                </ul>
                              </div>
                            ` : ''}
                            
                            ${fullAnalysis.deficits?.length ? `
                              <h2>Déficits Identificados</h2>
                              <div class="section deficit">
                                <ul>
                                  ${fullAnalysis.deficits.map((d: string) => `<li>${d}</li>`).join('')}
                                </ul>
                              </div>
                            ` : ''}
                            
                            ${fullAnalysis.recommendations?.length ? `
                              <h2>Recomendações</h2>
                              <div class="section recommendation">
                                <ul>
                                  ${fullAnalysis.recommendations.map((r: string) => `<li>${r}</li>`).join('')}
                                </ul>
                              </div>
                            ` : ''}
                            
                            ${fullAnalysis.detailedAnalysis ? `
                              <h2>Análise Detalhada</h2>
                              <div class="section">
                                <p>${fullAnalysis.detailedAnalysis}</p>
                              </div>
                            ` : ''}
                            
                            <div class="footer">
                              <p>Relatório gerado por FitPrime Manager - Sistema de Análise por IA</p>
                            </div>
                          </body>
                        </html>
                      `;
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(printContent.innerHTML);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Exportar PDF
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsAnalysisModalOpen(false);
                      setLocation(`/alunos/${studentId}/treinos`);
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar Treino Adaptado
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* KPIs de Última Medição */}
        {latestMeasurement && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Peso Atual</p>
                    <p className="text-2xl font-bold">{latestMeasurement.weight || '-'} kg</p>
                  </div>
                  {weightVariation && (
                    <div className={`flex items-center gap-1 text-sm ${parseFloat(weightVariation) < 0 ? 'text-emerald-600' : parseFloat(weightVariation) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {parseFloat(weightVariation) < 0 ? <TrendingDown className="h-4 w-4" /> : parseFloat(weightVariation) > 0 ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                      {weightVariation}%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">IMC</p>
                    <p className="text-2xl font-bold">{latestMeasurement.bmi || '-'}</p>
                  </div>
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">% Gordura</p>
                    <p className="text-2xl font-bold">{latestMeasurement.bodyFat || '-'}%</p>
                  </div>
                  {fatVariation && (
                    <div className={`flex items-center gap-1 text-sm ${parseFloat(fatVariation) < 0 ? 'text-emerald-600' : parseFloat(fatVariation) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {parseFloat(fatVariation) < 0 ? <TrendingDown className="h-4 w-4" /> : parseFloat(fatVariation) > 0 ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                      {fatVariation}%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cintura</p>
                    <p className="text-2xl font-bold">{latestMeasurement.waist || '-'} cm</p>
                  </div>
                  {waistVariation && (
                    <div className={`flex items-center gap-1 text-sm ${parseFloat(waistVariation) < 0 ? 'text-emerald-600' : parseFloat(waistVariation) > 0 ? 'text-amber-600' : 'text-gray-500'}`}>
                      {parseFloat(waistVariation) < 0 ? <TrendingDown className="h-4 w-4" /> : parseFloat(waistVariation) > 0 ? <TrendingUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                      {waistVariation}%
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Card de Cálculos Automáticos - Visível fora do modal */}
        {latestMeasurement && (
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                <Calculator className="h-5 w-5" />
                Cálculos Automáticos
              </CardTitle>
              <CardDescription className="text-emerald-600">
                Baseado na última medição registrada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* IMC */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-emerald-100">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-emerald-600">{latestMeasurement.bmi || '-'}</p>
                    <p className="text-sm font-medium text-emerald-700 mt-1">IMC</p>
                    <p className="text-xs text-emerald-500 mt-1">
                      {latestMeasurement.bmi ? (
                        parseFloat(String(latestMeasurement.bmi)) < 18.5 ? 'Abaixo do peso' :
                        parseFloat(String(latestMeasurement.bmi)) < 25 ? 'Peso normal' :
                        parseFloat(String(latestMeasurement.bmi)) < 30 ? 'Sobrepeso' : 'Obesidade'
                      ) : '-'}
                    </p>
                  </div>
                </div>
                
                {/* BF Estimado */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-orange-100">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-500">{latestMeasurement.bodyFat || '-'}%</p>
                    <p className="text-sm font-medium text-orange-600 mt-1">BF Estimado</p>
                    <p className="text-xs text-orange-400 mt-1">% Gordura Corporal</p>
                  </div>
                </div>
                
                {/* Massa Gorda */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-red-100">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-500">
                      {latestMeasurement.weight && latestMeasurement.bodyFat 
                        ? ((parseFloat(String(latestMeasurement.weight)) * parseFloat(String(latestMeasurement.bodyFat))) / 100).toFixed(1)
                        : '-'} kg
                    </p>
                    <p className="text-sm font-medium text-red-600 mt-1">Massa Gorda</p>
                    <p className="text-xs text-red-400 mt-1">Peso de gordura</p>
                  </div>
                </div>
                
                {/* Massa Magra */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-500">
                      {latestMeasurement.weight && latestMeasurement.bodyFat 
                        ? (parseFloat(String(latestMeasurement.weight)) - (parseFloat(String(latestMeasurement.weight)) * parseFloat(String(latestMeasurement.bodyFat))) / 100).toFixed(1)
                        : '-'} kg
                    </p>
                    <p className="text-sm font-medium text-blue-600 mt-1">Massa Magra</p>
                    <p className="text-xs text-blue-400 mt-1">Músculos + ossos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráficos */}
        {chartData.length > 1 && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolução do Peso</CardTitle>
                <CardDescription>Acompanhamento ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={['auto', 'auto']} />
                      <Tooltip 
                        formatter={(value: number) => [`${value} kg`, 'Peso']}
                        labelFormatter={(label) => `Data: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="peso" 
                        stroke="oklch(0.55 0.18 160)" 
                        fill="oklch(0.55 0.18 160 / 0.2)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Composição Corporal</CardTitle>
                <CardDescription>% Gordura e Massa Muscular</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="gordura" 
                        name="% Gordura"
                        stroke="oklch(0.7 0.15 60)" 
                        strokeWidth={2}
                        dot={{ fill: "oklch(0.7 0.15 60)" }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="musculo" 
                        name="Massa Muscular (kg)"
                        stroke="oklch(0.55 0.18 160)" 
                        strokeWidth={2}
                        dot={{ fill: "oklch(0.55 0.18 160)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {circumferenceData.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Evolução das Circunferências</CardTitle>
              <CardDescription>Medidas em centímetros ao longo do tempo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={circumferenceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="peito" name="Peito" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="cintura" name="Cintura" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="quadril" name="Quadril" stroke="#ffc658" strokeWidth={2} />
                    <Line type="monotone" dataKey="bracoDireito" name="Braço D" stroke="#ff7300" strokeWidth={2} />
                    <Line type="monotone" dataKey="coxaDireita" name="Coxa D" stroke="#00C49F" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Histórico de Medições */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Medições</CardTitle>
            <CardDescription>{measurements?.length || 0} medições registradas</CardDescription>
          </CardHeader>
          <CardContent>
            {measurements && measurements.length > 0 ? (
              <div className="space-y-3">
                {measurements.map((m) => (
                  <div 
                    key={m.id} 
                    className="border rounded-lg overflow-hidden"
                  >
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50"
                      onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {format(new Date(m.measureDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Peso: {m.weight || '-'} kg | IMC: {m.bmi || '-'} | Gordura: {m.bodyFat || '-'}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(m);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Tem certeza que deseja excluir esta medição?')) {
                              deleteMutation.mutate({ id: m.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                        {expandedId === m.id ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                    
                    {expandedId === m.id && (
                      <div className="px-4 pb-4 pt-2 border-t bg-accent/20">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Peso</p>
                            <p className="font-medium">{m.weight || '-'} kg</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Altura</p>
                            <p className="font-medium">{m.height || '-'} cm</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">IMC</p>
                            <p className="font-medium">{m.bmi || '-'}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">% Gordura</p>
                            <p className="font-medium">{m.bodyFat || '-'}%</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Massa Muscular</p>
                            <p className="font-medium">{m.muscleMass || '-'} kg</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Pescoço</p>
                            <p className="font-medium">{m.neck || '-'} cm</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Peito</p>
                            <p className="font-medium">{m.chest || '-'} cm</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Cintura</p>
                            <p className="font-medium">{m.waist || '-'} cm</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quadril</p>
                            <p className="font-medium">{m.hip || '-'} cm</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Braço D / E</p>
                            <p className="font-medium">{m.rightArm || '-'} / {m.leftArm || '-'} cm</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Coxa D / E</p>
                            <p className="font-medium">{m.rightThigh || '-'} / {m.leftThigh || '-'} cm</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Panturrilha D / E</p>
                            <p className="font-medium">{m.rightCalf || '-'} / {m.leftCalf || '-'} cm</p>
                          </div>
                        </div>
                        {m.notes && (
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-muted-foreground text-sm">Observações</p>
                            <p className="text-sm">{m.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Ruler className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma medição registrada</p>
                <Button variant="link" onClick={() => setIsDialogOpen(true)}>
                  Registrar primeira medição
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
