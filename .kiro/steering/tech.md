---
inclusion: auto
---

# Stack Tecnológica

## Tecnologias Principais

- **Linguagem**: TypeScript 5.9+
- **Framework**: React 19.2
- **Ferramenta de Build**: Vite 7.2
- **Gerenciador de Pacotes**: pnpm (preferido), npm/yarn suportados
- **Versão do Node**: 18.0.0+

## UI & Estilização

- **Framework CSS**: Tailwind CSS 3.4
- **Biblioteca de Componentes**: shadcn/ui (primitivos Radix UI)
- **Ícones**: lucide-react
- **Animações**: GSAP 3.14
- **Fontes**: Oxanium (primária), Iceland, Inter

## Backend & Dados

- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Gerenciamento de Estado**: React Hooks (useState, useMemo, useCallback)
- **Roteamento**: react-router-dom 7.13

## Testes

- **Testes Unitários**: Vitest 4.0
- **Testes E2E**: Playwright 1.57
- **Ambiente de Teste**: jsdom

## Ferramentas de Desenvolvimento

- **Linter**: ESLint 9 com TypeScript ESLint
- **Verificação de Tipos**: TypeScript modo strict
- **Servidor Dev**: Vite (porta 5173, host 127.0.0.1)

## Comandos Comuns

```bash
# Desenvolvimento
pnpm dev              # Inicia servidor dev em localhost:5173
pnpm dev-delayed      # Inicia com inicialização atrasada

# Build & Preview
pnpm build            # Compilação TypeScript + build Vite
pnpm preview          # Preview do build de produção localmente

# Verificações de Qualidade
pnpm lint             # Executa ESLint
pnpm test             # Executa testes unitários Vitest

# Testes
npx playwright test   # Executa testes E2E
```

## Aliases de Caminho

O projeto usa `@/` como alias para `./src/`:
- `@/components` → `src/components`
- `@/hooks` → `src/hooks`
- `@/lib` → `src/lib`
- `@/services` → `src/services`
- `@/types` → `src/types`
- `@/utils` → `src/utils`

## Configuração de Ambiente

- Nenhuma variável de ambiente obrigatória para operação básica (apenas client-side)
- Arquivo `.env` usado para credenciais Supabase (opcional para dev local)
- `NODE_ENV` definido automaticamente pelo Vite (development/production)

## Saída do Build

- Builds de produção vão para o diretório `dist/`
- Assets são minificados e versionados
- SPA estático pronto para deploy em Vercel, Netlify ou plataformas similares
