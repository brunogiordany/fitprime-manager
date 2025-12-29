import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  Save,
  User,
  Heart,
  Activity,
  Target,
  AlertTriangle,
  Utensils,
  Ruler,
  Scale,
  Calculator,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Anamnesis() {
  const [, setLocation] = useLocation();
  const params = useParams<{ studentId: string }>();
  const studentId = parseInt(params.studentId || "0");
  
  const [formData, setFormData] = useState({
    // Estilo de vida
    occupation: "",
    lifestyle: "",
    sleepHours: "",
    stressLevel: "",
    
    // Objetivos
    mainGoal: "",
    secondaryGoals: "",
    targetWeight: "",
    exerciseExperience: "",
    
    // Saúde
    medicalHistory: "",
    medications: "",
    injuries: "",
    surgeries: "",
    allergies: "",
    
    // Nutrição
    dietRestrictions: "",
    mealsPerDay: "",
    waterIntake: "",
    supplements: "",
    
    // Observações
    observations: "",
    
    // Medidas Corporais (novo)
    weight: "",
    height: "",
    bodyFat: "",
    muscleMass: "",
    neck: "",
    chest: "",
    waist: "",
    hip: "",
    rightArm: "",
    leftArm: "",
    rightThigh: "",
    leftThigh: "",
    rightCalf: "",
    leftCalf: "",
    measureNotes: "",
  });

  const utils = trpc.useUtils();
  
  const { data: student, isLoading: studentLoading } = trpc.students.get.useQuery(
    { id: studentId },
    { enabled: studentId > 0 }
  );

  const { data: anamnesis, isLoading: anamnesisLoading } = trpc.anamnesis.get.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  // Buscar última medida para preencher campos se existir
  const { data: measurements } = trpc.measurements.list.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const saveMutation = trpc.anamnesis.saveWithMeasurements.useMutation({
    onSuccess: () => {
      toast.success("Anamnese e medidas salvas com sucesso!");
      utils.anamnesis.get.invalidate({ studentId });
      utils.measurements.list.invalidate({ studentId });
      setLocation(`/alunos/${studentId}`);
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  // Cálculos automáticos
  const calculateIMC = (weight: string, height: string): string => {
    const w = parseFloat(weight);
    const h = parseFloat(height) / 100;
    if (w > 0 && h > 0) {
      return (w / (h * h)).toFixed(1);
    }
    return '';
  };

  const getIMCClassification = (imc: string): { label: string; color: string } => {
    const value = parseFloat(imc);
    if (!value) return { label: '', color: '' };
    if (value < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-500' };
    if (value < 25) return { label: 'Peso normal', color: 'text-green-500' };
    if (value < 30) return { label: 'Sobrepeso', color: 'text-yellow-500' };
    if (value < 35) return { label: 'Obesidade I', color: 'text-orange-500' };
    if (value < 40) return { label: 'Obesidade II', color: 'text-red-500' };
    return { label: 'Obesidade III', color: 'text-red-700' };
  };

  // Fórmula da Marinha dos EUA para BF estimado
  const calculateEstimatedBF = (gender: string, waist: string, neck: string, hip: string, height: string): string => {
    const w = parseFloat(waist);
    const n = parseFloat(neck);
    const h = parseFloat(height);
    const hp = parseFloat(hip);
    
    if (gender === 'male' && w > 0 && n > 0 && h > 0) {
      const bf = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
      return Math.max(0, bf).toFixed(1);
    } else if (gender === 'female' && w > 0 && n > 0 && h > 0 && hp > 0) {
      const bf = 495 / (1.29579 - 0.35004 * Math.log10(w + hp - n) + 0.22100 * Math.log10(h)) - 450;
      return Math.max(0, bf).toFixed(1);
    }
    return '';
  };

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

  // Valores calculados
  const calculatedIMC = calculateIMC(formData.weight, formData.height);
  const imcClassification = getIMCClassification(calculatedIMC);
  const calculatedBF = calculateEstimatedBF(
    student?.gender || 'male',
    formData.waist,
    formData.neck,
    formData.hip,
    formData.height
  );
  const usedBF = formData.bodyFat || calculatedBF;
  const calculatedFatMass = calculateFatMass(formData.weight, usedBF);
  const calculatedLeanMass = calculateLeanMass(formData.weight, usedBF);

  useEffect(() => {
    if (anamnesis) {
      setFormData(prev => ({
        ...prev,
        occupation: anamnesis.occupation || "",
        lifestyle: anamnesis.lifestyle || "",
        sleepHours: anamnesis.sleepHours?.toString() || "",
        stressLevel: anamnesis.stressLevel || "",
        mainGoal: anamnesis.mainGoal || "",
        secondaryGoals: anamnesis.secondaryGoals || "",
        targetWeight: anamnesis.targetWeight?.toString() || "",
        exerciseExperience: anamnesis.exerciseExperience || "",
        medicalHistory: anamnesis.medicalHistory || "",
        medications: anamnesis.medications || "",
        injuries: anamnesis.injuries || "",
        surgeries: anamnesis.surgeries || "",
        allergies: anamnesis.allergies || "",
        dietRestrictions: anamnesis.dietRestrictions || "",
        mealsPerDay: anamnesis.mealsPerDay?.toString() || "",
        waterIntake: anamnesis.waterIntake?.toString() || "",
        supplements: anamnesis.supplements || "",
        observations: anamnesis.observations || "",
      }));
    }
  }, [anamnesis]);

  // Preencher medidas com a última medida se existir
  useEffect(() => {
    if (measurements && measurements.length > 0) {
      const lastMeasure = measurements[0];
      setFormData(prev => ({
        ...prev,
        weight: lastMeasure.weight || "",
        height: lastMeasure.height || "",
        bodyFat: lastMeasure.bodyFat || "",
        muscleMass: lastMeasure.muscleMass || "",
        neck: lastMeasure.neck || "",
        chest: lastMeasure.chest || "",
        waist: lastMeasure.waist || "",
        hip: lastMeasure.hip || "",
        rightArm: lastMeasure.rightArm || "",
        leftArm: lastMeasure.leftArm || "",
        rightThigh: lastMeasure.rightThigh || "",
        leftThigh: lastMeasure.leftThigh || "",
        rightCalf: lastMeasure.rightCalf || "",
        leftCalf: lastMeasure.leftCalf || "",
      }));
    }
  }, [measurements]);

  const handleSave = () => {
    const data = {
      studentId,
      // Anamnese
      occupation: formData.occupation || undefined,
      lifestyle: (formData.lifestyle || undefined) as "sedentary" | "light" | "moderate" | "active" | "very_active" | undefined,
      sleepHours: formData.sleepHours ? parseInt(formData.sleepHours) : undefined,
      stressLevel: (formData.stressLevel || undefined) as "low" | "moderate" | "high" | "very_high" | undefined,
      mainGoal: (formData.mainGoal || undefined) as "weight_loss" | "muscle_gain" | "conditioning" | "health" | "rehabilitation" | "sports" | "other" | undefined,
      secondaryGoals: formData.secondaryGoals || undefined,
      targetWeight: formData.targetWeight || undefined,
      exerciseExperience: (formData.exerciseExperience || undefined) as "none" | "beginner" | "intermediate" | "advanced" | undefined,
      medicalHistory: formData.medicalHistory || undefined,
      medications: formData.medications || undefined,
      injuries: formData.injuries || undefined,
      surgeries: formData.surgeries || undefined,
      allergies: formData.allergies || undefined,
      dietRestrictions: formData.dietRestrictions || undefined,
      mealsPerDay: formData.mealsPerDay ? parseInt(formData.mealsPerDay) : undefined,
      waterIntake: formData.waterIntake || undefined,
      supplements: formData.supplements || undefined,
      observations: formData.observations || undefined,
      // Medidas corporais
      measurements: {
        weight: formData.weight || undefined,
        height: formData.height || undefined,
        bodyFat: formData.bodyFat || undefined,
        muscleMass: formData.muscleMass || undefined,
        neck: formData.neck || undefined,
        chest: formData.chest || undefined,
        waist: formData.waist || undefined,
        hip: formData.hip || undefined,
        rightArm: formData.rightArm || undefined,
        leftArm: formData.leftArm || undefined,
        rightThigh: formData.rightThigh || undefined,
        leftThigh: formData.leftThigh || undefined,
        rightCalf: formData.rightCalf || undefined,
        leftCalf: formData.leftCalf || undefined,
        notes: formData.measureNotes || undefined,
      },
    };

    saveMutation.mutate(data);
  };

  const isLoading = studentLoading || anamnesisLoading;
  const isSaving = saveMutation.isPending;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[600px] w-full" />
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
              <h1 className="text-2xl font-bold tracking-tight">
                {anamnesis ? 'Editar Anamnese' : 'Nova Anamnese'}
              </h1>
              <p className="text-muted-foreground">
                {student.name}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        {/* Form Tabs */}
        <Tabs defaultValue="measurements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="measurements" className="gap-2">
              <Scale className="h-4 w-4 hidden sm:block" />
              Medidas
            </TabsTrigger>
            <TabsTrigger value="lifestyle" className="gap-2">
              <User className="h-4 w-4 hidden sm:block" />
              Estilo de Vida
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="h-4 w-4 hidden sm:block" />
              Objetivos
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <Heart className="h-4 w-4 hidden sm:block" />
              Saúde
            </TabsTrigger>
            <TabsTrigger value="nutrition" className="gap-2">
              <Utensils className="h-4 w-4 hidden sm:block" />
              Nutrição
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2">
              <Activity className="h-4 w-4 hidden sm:block" />
              Observações
            </TabsTrigger>
          </TabsList>

          {/* Medidas Corporais (Nova aba) */}
          <TabsContent value="measurements">
            <div className="space-y-6">
              {/* Card de Composição Corporal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Composição Corporal
                  </CardTitle>
                  <CardDescription>
                    Registre as medidas básicas do aluno. O BF estimado é calculado automaticamente.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Peso (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 75.5"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Altura (cm)</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 175"
                        value={formData.height}
                        onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>% Gordura (manual)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 18.5"
                        value={formData.bodyFat}
                        onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Massa Muscular (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 35.0"
                        value={formData.muscleMass}
                        onChange={(e) => setFormData({ ...formData, muscleMass: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Cálculos Automáticos */}
                  {(calculatedIMC || calculatedBF) && (
                    <Card className="bg-emerald-50 border-emerald-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          Cálculos Automáticos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          {calculatedIMC && (
                            <div>
                              <p className={`text-2xl font-bold ${imcClassification.color}`}>{calculatedIMC}</p>
                              <p className="text-xs text-muted-foreground">IMC</p>
                              <p className={`text-xs ${imcClassification.color}`}>{imcClassification.label}</p>
                            </div>
                          )}
                          {calculatedBF && !formData.bodyFat && (
                            <div>
                              <p className="text-2xl font-bold text-blue-500">{calculatedBF}%</p>
                              <p className="text-xs text-muted-foreground">BF Estimado</p>
                              <p className="text-xs text-blue-500">Fórmula Marinha EUA</p>
                            </div>
                          )}
                          {calculatedFatMass && (
                            <div>
                              <p className="text-2xl font-bold text-orange-500">{calculatedFatMass}</p>
                              <p className="text-xs text-muted-foreground">kg</p>
                              <p className="text-xs text-orange-500">Massa Gorda Est.</p>
                            </div>
                          )}
                          {calculatedLeanMass && (
                            <div>
                              <p className="text-2xl font-bold text-green-500">{calculatedLeanMass}</p>
                              <p className="text-xs text-muted-foreground">kg</p>
                              <p className="text-xs text-green-500">Massa Magra Est.</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                          * BF estimado requer: altura, pescoço, cintura{student?.gender === 'female' ? ', quadril' : ''}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>

              {/* Card de Circunferências */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ruler className="h-5 w-5" />
                    Circunferências (cm)
                  </CardTitle>
                  <CardDescription>
                    Medidas de circunferência corporal para acompanhamento da evolução
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Pescoço</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 38.5"
                        value={formData.neck}
                        onChange={(e) => setFormData({ ...formData, neck: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Peito</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 100.0"
                        value={formData.chest}
                        onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cintura</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 85.0"
                        value={formData.waist}
                        onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Quadril</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 95.0"
                        value={formData.hip}
                        onChange={(e) => setFormData({ ...formData, hip: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Braço Direito</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 35.0"
                        value={formData.rightArm}
                        onChange={(e) => setFormData({ ...formData, rightArm: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Braço Esquerdo</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 34.5"
                        value={formData.leftArm}
                        onChange={(e) => setFormData({ ...formData, leftArm: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Coxa Direita</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 55.0"
                        value={formData.rightThigh}
                        onChange={(e) => setFormData({ ...formData, rightThigh: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Coxa Esquerda</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 54.5"
                        value={formData.leftThigh}
                        onChange={(e) => setFormData({ ...formData, leftThigh: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Panturrilha Direita</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 38.0"
                        value={formData.rightCalf}
                        onChange={(e) => setFormData({ ...formData, rightCalf: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Panturrilha Esquerda</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Ex: 37.5"
                        value={formData.leftCalf}
                        onChange={(e) => setFormData({ ...formData, leftCalf: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações sobre as medidas</Label>
                    <Textarea
                      placeholder="Anotações sobre a medição..."
                      value={formData.measureNotes}
                      onChange={(e) => setFormData({ ...formData, measureNotes: e.target.value })}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Estilo de Vida */}
          <TabsContent value="lifestyle">
            <Card>
              <CardHeader>
                <CardTitle>Estilo de Vida</CardTitle>
                <CardDescription>Informações sobre rotina e hábitos do aluno</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Ocupação/Profissão</Label>
                    <Input
                      placeholder="Ex: Analista de sistemas"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nível de Atividade</Label>
                    <Select
                      value={formData.lifestyle}
                      onValueChange={(value) => setFormData({ ...formData, lifestyle: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentário</SelectItem>
                        <SelectItem value="light">Levemente ativo</SelectItem>
                        <SelectItem value="moderate">Moderadamente ativo</SelectItem>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="very_active">Muito ativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Horas de Sono (média)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 7"
                      value={formData.sleepHours}
                      onChange={(e) => setFormData({ ...formData, sleepHours: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nível de Estresse</Label>
                    <Select
                      value={formData.stressLevel}
                      onValueChange={(value) => setFormData({ ...formData, stressLevel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixo</SelectItem>
                        <SelectItem value="moderate">Moderado</SelectItem>
                        <SelectItem value="high">Alto</SelectItem>
                        <SelectItem value="very_high">Muito alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Objetivos */}
          <TabsContent value="goals">
            <Card>
              <CardHeader>
                <CardTitle>Objetivos</CardTitle>
                <CardDescription>Metas e experiência com exercícios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Objetivo Principal</Label>
                    <Select
                      value={formData.mainGoal}
                      onValueChange={(value) => setFormData({ ...formData, mainGoal: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight_loss">Perda de peso</SelectItem>
                        <SelectItem value="muscle_gain">Ganho de massa muscular</SelectItem>
                        <SelectItem value="strength">Aumento de força</SelectItem>
                        <SelectItem value="endurance">Resistência/Condicionamento</SelectItem>
                        <SelectItem value="flexibility">Flexibilidade</SelectItem>
                        <SelectItem value="health">Saúde geral</SelectItem>
                        <SelectItem value="sports">Performance esportiva</SelectItem>
                        <SelectItem value="rehabilitation">Reabilitação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Peso Alvo (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 75.5"
                      value={formData.targetWeight}
                      onChange={(e) => setFormData({ ...formData, targetWeight: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Objetivos Secundários</Label>
                  <Textarea
                    placeholder="Descreva outros objetivos..."
                    value={formData.secondaryGoals}
                    onChange={(e) => setFormData({ ...formData, secondaryGoals: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Experiência com Exercícios</Label>
                  <Select
                    value={formData.exerciseExperience}
                    onValueChange={(value) => setFormData({ ...formData, exerciseExperience: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="beginner">Iniciante (menos de 6 meses)</SelectItem>
                      <SelectItem value="intermediate">Intermediário (6 meses a 2 anos)</SelectItem>
                      <SelectItem value="advanced">Avançado (mais de 2 anos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Saúde */}
          <TabsContent value="health">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Informações de Saúde
                </CardTitle>
                <CardDescription>Histórico médico e condições de saúde</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Histórico Médico</Label>
                  <Textarea
                    placeholder="Ex: Hipertensão, diabetes, asma..."
                    value={formData.medicalHistory}
                    onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Medicamentos em Uso</Label>
                  <Textarea
                    placeholder="Liste os medicamentos que utiliza..."
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Lesões (atuais ou passadas)</Label>
                    <Textarea
                      placeholder="Ex: Lesão no joelho em 2020..."
                      value={formData.injuries}
                      onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cirurgias</Label>
                    <Textarea
                      placeholder="Ex: Apendicectomia em 2015..."
                      value={formData.surgeries}
                      onChange={(e) => setFormData({ ...formData, surgeries: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Alergias</Label>
                  <Input
                    placeholder="Ex: Penicilina, látex..."
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Nutrição */}
          <TabsContent value="nutrition">
            <Card>
              <CardHeader>
                <CardTitle>Nutrição</CardTitle>
                <CardDescription>Hábitos alimentares e suplementação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Refeições por Dia</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 4"
                      value={formData.mealsPerDay}
                      onChange={(e) => setFormData({ ...formData, mealsPerDay: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Consumo de Água (litros/dia)</Label>
                    <Input
                      type="number"
                      step="0.5"
                      placeholder="Ex: 2.5"
                      value={formData.waterIntake}
                      onChange={(e) => setFormData({ ...formData, waterIntake: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Restrições Alimentares</Label>
                  <Textarea
                    placeholder="Ex: Vegetariano, intolerância à lactose..."
                    value={formData.dietRestrictions}
                    onChange={(e) => setFormData({ ...formData, dietRestrictions: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Suplementos em Uso</Label>
                  <Textarea
                    placeholder="Ex: Whey protein, creatina, vitamina D..."
                    value={formData.supplements}
                    onChange={(e) => setFormData({ ...formData, supplements: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Observações */}
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Observações Gerais</CardTitle>
                <CardDescription>Informações adicionais importantes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Adicione qualquer informação relevante sobre o aluno..."
                    className="min-h-[200px]"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer with Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Salvando..." : "Salvar Anamnese e Medidas"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
