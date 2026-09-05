import "server-only";

import { readFile } from "fs/promises";
import path from "path";

export type QmsDocument = {
  slug: string;
  title: string;
  category: "Foundation" | "Procedures" | "Project templates" | "Forms";
  summary: string;
  file: string;
};

export const qmsDocuments: QmsDocument[] = [
  { slug: "quality-policy", title: "Quality Policy", category: "Foundation", summary: "One-page operating commitment for ownership approval.", file: "00-quality-policy.md" },
  { slug: "quality-manual", title: "Company Quality Manual", category: "Foundation", summary: "Company-wide, ISO-aligned quality framework.", file: "01-company-quality-manual.md" },
  { slug: "process-map", title: "As-is Process Map", category: "Foundation", summary: "Bid-to-cash flow and quality control points.", file: "02-as-is-process-map.md" },
  { slug: "roadmap", title: "Implementation Roadmap", category: "Foundation", summary: "Phased rollout from baseline through optional certification.", file: "03-implementation-roadmap.md" },
  { slug: "metrics", title: "Metrics & Management Review", category: "Foundation", summary: "Starter KPIs and monthly review rhythm.", file: "04-metrics-and-management-review.md" },
  { slug: "contract-review", title: "QP-01 Contract Review", category: "Procedures", summary: "Contract, specification, and estimate flow-down.", file: "procedures/QP-01-contract-review.md" },
  { slug: "purchasing-vendors", title: "QP-02 Purchasing & Vendors", category: "Procedures", summary: "Approved vendors, POs, and substitutions.", file: "procedures/QP-02-purchasing-and-vendors.md" },
  { slug: "receiving-traceability", title: "QP-03 Receiving & Traceability", category: "Procedures", summary: "Warehouse/jobsite receipts and Wire Tracker records.", file: "procedures/QP-03-receiving-and-traceability.md" },
  { slug: "installation-inspection", title: "QP-04 Installation & Inspection", category: "Procedures", summary: "ITPs, workmanship, testing, and inspection.", file: "procedures/QP-04-installation-and-inspection.md" },
  { slug: "nonconformance", title: "QP-05 NCR & Corrective Action", category: "Procedures", summary: "Control, disposition, root cause, and recurrence prevention.", file: "procedures/QP-05-nonconformance-and-corrective-action.md" },
  { slug: "closeout", title: "QP-06 Closeout", category: "Procedures", summary: "Punchlist, turnover, job cost, and warranty.", file: "procedures/QP-06-closeout.md" },
  { slug: "project-quality-plan", title: "Project Quality Plan", category: "Project templates", summary: "The job-specific QC plan requested by GCs and owners.", file: "templates/T-PQP-project-quality-plan.md" },
  { slug: "itp-master", title: "ITP Master Template", category: "Project templates", summary: "Blank inspection and test plan for each work feature.", file: "templates/T-ITP-master.md" },
  { slug: "itp-division-26", title: "Division 26 ITP Examples", category: "Project templates", summary: "Examples for underground, rough-in, gear, lighting, fire alarm, and testing.", file: "templates/T-ITP-division-26-examples.md" },
  { slug: "three-phase", title: "Three-phase Inspection", category: "Project templates", summary: "Federal/USACE preparatory, initial, and follow-up controls.", file: "templates/T-three-phase-inspection.md" },
  { slug: "glossary", title: "Industry Glossary", category: "Project templates", summary: "Construction quality terms translated for an EMS background.", file: "templates/T-industry-glossary.md" },
  { slug: "bid-review", title: "F-01 Bid Review", category: "Forms", summary: "Pre-bid scope and risk check.", file: "forms/F-01-bid-review.md" },
  { slug: "contract-review-form", title: "F-02 Contract Review", category: "Forms", summary: "Awarded-job contract review record.", file: "forms/F-02-contract-review.md" },
  { slug: "receiving-form", title: "F-03 Receiving Inspection", category: "Forms", summary: "Material receipt and discrepancy record.", file: "forms/F-03-receiving-inspection.md" },
  { slug: "ncr-form", title: "F-04 Nonconformance Report", category: "Forms", summary: "Record and disposition nonconforming work or material.", file: "forms/F-04-ncr.md" },
  { slug: "corrective-action-form", title: "F-05 Corrective Action", category: "Forms", summary: "Root cause and recurrence-prevention record.", file: "forms/F-05-corrective-action.md" },
  { slug: "punchlist-form", title: "F-06 Punchlist", category: "Forms", summary: "Location-based closeout defect list.", file: "forms/F-06-punchlist.md" },
  { slug: "closeout-form", title: "F-07 Closeout Checklist", category: "Forms", summary: "Final inspection, documents, turnover, and billing readiness.", file: "forms/F-07-closeout-checklist.md" },
  { slug: "inspection-log", title: "F-08 First-pass Log", category: "Forms", summary: "AHJ, GC, owner, and commissioning inspection outcomes.", file: "forms/F-08-inspection-first-pass-log.md" },
];

export function getQmsDocument(slug: string) {
  return qmsDocuments.find((document) => document.slug === slug);
}

export async function readQmsDocument(document: QmsDocument) {
  return readFile(path.join(process.cwd(), "qms", document.file), "utf8");
}
