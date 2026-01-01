import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MessageCircle, 
  Send, 
  Sparkles, 
  BookOpen, 
  Route, 
  Dumbbell,
  Calendar,
  CreditCard,
  BarChart3,
  ChevronRight,
  CheckCircle2,
  Bot,
  User,
  Camera,
  Trophy,
  Calculator,
  ArrowLeft
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";

// Base de conhecimento do FitPrime para a IA (versão aluno)
const FITPRIME_KNOWLEDGE_STUDENT = `
Você é a FitPrime IA, assistente virtual do Portal do Aluno do FitPrime Manager.

FUNCIONALIDADES DO PORTAL DO ALUNO:

1. MEUS TREINOS:
- Ver todos os treinos criados pelo seu personal
- Cada treino tem dias (A, B, C) com exercícios específicos
- Ver detalhes de cada exercício: séries, repetições, carga, descanso
- Registrar execução no Diário do Maromba

2. DIÁRIO DO MAROMBA:
- Registrar cada série que você faz
- Anotar peso usado e repetições realizadas
- Técnicas avançadas: Drop Set, Rest-Pause, Bi-Set
- Seu personal acompanha tudo em tempo real

3. MINHA AGENDA:
- Ver próximas sessões agendadas com seu personal
- Status das sessões (Agendada, Confirmada, Realizada, Falta)
- Histórico de todas as sessões

4. MINHA EVOLUÇÃO:
- Gráficos de evolução de peso e medidas
- Fotos de antes/depois
- Acompanhar progresso ao longo do tempo

5. MEUS PAGAMENTOS:
- Ver histórico de pagamentos
- Status de cada cobrança (Pago, Pendente, Atrasado)
- Pagar online com cartão de crédito

6. CALCULADORAS FITNESS:
- 1RM (Repetição Máxima): calcular sua carga máxima
- TDEE (Gasto Calórico): calcular quantas calorias você gasta por dia
- IMC (Índice de Massa Corporal)
- BF% (Percentual de Gordura)
- Zona de Frequência Cardíaca

7. CONQUISTAS:
- Sistema de badges e conquistas
- Ganhe pontos por treinar consistentemente
- Desbloqueie conquistas especiais

JORNADA DO ALUNO:
1. Receber convite do personal (email ou WhatsApp)
2. Criar conta no portal
3. Ver seu treino do dia
4. Ir para a academia e treinar
5. Registrar execução no Diário do Maromba
6. Acompanhar sua evolução
7. Manter pagamentos em dia

DICAS IMPORTANTES:
- Registre TODOS os treinos no Diário do Maromba
- Seu personal acompanha seu progresso em tempo real
- Quanto mais dados você registrar, melhor será a análise
- Use as calculadoras para entender melhor seu corpo

Responda sempre de forma clara, objetiva e motivacional. Se não souber algo específico, sugira que o aluno pergunte ao personal.
`;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  "Como funciona o portal?",
  "Como registro meu treino?",
  "O que é o Diário do Maromba?",
  "Como vejo minha evolução?",
  "Como faço pagamentos?",
  "O que são as conquistas?",
];

const journeySteps = [
  {
    step: 1,
    title: "Acesse seu Treino",
    description: "Veja o treino que seu personal criou para você. Cada dia tem exercícios específicos.",
    icon: Dumbbell,
  },
  {
    step: 2,
    title: "Vá para a Academia",
    description: "Leve seu celular e siga o treino. Você pode ver os detalhes de cada exercício.",
    icon: Route,
  },
  {
    step: 3,
    title: "Registre no Diário",
    description: "Após cada série, anote o peso e as repetições que você fez. Isso ajuda seu personal a acompanhar.",
    icon: BookOpen,
  },
  {
    step: 4,
    title: "Acompanhe sua Evolução",
    description: "Veja gráficos de progresso, fotos de antes/depois e conquistas desbloqueadas.",
    icon: BarChart3,
  },
  {
    step: 5,
    title: "Mantenha Pagamentos em Dia",
    description: "Pague online com cartão ou siga as instruções do seu personal.",
    icon: CreditCard,
  },
];

