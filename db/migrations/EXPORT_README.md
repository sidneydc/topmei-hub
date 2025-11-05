Exportando o esquema do Supabase

Arquivos criados:
- `export_schema.sql`  -> Query para colar no SQL Editor do Supabase; retorna uma coluna "schema" com JSON com tabelas/colunas/constraints.
- `export_schema_node.js` -> Script Node que se conecta ao Postgres (via SUPABASE_DB_URL) e grava `supabase_schema.json` em `db/migrations`.
- `supabase_schema.json` -> (será criado ao rodar o script) snapshot do schema em JSON.

Como usar

1) Via SQL Editor (mais simples — sem expor credenciais):
   - Abra o Supabase project -> SQL Editor.
   - Cole o conteúdo de `export_schema.sql` e execute.
   - O resultado será uma única coluna "schema" com o JSON. Copie e salve em `db/migrations/supabase_schema.json` localmente.

2) Via Node (automático):
   - Defina a variável de ambiente `SUPABASE_DB_URL` com a string de conexão Postgres (você encontra em Settings -> Database -> Connection string no Supabase).
   - Instale dependência (se necessário):
     ```powershell
     npm install pg
     ```
   - Execute:
     ```powershell
     node db/migrations/export_schema_node.js
     ```
   - Isso criará `db/migrations/supabase_schema.json` com o snapshot.

Precauções
- Não comite chaves/senhas: o script usa a string de conexão do Postgres; não compartilhe essa string publicamente.
- O resultado pode conter dados sensíveis apenas nas definições (nomes de colunas) — não há dados de linha, apenas metadados.
- Em ambientes com muitas tabelas, o JSON pode ficar grande; use compressão ou exporte por partes se necessário.

Se quiser, eu executo o script aqui (se você fornecer a string de conexão ou permitir) e salvo o `supabase_schema.json` no repositório. Caso contrário, execute localmente com as instruções acima e me envie o JSON caso eu precise ajudar na interpretação.
