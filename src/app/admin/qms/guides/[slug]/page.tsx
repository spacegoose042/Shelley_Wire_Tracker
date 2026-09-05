import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { getGuide, guides } from "@/lib/qms-content";
import { GuideView } from "../../QmsTools";

export function generateStaticParams() {
  return guides.map(({ slug }) => ({ slug }));
}

export default function QmsGuidePage({
  params,
}: {
  params: { slug: string };
}) {
  if (!getGuide(params.slug)) notFound();

  return (
    <div className="space-y-6">
      <AdminNav />
      <GuideView slug={params.slug} />
    </div>
  );
}
