import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { CampaignWithRelations, CampaignFormPayload } from '@/types/campaigns';

export interface UseCampaignsReturn {
  campaigns: CampaignWithRelations[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  createCampaign: (payload: CampaignFormPayload) => Promise<void>;
  updateCampaign: (id: string, payload: CampaignFormPayload) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  refetch: () => void;
}

export function useCampaigns(organizationId: string): UseCampaignsReturn {
  const queryClient = useQueryClient();
  const queryKey = ['campaigns', organizationId];

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_ad_sets(*),
          campaign_products(*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data ?? []) as CampaignWithRelations[];
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const createCampaign = async (payload: CampaignFormPayload) => {
    // 1. Insert campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        ...payload.campaign,
        organization_id: organizationId,
      })
      .select('id')
      .single();

    if (campaignError || !campaign) throw new Error(campaignError?.message ?? 'Failed to create campaign');

    const campaignId = campaign.id as string;

    // 2. Insert ad set
    const { error: adSetError } = await supabase
      .from('campaign_ad_sets')
      .insert({ ...payload.adSet, campaign_id: campaignId });

    if (adSetError) throw new Error(adSetError.message);

    // 3. Insert product links
    if (payload.products.length > 0) {
      const { error: productsError } = await supabase
        .from('campaign_products')
        .insert(
          payload.products.map((p) => ({
            campaign_id: campaignId,
            product_id: p.product_id,
            marketing_cost_override: p.marketing_cost_override,
            linked_order_id: p.linked_order_id ?? null,
          }))
        );
      if (productsError) throw new Error(productsError.message);

      // Sync marketing cost to campaign_order_costs for linked orders
      const linkedProducts = payload.products.filter(p => p.linked_order_id && p.marketing_cost_override != null);
      if (linkedProducts.length > 0) {
        await supabase
          .from('campaign_order_costs')
          .upsert(
            linkedProducts.map((p) => ({
              order_id: p.linked_order_id!,
              campaign_id: campaignId,
              marketing_cost: p.marketing_cost_override!,
              organization_id: organizationId,
            })),
            { onConflict: 'order_id' }
          );
      }
    }

    invalidate();
  };

  const updateCampaign = async (id: string, payload: CampaignFormPayload) => {
    // 1. Update campaign
    const { error: campaignError } = await supabase
      .from('campaigns')
      .update({
        name: payload.campaign.name,
        objective: payload.campaign.objective,
        budget_type: payload.campaign.budget_type,
        budget_amount: payload.campaign.budget_amount,
        status: payload.campaign.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (campaignError) throw new Error(campaignError.message);

    // 2. Update ad set (upsert by campaign_id)
    const { error: adSetError } = await supabase
      .from('campaign_ad_sets')
      .update({ ...payload.adSet })
      .eq('campaign_id', id);

    if (adSetError) throw new Error(adSetError.message);

    // 3. Replace product links (delete + insert)
    // First fetch existing linked orders to cascade-delete campaign_order_costs on unlink
    const { data: existingProducts } = await supabase
      .from('campaign_products')
      .select('linked_order_id')
      .eq('campaign_id', id)
      .not('linked_order_id', 'is', null);
    const prevOrderIds = ((existingProducts ?? []) as Array<{ linked_order_id: string | null }>)
      .map(p => p.linked_order_id).filter(Boolean) as string[];

    const { error: deleteError } = await supabase
      .from('campaign_products')
      .delete()
      .eq('campaign_id', id);

    if (deleteError) throw new Error(deleteError.message);

    if (payload.products.length > 0) {
      const { error: productsError } = await supabase
        .from('campaign_products')
        .insert(
          payload.products.map((p) => ({
            campaign_id: id,
            product_id: p.product_id,
            marketing_cost_override: p.marketing_cost_override,
            linked_order_id: p.linked_order_id ?? null,
          }))
        );
      if (productsError) throw new Error(productsError.message);

      // Sync marketing cost to campaign_order_costs for linked orders
      const linkedProducts = payload.products.filter(p => p.linked_order_id && p.marketing_cost_override != null);
      if (linkedProducts.length > 0) {
        await supabase
          .from('campaign_order_costs')
          .upsert(
            linkedProducts.map((p) => ({
              order_id: p.linked_order_id!,
              campaign_id: id,
              marketing_cost: p.marketing_cost_override!,
              organization_id: organizationId,
            })),
            { onConflict: 'order_id' }
          );
      }

      // Delete campaign_order_costs for orders no longer linked to this campaign
      const newOrderIds = new Set(linkedProducts.map(p => p.linked_order_id!));
      const removedOrderIds = prevOrderIds.filter(oid => !newOrderIds.has(oid));
      if (removedOrderIds.length > 0) {
        await supabase
          .from('campaign_order_costs')
          .delete()
          .eq('campaign_id', id)
          .in('order_id', removedOrderIds);
      }
    } else {
      // No products linked — delete all campaign_order_costs for this campaign
      if (prevOrderIds.length > 0) {
        await supabase
          .from('campaign_order_costs')
          .delete()
          .eq('campaign_id', id);
      }
    }

    invalidate();
  };

  const deleteCampaign = async (id: string) => {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    invalidate();
  };

  return {
    campaigns: data ?? [],
    isLoading,
    isError,
    error: error as Error | null,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    refetch,
  };
}
