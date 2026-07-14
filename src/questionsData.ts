import { QuestionGroup, Question } from './types';

export const JURUSAN_OPTIONS = [
  { value: 'TKR', label: 'TKR (Teknik Kendaraan Ringan)' },
  { value: 'TSM', label: 'TSM (Teknik Sepeda Motor)' },
  { value: 'TEI', label: 'TEI (Teknik Elektronika Industri)' },
  { value: 'TKJ', label: 'TKJ (Teknik Komputer Jaringan)' },
  { value: 'TB', label: 'TB (Tata Boga)' },
  { value: 'BDP', label: 'BDP (Bisnis Daring Pemasaran)' },
  { value: 'AKL', label: 'AKL (Akuntansi)' }
];

export const AGAMA_OPTIONS = [
  { value: 'Islam', label: 'Islam' },
  { value: 'Kristen Protestan', label: 'Kristen Protestan' },
  { value: 'Kristen Katolik', label: 'Kristen Katolik' },
  { value: 'Hindu', label: 'Hindu' },
  { value: 'Buddha', label: 'Buddha' },
  { value: 'Konghucu', label: 'Konghucu' }
];

export const PENGHASILAN_OPTIONS = [
  { value: 'Kurang Dari 500.000', label: 'Kurang Dari Rp 500.000' },
  { value: '500.000 sd 1.000.000', label: 'Rp 500.000 s/d Rp 1.000.000' },
  { value: '1.000.000 sd 2.000.000', label: 'Rp 1.000.000 s/d Rp 2.000.000' },
  { value: '2.000.000 sd 3.000.000', label: 'Rp 2.000.000 s/d Rp 3.000.000' },
  { value: 'diatas 3.000.000', label: 'Di atas Rp 3.000.000' }
];

const TIDAK_KADANG_SELALU = [
  { value: 'tidak', label: 'Tidak' },
  { value: 'kadang', label: 'Kadang-kadang' },
  { value: 'selalu', label: 'Selalu' }
];

const IYA_BELUM = [
  { value: 'iya', label: 'Iya / Ya' },
  { value: 'belum', label: 'Belum' }
];

