import { useState, useRef, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  Sparkles, 
  BookOpen, 
  Route, 
  HelpCircle,
  Users,
  Dumbbell,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  MessageSquare,
  ChevronRight,
  CheckCircle2,
  Circle,
  Bot,
  User
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

// Base de conhecimento do FitPrime para a IA
const FITPRIME_KNOWLEDGE = `
Você é a FitPrime IA, assistente virtual do FitPrime Manager - o sistema de gestão para personal trainers mais inteligente do Brasil.

FUNCIONALIDADES DO SISTEMA:

1. GESTÃO DE ALUNOS:
- Cadastrar alunos com dados completos (nome, email, telefone, data nascimento)
- Anamnese completa com histórico versionado
- Medidas corporais com gráficos de evolução
- Fotos de evolução (antes/depois)
- Permissões granulares (o que cada aluno pode ver)

2. TREINOS:
- Criar treinos do zero ou usar templates
- Gerar treinos com IA baseado na anamnese do aluno
- Treino 2.0: análise do aluno + geração de treino adaptado
- Organização por dias (Treino A, B, C)
- Exercícios com séries, repetições, carga, descanso
- Técnicas avançadas: Drop Set, Rest-Pause, Bi-Set, Tri-Set
- Diário do Maromba: registro detalhado de cada treino

3. AGENDA:
- Visualização diária, semanal e mensal
- Agendamento automático ao vincular plano
- Status de sessão (Agendada, Confirmada, Realizada, Falta, Cancelada)
- Filtros por status
- Recorrência de sessões

4. FINANCEIRO:
- Planos personalizados (mensal, trimestral, semestral, anual)
- Cobranças automáticas recorrentes
- Pagamento online via Stripe (cartão de crédito)
- Gestão de contratos (Ativo, Pausado, Cancelado, Inadimplente)
- Relatórios financeiros

5. COMUNICAÇÃO:
- Chat interno com alunos
- Automações WhatsApp via Stevo:
  * Lembrete 24h antes do treino
  * Lembrete 2h antes do treino
  * Lembrete de pagamento (3 dias antes)
  * Aviso de pagamento em atraso
  * Mensagem de boas-vindas
  * Mensagem de aniversário

6. PORTAL DO ALUNO:
- Acesso via convite (email ou WhatsApp)
- Ver treinos e registrar execução
- Ver agenda de sessões
- Ver histórico de pagamentos
- Ver evolução (medidas, fotos e estatísticas)
- Calculadoras fitness (1RM, TDEE, IMC, BF%, Zona FC)
- Sistema de conquistas/gamificação
- Estatísticas de frequência: taxa de presença, sessões realizadas, faltas
- Dashboard de treino: volume total, séries, reps, evolução de carga
- Gráficos de frequência mensal e composição corporal

7. RELATÓRIOS:
- Gráficos de evolução dos alunos
- Frequência mensal
- Análise de receita
- Taxa de presença
- Exportar PDF
- Estatísticas de sessão: presenças, faltas, este mês, mês passado
- Comparativo mensal de frequência
- Gráfico de frequência mensal (presenças vs faltas)

8. DIFERENCIAIS EXCLUSIVOS:
- IA para análise de aluno (identifica déficits e pontos fortes)
- IA para geração de treinos personalizados
- Treino 2.0 adaptativo
- Diário do Maromba com técnicas avançadas
- 6 automações WhatsApp prontas
- Histórico versionado de anamnese

JORNADA DO PERSONAL:
1. Cadastrar-se no sistema
2. Configurar perfil (CREF, especialidades, horários)
3. Criar planos de treino (preços, frequências)
4. Cadastrar primeiro aluno
5. Preencher anamnese do aluno
6. Criar ou gerar treino com IA
7. Vincular plano ao aluno (gera agendamentos automáticos)
8. Acompanhar sessões na agenda
9. Registrar medidas mensalmente
10. Fazer análise mensal e adaptar treino

JORNADA DO ALUNO:
1. Receber convite do personal
2. Criar conta no portal
3. Visualizar treino do dia
4. Registrar execução no Diário do Maromba
5. Acompanhar evolução
6. Ver próximas sessões na agenda
7. Manter pagamentos em dia

Responda sempre de forma clara, objetiva e amigável. Se não souber algo específico, sugira que o usuário entre em contato com o suporte humano.
`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  "Como o app funciona?",
  "Como cadastrar um aluno?",
  "Como montar um treino?",
  "Como gerar treino com IA?",
  "Como funciona o Diário do Maromba?",
  "Como configurar automações WhatsApp?",
  "Como receber pagamentos?",
  "Como fazer análise do aluno?",
];

