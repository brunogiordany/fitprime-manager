import { Request, Response } from 'express';
import { stripe, constructWebhookEvent } from './index';
import { ENV } from '../_core/env';
import { getDb } from '../db';
import { charges, packages, students } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

export async function handleStripeWebhook(req: Request, res: Response) {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    console.error('[Webhook] No signature found');
    return res.status(400).json({ error: 'No signature' });
  }

  let event;

  try {
    event = constructWebhookEvent(
      req.body,
      signature,
      ENV.stripeWebhookSecret
    );
  } catch (err: any) {
    console.error('[Webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // CRITICAL: Handle test events
  if (event.id.startsWith('evt_test_')) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({ 
      verified: true,
    });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  const db = await getDb();
  if (!db) {
    console.error('[Webhook] Database not available');
    return res.status(500).json({ error: 'Database not available' });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('[Webhook] Checkout session completed:', session.id);
        
        // Extrair metadados
        const userId = session.metadata?.user_id;
        const studentId = session.metadata?.student_id;
        const chargeId = session.metadata?.charge_id;
        const packageId = session.metadata?.package_id;
        
        // Atualizar cobrança se existir
        if (chargeId) {
          await db.update(charges)
            .set({
              status: 'paid',
              paidAt: new Date(),
              paymentMethod: 'stripe',
              stripePaymentIntentId: session.payment_intent as string,
            })
            .where(eq(charges.id, parseInt(chargeId)));
          console.log(`[Webhook] Charge ${chargeId} marked as paid`);
        }
        
        // Atualizar pacote se for assinatura
        if (packageId && session.subscription) {
          await db.update(packages)
            .set({
              status: 'active',
              stripeSubscriptionId: session.subscription as string,
            })
            .where(eq(packages.id, parseInt(packageId)));
          console.log(`[Webhook] Package ${packageId} activated with subscription`);
        }
        
        // Atualizar Stripe Customer ID no aluno
        if (studentId && session.customer) {
          await db.update(students)
            .set({
              stripeCustomerId: session.customer as string,
            })
            .where(eq(students.id, parseInt(studentId)));
          console.log(`[Webhook] Student ${studentId} updated with Stripe customer`);
        }
        
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('[Webhook] Payment succeeded:', paymentIntent.id);
        
        // Buscar cobrança pelo payment intent
        const chargeId = paymentIntent.metadata?.charge_id;
        if (chargeId) {
          await db.update(charges)
            .set({
              status: 'paid',
              paidAt: new Date(),
              paidAmount: (paymentIntent.amount / 100).toString(),
              paymentMethod: 'stripe',
              stripePaymentIntentId: paymentIntent.id,
            })
            .where(eq(charges.id, parseInt(chargeId)));
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        console.log('[Webhook] Invoice paid:', invoice.id);
        
        // Atualizar cobrança relacionada
        const chargeId = invoice.metadata?.charge_id;
        if (chargeId) {
          await db.update(charges)
            .set({
              status: 'paid',
              paidAt: new Date(),
              stripeInvoiceId: invoice.id,
            })
            .where(eq(charges.id, parseInt(chargeId)));
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log('[Webhook] Invoice payment failed:', invoice.id);
        
        // Marcar cobrança como vencida
        const chargeId = invoice.metadata?.charge_id;
        if (chargeId) {
          await db.update(charges)
            .set({
              status: 'overdue',
            })
            .where(eq(charges.id, parseInt(chargeId)));
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('[Webhook] Subscription cancelled:', subscription.id);
        
        // Cancelar pacote
        await db.update(packages)
          .set({
            status: 'cancelled',
          })
          .where(eq(packages.stripeSubscriptionId, subscription.id));
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('[Webhook] Subscription updated:', subscription.id);
        
        // Atualizar status do pacote baseado no status da assinatura
        let packageStatus: 'active' | 'expired' | 'cancelled' | 'pending' = 'active';
        if (subscription.status === 'canceled') {
          packageStatus = 'cancelled';
        } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
          packageStatus = 'pending';
        }
        
        await db.update(packages)
          .set({
            status: packageStatus,
          })
          .where(eq(packages.stripeSubscriptionId, subscription.id));
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}
