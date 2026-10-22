import { Question, TeacherTokenPackage, StudentSubmission } from '../types/game';
import { 
  CONFIGURED_GAS_URL,
  getGasApiUrl, 
  saveGasApiUrl, 
  testGasConnection, 
  syncTokenToGas, 
  fetchTokenFromGas, 
  fetchAllTokensFromGas,
  deleteTokenFromGas,
  syncSubmissionToGas, 
  fetchSubmissionsFromGas,
  GAS_SCRIPT_CODE
} from './gasDatabase';

const TOKENS_KEY = 'pvs_teacher_tokens';
const SUBMISSIONS_KEY = 'pvs_student_submissions';

// Re-export GAS database functions and configuration for convenience
export { 
  CONFIGURED_GAS_URL,
  getGasApiUrl, 
  saveGasApiUrl, 
  testGasConnection, 
  syncTokenToGas, 
  fetchTokenFromGas, 
  fetchAllTokensFromGas,
  deleteTokenFromGas,
  syncSubmissionToGas, 
  fetchSubmissionsFromGas,
  GAS_SCRIPT_CODE
};

// ==========================================
// 1. FUNGSI UNTUK PORTAL GURU (TOKEN & SOAL)
// ==========================================
export const getTeacherTokens = (): TeacherTokenPackage[] => {
  try {
    const data = localStorage.getItem(TOKENS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

export const saveTeacherTokens = (tokens: TeacherTokenPackage[]) => {
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  } catch (err) {
    console.error('Gagal menyimpan tokens ke localStorage:', err);
  }
};

export const generateTokenCode = (prefix: string = 'GURU'): string => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
};

/**
 * Mencari paket token secara sinkron di localStorage
 */
export const findTokenPackage = (tokenCode: string): TeacherTokenPackage | null => {
  const tokens = getTeacherTokens();
  return tokens.find(t => t.token.toUpperCase() === tokenCode.trim().toUpperCase()) || null;
};

/**
 * Mencari paket token secara asinkron:
 * 1. Cek di localStorage terlebih dahulu (cepat).
 * 2. Jika tidak ditemukan dan ada koneksi Google Sheets/Apps Script, cari di Google Spreadsheet.
 * 3. Jika ditemukan di Spreadsheet, otomatis disimpan di localStorage agar bisa dimainkan offline.
 */
export const findTokenPackageAsync = async (tokenCode: string): Promise<TeacherTokenPackage | null> => {
  const cleaned = tokenCode.trim().toUpperCase();
  if (!cleaned) return null;

  // 1. Cek lokal terlebih dahulu
  const localTokens = getTeacherTokens();
  const localMatch = localTokens.find(t => t.token.toUpperCase() === cleaned);
  if (localMatch && localMatch.questions && localMatch.questions.length > 0) {
    return localMatch;
  }

  // 2. Jika tidak ada di lokal, periksa remote Google Apps Script
  const gasUrl = getGasApiUrl();
  if (gasUrl) {
    try {
      const res = await fetchTokenFromGas(cleaned, gasUrl);
      if (res.success && res.package && res.package.questions && res.package.questions.length > 0) {
        // Simpan ke lokal agar perangkat siswa memiliki cache
        const exists = localTokens.some(t => t.token.toUpperCase() === cleaned);
        if (!exists) {
          saveTeacherTokens([res.package, ...localTokens]);
        }
        return res.package;
      }
    } catch (err) {
      console.warn('Gagal mencari token di Apps Script remote:', err);
    }
  }

  return localMatch || null;
};

export const fetchQuestionsFromGoogleSheets = async (url: string): Promise<{ questions: Question[], error?: string }> => {
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) return { questions: [], error: 'URL Google Spreadsheet tidak valid.' };
    const sheetId = match[1];
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    const response = await fetch(csvUrl);
    
    if (!response.ok) return { questions: [], error: 'Gagal mengunduh. Pastikan spreadsheet di-share "Anyone with the link".' };

    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    const questions: Question[] = [];
    
    // Lewati baris pertama (header)
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(/[,\t]/).map(cell => cell.replace(/^"|"$/g, '').trim());
      if (row.length >= 2 && row[0] && row[1]) {
        questions.push({
          id: `q-sheet-${i}-${Date.now().toString(36)}`,
          question: row[0],
          correctAnswer: row[1],
          distractor1: row[2] || '',
          distractor2: row[3] || '',
          distractor3: row[4] || ''
        });
      }
    }
    
    if (questions.length === 0) return { questions: [], error: 'Tidak ada soal valid yang ditemukan.' };
    return { questions };
  } catch (err) {
    return { questions: [], error: 'Terjadi kesalahan jaringan.' };
  }
};

