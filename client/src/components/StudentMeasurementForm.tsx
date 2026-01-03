import { useState } from "react";
import { MeasurementPhotos } from "@/components/GuidedPhotos";
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
  Heart,
  Clipboard,
  Upload,
  FileCheck,
  Calculator,
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
  // Bioimpedância
  bioBodyFat?: string | null;
  bioMuscleMass?: string | null;
  bioFatMass?: string | null;
  bioVisceralFat?: string | null;
  bioBasalMetabolism?: string | null;
  // Arquivo de bioimpedância (PDF/foto)
  bioFileUrl?: string | null;
  bioFileKey?: string | null;
  bioAiAnalysis?: string | null;
  // Adipômetro
  adipBodyFat?: string | null;
  adipMuscleMass?: string | null;
  adipFatMass?: string | null;
  // Dobras cutâneas
  tricepsFold?: string | null;
  subscapularFold?: string | null;
  suprailiacFold?: string | null;
  abdominalFold?: string | null;
  thighFold?: string | null;
  chestFold?: string | null;
  axillaryFold?: string | null;
}

interface StudentMeasurementFormProps {
  measurements: Measurement[];
  onUpdate: () => void;
  studentName?: string;
  studentGender?: string;
  studentHeight?: string;
}

export default function StudentMeasurementForm({
  measurements,
  onUpdate,
  studentName = "Aluno",
  studentGender = "male",
  studentHeight,
}: StudentMeasurementFormProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
  const [bioFileUploading, setBioFileUploading] = useState(false);
  const [bioFileUrl, setBioFileUrl] = useState<string | null>(null);
  const [bioFileKey, setBioFileKey] = useState<string | null>(null);
  const [bioAiAnalysis, setBioAiAnalysis] = useState<string | null>(null);
  const [measurementPhotos, setMeasurementPhotos] = useState<{ poseId: string; url: string }[]>([]);
  
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
    // Bioimpedância
    bioBodyFat: "",
    bioMuscleMass: "",
    bioFatMass: "",
    bioVisceralFat: "",
    bioBasalMetabolism: "",
    // Adipômetro
    adipBodyFat: "",
    adipMuscleMass: "",
    adipFatMass: "",
    // Dobras cutâneas
    tricepsFold: "",
    subscapularFold: "",
    suprailiacFold: "",
    abdominalFold: "",
    thighFold: "",
    chestFold: "",
    axillaryFold: "",
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
      // Bioimpedância
      bioBodyFat: "",
      bioMuscleMass: "",
      bioFatMass: "",
      bioVisceralFat: "",
      bioBasalMetabolism: "",
      // Adipômetro
      adipBodyFat: "",
      adipMuscleMass: "",
      adipFatMass: "",
      // Dobras cutâneas
      tricepsFold: "",
      subscapularFold: "",
      suprailiacFold: "",
      abdominalFold: "",
      thighFold: "",
      chestFold: "",
      axillaryFold: "",
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
      // Bioimpedância
      bioBodyFat: measurement.bioBodyFat || "",
      bioMuscleMass: measurement.bioMuscleMass || "",
      bioFatMass: measurement.bioFatMass || "",
      bioVisceralFat: measurement.bioVisceralFat || "",
      bioBasalMetabolism: measurement.bioBasalMetabolism || "",
      // Adipômetro
      adipBodyFat: measurement.adipBodyFat || "",
      adipMuscleMass: measurement.adipMuscleMass || "",
      adipFatMass: measurement.adipFatMass || "",
      // Dobras cutâneas
      tricepsFold: measurement.tricepsFold || "",
      subscapularFold: measurement.subscapularFold || "",
      suprailiacFold: measurement.suprailiacFold || "",
      abdominalFold: measurement.abdominalFold || "",
      thighFold: measurement.thighFold || "",
      chestFold: measurement.chestFold || "",
      axillaryFold: measurement.axillaryFold || "",
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
      // Bioimpedância
      bioBodyFat: formData.bioBodyFat || undefined,
      bioMuscleMass: formData.bioMuscleMass || undefined,
      bioFatMass: formData.bioFatMass || undefined,
      bioVisceralFat: formData.bioVisceralFat || undefined,
      bioBasalMetabolism: formData.bioBasalMetabolism || undefined,
      // Adipômetro
      adipBodyFat: formData.adipBodyFat || undefined,
      adipMuscleMass: formData.adipMuscleMass || undefined,
      adipFatMass: formData.adipFatMass || undefined,
      // Dobras cutâneas
      tricepsFold: formData.tricepsFold || undefined,
      subscapularFold: formData.subscapularFold || undefined,
      suprailiacFold: formData.suprailiacFold || undefined,
      abdominalFold: formData.abdominalFold || undefined,
      thighFold: formData.thighFold || undefined,
      chestFold: formData.chestFold || undefined,
      axillaryFold: formData.axillaryFold || undefined,
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

        <AccordionItem value="bioimpedancia">
          <AccordionTrigger className="text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Bioimpedância
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
              <p className="text-xs text-blue-700">
                <strong>Bioimpedância:</strong> Faça upload do PDF ou foto do exame para análise automática por IA, ou preencha manualmente.
              </p>
            </div>
            
            {/* Upload de Bioimpedância */}
            <div className="mb-4 p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/50">
              <div className="flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-blue-500" />
                <p className="text-sm font-medium text-blue-700">Upload do Exame de Bioimpedância</p>
                <p className="text-xs text-blue-600">PDF (até 10MB) ou Foto (até 5MB)</p>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  id="bioFile"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const maxSize = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
                    if (file.size > maxSize) {
                      toast.error(`Arquivo muito grande. Máximo: ${file.type === 'application/pdf' ? '10MB' : '5MB'}`);
                      return;
                    }
                    
                    setBioFileUploading(true);
                    try {
                      const formDataUpload = new FormData();
                      formDataUpload.append('file', file);
                      
                      const response = await fetch('/api/upload/bioimpedance', {
                        method: 'POST',
                        body: formDataUpload,
                      });
                      
                      if (!response.ok) throw new Error('Erro no upload');
                      
                      const result = await response.json();
                      setBioFileUrl(result.url);
                      setBioFileKey(result.key);
                      
                      if (result.aiAnalysis) {
                        setBioAiAnalysis(result.aiAnalysis);
                        // Preencher campos automaticamente se a IA extraiu dados
                        if (result.extractedData) {
                          const data = result.extractedData;
                          setFormData(prev => ({
                            ...prev,
                            bioBodyFat: data.bodyFat || prev.bioBodyFat,
                            bioMuscleMass: data.muscleMass || prev.bioMuscleMass,
                            bioFatMass: data.fatMass || prev.bioFatMass,
                            bioVisceralFat: data.visceralFat || prev.bioVisceralFat,
                            bioBasalMetabolism: data.basalMetabolism || prev.bioBasalMetabolism,
                          }));
                          toast.success('Dados extraídos automaticamente pela IA!');
                        }
                      }
                      
                      toast.success('Arquivo enviado com sucesso!');
                    } catch (error) {
                      toast.error('Erro ao enviar arquivo');
                    } finally {
                      setBioFileUploading(false);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('bioFile')?.click()}
                  disabled={bioFileUploading}
                  className="mt-2"
                >
                  {bioFileUploading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</>
                  ) : (
                    <><Upload className="h-4 w-4 mr-2" /> Selecionar Arquivo</>
                  )}
                </Button>
                {bioFileUrl && (
                  <div className="mt-2 flex items-center gap-2 text-green-600">
                    <FileCheck className="h-4 w-4" />
                    <span className="text-xs">Arquivo enviado</span>
                    <a href={bioFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline">Ver</a>
                  </div>
                )}
              </div>
            </div>
            
            {bioAiAnalysis && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-1">Análise da IA:</p>
                <p className="text-xs text-green-600 whitespace-pre-wrap">{bioAiAnalysis}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">% Gordura</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 15.5"
                  value={formData.bioBodyFat}
                  onChange={(e) => setFormData({ ...formData, bioBodyFat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Massa Muscular (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 35.0"
                  value={formData.bioMuscleMass}
                  onChange={(e) => setFormData({ ...formData, bioMuscleMass: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Massa Gorda (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 12.0"
                  value={formData.bioFatMass}
                  onChange={(e) => setFormData({ ...formData, bioFatMass: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Gordura Visceral</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 8"
                  value={formData.bioVisceralFat}
                  onChange={(e) => setFormData({ ...formData, bioVisceralFat: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">Metabolismo Basal (kcal)</Label>
                <Input
                  type="number"
                  step="1"
                  placeholder="Ex: 1800"
                  value={formData.bioBasalMetabolism}
                  onChange={(e) => setFormData({ ...formData, bioBasalMetabolism: e.target.value })}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="adipometro">
          <AccordionTrigger className="text-sm font-semibold">
            <div className="flex items-center gap-2">
              <Clipboard className="h-4 w-4 text-amber-500" />
              Adipômetro
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
              <p className="text-xs text-amber-700">
                <strong>Adipômetro:</strong> Preencha com os dados obtidos em avaliação com adipômetro profissional.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">% Gordura</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 15.5"
                  value={formData.adipBodyFat}
                  onChange={(e) => setFormData({ ...formData, adipBodyFat: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Massa Muscular (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 35.0"
                  value={formData.adipMuscleMass}
                  onChange={(e) => setFormData({ ...formData, adipMuscleMass: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Massa Gorda (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Ex: 12.0"
                  value={formData.adipFatMass}
                  onChange={(e) => setFormData({ ...formData, adipFatMass: e.target.value })}
                />
              </div>
            </div>
            
            {/* Dobras Cutâneas */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-3">Dobras Cutâneas (mm)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Tríceps</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 12"
                    value={formData.tricepsFold}
                    onChange={(e) => setFormData({ ...formData, tricepsFold: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Subescapular</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 15"
                    value={formData.subscapularFold}
                    onChange={(e) => setFormData({ ...formData, subscapularFold: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Supra-ilíaca</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 18"
                    value={formData.suprailiacFold}
                    onChange={(e) => setFormData({ ...formData, suprailiacFold: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Abdominal</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 22"
                    value={formData.abdominalFold}
                    onChange={(e) => setFormData({ ...formData, abdominalFold: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Coxa</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 20"
                    value={formData.thighFold}
                    onChange={(e) => setFormData({ ...formData, thighFold: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Peitoral</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 10"
                    value={formData.chestFold}
                    onChange={(e) => setFormData({ ...formData, chestFold: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Axilar Média</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 14"
                    value={formData.axillaryFold}
                    onChange={(e) => setFormData({ ...formData, axillaryFold: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Fotos de Evolução */}
      <div className="border-t pt-4">
        <MeasurementPhotos
          photos={measurementPhotos}
          onPhotosChange={setMeasurementPhotos}
        />
      </div>

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

      {/* Card de Cálculos Automáticos - visível fora do modal */}
      {sortedMeasurements.length > 0 && (() => {
        const latest = sortedMeasurements[0];
        const weight = latest.weight ? parseFloat(latest.weight) : null;
        const height = latest.height ? parseFloat(latest.height) : (studentHeight ? parseFloat(studentHeight) : null);
        const waist = latest.waist ? parseFloat(latest.waist) : null;
        const neck = latest.neck ? parseFloat(latest.neck) : null;
        const hip = latest.hip ? parseFloat(latest.hip) : null;
        
        // Cálculo do IMC
        const imc = weight && height ? (weight / Math.pow(height / 100, 2)).toFixed(1) : null;
        const imcCategory = imc ? (
          parseFloat(imc) < 18.5 ? 'Abaixo do peso' :
          parseFloat(imc) < 25 ? 'Peso normal' :
          parseFloat(imc) < 30 ? 'Sobrepeso' :
          parseFloat(imc) < 35 ? 'Obesidade I' :
          parseFloat(imc) < 40 ? 'Obesidade II' : 'Obesidade III'
        ) : null;
        
        // Cálculo do BF estimado (Fórmula da Marinha dos EUA)
        let estimatedBF: string | null = null;
        if (height && waist && neck) {
          if (studentGender === 'female' && hip) {
            const bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.22100 * Math.log10(height)) - 450;
            estimatedBF = Math.max(0, bf).toFixed(1);
          } else if (studentGender === 'male') {
            const bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
            estimatedBF = Math.max(0, bf).toFixed(1);
          }
        }
        
        // Usar BF da medição ou estimado
        const bodyFat = latest.bodyFat ? parseFloat(latest.bodyFat) : (estimatedBF ? parseFloat(estimatedBF) : null);
        const fatMass = weight && bodyFat ? ((weight * bodyFat) / 100).toFixed(1) : null;
        const leanMass = weight && bodyFat ? (weight - (weight * bodyFat) / 100).toFixed(1) : null;
        
        // Só mostrar se tiver pelo menos IMC ou BF
        if (!imc && !bodyFat) return null;
        
        return (
          <Card className="bg-gradient-to-br from-emerald-50/80 to-green-100/80 dark:from-emerald-950/30 dark:to-green-950/30 border-2 border-emerald-200 dark:border-emerald-800 rounded-2xl overflow-hidden">
            <CardHeader className="pb-3 pt-4">
              <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-lg">
                <Calculator className="h-5 w-5" />
                Cálculos Automáticos
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="grid grid-cols-2 gap-3">
                {/* IMC */}
                {imc && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                    <p className={`text-3xl font-bold ${parseFloat(imc) >= 25 ? 'text-emerald-600' : parseFloat(imc) < 18.5 ? 'text-blue-500' : 'text-emerald-600'}`}>
                      {imc}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">IMC</p>
                    <p className={`text-sm font-semibold mt-0.5 ${parseFloat(imc) >= 25 ? 'text-emerald-600' : parseFloat(imc) < 18.5 ? 'text-blue-500' : 'text-emerald-600'}`}>
                      {imcCategory}
                    </p>
                  </div>
                )}
                {/* BF Estimado */}
                {bodyFat && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                    <p className="text-3xl font-bold text-emerald-600">
                      {bodyFat.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">BF {estimatedBF && !latest.bodyFat ? 'Estimado' : ''}</p>
                    {estimatedBF && !latest.bodyFat && (
                      <p className="text-sm font-semibold text-emerald-600 mt-0.5">Fórmula Marinha EUA</p>
                    )}
                  </div>
                )}
                {/* Massa Gorda */}
                {fatMass && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                    <p className="text-3xl font-bold text-orange-500">
                      {fatMass} kg
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Massa Gorda Est.</p>
                  </div>
                )}
                {/* Massa Magra */}
                {leanMass && (
                  <div className="bg-white dark:bg-gray-900 rounded-xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                    <p className="text-3xl font-bold text-blue-500">
                      {leanMass} kg
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Massa Magra Est.</p>
                  </div>
                )}
              </div>
              {estimatedBF && !latest.bodyFat && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                  * BF estimado requer: altura, pescoço, cintura{studentGender === 'female' ? ', quadril' : ''}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })()}

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
        <DialogContent 
          className="max-w-md h-[85vh] flex flex-col p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-emerald-500" />
              Nova Medição
            </DialogTitle>
            <DialogDescription>
              Registre suas medidas corporais
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <MeasurementFormFields />
          </div>
          <div className="flex-shrink-0 border-t bg-background px-6 py-4 space-y-2">
            <Button
              onClick={handleSubmit}
              disabled={addMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {addMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent 
          className="max-w-md h-[85vh] flex flex-col p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-6 pt-6 pb-2 flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-500" />
              Editar Medição
            </DialogTitle>
            <DialogDescription>
              Atualize suas medidas corporais
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            <MeasurementFormFields />
          </div>
          <div className="flex-shrink-0 border-t bg-background px-6 py-4 space-y-2">
            <Button
              onClick={handleSubmit}
              disabled={updateMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
