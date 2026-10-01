export type SignInState = { error?: string; email?: string };

export type PasswordResetRequestState = { error?: string; sent?: boolean; email?: string };

export type PasswordUpdateState = { error?: string; expired?: boolean };

export type RoleChangeState = { error?: string; message?: string };

export const authMessages = {
  invalidCredentials: "Invalid email or password.",
  network: "We couldn't reach the sign-in service. Check your connection and try again.",
  rateLimited: "Too many attempts. Please wait a few minutes and try again.",
  unavailable: "Sign-in is not available right now. Please try again later.",
  resetSent:
    "If an account exists for this email, you will receive password reset instructions.",
  linkExpired: "This password reset link is invalid or has expired. Request a new one.",
} as const;
