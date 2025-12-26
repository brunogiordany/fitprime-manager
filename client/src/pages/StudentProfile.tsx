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
  MoreVertical
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

  const { data: photos } = trpc.photos.list.useQuery(
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
    onSuccess: (data) => {
      toast.success("Convite enviado com sucesso!");
      // Copiar link para clipboard
      const fullLink = window.location.origin + data.inviteLink;
      navigator.clipboard.writeText(fullLink);
      toast.info("Link copiado para a área de transferência!");
    },
    onError: (error: any) => {
      toast.error("Erro ao enviar convite: " + error.message);
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

  const weightData = measurements?.map(m => ({
    date: format(new Date(m.measureDate), "dd/MM", { locale: ptBR }),
    weight: parseFloat(m.weight || "0"),
  })).reverse() || [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation('/alunos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xl font-bold">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{student.name}</h1>
                <div className="flex items-center gap-2 text-muted-foreground">
                  {student.phone && (
                    <span className="flex items-center gap-1 text-sm">
                      <Phone className="h-3 w-3" />
                      {student.phone}
                    </span>
                  )}
                  {student.email && (
                    <span className="flex items-center gap-1 text-sm">
                      <Mail className="h-3 w-3" />
                      {student.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
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
                  onClick={() => sendInviteMutation.mutate({ studentId, sendVia: 'both' })}
                  disabled={sendInviteMutation.isPending}
                  title="Enviar convite para o aluno acessar o app"
                >
                  {sendInviteMutation.isPending ? (
                    <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
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
                      ? `Última atualização: ${format(new Date(anamnesis.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
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

            {measurements && measurements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Medidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {measurements.slice(0, 5).map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">
                            {format(new Date(m.measureDate), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Peso: {m.weight || '-'} kg | IMC: {m.bmi || '-'}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p>Cintura: {m.waist || '-'} cm</p>
                          <p>Quadril: {m.hip || '-'} cm</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Photos Tab */}
          <TabsContent value="photos">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Galeria de Fotos</CardTitle>
                  <CardDescription>Registro visual da evolução</CardDescription>
                </div>
                <div>
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <Button 
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                  >
                    {isUploadingPhoto ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Foto
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {photos && photos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.url}
                          alt={photo.category || 'Foto'}
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg">
                          <p className="text-xs">
                            {format(new Date(photo.photoDate), "dd/MM/yyyy")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Camera className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhuma foto cadastrada</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Sessões</CardTitle>
                  <CardDescription>Histórico de sessões do aluno - clique para editar o status</CardDescription>
                </div>
                <Button onClick={() => setLocation(`/agenda?new=true&studentId=${studentId}`)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Sessão
                </Button>
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
                              {format(new Date(session.date), "EEEE, dd/MM/yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(session.date), "HH:mm")} - {session.duration || 60} min
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
                        {format(new Date(editingSession.scheduledAt), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(editingSession.scheduledAt), "HH:mm")} - {editingSession.duration || 60} min
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Pagamentos</CardTitle>
                  <CardDescription>Histórico de cobranças e pagamentos</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setLocation(`/alunos/${studentId}/contratar`)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Contratar Plano
                  </Button>
                  <Button onClick={() => setLocation(`/cobrancas?new=true&studentId=${studentId}`)}>
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
                      {studentPackages.map((pkg: any) => (
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
                              <p className="font-medium">{pkg.plan?.name || 'Plano'}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(pkg.startDate), "dd/MM/yyyy")} - {pkg.endDate ? format(new Date(pkg.endDate), "dd/MM/yyyy") : 'Sem fim'}
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
                      ))}
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
                            Vencimento: {format(new Date(charge.dueDate), "dd/MM/yyyy")}
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
