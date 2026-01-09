/**
 * Payt Webhook Handler
 * 
 * Processes webhook events from Payt payment platform (afiliados e influenciadores).
 * 
 * Documentação: https://github.com/ventuinha/payt-postback
 * 
 * Lógica de comissão: Apenas o primeiro pagamento vai para o afiliado.
 * Renovações subsequentes ficam 100% para o produtor.
 */

import type { Request, Response } from "express";
import crypto from "crypto";
import * as db from "../db";
import { sendPurchaseActivationEmail, sendSubscriptionConfirmationEmail } from "../email";
import { PLANS } from "../../shared/plans";
import {
  PaytWebhookPayload,
  PaytPostbackStatus,
  validatePaytWebhook,
  isFirstCharge,
  extractCustomerData,
  formatCentsToReais,
} from "../payt";

// Chave de integração da Payt (configurar nas variáveis de ambiente)
const PAYT_INTEGRATION_KEY = process.env.PAYT_INTEGRATION_KEY || "";

// Mapeamento de códigos de produto da Payt para planos do FitPrime
// IMPORTANTE: Você precisa criar os produtos na Payt e atualizar esses códigos
const PAYT_PRODUCT_TO_PLAN: Record<string, { planId: string; isAnnual: boolean }> = {
  // Planos mensais - atualizar com os códigos reais da Payt
  "FITPRIME_BEGINNER": { planId: "beginner", isAnnual: false },
  "FITPRIME_STARTER": { planId: "starter", isAnnual: false },
  "FITPRIME_PRO": { planId: "pro", isAnnual: false },
  "FITPRIME_BUSINESS": { planId: "business", isAnnual: false },
  "FITPRIME_PREMIUM": { planId: "premium", isAnnual: false },
  "FITPRIME_ENTERPRISE": { planId: "enterprise", isAnnual: false },
  
  // Planos anuais - atualizar com os códigos reais da Payt
  "FITPRIME_STARTER_ANUAL": { planId: "starter", isAnnual: true },
  "FITPRIME_PRO_ANUAL": { planId: "pro", isAnnual: true },
  "FITPRIME_BUSINESS_ANUAL": { planId: "business", isAnnual: true },
  "FITPRIME_PREMIUM_ANUAL": { planId: "premium", isAnnual: true },
  "FITPRIME_ENTERPRISE_ANUAL": { planId: "enterprise", isAnnual: true },
};

/**
 * Mapeia código do produto para plano
 */
function mapProductToPlan(productCode: string): { planId: string; isAnnual: boolean } | null {
  // Primeiro tenta match exato
  if (PAYT_PRODUCT_TO_PLAN[productCode]) {
    return PAYT_PRODUCT_TO_PLAN[productCode];
  }
  
  // Tenta match por nome parcial (case insensitive)
  const normalizedCode = productCode.toUpperCase();
  for (const [key, value] of Object.entries(PAYT_PRODUCT_TO_PLAN)) {
    if (normalizedCode.includes(key) || key.includes(normalizedCode)) {
      return value;
    }
  }
  
  // Tenta identificar pelo nome do produto
  if (normalizedCode.includes("BEGINNER")) return { planId: "beginner", isAnnual: normalizedCode.includes("ANUAL") };
  if (normalizedCode.includes("STARTER")) return { planId: "starter", isAnnual: normalizedCode.includes("ANUAL") };
  if (normalizedCode.includes("PRO")) return { planId: "pro", isAnnual: normalizedCode.includes("ANUAL") };
  if (normalizedCode.includes("BUSINESS")) return { planId: "business", isAnnual: normalizedCode.includes("ANUAL") };
  if (normalizedCode.includes("PREMIUM")) return { planId: "premium", isAnnual: normalizedCode.includes("ANUAL") };
  if (normalizedCode.includes("ENTERPRISE")) return { planId: "enterprise", isAnnual: normalizedCode.includes("ANUAL") };
  
  return null;
}

/**
 * Calcula datas de período baseado no tipo de plano
 */
function calculatePeriodDates(isAnnual: boolean): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);
  
  if (isAnnual) {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  
  return { start, end };
}

/**
 * Handle incoming Payt webhook
 */
