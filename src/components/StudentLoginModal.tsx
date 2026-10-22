import React, { useState, useEffect } from 'react';
import { TeacherTokenPackage, StudentProfile } from '../types/game';
import { findTokenPackageAsync, getTeacherTokens, getGasApiUrl, saveGasApiUrl, testGasConnection } from '../utils/teacherStorage';
import { X, KeyRound, User, AlertCircle, ArrowRight, Play, Sparkles, Layers, FlaskConical, Database, Loader2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStudentLoginSuccess: (profile: StudentProfile, tokenPkg: TeacherTokenPackage, level?: number) => void;
  initialToken?: string;
}

const LEVEL_LIST = [
  { level: 1, name: 'Lvl 1', desc: 'Pemula', color: 'border-emerald-600 text-emerald-400' },
  { level: 2, name: 'Lvl 2', desc: 'Kerucut', color: 'border-green-600 text-green-400' },
  { level: 3, name: 'Lvl 3', desc: 'Ember', color: 'border-teal-600 text-teal-400' },
  { level: 4, name: 'Lvl 4', desc: 'Pelari', color: 'border-blue-600 text-blue-400' },
  { level: 5, name: 'Lvl 5', desc: 'Campuran', color: 'border-indigo-600 text-indigo-400' },
  { level: 6, name: 'Lvl 6', desc: 'Baja Super', color: 'border-purple-600 text-purple-400' },
  { level: 7, name: 'Lvl 7', desc: 'Serbuan', color: 'border-pink-600 text-pink-400' },
  { level: 8, name: 'Lvl 8', desc: 'Elit', color: 'border-rose-600 text-rose-400' },
  { level: 9, name: 'Lvl 9', desc: 'Brutal', color: 'border-red-600 text-red-400' },
  { level: 10, name: 'Lvl 10', desc: 'Bos Akbar 🔥', color: 'border-amber-500 text-amber-400' },
];

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen,
  onClose,
  onStudentLoginSuccess,
  initialToken = ''
}) => {
  const [studentName, setStudentName] = useState<string>('');
  const [tokenInput, setTokenInput] = useState<string>(initialToken);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckingToken, setIsCheckingToken] = useState<boolean>(false);

  // Quick database connection setup in student view (if teacher didn't send full link)
  const [showDbSettings, setShowDbSettings] = useState<boolean>(false);
  const [gasUrlInput, setGasUrlInput] = useState<string>('');
  const [dbStatusMsg, setDbStatusMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [isTestingDb, setIsTestingDb] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      if (initialToken && !tokenInput) {
        setTokenInput(initialToken.toUpperCase());
      }
      setGasUrlInput(getGasApiUrl());
    }
  }, [isOpen, initialToken]);

  if (!isOpen) return null;

  const availableTokens = getTeacherTokens();
  const configuredGasUrl = getGasApiUrl();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMessage('Harap masukkan nama lengkap atau nama panggilanmu.');
      return;
    }

    if (!tokenInput.trim()) {
      setErrorMessage('Harap ketik kode Token Kuis yang diberikan oleh gurumu.');
      return;
    }

    setIsCheckingToken(true);
    setErrorMessage(null);

    try {
      const pkg = await findTokenPackageAsync(tokenInput);
      if (!pkg) {
        const hasGas = Boolean(getGasApiUrl());
        setErrorMessage(
          hasGas
            ? `Token "${tokenInput.trim().toUpperCase()}" tidak ditemukan di database Google Spreadsheet. Pastikan gurumu telah membuat & menyimpan token tersebut.`
            : `Token "${tokenInput.trim().toUpperCase()}" belum ditemukan di perangkat ini. Jika menggunakan perangkat berbeda, pastikan URL Database Google Spreadsheet sudah diatur.`
        );
        setIsCheckingToken(false);
        return;
      }

      // Success!
      setIsCheckingToken(false);
      setErrorMessage(null);
      onStudentLoginSuccess(
        {
          name: studentName.trim(),
          token: pkg.token
        },
        pkg,
        selectedLevel
      );
      onClose();
    } catch (err: any) {
      setIsCheckingToken(false);
      setErrorMessage('Terjadi kendala saat memeriksa token. Periksa koneksi internet Anda.');
    }
  };

  const handleSaveStudentDbUrl = async () => {
    const trimmed = gasUrlInput.trim();
    saveGasApiUrl(trimmed);
    if (!trimmed) {
      setDbStatusMsg({ success: true, text: 'URL Database dikosongkan.' });
      return;
    }
    setIsTestingDb(true);
    const result = await testGasConnection(trimmed);
    setIsTestingDb(false);
    if (result.success) {
      setDbStatusMsg({ success: true, text: 'Terhubung ke Google Spreadsheet Guru!' });
    } else {
      setDbStatusMsg({ success: false, text: result.message });
    }
  };

  const handleUseTrialToken = (tok: string) => {
    setTokenInput(tok);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-stone-900 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-7 shadow-2xl text-stone-100 flex flex-col space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300">
              <KeyRound className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-amber-300">
                Mulai Permainan
              </h3>
              <p className="text-xs text-stone-400">
                Isi nama, masukkan token, dan pilih level tantangan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form: Nama -> Token -> Pilih Level */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          
          {/* 1. Nama Siswa */}
          <div>
            <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-400" />
              1. Nama Siswa:
            </label>
            <input
              type="text"
              required
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Ketik namamu di sini (Contoh: Budi Santoso)"
              className="w-full p-3 mt-1.5 text-sm bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-amber-400"
            />
          </div>

            {/* 2. Token (Diketik Manual) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  2. Token Kuis (Ketik Manual):
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-wider font-bold">
                  Wajib Diketik Manual
                </span>
              </div>
              <input
                type="text"
                required
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                placeholder="Ketik manual token guru di sini (Contoh: GURU-101)"
                className="w-full p-3.5 text-sm font-mono font-bold tracking-wider uppercase bg-stone-950 border-2 border-stone-700 rounded-xl text-amber-300 placeholder:text-stone-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/30"
              />

              {/* Pilihan Token: HANYA UNTUK PERCOBAAN SAJA */}
              {availableTokens.length > 0 && (
                <div className="mt-2 p-3 rounded-xl bg-amber-950/20 border border-amber-600/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold">
                    <FlaskConical className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Pilihan di bawah ini HANYA UNTUK PERCOBAAN saja:</span>
                  </div>
                  <p className="text-[10px] text-stone-400 leading-relaxed">
                    (Jika Anda siswa yang mengikuti tugas kelas, silakan ketik manual kode token dari guru Anda di kolom atas)
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {availableTokens.map((t) => (
                      <button
                        key={t.token}
                        type="button"
                        onClick={() => handleUseTrialToken(t.token)}
                        className="px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg border border-amber-500/40 bg-stone-900/90 text-amber-300 hover:bg-amber-950 hover:border-amber-400 transition-colors cursor-pointer flex items-center gap-1"
                        title="Klik untuk uji coba dengan token percobaan ini"
                      >
                        <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 rounded text-amber-200">Uji Coba:</span>
                        <span>{t.token}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          {/* 3. Pilih Level Permainan (1 – 10) setelah mengisi token */}
          <div className="pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                3. Pilih Level Permainan (Level 1 – 10):
              </label>
              <span className="text-xs font-mono font-bold text-amber-300">
                Terpilih: Level {selectedLevel}
              </span>
            </div>

            {/* Grid 10 Level Buttons */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mt-2">
              {LEVEL_LIST.map((lvl) => {
                const isSelected = selectedLevel === lvl.level;
                return (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => setSelectedLevel(lvl.level)}
                    className={`py-2 px-1 rounded-xl text-center transition-all cursor-pointer flex flex-col items-center justify-center border ${
                      isSelected
                        ? 'bg-gradient-to-b from-amber-500 to-yellow-500 text-stone-950 border-amber-300 shadow-md shadow-amber-500/30 scale-105 font-black ring-2 ring-amber-400/60'
                        : 'bg-stone-950 hover:bg-stone-800 text-stone-200 border-stone-800 hover:border-amber-500/50'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-black">{lvl.name}</span>
                    <span className={`text-[9px] truncate max-w-full ${isSelected ? 'text-stone-950 font-bold' : 'text-stone-400'}`}>
                      {lvl.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCheckingToken}
            className="w-full py-4 text-sm sm:text-base font-black bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:opacity-60 text-stone-950 rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-transform active:scale-95 cursor-pointer ring-4 ring-emerald-500/20"
          >
            {isCheckingToken ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memeriksa Token di Database...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-stone-950" />
                <span>Mulai Bermain Level {selectedLevel}</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        {/* Database Connection Status & Accordion (Untuk Siswa di Perangkat Lain) */}
        <div className="pt-1 border-t border-stone-800/80">
          <button
            type="button"
            onClick={() => setShowDbSettings(!showDbSettings)}
            className="w-full flex items-center justify-between text-[11px] text-stone-400 hover:text-amber-300 transition-colors py-1 cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-amber-400" />
              <span>Koneksi Database Spreadsheet:</span>
              <span className={`font-mono font-bold ${configuredGasUrl ? 'text-emerald-400' : 'text-stone-500'}`}>
                {configuredGasUrl ? '● Terhubung' : '○ Belum diatur'}
              </span>
            </span>
            {showDbSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showDbSettings && (
            <div className="mt-2 p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-2 text-xs">
              <p className="text-[11px] text-stone-400 leading-snug">
                Jika Anda bermain dari HP/laptop berbeda dan token dari guru belum terdeteksi, masukkan URL Database Google Apps Script yang diberikan guru Anda:
              </p>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={gasUrlInput}
                  onChange={(e) => setGasUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 p-2 text-[11px] font-mono bg-stone-900 border border-stone-700 rounded-lg text-stone-200 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleSaveStudentDbUrl}
                  disabled={isTestingDb}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  {isTestingDb ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                  <span>{isTestingDb ? 'Menguji...' : 'Simpan'}</span>
                </button>
              </div>
              {dbStatusMsg && (
                <p className={`text-[11px] font-medium ${dbStatusMsg.success ? 'text-emerald-400' : 'text-red-400'}`}>
                  {dbStatusMsg.text}
                </p>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

