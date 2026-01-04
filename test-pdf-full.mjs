import { jsPDF } from 'jspdf';

async function generateStudentPDF() {
  const doc = new jsPDF();
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;

  // Cabeçalho
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('FitPrime', margin, yPos);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('Relatório Completo do Aluno', pageWidth - margin - 60, yPos);
  yPos += 20;

  // Dados do aluno
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129);
  doc.text('Dados Pessoais', margin, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text('Nome: Bruno', margin, yPos);
  yPos += 6;
  doc.text('Email: brunogiordany@gmail.com', margin, yPos);
  yPos += 6;
  doc.text('Telefone: 15997612063', margin, yPos);

  // Retornar como Buffer
  const pdfOutput = doc.output('arraybuffer');
  const buffer = Buffer.from(pdfOutput);
  console.log("PDF Buffer size:", buffer.length);
  console.log("Base64 length:", buffer.toString('base64').length);
  
  // Salvar para teste
  const fs = await import('fs');
  fs.writeFileSync('/home/ubuntu/Downloads/test-pdf.pdf', buffer);
  console.log("PDF salvo em /home/ubuntu/Downloads/test-pdf.pdf");
  
  return buffer;
}

generateStudentPDF().catch(console.error);
