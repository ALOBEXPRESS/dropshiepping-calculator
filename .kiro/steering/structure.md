---
inclusion: auto
---

# Estrutura do Projeto & Arquitetura

## Organização de Pastas

```
src/
├── components/          # Componentes React (camada View)
│   ├── calculator/      # Subcomponentes específicos da calculadora
│   ├── products-loaded/ # Componentes de listagem de produtos
│   └── ui/              # Primitivos de UI reutilizáveis (shadcn/ui)
├── hooks/               # Hooks React customizados (camada Controller)
├── services/            # Lógica de negócio & cálculos (camada Service)
│   └── calculators/     # Módulos de cálculo específicos por marketplace
├── types/               # Interfaces e tipos TypeScript
├── utils/               # Funções auxiliares (formatação, validação)
├── contexts/            # Providers de React Context
├── lib/                 # Configurações de bibliotecas externas
├── test/                # Arquivos de teste e setup
├── assets/              # Imagens e mídia estáticas
├── imgs/                # Imagens de produtos e UI
└── video/               # Assets de vídeo
```

## Padrões de Arquitetura

### Separação de Responsabilidades

O código segue uma arquitetura em camadas estrita:

1. **Camada View** (`components/`): Apresentação pura, recebe props e callbacks
2. **Camada Controller** (`hooks/`): Gerenciamento de estado e handlers de eventos
3. **Camada Service** (`services/`): Funções puras de lógica de negócio
4. **Camada Type** (`types/`): Interfaces e definições de tipos compartilhadas

### Princípios Fundamentais

- **SOLID**: Responsabilidade Única, Aberto/Fechado, Inversão de Dependência
- **DRY**: Componentes reutilizáveis extraídos como `CollapsibleSection`
- **KISS**: Funções e componentes simples e focados
- **YAGNI**: Sem over-engineering, construir apenas o necessário

### Estrutura de Componentes

- **Componentes Container**: `DropshippingCalculator.tsx` orquestra estado via hooks
- **Componentes Apresentacionais**: `GatewayConfig.tsx`, `TrafficConfig.tsx` recebem props
- **Primitivos de UI**: `button.tsx`, `input.tsx`, `card.tsx` são genéricos e reutilizáveis

## Convenções de Nomenclatura de Arquivos

- **Componentes**: PascalCase (ex: `DropshippingCalculator.tsx`)
- **Hooks**: camelCase com prefixo `use` (ex: `useDropshippingCalculator.ts`)
- **Services**: camelCase (ex: `pricingService.ts`)
- **Types**: camelCase (ex: `calculator.ts`)
- **Utils**: camelCase (ex: `currency.ts`)

## Regras de Organização de Código

### Gerenciamento de Estado

- Centralizar estado em hooks customizados para evitar prop drilling
- Usar `useMemo` para cálculos custosos
- Usar `useCallback` para event handlers passados para componentes filhos
- Evitar `useState` em componentes apresentacionais quando possível

### Segurança de Tipos

- Preferir `interface` ao invés de `type` para formas de objetos
- Evitar `any` - usar `unknown` e type guards
- Exportar tipos compartilhados do diretório `types/`
- Usar imports apenas de tipo: `import type { ... }`

### Funções de Service

- Manter services puros (sem efeitos colaterais)
- Aceitar todas as dependências como parâmetros
- Retornar objetos tipados, não primitivos quando múltiplos valores são necessários
- Exemplo: `calculateMetrics()` retorna interface `CalculationResult`

### Composição de Componentes

- Extrair padrões de UI repetidos em componentes reutilizáveis
- Usar composição ao invés de herança
- Manter componentes com menos de 300 linhas (dividir se maior)
- Co-localizar componentes relacionados em subdiretórios

## Ordem de Imports

1. Bibliotecas externas (React, third-party)
2. Aliases internos (`@/components`, `@/hooks`, etc.)
3. Imports relativos (`./`, `../`)
4. Imports apenas de tipo no final

## Estrutura de Testes

- Testes unitários: arquivos `*.test.ts` ao lado do código fonte
- Testes E2E: `src/test/*.spec.ts` usando Playwright
- Setup de testes: `src/test/setup.ts`
- Resultados de testes: diretório `test-results/`

## Arquivos Principais

- `App.tsx`: Componente raiz com roteamento
- `main.tsx`: Ponto de entrada da aplicação
- `DropshippingCalculator.tsx`: Container principal da calculadora
- `useDropshippingCalculator.ts`: Hook principal de gerenciamento de estado
- `pricingService.ts`: Lógica de negócio para cálculos
- `calculator.ts`: Definições de tipos compartilhadas
