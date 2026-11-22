@echo off
setlocal EnableDelayedExpansion
title Mi Negocio Digital - QA Visual Playwright

:: Garantizar que el directorio activo sea siempre la raiz del proyecto
cd /d "%~dp0"

:MENU
cls
echo ===============================================================================
echo                     MI NEGOCIO DIGITAL - QA AUTOMATICO
echo            EJECUTOR VISUAL DE PRUEBAS E2E (PLAYWRIGHT EN CHROMIUM)
echo ===============================================================================
echo.
echo   [ENTORNO DE PRUEBAS AISLADO]
echo   - Servidor de Test:  http://localhost:3001
echo   - Base de Datos:     prisma\test.db  (dev.db protegida en localhost:3000)
echo   - Modo Visual:       Chromium --headed  (slowMo: 1000ms, workers: 1)
echo.
echo ===============================================================================
echo                            SELECCIONA UNA OPCION
echo ===============================================================================
echo.
echo   [1] HU-01: Configuracion de Datos y Horarios   [VALIDADA - PASS]
echo   [2] HU-02: Catalogo de Servicios               [VALIDADA - PASS]
echo   [3] HU-03: Directorio de Clientes              [VALIDADA - PASS]
echo   [4] HU-04: Agendamiento y Anticolision         [VALIDADA - PASS]
echo   [5] HU-05: Visualizacion y Filtros de Agenda   [VALIDADA - PASS]
echo   [6] HU-06: Ciclo de Vida de Citas              [VALIDADA - PASS]
echo   [7] HU-07: Reprogramacion con Validacion       [VALIDADA - PASS]
echo   [8] HU-08: Dashboard Operativo Diario          [VALIDADA - PASS]
echo.
echo   [A] Ejecutar TODAS las pruebas disponibles
echo   [S] Salir
echo.
echo ===============================================================================
set /p OPCION="Ingresa tu opcion [1-8, A, S]: "

if /i "%OPCION%"=="1" goto TEST_HU01
if /i "%OPCION%"=="2" goto TEST_HU02
if /i "%OPCION%"=="3" goto TEST_HU03
if /i "%OPCION%"=="4" goto TEST_HU04
if /i "%OPCION%"=="5" goto TEST_HU05
if /i "%OPCION%"=="6" goto TEST_HU06
if /i "%OPCION%"=="7" goto TEST_HU07
if /i "%OPCION%"=="8" goto TEST_HU08
if /i "%OPCION%"=="A" goto TEST_ALL
if /i "%OPCION%"=="S" goto SALIR

echo.
echo [!] Opcion invalida. Intenta nuevamente.
timeout /t 2 >nul
goto MENU

:TEST_HU01
set TEST_SPEC=e2e/hu-01-horarios.spec.ts
set HU_NAME=HU-01: Configuracion de Datos y Horarios
goto CHECK_AND_RUN

:TEST_HU02
set TEST_SPEC=e2e/hu-02-servicios.spec.ts
set HU_NAME=HU-02: Catalogo de Servicios
goto CHECK_AND_RUN

:TEST_HU03
set TEST_SPEC=e2e/hu-03-clientes.spec.ts
set HU_NAME=HU-03: Directorio de Clientes
goto CHECK_AND_RUN

:TEST_HU04
set TEST_SPEC=e2e/hu-04-agendamiento.spec.ts
set HU_NAME=HU-04: Agendamiento y Anticolision
goto CHECK_AND_RUN

:TEST_HU05
set TEST_SPEC=e2e/hu-05-agenda-filtros.spec.ts
set HU_NAME=HU-05: Visualizacion y Filtros de Agenda
goto CHECK_AND_RUN

:TEST_HU06
set TEST_SPEC=e2e/hu-06-ciclo-citas.spec.ts
set HU_NAME=HU-06: Ciclo de Vida de Citas
goto CHECK_AND_RUN

:TEST_HU07
set TEST_SPEC=e2e/hu-07-reprogramacion.spec.ts
set HU_NAME=HU-07: Reprogramacion con Validacion
goto CHECK_AND_RUN

:TEST_HU08
set TEST_SPEC=e2e/hu-08-dashboard.spec.ts
set HU_NAME=HU-08: Dashboard Operativo Diario
goto CHECK_AND_RUN

:CHECK_AND_RUN
if not exist "%~dp0%TEST_SPEC%" (
    echo.
    echo ===============================================================================
    echo   [AVISO: NO TESTS FOUND] %HU_NAME%
    echo -------------------------------------------------------------------------------
    echo   La suite de pruebas '%TEST_SPEC%' todavia no ha sido implementada.
    echo   Esta historia se desarrollara en las proximas lecciones.
    echo ===============================================================================
    echo.
    pause
    goto MENU
)
goto RUN_TEST

:TEST_ALL
echo.
echo ===============================================================================
echo   Ejecutando todas las suites E2E disponibles...
echo   Puerto de prueba: http://localhost:3001 ^| Base: prisma\test.db
echo ===============================================================================
echo.
cd /d "%~dp0"
call npx playwright test --headed --workers=1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo   [RESULTADO: PASS] Todas las pruebas ejecutadas finalizaron con EXITO.
    echo ===============================================================================
) else (
    echo.
    echo ===============================================================================
    echo   [RESULTADO: FAIL] Se detectaron errores en una o mas aserciones.
    echo ===============================================================================
)
echo.
pause
goto MENU

:RUN_TEST
echo.
echo ===============================================================================
echo   Ejecutando suite: %HU_NAME%
echo   Archivo: %TEST_SPEC%
echo   Puerto: http://localhost:3001 ^| Base de datos: prisma\test.db
echo ===============================================================================
echo.
cd /d "%~dp0"
call npx playwright test %TEST_SPEC% --headed --workers=1
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo   [RESULTADO: PASS] La suite '%HU_NAME%' supero todas las aserciones.
    echo ===============================================================================
) else (
    echo.
    echo ===============================================================================
    echo   [RESULTADO: FAIL] Se detectaron aserciones fallidas en '%HU_NAME%'.
    echo ===============================================================================
)
echo.
pause
goto MENU

:SALIR
echo.
echo Saliendo del ejecutor de pruebas visuales.
exit /b 0
