# Serviço de Integração com API Melhor Envio

## Visão Geral

O serviço `melhorEnvioService.ts` fornece integração com a API do Melhor Envio para cálculo de custos de frete. Este serviço é utilizado especificamente para produtos do Mercado Livre com preço igual ou superior a R$ 79,00, onde o frete grátis é obrigatório e o custo deve ser pago pelo vendedor.

## Configuração

### Variável de Ambiente

O serviço requer um token de autenticação da API Melhor Envio. Configure a variável de ambiente:

```env
VITE_MELHOR_ENVIO_TOKEN=seu_token_aqui
```

O token está disponível no arquivo `tokenmelhorenvio.txt` na raiz do projeto.

### Obter Token da API

1. Acesse [Melhor Envio](https://melhorenvio.com.br)
2. Faça login na sua conta
3. Vá em **Configurações** > **API**
4. Gere um novo token com as permissões:
   - `shipping-calculate`
   - `shipping-companies`

## Uso

### Função Principal: `calculateShipping`

Calcula o custo de frete entre dois CEPs usando a API Melhor Envio.

```typescript
import { calculateShipping } from '@/services/melhorEnvioService';

const options = await calculateShipping(
  '04427000',  // CEP de origem (fornecedor)
  '40010000',  // CEP de destino
  {
    weight: 0.5,    // Peso em kg
    height: 5,      // Altura em cm
    width: 15,      // Largura em cm
    length: 20      // Comprimento em cm
  }
);

console.log(options);
// [
//   {
//     name: "Correios PAC",
//     price: 18.90,
//     deliveryTime: 5,
//     company: { id: 1, name: "Correios", picture: "..." }
//   },
//   {
//     name: "SEDEX",
//     price: 32.50,
//     deliveryTime: 2,
//     company: { id: 1, name: "Correios", picture: "..." }
//   }
// ]
```

### Funções Auxiliares

#### `formatShippingPrice`

Formata o preço do frete para exibição.

```typescript
import { formatShippingPrice } from '@/services/melhorEnvioService';

formatShippingPrice(18.90);  // "R$ 18,90"
formatShippingPrice(32.50);  // "R$ 32,50"
```

#### `formatDeliveryTime`

Formata o prazo de entrega para exibição.

```typescript
import { formatDeliveryTime } from '@/services/melhorEnvioService';

formatDeliveryTime(1);   // "1 dia útil"
formatDeliveryTime(5);   // "5 dias úteis"
formatDeliveryTime(10);  // "10 dias úteis"
```

## Interfaces TypeScript

### `ProductDimensions`

```typescript
interface ProductDimensions {
  weight: number;   // Peso em kg
  height: number;   // Altura em cm
  width: number;    // Largura em cm
  length: number;   // Comprimento em cm
}
```

### `ShippingOption`

```typescript
interface ShippingOption {
  name: string;           // Nome da modalidade (ex: "Correios PAC")
  price: number;          // Preço do frete em reais
  deliveryTime: number;   // Prazo de entrega em dias úteis
  company?: {
    id: number;
    name: string;
    picture: string;
  };
}
```

### `SupplierAddress`

```typescript
interface SupplierAddress {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  postalCode: string;
}
```

### `ShippingRegion`

```typescript
interface ShippingRegion {
  name: string;        // "Mais Distante", "Equilíbrio", "Curta Distância"
  postalCode: string;  // CEP representativo da região
}
```

## Tratamento de Erros

O serviço lança `MelhorEnvioError` em caso de problemas. Todos os erros são tratados e retornam mensagens amigáveis:

### Erros Comuns

| Código | Erro | Mensagem |
|--------|------|----------|
| - | Token não configurado | "Token da API Melhor Envio não configurado. Verifique a variável de ambiente VITE_MELHOR_ENVIO_TOKEN." |
| - | Dimensões inválidas | "Dimensões do produto inválidas. Todos os valores devem ser maiores que zero." |
| - | CEP inválido | "CEP inválido. Verifique a localização do fornecedor e destino." |
| 401 | Token inválido | "Erro ao calcular frete. Token de autenticação inválido ou expirado." |
| 400 | Dados inválidos | "Erro ao calcular frete: {mensagem da API}" |
| 422 | CEP não encontrado | "CEP inválido ou não encontrado. Verifique os CEPs informados." |
| - | Erro de rede | "Erro ao conectar com o serviço de frete. Verifique sua conexão e tente novamente." |
| - | Sem opções disponíveis | "Nenhuma opção de frete disponível para esta rota. Verifique os CEPs e dimensões do produto." |

### Exemplo de Tratamento

```typescript
import { calculateShipping, MelhorEnvioError } from '@/services/melhorEnvioService';

try {
  const options = await calculateShipping('04427000', '40010000', dimensions);
  console.log('Opções de frete:', options);
} catch (error) {
  if (error instanceof MelhorEnvioError) {
    console.error('Erro ao calcular frete:', error.message);
    console.error('Status Code:', error.statusCode);
  } else {
    console.error('Erro inesperado:', error);
  }
}
```

## Validações

O serviço realiza as seguintes validações antes de fazer a requisição:

1. **Token de autenticação**: Verifica se `VITE_MELHOR_ENVIO_TOKEN` está configurado
2. **Dimensões**: Todos os valores (peso, altura, largura, comprimento) devem ser maiores que zero
3. **CEPs**: Devem ter exatamente 8 dígitos (formatação com hífen é removida automaticamente)

## Formato da Requisição

A requisição enviada para a API Melhor Envio segue o formato:

```json
{
  "from": {
    "postal_code": "04427000"
  },
  "to": {
    "postal_code": "40010000"
  },
  "products": [
    {
      "id": "1",
      "width": 15,
      "height": 5,
      "length": 20,
      "weight": 0.5,
      "quantity": 1,
      "insurance_value": 0
    }
  ]
}
```

## Formato da Resposta

A API retorna um array de opções de envio:

```json
[
  {
    "name": "Correios PAC",
    "price": "18.90",
    "delivery_time": "5",
    "company": {
      "id": 1,
      "name": "Correios",
      "picture": "https://..."
    }
  }
]
```

O serviço mapeia automaticamente para o formato TypeScript esperado, convertendo strings para números onde apropriado.

## Testes

O serviço possui cobertura completa de testes unitários em `melhorEnvioService.test.ts`:

- ✅ Cálculo de frete com sucesso
- ✅ Remoção de formatação de CEPs
- ✅ Headers corretos na requisição
- ✅ Body correto na requisição
- ✅ Validação de token
- ✅ Validação de dimensões
- ✅ Validação de CEPs
- ✅ Tratamento de erros HTTP (401, 400, 422)
- ✅ Tratamento de erros de rede
- ✅ Validação de resposta
- ✅ Filtro de opções com erro
- ✅ Formatação de preço
- ✅ Formatação de prazo

Execute os testes com:

```bash
npm test -- src/services/melhorEnvioService.test.ts
```

## Integração com o Sistema

Este serviço é utilizado no contexto do bugfix "Mercado Livre Taxa Fixa e Frete Grátis":

- **Quando usar**: Produtos do Mercado Livre com preço ≥ R$ 79,00
- **Objetivo**: Calcular o custo real de frete grátis obrigatório
- **Impacto**: Permite cálculo preciso de lucro e margem considerando o custo de frete

### Fluxo de Uso

1. Usuário preenche dimensões do produto (peso, altura, largura, comprimento)
2. Usuário seleciona fornecedor (Tyr, Dogama, Alobexpress)
3. Sistema obtém CEP do fornecedor automaticamente
4. Usuário seleciona região de destino (Mais Distante, Equilíbrio, Curta Distância)
5. Sistema chama `calculateShipping` com CEP de origem, CEP de destino e dimensões
6. Sistema exibe opções de frete (PAC, SEDEX, etc.)
7. Usuário seleciona modalidade
8. Sistema recalcula lucro e margem incluindo custo de frete

## Referências

- [Documentação API Melhor Envio](https://docs.melhorenvio.com.br/reference/shipment-calculate)
- [Bugfix Spec: Mercado Livre Taxa Fixa e Frete Grátis](.kiro/specs/mercado-livre-taxa-fixa-bug/)
- [Design Document](.kiro/specs/mercado-livre-taxa-fixa-bug/design.md)
- [Tasks](.kiro/specs/mercado-livre-taxa-fixa-bug/tasks.md)

## Notas Importantes

1. **Limite de Requisições**: A API Melhor Envio pode ter limites de requisições. Considere implementar cache se necessário.
2. **Timeout**: As requisições não possuem timeout configurado. Considere adicionar se necessário.
3. **Retry**: Não há lógica de retry automático. Erros de rede devem ser tratados manualmente pelo usuário.
4. **Segurança**: O token é armazenado em variável de ambiente e nunca deve ser commitado no código.
