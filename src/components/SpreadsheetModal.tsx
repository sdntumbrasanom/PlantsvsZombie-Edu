import React, { useState } from 'react';
import { Question } from '../types/game';
import { 
  parseSpreadsheetData, 
  getSampleCsvTemplate, 
  PRESET_COLLECTIONS,
  exportQuestionsToCsv 
} from '../utils/spreadsheetParser';
import { 
  X, 
  FileSpreadsheet, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Layers,
  HelpCircle
} from 'lucide-react';

interface SpreadsheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onSaveQuestions: (newQuestions: Question[]) => void;
}

export const SpreadsheetModal: React.FC<SpreadsheetModalProps> = ({
  isOpen,
  onClose,
  questions,
  onSaveQuestions
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'manage' | 'presets'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [ignoreHeader, setIgnoreHeader] = useState(true);
  const [parseStatus, setParseStatus] = useState<{ count: number; errors: string[] } | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Manual single question form state
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualQ, setManualQ] = useState('');
  const [manualCorrect, setManualCorrect] = useState('');
  const [manualD1, setManualD1] = useState('');
  const [manualD2, setManualD2] = useState('');
  const [manualD3, setManualD3] = useState('');

  if (!isOpen) return null;

  const handleTestParse = () => {
    const result = parseSpreadsheetData(pasteText, ignoreHeader);
    setParseStatus({
      count: result.questions.length,
      errors: result.errors
    });
  };

  const handleApplyPaste = () => {
    const result = parseSpreadsheetData(pasteText, ignoreHeader);
    if (result.questions.length > 0) {
      onSaveQuestions(result.questions);
      setParseStatus({
        count: result.questions.length,
        errors: result.errors
      });
      setActiveTab('manage');
    } else {
      setParseStatus({
        count: 0,
        errors: result.errors.length > 0 ? result.errors : ['Tidak ada soal valid yang ditemukan.']
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setPasteText(content);
        const result = parseSpreadsheetData(content, ignoreHeader);
        setParseStatus({
          count: result.questions.length,
          errors: result.errors
        });
      }
    };
    reader.readAsText(file);
  };

  const handleCopySample = () => {
    const sample = getSampleCsvTemplate();
    navigator.clipboard.writeText(sample).then(() => {
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2000);
    });
  };

  const handleDownloadTemplate = () => {
    const sample = getSampleCsvTemplate();
    const blob = new Blob([sample], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_soal_pvz.tsv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportQuestions = () => {
    const content = exportQuestionsToCsv(questions);
    const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'bank_soal_pvz_aktif.tsv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('Minimal harus ada 1 soal di dalam game.');
      return;
    }
    const updated = questions.filter(q => q.id !== id);
    onSaveQuestions(updated);
  };

  const handleAddManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualQ.trim() || !manualCorrect.trim() || !manualD1.trim()) {
      alert('Harap isi Pertanyaan, Jawaban Benar, dan minimal 1 Pengecoh.');
      return;
    }
    const newQuestion: Question = {
      id: `manual-${Date.now()}`,
      question: manualQ.trim(),
      correctAnswer: manualCorrect.trim(),
      distractor1: manualD1.trim(),
      distractor2: manualD2.trim() || `${manualCorrect} (Pilihan salah)`,
      distractor3: manualD3.trim() || 'Tidak ada yang benar',
      category: 'Input Manual'
    };
    onSaveQuestions([newQuestion, ...questions]);
    setManualQ('');
    setManualCorrect('');
    setManualD1('');
    setManualD2('');
    setManualD3('');
    setIsAddingManual(false);
  };

  const handleLoadPreset = (presetData: Question[]) => {
    onSaveQuestions(presetData);
    setActiveTab('manage');
  };

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.correctAnswer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-stone-900 border border-amber-600/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-stone-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-700/50 text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-200 tracking-wide">
                Integrasi Bank Soal Spreadsheet
              </h2>
              <p className="text-xs text-stone-400">
                Format: Kolom A (Soal) · Kolom B (Jawaban Benar) · Kolom C, D, E (Pengecoh)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-stone-800 bg-stone-900/50">
          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Tempel / Unggah Spreadsheet
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'manage'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            Daftar Soal Aktif ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`pb-3 px-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'presets'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            Paket Soal Bawaan
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: PASTE / UPLOAD */}
          {activeTab === 'paste' && (
            <div className="space-y-6">
              {/* Spreadsheet Structure Visual Diagram */}
              <div className="rounded-xl border border-stone-700/80 bg-stone-950/60 p-4 space-y-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Struktur Kolom Spreadsheet (Google Sheets / Excel)
                </span>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-stone-700">
                    <thead>
                      <tr className="bg-stone-800 text-stone-300">
                        <th className="p-2 border border-stone-700 font-mono text-emerald-400">Kolom A</th>
                        <th className="p-2 border border-stone-700 font-mono text-emerald-400">Kolom B</th>
                        <th className="p-2 border border-stone-700 font-mono text-amber-400">Kolom C</th>
                        <th className="p-2 border border-stone-700 font-mono text-amber-400">Kolom D</th>
                        <th className="p-2 border border-stone-700 font-mono text-amber-400">Kolom E</th>
                      </tr>
                      <tr className="bg-stone-900/80 text-stone-400 font-medium">
                        <th className="p-2 border border-stone-700 text-emerald-300">Pertanyaan</th>
                        <th className="p-2 border border-stone-700 text-emerald-300">Jawaban Benar</th>
                        <th className="p-2 border border-stone-700 text-amber-300">Pengecoh 1</th>
                        <th className="p-2 border border-stone-700 text-amber-300">Pengecoh 2</th>
                        <th className="p-2 border border-stone-700 text-amber-300">Pengecoh 3</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-stone-300 text-[11px]">
                      <tr className="bg-stone-900/40">
                        <td className="p-2 border border-stone-800 text-stone-200">Di mana fotosintesis terjadi?</td>
                        <td className="p-2 border border-stone-800 text-emerald-400 font-semibold">Kloroplas</td>
                        <td className="p-2 border border-stone-800 text-stone-400">Mitokondria</td>
                        <td className="p-2 border border-stone-800 text-stone-400">Ribosom</td>
                        <td className="p-2 border border-stone-800 text-stone-400">Badan Golgi</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-stone-400">
                  <span>💡 Cukup blok sel di Google Sheets / Excel, tekan <b>Ctrl + C</b>, lalu tempel di kotak di bawah.</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopySample}
                      className="px-2.5 py-1 text-xs font-medium bg-stone-800 hover:bg-stone-700 rounded text-amber-200 flex items-center gap-1.5 transition-colors"
                    >
                      {copiedTemplate ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedTemplate ? 'Tersalin!' : 'Salin Contoh Format'}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="px-2.5 py-1 text-xs font-medium bg-stone-800 hover:bg-stone-700 rounded text-emerald-300 flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Unduh File Template (.tsv)
                    </button>
                  </div>
                </div>
              </div>

              {/* Paste Textarea */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="spreadsheet-paste-box" className="text-xs font-medium text-stone-300">
                    Kotak Tempel (Paste) atau Drop Teks CSV / TSV
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-stone-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ignoreHeader}
                      onChange={(e) => setIgnoreHeader(e.target.checked)}
                      className="rounded border-stone-700 text-emerald-600 focus:ring-emerald-500 bg-stone-800"
                    />
                    Abaikan baris pertama jika berisi Header / Judul Kolom
                  </label>
                </div>

                <textarea
                  id="spreadsheet-paste-box"
                  rows={6}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Tempel baris dari Google Sheets di sini...&#10;Contoh:&#10;Bagian tumbuhan penyerap air?&#9;Akar&#9;Batang&#9;Daun&#9;Bunga"
                  className="w-full p-3 font-mono text-xs bg-stone-950 border border-stone-700 rounded-xl text-stone-200 placeholder-stone-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />

                {/* Upload from file button */}
                <div className="flex items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 rounded-lg text-stone-200 border border-stone-700 flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5 text-emerald-400" />
                      Unggah File (.csv / .tsv / .txt)
                      <input
                        type="file"
                        accept=".csv,.tsv,.txt"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {pasteText && (
                      <button
                        type="button"
                        onClick={() => {
                          setPasteText('');
                          setParseStatus(null);
                        }}
                        className="text-xs text-stone-500 hover:text-stone-300"
                      >
                        Bersihkan
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleTestParse}
                      disabled={!pasteText.trim()}
                      className="px-4 py-2 text-xs font-medium bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-300 rounded-lg transition-colors"
                    >
                      Periksa Format
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyPaste}
                      disabled={!pasteText.trim()}
                      className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Terapkan ke Game
                    </button>
                  </div>
                </div>
              </div>

              {/* Parser Feedback */}
              {parseStatus && (
                <div className={`p-4 rounded-xl border ${parseStatus.count > 0 ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-red-950/40 border-red-800/60'}`}>
                  <div className="flex items-start gap-2.5">
                    {parseStatus.count > 0 ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className={`text-sm font-semibold ${parseStatus.count > 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                        {parseStatus.count > 0
                          ? `Berhasil mendeteksi ${parseStatus.count} soal!`
                          : 'Gagal mendeteksi soal.'}
                      </p>
                      {parseStatus.errors.length > 0 && (
                        <ul className="text-xs text-amber-200/90 list-disc list-inside space-y-0.5">
                          {parseStatus.errors.slice(0, 4).map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANAGE ACTIVE QUESTIONS */}
          {activeTab === 'manage' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari pertanyaan atau jawaban..."
                    className="px-3 py-1.5 text-xs bg-stone-950 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 w-64 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-stone-400">
                    Menampilkan {filteredQuestions.length} dari {questions.length} soal
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingManual(!isAddingManual)}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isAddingManual ? 'Tutup Form' : 'Tambah Soal Manual'}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportQuestions}
                    className="px-3 py-1.5 text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg flex items-center gap-1.5 border border-stone-700 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-stone-400" />
                    Ekspor TSV
                  </button>
                </div>
              </div>

              {/* Manual Add Form Drawer */}
              {isAddingManual && (
                <form onSubmit={handleAddManualSubmit} className="p-4 rounded-xl border border-stone-700 bg-stone-950/80 space-y-3">
                  <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                    Form Input Soal Baru
                  </span>
                  <div>
                    <label className="text-[11px] text-stone-400">Pertanyaan (Kolom A):</label>
                    <input
                      type="text"
                      required
                      value={manualQ}
                      onChange={(e) => setManualQ(e.target.value)}
                      placeholder="Contoh: Gas apakah yang diserap oleh tumbuhan saat fotosintesis?"
                      className="w-full p-2 mt-0.5 text-xs bg-stone-900 border border-stone-700 rounded text-stone-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-emerald-400 font-semibold">Jawaban Benar (Kolom B):</label>
                      <input
                        type="text"
                        required
                        value={manualCorrect}
                        onChange={(e) => setManualCorrect(e.target.value)}
                        placeholder="Contoh: Karbon Dioksida (CO2)"
                        className="w-full p-2 mt-0.5 text-xs bg-stone-900 border border-emerald-700 rounded text-stone-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-amber-300">Pengecoh 1 (Kolom C):</label>
                      <input
                        type="text"
                        required
                        value={manualD1}
                        onChange={(e) => setManualD1(e.target.value)}
                        placeholder="Contoh: Oksigen"
                        className="w-full p-2 mt-0.5 text-xs bg-stone-900 border border-stone-700 rounded text-stone-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-amber-300">Pengecoh 2 (Kolom D):</label>
                      <input
                        type="text"
                        value={manualD2}
                        onChange={(e) => setManualD2(e.target.value)}
                        placeholder="Contoh: Nitrogen"
                        className="w-full p-2 mt-0.5 text-xs bg-stone-900 border border-stone-700 rounded text-stone-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-amber-300">Pengecoh 3 (Kolom E):</label>
                      <input
                        type="text"
                        value={manualD3}
                        onChange={(e) => setManualD3(e.target.value)}
                        placeholder="Contoh: Helium"
                        className="w-full p-2 mt-0.5 text-xs bg-stone-900 border border-stone-700 rounded text-stone-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingManual(false)}
                      className="px-3 py-1.5 text-xs text-stone-400 hover:text-stone-200"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
                    >
                      Simpan Soal
                    </button>
                  </div>
                </form>
              )}

              {/* Questions List Table */}
              <div className="border border-stone-800 rounded-xl overflow-hidden bg-stone-950/40">
                <div className="max-h-80 overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-stone-800 text-stone-300 font-semibold border-b border-stone-700 z-10">
                      <tr>
                        <th className="p-2.5 w-10 text-center">#</th>
                        <th className="p-2.5">Pertanyaan (Kolom A)</th>
                        <th className="p-2.5 text-emerald-400">Jawaban Benar (Kolom B)</th>
                        <th className="p-2.5 text-amber-300">Pengecoh (C, D, E)</th>
                        <th className="p-2.5 w-12 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60">
                      {filteredQuestions.map((q, idx) => (
                        <tr key={q.id} className="hover:bg-stone-800/40 transition-colors">
                          <td className="p-2.5 text-center font-mono text-stone-500 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 text-stone-200 font-medium">
                            {q.question}
                          </td>
                          <td className="p-2.5 text-emerald-400 font-semibold">
                            {q.correctAnswer}
                          </td>
                          <td className="p-2.5 text-stone-400">
                            <span className="line-clamp-1">
                              {q.distractor1} · {q.distractor2} · {q.distractor3}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              title="Hapus soal ini"
                              className="p-1 rounded text-stone-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRESET PACKS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-amber-200">
                  Pilih Paket Soal Siap Pakai
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  Gunakan bank soal bawaan bertema biologi tumbuhan, sains alam, atau trivia untuk langsung bermain.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PRESET_COLLECTIONS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-xl border border-stone-800 bg-stone-950/60 flex flex-col justify-between space-y-4 hover:border-amber-600/40 transition-all"
                  >
                    <div className="space-y-1.5">
                      <h4 className="text-sm font-bold text-stone-100">{preset.name}</h4>
                      <p className="text-xs text-stone-400">
                        {preset.count} Soal Teruji
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="text-[11px] text-stone-500 font-mono italic line-clamp-2">
                        Contoh: "{preset.data[0]?.question}"
                      </div>
                      <button
                        type="button"
                        onClick={() => handleLoadPreset(preset.data)}
                        className="w-full py-2 text-xs font-semibold bg-stone-800 hover:bg-emerald-600 hover:text-white text-stone-200 rounded-lg transition-colors border border-stone-700"
                      >
                        Gunakan Paket Ini
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-stone-800 bg-stone-950/80">
          <div className="text-xs text-stone-400">
            Total Soal Siap Main: <span className="font-semibold text-emerald-400 font-mono">{questions.length}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-lg transition-colors shadow-md"
          >
            Selesai & Lanjut Main
          </button>
        </div>

      </div>
    </div>
  );
};
