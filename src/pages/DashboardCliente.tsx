import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, XCircle, Image as ImageIcon, Trash2, Search, Loader2, Users, Building, Briefcase, FileText, Phone, Mail, Landmark, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useClienteData } from '@/hooks/useClienteData';

type CompanyData = any;

export default function DashboardCliente() {
  const { data: clienteData, isLoading: isLoadingData, error: dataError } = useClienteData();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cnpj, setCnpj] = useState('');
  const [companyData, setCompanyData] = useState<CompanyData>(null);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('Clássico');

  const tabs = [ { id: 'dashboard', label: 'Dashboard' }, { id: 'cadastro', label: 'Cadastro da Empresa' }, { id: 'servicos', label: 'Serviços' }, { id: 'documentos', label: 'Documentos' }, { id: 'orcamentos', label: 'Configurar Orçamentos' } ];

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => { const formattedCnpj = e.target.value.replace(/\D/g, ''); setCnpj(formattedCnpj.slice(0, 14)); };

  const handleCnpjLookup = async () => {
    setIsLoadingCnpj(true); setCompanyData(null); setCnpjError(null);
    try {
      const response = await fetch(`https://open.cnpja.com/office/${cnpj}` );
      if (!response.ok) { throw new Error(response.status === 404 ? 'CNPJ não encontrado.' : `Erro na API: ${response.statusText}`); }
      const data = await response.json();
      setCompanyData(data);
    } catch (error: any) {
      console.error("Erro ao buscar CNPJ:", error);
      setCnpjError(error.message.includes('Failed to fetch') ? "Erro de rede ou CORS. Verifique sua conexão ou a configuração da API." : error.message);
    } finally {
      setIsLoadingCnpj(false);
    }
  };

  const handleOpenCompany = () => { alert('Redirecionando para a página de contratação do serviço de Abertura de Empresa...'); };
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => setLogoPreview(reader.result as string); reader.readAsDataURL(file); } };
  const removeLogo = () => { setLogoPreview(null); const input = document.getElementById('logo-upload') as HTMLInputElement; if (input) input.value = ''; };

  const CadastroTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Cadastro da Empresa</h2>
      <Card>
        <CardContent className="p-6 space-y-6">
          {!companyData && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <div className="w-full sm:flex-grow"><Label htmlFor="cnpj" className="sr-only">CNPJ</Label><Input id="cnpj" placeholder="Digite o CNPJ da sua empresa" value={cnpj} onChange={handleCnpjChange} /></div>
                <Button onClick={handleCnpjLookup} disabled={isLoadingCnpj || cnpj.length !== 14} className="w-full sm:w-auto"><Search className="h-4 w-4 mr-2" />Consultar</Button>
              </div>
              <div className="relative"><div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300" /></div><div className="relative flex justify-center"><span className="bg-card px-2 text-sm text-muted-foreground">OU</span></div></div>
              <div className="text-center">
                <h3 className="text-md font-semibold text-gray-800">Ainda não possui uma empresa?</h3>
                <p className="mt-1 text-sm text-muted-foreground">Deixe a burocracia com a gente. Abra seu CNPJ de forma rápida e segura.</p>
                <Button variant="outline" onClick={handleOpenCompany} className="mt-4">Quero Abrir Minha Empresa</Button>
              </div>
            </div>
          )}
          {isLoadingCnpj && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
          {cnpjError && <p className="text-sm text-red-600">{cnpjError}</p>}
          {companyData && (
            <div className="space-y-8 animate-in fade-in-50">
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Building />Dados Gerais</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"><div><Label>Razão Social</Label><p className="font-semibold">{companyData.company?.name}</p></div><div><Label>Nome Fantasia</Label><p className="font-semibold">{companyData.alias}</p></div><div><Label>Data de Fundação</Label><p className="font-semibold">{new Date(companyData.founded).toLocaleDateString('pt-BR')}</p></div><div><Label>Status</Label><p className="font-semibold"><Badge variant={companyData.status?.text === 'Ativa' ? 'default' : 'destructive'}>{companyData.status?.text}</Badge></p></div><div><Label>É Matriz?</Label><p className="font-semibold">{companyData.head ? 'Sim' : 'Não'}</p></div><div><Label>Porte</Label><p className="font-semibold">{companyData.company?.size?.text}</p></div><div><Label>Natureza Jurídica</Label><p className="font-semibold">{companyData.company?.nature?.text}</p></div><div><Label>Capital Social</Label><p className="font-semibold">{companyData.company?.equity?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div></CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Landmark />Dados Fiscais</CardTitle></CardHeader><CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"><div><Label>Optante Simples</Label><p className="font-semibold">{companyData.company?.simples?.optant ? 'Sim' : 'Não'}</p></div><div><Label>Data Opção Simples</Label><p className="font-semibold">{companyData.company?.simples?.since || 'N/A'}</p></div><div><Label>Optante MEI (Simei)</Label><p className="font-semibold">{companyData.company?.simei?.optant ? 'Sim' : 'Não'}</p></div><div><Label>Data Opção Simei</Label><p className="font-semibold">{companyData.company?.simei?.since || 'N/A'}</p></div></CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users />Quadro Societário</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Cargo</TableHead><TableHead>Desde</TableHead></TableRow></TableHeader><TableBody>{companyData.company?.members?.map((m: any, i: number) => <TableRow key={i}><TableCell>{m.person.name}</TableCell><TableCell>{m.role.text}</TableCell><TableCell>{new Date(m.since).toLocaleDateString('pt-BR')}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Briefcase />Atividades (CNAE)</CardTitle></CardHeader><CardContent className="text-sm space-y-4"><div><Label>Atividade Principal</Label><p className="font-semibold">{companyData.mainActivity?.text}</p></div>{companyData.sideActivities?.length > 0 && <div><Label>Atividades Secundárias</Label><ul className="list-disc list-inside font-semibold">{companyData.sideActivities.map((act: any) => <li key={act.id}>{act.text}</li>)}</ul></div>}</CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileText />Inscrições Estaduais e SUFRAMA</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>UF</TableHead><TableHead>Número</TableHead><TableHead>Tipo</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{companyData.registrations?.map((r: any, i: number) => <TableRow key={i}><TableCell>{r.state}</TableCell><TableCell>{r.number}</TableCell><TableCell>{r.type.text}</TableCell><TableCell><Badge variant={r.status.text === 'Sem restrição' ? 'default' : 'secondary'}>{r.status.text}</Badge></TableCell></TableRow>)}{companyData.suframa?.map((s: any, i: number) => <TableRow key={`suframa-${i}`}><TableCell>AM (SUFRAMA)</TableCell><TableCell>{s.number}</TableCell><TableCell>Incentivo Fiscal</TableCell><TableCell><Badge variant={s.status.text === 'Ativa' ? 'default' : 'secondary'}>{s.status.text}</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><Phone />Contatos</CardTitle></CardHeader><CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><div><Label>Telefones</Label>{companyData.phones?.map((p: any, i: number) => <p key={i} className="font-semibold">({p.area}) {p.number}</p>)}</div><div><Label>Emails</Label>{companyData.emails?.map((e: any, i: number) => <p key={i} className="font-semibold">{e.address}</p>)}</div></CardContent></Card>
              <div className="border-t pt-6 space-y-6"><h3 className="text-xl font-bold">Finalizar Cadastro</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center"><div className="space-y-2"><Label htmlFor="plano">Selecione seu Plano</Label><Select onValueChange={setSelectedPlan} value={selectedPlan}><SelectTrigger><SelectValue placeholder="Escolha um plano..." /></SelectTrigger><SelectContent><SelectItem value="basico">Plano Básico - R$ 29,90/mês</SelectItem><SelectItem value="topmei">Super TOPMEI - R$ 49,91/mês</SelectItem><SelectItem value="premium">Plano Premium - R$ 99,90/mês</SelectItem></SelectContent></Select></div><div className="flex items-center space-x-2 pt-6"><Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} /><Label htmlFor="terms" className="text-sm font-medium leading-none">Li e aceito os <a href="/termos" target="_blank" className="text-primary underline">Termos de Uso e Serviços</a></Label></div></div><div className="flex justify-end pt-4"><Button size="lg" disabled={!selectedPlan || !termsAccepted}>Contratar e Cadastrar Empresa</Button></div></div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (isLoadingData) {
    return (
      <DashboardLayout title="Painel do Cliente" tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadgeVariant = (status: string) => {
    if (status === 'ativo') return 'default';
    if (status === 'aguardando_aprovacao') return 'secondary';
    return 'destructive';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'ativo': 'Ativo',
      'aguardando_aprovacao': 'Aguardando Aprovação',
      'rejeitado': 'Rejeitado',
    };
    return labels[status] || status;
  };

  const getDocumentosStats = () => {
    const total = clienteData.documentos.length;
    const aprovados = clienteData.documentos.filter(d => d.status_documento === 'aprovado').length;
    const pendentes = clienteData.documentos.filter(d => d.status_documento === 'pendente_analise').length;
    const rejeitados = clienteData.documentos.filter(d => d.status_documento === 'rejeitado').length;
    
    return { total, aprovados, pendentes, rejeitados };
  };

  const docStats = getDocumentosStats();

  return (
    <DashboardLayout title="Painel do Cliente" tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {dataError && (
            <Card className="p-4 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{dataError}</p>
            </Card>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Status Cadastro" 
              value={getStatusLabel(clienteData.cadastro?.status_cadastro || 'aguardando_aprovacao')}
              description={clienteData.cadastro?.data_aprovacao 
                ? `Aprovado em ${new Date(clienteData.cadastro.data_aprovacao).toLocaleDateString('pt-BR')}` 
                : 'Aguardando aprovação'}
              variant={clienteData.cadastro?.status_cadastro === 'ativo' ? 'success' : 'warning'} 
            />
            <StatCard 
              title="Plano" 
              value={clienteData.plano?.nome || 'Sem plano'}
              description={clienteData.plano 
                ? `R$ ${clienteData.plano.valor.toFixed(2)}/mês` 
                : 'Nenhum plano contratado'}
              variant={clienteData.plano ? 'default' : 'warning'}
            />
            <StatCard 
              title="Documentos" 
              value={`${docStats.aprovados}/${docStats.total}`}
              description={docStats.pendentes > 0 
                ? `${docStats.pendentes} pendente(s)` 
                : docStats.rejeitados > 0 
                  ? `${docStats.rejeitados} rejeitado(s)` 
                  : 'Todos aprovados'}
              variant={docStats.pendentes > 0 || docStats.rejeitados > 0 ? 'destructive' : 'success'} 
            />
          </div>
          {clienteData.cadastro && (
            <Card>
              <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Razão Social</Label>
                    <p className="font-semibold">{clienteData.cadastro.razao_social || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Nome Fantasia</Label>
                    <p className="font-semibold">{clienteData.cadastro.nome_fantasia || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>CNPJ</Label>
                    <p className="font-semibold">{clienteData.cadastro.cnpj || 'N/A'}</p>
                  </div>
                  <div>
                    <Label>Regime Tributário</Label>
                    <p className="font-semibold">{clienteData.cadastro.regime_tributario || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      {activeTab === 'cadastro' && <CadastroTab />}
      {activeTab === 'servicos' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Meus Serviços</h2>
          {clienteData.contratos.length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground">Nenhum serviço contratado</p>
            </Card>
          ) : (
            clienteData.contratos.map((contrato) => (
              <Card key={contrato.id_contrato} className="p-6 border-l-4 border-primary">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold">{(contrato as any).servicos?.nome_servico || 'Serviço'}</h3>
                    <Badge variant="default" className="mt-2">
                      {getStatusLabel(contrato.status_contrato)}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      R$ {(contrato.valor_final || 0).toFixed(2)}
                    </p>
                    {contrato.data_proximo_vencimento && (
                      <p className="text-xs text-muted-foreground">
                        Próx: {new Date(contrato.data_proximo_vencimento).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
      {activeTab === 'documentos' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Meus Documentos</h2>
          <Card className="p-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {docStats.aprovados} de {docStats.total} documento(s) aprovado(s)
            </p>
          </Card>
          {clienteData.documentos.length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground">Nenhum documento enviado ainda</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {clienteData.documentos.map((doc) => (
                <Card key={doc.id_documento} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold">{doc.tipo_documento || 'Documento'}</h3>
                      {doc.nome_arquivo_original && (
                        <p className="text-sm text-muted-foreground">{doc.nome_arquivo_original}</p>
                      )}
                    </div>
                    {doc.status_documento === 'aprovado' && (
                      <Badge variant="default" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />Aprovado
                      </Badge>
                    )}
                    {doc.status_documento === 'rejeitado' && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />Rejeitado
                      </Badge>
                    )}
                    {doc.status_documento === 'pendente_analise' && (
                      <Badge variant="secondary">Pendente</Badge>
                    )}
                  </div>
                  {doc.motivo_rejeicao && (
                    <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                      Motivo: {doc.motivo_rejeicao}
                    </p>
                  )}
                  {(doc.status_documento === 'rejeitado' || doc.status_documento === 'pendente_analise') && (
                    <Button className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      {doc.status_documento === 'rejeitado' ? 'Reenviar' : 'Atualizar'}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
      {activeTab === 'orcamentos' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Configurar Orçamentos</h2>
          <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-green-600 mt-1 flex-shrink-0"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Gere Orçamentos em PDF direto pelo WhatsApp!</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">As informações que você salvar aqui (seu logo, slogan, "Quem Somos", etc. ) serão o <strong>modelo padrão</strong> para seus orçamentos.</p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Depois, basta enviar os detalhes do serviço para o nosso robô no WhatsApp (por texto ou áudio), e ele usará este modelo para criar um PDF profissional na hora, pronto para você enviar ao seu cliente.</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                <div className="space-y-2">
                  <Label>Escolher Template</Label>
                  <div className="flex gap-4 flex-wrap pt-2">
                    {['Clássico', 'Moderno', 'Minimalista'].map((templateName, index) => (
                      <div key={templateName} className={`relative border-2 rounded-lg cursor-pointer transition-all p-1 ${selectedTemplate === templateName ? 'border-primary' : 'border-transparent hover:border-gray-300'}`} onClick={() => setSelectedTemplate(templateName)}>
                        <img src={`https://via.placeholder.com/150x100?text=${templateName}`} alt={templateName} className="rounded-md" />
                        <p className="text-center text-xs font-medium mt-2">{templateName}</p>
                        {selectedTemplate === templateName && (<div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1"><CheckCircle className="h-4 w-4" /></div> )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2"><Label>Logo da Empresa</Label>{logoPreview ? <div className="flex items-center gap-4"><img src={logoPreview} alt="Logo" className="h-16 w-auto border rounded-md p-1 bg-slate-50" /><Button type="button" variant="ghost" size="sm" onClick={removeLogo} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4 mr-2" />Remover</Button></div> : <div className="flex items-center justify-center w-full"><Label htmlFor="logo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted"><div className="flex flex-col items-center justify-center pt-5 pb-6"><ImageIcon className="w-8 h-8 mb-4 text-muted-foreground" /><p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Clique para enviar</span></p><p className="text-xs text-muted-foreground">PNG, JPG (MAX. 2MB)</p></div><Input id="logo-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleLogoChange} /></Label></div>}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><Label htmlFor="slogan">Slogan</Label><Input id="slogan" placeholder="Soluções que impulsionam seu negócio" /></div><div className="space-y-2"><Label htmlFor="whatsapp">WhatsApp</Label><Input id="whatsapp" placeholder="(11) 99999-9999" /></div></div>
                <div className="space-y-2"><Label htmlFor="about-us">Quem Somos</Label><Textarea id="about-us" placeholder="Breve descrição da empresa..." /><p className="text-xs text-muted-foreground">Máx 500 caracteres.</p></div>
                <div className="space-y-2"><Label htmlFor="introduction">Introdução do Orçamento</Label><Textarea id="introduction" placeholder="Texto que aparecerá no início de toda proposta..." /><p className="text-xs text-muted-foreground">Máximo 500 caracteres.</p></div>
                <div className="space-y-2"><Label htmlFor="notes">Notas Padrão</Label><Textarea id="notes" placeholder="Observações, termos de validade da proposta, etc." /><p className="text-xs text-muted-foreground">Informações que aparecerão no rodapé de todo orçamento.</p></div>
                <div className="flex justify-end gap-3 pt-4"><Button type="button" variant="outline">Cancelar</Button><Button type="submit">Salvar Configurações</Button></div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
