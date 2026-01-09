import { jsPDF } from 'jspdf';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentData {
  name: string;
  email: string | null;
  phone: string | null;
  birthDate: Date | string | null;
  gender: string | null;
}

interface MeasurementData {
  weight?: string | null;
  height?: string | null;
  bodyFat?: string | null;
}

interface AnamnesisData {
  mainGoal?: string | null;
  targetWeight?: string | null;
  lifestyle?: string | null;
  weeklyFrequency?: number | null;
  sessionDuration?: number | null;
  doesCardio?: boolean | null;
}

interface WorkoutDay {
  dayName: string;
  exercises: {
    name: string;
    muscleGroup: string | null;
    sets: number | null;
    reps: string | null;
    weight: string | null;
    restTime: number | null;
    notes: string | null;
  }[];
}

interface WorkoutData {
  name: string;
  description: string | null;
  type: string | null;
  difficulty: string | null;
  days: WorkoutDay[];
}

interface CardioRecommendation {
  type: string;
  duration: number;
  frequency: string;
  intensity: string;
  notes: string;
}

interface NutritionRecommendation {
  tmb: number;
  tdee: number;
  targetCalories: number;
  goalAdjustment: number;
  activityLevel: string;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    proteinPerKg: number;
  };
  weightGoal?: {
    current: number;
    target: number;
    difference: number;
    weeksEstimate: number;
  };
}

interface PersonalInfo {
  businessName: string | null;
  logoUrl: string | null;
}

