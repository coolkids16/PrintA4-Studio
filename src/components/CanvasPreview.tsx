import { useMemo } from 'react';
import { Move, RotateCw, Copy, Trash2, Download, FileDown, ImageIcon, Plus, Scissors, Layers, Layout, ZoomIn, ZoomOut, Check, Upload } from 'lucide-react';
import { PhotoSlot, UploadedImage, PaperPreset } from '../types';
import { getPolaroidGeometry } from '../utils/layout';

interface CanvasPreviewProps {
  canvasSlots: PhotoSlot[];
  paginatedPages: PhotoSlot[][];
  uploadedImages: UploadedImage[];
  selectedSlotId: string | null;
  setSelectedSlotId: (id: string | null) => void;
  layoutMode: 'auto' | 'freeform';
  marginCm: number;
  gapCm: number;
  borderStyle: 'none' | 'solid' | 'dotted' | 'crop';
  effectivePaperWidthCm: number;
  effectivePaperHeightCm: number;
  selectedPaperPreset: PaperPreset;
  isScrapPaper: boolean;
  canvasZoom: number;
  onZoomChange: (zoom: number) => void;
  colorMode: 'rgb' | 'cmyk';
  onColorModeChange: (mode: 'rgb' | 'cmyk') => void;
  showGridLines: boolean;
  gridStepCm: number;
  dragState: { slotId: string; pageIndex: number } | null;
  onMouseDown: (e: React.MouseEvent, slot: PhotoSlot, pageIndex: number) => void;
  onRotateSlot: (id: string) => void;
  onDuplicateSlot: (id: string) => void;
  onDeleteSlot: (id: string) => void;
  onDownloadPage: (pageIndex: number, dpi: number) => void;
  onDownloadAllPages: (dpi: number) => void;
  exportDpi: number;
  isExporting: boolean;
  theme: 'light' | 'dark';
  onAddToCanvas: () => void;
  onTriggerFileSelect: () => void;
}

