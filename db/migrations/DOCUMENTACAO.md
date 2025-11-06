# 📚 Documentação do Sistema de Gestão Contábil

**Versão:** 1.0  
**Data:** 2025-11-06  
**Stack:** React + TypeScript + Vite + Supabase (Lovable Cloud)

---

## 📋 Visão Geral do Sistema

Sistema web para gestão de relacionamento entre escritórios de contabilidade e seus clientes. Permite:

- **Clientes**: Fazer cadastro, enviar documentos, emitir notas fiscais, contratar serviços
- **Contadores**: Aprovar cadastros, gerenciar documentos dos clientes, acompanhar contratos
- **Administradores**: Gestão completa do sistema, relatórios, configurações

---

## 🏗️ Arquitetura Técnica

### Frontend
- **Framework**: React 18 com TypeScript
- **Build Tool**: Vite
- **Roteamento**: React Router DOM v6
- **Estilização**: Tailwind CSS + shadcn/ui
- **Formulários**: React Hook Form + Zod
- **State Management**: TanStack Query (React Query)

### Backend (Lovable Cloud / Supabase)
- **Banco de Dados**: PostgreSQL 15+
- **Autenticação**: Supabase Auth (email/senha)
- **Storage**: Supabase Storage (buckets para documentos e certificados)
- **RLS**: Row Level Security para controle de acesso

---

## 🗄️ Modelo de Dados

### Diagrama de Relacionamentos

```
┌─────────────────────┐
│   auth.users        │  (Supabase Auth)
└──────────┬──────────┘
           │
           ├─────────────────────────────────┐
           │                                 │
           ▼                                 ▼
┌─────────────────────┐          ┌─────────────────────┐
│    user_roles       │          │ cadastros_clientes  │
│  - user_id (FK)     │          │  - id_cadastro (PK) │
│  - role (enum)      │          │  - cnpj             │
└─────────────────────┘          │  - razao_social     │
                                 │  - status_cadastro  │
                                 └──────────┬──────────┘
                                            │
              ┌─────────────────────────────┼─────────────────────────────┐
              │                             │                             │
              ▼                             ▼                             ▼
   ┌─────────────────────┐      ┌─────────────────────┐      ┌─────────────────────┐
   │    contratos        │      │   certificados      │      │cadastros_documentos │
   │  - id_contrato (PK) │      │  - id_certificado   │      │  - id_documento (PK)│
   │  - id_cadastro (FK) │      │  - id_cadastro (FK) │      │  - id_cadastro (FK) │
   │  - valor_final      │      │  - file_path        │      │  - tipo_documento   │
   └─────────────────────┘      └─────────────────────┘      │  - bucket_nome      │
                                                              │  - chave_bucket     │
              ┌────────────────────────────┐                 │  - status_documento │
              │   notas_servico            │                 └─────────────────────┘
              │  - id_nota (PK)            │
              │  - id_cadastro (FK)        │                 ┌─────────────────────┐
              │  - descricao               │                 │  lista_documentos   │
              │  - valor                   │                 │  - id_lista_doc (PK)│
              └────────────────────────────┘                 │  - nome_documento   │
                                                              │  - obrigatorio      │
       ┌─────────────────────┐                               │  - regime_tribut... │
       │      planos         │                               └─────────────────────┘
       │  - id_plano (PK)    │
       │  - nome             │
       │  - preco_mensal     │
       └─────────────────────┘
```

---

## 📊 Descrição Detalhada das Tabelas

### 1. `cadastros_clientes`
**Propósito**: Armazena os cadastros das empresas clientes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id_cadastro` | uuid (PK) | Identificador único do cadastro |
| `cnpj` | text | CNPJ da empresa |
| `razao_social` | text | Razão social da empresa |
| `nome_fantasia` | text | Nome fantasia |
| `id_escritorio` | uuid | Escritório responsável |
| `regime_tributario` | text | Simples Nacional, Lucro Presumido, etc. |
| `status_cadastro` | text | `pendente`, `aprovado`, `rejeitado` |
| `criado_por` | text | Email/ID do usuário que criou |
| `data_criacao` | timestamptz | Data de criação |
| `data_aprovacao` | timestamptz | Data de aprovação |
| `motivo_rejeicao` | text | Motivo de rejeição (se aplicável) |

**Índices**: `idx_cadastros_cnpj` (cnpj)

---

### 2. `cadastros_documentos`
**Propósito**: Gerencia documentos enviados pelos clientes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id_documento` | uuid (PK) | Identificador único do documento |
| `id_cadastro` | uuid (FK) | Referência ao cadastro |
| `tipo_documento` | varchar | Tipo (RG, CPF, Contrato Social, etc.) |
| `categoria_documento` | varchar | Categoria do documento |
| `criticidade` | varchar | Nível de criticidade |
| `obrigatorio` | boolean | Se é obrigatório |
| `nome_arquivo_original` | varchar | Nome original do arquivo |
| `tamanho_arquivo_bytes` | bigint | Tamanho em bytes |
| `tipo_mime` | varchar | Tipo MIME do arquivo |
| `bucket_nome` | varchar | Nome do bucket no storage |
| `chave_bucket` | varchar | Chave/path no bucket |
| `hash_arquivo` | varchar | Hash MD5/SHA256 do arquivo |
| `status_documento` | varchar | `pendente_analise`, `aprovado`, `rejeitado` |
| `motivo_rejeicao` | text | Motivo de rejeição |
| `versao_documento` | integer | Versão do documento (versionamento) |
| `data_upload` | timestamptz | Data do upload |
| `data_aprovacao` | timestamptz | Data de aprovação |
| `enviado_por` | varchar | Quem enviou |
| `aprovado_por` | varchar | Quem aprovou |

