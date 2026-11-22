import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getTestDates() {
  const today = new Date();
  const d1 = new Date(today);
  d1.setDate(today.getDate() + 10);
  const d2 = new Date(today);
  d2.setDate(today.getDate() + 11);

  const fmt = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return {
    date1: fmt(d1),
    date2: fmt(d2),
  };
}

const { date1, date2 } = getTestDates();

test.describe('HU-05: Visualización y Filtrado de la Agenda de Citas', () => {

  test.beforeAll(async () => {
    // 1. Asegurar cliente y servicio activos
    const client = await prisma.cliente.upsert({
      where: { id: 'carlos-mendez-id' },
      update: { nombre: 'Carlos Méndez', telefono: '555-123456' },
      create: {
        id: 'carlos-mendez-id',
        nombre: 'Carlos Méndez',
        telefono: '555-123456',
        notas: 'Cliente principal HU-05',
      },
    });

    const service = await prisma.servicio.upsert({
      where: { id: 'service-consulta-general' },
      update: { nombre: 'Consulta General', duracionMinutos: 45, precio: 35.0, activo: true },
      create: {
        id: 'service-consulta-general',
        nombre: 'Consulta General',
        duracionMinutos: 45,
        precio: 35.0,
        activo: true,
      },
    });

    // 2. Limpiar y sembrar citas de prueba en date1 y date2
    const cleanDay = async (dateStr: string) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const start = new Date(y, m - 1, d, 0, 0, 0, 0);
      const end = new Date(y, m - 1, d, 23, 59, 59, 999);
      await prisma.cita.deleteMany({
        where: { fechaHoraInicio: { gte: start, lte: end } },
      });
    };

    await cleanDay(date1);
    await cleanDay(date2);

    // Citas en date1: 1 CONFIRMADA, 1 PENDIENTE, 1 CANCELADA
    const [y1, m1, d1] = date1.split('-').map(Number);

    await prisma.cita.create({
      data: {
        clienteId: client.id,
        servicioId: service.id,
        fechaHoraInicio: new Date(y1, m1 - 1, d1, 10, 0),
        fechaHoraFin: new Date(y1, m1 - 1, d1, 10, 45),
        estado: 'CONFIRMADA',
        precioFinal: 35.0,
      },
    });

    await prisma.cita.create({
      data: {
        clienteId: client.id,
        servicioId: service.id,
        fechaHoraInicio: new Date(y1, m1 - 1, d1, 11, 0),
        fechaHoraFin: new Date(y1, m1 - 1, d1, 11, 45),
        estado: 'PENDIENTE',
        precioFinal: 35.0,
      },
    });

    await prisma.cita.create({
      data: {
        clienteId: client.id,
        servicioId: service.id,
        fechaHoraInicio: new Date(y1, m1 - 1, d1, 12, 0),
        fechaHoraFin: new Date(y1, m1 - 1, d1, 12, 45),
        estado: 'CANCELADA',
        precioFinal: 35.0,
      },
    });

    // Cita en date2: 1 CONFIRMADA (09:30 - 10:15)
    const [y2, m2, d2] = date2.split('-').map(Number);
    await prisma.cita.create({
      data: {
        clienteId: client.id,
        servicioId: service.id,
        fechaHoraInicio: new Date(y2, m2 - 1, d2, 9, 30),
        fechaHoraFin: new Date(y2, m2 - 1, d2, 10, 15),
        estado: 'CONFIRMADA',
        precioFinal: 35.0,
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

  test('TC-HU05-01: Navegación entre fechas', async ({ page }) => {
    // DADO: El usuario se encuentra en /citas y selecciona una fecha base
    await page.getByTestId('input-agenda-date').fill(date1);
    await expect(page.getByTestId('header-agenda-date')).toContainText(date1);

    // CUANDO: Pulsa el botón "Día Siguiente" (btn-next-day)
    await page.getByTestId('btn-next-day').click();

    // ENTONCES: La cabecera actualiza la fecha a date2 y se listan las citas de dicho día ordenadas cronológicamente
    await expect(page.getByTestId('header-agenda-date')).toContainText(date2);

    const card = page.getByTestId('appointment-card').first();
    await expect(card).toBeVisible({ timeout: 10000 });
    await expect(card).toContainText('09:30 - 10:15');
    await expect(card).toContainText('Consulta General');
    await expect(card).toContainText('Carlos Méndez');
  });

  test('TC-HU05-02: Filtrar citas por estado', async ({ page }) => {
    // DADO: Un día con citas en diferentes estados (Confirmadas, Pendientes, Canceladas)
    await page.getByTestId('input-agenda-date').fill(date1);
    await expect(page.getByTestId('header-agenda-date')).toContainText(date1);

    // Verificar que existen citas con diferentes estados en vista completa
    await expect(page.getByTestId('badge-confirmed').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('badge-pending').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('badge-cancelled').first()).toBeVisible({ timeout: 10000 });

    // CUANDO: El usuario selecciona el filtro "Confirmadas" (filter-status-confirmed)
    await page.getByTestId('filter-status-confirmed').click();

    // ENTONCES: Solo se muestran las tarjetas con estado CONFIRMADA (badge-confirmed)
    await expect(page.getByTestId('badge-confirmed').first()).toBeVisible();

    const confirmedBadges = page.getByTestId('badge-confirmed');
    const totalConfirmed = await confirmedBadges.count();
    expect(totalConfirmed).toBeGreaterThanOrEqual(1);

    // Las insignias de pendientes y canceladas deben desaparecer del listado filtrado
    await expect(page.getByTestId('badge-pending')).toHaveCount(0);
    await expect(page.getByTestId('badge-cancelled')).toHaveCount(0);
  });

});
