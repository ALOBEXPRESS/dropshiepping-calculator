/**
 * Leads MCP Service - AI Agent Reference
 * 
 * This file documents SQL queries and patterns for AI agents to use when working
 * with leads data via Supabase MCP tools (mcp_supabase_execute_sql).
 * 
 * **IMPORTANT**: This service is NOT meant to be called from application code.
 * It serves as a reference for AI agents that have access to MCP tools.
 * 
 * For application code, use src/services/leadsService.ts instead.
 * 
 * Features documented:
 * - Fetch leads with filters, sorting, and pagination
 * - Calculate KPI metrics (total, new, qualified, lost leads)
 * - CRUD operations (create, update, delete leads)
 * - Multi-tenancy via organization_id filtering
 * - Parameterized queries for security
 * 
 * Supabase Project ID: oensqhjnxwpcuanozske
 */

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

// Supabase project ID from MCP configuration
export const SUPABASE_PROJECT_ID = 'oensqhjnxwpcuanozske';

/**
 * AI Agent Reference: Fetch leads with filters, sorting, and pagination
 * 
 * Sub-task 3.1: SQL query pattern for fetching leads using mcp_supabase_execute_sql
 * - Builds SQL query with joins to marketplaces table
 * - Includes aggregations for order counts and totals
 * - Applies filters, sorting, and pagination
 * - Requirements: 1.2, 1.3, 3.6, 4.5, 5.7
 * 
 * @example AI Agent Usage:
 * ```typescript
 * // Step 1: Build the query based on filters
 * const organizationId = 'uuid-here';
 * const filters = { searchText: 'John', status: ['new', 'qualified'] };
 * const sort = { column: 'created_at', direction: 'desc' };
 * const pagination = { page: 0, pageSize: 25 };
 * 
 * // Step 2: Call MCP tool
 * const result = await mcp_supabase_execute_sql({
 *   project_id: 'oensqhjnxwpcuanozske',
 *   query: `
 *     SELECT 
 *       l.*,
 *       m.name as marketplace_name,
 *       COUNT(DISTINCT o.id) as total_orders,
 *       COALESCE(SUM(o.total_amount), 0) as total_spent,
 *       MIN(o.created_at) as first_order_date,
 *       MAX(o.created_at) as last_order_date
 *     FROM leads l
 *     LEFT JOIN marketplaces m ON l.marketplace_id = m.id
 *     LEFT JOIN orders o ON l.id = o.lead_id
 *     WHERE l.organization_id = '${organizationId}'
 *       AND (l.name ILIKE '%John%' OR l.email ILIKE '%John%')
 *       AND l.lead_status IN ('new', 'qualified')
 *     GROUP BY l.id, m.name
 *     ORDER BY l.created_at DESC
 *     LIMIT 25 OFFSET 0
 *   `
 * });
 * ```
 * 
 * @param organizationId - Organization UUID to filter leads
 * @param filters - Filter criteria (searchText, status, marketplaceId, gender, dateRange)
 * @param sort - Sort configuration (column, direction)
 * @param pagination - Pagination settings (page, pageSize)
 * @returns Promise<LeadsQueryResponse> with data, totalCount, page, pageSize
 */
