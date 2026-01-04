import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { 
  Apple, 
  Users, 
  ClipboardList, 
  UtensilsCrossed,
  ChefHat,
  Activity,
  TrendingUp,
  FileText,
  TestTube,
  BookOpen,
  Settings,
  Loader2,
  Shield,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from "lucide-react";

// Módulos do FitPrime Nutrition
const nutritionModules = [
  {
    id: "patients",
    title: "Pacientes",
    description: "Gerencie seus pacientes de nutrição (integrado com alunos)",
    icon: Users,
    path: "/nutrition/pacientes",
    color: "from-blue-500 to-blue-600",
    available: true,
  },
  {
    id: "meal-plans",
    title: "Planos Alimentares",
    description: "Crie e gerencie planos alimentares personalizados",
    icon: ClipboardList,
    path: "/nutrition/planos-alimentares",
    color: "from-emerald-500 to-teal-600",
    available: true,
  },
  {
    id: "foods",
    title: "Alimentos",
    description: "Banco de dados com +10.000 alimentos (TACO, USDA)",
    icon: Apple,
    path: "/nutrition/alimentos",
    color: "from-green-500 to-green-600",
    available: true,
  },
  {
    id: "recipes",
    title: "Receitas",
    description: "Biblioteca de receitas com cálculo nutricional automático",
    icon: ChefHat,
    path: "/nutrition/receitas",
    color: "from-orange-500 to-orange-600",
    available: true,
  },
  {
    id: "assessment",
    title: "Avaliação Nutricional",
    description: "Antropometria, composição corporal e indicadores",
    icon: Activity,
    path: "/nutrition/avaliacao",
    color: "from-purple-500 to-purple-600",
    available: true,
  },
  {
    id: "evolution",
    title: "Evolução",
    description: "Acompanhe a evolução nutricional dos pacientes",
    icon: TrendingUp,
    path: "/nutrition/evolucao",
    color: "from-cyan-500 to-cyan-600",
    available: true,
  },
  {
    id: "anamnesis",
    title: "Anamnese Nutricional",
    description: "Questionário complementar para dados nutricionais",
    icon: FileText,
    path: "/nutrition/anamnese",
    color: "from-indigo-500 to-indigo-600",
    available: true,
  },
  {
    id: "exams",
    title: "Exames",
    description: "Registro e acompanhamento de exames laboratoriais",
    icon: TestTube,
    path: "/nutrition/exames",
    color: "from-red-500 to-red-600",
    available: true,
  },
  {
    id: "guidelines",
    title: "Orientações",
    description: "Biblioteca de orientações nutricionais para pacientes",
    icon: BookOpen,
    path: "/nutrition/orientacoes",
    color: "from-amber-500 to-amber-600",
    available: true,
  },
  {
    id: "settings",
    title: "Configurações",
    description: "Configurações do módulo de nutrição",
    icon: Settings,
    path: "/nutrition/configuracoes",
    color: "from-gray-500 to-gray-600",
    available: true,
  },
];

export default function NutritionDashboard() {
  const [, setLocation] = useLocation();
  
  // Verificar se a feature está habilitada
  const { data: featureFlags, isLoading: loadingFlags } = trpc.personal.featureFlags.useQuery();
  
  // Buscar estatísticas do módulo de nutrição
  const { data: stats } = trpc.nutrition.dashboard.stats.useQuery();
  
  // Tela de carregamento
  if (loadingFlags) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  // Tela de bloqueio quando feature não está habilitada
  if (!featureFlags?.nutritionBetaEnabled) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full w-fit mb-4">
                <Shield className="h-12 w-12 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">Funcionalidade em Beta</CardTitle>
              <CardDescription className="text-base mt-2">
                O FitPrime Nutrition está em fase de testes e ainda não está disponível para uso.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Esta funcionalidade precisa ser liberada pelo administrador do sistema.
                  Quando estiver disponível, você poderá criar planos alimentares, 
                  acompanhar a evolução nutricional dos seus alunos e muito mais.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Em breve disponível</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Apple className="h-7 w-7 text-green-600" />
              FitPrime Nutrition
              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-400 bg-amber-50">
                BETA
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              Módulo completo de nutrição integrado ao FitPrime Manager
            </p>
          </div>
        </div>

        {/* Banner de Integração */}
        <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                <Sparkles className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-emerald-700 dark:text-emerald-400">
                  Integração Treino + Nutrição
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  O FitPrime Nutrition é totalmente integrado com os dados de treino. 
                  Os macros são ajustados automaticamente baseados no treino do dia, 
                  as medidas são compartilhadas entre os módulos e você tem uma visão 
                  completa da evolução do seu aluno.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nutritionModules.map((module) => (
            <Card 
              key={module.id}
              className={`cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                !module.available ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => module.available && setLocation(module.path)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${module.color}`}>
                    <module.icon className="h-5 w-5 text-white" />
                  </div>
                  {!module.available && (
                    <Badge variant="secondary" className="text-xs">
                      Em breve
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{module.title}</CardTitle>
                <CardDescription className="text-sm">
                  {module.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between group"
                  disabled={!module.available}
                >
                  <span>Acessar</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Planos Criados</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalPlans || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Planos Ativos</CardDescription>
              <CardTitle className="text-3xl">{stats?.activePlans || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Receitas Cadastradas</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalRecipes || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Avaliações</CardDescription>
              <CardTitle className="text-3xl">{stats?.totalAssessments || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
