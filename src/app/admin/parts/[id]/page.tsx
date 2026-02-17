import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditPartForm } from "./EditPartForm";

export default async function AdminPartEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const { id } = await params;
  const part = await prisma.part.findUnique({ where: { id } });
  if (!part) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-shelley-blue">Edit part</h1>
        <p className="mt-1 text-shelley-gray">{part.partNumber}</p>
      </div>
      <EditPartForm
        id={part.id}
        partNumber={part.partNumber}
        description={part.description ?? ""}
        location={part.location ?? ""}
        unit={part.unit}
        currentQuantity={Number(part.currentQuantity)}
      />
    </div>
  );
}
