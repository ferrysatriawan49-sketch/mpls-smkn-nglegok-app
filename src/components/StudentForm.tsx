import React, { useState, useEffect } from 'react';
import { Student, QuestionGroup, Question } from '../types';
import { QUESTION_GROUPS, getQuestionsList } from '../questionsData';
import { calculateProgressPercent, formatGPS } from '../utils';
import { 
  User, Users, Heart, Award, GraduationCap, Briefcase, 
  ArrowLeft, ArrowRight, Save, CheckCircle2, AlertCircle, 
  MapPin, UploadCloud, Eye, RefreshCw, LogOut, CheckSquare, Square
} from 'lucide-react';

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

  // Auto-set the Read-Only questions on mount
  useEffect(() => {
    setAnswers(prev => ({
      ...prev,
      q1: student.name,
      q2: student.nis
    }));
  }, [student]);

  const questions = getQuestionsList();

  // Progress of current answers
  const currentProgressPercent = calculateProgressPercent(answers, questions);

  // Validate a single field
  const validateField = (q: Question, value: any): string => {
    // Check if applicable
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

  // Run validation for a specific tab or all questions
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
      
      // Validation on-the-fly
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

      // If Q31 changes, clear wali fields if "Orang Tua Siswa" is chosen
      if (questionId === 'q31' && value === 'Orang Tua Siswa (Ayah / Ibu Kandung)') {
        delete newAnswers.q32;
        delete newAnswers.q33;
        delete newAnswers.q34;
        delete newAnswers.q35;
        delete newAnswers.q36;
      }

      // If Q38 changes to "tidak pernah", clear q39
      if (questionId === 'q38' && value === 'tidak pernah') {
        delete newAnswers.q39;
      }

      return newAnswers;
    });
  };

  // Simulated GPS Coordinates
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
          // Fallback to SMKN 1 Nglegok Blitar vicinity
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

  // Mock Upload Selector
  const handleSimulatedUpload = (questionId: string, sizeInKB: number, fileName: string) => {
    if (sizeInKB < 100 || sizeInKB > 500) {
      alert(`Gagal unggah: Ukuran file ${sizeInKB} KB di luar batas yang diperbolehkan (100 KB - 500 KB)`);
      return;
    }
    handleInputChange(questionId, `Terunggah: ${fileName} (${sizeInKB} KB)`);
  };

  // Get icons dynamically
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

  // Handle section progression
  const handleNextSection = () => {
    const currentGroupIndex = QUESTION_GROUPS.findIndex(g => g.id === activeTab);
    const currentGroup = QUESTION_GROUPS[currentGroupIndex];
    
    // Validate current tab before continuing
    const isTabValid = validateTab(currentGroup);
    if (!isTabValid) {
      // Scroll to the first error
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

  // Save progress draft
  const handleSaveDraft = () => {
    onSave(answers, false);
    setSuccessMsg('Draft pendaftaran berhasil disimpan sementara!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Final submit
  const handleFinalSubmit = () => {
    const allErrors: Record<string, string> = {};
    let isValid = true;

    // Validate ALL questions
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
      // Find which group has the first error
      const firstErrorId = Object.keys(allErrors)[0];
      const faultyGroup = QUESTION_GROUPS.find(g => g.questions.some(q => q.id === firstErrorId));
      if (faultyGroup) {
        setActiveTab(faultyGroup.id);
        setTimeout(() => {
          document.getElementById(`field-container-${firstErrorId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);
      }
      alert('Pendaftaran gagal dikirim! Silakan periksa kembali semua tab, ada isian wajib yang belum terisi atau tidak memenuhi kriteria validasi.');
      return;
    }

    onSave(answers, true);
    alert('Sukses! Data pendaftaran MPLS Anda berhasil dikirim secara penuh.');
    onClose();
  };

  // Check how many questions answered in a group
  const getGroupStats = (group: QuestionGroup) => {
    let filled = 0;
    let total = 0;

    group.questions.forEach(q => {
      // Check dependency
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
        if (val !== undefined && val !== null && val !== '') {
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
      <div className="sticky top-0 z-40 bg-[#5A5A40] text-white shadow-xs border-b border-[#4A4A35]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#4A4A35] rounded-lg transition-colors text-white/80 hover:text-white"
              title="Kembali ke Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-xs text-[#E5E5D8] font-medium">Formulir MPLS &bull; NIS {student.nis}</p>
              <h2 className="text-base font-extrabold text-white tracking-tight">{student.name}</h2>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-[#4A4A35] px-3 py-1.5 rounded-full border border-[#5A5A40]/30">
              <span className="text-xs text-[#E5E5D8]">Total Progres:</span>
              <div className="w-24 bg-[#5A5A40] rounded-full h-2">
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
                className="flex items-center gap-1.5 bg-[#4A4A35] hover:bg-[#3E3E2B] border border-[#5A5A40]/30 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                Simpan Draft
              </button>
              <button
                onClick={handleFinalSubmit}
                className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] text-[#5A5A40] px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
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

        {/* Form Layout: Sidebar Navigation & Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Sidebar Menu - Sticky for desktop */}
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
                          : 'hover:bg-[#FDFCF8] text-[#5A5A40] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isActive ? 'bg-[#5A5A40] text-white' : 'bg-[#F5F5F0] text-[#8A8A70]'}`}>
                          {getTabIcon(group.icon)}
                        </div>
                        <div>
                          <p className="text-xs font-semibold leading-none">{group.title}</p>
                          <p className="text-[10px] text-[#8A8A70] mt-1">{group.description.substring(0, 45)}...</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                          isCompleted ? 'bg-[#EEF9F1] text-emerald-800 border border-emerald-100' : 'bg-[#F5F5F0] text-[#5A5A40]'
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

            {/* Hint Box */}
            <div className="bg-[#FFFBEB] border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 shadow-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-800" />
                <span>Petunjuk Pengisian</span>
              </div>
              <p className="leading-relaxed">
                Anda dapat menyimpan progres pengisian data kapan saja dengan mengeklik tombol <strong>Simpan Draft</strong>. Data Anda akan disimpan dan dapat dilanjutkan nanti dengan memasukkan kembali NIS Anda.
              </p>
              <p className="leading-relaxed font-semibold">
                * Kolom nama dan NIS adalah bawaan sistem yang bersifat terkunci (read-only).
              </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="lg:col-span-8 bg-white rounded-2xl border border-[#D6D6C2] shadow-xs overflow-hidden">
            {QUESTION_GROUPS.map((group) => {
              if (activeTab !== group.id) return null;

              return (
                <div key={group.id} className="divide-y divide-[#E0E0D6]">
                  {/* Section Header */}
                  <div className="p-6 bg-[#F5F5F0]">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#5A5A40] text-white">
                        {getTabIcon(group.icon)}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest font-mono">BAGIAN MPLS</span>
                        <h2 className="text-lg font-bold text-[#33332D] tracking-tight">{group.title}</h2>
                        <p className="text-xs text-[#8A8A70] mt-0.5">{group.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Questions Grid */}
                  <div className="p-6 space-y-6">
                    {group.questions.map((q) => {
                      const value = answers[q.id];
                      const error = validationErrors[q.id];

                      // Dependency logic check
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

                      // Read-only logic for Name & NIS
                      const isReadOnly = q.id === 'q1' || q.id === 'q2';

                      return (
                        <div 
                          key={q.id} 
                          id={`field-container-${q.id}`}
                          className={`space-y-2 p-4 rounded-xl border transition-all ${
                            error 
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
                              <span className="text-[10px] bg-[#E5E5D8] text-[#5A5A40] px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono shrink-0">
                                Terkunci
                              </span>
                            )}
                          </div>

                          {/* Render Inputs dynamically */}
                          {q.type === 'text' && (
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
                                    : 'border-[#D6D6C2] focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] bg-white'
                              }`}
                            />
                          )}

                          {q.type === 'date' && (
                            <input
                              type="date"
                              value={value || ''}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              className={`w-full px-4 py-2.5 rounded-lg border text-sm text-[#33332D] focus:outline-none focus:ring-2 transition-all ${
                                error 
                                  ? 'border-red-300 focus:ring-red-100 focus:border-red-400 bg-white' 
                                  : 'border-[#D6D6C2] focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] bg-white'
                              }`}
                            />
                          )}

                          {q.type === 'select' && (
                            <select
                              value={value || ''}
                              onChange={(e) => handleInputChange(q.id, e.target.value)}
                              className={`w-full px-4 py-2.5 rounded-lg border text-sm text-[#33332D] focus:outline-none focus:ring-2 transition-all ${
                                error 
                                  ? 'border-red-300 focus:ring-red-100 focus:border-red-400 bg-white' 
                                  : 'border-[#D6D6C2] focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] bg-white'
                              }`}
                            >
                              <option value="">-- Pilih opsi jawaban --</option>
                              {q.options?.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          )}

                          {q.type === 'rating' && (
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
                                        ? 'bg-[#5A5A40] border-[#5A5A40] text-white shadow-xs scale-105'
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
                          )}

                          {q.type === 'multiselect' && (
                            <div className="space-y-3">
                              {q.maxSelections && (
                                <p className="text-[10px] font-bold text-[#5A5A40] uppercase font-mono">
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
                                          ? 'bg-[#FDFCF8] border-[#5A5A40] text-[#33332D] font-medium shadow-xs'
                                          : !isSelected && limitReached
                                            ? 'bg-[#F5F5F0] border-[#E0E0D6] text-[#8A8A70] cursor-not-allowed opacity-60'
                                            : 'border-[#D6D6C2] text-[#33332D] hover:bg-[#F5F5F0] cursor-pointer'
                                      }`}
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-[#5A5A40] shrink-0" />
                                      ) : (
                                        <Square className="w-4 h-4 text-[#8A8A70] shrink-0" />
                                      )}
                                      <span>{opt.label}</span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Other manual text option */}
                              {q.hasOther && (
                                <div className="space-y-2 mt-2 pt-2 border-t border-[#E0E0D6]">
                                  <label className="text-xs text-[#8A8A70] font-medium">Lainnya (Tuliskan sendiri jika kotak di atas dipilih):</label>
                                  <input
                                    type="text"
                                    value={answers[`${q.id}_other`] || ''}
                                    onChange={(e) => handleInputChange(`${`q${q.number}_other`}`, e.target.value)}
                                    placeholder="Tuliskan isian manual lainnya di sini..."
                                    className="w-full px-4 py-2 rounded-lg border border-[#D6D6C2] text-xs focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/10 focus:border-[#5A5A40] bg-white text-[#33332D]"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {q.type === 'file' && (
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
                                  
                                  {/* Easy testing options */}
                                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                                    <button
                                      type="button"
                                      onClick={() => handleSimulatedUpload(q.id, 230, `foto_${q.id}_selfie.jpg`)}
                                      className="text-[10px] bg-[#F5F5F0] hover:bg-[#E5E5D8] text-[#5A5A40] px-2.5 py-1.5 rounded-md font-semibold transition-colors cursor-pointer"
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
                          )}

                          {q.type === 'location' && (
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
                                  className="flex items-center gap-1.5 bg-[#5A5A40] hover:bg-[#4A4A35] disabled:bg-[#F5F5F0] text-white disabled:text-[#8A8A70] px-4 py-2.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer shrink-0"
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
                                Klik tombol di atas untuk mendeteksi posisi GPS perangkat Anda. Jika browser memblokir, sistem akan mensimulasikan koordinat akurat di wilayah Nglegok Blitar.
                              </p>
                            </div>
                          )}

                          {error && (
                            <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{error}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Tab Stepper Controls */}
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
                        className="flex items-center gap-1.5 bg-[#5A5A40] hover:bg-[#4A4A35] text-white px-5 py-2 rounded-lg text-xs font-bold transition-all hover:translate-x-0.5 cursor-pointer shadow-xs"
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
