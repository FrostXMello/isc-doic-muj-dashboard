"use client";

import { createUserAccount } from "@/lib/auth/admin-actions";
import { MIN_ADMIN_PASSWORD_LENGTH, type RoleChangeState } from "@/lib/auth/form-state";
import { appRoles, roleLabels } from "@/lib/auth/roles";
import { LoaderCircle, UserPlus } from "lucide-react";
import { useActionState, useId } from "react";

export const adminInputClass =
  "mt-1 h-9 w-full rounded-lg border border-line bg-card px-3 text-[13px] text-foreground placeholder:text-fg-faint focus:border-cyan/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/30";
export const adminLabelClass = "block text-[12px] text-fg-soft";
export const adminButtonClass =
  "inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[13px] text-foreground transition-colors hover:border-line-bold focus-visible:ring-2 focus-visible:ring-cyan/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export function CreateUserForm() {
  const [state, action, pending] = useActionState<RoleChangeState, FormData>(createUserAccount, {});
  const id = useId();

  return (
    <form
      key={state.message}
      action={action}
      className="grid gap-4 px-5 py-4 sm:grid-cols-2"
      aria-busy={pending}
    >
      <div>
        <label htmlFor={`${id}-email`} className={adminLabelClass}>
          Email
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          required
          autoComplete="off"
          maxLength={254}
          className={adminInputClass}
        />
      </div>
      <div>
        <label htmlFor={`${id}-name`} className={adminLabelClass}>
          Name (optional)
        </label>
        <input
          id={`${id}-name`}
          name="fullName"
          type="text"
          autoComplete="off"
          maxLength={120}
          className={adminInputClass}
        />
      </div>
      <div>
        <label htmlFor={`${id}-password`} className={adminLabelClass}>
          Temporary password (at least {MIN_ADMIN_PASSWORD_LENGTH} characters)
        </label>
        <input
          id={`${id}-password`}
          name="password"
          type="password"
          required
          autoComplete="new-password"
          minLength={MIN_ADMIN_PASSWORD_LENGTH}
          maxLength={72}
          className={adminInputClass}
        />
      </div>
      <fieldset>
        <legend className={adminLabelClass}>Access</legend>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          {appRoles.map((role) => (
            <label key={role} className="inline-flex items-center gap-1.5 text-[13px] text-foreground">
              <input type="checkbox" name="roles" value={role} className="accent-cyan" />
              {roleLabels[role]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={adminButtonClass}>
          {pending ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <UserPlus className="size-3.5" aria-hidden />
          )}
          Create account
        </button>
        {state.error ? (
          <p role="alert" className="text-[12px] text-danger-fg">
            {state.error}
          </p>
        ) : state.message ? (
          <p role="status" className="text-[12px] text-success-fg">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
