import { FileText, Scissors, RotateCcw, Layout, Grid, AlertCircle, Check } from 'lucide-react';
import { PaperPreset } from '../types';
import { PAPER_PRESETS, A4_WIDTH_CM, A4_HEIGHT_CM } from '../constants';

interface PaperSettingsProps {
  paperPresetId: string;
  onSelectPaperPreset: (id: string) => void;
  customPaperWidthCm: number;
  customPaperHeightCm: number;
  onCustomWidthChange: (value: number) => void;
  onCustomHeightChange: (value: number) => void;
  orientation: 'portrait' | 'landscape';
  onOrientationChange: (orientation: 'portrait' | 'landscape') => void;
  marginCm: number;
  onMarginChange: (value: number) => void;
  onMarginCommit: (value: number) => void;
  gapCm: number;
  onGapChange: (value: number) => void;
  onGapCommit: (value: number) => void;
  borderStyle: 'none' | 'solid' | 'dotted' | 'crop';
  onBorderStyleChange: (value: 'none' | 'solid' | 'dotted' | 'crop') => void;
  layoutMode: 'auto' | 'freeform';
  onLayoutModeChange: (mode: 'auto' | 'freeform') => void;
  onAutoArrange: () => void;
  isSnapToGrid: boolean;
  onSnapToGridChange: (value: boolean) => void;
  gridStepCm: number;
  onGridStepChange: (value: number) => void;
  showGridLines: boolean;
  onShowGridLinesChange: (value: boolean) => void;
  effectivePaperWidthCm: number;
  effectivePaperHeightCm: number;
  selectedPaperPreset: PaperPreset;
  isScrapPaper: boolean;
  theme: 'light' | 'dark';
}

