'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  Briefcase,
  Plus,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Store
} from 'lucide-react';
import { getDashboardData, DashboardData } from '@/actions/dashboard-actions';

function formatTimeToHHmm(isoString: string): string {
  const d = new Date(isoString);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function getReadableDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${dias[dateObj.getDay()]}, ${d} de ${meses[m - 1]} de ${y}`;
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async (dateFilter?: string) => {
    setLoading(true);
    setError(null);
    const res = await getDashboardData(dateFilter);
    if (res.success && res.data) {
      setDashboardData(res.data);
    } else {
      setError(res.error || 'Error al cargar los datos del panel.');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const metrics = dashboardData?.metrics || {
    todayAppointmentsCount: 0,
    pendingAppointmentsCount: 0,
    confirmedAppointmentsCount: 0,
    completedAppointmentsCount: 0,
    cancelledAppointmentsCount: 0,
    totalClientsCount: 0,
    totalServicesCount: 0,
    todayEstimatedRevenue: 0,
  };

  const appointments = dashboardData?.appointments || [];

  return (
    <div className="flex-1 p-8 overflow-y-auto space-y-8 max-w-7xl mx-auto">
      {/* Cabecera Principal y Saludo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>{dashboardData?.businessName || 'Mi Negocio Digital'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Panel Operativo Diario
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-slate-400" />
            <span>{dashboardData ? getReadableDate(dashboardData.date) : 'Cargando fecha...'}</span>
          </p>
        </div>

        {/* Acceso Rápido Principal: Nueva Cita */}
        <div className="flex items-center gap-3">
          <Link
            href="/citas"
            data-testid="btn-new-appointment"
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Cita</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjetas de Métricas Operativas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Métrica 1: Citas de Hoy */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Citas de Hoy</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CalendarIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              data-testid="metric-today-appointments"
              className="text-3xl font-extrabold text-slate-800"
            >
              {loading ? '...' : metrics.todayAppointmentsCount}
            </span>
            <span className="text-xs text-slate-400">programada(s)</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {metrics.confirmedAppointmentsCount} confirmada(s) • {metrics.completedAppointmentsCount} completada(s)
          </p>
        </div>

        {/* Métrica 2: Citas Pendientes */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Citas Pendientes</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              data-testid="metric-pending-appointments"
              className="text-3xl font-extrabold text-amber-600"
            >
              {loading ? '...' : metrics.pendingAppointmentsCount}
            </span>
            <span className="text-xs text-slate-400">por confirmar</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Requieren atención o confirmación</p>
        </div>

        {/* Métrica 3: Clientes Registrados */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Directorio de Clientes</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              data-testid="metric-total-clients"
              className="text-3xl font-extrabold text-slate-800"
            >
              {loading ? '...' : metrics.totalClientsCount}
            </span>
            <span className="text-xs text-slate-400">registrado(s)</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Base de clientes activos</p>
        </div>

        {/* Métrica 4: Ingresos Estimados del Día */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Ingresos Estimados Hoy</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              data-testid="metric-today-revenue"
              className="text-3xl font-extrabold text-emerald-700"
            >
              ${loading ? '...' : metrics.todayEstimatedRevenue.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Basado en citas activas del día</p>
        </div>
      </div>

      {/* Accesos Rápidos Principales */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
          <span>Accesos Rápidos</span>
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/citas"
            data-testid="quick-action-agenda"
            className="p-4 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <CalendarIcon className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Agenda de Citas</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ver turnos y filtros</p>
            </div>
          </Link>

          <Link
            href="/clientes"
            data-testid="quick-action-clients"
            className="p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Clientes</h3>
              <p className="text-xs text-slate-400 mt-0.5">Directorio e historial</p>
            </div>
          </Link>

          <Link
            href="/servicios"
            data-testid="quick-action-services"
            className="p-4 rounded-lg border border-slate-200 hover:border-purple-500 hover:bg-purple-50/50 transition group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <Briefcase className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Servicios</h3>
              <p className="text-xs text-slate-400 mt-0.5">Catálogo y precios</p>
            </div>
          </Link>

          <Link
            href="/horarios"
            data-testid="quick-action-schedule"
            className="p-4 rounded-lg border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 transition group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Horarios</h3>
              <p className="text-xs text-slate-400 mt-0.5">Jornada y recesos</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Sección Agenda de Hoy / Próximas Citas */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>Agenda de Hoy</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Citas programadas para la jornada en orden cronológico
            </p>
          </div>

          <Link
            href="/citas"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            <span>Ir a la Agenda Completa</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Contenedor oficial dashboard-appointments-list */}
        <div data-testid="dashboard-appointments-list">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Cargando agenda del día...
            </div>
          ) : appointments.length === 0 ? (
            <div
              data-testid="dashboard-empty-state"
              className="text-center py-12 bg-slate-50 border border-slate-200 rounded-xl p-8 space-y-3"
            >
              <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-semibold text-slate-700">
                No tienes citas programadas para hoy
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Aprovecha para organizar tus servicios o agendar una nueva cita.
              </p>
              <div className="pt-2">
                <Link
                  href="/citas"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Programar Cita</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
              {appointments.map((cita) => {
                const startFormatted = formatTimeToHHmm(cita.fechaHoraInicio);
                const endFormatted = formatTimeToHHmm(cita.fechaHoraFin);
                const estadoUpper = cita.estado.toUpperCase();

                return (
                  <div
                    key={cita.id}
                    data-testid="appointment-card"
                    className="p-4 bg-white hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Horario */}
                      <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-bold text-xs min-w-[120px] justify-center">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{startFormatted} - {endFormatted}</span>
                      </div>

                      {/* Info de Cliente y Servicio */}
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <span>{cita.cliente.nombre}</span>
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          <span>{cita.servicio.nombre} ({cita.servicio.duracionMinutos} min)</span>
                        </p>
                      </div>
                    </div>

                    {/* Estado e Importe */}
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div>
                        {estadoUpper === 'CONFIRMADA' && (
                          <span
                            data-testid="badge-confirmed"
                            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800"
                          >
                            CONFIRMADA
                          </span>
                        )}
                        {estadoUpper === 'PENDIENTE' && (
                          <span
                            data-testid="badge-pending"
                            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800"
                          >
                            PENDIENTE
                          </span>
                        )}
                        {estadoUpper === 'COMPLETADA' && (
                          <span
                            data-testid="badge-completed"
                            className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800"
                          >
                            COMPLETADA
                          </span>
                        )}
                        {estadoUpper === 'CANCELADA' && (
                          <>
                            <span
                              data-testid="badge-cancelled"
                              className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800"
                            >
                              CANCELADA
                            </span>
                            <span data-testid="badge-canceled" className="sr-only">
                              CANCELADA
                            </span>
                          </>
                        )}
                      </div>

                      <span className="text-sm font-bold text-emerald-700 min-w-[60px] text-right">
                        ${cita.precioFinal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
