import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link, useParams } from "wouter";
import { 
  ChevronLeft, 
  RefreshCw, 
  Save,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Monitor,
  Smartphone,
  Tablet,
  Plus,
  Trash2,
  Copy,
  Move,
  Type,
  Image,
  Square,
  Layout,
  Columns,
  List,
  Star,
  MessageSquare,
  DollarSign,
  Users,
  CheckCircle,
  ArrowRight,
  Palette,
  Settings,
  Layers,
  GripVertical,
  ChevronUp,
  ChevronDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Link2,
  Upload,
  X,
  Maximize2,
  Minimize2,
  Play,
  Globe,
  Lock
} from "lucide-react";
import { toast } from "sonner";

// Tipos de blocos disponíveis
type BlockType = 
  | "hero" 
  | "features" 
  | "pricing" 
  | "testimonials" 
  | "faq" 
  | "cta" 
  | "text" 
  | "image" 
  | "video"
  | "divider"
  | "spacer"
  | "columns"
  | "stats"
  | "logos";

interface Block {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  styles: Record<string, any>;
}

interface PageData {
  id: string;
  name: string;
  slug: string;
  status: "draft" | "published";
  blocks: Block[];
  seo: {
    title: string;
    description: string;
    ogImage: string;
  };
  styles: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    fontFamily: string;
  };
}

// Templates de blocos
const BLOCK_TEMPLATES: Record<BlockType, { name: string; icon: any; defaultContent: Record<string, any> }> = {
  hero: {
    name: "Hero Section",
    icon: Layout,
    defaultContent: {
      title: "Título Principal",
      subtitle: "Subtítulo descritivo do seu produto ou serviço",
      buttonText: "Começar Agora",
      buttonLink: "/quiz",
      backgroundImage: "",
      alignment: "center"
    }
  },
  features: {
    name: "Features",
    icon: Star,
    defaultContent: {
      title: "Nossos Recursos",
      items: [
        { icon: "star", title: "Recurso 1", description: "Descrição do recurso 1" },
        { icon: "star", title: "Recurso 2", description: "Descrição do recurso 2" },
        { icon: "star", title: "Recurso 3", description: "Descrição do recurso 3" },
      ]
    }
  },
  pricing: {
    name: "Preços",
    icon: DollarSign,
    defaultContent: {
      title: "Nossos Planos",
      plans: [
        { name: "Básico", price: "R$ 97", features: ["Feature 1", "Feature 2"], highlighted: false },
        { name: "Pro", price: "R$ 197", features: ["Feature 1", "Feature 2", "Feature 3"], highlighted: true },
        { name: "Enterprise", price: "R$ 497", features: ["Tudo do Pro", "Suporte VIP"], highlighted: false },
      ]
    }
  },
  testimonials: {
    name: "Depoimentos",
    icon: MessageSquare,
    defaultContent: {
      title: "O que dizem nossos clientes",
      items: [
        { name: "João Silva", role: "Personal Trainer", text: "Excelente plataforma!", avatar: "" },
        { name: "Maria Santos", role: "Nutricionista", text: "Transformou meu negócio!", avatar: "" },
      ]
    }
  },
  faq: {
    name: "FAQ",
    icon: List,
    defaultContent: {
      title: "Perguntas Frequentes",
      items: [
        { question: "Como funciona?", answer: "Resposta detalhada aqui..." },
        { question: "Quanto custa?", answer: "Resposta detalhada aqui..." },
      ]
    }
  },
  cta: {
    name: "Call to Action",
    icon: ArrowRight,
    defaultContent: {
      title: "Pronto para começar?",
      subtitle: "Comece seu teste gratuito hoje",
      buttonText: "Começar Grátis",
      buttonLink: "/cadastro-trial",
      backgroundColor: "#10b981"
    }
  },
  text: {
    name: "Texto",
    icon: Type,
    defaultContent: {
      content: "<p>Digite seu texto aqui...</p>",
      alignment: "left"
    }
  },
  image: {
    name: "Imagem",
    icon: Image,
    defaultContent: {
      src: "",
      alt: "Descrição da imagem",
      caption: "",
      width: "100%"
    }
  },
  video: {
    name: "Vídeo",
    icon: Play,
    defaultContent: {
      url: "",
      autoplay: false,
      controls: true
    }
  },
  divider: {
    name: "Divisor",
    icon: Separator,
    defaultContent: {
      style: "line",
      color: "#e5e7eb"
    }
  },
  spacer: {
    name: "Espaçador",
    icon: Square,
    defaultContent: {
      height: 40
    }
  },
  columns: {
    name: "Colunas",
    icon: Columns,
    defaultContent: {
      columns: 2,
      gap: 24,
      items: [
        { content: "Coluna 1" },
        { content: "Coluna 2" },
      ]
    }
  },
  stats: {
    name: "Estatísticas",
    icon: Users,
    defaultContent: {
      items: [
        { value: "1000+", label: "Clientes" },
        { value: "50k+", label: "Treinos" },
        { value: "99%", label: "Satisfação" },
      ]
    }
  },
  logos: {
    name: "Logos",
    icon: CheckCircle,
    defaultContent: {
      title: "Empresas que confiam em nós",
      logos: []
    }
  }
};

