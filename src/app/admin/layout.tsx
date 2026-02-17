import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </>
  );
}
