/**
 * Meta Conversions API Router
 * Endpoint para enviar eventos server-side para o Meta (Facebook)
 * 
 * Seguindo a documentação oficial:
 * https://developers.facebook.com/docs/marketing-api/conversions-api/
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import crypto from "crypto";

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
): Promise<{ success: boolean; error?: string; fbtrace_id?: string }> {
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
      return { success: true, fbtrace_id: result.fbtrace_id };
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

export const trackingRouter = router({
  // Endpoint para receber eventos do frontend e enviar para Meta CAPI
  sendMetaEvent: publicProcedure
    .input(metaEventSchema)
    .mutation(async ({ input, ctx }: { input: z.infer<typeof metaEventSchema>; ctx: any }) => {
      // Obter configuração dos pixels do banco ou env
      // Por enquanto, vamos usar variáveis de ambiente
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

      return sendToMetaConversionsAPI(pixelId, accessToken, input, clientIp);
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
});