export async function handlePaytWebhook(req: Request, res: Response) {
  try {
    const payload = req.body as PaytWebhookPayload;
    
    console.log("[Payt Webhook] ========================================");
    console.log("[Payt Webhook] Received event - Status:", payload.status);
    console.log("[Payt Webhook] Type:", payload.type);
    console.log("[Payt Webhook] Transaction ID:", payload.transaction_id);
    console.log("[Payt Webhook] Customer:", payload.customer?.email);
    console.log("[Payt Webhook] Product:", payload.product?.name, "Code:", payload.product?.code);
    console.log("[Payt Webhook] Test mode:", payload.test);
    
    // Validar integration_key (se configurada)
    if (PAYT_INTEGRATION_KEY && !validatePaytWebhook(payload, PAYT_INTEGRATION_KEY)) {
      console.error("[Payt Webhook] Invalid integration key");
      return res.status(401).json({ success: false, error: "Invalid integration key" });
    }
    
    // Ignorar eventos de teste em produção (opcional)
    if (payload.test && process.env.NODE_ENV === "production") {
      console.log("[Payt Webhook] Ignoring test event in production");
      return res.status(200).json({ success: true, message: "Test event ignored" });
    }
    
    // Log do webhook
    await logWebhookEvent(payload);
    
    // Processar baseado no status
    const action = await processPaytStatus(payload);
    
    console.log("[Payt Webhook] Action taken:", action);
    console.log("[Payt Webhook] ========================================");
    
    // Sempre responde 200 para confirmar recebimento
    res.status(200).json({ success: true, action });
  } catch (error) {
    console.error("[Payt Webhook] Error processing webhook:", error);
    // Responde 200 mesmo com erro para evitar retries infinitos
    res.status(200).json({ success: false, error: "Processing error" });
  }
}

/**
 * Processa o status do webhook e executa a ação apropriada
 */
async function processPaytStatus(payload: PaytWebhookPayload): Promise<string> {
  const status = payload.status;
  
  switch (status) {
    case "paid":
    case "billed":
      return await handlePurchaseApproved(payload);
      
    case "subscription_activated":
      return await handleSubscriptionActivated(payload);
      
    case "subscription_renewed":
      return await handleSubscriptionRenewed(payload);
      
    case "subscription_canceled":
    case "canceled":
      return await handleCancellation(payload);
      
    case "subscription_overdue":
      return await handleOverdue(payload);
      
    case "subscription_reactivated":
      return await handleReactivation(payload);
      
    case "waiting_payment":
      console.log("[Payt Webhook] Waiting payment - no action needed");
      return "waiting";
      
    case "lost_cart":
      console.log("[Payt Webhook] Lost cart - no action needed");
      return "lost_cart";
      
    default:
      console.log("[Payt Webhook] Unknown status:", status);
      return "unknown";
  }
}

/**
 * Handle purchase approved (paid, billed)
 */
async function handlePurchaseApproved(payload: PaytWebhookPayload): Promise<string> {
  const customer = extractCustomerData(payload.customer);
  const productCode = payload.product.code;
  const productName = payload.product.name;
  const amount = payload.transaction.total_price; // em centavos
  
  console.log("[Payt Webhook] Processing purchase for:", customer.email);
  console.log("[Payt Webhook] Product:", productName, "Code:", productCode);
  console.log("[Payt Webhook] Amount:", formatCentsToReais(amount));
  
  // Verificar se é primeira cobrança (para comissão de afiliado)
  const firstCharge = isFirstCharge(payload.subscription);
  console.log("[Payt Webhook] First charge (affiliate commission):", firstCharge);
  
  // Log de comissões
  if (payload.commission && payload.commission.length > 0) {
    console.log("[Payt Webhook] Commissions:");
    payload.commission.forEach(c => {
      console.log(`  - ${c.type}: ${c.name} (${c.email}) - ${formatCentsToReais(c.amount)}`);
    });
  }
  
  // Mapear produto para plano
  const planMapping = mapProductToPlan(productCode) || mapProductToPlan(productName);
  const planId = planMapping?.planId || "starter";
  const isAnnual = planMapping?.isAnnual || false;
  const plan = PLANS[planId];
  const { start: periodStart, end: periodEnd } = calculatePeriodDates(isAnnual);
  
  console.log("[Payt Webhook] Plan:", planId, "Annual:", isAnnual);
  
  // Buscar usuário por email
  const user = await db.getUserByEmail(customer.email);
  
  if (user) {
    // Usuário já existe - ativar assinatura
    await activateExistingUser(user, payload, planId, isAnnual, plan, periodStart, periodEnd);
    return "activated_existing";
  } else {
    // Usuário novo - criar pending activation
    await createPendingActivation(payload, customer, planId, productName, amount);
    return "pending_activation";
  }
}

/**
 * Ativa assinatura para usuário existente
 */
