import { TeacherTokenPackage, StudentSubmission, Question } from '../types/game';

const GAS_URL_KEY = 'pvz_gas_api_url';

/**
 * ============================================================
 * KONFIGURASI DATABASE GOOGLE APPS SCRIPT WEB APP
 * ============================================================
 * Tempel URL Web App Google Apps Script Anda (akhiran /exec) di bawah ini:
 * Contoh: 'https://script.google.com/macros/s/AKfycb.../exec'
 */
export const CONFIGURED_GAS_URL: string = 'https://script.google.com/macros/s/AKfycbzE0WtvpF-X7s9MNlyxfuCs6pPMpn94naHmORQkYbwIVxFM4-411UsqNcgmHu5ay4Zi/exec';

export const GAS_SCRIPT_CODE = `/**
 * ============================================================
 * GOOGLE APPS SCRIPT DATABASE - PLANTS VS ZOMBIES EDUKASI
 * Database Terpusat: Token Soal Guru & Rekap Nilai Siswa
 * ============================================================
 * 
 * CARA MEMASANG (HANYA SEKALI):
 * 1. Buka Google Spreadsheet baru di https://sheets.new
 * 2. Beri nama spreadsheet Anda, misal: "Database PvZ Edukasi Guru"
 * 3. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 4. Hapus semua tulisan di file Code.gs, lalu TEMPEL SELURUH KODE INI.
 * 5. Klik ikon "Simpan" (Ctrl+S / Cmd+S).
 * 6. Klik tombol biru "Terapkan" (Deploy) di kanan atas > pilih "Penerapan baru" (New deployment).
 * 7. Klik ikon Gerigi (Select type) > pilih "Aplikasi Web" (Web app).
 * 8. Konfigurasi:
 *    - Deskripsi: Database PvZ Edukasi
 *    - Jalankan sebagai (Execute as): Saya (Me)
 *    - Siapa yang memiliki akses (Who has access): SIAPA SAJA (Anyone)  <-- PENTING!
 * 9. Klik "Terapkan" (Deploy).
 * 10. Jika muncul peringatan izin ("Authorization required"):
 *     - Klik "Izinkan akses" (Authorize access)
 *     - Pilih akun Google Anda
 *     - Klik "Advanced" (Lanjutan) di kiri bawah
 *     - Klik "Go to ... (unsafe)" / "Buka ... (tidak aman)"
 *     - Klik "Allow" (Izinkan).
 * 11. Salin "URL Aplikasi Web" (akhiran /exec) dan tempel di Portal Guru game!
 */

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  var output = { success: false };
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheets(ss);

    var params = (e && e.parameter) ? e.parameter : {};
    var action = params.action;
    var postData = null;

    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
        if (postData.action) {
          action = postData.action;
        }
      } catch (err) {}
    }

    if (action === 'ping') {
      output = {
        success: true,
        message: 'Database Google Spreadsheet & Apps Script Berhasil Terhubung!',
        spreadsheetName: ss.getName(),
        timestamp: new Date().getTime()
      };
    } else if (action === 'saveToken') {
      var pkg = (postData && postData.package) ? postData.package : JSON.parse(params.package || '{}');
      output = saveTokenToSheet(ss, pkg);
    } else if (action === 'getToken') {
      var tokenCode = params.token || (postData ? postData.token : '');
      output = getTokenFromSheet(ss, tokenCode);
    } else if (action === 'getAllTokens') {
      output = getAllTokensFromSheet(ss);
    } else if (action === 'deleteToken') {
      var delCode = params.token || (postData ? postData.token : '');
      output = deleteTokenFromSheet(ss, delCode);
    } else if (action === 'saveSubmission') {
      var sub = (postData && postData.submission) ? postData.submission : JSON.parse(params.submission || '{}');
      output = saveSubmissionToSheet(ss, sub);
    } else if (action === 'getSubmissions') {
      var filterToken = params.token || (postData ? postData.token : '');
      output = getSubmissionsFromSheet(ss, filterToken);
    } else {
      output = {
        success: false,
        error: 'Aksi database tidak dikenali: ' + action
      };
    }
  } catch (err) {
    output = {
      success: false,
      error: err.toString()
    };
  }

  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function initSheets(ss) {
  var sheetTokens = ss.getSheetByName('Tokens');
  if (!sheetTokens) {
    sheetTokens = ss.insertSheet('Tokens');
    sheetTokens.appendRow(['Token', 'Judul Kuis', 'Spreadsheet URL', 'Jumlah Soal', 'Data Soal (JSON)', 'Tanggal Dibuat']);
    sheetTokens.getRange(1, 1, 1, 6).setBackground('#064e3b').setFontColor('#ffffff').setFontWeight('bold');
    sheetTokens.setFrozenRows(1);
  }

  var sheetSubs = ss.getSheetByName('Nilai_Siswa');
  if (!sheetSubs) {
    sheetSubs = ss.insertSheet('Nilai_Siswa');
    sheetSubs.appendRow([
      'ID', 'Nama Siswa', 'Token', 'Judul Kuis', 'Benar', 'Total Soal',
      'Akurasi (%)', 'Zombi', 'Matahari', 'Hasil', 'Level', 'Gelombang', 'Waktu Pengiriman', 'Timestamp'
    ]);
    sheetSubs.getRange(1, 1, 1, 14).setBackground('#1e3a8a').setFontColor('#ffffff').setFontWeight('bold');
    sheetSubs.setFrozenRows(1);
  }
}

function saveTokenToSheet(ss, pkg) {
  if (!pkg || !pkg.token) {
    return { success: false, error: 'Data paket token tidak valid' };
  }
  var sheet = ss.getSheetByName('Tokens');
  var tokenUpper = String(pkg.token).trim().toUpperCase();
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === tokenUpper) {
      rowIndex = i + 1;
      break;
    }
  }

  var questionsJson = JSON.stringify(pkg.questions || []);
  var dateStr = new Date(pkg.createdAt || new Date().getTime()).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  var rowData = [
    tokenUpper,
    pkg.title || ('Kuis ' + tokenUpper),
    pkg.spreadsheetUrl || '',
    (pkg.questions ? pkg.questions.length : 0),
    questionsJson,
    dateStr
  ];

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { success: true, token: tokenUpper, message: 'Token berhasil disimpan di database Spreadsheet!' };
}

function getTokenFromSheet(ss, tokenCode) {
  if (!tokenCode) return { success: false, error: 'Token kosong' };
  var sheet = ss.getSheetByName('Tokens');
  var target = String(tokenCode).trim().toUpperCase();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === target) {
      var questions = [];
      try {
        questions = JSON.parse(data[i][4]);
      } catch (e) {}

      return {
        success: true,
        package: {
          token: String(data[i][0]).trim().toUpperCase(),
          title: String(data[i][1] || ''),
          spreadsheetUrl: String(data[i][2] || ''),
          questions: questions,
          createdAt: new Date(data[i][5]).getTime() || new Date().getTime()
        }
      };
    }
  }

  return { success: false, error: 'Token ' + target + ' tidak ditemukan di database Spreadsheet' };
}

function getAllTokensFromSheet(ss) {
  var sheet = ss.getSheetByName('Tokens');
  var data = sheet.getDataRange().getValues();
  var tokens = [];

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      var questions = [];
      try {
        questions = JSON.parse(data[i][4]);
      } catch (e) {}

      tokens.push({
        token: String(data[i][0]).trim().toUpperCase(),
        title: String(data[i][1] || ''),
        spreadsheetUrl: String(data[i][2] || ''),
        questions: questions,
        createdAt: new Date(data[i][5]).getTime() || new Date().getTime()
      });
    }
  }

  return { success: true, tokens: tokens };
}

function deleteTokenFromSheet(ss, tokenCode) {
  if (!tokenCode) return { success: false, error: 'Token kosong' };
  var sheet = ss.getSheetByName('Tokens');
  var target = String(tokenCode).trim().toUpperCase();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === target) {
      sheet.deleteRow(i + 1);
      return { success: true, message: 'Token ' + target + ' berhasil dihapus dari Spreadsheet' };
    }
  }

  return { success: false, error: 'Token tidak ditemukan' };
}

function saveSubmissionToSheet(ss, sub) {
  if (!sub || !sub.studentName) {
    return { success: false, error: 'Data nilai siswa tidak valid' };
  }
  var sheet = ss.getSheetByName('Nilai_Siswa');
  var timeStr = new Date(sub.timestamp || new Date().getTime()).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  var id = sub.id || ('sub-' + new Date().getTime() + '-' + Math.floor(Math.random() * 1000));
  var tokenUpper = String(sub.token || '').trim().toUpperCase();

  // Check if identical submission within 15 seconds to prevent duplicates
  var data = sheet.getDataRange().getValues();
  var existingRow = -1;
  var subTimestamp = Number(sub.timestamp) || new Date().getTime();

  for (var i = data.length - 1; i >= 1; i--) {
    var rowStudent = String(data[i][1]).trim().toLowerCase();
    var rowToken = String(data[i][2]).trim().toUpperCase();
    var rowTs = Number(data[i][13]) || 0;

    if (rowStudent === String(sub.studentName).trim().toLowerCase() &&
        rowToken === tokenUpper &&
        Math.abs(rowTs - subTimestamp) < 15000) {
      existingRow = i + 1;
      break;
    }
  }

  var rowData = [
    id,
    sub.studentName,
    tokenUpper,
    sub.quizTitle || 'Kuis PvZ Edukasi',
    sub.questionsCorrect || 0,
    sub.questionsAnswered || 0,
    sub.accuracy || 0,
    sub.zombiesKilled || 0,
    sub.sunsCollected || 0,
    sub.gameOutcome === 'victory' ? 'Menang' : 'Kalah',
    sub.level || 1,
    sub.waveReached || 1,
    timeStr,
    subTimestamp
  ];

  if (existingRow > 0) {
    sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }

  return { success: true, message: 'Nilai berhasil disimpan di database Google Spreadsheet!' };
}

function getSubmissionsFromSheet(ss, tokenFilter) {
  var sheet = ss.getSheetByName('Nilai_Siswa');
  var data = sheet.getDataRange().getValues();
  var submissions = [];
  var filterUpper = tokenFilter ? String(tokenFilter).trim().toUpperCase() : '';

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      var rowToken = String(data[i][2]).trim().toUpperCase();
      if (!filterUpper || filterUpper === 'ALL' || rowToken === filterUpper) {
        submissions.push({
          id: String(data[i][0]),
          studentName: String(data[i][1] || 'Siswa'),
          token: rowToken,
          quizTitle: String(data[i][3] || ''),
          questionsCorrect: Number(data[i][4]) || 0,
          questionsAnswered: Number(data[i][5]) || 0,
          accuracy: Number(data[i][6]) || 0,
          zombiesKilled: Number(data[i][7]) || 0,
          sunsCollected: Number(data[i][8]) || 0,
          gameOutcome: (String(data[i][9]).toLowerCase() === 'menang' || String(data[i][9]).toLowerCase() === 'victory') ? 'victory' : 'game_over',
          level: Number(data[i][10]) || 1,
          waveReached: Number(data[i][11]) || 1,
          timestamp: Number(data[i][13]) || new Date(data[i][12]).getTime() || new Date().getTime()
        });
      }
    }
  }

  return { success: true, submissions: submissions };
}
`;

