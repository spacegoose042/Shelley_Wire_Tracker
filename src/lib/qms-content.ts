export type ProcessOwner =
  | "customer"
  | "pm"
  | "accounting"
  | "warehouse"
  | "field"
  | "decision";

export type ProcessStep = {
  id: string;
  title: string;
  detail: string;
  owner: ProcessOwner;
  kind: "start" | "step" | "decision" | "end";
  qualityControl?: string;
  yesNext?: string;
  noNext?: string;
  next?: string;
  branchLabel?: string;
};

export const processOwners: Record<
  ProcessOwner,
  { label: string; color: string; bg: string; border: string }
> = {
  customer: {
    label: "Customer / GC",
    color: "text-sky-800",
    bg: "bg-sky-50",
    border: "border-sky-300",
  },
  pm: {
    label: "Project Manager",
    color: "text-indigo-800",
    bg: "bg-indigo-50",
    border: "border-indigo-300",
  },
  accounting: {
    label: "Accounting",
    color: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-300",
  },
  warehouse: {
    label: "Purchasing / Warehouse",
    color: "text-amber-900",
    bg: "bg-amber-50",
    border: "border-amber-300",
  },
  field: {
    label: "Field",
    color: "text-cyan-900",
    bg: "bg-cyan-50",
    border: "border-cyan-300",
  },
  decision: {
    label: "Decision",
    color: "text-rose-800",
    bg: "bg-rose-50",
    border: "border-rose-300",
  },
};

export const processSteps: ProcessStep[] = [
  {
    id: "invite",
    title: "Bid invitation",
    detail: "Customer or GC sends drawings, specs, and bid request.",
    owner: "customer",
    kind: "start",
    next: "takeoff",
  },
  {
    id: "takeoff",
    title: "Scope review & takeoff",
    detail: "PM reviews scope, walks drawings, and counts material and labor.",
    owner: "pm",
    kind: "step",
    qualityControl: "Bid / no-bid checklist",
    next: "estimate",
  },
  {
    id: "estimate",
    title: "Estimate labor & material",
    detail: "Build the estimate: hours, material cost, exclusions, assumptions.",
    owner: "pm",
    kind: "step",
    qualityControl: "Peer review over a dollar threshold",
    next: "propose",
  },
  {
    id: "propose",
    title: "Submit proposal",
    detail: "Send the bid. Customer may ask questions or request changes.",
    owner: "pm",
    kind: "step",
    next: "win",
  },
  {
    id: "win",
    title: "Did we win the job?",
    detail: "If no, mark lost with a reason. If yes, continue to contract.",
    owner: "decision",
    kind: "decision",
    yesNext: "contract",
    noNext: "lost",
  },
  {
    id: "lost",
    title: "Mark lost & close",
    detail: "Record why we lost. Close the pursuit so estimating learns from it.",
    owner: "pm",
    kind: "end",
  },
  {
    id: "contract",
    title: "Signed contract / NTP",
    detail: "Receive signed contract or notice to proceed.",
    owner: "customer",
    kind: "step",
    qualityControl: "Contract review before buyout",
    next: "vista",
  },
  {
    id: "vista",
    title: "Enter job in Vista",
    detail: "Accounting creates the job / work order number in Viewpoint Vista.",
    owner: "accounting",
    kind: "step",
    qualityControl: "Job number, cost codes, and budget match the estimate",
    next: "allocate",
  },
  {
    id: "allocate",
    title: "Assign crews & buy material",
    detail: "PM schedules labor and issues purchase orders from the estimate.",
    owner: "pm",
    kind: "step",
    next: "ship",
  },
  {
    id: "ship",
    title: "Where does material go?",
    detail: "Some material ships to the warehouse. Some goes straight to the job.",
    owner: "decision",
    kind: "decision",
    yesNext: "warehouse",
    noNext: "jobsite",
    branchLabel: "Warehouse vs jobsite",
  },
  {
    id: "warehouse",
    title: "Receive at warehouse",
    detail: "Check count, damage, and approved product. Stage by job number.",
    owner: "warehouse",
    kind: "step",
    qualityControl: "Receiving inspection + Wire Tracker",
    next: "tie",
  },
  {
    id: "jobsite",
    title: "Receive at jobsite",
    detail: "Field receives direct shipments and checks them in.",
    owner: "field",
    kind: "step",
    qualityControl: "Jobsite receiving inspection",
    next: "tie",
  },
  {
    id: "tie",
    title: "Tie material to the job",
    detail: "Every receipt, pull, and return is tagged to the work order / job number.",
    owner: "warehouse",
    kind: "step",
    qualityControl: "Wire Tracker traceability",
    next: "install",
  },
  {
    id: "install",
    title: "Install & test",
    detail: "Field pulls wire, installs gear, terminates, and tests.",
    owner: "field",
    kind: "step",
    qualityControl: "Inspection & test plan, AHJ / owner inspections",
    next: "cost",
  },
  {
    id: "cost",
    title: "Job cost roll-up",
    detail: "Accounting gathers labor and material cost against the job.",
    owner: "accounting",
    kind: "step",
    next: "bill",
  },
  {
    id: "bill",
    title: "Bill the customer",
    detail: "Progress or final billing. Punchlist and closeout should finish here.",
    owner: "accounting",
    kind: "step",
    qualityControl: "Closeout package before final retainage",
    next: "paid",
  },
  {
    id: "paid",
    title: "Paid & closed",
    detail: "Payment received. Job closed in Vista with closeout complete.",
    owner: "customer",
    kind: "end",
  },
];

