"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type BarcodeScannerProps = {
  onScan: (value: string) => void;
  onClose: () => void;
};

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = "barcode-reader";

  useEffect(() => {
    let mounted = true;

    async function start() {
      try {
        const scanner = new Html5Qrcode(containerId);
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 5, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            if (!mounted) return;
            scanner.stop().catch(() => {});
            onScan(decodedText);
          },
          () => {}
        );
        if (mounted) setHasPermission(true);
      } catch (e) {
        if (mounted) {
          setHasPermission(false);
          setError(e instanceof Error ? e.message : "Could not start camera");
        }
      }
    }

    start();
    return () => {
      mounted = false;
      scannerRef.current?.stop().catch(() => {});
      scannerRef.current = null;
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4">
      <div className="flex items-center justify-between text-white">
        <h2 className="text-lg font-medium">Scan part number</h2>
        <button
          type="button"
          onClick={() => {
            scannerRef.current?.stop().catch(() => {});
            onClose();
          }}
          className="rounded-lg bg-white/20 px-4 py-2 text-sm font-medium hover:bg-white/30"
        >
          Cancel
        </button>
      </div>
      <div id={containerId} className="mt-4 min-h-[200px] flex-1 rounded-lg" />
      {error && (
        <p className="mt-4 text-center text-sm text-red-400">
          {error} – you can type the part number instead.
        </p>
      )}
      {hasPermission === false && !error && (
        <p className="mt-4 text-center text-sm text-amber-400">
          Camera access denied. Type the part number instead.
        </p>
      )}
    </div>
  );
}
