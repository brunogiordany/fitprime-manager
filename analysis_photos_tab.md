# Análise da Aba Fotos - UnifiedEvolutionDashboard

## Estrutura Atual
A aba "Fotos" no perfil do aluno usa o componente `UnifiedEvolutionDashboard` que tem 4 subtópicos internos:

### 1. Visão Geral (overview)
**Funcionalidades:**
- KPIs: Quantidade de fotos, medições, exercícios, dias de acompanhamento
- Resumo de evolução das medidas (peso, gordura, peito, cintura, braço, coxa)
- Gráfico de distribuição por grupo muscular (pizza)
- Comparação visual: Primeira foto vs Atual

**Duplicação:** Parcial - os KPIs são resumos, mas a comparação de fotos é única

### 2. Fotos (photos)
**Funcionalidades:**
- Galeria de fotos do aluno
- Upload de novas fotos
- Modo de comparação antes/depois com slider
- Análise com IA das fotos
- Zoom em fotos individuais

**Duplicação:** NÃO - Esta é a funcionalidade principal da aba

### 3. Medidas (measurements)
**Funcionalidades:**
- Botão "Nova Medida" 
- Botão "Histórico de Análises"
- Resumo de evolução das medidas
- Gráfico de evolução do peso
- Gráfico de evolução das circunferências
- Gráfico de evolução da gordura corporal

**Duplicação:** SIM - A aba principal "Evolução" já tem isso
**Funcionalidade única:** Botão "Histórico de Análises" - verificar se existe na aba Evolução

### 4. Treinos (training)
**Funcionalidades:**
- Filtro de exercícios por nome
- Seletor de exercício
- Seletor de período
- Estatísticas: Recorde, Média, Mínimo, Volume Total, Reps Totais, Tendência
- Gráfico de evolução de carga por exercício

**Duplicação:** PARCIAL - A aba principal "Treinos" mostra lista de treinos, não evolução de carga
**Funcionalidade única:** Gráfico de evolução de carga por exercício - verificar se existe em outro lugar

## Recomendação
1. MANTER: Subtópico "Fotos" (funcionalidade principal)
2. MANTER: Subtópico "Visão Geral" (resumo útil com comparação visual)
3. REMOVER: Subtópico "Medidas" (duplicado da aba Evolução)
4. REMOVER: Subtópico "Treinos" (duplicado, mas verificar se evolução de carga existe em outro lugar)

## Ação
- Verificar se a aba "Evolução" principal tem as mesmas funcionalidades de medidas
- Verificar se existe gráfico de evolução de carga em outro lugar
- Se não existir, adicionar na aba Treinos ou Evolução antes de remover
