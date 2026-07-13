import { Student } from './types';
import { getQuestionsList } from './questionsData';

/**
 * Generates and downloads a CSV file containing all answered student columns.
 * Contains 166 columns + student metadata.
 */
export function exportToCSV(students: Student[]) {
  const questions = getQuestionsList();
  
  // Define headers: Metadata first, then Q1 to Q166
  const headers = [
    'NISN',
    'Nama Lengkap',
    'Status Pengisian',
    'Persentase Progress',
    'Terakhir Diperbarui',
    ...questions.map(q => `Pertanyaan ${q.number}: ${q.text.replace(/"/g, '""')}`)
  ];

  // Map students to rows
  const rows = students.map(student => {
    const metadata = [
      student.nis,
      student.name,
      student.progress === 'completed' ? 'Sudah Mengisi' : student.progress === 'in_progress' ? 'Proses Mengisi' : 'Belum Mengisi',
      `${student.progressPercent}%`,
      student.lastUpdated ? new Date(student.lastUpdated).toLocaleString('id-ID') : '-'
    ];

    const answers = questions.map(q => {
      let val = student.answers[q.id];
      
      // Handle check-box or list values
      if (Array.isArray(val)) {
        val = val.join(', ');
      } else if (val === undefined || val === null) {
        val = '';
      }
      
      // Handle conditional other inputs
      const otherVal = student.answers[`${q.id}_other`];
      if (otherVal) {
        val = `${val} (Lainnya: ${otherVal})`;
      }

      return `"${String(val).replace(/"/g, '""')}"`;
    });

    return [...metadata, ...answers].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n'); // Add BOM for Excel UTF-8 support
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `data_mpls_smkn1_nglegok_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Calculates current progress percentage for a student's answers
 */
export function calculateProgressPercent(answers: Record<string, any>, questions: any[]): number {
  if (!answers) return 0;
  
  let filledCount = 0;
  let totalApplicable = 0;

  questions.forEach(q => {
    // Check if question is applicable (dependsOn check)
    let isApplicable = true;
    if (q.dependsOn) {
      const parentVal = answers[q.dependsOn.questionId];
      if (q.dependsOn.condition === 'equals' && parentVal !== q.dependsOn.value) {
        isApplicable = false;
      } else if (q.dependsOn.condition === 'not_equals' && parentVal === q.dependsOn.value) {
        isApplicable = false;
      } else if (q.dependsOn.condition === 'includes' && (!Array.isArray(parentVal) || !parentVal.includes(q.dependsOn.value))) {
        isApplicable = false;
      }
    }

    if (isApplicable) {
      totalApplicable++;
      const val = answers[q.id];
      if (val !== undefined && val !== null && val !== '') {
        // For array values, ensure it has items
        if (Array.isArray(val)) {
          if (val.length > 0 && !val.includes('')) {
            filledCount++;
          }
        } else {
          filledCount++;
        }
      }
    }
  });

  if (totalApplicable === 0) return 0;
  return Math.round((filledCount / totalApplicable) * 100);
}

/**
 * Formats standard coordinates to GPS format
 */
export function formatGPS(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}
