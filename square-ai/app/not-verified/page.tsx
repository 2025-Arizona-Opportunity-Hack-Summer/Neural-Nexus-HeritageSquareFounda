import { VerificationPending } from "@/components/verification-pending";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";

export default async function NotVerifiedPage() {
  const token = await getAuthToken();
  const dbUser = await fetchQuery(api.users.current, {}, { token });
  if (!dbUser) return redirect("/sign-in");
  if (dbUser.verified) return redirect("/chat");

  return <VerificationPending />;
}
