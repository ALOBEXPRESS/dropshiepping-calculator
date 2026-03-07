# CSS PACK Snippets

Biblioteca de efeitos CSS extraídos do CSS PACK do Heitor Ferreira, adaptados para o projeto.

## Estrutura

```
css-pack-snippets/
├── personalizacoes/    # Efeitos visuais e estilização
├── animacoes/          # Animações e transições
├── botoes/             # Efeitos para botões
├── ferramentas/        # Componentes funcionais
├── composicoes/        # Backgrounds e texturas
└── carrosseis/         # Efeitos para carrosséis
```

## Como Usar

### 1. Encontrar Efeito
Consulte `docs/MELHORIAS_CSS_COMPLETO_COM_URLS.md` para ver efeitos priorizados.

### 2. Extrair Código
1. Acesse a URL do efeito
2. Copie o código CSS
3. Salve nesta pasta seguindo a estrutura

### 3. Implementar
```tsx
import './css-pack-snippets/personalizacoes/texto-3d-hover.css';

<h1 className="texto-3d-hover">Meu Título</h1>
```

## Snippets Disponíveis

### Personalizações
- [ ] TEXTO COM TRANSIÇÃO 3D NO HOVER
- [ ] COR NO HOVER
- [ ] HOVER COM DESFOQUE
- [ ] HOVER DINÂMICO VINCULADO AO MOUSE
- [ ] CARD 3D
- [ ] TEXTO GRANDE COM SCROLL VERTICAL
- [ ] TEXTO AMPLIADO NO HOVER

### Ferramentas
- [ ] ABAS COM CONTAINER + ANIMAÇÃO DE ENTRADA
- [ ] BORDA DO CONTAINER NO HOVER
- [ ] CTA FIXO VINCULADO AO SCROLL
- [ ] ABAS COM BOTÃO SLIDE

### Botões
- [ ] BOTÃO COM BORDA DEGRADÊ ANIMADA
- [ ] BOTÃO COM DEGRADÊ ANIMADO
- [ ] BOTÃO COM LUZ PULSANDO
- [ ] BOTÃO 3D COM ANIMAÇÃO NO HOVER

### Animações
- [ ] BORDA ANIMADA DEGRADÊ
- [ ] EFEITO SCROLL NO HOVER
- [ ] EFEITO FLUTUAR
- [ ] REFLEXO ANIMADO

## Padrões de Nomenclatura

### Arquivos
- Nome em kebab-case
- Extensão `.css`
- Exemplo: `texto-3d-hover.css`

### Classes CSS
- Prefixo `csspack-`
- Nome descritivo
- Exemplo: `.csspack-texto-3d-hover`

### Comentários
```css
/**
 * NOME DO EFEITO
 * 
 * Fonte: CSS PACK - Heitor Ferreira
 * URL: [url do efeito]
 * Categoria: [categoria]
 * 
 * Descrição: [breve descrição]
 * Aplicação: [onde usar]
 * 
 * Adaptações:
 * - [lista de mudanças feitas]
 */
```

## Adaptações Comuns

### Cores
Substituir cores fixas por variáveis CSS:
```css
/* Original */
color: #00FFB7;

/* Adaptado */
color: var(--primary-color);
```

### Responsividade
Adicionar media queries quando necessário:
```css
@media (max-width: 768px) {
  /* Ajustes mobile */
}
```

### Prefixos
Adicionar prefixo para evitar conflitos:
```css
/* Original */
.texto-hover { }

/* Adaptado */
.csspack-texto-hover { }
```

## Contribuindo

Ao adicionar um novo snippet:

1. ✅ Extrair código da URL oficial
2. ✅ Adaptar para o projeto (cores, tamanhos)
3. ✅ Adicionar comentários descritivos
4. ✅ Testar em componente real
5. ✅ Atualizar este README
6. ✅ Marcar checkbox acima

## Referências

- [Documentação Completa](../../docs/MELHORIAS_CSS_COMPLETO_COM_URLS.md)
- [Catálogo Completo](../../docs/CSS_PACK_CATALOGO_COMPLETO.md)
- [Análise Técnica](../../docs/ANALISE_EXTRACAO_CSS.md)
- [Solução Final](../../docs/SOLUCAO_FINAL_CSS_PACK.md)
