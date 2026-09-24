# Solução: Erro npm "Cannot read properties of null (reading 'matches')"

## 🐛 Problema

```bash
npm error Cannot read properties of null (reading 'matches')
```

**Causa Real:** Conflito de dependências entre React 19 e `brazilian-states-flags@0.0.7` que espera React 18.

```bash
npm error peer react@"^18.2.0" from brazilian-states-flags@0.0.7
npm error Could not resolve dependency
```

Este erro ocorre por:
1. Conflito de peer dependencies (React 19 vs React 18)
2. Cache do npm corrompido
3. `package-lock.json` com problemas

## ✅ Solução Correta para Este Projeto

```bash
# 1. Limpar tudo
rm -rf node_modules package-lock.json

# 2. Limpar cache
npm cache clean --force

# 3. Instalar com --legacy-peer-deps (ignora conflitos de peer dependencies)
npm install --legacy-peer-deps
```

**Por que `--legacy-peer-deps`?**
- Permite instalar mesmo com conflito React 19 vs React 18
- `brazilian-states-flags` funciona com React 19 apesar de declarar React 18
- É seguro neste caso específico

## ✅ Soluções (Tente na Ordem)

### Solução 1: Limpar Cache e Reinstalar (Mais Comum)

```bash
# 1. Deletar node_modules e package-lock.json
rm -rf node_modules package-lock.json

# No Windows (PowerShell):
Remove-Item -Recurse -Force node_modules, package-lock.json

# 2. Limpar cache do npm
npm cache clean --force

# 3. Reinstalar
npm install
```

### Solução 2: Atualizar npm

```bash
# Verificar versão atual
npm --version

# Atualizar npm para última versão
npm install -g npm@latest

# Tentar instalar novamente
npm install
```

### Solução 3: Usar npm ci (Clean Install)

```bash
# Deletar node_modules
rm -rf node_modules

# No Windows:
Remove-Item -Recurse -Force node_modules

# Instalar do zero usando package-lock.json
npm ci
```

### Solução 4: Verificar package.json

Às vezes o problema está em uma dependência específica. Verifique se há:
- Versões inválidas
- Caracteres especiais
- Dependências duplicadas

```bash
# Validar package.json
npm install --dry-run
```

### Solução 5: Usar Yarn (Alternativa)

Se nada funcionar, tente usar Yarn:

```bash
# Instalar Yarn globalmente
npm install -g yarn

# Usar Yarn para instalar
yarn install
```

## 🔧 Comandos Completos (Copy-Paste)

### Windows (PowerShell)

```powershell
# Solução completa
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
npm cache clean --force
npm install
```

### Linux/Mac (Bash)

```bash
# Solução completa
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

## 🎯 Solução Recomendada para Este Projeto

Baseado no erro que você está tendo, recomendo:

```bash
# 1. Limpar tudo
Remove-Item -Recurse -Force node_modules, package-lock.json

# 2. Limpar cache
npm cache clean --force

# 3. Verificar versão do npm (deve ser >= 8.0.0)
npm --version

# 4. Se versão antiga, atualizar
npm install -g npm@latest

# 5. Reinstalar dependências
npm install

# 6. Se ainda falhar, tentar com --legacy-peer-deps
npm install --legacy-peer-deps
```

## 🔍 Verificar se Funcionou

Após instalar, verifique:

```bash
# 1. Verificar se node_modules foi criado
ls node_modules

# 2. Verificar se React Query foi instalado
ls node_modules/@tanstack/react-query

# 3. Tentar rodar o projeto
npm run dev
```

## 📝 Notas Importantes

1. **Não use `sudo npm install`** - Pode causar problemas de permissão
2. **Feche o VSCode/Editor** antes de deletar node_modules
3. **Certifique-se de estar na pasta raiz do projeto**
4. **Verifique espaço em disco** - node_modules precisa de ~500MB

## 🆘 Se Nada Funcionar

1. **Deletar cache manualmente:**
   ```bash
   # Windows
   Remove-Item -Recurse -Force $env:APPDATA\npm-cache
   
   # Linux/Mac
   rm -rf ~/.npm
   ```

2. **Reinstalar Node.js:**
   - Desinstalar Node.js completamente
   - Baixar versão LTS mais recente de https://nodejs.org
   - Instalar novamente
   - Tentar `npm install`

3. **Usar nvm (Node Version Manager):**
   ```bash
   # Instalar nvm
   # Windows: https://github.com/coreybutler/nvm-windows
   
   # Instalar Node LTS
   nvm install --lts
   nvm use --lts
   
   # Tentar novamente
   npm install
   ```

## ✅ Checklist de Troubleshooting

- [ ] Deletei `node_modules` e `package-lock.json`
- [ ] Executei `npm cache clean --force`
- [ ] Verifiquei versão do npm (`npm --version`)
- [ ] Atualizei npm se necessário
- [ ] Tentei `npm install`
- [ ] Tentei `npm install --legacy-peer-deps`
- [ ] Verifiquei espaço em disco
- [ ] Fechei editor antes de deletar arquivos
- [ ] Estou na pasta raiz do projeto
- [ ] Tentei usar Yarn como alternativa

## 🎓 Prevenção Futura

Para evitar esse erro:
1. Mantenha npm atualizado
2. Use `npm ci` em CI/CD
3. Commite `package-lock.json` no git
4. Evite editar `package-lock.json` manualmente
5. Use versões específicas de dependências (não `^` ou `~`)
