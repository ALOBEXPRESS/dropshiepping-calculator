/**
 * Leads Service
 * 
 * Service layer for fetching and managing leads data from Supabase.
 * 
 * Features:
 * - Fetches leads with filters, sorting, and pagination
 * - Calculates KPI metrics (total, new, qualified, lost leads)
 * - CRUD operations (create, update, delete leads)
 * - Filters data by organization_id for multi-tenancy
 */

import { supabase } from '../lib/supabase';
import type {
  Lead,
  LeadFilters,
  SortConfig,
  PaginationConfig,
  LeadsQueryResponse,
  LeadKPIs,
  LeadFormData,
  Marketplace,
} from '../types/leads';

export class LeadsService {
  /**
   * Fetch leads with filters, sorting, and pagination
   */
  static async fetchLeads(
    organizationId: string,
    filters: LeadFilters,
    sort: SortConfig,
    pagination: PaginationConfig
  ): Promise<LeadsQueryResponse> {
    try {
      // Build base query
      let query = supabase
        .from('leads')
        .select(`
          *,
          marketplace:marketplaces(id, name)
        `, { count: 'exact' })
        .eq('organization_id', organizationId);

      // Apply search filter (text search across multiple fields)
      if (filters.searchText) {
        const searchTerm = `%${filters.searchText}%`;
        query = query.or(`
          name.ilike.${searchTerm},
          email.ilike.${searchTerm},
          phone.ilike.${searchTerm},
          mobile_phone.ilike.${searchTerm},
          company_name.ilike.${searchTerm}
        `);
      }

      // Apply status filter
      if (filters.status && filters.status.length > 0) {
        query = query.in('lead_status', filters.status);
      }

      // Apply marketplace filter
      if (filters.marketplaceId && filters.marketplaceId.length > 0) {
        query = query.in('marketplace_id', filters.marketplaceId);
      }

      // Apply gender filter
      if (filters.gender && filters.gender.length > 0) {
        query = query.in('gender', filters.gender);
      }

      // Apply date range filter
      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString());
      }

      // Apply sorting
      if (sort.column) {
        query = query.order(sort.column, { ascending: sort.direction === 'asc' });
      } else {
        // Default sort by created_at descending
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      const start = pagination.page * pagination.pageSize;
      const end = start + pagination.pageSize - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch leads: ${error.message}`);
      }

      // Transform data to include marketplace_name
      const transformedData: Lead[] = (data || []).map(lead => ({
        ...lead,
        marketplace_name: Array.isArray(lead.marketplace) 
          ? lead.marketplace[0]?.name 
          : lead.marketplace?.name,
      }));

      return {
        data: transformedData,
        totalCount: count || 0,
        page: pagination.page,
        pageSize: pagination.pageSize,
      };
    } catch (error) {
      console.error('[LeadsService] Error fetching leads:', error);
      throw error;
    }
  }

  /**
   * Fetch KPI metrics for leads dashboard
   */
  static async fetchLeadKPIs(
    organizationId: string,
    filters?: LeadFilters
  ): Promise<LeadKPIs> {
    try {
      // Build base query
      let query = supabase
        .from('leads')
        .select('id, lead_status, created_at', { count: 'exact' })
        .eq('organization_id', organizationId);

      // Apply marketplace filter if provided
      if (filters?.marketplaceId && filters.marketplaceId.length > 0) {
        query = query.in('marketplace_id', filters.marketplaceId);
      }

      // Apply date range filter if provided
      if (filters?.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.from.toISOString())
          .lte('created_at', filters.dateRange.to.toISOString());
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch lead KPIs: ${error.message}`);
      }

      const totalLeads = count || 0;

      // Calculate new leads (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const newLeads = (data || []).filter(
        lead => new Date(lead.created_at) >= thirtyDaysAgo
      ).length;

      // Calculate qualified and lost leads
      const qualifiedLeads = (data || []).filter(
        lead => lead.lead_status === 'qualified'
      ).length;
      const lostLeads = (data || []).filter(
        lead => lead.lead_status === 'lost'
      ).length;

      return {
        totalLeads,
        newLeads,
        qualifiedLeads,
        lostLeads,
      };
    } catch (error) {
      console.error('[LeadsService] Error fetching lead KPIs:', error);
      throw error;
    }
  }

  /**
   * Create a new lead
   */
  static async createLead(
    organizationId: string,
    formData: LeadFormData
  ): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          organization_id: organizationId,
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          mobile_phone: formData.mobile_phone || null,
          document_type: formData.document_type || null,
          document_number: formData.document_number || null,
          company_name: formData.company_name || null,
          trade_name: formData.trade_name || null,
          marketplace_id: formData.marketplace_id || null,
          lead_status: formData.lead_status || 'new',
          lead_source: formData.lead_source || null,
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create lead: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('[LeadsService] Error creating lead:', error);
      throw error;
    }
  }

  /**
   * Update an existing lead
   */
  static async updateLead(
    leadId: string,
    organizationId: string,
    formData: LeadFormData
  ): Promise<Lead> {
    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          name: formData.name,
          email: formData.email || null,
          phone: formData.phone || null,
          mobile_phone: formData.mobile_phone || null,
          document_type: formData.document_type || null,
          document_number: formData.document_number || null,
          company_name: formData.company_name || null,
          trade_name: formData.trade_name || null,
          marketplace_id: formData.marketplace_id || null,
          lead_status: formData.lead_status || null,
          lead_source: formData.lead_source || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
        .eq('organization_id', organizationId) // Security check
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update lead: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('[LeadsService] Error updating lead:', error);
      throw error;
    }
  }

  /**
   * Delete a lead
   */
  static async deleteLead(
    leadId: string,
    organizationId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId)
        .eq('organization_id', organizationId); // Security check

      if (error) {
        throw new Error(`Failed to delete lead: ${error.message}`);
      }
    } catch (error) {
      console.error('[LeadsService] Error deleting lead:', error);
      throw error;
    }
  }

  /**
   * Fetch marketplaces for filter dropdown
   */
  static async fetchMarketplaces(organizationId: string): Promise<Marketplace[]> {
    try {
      const { data, error } = await supabase
        .from('marketplaces')
        .select('id, name, organization_id')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) {
        throw new Error(`Failed to fetch marketplaces: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('[LeadsService] Error fetching marketplaces:', error);
      throw error;
    }
  }
}
