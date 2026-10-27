import { orientation } from 'exifr';

/**
 * Read EXIF orientation from image file
 * Returns rotation angle in degrees (0, 90, 180, 270)
 */
export async function getExifOrientation(file: File): Promise<number> {
  try {
    const orientationValue = await orientation(file);
    if (!orientationValue) return 0;
    
    // EXIF orientation values:
    // 1 = normal (0°)
    // 2 = flip horizontal
    // 3 = rotate 180°
    // 4 = flip vertical
    // 5 = transpose (flip horizontal + rotate 90° CCW)
    // 6 = rotate 90° CW
    // 7 = transverse (flip horizontal + rotate 90° CW)
    // 8 = rotate 270° CW (90° CCW)
    switch (orientationValue) {
      case 3: return 180;
      case 6: return 90;
      case 8: return 270;
      default: return 0;
    }
  } catch (err) {
    console.warn('EXIF read failed:', err);
    return 0;
  }
}

/**
 * Apply EXIF orientation to image element via CSS transform
 * Returns the rotation angle that should be applied
 */
export async function getImageRotationFromFile(file: File): Promise<number> {
  return getExifOrientation(file);
}

/**
 * Create a corrected image (rotated according to EXIF) as a blob
 * This is useful if we want to strip EXIF and bake rotation into pixels
 */
export async function createCorrectedImageBlob(file: File): Promise<Blob | null> {
  const rotation = await getExifOrientation(file);
  if (rotation === 0) return null; // No correction needed
  
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      
      // Set canvas dimensions based on rotation
      if (rotation === 90 || rotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      
      // Apply rotation
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    };
    img.src = url;
  });
}