import { Upload, Sliders, Eye, Trash2, RefreshCw, Layers, Layout, Grid, AlertCircle, Check, Scissors, FileText, RotateCcw } from 'lucide-react';
import { SizePreset, PaperPreset, BgColorOption } from '../types';
import { SIZE_PRESETS, BG_COLOR_OPTIONS, GRID_STEP_OPTIONS } from '../constants';
import { ImageGallery } from './ImageGallery';
import { SizePresetSelector } from './SizePresetSelector';
import { PolaroidConfig } from './PolaroidConfig';
import { CustomSizeInputs } from './CustomSizeInputs';
import { SlotEditor } from './SlotEditor';
import { PaperSettings } from './PaperSettings';

interface SidebarProps {
  // Gallery
  uploadedImages: any[];
  selectedGalleryImageId: string | null;
  onSelectGalleryImage: (id: string) => void;
  onDeleteGalleryImage: (e: React.MouseEvent, id: string) => void;
  onTriggerFileSelect: () => void;
  
  // Size preset
  addSizePreset: string;
  setAddSizePreset: (id: string) => void;
  addCustomWidth: string;
  addCustomHeight: string;
  setAddCustomWidth: (value: string) => void;
  setAddCustomHeight: (value: string) => void;
  addPolaroidCaption: string;
  setAddPolaroidCaption: (value: string) => void;
  addPolaroidFont: 'handwritten' | 'sans' | 'typewriter';
  setAddPolaroidFont: (font: 'handwritten' | 'sans' | 'typewriter') => void;
  addBgColor: string;
  setAddBgColor: (value: string) => void;
  addGrayscale: boolean;
  setAddGrayscale: (value: boolean) => void;
  addQuantity: number;
  setAddQuantity: (value: number) => void;
  onAddToCanvas: () => void;
  onAddAllImages: () => void;
  onAutoFillPage: () => void;
  
  // Slot editor
  activeSlot: any;
  onCloseSlotEditor: () => void;
  onRotateSlot: (id: string) => void;
  onDuplicateSlot: (id: string) => void;
  onDeleteSlot: (id: string) => void;
  onUpdateSlot: (id: string, updater: (slot: any) => any) => void;
  onSaveToHistory: (slots: any[]) => void;
  uploadedImagesForEditor: any[];
  
  // Paper settings
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
  canvasSlots: any[];
  
  // Reset
  onQuickClearCanvas: () => void;
  onResetSettings: () => void;
  canvasSlotsLength: number;
  
  theme: 'light' | 'dark';
}

