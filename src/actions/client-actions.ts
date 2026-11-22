'use server';

import { prisma } from '@/lib/prisma';
import { ClientSchema, ClientInput } from '@/lib/validations/client';
import { revalidatePath } from 'next/cache';

export async function getClients() {
  try {
    const clients = await prisma.cliente.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, clients };
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return { success: false, error: "Error al cargar el directorio de clientes.", clients: [] };
  }
}

export async function createClient(input: ClientInput) {
  try {
    const parsed = ClientSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { success: false, error: issue ? issue.message : "Datos inválidos" };
    }

    const newClient = await prisma.cliente.create({
      data: {
        nombre: parsed.data.nombre.trim(),
        telefono: parsed.data.telefono.trim(),
        email: parsed.data.email?.trim() || null,
        notas: parsed.data.notas?.trim() || null,
      },
    });

    revalidatePath('/clientes');
    return { success: true, client: newClient, message: "Cliente registrado exitosamente" };
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    return { success: false, error: "Error al registrar el cliente en la base de datos." };
  }
}
