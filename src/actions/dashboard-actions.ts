'use server';

import { prisma } from '@/lib/prisma';

export interface DashboardMetrics {
  todayAppointmentsCount: number;
  pendingAppointmentsCount: number;
  confirmedAppointmentsCount: number;
  completedAppointmentsCount: number;
  cancelledAppointmentsCount: number;
  totalClientsCount: number;
  totalServicesCount: number;
  todayEstimatedRevenue: number;
}

export interface DashboardAppointmentItem {
  id: string;
  clienteId: string;
  servicioId: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: string;
  precioFinal: number;
  notasInternas?: string | null;
  cliente: {
    id: string;
    nombre: string;
    telefono: string;
  };
  servicio: {
    id: string;
    nombre: string;
    duracionMinutos: number;
    precio: number;
  };
}

export interface DashboardData {
  date: string;
  metrics: DashboardMetrics;
  appointments: DashboardAppointmentItem[];
  businessName?: string;
}

export async function getDashboardData(dateStr?: string): Promise<{
  success: boolean;
  data?: DashboardData;
  error?: string;
}> {
  try {
    const today = new Date();
    let y: number, m: number, d: number;

    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      [y, m, d] = dateStr.split('-').map(Number);
    } else {
      y = today.getFullYear();
      m = today.getMonth() + 1;
      d = today.getDate();
    }

    const targetDateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    const dayEnd = new Date(y, m - 1, d, 23, 59, 59, 999);

    const [todayAppointments, totalClients, totalServices, config] = await Promise.all([
      prisma.cita.findMany({
        where: {
          fechaHoraInicio: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        include: {
          cliente: true,
          servicio: true,
        },
        orderBy: {
          fechaHoraInicio: 'asc',
        },
      }),
      prisma.cliente.count(),
      prisma.servicio.count({ where: { activo: true } }),
      prisma.negocioConfig.findFirst(),
    ]);

    // Calcular métricas
    const nonCancelled = todayAppointments.filter((a) => a.estado !== 'CANCELADA');
    const todayAppointmentsCount = nonCancelled.length;
    const pendingAppointmentsCount = todayAppointments.filter((a) => a.estado === 'PENDIENTE').length;
    const confirmedAppointmentsCount = todayAppointments.filter((a) => a.estado === 'CONFIRMADA').length;
    const completedAppointmentsCount = todayAppointments.filter((a) => a.estado === 'COMPLETADA').length;
    const cancelledAppointmentsCount = todayAppointments.filter((a) => a.estado === 'CANCELADA').length;

    const todayEstimatedRevenue = nonCancelled.reduce((acc, curr) => acc + curr.precioFinal, 0);
    const totalClientsCount = totalClients;
    const totalServicesCount = totalServices;

    const formattedAppointments: DashboardAppointmentItem[] = todayAppointments.map((appt) => ({
      id: appt.id,
      clienteId: appt.clienteId,
      servicioId: appt.servicioId,
      fechaHoraInicio: appt.fechaHoraInicio.toISOString(),
      fechaHoraFin: appt.fechaHoraFin.toISOString(),
      estado: appt.estado,
      precioFinal: appt.precioFinal,
      notasInternas: appt.notasInternas,
      cliente: {
        id: appt.cliente.id,
        nombre: appt.cliente.nombre,
        telefono: appt.cliente.telefono,
      },
      servicio: {
        id: appt.servicio.id,
        nombre: appt.servicio.nombre,
        duracionMinutos: appt.servicio.duracionMinutos,
        precio: appt.servicio.precio,
      },
    }));

    return {
      success: true,
      data: {
        date: targetDateStr,
        metrics: {
          todayAppointmentsCount,
          pendingAppointmentsCount,
          confirmedAppointmentsCount,
          completedAppointmentsCount,
          cancelledAppointmentsCount,
          totalClientsCount,
          totalServicesCount,
          todayEstimatedRevenue,
        },
        appointments: formattedAppointments,
        businessName: config?.nombreNegocio || 'Mi Negocio Digital',
      },
    };
  } catch (error) {
    console.error('Error al cargar datos del dashboard:', error);
    return {
      success: false,
      error: 'Error al cargar métricas y agenda del dashboard.',
    };
  }
}
