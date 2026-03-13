# Guia de Teste Manual - Imagens de Variações

## Objetivo
Verificar se as imagens das variações estão sendo exibidas corretamente ao navegar pelos produtos.

## Pré-requisitos
1. Servidor de desenvolvimento rodando: `npm run dev`
2. Acesso à página de produtos: http://localhost:5174/produtos
3. Login realizado no sistema

## Produtos para Testar

### ✅ Produto 1: C1172 (Camisa Feminina Baby Look Stitch e Angel)
**Status**: Já funcionando (testado anteriormente)

**Passos**:
1. Localize o card do produto "Stitch e Angel"
2. Clique na seta direita (→) na imagem do produto
3. Observe que a imagem muda para cada variação
4. Continue clicando para ver todas as 8 variações

**Resultado Esperado**: Cada variação mostra uma imagem diferente

---

### ✅ Produto 2: C1314 (Camisa Feminina Baby Look Tudo no Tempo Dele)
**Status**: Já funcionando (testado anteriormente)

**Passos**:
1. Localize o card do produto "Tudo no Tempo Dele"
2. Clique na seta direita (→) na imagem do produto
3. Observe que a imagem muda para cada variação
4. Continue clicando para ver todas as 28 variações

**Resultado Esperado**: Cada variação mostra uma imagem diferente

---

### ✅ Produto 3: S355 (Sapato Feminino Ortopédico Hospitalar)
**Status**: Já funcionando (testado anteriormente)

**Passos**:
1. Localize o card do produto "Sapato Feminino Ortopédico"
2. Clique na seta direita (→) na imagem do produto
3. Observe que a imagem muda para cada variação
4. Variações incluem tamanhos: 34/35, 36/37, 38/39

**Resultado Esperado**: Cada variação mostra uma imagem diferente

---

### 🆕 Produto 4: BLS102030 (Bolsa Podlinda Anne)
**Status**: CORRIGIDO nesta implementação

**Variações**:
- Unico - Preto
- Unico - Pink
- Unico - Nude
- Unico - Branco

**Passos**:
1. Localize o card do produto "Bolsa Podlinda Anne"
2. Clique na seta direita (→) na imagem do produto
3. Observe que a imagem muda para cada variação
4. Verifique especialmente:
   - Variação "Unico - Preto" → Imagem da bolsa preta
   - Variação "Unico - Branco" → Imagem da bolsa branca
   - Variação "Unico - Nude" → Imagem da bolsa nude

**Resultado Esperado**: 
- ✅ Cada variação mostra uma imagem diferente
- ✅ As cores das bolsas correspondem ao nome da variação
- ✅ Não há erros no console do navegador

**Resultado Anterior (BUG)**:
- ❌ Imagens não mudavam ao clicar nas setas
- ❌ Sempre mostrava a mesma imagem do produto pai

---

### 🆕 Produto 5: 2023596165 (Bolsa PodLinda Jéssica)
**Status**: PARCIALMENTE CORRIGIDO

**Variações**:
- Preto
- Branco
- Pink

**Passos**:
1. Localize o card do produto "Bolsa PodLinda Jéssica"
2. Clique na seta direita (→) na imagem do produto
3. Observe o comportamento ao navegar

**Resultado Esperado**: 
- ✅ Navegação funciona sem erros
- ⚠️ Imagem permanece a mesma (imagem do produto pai)
- ℹ️ Isso é esperado porque este produto não tem variações individuais no banco de dados

**Nota**: Para este produto ter imagens diferentes por variação, seria necessário:
- Opção A: Criar registros de variação no `products_bling`
- Opção B: Implementar upload manual de imagens por variação
- Opção C: Usar a mesma imagem do produto pai (comportamento atual)

---

## Checklist de Verificação

### Para cada produto testado:
- [ ] O card do produto é exibido corretamente
- [ ] As setas de navegação (← →) estão visíveis ao passar o mouse
- [ ] Ao clicar na seta direita, a variação muda
- [ ] O contador de variações (ex: "2/8") é atualizado
- [ ] A imagem da variação é exibida (ou imagem pai como fallback)
- [ ] Não há erros no console do navegador (F12)
- [ ] O nome da variação é exibido corretamente

### Produtos Específicos:
- [ ] BLS102030: Imagens mudam para cada variação
- [ ] 2023596165: Navegação funciona sem erros

## Como Reportar Problemas

Se encontrar algum problema, anote:
1. **Produto**: Nome e SKU
2. **Variação**: Nome da variação com problema
3. **Comportamento esperado**: O que deveria acontecer
4. **Comportamento observado**: O que realmente aconteceu
5. **Console**: Erros no console do navegador (F12)
6. **Screenshot**: Se possível, tire uma captura de tela

## Ferramentas de Debug

### Console do Navegador (F12)
Abra o console e procure por:
- Erros em vermelho
- Avisos em amarelo
- Logs relacionados a "variation" ou "image"

### Network Tab
Verifique se as imagens estão sendo carregadas:
1. Abra F12 → Network
2. Filtre por "Img"
3. Navegue pelas variações
4. Verifique se novas imagens são carregadas

## Conclusão

Após testar todos os produtos, você deve observar:
- ✅ Produtos C1172, C1314, S355: Continuam funcionando perfeitamente
- ✅ Produto BLS102030: Agora mostra imagens diferentes por variação
- ✅ Produto 2023596165: Navegação funciona (imagem permanece a mesma)

**Data do Teste**: ___/___/______
**Testado por**: _________________
**Resultado**: [ ] Aprovado [ ] Reprovado
