# Script para iniciar el proyecto completo con Docker y ejecutar pruebas
# Este script maneja: Docker Desktop, docker-compose, y pruebas de API

Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Sales Management Microservices - Inicialización        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Función para esperar a que un servicio esté listo
function Wait-ForService {
    param(
        [string]$ServiceName,
        [string]$Url,
        [int]$MaxAttempts = 30,
        [int]$WaitSeconds = 2
    )
    
    $attempts = 0
    Write-Host "⏳ Esperando que $ServiceName esté listo..." -ForegroundColor Yellow
    
    while ($attempts -lt $MaxAttempts) {
        try {
            $response = Invoke-RestMethod -Uri $Url -Method Get -ErrorAction SilentlyContinue -TimeoutSec 1
            Write-Host "✅ $ServiceName está LISTO" -ForegroundColor Green
            return $true
        } catch {
            $attempts++
            Write-Host "   Intento $attempts/$MaxAttempts..." -ForegroundColor DarkGray
            Start-Sleep -Seconds $WaitSeconds
        }
    }
    
    Write-Host "❌ Timeout esperando $ServiceName" -ForegroundColor Red
    return $false
}

# Paso 1: Verificar Docker Desktop
Write-Host "`n[PASO 1/4] Buscando Docker Desktop..." -ForegroundColor Magenta

$dockerFound = $false
$dockerExe = ""

# Buscar en rutas comunes
$dockerPaths = @(
    "C:\Program Files\Docker\Docker\resources\bin\docker.exe",
    "C:\Program Files (x86)\Docker\Docker\resources\bin\docker.exe",
    "${env:ProgramFiles}\Docker\Docker\resources\bin\docker.exe"
)

foreach ($path in $dockerPaths) {
    if (Test-Path $path) {
        $dockerFound = $true
        $dockerExe = $path
        Write-Host "✅ Docker encontrado en: $path" -ForegroundColor Green
        break
    }
}

if (-not $dockerFound) {
    Write-Host ""
    Write-Host "❌ Docker Desktop NO está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "📥 Descárgalo e instálalo desde: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "⚙️  Pasos:" -ForegroundColor Yellow
    Write-Host "   1. Descarga Docker Desktop for Windows"
    Write-Host "   2. Corre el instalador y sigue las instrucciones"
    Write-Host "   3. Reinicia tu computadora"
    Write-Host "   4. Abre Docker Desktop y espera a que esté corriendo"
    Write-Host "   5. Ejecuta este script nuevamente"
    Write-Host ""
    exit 1
}

# Paso 2: Verificar que Docker Desktop esté corriendo
Write-Host ""
Write-Host "[PASO 2/4] Verificando que Docker Desktop esté corriendo..." -ForegroundColor Magenta
Write-Host ""

$dockerRunning = $false
try {
    $output = & $dockerExe ps --quiet 2>$null
    $dockerRunning = $true
    Write-Host "✅ Docker Desktop está CORRIENDO" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Docker Desktop NO está corriendo" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Por favor:" -ForegroundColor Yellow
    Write-Host "   1. Abre Docker Desktop (busca en el menú Inicio)"
    Write-Host "   2. Espera a que el ícono esté verde"
    Write-Host "   3. Ejecuta este script nuevamente"
    Write-Host ""
    exit 1
}

# Paso 3: Iniciar Docker Compose
Write-Host ""
Write-Host "[PASO 3/4] Iniciando servicios con Docker Compose..." -ForegroundColor Magenta
Write-Host ""

$currentPath = Get-Location
Set-Location "c:\Users\user\Documents\PROYECTO SISTEMAS DISTRIBUIDOS\sales-management-microservices"

Write-Host "ejecutando: docker-compose up --build" -ForegroundColor DarkCyan
Write-Host "(Esto puede tardar 2-5 minutos la primera vez...)" -ForegroundColor DarkYellow
Write-Host ""

