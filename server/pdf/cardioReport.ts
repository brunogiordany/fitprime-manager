import { jsPDF } from 'jspdf';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CardioLog {
  id: number;
  cardioDate: Date | string;
  cardioType: string;
  cardioTypeName?: string | null;
  durationMinutes: number;
  distanceKm?: string | null;
  caloriesBurned?: number | null;
  avgHeartRate?: number | null;
  maxHeartRate?: number | null;
  minHeartRate?: number | null;
  intensity?: string | null;
  avgSpeed?: string | null;
  avgPace?: string | null;
  feeling?: string | null;
  notes?: string | null;
}

interface CardioStats {
  totalSessions: number;
  totalDuration: number;
  totalDistance: number;
  totalCalories: number;
  avgHeartRate: number | null;
  avgDuration: number;
  avgDistance: number;
  byType?: Record<string, { count: number; duration: number; distance: number; calories: number }>;
}

interface EvolutionData {
  date: string;
  sessionCount: number;
  totalDuration: number;
  totalDistance: number;
  totalCalories: number;
  avgHeartRate: number | null;
}

interface StudentData {
  name: string;
  email?: string | null;
  phone?: string | null;
}

interface PersonalInfo {
  businessName?: string | null;
  logoUrl?: string | null;
}

// Mapeamento de tipos de cardio
const CARDIO_TYPE_LABELS: Record<string, string> = {
  treadmill: 'Esteira',
  outdoor_run: 'Corrida ao ar livre',
  stationary_bike: 'Bicicleta ergométrica',
  outdoor_bike: 'Ciclismo',
  elliptical: 'Elíptico',
  rowing: 'Remo',
  stair_climber: 'Escada',
  swimming: 'Natação',
  jump_rope: 'Pular corda',
  hiit: 'HIIT',
  walking: 'Caminhada',
  hiking: 'Trilha',
  dance: 'Dança',
  boxing: 'Boxe/Luta',
  crossfit: 'CrossFit',
  sports: 'Esportes',
  other: 'Outro',
};

// Mapeamento de intensidades
const INTENSITY_LABELS: Record<string, string> = {
  very_light: 'Muito leve',
  light: 'Leve',
  moderate: 'Moderado',
  vigorous: 'Vigoroso',
  maximum: 'Máximo',
};

// Mapeamento de sensações
const FEELING_LABELS: Record<string, string> = {
  terrible: 'Péssimo',
  bad: 'Ruim',
  okay: 'Ok',
  good: 'Bom',
  great: 'Excelente',
};

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

// Função para formatar duração
function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  }
  return `${minutes}min`;
}

