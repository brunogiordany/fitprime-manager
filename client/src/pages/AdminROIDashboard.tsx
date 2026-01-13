import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Target, 
  BarChart3, 
  PieChart,
  ArrowLeft,
  RefreshCw,
  Download,
  Plus,
  Trash2,
  Calendar,
  Percent,
  Zap
} from "lucide-react";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdSpend {
  id: string;
  platform: string;
  campaign: string;
  spend: number;
  date: string;
}

export default function AdminROIDashboard() {
  const [, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  
  // Estado para gastos com anúncios (manual input)
  const [adSpends, setAdSpends] = useState<AdSpend[]>([]);
  const [newSpend, setNewSpend] = useState({
    platform: "meta",
    campaign: "",
    spend: "",
    date: new Date().toISOString().split('T')[0],
  });

  // Buscar dados de conversões do banco
  const { data: pixelData, isLoading, refetch } = trpc.tracking.getEventStats.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Calcular métricas de ROI
  const metrics = useMemo(() => {
    const totalSpend = adSpends.reduce((sum, s) => sum + s.spend, 0);
    const totalRevenue = pixelData?.purchaseValue || 0;
    const purchaseEvents = pixelData?.eventsByType?.find(e => e.eventName === 'Purchase');
    const totalConversions = purchaseEvents?.count || 0;
    
    const roi = totalSpend > 0 ? ((totalRevenue - totalSpend) / totalSpend) * 100 : 0;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const aov = totalConversions > 0 ? totalRevenue / totalConversions : 0;
    
    return {
      totalSpend,
      totalRevenue,
      totalConversions,
      roi,
      roas,
      cpa,
      aov,
    };
  }, [adSpends, pixelData]);

  // Adicionar gasto
  const handleAddSpend = () => {
    if (!newSpend.campaign || !newSpend.spend) return;
    
    setAdSpends([
      ...adSpends,
      {
        id: `spend_${Date.now()}`,
        platform: newSpend.platform,
        campaign: newSpend.campaign,
        spend: parseFloat(newSpend.spend),
        date: newSpend.date,
      },
    ]);
    
    setNewSpend({
      platform: "meta",
      campaign: "",
      spend: "",
      date: new Date().toISOString().split('T')[0],
    });
  };

  // Remover gasto
  const handleRemoveSpend = (id: string) => {
    setAdSpends(adSpends.filter(s => s.id !== id));
  };

  // Exportar relatório CSV
  const handleExportCSV = () => {
    const headers = ["Métrica", "Valor"];
    const rows = [
      ["Total Gasto em Anúncios", `R$ ${metrics.totalSpend.toFixed(2)}`],
      ["Receita Total", `R$ ${metrics.totalRevenue.toFixed(2)}`],
      ["Total de Conversões", metrics.totalConversions.toString()],
      ["ROI", `${metrics.roi.toFixed(2)}%`],
      ["ROAS", `${metrics.roas.toFixed(2)}x`],
      ["CPA (Custo por Aquisição)", `R$ ${metrics.cpa.toFixed(2)}`],
      ["AOV (Ticket Médio)", `R$ ${metrics.aov.toFixed(2)}`],
      ["", ""],
      ["Gastos por Campanha", ""],
      ...adSpends.map(s => [s.campaign, `R$ ${s.spend.toFixed(2)}`]),
    ];
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `roi-report-${dateRange.start}-${dateRange.end}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/admin")}
            className="text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-500" />
              Relatório de ROI / ROAS
            </h1>
            <p className="text-slate-400 text-sm">
              Analise o retorno sobre investimento em anúncios
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            size="sm"
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filtros de data */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <Input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="bg-slate-900 border-slate-700 text-white w-40"
          />
          <span className="text-slate-400">até</span>
          <Input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="bg-slate-900 border-slate-700 text-white w-40"
          />
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Gasto</p>
                <p className="text-2xl font-bold text-red-400">
                  R$ {metrics.totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Receita Total</p>
                <p className="text-2xl font-bold text-emerald-400">
                  R$ {metrics.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">ROI</p>
                <p className={`text-2xl font-bold ${metrics.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {metrics.roi >= 0 ? '+' : ''}{metrics.roi.toFixed(1)}%
                </p>
              </div>
              <div className={`w-12 h-12 ${metrics.roi >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'} rounded-xl flex items-center justify-center`}>
                <Percent className={`w-6 h-6 ${metrics.roi >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">ROAS</p>
                <p className={`text-2xl font-bold ${metrics.roas >= 1 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {metrics.roas.toFixed(2)}x
                </p>
              </div>
              <div className={`w-12 h-12 ${metrics.roas >= 1 ? 'bg-emerald-500/20' : 'bg-yellow-500/20'} rounded-xl flex items-center justify-center`}>
                <Target className={`w-6 h-6 ${metrics.roas >= 1 ? 'text-emerald-400' : 'text-yellow-400'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards secundários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Conversões</p>
                <p className="text-xl font-bold text-white">{metrics.totalConversions}</p>
              </div>
              <Zap className="w-5 h-5 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">CPA (Custo por Aquisição)</p>
                <p className="text-xl font-bold text-white">
                  R$ {metrics.cpa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">AOV (Ticket Médio)</p>
                <p className="text-xl font-bold text-white">
                  R$ {metrics.aov.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <PieChart className="w-5 h-5 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de gastos com anúncios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adicionar gasto */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-500" />
              Adicionar Gasto com Anúncios
            </CardTitle>
            <CardDescription className="text-slate-400">
              Registre seus gastos com anúncios para calcular o ROI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400 text-sm">Plataforma</Label>
                <Select 
                  value={newSpend.platform} 
                  onValueChange={(v) => setNewSpend({ ...newSpend, platform: v })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="meta">Meta (Facebook/Instagram)</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="tiktok">TikTok Ads</SelectItem>
                    <SelectItem value="youtube">YouTube Ads</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400 text-sm">Data</Label>
                <Input
                  type="date"
                  value={newSpend.date}
                  onChange={(e) => setNewSpend({ ...newSpend, date: e.target.value })}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-slate-400 text-sm">Nome da Campanha</Label>
              <Input
                placeholder="Ex: Campanha de Leads Janeiro"
                value={newSpend.campaign}
                onChange={(e) => setNewSpend({ ...newSpend, campaign: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div>
              <Label className="text-slate-400 text-sm">Valor Gasto (R$)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={newSpend.spend}
                onChange={(e) => setNewSpend({ ...newSpend, spend: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <Button 
              onClick={handleAddSpend}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Gasto
            </Button>
          </CardContent>
        </Card>

        {/* Lista de gastos */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-400" />
              Gastos Registrados
            </CardTitle>
            <CardDescription className="text-slate-400">
              {adSpends.length} gastos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adSpends.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum gasto registrado</p>
                <p className="text-sm">Adicione seus gastos com anúncios para calcular o ROI</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {adSpends.map((spend) => (
                  <div 
                    key={spend.id}
                    className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant="outline" 
                        className={`
                          ${spend.platform === 'meta' ? 'border-blue-500 text-blue-400' : ''}
                          ${spend.platform === 'google' ? 'border-red-500 text-red-400' : ''}
                          ${spend.platform === 'tiktok' ? 'border-pink-500 text-pink-400' : ''}
                          ${spend.platform === 'youtube' ? 'border-red-600 text-red-500' : ''}
                          ${spend.platform === 'other' ? 'border-slate-500 text-slate-400' : ''}
                        `}
                      >
                        {spend.platform}
                      </Badge>
                      <div>
                        <p className="text-white text-sm font-medium">{spend.campaign}</p>
                        <p className="text-slate-500 text-xs">{spend.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-red-400 font-semibold">
                        R$ {spend.spend.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSpend(spend.id)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dicas de interpretação */}
      <Card className="bg-slate-900 border-slate-800 mt-6">
        <CardHeader>
          <CardTitle className="text-lg">📊 Como interpretar as métricas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="font-semibold text-emerald-400 mb-2">ROI (Return on Investment)</p>
              <p className="text-slate-400">
                Percentual de retorno sobre o investimento. ROI positivo significa lucro, negativo significa prejuízo.
              </p>
              <p className="text-slate-500 mt-2 text-xs">
                Fórmula: ((Receita - Gasto) / Gasto) × 100
              </p>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="font-semibold text-blue-400 mb-2">ROAS (Return on Ad Spend)</p>
              <p className="text-slate-400">
                Quanto você ganha para cada R$ 1 gasto em anúncios. ROAS 2x significa R$ 2 de receita para cada R$ 1 gasto.
              </p>
              <p className="text-slate-500 mt-2 text-xs">
                Fórmula: Receita / Gasto
              </p>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="font-semibold text-purple-400 mb-2">CPA (Custo por Aquisição)</p>
              <p className="text-slate-400">
                Quanto custa adquirir cada cliente. Quanto menor, mais eficiente sua campanha.
              </p>
              <p className="text-slate-500 mt-2 text-xs">
                Fórmula: Gasto / Conversões
              </p>
            </div>
            <div className="p-4 bg-slate-800 rounded-lg">
              <p className="font-semibold text-orange-400 mb-2">AOV (Average Order Value)</p>
              <p className="text-slate-400">
                Valor médio de cada venda. Ajuda a entender o ticket médio dos seus clientes.
              </p>
              <p className="text-slate-500 mt-2 text-xs">
                Fórmula: Receita / Conversões
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
