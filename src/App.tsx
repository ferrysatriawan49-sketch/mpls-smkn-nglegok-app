import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Student } from './types';
import { getQuestionsList } from './questionsData';
import { exportToCSV, calculateProgressPercent } from './utils';
import StudentForm from './components/StudentForm';
import { Slideshow } from './components/Slideshow';
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
  const [isLoading, setIsLoading] = useState(true);
  
  // 🔥 STATE UNTUK AUTO-UPDATE
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // 🔥 STATE UNTUK REFRESH OTOMATIS
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Login Gate State
  const [loginStudent, setLoginStudent] = useState<Student | null>(null);
  const [nisPassword, setNisPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sheets Syncing State
  const [googleSheetsUrl, setGoogleSheetsUrl] = useState(() => {
    const envUrl = process.env.REACT_APP_GOOGLE_SHEETS_URL;
    if (envUrl && envUrl.startsWith('http')) {
      return envUrl;
    }
    const localUrl = localStorage.getItem('mpls_google_sheets_url');
    if (localUrl && localUrl.startsWith('http')) {
      return localUrl;
    }
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
  // 2. REF UNTUK DEBOUNCE
  // ============================================================
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // ============================================================
  // 3. FUNGSI RESET FILTER GLOBAL
  // ============================================================
  const resetAllFilters = () => {
    setSearchQuery('');
    setJurusanFilter('All');
    setStatusFilter('All');
    setCurrentPage(1);
  };

  // ============================================================
  // 4. SEMUA useEffect
  // ============================================================
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

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
        const parsedData = JSON.parse(saved);
        if (parsedData && parsedData.length > 0) {
          setStudents(parsedData);
          console.log(`✅ ${parsedData.length} data siswa dimuat dari localStorage`);
        } else {
          setStudents([]);
        }
      } catch (e) {
        console.warn('⚠️ Gagal parse localStorage:', e);
        setStudents([]);
      }
    } else {
      setStudents([]);
    }
  }, []);

  // ============================================================
  // 🔥 AUTO-FETCH DATA DARI GOOGLE SHEETS
  // ============================================================
  useEffect(() => {
    const hasLoaded = localStorage.getItem('mpls_initial_load_done');
    
    if (hasLoaded === 'true') {
      console.log('ℹ️ Data sudah pernah dimuat, skip auto-fetch');
      setIsLoading(false);
      return;
    }

    const autoFetchData = async () => {
      console.log('🔄 Auto-fetch data dari Google Sheets...');
      setIsLoading(true);
      
      try {
        const url = googleSheetsUrl;
        if (!url || !url.startsWith('http')) {
          console.warn('⚠️ URL Google Sheets belum diset, skip auto-fetch');
          setIsLoading(false);
          return;
        }

        let response;
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'fetchStudents' })
          });
        } catch (postErr) {
          console.warn('⚠️ POST gagal, mencoba GET...');
          const getUrl = url.includes('?') 
            ? `${url}&action=fetchStudents` 
            : `${url}?action=fetchStudents`;
          response = await fetch(getUrl, { method: 'GET' });
        }

        if (!response || !response.ok) {
          throw new Error(`HTTP Error: ${response?.status || 'Unknown'}`);
        }

        const result = await response.json();
        
        if (result.status === 'success' && result.students && result.students.length > 0) {
          setStudents(result.students);
          localStorage.setItem('mpls_smkn_nglegok_students', JSON.stringify(result.students));
          localStorage.setItem('mpls_initial_load_done', 'true');
          console.log(`✅ Auto-fetch berhasil: ${result.students.length} data siswa dimuat`);
        } else {
          console.log('ℹ️ Tidak ada data di Google Sheets');
          setStudents([]);
          localStorage.setItem('mpls_initial_load_done', 'true');
        }
      } catch (err) {
        console.error('❌ Auto-fetch gagal:', err);
        setStudents([]);
        localStorage.setItem('mpls_initial_load_done', 'true');
      } finally {
        setIsLoading(false);
      }
    };

    autoFetchData();
  }, [googleSheetsUrl]);

  // ============================================================
  // 🔥 REFRESH OTOMATIS SETIAP 60 DETIK
  // ============================================================
  useEffect(() => {
    if (!selectedStudent && !loginStudent) {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      
      const interval = setInterval(() => {
        console.log('🔄 Refresh otomatis data dari Google Sheets...');
        if (!isAutoSyncing && !isSyncing) {
          refreshDataFromSheets();
        }
      }, 60000);
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [selectedStudent, loginStudent, isAutoSyncing, isSyncing]);

  // ============================================================
  // 5. SEMUA FUNGSI
  // ============================================================

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
  // 🔥 FUNGSI REFRESH DATA DARI SHEETS
  // ============================================================
  const refreshDataFromSheets = async () => {
    if (!googleSheetsUrl.trim()) {
      console.warn('⚠️ URL Google Sheets belum diset, skip refresh');
      return;
    }

    if (isRefreshing) {
      console.log('⏳ Refresh sedang berjalan, skip...');
      return;
    }

    setIsRefreshing(true);
    
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
      } catch (postErr) {
        const getUrl = googleSheetsUrl.includes('?') 
          ? `${googleSheetsUrl}&action=fetchStudents` 
          : `${googleSheetsUrl}?action=fetchStudents`;
        response = await fetch(getUrl, { method: 'GET' });
      }

      if (!response || !response.ok) {
        throw new Error(`HTTP Error: ${response?.status || 'Unknown'}`);
      }

      const result = await response.json();
      
      if (result.status === 'success' && result.students && result.students.length > 0) {
        const currentData = JSON.stringify(students);
        const newData = JSON.stringify(result.students);
        
        if (currentData !== newData) {
          console.log('🔄 Ada perubahan data, update...');
          setStudents(result.students);
          localStorage.setItem('mpls_smkn_nglegok_students', JSON.stringify(result.students));
          localStorage.setItem('mpls_initial_load_done', 'true');
        } else {
          console.log('ℹ️ Refresh: Tidak ada perubahan data');
        }
      } else {
        console.log('ℹ️ Refresh: Tidak ada data baru');
      }
    } catch (err) {
      console.error('❌ Refresh gagal:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // ============================================================
  // 🔥 HANDLE DEVELOPER LOGIN
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
          response = await fetch(getUrl, { 
            method: 'GET',
            mode: 'cors',
            headers: {
              'Accept': 'application/json'
            }
          });
        } catch (getErr) {
          console.warn('GET gagal, mencoba POST...');
          response = await fetch(googleSheetsUrl, {
            method: 'POST',
            mode: 'cors',
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
            setDevPasswordError('❌ Email atau Password salah! Gunakan data di sheet "developer".');
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
      setDevPasswordError('❌ URL Google Sheets belum diset!');
      setIsVerifyingDev(false);
      return;
    }
  };

  // ============================================================
  // 🔥 FUNGSI CEK KREDENSIAL
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

    log('🔍 Mengecek kredensial developer...');

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
      log('📋 Cek sheet "developer" di Google Sheets Anda.');
      alert('🔍 Periksa sheet "developer" di Google Sheets Anda:\nCell A2 = Email\nCell B2 = Password');
    } catch (err: any) {
      log(`❌ GAGAL: ${err.message || 'Koneksi ditolak'}`);
      alert('❌ Gagal terhubung ke Google Sheets. Periksa URL Web App Anda.');
    } finally {
      setIsSyncing(false);
    }
  };

  // ============================================================
  // 🔥 HANDLE UPDATE DEVELOPER CREDENTIALS
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
    
    if (!hasSheetsUrl) {
      setDevCredsError('❌ URL Google Sheets belum diset!');
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
        
        if (result && result.status === 'success') {
          setDevCredsSuccess('✅ Berhasil! Kredensial developer telah diperbarui.');
          setDevCurrentEmail('');
          setDevCurrentPassword('');
          setDevNewEmail('');
          setDevNewPassword('');
        } else {
          setDevCredsError(result.message || 'Gagal memperbarui kredensial.');
        }
      } else {
        throw new Error('Gagal menghubungi Google Sheets.');
      }
    } catch (err: any) {
      console.error(err);
      setDevCredsError('❌ Gagal memperbarui: ' + err.message);
    } finally {
      setIsUpdatingDevCreds(false);
    }
  };

  // ============================================================
  // 🔥 FUNGSI SYNC KE GOOGLE SHEETS
  // ============================================================
  const syncToGoogleSheets = useCallback(async (studentsToSync: Student[]) => {
    if (!googleSheetsUrl || !googleSheetsUrl.trim().startsWith('http')) {
      console.warn('⚠️ URL Google Sheets tidak valid, skip sync');
      return;
    }

    if (!studentsToSync || studentsToSync.length === 0) {
      console.warn('⚠️ Tidak ada data untuk disinkronkan');
      return;
    }

    setIsAutoSyncing(true);
    setAutoSyncStatus('syncing');
    setSaveStatus('saving');

    try {
      console.log(`🔄 Menyinkronkan ${studentsToSync.length} data siswa ke Google Sheets...`);
      
      const response = await fetch(googleSheetsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ students: studentsToSync })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.status === 'success' || result.status === 'ok') {
        console.log('✅ Sinkronisasi berhasil:', result.message);
        setAutoSyncStatus('success');
        setSaveStatus('success');
        setLastSaved(new Date());
        
        localStorage.setItem('mpls_smkn_nglegok_students', JSON.stringify(studentsToSync));
        
        setTimeout(() => {
          if (isMountedRef.current) {
            setAutoSyncStatus(prev => prev === 'success' ? 'idle' : prev);
            setSaveStatus('idle');
          }
        }, 2000);
      } else {
        throw new Error(result.message || 'Sinkronisasi gagal');
      }
    } catch (err) {
      console.error('❌ Sinkronisasi gagal:', err);
      setAutoSyncStatus('error');
      setSaveStatus('error');
      
      localStorage.setItem('mpls_smkn_nglegok_students', JSON.stringify(studentsToSync));
      console.log('💾 Data disimpan ke localStorage (fallback)');
      
      setTimeout(() => {
        if (isMountedRef.current) {
          setAutoSyncStatus('idle');
          setSaveStatus('idle');
        }
      }, 3000);
    } finally {
      setIsAutoSyncing(false);
    }
  }, [googleSheetsUrl]);

  // ============================================================
  // 🔥 SAVE STUDENTS TO DB (DENGAN FORCE SYNC)
  // ============================================================
  const saveStudentsToDB = useCallback((updatedStudents: Student[], forceSync: boolean = false) => {
    console.log('💾 Menyimpan data siswa:', updatedStudents.length, 'data, forceSync:', forceSync);
    
    setStudents(updatedStudents);
    localStorage.setItem('mpls_smkn_nglegok_students', JSON.stringify(updatedStudents));
    
    if (forceSync) {
      syncToGoogleSheets(updatedStudents);
    } else {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        syncToGoogleSheets(updatedStudents);
        syncTimeoutRef.current = null;
      }, 500);
    }
    
    setSaveStatus('saving');
    setIsSaving(true);
    
  }, [syncToGoogleSheets]);

  // ============================================================
  // 🔥 HANDLE PULL SHEETS
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

    log('Menghubungkan ke API Google Apps Script...');
    log('Mempersiapkan penarikan data siswa...');

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      log('Mengirim permintaan "fetchStudents"...');

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
        log(`✓ BERHASIL: Menemukan ${importedCount} data siswa.`);
        
        if (importedCount > 0) {
          setStudents(result.students);
          localStorage.setItem('mpls_smkn_nglegok_students', JSON.stringify(result.students));
          localStorage.setItem('mpls_initial_load_done', 'true');
          resetAllFilters();
          log(`✓ ${importedCount} data siswa berhasil dimuat!`);
          alert(`Berhasil menarik data! ${importedCount} data siswa dari Google Sheets telah diimpor.`);
        } else {
          log('⚠️ Google Sheets mengembalikan 0 baris siswa.');
          setStudents([]);
          localStorage.setItem('mpls_smkn_nglegok_students', JSON.stringify([]));
          alert('Berhasil terhubung ke Google Sheets, namun tidak ditemukan data siswa.');
        }
      } else {
        throw new Error(result.message || 'Gagal mengambil data siswa.');
      }
    } catch (err: any) {
      console.error('Gagal mengambil data:', err);
      log(`❌ GAGAL: ${err.message || 'Koneksi ditolak'}`);
      alert(`Gagal mengambil data siswa!\n\nError: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // ============================================================
  // 🔥 HANDLE SYNC SHEETS (MANUAL)
  // ============================================================
  const handleSyncSheets = async () => {
    if (!googleSheetsUrl.trim()) {
      alert('Masukkan URL Google Apps Script Web App terlebih dahulu!');
      return;
    }

    if (!students || students.length === 0) {
      alert('Tidak ada data siswa untuk disinkronkan!');
      return;
    }

    setIsSyncing(true);
    setSyncLogs([]);

    const log = (msg: string) => {
      setSyncLogs(prev => [...prev, `[${new Date().toLocaleTimeString('id-ID')}] ${msg}`]);
    };

    log('Menghubungkan ke API Google Apps Script...');
    log(`Menemukan ${students.length} data siswa...`);

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      log('Mengirim data ke Google Sheets...');

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
        setLastSaved(new Date());
        alert('✅ Sinkronisasi berhasil! Data telah diperbarui di Google Sheets.');
      } else {
        log(`⚠️ Respon Server: ${result.message || 'Ada peringatan dari server'}`);
      }
    } catch (err: any) {
      log(`❌ GAGAL: ${err.message || 'Koneksi ditolak'}`);
      alert('❌ Gagal sinkronisasi. Periksa koneksi dan URL Web App.');
    } finally {
      setIsSyncing(false);
    }
  };

  // ============================================================
  // HANDLE RESET DATABASE
  // ============================================================
  const handleResetDatabase = () => {
    if (!isDevUnlocked) {
      alert('Akses ditolak! Anda harus masuk sebagai developer.');
      return;
    }
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA data siswa dari aplikasi?')) {
      setStudents([]);
      localStorage.setItem('mpls_smkn_nglegok_students', JSON.stringify([]));
      localStorage.removeItem('mpls_initial_load_done');
      resetAllFilters();
      alert('✅ Semua data siswa telah dihapus.');
    }
  };

  // ============================================================
  // HANDLE ADD STUDENT
  // ============================================================
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
    saveStudentsToDB(nextList, true);
    setNewStudentName('');
    setNewStudentNis('');
    setShowAddModal(false);
    alert(`Siswa ${newStudent.name} berhasil ditambahkan.`);
  };

  // ============================================================
  // HANDLE DELETE STUDENT
  // ============================================================
  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (!isDevUnlocked) {
      alert('Akses ditolak!');
      return;
    }
    if (confirm(`Apakah Anda yakin ingin menghapus siswa "${studentName}"?`)) {
      const updated = students.filter(s => s.id !== studentId);
      saveStudentsToDB(updated, true);
      alert(`Siswa ${studentName} berhasil dihapus.`);
    }
  };

// ============================================================
// 🔥 HANDLE SAVE STUDENT ANSWERS - DENGAN FORMAT FOTO
// ============================================================
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

  // 🔥 Pastikan data foto tersimpan dengan format yang benar
  const updated = students.map(s => {
    if (s.id === selectedStudent.id) {
      const updatedAnswers = { ...answers };
      updatedAnswers.q2 = selectedStudent.nis;
      
      // 🔥 Simpan informasi foto ke spreadsheet
      // Format: PHOTO_ID: {fileId} | PHOTO_URL: {fileUrl}
      if (answers.photo_file_id) {
        updatedAnswers[`${answers.photo_question_id}_file_id`] = answers.photo_file_id;
        updatedAnswers[`${answers.photo_question_id}_file_url`] = answers.photo_file_url;
      }
      
      return {
        ...s,
        progress: progressState,
        progressPercent,
        answers: updatedAnswers,
        lastUpdated: new Date().toISOString()
      };
    }
    return s;
  });

  saveStudentsToDB(updated, true);
  
  const updatedSelected = updated.find(s => s.id === selectedStudent.id);
  if (updatedSelected) {
    setSelectedStudent(updatedSelected);
  }
};



  // ============================================================
  // 🔥 HANDLE STUDENT LOGIN - DENGAN LOAD DATA DARI SHEETS
  // ============================================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginStudent) return;

    if (nisPassword === loginStudent.nis) {
      // 🔥 SEBELUM MASUK, REFRESH DATA DARI SHEETS
      console.log('🔄 Memuat data terbaru dari Google Sheets untuk siswa:', loginStudent.name);
      
      try {
        const url = googleSheetsUrl;
        if (url && url.startsWith('http')) {
          let response;
          try {
            response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ action: 'fetchStudents' })
            });
          } catch (postErr) {
            const getUrl = url.includes('?') 
              ? `${url}&action=fetchStudents` 
              : `${url}?action=fetchStudents`;
            response = await fetch(getUrl, { method: 'GET' });
          }

          if (response && response.ok) {
            const result = await response.json();
            if (result.status === 'success' && result.students) {
              // 🔥 UPDATE DATA SISWA DARI SHEETS
              setStudents(result.students);
              localStorage.setItem('mpls_smkn_nglegok_students', JSON.stringify(result.students));
              console.log('✅ Data siswa berhasil dimuat dari Google Sheets');
              
              // 🔥 CARI SISWA YANG LOGIN DENGAN DATA TERBARU
              const updatedStudent = result.students.find((s: Student) => s.nis === loginStudent.nis);
              if (updatedStudent) {
                // Gunakan data terbaru dari sheets
                setSelectedStudent(updatedStudent);
                setLoginStudent(null);
                setNisPassword('');
                setLoginError(null);
                console.log('✅ Data siswa terbaru dimuat:', updatedStudent);
                return;
              }
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ Gagal memuat data dari sheets, gunakan data lokal:', err);
      }
      
      // Fallback ke data lokal jika fetch gagal
      setSelectedStudent(loginStudent);
      setLoginStudent(null);
      setNisPassword('');
      setLoginError(null);
    } else {
      setLoginError('NIS salah!');
    }
  };



  // ============================================================
  // FILTER STUDENTS
  // ============================================================
  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = student.name.toLowerCase().includes(query) || student.nis.includes(query);
    const matchesJurusan = jurusanFilter === 'All' || student.answers.q11 === jurusanFilter;
    const matchesStatus = statusFilter === 'All' || student.progress === statusFilter;
    return matchesSearch && matchesJurusan && matchesStatus;
  });

  // ============================================================
  // STATS
  // ============================================================
  const totalStudentsCount = students.length;
  const completedCount = students.filter(s => s.progress === 'completed').length;
  const inProgressCount = students.filter(s => s.progress === 'in_progress').length;
  const notStartedCount = students.filter(s => s.progress === 'not_started').length;

  const completedPercent = totalStudentsCount > 0 ? Math.round((completedCount / totalStudentsCount) * 100) : 0;
  const inProgressPercent = totalStudentsCount > 0 ? Math.round((inProgressCount / totalStudentsCount) * 100) : 0;
  const notStartedPercent = totalStudentsCount > 0 ? Math.round((notStartedCount / totalStudentsCount) * 100) : 0;

  // ============================================================
  // PAGINATION
  // ============================================================
  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // ============================================================
  // LOADING SCREEN
  // ============================================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C2B64] mx-auto"></div>
          <p className="text-sm text-[#8A8A70]">Memuat data dari Google Sheets...</p>
        </div>
      </div>
    );
  }

  // If student is logged in
  if (selectedStudent) {
    return (
      <StudentForm
        student={selectedStudent}
        onSave={handleSaveStudentAnswers}
        onClose={() => {
          setSelectedStudent(null);
          refreshDataFromSheets();
        }}
      />
    );
  }

  // ============================================================
  // 6. RETURN / RENDER JSX
  // ============================================================
  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#33332D] font-sans antialiased">
      {/* HEADER */}
      <header className="relative overflow-hidden bg-[#0C2B64] text-white border-b-4 border-[#D4AF37] shadow-md">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                  MPLS 2026
                </div>

                <div className={`inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
                  saveStatus === 'saving' || isAutoSyncing
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : saveStatus === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : saveStatus === 'error'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : 'bg-white/5 border-white/10 text-[#E5E5D8]'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    saveStatus === 'saving' || isAutoSyncing
                      ? 'bg-amber-400 animate-ping'
                      : saveStatus === 'success'
                      ? 'bg-emerald-400'
                      : saveStatus === 'error'
                      ? 'bg-rose-400'
                      : 'bg-emerald-500'
                  }`} />
                  <span>
                    {saveStatus === 'saving' || isAutoSyncing
                      ? 'Menyimpan...' 
                      : saveStatus === 'success'
                      ? 'Tersimpan ✓' 
                      : saveStatus === 'error'
                      ? 'Gagal Simpan!' 
                      : lastSaved ? `Terakhir: ${lastSaved.toLocaleTimeString('id-ID')}` : 'Siap'}
                  </span>
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
                        ? 'Sync...' 
                        : autoSyncStatus === 'success'
                        ? 'Sync OK' 
                        : autoSyncStatus === 'error'
                        ? 'Sync Gagal' 
                        : 'Google Sheets'}
                    </span>
                  </div>
                )}

                <div className="inline-flex items-center gap-1.5 border px-3 py-1 rounded-full text-xs font-bold bg-white/5 border-white/10 text-[#E5E5D8]">
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Auto-Refresh 60s</span>
                </div>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-[#FDFCF8] tracking-tight">
                Aplikasi Pendataan & Manajemen Talenta
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#E5E5D8]">
                <span className="flex items-center gap-1.5 font-semibold text-[#FDFCF8]">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>
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
        
        {/* HERO SLIDESHOW */}
        <Slideshow />
        
        {/* STATS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-[#D6D6C2] rounded-2xl p-6 flex flex-col justify-between hover:border-[#8A8A70] hover:shadow-md transition-all duration-300 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-[#8A8A70] tracking-wider uppercase font-mono">Siswa Baru Terdaftar</span>
                <span className="bg-[#F5F5F0] text-[#0C2B64] border border-[#D6D6C2] px-2 py-0.5 rounded text-[10px] font-bold">Roster Aktif</span>
              </div>
              <div>
                <p className="text-4xl font-serif font-extrabold text-[#33332D] tracking-tight">{totalStudentsCount}</p>
                <p className="text-xs text-[#8A8A70] mt-1">Total siswa yang diterima masuk.</p>
              </div>
              <div className="border-t border-[#F0F0E6] mt-4 pt-3 flex items-center justify-between text-[11px] text-[#8A8A70]">
                <span>Daftar pendaftaran dibuka</span>
                <span className="text-[#0C2B64] font-semibold">Tutup 20 Juli 2026</span>
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
              <p className="text-[11px] text-[#8A8A70] mt-0.5">Distribusi status pengisian kuesioner.</p>
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
                    <span className="text-[9px] font-bold text-[#0C2B64] uppercase tracking-widest font-mono">SELESAI</span>
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
                <div className="flex items-center gap-2 text-[#0C2B64] font-bold text-sm">
                  <FileSpreadsheet className="w-5 h-5 text-[#0C2B64]" />
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
                Koneksikan langsung data kuesioner dengan Spreadsheet sekolah Anda.
              </p>

              <div className="space-y-1.5 bg-[#FDFCF8] p-3 rounded-xl border border-[#D6D6C2]/60">
                <label className="block text-[10px] font-bold text-[#0C2B64] uppercase tracking-wider font-mono">
                  URL Web App Google Apps Script:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={googleSheetsUrlInput}
                    onChange={(e) => setGoogleSheetsUrlInput(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 min-w-0 bg-white border border-[#D6D6C2] rounded-lg px-3 py-1.5 text-xs text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64] font-mono"
                  />
                  <button
                    onClick={() => handleSaveSheetsUrl()}
                    className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-all cursor-pointer shadow-xs ${
                      urlSavedSuccess 
                        ? 'bg-emerald-600 hover:bg-emerald-700' 
                        : 'bg-[#0C2B64] hover:bg-[#081F48]'
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
                  className="w-full px-3 py-2.5 text-xs font-bold text-[#0C2B64] hover:text-[#33332D] flex items-center justify-between transition-colors bg-[#F5F5F0]/50 cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#0C2B64]" />
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
                        <label className="block text-[9px] font-bold text-[#0C2B64] uppercase tracking-wider font-mono">
                          Email Lama:
                        </label>
                        <input
                          type="email"
                          value={devCurrentEmail}
                          onChange={(e) => setDevCurrentEmail(e.target.value)}
                          placeholder="admin@smk.id"
                          className="w-full bg-white border border-[#D6D6C2] rounded-lg px-2.5 py-1.5 text-[11px] text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#0C2B64] uppercase tracking-wider font-mono">
                          Password Lama:
                        </label>
                        <input
                          type="password"
                          value={devCurrentPassword}
                          onChange={(e) => setDevCurrentPassword(e.target.value)}
                          placeholder="••••••"
                          className="w-full bg-white border border-[#D6D6C2] rounded-lg px-2.5 py-1.5 text-[11px] text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#0C2B64] uppercase tracking-wider font-mono">
                          Email Baru:
                        </label>
                        <input
                          type="email"
                          value={devNewEmail}
                          onChange={(e) => setDevNewEmail(e.target.value)}
                          placeholder="email.baru@smk.id"
                          className="w-full bg-white border border-[#D6D6C2] rounded-lg px-2.5 py-1.5 text-[11px] text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-[#0C2B64] uppercase tracking-wider font-mono">
                          Password Baru:
                        </label>
                        <input
                          type="password"
                          value={devNewPassword}
                          onChange={(e) => setDevNewPassword(e.target.value)}
                          placeholder="Min. 6 karakter"
                          className="w-full bg-white border border-[#D6D6C2] rounded-lg px-2.5 py-1.5 text-[11px] text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64]"
                        />
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[10px] text-amber-800">
                      <strong>⚠️ PERHATIAN!</strong> Password default (admin123) SUDAH TIDAK BERLAKU.<br />
                      Gunakan email dan password yang tersimpan di sheet <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">developer</code>.
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
                      className="w-full bg-[#0C2B64] hover:bg-[#081F48] disabled:bg-[#8A8A70] text-white py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
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
                  disabled={isSyncing || students.length === 0}
                  className="flex items-center gap-1.5 bg-[#0C2B64] hover:bg-[#081F48] disabled:bg-[#E5E5D8] text-white disabled:text-[#8A8A70] px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
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
                  className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-3 py-2 rounded-lg text-xs font-bold text-[#0C2B64] transition-colors cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#0C2B64]" />
                  Kode Apps Script
                </button>
                <button
                  onClick={() => exportToCSV(students)}
                  disabled={students.length === 0}
                  className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-3 py-2 rounded-lg text-xs font-bold text-[#0C2B64] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5 text-[#0C2B64]" />
                  Unduh CSV
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-[#F5F5F0] border border-[#D6D6C2] rounded-xl p-4 h-44 overflow-y-auto font-mono text-[10px] text-[#0C2B64] space-y-1 scrollbar-thin">
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
                <p className="text-xs text-[#8A8A70] mt-0.5">
                  {students.length === 0 
                    ? 'Belum ada data. Silakan tarik data dari Google Sheets.' 
                    : `Menampilkan ${students.length} data siswa`}
                </p>
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
                    className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-3 py-1.5 rounded-lg text-xs font-bold text-[#0C2B64] transition-colors cursor-pointer shadow-xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#8A8A70]" />
                    Buka Developer
                  </button>
                )}
                {isDevUnlocked && (
                  <>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="flex items-center gap-1.5 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-3 py-1.5 rounded-lg text-xs font-bold text-[#0C2B64] transition-colors cursor-pointer shadow-xs animate-fade-in"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Tambah Siswa
                    </button>
                    <button
                      onClick={handleResetDatabase}
                      className="p-1.5 text-rose-700 hover:text-rose-800 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer shadow-xs animate-fade-in"
                      title="Hapus semua data siswa dari aplikasi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* FILTER CONTROLS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#8A8A70]" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan Nama atau NIS..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg pl-9 pr-4 py-2 text-xs text-[#33332D] placeholder-[#8A8A70] focus:outline-none focus:ring-1 focus:ring-[#0C2B64]"
                />
              </div>

              <div>
                <select
                  value={jurusanFilter}
                  onChange={(e) => {
                    setJurusanFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg px-3 py-2 text-xs text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64]"
                >
                  <option value="All">Semua Program Keahlian</option>
                  <option value="TKR">TKR</option>
                  <option value="TSM">TSM</option>
                  <option value="TEI">TEI</option>
                  <option value="TKJ">TKJ</option>
                  <option value="TB">TB</option>
                  <option value="BDP">BDP</option>
                  <option value="AKL">AKL</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg px-3 py-2 text-xs text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64]"
                >
                  <option value="All">Semua Status</option>
                  <option value="completed">Sudah Selesai</option>
                  <option value="in_progress">Proses Mengisi</option>
                  <option value="not_started">Belum Mengisi</option>
                </select>
              </div>

              <div>
                <button
                  onClick={resetAllFilters}
                  className="w-full bg-[#F5F5F0] hover:bg-[#E5E5D8] border border-[#D6D6C2] px-3 py-2 rounded-lg text-xs font-bold text-[#0C2B64] transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Filter
                </button>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            {students.length === 0 ? (
              <div className="text-center py-12 text-[#8A8A70]">
                <Database className="w-12 h-12 text-[#8A8A70] mx-auto mb-3 opacity-50" />
                <p className="text-sm font-semibold text-[#33332D]">Belum Ada Data Siswa</p>
                <p className="text-xs text-[#8A8A70] mt-1">
                  Silakan masuk sebagai <strong>Developer</strong> dan klik <strong>"Tarik Data dari Sheets"</strong>
                  <br />untuk mengambil data dari Google Sheets.
                </p>
                <button
                  onClick={() => {
                    setShowDevPrompt(true);
                  }}
                  className="mt-4 bg-[#0C2B64] hover:bg-[#081F48] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5 inline mr-1" />
                  Buka Developer
                </button>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-[#8A8A70]">
                <AlertCircle className="w-8 h-8 text-[#8A8A70] mx-auto mb-2" />
                <p className="text-sm font-semibold">Tidak ada siswa yang cocok</p>
                <p className="text-xs text-[#8A8A70] mt-1">Coba periksa kata kunci atau ubah filter.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F5F0] text-[#8A8A70] text-[11px] font-bold tracking-wider uppercase border-b border-[#E0E0D6]">
                    <th className="py-4 px-6">No</th>
                    {isDevUnlocked && <th className="py-4 px-6">NIS</th>}
                    <th className="py-4 px-6">Nama Lengkap</th>
                    <th className="py-4 px-6">Jurusan</th>
                    <th className="py-4 px-6">Progres</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Terakhir Update</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
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
                          Selesai
                        </span>
                      );
                    } else if (student.progress === 'in_progress') {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1.5 bg-[#FFFBEB] border border-amber-200 text-amber-800 px-2.5 py-1 rounded-full text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Proses
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
                        {isDevUnlocked && <td className="py-4 px-6 font-mono font-bold text-[#0C2B64]">{student.nis}</td>}
                        <td className="py-4 px-6 font-bold text-[#33332D] group-hover:text-[#0C2B64] transition-colors">
                          {student.name}
                        </td>
                        <td className="py-4 px-6">
                          <span className="bg-[#F5F5F0] text-[#0C2B64] border border-[#D6D6C2] px-2.5 py-1 rounded font-semibold text-[10px]">
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
                            className="inline-flex items-center gap-1 bg-[#0C2B64] hover:bg-[#081F48] text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-xs"
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
          {students.length > 0 && (
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
          )}
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0C2B64]/5 rounded-full blur-2xl"></div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F0] border border-[#D6D6C2] flex items-center justify-center text-[#0C2B64] mx-auto mb-3">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-[#0C2B64] tracking-widest uppercase font-mono">Verifikasi Akses</span>
              <h3 className="text-lg font-black text-[#33332D] tracking-tight">Login Portal Siswa</h3>
              <p className="text-xs text-[#8A8A70]">Masukkan NIS Anda untuk verifikasi identitas.</p>
            </div>

            <div className="bg-[#F5F5F0] rounded-xl p-4 border border-[#E0E0D6] space-y-1">
              <p className="text-[10px] font-bold text-[#8A8A70] uppercase tracking-wide">Biodata</p>
              <p className="text-sm font-extrabold text-[#33332D] leading-snug">{loginStudent.name}</p>
              <div className="flex items-center gap-3 text-[11px] text-[#0C2B64] mt-1">
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
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg px-4 py-2.5 text-sm text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64]"
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
                  className="flex-1 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-4 py-2.5 rounded-lg text-xs font-bold text-[#0C2B64] transition-colors cursor-pointer text-center shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0C2B64] hover:bg-[#081F48] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
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
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg px-4 py-2.5 text-sm text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64]"
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
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg px-4 py-2.5 text-sm text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#33332D]">Jurusan:</label>
                <select
                  value={newStudentJurusan}
                  onChange={(e) => setNewStudentJurusan(e.target.value)}
                  className="w-full bg-[#F9F9F5] border border-[#D6D6C2] rounded-lg px-3 py-2 text-xs text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64]"
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
                  className="flex-1 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-4 py-2.5 rounded-lg text-xs font-bold text-[#0C2B64] transition-colors cursor-pointer text-center shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0C2B64] hover:bg-[#081F48] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer text-center"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEVELOPER MODAL */}
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
              <div className="mx-auto w-12 h-12 rounded-full bg-[#FDFCF8] text-[#0C2B64] flex items-center justify-center mb-2 border border-[#D6D6C2]">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-serif font-black text-[#33332D] tracking-tight">
                Verifikasi Akses Developer
              </h3>
              <p className="text-xs text-[#8A8A70]">
                Masukkan email dan password untuk mengaktifkan Modul Integrasi.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 leading-relaxed">
              <strong>⚠️ PERHATIAN!</strong> Password default (admin123) SUDAH TIDAK BERLAKU.<br />
              Gunakan email dan password yang tersimpan di sheet <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">developer</code> Google Sheets Anda.
            </div>

            <form onSubmit={handleDevUnlockSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#0C2B64] uppercase tracking-wider font-mono">
                  Email Developer:
                </label>
                <input
                  type="email"
                  value={inputDevEmail}
                  onChange={(e) => setInputDevEmail(e.target.value)}
                  placeholder="Masukkan email dari sheet developer"
                  disabled={isVerifyingDev}
                  autoFocus
                  className="w-full bg-[#FDFCF8] border border-[#D6D6C2] rounded-lg px-4 py-2.5 text-sm text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64] disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#0C2B64] uppercase tracking-wider font-mono">
                  Password Developer:
                </label>
                <input
                  type="password"
                  value={inputDevPassword}
                  onChange={(e) => setInputDevPassword(e.target.value)}
                  placeholder="Masukkan password dari sheet developer"
                  disabled={isVerifyingDev}
                  className="w-full bg-[#FDFCF8] border border-[#D6D6C2] rounded-lg px-4 py-2.5 text-sm text-[#33332D] focus:outline-none focus:ring-1 focus:ring-[#0C2B64] disabled:opacity-60"
                />
                {devPasswordError && (
                  <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {devPasswordError}
                  </p>
                )}
              </div>

              <div className="bg-[#F5F5F0] border border-[#D6D6C2] rounded-lg p-3 text-[11px] text-[#0C2B64] leading-relaxed">
                <strong>🔒 Informasi:</strong> Hanya data di sheet <code className="bg-[#E5E5D8] px-1 py-0.5 rounded font-mono font-bold">developer</code> yang berlaku.
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
                  className="flex-1 bg-white hover:bg-[#F5F5F0] border border-[#D6D6C2] px-4 py-2.5 rounded-lg text-xs font-bold text-[#0C2B64] transition-colors cursor-pointer text-center disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingDev}
                  className="flex-1 bg-[#0C2B64] hover:bg-[#081F48] disabled:bg-[#8A8A70] text-white px-4 py-2.5 rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer text-center flex items-center justify-center gap-1.5"
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

            <div className="space-y-3 text-xs text-[#0C2B64] bg-[#FDFCF8] p-4 rounded-xl border border-[#D6D6C2]/60 leading-relaxed">
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
  
  if (e && e.parameter && e.parameter.action === "verifyDeveloper") {
    var fakePayload = {
      action: "verifyDeveloper",
      email: e.parameter.email || "",
      password: e.parameter.password || ""
    };
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
      devSheet.getRange(2, 1).setValue("ferrysatriawan49@guru.smk.belajar.id");
      devSheet.getRange(2, 2).setValue("asdf1234");
      devSheet.getRange(2, 3).setValue("⚠️ Ubah cell A2 dan B2 untuk mengganti akun login developer.");
    }
    
    var storedEmail = String(devSheet.getRange(2, 1).getValue()).trim().toLowerCase();
    var storedPassword = String(devSheet.getRange(2, 2).getValue()).trim();
    
    if (!storedEmail || storedEmail === "undefined" || storedEmail === "") {
      storedEmail = "ferrysatriawan49@guru.smk.belajar.id";
    }
    if (!storedPassword || storedPassword === "undefined" || storedPassword === "") {
      storedPassword = "asdf1234";
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
          message: isVerified ? "✅ Akses developer berhasil diverifikasi." : "❌ Email atau Password developer salah."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.action === "updateDeveloper") {
      var currentEmailInput = String(payload.currentEmail || "").trim().toLowerCase();
      var currentPasswordInput = String(payload.currentPassword || "").trim();
      var newEmailInput = String(payload.newEmail || "").trim().toLowerCase();
      var newPasswordInput = String(payload.newPassword || "").trim();
      
      var emailMatch = (currentEmailInput === storedEmail);
      var passwordMatch = (currentPasswordInput === storedPassword);
      
      if (!emailMatch || !passwordMatch) {
        return ContentService
          .createTextOutput(JSON.stringify({
            status: "error",
            message: "❌ Kredensial lama tidak cocok! Gagal memperbarui."
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      devSheet.getRange(2, 1).setValue(newEmailInput);
      devSheet.getRange(2, 2).setValue(newPasswordInput);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          message: "✅ Kredensial developer berhasil diperbarui!"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.action === "fetchStudents") {
      var sheet = ss.getSheetByName("Data Siswa") || ss.getSheetByName("data siswa") || ss.getSheetByName("DATA SISWA");
      if (!sheet) {
        var sheets = ss.getSheets();
        for (var i = 0; i < sheets.length; i++) {
          var name = sheets[i].getName().toLowerCase();
          if (name !== "developer") {
            sheet = sheets[i];
            break;
          }
        }
      }
      
      var fetchedStudents = [];
      if (sheet) {
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        if (lastRow > 1 && lastCol > 0) {
          var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
          var values = dataRange.getValues();
          
          for (var r = 0; r < values.length; r++) {
            var row = values[r];
            var id = row[0] ? String(row[0]).trim() : "";
            var nis = row[1] ? String(row[1]).trim() : "";
            var name = row[2] ? String(row[2]).trim() : "";
            
            if (!nis || !name) continue;
            
            var progress = row[3] ? String(row[3]).trim() : "not_started";
            if (progress !== "completed" && progress !== "in_progress") {
              progress = "not_started";
            }
            
            var percentStr = row[4] ? String(row[4]).replace("%", "").trim() : "0";
            var progressPercent = parseInt(percentStr) || 0;
            var lastUpdated = row[5] ? String(row[5]).trim() : "";
            
            var answers = {};
            for (var colIdx = 6; colIdx < lastCol; colIdx++) {
              var qNum = colIdx - 5;
              if (qNum <= 166) {
                var val = row[colIdx];
                if (val !== undefined && val !== null && String(val).trim() !== "") {
                  answers["q" + qNum] = String(val);
                }
              }
            }
            
            if (!answers["q1"]) answers["q1"] = name;
            if (!answers["q2"]) answers["q2"] = nis;
            
            fetchedStudents.push({
              id: id || nis,
              nis: nis,
              name: name,
              progress: progress,
              progressPercent: progressPercent,
              answers: answers,
              lastUpdated: lastUpdated || new Date().toISOString()
            });
          }
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          students: fetchedStudents,
          message: "Berhasil mengambil " + fetchedStudents.length + " data siswa dari Google Sheets."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.action === "uploadPhoto") {
      var fileName = payload.fileName || "foto_siswa.jpg";
      var fileType = payload.fileType || "image/jpeg";
      var fileData = payload.fileData || "";
      var studentNis = String(payload.studentNis || "").trim();
      var studentName = String(payload.studentName || "").trim();
      var questionId = String(payload.questionId || "").trim().toLowerCase();
      var folderId = payload.folderId || "";
      
      try {
        var base64Data = fileData.split(',')[1] || fileData;
        var decodedData = Utilities.base64Decode(base64Data);
        var blob = Utilities.newBlob(decodedData, fileType, fileName);
        
        var folderName = "FOTO_SISWA";
        var folder;
        var folderFound = false;
        
        if (folderId) {
          try {
            folder = DriveApp.getFolderById(folderId);
            folderFound = true;
          } catch (e) {
            Logger.log("⚠️ Gagal akses folderId: " + e.toString());
          }
        }
        
        if (!folderFound) {
          var folders = DriveApp.getFoldersByName(folderName);
          folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
        }
        
        // 🔥 Cari file dengan nama yang sama untuk di-replace
        var existingFiles = folder.getFilesByName(fileName);
        while (existingFiles.hasNext()) {
          var existingFile = existingFiles.next();
          existingFile.setTrashed(true);
        }
        
        var file = folder.createFile(blob);
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (shareErr) {
          Logger.log("⚠️ Gagal set sharing: " + shareErr.toString());
        }
        
        var fileId = file.getId();
        var fileUrl = "https://drive.google.com/uc?export=view&id=" + fileId;
        
        // 🔥 UPDATE SPREADSHEET LANGSUNG UNTUK PERTANYAAN INI
        var sheetMessage = "";
        if (studentNis && questionId) {
          var sheet = ss.getSheetByName("Data Siswa") || ss.getSheetByName("data siswa") || ss.getSheetByName("DATA SISWA");
          if (sheet) {
            var lastRow = sheet.getLastRow();
            var lastCol = sheet.getLastColumn();
            
            if (lastRow > 1 && lastCol > 0) {
              var nisRange = sheet.getRange(2, 2, lastRow - 1, 1);
              var nisValues = nisRange.getValues();
              var rowNum = -1;
              for (var r = 0; r < nisValues.length; r++) {
                if (String(nisValues[r][0]).trim() === studentNis) {
                  rowNum = r + 2;
                  break;
                }
              }
              
              if (rowNum !== -1) {
                var photoCol = -1;
                var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
                var targetHeader1 = "q" + questionId.replace("q", "");
                
                for (var col = 0; col < headerRow.length; col++) {
                  var hName = String(headerRow[col]).trim().toLowerCase();
                  if (hName === targetHeader1 || hName === questionId || hName === "photo_" + questionId) {
                    photoCol = col + 1;
                    break;
                  }
                }
                
                if (photoCol === -1) {
                  var qNum = questionId.replace("q", "");
                  if (qNum) {
                    var targetQHeader = "Q" + qNum;
                    for (var col = 0; col < headerRow.length; col++) {
                      if (String(headerRow[col]).trim() === targetQHeader) {
                        photoCol = col + 1;
                        break;
                      }
                    }
                  }
                }
                
                if (photoCol !== -1) {
                  sheet.getRange(rowNum, photoCol).setValue(fileUrl);
                  sheetMessage = " dan link berhasil dicatat di kolom " + headerRow[photoCol - 1];
                } else {
                  photoCol = lastCol + 1;
                  sheet.getRange(1, photoCol).setValue("PHOTO_" + questionId);
                  sheet.getRange(rowNum, photoCol).setValue(fileUrl);
                  sheetMessage = " dan kolom baru PHOTO_" + questionId + " berhasil ditambahkan";
                }
                
                sheet.getRange(rowNum, 6).setValue(new Date().toISOString());
              }
            }
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({
            status: "success",
            fileId: fileId,
            fileUrl: fileUrl,
            fileName: fileName,
            message: "Foto berhasil diupload ke Google Drive" + sheetMessage
          }))
          .setMimeType(ContentService.MimeType.JSON);
          
      } catch (err) {
        return ContentService
          .createTextOutput(JSON.stringify({
            status: "error",
            message: "Gagal upload foto: " + err.toString()
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    var students = payload.students;
    if (!students || !Array.isArray(students)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "error",
          message: "Format data salah. Mengharapkan daftar 'students'."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var sheet = ss.getSheetByName("Data Siswa") || ss.getSheetByName("data siswa") || ss.getSheetByName("DATA SISWA");
    if (!sheet) {
      var sheets = ss.getSheets();
      for (var i = 0; i < sheets.length; i++) {
        var name = sheets[i].getName().toLowerCase();
        if (name !== "developer" && name !== "_version") {
          sheet = sheets[i];
          break;
        }
      }
    }
    if (!sheet) {
      sheet = ss.insertSheet("Data Siswa");
    }
    
    var lastRow = sheet.getLastRow();
    
    if (lastRow === 0) {
      var headers = ["ID", "NIS", "Nama Lengkap", "Status Progress", "Persentase Selesai (%)", "Terakhir Diperbarui"];
      for (var i = 1; i <= 166; i++) {
        headers.push("Q" + i);
      }
      headers.push("PHOTO_FILE_ID");
      headers.push("PHOTO_FILE_URL");
      sheet.appendRow(headers);
      lastRow = 1;
    }
    
    var nisToRowMap = {};
    if (lastRow > 1) {
      var nisRange = sheet.getRange(2, 2, lastRow - 1, 1);
      var nisValues = nisRange.getValues();
      
      for (var r = 0; r < nisValues.length; r++) {
        var existingNis = String(nisValues[r][0]).trim();
        if (existingNis) {
          nisToRowMap[existingNis] = r + 2;
        }
      }
    }
    
    var updatedCount = 0;
    var insertedCount = 0;
    
    for (var s = 0; s < students.length; s++) {
      var student = students[s];
      var answers = student.answers || {};
      
      var targetNis = String(student.nis || "").trim();
      if (!targetNis) {
        continue;
      }
      
      if (!answers["q2"] || String(answers["q2"]).trim() !== targetNis) {
        answers["q2"] = targetNis;
      }
      
      var formattedPercent = (student.progressPercent || 0) + " %";
      
      var rowData = [
        student.id || targetNis,
        targetNis,
        student.name || "",
        student.progress || "not_started",
        formattedPercent,
        student.lastUpdated || new Date().toISOString()
      ];
      
      for (var q = 1; q <= 166; q++) {
        var key = "q" + q;
        var answerVal = answers[key];
        
        if (Array.isArray(answerVal)) {
          answerVal = answerVal.join(", ");
        } else if (answerVal === undefined || answerVal === null) {
          answerVal = "";
        }
        
        var otherKey = key + "_other";
        if (answers[otherKey]) {
          answerVal += " (Lainnya: " + answers[otherKey] + ")";
        }
        
        rowData.push(String(answerVal));
      }
      
      rowData.push(answers.photo_file_id || "");
      rowData.push(answers.photo_file_url || "");
      
      if (nisToRowMap[targetNis]) {
        var rowNum = nisToRowMap[targetNis];
        var currentCols = sheet.getLastColumn();
        
        while (rowData.length < currentCols) {
          rowData.push("");
        }
        
        sheet.getRange(rowNum, 1, 1, rowData.length).setValues([rowData]);
        updatedCount++;
      } else {
        sheet.appendRow(rowData);
        insertedCount++;
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        message: "Sinkronisasi berhasil! " + insertedCount + " baris ditambahkan, " + updatedCount + " baris diperbarui."
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    try {
      lock.releaseLock();
    } catch (e) {}
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: "Gagal memproses data: " + err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
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
  
  if (e && e.parameter && e.parameter.action === "verifyDeveloper") {
    var fakePayload = {
      action: "verifyDeveloper",
      email: e.parameter.email || "",
      password: e.parameter.password || ""
    };
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
      devSheet.getRange(2, 1).setValue("ferrysatriawan49@guru.smk.belajar.id");
      devSheet.getRange(2, 2).setValue("asdf1234");
      devSheet.getRange(2, 3).setValue("⚠️ Ubah cell A2 dan B2 untuk mengganti akun login developer.");
    }
    
    var storedEmail = String(devSheet.getRange(2, 1).getValue()).trim().toLowerCase();
    var storedPassword = String(devSheet.getRange(2, 2).getValue()).trim();
    
    if (!storedEmail || storedEmail === "undefined" || storedEmail === "") {
      storedEmail = "ferrysatriawan49@guru.smk.belajar.id";
    }
    if (!storedPassword || storedPassword === "undefined" || storedPassword === "") {
      storedPassword = "asdf1234";
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
          message: isVerified ? "✅ Akses developer berhasil diverifikasi." : "❌ Email atau Password developer salah."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.action === "updateDeveloper") {
      var currentEmailInput = String(payload.currentEmail || "").trim().toLowerCase();
      var currentPasswordInput = String(payload.currentPassword || "").trim();
      var newEmailInput = String(payload.newEmail || "").trim().toLowerCase();
      var newPasswordInput = String(payload.newPassword || "").trim();
      
      var emailMatch = (currentEmailInput === storedEmail);
      var passwordMatch = (currentPasswordInput === storedPassword);
      
      if (!emailMatch || !passwordMatch) {
        return ContentService
          .createTextOutput(JSON.stringify({
            status: "error",
            message: "❌ Kredensial lama tidak cocok! Gagal memperbarui."
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      devSheet.getRange(2, 1).setValue(newEmailInput);
      devSheet.getRange(2, 2).setValue(newPasswordInput);
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          message: "✅ Kredensial developer berhasil diperbarui!"
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.action === "fetchStudents") {
      var sheet = ss.getSheetByName("Data Siswa") || ss.getSheetByName("data siswa") || ss.getSheetByName("DATA SISWA");
      if (!sheet) {
        var sheets = ss.getSheets();
        for (var i = 0; i < sheets.length; i++) {
          var name = sheets[i].getName().toLowerCase();
          if (name !== "developer") {
            sheet = sheets[i];
            break;
          }
        }
      }
      
      var fetchedStudents = [];
      if (sheet) {
        var lastRow = sheet.getLastRow();
        var lastCol = sheet.getLastColumn();
        if (lastRow > 1 && lastCol > 0) {
          var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
          var values = dataRange.getValues();
          
          for (var r = 0; r < values.length; r++) {
            var row = values[r];
            var id = row[0] ? String(row[0]).trim() : "";
            var nis = row[1] ? String(row[1]).trim() : "";
            var name = row[2] ? String(row[2]).trim() : "";
            
            if (!nis || !name) continue;
            
            var progress = row[3] ? String(row[3]).trim() : "not_started";
            if (progress !== "completed" && progress !== "in_progress") {
              progress = "not_started";
            }
            
            var percentStr = row[4] ? String(row[4]).replace("%", "").trim() : "0";
            var progressPercent = parseInt(percentStr) || 0;
            var lastUpdated = row[5] ? String(row[5]).trim() : "";
            
            var answers = {};
            for (var colIdx = 6; colIdx < lastCol; colIdx++) {
              var qNum = colIdx - 5;
              if (qNum <= 166) {
                var val = row[colIdx];
                if (val !== undefined && val !== null && String(val).trim() !== "") {
                  answers["q" + qNum] = String(val);
                }
              }
            }
            
            if (!answers["q1"]) answers["q1"] = name;
            if (!answers["q2"]) answers["q2"] = nis;
            
            fetchedStudents.push({
              id: id || nis,
              nis: nis,
              name: name,
              progress: progress,
              progressPercent: progressPercent,
              answers: answers,
              lastUpdated: lastUpdated || new Date().toISOString()
            });
          }
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "success",
          students: fetchedStudents,
          message: "Berhasil mengambil " + fetchedStudents.length + " data siswa dari Google Sheets."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (payload.action === "uploadPhoto") {
      var fileName = payload.fileName || "foto_siswa.jpg";
      var fileType = payload.fileType || "image/jpeg";
      var fileData = payload.fileData || "";
      var studentNis = String(payload.studentNis || "").trim();
      var studentName = String(payload.studentName || "").trim();
      var questionId = String(payload.questionId || "").trim().toLowerCase();
      var folderId = payload.folderId || "";
      
      try {
        var base64Data = fileData.split(',')[1] || fileData;
        var decodedData = Utilities.base64Decode(base64Data);
        var blob = Utilities.newBlob(decodedData, fileType, fileName);
        
        var folderName = "FOTO_SISWA";
        var folder;
        var folderFound = false;
        
        if (folderId) {
          try {
            folder = DriveApp.getFolderById(folderId);
            folderFound = true;
          } catch (e) {
            Logger.log("⚠️ Gagal akses folderId: " + e.toString());
          }
        }
        
        if (!folderFound) {
          var folders = DriveApp.getFoldersByName(folderName);
          folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
        }
        
        // 🔥 Cari file dengan nama yang sama untuk di-replace
        var existingFiles = folder.getFilesByName(fileName);
        while (existingFiles.hasNext()) {
          var existingFile = existingFiles.next();
          existingFile.setTrashed(true);
        }
        
        var file = folder.createFile(blob);
        try {
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        } catch (shareErr) {
          Logger.log("⚠️ Gagal set sharing: " + shareErr.toString());
        }
        
        var fileId = file.getId();
        var fileUrl = "https://drive.google.com/uc?export=view&id=" + fileId;
        
        // 🔥 UPDATE SPREADSHEET LANGSUNG UNTUK PERTANYAAN INI
        var sheetMessage = "";
        if (studentNis && questionId) {
          var sheet = ss.getSheetByName("Data Siswa") || ss.getSheetByName("data siswa") || ss.getSheetByName("DATA SISWA");
          if (sheet) {
            var lastRow = sheet.getLastRow();
            var lastCol = sheet.getLastColumn();
            
            if (lastRow > 1 && lastCol > 0) {
              var nisRange = sheet.getRange(2, 2, lastRow - 1, 1);
              var nisValues = nisRange.getValues();
              var rowNum = -1;
              for (var r = 0; r < nisValues.length; r++) {
                if (String(nisValues[r][0]).trim() === studentNis) {
                  rowNum = r + 2;
                  break;
                }
              }
              
              if (rowNum !== -1) {
                var photoCol = -1;
                var headerRow = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
                var targetHeader1 = "q" + questionId.replace("q", "");
                
                for (var col = 0; col < headerRow.length; col++) {
                  var hName = String(headerRow[col]).trim().toLowerCase();
                  if (hName === targetHeader1 || hName === questionId || hName === "photo_" + questionId) {
                    photoCol = col + 1;
                    break;
                  }
                }
                
                if (photoCol === -1) {
                  var qNum = questionId.replace("q", "");
                  if (qNum) {
                    var targetQHeader = "Q" + qNum;
                    for (var col = 0; col < headerRow.length; col++) {
                      if (String(headerRow[col]).trim() === targetQHeader) {
                        photoCol = col + 1;
                        break;
                      }
                    }
                  }
                }
                
                if (photoCol !== -1) {
                  sheet.getRange(rowNum, photoCol).setValue(fileUrl);
                  sheetMessage = " dan link berhasil dicatat di kolom " + headerRow[photoCol - 1];
                } else {
                  photoCol = lastCol + 1;
                  sheet.getRange(1, photoCol).setValue("PHOTO_" + questionId);
                  sheet.getRange(rowNum, photoCol).setValue(fileUrl);
                  sheetMessage = " dan kolom baru PHOTO_" + questionId + " berhasil ditambahkan";
                }
                
                sheet.getRange(rowNum, 6).setValue(new Date().toISOString());
              }
            }
          }
        }
        
        return ContentService
          .createTextOutput(JSON.stringify({
            status: "success",
            fileId: fileId,
            fileUrl: fileUrl,
            fileName: fileName,
            message: "Foto berhasil diupload ke Google Drive" + sheetMessage
          }))
          .setMimeType(ContentService.MimeType.JSON);
          
      } catch (err) {
        return ContentService
          .createTextOutput(JSON.stringify({
            status: "error",
            message: "Gagal upload foto: " + err.toString()
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    var students = payload.students;
    if (!students || !Array.isArray(students)) {
      return ContentService
        .createTextOutput(JSON.stringify({
          status: "error",
          message: "Format data salah. Mengharapkan daftar 'students'."
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var sheet = ss.getSheetByName("Data Siswa") || ss.getSheetByName("data siswa") || ss.getSheetByName("DATA SISWA");
    if (!sheet) {
      var sheets = ss.getSheets();
      for (var i = 0; i < sheets.length; i++) {
        var name = sheets[i].getName().toLowerCase();
        if (name !== "developer" && name !== "_version") {
          sheet = sheets[i];
          break;
        }
      }
    }
    if (!sheet) {
      sheet = ss.insertSheet("Data Siswa");
    }
    
    var lastRow = sheet.getLastRow();
    
    if (lastRow === 0) {
      var headers = ["ID", "NIS", "Nama Lengkap", "Status Progress", "Persentase Selesai (%)", "Terakhir Diperbarui"];
      for (var i = 1; i <= 166; i++) {
        headers.push("Q" + i);
      }
      headers.push("PHOTO_FILE_ID");
      headers.push("PHOTO_FILE_URL");
      sheet.appendRow(headers);
      lastRow = 1;
    }
    
    var nisToRowMap = {};
    if (lastRow > 1) {
      var nisRange = sheet.getRange(2, 2, lastRow - 1, 1);
      var nisValues = nisRange.getValues();
      
      for (var r = 0; r < nisValues.length; r++) {
        var existingNis = String(nisValues[r][0]).trim();
        if (existingNis) {
          nisToRowMap[existingNis] = r + 2;
        }
      }
    }
    
    var updatedCount = 0;
    var insertedCount = 0;
    
    for (var s = 0; s < students.length; s++) {
      var student = students[s];
      var answers = student.answers || {};
      
      var targetNis = String(student.nis || "").trim();
      if (!targetNis) {
        continue;
      }
      
      if (!answers["q2"] || String(answers["q2"]).trim() !== targetNis) {
        answers["q2"] = targetNis;
      }
      
      var formattedPercent = (student.progressPercent || 0) + " %";
      
      var rowData = [
        student.id || targetNis,
        targetNis,
        student.name || "",
        student.progress || "not_started",
        formattedPercent,
        student.lastUpdated || new Date().toISOString()
      ];
      
      for (var q = 1; q <= 166; q++) {
        var key = "q" + q;
        var answerVal = answers[key];
        
        if (Array.isArray(answerVal)) {
          answerVal = answerVal.join(", ");
        } else if (answerVal === undefined || answerVal === null) {
          answerVal = "";
        }
        
        var otherKey = key + "_other";
        if (answers[otherKey]) {
          answerVal += " (Lainnya: " + answers[otherKey] + ")";
        }
        
        rowData.push(String(answerVal));
      }
      
      rowData.push(answers.photo_file_id || "");
      rowData.push(answers.photo_file_url || "");
      
      if (nisToRowMap[targetNis]) {
        var rowNum = nisToRowMap[targetNis];
        var currentCols = sheet.getLastColumn();
        
        while (rowData.length < currentCols) {
          rowData.push("");
        }
        
        sheet.getRange(rowNum, 1, 1, rowData.length).setValues([rowData]);
        updatedCount++;
      } else {
        sheet.appendRow(rowData);
        insertedCount++;
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "success",
        message: "Sinkronisasi berhasil! " + insertedCount + " baris ditambahkan, " + updatedCount + " baris diperbarui."
      }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    try {
      lock.releaseLock();
    } catch (e) {}
    
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: "Gagal memproses data: " + err.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
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