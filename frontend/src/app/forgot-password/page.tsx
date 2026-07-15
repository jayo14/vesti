"use client";

import { useState } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/auth-layout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ detail: string; uid?: string; token?: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      footer={
        <Link href="/sign-in" className="font-medium text-brand-600 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>We&apos;ll help you reset it</CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-3">
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                {result.detail}
              </p>
              {result.uid && result.token ? (
                <Link
                  href={`/reset-password?uid=${result.uid}&token=${result.token}`}
                  className="block w-full rounded-lg bg-brand-600 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  Continue to reset password
                </Link>
              ) : (
                <p className="text-sm text-neutral-500">
                  If your email is registered, a reset link is on its way.
                </p>
              )}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              {error ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              ) : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
