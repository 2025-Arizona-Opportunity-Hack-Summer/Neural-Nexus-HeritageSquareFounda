import { AdminPanel } from "@/components/admin-panel";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const token = await getAuthToken();
  const dbUser = await fetchQuery(api.users.current, {}, { token });
  if (!dbUser || !dbUser.isAdmin) redirect("/chat");

  const allUsers = await fetchQuery(api.users.all, {}, { token });

  return <AdminPanel users={allUsers} />;
}
