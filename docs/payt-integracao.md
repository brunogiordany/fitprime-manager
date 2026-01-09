# Integração Payt - FitPrime Manager

## Visão Geral

A integração com a Payt permite vender planos do FitPrime através de afiliados e influenciadores, com controle preciso de comissões.

**Documentação oficial da Payt:** https://github.com/ventuinha/payt-postback

## Lógica de Comissões

> **Importante:** Apenas o **primeiro pagamento** gera comissão para o afiliado. Todas as renovações subsequentes ficam 100% para o produtor (você).

Isso significa que:
- Venda inicial: Afiliado recebe a comissão configurada
- Renovação mensal 2, 3, 4...: Afiliado não recebe nada
- Renovação anual: Afiliado não recebe nada

## Configuração do Webhook

### URL do Webhook

Configure na Payt o seguinte URL de postback:

```
https://seu-dominio.com/api/payt/webhook
```

### Chave de Integração

1. Acesse o painel da Payt
2. Copie sua **Integration Key**
3. Configure a variável de ambiente `PAYT_INTEGRATION_KEY` no FitPrime

## Produtos na Payt

Você precisa criar os produtos na Payt com os seguintes códigos (ou atualizar o mapeamento no código):

### Planos Mensais

| Código do Produto | Plano | Preço | Alunos |
|-------------------|-------|-------|--------|
| FITPRIME_BEGINNER | Beginner | R$ 39,90 | 5 |
| FITPRIME_STARTER | Starter | R$ 97,00 | 15 |
| FITPRIME_PRO | Pro | R$ 147,00 | 30 |
| FITPRIME_BUSINESS | Business | R$ 197,00 | 50 |
| FITPRIME_PREMIUM | Premium | R$ 297,00 | 100 |
| FITPRIME_ENTERPRISE | Enterprise | R$ 497,00 | Ilimitado |

### Planos Anuais (20% desconto)

| Código do Produto | Plano | Preço | Alunos |
|-------------------|-------|-------|--------|
| FITPRIME_STARTER_ANUAL | Starter Anual | R$ 932,00 | 18 |
| FITPRIME_PRO_ANUAL | Pro Anual | R$ 1.411,00 | 36 |
| FITPRIME_BUSINESS_ANUAL | Business Anual | R$ 1.891,00 | 60 |
| FITPRIME_PREMIUM_ANUAL | Premium Anual | R$ 2.851,00 | 120 |
| FITPRIME_ENTERPRISE_ANUAL | Enterprise Anual | R$ 4.771,00 | Ilimitado |

## Eventos Processados

### Eventos de Pagamento

| Status | Ação |
|--------|------|
| `paid` | Ativa conta do personal |
| `billed` | Ativa conta do personal |
| `subscription_activated` | Ativa assinatura |
| `subscription_renewed` | Renova assinatura (sem comissão) |
| `subscription_canceled` | Cancela assinatura |
| `subscription_overdue` | Marca como inadimplente |
| `subscription_reactivated` | Reativa assinatura |
| `canceled` | Cancela acesso |

### Eventos Ignorados

| Status | Motivo |
|--------|--------|
| `waiting_payment` | Aguardando pagamento |
| `lost_cart` | Carrinho abandonado |

## Fluxo de Ativação

### Usuário Novo (não cadastrado)

1. Afiliado vende o plano
2. Payt envia webhook com status `paid`
3. Sistema cria **pending activation** com token único
4. Email de boas-vindas é enviado com link de ativação
5. Personal clica no link e cria sua conta
6. Conta é ativada automaticamente com o plano correto

### Usuário Existente (já cadastrado)

1. Afiliado vende o plano
2. Payt envia webhook com status `paid`
3. Sistema identifica usuário pelo email
4. Assinatura é ativada automaticamente
5. Email de confirmação é enviado

## Estrutura do Webhook

Exemplo de payload recebido da Payt:

```json
{
  "integration_key": "sua-chave-de-integracao",
  "transaction_id": "TXN123456",
  "seller_id": "SELLER001",
  "test": false,
  "type": "order",
  "status": "paid",
  "tangible": false,
  "cart_id": "CART001",
  "customer": {
    "name": "João Silva",
    "fake_email": false,
    "email": "joao@example.com",
    "doc": "12345678901",
    "phone": "11999999999"
  },
  "product": {
    "name": "FitPrime Starter",
    "price": 9700,
    "code": "FITPRIME_STARTER",
    "type": "digital",
    "quantity": 1
  },
  "transaction": {
    "payment_method": "pix",
    "payment_status": "paid",
    "total_price": 9700,
    "quantity": 1
  },
  "subscription": {
    "code": "SUB001",
    "plan_name": "Starter Mensal",
    "charges": 1,
    "periodicity": "1 month",
    "next_charge_at": "2026-02-09",
    "status": "active"
  },
  "commission": [
    {
      "name": "Plataforma",
      "email": "platform@payt.com",
      "type": "platform",
      "amount": 970
    },
    {
      "name": "Afiliado João",
      "email": "joao@afiliado.com",
      "type": "affiliate",
      "amount": 4365
    },
    {
      "name": "Produtor",
      "email": "producer@fitprime.com",
      "type": "producer",
      "amount": 4365
    }
  ]
}
```

