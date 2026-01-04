# FitPrime Nutrition - Documento de Especificação

**Versão:** 1.0  
**Data:** Janeiro de 2026  
**Autor:** Manus AI  
**Status:** Documento de Planejamento (Não Implementado)

---

## 1. Visão Geral

O **FitPrime Nutrition** é um módulo de nutrição integrado ao FitPrime Manager, projetado para profissionais que possuem formação em nutrição (CRN ativo) ou que trabalham em parceria com nutricionistas. O módulo oferece todas as funcionalidades encontradas nos principais softwares de nutrição do mercado, com o diferencial exclusivo de **integração nativa com treinos, medidas corporais e agenda**.

### 1.1 Proposta de Valor

O FitPrime Nutrition será o **primeiro software do mercado brasileiro** a oferecer uma visão unificada de treino e nutrição, permitindo que profissionais entreguem um acompanhamento verdadeiramente completo aos seus alunos/pacientes.

### 1.2 Público-Alvo

| Perfil | Descrição | Acesso |
|--------|-----------|--------|
| **Personal com CRN** | Profissional com dupla formação (Ed. Física + Nutrição) | Acesso completo |
| **Nutricionista parceiro** | Nutricionista que trabalha em parceria com o personal | Acesso ao módulo Nutrition |
| **Personal sem CRN** | Profissional apenas de Ed. Física | Sem acesso (menu oculto) |

---

## 2. Estrutura de Navegação

### 2.1 Menu Lateral (Sidebar)

Ao clicar em **"Nutrição"** no menu lateral esquerdo, o sistema expande para mostrar o submenu **FitPrime Nutrition** com as seguintes opções:

```
📊 Dashboard
👥 Alunos
💪 Treinos
📅 Agenda
💰 Cobranças
📊 Relatórios
🗑️ Lixeira
⚙️ Configurações

🥗 NUTRIÇÃO                    ← Novo item no menu
   └─ FitPrime Nutrition
      ├─ 🏠 Visão Geral
      ├─ 👤 Pacientes
      ├─ 📋 Planos Alimentares
      ├─ 🍎 Alimentos
      ├─ 🍳 Receitas
      ├─ 📊 Avaliação Nutricional
      ├─ 📈 Evolução
      ├─ 📝 Anamnese Nutricional
      ├─ 🔬 Exames
      ├─ 📚 Orientações
      └─ ⚙️ Configurações Nutrição
```

### 2.2 Comportamento do Menu

Quando o usuário clica em "Nutrição" no sidebar esquerdo, o sistema verifica se o profissional possui CRN cadastrado. Se não possuir, exibe uma mensagem informando que o módulo está disponível apenas para profissionais com registro no Conselho Regional de Nutricionistas.

Se o profissional possui CRN, o menu expande e ao clicar em "FitPrime Nutrition", a área de conteúdo à direita carrega as funcionalidades do módulo.

---

## 3. Funcionalidades Detalhadas

### 3.1 Visão Geral (Dashboard Nutrição)

A página inicial do FitPrime Nutrition apresenta um dashboard com métricas e ações rápidas específicas de nutrição.

**KPIs Principais:**

| Métrica | Descrição |
|---------|-----------|
| Total de Pacientes | Número de pacientes com plano alimentar ativo |
| Consultas do Dia | Agendamentos de consultas nutricionais para hoje |
| Planos Ativos | Quantidade de planos alimentares em andamento |
| Adesão Média | Percentual médio de adesão aos planos (baseado no diário alimentar) |
| Pacientes em Evolução | Pacientes que atingiram metas no último mês |

**Cards de Ações Rápidas:**

| Ação | Descrição |
|------|-----------|
| Novo Plano Alimentar | Criar plano alimentar para paciente |
| Nova Consulta | Agendar consulta nutricional |
| Registrar Avaliação | Realizar avaliação nutricional |
| Ver Diários | Acompanhar diários alimentares dos pacientes |

**Integração com Treinos (Diferencial Exclusivo):**

O dashboard exibe um card especial mostrando a **Sincronização Treino-Dieta**, que apresenta alertas como "5 alunos treinaram hoje e ainda não registraram refeição pós-treino" ou "3 alunos com treino de força precisam de ajuste de proteína".

---

### 3.2 Pacientes

A seção de Pacientes no FitPrime Nutrition é **integrada com a lista de Alunos** do FitPrime Manager. Cada aluno pode ter dados nutricionais associados.

