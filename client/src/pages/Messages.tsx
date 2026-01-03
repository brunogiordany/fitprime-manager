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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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
  Paperclip,
  X,
  Download,
  Users,
  CheckCheck,
  Check,
  Phone,
  MoreVertical,
  Smile,
  Pause,
  Play,
  Square
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { format, isToday, isYesterday, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ChatMessage {
  id: number;
  senderType: "personal" | "student";
  messageType: "text" | "audio" | "image" | "video" | "file" | "link";
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

interface StudentWithUnread {
  studentId: number;
  studentName: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: Date | string;
}

export default function Messages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("chat");
  const [selectedStudent, setSelectedStudent] = useState<StudentWithUnread | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Estados para gravação de áudio
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Estados para upload de mídia
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para mensagem em massa
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [selectedStudentsForBroadcast, setSelectedStudentsForBroadcast] = useState<number[]>([]);
  const [selectAllForBroadcast, setSelectAllForBroadcast] = useState(false);
  
  // Estados para WhatsApp chat separado
  const [selectedWhatsAppStudent, setSelectedWhatsAppStudent] = useState<StudentWithUnread | null>(null);
  const [newWhatsAppMessage, setNewWhatsAppMessage] = useState("");
  const whatsappMessagesEndRef = useRef<HTMLDivElement>(null);

  // WhatsApp messages log (histórico de envios)
  const { data: whatsappMessagesLog, isLoading: isLoadingWhatsapp, refetch: refetchWhatsapp } = trpc.messages.log.useQuery({
    limit: 100,
  });
  
  // WhatsApp chat messages do aluno selecionado (apenas mensagens do WhatsApp)
  const { data: whatsappChatMessages, refetch: refetchWhatsAppChat, isLoading: isLoadingWhatsAppChat } = trpc.chat.messages.useQuery(
    { studentId: selectedWhatsAppStudent?.studentId || 0, limit: 100, source: 'whatsapp' },
    { 
      enabled: !!selectedWhatsAppStudent,
      refetchInterval: 5000
    }
  );

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

  // Chat messages do aluno selecionado (apenas mensagens internas do FitPrime)
  const { data: chatMessages, refetch: refetchChat, isLoading: isLoadingChat } = trpc.chat.messages.useQuery(
    { studentId: selectedStudent?.studentId || 0, limit: 100, source: 'internal' },
    { 
      enabled: !!selectedStudent,
      refetchInterval: 5000
    }
  );

  // Mutation para enviar mensagem
  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setNewMessage("");
      refetchChat();
      refetchStudents();
      // Mostrar feedback de WhatsApp
      if (data.whatsappSent) {
        toast.success("Mensagem enviada via WhatsApp!", { icon: "📤" });
      } else if (data.whatsappError) {
        toast.warning(`Mensagem salva, mas não enviada via WhatsApp: ${data.whatsappError}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar mensagem");
    },
  });

  // Mutation para upload de mídia
  const uploadMediaMutation = trpc.chat.uploadMedia.useMutation({
    onError: (error) => {
      toast.error(error.message || "Erro ao fazer upload");
    },
  });

  // Scroll para o final quando novas mensagens chegarem
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, scrollToBottom]);

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
      streamRef.current = stream;
      
      // Tentar usar codecs mais compatíveis
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType.split(';')[0] });
        setAudioBlob(audioBlob);
        // Liberar stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      mediaRecorder.onerror = (e) => {
        console.error('MediaRecorder error:', e);
        toast.error('Erro na gravação de áudio');
        cancelRecording();
      };
      
      mediaRecorder.start(1000); // Coletar dados a cada 1 segundo
      setIsRecording(true);
      setIsPaused(false);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error: any) {
      console.error('Erro ao acessar microfone:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Permissão de microfone negada. Verifique as configurações do navegador.');
      } else if (error.name === 'NotFoundError') {
        toast.error('Nenhum microfone encontrado.');
      } else {
        toast.error('Não foi possível acessar o microfone');
      }
    }
  }, []);
  
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [isRecording, isPaused]);
  
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  }, [isRecording]);
  
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    }
    // Liberar stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setAudioBlob(null);
    setRecordingTime(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  }, []);
  
  const handleSendAudio = async () => {
    if (!audioBlob || !selectedStudent) return;
    
    setUploadingMedia(true);
    try {
      // Converter blob para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(audioBlob);
      
      const base64 = await base64Promise;
      const mimeType = audioBlob.type || 'audio/webm';
      const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
      
      // Upload para S3
      const uploadResult = await uploadMediaMutation.mutateAsync({
        studentId: selectedStudent.studentId,
        fileBase64: base64,
        fileName: `audio-${Date.now()}.${extension}`,
        mimeType: mimeType,
        fileSize: audioBlob.size,
        duration: recordingTime,
      });
      
      // Enviar mensagem com URL do áudio
      await sendMessage.mutateAsync({
        studentId: selectedStudent.studentId,
        messageType: 'audio',
        mediaUrl: uploadResult.url,
        mediaName: uploadResult.fileName,
        mediaMimeType: uploadResult.mimeType,
        mediaSize: uploadResult.fileSize,
        mediaDuration: uploadResult.duration,
      });
      
      setAudioBlob(null);
      setRecordingTime(0);
      toast.success('Áudio enviado!');
    } catch (error: any) {
      console.error('Erro ao enviar áudio:', error);
      toast.error(error.message || 'Erro ao enviar áudio');
    } finally {
      setUploadingMedia(false);
    }
  };
  
  // Funções de upload de mídia
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = e.target.files?.[0];
    if (!file || !selectedStudent) return;
    
    if (file.size > 16 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 16MB.');
      return;
    }
    
    setUploadingMedia(true);
    try {
      // Converter para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      
      const base64 = await base64Promise;
      
      // Upload para S3
      const uploadResult = await uploadMediaMutation.mutateAsync({
        studentId: selectedStudent.studentId,
        fileBase64: base64,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
      });
      
      // Determinar tipo de mensagem
      const messageType = type === 'image' ? 'image' : type === 'video' ? 'video' : 'file';
      
      // Enviar mensagem com URL da mídia
      await sendMessage.mutateAsync({
        studentId: selectedStudent.studentId,
        messageType,
        mediaUrl: uploadResult.url,
        mediaName: uploadResult.fileName,
        mediaMimeType: uploadResult.mimeType,
        mediaSize: uploadResult.fileSize,
      });
      
      toast.success(`${type === 'image' ? 'Foto' : type === 'video' ? 'Vídeo' : 'Arquivo'} enviado!`);
    } catch (error: any) {
      console.error('Erro ao enviar arquivo:', error);
      toast.error(error.message || 'Erro ao enviar arquivo');
    } finally {
      setUploadingMedia(false);
      e.target.value = '';
    }
  };

  // Formatar data da mensagem
  const formatMessageTime = (date: Date | string) => {
    return format(new Date(date), "HH:mm", { locale: ptBR });
  };

  // Formatar data do separador
  const formatDateSeparator = (date: Date | string) => {
    const d = new Date(date);
    if (isToday(d)) return "Hoje";
    if (isYesterday(d)) return "Ontem";
    return format(d, "dd 'de' MMMM", { locale: ptBR });
  };

  // Agrupar mensagens por data
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentGroup: { date: string; messages: ChatMessage[] } | null = null;

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt);
      const dateKey = format(msgDate, "yyyy-MM-dd");

      if (!currentGroup || currentGroup.date !== dateKey) {
        currentGroup = { date: dateKey, messages: [] };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(msg);
    });

    return groups;
  };

  // Combinar alunos com mensagens não lidas com todos os alunos
  const conversationsList: StudentWithUnread[] = (allStudents?.map((student: any) => {
    const unreadInfo = studentsWithUnread?.find((s: any) => s.id === student.id);
    return {
      studentId: student.id,
      studentName: student.name,
      unreadCount: unreadInfo?.unreadCount || 0,
    };
  }) || []).sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    return a.studentName.localeCompare(b.studentName);
  });

  // Filtrar mensagens WhatsApp (histórico de envios)
  const displayWhatsappMessages = whatsappMessagesLog?.filter((msg: any) => {
    if (statusFilter !== "all" && msg.status !== statusFilter) return false;
    if (searchTerm && !msg.phone?.includes(searchTerm) && !msg.message?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  }) || [];

  // Estatísticas WhatsApp
  const whatsappStats = {
    total: whatsappMessagesLog?.length || 0,
    sent: whatsappMessagesLog?.filter((m: any) => m.status === "sent").length || 0,
    pending: whatsappMessagesLog?.filter((m: any) => m.status === "pending").length || 0,
    failed: whatsappMessagesLog?.filter((m: any) => m.status === "failed").length || 0,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return <Badge className="bg-emerald-500">Enviada</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500">Pendente</Badge>;
      case "failed":
        return <Badge className="bg-red-500">Falhou</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Agrupar mensagens
  const messageGroups = chatMessages ? groupMessagesByDate(chatMessages) : [];

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)] flex flex-col">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="flex-shrink-0 px-4 pt-4 pb-2">
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
          </div>

          {/* Chat FitPrime Tab - Estilo WhatsApp */}
          <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
            <div className="flex h-full bg-gray-100 dark:bg-gray-900">
              {/* Lista de Conversas - Sidebar */}
              <div className={`${selectedStudent ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 bg-white dark:bg-gray-950 border-r`}>
                {/* Header da lista */}
                <div className="flex-shrink-0 p-4 border-b bg-emerald-600 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold">Conversas</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBroadcastModal(true)}
                      className="text-white hover:bg-emerald-700"
                    >
                      <Users className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-200" />
                    <Input
                      placeholder="Buscar aluno..."
                      className="pl-10 bg-emerald-700 border-emerald-500 text-white placeholder:text-emerald-200 focus:bg-emerald-600"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Lista de conversas */}
                <div className="flex-1 overflow-y-auto">
                  {conversationsList
                    .filter((conv) => 
                      conv.studentName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((conv) => (
                      <button
                        key={conv.studentId}
                        onClick={() => setSelectedStudent(conv)}
                        className={`w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-gray-100 dark:border-gray-800 ${
                          selectedStudent?.studentId === conv.studentId
                            ? "bg-emerald-50 dark:bg-emerald-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-900"
                        }`}
                      >
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-lg">
                            {conv.studentName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">{conv.studentName}</p>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            Clique para conversar
                          </p>
                        </div>
                      </button>
                    ))}
                  {conversationsList.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <User className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">Nenhum aluno encontrado</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Área de Chat */}
              <div className={`${selectedStudent ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-[#e5ddd5] dark:bg-gray-800`}>
                {selectedStudent ? (
                  <>
                    {/* Header do chat */}
                    <div className="flex-shrink-0 flex items-center gap-3 p-3 bg-emerald-600 text-white shadow-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-white hover:bg-emerald-700"
                        onClick={() => setSelectedStudent(null)}
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-white/20 text-white">
                          {selectedStudent.studentName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{selectedStudent.studentName}</p>
                        <p className="text-xs text-emerald-100">Online</p>
                      </div>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-emerald-700">
                        <Phone className="h-5 w-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-emerald-700">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </div>

                    {/* Área de mensagens */}
                    <div 
                      ref={messagesContainerRef}
                      className="flex-1 overflow-y-auto p-4"
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      }}
                    >
                      {isLoadingChat ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                        </div>
                      ) : messageGroups.length === 0 ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center bg-white/80 dark:bg-gray-900/80 rounded-2xl p-8 shadow-lg">
                            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-emerald-500" />
                            <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Nenhuma mensagem ainda</p>
                            <p className="text-sm text-gray-500">Envie uma mensagem para iniciar a conversa!</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messageGroups.map((group) => (
                            <div key={group.date}>
                              {/* Separador de data */}
                              <div className="flex justify-center my-4">
                                <span className="bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 text-xs px-3 py-1 rounded-full shadow-sm">
                                  {formatDateSeparator(group.messages[0].createdAt)}
                                </span>
                              </div>
                              
                              {/* Mensagens do grupo */}
                              <div className="space-y-1">
                                {group.messages.map((msg, idx) => {
                                  const isPersonal = msg.senderType === "personal";
                                  const showTail = idx === group.messages.length - 1 || 
                                    group.messages[idx + 1]?.senderType !== msg.senderType;
                                  
                                  return (
                                    <div
                                      key={msg.id}
                                      className={`flex ${isPersonal ? "justify-end" : "justify-start"}`}
                                    >
                                      <div
                                        className={`relative max-w-[85%] md:max-w-[70%] px-3 py-2 shadow-sm ${
                                          isPersonal
                                            ? `bg-[#dcf8c6] dark:bg-emerald-700 ${showTail ? 'rounded-tl-lg rounded-tr-lg rounded-bl-lg' : 'rounded-lg'}`
                                            : `bg-white dark:bg-gray-700 ${showTail ? 'rounded-tl-lg rounded-tr-lg rounded-br-lg' : 'rounded-lg'}`
                                        }`}
                                      >
                                        {/* Conteúdo da mensagem */}
                                        {msg.messageType === 'audio' && msg.mediaUrl ? (
                                          <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                              <audio 
                                                src={msg.mediaUrl} 
                                                controls 
                                                className="h-10 max-w-[200px]"
                                              />
                                            </div>
                                            {msg.audioTranscription && (
                                              <p className="text-xs italic text-gray-600 dark:text-gray-400">
                                                "{msg.audioTranscription}"
                                              </p>
                                            )}
                                          </div>
                                        ) : msg.messageType === 'image' && msg.mediaUrl ? (
                                          <div className="space-y-1">
                                            <img 
                                              src={msg.mediaUrl} 
                                              alt={msg.mediaName || 'Imagem'} 
                                              className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                              onClick={() => window.open(msg.mediaUrl!, '_blank')}
                                            />
                                            {msg.message && <p className="text-sm">{msg.message}</p>}
                                          </div>
                                        ) : msg.messageType === 'video' && msg.mediaUrl ? (
                                          <div className="space-y-1">
                                            <video 
                                              src={msg.mediaUrl} 
                                              controls 
                                              className="max-w-full rounded-lg"
                                            />
                                            {msg.message && <p className="text-sm">{msg.message}</p>}
                                          </div>
                                        ) : msg.messageType === 'file' && msg.mediaUrl ? (
                                          <div className="flex items-center gap-2 p-2 bg-black/5 rounded-lg">
                                            <FileText className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">{msg.mediaName || 'Arquivo'}</p>
                                              {msg.mediaSize && (
                                                <p className="text-xs text-gray-500">
                                                  {(msg.mediaSize / 1024).toFixed(1)} KB
                                                </p>
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
                                        ) : (
                                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                        )}
                                        
                                        {/* Horário, origem e status */}
                                        <div className={`flex items-center justify-end gap-1 mt-1 ${isPersonal ? "text-emerald-700 dark:text-emerald-300" : "text-gray-500"}`}>
                                          {/* Indicador de WhatsApp */}
                                          {(msg as any).source === 'whatsapp' && (
                                            <span title="Via WhatsApp">
                                              <MessageSquare className="h-3 w-3 text-green-500" />
                                            </span>
                                          )}
                                          <span className="text-[10px]">{formatMessageTime(msg.createdAt)}</span>
                                          {isPersonal && (
                                            msg.isRead ? (
                                              <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                                            ) : (
                                              <Check className="h-3.5 w-3.5" />
                                            )
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>

                    {/* Input de mensagem */}
                    <div className="flex-shrink-0 p-3 bg-gray-100 dark:bg-gray-900">
                      {/* Barra de input */}
                      <div className="flex items-center gap-2">
                        {/* Campo de texto */}
                        <div className="flex-1 relative">
                          <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Digite uma mensagem"
                            disabled={sendMessage.isPending}
                            className="rounded-full pr-10 bg-white dark:bg-gray-800 border-0 shadow-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-gray-400 hover:text-gray-600"
                          >
                            <Smile className="h-5 w-5" />
                          </Button>
                        </div>
                        
                        {/* Botão de enviar */}
                        <Button
                          onClick={handleSendMessage}
                          disabled={sendMessage.isPending || !newMessage.trim()}
                          size="icon"
                          className="rounded-full bg-emerald-500 hover:bg-emerald-600 h-10 w-10 disabled:opacity-50"
                        >
                          {sendMessage.isPending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-64 h-64 mx-auto mb-6 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                        <MessageCircle className="h-32 w-32 text-emerald-500" />
                      </div>
                      <h2 className="text-2xl font-light text-gray-600 dark:text-gray-400 mb-2">FitPrime Chat</h2>
                      <p className="text-gray-500 dark:text-gray-500">
                        Selecione uma conversa para começar
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* WhatsApp Tab - Estilo Chat igual ao FitPrime */}
          <TabsContent value="whatsapp" className="flex-1 m-0 overflow-hidden">
            <div className="flex h-full bg-gray-100 dark:bg-gray-900">
              {/* Lista de Conversas WhatsApp - Sidebar */}
              <div className={`${selectedWhatsAppStudent ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 bg-white dark:bg-gray-950 border-r`}>
                {/* Header da lista */}
                <div className="flex-shrink-0 p-4 border-b bg-green-600 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      WhatsApp
                    </h2>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-200" />
                    <Input
                      placeholder="Buscar aluno..."
                      className="pl-10 bg-green-700 border-green-500 text-white placeholder:text-green-200 focus:bg-green-600"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Lista de conversas WhatsApp */}
                <div className="flex-1 overflow-y-auto">
                  {conversationsList
                    .filter((conv) => 
                      conv.studentName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((conv) => (
                      <button
                        key={conv.studentId}
                        onClick={() => setSelectedWhatsAppStudent(conv)}
                        className={`w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-gray-100 dark:border-gray-800 ${
                          selectedWhatsAppStudent?.studentId === conv.studentId
                            ? "bg-green-50 dark:bg-green-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-900"
                        }`}
                      >
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-lg">
                            {conv.studentName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold truncate">{conv.studentName}</p>
                          </div>
                          <p className="text-sm text-gray-500 truncate flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            Clique para ver conversa
                          </p>
                        </div>
                      </button>
                    ))}
                  {conversationsList.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Phone className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="font-medium">Nenhum aluno encontrado</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Área de Chat WhatsApp */}
              <div className={`${selectedWhatsAppStudent ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-[#e5ddd5] dark:bg-gray-800`}>
                {selectedWhatsAppStudent ? (
                  <>
                    {/* Header do chat */}
                    <div className="flex-shrink-0 flex items-center gap-3 p-3 bg-green-600 text-white">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWhatsAppStudent(null)}
                        className="md:hidden text-white hover:bg-green-700"
                      >
                        <ArrowLeft className="h-5 w-5" />
                      </Button>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-green-700 text-white">
                          {selectedWhatsAppStudent.studentName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{selectedWhatsAppStudent.studentName}</p>
                        <p className="text-xs text-green-200 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          WhatsApp
                        </p>
                      </div>
                    </div>

                    {/* Mensagens WhatsApp */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                      {isLoadingWhatsAppChat ? (
                        <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
                        </div>
                      ) : whatsappChatMessages && whatsappChatMessages.length > 0 ? (
                        <>
                          {whatsappChatMessages.map((msg: any, index: number) => {
                            const isPersonal = msg.senderType === 'personal';
                            const showDateSeparator = index === 0 || !isSameDay(
                              new Date(msg.createdAt),
                              new Date(whatsappChatMessages[index - 1]?.createdAt)
                            );
                            
                            return (
                              <div key={msg.id}>
                                {showDateSeparator && (
                                  <div className="flex justify-center my-4">
                                    <span className="bg-white/80 dark:bg-gray-700 px-3 py-1 rounded-full text-xs text-gray-500">
                                      {isToday(new Date(msg.createdAt))
                                        ? 'Hoje'
                                        : isYesterday(new Date(msg.createdAt))
                                        ? 'Ontem'
                                        : format(new Date(msg.createdAt), "dd 'de' MMMM", { locale: ptBR })}
                                    </span>
                                  </div>
                                )}
                                
                                <div className={`flex ${isPersonal ? 'justify-end' : 'justify-start'}`}>
                                  <div
                                    className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm ${
                                      isPersonal
                                        ? 'bg-green-100 dark:bg-green-900 text-gray-800 dark:text-gray-100 rounded-br-none'
                                        : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-none'
                                    }`}
                                  >
                                    {msg.message && (
                                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                    )}
                                    
                                    <div className={`flex items-center justify-end gap-1 mt-1 ${isPersonal ? "text-green-700 dark:text-green-300" : "text-gray-500"}`}>
                                      <span className="text-[10px]">
                                        {format(new Date(msg.createdAt), 'HH:mm')}
                                      </span>
                                      {isPersonal && (
                                        <CheckCheck className="h-3 w-3 text-green-500" />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          <div ref={whatsappMessagesEndRef} />
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                          <Phone className="h-16 w-16 mb-4 text-gray-300" />
                          <p className="font-medium">Nenhuma mensagem do WhatsApp</p>
                          <p className="text-sm">As mensagens do WhatsApp aparecerão aqui</p>
                        </div>
                      )}
                    </div>

                    {/* Aviso de somente leitura */}
                    <div className="flex-shrink-0 p-3 bg-yellow-50 dark:bg-yellow-900/20 border-t text-center">
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        📱 As mensagens do WhatsApp são gerenciadas pela IA automática
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <Phone className="h-24 w-24 mb-4 text-gray-300" />
                    <p className="text-xl font-medium">WhatsApp</p>
                    <p className="text-sm">Selecione um aluno para ver as mensagens</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Broadcast */}
      <Dialog open={showBroadcastModal} onOpenChange={setShowBroadcastModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-500" />
              Mensagem em Massa
            </DialogTitle>
            <DialogDescription>
              Envie uma mensagem para múltiplos alunos de uma vez
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Seleção de alunos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Selecionar alunos</label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (selectAllForBroadcast) {
                      setSelectedStudentsForBroadcast([]);
                      setSelectAllForBroadcast(false);
                    } else {
                      setSelectedStudentsForBroadcast(allStudents?.map((s: any) => s.id) || []);
                      setSelectAllForBroadcast(true);
                    }
                  }}
                >
                  {selectAllForBroadcast ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </div>
              <ScrollArea className="h-[200px] border rounded-lg p-2">
                <div className="space-y-2">
                  {allStudents?.map((student: any) => (
                    <div key={student.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudentsForBroadcast.includes(student.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudentsForBroadcast([...selectedStudentsForBroadcast, student.id]);
                          } else {
                            setSelectedStudentsForBroadcast(selectedStudentsForBroadcast.filter(id => id !== student.id));
                            setSelectAllForBroadcast(false);
                          }
                        }}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs">
                          {student.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <label htmlFor={`student-${student.id}`} className="flex-1 cursor-pointer">
                        {student.name}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {selectedStudentsForBroadcast.length} aluno(s) selecionado(s)
              </p>
            </div>
            
            {/* Mensagem */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem</label>
              <Textarea
                placeholder="Digite sua mensagem..."
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBroadcastModal(false)}>
              Cancelar
            </Button>
            <BroadcastSendButton
              studentIds={selectedStudentsForBroadcast}
              message={broadcastMessage}
              onSuccess={() => {
                setShowBroadcastModal(false);
                setBroadcastMessage('');
                setSelectedStudentsForBroadcast([]);
                setSelectAllForBroadcast(false);
                refetchStudents();
              }}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

// Componente de botão de envio de broadcast
function BroadcastSendButton({ studentIds, message, onSuccess }: { studentIds: number[]; message: string; onSuccess: () => void }) {
  const broadcast = trpc.chat.broadcast.useMutation({
    onSuccess: (data) => {
      toast.success(`Mensagem enviada para ${data.sent} aluno(s)!`);
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao enviar mensagem');
    },
  });

  return (
    <Button
      onClick={() => broadcast.mutate({ studentIds, message })}
      disabled={broadcast.isPending || studentIds.length === 0 || !message.trim()}
      className="gap-2"
    >
      {broadcast.isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Enviando...
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          Enviar para {studentIds.length} aluno(s)
        </>
      )}
    </Button>
  );
}

// Componente de botão de transcrição de áudio
function TranscribeButton({ messageId, audioUrl, onSuccess }: { messageId: number; audioUrl: string; onSuccess: () => void }) {
  const transcribe = trpc.chat.transcribeAudio.useMutation({
    onSuccess: () => {
      toast.success('Transcrição concluída!');
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao transcrever áudio');
    },
  });

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-6 text-xs opacity-75 hover:opacity-100"
      onClick={() => transcribe.mutate({ messageId, audioUrl })}
      disabled={transcribe.isPending}
    >
      {transcribe.isPending ? (
        <>
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Transcrevendo...
        </>
      ) : (
        <>
          <FileText className="h-3 w-3 mr-1" />
          Transcrever
        </>
      )}
    </Button>
  );
}
