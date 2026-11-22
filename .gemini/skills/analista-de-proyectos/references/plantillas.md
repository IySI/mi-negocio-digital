# Plantillas de Documentación por Fase

Este archivo contiene la estructura sugerida y pautas de contenido para cada uno de los documentos que se generan en la carpeta `docs/`.

---

## 1. Fase 1: `docs/01-nucleo-y-mvp.md`

```markdown
# 01 - Núcleo de la Aplicación y Definición del MVP

## 1. Resumen de la Idea
[Descripción breve en palabras sencillas de qué hace la aplicación y qué necesidad cubre].

## 2. Problema a Resolver
- **Problema actual**: [Qué dificultad o dolor experimentan las personas hoy en día].
- **Impacto**: [Por qué es relevante solucionarlo].

## 3. Público Objetivo
- **Usuarios primarios**: [Quién interactúa directamente con la aplicación a diario].
- **Beneficiarios secundarios**: [Quién recibe valor o reportes del sistema].

## 4. Propuesta de Valor
- [Qué hace única o valiosa a esta solución frente a no hacer nada o usar alternativas manuales].

## 5. Alcance del MVP (Producto Mínimo Viable)
*Funcionalidades estrictamente necesarias para el primer lanzamiento:*
1. [Funcionalidad esencial 1]
2. [Funcionalidad esencial 2]
3. [Funcionalidad esencial 3]

## 6. Funcionalidades para Versiones Futuras (Fuera del MVP)
*Ideas valiosas postergadas conscientemente para evitar sobrecomplejidad inicial:*
- [Funcionalidad avanzada A]
- [Funcionalidad avanzada B]
```

---

## 2. Fase 2: `docs/02-experiencia-usuario-ux.md`

```markdown
# 02 - Experiencia de Usuario (UX)

## 1. Roles de Usuario y Permisos
| Rol | Descripción | Permisos Principales |
| :--- | :--- | :--- |
| Administrador | Gestiona el sistema completo | Configuración general, gestión de cuentas |
| Usuario Estándar | Usuario habitual del producto | Operaciones diarias principales |

## 2. Mapa de Navegación (Estructura de Pantallas)
- Inicio / Landing
  - Registro e Inicio de Sesión
  - Panel Principal (Dashboard)
    - Vista Detallada / Formulario de Creación
    - Historial / Listado
    - Perfil y Configuración

## 3. Flujos de Interacción Principales
### Flujo 1: [Nombre del Flujo Principal, ej. Registro y Primera Acción]
1. El usuario accede a la pantalla de inicio.
2. Hace clic en [botón] y visualiza [pantalla/formulario].
3. Ingresa [datos mínimos requeridos] y pulsa [confirmar].
4. El sistema valida y redirige a [pantalla de bienvenida con retroalimentación clara].

## 4. Pantallas Clave y Componentes
### Pantalla: [Nombre de la pantalla]
- **Objetivo**: [Propósito claro de la vista].
- **Elementos visibles**: [Lista de campos, tablas, tarjetas informativas o botones].
- **Estados especiales**: [Carga vacía, error de validación, confirmación exitosa].
```

---

## 3. Fase 3: `docs/03-requisitos-de-calidad.md`

```markdown
# 03 - Requisitos de Calidad

## 1. Rendimiento y Velocidad
- Tiempos de carga esperados (ej. respuestas visuales en menos de 2 segundos).
- Capacidad de procesamiento y concurrencia inicial esperada.

## 2. Seguridad y Privacidad
- Autenticación segura y gestión de contraseñas.
- Protección y cifrado de datos sensibles en tránsito y en reposo.
- Control de acceso por roles para evitar accesos no autorizados.

## 3. Usabilidad y Diseño Adaptable (Responsive)
- Interfaz intuitiva con lenguaje cotidiano, sin jerga confusa.
- Compatibilidad visual fluida en dispositivos móviles, tablets y escritorios.
- Mensajes de error constructivos que expliquen al usuario cómo resolver el problema.

## 4. Disponibilidad y Tolerancia a Fallos
- Mecanismos de copia de respaldo (backups periódicos).
- Recuperación sencilla ante caídas o desconexiones momentáneas.

## 5. Restricciones y Supuestos Técnicos
- Restricciones legales o regulatorias (ej. RGPD/LOPD si aplica manejo de datos personales).
- Límites de presupuesto, licencias o infraestructura inicial.
```

