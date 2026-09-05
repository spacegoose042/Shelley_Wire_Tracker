import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import {
  getQmsDocument,
  qmsDocuments,
  readQmsDocument,
} from "@/lib/qms-documents";
import { QmsDocumentReview } from "../QmsDocumentReview";

export function generateStaticParams() {
  return qmsDocuments.map(({ slug }) => ({ slug }));
}

export default async function QmsDocumentPage({
  params,
}: {
  params: { slug: string };
}) {
  const document = getQmsDocument(params.slug);
  if (!document) notFound();

  const content = await readQmsDocument(document);

  return (
    <div className="space-y-6">
      <AdminNav />
      <QmsDocumentReview
        document={document}
        content={content}
        documents={qmsDocuments}
      />
    </div>
  );
}
