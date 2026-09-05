"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getGuide,
  getInteractiveForm,
  intakeQuestions,
  type FormField,
} from "@/lib/qms-content";

export function IntakeQuestionnaire() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [respondent, setRespondent] = useState("");

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("shelley-qms-intake") ?? "{}",
    ) as Record<string, string>;
    setAnswers(stored);
    setRespondent(localStorage.getItem("shelley-qms-intake-name") ?? "");
  }, []);

  const sections = useMemo(() => {
    const map = new Map<string, typeof intakeQuestions>();
    for (const question of intakeQuestions) {
      const list = map.get(question.section) ?? [];
      list.push(question);
      map.set(question.section, list);
    }
    return Array.from(map.entries());
  }, []);

  const answered = Object.values(answers).filter((value) => value.trim()).length;

  function update(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem("shelley-qms-intake", JSON.stringify(answers));
    localStorage.setItem("shelley-qms-intake-name", respondent);
    setSaved(true);
  }

  function clearAll() {
    if (!confirm("Clear all intake answers on this device?")) return;
    setAnswers({});
    setRespondent("");
    localStorage.removeItem("shelley-qms-intake");
    localStorage.removeItem("shelley-qms-intake-name");
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations questionnaire"
        subtitle="Walk this with project managers, warehouse, and accounting. Answers save on this device and become Shelley’s day-one baseline."
      />

      <div className="grid gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-shelley-gray">
            Who is filling this out?
          </span>
          <input
            className="input-field"
            value={respondent}
            onChange={(event) => {
              setRespondent(event.target.value);
              setSaved(false);
            }}
            placeholder="Name and role"
          />
        </label>
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-shelley-gray">
          <span className="text-xl font-semibold text-shelley-blue">
            {answered}
          </span>
          <span className="ml-1">of {intakeQuestions.length} answered</span>
        </div>
      </div>

      <div className="space-y-6">
        {sections.map(([section, questions]) => (
          <section
            key={section}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="text-lg font-semibold text-shelley-blue">{section}</h2>
            <div className="mt-4 space-y-5">
              {questions.map((question) => (
                <div key={question.id}>
                  <label className="block text-sm font-medium text-slate-800">
                    {question.prompt}
                  </label>
                  {question.help && (
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {question.help}
                    </p>
                  )}
                  <div className="mt-2">
                    {question.type === "textarea" ? (
                      <textarea
                        className="input-field min-h-[96px]"
                        value={answers[question.id] ?? ""}
                        onChange={(event) =>
                          update(question.id, event.target.value)
                        }
                      />
                    ) : question.type === "yesno" ? (
                      <div className="flex flex-wrap gap-2">
                        {["Yes", "No", "Not sure"].map((option) => (
                          <ChoiceChip
                            key={option}
                            selected={(answers[question.id] ?? "") === option}
                            onClick={() => update(question.id, option)}
                            label={option}
                          />
                        ))}
                      </div>
                    ) : question.type === "choice" ? (
                      <div className="flex flex-wrap gap-2">
                        {(question.choices ?? []).map((option) => (
                          <ChoiceChip
                            key={option}
                            selected={(answers[question.id] ?? "") === option}
                            onClick={() => update(question.id, option)}
                            label={option}
                          />
                        ))}
                      </div>
                    ) : (
                      <input
                        className="input-field"
                        value={answers[question.id] ?? ""}
                        onChange={(event) =>
                          update(question.id, event.target.value)
                        }
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <button type="button" className="btn-primary" onClick={save}>
          {saved ? "Saved" : "Save answers"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => window.print()}
        >
          Print / PDF
        </button>
        <button type="button" className="btn-secondary" onClick={clearAll}>
          Clear
        </button>
      </div>
    </div>
  );
}

export function FormFiller({ slug }: { slug: string }) {
  const form = getInteractiveForm(slug);
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!form) return;
    const stored = JSON.parse(
      localStorage.getItem(`shelley-qms-form:${form.slug}`) ?? "{}",
    ) as Record<string, string | boolean>;
    setValues(stored);
  }, [form]);

  if (!form) {
    return (
      <div className="card">
        <p>Form not found.</p>
        <Link href="/admin/qms" className="mt-3 inline-block text-shelley-blue">
          Back to quality system
        </Link>
      </div>
    );
  }

  function update(id: string, value: string | boolean) {
    setValues((current) => ({ ...current, [id]: value }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem(
      `shelley-qms-form:${form!.slug}`,
      JSON.stringify(values),
    );
    setSaved(true);
  }

  function clearForm() {
    if (!confirm("Clear this form on this device?")) return;
    setValues({});
    localStorage.removeItem(`shelley-qms-form:${form!.slug}`);
    setSaved(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={form.title}
        subtitle={`${form.purpose} ${form.whenToUse}`}
      />

      <form
        className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        {form.fields.map((field) => (
          <FieldControl
            key={field.id}
            field={field}
            value={values[field.id]}
            onChange={(value) => update(field.id, value)}
          />
        ))}

        <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
          <button type="submit" className="btn-primary">
            {saved ? "Saved" : "Save form"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.print()}
          >
            Print / PDF
          </button>
          <button type="button" className="btn-secondary" onClick={clearForm}>
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}

export function GuideView({ slug }: { slug: string }) {
  const guide = getGuide(slug);
  if (!guide) {
    return (
      <div className="card">
        <p>Guide not found.</p>
        <Link href="/admin/qms" className="mt-3 inline-block text-shelley-blue">
          Back to quality system
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={guide.title} subtitle={guide.summary} />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm text-shelley-gray">
          For:{" "}
          <span className="font-medium text-slate-800">{guide.audience}</span>
        </p>
        <ol className="mt-6 space-y-4">
          {guide.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-shelley-blue text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900">{step.title}</h2>
                  <p className="mt-1 text-sm leading-7 text-slate-600">
                    {step.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string | boolean | undefined;
  onChange: (value: string | boolean) => void;
}) {
  if (field.type === "check") {
    return (
      <label className="flex items-start gap-3 rounded-xl border border-gray-200 px-4 py-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-gray-300 text-shelley-blue focus:ring-shelley-blue"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="text-sm font-medium text-slate-800">{field.label}</span>
      </label>
    );
  }

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-800">
        {field.label}
        {field.required ? " *" : ""}
      </span>
      {field.type === "textarea" ? (
        <textarea
          className="input-field min-h-[96px]"
          required={field.required}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === "yesno" ? (
        <div className="flex flex-wrap gap-2">
          {["Yes", "No", "N/A"].map((option) => (
            <ChoiceChip
              key={option}
              selected={value === option}
              onClick={() => onChange(option)}
              label={option}
            />
          ))}
        </div>
      ) : field.type === "choice" ? (
        <div className="flex flex-wrap gap-2">
          {(field.choices ?? []).map((option) => (
            <ChoiceChip
              key={option}
              selected={value === option}
              onClick={() => onChange(option)}
              label={option}
            />
          ))}
        </div>
      ) : (
        <input
          type={field.type === "date" ? "date" : "text"}
          className="input-field"
          required={field.required}
          placeholder={field.placeholder}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function ChoiceChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
        selected
          ? "border-shelley-blue bg-shelley-blue text-white"
          : "border-gray-300 bg-white text-slate-700 hover:border-shelley-blue"
      }`}
    >
      {label}
    </button>
  );
}

function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <Link
        href="/admin/qms"
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