// ============================================================
// 🔥 QUESTIONS 1-70 (Q69 dan Q70 DIHAPUS)
// ============================================================
const QUESTIONS_1_TO_70: Question[] = [
  { id: 'q1', number: 1, text: 'Nama Lengkap (Sesuai Data Pendaftaran)', type: 'text', required: true },
  { id: 'q2', number: 2, text: 'NISN (Nomor Induk Siswa Nasional)', type: 'text', required: true },
  { 
    id: 'q3', 
    number: 3, 
    text: 'NIK (Nomor Induk Kependudukan)', 
    type: 'text', 
    required: true,
    validationRegex: '^[0-9]{16}$',
    validationMessage: 'NIK harus terdiri dari 16 digit angka'
  },
  { id: 'q4', number: 4, text: 'Tempat Lahir', type: 'text', required: true, minLength: 2, placeholder: 'Nama Kota/Kabupaten' },
  { id: 'q5', number: 5, text: 'Tanggal Lahir', type: 'date', required: true, validationMessage: 'Format tanggal harus dd-mm-yyyy' },
  { 
    id: 'q6', 
    number: 6, 
    text: 'Foto Selfie (upload foto dengan batas 100 kb - 500 kb)', 
    type: 'file', 
    required: true,
    validationMessage: 'Ukuran file harus antara 100 KB - 500 KB'
  },
  { id: 'q7', number: 7, text: 'Agama', type: 'select', required: true, options: AGAMA_OPTIONS },
  { 
    id: 'q8', 
    number: 8, 
    text: 'Alamat Rumah', 
    type: 'text', 
    required: true, 
    minLength: 35, 
    maxLength: 100,
    placeholder: 'Tulis alamat lengkap minimal 35 karakter dan maksimal 100 karakter'
  },
  { 
    id: 'q9', 
    number: 9, 
    text: 'Foto Rumah (upload foto dengan batas 100 kb - 500 kb)', 
    type: 'file', 
    required: true,
    validationMessage: 'Ukuran file harus antara 100 KB - 500 KB'
  },
  { 
    id: 'q10', 
    number: 10, 
    text: 'Jenis Kelamin', 
    type: 'select', 
    required: true, 
    options: [
      { value: 'Laki-laki', label: 'Laki-laki' },
      { value: 'Perempuan', label: 'Perempuan' }
    ] 
  },
  { id: 'q11', number: 11, text: 'Jurusan yang Diterima', type: 'select', required: true, options: JURUSAN_OPTIONS },
  { 
    id: 'q12', 
    number: 12, 
    text: 'Nomor Telepon (WhatsApp) Siswa (Awalan 62)', 
    type: 'text', 
    required: true,
    validationRegex: '^628[1-9][0-9]{7,10}$',
    placeholder: 'Contoh: 628123456789',
    validationMessage: 'Nomor WhatsApp wajib menggunakan awalan 628... dan berjumlah 10 s/d 13 digit angka'
  },
  { 
    id: 'q13', 
    number: 13, 
    text: 'Alamat Email', 
    type: 'text', 
    required: true,
    validationRegex: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    placeholder: 'Contoh: adijaya@gmail.com',
    validationMessage: 'Format email tidak valid, wajib menyertakan @ dan domain yang benar'
  },
  { id: 'q14', number: 14, text: 'Akun Facebook', type: 'text', required: false, placeholder: 'Link atau Nama Akun' },
  { id: 'q15', number: 15, text: 'Akun Instagram', type: 'text', required: false, placeholder: '@username' },
  { id: 'q16', number: 16, text: 'Channel YouTube', type: 'text', required: false, placeholder: 'Nama Channel / Link' },
  { id: 'q17', number: 17, text: 'Channel TikTok', type: 'text', required: false, placeholder: '@username' },
  { 
    id: 'q18', 
    number: 18, 
    text: 'Nama Ayah Kandung (Huruf Kapital, min 2 kata, tanpa simbol)', 
    type: 'text', 
    required: true,
    minLength: 4,
    maxLength: 60,
    validationRegex: '^[A-Z\\s]{4,60}$',
    placeholder: 'NAMA AYAH KANDUNG',
    validationMessage: 'Nama Ayah harus huruf kapital semua, minimal 2 kata, dan maksimal 60 huruf tanpa simbol'
  },
  { 
    id: 'q19', 
    number: 19, 
    text: 'Nomor Telepon (WhatsApp) Ayah (Awalan 62)', 
    type: 'text', 
    required: true,
    validationRegex: '^628[1-9][0-9]{7,10}$',
    placeholder: 'Contoh: 628123456789',
    validationMessage: 'Nomor WhatsApp wajib menggunakan awalan 628... dan berjumlah 10 s/d 13 digit angka'
  },
  { id: 'q20', number: 20, text: 'Pekerjaan Ayah', type: 'text', required: true, minLength: 2, maxLength: 60 },
  { id: 'q21', number: 21, text: 'Penghasilan Rata-rata Ayah per Bulan', type: 'select', required: true, options: PENGHASILAN_OPTIONS },
  { 
    id: 'q22', 
    number: 22, 
    text: 'Nama Ibu Kandung (Huruf Kapital, min 2 kata, tanpa simbol)', 
    type: 'text', 
    required: true,
    minLength: 4,
    maxLength: 60,
    validationRegex: '^[A-Z\\s]{4,60}$',
    placeholder: 'NAMA IBU KANDUNG',
    validationMessage: 'Nama Ibu harus huruf kapital semua, minimal 2 kata, dan maksimal 60 huruf tanpa simbol'
  },
  { id: 'q23', number: 23, text: 'Pekerjaan Ibu', type: 'text', required: true, minLength: 2, maxLength: 60 },
  { id: 'q24', number: 24, text: 'Penghasilan Rata-rata Ibu per Bulan', type: 'select', required: true, options: PENGHASILAN_OPTIONS },
  { 
    id: 'q25',
    number: 25, 
    text: 'Nomor Telepon (WhatsApp) Ibu (Awalan 62)', 
    type: 'text', 
    required: true,
    validationRegex: '^628[1-9][0-9]{7,10}$',
    placeholder: 'Contoh: 628123456789',
    validationMessage: 'Nomor WhatsApp wajib menggunakan awalan 628... dan berjumlah 10 s/d 13 digit angka'
  },
  { 
    id: 'q26', 
    number: 26, 
    text: 'Alamat Rumah Ayah/Ibu', 
    type: 'text', 
    required: true,
    minLength: 35,
    maxLength: 100,
    placeholder: 'Alamat rumah orang tua minimal 35 dan maksimal 100 karakter'
  },
  { 
    id: 'q27', 
    number: 27, 
    text: 'Kondisi Keseharian Siswa dalam Keluarga', 
    type: 'select', 
    required: true,
    options: [
      { value: 'Siswa Tinggal Bersama Ayah dan Ibu (lengkap)', label: 'Siswa Tinggal Bersama Ayah dan Ibu (lengkap)' },
      { value: 'Siswa Tinggal Bersama Ayah Saja', label: 'Siswa Tinggal Bersama Ayah Saja' },
      { value: 'Siswa Tinggal Bersama Ibu Saja', label: 'Siswa Tinggal Bersama Ibu Saja' },
      { value: 'Siswa Tidak Tinggal Bersama Ayah dan Ibu', label: 'Siswa Tidak Tinggal Bersama Ayah dan Ibu' },
      { value: 'Siswa Tinggal Bersama Ayah dan Ibu Tiri', label: 'Siswa Tinggal Bersama Ayah dan Ibu Tiri' },
      { value: 'Siswa Tinggal Bersama Ibu dan Ayah Tiri', label: 'Siswa Tinggal Bersama Ibu dan Ayah Tiri' }
    ]
  },
  { 
    id: 'q28', 
    number: 28, 
    text: 'Keberadaan Ayah dan Ibu dalam Keluarga', 
    type: 'select', 
    required: true,
    options: [
      { value: 'Ayah Dan Ibu Tinggal Bersama', label: 'Ayah Dan Ibu Tinggal Bersama' },
      { value: 'Ayah / Ibu Tidak Tinggal Bersama Karena Sedang Bekerja (dalam waktu lebih 1 bulan)', label: 'Ayah / Ibu Tidak Tinggal Bersama Karena Sedang Bekerja (dalam waktu lebih 1 bulan)' },
      { value: 'Ayah / Ibu Tidak Tinggal Bersama Karena Sudah Bercerai', label: 'Ayah / Ibu Tidak Tinggal Bersama Karena Sudah Bercerai' },
      { value: 'Ayah / Ibu Tidak Tinggal Bersama Karena Salah Satu / Keduanya Sudah Meninggal', label: 'Ayah / Ibu Tidak Tinggal Bersama Karena Salah Satu / Keduanya Sudah Meninggal' }
    ]
  },
  { 
    id: 'q29', 
    number: 29, 
    text: 'Foto Bersama Keluarga (upload foto dengan batas 100 kb - 500 kb)', 
    type: 'file', 
    required: true,
    validationMessage: 'Ukuran file harus antara 100 KB - 500 KB'
  },
  { 
    id: 'q30', 
    number: 30, 
    text: 'Kepemilikan Kartu Bantuan Sosial', 
    type: 'multiselect', 
    required: true,
    hasOther: true,
    options: [
      { value: 'PKH', label: 'PKH (Program Keluarga Harapan)' },
      { value: 'KIP', label: 'KIP (Kartu Indonesia Pintar)' },
      { value: 'Tidak Ada', label: 'Tidak Memiliki Kartu Bantuan' }
    ]
  },
  { 
    id: 'q31', 
    number: 31, 
    text: 'Penanggung Jawab Biaya Hidup dan Sekolah', 
    type: 'select', 
    required: true,
    options: [
      { value: 'Orang Tua Siswa (Ayah / Ibu Kandung)', label: 'Orang Tua Siswa (Ayah / Ibu Kandung)' },
      { value: 'Wali Siswa', label: 'Wali Siswa' },
      { value: 'Diri Sendiri', label: 'Diri Sendiri' }
    ]
  },
  // Wali fields (Q32 - Q36) conditional on Q31 !== Orang Tua Siswa
  { 
    id: 'q32', 
    number: 32, 
    text: 'Nama Wali (Huruf Kapital, min 2 kata, tanpa simbol)', 
    type: 'text', 
    required: false,
    minLength: 4,
    maxLength: 60,
    validationRegex: '^[A-Z\\s]{4,60}$',
    placeholder: 'NAMA WALI LENGKAP',
    validationMessage: 'Nama Wali harus huruf kapital semua, minimal 2 kata, dan maksimal 60 huruf tanpa simbol',
    dependsOn: { questionId: 'q31', value: 'Orang Tua Siswa (Ayah / Ibu Kandung)', condition: 'not_equals' }
  },
  { 
    id: 'q33', 
    number: 33, 
    text: 'Nomor Telepon (WhatsApp) Wali (Awalan 62)', 
    type: 'text', 
    required: false,
    validationRegex: '^628[1-9][0-9]{7,10}$',
    placeholder: 'Contoh: 628123456789',
    validationMessage: 'Nomor WhatsApp Wali wajib menggunakan awalan 628...',
    dependsOn: { questionId: 'q31', value: 'Orang Tua Siswa (Ayah / Ibu Kandung)', condition: 'not_equals' }
  },
  { 
    id: 'q34', 
    number: 34, 
    text: 'Konflik pribadi yang sedang Anda hadapi (max 50 karakter)', 
    type: 'text', 
    required: false,
    maxLength: 50,
    placeholder: 'Tuliskan secara singkat...',
    dependsOn: { questionId: 'q31', value: 'Orang Tua Siswa (Ayah / Ibu Kandung)', condition: 'not_equals' }
  },
  { 
    id: 'q35', 
    number: 35, 
    text: 'Pekerjaan Wali', 
    type: 'text', 
    required: false,
    minLength: 2,
    maxLength: 60,
    dependsOn: { questionId: 'q31', value: 'Orang Tua Siswa (Ayah / Ibu Kandung)', condition: 'not_equals' }
  },
  { 
    id: 'q36', 
    number: 36, 
    text: 'Penghasilan Rata-rata Wali per Bulan', 
    type: 'select', 
    required: false,
    options: PENGHASILAN_OPTIONS,
    dependsOn: { questionId: 'q31', value: 'Orang Tua Siswa (Ayah / Ibu Kandung)', condition: 'not_equals' }
  },
  { 
    id: 'q37', 
    number: 37, 
    text: 'Orang yang Paling Dipercaya untuk Mengetahui Rahasia', 
    type: 'select', 
    required: true,
    options: [
      { value: 'Pada Orang Tua Ayah / Ibu', label: 'Pada Orang Tua Ayah / Ibu' },
      { value: 'Pada Saudara Kandung Kakak / Adik', label: 'Pada Saudara Kandung Kakak / Adik' },
      { value: 'Pada Pacar Saya', label: 'Pada Pacar Saya' },
      { value: 'Pada Sahabat Saya', label: 'Pada Sahabat Saya' },
      { value: 'Pada Guru Saya', label: 'Pada Guru Saya' },
      { value: 'Pada Orang Lain', label: 'Pada Orang Lain' }
    ]
  },
  { 
    id: 'q38', 
    number: 38, 
    text: 'Jumlah Pengalaman Berpacaran', 
    type: 'select', 
    required: true,
    options: [
      { value: '1 kali', label: '1 Kali' },
      { value: '2 kali', label: '2 Kali' },
      { value: '3 kali', label: '3 Kali' },
      { value: 'lebih dari 3 kali', label: 'Lebih dari 3 Kali' },
      { value: 'tidak pernah', label: 'Tidak Pernah' }
    ]
  },
  { 
    id: 'q39', 
    number: 39, 
    text: 'Jumlah Sahabat Akrab (angka, maks 2 digit)', 
    type: 'text', 
    required: false,
    validationRegex: '^[0-9]{1,2}$',
    validationMessage: 'Wajib diisi berupa angka (maksimal 2 digit)',
    dependsOn: { questionId: 'q38', value: 'tidak pernah', condition: 'not_equals' }
  },
  { 
    id: 'q40', 
    number: 40, 
    text: 'Alasan Mempercayai Orang Tersebut untuk Berbagi Cerita', 
    type: 'text', 
    required: true,
    minLength: 6,
    maxLength: 40,
    placeholder: 'Tuliskan alasan singkat antara 6 s/d 40 karakter'
  },
  { 
    id: 'q41', 
    number: 41, 
    text: 'Penyakit Kronis yang Pernah atau Sering Dialami', 
    type: 'multiselect', 
    required: true,
    options: [
      { value: 'Pusing Yang Tidak Tertahankan', label: 'Pusing Yang Tidak Tertahankan' },
      { value: 'Sakit Perut Yang Tidak Tertahankan', label: 'Sakit Perut Yang Tidak Tertahankan' },
      { value: 'Sesak Nafas', label: 'Sesak Nafas' },
      { value: 'Stres Yang Tidak Tekendali', label: 'Stres Yang Tidak Terkendali' },
      { value: 'Tidak Memiliki Riwayat SakitSakit', label: 'Tidak Memiliki Riwayat Penyakit Kronis' }
    ]
  },
  { 
    id: 'q42', 
    number: 42, 
    text: 'Kegiatan yang Paling Disukai', 
    type: 'multiselect', 
    required: true,
    options: [
      { value: 'Belajar Materi Baru', label: 'Belajar Materi Baru' },
      { value: 'Bermain Musik', label: 'Bermain Musik' },
      { value: 'Berolah Raga', label: 'Berolahraga' },
      { value: 'Nonton Film', label: 'Menonton Film' },
      { value: 'Bermain Bersama Teman', label: 'Bermain Bersama Teman' },
      { value: 'Dirumah Bersama Keluarga', label: 'Berada di Rumah Bersama Keluarga' }
    ]
  },
  { id: 'q43', number: 43, text: 'Minat Belajar Materi di Sekolah (skala 1 s/d 4)', type: 'rating', required: true },
  { id: 'q44', number: 44, text: 'Minat Bermain Musik (skala 1 s/d 4)', type: 'rating', required: true },
  { id: 'q45', number: 45, text: 'Minat Karya Tulis dan Drama (skala 1 s/d 4)', type: 'rating', required: true },
  { id: 'q46', number: 46, text: 'Minat Berolahraga (skala 1 s/d 4)', type: 'rating', required: true },
  { id: 'q47', number: 47, text: 'Hobi Utama Anda', type: 'text', required: true, minLength: 4, maxLength: 25 },
  { id: 'q48', number: 48, text: 'Prestasi atau Hasil Karya Terbaik (Boleh kosong)', type: 'text', required: false, minLength: 4, maxLength: 25 },
  { id: 'q49', number: 49, text: 'Apakah Anda sudah mengetahui potensi atau kelebihan yang Anda miliki?', type: 'select', required: true, options: IYA_BELUM },
  { id: 'q50', number: 50, text: 'Apakah Anda mengetahui cara mengembangkan bakat dan minat yang Anda miliki?', type: 'select', required: true, options: IYA_BELUM },
  { 
    id: 'q51', 
    number: 51, 
    text: 'Bakat atau minat apa yang paling ingin Anda kembangkan? (Pilih maksimal 3)', 
    type: 'multiselect', 
    required: true,
    maxSelections: 3,
    hasOther: true,
    options: [
      { value: 'Akademik', label: 'Akademik (Matematika, IPA, IPS, Bahasa)' },
      { value: 'Menulis', label: 'Menulis (Cerpen, Puisi, Artikel)' },
      { value: 'Public Speaking / MC', label: 'Public Speaking / MC' },
      { value: 'Debat', label: 'Debat' },
      { value: 'Jurnalistik', label: 'Jurnalistik' },
      { value: 'Desain Grafis', label: 'Desain Grafis' },
      { value: 'Fotografi', label: 'Fotografi' },
      { value: 'Videografi', label: 'Videografi' },
      { value: 'Editing Video', label: 'Editing Video' },
      { value: 'Pemrograman / Coding', label: 'Pemrograman / Coding' },
      { value: 'Teknologi Informasi', label: 'Teknologi Informasi' },
      { value: 'Robotika', label: 'Robotika' },
      { value: 'Otomotif', label: 'Otomotif' },
      { value: 'Kelistrikan / Elektronika', label: 'Kelistrikan / Elektronika' },
      { value: 'Tata Boga / Kuliner', label: 'Tata Boga / Kuliner' },
      { value: 'Tata Busana', label: 'Tata Busana' },
      { value: 'Kewirausahaan', label: 'Kewirausahaan' },
      { value: 'Kepemimpinan', label: 'Kepemimpinan' },
      { value: 'Organisasi', label: 'Organisasi' },
      { value: 'Musik', label: 'Musik' },
      { value: 'Menyanyi', label: 'Menyanyi' },
      { value: 'Tari', label: 'Tari' },
      { value: 'Teater / Drama', label: 'Teater / Drama' },
      { value: 'Seni Lukis / Menggambar', label: 'Seni Lukis / Menggambar' },
      { value: 'Bola Voli', label: 'Bola Voli' },
      { value: 'Sepak Bola / Futsal', label: 'Sepak Bola / Futsal' },
      { value: 'Bola Basket', label: 'Bola Basket' },
      { value: 'Bulu Tangkis', label: 'Bulu Tangkis' },
      { value: 'Tenis Meja', label: 'Tenis Meja' },
      { value: 'Atletik', label: 'Atletik' },
      { value: 'Pencak Silat', label: 'Pencak Silat' },
      { value: 'Karate', label: 'Karate' },
      { value: 'Taekwondo', label: 'Taekwondo' },
      { value: 'Pramuka', label: 'Pramuka' },
      { value: 'PMR', label: 'PMR' },
      { value: 'Pecinta Alam', label: 'Pecinta Alam' },
      { value: 'Bahasa Asing', label: 'Bahasa Asing (Inggris, Jepang, dll.)' }
    ]
  },
  { 
    id: 'q52', 
    number: 52, 
    text: 'Ekstrakurikuler apa yang ingin Anda ikuti? (Pilih maksimal 2)', 
    type: 'multiselect', 
    required: true,
    maxSelections: 2,
    hasOther: true,
    options: [
      { value: 'Pramuka', label: 'Pramuka' },
      { value: 'PMR', label: 'PMR' },
      { value: 'Paskibra', label: 'Paskibra' },
      { value: 'OSIS / MPK', label: 'OSIS / MPK' },
      { value: 'Bola Voli', label: 'Bola Voli' },
      { value: 'Futsal', label: 'Futsal' },
      { value: 'Pencak Silat', label: 'Pencak Silat' },
      { value: 'Karate', label: 'Karate' },
      { value: 'Taekwondo', label: 'Taekwondo' },
      { value: 'Musik / Band', label: 'Musik / Band' },
      { value: 'Paduan Suara', label: 'Paduan Suara' },
      { value: 'Tari', label: 'Tari' },
      { value: 'Teater', label: 'Teater' },
      { value: 'Jurnalistik', label: 'Jurnalistik' },
      { value: 'Karya Ilmiah Remaja (KIR)', label: 'Karya Ilmiah Remaja (KIR)' },
      { value: 'English Club', label: 'English Club' },
      { value: 'Japanese Club', label: 'Japanese Club' },
      { value: 'Desain Grafis', label: 'Desain Grafis' },
      { value: 'Robotika', label: 'Robotika' },
      { value: 'Coding / Programming', label: 'Coding / Programming' },
      { value: 'Pecinta Alam', label: 'Pecinta Alam' },
      { value: 'Rohani Islam (Rohis)', label: 'Rohani Islam (Rohis)' },
      { value: 'Rohani Kristen/Katolik', label: 'Rohani Kristen/Katolik' }
    ]
  },
  { 
    id: 'q53', 
    number: 53,
    text: 'Apa yang memotivasi Anda untuk meraih prestasi? (Pilih maksimal 2)', 
    type: 'multiselect', 
    required: true,
    maxSelections: 2,
    hasOther: true,
    options: [
      { value: 'Membanggakan orang tua', label: 'Membanggakan orang tua' },
      { value: 'Mengembangkan kemampuan diri', label: 'Mengembangkan kemampuan diri' },
      { value: 'Meraih beasiswa', label: 'Meraih beasiswa' },
      { value: 'Mempersiapkan karier atau pekerjaan', label: 'Mempersiapkan karier atau pekerjaan' },
      { value: 'Ingin melanjutkan kuliah', label: 'Ingin melanjutkan kuliah' },
      { value: 'Mendapat penghargaan atau juara', label: 'Mendapat penghargaan atau juara' },
      { value: 'Menambah pengalaman', label: 'Menambah pengalaman' },
      { value: 'Mengharumkan nama sekolah', label: 'Mengharumkan nama sekolah' }
    ]
  },
  { 
    id: 'q54', 
    number: 54, 
    text: 'Apakah Anda bersedia mengikuti pembinaan atau pelatihan secara intensif?', 
    type: 'select', 
    required: true,
    options: [
      { value: 'Sangat Bersedia', label: 'Sangat Bersedia' },
      { value: 'Bersedia', label: 'Bersedia' },
      { value: 'Ragu-ragu', label: 'Ragu-ragu' },
      { value: 'Tidak Bersedia', label: 'Tidak Bersedia' }
    ]
  },
  { 
    id: 'q55', 
    number: 55, 
    text: 'Dukungan apa yang Anda miliki untuk mengembangkan bakat dan meraih prestasi?', 
    type: 'multiselect', 
    required: true,
    hasOther: true,
    options: [
      { value: 'Dukungan orang tua', label: 'Dukungan orang tua' },
      { value: 'Dukungan guru', label: 'Dukungan guru' },
      { value: 'Dukungan teman', label: 'Dukungan teman' },
      { value: 'Dukungan sekolah', label: 'Dukungan sekolah' },
      { value: 'Memiliki fasilitas/peralatan yang dibutuhkan', label: 'Memiliki fasilitas/peralatan yang dibutuhkan' },
      { value: 'Memiliki waktu untuk berlatih', label: 'Memiliki waktu untuk berlatih' },
      { value: 'Memiliki biaya untuk mengikuti pelatihan/lomba', label: 'Memiliki biaya untuk mengikuti pelatihan/lomba' },
      { value: 'Belum memiliki dukungan yang cukup', label: 'Belum memiliki dukungan yang cukup' }
    ]
  },
  { 
    id: 'q56', 
    number: 56, 
    text: 'Jarak Rumah ke Sekolah', 
    type: 'select', 
    required: true,
    options: [
      { value: '0 - 1 Km', label: '0 s/d 1 Km' },
      { value: '1 - 2 Km', label: '1 s/d 2 Km' },
      { value: 'Lebih dari 2 Km', label: 'Lebih dari 2 Km' }
    ]
  },
  { 
    id: 'q57', 
    number: 57, 
    text: 'Transportasi Utama ke Sekolah', 
    type: 'select', 
    required: true,
    options: [
      { value: 'Jalan Kaki', label: 'Jalan Kaki' },
      { value: 'Naik Motor Sendiri', label: 'Naik Motor Sendiri' },
      { value: 'Naik Motor Nebeng Teman', label: 'Naik Motor Nebeng Teman' },
      { value: 'Naik Motor Diantar Keluarga', label: 'Naik Motor Diantar Keluarga' },
      { value: 'Ngekos', label: 'Ngekos / Tinggal di Dekat Sekolah' }
    ]
  },
  { id: 'q58', number: 58, text: 'Nama Sekolah Asal (SMP/MTs)', type: 'text', required: true, minLength: 5, maxLength: 25 },
  { id: 'q59', number: 59, text: 'Mata Pelajaran yang Paling Tidak Disukai di SMP/MTs', type: 'text', required: true, minLength: 5, maxLength: 25 },
  { id: 'q60', number: 60, text: 'Mata Pelajaran yang Paling Dikuasai di SMP/MTs', type: 'text', required: true, minLength: 5, maxLength: 25 },
  { id: 'q61', number: 61, text: 'Frekuensi Terlambat Masuk Sekolah di SMP/MTs (1 = Tidak pernah, 4 = Selalu terlambat)', type: 'rating', required: true },
  { id: 'q62', number: 62, text: 'Frekuensi Mendapat Hukuman di SMP/MTs (1 = Tidak pernah, 4 = Sangat sering)', type: 'rating', required: true },
  { 
    id: 'q63', 
    number: 63, 
    text: 'Alasan Memilih Bersekolah di SMKN 1 Nglegok', 
    type: 'select', 
    required: true,
    hasOther: true,
    options: [
      { value: 'atas keinginan sendiri', label: 'Atas Keinginan Sendiri' },
      { value: 'atas keinginan orang tua', label: 'Atas Keinginan Orang Tua' },
      { value: 'karena pacar / teman sekolah di SMKN 1 Nglegok', label: 'Karena Pacar / Teman Sekolah di SMKN 1 Nglegok' }
    ]
  },
  { 
    id: 'q64', 
    number: 64, 
    text: 'Kesesuaian Jurusan dengan Minat Anda', 
    type: 'select', 
    required: true,
    options: [
      { value: 'sesuai', label: 'Sesuai' },
      { value: 'tidak sesuai', label: 'Tidak Sesuai' }
    ]
  },
  { 
    id: 'q65', 
    number: 65, 
    text: 'Rencana Jika Jurusan Tidak Sesuai Minat', 
    type: 'select', 
    required: true,
    hasOther: true,
    options: [
      { value: 'Menjalani meskipun tidak suka', label: 'Menjalani meskipun tidak suka' },
      { value: 'Berusaha menyukai', label: 'Berusaha menyukai' }
    ]
  },
  { 
    id: 'q66', 
    number: 66, 
    text: 'Rencana Utama Setelah Lulus SMK', 
    type: 'select', 
    required: true,
    hasOther: true,
    options: [
      { value: 'Kuliah', label: 'Kuliah' },
      { value: 'Bekerja Sebagai Karyawan (ASN / TNI/ POLRI)', label: 'Bekerja Sebagai Karyawan (ASN / TNI/ POLRI / Swasta)' },
      { value: 'Berwira Usaha (membangun usaha sendiri)', label: 'Berwirausaha (Membangun Usaha Sendiri)' },
      { value: 'Membantu Usaha Orang Tua', label: 'Membantu Usaha Orang Tua' }
    ]
  },
  { id: 'q67', number: 67, text: 'Apakah Anda berminat mengikuti O2SN (Olimpiade Olahraga Siswa Nasional)?', type: 'select', required: true, options: [{ value: 'Iya', label: 'Iya' }, { value: 'Tidak', label: 'Tidak' }] },
  { id: 'q68', number: 68, text: 'Apakah Anda berminat mengikuti FLS3N (Festival Lomba Seni dan Sastra Siswa Nasional)?', type: 'select', required: true, options: [{ value: 'Iya', label: 'Iya' }, { value: 'Tidak', label: 'Tidak' }] },
  { id: 'q69', number: 69, text: 'Titik Koordinat Rumah Anda (GPS)', type: 'location', required: true }
  // 🔥 Q70 DIHAPUS
];

