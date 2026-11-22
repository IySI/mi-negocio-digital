'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { getClients, createClient } from '@/actions/client-actions';
import { Users, UserPlus, Search, Phone, FileText, CheckCircle, X, AlertCircle } from 'lucide-react';

interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  email: string | null;
  notas: string | null;
  createdAt: string | Date;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [notas, setNotas] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const fetchClientes = async () => {
    try {
      const res = await getClients();
      if (res.success && res.clients) {
        setClientes(res.clients);
      }
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleOpenModal = () => {
    setNombre('');
    setTelefono('');
    setEmail('');
    setNotas('');
    setErrorMsg(null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setErrorMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) {
      setErrorMsg("El nombre del cliente es obligatorio.");
      return;
    }
    if (!telefono.trim()) {
      setErrorMsg("El teléfono de contacto es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const res = await createClient({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim() || null,
        notas: notas.trim() || null,
      });

      if (res.success && res.client) {
        setToastMsg(`Cliente "${res.client.nombre}" registrado exitosamente.`);
        setModalOpen(false);
        await fetchClientes();
        setTimeout(() => setToastMsg(null), 4000);
      } else {
        setErrorMsg(res.error || "Ocurrió un error al registrar el cliente.");
      }
    } catch (err: any) {
      setErrorMsg("Error de conexión al guardar el cliente.");
    } finally {
      setSaving(false);
    }
  };

  // Filtrado dinámico instantáneo según el término de búsqueda
  const filteredClientes = useMemo(() => {
    if (!searchQuery.trim()) return clientes;
    const q = searchQuery.toLowerCase().trim();
    return clientes.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      c.telefono.toLowerCase().includes(q) ||
      (c.notas && c.notas.toLowerCase().includes(q))
    );
  }, [clientes, searchQuery]);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            Directorio de Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Administra tus contactos, teléfonos y preferencias de atención para agilizar el agendamiento de citas.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          data-testid="btn-new-client"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Cliente
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

      {/* Barra de Búsqueda Dinámica */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
        <input
          type="text"
          data-testid="input-search-clients"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o notas..."
          className="w-full text-sm text-slate-800 bg-transparent focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded bg-slate-100"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla del Directorio */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium animate-pulse">
            Cargando directorio de clientes...
          </div>
        ) : filteredClientes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-700">
              {searchQuery ? 'No se encontraron clientes' : 'No hay clientes registrados'}
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `No existen coincidencias para "${searchQuery}". Intenta con otro término.`
                : 'Comienza registrando tu primer cliente para crear citas rápidamente.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Cliente</th>
                  <th className="py-3.5 px-6">Teléfono</th>
                  <th className="py-3.5 px-6">Notas / Preferencias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredClientes.map(cliente => (
                  <tr
                    key={cliente.id}
                    data-testid="client-row"
                    className="hover:bg-slate-50/75 transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {cliente.nombre}
                      {cliente.email && (
                        <span className="block text-xs font-normal text-slate-400 mt-0.5">
                          {cliente.email}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {cliente.telefono}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {cliente.notas ? (
                        <span className="inline-flex items-center gap-1.5 text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          {cliente.notas}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Sin notas</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Nuevo Cliente */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Nuevo Cliente
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
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  data-testid="input-client-name"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Carlos Méndez"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  data-testid="input-client-phone"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="Ej. 555-123456"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Correo Electrónico (Opcional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Notas / Preferencias (Opcional)
                </label>
                <textarea
                  data-testid="input-client-notes"
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Ej. Prefiere turnos de mañana..."
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
                  data-testid="btn-save-client"
                  disabled={saving}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Guardando...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
