# 05 - Historias de Usuario con Criterios de Aceptación

Este documento define las Historias de Usuario (HU) del Producto Mínimo Viable (MVP) para **Mi Negocio Digital**. Cada historia cuenta con criterios de aceptación en formato BDD (*Dado / Cuando / Entonces*) y la especificación de selectores `data-testid` para su posterior automatización mediante pruebas de integración con **Playwright**.

---

## Resumen de Historias del MVP

| ID | Título | Módulo | Prioridad (MoSCoW) |
| :--- | :--- | :--- | :--- |
| **HU-01** | Configuración de Datos del Negocio y Horarios de Atención | Configuración | **Must have** |
| **HU-02** | Gestión del Catálogo de Servicios | Servicios | **Must have** |
| **HU-03** | Registro y Directorio de Clientes | Clientes | **Must have** |
| **HU-04** | Agendamiento de Citas con Prevención de Solapamientos | Citas / Agenda | **Must have** |
| **HU-05** | Visualización y Filtrado de la Agenda de Citas | Citas / Agenda | **Must have** |
| **HU-06** | Gestión del Ciclo de Vida de Citas (Confirmar, Completar, Cancelar) | Citas / Agenda | **Must have** |
| **HU-07** | Reprogramación de Citas con Revalidación Horaria | Citas / Agenda | **Should have** |
| **HU-08** | Dashboard Operativo Diario y Accesos Rápidos | Panel Principal | **Should have** |

---

### HU-01: Configuración de Datos del Negocio y Horarios de Atención
- **Historia**: Como administrador del negocio, quiero registrar los datos de mi empresa y definir los días y horas en que presto servicios, para que las citas solo puedan agendarse en mis horarios laborales reales.
- **Prioridad**: **Must have**
- **Criterios de Aceptación (Playwright Ready)**:
  - **Escenario 1: Configurar horario laboral con receso de almuerzo**
    - **Dado** que el usuario ingresa a la vista de `/horarios`,
    - **Cuando** activa el interruptor de lunes (`data-testid="toggle-day-1"`), ingresa hora de apertura "09:00" (`data-testid="input-open-1"`), hora de cierre "18:00" (`data-testid="input-close-1"`), receso de "13:00" a "14:00" (`data-testid="input-lunch-start-1"`, `data-testid="input-lunch-end-1"`) y pulsa "Guardar Horarios" (`data-testid="btn-save-schedule"`),
    - **Entonces** el sistema guarda la configuración en SQLite y muestra un mensaje de éxito (`data-testid="toast-success"`).
  - **Escenario 2: Validación de hora de cierre previa a hora de apertura**
    - **Dado** que el usuario configura una hora de apertura "18:00" y una hora de cierre "09:00",
    - **Cuando** pulsa "Guardar Horarios",
    - **Entonces** el sistema no guarda y muestra una advertencia visual (`data-testid="alert-error-schedule"`) indicando que la hora de cierre debe ser posterior a la de apertura.

---

### HU-02: Gestión del Catálogo de Servicios
- **Historia**: Como profesional, quiero dar de alta, editar y listar mis servicios con su duración y tarifa, para que al agendar una cita el sistema calcule automáticamente el tiempo y costo correspondiente.
- **Prioridad**: **Must have**
- **Criterios de Aceptación (Playwright Ready)**:
  - **Escenario 1: Creación exitosa de un nuevo servicio**
    - **Dado** que el usuario se encuentra en `/servicios`,
    - **Cuando** hace clic en "Nuevo Servicio" (`data-testid="btn-new-service"`), completa el nombre "Consulta General" (`data-testid="input-service-name"`), duración "45" (`data-testid="input-service-duration"`), precio "35.00" (`data-testid="input-service-price"`) y pulsa "Guardar" (`data-testid="btn-save-service"`),
    - **Entonces** el modal se cierra y la lista en pantalla contiene una tarjeta con el texto "Consulta General" y "$35.00" (`data-testid="service-card-item"`).
  - **Escenario 2: Desactivar temporalmente un servicio sin eliminarlo**
    - **Dado** un servicio existente en la lista,
    - **Cuando** el usuario pulsa en el interruptor de estado (`data-testid="toggle-service-active-[id]"`),
    - **Entonces** el servicio cambia su insignia visual a "Inactivo" y no aparecerá disponible en el selector de nuevas citas.

