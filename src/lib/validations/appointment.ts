import { z } from 'zod';

export const AppointmentSchema = z.object({
  clienteId: z.string().min(1, 'Debe seleccionar un cliente'),
  servicioId: z.string().min(1, 'Debe seleccionar un servicio'),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  horaInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
  notasInternas: z.string().optional().nullable(),
});

export type AppointmentInput = z.infer<typeof AppointmentSchema>;

export const RescheduleSchema = z.object({
  citaId: z.string().min(1, 'ID de cita requerido'),
  nuevaFecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  nuevaHoraInicio: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Formato de hora inválido (HH:mm)'),
});

export type RescheduleInput = z.infer<typeof RescheduleSchema>;
