import React, { useState } from 'react';
import { GameStats, StudentProfile, StudentSubmission } from '../types/game';
import { saveStudentSubmission } from '../utils/teacherStorage';
import { 
  X, 
  Send, 
  CheckCircle2, 
  User, 
  KeyRound, 
  Check, 
  MessageSquare,
  Sparkles
} from 'lucide-react';

interface SubmitResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameStats: GameStats;
  gameOutcome: 'victory' | 'game_over';
  studentProfile: StudentProfile | null;
  onSubmissionSuccess?: () => void;
}

export const SubmitResultModal: React.FC<SubmitResultModalProps> = ({
  isOpen,
  onClose,
  gameStats,
  gameOutcome,
  studentProfile,
  onSubmissionSuccess
}) => {
  const [studentName, setStudentName] = useState<string>(studentProfile?.name || '');
  const [token, setToken] = useState<string>(studentProfile?.token || 'GURU-101');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [copiedWa, setCopiedWa] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const accuracy = gameStats.questionsAnswered > 0
    ? Math.round((gameStats.questionsCorrect / gameStats.questionsAnswered) * 100)
    : 100;

  const handleSendToTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMsg('Harap masukkan nama lengkapmu.');
      return;
    }

    const submission: StudentSubmission = {
      id: `sub-manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentName: studentName.trim(),
      token: (token.trim() || 'GURU-101').toUpperCase(),
      quizTitle: 'Kuis PvZ Edukasi',
      zombiesKilled: gameStats.zombiesKilled,
      sunsCollected: gameStats.sunsCollected,
      questionsAnswered: gameStats.questionsAnswered,
      questionsCorrect: gameStats.questionsCorrect,
      accuracy,
      gameOutcome,
      waveReached: gameStats.wave,
      level: gameStats.level || 1,
      timestamp: Date.now()
    };

    // Ini akan memperbarui data yang sudah disimpan otomatis oleh App.tsx 
    // (jika namanya sama) atau menambahkan data baru jika siswa mengubah namanya.
    saveStudentSubmission(submission);
    
    setIsSubmitted(true);
    setErrorMsg(null);
    if (onSubmissionSuccess) onSubmissionSuccess();
  };

  const handleCopyWhatsAppReport = () => {
    const outcomeText = gameOutcome === 'victory' ? '🏆 MENANG (Semua Gelombang Selesai)' : `💀 Kalah di Gelombang ${gameStats.wave}`;
    const text = `*LAPORAN HASIL KUIS GAME PLANTS VS ZOMBIES*\n` +
      `👤 *Nama Siswa*: ${studentName || 'Siswa'}\n` +
      `🔑 *Token Kuis*: ${token.toUpperCase()}\n` +
      `🎮 *Level*: Level ${gameStats.level || 1}\n` +
      `🏁 *Hasil*: ${outcomeText}\n` +
      `--------------------------------\n` +
      `✅ *Soal Dikerjakan*: ${gameStats.questionsCorrect} Benar dari ${gameStats.questionsAnswered} Soal\n` +
      `🎯 *Akurasi Jawaban*: ${accuracy}%\n` +
      `🧟 *Zombi Ditumpas*: ${gameStats.zombiesKilled} Zombi\n` +
      `☀️ *Matahari Dikumpulkan*: ${gameStats.sunsCollected} Matahari\n` +
      `📅 *Tanggal*: ${new Date().toLocaleDateString('id-ID')} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-stone-900 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 flex flex-col space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-400">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-emerald-300">
                Laporan Hasil Permainan
              </h3>
              <p className="text-xs text-stone-400">
                Periksa namamu dan salin laporan untuk dikirim ke Guru
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Auto-Save Banner */}
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/50 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200 leading-snug">
            <b>Nilaimu sudah otomatis masuk ke Papan Peringkat!</b> Form di bawah ini bisa kamu gunakan untuk mengoreksi nama/token jika salah ketik, lalu salin laporan ke WA Guru.
          </p>
        </div>

        {/* Performance Metrics Card */}
        <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 grid grid-cols-3 gap-3 text-center">
          <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-800/80">
            <span className="text-[11px] text-stone-400 block">Soal Dikerjakan</span>
            <p className="text-lg font-black font-mono text-emerald-400">
              {gameStats.questionsCorrect} <span className="text-xs text-stone-400 font-normal">/ {gameStats.questionsAnswered}</span>
            </p>
            <span className="text-[10px] text-emerald-500 font-bold">{accuracy}% Benar</span>
          </div>

          <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-800/80">
            <span className="text-[11px] text-stone-400 block">Zombi Ditumpas</span>
            <p className="text-lg font-black font-mono text-amber-300">
              {gameStats.zombiesKilled}
            </p>
            <span className="text-[10px] text-stone-500">Zombi gugur</span>
          </div>

          <div className="p-2 rounded-xl bg-stone-900/60 border border-stone-800/80">
            <span className="text-[11px] text-stone-400 block">Matahari</span>
            <p className="text-lg font-black font-mono text-yellow-400">
              {gameStats.sunsCollected}
            </p>
            <span className="text-[10px] text-stone-500">Terkumpul</span>
          </div>
        </div>

        {/* State: Not yet submitted */}
        {!isSubmitted ? (
          <form onSubmit={handleSendToTeacher} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-400" />
                Nama Siswa:
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Masukkan nama lengkapmu..."
                className="w-full p-2.5 mt-1 text-sm bg-stone-950 border border-stone-700 rounded-xl text-stone-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-300 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Token Kuis dari Guru:
              </label>
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="Contoh: GURU-101"
                className="w-full p-2.5 mt-1 text-sm font-mono font-bold uppercase bg-stone-950 border border-stone-700 rounded-xl text-amber-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-xs text-red-200">
                {errorMsg}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="submit"
                className="flex-1 py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-stone-950 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan Perbaikan Data
              </button>

              <button
                type="button"
                onClick={handleCopyWhatsAppReport}
                className="py-3 px-4 text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl border border-stone-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedWa ? <Check className="w-4 h-4 text-emerald-400" /> : <MessageSquare className="w-4 h-4 text-emerald-400" />}
                {copiedWa ? 'Tersalin!' : 'Salin Laporan WA'}
              </button>
            </div>
          </form>
        ) : (
          /* State: Successfully submitted */
          <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-600/60 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-bold text-emerald-300">
                Data Berhasil Disimpan!
              </h4>
              <p className="text-xs text-stone-300">
                Nama <b>{studentName}</b> telah tercatat untuk Token <b>{token.toUpperCase()}</b>.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={handleCopyWhatsAppReport}
                className="py-2.5 px-4 text-xs font-bold bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-xl border border-stone-700 flex items-center justify-center gap-2 transition-colors"
              >
                {copiedWa ? <Check className="w-4 h-4 text-emerald-400" /> : <MessageSquare className="w-4 h-4" />}
                {copiedWa ? 'Laporan Tersalin!' : 'Salin Laporan WhatsApp'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-stone-950 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};