import { PaperPreset, SizePreset, BgColorOption } from '../types';

export const PAPER_PRESETS: PaperPreset[] = [
  { id: 'a4-full', name: 'A4 Standar Penuh', widthCm: 21.0, heightCm: 29.7, category: 'standard' },
  { id: 'scrap-a5', name: 'Sisa 1/2 A4 (A5 Melintang)', widthCm: 14.8, heightCm: 21.0, category: 'scrap' },
  { id: 'scrap-half-v', name: 'Sisa 1/2 A4 (Strip Memanjang)', widthCm: 10.5, heightCm: 29.7, category: 'scrap' },
  { id: 'scrap-third', name: 'Sisa 1/3 A4 (Brosur / Strip)', widthCm: 9.9, heightCm: 21.0, category: 'scrap' },
  { id: 'scrap-a6', name: 'Sisa 1/4 A4 (A6 / Kartu Pos)', widthCm: 10.5, heightCm: 14.8, category: 'scrap' },
  { id: 'scrap-4r', name: 'Sisa Potongan Foto 4R', widthCm: 10.2, heightCm: 15.2, category: 'scrap' },
  { id: 'scrap-photobooth', name: 'Sisa Strip Photobooth', widthCm: 5.0, heightCm: 15.0, category: 'scrap' },
  { id: 'custom-scrap', name: 'Kustom Sisa Kertas', widthCm: 10.5, heightCm: 14.8, category: 'custom' },
];

export const SIZE_PRESETS: SizePreset[] = [
  { id: '2x3', name: '2 x 3 cm', widthCm: 2.0, heightCm: 3.0 },
  { id: '3x4', name: '3 x 4 cm', widthCm: 3.0, heightCm: 4.0 },
  { id: '3.5x4.5', name: '3.5 x 4.5 cm (Paspor)', widthCm: 3.5, heightCm: 4.5 },
  { id: 'custom', name: 'Kustom', widthCm: 3.5, heightCm: 4.5 },
  { id: '4x6', name: '4 x 6 cm', widthCm: 4.0, heightCm: 6.0 },
  { id: 'polaroid-mini', name: 'Polaroid Mini (5.4 x 8.6 cm)', widthCm: 5.4, heightCm: 8.6 },
  { id: '2r', name: '2R (6 x 9 cm)', widthCm: 6.0, heightCm: 9.0 },
  { id: 'polaroid-square-classic', name: 'Polaroid Square (7.2 x 8.6 cm)', widthCm: 7.2, heightCm: 8.6 },
  { id: 'polaroid-wide', name: 'Polaroid Wide (10.8 x 8.6 cm)', widthCm: 10.8, heightCm: 8.6 },
  { id: 'polaroid-classic', name: 'Polaroid Klasik (8.8 x 10.7 cm)', widthCm: 8.8, heightCm: 10.7 },
  { id: 'polaroid-original', name: 'Polaroid Original (8.9 x 10.8 cm)', widthCm: 8.9, heightCm: 10.8 },
  { id: '3r', name: '3R (8.9 x 12.7 cm)', widthCm: 8.9, heightCm: 12.7 },
  { id: 'polaroid-square', name: 'Polaroid Square Besar (10.8 x 10.8 cm)', widthCm: 10.8, heightCm: 10.8 },
  { id: '4x6-photo', name: '4R / 4 x 6 inch (10.2 x 15.2 cm)', widthCm: 10.2, heightCm: 15.2 },
  { id: '5r', name: '5R (12.7 x 17.8 cm)', widthCm: 12.7, heightCm: 17.8 },
  { id: '5x7', name: '5 x 7 inch (13x18 cm)', widthCm: 12.7, heightCm: 17.8 },
  { id: '6r', name: '6R (15.2 x 20.3 cm)', widthCm: 15.2, heightCm: 20.3 },
  { id: '8r', name: '8R (20.3 x 25.4 cm)', widthCm: 20.3, heightCm: 25.4 },
  { id: 'a4-borderless', name: 'A4 Borderless (21 x 29.7 cm)', widthCm: 21.0, heightCm: 29.7 },
];

export const BG_COLOR_OPTIONS: BgColorOption[] = [
  { id: 'transparent', name: 'Transparan (Tidak Ada Latar)', hex: 'transparent' },
  { id: 'white', name: 'Putih', hex: '#ffffff' },
  { id: 'red', name: 'Merah (Pas Foto Resmi)', hex: '#dc2626' },
  { id: 'blue', name: 'Biru (Pas Foto Resmi)', hex: '#2563eb' },
  { id: 'light-blue', name: 'Biru Muda', hex: '#93c5fd' },
  { id: 'gray', name: 'Abu-Abu Netral', hex: '#9ca3af' },
  { id: 'light-gray', name: 'Abu-Abu Muda', hex: '#f3f4f6' },
];

export const GRID_STEP_OPTIONS = [
  { value: 0.1, label: '0.1 cm (Sangat Rapat)' },
  { value: 0.2, label: '0.2 cm' },
  { value: 0.5, label: '0.5 cm (Standar)' },
  { value: 1.0, label: '1.0 cm (Lebar)' },
];

export const EXPORT_DPI_OPTIONS = [
  { value: 150, label: '150 DPI (Standar)' },
  { value: 300, label: '300 DPI (Kualitas Studio)' },
];

export const BORDER_STYLE_OPTIONS = [
  { value: 'none', label: 'Tanpa Garis Pembatas' },
  { value: 'solid', label: 'Garis Tipis Abu-Abu (Solid)' },
  { value: 'dotted', label: 'Garis Putus-Putus (Dotted)' },
  { value: 'crop', label: 'Tanda Sudut (Corner Crop Marks Only)' },
];

export const POLAROID_FONT_OPTIONS = [
  { value: 'handwritten' as const, label: 'Cursive', subLabel: 'Tulis Tangan', className: 'font-handwritten text-lg' },
  { value: 'sans' as const, label: 'Sans', subLabel: 'Modern', className: 'font-sans-jakarta text-[10px] uppercase font-bold tracking-wider' },
  { value: 'typewriter' as const, label: 'Type', subLabel: 'Retro', className: 'font-typewriter text-[10px] font-bold' },
];

export const A4_WIDTH_CM = 21.0;
export const A4_HEIGHT_CM = 29.7;
export const A4_AREA_CM2 = A4_WIDTH_CM * A4_HEIGHT_CM;

export const MAX_HISTORY_STEPS = 40;
export const DEFAULT_MARGIN_CM = 1.0;
export const DEFAULT_GAP_CM = 0.2;
export const DEFAULT_CANVAS_ZOOM = 55;
export const DEFAULT_EXPORT_DPI = 300;