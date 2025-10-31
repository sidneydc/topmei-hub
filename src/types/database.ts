// Tipos baseados no schema do Supabase fornecido

export type AppRole = 'admin' | 'contador' | 'cliente';

export interface Escritorio {
  id_escritorio: string;
  nome_escritorio: string;
  cnpj_escritorio?: string;
  email_escritorio?: string;
  telefone_escritorio?: string;
  uf_escritorio?: string;
  data_criacao: string;
}

export interface Profissional {
  id_profissional: string;
  email_profissional: string;
  nome_profissional: string;
  telefone?: string;
  ativo_sistema: boolean;
  data_criacao: string;
}

export interface ProfissionalEscritorio {
  id_profissional_escritorio: string;
  id_profissional: string;
  id_escritorio: string;
  funcao: 'admin' | 'contador' | 'operacional';
  ativo: boolean;
  data_inicio: string;
  data_fim?: string;
}

export interface CadastroCliente {
  id_cadastro: string;
  id_escritorio: string;
  cnpj?: string;
  razao_social?: string;
  nome_fantasia?: string;
  regime_tributario?: string;
  status_cadastro: 'aguardando_aprovacao' | 'ativo' | 'rejeitado';
  motivo_rejeicao?: string;
  criado_por?: string;
  aprovado_por?: string;
  data_criacao: string;
  data_aprovacao?: string;
  data_atualizacao: string;
}

export interface CadastroDocumento {
  id_documento: string;
  id_cadastro: string;
  tipo_documento?: string;
  categoria_documento?: string;
  criticidade?: string;
  obrigatorio: boolean;
  nome_arquivo_original?: string;
  tamanho_arquivo_bytes?: number;
  tipo_mime?: string;
  bucket_nome?: string;
  chave_bucket?: string;
  hash_arquivo?: string;
  status_documento: 'pendente_analise' | 'aprovado' | 'rejeitado';
  motivo_rejeicao?: string;
  versao_documento: number;
  data_upload: string;
  data_aprovacao?: string;
  enviado_por?: string;
  aprovado_por?: string;
}

export interface ListaDocumento {
  id_lista_documento: string;
  nome_documento: string;
  descricao?: string;
  obrigatorio: boolean;
  regime_tributario?: string;
  ativo: boolean;
  ordem: number;
}

export interface Endereco {
  id_endereco: string;
  id_cadastro: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  municipio?: string;
  uf?: string;
}

export interface Contrato {
  id_contrato: string;
  id_cadastro: string;
  id_servico?: string;
  numero_contrato?: string;
  data_contratacao?: string;
  data_inicio_vigencia?: string;
  data_fim_vigencia?: string;
  ciclo_cobranca?: string;
  preco_contratado?: number;
  desconto_aplicado?: number;
  valor_desconto?: number;
  valor_final?: number;
  data_proximo_vencimento?: string;
  status_contrato: 'ativo' | 'inativo' | 'cancelado';
  renovacao_automatica: boolean;
  data_criacao: string;
}

export interface Cobranca {
  id_cobranca: string;
  id_contrato: string;
  numero_cobranca?: string;
  valor?: number;
  data_emissao?: string;
  data_vencimento?: string;
  data_pagamento?: string;
  status_cobranca: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  forma_pagamento?: string;
  multa: number;
  juros: number;
}

export interface Notificacao {
  id_notificacao: string;
  id_cadastro?: string;
  id_escritorio?: string;
  tipo_notificacao?: string;
  titulo?: string;
  mensagem?: string;
  detalhes?: Record<string, any>;
  destinatario_email?: string;
  lida: boolean;
  data_criacao: string;
  data_expiracao?: string;
}

export interface Servico {
  id_servico: string;
  id_escritorio?: string;
  nome_servico: string;
  descricao?: string;
  tipo_servico?: string;
  regime_tributario?: string;
  preco_unitario?: number;
  ativo: boolean;
}

export interface Plano {
  id_plano: string;
  id_escritorio?: string;
  nome_plano?: string;
  descricao?: string;
  regime_tributario?: string;
  preco_mensal?: number;
  preco_anual?: number;
  desconto_anual?: number;
  ativo: boolean;
}

export interface UserSession {
  user_id: string;
  email: string;
  nome: string;
  role: AppRole;
  id_escritorio?: string;
  id_cadastro?: string;
}
