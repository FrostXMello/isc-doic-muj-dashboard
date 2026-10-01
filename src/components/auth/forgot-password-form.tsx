"use client";

import {
  FormNotice,
  fieldInputClass,
  fieldLabelClass,
  primaryActionClass,
} from "@/components/auth/auth-shell";
import { requestPasswordReset } from "@/lib/auth/actions";
import { type PasswordResetRequestState, authMessages } from "@/lib/auth/form-state";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useId } from "react";

export function ForgotPasswordForm({ notice }: { notice: React.ReactNode }) {
  const [state, action, pending] = useActionState<PasswordResetRequestState, FormData>(
    requestPasswordReset,
    {},
  );
  const emailId = useId();
  const errorId = useId();

  if (state.sent) {
    return (
      <div className="space-y-6">
        <FormNotice tone="success">{authMessages.resetSent}</FormNotice>
        <p className="text-[13px] leading-6 text-muted-foreground">
          The link expires after a short time and works in the browser you requested it from. If
          nothing arrives within a few minutes, check your spam folder or try again later.
        </p>
        <BackToSignIn />
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {state.error ? (
        <FormNotice tone="error" id={errorId}>
          {state.error}
        </FormNotice>
      ) : (
        notice
      )}
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
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
          className={fieldInputClass}
        />
      </div>
      <button type="submit" disabled={pending} className={primaryActionClass}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? "Sending…" : "Send reset instructions"}
      </button>
      <BackToSignIn />
    </form>
  );
}

function BackToSignIn() {
  return (
    <p className="text-center text-[13px]">
      <Link
        href="/login"
        className="text-fg-soft underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        Back to sign in
      </Link>
    </p>
  );
}
