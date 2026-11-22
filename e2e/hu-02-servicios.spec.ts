import { test, expect } from '@playwright/test';

test.describe('HU-02: Gestión del Catálogo de Servicios', () => {

  test.beforeEach(async ({ page }) => {
    // Timeout para permitir interacción visual con slowMo: 1000
    test.setTimeout(60000);
    // Navegar a la pantalla de servicios
    await page.goto('/servicios');
    await expect(page.getByTestId('btn-new-service')).toBeVisible({ timeout: 15000 });
  });

  test('TC-HU02-01: Creación exitosa de un nuevo servicio', async ({ page }) => {
    // DADO: El usuario se encuentra en /servicios

    // CUANDO: Hace clic en "Nuevo Servicio" y completa el formulario
    await page.getByTestId('btn-new-service').click();

    // Completar campos del modal
    await expect(page.getByTestId('input-service-name')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('input-service-name').fill('Consulta General');
    await page.getByTestId('input-service-duration').fill('45');
    await page.getByTestId('input-service-price').fill('35.00');

    // Pulsar "Guardar"
    await page.getByTestId('btn-save-service').click();

    // ENTONCES: El modal se cierra y la lista contiene una tarjeta con "Consulta General" y "$35.00"
    await expect(page.getByTestId('input-service-name')).toBeHidden({ timeout: 10000 });

    const card = page.getByTestId('service-card-item').filter({ hasText: 'Consulta General' }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card).toContainText('Consulta General');
    await expect(card).toContainText('$35.00');
    await expect(card).toContainText('45 min');
  });

  test('TC-HU02-02: Desactivar temporalmente un servicio sin eliminarlo', async ({ page }) => {
    // DADO: Un servicio existente en la lista (si no existe, se asegura la existencia)
    let card = page.getByTestId('service-card-item').first();
    const count = await page.getByTestId('service-card-item').count();

    if (count === 0) {
      // Crear servicio previo para asegurar idempotencia
      await page.getByTestId('btn-new-service').click();
      await page.getByTestId('input-service-name').fill('Servicio de Prueba');
      await page.getByTestId('input-service-duration').fill('30');
      await page.getByTestId('input-service-price').fill('20.00');
      await page.getByTestId('btn-save-service').click();
      await expect(page.getByTestId('input-service-name')).toBeHidden({ timeout: 10000 });
      card = page.getByTestId('service-card-item').first();
    }

    await expect(card).toBeVisible({ timeout: 10000 });

    // CUANDO: El usuario pulsa en el interruptor de estado
    // Localizar el conmutador interactivo dentro de la tarjeta
    const toggleInput = card.locator('input[type="checkbox"]');
    const toggleLabel = card.locator('label');

    // Si ya está activo, hacer clic para desactivar; si no, activar y desactivar
    const isCurrentlyActive = await toggleInput.isChecked();
    if (!isCurrentlyActive) {
      await toggleLabel.click();
      await expect(card.getByTestId('badge-service-active')).toBeVisible({ timeout: 10000 });
    }

    // Desactivar el servicio pulsando en el interruptor
    await toggleLabel.click();

    // ENTONCES: El servicio cambia su insignia visual a "Inactivo"
    const badgeInactive = card.getByTestId('badge-service-inactive');
    await expect(badgeInactive).toBeVisible({ timeout: 10000 });
    await expect(badgeInactive).toHaveText('Inactivo');
  });

  test('TC-HU02-03: Edición de servicio existente', async ({ page }) => {
    // DADO: Un servicio existente en la lista (si no existe, se crea uno inicial)
    let card = page.getByTestId('service-card-item').first();
    const count = await page.getByTestId('service-card-item').count();

    if (count === 0) {
      await page.getByTestId('btn-new-service').click();
      await page.getByTestId('input-service-name').fill('Servicio Para Editar');
      await page.getByTestId('input-service-duration').fill('30');
      await page.getByTestId('input-service-price').fill('25.00');
      await page.getByTestId('btn-save-service').click();
      await expect(page.getByTestId('input-service-name')).toBeHidden({ timeout: 10000 });
      card = page.getByTestId('service-card-item').first();
    }

    await expect(card).toBeVisible({ timeout: 10000 });

    // CUANDO: El usuario pulsa en el botón "Editar" de la tarjeta
    const btnEdit = card.getByTestId('btn-edit-service');
    await expect(btnEdit).toBeVisible({ timeout: 5000 });
    await btnEdit.click();

    // Se abre el modal de edición con los datos pre-cargados
    await expect(page.getByTestId('input-service-name')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('h2', { hasText: 'Editar Servicio' })).toBeVisible();

    // Modificar los campos: nombre, duración y precio
    await page.getByTestId('input-service-name').fill('Servicio Editado Premium');
    await page.getByTestId('input-service-duration').fill('50');
    await page.getByTestId('input-service-price').fill('42.50');

    // Guardar los cambios
    await page.getByTestId('btn-save-service').click();

    // ENTONCES: El modal se cierra y la tarjeta refleja los datos actualizados
    await expect(page.getByTestId('input-service-name')).toBeHidden({ timeout: 10000 });

    const updatedCard = page.getByTestId('service-card-item').filter({ hasText: 'Servicio Editado Premium' }).first();
    await expect(updatedCard).toBeVisible({ timeout: 10000 });
    await expect(updatedCard).toContainText('Servicio Editado Premium');
    await expect(updatedCard).toContainText('$42.50');
    await expect(updatedCard).toContainText('50 min');
  });

  test('TC-HU02-04: Eliminar correctamente un servicio sin citas asociadas', async ({ page }) => {
    // DADO: Un servicio creado específicamente sin citas asociadas
    await page.getByTestId('btn-new-service').click();
    await expect(page.getByTestId('input-service-name')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('input-service-name').fill('Servicio Para Eliminar');
    await page.getByTestId('input-service-duration').fill('20');
    await page.getByTestId('input-service-price').fill('15.00');
    await page.getByTestId('btn-save-service').click();
    await expect(page.getByTestId('input-service-name')).toBeHidden({ timeout: 10000 });

    const targetCard = page.getByTestId('service-card-item').filter({ hasText: 'Servicio Para Eliminar' }).first();
    await expect(targetCard).toBeVisible({ timeout: 10000 });

    // CUANDO (Paso 1): Hace clic en Eliminar pero luego CANCELA en el diálogo
    const btnDelete = targetCard.getByTestId('btn-delete-service');
    await btnDelete.click();

    const deleteModal = page.getByTestId('modal-delete-confirmation');
    await expect(deleteModal).toBeVisible({ timeout: 5000 });

    // Cancelar en el diálogo
    await page.getByTestId('btn-cancel-delete').click();
    await expect(deleteModal).toBeHidden({ timeout: 5000 });

    // Verificación intermedia: El servicio NO fue eliminado al cancelar
    await expect(targetCard).toBeVisible();

    // CUANDO (Paso 2): Hace clic en Eliminar y CONFIRMA la eliminación
    await btnDelete.click();
    await expect(deleteModal).toBeVisible({ timeout: 5000 });
    await page.getByTestId('btn-confirm-delete').click();

    // ENTONCES: El diálogo se cierra, aparece notificación de éxito y la tarjeta desaparece
    await expect(deleteModal).toBeHidden({ timeout: 5000 });
    await expect(page.getByTestId('toast-success')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('toast-success')).toContainText('eliminado exitosamente');

    // La tarjeta del servicio ya no existe
    await expect(page.getByTestId('service-card-item').filter({ hasText: 'Servicio Para Eliminar' })).toHaveCount(0);
  });

  test('TC-HU02-05: Impedir eliminar un servicio con citas asociadas', async ({ page }) => {
    // DADO: Un servicio con citas previas asociadas en el sistema (ej. "Consulta General")
    const cardWithAppointments = page.getByTestId('service-card-item').filter({ hasText: 'Consulta General' }).first();
    await expect(cardWithAppointments).toBeVisible({ timeout: 10000 });

    // CUANDO: El usuario pulsa "Eliminar" e intenta confirmar
    const btnDelete = cardWithAppointments.getByTestId('btn-delete-service');
    await btnDelete.click();

    const deleteModal = page.getByTestId('modal-delete-confirmation');
    await expect(deleteModal).toBeVisible({ timeout: 5000 });

    // Confirmar eliminación
    await page.getByTestId('btn-confirm-delete').click();

    // ENTONCES: Se impide la eliminación, aparece mensaje de recomendación y el servicio permanece
    await expect(deleteModal).toBeHidden({ timeout: 5000 });

    const toastError = page.getByTestId('toast-error');
    await expect(toastError).toBeVisible({ timeout: 10000 });
    await expect(toastError).toContainText('No se puede eliminar el servicio porque tiene citas asociadas');
    await expect(toastError).toContainText('Se recomienda desactivarlo para conservar el historial');

    // El servicio sigue existiendo en el catálogo
    await expect(cardWithAppointments).toBeVisible();
  });

});
