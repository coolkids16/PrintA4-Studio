import { Printer, Scissors, X, Download, FileDown, FileTextIcon, AlertCircle, Download as DownloadIcon } from 'lucide-react';
import { PaperPreset } from '../types';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
  onDownloadPage: (pageIndex: number, dpi: number) => void;
  onDownloadAllPages: (dpi: number) => void;
  onExportPDF: () => void;
  paginatedPages: PhotoSlot[][];
  canvasSlots: PhotoSlot[];
  effectivePaperWidthCm: number;
  effectivePaperHeightCm: number;
  selectedPaperPreset: PaperPreset;
  isScrapPaper: boolean;
  exportDpi: number;
  setExportDpi: (dpi: number) => void;
  isExporting: boolean;
  theme: 'light' | 'dark';
}

interface PhotoSlot {
  id: string;
  imageId: string;
  widthCm: number;
  heightCm: number;
  xCm?: number;
  yCm?: number;
  pageIndex?: number;
  rotate: 0 | 90 | 180 | 270;
  zoom: number;
  offsetX: number;
  offsetY: number;
  isGrayscale: boolean;
  brightness: number;
  contrast: number;
  saturation: number;
  bgColor: string;
  isPolaroid: boolean;
  polaroidCaption?: string;
  polaroidFont?: 'handwritten' | 'sans' | 'typewriter';
}

export function PrintModal({
  isOpen,
  onClose,
  onPrint,
  onDownloadPage,
  onDownloadAllPages,
  onExportPDF,
  paginatedPages,
  canvasSlots,
  effectivePaperWidthCm,
  effectivePaperHeightCm,
  selectedPaperPreset,
  isScrapPaper,
  exportDpi,
  setExportDpi,
  isExporting,
  theme,
}: PrintModalProps) {
  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[92vh] transition-colors border ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-950'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/30 text-blue-500 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 dark:text-slate-100 flex items-center gap-2">
                <span>Cetak & Ekspor Lembar {isScrapPaper ? 'Kertas Sisa' : 'A4'}</span>
                {isScrapPaper && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Scissors className="w-3 h-3" />
                    Sisa Cetak
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Pilih metode cetak langsung ke printer atau unduh file siap cetak skala 100% fisik
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-neutral-400 hover:text-neutral-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/20 border border-slate-800 mb-4 text-center text-xs">
          <div>
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Ukuran Lembar</span>
            <span className="font-semibold text-blue-400">
              {isScrapPaper ? 'Sisa A4' : 'A4'} ({effectivePaperWidthCm.toFixed(1)} × {effectivePaperHeightCm.toFixed(1)} cm)
            </span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Total Halaman</span>
            <span className="font-semibold text-emerald-400">{paginatedPages.length} Lembar {isScrapPaper ? 'Sisa' : 'A4'}</span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 block uppercase font-bold">Total Foto</span>
            <span className="font-semibold text-amber-400">{canvasSlots.length} Foto Cetak</span>
          </div>
        </div>

        {isScrapPaper && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2 mb-4 leading-relaxed">
            <Scissors className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <strong className="block text-amber-200 font-semibold mb-0.5">Panduan Memasukkan Kertas Sisa ke Printer:</strong>
              Masukkan potongan kertas sisa Anda ({effectivePaperWidthCm.toFixed(1)} × {effectivePaperHeightCm.toFixed(1)} cm) ke baki printer (rear feeder / bypass tray). Geser pemandu kertas (paper guides) printer agar potongan kertas terjepit lurus tanpa miring.
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className={`p-4 rounded-xl border transition-all ${
            theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">1</span>
                  <h4 className="font-bold text-sm text-slate-200">Cetak Langsung (Browser Print Dialog)</h4>
                </div>
                <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                  Memicu jendela cetak printer fisik browser bawaan. Area cetak dioptimalkan dengan skala 100% tanpa distorsi.
                </p>
              </div>
              <button
                onClick={onPrint}
                className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 shrink-0 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Buka Jendela Cetak</span>
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-neutral-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                <strong>Tips penting:</strong> Jika Anda berada di lingkungan Linux atau jendela cetak tidak muncul karena kebijakan sandbox browser, gunakan <strong>Opsi 2</strong> di bawah untuk mengunduh gambar 300 DPI siap cetak.
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-xl border border-emerald-500/30 transition-all ${
            theme === 'dark' ? 'bg-emerald-950/15' : 'bg-emerald-50/40'
          }`}>
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">2</span>
                <h4 className="font-bold text-sm text-emerald-400">Unduh Lembar Siap Cetak (300 DPI Ultra High-Res)</h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                Paling Akurat
              </span>
            </div>
            <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
              Merender lembar A4 secara presisi 1:1 ke file gambar resolusi tinggi (2480 x 3508 piksel pada 300 DPI). Buka file ini di Linux dan cetak dengan opsi ukuran A4 skala 100% untuk hasil cetak studio yang dijamin bebas distorsi.
            </p>

            <div className="flex items-center justify-between text-xs mb-3 p-2 bg-black/20 rounded-lg border border-slate-800">
              <span className="text-[11px] text-neutral-300 font-semibold">Resolusi Cetak (DPI):</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExportDpi(300)}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
                    exportDpi === 300 ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  300 DPI (Kualitas Studio)
                </button>
                <button
                  type="button"
                  onClick={() => setExportDpi(150)}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
                    exportDpi === 150 ? 'bg-emerald-600 text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  150 DPI (Standar)
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {paginatedPages.length > 1 && (
                <button
                  onClick={() => onDownloadAllPages(exportDpi)}
                  disabled={isExporting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Memproses...' : `Unduh Semua (${paginatedPages.length}) Halaman`}</span>
                </button>
              )}

              {paginatedPages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => onDownloadPage(idx, exportDpi)}
                  disabled={isExporting}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    theme === 'dark'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
                  }`}
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Unduh Halaman {idx + 1} ({exportDpi} DPI PNG)</span>
                </button>
              ))}

              {paginatedPages.length > 0 && (
                <button
                  onClick={onExportPDF}
                  disabled={isExporting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <FileTextIcon className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Memproses...' : `Ekspor PDF (${paginatedPages.length} Halaman)`}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-neutral-500">
          <span>Pencetakan skala 1:1 fisik bebas distorsi</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-neutral-300 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}