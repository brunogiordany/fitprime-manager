import { jsPDF } from 'jspdf';

const doc = new jsPDF();
doc.text("Hello world!", 10, 10);
const output = doc.output('arraybuffer');
console.log("PDF size:", output.byteLength);
