import { jsPDF } from 'jspdf';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentData {
  name: string;
  email: string | null;
  phone: string | null;
  birthDate: Date | string | null;
  gender: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  notes: string | null;
  createdAt: Date | string;
  cpf?: string | null;
  maritalStatus?: string | null;
  hasChildren?: boolean | null;
}

interface AnamnesisData {
  objectives?: string | null;
  healthConditions?: string | null;
  medications?: string | null;
  injuries?: string | null;
  exerciseHistory?: string | null;
  lifestyle?: string | null;
  restrictions?: string | null;
  additionalNotes?: string | null;
  // Novos campos
  occupation?: string | null;
  sleepHours?: number | null;
  sleepQuality?: string | null;
  stressLevel?: string | null;
  mainGoal?: string | null;
  secondaryGoals?: string | null;
  targetWeight?: string | null;
  motivation?: string | null;
  mealsPerDay?: number | null;
  waterIntake?: string | null;
  dietRestrictions?: string | null;
  supplements?: string | null;
  exerciseExperience?: string | null;
  previousActivities?: string | null;
  availableDays?: string | null;
  preferredTime?: string | null;
  medicalHistory?: string | null;
  surgeries?: string | null;
  allergies?: string | null;
  observations?: string | null;
}

interface MeasurementData {
  date: Date | string;
  weight: string | null;
  height: string | null;
  bodyFat: string | null;
  muscleMass?: string | null;
  bmi?: string | null;
  neck?: string | null;
  chest: string | null;
  waist: string | null;
  hip: string | null;
  leftArm: string | null;
  rightArm: string | null;
  leftThigh: string | null;
  rightThigh: string | null;
  leftCalf: string | null;
  rightCalf: string | null;
  notes?: string | null;
}

interface WorkoutData {
  name: string;
  description: string | null;
  type: string | null;
  difficulty: string | null;
  exercises: any[];
}

// Função auxiliar para formatar data de forma segura
function safeFormatDate(dateValue: Date | string | null | undefined, formatStr: string = 'dd/MM/yyyy'): string | null {
  if (!dateValue) return null;
  
  try {
    let date: Date;
    
    if (typeof dateValue === 'string') {
      date = parseISO(dateValue);
      if (!isValid(date)) {
        date = new Date(dateValue);
      }
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return null;
    }
    
    if (!isValid(date)) {
      return null;
    }
    
    return format(date, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error, dateValue);
    return null;
  }
}

// Tradução de enums
const translateLifestyle = (value: string | null): string => {
  const map: Record<string, string> = {
    'sedentary': 'Sedentário',
    'light': 'Levemente ativo',
    'moderate': 'Moderadamente ativo',
    'active': 'Ativo',
    'very_active': 'Muito ativo',
  };
  return value ? map[value] || value : '-';
};

const translateStressLevel = (value: string | null): string => {
  const map: Record<string, string> = {
    'low': 'Baixo',
    'moderate': 'Moderado',
    'high': 'Alto',
    'very_high': 'Muito alto',
  };
  return value ? map[value] || value : '-';
};

const translateGoal = (value: string | null): string => {
  const map: Record<string, string> = {
    'weight_loss': 'Perda de peso',
    'muscle_gain': 'Ganho de massa muscular',
    'conditioning': 'Condicionamento físico',
    'health': 'Saúde e bem-estar',
    'rehabilitation': 'Reabilitação',
    'sports': 'Performance esportiva',
    'other': 'Outro',
  };
  return value ? map[value] || value : '-';
};

const translateExperience = (value: string | null): string => {
  const map: Record<string, string> = {
    'none': 'Nenhuma',
    'beginner': 'Iniciante',
    'intermediate': 'Intermediário',
    'advanced': 'Avançado',
  };
  return value ? map[value] || value : '-';
};

const translatePreferredTime = (value: string | null): string => {
  const map: Record<string, string> = {
    'morning': 'Manhã',
    'afternoon': 'Tarde',
    'evening': 'Noite',
    'flexible': 'Flexível',
  };
  return value ? map[value] || value : '-';
};

