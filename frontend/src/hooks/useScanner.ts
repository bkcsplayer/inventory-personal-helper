import { useCallback, useState } from "react";
import type { ScanResult } from "../types";

export function useScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanned, setLastScanned] = useState<ScanResult | null>(null);

  const startScanning = useCallback(() => {
    setIsScanning(true);
  }, []);

  const stopScanning = useCallback(() => {
    setIsScanning(false);
  }, []);

  return { startScanning, stopScanning, lastScanned, isScanning, setLastScanned };
}
