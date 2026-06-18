"use client";

import { UserButton } from "@clerk/nextjs";
import { dark, neobrutalism } from "@clerk/ui/themes";
import type { ReactElement } from "react";

/**
 * Floating user control for the Command Center.
 *
 * - 40px round trigger sits in a glass capsule that matches the
 *   Voyage nav treatment.
 * - Popover uses the same dark + neobrutalism pair as the auth
 *   pages so the sign-out menu feels native to the rest of the app.
 * - Sign-out destination is set globally on the `ClerkProvider`
 *   in `app/layout.tsx` via `afterSignOutUrl` so it applies to
 *   every `UserButton` / `SignOutButton` instance.
 *
 * The `appearance` object is typed structurally here (matching the
 * shape Clerk expects) rather than using Clerk's exported
 * `Appearance` type. The exported `Appearance` is generic over
 * `Theme`, which has a discriminated union for `BaseTheme` that
 * does not type-check cleanly against an array of prebuilt theme
 * exports. The structural shape below is what the SDK accepts
 * at runtime, and matches the pattern used by
 * `app/_components/auth/clerkAppearance.ts`.
 */
const appearance: {
  theme: Array<typeof dark>;
  variables: Record<string, string>;
  elements: Record<string, string>;
} = {
  theme: [dark, neobrutalism],
  variables: {
    colorPrimary: "#00f0ff",
    colorBackground: "transparent",
    colorForeground: "#ffffff",
    colorMutedForeground: "rgba(255,255,255,0.7)",
    colorNeutral: "rgba(255,255,255,0.08)",
    colorInput: "rgba(255,255,255,0.04)",
    colorInputForeground: "#ffffff",
    colorRing: "rgba(0, 240, 255, 0.4)",
    colorDanger: "#ff5470",
    borderRadius: "12px",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    userButtonBox:
      "!h-10 !w-10 !rounded-full !border !border-white/15 !bg-white/[0.04] hover:!border-[#00f0ff]/60 !transition-colors !duration-300 !p-0 !overflow-hidden",
    userButtonTrigger:
      "!h-10 !w-10 !rounded-full focus:!outline-none focus:!ring-2 focus:!ring-[#00f0ff]/40",
    userButtonPopoverCard:
      "!bg-[rgba(8,10,14,0.96)] !backdrop-blur-xl !border !border-white/10 !rounded-2xl !shadow-[0_8px_40px_rgba(0,0,0,0.6)]",
    userButtonPopoverActions: "!gap-1",
    userButtonPopoverActionButton:
      "!text-white hover:!bg-white/[0.08] !rounded-lg !text-sm",
    userButtonPopoverActionButtonIcon: "!text-white/70",
    userButtonPopoverActionButtonText: "!text-white",
    userButtonPopoverFooter: "!border-t !border-white/10",
    userPreview: "!p-1",
    userPreviewMainIdentifier: "!text-white !font-medium",
    userPreviewSecondaryIdentifier: "!text-white/55",
    avatarBox: "!h-10 !w-10 !rounded-full !border !border-[#00f0ff]/30",
  },
};

export function UserMenu(): ReactElement {
  return (
    <UserButton
      appearance={appearance}
      showName={false}
      userProfileMode="navigation"
      userProfileUrl="/workspace"
    />
  );
}