/**
 * Script para verificar histórico de webhooks e reenviar eventos
 */

const CAKTO_API_URL = "https://api.cakto.com.br";
const CLIENT_ID = "mq965nMR8wsUJnqODGIXgAQpXTQbim5koAFEvh3N";
const CLIENT_SECRET = "U3o8v2BZBfYQARVD3rSHymslQRk3ZV2kHa99U1NjH5u0fa5vEJSkjqCZQlscDIkzhL05ldnTl3qBUitYwlnq5P9zwBZQfoHYgvi2898Rgo1QnbIFa8BhzZTbKsWusFSm";

const WEBHOOK_ID = "33740"; // ID do webhook configurado

async function getToken() {
  const response = await fetch(`${CAKTO_API_URL}/public_api/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha na autenticação: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function getWebhookHistory(token) {
  console.log("\n📋 Buscando histórico de eventos do webhook...");
  
  const response = await fetch(`${CAKTO_API_URL}/public_api/webhook/event_history/?app_id=${WEBHOOK_ID}&ordering=-sentAt`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao buscar histórico: ${response.status} - ${text}`);
  }

  return response.json();
}

async function resendWebhookEvent(token, eventId) {
  console.log(`\n🔄 Reenviando evento ${eventId}...`);
  
  const response = await fetch(`${CAKTO_API_URL}/public_api/webhook/event_resend/${eventId}/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha ao reenviar: ${response.status} - ${text}`);
  }

  return response.json();
}

async function main() {
  try {
    console.log("🔑 Obtendo token...");
    const token = await getToken();
    
    // Buscar histórico de eventos
    const history = await getWebhookHistory(token);
    
    console.log(`\nTotal de eventos: ${history.count || history.length || 'N/A'}`);
    
    const events = history.results || history;
    
    if (events && events.length > 0) {
      console.log("\n=== HISTÓRICO DE EVENTOS ===\n");
      
      for (const event of events.slice(0, 10)) {
        console.log(`ID: ${event.id}`);
        console.log(`  Evento: ${event.event_id} (${event.event_name})`);
        console.log(`  Status HTTP: ${event.event_status}`);
        console.log(`  URL: ${event.url}`);
        console.log(`  Enviado em: ${event.sentAt}`);
        if (event.payload?.data) {
          console.log(`  Cliente: ${event.payload.data.customer?.name} (${event.payload.data.customer?.email})`);
          console.log(`  Pedido: ${event.payload.data.id}`);
        }
        if (event.response) {
          console.log(`  Resposta: ${JSON.stringify(event.response).substring(0, 100)}`);
        }
        console.log("");
      }
      
      // Encontrar evento de purchase_approved mais recente
      const purchaseEvent = events.find(e => 
        e.event_id === 'purchase_approved' || e.event_id === 'subscription_created'
      );
      
      if (purchaseEvent) {
        console.log(`\n🎯 Encontrado evento de compra: ${purchaseEvent.id}`);
        console.log(`   Tipo: ${purchaseEvent.event_id}`);
        console.log(`   Status HTTP: ${purchaseEvent.event_status}`);
        
        // Perguntar se deve reenviar
        const args = process.argv.slice(2);
        if (args.includes('--resend')) {
          const result = await resendWebhookEvent(token, purchaseEvent.id);
          console.log("✅ Evento reenviado:", result);
        } else {
          console.log("\n💡 Para reenviar, execute: node scripts/resend-webhook.mjs --resend");
        }
      }
    } else {
      console.log("Nenhum evento encontrado no histórico.");
    }
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

main();
