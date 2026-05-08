/**
 * CSV Export Utility
 * 
 * Provides functions for exporting leads data to CSV format.
 * Uses semicolon delimiter and UTF-8 with BOM encoding for Excel compatibility.
 * 
 * Requirements: 9.2, 9.3, 9.4, 9.5, 9.6
 */

import type { Lead } from '@/types/leads';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * CSV Export Options
 */
export interface CSVExportOptions {
  filename?: string;
  delimiter?: string;
  includeHeaders?: boolean;
}

/**
 * Default CSV export options
 */
const DEFAULT_OPTIONS: Required<CSVExportOptions> = {
  filename: 'leads-export.csv',
  delimiter: ';',
  includeHeaders: true,
};

/**
 * Escape CSV field value
 * Handles quotes, newlines, and delimiter characters
 */
function escapeCSVField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // If field contains delimiter, quotes, or newlines, wrap in quotes and escape internal quotes
  if (
    stringValue.includes(';') ||
    stringValue.includes('"') ||
    stringValue.includes('\n') ||
    stringValue.includes('\r')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Format date for CSV export
 */
function formatDateForCSV(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: ptBR });
  } catch (error) {
    return '';
  }
}

/**
 * Format currency for CSV export
 */
function formatCurrencyForCSV(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  
  // Use comma as decimal separator (Brazilian format)
  return value.toFixed(2).replace('.', ',');
}

/**
 * Get status label in Portuguese
 */
function getStatusLabel(status: string | null | undefined): string {
  const statusMap: Record<string, string> = {
    new: 'Novo',
    contacted: 'Contatado',
    qualified: 'Qualificado',
    lost: 'Perdido',
    converted: 'Convertido',
  };

  return status ? statusMap[status] || status : '';
}

/**
 * Get gender label in Portuguese
 */
function getGenderLabel(gender: string | null | undefined): string {
  const genderMap: Record<string, string> = {
    male: 'Masculino',
    female: 'Feminino',
  };

  return gender ? genderMap[gender] || gender : '';
}

/**
 * Get document type label in Portuguese
 */
function getDocumentTypeLabel(type: string | null | undefined): string {
  const typeMap: Record<string, string> = {
    cpf: 'CPF',
    cnpj: 'CNPJ',
  };

  return type ? typeMap[type] || type : '';
}

/**
 * Format full address from lead data
 */
function formatAddress(lead: Lead): string {
  const parts = [
    lead.address_street,
    lead.address_number,
    lead.address_complement,
    lead.address_neighborhood,
    lead.address_city,
    lead.address_state,
    lead.address_zip,
  ].filter(Boolean);

  return parts.join(', ');
}

/**
 * Convert leads array to CSV string
 * 
 * @param leads - Array of lead objects to export
 * @param options - CSV export options
 * @returns CSV string with UTF-8 BOM
 */
export function leadsToCSV(
  leads: Lead[],
  options: CSVExportOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Define CSV columns
  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefone' },
    { key: 'mobile_phone', label: 'Celular' },
    { key: 'document_type', label: 'Tipo de Documento' },
    { key: 'document_number', label: 'Número do Documento' },
    { key: 'company_name', label: 'Empresa' },
    { key: 'trade_name', label: 'Nome Fantasia' },
    { key: 'address', label: 'Endereço Completo' },
    { key: 'marketplace_name', label: 'Canal' },
    { key: 'lead_status', label: 'Status' },
    { key: 'lead_source', label: 'Origem' },
    { key: 'gender', label: 'Gênero' },
    { key: 'gender_probability', label: 'Probabilidade de Gênero' },
    { key: 'total_orders', label: 'Total de Pedidos' },
    { key: 'total_spent', label: 'Valor Total Gasto' },
    { key: 'first_order_date', label: 'Data do Primeiro Pedido' },
    { key: 'last_order_date', label: 'Data do Último Pedido' },
    { key: 'created_at', label: 'Data de Criação' },
    { key: 'updated_at', label: 'Data de Atualização' },
  ];

  const rows: string[] = [];

  // Add header row
  if (opts.includeHeaders) {
    const headerRow = columns
      .map(col => escapeCSVField(col.label))
      .join(opts.delimiter);
    rows.push(headerRow);
  }

  // Add data rows
  for (const lead of leads) {
    const row = columns.map(col => {
      switch (col.key) {
        case 'address':
          return escapeCSVField(formatAddress(lead));
        
        case 'lead_status':
          return escapeCSVField(getStatusLabel(lead.lead_status));
        
        case 'gender':
          return escapeCSVField(getGenderLabel(lead.gender));
        
        case 'document_type':
          return escapeCSVField(getDocumentTypeLabel(lead.document_type));
        
        case 'gender_probability':
          return escapeCSVField(
            lead.gender_probability 
              ? `${(lead.gender_probability * 100).toFixed(1)}%` 
              : ''
          );
        
        case 'total_spent':
          return escapeCSVField(formatCurrencyForCSV(lead.total_spent));
        
        case 'total_orders':
          return escapeCSVField(lead.total_orders || 0);
        
        case 'created_at':
        case 'updated_at':
        case 'first_order_date':
        case 'last_order_date':
          return escapeCSVField(formatDateForCSV(lead[col.key as keyof Lead] as string));
        
        default:
          return escapeCSVField(lead[col.key as keyof Lead]);
      }
    }).join(opts.delimiter);

    rows.push(row);
  }

  // Join all rows with newlines
  const csvContent = rows.join('\n');

  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  return BOM + csvContent;
}

/**
 * Generate filename for CSV export
 * Format: leads-{organizationName}-{date}.csv
 * 
 * @param organizationName - Name of the organization (optional)
 * @returns Formatted filename
 */
export function generateCSVFilename(organizationName?: string): string {
  const date = format(new Date(), 'yyyy-MM-dd', { locale: ptBR });
  
  if (organizationName) {
    // Sanitize organization name for filename
    const sanitized = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `leads-${sanitized}-${date}.csv`;
  }

  return `leads-${date}.csv`;
}

/**
 * Download CSV file to user's computer
 * 
 * @param csvContent - CSV string content
 * @param filename - Name of the file to download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Create blob with UTF-8 encoding
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export leads to CSV and trigger download
 * Main function to be called from components
 * 
 * @param leads - Array of leads to export
 * @param organizationName - Name of the organization (optional)
 * @returns Promise that resolves when export is complete
 */
export async function exportLeadsToCSV(
  leads: Lead[],
  organizationName?: string
): Promise<void> {
  // Handle empty results case
  if (leads.length === 0) {
    throw new Error('Não há dados para exportar');
  }

  // Generate CSV content
  const csvContent = leadsToCSV(leads);
  
  // Generate filename
  const filename = generateCSVFilename(organizationName);
  
  // Trigger download
  downloadCSV(csvContent, filename);
}
