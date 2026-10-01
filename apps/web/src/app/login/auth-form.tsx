"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch(`${apiUrl}/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: String(formData.get("email") ?? ""),
          password: String(formData.get("password") ?? ""),
          name: String(formData.get("name") ?? "") || undefined
        })
      });
      if (!response.ok) throw new Error("Authentication failed.");
      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={submit} className="mt-6">
      <div className="mb-4 grid grid-cols-2 rounded border border-ink/10 p-1 text-sm">
        <button className={`rounded px-3 py-2 ${mode === "login" ? "bg-ink text-white" : ""}`} onClick={() => setMode("login")} type="button">Login</button>
        <button className={`rounded px-3 py-2 ${mode === "register" ? "bg-ink text-white" : ""}`} onClick={() => setMode("register")} type="button">Register</button>
      </div>
      {mode === "register" ? (
        <label className="mb-3 block text-sm">
          <span className="mb-1 block font-medium text-ink/70">Name</span>
          <input className="h-10 w-full rounded border border-ink/15 px-3" name="name" />
        </label>
      ) : null}
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Email</span>
        <input className="h-10 w-full rounded border border-ink/15 px-3" name="email" required type="email" />
      </label>
      <label className="mb-3 block text-sm">
        <span className="mb-1 block font-medium text-ink/70">Password</span>
        <input className="h-10 w-full rounded border border-ink/15 px-3" minLength={8} name="password" required type="password" />
      </label>
      <button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-ink px-4 text-sm font-semibold text-white" disabled={pending} type="submit">
        {pending ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
        {mode === "login" ? "Login" : "Register"}
      </button>
      {message ? <p className="mt-3 text-sm text-rust">{message}</p> : null}
    </form>
  );
}

