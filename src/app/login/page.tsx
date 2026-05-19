export const dynamic = "force-dynamic";

import { LoginForm } from "./ui";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center p-6">
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Login Pengurus Perumahan</h1>
        <p className="mt-1 text-sm text-zinc-600">Masuk sebagai admin SiMas.</p>
        <LoginForm />
      </div>
    </main>
  );
}
