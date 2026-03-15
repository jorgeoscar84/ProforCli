import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Save, Image as ImageIcon, Building2, User, Phone, Mail, FileDigit, Palette, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import ImageUpload from '../../components/ImageUpload';

export default function DistributorProfile() {
  const { user, distributorProfile, setDistributorProfile, adminSettings } = useAppContext();
  const [localProfile, setLocalProfile] = useState(distributorProfile);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setDistributorProfile(localProfile);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRestore = () => {
    if (window.confirm('¿Estás seguro de que deseas restaurar tu perfil a los últimos valores guardados?')) {
      setLocalProfile(distributorProfile);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mi Perfil de Distribuidor</h1>
          <p className="text-slate-500 mt-1">Configura los datos y logotipo que aparecerán en tus proformas.</p>
        </div>
        <button 
          type="button"
          onClick={handleRestore}
          className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Restaurar
        </button>
      </div>

      <form onSubmit={handleSave} className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <ImageUpload
                label="Logotipo de tu Empresa"
                value={localProfile.logoUrl || ''}
                onChange={(url) => setLocalProfile({ ...localProfile, logoUrl: url })}
                path={`logos/${user?.uid || 'distributor'}`}
              />
              <p className="text-xs text-slate-500 mt-2">
                Si lo dejas en blanco, se usará el logotipo por defecto del sistema.
              </p>
              {!localProfile.logoUrl && adminSettings.defaultLogoUrl && (
                <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50 inline-block">
                  <p className="text-xs text-slate-500 mb-2">Se usará este logo por defecto:</p>
                  <img src={adminSettings.defaultLogoUrl} alt="Preview Default" className="h-16 object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Palette className="h-4 w-4 text-slate-400" />
                Color Principal de la Marca
              </label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="color"
                  value={localProfile.primaryColor || adminSettings.primaryColor || '#4f46e5'}
                  onChange={(e) => setLocalProfile({ ...localProfile, primaryColor: e.target.value })}
                  className="h-10 w-14 p-1 rounded border border-slate-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={localProfile.primaryColor || adminSettings.primaryColor || '#4f46e5'}
                  onChange={(e) => setLocalProfile({ ...localProfile, primaryColor: e.target.value })}
                  className="flex-1 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border uppercase"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  placeholder={adminSettings.primaryColor || '#4f46e5'}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Este color se usará en los encabezados y botones de tus proformas.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Building2 className="h-4 w-4 text-slate-400" />
                Nombre de la Empresa o Negocio
              </label>
              <input
                type="text"
                required
                value={localProfile.companyName}
                onChange={(e) => setLocalProfile({ ...localProfile, companyName: e.target.value })}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <FileDigit className="h-4 w-4 text-slate-400" />
                RUC
              </label>
              <input
                type="text"
                required
                value={localProfile.ruc}
                onChange={(e) => setLocalProfile({ ...localProfile, ruc: e.target.value })}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <User className="h-4 w-4 text-slate-400" />
                Nombre del Propietario / Asesor
              </label>
              <input
                type="text"
                required
                value={localProfile.ownerName}
                onChange={(e) => setLocalProfile({ ...localProfile, ownerName: e.target.value })}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Phone className="h-4 w-4 text-slate-400" />
                Teléfono de Contacto
              </label>
              <input
                type="tel"
                required
                value={localProfile.phone}
                onChange={(e) => setLocalProfile({ ...localProfile, phone: e.target.value })}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Mail className="h-4 w-4 text-slate-400" />
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={localProfile.email}
                onChange={(e) => setLocalProfile({ ...localProfile, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className={`text-sm text-emerald-600 font-medium transition-opacity duration-300 ${saved ? 'opacity-100' : 'opacity-0'}`}>
            ¡Perfil guardado!
          </span>
          <button
            type="submit"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Guardar Cambios
          </button>
        </div>
      </form>
    </motion.div>
  );
}
