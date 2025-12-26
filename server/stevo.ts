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
