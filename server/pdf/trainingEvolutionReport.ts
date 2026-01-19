import { jsPDF } from 'jspdf';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentData {
  name: string;
  email: string | null;
  phone: string | null;
}

interface TrainingDashboardData {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  totalExercises: number;
  avgDuration: number;
  feelingDistribution: {
    great: number;
    good: number;
    normal: number;
    tired: number;
    exhausted: number;
  };
  workoutsByMonth: Array<{ month: string; count: number }>;
  volumeByMonth: Array<{ month: string; volume: number }>;
  recentLogs: any[];
}

interface MuscleGroupData {
  muscleGroup: string;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  percentage: number;
}

interface PersonalInfo {
  businessName?: string | null;
  logoUrl?: string | null;
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

// Tradução de sentimentos
const translateFeeling = (value: string): string => {
  const map: Record<string, string> = {
    'great': 'Ótimo',
    'good': 'Bom',
    'normal': 'Normal',
    'tired': 'Cansado',
    'exhausted': 'Exausto',
  };
  return map[value] || value;
};

export async function generateTrainingEvolutionPDF(
  student: StudentData,
  dashboard: TrainingDashboardData,
  muscleGroups: MuscleGroupData[],
  periodLabel: string,
  personalInfo?: PersonalInfo | null,
  extendedMetrics?: {
    avgPerWeek: number;
    currentMonth: number;
    previousMonth: number;
    monthVariation: number;
  } | null
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
    doc.setTextColor(59, 130, 246); // Azul
    doc.text(title, margin, yPos);
    yPos += 8;
    doc.setDrawColor(59, 130, 246);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
  };

  // Função para desenhar card de métrica
  const drawMetricCard = (x: number, y: number, width: number, height: number, label: string, value: string, color: string) => {
    // Fundo do card
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, width, height, 3, 3, 'F');
    
    // Borda colorida à esquerda
    const [r, g, b] = hexToRgb(color);
    doc.setFillColor(r, g, b);
    doc.rect(x, y, 3, height, 'F');
    
    // Valor
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(r, g, b);
    doc.text(value, x + 10, y + 15);
    
    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(label, x + 10, y + 23);
    
