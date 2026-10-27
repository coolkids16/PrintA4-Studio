import { Upload, X, Check, Trash2, Plus } from 'lucide-react';
import { UploadedImage } from '../types';

interface ImageGalleryProps {
  uploadedImages: UploadedImage[];
  selectedGalleryImageId: string | null;
  onSelectImage: (id: string) => void;
  onDeleteImage: (e: React.MouseEvent, id: string) => void;
  onTriggerFileSelect: () => void;
  theme: 'light' | 'dark';
}

export function ImageGallery({
  uploadedImages,
  selectedGalleryImageId,
  onSelectImage,
  onDeleteImage,
  onTriggerFileSelect,
  theme,
}: ImageGalleryProps) {
  if (uploadedImages.length === 0) {
    return (
      <div
        onClick={onTriggerFileSelect}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer mb-1 transition group ${
          theme === 'dark'
            ? 'border-slate-800 hover:border-blue-500 bg-slate-900/30 hover:bg-slate-900/60'
            : 'border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/40'
        }`}
      >
        <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition">
          <Upload className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold text-slate-200 mb-1">Belum Ada Foto di Galeri</p>
        <p className="text-[11px] text-neutral-400">
          Klik di sini untuk mengunggah foto Anda (Mendukung multi-upload JPG, PNG, WebP).
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x scrollbar-thin">
        {uploadedImages.map((img) => (
          <div
            key={img.id}
            onClick={() => onSelectImage(img.id)}
            className={`relative group flex-shrink-0 w-[72px] h-[72px] rounded-lg overflow-hidden cursor-pointer snap-start transition ${
              selectedGalleryImageId === img.id
                ? 'ring-2 ring-blue-500 scale-[1.03] shadow-md'
                : 'opacity-70 hover:opacity-100 hover:scale-[1.01]'
            }`}
          >
            <img src={img.src} alt={img.name} className="w-full h-full object-cover" />
            
            <button
              onClick={(e) => onDeleteImage(e, img.id)}
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

        <button
          onClick={onTriggerFileSelect}
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
      
      <div className={`mt-2 px-2.5 py-1.5 rounded-md text-[11px] font-mono flex items-center justify-between ${
        theme === 'dark' ? 'bg-slate-900 text-slate-400' : 'bg-slate-100 text-slate-600'
      }`}>
        <span className="truncate">
          Aktif: {uploadedImages.find(i => i.id === selectedGalleryImageId)?.name || 'Pilih foto'}
        </span>
        <span className="text-blue-500 font-semibold shrink-0">Terpilih</span>
      </div>
    </div>
  );
}