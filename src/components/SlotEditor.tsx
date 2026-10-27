import { useRef } from 'react';
import { Sliders, X, RotateCw, Copy, Trash2, Move, Grid, AlertCircle, Check } from 'lucide-react';
import { PhotoSlot, UploadedImage } from '../types';
import { BG_COLOR_OPTIONS } from '../constants';

interface SlotEditorProps {
  activeSlot: PhotoSlot | null;
  uploadedImages: UploadedImage[];
  onClose: () => void;
  onRotate: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateSlot: (id: string, updater: (slot: PhotoSlot) => PhotoSlot) => void;
  onSaveToHistory: (slots: PhotoSlot[]) => void;
  theme: 'light' | 'dark';
}

export function SlotEditor({
  activeSlot,
  uploadedImages,
  onClose,
  onRotate,
  onDuplicate,
  onDelete,
  onUpdateSlot,
  onSaveToHistory,
  theme,
}: SlotEditorProps) {
  const cropDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    currentOffsetX: number;
    currentOffsetY: number;
  } | null>(null);

  if (!activeSlot) return null;

  const image = uploadedImages.find((i) => i.id === activeSlot.imageId);
  const imageSrc = image ? image.src : '';

  const handleCropPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!activeSlot.isPolaroid) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    cropDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: activeSlot.offsetX,
      offsetY: activeSlot.offsetY,
      currentOffsetX: activeSlot.offsetX,
      currentOffsetY: activeSlot.offsetY,
    };
  };

  const handleCropPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = cropDragRef.current;
    if (!activeSlot.isPolaroid || !drag || drag.pointerId !== event.pointerId) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    drag.currentOffsetX = Math.max(-80, Math.min(80, drag.offsetX + ((event.clientX - drag.startX) / bounds.width) * 100 / activeSlot.zoom));
    drag.currentOffsetY = Math.max(-80, Math.min(80, drag.offsetY + ((event.clientY - drag.startY) / bounds.height) * 100 / activeSlot.zoom));
    onUpdateSlot(activeSlot.id, (slot) => ({ ...slot, offsetX: drag.currentOffsetX, offsetY: drag.currentOffsetY }));
  };

  const handleCropPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = cropDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    onSaveToHistory([{ ...activeSlot, offsetX: drag.currentOffsetX, offsetY: drag.currentOffsetY }]);
    cropDragRef.current = null;
  };

  const handleSliderChange = (
    value: number,
    updater: (slot: PhotoSlot) => PhotoSlot,
    onCommit: (value: number) => void
  ) => {
    onUpdateSlot(activeSlot.id, updater);
  };

  const handleSliderCommit = (
    value: number,
    updater: (slot: PhotoSlot) => PhotoSlot,
    onCommit: (value: number) => void
  ) => {
    const updated = updater(activeSlot);
    onSaveToHistory([updated]);
  };

  return (
    <section className={`mb-6 p-4 rounded-xl border-2 ${
      theme === 'dark' ? 'bg-[#0f172a] border-blue-500/40' : 'bg-blue-50/20 border-blue-500/30'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 shrink-0" />
          Edit Cetakan Terpilih
        </h2>
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-200">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 p-2 bg-black/10 rounded-lg mb-4">
        <div className="w-10 h-12 bg-neutral-800 rounded overflow-hidden shrink-0 border border-slate-700/50 relative">
          <div
            className="absolute"
            style={{
              width: '100%',
              height: '100%',
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${activeSlot.rotate}deg) scale(${activeSlot.zoom}) translate(${activeSlot.offsetX}%, ${activeSlot.offsetY}%)`,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={imageSrc}
              alt=""
              className={`w-full h-full ${activeSlot.isPolaroid ? 'object-contain' : 'object-cover'}`}
              style={{
                filter: `grayscale(${activeSlot.isGrayscale ? 1 : 0}) brightness(${activeSlot.brightness}) contrast(${activeSlot.contrast}) saturate(${activeSlot.saturation ?? 1.0})`,
                backgroundColor: activeSlot.bgColor,
              }}
            />
          </div>
        </div>
        <div className="text-[11px] leading-relaxed">
          <div className="font-semibold text-slate-200 truncate max-w-[200px]">
            ID: #{activeSlot.id.split('-')[2] || 'Slot'}
          </div>
          <div className="text-slate-400 font-mono">
            Ukuran: {activeSlot.widthCm} x {activeSlot.heightCm} cm
          </div>
          <div className="text-[10px] text-blue-400 flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            {activeSlot.isPolaroid ? 'Edit aktif (geser crop foto)' : 'Edit mode aktif (geser slider di bawah)'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mb-4">
        <button
          onClick={() => onRotate(activeSlot.id)}
          className={`p-2 rounded border text-[11px] font-semibold flex items-center justify-center gap-1 transition ${
            theme === 'dark' ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <RotateCw className="w-3 h-3" />
          Putar 90°
        </button>
        <button
          onClick={() => onDuplicate(activeSlot.id)}
          className={`p-2 rounded border text-[11px] font-semibold flex items-center justify-center gap-1 transition ${
            theme === 'dark' ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Copy className="w-3 h-3" />
          Duplikat
        </button>
        <button
          onClick={() => onDelete(activeSlot.id)}
          className="p-2 rounded bg-red-600/10 border border-red-500/20 text-red-500 text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-red-600/20 transition"
        >
          <Trash2 className="w-3 h-3" />
          Hapus
        </button>
      </div>

      <div className="mb-4">
        <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1.5">Tipe Bingkai Cetak</label>
        <div className="flex p-1 bg-black/20 rounded-lg border border-slate-800/80">
          <button
            onClick={() => {
              onUpdateSlot(activeSlot.id, (s) => ({ ...s, isPolaroid: false }));
              onSaveToHistory([{ ...activeSlot, isPolaroid: false }]);
            }}
            type="button"
            className={`flex-1 py-1 text-xs font-semibold rounded-md transition ${
              !activeSlot.isPolaroid
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Normal (Tanpa Frame)
          </button>
          <button
            onClick={() => {
              onUpdateSlot(activeSlot.id, (s) => ({
                ...s,
                isPolaroid: true,
                zoom: 1,
                offsetX: 0,
                offsetY: 0,
                polaroidCaption: s.polaroidCaption || 'Memory ✨',
                polaroidFont: s.polaroidFont || 'handwritten',
              }));
              onSaveToHistory([
                {
                  ...activeSlot,
                  isPolaroid: true,
                  zoom: 1,
                  offsetX: 0,
                  offsetY: 0,
                  polaroidCaption: activeSlot.polaroidCaption || 'Memory ✨',
                  polaroidFont: activeSlot.polaroidFont || 'handwritten',
                },
              ]);
            }}
            type="button"
            className={`flex-1 py-1 text-xs font-semibold rounded-md transition ${
              activeSlot.isPolaroid
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Polaroid Frame
          </button>
        </div>
      </div>

      {activeSlot.isPolaroid && (
        <div className={`mb-4 p-3 rounded-lg border space-y-3 ${
          theme === 'dark'
            ? 'bg-slate-950/40 border-slate-800'
            : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Tulisan Polaroid (Caption)</label>
            <input
              type="text"
              maxLength={30}
              placeholder="Ketik memo kenangan..."
              value={activeSlot.polaroidCaption || ''}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateSlot(activeSlot.id, (s) => ({ ...s, polaroidCaption: val }));
              }}
              onBlur={() => onSaveToHistory([{ ...activeSlot, polaroidCaption: activeSlot.polaroidCaption || '' }])}
              className={`w-full text-xs rounded border p-1.5 font-medium ${
                theme === 'dark'
                  ? 'bg-slate-950 border-slate-800 text-slate-200'
                  : 'bg-white border-slate-200 text-slate-800'
              }`}
            />
          </div>
          <div>
            <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-2">Gaya Huruf Caption</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  const val: 'handwritten' = 'handwritten';
                  onUpdateSlot(activeSlot.id, (s) => ({ ...s, polaroidFont: val }));
                  onSaveToHistory([{ ...activeSlot, polaroidFont: val }]);
                }}
                className={`p-2 rounded-xl border text-center transition duration-150 flex flex-col items-center justify-center ${
                  (activeSlot.polaroidFont || 'handwritten') === 'handwritten'
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
                onClick={() => {
                  const val: 'sans' = 'sans';
                  onUpdateSlot(activeSlot.id, (s) => ({ ...s, polaroidFont: val }));
                  onSaveToHistory([{ ...activeSlot, polaroidFont: val }]);
                }}
                className={`p-2 rounded-xl border text-center transition duration-150 flex flex-col items-center justify-center ${
                  activeSlot.polaroidFont === 'sans'
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
                onClick={() => {
                  const val: 'typewriter' = 'typewriter';
                  onUpdateSlot(activeSlot.id, (s) => ({ ...s, polaroidFont: val }));
                  onSaveToHistory([{ ...activeSlot, polaroidFont: val }]);
                }}
                className={`p-2 rounded-xl border text-center transition duration-150 flex flex-col items-center justify-center ${
                  activeSlot.polaroidFont === 'typewriter'
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
      )}

      {activeSlot.isPolaroid && imageSrc && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase text-neutral-400">
            <span>Komposisi Foto Polaroid</span>
            <Move className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div
            role="application"
            aria-label="Area geser crop foto Polaroid"
            onPointerDown={handleCropPointerDown}
            onPointerMove={handleCropPointerMove}
            onPointerUp={handleCropPointerUp}
            onPointerCancel={handleCropPointerUp}
            className="relative aspect-[4/3] w-full touch-none cursor-move overflow-hidden rounded-md border border-slate-700 bg-neutral-800"
          >
            <img
              src={imageSrc}
              alt=""
              draggable={false}
              className="pointer-events-none absolute inset-0 h-full w-full object-contain"
              style={{
                transform: `scale(${activeSlot.zoom}) translate(${activeSlot.offsetX}%, ${activeSlot.offsetY}%)`,
                filter: `grayscale(${activeSlot.isGrayscale ? 1 : 0}) brightness(${activeSlot.brightness}) contrast(${activeSlot.contrast}) saturate(${activeSlot.saturation ?? 1.0})`,
              }}
            />
            <div className="pointer-events-none absolute inset-0 border border-white/40" />
          </div>
          <button
            type="button"
            onClick={() => {
              const restored = { ...activeSlot, zoom: 1, offsetX: 0, offsetY: 0 };
              onUpdateSlot(activeSlot.id, () => restored);
              onSaveToHistory([restored]);
            }}
            className="mt-1.5 text-[10px] font-semibold text-blue-400 hover:text-blue-300"
          >
            Tampilkan Foto Utuh
          </button>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[11px] text-neutral-400 mb-1 font-medium">
            <span>Skala Pembesaran Foto (Zoom)</span>
            <span className="text-slate-200 font-mono">{Math.round(activeSlot.zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.05"
            value={activeSlot.zoom}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateSlot(activeSlot.id, (s) => ({ ...s, zoom: val }));
            }}
            onMouseUp={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              onSaveToHistory([{ ...activeSlot, zoom: val }]);
            }}
            onTouchEnd={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              onSaveToHistory([{ ...activeSlot, zoom: val }]);
            }}
            className="w-full accent-blue-500 h-1 cursor-pointer"
          />
        </div>

        {!activeSlot.isPolaroid && <div>
          <div className="flex justify-between text-[11px] text-neutral-400 mb-1 font-medium">
            <span>Geser Horizontal (Pan X)</span>
            <span className="text-slate-200 font-mono">{activeSlot.offsetX}%</span>
          </div>
          <input
            type="range"
            min="-80"
            max="80"
            step="1"
            value={activeSlot.offsetX}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onUpdateSlot(activeSlot.id, (s) => ({ ...s, offsetX: val }));
            }}
            onMouseUp={(e) => {
              const val = parseInt((e.target as HTMLInputElement).value);
              onSaveToHistory([{ ...activeSlot, offsetX: val }]);
            }}
            onTouchEnd={(e) => {
              const val = parseInt((e.target as HTMLInputElement).value);
              onSaveToHistory([{ ...activeSlot, offsetX: val }]);
            }}
            className="w-full accent-blue-500 h-1 cursor-pointer"
          />
        </div>}

        {!activeSlot.isPolaroid && <div>
          <div className="flex justify-between text-[11px] text-neutral-400 mb-1 font-medium">
            <span>Geser Vertikal (Pan Y)</span>
            <span className="text-slate-200 font-mono">{activeSlot.offsetY}%</span>
          </div>
          <input
            type="range"
            min="-80"
            max="80"
            step="1"
            value={activeSlot.offsetY}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onUpdateSlot(activeSlot.id, (s) => ({ ...s, offsetY: val }));
            }}
            onMouseUp={(e) => {
              const val = parseInt((e.target as HTMLInputElement).value);
              onSaveToHistory([{ ...activeSlot, offsetY: val }]);
            }}
            onTouchEnd={(e) => {
              const val = parseInt((e.target as HTMLInputElement).value);
              onSaveToHistory([{ ...activeSlot, offsetY: val }]);
            }}
            className="w-full accent-blue-500 h-1 cursor-pointer"
          />
        </div>}

        <div>
          <div className="flex justify-between text-[11px] text-neutral-400 mb-1 font-medium">
            <span>Kecerahan (Brightness)</span>
            <span className="text-slate-200 font-mono">{Math.round(activeSlot.brightness * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.4"
            step="0.02"
            value={activeSlot.brightness}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateSlot(activeSlot.id, (s) => ({ ...s, brightness: val }));
            }}
            onMouseUp={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              onSaveToHistory([{ ...activeSlot, brightness: val }]);
            }}
            onTouchEnd={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              onSaveToHistory([{ ...activeSlot, brightness: val }]);
            }}
            className="w-full h-1 accent-blue-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-neutral-400 mb-1 font-medium">
            <span>Kontras (Contrast)</span>
            <span className="text-slate-200 font-mono">{Math.round(activeSlot.contrast * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="1.4"
            step="0.02"
            value={activeSlot.contrast}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateSlot(activeSlot.id, (s) => ({ ...s, contrast: val }));
            }}
            onMouseUp={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              onSaveToHistory([{ ...activeSlot, contrast: val }]);
            }}
            onTouchEnd={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              onSaveToHistory([{ ...activeSlot, contrast: val }]);
            }}
            className="w-full h-1 accent-blue-500 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-neutral-400 mb-1 font-medium">
            <span>Saturasi (Saturation)</span>
            <span className="text-slate-200 font-mono">{Math.round((activeSlot.saturation ?? 1.0) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="2.0"
            step="0.05"
            value={activeSlot.saturation ?? 1.0}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateSlot(activeSlot.id, (s) => ({ ...s, saturation: val }));
            }}
            onMouseUp={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              onSaveToHistory([{ ...activeSlot, saturation: val }]);
            }}
            onTouchEnd={(e) => {
              const val = parseFloat((e.target as HTMLInputElement).value);
              onSaveToHistory([{ ...activeSlot, saturation: val }]);
            }}
            className="w-full h-1 accent-blue-500 cursor-pointer"
          />
        </div>

        {!activeSlot.isPolaroid && (
          <div>
            <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
              Ganti Latar Foto Khusus Slot Ini
            </label>
            <select
              value={activeSlot.bgColor}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateSlot(activeSlot.id, (s) => ({ ...s, bgColor: val }));
                onSaveToHistory([{ ...activeSlot, bgColor: val }]);
              }}
              className={`w-full text-xs rounded border p-1 focus:ring-1 focus:ring-blue-500 font-medium ${
                theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              {BG_COLOR_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.hex}>{opt.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-neutral-400 font-medium">Format Hitam Putih (B&W)</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={activeSlot.isGrayscale}
              onChange={(e) => {
                const val = e.target.checked;
                onUpdateSlot(activeSlot.id, (s) => ({ ...s, isGrayscale: val }));
                onSaveToHistory([{ ...activeSlot, isGrayscale: val }]);
              }}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
    </section>
  );
}