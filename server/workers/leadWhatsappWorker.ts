/**
 * Lead WhatsApp Worker - Processa automações de WhatsApp para leads
 * 
 * Este worker roda periodicamente e:
 * 1. Verifica novos leads que precisam receber mensagens de boas-vindas
 * 2. Processa esteiras de automação baseadas em temperatura do lead
 * 3. Envia mensagens de reativação para leads frios
 * 4. Registra métricas de envio
 */

import { getDb } from "../db";
import { 
  adminWhatsappAutomations,
  adminWhatsappMessages,
  adminWhatsappConfig,
  quizResponses,
  leadTags,
  leadTagAssignments
} from "../../drizzle/schema";
import { eq, and, sql, desc, gte, lte, isNull, or, not, inArray } from "drizzle-orm";
import { sendWhatsAppMessage } from "../stevo";

// Intervalo de execução do worker (10 minutos)
const WORKER_INTERVAL = 10 * 60 * 1000;

interface WorkerResult {
  sent: number;
  failed: number;
  errors: string[];
}

// Função para substituir variáveis no template
function replaceTemplateVariables(content: string, lead: any): string {
  const baseUrl = process.env.PUBLIC_URL || "https://fitprimemanager.com";
  const subscriptionLink = `${baseUrl}/planos-fitprime`;
  
  return content
    .replace(/\{\{nome\}\}/g, lead.leadName || "Personal")
    .replace(/\{\{email\}\}/g, lead.leadEmail || "")
    .replace(/\{\{telefone\}\}/g, lead.leadPhone || "")
    .replace(/\{\{plano_recomendado\}\}/g, lead.recommendedPlan || "Pro")
    .replace(/\{\{qtd_alunos\}\}/g, lead.studentsCount?.toString() || "0")
    .replace(/\{\{faturamento\}\}/g, lead.revenue || "Não informado")
    .replace(/\{\{link_assinatura\}\}/g, subscriptionLink)
    .replace(/\{\{baseUrl\}\}/g, baseUrl);
}

// Verificar se lead já recebeu mensagem de uma automação
async function hasReceivedAutomation(db: any, leadPhone: string, automationId: number): Promise<boolean> {
  const [existing] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(adminWhatsappMessages)
    .where(and(
      eq(adminWhatsappMessages.recipientPhone, leadPhone),
      eq(adminWhatsappMessages.automationId, automationId),
      eq(adminWhatsappMessages.status, "sent")
    ));
  
  return (existing?.count || 0) > 0;
}

// Calcular temperatura do lead baseado em interações
function calculateLeadTemperature(lead: any): 'cold' | 'warm' | 'hot' {
  const now = new Date();
  const createdAt = new Date(lead.createdAt);
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  // Lead quente: criado há menos de 3 dias
  if (daysSinceCreation <= 3) return 'hot';
  
  // Lead morno: criado há 4-14 dias
  if (daysSinceCreation <= 14) return 'warm';
  
  // Lead frio: criado há mais de 14 dias
  return 'cold';
}

