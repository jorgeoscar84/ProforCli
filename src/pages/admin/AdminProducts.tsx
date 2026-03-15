import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Product } from '../../types';
import { Plus, Trash2, Edit2, Save, X, Upload, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { GoogleGenAI, Type } from '@google/genai';

export default function AdminProducts() {
  const { products, addProduct, addProducts, updateProduct, deleteProduct } = useAppContext();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [isExtractingAI, setIsExtractingAI] = useState(false);

  const excelInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm(product);
  };

  const handleSave = () => {
    if (editingId === 'new') {
      addProduct({
        id: Date.now().toString(),
        name: editForm.name || 'Nuevo Producto',
        description: editForm.description || '',
        basePrice: editForm.basePrice || 0,
      });
    } else if (editingId) {
      updateProduct(editForm as Product);
    }
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleAddNew = () => {
    setEditingId('new');
    setEditForm({ name: '', description: '', basePrice: 0 });
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        let count = 0;
        const newProducts: Product[] = [];
        json.forEach((row: any) => {
          // Intentar detectar las columnas sin importar mayúsculas/minúsculas
          const name = row['Nombre'] || row['Name'] || row['nombre'] || row['Producto'] || row['name'];
          const description = row['Descripción'] || row['Description'] || row['descripcion'] || row['Detalle'] || '';
          const price = row['Precio'] || row['Price'] || row['precio'] || row['Base Price'] || row['Precio Base'] || 0;

          if (name) {
            newProducts.push({
              id: Date.now().toString() + Math.random().toString(),
              name: String(name),
              description: String(description),
              basePrice: parseFloat(price) || 0,
            });
            count++;
          }
        });
        
        if (newProducts.length > 0) {
          addProducts(newProducts);
        }
        
        alert(`Se importaron ${count} productos desde el Excel.`);
        setShowImportModal(false);
      } catch (error) {
        console.error(error);
        alert("Error al leer el archivo Excel. Asegúrate de que tenga las columnas Nombre, Descripción y Precio.");
      }
      if (excelInputRef.current) excelInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAIExtract = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length > 10) {
      alert("Solo puedes subir hasta 10 documentos a la vez.");
      if (docInputRef.current) docInputRef.current.value = '';
      return;
    }

    const MAX_FILE_SIZE = 45 * 1024 * 1024; // 45MB
    const validFiles = files.filter(f => f.size <= MAX_FILE_SIZE);
    const oversizedFiles = files.filter(f => f.size > MAX_FILE_SIZE);

    if (oversizedFiles.length > 0) {
      alert(`Los siguientes archivos superan el límite de 45MB y serán ignorados:\n${oversizedFiles.map(f => f.name).join(', ')}`);
    }

    if (validFiles.length === 0) {
      if (docInputRef.current) docInputRef.current.value = '';
      return;
    }

    setIsExtractingAI(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      let allExtractedProducts: any[] = [];
      const currentNames = new Set(products.map(p => p.name.toLowerCase().trim()));

      for (const file of validFiles) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
        });

        const prompt = `Extrae todos los productos, planes o servicios mencionados en este documento junto con sus descripciones y precios. 
        Reglas:
        1. Devuelve un arreglo JSON estricto.
        2. Si hay productos duplicados, unifícalos.`;

        try {
          const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: base64Data,
                    mimeType: file.type || 'application/pdf',
                  }
                },
                {
                  text: prompt
                }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Nombre del producto o plan" },
                    description: { type: Type.STRING, description: "Descripción detallada del producto o plan" },
                    basePrice: { type: Type.NUMBER, description: "Precio base numérico" }
                  },
                  required: ["name", "description", "basePrice"]
                }
              }
            }
          });

          const jsonStr = response.text?.trim();
          if (jsonStr) {
            const extracted = JSON.parse(jsonStr);
            allExtractedProducts = [...allExtractedProducts, ...extracted];
          }
        } catch (fileErr) {
          console.error(`Error procesando ${file.name}:`, fileErr);
        }
      }

      let addedCount = 0;
      const productsToAdd: Product[] = [];
      
      allExtractedProducts.forEach((p: any) => {
         const normalizedName = p.name.toLowerCase().trim();
         if (!currentNames.has(normalizedName)) {
           productsToAdd.push({
             id: Date.now().toString() + Math.random().toString(),
             name: p.name,
             description: p.description,
             basePrice: p.basePrice
           });
           currentNames.add(normalizedName);
           addedCount++;
         }
      });
      
      if (productsToAdd.length > 0) {
        addProducts(productsToAdd);
      }
      
      alert(`La IA procesó los documentos e importó ${addedCount} productos nuevos exitosamente. (Se omitieron duplicados)`);
      setShowImportModal(false);
    } catch (err: any) {
      console.error(err);
      alert(`Error general al procesar los documentos. \nDetalle: ${err.message}`);
    } finally {
      setIsExtractingAI(false);
      if (docInputRef.current) docInputRef.current.value = '';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catálogo de Productos</h1>
          <p className="text-slate-500">Gestiona los planes y productos disponibles para tus distribuidores.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50"
          >
            <Upload className="h-4 w-4 mr-2" /> Importar
          </button>
          <button
            onClick={handleAddNew}
            disabled={editingId !== null}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4 mr-2" /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Precio Base</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {editingId === 'new' && (
              <tr className="bg-indigo-50/50">
                <td className="px-6 py-4">
                  <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border-slate-300 rounded-md text-sm p-2 border" placeholder="Nombre" />
                </td>
                <td className="px-6 py-4">
                  <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full border-slate-300 rounded-md text-sm p-2 border" placeholder="Descripción" />
                </td>
                <td className="px-6 py-4">
                  <input type="number" value={editForm.basePrice} onChange={e => setEditForm({...editForm, basePrice: parseFloat(e.target.value) || 0})} className="w-full border-slate-300 rounded-md text-sm p-2 border" placeholder="0.00" />
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={handleSave} className="text-emerald-600 hover:text-emerald-900"><Save className="h-5 w-5 inline" /></button>
                  <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5 inline" /></button>
                </td>
              </tr>
            )}
            {products.map((product) => (
              <tr key={product.id}>
                {editingId === product.id ? (
                  <>
                    <td className="px-6 py-4">
                      <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full border-slate-300 rounded-md text-sm p-2 border" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full border-slate-300 rounded-md text-sm p-2 border" />
                    </td>
                    <td className="px-6 py-4">
                      <input type="number" value={editForm.basePrice} onChange={e => setEditForm({...editForm, basePrice: parseFloat(e.target.value) || 0})} className="w-full border-slate-300 rounded-md text-sm p-2 border" />
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={handleSave} className="text-emerald-600 hover:text-emerald-900"><Save className="h-5 w-5 inline" /></button>
                      <button onClick={handleCancel} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5 inline" /></button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">{product.description}</td>
                    <td className="px-6 py-4 text-sm text-slate-500">${product.basePrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-3">
                      <button onClick={() => handleEdit(product)} className="text-indigo-600 hover:text-indigo-900"><Edit2 className="h-4 w-4 inline" /></button>
                      <button onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-4 w-4 inline" /></button>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {products.length === 0 && editingId !== 'new' && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                  No hay productos registrados. Crea uno nuevo o importa desde un archivo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Import Modal */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-900">Importar Productos</h3>
                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                {/* Excel Import */}
                <div className="border border-slate-200 rounded-lg p-4 hover:border-indigo-500 transition-colors cursor-pointer relative overflow-hidden">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleExcelImport}
                    ref={excelInputRef}
                  />
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">Importar desde Excel</h4>
                      <p className="text-xs text-slate-500 mt-1">Sube un archivo .xlsx o .csv con las columnas: Nombre, Descripción, Precio</p>
                    </div>
                  </div>
                </div>

                {/* AI Document Import */}
                <div className={`border border-slate-200 rounded-lg p-4 transition-colors relative overflow-hidden ${isExtractingAI ? 'bg-indigo-50 border-indigo-200' : 'hover:border-indigo-500 cursor-pointer'}`}>
                  {!isExtractingAI && (
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.txt,.html,application/pdf,text/plain,text/html"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={handleAIExtract}
                      ref={docInputRef}
                    />
                  )}
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      {isExtractingAI ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-slate-900">
                        {isExtractingAI ? 'Extrayendo con IA...' : 'Extraer desde Documento (IA)'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {isExtractingAI 
                          ? 'Analizando documentos y detectando productos y precios. Esto puede tomar unos segundos.' 
                          : 'Sube hasta 10 PDFs, HTML o TXT. La IA detectará productos y omitirá duplicados.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
