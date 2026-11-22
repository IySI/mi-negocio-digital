'use server';

import { prisma } from '@/lib/prisma';
import { BusinessConfigSchema, BusinessConfigInput } from '@/lib/validations/schedule';
import { revalidatePath } from 'next/cache';

const DIAS_DEFECTO = [
  { diaSemana: 0, activo: false, horaApertura: "09:00", horaCierre: "18:00", inicioAlmuerzo: "13:00", finAlmuerzo: "14:00" }, // Domingo
  { diaSemana: 1, activo: true,  horaApertura: "09:00", horaCierre: "18:00", inicioAlmuerzo: "13:00", finAlmuerzo: "14:00" }, // Lunes
  { diaSemana: 2, activo: true,  horaApertura: "09:00", horaCierre: "18:00", inicioAlmuerzo: "13:00", finAlmuerzo: "14:00" }, // Martes
  { diaSemana: 3, activo: true,  horaApertura: "09:00", horaCierre: "18:00", inicioAlmuerzo: "13:00", finAlmuerzo: "14:00" }, // Miércoles
  { diaSemana: 4, activo: true,  horaApertura: "09:00", horaCierre: "18:00", inicioAlmuerzo: "13:00", finAlmuerzo: "14:00" }, // Jueves
  { diaSemana: 5, activo: true,  horaApertura: "09:00", horaCierre: "18:00", inicioAlmuerzo: "13:00", finAlmuerzo: "14:00" }, // Viernes
  { diaSemana: 6, activo: false, horaApertura: "09:00", horaCierre: "14:00", inicioAlmuerzo: null,    finAlmuerzo: null },    // Sábado
];

export async function getBusinessSchedule() {
  try {
    let config = await prisma.negocioConfig.findFirst();
    if (!config) {
      config = await prisma.negocioConfig.create({
        data: {
          nombreNegocio: "Mi Negocio Digital",
          telefono: "555-0100",
          direccion: "Av. Principal 123",
          moneda: "$",
          duracionTurnoMinutos: 30,
        },
      });
    }

    let horarios = await prisma.horarioAtencion.findMany({
      orderBy: { diaSemana: 'asc' },
    });

    if (horarios.length === 0) {
      for (const d of DIAS_DEFECTO) {
        await prisma.horarioAtencion.create({ data: d });
      }
      horarios = await prisma.horarioAtencion.findMany({
        orderBy: { diaSemana: 'asc' },
      });
    }

    return {
      success: true,
      config,
      horarios,
    };
  } catch (error) {
    console.error("Error al obtener horarios:", error);
    return {
      success: false,
      error: "Error al cargar la configuración de horarios.",
      config: null,
      horarios: [],
    };
  }
}

export async function saveBusinessSchedule(input: BusinessConfigInput) {
  try {
    // 1. Validación de esquema
    const result = BusinessConfigSchema.safeParse(input);
    if (!result.success) {
      const issue = result.error.issues[0];
      return {
        success: false,
        error: issue ? issue.message : "Error de validación en los datos.",
      };
    }

    const { nombreNegocio, telefono, direccion, moneda, duracionTurnoMinutos, horarios } = result.data;

    // Validación explícita de lógica de negocio (apertura vs cierre)
    for (const h of horarios) {
      if (h.activo && h.horaCierre <= h.horaApertura) {
        return {
          success: false,
          error: "La hora de cierre debe ser posterior a la de apertura.",
        };
      }
    }

    // 2. Guardar o actualizar configuración general
    const existingConfig = await prisma.negocioConfig.findFirst();
    if (existingConfig) {
      await prisma.negocioConfig.update({
        where: { id: existingConfig.id },
        data: {
          nombreNegocio,
          telefono: telefono || "",
          direccion: direccion || "",
          moneda,
          duracionTurnoMinutos,
        },
      });
    } else {
      await prisma.negocioConfig.create({
        data: {
          nombreNegocio,
          telefono: telefono || "",
          direccion: direccion || "",
          moneda,
          duracionTurnoMinutos,
        },
      });
    }

    // 3. Upsert de horarios por día
    for (const h of horarios) {
      await prisma.horarioAtencion.upsert({
        where: { diaSemana: h.diaSemana },
        update: {
          activo: h.activo,
          horaApertura: h.horaApertura,
          horaCierre: h.horaCierre,
          inicioAlmuerzo: h.inicioAlmuerzo || null,
          finAlmuerzo: h.finAlmuerzo || null,
        },
        create: {
          diaSemana: h.diaSemana,
          activo: h.activo,
          horaApertura: h.horaApertura,
          horaCierre: h.horaCierre,
          inicioAlmuerzo: h.inicioAlmuerzo || null,
          finAlmuerzo: h.finAlmuerzo || null,
        },
      });
    }

    revalidatePath('/horarios');
    return {
      success: true,
      message: "Horarios guardados correctamente",
    };
  } catch (error) {
    console.error("Error al guardar horarios:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado al guardar los horarios.",
    };
  }
}
