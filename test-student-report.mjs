import { jsPDF } from 'jspdf';
import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function safeFormatDate(dateValue, formatStr = 'dd/MM/yyyy') {
  if (!dateValue) return null;
  try {
    let date;
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

async function generateStudentPDF(student, anamnesis, measurements, workouts, personalInfo) {
  console.log("Iniciando geração do PDF...");
  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

  const checkNewPage = (height = 20) => {
    if (yPos + height > 280) {
      doc.addPage();
      yPos = 20;
    }
  };

  const addSection = (title) => {
    checkNewPage(30);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129);
    doc.text(title, margin, yPos);
    yPos += 8;
    doc.setDrawColor(16, 185, 129);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
  };

  const addField = (label, value) => {
    if (value && value !== '-') {
      checkNewPage(10);
      doc.setFont('helvetica', 'bold');
      doc.text(label + ': ', margin, yPos);
      const labelWidth = doc.getTextWidth(label + ': ');
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(String(value), contentWidth - labelWidth);
      doc.text(lines, margin + labelWidth, yPos);
      yPos += lines.length * 5 + 3;
    }
  };

  // Cabeçalho
  const headerName = personalInfo?.businessName || 'FitPrime';
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text(headerName, margin, yPos);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Relatório Completo do Aluno', pageWidth - margin - 60, yPos);
  yPos += 10;
  
  doc.setFontSize(8);
  const currentDate = safeFormatDate(new Date(), "dd/MM/yyyy 'às' HH:mm") || 'Data não disponível';
  doc.text('Gerado em: ' + currentDate, pageWidth - margin - 60, yPos);
  yPos += 15;

  // Dados Pessoais
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
  yPos += 5;

  // Medidas
  if (measurements && measurements.length > 0) {
    addSection('Medidas Corporais');
    const latest = measurements[0];
    addField('Peso', latest.weight ? latest.weight + ' kg' : null);
    addField('Altura', latest.height ? latest.height + ' cm' : null);
    addField('% Gordura', latest.bodyFat ? latest.bodyFat + '%' : null);
    addField('Cintura', latest.waist ? latest.waist + ' cm' : null);
    addField('Quadril', latest.hip ? latest.hip + ' cm' : null);
  }

  console.log("Finalizando PDF...");
  const pdfOutput = doc.output('arraybuffer');
  console.log("ArrayBuffer size:", pdfOutput.byteLength);
  const buffer = Buffer.from(pdfOutput);
  console.log("Buffer size:", buffer.length);
  return buffer;
}

// Testar
const student = {
  name: 'Bruno',
  email: 'brunogiordany@gmail.com',
  phone: '15997612063',
  birthDate: '1989-03-05',
  gender: 'male',
  createdAt: new Date()
};

const measurements = [
  { weight: '88.4', height: '175', bodyFat: '15.5', waist: '93.5', hip: '100' }
];

generateStudentPDF(student, null, measurements, [], null)
  .then(buffer => {
    console.log("PDF gerado com sucesso! Tamanho:", buffer.length);
    import('fs').then(fs => {
      fs.writeFileSync('/home/ubuntu/Downloads/test-student-report.pdf', buffer);
      console.log("PDF salvo!");
    });
  })
  .catch(err => console.error("Erro:", err));
