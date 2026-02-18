import { AdminNav } from "@/components/AdminNav";
import { ReceiptsList } from "./ReceiptsList";

export const metadata = { title: "Receipt history – Shelley Wire Tracker" };

export default function ReceiptsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <AdminNav />
      <div>
        <h1 className="text-2xl font-bold text-shelley-blue">Receipt history</h1>
        <p className="mt-1 text-sm text-shelley-gray">
          All inventory receipts across all parts and locations.
        </p>
      </div>
      <ReceiptsList />
    </div>
  );
}
