import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { getInteractiveForm, interactiveForms } from "@/lib/qms-content";
import { FormFiller } from "../../QmsTools";

export function generateStaticParams() {
  return interactiveForms.map(({ slug }) => ({ slug }));
}

export default function QmsFormPage({
  params,
}: {
  params: { slug: string };
}) {
  if (!getInteractiveForm(params.slug)) notFound();

  return (
    <div className="space-y-6">
      <AdminNav />
      <FormFiller slug={params.slug} />
    </div>
  );
}