**Informações do Paciente:**

| Campo | Descrição |
|-------|-----------|
| Dados Pessoais | Nome, idade, gênero, contato (sincronizado com Alunos) |
| Dados Antropométricos | Peso, altura, IMC, % gordura (sincronizado com Medidas) |
| Objetivo Nutricional | Emagrecimento, ganho de massa, manutenção, performance |
| Restrições Alimentares | Alergias, intolerâncias, preferências |
| Patologias | Diabetes, hipertensão, doenças renais, etc. |
| Medicamentos | Lista de medicamentos em uso |
| Histórico Familiar | Doenças na família relevantes para nutrição |

**Abas do Perfil Nutricional:**

| Aba | Conteúdo |
|-----|----------|
| Visão Geral | Resumo do paciente, plano atual, próxima consulta |
| Anamnese | Anamnese nutricional completa |
| Planos | Histórico de planos alimentares |
| Diário | Diário alimentar com registros do paciente |
| Avaliações | Histórico de avaliações nutricionais |
| Exames | Exames laboratoriais |
| Evolução | Gráficos de evolução (peso, medidas, composição) |
| Treinos | **Integração:** Visualização dos treinos do aluno |

---

### 3.3 Planos Alimentares

O coração do FitPrime Nutrition é o sistema de criação e gestão de planos alimentares.

**Tipos de Planos:**

| Tipo | Descrição |
|------|-----------|
| Plano Padrão | Cardápio fixo com refeições definidas |
| Plano Flexível | Opções de substituição por refeição |
| Plano por Equivalentes | Baseado em grupos de alimentos e porções |
| Plano Ciclado | Variação de macros por dia da semana |
| Plano de Competição | Para atletas em preparação |

**Estrutura do Plano Alimentar:**

Cada plano alimentar contém as seguintes informações organizadas em seções:

**Informações Gerais:**

| Campo | Descrição |
|-------|-----------|
| Nome do Plano | Identificação do plano |
| Paciente | Paciente vinculado |
| Objetivo | Objetivo do plano (emagrecer, hipertrofiar, etc.) |
| VET | Valor Energético Total calculado |
| Data Início | Data de início do plano |
| Data Revisão | Data prevista para revisão |
| Status | Ativo, Pausado, Finalizado |

**Distribuição de Macronutrientes:**

| Macro | Gramas | Kcal | % do VET |
|-------|--------|------|----------|
| Carboidratos | Calculado | Calculado | Configurável |
| Proteínas | Calculado | Calculado | Configurável |
| Gorduras | Calculado | Calculado | Configurável |

**Refeições:**

Cada refeição do plano contém:

| Campo | Descrição |
|-------|-----------|
| Nome da Refeição | Café da manhã, Lanche, Almoço, etc. |
| Horário Sugerido | Horário recomendado |
| Alimentos | Lista de alimentos com quantidades |
| Substituições | Opções de substituição |
| Observações | Notas específicas da refeição |
| Macros da Refeição | Totais de CHO, PTN, LIP, Kcal |

**Funcionalidades de Criação:**

| Funcionalidade | Descrição |
|----------------|-----------|
| Cálculo Automático de VET | Baseado em fórmulas (Harris-Benedict, Mifflin-St Jeor) |
| Sugestão por IA | Inteligência artificial sugere refeições baseadas no objetivo |
| Templates Prontos | Modelos de planos para diferentes objetivos |
| Duplicar Plano | Copiar plano existente para novo paciente |
| Importar/Exportar | Importar planos de outros sistemas |

**Integração com Treinos (Diferencial Exclusivo):**

| Funcionalidade | Descrição |
|----------------|-----------|
| Ajuste por Tipo de Treino | Aumenta CHO em dias de treino aeróbico, PTN em dias de força |
| Refeição Pré-Treino | Sugestão automática baseada no horário do treino |
| Refeição Pós-Treino | Janela anabólica com macros otimizados |
| Dias de Descanso | Ajuste calórico para dias sem treino |

---

### 3.4 Alimentos

Base de dados completa de alimentos para composição dos planos alimentares.

**Tabelas Disponíveis:**