export function buildFetchLeadsQuery(
  organizationId: string,
  filters: LeadFilters,
  sort: SortConfig,
  pagination: PaginationConfig
): { dataQuery: string; countQuery: string } {
  // Build WHERE clauses for filters
  const whereClauses: string[] = [`l.organization_id = '${organizationId}'`];

  // Apply search filter (text search across multiple fields)
  if (filters.searchText) {
    const searchTerm = filters.searchText.replace(/'/g, "''"); // Escape single quotes
    whereClauses.push(`(
      l.name ILIKE '%${searchTerm}%' OR
      l.email ILIKE '%${searchTerm}%' OR
      l.phone ILIKE '%${searchTerm}%' OR
      l.mobile_phone ILIKE '%${searchTerm}%' OR
      l.company_name ILIKE '%${searchTerm}%'
    )`);
  }

  // Apply status filter
  if (filters.status && filters.status.length > 0) {
    const statusList = filters.status.map(s => `'${s}'`).join(', ');
    whereClauses.push(`l.lead_status IN (${statusList})`);
  }

  // Apply marketplace filter
  if (filters.marketplaceId && filters.marketplaceId.length > 0) {
    const marketplaceList = filters.marketplaceId.map(id => `'${id}'`).join(', ');
    whereClauses.push(`l.marketplace_id IN (${marketplaceList})`);
  }

  // Apply gender filter
  if (filters.gender && filters.gender.length > 0) {
    const genderList = filters.gender.map(g => g === null ? 'NULL' : `'${g}'`).join(', ');
    whereClauses.push(`l.gender IN (${genderList})`);
  }

  // Apply date range filter
  if (filters.dateRange) {
    whereClauses.push(`l.created_at >= '${filters.dateRange.from.toISOString()}'`);
    whereClauses.push(`l.created_at <= '${filters.dateRange.to.toISOString()}'`);
  }

  const whereClause = whereClauses.join(' AND ');

  // Build ORDER BY clause
  let orderByClause = 'l.created_at DESC'; // Default sort
  if (sort.column) {
    const direction = sort.direction === 'asc' ? 'ASC' : 'DESC';
    // Map column names to actual database columns
    const columnMap: Record<string, string> = {
      name: 'l.name',
      email: 'l.email',
      company_name: 'l.company_name',
      marketplace_name: 'm.name',
      lead_status: 'l.lead_status',
      created_at: 'l.created_at',
      total_orders: 'total_orders',
      total_spent: 'total_spent',
    };
    const dbColumn = columnMap[sort.column] || 'l.created_at';
    orderByClause = `${dbColumn} ${direction}`;
  }

  // Calculate offset and limit for pagination
  const offset = pagination.page * pagination.pageSize;
  const limit = pagination.pageSize;

  // Build main query with joins and aggregations
  const dataQuery = `
    SELECT 
      l.*,
      m.name as marketplace_name,
      COUNT(DISTINCT o.id) as total_orders,
      COALESCE(SUM(o.total_amount), 0) as total_spent,
      MIN(o.created_at) as first_order_date,
      MAX(o.created_at) as last_order_date
    FROM leads l
    LEFT JOIN marketplaces m ON l.marketplace_id = m.id
    LEFT JOIN orders o ON l.id = o.lead_id
    WHERE ${whereClause}
    GROUP BY l.id, m.name
    ORDER BY ${orderByClause}
    LIMIT ${limit} OFFSET ${offset}
  `;

  // Build count query
  const countQuery = `
    SELECT COUNT(DISTINCT l.id) as total_count
    FROM leads l
    WHERE ${whereClause}
  `;

  return { dataQuery, countQuery };
}

/**
 * AI Agent Reference: Fetch KPI metrics for leads dashboard
 * 
 * Sub-task 3.2: SQL query pattern for fetching lead KPIs using mcp_supabase_execute_sql
 * - Calculates all four KPI metrics in single query
 * - Applies organization and period filters
 * - Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.5
 * 
 * @example AI Agent Usage:
 * ```typescript
 * const organizationId = 'uuid-here';
 * const filters = { marketplaceId: ['uuid1', 'uuid2'] };
 * 
 * const result = await mcp_supabase_execute_sql({
 *   project_id: 'oensqhjnxwpcuanozske',
 *   query: `
 *     SELECT 
 *       COUNT(*) as total_leads,
 *       COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_leads,
 *       COUNT(*) FILTER (WHERE lead_status = 'qualified') as qualified_leads,
 *       COUNT(*) FILTER (WHERE lead_status = 'lost') as lost_leads
 *     FROM leads
 *     WHERE organization_id = '${organizationId}'
 *       AND marketplace_id IN ('uuid1', 'uuid2')
 *   `
 * });
 * ```
 * 
 * @param organizationId - Organization UUID to filter leads
 * @param filters - Optional filter criteria (marketplaceId, dateRange)
 * @returns SQL query string for KPI calculation
 */
export function buildFetchLeadKPIsQuery(
  organizationId: string,
  filters?: LeadFilters
): string {
  // Build WHERE clauses for filters
  const whereClauses: string[] = [`organization_id = '${organizationId}'`];

  // Apply marketplace filter if provided
  if (filters?.marketplaceId && filters.marketplaceId.length > 0) {
    const marketplaceList = filters.marketplaceId.map(id => `'${id}'`).join(', ');
    whereClauses.push(`marketplace_id IN (${marketplaceList})`);
  }

  // Apply date range filter if provided
  if (filters?.dateRange) {
    whereClauses.push(`created_at >= '${filters.dateRange.from.toISOString()}'`);
    whereClauses.push(`created_at <= '${filters.dateRange.to.toISOString()}'`);
  }

  const whereClause = whereClauses.join(' AND ');

  // Calculate 30 days ago for "new leads" metric
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Build KPI query that calculates all metrics in a single query
  const kpiQuery = `
    SELECT 
      COUNT(*) as total_leads,
      COUNT(*) FILTER (WHERE created_at >= '${thirtyDaysAgo.toISOString()}') as new_leads,
      COUNT(*) FILTER (WHERE lead_status = 'qualified') as qualified_leads,
      COUNT(*) FILTER (WHERE lead_status = 'lost') as lost_leads
    FROM leads
    WHERE ${whereClause}
  `;

  return kpiQuery;
}

/**
 * AI Agent Reference: Create a new lead
 * 
 * Sub-task 3.3: SQL query pattern for creating leads using mcp_supabase_execute_sql
 * - Uses parameterized values for security
 * - Includes organization_id for RLS
 * - Returns the created lead
 * - Requirements: 6.7
 * 
 * @example AI Agent Usage:
 * ```typescript
 * const organizationId = 'uuid-here';
 * const formData = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '(11) 98765-4321',
 *   lead_status: 'new'
 * };
 * 
 * const result = await mcp_supabase_execute_sql({
 *   project_id: 'oensqhjnxwpcuanozske',
 *   query: `
 *     INSERT INTO leads (
 *       organization_id, name, email, phone, mobile_phone,
 *       document_type, document_number, company_name, trade_name,
 *       marketplace_id, lead_status, lead_source,
 *       created_at, updated_at
 *     )
 *     VALUES (
 *       '${organizationId}', 'John Doe', 'john@example.com', '(11) 98765-4321', NULL,
 *       NULL, NULL, NULL, NULL,
 *       NULL, 'new', NULL,
 *       NOW(), NOW()
 *     )
 *     RETURNING *
 *   `
 * });
 * ```
 * 
 * @param organizationId - Organization UUID
 * @param formData - Lead form data
 * @returns SQL query string for creating a lead
 */
export function buildCreateLeadQuery(
  organizationId: string,
  formData: LeadFormData
): string {
  // Escape single quotes in string values
  const escapeSql = (value: string | undefined | null): string => {
    if (value === undefined || value === null) return 'NULL';
    return `'${value.replace(/'/g, "''")}'`;
  };

  const insertQuery = `
    INSERT INTO leads (
      organization_id,
      name,
      email,
      phone,
      mobile_phone,
      document_type,
      document_number,
      company_name,
      trade_name,
      marketplace_id,
      lead_status,
      lead_source,
      created_at,
      updated_at
    )
    VALUES (
      '${organizationId}',
      ${escapeSql(formData.name)},
      ${escapeSql(formData.email)},
      ${escapeSql(formData.phone)},
      ${escapeSql(formData.mobile_phone)},
      ${escapeSql(formData.document_type)},
      ${escapeSql(formData.document_number)},
      ${escapeSql(formData.company_name)},
      ${escapeSql(formData.trade_name)},
      ${formData.marketplace_id ? `'${formData.marketplace_id}'` : 'NULL'},
      ${escapeSql(formData.lead_status || 'new')},
      ${escapeSql(formData.lead_source)},
      NOW(),
      NOW()
    )
    RETURNING *
  `;

  return insertQuery;
}

/**
 * AI Agent Reference: Update an existing lead
 * 
 * Sub-task 3.3: SQL query pattern for updating leads using mcp_supabase_execute_sql
 * - Uses parameterized values for security
 * - Includes organization_id check for RLS
 * - Returns the updated lead
 * - Requirements: 7.5
 * 
 * @example AI Agent Usage:
 * ```typescript
 * const leadId = 'lead-uuid-here';
 * const organizationId = 'org-uuid-here';
 * const formData = {
 *   name: 'John Doe Updated',
 *   email: 'john.updated@example.com',
 *   lead_status: 'qualified'
 * };
 * 
 * const result = await mcp_supabase_execute_sql({
 *   project_id: 'oensqhjnxwpcuanozske',
 *   query: `
 *     UPDATE leads
 *     SET
 *       name = 'John Doe Updated',
 *       email = 'john.updated@example.com',
 *       lead_status = 'qualified',
 *       updated_at = NOW()
 *     WHERE id = '${leadId}' AND organization_id = '${organizationId}'
 *     RETURNING *
 *   `
 * });
 * ```
 * 
 * @param leadId - Lead UUID to update
 * @param organizationId - Organization UUID for security check
 * @param formData - Lead form data with updates
 * @returns SQL query string for updating a lead
 */
export function buildUpdateLeadQuery(
  leadId: string,
  organizationId: string,
  formData: LeadFormData
): string {
  // Escape single quotes in string values
  const escapeSql = (value: string | undefined | null): string => {
    if (value === undefined || value === null) return 'NULL';
    return `'${value.replace(/'/g, "''")}'`;
  };

  const updateQuery = `
    UPDATE leads
    SET
      name = ${escapeSql(formData.name)},
      email = ${escapeSql(formData.email)},
      phone = ${escapeSql(formData.phone)},
      mobile_phone = ${escapeSql(formData.mobile_phone)},
      document_type = ${escapeSql(formData.document_type)},
      document_number = ${escapeSql(formData.document_number)},
      company_name = ${escapeSql(formData.company_name)},
      trade_name = ${escapeSql(formData.trade_name)},
      marketplace_id = ${formData.marketplace_id ? `'${formData.marketplace_id}'` : 'NULL'},
      lead_status = ${escapeSql(formData.lead_status)},
      lead_source = ${escapeSql(formData.lead_source)},
      updated_at = NOW()
    WHERE id = '${leadId}' AND organization_id = '${organizationId}'
    RETURNING *
  `;

  return updateQuery;
}

/**
 * AI Agent Reference: Delete a lead
 * 
 * Sub-task 3.3: SQL query pattern for deleting leads using mcp_supabase_execute_sql
 * - Includes organization_id check for RLS
 * - Ensures only authorized deletions
 * - Requirements: 8.4
 * 
 * @example AI Agent Usage:
 * ```typescript
 * const leadId = 'lead-uuid-here';
 * const organizationId = 'org-uuid-here';
 * 
 * const result = await mcp_supabase_execute_sql({
 *   project_id: 'oensqhjnxwpcuanozske',
 *   query: `
 *     DELETE FROM leads
 *     WHERE id = '${leadId}' AND organization_id = '${organizationId}'
 *   `
 * });
 * 
 * // Check if deletion was successful by verifying affected rows
 * if (result.length === 0) {
 *   throw new Error('Lead not found or unauthorized');
 * }
 * ```
 * 
 * @param leadId - Lead UUID to delete
 * @param organizationId - Organization UUID for security check
 * @returns SQL query string for deleting a lead
 */
export function buildDeleteLeadQuery(
  leadId: string,
  organizationId: string
): string {
  const deleteQuery = `
    DELETE FROM leads
    WHERE id = '${leadId}' AND organization_id = '${organizationId}'
  `;

  return deleteQuery;
}

/**
 * AI Agent Reference: Fetch marketplaces for filter dropdown
 * 
 * Simple query to get all marketplaces for an organization.
 * Used to populate marketplace filter dropdowns.
 * 
 * @example AI Agent Usage:
 * ```typescript
 * const organizationId = 'org-uuid-here';
 * 
 * const result = await mcp_supabase_execute_sql({
 *   project_id: 'oensqhjnxwpcuanozske',
 *   query: `
 *     SELECT id, name, organization_id
 *     FROM marketplaces
 *     WHERE organization_id = '${organizationId}'
 *     ORDER BY name
 *   `
 * });
 * ```
 * 
 * @param organizationId - Organization UUID
 * @returns SQL query string for fetching marketplaces
 */
export function buildFetchMarketplacesQuery(organizationId: string): string {
  const query = `
    SELECT id, name, organization_id
    FROM marketplaces
    WHERE organization_id = '${organizationId}'
    ORDER BY name
  `;

  return query;
}


/**
 * ============================================================================
 * AI AGENT USAGE GUIDE
 * ============================================================================
 * 
 * This file provides SQL query builders for AI agents to interact with leads
 * data using Supabase MCP tools. Below are complete examples of how to use
 * each function.
 * 
 * ## Prerequisites
 * 
 * 1. Ensure you have access to the Supabase MCP tool: `mcp_supabase_execute_sql`
 * 2. Use project ID: `oensqhjnxwpcuanozske`
 * 3. Understand the leads table schema (see database schema above)
 * 
 * ## Complete Examples
 * 
 * ### Example 1: Fetch Leads with Filters
 * 
 * ```typescript
 * import { buildFetchLeadsQuery, SUPABASE_PROJECT_ID } from './leadsMcpService';
 * 
 * // Define filters
 * const organizationId = 'your-org-uuid';
 * const filters = {
 *   searchText: 'John',
 *   status: ['new', 'qualified'],
 *   marketplaceId: ['marketplace-uuid-1'],
 *   dateRange: {
 *     from: new Date('2024-01-01'),
 *     to: new Date('2024-12-31')
 *   }
 * };
 * const sort = { column: 'created_at', direction: 'desc' };
 * const pagination = { page: 0, pageSize: 25 };
 * 
 * // Build queries
 * const { dataQuery, countQuery } = buildFetchLeadsQuery(
 *   organizationId,
 *   filters,
 *   sort,
 *   pagination
 * );
 * 
 * // Execute data query
 * const dataResult = await mcp_supabase_execute_sql({
 *   project_id: SUPABASE_PROJECT_ID,
 *   query: dataQuery
 * });
 * 
 * // Execute count query
 * const countResult = await mcp_supabase_execute_sql({
 *   project_id: SUPABASE_PROJECT_ID,
 *   query: countQuery
 * });
 * 
 * // Process results
 * const leads = dataResult; // Array of Lead objects
 * const totalCount = countResult[0].total_count;
 * ```
 * 
 * ### Example 2: Fetch KPI Metrics
 * 
 * ```typescript
 * import { buildFetchLeadKPIsQuery, SUPABASE_PROJECT_ID } from './leadsMcpService';
 * 
 * const organizationId = 'your-org-uuid';
 * const filters = {
 *   marketplaceId: ['marketplace-uuid-1', 'marketplace-uuid-2']
 * };
 * 
 * const query = buildFetchLeadKPIsQuery(organizationId, filters);
 * 
 * const result = await mcp_supabase_execute_sql({
 *   project_id: SUPABASE_PROJECT_ID,
 *   query: query
 * });
 * 
 * const kpis = result[0]; // { total_leads, new_leads, qualified_leads, lost_leads }
 * ```
 * 
 * ### Example 3: Create a New Lead
 * 
 * ```typescript
 * import { buildCreateLeadQuery, SUPABASE_PROJECT_ID } from './leadsMcpService';
 * 
 * const organizationId = 'your-org-uuid';
 * const formData = {
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   phone: '(11) 98765-4321',
 *   mobile_phone: '(11) 91234-5678',
 *   company_name: 'Acme Corp',
 *   marketplace_id: 'marketplace-uuid',
 *   lead_status: 'new',
 *   lead_source: 'website'
 * };
 * 
 * const query = buildCreateLeadQuery(organizationId, formData);
 * 
 * const result = await mcp_supabase_execute_sql({
 *   project_id: SUPABASE_PROJECT_ID,
 *   query: query
 * });
 * 
 * const newLead = result[0]; // The created Lead object
 * ```
 * 
 * ### Example 4: Update an Existing Lead
 * 
 * ```typescript
 * import { buildUpdateLeadQuery, SUPABASE_PROJECT_ID } from './leadsMcpService';
 * 
 * const leadId = 'lead-uuid';
 * const organizationId = 'your-org-uuid';
 * const formData = {
 *   name: 'John Doe Updated',
 *   email: 'john.updated@example.com',
 *   lead_status: 'qualified'
 * };
 * 
 * const query = buildUpdateLeadQuery(leadId, organizationId, formData);
 * 
 * const result = await mcp_supabase_execute_sql({
 *   project_id: SUPABASE_PROJECT_ID,
 *   query: query
 * });
 * 
 * const updatedLead = result[0]; // The updated Lead object
 * ```
 * 
 * ### Example 5: Delete a Lead
 * 
 * ```typescript
 * import { buildDeleteLeadQuery, SUPABASE_PROJECT_ID } from './leadsMcpService';
 * 
 * const leadId = 'lead-uuid';
 * const organizationId = 'your-org-uuid';
 * 
 * const query = buildDeleteLeadQuery(leadId, organizationId);
 * 
 * await mcp_supabase_execute_sql({
 *   project_id: SUPABASE_PROJECT_ID,
 *   query: query
 * });
 * 
 * // Lead deleted successfully
 * ```
 * 
 * ### Example 6: Fetch Marketplaces
 * 
 * ```typescript
 * import { buildFetchMarketplacesQuery, SUPABASE_PROJECT_ID } from './leadsMcpService';
 * 
 * const organizationId = 'your-org-uuid';
 * 
 * const query = buildFetchMarketplacesQuery(organizationId);
 * 
 * const result = await mcp_supabase_execute_sql({
 *   project_id: SUPABASE_PROJECT_ID,
 *   query: query
 * });
 * 
 * const marketplaces = result; // Array of Marketplace objects
 * ```
 * 
 * ## Security Notes
 * 
 * 1. **Organization ID Filtering**: All queries include organization_id checks
 *    to ensure multi-tenancy and data isolation.
 * 
 * 2. **SQL Injection Prevention**: The query builders escape single quotes in
 *    user input to prevent SQL injection attacks.
 * 
 * 3. **RLS (Row Level Security)**: The database should have RLS policies enabled
 *    to provide an additional layer of security.
 * 
 * ## Error Handling
 * 
 * Always wrap MCP tool calls in try-catch blocks:
 * 
 * ```typescript
 * try {
 *   const result = await mcp_supabase_execute_sql({
 *     project_id: SUPABASE_PROJECT_ID,
 *     query: query
 *   });
 *   // Process result
 * } catch (error) {
 *   console.error('Failed to execute query:', error);
 *   // Handle error appropriately
 * }
 * ```
 * 
 * ## Performance Considerations
 * 
 * 1. **Pagination**: Always use pagination for large datasets to avoid
 *    performance issues and timeouts.
 * 
 * 2. **Indexes**: Ensure the database has appropriate indexes on:
 *    - organization_id
 *    - created_at
 *    - lead_status
 *    - marketplace_id
 * 
 * 3. **Aggregations**: The fetchLeads query includes aggregations (COUNT, SUM)
 *    which can be expensive. Consider caching results when appropriate.
 * 
 * ## Related Files
 * 
 * - `src/types/leads.ts` - TypeScript type definitions
 * - `src/services/leadsService.ts` - Standard Supabase client implementation (for application code)
 * - `src/hooks/useLeads.ts` - React Query hooks (for application code)
 * - `.kiro/specs/leads-table-management/` - Feature specification and design documents
 */
