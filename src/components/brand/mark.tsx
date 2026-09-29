import { cn } from "@/lib/utils";

export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-8", className)}
      fill="none"
    >
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.25" />
      <ellipse cx="16" cy="16" rx="5.2" ry="11" stroke="currentColor" strokeWidth="1.25" />
      <path d="M5 16h22" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="22.4" cy="11" r="1.7" fill="currentColor" />
    </svg>
  );
}
