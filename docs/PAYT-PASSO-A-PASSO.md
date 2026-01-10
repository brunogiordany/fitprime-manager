# Guia Completo: Configuração da Payt para FitPrime

## Índice
1. [Criar Conta na Payt](#1-criar-conta-na-payt)
2. [Obter Chave de Integração](#2-obter-chave-de-integração)
3. [Configurar Webhook no FitPrime](#3-configurar-webhook-no-fitprime)
4. [Criar Produtos na Payt](#4-criar-produtos-na-payt)
5. [Configurar Afiliados](#5-configurar-afiliados)
6. [Testar a Integração](#6-testar-a-integração)
7. [Códigos de Referência](#7-códigos-de-referência)

---

## 1. Criar Conta na Payt

1. Acesse [https://payt.com.br](https://payt.com.br) ou [https://app.payt.com.br](https://app.payt.com.br)
2. Clique em "Criar Conta" ou "Cadastre-se"
3. Preencha seus dados como **Produtor**
4. Confirme seu email
5. Complete o cadastro com dados bancários para receber pagamentos

---

## 2. Obter Chave de Integração

### Passo a Passo:

1. Faça login no painel da Payt
2. Vá em **Configurações** → **Integrações** ou **API**
3. Localize a seção **"Chave de Integração"** ou **"Integration Key"**
4. Copie a chave (será algo como: `pk_live_xxxxxxxxxxxxxxxxxxxxxxxx`)
5. Guarde essa chave em local seguro

### Exemplo de Chave:
```
pk_live_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

## 3. Configurar Webhook no FitPrime

### 3.1 Adicionar a Chave de Integração

1. Acesse o painel do FitPrime Manager
2. Vá em **Configurações** → **Secrets** (ou Settings → Secrets)
3. Adicione uma nova variável:
   - **Nome:** `PAYT_INTEGRATION_KEY`
   - **Valor:** Cole sua chave de integração da Payt

### 3.2 Configurar URL do Webhook na Payt

1. No painel da Payt, vá em **Configurações** → **Webhooks** ou **Postback**
2. Adicione um novo webhook com as seguintes configurações:

| Campo | Valor |
|-------|-------|
| **URL do Webhook** | `https://seu-dominio.manus.space/api/payt/webhook` |
| **Método** | POST |
| **Formato** | JSON |
| **Eventos** | Todos (ou selecione os específicos abaixo) |

### 3.3 Eventos para Ativar

Marque os seguintes eventos:
- ✅ `paid` - Pagamento aprovado
- ✅ `billed` - Faturado
- ✅ `subscription_activated` - Assinatura ativada
- ✅ `subscription_renewed` - Assinatura renovada
- ✅ `subscription_canceled` - Assinatura cancelada
- ✅ `subscription_overdue` - Assinatura em atraso
- ✅ `subscription_reactivated` - Assinatura reativada
- ✅ `canceled` - Cancelado
- ⬜ `waiting_payment` - Opcional (apenas log)
- ⬜ `lost_cart` - Opcional (carrinho abandonado)

---

## 4. Criar Produtos na Payt

### 4.1 Produtos Mensais

Crie os seguintes produtos na Payt. **IMPORTANTE:** Use exatamente estes códigos SKU.

#### Produto 1: Beginner
| Campo | Valor |
|-------|-------|
| Nome | FitPrime Beginner |
| Descrição | Plano ideal para quem está começando. Até 5 alunos. |
| Preço | R$ 39,90 |
| Tipo | Digital / Assinatura |
| Recorrência | Mensal |
| **Código SKU** | `FITPRIME_BEGINNER` |

#### Produto 2: Starter
| Campo | Valor |
|-------|-------|
| Nome | FitPrime Starter |
| Descrição | Plano para personais em crescimento. Até 15 alunos. |
| Preço | R$ 97,00 |
| Tipo | Digital / Assinatura |
| Recorrência | Mensal |
| **Código SKU** | `FITPRIME_STARTER` |

#### Produto 3: Pro
| Campo | Valor |
|-------|-------|
| Nome | FitPrime Pro |
| Descrição | Plano profissional. Até 30 alunos. |
| Preço | R$ 147,00 |
| Tipo | Digital / Assinatura |
| Recorrência | Mensal |
| **Código SKU** | `FITPRIME_PRO` |

#### Produto 4: Business
| Campo | Valor |
|-------|-------|
| Nome | FitPrime Business |
| Descrição | Plano para estúdios. Até 50 alunos. |
| Preço | R$ 197,00 |
| Tipo | Digital / Assinatura |
| Recorrência | Mensal |
| **Código SKU** | `FITPRIME_BUSINESS` |

#### Produto 5: Premium
| Campo | Valor |
|-------|-------|
| Nome | FitPrime Premium |
| Descrição | Plano completo. Até 100 alunos. |
| Preço | R$ 297,00 |
| Tipo | Digital / Assinatura |
| Recorrência | Mensal |
| **Código SKU** | `FITPRIME_PREMIUM` |

#### Produto 6: Enterprise
| Campo | Valor |
|-------|-------|
| Nome | FitPrime Enterprise |
| Descrição | Plano ilimitado para grandes operações. |
| Preço | R$ 497,00 |
| Tipo | Digital / Assinatura |
| Recorrência | Mensal |
| **Código SKU** | `FITPRIME_ENTERPRISE` |

### 4.2 Produtos Anuais (20% desconto)

#### Produto 7: Starter Anual
| Campo | Valor |
|-------|-------|
| Nome | FitPrime Starter Anual |
| Descrição | Plano Starter com 20% de desconto. Até 18 alunos. |
| Preço | R$ 932,00 |
| Tipo | Digital / Assinatura |
| Recorrência | Anual |
| **Código SKU** | `FITPRIME_STARTER_ANUAL` |

#### Produto 8: Pro Anual
| Campo | Valor |
|-------|-------|
| Nome | FitPrime Pro Anual |
| Descrição | Plano Pro com 20% de desconto. Até 36 alunos. |
| Preço | R$ 1.411,00 |
| Tipo | Digital / Assinatura |
| Recorrência | Anual |
| **Código SKU** | `FITPRIME_PRO_ANUAL` |

#### Produto 9: Business Anual
| Campo | Valor |
|-------|-------|
| Nome | FitPrime Business Anual |
| Descrição | Plano Business com 20% de desconto. Até 60 alunos. |
| Preço | R$ 1.891,00 |
| Tipo | Digital / Assinatura |
| Recorrência | Anual |
| **Código SKU** | `FITPRIME_BUSINESS_ANUAL` |

#### Produto 10: Premium Anual
| Campo | Valor |
|-------|-------|
| Nome | FitPrime Premium Anual |
| Descrição | Plano Premium com 20% de desconto. Até 120 alunos. |
| Preço | R$ 2.851,00 |
| Tipo | Digital / Assinatura |
| Recorrência | Anual |
| **Código SKU** | `FITPRIME_PREMIUM_ANUAL` |

#### Produto 11: Enterprise Anual
| Campo | Valor |
|-------|-------|
| Nome | FitPrime Enterprise Anual |
| Descrição | Plano Enterprise com 20% de desconto. Ilimitado. |
| Preço | R$ 4.771,00 |
| Tipo | Digital / Assinatura |
| Recorrência | Anual |
| **Código SKU** | `FITPRIME_ENTERPRISE_ANUAL` |

---

## 5. Configurar Afiliados

### 5.1 Criar Programa de Afiliados

1. No painel da Payt, vá em **Afiliados** → **Programa de Afiliados**
2. Ative o programa de afiliados
3. Configure as comissões:

### 5.2 Configuração de Comissões (IMPORTANTE!)

> **Lembre-se:** O sistema FitPrime está configurado para que afiliados recebam comissão **APENAS no primeiro pagamento**. Renovações ficam 100% para você.

| Configuração | Valor Sugerido |
|--------------|----------------|
| Comissão do Afiliado | 30% a 50% (apenas 1ª venda) |
| Tipo de Comissão | Percentual |
| Recorrência | Primeira venda apenas |

### 5.3 Convidar Afiliados

1. Vá em **Afiliados** → **Convidar**
2. Envie o link de cadastro para seus afiliados/influenciadores
3. Cada afiliado receberá um link único de checkout

### 5.4 Links de Checkout para Afiliados

Após criar os produtos, você terá links como:

```
https://pay.payt.com.br/checkout/FITPRIME_STARTER?ref=CODIGO_AFILIADO
```

Cada afiliado terá seu próprio código de referência.

---

## 6. Testar a Integração

### 6.1 Modo de Teste na Payt

1. Na Payt, ative o **Modo de Homologação/Teste**
2. Use cartões de teste fornecidos pela Payt
3. Faça uma compra de teste

### 6.2 Verificar Logs no FitPrime

Após a compra de teste, verifique os logs do servidor. Você deve ver:

```
[Payt Webhook] ========================================
[Payt Webhook] Received event - Status: paid
[Payt Webhook] Type: order
[Payt Webhook] Transaction ID: TXN_TEST_123
[Payt Webhook] Customer: teste@example.com
[Payt Webhook] Product: FitPrime Starter Code: FITPRIME_STARTER
[Payt Webhook] Test mode: true
[Payt Webhook] First charge (affiliate commission): true
[Payt Webhook] Action taken: pending_activation
[Payt Webhook] ========================================
```

### 6.3 Script de Teste Manual

Use este comando curl para testar o webhook manualmente:

```bash
curl -X POST https://seu-dominio.manus.space/api/payt/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "integration_key": "SUA_CHAVE_AQUI",
    "transaction_id": "TEST_'$(date +%s)'",
    "seller_id": "SELLER001",
    "test": true,
    "type": "order",
    "status": "paid",
    "tangible": false,
    "cart_id": "CART_TEST",
    "customer": {
      "name": "Personal Teste",
      "fake_email": false,
      "email": "teste_'$(date +%s)'@example.com",
      "doc": "12345678901",
      "phone": "11999999999",
      "ip": "127.0.0.1",
      "code": "CUST_TEST",
      "url": ""
    },
    "product": {
      "name": "FitPrime Starter",
      "price": 9700,
      "code": "FITPRIME_STARTER",
      "sku": "FITPRIME_STARTER",
      "type": "digital",
      "quantity": 1
    },
    "link": {
      "title": "Checkout FitPrime",
      "url": ""
    },
    "transaction": {
      "payment_method": "pix",
      "payment_status": "paid",
      "total_price": 9700,
      "quantity": 1,
      "created_at": "'$(date '+%Y-%m-%d %H:%M:%S')'",
      "updated_at": "'$(date '+%Y-%m-%d %H:%M:%S')'"
    },
    "subscription": {
      "code": "SUB_TEST_001",
      "plan_name": "Starter Mensal",
      "charges": 1,
      "periodicity": "1 month",
      "next_charge_at": "'$(date -d '+1 month' '+%Y-%m-%d')'",
      "status": "active",
      "started_at": "'$(date '+%Y-%m-%d %H:%M:%S')'"
    },
    "commission": [
      {
        "name": "Afiliado Teste",
        "email": "afiliado@teste.com",
        "type": "affiliate",
        "amount": 4850
      }
    ],
    "started_at": "'$(date '+%Y-%m-%d %H:%M:%S')'",
    "updated_at": "'$(date '+%Y-%m-%d %H:%M:%S')'"
  }'
```

### 6.4 Verificar Email de Ativação

Após o teste, verifique se o email de ativação foi enviado para o endereço de teste.

---

## 7. Códigos de Referência

### 7.1 Tabela de Códigos SKU

| Plano | Código SKU | Preço |
|-------|------------|-------|
| Beginner Mensal | `FITPRIME_BEGINNER` | R$ 39,90 |
| Starter Mensal | `FITPRIME_STARTER` | R$ 97,00 |
| Pro Mensal | `FITPRIME_PRO` | R$ 147,00 |
| Business Mensal | `FITPRIME_BUSINESS` | R$ 197,00 |
| Premium Mensal | `FITPRIME_PREMIUM` | R$ 297,00 |
| Enterprise Mensal | `FITPRIME_ENTERPRISE` | R$ 497,00 |
| Starter Anual | `FITPRIME_STARTER_ANUAL` | R$ 932,00 |
| Pro Anual | `FITPRIME_PRO_ANUAL` | R$ 1.411,00 |
| Business Anual | `FITPRIME_BUSINESS_ANUAL` | R$ 1.891,00 |
| Premium Anual | `FITPRIME_PREMIUM_ANUAL` | R$ 2.851,00 |
| Enterprise Anual | `FITPRIME_ENTERPRISE_ANUAL` | R$ 4.771,00 |

### 7.2 URL do Webhook

```
https://seu-dominio.manus.space/api/payt/webhook
```

Substitua `seu-dominio` pelo seu domínio real.

### 7.3 Variáveis de Ambiente Necessárias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `PAYT_INTEGRATION_KEY` | Chave de integração da Payt | `pk_live_abc123...` |

---

## Checklist Final

- [ ] Conta criada na Payt
- [ ] Chave de integração obtida
- [ ] Variável `PAYT_INTEGRATION_KEY` configurada no FitPrime
- [ ] Webhook configurado na Payt com URL correta
- [ ] Todos os 11 produtos criados com códigos SKU corretos
- [ ] Programa de afiliados ativado
- [ ] Comissões configuradas (apenas primeira venda)
- [ ] Teste realizado com sucesso
- [ ] Email de ativação recebido

---

## Suporte

Se tiver dúvidas:
- **Documentação Payt:** https://github.com/ventuinha/payt-postback
- **Suporte Payt:** Acesse o chat no painel da Payt

---

## Fluxo Resumido

```
1. Afiliado compartilha link → 
2. Personal compra plano → 
3. Payt processa pagamento → 
4. Payt envia webhook para FitPrime → 
5. FitPrime cria conta pendente → 
6. Email enviado para Personal → 
7. Personal clica no link e ativa conta → 
8. Afiliado recebe comissão (apenas 1ª venda)
```

Nas renovações:
```
1. Payt cobra automaticamente → 
2. Payt envia webhook (subscription_renewed) → 
3. FitPrime renova assinatura → 
4. Afiliado NÃO recebe comissão (você fica com 100%)
```
