import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Upload, Printer, RotateCw, Trash2, Copy, Plus, RotateCcw, 
  Settings, Sun, Moon, HelpCircle, Check, Sparkles, Scale, 
  FileText, X, ChevronRight, Image as ImageIcon, AlertCircle,
  ZoomIn, ZoomOut, RefreshCw, Layers, Sliders, Layout, Monitor, Eye,
  Undo, Redo, Grid, Move, Download, FileDown, Scissors
} from 'lucide-react';

interface UploadedImage {
  id: string;
  name: string;
  src: string;
}

interface PhotoSlot {
  id: string;
  imageId: string;
  widthCm: number;
  heightCm: number;
  rotate: number; // 0, 90, 180, 270
  zoom: number; // 0.5 to 4.0
  offsetX: number; // percentage offset (-100 to 100)
  offsetY: number; // percentage offset (-100 to 100)
  bgColor: string; // 'transparent', '#db2727' (red), '#2563eb' (blue), '#ffffff', '#64748b'
  isGrayscale: boolean;
  brightness: number; // 0.5 to 1.5
  contrast: number; // 0.5 to 1.5
  saturation?: number; // 0.0 to 2.0 (default 1.0)
  
  // Freeform positioning coordinates (used in 'freeform' mode)
  xCm?: number;
  yCm?: number;
  pageIndex?: number;

  // Polaroid specifications
  isPolaroid?: boolean;
  polaroidCaption?: string;
  polaroidFont?: 'handwritten' | 'sans' | 'typewriter';
}

interface SizePreset {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  description: string;
}

// Paper configuration & presets (supports standard A4 and leftover scrap paper pieces from A4)
export interface PaperPreset {
  id: string;
  name: string;
  shortDesc: string;
  category: 'standard' | 'scrap';
  widthCm: number;  // portrait width (<= 21.0 cm)
  heightCm: number; // portrait height (<= 29.7 cm)
  badge?: string;
}

export const PAPER_PRESETS: PaperPreset[] = [
  {
    id: 'a4-full',
    name: 'A4 Standar Penuh',
    shortDesc: 'Lembar A4 utuh 100%',
    category: 'standard',
    widthCm: 21.0,
    heightCm: 29.7,
    badge: 'A4 Penuh',
  },
  {
    id: 'scrap-a5',
    name: 'Sisa 1/2 A4 (A5 Melintang)',
    shortDesc: 'Potongan separuh A4 melintang',
    category: 'scrap',
    widthCm: 14.8,
    heightCm: 21.0,
    badge: '1/2 A4 (50%)',
  },
  {
    id: 'scrap-half-v',
    name: 'Sisa 1/2 A4 (Strip Memanjang)',
    shortDesc: 'Potongan separuh A4 tegak lurus',
    category: 'scrap',
    widthCm: 10.5,
    heightCm: 29.7,
    badge: '1/2 A4 (50%)',
  },
  {
    id: 'scrap-third',
    name: 'Sisa 1/3 A4 (Brosur / Strip)',
    shortDesc: 'Potongan sepertiga A4',
    category: 'scrap',
    widthCm: 9.9,
    heightCm: 21.0,
    badge: '1/3 A4 (33%)',
  },
  {
    id: 'scrap-a6',
    name: 'Sisa 1/4 A4 (A6 / Kartu Pos)',
    shortDesc: 'Potongan seperempat lembar A4',
    category: 'scrap',
    widthCm: 10.5,
    heightCm: 14.8,
    badge: '1/4 A4 (25%)',
  },
  {
    id: 'scrap-4r',
    name: 'Sisa Potongan Foto 4R',
    shortDesc: 'Ukuran sisa standar foto 4R',
    category: 'scrap',
    widthCm: 10.2,
    heightCm: 15.2,
    badge: 'Sisa 4R',
  },
  {
    id: 'scrap-photobooth',
    name: 'Sisa Strip Photobooth',
    shortDesc: 'Strip vertikal sisa potong foto',
    category: 'scrap',
    widthCm: 5.0,
    heightCm: 15.0,
    badge: 'Strip Foto',
  },
  {
    id: 'custom-scrap',
    name: 'Kustom Sisa Kertas (cm / mm)',
    shortDesc: 'Tentukan ukuran sisa cetak sendiri (Maksimal A4)',
    category: 'scrap',
    widthCm: 14.8,
    heightCm: 21.0,
    badge: 'Kustom Sisa',
  },
];

// Complete history state container
interface CanvasHistoryState {
  canvasSlots: PhotoSlot[];
  orientation: 'portrait' | 'landscape';
  marginCm: number;
  gapCm: number;
  borderStyle: 'none' | 'solid' | 'dotted' | 'crop';
  layoutMode: 'auto' | 'freeform';
  paperPresetId?: string;
  customPaperWidthCm?: number;
  customPaperHeightCm?: number;
}

interface DragState {
  slotId: string;
  startX: number; // mouse screen start X
  startY: number; // mouse screen start Y
  startSlotX: number; // slot coordinate X in cm
  startSlotY: number; // slot coordinate Y in cm
  pageIndex: number;
}

const SIZE_PRESETS: SizePreset[] = [
  { id: '2x3', name: 'Pas Foto 2x3', widthCm: 2.0, heightCm: 3.0, description: 'Ukuran Pas Foto resmi (2 x 3 cm)' },
  { id: '3x4', name: 'Pas Foto 3x4', widthCm: 3.0, heightCm: 4.0, description: 'Ukuran Pas Foto standar (3 x 4 cm)' },
  { id: '4x6', name: 'Pas Foto 4x6', widthCm: 4.0, heightCm: 6.0, description: 'Ukuran Pas Foto resmi (4 x 6 cm)' },
  { id: 'polaroid-mini', name: 'Polaroid Mini', widthCm: 5.4, heightCm: 8.6, description: 'Instax Mini Card (5.4 x 8.6 cm)' },
  { id: 'polaroid-classic', name: 'Polaroid Klasik', widthCm: 8.8, heightCm: 10.7, description: 'Polaroid Standard (8.8 x 10.7 cm)' },
  { id: 'polaroid-square', name: 'Polaroid Square', widthCm: 7.2, heightCm: 8.6, description: 'Instax Square (7.2 x 8.6 cm)' },
  { id: 'polaroid-wide', name: 'Polaroid Wide', widthCm: 10.8, heightCm: 8.6, description: 'Instax Wide (10.8 x 8.6 cm)' },
  { id: '2r', name: 'Foto 2R', widthCm: 6.0, heightCm: 9.0, description: 'Ukuran Dompet / Album Kecil' },
  { id: '3r', name: 'Foto 3R', widthCm: 8.9, heightCm: 12.7, description: 'Ukuran Cetak Standar Kartu Pos' },
  { id: '4r', name: 'Foto 4R', widthCm: 10.2, heightCm: 15.2, description: 'Ukuran Cetak Bingkai Standard' },
  { id: 'custom', name: 'Kustom / Bebas', widthCm: 5.0, heightCm: 5.0, description: 'Tentukan lebar & tinggi sendiri' },
];

const BG_COLOR_OPTIONS = [
  { id: 'transparent', name: 'Latar Asli (Transparan)', hex: 'transparent' },
  { id: 'red', name: 'Merah Pas Foto (Tahun Ganjil)', hex: '#db2727' },
  { id: 'blue', name: 'Biru Pas Foto (Tahun Genap)', hex: '#2563eb' },
  { id: 'white', name: 'Putih Bersih', hex: '#ffffff' },
  { id: 'gray', name: 'Abu-Abu Studio', hex: '#64748b' },
];

// Default canvas photo arrangement (empty canvas initially)
const INITIAL_SLOTS: PhotoSlot[] = [];

const INITIAL_HISTORY_STATE: CanvasHistoryState = {
  canvasSlots: [],
  orientation: 'portrait',
  marginCm: 1.0,
  gapCm: 0.2,
  borderStyle: 'crop',
  layoutMode: 'auto',
  paperPresetId: 'a4-full',
  customPaperWidthCm: 14.8,
  customPaperHeightCm: 21.0,
};

// Calculate exact inner window padding/margins for any polaroid template card size
function getPolaroidGeometry(w: number, h: number) {
  const top = 0.45;
  const left = 0.45;
  const right = 0.45;
  // Bottom must leave room for captions. Classic 8.8x10.7 (classic) needs larger room, mini 5.4x8.6 needs moderate room.
  let bottom = 1.45;
  if (h >= 10) {
    bottom = 2.25;
  } else if (h >= 8) {
    bottom = 1.65;
  } else {
    bottom = 1.25;
  }
  return { top, left, right, bottom };
}

// Simulate the dynamic row wrapping algorithm to compute exact (x, y) coordinates on pages in Auto-Flow mode
function computeAutoLayoutCoords(
  slots: PhotoSlot[],
  pageWidth: number,
  pageHeight: number,
  margin: number,
  gap: number
): { id: string; xCm: number; yCm: number; pageIndex: number }[] {
  const printableWidth = pageWidth - 2 * margin;
  const printableHeight = pageHeight - 2 * margin;
  
  const coords: { id: string; xCm: number; yCm: number; pageIndex: number }[] = [];
  
  let pageIndex = 0;
  let currentY = margin;
  let currentX = margin;
  let rowHeight = 0;
  
  for (const slot of slots) {
    const isRotated90 = slot.rotate === 90 || slot.rotate === 270;
    const w = isRotated90 ? slot.heightCm : slot.widthCm;
    const h = isRotated90 ? slot.widthCm : slot.heightCm;
    
    const neededWidth = currentX === margin ? w : gap + w;
    
    if (currentX + neededWidth <= margin + printableWidth) {
      // Fits in current row
      const actualX = currentX + (currentX === margin ? 0 : gap);
      coords.push({
        id: slot.id,
        xCm: parseFloat(actualX.toFixed(3)),
        yCm: parseFloat(currentY.toFixed(3)),
        pageIndex,
      });
      currentX = actualX + w;
      rowHeight = Math.max(rowHeight, h);
    } else {
      // Wrap to next row
      const rowIncrement = currentY === margin ? rowHeight : gap + rowHeight;
      
      if (currentY + rowIncrement + gap + h <= margin + printableHeight) {
        // Next row fits on current page
        const actualY = currentY + rowIncrement;
        coords.push({
          id: slot.id,
          xCm: margin,
          yCm: parseFloat(actualY.toFixed(3)),
          pageIndex,
        });
        currentY = actualY;
        currentX = margin + w;
        rowHeight = h;
      } else {
        // Exceeds page, wrap to a new page sheet
        pageIndex += 1;
        currentY = margin;
        currentX = margin + w;
        rowHeight = h;
        coords.push({
          id: slot.id,
          xCm: margin,
          yCm: margin,
          pageIndex,
        });
      }
    }
  }
  return coords;
}

