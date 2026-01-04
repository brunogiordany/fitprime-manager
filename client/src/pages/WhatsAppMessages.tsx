import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { 
  MessageSquare, 
  Search,
  Send,
  ArrowLeft,
  Loader2,
  Phone,
  MoreVertical,
  CheckCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Users,
  AlertTriangle,
  Lightbulb,
  Megaphone,
  CheckCircle2,
  Info
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface ChatMessage {
  id: number;
  senderType: "personal" | "student";
  messageType: "text" | "audio" | "image" | "video" | "file" | "link";
  message: string | null;
  mediaUrl?: string | null;
  mediaName?: string | null;
  createdAt: Date | string;
  isRead: boolean | null;
  source?: string | null;
}

interface StudentWithPhone {
  id: number;
  name: string;
  phone: string | null;
  whatsappOptIn: boolean;
}

export default function WhatsAppMessages() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentWithPhone | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  
  // Estados para envio em massa
  const [showBulkSend, setShowBulkSend] = useState(false);
  const [bulkMessage, setBulkMessage] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [isSendingBulk, setIsSendingBulk] = useState(false);
  const [showStrategyTips, setShowStrategyTips] = useState(true);

  // Buscar alunos com telefone (apenas alunos que podem receber WhatsApp)
  const { data: allStudents, refetch: refetchStudents } = trpc.students.list.useQuery({});
  
  // Filtrar apenas alunos com telefone e opt-in
  const studentsWithPhone = useMemo(() => 
    allStudents?.filter((s: any) => s.phone && s.whatsappOptIn) || [],
    [allStudents]
  );

  // Buscar mensagens do WhatsApp do aluno selecionado
  const { data: whatsappMessages, refetch: refetchMessages, isLoading: isLoadingMessages } = trpc.chat.messages.useQuery(
    { studentId: selectedStudent?.id || 0, limit: 100, source: 'whatsapp' },
    { 
      enabled: !!selectedStudent,
      refetchInterval: 5000
    }
  );

  // Mutation para enviar mensagem via WhatsApp
  const sendMessage = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      setNewMessage("");
      refetchMessages();
      setIsSending(false);
      
      if (data.whatsappSent) {
        toast.success("Mensagem enviada via WhatsApp!", { icon: "📤" });
      } else if (data.whatsappError) {
        toast.error(`Erro ao enviar: ${data.whatsappError}`, { icon: "❌" });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar mensagem");
      setIsSending(false);
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
  }, [whatsappMessages, scrollToBottom]);

  // Selecionar/deselecionar todos
  useEffect(() => {
    if (selectAll) {
      setSelectedStudents(studentsWithPhone.map((s: any) => s.id));
    } else if (selectedStudents.length === studentsWithPhone.length) {
      setSelectedStudents([]);
    }
  }, [selectAll]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedStudent) return;
    setIsSending(true);
    sendMessage.mutate({ 
      studentId: selectedStudent.id, 
      message: newMessage.trim(),
      sendViaWhatsApp: true
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Envio em massa
  const handleBulkSend = async () => {
    if (!bulkMessage.trim() || selectedStudents.length === 0) return;
    
    setIsSendingBulk(true);
    let successCount = 0;
    let errorCount = 0;
    
    for (const studentId of selectedStudents) {
      try {
        await sendMessage.mutateAsync({
          studentId,
          message: bulkMessage.trim(),
          sendViaWhatsApp: true
        });
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }
    
    setIsSendingBulk(false);
    setBulkMessage("");
    setSelectedStudents([]);
    setSelectAll(false);
    setShowBulkSend(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} mensagem(ns) enviada(s) com sucesso!`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} mensagem(ns) falharam`);
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Formatar data para separador
  const formatDateSeparator = (date: Date | string) => {
    const d = new Date(date);
    if (isToday(d)) return "Hoje";
    if (isYesterday(d)) return "Ontem";
    return format(d, "dd 'de' MMMM", { locale: ptBR });
  };

  // Agrupar mensagens por data
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentDate = "";
    
    messages.forEach((msg) => {
      const msgDate = format(new Date(msg.createdAt), "yyyy-MM-dd");
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    
    return groups;
  };

  const messageGroups = whatsappMessages ? groupMessagesByDate(whatsappMessages) : [];

  // Filtrar alunos pela busca
  const filteredStudents = studentsWithPhone.filter((student: any) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone?.includes(searchTerm)
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-80px)] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-4 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">WhatsApp Mensagens</h1>
                <p className="text-sm text-muted-foreground">
                  Envie mensagens para seus alunos via WhatsApp
                </p>
              </div>
            </div>
            <Button 
              onClick={() => setShowBulkSend(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Megaphone className="h-4 w-4 mr-2" />
              Envio em Massa
            </Button>
          </div>
        </div>

        {/* Aviso Importante */}
        <div className="flex-shrink-0 px-4 pb-2">
          <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800 dark:text-amber-400">Importante: Canal de Envio</AlertTitle>
            <AlertDescription className="text-amber-700 dark:text-amber-300">
              Este canal <strong>apenas envia</strong> mensagens via WhatsApp. As respostas dos alunos chegam diretamente no WhatsApp do seu celular.
              Para conversas bidirecionais, use o <strong>Chat FitPrime</strong> no menu lateral.
            </AlertDescription>
          </Alert>
        </div>

        {/* Dicas de Estratégia */}
        {showStrategyTips && (
          <div className="flex-shrink-0 px-4 pb-2">
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2 text-blue-800 dark:text-blue-400">
                    <Lightbulb className="h-4 w-4" />
                    Estratégias de Uso
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowStrategyTips(false)}
                    className="text-blue-600 hover:text-blue-800 h-6 px-2"
                  >
                    Fechar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-blue-700 dark:text-blue-300">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Lembretes:</strong> Envie lembretes de sessão 24h antes para reduzir faltas</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Motivação:</strong> Mensagens de incentivo aumentam engajamento em 40%</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Promoções:</strong> Use envio em massa para divulgar novos planos ou promoções</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chat Container */}
        <div className="flex-1 flex bg-gray-100 dark:bg-gray-900 overflow-hidden">
          {/* Lista de Conversas - Sidebar */}
          <div className={`${selectedStudent ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 bg-white dark:bg-gray-950 border-r`}>
            {/* Header da lista */}
            <div className="flex-shrink-0 p-4 border-b bg-green-600 text-white">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Wifi className="h-5 w-5" />
                  Alunos ({studentsWithPhone.length})
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetchStudents()}
                  className="text-white hover:bg-green-700"
                >
                  <RefreshCw className="h-5 w-5" />
                </Button>
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

            {/* Lista de conversas */}
            <ScrollArea className="flex-1">
              {filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <WifiOff className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">Nenhum aluno com WhatsApp</p>
                  <p className="text-sm">Cadastre alunos com telefone e opt-in</p>
                </div>
              ) : (
                filteredStudents.map((student: any) => (
                  <button
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-gray-100 dark:border-gray-800 ${
                      selectedStudent?.id === student.id
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    <Avatar className="h-12 w-12 flex-shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-lg">
                        {student.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold truncate">{student.name}</p>
                        <Badge variant="outline" className="text-xs text-green-600 border-green-300">
                          <Phone className="h-3 w-3 mr-1" />
                          WhatsApp
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {student.phone}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* Área de Chat */}
          <div className={`${selectedStudent ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-[#e5ddd5] dark:bg-gray-800`}>
            {selectedStudent ? (
              <>
                {/* Header do chat */}
                <div className="flex-shrink-0 flex items-center gap-3 p-3 bg-green-600 text-white shadow-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden text-white hover:bg-green-700"
                    onClick={() => setSelectedStudent(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-white/20 text-white">
                      {selectedStudent.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{selectedStudent.name}</p>
                    <p className="text-xs text-green-100 flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedStudent.phone}
                    </p>
                  </div>
                  <Badge className="bg-green-700 text-white text-xs">
                    <Send className="h-3 w-3 mr-1" />
                    Apenas Envio
                  </Badge>
                </div>

                {/* Área de mensagens */}
                <div 
                  className="flex-1 overflow-y-auto p-4"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                >
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                  ) : messageGroups.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center bg-white/80 dark:bg-gray-900/80 rounded-2xl p-8 shadow-lg">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4 text-green-500" />
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Nenhuma mensagem enviada</p>
                        <p className="text-sm text-gray-500">Envie uma mensagem para este aluno!</p>
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
                                        ? `bg-[#dcf8c6] dark:bg-green-700 ${showTail ? 'rounded-tl-lg rounded-tr-lg rounded-bl-lg' : 'rounded-lg'}`
                                        : `bg-white dark:bg-gray-700 ${showTail ? 'rounded-tl-lg rounded-tr-lg rounded-br-lg' : 'rounded-lg'}`
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                                    
                                    {/* Horário e status */}
                                    <div className={`flex items-center gap-1 mt-1 ${isPersonal ? 'justify-end' : 'justify-start'}`}>
                                      <span className="text-[10px] text-gray-500">
                                        {format(new Date(msg.createdAt), "HH:mm")}
                                      </span>
                                      {isPersonal && (
                                        <CheckCheck className="h-3 w-3 text-blue-500" />
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
                <div className="flex-shrink-0 p-3 bg-gray-100 dark:bg-gray-900 border-t">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Digite uma mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 rounded-full bg-white dark:bg-gray-800 border-0 focus-visible:ring-1 focus-visible:ring-green-500"
                      disabled={isSending}
                    />
                    
                    <Button
                      onClick={handleSendMessage}
                      disabled={isSending || !newMessage.trim()}
                      size="icon"
                      className="rounded-full bg-green-500 hover:bg-green-600 h-10 w-10 disabled:opacity-50"
                    >
                      {isSending ? (
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
                <div className="text-center max-w-md px-4">
                  <div className="w-48 h-48 mx-auto mb-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-24 w-24 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-light text-gray-600 dark:text-gray-400 mb-2">WhatsApp Mensagens</h2>
                  <p className="text-gray-500 dark:text-gray-500 mb-4">
                    Selecione um aluno para enviar mensagem via WhatsApp
                  </p>
                  <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 text-left">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-amber-700 dark:text-amber-300">
                        <p className="font-medium mb-1">Dica de uso:</p>
                        <p>Use o botão "Envio em Massa" para enviar a mesma mensagem para vários alunos de uma vez!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog de Envio em Massa */}
      <Dialog open={showBulkSend} onOpenChange={setShowBulkSend}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-green-600" />
              Envio em Massa via WhatsApp
            </DialogTitle>
            <DialogDescription>
              Envie a mesma mensagem para múltiplos alunos de uma vez.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Aviso */}
            <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950/20 flex-shrink-0">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-300 text-sm">
                As mensagens serão enviadas individualmente para cada aluno. Respostas chegarão no seu WhatsApp pessoal.
              </AlertDescription>
            </Alert>

            {/* Seleção de alunos */}
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">
                  Selecionar Alunos ({selectedStudents.length} de {studentsWithPhone.length})
                </label>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="selectAll"
                    checked={selectAll}
                    onCheckedChange={(checked) => setSelectAll(checked as boolean)}
                  />
                  <label htmlFor="selectAll" className="text-sm cursor-pointer">
                    Selecionar todos
                  </label>
                </div>
              </div>
              
              <ScrollArea className="flex-1 border rounded-lg p-2 max-h-[200px]">
                <div className="space-y-1">
                  {studentsWithPhone.map((student: any) => (
                    <div 
                      key={student.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedStudents.includes(student.id) 
                          ? 'bg-green-50 dark:bg-green-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => toggleStudentSelection(student.id)}
                    >
                      <Checkbox 
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => toggleStudentSelection(student.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-500 text-white text-sm">
                          {student.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Mensagem */}
            <div className="flex-shrink-0">
              <label className="text-sm font-medium mb-2 block">Mensagem</label>
              <Textarea
                placeholder="Digite a mensagem que será enviada para todos os alunos selecionados..."
                value={bulkMessage}
                onChange={(e) => setBulkMessage(e.target.value)}
                className="min-h-[100px]"
              />
              <p className="text-xs text-gray-500 mt-1">
                Dica: Use mensagens personalizadas como "Olá! Lembrete de treino amanhã 💪"
              </p>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setShowBulkSend(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleBulkSend}
              disabled={isSendingBulk || selectedStudents.length === 0 || !bulkMessage.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSendingBulk ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar para {selectedStudents.length} aluno{selectedStudents.length !== 1 ? 's' : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
