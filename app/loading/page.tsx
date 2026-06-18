import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LoadingScreen } from "./_components/LoadingScreen";

/**
 * The post-auth cinematic. The workspace is plain black; the
 * hyper-warp + "Approaching [Galaxy]" overlay live here, full screen,
 * until the ramp completes. Then we push to /workspace.
 */
export default async function LoadingPage(): Promise<React.ReactElement> {
  const { userId } = await auth();
  // Bounce anyone who isn't signed in back to the sign-in page.
  if (!userId) redirect("/sign-in");
  return <LoadingScreen />;
}