// ============================================================
// SELF REFLECTION QUESTIONS (Q71 - Q87)
// ============================================================
const SELF_REFLECTION_QUESTIONS: { id: string; text: string; num: number }[] = [
  { id: 'q71', num: 71, text: 'Saya merasa disiplin dalam beribadah pada Tuhan YME' },
  { id: 'q72', num: 72, text: 'Saya kadang-kadang berperilaku dan bertutur kata tidak jujur' },
  { id: 'q73', num: 73, text: 'Saya kadang-kadang masih suka menyontek pada waktu tes' },
  { id: 'q74', num: 74, text: 'Saya merasa bisa mengendalikan emosi dengan baik' },
  { id: 'q75', num: 75, text: 'Saya paham tentang sikap dan perilaku asertif' },
  { id: 'q76', num: 76, text: 'Saya tahu cara mengenal dan memahami diri sendiri' },
  { id: 'q77', num: 77, text: 'Saya memahami potensi diri' },
  { id: 'q78', num: 78, text: 'Saya tahu perubahan dan permasalahan yang terjadi pada masa remaja' },
  { id: 'q79', num: 79, text: 'Saya mengenal tentang macam-macam kepribadian' },
  { id: 'q80', num: 80, text: 'Saya kurang memiliki rasa percaya diri' },
  { id: 'q81', num: 81, text: 'Saya kadang kurang menjaga kesehatan diri' },
  { id: 'q82', num: 82, text: 'Saya tahu ciri-ciri/sifat/prilaku pribadi yang berkarakter' },
  { id: 'q83', num: 83, text: 'Saya merasa kurang memilki tanggung jawab pada diri sendiri' },
  { id: 'q84', num: 84, text: 'Saya kesulitan mengatur waktu belajar dan bermain' },
  { id: 'q85', num: 85, text: 'Kondisi orang tua saya sedang tidak harmonis' },
  { id: 'q86', num: 86, text: 'Saya merasa tidak betah tinggal di rumah sendiri' },
  { id: 'q87', num: 87, text: 'Saya mempunyai masalah dengan anggota keluarga di rumah' }
];

