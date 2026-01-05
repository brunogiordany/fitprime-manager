import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Mail,
  Send,
  Eye,
  Edit,
  RefreshCw,
  ArrowLeft,
  Save,
  Code,
  FileText,
  Info,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect, Link } from "wouter";

// Tipos
interface EmailTemplate {
  id: number;
  templateKey: string;
  name: string;
  description: string | null;
  subject: string;
  htmlContent: string;
  textContent: string | null;
  senderType: string;
  isActive: boolean;
  variables: string | null;
  previewData: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Variable {
  name: string;
  description: string;
}

// Mapeamento de remetentes
const SENDER_LABELS: Record<string, string> = {
  default: "Padrão (noreply@)",
  convites: "Convites (convites@)",
  avisos: "Avisos (avisos@)",
  cobranca: "Cobranças (cobranca@)",
  sistema: "Sistema (sistema@)",
  contato: "Contato (contato@)",
};

// Lista completa de todas as variáveis disponíveis no sistema
const ALL_VARIABLES: { name: string; description: string; category: string }[] = [
  // Dados do Aluno
  { name: "studentName", description: "Nome do aluno", category: "Aluno" },
  { name: "studentEmail", description: "Email do aluno", category: "Aluno" },
  { name: "studentPhone", description: "Telefone do aluno", category: "Aluno" },
  // Dados do Personal
  { name: "personalName", description: "Nome do personal trainer", category: "Personal" },
  { name: "personalEmail", description: "Email do personal", category: "Personal" },
  { name: "personalPhone", description: "Telefone do personal", category: "Personal" },
  { name: "businessName", description: "Nome da empresa/negócio", category: "Personal" },
  // Links e URLs
  { name: "inviteLink", description: "Link para criar conta (convite)", category: "Links" },
  { name: "loginLink", description: "Link para fazer login", category: "Links" },
  { name: "resetLink", description: "Link para resetar senha", category: "Links" },
  { name: "dashboardLink", description: "Link para o dashboard", category: "Links" },
  { name: "activationLink", description: "Link para ativar conta", category: "Links" },
  // Sessões e Treinos
  { name: "sessionDate", description: "Data da sessão", category: "Sessão" },
  { name: "sessionTime", description: "Horário da sessão", category: "Sessão" },
  { name: "sessionDuration", description: "Duração da sessão", category: "Sessão" },
  { name: "workoutName", description: "Nome do treino", category: "Sessão" },
  // Pagamentos
  { name: "paymentAmount", description: "Valor do pagamento", category: "Pagamento" },
  { name: "paymentDueDate", description: "Data de vencimento", category: "Pagamento" },
  { name: "planName", description: "Nome do plano", category: "Pagamento" },
  { name: "paymentLink", description: "Link para pagamento", category: "Pagamento" },
  // Sistema
  { name: "verificationCode", description: "Código de verificação", category: "Sistema" },
  { name: "currentDate", description: "Data atual", category: "Sistema" },
  { name: "appName", description: "Nome do aplicativo", category: "Sistema" },
];

// Categorias de variáveis
const VARIABLE_CATEGORIES = ["Aluno", "Personal", "Links", "Sessão", "Pagamento", "Sistema"];

// Mapeamento de ícones por tipo
const TEMPLATE_ICONS: Record<string, string> = {
  invite: "💌",
  welcome: "🎉",
  session_reminder: "⏰",
  password_reset: "🔐",
  payment_reminder: "💰",
  purchase_activation: "🚀",
};

export default function AdminEmailTemplates() {
  const { user, loading: authLoading } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    description: string;
    subject: string;
    htmlContent: string;
    senderType: "default" | "convites" | "avisos" | "cobranca" | "sistema" | "contato";
    isActive: boolean;
  }>({
    name: "",
    description: "",
    subject: "",
    htmlContent: "",
    senderType: "default",
    isActive: true,
  });
  
  // Estado para editor visual
  const [useVisualEditor, setUseVisualEditor] = useState(true);
  const [visualContent, setVisualContent] = useState({
    headerTitle: "",
    headerSubtitle: "",
    greeting: "",
    mainText: "",
    buttonText: "",
    buttonLink: "",
    footerText: "",
    primaryColor: "#10b981",
  });
  const [showAllVariables, setShowAllVariables] = useState(false);

  // Verificar se é owner/admin
  const { data: ownerCheck, isLoading: ownerLoading } = trpc.admin.isOwner.useQuery();