async function activateExistingUser(
  user: any,
  payload: PaytWebhookPayload,
  planId: string,
  isAnnual: boolean,
  plan: any,
  periodStart: Date,
  periodEnd: Date
) {
  const amount = payload.transaction.total_price;
  
  // Atualizar status da assinatura do usuário
    // Usar caktoOrderId para compatibilidade com o schema existente
    await db.updateUserSubscription(user.id, {
      status: "active",
      caktoOrderId: `payt_${payload.transaction_id}`,
      caktoSubscriptionId: payload.subscription?.code,
      paidAt: new Date(),
      amount,
    });
  
  // Buscar personal associado ao usuário
  const personal = await db.getPersonalByUserId(user.id);
  
  if (personal) {
    // Criar ou atualizar personal_subscription
    await createOrUpdatePersonalSubscription({
      personalId: personal.id,
      planId: `fitprime_br_${planId}`,
      planName: plan?.name || "Starter",
      studentLimit: isAnnual ? (plan?.annualStudentLimit || 15) : (plan?.studentLimit || 15),
      planPrice: isAnnual ? (plan?.annualPrice || 932) : (plan?.price || 97),
      extraStudentPrice: plan?.extraStudentPrice || 6.47,
      status: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      billingPeriod: isAnnual ? "annual" : "monthly",
      paytOrderId: payload.transaction_id,
      paytSubscriptionId: payload.subscription?.code,
    });
    
    console.log("[Payt Webhook] Personal subscription updated for:", personal.id);
  }
  
  console.log("[Payt Webhook] Access activated for user:", user.id);
  
  // Enviar email de confirmação
  try {
    await sendSubscriptionConfirmationEmail(
      payload.customer.email,
      payload.customer.name || user.name || "",
      plan?.name || "Plano FitPrime",
      amount,
      periodEnd
    );
    console.log("[Payt Webhook] Confirmation email sent to:", payload.customer.email);
  } catch (emailError) {
    console.error("[Payt Webhook] Failed to send confirmation email:", emailError);
  }
}

/**
 * Cria pending activation para usuário novo
 */
async function createPendingActivation(
  payload: PaytWebhookPayload,
  customer: { name: string; email: string; phone: string; cpf: string },
  planId: string,
  productName: string,
  amount: number
) {
  console.log("[Payt Webhook] Creating pending activation for:", customer.email);
  
  // Gerar token de ativação
  const activationToken = crypto.randomUUID();
  const tokenExpiresAt = new Date();
  tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // 7 dias de validade
  
  // Usar caktoOrderId para compatibilidade com o schema existente (prefixo payt_ para diferenciar)
  await db.createPendingActivation({
    email: customer.email,
    phone: customer.phone || null,
    name: customer.name || null,
    caktoOrderId: `payt_${payload.transaction_id}`,
    caktoSubscriptionId: payload.subscription?.code || null,
    productId: payload.product.code,
    productName: productName || null,
    amount: String(amount),
    planType: planId as any,
    activationToken,
    tokenExpiresAt,
  });
  
  // Enviar email com link de ativação
  const baseUrl = process.env.VITE_APP_URL || "https://fitprimemanager.com";
  const activationLink = `${baseUrl}/ativar-conta/${activationToken}`;
  
  await sendPurchaseActivationEmail(
    customer.email,
    customer.name || "",
    productName || "Plano FitPrime",
    amount,
    activationLink
  );
  
  console.log("[Payt Webhook] Activation email sent to:", customer.email);
}

/**
 * Handle subscription activated
 */
async function handleSubscriptionActivated(payload: PaytWebhookPayload): Promise<string> {
  console.log("[Payt Webhook] Subscription activated:", payload.subscription?.code);
  // Mesma lógica de purchase approved
  return await handlePurchaseApproved(payload);
}

/**
 * Handle subscription renewed
 * IMPORTANTE: Renovações não geram comissão para afiliado
 */
async function handleSubscriptionRenewed(payload: PaytWebhookPayload): Promise<string> {
  const customer = extractCustomerData(payload.customer);
  
  console.log("[Payt Webhook] Subscription renewed for:", customer.email);
  console.log("[Payt Webhook] Charge number:", payload.subscription?.charges);
  console.log("[Payt Webhook] NOTE: No affiliate commission for renewals");
  
  // Buscar usuário
  const user = await db.getUserByEmail(customer.email);
  
  if (user) {
    // Atualizar assinatura
    await db.updateUserSubscription(user.id, {
      status: "active",
      renewedAt: new Date(),
      amount: payload.transaction.total_price,
    });
    
    // Atualizar período da subscription
    const personal = await db.getPersonalByUserId(user.id);
    if (personal) {
      const subscription = await db.getPersonalSubscription(personal.id);
      if (subscription) {
        const isAnnual = subscription.planId?.includes("anual") || false;
        const { end: newPeriodEnd } = calculatePeriodDates(isAnnual);
        
        await db.updatePersonalSubscriptionFull(personal.id, {
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: newPeriodEnd,
        });
      }
    }
    
    console.log("[Payt Webhook] Subscription renewed for user:", user.id);
    return "renewed";
  }
  
  console.log("[Payt Webhook] User not found for renewal:", customer.email);
  return "user_not_found";
}

