/**
 * Integração com Stevo (https://stevo.chat/) para envio de mensagens WhatsApp
 * 
 * Documentação: https://stevo.chat/docs
 * 
 * O Stevo é uma plataforma de automação de WhatsApp que permite:
 * - Enviar mensagens de texto
 * - Enviar mídia (imagens, documentos)
 * - Gerenciar contatos
 * - Criar automações
 */

import { ENV } from './_core/env';

interface StevoConfig {
  apiKey: string;
  instanceName: string;
}

interface SendMessageParams {
  phone: string;
  message: string;
  config: StevoConfig;
}

interface SendMessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Formata o número de telefone para o padrão internacional
 */
function formatPhoneNumber(phone: string): string {
  // Remove caracteres não numéricos
  let cleaned = phone.replace(/\D/g, '');
  
  // Se não começar com 55, adiciona o código do Brasil
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  
  return cleaned;
}

/**
 * Envia uma mensagem de texto via Stevo
 */
export async function sendWhatsAppMessage(params: SendMessageParams): Promise<SendMessageResult> {
  const { phone, message, config } = params;
  
  if (!config.apiKey || !config.instanceName) {
    console.log('[Stevo] API Key ou Instance não configurados');
    return { success: false, error: 'Stevo não configurado' };
  }
  
  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    // URL da API do Stevo
    const baseUrl = 'https://api.stevo.chat';
    const endpoint = `${baseUrl}/message/sendText/${config.instanceName}`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.apiKey,
      },
      body: JSON.stringify({
        number: formattedPhone,
        textMessage: {
          text: message,
        },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Stevo] Erro na resposta:', response.status, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }
    
    const result = await response.json();
    console.log('[Stevo] Mensagem enviada:', result);
    
    return {
      success: true,
      messageId: result.key?.id || result.messageId,
    };
  } catch (error) {
    console.error('[Stevo] Erro ao enviar mensagem:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Envia lembrete de sessão para o aluno
 */
export async function sendSessionReminder(params: {
  studentName: string;
  studentPhone: string;
  sessionDate: Date;
  sessionTime: string;
  personalName: string;
  config: StevoConfig;
}): Promise<SendMessageResult> {
  const { studentName, studentPhone, sessionDate, sessionTime, personalName, config } = params;
  
  const formattedDate = sessionDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  
  const message = `Olá ${studentName}! 👋

🏋️ *Lembrete de Treino*

📅 ${formattedDate}
⏰ ${sessionTime}

Não se esqueça do seu treino com ${personalName}!

Confirme sua presença respondendo esta mensagem.

_FitPrime Manager_`;

  return sendWhatsAppMessage({ phone: studentPhone, message, config });
}

/**
 * Envia confirmação de pagamento para o aluno
 */
export async function sendPaymentConfirmation(params: {
  studentName: string;
  studentPhone: string;
  amount: number;
  description: string;
  personalName: string;
  config: StevoConfig;
}): Promise<SendMessageResult> {
  const { studentName, studentPhone, amount, description, personalName, config } = params;
  
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
  
  const message = `Olá ${studentName}! 👋

✅ *Pagamento Confirmado*

💰 Valor: ${formattedAmount}
📝 Descrição: ${description}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}

Obrigado pelo pagamento! Continue firme nos treinos! 💪

_${personalName} - FitPrime Manager_`;

  return sendWhatsAppMessage({ phone: studentPhone, message, config });
}

/**
 * Envia lembrete de pagamento para o aluno
 */
export async function sendPaymentReminder(params: {
  studentName: string;
  studentPhone: string;
  amount: number;
  dueDate: Date;
  description: string;
  personalName: string;
  config: StevoConfig;
}): Promise<SendMessageResult> {
  const { studentName, studentPhone, amount, dueDate, description, personalName, config } = params;
  
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
  
  const formattedDate = dueDate.toLocaleDateString('pt-BR');
  
  const message = `Olá ${studentName}! 👋

💳 *Lembrete de Pagamento*

📝 ${description}
💰 Valor: ${formattedAmount}
📅 Vencimento: ${formattedDate}

Por favor, regularize seu pagamento para continuar aproveitando seus treinos!

_${personalName} - FitPrime Manager_`;

  return sendWhatsAppMessage({ phone: studentPhone, message, config });
}

/**
 * Envia mensagem de boas-vindas para novo aluno
 */
export async function sendWelcomeMessage(params: {
  studentName: string;
  studentPhone: string;
  personalName: string;
  config: StevoConfig;
}): Promise<SendMessageResult> {
  const { studentName, studentPhone, personalName, config } = params;
  
  const message = `Olá ${studentName}! 👋

🎉 *Bem-vindo(a) ao FitPrime!*

Estou muito feliz em ter você como aluno(a)! 

Juntos vamos alcançar seus objetivos de saúde e fitness. 💪

Qualquer dúvida, estou à disposição!

_${personalName} - FitPrime Manager_`;

  return sendWhatsAppMessage({ phone: studentPhone, message, config });
}

/**
 * Envia mensagem de aniversário
 */
export async function sendBirthdayMessage(params: {
  studentName: string;
  studentPhone: string;
  personalName: string;
  config: StevoConfig;
}): Promise<SendMessageResult> {
  const { studentName, studentPhone, personalName, config } = params;
  
  const message = `Olá ${studentName}! 🎂

🎉 *Feliz Aniversário!*

Desejo a você um dia incrível cheio de alegria e realizações!

Que este novo ano traga muita saúde, força e conquistas nos treinos! 💪

Um grande abraço!

_${personalName} - FitPrime Manager_`;

  return sendWhatsAppMessage({ phone: studentPhone, message, config });
}

export default {
  sendWhatsAppMessage,
  sendSessionReminder,
  sendPaymentConfirmation,
  sendPaymentReminder,
  sendWelcomeMessage,
  sendBirthdayMessage,
};


/**
 * Interface para mensagem recebida do webhook do Stevo
 */
export interface StevoWebhookMessage {
  instanceName: string;
  from: string; // Número do remetente
  message: string;
  messageType: 'text' | 'image' | 'document' | 'audio' | 'video';
  mediaUrl?: string; // URL da mídia se for imagem/documento
  timestamp: number;
}

/**
 * Padrões para detectar confirmação de pagamento na mensagem
 */
const PAYMENT_CONFIRMATION_PATTERNS = [
  /j[aá]\s*paguei/i,
  /pagamento\s*(feito|realizado|efetuado)/i,
  /paguei\s*(sim|j[aá])/i,
  /transferi/i,
  /fiz\s*(o\s*)?(pix|pagamento|transfer[eê]ncia)/i,
  /pix\s*(feito|enviado|realizado)/i,
  /comprovante/i,
  /segue\s*(o\s*)?(comprovante|pix)/i,
  /ta\s*pago/i,
  /tá\s*pago/i,
  /está\s*pago/i,
  /quitado/i,
];

/**
 * Verifica se a mensagem indica confirmação de pagamento
 */
export function isPaymentConfirmation(message: string): boolean {
  const normalizedMessage = message.toLowerCase().trim();
  return PAYMENT_CONFIRMATION_PATTERNS.some(pattern => pattern.test(normalizedMessage));
}

/**
 * Verifica se a mensagem contém um comprovante (imagem ou documento)
 */
export function hasPaymentProof(webhookMessage: StevoWebhookMessage): boolean {
  // Se for imagem ou documento, provavelmente é um comprovante
  if (webhookMessage.messageType === 'image' || webhookMessage.messageType === 'document') {
    return true;
  }
  
  // Se for texto, verifica se menciona comprovante
  if (webhookMessage.messageType === 'text') {
    return /comprovante|anexo|segue/i.test(webhookMessage.message);
  }
  
  return false;
}

/**
 * Analisa a mensagem recebida e retorna informações sobre pagamento
 */
export interface PaymentAnalysisResult {
  isPaymentRelated: boolean;
  isConfirmation: boolean;
  hasProof: boolean;
  confidence: 'high' | 'medium' | 'low';
  suggestedAction: 'auto_confirm' | 'manual_review' | 'ignore';
}

export function analyzePaymentMessage(webhookMessage: StevoWebhookMessage): PaymentAnalysisResult {
  const hasProof = hasPaymentProof(webhookMessage);
  const isConfirmation = webhookMessage.messageType === 'text' && isPaymentConfirmation(webhookMessage.message);
  
  // Se tem comprovante (imagem/documento), alta confiança
  if (hasProof && (webhookMessage.messageType === 'image' || webhookMessage.messageType === 'document')) {
    return {
      isPaymentRelated: true,
      isConfirmation: true,
      hasProof: true,
      confidence: 'high',
      suggestedAction: 'auto_confirm',
    };
  }
  
  // Se é texto confirmando pagamento
  if (isConfirmation) {
    return {
      isPaymentRelated: true,
      isConfirmation: true,
      hasProof: false,
      confidence: 'medium',
      suggestedAction: 'manual_review', // Sem comprovante, precisa revisão
    };
  }
  
  // Se tem imagem mas não é claramente um comprovante
  if (webhookMessage.messageType === 'image') {
    return {
      isPaymentRelated: true,
      isConfirmation: false,
      hasProof: true,
      confidence: 'low',
      suggestedAction: 'manual_review',
    };
  }
  
  return {
    isPaymentRelated: false,
    isConfirmation: false,
    hasProof: false,
    confidence: 'low',
    suggestedAction: 'ignore',
  };
}

/**
 * Gera resposta automática para confirmação de pagamento
 */
export function generatePaymentResponseMessage(studentName: string, status: 'confirmed' | 'pending_review'): string {
  if (status === 'confirmed') {
    return `Olá ${studentName}! ✅

Recebemos seu comprovante de pagamento!

O pagamento foi confirmado automaticamente. Obrigado! 🙏

Continue firme nos treinos! 💪

_FitPrime Manager_`;
  }
  
  return `Olá ${studentName}! 📋

Recebemos sua mensagem sobre o pagamento.

Vou verificar e confirmar em breve. Obrigado! 🙏

_FitPrime Manager_`;
}
