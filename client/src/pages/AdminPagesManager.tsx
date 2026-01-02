import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link, useLocation } from "wouter";
import { 
  FileText, 
  Plus, 
  RefreshCw, 
  MoreVertical,
  Eye,
  Edit,
  Copy,
  Trash2,
  ExternalLink,
  BarChart3,
  Globe,
  Lock,
  Unlock,
  ChevronLeft,
  Search,
  Settings,
  Layers,
  Layout,
  Palette,
  Link2,
  TrendingUp,
  Users,
  Clock,
  MousePointerClick
} from "lucide-react";
import { toast } from "sonner";

// Lista de páginas do sistema (será dinâmica no futuro)
const SYSTEM_PAGES = [
  { 
    id: "landing", 
    slug: "/", 
    name: "Landing Page", 
    type: "public",
    status: "published",
    views: 8500,
    conversions: 1200,
    bounceRate: 35,
    avgTime: "2:45",
    lastModified: "2025-01-02T10:30:00",
    editable: true
  },
  { 
    id: "quiz", 
    slug: "/quiz", 
    name: "Quiz de Qualificação", 
    type: "public",
    status: "published",
    views: 3200,
    conversions: 1850,
    bounceRate: 22,
    avgTime: "4:30",
    lastModified: "2025-01-01T15:20:00",
    editable: true
  },
  { 
    id: "quiz-resultado", 
    slug: "/quiz-resultado", 
    name: "Resultado do Quiz", 
    type: "public",
    status: "published",
    views: 1850,
    conversions: 1420,
    bounceRate: 18,
    avgTime: "3:15",
    lastModified: "2025-01-02T09:00:00",
    editable: true
  },
  { 
    id: "pricing", 
    slug: "/pricing", 
    name: "Página de Preços", 
    type: "public",
    status: "published",
    views: 1420,
    conversions: 290,
    bounceRate: 45,
    avgTime: "1:55",
    lastModified: "2024-12-30T14:00:00",
    editable: true
  },
  { 
    id: "cadastro-trial", 
    slug: "/cadastro-trial", 
    name: "Cadastro Trial", 
    type: "public",
    status: "published",
    views: 520,
    conversions: 380,
    bounceRate: 18,
    avgTime: "3:20",
    lastModified: "2025-01-02T11:00:00",
    editable: true
  },
  { 
    id: "checkout", 
    slug: "/checkout", 
    name: "Checkout", 
    type: "public",
    status: "published",
    views: 290,
    conversions: 145,
    bounceRate: 50,
    avgTime: "2:10",
    lastModified: "2024-12-28T16:30:00",
    editable: false
  },
  { 
    id: "planos", 
    slug: "/planos", 
    name: "Planos (Antigo)", 
    type: "public",
    status: "draft",
    views: 120,
    conversions: 15,
    bounceRate: 65,
    avgTime: "0:45",
    lastModified: "2024-12-15T10:00:00",
    editable: true
  },
];

