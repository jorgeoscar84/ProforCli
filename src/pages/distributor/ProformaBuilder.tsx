import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Proforma, ProformaItem, ClientInfo } from '../../types';
import { Check, Plus, Trash2, FileText, User, Mail, Phone, FileDigit, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

export default function ProformaBuilder() {
  const { products, addProforma, distributorProfile, adminSettings, draftProforma, setDraftProforma, clearDraftProforma } = useAppContext();
  const navigate = useNavigate();

  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const primaryColor = distributorProfile.primaryColor || adminSettings.primaryColor || '#4f46e5';

  // Destructure for easier access, but update via setDraftProforma
  const { client, items, notes, aiCopy } = draftProforma;

  const updateDraft = (updates: Partial<typeof draftProforma>) => {
    setDraftProforma(prev => ({ ...prev, ...updates }));
  };

  const setClient = (clientUpdates: Partial<ClientInfo>) => {
    updateDraft({ client: { ...client, ...clientUpdates } });
  };

  const handleAddItem = (productId: string) => {
    if (productId === 'custom') {
      updateDraft({
        items: [...items, {
          id: Date.now().toString(),
          productId: 'custom',
          name: 'Servicio Personalizado',
          description: '',
          quantity: 1,
          duration: 1,
          durationUnit: 'Unidades',
          unitPrice: 0,
        }]
      });
    } else {
      const product = products.find(p => p.id === productId);
      if (product) {
        updateDraft({
          items: [...items, {
            id: Date.now().toString(),
            productId: product.id,
            name: product.name,
            description: product.description,
            quantity: 1,
            duration: 12,
            durationUnit: 'Meses',
            unitPrice: product.basePrice,
          }]
        });
      }
    }
  };

  const handleRemoveItem = (id: string) => {
    updateDraft({ items: items.filter((item) => item.id !== id) });
  };

  const handleItemChange = (id: string, field: keyof ProformaItem, value: any) => {
    updateDraft({
      items: items.map(item => item.id === id ? { ...item, [field]: value } : item)
    });
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.duration * item.unitPrice), 0);
  };

  const subtotal = calculateSubtotal();
  const iva = subtotal * (adminSettings.ivaPercentage / 100);
  const total = subtotal + iva;

  const generateAiCopy = async () => {
    if (items.length === 0) return alert('Agrega al menos un producto para generar el texto.');
    setIsGeneratingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const itemsText = items.map(i => `- ${i.name}: ${i.description} (${i.quantity} x ${i.duration} ${i.durationUnit})`).join('\n');
      const prompt = `
        Contexto de la empresa: ${adminSettings.aiContext}
        
        Actúa como un experto en ventas y copywriting. Escribe una breve introducción persuasiva (máximo 2 párrafos) para una proforma dirigida al cliente "${client.name || 'Cliente'}".
        Los productos/servicios cotizados son:
        ${itemsText}
        
        El objetivo es convencer al cliente del valor de la solución, destacando beneficios. No incluyas precios en el texto, solo el valor y beneficios.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      if (response.text) {
        updateDraft({ aiCopy: response.text });
      }
    } catch (error) {
      console.error('Error generating AI copy:', error);
      alert('Hubo un error al generar el texto con IA. Verifica tu API Key.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleRestore = () => {
    if (window.confirm('¿Estás seguro de que deseas restaurar la proforma? Se perderán todos los datos no guardados.')) {
      clearDraftProforma();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client.name || !client.ruc) return alert('El nombre y RUC del cliente son requeridos');
    if (items.length === 0) return alert('Debes agregar al menos un producto o servicio');

    const newProforma: Proforma = {
      id: `PROF-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
      ownerId: '', // Will be set in AppContext
      date: new Date().toISOString(),
      distributor: distributorProfile,
      client,
      items,
      subtotal,
      iva,
      total,
      aiCopy,
      notes,
    };

    addProforma(newProforma);
    clearDraftProforma();
    navigate(`/distributor/proforma/${newProforma.id}`);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Crear Nueva Proforma</h1>
          <p className="text-slate-500 mt-1">Genera una cotización personalizada para tu cliente.</p>
        </div>
        <button 
          onClick={handleRestore}
          className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Restaurar
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Info */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-slate-500" /> Datos del Cliente
            </h3>
          </div>
          <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Comercial / Razón Social *</label>
              <input type="text" required value={client.name} onChange={(e) => setClient({ name: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="Empresa S.A." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">RUC / Cédula *</label>
              <input type="text" required value={client.ruc} onChange={(e) => setClient({ ruc: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="1700000000001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" value={client.email} onChange={(e) => setClient({ email: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="contacto@empresa.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input type="tel" value={client.phone} onChange={(e) => setClient({ phone: e.target.value })} className="block w-full rounded-md border-slate-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" placeholder="0999999999" />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center flex-wrap gap-4">
            <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-500" /> Productos y Servicios
            </h3>
            <div className="flex gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddItem(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md border"
              >
                <option value="">+ Agregar Producto Base...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button
                type="button"
                onClick={() => handleAddItem('custom')}
                className="whitespace-nowrap inline-flex items-center px-3 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
              >
                <Plus className="h-4 w-4 mr-1" /> Servicio Propio
              </button>
            </div>
          </div>
          
          <div className="p-6 space-y-6">
            {items.length === 0 ? (
              <p className="text-center text-slate-500 py-4">No hay productos agregados. Selecciona uno arriba.</p>
            ) : (
              items.map((item, index) => (
                <div key={item.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 relative">
                  <button type="button" onClick={() => handleRemoveItem(item.id)} className="absolute top-4 right-4 text-slate-400 hover:text-red-600">
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pr-8">
                    <div className="md:col-span-4">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Nombre del Producto/Servicio</label>
                      <input type="text" value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} className="w-full border-slate-300 rounded-md sm:text-sm p-2 border" />
                    </div>
                    <div className="md:col-span-8">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Descripción / Detalles</label>
                      <input type="text" value={item.description} onChange={(e) => handleItemChange(item.id, 'description', e.target.value)} className="w-full border-slate-300 rounded-md sm:text-sm p-2 border" />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Cantidad</label>
                      <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 1)} className="w-full border-slate-300 rounded-md sm:text-sm p-2 border" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Duración</label>
                      <input type="number" min="1" value={item.duration} onChange={(e) => handleItemChange(item.id, 'duration', parseFloat(e.target.value) || 1)} className="w-full border-slate-300 rounded-md sm:text-sm p-2 border" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Unidad de Tiempo</label>
                      <select value={item.durationUnit} onChange={(e) => handleItemChange(item.id, 'durationUnit', e.target.value)} className="w-full border-slate-300 rounded-md sm:text-sm p-2 border">
                        <option value="Meses">Meses</option>
                        <option value="Años">Años</option>
                        <option value="Unidades">Unidades (Pago Único)</option>
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Precio Unit. ($)</label>
                      <input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full border-slate-300 rounded-md sm:text-sm p-2 border" />
                    </div>
                    <div className="md:col-span-2 flex flex-col justify-end">
                      <span className="block text-xs font-medium text-slate-500 mb-1">Total Fila</span>
                      <span className="text-sm font-bold text-slate-900 py-2">
                        ${(item.quantity * item.duration * item.unitPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {items.length > 0 && (
              <div className="flex justify-end pt-6 border-t border-slate-200">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Base Imponible (Subtotal):</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>IVA ({adminSettings.ivaPercentage}%):</span>
                    <span>${iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-2">
                    <span>Total General:</span>
                    <span style={{ color: primaryColor }}>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Copywriting */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5" style={{ color: primaryColor }} /> Texto Persuasivo (IA)
            </h3>
            <button
              type="button"
              onClick={generateAiCopy}
              disabled={isGeneratingAi || items.length === 0}
              style={{ backgroundColor: primaryColor }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white hover:opacity-90 disabled:opacity-50"
            >
              {isGeneratingAi ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              Generar con IA
            </button>
          </div>
          <div className="p-6">
            <textarea
              rows={4}
              value={aiCopy}
              onChange={(e) => updateDraft({ aiCopy: e.target.value })}
              className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 border"
              placeholder="Haz clic en 'Generar con IA' para crear un texto introductorio persuasivo basado en los productos seleccionados, o escribe el tuyo propio."
            />
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 bg-slate-50">
            <h3 className="text-lg leading-6 font-medium text-slate-900">Notas Adicionales</h3>
          </div>
          <div className="p-6">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => updateDraft({ notes: e.target.value })}
              className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-3 border"
              placeholder="Términos, condiciones, formas de pago..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button type="button" onClick={() => navigate('/distributor')} className="px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
            Cancelar
          </button>
          <button type="submit" style={{ backgroundColor: primaryColor }} className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white hover:opacity-90">
            <Check className="h-4 w-4 mr-2" />
            Generar Proforma
          </button>
        </div>
      </form>
    </motion.div>
  );
}
