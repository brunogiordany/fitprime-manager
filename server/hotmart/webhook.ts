/**
 * Hotmart Webhook Handler
 * 
 * Processes webhook events from Hotmart payment platform (v2.0.0).
 * Handles purchase activation, cancellation, refund, chargeback, and subscription events.
 */

import type { Request, Response } from "express";
import crypto from "crypto";
import * as db from "../db";
import { sendPurchaseActivationEmail, sendSubscriptionConfirmationEmail } from "../email";
import { PLANS } from "../../shared/plans";

// ============================================================
// Types for Hotmart Webhook v2.0.0
// ============================================================

interface HotmartWebhookPayload {
  id: string;
  creation_date: number;
  event: string;
  version: string;
  data: {
    product?: {
      id: number;
      name: string;
      has_co_production?: boolean;
    };
    buyer?: {
      email: string;
      name: string;
      first_name?: string;
      last_name?: string;
      checkout_phone?: string;
      document?: string;
    };
    purchase?: {
      status: string;
      transaction: string;
      order_date: string;
      approved_date?: number;
      full_price?: {
        value: number;
        currency_value: string;
      };
      original_offer_price?: {
        value: number;
        currency_value: string;
      };
      offer?: {
        code: string;
        name?: string;
      };
      payment?: {
        type: string;
        installments_number?: number;
      };
      recurrence_number?: number;
    };
    subscriber?: {
      code: string;
      name: string;
      email: string;
    };
    subscription?: {
      id: number;
      status?: string;
      plan?: {
        id: number;
        name: string;
      };
    };
    cancellation_date?: number;
    date_next_charge?: number;
    actual_recurrence_value?: number;
  };
}

// Map Hotmart offer codes to FitPrime plans
// O plano padrão para Hotmart é "hotmart_pro" com alunos ilimitados (R$47/mês)
const HOTMART_OFFER_TO_PLAN: Record<string, { planId: string; isAnnual: boolean; studentLimit: number }> = {
  // Oferta trial 7 dias
  "jous0sf9": { planId: "hotmart_trial", isAnnual: false, studentLimit: 2 },
  // Oferta pagamento direto (R$47/mês - alunos ilimitados)
  "krpg79bk": { planId: "hotmart_pro", isAnnual: false, studentLimit: 9999 },
};

// Plano padrão para ofertas não mapeadas
const DEFAULT_HOTMART_PLAN = { planId: "hotmart_pro", isAnnual: false, studentLimit: 9999 };

// ============================================================
// Main Webhook Handler
// ============================================================

export async function handleHotmartWebhook(req: Request, res: Response) {
  try {
    // Validate Hottok
    const hottok = req.headers['x-hotmart-hottok'] as string;
    const expectedHottok = process.env.HOTMART_HOTTOK;

    if (!expectedHottok) {
      console.error("[Hotmart Webhook] HOTMART_HOTTOK not configured");
      return res.status(500).json({ error: "Webhook not configured" });
    }

    if (hottok !== expectedHottok) {
      console.error("[Hotmart Webhook] Invalid Hottok:", hottok?.substring(0, 10) + "...");
      return res.status(401).json({ error: "Invalid hottok" });
    }

    const payload = req.body as HotmartWebhookPayload;

    console.log("[Hotmart Webhook] ========================================");
    console.log("[Hotmart Webhook] Event:", payload.event);
    console.log("[Hotmart Webhook] Event ID:", payload.id);
    console.log("[Hotmart Webhook] Buyer:", payload.data?.buyer?.email || payload.data?.subscriber?.email);
    console.log("[Hotmart Webhook] Product:", payload.data?.product?.name);
    console.log("[Hotmart Webhook] Transaction:", payload.data?.purchase?.transaction);
    console.log("[Hotmart Webhook] Offer:", payload.data?.purchase?.offer?.code);
    console.log("[Hotmart Webhook] ========================================");

    // Log the webhook event
    await logWebhookEvent(payload);

    // Route event to appropriate handler
    switch (payload.event) {
      case "PURCHASE_APPROVED":
      case "PURCHASE_COMPLETE":
        await handlePurchaseApproved(payload);
        break;

      case "PURCHASE_CANCELLED":
      case "PURCHASE_REFUNDED":
      case "PURCHASE_CHARGEBACK":
        await handlePurchaseDeactivation(payload, payload.event);
        break;

      case "PURCHASE_EXPIRED":
        await handlePurchaseExpired(payload);
        break;

      case "PURCHASE_OVERDUE":
        await handlePurchaseOverdue(payload);
        break;

      case "SUBSCRIPTION_CANCELLATION":
        await handleSubscriptionCancellation(payload);
        break;

      default:
        console.log("[Hotmart Webhook] Unhandled event:", payload.event);
    }

    // Always respond 200 to acknowledge receipt
    res.status(200).json({ success: true, event: payload.event });
  } catch (error) {
    console.error("[Hotmart Webhook] Error processing webhook:", error);
    // Still respond 200 to prevent retries
    res.status(200).json({ success: false, error: "Processing error" });
  }
}

