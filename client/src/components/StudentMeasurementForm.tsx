import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Plus,
  Scale,
  Ruler,
  Activity,
  Edit,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Share2,
} from "lucide-react";
import ShareProgressCard from "@/components/ShareProgressCard";

interface Measurement {
  id: number;
  measureDate: string | Date;
  weight?: string | null;
  height?: string | null;
  bodyFat?: string | null;
  muscleMass?: string | null;
  bmi?: string | null;
  chest?: string | null;
  waist?: string | null;
  hip?: string | null;
  rightArm?: string | null;
  leftArm?: string | null;
  rightThigh?: string | null;
  leftThigh?: string | null;
  rightCalf?: string | null;
  leftCalf?: string | null;
  neck?: string | null;
  notes?: string | null;
}

interface StudentMeasurementFormProps {
  measurements: Measurement[];
  onUpdate: () => void;
  studentName?: string;
}

export default function StudentMeasurementForm({
  measurements,
  onUpdate,
  studentName = "Aluno",
}: StudentMeasurementFormProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [formData, setFormData] = useState({
    measureDate: format(new Date(), "yyyy-MM-dd"),
    weight: "",
    height: "",
    bodyFat: "",
    muscleMass: "",
    neck: "",
    chest: "",
    waist: "",
    hip: "",
    rightArm: "",
    leftArm: "",
    rightThigh: "",
    leftThigh: "",
    rightCalf: "",
    leftCalf: "",
    notes: "",
  });

  const addMutation = trpc.studentPortal.addMeasurement.useMutation({
    onSuccess: () => {
      toast.success("Medidas registradas com sucesso!");
      setIsAddDialogOpen(false);
      resetForm();
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registrar medidas");
    },
  });

  const updateMutation = trpc.studentPortal.updateMeasurement.useMutation({
    onSuccess: () => {
      toast.success("Medidas atualizadas com sucesso!");
      setIsEditDialogOpen(false);
      setEditingMeasurement(null);
      resetForm();
      onUpdate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar medidas");
    },
  });

  const resetForm = () => {
    setFormData({
      measureDate: format(new Date(), "yyyy-MM-dd"),
      weight: "",
      height: "",
      bodyFat: "",
      muscleMass: "",
      neck: "",
      chest: "",
      waist: "",
      hip: "",
      rightArm: "",
      leftArm: "",
      rightThigh: "",
      leftThigh: "",
      rightCalf: "",
      leftCalf: "",
      notes: "",
    });
  };

  const handleEdit = (measurement: Measurement) => {
    setEditingMeasurement(measurement);
    setFormData({
      measureDate: format(new Date(measurement.measureDate), "yyyy-MM-dd"),
      weight: measurement.weight || "",
      height: measurement.height || "",
      bodyFat: measurement.bodyFat || "",
      muscleMass: measurement.muscleMass || "",
      neck: measurement.neck || "",
      chest: measurement.chest || "",
      waist: measurement.waist || "",
      hip: measurement.hip || "",
      rightArm: measurement.rightArm || "",
      leftArm: measurement.leftArm || "",
      rightThigh: measurement.rightThigh || "",
      leftThigh: measurement.leftThigh || "",
      rightCalf: measurement.rightCalf || "",
      leftCalf: measurement.leftCalf || "",
      notes: measurement.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.measureDate) {
      toast.error("Selecione a data da medição");
      return;
    }

    const data = {
      measureDate: formData.measureDate,
      weight: formData.weight || undefined,
      height: formData.height || undefined,
      bodyFat: formData.bodyFat || undefined,
      muscleMass: formData.muscleMass || undefined,
      neck: formData.neck || undefined,
      chest: formData.chest || undefined,
      waist: formData.waist || undefined,
      hip: formData.hip || undefined,
      rightArm: formData.rightArm || undefined,
      leftArm: formData.leftArm || undefined,
      rightThigh: formData.rightThigh || undefined,
      leftThigh: formData.leftThigh || undefined,
      rightCalf: formData.rightCalf || undefined,
      leftCalf: formData.leftCalf || undefined,
      notes: formData.notes || undefined,
    };

    if (editingMeasurement) {
      updateMutation.mutate({ id: editingMeasurement.id, ...data });
    } else {
      addMutation.mutate(data);
    }
  };

  // Ordenar medidas por data (mais recente primeiro)
  const sortedMeasurements = [...measurements].sort(
    (a, b) => new Date(b.measureDate).getTime() - new Date(a.measureDate).getTime()
  );

  // Calcular variação entre medidas
  const getVariation = (current: string | null | undefined, previous: string | null | undefined) => {
    if (!current || !previous) return null;
    const diff = parseFloat(current) - parseFloat(previous);
    return diff;
  };

  const getTrendIcon = (variation: number | null, inverse = false) => {
    if (variation === null) return null;
    const isPositive = inverse ? variation < 0 : variation > 0;
    const isNegative = inverse ? variation > 0 : variation < 0;
    
    if (isPositive) return <TrendingUp className="h-3 w-3 text-green-500" />;
    if (isNegative) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const MeasurementFormFields = () => (
    <div className="space-y-6">
      {/* Data */}
      <div className="space-y-2">
        <Label>Data da Medição</Label>
        <Input
          type="date"
          value={formData.measureDate}
          onChange={(e) => setFormData({ ...formData, measureDate: e.target.value })}
        />
      </div>

      {/* Medidas Principais */}
      <Accordion type="multiple" defaultValue={["principais"]} className="w-full">
        <AccordionItem value="principais">
          <AccordionTrigger className="text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-500" />
              Medidas Principais
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs">Peso (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 75.5"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Altura (cm)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 175"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">% Gordura</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 18.5"
                  value={formData.bodyFat}
                  onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Massa Magra (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 62.0"
                  value={formData.muscleMass}
                  onChange={(e) => setFormData({ ...formData, muscleMass: e.target.value })}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="circunferencias">
          <AccordionTrigger className="text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Ruler className="h-4 w-4 text-blue-500" />
              Circunferências (cm)
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs">Pescoço</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 38"
                  value={formData.neck}
                  onChange={(e) => setFormData({ ...formData, neck: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Peito</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 100"
                  value={formData.chest}
                  onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Cintura</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 85"
                  value={formData.waist}
                  onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Quadril</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 95"
                  value={formData.hip}
                  onChange={(e) => setFormData({ ...formData, hip: e.target.value })}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="membros">
          <AccordionTrigger className="text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-500" />
              Membros (cm)
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs">Braço Direito</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 35"
                  value={formData.rightArm}
                  onChange={(e) => setFormData({ ...formData, rightArm: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Braço Esquerdo</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 34.5"
                  value={formData.leftArm}
                  onChange={(e) => setFormData({ ...formData, leftArm: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Coxa Direita</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 58"
                  value={formData.rightThigh}
                  onChange={(e) => setFormData({ ...formData, rightThigh: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Coxa Esquerda</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 57.5"
                  value={formData.leftThigh}
                  onChange={(e) => setFormData({ ...formData, leftThigh: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Panturrilha Direita</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 38"
                  value={formData.rightCalf}
                  onChange={(e) => setFormData({ ...formData, rightCalf: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Panturrilha Esquerda</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 37.5"
                  value={formData.leftCalf}
                  onChange={(e) => setFormData({ ...formData, leftCalf: e.target.value })}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Observações */}
      <div className="space-y-2">
        <Label>Observações</Label>
        <Textarea
          placeholder="Anotações sobre a medição..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">      {/* Botões de Ação */}
      <div className="flex justify-between items-center">
        {/* Botão Compartilhar - só mostra se tiver medidas */}
        {sortedMeasurements.length >= 2 && (() => {
          const latest = sortedMeasurements[0];
          const oldest = sortedMeasurements[sortedMeasurements.length - 1];
          const weightChange = latest.weight && oldest.weight 
            ? parseFloat(latest.weight) - parseFloat(oldest.weight) 
            : undefined;
          const bodyFatChange = latest.bodyFat && oldest.bodyFat
            ? parseFloat(latest.bodyFat) - parseFloat(oldest.bodyFat)
            : undefined;
          const waistChange = latest.waist && oldest.waist
            ? parseFloat(latest.waist) - parseFloat(oldest.waist)
            : undefined;
          
          return (
            <ShareProgressCard
              context="measurements"
              studentName={studentName}
              data={{
                currentWeight: latest.weight ? parseFloat(latest.weight) : undefined,
                initialWeight: oldest.weight ? parseFloat(oldest.weight) : undefined,
                weightChange,
                currentBodyFat: latest.bodyFat ? parseFloat(latest.bodyFat) : undefined,
                initialBodyFat: oldest.bodyFat ? parseFloat(oldest.bodyFat) : undefined,
                bodyFatChange,
                waistChange,
                period: `${sortedMeasurements.length} avaliações`,
              }}
            />
          );
        })()}
        <div className="flex-1" />
        <Button onClick={() => setIsAddDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Medição
        </Button>
      </div>

      {/* Lista de Medidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-emerald-500" />
            Histórico de Medidas
          </CardTitle>
          <CardDescription>
            Registre suas medidas regularmente para acompanhar sua evolução
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedMeasurements.length > 0 ? (
            <div className="space-y-4">
              {sortedMeasurements.map((measurement, index) => {
                const previousMeasurement = sortedMeasurements[index + 1];
                const weightVariation = getVariation(measurement.weight, previousMeasurement?.weight);
                const bodyFatVariation = getVariation(measurement.bodyFat, previousMeasurement?.bodyFat);
                const waistVariation = getVariation(measurement.waist, previousMeasurement?.waist);

                return (
                  <div
                    key={measurement.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {format(new Date(measurement.measureDate), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {measurement.weight && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <Scale className="h-3 w-3" />
                                {measurement.weight} kg
                                {getTrendIcon(weightVariation, true)}
                              </Badge>
                            )}
                            {measurement.bodyFat && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                % Gordura: {measurement.bodyFat}%
                                {getTrendIcon(bodyFatVariation, true)}
                              </Badge>
                            )}
                            {measurement.waist && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                Cintura: {measurement.waist} cm
                                {getTrendIcon(waistVariation, true)}
                              </Badge>
                            )}
                            {measurement.bmi && (
                              <Badge variant="outline" className="text-xs">
                                IMC: {measurement.bmi}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(measurement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Ruler className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma medida registrada</p>
              <p className="text-sm text-muted-foreground">
                Clique em "Nova Medição" para começar a acompanhar sua evolução
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Adicionar */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              Nova Medição
            </DialogTitle>
            <DialogDescription>
              Registre suas medidas corporais
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[60vh] pr-4">
            <MeasurementFormFields />
          </ScrollArea>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={addMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Editar Medição
            </DialogTitle>
            <DialogDescription>
              Atualize suas medidas corporais
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[60vh] pr-4">
            <MeasurementFormFields />
          </ScrollArea>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
