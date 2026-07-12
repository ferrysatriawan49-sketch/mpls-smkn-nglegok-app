import React, { useState, useEffect, useRef } from 'react';
import { Student, QuestionGroup, Question } from '../types';
import { QUESTION_GROUPS, getQuestionsList } from '../questionsData';
import { calculateProgressPercent, formatGPS } from '../utils';
import { 
  User, Users, Heart, Award, GraduationCap, Briefcase, 
  ArrowLeft, ArrowRight, Save, CheckCircle2, AlertCircle, 
  MapPin, UploadCloud, Eye, RefreshCw, LogOut, CheckSquare, Square,
  Camera, Upload, X, Loader2
} from 'lucide-react';

// ============================================================
// 🔥 KOMPONEN PHOTO UPLOAD - DIPERBAIKI DENGAN NO-CORS
// ============================================================
interface PhotoUploadProps {
  studentNis: string;
  studentName: string;
  questionId: string;
  questionLabel: string;
  onPhotoUploaded: (fileId: string, fileUrl: string) => void;
  onPhotoError: (error: string) => void;
  existingPhotoUrl?: string | null;
}

function PhotoUpload({ 
  studentNis, 
  studentName, 
  questionId,
  questionLabel,
  onPhotoUploaded, 
  onPhotoError, 
  existingPhotoUrl 
}: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [photoPreview, setPhotoPreview] = useState<string | null>(existingPhotoUrl || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploadErrorMessage, setUploadErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔥 Format nama file: NIS-Nama-QuestionId.jpg
  const generateFileName = (nis: string, name: string, qId: string, fileExt: string) => {
    const cleanName = name.replace(/\s+/g, '_').toUpperCase();
    const questionPart = qId.toUpperCase();
    return `${nis}-${cleanName}-${questionPart}.${fileExt}`;
  };

  // 🔥 Kompres gambar - LEBIH AGRESIF (400px, kualitas 0.5)
  const compressImage = (file: File, maxWidth: number = 400, maxHeight: number = 400): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // 🔥 RESIZE KE 400px
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

          // 🔥 PASTIKAN MINIMAL 200px
          if (width < 200 && height < 200) {
            const ratio = 200 / Math.min(width, height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // 🔥 KUALITAS 0.5
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Gagal kompres gambar'));
            }
          }, 'image/jpeg', 0.5);
        };
        img.onerror = () => reject(new Error('Gagal memuat gambar'));
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
    });
  };

  // 🔥 Upload ke Google Drive - DENGAN NO-CORS
 
    // 🔥 Upload ke Google Drive - DENGAN CORS NORMAL
  const uploadToDrive = async (file: File, fileName: string) => {
    console.log('📤 Uploading:', fileName);

    // 🔥 KOMPRES LEBIH KECIL
    let finalBlob = await compressImage(file, 400, 400);
    console.log('📎 Compressed size:', finalBlob.size, 'bytes (', (finalBlob.size / 1024).toFixed(2), 'KB)');

    // 🔥 Jika masih terlalu besar (> 300KB), kompres ulang
    if (finalBlob.size > 300 * 1024) {
      console.log('⚠️ Ukuran masih besar, kompres ulang...');
      const img = await new Promise<HTMLImageElement>((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(finalBlob);
        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target?.result as string;
          img.onload = () => resolve(img);
        };
      });
      
      const canvas = document.createElement('canvas');
      canvas.width = 250;
      canvas.height = 250;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, 250, 250);
      
      finalBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || finalBlob), 'image/jpeg', 0.5);
      });
      console.log('📎 Final size:', finalBlob.size, 'bytes (', (finalBlob.size / 1024).toFixed(2), 'KB)');
    }

    // 🔥 Konversi ke base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(finalBlob);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Gagal konversi ke base64'));
    });

    console.log('📎 Base64 length:', base64Data.length);

    const payload = {
      action: 'uploadPhoto',
      fileName: fileName,
      fileType: 'image/jpeg',
      fileData: base64Data,
      studentNis: studentNis,
      studentName: studentName,
      questionId: questionId,
      folderId: '1XEBJqayQCIfJPkIApRjggOBIZrHss52V'
    };

    const url = localStorage.getItem('mpls_google_sheets_url') || '';
    if (!url) {
      throw new Error('URL Google Sheets belum diset');
    }

    console.log('📤 Sending to:', url);

    // 🔥 GUNAKAN TEXT/PLAIN UNTUK MENGHINDARI CORS PREFLIGHT (OPTIONS)
    const response = await fetch(url, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    console.log('📥 Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('📥 Response:', result);
    
    // 🔥 VERIFIKASI: Jika response sukses tapi tidak ada fileId, anggap gagal
    if (result.status === 'success' && result.fileId) {
      return result;
    } else {
      throw new Error(result.message || 'Upload gagal, file tidak terdeteksi di server');
    }
  };



  // 🔥 Handle File Selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onPhotoError('File harus berupa gambar!');
      return;
    }

    const fileSizeKB = file.size / 1024;
    if (fileSizeKB > 5000) {
      onPhotoError(`Ukuran file terlalu besar (${Math.round(fileSizeKB)} KB). Maksimal 5 MB!`);
      return;
    }

    setPhotoFile(file);
    setUploadStatus('idle');
    setUploadErrorMessage(null);

    try {
      const compressedPreview = await compressImage(file, 300, 300);
      const previewUrl = URL.createObjectURL(compressedPreview);
      setPhotoPreview(previewUrl);
    } catch (err) {
      console.error('Gagal membuat preview:', err);
    }
  };

  // 🔥 Handle Upload
  
  // 🔥 Handle Upload - DIPERBAIKI DENGAN VERIFIKASI
  const handleUpload = async () => {
    if (!photoFile) {
      onPhotoError('Pilih gambar terlebih dahulu!');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadErrorMessage(null);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 200);

      const fileExt = 'jpg';
      const fileName = generateFileName(studentNis, studentName, questionId, fileExt);
      console.log('📎 Generated filename:', fileName);

      const result = await uploadToDrive(photoFile, fileName);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (result.status === 'success' && result.fileId) {
        setUploadStatus('success');
        // 🔥 Gunakan fileId dan fileUrl DARI RESPONSE (bukan fake)
        onPhotoUploaded(result.fileId, result.fileUrl);
        alert(`✅ Foto berhasil diupload ke Google Drive! ${result.message || ''}`);
        console.log('✅ File ID:', result.fileId);
        console.log('✅ File URL:', result.fileUrl);
      } else {
        throw new Error(result.message || 'Upload gagal');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadStatus('error');
      setUploadErrorMessage(err.message || 'Gagal upload foto');
      onPhotoError(err.message || 'Gagal upload foto');
      setUploadProgress(0);
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
    setUploadErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
          photoPreview 
            ? 'border-emerald-300 bg-emerald-50/50' 
            : 'border-[#D6D6C2] hover:border-[#8A8A70] hover:bg-[#F5F5F0]'
        }`}
        onClick={() => !photoPreview && !isUploading && fileInputRef.current?.click()}
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
                if (!isUploading) handleRemovePhoto();
              }}
              disabled={isUploading}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Camera className="w-10 h-10 text-[#8A8A70] mx-auto" />
            <p className="text-sm font-medium text-[#33332D]">Klik untuk upload foto</p>
            <p className="text-xs text-[#8A8A70]">Format: JPG, PNG (Maks. 5 MB)</p>
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

      {photoFile && uploadStatus !== 'success' && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-[#0C2B64] hover:bg-[#081F48] disabled:bg-[#8A8A70] text-white py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-xs"
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
                className="bg-[#0C2B64] h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-2 rounded-lg text-sm">
          <CheckCircle2 className="w-4 h-4" />
          <span>Foto berhasil diupload</span>
        </div>
      )}

      {uploadStatus === 'error' && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{uploadErrorMessage || 'Gagal upload foto. Silakan coba lagi.'}</span>
        </div>
      )}

      {photoFile && uploadStatus !== 'success' && (
        <div className="text-xs text-[#8A8A70] bg-[#F5F5F0] p-2 rounded-lg">
          <span className="font-semibold">File:</span> {photoFile.name}
          <br />
          <span className="font-semibold">Ukuran:</span> {Math.round(photoFile.size / 1024)} KB
          <br />
          <span className="font-semibold">Akan disimpan sebagai:</span> {generateFileName(studentNis, studentName, questionId, 'jpg')}
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN STUDENTFORM COMPONENT
// ============================================================
interface StudentFormProps {
  student: Student;
  onSave: (answers: Record<string, any>, isSubmitted: boolean) => void;
  onClose: () => void;
}

export default function StudentForm({ student, onSave, onClose }: StudentFormProps) {
  const [answers, setAnswers] = useState<Record<string, any>>({ ...student.answers });
  const [activeTab, setActiveTab] = useState<string>('basic');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showAllErrors, setShowAllErrors] = useState(false);

  const [photoStates, setPhotoStates] = useState<Record<string, { fileId: string | null, fileUrl: string | null }>>({});
  const [photoErrors, setPhotoErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const photoQuestions = ['q6', 'q9', 'q29'];
    const initialAnswers = { ...student.answers };
    
    initialAnswers.q1 = student.name;
    initialAnswers.q2 = student.nis;

    photoQuestions.forEach(qId => {
      const fileId = student.answers[`${qId}_file_id`] || '';
      const fileUrl = student.answers[`${qId}_file_url`] || student.answers[qId] || '';
      
      if (fileId) {
        setPhotoStates(prev => ({
          ...prev,
          [qId]: {
            fileId: fileId,
            fileUrl: fileUrl || null
          }
        }));
      }
      
      if (fileUrl) {
        initialAnswers[qId] = fileUrl;
        initialAnswers[`${qId}_file_url`] = fileUrl;
      }
    });

    setAnswers(initialAnswers);
  }, [student]);

  const questions = getQuestionsList();
  const currentProgressPercent = calculateProgressPercent(answers, questions);

  const handlePhotoUploaded = (questionId: string, fileId: string, fileUrl: string) => {
    setPhotoStates(prev => ({
      ...prev,
      [questionId]: { fileId, fileUrl }
    }));
    
    const updatedAnswers = { 
      ...answers, 
      [`${questionId}_file_id`]: fileId, 
      [`${questionId}_file_url`]: fileUrl,
      [questionId]: fileUrl
    };
    setAnswers(updatedAnswers);
    
    setPhotoErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });
  };

  const handlePhotoError = (questionId: string, error: string) => {
    setPhotoErrors(prev => ({ ...prev, [questionId]: error }));
    setTimeout(() => {
      setPhotoErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[questionId];
        return newErrors;
      });
    }, 5000);
  };

  const validateField = (q: Question, value: any): string => {
    if (q.dependsOn) {
      const parentVal = answers[q.dependsOn.questionId];
      if (q.dependsOn.condition === 'equals' && parentVal !== q.dependsOn.value) return '';
      if (q.dependsOn.condition === 'not_equals' && parentVal === q.dependsOn.value) return '';
      if (q.dependsOn.condition === 'includes' && (!Array.isArray(parentVal) || !parentVal.includes(q.dependsOn.value))) return '';
    }

    if (q.required) {
      if (value === undefined || value === null || value === '') {
        return 'Pertanyaan ini wajib diisi';
      }
      if (Array.isArray(value) && value.length === 0) {
        return 'Pilih minimal satu opsi';
      }
    }

    if (q.type === 'file' && q.required) {
      const fileId = photoStates[q.id]?.fileId;
      if (!fileId && !value) {
        return 'Foto wajib diupload!';
      }
    }

    if (value) {
      if (q.minLength && String(value).length < q.minLength) {
        return `Isian minimal ${q.minLength} karakter (saat ini ${String(value).length})`;
      }
      if (q.maxLength && String(value).length > q.maxLength) {
        return `Isian maksimal ${q.maxLength} karakter (saat ini ${String(value).length})`;
      }
      if (q.validationRegex) {
        const regex = new RegExp(q.validationRegex);
        if (!regex.test(String(value))) {
          return q.validationMessage || 'Format isian tidak sesuai';
        }
      }
    }

    return '';
  };

  const validateTab = (group: QuestionGroup): boolean => {
    const errors: Record<string, string> = {};
    let isValid = true;

    group.questions.forEach(q => {
      const error = validateField(q, answers[q.id]);
      if (error) {
        errors[q.id] = error;
        isValid = false;
      }
    });

    setValidationErrors(prev => ({ ...prev, ...errors }));
    return isValid;
  };

  const handleInputChange = (questionId: string, value: any) => {
    setAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: value };
      
      const q = questions.find(item => item.id === questionId);
      if (q) {
        const error = validateField(q, value);
        setValidationErrors(err => {
          const next = { ...err };
          if (error) {
            next[questionId] = error;
          } else {
            delete next[questionId];
          }
          return next;
        });
      }

      if (questionId === 'q31' && value === 'Orang Tua Siswa (Ayah / Ibu Kandung)') {
        delete newAnswers.q32;
        delete newAnswers.q33;
        delete newAnswers.q34;
        delete newAnswers.q35;
        delete newAnswers.q36;
      }

      if (questionId === 'q38' && value === 'tidak pernah') {
        delete newAnswers.q39;
      }

      return newAnswers;
    });
  };

  const handleGPSLocation = (questionId: string) => {
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          handleInputChange(questionId, formatGPS(lat, lng));
          setGpsLoading(false);
        },
        () => {
          const randomLat = -8.0142 + (Math.random() - 0.5) * 0.01;
          const randomLng = 112.1901 + (Math.random() - 0.5) * 0.01;
          handleInputChange(questionId, formatGPS(randomLat, randomLng));
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      const randomLat = -8.0142 + (Math.random() - 0.5) * 0.01;
      const randomLng = 112.1901 + (Math.random() - 0.5) * 0.01;
      handleInputChange(questionId, formatGPS(randomLat, randomLng));
      setGpsLoading(false);
    }
  };

  const handleSimulatedUpload = (questionId: string, sizeInKB: number, fileName: string) => {
    if (sizeInKB < 100 || sizeInKB > 500) {
      alert(`Gagal unggah: Ukuran file ${sizeInKB} KB di luar batas yang diperbolehkan (100 KB - 500 KB)`);
      return;
    }
    handleInputChange(questionId, `Terunggah: ${fileName} (${sizeInKB} KB)`);
  };

  const getTabIcon = (iconName: string) => {
    switch (iconName) {
      case 'User': return <User className="w-5 h-5" />;
      case 'Users': return <Users className="w-5 h-5" />;
      case 'Heart': return <Heart className="w-5 h-5" />;
      case 'Award': return <Award className="w-5 h-5" />;
      case 'GraduationCap': return <GraduationCap className="w-5 h-5" />;
      case 'Briefcase': return <Briefcase className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  const handleNextSection = () => {
    const currentGroupIndex = QUESTION_GROUPS.findIndex(g => g.id === activeTab);
    const currentGroup = QUESTION_GROUPS[currentGroupIndex];
    
    const isTabValid = validateTab(currentGroup);
    if (!isTabValid) {
      const firstErrorId = Object.keys(validationErrors).find(id => 
        currentGroup.questions.some(q => q.id === id)
      );
      if (firstErrorId) {
        document.getElementById(`field-container-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      alert('Mohon periksa kembali, terdapat isian yang belum valid di bagian ini.');
      return;
    }

    if (currentGroupIndex < QUESTION_GROUPS.length - 1) {
      setActiveTab(QUESTION_GROUPS[currentGroupIndex + 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevSection = () => {
    const currentGroupIndex = QUESTION_GROUPS.findIndex(g => g.id === activeTab);
    if (currentGroupIndex > 0) {
      setActiveTab(QUESTION_GROUPS[currentGroupIndex - 1].id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSaveDraft = () => {
    const fullAnswers = { ...answers };
    
    Object.keys(photoStates).forEach(qId => {
      if (photoStates[qId].fileId) {
        fullAnswers[`${qId}_file_id`] = photoStates[qId].fileId;
        fullAnswers[`${qId}_file_url`] = photoStates[qId].fileUrl;
      }
    });
    
    onSave(fullAnswers, false);
    setSuccessMsg('✅ Draft pendaftaran berhasil disimpan dan disinkronkan ke Google Sheets!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleFinalSubmit = () => {
    const allErrors: Record<string, string> = {};
    let isValid = true;

    QUESTION_GROUPS.forEach(group => {
      group.questions.forEach(q => {
        const error = validateField(q, answers[q.id]);
        if (error) {
          allErrors[q.id] = error;
          isValid = false;
        }
      });
    });

    setValidationErrors(allErrors);

    if (!isValid) {
      setShowAllErrors(true);
      const firstErrorId = Object.keys(allErrors)[0];
      const faultyGroup = QUESTION_GROUPS.find(g => g.questions.some(q => q.id === firstErrorId));
      if (faultyGroup) {
        setActiveTab(faultyGroup.id);
        setTimeout(() => {
          document.getElementById(`field-container-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
      }
      alert('❌ Pendaftaran gagal dikirim! Silakan periksa kembali semua tab, ada isian wajib yang belum terisi.');
      return;
    }

    const fullAnswers = { ...answers };
    
    Object.keys(photoStates).forEach(qId => {
      if (photoStates[qId].fileId) {
        fullAnswers[`${qId}_file_id`] = photoStates[qId].fileId;
        fullAnswers[`${qId}_file_url`] = photoStates[qId].fileUrl;
      }
    });
    
    onSave(fullAnswers, true);
    alert('✅ Sukses! Data pendaftaran MPLS Anda berhasil dikirim secara penuh dan disimpan ke Google Sheets.');
    onClose();
  };

  const getGroupStats = (group: QuestionGroup) => {
    let filled = 0;
    let total = 0;

    group.questions.forEach(q => {
      let isApplicable = true;
      if (q.dependsOn) {
        const parentVal = answers[q.dependsOn.questionId];
        if (q.dependsOn.condition === 'equals' && parentVal !== q.dependsOn.value) isApplicable = false;
        if (q.dependsOn.condition === 'not_equals' && parentVal === q.dependsOn.value) isApplicable = false;
        if (q.dependsOn.condition === 'includes' && (!Array.isArray(parentVal) || !parentVal.includes(q.dependsOn.value))) isApplicable = false;
      }

      if (isApplicable) {
        total++;
        const val = answers[q.id];
        
        if (q.type === 'file') {
          if (photoStates[q.id]?.fileId) {
            filled++;
          }
        } else if (val !== undefined && val !== null && val !== '') {
          if (Array.isArray(val)) {
            if (val.length > 0) filled++;
          } else {
            filled++;
          }
        }
      }
    });

    return { filled, total };
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] pb-20 font-sans">
      {/* Top sticky action banner */}
      <div className="sticky top-0 z-40 bg-[#0C2B64] text-white shadow-xs border-b border-[#081F48]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#081F48] rounded-lg transition-colors text-white/80 hover:text-white"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs text-[#E5E5D8] font-medium">Formulir MPLS &bull; NIS {student.nis}</p>
              <h2 className="text-base font-extrabold text-white tracking-tight">{student.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-[#081F48] px-3 py-1.5 rounded-full border border-[#0C2B64]/30">
              <span className="text-xs text-[#E5E5D8]">Total Progres:</span>
              <div className="w-24 bg-[#0C2B64] rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${currentProgressPercent}%` }}
                ></div>
              </div>
              <span className="text-xs font-bold text-white">{currentProgressPercent}%</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-1.5 bg-[#081F48] hover:bg-[#3E3E2B] border border-[#0C2B64]/30 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Draft
              </button>
              <button
                onClick={handleFinalSubmit}
                className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] text-[#0C2B64] px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Kirim Form
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {successMsg && (
          <div className="mb-6 bg-[#EEF9F1] border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 animate-fade-in shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-semibold">{successMsg}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Sidebar Menu */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 z-10 space-y-4">
            <div className="bg-white rounded-2xl border border-[#D6D6C2] p-4 shadow-xs">
              <h3 className="text-xs font-bold text-[#8A8A70] uppercase tracking-wider mb-3 px-2">Kategori Pertanyaan</h3>
              <nav className="space-y-1">
                {QUESTION_GROUPS.map((group) => {
                  const stats = getGroupStats(group);
                  const isCompleted = stats.filled === stats.total && stats.total > 0;
                  const isActive = activeTab === group.id;

                  return (
                    <button
                      key={group.id}
                      onClick={() => {
                        setActiveTab(group.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-[#F5F5F0] text-[#33332D] border border-[#D6D6C2] shadow-xs font-semibold' 
                          : 'hover:bg-[#FDFCF8] text-[#0C2B64] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#0C2B64] text-white' : 'bg-[#F5F5F0] text-[#8A8A70]'}`}>
                          {getTabIcon(group.icon)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-none">{group.title}</p>
                          <p className="text-[10px] text-[#8A8A70] mt-1">{group.description.substring(0, 45)}...</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                          isCompleted ? 'bg-[#EEF9F1] text-emerald-800 border border-emerald-100' : 'bg-[#F5F5F0] text-[#0C2B64]'
                        }`}>
                          {stats.filled}/{stats.total}
                        </span>
                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="bg-[#FFFBEB] border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 shadow-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-800" />
                <span>Petunjuk Pengisian</span>
              </div>
              <p className="leading-relaxed">
                Anda dapat menyimpan progres pengisian data kapan saja dengan mengeklik tombol <strong>Simpan Draft</strong>. Data Anda akan disimpan dan dapat dilanjutkan nanti.
              </p>
              <p className="leading-relaxed font-semibold">
                * Kolom nama dan NIS adalah bawaan sistem yang bersifat terkunci (read-only).
              </p>
              <p className="leading-relaxed text-amber-700">
                📸 <strong>Upload Foto:</strong> Format JPG/PNG, Maks. 5 MB
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#D6D6C2] shadow-xs overflow-hidden">
            {QUESTION_GROUPS.map((group) => {
              if (activeTab !== group.id) return null;

              return (
                <div key={group.id} className="divide-y divide-[#E0E0D6]">
                  <div className="p-6 bg-[#F5F5F0]">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#0C2B64] text-white">
                        {getTabIcon(group.icon)}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#0C2B64] uppercase tracking-widest font-mono">BAGIAN MPLS</span>
                        <h2 className="text-lg font-bold text-[#33332D] tracking-tight">{group.title}</h2>
                        <p className="text-xs text-[#8A8A70] mt-0.5">{group.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {group.questions.map((q) => {
                      const value = answers[q.id];
                      const error = validationErrors[q.id];
                      const photoError = photoErrors[q.id];

                      let isVisible = true;
                      if (q.dependsOn) {
                        const parentVal = answers[q.dependsOn.questionId];
                        if (q.dependsOn.condition === 'equals' && parentVal !== q.dependsOn.value) {
                          isVisible = false;
                        } else if (q.dependsOn.condition === 'not_equals' && parentVal === q.dependsOn.value) {
                          isVisible = false;
                        } else if (q.dependsOn.condition === 'includes' && (!Array.isArray(parentVal) || !parentVal.includes(q.dependsOn.value))) {
                          isVisible = false;
                        }
                      }

                      if (!isVisible) return null;

                      const isReadOnly = q.id === 'q1' || q.id === 'q2';
                      const isPhotoQuestion = ['q6', 'q9', 'q29'].includes(q.id);

                      return (
                        <div 
                          key={q.id} 
                          id={`field-container-${q.id}`}
                          className={`space-y-2 p-4 rounded-xl border transition-all ${
                            error || photoError
                              ? 'border-red-200 bg-red-50/20' 
                              : 'border-[#F5F5F0] hover:border-[#D6D6C2]'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <label className="text-sm font-semibold text-[#33332D] leading-snug">
                              <span className="inline-block text-xs font-bold text-[#8A8A70] font-mono mr-1.5">Q.{q.number}</span>
                              {q.text}
                              {q.required && <span className="text-red-600 ml-1 font-bold">*</span>}
                            </label>
                            {isReadOnly && (
                              <span className="text-[10px] bg-[#E5E5D8] text-[#0C2B64] px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono shrink-0">
                                Terkunci
                              </span>
                            )}
                          </div>

                          {isPhotoQuestion ? (
                            <div className="space-y-2">
                              <PhotoUpload
                                studentNis={student.nis}
                                studentName={student.name}
                                questionId={q.id}
                                questionLabel={q.text}
                                onPhotoUploaded={(fileId, fileUrl) => handlePhotoUploaded(q.id, fileId, fileUrl)}
                                onPhotoError={(error) => handlePhotoError(q.id, error)}
                                existingPhotoUrl={photoStates[q.id]?.fileUrl}
                              />
                              {photoError && (
                                <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{photoError}</span>
                                </div>
                              )}
                              {photoStates[q.id]?.fileId && (
                                <div className="text-[10px] text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                                  ✅ Foto sudah terupload
                                </div>
                              )}
                            </div>
                          ) : q.type === 'text' ? (
                            <input
                              type="text"
                              value={value || ''}
                              readOnly={isReadOnly}
                              maxLength={q.maxLength}
                              disabled={isReadOnly}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              placeholder={q.placeholder || 'Isi jawaban di sini...'}
                              className={`w-full px-4 py-2.5 rounded-lg border text-sm text-[#33332D] focus:outline-none focus:ring-2 transition-all ${
                                isReadOnly 
                                  ? 'bg-[#F5F5F0] border-[#D6D6C2] text-[#8A8A70] cursor-not-allowed' 
                                  : error 
                                    ? 'border-red-300 focus:ring-red-100 focus:border-red-400 bg-white' 
                                    : 'border-[#D6D6C2] focus:ring-[#0C2B64]/10 focus:border-[#0C2B64] bg-white'
                              }`}
                            />
                          ) : q.type === 'date' ? (
                            <input
                              type="date"
                              value={value || ''}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              className={`w-full px-4 py-2.5 rounded-lg border text-sm text-[#33332D] focus:outline-none focus:ring-2 transition-all ${
                                error 
                                  ? 'border-red-300 focus:ring-red-100 focus:border-red-400 bg-white' 
                                  : 'border-[#D6D6C2] focus:ring-[#0C2B64]/10 focus:border-[#0C2B64] bg-white'
                              }`}
                            />
                          ) : q.type === 'select' ? (
                            <select
                              value={value || ''}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              className={`w-full px-4 py-2.5 rounded-lg border text-sm text-[#33332D] focus:outline-none focus:ring-2 transition-all ${
                                error 
                                  ? 'border-red-300 focus:ring-red-100 focus:border-red-400 bg-white' 
                                  : 'border-[#D6D6C2] focus:ring-[#0C2B64]/10 focus:border-[#0C2B64] bg-white'
                              }`}
                            >
                              <option value="">-- Pilih opsi jawaban --</option>
                              {q.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          ) : q.type === 'rating' ? (
                            <div className="flex items-center gap-1.5 py-1">
                              {[1, 2, 3, 4].map((num) => {
                                const isSelected = Number(value) === num;
                                return (
                                  <button
                                    key={num}
                                    type="button"
                                    onClick={() => handleInputChange(q.id, num)}
                                    className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center border font-semibold text-sm transition-all cursor-pointer ${
                                      isSelected
                                        ? 'bg-[#0C2B64] border-[#0C2B64] text-white shadow-xs scale-105'
                                        : 'border-[#D6D6C2] text-[#33332D] hover:bg-[#F5F5F0]'
                                    }`}
                                  >
                                    <span className="font-mono text-base">{num}</span>
                                  </button>
                                );
                              })}
                              <span className="text-xs text-[#8A8A70] ml-3 font-medium">
                                (1: Sangat Rendah/Tidak Pernah s/d 4: Sangat Minat/Sering)
                              </span>
                            </div>
                          ) : q.type === 'multiselect' ? (
                            <div className="space-y-3">
                              {q.maxSelections && (
                                <p className="text-[10px] font-bold text-[#0C2B64] uppercase font-mono">
                                  * Maksimal pilih {q.maxSelections} opsi
                                </p>
                              )}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options?.map((opt) => {
                                  const currentSelections: string[] = Array.isArray(value) ? value : [];
                                  const isSelected = currentSelections.includes(opt.value);
                                  const limitReached = q.maxSelections ? currentSelections.length >= q.maxSelections : false;

                                  return (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      disabled={!isSelected && limitReached}
                                      onClick={() => {
                                        let next: string[];
                                        if (isSelected) {
                                          next = currentSelections.filter(item => item !== opt.value);
                                        } else {
                                          next = [...currentSelections, opt.value];
                                        }
                                        handleInputChange(q.id, next);
                                      }}
                                      className={`flex items-center gap-3 p-3 rounded-lg border text-left text-xs transition-all ${
                                        isSelected
                                          ? 'bg-[#FDFCF8] border-[#0C2B64] text-[#33332D] font-medium shadow-xs'
                                          : !isSelected && limitReached
                                            ? 'bg-[#F5F5F0] border-[#E0E0D6] text-[#8A8A70] cursor-not-allowed opacity-60'
                                            : 'border-[#D6D6C2] text-[#33332D] hover:bg-[#F5F5F0] cursor-pointer'
                                      }`}
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-[#0C2B64] shrink-0" />
                                      ) : (
                                        <Square className="w-4 h-4 text-[#8A8A70] shrink-0" />
                                      )}
                                      <span>{opt.label}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {q.hasOther && (
                                <div className="space-y-2 mt-2 pt-2 border-t border-[#E0E0D6]">
                                  <label className="text-xs text-[#8A8A70] font-medium">Lainnya (Tuliskan sendiri jika kotak di atas dipilih):</label>
                                  <input
                                    type="text"
                                    value={answers[`${q.id}_other`] || ''}
                                    onChange={(e) => handleInputChange(`${q.id}_other`, e.target.value)}
                                    placeholder="Tuliskan isian manual lainnya di sini..."
                                    className="w-full px-4 py-2 rounded-lg border border-[#D6D6C2] text-xs focus:outline-none focus:ring-2 focus:ring-[#0C2B64]/10 focus:border-[#0C2B64] bg-white text-[#33332D]"
                                  />
                                </div>
                              )}
                            </div>
                          ) : q.type === 'file' && !isPhotoQuestion ? (
                            <div className="space-y-3">
                              {value ? (
                                <div className="flex items-center justify-between p-3 bg-[#EEF9F1] border border-emerald-200 rounded-xl">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    <div>
                                      <p className="text-xs font-bold text-emerald-900">File Berhasil Disimpan</p>
                                      <p className="text-[10px] text-emerald-800 font-mono leading-none mt-1">{value}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleInputChange(q.id, '')}
                                    className="text-[10px] text-red-600 hover:text-red-800 font-bold underline cursor-pointer"
                                  >
                                    Hapus & Ganti
                                  </button>
                                </div>
                              ) : (
                                <div className="border-2 border-dashed border-[#D6D6C2] rounded-xl p-6 text-center hover:bg-[#F5F5F0]/50 transition-all">
                                  <UploadCloud className="w-10 h-10 text-[#8A8A70] mx-auto mb-2" />
                                  <p className="text-xs font-semibold text-[#33332D]">Pilih atau Seret File Foto di sini</p>
                                  <p className="text-[10px] text-[#8A8A70] mt-1">Hanya mendukung format .jpg, .jpeg, .png (Ukuran wajib 100 s/d 500 KB)</p>
                                  
                                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                                    <button
                                      type="button"
                                      onClick={() => handleSimulatedUpload(q.id, 230, `foto_${q.id}_selfie.jpg`)}
                                      className="text-[10px] bg-[#F5F5F0] hover:bg-[#E5E5D8] text-[#0C2B64] px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer"
                                    >
                                      Gunakan File Contoh (230 KB)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSimulatedUpload(q.id, 45, `foto_kecil.jpg`)}
                                      className="text-[10px] bg-red-50 hover:bg-red-100 text-red-700 px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer"
                                    >
                                      Simulasi File Kecil (45 KB - Tolak)
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : q.type === 'location' ? (
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={value || ''}
                                  readOnly
                                  placeholder="Titik Koordinat (Latitude, Longitude)"
                                  className="flex-1 px-4 py-2.5 rounded-lg border border-[#D6D6C2] text-sm text-[#33332D] bg-[#F5F5F0] cursor-not-allowed"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleGPSLocation(q.id)}
                                  disabled={gpsLoading}
                                  className="flex items-center gap-1.5 bg-[#0C2B64] hover:bg-[#081F48] disabled:bg-[#F5F5F0] text-white disabled:text-[#8A8A70] px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer shrink-0"
                                >
                                  {gpsLoading ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <MapPin className="w-4 h-4" />
                                  )}
                                  {gpsLoading ? 'Mencari...' : 'Dapatkan GPS'}
                                </button>
                              </div>
                              <p className="text-[10px] text-[#8A8A70]">
                                Klik tombol di atas untuk mendeteksi posisi GPS perangkat Anda.
                              </p>
                            </div>
                          ) : null}

                          {(error || photoError) && (
                            <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{error || photoError}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-6 bg-[#F5F5F0] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrevSection}
                      disabled={QUESTION_GROUPS[0].id === activeTab}
                      className="flex items-center gap-1.5 bg-white border border-[#D6D6C2] hover:bg-[#F5F5F0] disabled:bg-[#F5F5F0] disabled:text-[#8A8A70] px-4 py-2 rounded-lg text-xs font-bold text-[#33332D] transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      Sebelumnya
                    </button>

                    {QUESTION_GROUPS[QUESTION_GROUPS.length - 1].id !== activeTab ? (
                      <button
                        type="button"
                        onClick={handleNextSection}
                        className="flex items-center gap-1.5 bg-[#0C2B64] hover:bg-[#081F48] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all hover:translate-x-0.5 cursor-pointer shadow-xs"
                      >
                        Berikutnya
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinalSubmit}
                        className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Kirim Jawaban Lengkap
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}