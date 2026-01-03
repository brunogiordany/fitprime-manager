# Documentação Cakto Webhooks

## Eventos Disponíveis

- `initiate_checkout` - Início de Checkout
- `checkout_abandonment` - Abandono de Checkout
- `purchase_approved` - Compra aprovada
- `purchase_refused` - Compra recusada
- `pix_gerado` - Pix gerado
- `boleto_gerado` - Boleto gerado
- `picpay_gerado` - PicPay gerado
- `openfinance_nubank_gerado` - Nubank gerado
- `chargeback` - Chargeback
- `refund` - Reembolso
- `subscription_created` - Assinatura criada
- `subscription_canceled` - Assinatura cancelada
- `subscription_renewed` - Assinatura renovada
- `subscription_renewal_refused` - Renovação de assinatura recusada

## Configuração do Webhook

1. Acessar Painel Cakto > Apps > Webhooks
2. Clicar em "Adicionar"
3. Configurar:
   - Nome: ex: "FitPrime - Compra Aprovada"
   - URL: URL do endpoint do FitPrime
   - Produtos: Selecionar os planos
   - Eventos: Selecionar eventos desejados

## Requisitos

- URL deve estar preparada para receber requisições POST com JSON
- Aplicação deve responder em até 5 segundos

## Teste de Webhook

1. Usar Request Bin (https://requestbin.com) para gerar URL de teste
2. Configurar webhook com URL do Request Bin
3. Clicar nos três pontinhos > "Enviar evento de teste"
4. Verificar se o evento chegou no Request Bin

## Payload de Compra Aprovada (purchase_approved)

O webhook envia dados como:
- Dados do cliente (nome, email, telefone)
- Dados do produto comprado
- Dados da transação
- Status da compra
