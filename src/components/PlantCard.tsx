import React from 'react';
import { PlantType, PlantConfig } from '../types/game';
import { 
  SunflowerSprite, 
  PeashooterSprite, 
  SnowPeaSprite, 
  WallnutSprite, 
  RepeaterSprite, 
  PotatoMineSprite, 
  CherryBombSprite, 
  SunSprite 
} from './Sprites';

export const PLANT_CONFIGS: Record<PlantType, PlantConfig> = {
  sunflower: {
    type: 'sunflower',
    name: 'Bunga Matahari',
    sunCost: 50,
    cooldownSeconds: 6,
    maxHp: 300,
    description: 'Menghasilkan +25 Matahari secara berkala',
    keyboardKey: '1'
  },
  peashooter: {
    type: 'peashooter',
    name: 'Penembak Kacang',
    sunCost: 100,
    cooldownSeconds: 7.5,
    maxHp: 300,
    description: 'Menembakkan kacang polong ke arah zombi',
    keyboardKey: '2'
  },
  snowpea: {
    type: 'snowpea',
    name: 'Kacang Es',
    sunCost: 175,
    cooldownSeconds: 8,
    maxHp: 300,
    description: 'Menembak kacang es yang membekukan & memperlambat zombi',
    keyboardKey: '3'
  },
  wallnut: {
    type: 'wallnut',
    name: 'Kacang Pelindung',
    sunCost: 50,
    cooldownSeconds: 15,
    maxHp: 1200,
    description: 'Benteng kokoh dengan HP sangat tebal untuk menahan zombi',
    keyboardKey: '4'
  },
  repeater: {
    type: 'repeater',
    name: 'Penembak Ganda',
    sunCost: 200,
    cooldownSeconds: 9,
    maxHp: 300,
    description: 'Menembakkan 2 kacang polong sekaligus secara beruntun',
    keyboardKey: '5'
  },
  potatomine: {
    type: 'potatomine',
    name: 'Ranjau Kentang',
    sunCost: 25,
    cooldownSeconds: 14,
    maxHp: 200,
    description: 'Perlu waktu untuk aktif, meledakkan zombi seketika saat diinjak',
    keyboardKey: '6'
  },
  cherrybomb: {
    type: 'cherrybomb',
    name: 'Bom Ceri',
    sunCost: 150,
    cooldownSeconds: 22,
    maxHp: 300,
    description: 'Meledakkan seluruh zombi di area sekitar 3x3 seketika!',
    keyboardKey: '7'
  }
};

interface PlantCardProps {
  type: PlantType;
  currentSun: number;
  isSelected: boolean;
  cooldownProgress: number; // 0 to 1 (0 = ready, 1 = full on cooldown)
  onSelect: (type: PlantType) => void;
}

export const PlantCard: React.FC<PlantCardProps> = ({
  type,
  currentSun,
  isSelected,
  cooldownProgress,
  onSelect
}) => {
  const config = PLANT_CONFIGS[type];
  const canAfford = currentSun >= config.sunCost;
  const isReady = cooldownProgress <= 0.05 && canAfford;

  const renderIcon = () => {
    switch (type) {
      case 'sunflower':
        return <SunflowerSprite size={36} />;
      case 'peashooter':
        return <PeashooterSprite size={36} />;
      case 'snowpea':
        return <SnowPeaSprite size={36} />;
      case 'wallnut':
        return <WallnutSprite size={36} hpPercent={100} />;
      case 'repeater':
        return <RepeaterSprite size={36} />;
      case 'potatomine':
        return <PotatoMineSprite size={36} isArmed={true} />;
      case 'cherrybomb':
        return <CherryBombSprite size={36} />;
      default:
        return null;
    }
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(type)}
      disabled={!canAfford || cooldownProgress > 0.05}
      aria-label={`${config.name} (${config.sunCost} Sun)`}
      title={`${config.name} [Tombol ${config.keyboardKey}]: ${config.description}`}
      className={`relative flex flex-col items-center justify-between w-16 h-20 sm:w-18 sm:h-22 rounded-lg border-2 transition-all select-none p-1 shrink-0 ${
        isSelected
          ? 'border-yellow-400 bg-amber-900/90 shadow-lg ring-2 ring-yellow-400 scale-105 z-10'
          : canAfford && cooldownProgress <= 0.05
          ? 'border-emerald-700 bg-amber-950/80 hover:bg-amber-900 hover:border-emerald-500 cursor-pointer shadow-md'
          : 'border-stone-700 bg-stone-900/90 opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Shortcut number tag in top-right */}
      <span className="absolute top-0.5 right-1 text-[10px] font-mono font-bold text-amber-200/70">
        {config.keyboardKey}
      </span>

      {/* Plant Sprite centered */}
      <div className="flex-1 flex items-center justify-center pointer-events-none mt-1">
        {renderIcon()}
      </div>

      {/* Sun Cost badge at bottom */}
      <div className="w-full flex items-center justify-center gap-1 bg-stone-950/80 rounded py-0.5 border border-stone-800">
        <SunSprite size={13} />
        <span className={`text-xs font-bold font-mono tabular-nums ${canAfford ? 'text-amber-300' : 'text-stone-400'}`}>
          {config.sunCost}
        </span>
      </div>

      {/* Cooldown translucent shutter overlay */}
      {cooldownProgress > 0.05 && (
        <div
          className="absolute inset-0 bg-stone-950/75 rounded-md pointer-events-none overflow-hidden transition-all duration-100"
          style={{ height: `${cooldownProgress * 100}%` }}
        />
      )}
    </button>
  );
};
