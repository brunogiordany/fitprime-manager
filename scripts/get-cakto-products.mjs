/**
 * Script para buscar produtos na Cakto
 */

const CAKTO_API_URL = "https://api.cakto.com.br";

async function getToken() {
  const clientId = process.env.CAKTO_CLIENT_ID;
  const clientSecret = process.env.CAKTO_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Cakto credentials not configured. Set CAKTO_CLIENT_ID and CAKTO_CLIENT_SECRET");
  }

  console.log("🔐 Autenticando na Cakto...");

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
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json();
  console.log("✅ Autenticação bem sucedida!");
  return data.access_token;
}

async function getProducts(token) {
  console.log("\n📦 Buscando produtos...");

  const response = await fetch(`${CAKTO_API_URL}/public_api/products/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get products: ${response.status}`);
  }

  return response.json();
}

async function main() {
  try {
    const token = await getToken();
    const products = await getProducts(token);

    console.log("\n=== PRODUTOS ENCONTRADOS ===\n");
    
    if (products.results && products.results.length > 0) {
      products.results.forEach((product, index) => {
        console.log(`--- Produto ${index + 1} ---`);
        console.log(`ID: ${product.id}`);
        console.log(`Nome: ${product.name}`);
        console.log(`Preço: R$ ${(product.price / 100).toFixed(2)}`);
        console.log(`Tipo: ${product.type}`);
        console.log(`Status: ${product.status}`);
        console.log(`Checkout URL: ${product.checkout_url || 'N/A'}`);
        console.log(`Link: ${product.link || 'N/A'}`);
        console.log("");
      });
    } else {
      console.log("Nenhum produto encontrado.");
      console.log("Resposta completa:", JSON.stringify(products, null, 2));
    }

  } catch (error) {
    console.error("❌ Erro:", error.message);
  }
}

main();
