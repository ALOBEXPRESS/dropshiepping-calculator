/**
 * Error Messages Utility
 * 
 * Centralized error messages for user-friendly error handling.
 * 
 * Requirements: 1.7, 6.9, 7.7, 8.6
 */

/**
 * Error message constants for leads table operations
 */
export const LEADS_ERROR_MESSAGES = {
  // Fetch errors
  FETCH_FAILED: 'Não foi possível carregar os leads. Tente novamente.',
  FETCH_KPIS_FAILED: 'Não foi possível carregar as métricas. Tente novamente.',
  FETCH_MARKETPLACES_FAILED: 'Não foi possível carregar os canais. Tente novamente.',
  
  // Create errors
  CREATE_FAILED: 'Erro ao criar lead. Verifique os dados e tente novamente.',
  CREATE_VALIDATION_FAILED: 'Dados inválidos. Verifique os campos destacados.',
  
  // Update errors
  UPDATE_FAILED: 'Erro ao atualizar lead. Tente novamente.',
  UPDATE_VALIDATION_FAILED: 'Dados inválidos. Verifique os campos destacados.',
  UPDATE_NOT_FOUND: 'Lead não encontrado. Ele pode ter sido deletado.',
  
  // Delete errors
  DELETE_FAILED: 'Erro ao deletar lead. Tente novamente.',
  DELETE_NOT_FOUND: 'Lead não encontrado. Ele pode já ter sido deletado.',
  
  // Permission errors
  PERMISSION_DENIED: 'Você não tem permissão para realizar esta ação.',
  
  // Network errors
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet e tente novamente.',
  TIMEOUT_ERROR: 'A operação demorou muito. Tente novamente.',
  
  // Generic errors
  UNKNOWN_ERROR: 'Ocorreu um erro inesperado. Tente novamente.',
} as const;

/**
 * Get user-friendly error message from error object
 * 
 * @param error - Error object from API or React Query
 * @param operation - Type of operation that failed
 * @returns User-friendly error message
 */
export function getErrorMessage(
  error: unknown,
  operation: 'fetch' | 'create' | 'update' | 'delete' | 'fetch_kpis' | 'fetch_marketplaces'
): string {
  // Handle network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return LEADS_ERROR_MESSAGES.NETWORK_ERROR;
  }

  // Handle timeout errors
  if (error instanceof Error && error.message.includes('timeout')) {
    return LEADS_ERROR_MESSAGES.TIMEOUT_ERROR;
  }

  // Handle API errors with status codes
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    
    switch (status) {
      case 401:
      case 403:
        return LEADS_ERROR_MESSAGES.PERMISSION_DENIED;
      case 404:
        if (operation === 'update') return LEADS_ERROR_MESSAGES.UPDATE_NOT_FOUND;
        if (operation === 'delete') return LEADS_ERROR_MESSAGES.DELETE_NOT_FOUND;
        break;
      case 422:
        if (operation === 'create') return LEADS_ERROR_MESSAGES.CREATE_VALIDATION_FAILED;
        if (operation === 'update') return LEADS_ERROR_MESSAGES.UPDATE_VALIDATION_FAILED;
        break;
    }
  }

  // Handle validation errors
  if (error instanceof Error && error.message.includes('validation')) {
    if (operation === 'create') return LEADS_ERROR_MESSAGES.CREATE_VALIDATION_FAILED;
    if (operation === 'update') return LEADS_ERROR_MESSAGES.UPDATE_VALIDATION_FAILED;
  }

  // Default error messages by operation
  switch (operation) {
    case 'fetch':
      return LEADS_ERROR_MESSAGES.FETCH_FAILED;
    case 'fetch_kpis':
      return LEADS_ERROR_MESSAGES.FETCH_KPIS_FAILED;
    case 'fetch_marketplaces':
      return LEADS_ERROR_MESSAGES.FETCH_MARKETPLACES_FAILED;
    case 'create':
      return LEADS_ERROR_MESSAGES.CREATE_FAILED;
    case 'update':
      return LEADS_ERROR_MESSAGES.UPDATE_FAILED;
    case 'delete':
      return LEADS_ERROR_MESSAGES.DELETE_FAILED;
    default:
      return LEADS_ERROR_MESSAGES.UNKNOWN_ERROR;
  }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes('fetch');
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status === 401 || status === 403;
  }
  return false;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    return status === 422;
  }
  if (error instanceof Error) {
    return error.message.includes('validation');
  }
  return false;
}
