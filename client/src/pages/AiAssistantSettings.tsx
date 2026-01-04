import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { 
  Bot, 
  MessageSquare, 
  Clock, 
  Shield, 
  Sparkles, 
  Settings2,
  Save,
  RefreshCw,
  Users,
  Target,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Wand2,
  Loader2
} from "lucide-react";

export default function AiAssistantSettings() {
  const utils = trpc.useUtils();
  
  // Verificar se a feature está habilitada
  const { data: featureFlags, isLoading: loadingFlags } = trpc.personal.featureFlags.useQuery();
  
  // Buscar configuração atual
  const { data: config, isLoading } = trpc.aiAssistant.getConfig.useQuery(undefined, {
    enabled: featureFlags?.aiAssistantEnabled === true,
  });
  
  // Mutation para salvar
  const saveConfig = trpc.aiAssistant.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas!", {
        description: "As configurações da IA foram atualizadas com sucesso.",
      });
      utils.aiAssistant.getConfig.invalidate();
    },
    onError: (error) => {
      toast.error("Erro ao salvar", {
        description: error.message,
      });
    },
  });
  
  // Estado para controlar qual campo está gerando
  const [generatingField, setGeneratingField] = useState<string | null>(null);
  
  // Mutation para gerar sugestões com IA
  const generateSuggestions = trpc.aiAssistant.generateSuggestions.useMutation({
    onSuccess: (data) => {
      if ('suggestions' in data && data.suggestions) {
        // Preencher todos os campos
        setFormData(prev => ({
          ...prev,
          personalBio: data.suggestions.personalBio || prev.personalBio,
          servicesOffered: data.suggestions.servicesOffered || prev.servicesOffered,
          workingHoursDescription: data.suggestions.workingHoursDescription || prev.workingHoursDescription,
          locationDescription: data.suggestions.locationDescription || prev.locationDescription,
          priceRange: data.suggestions.priceRange || prev.priceRange,
          welcomeMessageLead: data.suggestions.welcomeMessageLead || prev.welcomeMessageLead,
          welcomeMessageStudent: data.suggestions.welcomeMessageStudent || prev.welcomeMessageStudent,
          awayMessage: data.suggestions.awayMessage || prev.awayMessage,
          customPersonality: data.suggestions.customPersonality || prev.customPersonality,
        }));
        toast.success("Sugestões geradas!", {
          description: "Todos os campos foram preenchidos com sugestões da IA. Revise e ajuste conforme necessário.",
        });
      } else if ('suggestion' in data && data.field) {
        // Preencher campo específico
        updateField(data.field as keyof typeof formData, data.suggestion as any);
        toast.success("Sugestão gerada!", {
          description: "O campo foi preenchido com uma sugestão da IA.",
        });
      }
      setGeneratingField(null);
    },
    onError: (error) => {
      toast.error("Erro ao gerar sugestão", {
        description: error.message,
      });
      setGeneratingField(null);
    },
  });
  
  // Função para gerar sugestão para um campo
  const handleGenerateSuggestion = (field: string) => {
    setGeneratingField(field);
    generateSuggestions.mutate({
      field: field as any,
      context: {
        assistantName: formData.assistantName,
        assistantGender: formData.assistantGender,
        communicationTone: formData.communicationTone,
        existingBio: formData.personalBio,
        existingServices: formData.servicesOffered,
      },
    });
  };
  
  // Função para gerar todas as sugestões
  const handleGenerateAll = () => {
    setGeneratingField("all");
    generateSuggestions.mutate({
      field: "all",
      context: {
        assistantName: formData.assistantName,
        assistantGender: formData.assistantGender,
        communicationTone: formData.communicationTone,
      },
    });
  };
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    // Identidade
    assistantName: "Assistente",
    assistantGender: "female" as "male" | "female" | "neutral",
    
    // Tom e Personalidade
    communicationTone: "friendly" as "formal" | "casual" | "motivational" | "friendly",
    useEmojis: true,
    emojiFrequency: "medium" as "low" | "medium" | "high",
    customPersonality: "",
    
    // Informações do Personal
    personalBio: "",
    servicesOffered: "",
    workingHoursDescription: "",
    locationDescription: "",
    priceRange: "",
    
    // Configurações de Atendimento
    isEnabled: false, // Desligado por padrão até admin liberar
    enabledForLeads: true,
    enabledForStudents: true,
    enabledForInternalChat: false,
    
    // Horário de atendimento
    autoReplyEnabled: true,
    autoReplyStartHour: 8,
    autoReplyEndHour: 22,
    autoReplyWeekends: true,
    
    // Mensagens personalizadas
    welcomeMessageLead: "",
    welcomeMessageStudent: "",
    awayMessage: "",
    
    // Escalação
    escalateOnKeywords: "",
    escalateAfterMessages: 10,
    escalateOnSentiment: true,
    
    // Funcionalidades
    canScheduleEvaluation: true,
    canScheduleSession: true,
    canAnswerWorkoutQuestions: true,
    canAnswerDietQuestions: true,
    canSendMotivation: true,
    canHandlePayments: false,
    
    // Delay
    minResponseDelay: 2,
    maxResponseDelay: 8,
  });
  
  // Carregar dados quando config mudar
  useEffect(() => {
    if (config) {
      setFormData({
        assistantName: config.assistantName || "Assistente",
        assistantGender: config.assistantGender || "female",
        communicationTone: config.communicationTone || "friendly",
        useEmojis: config.useEmojis ?? true,
        emojiFrequency: config.emojiFrequency || "medium",
        customPersonality: config.customPersonality || "",
        personalBio: config.personalBio || "",
        servicesOffered: config.servicesOffered || "",
        workingHoursDescription: config.workingHoursDescription || "",
        locationDescription: config.locationDescription || "",
        priceRange: config.priceRange || "",
        isEnabled: config.isEnabled ?? false, // Desligado por padrão
        enabledForLeads: config.enabledForLeads ?? true,
        enabledForStudents: config.enabledForStudents ?? true,
        enabledForInternalChat: (config as any).enabledForInternalChat ?? false,
        autoReplyEnabled: config.autoReplyEnabled ?? true,
        autoReplyStartHour: config.autoReplyStartHour ?? 8,
        autoReplyEndHour: config.autoReplyEndHour ?? 22,
        autoReplyWeekends: config.autoReplyWeekends ?? true,
        welcomeMessageLead: config.welcomeMessageLead || "",
        welcomeMessageStudent: config.welcomeMessageStudent || "",
        awayMessage: config.awayMessage || "",
        escalateOnKeywords: config.escalateOnKeywords || "",
        escalateAfterMessages: config.escalateAfterMessages ?? 10,
        escalateOnSentiment: config.escalateOnSentiment ?? true,
        canScheduleEvaluation: config.canScheduleEvaluation ?? true,
        canScheduleSession: config.canScheduleSession ?? true,
        canAnswerWorkoutQuestions: config.canAnswerWorkoutQuestions ?? true,
        canAnswerDietQuestions: config.canAnswerDietQuestions ?? true,
        canSendMotivation: config.canSendMotivation ?? true,
        canHandlePayments: config.canHandlePayments ?? false,
        minResponseDelay: config.minResponseDelay ?? 2,
        maxResponseDelay: config.maxResponseDelay ?? 8,
      });
    }
  }, [config]);
  
  const handleSave = () => {
    saveConfig.mutate(formData);
  };
  
  const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Tela de bloqueio quando feature não está habilitada
  if (loadingFlags) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (!featureFlags?.aiAssistantEnabled) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 bg-amber-100 dark:bg-amber-900/30 rounded-full w-fit mb-4">
                <Shield className="h-12 w-12 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">Funcionalidade em Beta</CardTitle>
              <CardDescription className="text-base mt-2">
                A IA de Atendimento está em fase de testes e ainda não está disponível para uso.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Esta funcionalidade precisa ser liberada pelo administrador do sistema.
                  Quando estiver disponível, você poderá configurar sua assistente virtual
                  para atender leads e alunos automaticamente via WhatsApp.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>Em breve disponível</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-7 w-7 text-emerald-600" />
              IA de Atendimento
              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-400 bg-amber-50">
                BETA
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure sua assistente virtual para atender leads e alunos automaticamente
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={formData.isEnabled ? "default" : "secondary"} className="gap-1">
              {formData.isEnabled ? (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Ativa
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3" />
                  Desativada
                </>
              )}
            </Badge>
            <Button onClick={handleSave} disabled={saveConfig.isPending}>
              {saveConfig.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </div>
        </div>
        
        {/* Status Card */}
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">
                  IA Super Humanizada
                </h3>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                  Sua assistente virtual conversa de forma natural, sem parecer robótica. 
                  Ela tem acesso ao contexto completo de cada aluno (treinos, medidas, histórico) 
                  e pode converter leads em clientes de forma consultiva.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs de Configuração */}
        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="identity" className="gap-2">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Identidade</span>
            </TabsTrigger>
            <TabsTrigger value="behavior" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Comportamento</span>
            </TabsTrigger>
            <TabsTrigger value="schedule" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Horários</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Funcionalidades</span>
            </TabsTrigger>
            <TabsTrigger value="escalation" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Escalação</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Tab: Identidade */}
          <TabsContent value="identity" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Identidade da IA */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Identidade da IA
                  </CardTitle>
                  <CardDescription>
                    Defina como sua assistente vai se apresentar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="assistantName">Nome da Assistente</Label>
                    <Input
                      id="assistantName"
                      value={formData.assistantName}
                      onChange={(e) => updateField("assistantName", e.target.value)}
                      placeholder="Ex: Sofia, Ana, Assistente..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Este nome será usado nas conversas
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Gênero da Assistente</Label>
                    <Select
                      value={formData.assistantGender}
                      onValueChange={(v) => updateField("assistantGender", v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Feminino</SelectItem>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="neutral">Neutro</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Afeta pronomes e concordância nas mensagens
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>IA Ativada</Label>
                      <p className="text-xs text-muted-foreground">
                        Liga/desliga o atendimento automático
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.isEnabled}
                        onCheckedChange={(v) => updateField("isEnabled", v)}
                      />
                    </div>
                  </div>
                  
                  {/* Aviso BETA */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-amber-800 dark:text-amber-200">Funcionalidade em BETA</p>
                        <p className="text-amber-700 dark:text-amber-300 text-xs mt-1">
                          Esta IA está em fase de testes. Recomendamos manter desativada até que você configure todos os parâmetros corretamente.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Informações do Personal */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Sobre Você
                      </CardTitle>
                      <CardDescription>
                        Informações que a IA usará para apresentar seus serviços
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateAll}
                      disabled={generatingField !== null}
                      className="gap-2"
                    >
                      {generatingField === "all" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                      Preencher Tudo com IA
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="personalBio">Sua Bio</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateSuggestion("personalBio")}
                        disabled={generatingField !== null}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        {generatingField === "personalBio" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                        Sugerir
                      </Button>
                    </div>
                    <Textarea
                      id="personalBio"
                      value={formData.personalBio}
                      onChange={(e) => updateField("personalBio", e.target.value)}
                      placeholder="Ex: Personal trainer especializado em emagrecimento e hipertrofia, com 10 anos de experiência..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="servicesOffered">Serviços Oferecidos</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateSuggestion("servicesOffered")}
                        disabled={generatingField !== null}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        {generatingField === "servicesOffered" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                        Sugerir
                      </Button>
                    </div>
                    <Textarea
                      id="servicesOffered"
                      value={formData.servicesOffered}
                      onChange={(e) => updateField("servicesOffered", e.target.value)}
                      placeholder="Ex: Personal presencial, consultoria online, acompanhamento nutricional..."
                      rows={2}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="locationDescription">Local de Atendimento</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateSuggestion("locationDescription")}
                          disabled={generatingField !== null}
                          className="h-6 px-1.5 text-xs gap-1"
                        >
                          {generatingField === "locationDescription" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <Input
                        id="locationDescription"
                        value={formData.locationDescription}
                        onChange={(e) => updateField("locationDescription", e.target.value)}
                        placeholder="Ex: Academia XYZ, domicílio..."
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="priceRange">Faixa de Preço</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateSuggestion("priceRange")}
                          disabled={generatingField !== null}
                          className="h-6 px-1.5 text-xs gap-1"
                        >
                          {generatingField === "priceRange" ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Wand2 className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <Input
                        id="priceRange"
                        value={formData.priceRange}
                        onChange={(e) => updateField("priceRange", e.target.value)}
                        placeholder="Ex: R$ 150-300/sessão"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Tab: Comportamento */}
          <TabsContent value="behavior" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Tom de Comunicação */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Tom de Comunicação
                  </CardTitle>
                  <CardDescription>
                    Como a IA vai se comunicar com as pessoas
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Estilo de Comunicação</Label>
                    <Select
                      value={formData.communicationTone}
                      onValueChange={(v) => updateField("communicationTone", v as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">
                          <div className="flex flex-col">
                            <span>Formal</span>
                            <span className="text-xs text-muted-foreground">Profissional e respeitoso</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="casual">
                          <div className="flex flex-col">
                            <span>Casual</span>
                            <span className="text-xs text-muted-foreground">Descontraído e amigável</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="motivational">
                          <div className="flex flex-col">
                            <span>Motivacional</span>
                            <span className="text-xs text-muted-foreground">Energético e inspirador</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="friendly">
                          <div className="flex flex-col">
                            <span>Amigável</span>
                            <span className="text-xs text-muted-foreground">Caloroso e acolhedor</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Usar Emojis</Label>
                      <p className="text-xs text-muted-foreground">
                        Adiciona emojis nas mensagens
                      </p>
                    </div>
                    <Switch
                      checked={formData.useEmojis}
                      onCheckedChange={(v) => updateField("useEmojis", v)}
                    />
                  </div>
                  
                  {formData.useEmojis && (
                    <div className="space-y-2">
                      <Label>Frequência de Emojis</Label>
                      <Select
                        value={formData.emojiFrequency}
                        onValueChange={(v) => updateField("emojiFrequency", v as any)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Baixa (raramente)</SelectItem>
                          <SelectItem value="medium">Média (moderado)</SelectItem>
                          <SelectItem value="high">Alta (frequente)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="customPersonality">Personalidade Customizada</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateSuggestion("customPersonality")}
                        disabled={generatingField !== null}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        {generatingField === "customPersonality" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                        Sugerir
                      </Button>
                    </div>
                    <Textarea
                      id="customPersonality"
                      value={formData.customPersonality}
                      onChange={(e) => updateField("customPersonality", e.target.value)}
                      placeholder="Ex: Sempre mencione a importância do descanso. Use gírias fitness como 'bora treinar!'..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Instruções adicionais para personalizar o comportamento da IA
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Mensagens Personalizadas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Mensagens Personalizadas
                  </CardTitle>
                  <CardDescription>
                    Mensagens de boas-vindas e fora do horário
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="welcomeMessageLead">Boas-vindas para Leads</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateSuggestion("welcomeMessageLead")}
                        disabled={generatingField !== null}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        {generatingField === "welcomeMessageLead" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                        Sugerir
                      </Button>
                    </div>
                    <Textarea
                      id="welcomeMessageLead"
                      value={formData.welcomeMessageLead}
                      onChange={(e) => updateField("welcomeMessageLead", e.target.value)}
                      placeholder="Ex: Oi! 👋 Tudo bem? Sou a Sofia, da equipe do Personal. Vi que você entrou em contato! Como posso te ajudar?"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Primeira mensagem para novos contatos
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="welcomeMessageStudent">Boas-vindas para Alunos</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateSuggestion("welcomeMessageStudent")}
                        disabled={generatingField !== null}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        {generatingField === "welcomeMessageStudent" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                        Sugerir
                      </Button>
                    </div>
                    <Textarea
                      id="welcomeMessageStudent"
                      value={formData.welcomeMessageStudent}
                      onChange={(e) => updateField("welcomeMessageStudent", e.target.value)}
                      placeholder="Ex: E aí! 💪 Tudo certo por aí? Em que posso te ajudar hoje?"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Primeira mensagem para alunos cadastrados
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="awayMessage">Mensagem Fora do Horário</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateSuggestion("awayMessage")}
                        disabled={generatingField !== null}
                        className="h-7 px-2 text-xs gap-1"
                      >
                        {generatingField === "awayMessage" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Wand2 className="h-3 w-3" />
                        )}
                        Sugerir
                      </Button>
                    </div>
                    <Textarea
                      id="awayMessage"
                      value={formData.awayMessage}
                      onChange={(e) => updateField("awayMessage", e.target.value)}
                      placeholder="Ex: Oi! Estamos fora do horário de atendimento agora, mas vou passar sua mensagem para o personal e ele te responde assim que possível! 🙏"
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground">
                      Mensagem enviada automaticamente fora do horário de atendimento
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Delay Humanizado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Delay Humanizado
                </CardTitle>
                <CardDescription>
                  Tempo de espera antes de responder (simula digitação humana)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Tempo Mínimo (segundos)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={30}
                      value={formData.minResponseDelay}
                      onChange={(e) => updateField("minResponseDelay", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tempo Máximo (segundos)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={60}
                      value={formData.maxResponseDelay}
                      onChange={(e) => updateField("maxResponseDelay", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  A IA vai esperar um tempo aleatório entre esses valores antes de responder, 
                  para parecer mais natural.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: Horários */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horário de Atendimento Automático
                </CardTitle>
                <CardDescription>
                  Defina quando a IA deve responder automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Resposta Automática Ativada</Label>
                    <p className="text-xs text-muted-foreground">
                      A IA responde automaticamente dentro do horário definido
                    </p>
                  </div>
                  <Switch
                    checked={formData.autoReplyEnabled}
                    onCheckedChange={(v) => updateField("autoReplyEnabled", v)}
                  />
                </div>
                
                {formData.autoReplyEnabled && (
                  <>
                    <Separator />
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Início do Atendimento</Label>
                        <Select
                          value={formData.autoReplyStartHour.toString()}
                          onValueChange={(v) => updateField("autoReplyStartHour", parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, "0")}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Fim do Atendimento</Label>
                        <Select
                          value={formData.autoReplyEndHour.toString()}
                          onValueChange={(v) => updateField("autoReplyEndHour", parseInt(v))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 24 }, (_, i) => (
                              <SelectItem key={i} value={i.toString()}>
                                {i.toString().padStart(2, "0")}:00
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Atender nos Finais de Semana</Label>
                        <p className="text-xs text-muted-foreground">
                          A IA também responde aos sábados e domingos
                        </p>
                      </div>
                      <Switch
                        checked={formData.autoReplyWeekends}
                        onCheckedChange={(v) => updateField("autoReplyWeekends", v)}
                      />
                    </div>
                    
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p>
                            <strong>Horário atual:</strong> {formData.autoReplyStartHour.toString().padStart(2, "0")}:00 às {formData.autoReplyEndHour.toString().padStart(2, "0")}:00
                            {formData.autoReplyWeekends ? " (incluindo finais de semana)" : " (apenas dias úteis)"}
                          </p>
                          <p className="mt-1">
                            Fora desse horário, a IA enviará a mensagem de "fora do horário" configurada.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            
            {/* Público Alvo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Público Alvo
                </CardTitle>
                <CardDescription>
                  Para quem a IA deve responder automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Atender Leads (Novos Contatos)</Label>
                    <p className="text-xs text-muted-foreground">
                      A IA conversa com pessoas que ainda não são alunos
                    </p>
                  </div>
                  <Switch
                    checked={formData.enabledForLeads}
                    onCheckedChange={(v) => updateField("enabledForLeads", v)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Atender Alunos (WhatsApp)</Label>
                    <p className="text-xs text-muted-foreground">
                      A IA conversa com alunos via WhatsApp
                    </p>
                  </div>
                  <Switch
                    checked={formData.enabledForStudents}
                    onCheckedChange={(v) => updateField("enabledForStudents", v)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Atender no Chat Interno</Label>
                    <p className="text-xs text-muted-foreground">
                      A IA responde automaticamente no Chat FitPrime (Portal do Aluno)
                    </p>
                  </div>
                  <Switch
                    checked={formData.enabledForInternalChat}
                    onCheckedChange={(v) => updateField("enabledForInternalChat", v)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: Funcionalidades */}
          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Funcionalidades Habilitadas
                </CardTitle>
                <CardDescription>
                  O que a IA pode fazer automaticamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Agendar Avaliações</Label>
                      <p className="text-xs text-muted-foreground">
                        Para leads interessados
                      </p>
                    </div>
                    <Switch
                      checked={formData.canScheduleEvaluation}
                      onCheckedChange={(v) => updateField("canScheduleEvaluation", v)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Agendar Sessões</Label>
                      <p className="text-xs text-muted-foreground">
                        Para alunos cadastrados
                      </p>
                    </div>
                    <Switch
                      checked={formData.canScheduleSession}
                      onCheckedChange={(v) => updateField("canScheduleSession", v)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Responder sobre Treinos</Label>
                      <p className="text-xs text-muted-foreground">
                        Dúvidas sobre exercícios
                      </p>
                    </div>
                    <Switch
                      checked={formData.canAnswerWorkoutQuestions}
                      onCheckedChange={(v) => updateField("canAnswerWorkoutQuestions", v)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Responder sobre Dieta</Label>
                      <p className="text-xs text-muted-foreground">
                        Orientações gerais de alimentação
                      </p>
                    </div>
                    <Switch
                      checked={formData.canAnswerDietQuestions}
                      onCheckedChange={(v) => updateField("canAnswerDietQuestions", v)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Enviar Motivação</Label>
                      <p className="text-xs text-muted-foreground">
                        Mensagens motivacionais personalizadas
                      </p>
                    </div>
                    <Switch
                      checked={formData.canSendMotivation}
                      onCheckedChange={(v) => updateField("canSendMotivation", v)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        Falar sobre Pagamentos
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Sensível
                        </Badge>
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Cobranças e valores
                      </p>
                    </div>
                    <Switch
                      checked={formData.canHandlePayments}
                      onCheckedChange={(v) => updateField("canHandlePayments", v)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab: Escalação */}
          <TabsContent value="escalation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Regras de Escalação
                </CardTitle>
                <CardDescription>
                  Quando a IA deve passar a conversa para você
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Escalar em Sentimento Negativo</Label>
                    <p className="text-xs text-muted-foreground">
                      Passa para você quando detectar frustração ou insatisfação
                    </p>
                  </div>
                  <Switch
                    checked={formData.escalateOnSentiment}
                    onCheckedChange={(v) => updateField("escalateOnSentiment", v)}
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label>Escalar Após X Mensagens</Label>
                  <Input
                    type="number"
                    min={5}
                    max={50}
                    value={formData.escalateAfterMessages}
                    onChange={(e) => updateField("escalateAfterMessages", parseInt(e.target.value) || 10)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Se a conversa passar desse número de mensagens sem resolução, escala para você
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="escalateOnKeywords">Palavras-chave para Escalação</Label>
                  <Textarea
                    id="escalateOnKeywords"
                    value={formData.escalateOnKeywords}
                    onChange={(e) => updateField("escalateOnKeywords", e.target.value)}
                    placeholder="Ex: reclamação, cancelar, insatisfeito, problema, urgente..."
                    rows={2}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separe por vírgulas. Se o usuário mencionar essas palavras, a conversa é escalada.
                  </p>
                </div>
                
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800 dark:text-amber-200">
                        A IA sempre escalará automaticamente em casos de:
                      </p>
                      <ul className="mt-2 space-y-1 text-amber-700 dark:text-amber-300">
                        <li>• Pedido explícito para falar com você</li>
                        <li>• Reclamações sobre o serviço</li>
                        <li>• Emergências de saúde ou lesões</li>
                        <li>• Assuntos que ela não pode resolver</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
