/**
 * Script para buscar detalhes do produto e link de checkout na Cakto
 */

const CAKTO_API_URL = "https://api.cakto.com.br";
const PRODUCT_ID = "8965eb5a-5433-43a0-a60e-5c34f2bdc84c";

async function getToken() {
  const clientId = process.env.CAKTO_CLIENT_ID;
  const clientSecret = process.env.CAKTO_CLIENT_SECRET;

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

async function getProductDetails(token) {
  console.log("📦 Buscando detalhes do produto...");

  const response = await fetch(`${CAKTO_API_URL}/public_api/products/${PRODUCT_ID}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.log("Resposta:", text);
    throw new Error(`Failed to get product: ${response.status}`);
  }

  return response.json();
}

async function getCheckoutLinks(token) {
  console.log("\n🔗 Buscando links de checkout...");

  const response = await fetch(`${CAKTO_API_URL}/public_api/checkout-links/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Resposta:", text);
    return null;
  }

  return response.json();
}

async function getOffers(token) {
  console.log("\n💰 Buscando ofertas...");

  const response = await fetch(`${CAKTO_API_URL}/public_api/offers/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Resposta:", text);
    return null;
  }

  return response.json();
}

async function main() {
  try {
    const token = await getToken();
    
    // Detalhes do produto
    const product = await getProductDetails(token);
    console.log("\n=== DETALHES DO PRODUTO ===");
    console.log(JSON.stringify(product, null, 2));

    // Links de checkout
    const checkoutLinks = await getCheckoutLinks(token);
    if (checkoutLinks) {
      console.log("\n=== LINKS DE CHECKOUT ===");
      console.log(JSON.stringify(checkoutLinks, null, 2));
    }

    // Ofertas
    const offers = await getOffers(token);
    if (offers) {
      console.log("\n=== OFERTAS ===");
      console.log(JSON.stringify(offers, null, 2));
    }

  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

main();
