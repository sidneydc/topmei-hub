import { z } from 'zod';

export const cadastroClienteSchema = z.object({
  cnpj: z.string().length(14, 'CNPJ deve ter 14 dígitos'),
  razao_social: z.string().min(3, 'Razão social é obrigatória'),
  nome_fantasia: z.string().min(3, 'Nome fantasia é obrigatório'),
  regime_tributario: z.string().min(1, 'Regime tributário é obrigatório'),
});

export const enderecoSchema = z.object({
  logradouro: z.string().min(3, 'Logradouro é obrigatório'),
  numero: z.string().min(1, 'Número é obrigatório'),
  complemento: z.string().optional(),
  bairro: z.string().min(2, 'Bairro é obrigatório'),
  cep: z.string().length(8, 'CEP deve ter 8 dígitos'),
  municipio: z.string().min(2, 'Município é obrigatório'),
  uf: z.string().length(2, 'UF deve ter 2 caracteres'),
});

export type CadastroClienteInput = z.infer<typeof cadastroClienteSchema>;
export type EnderecoInput = z.infer<typeof enderecoSchema>;
