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
  captionSize: number;
  codeSize: number;
  // The 1x2 label is too short to stack both codes, so they sit side by side.
  codeLayout: "row" | "column";
};

const LABEL_SIZES: LabelDimensions[] = [
  {
    name: "1x2",
    label: "1 × 2 in",
    width: 2,
    height: 1,
    padding: 0.07,
    logoHeight: 0.15,
    partSize: 12,
    detailSize: 7.5,
    captionSize: 4.5,
    codeSize: 0.4,
    codeLayout: "row",
  },
  {
    name: "2x3",
    label: "2 × 3 in",
    width: 3,
    height: 2,
    padding: 0.13,
    logoHeight: 0.26,
    partSize: 20,
    detailSize: 12,
    captionSize: 7,
    codeSize: 0.68,
    codeLayout: "column",
  },
  {
    name: "3x5",
    label: "3 × 5 in",
    width: 5,
    height: 3,
    padding: 0.18,
    logoHeight: 0.4,
    partSize: 30,
    detailSize: 17,
    captionSize: 9,
    codeSize: 1.05,
    codeLayout: "column",
  },
];

type JobOption = {
  number: string;
  quantity: number;
};

type Props = {
  partNumber: string;
  jobWorkOrderNumber?: string;
  jobOptions?: JobOption[];
  quantity?: number;
  unit: string;
  quantityCaption?: string;
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

export function ReceiptLabelButton({
  partNumber,
  jobWorkOrderNumber,
  jobOptions,
  quantity,
  unit,
  quantityCaption = "Initial qty",
  className = "",
}: Props) {
  const options =
    jobOptions && jobOptions.length > 0
      ? jobOptions
      : jobWorkOrderNumber && quantity != null
        ? [{ number: jobWorkOrderNumber, quantity }]
        : [];
  const [open, setOpen] = useState(false);
  const [sizeName, setSizeName] = useState<LabelSize>("2x3");
  const [selectedJob, setSelectedJob] = useState(options[0]?.number ?? "");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const partCanvasRef = useRef<HTMLCanvasElement>(null);
  const jobCanvasRef = useRef<HTMLCanvasElement>(null);
  const size = LABEL_SIZES.find((option) => option.name === sizeName)!;
  const unitLabel = unit === "FEET" ? "ft" : "ea";
  const selected = options.find((job) => job.number === selectedJob) ?? options[0];
  const activeJob = selected?.number;
  const activeQty = selected?.quantity;

  // Preview is drawn at real proportions so it matches the printed label.
  const previewWidth = Math.min(size.width * 130, 620);
  const ppi = previewWidth / size.width;
  const pt = (value: number) => (value / 72) * ppi;
  const gap = Math.max(size.padding * 0.7, 0.05);

  useEffect(() => {
    if (!open) return;
    setSelectedJob(options[0]?.number ?? "");
    // options[0] is the current Job/WO; reset when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !activeJob) return;
    let cancelled = false;
    setGenerating(true);

    import("bwip-js/browser")
      .then(({ default: bwipjs }) => {
        if (cancelled || !partCanvasRef.current || !jobCanvasRef.current) return;
        // Each code carries only its own value so a scan fills a single field.
        const codes: [HTMLCanvasElement, string][] = [
          [partCanvasRef.current, partNumber],
          [jobCanvasRef.current, activeJob],
        ];
        for (const [canvas, text] of codes) {
          bwipjs.toCanvas(canvas, {
            bcid: "datamatrix",
            text,
            scale: 4,
            paddingwidth: 0,
            paddingheight: 0,
          });
        }
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("Could not generate the Data Matrix codes.");
      })
      .finally(() => {
        if (!cancelled) setGenerating(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, partNumber, activeJob, sizeName]);

  function printLabel() {
    if (!activeJob || activeQty == null) return;
    if (!partCanvasRef.current || !jobCanvasRef.current) return;

    const printWindow = window.open("", "_blank", "popup,width=900,height=700");
    if (!printWindow) {
      setError("Pop-up blocked. Allow pop-ups for this site, then try again.");
      return;
    }

    const partMatrix = partCanvasRef.current.toDataURL("image/png");
    const jobMatrix = jobCanvasRef.current.toDataURL("image/png");
    const logoUrl = `${window.location.origin}/logo.png`;
    const safePart = escapeHtml(partNumber);
    const safeJob = escapeHtml(activeJob);

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
      grid-template-columns: minmax(0, 1fr) auto;
      gap: ${gap}in;
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
      font-size: ${size.captionSize}pt;
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
    .codes {
      display: flex;
      flex-direction: ${size.codeLayout};
      align-items: center;
      justify-content: center;
      gap: ${gap}in;
    }
    .code {
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .code-caption {
      margin: 0 0 0.02in;
      font-size: ${size.captionSize}pt;
      font-weight: 700;
      letter-spacing: 0.06em;
      line-height: 1;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .matrix {
      display: block;
      width: ${size.codeSize}in;
      height: ${size.codeSize}in;
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
          <p class="field-label">${escapeHtml(quantityCaption)}</p>
          <p class="detail-value">${activeQty} ${unitLabel}</p>
        </div>
      </div>
    </section>
    <aside class="codes">
      <figure class="code">
        <figcaption class="code-caption">Scan part</figcaption>
        <img class="matrix" src="${partMatrix}" alt="Part number Data Matrix" />
      </figure>
      <figure class="code">
        <figcaption class="code-caption">Scan job/WO</figcaption>
        <img class="matrix" src="${jobMatrix}" alt="Job/WO Data Matrix" />
      </figure>
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

  if (options.length === 0) {
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
                  Select the label loaded in your printer
                  {options.length > 1 ? " and the Job/WO to print." : "."}
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

            {options.length > 1 && (
              <div className="mt-4">
                <label className="mb-1 block text-xs font-medium uppercase text-shelley-gray">
                  Job/WO to print
                </label>
                <select
                  value={selectedJob}
                  onChange={(e) => setSelectedJob(e.target.value)}
                  className="input-field max-w-sm text-sm"
                >
                  {options.map((job) => (
                    <option key={job.number} value={job.number}>
                      {job.number} — {job.quantity} {unitLabel}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
                className="mx-auto grid overflow-hidden bg-white text-black shadow-md"
                style={{
                  width: `${previewWidth}px`,
                  height: `${size.height * ppi}px`,
                  padding: `${size.padding * ppi}px`,
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: `${gap * ppi}px`,
                }}
              >
                <div className="flex min-w-0 flex-col justify-between">
                  {/* Native img is intentional: the same asset is used in the print window. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/logo.png"
                    alt="Shelley Electric"
                    className="w-auto max-w-full object-contain object-left grayscale contrast-200"
                    style={{ height: `${size.logoHeight * ppi}px` }}
                  />
                  <div>
                    <p
                      className="font-bold uppercase leading-none tracking-wider"
                      style={{ fontSize: `${pt(size.captionSize)}px` }}
                    >
                      Part number
                    </p>
                    <p
                      className="font-extrabold [overflow-wrap:anywhere]"
                      style={{ fontSize: `${pt(size.partSize)}px`, lineHeight: 0.95 }}
                    >
                      {partNumber}
                    </p>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="font-bold uppercase leading-none tracking-wider"
                        style={{ fontSize: `${pt(size.captionSize)}px` }}
                      >
                        Job / WO
                      </p>
                      <p
                        className="font-bold leading-none [overflow-wrap:anywhere]"
                        style={{ fontSize: `${pt(size.detailSize)}px` }}
                      >
                        {activeJob}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className="font-bold uppercase leading-none tracking-wider"
                        style={{ fontSize: `${pt(size.captionSize)}px` }}
                      >
                        {quantityCaption}
                      </p>
                      <p
                        className="font-bold leading-none"
                        style={{ fontSize: `${pt(size.detailSize)}px` }}
                      >
                        {activeQty} {unitLabel}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center justify-center"
                  style={{
                    flexDirection: size.codeLayout === "row" ? "row" : "column",
                    gap: `${gap * ppi}px`,
                  }}
                >
                  <figure className="m-0 flex flex-col items-center">
                    <figcaption
                      className="whitespace-nowrap font-bold uppercase leading-none tracking-wider"
                      style={{ fontSize: `${pt(size.captionSize)}px`, marginBottom: `${0.02 * ppi}px` }}
                    >
                      Scan part
                    </figcaption>
                    <canvas
                      ref={partCanvasRef}
                      className="block [image-rendering:pixelated]"
                      style={{ width: `${size.codeSize * ppi}px`, height: `${size.codeSize * ppi}px` }}
                    />
                  </figure>
                  <figure className="m-0 flex flex-col items-center">
                    <figcaption
                      className="whitespace-nowrap font-bold uppercase leading-none tracking-wider"
                      style={{ fontSize: `${pt(size.captionSize)}px`, marginBottom: `${0.02 * ppi}px` }}
                    >
                      Scan job/WO
                    </figcaption>
                    <canvas
                      ref={jobCanvasRef}
                      className="block [image-rendering:pixelated]"
                      style={{ width: `${size.codeSize * ppi}px`, height: `${size.codeSize * ppi}px` }}
                    />
                  </figure>
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
                {generating ? "Preparing codes…" : `Print ${size.label} label`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
