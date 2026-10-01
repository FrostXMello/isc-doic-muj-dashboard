"use client";

import { signOut } from "@/lib/auth/actions";
import { LoaderCircle, LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

/** Compact always-visible sign-out control for portal bars; the label hides on narrow screens. */
export const signOutClass =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[12px] text-fg-soft transition-colors hover:border-line-bold hover:text-foreground disabled:opacity-60 [&>span]:hidden sm:[&>span]:inline";

function SubmitButton({ className, showIcon }: { className?: string; showIcon: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-label="Sign out" title="Sign out">
      {showIcon ? (
        pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <LogOut className="size-4" aria-hidden />
        )
      ) : null}
<span>{pending ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}

export function SignOutButton({
  className,
  showIcon = true,
}: {
  className?: string;
  showIcon?: boolean;
}) {
  return (
    <form action={signOut}>
      <SubmitButton className={className} showIcon={showIcon} />
    </form>
  );
}
