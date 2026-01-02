import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Eye, 
  MousePointerClick,
  ArrowRight,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  Target,
  Percent,
  DollarSign,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PieChart,
  LineChart,
  LayoutDashboard,
  FileText,
  Settings,
  ChevronLeft
} from "lucide-react";
import { toast } from "sonner";

// Dados mockados para demonstração (serão substituídos por dados reais do backend)
const MOCK_FUNNEL_DATA = {
  pageViews: 12450,
  quizStarted: 3200,
  quizCompleted: 1850,
  pricingViewed: 1420,
  trialCreated: 380,
  checkoutStarted: 290,
  checkoutCompleted: 145,
  exitIntentShown: 2100,
  exitIntentConverted: 168,
};

const MOCK_PAGE_STATS = [
  { page: "/", name: "Landing Page", views: 8500, conversions: 1200, bounceRate: 35, avgTime: "2:45" },
  { page: "/quiz", name: "Quiz", views: 3200, conversions: 1850, bounceRate: 22, avgTime: "4:30" },
  { page: "/pricing", name: "Pricing", views: 1420, conversions: 290, bounceRate: 45, avgTime: "1:55" },
  { page: "/cadastro-trial", name: "Cadastro Trial", views: 520, conversions: 380, bounceRate: 18, avgTime: "3:20" },
  { page: "/checkout", name: "Checkout", views: 290, conversions: 145, bounceRate: 50, avgTime: "2:10" },
];

const MOCK_DAILY_DATA = [
  { date: "26/12", pageViews: 1200, conversions: 45 },
  { date: "27/12", pageViews: 1350, conversions: 52 },
  { date: "28/12", pageViews: 980, conversions: 38 },
  { date: "29/12", pageViews: 1100, conversions: 41 },
  { date: "30/12", pageViews: 1450, conversions: 58 },
  { date: "31/12", pageViews: 1680, conversions: 72 },
  { date: "01/01", pageViews: 1520, conversions: 65 },
];

