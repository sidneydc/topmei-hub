import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, CheckCircle, XCircle, Image as ImageIcon, Trash2, Search, Loader2, Users, Building, Briefcase, FileText, Phone, Mail, Landmark, Info, Eye, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useClienteData } from '@/hooks/useClienteData';
import { supabase } from '@/lib/supabase/client';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useAuth } from '@/lib/auth-context';
import CadastroTab from './CadastroTab';
import ServicosTab from './ServicosTab';
import DocumentosTab from './DocumentosTab';

type CompanyData = any;

export default function DashboardCliente() {
  const { user, refreshUser } = useAuth();
  const { data: clienteData, isLoading: isLoadingData, error: dataError, refetch } = useClienteData();
  const { uploadDocument, progress } = useDocumentUpload();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [cnpj, setCnpj] = useState('');
  const [companyData, setCompanyData] = useState<CompanyData>(null);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [cnpjError, setCnpjError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [lastInsertResp, setLastInsertResp] = useState<any>(null);
  const [lastContratoResp, setLastContratoResp] = useState<any>(null);
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [openCompanies, setOpenCompanies] = useState<Record<string, boolean>>({});
  const [selectedTemplate, setSelectedTemplate] = useState('Clássico');
  const [nfDescription, setNfDescription] = useState('');
  const [nfAmount, setNfAmount] = useState<number | null>(null);
  const [isIssuingNF, setIsIssuingNF] = useState(false);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassword, setCertPassword] = useState('');
  const [certTermsAccepted, setCertTermsAccepted] = useState(false);
  const [certUploading, setCertUploading] = useState(false);
  const [savedCertPath, setSavedCertPath] = useState<string | null>(null);
  const [tomadorCpfCnpj, setTomadorCpfCnpj] = useState('');
  const [localPrestacao, setLocalPrestacao] = useState<'Brasil' | 'Exterior'>('Brasil');
  const [dataCompetencia, setDataCompetencia] = useState<string>('');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'cadastro', label: 'Cadastro da Empresa' },
    { id: 'servicos', label: 'Serviços' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'emissao_nf', label: 'Emissão de NF de Serviço' },
    { id: 'orcamentos', label: 'Configurar Orçamentos' }
  ];

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

  const handleSubmitCadastro = async () => {
    // Discard logo upload per current session requirements
    if (!companyData && cnpj.length !== 14) return alert('Informe um CNPJ válido ou consulte antes.');
    if (!selectedPlan) return alert('Selecione um plano');
    if (!termsAccepted) return alert('Você precisa aceitar os Termos de Uso e Serviços');

    try {
      // Check duplicate by CNPJ
      const cnpjToCheck = companyData?.company?.cnpj || cnpj;
      if (!cnpjToCheck) return alert('CNPJ inválido');

      const { data: existing } = await supabase
        .from('cadastros_clientes')
        .select('id_cadastro')
        .eq('cnpj', cnpjToCheck)
        .single();

      if (existing) {
        alert('Já existe um cadastro com esse CNPJ. Se for seu, contate o suporte para vinculação.');
        return;
      }

      // Insert new cadastro
      const payload: any = {
        cnpj: cnpjToCheck,
        razao_social: companyData?.company?.name || '',
        nome_fantasia: companyData?.alias || '',
        id_escritorio: '7716b7b4-7a4e-400a-81fa-e54511c898ba',
        regime_tributario: companyData?.company?.simples?.optant ? 'SIMPLES' : null,
        status_cadastro: 'aguardando_aprovacao',
        criado_por: user?.email || null,
        data_criacao: new Date().toISOString()
      };

      const insertResp = await supabase
        .from('cadastros_clientes')
        .insert([payload])
        .select()
        .single();

  // Log full response for debugging
  console.log('cadastros_clientes.insert response:', insertResp);
  setLastInsertResp(insertResp);

  const insertedCadastro = (insertResp as any).data;
  const insertError = (insertResp as any).error;

      if (insertError || !insertedCadastro) {
        console.error('Erro ao criar cadastro (detalhado):', insertResp);
        alert(`Erro ao criar cadastro: ${insertError?.message || 'verifique o console para detalhes'}`);
        return;
      }

      // Create initial contrato for selected plan (status pendente)
  const selectedPlanObj = plans.find((p) => String(p.id_plano) === String(selectedPlan));
      const planPrice = selectedPlanObj ? Number(selectedPlanObj.preco_mensal || 0) : 0;
      const contratoPayload: any = {
        id_cadastro: insertedCadastro.id_cadastro,
        id_servico: null,
        valor_final: planPrice,
        status_contrato: 'pendente',
        data_criacao: new Date().toISOString()
      };

  const contratoResp = await supabase.from('contratos').insert([contratoPayload]).select();
  console.log('contratos.insert response:', contratoResp);
  setLastContratoResp(contratoResp);
  const contratoError = (contratoResp as any).error;
      if (contratoError) {
        console.error('Erro ao criar contrato (detalhado):', contratoResp);
        // not fatal for cadastro
      }

      // Ensure user_roles exists for this user
      if (user?.user_id) {
        const { data: ur } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('user_id', user.user_id)
          .single();
        if (!ur) {
          await supabase.from('user_roles').insert([{ user_id: user.user_id, role: 'cliente' }]);
        }
      }

      alert('Cadastro criado com sucesso. Aguardando aprovação.');
      await refetch();
      try {
        if (refreshUser) await refreshUser();
      } catch (e) {
        console.error('Erro ao atualizar usuário após cadastro:', e);
      }
    } catch (err) {
      console.error('Erro no fluxo de cadastro:', err);
      alert('Erro ao processar cadastro. Veja console para detalhes.');
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const { data, error } = await supabase.from('planos').select('*').eq('ativo', true);
        if (error) {
          console.error('Erro ao carregar planos:', error);
        } else if (isMounted && data) {
          setPlans(data);
        }
      } catch (e) {
        console.error('Erro inesperado ao buscar planos:', e);
      } finally {
        if (isMounted) setIsLoadingPlans(false);
      }
    };
    loadPlans();
    return () => { isMounted = false; };
  }, []);

  const CadastroTabInline = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Cadastro da Empresa</h2>
      <Card>
        <CardContent className="p-6 space-y-6">
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

          {/* Registered companies for this user (collapsible cards) */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Empresas cadastradas</h3>
            <div className="mt-3 space-y-3">
              {((user as any)?.cadastros && (user as any).cadastros.length > 0 ? (user as any).cadastros : (clienteData?.cadastro ? [clienteData.cadastro] : [])).map((c: any) => {
                const isOpen = !!openCompanies[c.id_cadastro];
                return (
                  <Card key={c.id_cadastro}>
                    <CardHeader className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">{c.razao_social || c.nome_fantasia || c.cnpj}</CardTitle>
                        <CardDescription className="text-xs">{c.cnpj || '—'}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setOpenCompanies(prev => ({ ...prev, [c.id_cadastro]: !prev[c.id_cadastro] }))}>{isOpen ? 'Fechar' : 'Abrir'}</Button>
                      </div>
                    </CardHeader>
                    {isOpen && (
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><Label>CNPJ</Label><p className="font-semibold">{c.cnpj || 'N/A'}</p></div>
                        <div><Label>Razão Social</Label><p className="font-semibold">{c.razao_social || 'N/A'}</p></div>
                        <div><Label>Nome Fantasia</Label><p className="font-semibold">{c.nome_fantasia || 'N/A'}</p></div>
                        <div><Label>Status</Label><p className="font-semibold">{c.status_cadastro || 'N/A'}</p></div>
                        <div><Label>Data de Criação</Label><p className="font-semibold">{c.data_criacao ? new Date(c.data_criacao).toLocaleString('pt-BR') : 'N/A'}</p></div>
                        <div><Label>Motivo Rejeição</Label><p className="font-semibold">{c.motivo_rejeicao || '—'}</p></div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
              {((user as any)?.cadastros && (user as any).cadastros.length > 0) ? null : <p className="text-sm text-muted-foreground">Nenhuma empresa cadastrada ainda.</p>}
            </div>
          </div>
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
              <div className="border-t pt-6 space-y-6">
                <h3 className="text-xl font-bold">Finalizar Cadastro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-2">
                    <Label htmlFor="plano">Selecione seu Plano</Label>
                    <div className="flex gap-4 flex-wrap pt-2">
                      {isLoadingPlans && <p className="text-sm text-muted-foreground">Carregando planos...</p>}
                      {!isLoadingPlans && plans.length === 0 && <p className="text-sm text-muted-foreground">Nenhum plano disponível no momento.</p>}
                      {!isLoadingPlans && plans.map((p: any) => {
                        const isSelected = String(selectedPlan) === String(p.id_plano);
                        return (
                          <div
                            key={p.id_plano}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedPlan(String(p.id_plano))}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedPlan(String(p.id_plano)); }}
                            className={`relative border-2 rounded-lg cursor-pointer transition-all p-4 w-56 ${isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-gray-300'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{p.nome}</p>
                                <p className="text-sm text-muted-foreground">{p.descricao || ''}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">{Number(p.preco_mensal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                <p className="text-xs text-muted-foreground">/mês</p>
                              </div>
                            </div>
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full p-1"><CheckCircle className="h-4 w-4" /></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(checked) => setTermsAccepted(checked as boolean)} />
                    <Label htmlFor="terms" className="text-sm font-medium leading-none">Li e aceito os <a href="/termos" target="_blank" className="text-primary underline">Termos de Uso e Serviços</a></Label>
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button size="lg" onClick={handleSubmitCadastro} disabled={!selectedPlan || !termsAccepted || isLoadingPlans}>
                    Contratar e Cadastrar Empresa
                  </Button>
                </div>
                <div className="pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Logs de Debug (visíveis no navegador)</p>
                    <Button variant="outline" size="sm" onClick={() => setShowDebugLogs(v => !v)}>{showDebugLogs ? 'Ocultar Logs' : 'Mostrar Logs'}</Button>
                  </div>
                  {showDebugLogs && (
                    <div className="mt-3 bg-slate-50 border rounded p-3 text-xs overflow-auto max-h-64">
                      <div className="mb-2"><strong>cadastros_clientes.insert:</strong></div>
                      <pre className="whitespace-pre-wrap">{lastInsertResp ? JSON.stringify(lastInsertResp, null, 2) : 'Nenhum insert executado ainda.'}</pre>
                      <div className="mt-3 mb-2"><strong>contratos.insert:</strong></div>
                      <pre className="whitespace-pre-wrap">{lastContratoResp ? JSON.stringify(lastContratoResp, null, 2) : 'Nenhum insert executado ainda.'}</pre>
                    </div>
                  )}
                </div>
              </div>
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
    const total = clienteData.documentosStatus.length;
    const aprovados = clienteData.documentosStatus.filter(d => d.status_geral === 'aprovado').length;
    const pendentes = clienteData.documentosStatus.filter(d => d.status_geral === 'pendente_analise').length;
    const rejeitados = clienteData.documentosStatus.filter(d => d.status_geral === 'rejeitado').length;
    const naoEnviados = clienteData.documentosStatus.filter(d => d.status_geral === 'nao_enviado').length;
    
    return { total, aprovados, pendentes, rejeitados, naoEnviados };
  };

  // Documents UI moved to DocumentosTab component

  const handleSaveCertificate = async () => {
    if (!user?.id_cadastro) return alert('ID do cadastro não encontrado');
    if (!certFile) return alert('Selecione o arquivo do certificado (.pfx / .p12)');
    if (!certTermsAccepted) return alert('Você precisa aceitar os Termos de Uso e Serviços para enviar o certificado.');

    setCertUploading(true);
    try {
      const filePath = `certificados/${user.id_cadastro}/${Date.now()}_${certFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('certificados')
        .upload(filePath, certFile, { upsert: true });
      if (uploadError) {
        console.error('Erro ao enviar certificado:', uploadError);
        alert('Erro ao enviar o certificado. Verifique permissões do bucket `certificados`.');
        return;
      }

      // Tenta inserir um registro na tabela 'certificados'. Se não existir, o Supabase irá retornar erro.
      const payload: any = {
        id_cadastro: user.id_cadastro,
        file_path: filePath,
        senha: certPassword || null,
        uploaded_at: new Date().toISOString()
      };

      const { data: inserted, error: insertError } = await supabase
        .from('certificados')
        .insert([payload])
        .select()
        .single();

      if (insertError) {
        console.error('Erro ao salvar registro do certificado:', insertError);
        alert('Certificado enviado, mas não foi possível salvar o registro no banco. Verifique a tabela `certificados`.');
        setSavedCertPath(filePath);
        return;
      }

      setSavedCertPath(filePath);
      alert('Certificado salvo com sucesso.');
    } catch (err) {
      console.error('Erro ao salvar certificado:', err);
      alert('Erro ao salvar o certificado.');
    } finally {
      setCertUploading(false);
    }
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
              description={docStats.naoEnviados > 0 
                ? `${docStats.naoEnviados} não enviado(s)` 
                : docStats.pendentes > 0 
                  ? `${docStats.pendentes} pendente(s)` 
                  : docStats.rejeitados > 0 
                    ? `${docStats.rejeitados} rejeitado(s)` 
                    : 'Todos aprovados'}
              variant={docStats.naoEnviados > 0 || docStats.pendentes > 0 || docStats.rejeitados > 0 ? 'warning' : 'success'} 
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
      {activeTab === 'cadastro' && (
        <CadastroTab
          user={user}
          clienteData={clienteData}
          companyData={companyData}
          cnpj={cnpj}
          handleCnpjChange={handleCnpjChange}
          handleCnpjLookup={handleCnpjLookup}
          isLoadingCnpj={isLoadingCnpj}
          cnpjError={cnpjError}
          handleOpenCompany={handleOpenCompany}
          plans={plans}
          isLoadingPlans={isLoadingPlans}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          termsAccepted={termsAccepted}
          setTermsAccepted={setTermsAccepted}
          setShowDebugLogs={setShowDebugLogs}
          showDebugLogs={showDebugLogs}
          lastInsertResp={lastInsertResp}
          lastContratoResp={lastContratoResp}
          handleSubmitCadastro={handleSubmitCadastro}
        />
      )}
      {activeTab === 'servicos' && <ServicosTab user={user} clienteData={clienteData} refetch={refetch} />}
      {activeTab === 'documentos' && (
  <DocumentosTab clienteData={clienteData} onUploaded={() => refetch()} />
      )}
      {activeTab === 'emissao_nf' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Emissão de NF de Serviço</h2>

          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label>CNPJ ou CPF do Tomador</Label>
                  <Input placeholder="CNPJ ou CPF do tomador" value={tomadorCpfCnpj} onChange={(e) => setTomadorCpfCnpj(e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">CPF ou CNPJ do cliente que recebeu o serviço.</p>
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea value={nfDescription} onChange={(e) => setNfDescription(e.target.value)} placeholder="Descrição do serviço prestado" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Local da prestação</Label>
                    <Select onValueChange={(v) => setLocalPrestacao(v as 'Brasil' | 'Exterior')} value={localPrestacao}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Brasil">Brasil</SelectItem>
                        <SelectItem value="Exterior">Exterior</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Data de competência</Label>
                    <Input type="date" value={dataCompetencia} onChange={(e) => setDataCompetencia(e.target.value)} />
                    <p className="text-xs text-muted-foreground mt-1">Data em que o serviço foi prestado ou concluído.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div>
                    <Label>Valor (R$)</Label>
                    <Input type="number" value={nfAmount ?? ''} onChange={(e) => setNfAmount(Number(e.target.value))} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <Button variant="outline" onClick={() => { setNfAmount(null); setNfDescription(''); }}>Limpar</Button>
                <Button onClick={async () => {
                  if (!user?.id_cadastro) return alert('ID do cadastro não encontrado');
                  if (!nfAmount || nfAmount <= 0) return alert('Informe um valor válido');

                  setIsIssuingNF(true);
                  try {
                    // If a certificate file was provided, upload it to storage
                    let certificatePath: string | null = null;
                    if (certFile) {
                      try {
                        const filePath = `certificados/${user.id_cadastro}/${Date.now()}_${certFile.name}`;
                        const { error: uploadError } = await supabase.storage
                          .from('certificados')
                          .upload(filePath, certFile, { upsert: true });
                        if (uploadError) {
                          console.error('Erro ao enviar certificado:', uploadError);
                          alert('Erro ao enviar o certificado. Verifique permissões do bucket `certificados`.');
                          return;
                        }
                        certificatePath = filePath;
                      } catch (err) {
                        console.error('Erro durante upload do certificado:', err);
                        alert('Erro ao enviar o certificado.');
                        return;
                      }
                    }

                      // Validate required NF fields
                    if (!tomadorCpfCnpj) {
                      alert('Informe o CNPJ/CPF do tomador do serviço.');
                      return;
                    }
                    if (!dataCompetencia) {
                      alert('Informe a data de competência.');
                      return;
                    }

                      const payload: any = {
                        id_cadastro: user.id_cadastro,
                        descricao: nfDescription,
                        valor: nfAmount,
                        data_emissao: new Date().toISOString(),
                        tomador_cpf_cnpj: tomadorCpfCnpj,
                        prestador_cnpj: clienteData.cadastro?.cnpj || null,
                        local_prestacao: localPrestacao,
                        data_competencia: dataCompetencia,
                        certificate_path: certificatePath,
                        certificate_uploaded: certificatePath ? true : false
                      };

                    const { data: inserted, error: insertError } = await supabase
                      .from('notas_servico')
                      .insert([payload])
                      .select()
                      .single();

                    if (insertError) {
                      console.error('Erro ao emitir NF:', insertError);
                      alert('Erro ao emitir NF. Verifique se a tabela `notas_servico` existe e as permissões.');
                      return;
                    }

                    alert('NF emitida com sucesso (registro criado).');
                    // opcional: refetch contratos/dados do cliente
                    await refetch();
                    setNfAmount(null);
                    setNfDescription('');
                    setCertFile(null);
                    setCertPassword('');
                  } finally {
                    setIsIssuingNF(false);
                  }
                }}>{isIssuingNF ? 'Emitindo...' : 'Emitir NF'}</Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Certificado Digital</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label>Certificado Digital (.pfx / .p12)</Label>
                  <Input type="file" accept=".pfx,.p12" onChange={(e) => setCertFile(e.target.files?.[0] ?? null)} />
                  <p className="text-xs text-muted-foreground mt-1">Enviar o arquivo do certificado. O arquivo será armazenado no bucket `certificados`.</p>
                  {savedCertPath && <p className="text-sm text-green-600 mt-2">Arquivo salvo: <span className="font-medium">{savedCertPath.split('/').pop()}</span></p>}
                </div>

                <div>
                  <Label>Senha do Certificado</Label>
                  <Input type="password" value={certPassword} onChange={(e) => setCertPassword(e.target.value)} placeholder="Senha do certificado" />
                  <p className="text-xs text-muted-foreground mt-1">A senha será enviada e salva juntamente com o certificado (verifique políticas de segurança).</p>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox id="cert-terms" checked={certTermsAccepted} onCheckedChange={(v) => setCertTermsAccepted(Boolean(v))} />
                  <Label htmlFor="cert-terms" className="text-sm">Li e aceito os <a href="/termos" target="_blank" className="text-primary underline">Termos de Uso e Serviços</a></Label>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => { setCertFile(null); setCertPassword(''); setSavedCertPath(null); setCertTermsAccepted(false); }}>Limpar</Button>
                  <Button onClick={handleSaveCertificate} disabled={certUploading}>{certUploading ? 'Enviando...' : 'Enviar Certificado'}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
                <div className="space-y-2">
                  <Label>Logo da Empresa</Label>
                  <p className="text-sm text-muted-foreground">Upload de logo descartado nesta sessão.</p>
                </div>
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
