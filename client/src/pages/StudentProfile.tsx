import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { 
  ArrowLeft,
  User,
  FileText,
  TrendingUp,
  Camera,
  Dumbbell,
  Calendar,
  CreditCard,
  FolderOpen,
  Download,
  Edit,
  Save,
  X,
  Plus,
  Phone,
  Mail,
  MapPin,
  Send,
  Link2,
  RefreshCw,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  Pause,
  Play,
  AlertTriangle,
  MoreVertical,
  Trash2,
  Ban,
  Shield,
  Ruler,
  Brain,
  Sparkles,
  Target,
  AlertCircle,
  Lightbulb,
  Activity,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useLocation, useParams, useSearch } from "wouter";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { copyToClipboard } from "@/lib/clipboard";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { UnifiedEvolutionDashboard } from "@/components/UnifiedEvolutionDashboard";

export default function StudentProfile() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const searchParams = useSearch();
  const studentId = parseInt(params.id || "0");
  const showEdit = searchParams.includes('edit=true');
  
  const [isEditing, setIsEditing] = useState(showEdit);
  const [editData, setEditData] = useState<any>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [editSessionStatus, setEditSessionStatus] = useState<string>('');
  const [showBatchSessionModal, setShowBatchSessionModal] = useState(false);
  const [showBatchChargeModal, setShowBatchChargeModal] = useState(false);
  const [batchAction, setBatchAction] = useState<'cancel' | 'delete'>('cancel');
  const [batchFromDate, setBatchFromDate] = useState('');
  const [batchToDate, setBatchToDate] = useState('');
  const [batchReason, setBatchReason] = useState('');
  const [showAIAnalysisModal, setShowAIAnalysisModal] = useState(false);
  const [aiAnalysis, setAIAnalysis] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  
  const { data: student, isLoading } = trpc.students.get.useQuery(
    { id: studentId },
    { enabled: studentId > 0 }
  );

  const { data: anamnesis } = trpc.anamnesis.get.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const { data: measurements } = trpc.measurements.list.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const { data: photos, refetch: refetchPhotos } = trpc.photos.list.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const { data: workouts } = trpc.workouts.list.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const { data: charges } = trpc.charges.listByStudent.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const { data: materials } = trpc.materials.list.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const { data: sessionStats } = trpc.sessions.studentStats.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const { data: inviteHistory } = trpc.students.getInvites.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const { data: studentSessions } = trpc.sessions.listByStudent.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const { data: studentPackages } = trpc.packages.listByStudent.useQuery(
    { studentId },
    { enabled: studentId > 0 }
  );

  const updateMutation = trpc.students.update.useMutation({
    onSuccess: () => {
      toast.success("Dados atualizados com sucesso!");
      setIsEditing(false);
      utils.students.get.invalidate({ id: studentId });
    },
    onError: (error) => {
      toast.error("Erro ao atualizar: " + error.message);
    },
  });

  const uploadPhotoMutation = trpc.photos.upload.useMutation({
    onSuccess: () => {
      toast.success("Foto adicionada com sucesso!");
      utils.photos.list.invalidate({ studentId });
      setIsUploadingPhoto(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar foto: " + error.message);
      setIsUploadingPhoto(false);
    },
  });

  const sendInviteMutation = trpc.students.sendInvite.useMutation({
    onSuccess: async (data) => {
      toast.success("Convite gerado com sucesso!");
      const fullLink = window.location.origin + data.inviteLink;
      setInviteLink(fullLink);
      setShowInviteModal(true);
    },
    onError: (error: any) => {
      toast.error("Erro ao enviar convite: " + error.message);
    },
  });

  const resendInviteMutation = trpc.students.resendInvite.useMutation({
    onSuccess: async (data) => {
      if (data.type === 'reminder') {
        toast.success(data.message);
      } else {
        const fullLink = window.location.origin + data.inviteLink;
        setInviteLink(fullLink);
        setShowInviteModal(true);
        toast.success(data.message);
      }
    },
    onError: (error: any) => {
      toast.error("Erro ao reenviar convite: " + error.message);
    },
  });

  const resetAccessMutation = trpc.students.resetAccess.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.students.get.invalidate({ id: studentId });
    },
    onError: (error: any) => {
      toast.error("Erro ao resetar acesso: " + error.message);
    },
  });

  const cancelInviteMutation = trpc.students.cancelInvite.useMutation({
    onSuccess: () => {
      toast.success("Convite cancelado!");
      utils.students.getInvites.invalidate({ studentId });
    },
    onError: (error: any) => {
      toast.error("Erro ao cancelar convite: " + error.message);
    },
  });

  const uploadMaterialMutation = trpc.materials.create.useMutation({
    onSuccess: () => {
      toast.success("Material adicionado com sucesso!");
      utils.materials.list.invalidate({ studentId });
      setIsUploadingMaterial(false);
    },
    onError: (error: any) => {
      toast.error("Erro ao adicionar material: " + error.message);
      setIsUploadingMaterial(false);
    },
  });

  const updateSessionMutation = trpc.sessions.update.useMutation({
    onSuccess: () => {
      toast.success("Sessão atualizada com sucesso!");
      utils.sessions.listByStudent.invalidate({ studentId });
      utils.sessions.studentStats.invalidate({ studentId });
      setEditingSession(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar sessão: " + error.message);
    },
  });

  // Mutations para gerenciamento de contratos
  const pauseContractMutation = trpc.packages.pause.useMutation({
    onSuccess: () => {
      toast.success("Contrato pausado com sucesso!");
      utils.packages.listByStudent.invalidate({ studentId });
    },
    onError: (error: any) => {
      toast.error("Erro ao pausar contrato: " + error.message);
    },
  });

  const reactivateContractMutation = trpc.packages.reactivate.useMutation({
    onSuccess: () => {
      toast.success("Contrato reativado com sucesso!");
      utils.packages.listByStudent.invalidate({ studentId });
    },
    onError: (error: any) => {
      toast.error("Erro ao reativar contrato: " + error.message);
    },
  });

  const markDefaultedMutation = trpc.packages.markDefaulted.useMutation({
    onSuccess: () => {
      toast.success("Contrato marcado como inadimplente!");
      utils.packages.listByStudent.invalidate({ studentId });
    },
    onError: (error: any) => {
      toast.error("Erro ao marcar inadimplente: " + error.message);
    },
  });

  const cancelContractMutation = trpc.packages.cancel.useMutation({
    onSuccess: () => {
      toast.success("Contrato cancelado com sucesso!");
      utils.packages.listByStudent.invalidate({ studentId });
    },
    onError: (error: any) => {
      toast.error("Erro ao cancelar contrato: " + error.message);
    },
  });

  // Mutations para gerenciamento do aluno
  const pauseStudentMutation = trpc.students.pause.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.students.get.invalidate({ id: studentId });
      utils.sessions.listByStudent.invalidate({ studentId });
      utils.charges.listByStudent.invalidate({ studentId });
      utils.packages.listByStudent.invalidate({ studentId });
    },
    onError: (error: any) => {
      toast.error("Erro ao pausar aluno: " + error.message);
    },
  });

  const reactivateStudentMutation = trpc.students.reactivate.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.students.get.invalidate({ id: studentId });
      utils.packages.listByStudent.invalidate({ studentId });
    },
    onError: (error: any) => {
      toast.error("Erro ao reativar aluno: " + error.message);
    },
  });

  const cancelStudentMutation = trpc.students.cancel.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.students.get.invalidate({ id: studentId });
      utils.sessions.listByStudent.invalidate({ studentId });
      utils.charges.listByStudent.invalidate({ studentId });
      utils.packages.listByStudent.invalidate({ studentId });
    },
    onError: (error: any) => {
      toast.error("Erro ao cancelar aluno: " + error.message);
    },
  });

  // Mutations para ações em lote de sessões
  const cancelFutureSessionsMutation = trpc.sessions.cancelFuture.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.sessions.listByStudent.invalidate({ studentId });
      utils.sessions.studentStats.invalidate({ studentId });
      setShowBatchSessionModal(false);
      setBatchFromDate('');
      setBatchToDate('');
      setBatchReason('');
    },
    onError: (error: any) => {
      toast.error("Erro ao cancelar sessões: " + error.message);
    },
  });

  const deleteFutureSessionsMutation = trpc.sessions.deleteFuture.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.sessions.listByStudent.invalidate({ studentId });
      utils.sessions.studentStats.invalidate({ studentId });
      setShowBatchSessionModal(false);
      setBatchFromDate('');
      setBatchToDate('');
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir sessões: " + error.message);
    },
  });

  // Mutations para ações em lote de cobranças
  const cancelFutureChargesMutation = trpc.charges.cancelFuture.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.charges.listByStudent.invalidate({ studentId });
      setShowBatchChargeModal(false);
      setBatchFromDate('');
      setBatchToDate('');
    },
    onError: (error: any) => {
      toast.error("Erro ao cancelar cobranças: " + error.message);
    },
  });

  const deleteFutureChargesMutation = trpc.charges.deleteFuture.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      utils.charges.listByStudent.invalidate({ studentId });
      setShowBatchChargeModal(false);
      setBatchFromDate('');
      setBatchToDate('');
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir cobranças: " + error.message);
    },
  });

  // Mutation para excluir medida
  const deleteMeasurementMutation = trpc.measurements.delete.useMutation({
    onSuccess: () => {
      toast.success("Medida enviada para a lixeira!");
      utils.measurements.list.invalidate({ studentId });
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir medida: " + error.message);
    },
  });

  const exportPDFMutation = trpc.students.exportPDF.useMutation({
    onSuccess: (data) => {
      // Criar blob e fazer download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.contentType });
      
      // Criar link e fazer download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF exportado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao exportar PDF: " + error.message);
    },
  });

  // Análise por IA do aluno
  const aiAnalysisMutation = trpc.trainingDiary.aiAnalysis.useMutation({
    onSuccess: (data: any) => {
      setAIAnalysis(data);
      toast.success("Análise gerada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao gerar análise: " + error.message);
    },
  });

  const handleAIAnalysis = () => {
    setShowAIAnalysisModal(true);
    setAIAnalysis(null);
    aiAnalysisMutation.mutate({ studentId });
  };

  useEffect(() => {
    if (student) {
      setEditData({
        name: student.name,
        email: student.email || "",
        phone: student.phone || "",
        birthDate: student.birthDate ? format(new Date(student.birthDate), "yyyy-MM-dd") : "",
        gender: student.gender || "",
        cpf: student.cpf || "",
        address: student.address || "",
        emergencyContact: student.emergencyContact || "",
        emergencyPhone: student.emergencyPhone || "",
        notes: student.notes || "",
        status: student.status,
        hasChildren: student.hasChildren || false,
        maritalStatus: student.maritalStatus || "",
      });
    }
  }, [student]);

  const handleSave = () => {
    updateMutation.mutate({
      id: studentId,
      ...editData,
    });
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        uploadPhotoMutation.mutate({
          studentId,
          photoDate: new Date().toISOString(),
          fileBase64: base64,
          fileName: file.name,
          mimeType: file.type,
          category: 'other',
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Erro ao processar a imagem');
      setIsUploadingPhoto(false);
    }

    // Reset input
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  const handleMaterialUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('O arquivo deve ter no máximo 10MB');
      return;
    }

    setIsUploadingMaterial(true);

    try {
      // Upload para S3 via endpoint
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro no upload');
      }

      const { url, fileKey } = await response.json();

      uploadMaterialMutation.mutate({
        studentId,
        title: file.name,
        url,
        fileKey,
        type: file.type.includes('pdf') ? 'pdf' : 
              file.type.includes('video') ? 'video' : 
              file.type.includes('image') ? 'image' : 'other',
      });
    } catch (error) {
      toast.error('Erro ao fazer upload do material');
      setIsUploadingMaterial(false);
    }

    // Reset input
    if (materialInputRef.current) {
      materialInputRef.current.value = '';
    }
  };

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">Aluno não encontrado</p>
          <Button variant="link" onClick={() => setLocation('/alunos')}>
            Voltar para lista de alunos
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const weightData = measurements?.filter(m => m.measureDate && !isNaN(new Date(m.measureDate).getTime())).map(m => ({
    date: format(new Date(m.measureDate), "dd/MM", { locale: ptBR }),
    weight: parseFloat(m.weight || "0"),
  })).reverse() || [];

  // Dados para gráfico de composição corporal (% gordura e massa muscular)
  const bodyCompositionData = measurements?.filter(m => m.measureDate && !isNaN(new Date(m.measureDate).getTime())).map(m => ({
    date: format(new Date(m.measureDate), "dd/MM", { locale: ptBR }),
    gordura: parseFloat(m.bodyFat || "0"),
    musculo: parseFloat(m.muscleMass || "0"),
    imc: parseFloat(m.bmi || "0"),
  })).reverse() || [];

  // Dados para gráfico de circunferências
  const circumferenceData = measurements?.filter(m => m.measureDate && !isNaN(new Date(m.measureDate).getTime())).map(m => ({
    date: format(new Date(m.measureDate), "dd/MM", { locale: ptBR }),
    cintura: parseFloat(m.waist || "0"),
    quadril: parseFloat(m.hip || "0"),
    peito: parseFloat(m.chest || "0"),
    bracoDireito: parseFloat(m.rightArm || "0"),
    coxaDireita: parseFloat(m.rightThigh || "0"),
  })).reverse() || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          {/* Linha superior: voltar + info do aluno */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation('/alunos')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight truncate">{student.name}</h1>
                    {student.status === 'paused' && (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300 shrink-0">
                        <Pause className="h-3 w-3 mr-1" />
                        Pausado
                      </Badge>
                    )}
                    {student.status === 'inactive' && (
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300 shrink-0">
                        <XCircle className="h-3 w-3 mr-1" />
                        Cancelado
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground flex-wrap">
                    {student.phone && (
                      <span className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" />
                        {student.phone}
                      </span>
                    )}
                    {student.email && (
                      <span className="flex items-center gap-1 text-sm truncate">
                        <Mail className="h-3 w-3" />
                        {student.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Linha inferior: botões de ação (centralizada no mobile) */}
          <div className="flex flex-wrap gap-2 justify-center md:justify-start">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    if (student.userId) {
                      resendInviteMutation.mutate({ studentId, sendVia: 'email' });
                    } else {
                      sendInviteMutation.mutate({ studentId, sendVia: 'both' });
                    }
                  }}
                  disabled={sendInviteMutation.isPending || resendInviteMutation.isPending}
                  title={student.userId ? "Reenviar lembrete de acesso" : "Enviar convite para o aluno acessar o app"}
                >
                  {(sendInviteMutation.isPending || resendInviteMutation.isPending) ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                  ) : student.userId ? (
                    <><Send className="h-4 w-4 mr-2" /> Reenviar Acesso</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Convidar</>
                  )}
                </Button>
                {student.userId && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      if (confirm('Isso irá desconectar o aluno do app. Ele precisará de um novo convite para acessar. Continuar?')) {
                        resetAccessMutation.mutate({ studentId });
                      }
                    }}
                    disabled={resetAccessMutation.isPending}
                    title="Resetar acesso do aluno"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Resetar Acesso
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  onClick={() => exportPDFMutation.mutate({ studentId })}
                  disabled={exportPDFMutation.isPending}
                >
                  {exportPDFMutation.isPending ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Gerando...</>
                  ) : (
                    <><Download className="h-4 w-4 mr-2" /> Exportar PDF</>
                  )}
                </Button>
                
                {/* Botão de Análise por IA */}
                <Button 
                  onClick={handleAIAnalysis}
                  disabled={aiAnalysisMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  {aiAnalysisMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando...</>
                  ) : (
                    <><Brain className="h-4 w-4 mr-2" /> Análise IA</>
                  )}
                </Button>
                
                {/* Menu de ações do aluno */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {student.status === 'paused' ? (
                      <DropdownMenuItem 
                        onClick={() => {
                          if (confirm('Reativar este aluno? Os contratos pausados serão reativados.')) {
                            reactivateStudentMutation.mutate({ studentId });
                          }
                        }}
                        disabled={reactivateStudentMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-2 text-green-600" />
                        Reativar Aluno
                      </DropdownMenuItem>
                    ) : student.status === 'active' ? (
                      <DropdownMenuItem 
                        onClick={() => {
                          const reason = prompt('Motivo da pausa (opcional):');
                          const pausedUntil = prompt('Data prevista de retorno (opcional, formato: AAAA-MM-DD):');
                          if (confirm('Pausar este aluno? Sessões e cobranças futuras serão canceladas.')) {
                            pauseStudentMutation.mutate({ 
                              studentId, 
                              reason: reason || undefined,
                              pausedUntil: pausedUntil || undefined,
                            });
                          }
                        }}
                        disabled={pauseStudentMutation.isPending}
                      >
                        <Pause className="h-4 w-4 mr-2 text-yellow-600" />
                        Pausar Aluno (Férias)
                      </DropdownMenuItem>
                    ) : null}
                    
                    <DropdownMenuSeparator />
                    
                    {student.status !== 'inactive' && (
                      <DropdownMenuItem 
                        onClick={() => {
                          const reason = prompt('Motivo do cancelamento (opcional):');
                          if (confirm('ATENÇÃO: Cancelar este aluno definitivamente? Todos os contratos, sessões e cobranças futuras serão cancelados. O histórico será mantido.')) {
                            cancelStudentMutation.mutate({ studentId, reason: reason || undefined });
                          }
                        }}
                        disabled={cancelStudentMutation.isPending}
                        className="text-red-600"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancelar Aluno
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto min-w-full h-auto flex-wrap lg:flex-nowrap gap-1 p-1">
              <TabsTrigger value="overview" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
                <User className="h-4 w-4 hidden sm:block" />
                Geral
              </TabsTrigger>
              <TabsTrigger value="anamnesis" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
                <FileText className="h-4 w-4 hidden sm:block" />
                Anamnese
              </TabsTrigger>
              <TabsTrigger value="evolution" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
                <TrendingUp className="h-4 w-4 hidden sm:block" />
                Evolução
              </TabsTrigger>
              <TabsTrigger value="photos" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
                <Camera className="h-4 w-4 hidden sm:block" />
                Fotos
              </TabsTrigger>
              <TabsTrigger value="workouts" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
                <Dumbbell className="h-4 w-4 hidden sm:block" />
                Treinos
              </TabsTrigger>
              <TabsTrigger value="sessions" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
                <Calendar className="h-4 w-4 hidden sm:block" />
                Sessões
              </TabsTrigger>
              <TabsTrigger value="payments" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
                <CreditCard className="h-4 w-4 hidden sm:block" />
                Pagamentos
              </TabsTrigger>
              <TabsTrigger value="materials" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
                <FolderOpen className="h-4 w-4 hidden sm:block" />
                Materiais
              </TabsTrigger>
              <TabsTrigger value="invites" className="gap-2 px-3 py-2 text-sm whitespace-nowrap">
                <Send className="h-4 w-4 hidden sm:block" />
                Convites
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Dados Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid gap-2">
                        <Label>Nome</Label>
                        <Input
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>E-mail</Label>
                          <Input
                            type="email"
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Telefone</Label>
                          <Input
                            value={editData.phone}
                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Data de Nascimento</Label>
                          <Input
                            type="date"
                            value={editData.birthDate}
                            onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Gênero</Label>
                          <Select
                            value={editData.gender}
                            onValueChange={(value) => setEditData({ ...editData, gender: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="male">Masculino</SelectItem>
                              <SelectItem value="female">Feminino</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Estado Civil</Label>
                          <Select
                            value={editData.maritalStatus}
                            onValueChange={(value) => setEditData({ ...editData, maritalStatus: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="single">Solteiro(a)</SelectItem>
                              <SelectItem value="married">Casado(a)</SelectItem>
                              <SelectItem value="divorced">Divorciado(a)</SelectItem>
                              <SelectItem value="widowed">Viúvo(a)</SelectItem>
                              <SelectItem value="other">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Tem Filhos?</Label>
                          <Select
                            value={editData.hasChildren ? "yes" : "no"}
                            onValueChange={(value) => setEditData({ ...editData, hasChildren: value === "yes" })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">Sim</SelectItem>
                              <SelectItem value="no">Não</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>CPF</Label>
                        <Input
                          value={editData.cpf}
                          onChange={(e) => setEditData({ ...editData, cpf: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Endereço</Label>
                        <Textarea
                          value={editData.address}
                          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select
                          value={editData.status}
                          onValueChange={(value) => setEditData({ ...editData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome</span>
                        <span className="font-medium">{student.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">E-mail</span>
                        <span className="font-medium">{student.email || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telefone</span>
                        <span className="font-medium">{student.phone || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Data de Nascimento</span>
                        <span className="font-medium">
                          {student.birthDate 
                            ? format(new Date(student.birthDate), "dd/MM/yyyy")
                            : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gênero</span>
                        <span className="font-medium">
                          {student.gender === 'male' ? 'Masculino' : 
                           student.gender === 'female' ? 'Feminino' : 
                           student.gender === 'other' ? 'Outro' : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado Civil</span>
                        <span className="font-medium">
                          {student.maritalStatus === 'single' ? 'Solteiro(a)' :
                           student.maritalStatus === 'married' ? 'Casado(a)' :
                           student.maritalStatus === 'divorced' ? 'Divorciado(a)' :
                           student.maritalStatus === 'widowed' ? 'Viúvo(a)' :
                           student.maritalStatus === 'other' ? 'Outro' : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tem Filhos</span>
                        <span className="font-medium">{student.hasChildren ? 'Sim' : 'Não'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CPF</span>
                        <span className="font-medium">{student.cpf || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge className={
                          student.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          student.status === 'inactive' ? 'bg-gray-100 text-gray-700' :
                          'bg-yellow-100 text-yellow-700'
                        }>
                          {student.status === 'active' ? 'Ativo' :
                           student.status === 'inactive' ? 'Inativo' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contato de Emergência</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="grid gap-2">
                        <Label>Nome do Contato</Label>
                        <Input
                          value={editData.emergencyContact}
                          onChange={(e) => setEditData({ ...editData, emergencyContact: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Telefone de Emergência</Label>
                        <Input
                          value={editData.emergencyPhone}
                          onChange={(e) => setEditData({ ...editData, emergencyPhone: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Observações</Label>
                        <Textarea
                          value={editData.notes}
                          onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                          rows={4}
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome</span>
                        <span className="font-medium">{student.emergencyContact || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Telefone</span>
                        <span className="font-medium">{student.emergencyPhone || '-'}</span>
                      </div>
                      {student.notes && (
                        <div className="pt-2">
                          <span className="text-muted-foreground">Observações</span>
                          <p className="mt-1 text-sm">{student.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card de Acesso ao Portal do Aluno */}
              <Card className="border-2 border-emerald-200 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-emerald-600" />
                    Acesso ao Portal do Aluno
                  </CardTitle>
                  <CardDescription>
                    Envie o acesso para o aluno visualizar treinos, agenda e pagamentos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Status de Conexão */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
                    <div className="flex items-center gap-3">
                      {student.userId ? (
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <XCircle className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">
                          {student.userId ? 'Conectado ao Portal' : 'Sem acesso ao Portal'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {student.userId 
                            ? 'O aluno pode acessar seus treinos e agenda'
                            : 'Envie um convite para o aluno acessar o app'}
                        </p>
                      </div>
                    </div>
                    {student.userId && (
                      <Badge className="bg-emerald-100 text-emerald-700">Ativo</Badge>
                    )}
                  </div>

                  {/* Botões de Ação */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => sendInviteMutation.mutate({ studentId, sendVia: 'email' })}
                      disabled={sendInviteMutation.isPending || !student.email}
                    >
                      <Mail className="h-4 w-4 text-blue-600" />
                      Enviar por E-mail
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                      onClick={() => sendInviteMutation.mutate({ studentId, sendVia: 'whatsapp' })}
                      disabled={sendInviteMutation.isPending || !student.phone}
                    >
                      <Phone className="h-4 w-4 text-green-600" />
                      Enviar por WhatsApp
                    </Button>
                  </div>

                  {/* Link de Convite */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Link de Convite</Label>
                    <div className="flex gap-2">
                      <Input 
                        readOnly 
                        value={`${window.location.origin}/convite/${student.inviteToken || 'gerar-convite'}`}
                        className="bg-gray-50"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={async () => {
                          const link = `${window.location.origin}/convite/${student.inviteToken || ''}`;
                          const copied = await copyToClipboard(link);
                          if (copied) {
                            toast.success('Link copiado!');
                          } else {
                            toast.info('Copie o link: ' + link, { duration: 10000 });
                          }
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Ações Adicionais */}
                  {student.userId && (
                    <div className="pt-2 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          if (confirm('Isso irá desconectar o aluno do app. Ele precisará de um novo convite para acessar. Continuar?')) {
                            resetAccessMutation.mutate({ studentId });
                          }
                        }}
                        disabled={resetAccessMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Resetar Acesso do Aluno
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card de Permissões do Aluno */}
              <Card className="border-2 border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    Permissões do Aluno
                  </CardTitle>
                  <CardDescription>
                    Controle o que o aluno pode editar no portal
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-medium">Editar Anamnese</p>
                        <p className="text-sm text-muted-foreground">
                          Permite o aluno atualizar dados de saúde e objetivos
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={student.canEditAnamnesis || false}
                      onCheckedChange={(checked) => {
                        updateMutation.mutate({ id: studentId, canEditAnamnesis: checked });
                      }}
                      disabled={updateMutation.isPending}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
                        <Ruler className="h-5 w-5 text-teal-600" />
                      </div>
                      <div>
                        <p className="font-medium">Editar Medidas</p>
                        <p className="text-sm text-muted-foreground">
                          Permite o aluno registrar e atualizar suas medidas corporais
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={student.canEditMeasurements || false}
                      onCheckedChange={(checked) => {
                        updateMutation.mutate({ id: studentId, canEditMeasurements: checked });
                      }}
                      disabled={updateMutation.isPending}
                    />
                  </div>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    Quando desabilitado, o aluno só poderá visualizar os dados
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Anamnesis Tab */}
          <TabsContent value="anamnesis">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Anamnese</CardTitle>
                  <CardDescription>
                    {anamnesis 
                      ? `Última atualização: ${anamnesis.updatedAt && !isNaN(new Date(anamnesis.updatedAt).getTime()) ? format(new Date(anamnesis.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : '--/--/----'}`
                      : 'Nenhuma anamnese cadastrada'}
                  </CardDescription>
                </div>
                <Button onClick={() => setLocation(`/alunos/${studentId}/anamnese`)}>
                  {anamnesis ? 'Editar Anamnese' : 'Criar Anamnese'}
                </Button>
              </CardHeader>
              <CardContent>
                {anamnesis ? (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Estilo de Vida</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ocupação</span>
                          <span>{anamnesis.occupation || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nível de Atividade</span>
                          <span>{anamnesis.lifestyle || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Horas de Sono</span>
                          <span>{anamnesis.sleepHours ? `${anamnesis.sleepHours}h` : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Nível de Estresse</span>
                          <span>{anamnesis.stressLevel || '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold">Objetivos</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Objetivo Principal</span>
                          <span>{anamnesis.mainGoal || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Peso Alvo</span>
                          <span>{anamnesis.targetWeight ? `${anamnesis.targetWeight} kg` : '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Experiência</span>
                          <span>{anamnesis.exerciseExperience || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma anamnese cadastrada</p>
                    <Button 
                      variant="link" 
                      onClick={() => setLocation(`/alunos/${studentId}/anamnese`)}
                    >
                      Criar anamnese agora
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evolution Tab */}
          <TabsContent value="evolution" className="space-y-6">
            {/* KPIs de Frequência */}
            {sessionStats && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-emerald-600">{sessionStats.attendanceRate}%</p>
                      <p className="text-sm text-muted-foreground">Taxa de Presença</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{sessionStats.completed}</p>
                      <p className="text-sm text-muted-foreground">Sessões Realizadas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-amber-600">{sessionStats.noShow}</p>
                      <p className="text-sm text-muted-foreground">Faltas</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold">{sessionStats.thisMonth}</p>
                      <p className="text-sm text-muted-foreground">Este Mês</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Gráfico de Frequência Mensal */}
            {sessionStats && sessionStats.monthlyData && sessionStats.monthlyData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Frequência Mensal</CardTitle>
                  <CardDescription>Últimos 6 meses de presenças e faltas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sessionStats.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="presencas" name="Presenças" fill="oklch(0.55 0.18 160)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="faltas" name="Faltas" fill="oklch(0.7 0.15 60)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Evolução de Peso</CardTitle>
                  <CardDescription>Acompanhamento das medidas ao longo do tempo</CardDescription>
                </div>
                <Button onClick={() => setLocation(`/alunos/${studentId}/medidas`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Medida
                </Button>
              </CardHeader>
              <CardContent>
                {weightData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={['auto', 'auto']} />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="oklch(0.55 0.18 160)" 
                          strokeWidth={2}
                          dot={{ fill: "oklch(0.55 0.18 160)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma medida registrada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gráfico de Composição Corporal */}
            {bodyCompositionData.length > 0 && bodyCompositionData.some(d => d.gordura > 0 || d.musculo > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Composição Corporal</CardTitle>
                  <CardDescription>Evolução de % gordura e massa muscular</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bodyCompositionData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="gordura" 
                          name="% Gordura"
                          stroke="oklch(0.7 0.15 60)" 
                          strokeWidth={2}
                          dot={{ fill: "oklch(0.7 0.15 60)" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="musculo" 
                          name="Massa Muscular (kg)"
                          stroke="oklch(0.55 0.18 160)" 
                          strokeWidth={2}
                          dot={{ fill: "oklch(0.55 0.18 160)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Gráfico de Circunferências */}
            {circumferenceData.length > 0 && circumferenceData.some(d => d.cintura > 0 || d.quadril > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Evolução das Circunferências</CardTitle>
                  <CardDescription>Medidas em centímetros ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={circumferenceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="cintura" name="Cintura" stroke="#82ca9d" strokeWidth={2} />
                        <Line type="monotone" dataKey="quadril" name="Quadril" stroke="#ffc658" strokeWidth={2} />
                        <Line type="monotone" dataKey="peito" name="Peito" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="bracoDireito" name="Braço D" stroke="#ff7300" strokeWidth={2} />
                        <Line type="monotone" dataKey="coxaDireita" name="Coxa D" stroke="#00C49F" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {measurements && measurements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Medidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {measurements.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">
                            {m.measureDate && !isNaN(new Date(m.measureDate).getTime())
                              ? format(new Date(m.measureDate), "dd/MM/yyyy", { locale: ptBR })
                              : '--/--/----'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Peso: {m.weight || '-'} kg | IMC: {m.bmi || '-'}
                          </p>
                        </div>
                        <div className="text-right text-sm hidden sm:block">
                          <p>Cintura: {m.waist || '-'} cm</p>
                          <p>Quadril: {m.hip || '-'} cm</p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setLocation(`/alunos/${studentId}/medidas?edit=${m.id}`)}
                            title="Editar medida"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('Enviar esta medida para a lixeira?')) {
                                deleteMeasurementMutation.mutate({ id: m.id });
                              }
                            }}
                            title="Excluir medida"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Photos Tab - Evolução Unificada */}
          <TabsContent value="photos">
            <UnifiedEvolutionDashboard
              studentId={studentId}
              studentName={student?.name || 'Aluno'}
              photos={photos || []}
              measurements={measurements || []}
              onRefresh={() => refetchPhotos()}
              embedded={true}
            />
          </TabsContent>


          {/* Workouts Tab */}
          <TabsContent value="workouts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Treinos</CardTitle>
                  <CardDescription>Programas de treino do aluno</CardDescription>
                </div>
                <Button onClick={() => setLocation(`/treinos/novo?studentId=${studentId}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Treino
                </Button>
              </CardHeader>
              <CardContent>
                {workouts && workouts.length > 0 ? (
                  <div className="space-y-4">
                    {workouts.map((workout) => (
                      <div 
                        key={workout.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer"
                        onClick={() => setLocation(`/treinos/${workout.id}`)}
                      >
                        <div>
                          <p className="font-medium">{workout.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {workout.description || 'Sem descrição'}
                          </p>
                        </div>
                        <Badge className={
                          workout.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                          workout.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }>
                          {workout.status === 'active' ? 'Ativo' :
                           workout.status === 'completed' ? 'Concluído' : 'Inativo'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Dumbbell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum treino cadastrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Sessões</CardTitle>
                  <CardDescription>Histórico de sessões do aluno - clique para editar o status</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4 mr-2" />
                        Ações em Lote
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setBatchAction('cancel');
                        setShowBatchSessionModal(true);
                      }}>
                        <Ban className="h-4 w-4 mr-2" />
                        Cancelar Sessões Futuras
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setBatchAction('delete');
                        setShowBatchSessionModal(true);
                      }} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Sessões Futuras
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button onClick={() => setLocation(`/agenda?new=true&studentId=${studentId}`)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Sessão
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {studentSessions && studentSessions.length > 0 ? (
                  <div className="space-y-3">
                    {studentSessions.map((session) => (
                      <div 
                        key={session.id} 
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setEditingSession(session);
                          setEditSessionStatus(session.status);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            session.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                            session.status === 'no_show' ? 'bg-red-100 text-red-600' :
                            session.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {session.date && !isNaN(new Date(session.date).getTime())
                                ? format(new Date(session.date), "EEEE, dd/MM/yyyy", { locale: ptBR })
                                : 'Data não definida'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {session.date && !isNaN(new Date(session.date).getTime())
                                ? format(new Date(session.date), "HH:mm")
                                : '--:--'} - {session.duration || 60} min
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${
                            session.status === 'completed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' :
                            session.status === 'no_show' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                            session.status === 'cancelled' ? 'bg-gray-100 text-gray-700 hover:bg-gray-100' :
                            session.status === 'confirmed' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' :
                            'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                          }`}>
                            {session.status === 'completed' ? 'Realizada' :
                             session.status === 'no_show' ? 'Falta' :
                             session.status === 'cancelled' ? 'Cancelada' :
                             session.status === 'confirmed' ? 'Confirmada' :
                             'Agendada'}
                          </Badge>
                          <Edit className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma sessão agendada</p>
                    <Button variant="link" onClick={() => setLocation('/agenda')}>
                      Ir para Agenda
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Modal de Edição de Sessão */}
            <Dialog open={!!editingSession} onOpenChange={(open) => !open && setEditingSession(null)}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Editar Sessão
                  </DialogTitle>
                </DialogHeader>
                {editingSession && (
                  <div className="space-y-4 py-4">
                    <div className="bg-accent/30 rounded-lg p-4">
                      <p className="font-semibold">
                        {editingSession.scheduledAt && !isNaN(new Date(editingSession.scheduledAt).getTime())
                          ? format(new Date(editingSession.scheduledAt), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                          : 'Data não definida'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {editingSession.scheduledAt && !isNaN(new Date(editingSession.scheduledAt).getTime())
                          ? format(new Date(editingSession.scheduledAt), "HH:mm")
                          : '--:--'} - {editingSession.duration || 60} min
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Status da Sessão</Label>
                      <Select
                        value={editSessionStatus}
                        onValueChange={setEditSessionStatus}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-500" />
                              Agendada
                            </div>
                          </SelectItem>
                          <SelectItem value="confirmed">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-blue-600" />
                              Confirmada
                            </div>
                          </SelectItem>
                          <SelectItem value="completed">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-emerald-500" />
                              Realizada
                            </div>
                          </SelectItem>
                          <SelectItem value="no_show">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500" />
                              Falta
                            </div>
                          </SelectItem>
                          <SelectItem value="cancelled">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-gray-400" />
                              Cancelada
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setLocation(`/sessao/${editingSession.id}/treino`)}
                      >
                        <Dumbbell className="h-4 w-4 mr-2" />
                        Ir para Treino
                      </Button>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingSession(null)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => {
                      if (editingSession && editSessionStatus) {
                        updateSessionMutation.mutate({
                          id: editingSession.id,
                          status: editSessionStatus as any,
                        });
                      }
                    }}
                    disabled={updateSessionMutation.isPending}
                  >
                    {updateSessionMutation.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Pagamentos</CardTitle>
                  <CardDescription>Histórico de cobranças e pagamentos</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4 mr-2" />
                        Ações em Lote
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => {
                        setBatchAction('cancel');
                        setShowBatchChargeModal(true);
                      }}>
                        <Ban className="h-4 w-4 mr-2" />
                        Cancelar Cobranças Pendentes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setBatchAction('delete');
                        setShowBatchChargeModal(true);
                      }} className="text-red-600">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir Cobranças Pendentes
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="sm" onClick={() => setLocation(`/alunos/${studentId}/contratar`)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Contratar Plano
                  </Button>
                  <Button size="sm" onClick={() => setLocation(`/cobrancas?new=true&studentId=${studentId}`)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Cobrança
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Seção de Contratos */}
                {studentPackages && studentPackages.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Contratos</h3>
                    <div className="space-y-3">
                      {studentPackages.map((pkgData: any) => {
                        const pkg = pkgData.package;
                        const plan = pkgData.plan;
                        return (
                        <div key={pkg.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              pkg.status === 'active' ? 'bg-emerald-500' :
                              pkg.status === 'paused' ? 'bg-yellow-500' :
                              pkg.status === 'defaulted' ? 'bg-red-500' :
                              pkg.status === 'cancelled' ? 'bg-gray-500' :
                              'bg-blue-500'
                            }`} />
                            <div>
                              <p className="font-medium">{plan?.name || 'Plano'}</p>
                              <p className="text-sm text-muted-foreground">
                                {pkg.startDate && !isNaN(new Date(pkg.startDate).getTime()) 
                                  ? format(new Date(pkg.startDate), "dd/MM/yyyy") 
                                  : '--/--/----'} - {pkg.endDate && !isNaN(new Date(pkg.endDate).getTime()) 
                                  ? format(new Date(pkg.endDate), "dd/MM/yyyy") 
                                  : 'Sem fim'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`${
                              pkg.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                              pkg.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                              pkg.status === 'defaulted' ? 'bg-red-100 text-red-700' :
                              pkg.status === 'cancelled' ? 'bg-gray-100 text-gray-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {pkg.status === 'active' ? 'Ativo' :
                               pkg.status === 'paused' ? 'Pausado' :
                               pkg.status === 'defaulted' ? 'Inadimplente' :
                               pkg.status === 'cancelled' ? 'Cancelado' :
                               pkg.status === 'expired' ? 'Expirado' : 'Pendente'}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {pkg.status === 'active' && (
                                  <>
                                    <DropdownMenuItem onClick={() => pauseContractMutation.mutate({ id: pkg.id, cancelFutureSessions: true })}>
                                      <Pause className="h-4 w-4 mr-2" />
                                      Pausar Contrato
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => markDefaultedMutation.mutate({ id: pkg.id, cancelFutureSessions: true, cancelFutureCharges: false })}>
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      Marcar Inadimplente
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(pkg.status === 'paused' || pkg.status === 'defaulted') && (
                                  <DropdownMenuItem onClick={() => reactivateContractMutation.mutate({ id: pkg.id })}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Reativar Contrato
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => cancelContractMutation.mutate({ id: pkg.id })}
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancelar Contrato
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </div>
                )}

                {/* Seção de Cobranças */}
                <h3 className="text-lg font-semibold mb-3">Cobranças</h3>
                {charges && charges.length > 0 ? (
                  <div className="space-y-4">
                    {charges.map((charge) => (
                      <div key={charge.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{charge.description}</p>
                          <p className="text-sm text-muted-foreground">
                            Vencimento: {charge.dueDate && !isNaN(new Date(charge.dueDate).getTime()) 
                              ? format(new Date(charge.dueDate), "dd/MM/yyyy") 
                              : '--/--/----'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(charge.amount)}</p>
                          <Badge className={
                            charge.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            charge.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            charge.status === 'overdue' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }>
                            {charge.status === 'paid' ? 'Pago' :
                             charge.status === 'pending' ? 'Pendente' :
                             charge.status === 'overdue' ? 'Atrasado' : 'Cancelado'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma cobrança cadastrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Materiais</CardTitle>
                  <CardDescription>Arquivos e documentos compartilhados</CardDescription>
                </div>
                <div>
                  <input
                    type="file"
                    ref={materialInputRef}
                    onChange={handleMaterialUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mp3,.jpg,.jpeg,.png,.gif"
                    className="hidden"
                  />
                  <Button 
                    onClick={() => materialInputRef.current?.click()}
                    disabled={isUploadingMaterial}
                  >
                    {isUploadingMaterial ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Material
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {materials && materials.length > 0 ? (
                  <div className="space-y-4">
                    {materials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FolderOpen className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{material.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {material.description || material.type}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                          <a href={material.url} target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum material cadastrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invites Tab */}
          <TabsContent value="invites">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Histórico de Convites</CardTitle>
                  <CardDescription>Convites enviados para este aluno</CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    if (student?.userId) {
                      resendInviteMutation.mutate({ studentId, sendVia: 'email' });
                    } else {
                      sendInviteMutation.mutate({ studentId, sendVia: 'both' });
                    }
                  }}
                  disabled={sendInviteMutation.isPending || resendInviteMutation.isPending}
                >
                  {(sendInviteMutation.isPending || resendInviteMutation.isPending) ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> {student?.userId ? 'Reenviar Acesso' : 'Novo Convite'}</>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {/* Status atual do acesso */}
                <div className="mb-6 p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {student?.userId ? (
                      <>
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-green-700">Acesso Ativo</p>
                          <p className="text-sm text-muted-foreground">O aluno já criou sua conta e pode acessar o portal</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-amber-700">Aguardando Cadastro</p>
                          <p className="text-sm text-muted-foreground">O aluno ainda não criou sua conta no portal</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Lista de convites */}
                {inviteHistory && inviteHistory.length > 0 ? (
                  <div className="space-y-3">
                    {inviteHistory.map((invite: any) => (
                      <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            invite.status === 'accepted' ? 'bg-green-100' :
                            invite.status === 'pending' ? 'bg-blue-100' :
                            invite.status === 'expired' ? 'bg-gray-100' :
                            'bg-red-100'
                          }`}>
                            {invite.status === 'accepted' ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : invite.status === 'pending' ? (
                              <Clock className="h-5 w-5 text-blue-600" />
                            ) : invite.status === 'expired' ? (
                              <Clock className="h-5 w-5 text-gray-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {invite.status === 'accepted' ? 'Aceito' :
                               invite.status === 'pending' ? 'Pendente' :
                               invite.status === 'expired' ? 'Expirado' :
                               'Cancelado'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Enviado em {new Date(invite.createdAt).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {invite.status === 'pending' && (
                              <p className="text-xs text-muted-foreground">
                                Expira em {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {invite.status === 'pending' && new Date(invite.expiresAt) > new Date() && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  const fullLink = `${window.location.origin}/convite/${invite.inviteToken}`;
                                  navigator.clipboard.writeText(fullLink);
                                  toast.success('Link copiado!');
                                }}
                              >
                                <Copy className="h-4 w-4 mr-1" />
                                Copiar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  if (confirm('Cancelar este convite?')) {
                                    cancelInviteMutation.mutate({ inviteId: invite.id });
                                  }
                                }}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Send className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum convite enviado ainda</p>
                    <p className="text-sm text-muted-foreground mt-1">Clique em "Novo Convite" para enviar o primeiro</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Ações em Lote - Sessões */}
        <Dialog open={showBatchSessionModal} onOpenChange={setShowBatchSessionModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {batchAction === 'cancel' ? (
                  <><Ban className="h-5 w-5" /> Cancelar Sessões Futuras</>
                ) : (
                  <><Trash2 className="h-5 w-5 text-red-600" /> Excluir Sessões Futuras</>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm font-medium mb-1">Deixe os campos de data vazios para afetar TODAS as sessões do aluno.</p>
                <p className="text-xs text-muted-foreground">Ou preencha para filtrar por período específico.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>De (opcional)</Label>
                  <Input
                    type="date"
                    value={batchFromDate}
                    onChange={(e) => setBatchFromDate(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Até (opcional)</Label>
                  <Input
                    type="date"
                    value={batchToDate}
                    onChange={(e) => setBatchToDate(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
              {batchAction === 'cancel' && (
                <div className="space-y-2">
                  <Label>Motivo do cancelamento (opcional)</Label>
                  <Textarea
                    value={batchReason}
                    onChange={(e) => setBatchReason(e.target.value)}
                    placeholder="Ex: Viagem, férias, etc."
                  />
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {batchAction === 'cancel' 
                    ? 'As sessões serão marcadas como canceladas e não poderão ser revertidas automaticamente.'
                    : 'As sessões serão movidas para a lixeira. Você pode restaurá-las depois se necessário.'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBatchSessionModal(false)}>
                Cancelar
              </Button>
              <Button
                variant={batchAction === 'delete' ? 'destructive' : 'default'}
                onClick={() => {
                  if (batchAction === 'cancel') {
                    cancelFutureSessionsMutation.mutate({
                      studentId,
                      fromDate: batchFromDate || undefined,
                      toDate: batchToDate || undefined,
                      reason: batchReason || undefined,
                    });
                  } else {
                    deleteFutureSessionsMutation.mutate({
                      studentId,
                      fromDate: batchFromDate || undefined,
                      toDate: batchToDate || undefined,
                    });
                  }
                }}
                disabled={cancelFutureSessionsMutation.isPending || deleteFutureSessionsMutation.isPending}
              >
                {(cancelFutureSessionsMutation.isPending || deleteFutureSessionsMutation.isPending) 
                  ? 'Processando...' 
                  : batchAction === 'cancel' ? 'Cancelar Sessões' : 'Excluir Sessões'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Análise por IA */}
        <Dialog open={showAIAnalysisModal} onOpenChange={setShowAIAnalysisModal}>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-[700px] max-h-[90vh] flex flex-col p-0 overflow-hidden overflow-x-hidden">
            <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b flex-shrink-0 bg-gradient-to-r from-purple-50 to-indigo-50">
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                <span className="truncate">Análise - {student?.name}</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6">
              {aiAnalysisMutation.isPending ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <Brain className="h-12 w-12 sm:h-16 sm:w-16 text-purple-600 animate-pulse" />
                    <Sparkles className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-500 absolute -top-1 -right-1 animate-bounce" />
                  </div>
                  <p className="mt-4 text-base sm:text-lg font-medium text-center">Analisando dados...</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Isso pode levar alguns segundos</p>
                </div>
              ) : aiAnalysis ? (
                <div className="space-y-4 min-w-0 w-full">
                  {/* Desequilíbrios - Card em destaque no topo */}
                  {aiAnalysis.analysis.desequilibriosMusculares && aiAnalysis.analysis.desequilibriosMusculares.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
                      <h3 className="font-bold text-blue-700 flex items-center gap-2 mb-3 text-base">
                        <Target className="h-5 w-5 flex-shrink-0" /> Desequilíbrios
                      </h3>
                      <ul className="space-y-2">
                        {aiAnalysis.analysis.desequilibriosMusculares.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                            <span className="text-blue-500 mt-0.5 flex-shrink-0 font-bold">•</span>
                            <span className="break-words" style={{ wordBreak: 'break-word' }}>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Recomendações - Card em destaque */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200">
                    <h3 className="font-bold text-purple-700 flex items-center gap-2 mb-3 text-base">
                      <Lightbulb className="h-5 w-5 flex-shrink-0" /> Recomendações
                    </h3>
                    <ul className="space-y-2.5">
                      {aiAnalysis.analysis.recomendacoes.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-purple-700">
                          <span className="bg-purple-200 text-purple-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="break-words" style={{ wordBreak: 'break-word' }}>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Metadados */}
                  <div className="text-xs text-muted-foreground border-t pt-3 space-y-1">
                    <div>Análise: {new Date(aiAnalysis.metadata.analyzedAt).toLocaleString('pt-BR')}</div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      <span>{aiAnalysis.metadata.dataPoints.measurements} medidas</span>
                      <span>{aiAnalysis.metadata.dataPoints.trainingDays} dias de treino</span>
                      <span>{aiAnalysis.metadata.dataPoints.muscleGroups} grupos</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Clique em "Gerar Análise" para começar</p>
                </div>
              )}
            </div>
            
            <DialogFooter className="px-4 py-3 sm:px-6 sm:py-4 border-t flex-shrink-0 gap-2">
              <Button
                onClick={() => aiAnalysisMutation.mutate({ studentId })}
                disabled={aiAnalysisMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {aiAnalysisMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando...</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-2" /> Gerar Análise</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAIAnalysisModal(false)} className="flex-1 sm:flex-none">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Ações em Lote - Cobranças */}
        <Dialog open={showBatchChargeModal} onOpenChange={setShowBatchChargeModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {batchAction === 'cancel' ? (
                  <><Ban className="h-5 w-5" /> Cancelar Cobranças Pendentes</>
                ) : (
                  <><Trash2 className="h-5 w-5 text-red-600" /> Excluir Cobranças Pendentes</>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>A partir de (opcional)</Label>
                <Input
                  type="date"
                  value={batchFromDate}
                  onChange={(e) => setBatchFromDate(e.target.value)}
                  placeholder="Deixe vazio para usar data atual"
                />
                <p className="text-xs text-muted-foreground">Se não informado, usa a data de hoje</p>
              </div>
              <div className="space-y-2">
                <Label>Até (opcional)</Label>
                <Input
                  type="date"
                  value={batchToDate}
                  onChange={(e) => setBatchToDate(e.target.value)}
                  placeholder="Deixe vazio para todas futuras"
                />
                <p className="text-xs text-muted-foreground">Se não informado, afeta todas as cobranças pendentes futuras</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  {batchAction === 'cancel' 
                    ? 'As cobranças serão marcadas como canceladas.'
                    : 'As cobranças serão excluídas permanentemente. Esta ação não pode ser desfeita.'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowBatchChargeModal(false)}>
                Cancelar
              </Button>
              <Button
                variant={batchAction === 'delete' ? 'destructive' : 'default'}
                onClick={() => {
                  if (batchAction === 'cancel') {
                    cancelFutureChargesMutation.mutate({
                      studentId,
                      fromDate: batchFromDate || undefined,
                      toDate: batchToDate || undefined,
                    });
                  } else {
                    deleteFutureChargesMutation.mutate({
                      studentId,
                      fromDate: batchFromDate || undefined,
                      toDate: batchToDate || undefined,
                    });
                  }
                }}
                disabled={cancelFutureChargesMutation.isPending || deleteFutureChargesMutation.isPending}
              >
                {(cancelFutureChargesMutation.isPending || deleteFutureChargesMutation.isPending) 
                  ? 'Processando...' 
                  : batchAction === 'cancel' ? 'Cancelar Cobranças' : 'Excluir Cobranças'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal de Link de Convite */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-emerald-600" />
              Link de Convite
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Compartilhe este link com o aluno para que ele possa acessar o app:
            </p>
            <div className="flex items-center gap-2">
              <Input 
                value={inviteLink} 
                readOnly 
                className="flex-1 text-sm bg-muted"
              />
              <Button
                variant="default"
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700"
                onClick={async () => {
                  const copied = await copyToClipboard(inviteLink);
                  if (copied) {
                    toast.success("Link copiado!");
                  } else {
                    toast.error("Erro ao copiar. Selecione e copie manualmente.");
                  }
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (student?.phone) {
                    const message = encodeURIComponent(`Olá! Acesse seu portal de treinos pelo link: ${inviteLink}`);
                    window.open(`https://wa.me/55${student.phone.replace(/\D/g, '')}?text=${message}`, '_blank');
                  } else {
                    toast.error("Aluno não tem telefone cadastrado");
                  }
                }}
              >
                <Phone className="h-4 w-4 mr-2 text-green-600" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (student?.email) {
                    const subject = encodeURIComponent("Seu acesso ao app de treinos");
                    const body = encodeURIComponent(`Olá!\n\nAcesse seu portal de treinos pelo link:\n${inviteLink}\n\nAbracos!`);
                    window.open(`mailto:${student.email}?subject=${subject}&body=${body}`, '_blank');
                  } else {
                    toast.error("Aluno não tem email cadastrado");
                  }
                }}
              >
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                E-mail
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
