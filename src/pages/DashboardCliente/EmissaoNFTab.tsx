import React from 'react';

type Props = {
  clienteData: any;
};

export default function EmissaoNFTab({ clienteData }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Emissão de NF de Serviço</h2>
      <p className="text-sm text-muted-foreground">Formulário para emissão de notas de serviços e gerenciamento de certificados digitais.</p>
    </div>
  );
}
