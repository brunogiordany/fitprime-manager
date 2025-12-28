import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  User, 
  MessageCircle, 
  Calendar, 
  Clock, 
  Save,
  Trash2,
  X,
  Phone,
  ExternalLink
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface Session {
  id: number;
  studentId: number;
  scheduledAt: string;
  duration: number | null;
  status: string;
  type: string | null;
  location: string | null;
  notes: string | null;
  student?: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

interface SessionEditModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const statusOptions = [
  { value: 'scheduled', label: 'Agendada', color: 'bg-blue-500' },
  { value: 'confirmed', label: 'Confirmada', color: 'bg-emerald-500' },
  { value: 'completed', label: 'Realizada', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelada', color: 'bg-gray-400' },
  { value: 'no_show', label: 'Falta', color: 'bg-red-500' },
  { value: 'waiting', label: 'Aguardando', color: 'bg-orange-500' },
];

export default function SessionEditModal({ session, isOpen, onClose, onUpdate }: SessionEditModalProps) {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  
  const [editData, setEditData] = useState({
    scheduledAt: '',
    duration: '60',
    status: 'scheduled',
    type: 'regular',
    location: '',
    notes: '',
    sendReminder: true,
  });

  useEffect(() => {
    if (session) {
      setEditData({
        scheduledAt: session.scheduledAt ? format(new Date(session.scheduledAt), "yyyy-MM-dd'T'HH:mm") : '',
        duration: (session.duration || 60).toString(),
        status: session.status || 'scheduled',
        type: session.type || 'regular',
        location: session.location || '',
        notes: session.notes || '',
        sendReminder: true,
      });
    }
  }, [session]);

  const updateMutation = trpc.sessions.update.useMutation({
    onSuccess: () => {
      toast.success("Sessão atualizada com sucesso!");
      utils.sessions.list.invalidate();
      onUpdate?.();
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar sessão: " + error.message);
    },
  });

  const deleteMutation = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      toast.success("Sessão excluída!");
      utils.sessions.list.invalidate();
      onUpdate?.();
      onClose();
    },
    onError: (error) => {
      toast.error("Erro ao excluir sessão: " + error.message);
    },
  });

  const handleSave = () => {
    if (!session) return;
    
    updateMutation.mutate({
      id: session.id,
      scheduledAt: editData.scheduledAt,
      duration: parseInt(editData.duration),
      status: editData.status as any,
      type: editData.type as any,
      location: editData.location || undefined,
      notes: editData.notes || undefined,
    });
  };

  const handleDelete = () => {
    if (!session) return;
    if (confirm("Tem certeza que deseja excluir esta sessão?")) {
      deleteMutation.mutate({ id: session.id });
    }
  };

  const handleWhatsApp = () => {
    if (!session?.student?.phone) {
      toast.error("Aluno não possui telefone cadastrado");
      return;
    }
    const phone = session.student.phone.replace(/\D/g, '');
    const message = `Olá ${session.student.name}! Sua sessão está agendada para ${format(new Date(session.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}.`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleViewStudent = () => {
    if (session?.studentId) {
      setLocation(`/alunos/${session.studentId}`);
      onClose();
    }
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-500';
  };

  if (!session) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editando agendamento
          </DialogTitle>
        </DialogHeader>

        {/* Informações do Cliente */}
        <div className="bg-accent/30 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold text-lg">
              {session.student?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary">{session.student?.name}</p>
              {session.student?.phone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {session.student.phone}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={handleWhatsApp}
            >
              <MessageCircle className="h-4 w-4 text-green-600" />
              Conversar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-2"
              onClick={handleViewStudent}
            >
              <User className="h-4 w-4" />
              Ver cliente
            </Button>
          </div>
        </div>

        <Separator />

        {/* Data e Status */}
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data e Hora
            </Label>
            <Input
              type="datetime-local"
              value={editData.scheduledAt}
              onChange={(e) => setEditData({ ...editData, scheduledAt: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select
              value={editData.status}
              onValueChange={(value) => setEditData({ ...editData, status: value })}
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(editData.status)}`} />
                    {statusOptions.find(s => s.value === editData.status)?.label}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${status.color}`} />
                      {status.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Serviços */}
        <div className="space-y-4">
          <h4 className="font-semibold">Serviços</h4>
          
          <div className="grid gap-2">
            <Label>Tipo</Label>
            <Select
              value={editData.type}
              onValueChange={(value) => setEditData({ ...editData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="trial">Experimental</SelectItem>
                <SelectItem value="makeup">Reposição</SelectItem>
                <SelectItem value="extra">Extra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horário
              </Label>
              <Input
                type="time"
                value={editData.scheduledAt.split('T')[1] || ''}
                onChange={(e) => {
                  const date = editData.scheduledAt.split('T')[0];
                  setEditData({ ...editData, scheduledAt: `${date}T${e.target.value}` });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Duração</Label>
              <Select
                value={editData.duration}
                onValueChange={(value) => setEditData({ ...editData, duration: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="20">20 min</SelectItem>
                  <SelectItem value="25">25 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="35">35 min</SelectItem>
                  <SelectItem value="40">40 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="50">50 min</SelectItem>
                  <SelectItem value="55">55 min</SelectItem>
                  <SelectItem value="60">1h</SelectItem>
                  <SelectItem value="65">1h 5min</SelectItem>
                  <SelectItem value="70">1h 10min</SelectItem>
                  <SelectItem value="75">1h 15min</SelectItem>
                  <SelectItem value="80">1h 20min</SelectItem>
                  <SelectItem value="85">1h 25min</SelectItem>
                  <SelectItem value="90">1h 30min</SelectItem>
                  <SelectItem value="95">1h 35min</SelectItem>
                  <SelectItem value="100">1h 40min</SelectItem>
                  <SelectItem value="105">1h 45min</SelectItem>
                  <SelectItem value="110">1h 50min</SelectItem>
                  <SelectItem value="115">1h 55min</SelectItem>
                  <SelectItem value="120">2h</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Local</Label>
            <Input
              placeholder="Ex: Academia, Casa do aluno"
              value={editData.location}
              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
            />
          </div>
        </div>

        <Separator />

        {/* Ações */}
        <div className="space-y-3">
          <h4 className="font-semibold">Ações</h4>
          <div className="flex items-center justify-between">
            <Label htmlFor="send-reminder" className="cursor-pointer">Enviar lembrete</Label>
            <Switch
              id="send-reminder"
              checked={editData.sendReminder}
              onCheckedChange={(checked) => setEditData({ ...editData, sendReminder: checked })}
            />
          </div>
        </div>

        <Separator />

        {/* Observação */}
        <div className="grid gap-2">
          <Label>Observação</Label>
          <Textarea
            placeholder="Escreva aqui..."
            value={editData.notes}
            onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
            rows={3}
          />
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2 text-red-500" />
            Excluir
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