export async function generateCardioPDF(
  student: StudentData,
  stats: CardioStats,
  evolution: EvolutionData[],
  recentLogs: CardioLog[],
  periodLabel: string,
  personalInfo?: PersonalInfo | null
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
    doc.setTextColor(239, 68, 68); // Vermelho (cor de cardio)
    doc.text(title, margin, yPos);
    yPos += 8;
    doc.setDrawColor(239, 68, 68);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
  };

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
      doc.setTextColor(239, 68, 68);
      doc.text(headerName, margin + 30, yPos + 8);
    } catch (error) {
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text(headerName, margin, yPos);
    }
  } else {
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(239, 68, 68);
    doc.text(headerName, margin, yPos);
  }
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Relatório de Cardio', pageWidth - margin - 50, yPos);
  yPos += 10;
  
  doc.setFontSize(8);
  const currentDate = safeFormatDate(new Date(), "dd/MM/yyyy 'às' HH:mm") || 'Data não disponível';
  doc.text(`Gerado em: ${currentDate}`, pageWidth - margin - 50, yPos);
  yPos += 15;

  // ==================== DADOS DO ALUNO ====================
  addSection('Dados do Aluno');
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(student.name, margin, yPos);
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (student.email) {
    doc.text(`Email: ${student.email}`, margin, yPos);
    yPos += 5;
  }
  if (student.phone) {
    doc.text(`Telefone: ${student.phone}`, margin, yPos);
    yPos += 5;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Período: ${periodLabel}`, margin, yPos);
  yPos += 10;

  // ==================== RESUMO ESTATÍSTICO ====================
  addSection('Resumo Estatístico');
  
  // Grid de KPIs
  const kpiWidth = (contentWidth - 15) / 4;
  const kpiHeight = 35;
  
  // KPI 1: Sessões
  doc.setFillColor(254, 226, 226); // bg-red-100
  doc.roundedRect(margin, yPos, kpiWidth, kpiHeight, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Sessões', margin + 5, yPos + 10);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(stats.totalSessions.toString(), margin + 5, yPos + 25);
  
  // KPI 2: Tempo Total
  doc.setFillColor(254, 243, 199); // bg-yellow-100
  doc.roundedRect(margin + kpiWidth + 5, yPos, kpiWidth, kpiHeight, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Tempo Total', margin + kpiWidth + 10, yPos + 10);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(formatDuration(stats.totalDuration), margin + kpiWidth + 10, yPos + 25);
  
  // KPI 3: Distância
  doc.setFillColor(220, 252, 231); // bg-green-100
  doc.roundedRect(margin + (kpiWidth + 5) * 2, yPos, kpiWidth, kpiHeight, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Distância', margin + (kpiWidth + 5) * 2 + 5, yPos + 10);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`${stats.totalDistance.toFixed(1)} km`, margin + (kpiWidth + 5) * 2 + 5, yPos + 25);
  
  // KPI 4: Calorias
  doc.setFillColor(254, 215, 170); // bg-orange-100
  doc.roundedRect(margin + (kpiWidth + 5) * 3, yPos, kpiWidth, kpiHeight, 3, 3, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Calorias', margin + (kpiWidth + 5) * 3 + 5, yPos + 10);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(stats.totalCalories.toLocaleString('pt-BR'), margin + (kpiWidth + 5) * 3 + 5, yPos + 25);
  
  yPos += kpiHeight + 10;
  
  // Médias
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  
  const avgText = `Médias por sessão: ${stats.avgDuration.toFixed(0)} min | ${stats.avgDistance.toFixed(2)} km${stats.avgHeartRate ? ` | ${stats.avgHeartRate.toFixed(0)} bpm` : ''}`;
  doc.text(avgText, margin, yPos);
  yPos += 10;

  // ==================== DISTRIBUIÇÃO POR TIPO ====================
  if (stats.byType && Object.keys(stats.byType).length > 0) {
    addSection('Distribuição por Tipo de Cardio');
    
    const types = Object.entries(stats.byType).sort((a, b) => b[1].duration - a[1].duration);
    const maxDuration = Math.max(...types.map(([, data]) => data.duration));
    
    for (const [type, data] of types) {
      checkNewPage(15);
      
      const typeLabel = CARDIO_TYPE_LABELS[type] || type;
      const percentage = maxDuration > 0 ? (data.duration / maxDuration) * 100 : 0;
      const barWidth = (contentWidth - 80) * (percentage / 100);
      
      // Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(typeLabel, margin, yPos);
      
      // Barra
      doc.setFillColor(239, 68, 68); // Vermelho
      doc.roundedRect(margin + 60, yPos - 4, barWidth, 6, 1, 1, 'F');
      
      // Stats
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const statsText = `${data.count} sessões · ${data.duration}min · ${data.distance.toFixed(1)}km`;
      doc.text(statsText, margin + 60 + barWidth + 5, yPos);
      
      yPos += 12;
    }
    yPos += 5;
  }

  // ==================== GRÁFICO DE EVOLUÇÃO ====================
  if (evolution && evolution.length > 0) {
    addSection('Evolução no Período');
    
    // Gráfico simples de barras para sessões
    const chartHeight = 50;
    const chartWidth = contentWidth;
    const barMaxWidth = chartWidth / Math.max(evolution.length, 1) - 2;
    const maxSessions = Math.max(...evolution.map(e => e.sessionCount), 1);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Sessões por período:', margin, yPos);
    yPos += 8;
    
    // Desenhar barras
    evolution.forEach((data, index) => {
      const barHeight = (data.sessionCount / maxSessions) * chartHeight;
      const x = margin + index * (barMaxWidth + 2);
      const y = yPos + chartHeight - barHeight;
      
      // Barra
      doc.setFillColor(239, 68, 68);
      doc.rect(x, y, barMaxWidth, barHeight, 'F');
      
      // Valor
      if (data.sessionCount > 0) {
        doc.setFontSize(7);
        doc.setTextColor(0, 0, 0);
        doc.text(data.sessionCount.toString(), x + barMaxWidth / 2 - 2, y - 2);
      }
    });
    
    yPos += chartHeight + 5;
    
    // Labels de data
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    if (evolution.length > 0) {
      doc.text(evolution[0].date, margin, yPos);
      if (evolution.length > 1) {
        doc.text(evolution[evolution.length - 1].date, pageWidth - margin - 20, yPos);
      }
    }
    yPos += 10;
    
    // Totais do período
    const totalDist = evolution.reduce((sum, e) => sum + e.totalDistance, 0);
    const totalDur = evolution.reduce((sum, e) => sum + e.totalDuration, 0);
    const totalCal = evolution.reduce((sum, e) => sum + e.totalCalories, 0);
    
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total no período: ${totalDist.toFixed(1)} km percorridos | ${formatDuration(totalDur)} de treino | ${totalCal.toLocaleString('pt-BR')} calorias`, margin, yPos);
    yPos += 10;
  }

  // ==================== ÚLTIMAS SESSÕES ====================
  if (recentLogs && recentLogs.length > 0) {
    addSection('Últimas Sessões de Cardio');
    
    // Cabeçalho da tabela
    const colWidths = [25, 45, 25, 25, 25, 25];
    const headers = ['Data', 'Tipo', 'Duração', 'Distância', 'Calorias', 'FC Média'];
    
    doc.setFillColor(254, 226, 226);
    doc.rect(margin, yPos - 4, contentWidth, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    
    let xPos = margin + 2;
    headers.forEach((header, i) => {
      doc.text(header, xPos, yPos);
      xPos += colWidths[i];
    });
    yPos += 8;
    
    // Linhas da tabela
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    const logsToShow = recentLogs.slice(0, 15); // Mostrar até 15 sessões
    
    for (const log of logsToShow) {
      checkNewPage(8);
      
      xPos = margin + 2;
      doc.setTextColor(0, 0, 0);
      
      // Data
      doc.text(safeFormatDate(log.cardioDate, 'dd/MM') || '-', xPos, yPos);
      xPos += colWidths[0];
      
      // Tipo
      const typeLabel = log.cardioTypeName || CARDIO_TYPE_LABELS[log.cardioType] || log.cardioType;
      doc.text(typeLabel.substring(0, 18), xPos, yPos);
      xPos += colWidths[1];
      
      // Duração
      doc.text(`${log.durationMinutes}min`, xPos, yPos);
      xPos += colWidths[2];
      
      // Distância
      doc.text(log.distanceKm ? `${log.distanceKm}km` : '-', xPos, yPos);
      xPos += colWidths[3];
      
      // Calorias
      doc.text(log.caloriesBurned ? log.caloriesBurned.toString() : '-', xPos, yPos);
      xPos += colWidths[4];
      
      // FC Média
      doc.text(log.avgHeartRate ? `${log.avgHeartRate}bpm` : '-', xPos, yPos);
      
      yPos += 6;
      
      // Linha separadora
      doc.setDrawColor(230, 230, 230);
      doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
    }
    
    if (recentLogs.length > 15) {
      yPos += 5;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`... e mais ${recentLogs.length - 15} sessões`, margin, yPos);
    }
  }

  // ==================== RODAPÉ ====================
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Página ${i} de ${pageCount} | ${headerName} - Relatório de Cardio`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  const pdfOutput = doc.output('arraybuffer');
  return Buffer.from(pdfOutput);
}