export function PaperSettings({
  paperPresetId,
  onSelectPaperPreset,
  customPaperWidthCm,
  customPaperHeightCm,
  onCustomWidthChange,
  onCustomHeightChange,
  orientation,
  onOrientationChange,
  marginCm,
  onMarginChange,
  onMarginCommit,
  gapCm,
  onGapChange,
  onGapCommit,
  borderStyle,
  onBorderStyleChange,
  layoutMode,
  onLayoutModeChange,
  onAutoArrange,
  isSnapToGrid,
  onSnapToGridChange,
  gridStepCm,
  onGridStepChange,
  showGridLines,
  onShowGridLinesChange,
  effectivePaperWidthCm,
  effectivePaperHeightCm,
  selectedPaperPreset,
  isScrapPaper,
  theme,
}: PaperSettingsProps) {
  const handleCustomWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) onCustomWidthChange(val);
  };

  const handleCustomHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) onCustomHeightChange(val);
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px]">3</span>
          Pengaturan Kertas & Sisa Cetak
        </h2>
        {isScrapPaper && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <Scissors className="w-3 h-3" />
            Kertas Sisa
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-neutral-400 uppercase font-bold flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              Ukuran Lembar Kertas
            </label>
            {isScrapPaper && (
              <button
                type="button"
                onClick={() => onSelectPaperPreset('a4-full')}
                className="text-[10px] text-blue-400 hover:text-blue-300 transition flex items-center gap-1 cursor-pointer font-medium"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset A4 Penuh
              </button>
            )}
          </div>

          <select
            value={paperPresetId}
            onChange={(e) => onSelectPaperPreset(e.target.value)}
            className={`w-full text-xs rounded-lg border p-2 font-semibold transition cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-blue-500'
                : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'
            }`}
          >
            <optgroup label="📄 LEMBAR STANDAR">
              <option value="a4-full">A4 Standar Penuh (21.0 × 29.7 cm) — 100% Lembar</option>
            </optgroup>
            <optgroup label="✂️ KERTAS SISA CETAK (OFFCUT DARI A4)">
              <option value="scrap-a5">Sisa 1/2 A4 (A5 Melintang) — 14.8 × 21.0 cm (50% A4)</option>
              <option value="scrap-half-v">Sisa 1/2 A4 (Strip Memanjang) — 10.5 × 29.7 cm (50% A4)</option>
              <option value="scrap-third">Sisa 1/3 A4 (Brosur / Strip) — 9.9 × 21.0 cm (33% A4)</option>
              <option value="scrap-a6">Sisa 1/4 A4 (A6 / Kartu Pos) — 10.5 × 14.8 cm (25% A4)</option>
              <option value="scrap-4r">Sisa Potongan Foto 4R — 10.2 × 15.2 cm (Sisa 4R)</option>
              <option value="scrap-photobooth">Sisa Strip Photobooth — 5.0 × 15.0 cm</option>
            </optgroup>
            <optgroup label="📐 KUSTOM SISA KERTAS">
              <option value="custom-scrap">Kustom Sisa Kertas (Input Bebas Lebar & Tinggi)</option>
            </optgroup>
          </select>
        </div>

        {paperPresetId === 'custom-scrap' && (
          <div className={`p-3 rounded-xl border space-y-2.5 transition-all ${
            theme === 'dark' ? 'bg-amber-950/20 border-amber-800/40' : 'bg-amber-50/50 border-amber-200'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
              <span className="flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5" />
                Dimensi Sisa Kertas A4
              </span>
              <span className="text-[10px] text-amber-500/90 font-mono">
                Maks. {orientation === 'portrait' ? '21.0 × 29.7' : '29.7 × 21.0'} cm
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Lebar (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="2.0"
                  max={orientation === 'portrait' ? 21.0 : 29.7}
                  value={customPaperWidthCm}
                  onChange={handleCustomWidthChange}
                  className={`w-full text-xs rounded border p-1.5 text-center font-mono font-bold ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-700 text-amber-300' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
                <span className="text-[9px] text-neutral-500 block text-center mt-0.5">
                  Maks. {orientation === 'portrait' ? '21.0' : '29.7'} cm
                </span>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Tinggi (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="2.0"
                  max={orientation === 'portrait' ? 29.7 : 21.0}
                  value={customPaperHeightCm}
                  onChange={handleCustomHeightChange}
                  className={`w-full text-xs rounded border p-1.5 text-center font-mono font-bold ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-700 text-amber-300' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
                <span className="text-[9px] text-neutral-500 block text-center mt-0.5">
                  Maks. {orientation === 'portrait' ? '29.7' : '21.0'} cm
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[9px] text-neutral-400 uppercase font-bold block mb-1">Potongan Cepat Sisa:</span>
              <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    onCustomWidthChange(14.8);
                    onCustomHeightChange(21.0);
                  }}
                  className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-center truncate font-medium transition cursor-pointer"
                >
                  1/2 A4 (A5)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCustomWidthChange(10.5);
                    onCustomHeightChange(14.8);
                  }}
                  className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-center truncate font-medium transition cursor-pointer"
                >
                  1/4 A4 (A6)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onCustomWidthChange(10.2);
                    onCustomHeightChange(15.2);
                  }}
                  className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-center truncate font-medium transition cursor-pointer"
                >
                  Sisa 4R
                </button>
              </div>
            </div>

            <div className="text-[10px] text-neutral-400 flex items-start gap-1.5 bg-black/20 p-2 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Batas Fisik:</strong> Karena berasal dari sisa lembar A4, dimensi tidak boleh melebihi ukuran lembar A4 ({orientation === 'portrait' ? '21.0 × 29.7' : '29.7 × 21.0'} cm).
              </span>
            </div>
          </div>
        )}

        <div className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
          isScrapPaper
            ? (theme === 'dark' ? 'bg-amber-950/15 border-amber-900/30' : 'bg-amber-50/40 border-amber-200/60')
            : (theme === 'dark' ? 'bg-slate-950/30 border-slate-800' : 'bg-slate-50 border-slate-200')
        }`}>
          <div 
            className="relative w-11 h-15 bg-slate-800/80 border border-dashed border-slate-600 rounded flex items-center justify-center shrink-0 overflow-hidden"
            title="Ilustrasi proporsi sisa kertas terhadap lembar A4 utuh"
          >
            <span className="text-[8px] text-neutral-500 font-bold uppercase select-none">A4</span>
            <div 
              className={`absolute bottom-0 left-0 transition-all ${
                isScrapPaper ? 'bg-amber-500/40 border-t border-r border-amber-400' : 'bg-blue-600/40 border-t border-r border-blue-500'
              }`}
              style={{
                width: `${Math.min(100, (effectivePaperWidthCm / (orientation === 'portrait' ? 21.0 : 29.7)) * 100)}%`,
                height: `${Math.min(100, (effectivePaperHeightCm / (orientation === 'portrait' ? 29.7 : 21.0)) * 100)}%`,
              }}
            />
          </div>

          <div className="flex-1 min-w-0 text-xs">
            <div className="flex items-center justify-between gap-1">
              <span className="font-bold text-slate-200 truncate">
                {selectedPaperPreset.name}
              </span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                isScrapPaper
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
              }`}>
                {isScrapPaper ? 'Kertas Sisa' : 'A4 Penuh'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
              {effectivePaperWidthCm.toFixed(1)} × {effectivePaperHeightCm.toFixed(1)} cm
              <span className="text-neutral-500 font-sans ml-1">
                ({((effectivePaperWidthCm * effectivePaperHeightCm) / (A4_WIDTH_CM * A4_HEIGHT_CM) * 100).toFixed(0)}% A4)
              </span>
            </p>
            <div className="flex items-center gap-1 text-[10px] mt-1 text-emerald-400">
              <Check className="w-3 h-3 shrink-0" />
              <span>{isScrapPaper ? 'Hemat kertas • Memanfaatkan sisa cetak' : 'Lembar cetak standar utuh'}</span>
            </div>
          </div>
        </div>
        
        <div>
          <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1.5 flex items-center gap-1">
            <Layout className="w-3.5 h-3.5 text-blue-500" />
            Mode Tata Letak Foto
          </label>
          <div className="flex p-1 bg-black/20 rounded-lg border border-slate-800">
            <button
              onClick={() => onLayoutModeChange('auto')}
              type="button"
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                layoutMode === 'auto'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Otomatis (Flow)
            </button>
            <button
              onClick={() => onLayoutModeChange('freeform')}
              type="button"
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                layoutMode === 'freeform'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
              title="Bebas menggeser foto menggunakan mouse atau sentuhan jari"
            >
              Bebas (Freeform)
            </button>
          </div>
          <button
            onClick={onAutoArrange}
            type="button"
            className="mt-2 w-full py-1.5 text-[10px] font-semibold rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/15 transition"
          >
            Rapikan Otomatis
          </button>
        </div>

        {layoutMode === 'freeform' && (
          <div className={`p-3 rounded-lg border space-y-3 transition-all ${
            theme === 'dark' ? 'bg-slate-950/40 border-blue-900/30' : 'bg-blue-50/15 border-blue-200/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-blue-500" />
                Snap-to-Grid (Kisi)
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSnapToGrid}
                  onChange={(e) => onSnapToGridChange(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4.5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {isSnapToGrid && (
              <>
                <div>
                  <label className="block text-[9px] text-neutral-400 uppercase font-bold mb-1">Kerapatan Perekat (Grid Step)</label>
                  <select
                    value={gridStepCm}
                    onChange={(e) => onGridStepChange(parseFloat(e.target.value))}
                    className={`w-full text-xs rounded border p-1 font-semibold ${
                      theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="0.1">0.1 cm (Sangat Rapat)</option>
                    <option value="0.2">0.2 cm</option>
                    <option value="0.5">0.5 cm (Standar)</option>
                    <option value="1.0">1.0 cm (Lebar)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400">Tampilkan Garis Kisi di Layar</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGridLines}
                      onChange={(e) => onShowGridLinesChange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </>
            )}
          </div>
        )}

        <div>
          <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1.5">Orientasi Lembar Kertas</label>
          <div className="flex p-1 bg-black/20 rounded-lg border border-slate-800">
            <button
              onClick={() => onOrientationChange('portrait')}
              type="button"
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                orientation === 'portrait'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Potret (Portrait)
            </button>
            <button
              onClick={() => onOrientationChange('landscape')}
              type="button"
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                orientation === 'landscape'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Lanskap (Landscape)
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] font-semibold text-neutral-400 mb-1">
            <span>Margin Batas Kertas (Padding)</span>
            <span className="text-blue-500 font-mono">{marginCm} cm</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.1"
            value={marginCm}
            onChange={(e) => onMarginChange(parseFloat(e.target.value))}
            onMouseUp={(e) => onMarginCommit(parseFloat((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => onMarginCommit(parseFloat((e.target as HTMLInputElement).value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-neutral-500 mt-0.5">
            <span>0.2 cm (Sempit)</span>
            <span>1.0 cm (Standar)</span>
            <span>2.5 cm (Lebar)</span>
          </div>
        </div>

        {layoutMode === 'auto' && (
          <div>
            <div className="flex justify-between text-[11px] font-semibold text-neutral-400 mb-1">
              <span>Jarak Jeda Antar Foto (Gap)</span>
              <span className="text-blue-500 font-mono">{gapCm} cm</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.5"
              step="0.05"
              value={gapCm}
              onChange={(e) => onGapChange(parseFloat(e.target.value))}
              onMouseUp={(e) => onGapCommit(parseFloat((e.target as HTMLInputElement).value))}
              onTouchEnd={(e) => onGapCommit(parseFloat((e.target as HTMLInputElement).value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-neutral-500 mt-0.5">
              <span>Rapat (0 cm)</span>
              <span>Sedang (0.2 cm)</span>
              <span>Lebar (1.5 cm)</span>
            </div>
          </div>
        )}

        <div>
          <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Garis Panduan Potong Gunting</label>
          <select
            value={borderStyle}
            onChange={(e) => onBorderStyleChange(e.target.value as any)}
            className={`w-full text-xs rounded border p-1.5 focus:ring-1 focus:ring-blue-500 font-medium ${
              theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <option value="none">Tanpa Garis Pembatas</option>
            <option value="solid">Garis Tipis Abu-Abu (Solid)</option>
            <option value="dotted">Garis Putus-Putus (Dotted)</option>
            <option value="crop">Tanda Sudut (Corner Crop Marks Only)</option>
          </select>
        </div>
      </div>
    </section>
  );
}