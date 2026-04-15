# Script simple para iniciar el proyecto
# Requiere: Docker Desktop instalado y corriendo

param(
    [switch]$SkipTests = $false
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Sales Management Microservices" -ForegroundColor Cyan
Write-Host "Iniciizando proyecto..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que Docker está disponible
Write-Host "Verificando Docker..." -ForegroundColor Yellow
docker --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Docker no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "Descargalo desde: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Docker encontrado" -ForegroundColor Green
Write-Host ""

# Navegar al directorio del proyecto
$projectPath = "c:\Users\user\Documents\PROYECTO SISTEMAS DISTRIBUIDOS\sales-management-microservices"
cd $projectPath

# Iniciar Docker Compose
Write-Host "Iniciando servicios..." -ForegroundColor Yellow
Write-Host "(Esto puede tomar 2-5 minutos la primera vez)" -ForegroundColor Gray
Write-Host ""

docker-compose up --build

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "✅ Todos los servicios iniciados!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Puertos disponibles:" -ForegroundColor Cyan
Write-Host "  - Usuarios:       http://localhost:3001" -ForegroundColor DarkCyan
Write-Host "  - Productos:      http://localhost:3002" -ForegroundColor DarkCyan
Write-Host "  - Ventas:         http://localhost:3003" -ForegroundColor DarkCyan
Write-Host "  - Inventario:     http://localhost:3004" -ForegroundColor DarkCyan
Write-Host "  - Facturación:    http://localhost:3005" -ForegroundColor DarkCyan
Write-Host "  - Notificaciones: http://localhost:3006" -ForegroundColor DarkCyan
Write-Host "  - RabbitMQ:       http://localhost:15672 (guest/guest)" -ForegroundColor DarkCyan
Write-Host "  - MySQL:          localhost:3306 (root/root123)" -ForegroundColor DarkCyan
Write-Host ""
