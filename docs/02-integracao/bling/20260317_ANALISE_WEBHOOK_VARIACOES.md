# Análise: Webhook de Variações

## Descoberta Importante

O webhook ESTÁ disparando! Você mostrou 5 execuções em 16:55:39.

## Possível Problema

O webhook do Bling pode estar enviando apenas uma NOTIFICAÇÃO de mudança, mas não os dados completos atualizados da variação.

Quando o webhook dispara, o workflow faz:

1. Recebe webhook do Bling
2. Pega o `id` do produto do webhook
3. Faz uma chamada GET para buscar os dados completos: `GET /api/v3/produtos/{id}`
4. Com os dados completos, faz UPDATE no banco

## Hipótese do Problema

Quando você atualiza uma VARIAÇÃO no Bling:
- ✅ Webhook dispara
- ✅ Webhook envia o `id` da variação
- ✅ Workflow busca dados completos da variação
- ❓ **MAS**: Os dados retornados pelo Bling podem estar em CACHE ou desatualizados

## Solução

Precisamos verificar nos logs do N8N:

### 1. Verificar o que o webhook recebeu

No nó "Webhook1", verificar:
```json
{
  "body": {
    "data": {
      "id": 16613337810,  // ID da variação
      "preco": ???  // Qual preço veio aqui?
    }
  }
}
```

### 2. Verificar o que o GET retornou

No nó "Pega mais dados do ID Produto1", verificar:
```json
{
  "data": {
    "id": 16613337810,
    "preco": ???,  // Qual preço veio aqui?
    "variacao": {
      "produtoPai": {
        "id": 16613337870
      }
    }
  }
}
```

### 3. Verificar se o UPDATE foi executado

No nó "Processa Resultado1", verificar os logs:
- "VARIAÇÃO DETECTADA: Atualizando em products_variations_bling"
- "ID da variação: 16613337810"
- "VARIAÇÃO ATUALIZADA COM SUCESSO"

## Possíveis Cenários

### Cenário A: Dados do Bling estão desatualizados
- Webhook dispara imediatamente
- GET busca dados do Bling
- Mas o Bling ainda retorna dados antigos (cache)
- UPDATE salva dados antigos no banco

**Solução**: Adicionar um delay (Wait) antes de buscar dados do Bling

### Cenário B: UPDATE não está sendo executado
- Código detecta variação
- Mas há erro no UPDATE que está sendo silenciado
- Verificar logs de erro

**Solução**: Melhorar tratamento de erros e logs

### Cenário C: Filtro do UPDATE está errado
- UPDATE é executado
- Mas não encontra a variação no banco (filtro errado)
- Nenhuma linha é atualizada

**Solução**: Verificar se `bling_id` está correto

## Próximos Passos

1. Abrir uma das execuções no N8N (16:55:39)
2. Verificar nó por nó:
   - Webhook1: Qual `id` e `preco` vieram?
   - Pega mais dados do ID Produto1: Qual `preco` foi retornado?
   - Processa Resultado1: Logs de "VARIAÇÃO DETECTADA"?
   - Há mensagem de erro?
3. Com essas informações, podemos identificar exatamente onde está o problema

## Teste Sugerido

Para confirmar se é problema de cache do Bling:

1. Alterar uma variação no Bling (ex: preço para R$ 70,00)
2. Aguardar 30 segundos
3. Fazer uma chamada manual GET para a API do Bling:
   ```
   GET https://api.bling.com.br/Api/v3/produtos/16613337810
   ```
4. Verificar se o preço retornado é R$ 70,00 ou ainda R$ 65,00
5. Se for R$ 65,00, confirma que é problema de cache do Bling

## Solução Temporária Aplicada

✅ Atualizei manualmente os preços no banco:
- SKU YEIZ_IDP323_001: R$ 69,00
- SKU YEIZ_IDP323_005: R$ 66,00

Frontend deve mostrar preços corretos agora.
