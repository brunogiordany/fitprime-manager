import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Search,
  // Ícones de Interface
  Home, Settings, User, Users, Bell, Mail, Phone, Calendar, Clock, 
  Search as SearchIcon, Filter, Menu, X, Plus, Minus, Check, ChevronRight,
  ChevronLeft, ChevronUp, ChevronDown, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  // Ícones de Mídia
  Image, Video, Music, Play, Pause, Volume2, VolumeX, Mic, Camera,
  // Ícones de Arquivos
  File, FileText, Folder, Download, Upload, Trash2, Edit, Copy, Save,
  // Ícones de Comunicação
  MessageSquare, MessageCircle, Send, Share2, Link2, ExternalLink,
  // Ícones de Negócios
  DollarSign, CreditCard, ShoppingCart, ShoppingBag, Package, Truck, Store,
  BarChart3, TrendingUp, TrendingDown, PieChart, Activity,
  // Ícones de Fitness/Saúde
  Heart, Dumbbell, Timer, Target, Award, Trophy, Medal, Flame, Zap,
  // Ícones de Natureza
  Sun, Moon, Cloud, CloudRain, Leaf, Flower2, Mountain, Waves,
  // Ícones de Tecnologia
  Laptop, Smartphone, Tablet, Monitor, Wifi, Bluetooth, Battery, Cpu,
  // Ícones de Social
  ThumbsUp, ThumbsDown, Star, Bookmark, Flag, Eye, EyeOff,
  // Ícones de Segurança
  Lock, Unlock, Shield, Key, AlertTriangle, AlertCircle, Info, HelpCircle,
  // Ícones de Localização
  MapPin, Navigation, Compass, Globe,
  // Ícones de Tempo
  Hourglass, Repeat, RefreshCw, RotateCw, RotateCcw,
  // Outros
  Gift, Sparkles, Lightbulb, Rocket, Crown, Gem, Wand2, Palette
} from "lucide-react";

interface IconLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIconSelect: (iconName: string, iconComponent: React.ReactNode) => void;
}

// Categorias de ícones
const ICON_CATEGORIES = {
  interface: {
    name: "Interface",
    icons: {
      Home, Settings, User, Users, Bell, Mail, Phone, Calendar, Clock,
      Search: SearchIcon, Filter, Menu, X, Plus, Minus, Check, 
      ChevronRight, ChevronLeft, ChevronUp, ChevronDown,
      ArrowRight, ArrowLeft, ArrowUp, ArrowDown
    }
  },
  media: {
    name: "Mídia",
    icons: {
      Image, Video, Music, Play, Pause, Volume2, VolumeX, Mic, Camera
    }
  },
  files: {
    name: "Arquivos",
    icons: {
      File, FileText, Folder, Download, Upload, Trash2, Edit, Copy, Save
    }
  },
  communication: {
    name: "Comunicação",
    icons: {
      MessageSquare, MessageCircle, Send, Share2, Link2, ExternalLink
    }
  },
  business: {
    name: "Negócios",
    icons: {
      DollarSign, CreditCard, ShoppingCart, ShoppingBag, Package, Truck, Store,
      BarChart3, TrendingUp, TrendingDown, PieChart, Activity
    }
  },
  fitness: {
    name: "Fitness & Saúde",
    icons: {
      Heart, Dumbbell, Timer, Target, Award, Trophy, Medal, Flame, Zap
    }
  },
  nature: {
    name: "Natureza",
    icons: {
      Sun, Moon, Cloud, CloudRain, Leaf, Flower2, Mountain, Waves
    }
  },
  tech: {
    name: "Tecnologia",
    icons: {
      Laptop, Smartphone, Tablet, Monitor, Wifi, Bluetooth, Battery, Cpu
    }
  },
  social: {
    name: "Social",
    icons: {
      ThumbsUp, ThumbsDown, Star, Bookmark, Flag, Eye, EyeOff
    }
  },
  security: {
    name: "Segurança",
    icons: {
      Lock, Unlock, Shield, Key, AlertTriangle, AlertCircle, Info, HelpCircle
    }
  },
  location: {
    name: "Localização",
    icons: {
      MapPin, Navigation, Compass, Globe
    }
  },
  time: {
    name: "Tempo",
    icons: {
      Hourglass, Repeat, RefreshCw, RotateCw, RotateCcw
    }
  },
  other: {
    name: "Outros",
    icons: {
      Gift, Sparkles, Lightbulb, Rocket, Crown, Gem, Wand2, Palette
    }
  }
};

