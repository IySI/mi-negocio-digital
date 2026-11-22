# 02 - Experiencia de Usuario (UX)

## 1. Roles de Usuario y Permisos
El sistema en su versión MVP es **exclusivamente administrativo e interno**, enfocado en la gestión centralizada del negocio:

| Rol | Entorno / Acceso | Permisos Principales |
| :--- | :--- | :--- |
| **Administrador / Profesional** | **Entorno Local (Desarrollo)**: Acceso directo sin autenticación.<br>**Despliegue Público (Producción)**: Acceso protegido con capa de autenticación obligatoria. | Control total: gestión de servicios, definición de horarios, alta y edición de clientes, programación, edición, reprogramación y cancelación de citas, y visualización del panel métrico. |
| *(Futuro) Cliente Final* | *Excluido del MVP (Sin portal público).* | Las reservas se registran internamente por el administrador (recibidas por WhatsApp, teléfono o mostrador). |

---

## 2. Mapa de Navegación (Estructura de Pantallas)

```
[Inicio / Raíz: /]
   └── Redirección automática a [/dashboard]

[/dashboard] - Panel de Control Principal
   ├── Tarjetas de resumen diario (Citas hoy, pendientes, completadas)
   ├── Lista de citas próximas del día
   └── Accesos directos: "Nueva Cita", "Nuevo Cliente"

[/citas] - Agenda y Programación
   ├── Selector de fecha y vista (Día / Semana / Lista cronológica)
   ├── Filtro por estado (Todas, Confirmadas, Pendientes, Canceladas, Completadas)
   ├── Modal/Drawer "Nueva Cita"
   └── Modal/Drawer "Detalle de Cita" (Cambio de estado, notas, cancelar/reprogramar)

[/clientes] - Directorio de Clientes
   ├── Barra de búsqueda en tiempo real (por nombre o teléfono)
   ├── Tabla/Lista de clientes registrados
   ├── Modal/Formulario "Nuevo Cliente" / "Editar Cliente"
   └── Ficha detallada de Cliente (datos de contacto e historial de citas previas)

[/servicios] - Catálogo de Servicios
   ├── Listado de tarjetas de servicios activos e inactivos
   ├── Modal/Formulario "Nuevo Servicio" (Nombre, descripción, duración, precio)
   └── Modal/Formulario "Editar Servicio" / Botón de activar-desactivar

[/horarios] - Horarios de Atención y Disponibilidad
   ├── Selector de días hábiles de la semana (Lunes a Domingo con toggles)
   ├── Configuración de horarios por día (Apertura, Cierre, Intervalo de Almuerzo)
   └── Configuración de duración base de bloque de cita

[/configuracion] - Información del Negocio
   └── Formulario con datos comerciales: Nombre del negocio, teléfono de contacto, dirección y símbolo de moneda.
```

---

## 3. Flujos de Interacción Principales

### Flujo 1: Configuración Inicial del Negocio (Onboarding del negocio)
1. El usuario accede a la aplicación por primera vez y navega a **/servicios**.
2. Pulsa en el botón **"Nuevo Servicio"** (`data-testid="btn-new-service"`).
3. Completa los campos: Nombre ("Corte y Barba"), Duración (45 minutos), Precio ($25.00) y pulsa **"Guardar Servicio"**.
4. El servicio aparece inmediatamente en la lista de activos.
5. El usuario navega a **/horarios** y activa los días de lunes a viernes (09:00 a 18:00 con receso de 13:00 a 14:00) y pulsa **"Guardar Horarios"**.
6. El sistema muestra una confirmación visual (toast) notificando que la disponibilidad fue guardada.

### Flujo 2: Agendamiento Rápido de una Cita (Cliente Existente o Nuevo)
1. Desde **/dashboard** o **/citas**, el usuario hace clic en el botón **"Nueva Cita"** (`data-testid="btn-new-appointment"`).
2. Se abre un modal emergente o drawer lateral (`data-testid="modal-appointment-form"`).
3. El usuario busca un cliente existente mediante un campo con autocompletado (`data-testid="select-client"`) o pulsa **"+ Crear Cliente Rápido"** para registrar nombre y teléfono en el mismo instante.
4. Selecciona el servicio deseado desde una lista desplegable (`data-testid="select-service"`). El sistema carga automáticamente la duración.
5. Selecciona la fecha en el calendario (`data-testid="input-appointment-date"`) y la hora de inicio (`data-testid="input-appointment-time"`).
6. **Regla de Citas Consecutivas**: El sistema permite citas inmediatamente contiguas sin margen de buffer obligatorio (ej. si una cita finaliza a las 10:45, la siguiente puede comenzar a las 10:45 exactamente).
7. Si el horario seleccionado entra en conflicto real con otra cita activa o cae en horario no laboral/receso, el sistema inhabilita la confirmación y muestra una alerta: *"El horario seleccionado entra en conflicto con otra cita activa"* (`data-testid="alert-conflict"`).
8. Si el horario está disponible, el usuario pulsa **"Confirmar Cita"** (`data-testid="btn-confirm-appointment"`).
9. La cita se registra con estado inicial *CONFIRMADA* o *PENDIENTE*, se muestra notificación de éxito (`data-testid="toast-success"`) y se actualiza la agenda.

