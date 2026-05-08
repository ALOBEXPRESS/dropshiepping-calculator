# Leads MCP Service - AI Agent Reference

## Overview

The `leadsMcpService.ts` file provides SQL query builders for AI agents to interact with leads data using Supabase MCP tools. This service is **NOT** meant to be used by application code running in the browser or Node.js.

## Purpose

This service serves two main purposes:

1. **AI Agent Reference**: Provides documented SQL patterns that AI agents can use when working with leads data via MCP tools
2. **Query Documentation**: Documents the exact SQL queries needed for each operation, making it easier for developers to understand the data access patterns

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (React Components, Hooks, Standard Services)               │
│                                                              │
│  Uses: src/services/leadsService.ts                         │
│  (Supabase Client - runs in browser/Node.js)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                        │
│  (PostgreSQL Database with RLS)                             │
└─────────────────────────────────────────────────────────────┘
                              ▲
                              │ SQL via MCP
                              │
┌─────────────────────────────────────────────────────────────┐
│                       AI Agent Layer                         │
│  (Kiro, Claude, etc.)                                       │
│                                                              │
│  Uses: src/services/leadsMcpService.ts                      │
│  (MCP Tools - only available to AI agents)                  │
└─────────────────────────────────────────────────────────────┘
```

## Key Differences

### leadsService.ts (Application Code)
- Uses Supabase JavaScript client
- Runs in browser/Node.js
- Used by React components and hooks
- Handles authentication automatically
- Type-safe with TypeScript

### leadsMcpService.ts (AI Agent Reference)
- Provides raw SQL query builders
- Only usable by AI agents with MCP access
- Documents SQL patterns for reference
- Requires manual SQL execution via MCP tools
- Useful for debugging and understanding data access

## Available Query Builders

### 1. buildFetchLeadsQuery
Builds SQL queries for fetching leads with filters, sorting, and pagination.

**Returns**: `{ dataQuery: string, countQuery: string }`

**Features**:
- Joins with marketplaces table
- Aggregates order counts and totals
- Supports multiple filters (search, status, marketplace, gender, date range)
- Configurable sorting
- Pagination support

### 2. buildFetchLeadKPIsQuery
Builds SQL query for calculating KPI metrics.

**Returns**: `string` (SQL query)

**Metrics**:
- Total Leads
- New Leads (last 30 days)
- Qualified Leads
- Lost Leads

### 3. buildCreateLeadQuery
Builds SQL query for creating a new lead.

**Returns**: `string` (SQL INSERT query with RETURNING clause)

**Security**: Escapes single quotes to prevent SQL injection

### 4. buildUpdateLeadQuery
Builds SQL query for updating an existing lead.

**Returns**: `string` (SQL UPDATE query with RETURNING clause)

**Security**: 
- Includes organization_id check for RLS
- Escapes single quotes to prevent SQL injection

### 5. buildDeleteLeadQuery
Builds SQL query for deleting a lead.

**Returns**: `string` (SQL DELETE query)

**Security**: Includes organization_id check for RLS

### 6. buildFetchMarketplacesQuery
Builds SQL query for fetching marketplaces.

**Returns**: `string` (SQL SELECT query)

## Usage Example (AI Agent)

```typescript
// Import the query builder
import { buildFetchLeadsQuery, SUPABASE_PROJECT_ID } from './leadsMcpService';

// Define parameters
const organizationId = 'your-org-uuid';
const filters = {
  searchText: 'John',
  status: ['new', 'qualified']
};
const sort = { column: 'created_at', direction: 'desc' };
const pagination = { page: 0, pageSize: 25 };

// Build queries
const { dataQuery, countQuery } = buildFetchLeadsQuery(
  organizationId,
  filters,
  sort,
  pagination
);

// Execute via MCP tool (only available to AI agents)
const dataResult = await mcp_supabase_execute_sql({
  project_id: SUPABASE_PROJECT_ID,
  query: dataQuery
});

