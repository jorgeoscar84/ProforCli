import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  path: string; // Kept for compatibility, not used for Base64
}

export default function ImageUpload({ value, onChange, label = 'Logotipo', path }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAppContext();

  // Resize image to fit within maxWidth x maxHeight while maintaining aspect ratio
  // Returns a Base64 string directly
  const resizeImageToBase64 = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No 2d context'));
        
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to Base64 (WebP is very efficient, fallback to JPEG)
        const base64String = canvas.toDataURL('image/webp', 0.8);
        resolve(base64String);
      };
      img.onerror = reject;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Por favor, selecciona una imagen en formato JPG, PNG o WEBP.');
      return;
    }

    try {
      setIsUploading(true);

      // Resize the image and get Base64 string
      const base64Image = await resizeImageToBase64(file, 600, 600);
      
      // Pass the Base64 string directly to the parent component
      onChange(base64Image);
      
      setIsUploading(false);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error al procesar la imagen.');
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      
      {value ? (
        <div className="relative inline-block border border-slate-200 rounded-lg p-2 bg-slate-50">
          <img 
            src={value} 
            alt="Logo" 
            className="h-24 w-auto object-contain" 
            referrerPolicy="no-referrer"
          />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-100 text-red-600 rounded-full p-1 hover:bg-red-200 transition-colors"
            title="Eliminar imagen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div 
          className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:border-indigo-400 transition-colors cursor-pointer bg-slate-50"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-1 text-center">
            {isUploading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="mx-auto h-8 w-8 text-indigo-500 animate-spin" />
                <p className="mt-2 text-sm text-slate-500">Procesando...</p>
              </div>
            ) : (
              <>
                <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                <div className="flex text-sm text-slate-600 justify-center">
                  <span className="relative cursor-pointer bg-transparent rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                    Subir un archivo
                  </span>
                  <p className="pl-1">o arrastrar y soltar</p>
                </div>
                <p className="text-xs text-slate-500">PNG, JPG, WEBP hasta 5MB</p>
              </>
            )}
          </div>
        </div>
      )}
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
      />
    </div>
  );
}
