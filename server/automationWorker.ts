/**
 * Automation Worker - Processa automações de WhatsApp automaticamente
 * 
 * Este worker roda em intervalos regulares e verifica:
 * - Lembretes de sessão (24h e 2h antes)
 * - Lembretes de pagamento (3 dias antes, 2 dias antes, no dia)
 * - Pagamentos em atraso (3 dias depois)
 * - Aniversários
 * - Datas comemorativas
 * - Reengajamento de alunos inativos
 */

import * as db from './db';
import { sendWhatsAppMessage } from './stevo';

interface AutomationResult {
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Substitui variáveis no template de mensagem
 */
async function replaceMessageVariables(
  template: string,
  student: any,
  context: {
    session?: any;
    charge?: any;
  } = {}
): Promise<string> {
  let message = template
    .replace(/{nome}/g, student.name)
    .replace(/{telefone}/g, student.phone || '')
    .replace(/{email}/g, student.email || '')
    .replace(/{ano}/g, new Date().getFullYear().toString());
  
  // Variáveis de sessão
  if (context.session) {
    const sessionDate = new Date(context.session.scheduledAt);
    message = message
      .replace(/{hora}/g, sessionDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      .replace(/{data_sessao}/g, sessionDate.toLocaleDateString('pt-BR'));
  } else {
    // Buscar próxima sessão se não fornecida
    const sessions = await db.getSessionsByStudentId(student.id);
    const nextSession = sessions.find(s => new Date(s.scheduledAt) > new Date() && s.status === 'scheduled');
    if (nextSession) {
      const sessionDate = new Date(nextSession.scheduledAt);
      message = message
        .replace(/{hora}/g, sessionDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
        .replace(/{data_sessao}/g, sessionDate.toLocaleDateString('pt-BR'));
    } else {
      message = message
        .replace(/{hora}/g, '')
        .replace(/{data_sessao}/g, '');
    }
  }
  
  // Variáveis de pagamento
  if (context.charge) {
    message = message
      .replace(/{valor}/g, Number(context.charge.amount).toFixed(2).replace('.', ','))
      .replace(/{vencimento}/g, context.charge.dueDate ? new Date(context.charge.dueDate).toLocaleDateString('pt-BR') : '');
  } else {
    // Buscar cobrança pendente se não fornecida
    const charges = await db.getChargesByStudentId(student.id);
    const pendingCharge = charges.find(c => c.status === 'pending' || c.status === 'overdue');
    if (pendingCharge) {
      message = message
        .replace(/{valor}/g, Number(pendingCharge.amount).toFixed(2).replace('.', ','))
        .replace(/{vencimento}/g, pendingCharge.dueDate ? new Date(pendingCharge.dueDate).toLocaleDateString('pt-BR') : '');
    } else {
      message = message
        .replace(/{valor}/g, '')
        .replace(/{vencimento}/g, '');
    }
  }
  
  // Variáveis de aniversário
  if (student.birthDate) {
    message = message.replace(/{data_aniversario}/g, new Date(student.birthDate).toLocaleDateString('pt-BR'));
  } else {
    message = message.replace(/{data_aniversario}/g, '');
  }
  
  return message;
}

/**
 * Verifica se está dentro da janela de envio
 */
function isWithinSendWindow(startTime: string, endTime: string): boolean {
  const now = new Date();
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

/**
 * Processa lembretes de sessão
 */
export async function processSessionReminders(): Promise<AutomationResult> {
  const result: AutomationResult = { sent: 0, failed: 0, errors: [] };
  
  try {
    // Buscar todos os personais com WhatsApp configurado
    const personals = await db.getAllPersonals();
    
    for (const personal of personals) {
      if (!personal.evolutionApiKey || !personal.evolutionInstance) continue;
      
      // Buscar automações de lembrete de sessão ativas
      const automations = await db.getAutomationsByPersonalId(personal.id);
      const sessionReminders = automations.filter(
        a => a.trigger === 'session_reminder' && a.isActive
      );
      
      for (const automation of sessionReminders) {
        // Verificar janela de envio
        if (!isWithinSendWindow(automation.sendWindowStart || '08:00', automation.sendWindowEnd || '20:00')) {
          continue;
        }
        
        const hoursBeforeSession = automation.triggerHoursBefore || 24;
        const now = new Date();
        const targetTime = new Date(now.getTime() + hoursBeforeSession * 60 * 60 * 1000);
        
        // Buscar sessões que estão a X horas de distância (com margem de 30 minutos)
        const startWindow = new Date(targetTime.getTime() - 30 * 60 * 1000);
        const endWindow = new Date(targetTime.getTime() + 30 * 60 * 1000);
        
        const sessions = await db.getSessionsByPersonalId(personal.id, {
          startDate: startWindow,
          endDate: endWindow,
          status: 'scheduled'
        });
        
        for (const session of sessions) {
          const student = await db.getStudentById(session.studentId, personal.id);
          if (!student || !student.phone || !student.whatsappOptIn || student.status !== 'active') {
            continue;
          }
          
          // Verificar se já enviou lembrete para esta sessão hoje
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          const logs = await db.getMessageLogByPersonalId(personal.id, 100);
          const alreadySent = logs.some(
            log => log.log.studentId === student.id && 
                   new Date(log.log.createdAt) >= todayStart &&
                   log.log.message.includes('Lembrete') &&
                   log.log.message.includes('treino')
          );
          
          if (alreadySent) continue;
          
          try {
            const message = await replaceMessageVariables(
              automation.messageTemplate,
              student,
              { session }
            );
            
            const sendResult = await sendWhatsAppMessage({
              phone: student.phone,
              message,
              config: {
                apiKey: personal.evolutionApiKey,
                instanceName: personal.evolutionInstance,
                server: (personal as any).stevoServer || 'sm15',
              },
            });
            
            await db.createMessageLog({
              personalId: personal.id,
              studentId: student.id,
              phone: student.phone,
              message,
              direction: 'outbound',
              status: sendResult.success ? 'sent' : 'failed',
            });
            
            if (sendResult.success) {
              result.sent++;
              // Salvar no chat
              await db.createChatMessage({
                personalId: personal.id,
                studentId: student.id,
                senderType: 'personal',
                messageType: 'text',
                message,
                source: 'whatsapp',
              });
            } else {
              result.failed++;
              result.errors.push(`${student.name}: ${sendResult.error}`);
            }
          } catch (error: any) {
            result.failed++;
            result.errors.push(`${student.name}: ${error.message}`);
          }
        }
      }
    }
  } catch (error: any) {
    console.error('[AutomationWorker] Erro ao processar lembretes de sessão:', error);
    result.errors.push(`Erro geral: ${error.message}`);
  }
  
  return result;
}

/**
 * Processa lembretes de pagamento
 */
export async function processPaymentReminders(): Promise<AutomationResult> {
  const result: AutomationResult = { sent: 0, failed: 0, errors: [] };
  
  try {
    const personals = await db.getAllPersonals();
    
    for (const personal of personals) {
      if (!personal.evolutionApiKey || !personal.evolutionInstance) continue;
      
      const automations = await db.getAutomationsByPersonalId(personal.id);
      const paymentReminders = automations.filter(
        a => (a.trigger === 'payment_reminder' || 
              a.trigger === 'payment_reminder_2days' || 
              a.trigger === 'payment_reminder_dueday') && 
             a.isActive
      );
      
      for (const automation of paymentReminders) {
        if (!isWithinSendWindow(automation.sendWindowStart || '09:00', automation.sendWindowEnd || '18:00')) {
          continue;
        }
        
        const hoursBeforeDue = automation.triggerHoursBefore || 72;
        const now = new Date();
        const targetDate = new Date(now.getTime() + hoursBeforeDue * 60 * 60 * 1000);
        
        // Buscar cobranças pendentes com vencimento próximo
        const students = await db.getStudentsByPersonalId(personal.id);
        
        for (const student of students) {
          if (!student.phone || !student.whatsappOptIn || student.status !== 'active') continue;
          
          const charges = await db.getChargesByStudentId(student.id);
          const pendingCharges = charges.filter(c => c.status === 'pending');
          
          for (const charge of pendingCharges) {
            if (!charge.dueDate) continue;
            
            const dueDate = new Date(charge.dueDate);
            const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
            
            // Verificar se está na janela de envio (com margem de 2 horas)
            if (Math.abs(hoursUntilDue - hoursBeforeDue) > 2) continue;
            
            // Verificar se já enviou lembrete para esta cobrança
            const logs = await db.getMessageLogByPersonalId(personal.id, 100);
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const alreadySent = logs.some(
              log => log.log.studentId === student.id && 
                     new Date(log.log.createdAt) >= todayStart &&
                     log.log.message.includes('mensalidade')
            );
            
            if (alreadySent) continue;
            
            try {
              const message = await replaceMessageVariables(
                automation.messageTemplate,
                student,
                { charge }
              );
              
              const sendResult = await sendWhatsAppMessage({
                phone: student.phone,
                message,
                config: {
                  apiKey: personal.evolutionApiKey,
                  instanceName: personal.evolutionInstance,
                  server: (personal as any).stevoServer || 'sm15',
                },
              });
              
              await db.createMessageLog({
                personalId: personal.id,
                studentId: student.id,
                phone: student.phone,
                message,
                direction: 'outbound',
                status: sendResult.success ? 'sent' : 'failed',
              });
              
              if (sendResult.success) {
                result.sent++;
                await db.createChatMessage({
                  personalId: personal.id,
                  studentId: student.id,
                  senderType: 'personal',
                  messageType: 'text',
                  message,
                  source: 'whatsapp',
                });
              } else {
                result.failed++;
                result.errors.push(`${student.name}: ${sendResult.error}`);
              }
            } catch (error: any) {
              result.failed++;
              result.errors.push(`${student.name}: ${error.message}`);
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error('[AutomationWorker] Erro ao processar lembretes de pagamento:', error);
    result.errors.push(`Erro geral: ${error.message}`);
  }
  
  return result;
}

/**
 * Processa pagamentos em atraso
 */
export async function processOverduePayments(): Promise<AutomationResult> {
  const result: AutomationResult = { sent: 0, failed: 0, errors: [] };
  
  try {
    const personals = await db.getAllPersonals();
    
    for (const personal of personals) {
      if (!personal.evolutionApiKey || !personal.evolutionInstance) continue;
      
      const automations = await db.getAutomationsByPersonalId(personal.id);
      const overdueAutomations = automations.filter(
        a => a.trigger === 'payment_overdue' && a.isActive
      );
      
      for (const automation of overdueAutomations) {
        if (!isWithinSendWindow(automation.sendWindowStart || '09:00', automation.sendWindowEnd || '18:00')) {
          continue;
        }
        
        const daysAfterDue = automation.triggerDaysAfter || 3;
        const now = new Date();
        
        const students = await db.getStudentsByPersonalId(personal.id);
        
        for (const student of students) {
          if (!student.phone || !student.whatsappOptIn || student.status !== 'active') continue;
          
          const charges = await db.getChargesByStudentId(student.id);
          const overdueCharges = charges.filter(c => c.status === 'overdue' || 
            (c.status === 'pending' && c.dueDate && new Date(c.dueDate) < now));
          
          for (const charge of overdueCharges) {
            if (!charge.dueDate) continue;
            
            const dueDate = new Date(charge.dueDate);
            const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Verificar se está no dia correto de envio
            if (daysOverdue !== daysAfterDue) continue;
            
            // Verificar se já enviou
            const logs = await db.getMessageLogByPersonalId(personal.id, 100);
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);
            const alreadySent = logs.some(
              log => log.log.studentId === student.id && 
                     new Date(log.log.createdAt) >= todayStart &&
                     log.log.message.includes('atraso')
            );
            
            if (alreadySent) continue;
            
            try {
              const message = await replaceMessageVariables(
                automation.messageTemplate,
                student,
                { charge }
              );
              
              const sendResult = await sendWhatsAppMessage({
                phone: student.phone,
                message,
                config: {
                  apiKey: personal.evolutionApiKey,
                  instanceName: personal.evolutionInstance,
                  server: (personal as any).stevoServer || 'sm15',
                },
              });
              
              await db.createMessageLog({
                personalId: personal.id,
                studentId: student.id,
                phone: student.phone,
                message,
                direction: 'outbound',
                status: sendResult.success ? 'sent' : 'failed',
              });
              
              if (sendResult.success) {
                result.sent++;
                await db.createChatMessage({
                  personalId: personal.id,
                  studentId: student.id,
                  senderType: 'personal',
                  messageType: 'text',
                  message,
                  source: 'whatsapp',
                });
              } else {
                result.failed++;
                result.errors.push(`${student.name}: ${sendResult.error}`);
              }
            } catch (error: any) {
              result.failed++;
              result.errors.push(`${student.name}: ${error.message}`);
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error('[AutomationWorker] Erro ao processar pagamentos em atraso:', error);
    result.errors.push(`Erro geral: ${error.message}`);
  }
  
  return result;
}

/**
 * Processa aniversários
 */
export async function processBirthdays(): Promise<AutomationResult> {
  const result: AutomationResult = { sent: 0, failed: 0, errors: [] };
  
  try {
    const personals = await db.getAllPersonals();
    const today = new Date();
    const todayMonth = today.getMonth() + 1;
    const todayDay = today.getDate();
    
    for (const personal of personals) {
      if (!personal.evolutionApiKey || !personal.evolutionInstance) continue;
      
      const automations = await db.getAutomationsByPersonalId(personal.id);
      const birthdayAutomation = automations.find(
        a => a.trigger === 'birthday' && a.isActive
      );
      
      if (!birthdayAutomation) continue;
      
      if (!isWithinSendWindow(birthdayAutomation.sendWindowStart || '08:00', birthdayAutomation.sendWindowEnd || '20:00')) {
        continue;
      }
      
      const students = await db.getStudentsByPersonalId(personal.id);
      
      for (const student of students) {
        if (!student.phone || !student.whatsappOptIn || student.status !== 'active') continue;
        if (!student.birthDate) continue;
        
        const birthDate = new Date(student.birthDate);
        const birthMonth = birthDate.getMonth() + 1;
        const birthDay = birthDate.getDate();
        
        // Verificar se é aniversário hoje
        if (birthMonth !== todayMonth || birthDay !== todayDay) continue;
        
        // Verificar se já enviou
        const logs = await db.getMessageLogByPersonalId(personal.id, 100);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const alreadySent = logs.some(
          log => log.log.studentId === student.id && 
                 new Date(log.log.createdAt) >= todayStart &&
                 log.log.message.includes('aniversário')
        );
        
        if (alreadySent) continue;
        
        try {
          const message = await replaceMessageVariables(
            birthdayAutomation.messageTemplate,
            student,
            {}
          );
          
          const sendResult = await sendWhatsAppMessage({
            phone: student.phone,
            message,
            config: {
              apiKey: personal.evolutionApiKey,
              instanceName: personal.evolutionInstance,
              server: (personal as any).stevoServer || 'sm15',
            },
          });
          
          await db.createMessageLog({
            personalId: personal.id,
            studentId: student.id,
            phone: student.phone,
            message,
            direction: 'outbound',
            status: sendResult.success ? 'sent' : 'failed',
          });
          
          if (sendResult.success) {
            result.sent++;
            await db.createChatMessage({
              personalId: personal.id,
              studentId: student.id,
              senderType: 'personal',
              messageType: 'text',
              message,
              source: 'whatsapp',
            });
          } else {
            result.failed++;
            result.errors.push(`${student.name}: ${sendResult.error}`);
          }
        } catch (error: any) {
          result.failed++;
          result.errors.push(`${student.name}: ${error.message}`);
        }
      }
    }
  } catch (error: any) {
    console.error('[AutomationWorker] Erro ao processar aniversários:', error);
    result.errors.push(`Erro geral: ${error.message}`);
  }
  
  return result;
}

/**
 * Executa todas as automações
 */
export async function runAllAutomations(): Promise<{
  sessionReminders: AutomationResult;
  paymentReminders: AutomationResult;
  overduePayments: AutomationResult;
  birthdays: AutomationResult;
  totalSent: number;
  totalFailed: number;
}> {
  console.log('[AutomationWorker] Iniciando processamento de automações...');
  
  const sessionReminders = await processSessionReminders();
  const paymentReminders = await processPaymentReminders();
  const overduePayments = await processOverduePayments();
  const birthdays = await processBirthdays();
  
  const totalSent = sessionReminders.sent + paymentReminders.sent + overduePayments.sent + birthdays.sent;
  const totalFailed = sessionReminders.failed + paymentReminders.failed + overduePayments.failed + birthdays.failed;
  
  console.log(`[AutomationWorker] Processamento concluído: ${totalSent} enviados, ${totalFailed} falhas`);
  
  return {
    sessionReminders,
    paymentReminders,
    overduePayments,
    birthdays,
    totalSent,
    totalFailed,
  };
}

/**
 * Inicia o worker com intervalo de execução
 */
export function startAutomationWorker(intervalMinutes: number = 15): NodeJS.Timeout {
  console.log(`[AutomationWorker] Worker iniciado. Intervalo: ${intervalMinutes} minutos`);
  
  // Executar imediatamente na primeira vez
  runAllAutomations().catch(console.error);
  
  // Executar em intervalos
  return setInterval(() => {
    runAllAutomations().catch(console.error);
  }, intervalMinutes * 60 * 1000);
}

export default {
  runAllAutomations,
  startAutomationWorker,
  processSessionReminders,
  processPaymentReminders,
  processOverduePayments,
  processBirthdays,
};
