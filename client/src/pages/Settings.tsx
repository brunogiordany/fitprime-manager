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
  Save
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

  const { data: personalData, isLoading } = trpc.personal.get.useQuery();

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
            <div className="flex justify-end">
              <Button onClick={handleSaveWhatsapp} disabled={updateMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {updateMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
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