### Flujo 3: Gestión del Ciclo de Vida de una Cita (Atención y Estados)
1. En la pantalla **/citas**, el usuario localiza una cita programada para el día.
2. Hace clic sobre la tarjeta o fila de la cita (`data-testid="appointment-item-[id]"` o `data-testid="appointment-card"`).
3. En el detalle, puede ejecutar tres acciones mediante botones directos:
   - **"Marcar como Atendida/Completada"** (`data-testid="btn-status-completed"`): Actualiza el estado a *COMPLETADA* (`data-testid="badge-completed"`).
   - **"Reprogramar"** (`data-testid="btn-reschedule"`): Permite modificar fecha y hora validando disponibilidad, y confirmar con **"Guardar Cambio"** (`data-testid="btn-save-reschedule"`).
   - **"Cancelar Cita"** (`data-testid="btn-cancel-appointment"`): Solicita confirmación en diálogo modal y confirma con **"Confirmar Cancelación"** (`data-testid="btn-confirm-cancel"`), actualizando el estado a *CANCELADA* (`data-testid="badge-canceled"`).
4. El cambio de estado se refleja con insignias de color distintivas: Verde (Completada), Azul (Confirmada), Amarillo (Pendiente), Rojo (Cancelada).

---

## 4. Estructura Conceptual de Pantallas Clave

### Pantalla 1: Dashboard (`/dashboard`)
- **Propósito**: Proporcionar una vista panorámica instantánea del día operativo sin saturar de información.
- **Elementos Visibles**:
  - Saludo y fecha actual destacada.
  - Tarjetas métricas superiores: *Citas de Hoy* (`data-testid="metric-today-appointments"`), *Pendientes de Atención* (`data-testid="metric-pending-appointments"`), *Clientes Nuevos del Mes*.
  - Sección *"Agenda de Hoy"*: Listado en orden cronológico con hora, nombre del cliente, servicio y estado.
  - Botón de acción destacado: **"+ Nueva Cita"** (`data-testid="btn-new-appointment"`).
- **Estados Especiales**:
  - *Vacío*: Si hoy no hay citas agendadas, se muestra una ilustración amigable: *"No tienes citas programadas para hoy. ¡Aprovecha para organizar tus servicios o agendar una nueva cita!"*.

### Pantalla 2: Vista de Citas y Agenda (`/citas`)
- **Propósito**: Planificar, visualizar y filtrar todas las citas pasadas, presentes y futuras.
- **Elementos Visibles**:
  - Selector de fecha con controles "Día Anterior" (`data-testid="btn-prev-day"`), "Hoy" y "Día Siguiente" (`data-testid="btn-next-day"`).
  - Barra de herramientas con conmutador de vista: *Lista Detallada* vs *Bloques Horarios*.
  - Filtro por estado de cita mediante chips interactivos (`data-testid="filter-status-confirmed"`, etc.).
  - Grilla de citas con tarjetas (`data-testid="appointment-card"`) y etiquetas legibles de hora de inicio y fin, cliente y estado (`data-testid="badge-confirmed"`).
- **Estados Especiales**:
  - *Cargando (Skeleton)*: Tarjetas simuladas mientras se obtienen los datos.
  - *Conflicto en formulario*: Mensaje de advertencia visual en rojo (`data-testid="alert-conflict"`) si dos citas intentan ocupar el mismo intervalo.

### Pantalla 3: Directorio de Clientes (`/clientes`)
- **Propósito**: Mantener organizada la base de datos de contactos para agilizar futuras reservas.
- **Elementos Visibles**:
  - Input de búsqueda rápida con icono de lupa (`data-testid="input-search-clients"`).
  - Botón **"+ Nuevo Cliente"** (`data-testid="btn-new-client"`).
  - Tabla responsiva con filas de cliente (`data-testid="client-row"`): Nombre, Teléfono, Última Visita y Acciones (Ver historial / Editar).
  - Ficha lateral con notas personales (`data-testid="input-client-notes"`).