// ============================================================
// Q88 - HUBUNGAN DENGAN WALI
// ============================================================
const HUBUNGAN_WALI_Q: Question = {
  id: 'q88',
  number: 88,
  text: 'Hubungan saya dengan wali / pengasuh di rumah',
  type: 'select',
  required: true,
  options: [
    { value: 'Orang tua kandung', label: 'Orang Tua Kandung' },
    { value: 'Ibu / ayah tiri', label: 'Ibu / Ayah Tiri' },
    { value: 'Ayah / ibu angkat', label: 'Ayah / Ibu Angkat' },
    { value: 'Saudara kandung', label: 'Saudara Kandung' },
    { value: 'Paman / bibi', label: 'Paman / Bibi' }
  ]
};

// ============================================================
// FAMILY AND SCHOOL LIFE QUESTIONS (Q95 - Q128)
// ============================================================
const FAMILY_AND_SCHOOL_LIFE_QUESTIONS: { id: string; text: string; num: number }[] = [
  { id: 'q95', num: 95, text: 'Orang tua saya peduli dengan perkembangan belajar saya' },
  { id: 'q96', num: 96, text: 'Saya selalu berkomunikasi akrab dengan orang tua' },
  { id: 'q97', num: 97, text: 'Saya bisa menjadi pribadi yang mandiri' },
  // 🔥 Q98 DIPERBAIKI - max 50 karakter
  { 
    id: 'q98', 
    num: 98, 
    text: 'Saya sedang memiliki konflik pribadi (max 50 karakter)'
  },
  { id: 'q99', num: 99, text: 'Saya memahami tentang norma/cara membangun berkeluarga' },
  { id: 'q100', num: 100, text: 'Saya banyak mengenal lingkungan sekolah baru' },
  { id: 'q101', num: 101, text: 'Saya memahami tentang kenakalan remaja' },
  { id: 'q102', num: 102, text: 'Saya masih sedikit mengetahui tentang dampak pergaulan bebas' },
  { id: 'q103', num: 103, text: 'Saya banyak mengenal tentang perilaku sosial yang bertanggung jawab' },
  { id: 'q104', num: 104, text: 'Saya tahu tentang bullying dan cara mensikapinya' },
  { id: 'q105', num: 105, text: 'Saya sukar bergaul dengan teman-teman di sekolah' },
  { id: 'q106', num: 106, text: 'Sering saya dianggap tidak sopan pada orang lain' },
  { id: 'q107', num: 107, text: 'Saya kurang memahami dampak dari media social' },
  { id: 'q108', num: 108, text: 'Saya jarang bermain/berteman di lingkungan tempat saya tinggal' },
  { id: 'q109', num: 109, text: 'Saya memiliki banyak teman atau sahabat' },
  { id: 'q110', num: 110, text: 'Saya kurang suka berkomunikasi dengan teman lawan jenis' },
  { id: 'q111', num: 111, text: 'Saya tahu cara belajar yang baik dan benar di SMK/MAK' },
  { id: 'q112', num: 112, text: 'Saya tahu cara meraih prestasi di sekolah' },
  { id: 'q113', num: 113, text: 'Saya paham tentang gaya belajar dan strategi yang sesuai dengannya' },
  { id: 'q114', num: 114, text: 'Orang tua saya tidak peduli dengan kegiatan belajar saya' },
  { id: 'q115', num: 115, text: 'Saya masih sering menunda-nunda tugas sekolah/pekerjaan rumah (PR)' },
  { id: 'q116', num: 116, text: 'Saya merasa kesulitan dalam memahami pelajaran tertentu' },
  { id: 'q117', num: 117, text: 'Saya tahu cara memanfaatkan sumber belajar' },
  { id: 'q118', num: 118, text: 'Saya belajarnya jika akan ada tes atau ujian saja' },
  { id: 'q119', num: 119, text: 'Saya tahu tentang struktur kurikulum yang ada di sekolah' },
  { id: 'q120', num: 120, text: 'Saya merasa malas belajar dan kalau belajar sering ngantuk' },
  { id: 'q121', num: 121, text: 'Saya terbiasa belajar bersama atau belajar kelompok' },
  { id: 'q122', num: 122, text: 'Saya paham cara memilih lembaga bimbingan belajar yang baik' },
  { id: 'q123', num: 123, text: 'Saya dapat memanfaatkan teknologi informasi untuk belajar' },
  { id: 'q124', num: 124, text: 'Saya tahu cara memperoleh bantuan pendidikan (beasiswa)' },
  { id: 'q125', num: 125, text: 'Saya terpaksa harus bekerja untuk mencukupi kebutuhan hidup' },
  { id: 'q126', num: 126, text: 'Saya merasa bingung memilih kegiatan esktrakurikuler di sekolah' },
  { id: 'q127', num: 127, text: 'Saya merasa mantap pada pilihan peminatan yang diambil' },
  { id: 'q128', num: 128, text: 'Saya merasa paham hubungan antara hobi, bakat, minat, kemampuan dan karir' }
];

