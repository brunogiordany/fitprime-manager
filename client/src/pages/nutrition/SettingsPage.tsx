import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Settings, 
  ArrowLeft,
  Loader2,
  Save,
  Calculator,
  Utensils,
  Bell,
  Database
} from "lucide-react";

export default function NutritionSettingsPage() {
  const [, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // Cálculos
    defaultBmrFormula: "mifflin_st_jeor" as "mifflin_st_jeor" | "harris_benedict" | "katch_mcardle" | "cunningham",
    defaultActivityMultiplier: "1.55",
    defaultProteinPercentage: 25,
    defaultCarbsPercentage: 50,
    defaultFatPercentage: 25,
    
    // Proteína por objetivo
    proteinPerKgWeightLoss: "1.8",
    proteinPerKgMuscleGain: "2.0",
    proteinPerKgMaintenance: "1.6",
    
    // Calorias
    defaultCaloricDeficit: 500,
    defaultCaloricSurplus: 300,
    
    // Refeições
    defaultMealsPerDay: 5,
    
    // Treino
    trainingDayCaloriesBonus: 200,
    trainingDayCarbsBonus: 50,
    
    // Exibição
    showMicronutrients: false,
    showGlycemicIndex: false,
    preferredFoodDatabase: "both" as "taco" | "usda" | "both",
    
    // Notificações
    sendMealReminders: true,
    sendWeeklyReport: false,
  });

  // Queries
  const { data: settings, isLoading } = trpc.nutrition.settings.get.useQuery();

  // Carregar configurações existentes
  useEffect(() => {
    if (settings) {
      setFormData({
        defaultBmrFormula: settings.defaultBmrFormula || "mifflin_st_jeor",
        defaultActivityMultiplier: settings.defaultActivityMultiplier || "1.55",
        defaultProteinPercentage: settings.defaultProteinPercentage || 25,
        defaultCarbsPercentage: settings.defaultCarbsPercentage || 50,
        defaultFatPercentage: settings.defaultFatPercentage || 25,
        proteinPerKgWeightLoss: settings.proteinPerKgWeightLoss || "1.8",
        proteinPerKgMuscleGain: settings.proteinPerKgMuscleGain || "2.0",
        proteinPerKgMaintenance: settings.proteinPerKgMaintenance || "1.6",
        defaultCaloricDeficit: settings.defaultCaloricDeficit || 500,
        defaultCaloricSurplus: settings.defaultCaloricSurplus || 300,
        defaultMealsPerDay: settings.defaultMealsPerDay || 5,
        trainingDayCaloriesBonus: settings.trainingDayCaloriesBonus || 200,
        trainingDayCarbsBonus: settings.trainingDayCarbsBonus || 50,
        showMicronutrients: settings.showMicronutrients ?? false,
        showGlycemicIndex: settings.showGlycemicIndex ?? false,
        preferredFoodDatabase: settings.preferredFoodDatabase || "both",
        sendMealReminders: settings.sendMealReminders ?? true,
        sendWeeklyReport: settings.sendWeeklyReport ?? false,
      });
    }
  }, [settings]);

  // Mutations
  const saveSettings = trpc.nutrition.settings.save.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
      setIsSaving(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao salvar configurações");
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    setIsSaving(true);
    saveSettings.mutate({
      defaultBmrFormula: formData.defaultBmrFormula,
      defaultActivityMultiplier: formData.defaultActivityMultiplier,
      defaultProteinPercentage: formData.defaultProteinPercentage,
      defaultCarbsPercentage: formData.defaultCarbsPercentage,
      defaultFatPercentage: formData.defaultFatPercentage,
      proteinPerKgWeightLoss: formData.proteinPerKgWeightLoss,
      proteinPerKgMuscleGain: formData.proteinPerKgMuscleGain,
      proteinPerKgMaintenance: formData.proteinPerKgMaintenance,
      defaultCaloricDeficit: formData.defaultCaloricDeficit,
      defaultCaloricSurplus: formData.defaultCaloricSurplus,
      defaultMealsPerDay: formData.defaultMealsPerDay,
      trainingDayCaloriesBonus: formData.trainingDayCaloriesBonus,
      trainingDayCarbsBonus: formData.trainingDayCarbsBonus,
      showMicronutrients: formData.showMicronutrients,
      showGlycemicIndex: formData.showGlycemicIndex,
      preferredFoodDatabase: formData.preferredFoodDatabase,
      sendMealReminders: formData.sendMealReminders,
      sendWeeklyReport: formData.sendWeeklyReport,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
            <Button variant="ghost" size="icon" onClick={() => setLocation("/nutrition")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6 text-gray-600" />
                Configurações de Nutrição
              </h1>
              <p className="text-muted-foreground">
                Personalize o módulo FitPrime Nutrition
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cálculos Nutricionais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                Cálculos Nutricionais
              </CardTitle>
              <CardDescription>
                Configurações padrão para cálculos de macros e calorias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fórmula de TMB padrão</Label>
                <Select 
                  value={formData.defaultBmrFormula} 
                  onValueChange={(v: "mifflin_st_jeor" | "harris_benedict" | "katch_mcardle" | "cunningham") => setFormData({ ...formData, defaultBmrFormula: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mifflin_st_jeor">Mifflin-St Jeor</SelectItem>
                    <SelectItem value="harris_benedict">Harris-Benedict</SelectItem>
                    <SelectItem value="katch_mcardle">Katch-McArdle</SelectItem>
                    <SelectItem value="cunningham">Cunningham</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fator de atividade padrão</Label>
                <Select 
                  value={formData.defaultActivityMultiplier} 
                  onValueChange={(v) => setFormData({ ...formData, defaultActivityMultiplier: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1.2">Sedentário (1.2)</SelectItem>
                    <SelectItem value="1.375">Levemente ativo (1.375)</SelectItem>
                    <SelectItem value="1.55">Moderadamente ativo (1.55)</SelectItem>
                    <SelectItem value="1.725">Muito ativo (1.725)</SelectItem>
                    <SelectItem value="1.9">Extremamente ativo (1.9)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Proteína (%)</Label>
                  <Input
                    type="number"
                    value={formData.defaultProteinPercentage}
                    onChange={(e) => setFormData({ ...formData, defaultProteinPercentage: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Carboidratos (%)</Label>
                  <Input
                    type="number"
                    value={formData.defaultCarbsPercentage}
                    onChange={(e) => setFormData({ ...formData, defaultCarbsPercentage: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gorduras (%)</Label>
                  <Input
                    type="number"
                    value={formData.defaultFatPercentage}
                    onChange={(e) => setFormData({ ...formData, defaultFatPercentage: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proteína por Objetivo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-red-600" />
                Proteína por Objetivo
              </CardTitle>
              <CardDescription>
                Gramas de proteína por kg de peso corporal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Perda de peso (g/kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.proteinPerKgWeightLoss}
                  onChange={(e) => setFormData({ ...formData, proteinPerKgWeightLoss: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Ganho muscular (g/kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.proteinPerKgMuscleGain}
                  onChange={(e) => setFormData({ ...formData, proteinPerKgMuscleGain: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Manutenção (g/kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.proteinPerKgMaintenance}
                  onChange={(e) => setFormData({ ...formData, proteinPerKgMaintenance: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ajustes Calóricos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5 text-emerald-600" />
                Ajustes Calóricos
              </CardTitle>
              <CardDescription>
                Déficit e superávit calórico padrão
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Déficit calórico (kcal)</Label>
                  <Input
                    type="number"
                    value={formData.defaultCaloricDeficit}
                    onChange={(e) => setFormData({ ...formData, defaultCaloricDeficit: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Superávit calórico (kcal)</Label>
                  <Input
                    type="number"
                    value={formData.defaultCaloricSurplus}
                    onChange={(e) => setFormData({ ...formData, defaultCaloricSurplus: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Refeições por dia</Label>
                <Select 
                  value={formData.defaultMealsPerDay.toString()} 
                  onValueChange={(v) => setFormData({ ...formData, defaultMealsPerDay: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 refeições</SelectItem>
                    <SelectItem value="4">4 refeições</SelectItem>
                    <SelectItem value="5">5 refeições</SelectItem>
                    <SelectItem value="6">6 refeições</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bônus dia de treino (kcal)</Label>
                  <Input
                    type="number"
                    value={formData.trainingDayCaloriesBonus}
                    onChange={(e) => setFormData({ ...formData, trainingDayCaloriesBonus: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bônus carbs treino (g)</Label>
                  <Input
                    type="number"
                    value={formData.trainingDayCarbsBonus}
                    onChange={(e) => setFormData({ ...formData, trainingDayCarbsBonus: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banco de Dados */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                Banco de Alimentos
              </CardTitle>
              <CardDescription>
                Preferências de exibição e banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Banco de dados preferido</Label>
                <Select 
                  value={formData.preferredFoodDatabase} 
                  onValueChange={(v: "taco" | "usda" | "both") => setFormData({ ...formData, preferredFoodDatabase: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="taco">TACO (Brasil)</SelectItem>
                    <SelectItem value="usda">USDA (EUA)</SelectItem>
                    <SelectItem value="both">Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar micronutrientes</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir vitaminas e minerais
                  </p>
                </div>
                <Switch
                  checked={formData.showMicronutrients}
                  onCheckedChange={(v) => setFormData({ ...formData, showMicronutrients: v })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mostrar índice glicêmico</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir IG dos alimentos
                  </p>
                </div>
                <Switch
                  checked={formData.showGlycemicIndex}
                  onCheckedChange={(v) => setFormData({ ...formData, showGlycemicIndex: v })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-yellow-600" />
                Notificações
              </CardTitle>
              <CardDescription>
                Lembretes e relatórios automáticos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lembretes de refeição</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar lembretes para pacientes
                    </p>
                  </div>
                  <Switch
                    checked={formData.sendMealReminders}
                    onCheckedChange={(v) => setFormData({ ...formData, sendMealReminders: v })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Relatório semanal</Label>
                    <p className="text-sm text-muted-foreground">
                      Enviar resumo semanal de adesão
                    </p>
                  </div>
                  <Switch
                    checked={formData.sendWeeklyReport}
                    onCheckedChange={(v) => setFormData({ ...formData, sendWeeklyReport: v })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
