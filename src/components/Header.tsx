import { Printer, Undo, Redo, Trash2, Save, FolderOpen, Sun, Moon, HelpCircle, Scissors, X, Check, Sparkles } from 'lucide-react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onHelpClick: () => void;
  onPrintClick: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onQuickClear: () => void;
  canQuickClear: boolean;
  onSaveProject: () => void;
  canSaveProject: boolean;
  onLoadProject: () => void;
  projectFileInputRef: React.RefObject<HTMLInputElement | null>;
  historyIndex: number;
  historyLength: number;
  canvasSlotsLength: number;
  uploadedImagesLength: number;
  isScrapPaper: boolean;
  selectedPaperPreset: { name: string };
  effectivePaperWidthCm: number;
  effectivePaperHeightCm: number;
  orientation: 'portrait' | 'landscape';
  toastMessage: string | null;
  toastAction: { label: string; onClick: () => void } | null;
}

export function Header({
  theme,
  onThemeToggle,
  onHelpClick,
  onPrintClick,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onQuickClear,
  canQuickClear,
  onSaveProject,
  canSaveProject,
  onLoadProject,
  projectFileInputRef,
  historyIndex,
  historyLength,
  canvasSlotsLength,
  uploadedImagesLength,
  isScrapPaper,
  selectedPaperPreset,
  effectivePaperWidthCm,
  effectivePaperHeightCm,
  orientation,
  toastMessage,
  toastAction,
}: HeaderProps) {
  return (
    <>
      <header className={`no-print shrink-0 flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-b px-2.5 py-2 sm:flex-nowrap sm:px-4 sm:py-3 lg:px-6 lg:py-4 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md sm:h-9 sm:w-9">
            <Printer className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0">
            <span className="whitespace-nowrap text-sm font-bold tracking-tight sm:text-lg">PrintA4 Studio</span>
            <span className="hidden sm:inline text-[10px] text-blue-500 font-semibold ml-2 tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 uppercase">
              Offline Pro
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2.5 text-xs text-neutral-400">
          <span className="flex items-center gap-1 font-medium">
            {isScrapPaper ? (
              <>
                <Scissors className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-amber-400 font-semibold">{selectedPaperPreset.name}</span>
                <span>({effectivePaperWidthCm.toFixed(1)} × {effectivePaperHeightCm.toFixed(1)} cm)</span>
              </>
            ) : (
              <span>Kertas A4 (21.0 × 29.7 cm)</span>
            )}
          </span>
          <span aria-hidden="true">·</span>
          <span>Sistem Cetak Offline Presisi</span>
          <span aria-hidden="true">·</span>
          <span>Multi-Ukuran Pas Foto & Polaroid</span>
        </div>

        <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start sm:gap-2 lg:gap-3">
          <div className={`flex items-center gap-0.5 border-r pr-1.5 mr-0.5 sm:gap-1.5 sm:pr-3 sm:mr-1 ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`rounded-lg p-2 sm:p-2.5 transition-colors duration-200 ${
                !canUndo
                  ? 'opacity-30 cursor-not-allowed text-neutral-500'
                  : theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Batal (Ctrl + Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`rounded-lg p-2 sm:p-2.5 transition-colors duration-200 ${
                !canRedo
                  ? 'opacity-30 cursor-not-allowed text-neutral-500'
                  : theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Ulangi (Ctrl + Y)"
            >
              <Redo className="w-4 h-4" />
            </button>

            <button
              onClick={onQuickClear}
              disabled={!canQuickClear}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                !canQuickClear
                  ? 'opacity-30 cursor-not-allowed text-neutral-500'
                  : 'text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 active:scale-95'
              }`}
              title="Kosongkan Seluruh Canvas Secara Cepat (Shift + Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kosongkan</span>
            </button>

            <div className="flex items-center gap-1.5 border-l pl-3 ml-1 border-slate-800">
              <button
                onClick={onSaveProject}
                disabled={!canSaveProject}
                className={`rounded-lg p-2 sm:p-2.5 transition-colors duration-200 ${
                  !canSaveProject
                    ? 'opacity-30 cursor-not-allowed text-neutral-500'
                    : theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400' : 'bg-slate-100 hover:bg-slate-200 text-emerald-600'
                }`}
                title="Simpan Proyek (JSON)"
              >
                <Save className="w-4 h-4" />
              </button>
              <input
                ref={projectFileInputRef}
                type="file"
                accept=".json"
                onChange={onLoadProject}
                className="hidden"
              />
              <button
                onClick={() => projectFileInputRef.current?.click()}
                className={`p-2.5 rounded-lg transition-colors duration-200 ${
                  theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-blue-400' : 'bg-slate-100 hover:bg-slate-200 text-blue-600'
                }`}
                title="Muat Proyek (JSON)"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={onThemeToggle}
            className={`p-2.5 rounded-lg transition-colors duration-200 ${
              theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onHelpClick}
            className={`p-2.5 rounded-lg transition-colors duration-200 ${
              theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Petunjuk Cetak"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrintClick}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-2 text-xs font-medium text-white shadow-lg transition-colors hover:bg-blue-500 active:bg-blue-700 sm:gap-2 sm:px-5 sm:text-sm"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak A4 / PDF</span>
          </button>
        </div>
      </header>

      {toastMessage && (
        <div className="no-print fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900/95 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold backdrop-blur-sm">
          <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{toastMessage}</span>
          {toastAction && (
            <button
              onClick={() => {
                toastAction.onClick();
              }}
              className="ml-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-md text-[11px] font-bold transition flex items-center gap-1 shadow-md shrink-0 cursor-pointer"
            >
              <Undo className="w-3 h-3" />
              {toastAction.label}
            </button>
          )}
        </div>
      )}
    </>
  );
}