"use client";

import { createUserAccount } from "@/lib/auth/admin-actions";
import { MIN_ADMIN_PASSWORD_LENGTH, type RoleChangeState } from "@/lib/auth/form-state";
import { appRoles, roleLabels } from "@/lib/auth/roles";
import { buttonClass, checkboxClass, inputBaseClass } from "@/components/internal/ui/button-styles";
import { cn } from "@/lib/utils";
import { CheckCircle2, LoaderCircle, TriangleAlert, UserPlus } from "lucide-react";
import { useActionState, useId } from "react";

export const adminInputClass = cn(inputBaseClass, "mt-1.5 h-10");
export const adminLabelClass = "block text-[12px] font-medium tracking-[0.01em] text-fg-soft";
export const adminButtonClass = buttonClass("secondary");

export function CreateUserForm() {
  const [state, action, pending] = useActionState<RoleChangeState, FormData>(createUserAccount, {});
  const id = useId();

  return (
    <form
      key={state.message}
      action={action}
      className="grid gap-5 px-6 pt-2 pb-6 sm:grid-cols-2"
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
        <div className="mt-2 flex flex-wrap gap-2">
          {appRoles.map((role) => (
            <label
              key={role}
              className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-line-strong px-3 text-[13px] text-foreground transition-colors hover:border-muj/50 has-[:checked]:border-muj/70 has-[:checked]:bg-muj/[0.08] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
            >
              <input type="checkbox" name="roles" value={role} className={checkboxClass} />
              {roleLabels[role]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? (
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
          ) : (
            <UserPlus className="size-3.5" aria-hidden />
          )}
          {pending ? "Creating…" : "Create account"}
        </button>
        {state.error ? (
          <p role="alert" className="inline-flex items-center gap-1.5 text-[12px] text-danger-fg">
            <TriangleAlert className="size-3.5" aria-hidden />
            {state.error}
          </p>
        ) : state.message ? (
          <p role="status" className="inline-flex items-center gap-1.5 text-[12px] text-success-fg">
            <CheckCircle2 className="size-3.5" aria-hidden />
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
