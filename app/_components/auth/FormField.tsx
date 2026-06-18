"use client";

import { useState, type ReactNode } from "react";
import { Eye, EyeOff } from "../voyage/shared/icons";

interface FormFieldProps {
  type: "email" | "password" | "text";
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
  autoComplete?: string;
  required?: boolean;
}

/** Reusable input row with leading + trailing slots. */
export function FormField({
  type,
  placeholder,
  value,
  onChange,
  leadingIcon,
  trailing,
  autoComplete,
  required,
}: FormFieldProps): React.ReactElement {
  return (
    <div className="h-12 rounded-xl border border-white/10 bg-white/[0.04] focus-within:border-[var(--accent-neon)]/60 focus-within:bg-white/[0.06] transition-colors duration-300 flex items-center gap-2 px-3">
      {leadingIcon ? (
        <span className="text-white/60 shrink-0 [&_svg]:h-4 [&_svg]:w-4">{leadingIcon}</span>
      ) : null}
      <input
        type={type === "password" ? "password" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="flex-1 bg-transparent outline-none text-white placeholder:text-white/40 text-sm"
      />
      {trailing}
    </div>
  );
}

interface PasswordFieldProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}

export function PasswordField({
  value,
  onChange,
  placeholder = "Password",
  autoComplete = "current-password",
}: PasswordFieldProps): React.ReactElement {
  const [show, setShow] = useState(false);
  return (
    <FormField
      type="password"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      trailing={
        <button
          type="button"
          aria-label={show ? "Hide password" : "Show password"}
          onClick={() => setShow((s) => !s)}
          className="text-white/55 hover:text-white/80 transition-colors shrink-0"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
}
