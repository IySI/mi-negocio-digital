# 01 - Núcleo de la Aplicación y Definición del MVP

## 1. Resumen de la Idea
**Mi Negocio Digital** es una aplicación web intuitiva, ágil y autónoma diseñada para pequeños negocios de servicios y profesionales independientes (como consultorios, barberías, salones de belleza, terapeutas, talleres, centros de estética y consultores). Su propósito central es permitir la administración unificada de clientes, servicios ofertados, horarios de disponibilidad y programación de citas, eliminando el desorden de los registros en papel o chats desorganizados de mensajería.

La solución prioriza la simplicidad operativa, la velocidad de respuesta y la privacidad de datos mediante una arquitectura local basada en SQLite y Next.js, evitando suscripciones mensuales a plataformas de terceros o servicios externos complejos.

---

## 2. Problema a Resolver
- **Problema actual**: 
  - La mayoría de pequeños negocios y profesionales coordinan citas mediante canales informales (WhatsApp, llamadas, notas de papel o libretas físicas).
  - Esto provoca solapamiento de horarios (doble reserva para la misma hora), citas olvidadas, falta de claridad sobre la disponibilidad real del día y pérdida de tiempo valioso en responder "¿a qué hora tienes libre?".
  - El historial de clientes y los servicios más solicitados quedan dispersos y no permiten fidelizar ni optimizar los ingresos.
- **Impacto**:
  - Pérdida económica directa por citas canceladas a última hora o no atendidas.
  - Experiencia frustrante y poco profesional para el cliente final.
  - Sobrecarga mental y estrés para el profesional al intentar llevar la agenda mentalmente.

---

## 3. Público Objetivo
- **Usuarios Primarios (Administrador / Profesional)**:
  - Dueños de micro y pequeños negocios, emprendedores y trabajadores autónomos que prestan servicios bajo cita previa.
  - Perfil con conocimientos informáticos básicos que requiere una herramienta clara, sin curvas de aprendizaje complejas ni configuraciones engorrosas.
- **Beneficiarios Secundarios**:
  - Los clientes del negocio, quienes disfrutan de atención puntual, confirmaciones claras y una gestión ordenada de sus citas.
  - Personal o colaboradores de asistencia en recepción (en caso de negocios con mostrador).

---

## 4. Propuesta de Valor
- **Independencia y Cero Costos Ocultos**: Funciona con almacenamiento local mediante SQLite y Prisma, sin cuotas mensuales recurrentes ni necesidad de conectar servicios externos costosos.
- **Prevención Automática de Conflictos**: Algoritmo integrado que valida en tiempo real la disponibilidad de horarios, impidiendo citas solapadas o asignadas fuera del horario laboral.
- **Simplicidad Extrema**: Enfoque en las acciones clave del día a día (crear cita en menos de 30 segundos, consultar agenda diaria y buscar datos de un cliente al instante).
- **Control Total de Datos**: Los datos del negocio y de los clientes permanecen en la propia base de datos del negocio, cumpliendo con principios de soberanía de datos y privacidad.

---

## 5. Alcance del MVP (Producto Mínimo Viable)
*El MVP es **estrictamente administrativo e interno**, enfocado en la gestión operativa directa por parte del profesional o personal del negocio. No incluye portal público ni vistas externas para clientes finales.*

Funcionalidades esenciales e indispensables para la versión inicial (v1.0):

1. **Gestión del Catálogo de Servicios**:
   - Crear, editar, activar/desactivar y listar servicios.
   - Atributos: nombre comercial, descripción, duración estimada (en minutos) y precio/tarifa de referencia.
2. **Definición de Horarios de Atención y Disponibilidad**:
   - Configuración semanal de días laborales (ej. lunes a sábado).
   - Establecimiento de franja horaria de apertura y cierre por día.
   - Definición de franja de descanso/almuerzo no disponible para citas.
   - Regla de negocio: Permite **citas consecutivas inmediatas sin margen de holgura (buffer) obligatorio** (ej. una cita puede iniciar exactamente al finalizar la anterior).
3. **Directorio y Gestión de Clientes**:
   - Registro rápido de clientes (nombre y apellidos, número de teléfono/WhatsApp, correo electrónico opcional y notas internas).
   - Búsqueda ágil de clientes por nombre o teléfono.
   - Historial de citas asociadas al cliente.
4. **Programación y Control de Citas**:
   - Creación de citas asociando cliente, servicio, fecha y hora de inicio.
   - Cálculo automático de hora de finalización según la duración del servicio.
   - Validación estricta en servidor: rechazo inmediato si el horario colisiona con otra cita activa o cae fuera del horario de atención o en descanso.
   - Ciclo de estados de cita: *Pendiente*, *Confirmada*, *Completada* y *Cancelada*.
   - Visualización de la agenda en formato lista ordenada cronológicamente y vista de calendario/bloques diarios.
5. **Dashboard Operativo Básico**:
   - Resumen del día actual: citas programadas para hoy, citas completadas y citas pendientes.
   - Accesos directos a "Nueva Cita" y "Nuevo Cliente".
6. **Política de Acceso y Seguridad**:
   - **Fase de desarrollo y uso local**: Acceso directo sin autenticación para agilidad operativa.
   - **Fase previa a despliegue público/servidor**: Capa de autenticación y protección de rutas obligatoria antes de exponer la aplicación en entornos públicos (como AWS Lightsail).

---

## 6. Funcionalidades para Versiones Futuras (Fuera del MVP)
*Funcionalidades descartadas conscientemente para el MVP para evitar sobrecomplejidad:*
- **Portal público web para autoreserva de clientes**: Enlace público para que el cliente final seleccione turno online (se analiza como opción posterior o extensión del MVP).
- **Notificaciones automáticas por WhatsApp / SMS**: Integración con Twilio o Meta WhatsApp Cloud API (requiere pagos y servicios externos).
- **Cobros y pasarelas de pago online**: Integración con Stripe o PayPal.
- **Multi-agenda / Multi-profesional simultáneo**: Gestión de múltiples calendarios para equipos de trabajo grandes.
- **Sincronización bidireccional con Google Calendar o Apple Calendar**.
- **Módulo de facturación fiscal electrónica e inventario de productos físicos**.

---

## 7. Métricas de Éxito del Proyecto
1. **Tiempo de Agendamiento**: Un profesional debe poder registrar a un nuevo cliente y asignarle una cita en menos de **45 segundos**.
2. **Tasa de Solapamiento**: **0%** de citas superpuestas gracias a las validaciones automáticas de Prisma/SQLite.
3. **Rendimiento de Carga**: El panel operativo y la agenda diaria deben cargar en menos de **1.0 segundo** en red local o servidor estándar.
4. **Facilidad de Automatización**: El 100% de los flujos críticos del MVP deben contar con selectores `data-testid` estandarizados para pruebas de regresión con Playwright.