export default function AdminAnalyticsDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState("7d");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  
  // Verificar se é admin
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!user || user.role !== "admin") {
    return <Redirect to="/dashboard" />;
  }

  // Calcular taxas de conversão
  const conversionRates = useMemo(() => ({
    quizStart: ((MOCK_FUNNEL_DATA.quizStarted / MOCK_FUNNEL_DATA.pageViews) * 100).toFixed(1),
    quizComplete: ((MOCK_FUNNEL_DATA.quizCompleted / MOCK_FUNNEL_DATA.quizStarted) * 100).toFixed(1),
    pricingView: ((MOCK_FUNNEL_DATA.pricingViewed / MOCK_FUNNEL_DATA.quizCompleted) * 100).toFixed(1),
    trialCreate: ((MOCK_FUNNEL_DATA.trialCreated / MOCK_FUNNEL_DATA.pricingViewed) * 100).toFixed(1),
    checkoutStart: ((MOCK_FUNNEL_DATA.checkoutStarted / MOCK_FUNNEL_DATA.pricingViewed) * 100).toFixed(1),
    checkoutComplete: ((MOCK_FUNNEL_DATA.checkoutCompleted / MOCK_FUNNEL_DATA.checkoutStarted) * 100).toFixed(1),
    exitIntentConvert: ((MOCK_FUNNEL_DATA.exitIntentConverted / MOCK_FUNNEL_DATA.exitIntentShown) * 100).toFixed(1),
    overallConversion: ((MOCK_FUNNEL_DATA.checkoutCompleted / MOCK_FUNNEL_DATA.pageViews) * 100).toFixed(2),
  }), []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Analytics Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">Métricas do funil de vendas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Filtro de período */}
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              
              {period === "custom" && (
                <div className="flex items-center gap-2">
                  <Input 
                    type="date" 
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="w-36"
                  />
                  <span className="text-muted-foreground">até</span>
                  <Input 
                    type="date" 
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="w-36"
                  />
                </div>
              )}
              
              <Button variant="outline" size="icon">
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* KPIs Principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Visitantes</p>
                  <p className="text-3xl font-bold">{MOCK_FUNNEL_DATA.pageViews.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-sm text-emerald-600">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>+12.5%</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quiz Completos</p>
                  <p className="text-3xl font-bold">{MOCK_FUNNEL_DATA.quizCompleted.toLocaleString()}</p>
                  <div className="flex items-center gap-1 text-sm text-emerald-600">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>+8.3%</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trials Criados</p>
                  <p className="text-3xl font-bold">{MOCK_FUNNEL_DATA.trialCreated}</p>
                  <div className="flex items-center gap-1 text-sm text-emerald-600">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>+15.2%</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Conversões</p>
                  <p className="text-3xl font-bold">{MOCK_FUNNEL_DATA.checkoutCompleted}</p>
                  <div className="flex items-center gap-1 text-sm text-red-600">
                    <ArrowDownRight className="h-4 w-4" />
                    <span>-3.1%</span>
                  </div>
                </div>
                <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Funil de Conversão Visual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Funil de Conversão
            </CardTitle>
            <CardDescription>
              Visualização do fluxo de visitantes até a conversão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Etapa 1: Page Views */}
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium">Visitantes</div>
                  <div className="flex-1 h-10 bg-blue-500 rounded-lg flex items-center justify-end pr-4" style={{ width: '100%' }}>
                    <span className="text-white font-bold">{MOCK_FUNNEL_DATA.pageViews.toLocaleString()}</span>
                  </div>
                  <div className="w-20 text-sm text-muted-foreground">100%</div>
                </div>
              </div>
              
              {/* Etapa 2: Quiz Started */}
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium">Quiz Iniciado</div>
                  <div 
                    className="flex-1 h-10 bg-purple-500 rounded-lg flex items-center justify-end pr-4" 
                    style={{ width: `${(MOCK_FUNNEL_DATA.quizStarted / MOCK_FUNNEL_DATA.pageViews) * 100}%` }}
                  >
                    <span className="text-white font-bold">{MOCK_FUNNEL_DATA.quizStarted.toLocaleString()}</span>
                  </div>
                  <div className="w-20 text-sm text-muted-foreground">{conversionRates.quizStart}%</div>
                </div>
              </div>
              
              {/* Etapa 3: Quiz Completed */}
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium">Quiz Completo</div>
                  <div 
                    className="flex-1 h-10 bg-indigo-500 rounded-lg flex items-center justify-end pr-4" 
                    style={{ width: `${(MOCK_FUNNEL_DATA.quizCompleted / MOCK_FUNNEL_DATA.pageViews) * 100}%` }}
                  >
                    <span className="text-white font-bold">{MOCK_FUNNEL_DATA.quizCompleted.toLocaleString()}</span>
                  </div>
                  <div className="w-20 text-sm text-muted-foreground">{((MOCK_FUNNEL_DATA.quizCompleted / MOCK_FUNNEL_DATA.pageViews) * 100).toFixed(1)}%</div>
                </div>
              </div>
              
              {/* Etapa 4: Pricing Viewed */}
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium">Viu Preços</div>
                  <div 
                    className="flex-1 h-10 bg-teal-500 rounded-lg flex items-center justify-end pr-4" 
                    style={{ width: `${(MOCK_FUNNEL_DATA.pricingViewed / MOCK_FUNNEL_DATA.pageViews) * 100}%` }}
                  >
                    <span className="text-white font-bold">{MOCK_FUNNEL_DATA.pricingViewed.toLocaleString()}</span>
                  </div>
                  <div className="w-20 text-sm text-muted-foreground">{((MOCK_FUNNEL_DATA.pricingViewed / MOCK_FUNNEL_DATA.pageViews) * 100).toFixed(1)}%</div>
                </div>
              </div>
              
              {/* Etapa 5: Trial Created */}
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium">Trial Criado</div>
                  <div 
                    className="flex-1 h-10 bg-emerald-500 rounded-lg flex items-center justify-end pr-4" 
                    style={{ width: `${(MOCK_FUNNEL_DATA.trialCreated / MOCK_FUNNEL_DATA.pageViews) * 100}%` }}
                  >
                    <span className="text-white font-bold">{MOCK_FUNNEL_DATA.trialCreated}</span>
                  </div>
                  <div className="w-20 text-sm text-muted-foreground">{((MOCK_FUNNEL_DATA.trialCreated / MOCK_FUNNEL_DATA.pageViews) * 100).toFixed(1)}%</div>
                </div>
              </div>
              
              {/* Etapa 6: Checkout Completed */}
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="w-32 text-sm font-medium">Conversão</div>
                  <div 
                    className="flex-1 h-10 bg-amber-500 rounded-lg flex items-center justify-end pr-4" 
                    style={{ width: `${(MOCK_FUNNEL_DATA.checkoutCompleted / MOCK_FUNNEL_DATA.pageViews) * 100}%`, minWidth: '60px' }}
                  >
                    <span className="text-white font-bold">{MOCK_FUNNEL_DATA.checkoutCompleted}</span>
                  </div>
                  <div className="w-20 text-sm text-muted-foreground">{conversionRates.overallConversion}%</div>
                </div>
              </div>
            </div>
            
            {/* Métricas de Exit Intent */}
            <div className="mt-8 pt-6 border-t">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Exit Intent Performance
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{MOCK_FUNNEL_DATA.exitIntentShown.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Popups Exibidos</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600">{MOCK_FUNNEL_DATA.exitIntentConverted}</p>
                  <p className="text-sm text-muted-foreground">Convertidos</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{conversionRates.exitIntentConvert}%</p>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Tendência e Performance por Página */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Gráfico de Tendência */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Tendência Diária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Gráfico de barras simples */}
                <div className="flex items-end gap-2 h-40">
                  {MOCK_DAILY_DATA.map((day, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div 
                        className="w-full bg-emerald-500 rounded-t transition-all hover:bg-emerald-600"
                        style={{ height: `${(day.pageViews / 2000) * 100}%` }}
                        title={`${day.date}: ${day.pageViews} visitas`}
                      />
                      <span className="text-xs text-muted-foreground">{day.date}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded" />
                    <span>Page Views</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance por Página */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Performance por Página
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_PAGE_STATS.map((page, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                    <div className="flex-1">
                      <p className="font-medium">{page.name}</p>
                      <p className="text-xs text-muted-foreground">{page.page}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="font-bold">{page.views.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Visitas</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-emerald-600">{((page.conversions / page.views) * 100).toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Conv.</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-amber-600">{page.bounceRate}%</p>
                        <p className="text-xs text-muted-foreground">Bounce</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Taxas de Conversão entre Etapas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Taxas de Conversão entre Etapas
            </CardTitle>
            <CardDescription>
              Análise de drop-off em cada etapa do funil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Eye className="h-4 w-4 text-blue-500" />
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Target className="h-4 w-4 text-purple-500" />
                </div>
                <p className="text-2xl font-bold">{conversionRates.quizStart}%</p>
                <p className="text-xs text-muted-foreground">Visita → Quiz</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Activity className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-2xl font-bold">{conversionRates.quizComplete}%</p>
                <p className="text-xs text-muted-foreground">Quiz → Completo</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <DollarSign className="h-4 w-4 text-teal-500" />
                </div>
                <p className="text-2xl font-bold">{conversionRates.pricingView}%</p>
                <p className="text-xs text-muted-foreground">Quiz → Pricing</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <DollarSign className="h-4 w-4 text-teal-500" />
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Users className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold">{conversionRates.trialCreate}%</p>
                <p className="text-xs text-muted-foreground">Pricing → Trial</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <DollarSign className="h-4 w-4 text-teal-500" />
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <MousePointerClick className="h-4 w-4 text-amber-500" />
                </div>
                <p className="text-2xl font-bold">{conversionRates.checkoutStart}%</p>
                <p className="text-xs text-muted-foreground">Pricing → Checkout</p>
              </div>
              
              <div className="text-center p-4 border rounded-lg bg-emerald-50">
                <div className="flex items-center justify-center gap-1 mb-2">
                  <MousePointerClick className="h-4 w-4 text-amber-500" />
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <Zap className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-bold text-emerald-600">{conversionRates.checkoutComplete}%</p>
                <p className="text-xs text-muted-foreground">Checkout → Pago</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