/**
 * Mendapatkan URL Google Apps Script yang tersimpan.
 * Mendukung pembacaan dari URL param (?db= atau ?api=) untuk auto-connect siswa.
 */
export const getGasApiUrl = (): string => {
  try {
    // 1. Cek konfigurasi langsung di kode (Prioritas Utama)
    if (CONFIGURED_GAS_URL && CONFIGURED_GAS_URL.trim().length > 0) {
      return CONFIGURED_GAS_URL.trim();
    }
    // 2. Cek Environment Variable Vite
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GAS_API_URL) {
      const envUrl = String((import.meta as any).env.VITE_GAS_API_URL).trim();
      if (envUrl) return envUrl;
    }
    // 3. Cek parameter URL terlebih dahulu (?db= atau ?api= atau ?gas=)
    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get('db') || params.get('api') || params.get('gas');
      if (urlParam && urlParam.startsWith('https://script.google.com/')) {
        localStorage.setItem(GAS_URL_KEY, urlParam);
        return urlParam;
      }
    }
    // 4. Baca dari localStorage
    return localStorage.getItem(GAS_URL_KEY) || '';
  } catch {
    return '';
  }
};

/**
 * Menyimpan URL Google Apps Script ke localStorage
 */
export const saveGasApiUrl = (url: string): void => {
  try {
    const trimmed = url.trim();
    if (trimmed) {
      localStorage.setItem(GAS_URL_KEY, trimmed);
    } else {
      localStorage.removeItem(GAS_URL_KEY);
    }
  } catch (err) {
    console.error('Gagal menyimpan URL Apps Script ke localStorage:', err);
  }
};

