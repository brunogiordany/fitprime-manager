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
  - [x] Exportar PDF

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
- [x] Filtros por status no calendário (Agendada, Confirmada, Realizada, Falta, Cancelada)
- [x] +X mais para dias com muitas sessões no calendário

## Gerenciamento de Contratos (v3.2)
- [ ] Status de contrato: Ativo, Cancelado, Pausado, Inadimplente
- [ ] Opção de cancelar todos os agendamentos futuros quando contrato for cancelado/pausado
- [ ] Opção de encerrar cobranças futuras quando contrato for cancelado
- [ ] Atualizar interface para mostrar e gerenciar status do contrato

## Melhorias do Calendário - Belasis (v3.3)
- [ ] Modal de edição ao clicar em sessão no calendário
- [ ] Mostrar informações do cliente (nome, telefone) no modal
- [ ] Botões Conversar (WhatsApp) e Ver cliente no modal
- [ ] Editar data, status, horário e duração no modal
- [ ] Ações: Enviar lembrete, Encaixar agendamento
- [ ] Recorrência: frequência e repetições
- [ ] Campo de observações
- [ ] Botões: Outros, Salvar no modal
- [ ] +X more clicável abrindo lista de agendamentos do dia
- [ ] Ao clicar em item da lista, abrir modal de edição

## Melhorias Modal de Edição - Estilo Belasis (v3.4)
- [x] Informações do cliente com seta para perfil
- [x] Data clicável com seta
- [x] Status com cor (dropdown)
- [ ] Campo Padrão (dropdown)
- [x] Seção Serviços: Descrição e Profissional
- [x] Horário como dropdown com opções de horário
- [x] Duração como dropdown
- [x] Botão + Adicionar Serviço
- [x] Ações: Enviar lembrete (switch) + Encaixar agendamento (switch)
- [x] Recorrência: Frequência (dropdown) + Repetir mais X vezes
- [x] Observação (textarea)
- [x] Botões fixos no rodapé: Outros (dropdown), Salvar (azul), Criar comanda (verde)
- [x] Lista lateral de agendamentos do dia ao clicar em +X more

## Integração Stripe (v3.5)
- [x] Adicionar feature Stripe ao projeto
- [x] Configurar chaves de API do Stripe
- [x] Criar produtos e preços no Stripe
- [x] Implementar checkout para pagamentos únicos
- [x] Implementar assinaturas recorrentes
- [x] Webhooks para atualizar status de pagamento
- [x] Interface de pagamento (botão Pagar com Cartão nas cobranças)

## Lixeira Geral (v3.6)
- [x] Criar página de Lixeira Geral no menu lateral esquerdo
- [x] Englobar todos os itens excluídos (treinos, alunos, sessões)
- [x] Organizar por tipo de item (abas: Treinos, Alunos, Sessões)
- [x] Opção de restaurar item
- [x] Opção de excluir permanentemente
- [x] Remover lixeira específica da página de Treinos

## Melhorias v3.7
- [x] Gerenciamento de contratos com status: Ativo, Pausado, Cancelado, Inadimplente
- [x] Ações automáticas ao mudar status do contrato (cancelar agendamentos/cobranças futuras)
- [x] Botão Esvaziar Lixeira na interface
- [x] Modal de edição ao clicar em sessão na Agenda de Hoje do Dashboard

## Melhorias v3.8
- [x] Portal do Aluno completo
  - [x] Dashboard específico para alunos
  - [x] Visualização de treinos
  - [x] Visualização de agenda/sessões
  - [x] Histórico de pagamentos
  - [ ] Registro de treino (diário) - pendente
- [x] Notificações de pagamento
  - [x] Envio automático quando pagamento confirmado pelo Stripe
  - [x] Notificação para o owner do sistema
- [x] Exportar PDF
  - [x] Exportar dados do aluno (anamnese, medidas, treinos)
  - [x] Gerar PDF formatado com informações completas
- [x] Corrigir Lixeira para mostrar menu lateral

## Melhorias v3.9
- [x] Registro de Treino pelo Aluno no Portal
  - [x] Página para aluno registrar treino realizado
  - [x] Selecionar treino e exercícios
  - [x] Registrar séries, peso e repetições
  - [x] Notificação automática para o personal quando treino for concluído
- [x] Integração WhatsApp via Stevo
  - [x] Enviar lembretes de sessão automaticamente
  - [x] Enviar confirmações de pagamento via WhatsApp
  - [x] Usar API do Stevo para envio de mensagens
- [x] Página de Relatórios de Desempenho
  - [x] Gráficos de evolução dos alunos (medidas, peso)
  - [x] Gráfico de frequência mensal
  - [x] Análise de receita por período
  - [x] Taxa de presença geral

## Melhorias v4.0
- [x] Relatórios: mais opções de período
  - [x] Adicionar: Última semana, Últimos 15 dias, Último mês
  - [x] Adicionar: Últimos 2 anos, Todo o período
  - [x] Seletor de datas personalizado (de/até)

## Correções e Melhorias v4.1
- [x] Corrigir erro "Invalid time value" na página de alunos
- [x] Corrigir botão "Adicionar Serviço" que não funciona
- [x] Adicionar opções de duração de 5 em 5 minutos (5min, 10min, 15min, etc)
- [x] Adicionar opções "Cancelar" e "Falta" no menu "Outros"
- [x] Sistema de convite para Portal do Aluno já existe (botão Convidar no perfil do aluno)
- [x] Sincronização Personal ↔ Aluno com aprovação de alterações
  - [x] Tabela de alterações pendentes (pending_changes)
  - [x] Aluno pode solicitar alteração via Portal
  - [x] Personal aprova ou rejeita na página Alterações Pendentes
  - [x] Notificação automática quando aluno solicita alteração
- [ ] Sincronização Personal ↔ Aluno com sistema de aprovação
  - [ ] Alterações do aluno ficam pendentes
  - [ ] Personal pode aprovar ou rejeitar
  - [ ] Mostrar original vs alteração proposta

## Melhorias v4.2 - Enviar Acesso ao Aluno
- [x] Seção dedicada "Enviar Acesso" no perfil do aluno
  - [x] Card destacado com status de acesso (conectado/não conectado)
  - [x] Botão para enviar convite por email
  - [x] Botão para enviar convite por WhatsApp
  - [x] Copiar link de convite
  - [x] Opção de resetar acesso do aluno
- [x] Botão de convite rápido na lista de alunos
- [x] Melhorar comparativo visual nas Alterações Pendentes
  - [x] Mostrar lado a lado: valor atual vs valor proposto
  - [x] Destacar diferenças com cores

## Automações Avançadas v4.3
- [ ] Adicionar campo "Tem filhos" no cadastro do aluno
- [ ]## Automações Avançadas v4.3
- [x] Datas comemorativas com filtros inteligentes
  - [x] Dia das Mães (filtro: mulheres com filhos)
  - [x] Dia dos Pais (filtro: homens com filhos)
  - [x] Natal (todos)
  - [x] Ano Novo (todos)
  - [x] Dia da Mulher (filtro: mulheres)
  - [x] Dia do Homem (filtro: homens)
  - [x] Dia do Cliente (todos)
- [x] Lembretes de pagamento adicionais
  - [x] 2 dias antes do vencimento
  - [x] No dia do vencimento
- [x] Reconhecimento automático de pagamento via WhatsApp
  - [x] Detectar "já paguei" ou variações
  - [x] Detectar envio de comprovante (imagem/documento)
  - [x] Atualizar status da cobrança automaticamente
  - [x] Notificar personal sobre pagamento confirmado
- [x] Campos adicionados no aluno: hasChildren (tem filhos), maritalStatus (estado civil)
## Automação de Reengajamento v4.4
- [x] Criar trigger "reengagement_30days" para alunos inativos há 30+ dias
- [x] Mensagem com oferta especial para reengajamento (sessão gratuita)
- [x] Adicionar na interface de automações
- [x] Variáveis disponíveis: {nome}, {dias_inativo}, {ultima_sessao}

## Automações Pré-criadas v4.5
- [x] Inserir todas as automações padrão no banco de dados (16 automações ativas)
- [x] Garantir que automações sejam criadas automaticamente para novos personals

## Pausa de Mensagens v4.6
- [ ] Remover automações duplicadas do banco
- [ ] Adicionar campo messagePausedUntil no schema de alunos
- [ ] Interface no Portal do Aluno para pausar mensagens
- [ ] Interface no perfil do aluno para personal gerenciar pausa
- [ ] Lógica para verificar pausa antes de enviar mensagens

## Integração Anamnese + Medidas (v4.2)
- [x] Adicionar campos de medidas corporais na aba Anamnese
  - [x] Peso (kg)
  - [x] Altura (cm)
  - [x] % Gordura
  - [x] Massa Muscular (kg)
  - [x] Circunferências (pescoço, peito, cintura, quadril, braços, coxas, panturrilhas)
- [x] Criar primeiro registro de medidas automaticamente ao salvar anamnese
- [x] Permitir aluno e personal adicionar novas medidas para acompanhamento (via aba Evolução)

## Bugs e Melhorias (v4.3)
- [x] Corrigir erro ao cancelar contrato (Invalid input: expected number)
- [x] Sistema de pausa de aluno (férias/ausência temporária)
  - [x] Cancelar sessões futuras durante a pausa
  - [x] Cancelar cobranças futuras durante a pausa
  - [x] Manter contrato ativo
- [x] Cancelamento definitivo do aluno
  - [x] Cancelar contrato, sessões e cobranças
  - [x] Manter histórico (anamnese, medidas, evolução)

## Melhorias v4.4
- [x] Gráfico de evolução para comparar histórico de medidas corporais
  - [x] Gráfico de peso ao longo do tempo
  - [x] Gráfico de % gordura e massa muscular ao longo do tempo
  - [x] Gráfico de circunferências ao longo do tempo (cintura, quadril, peito, braço, coxa)
  - [x] Comparativo entre medidas
- [x] Exportar PDF completo com histórico de medidas e anamnese
  - [x] Incluir dados da anamnese expandida (estilo de vida, objetivos, saúde, nutrição, exercícios)
  - [x] Incluir histórico completo de medidas com todas as medições
  - [x] Resumo da evolução (primeira vs última medida)

## Correções v4.5
- [x] Corrigir link de convite que dá erro 404 (rota /convite/:token não existe)
  - [x] Criar página Invite.tsx com validação de token
  - [x] Adicionar rotas validateInvite e acceptInvite no backend
  - [x] Adicionar rota /convite/:token no App.tsx
- [x] Mover botão de voltar mês para junto do título na agenda

## Onboarding do Aluno via Convite (v4.6)
- [ ] Página de cadastro simplificado para aluno via convite
  - [ ] Formulário: nome, email, telefone, senha
  - [ ] Validação do token de convite
  - [ ] Criar conta do aluno automaticamente
  - [ ] Vincular ao perfil existente no sistema do personal
- [ ] Fluxo de onboarding no Portal do Aluno
  - [ ] Tela de boas-vindas após cadastro
  - [ ] Wizard para completar anamnese
  - [ ] Indicador de progresso do perfil
- [ ] Sincronização com dashboard do personal
  - [ ] Notificar personal quando aluno completar cadastro
  - [ ] Atualizar dados do aluno em tempo real


## Autenticação de Alunos v4.7
- [x] Sistema de autenticação próprio para alunos (email/senha)
  - [x] Adicionar campo passwordHash na tabela students
  - [x] Criar rota de login para alunos
  - [x] Criar rota de cadastro via convite
  - [x] Gerar JWT para sessão do aluno
- [x] Ajustar página de convite para cadastro direto
  - [x] Remover dependência de OAuth
  - [x] Formulário de cadastro com email/senha
  - [x] Login automático após cadastro
- [x] Implementar login de aluno com email/senha
  - [x] Página de login para alunos (/login-aluno)
  - [x] Validação de credenciais
  - [x] Redirecionamento para portal do aluno (/portal-aluno)

## Melhorias Portal do Aluno v4.8
- [ ] Wizard de onboarding para aluno completar anamnese após primeiro login
  - [ ] Detectar se é primeiro acesso do aluno
  - [ ] Mostrar wizard com passos para completar perfil
  - [ ] Indicador de progresso do perfil
  - [ ] Campos de anamnese simplificados
- [ ] Notificação ao personal quando aluno completar cadastro
  - [ ] Enviar notificação via sistema de notificações
  - [ ] Incluir nome do aluno e data
- [ ] Seção de anamnese no perfil do aluno
  - [ ] Permitir aluno visualizar suas informações
  - [ ] Permitir aluno editar anamnese a qualquer momento
  - [ ] Sincronizar alterações com dashboard do personal


## Portal do Aluno Completo (v4.6)
- [x] Wizard de onboarding para novos alunos
  - [x] Guia passo a passo para preencher anamnese
  - [x] Indicador de progresso visual
  - [x] Campos de saúde, objetivos e medidas básicas
- [x] Notificações para o personal trainer
  - [x] Notificação quando aluno se cadastra via convite
  - [x] Notificação quando aluno preenche anamnese
- [x] Portal do aluno com autenticação JWT
  - [x] Dashboard com próximas sessões e cobranças pendentes
  - [x] Visualização de treinos atribuídos
  - [x] Visualização e edição de anamnese
  - [x] Histórico de pagamentos
  - [x] Indicador de progresso do perfil
- [x] Fluxo completo: convite → cadastro → login → onboarding → portal


## Bugs Reportados (v4.7)
- [x] Botão "Enviar Acesso" na lista de alunos não abre modal/tela
- [x] Erro ao finalizar cadastro via link de convite (convite já usado)
- [x] Aluno não recebe email de confirmação/acesso após cadastro
- [x] Implementar envio de email com link de login para o aluno
- [x] Modal de convite com link copiável e botão WhatsApp
- [x] Email de convite com template bonito
- [x] Email de boas-vindas após cadastro


## Melhorias Portal do Aluno (v4.8)
- [x] Gráficos de evolução no portal do aluno
  - [x] Gráfico de peso ao longo do tempo
  - [x] Gráfico de medidas corporais (cintura, quadril, peito)
  - [x] Gráfico de composição corporal (gordura, massa magra)
  - [x] Gráfico de frequência de treinos por mês
  - [x] Cards de estatísticas (peso atual, treinos realizados, taxa de presença)
- [x] Sistema de notificações para alunos
  - [x] Notificações por email (confirmação/cancelamento)
  - [x] Templates de email para lembretes de treino
  - [x] Templates de email para avisos de pagamento
- [x] Gerenciamento de sessões pelo aluno
  - [x] Confirmar presença em sessão (até 48h antes)
  - [x] Cancelar sessão com antecedência (mínimo 24h)
  - [x] Histórico de sessões
  - [x] Notificação ao personal via in-app e email


## Configurações e Correções (v4.9)
- [x] Configurar API key do Resend para envio de emails
- [x] Corrigir problema de login do portal do aluno (erro jwt.sign)
- [x] Atualizar email remetente para usar domínio do Resend (onboarding@resend.dev)


## Bugs Reportados (v5.0)
- [x] Cadastro via link de convite não funciona (erro ao finalizar) - FUNCIONANDO
- [x] Agenda diária não mostra sessões agendadas
- [x] Reorganizar layout da agenda: data e botões de navegação juntos


## Sistema de Treinos com IA (v5.1)
- [x] Atualizar anamnese com campos para IA
  - [x] Objetivo principal (hipertrofia, emagrecimento, recomposição, bulking, cutting, etc.)
  - [x] Nível de experiência (iniciante, intermediário, avançado)
  - [x] Frequência semanal disponível
  - [x] Lesões e limitações físicas (já existia)
  - [x] Local de treino e equipamentos disponíveis
- [x] Templates de treinos pré-programados
  - [x] Treino A/B/C para Hipertrofia (Iniciante e Intermediário)
  - [x] Treino para Emagrecimento (Circuito Metabólico)
  - [x] Treino para Recomposição Corporal
  - [x] Treino para Iniciantes (Full Body)
  - [x] Treino para Bulking
  - [x] Treino para Cutting
- [x] Geração de treino com IA
  - [x] Endpoint para gerar treino baseado na anamnese
  - [x] Botão "Gerar Treino com IA" na página de treinos
  - [x] Preview do treino antes de salvar
  - [x] Campo para instruções adicionais do personal
- [x] Duplicar treino para outros alunos
  - [x] Dialog para selecionar aluno de destino
  - [x] Copia completa do treino com exercícios
- [x] Organização por objetivos com filtros
  - [x] Filtro por objetivo (Hipertrofia, Emagrecimento, etc.)
  - [x] Badge de objetivo na lista de treinos
  - [x] Indicador visual de treino gerado por IA


## Bugs e Melhorias Reportados (v5.2)
- [x] Botão "Hoje" na agenda removido (ficava fora de padrão)
- [x] Edição de agendamento corrigida:
  - [x] Horário salva corretamente
  - [x] Alterações são salvas
- [x] Modal de Templates de Treino com scroll adequado (h-[85vh])
- [x] Tela de treino gerado com IA:
  - [x] Botão "Gerar Novo" para regenerar treino
  - [x] Botão "Salvar e Editar" para salvar e editar depois
- [x] Campo de restrições de treino na anamnese:
  - [x] Seleção visual de regiões (lombar, joelho, ombro, cervical, quadril, etc.)
  - [x] Campo de detalhes das restrições
- [x] IA puxa restrições da anamnese automaticamente
- [x] Prompt da IA atualizado com regras específicas para cada restrição


## Bugs e Melhorias v5.3 - CHECKLIST
- [x] Adicionar Serviço não funciona na agenda - REMOVIDO (botão desnecessário)
- [x] Horário salva errado - CORRIGIDO (validação melhorada)
- [x] Remover botão "Criar comanda" - REMOVIDO
- [x] Recorrência não agenda corretamente - CORRIGIDO (cria sessões semanais)
- [x] Mudar opções de frequência para períodos:
  - [x] 1 semana, 2 semanas, 3 semanas
  - [x] 1 mês, 2 meses, 3 meses, 4 meses, 5 meses, 6 meses
  - [x] 1 ano
- [x] Modal de Templates não rola - CORRIGIDO (overflow-y-auto)
- [x] Modal de Treino com IA não rola - CORRIGIDO (overflow-y-auto)
- [x] Adicionar ênfases em grupos musculares na anamnese:
  - [x] Preferências de grupos musculares (12 grupos: peito, costas, ombros, bíceps, tríceps, antebraço, abdômen, glúteos, quadríceps, posterior, panturrilha, core)
  - [x] IA usa preferências ao gerar treino (prompt atualizado)


## Sistema de Monitoramento e Notificações (v5.4)
- [x] Health Check Endpoint para monitorar banco de dados e serviços (/api/health)
- [x] Notificações automáticas para o owner quando detectar falhas
- [x] Logging detalhado de erros com motivos das falhas
- [x] Monitoramento de conexão com banco de dados
- [x] Alerta de OAuth callback failures
- [ ] Dashboard de status do sistema (opcional)


## Bugs Modal IA (v5.5)
- [x] Botão "Salvar e Editar" já existe no código (verificado)
- [x] Layout do modal corrigido - aumentada largura para 95vw/max-w-5xl e ajustadas colunas da tabela


## Correção Modal IA v5.6
- [x] Layout completamente refeito com largura 98vw/max-w-6xl
- [x] Botões fixos no rodapé do modal (sempre visíveis)
- [x] Tabela de exercícios com overflow-x-auto para scroll horizontal
- [x] Cabeçalho e rodapé separados do conteúdo scrollável


## Edição de Exercícios no Treino IA (v5.7)
- [x] Adicionar botão de excluir em cada exercício da lista (botão X vermelho)
- [x] Adicionar botão de editar em cada exercício da lista (botão lápis azul)
- [x] Implementar lógica de exclusão (remover do array aiPreview, remove dia se ficar vazio)
- [x] Implementar modal de edição com campos para nome, grupo, séries, reps, descanso
- [x] Atualizar estado aiPreview ao modificar exercícios


## Bugs Agenda v5.8
- [x] Bug: Horário salva incorretamente - CORRIGIDO (parsing de data local sem conversão de timezone)
- [x] Modal Nova Sessão agora tem mesmas opções do modal de Edição:
  - [x] Seletor de data e hora (datetime-local)
  - [x] Status inicial (Não confirmado, Confirmado)
  - [x] Ações (Enviar lembrete, Encaixar agendamento)
  - [x] Recorrência (Repetir por período - 1 semana a 1 ano)


## Vinculação de Treino à Sessão (v5.9)
- [x] Adicionar campo workoutId e workoutDayIndex na tabela sessions
- [x] Atualizar rotas de create/update session para aceitar treino
- [x] Adicionar seletor de treino no modal de Nova Sessão
- [x] Adicionar seletor de treino no modal de Edição de Sessão
- [x] Exibir treino vinculado no Portal do Aluno com exercícios detalhados


## Melhorias Anamnese e IA (v6.0)
- [ ] Adicionar campo de frequência semanal na anamnese (1x a 7x por semana)
- [ ] IA considera gênero do aluno para personalizar treinos
- [ ] IA usa frequência semanal para gerar quantidade correta de dias de treino
- [ ] Agendamento em cascata com seleção de dias da semana fixos
- [ ] Agendar automaticamente por período selecionado (1 semana a 1 ano)


## Melhorias Anamnese e IA (v5.10) - CONCLUÍDO
- [x] Adicionar campo de frequência semanal na anamnese (1x a 7x por semana)
- [x] Adicionar campo de dias preferidos de treino na anamnese
- [x] Adicionar campo de horário preferido de treino na anamnese
- [x] IA considerar gênero do aluno ao gerar treino (exercícios diferentes para homem/mulher)
- [x] IA usar frequência semanal para gerar quantidade correta de dias de treino
- [x] Agendamento em cascata implementado:
  - [x] Seleção de dias da semana fixos (Dom, Seg, Ter, Qua, Qui, Sex, Sáb)
  - [x] Horário padrão para todas as sessões
  - [x] Criar múltiplas sessões automaticamente pelo período selecionado
  - [x] Vincular treinos em sequência (A, B, C...) automaticamente


## Bugs Críticos Agenda (v5.11)
- [x] Bug: Horário alterado ao salvar sessão - CORRIGIDO (parsing de data local sem conversão de timezone)
- [x] Bug: Sessões excluídas filtradas do calendário (isNull(deletedAt))
- [x] Bug: Aba Sessões do aluno agora mostra todas as sessões (incluindo futuras)
- [x] Validação de conflito de horário implementada (verifica sobreposição de sessões)


