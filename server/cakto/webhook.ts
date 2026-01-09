/**
 * Cakto Webhook Handler
 * 
 * Processes webhook events from Cakto payment platform.
 * Atualiza personal_subscriptions com datas de período para proration.
 */

import type { Request, Response } from "express";
import crypto from "crypto";
import { CaktoWebhookPayload, processWebhookEvent } from "../cakto";
import * as db from "../db";
import { sendPurchaseActivationEmail, sendSubscriptionConfirmationEmail } from "../email";
import { PLANS } from "../../shared/plans";

// Map Cakto offer ID to plan type
const CAKTO_OFFER_TO_PLAN: Record<string, { planId: string; isAnnual: boolean }> = {
  // Planos mensais
  "32rof96": { planId: "starter", isAnnual: false },
  "onb2wr2": { planId: "pro", isAnnual: false },
  "zh3rnh6": { planId: "business", isAnnual: false },
  "kbevbfw": { planId: "premium", isAnnual: false },
  "apzipd3": { planId: "enterprise", isAnnual: false },
  "75u9x53": { planId: "beginner", isAnnual: false },
  // Planos anuais (IDs reais do Cakto)
  "38m8qgq": { planId: "starter", isAnnual: true },
  "3bz5zr8": { planId: "pro", isAnnual: true },
  "q6oeohx": { planId: "business", isAnnual: true },
  "32e6rsr": { planId: "premium", isAnnual: true },
  "ndnczxn": { planId: "enterprise", isAnnual: true },
};

// Map Cakto product ID to plan type (legacy)
function mapProductToPlanType(productId: string): "beginner" | "starter" | "pro" | "business" | "premium" | "enterprise" | null {
  const mapping = CAKTO_OFFER_TO_PLAN[productId];
  if (mapping) {
    return mapping.planId as "starter" | "pro" | "business" | "premium" | "enterprise";
  }
  return null;
}

// Determinar se é plano anual baseado no offerId ou productId
function isAnnualPlan(offerId: string): boolean {
  const mapping = CAKTO_OFFER_TO_PLAN[offerId];
  return mapping?.isAnnual || offerId.includes('anual');
}

// Calcular datas de período baseado no tipo de plano
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
 * Handle incoming Cakto webhook
 */
export async function handleCaktoWebhook(req: Request, res: Response) {
  try {
    const payload = req.body as CaktoWebhookPayload;
    
    console.log("[Cakto Webhook] Received event:", payload.event);
    console.log("[Cakto Webhook] Customer:", payload.data?.customer?.email);
    console.log("[Cakto Webhook] Product:", payload.data?.product?.name);

    // Process the webhook event
    const result = processWebhookEvent(payload);
    
    console.log("[Cakto Webhook] Action:", result.action);

    // Log the webhook event
    await logWebhookEvent(payload, result.action);

    // Handle the action
    switch (result.action) {
      case "activate":
        await handleActivation(result);
        break;
      case "deactivate":
        await handleDeactivation(result);
        break;
      case "renew":
        await handleRenewal(result);
        break;
      case "none":
        console.log("[Cakto Webhook] No action required for event:", payload.event);
        break;
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ success: true, action: result.action });
  } catch (error) {
    console.error("[Cakto Webhook] Error processing webhook:", error);
    // Still respond with 200 to prevent retries for processing errors
    res.status(200).json({ success: false, error: "Processing error" });
  }
}

/**
 * Log webhook event to database
 */
