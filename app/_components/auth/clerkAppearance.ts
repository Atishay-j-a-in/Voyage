import { dark, neobrutalism } from "@clerk/ui/themes";

/**
 * Shared Clerk appearance for Voyage auth pages.
 *
 * - `cssLayerName: "clerk"` pairs with the `@layer clerk` declaration in
 *   `app/globals.css` so Tailwind v4 utilities can override Clerk styles
 *   without specificity wars.
 * - `theme: [dark, neobrutalism]` layers dark first so neobrutalism can
 *   selectively override the border / shadow treatments.
 * - Variables are tuned for the Voyage palette (neon cyan primary,
 *   white text, transparent surfaces).
 * - Elements force a dark surface everywhere (card, footer, social
 *   buttons, inputs, labels) so no white card escapes the theme.
 */
export const voyageAuthAppearance: { theme: Array<typeof dark>; cssLayerName: string; socialButtonsVariant: "iconButton" | "blockButton" | "auto"; socialButtonsPlacement: "top" | "bottom"; variables: object; elements: object } = {
  theme: [dark, neobrutalism] as Array<typeof dark>,
  cssLayerName: "clerk",
  socialButtonsVariant: "iconButton",
  socialButtonsPlacement: "top",
  variables: {
    colorPrimary: "#00f0ff",
    colorBackground: "transparent",
    colorInput: "rgba(255,255,255,0.04)",
    colorInputForeground: "#ffffff",
    colorForeground: "#ffffff",
    colorMutedForeground: "rgba(255,255,255,0.7)",
    colorNeutral: "rgba(255,255,255,0.08)",
    colorMuted: "rgba(255,255,255,0.05)",
    colorShimmer: "rgba(255,255,255,0.1)",
    colorRing: "rgba(0, 240, 255, 0.4)",
    colorDanger: "#ff5470",
    colorSuccess: "#22c543",
    colorWarning: "#f36b16",
    borderRadius: "12px",
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    fontFamilyButtons: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
    fontSize: "14px",
  },
  elements: {
    cardBox: "bg-transparent shadow-none border-0 rounded-2xl text-white",
    card: "bg-transparent shadow-none text-white",
    headerTitle: "text-white text-xl font-semibold tracking-[-0.02em]",
    headerSubtitle: "text-white/60 text-sm",
    socialButtons:
      "flex flex-row gap-3 [&>button]:!bg-white/[0.04] [&>button]:!border [&>button]:!border-white/10 [&>button]:!text-white [&>button]:!rounded-xl [&>button]:!h-11 [&>button:hover]:!bg-white/[0.08]",
    socialButtonsBlockButton:
      "bg-white/[0.04] border border-white/10 text-white rounded-full h-12 w-12 p-0 hover:bg-white/[0.08] normal-case text-sm font-medium flex items-center justify-center shrink-0",
    socialButtonsBlockButtonText: "sr-only",
    socialButtonsIcon: "[&_img]:!invert-0 [&_img]:!brightness-100",
    dividerLine: "bg-white/10",
    dividerText: "text-white/45 text-xs uppercase tracking-widest",
    formFieldLabel: "text-white/80 text-xs font-medium tracking-wide",
    formFieldInput:
      "!bg-white/[0.04] !border !border-white/10 !text-white !rounded-xl !h-11 placeholder:!text-white/40 focus:!border-[#00f0ff]/60",
    formFieldInputShowPasswordButton: "text-white/55 hover:text-white",
    formFieldAction: "text-[#00f0ff] text-xs hover:underline",
    formFieldErrorText: "text-red-400 text-xs",
    formButtonPrimary:
      "!bg-transparent !text-[#00f0ff] !border !border-[#00f0ff]/55 !rounded-full !h-12 !text-sm !font-semibold hover:!bg-[#00f0ff] hover:!text-black",
    footer: "!bg-transparent !border-0",
    footerAction: "!bg-transparent",
    footerActionText: "text-white/60",
    footerActionLink: "text-[#00f0ff] font-semibold hover:underline",
    identityPreview: "!bg-white/[0.04] !border !border-white/10 !rounded-xl",
    identityPreviewEditButton: "text-white/70 hover:text-white",
    otpCodeFieldInput:
      "!bg-white/[0.04] !border !border-white/10 !text-white !rounded-lg",
    badge: "!bg-[#00f0ff]/10 !text-[#00f0ff] !border !border-[#00f0ff]/30",
    alert: "!bg-white/[0.04] !border !border-white/10 !text-white",
    alertText: "text-white/85",
    developerFooter: "hidden",
  },
};