// Processar automação de boas-vindas (quiz_completed)
async function processWelcomeAutomation(db: any, config: any): Promise<WorkerResult> {
  const result: WorkerResult = { sent: 0, failed: 0, errors: [] };
  
  console.log("[LeadWhatsappWorker] Processando automação de boas-vindas...");
  
  // Buscar automação de boas-vindas ativa (lead_trial_signup é o trigger para novos leads)
  const [automation] = await db
    .select()
    .from(adminWhatsappAutomations)
    .where(and(
      eq(adminWhatsappAutomations.trigger, "lead_trial_signup"),
      eq(adminWhatsappAutomations.isActive, true)
    ))
    .limit(1);
  
  if (!automation) {
    console.log("[LeadWhatsappWorker] Nenhuma automação de boas-vindas ativa");
    return result;
  }
  
  // Buscar leads recentes que ainda não receberam mensagem de boas-vindas
  // Leads criados nas últimas 24 horas com telefone
  const recentLeads = await db
    .select()
    .from(quizResponses)
    .where(and(
      sql`${quizResponses.createdAt} >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
      sql`${quizResponses.leadPhone} IS NOT NULL`,
      sql`${quizResponses.leadPhone} != ''`
    ));
  
  console.log(`[LeadWhatsappWorker] ${recentLeads.length} leads recentes encontrados`);
  
  for (const lead of recentLeads) {
    if (!lead.leadPhone) continue;
    
    // Verificar se já recebeu esta automação
    if (await hasReceivedAutomation(db, lead.leadPhone, automation.id)) {
      continue;
    }
    
    // Preparar mensagem
    const message = replaceTemplateVariables(automation.messageTemplate, lead);
    
    try {
      // Enviar mensagem
      const sendResult = await sendWhatsAppMessage({
        phone: lead.leadPhone,
        message,
        config: {
          apiKey: config.stevoApiKey,
          instanceName: config.stevoInstanceName,
          server: config.stevoServer || 'sm15',
        },
      });
      
      // Registrar envio
      await db.insert(adminWhatsappMessages).values({
        recipientType: "lead",
        recipientId: lead.id,
        recipientPhone: lead.leadPhone,
        recipientName: lead.leadName,
        message,
        status: sendResult.success ? "sent" : "failed",
        automationId: automation.id,
        errorMessage: sendResult.error,
      });
      
      if (sendResult.success) {
        result.sent++;
        console.log(`[LeadWhatsappWorker] Mensagem de boas-vindas enviada para ${lead.leadName} (${lead.leadPhone})`);
      } else {
        result.failed++;
        result.errors.push(`${lead.leadName}: ${sendResult.error}`);
      }
    } catch (error: any) {
      result.failed++;
      result.errors.push(`${lead.leadName}: ${error.message}`);
    }
  }
  
  return result;
}

// Processar automação de follow-up (dias sem conversão)
async function processFollowupAutomation(db: any, config: any): Promise<WorkerResult> {
  const result: WorkerResult = { sent: 0, failed: 0, errors: [] };
  
  console.log("[LeadWhatsappWorker] Processando automação de follow-up...");
  
  // Buscar automação de follow-up ativa (lead_followup_2days como padrão)
  const [automation] = await db
    .select()
    .from(adminWhatsappAutomations)
    .where(and(
      eq(adminWhatsappAutomations.trigger, "lead_followup_2days"),
      eq(adminWhatsappAutomations.isActive, true)
    ))
    .limit(1);
  
  if (!automation) {
    console.log("[LeadWhatsappWorker] Nenhuma automação de follow-up ativa");
    return result;
  }
  
  const triggerDays = automation.triggerDays || 3;
  
  // Buscar leads que não converteram após X dias
  const leads = await db
    .select()
    .from(quizResponses)
    .where(and(
      sql`${quizResponses.createdAt} <= DATE_SUB(NOW(), INTERVAL ${triggerDays} DAY)`,
      sql`${quizResponses.createdAt} >= DATE_SUB(NOW(), INTERVAL ${triggerDays + 1} DAY)`,
      sql`${quizResponses.convertedToPaid} = false`,
      sql`${quizResponses.convertedToTrial} = false`,
      sql`${quizResponses.leadPhone} IS NOT NULL`,
      sql`${quizResponses.leadPhone} != ''`
    ));
  
  console.log(`[LeadWhatsappWorker] ${leads.length} leads para follow-up encontrados`);
  
  for (const lead of leads) {
    if (!lead.leadPhone) continue;
    
    // Verificar se já recebeu esta automação
    if (await hasReceivedAutomation(db, lead.leadPhone, automation.id)) {
      continue;
    }
    
    // Preparar mensagem
    const message = replaceTemplateVariables(automation.messageTemplate, lead);
    
    try {
      // Enviar mensagem
      const sendResult = await sendWhatsAppMessage({
        phone: lead.leadPhone,
        message,
        config: {
          apiKey: config.stevoApiKey,
          instanceName: config.stevoInstanceName,
          server: config.stevoServer || 'sm15',
        },
      });
      
      // Registrar envio
      await db.insert(adminWhatsappMessages).values({
        recipientType: "lead",
        recipientId: lead.id,
        recipientPhone: lead.leadPhone,
        recipientName: lead.leadName,
        message,
        status: sendResult.success ? "sent" : "failed",
        automationId: automation.id,
        errorMessage: sendResult.error,
      });
      
      if (sendResult.success) {
        result.sent++;
        console.log(`[LeadWhatsappWorker] Follow-up enviado para ${lead.leadName} (${lead.leadPhone})`);
      } else {
        result.failed++;
        result.errors.push(`${lead.leadName}: ${sendResult.error}`);
      }
    } catch (error: any) {
      result.failed++;
      result.errors.push(`${lead.leadName}: ${error.message}`);
    }
  }
  
  return result;
}

// Processar automação de reativação por temperatura
async function processReactivationAutomation(db: any, config: any): Promise<WorkerResult> {
  const result: WorkerResult = { sent: 0, failed: 0, errors: [] };
  
  console.log("[LeadWhatsappWorker] Processando automação de reativação...");
  
  // Buscar automações de reativação ativas
  const automations = await db
    .select()
    .from(adminWhatsappAutomations)
    .where(and(
      sql`${adminWhatsappAutomations.trigger} IN ('lead_reactivation_cold', 'lead_reactivation_warm', 'lead_reactivation_hot')`,
      eq(adminWhatsappAutomations.isActive, true)
    ));
  
  if (automations.length === 0) {
    console.log("[LeadWhatsappWorker] Nenhuma automação de reativação ativa");
    return result;
  }
  
  // Buscar todos os leads que não converteram
  const leads = await db
    .select()
    .from(quizResponses)
    .where(and(
      sql`${quizResponses.convertedToPaid} = false`,
      sql`${quizResponses.convertedToTrial} = false`,
      sql`${quizResponses.leadPhone} IS NOT NULL`,
      sql`${quizResponses.leadPhone} != ''`
    ));
  
  console.log(`[LeadWhatsappWorker] ${leads.length} leads para reativação encontrados`);
  
  for (const lead of leads) {
    if (!lead.leadPhone) continue;
    
    // Calcular temperatura do lead
    const temperature = calculateLeadTemperature(lead);
    
    // Encontrar automação correspondente à temperatura
    const triggerMap: Record<string, string> = {
      'cold': 'lead_reactivation_cold',
      'warm': 'lead_reactivation_warm',
      'hot': 'lead_reactivation_hot',
    };
    
    const automation = automations.find((a: any) => a.trigger === triggerMap[temperature]);
    if (!automation) continue;
    
    // Verificar se já recebeu esta automação
    if (await hasReceivedAutomation(db, lead.leadPhone, automation.id)) {
      continue;
    }
    
    // Preparar mensagem
    const message = replaceTemplateVariables(automation.messageTemplate, lead);
    
    try {
      // Enviar mensagem
      const sendResult = await sendWhatsAppMessage({
        phone: lead.leadPhone,
        message,
        config: {
          apiKey: config.stevoApiKey,
          instanceName: config.stevoInstanceName,
          server: config.stevoServer || 'sm15',
        },
      });
      
      // Registrar envio
      await db.insert(adminWhatsappMessages).values({
        recipientType: "lead",
        recipientId: lead.id,
        recipientPhone: lead.leadPhone,
        recipientName: lead.leadName,
        message,
        status: sendResult.success ? "sent" : "failed",
        automationId: automation.id,
        errorMessage: sendResult.error,
      });
      
      if (sendResult.success) {
        result.sent++;
        console.log(`[LeadWhatsappWorker] Reativação (${temperature}) enviada para ${lead.leadName} (${lead.leadPhone})`);
      } else {
        result.failed++;
        result.errors.push(`${lead.leadName}: ${sendResult.error}`);
      }
    } catch (error: any) {
      result.failed++;
      result.errors.push(`${lead.leadName}: ${error.message}`);
    }
  }
  
  return result;
}

// Processar leads históricos que nunca receberam mensagens
async function processHistoricalLeads(db: any, config: any): Promise<WorkerResult> {
  const result: WorkerResult = { sent: 0, failed: 0, errors: [] };
  
  console.log("[LeadWhatsappWorker] Processando leads históricos...");
  
  // Buscar automação de boas-vindas para usar como base
  const [welcomeAutomation] = await db
    .select()
    .from(adminWhatsappAutomations)
    .where(and(
      eq(adminWhatsappAutomations.trigger, "lead_trial_signup"),
      eq(adminWhatsappAutomations.isActive, true)
    ))
    .limit(1);
  
  if (!welcomeAutomation) {
    console.log("[LeadWhatsappWorker] Nenhuma automação de boas-vindas ativa para leads históricos");
    return result;
  }
  
  // Buscar leads que nunca receberam nenhuma mensagem
  // Subquery para pegar phones que já receberam mensagens
  const leadsWithMessages = await db
    .select({ phone: adminWhatsappMessages.recipientPhone })
    .from(adminWhatsappMessages)
    .where(eq(adminWhatsappMessages.recipientType, "lead"));
  
  const phonesWithMessages = leadsWithMessages.map((l: any) => l.phone).filter(Boolean);
  
  // Buscar leads que não estão na lista de quem já recebeu
  let historicalLeads;
  if (phonesWithMessages.length > 0) {
    historicalLeads = await db
      .select()
      .from(quizResponses)
      .where(and(
        sql`${quizResponses.leadPhone} IS NOT NULL`,
        sql`${quizResponses.leadPhone} != ''`,
        not(inArray(quizResponses.leadPhone, phonesWithMessages))
      ))
      .limit(50); // Processar 50 por vez para não sobrecarregar
  } else {
    historicalLeads = await db
      .select()
      .from(quizResponses)
      .where(and(
        sql`${quizResponses.leadPhone} IS NOT NULL`,
        sql`${quizResponses.leadPhone} != ''`
      ))
      .limit(50);
  }
  
  console.log(`[LeadWhatsappWorker] ${historicalLeads.length} leads históricos encontrados`);
  
  for (const lead of historicalLeads) {
    if (!lead.leadPhone) continue;
    
    // Calcular temperatura do lead
    const temperature = calculateLeadTemperature(lead);
    
    // Buscar automação correspondente à temperatura
    const triggerMap: Record<string, string> = {
      'cold': 'lead_reactivation_cold',
      'warm': 'lead_reactivation_warm',
      'hot': 'lead_trial_signup', // Leads quentes recebem boas-vindas
    };
    
    // Usar SQL raw para evitar problemas de tipo
    const [automation] = await db
      .select()
      .from(adminWhatsappAutomations)
      .where(and(
        sql`${adminWhatsappAutomations.trigger} = ${triggerMap[temperature]}`,
        eq(adminWhatsappAutomations.isActive, true)
      ))
      .limit(1);
    
    if (!automation) continue;
    
    // Preparar mensagem
    const message = replaceTemplateVariables(automation.messageTemplate, lead);
    
    try {
      // Enviar mensagem
      const sendResult = await sendWhatsAppMessage({
        phone: lead.leadPhone,
        message,
        config: {
          apiKey: config.stevoApiKey,
          instanceName: config.stevoInstanceName,
          server: config.stevoServer || 'sm15',
        },
      });
      
      // Registrar envio
      await db.insert(adminWhatsappMessages).values({
        recipientType: "lead",
        recipientId: lead.id,
        recipientPhone: lead.leadPhone,
        recipientName: lead.leadName,
        message,
        status: sendResult.success ? "sent" : "failed",
        automationId: automation.id,
        errorMessage: sendResult.error,
      });
      
      if (sendResult.success) {
        result.sent++;
        console.log(`[LeadWhatsappWorker] Mensagem histórica (${temperature}) enviada para ${lead.leadName} (${lead.leadPhone})`);
      } else {
        result.failed++;
        result.errors.push(`${lead.leadName}: ${sendResult.error}`);
      }
      
      // Delay entre envios para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error: any) {
      result.failed++;
      result.errors.push(`${lead.leadName}: ${error.message}`);
    }
  }
  
  return result;
}

// Executar todas as automações de leads
export async function runLeadAutomations(): Promise<{
  welcome: WorkerResult;
  followup: WorkerResult;
  reactivation: WorkerResult;
  historical: WorkerResult;
  totalSent: number;
  totalFailed: number;
}> {
  console.log("[LeadWhatsappWorker] Iniciando processamento de automações de leads...");
  
  const db = await getDb();
  if (!db) {
    console.error("[LeadWhatsappWorker] Database não disponível");
    return {
      welcome: { sent: 0, failed: 0, errors: ["Database não disponível"] },
      followup: { sent: 0, failed: 0, errors: [] },
      reactivation: { sent: 0, failed: 0, errors: [] },
      historical: { sent: 0, failed: 0, errors: [] },
      totalSent: 0,
      totalFailed: 0,
    };
  }
  
  // Buscar configuração do WhatsApp admin
  const [config] = await db.select().from(adminWhatsappConfig).limit(1);
  
  if (!config?.stevoApiKey || !config?.stevoInstanceName) {
    console.log("[LeadWhatsappWorker] WhatsApp admin não configurado");
    return {
      welcome: { sent: 0, failed: 0, errors: ["WhatsApp não configurado"] },
      followup: { sent: 0, failed: 0, errors: [] },
      reactivation: { sent: 0, failed: 0, errors: [] },
      historical: { sent: 0, failed: 0, errors: [] },
      totalSent: 0,
      totalFailed: 0,
    };
  }
  
  // Processar cada tipo de automação
  const welcome = await processWelcomeAutomation(db, config);
  const followup = await processFollowupAutomation(db, config);
  const reactivation = await processReactivationAutomation(db, config);
  const historical = await processHistoricalLeads(db, config);
  
  const totalSent = welcome.sent + followup.sent + reactivation.sent + historical.sent;
  const totalFailed = welcome.failed + followup.failed + reactivation.failed + historical.failed;
  
  console.log(`[LeadWhatsappWorker] Processamento concluído: ${totalSent} enviados, ${totalFailed} falhas`);
  
  return {
    welcome,
    followup,
    reactivation,
    historical,
    totalSent,
    totalFailed,
  };
}

// Iniciar worker com intervalo de execução
export function startLeadWhatsappWorker(intervalMinutes: number = 10): NodeJS.Timeout {
  console.log(`[LeadWhatsappWorker] Worker iniciado. Intervalo: ${intervalMinutes} minutos`);
  
  // Executar imediatamente na primeira vez
  runLeadAutomations().catch(console.error);
  
  // Executar em intervalos
  return setInterval(() => {
    runLeadAutomations().catch(console.error);
  }, intervalMinutes * 60 * 1000);
}

export default {
  runLeadAutomations,
  startLeadWhatsappWorker,
};
