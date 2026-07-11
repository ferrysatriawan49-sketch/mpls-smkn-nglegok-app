import React, { useState, useRef } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PhotoUploadProps {
  studentNis: string;
  studentName: string;
  onPhotoUploaded: (fileId: string, fileUrl: string) => void;
  onPhotoError: (error: string) => void;
}

export default function PhotoUpload({ studentNis, studentName, onPhotoUploaded, onPhotoError }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔥 Format nama file: NIS-Nama-Pertanyaan
  const generateFileName = (nis: string, name: string) => {
    const cleanName = name.replace(/\s+/g, '_').toUpperCase();
    const timestamp = new Date().getTime();
    return `${nis}-${cleanName}-FOTO_${timestamp}`;
  };

  // 🔥 Konversi File ke Base64 untuk preview
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // 🔥 Upload ke Google Drive via Apps Script
  const uploadToDrive = async (file: File, fileName: string) => {
    // Karena Google Drive API membutuhkan OAuth, kita akan simpan di Google Sheets sebagai link
    // Sebagai alternatif, kita akan konversi ke base64 dan kirim ke Apps Script
    // yang kemudian akan menyimpan ke Google Drive
    
    const base64Data = await fileToBase64(file);
    const payload = {
      action: 'uploadPhoto',
      fileName: fileName,
      fileType: file.type,
      fileData: base64Data,
      studentNis: studentNis,
      studentName: studentName
    };

    const url = localStorage.getItem('mpls_google_sheets_url') || '';
    if (!url) {
      throw new Error('URL Google Sheets belum diset');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();
    return result;
  };

  // 🔥 Handle File Selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi file
    if (!file.type.startsWith('image/')) {
      onPhotoError('File harus berupa gambar!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onPhotoError('Ukuran file maksimal 5MB!');
      return;
    }

    setPhotoFile(file);
    setUploadStatus('idle');

    // Preview
    try {
      const preview = await fileToBase64(file);
      setPhotoPreview(preview);
    } catch (err) {
      console.error('Gagal membuat preview:', err);
    }
  };

  // 🔥 Handle Upload
  const handleUpload = async () => {
    if (!photoFile) {
      onPhotoError('Pilih gambar terlebih dahulu!');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);

    try {
      // Simulasi progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const fileName = generateFileName(studentNis, studentName);
      const result = await uploadToDrive(photoFile, fileName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.status === 'success') {
        setUploadStatus('success');
        onPhotoUploaded(result.fileId, result.fileUrl);
        alert('✅ Foto berhasil diupload ke Google Drive!');
      } else {
        throw new Error(result.message || 'Upload gagal');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadStatus('error');
      onPhotoError(err.message || 'Gagal upload foto');
    } finally {
      setIsUploading(false);
    }
  };

  // 🔥 Remove Photo
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div 
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 ${
          photoPreview 
            ? 'border-emerald-300 bg-emerald-50/50' 
            : 'border-[#D6D6C2] hover:border-[#8A8A70] hover:bg-[#F5F5F0]'
        }`}
        onClick={() => !photoPreview && fileInputRef.current?.click()}
      >
        {photoPreview ? (
          <div className="relative">
            <img 
              src={photoPreview} 
              alt="Preview Foto" 
              className="max-h-48 mx-auto rounded-lg object-contain"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemovePhoto();
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Camera className="w-10 h-10 text-[#8A8A70] mx-auto" />
            <p className="text-sm font-medium text-[#33332D]">Klik untuk upload foto</p>
            <p className="text-xs text-[#8A8A70]">Format: JPG, PNG, GIF (Maks. 5MB)</p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Upload Button & Status */}
      {photoFile && uploadStatus !== 'success' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-[#5A5A40] hover:bg-[#4A4A35] disabled:bg-[#8A8A70] text-white py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading... {uploadProgress}%
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload ke Google Drive
              </>
            )}
          </button>
          
          {isUploading && (
            <div className="w-full bg-[#E5E5D8] rounded-full h-2 overflow-hidden">
              <div 
                className="bg-[#5A5A40] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {/* Status */}
      {uploadStatus === 'success' && (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded-lg text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Foto berhasil diupload ke Google Drive</span>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Gagal upload foto. Silakan coba lagi.</span>
        </div>
      )}

      {/* Info Nama File */}
      {photoFile && uploadStatus !== 'success' && (
        <div className="text-xs text-[#8A8A70] bg-[#F5F5F0] p-2 rounded-lg">
          <span className="font-semibold">File:</span> {photoFile.name}
          <br />
          <span className="font-semibold">Akan disimpan sebagai:</span> {generateFileName(studentNis, studentName)}.{photoFile.name.split('.').pop()}
        </div>
      )}
    </div>
  );
}