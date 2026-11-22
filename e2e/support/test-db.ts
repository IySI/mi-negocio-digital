import fs from 'fs';
import path from 'path';

/**
 * Utilidad para gestión del entorno aislado SQLite en pruebas E2E.
 * Asegura que las pruebas de Playwright corran contra una base de datos limpia (test.db).
 */
export const TEST_DB_PATH = path.resolve(__dirname, '../../prisma/test.db');
export const TEST_DB_JOURNAL_PATH = path.resolve(__dirname, '../../prisma/test.db-journal');

export function resetTestDatabase(): void {
  // Asegurar existencia del directorio prisma
  const prismaDir = path.dirname(TEST_DB_PATH);
  if (!fs.existsSync(prismaDir)) {
    fs.mkdirSync(prismaDir, { recursive: true });
  }

  // Eliminar base de datos y journal de pruebas anteriores si existen
  if (fs.existsSync(TEST_DB_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_PATH);
    } catch {
      // Ignorar si el proceso aún tiene lock temporal
    }
  }

  if (fs.existsSync(TEST_DB_JOURNAL_PATH)) {
    try {
      fs.unlinkSync(TEST_DB_JOURNAL_PATH);
    } catch {
      // Ignorar
    }
  }
}
