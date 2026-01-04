import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ReferenceLine,
} from "recharts";
import { format, subDays, subMonths, subYears, isAfter, parseISO, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Scale,
  Ruler,
  Activity,
  Target,
  Calendar,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

// Tipos
interface Measurement {
  id: number;
  measureDate: string | Date;
  weight?: string | null;
  height?: string | null;
  bmi?: string | null;
  bodyFat?: string | null;
  muscleMass?: string | null;
  waist?: string | null;
  hip?: string | null;
  chest?: string | null;
  rightArm?: string | null;
  leftArm?: string | null;
  rightThigh?: string | null;
  leftThigh?: string | null;
  rightCalf?: string | null;
  leftCalf?: string | null;
  neck?: string | null;
  shoulders?: string | null;
  estimatedBodyFat?: string | null;
  bioBodyFat?: string | null;
  adipBodyFat?: string | null;
}

interface EvolutionChartsProps {
  measurements: Measurement[];
  onNewMeasure?: () => void;
}

// Períodos disponíveis
const PERIOD_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "7days", label: "7 dias" },
  { value: "15days", label: "15 dias" },
  { value: "30days", label: "30 dias" },
  { value: "3months", label: "3 meses" },
  { value: "6months", label: "6 meses" },
  { value: "1year", label: "1 ano" },
  { value: "all", label: "Todo período" },
];

// Função para calcular a data de início baseada no período
const getStartDate = (period: string): Date | null => {
  const now = new Date();
  switch (period) {
    case "today":
      return startOfDay(now);
    case "yesterday":
      return startOfDay(subDays(now, 1));
    case "7days":
      return subDays(now, 7);
    case "15days":
      return subDays(now, 15);
    case "30days":
      return subDays(now, 30);
    case "3months":
      return subMonths(now, 3);
    case "6months":
      return subMonths(now, 6);
    case "1year":
      return subYears(now, 1);
    case "all":
    default:
      return null;
  }
};

// Função para calcular a data de fim baseada no período
const getEndDate = (period: string): Date => {
  const now = new Date();
  if (period === "yesterday") {
    return endOfDay(subDays(now, 1));
  }
  return endOfDay(now);
};

