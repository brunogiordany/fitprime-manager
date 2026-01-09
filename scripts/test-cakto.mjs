/**
 * Script para testar a integração com a API da Cakto
 */

const CAKTO_API_URL = "https://api.cakto.com.br";
const CLIENT_ID = "mq965nMR8wsUJnqODGIXgAQpXTQbim5koAFEvh3N";
const CLIENT_SECRET = "U3o8v2BZBfYQARVD3rSHymslQRk3ZV2kHa99U1NjH5u0fa5vEJSkjqCZQlscDIkzhL05ldnTl3qBUitYwlnq5P9zwBZQfoHYgvi2898Rgo1QnbIFa8BhzZTbKsWusFSm";

async function getToken() {
  console.log("🔑 Obtendo token de acesso...");
  
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
  console.log("✅ Token obtido com sucesso!");
  return data.access_token;
}

async function listWebhooks(token) {
  console.log("\n📋 Listando webhooks configurados...");
  
  const response = await fetch(`${CAKTO_API_URL}/public_api/webhook/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao listar webhooks: ${response.status}`);
  }

  const data = await response.json();
  console.log("Webhooks encontrados:", JSON.stringify(data, null, 2));
  return data;
}

async function listOrders(token, limit = 10) {
  console.log(`\n📦 Listando últimos ${limit} pedidos...`);
  
  const response = await fetch(`${CAKTO_API_URL}/public_api/orders/?limit=${limit}&ordering=-created_at`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao listar pedidos: ${response.status}`);
  }

  const data = await response.json();
  console.log(`Total de pedidos: ${data.count}`);
  
  if (data.results && data.results.length > 0) {
    console.log("\nÚltimos pedidos:");
    for (const order of data.results) {
      console.log(`\n  ID: ${order.id}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Cliente: ${order.customer?.name} (${order.customer?.email})`);
      console.log(`  Produto: ${order.product?.name}`);
      console.log(`  Valor: R$ ${order.amount}`);
      console.log(`  Data: ${order.created_at}`);
    }
  }
  
  return data;
}

async function listProducts(token) {
  console.log("\n🛍️ Listando produtos...");
  
  const response = await fetch(`${CAKTO_API_URL}/public_api/products/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao listar produtos: ${response.status}`);
  }

  const data = await response.json();
  console.log(`Total de produtos: ${data.count}`);
  
  if (data.results && data.results.length > 0) {
    console.log("\nProdutos:");
    for (const product of data.results) {
      console.log(`\n  ID: ${product.id}`);
      console.log(`  Nome: ${product.name}`);
      console.log(`  Status: ${product.status}`);
      console.log(`  Tipo: ${product.type}`);
    }
  }
  
  return data;
}

async function main() {
  try {
    const token = await getToken();
    
    // Listar webhooks
    await listWebhooks(token);
    
    // Listar produtos
    await listProducts(token);
    
    // Listar pedidos recentes
    await listOrders(token, 5);
    
    console.log("\n✅ Teste concluído com sucesso!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

main();
