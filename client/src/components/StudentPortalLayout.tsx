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
import { 
  LogOut, 
  PanelLeft, 
  Calendar,
  CreditCard,
  Dumbbell,
  FileText,
  Activity,
  MessageCircle,
  Trophy,
  User,
  Home,
  ClipboardList
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "./ui/skeleton";

interface StudentData {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: string;
}

const menuItems = [
  { icon: Home, label: "Início", tab: "dashboard" },
  { icon: Activity, label: "Evolução", tab: "evolution" },
  { icon: Calendar, label: "Sessões", tab: "sessions" },
  { icon: Dumbbell, label: "Treinos", tab: "workouts" },
  { icon: FileText, label: "Diário", tab: "diary" },
  { icon: ClipboardList, label: "Anamnese", tab: "anamnesis" },
  { icon: CreditCard, label: "Pagamentos", tab: "payments" },
  { icon: MessageCircle, label: "Chat", tab: "chat" },
  { icon: Trophy, label: "Conquistas", tab: "badges" },
];

const SIDEBAR_WIDTH_KEY = "student-sidebar-width";
const DEFAULT_WIDTH = 240;
const MIN_WIDTH = 200;
const MAX_WIDTH = 320;

interface StudentPortalLayoutProps {
  children: React.ReactNode;
  studentData: StudentData | null;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export default function StudentPortalLayout({
  children,
  studentData,
  activeTab,
  onTabChange,
  onLogout,
}: StudentPortalLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (!studentData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-32" />
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
      <StudentPortalLayoutContent 
        setSidebarWidth={setSidebarWidth}
        studentData={studentData}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onLogout={onLogout}
      >
        {children}
      </StudentPortalLayoutContent>
    </SidebarProvider>
  );
}

type StudentPortalLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
  studentData: StudentData;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
};

function StudentPortalLayoutContent({
  children,
  setSidebarWidth,
  studentData,
  activeTab,
  onTabChange,
  onLogout,
}: StudentPortalLayoutContentProps) {
  // Query para mensagens não lidas do chat
  const { data: unreadCount } = trpc.studentPortal.unreadChatCount.useQuery(
    undefined,
    { refetchInterval: 30000 }
  );
  
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

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
                  <span className="font-bold tracking-tight truncate text-lg">
                    FitPrime
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 py-2">
            <SidebarMenu className="px-2 py-1 space-y-1">
              {menuItems.map(item => {
                const isActive = activeTab === item.tab;
                return (
                  <SidebarMenuItem key={item.tab}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => onTabChange(item.tab)}
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
                        {item.tab === "chat" && unreadCount && unreadCount > 0 && (
                          <Badge className="bg-red-500 text-white text-xs px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center">
                            {unreadCount > 99 ? "99+" : unreadCount}
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
                      {studentData.name?.charAt(0).toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-semibold truncate leading-none">
                      {studentData.name || "Aluno"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      Aluno
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-2">
                  <p className="text-sm font-medium">{studentData.name}</p>
                  <p className="text-xs text-muted-foreground">{studentData.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onTabChange('anamnesis')}
                  className="cursor-pointer"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>

          {/* Resize Handle */}
          {!isCollapsed && !isMobile && (
            <div
              className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-emerald-500/50 transition-colors z-50"
              onMouseDown={() => setIsResizing(true)}
            />
          )}
        </Sidebar>
      </div>

      <SidebarInset className="flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1 flex items-center justify-between">
            <div>
              <h1 className="font-semibold text-lg">
                {menuItems.find(item => item.tab === activeTab)?.label || "Portal do Aluno"}
              </h1>
              <p className="text-xs text-muted-foreground">Portal do Aluno</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {studentData.name}
              </span>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
