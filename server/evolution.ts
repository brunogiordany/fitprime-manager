/**
 * Evolution API Integration
 * Handles webhooks from Evolution API Cloud for WhatsApp messaging
 */

import * as db from './db';

// Evolution API webhook payload interface
interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data?: {
    key?: {
      remoteJid?: string;
      fromMe?: boolean;
      id?: string;
    };
    message?: any;
    messageTimestamp?: number;
    pushName?: string;
  };
  // SEND_MESSAGE format
  key?: {
    remoteJid?: string;
    fromMe?: boolean;
    id?: string;
  };
  message?: any;
  messageTimestamp?: number;
  // Alternative format
  from?: string;
  body?: string;
  type?: string;
  mediaUrl?: string;
  timestamp?: number;
}

/**
 * Extract message content from Evolution API message object
 */
function extractMessageContent(message: any): { text: string; type: 'text' | 'image' | 'document' | 'audio' | 'video'; url?: string } {
  if (!message) return { text: '', type: 'text' };
  
  if (message.conversation) {
    return { text: message.conversation, type: 'text' };
  } else if (message.extendedTextMessage?.text) {
    return { text: message.extendedTextMessage.text, type: 'text' };
  } else if (message.imageMessage) {
    return { text: message.imageMessage.caption || '', type: 'image', url: message.imageMessage.url };
  } else if (message.documentMessage) {
    return { text: '', type: 'document', url: message.documentMessage.url };
  } else if (message.audioMessage) {
    return { text: '', type: 'audio', url: message.audioMessage.url };
  } else if (message.videoMessage) {
    return { text: message.videoMessage.caption || '', type: 'video', url: message.videoMessage.url };
  }
  return { text: '', type: 'text' };
}

/**
 * Handler para processar webhooks recebidos da Evolution API
 */
