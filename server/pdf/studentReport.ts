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
}

interface AnamnesisData {
  objectives: string | null;
  healthConditions: string | null;
  medications: string | null;
  injuries: string | null;
  exerciseHistory: string | null;
  lifestyle: string | null;
  restrictions: string | null;
  additionalNotes: string | null;
}

interface MeasurementData {
  date: Date | string;
  weight: string | null;
  height: string | null;
  bodyFat: string | null;
  chest: string | null;
  waist: string | null;
  hip: string | null;
  leftArm: string | null;
  rightArm: string | null;
  leftThigh: string | null;
  rightThigh: string | null;
  leftCalf: string | null;
  rightCalf: string | null;
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
      // Tenta parsear a string de data
      date = parseISO(dateValue);
      
      // Se não for válido, tenta criar Date diretamente
      if (!isValid(date)) {
        date = new Date(dateValue);
      }
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      return null;
    }
    
    // Verifica se a data é válida
    if (!isValid(date)) {
      return null;
    }
    
    return format(date, formatStr, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error, dateValue);
    return null;
  }
}

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
    if (value) {
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

  // ==================== CABEÇALHO ====================
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('FitPrime', margin, yPos);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Relatório do Aluno', pageWidth - margin - 50, yPos);
  yPos += 10;
  
  doc.setFontSize(8);
  const currentDate = safeFormatDate(new Date(), "dd/MM/yyyy 'às' HH:mm") || 'Data não disponível';
  doc.text(`Gerado em: ${currentDate}`, pageWidth - margin - 50, yPos);
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
  
  addField('Email', student.email);
  addField('Telefone', student.phone);
  addField('Data de Nascimento', safeFormatDate(student.birthDate));
  addField('Gênero', student.gender === 'male' ? 'Masculino' : student.gender === 'female' ? 'Feminino' : student.gender);
  addField('Endereço', student.address);
  addField('Contato de Emergência', student.emergencyContact);
  addField('Telefone de Emergência', student.emergencyPhone);
  addField('Observações', student.notes);
  addField('Cliente desde', safeFormatDate(student.createdAt));
  yPos += 5;

  // ==================== ANAMNESE ====================
  if (anamnesis) {
    addSection('Anamnese');
    addField('Objetivos', anamnesis.objectives);
    addField('Condições de Saúde', anamnesis.healthConditions);
    addField('Medicamentos', anamnesis.medications);
    addField('Lesões', anamnesis.injuries);
    addField('Histórico de Exercícios', anamnesis.exerciseHistory);
    addField('Estilo de Vida', anamnesis.lifestyle);
    addField('Restrições', anamnesis.restrictions);
    addField('Observações Adicionais', anamnesis.additionalNotes);
    yPos += 5;
  }

  // ==================== MEDIDAS ====================
  if (measurements.length > 0) {
    addSection('Histórico de Medidas');
    
    // Última medida
    const lastMeasurement = measurements[0];
    doc.setFont('helvetica', 'bold');
    const measurementDate = safeFormatDate(lastMeasurement.date) || 'Data não disponível';
    doc.text(`Última avaliação: ${measurementDate}`, margin, yPos);
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    
    // Tabela de medidas
    const measurementFields = [
      { label: 'Peso', value: lastMeasurement.weight, unit: 'kg' },
      { label: 'Altura', value: lastMeasurement.height, unit: 'cm' },
      { label: '% Gordura', value: lastMeasurement.bodyFat, unit: '%' },
      { label: 'Peitoral', value: lastMeasurement.chest, unit: 'cm' },
      { label: 'Cintura', value: lastMeasurement.waist, unit: 'cm' },
      { label: 'Quadril', value: lastMeasurement.hip, unit: 'cm' },
      { label: 'Braço Esq.', value: lastMeasurement.leftArm, unit: 'cm' },
      { label: 'Braço Dir.', value: lastMeasurement.rightArm, unit: 'cm' },
      { label: 'Coxa Esq.', value: lastMeasurement.leftThigh, unit: 'cm' },
      { label: 'Coxa Dir.', value: lastMeasurement.rightThigh, unit: 'cm' },
      { label: 'Panturrilha Esq.', value: lastMeasurement.leftCalf, unit: 'cm' },
      { label: 'Panturrilha Dir.', value: lastMeasurement.rightCalf, unit: 'cm' },
    ];
    
    let col = 0;
    measurementFields.forEach((field, index) => {
      if (field.value) {
        const xPos = margin + (col * 60);
        doc.text(`${field.label}: ${field.value}${field.unit}`, xPos, yPos);
        col++;
        if (col >= 3) {
          col = 0;
          yPos += 6;
          checkNewPage(10);
        }
      }
    });
    if (col > 0) yPos += 6;
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
