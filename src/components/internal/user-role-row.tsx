"use client";

import {
  adminButtonClass,
  adminInputClass,
  adminLabelClass,
} from "@/components/internal/create-user-form";
import { changeUserRole, deleteUserAccount, resetUserPassword } from "@/lib/auth/admin-actions";
import { MIN_ADMIN_PASSWORD_LENGTH, type RoleChangeState } from "@/lib/auth/form-state";
import { type AppRole, appRoles, roleLabels } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";
import { Check, KeyRound, LoaderCircle, Plus, Trash2 } from "lucide-react";
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
    <details className="w-full text-[13px] lg:basis-full">
      <summary className="cursor-pointer text-[12px] text-fg-subtle hover:text-foreground">
        Password and account
      </summary>
      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end">
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
        <form action={deleteAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="userId" value={user.id} />
          <label className="inline-flex items-center gap-1.5 text-[12px] text-fg-soft">
            <input type="checkbox" name="confirm" required className="accent-cyan" />
            Delete permanently
          </label>
          <button
            type="submit"
            disabled={deleting}
            className={cn(adminButtonClass, "hover:border-danger/60 hover:text-danger-fg")}
          >
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
    <li className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
      <div className="min-w-0">
        <p className="truncate text-[14px] text-foreground">
          {user.name ?? user.email ?? "Unnamed account"}
          {user.isSelf ? <span className="ml-2 text-[12px] text-fg-subtle">(you)</span> : null}
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
                  "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] transition-colors focus-visible:ring-2 focus-visible:ring-cyan/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
                  held
                    ? "border-cyan/50 bg-accent text-foreground hover:border-danger/50"
                    : "border-line text-fg-subtle hover:border-line-bold hover:text-foreground",
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