// ============================================================
// PLANNING AND PROBLEMS QUESTIONS (Q129 - Q133)
// ============================================================
const PLANNING_AND_PROBLEMS_QUESTIONS: Question[] = [
  { id: 'q129', number: 129, text: 'Saya memiliki perencanaan karir masa depan', type: 'select', required: true, options: IYA_BELUM },
  { id: 'q130', number: 130, text: 'Tuliskan masalah pribadi apa yang sedang dialami (maksimal 50 karakter)', type: 'text', required: true, maxLength: 50, placeholder: 'Contoh: Sulit berkonsentrasi saat ramai, dsb.' },
  { id: 'q131', number: 131, text: 'Tuliskan masalah belajar apa yang sedang dialami (maksimal 50 karakter)', type: 'text', required: true, maxLength: 50, placeholder: 'Contoh: Bingung membagi waktu belajar kelompok.' },
  { id: 'q132', number: 132, text: 'Tuliskan masalah sosial apa yang sedang dialami (maksimal 50 karakter)', type: 'text', required: true, maxLength: 50, placeholder: 'Contoh: Canggung saat beradaptasi dengan teman baru.' },
  { id: 'q133', number: 133, text: 'Tuliskan masalah karir apa yang sedang dialami (maksimal 50 karakter)', type: 'text', required: true, maxLength: 50, placeholder: 'Contoh: Belum mantap memilih universitas.' }
];