| Tabela | Descrição | Quantidade |
|--------|-----------|------------|
| TACO | Tabela Brasileira de Composição de Alimentos | ~600 alimentos |
| USDA | United States Department of Agriculture | ~8.000 alimentos |
| IBGE | Pesquisa de Orçamentos Familiares | ~1.500 alimentos |
| Fabricantes | Alimentos industrializados com rótulo | Atualizável |
| Personalizados | Alimentos cadastrados pelo profissional | Ilimitado |

**Informações por Alimento:**

| Campo | Descrição |
|-------|-----------|
| Nome | Nome do alimento |
| Grupo | Grupo alimentar (cereais, carnes, frutas, etc.) |
| Porção Padrão | Quantidade de referência |
| Medidas Caseiras | Colher, xícara, unidade, etc. |
| Energia (kcal) | Calorias por porção |
| Carboidratos | Gramas por porção |
| Proteínas | Gramas por porção |
| Lipídios | Gramas por porção |
| Fibras | Gramas por porção |
| Micronutrientes | Vitaminas e minerais |

**Funcionalidades:**

| Funcionalidade | Descrição |
|----------------|-----------|
| Busca Inteligente | Busca por nome, grupo ou composição |
| Filtros | Filtrar por grupo, macro predominante, etc. |
| Favoritos | Marcar alimentos mais usados |
| Cadastro Personalizado | Adicionar alimentos não listados |
| Código de Barras | Busca por código de barras (futuro) |

---

### 3.5 Receitas

Banco de receitas com informações nutricionais calculadas automaticamente.

**Estrutura da Receita:**

| Campo | Descrição |
|-------|-----------|
| Nome | Nome da receita |
| Categoria | Café da manhã, almoço, lanche, sobremesa, etc. |
| Rendimento | Número de porções |
| Tempo de Preparo | Tempo estimado |
| Ingredientes | Lista de alimentos com quantidades |
| Modo de Preparo | Passo a passo |
| Informação Nutricional | Calculada automaticamente por porção |
| Foto | Imagem da receita |
| Tags | Vegetariana, sem glúten, low carb, etc. |

**Funcionalidades:**

| Funcionalidade | Descrição |
|----------------|-----------|
| Biblioteca de Receitas | Receitas pré-cadastradas |
| Criar Receita | Cadastrar receitas próprias |
| Calcular Nutricional | Cálculo automático baseado nos ingredientes |
| Compartilhar com Paciente | Enviar receita via app |
| Adicionar ao Plano | Inserir receita diretamente no plano alimentar |

---

### 3.6 Avaliação Nutricional

Sistema completo de avaliação do estado nutricional do paciente.

**Tipos de Avaliação:**

| Tipo | Descrição |
|------|-----------|
| Antropométrica | Peso, altura, circunferências, dobras cutâneas |
| Bioquímica | Análise de exames laboratoriais |
| Clínica | Sinais e sintomas clínicos |
| Dietética | Análise do consumo alimentar |
| Funcional | Avaliação de capacidades funcionais |

**Avaliação Antropométrica:**

| Medida | Descrição |
|--------|-----------|
| Peso | Peso atual em kg |
| Altura | Altura em cm |
| IMC | Índice de Massa Corporal (calculado) |
| Circunferência Abdominal | Em cm |
| Circunferência do Quadril | Em cm |
| Relação Cintura/Quadril | Calculada |
| Circunferência do Braço | Em cm |
| Circunferência da Coxa | Em cm |
| Circunferência da Panturrilha | Em cm |
| Dobras Cutâneas | Tríceps, bíceps, subescapular, suprailíaca, etc. |
| % Gordura Corporal | Calculado por diferentes protocolos |
| Massa Magra | Calculada |
| Massa Gorda | Calculada |

**Protocolos de Composição Corporal:**

| Protocolo | Descrição |
|-----------|-----------|
| Jackson & Pollock 3 dobras | Para população geral |
| Jackson & Pollock 7 dobras | Mais preciso |
| Durnin & Womersley | 4 dobras |
| Faulkner | Para atletas |
| US Navy | Baseado em circunferências |
| Bioimpedância | Integração com dados manuais |

**Integração com Medidas do FitPrime (Diferencial Exclusivo):**

As medidas já registradas na aba "Evolução" do aluno são automaticamente sincronizadas com a avaliação nutricional, evitando retrabalho e garantindo consistência dos dados.

---

### 3.7 Evolução

Acompanhamento visual da evolução do paciente ao longo do tempo.

**Gráficos Disponíveis:**