/**
 * Handle cancellation
 */
async function handleCancellation(payload: PaytWebhookPayload): Promise<string> {
  const customer = extractCustomerData(payload.customer);
  
  console.log("[Payt Webhook] Cancellation for:", customer.email);
  console.log("[Payt Webhook] Subscription status:", payload.subscription?.status);
  
  const user = await db.getUserByEmail(customer.email);
  
  if (user) {
    await db.updateUserSubscription(user.id, {
      status: "canceled",
      canceledAt: new Date(),
    });
    
    console.log("[Payt Webhook] Access deactivated for user:", user.id);
    return "canceled";
  }
  
  console.log("[Payt Webhook] User not found for cancellation:", customer.email);
  return "user_not_found";
}

/**
 * Handle overdue (atraso)
 */
async function handleOverdue(payload: PaytWebhookPayload): Promise<string> {
  const customer = extractCustomerData(payload.customer);
  
  console.log("[Payt Webhook] Subscription overdue for:", customer.email);
  
  const user = await db.getUserByEmail(customer.email);
  
  if (user) {
    // past_due não existe no schema, usar expired como fallback
    await db.updateUserSubscription(user.id, {
      status: "expired",
    });
    
    // Atualizar personal_subscription
    const personal = await db.getPersonalByUserId(user.id);
    if (personal) {
      await db.updatePersonalSubscriptionFull(personal.id, {
        status: "past_due",
      });
    }
    
    console.log("[Payt Webhook] Subscription marked as overdue for user:", user.id);
    return "overdue";
  }
  
  return "user_not_found";
}

/**
 * Handle reactivation
 */
async function handleReactivation(payload: PaytWebhookPayload): Promise<string> {
  console.log("[Payt Webhook] Subscription reactivated");
  // Mesma lógica de purchase approved
  return await handlePurchaseApproved(payload);
}

/**
 * Log webhook event
 */
async function logWebhookEvent(payload: PaytWebhookPayload) {
  try {
    console.log("[Payt Webhook] Logged event:", {
      status: payload.status,
      type: payload.type,
      transactionId: payload.transaction_id,
      customerEmail: payload.customer?.email,
      productCode: payload.product?.code,
      amount: payload.transaction?.total_price,
      isFirstCharge: isFirstCharge(payload.subscription),
      subscriptionCharges: payload.subscription?.charges,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Payt Webhook] Error logging event:", error);
  }
}

/**
 * Criar ou atualizar personal_subscription
 */
async function createOrUpdatePersonalSubscription(data: {
  personalId: number;
  planId: string;
  planName: string;
  studentLimit: number;
  planPrice: number;
  extraStudentPrice: number;
  status: "active" | "trial" | "past_due" | "cancelled" | "expired";
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  billingPeriod: "monthly" | "annual";
  paytOrderId?: string;
  paytSubscriptionId?: string;
}) {
  try {
    const existingSubscription = await db.getPersonalSubscription(data.personalId);
    
    if (existingSubscription) {
      await db.updatePersonalSubscriptionFull(data.personalId, {
        planId: data.planId,
        planName: data.planName,
        studentLimit: data.studentLimit,
        planPrice: String(data.planPrice),
        extraStudentPrice: String(data.extraStudentPrice),
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
      });
      
      console.log("[Payt Webhook] Updated personal subscription:", data.personalId);
    } else {
      await db.createPersonalSubscription({
        personalId: data.personalId,
        planId: data.planId,
        planName: data.planName,
        country: "BR",
        studentLimit: data.studentLimit,
        currentStudents: 0,
        extraStudents: 0,
        planPrice: String(data.planPrice),
        extraStudentPrice: String(data.extraStudentPrice),
        currency: "BRL",
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
      });
      
      console.log("[Payt Webhook] Created personal subscription:", data.personalId);
    }
  } catch (error) {
    console.error("[Payt Webhook] Error creating/updating personal subscription:", error);
  }
}
