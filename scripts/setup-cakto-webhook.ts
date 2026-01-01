/**
 * Script to setup Cakto webhook for FitPrime Manager
 */

const CAKTO_API_URL = "https://api.cakto.com.br";
const WEBHOOK_URL = "https://fitprimemanager.com/api/cakto/webhook";

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

  if (!response.ok) {
    throw new Error(`Authentication failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function listProducts(token: string) {
  const response = await fetch(`${CAKTO_API_URL}/public_api/products/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list products: ${response.status}`);
  }

  return response.json();
}

async function createWebhook(token: string, productId?: string) {
  const body: Record<string, unknown> = {
    name: "FitPrime Manager - Pagamentos",
    url: WEBHOOK_URL,
    events: [
      "purchase_approved",
      "purchase_refused",
      "refund",
      "chargeback",
      "subscription_created",
      "subscription_canceled",
      "subscription_renewed",
      "subscription_renewal_refused",
    ],
    status: "active",
  };

  if (productId) {
    body.products = [productId];
  }

  const response = await fetch(`${CAKTO_API_URL}/public_api/webhook/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create webhook: ${response.status} - ${error}`);
  }

  return response.json();
}

async function listWebhooks(token: string) {
  const response = await fetch(`${CAKTO_API_URL}/public_api/webhook/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to list webhooks: ${response.status}`);
  }

  return response.json();
}

async function main() {
  console.log("🔐 Autenticando na Cakto...");
  const token = await getToken();
  console.log("✅ Autenticado com sucesso!\n");

  console.log("📦 Buscando produtos...");
  const products = await listProducts(token);
  console.log("Produtos encontrados:");
  
  if (products.results && products.results.length > 0) {
    for (const product of products.results) {
      console.log(`  - ID: ${product.id}`);
      console.log(`    Nome: ${product.name}`);
      console.log(`    Preço: R$ ${product.price}`);
      console.log(`    Status: ${product.status}`);
      console.log("");
    }
  } else {
    console.log("  Nenhum produto encontrado");
  }

  // Find FitPrime Manager product
  const fitprimeProduct = products.results?.find((p: any) => 
    p.name.toLowerCase().includes("fitprime")
  );

  console.log("\n🔗 Criando webhook...");
  const webhook = await createWebhook(token, fitprimeProduct?.id);
  console.log("✅ Webhook criado com sucesso!");
  console.log(`  ID: ${webhook.id}`);
  console.log(`  Nome: ${webhook.name}`);
  console.log(`  URL: ${webhook.url}`);
  console.log(`  Status: ${webhook.status}`);
  console.log(`  Secret: ${webhook.fields?.secret}`);
  console.log(`  Eventos: ${webhook.events?.map((e: any) => e.custom_id).join(", ")}`);

  console.log("\n📋 Listando todos os webhooks...");
  const webhooks = await listWebhooks(token);
  console.log(`Total de webhooks: ${webhooks.count || webhooks.results?.length || 0}`);
}

main().catch(console.error);
