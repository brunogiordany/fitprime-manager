import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  Sparkles,
  Dumbbell,
  Calendar,
  CreditCard,
  TrendingUp,
  Calculator,
  Trophy,
  HelpCircle,
  ChevronRight,
  BookOpen,
  Route,
  UserPlus,
  ClipboardList,
  Target,
  CheckCircle2,
  RefreshCw,
  Star
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const quickQuestions = [
  "Como registro meu treino?",
  "Como vejo minha evolução?",
  "Como uso as calculadoras?",
  "Como vejo minha agenda?",
  "Como pago meu plano?",
];

const studentFeatures = [
  {
    title: "Meus Treinos",
    icon: Dumbbell,
    description: "Veja seus treinos e registre a execução no Diário do Maromba.",
    tips: [
      "Clique em 'Treinos' para ver seu plano atual",
      "Use o botão 'Registrar Treino' para anotar cada série",
      "Informe carga, reps e como se sentiu",
      "Drop Set e Rest-Pause são registrados por série",
    ],
  },
  {
    title: "Minha Agenda",
    icon: Calendar,
    description: "Veja suas sessões agendadas e confirme presença.",
    tips: [
      "Clique em 'Agenda' para ver próximas sessões",
      "Confirme sua presença com antecedência",
      "Veja histórico de sessões realizadas",
      "Seu personal recebe notificação de confirmação",
    ],
  },
  {
    title: "Minha Evolução",
    icon: TrendingUp,
    description: "Acompanhe seu progresso com gráficos e fotos.",
    tips: [
      "Clique em 'Evolução' para ver gráficos",
      "Veja evolução de peso, gordura e medidas",
      "Compare fotos de antes e depois",
      "Dados atualizados pelo seu personal",
    ],
  },
  {
    title: "Pagamentos",
    icon: CreditCard,
    description: "Veja suas cobranças e histórico de pagamentos.",
    tips: [
      "Clique em 'Pagamentos' para ver cobranças",
      "Pague online com cartão de crédito",
      "Veja histórico completo de pagamentos",
      "Receba lembretes automáticos",
    ],
  },
  {
    title: "Calculadoras",
    icon: Calculator,
    description: "Ferramentas para calcular 1RM, TDEE, IMC e mais.",
    tips: [
      "1RM: Calcule sua carga máxima estimada",
      "TDEE: Descubra seu gasto calórico diário",
      "IMC: Índice de massa corporal",
      "BF%: Percentual de gordura corporal",
      "Zona FC: Zonas de frequência cardíaca",
    ],
  },
  {
    title: "Conquistas",
    icon: Trophy,
    description: "Desbloqueie badges por consistência e metas.",
    tips: [
      "Ganhe badges por treinar consistentemente",
      "Conquistas por 7, 30, 90 dias seguidos",
      "Celebre marcos importantes",
      "Compartilhe suas conquistas",
    ],
  },
];

