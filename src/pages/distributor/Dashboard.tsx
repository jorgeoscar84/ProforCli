import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { FileText, PlusCircle, Trash2, Eye } from 'lucide-react';
import { motion } from 'motion/react';

export default function DistributorDashboard() {
  const { proformas, deleteProforma } = useAppContext();

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mis Proformas</h1>
          <p className="text-slate-500 mt-1">Gestiona y envía cotizaciones a tus clientes finales.</p>
        </div>
        <Link
          to="/distributor/proforma/new"
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Nueva Proforma
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500" />
            Proformas Recientes
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {proformas.length} Total
          </span>
        </div>
        
        {proformas.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-sm font-medium text-slate-900">No hay proformas</h3>
            <p className="mt-1 text-sm text-slate-500">Comienza creando una nueva proforma para tus clientes.</p>
            <div className="mt-6">
              <Link
                to="/distributor/proforma/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Crear Proforma
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {proformas.map((proforma) => (
              <li key={proforma.id} className="hover:bg-slate-50 transition-colors">
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center min-w-0">
                    <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                      <div>
                        <p className="text-sm font-medium text-indigo-600 truncate">{proforma.client.name}</p>
                        <p className="mt-2 flex items-center text-sm text-slate-500">
                          <span className="truncate">RUC/CI: {proforma.client.ruc}</span>
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <div>
                          <p className="text-sm text-slate-900">
                            Fecha: {new Date(proforma.date).toLocaleDateString()}
                          </p>
                          <p className="mt-2 flex items-center text-sm text-slate-500">
                            Total: ${proforma.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/distributor/proforma/${proforma.id}`}
                      className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-full hover:bg-indigo-50"
                      title="Ver Proforma"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => deleteProforma(proforma.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}
