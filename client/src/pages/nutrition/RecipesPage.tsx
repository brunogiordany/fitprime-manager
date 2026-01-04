import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { toast } from "sonner";
import { 
  ChefHat, 
  Search, 
  Plus, 
  ArrowLeft,
  Loader2,
  Edit,
  Trash2,
  Eye,
  Clock,
  Users,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Filter,
  MoreHorizontal,
  Copy
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const categories = [
  "Café da Manhã",
  "Almoço",
  "Jantar",
  "Lanches",
  "Sobremesas",
  "Bebidas",
  "Saladas",
  "Sopas",
  "Massas",
  "Carnes",
  "Peixes",
  "Vegetariano",
  "Vegano",
  "Low Carb",
  "Fitness",
];

export default function RecipesPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    servings: 1,
    prepTime: 0,
    cookTime: 0,
    instructions: "",
    tips: "",
    isPublic: false,
  });

  // Queries
  const { data: recipes, isLoading, refetch } = trpc.nutrition.recipes.list.useQuery({
    search: search || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  // Mutations
  const createRecipe = trpc.nutrition.recipes.create.useMutation({
    onSuccess: (data) => {
      toast.success("Receita criada com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      refetch();
      // Redirecionar para adicionar ingredientes
      if (data?.id) {
        setLocation(`/nutrition/receitas/${data.id}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar receita");
    },
  });

  const deleteRecipe = trpc.nutrition.recipes.delete.useMutation({
    onSuccess: () => {
      toast.success("Receita excluída com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir receita");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
      servings: 1,
      prepTime: 0,
      cookTime: 0,
      instructions: "",
      tips: "",
      isPublic: false,
    });
  };

  const handleCreate = () => {
    if (!formData.name || !formData.category) {
      toast.error("Nome e categoria são obrigatórios");
      return;
    }
    createRecipe.mutate({
      name: formData.name,
      description: formData.description,
      category: formData.category,
      servings: formData.servings,
      prepTime: formData.prepTime,
      cookTime: formData.cookTime,
      instructions: formData.instructions ? formData.instructions.split('\n').filter(Boolean) : [],
      tips: formData.tips,
      isPublic: formData.isPublic,
      ingredients: [], // Ingredientes serão adicionados depois
    });
  };

  const filteredRecipes = recipes?.recipes?.filter((recipe: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        recipe.name?.toLowerCase().includes(searchLower) ||
        recipe.description?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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
                <ChefHat className="h-6 w-6 text-orange-600" />
                Receitas
              </h1>
              <p className="text-muted-foreground">
                {recipes?.total || 0} receitas cadastradas
              </p>
            </div>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Receita
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Receita</DialogTitle>
                <DialogDescription>
                  Adicione uma nova receita à sua biblioteca
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Nome da Receita *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Frango grelhado com legumes"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Categoria *</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => setFormData({ ...formData, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Porções</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.servings}
                      onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tempo de Preparo (min)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.prepTime}
                      onChange={(e) => setFormData({ ...formData, prepTime: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tempo de Cozimento (min)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.cookTime}
                      onChange={(e) => setFormData({ ...formData, cookTime: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Uma breve descrição da receita..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Modo de Preparo</Label>
                  <Textarea
                    value={formData.instructions}
                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    placeholder="1. Primeiro passo...&#10;2. Segundo passo..."
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Dicas</Label>
                  <Textarea
                    value={formData.tips}
                    onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                    placeholder="Dicas para melhorar a receita..."
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={createRecipe.isPending}>
                  {createRecipe.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar e Adicionar Ingredientes
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
                    placeholder="Buscar receitas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Grid de Receitas */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !filteredRecipes || filteredRecipes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ChefHat className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="mt-2 text-muted-foreground">Nenhuma receita encontrada</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira receita
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes?.map((recipe: any) => (
              <Card 
                key={recipe.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setLocation(`/nutrition/receitas/${recipe.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{recipe.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-1">
                        {recipe.description || "Sem descrição"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/nutrition/receitas/${recipe.id}`);
                        }}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/nutrition/receitas/${recipe.id}/editar`);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          toast.info("Funcionalidade em desenvolvimento");
                        }}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Excluir esta receita?")) {
                              deleteRecipe.mutate({ id: recipe.id });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <Badge variant="secondary">{recipe.category}</Badge>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {(recipe.prepTime || 0) + (recipe.cookTime || 0)} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {recipe.servings} porções
                    </div>
                  </div>
                  
                  {/* Macros */}
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="text-center p-2 bg-orange-50 dark:bg-orange-950/30 rounded">
                      <Flame className="h-3 w-3 mx-auto text-orange-500 mb-1" />
                      <div className="font-bold">{recipe.totalCalories || "-"}</div>
                      <div className="text-muted-foreground">kcal</div>
                    </div>
                    <div className="text-center p-2 bg-red-50 dark:bg-red-950/30 rounded">
                      <Beef className="h-3 w-3 mx-auto text-red-500 mb-1" />
                      <div className="font-bold">{recipe.totalProtein || "-"}g</div>
                      <div className="text-muted-foreground">Prot</div>
                    </div>
                    <div className="text-center p-2 bg-amber-50 dark:bg-amber-950/30 rounded">
                      <Wheat className="h-3 w-3 mx-auto text-amber-500 mb-1" />
                      <div className="font-bold">{recipe.totalCarbs || "-"}g</div>
                      <div className="text-muted-foreground">Carb</div>
                    </div>
                    <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded">
                      <Droplet className="h-3 w-3 mx-auto text-yellow-500 mb-1" />
                      <div className="font-bold">{recipe.totalFat || "-"}g</div>
                      <div className="text-muted-foreground">Gord</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