    doc.setTextColor(0, 0, 0);
  };

  // Função auxiliar para converter hex para RGB
  function hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result 
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [0, 0, 0];
  }

  // ==================== CABEÇALHO ====================
  const headerName = personalInfo?.businessName || 'FitPrime';
  
  // Se tiver logo personalizada, adicionar imagem
  if (personalInfo?.logoUrl) {
    try {
      const response = await fetch(personalInfo.logoUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const mimeType = response.headers.get('content-type') || 'image/png';
      const imageData = `data:${mimeType};base64,${base64}`;
      
      doc.addImage(imageData, 'PNG', margin, yPos - 5, 25, 25);
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(headerName, margin + 30, yPos + 8);
    } catch (error) {
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      doc.text(headerName, margin, yPos);
    }
  } else {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(headerName, margin, yPos);
  }
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Relatório de Evolução de Treinos', pageWidth - margin - 70, yPos);
  yPos += 10;
  
  doc.setFontSize(8);
  const currentDate = safeFormatDate(new Date(), "dd/MM/yyyy 'às' HH:mm") || 'Data não disponível';
  doc.text(`Gerado em: ${currentDate}`, pageWidth - margin - 70, yPos);
  yPos += 15;

  // ==================== DADOS DO ALUNO ====================
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(student.name, margin, yPos);
  yPos += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  if (student.email) {
    doc.text(`Email: ${student.email}`, margin, yPos);
    yPos += 5;
  }
  if (student.phone) {
    doc.text(`Telefone: ${student.phone}`, margin, yPos);
    yPos += 5;
  }
  doc.text(`Período: ${periodLabel}`, margin, yPos);
  yPos += 15;

  // ==================== MÉTRICAS PRINCIPAIS ====================
  addSection('Métricas de Treino');
  
  const cardWidth = (contentWidth - 15) / 4;
  const cardHeight = 28;
  
  // Linha 1 de cards
  drawMetricCard(margin, yPos, cardWidth, cardHeight, 'Total de Treinos', dashboard.totalWorkouts.toString(), '#10b981');
  drawMetricCard(margin + cardWidth + 5, yPos, cardWidth, cardHeight, 'Volume Total', `${(dashboard.totalVolume / 1000).toFixed(1)}t`, '#3b82f6');
  drawMetricCard(margin + (cardWidth + 5) * 2, yPos, cardWidth, cardHeight, 'Total de Séries', dashboard.totalSets.toString(), '#8b5cf6');
  drawMetricCard(margin + (cardWidth + 5) * 3, yPos, cardWidth, cardHeight, 'Total de Reps', dashboard.totalReps.toString(), '#f97316');
  yPos += cardHeight + 10;
  
  // Linha 2 de cards (métricas estendidas)
  if (extendedMetrics) {
    drawMetricCard(margin, yPos, cardWidth, cardHeight, 'Média/Semana', extendedMetrics.avgPerWeek.toFixed(1), '#06b6d4');
    drawMetricCard(margin + cardWidth + 5, yPos, cardWidth, cardHeight, 'Este Mês', extendedMetrics.currentMonth.toString(), '#6366f1');
    drawMetricCard(margin + (cardWidth + 5) * 2, yPos, cardWidth, cardHeight, 'Mês Anterior', extendedMetrics.previousMonth.toString(), '#64748b');
    
    const variationColor = extendedMetrics.monthVariation >= 0 ? '#10b981' : '#ef4444';
    const variationText = `${extendedMetrics.monthVariation >= 0 ? '+' : ''}${extendedMetrics.monthVariation}%`;
    drawMetricCard(margin + (cardWidth + 5) * 3, yPos, cardWidth, cardHeight, 'Variação Mensal', variationText, variationColor);
    yPos += cardHeight + 10;
  }
  
  // Duração média
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Duração média por treino: ${dashboard.avgDuration} minutos`, margin, yPos);
  yPos += 15;

  // ==================== TREINOS POR MÊS ====================
  if (dashboard.workoutsByMonth && dashboard.workoutsByMonth.length > 0) {
    addSection('Evolução Mensal de Treinos');
    
    // Desenhar gráfico de barras simples
    const barMaxWidth = contentWidth;
    const barHeight = 12;
    const maxCount = Math.max(...dashboard.workoutsByMonth.map(w => w.count), 1);
    
    dashboard.workoutsByMonth.forEach((item, index) => {
      checkNewPage(20);
      
      // Label do mês
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(item.month, margin, yPos + 8);
      
      // Barra
      const barWidth = (item.count / maxCount) * (barMaxWidth - 50);
      doc.setFillColor(99, 102, 241); // Indigo
      doc.roundedRect(margin + 35, yPos, barWidth, barHeight, 2, 2, 'F');
      
      // Valor
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(item.count.toString(), margin + 40 + barWidth, yPos + 8);
      
      yPos += barHeight + 5;
    });
    yPos += 10;
  }

  // ==================== VOLUME POR MÊS ====================
  if (dashboard.volumeByMonth && dashboard.volumeByMonth.length > 0) {
    addSection('Evolução Mensal de Volume (kg)');
    
    const barMaxWidth = contentWidth;
    const barHeight = 12;
    const maxVolume = Math.max(...dashboard.volumeByMonth.map(v => v.volume), 1);
    
    dashboard.volumeByMonth.forEach((item, index) => {
      checkNewPage(20);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(item.month, margin, yPos + 8);
      
      const barWidth = (item.volume / maxVolume) * (barMaxWidth - 60);
      doc.setFillColor(16, 185, 129); // Emerald
      doc.roundedRect(margin + 35, yPos, barWidth, barHeight, 2, 2, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      const volumeText = item.volume >= 1000 
        ? `${(item.volume / 1000).toFixed(1)}t` 
        : `${item.volume}kg`;
      doc.text(volumeText, margin + 40 + barWidth, yPos + 8);
      
      yPos += barHeight + 5;
    });
    yPos += 10;
  }

  // ==================== DISTRIBUIÇÃO POR GRUPO MUSCULAR ====================
  if (muscleGroups && muscleGroups.length > 0) {
    addSection('Distribuição por Grupo Muscular');
    
    // Ordenar por volume
    const sortedGroups = [...muscleGroups].sort((a, b) => b.totalVolume - a.totalVolume);
    const totalVolume = sortedGroups.reduce((sum, g) => sum + g.totalVolume, 0);
    
    // Tabela
    const colWidths = [60, 40, 30, 30, 30];
    const headers = ['Grupo Muscular', 'Volume (kg)', 'Séries', 'Reps', '%'];
    
    // Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    
    let xPos = margin + 3;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos + 7);
      xPos += colWidths[i];
    });
    yPos += 12;
    
    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    sortedGroups.slice(0, 10).forEach((group, index) => {
      checkNewPage(10);
      
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos - 2, contentWidth, 10, 'F');
      }
      
      xPos = margin + 3;
      doc.text(group.muscleGroup, xPos, yPos + 5);
      xPos += colWidths[0];
      doc.text(group.totalVolume.toLocaleString('pt-BR'), xPos, yPos + 5);
      xPos += colWidths[1];
      doc.text(group.totalSets.toString(), xPos, yPos + 5);
      xPos += colWidths[2];
      doc.text(group.totalReps.toString(), xPos, yPos + 5);
      xPos += colWidths[3];
      const percentage = totalVolume > 0 ? ((group.totalVolume / totalVolume) * 100).toFixed(1) : '0';
      doc.text(`${percentage}%`, xPos, yPos + 5);
      
      yPos += 10;
    });
    yPos += 10;
  }

  // ==================== DISTRIBUIÇÃO DE SENTIMENTO ====================
  if (dashboard.feelingDistribution) {
    addSection('Como Você se Sentiu nos Treinos');
    
    const feelings = [
      { key: 'great', label: 'Ótimo', color: '#10b981', emoji: '💪' },
      { key: 'good', label: 'Bom', color: '#3b82f6', emoji: '😊' },
      { key: 'normal', label: 'Normal', color: '#f59e0b', emoji: '😐' },
      { key: 'tired', label: 'Cansado', color: '#f97316', emoji: '😓' },
      { key: 'exhausted', label: 'Exausto', color: '#ef4444', emoji: '😵' },
    ];
    
    const total = Object.values(dashboard.feelingDistribution).reduce((a, b) => a + b, 0);
    
    feelings.forEach((feeling) => {
      const count = dashboard.feelingDistribution[feeling.key as keyof typeof dashboard.feelingDistribution] || 0;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      
      checkNewPage(15);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`${feeling.label}:`, margin, yPos + 6);
      
      // Barra de progresso
      const barWidth = 100;
      const filledWidth = (percentage / 100) * barWidth;
      
      doc.setFillColor(226, 232, 240);
      doc.roundedRect(margin + 50, yPos, barWidth, 8, 2, 2, 'F');
      
      const [r, g, b] = hexToRgb(feeling.color);
      doc.setFillColor(r, g, b);
      doc.roundedRect(margin + 50, yPos, filledWidth, 8, 2, 2, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`${count} (${percentage.toFixed(0)}%)`, margin + 155, yPos + 6);
      
      yPos += 12;
    });
    yPos += 5;
  }

  // ==================== TREINOS RECENTES ====================
  if (dashboard.recentLogs && dashboard.recentLogs.length > 0) {
    addSection('Últimos Treinos Registrados');
    
    // Tabela
    const colWidths = [35, 50, 30, 25, 30];
    const headers = ['Data', 'Treino', 'Duração', 'Séries', 'Volume'];
    
    // Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, yPos, contentWidth, 10, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    
    let xPos = margin + 3;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos + 7);
      xPos += colWidths[i];
    });
    yPos += 12;
    
    // Rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    dashboard.recentLogs.slice(0, 10).forEach((log: any, index) => {
      checkNewPage(10);
      
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, yPos - 2, contentWidth, 10, 'F');
      }
      
      xPos = margin + 3;
      const dateText = safeFormatDate(log.trainingDate, 'dd/MM/yy') || '-';
      doc.text(String(dateText), xPos, yPos + 5);
      xPos += colWidths[0];
      
      const workoutName = String(log.workoutName || 'Treino').substring(0, 20);
      doc.text(workoutName, xPos, yPos + 5);
      xPos += colWidths[1];
      
      doc.text(String(`${log.totalDuration || 0}min`), xPos, yPos + 5);
      xPos += colWidths[2];
      
      doc.text(String(log.totalSets || 0), xPos, yPos + 5);
      xPos += colWidths[3];
      
      const volume = parseFloat(String(log.totalVolume || '0'));
      const volumeText = volume >= 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume.toFixed(0)}kg`;
      doc.text(String(volumeText), xPos, yPos + 5);
      
      yPos += 10;
    });
  }

  // ==================== RODAPÉ ====================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${totalPages} - ${headerName}`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  // Retornar como Buffer
  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
