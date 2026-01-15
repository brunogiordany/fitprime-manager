# Análise de Custos de Infraestrutura para Escala do FitPrime

**Data:** 15 de Janeiro de 2026  
**Objetivo:** Projeção de custos operacionais para migração do FitPrime fora da Manus, considerando cenários de 5.000 a 100.000 usuários (Personal Trainers).

---

## Resumo Executivo

Este relatório detalha os custos de infraestrutura necessários para operar o FitPrime de forma independente em diferentes escalas. A análise considera que cada Personal Trainer (usuário pagante) terá em média **15 alunos**, resultando em uma base total de usuários ativos significativamente maior.

**Premissas de cálculo:**
- 1 Personal = 15 Alunos em média
- 5.000 Personais = 75.000 usuários totais
- 100.000 Personais = 1.500.000 usuários totais

---

## Stack Tecnológico Recomendado

### Arquitetura Atual (Manus)
O FitPrime atualmente utiliza:
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express + tRPC
- **Banco de Dados:** PostgreSQL (Drizzle ORM)
- **Autenticação:** JWT + OAuth (Cakto)
- **Storage:** S3-compatible
- **Email:** Resend
- **Pagamentos:** Stripe + Cakto
- **WhatsApp:** Stevo API

### Arquitetura Recomendada para Escala

| Componente | Opção Econômica | Opção Premium | Observação |
|------------|-----------------|---------------|------------|
| **Hospedagem** | Railway Pro | AWS ECS/Fargate | Railway até 50k, AWS depois |
| **Banco de Dados** | Neon Launch | Supabase Pro / AWS RDS | Neon é mais barato para início |
| **CDN/Edge** | Cloudflare Free | Cloudflare Pro | Essencial para performance |
| **Storage (S3)** | Cloudflare R2 | AWS S3 | R2 tem egress grátis |
| **Email** | Resend Scale | AWS SES | SES é mais barato em volume |
| **Monitoramento** | Grafana Cloud Free | Datadog | Datadog para enterprise |
| **CI/CD** | GitHub Actions | GitHub Actions | Gratuito para repos privados |

---

## Projeção de Custos por Escala

### Cenário 1: 5.000 Personais (75.000 usuários totais)

**Perfil de uso estimado:**
- Requests/mês: ~50 milhões
- Storage DB: ~50 GB
- Storage Files: ~500 GB (fotos, materiais)
- Emails/mês: ~100.000
- Bandwidth: ~500 GB

| Serviço | Provedor | Custo Mensal (USD) | Custo Mensal (BRL) |
|---------|----------|-------------------|-------------------|
| **Hospedagem** | Railway Pro | $150 | R$ 900 |
| **Banco de Dados** | Neon Launch | $80 | R$ 480 |
| **Storage (Files)** | Cloudflare R2 | $8 | R$ 48 |
| **CDN** | Cloudflare Free | $0 | R$ 0 |
| **Email** | Resend Scale | $90 | R$ 540 |
| **Domínio** | Cloudflare | $15 | R$ 90 |
| **Monitoramento** | Grafana Free | $0 | R$ 0 |
| **WhatsApp (Stevo)** | Stevo | $0* | R$ 0* |
| **Stripe Fees** | Stripe | ~3.99% | ~3.99% |
| **Backup** | R2 + Scripts | $5 | R$ 30 |
| **TOTAL** | - | **~$348** | **~R$ 2.088** |

*WhatsApp via Stevo não tem custo de mensagem, apenas o custo do servidor que já está incluso.

**Receita estimada (5.000 personais):**
- Ticket médio: R$ 97/mês
- Receita bruta: R$ 485.000/mês
- **Custo de infra: 0,43% da receita**

---

### Cenário 2: 10.000 Personais (150.000 usuários totais)

**Perfil de uso estimado:**
- Requests/mês: ~100 milhões
- Storage DB: ~100 GB
- Storage Files: ~1 TB
- Emails/mês: ~200.000
- Bandwidth: ~1 TB

