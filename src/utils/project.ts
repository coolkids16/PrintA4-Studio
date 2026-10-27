export interface ProjectFile {
  version: string;
  timestamp: string;
  paperSettings: {
    paperPresetId: string;
    customPaperWidthCm: number;
    customPaperHeightCm: number;
    orientation: 'portrait' | 'landscape';
    marginCm: number;
    gapCm: number;
    borderStyle: 'none' | 'solid' | 'dotted' | 'crop';
    layoutMode: 'auto' | 'freeform';
  };
  slots: Array<{
    id: string;
    imageId: string;
    widthCm: number;
    heightCm: number;
    rotate: number;
    zoom: number;
    offsetX: number;
    offsetY: number;
    bgColor: string;
    isGrayscale: boolean;
    brightness: number;
    contrast: number;
    saturation?: number;
    xCm?: number;
    yCm?: number;
    pageIndex?: number;
    isPolaroid?: boolean;
    polaroidCaption?: string;
    polaroidFont?: 'handwritten' | 'sans' | 'typewriter';
  }>;
  images: Array<{
    id: string;
    name: string;
    dataUrl: string; // Base64 data URL for portability
  }>;
}

/**
 * Convert a blob or object URL to base64 Data URL
 */
export async function blobToDataUrl(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert base64 Data URL back to object URL
 */
export function dataUrlToObjectUrl(dataUrl: string): string {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const blob = new Blob([u8arr], { type: mime });
  return URL.createObjectURL(blob);
}

/**
 * Export current workspace state as JSON file
 */
export async function exportProject(
  paperSettings: ProjectFile['paperSettings'],
  slots: ProjectFile['slots'],
  images: Array<{ id: string; name: string; src: string }>
): Promise<void> {
  const projectImages = await Promise.all(
    images.map(async (img) => ({
      id: img.id,
      name: img.name,
      dataUrl: await blobToDataUrl(img.src),
    }))
  );

  const project: ProjectFile = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    paperSettings,
    slots,
    images: projectImages,
  };

  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `printa4-project-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import project file from JSON string
 */
export function parseProjectFile(jsonStr: string): {
  paperSettings: ProjectFile['paperSettings'];
  slots: ProjectFile['slots'];
  images: Array<{ id: string; name: string; src: string; objectUrl: string }>;
} {
  const project: ProjectFile = JSON.parse(jsonStr);

  if (!project.version || !project.paperSettings || !Array.isArray(project.slots)) {
    throw new Error('Format file proyek tidak valid.');
  }

  const restoredImages = (project.images || []).map((img) => {
    const objectUrl = dataUrlToObjectUrl(img.dataUrl);
    return {
      id: img.id,
      name: img.name,
      src: objectUrl,
      objectUrl,
    };
  });

  return {
    paperSettings: project.paperSettings,
    slots: project.slots,
    images: restoredImages,
  };
}
