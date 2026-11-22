'use server';

import { prisma } from '@/lib/prisma';
import {
  AppointmentSchema,
  AppointmentInput,
  RescheduleSchema,
  RescheduleInput,
} from '@/lib/validations/appointment';
import { revalidatePath } from 'next/cache';

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export async function getClientsAndServices() {
  try {
    const clients = await prisma.cliente.findMany({
      orderBy: { nombre: 'asc' },
    });
    const services = await prisma.servicio.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
    return { success: true, clients, services };
  } catch (error) {
    console.error("Error al obtener clientes y servicios:", error);
    return { success: false, error: "Error al cargar recursos", clients: [], services: [] };
  }
}

export async function getAppointments(dateString?: string) {
  try {
    let whereClause = {};
    if (dateString) {
      const [y, m, d] = dateString.split('-').map(Number);
      const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
      const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);
      whereClause = {
        fechaHoraInicio: {
          gte: dayStart,
          lte: dayEnd,
        },
      };
    }

    const appointments = await prisma.cita.findMany({
      where: whereClause,
      include: {
        cliente: true,
        servicio: true,
      },
      orderBy: { fechaHoraInicio: 'asc' },
    });

    return { success: true, appointments };
  } catch (error) {
    console.error("Error al obtener citas:", error);
    return { success: false, error: "Error al cargar citas", appointments: [] };
  }
}

export async function validateSlot(
  date: string,
  startTime: string,
  serviceId: string,
  excludeAppointmentId?: string
) {
  try {
    if (!date || !startTime || !serviceId) {
      return { valid: false, error: "Faltan datos para validar el horario." };
    }

    const service = await prisma.servicio.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return { valid: false, error: "Servicio no encontrado." };
    }

    const durationMinutes = service.duracionMinutos;
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + durationMinutes;
    const endTime = minutesToTime(endMinutes);

    // 1. Obtener día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const diaSemana = dateObj.getDay();

    // 2. Validar horario de atención del negocio
    const horario = await prisma.horarioAtencion.findUnique({
      where: { diaSemana },
    });

    if (!horario || !horario.activo) {
      return {
        valid: false,
        code: 'SCHEDULE_OUT',
        error: "El negocio no abre en el día seleccionado o está fuera de la jornada de atención.",
        endTime,
      };
    }

    const aperturaMinutes = timeToMinutes(horario.horaApertura);
    const cierreMinutes = timeToMinutes(horario.horaCierre);

    // Validar fuera de jornada
    if (startMinutes < aperturaMinutes || endMinutes > cierreMinutes) {
      return {
        valid: false,
        code: 'SCHEDULE_OUT',
        error: "El horario seleccionado está fuera de la jornada de atención o en horario de receso.",
        endTime,
      };
    }

    // Validar receso / almuerzo si existe
    if (horario.inicioAlmuerzo && horario.finAlmuerzo) {
      const lunchStart = timeToMinutes(horario.inicioAlmuerzo);
      const lunchEnd = timeToMinutes(horario.finAlmuerzo);

      // Hay colisión con el receso si start < lunchEnd && end > lunchStart
      if (startMinutes < lunchEnd && endMinutes > lunchStart) {
        return {
          valid: false,
          code: 'SCHEDULE_OUT',
          error: "El horario seleccionado está fuera de la jornada de atención o en horario de receso.",
          endTime,
        };
      }
    }

    // 3. Validar solapamiento con citas existentes
    const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);

    const existingAppointments = await prisma.cita.findMany({
      where: {
        fechaHoraInicio: { gte: dayStart, lte: dayEnd },
        estado: { not: 'CANCELADA' },
        ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      },
    });

    const candidateStart = new Date(y, m - 1, d, Math.floor(startMinutes / 60), startMinutes % 60);
    const candidateEnd = new Date(y, m - 1, d, Math.floor(endMinutes / 60), endMinutes % 60);

    for (const appt of existingAppointments) {
      const apptStart = new Date(appt.fechaHoraInicio);
      const apptEnd = new Date(appt.fechaHoraFin);

      // Solapamiento: candidateStart < apptEnd && candidateEnd > apptStart
      if (candidateStart < apptEnd && candidateEnd > apptStart) {
        return {
          valid: false,
          code: 'CONFLICT',
          error: "El horario seleccionado entra en conflicto con otra cita activa",
          endTime,
        };
      }
    }

    return {
      valid: true,
      durationMinutes,
      endTime,
      price: service.precio,
    };
  } catch (error) {
    console.error("Error al validar slot de cita:", error);
    return { valid: false, error: "Error interno al validar disponibilidad." };
  }
}

