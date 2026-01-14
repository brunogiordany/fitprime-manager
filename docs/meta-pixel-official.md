# Meta Pixel - Documentação Oficial

## Código Base Oficial

O código base do Meta Pixel deve ser colocado entre as tags `<head>` de todas as páginas:

```html
<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', '{your-pixel-id-goes-here}');
  fbq('track', 'PageView');
</script>
<noscript>
  <img height="1" width="1" style="display:none" 
       src="https://www.facebook.com/tr?id={your-pixel-id-goes-here}&ev=PageView&noscript=1"/>
</noscript>
<!-- End Facebook Pixel Code -->
```

## Pontos Importantes

1. O código deve ser colocado entre as tags `<head>` para reduzir chances de bloqueio
2. A tag `<noscript>` deve estar dentro do `<body>` para fallback
3. O código baixa uma biblioteca de funções que inclui `fbq.callMethod`
4. O `fbq('track', 'PageView')` deve ser chamado automaticamente

## Verificação

- Após instalar, carregar uma página que tenha o Pixel
- Verificar no Events Manager se o evento PageView foi registrado
- Usar o Pixel Helper para diagnosticar problemas

## Nosso Problema

O `fbq.callMethod` está retornando `false`, o que indica que o script `fbevents.js` não está executando completamente. Possíveis causas:
- Bloqueador de anúncios
- Política de CSP bloqueando
- Conflito com outros scripts
