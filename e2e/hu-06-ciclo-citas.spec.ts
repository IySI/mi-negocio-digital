import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getFutureMonday(): string {
  const today = new Date();
  const target = new Date(today);
  target.setDate(today.getDate() + 21); // 3 semanas adelante
  const day = target.getDay();
  const daysUntilMonday = (1 + 7 - day) % 7 || 7;
  target.setDate(target.getDate() + daysUntilMonday);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const testDate = getFutureMonday();

async function selectClientByText(page: any, text: string) {
  const option = page.locator('select[data-testid="select-client"] option', { hasText: text }).first();
  const val = await option.getAttribute('value');
  if (val) {
    await page.getByTestId('select-client').selectOption(val);
  }
}

async function selectServiceByText(page: any, text: string) {
  const option = page.locator('select[data-testid="select-service"] option', { hasText: text }).first();
  const val = await option.getAttribute('value');
  if (val) {
    await page.getByTestId('select-service').selectOption(val);
  }
}

test.describe('HU-06: Gestión del Ciclo de Vida de las Citas', () => {

  test.beforeAll(async () => {
    // 1. Horario de atención para lunes (09:00 a 18:00)
    await prisma.horarioAtencion.upsert({
      where: { diaSemana: 1 },
      update: {
        activo: true,
        horaApertura: '09:00',
        horaCierre: '18:00',
        inicioAlmuerzo: '13:00',
        finAlmuerzo: '14:00',
      },
      create: {
        diaSemana: 1,
        activo: true,
        horaApertura: '09:00',
        horaCierre: '18:00',
        inicioAlmuerzo: '13:00',
        finAlmuerzo: '14:00',
      },
    });

    // 2. Cliente de prueba
    const client = await prisma.cliente.upsert({
      where: { id: 'cliente-hu06-test' },
      update: { nombre: 'Laura Ciclo Citas', telefono: '555-778899' },
      create: {
        id: 'cliente-hu06-test',
        nombre: 'Laura Ciclo Citas',
        telefono: '555-778899',
        notas: 'Cliente para pruebas de ciclo de vida',
      },
    });

    // 3. Servicio de 60 minutos
    const service = await prisma.servicio.upsert({
      where: { id: 'servicio-hu06-60min' },
      update: { nombre: 'Sesión de Asesoría', duracionMinutos: 60, precio: 50.0, activo: true },
      create: {
        id: 'servicio-hu06-60min',
        nombre: 'Sesión de Asesoría',
        duracionMinutos: 60,
        precio: 50.0,
        activo: true,
      },
    });

    // 4. Limpiar citas en la fecha de prueba
    const [y, m, d] = testDate.split('-').map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end = new Date(y, m - 1, d, 23, 59, 59, 999);
    await prisma.cita.deleteMany({
      where: { fechaHoraInicio: { gte: start, lte: end } },
    });

    // 5. Sembrar Cita 1: 10:00 a 11:00 (CONFIRMADA) para TC-HU06-01
    await prisma.cita.create({
      data: {
        clienteId: client.id,
        servicioId: service.id,
        fechaHoraInicio: new Date(y, m - 1, d, 10, 0),
        fechaHoraFin: new Date(y, m - 1, d, 11, 0),
        estado: 'CONFIRMADA',
        precioFinal: 50.0,
      },
    });

    // 6. Sembrar Cita 2: 15:00 a 16:00 (CONFIRMADA) para TC-HU06-02
    await prisma.cita.create({
      data: {
        clienteId: client.id,
        servicioId: service.id,
        fechaHoraInicio: new Date(y, m - 1, d, 15, 0),
        fechaHoraFin: new Date(y, m - 1, d, 16, 0),
        estado: 'CONFIRMADA',
        precioFinal: 50.0,
      },
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/citas');
    await expect(page.getByTestId('header-agenda-date')).toBeVisible({ timeout: 15000 });
  });

  test('TC-HU06-01: Marcar cita como completada', async ({ page }) => {
    // DADO: Que el usuario se encuentra en la agenda y selecciona la fecha de prueba
    await page.getByTestId('input-agenda-date').fill(testDate);
    await expect(page.getByTestId('header-agenda-date')).toContainText(testDate);

    // Ubicar la tarjeta de cita de las 10:00
    const card10 = page.locator('[data-testid="appointment-card"]', {
      hasText: '10:00 - 11:00',
    }).first();
    await expect(card10).toBeVisible({ timeout: 10000 });
    await expect(card10.getByTestId('badge-confirmed')).toBeVisible();

    // CUANDO: Abre detalles y pulsa "Marcar como Completada" (btn-status-completed)
    const btnComplete = card10.getByTestId('btn-status-completed');
    await expect(btnComplete).toBeVisible();
    await btnComplete.click();

    // ENTONCES: El estado cambia a COMPLETADA (badge-completed)
    await expect(card10.getByTestId('badge-completed')).toBeVisible({ timeout: 10000 });
    await expect(card10.getByTestId('badge-confirmed')).toHaveCount(0);
    await expect(card10.getByTestId('btn-status-completed')).toHaveCount(0);
  });

  test('TC-HU06-02: Cancelación de cita y liberación de horario', async ({ page }) => {
    // DADO: Una cita agendada de 15:00 a 16:00 en estado CONFIRMADA
    await page.getByTestId('input-agenda-date').fill(testDate);
    await expect(page.getByTestId('header-agenda-date')).toContainText(testDate);

    const card15 = page.locator('[data-testid="appointment-card"]', {
      hasText: '15:00 - 16:00',
    }).first();
    await expect(card15).toBeVisible({ timeout: 10000 });
    await expect(card15.getByTestId('badge-confirmed')).toBeVisible();

    // CUANDO: Pulsa "Cancelar Cita" (btn-cancel-appointment)
    const btnCancel = card15.getByTestId('btn-cancel-appointment');
    await expect(btnCancel).toBeVisible();
    await btnCancel.click();

    // Se despliega el diálogo modal de confirmación con botón de confirmación
    const btnConfirmCancel = page.getByTestId('btn-confirm-cancel');
    await expect(btnConfirmCancel).toBeVisible({ timeout: 5000 });
    await btnConfirmCancel.click();

    // ENTONCES: El estado cambia a CANCELADA (badge-cancelled y badge-canceled)
    await expect(card15.getByTestId('badge-cancelled')).toBeVisible({ timeout: 10000 });
    await expect(card15.getByTestId('badge-canceled')).toHaveCount(1);
    await expect(card15.getByTestId('btn-cancel-appointment')).toHaveCount(0);

    // Y el intervalo de 15:00 a 16:00 queda liberado para nuevas reservas
    await page.getByTestId('btn-new-appointment').click();
    await expect(page.getByTestId('select-client')).toBeVisible({ timeout: 5000 });

    await selectClientByText(page, 'Laura Ciclo Citas');
    await selectServiceByText(page, 'Sesión de Asesoría');

    await page.getByTestId('input-appointment-date').fill(testDate);
    await page.getByTestId('input-appointment-time').fill('15:00');

    // Comprobar que NO hay conflicto y el botón de confirmar está habilitado
    await expect(page.getByTestId('alert-conflict')).toHaveCount(0);
    const confirmBtn = page.getByTestId('btn-confirm-appointment');
    await expect(confirmBtn).toBeEnabled({ timeout: 5000 });

    // Confirmar la nueva reserva en el bloque liberado
    await confirmBtn.click();

    // Validar que se guardó exitosamente y ahora hay una nueva cita a las 15:00 CONFIRMADA
    await expect(page.getByTestId('input-agenda-date')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('input-agenda-date').fill(testDate);

    // Debe existir una cita en 15:00 - 16:00 con badge-confirmed
    const newCard15 = page.locator('[data-testid="appointment-card"]', {
      hasText: '15:00 - 16:00',
    }).filter({ has: page.getByTestId('badge-confirmed') });
    await expect(newCard15.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-HU06-03: Modal Gestionar Cita y confirmación de cita pendiente', async ({ page }) => {
    // DADO: Una cita en estado PENDIENTE en la fecha de prueba
    const [y, m, d] = testDate.split('-').map(Number);
    const client = await prisma.cliente.findFirst();
    const service = await prisma.servicio.findFirst();
    if (client && service) {
      await prisma.cita.create({
        data: {
          clienteId: client.id,
          servicioId: service.id,
          fechaHoraInicio: new Date(y, m - 1, d, 17, 0),
          fechaHoraFin: new Date(y, m - 1, d, 18, 0),
          estado: 'PENDIENTE',
          precioFinal: 50.0,
        },
      });
    }

    await page.getByTestId('input-agenda-date').fill(testDate);
    await expect(page.getByTestId('header-agenda-date')).toContainText(testDate);

    // Ubicar la tarjeta de cita pendiente de las 17:00
    const card17 = page.locator('[data-testid="appointment-card"]', {
      hasText: '17:00 - 18:00',
    }).first();
    await expect(card17).toBeVisible({ timeout: 10000 });
    await expect(card17.getByTestId('badge-pending')).toBeVisible();

    // CUANDO: El usuario abre el modal "Gestionar" (btn-manage-appointment)
    await card17.getByTestId('btn-manage-appointment').click();

    const manageModal = page.getByTestId('modal-manage-appointment');
    await expect(manageModal).toBeVisible({ timeout: 5000 });

    // Se muestra la opción de confirmar cita en el modal
    const modalBtnConfirm = page.getByTestId('modal-btn-confirm');
    await expect(modalBtnConfirm).toBeVisible();

    // Ejecutar confirmación desde el modal
    await modalBtnConfirm.click();

    // ENTONCES: El modal se cierra y la cita pasa a estado CONFIRMADA
    await expect(manageModal).toBeHidden({ timeout: 5000 });
    await expect(card17.getByTestId('badge-confirmed')).toBeVisible({ timeout: 10000 });
    await expect(card17.getByTestId('badge-pending')).toHaveCount(0);
  });

});