// Componente de indicador de tendência
const TrendIndicator = ({ current, previous, unit, inverse = false }: { 
  current: number; 
  previous: number; 
  unit: string;
  inverse?: boolean; // Para medidas onde diminuir é bom (ex: % gordura, cintura)
}) => {
  if (!previous || !current) return null;
  
  const diff = current - previous;
  const percentChange = ((diff / previous) * 100).toFixed(1);
  const isPositive = inverse ? diff < 0 : diff > 0;
  const isNeutral = Math.abs(diff) < 0.1;
  
  if (isNeutral) {
    return (
      <div className="flex items-center gap-1 text-gray-500">
        <Minus className="h-4 w-4" />
        <span className="text-sm">Estável</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
      {diff > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
      <span className="text-sm font-medium">
        {diff > 0 ? '+' : ''}{diff.toFixed(1)}{unit} ({percentChange}%)
      </span>
    </div>
  );
};

// Componente de card de medida individual
const MeasureCard = ({ 
  title, 
  icon: Icon, 
  current, 
  previous, 
  first,
  unit,
  color,
  inverse = false,
  description,
}: {
  title: string;
  icon: any;
  current: number | null;
  previous: number | null;
  first: number | null;
  unit: string;
  color: string;
  inverse?: boolean;
  description?: string;
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  if (!current) return null;
  
  const totalChange = first ? current - first : 0;
  const recentChange = previous ? current - previous : 0;
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="h-8 w-8 p-0"
          >
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{current.toFixed(1)}</span>
            <span className="text-muted-foreground">{unit}</span>
          </div>
          
          {previous && (
            <TrendIndicator 
              current={current} 
              previous={previous} 
              unit={unit}
              inverse={inverse}
            />
          )}
          
          {showDetails && (
            <div className="pt-3 border-t space-y-2 text-sm">
              {previous && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Medida anterior:</span>
                  <span className="font-medium">{previous.toFixed(1)}{unit}</span>
                </div>
              )}
              {first && first !== current && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Primeira medida:</span>
                  <span className="font-medium">{first.toFixed(1)}{unit}</span>
                </div>
              )}
              {first && first !== current && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Variação total:</span>
                  <span className={`font-medium ${
                    (inverse ? totalChange < 0 : totalChange > 0) ? 'text-emerald-600' : 
                    totalChange === 0 ? 'text-gray-500' : 'text-red-500'
                  }`}>
                    {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}{unit}
                  </span>
                </div>
              )}
              {description && (
                <div className="flex items-start gap-2 pt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  <Info className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>{description}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Tooltip customizado para os gráficos
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  
  return (
    <div className="bg-white border rounded-lg shadow-lg p-3 min-w-[150px]">
      <p className="font-medium text-sm mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
          </div>
          <span className="font-medium">{entry.value?.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

export function EvolutionCharts({ measurements, onNewMeasure }: EvolutionChartsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [activeCategory, setActiveCategory] = useState("overview");
  
  // Filtrar medidas pelo período selecionado
  const filteredMeasurements = useMemo(() => {
    if (!measurements || measurements.length === 0) return [];
    
    const startDate = getStartDate(selectedPeriod);
    const endDate = getEndDate(selectedPeriod);
    
    return measurements
      .filter(m => {
        if (!m.measureDate) return false;
        const measureDate = new Date(m.measureDate);
        if (isNaN(measureDate.getTime())) return false;
        
        if (!startDate) return true; // "all" period
        
        return isWithinInterval(measureDate, { start: startDate, end: endDate });
      })
      .sort((a, b) => new Date(a.measureDate).getTime() - new Date(b.measureDate).getTime());
  }, [measurements, selectedPeriod]);
  
  // Dados processados
  const chartData = useMemo(() => {
    return filteredMeasurements.map(m => ({
      date: format(new Date(m.measureDate), "dd/MM/yy", { locale: ptBR }),
      fullDate: format(new Date(m.measureDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }),
      weight: m.weight ? parseFloat(m.weight) : null,
      bodyFat: m.bodyFat ? parseFloat(m.bodyFat) : null,
      muscleMass: m.muscleMass ? parseFloat(m.muscleMass) : null,
      bmi: m.bmi ? parseFloat(m.bmi) : null,
      waist: m.waist ? parseFloat(m.waist) : null,
      hip: m.hip ? parseFloat(m.hip) : null,
      chest: m.chest ? parseFloat(m.chest) : null,
      rightArm: m.rightArm ? parseFloat(m.rightArm) : null,
      leftArm: m.leftArm ? parseFloat(m.leftArm) : null,
      rightThigh: m.rightThigh ? parseFloat(m.rightThigh) : null,
      leftThigh: m.leftThigh ? parseFloat(m.leftThigh) : null,
      rightCalf: m.rightCalf ? parseFloat(m.rightCalf) : null,
      leftCalf: m.leftCalf ? parseFloat(m.leftCalf) : null,
      neck: m.neck ? parseFloat(m.neck) : null,
      shoulders: m.shoulders ? parseFloat(m.shoulders) : null,
    }));
  }, [filteredMeasurements]);
  
  // Valores atuais, anteriores e primeiros para os cards
  const currentValues = useMemo(() => {
    if (chartData.length === 0) return null;
    const current = chartData[chartData.length - 1];
    const previous = chartData.length > 1 ? chartData[chartData.length - 2] : null;
    const first = chartData[0];
    
    return {
      current,
      previous,
      first,
    };
  }, [chartData]);
  
  // Estatísticas resumidas
  const stats = useMemo(() => {
    if (!currentValues) return null;
    
    const { current, first } = currentValues;
    
    // Calcular variações totais
    const weightChange = current.weight && first.weight ? current.weight - first.weight : null;
    const bodyFatChange = current.bodyFat && first.bodyFat ? current.bodyFat - first.bodyFat : null;
    const muscleMassChange = current.muscleMass && first.muscleMass ? current.muscleMass - first.muscleMass : null;
    const waistChange = current.waist && first.waist ? current.waist - first.waist : null;
    
    return {
      weightChange,
      bodyFatChange,
      muscleMassChange,
      waistChange,
      totalMeasurements: chartData.length,
      periodLabel: PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label || "Todo período",
    };
  }, [currentValues, chartData.length, selectedPeriod]);
  
  if (!measurements || measurements.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Scale className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">Nenhuma medida registrada</p>
            <p className="text-muted-foreground mb-4">
              Comece a registrar medidas para acompanhar a evolução
            </p>
            {onNewMeasure && (
              <Button onClick={onNewMeasure}>
                Registrar Primeira Medida
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header com filtro de período */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Evolução das Medidas</h3>
          <p className="text-sm text-muted-foreground">
            {stats?.totalMeasurements || 0} medições no período selecionado
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {onNewMeasure && (
            <Button onClick={onNewMeasure} size="sm">
              Nova Medida
            </Button>
          )}
        </div>
      </div>
      
      {/* Cards de resumo das variações */}
      {stats && currentValues && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.weightChange !== null && (
            <Card className={`border-l-4 ${stats.weightChange <= 0 ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Scale className="h-4 w-4" />
                  Peso
                </div>
                <div className="text-2xl font-bold">
                  {stats.weightChange > 0 ? '+' : ''}{stats.weightChange.toFixed(1)}kg
                </div>
                <p className="text-xs text-muted-foreground">
                  variação no período
                </p>
              </CardContent>
            </Card>
          )}
          
          {stats.bodyFatChange !== null && (
            <Card className={`border-l-4 ${stats.bodyFatChange <= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Activity className="h-4 w-4" />
                  % Gordura
                </div>
                <div className="text-2xl font-bold">
                  {stats.bodyFatChange > 0 ? '+' : ''}{stats.bodyFatChange.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  variação no período
                </p>
              </CardContent>
            </Card>
          )}
          
          {stats.muscleMassChange !== null && (
            <Card className={`border-l-4 ${stats.muscleMassChange >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Target className="h-4 w-4" />
                  Massa Muscular
                </div>
                <div className="text-2xl font-bold">
                  {stats.muscleMassChange > 0 ? '+' : ''}{stats.muscleMassChange.toFixed(1)}kg
                </div>
                <p className="text-xs text-muted-foreground">
                  variação no período
                </p>
              </CardContent>
            </Card>
          )}
          
          {stats.waistChange !== null && (
            <Card className={`border-l-4 ${stats.waistChange <= 0 ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Ruler className="h-4 w-4" />
                  Cintura
                </div>
                <div className="text-2xl font-bold">
                  {stats.waistChange > 0 ? '+' : ''}{stats.waistChange.toFixed(1)}cm
                </div>
                <p className="text-xs text-muted-foreground">
                  variação no período
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
      {/* Tabs de categorias */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="weight">Peso e Composição</TabsTrigger>
          <TabsTrigger value="circumference">Circunferências</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>
        
        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Gráfico principal de peso */}
          {chartData.some(d => d.weight) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-600" />
                  Evolução do Peso
                </CardTitle>
                <CardDescription>
                  Acompanhamento do peso corporal ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis 
                        domain={['auto', 'auto']} 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="weight"
                        name="Peso (kg)"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#weightGradient)"
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Gráfico de composição corporal */}
          {chartData.some(d => d.bodyFat || d.muscleMass) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Composição Corporal
                </CardTitle>
                <CardDescription>
                  Evolução de % gordura e massa muscular
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="bodyFat"
                        name="% Gordura"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="muscleMass"
                        name="Massa Muscular (kg)"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Peso e Composição */}
        <TabsContent value="weight" className="space-y-6">
          {currentValues && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MeasureCard
                title="Peso"
                icon={Scale}
                current={currentValues.current.weight}
                previous={currentValues.previous?.weight || null}
                first={currentValues.first.weight}
                unit="kg"
                color="bg-emerald-500"
                description="Peso corporal total medido em quilogramas"
              />
              <MeasureCard
                title="% Gordura"
                icon={Activity}
                current={currentValues.current.bodyFat}
                previous={currentValues.previous?.bodyFat || null}
                first={currentValues.first.bodyFat}
                unit="%"
                color="bg-amber-500"
                inverse={true}
                description="Percentual de gordura corporal. Valores menores indicam melhor composição."
              />
              <MeasureCard
                title="Massa Muscular"
                icon={Target}
                current={currentValues.current.muscleMass}
                previous={currentValues.previous?.muscleMass || null}
                first={currentValues.first.muscleMass}
                unit="kg"
                color="bg-blue-500"
                description="Massa muscular total em quilogramas"
              />
            </div>
          )}
          
          {/* Gráfico de IMC */}
          {chartData.some(d => d.bmi) && (
            <Card>
              <CardHeader>
                <CardTitle>Índice de Massa Corporal (IMC)</CardTitle>
                <CardDescription>
                  Evolução do IMC ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis domain={[15, 35]} tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      {/* Faixas de referência do IMC */}
                      <ReferenceLine y={18.5} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "Abaixo do peso", fontSize: 10 }} />
                      <ReferenceLine y={25} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "Sobrepeso", fontSize: 10 }} />
                      <ReferenceLine y={30} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "Obesidade", fontSize: 10 }} />
                      <Line
                        type="monotone"
                        dataKey="bmi"
                        name="IMC"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="bg-green-50 text-green-700">Normal: 18.5-24.9</Badge>
                  <Badge variant="outline" className="bg-amber-50 text-amber-700">Sobrepeso: 25-29.9</Badge>
                  <Badge variant="outline" className="bg-red-50 text-red-700">Obesidade: ≥30</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Circunferências */}
        <TabsContent value="circumference" className="space-y-6">
          {currentValues && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MeasureCard
                title="Cintura"
                icon={Ruler}
                current={currentValues.current.waist}
                previous={currentValues.previous?.waist || null}
                first={currentValues.first.waist}
                unit="cm"
                color="bg-emerald-500"
                inverse={true}
                description="Circunferência da cintura. Valores menores indicam menor risco cardiovascular."
              />
              <MeasureCard
                title="Quadril"
                icon={Ruler}
                current={currentValues.current.hip}
                previous={currentValues.previous?.hip || null}
                first={currentValues.first.hip}
                unit="cm"
                color="bg-amber-500"
              />
              <MeasureCard
                title="Peito"
                icon={Ruler}
                current={currentValues.current.chest}
                previous={currentValues.previous?.chest || null}
                first={currentValues.first.chest}
                unit="cm"
                color="bg-blue-500"
              />
              <MeasureCard
                title="Ombros"
                icon={Ruler}
                current={currentValues.current.shoulders}
                previous={currentValues.previous?.shoulders || null}
                first={currentValues.first.shoulders}
                unit="cm"
                color="bg-purple-500"
              />
            </div>
          )}
          
          {/* Gráfico de circunferências principais */}
          {chartData.some(d => d.waist || d.hip || d.chest) && (
            <Card>
              <CardHeader>
                <CardTitle>Evolução das Circunferências</CardTitle>
                <CardDescription>
                  Medidas em centímetros ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="waist" name="Cintura" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="hip" name="Quadril" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="chest" name="Peito" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Membros */}
          {currentValues && (currentValues.current.rightArm || currentValues.current.rightThigh) && (
            <>
              <h4 className="font-semibold text-lg">Membros</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MeasureCard
                  title="Braço D"
                  icon={Ruler}
                  current={currentValues.current.rightArm}
                  previous={currentValues.previous?.rightArm || null}
                  first={currentValues.first.rightArm}
                  unit="cm"
                  color="bg-orange-500"
                />
                <MeasureCard
                  title="Braço E"
                  icon={Ruler}
                  current={currentValues.current.leftArm}
                  previous={currentValues.previous?.leftArm || null}
                  first={currentValues.first.leftArm}
                  unit="cm"
                  color="bg-orange-400"
                />
                <MeasureCard
                  title="Coxa D"
                  icon={Ruler}
                  current={currentValues.current.rightThigh}
                  previous={currentValues.previous?.rightThigh || null}
                  first={currentValues.first.rightThigh}
                  unit="cm"
                  color="bg-teal-500"
                />
                <MeasureCard
                  title="Coxa E"
                  icon={Ruler}
                  current={currentValues.current.leftThigh}
                  previous={currentValues.previous?.leftThigh || null}
                  first={currentValues.first.leftThigh}
                  unit="cm"
                  color="bg-teal-400"
                />
              </div>
              
              {/* Gráfico de membros */}
              {chartData.some(d => d.rightArm || d.rightThigh) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Evolução dos Membros</CardTitle>
                    <CardDescription>
                      Braços e coxas em centímetros
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line type="monotone" dataKey="rightArm" name="Braço D" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="leftArm" name="Braço E" stroke="#fb923c" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="rightThigh" name="Coxa D" stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="leftThigh" name="Coxa E" stroke="#5eead4" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
        
        {/* Detalhes */}
        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico Completo de Medidas</CardTitle>
              <CardDescription>
                Todas as medições registradas no período selecionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMeasurements.slice().reverse().map((m, index) => (
                  <div 
                    key={m.id} 
                    className={`p-4 rounded-lg border ${index === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-white'}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(m.measureDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                        {index === 0 && (
                          <Badge className="bg-emerald-100 text-emerald-700 border-0">
                            Mais recente
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-sm">
                      {m.weight && (
                        <div>
                          <span className="text-muted-foreground">Peso:</span>
                          <span className="ml-1 font-medium">{m.weight}kg</span>
                        </div>
                      )}
                      {m.bodyFat && (
                        <div>
                          <span className="text-muted-foreground">Gordura:</span>
                          <span className="ml-1 font-medium">{m.bodyFat}%</span>
                        </div>
                      )}
                      {m.muscleMass && (
                        <div>
                          <span className="text-muted-foreground">Músculo:</span>
                          <span className="ml-1 font-medium">{m.muscleMass}kg</span>
                        </div>
                      )}
                      {m.bmi && (
                        <div>
                          <span className="text-muted-foreground">IMC:</span>
                          <span className="ml-1 font-medium">{m.bmi}</span>
                        </div>
                      )}
                      {m.waist && (
                        <div>
                          <span className="text-muted-foreground">Cintura:</span>
                          <span className="ml-1 font-medium">{m.waist}cm</span>
                        </div>
                      )}
                      {m.hip && (
                        <div>
                          <span className="text-muted-foreground">Quadril:</span>
                          <span className="ml-1 font-medium">{m.hip}cm</span>
                        </div>
                      )}
                      {m.chest && (
                        <div>
                          <span className="text-muted-foreground">Peito:</span>
                          <span className="ml-1 font-medium">{m.chest}cm</span>
                        </div>
                      )}
                      {m.rightArm && (
                        <div>
                          <span className="text-muted-foreground">Braço D:</span>
                          <span className="ml-1 font-medium">{m.rightArm}cm</span>
                        </div>
                      )}
                      {m.leftArm && (
                        <div>
                          <span className="text-muted-foreground">Braço E:</span>
                          <span className="ml-1 font-medium">{m.leftArm}cm</span>
                        </div>
                      )}
                      {m.rightThigh && (
                        <div>
                          <span className="text-muted-foreground">Coxa D:</span>
                          <span className="ml-1 font-medium">{m.rightThigh}cm</span>
                        </div>
                      )}
                      {m.leftThigh && (
                        <div>
                          <span className="text-muted-foreground">Coxa E:</span>
                          <span className="ml-1 font-medium">{m.leftThigh}cm</span>
                        </div>
                      )}
                      {m.neck && (
                        <div>
                          <span className="text-muted-foreground">Pescoço:</span>
                          <span className="ml-1 font-medium">{m.neck}cm</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredMeasurements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma medida encontrada no período selecionado</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
