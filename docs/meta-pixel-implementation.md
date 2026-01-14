# Meta Pixel - Implementação Oficial

## Código Base Oficial do Meta Pixel

O código base do Pixel deve ser adicionado entre as tags `<head>` de todas as páginas:

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

1. O código deve estar no `<head>` para reduzir chances de bloqueio
2. O código executa mais cedo, aumentando chance de rastrear visitantes
3. O `fbq('track', 'PageView')` deve ser chamado automaticamente em cada página
4. Usar a tag `<noscript>` como fallback para navegadores sem JavaScript

## Pixel ID do FitPrime

O Pixel ID é: `898343203142628`
