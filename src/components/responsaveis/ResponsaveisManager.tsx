import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Users,
  Megaphone,
  Plus,
  Search,
  Trash2,
  Pencil,
  Phone,
  Mail,
  Instagram,
  MoreVertical,
  UserCheck,
  Percent,
  Sparkles,
  CreditCard,
  Landmark,
  Wallet,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useTestadores, useTitulares, useInfluenciadores } from '@/hooks/useResponsaveis';
import { ResponsavelFormDialog } from './ResponsavelFormDialog';
import { TitularSubscriptionsModal } from './TitularSubscriptionsModal';
import type {
  Testador,
  Titular,
  Influenciador,
  ResponsavelTab,
  TestadorFormData,
  TitularFormData,
  InfluenciadorFormData,
} from '@/types/responsaveis';

// ── Tab config ───────────────────────────────────────────────────────────────

const TABS: { id: ResponsavelTab; label: string; singularLabel: string; icon: React.ElementType; color: string; activeClass: string }[] = [
  {
    id: 'titulares',
    label: 'Titulares',
    singularLabel: 'Titular',
    icon: Users,
    color: 'text-violet-400',
    activeClass: 'bg-violet-500/15 text-violet-400 border-violet-500/40',
  },
  {
    id: 'influenciadores',
    label: 'Influenciadores',
    singularLabel: 'Influenciador',
    icon: Megaphone,
    color: 'text-pink-400',
    activeClass: 'bg-pink-500/15 text-pink-400 border-pink-500/40',
  },
  {
    id: 'testadores',
    label: 'Testadores',
    singularLabel: 'Testador',
    icon: User,
    color: 'text-sky-400',
    activeClass: 'bg-sky-500/15 text-sky-400 border-sky-500/40',
  },
];

// ── Testador Card ────────────────────────────────────────────────────────────

function TestadorCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Testador;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 hover:border-sky-500/40 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
            <User className="w-4.5 h-4.5 text-sky-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[hsl(var(--foreground))] truncate">{item.full_name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {item.document_number && (
                <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono">
                  {item.document_type?.toUpperCase()}: {item.document_number}
                </span>
              )}
              <Badge
                variant="outline"
                className={item.is_active
                  ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 text-xs py-0'
                  : 'text-red-400 border-red-500/40 bg-red-500/10 text-xs py-0'}
              >
                {item.is_active ? (
                  <><UserCheck className="w-3 h-3 mr-1" />Ativo</>
                ) : (
                  'Inativo'
                )}
              </Badge>
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:text-red-400">
              <Trash2 className="w-4 h-4 mr-2" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {(item.phone || item.email) && (
        <div className="mt-3 flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
          {item.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />{item.phone}
            </span>
          )}
          {item.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3 h-3" />{item.email}
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Titular Card ─────────────────────────────────────────────────────────────

function TitularCard({
  item,
  onEdit,
  onDelete,
  onManageSubscriptions,
}: {
  item: Titular;
  onEdit: () => void;
  onDelete: () => void;
  onManageSubscriptions: () => void;
}) {
  const activeSubs = (item.subscriptions || []).filter((s) => s.is_active);
  const totalBrl = activeSubs
    .filter((s) => s.currency === 'BRL')
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);
  const totalUsd = activeSubs
    .filter((s) => s.currency === 'USD')
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);

  const paymentLabel = {
    pix: 'PIX',
    pix_credito: 'PIX Crédito',
    cartao_credito: 'Cartão de Crédito',
  }[item.preferred_payment_method || 'pix'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 hover:border-violet-500/40 transition-all duration-200 flex flex-col justify-between"
    >
      <div className="space-y-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <Users className="w-4.5 h-4.5 text-violet-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-sm text-[hsl(var(--foreground))] truncate">{item.full_name}</p>
                {/* Badge CPF / CNPJ */}
                <Badge
                  variant="outline"
                  className={
                    item.account_type === 'cnpj'
                      ? 'text-amber-400 border-amber-500/40 bg-amber-500/10 text-[10px] py-0 font-bold'
                      : 'text-violet-400 border-violet-500/40 bg-violet-500/10 text-[10px] py-0 font-bold'
                  }
                >
                  {item.account_type === 'cnpj' ? 'CNPJ' : 'CPF'}
                </Badge>
                {/* Badge Influenciador */}
                {(item.is_influencer || item.influencer_id) && (
                  <Badge
                    variant="outline"
                    className="text-pink-400 border-pink-500/40 bg-pink-500/10 text-[10px] py-0 font-semibold gap-0.5"
                  >
                    <Star className="w-2.5 h-2.5 fill-pink-400" /> Influenciador
                  </Badge>
                )}
              </div>

              {item.document_number && (
                <span className="text-xs text-[hsl(var(--muted-foreground))] font-mono block mt-0.5">
                  {item.document_number}
                </span>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onManageSubscriptions}>
                <Sparkles className="w-4 h-4 mr-2 text-violet-400" />Gerenciar Assinaturas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:text-red-400">
                <Trash2 className="w-4 h-4 mr-2" />Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Marketplaces Associados */}
        {item.marketplaces && item.marketplaces.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            {item.marketplaces.map((mp) => (
              <span
                key={mp}
                className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60 text-zinc-300"
              >
                {mp}
              </span>
            ))}
          </div>
        )}

        {/* Informações Bancárias & Financeiras */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[hsl(var(--border))/40]">
          {item.bank && (
            <div className="flex items-center gap-1.5 text-zinc-300 truncate">
              <Landmark className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{item.bank}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-zinc-300 truncate">
            <Wallet className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">{paymentLabel}</span>
          </div>

          {Number(item.marketing_capital) > 0 && (
            <div className="text-[11px] text-zinc-400 col-span-2">
              Capital Marketing:{' '}
              <strong className="text-emerald-400 font-medium">
                R$ {Number(item.marketing_capital).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </strong>
            </div>
          )}

          {item.credit_cards && item.credit_cards.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-zinc-400 col-span-2">
              <CreditCard className="w-3 h-3 text-violet-400" />
              <span>
                {item.credit_cards.length} cartão{item.credit_cards.length !== 1 ? 'ões' : ''} vinculado{item.credit_cards.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {(item.phone || item.email) && (
          <div className="flex items-center gap-3 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
            {item.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />{item.phone}
              </span>
            )}
            {item.email && (
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" />{item.email}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Botão de Assinaturas (Bottom Action Bar) */}
      <div className="mt-3 pt-2.5 border-t border-[hsl(var(--border))] flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onManageSubscriptions}
          className="w-full text-xs h-8 border-violet-500/30 text-violet-300 hover:text-white hover:bg-violet-600/20 hover:border-violet-500/60 justify-between group/btn transition-all"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 group-hover/btn:rotate-12 transition-transform" />
            Assinaturas ({activeSubs.length})
          </span>

          <span className="text-[11px] font-semibold text-zinc-400 group-hover/btn:text-violet-200">
            {totalBrl > 0 && `R$ ${totalBrl.toFixed(2)}`}
            {totalBrl > 0 && totalUsd > 0 && ' + '}
            {totalUsd > 0 && `$ ${totalUsd.toFixed(2)}`}
            {totalBrl === 0 && totalUsd === 0 && 'Configurar'}
          </span>
        </Button>
      </div>
    </motion.div>
  );
}

// ── Influenciador Card ───────────────────────────────────────────────────────

function InfluenciadorCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Influenciador;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl p-4 hover:border-pink-500/40 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-pink-500/15 border border-pink-500/30 flex items-center justify-center flex-shrink-0">
            <Megaphone className="w-4.5 h-4.5 text-pink-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[hsl(var(--foreground))] truncate">{item.name}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge
                variant="outline"
                className={item.is_active
                  ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 text-xs py-0'
                  : 'text-slate-400 border-slate-500/40 bg-slate-500/10 text-xs py-0'}
              >
                {item.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
              {item.percentage > 0 && (
                <Badge variant="outline" className="text-amber-400 border-amber-500/40 bg-amber-500/10 text-xs py-0">
                  <Percent className="w-2.5 h-2.5 mr-0.5" />{item.percentage}%
                </Badge>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-2" />Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-400 focus:text-red-400">
              <Trash2 className="w-4 h-4 mr-2" />Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Social handles */}
      <div className="mt-3 flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))] flex-wrap">
        {item.instagram && (
          <span className="flex items-center gap-1">
            <Instagram className="w-3 h-3 text-pink-400" />{item.instagram}
          </span>
        )}
        {item.tiktok && (
          <span className="flex items-center gap-1">
            <span className="text-xs font-bold text-sky-400">TT:</span>{item.tiktok}
          </span>
        )}
        {item.twitter && (
          <span className="flex items-center gap-1">
            <span className="text-xs font-bold text-slate-400">X:</span>{item.twitter}
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Manager ─────────────────────────────────────────────────────────────

export function ResponsaveisManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const validTab: ResponsavelTab | null =
    rawTab === 'titulares' || rawTab === 'influenciadores' || rawTab === 'testadores'
      ? rawTab
      : null;

  const [activeTab, setActiveTab] = useState<ResponsavelTab>(validTab || 'titulares');

  useEffect(() => {
    if (validTab && validTab !== activeTab) {
      setActiveTab(validTab);
    }
  }, [validTab, activeTab]);

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Testador | Titular | Influenciador | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  // Subscriptions Modal state for Titular
  const [subscriptionTitular, setSubscriptionTitular] = useState<Titular | null>(null);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);

  const testadores = useTestadores();
  const titulares = useTitulares();
  const influenciadores = useInfluenciadores();

  const currentHook = activeTab === 'testadores'
    ? testadores
    : activeTab === 'titulares'
    ? titulares
    : influenciadores;

  const items = useMemo(() => {
    const q = search.toLowerCase();
    if (activeTab === 'testadores') {
      return testadores.testadores.filter(t => t.full_name.toLowerCase().includes(q));
    }
    if (activeTab === 'titulares') {
      return titulares.titulares.filter(t => t.full_name.toLowerCase().includes(q));
    }
    return influenciadores.influenciadores.filter(i => i.name.toLowerCase().includes(q));
  }, [activeTab, search, testadores.testadores, titulares.titulares, influenciadores.influenciadores]);

  const handleNew = () => {
    setEditItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: Testador | Titular | Influenciador) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (activeTab === 'testadores') {
      await testadores.deleteTestador(deleteTarget.id);
    } else if (activeTab === 'titulares') {
      await titulares.deleteTitular(deleteTarget.id);
    } else {
      await influenciadores.deleteInfluenciador(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  const handleSaveTestador = async (data: TestadorFormData, id?: string) => {
    if (id) await testadores.updateTestador({ id, data });
    else await testadores.createTestador(data);
  };

  const handleSaveTitular = async (data: TitularFormData, id?: string) => {
    if (id) await titulares.updateTitular({ id, data });
    else await titulares.createTitular(data);
  };

  const handleSaveInfluenciador = async (data: InfluenciadorFormData, id?: string) => {
    if (id) await influenciadores.updateInfluenciador({ id, data });
    else await influenciadores.createInfluenciador(data);
  };

  const activeTabConfig = TABS.find(t => t.id === activeTab)!;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Responsáveis</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
            Gerencie testadores, titulares, assinaturas e influenciadores da operação
          </p>
        </div>

        <Button
          onClick={handleNew}
          className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.9)] text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo {activeTabConfig.singularLabel}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const count = activeTab === 'testadores' && tab.id === 'testadores'
            ? testadores.testadores.length
            : activeTab === 'titulares' && tab.id === 'titulares'
            ? titulares.titulares.length
            : tab.id === 'influenciadores'
            ? influenciadores.influenciadores.length
            : tab.id === 'testadores'
            ? testadores.testadores.length
            : tab.id === 'titulares'
            ? titulares.titulares.length
            : influenciadores.influenciadores.length;

          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearch('');
                setSearchParams({ tab: tab.id });
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                isActive
                  ? tab.activeClass
                  : 'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground)/0.2)] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? '' : 'opacity-60'}`} />
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                isActive
                  ? 'bg-current/15'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
        <Input
          placeholder={`Buscar ${activeTabConfig.label.toLowerCase()}...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 bg-[hsl(var(--card))] border-[hsl(var(--border))]"
        />
      </div>

      {/* List */}
      {currentHook.isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-[hsl(var(--muted))] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-[hsl(var(--muted-foreground))]">
          <activeTabConfig.icon className={`w-12 h-12 mx-auto mb-4 opacity-30 ${activeTabConfig.color}`} />
          <p className="text-lg font-medium">
            {search ? `Nenhum resultado para "${search}"` : `Nenhum ${activeTabConfig.singularLabel.toLowerCase()} cadastrado`}
          </p>
          {!search && (
            <p className="text-sm mt-1 opacity-70">
              Clique em "Novo {activeTabConfig.singularLabel}" para começar
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {activeTab === 'testadores' &&
              (items as Testador[]).map(item => (
                <TestadorCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => setDeleteTarget({ id: item.id, name: item.full_name })}
                />
              ))}
            {activeTab === 'titulares' &&
              (items as Titular[]).map(item => (
                <TitularCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => setDeleteTarget({ id: item.id, name: item.full_name })}
                  onManageSubscriptions={() => {
                    setSubscriptionTitular(item);
                    setSubscriptionModalOpen(true);
                  }}
                />
              ))}
            {activeTab === 'influenciadores' &&
              (items as Influenciador[]).map(item => (
                <InfluenciadorCard
                  key={item.id}
                  item={item}
                  onEdit={() => handleEdit(item)}
                  onDelete={() => setDeleteTarget({ id: item.id, name: item.name })}
                />
              ))}
          </AnimatePresence>
        </div>
      )}

      {/* Form Dialog */}
      <ResponsavelFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        tab={activeTab}
        editItem={editItem}
        onSaveTestador={handleSaveTestador}
        onSaveTitular={handleSaveTitular}
        onSaveInfluenciador={handleSaveInfluenciador}
      />

      {/* Titular Subscriptions Modal */}
      <TitularSubscriptionsModal
        titular={subscriptionTitular}
        open={subscriptionModalOpen}
        onOpenChange={setSubscriptionModalOpen}
      />

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