## Melhorias Anamnese e PDF (v5.12)
- [ ] Remover seção "Equipamentos Disponíveis" da anamnese (muito técnico)
- [ ] Corrigir PDF de medições:
  - [ ] Mostrar apenas medições com dados preenchidos
  - [ ] Se não tiver dados, mostrar mensagem orientando onde preencher
  - [ ] Corrigir "Data não disponível" para mostrar data real
- [ ] Logo personalizada do Personal:
  - [ ] Adicionar campo de upload de logo nas Configurações
  - [ ] Salvar logo no S3
  - [ ] Usar logo do personal no PDF exportado (ao invés do FitPrime)
  - [ ] Manter rodapé "FitPrime Manager - Relatório Confidencial"


## Melhorias Anamnese e PDF (v5.12)
- [x] Remover seção "Equipamentos Disponíveis" da anamnese (muito técnico)
- [x] Corrigir PDF de medições - mostrar apenas dados preenchidos (filtra medições vazias)
- [x] Se não tiver medições, mostrar mensagem orientando onde preencher
- [x] Adicionar opção de logo personalizada nas Configurações (upload/remover)
- [x] Usar logo do personal no PDF exportado (cabeçalho e rodapé)
- [x] Rodapé usa nome do personal ou "FitPrime Manager" como fallback


## Melhorias Anamnese Nutricional e Medidas (v5.13)
- [ ] Adicionar campo de consumo calórico (kcal/dia) na seção Nutrição
- [ ] Adicionar seção de Atividades Aeróbicas/Cardio:
  - [ ] Se faz cardio (sim/não)
  - [ ] Lista de atividades (natação, hipismo, corrida, bike, etc.)
  - [ ] Tempo por sessão
  - [ ] Frequência semanal
- [ ] Adicionar gênero nas Medidas para cálculo correto de BF
- [ ] Calcular Taxa Metabólica Basal (TMB) automaticamente
- [ ] IA usar kcal e atividades aeróbicas ao gerar treino


## Melhorias Anamnese Nutricional e Medidas (v5.13)
- [x] Adicionar campo de consumo calórico (kcal/dia) na seção Nutrição
- [x] Adicionar seção de Atividades Aeróbicas/Cardio:
  - [x] Se faz cardio (sim/não)
  - [x] Lista de atividades (natação, hipismo, corrida, bike, etc.)
  - [x] Tempo por sessão
  - [x] Frequência semanal
- [x] Gênero já existia no cadastro do aluno - usado para cálculo correto de BF
- [x] Calcular Taxa Metabólica Basal (TMB) automaticamente (Fórmula Mifflin-St Jeor)
- [x] IA usar kcal e atividades aeróbicas ao gerar treino


## Correção Mobile Anamnese (v5.14)
- [x] Corrigir abas da anamnese encavaladas/sobrepostas na versão mobile
- [x] Adicionar scroll horizontal nas abas para telas pequenas


## Bug Persistência Anamnese (v5.15)
- [x] Corrigir campo de Consumo de kcal diário não sendo salvo/carregado (já estava funcionando)
- [x] Corrigir campos de Preferências de Treino não sendo salvos/carregados (adicionados weeklyFrequency, sessionDuration, trainingLocation, availableEquipment ao schema)


## Bug Fuso Horário Agendamento (v5.16)
- [x] Corrigir diferença de 3 horas no agendamento de sessões (UTC vs GMT-3) - usando Date.UTC para armazenar horário correto
- [x] Corrigir exibição do horário no modal de edição (mostrando 3 horas a menos) - usando getUTC* para formatar


## Otimização Mobile e PWA (v5.18)
- [x] Corrigir modal de Novo Agendamento sem scroll no mobile
- [x] Corrigir layout encavalado (Data/Hora e Duração sobrepostas) - layout responsivo grid-cols-1 sm:grid-cols-2
- [x] Adicionar suporte PWA para instalar como app no celular - manifest.json + ícones
- [x] Revisar todos os modais para garantir scroll no mobile


## Bug Horário Calendário (v5.19) - URGENTE
- [x] Corrigir exibição do horário no calendário mensal (mostrando 3h a menos) - usando formatTimeUTC helper
- [x] Horário correto no modal de edição mas errado na visualização do calendário - corrigido


## Layout Mobile e Gestão em Lote (v5.20)
- [x] Corrigir layout mobile da página de Agenda (card de sessão desalinhado)
- [x] Adicionar cancelar/excluir sessões em lote (Alunos > Sessões):
  - [x] Cancelar todas as sessões futuras
  - [x] Excluir todas as sessões futuras
  - [x] Pausar sessões por período (via filtro de datas)
  - [x] Cancelar/excluir por período específico
- [x] Adicionar cancelar/excluir cobranças em lote (Alunos > Pagamentos):
  - [x] Cancelar todas as cobranças pendentes
  - [x] Excluir todas as cobranças pendentes
  - [x] Cancelar/excluir por período específico


## Correções v5.21
- [ ] Corrigir ações em lote de sessões (cancelar/excluir não funcionando)
- [ ] Criar aba "Portal do Aluno" no menu lateral para personal visualizar área do aluno
- [ ] Permitir selecionar aluno e ver como está o portal dele


## Correções v5.22
- [ ] Adicionar opção "Cancelar Todas" e "Excluir Todas" sem necessidade de selecionar datas
- [ ] Criar aba Portal do Aluno no menu lateral para personal visualizar


## Filtro de Alunos no Calendário (v5.23)
- [x] Adicionar filtro de alunos na visualização mensal do calendário
- [x] Opção "Todos os alunos" como padrão
- [x] Ao selecionar um aluno, mostrar apenas as sessões dele


## Sessões no Menu Lateral (v5.24)
- [ ] Adicionar item "Sessões" na barra lateral esquerda
- [ ] Criar página de Sessões com lista de todas as sessões de todos os alunos
- [ ] Filtros por aluno, status e período
- [ ] Ações rápidas (editar, cancelar, marcar como realizada)


## Correções de Layout Mobile (v5.24)
- [x] Corrigir layout da Lixeira (cards de sessões cortados no mobile)
- [x] Corrigir layout do Modal de Excluir Sessões (campos de data sobrepostos)
- [x] Implementar restauração em massa de sessões na Lixeira (por aluno ou todas)
- [x] Corrigir erros TypeScript na página Sessions (markCompleted/markNoShow)

## Bug: Página Sessões 404 (v5.25)
- [x] Registrar rota /sessoes no App.tsx

## Correções Portal do Aluno (v5.26)
- [x] Pagamentos mostrando de outros alunos (filtrar apenas do aluno logado)
- [x] Botão "Ver Treino" não funciona (implementar visualização de treino)
- [ ] Próximas Sessões mostrando "Nenhuma sessão agendada" incorretamente
- [ ] Revisar UX completa do Portal do Aluno

## Página Sessões - Ações em Lote (v5.27)
- [x] Adicionar botões de ações em lote (Cancelar/Excluir sessões futuras)
- [x] Sincronizar funcionalidades com aba de sessões do perfil do aluno

## Agendamento em Lote Personalizado (v5.28)
- [x] Permitir configurar treinos diferentes por dia da semana (Seg=A, Qua=B, Sex=C)
- [x] Adicionar botão "Nova Sessão" na página Sessões
- [x] Criar componente NewSessionModal reutilizável para Agenda e Sessões
- [x] Manter funcionalidade idêntica em ambas as páginas

## Bug: Clique no Card de Sessão (v5.29)
- [x] Corrigir clique no card de sessão para abrir popup de detalhes (não portal do aluno)

## Melhoria: Seletor de Dia do Treino (v5.30)
- [x] Adicionar seletor de dia do treino (A, B, C) no agendamento em lote por dia da semana

## Bug: Layout Seletores de Treino (v5.31)
- [x] Corrigir layout dos seletores de treino no agendamento em lote (empilhar verticalmente no mobile)

## Bug: Popup de Calendário Duplicado (v5.32)
- [x] Remover popup de calendário que aparece ao editar sessão na página Sessões (corrigido com tabIndex e onFocus)

## Bug: Layout Horário/Duração Encavalado (v5.33)
- [x] Corrigir layout dos campos Horário e Duração no modal de edição de agendamento

## Bug: Layout Alterar Data/Horário Encavalado (v5.35)
- [x] Corrigir layout dos campos Alterar data e Alterar horário no modal de edição de sessão

## Bug: Excluir no Menu Abrindo Modal Geral (v5.36)
- [x] Corrigir botão Excluir no menu de 3 bolinhas para excluir apenas a sessão específica
- [x] Evitar abertura de dois modais ao mesmo tempo
- [x] Corrigir popup de horário que fecha muito rápido no modal de edição de sessão

## Confirmação de Sessões pelo Aluno no Portal (v5.38)
- [x] Endpoint para aluno confirmar sessão
- [x] Endpoint para aluno solicitar cancelamento/reagendamento
- [x] Interface de confirmação no Portal do Aluno
- [x] Botões Confirmar/Cancelar nas sessões pendentes
- [x] Modal para solicitar reagendamento com motivo
- [x] Notificação para personal quando aluno confirma sessão
- [x] Notificação para personal quando aluno cancela/solicita reagendamento

## Experiência do Aluno no Portal - 10 Melhorias (v5.39-v5.48)
- [x] 1. Preview de sessões antes do agendamento em lote
- [x] 2. Notificações automáticas de lembrete via WhatsApp 24h e 2h antes (já implementado)
- [ ] 3. Histórico de evolução visual + Anamnese editável + Cadastro de medidas pelo aluno (sincronizado com personal)
- [x] 4. Chat direto com o personal - mensagens dentro do portal
- [ ] 5. Gamificação - badges de conquistas (10 sessões seguidas, meta de peso atingida)
- [x] 6. Reagendamento inteligente - sugerir horários alternativos quando aluno cancela
- [x] 7. Feedback pós-sessão - aluno avaliar como se sentiu (energia, dor, satisfação)
- [x] 8. Lembretes de treino (hidratação, alimentação pré/pós, descanso) - dicas personalizadas baseadas no objetivo
- [x] 9. Compartilhamento de progresso - exportar cards de evolução para redes sociais
- [ ] 10. Modo offline - visualizar treinos mesmo sem internet (PWA)
- [x] Corrigir UX da página de detalhes do aluno - botões Editar/Convidar/Exportar cortados no mobile
- [x] Adicionar opção do personal bloquear/liberar edição de anamnese e medidas pelo aluno
- [x] Corrigir bug: excluir sessão abre calendário e modal de edição antes do modal de exclusão

## Bugs Reportados (v3.1)
- [x] Corrigir erro "Load failed" ao excluir sessão
- [x] Calendário abre automaticamente ao editar sessão (remover)
- [x] Remover opções em massa do menu de 3 pontinhos (Cancelar/Excluir sessões do aluno)
- [x] Melhorar UX da lista de treinos no mobile - substituir tabela por cards
- [x] Corrigir relatórios que mostram dados zerados incorretamente
- [x] Adicionar filtro por aluno nos relatórios
- [ ] Criar visualização somente leitura para Ver Detalhes de treino
- [ ] Implementar persistência de filtros na URL em Treinos


## Bugs Relatados (v5.39)
- [ ] Filtro por alunos não aparece na página de Relatórios
- [ ] Ver Detalhes e Editar de treinos abrem a mesma tela (precisa modo somente leitura)
- [ ] Filtros não são mantidos ao voltar da navegação de treinos
- [ ] Adicionar opção de editar nome do dia do treino (Treino A, B, C)
- [ ] Corrigir botão Ver Treino no portal do aluno (mostra toast em vez de abrir treino)
- [ ] Corrigir pagamentos pendentes no portal do aluno (mostrando cobranças de outro aluno)
- [ ] Corrigir layout encavalado do menu no Portal do Aluno real
- [ ] Implementar popup de completar cadastro/anamnese no Portal do Aluno
- [ ] Adicionar popup obrigatório até preencher anamnese completa
- [ ] Corrigir página Ver Treino no portal do aluno (tela em branco ao clicar)
- [ ] Permitir edição de anamnese quando perfil está incompleto (0%)

## Nova Feature: Acessos do Aluno
- [ ] Criar tabela student_permissions no banco de dados
- [ ] Criar endpoints para gerenciar permissões (get, update)
- [ ] Criar página "Acessos do Aluno" no menu lateral
- [ ] Adicionar filtro por aluno na página
- [ ] Implementar toggles para cada permissão
- [ ] Integrar verificação de permissões no portal do aluno


## Correções e Melhorias (v5.40)
- [x] Adicionar filtro por alunos na página de Relatórios (layout mobile corrigido)
- [x] Adicionar opção de editar nome do dia do treino (Treino A, B, C)
- [x] Criar página Ver Treino no portal do aluno (StudentWorkoutView)
- [x] Permitir edição de anamnese quando perfil está incompleto (0%)
- [x] Criar sistema de Acessos do Aluno com permissões configuráveis:
  - [x] Editar Anamnese
  - [x] Editar Medidas
  - [x] Enviar Fotos
  - [x] Ver Cobranças
  - [x] Agendar Sessões
  - [x] Cancelar Sessões
  - [x] Enviar Mensagens
  - [x] Ver Treinos
- [x] Página dedicada "Acessos do Aluno" no menu lateral
- [x] Filtro por aluno na página de acessos
- [x] Botão "Liberar Tudo" para cada aluno
- [x] Integração das permissões no portal do aluno (bloqueios funcionais)
- [x] Corrigir ordenação das sessões no portal do aluno (mostrar mais próximas primeiro)
- [x] Completar formulário de anamnese no portal do aluno com todos os campos do personal
- [x] Adicionar informações de treino nas próximas sessões do portal do aluno


## Diário de Treino do Maromba (v5.42) - GAME CHANGER
- [ ] Schema do banco de dados:
  - [ ] Tabela workout_logs (registro de treino por sessão)
  - [ ] Tabela workout_log_exercises (exercícios do registro)
  - [ ] Tabela workout_log_sets (séries com carga, reps, descanso, técnicas)
  - [ ] Tabela workout_log_suggestions (sugestões de ajuste do aluno)
- [ ] Endpoints de API:
  - [ ] CRUD de registros de treino
  - [ ] Listar registros por aluno
  - [ ] Estatísticas de evolução
  - [ ] Sistema de sugestões e aprovação
- [ ] Página Diário de Treino (Personal):
  - [ ] Filtro por aluno
  - [ ] Lista de registros de treino
  - [ ] Formulário de registro com exercícios e séries
  - [ ] Até 6 séries por exercício (aquecimento + reconhecimento + 3 válidas + extra)
  - [ ] Campos: Carga (kg), Repetições, Descanso (s)
  - [ ] Técnicas: Drop Set, Rest-Pause com carga/rep extras
  - [ ] Observações/Anotações por exercício
  - [ ] Checkbox de concluído
- [ ] Dashboard de Evolução:
  - [ ] Evolução de carga por exercício
  - [ ] Total de séries e repetições por treino/semana/mês
  - [ ] Volume total (carga × reps × séries)
  - [ ] Gráficos de progressão
  - [ ] Filtro por aluno
- [ ] Portal do Aluno:
  - [ ] Visualização do diário de treino
  - [ ] Sugerir ajustes nos registros
  - [ ] Histórico de evolução pessoal
- [ ] Sistema de Aprovação:
  - [ ] Aluno sugere ajuste
  - [ ] Personal recebe notificação
  - [ ] Personal aprova ou rejeita


## Bugs Críticos v4.3
- [x] Corrigir duplicação de medidas no Portal do Aluno e no painel do Personal (limpeza de dados + proteção contra duplicação)
- [x] Remover card de Hidratação do Dia do Portal do Aluno
- [x] Remover dica de Hidratação das Dicas para seu Treino

## Melhorias Compartilhar Progresso v4.4
- [ ] Criar componente de compartilhamento contextual (adapta ao contexto da página)
- [ ] Compartilhamento de Medidas: mostrar evolução de peso, % gordura, medidas corporais
- [ ] Compartilhamento de Sessões: mostrar total de treinos, sequência, frequência
- [ ] Compartilhamento de Evolução: mostrar comparativo antes/depois, progresso visual
- [ ] Adicionar botão de compartilhar no Dashboard do Personal (por aluno)
- [ ] Remover card genérico atual do Portal do Aluno

## Bugs Chat v4.5
- [x] Mensagens do chat do aluno não aparecem para o Personal
- [x] Botão Atualizar na página de Mensagens não funciona (removido, agora atualiza automaticamente)
- [x] Criar seção de Chat com Alunos separada da página de Mensagens WhatsApp

## Melhorias Sistema de Mensagens v4.6
- [x] Adicionar abas na página de Mensagens: Chat FitPrime e WhatsApp
- [x] Criar interface de chat do Personal com alunos
- [x] Adicionar badge de notificação no menu lateral com mensagens não lidas
- [x] Mostrar lista de conversas com alunos no Chat FitPrime

## Bugs Graves v4.7
- [ ] Aluno sendo redirecionado para cadastro de Personal ao acessar Portal do Aluno
- [ ] Login com Google/Microsoft/Apple cria área de Personal para o aluno (deveria usar login de aluno)

## Melhorias Medidas v4.8
- [ ] Adicionar botão de editar medida no histórico
- [ ] Adicionar botão de excluir medida no histórico (soft delete - vai para lixeira)
- [ ] Implementar soft delete para medidas (campo deletedAt)
- [ ] Adicionar medidas na página de lixeira para restauração


## Tarefas Prioritárias v4.9 (29/12/2025)

### Bug Crítico: Autenticação Portal do Aluno
- [x] Corrigir redirecionamento /portal → /meu-portal (aluno não deve ir para OAuth do Personal) - VERIFICADO: já está correto

### Lixeira de Medidas
- [x] Adicionar campo deletedAt na tabela measurements (já existia)
- [x] Criar endpoint measurements.listDeleted (já existia)
- [x] Criar endpoint measurements.restore (já existia)
- [x] Criar endpoint measurements.permanentDelete (já existia)
- [x] Adicionar botão editar medida no histórico
- [x] Adicionar botão excluir medida no histórico (soft delete)
- [x] Adicionar aba "Medidas" na página de Lixeira

### Diário do Maromba - Versão Inteligente
- [x] Listar sessões/agendamentos do aluno empilhados na tela principal (aba Sessões)
- [x] Ao clicar em sessão, abrir popup para preencher treino
- [x] Puxar exercícios do treino vinculado à sessão automaticamente
- [x] Campos por exercício: até 6 séries (aquecimento + válidas + extra)
- [x] Cada série: Carga (kg), Repetições, Descanso (s)
- [x] Técnicas avançadas: Drop Set (carga/reps extras), Rest-Pause (carga/reps extras)
- [x] Observações por exercício
- [x] Checkbox de concluído por série
- [x] Dashboard de evolução de carga por exercício (já existia)
- [x] Filtro por aluno no dashboard (já existia)
- [ ] Sistema de sugestões do aluno com aprovação do personal (pendente)


## Novas Funcionalidades v5.0 (29/12/2025)

### Sistema de Sugestões do Aluno
- [x] Criar tabela workout_suggestions no banco de dados (workoutLogSuggestions já existia)
- [x] Campos: studentId, workoutId, exerciseId, suggestionType, details, status, createdAt
- [x] Criar endpoints: createSuggestion (studentPortal), listSuggestions, approveSuggestion, rejectSuggestion (trainingDiary)
- [x] Interface no Portal do Aluno para criar sugestões (StudentWorkoutView com botão Sugerir)
- [x] Interface na página Alterações Pendentes para personal aprovar/rejeitar (aba Sugestões de Treino)
- [ ] Notificação para personal quando aluno cria sugestão (pendente)
- [ ] Aplicar alteração no treino quando aprovada (pendente)

### Histórico de Evolução de Carga
- [x] Criar gráfico de progressão de peso por exercício
- [x] Filtro por aluno e exercício
- [x] Mostrar evolução ao longo do tempo
- [x] Integrar na aba Dashboard do Diário de Treino
- [x] Mostrar recordes pessoais, média, total de treinos e reps

### Cobranças Agrupadas por Aluno
- [x] Já implementado - página de cobranças mostra agrupamento por aluno


### Melhorias Diário de Treino - Layout (29/12/2025)
- [ ] Remover checkbox "Concluído" do canto direito de cada série
- [ ] Reorganizar Drop Set e Rest-Pause para expandir área abaixo com campos extras
- [ ] Adicionar botão "+ Adicionar Série" dentro da área expandida de Drop/Rest-Pause
- [ ] Melhorar layout para evitar rolagem horizontal (layout compacto/empilhado)


### Bug: Erro ao salvar registro de treino (29/12/2025)
- [x] Corrigir erro "Failed query: insert into workout_logs" - valores default sendo enviados incorretamente
- [x] Adicionar campo sessionDate na inserção SQL


### Diário de Treino no Portal do Aluno (30/12/2025)
- [x] Adicionar aba "Diário" no Portal do Aluno (PWA mobile)
- [ ] Implementar interface de registro de treino no Portal do Aluno
- [ ] Permitir aluno registrar treinos e preencher "Como se sentiu?"
- [x] No lado do Personal: trocado "Como se sentiu?" para "Como o aluno estava?"


## Melhorias v5.1 (30/12/2025)

### Diário de Treino no Portal do Aluno
- [x] Implementar interface completa de registro de treino na aba "Diário"
- [x] Listar sessões do aluno (hoje, próximas, pendentes)
- [x] Ao clicar em sessão, abrir popup para preencher treino
- [x] Puxar exercícios do treino vinculado à sessão
- [x] Campos: séries, carga, reps, observações
- [x] Campo "Como se sentiu?" para o aluno preencher
- [x] Salvar registro de treino pelo aluno
- [x] Histórico de treinos registrados

### Notificações de Sugestões
- [x] Enviar notificação ao personal quando aluno criar sugestão de alteração no treino (já implementado)
- [x] Incluir nome do aluno, exercício e tipo de sugestão na notificação
- [x] Notificação via sistema interno (notifyOwner)

### Aplicar Alterações Aprovadas
- [x] Quando personal aprovar sugestão de carga, atualizar carga no treino
- [x] Quando personal aprovar sugestão de reps, atualizar repetições no treino
- [x] Quando personal aprovar troca de exercício, substituir exercício no treino
- [x] Registrar histórico da alteração aplicada (pendingChanges.status = 'approved')


