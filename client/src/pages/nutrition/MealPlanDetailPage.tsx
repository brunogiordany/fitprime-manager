import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { 
  ArrowLeft,
  Loader2,
  ClipboardList,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Plus,
  Calendar,
  Clock,
  Utensils,
  Sparkles,
  Edit,
  Trash2,
  Copy,
  Download,
  Share2,
  ChevronRight,
  Apple,
  Coffee,
  Sun,
  Moon
} from "lucide-react";

export default function MealPlanDetailPage() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const planId = parseInt(params.id || "0");
  const [isGenerating, setIsGenerating] = useState(false);

  // Buscar dados do plano
  const { data: plan, isLoading, refetch } = trpc.nutrition.mealPlans.get.useQuery(
    { id: planId },
    { enabled: !!planId }
  );

  // Mutation para gerar plano com IA
  const generateWithAI = trpc.nutrition.mealPlans.generateWithAI.useMutation({
    onSuccess: () => {
      toast.success("Plano gerado com sucesso!");
      refetch();
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao gerar plano");
      setIsGenerating(false);
    },
  });

  const handleGenerateWithAI = () => {
    if (!plan?.studentId) {
      toast.error("Plano sem paciente associado");
      return;
    }
    setIsGenerating(true);
    generateWithAI.mutate({ 
      studentId: plan.studentId,
      objective: (plan.objective as any) || 'health',
      targetCalories: plan.targetCalories || undefined,
      mealsPerDay: 5,
    });
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case "breakfast":
        return <Coffee className="h-4 w-4" />;
      case "morning_snack":
        return <Apple className="h-4 w-4" />;
      case "lunch":
        return <Sun className="h-4 w-4" />;
      case "afternoon_snack":
        return <Apple className="h-4 w-4" />;
      case "dinner":
        return <Moon className="h-4 w-4" />;
      case "supper":
        return <Moon className="h-4 w-4" />;
      default:
        return <Utensils className="h-4 w-4" />;
    }
  };

  const getMealLabel = (mealType: string) => {
    const labels: Record<string, string> = {
      breakfast: "Café da Manhã",
      morning_snack: "Lanche da Manhã",
      lunch: "Almoço",
      afternoon_snack: "Lanche da Tarde",
      dinner: "Jantar",
      supper: "Ceia",
      pre_workout: "Pré-Treino",
      post_workout: "Pós-Treino",
    };
    return labels[mealType] || mealType;
  };

  const getDayLabel = (dayNumber: number) => {
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return days[dayNumber % 7] || `Dia ${dayNumber}`;
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

  if (!plan) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <ClipboardList className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-2 text-muted-foreground">Plano alimentar não encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/nutrition/planos-alimentares")}>
            Voltar para Planos
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
            <Button variant="ghost" size="icon" onClick={() => setLocation("/nutrition/planos-alimentares")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{plan.name}</h1>
                <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                  {plan.status === "active" ? "Ativo" : 
                   plan.status === "draft" ? "Rascunho" : 
                   plan.status === "completed" ? "Concluído" : plan.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {plan.description || "Plano alimentar personalizado"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={() => toast.info("Funcionalidade em desenvolvimento")}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartilhar
            </Button>
            <Button 
              onClick={handleGenerateWithAI}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              Gerar com IA
            </Button>
          </div>
        </div>

        {/* Macros Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                Calorias Diárias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{plan.targetCalories || "-"}</p>
              <p className="text-sm text-muted-foreground">kcal/dia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Beef className="h-4 w-4 text-red-500" />
                Proteínas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{plan.targetProtein || "-"}</p>
              <p className="text-sm text-muted-foreground">g/dia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Wheat className="h-4 w-4 text-amber-500" />
                Carboidratos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{plan.targetCarbs || "-"}</p>
              <p className="text-sm text-muted-foreground">g/dia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-yellow-500" />
                Gorduras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{plan.targetFat || "-"}</p>
              <p className="text-sm text-muted-foreground">g/dia</p>
            </CardContent>
          </Card>
        </div>

        {/* Dias do Plano */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Plano Semanal
            </CardTitle>
            <CardDescription>
              Refeições organizadas por dia da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!plan.days?.length ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Nenhuma refeição adicionada ainda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Use o botão "Gerar com IA" para criar um plano personalizado
                </p>
                <Button 
                  className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600"
                  onClick={handleGenerateWithAI}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Gerar Plano com IA
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="0" className="w-full">
                <TabsList className="grid grid-cols-7 w-full">
                  {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                    <TabsTrigger key={day} value={day.toString()}>
                      {getDayLabel(day).slice(0, 3)}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {[0, 1, 2, 3, 4, 5, 6].map((dayNumber) => {
                  const dayData = plan.days?.find((d: any) => d.dayOfWeek === dayNumber);
                  
                  return (
                    <TabsContent key={dayNumber} value={dayNumber.toString()} className="mt-4">
                      {!dayData?.meals?.length ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">Nenhuma refeição para este dia</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {dayData.meals.map((meal: any, index: number) => (
                            <Card key={index} className="border-l-4 border-l-emerald-500">
                              <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    {getMealIcon(meal.mealType)}
                                    {getMealLabel(meal.mealType)}
                                    {meal.time && (
                                      <Badge variant="outline" className="ml-2">
                                        <Clock className="h-3 w-3 mr-1" />
                                        {meal.time}
                                      </Badge>
                                    )}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Flame className="h-3 w-3 text-orange-500" />
                                    {meal.totalCalories || "-"} kcal
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                {meal.items?.length ? (
                                  <div className="space-y-2">
                                    {meal.items.map((item: any, itemIndex: number) => (
                                      <div 
                                        key={itemIndex}
                                        className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                                      >
                                        <div>
                                          <p className="font-medium">{item.foodName || item.recipeName}</p>
                                          <p className="text-sm text-muted-foreground">
                                            {item.quantity} {item.unit}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                          <span className="text-orange-600">{item.calories || "-"} kcal</span>
                                          <span className="text-red-600">{item.protein || "-"}g P</span>
                                          <span className="text-amber-600">{item.carbs || "-"}g C</span>
                                          <span className="text-yellow-600">{item.fat || "-"}g G</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    {meal.notes || "Sem itens adicionados"}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        {plan.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{plan.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