/**
 * Format URL Apps Script untuk GET request
 */
const makeGetUrl = (baseUrl: string, action: string, params: Record<string, string> = {}): string => {
  const url = new URL(baseUrl);
  url.searchParams.set('action', action);
  Object.entries(params).forEach(([k, v]) => {
    url.searchParams.set(k, v);
  });
  return url.toString();
};

/**
 * Kirim POST request ke Apps Script dengan Content-Type text/plain agar tidak memicu CORS Preflight
 */
const postToGas = async (baseUrl: string, payload: Record<string, any>): Promise<any> => {
  const response = await fetch(baseUrl, {
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
};

/**
 * Uji koneksi ke Google Apps Script Web App
 */
export const testGasConnection = async (testUrl?: string): Promise<{ success: boolean; message: string; spreadsheetName?: string }> => {
  const targetUrl = (testUrl || getGasApiUrl()).trim();
  if (!targetUrl) {
    return { success: false, message: 'URL Google Apps Script belum dimasukkan.' };
  }

  if (!targetUrl.startsWith('https://script.google.com/macros/s/')) {
    return {
      success: false,
      message: 'Format URL tidak valid! URL harus berawal dari https://script.google.com/macros/s/.../exec'
    };
  }

  try {
    const pingUrl = makeGetUrl(targetUrl, 'ping');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 detik timeout

    const res = await fetch(pingUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { success: false, message: `Server mengembalikan status ${res.status}. Pastikan hak akses diatur ke "Anyone" (Siapa Saja).` };
    }

    const data = await res.json();
    if (data.success) {
      return {
        success: true,
        message: data.message || 'Berhasil terhubung ke database Google Spreadsheet!',
        spreadsheetName: data.spreadsheetName
      };
    } else {
      return { success: false, message: data.error || 'Respon server tidak valid.' };
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { success: false, message: 'Waktu tunggu habis (timeout). Periksa koneksi internet Anda.' };
    }
    return {
      success: false,
      message: `Gagal terhubung: ${err.message || 'Periksa apakah Deployment Web App sudah diset ke "Anyone" (Siapa Saja).'}`
    };
  }
};

/**
 * Sinkronkan 1 token ke Google Apps Script
 */
export const syncTokenToGas = async (pkg: TeacherTokenPackage, targetUrl?: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  const url = (targetUrl || getGasApiUrl()).trim();
  if (!url) return { success: false, error: 'URL Apps Script belum diatur.' };

  try {
    const result = await postToGas(url, {
      action: 'saveToken',
      package: pkg
    });
    return result;
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menyimpan ke Google Sheets' };
  }
};

/**
 * Ambil 1 token dari Google Apps Script berdasarkan kode token
 */
export const fetchTokenFromGas = async (tokenCode: string, targetUrl?: string): Promise<{ success: boolean; package?: TeacherTokenPackage; error?: string }> => {
  const url = (targetUrl || getGasApiUrl()).trim();
  if (!url) return { success: false, error: 'URL Apps Script belum diatur.' };

  try {
    const getUrl = makeGetUrl(url, 'getToken', { token: tokenCode.trim().toUpperCase() });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(getUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengambil data dari Google Sheets' };
  }
};

/**
 * Ambil semua token dari Google Apps Script
 */
export const fetchAllTokensFromGas = async (targetUrl?: string): Promise<{ success: boolean; tokens?: TeacherTokenPackage[]; error?: string }> => {
  const url = (targetUrl || getGasApiUrl()).trim();
  if (!url) return { success: false, error: 'URL Apps Script belum diatur.' };

  try {
    const getUrl = makeGetUrl(url, 'getAllTokens');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(getUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengambil daftar token dari Google Sheets' };
  }
};

/**
 * Hapus token di Google Apps Script
 */
export const deleteTokenFromGas = async (tokenCode: string, targetUrl?: string): Promise<{ success: boolean; error?: string }> => {
  const url = (targetUrl || getGasApiUrl()).trim();
  if (!url) return { success: false, error: 'URL Apps Script belum diatur.' };

  try {
    const result = await postToGas(url, {
      action: 'deleteToken',
      token: tokenCode.trim().toUpperCase()
    });
    return result;
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

/**
 * Simpan hasil nilai siswa ke Google Apps Script
 */
export const syncSubmissionToGas = async (sub: StudentSubmission, targetUrl?: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  const url = (targetUrl || getGasApiUrl()).trim();
  if (!url) return { success: false, error: 'URL Apps Script belum diatur.' };

  try {
    const result = await postToGas(url, {
      action: 'saveSubmission',
      submission: sub
    });
    return result;
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengirim nilai ke Google Sheets' };
  }
};

/**
 * Ambil submission/nilai siswa dari Google Apps Script
 */
export const fetchSubmissionsFromGas = async (tokenFilter?: string, targetUrl?: string): Promise<{ success: boolean; submissions?: StudentSubmission[]; error?: string }> => {
  const url = (targetUrl || getGasApiUrl()).trim();
  if (!url) return { success: false, error: 'URL Apps Script belum diatur.' };

  try {
    const params: Record<string, string> = {};
    if (tokenFilter && tokenFilter !== 'ALL') {
      params.token = tokenFilter.trim().toUpperCase();
    }
    const getUrl = makeGetUrl(url, 'getSubmissions', params);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(getUrl, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengambil data nilai dari Google Sheets' };
  }
};
