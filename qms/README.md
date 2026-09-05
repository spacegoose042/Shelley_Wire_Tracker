# Shelley Electric — Quality Management System Starter Pack

**Status:** Draft starter. Not yet issued. Fill in bracketed `[items]` and have ownership approve before use.

**Company:** Shelley Electric, Inc.  
**HQ:** 3619 W 29th St S, Wichita, KS 67217  
**ERP:** Trimble Viewpoint Vista  
**Material traceability:** Wire Tracker

This pack is a company-level quality system written for a union electrical contractor. It is aligned to ISO 9001:2015 so it can later support certification if a customer requires it. It is **not** an ISO certificate and does not claim one.

Electrical contracting normally manages quality at the **project** level (a QC plan plus inspection and test plans for that job). This pack gives you both:

1. A thin **company** system so every job starts from the same rules.
2. **Project** templates you attach to a bid or kickoff.

Keep field records short. If a journeyman cannot complete a record in about a minute, redesign the form.

---

## How to use this pack

| Order | Document | What to do |
| --- | --- | --- |
| 1 | [00-quality-policy.md](00-quality-policy.md) | Have ownership sign it. One page. |
| 2 | [01-company-quality-manual.md](01-company-quality-manual.md) | Confirm names, licenses, and scope. Issue as QM-001 Rev A. |
| 3 | [02-as-is-process-map.md](02-as-is-process-map.md) | Walk it with two PMs and a general foreman. Mark what is wrong. |
| 4 | [03-implementation-roadmap.md](03-implementation-roadmap.md) | Pick Phase 1 owners and dates. |
| 5 | [04-metrics-and-management-review.md](04-metrics-and-management-review.md) | Baseline the first five metrics before changing anything. |
| 6 | Procedures QP-01 through QP-06 | Issue after the process map is confirmed. |
| 7 | Templates in `/templates` | Use T-PQP on every awarded job. Tailor ITPs to the spec. |
| 8 | Forms in `/forms` | Print or convert to fillable PDFs. Wire Tracker can replace F-03 over time. |

---

## Document index

### Company system

| ID | File | Purpose |
| --- | --- | --- |
| POL-001 | [00-quality-policy.md](00-quality-policy.md) | Signed quality policy |
| QM-001 | [01-company-quality-manual.md](01-company-quality-manual.md) | How quality is managed company-wide |
| — | [02-as-is-process-map.md](02-as-is-process-map.md) | Bid-to-cash process and control points |
| — | [03-implementation-roadmap.md](03-implementation-roadmap.md) | 4-phase rollout |
| — | [04-metrics-and-management-review.md](04-metrics-and-management-review.md) | KPIs and monthly review |
| QP-01 | [procedures/QP-01-contract-review.md](procedures/QP-01-contract-review.md) | Contract and spec flow-down |
| QP-02 | [procedures/QP-02-purchasing-and-vendors.md](procedures/QP-02-purchasing-and-vendors.md) | Buying and approved vendors |
| QP-03 | [procedures/QP-03-receiving-and-traceability.md](procedures/QP-03-receiving-and-traceability.md) | Receipts, warehouse vs jobsite, Wire Tracker |
| QP-04 | [procedures/QP-04-installation-and-inspection.md](procedures/QP-04-installation-and-inspection.md) | ITPs, NECA workmanship, AHJ inspections |
| QP-05 | [procedures/QP-05-nonconformance-and-corrective-action.md](procedures/QP-05-nonconformance-and-corrective-action.md) | NCR / CAPA |
| QP-06 | [procedures/QP-06-closeout.md](procedures/QP-06-closeout.md) | Punchlist, as-builts, billing support |

### Project templates

| ID | File | When to use |
| --- | --- | --- |
| T-PQP | [templates/T-PQP-project-quality-plan.md](templates/T-PQP-project-quality-plan.md) | Every awarded job; also for prequal / bid submittals |
| T-ITP | [templates/T-ITP-master.md](templates/T-ITP-master.md) | Blank inspection and test plan — copy per definable feature of work |
| T-ITP-26 | [templates/T-ITP-division-26-examples.md](templates/T-ITP-division-26-examples.md) | Filled examples: underground, rough-in, gear, lighting, fire alarm, testing |
| T-3PH | [templates/T-three-phase-inspection.md](templates/T-three-phase-inspection.md) | Federal / USACE-style jobs (preparatory, initial, follow-up) |
| T-glossary | [templates/T-industry-glossary.md](templates/T-industry-glossary.md) | Plain-language terms if you are new to construction QC |

### Forms

| ID | File |
| --- | --- |
| F-01 | [forms/F-01-bid-review.md](forms/F-01-bid-review.md) |
| F-02 | [forms/F-02-contract-review.md](forms/F-02-contract-review.md) |
| F-03 | [forms/F-03-receiving-inspection.md](forms/F-03-receiving-inspection.md) |
| F-04 | [forms/F-04-ncr.md](forms/F-04-ncr.md) |
| F-05 | [forms/F-05-corrective-action.md](forms/F-05-corrective-action.md) |
| F-06 | [forms/F-06-punchlist.md](forms/F-06-punchlist.md) |
| F-07 | [forms/F-07-closeout-checklist.md](forms/F-07-closeout-checklist.md) |
| F-08 | [forms/F-08-inspection-first-pass-log.md](forms/F-08-inspection-first-pass-log.md) |

---

## Related canvases (working drafts)

- Company research: `canvases/shelley-electric-company-profile.canvas.tsx` (Cursor project canvases folder)
- Process flow: `canvases/shelley-process-flow-and-qms.canvas.tsx`

Those canvases are working notes. **This `qms/` folder is the document set to issue.**
