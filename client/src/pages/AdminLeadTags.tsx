import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { toast } from "sonner";
import { 
  Tag,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  ChevronLeft,
  Loader2,
  Users,
  Zap,
  Settings,
  Check,
  X
} from "lucide-react";

const TAG_COLORS = [
  { name: "Verde", value: "#10b981" },
  { name: "Azul", value: "#3b82f6" },
  { name: "Roxo", value: "#8b5cf6" },
  { name: "Laranja", value: "#f59e0b" },
  { name: "Vermelho", value: "#ef4444" },
  { name: "Ciano", value: "#06b6d4" },
  { name: "Rosa", value: "#ec4899" },
  { name: "Cinza", value: "#6b7280" },
  { name: "Índigo", value: "#6366f1" },
  { name: "Teal", value: "#14b8a6" },
];

const AUTO_RULE_FIELDS = [
  { value: "studentsCount", label: "Qtd. de Alunos" },
  { value: "revenue", label: "Faturamento" },
  { value: "recommendedProfile", label: "Perfil Recomendado" },
  { value: "priority", label: "Prioridade/Dor" },
  { value: "isQualified", label: "Qualificado" },
  { value: "convertedToTrial", label: "Converteu Trial" },
  { value: "convertedToPaid", label: "Converteu Pago" },
];

const AUTO_RULE_OPERATORS = [
  { value: "eq", label: "Igual a" },
  { value: "neq", label: "Diferente de" },
  { value: "contains", label: "Contém" },
];

interface TagFormData {
  name: string;
  color: string;
  description: string;
  isAutomatic: boolean;
  autoRule?: {
    field: string;
    operator: "eq" | "neq" | "contains" | "gt" | "lt";
    value: string;
  };
}

