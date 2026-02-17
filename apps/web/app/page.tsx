import Link from 'next/link';
import { Code, Users, Layers } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-5 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white text-sm font-bold shadow-sm">
            CB
          </div>
          <span className="text-lg font-semibold text-white">Consult Builder</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-indigo-100 hover:text-white transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-9 items-center justify-center rounded-md bg-white/10 backdrop-blur-sm border border-white/20 px-4 text-sm font-medium text-white hover:bg-white/20 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-6 pt-24 pb-32 text-center overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-400/20 px-4 py-1.5 mb-8">
            <span className="text-sm font-medium text-indigo-300">Built for medical practices</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
            Consult{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Builder
            </span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-300 max-w-2xl mx-auto sm:text-xl">
            Create and embed beautiful consultation widgets on your website. Capture patient
            interest, manage leads, and grow your practice with a modern intake experience.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-500 px-8 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-600 px-8 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything you need to convert visitors into patients
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              A complete platform for building, customizing, and managing treatment consultation
              widgets that integrate seamlessly with your website.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 mb-5">
                <Code className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Embeddable Widget</h3>
              <p className="text-slate-500 leading-relaxed">
                Generate a fully customizable consultation widget that embeds into any website with a
                simple code snippet. Match your brand colors, customize fields, and go live in
                minutes.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 mb-5">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Lead Management</h3>
              <p className="text-slate-500 leading-relaxed">
                Track every consultation submission in real time. View patient details, body region
                selections, and concerns all from one centralized dashboard built for your team.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 mb-5">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Multi-Tenant</h3>
              <p className="text-slate-500 leading-relaxed">
                Manage multiple practice locations from a single account. Each tenant gets their own
                branding, team members, and widget configuration with full data isolation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-500 text-white text-xs font-bold">
              CB
            </div>
            <span className="text-sm font-medium text-slate-600">Consult Builder</span>
          </div>
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} Consult Builder. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
