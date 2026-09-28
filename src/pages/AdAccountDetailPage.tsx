import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ExternalLink,
  Plus,
  Copy,
  Check,
  Clock,
  Megaphone,
  Sparkles,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useSettings } from '@/contexts/SettingsContext';
import { useAdAccount, useAdAccounts } from '@/hooks/useAdAccounts';
import { useCampaigns } from '@/hooks/useCampaigns';
import { AdAccountStatusBadge } from '@/components/ad-accounts/AdAccountStatusBadge';
import { AdAccountFormDialog } from '@/components/ad-accounts/AdAccountFormDialog';
import type { AdAccountStatus, AdAccountFormData } from '@/types/adAccounts';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';

export const AdAccountDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { organizationId } = useSettings();

  const { account, isLoading, isError, invalidate } = useAdAccount(organizationId, id ?? null);
  const { updateAccount, updateStatus, deleteAccount } = useAdAccounts(organizationId);

  // Buscar campanhas vinculadas a esta conta
  const {
    campaigns,
    isLoading: loadingCampaigns,
  } = useCampaigns(organizationId ?? '', id ?? null);

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copiado para a área de transferência!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleFormSubmit = async (data: AdAccountFormData) => {
    if (!account) return;
    await updateAccount(account.id, data);
    invalidate();
  };

  const handleStatusChange = async (newStatus: AdAccountStatus) => {
    if (!account) return;
    try {
      await updateStatus(account.id, newStatus);
      toast.success('Status da conta atualizado com sucesso!');
      invalidate();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alterar status';
      toast.error(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!account) return;
    setIsDeleting(true);
    try {
      await deleteAccount(account.id);
      toast.success('Conta de anúncios excluída com sucesso.');
      navigate('/contas-anuncios');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir conta';
      toast.error(msg);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatBRL = (val: number | null | undefined) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: account?.currency || 'BRL',
    }).format(val);
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 bg-card rounded w-32" />
        <div className="h-28 bg-card rounded-xl border border-border" />
        <div className="h-64 bg-card rounded-xl border border-border" />
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-4">
        <p className="text-sm text-rose-400">Conta de anúncios não encontrada.</p>
        <Button variant="outline" onClick={() => navigate('/contas-anuncios')} className="text-xs">
          Voltar para Contas de Anúncios
        </Button>
      </div>
    );
  }

  const pixelId = account.platform_config?.pixel_id as string | undefined;
  const catalogId = account.platform_config?.catalog_id as string | undefined;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-foreground">
      {/* Breadcrumb da Hierarquia */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <Link to="/contas-anuncios" className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Contas de Anúncios</span>
        </Link>
        <span>/</span>
        <span className="truncate max-w-[200px]" title={account.business_center_id || 'Business Center'}>
          BC: {account.business_center_id || 'Principal'}
        </span>
        <span>/</span>
        <span className="text-foreground font-semibold truncate max-w-[240px]">{account.name}</span>
      </div>

      {/* Main Header Card */}
      <div className="rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-14 h-14 rounded-2xl bg-background border border-border flex items-center justify-center p-2.5 shadow-inner flex-shrink-0">
            <img src={tiktokImg} alt="TikTok Ads" className="w-full h-full object-contain" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-white tracking-tight truncate">
                {account.name}
              </h1>
              <AdAccountStatusBadge status={account.status} />
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1.5 flex-wrap">
              <span className="font-mono bg-background/80 px-2 py-0.5 rounded border border-border/80">
                ID: {account.platform_account_id || 'Não configurado'}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {account.timezone}
              </span>
              <span>Moeda: <strong className="text-foreground">{account.currency}</strong></span>
              <span>País: <strong className="text-foreground">{account.country}</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          {account.status !== 'active' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('active')}
              className="h-9 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Ativar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('paused')}
              className="h-9 text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1.5"
            >
              <PauseCircle className="w-3.5 h-3.5" />
              Pausar
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setFormDialogOpen(true)}
            className="h-9 text-xs border-border gap-1.5 hover:border-orange-500/50"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="h-9 text-xs border-border text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-card/70 border border-border p-1 rounded-xl">
          <TabsTrigger value="overview" className="text-xs px-4">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="text-xs px-4 flex items-center gap-1.5">
            Campanhas
            <span className="bg-background text-muted-foreground text-[10px] px-1.5 py-0.2 rounded-full border border-border">
              {account.campaign_count}
            </span>
          </TabsTrigger>
          <TabsTrigger value="tiktok_ids" className="text-xs px-4">
            IDs TikTok Ads
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-xs px-4">
            Faturamento & Empresa
          </TabsTrigger>
        </TabsList>

        {/* ── ABA 1: Visão Geral ── */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-card/60 border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Investimento Total Derivado
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-foreground">
                  {formatBRL(account.total_spend)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Somatório das campanhas ativas e encerradas vinculadas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/60 border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Limite de Orçamento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-foreground">
                  {account.spending_limit ? formatBRL(account.spending_limit) : 'Sem limite'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Teto de gastos configurado para esta conta
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/60 border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Saldo na Plataforma
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-2xl font-bold text-muted-foreground/80">—</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Disponível mediante integração com a API do TikTok
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Card Detalhado de Resumo Operacional */}
          <Card className="bg-card/60 border-border">
            <CardHeader className="p-5 pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold text-foreground">
                Informações Operacionais da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Plataforma:</span>
                <span className="font-medium text-foreground capitalize">{account.platform} Ads</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Tipo de Cobrança:</span>
                <span className="font-medium text-foreground">
                  {account.billing_type === 'prepaid' ? 'Pré-pago (Recarga)' : 'Pós-pago (Faturado)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Status do Pagamento:</span>
                <span className="font-medium text-foreground capitalize">
                  {account.payment_status === 'normal'
                    ? 'Normal / Em dia'
                    : account.payment_status === 'overdue'
                    ? 'Pendente'
                    : 'Restrito'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Data de Cadastro:</span>
                <span className="font-medium text-foreground">
                  {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
                    new Date(account.created_at)
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Última Sincronização:</span>
                <span className="font-medium text-foreground">
                  {account.last_synced_at
                    ? new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(account.last_synced_at))
                    : '— (Não sincronizado)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Campanhas Ativas:</span>
                <span className="font-medium text-foreground">
                  {campaigns.filter((c) => c.status === 'active').length} de {campaigns.length}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA 2: Campanhas Vinculadas ── */}
        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Campanhas desta Conta
              </h3>
              <p className="text-xs text-muted-foreground">
                Campanhas associadas exclusivamente a esta conta de anúncios
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/campanhas?conta=${account.id}`)}
                className="text-xs h-9 gap-1.5 border-border"
              >
                <span>Ver no Painel de Campanhas</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>

              <Button
                size="sm"
                onClick={() => navigate(`/campanhas?conta=${account.id}&nova=true`)}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-9 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Campanha
              </Button>
            </div>
          </div>

          {loadingCampaigns && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Carregando campanhas...
            </div>
          )}

          {!loadingCampaigns && campaigns.length === 0 && (
            <div className="text-center py-12 rounded-xl border border-dashed border-border bg-card/20 space-y-3">
              <Megaphone className="w-8 h-8 mx-auto text-muted-foreground/60" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Nenhuma campanha vinculada a esta conta
                </p>
                <p className="text-xs text-muted-foreground">
                  Crie uma nova campanha ou associe campanhas existentes a esta conta.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => navigate(`/campanhas?conta=${account.id}&nova=true`)}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs h-8 gap-1.5 mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar Campanha
              </Button>
            </div>
          )}

          {!loadingCampaigns && campaigns.length > 0 && (
            <div className="divide-y divide-border rounded-xl border border-border bg-card/60 overflow-hidden">
              {campaigns.map((c) => {
                const totalCusto = (c.campaign_products ?? []).reduce(
                  (sum, p) => sum + (p.marketing_cost_override != null ? Number(p.marketing_cost_override) : 0),
                  0
                );
                return (
                  <div
                    key={c.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-background/40 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {c.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            c.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : c.status === 'paused'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                          }`}
                        >
                          {c.status === 'active'
                            ? 'Ativo'
                            : c.status === 'paused'
                            ? 'Pausado'
                            : 'Encerrado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>Objetivo: <strong className="text-foreground capitalize">{c.objective}</strong></span>
                        <span>·</span>
                        <span>
                          Orçamento: {c.budget_amount ? formatBRL(c.budget_amount) : '—'} (
                          {c.budget_type === 'daily' ? 'Diário' : 'Vitalício'})
                        </span>
                        {totalCusto > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-orange-400">
                              Custo de Mkt: {formatBRL(totalCusto)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/campanhas?conta=${account.id}`)}
                      className="text-xs h-8 gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <span>Ver no painel</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── ABA 3: IDs TikTok Ads ── */}
        <TabsContent value="tiktok_ids" className="space-y-4">
          <Card className="bg-card/60 border-border">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Identificadores no Ecossistema TikTok
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-xs">
              {/* Advertiser ID */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    Advertiser ID (ID do Anunciante)
                  </p>
                  <p className="text-sm font-mono text-foreground mt-0.5">
                    {account.platform_account_id || 'Não configurado'}
                  </p>
                </div>
                {account.platform_account_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(account.platform_account_id!, 'advertiser_id')}
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copiedKey === 'advertiser_id' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copiar</span>
                  </Button>
                )}
              </div>

              {/* Business Center ID */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">
                    ID do TikTok Business Center
                  </p>
                  <p className="text-sm font-mono text-foreground mt-0.5">
                    {account.business_center_id || 'Não configurado'}
                  </p>
                </div>
                {account.business_center_id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(account.business_center_id!, 'bc_id')}
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copiedKey === 'bc_id' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copiar</span>
                  </Button>
                )}
              </div>

              {/* Pixel ID */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Pixel TikTok</p>
                  <p className="text-sm font-mono text-foreground mt-0.5">
                    {pixelId || 'Não configurado'}
                  </p>
                </div>
                {pixelId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(pixelId, 'pixel_id')}
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copiedKey === 'pixel_id' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copiar</span>
                  </Button>
                )}
              </div>

              {/* Catalog ID */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Catálogo de Produtos</p>
                  <p className="text-sm font-mono text-foreground mt-0.5">
                    {catalogId || 'Não configurado'}
                  </p>
                </div>
                {catalogId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(catalogId, 'catalog_id')}
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {copiedKey === 'catalog_id' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>Copiar</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA 4: Faturamento & Empresa ── */}
        <TabsContent value="billing" className="space-y-4">
          <Card className="bg-card/60 border-border">
            <CardHeader className="p-5 pb-3 border-b border-border/60">
              <CardTitle className="text-sm font-semibold text-foreground">
                Dados Cadastrais e Faturamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Razão Social / Nome Legal:</span>
                <span className="font-medium text-foreground">
                  {account.legal_name || 'Não informado'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">CNPJ / CPF:</span>
                <span className="font-mono text-foreground font-medium">
                  {account.tax_id || 'Não informado'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Setor de Atuação:</span>
                <span className="font-medium text-foreground">
                  {account.industry || 'Não informado'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">E-mail de Contato:</span>
                <span className="font-medium text-foreground">
                  {account.email || 'Não informado'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Telefone / WhatsApp:</span>
                <span className="font-medium text-foreground">
                  {account.phone || 'Não informado'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border/40">
                <span className="text-muted-foreground">Modalidade de Faturamento:</span>
                <span className="font-medium text-foreground">
                  {account.billing_type === 'prepaid' ? 'Pré-pago' : 'Pós-pago'}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Modal (Edit) */}
      <AdAccountFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        account={account}
        onSubmit={handleFormSubmit}
      />

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir conta de anúncios?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed">
              Você está prestes a excluir a conta{' '}
              <strong className="text-foreground">{account.name}</strong>. Esta ação não poderá ser
              desfeita.
              {account.campaign_count > 0 && (
                <span className="block mt-2 text-rose-400 font-medium">
                  Atenção: Esta conta possui {account.campaign_count} campanha(s) vinculada(s). A exclusão
                  será bloqueada pelo banco de dados até que todas as campanhas sejam realocadas ou excluídas.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="border-border text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-rose-500 hover:bg-rose-600 text-white text-xs"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdAccountDetailPage;