// Fórmula de Mifflin-St Jeor para TMB
const calculateTMB = (weight: number, height: number, age: number, gender: string): number => {
  if (gender === 'female') {
    return (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }
  return (10 * weight) + (6.25 * height) - (5 * age) + 5;
};

// Fatores de atividade para TDEE
const activityFactors: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

// Metas calóricas baseadas no objetivo
const goalCalorieAdjustments: Record<string, number> = {
  weight_loss: -500,
  muscle_gain: 300,
  conditioning: 0,
  health: 0,
  rehabilitation: 0,
  sports: 200,
  other: 0,
};

// Labels de objetivos
const goalLabels: Record<string, string> = {
  weight_loss: 'Perda de peso',
  muscle_gain: 'Ganho de massa muscular',
  conditioning: 'Condicionamento físico',
  health: 'Saúde geral',
  rehabilitation: 'Reabilitação',
  sports: 'Performance esportiva',
  other: 'Outro',
};

// Calcular recomendações nutricionais
function calculateNutritionRecommendations(
  student: StudentData,
  measurements: MeasurementData | null,
  anamnesis: AnamnesisData | null
): NutritionRecommendation | null {
  const weight = measurements?.weight ? parseFloat(measurements.weight) : null;
  const height = measurements?.height ? parseFloat(measurements.height) : null;
  
  if (!weight || !height) return null;
  
  const gender = student.gender || 'male';
  const estimatedAge = 30;
  const goal = anamnesis?.mainGoal || 'health';
  
  let activityLevel = 'moderate';
  const weeklyFrequency = anamnesis?.weeklyFrequency || 3;
  if (weeklyFrequency <= 1) activityLevel = 'sedentary';
  else if (weeklyFrequency <= 2) activityLevel = 'light';
  else if (weeklyFrequency <= 4) activityLevel = 'moderate';
  else if (weeklyFrequency <= 6) activityLevel = 'active';
  else activityLevel = 'very_active';
  
  const tmb = calculateTMB(weight, height, estimatedAge, gender);
  const activityFactor = activityFactors[activityLevel] || 1.55;
  const tdee = tmb * activityFactor;
  const goalAdjustment = goalCalorieAdjustments[goal] || 0;
  const targetCalories = Math.round(tdee + goalAdjustment);
  
  const proteinPerKg = goal === 'muscle_gain' ? 2.0 : goal === 'weight_loss' ? 1.8 : 1.6;
  const proteinGrams = Math.round(weight * proteinPerKg);
  const proteinCalories = proteinGrams * 4;
  
  const fatPercentage = goal === 'weight_loss' ? 0.25 : 0.30;
  const fatCalories = targetCalories * fatPercentage;
  const fatGrams = Math.round(fatCalories / 9);
  
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbGrams = Math.round(carbCalories / 4);
  
  let weightGoal = undefined;
  const targetWeight = anamnesis?.targetWeight ? parseFloat(anamnesis.targetWeight) : null;
  if (targetWeight && targetWeight !== weight) {
    const difference = targetWeight - weight;
    const weeklyChange = goal === 'weight_loss' ? -0.5 : 0.25;
    const weeksEstimate = Math.abs(Math.round(difference / weeklyChange));
    weightGoal = {
      current: weight,
      target: targetWeight,
      difference,
      weeksEstimate,
    };
  }
  
  return {
    tmb: Math.round(tmb),
    tdee: Math.round(tdee),
    targetCalories,
    goalAdjustment,
    activityLevel,
    macros: {
      protein: proteinGrams,
      carbs: carbGrams,
      fat: fatGrams,
      proteinPerKg,
    },
    weightGoal,
  };
}

// Gerar recomendação de cardio baseada no objetivo
function generateCardioRecommendation(goal: string): CardioRecommendation {
  const recommendations: Record<string, CardioRecommendation> = {
    weight_loss: {
      type: 'HIIT ou Caminhada Inclinada',
      duration: 30,
      frequency: '4-5x por semana',
      intensity: 'Moderada a Alta',
      notes: 'Alterne entre HIIT (20-25min) e cardio de baixa intensidade (40-50min). Priorize após o treino de musculação ou em dias separados.',
    },
    muscle_gain: {
      type: 'Caminhada Leve ou Bicicleta',
      duration: 20,
      frequency: '2-3x por semana',
      intensity: 'Baixa a Moderada',
      notes: 'Cardio leve para saúde cardiovascular sem comprometer ganhos musculares. Evite HIIT em dias de treino pesado.',
    },
    conditioning: {
      type: 'Corrida, Natação ou Ciclismo',
      duration: 40,
      frequency: '3-4x por semana',
      intensity: 'Moderada',
      notes: 'Varie os tipos de cardio para trabalhar diferentes sistemas energéticos.',
    },
    health: {
      type: 'Caminhada ou Atividade de Preferência',
      duration: 30,
      frequency: '3-4x por semana',
      intensity: 'Moderada',
      notes: 'Escolha atividades que você goste para manter consistência.',
    },
    rehabilitation: {
      type: 'Caminhada ou Bicicleta Ergométrica',
      duration: 20,
      frequency: '2-3x por semana',
      intensity: 'Baixa',
      notes: 'Priorize atividades de baixo impacto.',
    },
    sports: {
      type: 'Específico do Esporte + HIIT',
      duration: 45,
      frequency: '4-5x por semana',
      intensity: 'Alta',
      notes: 'Combine treinos específicos do esporte com condicionamento geral.',
    },
    other: {
      type: 'Atividade Aeróbica de Preferência',
      duration: 30,
      frequency: '3x por semana',
      intensity: 'Moderada',
      notes: 'Mantenha uma rotina de cardio para saúde cardiovascular geral.',
    },
  };
  
  return recommendations[goal] || recommendations.health;
}

export async function generateWorkoutPDF(
  student: StudentData,
  measurements: MeasurementData | null,
  anamnesis: AnamnesisData | null,
  workout: WorkoutData,
  personalInfo: PersonalInfo
): Promise<Buffer> {
  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - 2 * margin;

  const checkNewPage = (height: number = 20) => {
    if (yPos + height > 280) {
      doc.addPage();
      yPos = 20;
    }
  };

  // ==================== CABEÇALHO ====================
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(personalInfo.businessName || 'FitPrime Manager', margin, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Plano de Treino Personalizado', margin, 23);
  
  doc.setTextColor(16, 185, 129);
  doc.setFontSize(8);
  doc.text(`Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, margin, 30);
  
  yPos = 45;

  // ==================== DADOS DO ALUNO ====================
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Aluno', margin, yPos);
  yPos += 8;
  
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, yPos, contentWidth, 25, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(student.name, margin + 5, yPos + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  
  let infoY = yPos + 16;
  const leftInfo = [];
  const rightInfo = [];
  
  if (student.email) leftInfo.push(`Email: ${student.email}`);
  if (student.phone) leftInfo.push(`Tel: ${student.phone}`);
  if (measurements?.weight) rightInfo.push(`Peso: ${measurements.weight} kg`);
  if (measurements?.height) rightInfo.push(`Altura: ${measurements.height} cm`);
  if (measurements?.bodyFat) rightInfo.push(`BF: ${measurements.bodyFat}%`);
  
  doc.text(leftInfo.join(' | '), margin + 5, infoY);
  doc.text(rightInfo.join(' | '), pageWidth / 2, infoY);
  
  yPos += 35;

  // ==================== RECOMENDAÇÕES NUTRICIONAIS ====================
  const nutrition = calculateNutritionRecommendations(student, measurements, anamnesis);
  const goal = anamnesis?.mainGoal || 'health';
  
  if (nutrition) {
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Suas Recomendacoes Personalizadas', margin, yPos);
    yPos += 8;
    
    // Card de objetivo
    doc.setFillColor(220, 252, 231);
    doc.rect(margin, yPos, contentWidth, 12, 'F');
    doc.setTextColor(22, 101, 52);
    doc.setFontSize(10);
    doc.text(`Objetivo: ${goalLabels[goal] || goal}`, margin + 5, yPos + 8);
    yPos += 18;
    
    // Grid de macros (4 colunas)
    const cardW = (contentWidth - 15) / 4;
    const cards = [
      { label: 'Meta Diaria', value: `${nutrition.targetCalories}`, unit: 'kcal/dia', bgColor: [254, 243, 199] as [number, number, number], textColor: [146, 64, 14] as [number, number, number] },
      { label: 'Proteina', value: `${nutrition.macros.protein}g`, unit: `${nutrition.macros.proteinPerKg}g/kg`, bgColor: [254, 226, 226] as [number, number, number], textColor: [153, 27, 27] as [number, number, number] },
      { label: 'Carboidratos', value: `${nutrition.macros.carbs}g`, unit: 'energia', bgColor: [254, 249, 195] as [number, number, number], textColor: [133, 77, 14] as [number, number, number] },
      { label: 'Gorduras', value: `${nutrition.macros.fat}g`, unit: 'saudaveis', bgColor: [243, 232, 255] as [number, number, number], textColor: [107, 33, 168] as [number, number, number] },
    ];
    
    cards.forEach((card, index) => {
      const x = margin + (index * (cardW + 5));
      doc.setFillColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
      doc.rect(x, yPos, cardW, 28, 'F');
      
      doc.setTextColor(card.textColor[0], card.textColor[1], card.textColor[2]);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(card.label, x + 3, yPos + 6);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(card.value, x + 3, yPos + 17);
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text(card.unit, x + 3, yPos + 24);
    });
    
    yPos += 35;
    
    // Meta de peso
    if (nutrition.weightGoal) {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, yPos, contentWidth, 20, 'F');
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Meta de Peso', margin + 5, yPos + 7);
      
      const weightText = nutrition.weightGoal.difference > 0 
        ? `Ganhar ${nutrition.weightGoal.difference.toFixed(1)} kg`
        : `Perder ${Math.abs(nutrition.weightGoal.difference).toFixed(1)} kg`;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Atual: ${nutrition.weightGoal.current} kg -> Meta: ${nutrition.weightGoal.target} kg (${weightText})`, margin + 5, yPos + 14);
      
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.text(`Tempo estimado: ${nutrition.weightGoal.weeksEstimate} semanas (~${Math.round(nutrition.weightGoal.weeksEstimate / 4)} meses)`, pageWidth / 2, yPos + 14);
      
      yPos += 28;
    }
  }

  // ==================== RECOMENDAÇÃO DE CARDIO ====================
  const cardio = generateCardioRecommendation(goal);
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Recomendacao de Cardio', margin, yPos);
  yPos += 8;
  
  doc.setFillColor(254, 242, 242);
  doc.rect(margin, yPos, contentWidth, 35, 'F');
  
  doc.setTextColor(153, 27, 27);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(cardio.type, margin + 5, yPos + 8);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Duracao: ${cardio.duration} min | Frequencia: ${cardio.frequency} | Intensidade: ${cardio.intensity}`, margin + 5, yPos + 17);
  
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  const cardioNotes = doc.splitTextToSize(cardio.notes, contentWidth - 10);
  doc.text(cardioNotes, margin + 5, yPos + 25);
  
  yPos += 45;

  // ==================== TREINO ====================
  checkNewPage(50);
  
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(workout.name, margin, yPos);
  yPos += 8;
  
  if (workout.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const descLines = doc.splitTextToSize(workout.description, contentWidth);
    doc.text(descLines, margin, yPos);
    yPos += descLines.length * 5 + 5;
  }
  
  // Info do treino
  if (workout.type || workout.difficulty) {
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const info = [];
    if (workout.type) info.push(`Tipo: ${workout.type}`);
    if (workout.difficulty) info.push(`Dificuldade: ${workout.difficulty}`);
    doc.text(info.join(' | '), margin, yPos);
    yPos += 8;
  }
  
  // Dias de treino
  for (const day of workout.days) {
    checkNewPage(50);
    
    // Cabeçalho do dia
    doc.setFillColor(16, 185, 129);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(day.dayName, margin + 5, yPos + 7);
    yPos += 14;
    
    // Cabeçalho da tabela
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos, contentWidth, 8, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    
    const cols = [
      { x: margin + 2, label: 'Exercicio', w: 55 },
      { x: margin + 60, label: 'Grupo', w: 30 },
      { x: margin + 95, label: 'Series', w: 15 },
      { x: margin + 115, label: 'Reps', w: 20 },
      { x: margin + 140, label: 'Carga', w: 20 },
      { x: margin + 165, label: 'Desc.', w: 15 },
    ];
    
    cols.forEach(col => doc.text(col.label, col.x, yPos + 5));
    yPos += 10;
    
    // Exercícios
    for (const exercise of day.exercises) {
      checkNewPage(15);
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Truncar nome do exercício se muito longo
      const exName = exercise.name.length > 25 ? exercise.name.substring(0, 22) + '...' : exercise.name;
      
      doc.text(exName, cols[0].x, yPos);
      doc.text(exercise.muscleGroup || '-', cols[1].x, yPos);
      doc.text(exercise.sets?.toString() || '-', cols[2].x, yPos);
      doc.text(exercise.reps || '-', cols[3].x, yPos);
      doc.text(exercise.weight || '-', cols[4].x, yPos);
      doc.text(exercise.restTime ? `${exercise.restTime}s` : '-', cols[5].x, yPos);
      
      yPos += 6;
      
      // Notas do exercício
      if (exercise.notes) {
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        const noteLines = doc.splitTextToSize(`-> ${exercise.notes}`, contentWidth - 10);
        doc.text(noteLines, margin + 5, yPos);
        yPos += noteLines.length * 4 + 2;
      }
    }
    
    yPos += 8;
  }

  // ==================== RODAPÉ ====================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Pagina ${i} de ${totalPages} | ${personalInfo.businessName || 'FitPrime Manager'} | ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  // Retornar como Buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
