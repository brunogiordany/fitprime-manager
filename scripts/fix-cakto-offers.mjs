/**
 * Script para corrigir os preços das ofertas na Cakto
 */

const CAKTO_API_URL = "https://api.cakto.com.br";

// IDs das ofertas criadas anteriormente
const OFFER_IDS = [
  "et3mdsp", // Starter
  "z23hmm5", // Pro
  "3ce3ep8", // Business
  "j9ousdy", // Premium
  "ptzzce2"  // Enterprise
];

// Planos com preços CORRETOS em reais
const PLANS = [
  {
    name: "Starter",
    price: 97,
    studentLimit: 15,
    extraStudentPrice: 6.47,
    offerId: "et3mdsp"
  },
  {
    name: "Pro",
    price: 147,
    studentLimit: 25,
    extraStudentPrice: 5.88,
    offerId: "z23hmm5"
  },
  {
    name: "Business",
    price: 197,
    studentLimit: 40,
    extraStudentPrice: 4.03,
    offerId: "3ce3ep8"
  },
  {
    name: "Premium",
    price: 297,
    studentLimit: 70,
    extraStudentPrice: 4.24,
    offerId: "j9ousdy"
  },
  {
    name: "Enterprise",
    price: 497,
    studentLimit: 150,
    extraStudentPrice: 3.31,
    offerId: "ptzzce2"
  }
];

async function getToken() {
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

  const data = await response.json();
  return data.access_token;
}

async function deleteOffer(token, offerId) {
  console.log(`🗑️  Deletando oferta: ${offerId}`);

  const response = await fetch(`${CAKTO_API_URL}/public_api/offers/${offerId}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    console.log(`✅ Oferta deletada com sucesso!`);
  } else {
    console.log(`⚠️  Oferta não encontrada ou já deletada`);
  }
}

async function updateOffer(token, plan) {
  console.log(`\n✏️  Atualizando oferta: ${plan.name} (R$ ${plan.price}/mês)`);

  // Preço em centavos (correto)
  const priceInCents = Math.round(plan.price * 100);

  const updateData = {
    price: priceInCents,
  };

  const response = await fetch(`${CAKTO_API_URL}/public_api/offers/${plan.offerId}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Erro ao atualizar oferta ${plan.name}:`, error);
    return null;
  }

  const offer = await response.json();
  console.log(`✅ Oferta atualizada com sucesso!`);
  console.log(`   ID: ${offer.id}`);
  console.log(`   Preço: R$ ${(offer.price / 100).toFixed(2)}/mês`);
  console.log(`   Link: https://pay.cakto.com.br/${offer.id}`);

  return offer;
}

async function main() {
  try {
    console.log("🔐 Autenticando na Cakto...");
    const token = await getToken();
    console.log("✅ Autenticação bem sucedida!\n");

    console.log("=" .repeat(60));
    console.log("CORRIGINDO PREÇOS DAS OFERTAS");
    console.log("=" .repeat(60));

    for (const plan of PLANS) {
      await updateOffer(token, plan);
    }

    console.log("\n" + "=" .repeat(60));
    console.log("✅ TODAS AS OFERTAS FORAM CORRIGIDAS!");
    console.log("=" .repeat(60));

  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

main();
