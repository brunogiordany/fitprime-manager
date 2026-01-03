import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Minimize2,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

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

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visitorId, setVisitorId] = useState<string>("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [visitorInfo, setVisitorInfo] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [showForm, setShowForm] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // tRPC mutations
  const createConversation = trpc.supportChat.getOrCreateConversation.useMutation();
  const sendMessage = trpc.supportChat.sendMessage.useMutation();

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
      const conversation = JSON.parse(savedConversation) as ChatConversation & { conversationId?: number };
      setMessages(conversation.messages);
      setVisitorInfo({
        name: conversation.visitorName || "",
        email: conversation.visitorEmail || "",
        phone: conversation.visitorPhone || "",
      });
      if (conversation.conversationId) {
        setConversationId(conversation.conversationId);
      }
      setShowForm(false);
    }
  }, []);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveConversation = (msgs: ChatMessage[], convId?: number) => {
    const conversation = {
      visitorId,
      visitorName: visitorInfo.name,
      visitorEmail: visitorInfo.email,
      visitorPhone: visitorInfo.phone,
      messages: msgs,
      status: "active" as const,
      createdAt: Date.now(),
      conversationId: convId || conversationId,
    };
    localStorage.setItem(`chat_${visitorId}`, JSON.stringify(conversation));
  };

  const handleStartChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (visitorInfo.name && visitorInfo.email) {
      setShowForm(false);
      setIsLoading(true);

      try {
        // Criar conversa no backend
        const result = await createConversation.mutateAsync({
          visitorId,
          visitorName: visitorInfo.name,
          visitorEmail: visitorInfo.email,
          visitorPhone: visitorInfo.phone || undefined,
        });

        if (result?.id) {
          setConversationId(result.id);
        }

        // Mensagem de boas-vindas
        const welcomeMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          sender: "ai",
          message: `Olá ${visitorInfo.name}! 👋 Sou a assistente virtual do FitPrime. Posso te ajudar a encontrar o plano ideal para o seu negócio de personal trainer. Quantos alunos você atende hoje?`,
          timestamp: Date.now(),
          isAutoReply: true,
        };

        setMessages([welcomeMessage]);
        saveConversation([welcomeMessage], result?.id);
      } catch (error) {
        console.error("Erro ao criar conversa:", error);
        // Fallback para mensagem local
        const welcomeMessage: ChatMessage = {
          id: `msg_${Date.now()}`,
          sender: "ai",
          message: `Olá ${visitorInfo.name}! 👋 Bem-vindo ao FitPrime! Como posso ajudá-lo hoje?`,
          timestamp: Date.now(),
          isAutoReply: true,
        };
        setMessages([welcomeMessage]);
        saveConversation([welcomeMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Adicionar mensagem do visitante
    const visitorMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: "visitor",
      message: userMessage,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, visitorMessage];
    setMessages(newMessages);
    saveConversation(newMessages);
    setIsLoading(true);

    try {
      if (conversationId) {
        // Enviar para o backend com IA real
        const result = await sendMessage.mutateAsync({
          conversationId,
          visitorId,
          message: userMessage,
        });

        const aiResponse: ChatMessage = {
          id: `msg_${Date.now()}_ai`,
          sender: "ai",
          message: result.aiResponse,
          timestamp: Date.now(),
          isAutoReply: true,
        };

        const messagesWithAI = [...newMessages, aiResponse];
        setMessages(messagesWithAI);
        saveConversation(messagesWithAI);
      } else {
        // Fallback se não tiver conversationId
        const aiResponse: ChatMessage = {
          id: `msg_${Date.now()}_ai`,
          sender: "ai",
          message: "Desculpe, houve um problema na conexão. Por favor, recarregue a página e tente novamente.",
          timestamp: Date.now(),
          isAutoReply: true,
        };
        const messagesWithAI = [...newMessages, aiResponse];
        setMessages(messagesWithAI);
        saveConversation(messagesWithAI);
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}_error`,
        sender: "ai",
        message: "Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns segundos! 🙏",
        timestamp: Date.now(),
        isAutoReply: true,
      };
      const messagesWithError = [...newMessages, errorMessage];
      setMessages(messagesWithError);
      saveConversation(messagesWithError);
    } finally {
      setIsLoading(false);
    }
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
        <Card className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] max-h-[600px] flex flex-col shadow-2xl border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold">FitPrime IA</h3>
                <p className="text-xs opacity-90">Assistente inteligente</p>
              </div>
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
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 min-h-[300px] max-h-[400px]">
                {showForm ? (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                        <Sparkles className="h-6 w-6 text-emerald-600" />
                      </div>
                      <h4 className="font-semibold text-gray-900">
                        Olá! 👋
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Sou a IA do FitPrime. Me conta um pouco sobre você!
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
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : null}
                        Iniciar Conversa
                      </Button>
                    </form>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender === "visitor"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.sender === "visitor"
                              ? "bg-emerald-600 text-white"
                              : "bg-white border border-gray-200 text-gray-800"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          {msg.isAutoReply && msg.sender === "ai" && (
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                              <Sparkles className="h-3 w-3" />
                              <span>IA</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                            <span className="text-sm text-gray-500">
                              Pensando...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input Area */}
              {!showForm && (
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 border-t bg-white rounded-b-lg"
                >
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Digite sua mensagem..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!inputValue.trim() || isLoading}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              )}
            </>
          )}
        </Card>
      )}
    </>
  );
}
