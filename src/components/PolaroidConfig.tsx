import { Upload, X, Check, Trash2, Plus } from 'lucide-react';

interface PolaroidConfigProps {
  caption: string;
  onCaptionChange: (value: string) => void;
  font: 'handwritten' | 'sans' | 'typewriter';
  onFontChange: (font: 'handwritten' | 'sans' | 'typewriter') => void;
  theme: 'light' | 'dark';
}

export function PolaroidConfig({
  caption,
  onCaptionChange,
  font,
  onFontChange,
  theme,
}: PolaroidConfigProps) {
  return (
    <div className={`space-y-4.5 p-3.5 mb-3 rounded-xl border ${
      theme === 'dark'
        ? 'bg-slate-950/45 border-slate-800/80'
        : 'bg-white border-slate-200 shadow-sm'
    }`}>
      <div>
        <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1.5">Tulisan Polaroid (Caption)</label>
        <input
          type="text"
          maxLength={30}
          placeholder="Memory ✨"
          value={caption}
          onChange={(e) => onCaptionChange(e.target.value)}
          className={`w-full text-xs rounded border p-1.5 font-medium ${
            theme === 'dark'
              ? 'bg-slate-950 border-slate-800 text-slate-200'
              : 'bg-white border-slate-200 text-slate-800'
          }`}
        />
      </div>
      <div>
        <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-2">Gaya Tulisan Caption</label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onFontChange('handwritten')}
            className={`p-2 rounded-xl border text-center transition duration-150 flex flex-col items-center justify-center ${
              font === 'handwritten'
                ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold shadow-sm'
                : theme === 'dark'
                ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="font-handwritten text-lg leading-none">Cursive</span>
            <span className="text-[8px] text-neutral-400 mt-1 tracking-tight">Tulis Tangan</span>
          </button>

          <button
            type="button"
            onClick={() => onFontChange('sans')}
            className={`p-2 rounded-xl border text-center transition duration-150 flex flex-col items-center justify-center ${
              font === 'sans'
                ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold shadow-sm'
                : theme === 'dark'
                ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="font-sans-jakarta text-[10px] uppercase font-bold tracking-wider leading-none">Sans</span>
            <span className="text-[8px] text-neutral-400 mt-1 tracking-tight">Modern</span>
          </button>

          <button
            type="button"
            onClick={() => onFontChange('typewriter')}
            className={`p-2 rounded-xl border text-center transition duration-150 flex flex-col items-center justify-center ${
              font === 'typewriter'
                ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold shadow-sm'
                : theme === 'dark'
                ? 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span className="font-typewriter text-[10px] font-bold leading-none">Type</span>
            <span className="text-[8px] text-neutral-400 mt-1 tracking-tight">Retro</span>
          </button>
        </div>
      </div>
    </div>
  );
}