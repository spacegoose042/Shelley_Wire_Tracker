import { AdminNav } from "@/components/AdminNav";
import { IntakeQuestionnaire } from "../QmsTools";

export default function QmsIntakePage() {
  return (
    <div className="space-y-6">
      <AdminNav />
      <IntakeQuestionnaire />
    </div>
  );
}