| Serviço | Provedor | Custo Mensal (USD) | Custo Mensal (BRL) |
|---------|----------|-------------------|-------------------|
| **Hospedagem** | Railway Pro (2x) | $300 | R$ 1.800 |
| **Banco de Dados** | Neon Scale | $200 | R$ 1.200 |
| **Storage (Files)** | Cloudflare R2 | $15 | R$ 90 |
| **CDN** | Cloudflare Pro | $20 | R$ 120 |
| **Email** | Resend Scale | $180 | R$ 1.080 |
| **Domínio** | Cloudflare | $15 | R$ 90 |
| **Monitoramento** | Grafana Pro | $50 | R$ 300 |
| **Redis Cache** | Upstash | $30 | R$ 180 |
| **Backup** | R2 + Scripts | $10 | R$ 60 |
| **TOTAL** | - | **~$820** | **~R$ 4.920** |

**Receita estimada (10.000 personais):**
- Ticket médio: R$ 97/mês
- Receita bruta: R$ 970.000/mês
- **Custo de infra: 0,51% da receita**

---

### Cenário 3: 50.000 Personais (750.000 usuários totais)

**Perfil de uso estimado:**
- Requests/mês: ~500 milhões
- Storage DB: ~500 GB
- Storage Files: ~5 TB
- Emails/mês: ~1 milhão
- Bandwidth: ~5 TB

| Serviço | Provedor | Custo Mensal (USD) | Custo Mensal (BRL) |
|---------|----------|-------------------|-------------------|
| **Hospedagem** | AWS ECS Fargate | $1.500 | R$ 9.000 |
| **Banco de Dados** | AWS RDS PostgreSQL | $800 | R$ 4.800 |
| **Read Replicas** | AWS RDS (2x) | $400 | R$ 2.400 |
| **Storage (Files)** | AWS S3 | $115 | R$ 690 |
| **CDN** | CloudFront | $200 | R$ 1.200 |
| **Email** | AWS SES | $100 | R$ 600 |
| **Load Balancer** | AWS ALB | $50 | R$ 300 |
| **Redis Cache** | AWS ElastiCache | $150 | R$ 900 |
| **Monitoramento** | Datadog | $200 | R$ 1.200 |
| **WAF/Security** | AWS WAF | $50 | R$ 300 |
| **Backup** | AWS Backup | $100 | R$ 600 |
| **DevOps/SRE** | Contratação | $3.000 | R$ 18.000 |
| **TOTAL** | - | **~$6.665** | **~R$ 39.990** |

**Receita estimada (50.000 personais):**
- Ticket médio: R$ 97/mês
- Receita bruta: R$ 4.850.000/mês
- **Custo de infra: 0,82% da receita**

---

### Cenário 4: 100.000 Personais (1.500.000 usuários totais)

**Perfil de uso estimado:**
- Requests/mês: ~1 bilhão
- Storage DB: ~1 TB
- Storage Files: ~10 TB
- Emails/mês: ~2 milhões
- Bandwidth: ~10 TB

| Serviço | Provedor | Custo Mensal (USD) | Custo Mensal (BRL) |
|---------|----------|-------------------|-------------------|
| **Hospedagem** | AWS ECS Fargate (Auto-scaling) | $4.000 | R$ 24.000 |
| **Banco de Dados** | AWS RDS PostgreSQL (Multi-AZ) | $2.000 | R$ 12.000 |
| **Read Replicas** | AWS RDS (4x) | $1.600 | R$ 9.600 |
| **Storage (Files)** | AWS S3 | $230 | R$ 1.380 |
| **CDN** | CloudFront | $500 | R$ 3.000 |
| **Email** | AWS SES | $200 | R$ 1.200 |
| **Load Balancer** | AWS ALB (Multi-AZ) | $100 | R$ 600 |
| **Redis Cache** | AWS ElastiCache Cluster | $400 | R$ 2.400 |
| **Monitoramento** | Datadog Pro | $500 | R$ 3.000 |
| **WAF/Security** | AWS WAF + Shield | $200 | R$ 1.200 |
| **Backup** | AWS Backup | $200 | R$ 1.200 |
| **Queue (SQS)** | AWS SQS | $50 | R$ 300 |
| **DevOps/SRE Team** | 2 pessoas | $8.000 | R$ 48.000 |
| **Suporte N2** | 1 pessoa | $2.000 | R$ 12.000 |
| **TOTAL** | - | **~$19.980** | **~R$ 119.880** |

