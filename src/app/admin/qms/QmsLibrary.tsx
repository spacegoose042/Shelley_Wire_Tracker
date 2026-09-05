"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { QmsDocument } from "@/lib/qms-documents";

type ReviewState = Record<string, "draft" | "changes" | "reviewed">;

const categories: QmsDocument["category"][] = [
  "Foundation",
  "Procedures",
  "Project templates",
  "Forms",
];

export function QmsLibrary({ documents }: { documents: QmsDocument[] }) {
  const [query, setQuery] = useState("");
  const [reviews, setReviews] = useState<ReviewState>({});

  useEffect(() => {
    const saved = localStorage.getItem("shelley-qms-reviews");
    if (saved) setReviews(JSON.parse(saved) as ReviewState);
  }, []);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return documents;
    return documents.filter((document) =>
      `${document.title} ${document.summary} ${document.category}`
        .toLowerCase()
        .includes(search),
    );
  }, [documents, query]);

  const reviewed = Object.values(reviews).filter(
    (status) => status === "reviewed",
  ).length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-shelley-gray">
            Find a document, form, or topic
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “receiving,” “inspection,” or “federal”…"
            className="input-field"
          />
        </label>
        <div className="rounded-xl border border-gray-200 bg-white px-5 py-3">
          <span className="text-2xl font-semibold text-shelley-blue">
            {reviewed}
          </span>
          <span className="ml-2 text-sm text-shelley-gray">
            of {documents.length} reviewed
          </span>
        </div>
      </section>

      {categories.map((category) => {
        const items = filtered.filter(
          (document) => document.category === category,
        );
        if (!items.length) return null;

        return (
          <section key={category} className="space-y-3">
            <div className="flex items-baseline justify-between border-b border-gray-200 pb-2">
              <h2 className="text-xl font-semibold text-shelley-blue">
                {category}
              </h2>
              <span className="text-sm text-gray-500">{items.length}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {items.map((document) => {
                const status = reviews[document.slug] ?? "draft";
                return (
                  <Link
                    key={document.slug}
                    href={`/admin/qms/${document.slug}`}
                    className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:border-shelley-blue hover:bg-blue-50/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-shelley-gray group-hover:text-shelley-blue">
                        {document.title}
                      </h3>
                      <StatusBadge status={status} />
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {document.summary}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      {!filtered.length && (
        <p className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-shelley-gray">
          No quality documents match “{query}”.
        </p>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "draft" | "changes" | "reviewed";
}) {
  const styles = {
    draft: "bg-gray-100 text-gray-600",
    changes: "bg-amber-100 text-amber-800",
    reviewed: "bg-green-100 text-green-800",
  };
  const labels = {
    draft: "Draft",
    changes: "Changes requested",
    reviewed: "Reviewed",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
