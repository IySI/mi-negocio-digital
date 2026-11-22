import { z } from 'zod';

export const ServiceSchema = z.object({
  nombre: z.string().min(1, "El nombre del servicio es obligatorio").max(100, "Nombre demasiado largo"),
  descripcion: z.string().optional().nullable(),
  duracionMinutos: z.coerce.number().int().min(5, "La duración mínima es de 5 minutos").max(480, "La duración máxima es de 480 minutos"),
  precio: z.coerce.number().min(0, "El precio no puede ser negativo"),
  activo: z.boolean().default(true),
});

export type ServiceInput = z.infer<typeof ServiceSchema>;

export const DeleteServiceSchema = z.object({
  id: z.string().min(1, "El ID del servicio es obligatorio"),
});
export type DeleteServiceInput = z.infer<typeof DeleteServiceSchema>;
