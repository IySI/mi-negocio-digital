import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Calendar, Clock, Users, Briefcase, LayoutDashboard, Store } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Mi Negocio Digital',
  description: 'Gestión ágil y autónoma de citas, clientes y horarios',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 flex">
        {/* Barra lateral de navegación */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex">
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
              <div className="bg-emerald-600 p-2 rounded-lg text-white">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-slate-800 text-lg leading-tight">Mi Negocio</h1>
                <span className="text-xs text-slate-500 font-medium">Digital • Local</span>
              </div>
            </div>

            <nav className="p-4 space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/citas"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Agenda de Citas</span>
              </Link>
              <Link
                href="/clientes"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Clientes</span>
              </Link>
              <Link
                href="/servicios"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                <span>Servicios</span>
              </Link>
              <Link
                href="/horarios"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Horarios y Negocio</span>
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t border-slate-100 text-xs text-slate-400 text-center">
            Mi Negocio Digital • v0.1.0 MVP
          </div>
        </aside>

        {/* Contenido principal */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
