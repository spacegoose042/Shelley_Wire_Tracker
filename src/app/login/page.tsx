"use client";

import { signIn } from "next-auth/react";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const authError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const errorMessage =
    error ||
    (authError === "Configuration"
      ? "Server sign-in is misconfigured. Please contact support."
      : authError
        ? "Sign-in error. Please try again."
        : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-shelley-gray-light/50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          {logoError ? (
            <span className="text-2xl font-bold text-shelley-blue">Shelley Electric</span>
          ) : (
            <Image
              src="/logo.png"
              alt="Shelley Electric"
              width={280}
              height={80}
              className="h-16 w-auto object-contain"
              priority
              unoptimized
              onError={() => setLogoError(true)}
            />
          )}
        </div>
        <div className="card">
          <h1 className="mb-6 text-center text-xl font-semibold text-shelley-blue">
            Wire Tracker – Sign in
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-shelley-gray">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@shelleyelectric.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-shelley-gray">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
                autoComplete="current-password"
              />
            </div>
            {errorMessage && (
              <p className="text-sm text-shelley-red" role="alert">
                {errorMessage}
              </p>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-shelley-gray">
          Shelley Electric · Wichita, Kansas
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
