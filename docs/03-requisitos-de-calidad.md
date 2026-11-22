# 03 - Requisitos de Calidad y No Funcionales

## 1. Rendimiento y Tiempos de Respuesta
- **Velocidad de Carga Inicial**:
  - Tiempo hasta el primer contenido visual (First Contentful Paint - FCP) menor a **1.2 segundos** gracias al renderizado del lado del servidor (React Server Components en Next.js).
- **Tiempo de Respuesta en Interacciones (Mutaciones)**:
  - Guardar una cita, registrar un cliente o editar un servicio debe procesarse y reflejarse en pantalla en menos de **300 ms**.
- **Eficiencia en Consultas de Base de Datos**:
  - Índices explícitos en SQLite (a través de Prisma) sobre campos de búsqueda frecuente: `fechaHoraInicio`, `clienteId`, `servicioId` y `telefono`.
  - Consultas paginadas o filtradas por rango de fechas para evitar cargar volúmenes masivos de datos en la memoria del navegador.

---

## 2. Seguridad, Privacidad y Soberanía de Datos
- **Seguridad y Control de Acceso por Entorno**:
  - **Entorno Local y Desarrollo**: Acceso directo y sin autenticación para agilidad máxima en desarrollo e interactividad directa en pruebas de Playwright.
  - **Despliegue Público Obligatorio**: Si la aplicación se expone a internet o se despliega en AWS Lightsail, es requisito técnico obligatorio anteponer una capa de autenticación para salvaguardar la información del negocio y los clientes.
- **Soberanía y Localidad de Datos**:
  - Toda la información sensible (nombres de clientes, teléfonos, notas privadas y tarifas) reside exclusivamente en el archivo de base de datos local SQLite (`dev.db` o `production.db`).
  - No se envía telemetría ni datos de clientes a servidores de terceros, respetando la privacidad del profesional y de sus usuarios.
- **Validación Estricta de Entradas**:
  - Validación bidireccional (en formulario del cliente y en el servidor) mediante esquemas tipados con **Zod**.
  - Prevención nativa contra inyecciones SQL mediante consultas parametrizadas suministradas por el ORM Prisma.
  - Sanitización automática de campos de texto libre (notas, nombres) para prevenir ataques de Cross-Site Scripting (XSS).
- **Integridad Transaccional y Regla de Solapamiento**:
  - El proceso de reserva de citas debe ejecutarse dentro de una transacción (`prisma.$transaction`).
  - **Regla de adyacencia horaria**: Dos citas consecutivas son válidas (el inicio de la cita B puede coincidir exactamente con el fin de la cita A, sin buffer obligatorio). Se rechaza únicamente si existe intersección real de intervalos: `(inicioNueva < finExistente) && (finNueva > inicioExistente)`.

---

## 3. Usabilidad y Accesibilidad
- **Diseño Adaptable (Mobile-First & Desktop)**:
  - La interfaz debe funcionar fluidamente tanto en pantallas móviles de smartphones (para que el profesional consulte o registre una cita desde su teléfono en mostrador) como en tablets y laptops de escritorio.
- **Claridad Visual y Feedback Inmediato**:
  - Retroalimentación mediante notificaciones temporales no invasivas (*toasts*) ante acciones exitosas ("Cita creada con éxito") o fallidas ("Conflicto de horario").
  - Diálogos modales de confirmación antes de acciones destructivas o irreversibles (como cancelar una cita o eliminar un cliente).
  - Estados vacíos explicativos (*empty states*) con ilustraciones o llamadas a la acción directas para guiar al usuario que recién empieza.
- **Accesibilidad (a11y)**:
  - Contraste visual conforme a las pautas WCAG 2.1 nivel AA.
  - Navegación completa por teclado accesible en modales y controles de formulario.

---

## 4. Disponibilidad, Tolerancia a Fallos y Respaldos
- **Manejo Amigable de Errores**:
  - Captura global de errores en Next.js (`error.tsx`) que evite pantallas en blanco y ofrezca un botón para recargar la vista conservando la sesión.
- **Estrategia de Respaldo Local (Backup)**:
  - Dado que SQLite concentra todos los datos en un archivo físico único, la copia de seguridad es trivial y directa.
  - Se definirá un procedimiento documentado para realizar copias periódicas del archivo `.db` (manuales o mediante script de volcado).
- **Modo Offline Local**:
  - Si la aplicación se ejecuta de manera local en el equipo del negocio (localhost), funciona de forma 100% autónoma sin requerir conexión a internet activa.

---

## 5. Arquitectura para Pruebas Automatizadas con Playwright
- **Selectores de Prueba Estandarizados (`data-testid`)**:
  - Todos los elementos clave interactivos de la aplicación deben incorporar atributos semánticos dedicados para testing, evitando selectores frágiles basados en clases CSS dinámicas o etiquetas HTML genéricas.
  - Formato estandarizado:
    - Botones de acción: `data-testid="btn-[accion]-[recurso]"` (ej. `btn-new-appointment`, `btn-save-service`).
    - Inputs y formularios: `data-testid="input-[campo]"` (ej. `input-client-name`, `input-service-price`).
    - Modales y contenedores: `data-testid="modal-[nombre]"` (ej. `modal-appointment-form`).
    - Tarjetas e ítems de lista: `data-testid="[recurso]-item-[id]"` o `data-testid="appointment-card"`.
    - Mensajes de validación y alerta: `data-testid="alert-conflict"`, `data-testid="toast-success"`.
- **Aislamiento del Entorno de Pruebas**:
  - Capacidad de inicializar una base de datos de pruebas limpia (`file:./test.db`) mediante un script de inicialización (`seed`) antes de ejecutar la suite de Playwright, garantizando pruebas reproducibles e independientes de los datos reales del negocio.

---

## 6. Restricciones Operativas y Técnicas
- **Límites de Infraestructura**:
  - Diseñado para funcionar eficientemente en entornos ligeros, desde una computadora personal básica con Node.js hasta un servidor virtual privado (VPS) económico como AWS Lightsail (instancia mínima de 1 vCPU y 1 GB RAM).
- **Cero Dependencias de Terceros Obligatorias**:
  - No se exigirán cuentas externas ni claves de API de pago para el funcionamiento básico del sistema.