---

## 4. Fase 4: `docs/04-datos-y-tecnologia.md`

```markdown
# 04 - Datos y Tecnología

## 1. Modelo Conceptual de Datos (Entidades Clave)
Explicación de las entidades principales y sus relaciones:
- **Entidad A (ej. Usuario)**: Contiene información de identificación, credenciales y rol.
- **Entidad B (ej. Documento / Tarea)**: Asociada a un usuario; contiene estado, fecha y contenido.
- **Relaciones**: Un Usuario tiene muchos Documentos (1 a N).

## 2. Pila Tecnológica Sugerida (Tech Stack)
*Selección adaptada al proyecto con justificación para principiantes:*
- **Frontend**: [ej. React / Next.js / Vue] - *Motivo*: Facilidad de desarrollo, componentes reutilizables y gran comunidad.
- **Backend**: [ej. Node.js / Express, Python / FastAPI, C# / .NET] - *Motivo*: Rendimiento, simplicidad y robustez.
- **Base de Datos**: [ej. PostgreSQL / SQLite / Supabase] - *Motivo*: Integridad referencial, escalabilidad y facilidad de consulta.
- **Alojamiento / Despliegue**: [ej. Vercel, Render, Supabase] - *Motivo*: Planes accesibles, bajo mantenimiento de infraestructura.

## 3. Integraciones Externas y Servicios Auxiliares
- Servicio de autenticación / correo electrónico (ej. Resend, Auth0).
- Pasarela de pago o servicios de terceros (si aplica).
```

---

## 5. Fase 5: `docs/05-historias-de-usuario.md`

```markdown
# 05 - Historias de Usuario con Criterios de Aceptación

## Resumen de Historias del MVP

### HU-01: [Título descriptivo]
- **Historia**: Como [rol], quiero [acción] para [beneficio].
- **Prioridad**: [Must have / Alta]
- **Criterios de Aceptación**:
  - [x] **Escenario 1**: Dado que [condición inicial], cuando [acción del usuario], entonces [resultado esperado del sistema].
  - [x] **Escenario 2**: Si faltan campos requeridos, el sistema muestra advertencias en rojo junto a cada campo.

### HU-02: [Título descriptivo]
- **Historia**: Como [rol], quiero [acción] para [beneficio].
- **Prioridad**: [Must have / Alta]
- **Criterios de Aceptación**:
  - [x] **Escenario 1**: Dado que [contexto], cuando [evento], entonces [respuesta].
```

---

## 6. Documento Maestro: `docs/documento-maestro.md`

```markdown
# Documento Maestro de Especificación y Planificación

> **Proyecto**: [Nombre del Proyecto]
> **Fecha de Finalización del Análisis**: [Fecha]
> **Estado**: Aprobado para Fase de Desarrollo

---

## 1. Resumen Ejecutivo
[Breve descripción del producto, problema resuelto y valor diferencial acordado].

## 2. Índice de Documentación Detallada
- [01 - Núcleo y MVP](./01-nucleo-y-mvp.md)
- [02 - Experiencia de Usuario (UX)](./02-experiencia-usuario-ux.md)
- [03 - Requisitos de Calidad](./03-requisitos-de-calidad.md)
- [04 - Datos y Tecnología](./04-datos-y-tecnologia.md)
- [05 - Historias de Usuario](./05-historias-de-usuario.md)

## 3. Matriz Síntesis del Proyecto
[Tabla resumen que interconecta MVP, Stack tecnológico y módulos funcionales].

## 4. Hoja de Ruta de Implementación (Roadmap)
1. **Paso 1: Setup y Base de Datos**: Inicialización de repositorio y esquemas de datos.
2. **Paso 2: Core Backend & API**: Endpoints prioritarios del MVP.
3. **Paso 3: Frontend y Flujos Principales**: Interfaces de usuario validadas en la Fase 2.
4. **Paso 4: Pruebas de Criterios de Aceptación**: Validación de las historias HU-01 a HU-XX.
5. **Paso 5: Despliegue del MVP**: Puesta en producción.

## 5. Criterios de Finalización y Próximos Pasos
[Instrucciones finales para el equipo de desarrollo].
```
