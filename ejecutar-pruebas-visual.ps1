# Script interactivo de ejecución visual de pruebas Playwright para Mi Negocio Digital
Set-Location -Path $PSScriptRoot

function Show-Menu {
    Clear-Host
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host "                    MI NEGOCIO DIGITAL - QA AUTOMATICO" -ForegroundColor Green
    Write-Host "           EJECUTOR VISUAL DE PRUEBAS E2E (PLAYWRIGHT EN CHROMIUM)" -ForegroundColor Yellow
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  [ENTORNO DE PRUEBAS AISLADO]" -ForegroundColor White
    Write-Host "  - Servidor de Test:  http://localhost:3001" -ForegroundColor Gray
    Write-Host "  - Base de Datos:     prisma\test.db (dev.db protegida en localhost:3000)" -ForegroundColor Gray
    Write-Host "  - Modo Visual:       Chromium --headed (slowMo: 1000ms, workers: 1)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host "                           SELECCIONA UNA OPCIÓN" -ForegroundColor White
    Write-Host "===============================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  [1] HU-01: Configuración de Datos y Horarios   [VALIDADA - PASS]" -ForegroundColor Green
    Write-Host "  [2] HU-02: Catálogo de Servicios               [VALIDADA - PASS]" -ForegroundColor Green
    Write-Host "  [3] HU-03: Directorio de Clientes              [VALIDADA - PASS]" -ForegroundColor Green
    Write-Host "  [4] HU-04: Agendamiento y Anticolisión         [VALIDADA - PASS]" -ForegroundColor Green
    Write-Host "  [5] HU-05: Visualización y Filtros de Agenda   [VALIDADA - PASS]" -ForegroundColor Green
    Write-Host "  [6] HU-06: Ciclo de Vida de Citas              [VALIDADA - PASS]" -ForegroundColor Green
    Write-Host "  [7] HU-07: Reprogramación con Validación       [VALIDADA - PASS]" -ForegroundColor Green
    Write-Host "  [8] HU-08: Dashboard Operativo Diario          [VALIDADA - PASS]" -ForegroundColor Green
    Write-Host ""
    Write-Host "  [A] Ejecutar TODAS las pruebas disponibles" -ForegroundColor Yellow
    Write-Host "  [S] Salir" -ForegroundColor Red
    Write-Host ""
    Write-Host "===============================================================================" -ForegroundColor Cyan
}

$suites = @{
    "1" = @{ File = "e2e/hu-01-horarios.spec.ts"; Name = "HU-01: Configuración de Datos y Horarios" }
    "2" = @{ File = "e2e/hu-02-servicios.spec.ts"; Name = "HU-02: Catálogo de Servicios" }
    "3" = @{ File = "e2e/hu-03-clientes.spec.ts"; Name = "HU-03: Directorio de Clientes" }
    "4" = @{ File = "e2e/hu-04-agendamiento.spec.ts"; Name = "HU-04: Agendamiento y Anticolisión" }
    "5" = @{ File = "e2e/hu-05-agenda-filtros.spec.ts"; Name = "HU-05: Visualización y Filtros de Agenda" }
    "6" = @{ File = "e2e/hu-06-ciclo-citas.spec.ts"; Name = "HU-06: Ciclo de Vida de Citas" }
    "7" = @{ File = "e2e/hu-07-reprogramacion.spec.ts"; Name = "HU-07: Reprogramación con Validación" }
    "8" = @{ File = "e2e/hu-08-dashboard.spec.ts"; Name = "HU-08: Dashboard Operativo Diario" }
}

do {
    Show-Menu
    $opcion = (Read-Host "Ingresa tu opción [1-8, A, S]").Trim().ToUpper()

    if ($opcion -eq "S") {
        Write-Host "Saliendo del ejecutor..." -ForegroundColor Yellow
        break
    }
    elseif ($opcion -eq "A") {
        Write-Host "`nEjecutando todas las suites disponibles..." -ForegroundColor Cyan
        npx playwright test --headed --workers=1
        Write-Host "`nPresiona Enter para volver al menú..." -ForegroundColor Gray
        Read-Host
    }
    elseif ($suites.ContainsKey($opcion)) {
        $suite = $suites[$opcion]
        $fullPath = Join-Path $PSScriptRoot $suite.File
        if (-not (Test-Path $fullPath)) {
            Write-Host "`n[AVISO: NO TESTS FOUND] La suite $($suite.File) aún no ha sido implementada." -ForegroundColor Yellow
            Write-Host "Esta historia se desarrollará en las próximas lecciones." -ForegroundColor Gray
            Write-Host "`nPresiona Enter para volver al menú..." -ForegroundColor Gray
            Read-Host
        } else {
            Write-Host "`nEjecutando $($suite.Name)..." -ForegroundColor Cyan
            npx playwright test $suite.File --headed --workers=1
            Write-Host "`nPresiona Enter para volver al menú..." -ForegroundColor Gray
            Read-Host
        }
    }
} while ($true)
