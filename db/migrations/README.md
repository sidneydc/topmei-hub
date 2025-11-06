# 🗂️ Database Migrations

Esta pasta contém a documentação e scripts SQL para o banco de dados do sistema.

## 📁 Estrutura

```
db/migrations/
├── DOCUMENTACAO.md        # 📚 Documentação completa do aplicativo
├── SCHEMA_COMPLETO.sql    # 🗄️ Script SQL para recriação do banco
└── _archive/              # 📦 Arquivos antigos (histórico)
```

## 🚀 Como Usar

### Para criar o banco do zero:

1. Abra o **SQL Editor** no Supabase
2. Cole o conteúdo de `SCHEMA_COMPLETO.sql`
3. Execute o script
4. Configure os buckets de storage (se necessário via UI)
5. Ative as políticas RLS descomentando as linhas necessárias

### Para entender o sistema:

1. Leia `DOCUMENTACAO.md` — contém:
   - Visão geral da arquitetura
   - Modelo de dados completo
   - Fluxos de usuário
   - Regras de negócio
   - Configurações necessárias

## 📝 Manutenção

Quando houver alterações no banco:

1. **Atualizar** `SCHEMA_COMPLETO.sql` com as mudanças
2. **Documentar** as alterações em `DOCUMENTACAO.md`
3. **Criar migration incremental** (opcional): `db/migrations/YYYY-MM-DD_descricao.sql`
4. **Atualizar versão** no cabeçalho do SQL

## 🔐 Segurança

- ⚠️ **NUNCA** commit senhas ou chaves de API
- ✅ Sempre usar **RLS (Row Level Security)** em produção
- ✅ Validar permissões via **Security Definer Functions**
- ✅ Armazenar roles em **tabela separada** (nunca em localStorage)

## 📦 Pasta _archive/

Contém arquivos antigos e scripts utilitários:
- Versões anteriores do schema
- Scripts de export/import
- Documentação histórica

Mantido para referência e rollback se necessário.

---

**Última atualização**: 2025-11-06
