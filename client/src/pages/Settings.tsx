import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Settings() {
  const [profile, setProfile] = useState({
    businessName: "",
    phone: "",
    bio: "",
    address: "",
    workingHours: "",
  });

  const [whatsappConfig, setWhatsappConfig] = useState({
    evolutionApiUrl: "",
    evolutionApiKey: "",
    instanceName: "",
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

  const { data: personalData, isLoading } = trpc.personal.get.useQuery();
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
      });
      setWhatsappConfig({
        evolutionApiUrl: "",
        evolutionApiKey: personalData.evolutionApiKey || "",
        instanceName: personalData.evolutionInstance || "",
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
    });
  };

  const handleSaveWhatsapp = () => {
    updateMutation.mutate({
      evolutionApiKey: whatsappConfig.evolutionApiKey || undefined,
      evolutionInstance: whatsappConfig.instanceName || undefined,
    });
  };

  const handleConnectWhatsApp = async () => {
    if (!whatsappConfig.evolutionApiUrl || !whatsappConfig.evolutionApiKey || !whatsappConfig.instanceName) {
      toast.error("Preencha todos os campos de configuração do Stevo primeiro");
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
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>URL da API Stevo</Label>
                <Input
                  placeholder="https://api.stevo.chat"
                  value={whatsappConfig.evolutionApiUrl}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, evolutionApiUrl: e.target.value })}
                  disabled={!whatsappConfig.enabled}
                />
              </div>
              <div className="grid gap-2">
                <Label>Nome da Instância Stevo</Label>
                <Input
                  placeholder="sua-instancia-stevo"
                  value={whatsappConfig.instanceName}
                  onChange={(e) => setWhatsappConfig({ ...whatsappConfig, instanceName: e.target.value })}
                  disabled={!whatsappConfig.enabled}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>API Key</Label>
              <Input
                type="password"
                placeholder="Sua chave de API"
                value={whatsappConfig.evolutionApiKey}
                onChange={(e) => setWhatsappConfig({ ...whatsappConfig, evolutionApiKey: e.target.value })}
                disabled={!whatsappConfig.enabled}
              />
              <p className="text-xs text-muted-foreground">
                A chave será armazenada de forma segura e criptografada
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={handleSaveWhatsapp} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
            
            <Separator />
            
            {/* Status de Conexão e Botão Conectar */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${whatsappStatus === 'connected' ? 'bg-green-100' : whatsappStatus === 'connecting' ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                    <Smartphone className={`h-5 w-5 ${whatsappStatus === 'connected' ? 'text-green-600' : whatsappStatus === 'connecting' ? 'text-yellow-600' : 'text-gray-500'}`} />
                  </div>
                  <div>
                    <p className="font-medium">Status da Conexão</p>
                    <p className={`text-sm ${whatsappStatus === 'connected' ? 'text-green-600' : whatsappStatus === 'connecting' ? 'text-yellow-600' : 'text-muted-foreground'}`}>
                      {whatsappStatus === 'connected' ? 'Conectado' : whatsappStatus === 'connecting' ? 'Conectando...' : 'Desconectado'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {whatsappStatus === 'connected' ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <Button variant="outline" size="sm" onClick={handleDisconnectWhatsApp}>
                        <XCircle className="h-4 w-4 mr-1" />
                        Desconectar
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={handleConnectWhatsApp} 
                      disabled={isLoadingQR || !whatsappConfig.enabled}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoadingQR ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Conectando...</>
                      ) : (
                        <><QrCode className="h-4 w-4 mr-2" /> Conectar WhatsApp</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  <strong>Como conectar:</strong> Após salvar as configurações, clique em "Conectar WhatsApp" para abrir o painel do Stevo. 
                  Lá você poderá escanear o QR Code com seu celular para conectar sua conta.
                </p>
                <a 
                  href="https://stevo.chat" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mt-2"
                >
                  <ExternalLink className="h-3 w-3" />
                  Acessar Stevo
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

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
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
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
      </div>
    </DashboardLayout>
  );
}