export type IntakeQuestion = {
  id: string;
  section: string;
  prompt: string;
  help?: string;
  type: "text" | "textarea" | "yesno" | "choice";
  choices?: string[];
};

export const intakeQuestions: IntakeQuestion[] = [
  {
    id: "lost-owner",
    section: "Bidding",
    prompt: "Who marks a bid as lost, and where is the reason recorded?",
    help: "We want one clear place so estimating can learn why bids are lost.",
    type: "textarea",
  },
  {
    id: "estimate-review",
    section: "Bidding",
    prompt: "Is there a dollar amount above which someone else reviews the estimate?",
    type: "yesno",
  },
  {
    id: "estimate-threshold",
    section: "Bidding",
    prompt: "If yes, what is that dollar threshold?",
    type: "text",
  },
  {
    id: "vista-creator",
    section: "Job setup",
    prompt: "Who creates the Vista job number?",
    type: "choice",
    choices: ["Accounting only", "PM requests and Accounting creates", "PM creates it", "Not sure / varies"],
  },
  {
    id: "cost-codes",
    section: "Job setup",
    prompt: "Do Vista cost codes line up with how the estimate is built?",
    type: "choice",
    choices: ["Yes, closely", "Somewhat", "No", "Not sure"],
  },
  {
    id: "submittals",
    section: "Material",
    prompt: "How do approved submittals get to the field today?",
    type: "textarea",
  },
  {
    id: "jobsite-receive",
    section: "Material",
    prompt: "Who is allowed to receive material at the jobsite?",
    type: "textarea",
  },
  {
    id: "returns",
    section: "Material",
    prompt: "How are leftover materials returned to the warehouse today?",
    type: "textarea",
  },
  {
    id: "punchlist-owner",
    section: "Closeout",
    prompt: "Who owns the punchlist and closeout package?",
    type: "text",
  },
  {
    id: "change-orders",
    section: "Closeout",
    prompt: "How do change orders get into Vista and out to the field?",
    type: "textarea",
  },
  {
    id: "rfi-log",
    section: "Field quality",
    prompt: "Where is the RFI log kept today?",
    type: "text",
  },
  {
    id: "tool-cal",
    section: "Field quality",
    prompt: "Are megger / torque tools calibrated on a schedule?",
    type: "choice",
    choices: ["Yes, documented", "Sometimes", "No", "Not sure"],
  },
  {
    id: "specialty-licenses",
    section: "Field quality",
    prompt: "Which specialty licenses do we keep on file (fire alarm, etc.)?",
    type: "textarea",
  },
  {
    id: "top-pain",
    section: "Priorities",
    prompt: "What quality or material problem costs Shelley the most time or money today?",
    type: "textarea",
  },
  {
    id: "day1-win",
    section: "Priorities",
    prompt: "If this quality system only fixed one thing in the next 30 days, what should it be?",
    type: "textarea",
  },
];

