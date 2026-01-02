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
import { trpc } from "@/lib/trpc";
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
  Lock,
  Sparkles,
  Wand2,
  Loader2,
  HelpCircle,
  FormInput,
  Timer,
  ListOrdered,
  Images
} from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SortableBlockItem } from "@/components/SortableBlockItem";

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
  | "logos"
  | "quiz"
  | "form"
  | "countdown"
  | "steps"
  | "gallery";

interface Block {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  styles: Record<string, any>;
  customScript?: string; // Script personalizado para o bloco
  delay?: number; // Delay em ms para animação/exibição
  syncWithVideo?: boolean; // Sincronizar com vídeo
  videoTimestamp?: number; // Timestamp do vídeo para sincronização
  videoId?: string; // ID do vídeo de referência para sincronização
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
  scripts: {
    headScript: string; // Scripts no <head>
    bodyStartScript: string; // Scripts no início do <body>
    bodyEndScript: string; // Scripts no final do <body>
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
  },
  quiz: {
    name: "Quiz",
    icon: HelpCircle,
    defaultContent: {
      title: "Descubra seu perfil",
      description: "Responda as perguntas para descobrir qual plano é ideal para você",
      questions: [
        {
          id: "q1",
          question: "Qual é seu objetivo principal?",
          type: "single",
          options: [
            { id: "a", text: "Perder peso", value: 1 },
            { id: "b", text: "Ganhar massa muscular", value: 2 },
            { id: "c", text: "Melhorar condicionamento", value: 3 }
          ]
        }
      ],
      results: [
        { minScore: 0, maxScore: 5, title: "Plano Básico", description: "Ideal para iniciantes" }
      ],
      buttonText: "Ver Resultado",
      redirectUrl: "/resultado"
    }
  },
  form: {
    name: "Formulário",
    icon: FormInput,
    defaultContent: {
      title: "Entre em contato",
      description: "Preencha o formulário e entraremos em contato",
      fields: [
        { name: "name", label: "Nome", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Telefone", type: "tel", required: false },
        { name: "message", label: "Mensagem", type: "textarea", required: false }
      ],
      buttonText: "Enviar",
      successMessage: "Mensagem enviada com sucesso!"
    }
  },
  countdown: {
    name: "Contador",
    icon: Timer,
    defaultContent: {
      title: "Oferta por tempo limitado!",
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      showDays: true,
      showHours: true,
      showMinutes: true,
      showSeconds: true,
      expiredMessage: "Oferta encerrada!"
    }
  },
  steps: {
    name: "Passos",
    icon: ListOrdered,
    defaultContent: {
      title: "Como funciona",
      items: [
        { step: 1, title: "Cadastre-se", description: "Crie sua conta em segundos" },
        { step: 2, title: "Escolha seu plano", description: "Selecione o melhor para você" },
        { step: 3, title: "Comece a treinar", description: "Acesse seus treinos imediatamente" }
      ]
    }
  },
  gallery: {
    name: "Galeria",
    icon: Images,
    defaultContent: {
      title: "Galeria de Fotos",
      images: [],
      columns: 3
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
  
  // Buscar dados da página do banco
  const { data: dbPage, isLoading: pageLoading } = trpc.sitePages.getById.useQuery(
    { id: Number(pageId) },
    { enabled: !!pageId && pageId !== "new" }
  );
  
  // Mutations
  const updatePageMutation = trpc.sitePages.update.useMutation({
    onSuccess: () => {
      toast.success("Página salva com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar página");
    }
  });
  
  const publishMutation = trpc.sitePages.publish.useMutation({
    onSuccess: () => {
      toast.success("Página publicada!");
    }
  });
  
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
    },
    scripts: {
      headScript: "",
      bodyStartScript: "",
      bodyEndScript: ""
    }
  });
  
  // Carregar dados da página do banco quando disponível
  useEffect(() => {
    if (dbPage) {
      const blocks = dbPage.blocks ? JSON.parse(dbPage.blocks as string) : [];
      const seo = dbPage.metaTitle || dbPage.metaDescription ? {
        title: dbPage.metaTitle || "",
        description: dbPage.metaDescription || "",
        ogImage: dbPage.ogImage || ""
      } : pageData.seo;
      
      setPageData({
        id: String(dbPage.id),
        name: dbPage.name,
        slug: dbPage.slug,
        status: dbPage.status as "draft" | "published",
        blocks,
        seo,
        styles: pageData.styles,
        scripts: pageData.scripts
      });
    }
  }, [dbPage]);
  
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
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAIPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Ref para o container de preview
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Sensors para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handler para drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = pageData.blocks.findIndex(b => b.id === active.id);
      const newIndex = pageData.blocks.findIndex(b => b.id === over.id);
      
      const newBlocks = arrayMove(pageData.blocks, oldIndex, newIndex);
      const newData = { ...pageData, blocks: newBlocks };
      