## Bugs Diário de Treino do Maromba (v5.1)
- [x] Bug: Registro de treino não calcula Volume, Séries, Reps, Duração (corrigido - conta séries com peso E reps)
- [ ] Bug: Dashboard do Diário tem dois seletores de aluno (o segundo é específico para Evolução de Carga)
- [x] UX: Trocar unidade de Volume de toneladas (t) para quilos (kg)
- [ ] UX: Melhorar layout do popup de detalhes do registro (cortando e encavalando)
- [x] UX: Remover checkbox de concluído das séries no registro de treino
- [x] UX: Drop Set e Rest-Pause como opção no tipo de série (não checkbox separado)
- [x] UX: Ao selecionar Drop Set ou Rest-Pause, expandir campos inline para carga/reps/descanso extras
- [x] Bug: Cálculo de estatísticas agora conta séries com peso E reps preenchidos
- [x] UX: Trocar exibição de toneladas para kg no Dashboard

- [x] Bug: Aba Registros não mostra registros quando "Todos os alunos" está selecionado
- [x] Bug: Recalculadas estatísticas dos registros existentes no banco

## Melhorias UX Registro de Treino (v5.2)
- [ ] UX: Drop Set com múltiplos drops (drop 1, drop 2, drop 3...) + botão "+ Adicionar Drop"
- [ ] UX: Rest-Pause com múltiplas pausas/continuações + botão "+ Adicionar Pausa"
- [ ] UX: Campo de descanso dentro da área expandida do Drop Set e Rest-Pause

## CHECKLIST COMPLETO - Diário de Treino do Maromba

### FEITO:
- [x] Remover checkbox de concluído das séries
- [x] Drop Set e Rest-Pause como tipo de série (não checkbox separado)
- [x] Cálculo de estatísticas (conta séries com peso E reps preenchidos)
- [x] Trocar toneladas para kg no Dashboard
- [x] Registros aparecem quando "Todos os alunos" está selecionado
- [x] Remover campo "Duração" do popup de detalhes
- [x] Remover seletor duplicado de aluno no Dashboard (Evolução de Carga usa filtro global)
- [x] Layout de visualização das séries mais elegante

### FALTA FAZER:
- [x] Drop Set com múltiplos drops - Botão "+ Adicionar Drop"
- [x] Rest-Pause com múltiplas pausas - Botão "+ Adicionar Pausa"
- [x] Campo de descanso no Drop Set e Rest-Pause

## Bugs da Agenda
- [ ] UX: Modal de edição de agendamento está encavalado/cortado - precisa ajustar layout

## Bugs do Registro de Treino
- [ ] Bug: Ao selecionar "Reconhecimento" no tipo de série, muda automaticamente para "Série Válida" - verificar se outras opções também têm esse problema

## Bugs Evolução de Carga por Exercício
- [x] Adicionar opção "Todos os alunos" para mostrar evolução de todos (sem duplicação)
- [x] Gráfico não aparece - campo não está finalizado, não mostra dados
- [x] Seletor de aluno removido (usa o filtro global do header)

## Dashboard por Grupo Muscular (Análise Detalhada)
- [ ] Segmentar dados do treino por grupo muscular para análise de equilíbrio
- [ ] Grupos: Peito (inclinado/reto/declinado), Costas (porções), Quadríceps, Panturrilha, Posterior, Trapézio, Ombros (lateral/frontal/posterior), Glúteos, Bíceps, Tríceps, Antebraço, Abdômen
- [ ] Mostrar volume, séries e frequência por grupo muscular
- [ ] Identificar desequilíbrios para ajustar o treino

## Melhorias UX Gerais (Experiência Profissional)
- [ ] Modal Agenda: Melhorar espaçamentos e hierarquia visual
- [ ] Modal Agenda: Organização mais limpa das seções
- [ ] Modal Registro de Treino: Layout profissional e limpo
- [ ] Consistência visual entre todos os modais
- [ ] Garantir responsividade em diferentes tamanhos de tela

## Bugs PWA (Mobile)
- [x] Bug: No PWA, ao clicar na sessão do Diário de Treino, o calendário abre automaticamente - corrigido com campo de data customizado

## Bug Layout Agenda
- [x] Bug: Seção "Treino da Sessão" no modal da Agenda - layout corrigido para vertical


## Bugs Diário de Treino (v5.14)
- [ ] Bug: Popup de detalhes vazio ao clicar em sessão concluída na aba "Sessões" (funciona na aba "Registros")
- [x] Dashboard por Grupo Muscular implementado com gráfico de barras e resumo
- [x] Remover campo "Duração Média" do Dashboard
- [x] Layout da seção "Treino da Sessão" na Agenda corrigido para vertical
- [x] Calendário não abre automaticamente no PWA ao clicar em sessão


## Correções e Melhorias Diário de Treino (v5.43)
- [x] Bug crítico: Sessões concluídas na aba "Sessões" abrem popup vazio (precisa abrir modal de detalhes, não de registro) - CORRIGIDO (verifica workoutLogId antes de abrir modal)
- [x] Evolução de Carga: Ao clicar em um dia no gráfico, mostrar tabela detalhada abaixo com todas as séries (número, tipo, carga, reps, descanso) - IMPLEMENTADO
- [ ] Drop Set com múltiplos drops - Botão "+ Adicionar Drop"
- [ ] Rest-Pause com múltiplas pausas - Botão "+ Adicionar Pausa"
- [ ] Campo de descanso no Drop Set e Rest-Pause
- [ ] Melhorar UX geral do popup de detalhes de registro
- [ ] Verificar bug do tipo "Reconhecimento" mudando para "Série Válida"
- [x] Bug: Sessões concluídas não carregam dados já registrados (sessionId agora é salvo no workout_log)
- [ ] Adicionar campo de descanso específico para Drop Set e Rest-Pause no registro de treino


## Melhorias Evolução de Carga por Exercício (v5.44)
- [x] Histórico Detalhado: deixar óbvio que os itens são clicáveis (chevron + texto "Clique para expandir")
- [x] Redesenhar seção para escalar com 3+ meses de dados (lista expansível ao invés de gráfico de barras)
- [x] Cada item do histórico mostra todas as séries detalhadas ao expandir
- [x] Adicionar filtro por período (última semana, último mês, últimos 3 meses, todo período)
- [x] Gráfico de linha para visualização rápida da tendência de carga máxima


## Sistema de Chat Completo (v5.45)
- [x] Corrigir envio de mensagens de texto (campo de input não aparece no PWA)
- [x] Interface de gravação de áudio implementada (upload S3 pendente)
- [x] Interface de envio de fotos implementada (upload S3 pendente)
- [x] Interface de envio de vídeos implementada (upload S3 pendente)
- [x] Interface de envio de arquivos implementada (upload S3 pendente)
- [x] Renderização de mensagens de áudio com player
- [x] Renderização de mensagens de imagem com preview
- [x] Renderização de mensagens de vídeo com player
- [x] Renderização de mensagens de arquivo com download
- [x] Renderização de links com preview
- [x] Indicador de mensagem lida (CheckCheck)
- [x] Indicador de mensagem editada
- [x] Suporte a mensagens deletadas
- [ ] Upload real para S3 (backend)
- [ ] Transcrição automática de áudio para texto
- [ ] Editar mensagem enviada
- [ ] Excluir mensagem "para mim"
- [ ] Excluir mensagem "para todos"
- [ ] Mensagem em massa (broadcast)


## UX Área do Aluno (v5.46)
- [x] Igualar UX de registrar treino do aluno com a do personal (completa)
- [x] Adicionar seletor de tipo de série (Aquecimento, Reconhecimento, Série Válida, Drop Set, Rest-Pause)
- [x] Adicionar campo de descanso entre séries
- [x] Adicionar campos extras para Drop Set e Rest-Pause
- [x] Interface mais completa e profissional igual ao personal
- [x] Barra de progresso do treino
- [x] Exercícios expansíveis/colapsíveis

## UX Portal do Aluno - Anamnese (v5.47)
- [x] Melhorar UX da anamnese no portal do aluno (está muito simples)
- [x] Deixar mais parecido com a UX do personal (visual mais profissional)
- [x] Cards de resumo coloridos (Objetivo, Experiência, Frequência, Duração)
- [x] Seções organizadas em cards (Dados Pessoais, Objetivos, Saúde, Preferências)
- [x] Badges coloridos para nível de estresse
- [x] Seção de Nutrição com métricas visuais
- [x] Seção de Ênfases e Restrições com badges
- [ ] Melhorar layout dos campos e seções
- [ ] Adicionar ícones e visual mais atraente
- [ ] Melhorar espaçamento e organização dos grupos de campos


## Bugs Portal do Aluno - Anamnese (v5.47)
- [ ] Bug: Erro de validação no campo trainingLocation ao salvar anamnese (invalid_value)
- [ ] UX: Adicionar botões Salvar e Cancelar no final do formulário de anamnese (não só no topo)

## Bugs Portal do Aluno - Sugestões (v5.48)
- [ ] Bug: Erro "Treino não encontrado" ao enviar sugestão de alteração no treino


## Bugs Portal do Aluno - Cobranças (v5.49)
- [x] Bug: Cobranças na área do aluno estão diferentes/erradas comparadas com a área do personal
- [x] Comparar e alinhar dados de cobranças entre portal do aluno e área do personal

## Bugs Portal do Aluno - Histórico de Medidas (v5.50)
- [x] Bug: Ao clicar em "Histórico de Medidas" abre popup de calendário automaticamente (precisa remover esse comportamento)
- [x] Bug: Modal de "Editar Medição" não permite rolar para baixo (campos ficam escondidos)

## Bugs Portal do Aluno - Reagendamento (v5.51)
- [x] Bug: Reagendar sessão mostra "Nenhum horário disponível nos próximos 14 dias" (verificar busca de horários disponíveis)

## Bugs Agenda - Detalhes do Treino (v5.52)
- [x] Bug: Detalhes do treino não aparecem em todos os agendamentos no modal de edição (alguns mostram treino e dia, outros ficam vazios)

## Melhorias UX Modal de Sessão (v5.53)
- [x] UX: Adicionar botão X para fechar o modal de detalhes da sessão (atualmente precisa clicar fora para fechar)
- [x] Bug: Treino vinculado não aparece no modal de edição mesmo em agendamentos futuros que têm treino associado
- [x] Melhoria: Seção de treino sempre visível com mensagem quando não há treinos cadastrados


## Próximos Passos Chat (v5.55)
- [x] Implementar upload real de mídia para S3 no chat (backend)
- [x] Atualizar frontend do chat para usar upload S3
- [x] Implementar edição de mensagens no chat
- [x] Implementar exclusão de mensagens "para mim"
- [x] Implementar exclusão de mensagens "para todos"
- [x] Investigar bug de treinos não aparecendo em alguns agendamentos
  - Causa: Sessões não têm workoutId/workoutDayIndex salvos no banco
  - Solução: O personal precisa vincular o treino ao criar/editar a sessão
  - O modal de edição já permite vincular treinos quando existem treinos cadastrados

## Bug Crítico - Anamnese Portal do Aluno (v5.56)
- [x] PRIORIDADE: Erro ao salvar anamnese no portal do aluno - corrigido valor inválido 'early_morning' para preferredTime
- [x] Valores de preferredTime agora são: morning, afternoon, evening, flexible (conforme schema)


## Próximos Passos v5.58
- [ ] Vincular treinos automaticamente nas sessões recorrentes
- [ ] Implementar transcrição automática de áudio para texto no chat
- [ ] Adicionar funcionalidade de mensagem em massa (broadcast)


## Bugs Críticos v5.59
- [x] Separar grupos musculares detalhados na análise:
  - Peito: Superior (inclinado), Médio (reto), Inferior (declinado)
  - Ombros: Lateral, Frontal, Posterior
  - Costas: Dorsais, Trapézio, Romboides, Lombar
  - Pernas: Quadríceps, Glúteos, Posteriores, Panturrilha, Adutores
- [x] Atualizar seletor de grupos musculares no cadastro de exercícios (organizado por região)
- [x] Corrigir chat do PWA travado (altura dinâmica para mobile)


## Análise por IA v5.61
- [x] Criar endpoint de análise por IA no backend (workoutLogs.aiAnalysis)
- [x] Analisar anamnese do aluno (objetivos, restrições, histórico)
- [x] Analisar evolução das medidas corporais
- [x] Analisar distribuição de grupos musculares (identificar desequilíbrios)
- [x] Analisar progressão de carga do Diário do Maromba
- [x] Analisar frequência e consistência de treino
- [x] Analisar sentimento/feedback nos treinos
- [x] Gerar recomendações personalizadas
- [ ] Implementar botão e modal de análise na interface do personal


## Bug Crítico - Chat Personal v5.62
- [x] PRIORIDADE: Chat do personal não permite rolar mensagens nem enviar novas
- [x] Corrigir altura e scroll da área de mensagens
- [x] Verificar se o input de mensagem está visível e funcional


## Bug Grupos Musculares Duplicados v5.64
- [x] Corrigir duplicação de Quadríceps e Glúteos na análise (mesmo exercício contando 2x)
- [x] Remover mapeamento automático de "Pernas" para múltiplos grupos
- [x] Adicionar grupos compostos como opção:
  - Quadríceps + Glúteos (Agachamento, Leg Press)
  - Glúteos + Posteriores (Stiff, Levantamento Terra)
  - Peito + Tríceps (Supino, Flexões)
  - Costas + Bíceps (Remadas, Pulldown)
  - Ombros + Tríceps (Desenvolvimento)


## Bug Crítico - Autenticação Portal do Aluno v5.65
- [x] PRIORIDADE: Aluno é deslogado automaticamente após 2-3 segundos
- [x] Aluno é redirecionado para login do Manus (OAuth) ao invés de manter sessão do portal
- [x] Corrigido: main.tsx agora ignora redirecionamento OAuth quando está no portal do aluno


## Bug Anamnese Portal do Aluno v5.66
- [x] Erro "Please login (10001)" ao salvar anamnese no portal do aluno
- [x] Endpoint está usando protectedProcedure (OAuth) ao invés de studentProcedure
- [x] CORRIGIDO: Criado endpoint studentPortal.saveWithMeasurements com studentProcedure
- [x] StudentOnboarding.tsx atualizado para usar o novo endpoint


## Bug Anamnese Portal do Aluno v5.68
- [x] Bug: Erro "Please login (10001)" ao salvar anamnese na página de anamnese do portal (não apenas onboarding)
- [x] Identificar qual componente está usando endpoint errado (StudentPortalPage.tsx)
- [x] Corrigir para usar studentPortal.saveWithMeasurements
- [x] Implementar persistência de dados no localStorage para não perder ao atualizar página
- [x] Restaurar dados do localStorage ao carregar a página
- [x] Limpar localStorage após salvar com sucesso


## Bugs Críticos v5.70 - Reportados pelo Usuário

### B1. Bug: Link de convite não copia para área de transferência
- [ ] Ao clicar em "Convidar" aparece "Link copiado" mas não copia de verdade
- [ ] Aluno não recebe o convite porque o link não foi copiado
- [ ] Verificar e corrigir a função de copiar para clipboard

### B2. Melhoria CRÍTICA: Redesign completo do Chat/Mensagens
- [ ] UX atual está muito ruim, "experiência ridícula"
- [ ] Campo de rolagem não funciona (página e mensagens)
- [ ] Criar layout estilo Instagram Direct / Messenger / iMessage
- [ ] Usar paleta de cores do FitPrime
- [ ] UX avançada de elite para personal E aluno
- [ ] Tela cheia, scroll funcionando perfeitamente

### B3. Melhoria: Portal do Aluno - Adicionar barra lateral
- [ ] Atualmente tudo centralizado em uma única tela
- [ ] Criar barra lateral igual do personal
- [ ] Facilitar navegação do aluno

### B4. Bug: Gravação de áudio não funciona
- [ ] Grava mas dá erro ao enviar
- [ ] Não tem opção de pausar (fica gravando eternamente)
- [ ] Ao clicar no X para, mas não envia
- [ ] Corrigir fluxo completo de gravação e envio

### B5. Bug: Upload de arquivos não funciona
- [ ] Campos de envio de arquivos, docs, fotos, vídeos desabilitados
- [ ] Não consegue fazer upload e enviar nada
- [ ] Habilitar e corrigir upload de mídia

### B6. Bug: Campos de bioimpedância e adipometria sumiram
- [ ] Verificar se campos de upload de bioimpedância existem
- [ ] Verificar se campos de adipometria existem
- [ ] Verificar tanto no lado do personal quanto no portal do aluno
- [ ] Restaurar se estiverem faltando


## Correções Série D (Dezembro 2024)

### D6. Bug: Login do aluno não funciona
- [x] Aluno brunogiordany@gmail.com não consegue logar
- [x] Erro "Email não encontrado" mesmo com usuário existente no banco
- [x] Atualizada senha para "Br896469"

### D7. Melhoria: Filtrar aba "Sessões" no Diário de Treino
- [x] Aba "Sessões" deve mostrar apenas sessões NÃO preenchidas
- [x] Sessões já concluídas/preenchidas aparecem em "Registros Maromba"
- [x] Evitar duplicação de informações entre as abas

### D8. Bug: Vincular dados do personal ao portal do aluno
- [ ] Portal do aluno não está conectado aos dados do personal
- [ ] Precisa puxar dados pelo email do aluno para fazer conexão
- [ ] Garantir que treinos, sessões, cobranças do personal apareçam no portal do aluno

### D9. Bug: Ícone/Favicon do navegador foi alterado
- [x] O ícone personalizado do FitPrime está configurado corretamente
- [x] Favicon e ícones PWA verificados - problema pode ser cache do navegador


### D10. Melhoria: Remover navegação duplicada no portal do aluno
- [x] Portal do aluno tem abas centrais E barra lateral (duplicado) - REMOVIDO TabsList
- [x] Manter apenas a barra lateral (igual ao portal do personal)
- [x] Remover as abas do centro da tela

### D11. Melhoria: Criar aba de Anamnese na barra lateral do portal do aluno
- [x] Adicionar item "Anamnese" no menu lateral do portal do aluno (renomeado de "Perfil")
- [x] Permitir acesso direto à anamnese (não apenas via "Completar Cadastro")
- [x] Manter botão "Completar Cadastro" até anamnese estar completa

### D12. Melhoria: Esconder botão "Completar Cadastro" quando anamnese estiver completa
- [x] Verificar se anamnese tem todas as medidas corporais preenchidas
- [x] Se completa, esconder o botão "Completar Cadastro"
- [x] Se incompleta, manter o botão visível

### D13. Bug: Email de recuperação de senha não é enviado
- [x] Ao clicar em "Esqueci a senha" no portal do aluno, o código não chega no email
- [x] Verificar se o endpoint de envio de email está funcionando - FUNCIONA
- [ ] **PENDENTE**: Verificar domínio no Resend para enviar emails para outros destinatários
- [ ] Resend só permite enviar para brunogiordany@gmail.com sem domínio verificado
- [ ] Verificar se o Resend está configurado corretamente
- [ ] Garantir que o email seja enviado com o código de verificação

#### D14. Melhoria: Diário de Treino completo no portal do aluno
**Fase 1 - Registro Manual e Histórico:**
- [x] D14.1a - Adicionar botão "Criar Registro Manual" no Diário
- [x] D14.1b - Formulário para criar treino sem sessão vinculada
- [x] D14.1c - Melhorar visualização do histórico de treinos
- [x] D14.1d - Mostrar detalhes dos exercícios no histórico

**Fase 2 - Dashboard e Relatórios:**
- [x] D14.2a - Dashboard com estatísticas (total treinos, frequência, etc)
- [x] D14.2b - Gráfico de evolução de carga por exercício (simplificado no dashboard)
- [x] D14.2c - Gráfico de frequência de treinos (barras por semana)
- [ ] D14.2d - Resumo semanal/mensal

**Fase 3 - Edição e Funcionalidades Avançadas:**
- [ ] D14.3a - Editar registros de treino existentes
- [ ] D14.3b - Excluir registros de treino
- [ ] D14.3c - Duplicar treino anterior
- [ ] D14.3d - Filtros e busca no históricoo)

### D15. Feature: Modelo de vendas B2C e B2B
- [ ] B2B (atual): Personal cadastra aluno e envia convite pelo link
- [ ] B2C (novo): Aluno paga R$34,90/mês diretamente e recebe acesso
- [ ] Criar página de checkout para aluno B2C
- [ ] Integrar pagamento Stripe para assinatura B2C
- [ ] Criar fluxo de onboarding para aluno B2C (sem personal vinculado)
- [ ] Diferenciar alunos B2B (vinculados a personal) e B2C (independentes)
- [ ] Portal do aluno B2C deve ter acesso completo ao Diário de Treino

### D16. Feature: Configurar domínio personalizado fitprimemanager.com
- [x] Domínio comprado e funcionando: https://fitprimemanager.com
- [x] Configurar DNS para apontar para o servidor Manus (feito automaticamente pelo Manus)
- [x] Configurar SSL/HTTPS (feito automaticamente pelo Manus)
- [x] Todas as páginas funcionando no domínio:
  - [x] Landing page inicial
  - [x] Portal do personal (login e dashboard)
  - [x] Portal do aluno (login e dashboard)
  - [x] Todas as rotas existentes
- [x] Links internos funcionando automaticamente
- [ ] **PENDENTE**: Configurar registros DNS do Resend para envio de emails
  - [ ] Precisa acessar painel de DNS (contatar suporte Manus ou usar Cloudflare)
  - [ ] Adicionar registros DKIM, SPF, DMARC do Resend


### D17. Bug: Correções de SEO na página inicial (/)
- [ ] Adicionar palavras-chave relevantes na página
- [ ] Adicionar título H1 na página inicial
- [ ] Adicionar títulos H2 nas seções
- [ ] Corrigir título da página (atual: 16 caracteres, ideal: 30-60 caracteres)
- [ ] Usar document.title para definir título adequado



### D18. Bug: Corrigir erro RangeError: Invalid time value na página de Evolução do portal do aluno
- [x] Corrigido uso incorreto de session.date para session.scheduledAt em múltiplos componentes
- [x] StudentEvolutionCharts - adicionada validação robusta de datas com parseDate()
- [x] StudentPortalPage - corrigido filtro de upcomingSessions
- [x] StudentSessionManager - corrigida interface Session e todas as referências
- [x] StudentMetricsCards - corrigida interface nextSession para aceitar scheduledAt
- [x] Checkpoint salvo com correções (versão 1a50cd91)
- [ ] **PENDENTE**: Publicar novo checkpoint para aplicar correções em produção


