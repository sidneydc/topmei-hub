import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Eye, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import type { DocumentoStatus } from '@/types/database';

type Props = {
  clienteData: { documentosStatus?: DocumentoStatus[] } | any;
  onUploaded?: () => void;
};

export default function DocumentosTab({ clienteData, onUploaded }: Props) {
  const { uploadDocument, progress } = useDocumentUpload();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all');
  const [obrigatorioFilter, setObrigatorioFilter] = useState<'all' | 'obrigatorio' | 'opcional'>('all');
  const [outroNome, setOutroNome] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentUploadMeta = useRef<{ listaDocId: string | null; nomeDoc: string } | null>(null);

  const getStatusBadge = (status: string) => {
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

  const openFilePicker = (listaDocId: string | null, nomeDoc: string) => {
    currentUploadMeta.current = { listaDocId, nomeDoc };
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.jpeg,.png,.webp';
      input.style.display = 'none';
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const meta = currentUploadMeta.current;
        if (!meta) return;

        const clienteId = user?.id_cadastro || '';
        const result = await uploadDocument(clienteId, meta.listaDocId, file, meta.nomeDoc);
        if (result.success) {
          onUploaded && onUploaded();
        }
      };
      document.body.appendChild(input);
      fileInputRef.current = input;
    }

    // trigger click
    fileInputRef.current.value = '';
    fileInputRef.current.click();
  };

  if (!clienteData || !clienteData.documentosStatus) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Meus Documentos</h2>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">Nenhum documento solicitado.</p>
        </Card>
      </div>
    );
  }

  const documentos: DocumentoStatus[] = clienteData.documentosStatus || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Meus Documentos</h2>
      <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          {documentos.filter((d) => d.status_geral === 'aprovado').length} de {documentos.length} documento(s) aprovado(s) • {documentos.filter((d) => d.status_geral === 'nao_enviado').length} não enviado(s)
        </p>
      </Card>

      {/* Filters */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtrar por status:</span>
          {['all', 'nao_enviado', 'pendente_analise', 'aprovado', 'rejeitado'].map((st) => (
            <Button key={st} variant={filterStatus === st ? 'default' : 'ghost'} size="sm" onClick={() => setFilterStatus(st as any)}>
              {st === 'all' ? 'Todos' : (st === 'nao_enviado' ? 'Não enviado' : st === 'pendente_analise' ? 'Pendente' : st === 'aprovado' ? 'Aprovado' : 'Rejeitado')}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Obrigatório / Opcional:</span>
          {['all', 'obrigatorio', 'opcional'].map((o) => (
            <Button key={o} variant={obrigatorioFilter === o ? 'default' : 'ghost'} size="sm" onClick={() => setObrigatorioFilter(o as any)}>
              {o === 'all' ? 'Todos' : (o === 'obrigatorio' ? 'Obrigatório' : 'Opcional')}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {documentos
          .filter((d) => filterStatus === 'all' ? true : d.status_geral === filterStatus)
          .filter((d) => obrigatorioFilter === 'all' ? true : (obrigatorioFilter === 'obrigatorio' ? !!d.obrigatorio : !d.obrigatorio))
          .map((doc) => (
          <Card key={doc.id_lista_documento || doc.id_documento}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {doc.nome_documento}
                    {doc.obrigatorio && (
                      <Badge variant="outline" className="text-xs">Obrigatório</Badge>
                    )}
                  </CardTitle>
                  {doc.descricao && (
                    <CardDescription className="mt-1">{doc.descricao}</CardDescription>
                  )}
                </div>
                {getStatusBadge(doc.status_geral)}
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {doc.nome_arquivo_original && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Arquivo: </span>
                    <span className="font-medium">{doc.nome_arquivo_original}</span>
                  </div>
                )}

                {doc.data_upload && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Enviado em: </span>
                    <span className="font-medium">
                      {new Date(doc.data_upload as string).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                {doc.motivo_rejeicao && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Motivo da rejeição:</strong> {doc.motivo_rejeicao}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-2">
                  {doc.status_geral === 'nao_enviado' && (
                    <Button 
                      size="sm" 
                      onClick={() => openFilePicker(doc.id_lista_documento || null, doc.nome_documento || 'Documento')}
                      disabled={progress?.isUploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {progress?.isUploading ? 'Enviando...' : 'Enviar Documento'}
                    </Button>
                  )}

                  {doc.status_geral === 'rejeitado' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openFilePicker(doc.id_lista_documento || null, doc.nome_documento || 'Documento')}
                      disabled={progress?.isUploading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {progress?.isUploading ? 'Enviando...' : 'Reenviar Documento'}
                    </Button>
                  )}

                  {(doc.status_geral === 'aprovado' || doc.status_geral === 'pendente_analise') && doc.nome_arquivo_original && (
                      <>
                        <Button size="sm" variant="outline" onClick={async () => {
                          try {
                            const bucket = doc.bucket_nome || (import.meta.env.VITE_DOCUMENTS_BUCKET as string) || 'documentos-clientes';
                            const chave = doc.chave_bucket as string;
                            const { data: signed, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(chave, 60);
                            if (signedError || !signed?.signedUrl) {
                              const { data: pub } = supabase.storage.from(bucket).getPublicUrl(chave);
                              window.open(pub.publicUrl, '_blank');
                            } else {
                              window.open(signed.signedUrl, '_blank');
                            }
                          } catch (e) {
                            console.error('Erro ao obter URL do arquivo:', e);
                            alert('Erro ao obter URL do arquivo. Verifique as permissões do bucket.');
                          }
                        }}>
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          try {
                            const bucket = doc.bucket_nome || (import.meta.env.VITE_DOCUMENTS_BUCKET as string) || 'documentos-clientes';
                            const chave = doc.chave_bucket as string;
                            const { data: signed, error: signedError } = await supabase.storage.from(bucket).createSignedUrl(chave, 60);
                            const url = (signedError || !signed?.signedUrl) ? (supabase.storage.from(bucket).getPublicUrl(chave).data.publicUrl) : signed.signedUrl;
                            // trigger download
                            const a = document.createElement('a');
                            a.href = url as string;
                            a.download = doc.nome_arquivo_original as string;
                            a.target = '_blank';
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                          } catch (e) {
                            console.error('Erro ao baixar arquivo:', e);
                            alert('Erro ao baixar o arquivo.');
                          }
                        }}>
                          Baixar
                        </Button>
                      </>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

        {/* Upload for 'Outros Documentos' */}
        <Card>
          <CardHeader>
            <CardTitle>Enviar Outros Documentos</CardTitle>
            <CardDescription>Permite enviar documentos que não estão na lista. Informe um nome descritivo.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
              <input className="input" placeholder="Nome do documento (ex: Extrato bancário - Jan/2025)" value={outroNome} onChange={(e) => setOutroNome(e.target.value)} />
              <Button onClick={() => {
                if (!outroNome || outroNome.trim().length < 3) return alert('Informe um nome descritivo para o documento.');
                // Reuse openFilePicker with listaDocId = null
                openFilePicker(null, outroNome.trim());
              }} disabled={progress?.isUploading}>
                <Upload className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Tipos aceitos: PDF e imagens (JPG, PNG, WEBP). Tamanho máximo: 10MB.</p>
          </CardContent>
        </Card>
    </div>
  );
}