// ============================================================
// Event Handlers
// ============================================================

/**
 * PURCHASE_APPROVED / PURCHASE_COMPLETE
 * Create account + activate subscription
 */
async function handlePurchaseApproved(payload: HotmartWebhookPayload) {
  const buyer = payload.data?.buyer;
  const purchase = payload.data?.purchase;
  const product = payload.data?.product;

  if (!buyer?.email) {
    console.error("[Hotmart Webhook] No buyer email in PURCHASE_APPROVED");
    return;
  }

  const email = buyer.email.toLowerCase().trim();
  const name = buyer.name || `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim();
  const phone = buyer.checkout_phone || '';
  const transaction = purchase?.transaction || '';
  const amount = purchase?.full_price?.value || 0;
  const offerCode = purchase?.offer?.code || '';

  // Determine plan from offer
  const planMapping = HOTMART_OFFER_TO_PLAN[offerCode] || DEFAULT_HOTMART_PLAN;
  const studentLimit = planMapping.studentLimit;

  console.log("[Hotmart Webhook] Activating:", email, "Plan:", planMapping.planId, "Students:", studentLimit);

  // Calculate period dates
  const periodStart = new Date();
  const periodEnd = new Date();
  if (planMapping.planId === "hotmart_trial") {
    periodEnd.setDate(periodEnd.getDate() + 7); // 7 days trial
  } else if (planMapping.isAnnual) {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Check if user already exists
  const user = await db.getUserByEmail(email);

  if (user) {
    // User exists - activate subscription
    await db.updateUserSubscription(user.id, {
      status: "active",
      caktoOrderId: transaction, // Reusing cakto field for Hotmart transaction
      paidAt: new Date(),
      amount: amount,
    });

    // Update personal subscription
    const personal = await db.getPersonalByUserId(user.id);
    if (personal) {
      await createOrUpdatePersonalSubscription({
        personalId: personal.id,
        planId: planMapping.planId,
        planName: planMapping.planId === "hotmart_trial" ? "Trial Hotmart" : "Profissional Hotmart",
        studentLimit: studentLimit,
        planPrice: amount,
        status: 'active',
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        billingPeriod: planMapping.isAnnual ? 'annual' : 'monthly',

      });
    }

    console.log("[Hotmart Webhook] Access activated for existing user:", user.id);

    // Send confirmation email
    try {
      await sendSubscriptionConfirmationEmail(
        email,
        name,
        planMapping.planId === "hotmart_trial" ? "Trial 7 Dias" : "Plano Profissional",
        amount,
        periodEnd
      );
    } catch (emailError) {
      console.error("[Hotmart Webhook] Failed to send confirmation email:", emailError);
    }
  } else {
    // User doesn't exist - create pending activation
    console.log("[Hotmart Webhook] User not found, creating pending activation:", email);

    const activationToken = crypto.randomUUID();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    await db.createPendingActivation({
      email: email,
      phone: phone || null,
      name: name || null,
      caktoOrderId: transaction, // Reusing field for Hotmart transaction
      caktoSubscriptionId: null,
      productId: String(product?.id || ''),
      productName: product?.name || 'FitPrime Manager',
      amount: String(amount),
      planType: "starter",
      activationToken,
      tokenExpiresAt,
    });

    // Send activation email
    const baseUrl = process.env.PUBLIC_URL || process.env.VITE_APP_URL || 'https://fitprimehub-sfh8sqab.manus.space';
    const activationLink = `${baseUrl}/ativar-conta/${activationToken}`;

    try {
      await sendPurchaseActivationEmail(
        email,
        name,
        planMapping.planId === "hotmart_trial" ? "Trial 7 Dias" : "Plano Profissional FitPrime",
        amount,
        activationLink
      );
      console.log("[Hotmart Webhook] Activation email sent to:", email);
    } catch (emailError) {
      console.error("[Hotmart Webhook] Failed to send activation email:", emailError);
    }
  }
}

/**
 * PURCHASE_CANCELLED / PURCHASE_REFUNDED / PURCHASE_CHARGEBACK
 * Deactivate subscription
 */
async function handlePurchaseDeactivation(payload: HotmartWebhookPayload, eventType: string) {
  const email = (payload.data?.buyer?.email || '').toLowerCase().trim();

  if (!email) {
    console.error(`[Hotmart Webhook] No buyer email in ${eventType}`);
    return;
  }

  console.log(`[Hotmart Webhook] Deactivating (${eventType}):`, email);

  const user = await db.getUserByEmail(email);

  if (user) {
    await db.updateUserSubscription(user.id, {
      status: "canceled",
      canceledAt: new Date(),
    });

    // Update personal subscription
    const personal = await db.getPersonalByUserId(user.id);
    if (personal) {
      const existingSubscription = await db.getPersonalSubscription(personal.id);
      if (existingSubscription) {
        await db.updatePersonalSubscriptionFull(personal.id, {
          status: 'cancelled',
        });
      }
    }

    console.log(`[Hotmart Webhook] Access deactivated (${eventType}) for user:`, user.id);
  } else {
    console.log(`[Hotmart Webhook] User not found for deactivation (${eventType}):`, email);
  }
}

/**
 * PURCHASE_EXPIRED
 * Subscription not renewed - deactivate
 */
async function handlePurchaseExpired(payload: HotmartWebhookPayload) {
  const email = (payload.data?.buyer?.email || '').toLowerCase().trim();

  if (!email) {
    console.error("[Hotmart Webhook] No buyer email in PURCHASE_EXPIRED");
    return;
  }

  console.log("[Hotmart Webhook] Subscription expired:", email);

  const user = await db.getUserByEmail(email);

  if (user) {
    await db.updateUserSubscription(user.id, {
      status: "canceled",
      canceledAt: new Date(),
    });

    const personal = await db.getPersonalByUserId(user.id);
    if (personal) {
      const existingSubscription = await db.getPersonalSubscription(personal.id);
      if (existingSubscription) {
        await db.updatePersonalSubscriptionFull(personal.id, {
          status: 'expired',
        });
      }
    }

    console.log("[Hotmart Webhook] Access expired for user:", user.id);
  }
}

/**
 * PURCHASE_OVERDUE
 * Payment overdue - mark as past_due but keep access temporarily
 */
async function handlePurchaseOverdue(payload: HotmartWebhookPayload) {
  const email = (payload.data?.buyer?.email || '').toLowerCase().trim();

  if (!email) {
    console.error("[Hotmart Webhook] No buyer email in PURCHASE_OVERDUE");
    return;
  }

  console.log("[Hotmart Webhook] Payment overdue:", email);

  const user = await db.getUserByEmail(email);

  if (user) {
    await db.updateUserSubscription(user.id, {
      status: "active", // Keep active but log overdue
    });

    const personal = await db.getPersonalByUserId(user.id);
    if (personal) {
      const existingSubscription = await db.getPersonalSubscription(personal.id);
      if (existingSubscription) {
        await db.updatePersonalSubscriptionFull(personal.id, {
          status: 'past_due',
        });
      }
    }

    console.log("[Hotmart Webhook] Marked as overdue for user:", user.id);
  }
}

/**
 * SUBSCRIPTION_CANCELLATION
 * Subscription cancelled - deactivate at end of period
 */
async function handleSubscriptionCancellation(payload: HotmartWebhookPayload) {
  const email = (payload.data?.subscriber?.email || '').toLowerCase().trim();

  if (!email) {
    console.error("[Hotmart Webhook] No subscriber email in SUBSCRIPTION_CANCELLATION");
    return;
  }

  console.log("[Hotmart Webhook] Subscription cancelled:", email);
  console.log("[Hotmart Webhook] Cancellation date:", payload.data?.cancellation_date);
  console.log("[Hotmart Webhook] Next charge date:", payload.data?.date_next_charge);

  const user = await db.getUserByEmail(email);

  if (user) {
    // If there's a date_next_charge, keep access until that date
    const nextCharge = payload.data?.date_next_charge;
    const accessUntil = nextCharge ? new Date(nextCharge) : new Date();

    // If access should continue until end of period
    if (nextCharge && new Date(nextCharge) > new Date()) {
      console.log("[Hotmart Webhook] Access continues until:", accessUntil);
      // Mark as cancelling but keep active until period end
      await db.updateUserSubscription(user.id, {
        status: "active", // Keep active until period ends
        canceledAt: new Date(),
      });

      const personal = await db.getPersonalByUserId(user.id);
      if (personal) {
        const existingSubscription = await db.getPersonalSubscription(personal.id);
        if (existingSubscription) {
          await db.updatePersonalSubscriptionFull(personal.id, {
            status: 'active',
            currentPeriodEnd: accessUntil,
          });
        }
      }
    } else {
      // Immediate cancellation
      await db.updateUserSubscription(user.id, {
        status: "canceled",
        canceledAt: new Date(),
      });

      const personal = await db.getPersonalByUserId(user.id);
      if (personal) {
        const existingSubscription = await db.getPersonalSubscription(personal.id);
        if (existingSubscription) {
          await db.updatePersonalSubscriptionFull(personal.id, {
            status: 'cancelled',
          });
        }
      }
    }

    console.log("[Hotmart Webhook] Subscription cancellation processed for user:", user.id);
  } else {
    console.log("[Hotmart Webhook] User not found for subscription cancellation:", email);
  }
}

// ============================================================
// Helper Functions
// ============================================================

async function logWebhookEvent(payload: HotmartWebhookPayload) {
  try {
    console.log("[Hotmart Webhook] Logged event:", {
      event: payload.event,
      eventId: payload.id,
      buyerEmail: payload.data?.buyer?.email || payload.data?.subscriber?.email,
      transaction: payload.data?.purchase?.transaction,
      offer: payload.data?.purchase?.offer?.code,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Hotmart Webhook] Error logging event:", error);
  }
}

async function createOrUpdatePersonalSubscription(data: {
  personalId: number;
  planId: string;
  planName: string;
  studentLimit: number;
  planPrice: number;
  status: 'active' | 'trial' | 'past_due' | 'cancelled' | 'expired';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  billingPeriod: 'monthly' | 'annual';

}) {
  try {
    const existingSubscription = await db.getPersonalSubscription(data.personalId);

    if (existingSubscription) {
      await db.updatePersonalSubscriptionFull(data.personalId, {
        planId: data.planId,
        planName: data.planName,
        studentLimit: data.studentLimit,
        planPrice: String(data.planPrice),
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
      });
      console.log("[Hotmart Webhook] Updated personal subscription:", data.personalId);
    } else {
      await db.createPersonalSubscription({
        personalId: data.personalId,
        planId: data.planId,
        planName: data.planName,
        country: 'BR',
        studentLimit: data.studentLimit,
        currentStudents: 0,
        extraStudents: 0,
        planPrice: String(data.planPrice),
        extraStudentPrice: "0",
        currency: 'BRL',
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
      });
      console.log("[Hotmart Webhook] Created personal subscription:", data.personalId);
    }
  } catch (error) {
    console.error("[Hotmart Webhook] Error creating/updating personal subscription:", error);
  }
}
