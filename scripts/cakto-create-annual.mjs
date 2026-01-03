/**
 * Script para criar ofertas anuais no Cakto
 */

const CAKTO_API_URL = "https://api.cakto.com.br";
const CLIENT_ID = "mq965nMR8wsUJnqODGIXgAQpXTQbim5koAFEvh3N";
const CLIENT_SECRET = "U3o8v2BZBfYQARVD3rSHymslQRk3ZV2kHa99U1NjH5u0fa5vEJSkjqCZQlscDIkzhL05ldnTl3qBUitYwlnq5P9zwBZQfoHYgvi2898Rgo1QnbIFa8BhzZTbKsWusFSm";

// ID do produto base FitPrime Manager
const PRODUCT_ID = "8965eb5a-5433-43a0-a60e-5c34f2bdc84c";

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

async function createOffer(name, price, slug) {
  console.log(`\nCriando oferta anual: ${name} - R$ ${price} - slug: ${slug}`);
  
  const body = {
    product: PRODUCT_ID,
    name,
    price: price, // Preço em reais (a API pode converter)
    slug,
    status: "active",
    type: "subscription",
    intervalType: "year", // Anual
    interval: 1,
    recurrence_period: 365,
    quantity_recurrences: -1, // Infinito
    trial_days: 0,
    max_retries: 3,
    retry_interval: 1,
  };

  console.log("Payload:", JSON.stringify(body, null, 2));

  const response = await caktoRequest("/public_api/offers/", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const responseText = await response.text();
  console.log(`Response status: ${response.status}`);
  console.log(`Response body: ${responseText}`);

  if (!response.ok) {
    console.error(`Erro ao criar oferta: ${response.status}`);
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

// Ofertas anuais a serem criadas
// Preço anual = preço mensal × 12 × 0.8 (20% desconto)
const ANNUAL_OFFERS = [
  { name: "FitPrime Starter Anual", price: 932, slug: "starter_anual" },
  { name: "FitPrime Pro Anual", price: 1411, slug: "pro_anual" },
  { name: "FitPrime Business Anual", price: 1891, slug: "business_anual" },
  { name: "FitPrime Premium Anual", price: 2851, slug: "premium_anual" },
  { name: "FitPrime Enterprise Anual", price: 4771, slug: "enterprise_anual" },
];

async function main() {
  try {
    console.log("=== Criando ofertas anuais no Cakto ===\n");
    
    const results = [];
    
    for (const offer of ANNUAL_OFFERS) {
      const result = await createOffer(offer.name, offer.price, offer.slug);
      results.push({ ...offer, result });
      
      // Aguardar um pouco entre as requisições
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("\n=== Resumo ===");
    for (const r of results) {
      console.log(`${r.name}: ${r.result ? 'OK' : 'ERRO'}`);
    }
    
  } catch (error) {
    console.error("Erro:", error.message);
  }
}

main();
