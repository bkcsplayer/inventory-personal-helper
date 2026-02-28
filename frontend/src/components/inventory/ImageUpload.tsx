import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadItemImage, deleteItemImage } from "@/services/items";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  itemId?: string;
  currentUrl?: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}

export function ImageUpload({ itemId, currentUrl, onUploaded, onRemoved }: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 10 * 1024 * 1024) return;

    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    if (!itemId) {
      onUploaded(localPreview);
      return;
    }

    setUploading(true);
    try {
      const result = await uploadItemImage(itemId, file);
      setPreview(result.image_url);
      onUploaded(result.image_url);
    } catch {
      setPreview(currentUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (itemId && currentUrl) {
      try {
        await deleteItemImage(itemId);
      } catch {
        return;
      }
    }
    setPreview(null);
    onRemoved();
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="h-24 w-24 rounded-lg border object-cover"
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white shadow-sm"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className={cn(
            "flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed",
            "text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          )}
        >
          <Upload className="h-5 w-5" />
          <span className="text-xs">上传图片</span>
        </button>
      )}
    </div>
  );
}