# Iniciar docker-compose en background
$dockercomposeProcess = Start-Process -FilePath "cmd" `
    -ArgumentList "/c", "docker-compose up --build" `
    -NoNewWindow `
    -PassThru `
    -RedirectStandardOutput "./docker-compose.log" `
    -RedirectStandardError "./docker-compose.log"

# Esperar a que los servicios estén listos
Write-Host "⏳ Esperando a que los servicios estén disponibles..." -ForegroundColor Yellow
Write-Host "(Esto tomará aproximadamente 2-5 minutos)" -ForegroundColor DarkYellow
Write-Host ""

$services = @(
    @{ Name = "Usuarios"; Url = "http://localhost:3001/health" },
    @{ Name = "Productos"; Url = "http://localhost:3002/health" },
    @{ Name = "Ventas"; Url = "http://localhost:3003/health" },
    @{ Name = "Inventario"; Url = "http://localhost:3004/health" },
    @{ Name = "Facturación"; Url = "http://localhost:3005/health" },
    @{ Name = "Notificaciones"; Url = "http://localhost:3006/health" }
)

$allReady = $true
foreach ($service in $services) {
    $ready = Wait-ForService -ServiceName $service.Name -Url $service.Url -MaxAttempts 60 -WaitSeconds 3
    if (-not $ready) {
        $allReady = $false
    }
}

if ($allReady) {
    Write-Host ""
    Write-Host "✅ Todos los servicios están LISTOS" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️  Algunos servicios no respondieron" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Revisa el log de Docker Compose:" -ForegroundColor Yellow
    Write-Host "   cat docker-compose.log"
    Write-Host ""
}

# Paso 4: Ejecutar pruebas
Write-Host ""
Write-Host "[PASO 4/4] Ejecutando pruebas de API..." -ForegroundColor Magenta
Write-Host ""
Write-Host "Usando script: test-api.ps1" -ForegroundColor DarkCyan
Write-Host ""

# Ejecutar el script de pruebas
if (Test-Path "./test-api.ps1") {
    & "./test-api.ps1"
} else {
    Write-Host "❌ No se encontró test-api.ps1" -ForegroundColor Red
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 PROYECTO INICIADO CORRECTAMENTE" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "📌 INFORMACIÓN IMPORTANTE:" -ForegroundColor Yellow
Write-Host "   * Los servicios siguen corriendo en background" -ForegroundColor DarkYellow
Write-Host "   * Abre una nueva terminal PowerShell para nuevos comandos" -ForegroundColor DarkYellow
Write-Host "   * El log se puede ver en: docker-compose.log" -ForegroundColor DarkYellow
Write-Host "   * Para detener todo: docker-compose down" -ForegroundColor DarkYellow
Write-Host ""

Write-Host "🔗 ACCESOS:" -ForegroundColor Cyan
Write-Host "   * Usuarios:       http://localhost:3001" -ForegroundColor DarkCyan
Write-Host "   * Productos:      http://localhost:3002" -ForegroundColor DarkCyan
Write-Host "   * Ventas:         http://localhost:3003" -ForegroundColor DarkCyan
Write-Host "   * Inventario:     http://localhost:3004" -ForegroundColor DarkCyan
Write-Host "   * Facturación:    http://localhost:3005" -ForegroundColor DarkCyan
Write-Host "   * Notificaciones: http://localhost:3006" -ForegroundColor DarkCyan
Write-Host "   * RabbitMQ:       http://localhost:15672 (guest/guest)" -ForegroundColor DarkCyan
Write-Host "   * MySQL:          localhost:3306 (root/root123)" -ForegroundColor DarkCyan
Write-Host ""

Write-Host "📚 PRÓXIMOS PASOS:" -ForegroundColor Green
Write-Host "   1. Lee el archivo README.md para entender la arquitectura" -ForegroundColor DarkGreen
Write-Host "   2. Consulta docs/ENDPOINTS.md para todos los endpoints" -ForegroundColor DarkGreen
Write-Host "   3. Descarga Postman o Insomnia para probar APIs manualmente" -ForegroundColor DarkGreen
Write-Host "   4. Comienza con las ramas de desarrollo:" -ForegroundColor DarkGreen
Write-Host "      * git checkout feature/usuarios" -ForegroundColor DarkGreen
Write-Host "      * git checkout feature/productos" -ForegroundColor DarkGreen
Write-Host "      * git checkout feature/ventas-inventario" -ForegroundColor DarkGreen
Write-Host ""

Set-Location $currentPath
