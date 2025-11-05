-- Supabase SQL Editor export (base schema)
-- Cole e execute no SQL Editor do seu projeto Supabase.
-- Revise antes de executar em produção.

-- Extensões necessárias (gera UUIDs)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =======================
-- Tabela: cadastros_clientes
-- =======================
CREATE TABLE IF NOT EXISTS public.cadastros_clientes (
  id_cadastro uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj text,
  razao_social text,
  nome_fantasia text,
  id_escritorio uuid,
  regime_tributario text,
  status_cadastro text,
  criado_por text,
  data_criacao timestamptz DEFAULT now(),
  data_aprovacao timestamptz,
  motivo_rejeicao text
);

-- Índice para buscas por CNPJ
CREATE INDEX IF NOT EXISTS idx_cadastros_cnpj ON public.cadastros_clientes (cnpj);

-- =======================
-- Tabela: contratos
-- =======================
CREATE TABLE IF NOT EXISTS public.contratos (
  id_contrato uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cadastro uuid REFERENCES public.cadastros_clientes(id_cadastro) ON DELETE CASCADE,
  id_servico uuid,
  valor_final numeric(12,2) DEFAULT 0,
  status_contrato text,
  data_criacao timestamptz DEFAULT now()
);

-- =======================
-- Tabela: user_roles
-- =======================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  role text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_roles_userid ON public.user_roles (user_id);

-- =======================
-- Tabela: planos
-- =======================
CREATE TABLE IF NOT EXISTS public.planos (
  id_plano uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text,
  descricao text,
  preco_mensal numeric(12,2) DEFAULT 0,
  ativo boolean DEFAULT true
);

-- =======================
-- Tabela: certificados
-- =======================
CREATE TABLE IF NOT EXISTS public.certificados (
  id_certificado uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cadastro uuid REFERENCES public.cadastros_clientes(id_cadastro) ON DELETE CASCADE,
  file_path text,
  senha text,
  uploaded_at timestamptz DEFAULT now()
);

-- =======================
-- Tabela: notas_servico
-- =======================
CREATE TABLE IF NOT EXISTS public.notas_servico (
  id_nota uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cadastro uuid REFERENCES public.cadastros_clientes(id_cadastro) ON DELETE CASCADE,
  descricao text,
  valor numeric(12,2) DEFAULT 0,
  data_emissao timestamptz DEFAULT now(),
  tomador_cpf_cnpj text,
  prestador_cnpj text,
  local_prestacao text,
  data_competencia date,
  certificate_path text,
  certificate_uploaded boolean DEFAULT false
);

-- =======================
-- Tabela: lista_documentos
-- =======================
CREATE TABLE IF NOT EXISTS public.lista_documentos (
  id_lista_documento uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_documento text,
  obrigatorio boolean DEFAULT false,
  descricao text
);

-- =======================
-- Tabela: cadastros_documentos
-- =======================
CREATE TABLE IF NOT EXISTS public.cadastros_documentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cadastro uuid REFERENCES public.cadastros_clientes(id_cadastro) ON DELETE CASCADE,
  id_lista_documento uuid REFERENCES public.lista_documentos(id_lista_documento) ON DELETE CASCADE,
  nome_arquivo_original text,
  data_upload timestamptz,
  status_geral text,
  motivo_rejeicao text
);

-- =======================
-- Ajustes e exemplos de RLS (APENAS EXEMPLOS)
-- Ative RLS e ajuste conforme a sua política de autorização.
-- =======================

-- Exemplo: habilitar RLS para cadastros_clientes
-- ALTER TABLE public.cadastros_clientes ENABLE ROW LEVEL SECURITY;
--
-- Política exemplo: permitir que usuário autenticado insira registros (ajuste conforme necessário)
-- CREATE POLICY "Allow authenticated insert" ON public.cadastros_clientes
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (auth.role() IS NOT NULL OR true);
--
-- Política exemplo: permitir que o dono (criado_por) veja apenas seus cadastros
-- CREATE POLICY "Users can select own cadastros" ON public.cadastros_clientes
--   FOR SELECT
--   USING (criado_por = auth.email());
--
-- Observação: `auth.email()` e `auth.uid()` são helpers disponíveis no Supabase SQL context.
-- Ajuste as políticas para que escritórios/administradores tenham acesso conforme regras de negócio.

-- =======================
-- Dados de exemplo (opcional)
-- =======================
-- INSERT INTO public.planos (id_plano, nome, descricao, preco_mensal, ativo) VALUES
--   (gen_random_uuid(), 'Plano Básico', 'Plano inicial', 29.90, true),
--   (gen_random_uuid(), 'Plano Profissional', 'Plano completo', 79.90, true);

-- Fim do arquivo
