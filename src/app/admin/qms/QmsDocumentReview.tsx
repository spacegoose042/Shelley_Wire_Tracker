"use client";

import Link from "next/link";
import {
  Fragment,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { QmsDocument } from "@/lib/qms-documents";

type Status = "draft" | "changes" | "reviewed";
type ReviewState = Record<string, Status>;

export function QmsDocumentReview({
  document,
  content,
  documents,
}: {
  document: QmsDocument;
  content: string;
  documents: QmsDocument[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("draft");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(true);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const reviews = JSON.parse(
      localStorage.getItem("shelley-qms-reviews") ?? "{}",
    ) as ReviewState;
    setStatus(reviews[document.slug] ?? "draft");
    setNotes(
      localStorage.getItem(`shelley-qms-notes:${document.slug}`) ?? "",
    );
    setChecks(
      JSON.parse(
        localStorage.getItem(`shelley-qms-checks:${document.slug}`) ?? "{}",
      ) as Record<string, boolean>,
    );
  }, [document.slug]);

  const headings = useMemo(
    () =>
      content
        .split("\n")
        .filter((line) => line.startsWith("## "))
        .map((line) => {
          const title = line.slice(3).trim();
          return { title, id: slugify(title) };
        }),
    [content],
  );

  const matchCount = query.trim()
    ? content.toLowerCase().split(query.trim().toLowerCase()).length - 1
    : 0;
  const currentIndex = documents.findIndex(
    (item) => item.slug === document.slug,
  );
  const previous = documents[currentIndex - 1];
  const next = documents[currentIndex + 1];

  function saveReview() {
    const reviews = JSON.parse(
      localStorage.getItem("shelley-qms-reviews") ?? "{}",
    ) as ReviewState;
    reviews[document.slug] = status;
    localStorage.setItem("shelley-qms-reviews", JSON.stringify(reviews));
    localStorage.setItem(`shelley-qms-notes:${document.slug}`, notes);
    setSaved(true);
  }

  function toggleCheck(id: string, checked: boolean) {
    const updated = { ...checks, [id]: checked };
    setChecks(updated);
    localStorage.setItem(
      `shelley-qms-checks:${document.slug}`,
      JSON.stringify(updated),
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <main className="min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/qms"
            className="text-sm font-medium text-shelley-blue hover:underline"
          >
            ← Quality system library
          </Link>
          <span className="rounded-full bg-shelley-gray-light/60 px-3 py-1 text-xs font-medium text-shelley-gray">
            {document.category}
          </span>
        </div>

        <section className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-4 sm:p-6">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Search in this document
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Find text…"
                  className="input-field"
                />
                {query && (
                  <span className="whitespace-nowrap text-sm text-gray-500">
                    {matchCount} {matchCount === 1 ? "match" : "matches"}
                  </span>
                )}
              </div>
            </label>
          </div>
          <article className="qms-document p-5 sm:p-8">
            <MarkdownDocument
              content={content}
              query={query}
              checks={checks}
              onToggleCheck={toggleCheck}
            />
          </article>
        </section>

        <nav className="mt-5 grid gap-3 sm:grid-cols-2">
          {previous ? (
            <Link
              href={`/admin/qms/${previous.slug}`}
              className="rounded-xl border border-gray-200 bg-white p-4 hover:border-shelley-blue"
            >
              <span className="block text-xs uppercase tracking-wide text-gray-500">
                Previous
              </span>
              <span className="mt-1 block font-medium text-shelley-blue">
                {previous.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/admin/qms/${next.slug}`}
              className="rounded-xl border border-gray-200 bg-white p-4 text-right hover:border-shelley-blue"
            >
              <span className="block text-xs uppercase tracking-wide text-gray-500">
                Next
              </span>
              <span className="mt-1 block font-medium text-shelley-blue">
                {next.title}
              </span>
            </Link>
          )}
        </nav>
      </main>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <section className="card space-y-4 p-4">
          <div>
            <h2 className="font-semibold text-shelley-blue">Review</h2>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Saved locally in this browser.
            </p>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Status</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as Status);
                setSaved(false);
              }}
              className="input-field"
            >
              <option value="draft">Draft / not reviewed</option>
              <option value="changes">Changes requested</option>
              <option value="reviewed">Reviewed</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Review notes</span>
            <textarea
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                setSaved(false);
              }}
              rows={6}
              placeholder="Names, missing requirements, proposed edits…"
              className="input-field resize-y"
            />
          </label>
          <button type="button" onClick={saveReview} className="btn-primary w-full">
            {saved ? "Review saved" : "Save review"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary w-full"
          >
            Print / save PDF
          </button>
        </section>

        {headings.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              On this page
            </h2>
            <nav className="mt-3 space-y-2">
              {headings.map((heading) => (
                <a
                  key={heading.id}
                  href={`#${heading.id}`}
                  className="block text-sm leading-5 text-shelley-gray hover:text-shelley-blue"
                >
                  {heading.title}
                </a>
              ))}
            </nav>
          </section>
        )}
      </aside>
    </div>
  );
}

