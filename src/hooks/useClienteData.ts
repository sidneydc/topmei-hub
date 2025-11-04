import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { CadastroCliente, CadastroDocumento, Contrato, Servico, ListaDocumento, DocumentoStatus } from '@/types/database';

interface ClienteData {
  cadastro: CadastroCliente | null;
  documentos: CadastroDocumento[];
  documentosStatus: DocumentoStatus[];
  contratos: Contrato[];
  plano: { nome: string; valor: number; proximoVencimento: string } | null;
}

export function useClienteData() {
  const { user } = useAuth();
  const [data, setData] = useState<ClienteData>({
    cadastro: null,
    documentos: [],
    documentosStatus: [],
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

        // Buscar lista de documentos obrigatórios
        const { data: listaDocumentosData, error: listaError } = await supabase
          .from('lista_documentos')
          .select('*')
          .eq('ativo', true)
          .or(`regime_tributario.is.null,regime_tributario.eq.${cadastroData.regime_tributario || ''}`)
          .order('ordem', { ascending: true });

        if (listaError) throw listaError;

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

        // Combinar lista de documentos com documentos enviados
        const documentosEnviadosMap = new Map<string, CadastroDocumento>();
        (documentosData || []).forEach(doc => {
          if (doc.tipo_documento) {
            const existing = documentosEnviadosMap.get(doc.tipo_documento);
            if (!existing || new Date(doc.data_upload) > new Date(existing.data_upload)) {
              documentosEnviadosMap.set(doc.tipo_documento, doc);
            }
          }
        });

        const documentosStatus: DocumentoStatus[] = (listaDocumentosData || []).map(listaDoc => {
          const docEnviado = documentosEnviadosMap.get(listaDoc.nome_documento);
          
          return {
            id_lista_documento: listaDoc.id_lista_documento,
            nome_documento: listaDoc.nome_documento,
            descricao: listaDoc.descricao,
            obrigatorio: listaDoc.obrigatorio,
            ordem: listaDoc.ordem,
            id_documento: docEnviado?.id_documento,
            status_documento: docEnviado?.status_documento,
            nome_arquivo_original: docEnviado?.nome_arquivo_original,
            data_upload: docEnviado?.data_upload,
            motivo_rejeicao: docEnviado?.motivo_rejeicao,
            status_geral: docEnviado ? docEnviado.status_documento : 'nao_enviado'
          };
        });

        setData({
          cadastro: cadastroData as CadastroCliente,
          documentos: (documentosData as CadastroDocumento[]) || [],
          documentosStatus,
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
