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
- [ ] Erro ao finalizar cadastro via link de convite (convite já usado)
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
