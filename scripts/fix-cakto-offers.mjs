#!/usr/bin/env node

/**
 * Script para deletar ofertas antigas e recriar com preços corretos
 * 
 * Ofertas antigas com preços errados (multiplicados por 1000):
 * - Starter: et3mdsp (R$ 49.700,00 em vez de R$ 97,00)
 * - Pro: z23hmm5 (R$ 49.700,00 em vez de R$ 147,00)
 * - Business: 3ce3ep8 (R$ 49.700,00 em vez de R$ 197,00)
 * - Premium: j9ousdy (R$ 49.700,00 em vez de R$ 297,00)
 * - Enterprise: ptzzce2 (R$ 49.700,00 em vez de R$ 497,00)
 */

const CAKTO_API_URL = "https://api.cakto.com.br";
const PRODUCT_ID = "8965eb5a-5433-43a0-a60e-5c34f2bdc84c";

// Ofertas antigas com preços errados
const OLD_OFFERS = {
  starter: "et3mdsp",
  pro: "z23hmm5",
  business: "3ce3ep8",
  premium: "j9ousdy",
  enterprise: "ptzzce2",
};

// Novos preços (em centavos)
const NEW_PLANS = {
  starter: { name: "Starter", price: 9700, studentLimit: 15 },
  pro: { name: "Pro", price: 14700, studentLimit: 25 },
  business: { name: "Business", price: 19700, studentLimit: 40 },
  premium: { name: "Premium", price: 29700, studentLimit: 70 },
  enterprise: { name: "Enterprise", price: 49700, studentLimit: 150 },
};

let cachedToken = null;

async function getCaktoToken() {
  if (cachedToken) return cachedToken;

  const clientId = process.env.CAKTO_CLIENT_ID;
  const clientSecret = process.env.CAKTO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Cakto credentials not configured");
  }

  const response = await fetch(`${CAKTO_API_URL}/public_api/token/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Cakto authentication failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = data.access_token;
  return cachedToken;
}

async function caktoRequest(endpoint, options = {}) {
  const token = await getCaktoToken();

  return fetch(`${CAKTO_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

async function deleteOffer(offerId) {
  console.log(`🗑️  Deletando oferta ${offerId}...`);
  
  const response = await caktoRequest(`/public_api/offer/${offerId}/`, {
    method: "DELETE",
  });

  if (response.ok) {
    console.log(`✅ Oferta ${offerId} deletada com sucesso`);
    return true;
  } else {
    const error = await response.text();
    console.log(`⚠️  Não foi possível deletar ${offerId}: ${error}`);
    return false;
  }
}

async function createOffer(planKey, planData) {
  console.log(`📝 Criando oferta ${planData.name} (R$ ${(planData.price / 100).toFixed(2)})...`);
  
  const body = {
    product: PRODUCT_ID,
    name: planData.name,
    price: planData.price,
    type: "subscription",
    billing_cycle: "monthly",
  };

  const response = await caktoRequest("/public_api/offer/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Erro ao criar oferta ${planData.name}: ${error}`);
    return null;
  }

  const data = await response.json();
  console.log(`✅ Oferta ${planData.name} criada com ID: ${data.id}`);
  console.log(`   Link: https://pay.cakto.com.br/${data.id}`);
  
  return data.id;
}

async function main() {
  try {
    console.log("🔐 Autenticando na Cakto...");
    await getCaktoToken();
    console.log("✅ Autenticação bem sucedida!\n");

    console.log("=" .repeat(70));
    console.log("DELETANDO OFERTAS ANTIGAS E CRIANDO NOVAS COM PREÇOS CORRETOS");
    console.log("=" .repeat(70) + "\n");

    // Deletar ofertas antigas
    console.log("📋 Deletando ofertas antigas com preços errados...\n");
    for (const [planKey, offerId] of Object.entries(OLD_OFFERS)) {
      await deleteOffer(offerId);
    }

    console.log("\n✅ Todas as ofertas antigas foram processadas!\n");

    // Criar novas ofertas com preços corretos
    console.log("📋 Criando novas ofertas com preços corretos...\n");
    const newOfferIds = {};
    
    for (const [planKey, planData] of Object.entries(NEW_PLANS)) {
      const offerId = await createOffer(planKey, planData);
      if (offerId) {
        newOfferIds[planKey] = offerId;
      }
    }

    console.log("\n" + "=" .repeat(70));
    console.log("✅ PROCESSO CONCLUÍDO COM SUCESSO!");
    console.log("=" .repeat(70) + "\n");

    // Exibir resumo
    console.log("📊 RESUMO DAS OFERTAS CRIADAS:");
    console.log("-".repeat(70));
    for (const [planKey, planData] of Object.entries(NEW_PLANS)) {
      const offerId = newOfferIds[planKey];
      if (offerId) {
        console.log(`${planData.name.padEnd(15)} | R$ ${(planData.price / 100).toFixed(2).padEnd(8)} | ${offerId}`);
        console.log(`  → https://pay.cakto.com.br/${offerId}`);
      }
    }

    console.log("\n💾 Atualize o arquivo shared/plans.ts com os novos IDs!");

  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

main();
