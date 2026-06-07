/**
 * Type definitions for Leads Table Management feature
 * 
 * This file contains all TypeScript interfaces and types used throughout
 * the leads management feature, including data models, filter configurations,
 * and component props.
 */

/**
 * Lead status enum
 */
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost' | 'converted' | 'recurrent';

/**
 * Document type enum
 */
export type DocumentType = 'cpf' | 'cnpj';

/**
 * Gender type
 */
export type Gender = 'male' | 'female';

/**
 * Lead data model
 * Represents a lead/prospect in the system
 */
export interface Lead {
  id: string;
  organization_id: string;
  bling_contact_id?: number | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  mobile_phone?: string | null;
  document_type?: DocumentType | null;
  document_number?: string | null;
  company_name?: string | null;
  trade_name?: string | null;
  
  // Address fields
  address_street?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  address_neighborhood?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_zip?: string | null;
  address_country?: string | null;
  
  // Lead metadata
  marketplace_id?: string | null;
  marketplace_name?: string;  // Joined from marketplaces table
  lead_status?: LeadStatus | null;
  lead_source?: string | null;
  gender?: Gender | null;
  gender_probability?: number | null;
  
  // Order statistics (computed/aggregated)
  total_orders?: number;
  total_spent?: number;
  first_order_date?: string | null;
  last_order_date?: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
  is_active?: boolean;
}

/**
 * Lead form data for create/edit operations
 */
export interface LeadFormData {
  name: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  document_type?: DocumentType;
  document_number?: string;
  company_name?: string;
  trade_name?: string;
  marketplace_id?: string;
  lead_status?: LeadStatus;
  lead_source?: string;
}

/**
 * Filter configuration for leads table
 */
export interface LeadFilters {
  searchText?: string;
  status?: LeadStatus[];
  marketplaceId?: string[];
  gender?: (Gender | null)[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * Sort configuration
 */
export interface SortConfig {
  column: string | null;
  direction: 'asc' | 'desc';
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalCount: number;
}

/**
 * KPI metrics for leads dashboard
 */
export interface LeadKPIs {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  lostLeads: number;
}

/**
 * Leads query response from API
 */
export interface LeadsQueryResponse {
  data: Lead[];
  totalCount: number;
  page: number;
  pageSize: number;
}

/**
 * Marketplace data model (for filter dropdowns)
 */
export interface Marketplace {
  id: string;
  name: string;
  organization_id: string;
}

/**
 * Lead table column definition
 */
export interface LeadTableColumn {
  key: string;
  label: string;
  sortable: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

/**
 * CSV export options
 */
export interface CSVExportOptions {
  filename: string;
  delimiter: string;
  encoding: string;
  includeHeaders: boolean;
}
