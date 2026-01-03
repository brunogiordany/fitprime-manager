/**
 * Script para configurar produtos e webhooks no Cakto
 */

const CAKTO_API_URL = "https://api.cakto.com.br";
const CLIENT_ID = "mq965nMR8wsUJnqODGIXgAQpXTQbim5koAFEvh3N";
const CLIENT_SECRET = "U3o8v2BZBfYQARVD3rSHymslQRk3ZV2kHa99U1NjH5u0fa5vEJSkjqCZQlscDIkzhL05ldnTl3qBUitYwlnq5P9zwBZQfoHYgvi2898Rgo1QnbIFa8BhzZTbKsWusFSm";

let cachedToken = null;

async function getToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }

  console.log("Obtendo token de acesso...");
  
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
    const error = await response.text();
    throw new Error(`Falha na autenticação: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in * 1000),
  };

  console.log("Token obtido com sucesso!");
  return cachedToken.token;
}

async function caktoRequest(endpoint, options = {}) {
  const token = await getToken();

  return fetch(`${CAKTO_API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

async function listProducts() {
  console.log("\n=== Listando produtos existentes ===");
  
  const response = await caktoRequest("/public_api/products/");
  
  if (!response.ok) {
    const error = await response.text();
    console.error(`Erro ao listar produtos: ${response.status} - ${error}`);
    return [];
  }

  const data = await response.json();
  console.log("Produtos encontrados:", JSON.stringify(data, null, 2));
  return data;
}

async function listOffers() {
  console.log("\n=== Listando ofertas existentes ===");
  
  const response = await caktoRequest("/public_api/offers/");
  
  if (!response.ok) {
    const error = await response.text();
    console.error(`Erro ao listar ofertas: ${response.status} - ${error}`);
    return [];
  }

  const data = await response.json();
  console.log("Ofertas encontradas:", JSON.stringify(data, null, 2));
  return data;
}

async function listWebhooks() {
  console.log("\n=== Listando webhooks existentes ===");
  
  const response = await caktoRequest("/public_api/webhook/");
  
  if (!response.ok) {
    const error = await response.text();
    console.error(`Erro ao listar webhooks: ${response.status} - ${error}`);
    return [];
  }

  const data = await response.json();
  console.log("Webhooks encontrados:", JSON.stringify(data, null, 2));
  return data;
}

async function createProduct(name, description, price, type = "subscription", interval = "monthly") {
  console.log(`\nCriando produto: ${name} - R$ ${price}`);
  
  const body = {
    name,
    description,
    price: price * 100, // Cakto usa centavos
    type,
    interval,
    status: "active",
  };

  const response = await caktoRequest("/public_api/products/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Erro ao criar produto: ${response.status} - ${error}`);
    return null;
  }

  const data = await response.json();
  console.log("Produto criado:", JSON.stringify(data, null, 2));
  return data;
}

async function createOffer(productId, name, price, slug) {
  console.log(`\nCriando oferta: ${name} - R$ ${price} - slug: ${slug}`);
  
  const body = {
    product: productId,
    name,
    price: price * 100, // Cakto usa centavos
    slug,
    status: "active",
  };

  const response = await caktoRequest("/public_api/offers/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Erro ao criar oferta: ${response.status} - ${error}`);
    return null;
  }

  const data = await response.json();
  console.log("Oferta criada:", JSON.stringify(data, null, 2));
  return data;
}

// Planos anuais a serem criados
const ANNUAL_PLANS = [
  { name: "FitPrime Starter Anual", price: 932, slug: "starter_anual", description: "Plano Starter - Pagamento anual com 20% de desconto" },
  { name: "FitPrime Pro Anual", price: 1411, slug: "pro_anual", description: "Plano Pro - Pagamento anual com 20% de desconto" },
  { name: "FitPrime Business Anual", price: 1891, slug: "business_anual", description: "Plano Business - Pagamento anual com 20% de desconto" },
  { name: "FitPrime Premium Anual", price: 2851, slug: "premium_anual", description: "Plano Premium - Pagamento anual com 20% de desconto" },
  { name: "FitPrime Enterprise Anual", price: 4771, slug: "enterprise_anual", description: "Plano Enterprise - Pagamento anual com 20% de desconto" },
];

async function main() {
  try {
    // Primeiro, listar o que já existe
    await listProducts();
    await listOffers();
    await listWebhooks();
    
    console.log("\n=== Informações coletadas ===");
    console.log("Verifique os produtos e ofertas existentes acima.");
    console.log("Se precisar criar os planos anuais, descomente a seção abaixo.");
    
    // Descomentar para criar os planos anuais
    // console.log("\n=== Criando planos anuais ===");
    // for (const plan of ANNUAL_PLANS) {
    //   const product = await createProduct(plan.name, plan.description, plan.price, "subscription", "yearly");
    //   if (product) {
    //     await createOffer(product.id, plan.name, plan.price, plan.slug);
    //   }
    // }
    
  } catch (error) {
    console.error("Erro:", error.message);
  }
}

main();
