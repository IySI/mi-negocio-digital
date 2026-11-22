# Documento Maestro de Especificación y Planificación

> **Proyecto**: Mi Negocio Digital  
> **Estado**: Aprobado para Fase de Desarrollo  
> **Fecha de Aprobación**: Noviembre 2026  
> **Tipo de Aplicación**: Web Full-Stack Autónoma (Next.js + SQLite / Prisma)

---

## 1. Resumen Ejecutivo
**Mi Negocio Digital** es una aplicación web ágil y autónoma diseñada para que pequeños negocios y profesionales independientes gestionen de manera centralizada sus clientes, catálogo de servicios, horarios de atención y programación de citas, erradicando solapamientos y desorganización. 

El MVP es **estrictamente administrativo** (sin portal público de reservas), opera en entorno local sin autenticación durante el desarrollo (con autenticación obligatoria previo a cualquier despliegue público) y admite citas consecutivas continuas sin tiempos muertos obligatorios.

---

## 2. Índice de Documentación de Planificación

Toda la especificación técnica y funcional detallada se encuentra dividida modularmente en los siguientes documentos aprobados:

| Fase | Documento | Contenido Principal |
| :---: | :--- | :--- |
| **01** | [01 - Núcleo de la Aplicación y MVP](./01-nucleo-y-mvp.md) | Problema, público objetivo, propuesta de valor, alcance administrativo del MVP, exclusiones y métricas de éxito. |
| **02** | [02 - Experiencia de Usuario (UX)](./02-experiencia-usuario-ux.md) | Roles de usuario, mapa de rutas (`/dashboard`, `/citas`, `/clientes`, `/servicios`, `/horarios`), flujos operativos y estructura conceptual de pantallas. |
| **03** | [03 - Requisitos de Calidad](./03-requisitos-de-calidad.md) | Rendimiento (FCP < 1.2s), privacidad y soberanía de datos (SQLite local), transaccionalidad, adyacencia de citas y estándares para Playwright. |
| **04** | [04 - Datos y Tecnología](./04-datos-y-tecnologia.md) | Modelo entidad-relación (ER), justificación del stack (Next.js, TypeScript, Tailwind CSS, Prisma, SQLite), arquitectura y preparación para GitHub/AWS Lightsail. |
| **05** | [05 - Historias de Usuario](./05-historias-de-usuario.md) | 8 Historias de Usuario priorizadas con criterios de aceptación en formato BDD y selectores `data-testid` estandarizados para Playwright. |

---

## 3. Matriz Síntesis de Historias de Usuario (MVP)

| Código | Título de la Historia | Módulo | Prioridad | Selectores Clave (`data-testid`) |
| :--- | :--- | :--- | :--- | :--- |
| **HU-01** | Configuración de Datos y Horarios | Configuración / Horarios | **Must have** | `toggle-day-[id]`, `input-open-[id]`, `input-close-[id]`, `btn-save-schedule` |
| **HU-02** | Catálogo de Servicios | Servicios | **Must have** | `btn-new-service`, `input-service-name`, `input-service-price`, `btn-save-service` |
| **HU-03** | Directorio de Clientes | Clientes | **Must have** | `btn-new-client`, `input-client-name`, `input-search-clients`, `btn-save-client` |
| **HU-04** | Agendamiento y Detección de Conflictos | Citas / Agenda | **Must have** | `btn-new-appointment`, `select-client`, `input-appointment-date`, `btn-confirm-appointment`, `alert-conflict` |
| **HU-05** | Visualización y Filtrado de Agenda | Citas / Agenda | **Must have** | `btn-prev-day`, `btn-next-day`, `filter-status-confirmed`, `badge-confirmed` |
| **HU-06** | Ciclo de Vida de Citas | Citas / Agenda | **Must have** | `btn-status-completed`, `btn-cancel-appointment`, `btn-confirm-cancel`, `badge-completed` |
| **HU-07** | Reprogramación con Validación | Citas / Agenda | **Should have** | `btn-reschedule`, `btn-save-reschedule` |
| **HU-08** | Dashboard Operativo Diario | Panel Principal | **Should have** | `metric-today-appointments`, `metric-pending-appointments` |

---

## 4. Hoja de Ruta de Implementación (Roadmap)

```
┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│ Paso 1: Inicialización │ ──> │ Paso 2: Base de Datos  │ ──> │ Paso 3: Core y Flujos  │
│  Setup Next.js, TS,    │     │  Esquema Prisma SQLite │     │  CRUD Servicios,       │
│  Tailwind y Playwright │     │  Migraciones y Seed    │     │  Horarios y Clientes   │
└────────────────────────┘     └────────────────────────┘     └────────────────────────┘
                                                                           │
                                                                           ▼
┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│ Paso 6: Listo para     │ <── │ Paso 5: Automatización │ <── │ Paso 4: Motor de Citas │
│ Despliegue (GitHub/VPS)│     │  Tests E2E Playwright  │     │  Algoritmo Anticolisión│
│  y Capa de Auth previa │     │  validando las 8 HUs   │     │  y Agenda / Dashboard  │
└────────────────────────┘     └────────────────────────┘     └────────────────────────┘
```

1. **Paso 1: Setup del Proyecto**: Inicialización con Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons y configuración inicial de Playwright.
2. **Paso 2: Modelado de Datos**: Definición de `schema.prisma` con SQLite, generación del cliente Prisma y script de seeding para pruebas.
3. **Paso 3: Módulos Base (Configuración, Servicios, Clientes)**: Implementación de Server Actions y formularios con validación Zod.
4. **Paso 4: Motor de Citas y Dashboard**: Lógica de solapamiento (adyacencia permitida sin buffer), vistas de agenda y tarjetas del día.
5. **Paso 5: Pruebas Automatizadas con Playwright**: Creación y ejecución de la suite de pruebas E2E verificando los criterios de las 8 HUs.
6. **Paso 6: Preparación de Despliegue y Repositorio**: `README.md`, configuración de `.gitignore`, scripts de build y preparación de la capa de autenticación antes de publicar en AWS Lightsail.

---

## 5. Lista de Verificación Previa a la Codificación

- [x] Alcance del MVP delimitado estrictamente a gestión administrativa interna (aprobado).
- [x] Requisito de autenticación resuelto (sin auth local en desarrollo; obligatoria antes de despliegue público).
- [x] Regla de agendamiento contiguo sin buffer obligatorio acordada e integrada.
- [x] Selectores `data-testid` unificados y consistentes entre diseño UX, requisitos de calidad e historias de usuario.
- [x] Criterios de aceptación estructurados en formato BDD para automatización directa con Playwright.
- [x] Especificaciones y 5 fases archivadas en `docs/`.
