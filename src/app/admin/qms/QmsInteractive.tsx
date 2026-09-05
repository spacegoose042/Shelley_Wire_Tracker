"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  guides,
  intakeQuestions,
  interactiveForms,
  processOwners,
  processSteps,
  type ProcessStep,
} from "@/lib/qms-content";

type IntakeProgress = { answered: number; total: number };

export function QmsHub() {
  const [intake, setIntake] = useState<IntakeProgress>({ answered: 0, total: 0 });
  const [formCount, setFormCount] = useState(0);

  useEffect(() => {
    const answers = JSON.parse(
      localStorage.getItem("shelley-qms-intake") ?? "{}",
    ) as Record<string, string>;
    const answered = Object.values(answers).filter((value) => value.trim()).length;
    setIntake({ answered, total: intakeQuestions.length });

    let savedForms = 0;
    for (const form of interactiveForms) {
      const raw = localStorage.getItem(`shelley-qms-form:${form.slug}`);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, string | boolean>;
        if (Object.values(data).some((value) => value !== "" && value !== false)) {
          savedForms += 1;
        }
      }
    }
    setFormCount(savedForms);
  }, []);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-shelley-blue/15 bg-white shadow-sm">
        <div className="bg-shelley-blue px-6 py-8 text-white sm:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
            Shelley Electric
          </p>
          <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Quality system
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-blue-50">
            How Shelley bids, buys, installs, and closes jobs — with practical
            checklists the field and office can actually use.
          </p>
        </div>
        <div className="grid gap-4 border-t border-gray-100 bg-slate-50 p-6 sm:grid-cols-3 sm:p-8">
          <Stat label="Process steps mapped" value={String(processSteps.length)} />
          <Stat
            label="Intake answers captured"
            value={intake.total ? `${intake.answered}/${intake.total}` : "—"}
          />
          <Stat label="Forms started" value={String(formCount)} />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <HubCard
          href="/admin/qms/process"
          eyebrow="Start here"
          title="How a job moves"
          body="Visual map from bid invitation to paid and closed. Click any step for the owner and quality checkpoint."
          cta="Open process map"
          accent="blue"
        />
        <HubCard
          href="/admin/qms/intake"
          eyebrow="Day one"
          title="Operations questionnaire"
          body="Answer plain questions with PMs and the warehouse. This becomes the baseline for procedures and metrics."
          cta="Fill questionnaire"
          accent="red"
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-shelley-blue">
              Working forms
            </h2>
            <p className="mt-1 text-sm text-shelley-gray">
              Fill these in the browser. Answers save on this device so reviews
              can start today.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {interactiveForms.map((form) => (
            <Link
              key={form.slug}
              href={`/admin/qms/forms/${form.slug}`}
              className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-shelley-blue hover:shadow-md"
            >
              <h3 className="font-semibold text-slate-800 group-hover:text-shelley-blue">
                {form.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {form.purpose}
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-shelley-blue">
                {form.whenToUse}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-shelley-blue">
            How we work guides
          </h2>
          <p className="mt-1 text-sm text-shelley-gray">
            Short playbooks for Shelley people — no jargon from other industries.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/admin/qms/guides/${guide.slug}`}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-shelley-blue"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-slate-800">{guide.title}</h3>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {guide.audience}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {guide.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <div className="text-2xl font-semibold text-shelley-blue">{value}</div>
      <div className="mt-1 text-sm text-shelley-gray">{label}</div>
    </div>
  );
}

function HubCard({
  href,
  eyebrow,
  title,
  body,
  cta,
  accent,
}: {
  href: string;
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  accent: "blue" | "red";
}) {
  const tone =
    accent === "blue"
      ? "border-shelley-blue/20 hover:border-shelley-blue"
      : "border-shelley-red/20 hover:border-shelley-red";
  const eyebrowTone =
    accent === "blue" ? "text-shelley-blue" : "text-shelley-red";

  return (
    <Link
      href={href}
      className={`rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${tone}`}
    >
      <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${eyebrowTone}`}>
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-gray-600">{body}</p>
      <span className="mt-5 inline-flex text-sm font-semibold text-shelley-blue">
        {cta} →
      </span>
    </Link>
  );
}

export function ProcessMap() {
  const [activeId, setActiveId] = useState(processSteps[0]?.id ?? "");
  const active = useMemo(
    () => processSteps.find((step) => step.id === activeId) ?? processSteps[0],
    [activeId],
  );

  return (
    <div className="space-y-6">
      <Header
        title="How a Shelley job moves"
        subtitle="From bid invitation to paid and closed. Select a step to see who owns it and what quality control belongs there."
        backHref="/admin/qms"
      />

      <div className="flex flex-wrap gap-2">
        {(Object.keys(processOwners) as Array<keyof typeof processOwners>).map(
          (owner) => (
            <span
              key={owner}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${processOwners[owner].bg} ${processOwners[owner].border} ${processOwners[owner].color}`}
            >
              {processOwners[owner].label}
            </span>
          ),
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {processSteps.map((step, index) => (
            <ProcessNode
              key={step.id}
              step={step}
              active={step.id === active.id}
              showConnector={index < processSteps.length - 1}
              onSelect={() => setActiveId(step.id)}
            />
          ))}
        </div>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-20">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Selected step
          </p>
          <h2 className="mt-2 text-xl font-semibold text-shelley-blue">
            {active.title}
          </h2>
          <p
            className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${processOwners[active.owner].bg} ${processOwners[active.owner].border} ${processOwners[active.owner].color}`}
          >
            {processOwners[active.owner].label}
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-700">{active.detail}</p>
          {active.qualityControl && (
            <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">
              <p className="font-semibold">Quality checkpoint</p>
              <p className="mt-1 leading-6">{active.qualityControl}</p>
            </div>
          )}
          {active.kind === "decision" && (
            <div className="mt-5 grid gap-2 text-sm">
              <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
                Yes → continue the job
              </div>
              <div className="rounded-lg bg-rose-50 px-3 py-2 text-rose-900">
                No → close the path shown on the map
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ProcessNode({
  step,
  active,
  showConnector,
  onSelect,
}: {
  step: ProcessStep;
  active: boolean;
  showConnector: boolean;
  onSelect: () => void;
}) {
  const owner = processOwners[step.owner];
  const shape =
    step.kind === "decision"
      ? "rounded-xl"
      : step.kind === "start" || step.kind === "end"
        ? "rounded-full"
        : "rounded-2xl";

  return (
    <div>
      <button
        type="button"
        onClick={onSelect}
        className={`w-full border px-5 py-4 text-left shadow-sm transition ${shape} ${owner.bg} ${owner.border} ${
          active ? "ring-2 ring-shelley-blue ring-offset-2" : "hover:shadow-md"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-wide ${owner.color}`}>
              {owner.label}
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              {step.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-slate-600">{step.detail}</p>
          </div>
          {step.qualityControl && (
            <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-amber-800">
              QC
            </span>
          )}
        </div>
        {step.kind === "decision" && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full bg-white px-2.5 py-1 text-emerald-700">
              Yes path
            </span>
            <span className="rounded-full bg-white px-2.5 py-1 text-rose-700">
              No path
            </span>
          </div>
        )}
      </button>
      {showConnector && (
        <div className="flex justify-center py-1">
          <div className="h-4 w-px bg-slate-300" />
        </div>
      )}
    </div>
  );
}

function Header({
  title,
  subtitle,
  backHref,
}: {
  title: string;
  subtitle: string;
  backHref: string;
}) {
  return (
    <div>
      <Link
        href={backHref}
        className="text-sm font-medium text-shelley-blue hover:underline"
      >
        ← Quality system
      </Link>
      <h1 className="mt-3 text-3xl font-semibold text-shelley-blue">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-shelley-gray">
        {subtitle}
      </p>
    </div>
  );
}
