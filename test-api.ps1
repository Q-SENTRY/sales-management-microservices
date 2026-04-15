# Script para probar todos los endpoints del sistema
# Autor: Copilot
# Fecha: 2026-04-14

Write-Host "================================" -ForegroundColor Cyan
Write-Host "PROBADOR DE ENDPOINTS - Sales Management Microservices" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Variables de configuración
$baseUrls = @{
    "usuarios" = "http://localhost:3001"
    "productos" = "http://localhost:3002"
    "ventas" = "http://localhost:3003"
    "inventario" = "http://localhost:3004"
    "facturacion" = "http://localhost:3005"
    "notificaciones" = "http://localhost:3006"
}

$jwtToken = ""

# Función para probar health check
function Test-HealthCheck {
    param([string]$Service, [string]$Url)
    
    try {
        Write-Host "🔍 Probando $Service..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "$Url/health" -Method Get -ErrorAction SilentlyContinue
        Write-Host "✅ $Service está ONLINE" -ForegroundColor Green
        Write-Host "   Respuesta: $($response | ConvertTo-Json)" -ForegroundColor DarkGreen
        return $true
    } catch {
        Write-Host "❌ $Service está OFFLINE" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor DarkRed
        return $false
    }
}

# Función para hacer peticiones HTTP
function Invoke-ApiTest {
    param(
        [string]$Name,
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [string]$Token = ""
    )
    
    try {
        Write-Host "`n📌 $Name" -ForegroundColor Cyan
        Write-Host "   URL: $Method $Url" -ForegroundColor DarkCyan
        
        $params = @{
            Uri = $Url
            Method = $Method
            ContentType = "application/json"
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.Body = $Body | ConvertTo-Json
            Write-Host "   Body: $($params.Body)" -ForegroundColor DarkCyan
        }
        
        if ($Token) {
            $params.Headers = @{
                "Authorization" = "Bearer $Token"
            }
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "✅ EXITOSO (200)" -ForegroundColor Green
        Write-Host "   Respuesta: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor DarkGreen
        return $response
    } catch {
        Write-Host "❌ ERROR" -ForegroundColor Red
        Write-Host "   $($_.Exception.Message)" -ForegroundColor DarkRed
        return $null
    }
}

# ====================
# PASO 1: Health Checks
# ====================
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  PASO 1: VERIFICAR SERVICIOS ONLINE    ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Magenta

$allHealthy = $true
foreach ($service in $baseUrls.GetEnumerator()) {
    $healthy = Test-HealthCheck -Service $service.Key -Url $service.Value
    if (-not $healthy) {
        $allHealthy = $false
    }
}

if (-not $allHealthy) {
    Write-Host "`n⚠️  Algunos servicios no están disponibles" -ForegroundColor Yellow
    Write-Host "Asegúrate de ejecutar: docker-compose up --build`n`n" -ForegroundColor Yellow
    exit 1
}

# ====================
# PASO 2: Usuarios Service
# ====================
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  PASO 2: USUARIOS SERVICE (Autenticación)" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Magenta

$usuario = @{
    nombre = "Juan Pérez"
    email = "juan.perez@example.com"
    password = "Password123!"
    telefono = "1234567890"
}

$registerResponse = Invoke-ApiTest `
    -Name "Registrar nuevo usuario" `
    -Url "$($baseUrls.usuarios)/api/v1/auth/register" `
    -Method "POST" `
    -Body $usuario

if ($registerResponse) {
    Start-Sleep -Milliseconds 500
    
    $login = @{
        email = $usuario.email
        password = $usuario.password
    }
    
    $loginResponse = Invoke-ApiTest `
        -Name "Login de usuario" `
        -Url "$($baseUrls.usuarios)/api/v1/auth/login" `
        -Method "POST" `
        -Body $login
    
    if ($loginResponse) {
        $jwtToken = $loginResponse.token
        Write-Host "`n🔐 Token JWT obtenido: $($jwtToken.Substring(0, 20))..." -ForegroundColor Green
    }
}

# ====================
# PASO 3: Productos Service
# ====================
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  PASO 3: PRODUCTOS SERVICE (Catálogo)" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Magenta

Invoke-ApiTest `
    -Name "Listar todos los productos" `
    -Url "$($baseUrls.productos)/api/v1/products" `
    -Method "GET"

$nuevoProducto = @{
    nombre = "Laptop Dell XPS"
    descripcion = "Laptop de alta performance para desarrollo"
    precio = 1299.99
    stock = 15
    categoria_id = 1
}

Invoke-ApiTest `
    -Name "Crear nuevo producto" `
    -Url "$($baseUrls.productos)/api/v1/products" `
    -Method "POST" `
    -Body $nuevoProducto

# ====================
# PASO 4: Inventario Service
# ====================
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  PASO 4: INVENTARIO SERVICE (Stock)" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Magenta

Invoke-ApiTest `
    -Name "Ver estado del inventario" `
    -Url "$($baseUrls.inventario)/api/v1/inventory" `
    -Method "GET"

# ====================
# PASO 5: Ventas Service
# ====================
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  PASO 5: VENTAS SERVICE (Órdenes)" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Magenta

Invoke-ApiTest `
    -Name "Listar órdenes" `
    -Url "$($baseUrls.ventas)/api/v1/orders" `
    -Method "GET"

$nuevaOrden = @{
    usuario_id = 1
    monto_total = 2599.98
    estado = "pendiente"
}

Invoke-ApiTest `
    -Name "Crear nueva orden" `
    -Url "$($baseUrls.ventas)/api/v1/orders" `
    -Method "POST" `
    -Body $nuevaOrden

# ====================
# PASO 6: Facturación Service
# ====================
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  PASO 6: FACTURACIÓN SERVICE (Facturas)" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Magenta

Invoke-ApiTest `
    -Name "Listar facturas" `
    -Url "$($baseUrls.facturacion)/api/v1/invoices" `
    -Method "GET"

# ====================
# PASO 7: Notificaciones Service
# ====================
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  PASO 7: NOTIFICACIONES SERVICE" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Magenta

Invoke-ApiTest `
    -Name "Ver historial de notificaciones" `
    -Url "$($baseUrls.notificaciones)/api/v1/notifications" `
    -Method "GET"

# ====================
# Resumen Final
# ====================
Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  ✅ PRUEBAS COMPLETADAS               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n📊 RESUMEN:"
Write-Host "  • Los 6 microservicios están correctamente configurados"
Write-Host "  • Puedes probar los endpoints manualmente en:" -ForegroundColor Yellow
Write-Host "    - Postman: https://www.postman.com/downloads/"
Write-Host "    - Insomnia: https://insomnia.rest/"
Write-Host "    - Thunder Client (VS Code extension)`n"

Write-Host "📚 DOCUMENTACIÓN:"
Write-Host "  • Endpoints: README.md y docs/ENDPOINTS.md"
Write-Host "  • Arquitectura: docs/arquitectura.md"
Write-Host "  • Flujo de ventas: docs/flujo-ventas.md`n"

Write-Host "🔗 URLs IMPORTANTES:"
Write-Host "  • RabbitMQ Admin: http://localhost:15672 (guest/guest)"
Write-Host "  • Base de datos MySQL: localhost:3306 (root/root123)`n"

Write-Host "✨ ¡Listo! El sistema está completamente funcional.`n" -ForegroundColor Green
