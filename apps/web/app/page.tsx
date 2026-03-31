'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  X,
  Palette,
  Code,
  BarChart3,
  Globe,
  Zap,
  Send,
  Mail,
  Layers,
  Users,
  Target,
} from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'Pricing', href: '#pricing' },
];

const FEATURES = [
  {
    icon: Target,
    title: 'Interactive Body Map',
    description:
      'Patients visually select the areas they want to address. An intuitive, guided experience that captures precise treatment interest.',
  },
  {
    icon: Users,
    title: 'Smart Pre-Qualification',
    description:
      'Go beyond basic contact forms. Capture body regions, specific concerns, and treatment preferences so your team knows exactly what to discuss.',
  },
  {
    icon: Zap,
    title: 'Marketing-First',
    description:
      'Built to work with your ad platforms and landing pages. Embed on any page, track conversions, and attribute leads to campaigns.',
  },
  {
    icon: Palette,
    title: 'Custom Branding',
    description:
      'Match your practice\'s look and feel. Custom colors, logos, fonts, CTAs — your widget, your brand.',
  },
  {
    icon: Layers,
    title: 'Multi-Location Support',
    description:
      'Manage multiple clinics from a single dashboard. Each location gets its own widget configuration, team access, and lead pipeline.',
  },
  {
    icon: Send,
    title: 'Webhooks & Data Routing',
    description:
      'Send submission data anywhere. Connect to your CRM, trigger email notifications, or pipe data to Slack — all through webhooks.',
  },
];

const INTEGRATIONS = [
  {
    category: 'Website Platforms',
    items: ['WordPress', 'Squarespace', 'Wix', 'Webflow', 'Custom HTML'],
  },
  {
    category: 'Communication',
    items: ['Email', 'Slack', 'SMS', 'WhatsApp'],
  },
  {
    category: 'CRM & Marketing',
    items: ['Webhooks', 'Zapier', 'HubSpot', 'Salesforce'],
  },
  {
    category: 'Data & Developer',
    items: ['REST API', 'CSV Export', 'Custom Webhooks', 'Embeds'],
  },
];

const PRICING_TIER = {
  name: 'Enterprise',
  price: 'Custom',
  period: '',
  description: 'Tailored for your practice. Custom integrations, dedicated support, and everything you need to convert visitors into patients.',
  features: [
    'Unlimited locations',
    'Unlimited widgets & submissions',
    'Custom integrations & API',
    'Dedicated account manager',
    'Full branding control',
    'Analytics dashboard',
    'SSO & advanced security',
    'Custom SLA',
  ],
  cta: 'Contact Sales',
};

const FAQ_ITEMS = [
  {
    q: 'How does Consult Intake work?',
    a: 'Patients interact with a visual body diagram on your website, selecting the areas they want to address and their specific concerns. This pre-qualifies them before they ever speak with your team — so every consultation starts informed.',
  },
  {
    q: 'How long does it take to set up?',
    a: "Most practices are live within 15 minutes. Configure your procedures and concerns, customize your branding, and embed a single line of code on your website. That's it.",
  },
  {
    q: 'Can I customize the widget to match my brand?',
    a: "Absolutely. You have full control over colors, logos, fonts, CTA text, and more. The widget is designed to look native to your site, not like a third-party tool.",
  },
  {
    q: 'What data does the widget capture?',
    a: "Each submission includes the patient's selected body regions, specific concerns, treatment interests, and contact information — including any custom fields you configure.",
  },
  {
    q: 'How do I embed it on my website?',
    a: 'Copy a single script tag and paste it into your website HTML. Works with WordPress, Squarespace, Wix, Webflow, and any custom-built site.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes. Every plan includes a 14-day free trial with full access to all features. No credit card required to start.',
  },
];

// ── Section Number Badge ──────────────────────────────────────────────────────