// ==========================================
// 2. FUNGSI UNTUK NILAI SISWA (SUBMISSIONS)
// ==========================================
export const getStudentSubmissions = (): StudentSubmission[] => {
  try {
    const data = localStorage.getItem(SUBMISSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
};

/**
 * Menyimpan nilai siswa secara lokal DAN otomatis sinkronisasi ke Google Apps Script di background
 */
export const saveStudentSubmission = (submission: StudentSubmission) => {
  const subs = getStudentSubmissions();
  
  // Mencegah duplikat jika tersimpan otomatis lalu siswa klik "Kirim" lagi
  const existingIndex = subs.findIndex(
    s => s.studentName.trim().toLowerCase() === submission.studentName.trim().toLowerCase() && 
         s.token.toUpperCase() === submission.token.toUpperCase() &&
         s.accuracy === submission.accuracy &&
         s.zombiesKilled === submission.zombiesKilled &&
         Math.abs(s.timestamp - submission.timestamp) < 15000 // toleransi 15 detik
  );
  
  if (existingIndex >= 0) {
    subs[existingIndex] = submission;
  } else {
    subs.push(submission);
  }
  
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(subs));

  // Otomatis kirim ke Google Sheets database jika URL sudah diisi
  const gasUrl = getGasApiUrl();
  if (gasUrl) {
    syncSubmissionToGas(submission, gasUrl).catch(err => {
      console.warn('Latar belakang sinkronisasi nilai ke Apps Script gagal:', err);
    });
  }
};

/**
 * Mengambil rekap nilai dari Google Apps Script dan menggabungkannya dengan data lokal
 */
export const syncAndGetSubmissions = async (tokenFilter?: string): Promise<StudentSubmission[]> => {
  const localSubs = getStudentSubmissions();
  const gasUrl = getGasApiUrl();
  
  if (!gasUrl) {
    return tokenFilter && tokenFilter !== 'ALL'
      ? localSubs.filter(s => s.token.toUpperCase() === tokenFilter.trim().toUpperCase())
      : localSubs;
  }

  try {
    const res = await fetchSubmissionsFromGas(tokenFilter, gasUrl);
    if (res.success && res.submissions) {
      // Gabungkan data remote dan lokal tanpa duplikasi (berdasarkan id atau kombinasi nama+token+timestamp)
      const mergedMap = new Map<string, StudentSubmission>();
      
      // Masukkan local dulu
      localSubs.forEach(s => {
        const key = `${s.studentName.toLowerCase()}_${s.token.toUpperCase()}_${s.timestamp}`;
        mergedMap.set(key, s);
      });

      // Timpa atau tambahkan dari Google Sheets
      res.submissions.forEach(s => {
        const key = `${s.studentName.toLowerCase()}_${s.token.toUpperCase()}_${s.timestamp}`;
        mergedMap.set(key, s);
      });

      const merged = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
      localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(merged));

      return tokenFilter && tokenFilter !== 'ALL'
        ? merged.filter(s => s.token.toUpperCase() === tokenFilter.trim().toUpperCase())
        : merged;
    }
  } catch (err) {
    console.warn('Gagal sinkronisasi nilai dari Google Sheets:', err);
  }

  return tokenFilter && tokenFilter !== 'ALL'
    ? localSubs.filter(s => s.token.toUpperCase() === tokenFilter.trim().toUpperCase())
    : localSubs;
};

export const exportSubmissionsToCsv = (subs: StudentSubmission[]): string => {
  const headers = ['Nama Siswa', 'Token', 'Benar', 'Total Soal', 'Akurasi (%)', 'Zombi', 'Matahari', 'Hasil', 'Waktu'];
  const rows = subs.map(s => [
    s.studentName, s.token, s.questionsCorrect, s.questionsAnswered,
    s.accuracy, s.zombiesKilled, s.sunsCollected,
    s.gameOutcome === 'victory' ? 'Menang' : 'Kalah',
    new Date(s.timestamp).toLocaleString('id-ID')
  ]);
  return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
};

// ==========================================
// 3. FUNGSI UNTUK SPREADSHEET PARSER MANUAL
// ==========================================
export const parseSpreadsheetData = (text: string, isDirectPaste: boolean = false): Question[] => {
  const lines = text.split('\n').filter(line => line.trim() !== '');
  const questions: Question[] = [];
  const startIndex = isDirectPaste ? 0 : 1; 

  for (let i = startIndex; i < lines.length; i++) {
    const row = lines[i].split(/[,\t]/).map(cell => cell.replace(/^"|"$/g, '').trim());
    if (row.length >= 2 && row[0] && row[1]) {
      questions.push({
        id: `q-paste-${i}-${Date.now().toString(36)}`,
        question: row[0],
        correctAnswer: row[1],
        distractor1: row[2] || '',
        distractor2: row[3] || '',
        distractor3: row[4] || ''
      });
    }
  }
  return questions;
};