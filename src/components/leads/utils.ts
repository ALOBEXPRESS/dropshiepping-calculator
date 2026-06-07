/**
 * Utility functions for Leads Table Management feature
 */

import type { Lead, LeadStatus } from '@/types/leads';
import { STATUS_COLORS } from './constants';
import { 
  CircleDot, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  Users,
} from 'lucide-react';

/**
 * Get status icon component
 * @param status - Lead status
 * @returns React icon component
 */
export function getStatusIcon(status: LeadStatus | null | undefined) {
  if (!status) return CircleDot;
  
  const icons: Record<LeadStatus, typeof CircleDot> = {
    new: CircleDot,
    contacted: Phone,
    qualified: CheckCircle2,
    lost: XCircle,
    converted: TrendingUp,
    recurrent: Users,
  };
  
  return icons[status] || CircleDot;
}

/**
 * Format phone number to Brazilian format
 * @param phone - Raw phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return '-';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 11) {
    // Mobile: (XX) XXXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    // Landline: (XX) XXXX-XXXX
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

/**
 * Format date to Brazilian format
 * @param date - ISO date string
 * @returns Formatted date string
 */
export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  
  try {
    const d = new Date(date);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return '-';
  }
}

/**
 * Format currency to Brazilian Real
 * @param value - Numeric value
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Get status badge color classes
 * @param status - Lead status
 * @returns Tailwind CSS classes for badge
 */
export function getStatusColor(status: LeadStatus | null | undefined): string {
  if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
}

/**
 * Get status label in Portuguese
 * @param status - Lead status
 * @returns Translated status label
 */
export function getStatusLabel(status: LeadStatus | null | undefined): string {
  if (!status) return 'Sem status';
  
  const labels: Record<LeadStatus, string> = {
    new: 'Novo',
    contacted: 'Contatado',
    qualified: 'Qualificado',
    lost: 'Perdido',
    converted: 'Convertido',
    recurrent: 'Recorrente',
  };
  
  return labels[status] || status;
}

/**
 * Validate email format
 * @param email - Email string
 * @returns True if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate Brazilian phone number
 * @param phone - Phone number string
 * @returns True if valid phone format
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Validate CPF
 * @param cpf - CPF string
 * @returns True if valid CPF
 */
export function isValidCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false; // All same digits
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

/**
 * Validate CNPJ
 * @param cnpj - CNPJ string
 * @returns True if valid CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '');
  
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1+$/.test(cleaned)) return false; // All same digits
  
  // Validate first check digit
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (checkDigit !== parseInt(cleaned.charAt(12))) return false;
  
  // Validate second check digit
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  checkDigit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (checkDigit !== parseInt(cleaned.charAt(13))) return false;
  
  return true;
}

/**
 * Validate CPF or CNPJ based on document type
 * @param document - Document number
 * @param type - Document type ('cpf' or 'cnpj')
 * @returns True if valid document
 */
export function isValidDocument(document: string, type: 'cpf' | 'cnpj'): boolean {
  return type === 'cpf' ? isValidCPF(document) : isValidCNPJ(document);
}

/**
 * Generate CSV filename with organization name and date
 * @param organizationName - Organization name
 * @returns CSV filename
 */
export function generateCSVFilename(organizationName: string): string {
  const date = new Date().toISOString().split('T')[0];
  const sanitizedOrgName = organizationName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  return `leads-${sanitizedOrgName}-${date}.csv`;
}

/**
 * Convert leads data to CSV format
 * @param leads - Array of leads
 * @returns CSV string
 */
export function convertToCSV(leads: Lead[]): string {
  if (leads.length === 0) return '';
  
  // Define headers
  const headers = [
    'ID',
    'Nome',
    'Email',
    'Telefone',
    'Celular',
    'Empresa',
    'Nome Fantasia',
    'Tipo Documento',
    'Número Documento',
    'Canal',
    'Status',
    'Origem',
    'Gênero',
    'Total Pedidos',
    'Total Gasto',
    'Primeiro Pedido',
    'Último Pedido',
    'Data Criação',
    'Data Atualização',
  ];
  
  // Build CSV rows
  const rows = leads.map(lead => [
    lead.id,
    lead.name,
    lead.email || '',
    lead.phone || '',
    lead.mobile_phone || '',
    lead.company_name || '',
    lead.trade_name || '',
    lead.document_type || '',
    lead.document_number || '',
    lead.marketplace_name || '',
    getStatusLabel(lead.lead_status),
    lead.lead_source || '',
    lead.gender === 'male' ? 'Masculino' : lead.gender === 'female' ? 'Feminino' : '',
    lead.total_orders?.toString() || '0',
    lead.total_spent?.toString() || '0',
    formatDate(lead.first_order_date),
    formatDate(lead.last_order_date),
    formatDate(lead.created_at),
    formatDate(lead.updated_at),
  ]);
  
  // Combine headers and rows with semicolon delimiter
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(';')),
  ].join('\n');
  
  // Add UTF-8 BOM for Excel compatibility
  return '\uFEFF' + csvContent;
}

/**
 * Download CSV file
 * @param csvContent - CSV string content
 * @param filename - Filename for download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
