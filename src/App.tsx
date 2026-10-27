import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Upload, Printer, RotateCw, Trash2, Copy, Plus, RotateCcw, 
  Settings, Sun, Moon, HelpCircle, Check, Sparkles, Scale, 
  FileText, X, ChevronRight, Image as ImageIcon, AlertCircle,
  ZoomIn, ZoomOut, RefreshCw, Layers, Sliders, Layout, Monitor, Eye,
  Undo, Redo, Grid, Move, Download, FileDown, Scissors,
  Save, FolderOpen, FileText as FileTextIcon
} from 'lucide-react';
import { exportProject, parseProjectFile } from './utils/project';
import { getImageRotationFromFile } from './utils/exif';
import { exportToPDF, downloadPDF } from './utils/pdfExport';
import { computeCompactAutoLayoutCoords, paginateAutoLayout, paginateFreeformLayout, getPolaroidGeometry } from './utils/layout';
import { 
  PAPER_PRESETS, SIZE_PRESETS, BG_COLOR_OPTIONS, GRID_STEP_OPTIONS, 
  EXPORT_DPI_OPTIONS, BORDER_STYLE_OPTIONS, POLAROID_FONT_OPTIONS, 
  A4_WIDTH_CM, A4_HEIGHT_CM, MAX_HISTORY_STEPS 
} from './constants';
import type { 
  UploadedImage, PhotoSlot, PaperPreset, SizePreset, BgColorOption, 
  LayoutCoords, HistoryState, ToastMessage, DragState, PolaroidGeometry 
} from './types';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CanvasPreview } from './components/CanvasPreview';
import { HelpModal } from './components/HelpModal';
import { PrintModal } from './components/PrintModal';

// Hooks
import { useHistory, useImages, useCanvas, usePaper, useGrid, useUI } from './hooks';

const INITIAL_SLOTS: PhotoSlot[] = [];