const countResult = await mcp_supabase_execute_sql({
  project_id: SUPABASE_PROJECT_ID,
  query: countQuery
});

// Process results
const leads = dataResult;
const totalCount = countResult[0].total_count;
```

## Security Considerations

### 1. Organization ID Filtering
All queries include `organization_id` checks to ensure multi-tenancy and data isolation.

### 2. SQL Injection Prevention
The query builders escape single quotes in user input using the `escapeSql` helper function.

### 3. Row Level Security (RLS)
The database should have RLS policies enabled as an additional security layer.

### 4. Parameterization
While the queries use string interpolation for simplicity, production implementations should use parameterized queries when possible.

## Database Schema

### leads Table

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  bling_contact_id BIGINT UNIQUE,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  mobile_phone VARCHAR,
  document_type VARCHAR,
  document_number VARCHAR,
  company_name VARCHAR,
  trade_name VARCHAR,
  marketplace_id UUID REFERENCES marketplaces(id),
  lead_status VARCHAR DEFAULT 'new',
  lead_source VARCHAR,
  gender gender_type,
  gender_probability REAL,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  first_order_date TIMESTAMPTZ,
  last_order_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Address fields
  address_street VARCHAR,
  address_number VARCHAR,
  address_complement VARCHAR,
  address_neighborhood VARCHAR,
  address_city VARCHAR,
  address_state VARCHAR,
  address_zip VARCHAR,
  address_country VARCHAR DEFAULT 'Brasil',
  
  -- Additional fields
  ie VARCHAR,
  rg VARCHAR,
  bling_data JSONB
);
```

### Required Indexes

```sql
CREATE INDEX idx_leads_organization_id ON leads(organization_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_status ON leads(lead_status);
CREATE INDEX idx_leads_marketplace_id ON leads(marketplace_id);
CREATE INDEX idx_leads_org_created ON leads(organization_id, created_at DESC);
```

## Performance Considerations

### 1. Pagination
Always use pagination for large datasets to avoid performance issues and timeouts.

### 2. Indexes
Ensure the database has appropriate indexes on frequently queried columns.

### 3. Aggregations
The `fetchLeads` query includes aggregations (COUNT, SUM) which can be expensive. Consider:
- Caching results when appropriate
- Using materialized views for frequently accessed aggregations
- Limiting the number of rows processed

### 4. Query Optimization
- Use EXPLAIN ANALYZE to understand query performance
- Monitor slow queries and optimize as needed
- Consider denormalizing data for read-heavy operations

## Related Files

- `src/types/leads.ts` - TypeScript type definitions
- `src/services/leadsService.ts` - Standard Supabase client implementation (for application code)
- `src/hooks/useLeads.ts` - React Query hooks (for application code)
- `.kiro/specs/leads-table-management/` - Feature specification and design documents

## Task Reference

This service was created as part of:
- **Spec**: leads-table-management
- **Task**: Task 3 - Create Supabase MCP service functions
- **Sub-tasks**:
  - 3.1: Implement `fetchLeads` function using mcp_supabase_execute_sql
  - 3.2: Implement `fetchLeadKPIs` function using mcp_supabase_execute_sql
  - 3.3: Implement CRUD functions (createLead, updateLead, deleteLead)

## Future Enhancements

1. **Parameterized Queries**: Migrate to parameterized queries for better security
2. **Query Caching**: Implement query result caching for frequently accessed data
3. **Batch Operations**: Add support for bulk create/update/delete operations
4. **Advanced Filters**: Add more sophisticated filtering options (e.g., fuzzy search, range queries)
5. **Audit Logging**: Track all data modifications for compliance and debugging

## Support

For questions or issues related to this service:
1. Check the inline documentation in `leadsMcpService.ts`
2. Review the feature specification in `.kiro/specs/leads-table-management/`
3. Consult the Supabase MCP documentation
4. Ask an AI agent with MCP access for assistance
