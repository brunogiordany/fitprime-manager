import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  User, 
  Heart, 
  Target, 
  Activity,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Dumbbell
} from "lucide-react";
import { toast } from "sonner";

interface StudentOnboardingProps {
  studentId: number;
  studentName: string;
  onComplete: () => void;
}

const steps = [
  { id: 1, title: "Dados Pessoais", icon: User },
  { id: 2, title: "Saúde", icon: Heart },
  { id: 3, title: "Objetivos", icon: Target },
  { id: 4, title: "Estilo de Vida", icon: Activity },
];

export default function StudentOnboarding({ studentId, studentName, onComplete }: StudentOnboardingProps) {
  // Restaurar dados do localStorage se existirem
  const getInitialFormData = () => {
    const saved = localStorage.getItem('onboardingFormDraft');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Erro ao restaurar dados do onboarding:', e);
      }
    }
    return {
      // Dados pessoais
      birthDate: "",
      gender: "",
      height: "",
      weight: "",
      // Circunferências
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
      // Saúde
      healthConditions: "",
      medications: "",
      injuries: "",
      allergies: "",
      // Objetivos
      mainGoal: "",
      secondaryGoals: "",
      targetWeight: "",
      timeline: "",
      // Estilo de vida
      occupation: "",
      sleepHours: "",
      stressLevel: "",
      exerciseFrequency: "",
      dietDescription: "",
    };
  };

  const getInitialStep = () => {
    const saved = localStorage.getItem('onboardingCurrentStep');
    if (saved) {
      const step = parseInt(saved, 10);
      if (step >= 1 && step <= 4) return step;
    }
    return 1;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep);
  const [formData, setFormData] = useState(getInitialFormData);

  // Salvar dados no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('onboardingFormDraft', JSON.stringify(formData));
  }, [formData]);

  // Salvar step atual no localStorage
  useEffect(() => {
    localStorage.setItem('onboardingCurrentStep', currentStep.toString());
  }, [currentStep]);

  const utils = trpc.useUtils();

  const saveAnamneseMutation = trpc.studentPortal.saveWithMeasurements.useMutation({
    onSuccess: () => {
      // Limpar dados salvos no localStorage após sucesso
      localStorage.removeItem('onboardingFormDraft');
      localStorage.removeItem('onboardingCurrentStep');
      toast.success("Perfil completado com sucesso!");
      onComplete();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar dados");
    },
  });

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Usa o endpoint studentPortal.saveWithMeasurements que usa studentProcedure
    saveAnamneseMutation.mutate({
      occupation: formData.occupation || undefined,
      sleepHours: formData.sleepHours ? parseInt(formData.sleepHours) : undefined,
      stressLevel: formData.stressLevel as any || undefined,
      medicalHistory: formData.healthConditions || undefined,
      medications: formData.medications || undefined,
      injuries: formData.injuries || undefined,
      allergies: formData.allergies || undefined,
      mainGoal: formData.mainGoal as any || undefined,
      secondaryGoals: formData.secondaryGoals || undefined,
      targetWeight: formData.targetWeight || undefined,
      observations: formData.dietDescription || undefined,
      measurements: {
        weight: formData.weight || undefined,
        height: formData.height || undefined,
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
      },
    });
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
            <Dumbbell className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo, {studentName}!</CardTitle>
          <CardDescription>
            Complete seu perfil para que seu personal possa criar treinos personalizados para você
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Progresso do perfil</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center gap-1 ${
                    isActive ? "text-emerald-600" : isCompleted ? "text-emerald-500" : "text-gray-400"
                  }`}
                >
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center ${
                      isActive
                        ? "bg-emerald-100 border-2 border-emerald-500"
                        : isCompleted
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className="text-xs font-medium hidden sm:block">{step.title}</span>
                </div>
              );
            })}
          </div>

          {/* Step content */}
          <div className="min-h-[300px]">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Dados Pessoais e Medidas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birthDate">Data de Nascimento</Label>
                    <Input
                      id="birthDate"
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => updateField("birthDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gênero</Label>
                    <Select value={formData.gender} onValueChange={(v) => updateField("gender", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">Altura (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="Ex: 175"
                      value={formData.height}
                      onChange={(e) => updateField("height", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso atual (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="Ex: 75.5"
                      value={formData.weight}
                      onChange={(e) => updateField("weight", e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Circunferências */}
                <div className="pt-4 border-t">
                  <h4 className="text-md font-medium mb-3 text-emerald-700">Circunferências (cm) - Opcional</h4>
                  <p className="text-sm text-gray-500 mb-3">Essas medidas ajudam a calcular seu percentual de gordura corporal</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="neck" className="text-sm">Pescoço</Label>
                      <Input
                        id="neck"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 38"
                        value={formData.neck}
                        onChange={(e) => updateField("neck", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="chest" className="text-sm">Peito</Label>
                      <Input
                        id="chest"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 100"
                        value={formData.chest}
                        onChange={(e) => updateField("chest", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="waist" className="text-sm">Cintura</Label>
                      <Input
                        id="waist"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 85"
                        value={formData.waist}
                        onChange={(e) => updateField("waist", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="hip" className="text-sm">Quadril</Label>
                      <Input
                        id="hip"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 100"
                        value={formData.hip}
                        onChange={(e) => updateField("hip", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rightArm" className="text-sm">Braço D</Label>
                      <Input
                        id="rightArm"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 35"
                        value={formData.rightArm}
                        onChange={(e) => updateField("rightArm", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="leftArm" className="text-sm">Braço E</Label>
                      <Input
                        id="leftArm"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 35"
                        value={formData.leftArm}
                        onChange={(e) => updateField("leftArm", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rightThigh" className="text-sm">Coxa D</Label>
                      <Input
                        id="rightThigh"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 55"
                        value={formData.rightThigh}
                        onChange={(e) => updateField("rightThigh", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="leftThigh" className="text-sm">Coxa E</Label>
                      <Input
                        id="leftThigh"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 55"
                        value={formData.leftThigh}
                        onChange={(e) => updateField("leftThigh", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="rightCalf" className="text-sm">Panturrilha D</Label>
                      <Input
                        id="rightCalf"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 38"
                        value={formData.rightCalf}
                        onChange={(e) => updateField("rightCalf", e.target.value)}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="leftCalf" className="text-sm">Panturrilha E</Label>
                      <Input
                        id="leftCalf"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 38"
                        value={formData.leftCalf}
                        onChange={(e) => updateField("leftCalf", e.target.value)}
                        className="h-9"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações de Saúde</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="healthConditions">Condições de saúde</Label>
                    <Textarea
                      id="healthConditions"
                      placeholder="Ex: Hipertensão, diabetes, asma..."
                      value={formData.healthConditions}
                      onChange={(e) => updateField("healthConditions", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medications">Medicamentos em uso</Label>
                    <Textarea
                      id="medications"
                      placeholder="Liste os medicamentos que você toma regularmente..."
                      value={formData.medications}
                      onChange={(e) => updateField("medications", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="injuries">Lesões ou limitações</Label>
                    <Textarea
                      id="injuries"
                      placeholder="Ex: Dor no joelho, hérnia de disco..."
                      value={formData.injuries}
                      onChange={(e) => updateField("injuries", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Alergias</Label>
                    <Input
                      id="allergies"
                      placeholder="Ex: Lactose, glúten..."
                      value={formData.allergies}
                      onChange={(e) => updateField("allergies", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Seus Objetivos</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mainGoal">Objetivo principal</Label>
                    <Select value={formData.mainGoal} onValueChange={(v) => updateField("mainGoal", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione seu objetivo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight_loss">Perder peso</SelectItem>
                        <SelectItem value="muscle_gain">Ganhar massa muscular</SelectItem>
                        <SelectItem value="conditioning">Melhorar condicionamento</SelectItem>
                        <SelectItem value="health">Melhorar saúde geral</SelectItem>
                        <SelectItem value="flexibility">Ganhar flexibilidade</SelectItem>
                        <SelectItem value="strength">Aumentar força</SelectItem>
                        <SelectItem value="other">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryGoals">Objetivos secundários</Label>
                    <Textarea
                      id="secondaryGoals"
                      placeholder="Outros objetivos que você gostaria de alcançar..."
                      value={formData.secondaryGoals}
                      onChange={(e) => updateField("secondaryGoals", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetWeight">Peso desejado (kg)</Label>
                      <Input
                        id="targetWeight"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 70"
                        value={formData.targetWeight}
                        onChange={(e) => updateField("targetWeight", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeline">Prazo desejado</Label>
                      <Select value={formData.timeline} onValueChange={(v) => updateField("timeline", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1_month">1 mês</SelectItem>
                          <SelectItem value="3_months">3 meses</SelectItem>
                          <SelectItem value="6_months">6 meses</SelectItem>
                          <SelectItem value="1_year">1 ano</SelectItem>
                          <SelectItem value="no_rush">Sem pressa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Estilo de Vida</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Ocupação</Label>
                    <Input
                      id="occupation"
                      placeholder="Ex: Desenvolvedor, Professor..."
                      value={formData.occupation}
                      onChange={(e) => updateField("occupation", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sleepHours">Horas de sono por noite</Label>
                      <Select value={formData.sleepHours} onValueChange={(v) => updateField("sleepHours", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">Menos de 5h</SelectItem>
                          <SelectItem value="5">5-6h</SelectItem>
                          <SelectItem value="7">7-8h</SelectItem>
                          <SelectItem value="9">Mais de 8h</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stressLevel">Nível de estresse</Label>
                      <Select value={formData.stressLevel} onValueChange={(v) => updateField("stressLevel", v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixo</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="high">Alto</SelectItem>
                          <SelectItem value="very_high">Muito alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exerciseFrequency">Frequência de exercícios atual</Label>
                    <Select value={formData.exerciseFrequency} onValueChange={(v) => updateField("exerciseFrequency", v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não pratico</SelectItem>
                        <SelectItem value="1_2">1-2x por semana</SelectItem>
                        <SelectItem value="3_4">3-4x por semana</SelectItem>
                        <SelectItem value="5_plus">5+ vezes por semana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dietDescription">Como é sua alimentação?</Label>
                    <Textarea
                      id="dietDescription"
                      placeholder="Descreva seus hábitos alimentares..."
                      value={formData.dietDescription}
                      onChange={(e) => updateField("dietDescription", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              onClick={handleNext}
              disabled={saveAnamneseMutation.isPending}
            >
              {saveAnamneseMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : currentStep === steps.length ? (
                <>
                  Finalizar
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>

          {/* Skip option */}
          <div className="text-center">
            <Button variant="ghost" size="sm" onClick={onComplete} className="text-gray-500">
              Pular por agora e completar depois
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