**Foreign Keys**:
- `id_cadastro` → `cadastros_clientes.id_cadastro` (ON DELETE SET NULL)

**Índices**: 
- `idx_cadastros_documentos_id_cadastro` (id_cadastro)
- `idx_cadastros_documentos_status` (status_documento)

---

### 3. `user_roles`
**Propósito**: Gerencia papéis/permissões dos usuários

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | uuid (PK) | Identificador único |
| `user_id` | uuid | Referência ao usuário (auth.users) |
| `role` | text | `cliente`, `contador`, `admin` |
| `created_at` | timestamptz | Data de criação |

**Índices**: `idx_user_roles_userid` (user_id)

**⚠️ IMPORTANTE**: Roles devem estar nesta tabela separada, NUNCA em localStorage ou hardcoded por questões de segurança.

---

### 4. `contratos`
**Propósito**: Contratos/assinaturas dos clientes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id_contrato` | uuid (PK) | Identificador único |
| `id_cadastro` | uuid (FK) | Cliente |
| `id_servico` | uuid | Serviço contratado |
| `valor_final` | numeric(12,2) | Valor do contrato |
| `status_contrato` | text | Status do contrato |
| `data_criacao` | timestamptz | Data de criação |

---

### 5. `planos`
**Propósito**: Planos comerciais oferecidos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id_plano` | uuid (PK) | Identificador único |
| `nome` | text | Nome do plano |
| `descricao` | text | Descrição |
| `preco_mensal` | numeric(12,2) | Preço mensal |
| `ativo` | boolean | Se está ativo |

---

### 6. `certificados`
**Propósito**: Certificados digitais dos clientes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id_certificado` | uuid (PK) | Identificador único |
| `id_cadastro` | uuid (FK) | Cliente |
| `file_path` | text | Caminho no bucket |
| `senha` | text | Senha do certificado (criptografada) |
| `uploaded_at` | timestamptz | Data do upload |

---

### 7. `notas_servico`
**Propósito**: Notas fiscais de serviço emitidas

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id_nota` | uuid (PK) | Identificador único |
| `id_cadastro` | uuid (FK) | Cliente |
| `descricao` | text | Descrição do serviço |
| `valor` | numeric(12,2) | Valor da nota |
| `data_emissao` | timestamptz | Data de emissão |
| `tomador_cpf_cnpj` | text | Tomador do serviço |
| `prestador_cnpj` | text | Prestador |
| `local_prestacao` | text | Local da prestação |
| `data_competencia` | date | Competência |
| `certificate_path` | text | Certificado usado |
| `certificate_uploaded` | boolean | Se certificado foi enviado |

---

### 8. `lista_documentos`
**Propósito**: Lista master de documentos que podem ser solicitados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id_lista_documento` | uuid (PK) | Identificador único |
| `nome_documento` | text | Nome do documento |
| `obrigatorio` | boolean | Se é obrigatório |
| `descricao` | text | Descrição |

---

## 🔐 Segurança (RLS - Row Level Security)

### Princípios
- **Todas as tabelas devem ter RLS habilitado** em produção
- **Políticas baseadas em roles** (verificar `user_roles`)
- **Nunca confiar em dados do cliente** (validar no servidor)
- **Security Definer Functions** para evitar recursão RLS

### Exemplo de Function para Check de Role
```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

### Políticas Recomendadas

#### Clientes
- **SELECT**: Apenas seus próprios cadastros e documentos
- **INSERT**: Podem criar cadastros e enviar documentos
- **UPDATE**: Podem atualizar apenas seus dados (exceto status)

