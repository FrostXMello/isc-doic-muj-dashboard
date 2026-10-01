"use client";

import { signOut } from "@/lib/auth/actions";
import { LoaderCircle, LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";

function SubmitButton({ className, showIcon }: { className?: string; showIcon: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {showIcon ? (
        pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <LogOut className="size-4" aria-hidden />
        )
      ) : null}
      {pending ? "Signing out…" : "Sign out"}
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
