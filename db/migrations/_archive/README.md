# Banco de Dados — migrações e orientação

Este diretório contém documentação e artefatos pensados para uso com o Supabase (Postgres + Auth + Storage).
Coloquei dois arquivos principais:

- `supabase_sqleditor.sql` — um SQL completo (DDL) que cria as tabelas usadas pela aplicação e inclui comentários e sugestões de políticas RLS. Pode colar direto no SQL Editor do Supabase e executar (revise antes de aplicar em produção).
- `README.md` (este arquivo) — documentação rápida sobre o propósito das tabelas, como usar o arquivo SQL e notas operacionais (RLS, buckets, recomendações).

Resumo do modelo (visão alta)

- `cadastros_clientes`: cadastro das empresas/cliente do sistema. Contém CNPJ, razão social, status do cadastro e metadados de auditoria.
- `contratos`: contratos/assinaturas atrelados a um `id_cadastro` e a um plano/serviço, com valores e status.
- `user_roles`: vincula um `user_id` (do Auth) a um papel (role) dentro da plataforma — ex.: `cliente`, `contador`, `admin`.
- `planos`: planos comerciais oferecidos (nome, descrição, preço, ativo).
- `certificados`: metadados sobre certificados digitais enviados (file_path no bucket `certificados`, senha, etc.).
- `notas_servico`: registro de NF de serviço emitida/registrada (metadados armazenados no DB; processamento real da NF pode ser externo).
- `lista_documentos`: lista de documentos que o sistema pode solicitar (RG, CPF, contrato social, etc.).
- `cadastros_documentos`: associação entre um cadastro e o documento solicitado/enviado (status, arquivo, data de upload, motivo de rejeição).

Notas operacionais

1. RLS (Row-Level Security)
   - A aplicação usa Supabase Auth. Para segurança em produção, habilite RLS nas tabelas e crie políticas que limitem leituras/escritas apenas aos usuários/autorizados.
   - O arquivo SQL inclui exemplos comentados de políticas (ex.: permitir que um usuário autenticado insira um cadastro e que um `id_cadastro` seja lido apenas pelo usuário dono ou pelo escritório responsável).

2. Buckets (Storage)
   - Buckets esperados (usados no código): `certificados` (para certificados digitais), possivelmente `documentos` (para uploads de documentos). Verifique `src/hooks/useDocumentUpload.ts` e onde `supabase.storage.from(...)` é chamado para confirmar nomes.

3. Chaves/Identificadores
   - O SQL usa `uuid` para chaves primárias (com `gen_random_uuid()`); o Supabase normalmente já tem a extensão `pgcrypto` disponível, mas o SQL inclui o `CREATE EXTENSION` por segurança.

4. Migrations e deploy
   - Para pequenos testes, cole o conteúdo de `supabase_sqleditor.sql` no SQL Editor do projeto Supabase e execute.
   - Para automação (CI), converta os DDL em arquivos de migração versionados que serão aplicados ao banco.

5. Ajustes esperados
   - Tipos e constraints podem ser ajustados conforme necessidades (ex.: índices, FK adicionais, tamanhos de campos, unique constraints para cnpj, etc.).
   - Se a política de autenticação exigir que `user_roles` referencie `auth.users`, adicione checks/policies apropriadas.

6. Referências no repositório
   - Há uma migração adicional em `db/migrations/20251104_add_cadastros_clientes_columns.sql` (se existir) — mantenha coerência entre migrações.

Se quiser, eu:
- Executo agora um patch que cria um `schema` mais detalhado ou adiciono migrações versioneadas separadas.
- Ajusto as políticas RLS ao modelo de autorização que vocês usam (por exemplo: `criado_por = auth.email` ou `user_id = auth.uid`).

---
Gerado em: 2025-11-04
