import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const fieldLabels: Record<string, string> = {
  name: "Nome",
  email: "E-mail",
  phone: "Telefone",
  birthDate: "Data de Nascimento",
  gender: "Gênero",
  cpf: "CPF",
  address: "Endereço",
  emergencyContact: "Contato de Emergência",
  emergencyPhone: "Telefone de Emergência",
  notes: "Observações",
  occupation: "Ocupação",
  lifestyle: "Estilo de Vida",
  sleepHours: "Horas de Sono",
  sleepQuality: "Qualidade do Sono",
  stressLevel: "Nível de Estresse",
  medicalHistory: "Histórico Médico",
  injuries: "Lesões",
  surgeries: "Cirurgias",
  medications: "Medicamentos",
  allergies: "Alergias",
  mainGoal: "Objetivo Principal",
  weight: "Peso",
  height: "Altura",
  bodyFat: "% Gordura",
};

export default function PendingChanges() {
  const utils = trpc.useUtils();
  const [selectedChange, setSelectedChange] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  
  const { data: changes, isLoading } = trpc.pendingChanges.list.useQuery();
  
  const approveMutation = trpc.pendingChanges.approve.useMutation({
    onSuccess: () => {
      toast.success("Alteração aprovada com sucesso!");
      utils.pendingChanges.list.invalidate();
      utils.pendingChanges.count.invalidate();
      setIsReviewDialogOpen(false);
      setSelectedChange(null);
      setReviewNotes("");
    },
    onError: (error) => {
      toast.error("Erro ao aprovar: " + error.message);
    },
  });
  
  const rejectMutation = trpc.pendingChanges.reject.useMutation({
    onSuccess: () => {
      toast.success("Alteração rejeitada!");
      utils.pendingChanges.list.invalidate();
      utils.pendingChanges.count.invalidate();
      setIsReviewDialogOpen(false);
      setSelectedChange(null);
      setReviewNotes("");
    },
    onError: (error) => {
      toast.error("Erro ao rejeitar: " + error.message);
    },
  });
  
  const handleReview = (change: any) => {
    setSelectedChange(change);
    setReviewNotes("");
    setIsReviewDialogOpen(true);
  };
  
  const handleApprove = () => {
    if (!selectedChange) return;
    approveMutation.mutate({ id: selectedChange.change.id, reviewNotes: reviewNotes || undefined });
  };
  
  const handleReject = () => {
    if (!selectedChange) return;
    rejectMutation.mutate({ id: selectedChange.change.id, reviewNotes: reviewNotes || undefined });
  };
  
  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'student': return 'Dados Pessoais';
      case 'anamnesis': return 'Anamnese';
      case 'measurement': return 'Medidas';
      default: return type;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Alterações Pendentes
          </h1>
          <p className="text-muted-foreground">
            Revise e aprove as alterações solicitadas pelos alunos
          </p>
        </div>

        {/* Lista de Alterações */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : changes && changes.length > 0 ? (
          <div className="space-y-4">
            {changes.map((item) => (
              <Card key={item.change.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold text-lg">
                        {item.student?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{item.student?.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {getEntityTypeLabel(item.change.entityType)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Campo: <span className="font-medium">{fieldLabels[item.change.fieldName] || item.change.fieldName}</span>
                        </p>
                        <div className="flex items-center gap-2 text-sm mt-2">
                          <div className="bg-red-50 text-red-700 px-2 py-1 rounded">
                            {item.change.oldValue || '(vazio)'}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <div className="bg-green-50 text-green-700 px-2 py-1 rounded">
                            {item.change.newValue || '(vazio)'}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {format(new Date(item.change.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleReview(item)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Rejeitar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleReview(item)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma alteração pendente</h3>
              <p className="text-muted-foreground">
                Todas as solicitações de alteração foram revisadas.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Dialog de Revisão */}
        <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Revisar Alteração</DialogTitle>
            </DialogHeader>
            {selectedChange && (
              <div className="space-y-4 py-4">
                <div className="bg-accent/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedChange.student?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{getEntityTypeLabel(selectedChange.change.entityType)} - {fieldLabels[selectedChange.change.fieldName] || selectedChange.change.fieldName}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Alteração solicitada:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-xs text-red-600 mb-1">Valor atual</p>
                      <p className="text-sm">{selectedChange.change.oldValue || '(vazio)'}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-600 mb-1">Novo valor</p>
                      <p className="text-sm">{selectedChange.change.newValue || '(vazio)'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Observações (opcional)</label>
                  <Textarea
                    placeholder="Adicione uma observação sobre sua decisão..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setIsReviewDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleReject}
                disabled={rejectMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                {rejectMutation.isPending ? "Rejeitando..." : "Rejeitar"}
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleApprove}
                disabled={approveMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {approveMutation.isPending ? "Aprovando..." : "Aprovar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
