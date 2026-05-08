/**
 * Error Messages Utility Tests
 * 
 * Tests for error message handling functions.
 * 
 * Requirements: 1.7, 6.9, 7.7, 8.6
 */

import { describe, it, expect } from 'vitest';
import {
  getErrorMessage,
  isNetworkError,
  isPermissionError,
  isValidationError,
  LEADS_ERROR_MESSAGES,
} from './errorMessages';

describe('getErrorMessage', () => {
  it('should return network error message for fetch errors', () => {
    const error = new TypeError('Failed to fetch');
    expect(getErrorMessage(error, 'fetch')).toBe(LEADS_ERROR_MESSAGES.NETWORK_ERROR);
  });

  it('should return timeout error message for timeout errors', () => {
    const error = new Error('Request timeout');
    expect(getErrorMessage(error, 'fetch')).toBe(LEADS_ERROR_MESSAGES.TIMEOUT_ERROR);
  });

  it('should return permission denied for 401 status', () => {
    const error = { status: 401 };
    expect(getErrorMessage(error, 'fetch')).toBe(LEADS_ERROR_MESSAGES.PERMISSION_DENIED);
  });

  it('should return permission denied for 403 status', () => {
    const error = { status: 403 };
    expect(getErrorMessage(error, 'update')).toBe(LEADS_ERROR_MESSAGES.PERMISSION_DENIED);
  });

  it('should return not found message for 404 on update', () => {
    const error = { status: 404 };
    expect(getErrorMessage(error, 'update')).toBe(LEADS_ERROR_MESSAGES.UPDATE_NOT_FOUND);
  });

  it('should return not found message for 404 on delete', () => {
    const error = { status: 404 };
    expect(getErrorMessage(error, 'delete')).toBe(LEADS_ERROR_MESSAGES.DELETE_NOT_FOUND);
  });

  it('should return validation error for 422 on create', () => {
    const error = { status: 422 };
    expect(getErrorMessage(error, 'create')).toBe(LEADS_ERROR_MESSAGES.CREATE_VALIDATION_FAILED);
  });

  it('should return validation error for 422 on update', () => {
    const error = { status: 422 };
    expect(getErrorMessage(error, 'update')).toBe(LEADS_ERROR_MESSAGES.UPDATE_VALIDATION_FAILED);
  });

  it('should return default fetch error for unknown fetch errors', () => {
    const error = new Error('Unknown error');
    expect(getErrorMessage(error, 'fetch')).toBe(LEADS_ERROR_MESSAGES.FETCH_FAILED);
  });

  it('should return default create error for unknown create errors', () => {
    const error = new Error('Unknown error');
    expect(getErrorMessage(error, 'create')).toBe(LEADS_ERROR_MESSAGES.CREATE_FAILED);
  });

  it('should return default update error for unknown update errors', () => {
    const error = new Error('Unknown error');
    expect(getErrorMessage(error, 'update')).toBe(LEADS_ERROR_MESSAGES.UPDATE_FAILED);
  });

  it('should return default delete error for unknown delete errors', () => {
    const error = new Error('Unknown error');
    expect(getErrorMessage(error, 'delete')).toBe(LEADS_ERROR_MESSAGES.DELETE_FAILED);
  });

  it('should return KPIs error for fetch_kpis operation', () => {
    const error = new Error('Unknown error');
    expect(getErrorMessage(error, 'fetch_kpis')).toBe(LEADS_ERROR_MESSAGES.FETCH_KPIS_FAILED);
  });

  it('should return marketplaces error for fetch_marketplaces operation', () => {
    const error = new Error('Unknown error');
    expect(getErrorMessage(error, 'fetch_marketplaces')).toBe(LEADS_ERROR_MESSAGES.FETCH_MARKETPLACES_FAILED);
  });
});

describe('isNetworkError', () => {
  it('should return true for fetch TypeError', () => {
    const error = new TypeError('Failed to fetch');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should return false for other errors', () => {
    const error = new Error('Some error');
    expect(isNetworkError(error)).toBe(false);
  });

  it('should return false for non-Error objects', () => {
    const error = { status: 500 };
    expect(isNetworkError(error)).toBe(false);
  });
});

describe('isPermissionError', () => {
  it('should return true for 401 status', () => {
    const error = { status: 401 };
    expect(isPermissionError(error)).toBe(true);
  });

  it('should return true for 403 status', () => {
    const error = { status: 403 };
    expect(isPermissionError(error)).toBe(true);
  });

  it('should return false for other status codes', () => {
    const error = { status: 404 };
    expect(isPermissionError(error)).toBe(false);
  });

  it('should return false for non-status errors', () => {
    const error = new Error('Some error');
    expect(isPermissionError(error)).toBe(false);
  });
});

describe('isValidationError', () => {
  it('should return true for 422 status', () => {
    const error = { status: 422 };
    expect(isValidationError(error)).toBe(true);
  });

  it('should return true for validation Error', () => {
    const error = new Error('validation failed');
    expect(isValidationError(error)).toBe(true);
  });

  it('should return false for other status codes', () => {
    const error = { status: 404 };
    expect(isValidationError(error)).toBe(false);
  });

  it('should return false for non-validation errors', () => {
    const error = new Error('Some error');
    expect(isValidationError(error)).toBe(false);
  });
});
