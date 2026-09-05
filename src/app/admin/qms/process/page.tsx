import { AdminNav } from "@/components/AdminNav";
import { ProcessMap } from "../QmsInteractive";

export default function QmsProcessPage() {
  return (
    <div className="space-y-6">
      <AdminNav />
      <ProcessMap />
    </div>
  );
}
