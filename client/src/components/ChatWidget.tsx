import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Minimize2,
  Maximize2,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "visitor" | "ai" | "personal";
  message: string;
  timestamp: number;
  isAutoReply?: boolean;
}

interface ChatConversation {
  visitorId: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
  messages: ChatMessage[];
  status: "active" | "closed" | "waiting";
  createdAt: number;
}

const AI_RESPONSES = {
  precos: "Oferecemos 5 planos: Starter (R$ 97/mês até 15 alunos), Pro (R$ 147/mês até 25 alunos), Business (R$ 197/mês até 40 alunos), Premium (R$ 297/mês até 70 alunos) e Enterprise (R$ 497/mês até 150 alunos). Qual se encaixa melhor no seu negócio?",
  trial: "Sim! Você pode testar completamente grátis por 1 dia. Sem cartão de crédito, sem compromisso. Basta clicar em 'Testar Grátis' na página inicial.",
  features: "O FitPrime oferece: Agenda inteligente, Geração de treinos com IA, Cobranças automáticas, Portal do aluno, Análise de evolução com gráficos, Integração com WhatsApp e muito mais!",
  cancelamento: "Você pode cancelar sua assinatura a qualquer momento, sem multa ou contrato. Basta acessar as configurações da sua conta.",
  pagamento: "Aceitamos cartão de crédito, Pix, boleto e mais. O pagamento é processado pela Cakto, plataforma segura e confiável.",
  alunos: "Sim! Todos os planos permitem alunos ilimitados. Você paga apenas pelos alunos que excederem o limite do seu plano (preço por aluno extra varia conforme o plano).",
  integracao: "Integramos com WhatsApp (para notificações automáticas), Google Calendar, Cakto (pagamentos) e temos API aberta para integrações customizadas.",
  suporte: "Oferecemos suporte por email em todos os planos. Planos Pro+ têm suporte prioritário, e Enterprise tem suporte 24/7 dedicado.",
  default: "Ótima pergunta! Você pode conferir mais detalhes na nossa página ou falar com um especialista. Como posso ajudar mais?",
};

