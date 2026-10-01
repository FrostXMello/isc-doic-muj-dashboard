"use client";

import { FormNotice, primaryActionClass } from "@/components/auth/auth-shell";
import { PasswordField } from "@/components/auth/password-field";
import { updatePassword } from "@/lib/auth/actions";
import type { PasswordUpdateState } from "@/lib/auth/form-state";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useActionState, useId } from "react";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<PasswordUpdateState, FormData>(updatePassword, {});
  const errorId = useId();
  const hintId = useId();

  return (
    <form action={action} className="space-y-5">
      {state.error ? (
        <FormNotice tone="error" id={errorId}>
          {state.error}
          {state.expired ? (
            <>
              {" "}
              <Link href="/forgot-password" className="underline underline-offset-4">
                Request a new link
              </Link>
            </>
          ) : null}
        </FormNotice>
      ) : null}
      <PasswordField
        name="password"
        label="New password"
        autoComplete="new-password"
        minLength={8}
        invalid={Boolean(state.error)}
        describedBy={state.error ? `${errorId} ${hintId}` : hintId}
      />
      <p id={hintId} className="-mt-3 text-[12px] leading-5 text-muted-foreground">
        At least 8 characters. A mix of letters, numbers, and symbols is strongest.
      </p>
      <PasswordField
        name="confirm"
        label="Confirm new password"
        autoComplete="new-password"
        minLength={8}
        invalid={Boolean(state.error)}
      />
      <button type="submit" disabled={pending} className={primaryActionClass}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
