# FIT PRIME MANAGER — ESTRATÉGIA DE PRECIFICAÇÃO OFICIAL

**Versão:** 1.0  
**Data:** 31/12/2025  
**Status:** Aprovado

---

## PRINCÍPIOS GERAIS (REGRA-MÃE)

O modelo de precificação do FitPrime Manager segue princípios fundamentais que garantem escalabilidade sustentável e proteção da infraestrutura.

| Princípio | Descrição |
|-----------|-----------|
| **Sem plano ilimitado** | Sempre existe limite técnico por número de alunos |
| **Crescimento flexível** | Upgrade de plano OU cobrança por aluno adicional |
| **Economia de escala** | Quanto mais o personal escala, menor o custo por aluno |
| **Anti-pulo forçado** | Evita obrigar upgrade imediato ao exceder limite |
| **Proteção de infra** | Influenciadores grandes pagam proporcionalmente |

> **REGRA FINAL:** O usuário paga pelo que escala. Nunca paga para "desbloquear crescimento".

---

## 🇧🇷 BRASIL — MODELO B2B (PERSONAL TRAINER)

### Planos Escalonados

| Plano | Preço Mensal | Limite de Alunos | Custo por Aluno |
|-------|--------------|------------------|-----------------|
| **Starter** | R$ 97 | 15 | R$ 6,46 |
| **Growth** | R$ 147 | 25 | R$ 5,88 |
| **Pro** | R$ 197 | 40 | R$ 4,92 |
| **Scale** | R$ 297 | 75 | R$ 3,96 |
| **Advanced** | R$ 497 | 120 | R$ 4,14 |
| **Authority** | R$ 997 | ~200 | R$ 4,97 (mínimo) |

### Aluno Adicional

Quando o personal excede o limite do plano atual, é cobrado **R$ 6,46 por aluno extra** de forma proporcional, sem obrigar upgrade imediato.

### Regra de Custo Mínimo

O menor custo por aluno no Brasil é **R$ 4,97**, atingido no plano Authority de R$ 997.

---

## 🇺🇸 ESTADOS UNIDOS — MODELO B2B (PERSONAL TRAINER)

### Planos Escalonados

| Plano | Preço Mensal | Limite de Alunos | Custo por Aluno |
|-------|--------------|------------------|-----------------|
| **Starter** | $47 | 15 | $3,13 |
| **Growth** | $67 | 25 | $2,68 |
| **Pro** | $97 | 40 | $2,42 |
| **Scale** | $147 | 75 | $1,96 |
| **Advanced** | $247 | 150 | $1,65 |
| **Authority** | $497 | 400 | $1,24 |
| **Enterprise Coach** | $997 | 1.000 | $0,99 (mínimo) |

### Aluno Adicional

Cobrança de **US$ 2,99 por aluno extra** quando excede o limite do plano.

### Regra de Custo Mínimo

O menor custo por aluno nos EUA é **US$ 0,99**, atingido no plano Enterprise Coach de $997.

---

## 🔵 MODELO B2C — ALUNO DIRETO (ATHLETE MODE)

O Athlete Mode permite que alunos usem a plataforma diretamente, sem intermediação de um personal trainer.

### Brasil

| Plano | Preço | Benefício |
|-------|-------|-----------|
| **Mensal** | R$ 34,90/mês | Acesso completo |
| **Anual** | R$ 349/ano | 2 meses grátis |

### Estados Unidos

| Plano | Preço | Descrição |
|-------|-------|-----------|
| **Base** | $14,90/mês | Plano de aquisição |
| **Elite** | $19,90/mês | IA + geração automática de treino |

### Funcionalidades B2C

O modo Athlete inclui ranking global com participação opt-in, onde o usuário pode competir com nome real, anônimo ou simplesmente não participar. A gamificação é opcional e não intrusiva.

---

## DIFERENCIAIS DO MODELO

Este modelo de precificação foi desenhado para ser **investidor-friendly** com ARR previsível e compatível com marketplace futuro.

| Diferencial | Benefício |
|-------------|-----------|
| Evita churn por salto de preço | Retenção de clientes |
| Incentiva crescimento orgânico | Upsell natural |
| Protege servidores | Sustentabilidade técnica |
| Escalável para influenciadores | Grandes contas pagam proporcionalmente |
| Compatível com marketplace | Preparado para expansão |

---

## CONFIGURAÇÃO TÉCNICA

### Stripe Products (a criar)

**Brasil (BRL):**
```
fitprime_br_starter    - R$97/mês   - 15 alunos
fitprime_br_growth     - R$147/mês  - 25 alunos
fitprime_br_pro        - R$197/mês  - 40 alunos
fitprime_br_scale      - R$297/mês  - 75 alunos
fitprime_br_advanced   - R$497/mês  - 120 alunos
fitprime_br_authority  - R$997/mês  - 200 alunos
fitprime_br_extra      - R$6,46/aluno (metered)
```

**EUA (USD):**
```
fitprime_us_starter    - $47/mês    - 15 alunos
fitprime_us_growth     - $67/mês    - 25 alunos
fitprime_us_pro        - $97/mês    - 40 alunos
fitprime_us_scale      - $147/mês   - 75 alunos
fitprime_us_advanced   - $247/mês   - 150 alunos
fitprime_us_authority  - $497/mês   - 400 alunos
fitprime_us_enterprise - $997/mês   - 1000 alunos
fitprime_us_extra      - $2,99/aluno (metered)
```

**B2C Athlete Mode:**
```
athlete_br_monthly     - R$34,90/mês
athlete_br_yearly      - R$349/ano
athlete_us_base        - $14,90/mês
athlete_us_elite       - $19,90/mês
```

---

## LÓGICA DE COBRANÇA AUTOMÁTICA

```typescript
interface PricingLogic {
  // Verifica se personal excedeu limite
  checkStudentLimit(personalId: number): {
    currentPlan: string;
    studentLimit: number;
    currentStudents: number;
    exceededBy: number;
    suggestedAction: 'ok' | 'charge_extra' | 'suggest_upgrade';
  };

  // Calcula cobrança de alunos extras
  calculateExtraCharge(exceededBy: number, country: 'BR' | 'US'): {
    amount: number;
    currency: 'BRL' | 'USD';
  };

  // Sugere próximo plano baseado em uso
  suggestUpgrade(currentStudents: number, country: 'BR' | 'US'): {
    currentPlan: string;
    suggestedPlan: string;
    savings: number;
  };
}
```

---

## HISTÓRICO DE VERSÕES

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 31/12/2025 | Versão inicial aprovada |