#### Contadores
- **SELECT**: Cadastros e documentos de todos os clientes do escritório
- **UPDATE**: Podem aprovar/rejeitar cadastros e documentos

#### Admins
- **ALL**: Acesso total

---

## 💾 Storage (Buckets)

### Buckets Configurados

| Bucket | Propósito | Público? |
|--------|-----------|----------|
| `certificados` | Certificados digitais (.pfx, .p12) | Não |
| `documentos-clientes` | Documentos gerais (RG, CPF, etc.) | Não |
| `cus_doc` | Documentos customizados | Não |

### Políticas de Storage
- Apenas usuários autenticados podem fazer upload
- Usuários podem acessar apenas seus próprios arquivos
- Contadores podem acessar arquivos de seus clientes
- URLs assinadas (signed URLs) para downloads seguros

---

## 🔄 Fluxos de Usuário

### Fluxo do Cliente

1. **Cadastro Inicial**
   - Preenche formulário com dados da empresa
   - Status inicial: `pendente`
   - Redireciona para dashboard

2. **Envio de Documentos**
   - Vê lista de documentos obrigatórios (filtrados por regime tributário)
   - Faz upload de cada documento
   - Documentos ficam com status `pendente_analise`

3. **Acompanhamento**
   - Visualiza status do cadastro
   - Vê documentos aprovados/rejeitados
   - Pode reenviar documentos rejeitados

4. **Emissão de NF**
   - Após aprovação, pode emitir notas fiscais
   - Precisa ter certificado digital enviado

---

### Fluxo do Contador

1. **Visualizar Cadastros Pendentes**
   - Lista de cadastros aguardando aprovação
   - Pode filtrar por status, data, etc.

2. **Análise de Cadastro**
   - Revisa dados da empresa
   - Analisa documentos enviados
   - Pode aprovar ou rejeitar (com motivo)

3. **Gestão de Documentos**
   - Visualiza todos os documentos
   - Aprova/rejeita individualmente
   - Solicita reenvio se necessário

4. **Gestão de Contratos**
   - Cria contratos para clientes aprovados
   - Define valores e serviços

---

### Fluxo do Admin

1. **Gestão Global**
   - Visualiza todos os cadastros
   - Relatórios gerais
   - Configurações do sistema

2. **Gestão de Planos**
   - CRUD de planos comerciais
   - Definição de preços

---

## 🔧 Variáveis de Ambiente

### Obrigatórias

```env
# Supabase (Lovable Cloud)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Storage
VITE_DOCUMENTS_BUCKET=documentos-clientes
VITE_CERTIFICATES_BUCKET=certificados
```

### Opcionais

```env
# Features
VITE_ENABLE_DEBUG=false
VITE_MAX_UPLOAD_SIZE=10485760  # 10MB em bytes
```

---

## 🚀 Deploy e Migrations

### Processo de Deploy

1. **Primeira vez (novo ambiente)**
   - Execute `SCHEMA_COMPLETO.sql` no SQL Editor do Supabase
   - Configure os buckets no Storage
   - Configure as variáveis de ambiente
   - Ative as políticas RLS descomentando no SQL

2. **Updates incrementais**
   - Crie migrations versionadas em `db/migrations/`
   - Nomeie como: `YYYY-MM-DD_descricao.sql`
   - Execute via SQL Editor ou CLI do Supabase

---

## 📝 Regras de Negócio

### Cadastro de Clientes
- CNPJ obrigatório e único
- Status inicial sempre `pendente`
- Aprovação exige todos os documentos obrigatórios aprovados
- Rejeição exige motivo

### Documentos
- Documentos obrigatórios variam por regime tributário
- Documentos rejeitados podem ser reenviados (cria nova versão)
- Versionamento automático mantém histórico

### Contratos
- Só podem ser criados para clientes `aprovados`
- Valor final não pode ser negativo
- Status: `ativo`, `suspenso`, `cancelado`

### Notas Fiscais
- Cliente precisa estar aprovado
- Certificado digital obrigatório
- Validações de campos conforme legislação

---

## 🧪 Dados de Teste (Seed)

Veja `SCHEMA_COMPLETO.sql` para exemplos de:
- Planos básicos
- Lista de documentos padrão
- Usuários de teste (comentados)

---

## 📖 Referências

- [Lovable Cloud Docs](https://docs.lovable.dev/features/cloud)
- [Supabase Docs](https://supabase.com/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Shadcn/ui](https://ui.shadcn.com/)

---

**Última atualização**: 2025-11-06  
**Mantido por**: Equipe de Desenvolvimento
