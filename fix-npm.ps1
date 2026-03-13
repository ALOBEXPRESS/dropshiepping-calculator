# Script para corrigir erro do npm
# Uso: .\fix-npm.ps1

Write-Host "🔧 Corrigindo erro do npm..." -ForegroundColor Cyan
Write-Host ""

# 1. Deletar node_modules e package-lock.json
Write-Host "1️⃣ Deletando node_modules e package-lock.json..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules, package-lock.json -ErrorAction SilentlyContinue
Write-Host "✅ Arquivos deletados" -ForegroundColor Green
Write-Host ""

# 2. Limpar cache do npm
Write-Host "2️⃣ Limpando cache do npm..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "✅ Cache limpo" -ForegroundColor Green
Write-Host ""

# 3. Verificar versão do npm
Write-Host "3️⃣ Verificando versão do npm..." -ForegroundColor Yellow
$npmVersion = npm --version
Write-Host "   Versão atual: $npmVersion" -ForegroundColor Cyan

if ([version]$npmVersion -lt [version]"8.0.0") {
    Write-Host "⚠️  Versão antiga detectada. Atualizando npm..." -ForegroundColor Yellow
    npm install -g npm@latest
    Write-Host "✅ npm atualizado" -ForegroundColor Green
} else {
    Write-Host "✅ Versão do npm OK" -ForegroundColor Green
}
Write-Host ""

# 4. Reinstalar dependências
Write-Host "4️⃣ Reinstalando dependências..." -ForegroundColor Yellow
Write-Host "   Isso pode levar alguns minutos..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dependências instaladas com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Problema resolvido! Você pode rodar:" -ForegroundColor Green
    Write-Host "   npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "❌ Falhou. Tentando com --legacy-peer-deps..." -ForegroundColor Red
    npm install --legacy-peer-deps
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Instalado com --legacy-peer-deps" -ForegroundColor Green
    } else {
        Write-Host "❌ Ainda falhou. Tente:" -ForegroundColor Red
        Write-Host "   1. Atualizar Node.js: https://nodejs.org" -ForegroundColor Yellow
        Write-Host "   2. Usar Yarn: npm install -g yarn && yarn install" -ForegroundColor Yellow
        Write-Host "   3. Ver docs/SOLUCAO_ERRO_NPM.md para mais soluções" -ForegroundColor Yellow
    }
}
