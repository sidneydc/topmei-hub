/*
  Script Node para exportar o esquema do Postgres (Supabase) e salvar em db/migrations/supabase_schema.json

  Uso:
    - Defina a variável de ambiente SUPABASE_DB_URL (string de conexão Postgres, ex: postgres://user:pass@host:5432/dbname)
    - node export_schema_node.js

  Observações:
    - O script usa o pacote "pg". Instale com `npm install pg` se necessário.
    - Para executar a query completa, é executado o mesmo SQL que está em export_schema.sql.
*/

const { Client } = require('pg');
const fs = require('fs');

const DATABASE_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Erro: defina SUPABASE_DB_URL (string de conexão Postgres) no ambiente.');
  process.exit(1);
}

const sql = `
WITH tables AS (
  SELECT table_schema, table_name
  FROM information_schema.tables
  WHERE table_type = 'BASE TABLE'
    AND table_schema NOT IN ('pg_catalog', 'information_schema')
  ORDER BY table_schema, table_name
)
SELECT json_build_object(
  'generated_at', now(),
  'db_schema', (
    SELECT json_agg(json_build_object(
      'schema_name', t.table_schema,
      'table_name', t.table_name,
      'columns', (
        SELECT json_agg(json_build_object(
          'column_name', c.column_name,
          'ordinal_position', c.ordinal_position,
          'data_type', c.data_type,
          'is_nullable', c.is_nullable,
          'column_default', c.column_default,
          'character_maximum_length', c.character_maximum_length,
          'numeric_precision', c.numeric_precision,
          'numeric_scale', c.numeric_scale
        ) ORDER BY c.ordinal_position)
        FROM information_schema.columns c
        WHERE c.table_schema = t.table_schema AND c.table_name = t.table_name
      ),
      'primary_key', (
        SELECT json_agg(a.attname)
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = (t.table_schema || '.' || t.table_name)::regclass AND i.indisprimary
      ),
      'constraints', (
        SELECT json_agg(json_build_object('constraint_name', con.conname, 'type', contype, 'definition', pg_get_constraintdef(con.oid)))
        FROM pg_constraint con
        WHERE con.conrelid = (t.table_schema || '.' || t.table_name)::regclass
      )
    ) ORDER BY t.table_schema, t.table_name)
    FROM tables t
  )
) AS schema;
`;

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  try {
    await client.connect();
    const res = await client.query(sql);
    const out = res.rows[0].schema;
    const outPath = './db/migrations/supabase_schema.json';
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
    console.log('Esquema exportado em', outPath);
  } catch (err) {
    console.error('Erro ao exportar esquema:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

run();