const journeySteps = [
  {
    step: 1,
    title: "Configure seu Perfil",
    description: "Preencha seus dados profissionais: CREF, especialidades, horários de atendimento e foto.",
    icon: Settings,
    path: "/configuracoes",
  },
  {
    step: 2,
    title: "Crie seus Planos",
    description: "Defina os planos que você oferece: mensal, trimestral, frequência semanal e valores.",
    icon: CreditCard,
    path: "/planos",
  },
  {
    step: 3,
    title: "Cadastre seu Primeiro Aluno",
    description: "Adicione um aluno com dados básicos. Você pode convidá-lo para o portal depois.",
    icon: Users,
    path: "/alunos",
  },
  {
    step: 4,
    title: "Preencha a Anamnese",
    description: "Registre o histórico de saúde, objetivos, restrições e estilo de vida do aluno.",
    icon: BookOpen,
    path: "/alunos",
  },
  {
    step: 5,
    title: "Crie ou Gere um Treino",
    description: "Monte um treino do zero, use templates ou deixe a IA criar baseado na anamnese.",
    icon: Dumbbell,
    path: "/treinos",
  },
  {
    step: 6,
    title: "Vincule o Plano ao Aluno",
    description: "Associe um plano ao aluno. Os agendamentos serão criados automaticamente.",
    icon: Calendar,
    path: "/alunos",
  },
  {
    step: 7,
    title: "Acompanhe na Agenda",
    description: "Visualize todas as sessões, marque presença, faltas ou cancele quando necessário.",
    icon: Calendar,
    path: "/agenda",
  },
  {
    step: 8,
    title: "Registre Medidas Mensais",
    description: "A cada mês, registre peso, medidas e fotos para acompanhar a evolução.",
    icon: BarChart3,
    path: "/evolucao",
  },
  {
    step: 9,
    title: "Faça Análise Mensal",
    description: "Use a IA para analisar o progresso do aluno e gerar o Treino 2.0 adaptado.",
    icon: Sparkles,
    path: "/treinos",
  },
  {
    step: 10,
    title: "Configure Automações",
    description: "Ative lembretes automáticos de treino e pagamento via WhatsApp.",
    icon: MessageSquare,
    path: "/automacoes",
  },
];

