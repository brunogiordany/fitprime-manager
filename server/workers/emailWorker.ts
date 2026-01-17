/**
 * Email Worker - Processa envio automático de emails para leads
 * 
 * Este worker roda periodicamente e:
 * 1. Verifica novos leads que precisam receber emails de boas-vindas
 * 2. Verifica leads que não converteram após X dias (follow-up)
 * 3. Processa a fila de emails pendentes
 * 4. Registra métricas de envio
 */

import { getDb } from "../db";
import { 
  emailSequences, 
  leadEmailTemplates, 
  emailSends, 
  leadEmailSubscriptions,
  quizResponses
} from "../../drizzle/schema";
import { eq, and, sql, lte, isNull, not, inArray } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Intervalo de execução do worker (5 minutos)
const WORKER_INTERVAL = 5 * 60 * 1000;

// Função para substituir variáveis no template
function replaceTemplateVariables(content: string, lead: any): string {
  // Usar a URL base do projeto (variável de ambiente ou URL pública)
  const baseUrl = process.env.PUBLIC_URL || "https://fitprime-manager.manus.space";
  const unsubscribeUrl = `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(lead.leadEmail || "")}`;
  
  return content
    .replace(/\{\{leadName\}\}/g, lead.leadName || "Personal")
    .replace(/\{\{leadEmail\}\}/g, lead.leadEmail || "")
    .replace(/\{\{recommendedPlan\}\}/g, lead.recommendedPlan || "Pro")
    .replace(/\{\{studentsCount\}\}/g, lead.studentsCount?.toString() || "0")
    .replace(/\{\{revenue\}\}/g, lead.revenue || "Não informado")
    .replace(/\{\{unsubscribeUrl\}\}/g, unsubscribeUrl)
    .replace(/\{\{baseUrl\}\}/g, baseUrl);
}

// Verificar se email está inscrito
async function isEmailSubscribed(db: any, email: string): Promise<boolean> {
  const [subscription] = await db
    .select()
    .from(leadEmailSubscriptions)
    .where(eq(leadEmailSubscriptions.leadEmail, email));
  
  // Se não existe registro, está inscrito por padrão
  if (!subscription) return true;
  
  return subscription.isSubscribed;
}

// Verificar se lead já recebeu email de uma sequência
async function hasReceivedSequence(db: any, leadId: number, sequenceId: number): Promise<boolean> {
  const [existing] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(emailSends)
    .where(and(
      eq(emailSends.leadId, leadId),
      eq(emailSends.sequenceId, sequenceId)
    ));
  
  return (existing?.count || 0) > 0;
}

