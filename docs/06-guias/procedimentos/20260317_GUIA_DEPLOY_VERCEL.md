# Guia de Deploy no Vercel

## Pré-requisitos

- Conta no Vercel (https://vercel.com)
- Repositório Git conectado ao Vercel
- Variáveis de ambiente configuradas

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis no painel do Vercel (Settings > Environment Variables):

```
VITE_SUPABASE_URL=https://oensqhjnxwpcuanozske.supabase.co
VITE_SUPABASE_ANON_KEY=<sua_chave_anon>
```

## Configuração do Build

O Vercel detecta automaticamente projetos Vite. As configurações padrão são:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Deploy

### Via Git (Recomendado)

1. Faça push das alterações para o repositório:
   ```bash
   git push origin main
   ```

2. O Vercel fará o deploy automaticamente

### Via CLI

```bash
# Instalar Vercel CLI (se necessário)
npm i -g vercel

# Deploy
vercel --prod
```

## Verificações Pós-Deploy

- [ ] Página inicial carrega corretamente
- [ ] Login funciona
- [ ] Página de Vendas exibe dados
- [ ] Gráfico de receita renderiza
- [ ] Tooltip mostra produtos e valores
- [ ] Botão "Excluir Métrica" funciona
- [ ] Modal de confirmação abre
- [ ] Exclusão de pedido funciona

## Troubleshooting

### Erro 404 em rotas

O arquivo `vercel.json` já está configurado para redirecionar todas as rotas para `index.html` (SPA routing).

### Variáveis de ambiente não carregam

Certifique-se de que as variáveis começam com `VITE_` e foram configuradas no painel do Vercel.

### Build falha

Execute localmente para verificar erros:
```bash
npm run build
```

## Status Atual

✅ Build passa sem erros
✅ Lint passa (apenas 1 warning aceitável)
✅ TypeScript compila corretamente
✅ vercel.json configurado
✅ Correções aplicadas no tooltip e botão de excluir
