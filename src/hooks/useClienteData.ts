import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { CadastroCliente, CadastroDocumento, Contrato, Servico } from '@/types/database';

interface ClienteData {
  cadastro: CadastroCliente | null;
  documentos: CadastroDocumento[];
  contratos: Contrato[];
  plano: { nome: string; valor: number; proximoVencimento: string } | null;
}

export function useClienteData() {
  const { user } = useAuth();
  const [data, setData] = useState<ClienteData>({
    cadastro: null,
    documentos: [],
    contratos: [],
    plano: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClienteData() {
      if (!user?.id_cadastro) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Buscar cadastro do cliente
        const { data: cadastroData, error: cadastroError } = await supabase
          .from('cadastros_clientes')
          .select('*')
          .eq('id_cadastro', user.id_cadastro)
          .single();

        if (cadastroError) throw cadastroError;

        // Buscar documentos
        const { data: documentosData, error: documentosError } = await supabase
          .from('cadastros_documentos')
          .select('*')
          .eq('id_cadastro', user.id_cadastro)
          .order('data_upload', { ascending: false });

        if (documentosError) throw documentosError;

        // Buscar contratos ativos
        const { data: contratosData, error: contratosError } = await supabase
          .from('contratos')
          .select(`
            *,
            servicos (
              nome_servico,
              preco_unitario
            )
          `)
          .eq('id_cadastro', user.id_cadastro)
          .eq('status_contrato', 'ativo')
          .order('data_criacao', { ascending: false });

        if (contratosError) throw contratosError;

        // Processar plano (pegar o contrato mais recente)
        let planoInfo = null;
        if (contratosData && contratosData.length > 0) {
          const contratoAtivo = contratosData[0];
          planoInfo = {
            nome: (contratoAtivo as any).servicos?.nome_servico || 'N/A',
            valor: contratoAtivo.valor_final || 0,
            proximoVencimento: contratoAtivo.data_proximo_vencimento || '',
          };
        }

        setData({
          cadastro: cadastroData as CadastroCliente,
          documentos: (documentosData as CadastroDocumento[]) || [],
          contratos: (contratosData as Contrato[]) || [],
          plano: planoInfo,
        });
      } catch (err: any) {
        console.error('Erro ao buscar dados do cliente:', err);
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    }

    fetchClienteData();
  }, [user?.id_cadastro]);

  return { data, isLoading, error };
}