const features = [
  {
    title: "Gestão de Alunos",
    icon: Users,
    description: "Cadastre alunos, preencha anamnese, registre medidas e acompanhe a evolução.",
    tips: [
      "Use o botão 'Novo Aluno' para cadastrar com dados completos",
      "Preencha a anamnese completa para treinos mais precisos com IA",
      "Registre medidas a cada 30 dias para ver gráficos de evolução",
      "Convide o aluno para o portal via email ou WhatsApp",
      "Configure permissões granulares (o que cada aluno pode ver)",
      "Adicione fotos de evolução (antes/depois) para motivar",
    ],
  },
  {
    title: "Treinos com IA",
    icon: Sparkles,
    description: "Crie treinos do zero, use templates ou deixe a IA gerar baseado na anamnese.",
    tips: [
      "Clique em 'Gerar com IA' para treino automático personalizado",
      "Use 'Análise do Aluno' para ver déficits e gerar Treino 2.0",
      "Templates economizam tempo para treinos similares",
      "Organize por dias: Treino A, B, C, D...",
      "Defina séries, repetições, carga e tempo de descanso",
      "Use técnicas avançadas: Drop Set, Rest-Pause, Bi-Set, Tri-Set",
    ],
  },
  {
    title: "Diário do Maromba",
    icon: Dumbbell,
    description: "Registro detalhado de cada treino executado pelo aluno.",
    tips: [
      "O aluno registra carga, reps e sensação de cada série",
      "Suporte a Drop Set com múltiplos drops por série",
      "Suporte a Rest-Pause com múltiplas pausas por série",
      "Anotações livres por exercício",
      "Histórico completo visível para personal e aluno",
      "Dados usados pela IA para gerar Treino 2.0",
    ],
  },
  {
    title: "Agenda Inteligente",
    icon: Calendar,
    description: "Visualize sessões, marque presença e gerencie horários automaticamente.",
    tips: [
      "Ao vincular plano, agendamentos são criados automaticamente",
      "Visualização diária, semanal e mensal",
      "Status: Agendada, Confirmada, Realizada, Falta, Cancelada",
      "Clique na sessão para editar ou reagendar",
      "Filtros por status para organizar melhor",
      "Recorrência automática de sessões",
    ],
  },
  {
    title: "Cobranças e Planos",
    icon: CreditCard,
    description: "Crie planos, gere cobranças automáticas e receba pagamentos online.",
    tips: [
      "Crie planos: mensal, trimestral, semestral, anual",
      "Defina frequência semanal (1x, 2x, 3x, 4x, 5x)",
      "Cobranças recorrentes geradas automaticamente",
      "Aceite cartão de crédito via Stripe",
      "Gerencie contratos: Ativo, Pausado, Cancelado, Inadimplente",
      "Relatórios financeiros com receita por período",
    ],
  },
  {
    title: "Automações WhatsApp",
    icon: MessageSquare,
    description: "Envie lembretes automáticos de treino, pagamento e aniversário via Stevo.",
    tips: [
      "Conecte seu WhatsApp via Stevo nas Configurações",
      "Lembrete 24h antes do treino",
      "Lembrete 2h antes do treino",
      "Lembrete de pagamento (3 dias antes)",
      "Aviso de pagamento em atraso",
      "Mensagem de boas-vindas e aniversário",
    ],
  },
  {
    title: "Portal do Aluno",
    icon: User,
    description: "Seu aluno acessa treinos, agenda, pagamentos e evolução pelo celular.",
    tips: [
      "Convite via email ou WhatsApp",
      "Ver treinos e registrar execução no Diário",
      "Ver agenda de sessões",
      "Ver histórico de pagamentos",
      "Ver evolução (medidas, fotos e estatísticas)",
      "Calculadoras fitness: 1RM, TDEE, IMC, BF%, Zona FC",
      "Estatísticas de frequência: presenças, faltas, taxa de presença",
      "Dashboard de treino: volume, séries, evolução de carga",
    ],
  },
  {
    title: "Evolução e Medidas",
    icon: BarChart3,
    description: "Acompanhe a evolução do aluno com gráficos, estatísticas e fotos.",
    tips: [
      "Registre peso, gordura corporal e medidas",
      "Gráficos de evolução ao longo do tempo",
      "Fotos de antes/depois para motivar",
      "Exportar relatório de evolução em PDF",
      "Histórico completo de todas as medições",
      "Dados usados pela IA para análise",
      "Estatísticas de frequência: taxa de presença, sessões realizadas, faltas",
      "Comparativo mensal: este mês vs mês anterior",
      "Gráfico de frequência mensal (presenças vs faltas)",
    ],
  },
  {
    title: "Anamnese Inteligente",
    icon: BookOpen,
    description: "Ficha completa de saúde, objetivos e restrições do aluno.",
    tips: [
      "Histórico de saúde e lesões",
      "Objetivos e expectativas",
      "Restrições alimentares e de exercícios",
      "Estilo de vida e rotina",
      "Histórico versionado (nunca perde dados)",
      "Dados usados pela IA para gerar treinos",
    ],
  },
  {
    title: "Chat Interno",
    icon: MessageCircle,
    description: "Comunique-se com seus alunos diretamente pelo app.",
    tips: [
      "Mensagens em tempo real",
      "Histórico de conversas",
      "Notificações de novas mensagens",
      "Envie orientações e feedbacks",
      "Tire dúvidas dos alunos rapidamente",
      "Tudo centralizado em um lugar",
    ],
  },
  {
    title: "Gamificação",
    icon: Sparkles,
    description: "Sistema de conquistas e badges para motivar seus alunos.",
    tips: [
      "Conquistas por consistência (7, 30, 90 dias)",
      "Badges por metas atingidas",
      "Ranking entre alunos (opcional)",
      "Celebração de marcos importantes",
      "Aumenta engajamento e retenção",
      "Visível no portal do aluno",
    ],
  },
  {
    title: "Calculadoras Fitness",
    icon: HelpCircle,
    description: "Ferramentas para cálculos de treino e nutrição.",
    tips: [
      "1RM - Carga máxima estimada",
      "TDEE - Gasto calórico diário",
      "IMC - Índice de massa corporal",
      "BF% - Percentual de gordura",
      "Zona FC - Zonas de frequência cardíaca",
      "Disponível para personal e aluno",
    ],
  },
];