---

### HU-03: Registro y Directorio de Clientes
- **Historia**: Como profesional, quiero registrar a mis clientes con su nombre y datos de contacto, para mantener un directorio organizado y consultar su historial de citas.
- **Prioridad**: **Must have**
- **Criterios de Aceptación (Playwright Ready)**:
  - **Escenario 1: Registro de un nuevo cliente**
    - **Dado** que el usuario está en `/clientes`,
    - **Cuando** hace clic en "Nuevo Cliente" (`data-testid="btn-new-client"`), escribe el nombre "Carlos Méndez" (`data-testid="input-client-name"`), teléfono "555-123456" (`data-testid="input-client-phone"`), notas "Prefiere turnos de mañana" (`data-testid="input-client-notes"`) y pulsa "Guardar Cliente" (`data-testid="btn-save-client"`),
    - **Entonces** el cliente aparece reflejado en la tabla del directorio (`data-testid="client-row"`).
  - **Escenario 2: Búsqueda dinámica de clientes**
    - **Dado** que existen 10 clientes registrados,
    - **Cuando** el usuario escribe "Carlos" en el campo de búsqueda (`data-testid="input-search-clients"`),
    - **Entonces** la tabla filtra instantáneamente mostrando únicamente las filas de clientes que coinciden con el término.

---

### HU-04: Agendamiento de Citas con Prevención de Solapamientos
- **Historia**: Como profesional, quiero programar una cita seleccionando cliente, servicio, fecha y hora, garantizando que el sistema impida solapamientos con otras citas o fuera de mi horario laboral.
- **Prioridad**: **Must have**
- **Criterios de Aceptación (Playwright Ready)**:
  - **Escenario 1: Agendamiento exitoso en horario disponible**
    - **Dado** que el horario laboral del día lunes está configurado de 09:00 a 18:00 sin citas previas,
    - **Cuando** el usuario abre "Nueva Cita" (`data-testid="btn-new-appointment"`), selecciona al cliente "Carlos Méndez" (`data-testid="select-client"`), el servicio "Consulta General" (45 min) (`data-testid="select-service"`), fecha del próximo lunes (`data-testid="input-appointment-date"`) y hora de inicio "10:00" (`data-testid="input-appointment-time"`),
    - **Entonces** el sistema calcula la hora fin a "10:45", permite pulsar "Confirmar Cita" (`data-testid="btn-confirm-appointment"`) y la cita se visualiza en la agenda.
  - **Escenario 2: Permitir citas consecutivas inmediatas sin buffer obligatorio**
    - **Dado** que existe una cita confirmada de 10:00 a 10:45 para el cliente A,
    - **Cuando** el usuario agenda una nueva cita para el cliente B el mismo día iniciando exactamente a las "10:45",
    - **Entonces** el sistema valida que no hay solapamiento, habilita "Confirmar Cita" (`data-testid="btn-confirm-appointment"`) y guarda ambas citas contiguas exitosamente.
  - **Escenario 3: Rechazo automático de cita por solapamiento real (Conflicto)**
    - **Dado** que ya existe una cita confirmada de 10:00 a 10:45,
    - **Cuando** el usuario intenta programar otra cita para el mismo día a las 10:30,
    - **Entonces** el sistema detecta el solapamiento, muestra un mensaje de advertencia (`data-testid="alert-conflict"`) con el texto *"El horario seleccionado entra en conflicto con otra cita activa"* y deshabilita el botón de confirmación.
  - **Escenario 4: Rechazo de cita fuera de horario de atención o en hora de receso**
    - **Dado** que el negocio tiene receso de 13:00 a 14:00,
    - **Cuando** se intenta programar una cita que inicia a las 13:15,
    - **Entonces** el sistema bloquea la acción notificando que el horario está fuera de la jornada de atención.