export async function generateStudentPDF(
  student: StudentData,
  anamnesis: AnamnesisData | null,
  measurements: MeasurementData[],
  workouts: WorkoutData[]
): Promise<Buffer> {
  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  // Função auxiliar para adicionar nova página se necessário
  const checkNewPage = (height: number = 20) => {
    if (yPos + height > 280) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Função auxiliar para adicionar seção
  const addSection = (title: string) => {
    checkNewPage(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Verde esmeralda
    doc.text(title, margin, yPos);
    yPos += 8;
    doc.setDrawColor(16, 185, 129);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
  };

  // Função auxiliar para adicionar campo
  const addField = (label: string, value: string | null | undefined) => {
    if (value && value !== '-') {
      checkNewPage(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${label}: `, margin, yPos);
      const labelWidth = doc.getTextWidth(`${label}: `);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(value, contentWidth - labelWidth);
      doc.text(lines, margin + labelWidth, yPos);
      yPos += lines.length * 5 + 3;
    }
  };

  // Função auxiliar para adicionar campo em duas colunas
  const addFieldRow = (label1: string, value1: string | null | undefined, label2: string, value2: string | null | undefined) => {
    checkNewPage(10);
    const colWidth = contentWidth / 2;
    
    if (value1) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label1}: `, margin, yPos);
      const labelWidth1 = doc.getTextWidth(`${label1}: `);
      doc.setFont('helvetica', 'normal');
      doc.text(value1, margin + labelWidth1, yPos);
    }
    
    if (value2) {
      doc.setFont('helvetica', 'bold');
      doc.text(`${label2}: `, margin + colWidth, yPos);
      const labelWidth2 = doc.getTextWidth(`${label2}: `);
      doc.setFont('helvetica', 'normal');
      doc.text(value2, margin + colWidth + labelWidth2, yPos);
    }
    
    if (value1 || value2) {
      yPos += 6;
    }
  };

  // ==================== CABEÇALHO ====================
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('FitPrime', margin, yPos);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Relatório Completo do Aluno', pageWidth - margin - 60, yPos);
  yPos += 10;
  
  doc.setFontSize(8);
  const currentDate = safeFormatDate(new Date(), "dd/MM/yyyy 'às' HH:mm") || 'Data não disponível';
  doc.text(`Gerado em: ${currentDate}`, pageWidth - margin - 60, yPos);
  yPos += 15;

  // ==================== DADOS PESSOAIS ====================
  addSection('Dados Pessoais');
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(student.name, margin, yPos);
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  addFieldRow('Email', student.email, 'Telefone', student.phone);
  addFieldRow('Data de Nascimento', safeFormatDate(student.birthDate), 'Gênero', student.gender === 'male' ? 'Masculino' : student.gender === 'female' ? 'Feminino' : student.gender);
  addFieldRow('CPF', student.cpf, 'Estado Civil', student.maritalStatus);
  addField('Endereço', student.address);
  addFieldRow('Contato de Emergência', student.emergencyContact, 'Tel. Emergência', student.emergencyPhone);
  addField('Observações', student.notes);
  addField('Cliente desde', safeFormatDate(student.createdAt));
  yPos += 5;

  // ==================== ANAMNESE COMPLETA ====================
  if (anamnesis) {
    addSection('Anamnese');
    
    // Estilo de Vida
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Estilo de Vida', margin, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    addFieldRow('Ocupação', anamnesis.occupation, 'Estilo de Vida', translateLifestyle(anamnesis.lifestyle || null));
    addFieldRow('Horas de Sono', anamnesis.sleepHours?.toString(), 'Nível de Estresse', translateStressLevel(anamnesis.stressLevel || null));
    yPos += 3;
    
    // Objetivos
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Objetivos', margin, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    addField('Objetivo Principal', translateGoal(anamnesis.mainGoal || null));
    addField('Objetivos Secundários', anamnesis.secondaryGoals);
    addFieldRow('Peso Meta', anamnesis.targetWeight ? `${anamnesis.targetWeight} kg` : null, 'Motivação', anamnesis.motivation);
    yPos += 3;
    
    // Saúde
    checkNewPage(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Histórico de Saúde', margin, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    addField('Histórico Médico', anamnesis.medicalHistory || anamnesis.healthConditions);
    addField('Medicamentos', anamnesis.medications);
    addField('Lesões', anamnesis.injuries);
    addField('Cirurgias', anamnesis.surgeries);
    addField('Alergias', anamnesis.allergies);
    yPos += 3;
    
    // Nutrição
    checkNewPage(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Nutrição', margin, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    addFieldRow('Refeições/dia', anamnesis.mealsPerDay?.toString(), 'Água/dia', anamnesis.waterIntake ? `${anamnesis.waterIntake}L` : null);
    addField('Restrições Alimentares', anamnesis.dietRestrictions || anamnesis.restrictions);
    addField('Suplementos', anamnesis.supplements);
    yPos += 3;
    
    // Exercícios
    checkNewPage(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Histórico de Exercícios', margin, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    addField('Experiência', translateExperience(anamnesis.exerciseExperience || null));
    addField('Atividades Anteriores', anamnesis.previousActivities || anamnesis.exerciseHistory);
    addFieldRow('Dias Disponíveis', anamnesis.availableDays, 'Horário Preferido', translatePreferredTime(anamnesis.preferredTime || null));
    yPos += 3;
    
    // Observações
    if (anamnesis.observations || anamnesis.additionalNotes) {
      addField('Observações', anamnesis.observations || anamnesis.additionalNotes);
    }
    yPos += 5;
  }

  // ==================== HISTÓRICO COMPLETO DE MEDIDAS ====================
  if (measurements.length > 0) {
    addSection('Histórico Completo de Medidas');
    
    // Resumo da evolução (primeira vs última medida)
    if (measurements.length > 1) {
      const firstMeasurement = measurements[measurements.length - 1];
      const lastMeasurement = measurements[0];
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129);
      doc.text('Resumo da Evolução', margin, yPos);
      yPos += 8;
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const calcVariation = (current: string | null, initial: string | null): string => {
        if (!current || !initial) return '-';
        const diff = parseFloat(current) - parseFloat(initial);
        const sign = diff >= 0 ? '+' : '';
        return `${sign}${diff.toFixed(1)}`;
      };
      
      const firstDate = safeFormatDate(firstMeasurement.date, 'dd/MM/yy') || '-';
      const lastDate = safeFormatDate(lastMeasurement.date, 'dd/MM/yy') || '-';
      
      doc.text(`Período: ${firstDate} até ${lastDate}`, margin, yPos);
      yPos += 6;
      
      // Tabela de evolução
      const evolutionData = [
        { label: 'Peso', initial: firstMeasurement.weight, current: lastMeasurement.weight, unit: 'kg' },
        { label: '% Gordura', initial: firstMeasurement.bodyFat, current: lastMeasurement.bodyFat, unit: '%' },
        { label: 'Cintura', initial: firstMeasurement.waist, current: lastMeasurement.waist, unit: 'cm' },
        { label: 'Quadril', initial: firstMeasurement.hip, current: lastMeasurement.hip, unit: 'cm' },
      ];
      
      // Cabeçalho da tabela
      doc.setFont('helvetica', 'bold');
      doc.text('Medida', margin, yPos);
      doc.text('Inicial', margin + 40, yPos);
      doc.text('Atual', margin + 70, yPos);
      doc.text('Variação', margin + 100, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      
      evolutionData.forEach(item => {
        if (item.initial || item.current) {
          doc.text(item.label, margin, yPos);
          doc.text(item.initial ? `${item.initial}${item.unit}` : '-', margin + 40, yPos);
          doc.text(item.current ? `${item.current}${item.unit}` : '-', margin + 70, yPos);
          const variation = calcVariation(item.current, item.initial);
          doc.text(variation !== '-' ? `${variation}${item.unit}` : '-', margin + 100, yPos);
          yPos += 5;
        }
      });
      yPos += 8;
    }
    
    // Lista de todas as medições
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Todas as Medições', margin, yPos);
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    measurements.forEach((m, index) => {
      checkNewPage(35);
      
      const measureDate = safeFormatDate(m.date, "dd/MM/yyyy") || 'Data não disponível';
      
      // Data da medição
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(16, 185, 129);
      doc.text(`${index + 1}. ${measureDate}`, margin, yPos);
      doc.setTextColor(0, 0, 0);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      // Composição corporal
      const compositionFields = [
        m.weight ? `Peso: ${m.weight}kg` : null,
        m.height ? `Altura: ${m.height}cm` : null,
        m.bmi ? `IMC: ${m.bmi}` : null,
        m.bodyFat ? `Gordura: ${m.bodyFat}%` : null,
        m.muscleMass ? `Massa Muscular: ${m.muscleMass}kg` : null,
      ].filter(Boolean);
      
      if (compositionFields.length > 0) {
        doc.text(compositionFields.join(' | '), margin + 5, yPos);
        yPos += 5;
      }
      
      // Circunferências
      const circumferenceFields = [
        m.neck ? `Pescoço: ${m.neck}` : null,
        m.chest ? `Peito: ${m.chest}` : null,
        m.waist ? `Cintura: ${m.waist}` : null,
        m.hip ? `Quadril: ${m.hip}` : null,
      ].filter(Boolean);
      
      if (circumferenceFields.length > 0) {
        doc.text(circumferenceFields.join(' | ') + ' cm', margin + 5, yPos);
        yPos += 5;
      }
      
      // Membros
      const limbFields = [
        m.rightArm ? `Braço D: ${m.rightArm}` : null,
        m.leftArm ? `Braço E: ${m.leftArm}` : null,
        m.rightThigh ? `Coxa D: ${m.rightThigh}` : null,
        m.leftThigh ? `Coxa E: ${m.leftThigh}` : null,
        m.rightCalf ? `Pant. D: ${m.rightCalf}` : null,
        m.leftCalf ? `Pant. E: ${m.leftCalf}` : null,
      ].filter(Boolean);
      
      if (limbFields.length > 0) {
        doc.text(limbFields.join(' | ') + ' cm', margin + 5, yPos);
        yPos += 5;
      }
      
      if (m.notes) {
        doc.setFont('helvetica', 'italic');
        doc.text(`Obs: ${m.notes}`, margin + 5, yPos);
        doc.setFont('helvetica', 'normal');
        yPos += 5;
      }
      
      yPos += 3;
    });
    yPos += 5;
  }

  // ==================== TREINOS ====================
  if (workouts.length > 0) {
    addSection('Treinos Ativos');
    
    workouts.forEach((workout, index) => {
      checkNewPage(30);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`${index + 1}. ${workout.name}`, margin, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      if (workout.description) {
        const descLines = doc.splitTextToSize(workout.description, contentWidth - 10);
        doc.text(descLines, margin + 5, yPos);
        yPos += descLines.length * 4 + 2;
      }
      
      if (workout.type || workout.difficulty) {
        doc.setTextColor(100, 100, 100);
        doc.text(`Tipo: ${workout.type || '-'} | Dificuldade: ${workout.difficulty || '-'}`, margin + 5, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;
      }
      
      // Exercícios
      if (workout.exercises && workout.exercises.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.text('Exercícios:', margin + 5, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        
        workout.exercises.forEach((exercise: any) => {
          checkNewPage(8);
          const exerciseText = `• ${exercise.name}${exercise.sets ? ` - ${exercise.sets}x${exercise.reps || ''}` : ''}${exercise.weight ? ` (${exercise.weight}kg)` : ''}`;
          doc.text(exerciseText, margin + 10, yPos);
          yPos += 5;
        });
      }
      
      yPos += 5;
    });
  }

  // ==================== RODAPÉ ====================
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 290, { align: 'center' });
    doc.text('FitPrime Manager - Relatório Confidencial', margin, 290);
  }

  // Retornar como Buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