export type FormField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "date" | "choice" | "yesno" | "check";
  choices?: string[];
  required?: boolean;
  placeholder?: string;
};

export type InteractiveForm = {
  slug: string;
  title: string;
  purpose: string;
  whenToUse: string;
  fields: FormField[];
};

export const interactiveForms: InteractiveForm[] = [
  {
    slug: "bid-review",
    title: "Bid review",
    purpose: "Quick check before we submit a bid.",
    whenToUse: "Before every proposal goes out.",
    fields: [
      { id: "job", label: "Job / pursuit name", type: "text", required: true },
      { id: "date", label: "Date", type: "date", required: true },
      { id: "pm", label: "Estimator / PM", type: "text", required: true },
      { id: "drawings", label: "Drawings and specs complete enough to estimate?", type: "yesno", required: true },
      { id: "site", label: "Site visit done or waived?", type: "yesno", required: true },
      { id: "capability", label: "Scope matches what Shelley can do?", type: "yesno", required: true },
      { id: "prequal", label: "License, bond, insurance, and prequal can be met?", type: "yesno", required: true },
      { id: "special", label: "Any special customer quality requirements?", type: "textarea", placeholder: "Healthcare, federal, aviation, etc." },
      { id: "decision", label: "Bid decision", type: "choice", choices: ["Bid", "No-bid"], required: true },
      { id: "reason", label: "Reason / notes", type: "textarea" },
    ],
  },
  {
    slug: "contract-review",
    title: "Contract review",
    purpose: "Confirm scope, schedule, and quality requirements before we buy material or mobilize.",
    whenToUse: "After award, before buyout.",
    fields: [
      { id: "job", label: "Job name", type: "text", required: true },
      { id: "wo", label: "Vista job / work order #", type: "text" },
      { id: "date", label: "Date", type: "date", required: true },
      { id: "pm", label: "Project manager", type: "text", required: true },
      { id: "contract", label: "Signed contract or NTP in hand?", type: "yesno", required: true },
      { id: "scope", label: "Scope matches the estimate?", type: "yesno", required: true },
      { id: "schedule", label: "Schedule / milestones understood?", type: "yesno", required: true },
      { id: "submittals", label: "Submittals required before buying material?", type: "yesno", required: true },
      { id: "testing", label: "Testing / commissioning / owner training required?", type: "textarea" },
      { id: "closeout", label: "Closeout documents required", type: "textarea", placeholder: "As-builts, O&M, warranties, attic stock…" },
      { id: "blockers", label: "Cannot proceed until", type: "textarea" },
    ],
  },
  {
    slug: "receiving",
    title: "Receiving inspection",
    purpose: "Confirm the right material arrived, undamaged, for the right job.",
    whenToUse: "Warehouse or jobsite receipts.",
    fields: [
      { id: "date", label: "Date", type: "date", required: true },
      { id: "location", label: "Received at", type: "choice", choices: ["Warehouse", "Jobsite"], required: true },
      { id: "receiver", label: "Received by", type: "text", required: true },
      { id: "wo", label: "Vista job / work order #", type: "text", required: true },
      { id: "po", label: "PO number", type: "text" },
      { id: "carrier", label: "Carrier / packing slip", type: "text" },
      { id: "description", label: "What arrived", type: "textarea", required: true },
      { id: "qty-ok", label: "Quantity correct?", type: "yesno", required: true },
      { id: "damage", label: "Any damage?", type: "yesno", required: true },
      { id: "approved", label: "Matches approved product / submittal?", type: "choice", choices: ["Yes", "No", "N/A"], required: true },
      { id: "disposition", label: "Disposition", type: "choice", choices: ["Accept to job", "Partial accept", "Reject / hold"], required: true },
      { id: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    slug: "ncr",
    title: "Nonconformance report",
    purpose: "Record wrong material, failed inspection, or work that does not match the drawings/specs.",
    whenToUse: "When something is wrong and needs a record.",
    fields: [
      { id: "date", label: "Date found", type: "date", required: true },
      { id: "job", label: "Job / work order", type: "text", required: true },
      { id: "found-by", label: "Found by", type: "text", required: true },
      { id: "location", label: "Location on site", type: "text" },
      { id: "type", label: "Type", type: "choice", choices: ["Material", "Workmanship", "Failed inspection", "Failed test", "Documentation", "Other"], required: true },
      { id: "description", label: "What is wrong", type: "textarea", required: true },
      { id: "required", label: "What was required", type: "textarea" },
      { id: "containment", label: "Immediate action taken", type: "textarea" },
      { id: "disposition", label: "Disposition", type: "choice", choices: ["Rework", "Repair", "Return / scrap", "Use-as-is (needs written approval)", "Other"], required: true },
      { id: "verified", label: "Verified corrected by", type: "text" },
    ],
  },
  {
    slug: "punchlist",
    title: "Punchlist",
    purpose: "Track remaining items before closeout.",
    whenToUse: "Near substantial completion and through final.",
    fields: [
      { id: "job", label: "Job name", type: "text", required: true },
      { id: "wo", label: "Vista work order #", type: "text" },
      { id: "item", label: "Item description", type: "textarea", required: true },
      { id: "location", label: "Location", type: "text", required: true },
      { id: "owner", label: "Owner", type: "choice", choices: ["Shelley", "Other trade", "GC / owner"], required: true },
      { id: "found", label: "Date found", type: "date", required: true },
      { id: "done", label: "Date completed", type: "date" },
      { id: "verified", label: "Verified by", type: "text" },
    ],
  },
  {
    slug: "closeout",
    title: "Closeout checklist",
    purpose: "Make sure the job is actually finished before final billing.",
    whenToUse: "Before retainage / final invoice.",
    fields: [
      { id: "job", label: "Job name", type: "text", required: true },
      { id: "wo", label: "Vista work order #", type: "text" },
      { id: "pm", label: "PM", type: "text", required: true },
      { id: "ahj", label: "AHJ final / permit closed", type: "check" },
      { id: "punch", label: "Punchlist complete", type: "check" },
      { id: "asbuilt", label: "As-builts transmitted", type: "check" },
      { id: "om", label: "O&M manuals / approved submittals", type: "check" },
      { id: "tests", label: "Test reports attached", type: "check" },
      { id: "warranty", label: "Warranty letter issued", type: "check" },
      { id: "training", label: "Owner training complete (if required)", type: "check" },
      { id: "attic", label: "Attic stock / spares turned over", type: "check" },
      { id: "notes", label: "Notes / open items", type: "textarea" },
    ],
  },
  {
    slug: "inspection-log",
    title: "Inspection first-pass log",
    purpose: "Track whether inspections pass the first time.",
    whenToUse: "Every AHJ, GC, owner, or commissioning inspection.",
    fields: [
      { id: "job", label: "Job name", type: "text", required: true },
      { id: "date", label: "Date", type: "date", required: true },
      { id: "type", label: "Inspection type", type: "choice", choices: ["Rough-in", "Cover", "Gear", "Final", "Commissioning", "Other"], required: true },
      { id: "inspector", label: "Inspector / agency", type: "text", required: true },
      { id: "area", label: "Area", type: "text" },
      { id: "result", label: "Result", type: "choice", choices: ["Pass", "Fail", "Pass after correction"], required: true },
      { id: "notes", label: "Notes", type: "textarea" },
    ],
  },
];

export type Guide = {
  slug: string;
  title: string;
  summary: string;
  audience: string;
  steps: { title: string; body: string }[];
};

export const guides: Guide[] = [
  {
    slug: "contract-review",
    title: "Contract review",
    summary: "Before we buy or mobilize, make sure the job matches what we bid.",
    audience: "Project managers",
    steps: [
      {
        title: "Collect the package",
        body: "Contract or NTP, drawings with revision list, specs, addenda, and estimate turnover notes.",
      },
      {
        title: "Walk the checklist",
        body: "Use the Contract review form. Flag scope gaps, schedule risk, special quality requirements, and anything that blocks buyout.",
      },
      {
        title: "Raise gaps in writing",
        body: "If we cannot meet a requirement, raise an RFI or clarification before that work starts.",
      },
      {
        title: "Set up the job",
        body: "Ask Accounting to create the Vista job with cost codes and budget that match the estimate.",
      },
      {
        title: "Brief the field",
        body: "Give the general foreman the current drawings, approved product rules, and any hold points.",
      },
    ],
  },
  {
    slug: "purchasing",
    title: "Purchasing & vendors",
    summary: "Buy the approved product and tie every PO to a job number.",
    audience: "PMs and purchasing",
    steps: [
      {
        title: "Buy from the estimate and approved submittal",
        body: "Do not substitute without the official approval path.",
      },
      {
        title: "Put the job number on every PO",
        body: "Vista job / work order number, catalog identity, quantity, ship-to, and need-by date.",
      },
      {
        title: "Know your vendors",
        body: "Keep a simple approved vendor list. Specialty gear may need manufacturer authorization.",
      },
      {
        title: "Flow requirements to subcontractors",
        body: "If another trade or specialty tech works under Shelley, they follow the same job rules.",
      },
    ],
  },
  {
    slug: "receiving",
    title: "Receiving & material control",
    summary: "Right part, right count, right job — warehouse or jobsite.",
    audience: "Warehouse and field receivers",
    steps: [
      {
        title: "Inspect before you accept",
        body: "Match packing slip to PO, check damage, and confirm approved product when a submittal exists.",
      },
      {
        title: "Reject or hold bad receipts",
        body: "Do not put rejected material into available inventory for the job. Notify purchasing and the PM.",
      },
      {
        title: "Stage by job",
        body: "Keep jobs separated. Label reels and gear with the work order number.",
      },
      {
        title: "Record pulls and returns",
        body: "Wire Tracker is the official material record: who pulled what, how much, and for which job.",
      },
    ],
  },
  {
    slug: "installation",
    title: "Installation & inspection",
    summary: "Install to the drawings, specs, and code. Prove it with inspections and tests.",
    audience: "General foremen and field",
    steps: [
      {
        title: "Work only to current documents",
        body: "Issued-for-construction drawings plus approved RFIs and shop drawings. Mark old prints void.",
      },
      {
        title: "Use an inspection plan for major work",
        body: "Underground, rough-in, gear, lighting, fire alarm, and testing each get clear hold points.",
      },
      {
        title: "Log every outside inspection",
        body: "AHJ, GC, owner, and commissioning results go on the first-pass log. Failures become nonconformances.",
      },
      {
        title: "Record tests",
        body: "Megger, torque, continuity, ground, and functional tests as the job requires. Note the tool used.",
      },
    ],
  },
  {
    slug: "nonconformance",
    title: "When something is wrong",
    summary: "Identify it, fix it, and stop it from happening again.",
    audience: "Everyone",
    steps: [
      {
        title: "Stop and mark it",
        body: "Tag or segregate wrong material or bad work. Do not bury it.",
      },
      {
        title: "Open a nonconformance",
        body: "Describe what is wrong versus what was required. Notify the PM.",
      },
      {
        title: "Choose a disposition",
        body: "Rework, repair, return/scrap, or use-as-is only with written approval from the party who owns the spec.",
      },
      {
        title: "Fix repeats for good",
        body: "If the same issue comes back, write a corrective action with a simple root cause and a real prevention step.",
      },
    ],
  },
  {
    slug: "closeout",
    title: "Closeout",
    summary: "Finish the paperwork and the punchlist so Shelley can collect and the owner can use the building.",
    audience: "PMs and Accounting",
    steps: [
      {
        title: "Drive the punchlist to zero",
        body: "Track Shelley items to completion. Do not call the job done while open Shelley punch remains.",
      },
      {
        title: "Assemble the package",
        body: "As-builts, O&Ms, test reports, warranties, attic stock, training records, and finals as the contract requires.",
      },
      {
        title: "Close the cost",
        body: "Accounting finals the job. PM sends labor/material lessons back to estimating.",
      },
      {
        title: "Treat callbacks as quality events",
        body: "Log warranty calls. Repeats get a corrective action.",
      },
    ],
  },
];

export function getInteractiveForm(slug: string) {
  return interactiveForms.find((form) => form.slug === slug);
}

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