function getAIResponse(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes("preço") ||
    lowerMessage.includes("plano") ||
    lowerMessage.includes("custa")
  ) {
    return AI_RESPONSES.precos;
  }
  if (
    lowerMessage.includes("teste") ||
    lowerMessage.includes("trial") ||
    lowerMessage.includes("grátis")
  ) {
    return AI_RESPONSES.trial;
  }
  if (
    lowerMessage.includes("funcionalidade") ||
    lowerMessage.includes("feature") ||
    lowerMessage.includes("o que faz")
  ) {
    return AI_RESPONSES.features;
  }
  if (
    lowerMessage.includes("cancelar") ||
    lowerMessage.includes("contrato")
  ) {
    return AI_RESPONSES.cancelamento;
  }
  if (
    lowerMessage.includes("pagamento") ||
    lowerMessage.includes("pagar")
  ) {
    return AI_RESPONSES.pagamento;
  }
  if (lowerMessage.includes("aluno")) {
    return AI_RESPONSES.alunos;
  }
  if (
    lowerMessage.includes("integra") ||
    lowerMessage.includes("whatsapp") ||
    lowerMessage.includes("api")
  ) {
    return AI_RESPONSES.integracao;
  }
  if (
    lowerMessage.includes("suporte") ||
    lowerMessage.includes("ajuda")
  ) {
    return AI_RESPONSES.suporte;
  }

  return AI_RESPONSES.default;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visitorId, setVisitorId] = useState<string>("");
  const [visitorInfo, setVisitorInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [showForm, setShowForm] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Gerar ID único do visitante
  useEffect(() => {
    let id = localStorage.getItem("fitprime_visitor_id");
    if (!id) {
      id = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("fitprime_visitor_id", id);
    }
    setVisitorId(id);

    // Carregar histórico de conversas
    const savedConversation = localStorage.getItem(`chat_${id}`);
    if (savedConversation) {
      const conversation = JSON.parse(savedConversation) as ChatConversation;
      setMessages(conversation.messages);
      setVisitorInfo({
        name: conversation.visitorName || "",
        email: conversation.visitorEmail || "",
        phone: conversation.visitorPhone || "",
      });
      setShowForm(false);
    }
  }, []);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveConversation = (msgs: ChatMessage[]) => {
    const conversation: ChatConversation = {
      visitorId,
      visitorName: visitorInfo.name,
      visitorEmail: visitorInfo.email,
      visitorPhone: visitorInfo.phone,
      messages: msgs,
      status: "active",
      createdAt: Date.now(),
    };
    localStorage.setItem(`chat_${visitorId}`, JSON.stringify(conversation));
  };

  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (visitorInfo.name && visitorInfo.email) {
      setShowForm(false);

      // Mensagem de boas-vindas
      const welcomeMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: "ai",
        message: `Olá ${visitorInfo.name}! 👋 Bem-vindo ao FitPrime! Como posso ajudá-lo hoje?`,
        timestamp: Date.now(),
        isAutoReply: true,
      };

      setMessages([welcomeMessage]);
      saveConversation([welcomeMessage]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Adicionar mensagem do visitante
    const visitorMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "visitor",
      message: inputValue,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, visitorMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    // Simular delay de resposta da IA
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: `msg_${Date.now()}_ai`,
        sender: "ai",
        message: getAIResponse(inputValue),
        timestamp: Date.now(),
        isAutoReply: true,
      };

      const messagesWithAI = [...newMessages, aiResponse];
      setMessages(messagesWithAI);
      saveConversation(messagesWithAI);
      setIsLoading(false);
    }, 800);

    saveConversation(newMessages);
  };

  return (
    <>
      {/* Widget Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
          title="Abrir chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-96 max-h-[600px] flex flex-col shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div>
              <h3 className="font-semibold">FitPrime Support</h3>
              <p className="text-xs opacity-90">Responder em tempo real</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-white/20 p-1 rounded transition"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-white/20 p-1 rounded transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {showForm ? (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                        <MessageCircle className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        Olá! 👋
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Deixe seus dados para começarmos a conversa
                      </p>
                    </div>

                    <form onSubmit={handleStartChat} className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          Nome *
                        </label>
                        <Input
                          type="text"
                          placeholder="Seu nome"
                          value={visitorInfo.name}
                          onChange={(e) =>
                            setVisitorInfo({
                              ...visitorInfo,
                              name: e.target.value,
                            })
                          }
                          required
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          Email *
                        </label>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          value={visitorInfo.email}
                          onChange={(e) =>
                            setVisitorInfo({
                              ...visitorInfo,
                              email: e.target.value,
                            })
                          }
                          required
                          className="text-sm"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">
                          WhatsApp (opcional)
                        </label>
                        <Input
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={visitorInfo.phone}
                          onChange={(e) =>
                            setVisitorInfo({
                              ...visitorInfo,
                              phone: e.target.value,
                            })
                          }
                          className="text-sm"
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                      >
                        Começar Chat
                      </Button>
                    </form>
                  </div>
                ) : (
                  <>
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <p className="text-sm">Nenhuma mensagem ainda</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender === "visitor"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                              msg.sender === "visitor"
                                ? "bg-emerald-600 text-white rounded-br-none"
                                : "bg-white border border-gray-200 text-gray-900 rounded-bl-none"
                            }`}
                          >
                            <p className="break-words">{msg.message}</p>
                            {msg.isAutoReply && msg.sender === "ai" && (
                              <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                                <Loader2 className="h-3 w-3" />
                                Resposta automática
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              {!showForm && (
                <form
                  onSubmit={handleSendMessage}
                  className="border-t border-gray-200 p-4 bg-white rounded-b-lg flex gap-2"
                >
                  <Input
                    type="text"
                    placeholder="Digite sua mensagem..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={isLoading}
                    className="text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                    size="sm"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              )}
            </>
          )}
        </Card>
      )}
    </>
  );
}
