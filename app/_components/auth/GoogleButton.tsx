"use client";

import { GoogleMark } from "../voyage/shared/icons";

interface GoogleButtonProps {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}

/** "Continue with Google" pill button. Multicolor G mark + label. */
export function GoogleButton({
  onClick,
  loading = false,
  label = "Continue with Google",
}: GoogleButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full h-12 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] transition-colors duration-300 flex items-center justify-center gap-3 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <GoogleMark className="h-5 w-5" />
      <span>{loading ? "Connecting..." : label}</span>
    </button>
  );
}
