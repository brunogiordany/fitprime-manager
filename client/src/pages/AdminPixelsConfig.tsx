import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";
import { savePixelConfig, initializePixels } from "@/lib/tracking-pixels";
import { 
  ChevronLeft, 
  RefreshCw, 
  Save,
  CheckCircle,
  XCircle,
  ExternalLink,
  BarChart3,
  Facebook,
  Video,
  Settings,
  AlertTriangle,
  Info,
  Copy
} from "lucide-react";
import { toast } from "sonner";

// Ícone do Google
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// Ícone do TikTok
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  );
}

export default function AdminPixelsConfig() {
  const { user, loading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  
  // Estado dos pixels
  const [ga4Id, setGa4Id] = useState("");
  const [facebookPixelId, setFacebookPixelId] = useState("");
  const [tiktokPixelId, setTiktokPixelId] = useState("");
  
  // Estado de ativação
  const [ga4Enabled, setGa4Enabled] = useState(true);
  const [facebookEnabled, setFacebookEnabled] = useState(true);
  const [tiktokEnabled, setTiktokEnabled] = useState(true);
  
  // Carregar configuração salva
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tracking_pixels_config');
      if (stored) {
        const config = JSON.parse(stored);
        setGa4Id(config.ga4Id || "");
        setFacebookPixelId(config.facebookPixelId || "");
        setTiktokPixelId(config.tiktokPixelId || "");
      }
    } catch (e) {
      console.warn('Erro ao carregar configuração:', e);
    }
  }, []);
  
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

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const config = {
        ga4Id: ga4Enabled ? ga4Id : undefined,
        facebookPixelId: facebookEnabled ? facebookPixelId : undefined,
        tiktokPixelId: tiktokEnabled ? tiktokPixelId : undefined,
      };
      
      savePixelConfig(config);
      toast.success("Configurações salvas com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
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
                  <Settings className="h-5 w-5 text-emerald-600" />
                  Configuração de Pixels
                </h1>
                <p className="text-sm text-muted-foreground">GA4, Facebook Pixel e TikTok Ads</p>
              </div>
            </div>
            
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        {/* Aviso */}
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <p className="font-medium text-amber-800">Importante</p>
                <p className="text-sm text-amber-700">
                  Os pixels de tracking são essenciais para medir a efetividade das suas campanhas de marketing.
                  Configure cada pixel com o ID fornecido pela respectiva plataforma.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Google Analytics 4 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-white border rounded-lg flex items-center justify-center">
                  <GoogleIcon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Google Analytics 4
                    {ga4Id && ga4Enabled && (
                      <Badge variant="default" className="bg-emerald-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Rastreie visitantes, conversões e comportamento do usuário
                  </CardDescription>
                </div>
              </div>
              <Switch checked={ga4Enabled} onCheckedChange={setGa4Enabled} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Measurement ID (G-XXXXXXXXXX)</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  placeholder="G-XXXXXXXXXX"
                  value={ga4Id}
                  onChange={(e) => setGa4Id(e.target.value)}
                  disabled={!ga4Enabled}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(ga4Id, "ID")}
                  disabled={!ga4Id}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Encontre seu Measurement ID em: Google Analytics → Admin → Data Streams → Web
              </p>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Eventos rastreados: page_view, quiz_started, quiz_completed, trial_created, checkout_completed</span>
              </div>
              <Button variant="link" size="sm" asChild>
                <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">
                  Abrir GA4 <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Facebook Pixel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Facebook className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Facebook Pixel
                    {facebookPixelId && facebookEnabled && (
                      <Badge variant="default" className="bg-emerald-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Remarketing e conversões para Facebook e Instagram Ads
                  </CardDescription>
                </div>
              </div>
              <Switch checked={facebookEnabled} onCheckedChange={setFacebookEnabled} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pixel ID</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  placeholder="XXXXXXXXXXXXXXXX"
                  value={facebookPixelId}
                  onChange={(e) => setFacebookPixelId(e.target.value)}
                  disabled={!facebookEnabled}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(facebookPixelId, "ID")}
                  disabled={!facebookPixelId}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Encontre seu Pixel ID em: Meta Business Suite → Events Manager → Data Sources
              </p>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Eventos: PageView, Lead, CompleteRegistration, AddToCart, Purchase</span>
              </div>
              <Button variant="link" size="sm" asChild>
                <a href="https://business.facebook.com/events_manager" target="_blank" rel="noopener noreferrer">
                  Abrir Events Manager <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* TikTok Pixel */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-black rounded-lg flex items-center justify-center">
                  <TikTokIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    TikTok Pixel
                    {tiktokPixelId && tiktokEnabled && (
                      <Badge variant="default" className="bg-emerald-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Remarketing e conversões para TikTok Ads
                  </CardDescription>
                </div>
              </div>
              <Switch checked={tiktokEnabled} onCheckedChange={setTiktokEnabled} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Pixel ID</Label>
              <div className="flex gap-2 mt-2">
                <Input 
                  placeholder="XXXXXXXXXXXXXXXX"
                  value={tiktokPixelId}
                  onChange={(e) => setTiktokPixelId(e.target.value)}
                  disabled={!tiktokEnabled}
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard(tiktokPixelId, "ID")}
                  disabled={!tiktokPixelId}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Encontre seu Pixel ID em: TikTok Ads Manager → Assets → Events → Web Events
              </p>
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>Eventos: ViewContent, InitiateCheckout, CompleteRegistration, CompletePayment</span>
              </div>
              <Button variant="link" size="sm" asChild>
                <a href="https://ads.tiktok.com/i18n/events_manager" target="_blank" rel="noopener noreferrer">
                  Abrir TikTok Events <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teste de Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Testar Eventos
            </CardTitle>
            <CardDescription>
              Dispare eventos de teste para verificar se os pixels estão funcionando
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  import('@/lib/tracking-pixels').then(({ trackPixelEvent }) => {
                    trackPixelEvent('page_view', { page: '/test' });
                    toast.success("Evento page_view disparado!");
                  });
                }}
              >
                Page View
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  import('@/lib/tracking-pixels').then(({ trackPixelEvent }) => {
                    trackPixelEvent('quiz_started');
                    toast.success("Evento quiz_started disparado!");
                  });
                }}
              >
                Quiz Started
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  import('@/lib/tracking-pixels').then(({ trackPixelEvent }) => {
                    trackPixelEvent('trial_created', { email: 'test@example.com' });
                    toast.success("Evento trial_created disparado!");
                  });
                }}
              >
                Trial Created
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  import('@/lib/tracking-pixels').then(({ trackPixelEvent }) => {
                    trackPixelEvent('checkout_completed', { value: 97, currency: 'BRL' });
                    toast.success("Evento checkout_completed disparado!");
                  });
                }}
              >
                Checkout Completed
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Abra o console do navegador (F12) para ver os eventos sendo disparados.
              Use as ferramentas de debug de cada plataforma para verificar se os eventos estão chegando.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
