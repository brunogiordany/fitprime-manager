# Integração da Anamnese com FitPrime Nutrition

**Documento de Análise**  
**Data:** Janeiro de 2026  
**Autor:** Manus AI

---

## 1. Resumo Executivo

Este documento analisa a anamnese atual do FitPrime Manager e identifica quais campos já existem, quais podem ser reaproveitados e quais precisam ser adicionados para suportar a criação de dietas no módulo FitPrime Nutrition.

**Conclusão:** A anamnese atual já possui **70% dos dados necessários** para criar uma dieta. Precisamos adicionar apenas alguns campos específicos de nutrição para chegar a 100%.

---

## 2. Dados Já Existentes (Podem Ser Reaproveitados)

### 2.1 Da Tabela `students` (Alunos)

| Campo Existente | Uso na Nutrição |
|-----------------|-----------------|
| `name` | Identificação do paciente |
| `email` | Contato |
| `phone` | Contato |
| `birthDate` | Cálculo de idade (importante para VET) |
| `gender` | Cálculo de TMB (fórmulas diferentes por sexo) |

### 2.2 Da Tabela `anamneses` (Anamnese Atual)

| Campo Existente | Uso na Nutrição | Status |
|-----------------|-----------------|--------|
| `occupation` | Nível de atividade no trabalho | ✅ Perfeito |
| `lifestyle` | Fator de atividade para VET | ✅ Perfeito |
| `sleepHours` | Qualidade de vida, recuperação | ✅ Perfeito |
| `sleepQuality` | Correlação com apetite/hormônios | ✅ Perfeito |
| `stressLevel` | Impacta cortisol e apetite | ✅ Perfeito |
| `medicalHistory` | Patologias que afetam dieta | ✅ Perfeito |
| `medications` | Interações droga-nutriente | ✅ Perfeito |
| `allergies` | Alergias alimentares | ✅ Perfeito |
| `mainGoal` | Objetivo principal (emagrecer, hipertrofiar) | ✅ Perfeito |
| `targetWeight` | Meta de peso | ✅ Perfeito |
| `mealsPerDay` | Número de refeições | ✅ Perfeito |
| `waterIntake` | Consumo de água | ✅ Perfeito |
| `dietRestrictions` | Restrições alimentares | ✅ Perfeito |
| `supplements` | Suplementos em uso | ✅ Perfeito |
| `dailyCalories` | Consumo calórico atual | ✅ Perfeito |
| `doesCardio` | Faz cardio? | ✅ Perfeito |
| `cardioActivities` | Tipo, frequência, duração | ✅ Perfeito |
| `weeklyFrequency` | Dias de treino por semana | ✅ Perfeito |
| `sessionDuration` | Duração do treino | ✅ Perfeito |

### 2.3 Da Tabela `measurements` (Medidas)

| Campo Existente | Uso na Nutrição | Status |
|-----------------|-----------------|--------|
| `weight` | Peso atual (essencial para VET) | ✅ Perfeito |
| `height` | Altura (essencial para VET) | ✅ Perfeito |
| `bodyFat` | % gordura (ajuste de macros) | ✅ Perfeito |
| `muscleMass` | Massa magra (cálculo de proteína) | ✅ Perfeito |
| `waist` | Circunferência abdominal | ✅ Perfeito |
| `hip` | Circunferência quadril | ✅ Perfeito |
| `bmi` | IMC calculado | ✅ Perfeito |
| `estimatedBMR` | TMB estimada | ✅ Perfeito |
| Dobras cutâneas | Todas as 7 dobras | ✅ Perfeito |
| Bioimpedância | Dados completos | ✅ Perfeito |

---

## 3. Campos que Faltam (Precisam Ser Adicionados)

Para deixar a anamnese **100% completa** para criação de dietas, precisamos adicionar os seguintes campos:

### 3.1 Hábitos Alimentares Detalhados

| Campo a Adicionar | Tipo | Descrição | Importância |
|-------------------|------|-----------|-------------|
| `eatingSpeed` | enum | Velocidade ao comer (rápido, normal, lento) | Saciedade, digestão |
| `chewingQuality` | enum | Qualidade da mastigação | Digestão |
| `mealTimes` | JSON | Horários habituais das refeições | Planejamento do plano |
| `snackingHabit` | enum | Belisca entre refeições? (nunca, às vezes, frequente) | Ajuste calórico |
| `weekendEating` | enum | Alimentação no fim de semana (igual, pior, melhor) | Estratégia de adesão |
| `emotionalEating` | boolean | Come por ansiedade/emoção? | Abordagem comportamental |
| `nightEating` | boolean | Come à noite/madrugada? | Distribuição calórica |