export default function AdminPagesManager() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [pages, setPages] = useState(SYSTEM_PAGES);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNewPageDialog, setShowNewPageDialog] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [showSlugDialog, setShowSlugDialog] = useState(false);
  const [selectedPage, setSelectedPage] = useState<typeof SYSTEM_PAGES[0] | null>(null);
  const [newPageData, setNewPageData] = useState({ name: "", slug: "", template: "blank" });
  const [newSlug, setNewSlug] = useState("");
  
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

  const filteredPages = pages.filter(page => 
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simular refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Lista de páginas atualizada!");
    setIsRefreshing(false);
  };

  const handleDuplicate = (page: typeof SYSTEM_PAGES[0]) => {
    setSelectedPage(page);
    setNewPageData({
      name: `${page.name} (Cópia)`,
      slug: `${page.slug}-copy`,
      template: "blank"
    });
    setShowDuplicateDialog(true);
  };

  const handleChangeSlug = (page: typeof SYSTEM_PAGES[0]) => {
    setSelectedPage(page);
    setNewSlug(page.slug);
    setShowSlugDialog(true);
  };

  const handleToggleStatus = (pageId: string) => {
    setPages(pages.map(p => {
      if (p.id === pageId) {
        const newStatus = p.status === "published" ? "draft" : "published";
        toast.success(`Página ${newStatus === "published" ? "publicada" : "despublicada"}!`);
        return { ...p, status: newStatus };
      }
      return p;
    }));
  };

  const handleDelete = (pageId: string) => {
    if (confirm("Tem certeza que deseja excluir esta página?")) {
      setPages(pages.filter(p => p.id !== pageId));
      toast.success("Página excluída!");
    }
  };

  const handleCreatePage = () => {
    const newPage = {
      id: `page-${Date.now()}`,
      slug: newPageData.slug,
      name: newPageData.name,
      type: "public" as const,
      status: "draft" as const,
      views: 0,
      conversions: 0,
      bounceRate: 0,
      avgTime: "0:00",
      lastModified: new Date().toISOString(),
      editable: true
    };
    setPages([...pages, newPage]);
    setShowNewPageDialog(false);
    setNewPageData({ name: "", slug: "", template: "blank" });
    toast.success("Página criada! Abra o editor para personalizar.");
  };

  const handleConfirmDuplicate = () => {
    if (!selectedPage) return;
    const newPage = {
      ...selectedPage,
      id: `page-${Date.now()}`,
      slug: newPageData.slug,
      name: newPageData.name,
      status: "draft" as const,
      views: 0,
      conversions: 0,
      lastModified: new Date().toISOString(),
    };
    setPages([...pages, newPage]);
    setShowDuplicateDialog(false);
    toast.success("Página duplicada!");
  };

  const handleConfirmSlugChange = () => {
    if (!selectedPage) return;
    setPages(pages.map(p => {
      if (p.id === selectedPage.id) {
        return { ...p, slug: newSlug };
      }
      return p;
    }));
    setShowSlugDialog(false);
    toast.success("URL atualizada!");
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
                  <Layers className="h-5 w-5 text-emerald-600" />
                  Gerenciador de Páginas
                </h1>
                <p className="text-sm text-muted-foreground">Gerencie todas as páginas do seu site</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar páginas..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              
              <Button onClick={() => setShowNewPageDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Página
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* KPIs Gerais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pages.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Páginas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Globe className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pages.filter(p => p.status === "published").length}</p>
                  <p className="text-sm text-muted-foreground">Publicadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Eye className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pages.reduce((acc, p) => acc + p.views, 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Visitas Totais</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pages.reduce((acc, p) => acc + p.conversions, 0).toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Conversões</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Páginas */}
        <Card>
          <CardHeader>
            <CardTitle>Todas as Páginas</CardTitle>
            <CardDescription>
              Clique em uma página para ver detalhes ou use o menu de ações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Página</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Visitas</TableHead>
                  <TableHead className="text-right">Conversões</TableHead>
                  <TableHead className="text-right">Bounce</TableHead>
                  <TableHead className="text-right">Tempo Médio</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map((page) => (
                  <TableRow key={page.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Layout className="h-5 w-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium">{page.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Editado {new Date(page.lastModified).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">{page.slug}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={page.status === "published" ? "default" : "secondary"}>
                        {page.status === "published" ? (
                          <><Globe className="h-3 w-3 mr-1" /> Publicada</>
                        ) : (
                          <><Lock className="h-3 w-3 mr-1" /> Rascunho</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{page.views.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className="text-emerald-600 font-medium">{page.conversions.toLocaleString()}</span>
                      <span className="text-muted-foreground text-xs ml-1">
                        ({((page.conversions / page.views) * 100).toFixed(1)}%)
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={page.bounceRate > 50 ? "text-red-600" : page.bounceRate > 30 ? "text-amber-600" : "text-emerald-600"}>
                        {page.bounceRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{page.avgTime}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(page.slug, "_blank")}>
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </DropdownMenuItem>
                          {page.editable && (
                            <DropdownMenuItem onClick={() => setLocation(`/admin/editor/${page.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar Página
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => setLocation(`/admin/analytics?page=${page.slug}`)}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Ver Analytics
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDuplicate(page)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleChangeSlug(page)}>
                            <Link2 className="h-4 w-4 mr-2" />
                            Alterar URL
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(page.id)}>
                            {page.status === "published" ? (
                              <><Lock className="h-4 w-4 mr-2" /> Despublicar</>
                            ) : (
                              <><Unlock className="h-4 w-4 mr-2" /> Publicar</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDelete(page.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Dialog Nova Página */}
      <Dialog open={showNewPageDialog} onOpenChange={setShowNewPageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Página</DialogTitle>
            <DialogDescription>
              Crie uma nova página para seu site
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome da Página</Label>
              <Input 
                placeholder="Ex: Promoção de Verão"
                value={newPageData.name}
                onChange={(e) => setNewPageData({ ...newPageData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>URL (slug)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <Input 
                  placeholder="promocao-verao"
                  value={newPageData.slug}
                  onChange={(e) => setNewPageData({ ...newPageData, slug: `/${e.target.value.replace(/^\//, '')}` })}
                />
              </div>
            </div>
            <div>
              <Label>Template</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer text-center ${newPageData.template === 'blank' ? 'border-emerald-500 bg-emerald-50' : ''}`}
                  onClick={() => setNewPageData({ ...newPageData, template: 'blank' })}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm font-medium">Em Branco</p>
                </div>
                <div 
                  className={`p-4 border rounded-lg cursor-pointer text-center ${newPageData.template === 'landing' ? 'border-emerald-500 bg-emerald-50' : ''}`}
                  onClick={() => setNewPageData({ ...newPageData, template: 'landing' })}
                >
                  <Layout className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                  <p className="text-sm font-medium">Landing Page</p>
                </div>
                <div 
                  className={`p-4 border rounded-lg cursor-pointer text-center ${newPageData.template === 'promo' ? 'border-emerald-500 bg-emerald-50' : ''}`}
                  onClick={() => setNewPageData({ ...newPageData, template: 'promo' })}
                >
                  <Palette className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                  <p className="text-sm font-medium">Promoção</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewPageDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreatePage} disabled={!newPageData.name || !newPageData.slug}>
              Criar Página
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Duplicar Página */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicar Página</DialogTitle>
            <DialogDescription>
              Crie uma cópia de "{selectedPage?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome da Nova Página</Label>
              <Input 
                value={newPageData.name}
                onChange={(e) => setNewPageData({ ...newPageData, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Nova URL (slug)</Label>
              <Input 
                value={newPageData.slug}
                onChange={(e) => setNewPageData({ ...newPageData, slug: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmDuplicate}>
              <Copy className="h-4 w-4 mr-2" />
              Duplicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Alterar URL */}
      <Dialog open={showSlugDialog} onOpenChange={setShowSlugDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar URL</DialogTitle>
            <DialogDescription>
              Altere a URL de "{selectedPage?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nova URL (slug)</Label>
              <Input 
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-2">
                ⚠️ Alterar a URL pode quebrar links existentes
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSlugDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmSlugChange}>
              Salvar URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
