'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function SetupPage() {
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Setting up your account...');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function run() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if profile already exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        router.push('/dashboard');
        router.refresh();
        return;
      }

      // Run setup using metadata from signup
      const centerName = user.user_metadata?.center_name || 'My Practice';
      const fullName = user.user_metadata?.full_name || '';
      const slug = centerName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      setStatus('Creating your practice...');

      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          center_name: centerName,
          slug,
          full_name: fullName,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Failed to set up your account. Please try again.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    }

    run();
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-200 shadow-xl shadow-slate-200/50">
        <CardHeader className="text-center pb-2 pt-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white text-lg font-bold shadow-md shadow-indigo-200">
            CB
          </div>
          <CardTitle className="text-xl">
            {error ? 'Setup Error' : 'Setting Up'}
          </CardTitle>
          <CardDescription className="mt-2">
            {error ? error : status}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-8">
          {!error && <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />}
        </CardContent>
      </Card>
    </div>
  );
}
