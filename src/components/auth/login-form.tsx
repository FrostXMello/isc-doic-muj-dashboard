"use client";

import {
  FormNotice,
  fieldInputClass,
  fieldLabelClass,
  primaryActionClass,
} from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { signIn } from "@/lib/auth/actions";
import type { SignInState } from "@/lib/auth/form-state";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useId } from "react";

export function LoginForm({ next, notice }: { next: string | null; notice: React.ReactNode }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, {});
  const emailId = useId();
  const errorId = useId();
  const invalid = Boolean(state.error);

  return (
    <form action={action} className="space-y-5">
      {state.error ? (
        <FormNotice tone="error" id={errorId}>
          {state.error}
        </FormNotice>
      ) : (
        notice
      )}

      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div>
        <label htmlFor={emailId} className={fieldLabelClass}>
          Email
        </label>
        <input
          id={emailId}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.email}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className={fieldInputClass}
        />
      </div>

      <PasswordField
        name="password"
        label="Password"
        autoComplete="current-password"
        invalid={invalid}
        describedBy={invalid ? errorId : undefined}
      />

      <div className="flex items-center justify-between gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-fg-soft select-none">
          <input
            type="checkbox"
            name="remember"
            defaultChecked={state.remember}
            className="size-4 cursor-pointer rounded border-line-bold accent-[var(--cyan)]"
          />
          Remember me
        </label>
        <Link
          href="/forgot-password"
          className="text-[13px] text-fg-soft underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <button type="submit" disabled={pending} className={primaryActionClass}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? "Signing in…" : "Sign In"}
      </button>
    </form>
  );
}
