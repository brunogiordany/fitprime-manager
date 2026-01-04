/**
 * Script de teste para enviar lembretes via WhatsApp
 * COM LINK DO FITPRIME CHAT
 */

// Configuração do Stevo
const config = {
  apiKey: '1767462392574JpuVNfwwzstKdXX5',
  instanceName: 'ea9857c453e5133e3a00045038a7b77e',
  server: 'sm15'
};

const STEVO_BASE_URL = `https://${config.server}.stevo.chat`;
const CHAT_LINK = 'https://fitprimemanager.com/login-aluno';

/**
 * Formata o número de telefone para o padrão internacional
 */
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned;
  }
  return cleaned;
}

/**
 * Envia uma mensagem de texto via Stevo
 */
async function sendWhatsAppMessage(phone, message) {
  const formattedPhone = formatPhoneNumber(phone);
  
  try {
    const endpoint = `${STEVO_BASE_URL}/chat/send/text`;
    
    console.log('[Stevo] Enviando mensagem para:', formattedPhone);
    console.log('[Stevo] Endpoint:', endpoint);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'token': config.apiKey,
      },
      body: JSON.stringify({
        Phone: formattedPhone,
        Body: message,
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

// Dados do teste
const studentName = 'Bruno';
const studentPhone = '15997612063';
const personalName = 'Personal Trainer';
const sessionTime = '21:30';

// Formatar data
const sessionDate = new Date();
const formattedDate = sessionDate.toLocaleDateString('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

// Mensagem de lembrete de sessão COM LINK
const sessionReminderMessage = `Olá ${studentName}! 👋

🏋️ *Lembrete de Treino*

📅 ${formattedDate}
⏰ ${sessionTime}

Não se esqueça do seu treino com ${personalName}!

💬 Responda pelo FitPrime Chat:
${CHAT_LINK}

_FitPrime Manager_`;

// Mensagem de lembrete de pagamento COM LINK
const paymentReminderMessage = `Olá ${studentName}! 👋

💳 *Lembrete de Pagamento*

📝 Mensalidade Janeiro/2026
💰 Valor: R$ 350,00
📅 Vencimento: 10/01/2026

Por favor, regularize seu pagamento para continuar aproveitando seus treinos!

💬 Responda pelo FitPrime Chat:
${CHAT_LINK}

_Personal Trainer - FitPrime Manager_`;

// Mensagem de boas-vindas COM LINK
const welcomeMessage = `Olá ${studentName}! 👋

🎉 *Bem-vindo(a) ao FitPrime!*

Estou muito feliz em ter você como aluno(a)! 

Juntos vamos alcançar seus objetivos de saúde e fitness. 💪

💬 Acesse seu portal e converse comigo:
${CHAT_LINK}

Qualquer dúvida, estou à disposição!

_${personalName} - FitPrime Manager_`;

// Mensagem de aniversário COM LINK
const birthdayMessage = `Olá ${studentName}! 🎂

🎉 *Feliz Aniversário!*

Desejo a você um dia incrível cheio de alegria e realizações!

Que este novo ano traga muita saúde, força e conquistas nos treinos! 💪

💬 Acesse seu portal:
${CHAT_LINK}

Um grande abraço!

_${personalName} - FitPrime Manager_`;

// Executar testes
async function runTests() {
  console.log('='.repeat(50));
  console.log('TESTE DE ENVIO DE LEMBRETES VIA WHATSAPP');
  console.log('COM LINK DO FITPRIME CHAT');
  console.log('='.repeat(50));
  console.log('');
  
  // Teste 1: Lembrete de Sessão
  console.log('📋 Teste 1: Lembrete de Sessão');
  console.log('-'.repeat(40));
  const result1 = await sendWhatsAppMessage(studentPhone, sessionReminderMessage);
  console.log('Resultado:', result1.success ? '✅ Sucesso' : '❌ Falhou');
  console.log('');
  
  // Aguardar 2 segundos entre mensagens
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 2: Lembrete de Pagamento
  console.log('💰 Teste 2: Lembrete de Pagamento');
  console.log('-'.repeat(40));
  const result2 = await sendWhatsAppMessage(studentPhone, paymentReminderMessage);
  console.log('Resultado:', result2.success ? '✅ Sucesso' : '❌ Falhou');
  console.log('');
  
  // Aguardar 2 segundos entre mensagens
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 3: Mensagem de Boas-vindas
  console.log('🎉 Teste 3: Mensagem de Boas-vindas');
  console.log('-'.repeat(40));
  const result3 = await sendWhatsAppMessage(studentPhone, welcomeMessage);
  console.log('Resultado:', result3.success ? '✅ Sucesso' : '❌ Falhou');
  console.log('');
  
  // Aguardar 2 segundos entre mensagens
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Teste 4: Mensagem de Aniversário
  console.log('🎂 Teste 4: Mensagem de Aniversário');
  console.log('-'.repeat(40));
  const result4 = await sendWhatsAppMessage(studentPhone, birthdayMessage);
  console.log('Resultado:', result4.success ? '✅ Sucesso' : '❌ Falhou');
  console.log('');
  
  console.log('='.repeat(50));
  console.log('TESTES CONCLUÍDOS');
  console.log('='.repeat(50));
}

runTests().catch(console.error);
