# Análise e Especificação Técnica: Módulo de Nutrição FitPrime

**Autor:** Manus AI  
**Data:** 04 de Janeiro de 2026  
**Versão:** 1.0

---

## Sumário Executivo

Este documento apresenta uma análise completa para implementação do módulo de Nutrição no FitPrime Manager, permitindo que profissionais com formação em Nutrição (nutricionistas, ou profissionais com dupla formação) possam prescrever e criar dietas personalizadas utilizando Inteligência Artificial. A proposta integra os dados já existentes no sistema (anamnese, medidas corporais, histórico de treinos) para gerar planos alimentares inteligentes e adaptados aos objetivos de cada aluno.

---

## 1. Contexto Legal e Regulatório

A prescrição dietética no Brasil é regulamentada por legislação específica que define claramente quem pode exercer essa atividade. De acordo com a Lei Federal nº 8.234/91, a prescrição de dietas é **atividade privativa do nutricionista** [1]. O Conselho Federal de Nutricionistas (CFN) reforça essa regulamentação através da Resolução CFN nº 600/2018, que define prescrição dietética como "atividade privativa do nutricionista que compõe a assistência prestada aos clientes/pacientes/usuários" [2].

O profissional de Educação Física, por sua vez, tem sua atuação regulamentada pela Lei nº 9.696/1998, que não inclui a prescrição de dietas entre suas atribuições [3]. A Resolução CREF4/SP nº 151/2022 permite apenas a orientação sobre suplementos alimentares, sendo expressamente vedado o planejamento de dietas ou planos alimentares [4].

Para profissionais com **dupla formação** (Nutricionista e Educador Físico), a atuação em ambas as áreas é permitida, desde que mantenham registros ativos nos respectivos conselhos (CRN e CREF). Esta configuração representa uma oportunidade significativa para o FitPrime, pois permite oferecer uma solução integrada de treino e nutrição para esses profissionais.

| Profissional | Pode Prescrever Treinos | Pode Prescrever Dietas | Registro Necessário |
|--------------|------------------------|------------------------|---------------------|
| Personal Trainer | Sim | Não | CREF |
| Nutricionista | Não | Sim | CRN |
| Dupla Formação | Sim | Sim | CREF + CRN |

---

## 2. Análise da Estrutura Atual do FitPrime

O FitPrime já possui uma base sólida de dados que pode ser aproveitada para o módulo de nutrição. A tabela de **anamnese** contém informações nutricionais relevantes:

| Campo Existente | Descrição | Uso na Nutrição |
|-----------------|-----------|-----------------|
| `mealsPerDay` | Número de refeições diárias | Distribuição do plano alimentar |
| `waterIntake` | Ingestão de água (litros) | Meta de hidratação |
| `dietRestrictions` | Restrições alimentares | Exclusão de alimentos |
| `supplements` | Suplementos utilizados | Complementação nutricional |
| `dailyCalories` | Consumo calórico estimado | Cálculo de déficit/superávit |
| `mainGoal` | Objetivo principal | Estratégia nutricional |
| `lifestyle` | Nível de atividade | Cálculo do GET |

A tabela de **measurements** fornece dados antropométricos essenciais:

| Campo Existente | Descrição | Uso na Nutrição |
|-----------------|-----------|-----------------|
| `weight` | Peso atual | Cálculo de macros |
| `height` | Altura | Cálculo de TMB |
| `bodyFat` | Percentual de gordura | Ajuste de proteína |
| `muscleMass` | Massa muscular | Preservação em cutting |
| `estimatedBMR` | Taxa metabólica basal | Base do GET |

Os dados de **treino** também são valiosos para a prescrição nutricional:

| Dado de Treino | Uso na Nutrição |
|----------------|-----------------|
| Volume de treino | Ajuste calórico |
| Frequência semanal | Distribuição de carboidratos |
| Tipo de treino | Timing de nutrientes |
| Objetivo do treino | Estratégia de macros |

---

## 3. Arquitetura Proposta

### 3.1 Modelo de Dados

A implementação requer novas tabelas no banco de dados para suportar o módulo de nutrição:

```
┌─────────────────────────────────────────────────────────────────┐
│                        NOVAS TABELAS                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │   nutritionists │     │  food_database  │                   │
│  ├─────────────────┤     ├─────────────────┤                   │
│  │ id              │     │ id              │                   │
│  │ userId          │     │ name            │                   │
│  │ crnNumber       │     │ portion         │                   │
│  │ crnState        │     │ calories        │                   │
│  │ specialties     │     │ protein         │                   │
│  │ canPrescribe    │     │ carbs           │                   │
│  └─────────────────┘     │ fat             │                   │
│                          │ fiber           │                   │
│  ┌─────────────────┐     │ source (TACO)   │                   │
│  │   meal_plans    │     └─────────────────┘                   │
│  ├─────────────────┤                                           │
│  │ id              │     ┌─────────────────┐                   │
│  │ studentId       │     │   meal_items    │                   │
│  │ nutritionistId  │     ├─────────────────┤                   │
│  │ name            │     │ id              │                   │
│  │ goal            │     │ mealPlanId      │                   │
│  │ totalCalories   │     │ mealType        │                   │
│  │ proteinGrams    │     │ foodId          │                   │
│  │ carbsGrams      │     │ quantity        │                   │
│  │ fatGrams        │     │ substitutes     │                   │
│  │ generatedByAI   │     └─────────────────┘                   │
│  │ status          │                                           │
│  │ startDate       │     ┌─────────────────┐                   │
│  │ endDate         │     │ nutrition_logs  │                   │
│  └─────────────────┘     ├─────────────────┤                   │
│                          │ id              │                   │
│  ┌─────────────────┐     │ studentId       │                   │
│  │  meal_templates │     │ mealPlanId      │                   │
│  ├─────────────────┤     │ mealType        │                   │
│  │ id              │     │ logDate         │                   │
│  │ nutritionistId  │     │ consumed        │                   │
│  │ name            │     │ notes           │                   │
│  │ description     │     │ photo           │                   │
│  │ goal            │     └─────────────────┘                   │
│  │ isPublic        │                                           │
│  └─────────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Tabelas Detalhadas

**nutritionists** - Cadastro de nutricionistas
```typescript
nutritionists = mysqlTable("nutritionists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id),
  personalId: int("personalId").references(() => personals.id), // Se for dupla formação
  crnNumber: varchar("crnNumber", { length: 20 }).notNull(),
  crnState: varchar("crnState", { length: 2 }).notNull(),
  crnValidated: boolean("crnValidated").default(false),
  businessName: varchar("businessName", { length: 255 }),
  specialties: text("specialties"), // JSON array
  bio: text("bio"),
  canPrescribeDiets: boolean("canPrescribeDiets").default(true),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["active", "trial", "expired"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

**food_database** - Base de alimentos
```typescript
foodDatabase = mysqlTable("food_database", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameNormalized: varchar("nameNormalized", { length: 255 }), // Para busca
  category: varchar("category", { length: 100 }),
  portion: varchar("portion", { length: 100 }).notNull(), // "100g", "1 unidade"
  portionGrams: decimal("portionGrams", { precision: 7, scale: 2 }),
  calories: decimal("calories", { precision: 7, scale: 2 }),
  protein: decimal("protein", { precision: 7, scale: 2 }),
  carbs: decimal("carbs", { precision: 7, scale: 2 }),
  fat: decimal("fat", { precision: 7, scale: 2 }),
  fiber: decimal("fiber", { precision: 7, scale: 2 }),
  sodium: decimal("sodium", { precision: 7, scale: 2 }),
  source: mysqlEnum("source", ["taco", "ibge", "custom", "usda"]),
  isCustom: boolean("isCustom").default(false),
  createdBy: int("createdBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

**meal_plans** - Planos alimentares
```typescript
mealPlans = mysqlTable("meal_plans", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  nutritionistId: int("nutritionistId").notNull().references(() => nutritionists.id),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  goal: mysqlEnum("goal", ["weight_loss", "muscle_gain", "maintenance", "health", "sports"]),
  totalCalories: int("totalCalories"),
  proteinGrams: int("proteinGrams"),
  carbsGrams: int("carbsGrams"),
  fatGrams: int("fatGrams"),
  fiberGrams: int("fiberGrams"),
  mealsPerDay: int("mealsPerDay").default(5),
  generatedByAI: boolean("generatedByAI").default(false),
  aiPrompt: text("aiPrompt"), // Prompt usado para gerar
  status: mysqlEnum("status", ["active", "inactive", "draft"]).default("draft"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
```

**meal_items** - Itens de cada refeição
```typescript
mealItems = mysqlTable("meal_items", {
  id: int("id").autoincrement().primaryKey(),
  mealPlanId: int("mealPlanId").notNull().references(() => mealPlans.id),
  mealType: mysqlEnum("mealType", ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "supper"]),
  mealOrder: int("mealOrder").default(1),
  foodId: int("foodId").references(() => foodDatabase.id),
  customFood: varchar("customFood", { length: 255 }), // Se não estiver no banco
  quantity: decimal("quantity", { precision: 7, scale: 2 }),
  unit: varchar("unit", { length: 50 }), // "g", "ml", "unidade"
  calories: decimal("calories", { precision: 7, scale: 2 }),
  protein: decimal("protein", { precision: 7, scale: 2 }),
  carbs: decimal("carbs", { precision: 7, scale: 2 }),
  fat: decimal("fat", { precision: 7, scale: 2 }),
  substitutes: text("substitutes"), // JSON array de foodIds alternativos
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

**nutrition_logs** - Registro de alimentação do aluno
```typescript
nutritionLogs = mysqlTable("nutrition_logs", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull().references(() => students.id),
  mealPlanId: int("mealPlanId").references(() => mealPlans.id),
  logDate: date("logDate").notNull(),
  mealType: mysqlEnum("mealType", ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "supper", "extra"]),
  consumed: text("consumed"), // JSON com alimentos consumidos
  totalCalories: int("totalCalories"),
  totalProtein: decimal("totalProtein", { precision: 7, scale: 2 }),
  totalCarbs: decimal("totalCarbs", { precision: 7, scale: 2 }),
  totalFat: decimal("totalFat", { precision: 7, scale: 2 }),
  adherence: int("adherence"), // 0-100% de aderência ao plano
  photoUrl: varchar("photoUrl", { length: 500 }),
  notes: text("notes"),
  mood: mysqlEnum("mood", ["great", "good", "neutral", "bad", "terrible"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

---

## 4. Funcionalidades Propostas

### 4.1 Para o Nutricionista/Profissional

| Funcionalidade | Descrição | Prioridade |
|----------------|-----------|------------|
| **Cadastro com CRN** | Registro do número CRN e validação | Alta |
| **Geração de Dieta com IA** | Criar plano alimentar baseado na anamnese e objetivos | Alta |
| **Editor de Plano Alimentar** | Interface drag-and-drop para montar refeições | Alta |
| **Banco de Alimentos** | Base TACO + alimentos customizados | Alta |
| **Templates de Dietas** | Modelos prontos para diferentes objetivos | Média |
| **Cálculo Automático de Macros** | TMB, GET, distribuição de macros | Alta |
| **Integração com Treino** | Ajustar dieta baseado no treino do dia | Média |
| **Relatórios Nutricionais** | Evolução, aderência, comparativos | Média |
| **Lista de Compras** | Gerar lista baseada no plano semanal | Baixa |

### 4.2 Para o Aluno (Portal)

| Funcionalidade | Descrição | Prioridade |
|----------------|-----------|------------|
| **Visualizar Dieta** | Ver plano alimentar atual | Alta |
| **Registrar Refeições** | Marcar o que consumiu | Alta |
| **Foto das Refeições** | Upload de fotos para análise | Média |
| **Substituições** | Ver opções de troca de alimentos | Alta |
| **Calculadora Nutricional** | Calcular macros de alimentos | Média |
| **Histórico Alimentar** | Ver registros anteriores | Média |
| **Metas Diárias** | Acompanhar progresso de calorias/macros | Alta |

### 4.3 Geração de Dieta com IA

O sistema utilizará a IA integrada (LLM) para gerar planos alimentares personalizados. O prompt será construído com base em:

**Dados de Entrada:**
1. Anamnese completa (restrições, preferências, estilo de vida)
2. Medidas atuais (peso, altura, gordura corporal, TMB)
3. Objetivo do aluno (emagrecimento, hipertrofia, manutenção)
4. Histórico de treinos (volume, frequência, tipo)
5. Preferências alimentares (vegetariano, low carb, etc.)

**Saída Esperada:**
```json
{
  "totalCalories": 2200,
  "macros": {
    "protein": 165,
    "carbs": 220,
    "fat": 73
  },
  "meals": [
    {
      "type": "breakfast",
      "time": "07:00",
      "foods": [
        {"name": "Ovos mexidos", "quantity": "3 unidades", "calories": 210},
        {"name": "Pão integral", "quantity": "2 fatias", "calories": 140},
        {"name": "Abacate", "quantity": "50g", "calories": 80}
      ],
      "totalCalories": 430,
      "substitutes": ["Omelete com queijo", "Tapioca com ovo"]
    }
  ],
  "recommendations": [
    "Beber 3L de água por dia",
    "Consumir proteína em todas as refeições",
    "Evitar carboidratos simples à noite"
  ]
}
```

---

## 5. Fluxo de Integração Treino + Nutrição

A grande vantagem do FitPrime é a integração entre treino e nutrição. O sistema pode ajustar automaticamente a dieta baseado no treino:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE INTEGRAÇÃO                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   TREINO    │───▶│  ANÁLISE    │───▶│   DIETA     │         │
│  │   DO DIA    │    │  AUTOMÁTICA │    │  AJUSTADA   │         │
│  └─────────────┘    └─────────────┘    └─────────────┘         │
│                                                                 │
│  Dia de Perna?      +300 kcal         Mais carboidratos        │
│  Dia de Descanso?   -200 kcal         Menos carboidratos       │
│  Treino Cardio?     +100 kcal         Mais carboidratos        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Regras de Ajuste Automático:**

| Tipo de Treino | Ajuste Calórico | Ajuste de Carboidratos |
|----------------|-----------------|------------------------|
| Pernas (alto volume) | +15% | +20% |
| Costas/Peito | +10% | +15% |
| Braços/Ombros | +5% | +10% |
| Cardio HIIT | +10% | +15% |
| Cardio LISS | +5% | +5% |
| Descanso | Base | Base |

---

## 6. Interface do Usuário

### 6.1 Dashboard do Nutricionista

O dashboard do nutricionista terá uma estrutura similar ao do Personal Trainer, com métricas específicas:

**KPIs Principais:**
- Total de Pacientes Ativos
- Dietas Ativas
- Taxa de Aderência Média
- Pacientes com Baixa Aderência

**Ações Rápidas:**
- Nova Dieta
- Gerar Dieta com IA
- Ver Registros do Dia
- Análise de Evolução

### 6.2 Editor de Plano Alimentar

Interface visual para criar e editar planos alimentares:

```
┌─────────────────────────────────────────────────────────────────┐
│  Plano Alimentar - João Silva                    [Salvar] [IA] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Meta: 2200 kcal | P: 165g | C: 220g | G: 73g                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                 │
│  ☀️ CAFÉ DA MANHÃ (07:00) ─────────────────── 430 kcal         │
│  ├─ 🥚 Ovos mexidos (3 un) ................ 210 kcal           │
│  ├─ 🍞 Pão integral (2 fatias) ............ 140 kcal           │
│  └─ 🥑 Abacate (50g) ...................... 80 kcal            │
│                                                    [+ Alimento] │
│                                                                 │
│  🍎 LANCHE DA MANHÃ (10:00) ────────────────── 200 kcal        │
│  ├─ 🍌 Banana (1 un) ...................... 90 kcal            │
│  └─ 🥜 Pasta de amendoim (20g) ............ 110 kcal           │
│                                                    [+ Alimento] │
│                                                                 │
│  🍽️ ALMOÇO (12:30) ─────────────────────────── 650 kcal        │
│  ├─ 🍚 Arroz integral (150g) .............. 180 kcal           │
│  ├─ 🫘 Feijão (100g) ...................... 95 kcal            │
│  ├─ 🍗 Frango grelhado (150g) ............. 250 kcal           │
│  ├─ 🥗 Salada verde (à vontade) ........... 25 kcal            │
│  └─ 🫒 Azeite (1 colher) .................. 100 kcal           │
│                                                    [+ Alimento] │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Portal do Aluno - Aba Nutrição

Nova aba no Portal do Aluno para acompanhamento nutricional:

```
┌─────────────────────────────────────────────────────────────────┐
│  🥗 Minha Dieta                              Hoje: 04/01/2026  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ 1.450   │ │  98g    │ │  145g   │ │  48g    │               │
│  │ /2.200  │ │ /165g   │ │ /220g   │ │ /73g    │               │
│  │ kcal    │ │ Proteína│ │ Carbos  │ │ Gordura │               │
│  │ ████░░░ │ │ █████░░ │ │ ████░░░ │ │ ████░░░ │               │
│  │  66%    │ │  59%    │ │  66%    │ │  66%    │               │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘               │
│                                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                                 │
│  ☀️ CAFÉ DA MANHÃ ─────────────────────────────── ✅ Consumido │
│  🍎 LANCHE DA MANHÃ ───────────────────────────── ✅ Consumido │
│  🍽️ ALMOÇO ────────────────────────────────────── ⏳ Pendente  │
│  🍏 LANCHE DA TARDE ───────────────────────────── ⏳ Pendente  │
│  🌙 JANTAR ────────────────────────────────────── ⏳ Pendente  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Cronograma de Implementação

A implementação do módulo de nutrição pode ser dividida em fases:

| Fase | Descrição | Duração Estimada | Dependências |
|------|-----------|------------------|--------------|
| **Fase 1** | Estrutura base (tabelas, cadastro CRN) | 1 semana | - |
| **Fase 2** | Banco de alimentos TACO | 1 semana | Fase 1 |
| **Fase 3** | Editor de planos alimentares | 2 semanas | Fase 2 |
| **Fase 4** | Geração de dieta com IA | 1 semana | Fase 3 |
| **Fase 5** | Portal do Aluno - Nutrição | 1 semana | Fase 3 |
| **Fase 6** | Integração Treino + Nutrição | 1 semana | Fase 4, 5 |
| **Fase 7** | Relatórios e análises | 1 semana | Fase 5 |
| **Fase 8** | Testes e ajustes | 1 semana | Todas |

**Total estimado:** 9-10 semanas

---

## 8. Considerações Técnicas

### 8.1 Base de Dados de Alimentos

A Tabela Brasileira de Composição de Alimentos (TACO) da UNICAMP é a principal referência para alimentos brasileiros [5]. Contém aproximadamente 600 alimentos com informações completas de macronutrientes e micronutrientes. O sistema deve:

1. Importar a base TACO completa
2. Permitir adição de alimentos customizados
3. Normalizar nomes para busca eficiente
4. Suportar múltiplas porções por alimento

### 8.2 Cálculos Nutricionais

O sistema deve implementar as fórmulas padrão para cálculos nutricionais:

**Taxa Metabólica Basal (TMB) - Fórmula de Mifflin-St Jeor:**
- Homens: TMB = (10 × peso) + (6,25 × altura) - (5 × idade) + 5
- Mulheres: TMB = (10 × peso) + (6,25 × altura) - (5 × idade) - 161

**Gasto Energético Total (GET):**
- GET = TMB × Fator de Atividade

| Nível de Atividade | Fator |
|-------------------|-------|
| Sedentário | 1.2 |
| Levemente ativo | 1.375 |
| Moderadamente ativo | 1.55 |
| Muito ativo | 1.725 |
| Extremamente ativo | 1.9 |

**Distribuição de Macronutrientes (exemplo para hipertrofia):**
- Proteína: 2.0g por kg de peso corporal
- Gordura: 25-30% das calorias totais
- Carboidratos: restante das calorias

### 8.3 Segurança e Compliance

O módulo deve implementar:

1. **Verificação de CRN** - Validar registro antes de permitir prescrição
2. **Disclaimers legais** - Avisos sobre responsabilidade profissional
3. **Logs de auditoria** - Registrar todas as prescrições
4. **Termos de uso** - Aceite obrigatório para nutricionistas
5. **LGPD** - Dados de saúde são sensíveis e requerem consentimento

---

## 9. Modelo de Negócio

### 9.1 Opções de Monetização

| Modelo | Descrição | Vantagens |
|--------|-----------|-----------|
| **Add-on ao plano existente** | +R$ X/mês para desbloquear nutrição | Simples, upsell natural |
| **Plano específico para nutricionistas** | Plano separado para nutricionistas | Novo público-alvo |
| **Plano integrado premium** | Treino + Nutrição em um único plano | Maior valor percebido |

### 9.2 Público-Alvo

1. **Nutricionistas** que querem uma plataforma moderna com IA
2. **Personal Trainers com dupla formação** que querem oferecer serviço completo
3. **Clínicas e estúdios** que têm nutricionistas e personais trabalhando juntos
4. **Nutricionistas esportivos** que trabalham com atletas

---

## 10. Próximos Passos Recomendados

1. **Validar com usuários** - Entrevistar personais com dupla formação para validar necessidades
2. **Definir MVP** - Escolher funcionalidades essenciais para primeira versão
3. **Importar base TACO** - Preparar banco de dados de alimentos
4. **Criar protótipos** - Wireframes das principais telas
5. **Implementar Fase 1** - Estrutura base e cadastro de nutricionistas

---

## Referências

[1] Lei Federal nº 8.234/91 - Regulamenta a profissão de Nutricionista. Disponível em: https://www.planalto.gov.br/ccivil_03/leis/1989_1994/l8234.htm

[2] Resolução CFN nº 600/2018 - Dispõe sobre a definição das áreas de atuação do nutricionista. Disponível em: https://cfn.org.br

[3] Lei nº 9.696/1998 - Regulamenta a profissão de Educação Física. Disponível em: https://www.planalto.gov.br/ccivil_03/leis/l9696.htm

[4] Resolução CREF4/SP nº 151/2022 - Define atuação do profissional de Educação Física na área de suplementos. Disponível em: https://www.crefsp.gov.br

[5] TACO - Tabela Brasileira de Composição de Alimentos. UNICAMP. Disponível em: https://www.cfn.org.br/wp-content/uploads/2017/03/taco_4_edicao_ampliada_e_revisada.pdf

---

*Documento elaborado por Manus AI para FitPrime Manager*