### 3.2 Preferências e Aversões Alimentares

| Campo a Adicionar | Tipo | Descrição | Importância |
|-------------------|------|-----------|-------------|
| `foodPreferences` | JSON | Alimentos que gosta | Adesão ao plano |
| `foodAversions` | JSON | Alimentos que não gosta | Evitar no plano |
| `cuisinePreferences` | JSON | Tipos de culinária preferidos (brasileira, japonesa, etc.) | Receitas |
| `spicyTolerance` | enum | Tolerância a pimenta/temperos | Receitas |
| `sweetTooth` | enum | Preferência por doces (baixa, média, alta) | Estratégias de substituição |

### 3.3 Intolerâncias e Condições Específicas

| Campo a Adicionar | Tipo | Descrição | Importância |
|-------------------|------|-----------|-------------|
| `lactoseIntolerance` | enum | Intolerância à lactose (não, leve, moderada, severa) | Substituições |
| `glutenIntolerance` | enum | Intolerância ao glúten (não, sensibilidade, celíaco) | Substituições |
| `vegetarianType` | enum | Tipo de vegetarianismo (não, flexitariano, vegetariano, vegano) | Base do plano |
| `religiousDiet` | varchar | Restrições religiosas (halal, kosher, etc.) | Respeito cultural |

### 3.4 Rotina Alimentar

| Campo a Adicionar | Tipo | Descrição | Importância |
|-------------------|------|-----------|-------------|
| `cookingAbility` | enum | Sabe cozinhar? (não, básico, intermediário, avançado) | Complexidade das receitas |
| `mealPrepTime` | enum | Tempo disponível para preparar refeições (pouco, médio, muito) | Praticidade do plano |
| `whoPreparesFood` | enum | Quem prepara as refeições (próprio, cônjuge, empregada, delivery) | Controle sobre alimentação |
| `eatsOut` | enum | Frequência de comer fora (raramente, 1-2x/sem, 3-5x/sem, diário) | Orientações para restaurantes |
| `workMeals` | enum | Como se alimenta no trabalho (leva marmita, restaurante, cantina) | Planejamento |

### 3.5 Histórico Nutricional

| Campo a Adicionar | Tipo | Descrição | Importância |
|-------------------|------|-----------|-------------|
| `previousDiets` | JSON | Dietas já feitas (low carb, cetogênica, etc.) | O que funcionou/não funcionou |
| `dietHistory` | text | Histórico detalhado de dietas | Contexto |
| `weightHistory` | JSON | Histórico de peso (maior peso, menor peso adulto) | Tendências |
| `yoyoEffect` | boolean | Já teve efeito sanfona? | Estratégia de manutenção |

### 3.6 Sintomas Gastrointestinais

| Campo a Adicionar | Tipo | Descrição | Importância |
|-------------------|------|-----------|-------------|
| `bowelFrequency` | enum | Frequência intestinal (diária, alternada, irregular) | Fibras |
| `constipation` | boolean | Tem constipação? | Ajuste de fibras/água |
| `bloating` | boolean | Sente inchaço/gases? | Alimentos fermentativos |
| `heartburn` | boolean | Tem azia/refluxo? | Alimentos a evitar |
| `foodIntoleranceSymptoms` | text | Sintomas após comer certos alimentos | Identificar gatilhos |

### 3.7 Consumo de Bebidas

| Campo a Adicionar | Tipo | Descrição | Importância |
|-------------------|------|-----------|-------------|
| `alcoholConsumption` | enum | Consumo de álcool (não, social, regular, frequente) | Calorias vazias |
| `alcoholType` | JSON | Tipos de bebida preferidos | Orientações |
| `coffeeConsumption` | int | Xícaras de café por dia | Cafeína |
| `sodaConsumption` | enum | Consumo de refrigerante (não, diet, regular) | Açúcar/adoçantes |
| `juiceConsumption` | enum | Consumo de sucos (não, natural, industrializado) | Açúcar |

### 3.8 Dados para Cálculo Preciso de VET

| Campo a Adicionar | Tipo | Descrição | Importância |
|-------------------|------|-----------|-------------|
| `workActivityLevel` | enum | Nível de atividade no trabalho (sentado, em pé, ativo, muito ativo) | Fator de atividade |
| `dailySteps` | int | Média de passos por dia (se usa smartwatch) | NEAT |
| `nonExerciseActivity` | enum | Atividades além do treino (caminhadas, escadas, etc.) | NEAT |