export default function AdminLeadTags() {
  const { user, loading: authLoading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<any>(null);
  const [formData, setFormData] = useState<TagFormData>({
    name: "",
    color: "#10b981",
    description: "",
    isAutomatic: false,
  });
  
  const utils = trpc.useUtils();
  
  // Buscar tags
  const { data: tags, isLoading, refetch } = trpc.conversionMetrics.listTags.useQuery();
  
  // Mutations
  const createTag = trpc.conversionMetrics.createTag.useMutation({
    onSuccess: () => {
      toast.success("Tag criada com sucesso!");
      setIsCreateOpen(false);
      resetForm();
      utils.conversionMetrics.listTags.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao criar tag: ${error.message}`);
    },
  });
  
  const updateTag = trpc.conversionMetrics.updateTag.useMutation({
    onSuccess: () => {
      toast.success("Tag atualizada com sucesso!");
      setEditingTag(null);
      resetForm();
      utils.conversionMetrics.listTags.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar tag: ${error.message}`);
    },
  });
  
  const deleteTag = trpc.conversionMetrics.deleteTag.useMutation({
    onSuccess: () => {
      toast.success("Tag excluída com sucesso!");
      utils.conversionMetrics.listTags.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao excluir tag: ${error.message}`);
    },
  });
  
  const createDefaultTags = trpc.conversionMetrics.createDefaultTags.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.conversionMetrics.listTags.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });
  
  const applyAutomaticTags = trpc.conversionMetrics.applyAutomaticTags.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.totalAssigned} tags aplicadas automaticamente!`);
      utils.conversionMetrics.listTags.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro ao aplicar tags: ${error.message}`);
    },
  });

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

  const resetForm = () => {
    setFormData({
      name: "",
      color: "#10b981",
      description: "",
      isAutomatic: false,
    });
  };

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error("Nome da tag é obrigatório");
      return;
    }
    
    createTag.mutate({
      name: formData.name,
      color: formData.color,
      description: formData.description || undefined,
      isAutomatic: formData.isAutomatic,
      autoRule: formData.isAutomatic && formData.autoRule ? formData.autoRule : undefined,
    });
  };

  const handleUpdate = () => {
    if (!editingTag) return;
    
    updateTag.mutate({
      id: editingTag.id,
      name: formData.name,
      color: formData.color,
      description: formData.description || undefined,
      isAutomatic: formData.isAutomatic,
      autoRule: formData.isAutomatic && formData.autoRule ? formData.autoRule : null,
    });
  };

  const handleDelete = (tagId: number) => {
    if (confirm("Tem certeza que deseja excluir esta tag? Todos os leads perderão esta tag.")) {
      deleteTag.mutate({ id: tagId });
    }
  };

  const openEditDialog = (tag: any) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      color: tag.color || "#10b981",
      description: tag.description || "",
      isAutomatic: tag.isAutomatic || false,
      autoRule: tag.autoRule ? JSON.parse(tag.autoRule) : undefined,
    });
  };

  const automaticTags = (tags || []).filter((t: any) => t.isAutomatic);
  const manualTags = (tags || []).filter((t: any) => !t.isAutomatic);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Tags de Leads</h1>
              <p className="text-gray-600 mt-2">Segmente leads com tags automáticas e manuais</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              variant="outline" 
              onClick={() => applyAutomaticTags.mutate()}
              disabled={applyAutomaticTags.isPending}
            >
              {applyAutomaticTags.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              Aplicar Tags Auto
            </Button>
            
            {(!tags || tags.length === 0) && (
              <Button 
                variant="outline" 
                onClick={() => createDefaultTags.mutate()}
                disabled={createDefaultTags.isPending}
              >
                {createDefaultTags.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                Criar Tags Padrão
              </Button>
            )}
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Tag</DialogTitle>
                  <DialogDescription>
                    Crie uma tag para segmentar seus leads
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome da Tag</Label>
                    <Input 
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Hot Lead"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex flex-wrap gap-2">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            formData.color === color.value ? "border-gray-900 scale-110" : "border-transparent"
                          }`}
                          style={{ backgroundColor: color.value }}
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Descrição (opcional)</Label>
                    <Textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição da tag..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Tag Automática</Label>
                      <p className="text-xs text-gray-500">Aplicar automaticamente baseado em regras</p>
                    </div>
                    <Switch 
                      checked={formData.isAutomatic}
                      onCheckedChange={(checked) => setFormData({ 
                        ...formData, 
                        isAutomatic: checked,
                        autoRule: checked ? { field: "studentsCount", operator: "eq", value: "" } : undefined
                      })}
                    />
                  </div>
                  
                  {formData.isAutomatic && (
                    <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium">Regra de Aplicação</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Select 
                          value={formData.autoRule?.field || "studentsCount"}
                          onValueChange={(v) => setFormData({ 
                            ...formData, 
                            autoRule: { ...formData.autoRule!, field: v } 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AUTO_RULE_FIELDS.map((f) => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select 
                          value={formData.autoRule?.operator || "eq"}
                          onValueChange={(v) => setFormData({ 
                            ...formData, 
                            autoRule: { ...formData.autoRule!, operator: v as any } 
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {AUTO_RULE_OPERATORS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Input 
                          value={formData.autoRule?.value || ""}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            autoRule: { ...formData.autoRule!, value: e.target.value } 
                          })}
                          placeholder="Valor"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Ex: Se "Qtd. de Alunos" é "Igual a" "over_30"
                      </p>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={createTag.isPending}>
                    {createTag.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Criar Tag
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <>
            {/* Tags Automáticas */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Tags Automáticas</CardTitle>
                </div>
                <CardDescription>
                  Tags aplicadas automaticamente baseado nas respostas do quiz
                </CardDescription>
              </CardHeader>
              <CardContent>
                {automaticTags.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma tag automática criada ainda. Clique em "Criar Tags Padrão" para começar.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {automaticTags.map((tag: any) => (
                      <div 
                        key={tag.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color || "#6b7280" }}
                          />
                          <div>
                            <p className="font-medium">{tag.name}</p>
                            <p className="text-xs text-gray-500">
                              <Users className="h-3 w-3 inline mr-1" />
                              {tag.leadCount || 0} leads
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(tag)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(tag.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags Manuais */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-blue-500" />
                  <CardTitle>Tags Manuais</CardTitle>
                </div>
                <CardDescription>
                  Tags que você aplica manualmente aos leads
                </CardDescription>
              </CardHeader>
              <CardContent>
                {manualTags.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    Nenhuma tag manual criada ainda. Clique em "Nova Tag" para criar.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {manualTags.map((tag: any) => (
                      <div 
                        key={tag.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tag.color || "#6b7280" }}
                          />
                          <div>
                            <p className="font-medium">{tag.name}</p>
                            {tag.description && (
                              <p className="text-xs text-gray-500 max-w-[200px] truncate">
                                {tag.description}
                              </p>
                            )}
                            <p className="text-xs text-gray-500">
                              <Users className="h-3 w-3 inline mr-1" />
                              {tag.leadCount || 0} leads
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => openEditDialog(tag)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(tag.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">Resumo de Tags</h3>
                    <p className="text-gray-600 mt-1">
                      {(tags || []).length} tags criadas • {automaticTags.length} automáticas • {manualTags.length} manuais
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{(tags || []).length}</div>
                      <div className="text-xs text-gray-500">Total de Tags</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{automaticTags.length}</div>
                      <div className="text-xs text-gray-500">Automáticas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {(tags || []).reduce((sum: number, t: any) => sum + (t.leadCount || 0), 0)}
                      </div>
                      <div className="text-xs text-gray-500">Leads Tagueados</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Dialog de Edição */}
        <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tag</DialogTitle>
              <DialogDescription>
                Atualize as informações da tag
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Tag</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Hot Lead"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Cor</Label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        formData.color === color.value ? "border-gray-900 scale-110" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Descrição (opcional)</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da tag..."
                  rows={2}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tag Automática</Label>
                  <p className="text-xs text-gray-500">Aplicar automaticamente baseado em regras</p>
                </div>
                <Switch 
                  checked={formData.isAutomatic}
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    isAutomatic: checked,
                    autoRule: checked ? { field: "studentsCount", operator: "eq", value: "" } : undefined
                  })}
                />
              </div>
              
              {formData.isAutomatic && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">Regra de Aplicação</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Select 
                      value={formData.autoRule?.field || "studentsCount"}
                      onValueChange={(v) => setFormData({ 
                        ...formData, 
                        autoRule: { ...formData.autoRule!, field: v } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTO_RULE_FIELDS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={formData.autoRule?.operator || "eq"}
                      onValueChange={(v) => setFormData({ 
                        ...formData, 
                        autoRule: { ...formData.autoRule!, operator: v as any } 
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTO_RULE_OPERATORS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Input 
                      value={formData.autoRule?.value || ""}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        autoRule: { ...formData.autoRule!, value: e.target.value } 
                      })}
                      placeholder="Valor"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTag(null)}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={updateTag.isPending}>
                {updateTag.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
