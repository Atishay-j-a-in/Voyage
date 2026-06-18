import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { gmailInitialSync, gmailContinuousSync, gmailChanged, dailyEmailSummary } from "@/inngest/functions";
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [gmailInitialSync, gmailContinuousSync, gmailChanged, dailyEmailSummary],
});