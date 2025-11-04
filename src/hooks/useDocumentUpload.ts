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
    listaDocumentoId: string,
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

export function useDocumentUpload(): UseDocumentUploadReturn {
  const { toast } = useToast();
  const [progress, setProgress] = useState<UploadProgress>({
    progress: 0,
    isUploading: false,
  });

  const uploadDocument = async (
    clienteId: string,
    listaDocumentoId: string,
    file: File,
    documentoNome: string
  ) => {
    try {
      // Validações
      if (!file) {
        toast({
          title: 'Erro',
          description: 'Nenhum arquivo selecionado',
          variant: 'destructive',
        });
        return { success: false };
      }

      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 10MB',
          variant: 'destructive',
        });
        return { success: false };
      }

      if (!ALLOWED_TYPES.includes(file.type)) {
        toast({
          title: 'Tipo inválido',
          description: 'Apenas PDF e imagens (JPG, PNG, WEBP) são aceitos',
          variant: 'destructive',
        });
        return { success: false };
      }

      setProgress({ progress: 0, isUploading: true });

      // Gera nome único para o arquivo
      const timestamp = Date.now();
      const sanitizedName = documentoNome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-');
      const fileExt = file.name.split('.').pop();
      const filePath = `cliente-${clienteId}/${sanitizedName}/${timestamp}-${sanitizedName}.${fileExt}`;

      setProgress({ progress: 30, isUploading: true });

      // Upload para o Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documentos-clientes')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw new Error(uploadError.message);
      }

      setProgress({ progress: 60, isUploading: true });

      // Obtém URL pública (privada, requer auth)
      const { data: urlData } = supabase.storage
        .from('documentos-clientes')
        .getPublicUrl(filePath);

      setProgress({ progress: 80, isUploading: true });

      // Registra no banco
      const { error: dbError } = await supabase
        .from('cadastros_documentos')
        .insert({
          id_cadastro: clienteId,
          id_lista_documento: listaDocumentoId,
          arquivo_url: urlData.publicUrl,
          status_documento: 'pendente',
          data_envio: new Date().toISOString(),
        });

      if (dbError) {
        console.error('Erro ao registrar documento:', dbError);
        // Tenta remover arquivo se falhou o registro
        await supabase.storage
          .from('documentos-clientes')
          .remove([filePath]);
        throw new Error(dbError.message);
      }

      setProgress({ progress: 100, isUploading: false });

      toast({
        title: 'Sucesso!',
        description: 'Documento enviado para análise',
      });

      return { success: true, url: urlData.publicUrl };
    } catch (error) {
      setProgress({ progress: 0, isUploading: false });
      
      toast({
        title: 'Erro ao enviar documento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });

      return { success: false };
    }
  };

  return { uploadDocument, progress };
}
