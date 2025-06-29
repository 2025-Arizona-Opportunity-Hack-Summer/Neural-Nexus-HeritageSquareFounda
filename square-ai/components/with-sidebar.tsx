import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { cookies } from "next/headers";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export async function WithSidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const sidebarState = cookieStore.get("sidebar:state")?.value;
  const sidebarWidth = cookieStore.get("sidebar:width")?.value;

  let defaultOpen = true;

  if (sidebarState) defaultOpen = sidebarState === "true";

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const token = await getAuthToken();
  const dbUser = await fetchQuery(api.users.current, {}, { token });
  if (!dbUser) redirect("/sign-in");

  return (
    <SidebarProvider defaultOpen={defaultOpen} defaultWidth={sidebarWidth}>
      <AppSidebar user={dbUser} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