// ============================================================
// MATERIAL COMPREHENSION QUESTIONS (Q134 - Q141)
// ============================================================
const MATERIAL_COMPREHENSION_QUESTIONS: { id: string; text: string; num: number }[] = [
  { id: 'q134', num: 134, text: 'Saya memahami materi stop perundungan (bullying)' },
  { id: 'q135', num: 135, text: 'Saya memahami materi brain root / pornografi' },
  { id: 'q136', num: 136, text: 'Saya memahami materi Stop NAPZA (narkoba)' },
  { id: 'q137', num: 137, text: 'Saya memahami materi burnout akademik' },
  { id: 'q138', num: 138, text: 'Saya memahami materi literasi emosi' },
  { id: 'q139', num: 139, text: 'Saya memahami materi merangkul keberagaman' },
  { id: 'q140', num: 140, text: 'Saya memahami materi etika akademik di era AI (Kecerdasan Buatan)' },
  { id: 'q141', num: 141, text: 'Saya sudah memahami bahwa saya harus menjaga aset sekolah untuk digunakan sesuai dengan aturan yang berlaku' }
];

// ============================================================
// GOAL AND SOFT SKILL QUESTIONS (Q142 - Q156)
// ============================================================
const GOAL_AND_SOFT_SKILL_QUESTIONS: { id: string; text: string; num: number }[] = [
  { id: 'q142', num: 142, text: 'Saya sudah memiliki cita-cita atau tujuan yang ingin saya capai di masa depan.' },
  { id: 'q143', num: 143, text: 'Saya mengetahui alasan memilih program keahlian/jurusan yang saya pelajari saat ini.' },
  { id: 'q144', num: 144, text: 'Saya mengetahui bidang pekerjaan yang berhubungan dengan program keahlian saya.' },
  { id: 'q145', num: 145, text: 'Saya mengetahui keterampilan yang perlu saya kuasai agar berhasil di jurusan saya.' },
  { id: 'q146', num: 146, text: 'Saya mengetahui pentingnya kompetensi dan sertifikasi untuk masa depan karier saya.' },
  { id: 'q147', num: 147, text: 'Saya senang mempelajari hal-hal baru yang berkaitan dengan program keahlian saya.' },
  { id: 'q148', num: 148, text: 'Saya memiliki semangat untuk belajar dan berprestasi selama menempuh pendidikan di SMK.' },
  { id: 'q149', num: 149, text: 'Saya memahami pentingnya disiplin, tanggung jawab, dan etos kerja dalam dunia kerja.' },
  { id: 'q150', num: 150, text: 'Saya mengetahui kegiatan sekolah yang dapat membantu mengembangkan kemampuan dan keterampilan saya.' },
  { id: 'q151', num: 151, text: 'Saya mengetahui bahwa persiapan karier perlu dimulai sejak kelas X.' },
  { id: 'q152', num: 152, text: 'Saya mulai mengenali minat dan bidang yang saya sukai untuk dikembangkan di masa depan.' },
  { id: 'q153', num: 153, text: 'Saya mulai mengenali kemampuan dan kelebihan yang saya miliki.' },
  { id: 'q154', num: 154, text: 'Saya memiliki gambaran kegiatan atau pengalaman yang dapat membantu mencapai cita-cita saya.' },
  { id: 'q155', num: 155, text: 'Saya mengetahui bahwa PKL, organisasi, dan kegiatan sekolah dapat mendukung masa depan saya.' },
  { id: 'q156', num: 156, text: 'Saya memiliki rencana yang ingin dicapai selama belajar di SMK.' }
];

