# Protocolo de Verificación y Registro de Evidencias

Este documento define el formato estándar para registrar evidencias de pruebas técnicas y actualizar los artefactos tras cada incremento de historia de usuario.

---

## 1. Plantilla de Informe de Verificación de Criterios

Al completar la implementación de una historia de usuario, el agente debe estructurar la entrega de la siguiente manera:

```markdown
### 📋 Informe de Verificación: [HU-XX - Título]

#### 1. Archivos Creados / Modificados
- `src/...`: [Descripción breve]
- `src/...`: [Descripción breve]

#### 2. Comprobación de Criterios de Aceptación
- [x] **CA-XX.1 [Escenario 1]**:
  - *Resultado obtenido*: [Descripción del comportamiento verificado].
  - *Evidencia*: [Salida de test / log / código de estado HTTP].
- [x] **CA-XX.2 [Escenario 2]**:
  - *Resultado obtenido*: [Descripción].
  - *Evidencia*: [Salida].

#### 3. Ejecución de Pruebas Técnicas
- **Comando ejecutado**: `npm test -- ...` (o script equivalente).
- **Resultado**: `X tests pasados, 0 fallos`.

#### 4. Solicitud de Validación
> ¿Confirmas y apruebas los criterios de aceptación verificados para marcar **HU-XX** como **Validada** en la matriz y el tablero de progreso?
```

---

## 2. Reglas de Sincronización de la Matriz de Trazabilidad

En `docs/matriz-trazabilidad.md`:
1. Actualizar la celda de la tabla resumen:
   - `Pendiente` (0%) → `En desarrollo` (50%) → `Implementada` (80%) → `Validada` (100%).
2. Actualizar el bloque detallado de la historia:
   - Campo `Estado: Validada`.
   - Añadir la sección de *Evidencias de Verificación* con fecha y resultados.
3. Recalcular las métricas globales del proyecto:
   - Porcentaje global = $\frac{\text{Historias Validadas}}{\text{Total Historias}} \times 100$.

---

## 3. Protocolo de Bloqueos o Dudas Técnicas

Si durante la implementación de una historia se identifica:
- Ambigüedad en un criterio de aceptación.
- Incompatibilidad entre librerías o dependencias.
- Falta de parámetros de configuración (claves de API, puertos, variables de entorno).

**Acción obligatoria**:
1. No inventar una solución provisional que desvirtúe el análisis aprobado.
2. Detener la codificación.
3. Formular una consulta estructurada al usuario explicando:
   - El punto de bloqueo o duda.
   - Las alternativas técnicas viables.
   - La opción recomendada para mantener la coherencia con el Documento Maestro.
