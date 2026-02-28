import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  onScan: (value: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [active, setActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        setActive(false);
      }
    }

    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active]);

  useEffect(() => {
    if (!active || !("BarcodeDetector" in window)) return;

    const detector = new (window as any).BarcodeDetector({
      formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "upc_a"],
    });

    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          onScan(barcodes[0].rawValue);
          setActive(false);
        }
      } catch {
        // detection frame failed, continue
      }
    }, 300);

    return () => clearInterval(interval);
  }, [active, onScan]);

  if (!active) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setActive(true)}
      >
        <Camera className="mr-2 h-4 w-4" />
        Scan Barcode
      </Button>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-lg border">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="h-48 w-full object-cover"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1"
        onClick={() => setActive(false)}
      >
        <X className="h-4 w-4" />
      </Button>
      <p className="bg-black/50 px-2 py-1 text-center text-xs text-white">
        Point camera at barcode
      </p>
    </div>
  );
}