// ============================================================
// FUTURE PLAN QUESTIONS (Q157 - Q166)
// ============================================================
const FUTURE_PLAN_QUESTIONS: Question[] = [
  {
    id: 'q157',
    number: 157,
    text: 'Alasan utama saya memilih program keahlian/jurusan ini adalah …. (Pilih 1)',
    type: 'select',
    required: true,
    hasOther: true,
    options: [
      { value: 'Sesuai dengan minat saya', label: 'Sesuai dengan minat saya' },
      { value: 'Sesuai dengan cita-cita atau pekerjaan yang saya inginkan', label: 'Sesuai dengan cita-cita atau pekerjaan yang saya inginkan' },
      { value: 'Atas saran orang tua atau keluarga', label: 'Atas saran orang tua atau keluarga' },
      { value: 'Karena peluang kerja yang baik', label: 'Karena peluang kerja yang baik' },
      { value: 'Mengikuti teman atau saudara', label: 'Mengikuti teman atau saudara' }
    ]
  },
  {
    id: 'q158',
    number: 158,
    text: 'Setelah lulus SMK, saya berencana untuk …. (Pilih 1)',
    type: 'select',
    required: true,
    options: [
      { value: 'Bekerja', label: 'Bekerja' },
      { value: 'Melanjutkan kuliah', label: 'Melanjutkan kuliah' },
      { value: 'Berwirausaha', label: 'Berwirausaha' },
      { value: 'Bekerja sambil kuliah', label: 'Bekerja sambil kuliah' },
      { value: 'Belum menentukan', label: 'Belum menentukan' }
    ]
  },
  {
    id: 'q159',
    number: 159,
    text: 'Pekerjaan atau profesi yang paling saya minati saat ini adalah …. (Pilih 1)',
    type: 'select',
    required: true,
    options: [
      { value: 'Sesuai bidang keahlian yang saya pelajari', label: 'Sesuai bidang keahlian yang saya pelajari' },
      { value: 'Bidang lain yang masih berkaitan dengan teknologi', label: 'Bidang lain yang masih berkaitan dengan teknologi' },
      { value: 'Menjadi wirausahawan', label: 'Menjadi wirausahawan' },
      { value: 'Menjadi ASN/TNI/Polri', label: 'Menjadi ASN / TNI / Polri' },
      { value: 'Belum memiliki gambaran pekerjaan', label: 'Belum memiliki gambaran pekerjaan' }
    ]
  },
  {
    id: 'q160',
    number: 160,
    text: 'Hal yang paling ingin saya pelajari selama bersekolah di SMK adalah …. (Pilih 1)',
    type: 'select',
    required: true,
    options: [
      { value: 'Keterampilan teknis sesuai jurusan', label: 'Keterampilan teknis sesuai jurusan' },
      { value: 'Penggunaan teknologi dan aplikasi digital', label: 'Penggunaan teknologi dan aplikasi digital' },
      { value: 'Kewirausahaan', label: 'Kewirausahaan' },
      { value: 'Komunikasi dan kerja sama tim', label: 'Komunikasi dan kerja sama tim' },
      { value: 'Persiapan memasuki dunia kerja', label: 'Persiapan memasuki dunia kerja' }
    ]
  },
  {
    id: 'q161',
    number: 161,
    text: 'Kemampuan yang paling ingin saya miliki setelah lulus SMK adalah …. (Pilih 1)',
    type: 'select',
    required: true,
    options: [
      { value: 'Keterampilan kerja sesuai jurusan', label: 'Keterampilan kerja sesuai jurusan' },
      { value: 'Kemampuan berwirausaha', label: 'Kemampuan berwirausaha' },
      { value: 'Kemampuan menggunakan teknologi digital', label: 'Kemampuan menggunakan teknologi digital' },
      { value: 'Kemampuan komunikasi dan presentasi', label: 'Kemampuan komunikasi dan presentasi' },
      { value: 'Kemampuan memimpin dan bekerja dalam tim', label: 'Kemampuan memimpin dan bekerja dalam tim' }
    ]
  },
  {
    id: 'q162',
    number: 162,
    text: 'Kegiatan yang paling ingin saya ikuti untuk mengembangkan diri selama di SMK adalah …. (Pilih 1)',
    type: 'select',
    required: true,
    options: [
      { value: 'Organisasi sekolah', label: 'Organisasi sekolah' },
      { value: 'Ekstrakurikuler', label: 'Ekstrakurikuler' },
      { value: 'Lomba kompetensi', label: 'Lomba kompetensi' },
      { value: 'Pelatihan atau sertifikasi', label: 'Pelatihan atau sertifikasi' },
      { value: 'Program magang/PKL', label: 'Program magang/PKL' }
    ]
  },
  {
    id: 'q163',
    number: 163,
    text: 'Menurut saya, hal yang paling penting untuk mencapai cita-cita adalah …. (Pilih 1)',
    type: 'select',
    required: true,
    options: [
      { value: 'Belajar dengan sungguh-sungguh', label: 'Belajar dengan sungguh-sungguh' },
      { value: 'Mengembangkan keterampilan sesuai jurusan', label: 'Mengembangkan keterampilan sesuai jurusan' },
      { value: 'Memiliki disiplin dan tanggung jawab', label: 'Memiliki disiplin dan tanggung jawab' },
      { value: 'Aktif mengikuti kegiatan sekolah', label: 'Aktif mengikuti kegiatan sekolah' },
      { value: 'Membangun pengalaman dan relasi', label: 'Membangun pengalaman dan relasi' }
    ]
  },
  {
    id: 'q164',
    number: 164,
    text: 'Harapan terbesar saya setelah belajar di SMK ini adalah …. (Pilih 1)',
    type: 'select',
    required: true,
    options: [
      { value: 'Mendapatkan pekerjaan yang sesuai', label: 'Mendapatkan pekerjaan yang sesuai' },
      { value: 'Diterima di perguruan tinggi', label: 'Diterima di perguruan tinggi' },
      { value: 'Memiliki keterampilan yang dibutuhkan dunia kerja', label: 'Memiliki keterampilan yang dibutuhkan dunia kerja' },
      { value: 'Menjadi wirausahawan yang sukses', label: 'Menjadi wirausahawan yang sukses' },
      { value: 'Menjadi pribadi yang mandiri dan percaya diri', label: 'Menjadi pribadi yang mandiri dan percaya diri' }
    ]
  },
  {
    id: 'q165',
    number: 165,
    text: 'Seberapa yakin Anda bahwa jurusan yang dipilih sudah sesuai dengan minat Anda?',
    type: 'select',
    required: true,
    options: [
      { value: 'Sangat yakin', label: 'Sangat yakin' },
      { value: 'Yakin', label: 'Yakin' },
      { value: 'Cukup yakin', label: 'Cukup yakin' },
      { value: 'Kurang yakin', label: 'Kurang yakin' },
      { value: 'Belum yakin', label: 'Belum yakin' }
    ]
  },
  {
    id: 'q166',
    number: 166,
    text: 'Informasi tentang karier atau pekerjaan paling sering saya peroleh dari …. (Pilih 1)',
    type: 'select',
    required: true,
    options: [
      { value: 'Orang tua atau keluarga', label: 'Orang tua atau keluarga' },
      { value: 'Guru/BK', label: 'Guru / BK' },
      { value: 'Teman', label: 'Teman' },
      { value: 'Media sosial atau internet', label: 'Media sosial atau internet' },
      { value: 'Alumni atau dunia kerja', label: 'Alumni atau dunia kerja' }
    ]
  }
];