// Jornada do Aluno
const studentJourney = [
  {
    step: 1,
    title: "Primeiro Acesso",
    icon: UserPlus,
    description: "Bem-vindo ao FitPrime! Seu personal te cadastrou no sistema.",
    actions: [
      "Acesse o link enviado pelo seu personal",
      "Faça login com sua conta",
      "Explore o portal e conheça as funcionalidades",
    ],
    tip: "Dica: Salve o link nos favoritos do seu celular para acesso rápido!",
  },
  {
    step: 2,
    title: "Preencha sua Anamnese",
    icon: ClipboardList,
    description: "Conte sobre você para seu personal criar o treino ideal.",
    actions: [
      "Clique no aviso 'Complete seu perfil'",
      "Preencha informações de saúde e objetivos",
      "Informe lesões, restrições e histórico",
      "Quanto mais detalhes, melhor o treino!",
    ],
    tip: "Dica: Seja honesto sobre lesões e limitações - isso protege sua saúde!",
  },
  {
    step: 3,
    title: "Receba seu Treino",
    icon: Dumbbell,
    description: "Seu personal criará um treino personalizado para você.",
    actions: [
      "Aguarde a notificação de novo treino",
      "Acesse 'Treinos' para ver o plano",
      "Veja os exercícios, séries e repetições",
      "Tire dúvidas pelo chat com seu personal",
    ],
    tip: "Dica: Leia as observações de cada exercício - há dicas importantes!",
  },
  {
    step: 4,
    title: "Confirme suas Sessões",
    icon: Calendar,
    description: "Organize sua agenda de treinos com seu personal.",
    actions: [
      "Acesse 'Agenda' para ver sessões marcadas",
      "Confirme presença com antecedência",
      "Remarque se precisar (com aviso prévio)",
      "Mantenha consistência nos horários",
    ],
    tip: "Dica: Confirmar presença ajuda seu personal a se organizar!",
  },
  {
    step: 5,
    title: "Registre seus Treinos",
    icon: Target,
    description: "Use o Diário do Maromba para anotar cada treino.",
    actions: [
      "Após cada treino, clique em 'Registrar Treino'",
      "Informe a carga usada em cada série",
      "Marque as repetições realizadas",
      "Indique como se sentiu (fácil/moderado/difícil)",
    ],
    tip: "Dica: Registrar cargas ajuda a acompanhar sua evolução de força!",
  },
  {
    step: 6,
    title: "Acompanhe sua Evolução",
    icon: TrendingUp,
    description: "Veja seu progresso ao longo do tempo.",
    actions: [
      "Acesse 'Evolução' para ver gráficos",
      "Acompanhe peso, medidas e % de gordura",
      "Compare fotos de antes e depois",
      "Celebre cada conquista!",
    ],
    tip: "Dica: Tire fotos de progresso mensalmente - a mudança visual motiva!",
  },
  {
    step: 7,
    title: "Mantenha os Pagamentos em Dia",
    icon: CreditCard,
    description: "Gerencie suas cobranças pelo portal.",
    actions: [
      "Acesse 'Pagamentos' para ver cobranças",
      "Pague online com cartão de crédito",
      "Veja histórico de pagamentos",
      "Configure lembretes automáticos",
    ],
    tip: "Dica: Pagamentos em dia garantem continuidade do acompanhamento!",
  },
  {
    step: 8,
    title: "Análise Mensal",
    icon: RefreshCw,
    description: "A cada 30 dias, seu personal fará uma análise completa.",
    actions: [
      "Seu personal analisa seus registros de treino",
      "Avalia evolução de medidas e fotos",
      "Identifica pontos fortes e a melhorar",
      "Ajusta o treino conforme necessário",
    ],
    tip: "Dica: Quanto mais você registrar, melhor será a análise!",
  },
  {
    step: 9,
    title: "Conquiste Badges",
    icon: Trophy,
    description: "Desbloqueie conquistas por consistência e metas.",
    actions: [
      "Treine consistentemente para ganhar badges",
      "7 dias seguidos = Primeira Semana",
      "30 dias = Maromba Dedicado",
      "90 dias = Lenda da Academia",
    ],
    tip: "Dica: Compartilhe suas conquistas nas redes sociais!",
  },
  {
    step: 10,
    title: "Continue Evoluindo",
    icon: Star,
    description: "O ciclo continua - cada mês é uma nova oportunidade!",
    actions: [
      "Mantenha a consistência nos treinos",
      "Comunique-se com seu personal",
      "Ajuste objetivos conforme evolui",
      "Celebre cada vitória, grande ou pequena!",
    ],
    tip: "Dica: Resultados vêm com tempo e consistência. Confie no processo!",
  },
];

