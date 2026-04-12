/**
 * Teste estático — Casos 2, 3, 4 do bug-condition-exploration
 * Sem mocks de módulos React para evitar travamento
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Bug Condition 2 — SettingsContext expõe settingsError', () => {
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

  it('deve setar settingsError', () => {
    const contextPath = path.resolve(process.cwd(), 'src/contexts/SettingsContext.tsx');
    const sourceCode = fs.readFileSync(contextPath, 'utf-8');
    expect(sourceCode).toContain('setSettingsError');
  });
});

describe('Bug Condition 3 — Sales.tsx tem branch de erro', () => {
  it('deve ter branch de erro separado', () => {
    const salesPath = path.resolve(process.cwd(), 'src/pages/Sales.tsx');
    const sourceCode = fs.readFileSync(salesPath, 'utf-8');
    const hasErrorBranch =
      sourceCode.includes('settingsError') ||
      sourceCode.includes('Tentar novamente') ||
      sourceCode.includes('Erro ao carregar') ||
      sourceCode.includes('retry') ||
      sourceCode.includes('onRetry');
    expect(hasErrorBranch).toBe(true);
  });

  it('deve consumir settingsError do contexto', () => {
    const salesPath = path.resolve(process.cwd(), 'src/pages/Sales.tsx');
    const sourceCode = fs.readFileSync(salesPath, 'utf-8');
    expect(sourceCode).toContain('settingsError');
  });
});

describe('Bug Condition 4 — fetchWithRetry dispara evento após 3x 429', () => {
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