// ============================================================
// FUNGSI getQuestionsList - Menggabungkan semua pertanyaan
// ============================================================
export const getQuestionsList = (): Question[] => {
  const result: Question[] = [];

  // 1. Add questions 1 to 68 (Q69 dan Q70 dihapus)
  result.push(...QUESTIONS_1_TO_70);

  // 2. Add self reflections (71 - 87)
  const selfRef: Question[] = SELF_REFLECTION_QUESTIONS.map(q => ({
    id: q.id,
    number: q.num,
    text: q.text,
    type: 'select',
    required: true,
    options: TIDAK_KADANG_SELALU
  }));
  result.push(...selfRef);

  // 3. Add q88
  result.push(HUBUNGAN_WALI_Q);

  // 4. Add family/school statements (95 - 128)
  const famSch: Question[] = FAMILY_AND_SCHOOL_LIFE_QUESTIONS.map(q => ({
    id: q.id,
    number: q.num,
    text: q.text,
    type: 'select',
    required: true,
    options: TIDAK_KADANG_SELALU
  }));
  result.push(...famSch);

  // 5. Add planning and problems questions (129 - 133)
  result.push(...PLANNING_AND_PROBLEMS_QUESTIONS);

  // 6. Add material comprehension (134 - 141)
  const materials: Question[] = MATERIAL_COMPREHENSION_QUESTIONS.map(q => ({
    id: q.id,
    number: q.num,
    text: q.text,
    type: 'select',
    required: true,
    options: IYA_BELUM
  }));
  result.push(...materials);

  // 7. Add goal and soft skill questions (142 - 156)
  const goals: Question[] = GOAL_AND_SOFT_SKILL_QUESTIONS.map(q => ({
    id: q.id,
    number: q.num,
    text: q.text,
    type: 'select',
    required: true,
    options: IYA_BELUM
  }));
  result.push(...goals);

  // 8. Add final planning questions (157 - 166)
  result.push(...FUTURE_PLAN_QUESTIONS);

  // Sort them strictly by question number
  return result.sort((a, b) => a.number - b.number);
};

// ============================================================
// QUESTION_GROUPS - Pengelompokan berdasarkan kategori
// ============================================================
export const QUESTION_GROUPS: QuestionGroup[] = [
  {
    id: 'basic',
    title: 'Profil Dasar & Kontak',
    icon: 'User',
    description: 'Data pribadi siswa, kontak WhatsApp, email, media sosial, dan data verifikasi berkas.',
    questions: getQuestionsList().filter(q => q.number >= 1 && q.number <= 17)
  },
  {
    id: 'family',
    title: 'Keluarga & Wali',
    icon: 'Users',
    description: 'Informasi orang tua/wali kandung, kontak darurat, pekerjaan, dan kondisi penanggung jawab biaya.',
    questions: getQuestionsList().filter(q => q.number >= 18 && q.number <= 36)
  },
  {
    id: 'personality',
    title: 'Kepribadian & Refleksi Diri',
    icon: 'Heart',
    description: 'Informasi kepercayaan, hubungan pertemanan, riwayat kesehatan, dan refleksi emosional siswa.',
    questions: getQuestionsList().filter(q => (q.number >= 37 && q.number <= 42) || (q.number >= 71 && q.number <= 98))
  },
  {
    id: 'interests',
    title: 'Minat, Bakat & Prestasi',
    icon: 'Award',
    description: 'Pilihan minat belajar, musik, olahraga, karya tulis, dan target ekstrakurikuler serta motivasi berprestasi.',
    questions: getQuestionsList().filter(q => (q.number >= 43 && q.number <= 55) || q.number === 67 || q.number === 68)
  },
  {
    id: 'school_origin',
    title: 'Sekolah Asal & Adaptasi',
    icon: 'GraduationCap',
    description: 'Asal sekolah SMP/MTs, kebiasaan belajar, jarak rumah, transportasi, dan koordinat GPS rumah tinggal.',
    questions: getQuestionsList().filter(q => (q.number >= 56 && q.number <= 66) || q.number === 69)
  },
  {
    id: 'career_future',
    title: 'Karir & Pemahaman Materi',
    icon: 'Briefcase',
    description: 'Rencana masa depan karir, permasalahan pribadi/belajar, pemahaman materi pembinaan MPLS, serta keyakinan jurusan.',
    questions: getQuestionsList().filter(q => (q.number >= 99 && q.number <= 128) || (q.number >= 129 && q.number <= 133) || (q.number >= 134 && q.number <= 141) || (q.number >= 142 && q.number <= 156) || (q.number >= 157 && q.number <= 166))
  }
];