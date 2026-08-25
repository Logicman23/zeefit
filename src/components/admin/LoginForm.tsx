"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signIn, type SignInState } from "@/app/admin/auth-actions";
import { Button, Field, inputClass } from "./ui";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Signing in…" : "Sign in"}
    </Button>
  );
}

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState<SignInState, FormData>(signIn, {});

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />

      <Field label="Email" htmlFor="email" required>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={inputClass(Boolean(state.error))}
          placeholder="you@zeefit.ae"
        />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass(Boolean(state.error))}
        />
      </Field>

      {state.error && (
        <p
          className="rounded-[2px] border border-alert/30 bg-alert/5 px-3 py-2.5 text-[0.8125rem] text-alert"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
