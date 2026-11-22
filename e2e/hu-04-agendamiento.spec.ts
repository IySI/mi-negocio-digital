import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getNextMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const daysUntilMonday = (1 + 7 - day) % 7 || 7;
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  const y = nextMonday.getFullYear();
  const m = String(nextMonday.getMonth() + 1).padStart(2, '0');
  const d = String(nextMonday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const testMonday = getNextMonday();

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

test.describe('HU-04: Agendamiento de Citas con Prevención de Solapamientos', () => {

  test.beforeAll(async () => {
    // 1. Asegurar Horario de Atención para el día Lunes (diaSemana: 1): 09:00 a 18:00 con receso 13:00 a 14:00
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

    // 2. Asegurar que existe el servicio "Consulta General" activo de 45 minutos y $35
    const existingService = await prisma.servicio.findFirst({
      where: { nombre: 'Consulta General' },
    });

    if (existingService) {
      await prisma.servicio.update({
        where: { id: existingService.id },
        data: {
          duracionMinutos: 45,
          precio: 35.0,
          activo: true,
        },
      });
    } else {
      await prisma.servicio.create({
        data: {
          nombre: 'Consulta General',
          duracionMinutos: 45,
          precio: 35.0,
          activo: true,
        },
      });
    }

    // 3. Asegurar clientes de prueba
    await prisma.cliente.upsert({
      where: { id: 'carlos-mendez-id' },
      update: { nombre: 'Carlos Méndez', telefono: '555-123456' },
      create: {
        id: 'carlos-mendez-id',
        nombre: 'Carlos Méndez',
        telefono: '555-123456',
        notas: 'Cliente principal HU-04',
      },
    });

    await prisma.cliente.upsert({
      where: { id: 'ana-gomez-id' },
      update: { nombre: 'Ana Gómez', telefono: '555-0101' },
      create: {
        id: 'ana-gomez-id',
        nombre: 'Ana Gómez',
        telefono: '555-0101',
        notas: 'Cliente secundario HU-04',
      },
    });

    // 4. Limpiar citas del lunes de prueba para asegurar idempotencia inicial
    const [y, m, d] = testMonday.split('-').map(Number);
    const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);

    await prisma.cita.deleteMany({
      where: {
        fechaHoraInicio: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/citas');
    await expect(page.getByTestId('btn-new-appointment')).toBeVisible({ timeout: 15000 });
  });

  test('TC-HU04-01: Agendamiento exitoso en horario disponible', async ({ page }) => {
    // DADO: Horario laboral de lunes de 09:00 a 18:00 sin citas
    await expect(page.getByTestId('btn-new-appointment')).toBeVisible();

    // CUANDO: El usuario abre "Nueva Cita", selecciona cliente "Carlos Méndez", servicio "Consulta General", próximo lunes y hora "10:00"
    await page.getByTestId('btn-new-appointment').click();

    await expect(page.getByTestId('select-client')).toBeVisible({ timeout: 10000 });
    await selectClientByText(page, 'Carlos Méndez');
    await selectServiceByText(page, 'Consulta General');
    await page.getByTestId('input-appointment-date').fill(testMonday);
    await page.getByTestId('input-appointment-time').fill('10:00');

    // ENTONCES: Calcula fin a "10:45", permite pulsar "Confirmar Cita" y se visualiza en la agenda
    await expect(page.getByTestId('calculated-end-time')).toContainText('10:45');
    await expect(page.getByTestId('btn-confirm-appointment')).toBeEnabled({ timeout: 10000 });

    await page.getByTestId('btn-confirm-appointment').click();

    // El modal se cierra y la cita aparece en la agenda
    await expect(page.getByTestId('select-client')).toBeHidden({ timeout: 10000 });

    const card = page.getByTestId('appointment-card').filter({ hasText: 'Carlos Méndez' }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card).toContainText('Carlos Méndez');
    await expect(card).toContainText('Consulta General');
    await expect(card).toContainText('10:00 - 10:45');
    await expect(card).toContainText('CONFIRMADA');
  });

  test('TC-HU04-02: Citas consecutivas continuas (sin buffer obligatorio)', async ({ page }) => {
    // DADO: Existe una cita confirmada de 10:00 a 10:45
    // CUANDO: Agenda una segunda cita el mismo día a las "10:45"
    await page.getByTestId('btn-new-appointment').click();

    await expect(page.getByTestId('select-client')).toBeVisible({ timeout: 10000 });
    await selectClientByText(page, 'Ana Gómez');
    await selectServiceByText(page, 'Consulta General');
    await page.getByTestId('input-appointment-date').fill(testMonday);
    await page.getByTestId('input-appointment-time').fill('10:45');

    // ENTONCES: Valida ausencia de conflicto, fin a "11:30", habilita confirmación y guarda ambas contiguas
    await expect(page.getByTestId('calculated-end-time')).toContainText('11:30');
    await expect(page.getByTestId('alert-conflict')).toBeHidden();
    await expect(page.getByTestId('btn-confirm-appointment')).toBeEnabled({ timeout: 10000 });

    await page.getByTestId('btn-confirm-appointment').click();
    await expect(page.getByTestId('select-client')).toBeHidden({ timeout: 10000 });

    // Verificar que ambas citas aparecen en la agenda
    const card1 = page.getByTestId('appointment-card').filter({ hasText: 'Carlos Méndez' }).first();
    const card2 = page.getByTestId('appointment-card').filter({ hasText: 'Ana Gómez' }).first();

    await expect(card1).toBeVisible({ timeout: 10000 });
    await expect(card1).toContainText('10:00 - 10:45');

    await expect(card2).toBeVisible({ timeout: 10000 });
    await expect(card2).toContainText('10:45 - 11:30');
  });

  test('TC-HU04-03: Rechazo por solapamiento real (Conflicto)', async ({ page }) => {
    // DADO: Cita confirmada de 10:00 a 10:45
    // Asegurar existencia en DB para total idempotencia
    const [y, m, d] = testMonday.split('-').map(Number);
    const start10 = new Date(y, m - 1, d, 10, 0);
    const end1045 = new Date(y, m - 1, d, 10, 45);
    const existing = await prisma.cita.findFirst({
      where: {
        fechaHoraInicio: start10,
        fechaHoraFin: end1045,
        estado: { not: 'CANCELADA' },
      },
    });

    if (!existing) {
      const client = await prisma.cliente.findFirst({ where: { nombre: 'Carlos Méndez' } });
      const service = await prisma.servicio.findFirst({ where: { nombre: 'Consulta General' } });
      if (client && service) {
        await prisma.cita.create({
          data: {
            clienteId: client.id,
            servicioId: service.id,
            fechaHoraInicio: start10,
            fechaHoraFin: end1045,
            precioFinal: service.precio,
            estado: 'CONFIRMADA',
          },
        });
      }
    }

    // CUANDO: Se intenta agendar otra cita para el mismo día a las 10:30
    await page.getByTestId('btn-new-appointment').click();

    await expect(page.getByTestId('select-client')).toBeVisible({ timeout: 10000 });
    await selectServiceByText(page, 'Consulta General');
    await page.getByTestId('input-appointment-date').fill(testMonday);
    await page.getByTestId('input-appointment-time').fill('10:30');

    // ENTONCES: Detecta solapamiento, muestra advertencia alert-conflict y deshabilita confirmación
    const alert = page.getByTestId('alert-conflict');
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText('El horario seleccionado entra en conflicto con otra cita activa');
    await expect(page.getByTestId('btn-confirm-appointment')).toBeDisabled();
  });

  test('TC-HU04-04: Rechazo fuera de horario o en receso', async ({ page }) => {
    // DADO: Receso laboral de 13:00 a 14:00
    // CUANDO: Se intenta programar una cita que inicia a las 13:15
    await page.getByTestId('btn-new-appointment').click();

    await expect(page.getByTestId('select-client')).toBeVisible({ timeout: 10000 });
    await selectServiceByText(page, 'Consulta General');
    await page.getByTestId('input-appointment-date').fill(testMonday);
    await page.getByTestId('input-appointment-time').fill('13:15');

    // ENTONCES: El sistema bloquea la acción notificando horario no hábil / receso
    const alert = page.getByTestId('alert-schedule-out');
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText('fuera de la jornada de atención o en horario de receso');
    await expect(page.getByTestId('btn-confirm-appointment')).toBeDisabled();
  });

});
