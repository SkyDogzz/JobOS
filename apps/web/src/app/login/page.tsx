import { AuthForm } from "./auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-paper px-5 text-ink">
      <section className="w-full max-w-md rounded border border-ink/10 bg-white p-6">
        <h1 className="text-2xl font-semibold">JobOS</h1>
        <p className="mt-2 text-sm text-ink/60">Register or sign in to start a local session.</p>
        <AuthForm />
      </section>
    </main>
  );
}