async function logWebhookEvent(
  payload: CaktoWebhookPayload,
  action: string
) {
  try {
    // Log to cakto_webhook_logs table (we'll create this)
    console.log("[Cakto Webhook] Logged event:", {
      event: payload.event,
      orderId: payload.data?.id,
      customerEmail: payload.data?.customer?.email,
      action,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cakto Webhook] Error logging event:", error);
  }
}

/**
 * Handle activation (purchase_approved, subscription_created)
 */
async function handleActivation(result: {
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  productId: string;
  productName: string;
  orderId: string;
  amount: number;
  subscriptionId?: string;
  offerId?: string;
}) {
  console.log("[Cakto Webhook] Activating access for:", result.customerEmail);
  console.log("[Cakto Webhook] Product/Offer ID:", result.productId, result.offerId);
  
  // Determinar plano e período
  const offerId = result.offerId || result.productId;
  const planMapping = CAKTO_OFFER_TO_PLAN[offerId];
  const planId = planMapping?.planId || mapProductToPlanType(result.productId) || 'starter';
  const isAnnual = isAnnualPlan(offerId);
  const plan = PLANS[planId];
  const { start: periodStart, end: periodEnd } = calculatePeriodDates(isAnnual);
  
  console.log("[Cakto Webhook] Plan:", planId, "Annual:", isAnnual);
  console.log("[Cakto Webhook] Period:", periodStart, "to", periodEnd);
  
  // Find user by email
  const user = await db.getUserByEmail(result.customerEmail);
  
  if (user) {
    // Update user's subscription status
    await db.updateUserSubscription(user.id, {
      status: "active",
      caktoOrderId: result.orderId,
      caktoSubscriptionId: result.subscriptionId,
      paidAt: new Date(),
      amount: result.amount,
    });
    
    // Buscar personal associado ao usuário
    const personal = await db.getPersonalByUserId(user.id);
    
    if (personal) {
      // Criar ou atualizar personal_subscription com datas de período
      await createOrUpdatePersonalSubscription({
        personalId: personal.id,
        planId: `fitprime_br_${planId}`,
        planName: plan?.name || 'Starter',
        studentLimit: isAnnual ? (plan?.annualStudentLimit || 15) : (plan?.studentLimit || 15),
        planPrice: isAnnual ? (plan?.annualPrice || 932) : (plan?.price || 97),
        extraStudentPrice: plan?.extraStudentPrice || 6.47,
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        billingPeriod: isAnnual ? 'annual' : 'monthly',
        caktoOrderId: result.orderId,
        caktoSubscriptionId: result.subscriptionId,
      });
      
      console.log("[Cakto Webhook] Personal subscription updated for:", personal.id);
    }
    
    console.log("[Cakto Webhook] Access activated for user:", user.id);
    
    // Send confirmation email to existing user
    try {
      await sendSubscriptionConfirmationEmail(
        result.customerEmail,
        result.customerName || user.name || '',
        plan?.name || 'Plano FitPrime',
        result.amount,
        periodEnd
      );
      console.log("[Cakto Webhook] Confirmation email sent to:", result.customerEmail);
    } catch (emailError) {
      console.error("[Cakto Webhook] Failed to send confirmation email:", emailError);
    }
  } else {
    console.log("[Cakto Webhook] User not found, storing pending activation:", result.customerEmail);
    
    // Store pending activation for when user registers
    // Generate activation token
    const activationToken = crypto.randomUUID();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7); // 7 days expiry
    
    await db.createPendingActivation({
      email: result.customerEmail,
      phone: result.customerPhone || null,
      name: result.customerName || null,
      caktoOrderId: result.orderId,
      caktoSubscriptionId: result.subscriptionId || null,
      productId: result.productId,
      productName: result.productName || null,
      amount: String(result.amount),
      planType: mapProductToPlanType(result.productId),
      activationToken,
      tokenExpiresAt,
    });
    
    // Send welcome email with activation link
    const baseUrl = process.env.VITE_APP_URL || 'https://fitprime.com.br';
    const activationLink = `${baseUrl}/ativar-conta/${activationToken}`;
    
    await sendPurchaseActivationEmail(
      result.customerEmail,
      result.customerName || '',
      result.productName || 'Plano FitPrime',
      result.amount,
      activationLink
    );
    
    console.log("[Cakto Webhook] Activation email sent to:", result.customerEmail);
  }
}

/**
 * Handle deactivation (refund, chargeback, subscription_canceled)
 */
async function handleDeactivation(result: {
  customerEmail: string;
  customerPhone: string;
  productId: string;
  orderId: string;
  amount: number;
  subscriptionId?: string;
}) {
  console.log("[Cakto Webhook] Deactivating access for:", result.customerEmail);
  
  // Find user by email
  const user = await db.getUserByEmail(result.customerEmail);
  
  if (user) {
    // Update user's subscription status
    await db.updateUserSubscription(user.id, {
      status: "canceled",
      canceledAt: new Date(),
    });
    
    console.log("[Cakto Webhook] Access deactivated for user:", user.id);
  } else {
    console.log("[Cakto Webhook] User not found for deactivation:", result.customerEmail);
  }
}

/**
 * Handle renewal (subscription_renewed)
 */
async function handleRenewal(result: {
  customerEmail: string;
  customerPhone: string;
  productId: string;
  orderId: string;
  amount: number;
  subscriptionId?: string;
}) {
  console.log("[Cakto Webhook] Renewing subscription for:", result.customerEmail);
  
  // Find user by email
  const user = await db.getUserByEmail(result.customerEmail);
  
  if (user) {
    // Update user's subscription with new payment
    await db.updateUserSubscription(user.id, {
      status: "active",
      renewedAt: new Date(),
      amount: result.amount,
    });
    
    console.log("[Cakto Webhook] Subscription renewed for user:", user.id);
  } else {
    console.log("[Cakto Webhook] User not found for renewal:", result.customerEmail);
  }
}


/**
 * Criar ou atualizar personal_subscription com datas de período
 */
async function createOrUpdatePersonalSubscription(data: {
  personalId: number;
  planId: string;
  planName: string;
  studentLimit: number;
  planPrice: number;
  extraStudentPrice: number;
  status: 'active' | 'trial' | 'past_due' | 'cancelled' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  billingPeriod: 'monthly' | 'annual';
  caktoOrderId?: string;
  caktoSubscriptionId?: string;
}) {
  try {
    // Verificar se já existe subscription para este personal
    const existingSubscription = await db.getPersonalSubscription(data.personalId);
    
    if (existingSubscription) {
      // Atualizar subscription existente usando a função correta
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
      
      console.log("[Cakto Webhook] Updated personal subscription:", data.personalId);
    } else {
      // Criar nova subscription
      await db.createPersonalSubscription({
        personalId: data.personalId,
        planId: data.planId,
        planName: data.planName,
        country: 'BR',
        studentLimit: data.studentLimit,
        currentStudents: 0,
        extraStudents: 0,
        planPrice: String(data.planPrice),
        extraStudentPrice: String(data.extraStudentPrice),
        currency: 'BRL',
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
      });
      
      console.log("[Cakto Webhook] Created personal subscription:", data.personalId);
    }
  } catch (error) {
    console.error("[Cakto Webhook] Error creating/updating personal subscription:", error);
  }
}
