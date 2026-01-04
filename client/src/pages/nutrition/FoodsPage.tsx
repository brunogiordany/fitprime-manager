import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { 
  Apple, 
  Search, 
  Plus, 
  ArrowLeft,
  Loader2,
  Database,
  Sparkles,
  Edit,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Info,
  Flame,
  Beef,
  Wheat,
  Droplet
} from "lucide-react";

export default function FoodsPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [source, setSource] = useState<"all" | "taco" | "usda" | "custom">("all");
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  
  // Form state para criar/editar alimento
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    subcategory: "",
    servingSize: "100",
    servingUnit: "g",
    householdMeasure: "",
    householdGrams: "",
    calories: "",
    protein: "",
    carbohydrates: "",
    fiber: "",
    totalFat: "",
    saturatedFat: "",
    sugar: "",
    sodium: "",
    notes: "",
  });

  // Queries
  const { data: foodsData, isLoading, refetch } = trpc.nutrition.foods.list.useQuery({
    search: search || undefined,
    category: category !== "all" ? category : undefined,
    source,
    page,
    limit: 20,
  });

  const { data: categories } = trpc.nutrition.foods.categories.useQuery();

  // Mutations
  const createFood = trpc.nutrition.foods.create.useMutation({
    onSuccess: () => {
      toast.success("Alimento criado com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar alimento");
    },
  });

  const updateFood = trpc.nutrition.foods.update.useMutation({
    onSuccess: () => {
      toast.success("Alimento atualizado com sucesso!");
      setSelectedFood(null);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar alimento");
    },
  });

  const deleteFood = trpc.nutrition.foods.delete.useMutation({
    onSuccess: () => {
      toast.success("Alimento excluído com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir alimento");
    },
  });

  const searchWithAI = trpc.nutrition.foods.searchWithAI.useMutation({
    onSuccess: (data) => {
      if (data) {
        setAiResult(data);
        toast.success("Informações encontradas!");
      } else {
        toast.error("Não foi possível encontrar informações para este alimento");
      }
      setIsSearchingAI(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro na busca com IA");
      setIsSearchingAI(false);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      subcategory: "",
      servingSize: "100",
      servingUnit: "g",
      householdMeasure: "",
      householdGrams: "",
      calories: "",
      protein: "",
      carbohydrates: "",
      fiber: "",
      totalFat: "",
      saturatedFat: "",
      sugar: "",
      sodium: "",
      notes: "",
    });
    setAiResult(null);
  };

  const handleCreate = () => {
    if (!formData.name || !formData.category) {
      toast.error("Nome e categoria são obrigatórios");
      return;
    }
    createFood.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedFood) return;
    updateFood.mutate({ id: selectedFood.id, ...formData });
  };

  const handleEdit = (food: any) => {
    setSelectedFood(food);
    setFormData({
      name: food.name || "",
      category: food.category || "",
      subcategory: food.subcategory || "",
      servingSize: food.servingSize || "100",
      servingUnit: food.servingUnit || "g",
      householdMeasure: food.householdMeasure || "",
      householdGrams: food.householdGrams || "",
      calories: food.calories || "",
      protein: food.protein || "",
      carbohydrates: food.carbohydrates || "",
      fiber: food.fiber || "",
      totalFat: food.totalFat || "",
      saturatedFat: food.saturatedFat || "",
      sugar: food.sugar || "",
      sodium: food.sodium || "",
      notes: food.notes || "",
    });
  };

  const handleAISearch = () => {
    if (!aiSearchQuery.trim()) {
      toast.error("Digite o nome do alimento para buscar");
      return;
    }
    setIsSearchingAI(true);
    searchWithAI.mutate({ query: aiSearchQuery });
  };

  const applyAIResult = () => {
    if (!aiResult) return;
    setFormData({
      ...formData,
      name: aiResult.name || formData.name,
      category: aiResult.category || formData.category,
      calories: aiResult.calories || formData.calories,
      protein: aiResult.protein || formData.protein,
      carbohydrates: aiResult.carbohydrates || formData.carbohydrates,
      fiber: aiResult.fiber || formData.fiber,
      totalFat: aiResult.totalFat || formData.totalFat,
      sugar: aiResult.sugar || formData.sugar,
      sodium: aiResult.sodium || formData.sodium,
    });
    setAiResult(null);
    toast.success("Dados aplicados ao formulário!");
  };

  const getSourceBadge = (src: string) => {
    switch (src) {
      case "taco":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">TACO</Badge>;
      case "usda":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">USDA</Badge>;
      case "custom":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">Personalizado</Badge>;
      default:
        return <Badge variant="outline">{src}</Badge>;
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
                <Apple className="h-6 w-6 text-green-600" />
                Banco de Alimentos
              </h1>
              <p className="text-muted-foreground">
                {foodsData?.total || 0} alimentos disponíveis
              </p>
            </div>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Alimento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Cadastrar Alimento</DialogTitle>
                <DialogDescription>
                  Adicione um alimento personalizado ao seu banco de dados
                </DialogDescription>
              </DialogHeader>
              
              {/* Busca com IA */}
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    Buscar com IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ex: Banana prata média"
                      value={aiSearchQuery}
                      onChange={(e) => setAiSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAISearch()}
                    />
                    <Button onClick={handleAISearch} disabled={isSearchingAI}>
                      {isSearchingAI ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  {aiResult && (
                    <div className="p-3 bg-white dark:bg-gray-900 rounded-lg border space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{aiResult.name}</span>
                        <Button size="sm" onClick={applyAIResult}>Aplicar</Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="text-center p-2 bg-orange-50 rounded">
                          <div className="font-bold text-orange-600">{aiResult.calories || "-"}</div>
                          <div className="text-muted-foreground">kcal</div>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded">
                          <div className="font-bold text-red-600">{aiResult.protein || "-"}g</div>
                          <div className="text-muted-foreground">Proteína</div>
                        </div>
                        <div className="text-center p-2 bg-amber-50 rounded">
                          <div className="font-bold text-amber-600">{aiResult.carbohydrates || "-"}g</div>
                          <div className="text-muted-foreground">Carbs</div>
                        </div>
                        <div className="text-center p-2 bg-yellow-50 rounded">
                          <div className="font-bold text-yellow-600">{aiResult.totalFat || "-"}g</div>
                          <div className="text-muted-foreground">Gordura</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do alimento"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Frutas, Carnes, Cereais"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Porção</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.servingSize}
                      onChange={(e) => setFormData({ ...formData, servingSize: e.target.value })}
                      placeholder="100"
                      className="w-20"
                    />
                    <Select value={formData.servingUnit} onValueChange={(v) => setFormData({ ...formData, servingUnit: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                        <SelectItem value="unidade">unidade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Medida Caseira</Label>
                  <Input
                    value={formData.householdMeasure}
                    onChange={(e) => setFormData({ ...formData, householdMeasure: e.target.value })}
                    placeholder="Ex: 1 colher de sopa"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Informações Nutricionais (por porção)</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Calorias (kcal)</Label>
                    <Input
                      type="number"
                      value={formData.calories}
                      onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Proteína (g)</Label>
                    <Input
                      type="number"
                      value={formData.protein}
                      onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Carboidratos (g)</Label>
                    <Input
                      type="number"
                      value={formData.carbohydrates}
                      onChange={(e) => setFormData({ ...formData, carbohydrates: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Gordura Total (g)</Label>
                    <Input
                      type="number"
                      value={formData.totalFat}
                      onChange={(e) => setFormData({ ...formData, totalFat: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Fibra (g)</Label>
                    <Input
                      type="number"
                      value={formData.fiber}
                      onChange={(e) => setFormData({ ...formData, fiber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Açúcar (g)</Label>
                    <Input
                      type="number"
                      value={formData.sugar}
                      onChange={(e) => setFormData({ ...formData, sugar: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Gordura Sat. (g)</Label>
                    <Input
                      type="number"
                      value={formData.saturatedFat}
                      onChange={(e) => setFormData({ ...formData, saturatedFat: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Sódio (mg)</Label>
                    <Input
                      type="number"
                      value={formData.sodium}
                      onChange={(e) => setFormData({ ...formData, sodium: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createFood.isPending}>
                  {createFood.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Cadastrar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar alimentos..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={source} onValueChange={(v: any) => { setSource(v); setPage(1); }}>
                <SelectTrigger className="w-[150px]">
                  <Database className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="taco">TACO</SelectItem>
                  <SelectItem value="usda">USDA</SelectItem>
                  <SelectItem value="custom">Personalizados</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories?.filter((cat): cat is string => cat !== null).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Alimentos */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : foodsData?.foods.length === 0 ? (
              <div className="text-center py-12">
                <Apple className="h-12 w-12 mx-auto text-muted-foreground/50" />
                <p className="mt-2 text-muted-foreground">Nenhum alimento encontrado</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar alimento
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Alimento</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Flame className="h-3 w-3 text-orange-500" />
                          kcal
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Beef className="h-3 w-3 text-red-500" />
                          Prot
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Wheat className="h-3 w-3 text-amber-500" />
                          Carb
                        </div>
                      </TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Droplet className="h-3 w-3 text-yellow-500" />
                          Gord
                        </div>
                      </TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {foodsData?.foods.map((food: any) => (
                      <TableRow key={food.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{food.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {food.servingSize}{food.servingUnit}
                              {food.householdMeasure && ` • ${food.householdMeasure}`}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{food.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">{food.calories || "-"}</TableCell>
                        <TableCell className="text-center">{food.protein || "-"}g</TableCell>
                        <TableCell className="text-center">{food.carbohydrates || "-"}g</TableCell>
                        <TableCell className="text-center">{food.totalFat || "-"}g</TableCell>
                        <TableCell>{getSourceBadge(food.source)}</TableCell>
                        <TableCell className="text-right">
                          {food.source === "custom" && (
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleEdit(food)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  if (confirm("Excluir este alimento?")) {
                                    deleteFood.mutate({ id: food.id });
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Paginação */}
                {foodsData && foodsData.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-muted-foreground">
                      Página {page} de {foodsData.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Anterior
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(foodsData.totalPages, p + 1))}
                        disabled={page === foodsData.totalPages}
                      >
                        Próxima
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Edição */}
        <Dialog open={!!selectedFood} onOpenChange={(open) => !open && setSelectedFood(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Alimento</DialogTitle>
              <DialogDescription>
                Atualize as informações do alimento
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Informações Nutricionais</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Calorias (kcal)</Label>
                  <Input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Proteína (g)</Label>
                  <Input
                    type="number"
                    value={formData.protein}
                    onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Carboidratos (g)</Label>
                  <Input
                    type="number"
                    value={formData.carbohydrates}
                    onChange={(e) => setFormData({ ...formData, carbohydrates: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Gordura Total (g)</Label>
                  <Input
                    type="number"
                    value={formData.totalFat}
                    onChange={(e) => setFormData({ ...formData, totalFat: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedFood(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={updateFood.isPending}>
                {updateFood.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
