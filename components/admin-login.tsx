"use client";

import { useActionState } from "react";
import { signIn } from "@/app/admin/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function AdminLogin() {
  const [error, action, pending] = useActionState(signIn, "");
  return <form action={action} className="form-stack">
    <label>Administrator email<Input type="email" name="email" autoComplete="username" maxLength={254} required /></label>
    <label>Password<Input type="password" name="password" autoComplete="current-password" maxLength={256} required /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <Button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign In"}</Button>
  </form>;
}