// Paleta de cores predefinidas
const COLOR_PALETTE = [
  "#10b981", "#059669", "#047857", // Verdes
  "#3b82f6", "#2563eb", "#1d4ed8", // Azuis
  "#8b5cf6", "#7c3aed", "#6d28d9", // Roxos
  "#f59e0b", "#d97706", "#b45309", // Laranjas
  "#ef4444", "#dc2626", "#b91c1c", // Vermelhos
  "#ec4899", "#db2777", "#be185d", // Rosas
  "#6b7280", "#4b5563", "#374151", // Cinzas
  "#000000", "#ffffff", "#f3f4f6", // Preto/Branco
];

export default function AdminPageEditor() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ pageId: string }>();
  const pageId = params.pageId;
  
  // Estado da página
  const [pageData, setPageData] = useState<PageData>({
    id: pageId || "new",
    name: "Nova Página",
    slug: "/nova-pagina",
    status: "draft",
    blocks: [],
    seo: {
      title: "",
      description: "",
      ogImage: ""
    },
    styles: {
      primaryColor: "#10b981",
      secondaryColor: "#059669",
      backgroundColor: "#ffffff",
      fontFamily: "Inter"
    }
  });
  
  // Estados do editor
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<PageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  
  // Ref para o container de preview
  const previewRef = useRef<HTMLDivElement>(null);
  
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

  // Salvar no histórico
  const saveToHistory = useCallback((newData: PageData) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), newData]);
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setPageData(history[historyIndex - 1]);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setPageData(history[historyIndex + 1]);
    }
  };

  // Adicionar bloco
  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: { ...BLOCK_TEMPLATES[type].defaultContent },
      styles: {}
    };
    
    const newData = {
      ...pageData,
      blocks: [...pageData.blocks, newBlock]
    };
    
    setPageData(newData);
    saveToHistory(newData);
    setSelectedBlockId(newBlock.id);
    setShowBlockPicker(false);
    toast.success(`Bloco ${BLOCK_TEMPLATES[type].name} adicionado!`);
  };

  // Remover bloco
  const removeBlock = (blockId: string) => {
    const newData = {
      ...pageData,
      blocks: pageData.blocks.filter(b => b.id !== blockId)
    };
    
    setPageData(newData);
    saveToHistory(newData);
    setSelectedBlockId(null);
    toast.success("Bloco removido!");
  };

  // Duplicar bloco
  const duplicateBlock = (blockId: string) => {
    const blockIndex = pageData.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const block = pageData.blocks[blockIndex];
    const newBlock: Block = {
      ...block,
      id: `block-${Date.now()}`,
      content: { ...block.content }
    };
    
    const newBlocks = [...pageData.blocks];
    newBlocks.splice(blockIndex + 1, 0, newBlock);
    
    const newData = { ...pageData, blocks: newBlocks };
    setPageData(newData);
    saveToHistory(newData);
    setSelectedBlockId(newBlock.id);
    toast.success("Bloco duplicado!");
  };

  // Mover bloco
  const moveBlock = (blockId: string, direction: "up" | "down") => {
    const blockIndex = pageData.blocks.findIndex(b => b.id === blockId);
    if (blockIndex === -1) return;
    
    const newIndex = direction === "up" ? blockIndex - 1 : blockIndex + 1;
    if (newIndex < 0 || newIndex >= pageData.blocks.length) return;
    
    const newBlocks = [...pageData.blocks];
    [newBlocks[blockIndex], newBlocks[newIndex]] = [newBlocks[newIndex], newBlocks[blockIndex]];
    
    const newData = { ...pageData, blocks: newBlocks };
    setPageData(newData);
    saveToHistory(newData);
  };

  // Atualizar conteúdo do bloco
  const updateBlockContent = (blockId: string, key: string, value: any) => {
    const newData = {
      ...pageData,
      blocks: pageData.blocks.map(b => 
        b.id === blockId 
          ? { ...b, content: { ...b.content, [key]: value } }
          : b
      )
    };
    
    setPageData(newData);
  };

  // Salvar página
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Salvar no localStorage por enquanto
      const savedPages = JSON.parse(localStorage.getItem('editor_pages') || '{}');
      savedPages[pageData.id] = pageData;
      localStorage.setItem('editor_pages', JSON.stringify(savedPages));
      
      toast.success("Página salva com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar página");
    } finally {
      setIsSaving(false);
    }
  };

  // Publicar página
  const handlePublish = async () => {
    const newData = { ...pageData, status: "published" as const };
    setPageData(newData);
    await handleSave();
    toast.success("Página publicada!");
  };

  // Obter bloco selecionado
  const selectedBlock = pageData.blocks.find(b => b.id === selectedBlockId);

  // Largura do preview baseada no modo
  const previewWidth = previewMode === "desktop" ? "100%" : previewMode === "tablet" ? "768px" : "375px";

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header do Editor */}
      <header className="bg-white border-b px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/pages">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          
          <div className="flex items-center gap-2">
            <Input 
              value={pageData.name}
              onChange={(e) => setPageData({ ...pageData, name: e.target.value })}
              className="font-semibold border-none shadow-none focus-visible:ring-0 w-48"
            />
            <Badge variant={pageData.status === "published" ? "default" : "secondary"}>
              {pageData.status === "published" ? (
                <><Globe className="h-3 w-3 mr-1" /> Publicada</>
              ) : (
                <><Lock className="h-3 w-3 mr-1" /> Rascunho</>
              )}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleUndo}
            disabled={historyIndex <= 0}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Preview Mode */}
          <div className="flex items-center border rounded-lg">
            <Button 
              variant={previewMode === "desktop" ? "secondary" : "ghost"} 
              size="icon"
              className="rounded-r-none"
              onClick={() => setPreviewMode("desktop")}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button 
              variant={previewMode === "tablet" ? "secondary" : "ghost"} 
              size="icon"
              className="rounded-none border-x"
              onClick={() => setPreviewMode("tablet")}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button 
              variant={previewMode === "mobile" ? "secondary" : "ghost"} 
              size="icon"
              className="rounded-l-none"
              onClick={() => setPreviewMode("mobile")}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Preview Toggle */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showPreview ? "Editar" : "Preview"}
          </Button>
          
          {/* Settings */}
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Save/Publish */}
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
          <Button onClick={handlePublish} disabled={isSaving}>
            <Globe className="h-4 w-4 mr-2" />
            Publicar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de Blocos */}
        {!showPreview && (
          <aside className="w-64 bg-white border-r flex flex-col">
            <div className="p-4 border-b">
              <Button 
                className="w-full" 
                onClick={() => setShowBlockPicker(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Bloco
              </Button>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  Blocos da Página ({pageData.blocks.length})
                </p>
                
                {pageData.blocks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum bloco ainda</p>
                    <p className="text-xs">Clique em "Adicionar Bloco"</p>
                  </div>
                ) : (
                  pageData.blocks.map((block, index) => {
                    const template = BLOCK_TEMPLATES[block.type];
                    const Icon = template.icon;
                    
                    return (
                      <div
                        key={block.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all ${
                          selectedBlockId === block.id 
                            ? "border-emerald-500 bg-emerald-50" 
                            : "hover:border-gray-300"
                        }`}
                        onClick={() => setSelectedBlockId(block.id)}
                      >
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="flex-1 text-sm font-medium truncate">
                            {template.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "up"); }}
                              disabled={index === 0}
                            >
                              <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={(e) => { e.stopPropagation(); moveBlock(block.id, "down"); }}
                              disabled={index === pageData.blocks.length - 1}
                            >
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Canvas/Preview */}
        <main className="flex-1 overflow-auto p-6 flex justify-center">
          <div 
            ref={previewRef}
            className="bg-white shadow-xl rounded-lg overflow-hidden transition-all"
            style={{ 
              width: previewWidth, 
              maxWidth: "100%",
              minHeight: "600px"
            }}
          >
            {pageData.blocks.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Layout className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Página Vazia</p>
                  <p className="text-sm">Adicione blocos para começar a construir sua página</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setShowBlockPicker(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Bloco
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {pageData.blocks.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    showPreview={showPreview}
                    onSelect={() => setSelectedBlockId(block.id)}
                    onRemove={() => removeBlock(block.id)}
                    onDuplicate={() => duplicateBlock(block.id)}
                    pageStyles={pageData.styles}
                  />
                ))}
              </div>
            )}
          </div>
        </main>

        {/* Sidebar de Propriedades */}
        {!showPreview && selectedBlock && (
          <aside className="w-80 bg-white border-l overflow-auto">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Editar Bloco</h3>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setSelectedBlockId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {BLOCK_TEMPLATES[selectedBlock.type].name}
              </p>
            </div>
            
            <div className="p-4 space-y-4">
              <BlockPropertiesEditor
                block={selectedBlock}
                onUpdate={(key, value) => updateBlockContent(selectedBlock.id, key, value)}
              />
              
              <Separator />
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => duplicateBlock(selectedBlock.id)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-red-600 hover:text-red-700"
                  onClick={() => removeBlock(selectedBlock.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Dialog de Adicionar Bloco */}
      <Dialog open={showBlockPicker} onOpenChange={setShowBlockPicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Bloco</DialogTitle>
            <DialogDescription>
              Escolha um tipo de bloco para adicionar à sua página
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-3 gap-3 py-4">
            {(Object.entries(BLOCK_TEMPLATES) as [BlockType, typeof BLOCK_TEMPLATES[BlockType]][]).map(([type, template]) => {
              const Icon = template.icon;
              return (
                <div
                  key={type}
                  className="p-4 border rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all text-center"
                  onClick={() => addBlock(type)}
                >
                  <Icon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-medium text-sm">{template.name}</p>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Configurações */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configurações da Página</DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="styles">Estilos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-4">
              <div>
                <Label>Nome da Página</Label>
                <Input 
                  value={pageData.name}
                  onChange={(e) => setPageData({ ...pageData, name: e.target.value })}
                />
              </div>
              <div>
                <Label>URL (slug)</Label>
                <Input 
                  value={pageData.slug}
                  onChange={(e) => setPageData({ ...pageData, slug: e.target.value })}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="seo" className="space-y-4 mt-4">
              <div>
                <Label>Título SEO</Label>
                <Input 
                  value={pageData.seo.title}
                  onChange={(e) => setPageData({ 
                    ...pageData, 
                    seo: { ...pageData.seo, title: e.target.value }
                  })}
                  placeholder="Título para mecanismos de busca"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea 
                  value={pageData.seo.description}
                  onChange={(e) => setPageData({ 
                    ...pageData, 
                    seo: { ...pageData.seo, description: e.target.value }
                  })}
                  placeholder="Descrição para mecanismos de busca"
                />
              </div>
              <div>
                <Label>Imagem OG</Label>
                <Input 
                  value={pageData.seo.ogImage}
                  onChange={(e) => setPageData({ 
                    ...pageData, 
                    seo: { ...pageData.seo, ogImage: e.target.value }
                  })}
                  placeholder="URL da imagem para compartilhamento"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="styles" className="space-y-4 mt-4">
              <div>
                <Label>Cor Primária</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    type="color"
                    value={pageData.styles.primaryColor}
                    onChange={(e) => setPageData({ 
                      ...pageData, 
                      styles: { ...pageData.styles, primaryColor: e.target.value }
                    })}
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    value={pageData.styles.primaryColor}
                    onChange={(e) => setPageData({ 
                      ...pageData, 
                      styles: { ...pageData.styles, primaryColor: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div>
                <Label>Cor de Fundo</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    type="color"
                    value={pageData.styles.backgroundColor}
                    onChange={(e) => setPageData({ 
                      ...pageData, 
                      styles: { ...pageData.styles, backgroundColor: e.target.value }
                    })}
                    className="w-12 h-10 p-1"
                  />
                  <Input 
                    value={pageData.styles.backgroundColor}
                    onChange={(e) => setPageData({ 
                      ...pageData, 
                      styles: { ...pageData.styles, backgroundColor: e.target.value }
                    })}
                  />
                </div>
              </div>
              <div>
                <Label>Paleta de Cores</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COLOR_PALETTE.map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-lg border-2 border-transparent hover:border-gray-400 transition-all"
                      style={{ backgroundColor: color }}
                      onClick={() => setPageData({ 
                        ...pageData, 
                        styles: { ...pageData.styles, primaryColor: color }
                      })}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button onClick={() => setShowSettings(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para renderizar blocos
function BlockRenderer({ 
  block, 
  isSelected, 
  showPreview,
  onSelect, 
  onRemove, 
  onDuplicate,
  pageStyles 
}: { 
  block: Block; 
  isSelected: boolean;
  showPreview: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  pageStyles: PageData["styles"];
}) {
  const renderContent = () => {
    switch (block.type) {
      case "hero":
        return (
          <div 
            className="py-20 px-8 text-center"
            style={{ 
              backgroundColor: block.content.backgroundImage ? undefined : pageStyles.primaryColor + "10",
              backgroundImage: block.content.backgroundImage ? `url(${block.content.backgroundImage})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            <h1 className="text-4xl font-bold mb-4">{block.content.title}</h1>
            <p className="text-xl text-muted-foreground mb-8">{block.content.subtitle}</p>
            <Button size="lg" style={{ backgroundColor: pageStyles.primaryColor }}>
              {block.content.buttonText}
            </Button>
          </div>
        );
        
      case "features":
        return (
          <div className="py-16 px-8">
            <h2 className="text-3xl font-bold text-center mb-12">{block.content.title}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {block.content.items?.map((item: any, i: number) => (
                <div key={i} className="text-center">
                  <div 
                    className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center"
                    style={{ backgroundColor: pageStyles.primaryColor + "20" }}
                  >
                    <Star className="h-6 w-6" style={{ color: pageStyles.primaryColor }} />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        );
        
      case "cta":
        return (
          <div 
            className="py-16 px-8 text-center text-white"
            style={{ backgroundColor: block.content.backgroundColor || pageStyles.primaryColor }}
          >
            <h2 className="text-3xl font-bold mb-4">{block.content.title}</h2>
            <p className="text-xl opacity-90 mb-8">{block.content.subtitle}</p>
            <Button size="lg" variant="secondary">
              {block.content.buttonText}
            </Button>
          </div>
        );
        
      case "text":
        return (
          <div 
            className="py-8 px-8"
            style={{ textAlign: block.content.alignment as any }}
            dangerouslySetInnerHTML={{ __html: block.content.content }}
          />
        );
        
      case "spacer":
        return <div style={{ height: block.content.height }} />;
        
      case "divider":
        return (
          <div className="py-4 px-8">
            <hr style={{ borderColor: block.content.color }} />
          </div>
        );
        
      case "stats":
        return (
          <div className="py-16 px-8">
            <div className="grid grid-cols-3 gap-8 text-center">
              {block.content.items?.map((item: any, i: number) => (
                <div key={i}>
                  <p 
                    className="text-4xl font-bold"
                    style={{ color: pageStyles.primaryColor }}
                  >
                    {item.value}
                  </p>
                  <p className="text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        );
        
      default:
        return (
          <div className="py-8 px-8 text-center text-muted-foreground">
            <p>Bloco: {block.type}</p>
          </div>
        );
    }
  };

  return (
    <div 
      className={`relative group ${!showPreview ? 'cursor-pointer' : ''} ${
        isSelected && !showPreview ? 'ring-2 ring-emerald-500' : ''
      }`}
      onClick={!showPreview ? onSelect : undefined}
    >
      {renderContent()}
      
      {/* Overlay de ações (apenas no modo edição) */}
      {!showPreview && (
        <div className={`absolute top-2 right-2 flex gap-1 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
          <Button variant="secondary" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" className="h-8 w-8 text-red-600" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

// Componente para editar propriedades do bloco
function BlockPropertiesEditor({ 
  block, 
  onUpdate 
}: { 
  block: Block; 
  onUpdate: (key: string, value: any) => void;
}) {
  switch (block.type) {
    case "hero":
      return (
        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input 
              value={block.content.title}
              onChange={(e) => onUpdate("title", e.target.value)}
            />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Textarea 
              value={block.content.subtitle}
              onChange={(e) => onUpdate("subtitle", e.target.value)}
            />
          </div>
          <div>
            <Label>Texto do Botão</Label>
            <Input 
              value={block.content.buttonText}
              onChange={(e) => onUpdate("buttonText", e.target.value)}
            />
          </div>
          <div>
            <Label>Link do Botão</Label>
            <Input 
              value={block.content.buttonLink}
              onChange={(e) => onUpdate("buttonLink", e.target.value)}
            />
          </div>
          <div>
            <Label>Imagem de Fundo (URL)</Label>
            <Input 
              value={block.content.backgroundImage}
              onChange={(e) => onUpdate("backgroundImage", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>
      );
      
    case "cta":
      return (
        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input 
              value={block.content.title}
              onChange={(e) => onUpdate("title", e.target.value)}
            />
          </div>
          <div>
            <Label>Subtítulo</Label>
            <Input 
              value={block.content.subtitle}
              onChange={(e) => onUpdate("subtitle", e.target.value)}
            />
          </div>
          <div>
            <Label>Texto do Botão</Label>
            <Input 
              value={block.content.buttonText}
              onChange={(e) => onUpdate("buttonText", e.target.value)}
            />
          </div>
          <div>
            <Label>Cor de Fundo</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                type="color"
                value={block.content.backgroundColor}
                onChange={(e) => onUpdate("backgroundColor", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input 
                value={block.content.backgroundColor}
                onChange={(e) => onUpdate("backgroundColor", e.target.value)}
              />
            </div>
          </div>
        </div>
      );
      
    case "text":
      return (
        <div className="space-y-4">
          <div>
            <Label>Conteúdo</Label>
            <Textarea 
              value={block.content.content.replace(/<[^>]*>/g, '')}
              onChange={(e) => onUpdate("content", `<p>${e.target.value}</p>`)}
              rows={6}
            />
          </div>
          <div>
            <Label>Alinhamento</Label>
            <div className="flex gap-2 mt-1">
              <Button 
                variant={block.content.alignment === "left" ? "secondary" : "outline"} 
                size="icon"
                onClick={() => onUpdate("alignment", "left")}
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
              <Button 
                variant={block.content.alignment === "center" ? "secondary" : "outline"} 
                size="icon"
                onClick={() => onUpdate("alignment", "center")}
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
              <Button 
                variant={block.content.alignment === "right" ? "secondary" : "outline"} 
                size="icon"
                onClick={() => onUpdate("alignment", "right")}
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      );
      
    case "spacer":
      return (
        <div className="space-y-4">
          <div>
            <Label>Altura (px)</Label>
            <Input 
              type="number"
              value={block.content.height}
              onChange={(e) => onUpdate("height", parseInt(e.target.value) || 40)}
              min={10}
              max={200}
            />
          </div>
        </div>
      );
      
    default:
      return (
        <div className="text-center text-muted-foreground py-4">
          <p className="text-sm">Editor de propriedades em desenvolvimento</p>
        </div>
      );
  }
}
