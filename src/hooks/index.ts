import { useState, useCallback, useMemo } from 'react';
import { PhotoSlot, HistoryState, UploadedImage } from '../types';
import { MAX_HISTORY_STEPS } from '../constants';

export function useHistory(initialState: HistoryState) {
  const [history, setHistory] = useState<HistoryState[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const saveToHistory = useCallback((
    slots: PhotoSlot[],
    orientation: 'portrait' | 'landscape',
    marginCm?: number,
    gapCm?: number,
    borderStyle?: 'none' | 'solid' | 'dotted' | 'crop',
    layoutMode?: 'auto' | 'freeform',
    paperPresetId?: string,
    customPaperWidthCm?: number,
    customPaperHeightCm?: number
  ) => {
    setHistory((prev) => {
      const current = prev[historyIndex];
      const newState: HistoryState = {
        canvasSlots: slots,
        orientation: orientation ?? current.orientation,
        marginCm: marginCm ?? current.marginCm,
        gapCm: gapCm ?? current.gapCm,
        borderStyle: borderStyle ?? current.borderStyle,
        layoutMode: layoutMode ?? current.layoutMode,
        paperPresetId: paperPresetId ?? current.paperPresetId,
        customPaperWidthCm: customPaperWidthCm ?? current.customPaperWidthCm,
        customPaperHeightCm: customPaperHeightCm ?? current.customPaperHeightCm,
      };
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > MAX_HISTORY_STEPS) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY_STEPS - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    setHistoryIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const redo = useCallback(() => {
    setHistoryIndex((prev) => Math.min(history.length - 1, prev + 1));
  }, [history.length]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const currentState = history[historyIndex];

  return {
    history,
    historyIndex,
    currentState,
    saveToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    setHistory,
    setHistoryIndex,
  };
}

export function useImages() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedGalleryImageId, setSelectedGalleryImageId] = useState<string | null>(null);

  const addImages = useCallback((files: FileList) => {
    const newImages: UploadedImage[] = [];
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const src = URL.createObjectURL(file);
      newImages.push({ id, name: file.name, src, file });
    });
    setUploadedImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0) {
      setSelectedGalleryImageId(newImages[0].id);
    }
  }, []);

  const removeImage = useCallback((imageId: string) => {
    setUploadedImages((prev) => {
      const img = prev.find((i) => i.id === imageId);
      if (img) URL.revokeObjectURL(img.src);
      return prev.filter((i) => i.id !== imageId);
    });
    setSelectedGalleryImageId((prev) => (prev === imageId ? null : prev));
  }, []);

  const clearImages = useCallback(() => {
    uploadedImages.forEach((img) => URL.revokeObjectURL(img.src));
    setUploadedImages([]);
    setSelectedGalleryImageId(null);
  }, [uploadedImages]);

  const getImageSrc = useCallback((imageId: string) => {
    return uploadedImages.find((i) => i.id === imageId)?.src || '';
  }, [uploadedImages]);

  return {
    uploadedImages,
    selectedGalleryImageId,
    setSelectedGalleryImageId,
    addImages,
    removeImage,
    clearImages,
    getImageSrc,
  };
}

export function useCanvas() {
  const [canvasSlots, setCanvasSlots] = useState<PhotoSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const addSlots = useCallback((newSlots: PhotoSlot[]) => {
    setCanvasSlots((prev) => [...prev, ...newSlots]);
    if (newSlots.length > 0) {
      setSelectedSlotId(newSlots[0].id);
    }
  }, []);

  const updateSlot = useCallback((slotId: string, updater: (slot: PhotoSlot) => PhotoSlot) => {
    setCanvasSlots((prev) =>
      prev.map((s) => (s.id === slotId ? updater(s) : s))
    );
  }, []);

  const deleteSlot = useCallback((slotId: string) => {
    setCanvasSlots((prev) => prev.filter((s) => s.id !== slotId));
    setSelectedSlotId((prev) => (prev === slotId ? null : prev));
  }, []);

  const duplicateSlot = useCallback((slotId: string) => {
    setCanvasSlots((prev) => {
      const slot = prev.find((s) => s.id === slotId);
      if (!slot) return prev;
      const newSlot: PhotoSlot = {
        ...slot,
        id: `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      return [...prev, newSlot];
    });
  }, []);

  const rotateSlot = useCallback((slotId: string) => {
    setCanvasSlots((prev) =>
      prev.map((s) =>
        s.id === slotId
          ? { ...s, rotate: ((s.rotate + 90) % 360) as 0 | 90 | 180 | 270 }
          : s
      )
    );
  }, []);

  const clearCanvas = useCallback(() => {
    setCanvasSlots([]);
    setSelectedSlotId(null);
  }, []);

  const activeSlot = useMemo(
    () => canvasSlots.find((s) => s.id === selectedSlotId) || null,
    [canvasSlots, selectedSlotId]
  );

  return {
    canvasSlots,
    setCanvasSlots,
    selectedSlotId,
    setSelectedSlotId,
    addSlots,
    updateSlot,
    deleteSlot,
    duplicateSlot,
    rotateSlot,
    clearCanvas,
    activeSlot,
  };
}

export function usePaper() {
  const [paperPresetId, setPaperPresetId] = useState('a4-full');
  const [customPaperWidthCm, setCustomPaperWidthCm] = useState(10.5);
  const [customPaperHeightCm, setCustomPaperHeightCm] = useState(14.8);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [marginCm, setMarginCm] = useState(1.0);
  const [gapCm, setGapCm] = useState(0.2);
  const [borderStyle, setBorderStyle] = useState<'none' | 'solid' | 'dotted' | 'crop'>('none');
  const [layoutMode, setLayoutMode] = useState<'auto' | 'freeform'>('auto');

  const isScrapPaper = paperPresetId !== 'a4-full';

  return {
    paperPresetId,
    setPaperPresetId,
    customPaperWidthCm,
    setCustomPaperWidthCm,
    customPaperHeightCm,
    setCustomPaperHeightCm,
    orientation,
    setOrientation,
    marginCm,
    setMarginCm,
    gapCm,
    setGapCm,
    borderStyle,
    setBorderStyle,
    layoutMode,
    setLayoutMode,
    isScrapPaper,
  };
}

export function useGrid() {
  const [isSnapToGrid, setIsSnapToGrid] = useState(true);
  const [gridStepCm, setGridStepCm] = useState(0.5);
  const [showGridLines, setShowGridLines] = useState(true);

  return {
    isSnapToGrid,
    setIsSnapToGrid,
    gridStepCm,
    setGridStepCm,
    showGridLines,
    setShowGridLines,
  };
}

export function useUI() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [canvasZoom, setCanvasZoom] = useState(55);
  const [exportDpi, setExportDpi] = useState(300);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<{ label: string; onClick: () => void } | null>(null);

  const showToast = useCallback((message: string, action?: { label: string; onClick: () => void }) => {
    setToastMessage(message);
    setToastAction(action || null);
    if (action) {
      setTimeout(() => {
        setToastMessage(null);
        setToastAction(null);
      }, 10000);
    } else {
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);
    }
  }, []);

  return {
    theme,
    setTheme,
    canvasZoom,
    setCanvasZoom,
    exportDpi,
    setExportDpi,
    showHelpModal,
    setShowHelpModal,
    showPrintModal,
    setShowPrintModal,
    isExporting,
    setIsExporting,
    toastMessage,
    toastAction,
    showToast,
  };
}