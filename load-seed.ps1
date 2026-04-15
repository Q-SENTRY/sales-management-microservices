# Script para cargar datos de prueba en MySQL dentro del contenedor
$containerName = 'sales_management_mysql'
$seedFile = 'database/seed-data.sql'

if (-not (Test-Path $seedFile)) {
    Write-Error "No existe el archivo de semillas: $seedFile"
    exit 1
}

Write-Host "Cargando datos de prueba desde $seedFile en el contenedor $containerName..." -ForegroundColor Cyan

$seedContent = Get-Content $seedFile -Raw
$process = New-Object System.Diagnostics.Process
$process.StartInfo.FileName = 'docker'
$process.StartInfo.Arguments = "exec -i $containerName mysql -uroot -ppassword123 sales_management_db"
$process.StartInfo.RedirectStandardInput = $true
$process.StartInfo.RedirectStandardOutput = $true
$process.StartInfo.RedirectStandardError = $true
$process.StartInfo.UseShellExecute = $false
$process.StartInfo.CreateNoWindow = $true
$process.Start() | Out-Null
$process.StandardInput.Write($seedContent)
$process.StandardInput.Close()
$output = $process.StandardOutput.ReadToEnd()
$errorOutput = $process.StandardError.ReadToEnd()
$process.WaitForExit()

if ($process.ExitCode -eq 0) {
    Write-Host "✅ Datos de prueba cargados correctamente." -ForegroundColor Green
    if ($output) { Write-Host $output }
} else {
    Write-Host "❌ Hubo un error al cargar los datos de prueba. Código: $($process.ExitCode)" -ForegroundColor Red
    if ($errorOutput) { Write-Host $errorOutput -ForegroundColor Yellow }
}
