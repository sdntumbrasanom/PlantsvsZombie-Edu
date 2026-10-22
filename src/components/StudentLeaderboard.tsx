import React, { useState, useEffect, useMemo } from 'react';
import { StudentSubmission } from '../types/game';
import { getStudentSubmissions, getTeacherTokens, syncAndGetSubmissions } from '../utils/teacherStorage';
import { Trophy, RefreshCw } from 'lucide-react';

interface StudentLeaderboardProps {
  token: string;
  currentStudentName?: string;
  quizTitle?: string;
  maxDisplay?: number;
}

interface RankedSubmission extends StudentSubmission {
  rank: number;
}

const rankSubmissions = (subs: StudentSubmission[]): RankedSubmission[] =>
  subs.slice().sort((a, b) => {
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
    if (b.zombiesKilled !== a.zombiesKilled) return b.zombiesKilled - a.zombiesKilled;
    if (b.questionsCorrect !== a.questionsCorrect) return b.questionsCorrect - a.questionsCorrect;
    return a.timestamp - b.timestamp;
  }).map((s, i) => ({ ...s, rank: i + 1 }));

export const StudentLeaderboard: React.FC<StudentLeaderboardProps> = ({
  token, currentStudentName, quizTitle, maxDisplay = 5,
}) => {
  const [allRanked, setAllRanked] = useState<RankedSubmission[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const resolvedTitle = useMemo(() => {
    if (quizTitle) return quizTitle;
    try {
      const tokens = getTeacherTokens();
      return tokens.find(t => t.token.toUpperCase() === token.toUpperCase())?.title || `Kuis ${token}`;
    } catch { return `Kuis ${token}`; }
  }, [quizTitle, token]);

  const loadData = async () => {
    setIsRefreshing(true);
    // 1. Tampilkan data lokal segera (cepat)
    try {
      const localAll = getStudentSubmissions() || [];
      const localFiltered = localAll.filter(s => s.token.toUpperCase() === token.toUpperCase());
      setAllRanked(rankSubmissions(localFiltered));
    } catch {}

    // 2. Sinkronkan dari Google Spreadsheet database
    try {
      const synced = await syncAndGetSubmissions(token);
      setAllRanked(rankSubmissions(synced));
    } catch (err) {
      console.warn('Gagal memuat leaderboard dari database spreadsheet:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, [token]);

  const mySubmission = useMemo(() => {
    if (!currentStudentName) return undefined;
    const normalized = currentStudentName.trim().toLowerCase();
    return allRanked.find(s => s.studentName.trim().toLowerCase() === normalized);
  }, [allRanked, currentStudentName]);

  const topList = allRanked.slice(0, maxDisplay);
  const isMeInTop = mySubmission ? topList.some(s => s.id === mySubmission.id) : false;

  const podiumStyle = (rank: number) => {
    if (rank === 1) return { medal: '🥇', cls: 'from-yellow-500/25 border-yellow-500/60' };
    if (rank === 2) return { medal: '🥈', cls: 'from-stone-300/20 border-stone-400/50' };
    if (rank === 3) return { medal: '🥉', cls: 'from-amber-700/25 border-amber-700/50' };
    return { medal: null, cls: 'from-stone-800/40 border-stone-800' };
  };

  const renderRow = (sub: RankedSubmission, isMe: boolean) => {
    const { medal, cls } = podiumStyle(sub.rank);
    return (
      <div key={sub.id} className={`p-2.5 rounded-xl border bg-gradient-to-r ${cls} flex items-center gap-3 ${isMe ? 'ring-2 ring-emerald-400/60' : ''}`}>
        <div className="w-8 shrink-0 text-center">
          {medal ? <span className="text-xl">{medal}</span> : <span className="text-sm font-black text-stone-500">#{sub.rank}</span>}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-stone-100 truncate">{sub.studentName}</span>
            {isMe && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-stone-950 font-black">KAMU</span>}
          </div>
          <div className="text-[10px] text-stone-400 font-mono">{sub.questionsCorrect}/{sub.questionsAnswered} benar</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-black text-emerald-400 leading-none">{sub.accuracy}%</div>
          <div className="text-[9px] text-stone-400 font-mono mt-0.5">🧟 {sub.zombiesKilled}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3 w-full text-left">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-stone-100">Papan Peringkat</h3>
            <p className="text-[10px] text-stone-400 truncate">{resolvedTitle}</p>
          </div>
        </div>
        <button onClick={loadData} disabled={isRefreshing} className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-400 hover:bg-stone-800 transition-colors disabled:opacity-50 shrink-0">
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {mySubmission && (
        <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-emerald-300 font-semibold">Posisi Kamu</div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-black text-amber-300">#{mySubmission.rank}</span>
              <span className="text-[10px] text-stone-400">/ {allRanked.length}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-black text-emerald-400 leading-none">{mySubmission.accuracy}%</div>
          </div>
        </div>
      )}

      {allRanked.length === 0 ? (
        <div className="p-4 text-center rounded-xl border border-stone-800 bg-stone-950/40">
          <p className="text-xs text-stone-500">Belum ada siswa lain yang menyelesaikan kuis ini.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {topList.map(sub => renderRow(sub, currentStudentName ? sub.studentName.trim().toLowerCase() === currentStudentName.trim().toLowerCase() : false))}
          {mySubmission && !isMeInTop && (
            <>
              <div className="text-center text-stone-600 text-[10px] py-0.5">• • •</div>
              {renderRow(mySubmission, true)}
            </>
          )}
        </div>
      )}
    </div>
  );
};