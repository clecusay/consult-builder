'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function SignupPage() {
  const [centerName, setCenterName] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: fullName,
          center_name: centerName,
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
      return;
    }

    // Create tenant and user profile via API
    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: authData.user.id,
        center_name: centerName,
        slug: generateSlug(centerName),
        full_name: fullName,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Failed to set up your account');
      setLoading(false);
      return;
    }

    if (authData.session) {
      // User was auto-confirmed (e.g., in development)
      router.push('/dashboard');
      router.refresh();
    } else {
      // Email confirmation required
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-200 shadow-xl shadow-slate-200/50">
          <CardHeader className="text-center pb-2 pt-8">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white text-lg font-bold shadow-md shadow-indigo-200">
              CB
            </div>
            <CardTitle className="text-xl">Check Your Email</CardTitle>
            <CardDescription className="mt-2">
              We sent a confirmation link to <strong className="text-slate-700">{email}</strong>. Please confirm your email to get started.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pb-8">
            <Link
              href="/login"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Back to login
            </Link>
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
          <CardTitle className="text-2xl font-bold text-slate-900">Create Your Account</CardTitle>
          <CardDescription className="mt-1">
            Set up your practice&apos;s consult builder
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-2">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="center-name" className="text-slate-700">Practice / Center Name</Label>
              <Input
                id="center-name"
                placeholder="Beverly Hills Plastic Surgery"
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                required
                className="h-10 border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full-name" className="text-slate-700">Your Name</Label>
              <Input
                id="full-name"
                placeholder="Dr. Jane Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-10 border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>
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
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="h-10 border-slate-200 focus-visible:ring-indigo-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-10 bg-indigo-500 hover:bg-indigo-600 text-white font-medium shadow-sm"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center pb-8 pt-6">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