export default function StudentHelpCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const askAIMutation = trpc.support.askAI.useMutation();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (question?: string) => {
    const messageToSend = question || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = { role: "user", content: messageToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await askAIMutation.mutateAsync({
        question: messageToSend,
        context: "student",
      });

      const assistantMessage: Message = { role: "assistant", content: response.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = { 
        role: "assistant", 
        content: "Desculpe, não consegui processar sua pergunta. Tente novamente." 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="journey" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="journey" className="text-[10px] sm:text-sm py-2">
            <Route className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Jornada</span>
            <span className="sm:hidden">Jornada</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="text-[10px] sm:text-sm py-2">
            <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Pergunte à IA</span>
            <span className="sm:hidden">IA</span>
          </TabsTrigger>
          <TabsTrigger value="guide" className="text-[10px] sm:text-sm py-2">
            <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="hidden sm:inline">Guia</span>
            <span className="sm:hidden">Guia</span>
          </TabsTrigger>
        </TabsList>

        {/* Jornada do Aluno */}
        <TabsContent value="journey" className="mt-4 space-y-3">
          <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Route className="h-5 w-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-800">Sua Jornada no FitPrime</h3>
              </div>
              <p className="text-xs sm:text-sm text-emerald-700">
                Siga estes passos para aproveitar ao máximo seu acompanhamento com personal trainer!
              </p>
            </CardContent>
          </Card>

          {/* Timeline da Jornada */}
          <div className="relative">
            {/* Linha vertical conectando os passos */}
            <div className="absolute left-[19px] sm:left-[23px] top-8 bottom-8 w-0.5 bg-emerald-200" />
            
            <div className="space-y-3">
              {studentJourney.map((item, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex gap-3">
                      {/* Número do passo */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center">
                          <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
                        </div>
                        <Badge 
                          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-emerald-600"
                        >
                          {item.step}
                        </Badge>
                      </div>
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base mb-1">
                          {item.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mb-2">
                          {item.description}
                        </p>
                        
                        {/* Ações */}
                        <ul className="space-y-1 mb-2">
                          {item.actions.map((action, actionIndex) => (
                            <li key={actionIndex} className="flex items-start gap-1.5 text-xs">
                              <CheckCircle2 className="h-3 w-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                              <span className="text-muted-foreground">{action}</span>
                            </li>
                          ))}
                        </ul>
                        
                        {/* Dica */}
                        <div className="bg-amber-50 rounded-md p-2 border border-amber-200">
                          <p className="text-[10px] sm:text-xs text-amber-800">
                            💡 {item.tip}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Card final */}
          <Card className="border-emerald-300 bg-emerald-50">
            <CardContent className="p-3 sm:p-4 text-center">
              <Star className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-emerald-800">
                Você está no caminho certo!
              </p>
              <p className="text-xs text-emerald-700">
                Siga a jornada e alcance seus objetivos com o FitPrime.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat com IA */}
        <TabsContent value="chat" className="mt-4">
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                FitPrime IA
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Tire suas dúvidas sobre o portal
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 sm:px-6">
              {/* Área de mensagens */}
              <div 
                ref={scrollRef}
                className="h-[250px] sm:h-[300px] overflow-y-auto border rounded-lg p-3 mb-3 bg-muted/30"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                      <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Como posso te ajudar?
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {quickQuestions.map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          className="text-[10px] sm:text-xs h-7 px-2"
                          onClick={() => handleSend(q)}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg px-3 py-2 text-xs sm:text-sm ${
                            msg.role === "user"
                              ? "bg-emerald-600 text-white"
                              : "bg-muted"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua dúvida..."
                  className="text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  disabled={isLoading}
                />
                <Button 
                  onClick={() => handleSend()} 
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center mt-2">
                Respostas geradas por IA. Podem conter imprecisões.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Guia do Portal */}
        <TabsContent value="guide" className="mt-4 space-y-3">
          {studentFeatures.map((feature, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="pb-2 px-3 sm:px-4 py-3">
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <feature.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                  </div>
                  {feature.title}
                </CardTitle>
                <CardDescription className="text-xs">
                  {feature.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-3 sm:px-4 pb-3">
                <ul className="space-y-1">
                  {feature.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start gap-2 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3 mt-0.5 text-emerald-500 flex-shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}

          {/* Dica final */}
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-emerald-800">
                    Ainda tem dúvidas?
                  </p>
                  <p className="text-xs text-emerald-700">
                    Use a aba "Pergunte à IA" para tirar qualquer dúvida sobre o portal!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
