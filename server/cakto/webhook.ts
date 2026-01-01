/**
 * Cakto Webhook Handler
 * 
 * Processes webhook events from Cakto payment platform.
 */

import type { Request, Response } from "express";
import { CaktoWebhookPayload, processWebhookEvent } from "../cakto";
import * as db from "../db";

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
  productId: string;
  orderId: string;
  amount: number;
  subscriptionId?: string;
}) {
  console.log("[Cakto Webhook] Activating access for:", result.customerEmail);
  
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
    
    console.log("[Cakto Webhook] Access activated for user:", user.id);
  } else {
    console.log("[Cakto Webhook] User not found, storing pending activation:", result.customerEmail);
    
    // Store pending activation for when user registers
    await db.createPendingActivation({
      email: result.customerEmail,
      phone: result.customerPhone,
      caktoOrderId: result.orderId,
      caktoSubscriptionId: result.subscriptionId,
      productId: result.productId,
      amount: result.amount,
    });
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
