import React, { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { Printer, ArrowLeft, Building2, MessageCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';
import html2pdf from 'html2pdf.js';

export default function ProformaView() {
  const { id } = useParams<{ id: string }>();
  const { proformas, adminSettings } = useAppContext();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const proforma = proformas.find((p) => p.id === id);

  if (!proforma) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-900">Proforma no encontrada</h2>
        <button onClick={() => navigate('/distributor')} className="mt-4 text-indigo-600 hover:underline">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const primaryColor = proforma.distributor.primaryColor || adminSettings.primaryColor || '#4f46e5';
  const logoUrl = proforma.distributor.logoUrl || adminSettings.defaultLogoUrl;

  const handlePrint = async () => {
    if (!printRef.current) return;
    
    setIsGenerating(true);
    try {
      const element = printRef.current;
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
        filename: `Proforma-${proforma.id}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Hubo un error al generar el PDF. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsApp = () => {
    const text = `Hola ${proforma.client.name}, te comparto la proforma ${proforma.id} por un total de $${proforma.total.toFixed(2)}. Quedo atento a tus comentarios.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center print:hidden mb-8">
        <button onClick={() => navigate('/distributor')} className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-4 w-4 mr-1" /> Volver
        </button>
        <div className="flex gap-4">
          <button onClick={handleWhatsApp} className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
            <MessageCircle className="h-4 w-4 mr-2" />
            Compartir WhatsApp
          </button>
          <button 
            onClick={handlePrint} 
            disabled={isGenerating}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Printer className="h-4 w-4 mr-2" />}
            {isGenerating ? 'Generando PDF...' : 'Descargar PDF'}
          </button>
        </div>
      </div>

      <div 
        ref={printRef}
        className="bg-white shadow-lg rounded-xl overflow-hidden border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0"
      >
        <div className="p-8 sm:p-12">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-8">
            <div className="flex flex-col max-w-sm">
              {logoUrl ? (
                <img src={logoUrl} alt={proforma.distributor.companyName} className="h-16 object-contain mb-4" referrerPolicy="no-referrer" crossOrigin="anonymous" />
              ) : (
                <div className="flex items-center gap-2 mb-4 text-slate-800">
                  <Building2 className="h-10 w-10" />
                  <span className="text-2xl font-bold">{proforma.distributor.companyName}</span>
                </div>
              )}
              <h2 className="text-lg font-semibold text-slate-800">{proforma.distributor.companyName}</h2>
              <p className="text-sm text-slate-500">RUC: {proforma.distributor.ruc}</p>
              <p className="text-sm text-slate-500">Asesor: {proforma.distributor.ownerName}</p>
              <p className="text-sm text-slate-500">Tel: {proforma.distributor.phone}</p>
              <p className="text-sm text-slate-500">{proforma.distributor.email}</p>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-extrabold uppercase tracking-wider mb-2" style={{ color: primaryColor }}>Proforma</h1>
              <p className="text-sm text-slate-500"><span className="font-medium text-slate-700">Nº:</span> {proforma.id}</p>
              <p className="text-sm text-slate-500"><span className="font-medium text-slate-700">Fecha:</span> {new Date(proforma.date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Client Info */}
          <div className="mt-8 grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: primaryColor }}>Preparado para:</h3>
              <p className="text-lg font-semibold text-slate-900">{proforma.client.name}</p>
              <p className="text-sm text-slate-600 mt-1">RUC/CI: {proforma.client.ruc}</p>
              {proforma.client.email && <p className="text-sm text-slate-600 mt-1">{proforma.client.email}</p>}
              {proforma.client.phone && <p className="text-sm text-slate-600 mt-1">{proforma.client.phone}</p>}
            </div>
          </div>

          {/* AI Copy */}
          {proforma.aiCopy && (
            <div className="mt-8 p-6 rounded-xl border" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30` }}>
              <div className="prose prose-sm max-w-none">
                <Markdown>{proforma.aiCopy}</Markdown>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="mt-12">
            <table className="min-w-full divide-y divide-slate-200">
              <thead>
                <tr>
                  <th scope="col" className="py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descripción</th>
                  <th scope="col" className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Cant.</th>
                  <th scope="col" className="py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Duración</th>
                  <th scope="col" className="py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">P. Unit.</th>
                  <th scope="col" className="py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {proforma.items.map((item, index) => {
                  const itemTotal = item.quantity * item.duration * item.unitPrice;
                  return (
                    <tr key={index}>
                      <td className="py-4">
                        <p className="text-sm font-bold text-slate-900">{item.name}</p>
                        {item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}
                      </td>
                      <td className="py-4 text-sm text-slate-500 text-center">{item.quantity}</td>
                      <td className="py-4 text-sm text-slate-500 text-center">{item.duration} {item.durationUnit}</td>
                      <td className="py-4 text-sm text-slate-500 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="py-4 text-sm font-medium text-slate-900 text-right">${itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-sm space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Base Imponible:</span>
                <span>${proforma.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>IVA ({adminSettings.ivaPercentage}%):</span>
                <span>${proforma.iva.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-slate-900 border-t border-slate-200 pt-3">
                <span>Total a Pagar:</span>
                <span style={{ color: primaryColor }}>${proforma.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {proforma.notes && (
            <div className="mt-16 pt-8 border-t border-slate-200">
              <h3 className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: primaryColor }}>Notas y Condiciones:</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{proforma.notes}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
