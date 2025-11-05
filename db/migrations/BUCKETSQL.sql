-- BUCKETSQL.sql
-- Tenta criar o bucket 'cus_doc' via SQL se a função storage.create_bucket existir.
-- Cole este script no SQL Editor do Supabase (Dashboard -> SQL Editor -> New query) e execute.

DO $$
BEGIN
	-- Verifica se a função storage.create_bucket existe no schema 'storage'
	IF EXISTS (
		SELECT 1 FROM pg_proc p
		JOIN pg_namespace n ON p.pronamespace = n.oid
		WHERE p.proname = 'create_bucket' AND n.nspname = 'storage'
	) THEN
		-- Chama a função para criar o bucket privado
		PERFORM storage.create_bucket('cus_doc', false);
		RAISE NOTICE 'Função storage.create_bucket encontrada: tentei criar o bucket ''cus_doc'' (privado). Verifique no painel do Supabase -> Storage -> Buckets.';
	ELSE
		RAISE NOTICE 'A função storage.create_bucket NÃO existe neste projeto. Não é possível criar bucket via SQL Editor aqui.';
		RAISE NOTICE 'Use o painel do Supabase (Storage -> Buckets -> Create new bucket) ou a API REST admin.';
		RAISE NOTICE 'Exemplo curl (requer SERVICE_ROLE key):';
		RAISE NOTICE '  curl -X POST "https://<PROJECT_REF>.supabase.co/storage/v1/buckets" -H "apikey: <SERVICE_ROLE_KEY>" -H "Authorization: Bearer <SERVICE_ROLE_KEY>" -H "Content-Type: application/json" -d "{""name"":""cus_doc"",""public"":false}"';
		RAISE NOTICE 'Exemplo PowerShell (Windows):';
		RAISE NOTICE '  $body = @{ name = ''cus_doc''; public = $false } | ConvertTo-Json';
		RAISE NOTICE '  Invoke-RestMethod -Method Post -Uri "https://<PROJECT_REF>.supabase.co/storage/v1/buckets" -Headers @{ apikey = ''<SERVICE_ROLE_KEY>''; Authorization = "Bearer <SERVICE_ROLE_KEY>" } -Body $body -ContentType ''application/json''';
	END IF;
END$$ LANGUAGE plpgsql;

-- Observação: após criar o bucket, atualize seu arquivo de ambiente (por ex. .env.local):
-- VITE_DOCUMENTS_BUCKET=cus_doc
-- e reinicie o dev server para que import.meta.env pegue a nova variável.

-- =====================================================================
-- RLS helper: políticas de exemplo para a tabela `public.cadastros_documentos`
-- =====================================================================
-- IMPORTANTE: as políticas abaixo são exemplos. A Opção A é permissiva e
-- serve apenas para testes. A Opção B é mais restrita e exige que você
-- inclua o claim `id_cadastro` no JWT (ou adapte para o vínculo real entre
-- usuário e cadastro).

-- ========== Opção A: política permissiva (teste rápido) ==============
-- Habilita RLS e permite INSERT para usuários autenticados (apenas para testes)
-- Cole e execute no SQL Editor se precisar desbloquear uploads temporariamente.
--
-- ALTER TABLE IF EXISTS public.cadastros_documentos ENABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS allow_insert_authenticated ON public.cadastros_documentos;
--
-- CREATE POLICY allow_insert_authenticated
--   ON public.cadastros_documentos
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (auth.uid() IS NOT NULL);

-- ========== Opção B: política restrita (requer claim JWT `id_cadastro`) ========
-- Permite INSERT apenas quando a coluna id_cadastro da nova linha coincide
-- com o claim `id_cadastro` presente no token JWT (exposto pelo Supabase).
-- Substitua/execute se você já expõe esse claim.
--
-- ALTER TABLE IF EXISTS public.cadastros_documentos ENABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS allow_insert_for_own_cadastro ON public.cadastros_documentos;
--
-- CREATE POLICY allow_insert_for_own_cadastro
--   ON public.cadastros_documentos
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     id_cadastro::text = current_setting('request.jwt.claims.id_cadastro', true)
--   );

-- ========== Política de UPDATE recomendada (opcional) ==================
-- Permite UPDATE apenas para linhas do mesmo cadastro (baseado no claim)
--
-- DROP POLICY IF EXISTS allow_update_for_own_cadastro ON public.cadastros_documentos;
--
-- CREATE POLICY allow_update_for_own_cadastro
--   ON public.cadastros_documentos
--   FOR UPDATE
--   TO authenticated
--   USING ( id_cadastro::text = current_setting('request.jwt.claims.id_cadastro', true) )
--   WITH CHECK ( id_cadastro::text = current_setting('request.jwt.claims.id_cadastro', true) );

-- =====================================================================
-- Comandos de verificação rápida (execute no SQL Editor)
-- SELECT count(*) FROM public.cadastros_documentos;
-- SELECT id_documento, id_cadastro, nome_arquivo_original, bucket_nome, chave_bucket, status_documento, data_upload FROM public.cadastros_documentos ORDER BY data_upload DESC LIMIT 20;
-- =====================================================================

