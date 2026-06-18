import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { WorkspaceShell } from "./_components/WorkspaceShell";
import { ConnectDialog } from "./_components/ConnectDialog";
import { getIntegrationStatus } from "@/lib/integrations";
import { getUserPreferences } from "@/lib/userPreferences";

/**
 * Workspace route. Server component does four checks before
 * rendering the shell:
 *   1. The user is signed in (defence in depth on top of the
 *      middleware). If not, bounce to /sign-in.
 *   2. The user has connected at least one of {gmail,
 *      googlecalendar} via the corsair OAuth flow. The Clerk
 *      user id is the corsair tenant id (lib/corsair.ts). If
 *      nothing is connected, render the ConnectDialog instead
 *      of the shell so the user cannot get to the workspace
 *      without an integration.
 *   3. The user_preferences row is loaded (auto-created with
 *      defaults on first visit) and passed to the shell so
 *      the orb and the settings tray render with the right
 *      state on first paint.
 *   4. Hand off to the client shell.
 */
export default async function WorkspacePage(): Promise<React.ReactElement> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  const status = await getIntegrationStatus(userId);
  if (!status.hasBoth) {
    return <ConnectDialog />;
  }
  

  const preferences = await getUserPreferences(userId, email);
  return <WorkspaceShell preferences={preferences} />;
}