// Todos os ícones em um objeto plano para busca
const ALL_ICONS = Object.values(ICON_CATEGORIES).reduce((acc, category) => {
  return { ...acc, ...category.icons };
}, {} as Record<string, any>);

export function IconLibrary({ open, onOpenChange, onIconSelect }: IconLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedSize, setSelectedSize] = useState(24);

  // Filtrar ícones baseado na busca
  const filteredIcons = useMemo(() => {
    const query = searchQuery.toLowerCase();
    
    if (selectedCategory === "all") {
      return Object.entries(ALL_ICONS).filter(([name]) => 
        name.toLowerCase().includes(query)
      );
    }
    
    const category = ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES];
    if (!category) return [];
    
    return Object.entries(category.icons).filter(([name]) => 
      name.toLowerCase().includes(query)
    );
  }, [searchQuery, selectedCategory]);

  const handleIconClick = (name: string, IconComponent: any) => {
    const iconElement = <IconComponent style={{ color: selectedColor, width: selectedSize, height: selectedSize }} />;
    onIconSelect(name, iconElement);
    onOpenChange(false);
  };

  const predefinedColors = [
    "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308", 
    "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#3b82f6",
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Biblioteca de Ícones
          </DialogTitle>
          <DialogDescription>
            Escolha um ícone para adicionar ao seu conteúdo
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Busca e Filtros */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar ícones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Seletor de cor */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Cor:</span>
              <div className="flex gap-1">
                {predefinedColors.slice(0, 8).map((color) => (
                  <button
                    key={color}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selectedColor === color ? 'border-emerald-500 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
                <input 
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-6 h-6 rounded cursor-pointer"
                />
              </div>
            </div>
            
            {/* Seletor de tamanho */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Tamanho:</span>
              <select 
                value={selectedSize}
                onChange={(e) => setSelectedSize(Number(e.target.value))}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value={16}>16px</option>
                <option value={20}>20px</option>
                <option value={24}>24px</option>
                <option value={32}>32px</option>
                <option value={48}>48px</option>
                <option value={64}>64px</option>
              </select>
            </div>
          </div>
          
          {/* Categorias */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
              {Object.entries(ICON_CATEGORIES).map(([key, category]) => (
                <TabsTrigger key={key} value={key} className="text-xs">
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          
          {/* Grid de ícones */}
          <ScrollArea className="h-[400px]">
            <div className="grid grid-cols-8 gap-2 p-1">
              {filteredIcons.map(([name, IconComponent]) => (
                <button
                  key={name}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg border hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  onClick={() => handleIconClick(name, IconComponent)}
                  title={name}
                >
                  <IconComponent 
                    className="transition-transform group-hover:scale-110"
                    style={{ 
                      color: selectedColor, 
                      width: Math.min(selectedSize, 32), 
                      height: Math.min(selectedSize, 32) 
                    }} 
                  />
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {name}
                  </span>
                </button>
              ))}
            </div>
            
            {filteredIcons.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum ícone encontrado</p>
                <p className="text-sm">Tente outra busca ou categoria</p>
              </div>
            )}
          </ScrollArea>
          
          {/* Preview */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Preview:</span>
              <div 
                className="p-4 bg-white rounded-lg border"
                style={{ backgroundColor: selectedColor === '#ffffff' ? '#f3f4f6' : 'white' }}
              >
                <Sparkles style={{ color: selectedColor, width: selectedSize, height: selectedSize }} />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {filteredIcons.length} ícones disponíveis
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default IconLibrary;
