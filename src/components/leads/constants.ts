/**
 * Constants for Leads Table Management feature
 */

import type { LeadStatus, LeadTableColumn } from '@/types/leads';

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

/**
 * Query cache settings
 */
export const LEADS_CACHE_TIME = 5 * 60 * 1000; // 5 minutes
export const LEADS_STALE_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Debounce delay for search input (ms)
 */
export const SEARCH_DEBOUNCE_DELAY = 300;

/**
 * Virtualization threshold
 * Number of rows before virtualization kicks in
 */
export const VIRTUALIZATION_THRESHOLD = 100;

/**
 * Lead status options for filters
 */
export const LEAD_STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'Novo' },
  { value: 'contacted', label: 'Contatado' },
  { value: 'qualified', label: 'Qualificado' },
  { value: 'lost', label: 'Perdido' },
  { value: 'converted', label: 'Convertido' },
];

/**
 * Gender options for filters
 */
export const GENDER_OPTIONS: { value: 'male' | 'female' | null; label: string }[] = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Feminino' },
  { value: null, label: 'Não classificado' },
];

/**
 * Date range preset options
 */
export const DATE_RANGE_PRESETS = [
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 30 dias', days: 30 },
  { label: 'Últimos 90 dias', days: 90 },
  { label: 'Todo período', days: null },
];

/**
 * Table column definitions
 */
export const LEAD_TABLE_COLUMNS: LeadTableColumn[] = [
  { key: 'select', label: '', sortable: false, width: '50px', align: 'center' },
  { key: 'index', label: '#', sortable: false, width: '60px', align: 'center' },
  { key: 'name', label: 'Nome', sortable: true, width: '200px' },
  { key: 'email', label: 'Email', sortable: true, width: '200px' },
  { key: 'phone', label: 'Telefone', sortable: false, width: '150px' },
  { key: 'company_name', label: 'Empresa', sortable: true, width: '180px' },
  { key: 'marketplace_name', label: 'Canal', sortable: true, width: '150px' },
  { key: 'lead_status', label: 'Status', sortable: true, width: '120px' },
  { key: 'created_at', label: 'Data de Criação', sortable: true, width: '150px' },
  { key: 'actions', label: 'Ações', sortable: false, width: '100px', align: 'center' },
];

/**
 * Status badge color mapping
 */
export const STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  contacted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  qualified: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  converted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  FETCH_FAILED: 'Não foi possível carregar os leads. Tente novamente.',
  CREATE_FAILED: 'Erro ao criar lead. Verifique os dados e tente novamente.',
  UPDATE_FAILED: 'Erro ao atualizar lead. Tente novamente.',
  DELETE_FAILED: 'Erro ao deletar lead. Tente novamente.',
  VALIDATION_FAILED: 'Dados inválidos. Verifique os campos destacados.',
  PERMISSION_DENIED: 'Você não tem permissão para realizar esta ação.',
  EXPORT_FAILED: 'Erro ao exportar dados. Tente novamente.',
  NO_DATA_TO_EXPORT: 'Não há dados para exportar.',
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  CREATE_SUCCESS: 'Lead criado com sucesso!',
  UPDATE_SUCCESS: 'Lead atualizado com sucesso!',
  DELETE_SUCCESS: 'Lead deletado com sucesso!',
  EXPORT_SUCCESS: 'Dados exportados com sucesso!',
};
