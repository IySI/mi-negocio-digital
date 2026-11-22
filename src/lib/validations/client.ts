import { z } from 'zod';

export const ClientSchema = z.object({
  nombre: z.string().min(1, "El nombre del cliente es obligatorio").max(100, "Nombre demasiado largo"),
  telefono: z.string().min(3, "El teléfono de contacto es obligatorio").max(30, "Teléfono demasiado largo"),
  email: z.string().email("Correo electrónico inválido").optional().nullable().or(z.literal('')),
  notas: z.string().max(500, "Las notas no pueden superar 500 caracteres").optional().nullable(),
});

export type ClientInput = z.infer<typeof ClientSchema>;
