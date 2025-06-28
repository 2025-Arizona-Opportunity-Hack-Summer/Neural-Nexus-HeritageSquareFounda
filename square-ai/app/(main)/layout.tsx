import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import React from "react";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAuthToken();
  const dbUser = await fetchQuery(api.users.current, {}, { token });
  if (!dbUser) return redirect("/sign-in");
  if (!dbUser.verified) return redirect("/not-verified");

  return <>{children}</>;
}
