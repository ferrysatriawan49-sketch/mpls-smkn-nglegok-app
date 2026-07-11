import React, { useState, useEffect } from 'react';
import { Student } from './types';
import { INITIAL_STUDENTS } from './initialStudents';
import { getQuestionsList } from './questionsData';
import { exportToCSV, calculateProgressPercent } from './utils';
import StudentForm from './components/StudentForm';
// @ts-ignore
import logoImg from './assets/smknglegok_logo.png';
import { logoBase64 } from './assets/logoBase64';
import { 
  FileSpreadsheet, Search, Filter, RefreshCw, LogIn, Sparkles, 
  Download, UserPlus, Database, CheckCircle2, AlertCircle, Clock, 
  Trash2, Mail, MapPin, ExternalLink, Calendar, ChevronLeft, ChevronRight, CheckSquare, ShieldCheck,
  Lock, Unlock
} from 'lucide-react';

export default function App() {
  // ============================================================
  // 1. SEMUA useState
  // ============================================================
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [jurusanFilter, setJurusanFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Login Gate State
  const [loginStudent, setLoginStudent] = useState<Student | null>(null);
  const [nisPassword, setNisPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sheets Syncing State
  // const [googleSheetsUrl, setGoogleSheetsUrl] = useState(() => {
  //   return localStorage.getItem('mpls_google_sheets_url') || 'https://script.google.com/macros/s/AKfycbwn52uWUiLwjVa4CUBHN10CGS-NGXv1YP3Z5k8eksY67y-wSBT8XQWdP3kHuY-QNpPrhQ/exec';
  // });
const [googleSheetsUrl, setGoogleSheetsUrl] = useState(() => {
  // Prioritaskan dari Environment Variables (Vercel)
  const envUrl = process.env.REACT_APP_GOOGLE_SHEETS_URL;
  if (envUrl && envUrl.startsWith('http')) {
    return envUrl;
  }
  // Jika tidak ada, cek localStorage
  const localUrl = localStorage.getItem('mpls_google_sheets_url');
  if (localUrl && localUrl.startsWith('http')) {
    return localUrl;
  }
  // Fallback ke URL default (GANTI DENGAN URL BARU ANDA)
  return 'https://script.google.com/macros/s/AKfycbx4t_4Py7SA8xNtfNgPng9l4H04IEg2m_CYHRPCHFSXrLnZrS8BO4fl-M9FX3qBHiPPcQ/exec';
});
  const [googleSheetsUrlInput, setGoogleSheetsUrlInput] = useState(googleSheetsUrl);
  const [urlSavedSuccess, setUrlSavedSuccess] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showSyncPanel, setShowSyncPanel] = useState(true);
  const [showCodeModal, setShowCodeModal] = useState(false);

  // Silent Auto-Syncing State
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [autoSyncStatus, setAutoSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Developer Unlock Mode States
  const [isDevUnlocked, setIsDevUnlocked] = useState(() => {
    return localStorage.getItem('mpls_dev_unlocked') === 'true';
  });
  const [showDevPrompt, setShowDevPrompt] = useState(false);
  const [inputDevEmail, setInputDevEmail] = useState('');
  const [inputDevPassword, setInputDevPassword] = useState('');
  const [devPasswordError, setDevPasswordError] = useState('');
  const [isVerifyingDev, setIsVerifyingDev] = useState(false);

  // States for updating developer credentials
  const [devCurrentEmail, setDevCurrentEmail] = useState('');
  const [devCurrentPassword, setDevCurrentPassword] = useState('');
  const [devNewEmail, setDevNewEmail] = useState('');
  const [devNewPassword, setDevNewPassword] = useState('');
  const [isUpdatingDevCreds, setIsUpdatingDevCreds] = useState(false);
  const [devCredsError, setDevCredsError] = useState('');
  const [devCredsSuccess, setDevCredsSuccess] = useState('');
  const [showChangeCredsForm, setShowChangeCredsForm] = useState(false);

  // Add Custom Student State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNis, setNewStudentNis] = useState('');
  const [newStudentJurusan, setNewStudentJurusan] = useState('TKJ');

  // ============================================================
  // 2. FUNGSI RESET FILTER GLOBAL
  // ============================================================
  const resetAllFilters = () => {
    console.log('🔄 Reset semua filter...');
    setSearchQuery('');
    setJurusanFilter('All');
    setStatusFilter('All');
    setCurrentPage(1);
    setTimeout(() => {
      console.log('✅ State setelah reset:', {
        searchQuery: '',
        jurusanFilter: 'All',
        statusFilter: 'All',
        currentPage: 1
      });
    }, 50);
  };

  // ============================================================
  // 3. SEMUA useEffect
  // ============================================================
  // Persist URL & Dev Unlocked State
  useEffect(() => {
    localStorage.setItem('mpls_google_sheets_url', googleSheetsUrl);
    setGoogleSheetsUrlInput(googleSheetsUrl);
  }, [googleSheetsUrl]);

  useEffect(() => {
    localStorage.setItem('mpls_dev_unlocked', String(isDevUnlocked));
  }, [isDevUnlocked]);

  // Load students from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mpls_smkn_nglegok_students');
    if (saved) {
      try {
        setStudents(JSON.parse(saved));
      } catch (e) {
        setStudents(INITIAL_STUDENTS);
      }
    } else {
      setStudents(INITIAL_STUDENTS);
      localStorage.setItem('mpls_smkn_nglegok_students', JSON.stringify(INITIAL_STUDENTS));
    }
  }, []);

  // ============================================================
  // 4. SEMUA FUNGSI LAINNYA
  // ============================================================

  // Handle saving the custom Google Sheets URL
  const handleSaveSheetsUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = googleSheetsUrlInput.trim();
    if (!cleanUrl.startsWith('http')) {
      alert('Format URL tidak valid! Harus diawali dengan https:// atau http://');
      return;
    }
    setGoogleSheetsUrl(cleanUrl);
    localStorage.setItem('mpls_google_sheets_url', cleanUrl);
    setUrlSavedSuccess(true);
    alert('Berhasil! URL Web App Google Sheets Anda telah disimpan.');
    setTimeout(() => {
      setUrlSavedSuccess(false);
    }, 4000);
  };

  // ============================================================
  // 🔥 HANDLE DEVELOPER LOGIN - TANPA FALLBACK DEFAULT
  // ============================================================
  const handleDevUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inputDevEmail.trim().toLowerCase();
    const cleanPassword = inputDevPassword.trim();
    
    if (!cleanEmail || !cleanPassword) {
      setDevPasswordError('Email dan Password harus diisi!');
      return;
    }

    setIsVerifyingDev(true);
    setDevPasswordError('');

    const hasSheetsUrl = googleSheetsUrl && googleSheetsUrl.startsWith('http');

    if (hasSheetsUrl) {
      try {
        let response;
        try {
          const getUrl = `${googleSheetsUrl}${googleSheetsUrl.includes('?') ? '&' : '?'}action=verifyDeveloper&email=${encodeURIComponent(cleanEmail)}&password=${encodeURIComponent(cleanPassword)}`;
          response = await fetch(getUrl, { method: 'GET' });
        } catch (getErr) {
          response = await fetch(googleSheetsUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ 
              action: 'verifyDeveloper', 
              email: cleanEmail,
              password: cleanPassword 
            })
          });
        }

        if (response.ok) {
          const result = await response.json();
          if (result && result.status === 'success' && result.verified) {
            setIsDevUnlocked(true);
            setShowDevPrompt(false);
            setInputDevEmail('');
            setInputDevPassword('');
            setIsVerifyingDev(false);
            alert('✅ Akses developer berhasil dikonfirmasi!');
            return;
          } else {
            // ❌ TIDAK ADA FALLBACK DEFAULT - HANYA DARI SHEETS
            setDevPasswordError('❌ Email atau Password salah! Password default (admin123) SUDAH TIDAK BERLAKU. Gunakan data di sheet "developer" Google Sheets Anda.');
            setIsVerifyingDev(false);
            return;
          }
        } else {
          throw new Error('Gagal menghubungi server');
        }
      } catch (err) {
        console.error('Gagal verifikasi:', err);
        setDevPasswordError('❌ Gagal terhubung ke server. Periksa URL Web App Anda.');
        setIsVerifyingDev(false);
        return;
      }
    } else {
      // ❌ TIDAK ADA FALLBACK OFFLINE
      setDevPasswordError('❌ URL Google Sheets belum diset! Masukkan URL Web App Anda terlebih dahulu.');
      setIsVerifyingDev(false);
      return;
    }
  };

  // ============================================================
  // FUNGSI CEK KREDENSIAL
  // ============================================================
  const checkCurrentCredentials = async () => {
    if (!googleSheetsUrl.trim()) {
      alert('❌ Masukkan URL Google Apps Script Web App terlebih dahulu!');
      return;
    }

    setIsSyncing(true);
    setSyncLogs([]);

    const log = (msg: string) => {
      setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString('id-ID')}] ${msg}`]);
    };

    log('🔍 Mengecek kredensial developer yang tersimpan di Google Sheets...');

    try {
      let response;
      try {
        response = await fetch(googleSheetsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'fetchStudents' })
        });
      } catch (err) {
        const getUrl = googleSheetsUrl.includes('?') 
          ? `${googleSheetsUrl}&action=fetchStudents` 
          : `${googleSheetsUrl}?action=fetchStudents`;
        response = await fetch(getUrl, { method: 'GET' });
      }

      if (!response || !response.ok) {
        throw new Error(`HTTP Error: ${response?.status || 'Unknown'}`);
      }

      const result = await response.json();
      log('✅ Berhasil terhubung ke Google Sheets!');
      log('📋 Cek sheet "developer" di Google Sheets Anda:');
      log('   - Cell A2 = Email developer (YANG BERLAKU)');
      log('   - Cell B2 = Password developer (YANG BERLAKU)');
      log('   - ⚠️ Password default (admin123) SUDAH TIDAK BERLAKU!');
      alert('🔍 INGAT! Password default (admin123) SUDAH TIDAK BERLAKU!\n\nSilakan buka Google Sheets Anda dan periksa:\n1. Sheet "developer"\n2. Cell A2 = Email developer yang berlaku\n3. Cell B2 = Password developer yang berlaku\n\nHANYA data di sheet ini yang bisa digunakan untuk login developer!');
    } catch (err: any) {
      log(`❌ GAGAL: ${err.message || 'Koneksi ditolak'}`);
      alert('❌ Gagal terhubung ke Google Sheets. Periksa URL Web App Anda.');
    } finally {
      setIsSyncing(false);
    }
  };

  // ============================================================
  // HANDLE UPDATE DEVELOPER CREDENTIALS
  // ============================================================
  const handleUpdateDevCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setDevCredsError('');
    setDevCredsSuccess('');

    const currentEmailClean = devCurrentEmail.trim().toLowerCase();
    const currentPasswordClean = devCurrentPassword.trim();
    const newEmailClean = devNewEmail.trim().toLowerCase();
    const newPasswordClean = devNewPassword.trim();

    if (!currentEmailClean || !currentPasswordClean || !newEmailClean || !newPasswordClean) {
      setDevCredsError('Semua kolom harus diisi!');
      return;
    }

    if (newPasswordClean.length < 6) {
      setDevCredsError('Password baru minimal 6 karakter!');
      return;
    }

    const hasSheetsUrl = googleSheetsUrl && googleSheetsUrl.startsWith('http');
    
    console.log('📤 Mengirim data update:', {
      currentEmail: currentEmailClean,
      currentPassword: currentPasswordClean,
      newEmail: newEmailClean,
      newPassword: newPasswordClean
    });

    if (!hasSheetsUrl) {
      setDevCredsError('❌ URL Google Sheets belum diset! Masukkan URL terlebih dahulu.');
      return;
    }

    setIsUpdatingDevCreds(true);
    try {
      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'updateDeveloper',
          currentEmail: currentEmailClean,
          currentPassword: currentPasswordClean,
          newEmail: newEmailClean,
          newPassword: newPasswordClean
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📥 Response dari server:', result);
        
        if (result && result.status === 'success') {
          setDevCredsSuccess('✅ Berhasil! Kredensial developer telah diperbarui di Google Sheets.');
          setDevCurrentEmail('');
          setDevCurrentPassword('');
          setDevNewEmail('');
          setDevNewPassword('');
          
          // Update stored credentials di localStorage
          localStorage.setItem('mpls_dev_email', newEmailClean);
          localStorage.setItem('mpls_dev_password', newPasswordClean);
          
          if (result.debug) {
            console.log('🔍 Debug info:', result.debug);
          }
        } else {
          const errorMsg = result.message || 'Gagal memperbarui kredensial.';
          const debugInfo = result.debug ? 
            `\n\n📋 Debug:\n- Email stored: ${result.debug.storedEmail}\n- Password stored: ${result.debug.storedPassword}\n- Email input: ${result.debug.inputEmail}\n- Password input: ${result.debug.inputPassword}\n- Email match: ${result.debug.emailMatch}\n- Password match: ${result.debug.passwordMatch}` 
            : '';
          setDevCredsError(`${errorMsg}${debugInfo}`);
          
          if (result.debug) {
            alert(`❌ Gagal memperbarui!\n\nEmail tersimpan: ${result.debug.storedEmail}\nPassword tersimpan: ${result.debug.storedPassword}\n\nEmail yang dimasukkan: ${result.debug.inputEmail}\nPassword yang dimasukkan: ${result.debug.inputPassword}\n\n⚠️ Password default (admin123) SUDAH TIDAK BERLAKU! Gunakan data di sheet "developer".`);
          }
        }
      } else {
        throw new Error('Gagal menghubungi Google Sheets.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('Failed to fetch')) {
        setDevCredsError('❌ Gagal memperbarui (Failed to fetch). Pastikan URL Web App benar dan sudah di-deploy ulang.');
      } else {
        setDevCredsError('❌ Gagal memperbarui kredensial: ' + err.message);
      }
    } finally {
      setIsUpdatingDevCreds(false);
    }
  };

  // Silent Auto-Syncing trigger
  const triggerAutoSync = async (latestStudents: Student[]) => {
    if (!googleSheetsUrl || !googleSheetsUrl.trim().startsWith('http')) return;
    
    setIsAutoSyncing(true);
    setAutoSyncStatus('syncing');
    
    try {
      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ students: latestStudents })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      if (result.status === 'success' || result.status === 'ok') {
        setAutoSyncStatus('success');
      } else {
        setAutoSyncStatus('error');
      }
    } catch (err) {
      console.warn('Auto sync error:', err);
      try {
        await fetch(googleSheetsUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ students: latestStudents })
        });
        setAutoSyncStatus('success');
      } catch (fallbackErr) {
        console.error('Auto sync failed:', fallbackErr);
        setAutoSyncStatus('error');
      }
    } finally {
      setIsAutoSyncing(false);
      setTimeout(() => {
        setAutoSyncStatus(prev => prev === 'success' ? 'idle' : prev);
      }, 3000);
    }
  };

  // Save database helper
  const saveStudentsToDB = (updatedStudents: Student[]) => {
    setStudents(updatedStudents);
    localStorage.setItem('mpls_smkn_nglegok_students', JSON.stringify(updatedStudents));
    triggerAutoSync(updatedStudents);
  };

  // ============================================================
  // HANDLE SYNC SHEETS - dengan auto-refresh
  // ============================================================
  const handleSyncSheets = async () => {
    if (!googleSheetsUrl.trim()) {
      alert('Masukkan URL Google Apps Script Web App terlebih dahulu!');
      return;
    }

    setIsSyncing(true);
    setSyncLogs([]);

    const log = (msg: string) => {
      setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString('id-ID')}] ${msg}`]);
    };

    log('Menghubungkan ke API Google Apps Script Web App...');
    log(`Menemukan ${students.length} data baris siswa...`);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      log('Mengirim payload data siswa ke Google Sheets...');

      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ students })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();
      if (result.status === 'success' || result.status === 'ok') {
        log(`✓ BERHASIL: ${result.message || 'Sinkronisasi selesai!'}`);
        log('⏳ Menarik data terbaru dari Google Sheets...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await handlePullSheets();
      } else {
        log(`⚠️ Respon Server: ${result.message || 'Ada peringatan dari server'}`);
      }
    } catch (err: any) {
      log(`❌ GAGAL: ${err.message || 'Koneksi ditolak'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // ============================================================
  // HANDLE PULL SHEETS - dengan reset filter
  // ============================================================
  const handlePullSheets = async () => {
    if (!googleSheetsUrl.trim()) {
      alert('Masukkan URL Google Apps Script Web App terlebih dahulu!');
      return;
    }

    setIsSyncing(true);
    setSyncLogs([]);

    const log = (msg: string) => {
      setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString('id-ID')}] ${msg}`]);
    };

    log('Menghubungkan ke API Google Apps Script Web App...');
    log('Mempersiapkan penarikan data siswa dari Google Sheets...');

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      log('Mengirim permintaan "fetchStudents" ke Google Sheets...');

      let response;

      try {
        log('Mencoba mengambil data via POST...');
        response = await fetch(googleSheetsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'fetchStudents' })
        });
      } catch (postErr) {
        log('⚠️ Gagal via POST, mencoba GET...');
        try {
          const getUrl = googleSheetsUrl.includes('?') 
            ? `${googleSheetsUrl}&action=fetchStudents` 
            : `${googleSheetsUrl}?action=fetchStudents`;
          response = await fetch(getUrl, { method: 'GET' });
        } catch (getErr) {
          throw new Error(`Gagal terhubung: ${getErr.message}`);
        }
      }

      if (!response || !response.ok) {
        throw new Error(`HTTP Error: ${response?.status || 'Unknown'}`);
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.students) {
        const importedCount = result.students.length;
        log(`✓ BERHASIL: Menemukan ${importedCount} data siswa di Google Sheets.`);
        
        if (importedCount > 0) {
          saveStudentsToDB(result.students);
          resetAllFilters();
          log('✓ Database lokal telah disinkronkan dengan data Google Sheets terbaru!');
          log('✓ Filter otomatis di-reset ke default.');
          alert(`Berhasil menarik data! ${importedCount} data siswa dari Google Sheets telah diimpor ke dalam aplikasi.\n\nFilter otomatis di-reset.`);
        } else {
          log('⚠️ Google Sheets mengembalikan 0 baris siswa.');
          alert('Berhasil terhubung ke Google Sheets, namun tidak ditemukan data siswa pada sheet "Data Siswa".');
        }
      } else {
        throw new Error(result.message || 'Gagal mengambil data siswa.');
      }
    } catch (err: any) {
      console.error('Gagal mengambil data dari Google Sheets:', err);
      log(`❌ GAGAL: ${err.message || 'Koneksi ditolak atau URL salah'}`);
      alert(`Gagal mengambil data siswa!\n\nError: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset database
  const handleResetDatabase = () => {
    if (!isDevUnlocked) {
      alert('Akses ditolak! Anda harus masuk sebagai developer.');
      return;
    }
    if (confirm('Apakah Anda yakin ingin mereset seluruh database pendaftaran ke roster default awal?')) {
      saveStudentsToDB(INITIAL_STUDENTS);
      resetAllFilters();
      alert('Database berhasil di-reset ke roster default.');
    }
  };

  // Add new student
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDevUnlocked) {
      alert('Akses ditolak! Anda harus masuk sebagai developer.');
      return;
    }
    if (!newStudentName.trim() || !newStudentNis.trim()) {
      alert('Nama Lengkap dan NIS wajib diisi!');
      return;
    }

    if (students.some(s => s.nis === newStudentNis)) {
      alert('Siswa dengan NIS tersebut sudah terdaftar!');
      return;
    }

    const newStudent: Student = {
      id: newStudentNis,
      nis: newStudentNis,
      name: newStudentName.trim().toUpperCase(),
      progress: 'not_started',
      progressPercent: 0,
      answers: {
        q1: newStudentName.trim().toUpperCase(),
        q2: newStudentNis
      }
    };

    const nextList = [newStudent, ...students];
    saveStudentsToDB(nextList);
    setNewStudentName('');
    setNewStudentNis('');
    setShowAddModal(false);
    alert(`Siswa ${newStudent.name} berhasil ditambahkan.`);
  };

  // Delete student
  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (!isDevUnlocked) {
      alert('Akses ditolak!');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus siswa "${studentName}"?`)) {
      const updated = students.filter(s => s.id !== studentId);
      saveStudentsToDB(updated);
      alert(`Siswa ${studentName} berhasil dihapus.`);
    }
  };

  // Student login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginStudent) return;

    if (nisPassword === loginStudent.nis) {
      setSelectedStudent(loginStudent);
      setLoginStudent(null);
      setNisPassword('');
      setLoginError(null);
    } else {
      setLoginError('NIS salah!');
    }
  };

  // Save student answers
  const handleSaveStudentAnswers = (answers: Record<string, any>, isSubmitted: boolean) => {
    if (!selectedStudent) return;

    const questions = getQuestionsList();
    const progressPercent = calculateProgressPercent(answers, questions);
    
    let progressState: 'not_started' | 'in_progress' | 'completed' = 'not_started';
    if (isSubmitted || progressPercent === 100) {
      progressState = 'completed';
    } else if (progressPercent > 0) {
      progressState = 'in_progress';
    }

    const updated = students.map(s => {
      if (s.id === selectedStudent.id) {
        return {
          ...s,
          progress: progressState,
          progressPercent,
          answers,
          lastUpdated: new Date().toISOString()
        };
      }
      return s;
    });

    saveStudentsToDB(updated);
  };

  // Filter students
  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = student.name.toLowerCase().includes(query) || student.nis.includes(query);
    const matchesJurusan = jurusanFilter === 'All' || student.answers.q11 === jurusanFilter;
    const matchesStatus = statusFilter === 'All' || student.progress === statusFilter;
    return matchesSearch && matchesJurusan && matchesStatus;
  });

  // Stats
  const totalStudentsCount = students.length;
  const completedCount = students.filter(s => s.progress === 'completed').length;
  const inProgressCount = students.filter(s => s.progress === 'in_progress').length;
  const notStartedCount = students.filter(s => s.progress === 'not_started').length;

  const completedPercent = totalStudentsCount > 0 ? Math.round((completedCount / totalStudentsCount) * 100) : 0;
  const inProgressPercent = totalStudentsCount > 0 ? Math.round((inProgressCount / totalStudentsCount) * 100) : 0;
  const notStartedPercent = totalStudentsCount > 0 ? Math.round((notStartedCount / totalStudentsCount) * 100) : 0;

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // If student is logged in
  if (selectedStudent) {
    return (
      <StudentForm
        student={selectedStudent}
        onSave={handleSaveStudentAnswers}
        onClose={() => setSelectedStudent(null)}
      />
    );
  }

  // ============================================================
  // 5. RETURN / RENDER JSX
  // ============================================================
  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#33332D] font-sans antialiased">
      {/* HEADER */}
      <header className="relative overflow-hidden bg-[#5A5A40] text-white border-b border-[#4A4A35] shadow-sm">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                  Masa Pengenalan Lingkungan Sekolah (MPLS) 2026
                </div>

                {googleSheetsUrl && googleSheetsUrl.trim().startsWith('http') && (
                  <div className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                    isAutoSyncing 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                      : autoSyncStatus === 'success'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      : autoSyncStatus === 'error'
                      ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                      : 'bg-white/5 border-white/10 text-[#E5E5D8]'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isAutoSyncing 
                        ? 'bg-amber-400 animate-ping'
                        : autoSyncStatus === 'success'
                        ? 'bg-emerald-400'
                        : autoSyncStatus === 'error'
                        ? 'bg-rose-400'
                        : 'bg-emerald-500'
                    }`} />
                    <span>
                      {isAutoSyncing 
                        ? 'Auto-Syncing...' 
                        : autoSyncStatus === 'success'
                        ? 'Auto-Sync Berhasil' 
                        : autoSyncStatus === 'error'
                        ? 'Auto-Sync Gagal' 
                        : 'Google Sheets Aktif'}
                    </span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-[#FDFCF8] tracking-tight">
                Aplikasi Pendataan & Manajemen Talenta
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#E5E5D8]">
                <span className="flex items-center gap-1.5 font-semibold text-[#FDFCF8]">
                  <span className="w-2 h-2 rounded-full bg-[#D6D6C2]"></span>
                  SMK Negeri 1 Nglegok Blitar
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#E5E5D8]" /> Blitar, Jawa Timur</span>
                <span>&bull;</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-[#E5E5D8]" /> TA. 2026 / 2027</span>
              </div>
            </div>

            <div className="flex items-center justify-center bg-white rounded-2xl p-2 shadow-md border border-[#D6D6C2] h-20 w-20 shrink-0">
              <img 
                src={logoBase64 || logoImg} 
                alt="Logo SMKN 1 Nglegok" 
                className="h-full w-full object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-[#D6D6C2] rounded-2xl p-6 flex flex-col justify-between hover:border-[#8A8A70] hover:shadow-md transition-all duration-300 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#8A8A70] tracking-wider uppercase font-mono">Siswa Baru Terdaftar</span>
                <span className="bg-[#F5F5F0] text-[#5A5A40] border border-[#D6D6C2] px-2 py-0.5 rounded text-[10px] font-bold">Roster Aktif</span>
              </div>
              <div>
                <p className="text-4xl font-serif font-extrabold text-[#33332D] tracking-tight">{totalStudentsCount}</p>
                <p className="text-xs text-[#8A8A70] mt-1">Total siswa yang diterima masuk di SMKN 1 Nglegok.</p>
              </div>
              <div className="border-t border-[#F0F0E6] mt-4 pt-3 flex items-center justify-between text-[11px] text-[#8A8A70]">
                <span>Daftar pendaftaran dibuka</span>
                <span className="text-[#5A5A40] font-semibold">Tutup 20 Juli 2026</span>
              </div>
            </div>

            <div className="bg-white border border-[#D6D6C2] rounded-2xl p-6 flex flex-col justify-between hover:border-[#8A8A70] hover:shadow-md transition-all duration-300 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#8A8A70] tracking-wider uppercase font-mono">Sudah Selesai Mengisi</span>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold">Lengkap 100%</span>
              </div>
              <div>
                <p className="text-4xl font-serif font-extrabold text-emerald-700 tracking-tight">
                  {completedCount} <span className="text-sm font-medium text-[#8A8A70]">({completedPercent}%)</span>
                </p>
                <p className="text-xs text-[#8A8A70] mt-1">Siswa yang telah melengkapi seluruh 166 pertanyaan.</p>
              </div>
              <div className="w-full bg-[#E5E5D8] rounded-full h-1.5 mt-4">
                <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${completedPercent}%` }}></div>
              </div>
            </div>

            <div className="bg-white border border-[#D6D6C2] rounded-2xl p-6 flex flex-col justify-between hover:border-[#8A8A70] hover:shadow-md transition-all duration-300 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#8A8A70] tracking-wider uppercase font-mono">Proses Mengisi</span>
                <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">Draft Tersimpan</span>
              </div>
              <div>
                <p className="text-4xl font-serif font-extrabold text-amber-600 tracking-tight">
                  {inProgressCount} <span className="text-sm font-medium text-[#8A8A70]">({inProgressPercent}%)</span>
                </p>
                <p className="text-xs text-[#8A8A70] mt-1">Siswa yang sudah mulai login & mengisi sebagian.</p>
              </div>
              <div className="w-full bg-[#E5E5D8] rounded-full h-1.5 mt-4">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${inProgressPercent}%` }}></div>
              </div>
            </div>

            <div className="bg-white border border-[#D6D6C2] rounded-2xl p-6 flex flex-col justify-between hover:border-[#8A8A70] hover:shadow-md transition-all duration-300 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#8A8A70] tracking-wider uppercase font-mono">Belum Mengisi</span>
                <span className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold">Menunggu</span>
              </div>
              <div>
                <p className="text-4xl font-serif font-extrabold text-red-600 tracking-tight">
                  {notStartedCount} <span className="text-sm font-medium text-[#8A8A70]">({notStartedPercent}%)</span>
                </p>
                <p className="text-xs text-[#8A8A70] mt-1">Siswa yang sama sekali belum mengisi.</p>
              </div>
              <div className="w-full bg-[#E5E5D8] rounded-full h-1.5 mt-4">
                <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${notStartedPercent}%` }}></div>
              </div>
            </div>
          </div>

          {/* Doughnut Chart */}
          <div className="lg:col-span-4 bg-white border border-[#D6D6C2] rounded-2xl p-6 flex flex-col justify-between shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-[#33332D] tracking-tight">Presentase Partisipasi Siswa</h3>
              <p className="text-[11px] text-[#8A8A70] mt-0.5">Distribusi status pengisian kuesioner MPLS.</p>
            </div>

            <div className="my-6 flex items-center justify-center relative">
              {totalStudentsCount === 0 ? (
                <p className="text-xs text-[#8A8A70]">Tidak ada data untuk grafik</p>
              ) : (
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E5E5D8" strokeWidth="10" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#16a34a" strokeWidth="10" strokeDasharray={`${completedPercent * 2.51} 251`} strokeDashoffset="0" />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#d97706" strokeWidth="10" strokeDasharray={`${inProgressPercent * 2.51} 251`} strokeDashoffset={`-${completedPercent * 2.51}`} />
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#dc2626" strokeWidth="10" strokeDasharray={`${notStartedPercent * 2.51} 251`} strokeDashoffset={`-${(completedPercent + inProgressPercent) * 2.51}`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-serif font-black text-[#33332D]">{completedPercent}%</span>
                    <span className="text-[9px] font-bold text-[#5A5A40] uppercase tracking-widest font-mono">SELESAI</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#33332D]">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#16a34a] inline-block"></span> Sudah Selesai</span>
                <span className="font-mono font-bold text-[#8A8A70]">{completedCount} Siswa ({completedPercent}%)</span>
              </div>
              <div className="flex items-center justify-between text-[#33332D]">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#d97706] inline-block"></span> Proses Mengisi</span>
                <span className="font-mono font-bold text-[#8A8A70]">{inProgressCount} Siswa ({inProgressPercent}%)</span>
              </div>
              <div className="flex items-center justify-between text-[#33332D]">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded bg-[#dc2626] inline-block"></span> Belum Mengisi</span>
                <span className="font-mono font-bold text-[#8A8A70]">{notStartedCount} Siswa ({notStartedPercent}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* GOOGLE SHEETS INTEGRATION PANEL */}
        {isDevUnlocked && showSyncPanel && (
          <div className="bg-white border border-[#D6D6C2] rounded-2xl p-6 shadow-xs grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#5A5A40] font-bold text-sm">
                  <FileSpreadsheet className="w-5 h-5 text-[#5A5A40]" />
                  <span>Modul Integrasi Google Sheets</span>
                </div>
                <button
                  onClick={() => setIsDevUnlocked(false)}
                  className="text-[10px] text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1 font-bold"
                >
                  <Lock className="w-2.5 h-2.5" /> Kunci
                </button>
              </div>
              <h4 className="text-base font-extrabold text-[#33332D]">Sinkronisasi & Konfigurasi Lembar Data</h4>
              <p className="text-xs text-[#8A8A70] leading-relaxed">
                Koneksikan langsung data kuesioner 166 kolom siswa baru dengan Spreadsheet sekolah Anda.
              </p>

              <div className="space-y-1.5 bg-[#FDFCF8] p-3 rounded-xl border border-[#D6D6C2]/60">
                <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider font-mono">
                  URL Web App Google Apps Script:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={googleSheetsUrlInput}
                    onChange={(e) => setGoogleSheetsUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 min-w-0 bg-white border border-[#D6D6C2] rounded-lg px-3 py-1.5 text-xs text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40] font-mono"
                  />
                  <button
                    onClick={() => handleSaveSheetsUrl()}
                    className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shadow-xs ${
                      urlSavedSuccess 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : 'bg-[#5A5A40] hover:bg-[#4A4A35]'
                    }`}
                  >
                    {urlSavedSuccess ? 'Tersimpan ✓' : 'Simpan URL'}
                  </button>
                </div>
              </div>

              {/* CHANGE CREDENTIALS FORM */}
              <div className="border border-[#D6D6C2]/60 rounded-xl overflow-hidden bg-[#FDFCF8] text-left">
                <button
                  type="button"
                  onClick={() => setShowChangeCredsForm(!showChangeCredsForm)}
                  className="w-full px-3 py-2.5 text-xs font-bold text-[#5A5A40] hover:text-[#33332D] flex items-center justify-between transition-colors bg-[#F5F5F0]/50 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#5A5A40]" />
                    Pengaturan Kredensial Developer
                  </span>
                  <span className="text-[10px] bg-white border border-[#D6D6C2] px-1.5 py-0.5 rounded text-[#8A8A70]">
                    {showChangeCredsForm ? 'Sembunyikan' : 'Buka'}
                  </span>
                </button>
                
                {showChangeCredsForm && (
                  <form onSubmit={handleUpdateDevCredentials} className="p-3.5 space-y-3 border-t border-[#D6D6C2]/40 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] text-[#8A8A70] leading-relaxed">
                        Perbarui email dan password kustom Anda yang tersimpan di Google Sheets.
                      </p>
                      <button
                        type="button"
                        onClick={checkCurrentCredentials}
                        className="text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Cek Kredensial
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#5A5A40] uppercase tracking-wider font-mono">
                          Email Lama:
                        </label>
                        <input
                          type="email"
                          value={devCurrentEmail}
                          onChange={(e) => setDevCurrentEmail(e.target.value)}
                          placeholder="admin@smk.id"
                          className="w-full bg-white border border-[#D6D6C2] rounded-lg px-2.5 py-1.5 text-[11px] text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#5A5A40] uppercase tracking-wider font-mono">
                          Password Lama:
                        </label>
                        <input
                          type="password"
                          value={devCurrentPassword}
                          onChange={(e) => setDevCurrentPassword(e.target.value)}
                          placeholder="••••••"
                          className="w-full bg-white border border-[#D6D6C2] rounded-lg px-2.5 py-1.5 text-[11px] text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#5A5A40] uppercase tracking-wider font-mono">
                          Email Baru:
                        </label>
                        <input
                          type="email"
                          value={devNewEmail}
                          onChange={(e) => setDevNewEmail(e.target.value)}
                          placeholder="email.baru@smk.id"
                          className="w-full bg-white border border-[#D6D6C2] rounded-lg px-2.5 py-1.5 text-[11px] text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#5A5A40] uppercase tracking-wider font-mono">
                          Password Baru:
                        </label>
                        <input
                          type="password"
                          value={devNewPassword}
                          onChange={(e) => setDevNewPassword(e.target.value)}
                          placeholder="Min. 6 karakter"
                          className="w-full bg-white border border-[#D6D6C2] rounded-lg px-2.5 py-1.5 text-[11px] text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                        />
                      </div>
                    </div>

                    {/* 🔥 PERINGATAN PASSWORD DEFAULT */}
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[10px] text-amber-800">
                      <strong>⚠️ PERHATIAN!</strong> Password default (admin123) SUDAH TIDAK BERLAKU.<br />
                      Gunakan email dan password yang tersimpan di sheet <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">developer</code> Google Sheets Anda.
                    </div>

                    {devCredsError && (
                      <div className="text-[10px] font-semibold text-rose-600 flex items-center gap-1 bg-rose-50 border border-rose-100 p-2 rounded-lg whitespace-pre-wrap">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{devCredsError}</span>
                      </div>
                    )}

                    {devCredsSuccess && (
                      <div className="text-[10px] font-semibold text-emerald-800 flex items-center gap-1 bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{devCredsSuccess}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isUpdatingDevCreds}
                      className="w-full bg-[#5A5A40] hover:bg-[#4A4A35] disabled:bg-[#8A8A70] text-white py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      {isUpdatingDevCreds ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        'Simpan Perubahan Kredensial'
                      )}
                    </button>
                  </form>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleSyncSheets}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 bg-[#5A5A40] hover:bg-[#4A4A35] disabled:bg-[#E5E5D8] text-white disabled:text-[#8A8A70] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Sinkronisasi...' : 'Sinkronkan Google Sheets'}
                </button>
                <button
                  onClick={handlePullSheets}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-[#E5E5D8] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Download className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Menarik data...' : 'Tarik Data dari Sheets'}
                </button>
                <button
                  onClick={() => {
                    resetAllFilters();
                    handlePullSheets();
                  }}
                  className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh & Reset
                </button>
                <button
                  onClick={() => setShowCodeModal(true)}
                  className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-3 py-2 rounded-lg text-xs font-bold text-[#5A5A40] transition-colors cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#5A5A40]" />
                  Kode Apps Script
                </button>
                <button
                  onClick={() => exportToCSV(students)}
                  className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-3 py-2 rounded-lg text-xs font-bold text-[#5A5A40] transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#5A5A40]" />
                  Unduh CSV
                </button>
              </div>
            </div>

            {/* Sync logs */}
            <div className="lg:col-span-7 bg-[#F5F5F0] border border-[#D6D6C2] rounded-xl p-4 h-44 overflow-y-auto font-mono text-[10px] text-[#5A5A40] space-y-1 scrollbar-thin">
              <div className="flex items-center justify-between border-b border-[#D6D6C2] pb-1.5 mb-2 text-[#8A8A70] font-sans">
                <span className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Konsol Sinkronisasi</span>
                <span className={isAutoSyncing ? 'text-amber-600 font-bold' : autoSyncStatus === 'success' ? 'text-emerald-600 font-bold' : autoSyncStatus === 'error' ? 'text-rose-600 font-bold' : ''}>
                  {isAutoSyncing ? 'SYNCING...' : autoSyncStatus === 'success' ? 'BERHASIL' : autoSyncStatus === 'error' ? 'GAGAL' : 'SIAP'}
                </span>
              </div>
              {syncLogs.length === 0 ? (
                <div className="text-[#8A8A70] h-28 flex flex-col items-center justify-center gap-1">
                  <Clock className="w-5 h-5 opacity-40" />
                  <p>Menunggu aktivitas sinkronisasi...</p>
                </div>
              ) : (
                syncLogs.map((log, i) => (
                  <div key={i} className="animate-fade-in leading-relaxed">{log}</div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TABLE */}
        <div className="bg-white border border-[#D6D6C2] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-6 border-b border-[#E0E0D6] flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-bold text-[#33332D]">Daftar Penerimaan Roster Siswa Baru</h3>
                <p className="text-xs text-[#8A8A70] mt-0.5">Pilih nama siswa pada tabel di bawah untuk mulai mengisi data pendaftaran.</p>
              </div>
              
              <div className="flex gap-2">
                {isDevUnlocked ? (
                  <button
                    onClick={() => setIsDevUnlocked(false)}
                    className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Unlock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    Kunci Developer
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setInputDevPassword('');
                      setDevPasswordError('');
                      setShowDevPrompt(true);
                    }}
                    className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-3 py-1.5 rounded-lg text-xs font-bold text-[#5A5A40] transition-colors cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#8A8A70]" />
                    Buka Developer
                  </button>
                )}
                {isDevUnlocked && (
                  <>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-3 py-1.5 rounded-lg text-xs font-bold text-[#5A5A40] transition-colors cursor-pointer shadow-xs animate-fade-in"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Tambah Siswa
                    </button>
                    <button
                      onClick={handleResetDatabase}
                      className="p-1.5 text-rose-700 hover:text-rose-800 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer shadow-xs animate-fade-in"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* FILTER CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Search input */}
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#8A8A70]" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan Nama atau Nomor NIS..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg pl-9 pr-4 py-2 text-xs text-[#33332D] placeholder-[#8A8A70] focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40]"
                />
              </div>

              {/* Jurusan Filter */}
              <div>
                <select
                  value={jurusanFilter}
                  onChange={(e) => {
                    setJurusanFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg px-3 py-2 text-xs text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                >
                  <option value="All">Semua Program Keahlian (Jurusan)</option>
                  <option value="TKR">TKR (Teknik Kendaraan Ringan)</option>
                  <option value="TSM">TSM (Teknik Sepeda Motor)</option>
                  <option value="TEI">TEI (Teknik Elektronika Industri)</option>
                  <option value="TKJ">TKJ (Teknik Komputer Jaringan)</option>
                  <option value="TB">TB (Tata Boga)</option>
                  <option value="BDP">BDP (Bisnis Daring Pemasaran)</option>
                  <option value="AKL">AKL (Akuntansi)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg px-3 py-2 text-xs text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                >
                  <option value="All">Semua Status Progress</option>
                  <option value="completed">Sudah Selesai (Hijau)</option>
                  <option value="in_progress">Proses Mengisi (Kuning)</option>
                  <option value="not_started">Belum Mengisi (Merah)</option>
                </select>
              </div>

              {/* TOMBOL RESET FILTER */}
              <div>
                <button
                  onClick={resetAllFilters}
                  className="w-full bg-[#F5F5F0] hover:bg-[#E5E5D8] border border-[#D6D6C2] px-3 py-2 rounded-lg text-xs font-bold text-[#5A5A40] transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Filter
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-[#8A8A70]">
                <AlertCircle className="w-8 h-8 text-[#8A8A70] mx-auto mb-2" />
                <p className="text-sm font-semibold">Tidak ada siswa yang cocok dengan kriteria pencarian</p>
                <p className="text-xs text-[#8A8A70] mt-1">Coba periksa kata kunci atau ubah filter dropdown Anda.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F5F0] text-[#8A8A70] text-[11px] font-bold tracking-wider uppercase border-b border-[#E0E0D6]">
                    <th className="py-4 px-6">No</th>
                    {isDevUnlocked && <th className="py-4 px-6">Nomor NIS</th>}
                    <th className="py-4 px-6">Nama Lengkap Siswa</th>
                    <th className="py-4 px-6">Keahlian (Jurusan)</th>
                    <th className="py-4 px-6">Progres Pengisian</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Terakhir Pembaruan</th>
                    <th className="py-4 px-6 text-right">Aksi Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0E6] text-xs">
                  {paginatedStudents.map((student, index) => {
                    const rowNum = (currentPage - 1) * pageSize + index + 1;
                    
                    let statusBadge = (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-full text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                        Belum Mengisi
                      </span>
                    );
                    if (student.progress === 'completed') {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1.5 bg-[#EEF9F1] border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Sudah Selesai
                        </span>
                      );
                    } else if (student.progress === 'in_progress') {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1.5 bg-[#FFFBEB] border border-amber-200 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Proses Mengisi
                        </span>
                      );
                    }

                    return (
                      <tr 
                        key={student.id}
                        className="hover:bg-[#FDFCF8] border-b border-[#F5F5F0] transition-colors group cursor-pointer text-[#33332D]"
                        onClick={() => setLoginStudent(student)}
                      >
                        <td className="py-4 px-6 text-[#8A8A70] font-mono font-semibold">{rowNum}</td>
                        {isDevUnlocked && <td className="py-4 px-6 font-mono font-bold text-[#5A5A40]">{student.nis}</td>}
                        <td className="py-4 px-6 font-bold text-[#33332D] group-hover:text-[#5A5A40] transition-colors">
                          {student.name}
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-[#F5F5F0] text-[#5A5A40] border border-[#D6D6C2] px-2.5 py-1 rounded font-semibold text-[10px]">
                            {student.answers.q11 || 'Belum Dipilih'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-[#8A8A70] font-medium">Lengkap</span>
                              <span className="font-bold text-[#33332D]">{student.progressPercent}%</span>
                            </div>
                            <div className="w-28 bg-[#E5E5D8] rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full transition-all ${
                                  student.progress === 'completed' 
                                    ? 'bg-emerald-600' 
                                    : student.progress === 'in_progress' 
                                      ? 'bg-amber-500' 
                                      : 'bg-red-500'
                                }`}
                                style={{ width: `${student.progressPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">{statusBadge}</td>
                        <td className="py-4 px-6 text-[#8A8A70]">
                          {student.lastUpdated ? new Date(student.lastUpdated).toLocaleString('id-ID') : '-'}
                        </td>
                        <td className="py-4 px-6 text-right flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setLoginStudent(student)}
                            className="inline-flex items-center gap-1 bg-[#5A5A40] hover:bg-[#4A4A35] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            Isi
                          </button>
                          {isDevUnlocked && (
                            <button
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="p-6 border-t border-[#E0E0D6] bg-[#F5F5F0] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#8A8A70]">
            <div className="flex items-center gap-3">
              <span>Data per halaman:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[#F9F9F5] border border-[#D6D6C2] rounded px-2.5 py-1 text-xs text-[#33332D] focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={500}>500</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span>
                Menampilkan <strong>{Math.min(filteredStudents.length, (currentPage - 1) * pageSize + 1)}</strong> - <strong>{Math.min(filteredStudents.length, currentPage * pageSize)}</strong> dari <strong>{filteredStudents.length}</strong>
              </span>

              <div className="flex gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="p-1.5 bg-white border border-[#D6D6C2] hover:bg-[#F5F5F0] rounded-lg text-[#33332D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-1.5 bg-white border border-[#D6D6C2] hover:bg-[#F5F5F0] rounded-lg text-[#33332D] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#E0E0D6] py-6 mt-12 bg-[#F5F5F0]">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-[#8A8A70] space-y-2">
          <p>&copy; 2026 Tim BK & IT SMKN 1 Nglegok Blitar.</p>
          <p className="text-[10px] font-mono opacity-60">Powered by React 19 + Google Sheets API</p>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {loginStudent && (
        <div className="fixed inset-0 z-50 bg-[#33332D]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#D6D6C2] rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl animate-fade-in relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#5A5A40]/5 rounded-full blur-2xl"></div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F0] border border-[#D6D6C2] flex items-center justify-center text-[#5A5A40] mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-[#5A5A40] tracking-widest uppercase font-mono">Verifikasi Akses</span>
              <h3 className="text-lg font-black text-[#33332D] tracking-tight">Login Portal Siswa</h3>
              <p className="text-xs text-[#8A8A70]">Masukkan NIS Anda untuk verifikasi identitas.</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-xl p-4 border border-[#E0E0D6] space-y-1">
              <p className="text-[10px] font-bold text-[#8A8A70] uppercase tracking-wide">Biodata</p>
              <p className="text-sm font-extrabold text-[#33332D] leading-snug">{loginStudent.name}</p>
              <div className="flex items-center gap-3 text-[11px] text-[#5A5A40] mt-1">
                <span className="font-mono">NIS: {loginStudent.nis}</span>
                <span>&bull;</span>
                <span>Jurusan: {loginStudent.answers.q11 || 'Belum Dipilih'}</span>
              </div>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#33332D]">Masukkan NIS (Password):</label>
                <input
                  type="password"
                  required
                  placeholder="Ketik NIS Anda..."
                  value={nisPassword}
                  onChange={(e) => {
                    setNisPassword(e.target.value);
                    setLoginError(null);
                  }}
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg px-4 py-2.5 text-sm text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                />
                {loginError && (
                  <div className="flex items-center gap-1 text-xs text-red-600 font-semibold mt-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginStudent(null);
                    setNisPassword('');
                    setLoginError(null);
                  }}
                  className="flex-1 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-4 py-2.5 rounded-lg text-xs font-bold text-[#5A5A40] transition-colors cursor-pointer text-center shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#5A5A40] hover:bg-[#4A4A35] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
                >
                  Masuk & Isi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#33332D]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#D6D6C2] rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl relative">
            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-[#33332D]">Tambah Siswa Baru</h3>
              <p className="text-xs text-[#8A8A70]">Input nama dan NIS siswa baru.</p>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#33332D]">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  placeholder="AHMAD ADI WIJAYA"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value.toUpperCase())}
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg px-4 py-2.5 text-sm text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#33332D]">NIS:</label>
                <input
                  type="text"
                  required
                  placeholder="20261020"
                  value={newStudentNis}
                  onChange={(e) => setNewStudentNis(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg px-4 py-2.5 text-sm text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#33332D]">Jurusan:</label>
                <select
                  value={newStudentJurusan}
                  onChange={(e) => setNewStudentJurusan(e.target.value)}
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg px-3 py-2 text-xs text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40]"
                >
                  <option value="TKR">TKR</option>
                  <option value="TSM">TSM</option>
                  <option value="TEI">TEI</option>
                  <option value="TKJ">TKJ</option>
                  <option value="TB">TB</option>
                  <option value="BDP">BDP</option>
                  <option value="AKL">AKL</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewStudentName('');
                    setNewStudentNis('');
                  }}
                  className="flex-1 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-4 py-2.5 rounded-lg text-xs font-bold text-[#5A5A40] transition-colors cursor-pointer text-center shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#5A5A40] hover:bg-[#4A4A35] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* DEVELOPER MODAL - DENGAN PERINGATAN PASSWORD DEFAULT */}
      {/* ========================================================== */}
      {showDevPrompt && (
        <div className="fixed inset-0 z-50 bg-[#33332D]/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#D6D6C2] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => {
                setShowDevPrompt(false);
                setInputDevPassword('');
                setDevPasswordError('');
              }}
              disabled={isVerifyingDev}
              className="absolute top-4 right-4 text-[#8A8A70] hover:text-[#33332D] font-bold text-sm bg-[#F5F5F0] hover:bg-[#E5E5D8] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>

            <div className="space-y-1 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-[#FDFCF8] text-[#5A5A40] flex items-center justify-center mb-2 border border-[#D6D6C2]">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-black text-[#33332D] tracking-tight">
                Verifikasi Akses Developer
              </h3>
              <p className="text-xs text-[#8A8A70]">
                Masukkan email dan password untuk mengaktifkan Modul Integrasi.
              </p>
            </div>

            {/* 🔥 PERINGATAN PASSWORD DEFAULT */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 leading-relaxed">
              <strong>⚠️ PERHATIAN!</strong> Password default (admin123) SUDAH TIDAK BERLAKU.<br />
              Gunakan email dan password yang tersimpan di sheet <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">developer</code> Google Sheets Anda.
            </div>

            <form onSubmit={handleDevUnlockSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider font-mono">
                  Email Developer:
                </label>
                <input
                  type="email"
                  value={inputDevEmail}
                  onChange={(e) => setInputDevEmail(e.target.value)}
                  placeholder="Masukkan email dari sheet developer"
                  disabled={isVerifyingDev}
                  autoFocus
                  className="w-full bg-[#FDFCF8] border border-[#D6D6C2] rounded-lg px-4 py-2.5 text-sm text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40] disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider font-mono">
                  Password Developer:
                </label>
                <input
                  type="password"
                  value={inputDevPassword}
                  onChange={(e) => setInputDevPassword(e.target.value)}
                  placeholder="Masukkan password dari sheet developer"
                  disabled={isVerifyingDev}
                  className="w-full bg-[#FDFCF8] border border-[#D6D6C2] rounded-lg px-4 py-2.5 text-sm text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#5A5A40] disabled:opacity-60"
                />
                {devPasswordError && (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {devPasswordError}
                  </p>
                )}
              </div>

              <div className="bg-[#F5F5F0] border border-[#D6D6C2] rounded-lg p-3 text-[11px] text-[#5A5A40] leading-relaxed">
                <strong>🔒 Informasi:</strong> Hanya data di sheet <code className="bg-[#E5E5D8] px-1 py-0.5 rounded font-mono font-bold">developer</code> yang berlaku. Password default (admin123) SUDAH TIDAK BERLAKU!
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDevPrompt(false);
                    setInputDevPassword('');
                    setDevPasswordError('');
                  }}
                  disabled={isVerifyingDev}
                  className="flex-1 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-4 py-2.5 rounded-lg text-xs font-bold text-[#5A5A40] transition-colors cursor-pointer text-center disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingDev}
                  className="flex-1 bg-[#5A5A40] hover:bg-[#4A4A35] disabled:bg-[#8A8A70] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  {isVerifyingDev ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Verifikasi...
                    </>
                  ) : (
                    'Buka Kunci'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CODE MODAL */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-[#33332D]/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-[#D6D6C2] rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setShowCodeModal(false)}
              className="absolute top-4 right-4 text-[#8A8A70] hover:text-[#33332D] font-bold text-sm bg-[#F5F5F0] hover:bg-[#E5E5D8] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>

            <div className="space-y-1">
              <span className="text-[10px] bg-[#EEF9F1] text-emerald-800 border border-emerald-100 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                Integrasi Google Sheets
              </span>
              <h3 className="text-xl font-serif font-black text-[#33332D] tracking-tight">
                Kode Google Apps Script
              </h3>
              <p className="text-xs text-[#8A8A70]">
                Copy-paste kode di bawah ke editor Google Apps Script Anda.
              </p>
            </div>

            <div className="space-y-3 text-xs text-[#5A5A40] bg-[#FDFCF8] p-4 rounded-xl border border-[#D6D6C2]/60 leading-relaxed">
              <p className="font-bold text-[#33332D] mb-1">Panduan:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Buka Google Sheets → Extensions → Apps Script</li>
                <li>Hapus kode bawaan, tempel kode di bawah</li>
                <li>Klik Save → Deploy → New Deployment</li>
                <li>Pilih Web App, set "Anyone"</li>
                <li>Copy URL yang dihasilkan</li>
              </ol>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#33332D]">Kode Apps Script:</span>
                <button
                  onClick={() => {
                    const codeText = `function doGet(e) {
  if (e && e.parameter && e.parameter.action === "fetchStudents") {
    var fakePayload = { action: "fetchStudents" };
    var postData = {
      postData: {
        contents: JSON.stringify(fakePayload)
      }
    };
    return doPost(postData);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "success",
      message: "Google Apps Script Web App is running!"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    var jsonString = e.postData.contents;
    var payload = JSON.parse(jsonString);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var devSheet = ss.getSheetByName("developer") || ss.getSheetByName("Developer") || ss.getSheetByName("DEVELOPER");
    if (!devSheet) {
      devSheet = ss.insertSheet("developer");
      devSheet.getRange(1, 1).setValue("Email");
      devSheet.getRange(1, 2).setValue("Password");
      devSheet.getRange(1, 3).setValue("Keterangan");
      devSheet.getRange(2, 1).setValue("admin@smk.id");
      devSheet.getRange(2, 2).setValue("admin123");
      devSheet.getRange(2, 3).setValue("⚠️ Ubah cell A2 dan B2 untuk mengganti akun login developer. Password default TIDAK BERLAKU lagi!");
    }
    
    var storedEmail = String(devSheet.getRange(2, 1).getValue()).trim().toLowerCase();
    var storedPassword = String(devSheet.getRange(2, 2).getValue()).trim();
    
    if (!storedEmail || storedEmail === "undefined" || storedEmail === "") {
      storedEmail = "admin@smk.id";
    }
    if (!storedPassword || storedPassword === "undefined" || storedPassword === "") {
      storedPassword = "admin123";
    }
    
    if (payload.action === "verifyDeveloper") {
      var inputEmail = String(payload.email || "").trim().toLowerCase();
      var inputPassword = String(payload.password || "").trim();
      
      var isVerified = (inputEmail === storedEmail && inputPassword === storedPassword);
      
      Logger.log("🔍 Verifikasi Developer:");
      Logger.log("Input Email: " + inputEmail);
      Logger.log("Input Password: " + inputPassword);
      Logger.log("Stored Email: " + storedEmail);
      Logger.log("Stored Password: " + storedPassword);
      Logger.log("Is Verified: " + isVerified);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          verified: isVerified,
          message: isVerified ? "Akses developer berhasil diverifikasi." : "Email atau Password developer salah. Password default TIDAK BERLAKU!"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.action === "updateDeveloper") {
      var currentEmailInput = String(payload.currentEmail || "").trim().toLowerCase();
      var currentPasswordInput = String(payload.currentPassword || "").trim();
      var newEmailInput = String(payload.newEmail || "").trim().toLowerCase();
      var newPasswordInput = String(payload.newPassword || "").trim();
      
      Logger.log("📥 Data diterima untuk update:");
      Logger.log("Current Email: " + currentEmailInput);
      Logger.log("Current Password: " + currentPasswordInput);
      Logger.log("Stored Email: " + storedEmail);
      Logger.log("Stored Password: " + storedPassword);
      
      var emailMatch = (currentEmailInput === storedEmail);
      var passwordMatch = (currentPasswordInput === storedPassword);
      Logger.log("Email Match: " + emailMatch);
      Logger.log("Password Match: " + passwordMatch);
      
      if (!emailMatch || !passwordMatch) {
        Logger.log("❌ Kredensial tidak cocok!");
        return ContentService
          .createTextOutput(JSON.stringify({
            status: "error",
            message: "Kredensial lama tidak cocok! Gagal memperbarui.",
            debug: {
              emailMatch: emailMatch,
              passwordMatch: passwordMatch,
              storedEmail: storedEmail,
              storedPassword: storedPassword,
              inputEmail: currentEmailInput,
              inputPassword: currentPasswordInput
            }
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      devSheet.getRange(2, 1).setValue(newEmailInput);
      devSheet.getRange(2, 2).setValue(newPasswordInput);
      
      Logger.log("✅ Kredensial berhasil diperbarui!");
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          message: "Kredensial developer berhasil diperbarui!"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.action === "fetchStudents") {
      // ... kode fetchStudents sama seperti sebelumnya ...
    }
    
    var students = payload.students;
    if (!students || !Array.isArray(students)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "error",
          message: "Format data salah. Mengharapkan daftar 'students' atau 'action'."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ... kode sync students sama seperti sebelumnya ...
    
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: "Gagal memproses data: " + err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`;
                    navigator.clipboard.writeText(codeText);
                    alert('Kode Apps Script berhasil disalin ke clipboard Anda!');
                  }}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Salin Kode Apps Script
                </button>
              </div>

              <pre className="bg-[#1E1E1E] text-[#D4D4D4] p-4 rounded-xl font-mono text-[10px] overflow-x-auto max-h-60 leading-normal scrollbar-thin">
{`function doGet(e) {
  if (e && e.parameter && e.parameter.action === "fetchStudents") {
    var fakePayload = { action: "fetchStudents" };
    var postData = {
      postData: {
        contents: JSON.stringify(fakePayload)
      }
    };
    return doPost(postData);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "success",
      message: "Google Apps Script Web App is running!"
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(30000);
    
    var jsonString = e.postData.contents;
    var payload = JSON.parse(jsonString);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var devSheet = ss.getSheetByName("developer") || ss.getSheetByName("Developer") || ss.getSheetByName("DEVELOPER");
    if (!devSheet) {
      devSheet = ss.insertSheet("developer");
      devSheet.getRange(1, 1).setValue("Email");
      devSheet.getRange(1, 2).setValue("Password");
      devSheet.getRange(1, 3).setValue("Keterangan");
      devSheet.getRange(2, 1).setValue("admin@smk.id");
      devSheet.getRange(2, 2).setValue("admin123");
      devSheet.getRange(2, 3).setValue("⚠️ Ubah cell A2 dan B2 untuk mengganti akun login developer. Password default TIDAK BERLAKU lagi!");
    }
    
    var storedEmail = String(devSheet.getRange(2, 1).getValue()).trim().toLowerCase();
    var storedPassword = String(devSheet.getRange(2, 2).getValue()).trim();
    
    if (!storedEmail || storedEmail === "undefined" || storedEmail === "") {
      storedEmail = "admin@smk.id";
    }
    if (!storedPassword || storedPassword === "undefined" || storedPassword === "") {
      storedPassword = "admin123";
    }
    
    if (payload.action === "verifyDeveloper") {
      var inputEmail = String(payload.email || "").trim().toLowerCase();
      var inputPassword = String(payload.password || "").trim();
      
      var isVerified = (inputEmail === storedEmail && inputPassword === storedPassword);
      
      Logger.log("🔍 Verifikasi Developer:");
      Logger.log("Input Email: " + inputEmail);
      Logger.log("Input Password: " + inputPassword);
      Logger.log("Stored Email: " + storedEmail);
      Logger.log("Stored Password: " + storedPassword);
      Logger.log("Is Verified: " + isVerified);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          verified: isVerified,
          message: isVerified ? "Akses developer berhasil diverifikasi." : "Email atau Password developer salah. Password default TIDAK BERLAKU!"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.action === "updateDeveloper") {
      var currentEmailInput = String(payload.currentEmail || "").trim().toLowerCase();
      var currentPasswordInput = String(payload.currentPassword || "").trim();
      var newEmailInput = String(payload.newEmail || "").trim().toLowerCase();
      var newPasswordInput = String(payload.newPassword || "").trim();
      
      Logger.log("📥 Data diterima untuk update:");
      Logger.log("Current Email: " + currentEmailInput);
      Logger.log("Current Password: " + currentPasswordInput);
      Logger.log("Stored Email: " + storedEmail);
      Logger.log("Stored Password: " + storedPassword);
      
      var emailMatch = (currentEmailInput === storedEmail);
      var passwordMatch = (currentPasswordInput === storedPassword);
      Logger.log("Email Match: " + emailMatch);
      Logger.log("Password Match: " + passwordMatch);
      
      if (!emailMatch || !passwordMatch) {
        Logger.log("❌ Kredensial tidak cocok!");
        return ContentService
          .createTextOutput(JSON.stringify({
            status: "error",
            message: "Kredensial lama tidak cocok! Gagal memperbarui.",
            debug: {
              emailMatch: emailMatch,
              passwordMatch: passwordMatch,
              storedEmail: storedEmail,
              storedPassword: storedPassword,
              inputEmail: currentEmailInput,
              inputPassword: currentPasswordInput
            }
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      devSheet.getRange(2, 1).setValue(newEmailInput);
      devSheet.getRange(2, 2).setValue(newPasswordInput);
      
      Logger.log("✅ Kredensial berhasil diperbarui!");
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          message: "Kredensial developer berhasil diperbarui!"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ... kode fetchStudents dan sync students sama seperti sebelumnya ...
    
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: "Gagal memproses data: " + err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}