// Processar sequência de boas-vindas (quiz_completed)
async function processWelcomeSequence(db: any) {
  console.log("[EmailWorker] Processando sequência de boas-vindas...");
  
  // Buscar sequências ativas com trigger quiz_completed
  const sequences = await db
    .select()
    .from(emailSequences)
    .where(and(
      eq(emailSequences.trigger, "quiz_completed"),
      eq(emailSequences.isActive, true)
    ));
  
  for (const sequence of sequences) {
    // Buscar templates da sequência
    const templates = await db
      .select()
      .from(leadEmailTemplates)
      .where(and(
        eq(leadEmailTemplates.sequenceId, sequence.id),
        eq(leadEmailTemplates.isActive, true)
      ))
      .orderBy(leadEmailTemplates.position);
    
    if (templates.length === 0) continue;
    
    // Buscar leads recentes que ainda não receberam esta sequência
    // Leads criados nas últimas 24 horas
    const recentLeads = await db
      .select()
      .from(quizResponses)
      .where(and(
        sql`${quizResponses.createdAt} >= DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        sql`${quizResponses.leadEmail} IS NOT NULL`
      ));
    
    for (const lead of recentLeads) {
      if (!lead.leadEmail) continue;
      
      // Verificar se está inscrito
      if (!(await isEmailSubscribed(db, lead.leadEmail))) continue;
      
      // Verificar se já recebeu esta sequência
      if (await hasReceivedSequence(db, lead.id, sequence.id)) continue;
      
      // Agendar primeiro email da sequência
      const firstTemplate = templates[0];
      const scheduledAt = new Date();
      scheduledAt.setHours(scheduledAt.getHours() + firstTemplate.delayHours);
      scheduledAt.setDate(scheduledAt.getDate() + firstTemplate.delayDays);
      
      await db.insert(emailSends).values({
        leadId: lead.id,
        leadEmail: lead.leadEmail,
        sequenceId: sequence.id,
        templateId: firstTemplate.id,
        subject: replaceTemplateVariables(firstTemplate.subject, lead),
        status: "pending",
        scheduledAt,
      });
      
      console.log(`[EmailWorker] Email agendado para ${lead.leadEmail} (${sequence.name})`);
    }
  }
}

// Processar sequência de follow-up (days_without_conversion)
async function processFollowupSequence(db: any) {
  console.log("[EmailWorker] Processando sequência de follow-up...");
  
  // Buscar sequências ativas com trigger days_without_conversion
  const sequences = await db
    .select()
    .from(emailSequences)
    .where(and(
      eq(emailSequences.trigger, "days_without_conversion"),
      eq(emailSequences.isActive, true)
    ));
  
  for (const sequence of sequences) {
    // Buscar templates da sequência
    const templates = await db
      .select()
      .from(leadEmailTemplates)
      .where(and(
        eq(leadEmailTemplates.sequenceId, sequence.id),
        eq(leadEmailTemplates.isActive, true)
      ))
      .orderBy(leadEmailTemplates.position);
    
    if (templates.length === 0) continue;
    
    // Buscar leads que não converteram após X dias
    const triggerDays = sequence.triggerDays || 7;
    const leads = await db
      .select()
      .from(quizResponses)
      .where(and(
        sql`${quizResponses.createdAt} <= DATE_SUB(NOW(), INTERVAL ${triggerDays} DAY)`,
        sql`${quizResponses.createdAt} >= DATE_SUB(NOW(), INTERVAL ${triggerDays + 1} DAY)`,
        sql`${quizResponses}.convertedToPaid = false AND ${quizResponses}.convertedToTrial = false`,
        sql`${quizResponses.leadEmail} IS NOT NULL`
      ));
    
    for (const lead of leads) {
      if (!lead.leadEmail) continue;
      
      // Verificar se está inscrito
      if (!(await isEmailSubscribed(db, lead.leadEmail))) continue;
      
      // Verificar se já recebeu esta sequência
      if (await hasReceivedSequence(db, lead.id, sequence.id)) continue;
      
      // Agendar primeiro email da sequência
      const firstTemplate = templates[0];
      const scheduledAt = new Date();
      
      await db.insert(emailSends).values({
        leadId: lead.id,
        leadEmail: lead.leadEmail,
        sequenceId: sequence.id,
        templateId: firstTemplate.id,
        subject: replaceTemplateVariables(firstTemplate.subject, lead),
        status: "pending",
        scheduledAt,
      });
      
      console.log(`[EmailWorker] Follow-up agendado para ${lead.leadEmail} (${sequence.name})`);
    }
  }
}

// Processar fila de emails pendentes
async function processPendingEmails(db: any) {
  console.log("[EmailWorker] Processando emails pendentes...");
  
  // Buscar emails pendentes que já passaram da hora agendada
  const pendingEmails = await db
    .select({
      send: emailSends,
      template: leadEmailTemplates,
      lead: quizResponses,
    })
    .from(emailSends)
    .leftJoin(leadEmailTemplates, eq(emailSends.templateId, leadEmailTemplates.id))
    .leftJoin(quizResponses, eq(emailSends.leadId, quizResponses.id))
    .where(and(
      eq(emailSends.status, "pending"),
      lte(emailSends.scheduledAt, new Date())
    ))
    .limit(10); // Processar 10 por vez para não sobrecarregar
  
  for (const { send, template, lead } of pendingEmails) {
    if (!send || !template || !lead) continue;
    
    // Verificar se ainda está inscrito
    if (!(await isEmailSubscribed(db, send.leadEmail))) {
      await db
        .update(emailSends)
        .set({ status: "cancelled" })
        .where(eq(emailSends.id, send.id));
      continue;
    }
    
    // Verificar se lead converteu (cancelar follow-ups)
    // Nota: verificar conversão via campo convertedToPaid ou convertedToTrial
    if ((lead as any).convertedToPaid || (lead as any).convertedToTrial) {
      await db
        .update(emailSends)
        .set({ status: "cancelled" })
        .where(eq(emailSends.id, send.id));
      continue;
    }
    
    // Preparar conteúdo do email
    const htmlContent = replaceTemplateVariables(template.htmlContent, lead);
    const subject = replaceTemplateVariables(template.subject, lead);
    
    try {
      // Enviar email via Resend
      const result = await resend.emails.send({
        from: "FitPrime <noreply@fitprime.com.br>",
        to: send.leadEmail,
        subject,
        html: htmlContent,
      });
      
      // Atualizar status para enviado
      await db
        .update(emailSends)
        .set({
          status: "sent",
          sentAt: new Date(),
          resendId: result.data?.id,
        })
        .where(eq(emailSends.id, send.id));
      
      console.log(`[EmailWorker] Email enviado para ${send.leadEmail}: ${subject}`);
      
      // Agendar próximo email da sequência (se houver)
      await scheduleNextEmail(db, send, template, lead);
      
    } catch (error: any) {
      console.error(`[EmailWorker] Erro ao enviar email para ${send.leadEmail}:`, error.message);
      
      // Atualizar status para falha
      await db
        .update(emailSends)
        .set({
          status: "failed",
          errorMessage: error.message,
        })
        .where(eq(emailSends.id, send.id));
    }
    
    // Pequeno delay entre envios para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Agendar próximo email da sequência
async function scheduleNextEmail(db: any, currentSend: any, currentTemplate: any, lead: any) {
  // Buscar próximo template da sequência
  const [nextTemplate] = await db
    .select()
    .from(leadEmailTemplates)
    .where(and(
      eq(leadEmailTemplates.sequenceId, currentSend.sequenceId),
      eq(leadEmailTemplates.isActive, true),
      sql`${leadEmailTemplates.position} > ${currentTemplate.position}`
    ))
    .orderBy(leadEmailTemplates.position)
    .limit(1);
  
  if (!nextTemplate) return; // Não há mais emails na sequência
  
  // Calcular data de envio
  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + nextTemplate.delayDays);
  scheduledAt.setHours(scheduledAt.getHours() + nextTemplate.delayHours);
  
  // Agendar próximo email
  await db.insert(emailSends).values({
    leadId: currentSend.leadId,
    leadEmail: currentSend.leadEmail,
    sequenceId: currentSend.sequenceId,
    templateId: nextTemplate.id,
    subject: replaceTemplateVariables(nextTemplate.subject, lead),
    status: "pending",
    scheduledAt,
  });
  
  console.log(`[EmailWorker] Próximo email agendado para ${currentSend.leadEmail} em ${scheduledAt.toISOString()}`);
}

// Função principal do worker
async function runEmailWorker() {
  try {
    const db = await getDb();
    if (!db) {
      console.error("[EmailWorker] Database não disponível");
      return;
    }
    
    console.log("[EmailWorker] Iniciando processamento...");
    
    // Processar diferentes tipos de sequências
    await processWelcomeSequence(db);
    await processFollowupSequence(db);
    await processPendingEmails(db);
    
    console.log("[EmailWorker] Processamento concluído");
    
  } catch (error) {
    console.error("[EmailWorker] Erro:", error);
  }
}

// Iniciar worker
export function startEmailWorker() {
  console.log("[EmailWorker] Worker iniciado - intervalo de 5 minutos");
  
  // Executar imediatamente na primeira vez
  runEmailWorker();
  
  // Agendar execuções periódicas
  setInterval(runEmailWorker, WORKER_INTERVAL);
}

// Exportar para uso manual
export { runEmailWorker };
