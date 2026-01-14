# Meta Conversions API - Implementação

## Endpoint

```
POST https://graph.facebook.com/{API_VERSION}/{PIXEL_ID}/events?access_token={TOKEN}
```

## Exemplo de Request Body

```json
{
   "data": [
      {
         "event_name": "Purchase",
         "event_time": 1633552688,
         "event_id": "event.id.123",
         "event_source_url": "http://jaspers-market.com/product/123",         
         "action_source": "website",
         "user_data": {
            "client_ip_address": "192.19.9.9",
            "client_user_agent": "test ua",
            "em": [
               "309a0a5c3e211326ae75ca18196d301a9bdbd1a882a4d2569511033da23f0abd"
            ],
            "ph": [
               "254aa248acb47dd654ca3ea53f48c2c26d641d23d7e2e93a1ec56258df7674c4"
            ],
            "fbc": "fb.1.1554763741205.AbCdEfGhIjKlMnOpQrStUvWxYz1234567890",
            "fbp": "fb.1.1558571054389.1098115397"
         },
         "custom_data": {
            "value": 100.2,
            "currency": "USD",
            "content_ids": [
               "product.id.123"
            ],
            "content_type": "product"
         },
         "opt_out": false
      }
   ]
}
```

## Parâmetros Obrigatórios

- **event_name**: Nome do evento (PageView, Purchase, Lead, etc.)
- **event_time**: Timestamp Unix em segundos
- **action_source**: "website" para eventos web
- **user_data**: Dados do usuário para matching
  - client_ip_address
  - client_user_agent
  - em (email hashado com SHA256)
  - ph (telefone hashado com SHA256)
  - fbc (Facebook Click ID do cookie)
  - fbp (Facebook Browser ID do cookie)
  - external_id (ID persistente do usuário)

## Hashing

Os seguintes parâmetros devem ser hashados com SHA256 antes de enviar:
- em (email)
- ph (telefone)
- fn (primeiro nome)
- ln (sobrenome)
- external_id

## Pixel ID do FitPrime

O Pixel ID é: `898343203142628`

## Access Token

O Access Token está configurado na variável de ambiente: `META_ACCESS_TOKEN`
