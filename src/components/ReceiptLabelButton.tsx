"use client";

import { useEffect, useRef, useState } from "react";

type LabelSize = "1x2" | "2x3" | "3x5";

type LabelDimensions = {
  name: LabelSize;
  label: string;
  width: number;
  height: number;
  padding: number;
  logoHeight: number;
  partSize: number;
  detailSize: number;
  matrixSize: number;
};

const LABEL_SIZES: LabelDimensions[] = [
  {
    name: "1x2",
    label: "1 × 2 in",
    width: 2,
    height: 1,
    padding: 0.08,
    logoHeight: 0.16,
    partSize: 13,
    detailSize: 8,
    matrixSize: 0.68,
  },
  {
    name: "2x3",
    label: "2 × 3 in",
    width: 3,
    height: 2,
    padding: 0.14,
    logoHeight: 0.28,
    partSize: 22,
    detailSize: 13,
    matrixSize: 1.25,
  },
  {
    name: "3x5",
    label: "3 × 5 in",
    width: 5,
    height: 3,
    padding: 0.2,
    logoHeight: 0.42,
    partSize: 34,
    detailSize: 19,
    matrixSize: 1.85,
  },
];

type Props = {
  partNumber: string;
  jobWorkOrderNumber?: string;
  quantity: number;
  unit: string;
  className?: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function matrixText(partNumber: string, jobWorkOrderNumber: string) {
  return `PART=${partNumber}\nJOB/WO=${jobWorkOrderNumber}`;
}

export function ReceiptLabelButton({
  partNumber,
  jobWorkOrderNumber,
  quantity,
  unit,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [sizeName, setSizeName] = useState<LabelSize>("2x3");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = LABEL_SIZES.find((option) => option.name === sizeName)!;
  const unitLabel = unit === "FEET" ? "ft" : "ea";

  useEffect(() => {
    if (!open || !jobWorkOrderNumber || !canvasRef.current) return;
    let cancelled = false;
    setGenerating(true);

    import("bwip-js/browser")
      .then(({ default: bwipjs }) => {
        if (cancelled || !canvasRef.current) return;
        bwipjs.toCanvas(canvasRef.current, {
          bcid: "datamatrix",
          text: matrixText(partNumber, jobWorkOrderNumber),
          scale: 4,
          paddingwidth: 0,
          paddingheight: 0,
        });
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Could not generate the Data Matrix.");
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, partNumber, jobWorkOrderNumber, sizeName]);

  function printLabel() {
    if (!jobWorkOrderNumber || !canvasRef.current) return;

    const printWindow = window.open("", "_blank", "popup,width=900,height=700");
    if (!printWindow) {
      setError("Pop-up blocked. Allow pop-ups for this site, then try again.");
      return;
    }

    const matrixDataUrl = canvasRef.current.toDataURL("image/png");
    const logoUrl = `${window.location.origin}/logo.png`;
    const safePart = escapeHtml(partNumber);
    const safeJob = escapeHtml(jobWorkOrderNumber);

    printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt label — ${safePart}</title>
  <style>
    @page { size: ${size.width}in ${size.height}in; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      width: ${size.width}in;
      height: ${size.height}in;
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .label {
      width: 100%;
      height: 100%;
      padding: ${size.padding}in;
      display: grid;
      grid-template-columns: minmax(0, 1fr) ${size.matrixSize}in;
      gap: ${Math.max(size.padding * 0.75, 0.06)}in;
      overflow: hidden;
    }
    .information {
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .logo {
      display: block;
      width: auto;
      max-width: 100%;
      height: ${size.logoHeight}in;
      object-fit: contain;
      object-position: left center;
      filter: grayscale(1) contrast(2.5);
    }
    .field-label {
      margin: 0 0 0.01in;
      font-size: ${Math.max(size.detailSize * 0.55, 5)}pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      line-height: 1;
      text-transform: uppercase;
    }
    .part {
      margin: 0;
      font-size: ${size.partSize}pt;
      font-weight: 800;
      line-height: 0.95;
      overflow-wrap: anywhere;
    }
    .details {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 0.08in;
    }
    .detail-value {
      margin: 0;
      font-size: ${size.detailSize}pt;
      font-weight: 700;
      line-height: 1;
      overflow-wrap: anywhere;
    }
    .quantity { flex: 0 0 auto; text-align: right; }
    .matrix-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .matrix {
      display: block;
      width: ${size.matrixSize}in;
      height: ${size.matrixSize}in;
      image-rendering: pixelated;
    }
    @media screen {
      body { outline: 1px solid #ccc; }
    }
  </style>
</head>
<body>
  <main class="label">
    <section class="information">
      <img id="logo" class="logo" src="${logoUrl}" alt="Shelley Electric" />
      <div>
        <p class="field-label">Part number</p>
        <p class="part">${safePart}</p>
      </div>
      <div class="details">
        <div>
          <p class="field-label">Job / WO</p>
          <p class="detail-value">${safeJob}</p>
        </div>
        <div class="quantity">
          <p class="field-label">Initial qty</p>
          <p class="detail-value">${quantity} ${unitLabel}</p>
        </div>
      </div>
    </section>
    <aside class="matrix-wrap">
      <img class="matrix" src="${matrixDataUrl}" alt="Part and Job/WO Data Matrix" />
    </aside>
  </main>
</body>
</html>`);
    printWindow.document.close();

    const logo = printWindow.document.getElementById("logo") as HTMLImageElement | null;
    const startPrint = () => {
      window.setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 150);
    };
    if (!logo || logo.complete) startPrint();
    else {
      logo.onload = startPrint;
      logo.onerror = startPrint;
    }
  }

  if (!jobWorkOrderNumber) {
    return (
      <button
        type="button"
        disabled
        title="Assign a Job/WO number before printing a label."
        className={`cursor-not-allowed text-sm text-gray-400 ${className}`}
      >
        Print label
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-sm font-medium text-shelley-blue hover:underline ${className}`}
      >
        Print label
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="receipt-label-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-2xl rounded-xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="receipt-label-title" className="text-lg font-semibold text-shelley-blue">
                  Print receipt label
                </h2>
                <p className="mt-1 text-sm text-shelley-gray">
                  Select the label loaded in your printer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-1 text-xl leading-none text-shelley-gray hover:bg-gray-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {LABEL_SIZES.map((option) => (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => setSizeName(option.name)}
                  className={
                    sizeName === option.name
                      ? "rounded-lg bg-shelley-blue px-4 py-2 text-sm font-medium text-white"
                      : "rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-shelley-gray hover:bg-gray-50"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-lg bg-gray-100 p-4">
              <div
                className="mx-auto grid overflow-hidden bg-white p-3 shadow-md"
                style={{
                  aspectRatio: `${size.width} / ${size.height}`,
                  maxWidth: `${Math.min(size.width * 120, 600)}px`,
                  gridTemplateColumns: "minmax(0, 1fr) 32%",
                  gap: "3%",
                }}
              >
                <div className="flex min-w-0 flex-col justify-between">
                  {/* Native img is intentional: the same asset is used in the print window. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="Shelley Electric"
                    className="h-[16%] max-h-12 w-auto max-w-full object-contain object-left grayscale contrast-200"
                  />
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider text-black">Part number</p>
                    <p className="break-all text-[clamp(12px,3vw,28px)] font-extrabold leading-none text-black">
                      {partNumber}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-black">Job / WO</p>
                      <p className="break-all text-[clamp(10px,2vw,18px)] font-bold leading-none text-black">
                        {jobWorkOrderNumber}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-black">Initial qty</p>
                      <p className="text-[clamp(10px,2vw,18px)] font-bold leading-none text-black">
                        {quantity} {unitLabel}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <canvas ref={canvasRef} className="h-auto max-h-full w-full object-contain [image-rendering:pixelated]" />
                </div>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-shelley-red">{error}</p>}

            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={printLabel}
                disabled={generating || Boolean(error)}
                className="btn-primary"
              >
                {generating ? "Preparing Data Matrix…" : `Print ${size.label} label`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
