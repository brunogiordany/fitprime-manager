# Sistema de Afiliados da Cakto

## Como funciona o comissionamento

Na Cakto, o comissionamento acontece por meio de **cookies de rastreamento**:

1. Quando alguém clica no link de afiliado, um cookie é gerado no navegador
2. Se a pessoa realizar a compra dentro do período de validade do cookie e usando o mesmo navegador, a comissão é atribuída automaticamente

## Quando a comissão NÃO acontece

- Navegação em modo anônimo (aba anônima)
- Bloqueadores de cookies ou extensões no navegador
- Link acessado em um navegador, mas compra finalizada em outro
- Intervalo muito grande entre clique e compra
- Tempo de validade do cookie expirado

## Configurações do Produtor

A duração do cookie é definida pelo vendedor:
- 1 dia
- 30 dias
- Tempo indeterminado
- Outro período específico

## Como convidar afiliados

Na Cakto, você pode atrair afiliados de duas formas:
1. Enviando um convite direto via link
2. Publicando seu produto na vitrine de afiliados

## Como convidar afiliados (no painel Cakto)

1. Acessar painel de **Produtos** > aba **Afiliados**
2. Habilitar programa de afiliados
3. Configurar:
   - Link de programa de afiliados
   - Comissão (%)
   - Habilitar clonagem do quiz (se aplicável)
   - Aprovar cada solicitação de afiliação manualmente (ou automático)
   - Liberar acesso aos dados de contato dos compradores
   - Receber comissão de Upsell
   - Mostrar produto no marketplace público (requer R$5.000 em vendas)
4. Copiar **link de convite** para compartilhar com afiliados

## Aprovar/Recusar afiliados

- Menu lateral **Afiliados** > **Pendentes**
- Aprovar ou recusar individualmente ou em lote
- Se "Aprovar automaticamente" estiver habilitado, não precisa aprovar manualmente

## Próximos passos para implementar no FitPrime

1. Configurar comissão padrão para afiliados no painel Cakto
2. Gerar links de afiliados para os personals indicarem
3. Rastrear vendas por afiliado via webhook (campo affiliate no payload)
4. Criar dashboard de afiliados no FitPrime Manager
