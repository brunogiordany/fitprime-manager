import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  MessageCircle,
  Send,
  Loader2,
  User,
  Dumbbell,
} from "lucide-react";

interface Message {
  id: number;
  senderType: "personal" | "student";
  messageType?: "text" | "audio" | "image" | "video" | "file" | "link";
  message: string | null;
  mediaUrl?: string | null;
  mediaName?: string | null;
  mediaMimeType?: string | null;
  mediaSize?: number | null;
  mediaDuration?: number | null;
  audioTranscription?: string | null;
  linkPreviewTitle?: string | null;
  linkPreviewDescription?: string | null;
  linkPreviewImage?: string | null;
  linkPreviewUrl?: string | null;
  isEdited?: boolean | null;
  editedAt?: Date | string | null;
  originalMessage?: string | null;
  deletedForSender?: boolean | null;
  deletedForAll?: boolean | null;
  deletedAt?: Date | string | null;
  createdAt: Date | string;
  isRead: boolean | null;
}

export default function StudentChat() {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { data: messages, refetch: refetchMessages } = trpc.studentPortal.chatMessages.useQuery(
    { limit: 100 },
    { refetchInterval: 10000 } // Atualizar a cada 10 segundos
  );
  
  const sendMessage = trpc.studentPortal.sendChatMessage.useMutation({
    onSuccess: () => {
      setNewMessage("");
      refetchMessages();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar mensagem");
    },
  });
  
  // Scroll para o final quando novas mensagens chegarem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage.mutate({ message: newMessage.trim() });
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const formatMessageDate = (date: Date | string) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (d.toDateString() === today.toDateString()) {
      return format(d, "HH:mm", { locale: ptBR });
    } else if (d.toDateString() === yesterday.toDateString()) {
      return `Ontem ${format(d, "HH:mm", { locale: ptBR })}`;
    } else {
      return format(d, "dd/MM HH:mm", { locale: ptBR });
    }
  };
  
  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-500" />
          Chat com seu Personal
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-3 py-4">
            {!messages || messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhuma mensagem ainda</p>
                <p className="text-sm">Envie uma mensagem para seu personal!</p>
              </div>
            ) : (
              messages.map((msg: Message) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === "student" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.senderType === "student"
                        ? "bg-emerald-500 text-white rounded-br-md"
                        : "bg-gray-100 text-gray-900 rounded-bl-md"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.senderType === "personal" ? (
                        <Dumbbell className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      <span className="text-xs opacity-75">
                        {msg.senderType === "personal" ? "Personal" : "Você"}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-xs mt-1 ${msg.senderType === "student" ? "text-emerald-100" : "text-gray-500"}`}>
                      {formatMessageDate(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={sendMessage.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || sendMessage.isPending}
              size="icon"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
