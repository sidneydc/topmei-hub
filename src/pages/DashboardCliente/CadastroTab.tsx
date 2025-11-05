import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Building, Landmark, Users, CheckCircle, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export default function CadastroTab(props: any) {
  const {
    clienteData,
    user,
    companyData,
    cnpj,
    handleCnpjChange,
    handleCnpjLookup,
    isLoadingCnpj,
    cnpjError,
    handleOpenCompany,
    plans,
    isLoadingPlans,
    selectedPlan,
    setSelectedPlan,
    termsAccepted,
    setTermsAccepted,
    setShowDebugLogs,
    showDebugLogs,
    lastInsertResp,
    lastContratoResp,
    handleSubmitCadastro,
  } = props;

  // Determine existing cadastro: prefer clienteData.cadastro, fallback to user.cadastros[0] if available
  const existingCadastro = clienteData?.cadastro || (user && ((user as any).cadastros && (user as any).cadastros.length > 0) ? (user as any).cadastros[0] : null);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Cadastro da Empresa</h2>
      <Card>
        <CardContent className="p-6 space-y-6">
          {/* If the logged user already has a cadastro, show its data and hide the consult/open options */}
          {existingCadastro ? (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Empresa cadastrada</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Razão Social</Label>
                  <p className="font-semibold">{existingCadastro.razao_social || existingCadastro.nome_fantasia || existingCadastro.cnpj}</p>
                </div>
                <div>
                  <Label>CNPJ</Label>
                  <p className="font-semibold">{existingCadastro.cnpj || 'N/A'}</p>
                </div>
                <div>
                  <Label>Nome Fantasia</Label>
                  <p className="font-semibold">{existingCadastro.nome_fantasia || 'N/A'}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <p className="font-semibold">{existingCadastro.status_cadastro || 'N/A'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-2 items-center">
                <div className="w-full sm:flex-grow">
                  <Label htmlFor="cnpj" className="sr-only">CNPJ</Label>
                  <Input id="cnpj" placeholder="Digite o CNPJ da sua empresa" value={cnpj} onChange={handleCnpjChange} />
                </div>
                <Button onClick={handleCnpjLookup} disabled={isLoadingCnpj || cnpj.length !== 14} className="w-full sm:w-auto"><Search className="h-4 w-4 mr-2" />Consultar</Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-300" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-2 text-sm text-muted-foreground">OU</span></div>
              </div>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Building />Dados Gerais</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><Label>Razão Social</Label><p className="font-semibold">{companyData.company?.name}</p></div>
                  <div><Label>Nome Fantasia</Label><p className="font-semibold">{companyData.alias}</p></div>
                  <div><Label>Data de Fundação</Label><p className="font-semibold">{new Date(companyData.founded).toLocaleDateString('pt-BR')}</p></div>
                  <div><Label>Status</Label><p className="font-semibold"><Badge variant={companyData.status?.text === 'Ativa' ? 'default' : 'destructive'}>{companyData.status?.text}</Badge></p></div>
                  <div><Label>É Matriz?</Label><p className="font-semibold">{companyData.head ? 'Sim' : 'Não'}</p></div>
                  <div><Label>Porte</Label><p className="font-semibold">{companyData.company?.size?.text}</p></div>
                  <div><Label>Natureza Jurídica</Label><p className="font-semibold">{companyData.company?.nature?.text}</p></div>
                  <div><Label>Capital Social</Label><p className="font-semibold">{companyData.company?.equity?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Landmark />Dados Fiscais</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><Label>Optante Simples</Label><p className="font-semibold">{companyData.company?.simples?.optant ? 'Sim' : 'Não'}</p></div>
                  <div><Label>Data Opção Simples</Label><p className="font-semibold">{companyData.company?.simples?.since || 'N/A'}</p></div>
                  <div><Label>Optante MEI (Simei)</Label><p className="font-semibold">{companyData.company?.simei?.optant ? 'Sim' : 'Não'}</p></div>
                  <div><Label>Data Opção Simei</Label><p className="font-semibold">{companyData.company?.simei?.since || 'N/A'}</p></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users />Quadro Societário</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Quadro societário disponível na API de consulta.</p>
                </CardContent>
              </Card>

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
                    <Button variant="outline" size="sm" onClick={() => setShowDebugLogs((v: boolean) => !v)}>{showDebugLogs ? 'Ocultar Logs' : 'Mostrar Logs'}</Button>
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
}