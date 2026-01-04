import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  FileText, 
  ArrowLeft,
  Loader2,
  User,
  Save,
  AlertTriangle,
  Apple,
  Utensils,
  Clock,
  Heart,
  DollarSign,
  ChefHat,
  Target
} from "lucide-react";

export default function AnamnesisPage() {
  const [, setLocation] = useLocation();
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Histórico alimentar
    dietHistory: "",
    eatingDisorderHistory: false,
    eatingDisorderDetails: "",
    // Hábitos alimentares
    mealsPerDay: 5,
    eatingSpeed: "" as "" | "very_fast" | "fast" | "normal" | "slow" | "very_slow",
    chewingQuality: "" as "" | "poor" | "fair" | "good" | "excellent",
    screenWhileEating: false,
    // Preferências
    foodCravings: "",
    // Líquidos
    waterIntakeLiters: "",
    alcoholConsumption: "" as "" | "none" | "occasional" | "moderate" | "frequent",
    // Sintomas GI
    bowelFrequency: "",
    // Apetite
    appetiteLevel: "" as "" | "very_low" | "low" | "normal" | "high" | "very_high",
    emotionalEating: false,
    emotionalEatingTriggers: "",
    // Cozinha
    cookingSkills: "" as "" | "none" | "basic" | "intermediate" | "advanced",
    cookingFrequency: "" as "" | "never" | "rarely" | "sometimes" | "often" | "always",
    mealPrepTime: 30,
    // Orçamento
    monthlyFoodBudget: "",
    budgetPriority: "" as "" | "very_limited" | "limited" | "moderate" | "flexible" | "unlimited",
    // Rotina
    eatingOutFrequency: "" as "" | "never" | "rarely" | "weekly" | "often" | "daily",
    deliveryFrequency: "" as "" | "never" | "rarely" | "weekly" | "often" | "daily",
    // Objetivos
    expectedResults: "",
    timeline: "",
    // Observações
    additionalNotes: "",
  });

  // Arrays
  const [favoritesFoods, setFavoritesFoods] = useState<string[]>([]);
  const [dislikedFoods, setDislikedFoods] = useState<string[]>([]);
  const [foodIntolerances, setFoodIntolerances] = useState<string[]>([]);
  const [foodAllergies, setFoodAllergies] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [currentSupplements, setCurrentSupplements] = useState<string[]>([]);
  const [digestiveIssues, setDigestiveIssues] = useState<string[]>([]);
  const [nutritionGoals, setNutritionGoals] = useState<string[]>([]);

  // Pegar paciente da URL se existir
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const pacienteId = urlParams.get("paciente");
    if (pacienteId) {
      setSelectedStudent(parseInt(pacienteId));
    }
  }, []);

  // Queries
  const { data: students } = trpc.students.list.useQuery({});

  const { data: anamnesis, isLoading } = trpc.nutrition.anamnesis.get.useQuery(
    { studentId: selectedStudent || 0 },
    { enabled: !!selectedStudent }
  );

  // Carregar dados existentes
  useEffect(() => {
    if (anamnesis) {
      setFormData({
        dietHistory: anamnesis.dietHistory || "",
        eatingDisorderHistory: anamnesis.eatingDisorderHistory || false,
        eatingDisorderDetails: anamnesis.eatingDisorderDetails || "",
        mealsPerDay: anamnesis.mealsPerDay || 5,
        eatingSpeed: (anamnesis.eatingSpeed as any) || "",
        chewingQuality: (anamnesis.chewingQuality as any) || "",
        screenWhileEating: anamnesis.screenWhileEating || false,
        foodCravings: anamnesis.foodCravings || "",
        waterIntakeLiters: anamnesis.waterIntakeLiters || "",
        alcoholConsumption: (anamnesis.alcoholConsumption as any) || "",
        bowelFrequency: anamnesis.bowelFrequency || "",
        appetiteLevel: (anamnesis.appetiteLevel as any) || "",
        emotionalEating: anamnesis.emotionalEating || false,
        emotionalEatingTriggers: anamnesis.emotionalEatingTriggers || "",
        cookingSkills: (anamnesis.cookingSkills as any) || "",
        cookingFrequency: (anamnesis.cookingFrequency as any) || "",
        mealPrepTime: anamnesis.mealPrepTime || 30,
        monthlyFoodBudget: anamnesis.monthlyFoodBudget || "",
        budgetPriority: (anamnesis.budgetPriority as any) || "",
        eatingOutFrequency: (anamnesis.eatingOutFrequency as any) || "",
        deliveryFrequency: (anamnesis.deliveryFrequency as any) || "",
        expectedResults: anamnesis.expectedResults || "",
        timeline: anamnesis.timeline || "",
        additionalNotes: anamnesis.additionalNotes || "",
      });
      
      // Parse JSON arrays
      try {
        setFavoritesFoods(anamnesis.favoritesFoods ? JSON.parse(anamnesis.favoritesFoods) : []);
        setDislikedFoods(anamnesis.dislikedFoods ? JSON.parse(anamnesis.dislikedFoods) : []);
        setFoodIntolerances(anamnesis.foodIntolerances ? JSON.parse(anamnesis.foodIntolerances) : []);
        setFoodAllergies(anamnesis.foodAllergies ? JSON.parse(anamnesis.foodAllergies) : []);
        setDietaryRestrictions(anamnesis.dietaryRestrictions ? JSON.parse(anamnesis.dietaryRestrictions) : []);
        setCurrentSupplements(anamnesis.currentSupplements ? JSON.parse(anamnesis.currentSupplements) : []);
        setDigestiveIssues(anamnesis.digestiveIssues ? JSON.parse(anamnesis.digestiveIssues) : []);
        setNutritionGoals(anamnesis.nutritionGoals ? JSON.parse(anamnesis.nutritionGoals) : []);
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, [anamnesis]);

  // Mutations
  const saveAnamnesis = trpc.nutrition.anamnesis.upsert.useMutation({
    onSuccess: () => {
      toast.success("Anamnese salva com sucesso!");
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar anamnese");
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    if (!selectedStudent) {
      toast.error("Selecione um paciente");
      return;
    }

    setIsSaving(true);
    saveAnamnesis.mutate({
      studentId: selectedStudent,
      dietHistory: formData.dietHistory || undefined,
      eatingDisorderHistory: formData.eatingDisorderHistory,
      eatingDisorderDetails: formData.eatingDisorderDetails || undefined,
      mealsPerDay: formData.mealsPerDay,
      eatingSpeed: formData.eatingSpeed || undefined,
      chewingQuality: formData.chewingQuality || undefined,
      screenWhileEating: formData.screenWhileEating,
      foodCravings: formData.foodCravings || undefined,
      waterIntakeLiters: formData.waterIntakeLiters || undefined,
      alcoholConsumption: formData.alcoholConsumption || undefined,
      bowelFrequency: formData.bowelFrequency || undefined,
      appetiteLevel: formData.appetiteLevel || undefined,
      emotionalEating: formData.emotionalEating,
      emotionalEatingTriggers: formData.emotionalEatingTriggers || undefined,
      cookingSkills: formData.cookingSkills || undefined,
      cookingFrequency: formData.cookingFrequency || undefined,
      mealPrepTime: formData.mealPrepTime,
      monthlyFoodBudget: formData.monthlyFoodBudget || undefined,
      budgetPriority: formData.budgetPriority || undefined,
      eatingOutFrequency: formData.eatingOutFrequency || undefined,
      deliveryFrequency: formData.deliveryFrequency || undefined,
      expectedResults: formData.expectedResults || undefined,
      timeline: formData.timeline || undefined,
      additionalNotes: formData.additionalNotes || undefined,
      favoritesFoods: favoritesFoods.length ? favoritesFoods : undefined,
      dislikedFoods: dislikedFoods.length ? dislikedFoods : undefined,
      foodIntolerances: foodIntolerances.length ? foodIntolerances : undefined,
      foodAllergies: foodAllergies.length ? foodAllergies : undefined,
      dietaryRestrictions: dietaryRestrictions.length ? dietaryRestrictions : undefined,
      currentSupplements: currentSupplements.length ? currentSupplements : undefined,
      digestiveIssues: digestiveIssues.length ? digestiveIssues : undefined,
      nutritionGoals: nutritionGoals.length ? nutritionGoals : undefined,
    });
  };

  const toggleArrayItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    if (arr.includes(item)) {
      setArr(arr.filter(i => i !== item));
    } else {
      setArr([...arr, item]);
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
                <FileText className="h-6 w-6 text-blue-600" />
                Anamnese Nutricional
              </h1>
              <p className="text-muted-foreground">
                Informações complementares para acompanhamento nutricional
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving || !selectedStudent}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Anamnese
          </Button>
        </div>

        {/* Seleção de Paciente */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="min-w-fit">Paciente:</Label>
              <Select 
                value={selectedStudent?.toString() || ""} 
                onValueChange={(v) => setSelectedStudent(v ? parseInt(v) : null)}
              >
                <SelectTrigger className="max-w-xs">
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
          </CardContent>
        </Card>

        {!selectedStudent ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">
                  Selecione um paciente para preencher a anamnese nutricional
                </p>
              </div>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hábitos Alimentares */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="h-5 w-5 text-emerald-600" />
                  Hábitos Alimentares
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Refeições por dia</Label>
                  <Input
                    type="number"
                    value={formData.mealsPerDay}
                    onChange={(e) => setFormData({ ...formData, mealsPerDay: parseInt(e.target.value) || 5 })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Velocidade ao comer</Label>
                  <Select 
                    value={formData.eatingSpeed} 
                    onValueChange={(v: any) => setFormData({ ...formData, eatingSpeed: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_slow">Muito devagar</SelectItem>
                      <SelectItem value="slow">Devagar</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Rápido</SelectItem>
                      <SelectItem value="very_fast">Muito rápido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Qualidade da mastigação</Label>
                  <Select 
                    value={formData.chewingQuality} 
                    onValueChange={(v: any) => setFormData({ ...formData, chewingQuality: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poor">Ruim</SelectItem>
                      <SelectItem value="fair">Regular</SelectItem>
                      <SelectItem value="good">Boa</SelectItem>
                      <SelectItem value="excellent">Excelente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="screenWhileEating"
                    checked={formData.screenWhileEating}
                    onCheckedChange={(v) => setFormData({ ...formData, screenWhileEating: !!v })}
                  />
                  <label htmlFor="screenWhileEating" className="text-sm">
                    Usa telas durante as refeições
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>Consumo de água (litros/dia)</Label>
                  <Input
                    value={formData.waterIntakeLiters}
                    onChange={(e) => setFormData({ ...formData, waterIntakeLiters: e.target.value })}
                    placeholder="Ex: 2.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Consumo de álcool</Label>
                  <Select 
                    value={formData.alcoholConsumption} 
                    onValueChange={(v: any) => setFormData({ ...formData, alcoholConsumption: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="occasional">Ocasional</SelectItem>
                      <SelectItem value="moderate">Moderado</SelectItem>
                      <SelectItem value="frequent">Frequente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Preferências e Restrições */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Apple className="h-5 w-5 text-red-600" />
                  Preferências e Restrições
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Desejos alimentares</Label>
                  <Textarea
                    value={formData.foodCravings}
                    onChange={(e) => setFormData({ ...formData, foodCravings: e.target.value })}
                    placeholder="Alimentos que sente vontade frequente..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    Alergias alimentares
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Amendoim", "Frutos do mar", "Leite", "Ovos", "Soja", "Trigo", "Nozes"].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`allergy-${item}`}
                          checked={foodAllergies.includes(item)}
                          onCheckedChange={() => toggleArrayItem(foodAllergies, setFoodAllergies, item)}
                        />
                        <label htmlFor={`allergy-${item}`} className="text-sm">{item}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Intolerâncias</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Lactose", "Glúten", "Frutose", "FODMAP"].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`intolerance-${item}`}
                          checked={foodIntolerances.includes(item)}
                          onCheckedChange={() => toggleArrayItem(foodIntolerances, setFoodIntolerances, item)}
                        />
                        <label htmlFor={`intolerance-${item}`} className="text-sm">{item}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Restrições dietéticas</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Vegetariano", "Vegano", "Sem glúten", "Low carb", "Kosher", "Halal"].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`restriction-${item}`}
                          checked={dietaryRestrictions.includes(item)}
                          onCheckedChange={() => toggleArrayItem(dietaryRestrictions, setDietaryRestrictions, item)}
                        />
                        <label htmlFor={`restriction-${item}`} className="text-sm">{item}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Saúde Digestiva */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-pink-600" />
                  Saúde Digestiva e Apetite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Problemas digestivos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Azia", "Refluxo", "Gases", "Inchaço", "Constipação", "Diarreia"].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`digestive-${item}`}
                          checked={digestiveIssues.includes(item)}
                          onCheckedChange={() => toggleArrayItem(digestiveIssues, setDigestiveIssues, item)}
                        />
                        <label htmlFor={`digestive-${item}`} className="text-sm">{item}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Frequência intestinal</Label>
                  <Input
                    value={formData.bowelFrequency}
                    onChange={(e) => setFormData({ ...formData, bowelFrequency: e.target.value })}
                    placeholder="Ex: 1x ao dia"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Nível de apetite</Label>
                  <Select 
                    value={formData.appetiteLevel} 
                    onValueChange={(v: any) => setFormData({ ...formData, appetiteLevel: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_low">Muito baixo</SelectItem>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                      <SelectItem value="very_high">Muito alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="emotionalEating"
                    checked={formData.emotionalEating}
                    onCheckedChange={(v) => setFormData({ ...formData, emotionalEating: !!v })}
                  />
                  <label htmlFor="emotionalEating" className="text-sm">
                    Come por razões emocionais
                  </label>
                </div>

                {formData.emotionalEating && (
                  <div className="space-y-2">
                    <Label>Gatilhos emocionais</Label>
                    <Textarea
                      value={formData.emotionalEatingTriggers}
                      onChange={(e) => setFormData({ ...formData, emotionalEatingTriggers: e.target.value })}
                      placeholder="O que te leva a comer emocionalmente..."
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cozinha e Rotina */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-orange-600" />
                  Cozinha e Rotina
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Habilidades culinárias</Label>
                  <Select 
                    value={formData.cookingSkills} 
                    onValueChange={(v: any) => setFormData({ ...formData, cookingSkills: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não cozinha</SelectItem>
                      <SelectItem value="basic">Básico</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Frequência que cozinha</Label>
                  <Select 
                    value={formData.cookingFrequency} 
                    onValueChange={(v: any) => setFormData({ ...formData, cookingFrequency: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="never">Nunca</SelectItem>
                      <SelectItem value="rarely">Raramente</SelectItem>
                      <SelectItem value="sometimes">Às vezes</SelectItem>
                      <SelectItem value="often">Frequentemente</SelectItem>
                      <SelectItem value="always">Sempre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tempo disponível para preparar refeições (min)</Label>
                  <Input
                    type="number"
                    value={formData.mealPrepTime}
                    onChange={(e) => setFormData({ ...formData, mealPrepTime: parseInt(e.target.value) || 30 })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frequência de comer fora</Label>
                    <Select 
                      value={formData.eatingOutFrequency} 
                      onValueChange={(v: any) => setFormData({ ...formData, eatingOutFrequency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Nunca</SelectItem>
                        <SelectItem value="rarely">Raramente</SelectItem>
                        <SelectItem value="weekly">Semanalmente</SelectItem>
                        <SelectItem value="often">Frequentemente</SelectItem>
                        <SelectItem value="daily">Diariamente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Frequência de delivery</Label>
                    <Select 
                      value={formData.deliveryFrequency} 
                      onValueChange={(v: any) => setFormData({ ...formData, deliveryFrequency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Nunca</SelectItem>
                        <SelectItem value="rarely">Raramente</SelectItem>
                        <SelectItem value="weekly">Semanalmente</SelectItem>
                        <SelectItem value="often">Frequentemente</SelectItem>
                        <SelectItem value="daily">Diariamente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Orçamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Orçamento mensal para alimentação</Label>
                  <Input
                    value={formData.monthlyFoodBudget}
                    onChange={(e) => setFormData({ ...formData, monthlyFoodBudget: e.target.value })}
                    placeholder="Ex: R$ 1.500"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Flexibilidade do orçamento</Label>
                  <Select 
                    value={formData.budgetPriority} 
                    onValueChange={(v: any) => setFormData({ ...formData, budgetPriority: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_limited">Muito limitado</SelectItem>
                      <SelectItem value="limited">Limitado</SelectItem>
                      <SelectItem value="moderate">Moderado</SelectItem>
                      <SelectItem value="flexible">Flexível</SelectItem>
                      <SelectItem value="unlimited">Sem limite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Objetivos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Objetivos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Objetivos nutricionais</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Perder peso", "Ganhar massa", "Mais energia", "Melhorar saúde", "Performance", "Qualidade de vida"].map((item) => (
                      <div key={item} className="flex items-center space-x-2">
                        <Checkbox
                          id={`goal-${item}`}
                          checked={nutritionGoals.includes(item)}
                          onCheckedChange={() => toggleArrayItem(nutritionGoals, setNutritionGoals, item)}
                        />
                        <label htmlFor={`goal-${item}`} className="text-sm">{item}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Resultados esperados</Label>
                  <Textarea
                    value={formData.expectedResults}
                    onChange={(e) => setFormData({ ...formData, expectedResults: e.target.value })}
                    placeholder="O que espera alcançar..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prazo desejado</Label>
                  <Input
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    placeholder="Ex: 3 meses"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Observações Adicionais</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  placeholder="Outras informações relevantes..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
