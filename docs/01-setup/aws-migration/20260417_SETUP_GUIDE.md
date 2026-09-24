# AWS Migration Setup Guide

## Prerequisites

Antes de iniciar a migração, você precisa:

### 1. Conta AWS
- Criar conta AWS (se não tiver): https://aws.amazon.com/
- **IMPORTANTE**: Esta migração custa ~$270-420/mês
- Free tier NÃO cobre estes recursos (Aurora, DMS, RDS Proxy)

### 2. Instalar AWS CLI
```bash
# Windows (via Chocolatey)
choco install awscli

# Ou baixar instalador: https://aws.amazon.com/cli/
```

### 3. Configurar Credenciais AWS
```bash
aws configure
# AWS Access Key ID: [sua key]
# AWS Secret Access Key: [sua secret]
# Default region: us-east-1
# Default output format: json
```

### 4. Verificar Permissões
```bash
aws sts get-caller-identity
```

Você precisa de permissões para:
- VPC (criar VPC, subnets, security groups)
- RDS (criar Aurora cluster, RDS Proxy)
- DMS (criar replication instance, endpoints, tasks)
- Secrets Manager (criar secrets, rotação)
- IAM (criar roles, policies)
- CloudWatch (criar alarms, dashboards)
- SNS (criar topics, subscriptions)

### 5. Instalar Dependências Locais

**Terraform:**
```bash
# Windows (via Chocolatey)
choco install terraform

# Verificar versão >= 1.5
terraform version
```

**PostgreSQL Client (pg_dump):**
```bash
# Windows: Baixar PostgreSQL
# https://www.postgresql.org/download/windows/
# Instalar apenas o cliente (psql, pg_dump)

# Verificar versão >= 14
pg_dump --version
```

**Python 3.9+:**
```bash
python --version

# Instalar dependências
pip install psycopg2-binary boto3
```

**Node.js 18+:**
```bash
node --version

# Instalar dependências
npm install pg dotenv
```

### 6. Configurar Variáveis de Ambiente

Criar arquivo `.env` na raiz do projeto:
```bash
# Supabase
SUPABASE_DB_URL=postgresql://postgres:[password]@db.oensqhjnxwpcuanozske.supabase.co:5432/postgres

# AWS (será preenchido após Terraform)
AURORA_DATABASE_URL=
AWS_REGION=us-east-1
```

## Estimativa de Custos AWS

| Recurso | Custo Mensal (us-east-1) |
|---------|--------------------------|
| Aurora Serverless v2 (0.5-16 ACU, Multi-AZ) | $50-200 |
| RDS Proxy | $30 |
| DMS Replication Instance (dms.r6i.large) | $180 |
| Data Transfer (~10 GB/mês) | $1 |
| Secrets Manager | $0.50 |
| CloudWatch | $10 |
| KMS | $1 |
| **TOTAL** | **$270-420/mês** |

## Próximos Passos

Após configurar tudo acima:

1. Execute Phase 0: `npm run migration:phase0`
2. Execute Phase 1 (Backup): `./scripts/backup_supabase.sh`
3. Execute Phase 2 (Consolidação): `node scripts/consolidate_migrations.js`
4. Execute Phase 3 (Terraform): `cd terraform && terraform apply`
5. Continue com as próximas fases conforme documentação

## Rollback

Se precisar reverter:
- Terraform: `terraform destroy` (remove toda infraestrutura AWS)
- Supabase: Nunca é alterado, sempre pode voltar a usar apenas ele
- Custo de rollback: Apenas recursos AWS provisionados até o momento
