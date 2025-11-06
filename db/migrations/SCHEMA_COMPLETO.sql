-- =====================================================
-- SCHEMA COMPLETO - Sistema de Gestão Contábil
-- =====================================================
-- Versão: 1.0
-- Data: 2025-11-06
-- Descrição: Script SQL completo para criar todas as tabelas,
--            índices, buckets e políticas RLS do sistema
-- 
-- INSTRUÇÕES DE USO:
-- 1. Abra o SQL Editor no seu projeto Supabase
-- 2. Cole este script completo
-- 3. Execute o script (vai criar todas as estruturas)
-- 4. Descomente as políticas RLS conforme sua necessidade
-- 5. Configure os buckets de storage
-- 6. Insira dados iniciais (seed) se necessário
-- 
-- ATENÇÃO: Revise as políticas RLS antes de usar em produção!
-- =====================================================

-- =====================================================
-- EXTENSÕES
-- =====================================================

-- Extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Extensão adicional para funções UUID (opcional)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- -----------------------------------------------------
-- [1] cadastros_clientes
-- Armazena os cadastros das empresas clientes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cadastros_clientes (
  id_cadastro uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj text,
  razao_social text,
  nome_fantasia text,
  id_escritorio uuid,
  regime_tributario text,
  status_cadastro text DEFAULT 'pendente',
  criado_por text,
  data_criacao timestamptz DEFAULT now(),
  data_aprovacao timestamptz,
  motivo_rejeicao text
);

-- Índice para buscas por CNPJ (frequentes)
CREATE INDEX IF NOT EXISTS idx_cadastros_cnpj 
  ON public.cadastros_clientes (cnpj);

-- Comentários para documentação
COMMENT ON TABLE public.cadastros_clientes IS 'Cadastro de empresas clientes';
COMMENT ON COLUMN public.cadastros_clientes.status_cadastro IS 'pendente | aprovado | rejeitado';
COMMENT ON COLUMN public.cadastros_clientes.regime_tributario IS 'Simples Nacional | Lucro Presumido | Lucro Real';

-- -----------------------------------------------------
-- [2] cadastros_documentos
-- Gerencia documentos enviados pelos clientes
-- (Versão completa com todos os campos)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.cadastros_documentos (
  id_documento uuid NOT NULL DEFAULT uuid_generate_v4(),
  id_cadastro uuid NULL,
  tipo_documento varchar NULL,
  categoria_documento varchar NULL,
  criticidade varchar NULL,
  obrigatorio boolean NOT NULL DEFAULT TRUE,
  nome_arquivo_original varchar NULL,
  tamanho_arquivo_bytes bigint NULL,
  tipo_mime varchar NULL,
  bucket_nome varchar NULL,
  chave_bucket varchar NULL,
  hash_arquivo varchar NULL,
  status_documento varchar NOT NULL DEFAULT 'pendente_analise',
  motivo_rejeicao text NULL,
  versao_documento integer NOT NULL DEFAULT 1,
  data_upload timestamptz NOT NULL DEFAULT now(),
  data_aprovacao timestamptz NULL,
  enviado_por varchar NULL,
  aprovado_por varchar NULL,
  CONSTRAINT cadastros_documentos_pkey PRIMARY KEY (id_documento)
);

-- Foreign key para cadastros_clientes
ALTER TABLE public.cadastros_documentos
  ADD CONSTRAINT fk_cadastros_documentos_cadastros_clientes
  FOREIGN KEY (id_cadastro)
  REFERENCES public.cadastros_clientes (id_cadastro)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cadastros_documentos_id_cadastro
  ON public.cadastros_documentos (id_cadastro);

CREATE INDEX IF NOT EXISTS idx_cadastros_documentos_status
  ON public.cadastros_documentos (status_documento);

-- Comentários
COMMENT ON TABLE public.cadastros_documentos IS 'Documentos enviados pelos clientes (com versionamento)';
COMMENT ON COLUMN public.cadastros_documentos.status_documento IS 'pendente_analise | aprovado | rejeitado';
COMMENT ON COLUMN public.cadastros_documentos.versao_documento IS 'Versão do documento (incrementa a cada reenvio)';

