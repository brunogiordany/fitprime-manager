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
