'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  async function handleMagicLink() {
    setError('');
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    setLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMagicLinkSent(true);
    setLoading(false);
  }

  if (magicLinkSent) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-200 shadow-xl shadow-slate-200/50">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white text-lg font-bold shadow-md shadow-indigo-200">
              CB
            </div>
            <CardTitle className="text-xl">Check Your Email</CardTitle>
            <CardDescription className="mt-2">
              We sent a magic link to <strong className="text-slate-700">{email}</strong>. Click the link in the email to sign in.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pb-8">
            <Button
              variant="ghost"
              onClick={() => setMagicLinkSent(false)}
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
            >
              Back to login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200 shadow-xl shadow-slate-200/50">
        <CardHeader className="text-center pb-2 pt-8 px-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white text-lg font-bold shadow-md shadow-indigo-200">
            CB
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">Welcome Back</CardTitle>
          <CardDescription className="mt-1">
            Sign in to your Consult Builder dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-2">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-10 bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-sm"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">or</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-10 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
            onClick={handleMagicLink}
            disabled={loading}
          >
            Send Magic Link
          </Button>
        </CardContent>
        <CardFooter className="justify-center pb-8 pt-4">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
