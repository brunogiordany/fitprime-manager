# Análise de Bugs Reportados

## 1. Menu do Personal aparecendo no Admin
- URL: fitprimemanager.com/admin/email-automation
- Problema: O sidebar mostra itens do Personal (Dashboard, Alunos, Agenda, Sessões, Treinos, etc.) ao invés do menu do Admin
- O usuário está logado como "Bruno Giordany - Personal Trainer" mas está acessando rota /admin/
- Deveria mostrar o menu do Admin (Visão Geral, Personais, Features, Assinaturas, etc.)

## 2. Dados de origem do lead não captados
- Na página de detalhes do lead, os campos estão vazios:
  - UTM Source: -
  - UTM Medium: -
  - UTM Campaign: -
  - Landing Page: -
  - Dispositivo (Tipo, Navegador, Sistema): -
- Precisa verificar se o quiz está capturando esses dados corretamente

## 3. Personais duplicados vs Leads
- Painel Admin mostra 11 Personais cadastrados
- Gestão de Leads mostra mais leads (CASSIO, Brenno, Diogo, Luiz, Cássio, teste meta01, etc.)
- Alguns emails aparecem em ambas as listas (csluiz19@gmail.com, brennoferreiraeducadorfisico@gmail.com)
- Possíveis causas:
  - Lead preenche quiz e depois se cadastra como Personal (2 registros)
  - Redundância no funil (quiz + cadastro separados)
  - Sincronização não está funcionando
