import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, open, onClose }: ImageLightboxProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 flex flex-col items-center rounded-2xl bg-white p-4 shadow-2xl dark:bg-gray-900"
        style={{ maxWidth: 840, maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute -right-3 -top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white shadow-lg transition-colors hover:bg-black"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </button>
        <img
          src={src}
          alt={alt || ""}
          className="rounded-lg object-contain"
          style={{ maxWidth: 800, maxHeight: "calc(88vh - 32px)", width: "auto", height: "auto" }}
        />
      </div>
    </div>
  );
}

interface ItemThumbnailProps {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: number;
}

export function ItemThumbnail({ src, alt, className, size = 40 }: ItemThumbnailProps) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-muted text-muted-foreground",
          className
        )}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        <svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || ""}
      className={cn("rounded-md object-cover", className)}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  );
}
