# Mi Negocio Digital 🚀

Aplicación web full-stack ágil, autónoma y monolítica diseñada para que profesionales independientes y pequeños comercios gestionen de forma centralizada sus clientes, catálogo de servicios, horarios laborales y programación de citas, eliminando colisiones y solapamientos de turnos.

Proyecto desarrollado con la metodología de agentes y skills especializadas de **Google Antigravity**.

---

## 🛠️ Pila Tecnológica (Tech Stack)

* **Framework Full-Stack**: [Next.js](https://nextjs.org/) (App Router, Server Components y Server Actions)
* **Lenguaje**: [TypeScript](https://www.typescriptlang.org/) (Tipado estático de extremo a extremo)
* **Estilos y UI**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
* **ORM & Persistencia**: [Prisma ORM](https://www.prisma.io/) con base de datos local [SQLite](https://www.sqlite.org/)
* **Validación de Esquemas**: [Zod](https://zod.dev/)
* **Aseguramiento de Calidad (QA)**: [Playwright](https://playwright.dev/) (Pruebas E2E automatizadas y visuales)

---

## ✨ Características Principales

1. **Configuración de Negocio y Horarios (HU-01)**: Definición de datos comerciales, moneda, jornadas laborales por día y receso de almuerzo.
2. **Catálogo de Servicios (HU-02)**: Creación, edición reactiva, activación/desactivación y eliminación de prestaciones con validación de citas previas.
3. **Directorio de Clientes (HU-03)**: Registro de clientes con teléfono, email, notas de preferencias y búsqueda dinámica en tiempo real.
4. **Agendamiento Anticolisión (HU-04)**: Validación estricta de disponibilidad, adyacencia continua de turnos y bloqueo automático ante solapamientos o fuera de jornada.
5. **Visualización y Filtros de Agenda (HU-05)**: Navegación cronológica por fechas (Día anterior, Hoy, Día siguiente) y filtrado interactivo por estados.
6. **Ciclo de Vida de Citas (HU-06)**: Transiciones de estado (Pendiente, Confirmada, Completada, Cancelada) con liberación automática de cupos horarios.
7. **Reprogramación de Citas (HU-07)**: Modificación asistida de fecha y hora con validación de disponibilidad en tiempo real.
8. **Dashboard Operativo Diario (HU-08)**: Métricas diarias de citas, lista cronológica del día y accesos directos de operación rápida.
9. **Centro de Gestión de Citas**: Menú de acciones contextualizado (`btn-manage-appointment`) que protege el historial en citas finalizadas.

---

## 🏗️ Estructura del Proyecto

```text
mi-negocio-digital/
├── .gemini/skills/            # Skills de Antigravity (analista, desarrollador, QA)
├── docs/                      # Documentación maestra y artefactos técnicos
│   ├── arquitectura.md        # Arquitectura y decisiones técnicas (D1 - D6)
│   ├── relaciones-historias-pruebas.md # Trazabilidad HU - Pruebas E2E - QA
│   └── tablero-historias.md   # Tablero de progreso y bitácora
├── prisma/
│   └── schema.prisma          # Esquema relacional Prisma
├── src/
│   ├── actions/               # Server Actions (citas, clientes, servicios, etc.)
│   ├── app/                   # Rutas y páginas de Next.js (App Router)
│   └── lib/                   # Configuración de Prisma y esquemas Zod
├── e2e/                       # Suites de pruebas automatizadas con Playwright
├── ejecutar-pruebas-visual.bat # Lanzador visual para Windows con Chromium y slowMo
└── README.md
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* [Node.js](https://nodejs.org/) v18.18+ (recomendado v20+)
* npm (incluido con Node.js)

### Pasos

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/IySI/mi-negocio-digital.git
   cd mi-negocio-digital
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**:
   Copiar el archivo de ejemplo para desarrollo local:
   ```bash
   cp .env.example .env
   ```

4. **Inicializar la base de datos SQLite**:
   ```bash
   npx prisma db push
   ```

5. **Iniciar el servidor de desarrollo**:
   ```bash
   npm run dev
   ```
   Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 🧪 Pruebas Automatizadas y QA

El proyecto cuenta con un entorno aislado para pruebas E2E utilizando `prisma/test.db` en el puerto `3001` sin alterar los datos de desarrollo.

* **Ejecutar todas las pruebas E2E (Modo Headless)**:
  ```bash
  npx playwright test
  ```

* **Ejecutar demostración visual en Windows (Chromium con slowMo: 1000ms)**:
  Doble clic en `ejecutar-pruebas-visual.bat` o ejecutar desde la consola:
  ```cmd
  ejecutar-pruebas-visual.bat
  ```

---

## 📄 Licencia

Este proyecto es privado y fue desarrollado con fines demostrativos y profesionales.
