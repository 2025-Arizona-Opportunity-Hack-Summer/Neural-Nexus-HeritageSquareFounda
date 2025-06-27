"use server";

import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { revalidatePath } from "next/cache";

export async function verifyUser() {
  const token = await getAuthToken();
  const dbUser = await fetchQuery(api.users.current, {}, { token });
  if (!dbUser || !dbUser.isAdmin) return null;

  await fetchMutation(
    api.users.verify,
    { clerkUserId: dbUser.clerkUserId },
    { token },
  );

  revalidatePath("/admin");
}

export async function changeUserAdminStatus() {
  const token = await getAuthToken();
  const dbUser = await fetchQuery(api.users.current, {}, { token });
  if (!dbUser || !dbUser.isAdmin) return null;

  await fetchMutation(
    api.users.changeAdminStatus,
    { clerkUserId: dbUser.clerkUserId },
    { token },
  );

  revalidatePath("/admin");
}

export async function bulkVerifyUsers(clerkIds: string[]) {
  const token = await getAuthToken();
  const dbUser = await fetchQuery(api.users.current, {}, { token });
  if (!dbUser || !dbUser.isAdmin) return null;

  await fetchMutation(
    api.users.bulkVerify,
    { clerkUserIds: clerkIds },
    { token },
  );

  revalidatePath("/admin");
}
