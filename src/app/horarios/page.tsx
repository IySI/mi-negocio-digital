'use client';

import React, { useState, useEffect } from 'react';
import { getBusinessSchedule, saveBusinessSchedule } from '@/actions/schedule-actions';
import { Clock, Store, CheckCircle, AlertCircle, Save, Calendar } from 'lucide-react';

interface DaySchedule {
  diaSemana: number;
  activo: boolean;
  horaApertura: string;
  horaCierre: string;
  inicioAlmuerzo: string | null;
  finAlmuerzo: string | null;
}

const NOMBRES_DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

export default function HorariosPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [nombreNegocio, setNombreNegocio] = useState('Mi Negocio Digital');
  const [telefono, setTelefono] = useState('555-0100');
  const [direccion, setDireccion] = useState('Av. Principal 123');
  const [moneda, setMoneda] = useState('$');
  const [duracionTurno, setDuracionTurno] = useState(30);

  const [horarios, setHorarios] = useState<DaySchedule[]>([
    { diaSemana: 0, activo: false, horaApertura: '09:00', horaCierre: '18:00', inicioAlmuerzo: '13:00', finAlmuerzo: '14:00' },
    { diaSemana: 1, activo: true,  horaApertura: '09:00', horaCierre: '18:00', inicioAlmuerzo: '13:00', finAlmuerzo: '14:00' },
    { diaSemana: 2, activo: true,  horaApertura: '09:00', horaCierre: '18:00', inicioAlmuerzo: '13:00', finAlmuerzo: '14:00' },
    { diaSemana: 3, activo: true,  horaApertura: '09:00', horaCierre: '18:00', inicioAlmuerzo: '13:00', finAlmuerzo: '14:00' },
    { diaSemana: 4, activo: true,  horaApertura: '09:00', horaCierre: '18:00', inicioAlmuerzo: '13:00', finAlmuerzo: '14:00' },
    { diaSemana: 5, activo: true,  horaApertura: '09:00', horaCierre: '18:00', inicioAlmuerzo: '13:00', finAlmuerzo: '14:00' },
    { diaSemana: 6, activo: false, horaApertura: '09:00', horaCierre: '14:00', inicioAlmuerzo: null,    finAlmuerzo: null },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await getBusinessSchedule();
        if (res.success && res.config && res.horarios.length > 0) {
          setNombreNegocio(res.config.nombreNegocio);
          setTelefono(res.config.telefono || '');
          setDireccion(res.config.direccion || '');
          setMoneda(res.config.moneda || '$');
          setDuracionTurno(res.config.duracionTurnoMinutos || 30);
          setHorarios(res.horarios.map(h => ({
            diaSemana: h.diaSemana,
            activo: h.activo,
            horaApertura: h.horaApertura,
            horaCierre: h.horaCierre,
            inicioAlmuerzo: h.inicioAlmuerzo,
            finAlmuerzo: h.finAlmuerzo,
          })));
        }
      } catch (err) {
        console.error("Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDayChange = (index: number, field: keyof DaySchedule, value: any) => {
    setHorarios(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    // Limpiar alertas al editar
    setToastMessage(null);
    setErrorMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage(null);
    setErrorMessage(null);

    // Validación previa en cliente
    for (const h of horarios) {
      if (h.activo && h.horaCierre <= h.horaApertura) {
        setErrorMessage("La hora de cierre debe ser posterior a la de apertura.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await saveBusinessSchedule({
        nombreNegocio,
        telefono,
        direccion,
        moneda,
        duracionTurnoMinutos: duracionTurno,
        horarios,
      });

      if (res.success) {
        setToastMessage(res.message || "Horarios guardados correctamente");
      } else {
        setErrorMessage(res.error || "Ocurrió un error al guardar los horarios.");
      }
    } catch (err: any) {
      setErrorMessage("Error de conexión al guardar los datos.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-slate-500 font-medium animate-pulse flex items-center gap-2">
          <Clock className="w-5 h-5 animate-spin" />
          Cargando configuración de horarios...
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Store className="w-7 h-7 text-emerald-600" />
          Configuración del Negocio y Horarios de Atención
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Establece los datos de tu empresa y el horario en que prestas atención. Las citas solo podrán reservarse dentro de estos bloques.
        </p>
      </div>

      {/* Alertas */}
      {toastMessage && (
        <div
          data-testid="toast-success"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm transition-all"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          data-testid="alert-error-schedule"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 shadow-sm transition-all"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Sección: Datos del Negocio */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg border-b border-slate-100 pb-3">
            <Store className="w-5 h-5 text-slate-600" />
            Datos de la Empresa
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Nombre del Negocio
              </label>
              <input
                type="text"
                data-testid="input-business-name"
                value={nombreNegocio}
                onChange={e => setNombreNegocio(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Teléfono de Contacto
              </label>
              <input
                type="text"
                data-testid="input-business-phone"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Dirección
              </label>
              <input
                type="text"
                data-testid="input-business-address"
                value={direccion}
                onChange={e => setDireccion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </section>

        {/* Sección: Horarios Semanales */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg border-b border-slate-100 pb-3">
            <Calendar className="w-5 h-5 text-slate-600" />
            Horarios Laborales por Día
          </div>

          <div className="divide-y divide-slate-100">
            {horarios.map((dia, idx) => {
              const diaId = dia.diaSemana;
              return (
                <div key={diaId} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Interruptor y nombre del día */}
                  <div className="flex items-center gap-3 w-44">
                    <input
                      type="checkbox"
                      id={`toggle-${diaId}`}
                      data-testid={`toggle-day-${diaId}`}
                      checked={dia.activo}
                      onChange={e => handleDayChange(idx, 'activo', e.target.checked)}
                      className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <label
                      htmlFor={`toggle-${diaId}`}
                      className={`text-sm font-bold cursor-pointer ${
                        dia.activo ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {NOMBRES_DIAS[diaId]}
                    </label>
                  </div>

                  {/* Campos de hora */}
                  {dia.activo ? (
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <span className="block text-xs text-slate-500 mb-1 font-medium">Apertura</span>
                        <input
                          type="time"
                          data-testid={`input-open-${diaId}`}
                          value={dia.horaApertura}
                          onChange={e => handleDayChange(idx, 'horaApertura', e.target.value)}
                          required={dia.activo}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <span className="block text-xs text-slate-500 mb-1 font-medium">Cierre</span>
                        <input
                          type="time"
                          data-testid={`input-close-${diaId}`}
                          value={dia.horaCierre}
                          onChange={e => handleDayChange(idx, 'horaCierre', e.target.value)}
                          required={dia.activo}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <span className="block text-xs text-slate-500 mb-1 font-medium">Almuerzo Inicio</span>
                        <input
                          type="time"
                          data-testid={`input-lunch-start-${diaId}`}
                          value={dia.inicioAlmuerzo || ''}
                          onChange={e => handleDayChange(idx, 'inicioAlmuerzo', e.target.value || null)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div>
                        <span className="block text-xs text-slate-500 mb-1 font-medium">Almuerzo Fin</span>
                        <input
                          type="time"
                          data-testid={`input-lunch-end-${diaId}`}
                          value={dia.finAlmuerzo || ''}
                          onChange={e => handleDayChange(idx, 'finAlmuerzo', e.target.value || null)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 text-sm text-slate-400 italic py-2">
                      Cerrado / No laborable
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Botón de acción principal */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            data-testid="btn-save-schedule"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Guardando...' : 'Guardar Horarios'}
          </button>
        </div>
      </form>
    </div>
  );
}
