import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  FileText,
  ArrowRight,
  AlertTriangle,
  Dumbbell,
  Lightbulb,
  Scale,
  Repeat,
  Plus,
  Minus,
  MessageSquare
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

const suggestionTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
  weight_change: { label: "Alterar Carga", icon: Scale, color: "text-blue-600" },
  reps_change: { label: "Alterar Repetições", icon: Repeat, color: "text-purple-600" },
  exercise_change: { label: "Trocar Exercício", icon: Dumbbell, color: "text-orange-600" },
  add_exercise: { label: "Adicionar Exercício", icon: Plus, color: "text-green-600" },
  remove_exercise: { label: "Remover Exercício", icon: Minus, color: "text-red-600" },
  note: { label: "Observação", icon: MessageSquare, color: "text-gray-600" },
  other: { label: "Outra Sugestão", icon: Lightbulb, color: "text-amber-600" },
};

export default function PendingChanges() {
  const utils = trpc.useUtils();
  const [selectedChange, setSelectedChange] = useState<any>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  
  const { data: changes, isLoading } = trpc.pendingChanges.list.useQuery();
  const { data: suggestions, isLoading: isLoadingSuggestions } = trpc.trainingDiary.suggestions.useQuery();
  
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
  
  const approveSuggestionMutation = trpc.trainingDiary.approveSuggestion.useMutation({
    onSuccess: () => {
      toast.success("Sugestão aprovada com sucesso!");
      utils.trainingDiary.suggestions.invalidate();
      setIsSuggestionDialogOpen(false);
      setSelectedSuggestion(null);
      setReviewNotes("");
    },
    onError: (error) => {
      toast.error("Erro ao aprovar: " + error.message);
    },
  });
  
  const rejectSuggestionMutation = trpc.trainingDiary.rejectSuggestion.useMutation({
    onSuccess: () => {
      toast.success("Sugestão rejeitada!");
      utils.trainingDiary.suggestions.invalidate();
      setIsSuggestionDialogOpen(false);
      setSelectedSuggestion(null);
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
  
  const handleSuggestionReview = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    setReviewNotes("");
    setIsSuggestionDialogOpen(true);
  };
  
  const handleApprove = () => {
    if (!selectedChange) return;
    approveMutation.mutate({ id: selectedChange.change.id, reviewNotes: reviewNotes || undefined });
  };
  
  const handleReject = () => {
    if (!selectedChange) return;
    rejectMutation.mutate({ id: selectedChange.change.id, reviewNotes: reviewNotes || undefined });
  };
  
  const handleApproveSuggestion = () => {
    if (!selectedSuggestion) return;
    approveSuggestionMutation.mutate({ id: selectedSuggestion.id, reviewNotes: reviewNotes || undefined });
  };
  
  const handleRejectSuggestion = () => {
    if (!selectedSuggestion) return;
    rejectSuggestionMutation.mutate({ id: selectedSuggestion.id, reviewNotes: reviewNotes || undefined });
  };
  
  const getEntityTypeLabel = (type: string) => {
    switch (type) {
      case 'student': return 'Dados Pessoais';
      case 'anamnesis': return 'Anamnese';
      case 'measurement': return 'Medidas';
      case 'workout': return 'Treino';
      default: return type;
    }
  };

  const pendingChangesCount = changes?.length || 0;
  const pendingSuggestionsCount = suggestions?.length || 0;
  const totalPending = pendingChangesCount + pendingSuggestionsCount;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Alterações Pendentes
            {totalPending > 0 && (
              <Badge variant="destructive" className="ml-2">{totalPending}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            Revise e aprove as alterações e sugestões dos alunos
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="changes" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="changes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Alterações
              {pendingChangesCount > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingChangesCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Sugestões de Treino
              {pendingSuggestionsCount > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingSuggestionsCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Aba de Alterações de Dados */}
          <TabsContent value="changes" className="mt-6">
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
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                            {item.student?.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold">{item.student?.name}</p>
                              <Badge variant="outline" className="text-xs">
                                {getEntityTypeLabel(item.change.entityType)}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Campo: <span className="font-medium">{fieldLabels[item.change.fieldName] || item.change.fieldName}</span>
                            </p>
                            {/* Comparativo Visual */}
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-red-600 uppercase tracking-wide">Valor Atual</p>
                                  <div className="bg-white border-2 border-red-200 rounded-lg p-3 min-h-[60px]">
                                    <p className="text-sm text-red-800 font-medium break-words">
                                      {item.change.oldValue || <span className="text-gray-400 italic">(vazio)</span>}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-green-600 uppercase tracking-wide">Novo Valor</p>
                                  <div className="bg-white border-2 border-green-200 rounded-lg p-3 min-h-[60px]">
                                    <p className="text-sm text-green-800 font-medium break-words">
                                      {item.change.newValue || <span className="text-gray-400 italic">(vazio)</span>}
                                    </p>
                                  </div>
                                </div>
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
          </TabsContent>

          {/* Aba de Sugestões de Treino */}
          <TabsContent value="suggestions" className="mt-6">
            {isLoadingSuggestions ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : suggestions && suggestions.length > 0 ? (
              <div className="space-y-4">
                {suggestions.map((suggestion: any) => {
                  const typeInfo = suggestionTypeLabels[suggestion.suggestionType] || suggestionTypeLabels.other;
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center text-white flex-shrink-0">
                              <Lightbulb className="h-6 w-6" />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold">{suggestion.studentName || 'Aluno'}</p>
                                <Badge variant="outline" className={`text-xs ${typeInfo.color}`}>
                                  <TypeIcon className="h-3 w-3 mr-1" />
                                  {typeInfo.label}
                                </Badge>
                              </div>
                              
                              {suggestion.exerciseName && (
                                <p className="text-sm text-muted-foreground">
                                  Exercício: <span className="font-medium">{suggestion.exerciseName}</span>
                                </p>
                              )}
                              
                              {suggestion.workoutName && (
                                <p className="text-sm text-muted-foreground">
                                  Treino: <span className="font-medium">{suggestion.workoutName}</span>
                                </p>
                              )}
                              
                              {/* Sugestão */}
                              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                {suggestion.originalValue && (
                                  <div className="mb-2">
                                    <p className="text-xs font-medium text-gray-600 uppercase">Valor Atual</p>
                                    <p className="text-sm text-gray-800">{suggestion.originalValue}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-medium text-amber-700 uppercase">Sugestão</p>
                                  <p className="text-sm text-amber-900 font-medium">{suggestion.suggestedValue}</p>
                                </div>
                                {suggestion.reason && (
                                  <div className="mt-2 pt-2 border-t border-amber-200">
                                    <p className="text-xs font-medium text-gray-600 uppercase">Motivo</p>
                                    <p className="text-sm text-gray-700 italic">{suggestion.reason}</p>
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {format(new Date(suggestion.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleSuggestionReview(suggestion)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleSuggestionReview(suggestion)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Lightbulb className="h-16 w-16 text-amber-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma sugestão pendente</h3>
                  <p className="text-muted-foreground">
                    Seus alunos ainda não enviaram sugestões de alteração nos treinos.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog de Revisão de Alterações */}
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
                
                <div className="space-y-3">
                  <p className="text-sm font-medium">Comparação de valores:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500"></div>
                        <p className="text-xs font-semibold text-red-600 uppercase">Valor Atual</p>
                      </div>
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 min-h-[80px]">
                        <p className="text-sm text-red-900 font-medium break-words">
                          {selectedChange.change.oldValue || <span className="text-gray-400 italic">(vazio)</span>}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                        <p className="text-xs font-semibold text-green-600 uppercase">Novo Valor</p>
                      </div>
                      <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 min-h-[80px]">
                        <p className="text-sm text-green-900 font-medium break-words">
                          {selectedChange.change.newValue || <span className="text-gray-400 italic">(vazio)</span>}
                        </p>
                      </div>
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

        {/* Dialog de Revisão de Sugestões de Treino */}
        <Dialog open={isSuggestionDialogOpen} onOpenChange={setIsSuggestionDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                Revisar Sugestão de Treino
              </DialogTitle>
            </DialogHeader>
            {selectedSuggestion && (
              <div className="space-y-4 py-4">
                <div className="bg-amber-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedSuggestion.studentName || 'Aluno'}</span>
                  </div>
                  {selectedSuggestion.workoutName && (
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedSuggestion.workoutName}</span>
                    </div>
                  )}
                  {selectedSuggestion.exerciseName && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>Exercício: {selectedSuggestion.exerciseName}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const typeInfo = suggestionTypeLabels[selectedSuggestion.suggestionType] || suggestionTypeLabels.other;
                      const TypeIcon = typeInfo.icon;
                      return (
                        <>
                          <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                          <span className={`text-sm font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                        </>
                      );
                    })()}
                  </div>
                  
                  {selectedSuggestion.originalValue && (
                    <div className="bg-gray-50 border rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600 uppercase mb-1">Valor Atual</p>
                      <p className="text-sm">{selectedSuggestion.originalValue}</p>
                    </div>
                  )}
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-700 uppercase mb-1">Sugestão do Aluno</p>
                    <p className="text-sm font-medium text-amber-900">{selectedSuggestion.suggestedValue}</p>
                  </div>
                  
                  {selectedSuggestion.reason && (
                    <div className="bg-gray-50 border rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-600 uppercase mb-1">Motivo</p>
                      <p className="text-sm italic text-gray-700">{selectedSuggestion.reason}</p>
                    </div>
                  )}
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
                onClick={() => setIsSuggestionDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="outline"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleRejectSuggestion}
                disabled={rejectSuggestionMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1" />
                {rejectSuggestionMutation.isPending ? "Rejeitando..." : "Rejeitar"}
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={handleApproveSuggestion}
                disabled={approveSuggestionMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {approveSuggestionMutation.isPending ? "Aprovando..." : "Aprovar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
