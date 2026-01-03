/**
 * Integração com Stevo (https://stevo.chat/) para envio de mensagens WhatsApp
 * 
 * Documentação: https://documenter.getpostman.com/view/47159756/2sB3HqHJX2
 * 
 * O Stevo é uma plataforma de automação de WhatsApp que permite:
 * - Enviar mensagens de texto
 * - Enviar mídia (imagens, documentos)
 * - Gerenciar contatos
 * - Criar automações
 * 
 * Autenticação: Header 'token' com o token da instância
 * Formato de número: DDI+DDD+número sem + (ex.: 5511999999999)
 */

import { ENV } from './_core/env';

interface StevoConfig {
  apiKey: string;      // Token da instância Stevo
  instanceName: string; // Instance ID da Stevo
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

// URL base da API Stevo
const STEVO_BASE_URL = 'https://api.stevo.chat';

/**
 * Formata o número de telefone para o padrão internacional
 * Formato: DDI+DDD+número sem + (ex.: 5511999999999)
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
 * 
 * Endpoint: POST /chat/send/text
 * Headers: token (API Key), Content-Type: application/json
 * Body: { Phone: string, Body: string }
 */
export async function sendWhatsAppMessage(params: SendMessageParams): Promise<SendMessageResult> {
  const { phone, message, config } = params;
  
  if (!config.apiKey || !config.instanceName) {
    console.log('[Stevo] API Key ou Instance não configurados');
    return { success: false, error: 'Stevo não configurado' };
  }
  
  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    // Endpoint correto conforme documentação Stevo
    const endpoint = `${STEVO_BASE_URL}/chat/send/text`;
    
    console.log('[Stevo] Enviando mensagem para:', formattedPhone);
    console.log('[Stevo] Endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'token': config.apiKey, // Header 'token' conforme documentação
      },
      body: JSON.stringify({
        Phone: formattedPhone, // Campo 'Phone' conforme documentação
        Body: message,         // Campo 'Body' conforme documentação
      }),
    });
    
    const responseText = await response.text();
    console.log('[Stevo] Response status:', response.status);
    console.log('[Stevo] Response body:', responseText);
    
    if (!response.ok) {
      console.error('[Stevo] Erro na resposta:', response.status, responseText);
      return { success: false, error: `HTTP ${response.status}: ${responseText}` };
    }
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { raw: responseText };
    }
    
    console.log('[Stevo] Mensagem enviada com sucesso:', result);
    
    // Resposta esperada: { code: 200, data: { Details: "Sent", Id: "...", Timestamp: "..." }, success: true }
    return {
      success: result.success || response.ok,
      messageId: result.data?.Id || result.key?.id || result.messageId,
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
 * Obtém o webhook configurado na instância Stevo
 * 
 * Endpoint: GET /webhook
 * Headers: token (API Key)
 */
export async function getWebhook(config: StevoConfig): Promise<{ webhook: string | null; events: string[] }> {
  if (!config.apiKey) {
    return { webhook: null, events: [] };
  }
  
  try {
    const endpoint = `${STEVO_BASE_URL}/webhook`;
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'token': config.apiKey,
      },
    });
    
    if (!response.ok) {
      console.error('[Stevo] Erro ao obter webhook:', response.status);
      return { webhook: null, events: [] };
    }
    
    const result = await response.json();
    // Resposta: { code: 200, data: { subscribe: ["Message", "ReadReceipt"], webhook: "https://..." }, success: true }
    
    return {
      webhook: result.data?.webhook || null,
      events: result.data?.subscribe || [],
    };
  } catch (error) {
    console.error('[Stevo] Erro ao obter webhook:', error);
    return { webhook: null, events: [] };
  }
}

/**
 * Configura o webhook na instância Stevo
 * 
 * Endpoint: POST /webhook
 * Headers: token (API Key)
 * Body: { webhook: string, subscribe: string[] }
 */
export async function setWebhook(config: StevoConfig, webhookUrl: string, events: string[] = ['All']): Promise<boolean> {
  if (!config.apiKey) {
    return false;
  }
  
  try {
    const endpoint = `${STEVO_BASE_URL}/webhook`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'token': config.apiKey,
      },
      body: JSON.stringify({
        webhook: webhookUrl,
        subscribe: events,
      }),
    });
    
    if (!response.ok) {
      console.error('[Stevo] Erro ao configurar webhook:', response.status);
      return false;
    }
    
    console.log('[Stevo] Webhook configurado com sucesso:', webhookUrl);
    return true;
  } catch (error) {
    console.error('[Stevo] Erro ao configurar webhook:', error);
    return false;
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
  getWebhook,
  setWebhook,
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