| Gráfico | Descrição |
|---------|-----------|
| Peso x Tempo | Evolução do peso corporal |
| IMC x Tempo | Evolução do IMC |
| % Gordura x Tempo | Evolução da composição corporal |
| Circunferências x Tempo | Evolução das medidas |
| Adesão ao Plano | Percentual de adesão semanal |
| Macros Consumidos | Comparativo planejado vs consumido |

**Comparativos:**

| Comparativo | Descrição |
|-------------|-----------|
| Antes/Depois | Comparação de fotos |
| Meta vs Atual | Progresso em relação à meta |
| Período | Comparação entre períodos |

**Integração com Treinos (Diferencial Exclusivo):**

| Funcionalidade | Descrição |
|----------------|-----------|
| Correlação Treino-Peso | Gráfico mostrando relação entre volume de treino e peso |
| Performance x Nutrição | Evolução de cargas vs ingestão proteica |
| Frequência x Adesão | Relação entre frequência nos treinos e adesão à dieta |

---

### 3.8 Anamnese Nutricional

Formulário completo de anamnese específica para nutrição.

**Seções da Anamnese:**

| Seção | Campos |
|-------|--------|
| **Identificação** | Nome, idade, profissão, estado civil |
| **Histórico de Saúde** | Doenças atuais, cirurgias, medicamentos |
| **Histórico Familiar** | Diabetes, hipertensão, obesidade na família |
| **Hábitos de Vida** | Sono, estresse, atividade física, tabagismo, etilismo |
| **Histórico Alimentar** | Dietas anteriores, alergias, intolerâncias |
| **Preferências** | Alimentos preferidos, aversões, restrições religiosas |
| **Rotina Alimentar** | Horários, local das refeições, quem prepara |
| **Recordatório 24h** | O que comeu nas últimas 24 horas |
| **Frequência Alimentar** | Frequência de consumo por grupo alimentar |
| **Sintomas GI** | Constipação, diarreia, gases, refluxo |
| **Objetivo** | Meta do paciente, expectativas |

**Funcionalidades:**

| Funcionalidade | Descrição |
|----------------|-----------|
| Modelos Personalizáveis | Criar modelos de anamnese |
| Preenchimento pelo Paciente | Enviar formulário para paciente preencher antes da consulta |
| Histórico | Manter histórico de anamneses |
| Exportar PDF | Gerar documento para impressão |

---

### 3.9 Exames

Registro e acompanhamento de exames laboratoriais.

**Exames Disponíveis:**

| Categoria | Exames |
|-----------|--------|
| **Hemograma** | Hemoglobina, hematócrito, leucócitos, plaquetas |
| **Glicemia** | Glicose jejum, HbA1c, TOTG |
| **Perfil Lipídico** | Colesterol total, HDL, LDL, VLDL, triglicerídeos |
| **Função Renal** | Ureia, creatinina, ácido úrico, TFG |
| **Função Hepática** | TGO, TGP, GGT, fosfatase alcalina, bilirrubinas |
| **Tireoide** | TSH, T3, T4 livre |
| **Vitaminas** | Vitamina D, B12, ácido fólico |
| **Minerais** | Ferro, ferritina, cálcio, magnésio, zinco |
| **Hormônios** | Insulina, cortisol, testosterona |
| **Inflamatórios** | PCR, homocisteína |

**Funcionalidades:**

| Funcionalidade | Descrição |
|----------------|-----------|
| Valores de Referência | Comparação com valores normais |
| Alertas | Destaque para valores alterados |
| Gráfico de Evolução | Acompanhamento ao longo do tempo |
| Interpretação | Sugestões de interpretação nutricional |
| Upload de Arquivos | Anexar PDF do laboratório |

---

### 3.10 Orientações

Banco de orientações nutricionais para enviar aos pacientes.

**Categorias de Orientações:**

| Categoria | Exemplos |
|-----------|----------|
| **Patologias** | Diabetes, hipertensão, doença renal, esteatose |
| **Objetivos** | Emagrecimento, hipertrofia, performance |
| **Fases da Vida** | Gestação, lactação, idosos, crianças |
| **Educação Alimentar** | Leitura de rótulos, compras, preparo |
| **Suplementação** | Whey, creatina, vitaminas |
| **Comportamento** | Comer consciente, compulsão, ansiedade |

**Funcionalidades:**

