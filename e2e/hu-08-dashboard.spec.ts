import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('HU-08: Dashboard Operativo Diario y Accesos Rápidos', () => {

  test.beforeAll(async () => {
    // 1. Cliente de prueba para el dashboard
    const client = await prisma.cliente.upsert({
      where: { id: 'cliente-hu08-test' },
      update: { nombre: 'Marcos Dashboard', telefono: '555-998877' },
      create: {
        id: 'cliente-hu08-test',
        nombre: 'Marcos Dashboard',
        telefono: '555-998877',
        notas: 'Cliente principal HU-08 Dashboard',
      },
    });

    // 2. Servicio de prueba para el dashboard
    const service = await prisma.servicio.upsert({
      where: { id: 'servicio-hu08-test' },
      update: { nombre: 'Evaluación Operativa', duracionMinutos: 45, precio: 45.0, activo: true },
      create: {
        id: 'servicio-hu08-test',
        nombre: 'Evaluación Operativa',
        duracionMinutos: 45,
        precio: 45.0,
        activo: true,
      },
    });

    // 3. Limpiar citas existentes del día actual en la base de datos de test
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    const todayStart = new Date(y, m, d, 0, 0, 0, 0);
    const todayEnd = new Date(y, m, d, 23, 59, 59, 999);

    await prisma.cita.deleteMany({
      where: { fechaHoraInicio: { gte: todayStart, lte: todayEnd } },
    });

    // 4. Sembrar Cita 1 de Hoy: 09:30 - 10:15 (CONFIRMADA)
    await prisma.cita.create({
      data: {
        id: 'cita-hu08-01',
        clienteId: client.id,
        servicioId: service.id,
        fechaHoraInicio: new Date(y, m, d, 9, 30),
        fechaHoraFin: new Date(y, m, d, 10, 15),
        estado: 'CONFIRMADA',
        precioFinal: 45.0,
      },
    });

    // 5. Sembrar Cita 2 de Hoy: 14:00 - 14:45 (PENDIENTE)
    await prisma.cita.create({
      data: {
        id: 'cita-hu08-02',
        clienteId: client.id,
        servicioId: service.id,
        fechaHoraInicio: new Date(y, m, d, 14, 0),
        fechaHoraFin: new Date(y, m, d, 14, 45),
        estado: 'PENDIENTE',
        precioFinal: 45.0,
      },
    });
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('TC-HU08-01: Visualizar métricas del día actual y agenda de próximas citas', async ({ page }) => {
    test.setTimeout(60000);

    // DADO: El usuario ingresa a /dashboard
    await page.goto('/dashboard');

    // CUANDO: La página carga
    const metricToday = page.getByTestId('metric-today-appointments');
    await expect(metricToday).toBeVisible({ timeout: 15000 });

    // ENTONCES: Se muestran las tarjetas de: citas de hoy (metric-today-appointments)
    await expect(metricToday).toHaveText('2');

    // Y citas pendientes (metric-pending-appointments)
    const metricPending = page.getByTestId('metric-pending-appointments');
    await expect(metricPending).toBeVisible();
    await expect(metricPending).toHaveText('1');

    // Y el listado de próximas citas del día (dashboard-appointments-list)
    const appointmentsList = page.getByTestId('dashboard-appointments-list');
    await expect(appointmentsList).toBeVisible();

    // Validar las citas listadas en orden cronológico dentro de la agenda de hoy
    const cards = appointmentsList.locator('[data-testid="appointment-card"]');
    await expect(cards).toHaveCount(2);

    // Cita 1: 09:30 - 10:15 (CONFIRMADA)
    const firstCard = cards.nth(0);
    await expect(firstCard).toContainText('09:30 - 10:15');
    await expect(firstCard).toContainText('Marcos Dashboard');
    await expect(firstCard).toContainText('Evaluación Operativa');
    await expect(firstCard.getByTestId('badge-confirmed')).toBeVisible();

    // Cita 2: 14:00 - 14:45 (PENDIENTE)
    const secondCard = cards.nth(1);
    await expect(secondCard).toContainText('14:00 - 14:45');
    await expect(secondCard).toContainText('Marcos Dashboard');
    await expect(secondCard).toContainText('Evaluación Operativa');
    await expect(secondCard.getByTestId('badge-pending')).toBeVisible();

    // Validar los accesos rápidos a las funcionalidades principales
    await expect(page.getByTestId('btn-new-appointment')).toBeVisible();
    await expect(page.getByTestId('quick-action-agenda')).toBeVisible();
    await expect(page.getByTestId('quick-action-clients')).toBeVisible();
    await expect(page.getByTestId('quick-action-services')).toBeVisible();
    await expect(page.getByTestId('quick-action-schedule')).toBeVisible();
  });

});