      setPageData(newData);
      saveToHistory(newData);
      toast.success("Bloco reordenado!");
    }
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
  
  // Atalhos de teclado para Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Z ou Cmd+Z para Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (historyIndex > 0) {
          setHistoryIndex(prev => prev - 1);
          setPageData(history[historyIndex - 1]);
          toast.info("Desfeito!");
        }
      }
      
      // Ctrl+Y ou Cmd+Shift+Z para Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          setHistoryIndex(prev => prev + 1);
          setPageData(history[historyIndex + 1]);
          toast.info("Refeito!");
        }
      }
      
      // Ctrl+S para Salvar
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      
      // Delete para remover bloco selecionado
      if (e.key === 'Delete' && selectedBlockId && !e.target?.toString().includes('Input')) {
        e.preventDefault();
        removeBlock(selectedBlockId);
      }
      
      // Escape para desselecionar bloco
      if (e.key === 'Escape') {
        setSelectedBlockId(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history, selectedBlockId]);

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
      if (pageId && pageId !== "new") {
        await updatePageMutation.mutateAsync({
          id: Number(pageId),
          name: pageData.name,
          slug: pageData.slug,
          blocks: JSON.stringify(pageData.blocks),
          metaTitle: pageData.seo.title,
          metaDescription: pageData.seo.description,
          ogImage: pageData.seo.ogImage
        });
      } else {
        // Salvar no localStorage para páginas novas (temporário)
        const savedPages = JSON.parse(localStorage.getItem('editor_pages') || '{}');
        savedPages[pageData.id] = pageData;
        localStorage.setItem('editor_pages', JSON.stringify(savedPages));
        toast.success("Página salva localmente!");
      }
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
    if (pageId && pageId !== "new") {
      await publishMutation.mutateAsync({ id: Number(pageId) });
    }
  };

  // Gerar página com IA
  // Mutation para gerar com IA
  const generateWithAIMutation = trpc.sitePages.generateWithAI.useMutation({
    onSuccess: (data) => {
      setPageData(prev => ({
        ...prev,
        blocks: data.blocks as Block[]
      }));
      setShowAIGenerator(false);
      setAIPrompt("");
      toast.success("Página gerada com sucesso! Edite os blocos conforme necessário.");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao gerar página com IA");
    }
  });

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Digite uma descrição para a página");
      return;
    }
    
    setIsGenerating(true);
    try {
      await generateWithAIMutation.mutateAsync({ prompt: aiPrompt });
    } finally {
      setIsGenerating(false);
    }
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
          
          {/* Gerar com IA */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAIGenerator(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Gerar com IA
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={pageData.blocks.map(b => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {pageData.blocks.map((block, index) => {
                        const template = BLOCK_TEMPLATES[block.type];
                        const Icon = template.icon;
                        
                        return (
                          <SortableBlockItem
                            key={block.id}
                            id={block.id}
                            isSelected={selectedBlockId === block.id}
                            onClick={() => setSelectedBlockId(block.id)}
                            onMoveUp={() => moveBlock(block.id, "up")}
                            onMoveDown={() => moveBlock(block.id, "down")}
                            canMoveUp={index > 0}
                            canMoveDown={index < pageData.blocks.length - 1}
                          >
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 text-sm font-medium truncate">
                              {template.name}
                            </span>
                          </SortableBlockItem>
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Canvas/Preview */}
        <main className="flex-1 overflow-auto p-6 flex justify-center">
          <div 
            ref={previewRef}
            className="bg-white shadow-xl rounded-lg overflow-y-auto transition-all"
            style={{ 
              width: previewWidth, 
              maxWidth: "100%",
              minHeight: "600px",
              maxHeight: "calc(100vh - 150px)"
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
              
              {/* Seção de Delay e Animação */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Animação e Delay
                </h4>
                
                <div>
                  <Label className="text-xs">Delay de Exibição (ms)</Label>
                  <Input 
                    type="number"
                    min="0"
                    step="100"
                    value={selectedBlock.delay || 0}
                    onChange={(e) => {
                      const newBlocks = pageData.blocks.map(b => 
                        b.id === selectedBlock.id 
                          ? { ...b, delay: Number(e.target.value) }
                          : b
                      );
                      setPageData({ ...pageData, blocks: newBlocks });
                    }}
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Tempo em milissegundos antes de exibir o bloco
                  </p>
                </div>
                
                <div>
                  <Label className="text-xs">Tipo de Animação</Label>
                  <Select
                    value={selectedBlock.styles?.animation || 'none'}
                    onValueChange={(value) => {
                      const newBlocks = pageData.blocks.map(b => 
                        b.id === selectedBlock.id 
                          ? { ...b, styles: { ...b.styles, animation: value } }
                          : b
                      );
                      setPageData({ ...pageData, blocks: newBlocks });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      <SelectItem value="fadeIn">Fade In</SelectItem>
                      <SelectItem value="fadeInUp">Fade In Up</SelectItem>
                      <SelectItem value="fadeInDown">Fade In Down</SelectItem>
                      <SelectItem value="fadeInLeft">Fade In Left</SelectItem>
                      <SelectItem value="fadeInRight">Fade In Right</SelectItem>
                      <SelectItem value="zoomIn">Zoom In</SelectItem>
                      <SelectItem value="bounceIn">Bounce In</SelectItem>
                      <SelectItem value="slideInUp">Slide In Up</SelectItem>
                      <SelectItem value="slideInDown">Slide In Down</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Duração da Animação (ms)</Label>
                  <Input 
                    type="number"
                    min="100"
                    step="100"
                    value={selectedBlock.styles?.animationDuration || 500}
                    onChange={(e) => {
                      const newBlocks = pageData.blocks.map(b => 
                        b.id === selectedBlock.id 
                          ? { ...b, styles: { ...b.styles, animationDuration: Number(e.target.value) } }
                          : b
                      );
                      setPageData({ ...pageData, blocks: newBlocks });
                    }}
                    placeholder="500"
                  />
                </div>
              </div>
              
              <Separator />
              
              {/* Seção de Sincronização com Vídeo */}
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Sincronização com Vídeo
                </h4>
                
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selectedBlock.syncWithVideo || false}
                    onCheckedChange={(checked) => {
                      const newBlocks = pageData.blocks.map(b => 
                        b.id === selectedBlock.id 
                          ? { ...b, syncWithVideo: checked }
                          : b
                      );
                      setPageData({ ...pageData, blocks: newBlocks });
                    }}
                  />
                  <Label className="text-xs">Sincronizar com vídeo</Label>
                </div>
                
                {selectedBlock.syncWithVideo && (
                  <>
                    <div>
                      <Label className="text-xs">ID do Vídeo de Referência</Label>
                      <Select
                        value={selectedBlock.videoId || ''}
                        onValueChange={(value) => {
                          const newBlocks = pageData.blocks.map(b => 
                            b.id === selectedBlock.id 
                              ? { ...b, videoId: value }
                              : b
                          );
                          setPageData({ ...pageData, blocks: newBlocks });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um vídeo" />
                        </SelectTrigger>
                        <SelectContent>
                          {pageData.blocks
                            .filter(b => b.type === 'video')
                            .map(b => (
                              <SelectItem key={b.id} value={b.id}>
                                Vídeo: {b.content.url?.substring(0, 30)}...
                              </SelectItem>
                            ))
                          }
                          {pageData.blocks.filter(b => b.type === 'video').length === 0 && (
                            <SelectItem value="" disabled>
                              Nenhum vídeo na página
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Timestamp do Vídeo (segundos)</Label>
                      <Input 
                        type="number"
                        min="0"
                        step="0.5"
                        value={selectedBlock.videoTimestamp || 0}
                        onChange={(e) => {
                          const newBlocks = pageData.blocks.map(b => 
                            b.id === selectedBlock.id 
                              ? { ...b, videoTimestamp: Number(e.target.value) }
                              : b
                          );
                          setPageData({ ...pageData, blocks: newBlocks });
                        }}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Momento do vídeo em que este bloco deve aparecer
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Ação ao Atingir Timestamp</Label>
                      <Select
                        value={selectedBlock.styles?.videoAction || 'show'}
                        onValueChange={(value) => {
                          const newBlocks = pageData.blocks.map(b => 
                            b.id === selectedBlock.id 
                              ? { ...b, styles: { ...b.styles, videoAction: value } }
                              : b
                          );
                          setPageData({ ...pageData, blocks: newBlocks });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="show">Mostrar bloco</SelectItem>
                          <SelectItem value="hide">Esconder bloco</SelectItem>
                          <SelectItem value="highlight">Destacar bloco</SelectItem>
                          <SelectItem value="animate">Animar bloco</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>
              
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="styles">Estilos</TabsTrigger>
              <TabsTrigger value="scripts">Scripts</TabsTrigger>
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
            
            <TabsContent value="scripts" className="space-y-4 mt-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>Atenção:</strong> Scripts personalizados são executados na página. Use com cuidado.
              </div>
              <div>
                <Label>Scripts no &lt;head&gt;</Label>
                <Textarea 
                  value={pageData.scripts.headScript}
                  onChange={(e) => setPageData({ 
                    ...pageData, 
                    scripts: { ...pageData.scripts, headScript: e.target.value }
                  })}
                  placeholder="<!-- Google Analytics, Facebook Pixel, etc -->"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label>Scripts no início do &lt;body&gt;</Label>
                <Textarea 
                  value={pageData.scripts.bodyStartScript}
                  onChange={(e) => setPageData({ 
                    ...pageData, 
                    scripts: { ...pageData.scripts, bodyStartScript: e.target.value }
                  })}
                  placeholder="<!-- GTM noscript, etc -->"
                  rows={3}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <Label>Scripts no final do &lt;body&gt;</Label>
                <Textarea 
                  value={pageData.scripts.bodyEndScript}
                  onChange={(e) => setPageData({ 
                    ...pageData, 
                    scripts: { ...pageData.scripts, bodyEndScript: e.target.value }
                  })}
                  placeholder="<!-- Chat widgets, scripts de conversão, etc -->"
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button onClick={() => setShowSettings(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog do Gerador com IA */}
      <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Gerar Página com IA
            </DialogTitle>
            <DialogDescription>
              Descreva a página que você quer criar e a IA vai gerar os blocos automaticamente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Descreva sua página</Label>
              <Textarea 
                value={aiPrompt}
                onChange={(e) => setAIPrompt(e.target.value)}
                placeholder="Ex: Crie uma landing page para um personal trainer que oferece treinos online. Inclua seção hero com chamada impactante, benefícios do serviço, depoimentos de clientes, preços dos planos e FAQ."
                rows={5}
                className="mt-2"
              />
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Dicas para melhores resultados:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Descreva o objetivo da página</li>
                <li>• Mencione as seções que deseja (hero, benefícios, preços, FAQ, etc)</li>
                <li>• Inclua informações sobre seu negócio/produto</li>
                <li>• Especifique o tom de voz (profissional, casual, urgente)</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAIPrompt("Crie uma landing page de vendas para um curso online de fitness. Inclua hero com oferta, benefícios, depoimentos, módulos do curso, garantia e CTA de compra.")}
              >
                Curso Online
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAIPrompt("Crie uma página de captura de leads para personal trainer. Inclua hero com promessa, benefícios do treino personalizado, formulário de contato e depoimentos.")}
              >
                Captura de Leads
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setAIPrompt("Crie uma página de obrigado após cadastro. Inclua mensagem de confirmação, próximos passos, links para redes sociais e CTA para agendar consulta.")}
              >
                Página Obrigado
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAIGenerator(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleGenerateWithAI}
              disabled={isGenerating || !aiPrompt.trim()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isGenerating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
              ) : (
                <><Wand2 className="h-4 w-4 mr-2" /> Gerar Página</>
              )}
            </Button>
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

      case "pricing":
        return (
          <div className="py-16 px-8">
            <h2 className="text-3xl font-bold text-center mb-12">{block.content.title}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {block.content.plans?.map((plan: any, i: number) => (
                <div 
                  key={i} 
                  className={`p-6 rounded-xl border-2 ${plan.highlighted ? 'border-emerald-500 shadow-lg scale-105' : 'border-gray-200'}`}
                >
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold" style={{ color: pageStyles.primaryColor }}>R$ {plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period || 'mês'}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features?.map((feature: string, fi: number) => (
                      <li key={fi} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full" style={{ backgroundColor: plan.highlighted ? pageStyles.primaryColor : undefined }} variant={plan.highlighted ? "default" : "outline"}>
                    Escolher Plano
                  </Button>
                </div>
              ))}
            </div>
          </div>
        );

      case "testimonials":
        return (
          <div className="py-16 px-8 bg-gray-50">
            <h2 className="text-3xl font-bold text-center mb-12">{block.content.title}</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {block.content.items?.map((item: any, i: number) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: pageStyles.primaryColor }}
                    >
                      {item.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.role}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic">"{item.text}"</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "faq":
        return (
          <div className="py-16 px-8">
            <h2 className="text-3xl font-bold text-center mb-12">{block.content.title}</h2>
            <div className="max-w-2xl mx-auto space-y-4">
              {block.content.items?.map((item: any, i: number) => (
                <div key={i} className="border rounded-lg p-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" style={{ color: pageStyles.primaryColor }} />
                    {item.question}
                  </h4>
                  <p className="text-muted-foreground mt-2 pl-7">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case "logos":
        return (
          <div className="py-12 px-8">
            <h2 className="text-xl font-semibold text-center mb-8 text-muted-foreground">{block.content.title}</h2>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {block.content.logos?.length > 0 ? (
                block.content.logos.map((logo: string, i: number) => (
                  <img key={i} src={logo} alt={`Logo ${i + 1}`} className="h-12 grayscale hover:grayscale-0 transition-all" />
                ))
              ) : (
                <p className="text-muted-foreground">Adicione logos de empresas parceiras</p>
              )}
            </div>
          </div>
        );

      case "quiz":
        return (
          <div className="py-16 px-8 bg-gradient-to-br from-emerald-50 to-white">
            <div className="max-w-2xl mx-auto text-center">
              <HelpCircle className="h-16 w-16 mx-auto mb-4" style={{ color: pageStyles.primaryColor }} />
              <h2 className="text-3xl font-bold mb-4">{block.content.title}</h2>
              <p className="text-muted-foreground mb-8">{block.content.description}</p>
              <div className="bg-white rounded-xl shadow-lg p-6 text-left">
                <p className="text-sm text-muted-foreground mb-2">Pergunta 1 de {block.content.questions?.length || 0}</p>
                <h3 className="text-xl font-semibold mb-4">{block.content.questions?.[0]?.question || 'Pergunta de exemplo'}</h3>
                <div className="space-y-2">
                  {block.content.questions?.[0]?.options?.map((opt: any, i: number) => (
                    <button key={i} className="w-full p-3 text-left border rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                      {opt.text}
                    </button>
                  ))}
                </div>
              </div>
              <Button className="mt-6" style={{ backgroundColor: pageStyles.primaryColor }}>
                {block.content.buttonText || 'Próxima'}
              </Button>
            </div>
          </div>
        );

      case "form":
        return (
          <div className="py-16 px-8">
            <div className="max-w-md mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">{block.content.title}</h2>
              <p className="text-muted-foreground text-center mb-8">{block.content.description}</p>
              <div className="space-y-4">
                {block.content.fields?.map((field: any, i: number) => (
                  <div key={i}>
                    <Label>{field.label} {field.required && <span className="text-red-500">*</span>}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea placeholder={field.label} className="mt-1" />
                    ) : (
                      <Input type={field.type} placeholder={field.label} className="mt-1" />
                    )}
                  </div>
                ))}
                <Button className="w-full" style={{ backgroundColor: pageStyles.primaryColor }}>
                  {block.content.buttonText || 'Enviar'}
                </Button>
              </div>
            </div>
          </div>
        );

      case "countdown":
        return (
          <div className="py-12 px-8 text-center" style={{ backgroundColor: pageStyles.primaryColor + '10' }}>
            <h2 className="text-2xl font-bold mb-6">{block.content.title}</h2>
            <div className="flex justify-center gap-4">
              {block.content.showDays && (
                <div className="bg-white rounded-lg p-4 shadow-sm min-w-[80px]">
                  <p className="text-3xl font-bold" style={{ color: pageStyles.primaryColor }}>00</p>
                  <p className="text-sm text-muted-foreground">Dias</p>
                </div>
              )}
              {block.content.showHours && (
                <div className="bg-white rounded-lg p-4 shadow-sm min-w-[80px]">
                  <p className="text-3xl font-bold" style={{ color: pageStyles.primaryColor }}>00</p>
                  <p className="text-sm text-muted-foreground">Horas</p>
                </div>
              )}
              {block.content.showMinutes && (
                <div className="bg-white rounded-lg p-4 shadow-sm min-w-[80px]">
                  <p className="text-3xl font-bold" style={{ color: pageStyles.primaryColor }}>00</p>
                  <p className="text-sm text-muted-foreground">Min</p>
                </div>
              )}
              {block.content.showSeconds && (
                <div className="bg-white rounded-lg p-4 shadow-sm min-w-[80px]">
                  <p className="text-3xl font-bold" style={{ color: pageStyles.primaryColor }}>00</p>
                  <p className="text-sm text-muted-foreground">Seg</p>
                </div>
              )}
            </div>
          </div>
        );

      case "steps":
        return (
          <div className="py-16 px-8">
            <h2 className="text-3xl font-bold text-center mb-12">{block.content.title}</h2>
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                {block.content.items?.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 mb-8 last:mb-0">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                      style={{ backgroundColor: pageStyles.primaryColor }}
                    >
                      {item.step || i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case "gallery":
        return (
          <div className="py-16 px-8">
            <h2 className="text-3xl font-bold text-center mb-12">{block.content.title}</h2>
            <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${block.content.columns || 3}, 1fr)` }}>
              {block.content.images?.length > 0 ? (
                block.content.images.map((img: string, i: number) => (
                  <img key={i} src={img} alt={`Imagem ${i + 1}`} className="w-full h-48 object-cover rounded-lg" />
                ))
              ) : (
                Array.from({ length: block.content.columns || 3 }).map((_, i) => (
                  <div key={i} className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Images className="h-8 w-8 text-gray-400" />
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "image":
        return (
          <div className="py-8 px-8">
            {block.content.src ? (
              <img 
                src={block.content.src} 
                alt={block.content.alt || 'Imagem'} 
                className="max-w-full mx-auto rounded-lg"
                style={{ maxHeight: block.content.maxHeight || '400px' }}
              />
            ) : (
              <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Adicione uma imagem</p>
              </div>
            )}
          </div>
        );

      case "video":
        return (
          <div className="py-8 px-8">
            {block.content.url ? (
              <div className="aspect-video max-w-3xl mx-auto">
                <iframe 
                  src={block.content.url.replace('watch?v=', 'embed/')} 
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="aspect-video max-w-3xl mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                <Play className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>
        );

      case "columns":
        return (
          <div className="py-8 px-8">
            <div className={`grid gap-6`} style={{ gridTemplateColumns: `repeat(${block.content.columns || 2}, 1fr)` }}>
              {Array.from({ length: block.content.columns || 2 }).map((_, i) => (
                <div key={i} className="p-4 border border-dashed rounded-lg min-h-[100px] flex items-center justify-center text-muted-foreground">
                  Coluna {i + 1}
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
      
    case "features":
      return (
        <div className="space-y-4">
          <div>
            <Label>Título da Seção</Label>
            <Input 
              value={block.content.title}
              onChange={(e) => onUpdate("title", e.target.value)}
            />
          </div>
          <Separator />
          <div>
            <Label>Recursos ({block.content.items?.length || 0})</Label>
            <div className="space-y-3 mt-2">
              {block.content.items?.map((item: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <Input 
                    placeholder="Título"
                    value={item.title}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, title: e.target.value };
                      onUpdate("items", newItems);
                    }}
                  />
                  <Textarea 
                    placeholder="Descrição"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, description: e.target.value };
                      onUpdate("items", newItems);
                    }}
                    rows={2}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => {
                      const newItems = block.content.items.filter((_: any, i: number) => i !== index);
                      onUpdate("items", newItems);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remover
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const newItems = [...(block.content.items || []), { icon: "star", title: "Novo Recurso", description: "Descrição" }];
                  onUpdate("items", newItems);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar Recurso
              </Button>
            </div>
          </div>
        </div>
      );
      
    case "pricing":
      return (
        <div className="space-y-4">
          <div>
            <Label>Título da Seção</Label>
            <Input 
              value={block.content.title}
              onChange={(e) => onUpdate("title", e.target.value)}
            />
          </div>
          <Separator />
          <div>
            <Label>Planos ({block.content.plans?.length || 0})</Label>
            <div className="space-y-3 mt-2">
              {block.content.plans?.map((plan: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <Input 
                    placeholder="Nome do Plano"
                    value={plan.name}
                    onChange={(e) => {
                      const newPlans = [...block.content.plans];
                      newPlans[index] = { ...plan, name: e.target.value };
                      onUpdate("plans", newPlans);
                    }}
                  />
                  <Input 
                    placeholder="Preço (ex: R$ 97)"
                    value={plan.price}
                    onChange={(e) => {
                      const newPlans = [...block.content.plans];
                      newPlans[index] = { ...plan, price: e.target.value };
                      onUpdate("plans", newPlans);
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={plan.highlighted}
                      onChange={(e) => {
                        const newPlans = [...block.content.plans];
                        newPlans[index] = { ...plan, highlighted: e.target.checked };
                        onUpdate("plans", newPlans);
                      }}
                    />
                    <Label className="text-sm">Destacar este plano</Label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
      
    case "testimonials":
      return (
        <div className="space-y-4">
          <div>
            <Label>Título da Seção</Label>
            <Input 
              value={block.content.title}
              onChange={(e) => onUpdate("title", e.target.value)}
            />
          </div>
          <Separator />
          <div>
            <Label>Depoimentos ({block.content.items?.length || 0})</Label>
            <div className="space-y-3 mt-2">
              {block.content.items?.map((item: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <Input 
                    placeholder="Nome"
                    value={item.name}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, name: e.target.value };
                      onUpdate("items", newItems);
                    }}
                  />
                  <Input 
                    placeholder="Cargo/Profissão"
                    value={item.role}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, role: e.target.value };
                      onUpdate("items", newItems);
                    }}
                  />
                  <Textarea 
                    placeholder="Depoimento"
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, text: e.target.value };
                      onUpdate("items", newItems);
                    }}
                    rows={3}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => {
                      const newItems = block.content.items.filter((_: any, i: number) => i !== index);
                      onUpdate("items", newItems);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remover
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const newItems = [...(block.content.items || []), { name: "Nome", role: "Profissão", text: "Depoimento...", avatar: "" }];
                  onUpdate("items", newItems);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar Depoimento
              </Button>
            </div>
          </div>
        </div>
      );
      
    case "faq":
      return (
        <div className="space-y-4">
          <div>
            <Label>Título da Seção</Label>
            <Input 
              value={block.content.title}
              onChange={(e) => onUpdate("title", e.target.value)}
            />
          </div>
          <Separator />
          <div>
            <Label>Perguntas ({block.content.items?.length || 0})</Label>
            <div className="space-y-3 mt-2">
              {block.content.items?.map((item: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <Input 
                    placeholder="Pergunta"
                    value={item.question}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, question: e.target.value };
                      onUpdate("items", newItems);
                    }}
                  />
                  <Textarea 
                    placeholder="Resposta"
                    value={item.answer}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, answer: e.target.value };
                      onUpdate("items", newItems);
                    }}
                    rows={3}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => {
                      const newItems = block.content.items.filter((_: any, i: number) => i !== index);
                      onUpdate("items", newItems);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remover
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const newItems = [...(block.content.items || []), { question: "Nova pergunta?", answer: "Resposta..." }];
                  onUpdate("items", newItems);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar Pergunta
              </Button>
            </div>
          </div>
        </div>
      );
      
    case "image":
      return (
        <div className="space-y-4">
          <div>
            <Label>URL da Imagem</Label>
            <Input 
              value={block.content.src}
              onChange={(e) => onUpdate("src", e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <Label>Texto Alternativo (Alt)</Label>
            <Input 
              value={block.content.alt}
              onChange={(e) => onUpdate("alt", e.target.value)}
            />
          </div>
          <div>
            <Label>Legenda</Label>
            <Input 
              value={block.content.caption}
              onChange={(e) => onUpdate("caption", e.target.value)}
            />
          </div>
          <div>
            <Label>Largura</Label>
            <Input 
              value={block.content.width}
              onChange={(e) => onUpdate("width", e.target.value)}
              placeholder="100% ou 500px"
            />
          </div>
        </div>
      );
      
    case "video":
      return (
        <div className="space-y-4">
          <div>
            <Label>URL do Vídeo (YouTube, Vimeo ou MP4)</Label>
            <Input 
              value={block.content.url}
              onChange={(e) => onUpdate("url", e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={block.content.autoplay}
              onChange={(e) => onUpdate("autoplay", e.target.checked)}
            />
            <Label className="text-sm">Autoplay</Label>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="checkbox"
              checked={block.content.controls}
              onChange={(e) => onUpdate("controls", e.target.checked)}
            />
            <Label className="text-sm">Mostrar controles</Label>
          </div>
        </div>
      );
      
    case "stats":
      return (
        <div className="space-y-4">
          <div>
            <Label>Estatísticas ({block.content.items?.length || 0})</Label>
            <div className="space-y-3 mt-2">
              {block.content.items?.map((item: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <Input 
                    placeholder="Valor (ex: 1000+)"
                    value={item.value}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, value: e.target.value };
                      onUpdate("items", newItems);
                    }}
                  />
                  <Input 
                    placeholder="Label (ex: Clientes)"
                    value={item.label}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, label: e.target.value };
                      onUpdate("items", newItems);
                    }}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600"
                    onClick={() => {
                      const newItems = block.content.items.filter((_: any, i: number) => i !== index);
                      onUpdate("items", newItems);
                    }}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Remover
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const newItems = [...(block.content.items || []), { value: "100+", label: "Novo" }];
                  onUpdate("items", newItems);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar Estatística
              </Button>
            </div>
          </div>
        </div>
      );
      
    case "divider":
      return (
        <div className="space-y-4">
          <div>
            <Label>Cor da Linha</Label>
            <div className="flex gap-2 mt-1">
              <Input 
                type="color"
                value={block.content.color}
                onChange={(e) => onUpdate("color", e.target.value)}
                className="w-12 h-10 p-1"
              />
              <Input 
                value={block.content.color}
                onChange={(e) => onUpdate("color", e.target.value)}
              />
            </div>
          </div>
        </div>
      );

    case "logos":
      return (
        <div className="space-y-4">
          <div>
            <Label>Título da Seção</Label>
            <Input 
              value={block.content.title}
              onChange={(e) => onUpdate("title", e.target.value)}
            />
          </div>
          <Separator />
          <div>
            <Label>Logos ({block.content.logos?.length || 0})</Label>
            <div className="space-y-2 mt-2">
              {block.content.logos?.map((logo: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    value={logo}
                    onChange={(e) => {
                      const newLogos = [...block.content.logos];
                      newLogos[index] = e.target.value;
                      onUpdate("logos", newLogos);
                    }}
                    placeholder="URL do logo"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-600 shrink-0"
                    onClick={() => {
                      const newLogos = block.content.logos.filter((_: any, i: number) => i !== index);
                      onUpdate("logos", newLogos);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const newLogos = [...(block.content.logos || []), ""];
                  onUpdate("logos", newLogos);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar Logo
              </Button>
            </div>
          </div>
        </div>
      );

    case "quiz":
      return (
        <div className="space-y-4">
          <div>
            <Label>Título do Quiz</Label>
            <Input 
              value={block.content.title}
              onChange={(e) => onUpdate("title", e.target.value)}
            />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea 
              value={block.content.description}
              onChange={(e) => onUpdate("description", e.target.value)}
              rows={2}
            />
          </div>
          <Separator />
          <div>
            <Label>Perguntas ({block.content.questions?.length || 0})</Label>
            <div className="space-y-3 mt-2">
              {block.content.questions?.map((q: any, qIndex: number) => (
                <div key={qIndex} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pergunta {qIndex + 1}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 h-6"
                      onClick={() => {
                        const newQuestions = block.content.questions.filter((_: any, i: number) => i !== qIndex);
                        onUpdate("questions", newQuestions);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input 
                    placeholder="Texto da pergunta"
                    value={q.question}
                    onChange={(e) => {
                      const newQuestions = [...block.content.questions];
                      newQuestions[qIndex] = { ...q, question: e.target.value };
                      onUpdate("questions", newQuestions);
                    }}
                  />
                  <div className="pl-2 space-y-1">
                    <Label className="text-xs">Opções:</Label>
                    {q.options?.map((opt: any, oIndex: number) => (
                      <div key={oIndex} className="flex gap-1">
                        <Input 
                          value={opt.text}
                          onChange={(e) => {
                            const newQuestions = [...block.content.questions];
                            newQuestions[qIndex].options[oIndex] = { ...opt, text: e.target.value };
                            onUpdate("questions", newQuestions);
                          }}
                          placeholder={`Opção ${oIndex + 1}`}
                          className="h-8 text-sm"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => {
                            const newQuestions = [...block.content.questions];
                            newQuestions[qIndex].options = q.options.filter((_: any, i: number) => i !== oIndex);
                            onUpdate("questions", newQuestions);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs"
                      onClick={() => {
                        const newQuestions = [...block.content.questions];
                        newQuestions[qIndex].options = [...(q.options || []), { id: `o${Date.now()}`, text: "", value: 1 }];
                        onUpdate("questions", newQuestions);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-1" /> Opção
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const newQuestions = [...(block.content.questions || []), { 
                    id: `q${Date.now()}`, 
                    question: "Nova pergunta?", 
                    type: "single",
                    options: [{ id: "a", text: "Opção A", value: 1 }] 
                  }];
                  onUpdate("questions", newQuestions);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar Pergunta
              </Button>
            </div>
          </div>
          <Separator />
          <div>
            <Label>Texto do Botão</Label>
            <Input 
              value={block.content.buttonText}
              onChange={(e) => onUpdate("buttonText", e.target.value)}
            />
          </div>
          <div>
            <Label>URL de Redirecionamento</Label>
            <Input 
              value={block.content.redirectUrl}
              onChange={(e) => onUpdate("redirectUrl", e.target.value)}
              placeholder="/resultado"
            />
          </div>
        </div>
      );

    case "form":
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
            <Label>Descrição</Label>
            <Textarea 
              value={block.content.description}
              onChange={(e) => onUpdate("description", e.target.value)}
              rows={2}
            />
          </div>
          <Separator />
          <div>
            <Label>Campos ({block.content.fields?.length || 0})</Label>
            <div className="space-y-2 mt-2">
              {block.content.fields?.map((field: any, index: number) => (
                <div key={index} className="p-2 border rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <Input 
                      value={field.label}
                      onChange={(e) => {
                        const newFields = [...block.content.fields];
                        newFields[index] = { ...field, label: e.target.value };
                        onUpdate("fields", newFields);
                      }}
                      placeholder="Label"
                      className="flex-1"
                    />
                    <select 
                      value={field.type}
                      onChange={(e) => {
                        const newFields = [...block.content.fields];
                        newFields[index] = { ...field, type: e.target.value };
                        onUpdate("fields", newFields);
                      }}
                      className="border rounded px-2 text-sm"
                    >
                      <option value="text">Texto</option>
                      <option value="email">Email</option>
                      <option value="tel">Telefone</option>
                      <option value="number">Número</option>
                      <option value="textarea">Texto Longo</option>
                    </select>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-600"
                      onClick={() => {
                        const newFields = block.content.fields.filter((_: any, i: number) => i !== index);
                        onUpdate("fields", newFields);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => {
                        const newFields = [...block.content.fields];
                        newFields[index] = { ...field, required: e.target.checked };
                        onUpdate("fields", newFields);
                      }}
                    />
                    <Label className="text-xs">Obrigatório</Label>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const newFields = [...(block.content.fields || []), { name: `field_${Date.now()}`, label: "Novo Campo", type: "text", required: false }];
                  onUpdate("fields", newFields);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar Campo
              </Button>
            </div>
          </div>
          <Separator />
          <div>
            <Label>Texto do Botão</Label>
            <Input 
              value={block.content.buttonText}
              onChange={(e) => onUpdate("buttonText", e.target.value)}
            />
          </div>
          <div>
            <Label>Mensagem de Sucesso</Label>
            <Input 
              value={block.content.successMessage}
              onChange={(e) => onUpdate("successMessage", e.target.value)}
            />
          </div>
        </div>
      );

    case "countdown":
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
            <Label>Data/Hora Alvo</Label>
            <Input 
              type="datetime-local"
              value={block.content.targetDate?.slice(0, 16)}
              onChange={(e) => onUpdate("targetDate", new Date(e.target.value).toISOString())}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Exibir:</Label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={block.content.showDays} onChange={(e) => onUpdate("showDays", e.target.checked)} />
                <Label className="text-sm">Dias</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={block.content.showHours} onChange={(e) => onUpdate("showHours", e.target.checked)} />
                <Label className="text-sm">Horas</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={block.content.showMinutes} onChange={(e) => onUpdate("showMinutes", e.target.checked)} />
                <Label className="text-sm">Minutos</Label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={block.content.showSeconds} onChange={(e) => onUpdate("showSeconds", e.target.checked)} />
                <Label className="text-sm">Segundos</Label>
              </div>
            </div>
          </div>
          <div>
            <Label>Mensagem quando expirar</Label>
            <Input 
              value={block.content.expiredMessage}
              onChange={(e) => onUpdate("expiredMessage", e.target.value)}
            />
          </div>
        </div>
      );

    case "steps":
      return (
        <div className="space-y-4">
          <div>
            <Label>Título da Seção</Label>
            <Input 
              value={block.content.title}
              onChange={(e) => onUpdate("title", e.target.value)}
            />
          </div>
          <Separator />
          <div>
            <Label>Passos ({block.content.items?.length || 0})</Label>
            <div className="space-y-3 mt-2">
              {block.content.items?.map((item: any, index: number) => (
                <div key={index} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <Input 
                      placeholder="Título do passo"
                      value={item.title}
                      onChange={(e) => {
                        const newItems = [...block.content.items];
                        newItems[index] = { ...item, title: e.target.value, step: index + 1 };
                        onUpdate("items", newItems);
                      }}
                      className="flex-1"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-red-600"
                      onClick={() => {
                        const newItems = block.content.items.filter((_: any, i: number) => i !== index);
                        onUpdate("items", newItems);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Textarea 
                    placeholder="Descrição"
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...block.content.items];
                      newItems[index] = { ...item, description: e.target.value };
                      onUpdate("items", newItems);
                    }}
                    rows={2}
                  />
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const newItems = [...(block.content.items || []), { step: (block.content.items?.length || 0) + 1, title: "Novo Passo", description: "Descrição do passo" }];
                  onUpdate("items", newItems);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar Passo
              </Button>
            </div>
          </div>
        </div>
      );

    case "gallery":
      return (
        <div className="space-y-4">
          <div>
            <Label>Título da Galeria</Label>
            <Input 
              value={block.content.title}
              onChange={(e) => onUpdate("title", e.target.value)}
            />
          </div>
          <div>
            <Label>Número de Colunas</Label>
            <select 
              value={block.content.columns || 3}
              onChange={(e) => onUpdate("columns", parseInt(e.target.value))}
              className="w-full border rounded px-3 py-2"
            >
              <option value={2}>2 Colunas</option>
              <option value={3}>3 Colunas</option>
              <option value={4}>4 Colunas</option>
            </select>
          </div>
          <Separator />
          <div>
            <Label>Imagens ({block.content.images?.length || 0})</Label>
            <div className="space-y-2 mt-2">
              {block.content.images?.map((img: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input 
                    value={img}
                    onChange={(e) => {
                      const newImages = [...block.content.images];
                      newImages[index] = e.target.value;
                      onUpdate("images", newImages);
                    }}
                    placeholder="URL da imagem"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="text-red-600 shrink-0"
                    onClick={() => {
                      const newImages = block.content.images.filter((_: any, i: number) => i !== index);
                      onUpdate("images", newImages);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  const newImages = [...(block.content.images || []), ""];
                  onUpdate("images", newImages);
                }}
              >
                <Plus className="h-3 w-3 mr-1" /> Adicionar Imagem
              </Button>
            </div>
          </div>
        </div>
      );

    case "columns":
      return (
        <div className="space-y-4">
          <div>
            <Label>Número de Colunas</Label>
            <select 
              value={block.content.columns || 2}
              onChange={(e) => onUpdate("columns", parseInt(e.target.value))}
              className="w-full border rounded px-3 py-2"
            >
              <option value={2}>2 Colunas</option>
              <option value={3}>3 Colunas</option>
              <option value={4}>4 Colunas</option>
            </select>
          </div>
          <p className="text-sm text-muted-foreground">
            Arraste blocos para dentro das colunas no preview.
          </p>
        </div>
      );
      
    default:
      return (
        <div className="text-center text-muted-foreground py-4">
          <p className="text-sm">Selecione um bloco para editar suas propriedades</p>
        </div>
      );
  }
}
