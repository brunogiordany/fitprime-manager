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
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!selectedTemplate) return;
    updateMutation.mutate({
      id: selectedTemplate.id,
      ...editForm,
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
              {(!templates || templates.length === 0) && (
                <Button
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Criar Templates Padrão
                </Button>
              )}
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

                        {/* Variáveis Disponíveis */}
                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Variáveis Disponíveis
                          </Label>
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
                        </div>

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