### D19. Bug: Campos de bioimpedância/adipometria sumiram do portal do aluno
- [x] Verificar se campos existem no schema do banco de dados (existem)
- [x] Verificar se campos existem na interface do personal (existem em Measurements.tsx)
- [x] Verificar se campos existem no portal do aluno (NÃO existiam em StudentMeasurementForm.tsx)
- [x] Adicionar campos de bioimpedância na interface Measurement do portal do aluno
- [x] Adicionar campos de adipometria e dobras cutâneas na interface Measurement
- [x] Atualizar formData inicial com os novos campos
- [x] Atualizar função resetForm com os novos campos
- [x] Atualizar função handleEdit para carregar os novos campos
- [x] Atualizar função handleSubmit para enviar os novos campos
- [x] Adicionar seções de Bioimpedância e Adipômetro no formulário (Accordion)
- [x] Atualizar endpoint addMeasurement no backend com os novos campos
- [x] Atualizar endpoint updateMeasurement no backend com os novos campos


### D20. Feature: Sistema Completo de Análise por IA

---

#### FASE 1: Upload de Bioimpedância (PDF/Foto)
- [x] 1.1 Adicionar campo de upload na seção Bioimpedância (portal aluno)
- [x] 1.2 Limite de tamanho: 5MB fotos, 10MB PDFs
- [x] 1.3 Criar endpoint de upload com armazenamento no S3
- [x] 1.4 IA analisa documento e extrai dados automáticos
- [x] 1.5 Preencher campos de bioimpedância com valores extraídos
- [x] 1.6 Salvar arquivo original para referência futura
- [ ] 1.7 Adicionar campo de upload na seção Bioimpedância (personal)

#### FASE 2: Análise de Fotos de Evolução
- [x] 2.1 IA analisa fotos de antes/depois do aluno
- [x] 2.2 Comparação visual de progressão corporal
- [x] 2.3 Gera insights sobre mudanças físicas visíveis
- [x] 2.4 Identifica áreas de melhoria e pontos fortes

#### FASE 3: Análise Completa do Aluno (Cruzamento de Dados)
- [x] 3.1 Endpoint que cruza TODOS os dados:
  - [x] Bioimpedância (PDF/foto)
  - [x] Fotos de evolução (antes/depois)
  - [x] Anamnese completa
  - [x] Histórico de medidas corporais
  - [x] Diário de treino (se treinou, analisa; se não, ignora)
- [x] 3.2 Gera relatório completo com insights
- [x] 3.3 Identifica déficits e pontos fortes
- [x] 3.4 Sugere ajustes no treino baseado na análise

#### FASE 4: Geração de Treino Personalizado com IA
- [x] 4.1 IA usa todos os dados para personalizar treinos
- [x] 4.2 Considera limitações físicas da anamnese
- [x] 4.3 Adapta carga baseado na evolução do diário
- [x] 4.4 Considera composição corporal da bioimpedância
- [x] 4.5 Foca nos grupos musculares em déficit

#### FASE 5: Treino 2.0 - Ciclo de Melhoria Contínua
- [x] 5.1 Endpoint "generateAdaptedWorkout" para gerar treino adaptado
- [x] 5.2 IA identifica déficits (grupos que não evoluíram)
- [x] 5.3 IA compara medidas antes vs depois
- [x] 5.4 IA analisa desempenho no diário (cargas, frequência)
- [x] 5.5 Gera Treino 2.0 focando nos pontos fracos
- [x] 5.6 Personal pode aprovar, editar ou regenerar (usa saveAIGenerated)
- [x] 5.7 Treinos acumulam (1.0, 2.0, 3.0...) - nunca substituem
- [x] 5.8 Aluno pode escolher qual treino seguir
- [ ] 5.9 Botão "Gerar Novo Treino Adaptado" na interface do personal

#### FASE 6: Comparação de Eficiência (Feedback Loop)
- [x] 6.1 Endpoint "compareWorkoutEfficiency" para comparar treinos
- [x] 6.2 Métricas de comparação:
  - [x] Sessões realizadas
  - [x] Duração média
  - [x] Consistência
- [x] 6.3 Gera insight: "Treino 2 foi X% mais eficiente"
- [x] 6.4 Identifica o que funcionou e o que não funcionou
- [x] 6.5 Usa aprendizado para gerar Treino 3 ainda melhor
- [ ] 6.6 Interface para comparar treinos e ver gráficos

#### FASE 7: Interface e Visualização
- [x] 7.1 Botão "Gerar Treino Adaptado (2.0)" na página de Treinos
- [x] 7.2 Preview do treino adaptado com informações de adaptação
- [x] 7.3 Exibição de déficits abordados e melhorias
- [x] 7.4 Exibição de evolução das medidas e desempenho
- [x] 7.5 Upload de bioimpedância na área do personal (Measurements)
- [x] 7.6 Modal de Análise Completa do Aluno para o personal
- [x] 7.7 Comparação visual lado a lado entre treinos
- [x] 7.8 Relatório exportação PDF com análise da IA
- [x] 7.9 Notificações automáticas de 30 dias para nova análise
- [x] 7.10 Dashboard de evolução de eficiência dos treinos ao longo do tempo

---

**JORNADA DO CLIENTE:**
1. Aluno cadastra → Preenche anamnese → Upload bioimpedância (opcional)
2. Personal gera Treino 1.0 com IA (baseado em tudo)
3. 30 dias depois: Aluno atualiza medidas + fotos
4. Personal clica "Analisar Evolução" → IA cruza tudo
5. Personal clica "Gerar Treino Adaptado" → Treino 2.0
6. 30 dias depois: IA compara eficiência Treino 2 vs 1
7. Ciclo continua: Treino 3.0, 4.0... sempre melhorando


### D21. Bug: Adicionar Ações em Lote na página de Sessões do menu lateral
- [x] Adicionar botão "Ações em Lote" na página Sessions.tsx (menu lateral)
- [x] Implementar funcionalidade igual à página de Sessões do perfil do aluno
- [x] Melhorar UX: mover botão para junto do título "Sessões do Mês"


## Correções de UX (v3.8)
- [x] Corrigir layout da anamnese no portal do aluno (cards com cores e espaçamento)
- [x] Adicionar botão de editar no histórico de treinos do portal do aluno
- [x] Criar mutation updateWorkoutLog para alunos editarem seus registros
- [x] Modal de edição de registro de treino com exercícios e séries

- [x] Corrigir Drop Set e Rest-Pause - devem ser extensões da série, não séries separadas

- [x] Corrigir tabela de Evolução de Carga - adicionar scroll horizontal para mobile
- [x] Corrigir modal de Nova Medição - botões sobrepostos e scroll não funciona

- [x] Corrigir layout da anamnese - campos desalinhados em Estilo de Vida e Nutrição

- [x] Corrigir calendário abrindo automaticamente no modal de Criar Registro Manual de Treino

- [x] Corrigir Meus Treinos no portal do aluno - não está carregando treinos do personal

- [x] Corrigir visualização de treino no portal do aluno - tela em branco ao clicar em Ver Treino


## Sistema de Fotos Guiadas com IA (v3.9)

### Fotos Guiadas no Portal do Aluno
- [x] Gerar imagens de referência para cada pose
- [x] Criar componente de fotos guiadas com imagem de referência + upload
- [x] Poses: frontal relaxado, frontal contraído, lateral esquerda, lateral direita
- [x] Poses: costas relaxado, costas contraído
- [x] Poses: bíceps direito/esquerdo relaxado/contraído
- [x] Poses: perna direita/esquerda relaxada/contraída
- [x] Aba "Fotos" adicionada ao menu do portal do aluno
- [x] Endpoint de upload de fotos guiadas (studentPortal.uploadPhoto)
- [x] Endpoint de listagem de fotos guiadas (studentPortal.guidedPhotos)

### Integração com Medições
- [ ] Adicionar campo de fotos no modal de Nova Medição
- [ ] Vincular fotos à medição específica (data)
- [ ] Armazenar fotos por categoria/pose

### Comparativo Visual com IA
- [ ] Tela de comparação lado a lado (antes/depois)
- [ ] IA analisa diferenças visuais entre fotos
- [ ] Gerar feedback textual da evolução visual

### Cruzamento com Análise de Treino
- [ ] Incluir comparativo de fotos na análise de 30 dias
- [ ] IA cruza: evolução visual + medidas + eficiência do treino
- [ ] Validar se treino está gerando resultados visuais esperados


## Correções e Melhorias Fotos (v6.0)
- [x] Corrigir erro de serialização na anamnese (trainingRestrictions e muscleEmphasis como arrays)
- [x] Otimizar imagens de referência das poses (reduzir de 44MB para 6MB total)
- [x] Criar histórico de evolução de fotos no portal do aluno (timeline por pose)
- [x] Implementar visualização de fotos no lado do personal (StudentProfile)


## Melhorias Sistema de Fotos (v6.1)

### UX de Atualização e Histórico
- [x] Adicionar botão "Atualizar Foto" mais visível em cada pose
- [x] Mostrar contador de fotos no histórico mesmo com 1 foto
- [x] Permitir ver histórico mesmo com apenas 1 foto
- [x] Tornar fluxo de atualização mais intuitivo

### Análise de Fotos com IA
- [x] Integrar LLM para analisar diferenças visuais entre fotos
- [x] Gerar feedback automático da evolução visual
- [x] Mostrar análise no modal de comparação

### Vincular Fotos às Medições
- [x] Adicionar campo de fotos no modal de Nova Medição
- [x] Associar fotos à data específica da medição
- [ ] Mostrar fotos vinculadas na timeline de medições

### Cruzar com Análise de Treino
- [x] Incluir comparativo de fotos na análise de 30 dias
- [x] IA cruza evolução visual + medidas + eficiência do treino
- [x] Validar se treino está gerando resultados visuais esperados

- [x] Mostrar data da foto mais recente em cada pose
- [x] Mostrar tempo decorrido entre fotos no histórico
- [x] Mostrar tempo total de evolução na comparação


## Correção Drop Set e Rest-Pause (v5.60)
- [ ] Redesenhar Drop Set como área expandida dentro da série
- [ ] Redesenhar Rest-Pause como área expandida dentro da série
- [ ] Cada drop/pausa tem: carga, reps, descanso
- [ ] Botão "+ Adicionar Drop" para múltiplos drops
- [ ] Botão "+ Adicionar Pausa" para múltiplas pausas
- [ ] Remover implementação atual (toggle separado)


## Correção Drop Set e Rest-Pause (v4.4)
- [x] Mover Drop Set e Rest-Pause para nível da série (não exercício)
- [x] Botões toggle para ativar Drop Set e Rest-Pause em cada série
- [x] Suporte a múltiplos drops por série
- [x] Suporte a múltiplas pausas por série (Rest-Pause)
- [x] Serialização de drops/restPauses extras no campo notes
- [x] Deserialização ao carregar dados
- [x] Sincronização bidirecional (personal e aluno veem os mesmos dados)


## Bug Treino Adaptado 2.0 (v4.5)
- [x] Treino gerado pelo "Treino Adaptado 2.0" não aparece na lista do personal
  - Problema: Modal de preview não abria automaticamente após geração
  - Solução: Adicionado setIsAIDialogOpen(true) no onSuccess do generateAdaptedMutation
- [x] Verificar se o treino está sendo salvo corretamente no banco
- [x] Verificar se a lista está sendo atualizada após criação


## Fluxo Treino 2.0 em 2 Passos (v4.6)
- [x] Verificar implementação atual do botão Análise
- [x] Adicionar botão "Gerar Treino 2.0" dentro do pop-up de Análise
- [x] Substituir card "Treino Adaptado 2.0" por "Análise do Aluno"
- [x] Fluxo: Análise → Ver análise detalhada → Gerar Treino baseado na análise
- [x] Criar procedimento getStudentAnalysis no backend
- [x] Modal de análise com métricas, evolução, pontos fortes, déficits e recomendações


## Responsividade Modal Análise (v4.7)
- [x] Ajustar modal de análise para caber em telas mobile
- [x] Corrigir texto cortado nas laterais
- [x] Melhorar espaçamento e padding para mobile
- [x] Ajustar tamanho de fontes para mobile (text-xs, text-[10px])
- [x] Usar break-words para textos longos
- [x] Botão de gerar treino em largura total no mobile


## Responsividade Modal Preview Treino IA (v4.8)
- [x] Eliminar scroll lateral no modal de preview
- [x] Ajustar tabela de exercícios para layout de cards em mobile
- [x] Garantir que todos os detalhes sejam visíveis sem scroll horizontal
- [x] Ajustar tamanho de fontes e badges para mobile
- [x] Ajustar botões do rodapé para mobile


## Análise Comparativa (v4.9)
- [x] Criar tabela comparativa detalhada FitPrime vs Concorrência
- [x] Incluir todas as funcionalidades de cada plataforma
- [x] Destacar diferenciais do FitPrime


## Sistema de Suporte com IA (v5.0)
- [ ] Criar página de Suporte/Ajuda para o Personal
  - [ ] Jornada do Personal (primeiro contato até análises mensais)
  - [ ] Guia passo a passo de todas as funcionalidades
  - [ ] FAQ com perguntas frequentes
- [ ] Criar página de Suporte/Ajuda para o Aluno
  - [ ] Jornada do Aluno (como usar o portal)
  - [ ] Guia de funcionalidades do portal
- [ ] Implementar Chat com IA "Pergunte à FitPrime IA"
  - [ ] Respostas baseadas nas funcionalidades reais do app
  - [ ] Sugestões de perguntas rápidas
  - [ ] Histórico de conversas
- [ ] Adicionar link "Suporte" na barra lateral do Personal
- [ ] Adicionar link "Ajuda" na barra lateral do Aluno


## Sistema de Suporte com IA (v5.0)
- [x] Criar página de Suporte para o Personal com jornada completa
- [x] Criar página de Suporte para o Aluno com jornada
- [x] Implementar Chat com IA ("Pergunte à FitPrime IA")
- [x] Adicionar links na barra lateral (Personal e Aluno)
- [x] Base de conhecimento com todas as funcionalidades do app
- [x] Jornada do Personal em 10 passos
- [x] Ciclo de acompanhamento mensal
- [x] Guia de funcionalidades com dicas


## Correções Suporte v5.1
- [x] Corrigir botões "Ir" da jornada que dão erro 404 (paths corrigidos para rotas válidas)
- [x] Ajustar ciclo de acompanhamento de 3 semanas para 30 dias
- [x] Expandir guia com TODAS as funcionalidades da ferramenta (12 categorias)


## Ajuste Aba Ajuda Portal do Aluno (v5.2)
- [x] Remover botão "Acessar Central de Ajuda" e mostrar conteúdo direto na aba
- [x] Incluir chat com IA e guias diretamente na tela
- [x] Criar componente StudentHelpCenter com chat IA e guia do portal
- [x] Perguntas rápidas para facilitar uso


## Jornada do Aluno na Central de Ajuda (v5.3)
- [x] Adicionar aba "Jornada" no StudentHelpCenter
- [x] Mostrar passo a passo desde o primeiro acesso até acompanhamento contínuo
- [x] 10 passos da jornada com ícones, ações e dicas
- [x] Timeline visual conectando os passos
- [x] Análise mensal destacada (30 dias)


## Bug Valores de Cobrança (v5.4)
- [x] Personal vê R$ 1.000,00 mas aluno vê R$ 10,00 - investigar diferença
  - Problema: Código dividia valor por 100 (assumindo centavos)
  - Solução: Removida divisão em PortalPreview.tsx e StudentPortalPage.tsx
- [x] Alinhar formatação de valores entre Personal e Aluno

## Integração Plataforma de Vendas (v5.5)
- [ ] Preparar para liberar apenas para personais pagantes
- [ ] Integrar com plataforma de vendas (Hotmart, Kiwify, etc.)
- [ ] Aluno não precisa pagar - é convite do personal

## Preparação Serviço Online (v5.6)
- [ ] Identificar funcionalidades necessárias para personal atender clientes remotos
- [ ] Analisar gaps para consultoria online

## Modo Offline PWA (v5.7)
- [ ] Implementar Service Worker para cache de dados
- [ ] Permitir uso sem internet para Personal e Aluno
- [ ] Sincronizar dados quando voltar online


## Correções Urgentes (Janeiro 2026)
- [x] Bug: Valores de cobrança exibidos incorretamente no portal do aluno (divisão por 100) - VERIFICADO: Não há bug, valores estão corretos (R$ 1000.00)


## Modo Offline PWA Completo (v5.8)
- [x] Configurar manifest.json para PWA
- [x] Implementar Service Worker com cache avançado
- [x] Cache de recursos estáticos (HTML, CSS, JS, imagens)
- [x] Cache de dados da API (treinos, alunos, sessões)
- [x] Detectar status de conexão (online/offline)
- [x] Fila de operações offline (criar, editar, excluir)
- [x] Sincronização automática ao voltar online
- [x] Indicador visual de status offline
- [x] Funciona para Personal e Aluno
- [x] Prompt de instalação do app

## Sistema de Evolução de Fotos com IA (v5.9)
- [x] Migração do banco (tabela photo_analyses + novos campos)
- [x] Fluxo de UX: Convite para fotos após salvar anamnese (opcional)
- [x] Timeline de fotos com datas visíveis
- [x] Comparação lado a lado (antes/depois) com slider
- [x] Análise por IA do shape baseada em fotos + medidas
- [x] Scores numéricos (ganho muscular, perda gordura, postura)
- [x] Histórico de análises salvas
- [x] Interface para Portal do Aluno
- [x] Interface para área do Personal (dashboard de evolução)


## Unificação das Áreas de Evolução (v5.10)
- [ ] Analisar funcionalidades da página Evolução (menu lateral)
- [ ] Analisar funcionalidades da aba Fotos no perfil do aluno
- [ ] Mapear diferenças entre as duas áreas
- [ ] Unificar funcionalidades - adicionar o que falta em cada área
- [ ] Garantir mesma experiência para o aluno no portal
- [ ] Testar integração completa


## Unificação das Áreas de Evolução (v5.10)
- [x] Mapear funcionalidades do menu lateral "Evolução"
- [x] Mapear funcionalidades da aba "Fotos" no perfil do aluno
- [x] Criar componente unificado com todas as funções (UnifiedEvolutionDashboard)
- [x] Aplicar no menu lateral "Evolução" (EvolutionDashboard.tsx)
- [x] Aplicar na aba "Fotos" do perfil do aluno (StudentProfile.tsx)
- [x] Criar componente para portal do aluno (StudentEvolutionDashboard)
- [x] Funcionalidades unificadas:
  - [x] Visão geral com KPIs (fotos, medições, exercícios, dias)
  - [x] Timeline de fotos por pose com datas
  - [x] Comparação antes/depois com slider interativo
  - [x] Análise por IA com fotos e medidas
  - [x] Gráficos de evolução de peso e circunferências
  - [x] Evolução de carga nos treinos por exercício
  - [x] Upload de novas fotos guiado por poses


## Correções Área de Evolução (v5.11)
- [ ] Botão de atualizar/adicionar medidas corporais
- [ ] Botão de atualizar/adicionar fotos
- [ ] Histórico de análises da IA (mostrar análises anteriores)

## Correções Área de Evolução (v5.11)
- [x] Botão de atualizar/adicionar medidas corporais
- [x] Botão de histórico de análises da IA
- [x] Modal de nova medida no Personal e Aluno
- [x] Modal de histórico de análises no Personal e Aluno



## Correções Urgentes Área de Evolução (v5.12)
- [ ] Botão de adicionar nova MEDIDA visível e funcional
- [ ] Botão de adicionar nova FOTO visível e funcional
- [ ] Histórico de análises da IA sendo gerado e exibido
- [ ] Aplicar em todas as interfaces (Personal e Aluno)


## Análise de Redundância e Correções (v5.12)
- [ ] Mapear todos os gráficos e visualizações existentes
- [ ] Identificar redundâncias e sobreposições
- [ ] Simplificar interface removendo duplicações
- [ ] Corrigir formato dos botões (texto visível, não só ícone)


## Integração Cakto - Pagamentos (v4.7)
- [x] Configurar credenciais Cakto como secrets
- [x] Criar endpoint de webhook para receber eventos da Cakto
- [x] Processar evento purchase_approved (ativar acesso)
- [x] Processar evento refund (desativar acesso)
- [x] Processar evento subscription_created (ativar assinatura)
- [x] Processar evento subscription_canceled (cancelar assinatura)
- [x] Processar evento subscription_renewed (renovar assinatura)
- [x] Webhook criado na Cakto (ID: 33740, Secret: 29163253-1d82-4fb3-b0e8-ae42ff4f07ae)
- [ ] Testar integração completa com compra real


## Bloqueio de Acesso - Pagamento em Atraso (v4.8)
- [x] Criar middleware de verificação de assinatura no backend
- [x] Verificar se assinatura está vencida há mais de 1 dia (1 dia de tolerância)
- [x] Criar página de bloqueio/renovação para personais inadimplentes
- [x] Redirecionar para página de bloqueio quando assinatura vencida
- [x] Botão de renovação aponta para checkout da Cakto
- [x] Testes unitários passando (7 testes)


## Sistema de Trial e Acesso de Teste (v4.9)
- [x] Adicionar campo trialEndsAt na tabela personals (1 dia após cadastro)
- [x] Adicionar campo testAccessEndsAt na tabela personals (para acessos liberados pelo owner)
- [x] Adicionar campo testAccessGrantedBy e testAccessGrantedAt na tabela personals
- [x] Criar endpoint para owner liberar acesso de teste (30 dias)
- [x] Criar página de administração para gerenciar acessos de teste (/admin)
- [x] Atualizar verificação de assinatura para considerar trial e acesso de teste
- [x] Trial de 1 dia para novos usuários (automático no cadastro)
- [x] Acesso de teste de 30 dias (liberado manualmente pelo owner)
- [x] Mostrar dias restantes de trial/teste no paymentStatus
- [x] Testes unitários passando (12 testes)


## Painel de Administração Completo (v5.0)

### Dashboard Principal
- [ ] KPIs principais (total personais, ativos, trial, receita estimada)
- [ ] Gráfico de crescimento de usuários (últimos 30 dias)
- [ ] Gráfico de conversão trial -> pagante
- [ ] Gráfico de receita mensal
- [ ] Mapa de calor de atividade dos personais
- [ ] Top 5 personais mais ativos
- [ ] Alertas e notificações do sistema

