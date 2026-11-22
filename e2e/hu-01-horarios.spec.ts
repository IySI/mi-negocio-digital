import { test, expect } from '@playwright/test';

test.describe('HU-01: Configuración de Datos del Negocio y Horarios de Atención', () => {

  test.beforeEach(async ({ page }) => {
    // Configurar timeout extendido para permitir observación visual con slowMo: 500
    test.setTimeout(60000);
    // Ingresar a la vista de /horarios y esperar a que el botón principal esté visible
    await page.goto('/horarios');
    await expect(page.getByTestId('btn-save-schedule')).toBeVisible({ timeout: 15000 });
  });

  test('TC-HU01-01: Configurar horario laboral con receso de almuerzo', async ({ page }) => {
    // DADO: El usuario se encuentra en /horarios

    // CUANDO: Activa el interruptor de lunes (si no está activo)
    const toggleLunes = page.getByTestId('toggle-day-1');
    const isChecked = await toggleLunes.isChecked();
    if (!isChecked) {
      await toggleLunes.check();
    }

    // Ingresar hora de apertura "09:00" y cierre "18:00"
    const inputOpen = page.getByTestId('input-open-1');
    await inputOpen.fill('09:00');

    const inputClose = page.getByTestId('input-close-1');
    await inputClose.fill('18:00');

    // Ingresar receso de "13:00" a "14:00"
    const inputLunchStart = page.getByTestId('input-lunch-start-1');
    await inputLunchStart.fill('13:00');

    const inputLunchEnd = page.getByTestId('input-lunch-end-1');
    await inputLunchEnd.fill('14:00');

    // Pulsar "Guardar Horarios"
    const btnSave = page.getByTestId('btn-save-schedule');
    await btnSave.click();

    // ENTONCES: El sistema guarda la configuración en SQLite y muestra mensaje de éxito
    const toastSuccess = page.getByTestId('toast-success');
    await expect(toastSuccess).toBeVisible({ timeout: 15000 });
    await expect(toastSuccess).toContainText('guardados correctamente');
  });

  test('TC-HU01-02: Validación de hora de cierre previa a hora de apertura', async ({ page }) => {
    // DADO: El usuario configura una hora de apertura "18:00" y una hora de cierre "09:00"
    const toggleLunes = page.getByTestId('toggle-day-1');
    const isChecked = await toggleLunes.isChecked();
    if (!isChecked) {
      await toggleLunes.check();
    }

    const inputOpen = page.getByTestId('input-open-1');
    await inputOpen.fill('18:00');

    const inputClose = page.getByTestId('input-close-1');
    await inputClose.fill('09:00');

    // CUANDO: Pulsa "Guardar Horarios"
    const btnSave = page.getByTestId('btn-save-schedule');
    await btnSave.click();

    // ENTONCES: El sistema no guarda y muestra una advertencia visual indicando que
    // la hora de cierre debe ser posterior a la de apertura.
    const alertError = page.getByTestId('alert-error-schedule');
    await expect(alertError).toBeVisible({ timeout: 15000 });
    await expect(alertError).toContainText('La hora de cierre debe ser posterior a la de apertura.');
  });

});
