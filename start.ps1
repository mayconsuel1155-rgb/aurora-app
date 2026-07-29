# Script PowerShell para iniciar o Projeto Aurora
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "🌅 Iniciando o Projeto Aurora..." -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$scriptPath = Join-Path $PSScriptRoot "start.py"
python $scriptPath
