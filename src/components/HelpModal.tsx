import { Printer, X, AlertCircle, Upload, Check, Scissors, Layout, Grid, RotateCcw, AlertCircle as AlertCircleIcon } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export function HelpModal({ isOpen, onClose, theme }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[90vh] transition-colors border ${
        theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-950'
      }`}>
        <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-4">
          <h3 className="text-base font-bold flex items-center gap-2 text-blue-500">
            <Printer className="w-5 h-5" />
            Panduan Penting Cetak Presisi Centimeter (100% Akurat)
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-neutral-400 hover:text-neutral-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed mb-4">
          Browser modern dapat mencetak ukuran fisik cm secara 100% presisi asalkan opsi penskalaan dinonaktifkan di jendela dialog cetak printer Anda. Silakan ikuti instruksi berikut:
        </p>

        <div className="space-y-4 text-xs leading-relaxed">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs shrink-0 font-bold">
              1
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 dark:text-slate-100 mb-0.5">Ukuran Kertas (A4)</h4>
              <p className="text-neutral-400">
                Pada opsi dialog cetak browser (seperti Google Chrome atau Firefox di Linux/Ubuntu), cari menu <strong>"Ukuran Kertas" (Paper Size)</strong>, lalu wajib pilih <strong>A4</strong>. Jangan biarkan di "Letter" atau ukuran bawaan printer lainnya.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs shrink-0 font-bold">
              2
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 dark:text-slate-100 mb-0.5">Penskalaan Wajib 100% (Actual Size)</h4>
              <p className="text-neutral-400">
                Cari menu <strong>"Skala" (Scale)</strong>. Ubah dari yang semula "Sesuaikan dengan kertas" (Fit to page/shrink to fit) menjadi <strong>"Bawaan" (Default)</strong> atau ketik nilai kustom <strong>100</strong> secara manual. Ini adalah langkah terpenting agar ukuran centimeter foto asli di printer tidak menyusut!
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs shrink-0 font-bold">
              3
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 dark:text-slate-100 mb-0.5">Margin ke "None" atau "Tanpa Margin"</h4>
              <p className="text-neutral-400">
                Atur pengaturan <strong>"Margin"</strong> ke opsi <strong>"Minimum"</strong> atau <strong>"Tanpa Margin" (None)</strong>. Hal ini membebaskan kertas dari margin bawaan browser sehingga penempatan foto presisi centimeter tidak bergeser dan tidak terpotong.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs shrink-0 font-bold">
              4
            </div>
            <div>
              <h4 className="font-semibold text-slate-200 dark:text-slate-100 mb-0.5">Grafis Latar Belakang (Background Graphics)</h4>
              <p className="text-neutral-400">
                Di bagian opsi tambahan cetak, wajib **centang/aktifkan** pilihan **"Grafis Latar Belakang" (Background Graphics)** agar warna latar belakang merah, biru, atau putih dari pas foto yang Anda pilih dapat tercetak sempurna di kertas printer.
              </p>
            </div>
          </div>

          <div className={`p-3.5 rounded-xl border flex flex-col gap-2 ${
            theme === 'dark' ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className="font-bold text-blue-500 block text-xs">Pintasan Keyboard Cepat (Keyboard Shortcuts):</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-neutral-400">
              <div className="flex items-center justify-between p-1.5 rounded bg-black/20 border border-slate-800/40">
                <span>Batal (Undo)</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">Ctrl + Z</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-black/20 border border-slate-800/40">
                <span>Ulangi (Redo)</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono text-[10px]">Ctrl + Y</kbd>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-black/20 border border-slate-800/40 sm:col-span-2">
                <span className="text-red-400 font-medium">Kosongkan Canvas Cepat</span>
                <kbd className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/40 font-mono text-[10px]">Shift + Delete / Alt + Backspace</kbd>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border flex gap-3 ${
            theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <span className="font-bold text-amber-500 block mb-0.5">Catatan Pengguna Linux (CUPS / Inkjet):</span>
              Untuk hasil cetak foto berkualitas studio di Linux (misal menggunakan Ubuntu, Debian, atau Fedora), direkomendasikan untuk memasang driver eksklusif printer Anda (misal Epson CUPS Driver) dan mengatur resolusi pencetakan printer ke <strong>"Photo Quality"</strong> atau <strong>"High / Best"</strong> pada dialog sistem CUPS guna kerapatan warna yang optimal.
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition"
          >
            Saya Mengerti & Siap Mencetak
          </button>
        </div>
      </div>
    </div>
  );
}