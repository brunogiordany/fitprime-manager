# FitPrime Manager - TODO

## Infraestrutura
- [x] Schema do banco de dados com todas as entidades
- [x] Routers tRPC para todas as funcionalidades
- [x] Sistema de autenticação Personal/Aluno

## Dashboard do Personal
- [x] KPIs (total alunos, sessões do dia, receita mensal, taxa presença)
- [x] Agenda do dia com próximas sessões
- [x] Ações rápidas (novo aluno, nova sessão, nova cobrança)

## Gestão de Alunos
- [x] Lista de alunos com tabela
- [x] Filtros e busca
- [x] Perfil do aluno com abas:
  - [x] Visão geral
  - [x] Anamnese
  - [x] Evolução (gráficos)
  - [x] Fotos
  - [x] Treinos
  - [x] Agenda/Sessões
  - [x] Pagamentos
  - [x] Materiais
  - [ ] Exportar PDF

## Sistema de Anamnese
- [x] Formulário editável completo
- [x] Histórico de alterações
- [x] Linha do tempo

## Treinos
- [x] CRUD completo de treinos
- [x] Exercícios por dia da semana
- [x] Séries, repetições, carga

## Agenda
- [x] Visualização diária
- [x] Visualização semanal
- [x] Sessões com status (agendada, realizada, cancelada, falta)

## Cobranças e Planos
- [x] Lista de cobranças
- [x] Status de pagamento
- [x] Registro manual
- [x] Automação de cobranças
- [x] Planos do personal para alunos:
  - [x] Semanal, quinzenal, mensal
  - [x] 3, 6, 12 meses
  - [x] Pacotes de sessões
  - [x] Sessões avulsas

## Portal do Aluno
- [x] Login separado para alunos
- [x] Visualização de treinos
- [x] Visualização de anamnese
- [x] Galeria de fotos
- [x] Histórico de pagamentos
- [x] Agenda pessoal

## Automações WhatsApp
- [x] Integração Evolution API
- [x] Fila de mensagens
- [x] Worker de disparo
- [x] Webhook de entrada
- [x] Configurações:
  - [x] Janela de horário
  - [x] Limite por aluno
  - [x] Opt-out
  - [x] Logs de mensagens

## Segurança
- [x] Autenticação JWT segura
- [x] Validação de permissões em todas as rotas
- [x] Proteção contra SQL Injection (Drizzle ORM)
- [x] Rate limiting
- [x] Logs de auditoria
- [x] Criptografia de dados sensíveis

## Testes
- [x] Testes unitários para auth
- [x] Testes unitários para personal profile
- [x] Testes unitários para dashboard
- [x] Testes unitários para students
- [x] Testes unitários para plans
- [x] Testes unitários para automations
- [x] Testes de segurança (rotas protegidas)


## Melhorias Solicitadas (v1.1)
- [x] Corrigir página de Treinos (erro 404)
- [x] Planos: cálculo automático valor aula ↔ valor total (bidirecional)
- [x] Planos: adicionar ciclos maiores (trimestral, semestral, anual)
- [x] Planos: definir dia de vencimento/cobrança
- [x] Agenda: visualização mensal completa (calendário)
- [x] Agendamento: opção de cadastrar cliente durante agendamento
- [x] Agendamento: selecionar plano do cliente
- [ ] Agendamento: definir datas de vencimento e cobrança (pendente)


## Melhorias Solicitadas (v1.2)
- [x] Planos pré-criados (templates) para editar
- [x] Opção de duplicar plano existente
- [x] Corrigir erro 404 na aba Anamnese do aluno (abas funcionam inline)
- [x] Corrigir erro 404 na aba Medidas/Evolução do aluno (abas funcionam inline)
- [x] Corrigir erro 404 na aba Fotos do aluno (abas funcionam inline)
- [x] Corrigir página de Mensagens (erro 404)
- [x] Gráficos de evolução dos alunos (frequência, medidas)
- [x] Cobranças automáticas ao vincular plano ao aluno
- [x] Frequência semanal: 1x, 2x, 3x, 4x, 5x, 6x por semana
- [x] Recorrência de cobranças até cancelamento


## Melhorias Solicitadas (v1.3) - Medidas Corporais
- [ ] Sistema de registro de medidas corporais
  - [ ] Peso, altura, IMC (calculado automaticamente)
  - [ ] Percentual de gordura corporal
  - [ ] Circunferências (braço, peito, cintura, quadril, coxa, panturrilha)
- [ ] Gráficos de evolução temporal das medidas
- [ ] Comparativo entre datas de medição
- [ ] Histórico completo de medições
- [ ] Integração na aba Evolução do perfil do aluno

