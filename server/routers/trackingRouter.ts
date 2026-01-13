/**
 * Meta Conversions API Router
 * Endpoint para enviar eventos server-side para o Meta (Facebook)
 * Webhook para receber eventos da Cakto
 * 
 * Seguindo a documentação oficial:
 * https://developers.facebook.com/docs/marketing-api/conversions-api/
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import crypto from "crypto";
import { getDb } from "../db";
import { pixelEvents, webhookLogs } from "../../drizzle/schema";
import { desc, eq, sql, and, gte, lte } from "drizzle-orm";

// Schema para os dados do evento
const metaEventSchema = z.object({
  event_name: z.string(),
  event_time: z.number(),
  event_id: z.string(),
  event_source_url: z.string(),
  action_source: z.string().default("website"),
  user_data: z.object({
    client_ip_address: z.string().optional(),
    client_user_agent: z.string().optional(),
    fbc: z.string().optional(),
    fbp: z.string().optional(),
    em: z.string().optional(), // Email já hashado
    ph: z.string().optional(), // Phone já hashado
    fn: z.string().optional(), // First name já hashado
    ln: z.string().optional(), // Last name já hashado
    ct: z.string().optional(), // City já hashado
    external_id: z.string().optional(),
  }).optional(),
  custom_data: z.record(z.string(), z.any()).optional(),
});

// Função para hash SHA256 (para dados que precisam ser hashados no servidor)
function hashSHA256(value: string): string {
  if (!value) return "";
  return crypto.createHash("sha256").update(value.toLowerCase().trim()).digest("hex");
}

// Enviar evento para Meta Conversions API
async function sendToMetaConversionsAPI(
  pixelId: string,
  accessToken: string,
  eventData: z.infer<typeof metaEventSchema>,
  clientIp: string
): Promise<{ success: boolean; error?: string; fbtrace_id?: string; events_received?: number }> {
  try {
    // Preparar payload conforme documentação do Meta
    const payload = {
      data: [
        {
          event_name: eventData.event_name,
          event_time: eventData.event_time,
          event_id: eventData.event_id,
          event_source_url: eventData.event_source_url,
          action_source: eventData.action_source,
          user_data: {
            ...eventData.user_data,
            client_ip_address: clientIp || eventData.user_data?.client_ip_address,
          },
          custom_data: eventData.custom_data,
        },
      ],
    };

    // Endpoint da API do Meta (versão 18.0)
    const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok) {
      console.log("[Meta CAPI] Evento enviado com sucesso:", eventData.event_name, result);
      return { success: true, fbtrace_id: result.fbtrace_id, events_received: result.events_received };
    } else {
      console.error("[Meta CAPI] Erro:", result);
      return { success: false, error: result.error?.message || "Erro desconhecido" };
    }
  } catch (error) {
    console.error("[Meta CAPI] Erro de conexão:", error);
    return { success: false, error: String(error) };
  }
}

// Enviar evento para TikTok Events API
async function sendToTikTokEventsAPI(
  pixelId: string,
  accessToken: string,
  eventData: z.infer<typeof metaEventSchema>,
  clientIp: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Mapear evento para o formato do TikTok
    const tiktokEventMap: Record<string, string> = {
      PageView: "ViewContent",
      Lead: "SubmitForm",
      CompleteRegistration: "CompleteRegistration",
      InitiateCheckout: "InitiateCheckout",
      Purchase: "CompletePayment",
      AddToCart: "AddToCart",
      ViewContent: "ViewContent",
      Subscribe: "Subscribe",
    };

    const payload = {
      pixel_code: pixelId,
      event: tiktokEventMap[eventData.event_name] || eventData.event_name,
      event_id: eventData.event_id,
      timestamp: new Date(eventData.event_time * 1000).toISOString(),
      context: {
        page: {
          url: eventData.event_source_url,
        },
        user_agent: eventData.user_data?.client_user_agent,
        ip: clientIp,
      },
      properties: eventData.custom_data,
    };

    const response = await fetch("https://business-api.tiktok.com/open_api/v1.3/pixel/track/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": accessToken,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.code === 0) {
      console.log("[TikTok Events API] Evento enviado:", eventData.event_name);
      return { success: true };
    } else {
      console.error("[TikTok Events API] Erro:", result);
      return { success: false, error: result.message };
    }
  } catch (error) {
    console.error("[TikTok Events API] Erro de conexão:", error);
    return { success: false, error: String(error) };
  }
}

// Função para enviar evento Purchase via Meta CAPI
async function sendPurchaseEvent(
  email: string,
  phone: string,
  name: string,
  value: number,
  currency: string = "BRL",
  orderId: string,
  productName: string
): Promise<{ success: boolean; error?: string }> {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn("[Meta CAPI] Pixel ID ou Access Token não configurado");
    return { success: false, error: "Meta CAPI não configurado" };
  }

  const eventId = `purchase_${orderId}_${Date.now()}`;
  const eventTime = Math.floor(Date.now() / 1000);

  const eventData = {
    event_name: "Purchase",
    event_time: eventTime,
    event_id: eventId,
    event_source_url: "https://fitprimemanager.com/checkout",
    action_source: "website",
    user_data: {
      em: hashSHA256(email),
      ph: hashSHA256(phone.replace(/\D/g, "")),
      fn: hashSHA256(name.split(" ")[0] || ""),
      ln: hashSHA256(name.split(" ").slice(1).join(" ") || ""),
    },
    custom_data: {
      value: value,
      currency: currency,
      content_ids: [orderId],
      content_name: productName,
      content_type: "product",
      num_items: 1,
    },
  };

  // Salvar evento no banco
  try {
    const _db = await getDb(); if (_db) await _db.insert(pixelEvents).values({
      eventId: eventId,
      eventName: "Purchase",
      eventSource: "webhook",
      userEmail: email,
      userPhone: phone,
      userName: name,
      eventData: eventData.custom_data,
      value: String(value),
      currency: currency,
      contentId: orderId,
      contentName: productName,
      contentType: "product",
      sourceUrl: "https://fitprimemanager.com/checkout",
    });
  } catch (err) {
    console.error("[Pixel Events] Erro ao salvar evento:", err);
  }

  const result = await sendToMetaConversionsAPI(pixelId, accessToken, eventData, "");

  // Atualizar status da API no banco
  try {
    const _db = await getDb(); if (_db) await _db.update(pixelEvents)
      .set({
        apiSent: result.success,
        apiResponse: result as any,
        apiError: result.error || null,
        apiSentAt: new Date(),
      })
      .where(eq(pixelEvents.eventId, eventId));
  } catch (err) {
    console.error("[Pixel Events] Erro ao atualizar status:", err);
  }

  return result;
}

export const trackingRouter = router({
  // Endpoint para receber eventos do frontend e enviar para Meta CAPI
  sendMetaEvent: publicProcedure
    .input(metaEventSchema)
    .mutation(async ({ input, ctx }: { input: z.infer<typeof metaEventSchema>; ctx: any }) => {
      // Obter configuração dos pixels do banco ou env
      const pixelId = process.env.META_PIXEL_ID;
      const accessToken = process.env.META_ACCESS_TOKEN;
      
      if (!pixelId || !accessToken) {
        console.warn("[Meta CAPI] Pixel ID ou Access Token não configurado");
        return { success: false, error: "Meta CAPI não configurado" };
      }

      // Obter IP do cliente do contexto da requisição
      const clientIp = (ctx as any).req?.headers?.["x-forwarded-for"]?.split(",")[0] || 
                       (ctx as any).req?.socket?.remoteAddress || 
                       "";

      // Salvar evento no banco
      try {
        const dbInsert = await getDb();
        if (dbInsert) await dbInsert.insert(pixelEvents).values({
          eventId: input.event_id,
          eventName: input.event_name,
          eventSource: "api",
          sourceUrl: input.event_source_url,
          userAgent: input.user_data?.client_user_agent || null,
          ipAddress: clientIp,
          fbc: input.user_data?.fbc || null,
          fbp: input.user_data?.fbp || null,
          eventData: input.custom_data || null,
          value: input.custom_data?.value ? String(input.custom_data.value) : null,
          currency: input.custom_data?.currency || "BRL",
          contentId: input.custom_data?.content_id || null,
          contentName: input.custom_data?.content_name || null,
          contentType: input.custom_data?.content_type || null,
        });
      } catch (err) {
        console.error("[Pixel Events] Erro ao salvar evento:", err);
      }

      const result = await sendToMetaConversionsAPI(pixelId, accessToken, input, clientIp);

      // Atualizar status da API no banco
      try {
        const dbUpdate = await getDb();
        if (dbUpdate) await dbUpdate.update(pixelEvents)
          .set({
            apiSent: result.success,
            apiResponse: result as any,
            apiError: result.error || null,
            apiSentAt: new Date(),
          })
          .where(eq(pixelEvents.eventId, input.event_id));
      } catch (err) {
        console.error("[Pixel Events] Erro ao atualizar status:", err);
      }

      return result;
    }),

  // Endpoint para enviar evento para TikTok Events API
  sendTikTokEvent: publicProcedure
    .input(metaEventSchema)
    .mutation(async ({ input, ctx }: { input: z.infer<typeof metaEventSchema>; ctx: any }) => {
      const pixelId = process.env.TIKTOK_PIXEL_ID;
      const accessToken = process.env.TIKTOK_ACCESS_TOKEN;
      
      if (!pixelId || !accessToken) {
        console.warn("[TikTok Events API] Pixel ID ou Access Token não configurado");
        return { success: false, error: "TikTok Events API não configurado" };
      }

      const clientIp = (ctx as any).req?.headers?.["x-forwarded-for"]?.split(",")[0] || 
                       (ctx as any).req?.socket?.remoteAddress || 
                       "";

      return sendToTikTokEventsAPI(pixelId, accessToken, input, clientIp);
    }),

  // Webhook da Cakto para evento Purchase
  caktoWebhook: publicProcedure
    .input(z.object({
      event: z.string(),
      data: z.object({
        transaction_id: z.string().optional(),
        order_id: z.string().optional(),
        status: z.string().optional(),
        customer: z.object({
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          document: z.string().optional(),
        }).optional(),
        product: z.object({
          id: z.string().optional(),
          name: z.string().optional(),
          price: z.number().optional(),
        }).optional(),
        payment: z.object({
          method: z.string().optional(),
          amount: z.number().optional(),
          currency: z.string().optional(),
        }).optional(),
      }).passthrough(),
    }).passthrough())
    .mutation(async ({ input }) => {
      console.log("[Cakto Webhook] Evento recebido:", input.event, input.data);

      // Salvar log do webhook
      try {
        const _db = await getDb(); if (_db) await _db.insert(webhookLogs).values({
          source: "cakto",
          eventType: input.event,
          payload: input as any,
          relatedEmail: input.data.customer?.email || null,
        });
      } catch (err) {
        console.error("[Webhook Log] Erro ao salvar:", err);
      }

      // Processar eventos de pagamento confirmado
      if (input.event === "payment.confirmed" || input.event === "sale.completed" || input.event === "order.paid") {
        const customer = input.data.customer;
        const product = input.data.product;
        const payment = input.data.payment;

        if (customer?.email && payment?.amount) {
          const result = await sendPurchaseEvent(
            customer.email,
            customer.phone || "",
            customer.name || "",
            payment.amount / 100, // Cakto envia em centavos
            payment.currency || "BRL",
            input.data.order_id || input.data.transaction_id || `cakto_${Date.now()}`,
            product?.name || "FitPrime Subscription"
          );

          // Atualizar log como processado
          try {
            const _db = await getDb(); if (_db) await _db.update(webhookLogs)
              .set({
                processed: true,
                processedAt: new Date(),
                error: result.error || null,
              })
              .where(eq(webhookLogs.relatedEmail, customer.email));
          } catch (err) {
            console.error("[Webhook Log] Erro ao atualizar:", err);
          }

          // Enviar alerta de conversão por email para o admin
          try {
            const { sendConversionAlertEmail } = await import('../email');
            const adminEmail = process.env.OWNER_EMAIL || 'admin@fitprimemanager.com';
            await sendConversionAlertEmail(
              adminEmail,
              customer.name || 'Cliente',
              customer.email,
              product?.name || 'FitPrime Subscription',
              payment.amount / 100,
              payment.method || 'Não informado'
            );
            console.log('[Cakto Webhook] Alerta de conversão enviado para:', adminEmail);
          } catch (emailErr) {
            console.error('[Cakto Webhook] Erro ao enviar alerta de conversão:', emailErr);
          }

          return { success: true, purchase_event_sent: result.success };
        }
      }

      return { success: true, message: "Webhook recebido" };
    }),

  // Endpoint para testar conexão com Meta CAPI
  testMetaConnection: publicProcedure
    .input(z.object({
      pixelId: z.string(),
      accessToken: z.string(),
    }))
    .mutation(async ({ input }: { input: { pixelId: string; accessToken: string } }) => {
      try {
        // Enviar evento de teste
        const testEvent = {
          event_name: "TestEvent",
          event_time: Math.floor(Date.now() / 1000),
          event_id: `test_${Date.now()}`,
          event_source_url: "https://fitprimemanager.com/test",
          action_source: "website",
          user_data: {
            client_user_agent: "Test Connection",
          },
          custom_data: {
            test: true,
          },
        };

        const result = await sendToMetaConversionsAPI(
          input.pixelId,
          input.accessToken,
          testEvent,
          "127.0.0.1"
        );

        return result;
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }),

  // Listar eventos do pixel (para dashboard)
  listEvents: publicProcedure
    .input(z.object({
      limit: z.number().default(100),
      offset: z.number().default(0),
      eventName: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const conditions = [];
      
      if (input.eventName) {
        conditions.push(eq(pixelEvents.eventName, input.eventName));
      }
      
      if (input.startDate) {
        conditions.push(gte(pixelEvents.createdAt, new Date(input.startDate)));
      }
      
      if (input.endDate) {
        conditions.push(lte(pixelEvents.createdAt, new Date(input.endDate)));
      }

      const _dbEvents = await getDb();
      if (!_dbEvents) throw new Error('Database not available');
      const events = await _dbEvents.select()
        .from(pixelEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(pixelEvents.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      const dbTotal = await getDb();
      if (!dbTotal) throw new Error('Database not available');
      const totalResult = await dbTotal.select({ count: sql<number>`count(*)` })
        .from(pixelEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        events,
        total: totalResult[0]?.count || 0,
      };
    }),

  // Estatísticas dos eventos (para dashboard)
  getEventStats: publicProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const conditions = [];
      
      if (input.startDate) {
        conditions.push(gte(pixelEvents.createdAt, new Date(input.startDate)));
      }
      
      if (input.endDate) {
        conditions.push(lte(pixelEvents.createdAt, new Date(input.endDate)));
      }

      // Total de eventos
      const dbStats = await getDb();
      if (!dbStats) throw new Error('Database not available');
      const totalResult = await dbStats.select({ count: sql<number>`count(*)` })
        .from(pixelEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Eventos por tipo
      const eventsByType = await dbStats.select({
        eventName: pixelEvents.eventName,
        count: sql<number>`count(*)`,
      })
        .from(pixelEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(pixelEvents.eventName);

      // Taxa de sucesso da API
      const apiSuccessResult = await dbStats.select({
        total: sql<number>`count(*)`,
        success: sql<number>`sum(case when apiSent = true then 1 else 0 end)`,
      })
        .from(pixelEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const apiStats = apiSuccessResult[0];
      const successRate = apiStats?.total > 0 
        ? Math.round((Number(apiStats.success) / Number(apiStats.total)) * 100) 
        : 0;

      // Eventos por fonte
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const eventsBySource = await db.select({
        eventSource: pixelEvents.eventSource,
        count: sql<number>`count(*)`,
      })
        .from(pixelEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .groupBy(pixelEvents.eventSource);

      // Valor total de Purchase
      const purchaseValueResult = await db.select({
        total: sql<number>`sum(cast(value as decimal(10,2)))`,
      })
        .from(pixelEvents)
        .where(and(
          eq(pixelEvents.eventName, "Purchase"),
          ...(conditions.length > 0 ? conditions : [])
        ));

      // Eventos por dia (últimos 30 dias)
      const eventsByDay = await db.select({
        date: sql<string>`date(createdAt)`,
        count: sql<number>`count(*)`,
      })
        .from(pixelEvents)
        .where(gte(pixelEvents.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
        .groupBy(sql`date(createdAt)`)
        .orderBy(sql`date(createdAt)`);

      return {
        total: totalResult[0]?.count || 0,
        eventsByType,
        eventsBySource,
        apiSuccessRate: successRate,
        apiTotal: Number(apiStats?.total) || 0,
        apiSuccess: Number(apiStats?.success) || 0,
        purchaseValue: purchaseValueResult[0]?.total || 0,
        eventsByDay,
      };
    }),

  // Listar logs de webhook
  listWebhookLogs: publicProcedure
    .input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
      source: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const conditions = [];
      
      if (input.source) {
        conditions.push(eq(webhookLogs.source, input.source));
      }

      const db2 = await getDb();
      if (!db2) throw new Error('Database not available');
      const logs = await db2.select()
        .from(webhookLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(webhookLogs.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return logs;
    }),
});
