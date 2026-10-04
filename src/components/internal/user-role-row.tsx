"use client";

import {
  adminButtonClass,
  adminInputClass,
  adminLabelClass,
} from "@/components/internal/create-user-form";
import { changeUserRole, deleteUserAccount, resetUserPassword } from "@/lib/auth/admin-actions";
import { MIN_ADMIN_PASSWORD_LENGTH, type RoleChangeState } from "@/lib/auth/form-state";
import { type AppRole, appRoles, roleLabels } from "@/lib/auth/roles";
import { buttonClass } from "@/components/internal/ui/button-styles";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, KeyRound, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { useActionState, useId } from "react";

export type ManagedUser = {
  id: string;
  name: string | null;
  email: string | null;
  roles: AppRole[];
  isSelf: boolean;
};

function ActionResult({ state }: { state: RoleChangeState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-[12px] text-danger-fg">
        {state.error}
      </p>
    );
  }
  if (state.message) {
    return (
      <p role="status" className="text-[12px] text-success-fg">
        {state.message}
      </p>
    );
  }
  return null;
}

function AccountControls({ user }: { user: ManagedUser }) {
  const [resetState, resetAction, resetting] = useActionState<RoleChangeState, FormData>(
    resetUserPassword,
    {},
  );
  const [deleteState, deleteAction, deleting] = useActionState<RoleChangeState, FormData>(
    deleteUserAccount,
    {},
  );
  const id = useId();

  return (
    <details className="group/details w-full text-[13px] lg:basis-full">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-full text-[12px] text-fg-subtle transition-colors hover:text-foreground [&::-webkit-details-marker]:hidden">
        <ChevronRight className="size-3.5 transition-transform group-open/details:rotate-90 motion-reduce:transition-none" aria-hidden />
        Password and account
      </summary>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <form action={resetAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <div>
            <label htmlFor={`${id}-pw`} className={adminLabelClass}>
              New password
            </label>
            <input
              id={`${id}-pw`}
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={MIN_ADMIN_PASSWORD_LENGTH}
              maxLength={72}
              className={adminInputClass}
            />
          </div>
          <button type="submit" disabled={resetting} className={adminButtonClass}>
            <KeyRound className="size-3.5" aria-hidden />
            Set password
          </button>
          <ActionResult state={resetState} />
        </form>
        <form
          action={deleteAction}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-danger/30 px-4 py-3"
        >
          <input type="hidden" name="userId" value={user.id} />
          <label className="inline-flex items-center gap-2 text-[12px] text-fg-soft">
            <input type="checkbox" name="confirm" required className="size-4 rounded accent-[var(--danger)]" />
            I understand this deletes the account permanently
          </label>
          <button type="submit" disabled={deleting} className={buttonClass("danger", "sm")}>
            <Trash2 className="size-3.5" aria-hidden />
            Delete account
          </button>
          <ActionResult state={deleteState} />
        </form>
      </div>
    </details>
  );
}

export function UserRoleRow({ user, accountAdmin }: { user: ManagedUser; accountAdmin: boolean }) {
  const [state, action, pending] = useActionState<RoleChangeState, FormData>(changeUserRole, {});

  return (
    <li className="portal-row-marker flex flex-col gap-3 px-6 py-5 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muj/[0.12] font-display text-[13px] font-medium text-muj-fg uppercase"
        >
          {(user.name ?? user.email ?? "?").trim().charAt(0)}
        </span>
        <div className="min-w-0">
        <p className="truncate text-[14px] font-medium text-foreground">
          {user.name ?? user.email ?? "Unnamed account"}
          {user.isSelf ? (
            <span className="ml-2 rounded-full bg-overlay px-2 py-0.5 text-[11px] font-normal text-fg-subtle">You</span>
          ) : null}
        </p>
        {user.name && user.email ? (
          <p className="truncate text-[12px] text-muted-foreground">{user.email}</p>
        ) : null}
        {user.roles.length === 0 ? (
          <p className="mt-0.5 text-[12px] text-warning-fg">No access assigned</p>
        ) : null}
        {state.error ? (
          <p role="alert" className="mt-1 text-[12px] text-danger-fg">
            {state.error}
          </p>
        ) : state.message ? (
          <p role="status" className="mt-1 text-[12px] text-success-fg">
            {state.message}
          </p>
        ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2" aria-busy={pending}>
        {appRoles.map((role) => {
          const held = user.roles.includes(role);
          const locked = held && role === "doic_admin" && user.isSelf;
          return (
            <form key={role} action={action}>
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="role" value={role} />
              <input type="hidden" name="intent" value={held ? "revoke" : "grant"} />
              <button
                type="submit"
                disabled={pending || locked}
                aria-pressed={held}
                title={
                  locked
                    ? "You can't remove your own DoIC admin access"
                    : held
                      ? `Remove ${roleLabels[role]}`
                      : `Grant ${roleLabels[role]}`
                }
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60",
                  held
                    ? "border-muj/60 bg-muj/[0.1] font-medium text-foreground hover:border-danger/50"
                    : "border-dashed border-line-strong text-fg-subtle hover:border-muj/50 hover:text-foreground",
                )}
              >
                {pending ? (
                  <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                ) : held ? (
                  <Check className="size-3.5" aria-hidden />
                ) : (
                  <Plus className="size-3.5" aria-hidden />
                )}
                {roleLabels[role]}
              </button>
            </form>
          );
        })}
      </div>
      {accountAdmin && !user.isSelf ? <AccountControls user={user} /> : null}
    </li>
  );
}
