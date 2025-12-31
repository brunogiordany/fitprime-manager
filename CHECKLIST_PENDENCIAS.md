# Checklist de Pendências - FitPrime Manager

**Última atualização:** 30/12/2025

---

## 🔴 BUGS CRÍTICOS - SÉRIE B (Prioridade Máxima)

- [x] B1. Bug: Link de convite não copia para área de transferência (CORRIGIDO - Implementado utilitário robusto de clipboard com fallback para iOS)
- [x] B2. Bug: Redesign completo do Chat (UX ruim, scroll quebrado) - estilo WhatsApp/iMessage (CORRIGIDO - Layout estilo WhatsApp com scroll funcional, agrupamento por data, bolhas elegantes)
- [x] B3. Bug: Portal do Aluno - adicionar barra lateral de navegação (CORRIGIDO - Sidebar estilo DashboardLayout com menu lateral, header e footer)
- [x] B4. Bug: Gravação de áudio (CORRIGIDO - Envio funcional, pause/resume, codecs compatíveis, tratamento de erros)
- [x] B5. Bug: Upload de arquivos não funciona (CORRIGIDO - Upload funcional para fotos, vídeos e documentos no chat do personal)
- [x] B6. Bug: Campos de bioimpedância e adipômetro sumiram (VERIFICADO - Campos estão presentes em Measurements.tsx nas abas 'bio' e 'adip')
- [x] B7. Bug: Scroll não funciona no chat (VERIFICADO - Scroll funcional com auto-scroll para novas mensagens e overflow-y-auto)

---

## 🔴 BUGS CRÍTICOS - SÉRIE A (Resolvidos)

- [x] A1. Bug: Erro ao clicar em "Análise IA" - "No procedure found on path workoutLogs.aiAnalysis" (CORRIGIDO - Mudado para trainingDiary.aiAnalysis)
- [x] A2. Bug: Diário de Treino - Remover aba "Sessões" (duplicada com Registros), manter apenas "Registros" e "Dashboard" (CORRIGIDO)
- [x] A3. Bug: UX Mensagens Internas - Tela quebrada, nada funciona, tudo encavalado (CORRIGIDO - Ajustado layout e overflow)
- [x] A4. Bug: Calendário cinza abre automaticamente ao abrir qualquer coisa (CORRIGIDO - Adicionado onOpenAutoFocus nos modais)
- [x] A5. Bug: UX Diário de Treino - Campo de descanso desalinhado, precisa ajustar (CORRIGIDO - Adicionado sm:flex-nowrap para evitar quebra)
- [x] A6. Melhoria: Evolução de Carga - Abrir todos exercícios em ordem alfabética com filtro 1 sem, permitir digitar para filtrar (CONCLUÍDO)
- [x] A7. Melhoria: Dashboard de Evolução - Criar dash dedicada com gráficos (pizza, colunas, ondas) e botão para mudar tipos (CONCLUÍDO)
- [x] A8. Melhoria: Evolução muito escondida - Criar opção no menu lateral ou incorporar em Relatórios (CONCLUÍDO - Adicionado no menu lateral)

---

## 🔴 BUGS CRÍTICOS - ANTERIORES (Prioridade Alta)

- [x] 1. Exportar PDF não funciona (VERIFICADO - Está funcionando)
- [x] 2. Bug: Erro validação trainingLocation ao salvar anamnese (CORRIGIDO - Validação de enums melhorada)
- [~] 3. Bug: Erro "Treino não encontrado" ao enviar sugestão de alteração (PENDENTE - Aguardando reprodução)
- [x] 4. Bug: Tipo "Reconhecimento" muda automaticamente para "Série Válida" (CORRIGIDO - setType agora é salvo corretamente)

---

## 🟡 FUNCIONALIDADES IMPORTANTES (Prioridade Média)

- [x] 5. Implementar botão e modal de análise por IA na interface do personal (CONCLUÍDO)
- [x] 6. Vincular treinos automaticamente nas sessões recorrentes (JÁ IMPLEMENTADO)
- [x] 7. Implementar transcrição automática de áudio para texto no chat (CONCLUÍDO)
- [x] 8. Adicionar funcionalidade de mensagem em massa (broadcast) (CONCLUÍDO)
- [x] 9. Notificação para personal quando aluno cria sugestão (JÁ IMPLEMENTADO)

---

## 🟢 MELHORIAS DE UX (Prioridade Média-Baixa)

- [x] 10. Melhorar layout dos campos e seções da anamnese (JÁ IMPLEMENTADO - seções com ícones, grid responsivo)
- [x] 11. Adicionar botões Salvar/Cancelar no final do formulário de anamnese (JÁ IMPLEMENTADO)
- [x] 12. Drop Set com múltiplos drops - Botão "+ Adicionar Drop" (CONCLUÍDO - Portal do Aluno)
- [x] 13. Rest-Pause com múltiplas pausas - Botão "+ Adicionar Pausa" (CONCLUÍDO - Portal do Aluno)
- [x] 14. Melhorar UX geral do popup de detalhes de registro (CONCLUÍDO - header melhorado, observações com ícone)
- [x] 15. Modal Agenda: Melhorar espaçamentos e hierarquia visual (JÁ IMPLEMENTADO - estilo Belasis)

---

## 🟠 BUGS SÉRIE C (Novos)

- [x] C1. Botão Convidar não funciona bem (CORRIGIDO - Popup com link, botão copiar, WhatsApp e Email)
- [x] C2. Simplificar chat - remover vídeo, áudio, fotos, arquivos (manter só texto)

---

## 🔵 FUNCIONALIDADES FUTURAS (Prioridade Baixa)

- [x] 16. Métricas SaaS (MRR, ARR, Churn Rate, LTV, Ticket Médio) - JÁ IMPLEMENTADO em Charges.tsx com cards e cálculos completos
- [x] 17. Agrupar cobranças por aluno (expandir/colapsar) - JÁ IMPLEMENTADO em Charges.tsx com Collapsible
- [ ] 18. Planos de fábrica (6 planos mensais pré-definidos)
- [ ] 19. Comparativo entre métodos de BF (estimado vs bio vs adi)
- [ ] 20. Histórico de sessões por treino
- [ ] 21. Comparativo de evolução de carga

---

## ✅ CONCLUÍDOS RECENTEMENTE

- [x] Bug: Erro "Please login (10001)" ao salvar anamnese no onboarding
- [x] Bug: Erro "Please login (10001)" ao salvar anamnese no portal
- [x] Persistência de dados no localStorage (não perde ao atualizar)
- [x] B1: Link de convite não copia para área de transferência (30/12/2025)

---

## 📊 PROGRESSO

**Bugs Série B:** 7/7 resolvidos
**Bugs Série A:** 8/8 resolvidos
**Total geral:** ~75% concluído

## 🔴 BUGS SÉRIE D (Novos - 31/12)

- [x] D1. Erro página /evolucao - Select.Item com valor vazio (CORRIGIDO - valor '' alterado para 'all')
- [x] D2. Diário de Treino - Retornar aba "Sessões" (JÁ IMPLEMENTADO no GitHub)
- [x] D3. Diário de Treino - Renomear "Registros" para "Registros Maromba" (JÁ IMPLEMENTADO no GitHub)