| Funcionalidade | Descrição |
|----------------|-----------|
| Biblioteca de Orientações | Orientações pré-escritas |
| Criar Orientação | Escrever orientações personalizadas |
| Personalizar | Editar orientações existentes |
| Enviar ao Paciente | Compartilhar via app |
| Anexar ao Plano | Vincular orientação ao plano alimentar |

---

### 3.11 Configurações Nutrição

Configurações específicas do módulo FitPrime Nutrition.

**Configurações Disponíveis:**

| Configuração | Descrição |
|--------------|-----------|
| **Dados do Profissional** | CRN, especialidades, assinatura digital |
| **Tabelas de Alimentos** | Selecionar tabelas ativas |
| **Fórmulas de VET** | Escolher fórmula padrão |
| **Protocolos de Avaliação** | Definir protocolos preferidos |
| **Templates de Plano** | Gerenciar modelos de planos |
| **Personalização de Documentos** | Logo, cores, layout dos PDFs |
| **Integrações** | Configurar integrações com treinos |

---

## 4. Diário Alimentar do Paciente (App)

O paciente/aluno terá acesso ao diário alimentar através do Portal do Aluno existente.

### 4.1 Funcionalidades do Diário

| Funcionalidade | Descrição |
|----------------|-----------|
| Registrar Refeição | Adicionar o que comeu |
| Foto da Refeição | Tirar foto do prato |
| Buscar Alimento | Buscar na base de dados |
| Porções | Definir quantidade consumida |
| Horário | Registrar horário da refeição |
| Avaliação | Avaliar como se sentiu (bem, mal, neutro) |
| Notas | Adicionar observações |

### 4.2 Visualização do Plano

| Funcionalidade | Descrição |
|----------------|-----------|
| Ver Plano Atual | Visualizar plano alimentar completo |
| Refeição do Momento | Destacar próxima refeição |
| Substituições | Ver opções de substituição |
| Receitas | Acessar receitas do plano |
| Lista de Compras | Gerar lista baseada no plano |

### 4.3 Integração com Treinos (Diferencial Exclusivo)

| Funcionalidade | Descrição |
|----------------|-----------|
| Alerta Pré-Treino | Lembrete para comer antes do treino |
| Alerta Pós-Treino | Lembrete da janela anabólica |
| Sugestão Contextual | Sugestão de refeição baseada no treino do dia |

---

## 5. Integrações Exclusivas (Diferenciais)

### 5.1 Sincronização Treino-Dieta

O FitPrime Nutrition oferece integração única com o módulo de treinos:

| Funcionalidade | Descrição |
|----------------|-----------|
| **Ajuste Automático de Macros** | O sistema sugere ajustes de carboidratos e proteínas baseado no tipo de treino programado para o dia |
| **Periodização Nutricional** | Alinhar fases nutricionais com fases de treino (volume, intensidade, deload) |
| **Refeições Peri-Treino** | Sugestões automáticas de refeições pré, intra e pós-treino |
| **Gasto Calórico Integrado** | Considerar gasto do treino no cálculo do VET |

### 5.2 Sincronização de Medidas

| Funcionalidade | Descrição |
|----------------|-----------|
| **Dados Unificados** | Medidas registradas em qualquer módulo ficam disponíveis em todos |
| **Histórico Completo** | Timeline única de evolução física e nutricional |
| **Fotos Integradas** | Fotos de evolução compartilhadas entre módulos |

### 5.3 Agenda Unificada

| Funcionalidade | Descrição |
|----------------|-----------|
| **Consultas + Treinos** | Visualização única de compromissos |
| **Evitar Conflitos** | Sistema alerta se consulta conflita com treino |
| **Lembretes Integrados** | Notificações unificadas para aluno |

### 5.4 Comunicação Centralizada

| Funcionalidade | Descrição |
|----------------|-----------|
| **Chat Único** | Aluno se comunica com personal e nutricionista no mesmo lugar |
| **Histórico Compartilhado** | Ambos profissionais veem o histórico de mensagens |
| **Notificações** | Alertas para ambos quando aluno registra treino ou refeição |

---

## 6. Relatórios

### 6.1 Relatórios Disponíveis