### Gestão de Personais
- [ ] Lista completa com filtros avançados
- [ ] Detalhes do personal (alunos, sessões, receita)
- [ ] Histórico de assinatura
- [ ] Ações em massa (ativar, desativar, notificar)
- [ ] Exportar lista para CSV/Excel

### Gestão de Assinaturas
- [ ] Visão geral de assinaturas por status
- [ ] Renovações pendentes
- [ ] Cancelamentos recentes
- [ ] Histórico de pagamentos
- [ ] Cupons e descontos

### Métricas e Relatórios
- [ ] Relatório de crescimento
- [ ] Relatório de churn (cancelamentos)
- [ ] Relatório de receita (MRR, ARR)
- [ ] Relatório de uso do sistema
- [ ] Exportar relatórios em PDF

### Logs e Auditoria
- [ ] Log de ações administrativas
- [ ] Log de logins
- [ ] Log de erros do sistema
- [ ] Filtros por data, usuário, ação

### Configurações do Sistema
- [ ] Configurações gerais
- [ ] Configurações de email/notificações
- [ ] Configurações de pagamento
- [ ] Backup e manutenção

### Comunicação
- [ ] Enviar notificação para todos os personais
- [ ] Enviar notificação para grupo específico
- [ ] Templates de mensagens
- [ ] Histórico de comunicações


## Painel de Administração Completo (v5.0) - IMPLEMENTADO
### Dashboard Principal
- [x] KPIs principais (total personais, ativos, trial, MRR estimado, taxa de conversão)
- [x] Gráfico de crescimento de usuários (últimos 30 dias)
- [x] Distribuição de status das assinaturas (gráfico de pizza)
- [x] Top 5 personais por número de alunos
- [x] Top 5 personais mais ativos (sessões nos últimos 30 dias)
- [x] Alertas de assinaturas expirando em 7 dias

### Gestão de Personais
- [x] Lista completa com busca por nome, email, empresa, WhatsApp
- [x] Detalhes do personal (alunos, sessões, treinos)
- [x] Ações: Liberar teste, Revogar teste, Ativar assinatura, Cancelar
- [x] Badges de status (Ativo, Trial, Teste, Expirado, Cancelado)

### Gestão de Assinaturas
- [x] Métricas de receita (MRR e ARR estimados)
- [x] Funil de conversão trial → pagante
- [x] Distribuição por status

### Atividade
- [x] Estatísticas do sistema (alunos, sessões, usuários)
- [x] Atividade recente (últimos cadastros)

### Endpoints Backend
- [x] admin.dashboardMetrics - Métricas gerais
- [x] admin.growthData - Dados de crescimento
- [x] admin.topPersonalsByStudents - Top personais por alunos
- [x] admin.mostActivePersonals - Personais mais ativos
- [x] admin.subscriptionDistribution - Distribuição de assinaturas
- [x] admin.expiringSubscriptions - Assinaturas expirando
- [x] admin.recentActivity - Atividade recente
- [x] admin.personalDetails - Detalhes de um personal
- [x] admin.revenueMetrics - Métricas de receita
- [x] admin.conversionData - Dados de conversão


## Painel Admin Expandido (v5.1)
### Detalhes do Personal
- [x] Ver lista completa de alunos do personal
- [x] Ver emails e WhatsApp de todos os alunos
- [x] Ver total de sessões realizadas (histórico completo)
- [x] Ver total de treinos criados
- [x] Ver receita gerada pelo personal (cobranças)
- [x] Ver data do último login
- [ ] Ver configurações do personal (Stevo, planos, etc)

### Ações Administrativas
- [x] Resetar senha do personal
- [ ] Enviar email de recuperação
- [x] Bloquear/desbloquear acesso
- [x] Exportar dados do personal em CSV
- [x] Exportar lista de alunos em CSV
- [x] Exportar contatos (emails e WhatsApp) em CSV

### Métricas Avançadas por Personal
- [ ] Gráfico de crescimento de alunos
- [ ] Taxa de retenção de alunos
- [ ] Frequência média dos alunos
- [ ] Receita média por aluno
- [ ] Sessões por semana/mês

### Comunicação
- [ ] Enviar notificação individual para personal
- [x] Enviar email direto para personal
- [ ] Ver histórico de comunicações


## Gráficos de Crescimento por Personal (v5.2)
- [ ] Criar endpoint admin.personalGrowthData para dados de crescimento de alunos
- [ ] Adicionar gráfico de linha no modal de detalhes do personal
- [ ] Mostrar evolução de alunos nos últimos 6 meses
- [ ] Incluir indicadores de crescimento (%, absoluto)


## Reformulação da Landing Page (v5.1)
- [ ] Pesquisar dados e estatísticas sobre dores dos personal trainers
- [ ] Criar seção de ancoragem com dores (tempo perdido, dinheiro perdido, clientes perdidos)
- [ ] Adicionar dados concretos de quanto o personal perde sem sistema
- [ ] Apresentar todas as funcionalidades de forma didática (para leigos)
- [ ] Comunicação persuasiva estilo "black" (sem termos proibidos Meta Ads)
- [ ] Seção de benefícios vs custo de não usar
- [ ] Depoimentos e prova social
- [ ] Integrar link de pagamento Stripe
- [ ] CTA forte e persuasivo
- [ ] Design moderno e profissional

- [ ] Adicionar seção para entusiastas da musculação (não personal) na landing page
- [x] Copy persuasiva para usuário comum que quer controlar treinos e métricas

- [x] Contador de urgência na seção de preços (countdown timer + vagas limitadas)


## Fluxo de Pagamento Obrigatório (v5.2)
- [ ] Criar endpoint de checkout para assinatura do personal (não do aluno)
- [ ] Criar produto e preço no Stripe para assinatura mensal R$ 97
- [ ] Configurar webhook para ativar acesso após pagamento confirmado
- [ ] Atualizar botão "Assinar Agora" para direcionar ao checkout
- [ ] Bloquear acesso de quem não pagou (trial expirado sem assinatura)


