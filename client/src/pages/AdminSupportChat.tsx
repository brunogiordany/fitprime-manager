import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  BarChart3,
  Loader2,
  Search,
} from "lucide-react";

interface ConversationWithMessages {
  id: number;
  visitorId: string;
  visitorName: string | null | undefined;
  visitorEmail: string | null | undefined;
  visitorPhone: string | null | undefined;
  status: "active" | "closed" | "waiting";
  lastMessageAt: Date;
  createdAt: Date;
  notes?: string | null;
  assignedToPersonalId?: number | null;
  resolvedAt?: Date | null;
  updatedAt: Date;
  source?: string;
}

interface Message {
  id: number;
  conversationId: number;
  sender: "visitor" | "ai" | "personal";
  senderName?: string;
  message: string;
  isAutoReply: boolean;
  readAt?: Date;
  createdAt: Date;
}

export default function AdminSupportChat() {
  const [selectedConversation, setSelectedConversation] =
    useState<ConversationWithMessages | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const { data: conversations, isLoading: isLoadingConversations } =
    trpc.supportChat.getAllConversations.useQuery({ limit: 100 });

  const { data: unreadConversations } =
    trpc.supportChat.getUnreadConversations.useQuery();

  const { data: stats } = trpc.supportChat.getStats.useQuery();

  // Mutations
  const respondMutation = trpc.supportChat.respondAsPersonal.useMutation({
    onSuccess: () => {
      setReplyText("");
      // Recarregar mensagens
      if (selectedConversation) {
        loadMessages(selectedConversation.id);
      }
    },
  });

  const resolveMutation = trpc.supportChat.resolveConversation.useMutation({
    onSuccess: () => {
      setSelectedConversation(null);
      setMessages([]);
    },
  });

  const addNoteMutation = trpc.supportChat.addNote.useMutation();

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async (conversationId: number) => {
    setIsLoadingMessages(true);
    try {
      // Simular carregamento de mensagens
      // Em produção, isso viria de uma query tRPC
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSelectConversation = (conversation: ConversationWithMessages) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedConversation) return;

    try {
      await respondMutation.mutateAsync({
        conversationId: selectedConversation.id,
        message: replyText,
      });
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
    }
  };

  const handleResolve = async () => {
    if (!selectedConversation) return;

    try {
      await resolveMutation.mutateAsync({
        conversationId: selectedConversation.id,
      });
    } catch (error) {
      console.error("Erro ao resolver conversa:", error);
    }
  };

  const filteredConversations =
    conversations?.filter(
      (c) =>
        c.visitorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.visitorEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.visitorPhone?.includes(searchTerm)
    ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <MessageCircle className="w-3 h-3" />
            Ativo
          </span>
        );
      case "waiting":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" />
            Aguardando
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            Resolvido
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Lista de Conversas */}
      <div className="w-80 border-r border-border flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
            Suporte ao Cliente
          </h2>

          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-background p-2 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {stats.activeConversations}
                </div>
                <div className="text-xs text-muted-foreground">Ativas</div>
              </div>
              <div className="bg-background p-2 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.unreadMessages}
                </div>
                <div className="text-xs text-muted-foreground">Não lidas</div>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>

        {/* Lista de Conversas */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConversations ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <MessageCircle className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedConversation?.id === conversation.id
                      ? "bg-emerald-100 border border-emerald-300"
                      : "hover:bg-background border border-transparent"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium text-sm truncate">
                      {conversation.visitorName || "Visitante"}
                    </div>
                    {getStatusBadge(conversation.status)}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {conversation.visitorEmail}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {new Date(conversation.lastMessageAt).toLocaleString(
                      "pt-BR"
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="border-b border-border p-4 flex items-center justify-between bg-card">
              <div>
                <h3 className="font-semibold">
                  {selectedConversation.visitorName || "Visitante"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedConversation.visitorEmail}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(selectedConversation.status)}
                {selectedConversation.status !== "closed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleResolve}
                    disabled={resolveMutation.isPending}
                  >
                    {resolveMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Resolver
                  </Button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                  <p>Nenhuma mensagem nesta conversa</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "personal" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.sender === "personal"
                          ? "bg-emerald-600 text-white"
                          : message.sender === "ai"
                          ? "bg-blue-100 text-foreground border border-blue-300"
                          : "bg-gray-100 text-foreground"
                      }`}
                    >
                      {message.sender === "ai" && message.isAutoReply && (
                        <div className="text-xs opacity-70 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Resposta automática
                        </div>
                      )}
                      <p className="text-sm">{message.message}</p>
                      <div
                        className={`text-xs mt-1 ${
                          message.sender === "personal"
                            ? "text-emerald-100"
                            : "text-muted-foreground"
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleTimeString(
                          "pt-BR"
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            {selectedConversation.status !== "closed" && (
              <div className="border-t border-border p-4 bg-card">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite sua resposta..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    disabled={respondMutation.isPending}
                  />
                  <Button
                    onClick={handleSendReply}
                    disabled={
                      !replyText.trim() || respondMutation.isPending
                    }
                  >
                    {respondMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Selecione uma conversa</p>
            <p className="text-sm">para começar a responder</p>
          </div>
        )}
      </div>
    </div>
  );
}
