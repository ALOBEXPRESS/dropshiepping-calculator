
import { supabase } from '@/lib/supabase';

export interface Supplier {
  id: string;
  name: string;
  tax?: number;
}

export interface AccountHolder {
  id: string;
  name: string;
  type?: string;
}

export interface Marketplace {
  id: string;
  name: string;
  commission_rate: number;
  has_monthly_fee: boolean;
  monthly_fee_value: number;
  fixed_fee?: number;
  is_system: boolean;
}

export const ReferenceService = {
  async getSuppliers(organizationId?: string): Promise<Supplier[]> {
    let query = supabase
      .from('suppliers')
      .select('*')
      .order('name');

    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
    } else {
      query = query.is('organization_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getAccountHolders(organizationId?: string): Promise<AccountHolder[]> {
    console.log('[ReferenceService] getAccountHolders called with organizationId:', organizationId);
    
    let query = supabase
      .from('account_holders')
      .select('*')
      .order('name');

    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
    } else {
      query = query.is('organization_id', null);
    }

    const { data, error } = await query;
    console.log('[ReferenceService] getAccountHolders result:', { data, error });
    
    if (error) throw error;
    return data || [];
  },

  async getMarketplaces(organizationId?: string): Promise<Marketplace[]> {
    let query = supabase
      .from('marketplaces')
      .select('*')
      .order('name');

    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
    } else {
      query = query.is('organization_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async addSupplier(name: string, tax: number = 0, organizationId?: string): Promise<Supplier> {
    const { data, error } = await supabase
      .from('suppliers')
      .insert({ name, tax, organization_id: organizationId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSupplier(id: string): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async updateSupplier(id: string, name: string, tax: number): Promise<void> {
    const { error } = await supabase
      .from('suppliers')
      .update({ name, tax })
      .eq('id', id);
    if (error) throw error;
  },

  async addAccountHolder(name: string, type?: string, organizationId?: string): Promise<AccountHolder> {
    const { data, error } = await supabase
      .from('account_holders')
      .insert({ name, type, organization_id: organizationId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAccountHolder(id: string, name: string, type?: string): Promise<void> {
    const updates: { name: string; type?: string } = { name };
    if (type) updates.type = type;
    
    const { error } = await supabase
      .from('account_holders')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  },

  async deleteAccountHolder(id: string): Promise<void> {
    const { error } = await supabase
      .from('account_holders')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async addMarketplace(marketplace: Omit<Marketplace, 'id' | 'is_system'> & { organization_id?: string }): Promise<Marketplace> {
    const { data, error } = await supabase
      .from('marketplaces')
      .insert(marketplace)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMarketplace(id: string): Promise<void> {
    const { error } = await supabase
      .from('marketplaces')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async updateMarketplace(id: string, updates: Partial<Marketplace>): Promise<void> {
    const { error } = await supabase
      .from('marketplaces')
      .update(updates)
      .eq('id', id);
    if (error) throw error;
  }
};
