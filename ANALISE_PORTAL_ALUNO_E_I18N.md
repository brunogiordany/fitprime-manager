# Análise do Portal do Aluno e Plano de Internacionalização

## Data: 31/12/2025

---

## 1. ANÁLISE DO PORTAL DO ALUNO - MELHORIAS DE UX

### Estrutura Atual
O Portal do Aluno possui as seguintes seções:
- **Início (Dashboard)** - Visão geral
- **Evolução** - Gráficos de progresso
- **Sessões** - Agendamentos
- **Treinos** - Lista de treinos
- **Diário** - Registro de treinos
- **Perfil** - Anamnese
- **Pagamentos** - Histórico financeiro
- **Chat** - Comunicação com personal
- **Conquistas** - Badges/gamificação

### Pontos Positivos ✅
1. Layout moderno com sidebar responsiva
2. Notificação de mensagens não lidas no chat
3. Onboarding para primeiro acesso
4. Persistência de dados no localStorage
5. Design consistente com cores emerald/teal

### Melhorias Recomendadas 🔧

#### UX Críticas (Prioridade Alta)
1. **Tela de Login**
   - Adicionar opção "Esqueci minha senha"
   - Adicionar login social (Google/Apple) para facilitar acesso
   - Mostrar/ocultar senha com ícone de olho

2. **Dashboard do Aluno**
   - Adicionar resumo visual do progresso (cards com métricas)
   - Mostrar próxima sessão agendada em destaque
   - Adicionar motivação diária/dicas rápidas

3. **Treinos**
   - Adicionar vídeos demonstrativos dos exercícios
   - Timer integrado para descanso entre séries
   - Botão de "Iniciar Treino" que guia o aluno

4. **Evolução**
   - Adicionar fotos de antes/depois lado a lado
   - Gráficos mais visuais e intuitivos
   - Compartilhamento de progresso nas redes sociais

#### UX Médias (Prioridade Média)
5. **Notificações Push**
   - Lembrete de treino
   - Lembrete de pagamento
   - Mensagem do personal

6. **Gamificação**
   - Streak de dias consecutivos
   - Desafios semanais
   - Ranking entre alunos (opcional)

7. **Modo Offline**
   - Visualizar treinos sem internet
   - Sincronizar quando reconectar

---

## 2. PLANO DE INTERNACIONALIZAÇÃO (i18n)

### Opções de Implementação

#### Opção A: react-i18next (RECOMENDADA)
**Complexidade:** Média | **Tempo estimado:** 3-5 dias

**Vantagens:**
- Biblioteca mais popular para React
- Suporte a detecção automática de idioma
- Lazy loading de traduções
- Pluralização e formatação de datas/números
- Integração com TypeScript

**Como funciona:**
```typescript
// Antes
<h1>Portal do Aluno</h1>

// Depois
<h1>{t('portal.title')}</h1>
```

#### Opção B: Clone Separado
**Complexidade:** Baixa | **Tempo estimado:** 1-2 dias

**Vantagens:**
- Mais simples de implementar
- Domínios separados (fitprime.com.br e fitprime.com)
- Sem overhead de biblioteca

**Desvantagens:**
- Manutenção duplicada
- Atualizações precisam ser feitas em 2 lugares

#### Opção C: next-intl (se migrar para Next.js)
**Complexidade:** Alta | **Tempo estimado:** 1-2 semanas

**Vantagens:**
- SEO otimizado com rotas por idioma (/en, /pt)
- SSR para melhor performance
- Melhor para mercado internacional

---

## 3. RECOMENDAÇÃO: react-i18next + Detecção Automática

### Funcionalidades Propostas:

1. **Detecção Automática de Idioma**
   - Detectar via IP/geolocalização
   - Fallback para idioma do navegador
   - Salvar preferência no localStorage

2. **Seletor de Idioma**
   - Botão no header/footer
   - Bandeiras dos países
   - Idiomas: PT-BR, EN-US, ES (futuro)

3. **Arquivos de Tradução**
   ```
   /locales
     /pt-BR
       common.json
       portal.json
       workouts.json
     /en-US
       common.json
       portal.json
       workouts.json
   ```

4. **Formatação Localizada**
   - Datas: DD/MM/YYYY (BR) vs MM/DD/YYYY (US)
   - Moeda: R$ vs $
   - Números: 1.000,00 vs 1,000.00

---

## 4. PLANO DE PRECIFICAÇÃO PARA EUA

### Modelo Proposto (Tiered Pricing)

| Plano | Limite Alunos | Preço BR | Preço US |
|-------|---------------|----------|----------|
| Starter | Até 10 | R$ 97/mês | $47/mês |
| Growth | Até 30 | R$ 197/mês | $97/mês |
| Pro | Até 75 | R$ 397/mês | $197/mês |
| Business | Até 150 | R$ 697/mês | $347/mês |
| Enterprise | Ilimitado | R$ 997/mês | $497/mês |

### Recursos por Plano

**Starter ($47/mês)**
- Até 10 alunos
- Treinos personalizados
- Agenda básica
- Chat com alunos
- Evolução com gráficos

**Growth ($97/mês)**
- Até 30 alunos
- Tudo do Starter +
- Automações WhatsApp
- Cobranças automáticas
- Relatórios avançados

**Pro ($197/mês)**
- Até 75 alunos
- Tudo do Growth +
- Análise IA de treinos
- White label básico
- Suporte prioritário

**Business ($347/mês)**
- Até 150 alunos
- Tudo do Pro +
- Domínio personalizado
- API access
- Multi-personal (equipe)

**Enterprise ($497/mês)**
- Alunos ilimitados
- Tudo do Business +
- SLA garantido
- Onboarding dedicado
- Customizações

### Integração Stripe

O Stripe já está integrado no projeto. Para aceitar pagamentos em USD:
1. Criar produtos/preços em USD no Stripe Dashboard
2. Detectar país do usuário e mostrar preço correto
3. Checkout em moeda local

---

## 5. CRONOGRAMA DE IMPLEMENTAÇÃO

### Fase 1: Internacionalização (1 semana)
- [ ] Instalar e configurar react-i18next
- [ ] Criar estrutura de arquivos de tradução
- [ ] Extrair todas as strings do código
- [ ] Traduzir para inglês
- [ ] Implementar seletor de idioma
- [ ] Implementar detecção automática

### Fase 2: Melhorias UX Portal do Aluno (1 semana)
- [ ] Redesign do Dashboard com cards de métricas
- [ ] Adicionar "Esqueci minha senha"
- [ ] Timer de descanso nos treinos
- [ ] Melhorar visualização de evolução

### Fase 3: Precificação US (3 dias)
- [ ] Criar produtos/preços USD no Stripe
- [ ] Implementar detecção de país
- [ ] Página de preços com toggle BR/US
- [ ] Checkout multi-moeda

### Fase 4: Testes e Deploy (2 dias)
- [ ] Testes em ambos idiomas
- [ ] Testes de pagamento
- [ ] Deploy em produção

---

## 6. DECISÃO NECESSÁRIA

**Pergunta para o usuário:**

Qual abordagem você prefere para a internacionalização?

**A) react-i18next (Recomendada)**
- Um único app com múltiplos idiomas
- Seletor de idioma + detecção automática
- Mais trabalho inicial, menos manutenção

**B) Clone Separado**
- Dois apps: fitprime.com.br (PT) e fitprime.com (EN)
- Mais simples de implementar
- Manutenção duplicada

**C) Subdomínios**
- br.fitprime.com e us.fitprime.com
- Mesmo código, configuração diferente
- Médio esforço
