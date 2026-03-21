import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ReferenceService, type AccountHolder, type Marketplace } from '@/services/referenceService';
import { Button } from '@/components/ui/button';
import { Trash2, Plus, Pencil, Save, X, AtSign } from 'lucide-react';

interface AffiliateLocal {
  id: string;
  name: string;
  tiktok: string | null;
  marketplace_id?: string | null;
}
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useSettings } from '@/contexts/SettingsContext';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { reloadSettings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountHolders, setAccountHolders] = useState<AccountHolder[]>([]);
  const [newHolderName, setNewHolderName] = useState('');
  const [editingHolderId, setEditingHolderId] = useState<string | null>(null);

  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [newMarketplace, setNewMarketplace] = useState({
    name: '',
    commission_rate: 0,
    has_monthly_fee: false,
    monthly_fee_value: 0,
    fixed_fee: 0,
    affiliate_commission_rate: 0
  });
  const [editingMarketplaceId, setEditingMarketplaceId] = useState<string | null>(null);

  // Afiliados
  const [affiliates, setAffiliates] = useState<AffiliateLocal[]>([]);
  const [newAffiliate, setNewAffiliate] = useState({ name: '', tiktok: '', marketplace_id: '' });
  const [editingAffiliateId, setEditingAffiliateId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '', // Maps to full name or org name
    email: '',
    phone: '',
    website: '',
    country: '',
    city: '',
    state: '',
    zip: '',
    address: '',
    working_capital: '',
    emergency_reserve: '',
    capital_marketing: '',
    gross_investment: ''
  });

  useEffect(() => {
    if (open) {
      fetchSettings();
    }
  }, [open]);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Try to find an organization for this user
      const { data: members } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1);

      let orgId;

      if (members && members.length > 0) {
        orgId = members[0].organization_id;
      } else {
        // If no organization, maybe create one or fetch the first one if we are just testing
        // For now, let's try to fetch any organization or create one
         const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
         if (orgs && orgs.length > 0) orgId = orgs[0].id;
      }

      if (orgId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', orgId)
          .single();

        if (org) {
          setFormData({
            id: org.id,
            name: org.name || '',
            email: org.email || user.email || '',
            phone: org.phone || '',
            website: org.website || '',
            country: org.country || '',
            city: org.city || '',
            state: org.state || '',
            zip: org.zip || '',
            address: org.address || '',
            working_capital: org.working_capital?.toString() || '',
            emergency_reserve: org.emergency_reserve?.toString() || '',
            capital_marketing: org.capital_marketing?.toString() || '',
            gross_investment: org.gross_investment?.toString() || ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (formData.id) {
        const { error } = await supabase
          .from('organizations')
          .update({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            website: formData.website,
            country: formData.country,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            address: formData.address,
            working_capital: parseFloat(formData.working_capital) || 0,
            emergency_reserve: parseFloat(formData.emergency_reserve) || 0,
            capital_marketing: parseFloat(formData.capital_marketing) || 0,
            gross_investment: parseFloat(formData.gross_investment) || 0
          })
          .eq('id', formData.id);

        if (error) throw error;
      } else {
         const { data: newOrg, error: createError } = await supabase
          .from('organizations')
          .insert({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            website: formData.website,
            country: formData.country,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            address: formData.address,
            working_capital: parseFloat(formData.working_capital) || 0,
            emergency_reserve: parseFloat(formData.emergency_reserve) || 0,
            capital_marketing: parseFloat(formData.capital_marketing) || 0,
            gross_investment: parseFloat(formData.gross_investment) || 0
          })
          .select()
          .single();

         if (createError) throw createError;

         if (newOrg) {
             const { error: memberError } = await supabase
                .from('organization_members')
                .insert({
                    organization_id: newOrg.id,
                    user_id: user.id
                });
             
             if (memberError) console.error('Error adding member:', memberError);
             
             setFormData(prev => ({ ...prev, id: newOrg.id }));
         }
      }
      
      onOpenChange(false);
      // Refresh context
      await reloadSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setError("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const loadAccountHolders = useCallback(async () => {
    if (!formData.id) return;
    try {
      const data = await ReferenceService.getAccountHolders(formData.id);
      setAccountHolders(data);
    } catch (error) {
      console.error('Error loading account holders:', error);
    }
  }, [formData.id]);

  const loadMarketplaces = useCallback(async () => {
    if (!formData.id) return;
    try {
      const data = await ReferenceService.getMarketplaces(formData.id);
      setMarketplaces(data);
    } catch (error) {
      console.error('Error loading marketplaces:', error);
    }
  }, [formData.id]);

  const loadAffiliates = useCallback(async () => {
    if (!formData.id) return;
    const { data } = await supabase
      .from('affiliates')
      .select('id, name, tiktok, affiliate_marketplaces(marketplace_id)')
      .eq('organization_id', formData.id)
      .order('name');
    const mapped = (data || []).map((a: { id: string; name: string; tiktok: string | null; affiliate_marketplaces: { marketplace_id: string }[] }) => ({
      id: a.id,
      name: a.name,
      tiktok: a.tiktok,
      marketplace_id: a.affiliate_marketplaces?.[0]?.marketplace_id ?? null
    }));
    setAffiliates(mapped);
  }, [formData.id]);

  useEffect(() => {
    if (formData.id) {
      void loadAccountHolders();
      void loadMarketplaces();
      void loadAffiliates();
    }
  }, [formData.id, loadAccountHolders, loadMarketplaces, loadAffiliates]);

  const handleAddAffiliate = async () => {
    if (!newAffiliate.name.trim() || !formData.id) return;
    try {
      let affiliateId = editingAffiliateId;
      if (editingAffiliateId) {
        await supabase.from('affiliates').update({
          name: newAffiliate.name.trim(),
          tiktok: newAffiliate.tiktok.trim() || null,
        }).eq('id', editingAffiliateId);
        setEditingAffiliateId(null);
      } else {
        const { data } = await supabase.from('affiliates').insert({
          organization_id: formData.id,
          name: newAffiliate.name.trim(),
          tiktok: newAffiliate.tiktok.trim() || null,
        }).select('id').single();
        affiliateId = data?.id ?? null;
      }
      if (affiliateId && newAffiliate.marketplace_id) {
        await supabase.from('affiliate_marketplaces').delete().eq('affiliate_id', affiliateId);
        await supabase.from('affiliate_marketplaces').insert({
          affiliate_id: affiliateId,
          marketplace_id: newAffiliate.marketplace_id
        });
      }
      setNewAffiliate({ name: '', tiktok: '', marketplace_id: '' });
      void loadAffiliates();
    } catch (err) {
      console.error('Error saving affiliate:', err);
    }
  };

  const startEditAffiliate = (a: AffiliateLocal) => {
    setNewAffiliate({ name: a.name, tiktok: a.tiktok || '', marketplace_id: a.marketplace_id || '' });
    setEditingAffiliateId(a.id);
  };

  const handleDeleteAffiliate = async (id: string) => {
    await supabase.from('affiliates').delete().eq('id', id);
    void loadAffiliates();
  };

  const handleAddHolder = async () => {
    setError(null);
    if (!newHolderName.trim()) return;

    if (!formData.id) {
      setError("Salve as configurações da empresa primeiro.");
      return;
    }

    try {
      if (editingHolderId) {
        await ReferenceService.updateAccountHolder(editingHolderId, newHolderName.trim());
        setEditingHolderId(null);
      } else {
        await ReferenceService.addAccountHolder(newHolderName.trim(), 'pf', formData.id);
      }
      setNewHolderName('');
      void loadAccountHolders();
      void reloadSettings();
    } catch (error) {
      console.error('Error saving account holder:', error);
      setError("Erro ao salvar titular.");
    }
  };

  const startEditHolder = (holder: AccountHolder) => {
    setNewHolderName(holder.name);
    setEditingHolderId(holder.id);
  };

  const cancelEditHolder = () => {
    setNewHolderName('');
    setEditingHolderId(null);
  };

  const handleAddMarketplace = async () => {
    if (!newMarketplace.name.trim() || !formData.id) return;
    try {
      if (editingMarketplaceId) {
        await ReferenceService.updateMarketplace(editingMarketplaceId, {
          name: newMarketplace.name.trim(),
          commission_rate: newMarketplace.commission_rate,
          has_monthly_fee: newMarketplace.has_monthly_fee,
          monthly_fee_value: newMarketplace.monthly_fee_value,
          fixed_fee: newMarketplace.fixed_fee,
          affiliate_commission_rate: newMarketplace.affiliate_commission_rate
        });
        setEditingMarketplaceId(null);
      } else {
        await ReferenceService.addMarketplace({
          name: newMarketplace.name.trim(),
          commission_rate: newMarketplace.commission_rate,
          has_monthly_fee: newMarketplace.has_monthly_fee,
          monthly_fee_value: newMarketplace.monthly_fee_value,
          fixed_fee: newMarketplace.fixed_fee,
          affiliate_commission_rate: newMarketplace.affiliate_commission_rate,
          organization_id: formData.id
        });
      }
      setNewMarketplace({
        name: '',
        commission_rate: 0,
        has_monthly_fee: false,
        monthly_fee_value: 0,
        fixed_fee: 0,
        affiliate_commission_rate: 0
      });
      void loadMarketplaces();
    } catch (error) {
      console.error('Error saving marketplace:', error);
    }
  };

  const startEditMarketplace = (mp: Marketplace) => {
    setNewMarketplace({
      name: mp.name,
      commission_rate: mp.commission_rate,
      has_monthly_fee: mp.has_monthly_fee,
      monthly_fee_value: mp.monthly_fee_value,
      fixed_fee: mp.fixed_fee || 0,
      affiliate_commission_rate: mp.affiliate_commission_rate || 0
    });
    setEditingMarketplaceId(mp.id);
  };

  const cancelEditMarketplace = () => {
    setNewMarketplace({
      name: '',
      commission_rate: 0,
      has_monthly_fee: false,
      monthly_fee_value: 0,
      fixed_fee: 0,
      affiliate_commission_rate: 0
    });
    setEditingMarketplaceId(null);
  };

  const handleDeleteHolder = async (id: string) => {
    try {
      await ReferenceService.deleteAccountHolder(id);
      void loadAccountHolders();
      void reloadSettings();
    } catch (error) {
      console.error('Error deleting account holder:', error);
    }
  };

  const handleDeleteMarketplace = async (id: string) => {
    try {
      await ReferenceService.deleteMarketplace(id);
      void loadMarketplaces();
    } catch (error) {
      console.error('Error deleting marketplace:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] bg-white dark:bg-zinc-900 dark:text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurações da Empresa</DialogTitle>
          <DialogDescription>
            Atualize as informações da sua empresa e configurações financeiras.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome da Empresa *</Label>
              <Input 
                id="fullName" 
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome da Empresa" 
                required 
                className="bg-gray-50 dark:bg-zinc-800" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input 
                id="email" 
                type="email" 
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@empresa.com" 
                required 
                className="bg-gray-50 dark:bg-zinc-800" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input 
                id="phone" 
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="(00) 00000-0000" 
                className="bg-gray-50 dark:bg-zinc-800" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Site</Label>
              <Input 
                id="website" 
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://..." 
                className="bg-gray-50 dark:bg-zinc-800" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">País *</Label>
              <Select value={formData.country} onValueChange={(val) => handleChange('country', val)}>
                <SelectTrigger className="bg-gray-50 dark:bg-zinc-800">
                  <SelectValue placeholder="Selecione o país" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="br">Brasil</SelectItem>
                  <SelectItem value="us">Estados Unidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade *</Label>
              <Input 
                id="city" 
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Cidade" 
                className="bg-gray-50 dark:bg-zinc-800" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">Estado *</Label>
              <Input 
                id="state" 
                value={formData.state}
                onChange={(e) => handleChange('state', e.target.value)}
                placeholder="Estado" 
                className="bg-gray-50 dark:bg-zinc-800" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP *</Label>
              <Input 
                id="zipCode" 
                value={formData.zip}
                onChange={(e) => handleChange('zip', e.target.value)}
                placeholder="00000-000" 
                required 
                className="bg-gray-50 dark:bg-zinc-800" 
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-2">
              <Label htmlFor="address">Endereço *</Label>
              <Input 
                id="address" 
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Endereço completo" 
                required 
                className="bg-gray-50 dark:bg-zinc-800" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workingCapital">Capital de Giro (R$)</Label>
              <Input 
                id="workingCapital" 
                type="number" 
                value={formData.working_capital}
                onChange={(e) => handleChange('working_capital', e.target.value)}
                placeholder="0.00" 
                className="bg-gray-50 dark:bg-zinc-800" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergencyFund">Reserva de Emergência (R$)</Label>
              <Input 
                id="emergencyFund" 
                type="number" 
                value={formData.emergency_reserve}
                onChange={(e) => handleChange('emergency_reserve', e.target.value)}
                placeholder="0.00" 
                className="bg-gray-50 dark:bg-zinc-800" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="marketingCapital">Capital de Marketing (R$)</Label>
              <Input 
                id="marketingCapital" 
                type="number" 
                value={formData.capital_marketing}
                onChange={(e) => handleChange('capital_marketing', e.target.value)}
                placeholder="0.00" 
                className="bg-gray-50 dark:bg-zinc-800" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grossInvestment">Investimento Bruto (R$)</Label>
              <Input 
                id="grossInvestment" 
                type="number" 
                value={formData.gross_investment}
                onChange={(e) => handleChange('gross_investment', e.target.value)}
                placeholder="0.00" 
                className="bg-gray-50 dark:bg-zinc-800" 
              />
            </div>

            <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
              <Label className="text-base font-semibold">Titulares da Conta</Label>
              <div className="flex gap-2">
                <Input 
                  value={newHolderName}
                  onChange={(e) => setNewHolderName(e.target.value)}
                  placeholder="Nome do titular (ex: João, Alyson)"
                  className="bg-gray-50 dark:bg-zinc-800"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddHolder();
                    }
                  }}
                />
                <Button 
                  type="button" 
                  onClick={handleAddHolder} 
                  size="icon" 
                  className={`shrink-0 ${editingHolderId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                >
                  {editingHolderId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </Button>
                {editingHolderId && (
                  <Button type="button" onClick={cancelEditHolder} size="icon" variant="ghost" className="shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {error && (
                <p className="text-sm text-red-500 mt-1 font-medium">{error}</p>
              )}
              
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                {accountHolders.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">Nenhum titular cadastrado.</p>
                ) : (
                  accountHolders.map(holder => (
                    <div key={holder.id} className={`flex items-center justify-between p-2 rounded border ${editingHolderId === holder.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'}`}>
                      <span className="text-sm font-medium">{holder.name}</span>
                      <div className="flex gap-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => startEditHolder(holder)}
                          className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteHolder(holder.id)}
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <Label className="text-base font-semibold">Marketplaces</Label>
            <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="space-y-2">
                   <Label>Nome do Marketplace</Label>
                   <Input
                     value={newMarketplace.name}
                     onChange={(e) => setNewMarketplace(prev => ({...prev, name: e.target.value}))}
                     placeholder="Ex: Novo Marketplace"
                     className="bg-white dark:bg-zinc-900"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Comissão (%)</Label>
                   <Input
                     type="number"
                     value={newMarketplace.commission_rate}
                     onChange={(e) => setNewMarketplace(prev => ({...prev, commission_rate: parseFloat(e.target.value) || 0}))}
                     placeholder="0"
                     className="bg-white dark:bg-zinc-900"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Taxa fixa (R$)</Label>
                   <Input
                     type="number"
                     value={newMarketplace.fixed_fee}
                     onChange={(e) => setNewMarketplace(prev => ({...prev, fixed_fee: parseFloat(e.target.value) || 0}))}
                     placeholder="0.00"
                     className="bg-white dark:bg-zinc-900"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Comissão de Afiliado (%)</Label>
                   <Input
                     type="number"
                     step="0.01"
                     value={newMarketplace.affiliate_commission_rate}
                     onChange={(e) => setNewMarketplace(prev => ({...prev, affiliate_commission_rate: parseFloat(e.target.value) || 0}))}
                     placeholder="0.00"
                     className="bg-white dark:bg-zinc-900"
                   />
                 </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="hasMonthlyFee" 
                  checked={newMarketplace.has_monthly_fee}
                  onCheckedChange={(checked) => setNewMarketplace(prev => ({...prev, has_monthly_fee: !!checked}))}
                />
                <Label htmlFor="hasMonthlyFee">Possui mensalidade?</Label>
              </div>

              {newMarketplace.has_monthly_fee && (
                <div className="space-y-2 pt-2">
                  <Label>Valor da Mensalidade (R$)</Label>
                   <Input
                     type="number"
                     value={newMarketplace.monthly_fee_value}
                     onChange={(e) => setNewMarketplace(prev => ({...prev, monthly_fee_value: parseFloat(e.target.value) || 0}))}
                     placeholder="0.00"
                     className="bg-white dark:bg-zinc-900"
                   />
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <Button 
                  type="button" 
                  onClick={handleAddMarketplace} 
                  className={`w-full ${editingMarketplaceId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                >
                  {editingMarketplaceId ? (
                    <><Save className="h-4 w-4 mr-2" /> Atualizar Marketplace</>
                  ) : (
                    <><Plus className="h-4 w-4 mr-2" /> Adicionar Marketplace</>
                  )}
                </Button>
                {editingMarketplaceId && (
                  <Button type="button" onClick={cancelEditMarketplace} variant="outline" className="shrink-0">
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {marketplaces.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhum marketplace cadastrado.</p>
              ) : (
                marketplaces.map(mp => (
                  <div key={mp.id} className={`flex items-center justify-between p-3 rounded border ${editingMarketplaceId === mp.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'}`}>
                    <div className="flex flex-col">
                        <span className="font-medium">{mp.name}</span>
                        <span className="text-xs text-gray-500">
                            Comissão: {mp.commission_rate}%
                            {mp.fixed_fee ? ` | Taxa fixa: R$ ${mp.fixed_fee.toFixed(2)}` : ''}
                            {mp.has_monthly_fee && ` | Mensalidade: R$ ${mp.monthly_fee_value.toFixed(2)}`}
                            {mp.affiliate_commission_rate ? ` | Afiliado: ${mp.affiliate_commission_rate}%` : ''}
                            {mp.is_system && ' (Padrão)'}
                        </span>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => startEditMarketplace(mp)}
                        className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      {!mp.is_system && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteMarketplace(mp.id)}
                          className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Seção Afiliados */}
          <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <Label className="text-base font-semibold">Afiliados</Label>
            <div className="flex flex-col gap-2 p-4 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={newAffiliate.name}
                    onChange={(e) => setNewAffiliate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Vitrine da Danny"
                    className="bg-white dark:bg-zinc-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label>@ TikTok</Label>
                  <div className="relative">
                    <AtSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      value={newAffiliate.tiktok}
                      onChange={(e) => setNewAffiliate(prev => ({ ...prev, tiktok: e.target.value }))}
                      placeholder="usuario"
                      className="bg-white dark:bg-zinc-900 pl-7"
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Marketplace</Label>
                  <Select value={newAffiliate.marketplace_id} onValueChange={(val) => setNewAffiliate(prev => ({ ...prev, marketplace_id: val }))}>
                    <SelectTrigger className="bg-white dark:bg-zinc-900">
                      <SelectValue placeholder="Selecione o marketplace" />
                    </SelectTrigger>
                    <SelectContent>
                      {marketplaces.map(mp => (
                        <SelectItem key={mp.id} value={mp.id}>{mp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  onClick={handleAddAffiliate}
                  className={`w-full ${editingAffiliateId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
                >
                  {editingAffiliateId ? (
                    <><Save className="h-4 w-4 mr-2" /> Atualizar Afiliado</>
                  ) : (
                    <><Plus className="h-4 w-4 mr-2" /> Adicionar Afiliado</>
                  )}
                </Button>
                {editingAffiliateId && (
                  <Button type="button" onClick={() => { setEditingAffiliateId(null); setNewAffiliate({ name: '', tiktok: '', marketplace_id: '' }); }} variant="outline" className="shrink-0">
                    Cancelar
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
              {affiliates.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhum afiliado cadastrado.</p>
              ) : (
                affiliates.map(a => (
                  <div key={a.id} className={`flex items-center justify-between p-3 rounded border ${editingAffiliateId === a.id ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : 'bg-gray-50 dark:bg-zinc-800 border-gray-100 dark:border-zinc-700'}`}>
                    <div className="flex flex-col">
                      <span className="font-medium">{a.name}</span>
                      <span className="text-xs text-gray-500">
                        {a.tiktok && <span>@{a.tiktok} · </span>}
                        {a.marketplace_id && <span>{marketplaces.find(m => m.id === a.marketplace_id)?.name}</span>}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => startEditAffiliate(a)} className="h-6 w-6 text-blue-500 hover:text-blue-700 hover:bg-blue-50">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleDeleteAffiliate(a.id)} className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
