import { z } from 'zod';

export const DayScheduleSchema = z.object({
  diaSemana: z.number().min(0).max(6),
  activo: z.boolean(),
  horaApertura: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm inválido"),
  horaCierre: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm inválido"),
  inicioAlmuerzo: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm inválido").optional().nullable(),
  finAlmuerzo: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Formato HH:mm inválido").optional().nullable(),
}).refine(data => {
  if (!data.activo) return true;
  return data.horaCierre > data.horaApertura;
}, {
  message: "La hora de cierre debe ser posterior a la de apertura.",
  path: ["horaCierre"],
});

export const BusinessConfigSchema = z.object({
  nombreNegocio: z.string().min(1, "El nombre del negocio es obligatorio"),
  telefono: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
  moneda: z.string().default("$"),
  duracionTurnoMinutos: z.number().min(5).max(480).default(30),
  horarios: z.array(DayScheduleSchema),
});

export type DayScheduleInput = z.infer<typeof DayScheduleSchema>;
export type BusinessConfigInput = z.infer<typeof BusinessConfigSchema>;