---

### HU-05: Visualización y Filtrado de la Agenda de Citas
- **Historia**: Como profesional, quiero consultar la agenda del día o de la semana y filtrar por estado, para tener visibilidad clara de mi jornada de trabajo.
- **Prioridad**: **Must have**
- **Criterios de Aceptación (Playwright Ready)**:
  - **Escenario 1: Navegar entre fechas**
    - **Dado** que el usuario se encuentra en `/citas`,
    - **Cuando** pulsa el botón "Día Siguiente" (`data-testid="btn-next-day"`),
    - **Entonces** la cabecera actualiza la fecha y se listan las citas de dicho día ordenadas cronológicamente.
  - **Escenario 2: Filtrar citas por estado**
    - **Dado** un día con citas en diferentes estados (Confirmadas, Pendientes, Canceladas),
    - **Cuando** el usuario selecciona el filtro "Confirmadas" (`data-testid="filter-status-confirmed"`),
    - **Entonces** solo se muestran las tarjetas con estado *CONFIRMADA* (`data-testid="badge-confirmed"`).

---

### HU-06: Gestión del Ciclo de Vida de Citas (Confirmar, Completar, Cancelar)
- **Historia**: Como profesional, quiero actualizar el estado de una cita a medida que transcurre la jornada, para registrar qué clientes asistieron o cancelaron.
- **Prioridad**: **Must have**
- **Criterios de Aceptación (Playwright Ready)**:
  - **Escenario 1: Marcar cita como completada**
    - **Dado** que una cita se encuentra en estado *CONFIRMADA*,
    - **Cuando** el usuario abre los detalles de la cita y pulsa "Marcar como Completada" (`data-testid="btn-status-completed"`),
    - **Entonces** la cita cambia su estado a *COMPLETADA* (`data-testid="badge-completed"`), y el slot de tiempo queda cerrado en el historial.
  - **Escenario 2: Cancelación de cita y liberación de horario**
    - **Dado** que una cita está programada de 15:00 a 16:00,
    - **Cuando** el usuario selecciona "Cancelar Cita" (`data-testid="btn-cancel-appointment"`) y confirma en el diálogo modal (`data-testid="btn-confirm-cancel"`),
    - **Entonces** el estado cambia a *CANCELADA* y el intervalo horario de 15:00 a 16:00 queda nuevamente disponible para nuevas reservas.

---

### HU-07: Reprogramación de Citas con Revalidación Horaria
- **Historia**: Como profesional, quiero cambiar la fecha u hora de una cita ya programada, para acomodar imprevistos de mis clientes asegurando que no haya colisiones.
- **Prioridad**: **Should have**
- **Criterios de Aceptación (Playwright Ready)**:
  - **Escenario 1: Reprogramación exitosa**
    - **Dado** una cita agendada para el lunes a las 11:00,
    - **Cuando** el usuario hace clic en "Reprogramar" (`data-testid="btn-reschedule"`), cambia la hora a "16:00" y pulsa "Guardar Cambio" (`data-testid="btn-save-reschedule"`),
    - **Entonces** la cita se actualiza al nuevo horario tras comprobar que no hay colisiones en el nuevo bloque.

---

### HU-08: Dashboard Operativo Diario y Accesos Rápidos
- **Historia**: Como profesional, quiero ver un resumen ejecutivo al abrir la aplicación, para conocer de un vistazo el trabajo del día y realizar acciones rápidas.
- **Prioridad**: **Should have**
- **Criterios de Aceptación (Playwright Ready)**:
  - **Escenario 1: Visualizar métricas del día actual**
    - **Dado** que el usuario ingresa a `/dashboard`,
    - **Cuando** la página carga,
    - **Entonces** se muestran las tarjetas con: cantidad de citas de hoy (`data-testid="metric-today-appointments"`), citas pendientes (`data-testid="metric-pending-appointments"`) y la lista de las próximas citas del día.