---

## 4. Proposta de Implementação

### 4.1 Opção A: Expandir a Anamnese Atual

Adicionar os novos campos diretamente na tabela `anamneses` existente. 

**Vantagens:**
- Dados centralizados
- Formulário único para o aluno preencher
- Integração automática

**Desvantagens:**
- Anamnese fica muito longa
- Campos de nutrição aparecem para quem não usa o módulo

### 4.2 Opção B: Criar Seção Separada (Recomendado)

Criar uma nova seção **"Nutrição"** dentro da anamnese existente, que só aparece quando o profissional tem CRN cadastrado.

**Estrutura sugerida:**

```
Anamnese Atual
├── Dados Pessoais ✅
├── Histórico Médico ✅
├── Objetivos ✅
├── Hábitos Alimentares ✅ (expandir)
├── Atividades Físicas ✅
├── Equipamentos e Local ✅
├── Restrições de Treino ✅
├── Ênfases Musculares ✅
└── 🥗 NUTRIÇÃO (NOVA SEÇÃO)
    ├── Preferências Alimentares
    ├── Intolerâncias
    ├── Rotina Alimentar
    ├── Histórico de Dietas
    ├── Sintomas GI
    └── Consumo de Bebidas
```

**Vantagens:**
- Organização clara
- Só aparece para quem precisa
- Não polui a anamnese de quem não usa nutrição

### 4.3 Opção C: Tabela Separada (Mais Flexível)

Criar uma nova tabela `nutrition_anamneses` vinculada ao `studentId`.

**Vantagens:**
- Total separação de responsabilidades
- Pode ter versões independentes
- Mais fácil de evoluir

**Desvantagens:**
- Dois formulários para preencher
- Mais complexidade no código

---

## 5. Campos Prioritários (MVP)

Para a primeira versão do FitPrime Nutrition, recomendo adicionar apenas os campos **essenciais** para criar uma dieta básica:

| Campo | Prioridade | Justificativa |
|-------|------------|---------------|
| `foodPreferences` | 🔴 Alta | Sem isso, plano terá baixa adesão |
| `foodAversions` | 🔴 Alta | Evitar alimentos que o paciente não come |
| `lactoseIntolerance` | 🔴 Alta | Muito comum no Brasil |
| `glutenIntolerance` | 🔴 Alta | Cada vez mais comum |
| `vegetarianType` | 🔴 Alta | Define toda a base do plano |
| `cookingAbility` | 🟡 Média | Define complexidade das receitas |
| `mealPrepTime` | 🟡 Média | Define praticidade |
| `eatsOut` | 🟡 Média | Orientações para restaurantes |
| `previousDiets` | 🟡 Média | Contexto importante |
| `bowelFrequency` | 🟡 Média | Ajuste de fibras |
| `alcoholConsumption` | 🟢 Baixa | Pode perguntar depois |
| `emotionalEating` | 🟢 Baixa | Abordagem comportamental avançada |

---

## 6. Resumo Final

### O que já temos (70%):

| Categoria | Campos Existentes |
|-----------|-------------------|
| **Dados Pessoais** | Nome, idade, gênero, contato |
| **Antropometria** | Peso, altura, % gordura, circunferências, TMB |
| **Objetivos** | Meta principal, peso alvo |
| **Hábitos Básicos** | Refeições/dia, água, restrições, suplementos |
| **Atividade Física** | Frequência, duração, cardio, tipo de treino |
| **Saúde** | Patologias, medicamentos, alergias |

### O que falta (30%):

| Categoria | Campos a Adicionar |
|-----------|-------------------|
| **Preferências** | Alimentos que gosta/não gosta, culinária |
| **Intolerâncias** | Lactose, glúten, vegetarianismo |
| **Rotina** | Quem cozinha, tempo disponível, come fora |
| **Histórico** | Dietas anteriores, efeito sanfona |
| **Sintomas GI** | Intestino, inchaço, refluxo |
| **Bebidas** | Álcool, café, refrigerante |

---

## 7. Próximos Passos

1. **Definir** qual opção de implementação seguir (A, B ou C)
2. **Priorizar** quais campos adicionar primeiro (MVP)
3. **Atualizar** o schema do banco de dados
4. **Criar** os campos no formulário de anamnese
5. **Integrar** com o módulo FitPrime Nutrition

---

**Documento criado por Manus AI**  
**FitPrime Manager - Janeiro 2026**