  // Buscar templates
  const { data: templates, isLoading: templatesLoading, refetch } = trpc.admin.listEmailTemplates.useQuery();

  // Mutations
  const seedMutation = trpc.admin.seedEmailTemplates.useMutation({
    onSuccess: () => {
      toast.success("Templates criados com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao criar templates: ${error.message}`);
    },
  });

  const updateMutation = trpc.admin.updateEmailTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template atualizado com sucesso!");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const sendTestMutation = trpc.admin.sendTestEmail.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowTestDialog(false);
      setTestEmail("");
    },
    onError: (error) => {
      toast.error(`Erro ao enviar: ${error.message}`);
    },
  });

  // Loading states
  if (authLoading || ownerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Verificar acesso
  if (!user || !ownerCheck?.isOwner) {
    return <Redirect to="/dashboard" />;
  }

  // Funções auxiliares
  const parseVariables = (variablesJson: string | null): Variable[] => {
    if (!variablesJson) return [];
    try {
      return JSON.parse(variablesJson);
    } catch {
      return [];
    }
  };

  const parsePreviewData = (previewJson: string | null): Record<string, string> => {
    if (!previewJson) return {};
    try {
      return JSON.parse(previewJson);
    } catch {
      return {};
    }
  };

  const replaceVariables = (content: string, previewData: Record<string, string>): string => {
    let result = content;
    for (const [key, value] of Object.entries(previewData)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      result = result.replace(regex, value);
    }
    return result;
  };

  const handleEdit = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditForm({
      name: template.name,
      description: template.description || "",
      subject: template.subject,
      htmlContent: template.htmlContent,
      senderType: template.senderType as "default" | "convites" | "avisos" | "cobranca" | "sistema" | "contato",
      isActive: template.isActive,
    });
    // Extrai conteúdo visual do HTML existente
    const extracted = extractVisualContent(template.htmlContent);
    setVisualContent(extracted);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!selectedTemplate) return;
    
    // Se estiver usando editor visual, gera o HTML
    const finalHtmlContent = useVisualEditor ? generateHtmlFromVisual() : editForm.htmlContent;
    
    updateMutation.mutate({
      id: selectedTemplate.id,
      ...editForm,
      htmlContent: finalHtmlContent,
    });
  };

  const handleSendTest = () => {
    if (!selectedTemplate || !testEmail) return;
    sendTestMutation.mutate({
      templateKey: selectedTemplate.templateKey,
      toEmail: testEmail,
    });
  };

  const copyVariable = (varName: string) => {
    navigator.clipboard.writeText(`{{${varName}}}`);
    toast.success(`Variável {{${varName}}} copiada!`);
  };

  // Função para extrair conteúdo visual do HTML
  const extractVisualContent = (html: string) => {
    // Tenta extrair os elementos principais do template HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    
    // Extrai título (h1 ou primeiro heading)
    const h1 = doc.querySelector("h1");
    const headerTitle = h1?.textContent || "";
    
    // Extrai subtítulo (primeiro p após h1)
    const subtitle = doc.querySelector("h1 + p, h2");
    const headerSubtitle = subtitle?.textContent || "";
    
    // Extrai saudação (texto que começa com "Olá" ou "Oi")
    const allText = doc.body?.textContent || "";
    const greetingMatch = allText.match(/Olá[^!]*!|Oi[^!]*!/i);
    const greeting = greetingMatch ? greetingMatch[0] : "";
    
    // Extrai texto principal (maior parágrafo)
    const paragraphs = Array.from(doc.querySelectorAll("p"));
    const mainParagraph = paragraphs.sort((a, b) => (b.textContent?.length || 0) - (a.textContent?.length || 0))[0];
    const mainText = mainParagraph?.textContent || "";
    
    // Extrai botão
    const button = doc.querySelector("a[style*='background'], button, a.button");
    const buttonText = button?.textContent || "";
    const buttonLink = button?.getAttribute("href") || "";
    
    // Extrai cor primária (do botão ou estilo)
    const styleMatch = html.match(/background[^:]*:\s*([#][0-9a-fA-F]{6}|rgb[^)]+\))/i);
    const primaryColor = styleMatch ? styleMatch[1] : "#10b981";
    
    return {
      headerTitle,
      headerSubtitle,
      greeting,
      mainText,
      buttonText,
      buttonLink,
      footerText: "",
      primaryColor,
    };
  };

  // Função para gerar HTML a partir do conteúdo visual
  const generateHtmlFromVisual = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${visualContent.primaryColor} 0%, ${adjustColor(visualContent.primaryColor, -20)} 100%); padding: 40px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">✉️</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">${visualContent.headerTitle || "Título do Email"}</h1>
              ${visualContent.headerSubtitle ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 16px;">${visualContent.headerSubtitle}</p>` : ""}
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${visualContent.greeting ? `<div style="background-color: ${visualContent.primaryColor}15; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 18px; color: #1f2937;">${visualContent.greeting}</p>
              </div>` : ""}
              ${visualContent.mainText ? `<p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">${visualContent.mainText}</p>` : ""}
              ${visualContent.buttonText ? `<div style="text-align: center; margin: 32px 0;">
                <a href="${visualContent.buttonLink || "#"}" style="display: inline-block; background: linear-gradient(135deg, ${visualContent.primaryColor} 0%, ${adjustColor(visualContent.primaryColor, -20)} 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px ${visualContent.primaryColor}40;">${visualContent.buttonText}</a>
              </div>` : ""}
              ${visualContent.footerText ? `<p style="color: #6b7280; font-size: 14px; margin: 24px 0 0;">${visualContent.footerText}</p>` : ""}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">Este email foi enviado automaticamente pelo FitPrime Manager</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  };

  // Função auxiliar para ajustar cor
  const adjustColor = (color: string, amount: number): string => {
    const hex = color.replace("#", "");
    const num = parseInt(hex, 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Mail className="h-6 w-6 text-primary" />
                  Templates de Email
                </h1>
                <p className="text-sm text-muted-foreground">
                  Personalize os emails enviados pelo sistema
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => refetch()}
                disabled={templatesLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${templatesLoading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button
                variant="outline"
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
              >
                <Sparkles className={`h-4 w-4 mr-2 ${seedMutation.isPending ? "animate-pulse" : ""}`} />
                {seedMutation.isPending ? "Atualizando..." : "Restaurar Padrões"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {templatesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : !templates || templates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Clique no botão acima para criar os templates padrão
              </p>
              <Button
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Criar Templates Padrão
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Lista de Templates */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Templates Disponíveis</CardTitle>
                  <CardDescription>
                    {templates.length} templates configurados
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px]">
                    <div className="space-y-1 p-4">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsEditing(false);
                            setShowPreview(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedTemplate?.id === template.id
                              ? "bg-primary/10 border border-primary/20"
                              : "hover:bg-muted"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">
                              {TEMPLATE_ICONS[template.templateKey] || "📧"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">
                                  {template.name}
                                </span>
                                {!template.isActive && (
                                  <Badge variant="secondary" className="text-xs">
                                    Inativo
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-1">
                                {template.description}
                              </p>
                              <Badge variant="outline" className="text-xs mt-2">
                                {SENDER_LABELS[template.senderType] || template.senderType}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Detalhes/Editor */}
            <div className="lg:col-span-2">
              {selectedTemplate ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">
                          {TEMPLATE_ICONS[selectedTemplate.templateKey] || "📧"}
                        </span>
                        <div>
                          <CardTitle>{selectedTemplate.name}</CardTitle>
                          <CardDescription>{selectedTemplate.description}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!isEditing && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowTestDialog(true);
                                setTestEmail("");
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Testar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowPreview(!showPreview)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              {showPreview ? "Código" : "Preview"}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleEdit(selectedTemplate)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </Button>
                          </>
                        )}
                        {isEditing && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsEditing(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleSave}
                              disabled={updateMutation.isPending}
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Salvar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      /* Modo Edição */
                      <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Nome do Template</Label>
                            <Input
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({ ...editForm, name: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Remetente</Label>
                            <Select
                              value={editForm.senderType}
                              onValueChange={(v) =>
                                setEditForm({ ...editForm, senderType: v as "default" | "convites" | "avisos" | "cobranca" | "sistema" | "contato" })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(SENDER_LABELS).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Descrição</Label>
                          <Input
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm({ ...editForm, description: e.target.value })
                            }
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Assunto do Email</Label>
                          <Input
                            value={editForm.subject}
                            onChange={(e) =>
                              setEditForm({ ...editForm, subject: e.target.value })
                            }
                          />
                          <p className="text-xs text-muted-foreground">
                            Use variáveis como {"{{studentName}}"} para personalizar
                          </p>
                        </div>

                        {/* Todas as Variáveis Disponíveis */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                              <Info className="h-4 w-4" />
                              Variáveis Disponíveis
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAllVariables(!showAllVariables)}
                            >
                              {showAllVariables ? "Mostrar menos" : "Ver todas as variáveis"}
                            </Button>
                          </div>
                          
                          {!showAllVariables ? (
                            <div className="flex flex-wrap gap-2">
                              {parseVariables(selectedTemplate.variables).map((v) => (
                                <Button
                                  key={v.name}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyVariable(v.name)}
                                  className="text-xs"
                                >
                                  <Copy className="h-3 w-3 mr-1" />
                                  {`{{${v.name}}}`}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <Card className="bg-muted/50">
                              <CardContent className="p-4">
                                <p className="text-sm text-muted-foreground mb-4">
                                  Clique em qualquer variável para copiar. Use no assunto ou conteúdo do email.
                                </p>
                                <div className="space-y-4">
                                  {VARIABLE_CATEGORIES.map((category) => (
                                    <div key={category}>
                                      <h4 className="text-sm font-semibold mb-2 text-primary">{category}</h4>
                                      <div className="flex flex-wrap gap-2">
                                        {ALL_VARIABLES.filter(v => v.category === category).map((v) => (
                                          <Button
                                            key={v.name}
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyVariable(v.name)}
                                            className="text-xs h-auto py-1"
                                            title={v.description}
                                          >
                                            <Copy className="h-3 w-3 mr-1" />
                                            {`{{${v.name}}}`}
                                          </Button>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>

                        <Separator />

                        {/* Alternar entre Editor Visual e Código */}
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <Label className="font-medium">Modo de Edição</Label>
                            <p className="text-xs text-muted-foreground">
                              {useVisualEditor ? "Editor visual simplificado" : "Editor de código HTML"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${!useVisualEditor ? 'font-medium' : 'text-muted-foreground'}`}>Código</span>
                            <Switch
                              checked={useVisualEditor}
                              onCheckedChange={setUseVisualEditor}
                            />
                            <span className={`text-sm ${useVisualEditor ? 'font-medium' : 'text-muted-foreground'}`}>Visual</span>
                          </div>
                        </div>

                        {useVisualEditor ? (
                          /* Editor Visual */
                          <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Título Principal</Label>
                                <Input
                                  value={visualContent.headerTitle}
                                  onChange={(e) => setVisualContent({ ...visualContent, headerTitle: e.target.value })}
                                  placeholder="Ex: Você foi convidado!"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Subtítulo (opcional)</Label>
                                <Input
                                  value={visualContent.headerSubtitle}
                                  onChange={(e) => setVisualContent({ ...visualContent, headerSubtitle: e.target.value })}
                                  placeholder="Ex: Uma nova jornada fitness te espera"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Saudação</Label>
                              <Input
                                value={visualContent.greeting}
                                onChange={(e) => setVisualContent({ ...visualContent, greeting: e.target.value })}
                                placeholder="Ex: Olá {{studentName}}! 👋"
                              />
                              <p className="text-xs text-muted-foreground">Use variáveis como {"{{studentName}}"} para personalizar</p>
                            </div>

                            <div className="space-y-2">
                              <Label>Texto Principal</Label>
                              <Textarea
                                value={visualContent.mainText}
                                onChange={(e) => setVisualContent({ ...visualContent, mainText: e.target.value })}
                                rows={4}
                                placeholder="Ex: {{personalName}} está te convidando para fazer parte do FitPrime!"
                              />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Texto do Botão</Label>
                                <Input
                                  value={visualContent.buttonText}
                                  onChange={(e) => setVisualContent({ ...visualContent, buttonText: e.target.value })}
                                  placeholder="Ex: Criar Minha Conta"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Link do Botão</Label>
                                <Input
                                  value={visualContent.buttonLink}
                                  onChange={(e) => setVisualContent({ ...visualContent, buttonLink: e.target.value })}
                                  placeholder="Ex: {{inviteLink}}"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Texto Adicional (opcional)</Label>
                              <Textarea
                                value={visualContent.footerText}
                                onChange={(e) => setVisualContent({ ...visualContent, footerText: e.target.value })}
                                rows={2}
                                placeholder="Ex: Se você não solicitou este convite, ignore este email."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Cor Principal</Label>
                              <div className="flex items-center gap-3">
                                <input
                                  type="color"
                                  value={visualContent.primaryColor}
                                  onChange={(e) => setVisualContent({ ...visualContent, primaryColor: e.target.value })}
                                  className="w-12 h-10 rounded cursor-pointer border"
                                />
                                <Input
                                  value={visualContent.primaryColor}
                                  onChange={(e) => setVisualContent({ ...visualContent, primaryColor: e.target.value })}
                                  className="w-32"
                                />
                                <div className="flex gap-2">
                                  {["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"].map((color) => (
                                    <button
                                      key={color}
                                      onClick={() => setVisualContent({ ...visualContent, primaryColor: color })}
                                      className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform"
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Preview em tempo real */}
                            <div className="space-y-2">
                              <Label>Preview em Tempo Real</Label>
                              <div className="border rounded-lg overflow-hidden">
                                <iframe
                                  srcDoc={generateHtmlFromVisual()}
                                  className="w-full h-[400px] bg-white"
                                  title="Email Preview"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Editor de Código */
                          <div className="space-y-2">
                            <Label>Conteúdo HTML</Label>
                            <Textarea
                              value={editForm.htmlContent}
                              onChange={(e) =>
                                setEditForm({ ...editForm, htmlContent: e.target.value })
                              }
                              rows={15}
                              className="font-mono text-sm"
                            />
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={editForm.isActive}
                            onCheckedChange={(checked) =>
                              setEditForm({ ...editForm, isActive: checked })
                            }
                          />
                          <Label>Template Ativo</Label>
                        </div>
                      </div>
                    ) : (
                      /* Modo Visualização */
                      <Tabs defaultValue="info" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="info">
                            <FileText className="h-4 w-4 mr-2" />
                            Informações
                          </TabsTrigger>
                          <TabsTrigger value="preview">
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </TabsTrigger>
                          <TabsTrigger value="code">
                            <Code className="h-4 w-4 mr-2" />
                            Código
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="info" className="space-y-4 mt-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <Label className="text-muted-foreground">Assunto</Label>
                              <p className="font-medium">{selectedTemplate.subject}</p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Remetente</Label>
                              <p className="font-medium">
                                {SENDER_LABELS[selectedTemplate.senderType]}
                              </p>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Status</Label>
                              <div className="flex items-center gap-2 mt-1">
                                {selectedTemplate.isActive ? (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-green-600">Ativo</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    <span className="text-yellow-600">Inativo</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div>
                              <Label className="text-muted-foreground">Última Atualização</Label>
                              <p className="font-medium">
                                {new Date(selectedTemplate.updatedAt).toLocaleDateString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>

                          <Separator />

                          <div>
                            <Label className="text-muted-foreground mb-2 block">
                              Variáveis Disponíveis
                            </Label>
                            <div className="space-y-2">
                              {parseVariables(selectedTemplate.variables).map((v) => (
                                <div
                                  key={v.name}
                                  className="flex items-center justify-between p-2 bg-muted rounded-lg"
                                >
                                  <div>
                                    <code className="text-sm font-mono text-primary">
                                      {`{{${v.name}}}`}
                                    </code>
                                    <p className="text-xs text-muted-foreground">
                                      {v.description}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyVariable(v.name)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TabsContent>

                        <TabsContent value="preview" className="mt-4">
                          <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted p-3 border-b">
                              <p className="text-sm">
                                <strong>Assunto:</strong>{" "}
                                {replaceVariables(
                                  selectedTemplate.subject,
                                  parsePreviewData(selectedTemplate.previewData)
                                )}
                              </p>
                            </div>
                            <iframe
                              srcDoc={replaceVariables(
                                selectedTemplate.htmlContent,
                                parsePreviewData(selectedTemplate.previewData)
                              )}
                              className="w-full h-[500px] bg-white"
                              title="Email Preview"
                            />
                          </div>
                        </TabsContent>

                        <TabsContent value="code" className="mt-4">
                          <ScrollArea className="h-[500px] border rounded-lg">
                            <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                              {selectedTemplate.htmlContent}
                            </pre>
                          </ScrollArea>
                        </TabsContent>
                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      Selecione um template
                    </h3>
                    <p className="text-muted-foreground">
                      Clique em um template na lista para visualizar e editar
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dialog de Teste */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email de Teste</DialogTitle>
            <DialogDescription>
              O email será enviado com os dados de exemplo configurados no template.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email de Destino</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            {selectedTemplate && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  Dados de preview que serão usados:
                </p>
                <pre className="text-xs font-mono">
                  {JSON.stringify(
                    parsePreviewData(selectedTemplate.previewData),
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSendTest}
              disabled={!testEmail || sendTestMutation.isPending}
            >
              {sendTestMutation.isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Teste
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
