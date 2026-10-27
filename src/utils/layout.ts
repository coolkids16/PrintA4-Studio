import { PhotoSlot, LayoutCoords } from '../types';
import { DEFAULT_MARGIN_CM, DEFAULT_GAP_CM } from '../constants';

/**
 * Compute compact auto-layout coordinates for photo slots
 * This is the core layout algorithm that arranges photos in a grid-like flow
 */
export function computeCompactAutoLayoutCoords(
  slots: PhotoSlot[],
  paperWidthCm: number,
  paperHeightCm: number,
  marginCm: number = DEFAULT_MARGIN_CM,
  gapCm: number = DEFAULT_GAP_CM
): LayoutCoords[] {
  const printableWidth = paperWidthCm - 2 * marginCm;
  const printableHeight = paperHeightCm - 2 * marginCm;
  
  const coords: LayoutCoords[] = [];
  
  let currentY = 0; // Cumulative height of already fully-completed rows (cm)
  let currentX = 0; // Cumulative width of elements inside the current row (cm)
  let rowHeight = 0; // Sizing height of the current row (cm)
  let currentPageIndex = 0;

  for (const slot of slots) {
    const isRotated90 = slot.rotate === 90 || slot.rotate === 270;
    const w = isRotated90 ? slot.heightCm : slot.widthCm;
    const h = isRotated90 ? slot.widthCm : slot.heightCm;

    // Calculate width spacing
    const neededWidth = currentX === 0 ? w : gapCm + w;

    if (currentX + neededWidth <= printableWidth) {
      // Fits on current row
      currentX += neededWidth;
      rowHeight = Math.max(rowHeight, h);
      coords.push({
        id: slot.id,
        xCm: marginCm + currentX - neededWidth,
        yCm: marginCm + currentY,
        pageIndex: currentPageIndex,
      });
    } else {
      // Must wrap to next row
      const rowIncrement = currentY === 0 ? rowHeight : gapCm + rowHeight;
      
      // Check if the new row fits in the remaining printable height
      if (currentY + rowIncrement + gapCm + h <= printableHeight) {
        // Fits on current page, wrap row
        currentY += rowIncrement;
        currentX = w;
        rowHeight = h;
        coords.push({
          id: slot.id,
          xCm: marginCm,
          yCm: marginCm + currentY,
          pageIndex: currentPageIndex,
        });
      } else {
        // Exceeds this page height. Pack current page & spawn new page sheet
        currentPageIndex++;
        currentY = 0;
        currentX = w;
        rowHeight = h;
        coords.push({
          id: slot.id,
          xCm: marginCm,
          yCm: marginCm,
          pageIndex: currentPageIndex,
        });
      }
    }
  }

  return coords;
}

/**
 * Paginate slots for auto layout mode
 */
export function paginateAutoLayout(
  slots: PhotoSlot[],
  paperWidthCm: number,
  paperHeightCm: number,
  marginCm: number,
  gapCm: number
): PhotoSlot[][] {
  const printableWidth = paperWidthCm - 2 * marginCm;
  const printableHeight = paperHeightCm - 2 * marginCm;
  
  const pages: PhotoSlot[][] = [];
  let currentPageSlots: PhotoSlot[] = [];
  
  let currentY = 0;
  let currentX = 0;
  let rowHeight = 0;

  for (const slot of slots) {
    const isRotated90 = slot.rotate === 90 || slot.rotate === 270;
    const w = isRotated90 ? slot.heightCm : slot.widthCm;
    const h = isRotated90 ? slot.widthCm : slot.heightCm;

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
}

/**
 * Paginate slots for freeform layout mode
 */
export function paginateFreeformLayout(slots: PhotoSlot[]): PhotoSlot[][] {
  let maxPage = 0;
  slots.forEach((slot) => {
    if (slot.pageIndex !== undefined && slot.pageIndex > maxPage) {
      maxPage = slot.pageIndex;
    }
  });

  const pages: PhotoSlot[][] = Array.from({ length: maxPage + 1 }, () => []);
  
  slots.forEach((slot) => {
    const idx = slot.pageIndex !== undefined ? slot.pageIndex : 0;
    pages[idx].push(slot);
  });

  return pages;
}

/**
 * Get polaroid frame geometry based on photo dimensions
 */
export function getPolaroidGeometry(widthCm: number, heightCm: number) {
  // Polaroid frame proportions: white border around photo
  // Top/bottom: ~1.2cm, Left/Right: ~0.8cm (classic polaroid proportions)
  const frameTop = 1.2;
  const frameBottom = 1.8; // Extra space for caption
  const frameLeft = 0.8;
  const frameRight = 0.8;
  
  return {
    top: frameTop,
    bottom: frameBottom,
    left: frameLeft,
    right: frameRight,
  };
}