export async function handleEvolutionWebhook(payload: EvolutionWebhookPayload): Promise<{
  success: boolean;
  processed: boolean;
  action?: string;
  error?: string;
}> {
  try {
    console.log('[Evolution Webhook] Payload recebido:', JSON.stringify(payload, null, 2));
    console.log('[Evolution Webhook] Evento:', payload.event);
    
    // Apenas processar eventos de mensagem
    if (!['MESSAGES_UPSERT', 'SEND_MESSAGE', 'messages.upsert', 'send.message'].includes(payload.event)) {
      console.log('[Evolution Webhook] Evento ignorado:', payload.event);
      return { success: true, processed: false, error: 'event_ignored' };
    }
    
    // Extrair informações da mensagem
    let from = '';
    let messageText = '';
    let messageType: 'text' | 'image' | 'document' | 'audio' | 'video' = 'text';
    let mediaUrl: string | undefined;
    let timestamp = Date.now();
    let isFromMe = false;
    let messageId = '';
    
    // FORMATO 1: Evento MESSAGES_UPSERT (mensagens recebidas) - payload.data.key
    if (payload.data?.key?.remoteJid) {
      console.log('[Evolution Webhook] Formato detectado: MESSAGES_UPSERT (payload.data.key)');
      from = payload.data.key.remoteJid.replace('@s.whatsapp.net', '');
      isFromMe = payload.data.key.fromMe === true;
      messageId = payload.data.key.id || '';
      timestamp = (payload.data.messageTimestamp || Date.now() / 1000) * 1000;
      
      const content = extractMessageContent(payload.data.message);
      messageText = content.text;
      messageType = content.type;
      mediaUrl = content.url;
    }
    // FORMATO 2: Evento SEND_MESSAGE (mensagens enviadas) - payload.key diretamente
    else if (payload.key?.remoteJid) {
      console.log('[Evolution Webhook] Formato detectado: SEND_MESSAGE (payload.key)');
      from = payload.key.remoteJid.replace('@s.whatsapp.net', '');
      isFromMe = payload.key.fromMe === true;
      messageId = payload.key.id || '';
      timestamp = (payload.messageTimestamp || Date.now() / 1000) * 1000;
      
      const content = extractMessageContent(payload.message);
      messageText = content.text;
      messageType = content.type;
      mediaUrl = content.url;
    }
    // FORMATO 3: Formato simplificado (alternativo)
    else if (payload.from) {
      console.log('[Evolution Webhook] Formato detectado: Simplificado (payload.from)');
      from = payload.from.replace('@s.whatsapp.net', '');
      messageText = payload.body || '';
      messageType = (payload.type as any) || 'text';
      mediaUrl = payload.mediaUrl;
      timestamp = payload.timestamp || Date.now();
      messageId = `${from}_${timestamp}`;
    }
    
    // Se não conseguiu extrair o remetente, ignorar
    if (!from) {
      console.log('[Evolution Webhook] Não foi possível extrair remetente - payload não reconhecido');
      console.log('[Evolution Webhook] Chaves do payload:', Object.keys(payload));
      return { success: true, processed: false, error: 'no_sender' };
    }
    
    // Normalizar número de telefone (remover 55 se presente)
    let phone = from.replace(/\D/g, '');
    if (phone.startsWith('55')) {
      phone = phone.substring(2);
    }
    
    console.log('[Evolution Webhook] Processando mensagem de:', phone);
    console.log('[Evolution Webhook] Tipo:', messageType);
    console.log('[Evolution Webhook] Texto:', messageText);
    console.log('[Evolution Webhook] FromMe:', isFromMe);
    
    // Buscar aluno pelo telefone
    const student = await db.getStudentByPhone(phone);
    
    if (!student) {
      console.log('[Evolution Webhook] Aluno não encontrado para telefone:', phone);
      return { success: true, processed: false, error: 'student_not_found' };
    }
    
    console.log('[Evolution Webhook] Aluno encontrado:', student.name);
    
    // SALVAR A MENSAGEM NO CHAT (independente do conteúdo)
    const finalMessageId = messageId || `evo_${from}_${timestamp}`;
    
    try {
      // Verificar se a mensagem já foi processada (evitar duplicação)
      const existingMessage = await db.getChatMessageByExternalId(student.personalId, student.id, finalMessageId);
      if (existingMessage) {
        console.log('[Evolution Webhook] Mensagem já processada, ignorando duplicata:', finalMessageId);
        return { success: true, processed: false, error: 'duplicate_message' };
      }
      
      // Mapear tipo de mensagem para o tipo do chat
      const chatMessageType = messageType === 'document' ? 'file' : messageType;
      
      // Determinar senderType: se fromMe é true, é mensagem do personal enviada pelo WhatsApp
      const senderType = isFromMe ? 'personal' : 'student';
      
      // Criar mensagem no chat - centralizado no FitPrime Chat
      await db.createChatMessage({
        personalId: student.personalId,
        studentId: student.id,
        senderType: senderType,
        message: messageText || null,
        messageType: chatMessageType as any,
        mediaUrl: mediaUrl || null,
        mediaName: mediaUrl ? 'Mídia recebida via WhatsApp' : null,
        isRead: isFromMe ? true : false,
        source: 'internal',
        externalId: finalMessageId,
      });
      
      console.log('[Evolution Webhook] Mensagem salva no chat:', senderType === 'personal' ? 'Personal -> Aluno' : 'Aluno -> Personal', student.name, 'ID:', finalMessageId);
    } catch (chatError) {
      console.error('[Evolution Webhook] Erro ao salvar mensagem no chat:', chatError);
    }
    
    // Se for mensagem enviada pelo personal (fromMe), não precisa processar mais nada
    if (isFromMe) {
      console.log('[Evolution Webhook] Mensagem do personal salva, finalizando');
      return { success: true, processed: true, action: 'personal_message_saved' };
    }
    
    // Para mensagens recebidas do aluno, tentar responder com IA
    try {
      const aiAssistant = await import('./aiAssistant');
      console.log('[Evolution Webhook] Buscando config da IA para personalId:', student.personalId);
      const aiConfig = await aiAssistant.default.getAiConfig(student.personalId);
      
      if (aiConfig && aiConfig.isEnabled && aiConfig.enabledForStudents) {
        console.log('[Evolution Webhook] IA habilitada, processando resposta automática');
        
        // Processar mensagem com IA
        const mappedType = messageType === 'document' ? 'file' : messageType;
        const aiResponse = await aiAssistant.default.processMessage({
          personalId: student.personalId,
          phone: phone,
          message: messageText,
          messageType: mappedType as 'text' | 'image' | 'audio' | 'video' | 'file',
        });
        
        if (aiResponse && aiResponse.message && !aiResponse.shouldEscalate) {
          console.log('[Evolution Webhook] Resposta da IA gerada:', aiResponse.message.substring(0, 100) + '...');
          
          // Enviar resposta via Evolution API
          await sendEvolutionMessage(phone, aiResponse.message);
          
          return { success: true, processed: true, action: 'ai_response_sent' };
        }
      }
    } catch (aiError) {
      console.error('[Evolution Webhook] Erro ao processar IA:', aiError);
    }
    
    return { success: true, processed: true, action: 'message_saved' };
    
  } catch (error: any) {
    console.error('[Evolution Webhook] Erro:', error);
    return { success: false, processed: false, error: error?.message || 'Unknown error' };
  }
}

/**
 * Enviar mensagem via Evolution API
 */
export async function sendEvolutionMessage(phone: string, message: string): Promise<boolean> {
  try {
    // Formatar número com código do país
    const formattedPhone = phone.startsWith('55') ? phone : `55${phone}`;
    
    const response = await fetch('https://api.evoapicloud.com/message/sendText/fitprime-whatsapp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': 'A0364B581E58-4B2B-B1E7-2CF94A4CBF01',
      },
      body: JSON.stringify({
        number: formattedPhone,
        text: message,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Evolution API] Erro ao enviar mensagem:', errorText);
      return false;
    }
    
    console.log('[Evolution API] Mensagem enviada com sucesso para:', formattedPhone);
    return true;
  } catch (error) {
    console.error('[Evolution API] Erro ao enviar mensagem:', error);
    return false;
  }
}
