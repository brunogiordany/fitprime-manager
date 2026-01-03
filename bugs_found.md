# Bugs Encontrados

## 1. Erro 404 ao editar medidas (lado do Personal)
- URL: `/medidas/1?edit=120001`
- O botão de lápis no histórico de medidas redireciona para uma rota que não existe
- Precisa verificar o componente UnifiedEvolutionDashboard ou onde o histórico é renderizado

## 2. Modal de edição fechando no Portal do Aluno
- O calendário e campos de medidas fecham automaticamente
- Provavelmente relacionado ao Accordion ou foco do Dialog

## 3. Falta gráfico de Cálculos Automáticos visível
- O gráfico de IMC, BF Estimado, Massa Gorda, Massa Magra só aparece no modal de edição
- Precisa adicionar fora do modal para visualização

## 4. Modal de Análise IA do Personal não atualizado
- O layout não foi atualizado como os outros modais
