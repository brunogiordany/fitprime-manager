import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  MessageSquare, 
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  MessageCircle,
  User,
  Dumbbell,
  ArrowLeft,
  Loader2,
  Mic,
  MicOff,
  Image,
  FileText,
  Video,
  Link2,
  Paperclip,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Play,
  Pause,
  Download,
  Users,
  CheckCheck
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ChatMessage {
  id: number;
  senderType: "personal" | "student";
  messageType: "text" | "audio" | "image" | "video" | "file" | "link";
  message: string | null;
  // Mídia
  mediaUrl?: string | null;
  mediaName?: string | null;
  mediaMimeType?: string | null;
  mediaSize?: number | null;
  mediaDuration?: number | null;
  // Transcrição de áudio
  audioTranscription?: string | null;
  // Preview de links
  linkPreviewTitle?: string | null;
  linkPreviewDescription?: string | null;
  linkPreviewImage?: string | null;
  linkPreviewUrl?: string | null;
  // Edição
  isEdited?: boolean | null;
  editedAt?: Date | string | null;
  originalMessage?: string | null;
  // Exclusão
  deletedForSender?: boolean | null;
  deletedForAll?: boolean | null;
  deletedAt?: Date | string | null;
  // Leitura
  createdAt: Date | string;
  isRead: boolean | null;
}

interface StudentWithUnread {
  studentId: number;
  studentName: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: Date | string;
}

interface StudentFromAPI {
  id: number;
  name: string;
  unreadCount?: number;
}

