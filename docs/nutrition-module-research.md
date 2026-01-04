# Pesquisa: Módulo de Nutrição - FitPrime

## Requisitos Legais no Brasil

### Prescrição Dietética - Atividade Privativa do Nutricionista

De acordo com a **Lei Federal nº 8.234/91** e regulamentações do CFN:

1. **Prescrição dietética é atividade PRIVATIVA do nutricionista**
   - Resolução CFN nº 600/2018 define prescrição dietética
   - Resolução CFN nº 656/2020 regulamenta a prescrição dietética

2. **Profissional de Educação Física NÃO pode prescrever dietas**
   - Lei nº 9.696/1998 regulamenta a profissão
   - CREF4/SP Resolução nº 151/2022 permite apenas orientação de suplementos
   - Planos alimentares e planejamento de dietas são VEDADOS

3. **Dupla Formação (Nutricionista + Educador Físico)**
   - Profissional com ambas as formações pode atuar nas duas áreas
   - Deve ter registro ativo no CRN para prescrever dietas
   - Deve ter registro ativo no CREF para prescrever treinos

### Implicações para o Sistema

O módulo de nutrição deve:
- Verificar se o profissional possui registro CRN ativo
- Diferenciar funcionalidades entre Personal (só treino) e Nutricionista (dietas)
- Permitir que profissionais com dupla formação acessem ambas funcionalidades
- Incluir disclaimers legais apropriados

## Softwares de Nutrição Existentes

### Principais Concorrentes
1. **Dietbox** - Software líder no Brasil para nutricionistas
2. **WebDiet** - Prescrição alimentar com modelos prontos
3. **DietSystem** - Software com IA para nutricionistas
4. **Amplinutri** - Método avançado de prescrição

### Funcionalidades Comuns
- Banco de dados de alimentos (TACO, IBGE)
- Cálculo automático de macros e micros
- Modelos de dietas prontos
- Acompanhamento do paciente
- Integração com apps de pacientes

## Tabelas Nutricionais Brasileiras

1. **TACO** - Tabela Brasileira de Composição de Alimentos (UNICAMP)
2. **IBGE POF** - Pesquisa de Orçamentos Familiares
3. **TBCA** - Tabela Brasileira de Composição de Alimentos (USP)

## Estrutura Atual do FitPrime

### Dados já disponíveis na Anamnese
- Refeições por dia (mealsPerDay)
- Ingestão de água (waterIntake)
- Restrições alimentares (dietRestrictions)
- Suplementos (supplements)
- Calorias diárias (dailyCalories)
- Objetivo principal (mainGoal)
- Estilo de vida (lifestyle)

### Dados de Medidas
- Peso, altura, IMC
- Gordura corporal
- Massa muscular
- TMB estimada

### Dados de Treino
- Histórico de treinos
- Volume de treino
- Frequência
- Objetivos