function MarkdownDocument({
  content,
  query,
  checks,
  onToggleCheck,
}: {
  content: string;
  query: string;
  checks: Record<string, boolean>;
  onToggleCheck: (id: string, checked: boolean) => void;
}) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(
        <pre key={`code-${index}`} className="qms-code">
          <code>{code.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const title = heading[2].trim();
      const id = slugify(title);
      const className =
        level === 1
          ? "qms-h1"
          : level === 2
            ? "qms-h2"
            : "qms-h3";
      const Tag = `h${level}` as "h1" | "h2" | "h3";
      blocks.push(
        <Tag key={`${id}-${index}`} id={id} className={className}>
          {renderInline(title, query)}
        </Tag>,
      );
      index += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      blocks.push(<hr key={`hr-${index}`} className="qms-rule" />);
      index += 1;
      continue;
    }

    if (
      line.includes("|") &&
      index + 1 < lines.length &&
      /^\s*\|?\s*:?-+/.test(lines[index + 1])
    ) {
      const rows: string[][] = [splitTableRow(line)];
      index += 2;
      while (index < lines.length && lines[index].includes("|")) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      const [headers, ...body] = rows;
      blocks.push(
        <div key={`table-${index}`} className="qms-table-wrap">
          <table className="qms-table">
            <thead>
              <tr>
                {headers.map((cell, cellIndex) => (
                  <th key={cellIndex}>{renderInline(cell, query)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((_, cellIndex) => (
                    <td key={cellIndex}>
                      {renderInline(row[cellIndex] ?? "", query)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (/^(\s*)[-*]\s+/.test(line)) {
      const items: { text: string; checked?: boolean; id: string }[] = [];
      while (index < lines.length && /^(\s*)[-*]\s+/.test(lines[index])) {
        const raw = lines[index].replace(/^(\s*)[-*]\s+/, "");
        const check = /^\[([ xX])\]\s+/.exec(raw);
        items.push({
          text: check ? raw.slice(check[0].length) : raw,
          checked: check ? check[1].toLowerCase() === "x" : undefined,
          id: `check-${index}`,
        });
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`} className="qms-list">
          {items.map((item) => (
            <li key={item.id}>
              {item.checked !== undefined ? (
                <label className="qms-check">
                  <input
                    type="checkbox"
                    checked={checks[item.id] ?? item.checked}
                    onChange={(event) =>
                      onToggleCheck(item.id, event.target.checked)
                    }
                  />
                  <span>{renderInline(item.text, query)}</span>
                </label>
              ) : (
                renderInline(item.text, query)
              )}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      blocks.push(
        <ol key={`ordered-${index}`} className="qms-list qms-ordered">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{renderInline(item, query)}</li>
          ))}
        </ol>,
      );
      continue;
    }

    if (line.startsWith("> ")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].startsWith("> ")) {
        quote.push(lines[index].slice(2));
        index += 1;
      }
      blocks.push(
        <blockquote key={`quote-${index}`} className="qms-quote">
          {renderInline(quote.join(" "), query)}
        </blockquote>,
      );
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isBlockStart(lines, index)
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`p-${index}`} className="qms-paragraph">
        {renderInline(paragraph.join(" "), query)}
      </p>,
    );
  }

  return <>{blocks}</>;
}

function isBlockStart(lines: string[], index: number) {
  const line = lines[index];
  return (
    /^(#{1,3})\s+/.test(line) ||
    /^---+$/.test(line.trim()) ||
    line.startsWith("```") ||
    /^(\s*)[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    line.startsWith("> ") ||
    (line.includes("|") &&
      index + 1 < lines.length &&
      /^\s*\|?\s*:?-+/.test(lines[index + 1]))
  );
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function renderInline(text: string, query: string): ReactNode[] {
  const pattern = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|`[^`]+`|<[^>]+>)/g;
  return text.split(pattern).flatMap((part, index) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      return (
        <a
          key={index}
          href={resolveDocumentLink(link[2])}
          className="text-shelley-blue underline"
        >
          {highlight(link[1], query)}
        </a>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{highlight(part.slice(2, -2), query)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index}>{highlight(part.slice(1, -1), query)}</code>;
    }
    if (part.startsWith("<") && part.endsWith(">")) {
      return (
        <span key={index} className="text-gray-500">
          {highlight(part, query)}
        </span>
      );
    }
    return <Fragment key={index}>{highlight(part, query)}</Fragment>;
  });
}

function highlight(text: string, query: string): ReactNode[] {
  const search = query.trim();
  if (!search) return [text];
  const parts = text.split(new RegExp(`(${escapeRegex(search)})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === search.toLowerCase() ? (
      <mark key={index}>{part}</mark>
    ) : (
      part
    ),
  );
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveDocumentLink(href: string) {
  const fileToSlug: Record<string, string> = {
    "00-quality-policy.md": "quality-policy",
    "01-company-quality-manual.md": "quality-manual",
    "02-as-is-process-map.md": "process-map",
    "03-implementation-roadmap.md": "roadmap",
    "04-metrics-and-management-review.md": "metrics",
  };
  const file = href.split("/").pop() ?? "";
  return fileToSlug[file] ? `/admin/qms/${fileToSlug[file]}` : href;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