## Reformulação Landing Page v2 (v5.3)
- [x] Buscar link de checkout do produto na Cakto (https://pay.cakto.com.br/y9iqj9q)
- [x] Reformular copy para tom mais leve e alto astral
- [x] Usar estratégias avançadas de copywriting (AIDA, social proof, urgência) (PAS, AIDA, etc)
- [x] Remover menções a funcionalidades que não existem (vídeos demonstrativos)
- [x] Integrar link de checkout da Cakto nos botões de assinatura


## Sistema de Precificação Avançado (v5.4)
- [ ] Criar produtos na Cakto para planos B2B (Starter, Pro, Business, Premium, Enterprise)
- [ ] Implementar lógica de cobranças por aluno excedente
- [ ] Criar página de seleção de planos com checkout
- [ ] Adicionar dashboard de upgrade de plano
- [ ] Implementar notificações de limite de alunos atingido
- [ ] Adicionar histórico de cobranças extras


## Landing Page de Vendas Profissional (v6.0)

- [x] Capturar screenshots das funcionalidades principais
- [x] Corrigir preços na Cakto (deletar ofertas erradas e recriar com valores corretos)
- [x] Criar landing page com copywriting persuasivo (gatilhos mentais, PNL, técnicas avançadas)
- [x] Adicionar jornada visual do Personal Trainer com prints passo a passo
- [x] Adicionar jornada visual do Aluno com prints passo a passo
- [x] Criar tabela comparativa de planos com todos os preços e funcionalidades
- [x] Testar landing page e salvar checkpoint


## Widget de Chat de Suporte com IA (v7.0)
- [x] Criar schema do banco de dados para chat (conversations, messages)
- [x] Implementar API tRPC para chat (enviar mensagem, listar histórico, marcar como lido)
- [x] Criar componente widget de chat flutuante
- [x] Integrar IA para respostas automáticas
- [x] Adicionar painel de admin para gerenciar chats
- [x] Testar widget e salvar checkpoint
## Integração de Chat com tRPC Backend (v7.1)
- [x] Criar helpers de banco de dados para chat
- [x] Implementar procedures tRPC para chat (criar conversa, enviar mensagem, listar, responder)
- [ ] Integrar ChatWidget com tRPC (persistir no banco)
- [x] Criar painel de admin de chats no AdminPanel
- [x] Adicionar métricas e relatórios de chat (tempo de resposta, taxa de resolução)
- [x] Testar integração e salvar checkpoint


## Personalização do Checkout Cakto (v8.0)

### Análise e Planejamento
- [ ] Acessar painel da Cakto e analisar opções de personalização disponíveis
- [ ] Documentar campos customizáveis (cores, fontes, logos, textos, banners)
- [ ] Definir paleta de cores do FitPrime para o checkout
- [ ] Listar dimensões de imagens aceitas pela Cakto

### Criação de Artes
- [ ] Criar logo FitPrime otimizado para checkout (PNG transparente)
- [ ] Criar banner hero para etapa de seleção de plano (1200x400px)
- [ ] Criar ícones para cada plano (Starter, Pro, Business, Premium, Enterprise)
- [ ] Criar banner de benefícios/features (1200x300px)
- [ ] Criar imagem de segurança/confiança (pagamento seguro)
- [ ] Criar ícones de métodos de pagamento (cartão, pix, boleto)
- [ ] Criar imagem de sucesso/confirmação para página final

### Personalização de Cores e Layout
- [ ] Definir cor primária (emerald #10b981)
- [ ] Definir cor secundária (teal #14b8a6)
- [ ] Definir cor de destaque (laranja/coral para CTAs)
- [ ] Personalizar background (branco ou gradiente suave)
- [ ] Personalizar fonte (Geist ou similar moderna)
- [ ] Ajustar padding e espaçamento
- [ ] Adicionar bordas arredondadas aos botões

### Copywriting Persuasivo
- [ ] Escrever headline principal (problema + solução)
- [ ] Escrever subtítulo com urgência/escassez
- [ ] Escrever descrição de cada plano com benefícios principais
- [ ] Escrever CTA principal (botão de checkout)
- [ ] Escrever CTA secundário (continuar sem plano)
- [ ] Escrever mensagem de garantia/segurança
- [ ] Escrever mensagem de sucesso pós-pagamento
- [ ] Escrever email de confirmação com próximos passos

### Configuração Técnica
- [ ] Configurar URL de redirecionamento pós-sucesso
- [ ] Configurar URL de redirecionamento pós-cancelamento
- [ ] Configurar email de confirmação automático
- [ ] Configurar notificações para o owner
- [ ] Testar fluxo completo de checkout
- [ ] Testar em mobile (responsividade)
- [ ] Testar em diferentes navegadores

### Otimizações e Conversão
- [ ] Adicionar social proof (avatares de clientes, número de usuários)
- [ ] Adicionar FAQ rápido no checkout
- [ ] Adicionar garantia de satisfação (7 dias de teste grátis)
- [ ] Adicionar selo de segurança (SSL, PCI compliance)
- [ ] Adicionar contato de suporte (chat, email, WhatsApp)
- [ ] Adicionar timer de oferta (urgência)
- [ ] Adicionar depoimentos de clientes satisfeitos

### Testes e Validação
- [ ] Teste de fluxo completo (seleção > dados > pagamento > sucesso)
- [ ] Teste em mobile (iPhone, Android)
- [ ] Teste em desktop (Chrome, Firefox, Safari, Edge)
- [ ] Teste de validação de formulário
- [ ] Teste de mensagens de erro
- [ ] Teste de email de confirmação
- [ ] Teste de redirecionamento pós-sucesso


## Sistema de Cobranças por Aluno Excedente (v8.0)
- [x] Atualizar schema do banco com campos de acúmulo
- [x] Implementar helpers de banco de dados para cobranças extras
- [x] Criar endpoints tRPC para calcular e gerenciar extras
- [x] Implementar UI no dashboard (painel de alunos excedentes)
- [ ] Integrar com Cakto para cobrar na renovação
- [ ] Adicionar notificações por email
- [x] Criar testes unitários
- [ ] Testar fluxo completo


## Painel de Admin - Cobranças Extras (v8.1)
- [x] Criar endpoints tRPC de admin para listar cobranças extras
- [x] Criar componente AdminExtraChargesPanel
- [x] Implementar tabela com histórico de cobranças
- [x] Adicionar filtros por período, personal, status
- [x] Criar gráficos de cobranças por mês
- [x] Adicionar estatísticas (total cobrado, média, top personals)
- [x] Integrar no AdminPanel
- [x] Testar painel completo

## Quiz de Qualificação Reformulado (v9.1)
- [x] Analisar dores que FitPrime resolve
- [x] Criar perguntas com manipulação inconsciente
- [x] Implementar QualificationQuizV2
- [x] Integrar scoring inteligente
- [x] Adicionar mensagens de urgência
- [x] Atualizar QuizPage para usar V2

## Quiz de Qualificação + LP Dinâmica (v9.0)
- [x] Pesquisar scripts de copy de LPs que convertem
- [x] Criar sistema de quiz de qualificação (v1 - genérico)
- [x] Reformular quiz com manipulação inconsciente (v2 - estratégico)
- [x] Implementar LP dinâmica com preços baseados no perfil
- [x] Adicionar plano Beginner (5 alunos por R$ 39,90 + R$ 7,98/extra)
- [x] Melhorar copy da LP com scripts que convertem
- [ ] Implementar notificações para admins sobre falhas
- [ ] Implementar estorno de cobranças extras pelo painel
- [ ] Implementar visualização de histórico por personal
- [ ] Testar fluxo completo


## LP Completa + Quiz Multi-Seleção + Admin Dashboard (v10.0)
- [x] Reformular quiz com múltipla seleção (checkbox)
- [x] Criar LP completa após quiz (beneñícios, dores, testimoniais, FAQ)
- [x] Criar dashboard de admin com KPI do funil
- [x] Adicionar gráficos visuais (conversão, respostas, jornada)
- [x] Integrar rastreamento de slugs
- [x] Implementar jornada completa do cliente
- [ ] Testar fluxo completo


## Correções do Quiz (v10.1)
- [x] Corrigir texto do topo: "3 perguntas" → "5 perguntas"
- [x] Tornar opção "Já uso um sistema" mais persuasiva (ex: "mas é incompleto")
- [x] Converter TODAS as perguntas para multi-seleção (checkbox)
- [ ] Testar fluxo completo


## Desqualificação de Leads (v10.2)
- [x] Adicionar pergunta sobre quantidade de alunos
- [x] Quem não tem aluno → Desqualifica e encerra funil
- [x] Adicionar pergunta sobre renda/receita
- [x] Quem não tem renda → Desqualifica e encerra funil
- [x] Criar tela de desqualificação com mensagem apropriada
- [ ] Testar fluxo de desqualificação


## Melhoria do Quiz - Direcionamento Correto (v10.3)
- [x] Reformular perguntas para mapear perfil real do personal
- [x] Usar quantidade de alunos para indicar plano correto
- [x] Quem ganha menos de R$ 2k → Máximo Starter (R$ 97)
- [x] Quem tem 1-5 alunos → Beginner
- [x] Quem tem 6-15 alunos → Starter
- [x] Quem tem 16-30 alunos → Pro
- [x] Quem tem 30+ alunos → Business
- [ ] Testar fluxo completo de direcionamento


## Próximos Passos - Quiz Completo (v10.4)
- [x] Melhorar perguntas do quiz com estratégia de dores
- [x] Criar LP completa pós-quiz (benefícios, testimoniais, FAQ)
- [x] Criar schema no banco para salvar respostas do quiz
- [x] Criar endpoints tRPC para salvar e consultar respostas
- [x] Integrar dashboard admin com dados do quiz
- [x] Adicionar gráficos de análise das respostas
- [ ] Testar fluxo completo


## Integração Quiz + Admin (v10.5)
- [ ] Integrar chamada trpc.quiz.saveResponse no QualificationQuizV3
- [ ] Adicionar link para /admin/quiz no AdminPanel
- [ ] Testar fluxo completo do quiz


## Integração Quiz + Admin (v10.5)
- [x] Integrar chamada trpc.quiz.saveResponse no QualificationQuizV3
- [x] Adicionar link para /admin/quiz no AdminPanel
- [x] Testar fluxo completo do quiz
- [x] Corrigir quizRouter para usar campos corretos da tabela existente
- [x] Corrigir AdminQuizDashboard para usar campos corretos do quizRouter


## Funil de Vendas Completo (v10.6)

### Correções Urgentes
- [x] Corrigir página de Cobranças Extras (não funciona)

### Checkout Stripe Real
- [x] Implementar checkout real com Cakto nos botões dos planos
- [x] Cada plano com seu link de checkout correto (Cakto)
- [x] Cada preço vinculado ao produto Cakto correspondente

### Cadast### Cadastro com CPF e CREF
- [x] Adicionar campo CPF no cadastro (obrigatório, validação matemática)
- [x] Adicionar campo CREF no cadastro (opcional)
- [x] Limitar 1 cadastro por CPF
- [x] CREF necessário apenas para gerar treino com IAreino com IA

### Quiz Reformulado (Funil de Dores)
- [x] Perguntas de dores (mostrar que está "fodido")
- [x] Perguntas de soluções (arrancar "sim" com base no PWA)
- [x] Perguntas financeiras (alunos, renda atual)
- [x] Perguntas de objetivos (renda desejada, benefícios)
- [x] Página personalizada com 3 planos baseados nas respostas

### Popup Exit Intent
- [x] Detectar quando usuário vai sair/voltar
- [x] Popup oferecendo teste grátis de 1 dia
- [x] Redirecionar para página de cadastro
- [x] Capturar: nome, data nascimento, CPF, email, telefone

### Geração de Treino com IA
- [ ] Bloquear função sem CREF preenchido
- [ ] Solicitar CREF na primeira tentativa de gerar treino
- [ ] Liberar função após CREF ser informado


### Pendente do Usuário
- [x] Criar produto FitPrime Beginner na Cakto (R$ 39,90 - 5 alunos) - Link: https://pay.cakto.com.br/75u9x53

## Próximas Etapas - Funil de Vendas v2 (v10.7)
- [x] Corrigir bug da página Cobranças Extras no admin (não está funcionando)
- [x] Integrar popup de exit intent na landing page e pricing
- [x] Criar página de resultado personalizado após o quiz com 3 planos recomendados
- [x] Reformular Landing Page - remover seção de planos, adicionar CTAs focados em benefícios
- [x] Implementar fluxo de trial de 1 dia com coleta de dados (nome, data nascimento, CPF, email, telefone)
- [x] Adicionar validação de unicidade do CPF (um cadastro por CPF)


## Próximos Passos - Funil v2.1 (v10.8)
- [x] Bloquear geração de treino sem CREF preenchido
- [x] Solicitar CREF na primeira tentativa de gerar treino com IA
- [x] Criar página de cadastro trial (/cadastro-trial)
- [ ] Implementar tracking de conversão (quiz iniciado, quiz completo, trial criado)


## Painel Admin Avançado - v4

### Dashboard de Analytics
- [ ] Criar página AdminAnalyticsDashboard no painel admin
- [ ] Implementar métricas do funil (visitas, conversões, abandono)
- [ ] Gráficos de conversão por etapa do funil
- [ ] Filtros por período (hoje, 7 dias, 30 dias, custom)

### Integração Tracking Multiplataforma
- [ ] Integrar Google Analytics 4 (GA4)
- [ ] Integrar Facebook Pixel para remarketing
- [ ] Integrar TikTok Ads pixel
- [ ] Criar configuração no admin para IDs dos pixels

### Sistema de A/B Testing
- [ ] Criar tabela de variantes no banco de dados
- [ ] Implementar lógica de distribuição de tráfego
- [ ] Dashboard de resultados dos testes
- [ ] Declarar vencedor e aplicar variante

### Painel de Gerenciamento de Páginas
- [ ] Criar página AdminPagesManager no admin
- [ ] Listar todas as páginas/rotas do site
- [ ] Botão de atualizar para detectar novas páginas
- [ ] KPIs por página (visitas, conversões, bounce rate)
- [ ] Ações: editar, duplicar, gerar nova slug, publicar/despublicar

### Editor Visual de Páginas (Estilo Canva)
- [x] Interface intuitiva estilo Canva com drag-and-drop
- [x] Criar sistema de blocos editáveis (hero, features, pricing, FAQ, CTA, etc)
- [x] Edição inline de textos (clique para editar)
- [x] Seletor de cores com paletas pré-definidas
- [ ] Upload e manipulação de imagens (crop, resize, filtros)
- [x] Biblioteca de ícones e elementos visuais
- [ ] Templates prontos para começar
- [x] Reorganizar seções com drag-and-drop
- [x] Preview em tempo real (desktop/mobile)
- [x] Desfazer/Refazer (Ctrl+Z / Ctrl+Y)
- [x] Salvar rascunho e publicar
- [x] Histórico de versões com rollback
- [x] Duplicar páginas existentes
- [x] Gerar novas slugs/URLs
- [ ] Opções de SEO (título, descrição, og:image)
- [ ] Criar novas páginas do zero

## Correções - PWA
- [x] Restringir popup de instalação PWA apenas para áreas internas (dashboard personal/aluno)
- [x] Remover popup das páginas públicas (landing, quiz, pricing, etc)

## Correções Editor de Páginas (v4.3)
- [x] Criar schema de banco para páginas e blocos
- [x] Implementar routers tRPC para CRUD de páginas
- [x] Gerenciador de Páginas com dados reais do banco
- [x] Editor carregar conteúdo real das páginas existentes
- [x] Corrigir bug de páginas sumindo após publicar
- [x] Adicionar opção de API na página de Pixels
- [ ] Adicionar mais templates (página de vendas, captura, obrigado)

## Correções e Melhorias - Editor e Trial
- [x] Corrigir erro do cadastro trial (campo birthDate não existe na tabela)
- [x] Melhorar editor de blocos com ferramentas funcionais de edição
- [x] Adicionar campo de scripts personalizados nos blocos
- [x] Implementar delay de seções no editor
- [x] Sincronização de elementos com vídeo
- [ ] Botão "Gerar Página com IA" - prompt para criar páginas automaticamente
- [x] Corrigir edição de blocos existentes (não estão funcionando)
- [x] Corrigir cadastro trial no exit popup (mesmo erro da página cadastro-trial)

- [x] Corrigir geração de páginas com IA para seguir prompt do usuário
- [x] Adicionar tipo de bloco Quiz ao editor de páginas
- [x] IA deve interpretar pedidos específicos (ex: quiz com X perguntas)

- [x] Corrigir scroll da área de preview no editor de páginas
- [x] Implementar renderização visual de todos os blocos (pricing, testimonials, faq, etc)
- [x] Implementar campos de edição específicos para cada tipo de bloco
- [x] Bloco Logos: adicionar campos de edição (título, upload de logos)
- [x] Bloco Pricing: campos para editar planos, preços, features
- [x] Bloco Testimonials: campos para editar depoimentos
- [x] Bloco FAQ: campos para editar perguntas e respostas
- [x] Bloco Quiz: campos para editar perguntas e opções

- [x] Corrigir editor de páginas para carregar conteúdo das páginas existentes
- [ ] Ao clicar em Editar Página, deve carregar os blocos salvos no banco

## Landing Page - Melhorias ICP (v6.0)
- [x] Remover botões "Como Funciona", "Descubra seu Plano" e "Teste Grátis" do topo
- [x] Reformular cálculo de perda financeira com valores realistas de mercado
- [ ] Ajustar copy para conectar melhor com ICP de personal trainers
- [ ] Remover TODOS os botões do header (incluindo Planos e Começar Agora)

## Calculadora Interativa na Landing Page (v6.1)
- [ ] Criar calculadora onde personal informa valor da aula
- [ ] Calcular automaticamente quanto está perdendo por mês
- [ ] Mostrar dados personalizados em toda a página baseado no input
- [ ] Animação dos números ao calcular


## Reorganização da Landing Page (v6.2)
- [x] Criar hero com conexão emocional primeiro (dores, frases do dia a dia)
- [x] Mover calculadora para seção separada mais abaixo
- [x] Manter fluxo: Conexão → Dores → Calculadora → Solução → CTA
- [x] Remover placeholders de screenshot (usar ícones)
- [x] Criar jornada completa do personal e cliente com todos os benefícios

## Estratégia de CTAs - Curiosidade e Descoberta (v6.3)
- [x] Criar CTAs focados em "descobrir se o FitPrime é pra mim"
- [x] Criar CTAs focados em "qual plano combina com meu momento"
- [x] Usar linguagem de curiosidade (Descubra, Responda, Veja se...)
- [x] Gerar desejo de seguir para os próximos passos
- [x] Remover menções a "teste grátis" (fica só no backredirect)
- [x] CTAs levam para quiz/descoberta, não para cadastro direto

## Tabela Comparativa - FitPrime vs Concorrentes (v6.4)
- [x] Pesquisar funcionalidades dos principais concorrentes (MFIT, Wiki4Fit, Hexfit, Mobitrainer)
- [x] Criar tabela comparativa sem expor nomes (App A, B, C)
- [x] Mostrar todas as funcionalidades do FitPrime vs concorrentes
- [x] Destacar diferenciais do FitPrime


## Reformulação Landing Page v6.5 - Fluxo de Leitura
- [ ] CTAs levam para seção abaixo (não para quiz direto)
- [ ] Renomear botões baseado na próxima seção para gerar curiosidade
- [ ] Lead deve ler página toda para elevar nível de consciência
- [ ] Sempre passar pelo quiz antes dos planos

## Tabela Comparativa - Correções
- [ ] Remover "Biblioteca de exercícios em vídeo" (em breve)
- [ ] Remover menção a preço (R$ 97)
- [ ] Mostrar APENAS o que o FitPrime tem
- [ ] Adicionar mais benefícios do FitPrime na tabela
- [ ] Pesquisar mais concorrentes se necessário

## CTA Final e FAQ
- [ ] Criar chamada agressiva e persuasiva antes do FAQ
- [ ] FAQ deve ser a última seção
- [ ] Perguntas inteligentes que mostram qualidades e geram desejo


## Reformulação Landing Page - Fluxo e CTAs (v6.5)
- [x] Botões CTA levam para seção abaixo (não para quiz direto)
- [x] Renomear botões baseado na próxima seção (gerar curiosidade)
- [x] Tabela comparativa: remover "biblioteca de vídeos" (em breve)
- [x] Tabela comparativa: remover preço (R$ 97)
- [x] Tabela comparativa: mostrar só o que temos
- [x] Tabela comparativa: adicionar mais benefícios nossos (17 funcionalidades)
- [x] CTA final agressivo e persuasivo (contraste vermelho/verde)
- [x] FAQ por último com perguntas inteligentes (8 perguntas)
- [x] Perguntas do FAQ mostram qualidades e geram desejo


## Melhorias Landing Page v6.6
- [x] Remover "Aluno remarca sozinho pelo app" (funcionalidade não existe)
- [x] Criar 6 depoimentos estratégicos (3 dores resolvidas + 3 soluções)
- [x] Gerar imagens de pessoas estilo rede social (bolinha + balão)
- [x] Animação nos números da calculadora (efeito contador)
- [x] Scroll suave entre seções ao clicar nos CTAs


## Correções Landing Page v6.7 - Informações Incorretas

### Seção "Cadastre seus alunos"
- [x] Remover "Import do Excel/CSV" (não existe)
- [x] Simplificar descrição: só nome, email, telefone, gênero
- [x] Adicionar: aluno recebe convite e finaliza cadastro + anamnese
- [x] Remover "Foto e dados completos" (aluno que preenche)

### Seção "Agende automaticamente"
- [x] Remover "4 semanas automáticas" (é flexível 1-12 meses)
- [x] Corrigir: IA agenda de 1 mês a 12 meses (personal escolhe)
- [x] Adicionar: horários quebrados (seg 12h, ter 15h, sex 17h)
- [x] Remover "Aluno remarca sozinho" (não existe)
- [x] Remover "Aluno reagenda pelo app" (não existe)
- [x] Mover "Bloqueio por inadimplência" para área correta (é de alunos)

### FAQ
- [x] Corrigir "Quanto tempo leva pra começar a usar?"
- [x] Remover menção a quiz (não tem)
- [x] Remover menção a import Excel (não tem)
- [x] Anamnese já está pronta no sistema



## Melhoria CTA Final v6.8
- [x] Tornar o CTA final mais impactante e persuasivo
- [x] Adicionar elementos visuais que chamem mais atenção
- [x] Criar senso de urgência ou escassez
- [x] Melhorar a copy para gerar mais desejo



## Melhoria Quiz v6.9
- [x] Adicionar opção "Ainda não tenho renda" na pergunta de renda
- [x] Criar tela de eliminação para quem não tem renda
- [x] Reformular resultado com copy sensacionalista (usar dados contra o lead) - JÁ IMPLEMENTADO
- [x] Mostrar apenas 2 planos: Beginner + plano ideal baseado no número de alunos
- [x] Verificar se backredirect está funcionando (implementado no ExitIntentPopup)
- [x] MEGA ANCORAGEM: Abaixo da calculadora mostrar "Se custasse 10% do que você perde, ainda valeria a pena"


## Bug Landing Page v6.10
- [x] Corrigir botão "Quais São os Benefícios Exclusivos?" que está cortado/fora do container

## Seção Divisor de Águas - Alunos Premium v6.11
- [x] Criar seção "divisor de águas" com ângulo fisiculturista/alunos premium
- [x] Comunicação: métricas, dados, gráficos profissionais
- [x] Mostrar que pode cobrar mais com ferramentas profissionais
- [x] Puxar valor da aula da calculadora
- [x] Calcular: se cobrasse 25% a mais, ganharia X
- [x] Somar com ganho do FitPrime para mostrar potencial total
- [x] Público-alvo: fisiculturistas, empresários, amantes do mundo maromba

## Ajuste Ancoragem de Preço v6.12
- [x] Calcular ancoragem baseado em perda + ganho potencial (valor maior)
- [x] Sempre mostrar 3x o valor real do plano
- [x] Garantir mínimo de R$ 291 (3x R$ 97 do plano Beginner)
- [x] Nunca revelar o valor real do plano na ancoragem

## Depoimentos Seção Premium v6.13
- [x] Depoimentos de fisiculturistas que adoram métricas e dados
- [x] Depoimentos de alunos amantes do esporte que buscam shape e adoram dados
- [x] Depoimentos de personais que triplicaram ganhos atendendo esse público
- [x] Histórias de personais que dobraram valor da aula com ferramentas profissionais
- [x] Depoimentos de personais que conquistaram clientes que amam dados na ponta dos dedos

## Jornada Personal Premium v6.14
- [x] Mudar "Jornada do Personal" para "Jornada do Personal Premium"
- [x] Ajustar comunicação da jornada para foco em alunos premium
- [x] Adicionar números financeiros concretos nos depoimentos
- [x] Exemplo: "Fechei 3 alunos premium = R$ 4.500/mês em aulas"
- [x] Exemplo: "FitPrime se pagou por anos em um único mês"

## Bug Botão Calculadora v6.15
- [x] Botão "Como o FitPrime Faz Isso?" pula a seção ao invés de mostrar o início
- [x] Ajustar texto do botão para combinar com próxima seção (Jornada do Personal Premium)
- [x] Ajustar scroll para mostrar o início da próxima seção

## Reorganização Ancoragem v6.16
- [x] Mover seção de ancoragem 10% para depois da seção 25% a mais
- [x] Somar tudo na mega ancoragem: perda + ganho potencial + ganho 25%
- [x] Criar impacto visual maior com valor total

## Bug Tabela Comparação Mobile v6.17
- [x] Tabela de comparação com concorrentes quebra no mobile (precisa scroll lateral)
- [x] Redesenhar para layout responsivo sem scroll horizontal
- [x] Considerar layout de cards ou colunas empilhadas no mobile

## Remoção Seção Plano Ideal v6.18
- [x] Remover seção "Não sabe qual plano é o melhor para você?" com 3 cards
- [x] Remover banner verde "Tudo isso em um só lugar"
- [x] Ajustar botões para não quebrar navegação

## Ajuste Comunicação Seção Atletas v6.19
- [x] Mudar comunicação de "você atleta" para "você personal que atende atletas"
- [x] Focar em como o personal pode elevar o nível dele com essas ferramentas
- [x] Ajustar textos dos benefícios para perspectiva do personal

## Bug Fotos Depoimentos v6.20
- [x] Adicionar fotos redondas em todos os depoimentos que estão sem

## Remoção Funcionalidade Inexistente v6.21
- [x] Remover "Gestão de múltiplos personais" da tabela de comparação (não existe no FitPrime)

## Bug Botão Calculadora v6.22
- [x] Botão "Ver Jornada do Personal Premium" está pulando a seção
- [x] Ajustar scroll para ir ao quadro roxo "Divisor de Águas"
- [x] Ajustar texto do botão para combinar com a seção de destino

## Melhoria Ancoragem Lucro v6.23
- [x] Mostrar cálculo: Ganho mensal - 10% = Lucro líquido
- [x] Mensagem: "Mesmo pagando X você ainda lucra Y"
- [x] Reforçar: "Mas relaxa, você não vai pagar tudo isso"

## Bug Fotos Repetidas Depoimentos v6.24
- [x] Substituir fotos repetidas nos depoimentos por imagens únicas
- [x] Rafael e Marcos estão com a mesma foto - corrigir

## Melhoria Seção Comparação Anual v6.25
- [x] Mudar valores de mensal para anual na seção de comparação
- [x] Mostrar lucro anual mesmo pagando R$ 291/mês (R$ 3.492/ano)
- [x] Adicionar CTA: "Descubra se o FitPrime é pra você e quanto vai te custar"
- [x] Reforçar: "Mas lembre-se, você não vai pagar R$ 291"

## Bug Fotos Repetidas v6.26
- [x] Identificar TODAS as fotos repetidas nos depoimentos
- [x] Garantir que cada depoimento tenha uma foto ÚNICA

## Quiz - Faixas de Alunos e Páginas por Plano (v6.27)
- [x] Atualizar pergunta de quantidade de alunos com faixas estratégicas baseadas nos planos
- [ ] Criar página de resultado para plano Beginner (até 5 alunos - R$ 39,90)
- [ ] Criar página de resultado para plano Starter (6-15 alunos - R$ 97)
- [ ] Criar página de resultado para plano Pro (16-30 alunos - R$ 147)
- [ ] Criar página de resultado para plano Business (31-50 alunos - R$ 197)
- [ ] Criar página de resultado para plano Premium (51-100 alunos - R$ 297)
- [x] Implementar redirecionamento automático baseado na quantidade de alunos
- [x] Cada página mostra 2 planos: Beginner (R$ 39,90) + plano ideal baseado na quantidade

## Chat IA Inteligente (v6.28)
- [x] Criar base de conhecimento do FitPrime (planos, preços, funcionalidades, FAQ)
- [x] Implementar endpoint de chat com LLM real (usando invokeLLM)
- [x] Alimentar IA com contexto completo do FitPrime
- [x] IA deve saber responder sobre preços, planos, funcionalidades
- [x] IA deve calcular preço baseado na quantidade de alunos
- [x] IA deve ser conversacional e útil como um vendedor
- [x] Substituir respostas automáticas por respostas inteligentes da IA
- [x] Corrigir links de checkout nos botões do quiz (URLs Cakto reais)

## Página de Login Unificada
- [x] Criar página de login com seleção de tipo de usuário (Aluno/Personal)
- [x] Fluxo "Sou Aluno" - redireciona para portal do aluno
- [x] Fluxo "Sou Personal" - redireciona para dashboard do personal
- [x] Design moderno e responsivo

## Controle de Acesso e Login
- [x] Adicionar opção "Lembrar de mim" no login do aluno (sessão persistente)
- [x] Validar login de personal: apenas personais com assinatura ativa podem acessar (já implementado via paidPersonalProcedure)
- [x] Validar login de aluno: apenas alunos cadastrados por personais (via convite) (já implementado - alunos só existem se cadastrados)
- [x] Mostrar mensagem apropriada para personais sem assinatura (SubscriptionBlocked)

## Reenvio de Convite para Alunos
- [x] Criar endpoint para reenviar link de convite
- [x] Adicionar botão de reenvio na lista de alunos
- [x] Adicionar botão de reenvio no perfil do aluno
- [x] Enviar email/WhatsApp com novo link

## Melhorias no Sistema de Convites v6.33
- [x] Histórico de convites enviados no perfil do aluno (data, status, ações)
- [x] Notificação em tempo real para personal quando aluno aceitar convite
- [x] Envio de convites em massa para múltiplos alunos selecionados


## Fluxo Pós-Compra Cakto (v6.35)
- [x] Criar tabela pending_activations no banco de dados
- [x] Email automático para cliente após compra com link de cadastro
- [x] Página de ativação de conta (/ativar-conta)
- [x] Integrar webhook da Cakto com envio de email
- [x] Testar fluxo completo de compra → email → cadastro → acesso


## Cadastro Trial com Senha (v6.36)
- [x] Adicionar campo de criação de senha nas páginas de teste de 24h
- [x] Validar senha (mínimo 6 caracteres)
- [x] Salvar senha criptografada no cadastro


## Correções Urgentes (v6.37)
- [x] Corrigir erro de cadastro com senha (adicionar colunas passwordHash e loginMethod na tabela users)
- [x] Popup de CREF na geração de IA (ao invés de redirecionar para configurações)
- [x] Salvar CREF diretamente do popup e liberar geração


## Painel Admin - CPF e Exclusão (v6.38)
- [x] Adicionar coluna de CPF na tabela de personais
- [x] Adicionar pesquisa por CPF no campo de busca
- [x] Adicionar botão de excluir cadastro para limpar CPFs


## Bug CREF e Lixeira Admin (v6.39)
- [x] Corrigir bug do popup de CREF que não reconhece após salvar
- [x] Implementar soft delete ao invés de exclusão permanente
- [x] Criar aba de lixeira no admin para recuperar cadastros

## Correção UX Modal de Análise (v6.40)
- [x] Corrigir layout do modal de Análise do Aluno no mobile
- [x] Remover scroll horizontal e melhorar responsividade

## Melhorias Análise IA e Comparar Treinos (v6.41)
- [ ] Corrigir modal Comparar Treinos - palavras encavalando
- [x] Corrigir botão Comparar Eficiência que não funciona
- [x] Gerar Treino via IA - criar treino baseado nas recomendações
- [x] Compartilhar análise via WhatsApp
- [x] Histórico de análises de IA - salvar e acompanhar evolução
- [x] Exportar análise em PDF com UX elaborada

## Correção Modal Análise (v6.42)
- [x] Corrigir layout do modal de Análise - texto cortado no mobile
- [x] Remover botão de WhatsApp do modal de análise
- [x] Corrigir erro ao comparar treinos

## Melhoria Formatação Análise (v6.43)
- [x] Remover caracteres markdown da análise de comparação de treinos
- [x] Deixar texto mais limpo e profissional

## Correção Página Planos (v6.44)
- [x] Restaurar página de Planos do Personal (para cobrar alunos)
- [x] Mover página de pricing para /planospersonal

## Planos e Upgrade (v6.45)
- [x] Criar preços na Cakto com desconto 20% anual
- [ ] Configurar links de checkout corretos
- [x] Indicador visual do plano atual no dashboard
- [x] Funcionalidade de upgrade de plano pela plataforma

## Bugs Portal do Aluno e Evolução v6.46
- [x] Modal de edição de medidas no portal do aluno - calendário e campos fechando automaticamente
- [x] Erro 404 ao clicar no lápis para editar medidas no lado do personal
- [x] Adicionar gráfico de Cálculos Automáticos visível fora do modal de edição
- [ ] Ajustar UX da tela de medidas corporais
- [x] Modal de Análise do Aluno (lado do personal) - atualizar layout igual aos outros modais


## Bugs Portal do Aluno e Evolução (v4.4)
- [x] Modal de edição de medidas no portal do aluno - calendário e campos fechando automaticamente
- [x] Erro 404 ao editar medidas no lado do personal (botão de lápis)
- [x] Adicionar gráfico de Cálculos Automáticos visível fora do modal (para aluno e personal)
- [x] Modal de Análise do Aluno (lado do personal) - atualizar layout igual aos outros (PENDENTE - próxima tarefa)

## Funcionalidade Logar como Aluno (v6.47)
- [x] Botão "Logar como Aluno" no portal do personal (movido para dropdown do usuário)
- [x] Removido "Portal do Aluno" do menu lateral esquerdo
- [x] Personal pode acessar o portal do aluno como seu próprio aluno

## Card Visual Cálculos Automáticos (v6.48)
- [x] Criar card visual com fundo verde claro igual à imagem de referência
- [x] 4 quadrantes: IMC + classificação, BF Estimado, Massa Gorda Est., Massa Magra Est.
- [x] Estilo visual igual ao print enviado (cores verde, laranja, azul)

## Bug Login Portal do Aluno (v6.48)
- [x] Corrigir login do portal do aluno para usar aluno existente pelo email ao invés de criar novo


## Correções v6.49
- [x] Links dos planos anuais não funcionam (botão "Ver plano anual" na página de planos)
- [x] Corrigir modal Comparar Treinos - palavras encavalando
- [x] Ajustar UX da tela de medidas corporais - card de cálculos automáticos visível
- [x] Upgrade de plano deve cobrar apenas a diferença (proration), não o valor cheio do novo plano


## Integração Cakto Completa (v6.50)
- [x] Webhook do Cakto para atualizar personal_subscriptions
- [x] Configurar URLs dos planos anuais no Cakto
- [x] Testar fluxo completo de upgrade com proration

## Planos Anuais e Upgrades (v6.51)
- [x] Criar estrutura de planos anuais completos
- [x] Criar variáveis de upgrade para todas as combinações (mensal → mensal, mensal → anual, anual → anual)
- [x] Atualizar interface para mostrar opções de upgrade anual
- [x] Criar ofertas anuais no Cakto via API (IDs: 38m8qgq, 3bz5zr8, q6oeohx, 32e6rsr, ndnczxn)
- [x] Toggle Mensal/Anual na seção de upgrade
- [x] Mostrar economia anual em cada card de plano
- [x] Botões de checkout funcionando para planos anuais


## Correção Integração Stevo (v4.5)
- [x] Corrigir integração Stevo - usar endpoint /chat/send/text com header 'token'
- [x] Atualizar formato do body para usar Phone e Body (não number/textMessage)
- [x] Atualizar campos de configuração do Stevo na página Settings (Token e Instance ID)
- [x] Atualizar logomarca do FitPrime em todo o sistema


## Webhook Stevo
- [ ] Criar endpoint público /api/webhook/stevo para receber mensagens
- [ ] Processar mensagens recebidas e identificar alunos
- [ ] Responder automaticamente confirmações de pagamento


## Correção Integração Stevo (v4.3)
- [x] Corrigir endpoint de envio de mensagem (/chat/send/text)
- [x] Corrigir header de autenticação (token ao invés de apikey)
- [x] Corrigir formato do body (Phone e Body ao invés de number/textMessage)
- [x] Atualizar campos de configuração na página Settings (Token e Instance ID)
- [x] Criar endpoint webhook /api/webhook/stevo para receber mensagens
- [x] Implementar handler para processar mensagens recebidas
- [x] Detectar confirmações de pagamento automaticamente
- [x] Adicionar instruções de configuração do webhook na página Settings
- [x] Criar testes unitários para detecção de pagamento
- [x] Atualizar logomarca do FitPrime em todo o sistema


## Atualização Stevo - URL Dinâmica (v4.3)
- [ ] Adicionar campo servidor no schema (stevoServer)
- [ ] Adicionar campo servidor na página de Configurações
- [ ] Atualizar stevo.ts para usar URL dinâmica baseada no servidor
- [ ] Testar envio de mensagem com nova configuração


## Correção Integração Stevo (v4.6)
- [x] Corrigir URL base da API Stevo (usar servidor dinâmico: sm12, sm15, sm16, etc.)
- [x] Adicionar campo "Servidor" na página de Configurações
- [x] Atualizar instruções de como encontrar o servidor na URL do Stevo
- [x] Atualizar stevo.ts para usar URL dinâmica baseada no servidor
- [x] Adicionar campo stevoServer no schema do banco
- [x] Criar testes unitários para configuração de URL
- [x] Testar envio de mensagem via API (funcionando com sm15)

## Melhorias WhatsApp/Stevo (v4.7)
- [x] Remover/renomear botão "Conectar WhatsApp" que causa confusão
- [x] Melhorar status da conexão (mostrar se está funcionando)
- [x] Criar painel de mensagens do WhatsApp para ver conversas dos alunos (já existia)
- [x] Armazenar mensagens recebidas via webhook no banco de dados (já existia)
- [x] Interface para visualizar histórico de mensagens por aluno (já existia)
- [x] Adicionar botão de envio manual nas automações
- [x] Permitir disparar automação manualmente para um aluno específico

## Melhorias WhatsApp/Stevo (v4.8)
- [x] Adicionar filtro de alunos no modal de envio manual de automações
- [x] Lista com checkboxes para selecionar alunos específicos
- [x] Opção "Selecionar todos" / "Desmarcar todos"
- [x] Melhorar integração WhatsApp na página de Mensagens
- [x] Permitir conversar em tempo real via WhatsApp (mensagens enviadas no chat são enviadas via Stevo)

## Chat WhatsApp Completo (v4.9)
- [x] Interface de chat estilo WhatsApp Web (já existia)
- [x] Lista de conversas com alunos na lateral (já existia)
- [x] Área de mensagens com histórico completo (já existia)
- [x] Envio de mensagens via Stevo para WhatsApp do aluno
- [x] Recebimento de mensagens via webhook do Stevo (agora salva TODAS as mensagens)
- [x] Indicador de mensagens não lidas (já existia)
- [x] Notificação de novas mensagens (já existia)
- [x] Suporte a mídia (imagens, áudios, documentos) (já existia)
- [x] Campo 'source' para identificar origem da mensagem (whatsapp/internal)
- [x] Indicador visual de WhatsApp nas mensagens

## IA de Atendimento Super Humanizada (v5.0)
### Infraestrutura
- [x] Schema de configuração da IA (nome, tom, personalidade)
- [x] Tabela de histórico de conversas da IA
- [x] Tabela de leads (visitantes não cadastrados)
- [x] Sistema de memória de longo prazo
### Engine de IA
- [x] Prompt system super humanizado e contextual
- [x] Contexto rico do aluno (treinos, medidas, anamnese, sessões, pagamentos)
- [x] Contexto de lead (informações coletadas, interesse, histórico)
- [x] Detecção de intenção (dúvida, agendamento, reclamação, etc)
- [x] Escalação automática para o personal
- [x] Delay humanizado nas respostas
### Modo Lead (Conversão)
- [x] Apresentação do personal e serviços
- [x] Coleta inteligente de informações
- [x] Agendamento de avaliação gratuita
- [x] Follow-up automático de leads não convertidos
- [x] Qualificação de leads (quente/morno/frio)
### Modo Aluno (Atendimento)
- [x] Respostas sobre treinos e exercícios
- [x] Dúvidas sobre dieta e suplementação
- [x] Agendamento/reagendamento de sessões
- [x] Motivação personalizada baseada no progresso
- [x] Lembretes inteligentes
- [x] Suporte a cobranças e pagamentos
### Configurações do Personal
- [x] Nome da IA
- [x] Tom de comunicação (formal/casual/motivacional)
- [x] Horário de atendimento automático
- [x] Mensagens personalizadas (boas-vindas, despedida)
- [x] Regras de escalação para humano
- [x] Ativar/desativar IA por aluno
### Integração WhatsApp
- [x] Resposta automática via webhook do Stevo
- [x] Identificação automática de lead vs aluno
- [x] Transição suave IA -> Personal
- [x] Menu lateral com link para IA de Atendimento

## Bugs Reportados (03/01/2026)
- [x] Mensagens duplicadas no chat (webhook salvando mesma mensagem 2x)
- [x] IA não está respondendo mensagens do WhatsApp

## Melhorias IA de Atendimento (v5.1)
- [ ] Preenchimento automático com IA nos campos de configuração
  - [ ] Botão "Preencher com IA" para gerar sugestões baseadas no perfil do personal
  - [ ] Bio do personal
  - [ ] Serviços oferecidos
  - [ ] Descrição de horários
  - [ ] Faixa de preço
  - [ ] Mensagem de boas-vindas para leads
  - [ ] Mensagem de boas-vindas para alunos
  - [ ] Mensagem de ausência
- [ ] Melhorar UX da configuração de mensagem de ausência
- [ ] Personalização do tom e personalidade da IA

## Melhorias IA de Atendimento (03/01/2026)
- [x] Botão "Preencher Tudo com IA" no card Sobre Você
- [x] Botões "Sugerir" individuais em cada campo de texto
- [x] Endpoint generateSuggestions no backend
- [x] Teste unitário para geração de sugestões
- [x] Testar preenchimento automático em produção

## Bugs Reportados (03/01/2026 - 17:45)
- [ ] IA parou de responder mensagens do WhatsApp
- [ ] Usuário não encontrou botões de preenchimento automático
- [ ] IA demora muito para responder no WhatsApp
- [ ] Interferência entre Chat Interno (FitPrime) e Chat WhatsApp
- [ ] Separar Chat Interno do Chat WhatsApp - mensagens do WhatsApp não devem aparecer no Chat Interno

## Chat e WhatsApp v5.1
- [x] Opção de ativar IA no Chat Interno do FitPrime
- [x] Resposta manual no WhatsApp (campo de texto para personal responder)

## Bugs v5.2
- [ ] Mensagens do WhatsApp real não estão sincronizadas com a interface
- [ ] Webhook Stevo: capturar evento SEND_MESSAGE (mensagens enviadas pelo personal via WhatsApp)

## Integração Evolution API (03/01/2026)
- [x] Criar endpoint /api/webhook/evolution para receber webhooks da Evolution API Cloud
- [x] Configurar Evolution API Cloud com webhook para capturar evento SEND_MESSAGE
- [x] Processar mensagens enviadas pelo personal via WhatsApp (fromMe: true)
- [x] Processar mensagens recebidas do aluno via WhatsApp
- [ ] Publicar para ativar webhook em produção


## Separação de Chats - WhatsApp vs Interno (v9.1)
- [ ] Criar página "WhatsApp Mensagens" - chat dedicado para WhatsApp
  - [ ] Lista de conversas WhatsApp (alunos com telefone)
  - [ ] Envio e recebimento de mensagens via Stevo
  - [ ] Indicador de mensagens não lidas
  - [ ] Histórico de conversas WhatsApp
- [ ] Renomear "WhatsApp" atual para "WhatsApp Estatísticas"
  - [ ] Dashboard de métricas de mensagens
  - [ ] Total enviadas/recebidas
  - [ ] Taxa de entrega
  - [ ] Gráficos de uso
- [ ] Ajustar "Chat FitPrime" para ser apenas interno
  - [ ] Remover opção de enviar via WhatsApp
  - [ ] Comunicação apenas dentro do app
  - [ ] Notificações internas
- [ ] Atualizar navegação do menu lateral
  - [ ] Chat FitPrime (interno)
  - [ ] WhatsApp Mensagens (chat WhatsApp)
  - [ ] WhatsApp Estatísticas (métricas)


## Separação de Chats - WhatsApp vs Interno (v9.0)
- [x] Criar página WhatsApp Mensagens (chat dedicado WhatsApp)
- [x] Criar página WhatsApp Estatísticas (métricas e análises)
- [x] Atualizar menu lateral com as novas opções
- [x] Ajustar Chat FitPrime para ser apenas interno (removida aba WhatsApp duplicada)
- [x] Testar todas as funcionalidades
- [x] Reverter para Stevo (Evolution API não funcionou)


## Bugs WhatsApp (v9.1)
- [x] Mensagens enviadas via WhatsApp não aparecem na aba WhatsApp Mensagens (corrigido: source agora é 'whatsapp' quando envia via WhatsApp)
- [ ] Respostas dos alunos via WhatsApp não são recebidas no sistema (webhook precisa estar configurado corretamente no domínio publicado)

## Bugs Automações (v9.2)
- [x] Erro "Maximum update depth exceeded" ao enviar mensagem manual das automações (corrigido: useMemo para filteredStudents)

## Melhorias WhatsApp Mensagens (v9.3)
- [x] Envio em massa para múltiplos alunos
- [x] Seleção de alunos para envio
- [x] Aviso informativo que só envia, não recebe
- [x] Sugestão de estratégia de uso
- [x] Mostrar mensagens de automação na aba WhatsApp

## Bugs/Melhorias WhatsApp (v9.4)
- [x] Corrigir scroll no modal de envio em massa (aumentada altura para 250px)
- [x] Adicionar estatísticas de automações na página WhatsApp Estatísticas

## IA de Atendimento (v9.5)
- [x] Adicionar indicador BETA (não usar) na página de IA de Atendimento
- [x] Bloquear toggle interno de IA quando não liberado pelo Super Admin

## Perfil do Aluno - Aba Fotos
- [x] Analisar subtópicos da aba Fotos (Visão Geral, Fotos, Medidas, Treinos)
- [x] Identificar funcionalidades únicas em cada subtópico
- [x] Integrar funcionalidades únicas nas abas principais
- [x] Remover subtópicos duplicados

## Melhorias na Evolução e Treinos
- [x] Adicionar gráfico de evolução de carga na aba Treinos do perfil do aluno
- [x] Unificar aba Evolução com métricas de treino (progresso de cargas)
- [x] Adicionar botão de acesso rápido às fotos na aba Evolução


## Estatísticas de Sessão no Portal do Aluno (v12.0)
- [x] Adicionar endpoint sessionStats no studentPortal (taxa de presença, sessões realizadas, faltas, este mês)
- [x] Adicionar KPIs de frequência no Portal do Aluno (igual ao StudentProfile do Personal)
- [x] Adicionar gráfico de frequência mensal no Portal do Aluno (presenças vs faltas)
- [x] Adicionar gráfico de evolução de peso no Portal do Aluno (já existia)
- [x] Adicionar gráfico de composição corporal no Portal do Aluno (já existia)
- [x] Adicionar gráfico de circunferências no Portal do Aluno (já existia)
- [x] Adicionar gráfico de evolução de carga por exercício no Portal do Aluno (já existia no StudentTrainingDashboard)


## Atualização Central de Ajuda e Aba Fotos (v12.1)
- [x] Atualizar Central de Ajuda do Personal com novidades das estatísticas de sessão
- [x] Atualizar Central de Ajuda do Aluno com novidades das estatísticas de sessão
- [x] Ajustar aba Fotos no Portal do Aluno para ter mesmo layout do Personal (abas Visão Geral e Fotos)


## Módulo FitPrimeNutrition
- [x] Pesquisar principais softwares de nutrição do mercado brasileiro
- [x] Analisar funcionalidades e preços dos concorrentes
- [x] Elaborar relatório comparativo de concorrentes
- [ ] Implementar menu FitPrimeNutrition no sidebar
- [ ] Criar verificação de permissão (CRN cadastrado)
- [ ] Criar página inicial do módulo com sub-seções
- [x] Criar documento de especificação completo do FitPrime Nutrition

### Implementação FitPrime Nutrition BETA
- [x] Adicionar campo nutritionBetaEnabled no schema (personals)
- [x] Criar controle no Super Admin para liberar/bloquear Nutrition BETA
- [x] Adicionar menu FitPrime Nutrition no sidebar com badge BETA
- [ ] Criar página inicial (Dashboard) do módulo Nutrition
- [ ] Criar página de Pacientes (integrada com Alunos)
- [ ] Criar página de Planos Alimentares
- [ ] Criar página de Alimentos
- [ ] Criar página de Receitas
- [ ] Criar página de Avaliação Nutricional
- [ ] Criar página de Evolução
- [ ] Criar anamnese complementar de nutrição (campos que faltam)
- [ ] Criar página de Exames
- [ ] Criar página de Orientações
- [ ] Criar página de Configurações Nutrição


## FitPrime Nutrition - Módulo de Nutrição (v3.5)

### Infraestrutura
- [x] Schema do banco de dados para nutrição (foods, recipes, meal_plans, assessments, etc.)
- [x] Router tRPC completo para nutrição (nutritionRouter.ts)
- [x] Integração com sistema de alunos existente

### Banco de Alimentos
- [x] Página de Alimentos (FoodsPage.tsx)
- [x] Listagem de alimentos com busca e filtros
- [x] Informações nutricionais (calorias, proteína, carboidratos, gorduras)
- [x] Suporte a bancos TACO e USDA
- [x] Cadastro de alimentos personalizados

### Planos Alimentares
- [x] Página de Planos Alimentares (MealPlansPage.tsx)
- [x] Listagem de planos com status
- [x] Criação de planos por paciente
- [x] Página de detalhes do plano (MealPlanDetailPage.tsx)
- [x] Geração de plano com IA (integração LLM)
- [x] Cálculo automático de macros

### Receitas
- [x] Página de Receitas (RecipesPage.tsx)
- [x] Cadastro de receitas com ingredientes
- [x] Cálculo nutricional automático baseado nos ingredientes
- [x] Categorização de receitas

### Pacientes/Alunos
- [x] Página de Pacientes (PatientsPage.tsx)
- [x] Integração com sistema de alunos existente
- [x] Página de detalhes do paciente (PatientDetailPage.tsx)
- [x] Visualização de planos, avaliações e exames

### Avaliação Nutricional
- [x] Página de Avaliação Nutricional (AssessmentPage.tsx)
- [x] Registro de peso, altura, IMC
- [x] Cálculo de TMB (Mifflin-St Jeor, Harris-Benedict, etc.)
- [x] Cálculo de GET (Gasto Energético Total)
- [x] Distribuição de macros

### Evolução Nutricional
- [x] Página de Evolução (EvolutionPage.tsx)
- [x] Gráficos de evolução de peso
- [x] Gráficos de evolução de IMC
- [x] Gráficos de evolução de BF%
- [x] Comparativo temporal

### Anamnese Nutricional
- [x] Página de Anamnese (AnamnesisPage.tsx)
- [x] Histórico alimentar
- [x] Hábitos alimentares
- [x] Preferências e restrições
- [x] Alergias e intolerâncias
- [x] Saúde digestiva
- [x] Cozinha e rotina
- [x] Orçamento alimentar
- [x] Objetivos nutricionais

### Exames Laboratoriais
- [x] Página de Exames (ExamsPage.tsx)
- [x] Registro de exames laboratoriais
- [x] Interpretação com IA
- [x] Valores de referência
- [x] Histórico de exames

### Configurações
- [x] Página de Configurações (NutritionSettingsPage.tsx)
- [x] Fórmula de TMB padrão
- [x] Fator de atividade padrão
- [x] Distribuição de macros padrão
- [x] Proteína por objetivo (perda, ganho, manutenção)
- [x] Ajustes calóricos (déficit/superávit)
- [x] Preferências de exibição
- [x] Notificações

### Dashboard de Nutrição
- [x] Página principal do módulo (NutritionDashboard.tsx)
- [x] Cards de acesso rápido aos módulos
- [x] Estatísticas gerais (planos, receitas, avaliações)
- [x] Banner de integração treino + nutrição
- [x] Controle de acesso (feature flag beta)



### FitPrime Nutrition - Próximos Passos (v13.0)
- [x] Importar banco de alimentos TACO (Tabela Brasileira de Composição de Alimentos)
  - [x] Script de importação (scripts/seed-taco-drizzle.mjs)
  - [x] 597 alimentos importados com dados nutricionais completos
  - [x] Categorias: Carnes, Verduras, Frutas, Cereais, Pescados, Laticínios, etc.
- [ ] Importar banco de alimentos USDA (dados internacionais) - pendente
- [x] Criar templates de planos alimentares pré-definidos
  - [x] Low Carb - Redução de Carboidratos
  - [x] Cutting - Definição Muscular
  - [x] Bulking - Ganho de Massa
  - [x] Manutenção - Equilíbrio
  - [x] Cetogênica - Keto
  - [x] Vegetariano - Sem Carne
  - [x] Alto Proteína - Hipertrofia
  - [x] Jejum Intermitente 16:8
  - [x] Recomposição Corporal
  - [x] Performance Esportiva
- [x] Integrar nutrição com treinos (ajuste automático de macros por tipo de treino)
  - [x] Perfis de nutrição por tipo de treino (8 perfis)
  - [x] Treino de Força/Hipertrofia (+300 kcal, +50g carbs)
  - [x] Cardio Baixa Intensidade (+100 kcal)
  - [x] Cardio Alta Intensidade/HIIT (+250 kcal, +40g carbs)
  - [x] Treino Misto (+350 kcal, +60g carbs)
  - [x] Dia de Descanso (-200 kcal, -30g carbs)
  - [x] Recuperação Ativa (neutro)
  - [x] Treino Esportivo (+400 kcal, +80g carbs)
  - [x] Dia de Competição (+500 kcal, +100g carbs)
  - [x] Endpoints tRPC para cálculo de macros ajustados
  - [x] Visão semanal de treino x nutrição
  - [x] Timing nutricional (pré/pós-treino)
  - [x] Recomendações por tipo de treino


## Auditoria para Lançamento (v13.1)
- [x] Varredura completa de todas as páginas do sistema
- [x] Análise de código frontend
- [x] Documentação de bugs e problemas
- [x] Correção: Redirect /students para /alunos
- [x] Relatório final de auditoria (AUDIT_REPORT_FINAL.md)

## Sistema de Login Próprio (v13.2)
- [ ] Criar página de login própria para Personal Trainers (email/senha)
- [ ] Ajustar página de login do Aluno (já existe parcialmente)
- [ ] Remover referências ao Manus/OAuth externo
- [ ] Esconder domínios do Manus na interface
- [ ] Implementar autenticação JWT própria para personais
- [ ] Testar fluxo completo de login (personal e aluno)


## Sistema de Login Próprio (v5.1)
- [x] Página de login própria para Personal Trainers (/login-personal)
- [x] Formulário de cadastro de Personal com email/senha
- [x] Recuperação de senha para Personal
- [x] Página de login do Aluno já existente (/login-aluno)
- [x] Remover redirecionamento para OAuth do Manus
- [x] Remover referências ao Manus no frontend
- [x] Atualizar DashboardLayout para usar login próprio
- [x] Atualizar useAuth para usar login próprio


## Personalização de Login (v5.2)
- [x] Adicionar logo FitPrime nas páginas de login
- [x] Ajustar cores conforme identidade visual (verde emerald/teal)
- [x] Melhorar branding geral das páginas de autenticação


## Bug Login Personal (v5.3)
- [x] Permitir login de contas criadas via OAuth (sem senha cadastrada)
- [x] Criar fluxo para definir senha em contas existentes
- [x] Enviar código de ativação por email para definir senha


## Bug Login Após Definir Senha (v5.4)
- [x] Após definir senha, fazer login automático
- [x] Redirecionar diretamente para o dashboard (não para tela intermediária)
- [x] Remover tela intermediária desnecessária


## Bug Modal Nova Medição Fechando (v5.5)
- [ ] Modal de Nova Medição fecha automaticamente ao digitar
- [ ] Corrigir na área do aluno (StudentEvolution)
- [ ] Corrigir na área do personal (StudentProfile/Evolution)


## Bug Crítico Corrigido (v3.7)
- [x] Formulário de medidas perde foco e Accordion fecha ao digitar
  - Causa: MeasurementFormFields era uma função inline que recriava o componente a cada re-render
  - Solução: Convertido para variável JSX (measurementFormFieldsJSX) evitando re-criação


## Novas Funcionalidades (v3.8)
- [x] Comparativo entre métodos de BF
  - [x] Visualização comparando BF estimado vs bioimpedância vs adipômetro
  - [x] Card mostrando diferenças entre métodos com média
  - [x] Classificação automática (Essencial, Atleta, Fitness, Aceitável, Obesidade)
- [x] Exportar PDF funcional
  - [x] Funcionalidade de exportar relatório do aluno em PDF funcionando
  - [x] Inclui dados pessoais, anamnese, medidas, histórico de exercícios e treinos


## Reorganização de Gráficos e Estatísticas (v3.9)
- [x] Analisar estrutura atual das abas no Portal do Aluno
- [x] Analisar estrutura atual das abas na área do Personal
- [x] Mover "Evolução das Medidas" da aba Fotos para aba Evolução (Portal do Aluno)
- [x] Verificar e corrigir posição de gráficos na área do Personal
- [x] Garantir que cada aba tenha apenas conteúdo relevante


## Melhorias nos Gráficos de Evolução (v4.0)
- [x] Filtros de período (Hoje, Ontem, 1 semana, 15 dias, 30 dias, 3 meses, 6 meses, 1 ano, todo período)
- [x] Dados individuais detalhados de cada medida (aba Detalhes com histórico completo)
- [x] Cards de resumo com variação por medida (Peso, % Gordura, Cintura)
- [x] Gráficos separados por categoria (peso, circunferências, composição)
- [x] Tooltips mais informativos (data e valores)
- [ ] Indicadores de tendência (subindo, descendo, estável)
- [ ] Comparativo primeira vs última medição
- [ ] Metas e objetivos nos gráficos


## Sistema de Cardio no Diário do Maromba (v14.0)
- [x] Schema do banco de dados para cardio_logs
  - [x] Tipo de cardio (corrida, bike, elíptico, esteira, natação, etc.)
  - [x] Duração (minutos)
  - [x] Distância (km)
  - [x] Calorias queimadas
  - [x] Frequência cardíaca média/máxima
  - [x] Intensidade (leve, moderada, intensa, HIIT)
  - [x] Observações
- [x] Endpoints tRPC para cardio
  - [x] createCardioLog
  - [x] updateCardioLog
  - [x] deleteCardioLog
  - [x] getCardioLogs (por aluno/período)
  - [x] getCardioStats (estatísticas)
- [x] Aba Cardio no Diário do Maromba (Personal)
  - [x] Formulário de registro de cardio
  - [x] Lista de registros de cardio
  - [x] Estatísticas de cardio (total km, calorias, tempo)
- [x] Aba Cardio no Portal do Aluno
  - [x] Formulário de registro de cardio
  - [x] Histórico de cardio
  - [x] Estatísticas pessoais
- [x] Gráficos de Cardio na Evolução
  - [x] Resumo de cardio no Dashboard do Diário
  - [x] Distribuição por tipo de cardio
  - [x] Estatísticas de sessões, tempo, distância e calorias
  - [x] Frequência cardíaca média


## Correção Login Personal (v4.0)
- [x] Corrigir bug de login do Personal Trainer que redirecionava para tela de login
- [x] Usar SDK createSessionToken ao invés de jsonwebtoken para gerar token de sessão
- [x] Garantir compatibilidade do token com o sistema de autenticação OAuth

## Integração com Dispositivos Fitness (v4.1) - CANCELADO
- [x] Pesquisa de APIs realizada (Strava, Garmin, Apple Health)
- [x] Decisão: não implementar integração com relógios por enquanto

## Relatórios de Cardio por Período (v4.2)
- [x] Gráficos de evolução temporal de distância
- [x] Gráficos de evolução temporal de tempo
- [x] Gráficos de evolução de frequência cardíaca
- [x] Gráficos de frequência de treinos
- [x] Distribuição por tipo de cardio (donut chart)
- [x] Comparativo entre períodos
- [x] Visão geral de todos os alunos
- [x] Top alunos em cardio
- [x] Filtros por aluno, período e agrupamento
- [x] Testes unitários implementados


## Bug de Redirecionamento após Login (v4.0.1)
- [x] Dashboard não carrega após login - precisa atualizar página manualmente
- [x] Invalidar cache do auth.me após login bem-sucedido
- [x] Garantir que o estado de autenticação seja atualizado antes do redirecionamento



## Estatísticas Cardio e Integração com IA (v4.3)
- [x] Adicionar aba de Estatísticas Cardio no Diário de Treino
- [x] Mostrar gráficos de evolução na aba de estatísticas
- [x] Interligar dados de cardio com análises de evolução do aluno
- [x] Integrar cardio na análise da IA para treinos melhorados
- [x] Sincronizar cardio com outras métricas (medidas, treinos, etc)

## Exportar Relatório de Cardio em PDF (v4.4)
- [x] Botão de exportar PDF na aba Estat. Cardio
- [x] Gerar PDF com gráficos e estatísticas de cardio
- [x] Incluir KPIs, evolução e distribuição por tipo
- [x] Compartilhar com o aluno

## Bug Relatório Cardio (v4.4.1)
- [x] Corrigir relatório de cardio que não exibe dados dos alunos

## Layout Análise do Aluno (v4.4.2)
- [ ] Centralizar informações verticalmente na janela de análise
- [ ] Remover necessidade de scroll lateral

## Layout Análise do Aluno (v4.4.2)
- [x] Centralizar informações verticalmente na janela de análise
- [x] Remover necessidade de scroll lateral

## Configuração DNS Resend (v4.4.3)
- [x] Adicionar seção de configuração DNS do Resend no painel admin
- [x] Mostrar registros DNS necessários para configurar domínio
- [x] Incluir instruções de configuração

## Correções SEO Landing Page (v4.4.4)
- [x] Adicionar título H1 na página inicial
- [x] Adicionar títulos H2 nas seções
- [x] Adicionar palavras-chave relevantes
- [x] Ajustar título da página (30-60 caracteres)

## Configuração de Email com Domínio Próprio (v4.4.5)
- [x] Identificar todos os pontos de envio de email no sistema
- [x] Atualizar remetente para noreply@fitprimemanager.online
- [x] Atualizar remetente de cobranças para cobranca@fitprimemanager.online
- [x] Testar envio de emails com novo domínio


## Templates de Email Personalizáveis (v4.1)
- [x] Schema do banco para templates de email
- [x] Endpoints tRPC para gerenciar templates (CRUD)
- [x] Página de administração de emails no Super Admin (/admin/emails)
- [x] Integração com serviço de email (usa template do banco se existir)
- [x] Templates padrão para: convite, boas-vindas, lembrete de sessão, recuperação de senha, lembrete de pagamento, ativação de compra
- [x] Preview de email com variáveis substituídas
- [x] Envio de email de teste
- [x] Variáveis dinâmicas: {{studentName}}, {{personalName}}, {{inviteLink}}, etc.


## Templates de Email Profissionais (v14.1)
- [ ] Criar templates HTML profissionais com logo FitPrime
- [ ] Template de Convite para Aluno (com emojis e design atraente)
- [ ] Template de Boas-vindas ao Aluno
- [ ] Template de Lembrete de Sessão
- [ ] Template de Recuperação de Senha
- [ ] Template de Lembrete de Pagamento
- [ ] Template de Ativação de Compra
- [ ] Testar envio de email para brunogiordany@gmail.com


## Templates de Email Profissionais (v4.2)
- [x] Adicionar logo FitPrime no cabeçalho de todos os emails
- [x] Melhorar textos com emojis e design visual dark mode
- [x] Criar design profissional para template de Convite
- [x] Criar design profissional para template de Boas-vindas
- [x] Criar design profissional para template de Lembrete de Sessão
- [x] Criar design profissional para template de Recuperação de Senha
- [x] Criar design profissional para template de Lembrete de Pagamento
- [x] Criar design profissional para template de Ativação de Compra
- [x] Adicionar botão "Restaurar Padrões" na página de admin emails
- [x] Testar envio de email para brunogiordany@gmail.com

## Melhorias Templates de Email (v4.7)
- [x] Adicionar seção com lista completa de variáveis disponíveis na página de Templates de Email
- [x] Criar editor visual simplificado para editar templates sem código HTML

- [x] Adicionar lista de variáveis de email em local estratégico e visível na página de Templates de Email

## Bugs e Melhorias Portal do Aluno (v4.8)
- [x] Bug: Email de convite não está sendo enviado ao cadastrar aluno - LOGS ADICIONADOS PARA DEBUG
- [x] Bug: Anamnese duplicada - aluno precisa preencher 2x (erro na primeira)
- [x] Adicionar campos de circunferências na anamnese do aluno (cintura, peito, braços, pernas, etc.)
- [x] Cálculo automático de TMB (Taxa Metabólica Basal)
- [x] Cálculo automático de TDEE (Gasto Energético Diário Total)
- [ ] Cálculo de kcal diárias recomendadas baseado no objetivo
- [ ] Painel de recomendações personalizadas para o aluno:
  - [ ] Quantidade de kcal diárias para atingir objetivo
  - [ ] Sugestão de cardio necessário
  - [ ] Recomendações de treino
- [x] Bug: Cálculos automáticos (BF, Massa Gorda, Massa Magra) não aparecem na visualização das Medidas Corporais (só na edição)
- [x] Bug UX: Modal Preview das Sessões - botões sendo tampados pelo conteúdo (precisa de scroll ou footer fixo)
- [x] Bug: Cardio triplicado ao registrar (aparece 3x ao invés de 1x) - NÃO ERA BUG, usuário confundiu

- [x] Bug UX: Preview das Sessões - botão tampado pela preview do treino (precisa ajustar layout)
- [x] Bug: Diário do Maromba - encavalamento de informações no mobile (iPhone 15 Pro Max)
- [x] Planos mensais pré-definidos de fábrica (1x a 6x semana) - IMPLEMENTADO

## Correções de UX Mobile (v4.2)
- [x] BUG: Modal de registro do Diário do Maromba com UX quebrada no mobile (muito grande, sem botão X, sem scroll)
- [x] BUG: Mesmo problema no Portal do Aluno
- [x] Corrigir DialogContent para suporte mobile (full screen com safe area)
- [x] Botão X de fechar sempre visível e acessível
- [x] Scroll interno no conteúdo do modal
- [x] Footer fixo com botões de ação

## Modo Offline (v4.3)
- [ ] Service Worker para cache de assets e páginas
- [ ] IndexedDB para armazenamento local de treinos pendentes
- [ ] Fila de sincronização para enviar dados quando online
- [ ] Indicador visual de status offline/online
- [ ] Indicador de treinos pendentes de sincronização
- [x] Sincronização automática ao recuperar conexão
- [ ] Notificação de sucesso/erro na sincronização


## Modo Offline (v4.3)
- [x] Service Worker configurado com vite-plugin-pwa
- [x] Sistema de armazenamento local com IndexedDB
- [x] Hook useOfflineSync para gerenciar sincronização
- [x] Indicadores visuais de status offline/sync
- [x] Sincronização automática ao voltar online
- [x] Testes unitários do sistema offline

## Cache de Treinos Offline (v4.4)
- [x] Expandir offlineStorage.ts para suportar cache de treinos
- [x] Pré-carregar treinos do aluno ao fazer login no Portal
- [x] Armazenar treinos completos (dias, exercícios) no IndexedDB
- [x] Exibir treinos do cache quando offline
- [x] Indicador visual de "treino em cache" vs "treino online"
- [x] Sincronização automática quando voltar online

## Modo de Treino Offline Completo (v4.5)
- [x] Expandir offlineStorage para registros de treino do personal
- [ ] Atualizar useOfflineSync para sincronizar registros de ambos os perfis
- [ ] Modo offline no Diário do Maromba (Personal)
  - [ ] Salvar registros localmente quando offline
  - [ ] Indicador de treinos pendentes de sincronização
  - [x] Sincronização automática ao voltar online
- [ ] Modo offline no Portal do Aluno
  - [ ] Salvar registros de treino localmente quando offline
  - [ ] Indicador de treinos pendentes de sincronização
  - [x] Sincronização automática ao voltar online
- [ ] Indicadores visuais globais de status offline/pendentes


## Melhorias na Geração de Treinos com IA (Janeiro 2026)
- [ ] Adicionar botão "Gerar Novo" em cada exercício individual no preview do treino gerado
- [ ] Revisar e otimizar o prompt de geração de treinos para máxima qualidade
- [ ] Criar gerador inteligente de cardio baseado no objetivo do aluno
- [ ] Criar calculadora de kcal diárias baseada no objetivo e treino
- [ ] Integrar sugestões de cardio e kcal no fluxo de geração de treino


## Melhorias na Geração de Treinos com IA (v5.4)
- [x] Botão de regenerar exercício individual com IA (ícone sparkles roxo)
- [x] Endpoint regenerateExercise no backend com contexto completo do aluno
- [x] Botão "Gerar Cardio e Kcal" no preview do treino gerado
- [x] Endpoint generateCardioAndKcal com cálculo de TMB e macros
- [x] Modal completo de recomendação de cardio e nutrição
- [x] Botão de copiar recomendação para clipboard


## Pendências Críticas - 06/01/2026

### BUGS A CORRIGIR
- [ ] P1: Duplicação de Medidas - Ao registrar medida no Portal do Aluno (Evolução > Novas Medidas), está duplicando/triplicando
- [ ] P2: Sincronização de Anamnese - Alterações feitas no Personal não aparecem no Portal do Aluno (frequência, ênfases musculares, restrições, cardio)
- [ ] P3: Circunferências no Portal do Aluno - Não aparecem para editar na anamnese, só em Evolução > Novas Medidas

### FEATURES A IMPLEMENTAR
- [ ] P4: Dashboard do Aluno no Personal - Colocar a dashboard do Portal do Aluno no topo do Dashboard do Personal com filtro por aluno (posição: abaixo do card do Plano, acima da Análise de Evolução Pendente)


## Correções Críticas - 06/01/2026

### P1 - Duplicação de Medidas no Portal do Aluno
- [x] Adicionado proteção contra clique duplo no botão de salvar medida
- [x] Adicionado invalidação de cache após criar medida (evita duplicação visual)
- [x] Botão desabilitado durante o salvamento com texto "Salvando..."

### P2 - Sincronização de Anamnese entre Personal e Aluno
- [x] Corrigido parsing de muscleEmphasis e trainingRestrictions no Portal do Aluno
- [x] Campos agora suportam tanto JSON arrays quanto strings separadas por vírgula
- [x] Função parseArrayField criada para tratar ambos os formatos

### P3 - Circunferências no Portal do Aluno
- [x] Verificado que circunferências são dados de medidas, não de anamnese
- [x] Circunferências já disponíveis em Evolução > Novas Medidas e Histórico
- [x] Design correto: anamnese = dados estáticos, medidas = dados que mudam

### P4 - Dashboard do Aluno no Portal do Personal
- [x] Criado componente StudentDashboardCard
- [x] Exibe: Total de Treinos, Volume Total, Total de Séries, Total de Reps
- [x] Filtro por aluno (dropdown "Todos os Alunos" ou aluno específico)
- [x] Gráfico de Treinos por Mês
- [x] Posicionado abaixo do card do Plano e acima de "Análise de Evolução Pendente"
- [x] Usa endpoint trainingDiary.dashboard existente


## Melhorias Dashboard de Treinos v15.1

### Métricas Adicionais no Dashboard
- [x] Média de treinos por semana
- [x] Comparativo com mês anterior (% variação)
- [x] Ranking dos alunos mais ativos (top 5)
- [x] Indicadores de tendência (setas up/down)

### Exportar Relatório de Evolução em PDF
- [x] Botão "Exportar PDF" no Dashboard de Treinos
- [x] PDF com gráficos de evolução do aluno selecionado
- [x] Incluir: dados pessoais, métricas de treino, gráfico de volume
- [x] Período customizável (último mês, 3 meses, 6 meses)

### Sistema de Alertas de Inatividade
- [x] Detectar alunos inativos (sem treino há X dias)
- [x] Card de alerta no Dashboard mostrando alunos inativos
- [x] Configuração de dias de tolerância (padrão: 7 dias)
- [x] Ação rápida para enviar mensagem ao aluno inativo



## Funil Quiz-3 (v4.2) - Nova Feature
- [ ] Criar página de introdução do funil com logo FitPrime
- [ ] Implementar quiz com 3 perguntas principais
- [ ] Pergunta 1: Segmentação (Profissão/Situação)
- [ ] Pergunta 2: Objetivo de faturamento
- [ ] Pergunta 3: Comprometimento/Disposição
- [ ] Criar página de processamento/carregamento
- [ ] Adicionar página de resultados com social proof
- [ ] Criar página de oferta com pricing
- [ ] Implementar página de checkout/confirmação
- [ ] Capturar respostas do quiz em banco de dados
- [ ] Armazenar emails dos leads
- [ ] Integrar com sistema de pagamento (Stripe)
- [ ] Implementar garantia de 30 dias
- [ ] Testes completos do fluxo de quiz
- [ ] Validar captura de leads
- [ ] Testar responsividade em mobile
- [ ] Deploy do funil para produção


## Correções Urgentes (v4.3)
- [x] BUG CRÍTICO: Portal do Aluno - Erro ao salvar anamnese (mainGoal enum incompleto)
- [x] Adicionar seção de Medidas Corporais na anamnese do Portal do Aluno (peso, altura, circunferências)
- [x] Reorganizar Configurações com navegação por abas e fazer Ver Plano ir direto para a seção correta

## Correções Urgentes - Automações WhatsApp (v4.4)
- [ ] BUG CRÍTICO: Variáveis não substituídas nas mensagens ({hora}, {valor}, {vencimento} aparecem como código)
- [ ] BUG CRÍTICO: Automações não disparam automaticamente (só funciona envio manual)


## Correções Urgentes - Automações WhatsApp (v4.7)
- [x] BUG: Variáveis não substituídas nas mensagens ({hora}, {valor}, {vencimento})
- [x] BUG: Automações não disparam automaticamente (só manual)
- [x] Criar worker de automações que roda a cada 15 minutos
- [x] Substituir todas as variáveis: {nome}, {telefone}, {email}, {hora}, {data_sessao}, {valor}, {vencimento}, {ano}, {data_aniversario}
- [x] Processar automaticamente: lembretes de sessão, lembretes de pagamento, pagamentos em atraso, aniversários


## Sistema de Afiliados Cakto (v4.8)
- [x] Investigar API de afiliados da Cakto - Documentado em docs/cakto-afiliados.md
- [ ] Testar fluxo de compra e envio de acesso ao pagante
- [x] BUG: Usuário já cadastrado não recebe notificação após compra (email/WhatsApp) - Adicionado envio de email de confirmação
- [ ] BUG: Testar fluxo com usuário novo (sem cadastro prévio)
- [ ] Implementar sistema de afiliados no backend
- [ ] Criar interface de gerenciamento de afiliados
- [ ] Configurar comissões e rastreamento

## Correções v4.8
- [x] BUG: Alunos excluídos (Julimar e Bruno ps) ainda aparecem na lista - verificar soft delete
- [ ] Exportar treino do aluno em PDF com dashboard de recomendações (macros, meta de peso, cardio)
- [x] Verificar/adicionar recomendação de cardio na geração de treino por IA (importante para saúde cardiovascular)


## Correções v4.8
- [x] BUG: Alunos excluídos (Julimar e Bruno ps) ainda aparecem na lista - verificar soft delete
- [x] Exportar treino do aluno em PDF com dashboard de recomendações
- [x] Verificar/adicionar recomendação de cardio na geração de treino por IA


## Bugs Reportados (09/01/2026)
- [x] Botão Exportar PDF no Dashboard de Treinos não funciona - CORRIGIDO (adicionado tratamento de erro e feedback)
- [x] Exportar treino em PDF no Portal do Aluno - ADICIONADO (botão na lista de treinos)
- [x] Cardio gerado pela IA sumia ao fechar modal - CORRIGIDO (agora salva automaticamente no banco de dados)
- [x] Valores de kcal divergentes entre IA e Dashboard (2800 vs 3612) - CORRIGIDO (alinhado fórmulas de Mifflin-St Jeor e fatores de atividade)
- [x] Criar tabela ai_recommendations para armazenar recomendações de cardio/nutrição
- [x] Recomendações de cardio/nutrição agora são salvas automaticamente e podem ser consultadas pelo aluno

## Integração Payt (Afiliados e Influenciadores) - v4.9
- [x] Criar endpoint de webhook /api/payt/webhook
- [x] Processar eventos: paid, subscription_activated, subscription_renewed, subscription_canceled
- [x] Ativar conta do personal quando pagamento confirmado
- [x] Enviar email de boas-vindas com link de ativação
- [x] Documentar configuração do webhook na Payt
- [ ] Criar links de checkout na Payt para cada plano
- [x] Lógica de comissão: apenas primeiro pagamento vai para afiliado
- [x] BUG: Erro ao gerar treino com IA - 'Unexpected token N, Nao is not valid JSON' - IA retornando texto em vez de JSON
- [x] Criar rota /apresentacao com apresentação de slides integrada e links de checkout corretos


## Correção Bug Geração IA - Laura (v2025.01.11)
- [x] Investigar erro "Unexpected token 'N', 'Nao' is not valid JSON" na geração de treino
- [x] Identificar campos problemáticos na anamnese da Laura (trainingRestrictions, muscleEmphasis, cardioActivities)
- [x] Criar função safeJsonParse para tratar JSON inválido
- [x] Aplicar safeJsonParse nos campos de anamnese do generateWithAI
- [x] Criar testes unitários para safeJsonParse
- [x] Todos os 15 testes passando


## Melhorias Anamnese e Cardio (v2025.01.11.2)
- [x] Validação do formulário de anamnese no frontend
  - [x] Garantir que trainingRestrictions seja salvo como JSON array
  - [x] Garantir que muscleEmphasis seja salvo como JSON array
  - [x] Garantir que cardioActivities seja salvo como JSON array estruturado
- [x] Script de migração de dados existentes
  - [x] Converter texto livre para JSON em trainingRestrictions
  - [x] Converter texto livre para JSON em muscleEmphasis
  - [x] Converter texto livre para JSON estruturado em cardioActivities
- [x] UX estruturada para atividades aeróbicas (já existia no código)
  - [x] Campos para tipo de atividade (corrida, natação, ciclismo, etc)
  - [x] Campo para frequência semanal
  - [x] Campo para duração em minutos
  - [x] Interface para adicionar/remover atividades


## Integração Cardio e Histórico de Evolução (v2025.01.11.3)
- [ ] Integrar dados de cardio da anamnese com módulo de registro de atividades
  - [ ] Mostrar atividades preferidas da anamnese no registro de cardio
  - [ ] Pré-preencher tipo de atividade baseado na anamnese
  - [ ] Comparar frequência real vs frequência planejada
- [ ] Histórico de evolução para atividades de cardio
  - [ ] Gráfico de evolução temporal (distância, tempo, calorias)
  - [ ] Comparativo mensal de atividades
  - [ ] Métricas de progresso (melhoria de pace, aumento de distância)
  - [ ] Dashboard resumido de cardio no perfil do aluno


## Integração Cardio e Histórico de Evolução (v4.3)
- [x] Integrar dados de cardio da anamnese com módulo de registro de atividades
  - [x] Criar query para buscar atividades preferidas da anamnese (preferredActivities)
  - [x] Comparar frequência real vs planejada na anamnese (complianceAnalysis)
  - [x] Exibir aderência ao plano no dashboard
- [x] Adicionar histórico de evolução para atividades de cardio
  - [x] Criar dashboard de evolução com gráficos (CardioEvolutionDashboard)
  - [x] Mostrar progresso ao longo do tempo (duração, distância, calorias)
  - [x] Comparar períodos (semana atual vs anterior)
  - [x] Exibir aderência ao plano da anamnese com barras de progresso
- [x] Bug: Erro na aba Estat. Cardio do Diário de Treino ao selecionar aluno - item.sessions está undefined, deveria ser item.sessionCount

- [x] Bug: Dropdown de tipo de série muda sozinho após selecionar (Aquecimento vira Série Válida automaticamente)
- [x] Bug: Falta botão de salvar novamente no registro do maromba após já ter salvo

- [x] Criar página /quiz-trial que usa o quiz atual e redireciona para /cadastro-trial

## Melhorias Admin v4.2
- [x] Criar página de detalhes do quiz no admin (anamnese do lead)
- [x] Visualizar respostas completas do quiz para abordagem personalizada
- [x] Corrigir Analytics Dashboard para mostrar dados reais do banco
- [x] Corrigir Dashboard de Funil para mostrar dados reais do banco

## Gráficos Financeiros Admin v4.3
- [x] Criar gráficos visuais de dados financeiros dos personal trainers
  - [x] Gráfico de distribuição por quantidade de alunos
  - [x] Gráfico de distribuição por faixa de renda
  - [x] Visualização clara e interativa no dashboard do admin

## Captura de Dados do Personal no Quiz v4.4
- [x] Adicionar campos de contato no banco de dados (nome, email, telefone)
- [x] Criar tela de captura de dados antes de iniciar o quiz
- [x] Exibir dados do personal na página de anamnese do lead
- [x] Adicionar botão de acesso rápido à anamnese na lista de leads

## Bug Fix - Cadastro Trial v4.5
- [x] Corrigir redirecionamento após cadastro trial (tela branca -> login)


## Email de Boas-Vindas para Alunos v4.6
- [ ] Implementar envio de email de boas-vindas ao cadastrar aluno
- [ ] Email deve ser enviado em nome do personal trainer do aluno


## Pendências Anotadas v4.7
- [ ] Sistema de notificação para lembrar usuários quando o período de teste está prestes a expirar
- [ ] Email do usuário pré-preenchido na tela de login após o redirecionamento do cadastro

## Revisão dos Quizzes v4.8
- [ ] Revisar /quiz para garantir que dados apareçam no dashboard
- [x] Revisar /quiz-2 para garantir que dados apareçam no dashboard  
- [x] Revisar /quiz-trial para garantir que dados apareçam no dashboard
- [ ] Adicionar captura de dados de contato em todos os quizzes