export function Sidebar({
  // Gallery
  uploadedImages,
  selectedGalleryImageId,
  onSelectGalleryImage,
  onDeleteGalleryImage,
  onTriggerFileSelect,
  
  // Size preset
  addSizePreset,
  setAddSizePreset,
  addCustomWidth,
  addCustomHeight,
  setAddCustomWidth,
  setAddCustomHeight,
  addPolaroidCaption,
  setAddPolaroidCaption,
  addPolaroidFont,
  setAddPolaroidFont,
  addBgColor,
  setAddBgColor,
  addGrayscale,
  setAddGrayscale,
  addQuantity,
  setAddQuantity,
  onAddToCanvas,
  onAddAllImages,
  onAutoFillPage,
  
  // Slot editor
  activeSlot,
  onCloseSlotEditor,
  onRotateSlot,
  onDuplicateSlot,
  onDeleteSlot,
  onUpdateSlot,
  onSaveToHistory,
  uploadedImagesForEditor,
  
  // Paper settings
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
  canvasSlots,
  
  // Reset
  onQuickClearCanvas,
  onResetSettings,
  canvasSlotsLength,
  
  theme,
}: SidebarProps) {
  return (
    <aside className={`w-full shrink-0 border-r p-4 sm:p-5 lg:w-[340px] lg:p-4 xl:w-[380px] xl:p-5 2xl:w-[420px] overflow-y-auto h-full ${
      theme === 'dark' ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <ImageGallery
        uploadedImages={uploadedImages}
        selectedGalleryImageId={selectedGalleryImageId}
        onSelectImage={onSelectGalleryImage}
        onDeleteImage={onDeleteGalleryImage}
        onTriggerFileSelect={onTriggerFileSelect}
        theme={theme}
      />

      <section className={`mb-6 p-4 rounded-xl border ${
        theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'
      }`}>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
          <span className="w-4 h-4 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px]">2</span>
          Atur Ukuran Cetak Baru
        </h2>

        <SizePresetSelector
          presets={SIZE_PRESETS}
          selectedPreset={addSizePreset}
          onSelectPreset={setAddSizePreset}
          customWidth={addCustomWidth}
          customHeight={addCustomHeight}
          onCustomWidthChange={setAddCustomWidth}
          onCustomHeightChange={setAddCustomHeight}
          theme={theme}
        />

        {addSizePreset.startsWith('polaroid-') && (
          <PolaroidConfig
            caption={addPolaroidCaption}
            onCaptionChange={setAddPolaroidCaption}
            font={addPolaroidFont}
            onFontChange={setAddPolaroidFont}
            theme={theme}
          />
        )}

        {addSizePreset === 'custom' && (
          <CustomSizeInputs
            width={addCustomWidth}
            height={addCustomHeight}
            onWidthChange={setAddCustomWidth}
            onHeightChange={setAddCustomHeight}
            maxWidth={21.0}
            maxHeight={29.7}
            theme={theme}
          />
        )}

        {!addSizePreset.startsWith('polaroid-') && (
          <div className="space-y-2.5 mb-4">
            <div>
              <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                Ganti Latar Pas Foto (Khusus PNG Transparan)
              </label>
              <select
                value={addBgColor}
                onChange={(e) => setAddBgColor(e.target.value)}
                className={`w-full text-xs rounded border p-1.5 focus:ring-1 focus:ring-blue-500 font-medium ${
                  theme === 'dark' ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                }`}
              >
                {BG_COLOR_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.hex}>{opt.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <label className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={addGrayscale}
              onChange={(e) => setAddGrayscale(e.target.checked)}
              className="rounded border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <span>Jadikan Hitam & Putih (Grayscale)</span>
          </label>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-[11px] font-semibold text-neutral-400 mb-1">
            <span>Jumlah Duplikat Cetak</span>
            <span className="text-blue-500 font-mono">{addQuantity} lembar foto</span>
          </div>
          <input
            type="range"
            min="1"
            max="24"
            value={addQuantity}
            onChange={(e) => setAddQuantity(parseInt(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAddToCanvas}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg font-semibold text-xs transition duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10"
          >
            <Upload className="w-3.5 h-3.5" />
            Tambahkan ({addQuantity}x)
          </button>

          <button
            onClick={onAutoFillPage}
            className={`w-full py-2.5 px-3 border rounded-lg font-semibold text-xs transition duration-150 flex items-center justify-center gap-1.5 ${
              theme === 'dark'
                ? 'border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-200'
                : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
            }`}
            title="Isi ruang kosong yang tersisa di halaman aktif secara otomatis"
          >
            <Layers className="w-3.5 h-3.5" />
            Auto-fill
          </button>
        </div>
        <button
          onClick={onAddAllImages}
          disabled={uploadedImages.length === 0}
          className={`mt-2 w-full py-2 px-3 border rounded-lg font-semibold text-xs transition duration-150 flex items-center justify-center gap-1.5 ${
            uploadedImages.length === 0
              ? 'opacity-40 cursor-not-allowed border-slate-800 bg-slate-900/40 text-neutral-500'
              : theme === 'dark'
                ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500 hover:text-blue-300'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700'
          }`}
          title="Tambahkan satu cetakan untuk setiap foto di galeri dengan pengaturan ukuran saat ini"
        >
          <Layers className="w-3.5 h-3.5" />
          Tambahkan Semua Foto ({uploadedImages.length})
        </button>
      </section>

      {activeSlot ? (
        <SlotEditor
          activeSlot={activeSlot}
          uploadedImages={uploadedImagesForEditor}
          onClose={onCloseSlotEditor}
          onRotate={onRotateSlot}
          onDuplicate={onDuplicateSlot}
          onDelete={onDeleteSlot}
          onUpdateSlot={onUpdateSlot}
          onSaveToHistory={onSaveToHistory}
          theme={theme}
        />
      ) : (
        <div className={`p-4 rounded-xl border border-dashed mb-6 text-center text-xs text-neutral-500 leading-relaxed ${
          theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <Eye className="w-4 h-4 mx-auto mb-1.5 text-neutral-600" />
          Tip: Klik pada salah satu foto di lembar kerja kanan untuk mengaktifkan editor pembesaran, penggeseran (pan), kecerahan, dan penggantian warna latar belakang foto secara instan!
        </div>
      )}

      <PaperSettings
        paperPresetId={paperPresetId}
        onSelectPaperPreset={onSelectPaperPreset}
        customPaperWidthCm={customPaperWidthCm}
        customPaperHeightCm={customPaperHeightCm}
        onCustomWidthChange={onCustomWidthChange}
        onCustomHeightChange={onCustomHeightChange}
        orientation={orientation}
        onOrientationChange={onOrientationChange}
        marginCm={marginCm}
        onMarginChange={onMarginChange}
        onMarginCommit={onMarginCommit}
        gapCm={gapCm}
        onGapChange={onGapChange}
        onGapCommit={onGapCommit}
        borderStyle={borderStyle}
        onBorderStyleChange={onBorderStyleChange}
        layoutMode={layoutMode}
        onLayoutModeChange={onLayoutModeChange}
        onAutoArrange={onAutoArrange}
        isSnapToGrid={isSnapToGrid}
        onSnapToGridChange={onSnapToGridChange}
        gridStepCm={gridStepCm}
        onGridStepChange={onGridStepChange}
        showGridLines={showGridLines}
        onShowGridLinesChange={onShowGridLinesChange}
        effectivePaperWidthCm={effectivePaperWidthCm}
        effectivePaperHeightCm={effectivePaperHeightCm}
        selectedPaperPreset={selectedPaperPreset}
        isScrapPaper={isScrapPaper}
        theme={theme}
      />

      <section className="pt-4 border-t border-slate-800/80 flex gap-2.5">
        <button
          onClick={onQuickClearCanvas}
          disabled={canvasSlotsLength === 0}
          className={`flex-1 py-2 rounded-lg font-semibold text-xs transition duration-150 flex items-center justify-center gap-1.5 ${
            canvasSlotsLength === 0
              ? 'opacity-40 cursor-not-allowed bg-slate-900 border border-slate-800 text-neutral-500'
              : 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 active:scale-95'
          }`}
          title="Kosongkan seluruh foto di canvas secara cepat (Shift + Delete)"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Kosongkan Cepat
        </button>

        <button
          onClick={onResetSettings}
          className={`flex-1 py-2 rounded-lg font-semibold text-xs transition duration-150 flex items-center justify-center gap-1.5 ${
            theme === 'dark'
              ? 'border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Layout
        </button>
      </section>
    </aside>
  );
}