-- -----------------------------------------------------
-- [3] user_roles
-- Gerencia papéis/permissões dos usuários
-- CRÍTICO: Nunca armazenar roles em localStorage!
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_role UNIQUE (user_id, role)
);

-- Índice para lookups por user_id
CREATE INDEX IF NOT EXISTS idx_user_roles_userid 
  ON public.user_roles (user_id);

-- Comentários
COMMENT ON TABLE public.user_roles IS 'Roles dos usuários (cliente | contador | admin)';
COMMENT ON COLUMN public.user_roles.role IS 'cliente | contador | admin';

-- -----------------------------------------------------
-- [4] contratos
-- Contratos/assinaturas dos clientes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contratos (
  id_contrato uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cadastro uuid REFERENCES public.cadastros_clientes(id_cadastro) ON DELETE CASCADE,
  id_servico uuid,
  valor_final numeric(12,2) DEFAULT 0,
  status_contrato text,
  data_criacao timestamptz DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.contratos IS 'Contratos firmados com clientes';
COMMENT ON COLUMN public.contratos.status_contrato IS 'ativo | suspenso | cancelado';

-- -----------------------------------------------------
-- [5] planos
-- Planos comerciais oferecidos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planos (
  id_plano uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  preco_mensal numeric(12,2) DEFAULT 0,
  ativo boolean DEFAULT true
);

-- Comentários
COMMENT ON TABLE public.planos IS 'Planos/pacotes de serviços oferecidos';

-- -----------------------------------------------------
-- [6] certificados
-- Certificados digitais dos clientes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificados (
  id_certificado uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_cadastro uuid REFERENCES public.cadastros_clientes(id_cadastro) ON DELETE CASCADE,
  file_path text,
  senha text,
  uploaded_at timestamptz DEFAULT now()
);

-- Comentários
COMMENT ON TABLE public.certificados IS 'Certificados digitais (.pfx/.p12) dos clientes';
COMMENT ON COLUMN public.certificados.senha IS 'Senha do certificado (deve ser criptografada!)';

-- -----------------------------------------------------
-- [7] notas_servico
-- Notas fiscais de serviço emitidas
-- -----------------------------------------------------
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

-- Comentários
COMMENT ON TABLE public.notas_servico IS 'Notas fiscais de serviço emitidas';

-- -----------------------------------------------------
-- [8] lista_documentos
-- Lista master de documentos que podem ser solicitados
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.lista_documentos (
  id_lista_documento uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_documento text NOT NULL,
  obrigatorio boolean DEFAULT false,
  descricao text
);

-- Comentários
COMMENT ON TABLE public.lista_documentos IS 'Catálogo de documentos que podem ser solicitados aos clientes';

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Nota: A criação de buckets pode variar dependendo da versão do Supabase.
-- Se storage.create_bucket não estiver disponível, crie via UI ou API REST.

DO $$
BEGIN
  -- Tenta criar bucket 'certificados'
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE p.proname = 'create_bucket' AND n.nspname = 'storage'
  ) THEN
    -- Certificados digitais (.pfx, .p12)
    PERFORM storage.create_bucket('certificados', false);
    RAISE NOTICE 'Bucket ''certificados'' criado (privado)';
    
    -- Documentos gerais dos clientes (RG, CPF, etc.)
    PERFORM storage.create_bucket('documentos-clientes', false);
    RAISE NOTICE 'Bucket ''documentos-clientes'' criado (privado)';
    
    -- Documentos customizados
    PERFORM storage.create_bucket('cus_doc', false);
    RAISE NOTICE 'Bucket ''cus_doc'' criado (privado)';
  ELSE
    RAISE NOTICE 'Função storage.create_bucket não disponível.';
    RAISE NOTICE 'Crie os buckets manualmente via Supabase UI (Storage -> Buckets):';
    RAISE NOTICE '  - certificados (privado)';
    RAISE NOTICE '  - documentos-clientes (privado)';
    RAISE NOTICE '  - cus_doc (privado)';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao criar buckets: %. Continue manualmente via UI.', SQLERRM;
END$$;

-- =====================================================
-- SECURITY DEFINER FUNCTIONS
-- (Evitam recursão RLS)
-- =====================================================

-- Função para verificar se usuário tem determinado role
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
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

