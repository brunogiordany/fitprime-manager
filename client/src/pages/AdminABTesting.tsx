import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { 
  ChevronLeft, 
  RefreshCw, 
  Plus,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FlaskConical,
  Copy,
  Eye,
  Settings
} from "lucide-react";
import { toast } from "sonner";

export default function AdminABTesting() {
  const { user, loading: authLoading } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<any>(null);
  
  // Form state
  const [newTest, setNewTest] = useState({
    name: "",
    pageId: "",
    variantAName: "Controle (Original)",
    variantBName: "Variante B",
    trafficSplit: 50,
    goalType: "conversion",
    goalValue: ""
  });

  // Buscar testes A/B
  const { data: tests = [], isLoading, refetch } = trpc.abTests.list.useQuery();
  
  // Buscar páginas para seleção
  const { data: pages = [] } = trpc.sitePages.list.useQuery();
  
  // Mutations
  const createMutation = trpc.abTests.create.useMutation({
    onSuccess: () => {
      toast.success("Teste A/B criado com sucesso!");
      setShowCreateDialog(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar teste");
    }
  });
  
  const startMutation = trpc.abTests.start.useMutation({
    onSuccess: () => {
      toast.success("Teste iniciado!");
      refetch();
    }
  });
  
  const pauseMutation = trpc.abTests.pause.useMutation({
    onSuccess: () => {
      toast.success("Teste pausado!");
      refetch();
    }
  });
  
  const deleteMutation = trpc.abTests.delete.useMutation({
    onSuccess: () => {
      toast.success("Teste excluído!");
      refetch();
    }
  });

  const resetForm = () => {
    setNewTest({
      name: "",
      pageId: "",
      variantAName: "Controle (Original)",
      variantBName: "Variante B",
      trafficSplit: 50,
      goalType: "conversion",
      goalValue: ""
    });
  };

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

  const handleCreate = () => {
    if (!newTest.name || !newTest.pageId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    createMutation.mutate({
      name: newTest.name,
      originalPageId: Number(newTest.pageId),
      trafficSplit: newTest.trafficSplit,
      goalType: newTest.goalType as any,
      goalValue: newTest.goalValue
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-emerald-500"><Play className="h-3 w-3 mr-1" />Rodando</Badge>;
      case "paused":
        return <Badge variant="secondary"><Pause className="h-3 w-3 mr-1" />Pausado</Badge>;
      case "completed":
        return <Badge variant="outline"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      case "draft":
        return <Badge variant="outline" className="text-muted-foreground">Rascunho</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateWinner = (test: any) => {
    if (!test.variants || test.variants.length < 2) return null;
    
    const [varA, varB] = test.variants;
    const convA = varA.visitors > 0 ? (varA.conversions / varA.visitors) * 100 : 0;
    const convB = varB.visitors > 0 ? (varB.conversions / varB.visitors) * 100 : 0;
    
    if (convA === convB) return null;
    return convA > convB ? "A" : "B";
  };

  const calculateConfidence = (test: any) => {
    // Simplified confidence calculation
    if (!test.variants || test.variants.length < 2) return 0;
    
    const totalVisitors = test.variants.reduce((sum: number, v: any) => sum + (v.visitors || 0), 0);
    if (totalVisitors < 100) return Math.min(totalVisitors, 50);
    if (totalVisitors < 500) return 50 + Math.min((totalVisitors - 100) / 8, 30);
    return Math.min(80 + (totalVisitors - 500) / 100, 99);
  };

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
                  <FlaskConical className="h-5 w-5 text-purple-600" />
                  Testes A/B
                </h1>
                <p className="text-sm text-muted-foreground">Otimize suas páginas com experimentos</p>
              </div>
            </div>
            
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Teste
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Testes Ativos</p>
                  <p className="text-2xl font-bold">
                    {tests.filter((t: any) => t.status === "running").length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Play className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Testes</p>
                  <p className="text-2xl font-bold">{tests.length}</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FlaskConical className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Visitantes Testados</p>
                  <p className="text-2xl font-bold">
                    {tests.reduce((sum: number, t: any) => 
                      sum + (t.variants?.reduce((s: number, v: any) => s + (v.visitors || 0), 0) || 0), 0
                    ).toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Testes Concluídos</p>
                  <p className="text-2xl font-bold">
                    {tests.filter((t: any) => t.status === "completed").length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Testes */}
        <Card>
          <CardHeader>
            <CardTitle>Seus Testes A/B</CardTitle>
            <CardDescription>
              Gerencie e acompanhe os resultados dos seus experimentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : tests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Nenhum teste A/B criado</p>
                <p className="text-sm mb-4">Crie seu primeiro teste para otimizar suas conversões</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Teste
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Teste</TableHead>
                    <TableHead>Página</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visitantes</TableHead>
                    <TableHead>Conversões</TableHead>
                    <TableHead>Vencedor</TableHead>
                    <TableHead>Confiança</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test: any) => {
                    const winner = calculateWinner(test);
                    const confidence = calculateConfidence(test);
                    const totalVisitors = test.variants?.reduce((s: number, v: any) => s + (v.visitors || 0), 0) || 0;
                    const totalConversions = test.variants?.reduce((s: number, v: any) => s + (v.conversions || 0), 0) || 0;
                    
                    return (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {test.page?.name || "—"}
                        </TableCell>
                        <TableCell>{getStatusBadge(test.status)}</TableCell>
                        <TableCell>{totalVisitors.toLocaleString()}</TableCell>
                        <TableCell>{totalConversions.toLocaleString()}</TableCell>
                        <TableCell>
                          {winner ? (
                            <Badge variant={winner === "A" ? "default" : "secondary"}>
                              {winner === "A" ? (
                                <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                              ) : (
                                <TrendingUp className="h-3 w-3 mr-1" />
                              )}
                              Variante {winner}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={confidence} className="w-16 h-2" />
                            <span className="text-sm">{Math.round(confidence)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedTest(test);
                                setShowResultsDialog(true);
                              }}>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Ver Resultados
                              </DropdownMenuItem>
                              {test.status === "running" ? (
                                <DropdownMenuItem onClick={() => 
                                  pauseMutation.mutate({ id: test.id })
                                }>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pausar
                                </DropdownMenuItem>
                              ) : (test.status === "paused" || test.status === "draft") && (
                                <DropdownMenuItem onClick={() => 
                                  startMutation.mutate({ id: test.id })
                                }>
                                  <Play className="h-4 w-4 mr-2" />
                                  {test.status === "draft" ? "Iniciar" : "Retomar"}
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => {
                                  if (confirm("Excluir este teste?")) {
                                    deleteMutation.mutate({ id: test.id });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Dialog de Criar Teste */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Criar Novo Teste A/B
            </DialogTitle>
            <DialogDescription>
              Configure um experimento para testar diferentes versões da sua página
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Nome do Teste *</Label>
              <Input 
                placeholder="Ex: Teste de CTA na Landing Page"
                value={newTest.name}
                onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
              />
            </div>
            
            <div>
              <Label>Página *</Label>
              <Select 
                value={newTest.pageId}
                onValueChange={(value) => setNewTest({ ...newTest, pageId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma página" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((page: any) => (
                    <SelectItem key={page.id} value={String(page.id)}>
                      {page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Variante A (Controle)</Label>
                <Input 
                  value={newTest.variantAName}
                  onChange={(e) => setNewTest({ ...newTest, variantAName: e.target.value })}
                />
              </div>
              <div>
                <Label>Variante B</Label>
                <Input 
                  value={newTest.variantBName}
                  onChange={(e) => setNewTest({ ...newTest, variantBName: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label>Divisão de Tráfego: {newTest.trafficSplit}% / {100 - newTest.trafficSplit}%</Label>
              <input 
                type="range"
                min="10"
                max="90"
                value={newTest.trafficSplit}
                onChange={(e) => setNewTest({ ...newTest, trafficSplit: Number(e.target.value) })}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Variante A: {newTest.trafficSplit}%</span>
                <span>Variante B: {100 - newTest.trafficSplit}%</span>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Label>Objetivo do Teste</Label>
              <Select 
                value={newTest.goalType}
                onValueChange={(value) => setNewTest({ ...newTest, goalType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="conversion">Taxa de Conversão</SelectItem>
                  <SelectItem value="click">Cliques no CTA</SelectItem>
                  <SelectItem value="scroll">Scroll até o final</SelectItem>
                  <SelectItem value="time">Tempo na página</SelectItem>
                  <SelectItem value="custom">Evento Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {newTest.goalType === "custom" && (
              <div>
                <Label>Nome do Evento</Label>
                <Input 
                  placeholder="Ex: button_click_cta"
                  value={newTest.goalValue}
                  onChange={(e) => setNewTest({ ...newTest, goalValue: e.target.value })}
                />
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              Criar Teste
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Resultados */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Resultados: {selectedTest?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTest && (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-2 gap-4">
                {selectedTest.variants?.map((variant: any, index: number) => {
                  const convRate = variant.visitors > 0 
                    ? ((variant.conversions / variant.visitors) * 100).toFixed(2) 
                    : "0.00";
                  const isWinner = calculateWinner(selectedTest) === (index === 0 ? "A" : "B");
                  
                  return (
                    <Card key={variant.id} className={isWinner ? "border-emerald-500" : ""}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          {variant.name}
                          {isWinner && (
                            <Badge className="bg-emerald-500">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              Vencedor
                            </Badge>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Visitantes:</span>
                            <span className="font-medium">{variant.visitors?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Conversões:</span>
                            <span className="font-medium">{variant.conversions?.toLocaleString() || 0}</span>
                          </div>
                          <Separator />
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Taxa de Conversão:</span>
                            <span className="font-bold text-lg">{convRate}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {/* Confiança Estatística */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Confiança Estatística</span>
                    <span className="text-lg font-bold">
                      {Math.round(calculateConfidence(selectedTest))}%
                    </span>
                  </div>
                  <Progress value={calculateConfidence(selectedTest)} className="h-3" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {calculateConfidence(selectedTest) >= 95 
                      ? "✅ Resultado estatisticamente significativo! Você pode implementar a variante vencedora."
                      : calculateConfidence(selectedTest) >= 80
                      ? "⚠️ Resultado promissor, mas continue coletando dados para maior confiança."
                      : "🔄 Continue o teste para obter resultados mais confiáveis."}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResultsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
