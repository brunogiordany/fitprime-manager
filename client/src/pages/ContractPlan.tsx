import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Calendar, Clock, Users, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DAYS_OF_WEEK = [
  { value: 0, label: "Domingo", short: "Dom" },
  { value: 1, label: "Segunda", short: "Seg" },
  { value: 2, label: "Terça", short: "Ter" },
  { value: 3, label: "Quarta", short: "Qua" },
  { value: 4, label: "Quinta", short: "Qui" },
  { value: 5, label: "Sexta", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
];

export default function ContractPlan() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/alunos/:studentId/contratar");
  const studentId = params?.studentId ? parseInt(params.studentId) : null;
  

  const [formData, setFormData] = useState({
    planId: "",
    startDate: format(new Date(), "yyyy-MM-dd"),
    trainingDays: [] as number[],
    defaultTime: "08:00",
    weeksToSchedule: 4,
    notes: "",
  });

  const { data: student, isLoading: loadingStudent } = trpc.students.get.useQuery(
    { id: studentId! },
    { enabled: !!studentId }
  );

  const { data: plans, isLoading: loadingPlans } = trpc.plans.list.useQuery();

  const createPackageMutation = trpc.packages.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Plano contratado! ${data.sessionsCreated} sessões foram agendadas automaticamente.`);
      setLocation(`/alunos/${studentId}`);
    },
    onError: (error) => {
      toast.error(`Erro ao contratar plano: ${error.message}`);
    },
  });

  const selectedPlan = plans?.find(p => p.id.toString() === formData.planId);

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      trainingDays: prev.trainingDays.includes(day)
        ? prev.trainingDays.filter(d => d !== day)
        : [...prev.trainingDays, day].sort((a, b) => a - b)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!studentId || !formData.planId) {
      toast.error("Selecione um plano");
      return;
    }

    if (formData.trainingDays.length === 0) {
      toast.error("Selecione pelo menos um dia de treino");
      return;
    }

    createPackageMutation.mutate({
      studentId,
      planId: parseInt(formData.planId),
      startDate: formData.startDate,
      price: selectedPlan?.price?.toString() || "0",
      trainingDays: formData.trainingDays,
      defaultTime: formData.defaultTime,
      weeksToSchedule: formData.weeksToSchedule,
      notes: formData.notes || undefined,
    });
  };

  if (loadingStudent || loadingPlans) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Aluno não encontrado</p>
      </div>
    );
  }

  const totalSessions = formData.trainingDays.length * formData.weeksToSchedule;

  return (
    <div className="container max-w-2xl py-8">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => setLocation(`/alunos/${studentId}`)}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para {student.name}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contratar Plano
          </CardTitle>
          <CardDescription>
            Contrate um plano para {student.name} e agende automaticamente as sessões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção do Plano */}
            <div className="space-y-2">
              <Label>Plano *</Label>
              <Select
                value={formData.planId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, planId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans?.filter(p => p.isActive).map((plan) => (
                    <SelectItem key={plan.id} value={plan.id.toString()}>
                      {plan.name} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(plan.price))}
                      {plan.sessionsPerWeek && ` (${plan.sessionsPerWeek}x/semana)`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlan && (
                <p className="text-sm text-muted-foreground">
                  {selectedPlan.description || `${selectedPlan.sessionsPerWeek || 0}x por semana, ${selectedPlan.sessionDuration || 60} min por sessão`}
                </p>
              )}
            </div>

            {/* Data de Início */}
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            {/* Dias de Treino */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Dias de Treino *
              </Label>
              <p className="text-sm text-muted-foreground">
                Selecione os dias da semana que o aluno vai treinar
              </p>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    variant={formData.trainingDays.includes(day.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDay(day.value)}
                    className="min-w-[60px]"
                  >
                    {day.short}
                  </Button>
                ))}
              </div>
              {formData.trainingDays.length > 0 && (
                <p className="text-sm text-emerald-600">
                  {formData.trainingDays.length}x por semana: {formData.trainingDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(", ")}
                </p>
              )}
            </div>

            {/* Horário Padrão */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horário Padrão *
              </Label>
              <Input
                type="time"
                value={formData.defaultTime}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultTime: e.target.value }))}
              />
              <p className="text-sm text-muted-foreground">
                Todas as sessões serão agendadas neste horário
              </p>
            </div>

            {/* Semanas para Agendar */}
            <div className="space-y-2">
              <Label>Semanas para Agendar</Label>
              <Select
                value={formData.weeksToSchedule.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, weeksToSchedule: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 semanas</SelectItem>
                  <SelectItem value="4">4 semanas (1 mês)</SelectItem>
                  <SelectItem value="8">8 semanas (2 meses)</SelectItem>
                  <SelectItem value="12">12 semanas (3 meses)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações sobre o contrato..."
                rows={3}
              />
            </div>

            {/* Resumo */}
            {formData.trainingDays.length > 0 && (
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Resumo do Agendamento</span>
                  </div>
                  <ul className="text-sm text-emerald-600 space-y-1">
                    <li>• {totalSessions} sessões serão criadas automaticamente</li>
                    <li>• {formData.trainingDays.length}x por semana ({formData.trainingDays.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.short).join(", ")})</li>
                    <li>• Horário: {formData.defaultTime}</li>
                    <li>• Período: {formData.weeksToSchedule} semanas a partir de {format(new Date(formData.startDate + 'T12:00:00'), "dd/MM/yyyy", { locale: ptBR })}</li>
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setLocation(`/alunos/${studentId}`)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={createPackageMutation.isPending || !formData.planId || formData.trainingDays.length === 0}
              >
                {createPackageMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Contratando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Contratar e Agendar
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
