'use client';

import React, { useState, useEffect } from 'react';
import { getServices, createService, updateService, toggleServiceStatus, deleteService } from '@/actions/service-actions';
import { Briefcase, Plus, Clock, DollarSign, CheckCircle, X, AlertCircle, Pencil, Trash2 } from 'lucide-react';

interface Servicio {
  id: string;
  nombre: string;
  descripcion: string | null;
  duracionMinutos: number;
  precio: number;
  activo: boolean;
}

export default function ServiciosPage() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Servicio | null>(null);
  const [deletingService, setDeletingService] = useState<Servicio | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form states
  const [nombre, setNombre] = useState('');
  const [duracion, setDuracion] = useState('30');
  const [precio, setPrecio] = useState('25.00');
  const [descripcion, setDescripcion] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastErrorMsg, setToastErrorMsg] = useState<string | null>(null);

  const fetchServicios = async () => {
    try {
      const res = await getServices();
      if (res.success && res.services) {
        setServicios(res.services);
      }
    } catch (err) {
      console.error("Error al cargar servicios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServicios();
  }, []);

  const handleOpenModal = () => {
    setEditingService(null);
    setNombre('');
    setDuracion('30');
    setPrecio('25.00');
    setDescripcion('');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (servicio: Servicio) => {
    setEditingService(servicio);
    setNombre(servicio.nombre);
    setDuracion(String(servicio.duracionMinutos));
    setPrecio(servicio.precio.toFixed(2));
    setDescripcion(servicio.descripcion || '');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingService(null);
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const dur = parseInt(duracion, 10);
    const pr = parseFloat(precio);

    if (!nombre.trim()) {
      setErrorMsg("El nombre del servicio es obligatorio.");
      return;
    }
    if (isNaN(dur) || dur <= 0) {
      setErrorMsg("La duración debe ser un número entero positivo.");
      return;
    }
    if (isNaN(pr) || pr < 0) {
      setErrorMsg("El precio debe ser un número positivo.");
      return;
    }

    setSaving(true);
    try {
      if (editingService) {
        const res = await updateService(editingService.id, {
          nombre: nombre.trim(),
          duracionMinutos: dur,
          precio: pr,
          descripcion: descripcion.trim() || null,
          activo: editingService.activo,
        });

        if (res.success && res.service) {
          setToastMsg(`Servicio "${res.service.nombre}" actualizado exitosamente.`);
          setModalOpen(false);
          setEditingService(null);
          await fetchServicios();
          setTimeout(() => setToastMsg(null), 4000);
        } else {
          setErrorMsg(res.error || "Ocurrió un error al actualizar el servicio.");
        }
      } else {
        const res = await createService({
          nombre: nombre.trim(),
          duracionMinutos: dur,
          precio: pr,
          descripcion: descripcion.trim() || null,
          activo: true,
        });

        if (res.success && res.service) {
          setToastMsg(`Servicio "${res.service.nombre}" creado exitosamente.`);
          setModalOpen(false);
          setEditingService(null);
          await fetchServicios();
          setTimeout(() => setToastMsg(null), 4000);
        } else {
          setErrorMsg(res.error || "Ocurrió un error al guardar el servicio.");
        }
      }
    } catch (err: any) {
      setErrorMsg("Error de conexión al guardar el servicio.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    // Optimistic UI update
    setServicios(prev => prev.map(s => s.id === id ? { ...s, activo: newStatus } : s));

    try {
      const res = await toggleServiceStatus(id, newStatus);
      if (!res.success) {
        // Rollback if failed
        setServicios(prev => prev.map(s => s.id === id ? { ...s, activo: currentStatus } : s));
        console.error("Error al cambiar estado:", res.error);
      }
    } catch (err) {
      // Rollback
      setServicios(prev => prev.map(s => s.id === id ? { ...s, activo: currentStatus } : s));
      console.error("Error de conexión:", err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingService) return;
    setDeleteLoading(true);
    setToastErrorMsg(null);
    setToastMsg(null);

    try {
      const res = await deleteService(deletingService.id);
      if (res.success) {
        setToastMsg(`Servicio "${deletingService.nombre}" eliminado exitosamente.`);
        setDeletingService(null);
        await fetchServicios();
        setTimeout(() => setToastMsg(null), 4000);
      } else {
        setToastErrorMsg(res.error || "No se pudo eliminar el servicio.");
        setDeletingService(null);
        setTimeout(() => setToastErrorMsg(null), 7000);
      }
    } catch (err) {
      setToastErrorMsg("Error de conexión al eliminar el servicio.");
      setDeletingService(null);
      setTimeout(() => setToastErrorMsg(null), 7000);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-emerald-600" />
            Catálogo de Servicios
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra tus prestaciones, tarifas y tiempos de atención para el agendamiento automatizado de citas.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          data-testid="btn-new-service"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-5 h-5" />
          Nuevo Servicio
        </button>
      </div>

      {/* Notificación Toast */}
      {toastMsg && (
        <div
          data-testid="toast-success"
          className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3 shadow-sm transition-all"
        >
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{toastMsg}</span>
        </div>
      )}

      {toastErrorMsg && (
        <div
          data-testid="toast-error"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3 shadow-sm transition-all"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{toastErrorMsg}</span>
        </div>
      )}

      {/* Listado de Servicios */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
          Cargando catálogo de servicios...
        </div>
      ) : servicios.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-slate-700">No hay servicios registrados</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Da de alta tu primer servicio para comenzar a programar citas con cálculo de tiempo y costo automático.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {servicios.map(servicio => (
            <div
              key={servicio.id}
              data-testid="service-card-item"
              className={`bg-white rounded-2xl p-5 border transition-all shadow-sm flex flex-col justify-between ${
                servicio.activo ? 'border-slate-200 hover:border-emerald-300' : 'border-slate-200 bg-slate-50 opacity-80'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-800 text-base leading-snug">
                    {servicio.nombre}
                  </h3>
                  {servicio.activo ? (
                    <span
                      data-testid="badge-service-active"
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                    >
                      Activo
                    </span>
                  ) : (
                    <span
                      data-testid="badge-service-inactive"
                      className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-600 border border-slate-300"
                    >
                      Inactivo
                    </span>
                  )}
                </div>

                {servicio.descripcion && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {servicio.descripcion}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {servicio.duracionMinutos} min
                  </span>
                  <span className="flex items-center gap-0.5 font-bold text-emerald-700 text-sm">
                    ${servicio.precio.toFixed(2)}
                  </span>
                </div>

                {/* Acciones: Editar, Eliminar e Interruptor de activación */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    data-testid="btn-edit-service"
                    onClick={() => handleOpenEditModal(servicio)}
                    className="px-2 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    title="Editar servicio"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    data-testid="btn-delete-service"
                    onClick={() => setDeletingService(servicio)}
                    className="px-2 py-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    title="Eliminar servicio"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Eliminar</span>
                  </button>

                  <label
                    htmlFor={`toggle-${servicio.id}`}
                    className="relative inline-flex items-center cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      id={`toggle-${servicio.id}`}
                      data-testid={`toggle-service-active-${servicio.id}`}
                      checked={servicio.activo}
                      onChange={() => handleToggleActive(servicio.id, servicio.activo)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Nuevo / Editar Servicio */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Nombre del Servicio *
                </label>
                <input
                  type="text"
                  data-testid="input-service-name"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Consulta General"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    data-testid="input-service-duration"
                    value={duracion}
                    onChange={e => setDuracion(e.target.value)}
                    placeholder="45"
                    min="5"
                    max="480"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Precio ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    data-testid="input-service-price"
                    value={precio}
                    onChange={e => setPrecio(e.target.value)}
                    placeholder="35.00"
                    min="0"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Detalles sobre lo que incluye la sesión..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  data-testid="btn-save-service"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Eliminación */}
      {deletingService && (
        <div
          data-testid="modal-delete-confirmation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                Eliminar Servicio
              </h2>
              <button
                onClick={() => setDeletingService(null)}
                data-testid="btn-close-delete-modal"
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600">
              ¿Estás seguro de que deseas eliminar permanentemente el servicio{' '}
              <span className="font-bold text-slate-800">"{deletingService.nombre}"</span>?
            </p>
            <p className="text-xs text-slate-400">
              Esta acción no se puede deshacer. Los servicios con citas asociadas no podrán eliminarse para preservar el historial.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                data-testid="btn-cancel-delete"
                onClick={() => setDeletingService(null)}
                disabled={deleteLoading}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="btn-confirm-delete"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-sm font-semibold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleteLoading ? 'Eliminando...' : 'Eliminar Servicio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
