import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UploadProgress {
  progress: number;
  isUploading: boolean;
}

interface UseDocumentUploadReturn {
  uploadDocument: (
    clienteId: string,
    listaDocumentoId: string | null,
    file: File,
    documentoNome: string
  ) => Promise<{ success: boolean; url?: string }>;
  progress: UploadProgress;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// Bucket name for client documents. Make configurable via Vite env: VITE_DOCUMENTS_BUCKET
const DOCS_BUCKET = (import.meta.env.VITE_DOCUMENTS_BUCKET as string) || 'documentos-clientes';

export function useDocumentUpload(): UseDocumentUploadReturn {
  const { toast } = useToast();
  const [progress, setProgress] = useState<UploadProgress>({ progress: 0, isUploading: false });

  const uploadDocument = async (
    clienteId: string,
    listaDocumentoId: string | null,
    file: File,
    documentoNome: string
  ) => {
    try {
      // Validações
      if (!file) {
        toast({ title: 'Erro', description: 'Nenhum arquivo selecionado', variant: 'destructive' });
        return { success: false };
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({ title: 'Arquivo muito grande', description: 'O arquivo deve ter no máximo 10MB', variant: 'destructive' });
        return { success: false };
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({ title: 'Tipo inválido', description: 'Apenas PDF e imagens (JPG, PNG, WEBP) são aceitos', variant: 'destructive' });
        return { success: false };
      }

      setProgress({ progress: 0, isUploading: true });

      // 1) Inserir registro inicial no banco para obter id_documento
      const insertPayload: any = {
        id_cadastro: clienteId,
        tipo_documento: documentoNome,
        status_documento: 'pendente_analise',
        versao_documento: 1,
        data_upload: new Date().toISOString(),
      };
      if (listaDocumentoId) insertPayload.id_lista_documento = listaDocumentoId;

      const { data: inserted, error: insertErr } = await supabase
        .from('cadastros_documentos')
        .insert([insertPayload])
        .select('id_documento')
        .single();

      if (insertErr || !inserted) {
        console.error('Erro ao criar registro inicial do documento:', insertErr);
        toast({ title: 'Erro', description: 'Não foi possível iniciar o registro do documento', variant: 'destructive' });
        setProgress({ progress: 0, isUploading: false });
        return { success: false };
      }

      const id_documento = (inserted as any).id_documento as string;

      // 2) Montar path usando id_cadastro e id_documento
      const fileExt = file.name.split('.').pop() || 'bin';
      const filePath = `${clienteId}/${id_documento}.${fileExt}`;

      setProgress({ progress: 30, isUploading: true });

      // 3) Upload para o Storage
      const { data: uploadData, error: uploadError } = await supabase.storage.from(DOCS_BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        // remover registro DB criado pois upload falhou
        await supabase.from('cadastros_documentos').delete().eq('id_documento', id_documento);
        const msg = (uploadError.message || '').toLowerCase();
        if (msg.includes('bucket') || msg.includes('not found')) {
          toast({
            title: 'Bucket não encontrado',
            description: `O bucket '${DOCS_BUCKET}' não foi encontrado no Storage do Supabase. Crie esse bucket no painel do Supabase (Storage -> Create a new bucket) ou ajuste a variável VITE_DOCUMENTS_BUCKET.`,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
        }
        setProgress({ progress: 0, isUploading: false });
        return { success: false };
      }

      setProgress({ progress: 60, isUploading: true });

      // 4) Atualizar registro com metadados e chave do bucket
      const updatePayload: any = {
        bucket_nome: DOCS_BUCKET,
        chave_bucket: filePath,
        nome_arquivo_original: file.name,
        tamanho_arquivo_bytes: file.size,
        tipo_mime: file.type,
      };

      const { error: updateErr } = await supabase.from('cadastros_documentos').update(updatePayload).eq('id_documento', id_documento);

      if (updateErr) {
        console.error('Erro ao atualizar registro do documento:', updateErr);
        toast({ title: 'Aviso', description: 'Arquivo enviado mas falha ao atualizar metadados no banco.', variant: 'destructive' });
      }

      // Tentar gerar uma URL de acesso:
      // - Preferir signed URL para buckets privados (createSignedUrl)
      // - Caso falhe, tentar getPublicUrl (válido para buckets públicos)
      let publicUrl: string | undefined;
      try {
        // 1) Tenta signed URL (1 hora)
        const expiresIn = 60 * 60; // 1 hour
        const { data: signedData, error: signedErr } = await supabase.storage
          .from(DOCS_BUCKET)
          .createSignedUrl(filePath, expiresIn);

        if (!signedErr && signedData && (signedData.signedUrl || (signedData as any).signedURL)) {
          // supabase client may return signedUrl or signedURL depending on version
          publicUrl = (signedData as any).signedUrl || (signedData as any).signedURL;
        } else {
          // 2) Fallback para public url
          try {
            const { data: urlData } = supabase.storage.from(DOCS_BUCKET).getPublicUrl(filePath);
            publicUrl = urlData?.publicUrl;
          } catch (_e) {
            publicUrl = undefined;
          }
        }
      } catch (e) {
        publicUrl = undefined;
      }

      setProgress({ progress: 100, isUploading: false });

      toast({ title: 'Sucesso!', description: 'Documento enviado para análise' });

      return { success: true, url: publicUrl };
    } catch (error) {
      setProgress({ progress: 0, isUploading: false });
      toast({ title: 'Erro ao enviar documento', description: error instanceof Error ? error.message : 'Erro desconhecido', variant: 'destructive' });
      return { success: false };
    }
  };

  return { uploadDocument, progress };
}
