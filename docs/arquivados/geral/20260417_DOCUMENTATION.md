# 📘 Documentação do Projeto: Dropshipping Calculator

## 1. Visão Geral do Projeto

O **Dropshipping Calculator** é uma aplicação web desenvolvida para auxiliar empreendedores e vendedores de e-commerce na precificação correta de produtos, cálculo de margens de lucro e análise de custos operacionais.

### 🎯 Objetivos
- Fornecer cálculos precisos de precificação considerando taxas de marketplaces (Mercado Livre, Shopee, etc.).
- Simular custos de gateways de pagamento com opções flexíveis (taxas fixas e percentuais).
- Analisar a viabilidade de tráfego pago vs. orgânico.
- Garantir que o vendedor mantenha margens de lucro saudáveis.

### 👥 Público-Alvo
- Vendedores de Dropshipping.
- Lojistas em Marketplaces (Mercado Livre, Shopee, TikTok).
- Empreendedores digitais que utilizam tráfego pago.

---

## 2. Requisitos Técnicos

Para executar e desenvolver este projeto, o ambiente deve atender aos seguintes requisitos:

### 🛠️ Ambiente
- **Node.js**: Versão 18.0.0 ou superior.
- **Gerenciador de Pacotes**: [pnpm](https://pnpm.io/) (recomendado) ou npm/yarn.
- **Sistema Operacional**: Windows, macOS ou Linux.

### 📚 Stack Tecnológica
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/) (v5.9+)
- **Framework UI**: [React](https://react.dev/) (v19)
- **Build Tool**: [Vite](https://vitejs.dev/) (v7)
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) (v3.4)
- **Componentes**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Animações**: [GSAP](https://gsap.com/)
- **Testes**: [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/)

---

## 3. Estrutura do Projeto

A arquitetura do projeto segue uma organização modular baseada em funcionalidades e responsabilidades.

```
dropshipping-calculator-app/
├── public/              # Arquivos estáticos (imagens, ícones)
├── src/
│   ├── components/      # Componentes React
│   │   ├── calculator/  # Sub-componentes da calculadora (Gateway, Tráfego, etc.)
│   │   ├── ui/          # Componentes de UI reutilizáveis (Botões, Inputs)
│   │   └── ...
│   ├── hooks/           # Hooks personalizados (ex: useDropshippingCalculator.ts)
│   ├── services/        # Lógica de negócios e cálculos (pricingService.ts)
│   ├── utils/           # Funções utilitárias e formatadores
│   ├── types/           # Definições de tipos TypeScript
│   ├── test/            # Testes de integração e unitários
│   ├── App.tsx          # Componente raiz
│   └── main.tsx         # Ponto de entrada da aplicação
├── package.json         # Dependências e scripts
├── vite.config.ts       # Configuração do Vite
└── tsconfig.json        # Configuração do TypeScript
```

### 🧠 Fluxo Principal
1. **Entrada de Dados**: O usuário insere custos, markup desejado e configurações de plataforma.
2. **Processamento**: O hook `useDropshippingCalculator` gerencia o estado e invoca o `pricingService`.
3. **Cálculo**: O `pricingService` aplica as taxas de marketplace, gateway e impostos.
4. **Saída**: O `DropshippingCalculator.tsx` exibe os resultados, margens e sugestões de preço.

---

## 4. Guia de Instalação

Siga os passos abaixo para configurar o ambiente de desenvolvimento localmente.

1. **Clonar o Repositório**
   ```bash
   git clone <url-do-repositorio>
   cd dropshipping-calculator-app
   ```

2. **Instalar Dependências**
   Utilize o `pnpm` para uma instalação rápida e eficiente.
   ```bash
   pnpm install
   ```

3. **Verificar Instalação**
   Certifique-se de que não houve erros durante a instalação dos pacotes.

---

## 5. Guia de Uso

### 🚀 Executando em Desenvolvimento
Para iniciar o servidor local com Hot Module Replacement (HMR):
```bash
pnpm dev
```
O aplicativo estará disponível em `http://localhost:5173` (ou porta similar).

### 🏗️ Build para Produção
Para gerar os arquivos otimizados para deploy:
```bash
pnpm build
```
Os arquivos serão gerados na pasta `dist/`.

### 🧪 Executando Testes
Para rodar a suíte de testes unitários:
```bash
pnpm test
```

### 💡 Funcionalidades Principais

#### Configuração de Gateway
- **Bancos Suportados**: PicPay, Nubank, Mercado Pago, PayPal, Stripe, Bradesco.
- **Tipos de Taxa**: Permite alternar entre taxa percentual (`%`) e fixa (`R$`).
- **Lógica Inteligente**: O sistema ajusta automaticamente as taxas padrão com base no banco selecionado (ex: PicPay PIX = 0%).

#### Precificação e Margem
- Insira o **Preço de Custo** e o **Markup**.
- O sistema calcula o **Preço de Venda Sugerido**.
- Indicadores visuais mostram se a margem é **Negativa**, **Baixa** ou **Excelente**.

#### Tráfego
- **Pago**: Adicione custos de CPC e orçamento diário.
- **Orgânico**: Estime custos de produção de conteúdo.

---

## 6. Contribuição

Contribuições são bem-vindas! Siga estas diretrizes para manter a qualidade do código.

### Padrões de Código
- **Linting**: O projeto utiliza ESLint. Execute `pnpm lint` antes de submeter alterações.
- **Commits**: Utilize mensagens claras e descritivas.
- **Componentes**: Mantenha componentes pequenos e focados (Princípio de Responsabilidade Única).

### Processo de Pull Request
1. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`).
2. Implemente as alterações e adicione testes se necessário.
3. Valide com `pnpm test` e `pnpm lint`.
4. Faça o push e abra um Pull Request detalhando as mudanças.

---

## 7. FAQ

**P: Por que minha margem está negativa?**
R: Verifique se os custos fixos (frete, embalagem) ou taxas de gateway não estão muito altos em relação ao preço de venda. Ajuste o Markup.

**P: Como altero a taxa padrão do PicPay?**
R: Na seção "Configuração de Pagamento", você pode sobrescrever a taxa percentual ou fixa manualmente, ou alternar o tipo de cobrança.

**P: O build falhou com erro de TypeScript.**
R: Execute `pnpm build` localmente para ver os erros detalhados. Geralmente são tipos ausentes ou propriedades incorretas em componentes.

---

## 8. Roadmap

Funcionalidades planejadas para as próximas versões:

- [ ] **Integração com IA**: Sugestões de copy e análise de concorrentes via API (Gemini/OpenAI).
- [ ] **Novos Marketplaces**: Adicionar suporte nativo para Amazon e Magalu.
- [ ] **Dashboard de Histórico**: Salvar simulações anteriores localmente.
- [ ] **Exportação**: Gerar PDF ou Excel com o detalhamento de custos.
- [ ] **Tema Escuro**: Aprimorar o suporte a dark mode em todos os componentes.

---

*Documentação atualizada em: Janeiro de 2026*
