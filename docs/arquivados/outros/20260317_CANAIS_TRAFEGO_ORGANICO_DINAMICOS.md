# Canais de Tráfego Orgânico Dinâmicos

## Resumo
Atualização do componente de tráfego orgânico na calculadora para buscar os canais disponíveis do banco de dados ao invés de usar valores hardcoded.

## Data
2026-02-23

## Problema
Os canais de tráfego orgânico estavam hardcoded no componente `TrafficConfig.tsx`, dificultando a manutenção e adição de novos canais.

## Solução Implementada

### 1. Nova Tabela no Banco de Dados
Criada tabela `organic_traffic_channels` com os seguintes campos:
- `id`: UUID (chave primária)
- `key`: TEXT (identificador único, ex: 'youtube_shorts')
- `label`: TEXT (nome exibido, ex: 'Youtube Shorts')
- `is_active`: BOOLEAN (se o canal está ativo)
- `display_order`: INTEGER (ordem de exibição)
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

### 2. Canais Inseridos
Os seguintes canais foram inseridos na tabela:
1. Youtube Shorts
2. Kaway Video
3. Tiktok
4. Instagram Reels
5. WhatsApp
6. Grupo Facebook
7. Shopee Vídeo

### 3. Hook Customizado
Criado `useOrganicChannels.ts` que:
- Busca os canais ativos do banco de dados
- Ordena por `display_order`
- Fornece fallback para canais hardcoded em caso de erro
- Retorna estado de loading e error

### 4. Atualização do Componente
O componente `TrafficConfig.tsx` foi atualizado para:
- Importar e usar o hook `useOrganicChannels`
- Remover o array hardcoded de canais
- Usar os canais dinâmicos do banco de dados

## Arquivos Modificados
- `supabase/migrations/20260223_create_organic_traffic_channels.sql` (novo)
- `src/hooks/useOrganicChannels.ts` (novo)
- `src/components/calculator/TrafficConfig.tsx` (modificado)

## Benefícios
1. Facilita adição/remoção de canais sem alterar código
2. Permite ativar/desativar canais dinamicamente
3. Controle de ordem de exibição via banco de dados
4. Mantém compatibilidade com produtos existentes

## Próximos Passos
- Considerar criar interface administrativa para gerenciar canais
- Adicionar suporte para ícones personalizados por canal
- Implementar cache para melhorar performance

## Notas Técnicas
- A tabela usa RLS (Row Level Security) herdado das configurações do projeto
- O hook tem fallback automático em caso de erro de conexão
- Compatível com produtos salvos anteriormente que usam as mesmas keys
