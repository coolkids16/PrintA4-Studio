export interface UploadedImage {
  id: string;
  name: string;
  src: string;
  file?: File;
  objectUrl?: string;
  exifRotation?: number;
}

export interface PhotoSlot {
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

export interface PaperPreset {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
  category: 'standard' | 'scrap' | 'custom';
}

export interface SizePreset {
  id: string;
  name: string;
  widthCm: number;
  heightCm: number;
}

export interface BgColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface LayoutCoords {
  id: string;
  xCm: number;
  yCm: number;
  pageIndex: number;
}

export interface HistoryState {
  canvasSlots: PhotoSlot[];
  orientation: 'portrait' | 'landscape';
  marginCm: number;
  gapCm: number;
  borderStyle: 'none' | 'solid' | 'dotted' | 'crop';
  layoutMode: 'auto' | 'freeform';
  paperPresetId: string;
  customPaperWidthCm: number;
  customPaperHeightCm: number;
}

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMessage {
  message: string;
  action?: ToastAction;
}

export interface DragState {
  slotId: string;
  pageIndex: number;
  startX: number;
  startY: number;
  startSlotX: number;
  startSlotY: number;
}

export interface PolaroidGeometry {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface ProjectFile {
  version: number;
  createdAt: string;
  images: Array<{
    id: string;
    name: string;
    dataUrl: string;
    exifRotation?: number;
  }>;
  slots: PhotoSlot[];
  settings: {
    orientation: 'portrait' | 'landscape';
    marginCm: number;
    gapCm: number;
    borderStyle: 'none' | 'solid' | 'dotted' | 'crop';
    layoutMode: 'auto' | 'freeform';
    paperPresetId: string;
    customPaperWidthCm: number;
    customPaperHeightCm: number;
    isSnapToGrid: boolean;
    gridStepCm: number;
    showGridLines: boolean;
    canvasZoom: number;
    exportDpi: number;
    theme: 'light' | 'dark';
  };
}