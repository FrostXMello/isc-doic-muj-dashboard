"use client";

import { fieldInputClass, fieldLabelClass } from "@/components/auth/auth-shell";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

export function PasswordField({
  name,
  label,
  autoComplete,
  invalid,
  describedBy,
  minLength,
}: {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  invalid?: boolean;
  describedBy?: string;
  minLength?: number;
}) {
  const id = useId();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={fieldLabelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(fieldInputClass, "pr-12")}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute top-[calc(50%+0.25rem)] right-1.5 flex size-9 -translate-y-1/2 items-center justify-center text-fg-subtle transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-cyan/40 focus-visible:outline-none"
        >
          {visible ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
        </button>
      </div>
    </div>
  );
}
