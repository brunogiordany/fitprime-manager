/**
 * Script para criar ofertas (variações de preço) na Cakto
 * Baseado na estratégia de precificação do FitPrime
 */

const CAKTO_API_URL = "https://api.cakto.com.br";
const PRODUCT_ID = "8965eb5a-5433-43a0-a60e-5c34f2bdc84c"; // FitPrime Manager

// Planos B2B com preços e limites de alunos
const PLANS = [
  {
    name: "Starter",
    price: 97,
    studentLimit: 15,
    extraStudentPrice: 6.47,
    description: "Perfeito para começar"
  },
  {
    name: "Pro",
    price: 147,
    studentLimit: 25,
    extraStudentPrice: 5.88,
    description: "Para personais em crescimento"
  },
  {
    name: "Business",
    price: 197,
    studentLimit: 40,
    extraStudentPrice: 4.03,
    description: "Para personais consolidados"
  },
  {
    name: "Premium",
    price: 297,
    studentLimit: 70,
    extraStudentPrice: 4.24,
    description: "Para estúdios pequenos"
  },
  {
    name: "Enterprise",
    price: 497,
    studentLimit: 150,
    extraStudentPrice: 3.31,
    description: "Para grandes estúdios"
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

async function createOffer(token, plan) {
  console.log(`\n📦 Criando oferta: ${plan.name} (R$ ${plan.price}/mês)`);

  const offerData = {
    name: `FitPrime ${plan.name}`,
    price: Math.round(plan.price * 100), // Cakto usa centavos
    units: 1,
    product: PRODUCT_ID,
    status: "active",
    type: "subscription",
    intervalType: "lifetime",
    interval: 1,
    recurrence_period: 30,
    quantity_recurrences: -1, // Infinito
    trial_days: 1, // 1 dia de trial
    max_retries: 3,
    retry_interval: 1
  };

  const response = await fetch(`${CAKTO_API_URL}/public_api/offers/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(offerData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`❌ Erro ao criar oferta ${plan.name}:`, error);
    return null;
  }

  const offer = await response.json();
  console.log(`✅ Oferta criada com sucesso!`);
  console.log(`   ID: ${offer.id}`);
  console.log(`   Link: https://pay.cakto.com.br/${offer.id}`);
  console.log(`   Limite de alunos: ${plan.studentLimit}`);
  console.log(`   Preço por aluno extra: R$ ${plan.extraStudentPrice.toFixed(2)}`);

  return offer;
}

async function main() {
  try {
    console.log("🔐 Autenticando na Cakto...");
    const token = await getToken();
    console.log("✅ Autenticação bem sucedida!\n");

    console.log("=" .repeat(60));
    console.log("CRIANDO OFERTAS DO FITPRIME");
    console.log("=" .repeat(60));

    const createdOffers = [];

    for (const plan of PLANS) {
      const offer = await createOffer(token, plan);
      if (offer) {
        createdOffers.push({
          ...plan,
          offerId: offer.id,
          checkoutUrl: `https://pay.cakto.com.br/${offer.id}`
        });
      }
    }

    console.log("\n" + "=" .repeat(60));
    console.log("RESUMO DAS OFERTAS CRIADAS");
    console.log("=" .repeat(60) + "\n");

    console.log("Copie este JSON para usar no seu sistema:\n");
    console.log(JSON.stringify(createdOffers, null, 2));

    // Salvar em arquivo
    const fs = await import('fs');
    fs.writeFileSync(
      'scripts/cakto-offers.json',
      JSON.stringify(createdOffers, null, 2)
    );
    console.log("\n✅ Ofertas salvas em scripts/cakto-offers.json");

  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

main();