## Melhorias Solicitadas (v1.4) - Cobranças Reorganizadas
- [ ] Agrupar cobranças por aluno (não listar todas separadamente)
- [ ] Clicar no aluno expande/mostra as cobranças dele
- [ ] Métricas SaaS reais:
  - [ ] MRR (Monthly Recurring Revenue)
  - [ ] ARR (Annual Recurring Revenue)
  - [ ] Churn Rate
  - [ ] LTV (Lifetime Value)
  - [ ] Ticket Médio


## Melhorias Solicitadas (v1.5) - Planos de Fábrica
- [ ] Criar 6 planos mensais pré-definidos de fábrica:
  - [ ] Mensal 1x semana
  - [ ] Mensal 2x semana
  - [ ] Mensal 3x semana
  - [ ] Mensal 4x semana
  - [ ] Mensal 5x semana
  - [ ] Mensal 6x semana
- [ ] Planos criados automaticamente quando personal se cadastra
- [ ] Valor zerado para personal editar
- [ ] Opção de duplicar plano existente (já implementado)


## Correções Urgentes (v1.6)
- [x] Corrigir menu de ações (3 pontinhos) na página de Treinos
- [x] Trocar integração Evolution API para Stevo (https://stevo.chat/)


## Sistema de Treinos Completo (v1.7)
- [x] Página de detalhes do treino
- [x] CRUD de exercícios dentro do treino
  - [x] Nome do exercício
  - [x] Grupo muscular
  - [x] Séries
  - [x] Repetições
  - [x] Carga/Peso
  - [x] Tempo de descanso
  - [x] Notas/observações
- [x] Organização por dias da semana (Treino A, B, C)
- [x] Funcionalidade de editar treino
- [x] Funcionalidade de duplicar treino
- [x] Funcionalidade de ver detalhes do treino


## Diário de Treino (v1.8)
- [x] Schema para workout_logs (registro de sessões de treino)
- [x] Schema para exercise_logs (registro de cada exercício na sessão)
- [x] Tabela estilo planilha para registrar treino
  - [x] Data e hora da sessão
  - [x] Colunas para séries (S1, S2, S3, S4, S5) com Peso/Reps
  - [x] Coluna de observações
  - [x] Checkbox de concluído
- [ ] Histórico de sessões por treino
- [ ] Comparativo de evolução de carga
- [x] Personal e aluno podem preencher


## Bugs Urgentes (v1.9)
- [x] Corrigir abas do perfil do aluno que dão erro 404
  - [x] Anamnese
  - [x] Evolução/Medidas
  - [x] Fotos
  - [x] Treinos
  - [x] Materiais


## Bugs Críticos (v2.0)
- [x] Excluir aluno não funciona
- [x] Botões check/X no Dashboard não funcionam (marcar sessão realizada/cancelada)
- [x] Editar aluno não funciona - CORRIGIDO
- [ ] Exportar PDF não funciona
- [x] Erro ao atualizar medidas (problema no banco de dados)
- [x] Treino excluído fica como "inativo" ao invés de sumir

## Cálculo de BF e Composição Corporal (v2.0)
- [x] Adicionar campo de gênero no aluno/medidas
- [x] Cálculo automático de BF estimado baseado nas medidas (US Navy Method)
- [x] Campo manual para Bioimpedância (BF, massa magra, massa gorda)
- [x] Campo manual para Adipômetro (BF, massa magra, massa gorda, dobras cutâneas)
- [ ] Comparativo entre métodos (estimado vs bio vs adi)
- [x] Fórmula oficial para cálculo de BF

## Agendamento Automático (v2.0)
- [x] Ao fechar plano, selecionar dias fixos de treino (seg, qua, sex)
- [x] Criar automaticamente 4 semanas de agendamento
- [x] Ao cancelar parceria, excluir todos agendamentos do aluno

## Automações Stevo (v2.0)
- [x] Atualizar interface de automações para mostrar Stevo (não Evolution API)
- [x] Trocar Evolution API para Stevo (https://stevo.chat/)
- [x] Automações padrão criadas automaticamente (quando não existem)
- [x] Lembrete 24h antes do treino
- [x] Lembrete 2h antes do treino
- [x] Lembrete de pagamento (3 dias antes)
- [x] Pagamento em atraso (3 dias depois)
- [x] Boas-vindas
- [x] Aniversário

## Lixeira de Treinos (v2.0)
- [x] Treinos excluídos vão para lixeira
- [x] Opção de restaurar treino
- [x] Opção de esvaziar lixeira (exclusão permanente)

## Histórico de Sessões (v2.1)
- [x] Implementar listagem de sessões na aba Sessões do perfil do aluno
- [x] Mostrar histórico completo de sessões (realizadas, faltas, agendadas)
- [x] Integrar com sessões do calendário

## Upload de Fotos e Materiais (v2.2)
- [x] Implementar upload de fotos funcional (botão Adicionar Foto)
- [x] Implementar upload de materiais funcional
- [ ] Corrigir botão Editar do perfil do aluno

## Cálculos Automáticos na Evolução (v2.3)
- [x] Calcular BF (Body Fat) automaticamente baseado nas medidas
- [x] Calcular IMC automaticamente (peso/altura²)
- [x] Calcular Massa Gorda e Massa Magra estimadas
- [ ] Permitir arrastar/reordenar colunas na tabela de medidas
- [ ] Permitir criar novas colunas personalizadas
- [ ] Permitir fórmulas personalizadas para cálculos

## Automações Stevo Corrigidas (v2.4)
- [x] Criar 6 automações padrão (Aniversário, Boas-vindas, Lembretes de treino 24h/2h, Lembrete de pagamento, Pagamento em atraso)
- [x] Integração com Stevo para envio de WhatsApp

## Sistema de Lixeira para Treinos (v2.5)
- [x] Implementar soft delete para treinos (campo deletedAt)
- [x] Criar página de lixeira para visualizar treinos excluídos
- [x] Implementar restauração de treinos da lixeira
- [x] Ao excluir definitivamente, remover de todos os lugares

## Integração WhatsApp via QR Code (v2.6)
- [x] Pesquisar API do Stevo para conexão via QR Code
- [x] Criar interface para conexão WhatsApp nas Configurações
- [x] Implementar botão para conectar WhatsApp (abre painel Stevo)
- [x] Status de conexão visível na interface
- [x] Permitir desconectar e reconectar WhatsApp

## Área do Aluno com Sistema de Convites (v2.7)
- [x] Sistema de convites por email/WhatsApp para alunos
- [x] Aluno recebe link único para criar conta
- [x] Aluno acessa com role "student" (não personal)
- [x] Personal pode resetar acesso do aluno
- [x] Personal pode editar dados do aluno para auxiliar
- [ ] Dashboard específico para alunos:
  - [ ] Ver seus treinos
  - [ ] Ver agenda de sessões
  - [ ] Ver histórico de pagamentos
  - [ ] Ver anamnese e medidas
  - [ ] Ver fotos de evolução
- [ ] Aluno pode registrar treino (diário de treino)
- [ ] Notificação para personal quando aluno registra treino

## Bugs Pendentes (v2.8)
- [x] Editar aluno não funciona - CORRIGIDO (botão Editar no perfil)
- [ ] Exportar PDF não funciona
- [x] Treino excluído ainda aparece na lista (precisa lixeira) - RESOLVIDO

## Melhorias Calendário/Agenda estilo Belasis (v3.0)

### Visualização do Calendário
- [ ] Visualização mensal com "+X more" quando tiver muitos agendamentos
- [ ] Ao clicar em "+X more", expandir lista de agendamentos do dia
- [ ] Ao clicar em agendamento, abrir modal de edição completo

### Modal de Edição de Agendamento
- [ ] Informações do cliente (nome, telefone, link para perfil)
- [ ] Botões: Conversar (WhatsApp), Ver cliente
- [ ] Data com opção de reagendar
- [ ] Status com cores (Confirmado, Não confirmado, Cancelado, Aguardando, Faturado, Bloqueado)
- [ ] Serviço/Descrição
- [ ] Profissional
- [ ] Horário e Duração
- [ ] Botões: Outros, Salvar, Criar comanda

### Configurações da Agenda (3 abas)
- [ ] Aba Geral: Filtrar profissionais por serviço, Bloquear horários cancelados
- [ ] Aba Visualização: Largura colunas, Intervalo (15min), Status padrão, Exibir avatares
- [ ] Aba Cores: Personalizar cores por status, criar cores customizadas (Cliente VIP, etc)

### Filtros
- [ ] Filtro por profissional
- [ ] Filtro por status (Confirmado, Não confirmado, Cancelado, Aguardando, Faturado, Bloqueado)
- [ ] Botão "Desmarcar tudo"

### Novo Agendamento Melhorado
- [ ] Selecionar cliente (busca com lista)
- [ ] Data e Status
- [ ] Serviço com descrição
- [ ] Profissional, Horário, Duração
- [ ] Ações: Enviar lembrete, Encaixar agendamento
- [ ] Recorrência: Frequência, Repetir X vezes
- [ ] Observação

### Menu de Ações Rápidas
- [ ] Bloquear horários
- [ ] Agrupar agendamentos
- [ ] Visualização: Diário, Semanal, Mensal
- [ ] Configurações

### Dashboard - Agenda de Hoje
- [ ] Ao clicar em sessão, abrir modal de edição (não ir para alunos)


## Bugs Pendentes (v3.1)
- [x] Edição de status de sessões na aba do aluno (clicar para editar status: Agendada, Confirmada, Realizada, Falta, Cancelada)