export default function App() {
  // Theme state (Dark Mode by default as requested for studio feels)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Image assets list
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // Selected image from gallery to operate on
  const [selectedGalleryImageId, setSelectedGalleryImageId] = useState<string>('');

  // Core Canvas & Page Layout States
  const [canvasSlots, setCanvasSlots] = useState<PhotoSlot[]>(INITIAL_SLOTS);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [marginCm, setMarginCm] = useState<number>(1.0);
  const [gapCm, setGapCm] = useState<number>(0.2);
  const [borderStyle, setBorderStyle] = useState<'none' | 'solid' | 'dotted' | 'crop'>('crop'); // crop marks by default for high end look

  // Paper preset and scrap paper states (Standard A4 or Leftover/Scrap Paper from A4)
  const [paperPresetId, setPaperPresetId] = useState<string>('a4-full');
  const [customPaperWidthCm, setCustomPaperWidthCm] = useState<number>(14.8);
  const [customPaperHeightCm, setCustomPaperHeightCm] = useState<number>(21.0);

  // Active paper preset
  const selectedPaperPreset = useMemo(() => {
    return PAPER_PRESETS.find((p) => p.id === paperPresetId) || PAPER_PRESETS[0];
  }, [paperPresetId]);

  const isScrapPaper = paperPresetId !== 'a4-full';

  // Base portrait dimensions (strictly constrained to max A4 dimensions: 21.0 x 29.7 cm)
  const basePaperWidth = useMemo(() => {
    if (paperPresetId === 'custom-scrap') {
      return Math.min(21.0, Math.max(2.0, customPaperWidthCm));
    }
    return selectedPaperPreset.widthCm;
  }, [paperPresetId, customPaperWidthCm, selectedPaperPreset]);

  const basePaperHeight = useMemo(() => {
    if (paperPresetId === 'custom-scrap') {
      return Math.min(29.7, Math.max(2.0, customPaperHeightCm));
    }
    return selectedPaperPreset.heightCm;
  }, [paperPresetId, customPaperHeightCm, selectedPaperPreset]);

  // Actual effective paper dimensions based on current orientation
  const effectivePaperWidthCm = useMemo(() => {
    return orientation === 'portrait' ? basePaperWidth : basePaperHeight;
  }, [orientation, basePaperWidth, basePaperHeight]);

  const effectivePaperHeightCm = useMemo(() => {
    return orientation === 'portrait' ? basePaperHeight : basePaperWidth;
  }, [orientation, basePaperWidth, basePaperHeight]);

  // Layout Mode States
  const [layoutMode, setLayoutMode] = useState<'auto' | 'freeform'>('auto');
  const [isSnapToGrid, setIsSnapToGrid] = useState<boolean>(true);
  const [gridStepCm, setGridStepCm] = useState<number>(0.5);
  const [showGridLines, setShowGridLines] = useState<boolean>(true);

  // Form states to add new slots
  const [addSizePreset, setAddSizePreset] = useState<string>('polaroid-mini');
  const [addCustomWidth, setAddCustomWidth] = useState<string>('5.0');
  const [addCustomHeight, setAddCustomHeight] = useState<string>('5.0');
  const [addQuantity, setAddQuantity] = useState<number>(2);
  const [addBgColor, setAddBgColor] = useState<string>('transparent');
  const [addGrayscale, setAddGrayscale] = useState<boolean>(false);
  const [addPolaroidCaption, setAddPolaroidCaption] = useState<string>('Memory ✨');
  const [addPolaroidFont, setAddPolaroidFont] = useState<'handwritten' | 'sans' | 'typewriter'>('handwritten');

  // Selected single canvas slot for specific tuning controls
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // Canvas visual scaling on screen
  const [canvasZoom, setCanvasZoom] = useState<number>(55); // fits standard screen at 55% zoom

  // UI notification, print & help modal
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportDpi, setExportDpi] = useState<number>(300);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickClearRef = useRef<() => void>(() => {});

  // Drag state for freeform canvas
  const [dragState, setDragState] = useState<DragState | null>(null);

  // --- UNDO / REDO STATE HISTORY SYSTEM ---
  const [history, setHistory] = useState<CanvasHistoryState[]>([INITIAL_HISTORY_STATE]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Save current workspace state snapshot to the history stack
  const saveToHistory = (
    updatedSlots?: PhotoSlot[],
    updatedOrientation?: 'portrait' | 'landscape',
    updatedMargin?: number,
    updatedGap?: number,
    updatedBorderStyle?: 'none' | 'solid' | 'dotted' | 'crop',
    updatedLayoutMode?: 'auto' | 'freeform',
    updatedPaperPresetId?: string,
    updatedCustomPaperW?: number,
    updatedCustomPaperH?: number
  ) => {
    const slotsToSave = updatedSlots !== undefined ? updatedSlots : canvasSlots;
    const orientationToSave = updatedOrientation !== undefined ? updatedOrientation : orientation;
    const marginToSave = updatedMargin !== undefined ? updatedMargin : marginCm;
    const gapToSave = updatedGap !== undefined ? updatedGap : gapCm;
    const borderStyleToSave = updatedBorderStyle !== undefined ? updatedBorderStyle : borderStyle;
    const layoutModeToSave = updatedLayoutMode !== undefined ? updatedLayoutMode : layoutMode;
    const paperPresetToSave = updatedPaperPresetId !== undefined ? updatedPaperPresetId : paperPresetId;
    const customWToSave = updatedCustomPaperW !== undefined ? updatedCustomPaperW : customPaperWidthCm;
    const customHToSave = updatedCustomPaperH !== undefined ? updatedCustomPaperH : customPaperHeightCm;

    const nextState: CanvasHistoryState = {
      canvasSlots: JSON.parse(JSON.stringify(slotsToSave)), // Deep copy array to avoid mutation bugs
      orientation: orientationToSave,
      marginCm: marginToSave,
      gapCm: gapToSave,
      borderStyle: borderStyleToSave,
      layoutMode: layoutModeToSave,
      paperPresetId: paperPresetToSave,
      customPaperWidthCm: customWToSave,
      customPaperHeightCm: customHToSave,
    };

    setHistory((prev) => {
      // Eliminate any "future" redo history if we made changes after an Undo
      const cleanHistory = prev.slice(0, historyIndex + 1);
      // Limit: Keep last 40 states to prevent heavy memory footprints
      if (cleanHistory.length >= 40) {
        cleanHistory.shift();
      }
      return [...cleanHistory, nextState];
    });

    setHistoryIndex((prevIndex) => {
      if (history.length >= 40 && prevIndex >= 39) {
        return 39;
      }
      return prevIndex + 1;
    });
  };

  // Perform Undo Action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      const targetState = history[prevIdx];

      // Restore states atomically
      setCanvasSlots(JSON.parse(JSON.stringify(targetState.canvasSlots)));
      setOrientation(targetState.orientation);
      setMarginCm(targetState.marginCm);
      setGapCm(targetState.gapCm);
      setBorderStyle(targetState.borderStyle);
      setLayoutMode(targetState.layoutMode);
      if (targetState.paperPresetId) setPaperPresetId(targetState.paperPresetId);
      if (targetState.customPaperWidthCm !== undefined) setCustomPaperWidthCm(targetState.customPaperWidthCm);
      if (targetState.customPaperHeightCm !== undefined) setCustomPaperHeightCm(targetState.customPaperHeightCm);

      showToast("Membatalkan tindakan (Undo).");
    } else {
      showToast("Tidak ada tindakan lagi untuk dibatalkan.");
    }
  };

  // Perform Redo Action
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      const targetState = history[nextIdx];

      // Restore states atomically
      setCanvasSlots(JSON.parse(JSON.stringify(targetState.canvasSlots)));
      setOrientation(targetState.orientation);
      setMarginCm(targetState.marginCm);
      setGapCm(targetState.gapCm);
      setBorderStyle(targetState.borderStyle);
      setLayoutMode(targetState.layoutMode);
      if (targetState.paperPresetId) setPaperPresetId(targetState.paperPresetId);
      if (targetState.customPaperWidthCm !== undefined) setCustomPaperWidthCm(targetState.customPaperWidthCm);
      if (targetState.customPaperHeightCm !== undefined) setCustomPaperHeightCm(targetState.customPaperHeightCm);

      showToast("Mengulang tindakan (Redo).");
    } else {
      showToast("Tidak ada tindakan untuk diulang.");
    }
  };

  // Keep references to handlers updated for global event handlers to prevent closure lag
  const undoRef = useRef(handleUndo);
  const redoRef = useRef(handleRedo);

  useEffect(() => {
    undoRef.current = handleUndo;
    redoRef.current = handleRedo;
    quickClearRef.current = handleQuickClearCanvas;
  });

  // Keyboard Shortcuts Registration
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Stop event capture if typing in form input elements
      const target = e.target as HTMLElement;
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'SELECT' || 
        target.tagName === 'TEXTAREA'
      )) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const hasModifier = isMac ? e.metaKey : e.ctrlKey;

      if (hasModifier && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redoRef.current(); // Ctrl + Shift + Z -> Redo
        } else {
          e.preventDefault();
          undoRef.current(); // Ctrl + Z -> Undo
        }
      } else if (hasModifier && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoRef.current(); // Ctrl + Y -> Redo
      } else if (
        (e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) ||
        (e.altKey && e.key === 'Backspace') ||
        (hasModifier && e.shiftKey && e.key.toLowerCase() === 'x')
      ) {
        // Quick Clear Shortcut: Shift+Delete, Shift+Backspace, Alt+Backspace, or Ctrl+Shift+X
        e.preventDefault();
        quickClearRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- FREEFORM MOUSE DRAG HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent, slot: PhotoSlot, pageIndex: number) => {
    if (layoutMode !== 'freeform') return;
    e.preventDefault();
    
    // Save starting positioning parameters
    setDragState({
      slotId: slot.id,
      startX: e.clientX,
      startY: e.clientY,
      startSlotX: slot.xCm !== undefined ? slot.xCm : marginCm,
      startSlotY: slot.yCm !== undefined ? slot.yCm : marginCm,
      pageIndex: pageIndex,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      // Screen Pixels to Centimeters conversion constant:
      // Standard 96 DPI: 1 cm = 37.79527559 pixels.
      // We scale pixels based on the canvasZoom slider scale factor.
      const pxPerCm = 37.79527559 * (canvasZoom / 100);
      const deltaXCms = deltaX / pxPerCm;
      const deltaYCms = deltaY / pxPerCm;

      let newX = dragState.startSlotX + deltaXCms;
      let newY = dragState.startSlotY + deltaYCms;

      // Snap to Grid calculations
      if (isSnapToGrid) {
        newX = Math.round(newX / gridStepCm) * gridStepCm;
        newY = Math.round(newY / gridStepCm) * gridStepCm;
      }

      // Constraints: keep the element safely inside margins of A4 page sheet boundaries
      const targetSlot = canvasSlots.find((s) => s.id === dragState.slotId);
      if (targetSlot) {
        const isRotated90 = targetSlot.rotate === 90 || targetSlot.rotate === 270;
        const w = isRotated90 ? targetSlot.heightCm : targetSlot.widthCm;
        const h = isRotated90 ? targetSlot.widthCm : targetSlot.heightCm;

        const pW = effectivePaperWidthCm;
        const pH = effectivePaperHeightCm;

        // Clip positions so elements never spill outside page borders or paper margins
        newX = Math.max(marginCm, Math.min(pW - marginCm - w, newX));
        newY = Math.max(marginCm, Math.min(pH - marginCm - h, newY));

        setCanvasSlots((prev) =>
          prev.map((s) =>
            s.id === dragState.slotId
              ? { ...s, xCm: parseFloat(newX.toFixed(3)), yCm: parseFloat(newY.toFixed(3)) }
              : s
          )
        );
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        setDragState(null);
        saveToHistory(canvasSlots); // Commit finalized drag position to history stack!
      }
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, canvasSlots, isSnapToGrid, gridStepCm, canvasZoom, marginCm, effectivePaperWidthCm, effectivePaperHeightCm]);

  // Handle switching between Auto-flow and Freeform layouts cleanly with conversions
  const handleSwitchLayoutMode = (newMode: 'auto' | 'freeform') => {
    if (newMode === layoutMode) return;
    
    if (newMode === 'freeform') {
      // Convert current auto-flow positions to static centimeter coordinates
      const pW = effectivePaperWidthCm;
      const pH = effectivePaperHeightCm;
      
      const computedCoords = computeAutoLayoutCoords(canvasSlots, pW, pH, marginCm, gapCm);
      
      const updatedSlots = canvasSlots.map((slot) => {
        const coords = computedCoords.find((c) => c.id === slot.id);
        return {
          ...slot,
          xCm: coords ? coords.xCm : marginCm,
          yCm: coords ? coords.yCm : marginCm,
          pageIndex: coords ? coords.pageIndex : 0,
        };
      });
      
      setCanvasSlots(updatedSlots);
      setLayoutMode('freeform');
      saveToHistory(updatedSlots, orientation, marginCm, gapCm, borderStyle, 'freeform');
      showToast("Layout Bebas Aktif: Tarik foto untuk mengatur tata letaknya!");
    } else {
      // Auto flow mode simply discards absolute positions
      setLayoutMode('auto');
      saveToHistory(canvasSlots, orientation, marginCm, gapCm, borderStyle, 'auto');
      showToast("Tata Letak Otomatis Aktif: Foto tersusun berurutan secara rapi.");
    }
  };

  // --- STANDARD APPLICATION LOGIC ---

  // Apply dark/light theme to document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Toast auto-dismisser
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
        setToastAction(null);
      }, toastAction ? 6000 : 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, toastAction]);

  const showToast = (msg: string, action?: { label: string; onClick: () => void }) => {
    setToastMessage(msg);
    setToastAction(action || null);
  };

  // Preset measurements solver
  const getPresetDimensions = (presetId: string): { w: number; h: number } => {
    if (presetId === 'custom') {
      return {
        w: parseFloat(addCustomWidth) || 5.0,
        h: parseFloat(addCustomHeight) || 5.0,
      };
    }
    const found = SIZE_PRESETS.find((p) => p.id === presetId);
    return found ? { w: found.widthCm, h: found.heightCm } : { w: 4.0, h: 6.0 };
  };

  // Upload handles
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newImages: UploadedImage[] = [];

      files.forEach((file) => {
        const objectUrl = URL.createObjectURL(file);
        newImages.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name.length > 25 ? file.name.substring(0, 22) + '...' : file.name,
          src: objectUrl,
        });
      });

      if (newImages.length > 0) {
        setUploadedImages((prev) => [...prev, ...newImages]);
        setSelectedGalleryImageId(newImages[0].id);
        showToast(`Sukses menambahkan ${newImages.length} foto ke galeri!`);
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Delete image from user's gallery
  const handleDeleteGalleryImage = (e: React.MouseEvent, imgId: string) => {
    e.stopPropagation();
    const remaining = uploadedImages.filter((img) => img.id !== imgId);
    setUploadedImages(remaining);
    if (selectedGalleryImageId === imgId) {
      setSelectedGalleryImageId(remaining.length > 0 ? remaining[0].id : '');
    }
    showToast("Foto berhasil dihapus dari galeri.");
  };

  // Add items to canvas logic
  const handleAddToCanvas = () => {
    if (uploadedImages.length === 0) {
      showToast("Silakan unggah foto ke galeri terlebih dahulu.");
      triggerFileSelect();
      return;
    }
    const targetImageId = selectedGalleryImageId || uploadedImages[0]?.id;
    if (!targetImageId) {
      showToast("Silakan pilih foto dari galeri terlebih dahulu.");
      return;
    }

    const { w, h } = getPresetDimensions(addSizePreset);
    const newSlots: PhotoSlot[] = [];
    const pIndex = paginatedPages.length - 1 >= 0 ? paginatedPages.length - 1 : 0;
    const isPolaroidPreset = addSizePreset.startsWith('polaroid-');

    for (let i = 0; i < addQuantity; i++) {
      // Slide slightly in freeform so they don't spawn exactly overlaying on top of each other
      const cascadeOffset = i * 0.5;

      newSlots.push({
        id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${i}`,
        imageId: targetImageId,
        widthCm: w,
        heightCm: h,
        rotate: 0,
        zoom: isPolaroidPreset ? 1.15 : 1.0,
        offsetX: 0,
        offsetY: 0,
        bgColor: isPolaroidPreset ? 'transparent' : addBgColor,
        isGrayscale: addGrayscale,
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        
        // Coordinates for freeform canvas positioning
        xCm: layoutMode === 'freeform' ? marginCm + cascadeOffset : undefined,
        yCm: layoutMode === 'freeform' ? marginCm + cascadeOffset : undefined,
        pageIndex: layoutMode === 'freeform' ? pIndex : undefined,

        // Polaroid specs if preset matches
        isPolaroid: isPolaroidPreset,
        polaroidCaption: isPolaroidPreset ? addPolaroidCaption : undefined,
        polaroidFont: isPolaroidPreset ? addPolaroidFont : undefined,
      });
    }

    const updated = [...canvasSlots, ...newSlots];
    setCanvasSlots(updated);
    saveToHistory(updated); // Save to undo/redo stack!
    
    if (newSlots.length > 0) {
      setSelectedSlotId(newSlots[0].id);
    }
    showToast(`Ditambahkan ${addQuantity} cetakan foto ke lembar kerja.`);
  };

  // Auto fill entire page sheet with the selected gallery image
  const handleAutoFillPage = () => {
    if (uploadedImages.length === 0) {
      showToast("Silakan unggah foto ke galeri terlebih dahulu.");
      triggerFileSelect();
      return;
    }
    const targetImageId = selectedGalleryImageId || uploadedImages[0]?.id;
    if (!targetImageId) {
      showToast("Silakan pilih foto dari galeri terlebih dahulu.");
      return;
    }

    const { w, h } = getPresetDimensions(addSizePreset);
    const pW = effectivePaperWidthCm;
    const pH = effectivePaperHeightCm;
    const printW = pW - (2 * marginCm);
    const printH = pH - (2 * marginCm);
    const isPolaroidPreset = addSizePreset.startsWith('polaroid-');

    // Approximate items per row & column
    const cols = Math.floor((printW + gapCm) / (w + gapCm)) || 1;
    const rows = Math.floor((printH + gapCm) / (h + gapCm)) || 1;
    const totalFit = cols * rows;

    if (totalFit <= 0) {
      showToast("Kesalahan: Ukuran foto melebihi kapasitas cetak kertas!");
      return;
    }

    const filledSlots: PhotoSlot[] = [];
    const pIndex = paginatedPages.length - 1 >= 0 ? paginatedPages.length - 1 : 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const xCoord = marginCm + c * (w + gapCm);
        const yCoord = marginCm + r * (h + gapCm);

        filledSlots.push({
          id: `fill-${Date.now()}-${r}-${c}`,
          imageId: targetImageId,
          widthCm: w,
          heightCm: h,
          rotate: 0,
          zoom: isPolaroidPreset ? 1.15 : 1.0,
          offsetX: 0,
          offsetY: 0,
          bgColor: isPolaroidPreset ? 'transparent' : addBgColor,
          isGrayscale: addGrayscale,
          brightness: 1.0,
          contrast: 1.0,
          saturation: 1.0,

          xCm: layoutMode === 'freeform' ? parseFloat(xCoord.toFixed(2)) : undefined,
          yCm: layoutMode === 'freeform' ? parseFloat(yCoord.toFixed(2)) : undefined,
          pageIndex: layoutMode === 'freeform' ? pIndex : undefined,

          isPolaroid: isPolaroidPreset,
          polaroidCaption: isPolaroidPreset ? addPolaroidCaption : undefined,
          polaroidFont: isPolaroidPreset ? addPolaroidFont : undefined,
        });
      }
    }

    const updated = [...canvasSlots, ...filledSlots];
    setCanvasSlots(updated);
    saveToHistory(updated); // Save to undo/redo stack!
    showToast(`Memenuhi halaman: Menambahkan ${filledSlots.length} foto secara maksimal.`);
  };

  // Quick actions
  const handleDeleteSlot = (id: string) => {
    const updated = canvasSlots.filter((s) => s.id !== id);
    setCanvasSlots(updated);
    saveToHistory(updated); // Save to undo/redo stack!
    if (selectedSlotId === id) {
      setSelectedSlotId(null);
    }
    showToast("Foto dihapus dari kertas.");
  };

  const handleDuplicateSlot = (id: string) => {
    const target = canvasSlots.find((s) => s.id === id);
    if (target) {
      // Offset duplicated slot slightly so they can drag it apart
      const cascadeOffset = layoutMode === 'freeform' ? 0.6 : 0;

      const duplicated: PhotoSlot = {
        ...target,
        id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        xCm: target.xCm !== undefined ? target.xCm + cascadeOffset : undefined,
        yCm: target.yCm !== undefined ? target.yCm + cascadeOffset : undefined,
      };
      const updated = [...canvasSlots, duplicated];
      setCanvasSlots(updated);
      saveToHistory(updated); // Save to undo/redo stack!
      setSelectedSlotId(duplicated.id);
      showToast("Cetak foto berhasil digandakan.");
    }
  };

  const handleRotateSlot = (id: string) => {
    const updated = canvasSlots.map((s) => {
      if (s.id === id) {
        const nextRotate = (s.rotate + 90) % 360;
        return { ...s, rotate: nextRotate };
      }
      return s;
    });
    setCanvasSlots(updated);
    saveToHistory(updated); // Save to undo/redo stack!
  };

  // Quick Clear Canvas (instant, non-blocking, with full Undo restore support)
  const handleQuickClearCanvas = () => {
    if (canvasSlots.length === 0) {
      showToast("Canvas sudah dalam keadaan kosong.");
      return;
    }
    const count = canvasSlots.length;
    const previousSlots = [...canvasSlots];
    
    // Clear instantly
    setCanvasSlots([]);
    saveToHistory([]); // Save empty state to undo/redo history!
    setSelectedSlotId(null);

    // Provide immediate notification with 1-click Undo recovery
    showToast(`⚡ Canvas berhasil dikosongkan (${count} foto dibersihkan).`, {
      label: "Batalkan (Undo)",
      onClick: () => {
        setCanvasSlots(previousSlots);
        saveToHistory(previousSlots);
        setSelectedSlotId(previousSlots[0]?.id || null);
        showToast("Pengosongan canvas dibatalkan (foto dipulihkan).");
      },
    });
  };

  const handleClearCanvas = handleQuickClearCanvas;

  const handleResetSettings = () => {
    setMarginCm(1.0);
    setGapCm(0.2);
    setBorderStyle('crop');
    setOrientation('portrait');
    setPaperPresetId('a4-full');
    setCustomPaperWidthCm(14.8);
    setCustomPaperHeightCm(21.0);
    saveToHistory(canvasSlots, 'portrait', 1.0, 0.2, 'crop', layoutMode, 'a4-full', 21.0, 29.7); // Save resetting to history!
    showToast("Pengaturan layout kertas berhasil dikembalikan ke default A4.");
  };

  // Change Paper Preset (Standard A4 or Leftover Scrap Paper cuts)
  const handleSelectPaperPreset = (presetId: string) => {
    setPaperPresetId(presetId);
    const found = PAPER_PRESETS.find((p) => p.id === presetId);
    let nextW = customPaperWidthCm;
    let nextH = customPaperHeightCm;
    if (found && presetId !== 'custom-scrap') {
      nextW = found.widthCm;
      nextH = found.heightCm;
      setCustomPaperWidthCm(found.widthCm);
      setCustomPaperHeightCm(found.heightCm);
    }
    saveToHistory(
      canvasSlots,
      orientation,
      marginCm,
      gapCm,
      borderStyle,
      layoutMode,
      presetId,
      nextW,
      nextH
    );
    showToast(
      found && found.category === 'scrap'
        ? `✂️ Kertas sisa aktif: ${found.name} (${found.widthCm} × ${found.heightCm} cm)`
        : `📄 Ukuran kertas diatur ke ${found?.name || 'A4 Standar'}.`
    );
  };

  // Change Custom Scrap dimensions with strict A4 limits enforcement
  const handleCustomPaperDimensionChange = (type: 'width' | 'height', valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return;

    // Strict physical limit: cannot exceed standard A4 sheet dimensions!
    const maxW = orientation === 'portrait' ? 21.0 : 29.7;
    const maxH = orientation === 'portrait' ? 29.7 : 21.0;

    let newW = customPaperWidthCm;
    let newH = customPaperHeightCm;

    if (type === 'width') {
      if (val > maxW) {
        showToast(`⚠️ Kertas sisa tidak boleh melebihi batas A4 (${maxW} cm)! Nilai disesuaikan.`);
        newW = maxW;
      } else {
        newW = Math.max(2.0, Math.min(maxW, val));
      }
      setCustomPaperWidthCm(newW);
    } else {
      if (val > maxH) {
        showToast(`⚠️ Kertas sisa tidak boleh melebihi batas A4 (${maxH} cm)! Nilai disesuaikan.`);
        newH = maxH;
      } else {
        newH = Math.max(2.0, Math.min(maxH, val));
      }
      setCustomPaperHeightCm(newH);
    }

    if (paperPresetId !== 'custom-scrap') {
      setPaperPresetId('custom-scrap');
    }
  };

  // Set Paper Orientation with History
  const handleSetOrientation = (newOrientation: 'portrait' | 'landscape') => {
    setOrientation(newOrientation);
    saveToHistory(canvasSlots, newOrientation); // Save to history!
    showToast(`Orientasi kertas diubah ke ${newOrientation === 'portrait' ? 'Potret (Portrait)' : 'Lanskap (Landscape)'}.`);
  };

  // Set Cut Line border with History
  const handleSetBorderStyle = (newStyle: 'none' | 'solid' | 'dotted' | 'crop') => {
    setBorderStyle(newStyle);
    saveToHistory(canvasSlots, orientation, marginCm, gapCm, newStyle); // Save to history!
  };

  // Handle detailed editing updates on currently selected slot
  const updateSelectedSlot = (updater: (slot: PhotoSlot) => PhotoSlot) => {
    if (selectedSlotId) {
      setCanvasSlots((prev) =>
        prev.map((s) => (s.id === selectedSlotId ? updater(s) : s))
      );
    }
  };

  const activeSlot = useMemo(() => {
    return canvasSlots.find((s) => s.id === selectedSlotId) || null;
  }, [canvasSlots, selectedSlotId]);

  const activeSlotImageSrc = useMemo(() => {
    if (!activeSlot) return '';
    const img = uploadedImages.find((i) => i.id === activeSlot.imageId);
    return img ? img.src : '';
  }, [activeSlot, uploadedImages]);

  // Page layout packing algorithm simulation
  const paginatedPages = useMemo(() => {
    if (layoutMode === 'auto') {
      const pageWidth = effectivePaperWidthCm;
      const pageHeight = effectivePaperHeightCm;
      const printableWidth = pageWidth - 2 * marginCm;
      const printableHeight = pageHeight - 2 * marginCm;
      
      const pages: PhotoSlot[][] = [];
      let currentPageSlots: PhotoSlot[] = [];
      
      let currentY = 0; // Cumulative height of already fully-completed rows (cm)
      let currentX = 0; // Cumulative width of elements inside the current row (cm)
      let rowHeight = 0; // Sizing height of the current row (cm)

      for (const slot of canvasSlots) {
        const isRotated90 = slot.rotate === 90 || slot.rotate === 270;
        const w = isRotated90 ? slot.heightCm : slot.widthCm;
        const h = isRotated90 ? slot.widthCm : slot.heightCm;

        // Calculate width spacing
        const neededWidth = currentX === 0 ? w : gapCm + w;

        if (currentX + neededWidth <= printableWidth) {
          // Fits on current row
          currentX += neededWidth;
          rowHeight = Math.max(rowHeight, h);
          currentPageSlots.push(slot);
        } else {
          // Must wrap to next row
          const rowIncrement = currentY === 0 ? rowHeight : gapCm + rowHeight;
          
          // Check if the new row fits in the remaining printable height
          if (currentY + rowIncrement + gapCm + h <= printableHeight) {
            // Fits on current page, wrap row
            currentY += rowIncrement;
            currentX = w;
            rowHeight = h;
            currentPageSlots.push(slot);
          } else {
            // Exceeds this page height. Pack current page & spawn new page sheet
            if (currentPageSlots.length > 0) {
              pages.push(currentPageSlots);
            }
            currentPageSlots = [slot];
            currentY = 0;
            currentX = w;
            rowHeight = h;
          }
        }
      }

      if (currentPageSlots.length > 0) {
        pages.push(currentPageSlots);
      }

      return pages.length > 0 ? pages : [[]];
    } else {
      // Freeform mode: Group photos based on their saved pageIndex property
      let maxPage = 0;
      canvasSlots.forEach((slot) => {
        if (slot.pageIndex !== undefined && slot.pageIndex > maxPage) {
          maxPage = slot.pageIndex;
        }
      });

      const pages: PhotoSlot[][] = Array.from({ length: maxPage + 1 }, () => []);
      
      canvasSlots.forEach((slot) => {
        const idx = slot.pageIndex !== undefined ? slot.pageIndex : 0;
        pages[idx].push(slot);
      });

      return pages;
    }
  }, [canvasSlots, effectivePaperWidthCm, effectivePaperHeightCm, marginCm, gapCm, layoutMode]);

  // Render a specific page at target DPI (e.g. 300 DPI for ultra sharp studio prints)
  const renderPageToCanvas = async (pageIndex: number, dpi: number = 300): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const pW = effectivePaperWidthCm;
    const pH = effectivePaperHeightCm;
    const pxPerCm = dpi / 2.54;

    canvas.width = Math.round(pW * pxPerCm);
    canvas.height = Math.round(pH * pxPerCm);
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    // Fill crisp solid white paper background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const slots = paginatedPages[pageIndex] || [];
    const autoCoords = computeAutoLayoutCoords(canvasSlots, pW, pH, marginCm, gapCm);

    // Preload images for this page
    const imageMap = new Map<string, HTMLImageElement>();
    for (const slot of slots) {
      if (!imageMap.has(slot.imageId)) {
        const imgInfo = uploadedImages.find((img) => img.id === slot.imageId);
        if (imgInfo && imgInfo.src) {
          const el = new Image();
          el.crossOrigin = 'anonymous';
          el.src = imgInfo.src;
          await new Promise((resolve) => {
            if (el.complete) resolve(true);
            else {
              el.onload = () => resolve(true);
              el.onerror = () => resolve(false);
            }
          });
          imageMap.set(slot.imageId, el);
        }
      }
    }

    for (const slot of slots) {
      const isRotated90 = slot.rotate === 90 || slot.rotate === 270;
      const cardWidthCm = isRotated90 ? slot.heightCm : slot.widthCm;
      const cardHeightCm = isRotated90 ? slot.widthCm : slot.heightCm;

      const coord = autoCoords.find((c) => c.id === slot.id);
      const xCm = layoutMode === 'freeform' ? (slot.xCm ?? marginCm) : (coord ? coord.xCm : marginCm);
      const yCm = layoutMode === 'freeform' ? (slot.yCm ?? marginCm) : (coord ? coord.yCm : marginCm);

      const cardX = Math.round(xCm * pxPerCm);
      const cardY = Math.round(yCm * pxPerCm);
      const cardW = Math.round(cardWidthCm * pxPerCm);
      const cardH = Math.round(cardHeightCm * pxPerCm);

      const imgEl = imageMap.get(slot.imageId);

      if (slot.isPolaroid) {
        // Polaroid frame
        const geo = getPolaroidGeometry(slot.widthCm, slot.heightCm);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cardX, cardY, cardW, cardH);

        const photoX = Math.round(cardX + geo.left * pxPerCm);
        const photoY = Math.round(cardY + geo.top * pxPerCm);
        const photoW = Math.round((slot.widthCm - (geo.left + geo.right)) * pxPerCm);
        const photoH = Math.round((slot.heightCm - (geo.top + geo.bottom)) * pxPerCm);

        // Inner photo background
        ctx.fillStyle = slot.bgColor === 'transparent' ? '#f5f5f7' : slot.bgColor;
        ctx.fillRect(photoX, photoY, photoW, photoH);

        if (imgEl && imgEl.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(photoX, photoY, photoW, photoH);
          ctx.clip();

          ctx.filter = `grayscale(${slot.isGrayscale ? 1 : 0}) brightness(${slot.brightness}) contrast(${slot.contrast}) saturate(${slot.saturation ?? 1.0})`;
          ctx.translate(photoX + photoW / 2, photoY + photoH / 2);
          ctx.rotate((slot.rotate * Math.PI) / 180);
          ctx.scale(slot.zoom, slot.zoom);
          ctx.translate((slot.offsetX / 100) * (photoW / 2), (slot.offsetY / 100) * (photoH / 2));

          const unrotatedW = slot.rotate === 90 || slot.rotate === 270 ? photoH : photoW;
          const unrotatedH = slot.rotate === 90 || slot.rotate === 270 ? photoW : photoH;
          const imgAspect = imgEl.naturalWidth / imgEl.naturalHeight;
          const targetAspect = unrotatedW / unrotatedH;

          let drawW = unrotatedW;
          let drawH = unrotatedH;
          if (imgAspect > targetAspect) {
            drawW = unrotatedH * imgAspect;
          } else {
            drawH = unrotatedW / imgAspect;
          }
          ctx.drawImage(imgEl, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
        }

        // Caption
        if (slot.polaroidCaption) {
          ctx.save();
          ctx.fillStyle = '#0a0a0a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const captionCenterY = cardY + cardH - ((geo.bottom * pxPerCm) / 2);
          const captionCenterX = cardX + cardW / 2;

          if (slot.polaroidFont === 'sans') {
            const fontSize = Math.round(14 * (dpi / 96));
            ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillText(slot.polaroidCaption.toUpperCase(), captionCenterX, captionCenterY, cardW - 20);
          } else if (slot.polaroidFont === 'typewriter') {
            const fontSize = Math.round(13 * (dpi / 96));
            ctx.font = `bold ${fontSize}px "Special Elite", monospace`;
            ctx.fillText(slot.polaroidCaption, captionCenterX, captionCenterY, cardW - 20);
          } else {
            const fontSize = Math.round(24 * (dpi / 96));
            ctx.font = `bold ${fontSize}px "Caveat", cursive, sans-serif`;
            ctx.fillText(slot.polaroidCaption, captionCenterX, captionCenterY, cardW - 20);
          }
          ctx.restore();
        }
      } else {
        // Normal Photo Slot
        ctx.save();
        ctx.beginPath();
        ctx.rect(cardX, cardY, cardW, cardH);
        ctx.clip();

        ctx.fillStyle = slot.bgColor === 'transparent' ? '#ffffff' : slot.bgColor;
        ctx.fillRect(cardX, cardY, cardW, cardH);

        if (imgEl && imgEl.naturalWidth > 0) {
          ctx.filter = `grayscale(${slot.isGrayscale ? 1 : 0}) brightness(${slot.brightness}) contrast(${slot.contrast}) saturate(${slot.saturation ?? 1.0})`;
          ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
          ctx.rotate((slot.rotate * Math.PI) / 180);
          ctx.scale(slot.zoom, slot.zoom);
          ctx.translate((slot.offsetX / 100) * (cardW / 2), (slot.offsetY / 100) * (cardH / 2));

          const unrotatedW = slot.rotate === 90 || slot.rotate === 270 ? cardH : cardW;
          const unrotatedH = slot.rotate === 90 || slot.rotate === 270 ? cardW : cardH;
          const imgAspect = imgEl.naturalWidth / imgEl.naturalHeight;
          const targetAspect = unrotatedW / unrotatedH;

          let drawW = unrotatedW;
          let drawH = unrotatedH;
          if (imgAspect > targetAspect) {
            drawW = unrotatedH * imgAspect;
          } else {
            drawH = unrotatedW / imgAspect;
          }
          ctx.drawImage(imgEl, -drawW / 2, -drawH / 2, drawW, drawH);
        }
        ctx.restore();
      }

      // Border and Crop Guides
      if (borderStyle === 'solid') {
        ctx.save();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = Math.max(1, Math.round(1 * (dpi / 300)));
        ctx.strokeRect(cardX, cardY, cardW, cardH);
        ctx.restore();
      } else if (borderStyle === 'dotted') {
        ctx.save();
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = Math.max(1, Math.round(1.5 * (dpi / 300)));
        ctx.setLineDash([4 * (dpi / 300), 4 * (dpi / 300)]);
        ctx.strokeRect(cardX, cardY, cardW, cardH);
        ctx.restore();
      } else if (borderStyle === 'crop') {
        ctx.save();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = Math.max(1, Math.round(1 * (dpi / 300)));
        const markLen = Math.round(8 * (dpi / 96));
        ctx.beginPath();
        ctx.moveTo(cardX, cardY + markLen); ctx.lineTo(cardX, cardY); ctx.lineTo(cardX + markLen, cardY);
        ctx.moveTo(cardX + cardW - markLen, cardY); ctx.lineTo(cardX + cardW, cardY); ctx.lineTo(cardX + cardW, cardY + markLen);
        ctx.moveTo(cardX, cardY + cardH - markLen); ctx.lineTo(cardX, cardY + cardH); ctx.lineTo(cardX + markLen, cardY + cardH);
        ctx.moveTo(cardX + cardW - markLen, cardY + cardH); ctx.lineTo(cardX + cardW, cardY + cardH); ctx.lineTo(cardX + cardW, cardY + cardH - markLen);
        ctx.stroke();
        ctx.restore();
      }
    }

    return canvas;
  };

  // Download single page
  const handleDownloadPage = async (pageIndex: number, dpi: number = exportDpi) => {
    if (canvasSlots.length === 0) {
      showToast("Canvas masih kosong. Tambahkan foto terlebih dahulu.");
      return;
    }
    setIsExporting(true);
    showToast(`Memproses render Halaman ${pageIndex + 1} (${dpi} DPI)...`);
    try {
      const canvas = await renderPageToCanvas(pageIndex, dpi);
      canvas.toBlob((blob) => {
        if (!blob) {
          showToast("Gagal menghasilkan file gambar.");
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const pageLabel = isScrapPaper ? 'SisaKertas_' : '';
        a.download = `PrintA4_${pageLabel}Halaman_${pageIndex + 1}_${effectivePaperWidthCm.toFixed(1)}x${effectivePaperHeightCm.toFixed(1)}cm_${dpi}DPI.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        showToast(`✅ Halaman ${pageIndex + 1} (${dpi} DPI) berhasil diunduh siap cetak!`);
      }, 'image/png', 0.98);
    } catch (err) {
      showToast("Terjadi kesalahan saat mengekspor gambar.");
    } finally {
      setIsExporting(false);
    }
  };

  // Download all pages
  const handleDownloadAllPages = async (dpi: number = exportDpi) => {
    if (canvasSlots.length === 0) {
      showToast("Canvas masih kosong. Tambahkan foto terlebih dahulu.");
      return;
    }
    setIsExporting(true);
    showToast(`Memproses render semua (${paginatedPages.length}) halaman...`);
    try {
      for (let i = 0; i < paginatedPages.length; i++) {
        await handleDownloadPage(i, dpi);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      showToast(`✅ Semua (${paginatedPages.length}) halaman berhasil diunduh!`);
    } catch (err) {
      showToast("Gagal mengekspor semua halaman.");
    } finally {
      setIsExporting(false);
    }
  };

  // Open Print & Export Modal Hub
  const handlePrint = () => {
    if (canvasSlots.length === 0) {
      showToast("Canvas masih kosong. Tambahkan foto ke kertas sebelum mencetak!");
      return;
    }
    setShowPrintModal(true);
  };

  // Execute direct window.print()
  const handleExecuteBrowserPrint = () => {
    try {
      window.print();
      showToast("Membuka dialog cetak printer...");
    } catch (err) {
      showToast("Pencetakan browser diblokir. Silakan gunakan tombol Unduh Gambar (300 DPI).");
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* HEADER SECTION - 3 Zone Contract (Top Bar Contract) */}
      <header className={`no-print flex items-center justify-between px-6 py-4 border-b transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md">
            <Printer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight">PrintA4 Studio</span>
            <span className="hidden sm:inline text-[10px] text-blue-500 font-semibold ml-2 tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 uppercase">
              Offline Pro
            </span>
          </div>
        </div>

        {/* Zone 2: Informational taglines & metadata (Clean unboxed inline layout) */}
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

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3">
          
          {/* UNDO & REDO INTERACTIVE BUTTONS WITH DYNAMIC FEEDBACK */}
          <div className={`flex items-center gap-1.5 border-r pr-3 mr-1 ${
            theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className={`p-2.5 rounded-lg transition-colors duration-200 ${
                historyIndex <= 0
                  ? 'opacity-30 cursor-not-allowed text-neutral-500'
                  : theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Batal (Ctrl + Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className={`p-2.5 rounded-lg transition-colors duration-200 ${
                historyIndex >= history.length - 1
                  ? 'opacity-30 cursor-not-allowed text-neutral-500'
                  : theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Ulangi (Ctrl + Y)"
            >
              <Redo className="w-4 h-4" />
            </button>

            {/* QUICK CLEAR CANVAS BUTTON */}
            <button
              onClick={handleQuickClearCanvas}
              disabled={canvasSlots.length === 0}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                canvasSlots.length === 0
                  ? 'opacity-30 cursor-not-allowed text-neutral-500'
                  : 'text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 active:scale-95'
              }`}
              title="Kosongkan Seluruh Canvas Secara Cepat (Shift + Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kosongkan</span>
            </button>
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={`p-2.5 rounded-lg transition-colors duration-200 ${
              theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className={`p-2.5 rounded-lg transition-colors duration-200 ${
              theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
            title="Petunjuk Cetak"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak A4 / PDF</span>
          </button>
        </div>
      </header>

      {/* TOAST SYSTEM */}
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

      {/* MAIN LAYOUT: Sidebar + Workspace Canvas */}
      <div className="no-print flex flex-col lg:flex-row min-h-[calc(100vh-69px)]">
        
        {/* SIDEBAR: CONTROL CENTER */}
        <aside className={`w-full lg:w-[420px] shrink-0 p-5 border-r overflow-y-auto max-h-none lg:max-h-[calc(100vh-69px)] ${
          theme === 'dark' ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          
          {/* STEP 1: UPLOAD & GALLERY */}
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-4 h-4 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px]">1</span>
                Galeri Foto Sumber
              </h2>
              <button
                onClick={triggerFileSelect}
                className="text-xs font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                Unggah File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Upload Area Dropzone feel */}
            {uploadedImages.length === 0 ? (
              <div 
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer mb-1 transition group ${
                  theme === 'dark' 
                    ? 'border-slate-800 hover:border-blue-500 bg-slate-900/30 hover:bg-slate-900/60' 
                    : 'border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/40'
                }`}
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-200 mb-1">
                  Belum Ada Foto di Galeri
                </p>
                <p className="text-[11px] text-neutral-400">
                  Klik di sini untuk mengunggah foto Anda (Mendukung multi-upload JPG, PNG, WebP).
                </p>
              </div>
            ) : (
              <div>
                {/* Thumbnail Gallery Horizontal List */}
                <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x scrollbar-thin">
                  {uploadedImages.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedGalleryImageId(img.id)}
                      className={`relative group flex-shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden cursor-pointer snap-start transition ${
                        selectedGalleryImageId === img.id
                          ? 'ring-2 ring-blue-500 scale-[1.03] shadow-md'
                          : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'
                      }`}
                    >
                      <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
                      
                      {/* Delete button from gallery on hover */}
                      <button
                        onClick={(e) => handleDeleteGalleryImage(e, img.id)}
                        className="absolute top-1 right-1 w-5 h-5 bg-red-600/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md z-10"
                        title="Hapus foto ini dari galeri"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      {selectedGalleryImageId === img.id && (
                        <div className="absolute inset-0 bg-blue-500/15 flex items-center justify-center pointer-events-none">
                          <div className="bg-blue-600 text-white rounded-full p-0.5">
                            <Check className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add more button tile */}
                  <button
                    onClick={triggerFileSelect}
                    className={`flex-shrink-0 w-[72px] h-[72px] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition ${
                      theme === 'dark'
                        ? 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
                    }`}
                    title="Unggah lebih banyak foto"
                  >
                    <Plus className="w-4 h-4 text-blue-500" />
                    <span className="text-[9px] font-semibold">Tambah</span>
                  </button>
                </div>
                
                {/* Display Selected Image Name */}
                <div className={`mt-2 px-2.5 py-1.5 rounded-md text-[11px] font-mono flex items-center justify-between ${
                  theme === 'dark' ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
                }`}>
                  <span className="truncate">Aktif: {uploadedImages.find(i => i.id === selectedGalleryImageId)?.name || 'Pilih foto'}</span>
                  <span className="text-blue-500 font-semibold shrink-0">Terpilih</span>
                </div>
              </div>
            )}
          </section>

          {/* STEP 2: TAMBAHKAN KE LEMBAR */}
          <section className={`mb-6 p-4 rounded-xl border ${
            theme === 'dark' ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'
          }`}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-3">
              <span className="w-4 h-4 rounded bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px]">2</span>
              Atur Ukuran Cetak Baru
            </h2>

            {/* Sizing Preset Grid Selector */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              {SIZE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setAddSizePreset(preset.id)}
                  type="button"
                  className={`text-left p-2 rounded-lg border text-xs transition duration-150 ${
                    addSizePreset === preset.id
                      ? 'border-blue-500 bg-blue-500/5 text-blue-500 font-semibold'
                      : theme === 'dark'
                      ? 'border-slate-800 hover:border-slate-700 text-slate-300 bg-slate-900/60'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <div className="font-semibold">{preset.name}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">
                    {preset.id === 'custom' 
                      ? `${addCustomWidth} x ${addCustomHeight} cm`
                      : `${preset.widthCm} x ${preset.heightCm} cm`
                    }
                  </div>
                </button>
              ))}
            </div>

            {/* Polaroid Preset Configuration Controls */}
            {addSizePreset.startsWith('polaroid-') && (
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
                    value={addPolaroidCaption}
                    onChange={(e) => setAddPolaroidCaption(e.target.value)}
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
                      onClick={() => setAddPolaroidFont('handwritten')}
                      className={`p-2 rounded-xl border text-center transition duration-150 flex flex-col items-center justify-center ${
                        addPolaroidFont === 'handwritten'
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
                      onClick={() => setAddPolaroidFont('sans')}
                      className={`p-2 rounded-xl border text-center transition duration-150 flex flex-col items-center justify-center ${
                        addPolaroidFont === 'sans'
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
                      onClick={() => setAddPolaroidFont('typewriter')}
                      className={`p-2 rounded-xl border text-center transition duration-150 flex flex-col items-center justify-center ${
                        addPolaroidFont === 'typewriter'
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

            {/* Custom Inputs Panel */}
            {addSizePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-3 p-3 mb-3 bg-slate-950/20 border border-slate-800/40 rounded-lg">
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Lebar (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="21.0"
                    value={addCustomWidth}
                    onChange={(e) => setAddCustomWidth(e.target.value)}
                    className="w-full text-xs bg-transparent border border-slate-700 rounded p-1 text-center text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Tinggi (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="29.7"
                    value={addCustomHeight}
                    onChange={(e) => setAddCustomHeight(e.target.value)}
                    className="w-full text-xs bg-transparent border border-slate-700 rounded p-1 text-center text-slate-100 font-mono"
                  />
                </div>
              </div>
            )}

            {/* Filter Latar Belakang & Grayscale */}
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

            {/* Quantity Slider */}
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

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAddToCanvas}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg font-semibold text-xs transition duration-150 flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/10"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambahkan ({addQuantity}x)
              </button>

              <button
                onClick={handleAutoFillPage}
                className={`w-full py-2.5 px-3 border rounded-lg font-semibold text-xs transition duration-150 flex items-center justify-center gap-1.5 ${
                  theme === 'dark'
                    ? 'border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-200'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                }`}
                title="Memaksimalkan penempatan sisa ruang pada 1 lembar kertas A4"
              >
                <Layers className="w-3.5 h-3.5" />
                Penuhi Kertas
              </button>
            </div>
          </section>

          {/* STEP 3: CONTEXTUAL SLOT EDITOR */}
          {activeSlot ? (
            <section className={`mb-6 p-4 rounded-xl border-2 ${
              theme === 'dark' ? 'bg-[#0f172a] border-blue-500/40' : 'bg-blue-50/20 border-blue-500/30'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-blue-500 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 shrink-0" />
                  Edit Cetakan Terpilih
                </h2>
                <button
                  onClick={() => setSelectedSlotId(null)}
                  className="text-neutral-400 hover:text-neutral-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Show item mini summary */}
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
                      src={uploadedImages.find(i => i.id === activeSlot.imageId)?.src}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{
                        filter: `grayscale(${activeSlot.isGrayscale ? 1 : 0}) brightness(${activeSlot.brightness}) contrast(${activeSlot.contrast}) saturate(${activeSlot.saturation ?? 1.0})`,
                        backgroundColor: activeSlot.bgColor
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
                    Edit mode aktif (geser slider di bawah)
                  </div>
                </div>
              </div>

              {/* Rotation & Duplicate/Delete quick block */}
              <div className="grid grid-cols-3 gap-1.5 mb-4">
                <button
                  onClick={() => handleRotateSlot(activeSlot.id)}
                  className={`p-2 rounded border text-[11px] font-semibold flex items-center justify-center gap-1 transition ${
                    theme === 'dark' ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <RotateCw className="w-3 h-3" />
                  Putar 90°
                </button>
                <button
                  onClick={() => handleDuplicateSlot(activeSlot.id)}
                  className={`p-2 rounded border text-[11px] font-semibold flex items-center justify-center gap-1 transition ${
                    theme === 'dark' ? 'border-slate-800 bg-slate-900/60 hover:bg-slate-900 text-slate-300' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Copy className="w-3 h-3" />
                  Duplikat
                </button>
                <button
                  onClick={() => handleDeleteSlot(activeSlot.id)}
                  className="p-2 rounded bg-red-600/10 border border-red-500/20 text-red-500 text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-red-600/20 transition"
                >
                  <Trash2 className="w-3 h-3" />
                  Hapus
                </button>
              </div>

              {/* DYNAMIC FRAME TYPE SWITCHER (NORMAL VS POLAROID) */}
              <div className="mb-4">
                <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1.5">Tipe Bingkai Cetak</label>
                <div className="flex p-1 bg-black/20 rounded-lg border border-slate-800/80">
                  <button
                    onClick={() => {
                      updateSelectedSlot((s) => ({ ...s, isPolaroid: false }));
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, isPolaroid: false } : s);
                      saveToHistory(updated);
                      showToast("Bingkai cetak diubah ke Normal.");
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
                      updateSelectedSlot((s) => ({ 
                        ...s, 
                        isPolaroid: true,
                        polaroidCaption: s.polaroidCaption || 'Memory ✨',
                        polaroidFont: s.polaroidFont || 'handwritten'
                      }));
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { 
                        ...s, 
                        isPolaroid: true,
                        polaroidCaption: s.polaroidCaption || 'Memory ✨',
                        polaroidFont: s.polaroidFont || 'handwritten'
                      } : s);
                      saveToHistory(updated);
                      showToast("Bingkai cetak diubah ke Polaroid.");
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

              {/* CONTEXTUAL POLAROID TEXT CONTROLS */}
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
                        updateSelectedSlot((s) => ({ ...s, polaroidCaption: val }));
                      }}
                      onBlur={() => saveToHistory(canvasSlots)} // commit to history when they stop editing text field
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
                          updateSelectedSlot((s) => ({ ...s, polaroidFont: val }));
                          const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, polaroidFont: val } : s);
                          saveToHistory(updated);
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
                          updateSelectedSlot((s) => ({ ...s, polaroidFont: val }));
                          const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, polaroidFont: val } : s);
                          saveToHistory(updated);
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
                          updateSelectedSlot((s) => ({ ...s, polaroidFont: val }));
                          const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, polaroidFont: val } : s);
                          saveToHistory(updated);
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

              {/* Image Fine Tuning Sliders with Instant Scrubbing + History Commit on release */}
              <div className="space-y-3">
                {/* ZOOM SLIDER */}
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
                      updateSelectedSlot((s) => ({ ...s, zoom: val }));
                    }}
                    onMouseUp={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, zoom: val } : s);
                      saveToHistory(updated);
                    }}
                    onTouchEnd={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, zoom: val } : s);
                      saveToHistory(updated);
                    }}
                    className="w-full accent-blue-500 h-1 cursor-pointer"
                  />
                </div>

                {/* OFFSET X (PANNING) */}
                <div>
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
                      updateSelectedSlot((s) => ({ ...s, offsetX: val }));
                    }}
                    onMouseUp={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, offsetX: val } : s);
                      saveToHistory(updated);
                    }}
                    onTouchEnd={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, offsetX: val } : s);
                      saveToHistory(updated);
                    }}
                    className="w-full accent-blue-500 h-1 cursor-pointer"
                  />
                </div>

                {/* OFFSET Y (PANNING) */}
                <div>
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
                      updateSelectedSlot((s) => ({ ...s, offsetY: val }));
                    }}
                    onMouseUp={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, offsetY: val } : s);
                      saveToHistory(updated);
                    }}
                    onTouchEnd={(e) => {
                      const val = parseInt((e.target as HTMLInputElement).value);
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, offsetY: val } : s);
                      saveToHistory(updated);
                    }}
                    className="w-full accent-blue-500 h-1 cursor-pointer"
                  />
                </div>

                {/* BRIGHTNESS */}
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
                      updateSelectedSlot((s) => ({ ...s, brightness: val }));
                    }}
                    onMouseUp={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, brightness: val } : s);
                      saveToHistory(updated);
                    }}
                    onTouchEnd={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, brightness: val } : s);
                      saveToHistory(updated);
                    }}
                    className="w-full h-1 accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* CONTRAST */}
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
                      updateSelectedSlot((s) => ({ ...s, contrast: val }));
                    }}
                    onMouseUp={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, contrast: val } : s);
                      saveToHistory(updated);
                    }}
                    onTouchEnd={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, contrast: val } : s);
                      saveToHistory(updated);
                    }}
                    className="w-full h-1 accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* SATURATION */}
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
                      updateSelectedSlot((s) => ({ ...s, saturation: val }));
                    }}
                    onMouseUp={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, saturation: val } : s);
                      saveToHistory(updated);
                    }}
                    onTouchEnd={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, saturation: val } : s);
                      saveToHistory(updated);
                    }}
                    className="w-full h-1 accent-blue-500 cursor-pointer"
                  />
                </div>

                {/* INDIVIDUAL BACKGROUND COLOR replacement (Hidden for polaroids since they always have white canvas frame backgrounds) */}
                {!activeSlot.isPolaroid && (
                  <div>
                    <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                      Ganti Latar Foto Khusus Slot Ini
                    </label>
                    <select
                      value={activeSlot.bgColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateSelectedSlot((s) => ({ ...s, bgColor: val }));
                        const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, bgColor: val } : s);
                        saveToHistory(updated); // Save to history instantly on select dropdown changes!
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

                {/* INDIVIDUAL GRAYSCALE */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-neutral-400 font-medium">Format Hitam Putih (B&W)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activeSlot.isGrayscale}
                      onChange={(e) => {
                        const val = e.target.checked;
                        updateSelectedSlot((s) => ({ ...s, isGrayscale: val }));
                        const updated = canvasSlots.map((s) => s.id === activeSlot.id ? { ...s, isGrayscale: val } : s);
                        saveToHistory(updated); // Save to history instantly on checkbox changes!
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            </section>
          ) : (
            <div className={`p-4 rounded-xl border border-dashed mb-6 text-center text-xs text-neutral-500 leading-relaxed ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <Eye className="w-4 h-4 mx-auto mb-1.5 text-neutral-600" />
              Tip: Klik pada salah satu foto di lembar kerja kanan untuk mengaktifkan editor pembesaran, penggeseran (pan), kecerahan, dan penggantian warna latar belakang foto secara instan!
            </div>
          )}

          {/* STEP 3: GLOBAL PAGE SETUP (PAPER OPTIONS & SCRAP PAPER) */}
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

              {/* PAPER SIZE SELECTOR (A4 STANDAR VS KERTAS SISA CETAK) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] text-neutral-400 uppercase font-bold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    Ukuran Lembar Kertas
                  </label>
                  {isScrapPaper && (
                    <button
                      type="button"
                      onClick={() => handleSelectPaperPreset('a4-full')}
                      className="text-[10px] text-blue-400 hover:text-blue-300 transition flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      Reset A4 Penuh
                    </button>
                  )}
                </div>

                <select
                  value={paperPresetId}
                  onChange={(e) => handleSelectPaperPreset(e.target.value)}
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

              {/* CUSTOM SCRAP PAPER INPUTS */}
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
                      <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                        Lebar (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="2.0"
                        max={orientation === 'portrait' ? 21.0 : 29.7}
                        value={customPaperWidthCm}
                        onChange={(e) => handleCustomPaperDimensionChange('width', e.target.value)}
                        className={`w-full text-xs rounded border p-1.5 text-center font-mono font-bold ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-700 text-amber-300' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                      <span className="text-[9px] text-neutral-500 block text-center mt-0.5">
                        Maks. {orientation === 'portrait' ? '21.0' : '29.7'} cm
                      </span>
                    </div>

                    <div>
                      <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">
                        Tinggi (cm)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="2.0"
                        max={orientation === 'portrait' ? 29.7 : 21.0}
                        value={customPaperHeightCm}
                        onChange={(e) => handleCustomPaperDimensionChange('height', e.target.value)}
                        className={`w-full text-xs rounded border p-1.5 text-center font-mono font-bold ${
                          theme === 'dark' ? 'bg-slate-900 border-slate-700 text-amber-300' : 'bg-white border-slate-300 text-slate-800'
                        }`}
                      />
                      <span className="text-[9px] text-neutral-500 block text-center mt-0.5">
                        Maks. {orientation === 'portrait' ? '29.7' : '21.0'} cm
                      </span>
                    </div>
                  </div>

                  {/* QUICK SCRAP PRESET SHORTCUTS */}
                  <div className="pt-1">
                    <span className="text-[9px] text-neutral-400 uppercase font-bold block mb-1">Potongan Cepat Sisa:</span>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomPaperWidthCm(14.8);
                          setCustomPaperHeightCm(21.0);
                          showToast("Potongan 1/2 A4 (A5) dipilih.");
                        }}
                        className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-center truncate font-medium transition cursor-pointer"
                      >
                        1/2 A4 (A5)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomPaperWidthCm(10.5);
                          setCustomPaperHeightCm(14.8);
                          showToast("Potongan 1/4 A4 (A6) dipilih.");
                        }}
                        className="py-1 px-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-center truncate font-medium transition cursor-pointer"
                      >
                        1/4 A4 (A6)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomPaperWidthCm(10.2);
                          setCustomPaperHeightCm(15.2);
                          showToast("Potongan sisa foto 4R dipilih.");
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

              {/* VISUAL DIAGRAM & EFFICIENCY CARD */}
              <div className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                isScrapPaper 
                  ? (theme === 'dark' ? 'bg-amber-950/15 border-amber-900/30' : 'bg-amber-50/40 border-amber-200/60')
                  : (theme === 'dark' ? 'bg-slate-950/30 border-slate-800' : 'bg-slate-50 border-slate-200')
              }`}>
                {/* Mini proportional A4 ghost thumbnail */}
                <div 
                  className="relative w-11 h-15 bg-slate-800/80 border border-dashed border-slate-600 rounded flex items-center justify-center shrink-0 overflow-hidden"
                  title="Ilustrasi proporsi sisa kertas terhadap lembar A4 utuh"
                >
                  <span className="text-[8px] text-neutral-500 font-bold uppercase select-none">A4</span>
                  {/* Active piece footprint */}
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
                      ({((effectivePaperWidthCm * effectivePaperHeightCm) / 623.7 * 100).toFixed(0)}% A4)
                    </span>
                  </p>
                  <div className="flex items-center gap-1 text-[10px] mt-1 text-emerald-400">
                    <Check className="w-3 h-3 shrink-0" />
                    <span>{isScrapPaper ? 'Hemat kertas • Memanfaatkan sisa cetak' : 'Lembar cetak standar utuh'}</span>
                  </div>
                </div>
              </div>
              
              {/* LAYOUT MODE SEGMENTED CONTROL */}
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1.5 flex items-center gap-1">
                  <Layout className="w-3.5 h-3.5 text-blue-500" />
                  Mode Tata Letak Foto
                </label>
                <div className="flex p-1 bg-black/20 rounded-lg border border-slate-800">
                  <button
                    onClick={() => handleSwitchLayoutMode('auto')}
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
                    onClick={() => handleSwitchLayoutMode('freeform')}
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
              </div>

              {/* SNAP-TO-GRID SETTINGS (Only shown if in Freeform mode) */}
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
                        onChange={(e) => {
                          setIsSnapToGrid(e.target.checked);
                          showToast(e.target.checked ? "Snap-to-Grid diaktifkan." : "Snap-to-Grid dinonaktifkan.");
                        }}
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
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setGridStepCm(val);
                            showToast(`Langkah grid diatur ke ${val} cm.`);
                          }}
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
                            onChange={(e) => setShowGridLines(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4.5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Orientation */}
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1.5">Orientasi Lembar Kertas</label>
                <div className="flex p-1 bg-black/20 rounded-lg border border-slate-800">
                  <button
                    onClick={() => handleSetOrientation('portrait')}
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
                    onClick={() => handleSetOrientation('landscape')}
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

              {/* Page Margin slider */}
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
                  onChange={(e) => setMarginCm(parseFloat(e.target.value))}
                  onMouseUp={(e) => {
                    const val = parseFloat((e.target as HTMLInputElement).value);
                    saveToHistory(canvasSlots, orientation, val, gapCm, borderStyle);
                  }}
                  onTouchEnd={(e) => {
                    const val = parseFloat((e.target as HTMLInputElement).value);
                    saveToHistory(canvasSlots, orientation, val, gapCm, borderStyle);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-neutral-500 mt-0.5">
                  <span>0.2 cm (Sempit)</span>
                  <span>1.0 cm (Standar)</span>
                  <span>2.5 cm (Lebar)</span>
                </div>
              </div>

              {/* Photos Gap Slider (Only applicable/shown if in auto layout mode) */}
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
                    onChange={(e) => setGapCm(parseFloat(e.target.value))}
                    onMouseUp={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      saveToHistory(canvasSlots, orientation, marginCm, val, borderStyle);
                    }}
                    onTouchEnd={(e) => {
                      const val = parseFloat((e.target as HTMLInputElement).value);
                      saveToHistory(canvasSlots, orientation, marginCm, val, borderStyle);
                    }}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-neutral-500 mt-0.5">
                    <span>Rapat (0 cm)</span>
                    <span>Sedang (0.2 cm)</span>
                    <span>Lebar (1.5 cm)</span>
                  </div>
                </div>
              )}

              {/* Border Cut Line Style */}
              <div>
                <label className="block text-[10px] text-neutral-400 uppercase font-bold mb-1">Garis Panduan Potong Gunting</label>
                <select
                  value={borderStyle}
                  onChange={(e) => handleSetBorderStyle(e.target.value as any)}
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

          {/* RESET & CLEAR OPERATIONS */}
          <section className="pt-4 border-t border-slate-800/80 flex gap-2.5">
            <button
              onClick={handleQuickClearCanvas}
              disabled={canvasSlots.length === 0}
              className={`flex-1 py-2 rounded-lg font-semibold text-xs transition duration-150 flex items-center justify-center gap-1.5 ${
                canvasSlots.length === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-900 border border-slate-800 text-neutral-500'
                  : 'bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-500 active:scale-95'
              }`}
              title="Kosongkan seluruh foto di canvas secara cepat (Shift + Delete)"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Kosongkan Cepat
            </button>

            <button
              onClick={handleResetSettings}
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

        {/* WORKSPACE PREVIEW (RIGHT MAIN AREA) */}
        <main className={`flex-1 p-6 flex flex-col items-center justify-between overflow-x-auto min-h-0 ${
          theme === 'dark' ? 'bg-[#0b0e17] studio-grid-dot' : 'bg-slate-100 studio-grid-dot'
        }`}>
          
          {/* Top Panel Controls for Canvas Scale and Stats */}
          <div className={`w-full max-w-4xl no-print flex flex-col sm:flex-row items-center justify-between gap-4 p-3.5 rounded-xl border mb-6 transition-colors duration-200 ${
            theme === 'dark' ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-blue-500" />
                <span className="font-semibold">Kapasitas:</span>
                <span className={`px-2 py-0.5 rounded font-bold ${theme === 'dark' ? 'bg-slate-950 text-emerald-400' : 'bg-slate-100 text-emerald-600'}`}>
                  {canvasSlots.length} foto
                </span>
                {canvasSlots.length > 0 && (
                  <button
                    onClick={handleQuickClearCanvas}
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 transition active:scale-95 cursor-pointer ml-1"
                    title="Kosongkan seluruh foto di kanvas secara cepat (Shift + Delete)"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Kosongkan</span>
                  </button>
                )}
              </div>
              <div aria-hidden="true" className="hidden sm:inline text-neutral-600">|</div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-500" />
                <span>Total:</span>
                <span className="font-bold text-slate-200 dark:text-slate-100 bg-neutral-900/50 px-2 py-0.5 rounded">
                  {paginatedPages.length} Lembar A4
                </span>
              </div>
            </div>

            {/* Canvas Zoomer Interface Slider */}
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setCanvasZoom(prev => Math.max(25, prev - 5))}
                className="p-1.5 rounded hover:bg-slate-800/80 transition text-neutral-400"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold text-neutral-400 min-w-[36px] text-center">
                {canvasZoom}%
              </span>
              <input
                type="range"
                min="25"
                max="120"
                step="5"
                value={canvasZoom}
                onChange={(e) => setCanvasZoom(parseInt(e.target.value))}
                className="w-24 sm:w-32 accent-blue-600 cursor-pointer h-1"
                title="Atur Skala Pratinjau Layar"
              />
              <button 
                onClick={() => setCanvasZoom(prev => Math.min(120, prev + 5))}
                className="p-1.5 rounded hover:bg-slate-800/80 transition text-neutral-400"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCanvasZoom(55)}
                className={`px-2 py-1 rounded text-[10px] font-semibold transition ${
                  theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                Fit
              </button>
            </div>
          </div>

          {/* SCROLLABLE CONTAINER FOR A4 SHEETS */}
          {canvasSlots.length > 0 ? (
            <div className="flex flex-col items-center gap-8 py-2 pb-16 w-full">
              {paginatedPages.map((pageSlots, pageIndex) => (
                <div key={pageIndex} className="flex flex-col items-center gap-2.5">
                  
                  {/* Digital Sheet Index Header */}
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

                  {/* PROPORTIONAL SHEET PREVIEW CARD */}
                  <div 
                    style={{ 
                      width: `${effectivePaperWidthCm * (canvasZoom / 100)}cm`,
                      height: `${effectivePaperHeightCm * (canvasZoom / 100)}cm`,
                      transition: 'width 0.2s ease, height 0.2s ease',
                    }}
                    className="studio-canvas-shadow border border-neutral-300 dark:border-slate-800 bg-white rounded-sm overflow-hidden shrink-0 relative"
                  >
                    {/* Native CSS scaling container inside */}
                    <div 
                      className="origin-top-left transition-all bg-white select-none"
                      style={{
                        transform: `scale(${canvasZoom / 100})`,
                        width: `${effectivePaperWidthCm}cm`,
                        height: `${effectivePaperHeightCm}cm`,
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
                        {/* GORGEOUS BLUE CENTIMETER SNAPPING GRID LINES OVERLAY */}
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

                        {pageSlots.map((slot) => {
                          const isRotated90 = slot.rotate === 90 || slot.rotate === 270;
                          const image = uploadedImages.find((img) => img.id === slot.imageId);
                          const imageSrc = image ? image.src : '';

                          const isCurrentlyDragged = dragState?.slotId === slot.id;

                          // Compute outer card styling properties
                          const cardWidth = isRotated90 ? `${slot.heightCm}cm` : `${slot.widthCm}cm`;
                          const cardHeight = isRotated90 ? `${slot.widthCm}cm` : `${slot.heightCm}cm`;

                          return (
                            <div
                              key={slot.id}
                              className={`cursor-pointer group transition-all select-none ${
                                selectedSlotId === slot.id
                                  ? 'ring-2 ring-blue-500 ring-offset-1 shadow-lg scale-[1.01] z-30'
                                  : 'hover:ring-1 hover:ring-blue-400 hover:shadow-sm z-20'
                              } ${isCurrentlyDragged ? 'opacity-85 z-40 shadow-2xl' : ''}`}
                              style={{
                                width: cardWidth,
                                height: cardHeight,
                                // Polaroid templates always have a solid opaque white backing frame
                                backgroundColor: slot.isPolaroid ? '#ffffff' : (slot.bgColor === 'transparent' ? '#ffffff' : slot.bgColor),
                                boxSizing: 'border-box',
                                overflow: 'hidden',
                                
                                // Position based on layout mode (flex wrap vs absolute freeform dragging)
                                position: layoutMode === 'auto' ? 'relative' : 'absolute',
                                left: layoutMode === 'auto' ? undefined : `${slot.xCm !== undefined ? slot.xCm : marginCm}cm`,
                                top: layoutMode === 'auto' ? undefined : `${slot.yCm !== undefined ? slot.yCm : marginCm}cm`,
                                
                                cursor: layoutMode === 'freeform' 
                                  ? (isCurrentlyDragged ? 'grabbing' : 'grab') 
                                  : 'pointer',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSlotId(slot.id);
                              }}
                              onMouseDown={(e) => {
                                if (layoutMode === 'freeform') {
                                  handleMouseDown(e, slot, pageIndex);
                                }
                              }}
                            >
                              {/* RENDER BODY VIEWPORT (POLAROID FRAME VS STANDARD VIEWPORT) */}
                              {slot.isPolaroid ? (() => {
                                const geo = getPolaroidGeometry(slot.widthCm, slot.heightCm);
                                return (
                                  /* --- POLAROID HOUSING VIEWPORT --- */
                                  <div className="w-full h-full relative overflow-hidden bg-white">
                                    {/* Inner Photo Window */}
                                    <div 
                                      className="absolute overflow-hidden bg-neutral-100 border border-neutral-100/40"
                                      style={{
                                        top: `${geo.top}cm`,
                                        left: `${geo.left}cm`,
                                        right: `${geo.right}cm`,
                                        bottom: `${geo.bottom}cm`,
                                      }}
                                    >
                                      {imageSrc ? (
                                        <div 
                                          className="absolute"
                                          style={{
                                            width: `${slot.widthCm - (geo.left + geo.right)}cm`,
                                            height: `${slot.heightCm - (geo.top + geo.bottom)}cm`,
                                            top: '50%',
                                            left: '50%',
                                            transform: `translate(-50%, -50%) rotate(${slot.rotate}deg) scale(${slot.zoom}) translate(${slot.offsetX}%, ${slot.offsetY}%)`,
                                            transformOrigin: 'center center',
                                            transition: isCurrentlyDragged ? 'none' : 'transform 0.15s ease-out',
                                          }}
                                        >
                                          <img
                                            src={imageSrc}
                                            alt=""
                                            className="w-full h-full object-cover select-none pointer-events-none"
                                            style={{
                                              filter: `grayscale(${slot.isGrayscale ? 1 : 0}) brightness(${slot.brightness}) contrast(${slot.contrast}) saturate(${slot.saturation ?? 1.0})`,
                                            }}
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400">Empty</div>
                                      )}
                                    </div>

                                    {/* Polaroid Caption Handwriting Text Overlay */}
                                    <div 
                                      className="absolute inset-x-2 text-center flex items-center justify-center pointer-events-none select-none text-neutral-950"
                                      style={{ 
                                        height: `${geo.bottom - 0.5}cm`,
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
                                );
                              })() : (
                                /* --- NORMAL PRINT VIEWPORT --- */
                                <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: slot.bgColor }}>
                                  {imageSrc ? (
                                    <div 
                                      className="absolute"
                                      style={{
                                        // Lay out with original physical centimeter dimensions before rotation
                                        width: `${slot.widthCm}cm`,
                                        height: `${slot.heightCm}cm`,
                                        top: '50%',
                                        left: '50%',
                                        // Center, then rotate, scale, and pan offset
                                        transform: `translate(-50%, -50%) rotate(${slot.rotate}deg) scale(${slot.zoom}) translate(${slot.offsetX}%, ${slot.offsetY}%)`,
                                        transformOrigin: 'center center',
                                        transition: isCurrentlyDragged ? 'none' : 'transform 0.15s ease-out',
                                      }}
                                    >
                                      <img
                                        src={imageSrc}
                                        alt="Foto"
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

                              {/* Cutting Border overlay styles */}
                              {borderStyle === 'solid' && (
                                <div className="absolute inset-0 border-[0.3px] border-neutral-400 pointer-events-none" />
                              )}
                              {borderStyle === 'dotted' && (
                                <div className="absolute inset-0 border-[0.5px] border-dotted border-black pointer-events-none" />
                              )}
                              {borderStyle === 'crop' && (
                                <div className="absolute inset-0 pointer-events-none">
                                  {/* Corner hairline crosshairs */}
                                  <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-neutral-500" />
                                  <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-neutral-500" />
                                  <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-neutral-500" />
                                  <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-neutral-500" />
                                </div>
                              )}

                              {/* Corner measurement badge on screen hover */}
                              <div className="absolute bottom-0.5 right-0.5 bg-neutral-900/85 text-[8px] font-mono font-semibold text-white px-1 py-0.2 rounded select-none opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                {slot.widthCm}x{slot.heightCm} cm {slot.isPolaroid ? '(Polaroid)' : ''}
                              </div>

                              {/* On-screen hover quick utilities overlay */}
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
                                    handleRotateSlot(slot.id);
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
                                    handleDuplicateSlot(slot.id);
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
                                    handleDeleteSlot(slot.id);
                                  }}
                                  className="p-0.5 bg-red-600/90 hover:bg-red-600 text-white rounded transition"
                                  title="Hapus"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Empty space indicator inside preview */}
                  <div className="text-[10px] text-neutral-400 font-mono italic">
                    Halaman ini menampung {pageSlots.length} foto cetak.
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* EMPTY WORKSPACE ILLUSTRATION */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 max-w-lg my-auto">
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
                    onClick={triggerFileSelect}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    Unggah Foto Sekarang
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCanvas}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Tambahkan Foto ke Lembar
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bottom simple footer status info */}
          <footer className="w-full text-center mt-6 text-[10px] text-neutral-500 no-print flex items-center justify-center gap-2">
            <span>Didesain oleh UI/UX Studio</span>
            <span>·</span>
            <span>Garis potong presisi centimeter didukung oleh browser hardware layout engine</span>
            <span>·</span>
            <span>© 2026 PrintA4</span>
          </footer>
        </main>
      </div>

      {/* STATIC PRINT OUT CONTAINER (HIDDEN ON SCREEN PREVIEW) */}
      {/* This renders 100% full scale print sheets. Under @media print, everything else is hidden, and this is displayed */}
      <div id="print-area" className="hidden print:block bg-white text-black">
        {paginatedPages.map((pageSlots, pageIndex) => (
          <div 
            key={`print-page-${pageIndex}`}
            className="print-page-sheet bg-white text-black relative"
            style={{
              padding: layoutMode === 'auto' ? `${marginCm}cm` : '0cm',
              gap: layoutMode === 'auto' ? `${gapCm}cm` : '0cm',
              display: layoutMode === 'auto' ? 'flex' : 'block',
              flexWrap: layoutMode === 'auto' ? 'wrap' : undefined,
              alignContent: layoutMode === 'auto' ? 'flex-start' : undefined,
              width: `${effectivePaperWidthCm}cm`,
              height: `${effectivePaperHeightCm}cm`,
              boxSizing: 'border-box',
            }}
          >
            {pageSlots.map((slot) => {
              const isRotated90 = slot.rotate === 90 || slot.rotate === 270;
              const image = uploadedImages.find((img) => img.id === slot.imageId);
              const imageSrc = image ? image.src : '';

              const cardWidth = isRotated90 ? `${slot.heightCm}cm` : `${slot.widthCm}cm`;
              const cardHeight = isRotated90 ? `${slot.widthCm}cm` : `${slot.heightCm}cm`;

              return (
                <div
                  key={`print-slot-${slot.id}`}
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    backgroundColor: slot.isPolaroid ? '#ffffff' : (slot.bgColor === 'transparent' ? '#ffffff' : slot.bgColor),
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    
                    position: layoutMode === 'auto' ? 'relative' : 'absolute',
                    left: layoutMode === 'auto' ? undefined : `${slot.xCm !== undefined ? slot.xCm : marginCm}cm`,
                    top: layoutMode === 'auto' ? undefined : `${slot.yCm !== undefined ? slot.yCm : marginCm}cm`,
                    
                    flexShrink: 0,
                  }}
                >
                  {slot.isPolaroid ? (() => {
                    const geo = getPolaroidGeometry(slot.widthCm, slot.heightCm);
                    return (
                      /* --- PRINT POLAROID BLOCK --- */
                      <div className="w-full h-full relative overflow-hidden bg-white">
                        {/* Photo border gap */}
                        <div 
                          className="absolute overflow-hidden bg-neutral-100 border border-neutral-100/40"
                          style={{
                            top: `${geo.top}cm`,
                            left: `${geo.left}cm`,
                            right: `${geo.right}cm`,
                            bottom: `${geo.bottom}cm`,
                          }}
                        >
                          {imageSrc && (
                            <div 
                              className="absolute"
                              style={{
                                width: `${slot.widthCm - (geo.left + geo.right)}cm`,
                                height: `${slot.heightCm - (geo.top + geo.bottom)}cm`,
                                top: '50%',
                                left: '50%',
                                transform: `translate(-50%, -50%) rotate(${slot.rotate}deg) scale(${slot.zoom}) translate(${slot.offsetX}%, ${slot.offsetY}%)`,
                                transformOrigin: 'center center',
                              }}
                            >
                              <img
                                src={imageSrc}
                                alt=""
                                className="w-full h-full object-cover"
                                style={{
                                  filter: `grayscale(${slot.isGrayscale ? 1 : 0}) brightness(${slot.brightness}) contrast(${slot.contrast}) saturate(${slot.saturation ?? 1.0})`,
                                }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Polaroid text signature */}
                        <div 
                          className="absolute inset-x-2 text-center flex items-center justify-center text-neutral-950"
                          style={{ 
                            height: `${geo.bottom - 0.5}cm`,
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
                    );
                  })() : (
                    /* --- PRINT NORMAL BLOCK --- */
                    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: slot.bgColor }}>
                      {imageSrc && (
                        <div 
                          className="absolute"
                          style={{
                            width: `${slot.widthCm}cm`,
                            height: `${slot.heightCm}cm`,
                            top: '50%',
                            left: '50%',
                            transform: `translate(-50%, -50%) rotate(${slot.rotate}deg) scale(${slot.zoom}) translate(${slot.offsetX}%, ${slot.offsetY}%)`,
                            transformOrigin: 'center center',
                          }}
                        >
                          <img
                            src={imageSrc}
                            alt=""
                            className="w-full h-full object-cover"
                            style={{
                              filter: `grayscale(${slot.isGrayscale ? 1 : 0}) brightness(${slot.brightness}) contrast(${slot.contrast}) saturate(${slot.saturation ?? 1.0})`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cut Lines on printer output */}
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
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* HELP & PRINT SETTINGS EXPLANATORY MODAL (no-print) */}
      {showHelpModal && (
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
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-neutral-400 hover:text-neutral-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed mb-4">
              Browser modern dapat mencetak ukuran fisik cm secara 100% presisi asalkan opsi penskalaan dinonaktifkan di jendela dialog cetak printer Anda. Silakan ikuti instruksi berikut:
            </p>

            <div className="space-y-4 text-xs leading-relaxed">
              
              {/* Point 1 */}
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

              {/* Point 2 */}
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

              {/* Point 3 */}
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

              {/* Point 4 */}
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

              {/* Keyboard Shortcuts Section */}
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

              {/* Tips for Linux users */}
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
                onClick={() => setShowHelpModal(false)}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition"
              >
                Saya Mengerti & Siap Mencetak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT & EXPORT HUB MODAL */}
      {showPrintModal && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[92vh] transition-colors border ${
            theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-950'
          }`}>
            {/* Header */}
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
                onClick={() => setShowPrintModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-neutral-400 hover:text-neutral-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status Bar */}
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

            {/* Scrap Paper Tip Banner */}
            {isScrapPaper && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2 mb-4 leading-relaxed">
                <Scissors className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong className="block text-amber-200 font-semibold mb-0.5">Panduan Memasukkan Kertas Sisa ke Printer:</strong>
                  Masukkan potongan kertas sisa Anda ({effectivePaperWidthCm.toFixed(1)} × {effectivePaperHeightCm.toFixed(1)} cm) ke baki printer (rear feeder / bypass tray). Geser pemandu kertas (paper guides) printer agar potongan kertas terjepit lurus tanpa miring.
                </div>
              </div>
            )}

            {/* Print Options Cards */}
            <div className="space-y-4">
              
              {/* OPSI 1: CETAK PRINTER LANGSUNG */}
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
                    onClick={handleExecuteBrowserPrint}
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

              {/* OPSI 2: UNDUH GAMBAR SIAP CETAK 300 DPI (SANGAT REKOMENDASI UNTUK LINUX / CUPS) */}
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

                {/* Resolution selector */}
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

                {/* Download Buttons */}
                <div className="flex flex-wrap gap-2">
                  {paginatedPages.length > 1 && (
                    <button
                      onClick={() => handleDownloadAllPages(exportDpi)}
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
                      onClick={() => handleDownloadPage(idx, exportDpi)}
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
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-neutral-500">
              <span>Pencetakan skala 1:1 fisik bebas distorsi</span>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-neutral-300 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