## Verificação de Primeira Cobrança

O sistema verifica automaticamente se é a primeira cobrança através do campo `subscription.charges`:

```typescript
// Se charges === 1, é primeira cobrança (afiliado recebe comissão)
// Se charges > 1, é renovação (afiliado NÃO recebe comissão)
function isFirstCharge(subscription?: PaytSubscription): boolean {
  if (!subscription) return true; // Compra única
  return subscription.charges === 1;
}
```

## Logs e Debugging

Todos os webhooks são logados no console com prefixo `[Payt Webhook]`:

```
[Payt Webhook] ========================================
[Payt Webhook] Received event - Status: paid
[Payt Webhook] Type: order
[Payt Webhook] Transaction ID: TXN123456
[Payt Webhook] Customer: joao@example.com
[Payt Webhook] Product: FitPrime Starter Code: FITPRIME_STARTER
[Payt Webhook] Test mode: false
[Payt Webhook] Processing purchase for: joao@example.com
[Payt Webhook] First charge (affiliate commission): true
[Payt Webhook] Commissions:
  - platform: Plataforma (platform@payt.com) - R$ 9,70
  - affiliate: Afiliado João (joao@afiliado.com) - R$ 43,65
  - producer: Produtor (producer@fitprime.com) - R$ 43,65
[Payt Webhook] Action taken: activated_existing
[Payt Webhook] ========================================
```

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `PAYT_INTEGRATION_KEY` | Chave de integração da Payt | Sim |
| `VITE_APP_URL` | URL base do app (para links de ativação) | Sim |

## Testando a Integração

### Modo de Teste

A Payt envia `test: true` no payload quando está em modo de homologação. Em produção, esses eventos são ignorados.

### Testando Localmente

Use o seguinte comando curl para simular um webhook:

```bash
curl -X POST http://localhost:3000/api/payt/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "integration_key": "test-key",
    "transaction_id": "TEST123",
    "seller_id": "SELLER001",
    "test": true,
    "type": "order",
    "status": "paid",
    "tangible": false,
    "cart_id": "CART001",
    "customer": {
      "name": "Teste Personal",
      "fake_email": false,
      "email": "teste@example.com",
      "doc": "12345678901",
      "phone": "11999999999",
      "ip": "127.0.0.1",
      "code": "CUST001",
      "url": ""
    },
    "product": {
      "name": "FitPrime Starter",
      "price": 9700,
      "code": "FITPRIME_STARTER",
      "sku": "FP-STARTER",
      "type": "digital",
      "quantity": 1
    },
    "link": {
      "title": "Checkout",
      "url": ""
    },
    "transaction": {
      "payment_method": "pix",
      "payment_status": "paid",
      "total_price": 9700,
      "quantity": 1,
      "created_at": "2026-01-09 10:00:00",
      "updated_at": "2026-01-09 10:00:00"
    },
    "subscription": {
      "code": "SUB001",
      "plan_name": "Starter",
      "charges": 1,
      "periodicity": "1 month",
      "next_charge_at": "2026-02-09",
      "status": "active",
      "started_at": "2026-01-09 10:00:00"
    },
    "started_at": "2026-01-09 10:00:00",
    "updated_at": "2026-01-09 10:00:00"
  }'
```

## Diferenças entre Payt e Cakto

| Aspecto | Payt | Cakto |
|---------|------|-------|
| Foco | Afiliados e influenciadores | Vendas diretas |
| Comissões | Configurável por afiliado | Não aplicável |
| Lógica de comissão | Apenas primeiro pagamento | N/A |
| Webhook URL | `/api/payt/webhook` | `/api/cakto/webhook` |
| Identificador | `payt_` prefix | `cakto_` prefix |

## Suporte

Em caso de dúvidas sobre a integração, consulte:
- Documentação da Payt: https://github.com/ventuinha/payt-postback
- Suporte FitPrime: suporte@fitprimemanager.com
