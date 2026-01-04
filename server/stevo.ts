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
  server?: string;     // Servidor da instância (ex: sm15, sm12) - padrão: sm15
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

// URL base da API Stevo - cada instância pode ter um servidor diferente (sm12, sm15, sm16, etc.)
// O servidor padrão é sm15, mas pode ser configurado por personal
const DEFAULT_STEVO_SERVER = 'sm15';

function getStevoBaseUrl(server?: string): string {
  const serverName = server || DEFAULT_STEVO_SERVER;
  return `https://${serverName}.stevo.chat`;
}

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
    const baseUrl = getStevoBaseUrl(config.server);
    const endpoint = `${baseUrl}/chat/send/text`;
    
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
    const baseUrl = getStevoBaseUrl(config.server);
    const endpoint = `${baseUrl}/webhook`;
    
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
    const baseUrl = getStevoBaseUrl(config.server);
    const endpoint = `${baseUrl}/webhook`;
    
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
 * Envia mídia via Stevo (imagem, vídeo, áudio, documento)
 * 
 * Endpoints:
 * - Imagem: POST /chat/send/image
 * - Vídeo: POST /chat/send/video
 * - Áudio: POST /chat/send/audio
 * - Documento: POST /chat/send/document
 */
export async function sendWhatsAppMedia(params: {
  phone: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio' | 'file';
  caption?: string;
  config: StevoConfig;
}): Promise<SendMessageResult> {
  const { phone, mediaUrl, mediaType, caption, config } = params;
  
  if (!config.apiKey || !config.instanceName) {
    console.log('[Stevo] API Key ou Instance não configurados');
    return { success: false, error: 'Stevo não configurado' };
  }
  
  const formattedPhone = formatPhoneNumber(phone);
  
  // Mapear tipo de mídia para endpoint
  const endpointMap: Record<string, string> = {
    'image': 'image',
    'video': 'video',
    'audio': 'audio',
    'file': 'document',
  };
  
  const endpoint = endpointMap[mediaType] || 'document';
  
  try {
    const baseUrl = getStevoBaseUrl(config.server);
    const url = `${baseUrl}/chat/send/${endpoint}`;
    
    console.log('[Stevo] Enviando mídia para:', formattedPhone);
    console.log('[Stevo] Tipo:', mediaType);
    console.log('[Stevo] URL:', mediaUrl);
    console.log('[Stevo] Endpoint:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'token': config.apiKey,
      },
      body: JSON.stringify({
        Phone: formattedPhone,
        Media: mediaUrl,
        Caption: caption || '',
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
    
    console.log('[Stevo] Mídia enviada com sucesso:', result);
    
    return {
      success: result.success || response.ok,
      messageId: result.data?.Id || result.key?.id || result.messageId,
    };
  } catch (error) {
    console.error('[Stevo] Erro ao enviar mídia:', error);
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
  
  const chatLink = 'https://fitprimemanager.com/login-aluno';
  
  const message = `Olá ${studentName}! 👋

🏋️ *Lembrete de Treino*

📅 ${formattedDate}
⏰ ${sessionTime}

Não se esqueça do seu treino com ${personalName}!

💬 Responda pelo FitPrime Chat:
${chatLink}

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
  
  const chatLink = 'https://fitprimemanager.com/login-aluno';
  
  const message = `Olá ${studentName}! 👋

✅ *Pagamento Confirmado*

💰 Valor: ${formattedAmount}
📝 Descrição: ${description}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}

Obrigado pelo pagamento! Continue firme nos treinos! 💪

💬 Acesse seu portal:
${chatLink}

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
  
  const chatLink = 'https://fitprimemanager.com/login-aluno';
  
  const message = `Olá ${studentName}! 👋

💳 *Lembrete de Pagamento*

📝 ${description}
💰 Valor: ${formattedAmount}
📅 Vencimento: ${formattedDate}

Por favor, regularize seu pagamento para continuar aproveitando seus treinos!

💬 Responda pelo FitPrime Chat:
${chatLink}

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
  
  const chatLink = 'https://fitprimemanager.com/login-aluno';
  
  const message = `Olá ${studentName}! 👋

🎉 *Bem-vindo(a) ao FitPrime!*

Estou muito feliz em ter você como aluno(a)! 

Juntos vamos alcançar seus objetivos de saúde e fitness. 💪

💬 Acesse seu portal e converse comigo:
${chatLink}

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
  
  const chatLink = 'https://fitprimemanager.com/login-aluno';
  
  const message = `Olá ${studentName}! 🎂

🎉 *Feliz Aniversário!*

Desejo a você um dia incrível cheio de alegria e realizações!

Que este novo ano traga muita saúde, força e conquistas nos treinos! 💪

💬 Acesse seu portal:
${chatLink}

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


/**
 * Interface para o payload que o Stevo envia ao webhook
 * Baseado na documentação: eventos Message, ReadReceipt, etc.
 */
export interface StevoWebhookPayload {
  // Evento Message
  event?: string;
  instance?: string;
  data?: {
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
      id?: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text?: string;
      };
      imageMessage?: {
        url?: string;
        mimetype?: string;
        caption?: string;
      };
      documentMessage?: {
        url?: string;
        mimetype?: string;
        fileName?: string;
      };
      audioMessage?: {
        url?: string;
        mimetype?: string;
      };
      videoMessage?: {
        url?: string;
        mimetype?: string;
        caption?: string;
      };
    };
    messageTimestamp?: number;
  };
  // Campos alternativos (formato simplificado)
  from?: string;
  body?: string;
  type?: string;
  mediaUrl?: string;
  timestamp?: number;
}

/**
 * Handler para processar webhooks recebidos do Stevo
 * Este handler é chamado pelo endpoint /api/webhook/stevo
 */
export async function handleStevoWebhook(payload: StevoWebhookPayload): Promise<{
  success: boolean;
  processed: boolean;
  action?: string;
  error?: string;
}> {
  try {
    console.log('[Stevo Webhook] Payload recebido:', JSON.stringify(payload, null, 2));
    
    // Extrair informações da mensagem
    let from = '';
    let messageText = '';
    let messageType: 'text' | 'image' | 'document' | 'audio' | 'video' = 'text';
    let mediaUrl: string | undefined;
    let timestamp = Date.now();
    
    // Formato padrão do Stevo (evento Message)
    if (payload.data?.key?.remoteJid) {
      from = payload.data.key.remoteJid.replace('@s.whatsapp.net', '');
      timestamp = (payload.data.messageTimestamp || Date.now() / 1000) * 1000;
      
      // Extrair texto da mensagem
      if (payload.data.message?.conversation) {
        messageText = payload.data.message.conversation;
        messageType = 'text';
      } else if (payload.data.message?.extendedTextMessage?.text) {
        messageText = payload.data.message.extendedTextMessage.text;
        messageType = 'text';
      } else if (payload.data.message?.imageMessage) {
        messageType = 'image';
        mediaUrl = payload.data.message.imageMessage.url;
        messageText = payload.data.message.imageMessage.caption || '';
      } else if (payload.data.message?.documentMessage) {
        messageType = 'document';
        mediaUrl = payload.data.message.documentMessage.url;
      } else if (payload.data.message?.audioMessage) {
        messageType = 'audio';
        mediaUrl = payload.data.message.audioMessage.url;
      } else if (payload.data.message?.videoMessage) {
        messageType = 'video';
        mediaUrl = payload.data.message.videoMessage.url;
        messageText = payload.data.message.videoMessage.caption || '';
      }
    }
    // Formato simplificado (alternativo)
    else if (payload.from) {
      from = payload.from.replace('@s.whatsapp.net', '');
      messageText = payload.body || '';
      messageType = (payload.type as any) || 'text';
      mediaUrl = payload.mediaUrl;
      timestamp = payload.timestamp || Date.now();
    }
    
    // Se não conseguiu extrair o remetente, ignorar
    if (!from) {
      console.log('[Stevo Webhook] Não foi possível extrair remetente');
      return { success: true, processed: false, error: 'no_sender' };
    }
    
    // Ignorar mensagens enviadas por nós mesmos
    if (payload.data?.key?.fromMe) {
      console.log('[Stevo Webhook] Ignorando mensagem enviada por nós');
      return { success: true, processed: false, error: 'from_me' };
    }
    
    // Normalizar número de telefone (remover 55 se presente)
    let phone = from.replace(/\D/g, '');
    if (phone.startsWith('55')) {
      phone = phone.substring(2);
    }
    
    console.log('[Stevo Webhook] Processando mensagem de:', phone);
    console.log('[Stevo Webhook] Tipo:', messageType);
    console.log('[Stevo Webhook] Texto:', messageText);
    
    // Importar db para buscar aluno
    const db = await import('./db');
    
    // Buscar aluno pelo telefone
    const student = await db.getStudentByPhone(phone);
    
    if (!student) {
      console.log('[Stevo Webhook] Aluno não encontrado para telefone:', phone);
      return { success: true, processed: false, error: 'student_not_found' };
    }
    
    console.log('[Stevo Webhook] Aluno encontrado:', student.name);
    
    // SALVAR A MENSAGEM NO CHAT (independente do conteúdo)
    // Extrair messageId para evitar duplicação
    const messageId = payload.data?.key?.id || `${from}_${timestamp}`;
    
    try {
      // Verificar se a mensagem já foi processada (evitar duplicação)
      const existingMessage = await db.getChatMessageByExternalId(student.personalId, student.id, messageId);
      if (existingMessage) {
        console.log('[Stevo Webhook] Mensagem já processada, ignorando duplicata:', messageId);
        return { success: true, processed: false, error: 'duplicate_message' };
      }
      
      // Mapear tipo de mensagem do Stevo para o tipo do chat
      const chatMessageType = messageType === 'document' ? 'file' : messageType;
      
      // Criar mensagem no chat como vinda do aluno via WhatsApp
      // Source 'internal' para aparecer no Chat FitPrime (todas as conversas ficam unificadas)
      await db.createChatMessage({
        personalId: student.personalId,
        studentId: student.id,
        senderType: 'student',
        message: messageText || null,
        messageType: chatMessageType as any,
        mediaUrl: mediaUrl || null,
        mediaName: mediaUrl ? 'Mídia recebida via WhatsApp' : null,
        isRead: false,
        source: 'internal', // Unificado no Chat FitPrime
        externalId: messageId, // Salvar ID externo para evitar duplicação
      });
      
      console.log('[Stevo Webhook] Mensagem salva no chat do aluno:', student.name, 'ID:', messageId);
    } catch (chatError) {
      console.error('[Stevo Webhook] Erro ao salvar mensagem no chat:', chatError);
    }
    
    // Criar objeto de mensagem para análise de pagamento
    const webhookMessage: StevoWebhookMessage = {
      instanceName: payload.instance || '',
      from: from,
      message: messageText,
      messageType: messageType,
      mediaUrl: mediaUrl,
      timestamp: timestamp,
    };
    
    // Analisar a mensagem para ver se é relacionada a pagamento
    const analysis = analyzePaymentMessage(webhookMessage);
    
    console.log('[Stevo Webhook] Análise de pagamento:', analysis);
    
    // Se não for relacionada a pagamento, tentar responder com IA
    if (!analysis.isPaymentRelated) {
      console.log('[Stevo Webhook] Mensagem não relacionada a pagamento, tentando responder com IA');
      
      // Tentar responder com IA de atendimento
      try {
        const aiAssistant = await import('./aiAssistant');
        console.log('[Stevo Webhook] Buscando config da IA para personalId:', student.personalId);
        const aiConfig = await aiAssistant.default.getAiConfig(student.personalId);
        console.log('[Stevo Webhook] Config da IA:', JSON.stringify(aiConfig, null, 2));
        
        // Verificar se a IA está habilitada para alunos
        if (aiConfig && aiConfig.isEnabled && aiConfig.enabledForStudents) {
          console.log('[Stevo Webhook] IA habilitada, processando mensagem...');
          
          // Verificar horário de atendimento
          const now = new Date();
          const currentHour = now.getHours();
          const isWeekend = now.getDay() === 0 || now.getDay() === 6;
          
          console.log('[Stevo Webhook] Hora atual:', currentHour, 'Horário config:', aiConfig.autoReplyStartHour, '-', aiConfig.autoReplyEndHour);
          console.log('[Stevo Webhook] É fim de semana:', isWeekend, 'Atende fim de semana:', aiConfig.autoReplyWeekends);
          console.log('[Stevo Webhook] Auto reply enabled:', aiConfig.autoReplyEnabled);
          
          const isWithinWorkingHours = 
            currentHour >= aiConfig.autoReplyStartHour && 
            currentHour < aiConfig.autoReplyEndHour &&
            (aiConfig.autoReplyWeekends || !isWeekend);
          
          console.log('[Stevo Webhook] Dentro do horário:', isWithinWorkingHours);
          
          if (isWithinWorkingHours && aiConfig.autoReplyEnabled) {
            console.log('[Stevo Webhook] Processando mensagem com IA...');
            // Processar mensagem com IA
            const aiResponse = await aiAssistant.default.processMessage({
              personalId: student.personalId,
              phone: student.phone || '',
              message: messageText || '[Mídia recebida]',
              messageType: messageType === 'document' ? 'file' : messageType,
            });
            
            console.log('[Stevo Webhook] Resposta da IA:', JSON.stringify(aiResponse, null, 2));
            
            if (aiResponse.message && !aiResponse.shouldEscalate) {
              // Buscar configurações do Stevo do personal
              const personal = await db.getPersonalByUserId(student.personalId);
              console.log('[Stevo Webhook] Personal encontrado:', personal?.id, 'API Key:', personal?.evolutionApiKey ? 'SIM' : 'NÃO', 'Instance:', personal?.evolutionInstance);
              
              if (personal?.evolutionApiKey && personal?.evolutionInstance) {
                // Aplicar delay humanizado
                const delay = Math.floor(
                  Math.random() * (aiConfig.maxResponseDelay - aiConfig.minResponseDelay) + 
                  aiConfig.minResponseDelay
                ) * 1000;
                
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Enviar resposta via WhatsApp
                await sendWhatsAppMessage({
                  phone: student.phone || '',
                  message: aiResponse.message,
                  config: {
                    apiKey: personal.evolutionApiKey,
                    instanceName: personal.evolutionInstance,
                    server: (personal as any).evolutionServer || undefined,
                  },
                });
                
                // Salvar resposta da IA no chat (unificado no Chat FitPrime)
                await db.createChatMessage({
                  personalId: student.personalId,
                  studentId: student.id,
                  senderType: 'personal',
                  message: aiResponse.message,
                  messageType: 'text',
                  isRead: true,
                  source: 'internal',
                });
                
                console.log('[Stevo Webhook] Resposta da IA enviada com sucesso');
                
                // Verificar se precisa escalar para humano
                if (aiResponse.shouldEscalate) {
                  const { notifyOwner } = await import('./_core/notification');
                  await notifyOwner({
                    title: `🚨 Escalação - ${student.name}`,
                    content: `A IA detectou que a conversa com ${student.name} precisa de atenção humana.\n\nMotivo: ${aiResponse.escalationReason || 'Não especificado'}\n\nÚltima mensagem: "${messageText}"`,
                  });
                }
                
                return { success: true, processed: true, action: 'ai_response_sent' };
              }
            }
          } else {
            // Fora do horário, enviar mensagem de ausência se configurada
            if (aiConfig.awayMessage) {
              const personal = await db.getPersonalByUserId(student.personalId);
              
              if (personal?.evolutionApiKey && personal?.evolutionInstance) {
                await sendWhatsAppMessage({
                  phone: student.phone || '',
                  message: aiConfig.awayMessage.replace('{nome}', student.name),
                  config: {
                    apiKey: personal.evolutionApiKey,
                    instanceName: personal.evolutionInstance,
                    server: (personal as any).evolutionServer || undefined,
                  },
                });
                
                console.log('[Stevo Webhook] Mensagem de ausência enviada');
                return { success: true, processed: true, action: 'away_message_sent' };
              }
            }
          }
        }
      } catch (aiError) {
        console.error('[Stevo Webhook] Erro ao processar com IA:', aiError);
      }
      
      return { success: true, processed: true, action: 'saved_to_chat' };
    }
    
    // Buscar cobrança pendente mais recente do aluno
    const charges = await db.getChargesByStudentId(student.id);
    const pendingCharge = charges.find((c: any) => c.status === 'pending' || c.status === 'overdue');
    
    if (!pendingCharge) {
      console.log('[Stevo Webhook] Nenhuma cobrança pendente encontrada');
      return { success: true, processed: false, error: 'no_pending_charge' };
    }
    
    console.log('[Stevo Webhook] Cobrança pendente encontrada:', pendingCharge.id);
    
    // Buscar personal para enviar resposta
    const personal = await db.getPersonalByUserId(student.personalId);
    
    // Se alta confiança (comprovante), confirmar automaticamente
    if (analysis.suggestedAction === 'auto_confirm') {
      await db.updateCharge(pendingCharge.id, {
        status: 'paid',
        paidAt: new Date(),
        notes: (pendingCharge.notes || '') + '\n[Auto] Confirmado via WhatsApp em ' + new Date().toLocaleString('pt-BR'),
      });
      
      // Enviar resposta ao aluno
      if (personal?.evolutionApiKey && personal?.evolutionInstance) {
        await sendWhatsAppMessage({
          phone: student.phone || '',
          message: generatePaymentResponseMessage(student.name, 'confirmed'),
          config: {
            apiKey: personal.evolutionApiKey,
            instanceName: personal.evolutionInstance,
          },
        });
      }
      
      // Notificar o personal
      const { notifyOwner } = await import('./_core/notification');
      await notifyOwner({
        title: `💳 Pagamento Confirmado - ${student.name}`,
        content: `O aluno ${student.name} enviou comprovante de pagamento via WhatsApp.\n\nValor: R$ ${(Number(pendingCharge.amount) / 100).toFixed(2)}\nDescrição: ${pendingCharge.description}\n\nO pagamento foi confirmado automaticamente.`,
      });
      
      console.log('[Stevo Webhook] Pagamento confirmado automaticamente');
      
      return { 
        success: true, 
        processed: true, 
        action: 'auto_confirmed',
      };
    }
    
    // Se precisa revisão manual, notificar o personal
    if (analysis.suggestedAction === 'manual_review') {
      const { notifyOwner } = await import('./_core/notification');
      await notifyOwner({
        title: `💳 Possível Pagamento - ${student.name}`,
        content: `O aluno ${student.name} enviou uma mensagem que pode ser confirmação de pagamento:\n\nMensagem: "${messageText || '[Mídia]'}"\nTipo: ${messageType}\n\nValor pendente: R$ ${(Number(pendingCharge.amount) / 100).toFixed(2)}\n\nPor favor, verifique e confirme manualmente se necessário.`,
      });
      
      // Enviar resposta ao aluno
      if (personal?.evolutionApiKey && personal?.evolutionInstance) {
        await sendWhatsAppMessage({
          phone: student.phone || '',
          message: generatePaymentResponseMessage(student.name, 'pending_review'),
          config: {
            apiKey: personal.evolutionApiKey,
            instanceName: personal.evolutionInstance,
          },
        });
      }
      
      console.log('[Stevo Webhook] Mensagem enviada para revisão manual');
      
      return { 
        success: true, 
        processed: true, 
        action: 'pending_review',
      };
    }
    
    return { success: true, processed: false, error: 'no_action_needed' };
  } catch (error) {
    console.error('[Stevo Webhook] Erro:', error);
    return { 
      success: false, 
      processed: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