export function CanvasPreview({
  canvasSlots,
  paginatedPages,
  uploadedImages,
  selectedSlotId,
  setSelectedSlotId,
  layoutMode,
  marginCm,
  gapCm,
  borderStyle,
  effectivePaperWidthCm,
  effectivePaperHeightCm,
  selectedPaperPreset,
  isScrapPaper,
  canvasZoom,
  onZoomChange,
  colorMode,
  onColorModeChange,
  showGridLines,
  gridStepCm,
  dragState,
  onMouseDown,
  onRotateSlot,
  onDuplicateSlot,
  onDeleteSlot,
  onDownloadPage,
  onDownloadAllPages,
  exportDpi,
  isExporting,
  theme,
  onAddToCanvas,
  onTriggerFileSelect,
}: CanvasPreviewProps) {
  const imagesById = useMemo(
    () => new Map(uploadedImages.map((image) => [image.id, image])),
    [uploadedImages]
  );

  const renderSlot = (slot: PhotoSlot, pageIndex: number, isPrint = false) => {
    const isRotated90 = slot.rotate === 90 || slot.rotate === 270;
    const image = imagesById.get(slot.imageId);
    const imageSrc = image ? image.src : '';

    const isCurrentlyDragged = dragState?.slotId === slot.id && dragState?.pageIndex === pageIndex;

    const cardWidth = isRotated90 ? `${slot.heightCm}cm` : `${slot.widthCm}cm`;
    const cardHeight = isRotated90 ? `${slot.widthCm}cm` : `${slot.heightCm}cm`;

    const slotStyle: React.CSSProperties = {
      width: cardWidth,
      height: cardHeight,
      backgroundColor: slot.isPolaroid ? '#ffffff' : (slot.bgColor === 'transparent' ? '#ffffff' : slot.bgColor),
      boxSizing: 'border-box',
      overflow: 'hidden',
      position: layoutMode === 'auto' ? 'relative' : 'absolute',
      left: layoutMode === 'auto' ? undefined : `${slot.xCm !== undefined ? slot.xCm : marginCm}cm`,
      top: layoutMode === 'auto' ? undefined : `${slot.yCm !== undefined ? slot.yCm : marginCm}cm`,
      cursor: layoutMode === 'freeform' 
        ? (isCurrentlyDragged ? 'grabbing' : 'grab') 
        : 'pointer',
    };

    const innerTransform = `translate(-50%, -50%) rotate(${slot.rotate}deg) scale(${slot.zoom}) translate(${slot.offsetX}%, ${slot.offsetY}%)`;
    const polaroidPhotoTransform = `translate(-50%, -50%) scale(${slot.zoom}) translate(${slot.offsetX}%, ${slot.offsetY}%)`;

    return (
      <div
        key={slot.id}
        className={`cursor-pointer group transition-[box-shadow,opacity,transform] duration-150 select-none ${
          selectedSlotId === slot.id
            ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg scale-[1.01] z-30'
            : 'hover:ring-1 hover:ring-blue-400 hover:shadow-sm z-20'
        } ${isCurrentlyDragged ? 'opacity-85 z-40 shadow-2xl' : ''}`}
        style={slotStyle}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSlotId(slot.id);
        }}
        onMouseDown={(e) => {
          if (layoutMode === 'freeform') {
            onMouseDown(e, slot, pageIndex);
          }
        }}
      >
        {slot.isPolaroid ? (
          <div
            className="absolute left-1/2 top-1/2 overflow-hidden bg-white"
            style={{
              width: `${slot.widthCm}cm`,
              height: `${slot.heightCm}cm`,
              transform: `translate(-50%, -50%) rotate(${slot.rotate}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <div 
              className="absolute overflow-hidden bg-neutral-100 border border-neutral-100/40"
              style={{
                top: `${getPolaroidGeometry(slot.widthCm, slot.heightCm).top}cm`,
                left: `${getPolaroidGeometry(slot.widthCm, slot.heightCm).left}cm`,
                right: `${getPolaroidGeometry(slot.widthCm, slot.heightCm).right}cm`,
                bottom: `${getPolaroidGeometry(slot.widthCm, slot.heightCm).bottom}cm`,
              }}
            >
              {imageSrc ? (
                <div 
                  className="absolute"
                  style={{
                    width: `${slot.widthCm - (getPolaroidGeometry(slot.widthCm, slot.heightCm).left + getPolaroidGeometry(slot.widthCm, slot.heightCm).right)}cm`,
                    height: `${slot.heightCm - (getPolaroidGeometry(slot.widthCm, slot.heightCm).top + getPolaroidGeometry(slot.widthCm, slot.heightCm).bottom)}cm`,
                    top: '50%',
                    left: '50%',
                    transform: polaroidPhotoTransform,
                    transformOrigin: 'center center',
                    transition: isCurrentlyDragged ? 'none' : 'transform 0.15s ease-out',
                  }}
                >
                  <img
                    src={imageSrc}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain select-none pointer-events-none"
                    style={{
                      filter: `grayscale(${slot.isGrayscale ? 1 : 0}) brightness(${slot.brightness}) contrast(${slot.contrast}) saturate(${slot.saturation ?? 1.0})`,
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400">Empty</div>
              )}
            </div>

            <div 
              className="absolute inset-x-2 text-center flex items-center justify-center pointer-events-none select-none text-neutral-950"
              style={{ 
                height: `${getPolaroidGeometry(slot.widthCm, slot.heightCm).bottom - 0.5}cm`,
                bottom: '0.25cm',
              }}
            >
              <span className={`truncate w-full block select-none leading-tight ${
                slot.polaroidFont === 'sans' 
                  ? 'font-sans-jakarta text-[11px] font-extrabold tracking-wider text-neutral-800 uppercase'
                  : slot.polaroidFont === 'typewriter'
                  ? 'font-typewriter text-[11px] font-bold text-neutral-900 tracking-tight'
                  : 'font-handwritten text-[18px] font-bold text-slate-950 tracking-wide'
              }`}>
                {slot.polaroidCaption || ''}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: slot.bgColor }}>
            {imageSrc ? (
              <div 
                className="absolute"
                style={{
                  width: `${slot.widthCm}cm`,
                  height: `${slot.heightCm}cm`,
                  top: '50%',
                  left: '50%',
                  transform: innerTransform,
                  transformOrigin: 'center center',
                  transition: isCurrentlyDragged ? 'none' : 'transform 0.15s ease-out',
                }}
              >
                <img
                  src={imageSrc}
                  alt="Foto"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover select-none pointer-events-none"
                  style={{
                    filter: `grayscale(${slot.isGrayscale ? 1 : 0}) brightness(${slot.brightness}) contrast(${slot.contrast}) saturate(${slot.saturation ?? 1.0})`,
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500">
                No Image
              </div>
            )}
          </div>
        )}

        {borderStyle === 'solid' && (
          <div className="absolute inset-0 border-[0.3px] border-neutral-400 pointer-events-none" />
        )}
        {borderStyle === 'dotted' && (
          <div className="absolute inset-0 border-[0.5px] border-dotted border-black pointer-events-none" />
        )}
        {borderStyle === 'crop' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-neutral-500" />
            <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-neutral-500" />
            <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-neutral-500" />
            <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-neutral-500" />
          </div>
        )}

        <div className="absolute bottom-0.5 right-0.5 bg-neutral-900/85 text-[8px] font-mono font-semibold text-white px-1 py-0.2 rounded select-none opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          {slot.widthCm}x{slot.heightCm} cm {slot.isPolaroid ? '(Polaroid)' : ''}
        </div>

        <div className="absolute inset-x-0 top-0 flex justify-center gap-1.5 p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-b from-black/40 to-transparent z-20">
          {layoutMode === 'freeform' && (
            <div className="p-0.5 bg-blue-600/90 text-white rounded cursor-grab" title="Tarik Foto untuk memindahkan">
              <Move className="w-3 h-3" />
            </div>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRotateSlot(slot.id);
            }}
            className="p-0.5 bg-black/80 hover:bg-black text-white rounded transition"
            title="Putar Foto 90°"
          >
            <RotateCw className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateSlot(slot.id);
            }}
            className="p-0.5 bg-black/80 hover:bg-black text-white rounded transition"
            title="Ganda / Copy"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSlot(slot.id);
            }}
            className="p-0.5 bg-red-600/90 hover:bg-red-600 text-white rounded transition"
            title="Hapus"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  const canvasToolbar = (
    <div className={`sticky top-0 z-40 flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-3 py-2.5 backdrop-blur-md sm:px-4 ${
      theme === 'dark'
        ? 'border-slate-800 bg-[#111827]/95 shadow-[0_6px_20px_rgba(0,0,0,0.18)]'
        : 'border-slate-200 bg-white/95 shadow-[0_6px_20px_rgba(15,23,42,0.06)]'
    }`}>
      <div className="flex h-8 items-center gap-1 rounded-md border border-slate-700/70 bg-slate-900/70 px-1" aria-label="Canvas zoom">
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(25, canvasZoom - 10))}
          disabled={canvasZoom <= 25}
          className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-40"
          title="Perkecil canvas"
          aria-label="Perkecil canvas"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onZoomChange(55)}
          className="min-w-12 rounded px-1.5 py-1 text-center font-mono text-[11px] text-slate-300 hover:bg-slate-800"
          title="Reset zoom ke 55%"
          aria-label={`Zoom canvas ${canvasZoom} persen, klik untuk reset`}
        >
          {canvasZoom}%
        </button>
        <button
          type="button"
          onClick={() => onZoomChange(Math.min(150, canvasZoom + 10))}
          disabled={canvasZoom >= 150}
          className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:opacity-40"
          title="Perbesar canvas"
          aria-label="Perbesar canvas"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className={`hidden text-[10px] font-semibold uppercase sm:inline ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>Pratinjau warna</span>
        <div className={`inline-flex rounded-md border p-0.5 ${theme === 'dark' ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-100'}`} role="group" aria-label="Mode warna pratinjau">
          <button
            type="button"
            onClick={() => onColorModeChange('rgb')}
            aria-pressed={colorMode === 'rgb'}
            className={`rounded px-2.5 py-1.5 text-[10px] font-bold transition-colors ${colorMode === 'rgb' ? 'bg-blue-600 text-white' : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'}`}
          >
            RGB
          </button>
          <button
            type="button"
            onClick={() => onColorModeChange('cmyk')}
            aria-pressed={colorMode === 'cmyk'}
            title="Soft-proof CMYK generik; bukan simulasi profil ICC dan ekspor tetap RGB"
            className={`rounded px-2.5 py-1.5 text-[10px] font-bold transition-colors ${colorMode === 'cmyk' ? 'bg-blue-600 text-white' : theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'}`}
          >
            CMYK
          </button>
        </div>
      </div>
      {colorMode === 'cmyk' && (
        <p className="basis-full text-right text-[10px] text-amber-500" role="status">
          Soft-proof generik. Ekspor tetap RGB; hasil cetak bergantung profil printer.
        </p>
      )}
    </div>
  );

  if (canvasSlots.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        {canvasToolbar}
        <div className="flex max-w-lg flex-1 flex-col items-center justify-center p-8">
        <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-neutral-500 mb-4 animate-pulse">
          <ImageIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-200 mb-2">
          Lembar Cetakan {isScrapPaper ? 'Kertas Sisa' : 'A4'} Siap Digunakan
        </h3>
        <p className="text-sm text-neutral-400 leading-relaxed mb-6">
          Belum ada foto yang ditempatkan di dalam kertas {selectedPaperPreset.name} ({effectivePaperWidthCm.toFixed(1)} × {effectivePaperHeightCm.toFixed(1)} cm) Anda. {uploadedImages.length === 0 ? "Silakan unggah foto dari komputer Anda terlebih dahulu untuk memulai penataan cetak." : "Pilih foto dari galeri di bilah kiri, tentukan ukuran preset cetak, dan klik tombol Tambahkan ke Lembar!"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {uploadedImages.length === 0 ? (
            <button
              onClick={onTriggerFileSelect}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Unggah Foto Sekarang
            </button>
          ) : (
            <button
              onClick={onAddToCanvas}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambahkan Foto ke Lembar
            </button>
          )}
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center w-full">
      {canvasToolbar}
      <div className="flex w-full flex-1 flex-col items-center gap-8 overflow-auto py-3 pb-16">
      {paginatedPages.map((pageSlots, pageIndex) => (
        <div
          key={pageIndex}
          className="canvas-page flex w-full flex-col items-center gap-2.5 py-1"
          style={{
            contentVisibility: 'auto',
            containIntrinsicSize: `auto ${Math.ceil(effectivePaperHeightCm * 37.795 * canvasZoom / 100 + 72)}px`,
          }}
        >
          <div 
            className="flex items-center justify-between w-full px-2.5 transition-all"
            style={{ maxWidth: `${Math.max(16, effectivePaperWidthCm * (canvasZoom / 100))}cm` }}
          >
            <span className="text-xs font-semibold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Halaman {pageIndex + 1} dari {paginatedPages.length} {isScrapPaper ? '(Kertas Sisa)' : ''}
            </span>
            <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
              {isScrapPaper && <Scissors className="w-3 h-3 text-amber-500" />}
              Ukuran Cetak: {effectivePaperWidthCm.toFixed(1)} × {effectivePaperHeightCm.toFixed(1)} cm ({selectedPaperPreset.name})
            </span>
          </div>

          <div 
            style={{ 
              width: `${effectivePaperWidthCm * (canvasZoom / 100)}cm`,
              height: `${effectivePaperHeightCm * (canvasZoom / 100)}cm`,
            }}
            className="studio-canvas-shadow border border-neutral-300 dark:border-slate-800 bg-white rounded-sm overflow-hidden shrink-0 relative"
          >
            <div 
              className="origin-top-left bg-white select-none"
              style={{
                transform: `scale(${canvasZoom / 100})`,
                width: `${effectivePaperWidthCm}cm`,
                height: `${effectivePaperHeightCm}cm`,
                filter: colorMode === 'cmyk' ? 'saturate(0.78) contrast(0.97) brightness(0.99)' : undefined,
              }}
            >
              <div 
                className="bg-white text-black text-left h-full w-full relative transition-all"
                style={{
                  padding: layoutMode === 'auto' ? `${marginCm}cm` : '0cm',
                  gap: layoutMode === 'auto' ? `${gapCm}cm` : '0cm',
                  display: layoutMode === 'auto' ? 'flex' : 'block',
                  flexWrap: layoutMode === 'auto' ? 'wrap' : undefined,
                  alignContent: layoutMode === 'auto' ? 'flex-start' : undefined,
                  boxSizing: 'border-box',
                }}
              >
                {layoutMode === 'freeform' && showGridLines && (
                  <div 
                    className="absolute inset-0 pointer-events-none transition-opacity duration-200 z-0"
                    style={{
                      margin: `${marginCm}cm`,
                      backgroundImage: `
                        linear-gradient(to right, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(59, 130, 246, 0.08) 1px, transparent 1px),
                        linear-gradient(to right, rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
                      `,
                      backgroundSize: `${gridStepCm}cm ${gridStepCm}cm, 0.1cm 0.1cm`,
                      border: '1px dashed rgba(59, 130, 246, 0.15)',
                    }}
                  />
                )}

                {pageSlots.map((slot) => renderSlot(slot, pageIndex))}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-neutral-400 font-mono italic">
            Halaman ini menampung {pageSlots.length} foto cetak.
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}