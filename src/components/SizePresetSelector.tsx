import { Upload, X, Check, Trash2, Plus } from 'lucide-react';
import { SizePreset } from '../types';

interface SizePresetSelectorProps {
  presets: SizePreset[];
  selectedPreset: string;
  onSelectPreset: (id: string) => void;
  customWidth: string;
  customHeight: string;
  onCustomWidthChange: (value: string) => void;
  onCustomHeightChange: (value: string) => void;
  theme: 'light' | 'dark';
}

export function SizePresetSelector({
  presets,
  selectedPreset,
  onSelectPreset,
  customWidth,
  customHeight,
  onCustomWidthChange,
  onCustomHeightChange,
  theme,
}: SizePresetSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      {presets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => onSelectPreset(preset.id)}
          type="button"
          className={`text-left p-2 rounded-lg border text-xs transition duration-150 ${
            selectedPreset === preset.id
              ? 'border-blue-500 bg-blue-500/5 text-blue-500 font-semibold'
              : theme === 'dark'
              ? 'border-slate-800 hover:border-slate-700 text-slate-300 bg-slate-900/60'
              : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
          }`}
        >
          <div className="font-semibold">{preset.name}</div>
          <div className="text-[10px] text-neutral-400 mt-0.5">
            {preset.id === 'custom'
              ? `${customWidth} x ${customHeight} cm`
              : `${preset.widthCm} x ${preset.heightCm} cm`}
          </div>
        </button>
      ))}
    </div>
  );
}