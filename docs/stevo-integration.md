# Integração Stevo - WhatsApp Automation

## Sobre o Stevo

O **Stevo** é uma plataforma que permite integrar WhatsApp com CRMs e sistemas de automação. Utiliza a **Evolution API** por baixo dos panos para garantir estabilidade e eficiência.

## Recursos Principais

1. **Gerenciamento de Grupos** - Controle centralizado de grupos WhatsApp
2. **Chamadas WhatsApp** - Fazer e receber chamadas integradas ao CRM
3. **Fotos Atualizadas** - Sincronização automática de fotos de perfil
4. **Múltiplos Números** - Conectar vários números WhatsApp na mesma conta
5. **Tags Personalizadas** - Tags inteligentes que param automações quando necessário
6. **Envio de Áudio** - Mensagens de áudio automatizadas ou manuais
7. **Chat Customizado** - Interface de chat totalmente personalizável

## Planos

| Plano | Preço | Instâncias |
|-------|-------|------------|
| Stevo 1 | R$50/mês | 1 Evolution Instance |
| Stevo 3 | R$100/mês | 3 Evolution Instances |
| Stevo 5 | R$150/mês | 5 Evolution Instances |

Todos os planos incluem:
- Integração GHL
- Transcrição de Áudio com IA
- Mensagens Ilimitadas
- Painel White Label
- Compatível com n8n/make/zapier
- Stevo Voice Enabled

## Integração Técnica

O Stevo usa **webhooks** para integração. As mensagens do WhatsApp aparecem na inbox do CRM, permitindo:
- Envio de mensagens personalizadas
- Disparo de campanhas
- Sincronização de contatos

## Contato

- **WhatsApp**: +55 (27) 98112-0473
- **Email**: contato@stevo.chat
- **Site**: https://stevo.chat/

## Implementação no FitPrime Manager

Para integrar o Stevo ao FitPrime Manager, precisaremos:

1. **Credenciais da API Stevo** (a serem obtidas após contratação do plano)
   - API Key ou Token de acesso
   - URL da instância Evolution API
   - Webhook URL para receber mensagens

2. **Configurações no Sistema**
   - Página de configuração para inserir credenciais
   - Webhook endpoint para receber mensagens do Stevo
   - Fila de mensagens para envio

3. **Automações Disponíveis**
   - Lembrete de sessão (antes da aula)
   - Cobrança pendente/atrasada
   - Aniversário do aluno
   - Boas-vindas para novos alunos
   - Mensagens personalizadas

## Próximos Passos

- [ ] Atualizar página de Configurações para usar Stevo ao invés de Evolution API direta
- [ ] Criar documentação de como obter credenciais do Stevo
- [ ] Implementar webhooks para receber mensagens
- [ ] Testar integração com conta trial do Stevo