export async function createAppointment(input: AppointmentInput) {
  try {
    const parsed = AppointmentSchema.safeParse(input);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return { success: false, error: issue ? issue.message : "Datos inválidos" };
    }

    const { clienteId, servicioId, fecha, horaInicio, notasInternas } = parsed.data;

    // Validación estricta en servidor
    const validation = await validateSlot(fecha, horaInicio, servicioId);
    if (!validation.valid) {
      return {
        success: false,
        code: validation.code,
        error: validation.error || "El horario seleccionado no está disponible.",
      };
    }

    const service = await prisma.servicio.findUnique({
      where: { id: servicioId },
    });

    if (!service) {
      return { success: false, error: "Servicio no encontrado" };
    }

    const [y, m, d] = fecha.split('-').map(Number);
    const startMinutes = timeToMinutes(horaInicio);
    const endMinutes = startMinutes + service.duracionMinutos;

    const fechaHoraInicio = new Date(y, m - 1, d, Math.floor(startMinutes / 60), startMinutes % 60);
    const fechaHoraFin = new Date(y, m - 1, d, Math.floor(endMinutes / 60), endMinutes % 60);

    const newAppointment = await prisma.cita.create({
      data: {
        clienteId,
        servicioId,
        fechaHoraInicio,
        fechaHoraFin,
        estado: 'CONFIRMADA',
        precioFinal: service.precio,
        notasInternas: notasInternas || null,
      },
      include: {
        cliente: true,
        servicio: true,
      },
    });

    revalidatePath('/citas');
    return {
      success: true,
      appointment: newAppointment,
      message: "Cita programada exitosamente",
    };
  } catch (error) {
    console.error("Error al agendar cita:", error);
    return { success: false, error: "Error al registrar la cita en la base de datos." };
  }
}

export async function updateAppointmentStatus(id: string, nuevoEstado: string) {
  try {
    const validStates = ['PENDIENTE', 'CONFIRMADA', 'COMPLETADA', 'CANCELADA'];
    const estadoNormalizado = nuevoEstado.toUpperCase();

    if (!validStates.includes(estadoNormalizado)) {
      return { success: false, error: "Estado no válido" };
    }

    const currentAppointment = await prisma.cita.findUnique({
      where: { id },
    });

    if (!currentAppointment) {
      return { success: false, error: "Cita no encontrada." };
    }

    if (currentAppointment.estado === 'COMPLETADA') {
      return {
        success: false,
        error: "No se puede modificar una cita completada para preservar el historial.",
      };
    }

    if (currentAppointment.estado === 'CANCELADA') {
      return {
        success: false,
        error: "No se puede modificar una cita cancelada.",
      };
    }

    const updated = await prisma.cita.update({
      where: { id },
      data: { estado: estadoNormalizado },
      include: { cliente: true, servicio: true },
    });

    revalidatePath('/citas');
    return {
      success: true,
      appointment: updated,
      message: `Cita actualizada a estado ${estadoNormalizado}`,
    };
  } catch (error) {
    console.error("Error al actualizar estado de cita:", error);
    return { success: false, error: "Error al actualizar la cita en la base de datos." };
  }
}

export async function rescheduleAppointment(input: {
  citaId: string;
  nuevaFecha: string;
  nuevaHoraInicio: string;
}) {
  try {
    const validated = RescheduleSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        error: validated.error.issues[0]?.message || 'Datos de reprogramación inválidos',
      };
    }

    const { citaId, nuevaFecha, nuevaHoraInicio } = validated.data;

    const existingAppointment = await prisma.cita.findUnique({
      where: { id: citaId },
      include: { servicio: true, cliente: true },
    });

    if (!existingAppointment) {
      return { success: false, error: 'Cita no encontrada.' };
    }

    if (existingAppointment.estado === 'COMPLETADA') {
      return { success: false, error: 'No se puede reprogramar una cita completada para preservar el historial.' };
    }

    if (existingAppointment.estado === 'CANCELADA') {
      return { success: false, error: 'No se puede reprogramar una cita cancelada.' };
    }

    // Validar nuevo slot excluyendo la cita actual para no colisionar consigo misma
    const slotValidation = await validateSlot(
      nuevaFecha,
      nuevaHoraInicio,
      existingAppointment.servicioId,
      citaId
    );

    if (!slotValidation.valid) {
      return {
        success: false,
        code: slotValidation.code,
        error: slotValidation.error || 'El nuevo horario no está disponible.',
      };
    }

    // Calcular nuevas fechas
    const [y, m, d] = nuevaFecha.split('-').map(Number);
    const startMinutes = timeToMinutes(nuevaHoraInicio);
    const endMinutes = startMinutes + existingAppointment.servicio.duracionMinutos;

    const fechaHoraInicio = new Date(y, m - 1, d, Math.floor(startMinutes / 60), startMinutes % 60);
    const fechaHoraFin = new Date(y, m - 1, d, Math.floor(endMinutes / 60), endMinutes % 60);

    const updated = await prisma.cita.update({
      where: { id: citaId },
      data: {
        fechaHoraInicio,
        fechaHoraFin,
      },
      include: { cliente: true, servicio: true },
    });

    revalidatePath('/citas');
    return {
      success: true,
      appointment: updated,
      message: 'Cita reprogramada exitosamente',
    };
  } catch (error) {
    console.error('Error al reprogramar cita:', error);
    return { success: false, error: 'Error al reprogramar la cita en la base de datos.' };
  }
}
