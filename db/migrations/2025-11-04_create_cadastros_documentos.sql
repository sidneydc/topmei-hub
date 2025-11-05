-- Migration: create cadastros_documentos table
-- Created: 2025-11-04

-- Ensure the uuid extension is available for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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

-- Foreign key to cadastros_clientes.id_cadastro (id_cadastro is nullable)
ALTER TABLE public.cadastros_documentos
    ADD CONSTRAINT fk_cadastros_documentos_cadastros_clientes
    FOREIGN KEY (id_cadastro)
    REFERENCES public.cadastros_clientes (id_cadastro)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- Helpful index for lookups by cadastro
CREATE INDEX IF NOT EXISTS idx_cadastros_documentos_id_cadastro
    ON public.cadastros_documentos (id_cadastro);

-- Optional: Index on status for faster filtering in the UI
CREATE INDEX IF NOT EXISTS idx_cadastros_documentos_status
    ON public.cadastros_documentos (status_documento);