COMMENT ON FUNCTION public.has_role IS 'Verifica se usuário tem role específico (evita recursão RLS)';

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================
-- IMPORTANTE: Políticas estão COMENTADAS por padrão.
-- Descomente e ajuste conforme suas regras de negócio.
-- =====================================================

-- -----------------------------------------------------
-- RLS: cadastros_clientes
-- -----------------------------------------------------

-- Habilitar RLS
-- ALTER TABLE public.cadastros_clientes ENABLE ROW LEVEL SECURITY;

-- Clientes podem ver apenas seus próprios cadastros
-- CREATE POLICY "cliente_view_own_cadastros" 
--   ON public.cadastros_clientes
--   FOR SELECT
--   TO authenticated
--   USING (criado_por = auth.email());

-- Clientes podem inserir novos cadastros
-- CREATE POLICY "cliente_insert_cadastros" 
--   ON public.cadastros_clientes
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (auth.uid() IS NOT NULL);

-- Contadores podem ver cadastros de seus clientes
-- CREATE POLICY "contador_view_all_cadastros" 
--   ON public.cadastros_clientes
--   FOR SELECT
--   TO authenticated
--   USING (public.has_role(auth.uid(), 'contador') OR public.has_role(auth.uid(), 'admin'));

-- Contadores podem atualizar (aprovar/rejeitar)
-- CREATE POLICY "contador_update_cadastros" 
--   ON public.cadastros_clientes
--   FOR UPDATE
--   TO authenticated
--   USING (public.has_role(auth.uid(), 'contador') OR public.has_role(auth.uid(), 'admin'));

-- Admins têm acesso total
-- CREATE POLICY "admin_all_cadastros" 
--   ON public.cadastros_clientes
--   FOR ALL
--   TO authenticated
--   USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------
-- RLS: cadastros_documentos
-- -----------------------------------------------------

-- Habilitar RLS
-- ALTER TABLE public.cadastros_documentos ENABLE ROW LEVEL SECURITY;

-- Clientes podem inserir documentos (seus cadastros)
-- CREATE POLICY "cliente_insert_documentos" 
--   ON public.cadastros_documentos
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (auth.uid() IS NOT NULL);

-- Clientes podem ver documentos de seus cadastros
-- CREATE POLICY "cliente_view_own_documentos" 
--   ON public.cadastros_documentos
--   FOR SELECT
--   TO authenticated
--   USING (
--     id_cadastro IN (
--       SELECT id_cadastro 
--       FROM public.cadastros_clientes 
--       WHERE criado_por = auth.email()
--     )
--   );

-- Contadores podem ver todos os documentos
-- CREATE POLICY "contador_view_all_documentos" 
--   ON public.cadastros_documentos
--   FOR SELECT
--   TO authenticated
--   USING (public.has_role(auth.uid(), 'contador') OR public.has_role(auth.uid(), 'admin'));

