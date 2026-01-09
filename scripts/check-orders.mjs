/**
 * Script para verificar pedidos recentes na Cakto
 */

const CAKTO_API_URL = "https://api.cakto.com.br";
const CLIENT_ID = "mq965nMR8wsUJnqODGIXgAQpXTQbim5koAFEvh3N";
const CLIENT_SECRET = "U3o8v2BZBfYQARVD3rSHymslQRk3ZV2kHa99U1NjH5u0fa5vEJSkjqCZQlscDIkzhL05ldnTl3qBUitYwlnq5P9zwBZQfoHYgvi2898Rgo1QnbIFa8BhzZTbKsWusFSm";

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

async function listOrders(token, email = null) {
  let url = `${CAKTO_API_URL}/public_api/orders/?limit=20&ordering=-id`;
  if (email) {
    url += `&search=${encodeURIComponent(email)}`;
  }
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao listar pedidos: ${response.status}`);
  }

  return response.json();
}

async function getOrderDetails(token, orderId) {
  const response = await fetch(`${CAKTO_API_URL}/public_api/orders/${orderId}/`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Falha ao obter pedido: ${response.status}`);
  }

  return response.json();
}

async function main() {
  try {
    console.log("🔑 Obtendo token...");
    const token = await getToken();
    
    console.log("\n📦 Buscando pedidos recentes...");
    const orders = await listOrders(token);
    
    console.log(`Total de pedidos: ${orders.count}`);
    
    if (orders.results && orders.results.length > 0) {
      console.log("\n=== PEDIDOS RECENTES ===\n");
      
      for (const order of orders.results) {
        console.log(`ID: ${order.id}`);
        console.log(`  Status: ${order.status}`);
        console.log(`  Cliente: ${order.customer?.name} (${order.customer?.email})`);
        console.log(`  Telefone: ${order.customer?.phone}`);
        console.log(`  Produto: ${order.product?.name}`);
        console.log(`  Valor: R$ ${order.amount}`);
        console.log(`  Método: ${order.payment_method}`);
        console.log(`  Tipo: ${order.type}`);
        console.log(`  Criado: ${order.created_at}`);
        console.log(`  Pago em: ${order.paid_at || 'N/A'}`);
        console.log("");
      }
      
      // Buscar detalhes do primeiro pedido aprovado
      const approvedOrder = orders.results.find(o => o.status === 'approved');
      if (approvedOrder) {
        console.log("\n=== DETALHES DO PEDIDO APROVADO ===\n");
        const details = await getOrderDetails(token, approvedOrder.id);
        console.log(JSON.stringify(details, null, 2));
      }
    }
    
    // Buscar especificamente por nutriliffee@gmail.com
    console.log("\n📧 Buscando pedidos de nutriliffee@gmail.com...");
    const nutriliffeeOrders = await listOrders(token, "nutriliffee@gmail.com");
    
    if (nutriliffeeOrders.results && nutriliffeeOrders.results.length > 0) {
      console.log(`\nEncontrados ${nutriliffeeOrders.results.length} pedidos:`);
      for (const order of nutriliffeeOrders.results) {
        console.log(`  - ${order.id}: ${order.status} - R$ ${order.amount}`);
      }
    } else {
      console.log("Nenhum pedido encontrado para este email.");
    }
    
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

main();
