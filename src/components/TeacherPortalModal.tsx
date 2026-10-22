import React, { useState, useEffect } from 'react';
import { TeacherTokenPackage, StudentSubmission, Question } from '../types/game';
import { 
  getTeacherTokens, 
  saveTeacherTokens, 
  generateTokenCode, 
  fetchQuestionsFromGoogleSheets,
  getStudentSubmissions,
  syncAndGetSubmissions,
  exportSubmissionsToCsv,
  getGasApiUrl,
  syncTokenToGas,
  fetchAllTokensFromGas,
  deleteTokenFromGas
} from '../utils/teacherStorage';
import { parseSpreadsheetData } from '../utils/spreadsheetParser';
import { copyToClipboard } from '../utils/clipboard';
import { 
  X, GraduationCap, Link as LinkIcon, Copy, Check, FileSpreadsheet, 
  Users, Trophy, Download, Trash2, Lock, AlertCircle, CheckCircle2, 
  Sparkles, ExternalLink, Plus, Share2,
  QrCode, Pencil, CopyPlus, Search, ArrowUpDown, Upload, BarChart3,
  RefreshCw, Loader2, Save
} from 'lucide-react';

// ============================================================
// TEMPLATE SPREADSHEET
// ============================================================
const TEMPLATE_SPREADSHEET_ID = '10YdkL93c9iIFD8QxY4o1wkyEBy8aVcPSvzvCAFXeFzs';
const TEMPLATE_SPREADSHEET_COPY_URL = `https://docs.google.com/spreadsheets/d/${TEMPLATE_SPREADSHEET_ID}/copy`;

interface TeacherPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTokenForPlay?: (pkg: TeacherTokenPackage) => void;
}

