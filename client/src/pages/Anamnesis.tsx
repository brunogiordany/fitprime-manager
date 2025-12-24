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

  const saveMutation = trpc.anamnesis.save.useMutation({
    onSuccess: () => {
      toast.success("Anamnese salva com sucesso!");
      utils.anamnesis.get.invalidate({ studentId });
      setLocation(`/alunos/${studentId}`);
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  useEffect(() => {
    if (anamnesis) {
      setFormData({
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
      });
    }
  }, [anamnesis]);

  const handleSave = () => {
    const data = {
      studentId,
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
        <Tabs defaultValue="lifestyle" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
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
            {isSaving ? "Salvando..." : "Salvar Anamnese"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
