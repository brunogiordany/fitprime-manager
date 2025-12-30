import { useState, useEffect, useRef, useCallback } from "react";
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
  Mic,
  MicOff,
  Image,
  FileText,
  Video,
  Paperclip,
  X,
  Play,
  Pause,
  Download,
  CheckCheck,
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
  
  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Estados para upload de mídia
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para player de áudio
  const [playingAudioId, setPlayingAudioId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { data: messages, refetch: refetchMessages } = trpc.studentPortal.chatMessages.useQuery(
    { limit: 100 },
    { refetchInterval: 5000 } // Atualizar a cada 5 segundos
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
  
  // Funções de gravação de áudio
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
    }
  }, []);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [isRecording]);
  
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioBlob(null);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [isRecording]);
  
  const handleSendAudio = async () => {
    if (!audioBlob) return;
    
    // Por enquanto, enviar como mensagem de texto indicando áudio
    // TODO: Implementar upload para S3 e envio real de áudio
    toast.info('Áudio gravado! Upload será implementado em breve.');
    setAudioBlob(null);
  };
  
  // Funções de upload de mídia
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tamanho (16MB máximo)
    if (file.size > 16 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 16MB.');
      return;
    }
    
    setUploadingMedia(true);
    try {
      // TODO: Implementar upload para S3
      toast.info(`${type === 'image' ? 'Foto' : type === 'video' ? 'Vídeo' : 'Arquivo'} selecionado! Upload será implementado em breve.`);
    } catch (error) {
      toast.error('Erro ao enviar arquivo');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };
  
  // Player de áudio
  const toggleAudioPlay = (msgId: number, audioUrl: string) => {
    if (playingAudioId === msgId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingAudioId(null);
      setPlayingAudioId(msgId);
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
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  const renderMessageContent = (msg: Message) => {
    // Mensagem deletada
    if (msg.deletedForAll) {
      return (
        <p className="text-sm italic opacity-60">
          Esta mensagem foi apagada
        </p>
      );
    }
    
    // Mensagem de áudio
    if (msg.messageType === 'audio' && msg.mediaUrl) {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => toggleAudioPlay(msg.id, msg.mediaUrl!)}
            >
              {playingAudioId === msg.id ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            <div className="flex-1 h-1 bg-current opacity-30 rounded-full">
              <div className="h-full w-0 bg-current rounded-full" />
            </div>
            {msg.mediaDuration && (
              <span className="text-xs opacity-75">
                {Math.floor(msg.mediaDuration / 60)}:{String(msg.mediaDuration % 60).padStart(2, '0')}
              </span>
            )}
          </div>
          {msg.audioTranscription && (
            <p className="text-xs opacity-75 italic">
              "{msg.audioTranscription}"
            </p>
          )}
        </div>
      );
    }
    
    // Mensagem de imagem
    if (msg.messageType === 'image' && msg.mediaUrl) {
      return (
        <div className="space-y-2">
          <img 
            src={msg.mediaUrl} 
            alt={msg.mediaName || 'Imagem'} 
            className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(msg.mediaUrl!, '_blank')}
          />
          {msg.message && <p className="text-sm">{msg.message}</p>}
        </div>
      );
    }
    
    // Mensagem de vídeo
    if (msg.messageType === 'video' && msg.mediaUrl) {
      return (
        <div className="space-y-2">
          <video 
            src={msg.mediaUrl} 
            controls 
            className="max-w-full rounded-lg"
          />
          {msg.message && <p className="text-sm">{msg.message}</p>}
        </div>
      );
    }
    
    // Mensagem de arquivo
    if (msg.messageType === 'file' && msg.mediaUrl) {
      return (
        <div className="flex items-center gap-3 p-2 bg-black/10 rounded-lg">
          <FileText className="h-8 w-8 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{msg.mediaName || 'Arquivo'}</p>
            {msg.mediaSize && (
              <p className="text-xs opacity-75">{formatFileSize(msg.mediaSize)}</p>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={() => window.open(msg.mediaUrl!, '_blank')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      );
    }
    
    // Mensagem de link com preview
    if (msg.messageType === 'link' && msg.linkPreviewUrl) {
      return (
        <div className="space-y-2">
          {msg.message && <p className="text-sm whitespace-pre-wrap">{msg.message}</p>}
          <a 
            href={msg.linkPreviewUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block p-2 bg-black/10 rounded-lg hover:bg-black/20 transition-colors"
          >
            {msg.linkPreviewImage && (
              <img src={msg.linkPreviewImage} alt="" className="w-full h-32 object-cover rounded mb-2" />
            )}
            {msg.linkPreviewTitle && (
              <p className="text-sm font-medium">{msg.linkPreviewTitle}</p>
            )}
            {msg.linkPreviewDescription && (
              <p className="text-xs opacity-75 line-clamp-2">{msg.linkPreviewDescription}</p>
            )}
          </a>
        </div>
      );
    }
    
    // Mensagem de texto normal
    return (
      <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
    );
  };
  
  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-500" />
          Chat com seu Personal
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
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
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      msg.senderType === "student"
                        ? "bg-emerald-500 text-white rounded-br-md"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
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
                    {renderMessageContent(msg)}
                    <div className={`flex items-center gap-1 mt-1 ${msg.senderType === "student" ? "text-emerald-100" : "text-gray-500"}`}>
                      <span className="text-xs">{formatMessageDate(msg.createdAt)}</span>
                      {msg.senderType === "student" && msg.isRead && (
                        <CheckCheck className="h-3 w-3" />
                      )}
                      {msg.isEdited && (
                        <span className="text-xs italic opacity-75">editada</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t">
          {/* Input de arquivos ocultos */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'image')}
          />
          <input
            type="file"
            ref={videoInputRef}
            accept="video/*"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'video')}
          />
          <input
            type="file"
            ref={fileInputRef}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
            className="hidden"
            onChange={(e) => handleFileSelect(e, 'file')}
          />
          
          {/* Preview de áudio gravado */}
          {audioBlob && (
            <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center gap-3">
              <audio src={URL.createObjectURL(audioBlob)} controls className="flex-1 h-10" />
              <Button variant="ghost" size="icon" onClick={() => setAudioBlob(null)}>
                <X className="h-4 w-4" />
              </Button>
              <Button size="icon" onClick={handleSendAudio} disabled={sendMessage.isPending}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {/* Barra de gravação */}
          {isRecording && (
            <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-red-600 dark:text-red-400 font-medium">
                Gravando... {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
              </span>
              <div className="flex-1" />
              <Button variant="ghost" size="icon" onClick={cancelRecording}>
                <X className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={stopRecording}>
                <MicOff className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2 items-center">
            {/* Menu de anexos */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                disabled={isRecording || uploadingMedia}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              {showAttachMenu && (
                <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-900 rounded-lg shadow-lg border p-2 flex flex-col gap-1 min-w-[140px] z-50">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => { imageInputRef.current?.click(); setShowAttachMenu(false); }}
                  >
                    <Image className="h-4 w-4 text-blue-500" />
                    Foto
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => { videoInputRef.current?.click(); setShowAttachMenu(false); }}
                  >
                    <Video className="h-4 w-4 text-purple-500" />
                    Vídeo
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2"
                    onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}
                  >
                    <FileText className="h-4 w-4 text-orange-500" />
                    Arquivo
                  </Button>
                </div>
              )}
            </div>
            
            {/* Campo de texto */}
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              disabled={sendMessage.isPending || isRecording || uploadingMedia}
              className="flex-1"
            />
            
            {/* Botão de gravação de áudio ou enviar */}
            {newMessage.trim() ? (
              <Button
                onClick={handleSend}
                disabled={sendMessage.isPending}
                size="icon"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <Button
                variant={isRecording ? "destructive" : "ghost"}
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={uploadingMedia}
              >
                {isRecording ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
