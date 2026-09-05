import { AdminNav } from "@/components/AdminNav";
import { qmsDocuments } from "@/lib/qms-documents";
import { QmsLibrary } from "./QmsLibrary";

export default function QmsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-shelley-red">
          Draft for review
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-shelley-blue">
          Quality Management System
        </h1>
        <p className="mt-2 max-w-3xl text-shelley-gray">
          Review the company framework, operating procedures, project quality
          plans, and field forms. Review status and notes are saved in this
          browser until a formal approval workflow is added.
        </p>
      </div>
      <AdminNav />
      <QmsLibrary documents={qmsDocuments} />
    </div>
  );
}