export const TeacherPortalModal: React.FC<TeacherPortalModalProps> = ({
  isOpen,
  onClose,
  onSelectTokenForPlay
}) => {
  // ===== Auth state =====
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string | null>(null);

  // ===== Tabs =====
  const [activeTab, setActiveTab] = useState<'create_token' | 'manage_tokens' | 'submissions' | 'leaderboard'>('create_token');

  // ===== Create form =====
  const [sheetUrl, setSheetUrl] = useState<string>('');
  const [quizTitle, setQuizTitle] = useState<string>('');
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<Question[] | null>(null);
  const [createdTokenPkg, setCreatedTokenPkg] = useState<TeacherTokenPackage | null>(null);
  const [copiedTokenCode, setCopiedTokenCode] = useState<boolean>(false);
  const [copiedTokenMsg, setCopiedTokenMsg] = useState<boolean>(false);
  const [autoSyncedSuccess, setAutoSyncedSuccess] = useState<boolean>(false);

  // Direct paste fallback
  const [showDirectPaste, setShowDirectPaste] = useState<boolean>(false);
  const [directPasteText, setDirectPasteText] = useState<string>('');

  // ===== Data =====
  const [tokens, setTokens] = useState<TeacherTokenPackage[]>([]);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);

  // ===== Background Sync State =====
  const [isSyncingAllTokens, setIsSyncingAllTokens] = useState<boolean>(false);
  const [isPullingTokens, setIsPullingTokens] = useState<boolean>(false);
  const [isSyncingSubmissions, setIsSyncingSubmissions] = useState<boolean>(false);
  const [dbActionNotice, setDbActionNotice] = useState<string | null>(null);

  // ===== FITUR BARU: QR / Edit / Duplikat / Filter / Sort =====
  const [qrPkg, setQrPkg] = useState<TeacherTokenPackage | null>(null);
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [subSearch, setSubSearch] = useState<string>('');
  const [subFilterToken, setSubFilterToken] = useState<string>('ALL');
  const [subSortBy, setSubSortBy] = useState<'date' | 'accuracy' | 'zombies' | 'suns'>('date');

  useEffect(() => {
    if (isOpen) {
      setTokens(getTeacherTokens());
      setSubmissions(getStudentSubmissions());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ===== Handlers =====
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() === 'guru' && password.trim() === 'guruhebat') {
      setIsAuthenticated(true);
      setAuthError(null);
    } else {
      setAuthError('Username atau Password salah! (hubungi 085722228896)');
    }
  };

  const handleFetchSpreadsheet = async () => {
    if (!sheetUrl.trim()) { setFetchError('Harap masukkan URL Google Spreadsheet terlebih dahulu.'); return; }
    setIsFetching(true); setFetchError(null); setPreviewQuestions(null);
    const result = await fetchQuestionsFromGoogleSheets(sheetUrl);
    setIsFetching(false);
    if (result.error) setFetchError(result.error);
    else {
      setPreviewQuestions(result.questions);
      if (!quizTitle.trim()) setQuizTitle(`Kuis Spreadsheet (${result.questions.length} Soal)`);
    }
  };

  const handleApplyDirectPaste = () => {
    const res = parseSpreadsheetData(directPasteText, true);
    if (res.questions.length > 0) {
      setPreviewQuestions(res.questions); setFetchError(null);
      if (!quizTitle.trim()) setQuizTitle(`Kuis Spreadsheet (${res.questions.length} Soal)`);
    } else setFetchError('Data tempel tidak memiliki format valid (Kolom A-E).');
  };

  const handleSaveAndGenerateToken = async () => {
    if (!previewQuestions || previewQuestions.length === 0) { setFetchError('Belum ada soal yang berhasil dimuat.'); return; }
    const tokenCode = generateTokenCode('GURU');
    const newPkg: TeacherTokenPackage = {
      token: tokenCode,
      title: quizTitle.trim() || `Kuis ${tokenCode}`,
      spreadsheetUrl: sheetUrl.trim() || 'Tempel Manual',
      questions: previewQuestions,
      createdAt: Date.now()
    };
    const updatedTokens = [newPkg, ...tokens];
    setTokens(updatedTokens); 
    saveTeacherTokens(updatedTokens);
    setCreatedTokenPkg(newPkg);

    // Otomatis sinkronkan ke Google Apps Script jika URL sudah diatur
    const currentGas = getGasApiUrl();
    if (currentGas) {
      try {
        const res = await syncTokenToGas(newPkg, currentGas);
        if (res.success) {
          setAutoSyncedSuccess(true);
        } else {
          setAutoSyncedSuccess(false);
        }
      } catch (e) {
        console.warn('Gagal sinkronisasi token ke Apps Script:', e);
        setAutoSyncedSuccess(false);
      }
    } else {
      setAutoSyncedSuccess(false);
    }
  };

  // Helper untuk membuat link share siswa yang membawa info token & db
  const getStudentShareUrl = (tokenCode: string) => {
    const url = new URL(window.location.href);
    url.search = '';
    url.hash = '';
    url.searchParams.set('token', tokenCode);
    const currentGas = getGasApiUrl();
    if (currentGas) {
      url.searchParams.set('db', currentGas);
    }
    return url.toString();
  };

  const handleCopyTokenCode = async (tokenCode: string) => {
    const success = await copyToClipboard(tokenCode);
    if (success) { setCopiedTokenCode(true); setTimeout(() => setCopiedTokenCode(false), 2500); }
  };

  const handleCopyTokenMessage = async (pkg: TeacherTokenPackage) => {
    const shareLink = getStudentShareUrl(pkg.token);
    const msg = `Assalamualaikum Anak-anak! Silakan buka game Plants vs Zombies Kuis dan masukkan Token Kuis ini:\n\n👉 TOKEN: ${pkg.token}\nJudul: ${pkg.title}\nJumlah Soal: ${pkg.questions.length} Soal\n\n🔗 Link Kuis (Otomatis Terhubung):\n${shareLink}\n\nSelamat bermain dan pertahankan kebunmu!`;
    const success = await copyToClipboard(msg);
    if (success) { setCopiedTokenMsg(true); setTimeout(() => setCopiedTokenMsg(false), 2500); }
  };

  const handleDeleteToken = async (tokenCode: string) => {
    if (tokens.length <= 1) { alert('Minimal harus tersisa 1 token di sistem.'); return; }
    if (!confirm('Hapus token ini? Tindakan tidak bisa dibatalkan.')) return;
    const updated = tokens.filter(t => t.token !== tokenCode);
    setTokens(updated); 
    saveTeacherTokens(updated);

    // Hapus juga di remote database jika ada
    const currentGas = getGasApiUrl();
    if (currentGas) {
      deleteTokenFromGas(tokenCode, currentGas).catch(() => {});
    }
  };

  // ===== DATABASE APPS SCRIPT SYNC HANDLERS =====
  const handleSyncAllTokensToSpreadsheet = async () => {
    const currentGas = getGasApiUrl();
    if (!currentGas) {
      alert('URL Database Google Apps Script belum dikonfigurasi di kode program.');
      return;
    }
    if (tokens.length === 0) {
      alert('Tidak ada token lokal untuk disinkronkan.');
      return;
    }
    setIsSyncingAllTokens(true);
    let successCount = 0;
    for (const pkg of tokens) {
      try {
        const res = await syncTokenToGas(pkg, currentGas);
        if (res.success) successCount++;
      } catch (e) {}
    }
    setIsSyncingAllTokens(false);
    setDbActionNotice(`Berhasil mengunggah ${successCount} dari ${tokens.length} token ke Google Spreadsheet!`);
    setTimeout(() => setDbActionNotice(null), 4000);
  };

  const handlePullTokensFromSpreadsheet = async () => {
    const currentGas = getGasApiUrl();
    if (!currentGas) {
      alert('URL Database Google Apps Script belum dikonfigurasi di kode program.');
      return;
    }
    setIsPullingTokens(true);
    try {
      const res = await fetchAllTokensFromGas(currentGas);
      if (res.success && res.tokens) {
        const map = new Map<string, TeacherTokenPackage>();
        tokens.forEach(t => map.set(t.token.toUpperCase(), t));
        res.tokens.forEach(t => map.set(t.token.toUpperCase(), t));
        const merged = Array.from(map.values());
        setTokens(merged);
        saveTeacherTokens(merged);
        setDbActionNotice(`Berhasil menarik ${res.tokens.length} token dari Google Spreadsheet!`);
      } else {
        alert(res.error || 'Gagal mengambil token dari Spreadsheet.');
      }
    } catch (err: any) {
      alert('Gagal: ' + (err.message || 'Terjadi kesalahan jaringan'));
    } finally {
      setIsPullingTokens(false);
      setTimeout(() => setDbActionNotice(null), 4000);
    }
  };

  const handleSyncSubmissions = async () => {
    setIsSyncingSubmissions(true);
    try {
      const synced = await syncAndGetSubmissions(subFilterToken);
      setSubmissions(synced);
      setDbActionNotice(`Rekap nilai berhasil disinkronkan dari Google Spreadsheet! (${synced.length} nilai)`);
    } catch (err: any) {
      alert('Gagal sinkronisasi nilai: ' + err.message);
    } finally {
      setIsSyncingSubmissions(false);
      setTimeout(() => setDbActionNotice(null), 4000);
    }
  };

  // ===== FITUR BARU: Edit judul =====
  const handleStartEditTitle = (pkg: TeacherTokenPackage) => {
    setEditingToken(pkg.token);
    setEditingTitle(pkg.title);
  };

  const handleSaveTitle = (tokenCode: string) => {
    const newTitle = editingTitle.trim();
    if (!newTitle) { setEditingToken(null); return; }
    const updated = tokens.map(t => t.token === tokenCode ? { ...t, title: newTitle } : t);
    setTokens(updated); saveTeacherTokens(updated);
    setEditingToken(null);
  };

  // ===== FITUR BARU: Duplikat kuis =====
  const handleDuplicateToken = (pkg: TeacherTokenPackage) => {
    const newTokenCode = generateTokenCode('GURU');
    const newPkg: TeacherTokenPackage = {
      ...pkg,
      token: newTokenCode,
      title: `${pkg.title} (Salinan)`,
      createdAt: Date.now()
    };
    const updated = [newPkg, ...tokens];
    setTokens(updated); saveTeacherTokens(updated);
    alert(`Kuis berhasil diduplikat!\n\nToken baru: ${newTokenCode}`);
  };

  // ===== FITUR BARU: QR Code =====
  const getQrData = (pkg: TeacherTokenPackage) => {
    return getStudentShareUrl(pkg.token);
  };

  const getQrImgUrl = (pkg: TeacherTokenPackage) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&data=${encodeURIComponent(getQrData(pkg))}`;

  // ===== FITUR BARU: Backup / Restore =====
  const handleBackupAll = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      version: 1,
      appName: 'Plants vs Zombies Kuis',
      tokens,
      submissions
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `backup_portal_guru_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.tokens || !Array.isArray(data.tokens)) throw new Error('File backup tidak valid (tidak ada data tokens).');
        if (!confirm(`Restore akan MENGGANTI ${tokens.length} token saat ini dengan ${data.tokens.length} token dari backup.\n\nLanjutkan?`)) return;
        saveTeacherTokens(data.tokens);
        setTokens(data.tokens);
        alert('Backup berhasil direstore!\n\nCatatan: data submission (nilai siswa) tidak ikut direstore — hanya token & soal.');
      } catch (err) {
        alert('Gagal restore: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ===== Derived: filtered submissions & leaderboard =====
  const filteredSubmissions = submissions
    .filter(s => subFilterToken === 'ALL' || s.token === subFilterToken)
    .filter(s => !subSearch.trim() || s.studentName.toLowerCase().includes(subSearch.trim().toLowerCase()))
    .sort((a, b) => {
      switch (subSortBy) {
        case 'accuracy': return b.accuracy - a.accuracy;
        case 'zombies': return b.zombiesKilled - a.zombiesKilled;
        case 'suns': return b.sunsCollected - a.sunsCollected;
        default: return b.timestamp - a.timestamp;
      }
    });

  const leaderboardSubmissions = (subFilterToken === 'ALL'
    ? submissions
    : submissions.filter(s => s.token === subFilterToken))
    .sort((a, b) => {
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      if (b.zombiesKilled !== a.zombiesKilled) return b.zombiesKilled - a.zombiesKilled;
      return b.questionsCorrect - a.questionsCorrect;
    })
    .slice(0, 20);

  // ===== Render =====
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-stone-900 border-2 border-emerald-600/70 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-stone-100">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-emerald-300 tracking-wide">
                Portal Guru: Manajemen Soal & Token
              </h2>
              <p className="text-xs text-stone-400">
                Masukkan link Google Spreadsheet dan bagikan Token kepada siswa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAuthenticated && (
              <>
                <button
                  onClick={handleBackupAll}
                  title="Backup semua data (JSON)"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-amber-300 hover:bg-stone-800 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
                <label
                  title="Restore dari file backup"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-300 hover:bg-stone-800 cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  <input type="file" accept=".json,application/json" onChange={handleRestoreBackup} className="hidden" />
                </label>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Login */}
        {!isAuthenticated ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-stone-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-stone-100">Masuk ke Portal Guru</h3>
              <p className="text-xs text-stone-400">Gunakan kredensial pengajar untuk membuat kuis dan melihat nilai siswa.</p>
            </div>
            <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4 text-left">
              <div>
                <label className="text-xs font-semibold text-stone-300">Username Guru:</label>
                <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan Username"
                  className="w-full p-2.5 mt-1 text-sm bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-stone-300">Password Guru:</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan Password"
                  className="w-full p-2.5 mt-1 text-sm bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-emerald-500" />
              </div>
              {authError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /><span>{authError}</span>
                </div>
              )}
              <button type="submit"
                className="w-full py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-stone-950 rounded-xl transition-transform active:scale-95 shadow-md flex items-center justify-center gap-2">
                <Lock className="w-4 h-4" />Masuk Portal Guru
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-800 bg-stone-950/40 overflow-x-auto">
              {[
                { id: 'create_token', label: 'Buat Kuis Baru', icon: Plus },
                { id: 'manage_tokens', label: `Daftar Kuis (${tokens.length})`, icon: FileSpreadsheet },
                { id: 'submissions', label: `Rekap Nilai (${submissions.length})`, icon: Users },
                { id: 'leaderboard', label: 'Papan Peringkat', icon: BarChart3 },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    activeTab === tab.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-stone-400 hover:text-stone-200'
                  }`}>
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Notification Banner */}
            {dbActionNotice && (
              <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{dbActionNotice}</span>
                </div>
                <button onClick={() => setDbActionNotice(null)} className="text-stone-400 hover:text-white p-1">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6">

              {/* ============ TAB 1: CREATE ============ */}
              {activeTab === 'create_token' && (
                <div className="space-y-6">
                  {createdTokenPkg && (
                    <div className="p-5 rounded-2xl border-2 border-emerald-500 bg-emerald-950/50 shadow-xl space-y-3 animate-in zoom-in-95 duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Token Kuis Berhasil Dibuat!
                        </span>
                        <button onClick={() => setCreatedTokenPkg(null)} className="text-xs text-stone-400 hover:text-stone-200">
                          Tutup Pesan
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-stone-950/80 rounded-xl border border-emerald-600/40">
                        <div>
                          <span className="text-xs text-stone-400">Kode Token Siswa:</span>
                          <div onClick={() => handleCopyTokenCode(createdTokenPkg.token)}
                            className="text-3xl font-black font-mono tracking-widest text-amber-300 hover:text-amber-200 cursor-pointer flex items-center gap-2 group">
                            <span>{createdTokenPkg.token}</span>
                            <span className="text-[10px] font-sans font-normal text-stone-400 group-hover:text-amber-300">(Klik salin)</span>
                          </div>
                          <span className="text-xs text-stone-300 font-semibold">
                            {createdTokenPkg.title} · {createdTokenPkg.questions.length} Soal
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button onClick={() => handleCopyTokenCode(createdTokenPkg.token)}
                            className="px-3.5 py-2.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl flex items-center gap-1.5">
                            {copiedTokenCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            <span>{copiedTokenCode ? 'Tersalin!' : 'Salin Token'}</span>
                          </button>
                          <button onClick={() => handleCopyTokenMessage(createdTokenPkg)}
                            className="px-3.5 py-2.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-xl flex items-center gap-1.5 border border-stone-700">
                            {copiedTokenMsg ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
                            <span>{copiedTokenMsg ? 'Tersalin!' : 'Salin Pesan'}</span>
                          </button>
                          <button onClick={() => setQrPkg(createdTokenPkg)}
                            className="px-3.5 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-stone-950 rounded-xl flex items-center gap-1.5">
                            <QrCode className="w-4 h-4" /><span>QR Code</span>
                          </button>
                          {onSelectTokenForPlay && (
                            <button onClick={() => { onSelectTokenForPlay(createdTokenPkg); onClose(); }}
                              className="px-4 py-2.5 text-xs font-bold bg-stone-700 hover:bg-stone-600 text-stone-100 rounded-xl">
                              Mainkan
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Info Status Database */}
                      <div className="pt-1 border-t border-emerald-800/40">
                        {autoSyncedSuccess ? (
                          <div className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Tersimpan di Google Spreadsheet Database! Siswa di HP/laptop berbeda dapat langsung mengakses token ini.</span>
                          </div>
                        ) : getGasApiUrl() ? (
                          <div className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Token tersimpan dan siap dibagikan ke siswa.</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Token tersimpan di browser ini dan siap dimainkan.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Template banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-stone-950 border border-emerald-500/70 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shrink-0">
                        <FileSpreadsheet className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                          <span>Template Spreadsheet Siap Pakai</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">Kolom A - E</span>
                        </h4>
                        <p className="text-xs text-stone-300 leading-snug">
                          Klik untuk membuka template di Google Sheets, lalu klik <b>"Make a copy"</b>.
                        </p>
                      </div>
                    </div>
                    <a href={TEMPLATE_SPREADSHEET_COPY_URL} target="_blank" rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2.5 text-xs font-black bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 rounded-xl flex items-center justify-center gap-2 shadow-md">
                      <FileSpreadsheet className="w-4 h-4" /><span>Buka Template</span><ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* Instructions */}
                  <div className="p-4 rounded-2xl border border-stone-800 bg-stone-950/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Cara Menggunakan:</span>
                      <a href={TEMPLATE_SPREADSHEET_COPY_URL} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold">
                        <FileSpreadsheet className="w-3.5 h-3.5" /><span>Lihat Template</span>
                      </a>
                    </div>
                    <ol className="text-xs text-stone-300 space-y-1 list-decimal list-inside">
                      <li>Klik <b>Buka Template</b> → <b>File → Make a copy</b> untuk simpan ke Drive.</li>
                      <li>Isi soal (<b>Kolom A</b>: Soal, <b>B</b>: Jawaban Benar, <b>C-E</b>: Pengecoh).</li>
                      <li>Klik <b>Share</b> → ubah ke <b>"Anyone with the link"</b>.</li>
                      <li>Salin link, tempel di bawah, klik <b>Periksa & Ambil Soal</b>.</li>
                    </ol>
                  </div>

                  {/* Form */}
                  <div className="p-5 rounded-2xl border border-stone-800 bg-stone-950/40 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <LinkIcon className="w-4 h-4" />Tempel Link Google Spreadsheet:
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="url" value={sheetUrl} onChange={(e) => setSheetUrl(e.target.value)}
                          placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                          className="flex-1 p-3 text-xs font-mono bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-emerald-500" />
                        <button onClick={handleFetchSpreadsheet} disabled={isFetching || !sheetUrl.trim()}
                          className="px-5 py-3 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-stone-950 rounded-xl shrink-0">
                          {isFetching ? 'Mengunduh...' : 'Periksa & Ambil Soal'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-stone-300">Judul Kuis / Topik Materi:</label>
                      <input type="text" value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)}
                        placeholder="Contoh: Kuis IPA Fotosintesis Kelas 5A"
                        className="w-full p-2.5 mt-1 text-xs bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div className="pt-1">
                      <button onClick={() => setShowDirectPaste(!showDirectPaste)}
                        className="text-xs text-amber-400 hover:underline flex items-center gap-1">
                        {showDirectPaste ? '▲ Sembunyikan Tempel Manual' : '▼ Atau tempel langsung teks dari spreadsheet'}
                      </button>
                      {showDirectPaste && (
                        <div className="mt-3 p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-2">
                          <textarea rows={4} value={directPasteText} onChange={(e) => setDirectPasteText(e.target.value)}
                            placeholder="Tempel baris spreadsheet (Kolom A-E)..."
                            className="w-full p-2.5 text-xs font-mono bg-stone-900 border border-stone-700 rounded-lg text-stone-200" />
                          <button onClick={handleApplyDirectPaste}
                            className="px-4 py-1.5 text-xs font-bold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg">
                            Terapkan Teks
                          </button>
                        </div>
                      )}
                    </div>
                    {fetchError && (
                      <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /><div>{fetchError}</div>
                      </div>
                    )}
                    {previewQuestions && previewQuestions.length > 0 && (
                      <div className="p-4 rounded-xl border border-emerald-600/40 bg-emerald-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />{previewQuestions.length} Soal Berhasil Divalidasi!
                          </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-stone-800 bg-stone-950">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead className="bg-stone-800 text-stone-300">
                              <tr>
                                <th className="p-2 w-8 text-center">#</th>
                                <th className="p-2">Pertanyaan</th>
                                <th className="p-2 text-emerald-400">Jawaban</th>
                                <th className="p-2 text-amber-300">Pengecoh</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-800">
                              {previewQuestions.slice(0, 5).map((q, idx) => (
                                <tr key={idx} className="hover:bg-stone-900">
                                  <td className="p-2 text-center text-stone-500">{idx + 1}</td>
                                  <td className="p-2 text-stone-200 font-medium">{q.question}</td>
                                  <td className="p-2 text-emerald-400 font-bold">{q.correctAnswer}</td>
                                  <td className="p-2 text-stone-400">{q.distractor1}, {q.distractor2}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="pt-2 flex justify-end">
                          <button onClick={handleSaveAndGenerateToken}
                            className="px-6 py-3 text-sm font-black bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-stone-950 rounded-xl shadow-lg flex items-center gap-2">
                            <Sparkles className="w-4 h-4 fill-stone-950" />Simpan & Buat Token
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ============ TAB 2: MANAGE TOKENS ============ */}
              {activeTab === 'manage_tokens' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-stone-100">Daftar Paket Token Kuis</h4>
                      <p className="text-xs text-stone-400">Setiap token bisa dipakai berkali-kali oleh siswa berbeda.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSyncAllTokensToSpreadsheet}
                        disabled={isSyncingAllTokens}
                        className="px-3 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-emerald-300 rounded-xl border border-stone-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Upload semua token lokal ke Spreadsheet"
                      >
                        {isSyncingAllTokens ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>{isSyncingAllTokens ? 'Mengunggah...' : 'Upload ke Spreadsheet'}</span>
                      </button>
                      <button
                        onClick={handlePullTokensFromSpreadsheet}
                        disabled={isPullingTokens}
                        className="px-3 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl border border-stone-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Download token dari Spreadsheet ke perangkat ini"
                      >
                        {isPullingTokens ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                        <span>{isPullingTokens ? 'Menarik...' : 'Tarik dari Spreadsheet'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tokens.map((pkg) => {
                      const tokenSubmissions = submissions.filter(s => s.token.toUpperCase() === pkg.token.toUpperCase());
                      const isEditing = editingToken === pkg.token;
                      return (
                        <div key={pkg.token}
                          className="p-4 rounded-2xl border border-stone-800 bg-stone-950/60 flex flex-col justify-between space-y-3 hover:border-emerald-500/40 transition-colors">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl font-black font-mono tracking-wider text-amber-300">{pkg.token}</span>
                              <span className="text-[11px] text-stone-400 bg-stone-900 px-2.5 py-0.5 rounded-full border border-stone-800">
                                {pkg.questions.length} Soal · {tokenSubmissions.length} Siswa
                              </span>
                            </div>
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input autoFocus type="text" value={editingTitle}
                                  onChange={(e) => setEditingTitle(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(pkg.token); if (e.key === 'Escape') setEditingToken(null); }}
                                  className="flex-1 p-1.5 text-xs bg-stone-950 border border-emerald-500 rounded-lg text-stone-100" />
                                <button onClick={() => handleSaveTitle(pkg.token)}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 rounded-lg" title="Simpan">
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingToken(null)}
                                  className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg" title="Batal">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <h5 className="text-sm font-bold text-stone-100 flex items-center gap-1.5 group">
                                <span>{pkg.title}</span>
                                <button onClick={() => handleStartEditTitle(pkg)}
                                  className="opacity-40 group-hover:opacity-100 p-1 hover:bg-stone-800 rounded transition-opacity" title="Edit judul">
                                  <Pencil className="w-3 h-3 text-stone-400" />
                                </button>
                              </h5>
                            )}
                            <p className="text-xs text-stone-400">
                              Dibuat: {new Date(pkg.createdAt).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-stone-800/80 gap-1 flex-wrap">
                            <div className="flex items-center gap-1 flex-wrap">
                              <button onClick={() => setQrPkg(pkg)}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg flex items-center gap-1"
                                title="Tampilkan QR Code">
                                <QrCode className="w-3.5 h-3.5" />QR
                              </button>
                              <button onClick={() => handleCopyTokenMessage(pkg)}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg flex items-center gap-1">
                                <Copy className="w-3.5 h-3.5" />Salin
                              </button>
                              <button onClick={() => handleDuplicateToken(pkg)}
                                className="px-2.5 py-1.5 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-emerald-300 rounded-lg flex items-center gap-1"
                                title="Duplikat kuis dengan token baru">
                                <CopyPlus className="w-3.5 h-3.5" />Duplikat
                              </button>
                              {onSelectTokenForPlay && (
                                <button onClick={() => { onSelectTokenForPlay(pkg); onClose(); }}
                                  className="px-2.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-stone-950 rounded-lg">
                                  Mainkan
                                </button>
                              )}
                            </div>
                            <button onClick={() => handleDeleteToken(pkg.token)} title="Hapus"
                              className="p-1.5 text-stone-500 hover:text-red-400 hover:bg-red-950/40 rounded-lg">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============ TAB 3: SUBMISSIONS (with filter/sort) ============ */}
              {activeTab === 'submissions' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-stone-100">Rekap Nilai & Hasil Siswa</h4>
                      <p className="text-xs text-stone-400">
                        Menampilkan {filteredSubmissions.length} dari {submissions.length} submission
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSyncSubmissions}
                        disabled={isSyncingSubmissions}
                        className="px-3.5 py-2 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-emerald-300 rounded-xl border border-stone-700 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Tarik nilai terbaru dari Google Spreadsheet"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSubmissions ? 'animate-spin' : ''}`} />
                        <span>{isSyncingSubmissions ? 'Menyinkronkan...' : 'Refresh dari Spreadsheet'}</span>
                      </button>
                      {filteredSubmissions.length > 0 && (
                        <button onClick={() => {
                          const csv = exportSubmissionsToCsv(filteredSubmissions);
                          const blob = new Blob([csv], { type: 'text/tab-separated-values;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.setAttribute('download', `rekap_nilai_${new Date().toISOString().slice(0, 10)}.tsv`);
                          document.body.appendChild(link); link.click(); document.body.removeChild(link);
                        }}
                          className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-stone-950 rounded-xl flex items-center gap-2">
                          <Download className="w-4 h-4" />Unduh TSV
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter bar */}
                  <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
                      <input type="text" value={subSearch} onChange={(e) => setSubSearch(e.target.value)}
                        placeholder="Cari nama siswa..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200 focus:outline-none focus:border-emerald-500" />
                    </div>
                    <select value={subFilterToken} onChange={(e) => setSubFilterToken(e.target.value)}
                      className="px-2 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200">
                      <option value="ALL">Semua Token</option>
                      {tokens.map(t => <option key={t.token} value={t.token}>{t.token} · {t.title.slice(0, 20)}</option>)}
                    </select>
                    <div className="flex items-center gap-1">
                      <ArrowUpDown className="w-3.5 h-3.5 text-stone-500" />
                      <select value={subSortBy} onChange={(e) => setSubSortBy(e.target.value as any)}
                        className="px-2 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200">
                        <option value="date">Terbaru</option>
                        <option value="accuracy">Akurasi tertinggi</option>
                        <option value="zombies">Zombi terbanyak</option>
                        <option value="suns">Matahari terbanyak</option>
                      </select>
                    </div>
                  </div>

                  {filteredSubmissions.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-stone-800 bg-stone-950/40 space-y-2">
                      <Users className="w-8 h-8 text-stone-600 mx-auto" />
                      <p className="text-sm font-semibold text-stone-300">
                        {submissions.length === 0 ? 'Belum Ada Hasil Siswa' : 'Tidak Ada Hasil yang Cocok'}
                      </p>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        {submissions.length === 0
                          ? 'Setelah siswa selesai bermain, mereka dapat menekan tombol "Kirim Hasil ke Guru".'
                          : 'Coba ubah kata kunci pencarian atau filter token.'}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-stone-800 overflow-hidden bg-stone-950/60">
                      <div className="max-h-96 overflow-y-auto">
                        <table className="w-full text-xs text-left border-collapse">
                          <thead className="sticky top-0 bg-stone-800 text-stone-300 font-semibold border-b border-stone-700">
                            <tr>
                              <th className="p-3">Nama Siswa</th>
                              <th className="p-3">Token</th>
                              <th className="p-3 text-emerald-400">Benar</th>
                              <th className="p-3 text-emerald-400">Akurasi</th>
                              <th className="p-3 text-amber-300">Zombi</th>
                              <th className="p-3 text-yellow-300">Matahari</th>
                              <th className="p-3">Hasil</th>
                              <th className="p-3">Waktu</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stone-800">
                            {filteredSubmissions.map((sub) => (
                              <tr key={sub.id} className="hover:bg-stone-800/40">
                                <td className="p-3 font-bold text-stone-100">{sub.studentName}</td>
                                <td className="p-3 font-mono text-amber-300">{sub.token}</td>
                                <td className="p-3 font-mono text-emerald-400 font-bold">{sub.questionsCorrect}/{sub.questionsAnswered}</td>
                                <td className="p-3 font-mono font-bold text-emerald-300">{sub.accuracy}%</td>
                                <td className="p-3 font-mono text-stone-300">{sub.zombiesKilled}</td>
                                <td className="p-3 font-mono text-yellow-300">{sub.sunsCollected}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    sub.gameOutcome === 'victory'
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                      : 'bg-red-950 text-red-400 border border-red-800'
                                  }`}>
                                    {sub.gameOutcome === 'victory' ? 'Menang' : 'Kalah'}
                                  </span>
                                </td>
                                <td className="p-3 text-stone-500 font-mono text-[11px]">
                                  {new Date(sub.timestamp).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============ TAB 4: LEADERBOARD ============ */}
              {activeTab === 'leaderboard' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-stone-100">Papan Peringkat Siswa</h4>
                      <p className="text-xs text-stone-400">Top 20 berdasarkan akurasi & zombi terbanyak.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSyncSubmissions}
                        disabled={isSyncingSubmissions}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-400 hover:bg-stone-800 transition-colors disabled:opacity-50 cursor-pointer"
                        title="Perbarui peringkat dari Google Spreadsheet"
                      >
                        <RefreshCw className={`w-4 h-4 ${isSyncingSubmissions ? 'animate-spin' : ''}`} />
                      </button>
                      <select value={subFilterToken} onChange={(e) => setSubFilterToken(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-stone-900 border border-stone-700 rounded-lg text-stone-200">
                        <option value="ALL">Semua Token</option>
                        {tokens.map(t => <option key={t.token} value={t.token}>{t.token} · {t.title.slice(0, 20)}</option>)}
                      </select>
                    </div>
                  </div>

                  {leaderboardSubmissions.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-stone-800 bg-stone-950/40 space-y-2">
                      <Trophy className="w-10 h-10 text-stone-600 mx-auto" />
                      <p className="text-sm font-semibold text-stone-300">Belum Ada Data Peringkat</p>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">
                        Papan peringkat muncul setelah siswa mengirimkan hasil permainan.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {leaderboardSubmissions.map((sub, idx) => {
                        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                        const bgClass = idx === 0 ? 'from-yellow-500/20 to-amber-500/10 border-yellow-500/50'
                                      : idx === 1 ? 'from-stone-400/20 to-stone-500/10 border-stone-400/50'
                                      : idx === 2 ? 'from-amber-700/20 to-orange-700/10 border-amber-700/50'
                                      : 'from-stone-800/30 to-stone-900/20 border-stone-800';
                        return (
                          <div key={sub.id}
                            className={`p-3 rounded-xl border bg-gradient-to-r ${bgClass} flex items-center gap-3`}>
                            <div className="w-10 text-center shrink-0">
                              {medal ? <span className="text-2xl">{medal}</span>
                                : <span className="text-lg font-black text-stone-500">#{idx + 1}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-stone-100 truncate">{sub.studentName}</div>
                              <div className="text-[11px] text-stone-400 font-mono">
                                {sub.token} · {sub.gameOutcome === 'victory' ? '🏆 Menang' : '💀 Kalah'}
                              </div>
                            </div>
                            <div className="text-right shrink-0 space-y-0.5">
                              <div className="text-lg font-black text-emerald-400">{sub.accuracy}%</div>
                              <div className="text-[10px] text-stone-400 font-mono">
                                🧟 {sub.zombiesKilled} · ☀️ {sub.sunsCollected}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}



            </div>
          </div>
        )}

      </div>

      {/* ============ QR MODAL OVERLAY ============ */}
      {qrPkg && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
          onClick={() => setQrPkg(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-stone-900 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />QR Code Token
              </h3>
              <button onClick={() => setQrPkg(null)}
                className="p-1 rounded-lg text-stone-500 hover:bg-stone-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <div className="text-3xl font-black font-mono text-amber-600">{qrPkg.token}</div>
              <div className="text-sm text-stone-600 mt-1">{qrPkg.title}</div>
            </div>
            <div className="flex justify-center bg-stone-100 p-3 rounded-2xl">
              <img src={getQrImgUrl(qrPkg)} alt={`QR Code ${qrPkg.token}`}
                className="w-64 h-64 rounded-lg" />
            </div>
            <p className="text-xs text-stone-500 text-center leading-snug">
              Siswa scan QR ini untuk langsung membuka game dengan token terisi otomatis.
            </p>
            <div className="flex gap-2">
              <a href={getQrImgUrl(qrPkg)} target="_blank" rel="noopener noreferrer"
                className="flex-1 py-2.5 text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-center">
                Buka Gambar QR
              </a>
              <button onClick={() => handleCopyTokenCode(qrPkg.token)}
                className="flex-1 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl">
                Salin Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};