const features = [
  {
    title: "Meus Treinos",
    icon: Dumbbell,
    description: "Veja todos os treinos criados pelo seu personal.",
    tips: [
      "Cada treino tem dias diferentes (A, B, C)",
      "Toque em um exercício para ver detalhes",
      "Use o Diário do Maromba para registrar",
    ],
  },
  {
    title: "Diário do Maromba",
    icon: BookOpen,
    description: "Registre cada série que você faz na academia.",
    tips: [
      "Anote peso e repetições de cada série",
      "Use técnicas como Drop Set e Rest-Pause",
      "Seu personal vê tudo em tempo real",
    ],
  },
  {
    title: "Minha Evolução",
    icon: BarChart3,
    description: "Acompanhe seu progresso ao longo do tempo.",
    tips: [
      "Veja gráficos de peso e medidas",
      "Compare fotos de antes e depois",
      "Acompanhe suas conquistas",
    ],
  },
  {
    title: "Calculadoras",
    icon: Calculator,
    description: "Ferramentas para entender melhor seu corpo.",
    tips: [
      "1RM: calcule sua carga máxima",
      "TDEE: saiba quantas calorias você gasta",
      "IMC e BF%: acompanhe sua composição",
    ],
  },
  {
    title: "Conquistas",
    icon: Trophy,
    description: "Ganhe badges por treinar consistentemente.",
    tips: [
      "Desbloqueie conquistas especiais",
      "Ganhe pontos por cada treino",
      "Compare com outros alunos",
    ],
  },
];

export default function StudentSupport() {
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
        context: FITPRIME_KNOWLEDGE_STUDENT,
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
        content: "Desculpe, ocorreu um erro. Tente novamente ou pergunte ao seu personal!",
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/meu-portal">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold">Central de Ajuda</h1>
            <p className="text-xs text-muted-foreground">Tire suas dúvidas</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 space-y-4">
        <Tabs defaultValue="ai" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto">
            <TabsTrigger value="ai" className="text-xs py-2 gap-1">
              <Sparkles className="h-3 w-3" />
              IA
            </TabsTrigger>
            <TabsTrigger value="journey" className="text-xs py-2 gap-1">
              <Route className="h-3 w-3" />
              Jornada
            </TabsTrigger>
            <TabsTrigger value="guide" className="text-xs py-2 gap-1">
              <BookOpen className="h-3 w-3" />
              Guia
            </TabsTrigger>
          </TabsList>

          {/* Tab: Pergunte à IA */}
          <TabsContent value="ai" className="space-y-4">
            <Card className="border-emerald-200 dark:border-emerald-800">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">FitPrime IA</CardTitle>
                    <CardDescription className="text-xs">
                      Tire suas dúvidas sobre o portal
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Área de mensagens */}
                <ScrollArea 
                  ref={scrollRef}
                  className="h-[280px] rounded-lg border bg-muted/30 p-3"
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Como posso te ajudar?</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          Pergunte sobre o portal
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-2 ${
                            message.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          {message.role === "assistant" && (
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-3.5 w-3.5 text-white" />
                            </div>
                          )}
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs ${
                              message.role === "user"
                                ? "bg-emerald-600 text-white"
                                : "bg-background border shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          </div>
                          {message.role === "user" && (
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                              <User className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex gap-2 justify-start">
                          <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-3.5 w-3.5 text-white" />
                          </div>
                          <div className="bg-background border shadow-sm rounded-2xl px-3 py-2">
                            <div className="flex gap-1">
                              <span className="h-2 w-2 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                              <span className="h-2 w-2 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                              <span className="h-2 w-2 bg-emerald-500/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Sugestões rápidas */}
                {messages.length === 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {quickQuestions.map((question) => (
                      <Button
                        key={question}
                        variant="outline"
                        size="sm"
                        className="text-[10px] h-7 px-2"
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
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground text-center">
                  Respostas geradas por IA. Para dúvidas específicas, fale com seu personal.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Jornada do Aluno */}
          <TabsContent value="journey" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Route className="h-4 w-4 text-emerald-600" />
                  Sua Jornada no FitPrime
                </CardTitle>
                <CardDescription className="text-xs">
                  Siga estes passos para aproveitar ao máximo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Linha conectora */}
                  <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-emerald-200 dark:bg-emerald-800" />
                  
                  <div className="space-y-4">
                    {journeySteps.map((step) => (
                      <div key={step.step} className="relative flex gap-3">
                        {/* Círculo numerado */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 border-2 border-emerald-500 flex items-center justify-center">
                            <step.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                        
                        {/* Conteúdo */}
                        <div className="flex-1 pb-4">
                          <h3 className="font-semibold text-sm">{step.title}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dica motivacional */}
            <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                    <Trophy className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-emerald-800 dark:text-emerald-200">
                      Dica de Ouro
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                      Registre TODOS os treinos no Diário do Maromba! Quanto mais dados você fornecer, 
                      melhor seu personal poderá adaptar seu treino para resultados mais rápidos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Guia de Funcionalidades */}
          <TabsContent value="guide" className="space-y-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <feature.icon className="h-4 w-4 text-emerald-600" />
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5">
                    {feature.tips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