export default function Messages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedStudent, setSelectedStudent] = useState<StudentWithUnread | null>(null);
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
  
  // Estados para edição e exclusão
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [editText, setEditText] = useState("");
  const [messageMenuId, setMessageMenuId] = useState<number | null>(null);
  
  // Estados para mensagem em massa
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [selectedStudentsForBroadcast, setSelectedStudentsForBroadcast] = useState<number[]>([]);
  const [selectAllForBroadcast, setSelectAllForBroadcast] = useState(false);

  // WhatsApp messages
  const { data: whatsappMessages, isLoading: isLoadingWhatsapp, refetch: refetchWhatsapp } = trpc.messages.log.useQuery({
    limit: 100,
  });

  // Chat - lista de alunos com mensagens não lidas
  const { data: studentsWithUnread, refetch: refetchStudents } = trpc.chat.studentsWithUnread.useQuery(
    undefined,
    { refetchInterval: 10000 }
  );

  // Chat - total de mensagens não lidas
  const { data: totalUnread } = trpc.chat.totalUnread.useQuery(
    undefined,
    { refetchInterval: 10000 }
  );

  // Lista de todos os alunos para mostrar conversas
  const { data: allStudents } = trpc.students.list.useQuery({});

  // Chat messages do aluno selecionado
  const { data: chatMessages, refetch: refetchChat } = trpc.chat.messages.useQuery(
    { studentId: selectedStudent?.studentId || 0, limit: 100 },
    { 
      enabled: !!selectedStudent,
      refetchInterval: 5000
    }
  );

  // Mutation para enviar mensagem
  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      refetchChat();
      refetchStudents();
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
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedStudent) return;
    sendMessage.mutate({ 
      studentId: selectedStudent.studentId, 
      message: newMessage.trim() 
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
      toast.error('Não foi possível acessar o microfone');
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
    if (!audioBlob || !selectedStudent) return;
    // Por enquanto, enviar como mensagem de texto indicando áudio
    // TODO: Implementar upload para S3 e envio real de áudio
    toast.info('Áudio gravado! Upload será implementado em breve.');
    setAudioBlob(null);
  };
  
  // Funções de upload de mídia
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudent) return;
    
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

  // Combinar alunos com mensagens não lidas com todos os alunos
  const conversationsList: StudentWithUnread[] = (allStudents?.map((student: any) => {
    // studentsWithUnread retorna o student completo com unreadCount
    const unreadInfo = studentsWithUnread?.find((s: any) => s.id === student.id);
    return {
      studentId: student.id,
      studentName: student.name,
      unreadCount: unreadInfo?.unreadCount || 0,
    };
  }) || []).sort((a, b) => {
    // Ordenar por mensagens não lidas primeiro
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    return a.studentName.localeCompare(b.studentName);
  });

  // WhatsApp filters
  const filteredWhatsappMessages = whatsappMessages?.filter((msg: any) => {
    if (!searchTerm) return true;
    return msg.phone?.includes(searchTerm) || msg.message?.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const displayWhatsappMessages = statusFilter === 'all' 
    ? filteredWhatsappMessages 
    : filteredWhatsappMessages.filter((m: any) => m.status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3 mr-1" />Enviada</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Estatísticas WhatsApp
  const whatsappStats = {
    total: whatsappMessages?.length || 0,
    sent: whatsappMessages?.filter((m: any) => m.status === 'sent').length || 0,
    pending: whatsappMessages?.filter((m: any) => m.status === 'pending').length || 0,
    failed: whatsappMessages?.filter((m: any) => m.status === 'failed').length || 0,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mensagens</h1>
            <p className="text-muted-foreground">
              Gerencie suas conversas e mensagens automáticas
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="chat" className="relative">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat FitPrime
              {totalUnread && totalUnread > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                  {totalUnread}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="whatsapp">
              <MessageSquare className="h-4 w-4 mr-2" />
              WhatsApp
            </TabsTrigger>
          </TabsList>

          {/* Chat FitPrime Tab */}
          <TabsContent value="chat" className="mt-6">
            <div className="grid md:grid-cols-3 gap-6 h-[600px]">
              {/* Lista de Conversas */}
              <Card className="md:col-span-1 flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Conversas</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar aluno..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  <ScrollArea className="h-full">
                    <div className="space-y-1 p-2">
                      {conversationsList
                        .filter((conv: any) => 
                          conv.studentName.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((conv: any) => (
                          <button
                            key={conv.studentId}
                            onClick={() => setSelectedStudent(conv)}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                              selectedStudent?.studentId === conv.studentId
                                ? "bg-emerald-100 dark:bg-emerald-900/30"
                                : "hover:bg-accent"
                            }`}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                                {conv.studentName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-medium truncate">{conv.studentName}</p>
                                {conv.unreadCount > 0 && (
                                  <Badge className="bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                                    {conv.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      {conversationsList.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>Nenhum aluno encontrado</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Área de Chat */}
              <Card className="md:col-span-2 flex flex-col">
                {selectedStudent ? (
                  <>
                    <CardHeader className="pb-3 border-b">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="md:hidden"
                          onClick={() => setSelectedStudent(null)}
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                            {selectedStudent.studentName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{selectedStudent.studentName}</CardTitle>
                          <CardDescription>Chat interno</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
                        <div className="space-y-3 py-4">
                          {!chatMessages || chatMessages.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p>Nenhuma mensagem ainda</p>
                              <p className="text-sm">Envie uma mensagem para iniciar a conversa!</p>
                            </div>
                          ) : (
                            chatMessages.map((msg: ChatMessage) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.senderType === "personal" ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                    msg.senderType === "personal"
                                      ? "bg-emerald-500 text-white rounded-br-md"
                                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md"
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {msg.senderType === "student" ? (
                                      <User className="h-3 w-3" />
                                    ) : (
                                      <Dumbbell className="h-3 w-3" />
                                    )}
                                    <span className="text-xs opacity-75">
                                      {msg.senderType === "student" ? selectedStudent.studentName : "Você"}
                                    </span>
                                  </div>
                                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                  <p className={`text-xs mt-1 ${msg.senderType === "personal" ? "text-emerald-100" : "text-gray-500"}`}>
                                    {formatMessageDate(msg.createdAt)}
                                  </p>
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
                              onClick={handleSendMessage}
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
                  </>
                ) : (
                  <CardContent className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Selecione uma conversa</p>
                      <p className="text-sm">Escolha um aluno para ver as mensagens</p>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="mt-6 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{whatsappStats.total}</p>
                    </div>
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Enviadas</p>
                      <p className="text-2xl font-bold text-emerald-600">{whatsappStats.sent}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-600">{whatsappStats.pending}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-500/50" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Falharam</p>
                      <p className="text-2xl font-bold text-red-600">{whatsappStats.failed}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500/50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por aluno ou telefone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="sent">Enviadas</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="failed">Falharam</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => refetchWhatsapp()} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Messages List */}
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Mensagens WhatsApp</CardTitle>
                <CardDescription>
                  {displayWhatsappMessages.length} mensagens encontradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingWhatsapp ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : displayWhatsappMessages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-lg font-medium">Nenhuma mensagem encontrada</p>
                    <p className="text-muted-foreground">
                      As mensagens enviadas aparecerão aqui
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayWhatsappMessages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shrink-0">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{msg.phone || 'Sem telefone'}</p>
                            {getStatusBadge(msg.status)}
                          </div>
                          <p className="text-sm line-clamp-2">{msg.message}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {msg.scheduledAt 
                              ? format(new Date(msg.scheduledAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : '-'}
                          </p>
                          {msg.sentAt && (
                            <p className="text-xs text-emerald-600">
                              Enviada: {format(new Date(msg.sentAt), "HH:mm", { locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
