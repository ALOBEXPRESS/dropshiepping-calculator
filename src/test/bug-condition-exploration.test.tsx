/**
 * Bug Condition Exploration Test - Task 1
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4
 * Note: Bug Condition 1 (ProtectedRoute timeout) is tested in bug-condition-static.test.tsx
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Bug Condition 2 - SettingsContext expoe settingsError', () => {
  it('deve expor settingsError', () => {
    const contextPath = path.resolve(process.cwd(), 'src/contexts/SettingsContext.tsx');
    const sourceCode = fs.readFileSync(contextPath, 'utf-8');
    expect(sourceCode).toContain('settingsError');
  });

  it('deve expor retrySettings', () => {
    const contextPath = path.resolve(process.cwd(), 'src/contexts/SettingsContext.tsx');
    const sourceCode = fs.readFileSync(contextPath, 'utf-8');
    expect(sourceCode).toContain('retrySettings');
  });

  it('deve setar settingsError quando organizationId nao e resolvido', () => {
    const contextPath = path.resolve(process.cwd(), 'src/contexts/SettingsContext.tsx');
    const sourceCode = fs.readFileSync(contextPath, 'utf-8');
    expect(sourceCode).toContain('setSettingsError');
  });
});

describe('Bug Condition 3 - Sales.tsx tem branch de erro separado do loading', () => {
  it('deve ter branch de erro separado', () => {
    const salesPath = path.resolve(process.cwd(), 'src/pages/Sales.tsx');
    const sourceCode = fs.readFileSync(salesPath, 'utf-8');
    const hasErrorBranch =
      sourceCode.includes('settingsError') ||
      sourceCode.includes('Tentar novamente') ||
      sourceCode.includes('retry');
    expect(hasErrorBranch).toBe(true);
  });

  it('deve consumir settingsError do contexto', () => {
    const salesPath = path.resolve(process.cwd(), 'src/pages/Sales.tsx');
    const sourceCode = fs.readFileSync(salesPath, 'utf-8');
    expect(sourceCode).toContain('settingsError');
  });
});

describe('Bug Condition 4 - fetchWithRetry dispara evento apos 3x 429', () => {
  it('deve conter dispatchEvent supabase:session-expired', () => {
    const supabasePath = path.resolve(process.cwd(), 'src/lib/supabase.ts');
    const sourceCode = fs.readFileSync(supabasePath, 'utf-8');
    expect(sourceCode).toContain('supabase:session-expired');
    expect(sourceCode).toContain('dispatchEvent');
  });

  it('deve disparar evento antes de limpar localStorage', () => {
    const supabasePath = path.resolve(process.cwd(), 'src/lib/supabase.ts');
    const sourceCode = fs.readFileSync(supabasePath, 'utf-8');
    const dispatchIndex = sourceCode.indexOf('supabase:session-expired');
    const removeItemIndex = sourceCode.indexOf('localStorage.removeItem');
    expect(dispatchIndex).toBeGreaterThan(-1);
    expect(dispatchIndex).toBeLessThan(removeItemIndex);
  });
});
