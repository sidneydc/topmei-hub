import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Interfaces (sem mudança)
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

const DOCS_BUCKET = 'cus_doc';

export function useDocumentUpload(): UseDocumentUploadReturn {
  const { toast } = useToast();
  const [progress, setProgress] = useState<UploadProgress>({ progress: 0, isUploading: false });

  const uploadDocument = async (
    clienteId: string, // Recebemos, mas não usamos no path
    listaDocumentoId: string | null,
    file: File,
    documentoNome: string
  ) => {
    try {
      // Validações (mantidas)
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

      // --- ETAPA 1: INSERT NO BANCO (REMOVIDA) ---
      // console.log("Pulando Etapa 1: INSERT no DB")

      // --- ETAPA 2: MONTAR O PATH (SIMPLIFICADO) ---
      const filePath = file.name; // <--- Upload na raiz com nome original
      
      setProgress({ progress: 30, isUploading: true });

      // --- ETAPA 3: UPLOAD PARA O STORAGE ---
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(DOCS_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Permite sobrescrever o arquivo de teste
        });

      if (uploadError) {
        console.error('Erro direto no Upload do Storage:', uploadError);
        toast({ title: 'Erro no upload (Storage)', description: uploadError.message, variant: 'destructive' });
        setProgress({ progress: 0, isUploading: false });
        return { success: false };
      }

      // --- ETAPA 4: UPDATE NO BANCO (REMOVIDA) ---
      // console.log("Pulando Etapa 4: UPDATE no DB")
      
      setProgress({ progress: 100, isUploading: false });
      
      toast({ title: 'TESTE BEM-SUCEDIDO!', description: 'Arquivo enviado direto para o bucket.' });

      return { success: true, url: uploadData.path };

    } catch (error) {
      setProgress({ progress: 0, isUploading: false });
      toast({ title: 'Erro ao enviar documento', description: error instanceof Error ? error.message : 'Erro desconhecido', variant: 'destructive' });
      return { success: false };
    }
  };

  return { uploadDocument, progress };
}