**Receita estimada (100.000 personais):**
- Ticket médio: R$ 97/mês
- Receita bruta: R$ 9.700.000/mês
- **Custo de infra: 1,24% da receita**

---

## Tabela Resumo de Custos

| Escala | Personais | Usuários Totais | Custo Infra/mês | % da Receita | Custo/Personal |
|--------|-----------|-----------------|-----------------|--------------|----------------|
| **Pequeno** | 5.000 | 75.000 | R$ 2.088 | 0,43% | R$ 0,42 |
| **Médio** | 10.000 | 150.000 | R$ 4.920 | 0,51% | R$ 0,49 |
| **Grande** | 50.000 | 750.000 | R$ 39.990 | 0,82% | R$ 0,80 |
| **Enterprise** | 100.000 | 1.500.000 | R$ 119.880 | 1,24% | R$ 1,20 |

---

## Custos Adicionais a Considerar

### Custos Fixos (Independente de Escala)

| Item | Custo Mensal | Observação |
|------|--------------|------------|
| **Domínio .com.br** | R$ 40/ano | Registro.br |
| **SSL Certificates** | R$ 0 | Let's Encrypt gratuito |
| **GitHub Team** | $4/usuário | Para equipe de dev |
| **Figma** | $15/usuário | Design |
| **Notion/Linear** | $10/usuário | Gestão de projetos |
| **Slack** | $8,75/usuário | Comunicação |

### Custos de Terceiros (Variáveis)

| Serviço | Modelo de Cobrança | Estimativa |
|---------|-------------------|------------|
| **Stripe** | 3,99% + R$ 0,39 por transação | ~4% da receita |
| **Cakto** | % por transação | Variável |
| **Stevo (WhatsApp)** | Por instância | ~R$ 50-100/mês |
| **OpenAI (IA)** | Por token | ~$0,002/1k tokens |

---

## Recomendações de Migração

### Fase 1: 0-10.000 Personais
**Stack recomendado:** Railway + Neon + Cloudflare R2

Vantagens:
- Setup simples, similar ao Manus
- Custo baixo e previsível
- Auto-scaling básico
- Deploy fácil via GitHub

### Fase 2: 10.000-50.000 Personais
**Stack recomendado:** AWS ECS + RDS + S3 + CloudFront

Necessidades:
- Contratar DevOps/SRE
- Implementar CI/CD robusto
- Configurar monitoramento avançado
- Implementar cache (Redis)
- Configurar read replicas

### Fase 3: 50.000+ Personais
**Stack recomendado:** AWS Full Stack + Kubernetes (opcional)

Necessidades:
- Equipe de infraestrutura dedicada
- Multi-region deployment
- Disaster recovery plan
- Compliance (LGPD, SOC2)
- SLA com clientes enterprise

---

## Comparativo: Manus vs Self-Hosted

| Aspecto | Manus | Self-Hosted |
|---------|-------|-------------|
| **Setup** | Instantâneo | Dias/Semanas |
| **Manutenção** | Zero | Alta |
| **Custo inicial** | Baixo | Alto |
| **Custo em escala** | Pode ser maior | Mais controle |
| **Flexibilidade** | Limitada | Total |
| **Equipe necessária** | 0 | 1-3 pessoas |
| **Uptime garantido** | Sim | Depende de você |

### Quando migrar?
Recomendo migrar do Manus quando:
1. Receita mensal > R$ 500.000
2. Necessidade de customizações profundas
3. Requisitos de compliance específicos
4. Custo do Manus > 5% da receita

---

## Conclusão

O custo de infraestrutura para escalar o FitPrime é **extremamente baixo** em relação à receita gerada. Mesmo no cenário de 100.000 personais, o custo de infra representa apenas **1,24% da receita bruta**.

**Principais insights:**
1. **Comece simples** - Railway + Neon é suficiente até 10k personais
2. **Escale gradualmente** - Migre para AWS apenas quando necessário
3. **Invista em pessoas** - O maior custo em escala é a equipe, não a infra
4. **Otimize custos** - Use Reserved Instances e Savings Plans na AWS
5. **Monitore sempre** - Custos podem sair do controle sem monitoramento

O FitPrime tem uma **margem de lucro excelente** mesmo considerando todos os custos de infraestrutura em escala.
