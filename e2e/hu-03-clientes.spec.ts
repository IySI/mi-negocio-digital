import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test.describe('HU-03: Registro y Directorio de Clientes', () => {

  test.beforeAll(async () => {
    // Asegurar condición previa del BDD: Existencia de al menos 10 clientes registrados en test.db
    const count = await prisma.cliente.count();
    if (count < 10) {
      const sampleClients = [
        { nombre: 'Ana Gómez', telefono: '555-0101', notas: 'Cliente frecuente' },
        { nombre: 'Beatriz Silva', telefono: '555-0102', notas: 'Prefiere citas por la tarde' },
        { nombre: 'Daniel Ríos', telefono: '555-0103', notas: '' },
        { nombre: 'Elena Morales', telefono: '555-0104', notas: 'Alérgica a productos con alcohol' },
        { nombre: 'Fernando Torres', telefono: '555-0105', notas: 'Atención preferencial' },
        { nombre: 'Gabriela Castro', telefono: '555-0106', notas: '' },
        { nombre: 'Hugo Ortiz', telefono: '555-0107', notas: 'Llamar antes de confirmar' },
        { nombre: 'Isabel Vargas', telefono: '555-0108', notas: '' },
        { nombre: 'Javier Ramos', telefono: '555-0109', notas: 'Solicita factura A' },
        { nombre: 'Lucía Paredes', telefono: '555-0110', notas: 'Turnos express' },
      ];

      const toCreate = 10 - count;
      for (let i = 0; i < toCreate; i++) {
        await prisma.cliente.create({
          data: {
            nombre: sampleClients[i]?.nombre || `Cliente Base ${i + 1}`,
            telefono: sampleClients[i]?.telefono || `555-099${i}`,
            notas: sampleClients[i]?.notas || 'Generado para pruebas automáticas',
          },
        });
      }
    }
  });

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    // Navegar al directorio de clientes
    await page.goto('/clientes');
    await expect(page.getByTestId('btn-new-client')).toBeVisible({ timeout: 15000 });
  });

  test('TC-HU03-01: Registro de nuevo cliente', async ({ page }) => {
    // DADO: El usuario se encuentra en /clientes
    await expect(page.getByTestId('btn-new-client')).toBeVisible();

    // CUANDO: Pulsa "Nuevo Cliente", ingresa "Carlos Méndez", teléfono "555-123456", notas "Prefiere turnos de mañana" y pulsa "Guardar Cliente"
    await page.getByTestId('btn-new-client').click();

    // El modal debe abrirse
    await expect(page.getByTestId('input-client-name')).toBeVisible({ timeout: 10000 });
    await page.getByTestId('input-client-name').fill('Carlos Méndez');
    await page.getByTestId('input-client-phone').fill('555-123456');
    await page.getByTestId('input-client-notes').fill('Prefiere turnos de mañana');

    // Guardar cliente
    await page.getByTestId('btn-save-client').click();

    // ENTONCES: El modal se cierra y el cliente se muestra en la tabla del directorio (client-row)
    await expect(page.getByTestId('input-client-name')).toBeHidden({ timeout: 10000 });

    const clientRow = page.getByTestId('client-row').filter({ hasText: 'Carlos Méndez' }).first();
    await expect(clientRow).toBeVisible({ timeout: 10000 });
    await expect(clientRow).toContainText('Carlos Méndez');
    await expect(clientRow).toContainText('555-123456');
    await expect(clientRow).toContainText('Prefiere turnos de mañana');
  });

  test('TC-HU03-02: Búsqueda dinámica de clientes', async ({ page }) => {
    // DADO: Que existen al menos 10 clientes registrados
    const initialRows = page.getByTestId('client-row');
    const totalCount = await initialRows.count();
    expect(totalCount).toBeGreaterThanOrEqual(10);

    // CUANDO: El usuario escribe "Carlos" en el buscador (input-search-clients)
    await expect(page.getByTestId('input-search-clients')).toBeVisible();
    await page.getByTestId('input-search-clients').fill('Carlos');

    // ENTONCES: La tabla filtra instantáneamente mostrando únicamente las filas coincidentes
    const filteredRows = page.getByTestId('client-row');
    await expect(filteredRows.first()).toBeVisible({ timeout: 5000 });
    const filteredCount = await filteredRows.count();

    expect(filteredCount).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < filteredCount; i++) {
      await expect(filteredRows.nth(i)).toContainText('Carlos');
    }

    // Limpiar búsqueda para restaurar vista
    await page.getByTestId('input-search-clients').clear();
    await expect(page.getByTestId('client-row')).toHaveCount(totalCount);
  });

});
