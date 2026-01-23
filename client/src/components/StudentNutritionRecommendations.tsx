import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Flame, 
  Target, 
  Activity, 
  TrendingDown, 
  TrendingUp, 
  Scale,
  Heart,
  Dumbbell,
  Calculator,
  Info,
  Zap,
  Clock,
  ChevronRight,
  Sparkles,
  AlertCircle
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StudentNutritionRecommendationsProps {
  studentData: {
    id: number;
    name: string;
    gender?: string | null;
    goal?: string | null;
  };
  measurements?: {
    weight?: string | null;
    height?: string | null;
    bodyFat?: string | null;
  } | null;
  anamnesis?: {
    mainGoal?: string | null;
    targetWeight?: string | null;
    lifestyle?: string | null;
    weeklyFrequency?: number | null;
    sessionDuration?: number | null;
    doesCardio?: boolean | null;
  } | null;
}

// Fórmula de Mifflin-St Jeor para TMB (mais precisa que Harris-Benedict)
const calculateTMB = (weight: number, height: number, age: number, gender: string): number => {
  if (gender === 'female') {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
  return (10 * weight) + (6.25 * height) - (5 * age) + 5;
};

// Fatores de atividade para TDEE
const activityFactors: Record<string, { factor: number; label: string; description: string }> = {
  sedentary: { factor: 1.2, label: "Sedentário", description: "Pouco ou nenhum exercício" },
  light: { factor: 1.375, label: "Levemente ativo", description: "Exercício leve 1-3x/semana" },
  moderate: { factor: 1.55, label: "Moderadamente ativo", description: "Exercício moderado 3-5x/semana" },
  active: { factor: 1.725, label: "Muito ativo", description: "Exercício intenso 6-7x/semana" },
  very_active: { factor: 1.9, label: "Extremamente ativo", description: "Exercício muito intenso + trabalho físico" },
};

// Metas calóricas baseadas no objetivo
const goalCalorieAdjustments: Record<string, { adjustment: number; label: string; description: string }> = {
  weight_loss: { adjustment: -500, label: "Perda de peso", description: "Déficit de 500 kcal/dia (~0.5kg/semana)" },
  muscle_gain: { adjustment: 300, label: "Ganho de massa", description: "Superávit de 300 kcal/dia" },
  conditioning: { adjustment: 0, label: "Condicionamento", description: "Manutenção calórica" },
  health: { adjustment: 0, label: "Saúde geral", description: "Manutenção calórica" },
  rehabilitation: { adjustment: 0, label: "Reabilitação", description: "Manutenção calórica" },
  sports: { adjustment: 200, label: "Performance esportiva", description: "Leve superávit para energia" },
  other: { adjustment: 0, label: "Outro", description: "Manutenção calórica" },
};

// Tradução dos objetivos
const goalLabels: Record<string, string> = {
  weight_loss: "Perder peso",
  muscle_gain: "Ganhar massa muscular",
  conditioning: "Melhorar condicionamento",
  health: "Melhorar saúde geral",
  rehabilitation: "Reabilitação",
  sports: "Performance esportiva",
  other: "Outro",
};

export default function StudentNutritionRecommendations({ 
  studentData, 
  measurements, 
  anamnesis 
}: StudentNutritionRecommendationsProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  
  // Calcular idade estimada (assumindo 30 anos se não tiver data de nascimento)
  const estimatedAge = 30;
  
  // Extrair dados necessários
  const weight = measurements?.weight ? parseFloat(measurements.weight) : null;
  const height = measurements?.height ? parseFloat(measurements.height) : null;
  const gender = studentData.gender || 'male';
  const goal = anamnesis?.mainGoal || studentData.goal || 'health';
  const targetWeight = anamnesis?.targetWeight ? parseFloat(anamnesis.targetWeight) : null;
  const lifestyle = anamnesis?.lifestyle || 'moderate';
  const weeklyFrequency = anamnesis?.weeklyFrequency || 3;
  
  // Determinar nível de atividade baseado na frequência de treino
  const getActivityLevel = (): string => {
    if (anamnesis?.lifestyle) return anamnesis.lifestyle;
    if (weeklyFrequency <= 1) return 'sedentary';
    if (weeklyFrequency <= 2) return 'light';
    if (weeklyFrequency <= 4) return 'moderate';
    if (weeklyFrequency <= 6) return 'active';
    return 'very_active';
  };
  
  const activityLevel = getActivityLevel();
  
  // Cálculos
  const calculations = useMemo(() => {
    if (!weight || !height) return null;
    
    const tmb = calculateTMB(weight, height, estimatedAge, gender);
    const activityFactor = activityFactors[activityLevel]?.factor || 1.55;
    const tdee = tmb * activityFactor;
    const goalAdjustment = goalCalorieAdjustments[goal]?.adjustment || 0;
    const targetCalories = Math.round(tdee + goalAdjustment);
    
    // Calcular macros sugeridos
    // Proteína: 2g/kg para ganho de massa, 1.8g/kg para perda de peso, 1.6g/kg para manutenção
    const proteinPerKg = goal === 'muscle_gain' ? 2.0 : goal === 'weight_loss' ? 1.8 : 1.6;
    const proteinGrams = Math.round(weight * proteinPerKg);
    const proteinCalories = proteinGrams * 4;
    
    // Gordura: 25-30% das calorias
    const fatPercentage = goal === 'weight_loss' ? 0.25 : 0.30;
    const fatCalories = Math.round(targetCalories * fatPercentage);
    const fatGrams = Math.round(fatCalories / 9);
    
    // Carboidratos: restante das calorias
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbGrams = Math.round(carbCalories / 4);
    
    // Calcular déficit/superávit necessário para atingir peso meta
    let weightDifference = 0;
    let weeksToGoal = 0;
    let dailyDeficitNeeded = 0;
    
    if (targetWeight && targetWeight !== weight) {
      weightDifference = weight - targetWeight; // positivo = precisa perder
      // 1kg de gordura = ~7700 kcal
      const totalCalorieChange = weightDifference * 7700;
      // Déficit/superávit seguro: 500-750 kcal/dia
      const safeDeficit = weightDifference > 0 ? 500 : -300;
      dailyDeficitNeeded = safeDeficit;
      weeksToGoal = Math.abs(totalCalorieChange / (safeDeficit * 7));
    }
    
    // Calcular cardio sugerido para perda de peso
    let suggestedCardioMinutes = 0;
    let suggestedCardioSessions = 0;
    
    if (goal === 'weight_loss' && weightDifference > 0) {
      // Assumindo ~8-10 kcal/min de cardio moderado
      const extraDeficitNeeded = Math.max(0, Math.abs(dailyDeficitNeeded) - 500);
      if (extraDeficitNeeded > 0) {
        const weeklyCardioCalories = extraDeficitNeeded * 7;
        suggestedCardioMinutes = Math.round(weeklyCardioCalories / 8);
        suggestedCardioSessions = Math.ceil(suggestedCardioMinutes / 30);
      } else {
        // Cardio básico para saúde
        suggestedCardioMinutes = 150;
        suggestedCardioSessions = 3;
      }
    } else if (goal === 'conditioning' || goal === 'health') {
      suggestedCardioMinutes = 150;
      suggestedCardioSessions = 3;
    }
    
    return {
      tmb: Math.round(tmb),
      tdee: Math.round(tdee),
      targetCalories,
      goalAdjustment,
      macros: {
        protein: proteinGrams,
        carbs: carbGrams,
        fat: fatGrams,
        proteinPerKg,
      },
      weightGoal: {
        current: weight,
        target: targetWeight,
        difference: weightDifference,
        weeksToGoal: Math.round(weeksToGoal),
        dailyDeficit: dailyDeficitNeeded,
      },
      cardio: {
        weeklyMinutes: suggestedCardioMinutes,
        sessions: suggestedCardioSessions,
        minutesPerSession: suggestedCardioSessions > 0 ? Math.round(suggestedCardioMinutes / suggestedCardioSessions) : 0,
      },
      activityLevel,
      activityFactor,
    };
  }, [weight, height, gender, goal, targetWeight, activityLevel, estimatedAge]);
  
  if (!weight || !height) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Dados incompletos</h3>
          <p className="text-amber-600 text-sm">
            Para calcular suas recomendações nutricionais, precisamos do seu peso e altura.
            Atualize suas medidas na aba "Evolução".
          </p>
        </CardContent>
      </Card>
    );
  }
  
  if (!calculations) return null;
  
  return (
    <div className="space-y-4">
      {/* Header com resumo */}
      <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-800 premium:from-[#0d1520] premium:to-[#0a0f1a] premium:border-emerald-500/40 premium:shadow-[0_0_15px_rgba(0,255,136,0.15)]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-300 premium:text-[#00FF88]">
                <Sparkles className="h-5 w-5" />
                Suas Recomendações Personalizadas
              </CardTitle>
              <CardDescription className="text-emerald-600 dark:text-emerald-400 premium:text-emerald-400/80">
                Baseado no seu objetivo: {goalLabels[goal] || goal}
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-white border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-400 premium:bg-emerald-500/20 premium:border-emerald-500/50 premium:text-emerald-400">
              {activityFactors[calculations.activityLevel]?.label || 'Moderado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Cards de resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Meta Calórica */}
            <div className="bg-white dark:bg-gray-800 premium:bg-[#0d1520] rounded-xl p-4 shadow-sm border border-emerald-100 dark:border-emerald-800 premium:border-orange-500/40 premium:shadow-[0_0_10px_rgba(255,120,50,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30 premium:bg-orange-500/20">
                  <Flame className="h-4 w-4 text-orange-500 premium:text-orange-400" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 premium:text-gray-400">Meta Diária</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white premium:text-[#FF7832]">{calculations.targetCalories}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 premium:text-orange-400/70">kcal/dia</p>
            </div>
            
            {/* Proteína */}
            <div className="bg-white dark:bg-gray-800 premium:bg-[#0d1520] rounded-xl p-4 shadow-sm border border-emerald-100 dark:border-red-800 premium:border-red-500/40 premium:shadow-[0_0_10px_rgba(239,68,68,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 premium:bg-red-500/20">
                  <Dumbbell className="h-4 w-4 text-red-500 premium:text-red-400" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 premium:text-gray-400">Proteína</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white premium:text-red-400">{calculations.macros.protein}g</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 premium:text-red-400/70">{calculations.macros.proteinPerKg}g/kg</p>
            </div>
            
            {/* Carboidratos */}
            <div className="bg-white dark:bg-gray-800 premium:bg-[#0d1520] rounded-xl p-4 shadow-sm border border-emerald-100 dark:border-amber-800 premium:border-amber-500/40 premium:shadow-[0_0_10px_rgba(245,158,11,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 premium:bg-amber-500/20">
                  <Zap className="h-4 w-4 text-amber-500 premium:text-amber-400" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 premium:text-gray-400">Carboidratos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white premium:text-amber-400">{calculations.macros.carbs}g</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 premium:text-amber-400/70">energia</p>
            </div>
            
            {/* Gordura */}
            <div className="bg-white dark:bg-gray-800 premium:bg-[#0d1520] rounded-xl p-4 shadow-sm border border-emerald-100 dark:border-purple-800 premium:border-violet-500/40 premium:shadow-[0_0_10px_rgba(139,92,246,0.1)]">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 premium:bg-violet-500/20">
                  <Activity className="h-4 w-4 text-purple-500 premium:text-violet-400" />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400 premium:text-gray-400">Gorduras</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white premium:text-violet-400">{calculations.macros.fat}g</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 premium:text-violet-400/70">saudáveis</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Detalhes em abas */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="cardio">Cardio</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {/* Meta de peso */}
          {calculations.weightGoal.target && calculations.weightGoal.difference !== 0 && (
            <Card className="premium:bg-[#0d1520] premium:border-emerald-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-500" />
                  Meta de Peso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Atual</p>
                    <p className="text-xl font-bold">{calculations.weightGoal.current} kg</p>
                  </div>
                  <div className="flex-1 px-4">
                    <div className="flex items-center gap-2">
                      {calculations.weightGoal.difference > 0 ? (
                        <TrendingDown className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <TrendingUp className="h-5 w-5 text-blue-500" />
                      )}
                      <span className="text-sm font-medium">
                        {calculations.weightGoal.difference > 0 ? 'Perder' : 'Ganhar'}{' '}
                        {Math.abs(calculations.weightGoal.difference).toFixed(1)} kg
                      </span>
                    </div>
                    <Progress 
                      value={50} 
                      className="h-2 mt-2" 
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Meta</p>
                    <p className="text-xl font-bold text-emerald-600">{calculations.weightGoal.target} kg</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 premium:bg-[#0a0f1a] premium:border premium:border-emerald-500/20 rounded-lg p-3 text-sm">
                  <p className="text-gray-600 dark:text-gray-300 premium:text-gray-300">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Tempo estimado: <strong>{calculations.weightGoal.weeksToGoal} semanas</strong>
                    {' '}(~{Math.round(calculations.weightGoal.weeksToGoal / 4)} meses)
                  </p>
                  <p className="text-gray-500 dark:text-gray-400 premium:text-gray-400 text-xs mt-1">
                    Com um {calculations.weightGoal.difference > 0 ? 'déficit' : 'superávit'} de{' '}
                    {Math.abs(calculations.weightGoal.dailyDeficit)} kcal/dia de forma saudável
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Dicas baseadas no objetivo */}
          <Card className="premium:bg-[#0d1520] premium:border-emerald-500/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 premium:text-white">
                <Info className="h-4 w-4 text-blue-500 premium:text-[#00FF88]" />
                Dicas para {goalLabels[goal]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {goal === 'weight_loss' && (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 premium:bg-[#0a0f1a] premium:border premium:border-emerald-500/30 rounded-lg">
                      <ChevronRight className="h-4 w-4 text-emerald-500 premium:text-[#00FF88] mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 premium:text-gray-300">
                        <strong className="premium:text-[#00FF88]">Déficit moderado:</strong> Não reduza mais de 500-750 kcal/dia para preservar massa muscular
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 premium:bg-[#0a0f1a] premium:border premium:border-emerald-500/30 rounded-lg">
                      <ChevronRight className="h-4 w-4 text-emerald-500 premium:text-[#00FF88] mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 premium:text-gray-300">
                        <strong className="premium:text-[#00FF88]">Proteína alta:</strong> Consuma {calculations.macros.proteinPerKg}g/kg para manter músculos durante a dieta
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 premium:bg-[#0a0f1a] premium:border premium:border-emerald-500/30 rounded-lg">
                      <ChevronRight className="h-4 w-4 text-emerald-500 premium:text-[#00FF88] mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 premium:text-gray-300">
                        <strong className="premium:text-[#00FF88]">Cardio estratégico:</strong> Combine musculação com cardio para maximizar a queima de gordura
                      </p>
                    </div>
                  </>
                )}
                {goal === 'muscle_gain' && (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 premium:bg-[#0a0f1a] premium:border premium:border-emerald-500/30 rounded-lg">
                      <ChevronRight className="h-4 w-4 text-blue-500 premium:text-[#00FF88] mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 premium:text-gray-300">
                        <strong className="premium:text-[#00FF88]">Superávit controlado:</strong> +300 kcal/dia é suficiente para ganhar massa sem acumular gordura
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 premium:bg-[#0a0f1a] premium:border premium:border-emerald-500/30 rounded-lg">
                      <ChevronRight className="h-4 w-4 text-blue-500 premium:text-[#00FF88] mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 premium:text-gray-300">
                        <strong className="premium:text-[#00FF88]">Proteína distribuída:</strong> Divida os {calculations.macros.protein}g em 4-5 refeições ao longo do dia
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 premium:bg-[#0a0f1a] premium:border premium:border-emerald-500/30 rounded-lg">
                      <ChevronRight className="h-4 w-4 text-blue-500 premium:text-[#00FF88] mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 premium:text-gray-300">
                        <strong className="premium:text-[#00FF88]">Treino progressivo:</strong> Aumente cargas gradualmente para estimular hipertrofia
                      </p>
                    </div>
                  </>
                )}
                {(goal === 'conditioning' || goal === 'health') && (
                  <>
                    <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 premium:bg-[#0a0f1a] premium:border premium:border-emerald-500/30 rounded-lg">
                      <ChevronRight className="h-4 w-4 text-purple-500 premium:text-[#00FF88] mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 premium:text-gray-300">
                        <strong className="premium:text-[#00FF88]">Equilíbrio:</strong> Mantenha uma alimentação balanceada sem restrições extremas
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 premium:bg-[#0a0f1a] premium:border premium:border-emerald-500/30 rounded-lg">
                      <ChevronRight className="h-4 w-4 text-purple-500 premium:text-[#00FF88] mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 premium:text-gray-300">
                        <strong className="premium:text-[#00FF88]">Variedade:</strong> Combine treino de força com cardio para saúde cardiovascular
                      </p>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 premium:bg-[#0a0f1a] premium:border premium:border-emerald-500/30 rounded-lg">
                      <ChevronRight className="h-4 w-4 text-purple-500 premium:text-[#00FF88] mt-0.5" />
                      <p className="text-sm text-gray-700 dark:text-gray-300 premium:text-gray-300">
                        <strong className="premium:text-[#00FF88]">Consistência:</strong> Foque em criar hábitos sustentáveis a longo prazo
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cardio" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Recomendação de Cardio
              </CardTitle>
              <CardDescription>
                Baseado no seu objetivo de {goalLabels[goal]?.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calculations.cardio.weeklyMinutes > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-xl">
                      <p className="text-3xl font-bold text-red-600">{calculations.cardio.weeklyMinutes}</p>
                      <p className="text-sm text-gray-600">min/semana</p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-xl">
                      <p className="text-3xl font-bold text-orange-600">{calculations.cardio.sessions}x</p>
                      <p className="text-sm text-gray-600">sessões</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-xl">
                      <p className="text-3xl font-bold text-amber-600">{calculations.cardio.minutesPerSession}</p>
                      <p className="text-sm text-gray-600">min/sessão</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Sugestões de atividades:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Caminhada rápida
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Corrida leve
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Bicicleta
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Natação
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        HIIT
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                        Elíptico
                      </div>
                    </div>
                  </div>
                  
                  {goal === 'weight_loss' && (
                    <div className="bg-emerald-50 rounded-lg p-4 text-sm">
                      <p className="text-emerald-800">
                        <strong>💡 Dica:</strong> Para maximizar a queima de gordura, faça cardio em jejum 
                        ou após o treino de musculação. Mantenha a intensidade moderada (conseguir conversar).
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Heart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p>Cardio não é essencial para seu objetivo atual,</p>
                  <p className="text-sm">mas 150 min/semana é recomendado para saúde cardiovascular.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calculator className="h-4 w-4 text-gray-500" />
                Detalhes dos Cálculos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Taxa Metabólica Basal (TMB)</p>
                    <p className="text-xl font-bold">{calculations.tmb} kcal</p>
                    <p className="text-xs text-gray-400">Calorias em repouso</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Gasto Energético Total (TDEE)</p>
                    <p className="text-xl font-bold">{calculations.tdee} kcal</p>
                    <p className="text-xs text-gray-400">TMB × {calculations.activityFactor.toFixed(2)}</p>
                  </div>
                </div>
                
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Ajuste para objetivo ({goalLabels[goal]})</p>
                  <p className="text-xl font-bold">
                    {calculations.goalAdjustment > 0 ? '+' : ''}{calculations.goalAdjustment} kcal
                  </p>
                  <p className="text-xs text-gray-400">
                    {goalCalorieAdjustments[goal]?.description}
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2">Distribuição de Macros:</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Proteína</span>
                      <span className="text-sm font-medium">{calculations.macros.protein}g ({Math.round((calculations.macros.protein * 4 / calculations.targetCalories) * 100)}%)</span>
                    </div>
                    <Progress value={(calculations.macros.protein * 4 / calculations.targetCalories) * 100} className="h-2 bg-red-100" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Carboidratos</span>
                      <span className="text-sm font-medium">{calculations.macros.carbs}g ({Math.round((calculations.macros.carbs * 4 / calculations.targetCalories) * 100)}%)</span>
                    </div>
                    <Progress value={(calculations.macros.carbs * 4 / calculations.targetCalories) * 100} className="h-2 bg-amber-100" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Gorduras</span>
                      <span className="text-sm font-medium">{calculations.macros.fat}g ({Math.round((calculations.macros.fat * 9 / calculations.targetCalories) * 100)}%)</span>
                    </div>
                    <Progress value={(calculations.macros.fat * 9 / calculations.targetCalories) * 100} className="h-2 bg-purple-100" />
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 mt-4">
                  <p>* Cálculos baseados na fórmula de Mifflin-St Jeor</p>
                  <p>* Valores são estimativas e podem variar individualmente</p>
                  <p>* Consulte um nutricionista para um plano personalizado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
