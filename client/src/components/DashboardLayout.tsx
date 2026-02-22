import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import { useIsMobile } from "@/hooks/useMobile";
import { useTheme, Theme, THEME_LABELS } from "@/contexts/ThemeContext";
import { 
  LayoutDashboard, 
  LogOut, 
  PanelLeft, 
  Users, 
  Calendar,
  CalendarCheck,
  CalendarClock,
  CreditCard,
  Dumbbell,
  MessageSquare,
  MessageCircle,
  Settings,
  FileText,
  Activity,
  Trash2,
  BarChart3,
  AlertTriangle,
  Shield,
  BookOpen,
  TrendingUp,
  HelpCircle,
  UserCircle,
  Bot,
  Phone,
  Apple,
  Sun,
  Moon,
  Sparkles,
  Palette,
  Check,
  Monitor
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { trpc } from "@/lib/trpc";
import { OfflineIndicator } from "./OfflineIndicator";
import SubscriptionBlocked from "@/pages/SubscriptionBlocked";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Alunos", path: "/alunos" },
  { icon: Calendar, label: "Agenda", path: "/agenda" },
  { icon: CalendarCheck, label: "Sessões", path: "/sessoes" },
  { icon: Dumbbell, label: "Treinos", path: "/treinos" },
  { icon: BookOpen, label: "Diário de Treino", path: "/diario-treino" },
  { icon: CalendarClock, label: "Agenda de Cobrança", path: "/cobrancas/agenda" },
  { icon: CreditCard, label: "Cobranças", path: "/cobrancas" },
  { icon: FileText, label: "Planos", path: "/planos" },
  { icon: BarChart3, label: "Relatórios", path: "/relatorios" },
  { icon: Activity, label: "Relatórios Cardio", path: "/relatorios-cardio" },
  { icon: AlertTriangle, label: "Alterações Pendentes", path: "/alteracoes-pendentes" },
  { icon: MessageSquare, label: "Automações", path: "/automacoes" },
  { icon: Bot, label: "IA de Atendimento", path: "/ia-atendimento" },
  { icon: Apple, label: "FitPrime Nutrition", path: "/nutrition", beta: true },
  { icon: MessageCircle, label: "Chat FitPrime", path: "/mensagens" },
  { icon: Phone, label: "WhatsApp Mensagens", path: "/whatsapp" },
  { icon: Activity, label: "WhatsApp Estatísticas", path: "/whatsapp-stats" },
  
  { icon: Shield, label: "Acessos do Aluno", path: "/acessos-aluno" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
  { icon: Trash2, label: "Lixeira", path: "/lixeira" },
  { icon: HelpCircle, label: "Suporte", path: "/suporte" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3">
              <img 
                src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663029814269/JkJfvTVxPfsIhRNt.png" 
                alt="FitPrime Manager" 
                className="h-16 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Faça login para acessar seu painel de gestão de alunos, treinos e cobranças.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = '/login-personal';
            }}
            size="lg"
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  
  // Verificação de status de pagamento da assinatura
  const { data: paymentStatus, isLoading: paymentLoading } = trpc.subscription.paymentStatus.useQuery(
    undefined,
    { 
      refetchInterval: 60000, // Verifica a cada 1 minuto
      staleTime: 30000 // Cache por 30 segundos
    }
  );
  
  // Query para mensagens não lidas do chat
  const { data: totalUnread } = trpc.chat.totalUnread.useQuery(
    undefined,
    { refetchInterval: 30000 } // Atualizar a cada 30 segundos
  );
  
  // Query para feature flags (controle de funcionalidades BETA)
  const { data: featureFlags } = trpc.personal.featureFlags.useQuery();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  // Todos os useEffects devem vir antes de qualquer return condicional
  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);
  
  // Se assinatura não está válida, mostrar tela de bloqueio (após todos os hooks e useEffects)
  if (!paymentLoading && paymentStatus && !paymentStatus.isValid) {
    return (
      <SubscriptionBlocked
        status={paymentStatus.status as 'overdue' | 'cancelled' | 'expired' | 'trial_expired'}
        daysOverdue={paymentStatus.daysOverdue}
        expiresAt={paymentStatus.expiresAt}
        message={paymentStatus.message}
      />
    );
  }

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-border/40"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center border-b border-border/40">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-10 w-10 flex items-center justify-center hover:bg-accent rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600"
                aria-label="Toggle navigation"
              >
                {isCollapsed ? (
                  <Dumbbell className="h-5 w-5 text-white" />
                ) : (
                  <PanelLeft className="h-5 w-5 text-white" />
                )}
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <img 
                    src="https://files.manuscdn.com/user_upload_by_module/session_file/310419663029814269/JkJfvTVxPfsIhRNt.png" 
                    alt="FitPrime" 
                    className="h-8 w-auto object-contain"
                  />
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 py-1 space-y-1">
              {menuItems
                .filter(item => {
                  // Filtrar itens beta baseado nas featureFlags
                  if (item.path === "/nutrition") {
                    return featureFlags?.nutritionBetaEnabled === true;
                  }
                  return true;
                })
                .map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-11 transition-all font-medium rounded-xl ${
                        isActive 
                          ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-700 dark:text-emerald-400" 
                          : "hover:bg-accent"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${isActive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                      />
                      <span className="flex items-center gap-2">
                        {item.label}
                        {item.path === "/mensagens" && totalUnread && totalUnread > 0 && (
                          <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                            {totalUnread > 99 ? "99+" : totalUnread}
                          </Badge>
                        )}
                        {(item as any).beta && (
                          <Badge variant="outline" className="text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-[10px] px-1 py-0">
                            BETA
                          </Badge>
                        )}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t border-border/40">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border-2 border-emerald-200 dark:border-emerald-800 shrink-0">
                    <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold truncate leading-none">
                      {user?.name || "Usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      Personal Trainer
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setLocation('/configuracoes')}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setLocation('/portal-aluno')}
                  className="cursor-pointer text-emerald-600 focus:text-emerald-600"
                >
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Logar como Aluno</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* Seletor de Tema */}
                <div className="px-2 py-1.5">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Palette className="h-3 w-3" />
                    Tema
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setTheme('auto')}
                      className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        theme === 'auto' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <Monitor className="h-3 w-3" />
                      Auto
                    </button>
                    <button
                      onClick={() => setTheme('white')}
                      className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        theme === 'white' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <Sun className="h-3 w-3" />
                      Claro
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        theme === 'dark' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <Moon className="h-3 w-3" />
                      Escuro
                    </button>
                    <button
                      onClick={() => setTheme('premium')}
                      className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        theme === 'premium' 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' 
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" />
                      Premium
                    </button>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-emerald-500/30 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset className="bg-gray-50/50 dark:bg-gray-900/50">
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">
                  {activeMenuItem?.label ?? "FitPrime"}
                </span>
              </div>
            </div>
            <OfflineIndicator variant="badge" />
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}