| Relatório | Descrição |
|-----------|-----------|
| **Plano Alimentar** | PDF do plano para impressão ou envio |
| **Avaliação Nutricional** | Documento completo da avaliação |
| **Evolução do Paciente** | Gráficos e comparativos |
| **Adesão ao Plano** | Análise de adesão baseada no diário |
| **Relatório Integrado** | Treino + Nutrição + Evolução (exclusivo) |

### 6.2 Personalização

| Opção | Descrição |
|-------|-----------|
| Logo | Inserir logo do profissional |
| Cores | Personalizar cores do documento |
| Assinatura | Assinatura digital do nutricionista |
| Cabeçalho/Rodapé | Informações de contato |

---

## 7. Permissões e Acesso

### 7.1 Verificação de CRN

O acesso ao módulo FitPrime Nutrition requer cadastro do CRN (Conselho Regional de Nutricionistas) do profissional. O sistema verifica:

| Verificação | Descrição |
|-------------|-----------|
| Número do CRN | Formato válido do registro |
| Estado | UF do registro |
| Situação | Ativo/Inativo (consulta futura à API do CFN) |

### 7.2 Níveis de Acesso

| Perfil | Acesso |
|--------|--------|
| **Admin (Personal com CRN)** | Acesso total ao FitPrime Manager + Nutrition |
| **Nutricionista Parceiro** | Acesso apenas ao módulo Nutrition |
| **Aluno/Paciente** | Acesso ao diário alimentar e visualização do plano |

---

## 8. Roadmap de Implementação

### Fase 1 - MVP (Mínimo Viável)

| Funcionalidade | Prioridade |
|----------------|------------|
| Menu FitPrime Nutrition no sidebar | Alta |
| Verificação de CRN | Alta |
| Cadastro de pacientes (integrado com alunos) | Alta |
| Planos alimentares básicos | Alta |
| Tabela de alimentos (TACO) | Alta |
| Diário alimentar do paciente | Alta |

### Fase 2 - Funcionalidades Core

| Funcionalidade | Prioridade |
|----------------|------------|
| Avaliação nutricional completa | Alta |
| Receitas | Média |
| Anamnese nutricional | Alta |
| Exames laboratoriais | Média |
| Orientações | Média |
| Relatórios PDF | Alta |

### Fase 3 - Integrações

| Funcionalidade | Prioridade |
|----------------|------------|
| Sincronização treino-dieta | Alta |
| Ajuste automático de macros | Média |
| Gráficos de evolução integrados | Alta |
| Comunicação centralizada | Média |

### Fase 4 - Avançado

| Funcionalidade | Prioridade |
|----------------|------------|
| IA para sugestão de planos | Baixa |
| Body Scan por fotos | Baixa |
| Integração com apps de saúde | Baixa |
| Marketplace de receitas | Baixa |

---

## 9. Considerações Técnicas

### 9.1 Banco de Dados

Novas tabelas necessárias:

| Tabela | Descrição |
|--------|-----------|
| `nutrition_profiles` | Perfil nutricional do paciente |
| `meal_plans` | Planos alimentares |
| `meal_plan_meals` | Refeições do plano |
| `meal_plan_foods` | Alimentos de cada refeição |
| `foods` | Base de alimentos |
| `food_categories` | Categorias de alimentos |
| `recipes` | Receitas |
| `recipe_ingredients` | Ingredientes das receitas |
| `nutrition_assessments` | Avaliações nutricionais |
| `food_diary` | Diário alimentar |
| `lab_exams` | Exames laboratoriais |
| `nutrition_guidelines` | Orientações nutricionais |

### 9.2 Integrações Existentes

| Sistema Existente | Integração |
|-------------------|------------|
| `students` | Vincular paciente ao aluno |
| `body_measurements` | Sincronizar medidas |
| `workouts` | Dados de treino para ajuste de macros |
| `sessions` | Agenda unificada |
| `photos` | Fotos de evolução compartilhadas |

---

## 10. Conclusão

O FitPrime Nutrition representa uma evolução natural do FitPrime Manager, oferecendo aos profissionais com dupla formação ou que trabalham em parceria com nutricionistas uma ferramenta completa e integrada. O diferencial competitivo está na **integração nativa entre treino e nutrição**, algo que nenhum concorrente oferece atualmente.

A implementação em fases permite validar o produto com usuários reais e ajustar funcionalidades conforme feedback, garantindo que o módulo atenda às reais necessidades do mercado.

---

**Documento criado por Manus AI**  
**FitPrime Manager - Janeiro 2026**
