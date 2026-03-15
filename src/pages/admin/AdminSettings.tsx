import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Save, CheckCircle2, Image, Palette, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import ImageUpload from '../../components/ImageUpload';

export default function AdminSettings() {
  const { adminSettings, setAdminSettings } = useAppContext();
  const [localSettings, setLocalSettings] = useState(adminSettings);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRestore = () => {
    if (window.confirm('¿Estás seguro de que deseas restaurar la configuración a los últimos valores guardados?')) {
      setLocalSettings(adminSettings);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración del Sistema e IA</h1>
          <p className="text-slate-500">Ajusta el contexto para la Inteligencia Artificial y variables globales.</p>
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
        <div className="p-6 space-y-8">
          
          {/* Branding Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-medium text-slate-900 border-b pb-2">Branding por Defecto</h2>
            <p className="text-sm text-slate-500">
              Configura el logotipo y color principal por defecto. Los distribuidores podrán sobrescribir esto en su propio perfil.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <ImageUpload
                  label="Logotipo por Defecto"
                  value={localSettings.defaultLogoUrl || ''}
                  onChange={(url) => setLocalSettings({ ...localSettings, defaultLogoUrl: url })}
                  path="logos/admin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-slate-400" />
                  Color Principal por Defecto
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={localSettings.primaryColor || '#4f46e5'}
                    onChange={(e) => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
                    className="h-10 w-14 p-1 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={localSettings.primaryColor || '#4f46e5'}
                    onChange={(e) => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
                    className="flex-1 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border uppercase"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium text-slate-900 border-b pb-2">Configuración General</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Contexto para la Inteligencia Artificial (Copywriting)
              </label>
              <p className="text-xs text-slate-500 mb-3">
                Pega aquí información sobre tu empresa, enlaces, documentos de texto o instrucciones de cómo quieres que la IA escriba las introducciones de las proformas para los distribuidores.
              </p>
              <textarea
                rows={8}
                value={localSettings.aiContext}
                onChange={(e) => setLocalSettings({ ...localSettings, aiContext: e.target.value })}
                className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 border"
                placeholder="Ej. Somos una empresa líder en software contable..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Porcentaje de IVA (%)
              </label>
              <input
                type="number"
                value={localSettings.ivaPercentage}
                onChange={(e) => setLocalSettings({ ...localSettings, ivaPercentage: parseFloat(e.target.value) || 0 })}
                className="w-32 border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border"
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className={`text-sm text-emerald-600 font-medium flex items-center transition-opacity duration-300 ${saved ? 'opacity-100' : 'opacity-0'}`}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Guardado correctamente
          </span>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Save className="h-4 w-4 mr-2" /> Guardar Configuración
          </button>
        </div>
      </form>
    </motion.div>
  );
}
