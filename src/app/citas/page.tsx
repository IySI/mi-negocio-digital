'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  User,
  AlertTriangle,
  CheckCircle,
  X,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Filter,
  Settings,
  Check,
  Phone
} from 'lucide-react';
import {
  getClientsAndServices,
  getAppointments,
  validateSlot,
  createAppointment,
  updateAppointmentStatus,
  rescheduleAppointment
} from '@/actions/appointment-actions';

interface ClientItem {
  id: string;
  nombre: string;
  telefono: string;
}

interface ServiceItem {
  id: string;
  nombre: string;
  duracionMinutos: number;
  precio: number;
}

interface AppointmentItem {
  id: string;
  clienteId: string;
  cliente: {
    nombre: string;
    telefono: string;
  };
  servicioId: string;
  servicio: {
    nombre: string;
    duracionMinutos: number;
    precio: number;
  };
  fechaHoraInicio: string | Date;
  fechaHoraFin: string | Date;
  estado: string;
  precioFinal: number;
  notasInternas?: string | null;
}

function formatTimeToHHmm(dateInput: string | Date): string {
  const d = new Date(dateInput);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatDateToYYYYMMDD(dateInput: string | Date): string {
  const d = new Date(dateInput);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getReadableDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${dayNames[dateObj.getDay()]}, ${d} de ${monthNames[dateObj.getMonth()]} de ${y} (${dateStr})`;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fecha seleccionada para visualización de agenda (inicia en hoy)
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateToYYYYMMDD(new Date()));

  // Filtro de estado de citas
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CONFIRMADA' | 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA'>('ALL');

  // Estado del modal de nueva cita
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientInput, setClientInput] = useState('');
  const [serviceInput, setServiceInput] = useState('');
  const [dateInput, setDateInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Estado del modal de gestión de cita (HU-06 y HU-07)
  const [appointmentToManage, setAppointmentToManage] = useState<AppointmentItem | null>(null);

  // Estado del modal de confirmación de cancelación
  const [appointmentToCancel, setAppointmentToCancel] = useState<AppointmentItem | null>(null);

  // Estados del modal de reprogramación (HU-07)
  const [appointmentToReschedule, setAppointmentToReschedule] = useState<AppointmentItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleCalculatedEndTime, setRescheduleCalculatedEndTime] = useState('');
  const [rescheduleSlotStatus, setRescheduleSlotStatus] = useState<{
    valid: boolean;
    code?: 'CONFLICT' | 'SCHEDULE_OUT';
    error?: string;
  }>({ valid: true });
  const [isValidatingRescheduleSlot, setIsValidatingRescheduleSlot] = useState(false);
  const [rescheduleFormError, setRescheduleFormError] = useState<string | null>(null);
  const [toastRescheduleSuccess, setToastRescheduleSuccess] = useState<string | null>(null);

  // Validación dinámica de slot
  const [calculatedEndTime, setCalculatedEndTime] = useState<string>('');
  const [slotStatus, setSlotStatus] = useState<{
    valid: boolean;
    code?: 'CONFLICT' | 'SCHEDULE_OUT';
    error?: string;
  }>({ valid: false });
  const [isValidatingSlot, setIsValidatingSlot] = useState(false);

  // Estados de retroalimentación
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cargar recursos
  const loadData = async (dateFilter?: string) => {
    setLoading(true);
    const [resRes, resAppts] = await Promise.all([
      getClientsAndServices(),
      getAppointments(dateFilter),
    ]);

    if (resRes.success) {
      setClients(resRes.clients);
      setServices(resRes.services);
    }
    if (resAppts.success && resAppts.appointments) {
      setAppointments(resAppts.appointments as unknown as AppointmentItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData(selectedDate);
  }, [selectedDate]);

  // Validar slot en tiempo real cuando cambian los inputs
  useEffect(() => {
    if (!serviceInput || !dateInput || !timeInput) {
      setCalculatedEndTime('');
      setSlotStatus({ valid: false });
      return;
    }

    const selectedService = services.find((s) => s.id === serviceInput);
    if (!selectedService) return;

    // Calcular hora de fin
    const [h, m] = timeInput.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const totalMinutes = h * 60 + m + selectedService.duracionMinutos;
      const endH = Math.floor(totalMinutes / 60);
      const endM = totalMinutes % 60;
      setCalculatedEndTime(
        `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
      );
    }

    let isMounted = true;
    setIsValidatingSlot(true);
    validateSlot(dateInput, timeInput, serviceInput).then((res) => {
      if (!isMounted) return;
      setIsValidatingSlot(false);
      if (res.valid) {
        setSlotStatus({ valid: true });
        if (res.endTime) setCalculatedEndTime(res.endTime);
      } else {
        setSlotStatus({
          valid: false,
          code: res.code as 'CONFLICT' | 'SCHEDULE_OUT',
          error: res.error,
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [serviceInput, dateInput, timeInput, services]);

  // Validación dinámica de horario para Reprogramación (HU-07)
  useEffect(() => {
    if (!appointmentToReschedule || !rescheduleDate || !rescheduleTime) {
      setRescheduleCalculatedEndTime('');
      setRescheduleSlotStatus({ valid: false });
      return;
    }

    const [h, m] = rescheduleTime.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const totalMinutes = h * 60 + m + appointmentToReschedule.servicio.duracionMinutos;
      const endH = Math.floor(totalMinutes / 60);
      const endM = totalMinutes % 60;
      setRescheduleCalculatedEndTime(
        `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
      );
    }

    let isMounted = true;
    setIsValidatingRescheduleSlot(true);
    validateSlot(
      rescheduleDate,
      rescheduleTime,
      appointmentToReschedule.servicioId,
      appointmentToReschedule.id
    ).then((res) => {
      if (!isMounted) return;
      setIsValidatingRescheduleSlot(false);
      if (res.valid) {
        setRescheduleSlotStatus({ valid: true });
        if (res.endTime) setRescheduleCalculatedEndTime(res.endTime);
      } else {
        setRescheduleSlotStatus({
          valid: false,
          code: res.code as 'CONFLICT' | 'SCHEDULE_OUT',
          error: res.error,
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [appointmentToReschedule, rescheduleDate, rescheduleTime]);

  // Navegación entre fechas
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setSelectedDate(formatDateToYYYYMMDD(prev));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    setSelectedDate(formatDateToYYYYMMDD(next));
  };

  const handleToday = () => {
    setSelectedDate(formatDateToYYYYMMDD(new Date()));
  };

  const handleOpenModal = () => {
    setClientInput(clients.length > 0 ? clients[0].id : '');
    setServiceInput(services.length > 0 ? services[0].id : '');
    setDateInput(selectedDate || formatDateToYYYYMMDD(new Date()));
    setTimeInput('10:00');
    setNotesInput('');
    setFormError(null);
    setSlotStatus({ valid: false });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!clientInput) {
      setFormError('Por favor seleccione un cliente.');
      return;
    }
    if (!serviceInput) {
      setFormError('Por favor seleccione un servicio.');
      return;
    }
    if (!dateInput || !timeInput) {
      setFormError('Por favor complete fecha y hora de la cita.');
      return;
    }

    if (!slotStatus.valid) {
      setFormError(slotStatus.error || 'El horario seleccionado no está disponible.');
      return;
    }

    startTransition(async () => {
      const res = await createAppointment({
        clienteId: clientInput,
        servicioId: serviceInput,
        fecha: dateInput,
        horaInicio: timeInput,
        notasInternas: notesInput,
      });

      if (!res.success) {
        setFormError(res.error || 'Error al guardar la cita.');
      } else {
        setSuccessMessage('Cita programada con éxito.');
        setTimeout(() => setSuccessMessage(null), 4000);
        setIsModalOpen(false);
        setSelectedDate(dateInput);
        loadData(dateInput);
      }
    });
  };

  // Cambio de estado (Completar / Confirmar)
  const handleUpdateStatus = (id: string, nuevoEstado: string) => {
    startTransition(async () => {
      const res = await updateAppointmentStatus(id, nuevoEstado);
      if (res.success) {
        setSuccessMessage(`Cita actualizada a ${nuevoEstado}.`);
        setTimeout(() => setSuccessMessage(null), 3000);
        loadData(selectedDate);
      } else {
        alert(res.error || 'Error al actualizar el estado de la cita.');
      }
    });
  };

  // Cancelación de cita con modal
  const handleOpenCancelModal = (cita: AppointmentItem) => {
    setAppointmentToCancel(cita);
  };

  const handleConfirmCancel = () => {
    if (!appointmentToCancel) return;
    startTransition(async () => {
      const res = await updateAppointmentStatus(appointmentToCancel.id, 'CANCELADA');
      if (res.success) {
        setSuccessMessage('Cita cancelada exitosamente. Horario liberado.');
        setTimeout(() => setSuccessMessage(null), 3000);
        setAppointmentToCancel(null);
        loadData(selectedDate);
      } else {
        alert(res.error || 'Error al cancelar la cita.');
      }
    });
  };

  // Reprogramación de citas (HU-07)
  const handleOpenRescheduleModal = (cita: AppointmentItem) => {
    setAppointmentToReschedule(cita);
    setRescheduleDate(formatDateToYYYYMMDD(cita.fechaHoraInicio));
    setRescheduleTime(formatTimeToHHmm(cita.fechaHoraInicio));
    setRescheduleFormError(null);
    setRescheduleSlotStatus({ valid: true });
  };

  const handleCloseRescheduleModal = () => {
    setAppointmentToReschedule(null);
    setRescheduleFormError(null);
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRescheduleFormError(null);

    if (!appointmentToReschedule) return;
    if (!rescheduleDate || !rescheduleTime) {
      setRescheduleFormError('Por favor complete la nueva fecha y hora.');
      return;
    }

    if (!rescheduleSlotStatus.valid) {
      setRescheduleFormError(rescheduleSlotStatus.error || 'El horario seleccionado no está disponible.');
      return;
    }

    startTransition(async () => {
      const res = await rescheduleAppointment({
        citaId: appointmentToReschedule.id,
        nuevaFecha: rescheduleDate,
        nuevaHoraInicio: rescheduleTime,
      });

      if (!res.success) {
        setRescheduleFormError(res.error || 'Error al reprogramar la cita.');
      } else {
        const msg = 'Cita reprogramada exitosamente.';
        setToastRescheduleSuccess(msg);
        setSuccessMessage(msg);
        setTimeout(() => setToastRescheduleSuccess(null), 5000);
        setTimeout(() => setSuccessMessage(null), 5000);
        setAppointmentToReschedule(null);
        setSelectedDate(rescheduleDate);
        loadData(rescheduleDate);
      }
    });
  };

  // Filtrado de citas
  const dateAppointments = selectedDate
    ? appointments.filter((appt) => formatDateToYYYYMMDD(appt.fechaHoraInicio) === selectedDate)
    : appointments;

  const filteredAppointments = statusFilter === 'ALL'
    ? dateAppointments
    : dateAppointments.filter((appt) => appt.estado.toUpperCase() === statusFilter);

  return (
    <div className="flex-1 p-8 overflow-y-auto">
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-emerald-600" />
            Agenda de Citas
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Visualización cronológica, ciclo de vida (confirmar, completar, cancelar) y filtrado interactivo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="btn-new-appointment"
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm hover:shadow"
          >
            <Plus className="w-4 h-4" />
            Nueva Cita
          </button>
        </div>
      </div>

      {/* Alerta de Éxito Global */}
      {successMessage && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Barra de Navegación de Fecha (HU-05) */}
      <div className="mt-6 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Controles de Día */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="btn-prev-day"
              onClick={handlePrevDay}
              className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              title="Día Anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              data-testid="btn-today"
              onClick={handleToday}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              Hoy
            </button>
            <button
              type="button"
              data-testid="btn-next-day"
              onClick={handleNextDay}
              className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 transition"
              title="Día Siguiente"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <input
              type="date"
              data-testid="input-agenda-date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="ml-2 border border-slate-300 rounded-lg px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Cabecera con la fecha visualizada */}
          <div
            data-testid="header-agenda-date"
            className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2"
          >
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <span>{getReadableDate(selectedDate)}</span>
          </div>
        </div>

        {/* Barra de Filtros por Estado (HU-05) */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Estado:
            </span>
            <button
              type="button"
              data-testid="filter-status-all"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              data-testid="filter-status-confirmed"
              onClick={() => setStatusFilter('CONFIRMADA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'CONFIRMADA'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Confirmadas
            </button>
            <button
              type="button"
              data-testid="filter-status-pending"
              onClick={() => setStatusFilter('PENDIENTE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'PENDIENTE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Pendientes
            </button>
            <button
              type="button"
              data-testid="filter-status-completed"
              onClick={() => setStatusFilter('COMPLETADA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'COMPLETADA'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Completadas
            </button>
            <button
              type="button"
              data-testid="filter-status-cancelled"
              onClick={() => setStatusFilter('CANCELADA')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === 'CANCELADA'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Canceladas
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {filteredAppointments.length} cita(s) encontrada(s)
          </div>
        </div>
      </div>

      {/* Listado de Citas en Tarjetas */}
      <div className="mt-6">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Cargando agenda de citas...</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
            <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700">No hay citas para los filtros seleccionados</h3>
            <p className="text-sm text-slate-400 mt-1">
              Prueba cambiando la fecha o seleccionando otro filtro de estado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAppointments.map((cita) => {
              const startFormatted = formatTimeToHHmm(cita.fechaHoraInicio);
              const endFormatted = formatTimeToHHmm(cita.fechaHoraFin);
              const dateFormatted = formatDateToYYYYMMDD(cita.fechaHoraInicio);
              const estadoUpper = cita.estado.toUpperCase();

              return (
                <div
                  key={cita.id}
                  data-testid="appointment-card"
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
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

                        <h4 className="font-bold text-slate-800 text-base mt-2 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-emerald-600" />
                          {cita.cliente.nombre}
                        </h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          {cita.servicio.nombre} ({cita.servicio.duracionMinutos} min)
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-emerald-700">
                          ${cita.precioFinal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span className="flex items-center gap-1 text-slate-500">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                        {dateFormatted}
                      </span>
                      <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {startFormatted} - {endFormatted}
                      </span>
                    </div>
                  </div>

                  {/* Acciones del Ciclo de Vida y Reprogramación (HU-06 y HU-07) */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      data-testid="btn-manage-appointment"
                      onClick={() => setAppointmentToManage(cita)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer"
                      title="Gestionar Cita"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-500" />
                      <span>Gestionar</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {estadoUpper === 'PENDIENTE' && (
                        <>
                          <button
                            type="button"
                            data-testid="btn-status-confirmed"
                            onClick={() => handleUpdateStatus(cita.id, 'CONFIRMADA')}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition flex items-center gap-1 cursor-pointer"
                            title="Confirmar Cita"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmar</span>
                          </button>
                          <button
                            type="button"
                            data-testid="btn-reschedule"
                            onClick={() => handleOpenRescheduleModal(cita)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition flex items-center gap-1 cursor-pointer"
                            title="Reprogramar Cita"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Reprogramar</span>
                          </button>
                          <button
                            type="button"
                            data-testid="btn-cancel-appointment"
                            onClick={() => handleOpenCancelModal(cita)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                            title="Cancelar Cita"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancelar</span>
                          </button>
                        </>
                      )}

                      {estadoUpper === 'CONFIRMADA' && (
                        <>
                          <button
                            type="button"
                            data-testid="btn-status-completed"
                            onClick={() => handleUpdateStatus(cita.id, 'COMPLETADA')}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition flex items-center gap-1 cursor-pointer"
                            title="Marcar como Completada"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Completar</span>
                          </button>
                          <button
                            type="button"
                            data-testid="btn-reschedule"
                            onClick={() => handleOpenRescheduleModal(cita)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 transition flex items-center gap-1 cursor-pointer"
                            title="Reprogramar Cita"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Reprogramar</span>
                          </button>
                          <button
                            type="button"
                            data-testid="btn-cancel-appointment"
                            onClick={() => handleOpenCancelModal(cita)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 transition flex items-center gap-1 cursor-pointer"
                            title="Cancelar Cita"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Cancelar</span>
                          </button>
                        </>
                      )}

                      {estadoUpper === 'COMPLETADA' && (
                        <span className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-blue-600" />
                          Completada (Cerrada)
                        </span>
                      )}

                      {estadoUpper === 'CANCELADA' && (
                        <span className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <X className="w-3 h-3 text-rose-600" />
                          Cancelada (Liberada)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Notificación de Éxito de Reprogramación (HU-07) */}
      {toastRescheduleSuccess && (
        <div
          data-testid="toast-reschedule-success"
          className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-600 text-white rounded-lg shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-2"
        >
          <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
          <span>{toastRescheduleSuccess}</span>
        </div>
      )}

      {/* Diálogo Modal de Reprogramación (HU-07) */}
      {appointmentToReschedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                Reprogramar Cita
              </h3>
              <button
                type="button"
                onClick={handleCloseRescheduleModal}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="p-6 space-y-4">
              {rescheduleFormError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{rescheduleFormError}</span>
                </div>
              )}

              {/* Info Cita Actual */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <p><strong>Cliente:</strong> {appointmentToReschedule.cliente.nombre}</p>
                <p><strong>Servicio:</strong> {appointmentToReschedule.servicio.nombre} ({appointmentToReschedule.servicio.duracionMinutos} min)</p>
                <p><strong>Horario Original:</strong> {formatDateToYYYYMMDD(appointmentToReschedule.fechaHoraInicio)} de {formatTimeToHHmm(appointmentToReschedule.fechaHoraInicio)} a {formatTimeToHHmm(appointmentToReschedule.fechaHoraFin)}</p>
              </div>

              {/* Nueva Fecha y Hora */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nueva Fecha
                  </label>
                  <input
                    type="date"
                    data-testid="input-reschedule-date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nueva Hora de Inicio
                  </label>
                  <input
                    type="time"
                    data-testid="input-reschedule-time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Hora calculada y disponibilidad */}
              {rescheduleCalculatedEndTime && (
                <div className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Finalizará a las <strong>{rescheduleCalculatedEndTime}</strong> ({appointmentToReschedule.servicio.duracionMinutos} min)
                  </span>
                </div>
              )}

              {isValidatingRescheduleSlot ? (
                <div className="text-xs text-slate-400">Verificando disponibilidad del nuevo horario...</div>
              ) : !rescheduleSlotStatus.valid && rescheduleSlotStatus.error ? (
                rescheduleSlotStatus.code === 'CONFLICT' ? (
                  <div
                    data-testid="alert-conflict"
                    className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                    <span>{rescheduleSlotStatus.error}</span>
                  </div>
                ) : (
                  <div
                    data-testid="alert-schedule-out"
                    className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                    <span>{rescheduleSlotStatus.error}</span>
                  </div>
                )
              ) : (
                <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Horario disponible para reprogramar.</span>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseRescheduleModal}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="btn-save-reschedule"
                  disabled={isPending || isValidatingRescheduleSlot || !rescheduleSlotStatus.valid}
                  className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition shadow-sm"
                >
                  {isPending ? 'Guardando...' : 'Guardar Cambio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo Modal de Confirmación de Cancelación (HU-06) */}
      {appointmentToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="font-bold text-slate-800 text-lg">Cancelar Cita</h3>
            </div>
            <p className="text-sm text-slate-600">
              ¿Estás seguro de que deseas cancelar la cita de <strong>{appointmentToCancel.cliente.nombre}</strong>?
              El horario ({formatTimeToHHmm(appointmentToCancel.fechaHoraInicio)} - {formatTimeToHHmm(appointmentToCancel.fechaHoraFin)}) quedará liberado para nuevas reservas.
            </p>
            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAppointmentToCancel(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
              >
                No, mantener cita
              </button>
              <button
                type="button"
                data-testid="btn-confirm-cancel"
                onClick={handleConfirmCancel}
                disabled={isPending}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-sm"
              >
                {isPending ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nueva Cita */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
                Nueva Cita
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Selección de Cliente */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cliente *
                </label>
                <select
                  data-testid="select-client"
                  value={clientInput}
                  onChange={(e) => setClientInput(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Seleccionar Cliente --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.telefono})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selección de Servicio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Servicio *
                </label>
                <select
                  data-testid="select-service"
                  value={serviceInput}
                  onChange={(e) => setServiceInput(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Seleccionar Servicio --</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.duracionMinutos} min) - ${s.precio.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fecha y Hora de Inicio */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    data-testid="input-appointment-date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    data-testid="input-appointment-time"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Hora de Fin Calculada */}
              {calculatedEndTime && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-600">
                  <span className="font-medium">Hora de finalización estimada:</span>
                  <span
                    data-testid="calculated-end-time"
                    className="font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded"
                  >
                    {calculatedEndTime}
                  </span>
                </div>
              )}

              {/* Advertencias de Conflicto o Fuera de Horario */}
              {slotStatus.code === 'CONFLICT' && (
                <div
                  data-testid="alert-conflict"
                  className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2 font-medium"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
                  <span>El horario seleccionado entra en conflicto con otra cita activa</span>
                </div>
              )}

              {slotStatus.code === 'SCHEDULE_OUT' && (
                <div
                  data-testid="alert-schedule-out"
                  className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg flex items-center gap-2 font-medium"
                >
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
                  <span>
                    El horario seleccionado está fuera de la jornada de atención o en horario de receso
                  </span>
                </div>
              )}

              {/* Notas Internas Opcionales */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notas Internas (Opcional)
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={2}
                  placeholder="Detalles sobre la cita o preferencias del cliente..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="btn-confirm-appointment"
                  disabled={
                    !slotStatus.valid ||
                    isPending ||
                    isValidatingSlot ||
                    !clientInput ||
                    !serviceInput
                  }
                  className={`px-4 py-2 rounded-lg text-sm font-semibold text-white transition ${
                    slotStatus.valid && !isPending && !isValidatingSlot
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'
                      : 'bg-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isPending ? 'Guardando...' : 'Confirmar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diálogo Modal de Gestión de Cita (HU-06 y HU-07) */}
      {appointmentToManage && (
        <div
          data-testid="modal-manage-appointment"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Cabecera */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                  <Settings className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Gestionar Cita</h3>
                  <p className="text-xs text-slate-500">
                    Opciones del ciclo de vida y reprogramación
                  </p>
                </div>
              </div>
              <button
                type="button"
                data-testid="btn-close-manage-modal"
                onClick={() => setAppointmentToManage(null)}
                className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Resumen de la cita */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider">Estado Actual:</span>
                  <div>
                    {appointmentToManage.estado.toUpperCase() === 'CONFIRMADA' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        CONFIRMADA
                      </span>
                    )}
                    {appointmentToManage.estado.toUpperCase() === 'PENDIENTE' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        PENDIENTE
                      </span>
                    )}
                    {appointmentToManage.estado.toUpperCase() === 'COMPLETADA' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                        COMPLETADA
                      </span>
                    )}
                    {appointmentToManage.estado.toUpperCase() === 'CANCELADA' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                        CANCELADA
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Cliente</span>
                    <span className="font-bold text-slate-800 text-sm">{appointmentToManage.cliente.nombre}</span>
                    <span className="text-slate-500 block text-[11px]">{appointmentToManage.cliente.telefono}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Servicio</span>
                    <span className="font-bold text-slate-800 text-sm">{appointmentToManage.servicio.nombre}</span>
                    <span className="text-slate-500 block text-[11px]">${appointmentToManage.precioFinal.toFixed(2)} • {appointmentToManage.servicio.duracionMinutos} min</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-700">
                  <span><strong>Fecha:</strong> {formatDateToYYYYMMDD(appointmentToManage.fechaHoraInicio)}</span>
                  <span><strong>Horario:</strong> {formatTimeToHHmm(appointmentToManage.fechaHoraInicio)} - {formatTimeToHHmm(appointmentToManage.fechaHoraFin)}</span>
                </div>
              </div>

              {/* Acciones permitidas según estado */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Acciones Disponibles Según Estado
                </h4>

                {appointmentToManage.estado.toUpperCase() === 'PENDIENTE' && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      data-testid="modal-btn-confirm"
                      onClick={() => {
                        const target = appointmentToManage;
                        setAppointmentToManage(null);
                        handleUpdateStatus(target.id, 'CONFIRMADA');
                      }}
                      className="w-full p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Confirmar Cita
                      </span>
                      <span className="text-[11px] text-emerald-600 font-normal">Pasa el estado a Confirmada</span>
                    </button>

                    <button
                      type="button"
                      data-testid="modal-btn-reschedule"
                      onClick={() => {
                        const target = appointmentToManage;
                        setAppointmentToManage(null);
                        handleOpenRescheduleModal(target);
                      }}
                      className="w-full p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Reprogramar Cita
                      </span>
                      <span className="text-[11px] text-amber-600 font-normal">Modificar fecha y hora con validación</span>
                    </button>

                    <button
                      type="button"
                      data-testid="modal-btn-cancel"
                      onClick={() => {
                        const target = appointmentToManage;
                        setAppointmentToManage(null);
                        handleOpenCancelModal(target);
                      }}
                      className="w-full p-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <X className="w-4 h-4 text-rose-600" />
                        Cancelar Cita
                      </span>
                      <span className="text-[11px] text-rose-600 font-normal">Libera el cupo en la agenda</span>
                    </button>
                  </div>
                )}

                {appointmentToManage.estado.toUpperCase() === 'CONFIRMADA' && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      data-testid="modal-btn-complete"
                      onClick={() => {
                        const target = appointmentToManage;
                        setAppointmentToManage(null);
                        handleUpdateStatus(target.id, 'COMPLETADA');
                      }}
                      className="w-full p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        Marcar como Completada
                      </span>
                      <span className="text-[11px] text-blue-600 font-normal">Registra atención brindada y cierra el ciclo</span>
                    </button>

                    <button
                      type="button"
                      data-testid="modal-btn-reschedule"
                      onClick={() => {
                        const target = appointmentToManage;
                        setAppointmentToManage(null);
                        handleOpenRescheduleModal(target);
                      }}
                      className="w-full p-3 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600" />
                        Reprogramar Cita
                      </span>
                      <span className="text-[11px] text-amber-600 font-normal">Modificar fecha y hora con validación</span>
                    </button>

                    <button
                      type="button"
                      data-testid="modal-btn-cancel"
                      onClick={() => {
                        const target = appointmentToManage;
                        setAppointmentToManage(null);
                        handleOpenCancelModal(target);
                      }}
                      className="w-full p-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 font-semibold text-xs flex items-center justify-between transition cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <X className="w-4 h-4 text-rose-600" />
                        Cancelar Cita
                      </span>
                      <span className="text-[11px] text-rose-600 font-normal">Libera el cupo en la agenda</span>
                    </button>
                  </div>
                )}

                {appointmentToManage.estado.toUpperCase() === 'COMPLETADA' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-blue-600" />
                      Cita Completada (Historial Protegido)
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Esta cita fue completada exitosamente. De acuerdo a las reglas de negocio, su historial queda protegido y no admite modificaciones, cancelaciones ni reprogramaciones.
                    </p>
                  </div>
                )}

                {appointmentToManage.estado.toUpperCase() === 'CANCELADA' && (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <X className="w-4 h-4 text-rose-600" />
                      Cita Cancelada (Horario Liberado)
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Esta cita fue cancelada y el cupo horario en la agenda fue liberado para nuevas reservas. Las citas canceladas no admiten reactivación ni modificaciones.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                data-testid="btn-close-manage-modal"
                onClick={() => setAppointmentToManage(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