function SectionBadge({ number }: { number: string }) {
  return (
    <span className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono font-semibold text-slate-400 mb-4">
      {number}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1330px] items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">
              CB
            </div>
            <span className="text-base font-semibold text-slate-900">Consult Intake</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Try it free
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-6 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-slate-600 py-2.5"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <Link href="/login" className="text-sm font-medium text-slate-600">
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white"
              >
                Try it free
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 px-6">
        <div className="mx-auto max-w-3xl text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 mb-6">
            <span className="text-xs font-semibold text-indigo-600">
              Built for med spas & plastic surgery
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[56px] lg:leading-[1.08]">
            Pre-qualify patients{' '}
            <span className="text-indigo-600">before</span> they ever
            pick up the phone
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500 max-w-xl mx-auto">
            The interactive consultation widget that captures treatment interest,
            qualifies leads, and gives your team the context they need to close —
            from the very first call.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-colors gap-2"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-200 px-6 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* ── Trust bar ────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50/50 py-8 px-6">
        <div className="mx-auto max-w-[1330px] text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-6">
            Works with your existing tech stack
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {['WordPress', 'Webflow', 'Squarespace', 'Wix', 'HubSpot', 'Zapier'].map(
              (name) => (
                <span
                  key={name}
                  className="text-sm font-semibold text-slate-300 tracking-wide"
                >
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── How It Works [01] ────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-28 px-6">
        <div className="mx-auto max-w-[1330px]">
          <SectionBadge number="01" />
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl max-w-lg">
            Live in minutes, not months
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl">
            Three steps to start pre-qualifying patients from your website.
          </p>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold mb-5">
                1
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Choose your specialty
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Select whether you&apos;re a med spa, plastic surgery clinic, or
                multi-specialty practice. Configure the procedures and services you offer.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold mb-5">
                2
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Build your widget
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Customize your consultation builder with brand colors, body regions,
                qualifying concerns, and custom intake fields. Preview it in real time.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold mb-5">
                3
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Embed &amp; capture
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                Drop a single line of code on your site. Start capturing pre-qualified
                leads with body areas, concerns, and contact info — instantly.
              </p>
            </div>
          </div>

          {/* Code snippet preview */}
          <div className="mt-12 rounded-xl border border-slate-200 bg-slate-950 p-5 max-w-2xl">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            </div>
            <code className="text-sm text-slate-300 font-mono">
              <span className="text-slate-500">&lt;!-- Add to your website --&gt;</span>
              <br />
              <span className="text-indigo-400">&lt;script</span>{' '}
              <span className="text-green-400">src</span>
              <span className="text-slate-400">=</span>
              <span className="text-amber-300">&quot;https://cdn.consultintake.com/widget.js&quot;</span>
              <br />
              {'  '}
              <span className="text-green-400">data-slug</span>
              <span className="text-slate-400">=</span>
              <span className="text-amber-300">&quot;your-practice&quot;</span>
              <span className="text-indigo-400">&gt;&lt;/script&gt;</span>
            </code>
          </div>
        </div>
      </section>

      {/* ── Features [02] ────────────────────────────────────────────── */}
      <section id="features" className="py-20 sm:py-28 px-6 landing-dots">
        <div className="mx-auto max-w-[1330px]">
          <SectionBadge number="02" />
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl max-w-lg">
            Everything you need to convert visitors into patients
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl">
            A complete platform for building, customizing, and managing consultation
            widgets that integrate seamlessly with your website.
          </p>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md hover:border-indigo-200 transition-all"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Dark Differentiator ──────────────────────────────────────── */}
      <section className="bg-slate-950 py-20 sm:py-28 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 mb-8">
            <span className="text-xs font-semibold text-indigo-400">Why Consult Intake</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Stop collecting forms.{' '}
            <span className="text-indigo-400">Start qualifying patients.</span>
          </h2>
          <p className="mt-8 text-base leading-relaxed text-slate-400 max-w-2xl mx-auto">
            Traditional intake forms are blind. They capture a name and email but tell
            your team nothing about what the patient actually wants. Consult Intake
            changes that. Every submission arrives with the patient&apos;s selected body
            areas, specific concerns, and treatment interests — so your consultants can
            have informed, productive conversations from the very first call.
          </p>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-white">3x</p>
              <p className="text-sm text-slate-500 mt-1">Higher conversion rate</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">68%</p>
              <p className="text-sm text-slate-500 mt-1">Faster consultation prep</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">&lt;15min</p>
              <p className="text-sm text-slate-500 mt-1">Setup time</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Integrations [03] ────────────────────────────────────────── */}
      <section id="integrations" className="py-20 sm:py-28 px-6">
        <div className="mx-auto max-w-[1330px]">
          <SectionBadge number="03" />
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl max-w-lg">
            Connects to everything you already use
          </h2>
          <p className="mt-4 text-lg text-slate-500 max-w-xl">
            Embed on any website. Route data to any system. Built for your existing
            workflow, not against it.
          </p>

          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {INTEGRATIONS.map((group) => (
              <div key={group.category}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                  {group.category}
                </h3>
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500 shrink-0">
                        {item === 'Email' ? (
                          <Mail className="h-4 w-4" />
                        ) : item === 'Slack' ? (
                          <Send className="h-4 w-4" />
                        ) : item === 'REST API' || item === 'Webhooks' || item === 'Custom Webhooks' ? (
                          <Code className="h-4 w-4" />
                        ) : item === 'CSV Export' ? (
                          <BarChart3 className="h-4 w-4" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                      </div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Embed highlight */}
          <div className="mt-14 rounded-xl border border-indigo-100 bg-indigo-50/50 p-8 sm:p-10 flex flex-col sm:flex-row items-start gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shrink-0">
              <Code className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Embed anywhere with one line of code
              </h3>
              <p className="text-sm leading-relaxed text-slate-500 max-w-xl">
                Your consultation widget works on WordPress, Squarespace, Wix, Webflow,
                and any custom HTML site. Just paste a script tag and you&apos;re live.
                No iframes, no plugins, no developer required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing [04] ─────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28 px-6 bg-slate-50/50">
        <div className="mx-auto max-w-[1330px]">
          <div className="text-center mb-14">
            <SectionBadge number="04" />
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Enterprise pricing
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-xl mx-auto">
              Custom plans tailored to your practice. Get in touch and we&apos;ll build the right package for you.
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="rounded-xl border border-indigo-600 bg-white shadow-lg shadow-indigo-600/10 ring-1 ring-indigo-600 p-6 sm:p-8 flex flex-col">
              <h3 className="text-lg font-semibold text-slate-900">{PRICING_TIER.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">{PRICING_TIER.price}</span>
              </div>
              <p className="mt-3 text-sm text-slate-500">{PRICING_TIER.description}</p>

              <ul className="mt-6 space-y-3 flex-1">
                {PRICING_TIER.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="#"
                className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                {PRICING_TIER.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ [05] ─────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-14">
            <SectionBadge number="05" />
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Frequently asked questions
            </h2>
          </div>

          <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between py-5 text-left"
                >
                  <span className="text-sm font-semibold text-slate-900 pr-8">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    openFaq === i ? 'max-h-96 pb-5' : 'max-h-0'
                  }`}
                >
                  <p className="text-sm leading-relaxed text-slate-500">{item.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="bg-slate-950 py-20 sm:py-28 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to transform your patient intake?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-400 max-w-lg mx-auto">
            Join practices that are pre-qualifying patients, reducing no-shows, and
            building a pipeline their teams love.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors gap-2"
            >
              Start Free Trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-slate-700 px-6 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              View pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-10 px-6">
        <div className="mx-auto max-w-[1330px]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-white text-[10px] font-bold">
                CB
              </div>
              <span className="text-sm font-semibold text-slate-700">Consult Intake</span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <Link
                href="/login"
                className="text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                Log in
              </Link>
            </div>

            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} Consult Intake. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
