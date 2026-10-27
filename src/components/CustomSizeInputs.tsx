import { Upload, X, Check, Trash2, Plus } from 'lucide-react';

interface CustomSizeInputsProps {
  width: string;
  height: string;
  onWidthChange: (value: string) => void;
  onHeightChange: (value: string) => void;
  maxWidth: number;
  maxHeight: number;
  theme: 'light' | 'dark';
}

export function CustomSizeInputs({
  width,
  height,
  onWidthChange,
  onHeightChange,
  maxWidth,
  maxHeight,
  theme,
}: CustomSizeInputsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 p-3 mb-3 bg-slate-950/20 border border-slate-800/40 rounded-lg">
      <div>
        <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Lebar (cm)</label>
        <input
          type="number"
          step="0.1"
          min="0.5"
          max={maxWidth}
          value={width}
          onChange={(e) => onWidthChange(e.target.value)}
          className="w-full text-xs bg-transparent border border-slate-700 rounded p-1 text-center text-slate-100 font-mono"
        />
      </div>
      <div>
        <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Tinggi (cm)</label>
        <input
          type="number"
          step="0.1"
          min="0.5"
          max={maxHeight}
          value={height}
          onChange={(e) => onHeightChange(e.target.value)}
          className="w-full text-xs bg-transparent border border-slate-700 rounded p-1 text-center text-slate-100 font-mono"
        />
      </div>
    </div>
  );
}