export default function Support() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  const askAIMutation = trpc.support.askAI.useMutation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (question?: string) => {
    const text = question || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askAIMutation.mutateAsync({
        question: text,
        context: FITPRIME_KNOWLEDGE,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: typeof response.answer === 'string' ? response.answer : String(response.answer),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Central de Ajuda</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tire suas dúvidas com a FitPrime IA ou explore os guias
          </p>
        </div>

        <Tabs defaultValue="ai" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="ai" className="text-xs sm:text-sm py-2 gap-1 sm:gap-2">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Pergunte à</span> IA
            </TabsTrigger>
            <TabsTrigger value="journey" className="text-xs sm:text-sm py-2 gap-1 sm:gap-2">
              <Route className="h-3 w-3 sm:h-4 sm:w-4" />
              Jornada
            </TabsTrigger>
            <TabsTrigger value="guide" className="text-xs sm:text-sm py-2 gap-1 sm:gap-2">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              Guia
            </TabsTrigger>
          </TabsList>

          {/* Tab: Pergunte à IA */}
          <TabsContent value="ai" className="space-y-4">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base sm:text-lg">FitPrime IA</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Tire suas dúvidas sobre o sistema
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Área de mensagens */}
                <ScrollArea 
                  ref={scrollRef}
                  className="h-[300px] sm:h-[350px] rounded-lg border bg-muted/30 p-3 sm:p-4"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
                        <MessageCircle className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base">Como posso te ajudar?</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                          Pergunte qualquer coisa sobre o FitPrime
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-2 sm:gap-3 ${
                            message.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          {message.role === "assistant" && (
                            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                            </div>
                          )}
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm ${
                              message.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-background border shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                          {message.role === "user" && (
                            <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-2 sm:gap-3 justify-start">
                          <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                          </div>
                          <div className="bg-background border shadow-sm rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5">
                            <div className="flex gap-1">
                              <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Sugestões rápidas */}
                {messages.length === 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {quickQuestions.slice(0, 6).map((question) => (
                      <Button
                        key={question}
                        variant="outline"
                        size="sm"
                        className="text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
                        onClick={() => handleSend(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Input */}
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Escreva sua pergunta..."
                    disabled={isLoading}
                    className="text-sm"
                  />
                  <Button 
                    onClick={() => handleSend()} 
                    disabled={!input.trim() || isLoading}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                  As respostas são geradas por IA e podem conter imprecisões. 
                  Para suporte humano, entre em contato via WhatsApp.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Jornada do Personal */}
          <TabsContent value="journey" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Route className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Jornada do Personal Trainer
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Siga estes passos para aproveitar ao máximo o FitPrime
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Linha conectora */}
                  <div className="absolute left-4 sm:left-5 top-8 bottom-8 w-0.5 bg-border" />
                  
                  <div className="space-y-4 sm:space-y-6">
                    {journeySteps.map((step, index) => (
                      <div key={step.step} className="relative flex gap-3 sm:gap-4">
                        {/* Círculo numerado */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                            index < 3 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-muted text-muted-foreground border-2 border-border"
                          }`}>
                            {index < 3 ? <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" /> : step.step}
                          </div>
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="flex-1 pb-4 sm:pb-6">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                                <step.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                                {step.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                {step.description}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs h-7 sm:h-8 px-2"
                              onClick={() => setLocation(step.path)}
                            >
                              Ir <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ciclo de Acompanhamento */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Ciclo de Acompanhamento (30 dias)
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Recomendamos análises a cada 30 dias para manter o aluno engajado e motivado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-background rounded-lg p-3 sm:p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-xs sm:text-sm">1</span>
                      </div>
                      <h4 className="font-semibold text-sm sm:text-base">Dia 1-7</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Registrar novas medidas e fotos do aluno para acompanhar evolução
                    </p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-3 sm:p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-bold text-xs sm:text-sm">2</span>
                      </div>
                      <h4 className="font-semibold text-sm sm:text-base">Dia 8-15</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Usar "Análise do Aluno" para ver evolução, déficits e pontos fortes
                    </p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-3 sm:p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-xs sm:text-sm">3</span>
                      </div>
                      <h4 className="font-semibold text-sm sm:text-base">Dia 16-23</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Gerar Treino 2.0 adaptado baseado na análise da IA
                    </p>
                  </div>
                  
                  <div className="bg-background rounded-lg p-3 sm:p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-orange-600 font-bold text-xs sm:text-sm">4</span>
                      </div>
                      <h4 className="font-semibold text-sm sm:text-base">Dia 24-30</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Apresentar resultados, novo treino e renovar motivação do aluno
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <p className="text-xs sm:text-sm text-primary font-medium">
                    💡 Dica: Análises a cada 30 dias aumentam a retenção do aluno em até 40% e mostram que você se importa com o progresso dele!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Guia de Funcionalidades */}
          <TabsContent value="guide" className="space-y-4">
            <div className="grid gap-3 sm:gap-4">
              {features.map((feature) => (
                <Card key={feature.title}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                      <feature.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5 sm:space-y-2">
                      {feature.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
