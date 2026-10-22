import React, { useState } from 'react';
import { GameStats } from '../types/game';
import { 
  Award, 
  Target, 
  Sun, 
  Skull, 
  GraduationCap, 
  ShieldCheck, 
  Zap, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface AchievementItem {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  thresholdDesc: string;
  isUnlocked: boolean;
  progressText: string;
  icon: React.ReactNode;
  badgeColor: string;
  glowColor: string;
}

interface AchievementSystemProps {
  stats: GameStats;
}

export const AchievementSystem: React.FC<AchievementSystemProps> = ({ stats }) => {
  const [showAll, setShowAll] = useState<boolean>(false);

  const accuracy = stats.questionsAnswered > 0 
    ? Math.round((stats.questionsCorrect / stats.questionsAnswered) * 100) 
    : 100;

  // Evaluate performance thresholds
  const achievements: AchievementItem[] = [
    {
      id: 'sharp_shooter',
      name: 'Sharp Shooter',
      subtitle: 'Penembak Jitu',
      description: 'Menjawab soal kuis dengan akurasi tajam & jitu (Akurasi ≥ 75%).',
      thresholdDesc: 'Minimal 1 soal benar & akurasi kuis ≥ 75%',
      isUnlocked: stats.questionsCorrect >= 1 && accuracy >= 75,
      progressText: `${stats.questionsCorrect} Benar (${accuracy}%)`,
      icon: <Target className="w-5 h-5 text-emerald-300" />,
      badgeColor: 'from-emerald-600/30 to-teal-900/60 border-emerald-400 text-emerald-300',
      glowColor: 'shadow-emerald-500/20 ring-emerald-500/40'
    },
    {
      id: 'sun_collector',
      name: 'Sun Collector',
      subtitle: 'Kolektor Surya',
      description: 'Mengumpulkan pasokan energi matahari yang melimpah untuk pasukan tanaman.',
      thresholdDesc: 'Kumpulkan minimal 60 matahari',
      isUnlocked: stats.sunsCollected >= 60,
      progressText: `${stats.sunsCollected} / 60 ☀️`,
      icon: <Sun className="w-5 h-5 text-yellow-300 fill-yellow-400/40" />,
      badgeColor: 'from-amber-600/30 to-yellow-900/60 border-yellow-400 text-yellow-300',
      glowColor: 'shadow-yellow-500/20 ring-yellow-500/40'
    },
    {
      id: 'zombie_slayer',
      name: 'Zombie Slayer',
      subtitle: 'Pembasmi Zombi',
      description: 'Menumpas gerombolan zombi pekarangan secara gagah berani.',
      thresholdDesc: 'Tumpas minimal 10 zombi',
      isUnlocked: stats.zombiesKilled >= 10,
      progressText: `${stats.zombiesKilled} / 10 🧟`,
      icon: <Skull className="w-5 h-5 text-rose-300" />,
      badgeColor: 'from-rose-600/30 to-red-900/60 border-rose-400 text-rose-300',
      glowColor: 'shadow-rose-500/20 ring-rose-500/40'
    },
    {
      id: 'brain_master',
      name: 'Brain Master',
      subtitle: 'Master Kuis Cerdas',
      description: 'Aktif menjawab kuis materi pelajaran untuk mendukung kemenangan.',
      thresholdDesc: 'Jawab minimal 2 soal dengan benar',
      isUnlocked: stats.questionsCorrect >= 2,
      progressText: `${stats.questionsCorrect} / 2 Soal`,
      icon: <GraduationCap className="w-5 h-5 text-indigo-300" />,
      badgeColor: 'from-indigo-600/30 to-blue-900/60 border-indigo-400 text-indigo-300',
      glowColor: 'shadow-indigo-500/20 ring-indigo-500/40'
    },
    {
      id: 'lawn_guardian',
      name: 'Lawn Guardian',
      subtitle: 'Benteng Pekarangan',
      description: 'Mempertahankan pekarangan dan mengusir seluruh gelombang penyerbu.',
      thresholdDesc: 'Selesaikan level kemenangan',
      isUnlocked: true, // Reached victory screen!
      progressText: `Level ${stats.level || 1} Menang`,
      icon: <ShieldCheck className="w-5 h-5 text-green-300" />,
      badgeColor: 'from-green-600/30 to-emerald-900/60 border-green-400 text-green-300',
      glowColor: 'shadow-green-500/20 ring-green-500/40'
    },
    {
      id: 'overcharge_hero',
      name: 'Overcharge Hero',
      subtitle: 'Pahlawan Super',
      description: 'Performa spektakuler mengumpulkan 120+ matahari atau menumpas 20+ zombi.',
      thresholdDesc: '120+ Matahari atau 20+ Zombi',
      isUnlocked: stats.sunsCollected >= 120 || stats.zombiesKilled >= 20,
      progressText: `${stats.sunsCollected} ☀️ / ${stats.zombiesKilled} 🧟`,
      icon: <Zap className="w-5 h-5 text-cyan-300 fill-cyan-400/40" />,
      badgeColor: 'from-cyan-600/30 to-blue-900/60 border-cyan-400 text-cyan-300',
      glowColor: 'shadow-cyan-500/20 ring-cyan-500/40'
    }
  ];

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const displayedAchievements = showAll ? achievements : achievements.slice(0, 4);

  return (
    <div className="w-full bg-stone-950/70 border border-stone-800 rounded-2xl p-3 sm:p-4 text-left space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span>Achievement System</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            </h4>
            <p className="text-[10px] text-stone-400">
              Lencana prestasi berdasarkan performa bermain & kuis
            </p>
          </div>
        </div>

        <div className="px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-[11px] font-mono font-bold text-amber-300">
          {unlockedCount} / {achievements.length} Terbuka
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 gap-2 pt-0.5">
        {displayedAchievements.map((badge) => {
          return (
            <div
              key={badge.id}
              className={`relative p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                badge.isUnlocked
                  ? `bg-gradient-to-br ${badge.badgeColor} shadow-md ${badge.glowColor} ring-1`
                  : 'bg-stone-900/60 border-stone-800 text-stone-500 opacity-60'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded-lg shrink-0 ${badge.isUnlocked ? 'bg-stone-950/60' : 'bg-stone-950/40 text-stone-600'}`}>
                  {badge.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-xs font-black truncate ${badge.isUnlocked ? 'text-white' : 'text-stone-400'}`}>
                      {badge.name}
                    </span>
                    {badge.isUnlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 text-stone-500 shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-stone-300 block truncate">
                    {badge.subtitle}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[10px]">
                <span className="text-stone-400 truncate pr-1">
                  {badge.thresholdDesc}
                </span>
                <span className={`font-mono font-bold shrink-0 ${badge.isUnlocked ? 'text-amber-300' : 'text-stone-500'}`}>
                  {badge.progressText}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more toggle button */}
      {achievements.length > 4 && (
        <div className="text-center pt-0.5">
          <button
            type="button"
            onClick={() => setShowAll(prev => !prev)}
            className="text-[11px] font-semibold text-stone-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer py-0.5 px-2 rounded-md hover:bg-stone-900"
          >
            {showAll ? (
              <>
                <span>Tampilkan Lebih Sedikit</span>
                <ChevronUp className="w-3 h-3" />
              </>
            ) : (
              <>
                <span>Lihat Semua Lencana ({achievements.length})</span>
                <ChevronDown className="w-3 h-3" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
