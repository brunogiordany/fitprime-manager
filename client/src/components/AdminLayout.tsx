import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Users, 
  DollarSign, 
  Activity, 
  Phone, 
  Trash, 
  Settings,
  RefreshCw,
  BarChart3,
  Sliders,
  Mail,
  Target,
  TrendingUp,
  FileText,
  Palette,
  TestTube,
  LayoutDashboard,
  ArrowLeft,
  MessageCircle
} from "lucide-react";
import { Redirect, useLocation, Link } from "wouter";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  activeTab?: string;
}

export default function AdminLayout({ 
  children, 
  title, 
  description,
  activeTab 
}: AdminLayoutProps) {
  const auth = useAuth();
  const user = auth.user;
  const authLoading = auth.loading ?? false;
  const [location, setLocation] = useLocation();
  
  // Verificar se é owner
  const { data: ownerCheck, isLoading: ownerLoading } = trpc.admin.isOwner.useQuery(undefined, {
    enabled: !!user,
  });
  
  if (authLoading || ownerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Redirect if not owner
  if (!ownerCheck?.isOwner) {
    return <Redirect to="/dashboard" />;
  }
  
  const tabs = [
    { value: "overview", label: "Visão Geral", icon: BarChart3, path: "/admin" },
    { value: "personals", label: "Personais", icon: Users, path: "/admin" },
    { value: "features", label: "Features", icon: Sliders, path: "/admin" },
    { value: "subscriptions", label: "Assinaturas", icon: DollarSign, path: "/admin" },
    { value: "contacts", label: "Contatos", icon: Phone, path: "/admin" },
    { value: "activity", label: "Atividade", icon: Activity, path: "/admin" },
    { value: "trash", label: "Lixeira", icon: Trash, path: "/admin" },
    { value: "dns", label: "DNS/Email", icon: Settings, path: "/admin" },
  ];
  
  const adminPages = [
    { value: "leads", label: "Gestão de Leads", icon: Target, path: "/admin/leads" },
    { value: "email-automation", label: "Automação de Emails", icon: Mail, path: "/admin/email-automation" },
    { value: "emails", label: "Templates de Email", icon: FileText, path: "/admin/emails" },
    { value: "funil", label: "Funil de Vendas", icon: TrendingUp, path: "/admin/funil" },
    { value: "quiz", label: "Quiz Dashboard", icon: LayoutDashboard, path: "/admin/quiz" },
    { value: "analytics", label: "Analytics", icon: BarChart3, path: "/admin/analytics" },
    { value: "pages", label: "Páginas", icon: FileText, path: "/admin/pages" },
    { value: "pixels", label: "Pixels", icon: Palette, path: "/admin/pixels" },
    { value: "ab-testing", label: "A/B Testing", icon: TestTube, path: "/admin/ab-testing" },
    { value: "roi", label: "ROI Dashboard", icon: DollarSign, path: "/admin/roi" },
    { value: "whatsapp", label: "WhatsApp Admin", icon: MessageCircle, path: "/admin/whatsapp" },
  ];
  
  const handleTabChange = (value: string) => {
    const tab = tabs.find(t => t.value === value);
    if (tab) {
      setLocation(tab.path);
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin">
                <Button variant="ghost" size="icon" className="mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{title}</h1>
                <p className="text-sm text-muted-foreground">{description || "Painel de Administração"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Painel Principal
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="border-b bg-muted/30">
        <div className="container py-2">
          <div className="flex flex-wrap gap-2">
            {adminPages.map((page) => {
              const Icon = page.icon;
              const isActive = location === page.path || activeTab === page.value;
              return (
                <Link key={page.value} href={page.path}>
                  <Button 
                    variant={isActive ? "default" : "ghost"} 
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {page.label}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="container py-6">
        {children}
      </div>
    </div>
  );
}
