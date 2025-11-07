import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Eye, AlertCircle, Paperclip, X, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/lib/supabase/client';
import type { DocumentoStatus } from '@/types/database';
import { useDropzone } from 'react-dropzone';

// Componente para o Badge (copiado do seu DocumentosTab.tsx)
const GetStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'aprovado':
      return <Badge className="bg-green-500 hover:bg-green-600 text-white">Aprovado</Badge>;
    case 'pendente_analise':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">Aguardando Análise</Badge>;
    case 'rejeitado':
      return <Badge className="bg-red-500 hover:bg-red-600 text-white">Rejeitado</Badge>;
    case 'nao_enviado':
      return <Badge variant="secondary">Não Enviado</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

type Props = {
  doc: DocumentoStatus;
  clienteId: string;
  onUploaded?: () => void;
};

export default function DocumentoCard({ doc, clienteId, onUploaded }: Props) {
  const { uploadDocument, progress } = useDocumentUpload();
  const [stagedFile, setStagedFile] = useState<File | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setStagedFile(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpeg', '.jpg'], 'image/png': ['.png'], 'image/webp': ['.webp'] },
    maxFiles: 1,
    multiple: false,
  });

  const handleSendFile = async () => {
    if (!stagedFile) return;

    const result = await uploadDocument(
      clienteId,
      doc.id_lista_documento || null,
      stagedFile,
      doc.nome_documento || 'Documento'
    );

    if (result.success) {
      setStagedFile(null); // Limpa o arquivo preparado
      onUploaded && onUploaded();
    }
  };

  // Botões de Visualizar/Baixar (copiado do seu DocumentosTab.tsx)
  const renderActionButtons = () => {
    if ((doc.status_geral === 'aprovado' || doc.status_geral === 'pendente_analise') && doc.nome_arquivo_original) {
      return (
        <>
          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const bucket = doc.bucket_nome || 'cus_doc';
              const chave = doc.chave_bucket as string;
              const { data: signed, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(chave, 60);
              if (signedError || !signed?.signedUrl) {
                const { data: pub } = supabase.storage.from(bucket).getPublicUrl(chave);
                window.open(pub.publicUrl, '_blank');
              } else {
                window.open(signed.signedUrl, '_blank');
              }
            } catch (e) { console.error('Erro ao obter URL do arquivo:', e); }
          }}>
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
          <Button size="sm" variant="ghost" onClick={async () => {
             try {
              const bucket = doc.bucket_nome || 'cus_doc';
              const chave = doc.chave_bucket as string;
              const { data: signed, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(chave, 60);
              const url = (signedError || !signed?.signedUrl) ? (supabase.storage.from(bucket).getPublicUrl(chave).data.publicUrl) : signed.signedUrl;
              const a = document.createElement('a');
              a.href = url as string;
              a.download = doc.nome_arquivo_original as string;
              a.target = '_blank';
              document.body.appendChild(a);
              a.click();
              a.remove();
            } catch (e) { console.error('Erro ao baixar arquivo:', e); }
          }}>
            Baixar
          </Button>
        </>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {doc.nome_documento}
              {doc.obrigatorio && <Badge variant="outline" className="text-xs">Obrigatório</Badge>}
            </CardTitle>
            {doc.descricao && <CardDescription className="mt-1">{doc.descricao}</CardDescription>}
          </div>
          <GetStatusBadge status={doc.status_geral} />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Informações do arquivo existente */}
          {doc.nome_arquivo_original && !stagedFile && (
            <div className="text-sm">
              <span className="text-muted-foreground">Arquivo: </span>
              <span className="font-medium">{doc.nome_arquivo_original}</span>
            </div>
          )}
          {doc.data_upload && !stagedFile && (
            <div className="text-sm">
              <span className="text-muted-foreground">Enviado em: </span>
              <span className="font-medium">{new Date(doc.data_upload as string).toLocaleDateString('pt-BR')}</span>
            </div>
          )}
          {doc.motivo_rejeicao && !stagedFile && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription><strong>Motivo da rejeição:</strong> {doc.motivo_rejeicao}</AlertDescription>
            </Alert>
          )}

          {/* Área de Upload (Dropzone) */}
          {(doc.status_geral === 'nao_enviado' || doc.status_geral === 'rejeitado') && !stagedFile && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}
                ${progress.isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} disabled={progress.isUploading} />
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              {isDragActive ? (
                <p>Solte o arquivo aqui...</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {progress.isUploading ? 'Enviando...' : 'Arraste um arquivo ou clique para selecionar'}
                </p>
              )}
            </div>
          )}

          {/* Área de Staging (Arquivo preparado) - O [X] está aqui! */}
          {stagedFile && (
            <div className="p-4 rounded-md border bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Paperclip className="w-4 h-4" />
                  <span>{stagedFile.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setStagedFile(null)} disabled={progress.isUploading}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Button onClick={handleSendFile} disabled={progress.isUploading} className="w-full">
                {progress.isUploading ? 'Enviando...' : <><Send className="w-4 h-4 mr-2" /> Confirmar e Enviar</>}
              </Button>
            </div>
          )}

          {/* Botões de Ação (Visualizar/Baixar) */}
          <div className="flex gap-2 pt-2">
            {renderActionButtons()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}