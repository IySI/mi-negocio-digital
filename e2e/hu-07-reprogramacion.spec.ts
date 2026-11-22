import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getFutureMonday(): string {
  const today = new Date();
  const target = new Date(today);
  target.setDate(today.getDate() + 28); // 4 semanas adelante
  const day = target.getDay();
  const daysUntilMonday = (1 + 7 - day) % 7 || 7;
  target.setDate(target.getDate() + daysUntilMonday);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const testDate = getFutureMonday();

test.describe('HU-07: Reprogramación de Citas con Validación Horaria', () => {

  test.beforeAll(async () => {
    // 1. Horario de atención para lunes (09:00 a 18:00, receso 13:00 a 14:00)
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
      where: { id: 'cliente-hu07-test' },
      update: { nombre: 'Andrés Reprogramación', telefono: '555-443322' },
      create: {
        id: 'cliente-hu07-test',
        nombre: 'Andrés Reprogramación',
        telefono: '555-443322',
        notas: 'Cliente para pruebas de reprogramación',
      },
    });

    // 3. Servicio de 45 minutos
    const service = await prisma.servicio.upsert({
      where: { id: 'servicio-hu07-45min' },
      update: { nombre: 'Consulta Reprogramada', duracionMinutos: 45, precio: 40.0, activo: true },
      create: {
        id: 'servicio-hu07-45min',
        nombre: 'Consulta Reprogramada',
        duracionMinutos: 45,
        precio: 40.0,
        activo: true,
      },
    });

    // 4. Limpiar citas existentes en la fecha de prueba
    const [y, m, d] = testDate.split('-').map(Number);
    const start = new Date(y, m - 1, d, 0, 0, 0, 0);
    const end = new Date(y, m - 1, d, 23, 59, 59, 999);
    await prisma.cita.deleteMany({
      where: { fechaHoraInicio: { gte: start, lte: end } },
    });

    // 5. Sembrar Cita Inicial: 11:00 a 11:45 (CONFIRMADA)
    await prisma.cita.create({
      data: {
        id: 'cita-hu07-1100',
        clienteId: client.id,
        servicioId: service.id,
        fechaHoraInicio: new Date(y, m - 1, d, 11, 0),
        fechaHoraFin: new Date(y, m - 1, d, 11, 45),
        estado: 'CONFIRMADA',
        precioFinal: 40.0,
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

  test('TC-HU07-01: Reprogramación exitosa con verificación de disponibilidad', async ({ page }) => {
    // DADO: Una cita agendada para el lunes a las 11:00 (11:00 - 11:45)
    await page.getByTestId('input-agenda-date').fill(testDate);
    await expect(page.getByTestId('header-agenda-date')).toContainText(testDate);

    const card11 = page.locator('[data-testid="appointment-card"]', {
      hasText: '11:00 - 11:45',
    }).first();
    await expect(card11).toBeVisible({ timeout: 10000 });
    await expect(card11).toContainText('Andrés Reprogramación');
    await expect(card11.getByTestId('badge-confirmed')).toBeVisible();

    // CUANDO: Pulsa "Reprogramar" (btn-reschedule)
    const btnReschedule = card11.getByTestId('btn-reschedule');
    await expect(btnReschedule).toBeVisible();
    await btnReschedule.click();

    // Se despliega el modal de reprogramación
    const inputTime = page.getByTestId('input-reschedule-time');
    await expect(inputTime).toBeVisible({ timeout: 5000 });

    // Cambia la hora a "16:00"
    await inputTime.fill('16:00');

    // Se verifica ausencia de conflicto y botón de guardar habilitado
    await expect(page.getByTestId('alert-conflict')).toHaveCount(0);
    const btnSave = page.getByTestId('btn-save-reschedule');
    await expect(btnSave).toBeEnabled({ timeout: 5000 });

    // Pulsa "Guardar Cambio" (btn-save-reschedule)
    await btnSave.click();

    // ENTONCES: La cita se actualiza tras verificar que no existen colisiones en el nuevo bloque
    const toastSuccess = page.getByTestId('toast-reschedule-success');
    await expect(toastSuccess).toBeVisible({ timeout: 10000 });
    await expect(toastSuccess).toContainText('Cita reprogramada exitosamente');

    // La cita en el listado ahora muestra el nuevo horario de 16:00 a 16:45
    const card16 = page.locator('[data-testid="appointment-card"]', {
      hasText: '16:00 - 16:45',
    }).first();
    await expect(card16).toBeVisible({ timeout: 10000 });
    await expect(card16).toContainText('Andrés Reprogramación');
    await expect(card16.getByTestId('badge-confirmed')).toBeVisible();

    // El horario previo de 11:00 a 11:45 ya no pertenece a esta cita
    const oldCard = page.locator('[data-testid="appointment-card"]', {
      hasText: '11:00 - 11:45',
    });
    await expect(oldCard).toHaveCount(0);
  });

});