-- Contadores podem atualizar (aprovar/rejeitar)
-- CREATE POLICY "contador_update_documentos" 
--   ON public.cadastros_documentos
--   FOR UPDATE
--   TO authenticated
--   USING (public.has_role(auth.uid(), 'contador') OR public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------
-- RLS: user_roles
-- -----------------------------------------------------

-- Habilitar RLS
-- ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias roles
-- CREATE POLICY "users_view_own_roles" 
--   ON public.user_roles
--   FOR SELECT
--   TO authenticated
--   USING (user_id = auth.uid());

-- Apenas admins podem inserir/atualizar roles
-- CREATE POLICY "admin_manage_roles" 
--   ON public.user_roles
--   FOR ALL
--   TO authenticated
--   USING (public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------
-- RLS: contratos
-- -----------------------------------------------------

-- Habilitar RLS
-- ALTER TABLE public.contratos ENABLE ROW LEVEL SECURITY;

-- Clientes veem apenas seus contratos
-- CREATE POLICY "cliente_view_own_contratos" 
--   ON public.contratos
--   FOR SELECT
--   TO authenticated
--   USING (
--     id_cadastro IN (
--       SELECT id_cadastro 
--       FROM public.cadastros_clientes 
--       WHERE criado_por = auth.email()
--     )
--   );

-- Contadores/admins veem todos
-- CREATE POLICY "contador_view_all_contratos" 
--   ON public.contratos
--   FOR SELECT
--   TO authenticated
--   USING (public.has_role(auth.uid(), 'contador') OR public.has_role(auth.uid(), 'admin'));

-- -----------------------------------------------------
-- RLS: certificados
-- -----------------------------------------------------

-- Habilitar RLS
-- ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;

-- Similar às políticas de cadastros_documentos
-- (Cliente vê apenas seus certificados, contador vê todos)

-- -----------------------------------------------------
-- RLS: notas_servico
-- -----------------------------------------------------

-- Habilitar RLS
-- ALTER TABLE public.notas_servico ENABLE ROW LEVEL SECURITY;

-- Similar às políticas de contratos

-- -----------------------------------------------------
-- RLS: planos e lista_documentos (públicos/leitura)
-- -----------------------------------------------------

-- Geralmente são tabelas de leitura pública
-- ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "anyone_read_planos" ON public.planos FOR SELECT USING (true);

-- ALTER TABLE public.lista_documentos ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "anyone_read_lista_documentos" ON public.lista_documentos FOR SELECT USING (true);

-- =====================================================
-- DADOS INICIAIS (SEED)
-- =====================================================

-- -----------------------------------------------------
-- Planos de exemplo
-- -----------------------------------------------------

-- Descomente para inserir planos básicos
/*
INSERT INTO public.planos (id_plano, nome, descricao, preco_mensal, ativo) 
VALUES
  (gen_random_uuid(), 'Plano Básico', 'Serviços contábeis essenciais', 199.00, true),
  (gen_random_uuid(), 'Plano Profissional', 'Completo com consultoria', 499.00, true),
  (gen_random_uuid(), 'Plano Enterprise', 'Solução corporativa', 999.00, true)
ON CONFLICT DO NOTHING;
*/

-- -----------------------------------------------------
-- Lista de documentos padrão
-- -----------------------------------------------------

-- Descomente para inserir documentos comuns
/*
INSERT INTO public.lista_documentos (id_lista_documento, nome_documento, obrigatorio, descricao) 
VALUES
  (gen_random_uuid(), 'Contrato Social', true, 'Contrato social da empresa'),
  (gen_random_uuid(), 'RG', true, 'RG do responsável legal'),
  (gen_random_uuid(), 'CPF', true, 'CPF do responsável legal'),
  (gen_random_uuid(), 'Comprovante de Residência', true, 'Comprovante de endereço'),
  (gen_random_uuid(), 'CNPJ', true, 'Cartão CNPJ'),
  (gen_random_uuid(), 'Inscrição Estadual', false, 'IE (se aplicável)'),
  (gen_random_uuid(), 'Alvará de Funcionamento', false, 'Alvará municipal')
ON CONFLICT DO NOTHING;
*/

-- =====================================================
-- VERIFICAÇÕES FINAIS
-- =====================================================

-- Comandos úteis para verificar a estrutura criada
-- (Descomente e execute se quiser verificar)

-- Lista todas as tabelas criadas
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Conta registros nas tabelas principais
-- SELECT 'cadastros_clientes' as tabela, count(*) as registros FROM public.cadastros_clientes
-- UNION ALL
-- SELECT 'cadastros_documentos', count(*) FROM public.cadastros_documentos
-- UNION ALL
-- SELECT 'user_roles', count(*) FROM public.user_roles
-- UNION ALL
-- SELECT 'contratos', count(*) FROM public.contratos
-- UNION ALL
-- SELECT 'planos', count(*) FROM public.planos;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Mensagem final
DO $$
BEGIN
  RAISE NOTICE '✅ Schema criado com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 PRÓXIMOS PASSOS:';
  RAISE NOTICE '1. Verifique os buckets de storage (Storage -> Buckets)';
  RAISE NOTICE '2. Descomente e ajuste as políticas RLS conforme necessário';
  RAISE NOTICE '3. Insira dados iniciais (seed) se necessário';
  RAISE NOTICE '4. Configure as variáveis de ambiente no seu app';
  RAISE NOTICE '5. Teste a aplicação em ambiente de desenvolvimento';
  RAISE NOTICE '';
  RAISE NOTICE '📖 Documentação completa: db/migrations/DOCUMENTACAO.md';
END$$;