const INITIAL_HISTORY_STATE: HistoryState = {
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
  const [borderStyle, setBorderStyle] = useState<'none' | 'solid' | 'dotted' | 'crop'>('crop');

  // Paper preset and scrap paper states
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
  const [canvasZoom, setCanvasZoom] = useState<number>(55);
  const [colorMode, setColorMode] = useState<'rgb' | 'cmyk'>('rgb');
  const [mobileWorkspaceTab, setMobileWorkspaceTab] = useState<'settings' | 'canvas'>('settings');

  // UI notification, print & help modal
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportDpi, setExportDpi] = useState<number>(300);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);
  const quickClearRef = useRef<() => void>(() => {});

  // Drag state for freeform canvas
  const [dragState, setDragState] = useState<DragState | null>(null);

  // --- UNDO / REDO STATE HISTORY SYSTEM ---
  const [history, setHistory] = useState<HistoryState[]>([INITIAL_HISTORY_STATE]);
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

    const nextState: HistoryState = {
      canvasSlots: JSON.parse(JSON.stringify(slotsToSave)),
      orientation: orientationToSave,
      marginCm: marginToSave,
      gapCm: gapToSave,
      borderStyle: borderStyleToSave,
      layoutMode: layoutModeToSave,
      paperPresetId: paperPresetToSave,
      customPaperWidthCm: customWToSave,
      customPaperHeightCm: customHToSave,
    };

    const trimmedIndex = Math.min(historyIndex, MAX_HISTORY_STEPS - 1);
    setHistory((prev) => {
      const cleanHistory = prev.slice(0, trimmedIndex + 1);
      if (cleanHistory.length >= MAX_HISTORY_STEPS) {
        cleanHistory.shift();
      }
      return [...cleanHistory, nextState];
    });

    setHistoryIndex((prevIndex) => {
      const nextIndex = Math.min(prevIndex + 1, MAX_HISTORY_STEPS - 1);
      return nextIndex;
    });
  };

  // Perform Undo Action
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      const targetState = history[prevIdx];

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
          redoRef.current();
        } else {
          e.preventDefault();
          undoRef.current();
        }
      } else if (hasModifier && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redoRef.current();
      } else if (
        (e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) ||
        (e.altKey && e.key === 'Backspace') ||
        (hasModifier && e.shiftKey && e.key.toLowerCase() === 'x')
      ) {
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

      const pxPerCm = 37.79527559 * (canvasZoom / 100);
      const deltaXCms = deltaX / pxPerCm;
      const deltaYCms = deltaY / pxPerCm;

      let newX = dragState.startSlotX + deltaXCms;
      let newY = dragState.startSlotY + deltaYCms;

      if (isSnapToGrid) {
        newX = Math.round(newX / gridStepCm) * gridStepCm;
        newY = Math.round(newY / gridStepCm) * gridStepCm;
      }

      const targetSlot = canvasSlots.find((s) => s.id === dragState.slotId);
      if (targetSlot) {
        const isRotated90 = targetSlot.rotate === 90 || targetSlot.rotate === 270;
        const w = isRotated90 ? targetSlot.heightCm : targetSlot.widthCm;
        const h = isRotated90 ? targetSlot.widthCm : targetSlot.heightCm;

        const pW = effectivePaperWidthCm;
        const pH = effectivePaperHeightCm;

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
        saveToHistory(canvasSlots);
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

  // Handle switching between Auto-flow and Freeform layouts
  const handleSwitchLayoutMode = (newMode: 'auto' | 'freeform') => {
    if (newMode === layoutMode) return;
    
    if (newMode === 'freeform') {
      const pW = effectivePaperWidthCm;
      const pH = effectivePaperHeightCm;
      
      const computedCoords = computeCompactAutoLayoutCoords(canvasSlots, pW, pH, marginCm, gapCm);
      
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
      const pW = effectivePaperWidthCm;
      const pH = effectivePaperHeightCm;
      const computedCoords = computeCompactAutoLayoutCoords(canvasSlots, pW, pH, marginCm, gapCm);
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
      setLayoutMode('auto');
      saveToHistory(updatedSlots, orientation, marginCm, gapCm, borderStyle, 'auto');
      showToast("Tata Letak Otomatis Aktif: Foto tersusun rapat dan ruang kosong disesuaikan.");
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

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      uploadedImages.forEach((img) => {
        if (img.objectUrl) URL.revokeObjectURL(img.objectUrl);
      });
    };
  }, []);

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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((file) => file.type.startsWith('image/'));
      e.target.value = '';
      const newImages: UploadedImage[] = [];

      for (const file of files) {
        const objectUrl = URL.createObjectURL(file);
        const exifRotation = await getImageRotationFromFile(file);
        
        newImages.push({
          id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: file.name.length > 25 ? file.name.substring(0, 22) + '...' : file.name,
          src: objectUrl,
          objectUrl,
          file,
          exifRotation,
        });
      }

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

  const createSlotsForImages = (imageIds: string[], copiesPerImage: number): PhotoSlot[] => {
    const { w, h } = getPresetDimensions(addSizePreset);
    const isPolaroidPreset = addSizePreset.startsWith('polaroid-');
    const isBorderlessA4 = addSizePreset === 'a4-borderless';
    const pageIndex = isBorderlessA4 && canvasSlots.length > 0 ? paginatedPages.length : Math.max(paginatedPages.length - 1, 0);
    const newSlots: PhotoSlot[] = [];

    imageIds.forEach((imageId) => {
      const image = uploadedImages.find((item) => item.id === imageId);
      const exifRotation = (image?.exifRotation || 0) as PhotoSlot['rotate'];

      for (let copyIndex = 0; copyIndex < copiesPerImage; copyIndex++) {
        const cascadeOffset = newSlots.length * 0.5;
        newSlots.push({
          id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}-${newSlots.length}`,
          imageId,
          widthCm: w,
          heightCm: h,
          rotate: exifRotation,
          zoom: 1.0,
          offsetX: 0,
          offsetY: 0,
          bgColor: isPolaroidPreset ? 'transparent' : addBgColor,
          isGrayscale: addGrayscale,
          brightness: 1.0,
          contrast: 1.0,
          saturation: 1.0,
          xCm: layoutMode === 'freeform' ? (isBorderlessA4 ? 0 : marginCm + cascadeOffset) : undefined,
          yCm: layoutMode === 'freeform' ? (isBorderlessA4 ? 0 : marginCm + cascadeOffset) : undefined,
          pageIndex: layoutMode === 'freeform' ? pageIndex : undefined,
          isPolaroid: isPolaroidPreset,
          polaroidCaption: isPolaroidPreset ? addPolaroidCaption : undefined,
          polaroidFont: isPolaroidPreset ? addPolaroidFont : undefined,
        });
      }
    });

    return newSlots;
  };

  const commitAddedSlots = (newSlots: PhotoSlot[], message: string) => {
    const updated = [...canvasSlots, ...newSlots];
    const isBorderlessA4 = addSizePreset === 'a4-borderless';

    setCanvasSlots(updated);
    if (isBorderlessA4) {
      setMarginCm(0);
      setGapCm(0);
      setBorderStyle('none');
      saveToHistory(updated, orientation, 0, 0, 'none', layoutMode);
    } else {
      saveToHistory(updated);
    }

    setSelectedSlotId(newSlots[0]?.id || null);
    setMobileWorkspaceTab('canvas');
    showToast(message);
  };

  const handleSelectCanvasSlot = (id: string | null) => {
    setSelectedSlotId(id);
    if (id) setMobileWorkspaceTab('settings');
  };

  // Delete image from user's gallery
  const handleDeleteGalleryImage = (e: React.MouseEvent, imgId: string) => {
    e.stopPropagation();
    const imageToDelete = uploadedImages.find((img) => img.id === imgId);
    if (imageToDelete?.objectUrl) {
      URL.revokeObjectURL(imageToDelete.objectUrl);
    }
    
    const remaining = uploadedImages.filter((img) => img.id !== imgId);
    setUploadedImages(remaining);
    
    const updatedSlots = canvasSlots.filter((slot) => slot.imageId !== imgId);
    if (updatedSlots.length !== canvasSlots.length) {
      setCanvasSlots(updatedSlots);
      saveToHistory(updatedSlots);
      if (selectedSlotId && !updatedSlots.find((s) => s.id === selectedSlotId)) {
        setSelectedSlotId(null);
      }
    }
    
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

    const newSlots = createSlotsForImages([targetImageId], addQuantity);
    commitAddedSlots(newSlots, `Ditambahkan ${addQuantity} cetakan foto ke lembar kerja.`);
  };

  const handleAddAllImagesToCanvas = () => {
    if (uploadedImages.length === 0) {
      showToast('Silakan unggah foto ke galeri terlebih dahulu.');
      triggerFileSelect();
      return;
    }

    const newSlots = createSlotsForImages(uploadedImages.map((image) => image.id), 1);
    commitAddedSlots(newSlots, `Ditambahkan ${newSlots.length} foto dari galeri ke lembar kerja.`);
  };

  // Auto-fill remaining printable space
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

    const baseSize = getPresetDimensions(addSizePreset);
    const pW = effectivePaperWidthCm;
    const pH = effectivePaperHeightCm;
    const darkPad = Math.max(gapCm * 0.5, 0.1);
    const isPolaroidPreset = addSizePreset.startsWith('polaroid-');
    
    let pageIndex = 0;
    if (layoutMode === 'freeform') {
      const pageCounts = new Map<number, number>();
      canvasSlots.forEach((slot) => {
        const idx = slot.pageIndex ?? 0;
        pageCounts.set(idx, (pageCounts.get(idx) || 0) + 1);
      });
      pageIndex = [...pageCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
    } else {
      pageIndex = paginatedPages.length > 0 ? paginatedPages.length - 1 : 0;
    }

    const autoLayoutCoords = computeCompactAutoLayoutCoords(canvasSlots, effectivePaperWidthCm, effectivePaperHeightCm, marginCm, gapCm);
    
    const existingRects = (paginatedPages[pageIndex] || []).map((slot) => {
      const { w: rectW, h: rectH } = getSlotDimensions(slot);
      const coord = autoLayoutCoords.find((c) => c.id === slot.id);
      return {
        x: layoutMode === 'freeform' ? (slot.xCm ?? marginCm) : (coord?.xCm ?? marginCm),
        y: layoutMode === 'freeform' ? (slot.yCm ?? marginCm) : (coord?.yCm ?? marginCm),
        w: rectW,
        h: rectH,
      };
    });

    const overlapsWithPlaced = (x: number, y: number, w: number, h: number, placed: Array<{ x: number; y: number; w: number; h: number }>) => {
      const pad = darkPad;
      return [...existingRects, ...placed].some((rect) => {
        const x1 = x - pad;
        const y1 = y - pad;
        const x2 = x + w + pad;
        const y2 = y + h + pad;
        const r1 = rect.x - pad;
        const r1y = rect.y - pad;
        const r2 = rect.x + rect.w + pad;
        const r2y = rect.y + rect.h + pad;
        return x1 < r2 && x2 > r1 && y1 < r2y && y2 > r1y;
      });
    };

    const candidatePlacements: Array<{ x: number; y: number; w: number; h: number; rotation: number; widthCm: number; heightCm: number }> = [];
    const step = Math.max(0.2, gapCm);

    const iterateCandidates = (widthCm: number, heightCm: number, rotation: number) => {
      const boxW = rotation === 90 || rotation === 270 ? heightCm : widthCm;
      const boxH = rotation === 90 || rotation === 270 ? widthCm : heightCm;

      for (let y = marginCm; y + boxH <= pH - marginCm; y += step) {
        for (let x = marginCm; x + boxW <= pW - marginCm; x += step) {
          candidatePlacements.push({
            x,
            y,
            w: boxW,
            h: boxH,
            rotation,
            widthCm,
            heightCm,
          });
        }
      }
    };

    iterateCandidates(baseSize.w, baseSize.h, 0);
    iterateCandidates(baseSize.h, baseSize.w, 90);
    iterateCandidates(baseSize.h, baseSize.w, 270);

    const placedRects: Array<{ x: number; y: number; w: number; h: number }> = [];
    const autoFilled: PhotoSlot[] = [];

    const sortedCandidates = [...candidatePlacements].sort((a, b) => {
      const aArea = a.w * a.h;
      const bArea = b.w * b.h;
      if (bArea !== aArea) return bArea - aArea;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    for (const candidate of sortedCandidates) {
      if (overlapsWithPlaced(candidate.x, candidate.y, candidate.w, candidate.h, placedRects)) continue;

      placedRects.push({ x: candidate.x, y: candidate.y, w: candidate.w, h: candidate.h });

      autoFilled.push({
        id: `fill-${Date.now()}-${candidate.x}-${candidate.y}-${candidate.rotation}`,
        imageId: targetImageId,
        widthCm: candidate.widthCm,
        heightCm: candidate.heightCm,
        rotate: candidate.rotation as PhotoSlot['rotate'],
        zoom: 1.0,
        offsetX: 0,
        offsetY: 0,
        bgColor: isPolaroidPreset ? 'transparent' : addBgColor,
        isGrayscale: addGrayscale,
        brightness: 1.0,
        contrast: 1.0,
        saturation: 1.0,
        xCm: layoutMode === 'freeform' ? parseFloat(candidate.x.toFixed(2)) : undefined,
        yCm: layoutMode === 'freeform' ? parseFloat(candidate.y.toFixed(2)) : undefined,
        pageIndex: layoutMode === 'freeform' ? pageIndex : undefined,
        isPolaroid: isPolaroidPreset,
        polaroidCaption: isPolaroidPreset ? addPolaroidCaption : undefined,
        polaroidFont: isPolaroidPreset ? addPolaroidFont : undefined,
      });
    }

    if (autoFilled.length === 0) {
      showToast("Tidak ada ruang kosong yang tersisa di halaman aktif untuk auto-fill.");
      return;
    }

    const updated = [...canvasSlots, ...autoFilled];
    setCanvasSlots(updated);
    saveToHistory(updated);
    showToast(`Auto-fill: menambahkan ${autoFilled.length} foto ke ruang kosong yang tersisa, dengan rotasi otomatis bila perlu.`);
  };

  // Quick actions
  const handleDeleteSlot = (id: string) => {
    const updated = canvasSlots.filter((s) => s.id !== id);
    setCanvasSlots(updated);
    saveToHistory(updated);
    if (selectedSlotId === id) {
      setSelectedSlotId(null);
    }
    showToast("Foto dihapus dari kertas.");
  };

  const handleDuplicateSlot = (id: string) => {
    const target = canvasSlots.find((s) => s.id === id);
    if (target) {
      const cascadeOffset = layoutMode === 'freeform' ? 0.6 : 0;

      const duplicated: PhotoSlot = {
        ...target,
        id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        xCm: target.xCm !== undefined ? target.xCm + cascadeOffset : undefined,
        yCm: target.yCm !== undefined ? target.yCm + cascadeOffset : undefined,
      };
      const updated = [...canvasSlots, duplicated];
      setCanvasSlots(updated);
      saveToHistory(updated);
      setSelectedSlotId(duplicated.id);
      showToast("Cetak foto berhasil digandakan.");
    }
  };

  const handleRotateSlot = (id: string) => {
    const updated = canvasSlots.map((s) => {
      if (s.id === id) {
        const nextRotate = ((s.rotate + 90) % 360) as PhotoSlot['rotate'];
        return { ...s, rotate: nextRotate };
      }
      return s;
    });
    setCanvasSlots(updated);
    saveToHistory(updated);
  };

  // Quick Clear Canvas
  const handleQuickClearCanvas = () => {
    if (canvasSlots.length === 0) {
      showToast("Canvas sudah dalam keadaan kosong.");
      return;
    }
    const count = canvasSlots.length;
    const previousSlots = [...canvasSlots];
    
    setCanvasSlots([]);
    setSelectedSlotId(null);

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
    saveToHistory(canvasSlots, 'portrait', 1.0, 0.2, 'crop', layoutMode, 'a4-full', 21.0, 29.7);
    showToast("Pengaturan layout kertas berhasil dikembalikan ke default A4.");
  };

  // Save Project to JSON file
  const handleSaveProject = async () => {
    if (canvasSlots.length === 0 && uploadedImages.length === 0) {
      showToast("Tidak ada data untuk disimpan. Tambahkan foto terlebih dahulu.");
      return;
    }
    try {
      const paperSettings = {
        paperPresetId,
        customPaperWidthCm,
        customPaperHeightCm,
        orientation,
        marginCm,
        gapCm,
        borderStyle,
        layoutMode,
      };
      await exportProject(paperSettings, canvasSlots, uploadedImages);
      showToast("✅ Proyek berhasil disimpan sebagai file JSON!");
    } catch (err) {
      console.error('Save project error:', err);
      showToast("❌ Gagal menyimpan proyek.");
    }
  };

  // Load Project from JSON file
  const handleLoadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const { paperSettings, slots, images } = parseProjectFile(jsonStr);
        
        setUploadedImages(images);
        if (images.length > 0) {
          setSelectedGalleryImageId(images[0].id);
        }
        
        const restoredSlots: PhotoSlot[] = slots.map((slot) => ({
          ...slot,
          rotate: slot.rotate as PhotoSlot['rotate'],
          saturation: slot.saturation ?? 1,
          isPolaroid: slot.isPolaroid ?? false,
        }));
        setCanvasSlots(restoredSlots);
        setSelectedSlotId(slots[0]?.id || null);
        
        setPaperPresetId(paperSettings.paperPresetId);
        setCustomPaperWidthCm(paperSettings.customPaperWidthCm);
        setCustomPaperHeightCm(paperSettings.customPaperHeightCm);
        setOrientation(paperSettings.orientation);
        setMarginCm(paperSettings.marginCm);
        setGapCm(paperSettings.gapCm);
        setBorderStyle(paperSettings.borderStyle);
        setLayoutMode(paperSettings.layoutMode);
        
        saveToHistory(
          restoredSlots,
          paperSettings.orientation,
          paperSettings.marginCm,
          paperSettings.gapCm,
          paperSettings.borderStyle,
          paperSettings.layoutMode,
          paperSettings.paperPresetId,
          paperSettings.customPaperWidthCm,
          paperSettings.customPaperHeightCm
        );
        
        showToast(`✅ Proyek berhasil dimuat (${slots.length} foto, ${images.length} gambar)!`);
      } catch (err) {
        console.error('Load project error:', err);
        showToast("❌ Gagal memuat proyek. Format file tidak valid.");
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const triggerProjectFileSelect = () => {
    projectFileInputRef.current?.click();
  };

  // Change Paper Preset
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

  // Change Custom Scrap dimensions
  const handleCustomPaperDimensionChange = (type: 'width' | 'height', valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return;

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
    saveToHistory(canvasSlots, newOrientation);
    showToast(`Orientasi kertas diubah ke ${newOrientation === 'portrait' ? 'Potret (Portrait)' : 'Lanskap (Landscape)'}.`);
  };

  // Set Cut Line border with History
  const handleSetBorderStyle = (newStyle: 'none' | 'solid' | 'dotted' | 'crop') => {
    setBorderStyle(newStyle);
    saveToHistory(canvasSlots, orientation, marginCm, gapCm, newStyle);
  };

  // Handle detailed editing updates on currently selected slot
  const updateSelectedSlot = (id: string, updater: (slot: PhotoSlot) => PhotoSlot) => {
    setCanvasSlots((prev) => prev.map((slot) => (slot.id === id ? updater(slot) : slot)));
  };

  const activeSlot = useMemo(() => {
    return canvasSlots.find((s) => s.id === selectedSlotId) || null;
  }, [canvasSlots, selectedSlotId]);

  const activeSlotImageSrc = useMemo(() => {
    if (!activeSlot) return '';
    const img = uploadedImages.find((i) => i.id === activeSlot.imageId);
    return img ? img.src : '';
  }, [activeSlot, uploadedImages]);

  const autoLayoutCoords = useMemo(() => {
    return computeCompactAutoLayoutCoords(canvasSlots, effectivePaperWidthCm, effectivePaperHeightCm, marginCm, gapCm);
  }, [canvasSlots, effectivePaperWidthCm, effectivePaperHeightCm, marginCm, gapCm]);

  // Page layout packing algorithm simulation
  const paginatedPages = useMemo(() => {
    if (layoutMode === 'auto') {
      return paginateAutoLayout(canvasSlots, effectivePaperWidthCm, effectivePaperHeightCm, marginCm, gapCm);
    } else {
      return paginateFreeformLayout(canvasSlots);
    }
  }, [canvasSlots, effectivePaperWidthCm, effectivePaperHeightCm, marginCm, gapCm, layoutMode, borderStyle]);

  // Render a specific page at target DPI
  const renderPageToCanvas = async (pageIndex: number, dpi: number = 300): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const pW = effectivePaperWidthCm;
    const pH = effectivePaperHeightCm;
    const pxPerCm = dpi / 2.54;

    canvas.width = Math.round(pW * pxPerCm);
    canvas.height = Math.round(pH * pxPerCm);
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const slots = paginatedPages[pageIndex] || [];
    const autoCoords = autoLayoutCoords;

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
        const geo = getPolaroidGeometry(slot.widthCm, slot.heightCm);
        const frameX = -Math.round(slot.widthCm * pxPerCm / 2);
        const frameY = -Math.round(slot.heightCm * pxPerCm / 2);
        const frameW = Math.round(slot.widthCm * pxPerCm);
        const frameH = Math.round(slot.heightCm * pxPerCm);
        ctx.save();
        ctx.translate(cardX + cardW / 2, cardY + cardH / 2);
        ctx.rotate((slot.rotate * Math.PI) / 180);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(frameX, frameY, frameW, frameH);

        const photoX = Math.round(frameX + geo.left * pxPerCm);
        const photoY = Math.round(frameY + geo.top * pxPerCm);
        const photoW = Math.round((slot.widthCm - (geo.left + geo.right)) * pxPerCm);
        const photoH = Math.round((slot.heightCm - (geo.top + geo.bottom)) * pxPerCm);

        ctx.fillStyle = slot.bgColor === 'transparent' ? '#f5f5f7' : slot.bgColor;
        ctx.fillRect(photoX, photoY, photoW, photoH);

        if (imgEl && imgEl.naturalWidth > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(photoX, photoY, photoW, photoH);
          ctx.clip();

          ctx.filter = `grayscale(${slot.isGrayscale ? 1 : 0}) brightness(${slot.brightness}) contrast(${slot.contrast}) saturate(${slot.saturation ?? 1.0})`;
          ctx.translate(photoX + photoW / 2, photoY + photoH / 2);
          ctx.scale(slot.zoom, slot.zoom);
          ctx.translate((slot.offsetX / 100) * (photoW / 2), (slot.offsetY / 100) * (photoH / 2));

          const imgAspect = imgEl.naturalWidth / imgEl.naturalHeight;
          const targetAspect = photoW / photoH;

          let drawW = photoW;
          let drawH = photoH;
          if (imgAspect > targetAspect) {
            drawH = photoW / imgAspect;
          } else {
            drawW = photoH * imgAspect;
          }
          ctx.drawImage(imgEl, -drawW / 2, -drawH / 2, drawW, drawH);
          ctx.restore();
        }

        if (slot.polaroidCaption) {
          ctx.save();
          ctx.fillStyle = '#0a0a0a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          const captionCenterY = frameY + frameH - ((geo.bottom * pxPerCm) / 2);
          const captionCenterX = frameX + frameW / 2;

          if (slot.polaroidFont === 'sans') {
            const fontSize = Math.round(14 * (dpi / 96));
            ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
            ctx.fillText(slot.polaroidCaption.toUpperCase(), captionCenterX, captionCenterY, frameW - 20);
          } else if (slot.polaroidFont === 'typewriter') {
            const fontSize = Math.round(13 * (dpi / 96));
            ctx.font = `bold ${fontSize}px "Special Elite", monospace`;
            ctx.fillText(slot.polaroidCaption, captionCenterX, captionCenterY, frameW - 20);
          } else {
            const fontSize = Math.round(24 * (dpi / 96));
            ctx.font = `bold ${fontSize}px "Caveat", cursive, sans-serif`;
            ctx.fillText(slot.polaroidCaption, captionCenterX, captionCenterY, frameW - 20);
          }
          ctx.restore();
        }
        ctx.restore();
      } else {
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

  // Export to PDF
  const handleExportPDF = async () => {
    if (canvasSlots.length === 0) {
      showToast("Canvas masih kosong. Tambahkan foto ke kertas sebelum mengekspor PDF!");
      return;
    }
    setIsExporting(true);
    showToast(`Memproses ekspor PDF (${paginatedPages.length} halaman)...`);
    try {
      const blob = await exportToPDF(
        paginatedPages.length,
        effectivePaperWidthCm,
        effectivePaperHeightCm,
        renderPageToCanvas,
        exportDpi
      );
      
      downloadPDF(blob, `printa4-${Date.now()}.pdf`);
      showToast(`✅ PDF berhasil diekspor (${paginatedPages.length} halaman, ${exportDpi} DPI)!`);
    } catch (err) {
      console.error('PDF export error:', err);
      showToast("Gagal mengekspor PDF.");
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

  // Refs for canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`h-screen flex flex-col font-sans transition-colors duration-300 overflow-hidden print:h-auto print:overflow-visible ${
      theme === 'dark' ? 'bg-[#0b0f19] text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />
      
      <Header
        theme={theme}
        onThemeToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onHelpClick={() => setShowHelpModal(true)}
        onPrintClick={handlePrint}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onQuickClear={handleQuickClearCanvas}
        canQuickClear={canvasSlots.length > 0}
        onSaveProject={handleSaveProject}
        canSaveProject={canvasSlots.length > 0 || uploadedImages.length > 0}
        onLoadProject={triggerProjectFileSelect}
        projectFileInputRef={projectFileInputRef}
        historyIndex={historyIndex}
        historyLength={history.length}
        canvasSlotsLength={canvasSlots.length}
        uploadedImagesLength={uploadedImages.length}
        isScrapPaper={isScrapPaper}
        selectedPaperPreset={selectedPaperPreset}
        effectivePaperWidthCm={effectivePaperWidthCm}
        effectivePaperHeightCm={effectivePaperHeightCm}
        orientation={orientation}
        toastMessage={toastMessage}
        toastAction={toastAction}
      />

      <div className="no-print flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        <div className={`no-print sticky top-0 z-30 grid grid-cols-2 gap-1 border-b p-1.5 lg:hidden ${
          theme === 'dark' ? 'border-slate-800 bg-[#0b0f19]' : 'border-slate-200 bg-slate-50'
        }`} role="tablist" aria-label="Panel kerja">
          <button
            type="button"
            role="tab"
            aria-selected={mobileWorkspaceTab === 'settings'}
            onClick={() => setMobileWorkspaceTab('settings')}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-md text-xs font-semibold transition-colors ${
              mobileWorkspaceTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Sliders className="h-4 w-4" /> Atur
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileWorkspaceTab === 'canvas'}
            onClick={() => setMobileWorkspaceTab('canvas')}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-md text-xs font-semibold transition-colors ${
              mobileWorkspaceTab === 'canvas'
                ? 'bg-blue-600 text-white shadow-sm'
                : theme === 'dark' ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layout className="h-4 w-4" /> Canvas
            <span className={`rounded px-1.5 py-0.5 text-[10px] ${mobileWorkspaceTab === 'canvas' ? 'bg-blue-500' : 'bg-slate-800 text-slate-300'}`}>
              {canvasSlots.length}
            </span>
          </button>
        </div>

        <div className={`${mobileWorkspaceTab === 'settings' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col lg:flex lg:flex-none`}>
        <Sidebar
          // Gallery
          uploadedImages={uploadedImages}
          selectedGalleryImageId={selectedGalleryImageId}
          onSelectGalleryImage={setSelectedGalleryImageId}
          onDeleteGalleryImage={handleDeleteGalleryImage}
          onTriggerFileSelect={triggerFileSelect}
          
          // Size preset
          addSizePreset={addSizePreset}
          setAddSizePreset={setAddSizePreset}
          addCustomWidth={addCustomWidth}
          addCustomHeight={addCustomHeight}
          setAddCustomWidth={setAddCustomWidth}
          setAddCustomHeight={setAddCustomHeight}
          addPolaroidCaption={addPolaroidCaption}
          setAddPolaroidCaption={setAddPolaroidCaption}
          addPolaroidFont={addPolaroidFont}
          setAddPolaroidFont={setAddPolaroidFont}
          addBgColor={addBgColor}
          setAddBgColor={setAddBgColor}
          addGrayscale={addGrayscale}
          setAddGrayscale={setAddGrayscale}
          addQuantity={addQuantity}
          setAddQuantity={setAddQuantity}
          onAddToCanvas={handleAddToCanvas}
          onAddAllImages={handleAddAllImagesToCanvas}
          onAutoFillPage={handleAutoFillPage}
          
          // Slot editor
          activeSlot={activeSlot}
          onCloseSlotEditor={() => setSelectedSlotId(null)}
          onRotateSlot={handleRotateSlot}
          onDuplicateSlot={handleDuplicateSlot}
          onDeleteSlot={handleDeleteSlot}
          onUpdateSlot={updateSelectedSlot}
          onSaveToHistory={saveToHistory}
          uploadedImagesForEditor={uploadedImages}
          
          // Paper settings
          paperPresetId={paperPresetId}
          onSelectPaperPreset={handleSelectPaperPreset}
          customPaperWidthCm={customPaperWidthCm}
          customPaperHeightCm={customPaperHeightCm}
          onCustomWidthChange={(value) => handleCustomPaperDimensionChange('width', String(value))}
          onCustomHeightChange={(value) => handleCustomPaperDimensionChange('height', String(value))}
          orientation={orientation}
          onOrientationChange={handleSetOrientation}
          marginCm={marginCm}
          onMarginChange={setMarginCm}
          onMarginCommit={(val) => saveToHistory(canvasSlots, orientation, val, gapCm, borderStyle)}
          gapCm={gapCm}
          onGapChange={setGapCm}
          onGapCommit={(val) => saveToHistory(canvasSlots, orientation, marginCm, val, borderStyle)}
          borderStyle={borderStyle}
          onBorderStyleChange={handleSetBorderStyle}
          layoutMode={layoutMode}
          onLayoutModeChange={handleSwitchLayoutMode}
          onAutoArrange={() => {
            if (canvasSlots.length === 0) {
              showToast('Belum ada foto untuk dirapikan.');
              return;
            }
            const pW = effectivePaperWidthCm;
            const pH = effectivePaperHeightCm;
            const computedCoords = computeCompactAutoLayoutCoords(canvasSlots, pW, pH, marginCm, gapCm);
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
            setLayoutMode('auto');
            saveToHistory(updatedSlots, orientation, marginCm, gapCm, borderStyle, 'auto');
            showToast('Foto dirapikan otomatis agar ruang kosong tersesuaikan.');
          }}
          isSnapToGrid={isSnapToGrid}
          onSnapToGridChange={setIsSnapToGrid}
          gridStepCm={gridStepCm}
          onGridStepChange={setGridStepCm}
          showGridLines={showGridLines}
          onShowGridLinesChange={setShowGridLines}
          effectivePaperWidthCm={effectivePaperWidthCm}
          effectivePaperHeightCm={effectivePaperHeightCm}
          selectedPaperPreset={selectedPaperPreset}
          isScrapPaper={isScrapPaper}
          canvasSlots={canvasSlots}
          
          // Reset
          onQuickClearCanvas={handleQuickClearCanvas}
          onResetSettings={handleResetSettings}
          canvasSlotsLength={canvasSlots.length}
          
          theme={theme}
        />
        </div>

        <div className={`${mobileWorkspaceTab === 'canvas' ? 'flex' : 'hidden'} min-h-0 flex-1 flex-col lg:flex`}>
        <CanvasPreview
          canvasSlots={canvasSlots}
          paginatedPages={paginatedPages}
          uploadedImages={uploadedImages}
          selectedSlotId={selectedSlotId}
          setSelectedSlotId={handleSelectCanvasSlot}
          layoutMode={layoutMode}
          marginCm={marginCm}
          gapCm={gapCm}
          borderStyle={borderStyle}
          effectivePaperWidthCm={effectivePaperWidthCm}
          effectivePaperHeightCm={effectivePaperHeightCm}
          selectedPaperPreset={selectedPaperPreset}
          isScrapPaper={isScrapPaper}
          canvasZoom={canvasZoom}
          onZoomChange={setCanvasZoom}
          colorMode={colorMode}
          onColorModeChange={setColorMode}
          showGridLines={showGridLines}
          gridStepCm={gridStepCm}
          dragState={dragState}
          onMouseDown={handleMouseDown}
          onRotateSlot={handleRotateSlot}
          onDuplicateSlot={handleDuplicateSlot}
          onDeleteSlot={handleDeleteSlot}
          onDownloadPage={handleDownloadPage}
          onDownloadAllPages={handleDownloadAllPages}
          exportDpi={exportDpi}
          isExporting={isExporting}
          theme={theme}
          onAddToCanvas={handleAddToCanvas}
          onTriggerFileSelect={triggerFileSelect}
        />
        </div>
      </div>

      {/* STATIC PRINT OUT CONTAINER */}
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
                                transform: `translate(-50%, -50%) scale(${slot.zoom}) translate(${slot.offsetX}%, ${slot.offsetY}%)`,
                                transformOrigin: 'center center',
                              }}
                            >
                              <img
                                src={imageSrc}
                                alt=""
                                className="w-full h-full object-contain"
                                style={{
                                  filter: `grayscale(${slot.isGrayscale ? 1 : 0}) brightness(${slot.brightness}) contrast(${slot.contrast}) saturate(${slot.saturation ?? 1.0})`,
                                }}
                              />
                            </div>
                          )}
                        </div>

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

      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        theme={theme}
      />

      <PrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        onPrint={handleExecuteBrowserPrint}
        onDownloadPage={handleDownloadPage}
        onDownloadAllPages={handleDownloadAllPages}
        onExportPDF={handleExportPDF}
        isExporting={isExporting}
        exportDpi={exportDpi}
        setExportDpi={setExportDpi}
        paginatedPages={paginatedPages}
        canvasSlots={canvasSlots}
        effectivePaperWidthCm={effectivePaperWidthCm}
        effectivePaperHeightCm={effectivePaperHeightCm}
        selectedPaperPreset={selectedPaperPreset}
        isScrapPaper={isScrapPaper}
        theme={theme}
      />
    </div>
  );
}

// Helper function for slot dimensions
function getSlotDimensions(slot: PhotoSlot) {
  const isRotated90 = slot.rotate === 90 || slot.rotate === 270;
  return {
    w: isRotated90 ? slot.heightCm : slot.widthCm,
    h: isRotated90 ? slot.widthCm : slot.heightCm,
  };
}