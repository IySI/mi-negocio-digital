'use server';

import { prisma } from '@/lib/prisma';
import { ServiceSchema, ServiceInput, DeleteServiceSchema } from '@/lib/validations/service';
import { revalidatePath } from 'next/cache';

export async function getServices() {
  try {
    const services = await prisma.servicio.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, services };
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    return { success: false, error: "Error al cargar la lista de servicios.", services: [] };
  }
}

export async function createService(input: ServiceInput) {
  try {
    const parsed = ServiceSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { success: false, error: issue ? issue.message : "Datos inválidos" };
    }

    const newService = await prisma.servicio.create({
      data: {
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion || "",
        duracionMinutos: parsed.data.duracionMinutos,
        precio: parseFloat(parsed.data.precio.toFixed(2)),
        activo: parsed.data.activo ?? true,
      },
    });

    revalidatePath('/servicios');
    return { success: true, service: newService, message: "Servicio creado exitosamente" };
  } catch (error) {
    console.error("Error al crear servicio:", error);
    return { success: false, error: "Error al registrar el servicio en la base de datos." };
  }
}

export async function toggleServiceStatus(id: string, activo: boolean) {
  try {
    const updated = await prisma.servicio.update({
      where: { id },
      data: { activo },
    });

    revalidatePath('/servicios');
    return { success: true, service: updated };
  } catch (error) {
    console.error("Error al actualizar estado del servicio:", error);
    return { success: false, error: "Error al cambiar el estado del servicio." };
  }
}

export async function updateService(id: string, input: ServiceInput) {
  try {
    const parsed = ServiceSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { success: false, error: issue ? issue.message : "Datos inválidos" };
    }

    const updated = await prisma.servicio.update({
      where: { id },
      data: {
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion || "",
        duracionMinutos: parsed.data.duracionMinutos,
        precio: parseFloat(parsed.data.precio.toFixed(2)),
      },
    });

    revalidatePath('/servicios');
    return { success: true, service: updated, message: "Servicio actualizado exitosamente" };
  } catch (error) {
    console.error("Error al actualizar servicio:", error);
    return { success: false, error: "Error al actualizar el servicio en la base de datos." };
  }
}

export async function deleteService(id: string) {
  try {
    const parsed = DeleteServiceSchema.safeParse({ id });
    if (!parsed.success) {
      return { success: false, error: "Identificador de servicio inválido." };
    }

    const service = await prisma.servicio.findUnique({
      where: { id: parsed.data.id },
      include: {
        _count: {
          select: { citas: true },
        },
      },
    });

    if (!service) {
      return { success: false, error: "El servicio no existe o ya fue eliminado." };
    }

    if (service._count.citas > 0) {
      return {
        success: false,
        error: "No se puede eliminar el servicio porque tiene citas asociadas. Se recomienda desactivarlo para conservar el historial.",
        hasAppointments: true,
      };
    }

    await prisma.servicio.delete({
      where: { id: parsed.data.id },
    });

    revalidatePath('/servicios');
    return { success: true, message: "Servicio eliminado exitosamente." };
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    return { success: false, error: "Error al eliminar el servicio de la base de datos." };
  }
}
