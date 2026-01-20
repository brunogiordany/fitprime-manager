import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { 
  Settings as SettingsIcon,
  User,
  Bell,
  MessageSquare,
  Shield,
  Save,
  QrCode,
  Smartphone,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  ExternalLink,
  Upload,
  Image,
  Trash2,
  Crown,
  Zap,
  ArrowUpRight,
  Check,
  Star
} from "lucide-react";
import { PLANS } from "@/../../shared/plans";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

export default function Settings() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  
  // Extrair tab da URL
  const tabFromUrl = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return params.get('tab') || 'perfil';
  }, [searchString]);
  
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  
  // Atualizar tab quando URL mudar
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);
  
  // Atualizar URL quando tab mudar
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setLocation(`/configuracoes?tab=${tab}`);
  };
  
  const [profile, setProfile] = useState({
    businessName: "",
    phone: "",
    bio: "",
    address: "",
    workingHours: "",
    cref: "",
    cpf: "",
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    evolutionApiKey: "",  // Token do Stevo
    instanceName: "",     // Instance ID do Stevo
    stevoServer: "sm15",  // Servidor Stevo (sm12, sm15, sm16, etc.)
    enabled: false,
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    sessionReminders: true,
    paymentReminders: true,
  });

  const [whatsappStatus, setWhatsappStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<string | null>(null);
  const [showAnnualUpgrades, setShowAnnualUpgrades] = useState(false);

  const { data: personalData, isLoading } = trpc.personal.get.useQuery();
  const { data: subscription } = trpc.subscription.info.useQuery();
  const { data: availableUpgrades } = trpc.subscription.availableUpgrades.useQuery();
  const { data: currentPlanDetails } = trpc.subscription.currentPlanDetails.useQuery();
  
  // Determinar plano atual
  const getPlanFromId = (planId: string | undefined, isTrial: boolean = false) => {
    // Se é trial, retorna plano trial
    if (isTrial) return PLANS.trial;
    if (!planId) return PLANS.trial; // Default para trial se não tem plano
    const planMap: Record<string, keyof typeof PLANS> = {
      'fitprime_br_trial': 'trial',
      'fitprime_br_beginner': 'beginner',
      'fitprime_br_starter': 'starter',
      'fitprime_br_pro': 'pro', 
      'fitprime_br_business': 'business',
      'fitprime_br_premium': 'premium',
      'fitprime_br_enterprise': 'enterprise',
      'trial': 'trial',
      'beginner': 'beginner',
      'starter': 'starter',
      'pro': 'pro',
      'business': 'business',
      'premium': 'premium',
      'enterprise': 'enterprise',
    };
    const mappedId = planMap[planId];
    return mappedId ? PLANS[mappedId] : PLANS.trial;
  };
  
  // Verifica se é trial baseado no status da subscription
  const isTrial = subscription?.status === 'trial' || subscription?.status === 'trialing' || !subscription?.planId;
  const currentPlan = getPlanFromId(subscription?.planId, isTrial);
  const isAnnualPlan = subscription?.planId?.includes('_anual') || false;
  const studentUsage = subscription?.currentStudents || 0;
  const studentLimit = isAnnualPlan ? currentPlan.annualStudentLimit : (subscription?.studentLimit || currentPlan.studentLimit);
  const usagePercent = Math.min(100, Math.round((studentUsage / studentLimit) * 100));
  const plansArray = Object.values(PLANS);
  const uploadLogoMutation = trpc.personal.uploadLogo.useMutation({
    onSuccess: (data: { logoUrl: string }) => {
      setLogoUrl(data.logoUrl);
      toast.success("Logo atualizada com sucesso!");
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao fazer upload: " + error.message);
    },
  });
  
  const removeLogoMutation = trpc.personal.removeLogo.useMutation({
    onSuccess: () => {
      setLogoUrl(null);
      toast.success("Logo removida com sucesso!");
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao remover logo: " + error.message);
    },
  });

  const updateMutation = trpc.personal.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  useEffect(() => {
    if (personalData) {
      setProfile({
        businessName: personalData.businessName || "",
        phone: personalData.whatsappNumber || "",
        bio: personalData.bio || "",
        address: "",
        workingHours: personalData.workingHours || "",
        cref: personalData.cref || "",
        cpf: (personalData as any).cpf || "",
      });
      setWhatsappConfig({
        evolutionApiKey: personalData.evolutionApiKey || "",
        instanceName: personalData.evolutionInstance || "",
        stevoServer: (personalData as any).stevoServer || "sm15",
        enabled: !!personalData.evolutionApiKey,
      });
      setLogoUrl(personalData.logoUrl || null);
    }
  }, [personalData]);

  const handleSaveProfile = () => {
    updateMutation.mutate({
      businessName: profile.businessName || undefined,
      whatsappNumber: profile.phone || undefined,
      bio: profile.bio || undefined,
      workingHours: profile.workingHours || undefined,
      cref: profile.cref || undefined,
    });
  };

  const handleSaveWhatsapp = () => {
    updateMutation.mutate({
      evolutionApiKey: whatsappConfig.evolutionApiKey || undefined,
      evolutionInstance: whatsappConfig.instanceName || undefined,
      stevoServer: whatsappConfig.stevoServer || "sm15",
    });
  };

  const handleConnectWhatsApp = async () => {
    if (!whatsappConfig.evolutionApiKey || !whatsappConfig.instanceName) {
      toast.error("Preencha o Token e Instance ID do Stevo primeiro");
      return;
    }
    
    setIsLoadingQR(true);
    setWhatsappStatus('connecting');
    
    try {
      // Simulação de conexão - em produção seria uma chamada real à API do Stevo
      // A API do Stevo retorna um QR Code para conexão
      toast.info("Para conectar seu WhatsApp, acesse o painel do Stevo e escaneie o QR Code");
      
      // Abrir link do Stevo em nova aba
      window.open('https://app.stevo.chat', '_blank');
      
      setWhatsappStatus('disconnected');
    } catch (error) {
      toast.error("Erro ao conectar WhatsApp");
      setWhatsappStatus('disconnected');
    } finally {
      setIsLoadingQR(false);
    }
  };

  const handleDisconnectWhatsApp = () => {
    setWhatsappStatus('disconnected');
    setQrCode(null);
    toast.success("WhatsApp desconectado");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>

        {/* Navegação por Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="perfil" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="plano" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Plano</span>
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Perfil */}
          <TabsContent value="perfil" className="space-y-6 mt-6">
            {/* Profile Settings */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil Profissional
            </CardTitle>
            <CardDescription>
              Informações que serão exibidas para seus alunos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Nome do Negócio</Label>
                <Input
                  placeholder="Ex: Personal Trainer João Silva"
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Telefone</Label>
                <Input
                  placeholder="(11) 99999-9999"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Bio / Descrição</Label>
              <Textarea
                placeholder="Conte um pouco sobre você e seu trabalho..."
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>CPF</Label>
                <Input
                  placeholder="000.000.000-00"
                  value={profile.cpf}
                  onChange={(e) => {
                    // Formatação automática do CPF
                    let value = e.target.value.replace(/\D/g, '');
                    if (value.length > 11) value = value.slice(0, 11);
                    if (value.length > 9) {
                      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                    } else if (value.length > 6) {
                      value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                    } else if (value.length > 3) {
                      value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                    }
                    setProfile({ ...profile, cpf: value });
                  }}
                />
                <p className="text-xs text-muted-foreground">Usado para identificação única</p>
              </div>
              <div className="grid gap-2">
                <Label>CREF <span className="text-muted-foreground">(opcional)</span></Label>
                <Input
                  placeholder="Ex: 000000-G/SP"
                  value={profile.cref}
                  onChange={(e) => setProfile({ ...profile, cref: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Necessário para gerar treinos com IA</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Endereço / Local de Atendimento</Label>
                <Input
                  placeholder="Rua, número, bairro..."
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Horário de Atendimento</Label>
                <Input
                  placeholder="Ex: Seg-Sex 6h-22h"
                  value={profile.workingHours}
                  onChange={(e) => setProfile({ ...profile, workingHours: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveProfile} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Salvando..." : "Salvar Perfil"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Logo Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              Logo Personalizada
            </CardTitle>
            <CardDescription>
              Sua logo aparecerá nos PDFs exportados e relatórios dos alunos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-6">
              {/* Preview da Logo */}
              <div className="flex-shrink-0">
                {logoUrl ? (
                  <div className="relative">
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="w-32 h-32 object-contain border rounded-lg bg-white p-2"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => removeLogoMutation.mutate()}
                      disabled={removeLogoMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                    <Image className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Upload */}
              <div className="flex-1 space-y-3">
                <div>
                  <Label>Fazer Upload da Logo</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Formatos aceitos: PNG, JPG, JPEG. Tamanho máximo: 2MB.
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    className="hidden"
                    id="logo-upload"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      if (file.size > 2 * 1024 * 1024) {
                        toast.error("Arquivo muito grande. Máximo 2MB.");
                        return;
                      }
                      
                      setIsUploadingLogo(true);
                      try {
                        const reader = new FileReader();
                        reader.onload = async () => {
                          const base64 = (reader.result as string).split(',')[1];
                          uploadLogoMutation.mutate({
                            logoData: base64,
                            mimeType: file.type,
                          });
                        };
                        reader.readAsDataURL(file);
                      } catch {
                        toast.error("Erro ao processar imagem");
                      } finally {
                        setIsUploadingLogo(false);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('logo-upload')?.click()}
                    disabled={isUploadingLogo || uploadLogoMutation.isPending}
                  >
                    {isUploadingLogo || uploadLogoMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                    ) : (
                      <><Upload className="h-4 w-4 mr-2" /> Escolher Arquivo</>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Recomendamos uma imagem quadrada com fundo transparente para melhor resultado.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Tab: WhatsApp */}
          <TabsContent value="whatsapp" className="space-y-6 mt-6">
        {/* WhatsApp Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Integração WhatsApp (Stevo)
            </CardTitle>
            <CardDescription>
              Configure a integração com o <a href="https://stevo.chat" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">Stevo</a> para envio automático de mensagens via WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Habilitar WhatsApp</Label>
                <p className="text-sm text-muted-foreground">
                  Ative para enviar mensagens automáticas
                </p>
              </div>
              <Switch
                checked={whatsappConfig.enabled}
                onCheckedChange={(checked) => setWhatsappConfig({ ...whatsappConfig, enabled: checked })}
              />
            </div>
            
            <Separator />
            
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label>Servidor</Label>
                <Input
                  placeholder="Ex: sm15"
                  value={whatsappConfig.stevoServer}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, stevoServer: e.target.value })}
                  disabled={!whatsappConfig.enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Servidor da instância (sm12, sm15, etc.)
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Token</Label>
                <Input
                  type="password"
                  placeholder="Ex: 1767462392574JpuVNfwwzstKdXX5"
                  value={whatsappConfig.evolutionApiKey}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, evolutionApiKey: e.target.value })}
                  disabled={!whatsappConfig.enabled}
                />
                <p className="text-xs text-muted-foreground">
                  Token de autenticação da sua instância Stevo
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Instance ID</Label>
                <Input
                  placeholder="Ex: ea9857c453e5133e3a00045038a7b77e"
                  value={whatsappConfig.instanceName}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, instanceName: e.target.value })}
                  disabled={!whatsappConfig.enabled}
                />
                <p className="text-xs text-muted-foreground">
                  ID da instância encontrado no painel Stevo
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleSaveWhatsapp} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
            
            <Separator />
            
            {/* Status da Integração */}
            <div className="bg-gray-50 dark:bg-card rounded-lg p-4 space-y-4 dark:border dark:border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${whatsappConfig.evolutionApiKey && whatsappConfig.instanceName ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <Smartphone className={`h-5 w-5 ${whatsappConfig.evolutionApiKey && whatsappConfig.instanceName ? 'text-green-600' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium">Status da Integração</p>
                    <p className={`text-sm ${whatsappConfig.evolutionApiKey && whatsappConfig.instanceName ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {whatsappConfig.evolutionApiKey && whatsappConfig.instanceName ? 'Configurado' : 'Não configurado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {whatsappConfig.evolutionApiKey && whatsappConfig.instanceName ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">Pronto para enviar</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-muted-foreground">Preencha as credenciais</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Como obter suas credenciais:</strong>
                </p>
                <ol className="text-sm text-blue-700 list-decimal list-inside mt-2 space-y-1">
                  <li>Acesse o painel do Stevo (<a href="https://stevo.chat" target="_blank" rel="noopener noreferrer" className="underline">stevo.chat</a>) e faça login</li>
                  <li>Clique na sua instância (ex: fitprime)</li>
                  <li>Na tela principal, você verá o <strong>Instance ID</strong> e o <strong>Token</strong></li>
                  <li>Para encontrar o <strong>Servidor</strong>: olhe a URL do navegador, procure por <code className="bg-blue-100 px-1 rounded">sm15</code>, <code className="bg-blue-100 px-1 rounded">sm12</code>, etc.</li>
                  <li>Copie e cole os valores nos campos acima</li>
                  <li>Clique em "Salvar Configurações"</li>
                </ol>
                <p className="text-xs text-blue-600 mt-2">
                  <strong>Dica:</strong> O servidor aparece na URL assim: <code className="bg-blue-100 px-1 rounded">https://sm15.stevo.chat/...</code>
                </p>
                <a 
                  href="https://stevo.chat" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Acessar Painel Stevo
                </a>
              </div>
              
              {/* Webhook Configuration */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mt-4">
                <p className="text-sm text-emerald-700">
                  <strong>✅ Webhook Configurado Automaticamente</strong>
                </p>
                <p className="text-sm text-emerald-600 mt-2">
                  O webhook é configurado automaticamente ao salvar as credenciais acima. As mensagens dos alunos serão recebidas em:
                </p>
                <div className="mt-2 bg-white rounded border border-emerald-300 p-2">
                  <p className="text-xs text-gray-500 mb-1">URL do Webhook:</p>
                  <code className="text-sm text-emerald-700 break-all select-all">
                    https://fitprimemanager.com/api/webhook/stevo
                  </code>
                </div>
                <p className="text-xs text-emerald-500 mt-2">
                  Com o webhook configurado, as mensagens dos alunos aparecerão automaticamente na aba Mensagens!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Tab: Notificações */}
          <TabsContent value="notificacoes" className="space-y-6 mt-6">
        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como você deseja receber notificações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Receba atualizações importantes por email
                </p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Lembretes de Sessão</Label>
                <p className="text-sm text-muted-foreground">
                  Receba lembretes antes das sessões agendadas
                </p>
              </div>
              <Switch
                checked={notifications.sessionReminders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, sessionReminders: checked })}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Lembretes de Pagamento</Label>
                <p className="text-sm text-muted-foreground">
                  Seja notificado sobre pagamentos pendentes
                </p>
              </div>
              <Switch
                checked={notifications.paymentReminders}
                onCheckedChange={(checked) => setNotifications({ ...notifications, paymentReminders: checked })}
              />
            </div>
          </CardContent>
        </Card>
          </TabsContent>

          {/* Tab: Plano */}
          <TabsContent value="plano" className="space-y-6 mt-6">
        {/* Plano e Assinatura */}
        <Card className="border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-emerald-600" />
              Meu Plano
            </CardTitle>
            <CardDescription>
              Gerencie sua assinatura e faça upgrade quando precisar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Plano Atual */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Crown className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xl">Plano {currentPlan.name}</h3>
                      {isAnnualPlan && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                          <Zap className="h-3 w-3 mr-1" />
                          Anual
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">
                      R$ {isAnnualPlan ? currentPlan.annualMonthlyPrice : currentPlan.price}/mês
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">{studentUsage}/{studentLimit}</p>
                  <p className="text-sm text-muted-foreground">alunos</p>
                </div>
              </div>
              
              {/* Barra de progresso */}
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Uso do plano</span>
                  <span className={usagePercent >= 90 ? 'text-red-600 font-medium' : usagePercent >= 70 ? 'text-orange-600' : 'text-emerald-600'}>
                    {usagePercent}%
                  </span>
                </div>
                <div className="h-3 bg-emerald-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      usagePercent >= 90 ? 'bg-red-500' : 
                      usagePercent >= 70 ? 'bg-orange-500' : 
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
              
              {usagePercent >= 80 && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-700">
                    ⚠️ Você está usando {usagePercent}% do seu limite. Considere fazer upgrade!
                  </p>
                </div>
              )}
            </div>
            
            {/* Features do Plano Atual */}
            <div>
              <h4 className="font-medium mb-3">Recursos incluídos no seu plano:</h4>
              <ul className="grid gap-2 sm:grid-cols-2">
                {currentPlan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Separator />
            
            {/* Opções de Upgrade */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Fazer upgrade</h4>
                
                {/* Toggle Mensal/Anual */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-secondary rounded-lg p-1">
                  <button
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      !showAnnualUpgrades ? 'bg-white dark:bg-card shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setShowAnnualUpgrades(false)}
                  >
                    Mensal
                  </button>
                  <button
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1 ${
                      showAnnualUpgrades ? 'bg-white dark:bg-card shadow-sm font-medium' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setShowAnnualUpgrades(true)}
                  >
                    Anual
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5">-20%</Badge>
                  </button>
                </div>
              </div>
              
              {/* Informação sobre proration */}
              {currentPlanDetails && currentPlanDetails.daysRemaining > 0 && (
                <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <p className="text-sm text-amber-700">
                    <strong>Upgrade proporcional:</strong> Você tem {currentPlanDetails.daysRemaining} dias restantes no período atual. 
                    O upgrade cobrará apenas a diferença proporcional.
                  </p>
                </div>
              )}
              
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {plansArray
                  .filter(plan => plan.price > currentPlan.price)
                  .slice(0, 3)
                  .map((plan) => {
                    const upgrade = availableUpgrades?.find(u => u.planId === plan.id);
                    const displayPrice = showAnnualUpgrades ? plan.annualMonthlyPrice : plan.price;
                    const displayLimit = showAnnualUpgrades ? plan.annualStudentLimit : plan.studentLimit;
                    const currentLimit = showAnnualUpgrades ? currentPlan.annualStudentLimit : currentPlan.studentLimit;
                    const additionalStudents = displayLimit - currentLimit;
                    const annualSavings = (plan.price * 12) - plan.annualPrice;
                    
                    return (
                      <div 
                        key={plan.id}
                        className="border rounded-xl p-4 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer relative dark:border-border"
                        onClick={() => {
                          if (showAnnualUpgrades) {
                            window.open(plan.annualCheckoutUrl, '_blank');
                            toast.info("Após o pagamento, seu plano será atualizado automaticamente.");
                          } else {
                            setSelectedUpgradePlan(plan.id);
                            setUpgradeModalOpen(true);
                          }
                        }}
                      >
                        {showAnnualUpgrades && (
                          <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                            Economize R$ {annualSavings.toFixed(0)}/ano
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold">{plan.name}</h5>
                          {plan.id === 'business' && (
                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        
                        <div className="mb-1">
                          <span className="text-2xl font-bold">R$ {displayPrice.toFixed(2)}</span>
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </div>
                        
                        {showAnnualUpgrades && (
                          <p className="text-xs text-muted-foreground mb-1">
                            Cobrado R$ {plan.annualPrice.toFixed(2)}/ano
                          </p>
                        )}
                        
                        <p className="text-sm text-muted-foreground">Até {displayLimit} alunos</p>
                        
                        {!showAnnualUpgrades && upgrade?.isProrated && upgrade.prorationAmount > 0 ? (
                          <div className="mt-2 p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                            <p className="text-xs text-emerald-700 font-medium">Pague agora apenas:</p>
                            <p className="text-lg font-bold text-emerald-600">R$ {upgrade.prorationAmount.toFixed(2)}</p>
                            <p className="text-xs text-emerald-600">({upgrade.daysRemaining} dias restantes)</p>
                          </div>
                        ) : (
                          <p className="text-sm text-emerald-600 mt-2">+{additionalStudents} alunos</p>
                        )}
                        
                        <Button size="sm" className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700">
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                          {showAnnualUpgrades ? 'Assinar Anual' : 'Fazer Upgrade'}
                        </Button>
                      </div>
                    );
                  })
                }
              </div>
              
              {!isAnnualPlan && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-700">Economize com o plano anual!</span>
                  </div>
                  <p className="text-sm text-blue-600 mb-3">
                    Assine anualmente e ganhe 20% de desconto + 20% mais alunos no seu plano.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => {
                      window.open(currentPlan.annualCheckoutUrl, '_blank');
                      toast.info("Após o pagamento, seu plano será atualizado automaticamente.");
                    }}
                  >
                    Ver plano anual - R$ {currentPlan.annualMonthlyPrice.toFixed(2)}/mês
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* Tab: Segurança */}
        <TabsContent value="seguranca" className="space-y-6 mt-6">
          {/* Security */}
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configurações de segurança da sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Sua conta está protegida</span>
              </div>
              <p className="text-sm text-emerald-600 mt-1">
                Autenticação via Manus OAuth ativa. Todos os dados são criptografados.
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Sessões JWT com expiração automática</p>
              <p>• Validação de permissões em todas as requisições</p>
              <p>• Proteção contra SQL Injection e XSS</p>
              <p>• Rate limiting para prevenir ataques de força bruta</p>
              <p>• Logs de auditoria para todas as ações sensíveis</p>
            </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Upgrade com Proration */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-emerald-600" />
              Fazer Upgrade
            </DialogTitle>
            <DialogDescription>
              Confirme os detalhes do seu upgrade de plano
            </DialogDescription>
          </DialogHeader>
          
          {selectedUpgradePlan && (() => {
            const selectedUpgrade = availableUpgrades?.find(u => u.planId === selectedUpgradePlan);
            const selectedPlan = PLANS[selectedUpgradePlan as keyof typeof PLANS];
            
            if (selectedUpgrade) {
              return (
                <div className="space-y-4">
                  {/* Resumo do Upgrade */}
                  <div className="p-4 bg-gray-50 dark:bg-secondary rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Plano atual:</span>
                      <span className="font-medium">{currentPlan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Novo plano:</span>
                      <span className="font-medium text-emerald-600">{selectedUpgrade.planName}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Diferença mensal:</span>
                      <span>R$ {(selectedUpgrade.price - currentPlan.price).toFixed(2)}</span>
                    </div>
                    {selectedUpgrade.isProrated && selectedUpgrade.daysRemaining && selectedUpgrade.daysRemaining > 0 ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Dias restantes:</span>
                          <span>{selectedUpgrade.daysRemaining} dias</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Proporcional:</span>
                          <span>{Math.round((selectedUpgrade.percentageRemaining || 0) * 100)}%</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Valor a pagar agora:</span>
                          <span className="text-emerald-600">
                            R$ {selectedUpgrade.prorationAmount.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Valor proporcional ao período restante da sua assinatura atual.
                        </p>
                      </>
                    ) : (
                      <>
                        <Separator />
                        <div className="flex justify-between items-center text-lg font-bold">
                          <span>Valor mensal:</span>
                          <span className="text-emerald-600">
                            R$ {selectedUpgrade.price.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Após o pagamento, seu plano será atualizado imediatamente.
                        </p>
                      </>
                    )}
                  </div>
                  
                  {/* Benefícios */}
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                    <p className="text-sm font-medium text-emerald-700 mb-2">Benefícios do upgrade:</p>
                    <ul className="text-sm text-emerald-600 space-y-1">
                      <li>✓ +{selectedUpgrade.additionalStudents || (selectedUpgrade.studentLimit - currentPlan.studentLimit)} alunos (total: {selectedUpgrade.studentLimit})</li>
                      <li>✓ Acesso imediato aos novos recursos</li>
                      <li>✓ Sem interrupção do serviço</li>
                    </ul>
                  </div>
                  
                  <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => setUpgradeModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        // Abrir checkout do Cakto
                        window.open(selectedUpgrade.checkoutUrl, '_blank');
                        setUpgradeModalOpen(false);
                        toast.info("Após o pagamento, seu plano será atualizado automaticamente.");
                      }}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      Confirmar Upgrade
                    </Button>
                  </DialogFooter>
                </div>
              );
            } else if (selectedPlan) {
              // Fallback para planos sem proration calculado
              return (
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-secondary rounded-lg space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Plano atual:</span>
                      <span className="font-medium">{currentPlan.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Novo plano:</span>
                      <span className="font-medium text-emerald-600">{selectedPlan.name}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Valor mensal:</span>
                      <span className="text-emerald-600">R$ {selectedPlan.price.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={() => setUpgradeModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        window.open(selectedPlan.checkoutUrl, '_blank');
                        setUpgradeModalOpen(false);
                      }}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      Ir para Pagamento
                    </Button>
                  </DialogFooter>
                </div>
              );
            }
            return null;
          })()}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
