'use client';

import { useEffect, useState } from 'react';
import { useUserTenant } from '@/hooks/use-user-tenant';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Lock,
  Plus,
  Trash2,
  Check,
  GripVertical,
  Phone,
  Calendar,
  Stethoscope,
  MapPin,
  Code,
  Copy,
  ShieldCheck,
} from 'lucide-react';
import { SaveButton } from '@/components/ui/save-button';
import { PageHeader } from '@/components/dashboard/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getActiveServices } from '@/lib/queries/services';
import { updateWidgetConfig } from '@/lib/queries/widget-config';
import type { FormProvider, SubmissionTarget } from '@treatment-builder/shared';

interface CustomField {
  id: string;
  field_key: string | null;
  label: string;
  field_type: string;
  is_required: boolean;
  display_order: number;
  options: string[] | null;
  placeholder?: string | null;
  isNew?: boolean;
}

/** field_keys that are always present (managed outside presets/custom) */
const SYSTEM_FIELD_KEYS = new Set(['first_name', 'last_name', 'email', 'sms_opt_in', 'email_opt_in', 'communication_opt_in']);

/** Default consent/opt-in text shown next to the communication checkbox. Editable per-tenant. */
const DEFAULT_CONSENT_TEXT = 'I agree to receive communications including appointment reminders, promotions, and special offers via email and SMS. Message & data rates may apply. Unsubscribe anytime.';
const PRESET_FIELD_KEYS = new Set(['phone', 'date_of_birth', 'procedure']);

interface PresetField {
  key: string;
  label: string;
  field_type: string;
  icon: React.ElementType;
  description: string;
  hasOptions?: boolean;
}

interface ActiveService {
  id: string;
  name: string;
  category_name: string;
}

const presetFields: PresetField[] = [
  {
    key: 'phone',
    label: 'Phone Number',
    field_type: 'phone',
    icon: Phone,
    description: 'Collect the visitor\'s phone number',
  },
  {
    key: 'date_of_birth',
    label: 'Date of Birth',
    field_type: 'date',
    icon: Calendar,
    description: 'Collect the visitor\'s date of birth',
  },
  {
    key: 'procedure',
    label: 'Procedure',
    field_type: 'select',
    icon: Stethoscope,
    description: 'Let visitors select a procedure of interest',
    hasOptions: true,
  },
  {
    key: 'location',
    label: 'Location',
    field_type: 'location',
    icon: MapPin,
    description: 'Let visitors choose a practice location',
  },
];

const fieldTypeStyles: Record<string, string> = {
  text: 'bg-blue-100 text-blue-700',
  email: 'bg-green-100 text-green-700',
  phone: 'bg-purple-100 text-purple-700',
  date: 'bg-orange-100 text-orange-700',
  textarea: 'bg-amber-100 text-amber-700',
  select: 'bg-teal-100 text-teal-700',
  checkbox: 'bg-pink-100 text-pink-700',
};

const defaultFields = [
  { label: 'First Name', type: 'text' },
  { label: 'Last Name', type: 'text' },
  { label: 'Email', type: 'email' },
];

export default function FormFieldsPage() {
  const { tenantId, supabase, loading } = useUserTenant();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [procedureOptions, setProcedureOptions] = useState<string[]>([]);
  const [newProcedure, setNewProcedure] = useState('');
  const [activeServices, setActiveServices] = useState<ActiveService[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [consentText, setConsentText] = useState<string>(DEFAULT_CONSENT_TEXT);
  const [dataLoading, setDataLoading] = useState(true);

  // Form provider: 'native' uses our built-in fields below; 'embed' renders a
  // third-party form (e.g. GHL) in an iframe so submissions never touch our backend.
  const [formProvider, setFormProvider] = useState<FormProvider>('native');
  const [embedFormUrl, setEmbedFormUrl] = useState('');
  const [embedFormHeight, setEmbedFormHeight] = useState(600);
  const [copied, setCopied] = useState(false);

  // Submission target (native form only): 'backend' sends to our backend (default,
  // submissions logged + webhook fan-out); 'webhook_direct' has the browser POST
  // straight to the CRM webhook so PHI never touches our infrastructure.
  const [submissionTarget, setSubmissionTarget] = useState<SubmissionTarget>('backend');
  const [crmWebhookUrl, setCrmWebhookUrl] = useState('');
  // Backend target only: whether leads are persisted to form_submissions.
  const [storeSubmissions, setStoreSubmissions] = useState(true);

  // Track which presets are enabled
  const [enabledPresets, setEnabledPresets] = useState<Record<string, boolean>>({
    phone: false,
    date_of_birth: false,
    procedure: false,
  });

  useEffect(() => {
    if (!tenantId) return;
    async function load() {
      // Fetch existing form fields and widget config (form provider settings) in parallel
      const [{ data: existingFields }, { data: widgetConfig }, svcList] = await Promise.all([
        supabase
          .from('form_fields')
          .select('id, field_key, label, field_type, is_required, display_order, options, placeholder')
          .eq('tenant_id', tenantId)
          .order('display_order', { ascending: true }),
        supabase
          .from('widget_configs')
          .select('form_provider, embed_form_url, embed_form_height, submission_target, crm_webhook_url, store_submissions')
          .eq('tenant_id', tenantId)
          .single(),
        getActiveServices(supabase, tenantId!),
      ]);

      if (widgetConfig) {
        setFormProvider((widgetConfig.form_provider as FormProvider) || 'native');
        setEmbedFormUrl(widgetConfig.embed_form_url || '');
        setEmbedFormHeight(widgetConfig.embed_form_height || 600);
        setSubmissionTarget((widgetConfig.submission_target as SubmissionTarget) || 'backend');
        setCrmWebhookUrl(widgetConfig.crm_webhook_url || '');
        setStoreSubmissions(widgetConfig.store_submissions !== false);
      }

      setActiveServices(svcList.map((s) => ({
        ...s,
        category_name: s.category_name ?? 'Uncategorized',
      })));

      const allFields = (existingFields ?? []) as CustomField[];

      // Detect which presets are already enabled
      const presetState: Record<string, boolean> = {
        phone: false,
        date_of_birth: false,
        procedure: false,
        location: false,
      };
      const customOnly: CustomField[] = [];
      const savedServiceNames = new Set<string>();

      // Labels that correspond to system fields (catches old rows without field_key)
      const SYSTEM_LABELS = new Set(['first name', 'last name', 'email', 'sms opt-in', 'email opt-in']);

      for (const f of allFields) {
        // Capture the per-tenant consent text from the opt-in row before skipping it.
        if (f.field_key === 'communication_opt_in') {
          setConsentText(f.placeholder?.trim() || DEFAULT_CONSENT_TEXT);
        }
        // Skip system fields by field_key or by label fallback
        if (f.field_key && SYSTEM_FIELD_KEYS.has(f.field_key)) continue;
        if (!f.field_key && SYSTEM_LABELS.has(f.label.toLowerCase())) continue;

        // Detect presets by field_key (reliable) or fallback to label matching
        if (f.field_key === 'phone' || (f.label === 'Phone Number' && f.field_type === 'phone')) {
          presetState.phone = true;
        } else if (f.field_key === 'date_of_birth' || (f.label === 'Date of Birth' && f.field_type === 'date')) {
          presetState.date_of_birth = true;
        } else if (f.field_key === 'procedure' || (f.label === 'Procedure' && f.field_type === 'select')) {
          presetState.procedure = true;
          const opts = f.options ?? [];
          setProcedureOptions(opts);
          for (const svc of svcList) {
            if (opts.includes(svc.name)) savedServiceNames.add(svc.id);
          }
        } else if (f.field_key === 'location' || (f.label === 'Location' && f.field_type === 'location')) {
          presetState.location = true;
        } else {
          customOnly.push(f);
        }
      }

      setSelectedServiceIds(savedServiceNames);
      setEnabledPresets(presetState);
      setFields(customOnly);
      setDataLoading(false);
    }

    load();
  }, [tenantId, supabase]);

  function toggleServiceOption(svc: ActiveService) {
    const next = new Set(selectedServiceIds);
    if (next.has(svc.id)) {
      next.delete(svc.id);
      setProcedureOptions(procedureOptions.filter((o) => o !== svc.name));
    } else {
      next.add(svc.id);
      if (!procedureOptions.includes(svc.name)) {
        setProcedureOptions([...procedureOptions, svc.name]);
      }
    }
    setSelectedServiceIds(next);
  }

  function addProcedureOption() {
    const trimmed = newProcedure.trim();
    if (!trimmed || procedureOptions.includes(trimmed)) return;
    setProcedureOptions([...procedureOptions, trimmed]);
    setNewProcedure('');
  }

  function removeProcedureOption(opt: string) {
    setProcedureOptions(procedureOptions.filter((o) => o !== opt));
    // Also deselect if it matches an active service
    const svc = activeServices.find((s) => s.name === opt);
    if (svc) {
      const next = new Set(selectedServiceIds);
      next.delete(svc.id);
      setSelectedServiceIds(next);
    }
  }

  function addCustomField() {
    const order =
      fields.length > 0
        ? Math.max(...fields.map((f) => f.display_order)) + 1
        : 100;
    setFields([
      ...fields,
      {
        id: `new-${Date.now()}`,
        field_key: null,
        label: '',
        field_type: 'text',
        is_required: false,
        display_order: order,
        options: null,
        isNew: true,
      },
    ]);
  }

  function updateField(id: string, updates: Partial<CustomField>) {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  }

  function removeField(id: string) {
    setFields(fields.filter((f) => f.id !== id));
  }

  async function handleSave() {
    if (!tenantId) return;

    // Save form provider + submission target settings on widget_configs.
    await updateWidgetConfig(supabase, tenantId, {
      form_provider: formProvider,
      embed_form_url: formProvider === 'embed' ? embedFormUrl.trim() || null : null,
      embed_form_height: embedFormHeight,
      submission_target: formProvider === 'native' ? submissionTarget : 'backend',
      store_submissions: storeSubmissions,
      crm_webhook_url:
        formProvider === 'native' && submissionTarget === 'webhook_direct'
          ? crmWebhookUrl.trim() || null
          : null,
    });

    // In embed mode the native fields are unused — leave them in place so
    // switching back to native preserves the practice's prior configuration.
    if (formProvider === 'embed') return;

    // Delete all existing form_fields for this tenant and re-insert
    const { error: delError } = await supabase.from('form_fields').delete().eq('tenant_id', tenantId);
    if (delError) throw new Error(delError.message);

    type FormFieldRow = {
      tenant_id: string;
      field_key: string | null;
      label: string;
      field_type: string;
      placeholder: string | null;
      is_required: boolean;
      display_order: number;
      options: string[] | null;
    };
    const allRows: FormFieldRow[] = [];
    let order = 0;

    // ── 1. Default system fields (always at the start) ──
    allRows.push({ tenant_id: tenantId, field_key: 'first_name', label: 'First Name', field_type: 'text', placeholder: 'Jane', is_required: true, display_order: order++, options: null });
    allRows.push({ tenant_id: tenantId, field_key: 'last_name', label: 'Last Name', field_type: 'text', placeholder: 'Doe', is_required: true, display_order: order++, options: null });
    allRows.push({ tenant_id: tenantId, field_key: 'email', label: 'Email', field_type: 'email', placeholder: 'jane@example.com', is_required: true, display_order: order++, options: null });

    // ── 2. Enabled preset fields ──
    if (enabledPresets.phone) {
      allRows.push({ tenant_id: tenantId, field_key: 'phone', label: 'Phone Number', field_type: 'phone', placeholder: '(555) 555-5555', is_required: false, display_order: order++, options: null });
    }
    if (enabledPresets.date_of_birth) {
      allRows.push({ tenant_id: tenantId, field_key: 'date_of_birth', label: 'Date of Birth', field_type: 'date', placeholder: null, is_required: false, display_order: order++, options: null });
    }
    if (enabledPresets.procedure) {
      allRows.push({ tenant_id: tenantId, field_key: 'procedure', label: 'Procedure', field_type: 'select', placeholder: null, is_required: false, display_order: order++, options: procedureOptions.length > 0 ? procedureOptions : null });
    }
    if (enabledPresets.location) {
      allRows.push({ tenant_id: tenantId, field_key: 'location', label: 'Location', field_type: 'location', placeholder: 'Select a location...', is_required: false, display_order: order++, options: null });
    }

    // ── 3. Custom fields ──
    for (const f of fields) {
      if (!f.label.trim()) continue;
      allRows.push({ tenant_id: tenantId, field_key: null, label: f.label.trim(), field_type: f.field_type, placeholder: null, is_required: f.is_required, display_order: order++, options: f.options });
    }

    // ── 4. Opt-in fields (always at the end) ──
    allRows.push({ tenant_id: tenantId, field_key: 'communication_opt_in', label: 'Communication Opt-In', field_type: 'checkbox', placeholder: consentText.trim() || DEFAULT_CONSENT_TEXT, is_required: false, display_order: 100, options: null });

    const { error: insertError } = await supabase.from('form_fields').insert(allRows);
    if (insertError) throw new Error(insertError.message);
  }

  if (loading || dataLoading) {
    return <LoadingSpinner />;
  }

  const thankYouSnippet = `<script>
  try { window.parent.postMessage('tb:embed-submitted', '*'); } catch (e) {}
</script>
<div style="padding:24px;text-align:center;color:#475569;font-family:system-ui,-apple-system,sans-serif">
  Thank you! One moment&hellip;
</div>`;

  async function copyThankYouSnippet() {
    try {
      await navigator.clipboard.writeText(thankYouSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be blocked; the user can copy manually.
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Form Fields" description="Configure the consultation form in your widget">
        <SaveButton onSave={handleSave} />
      </PageHeader>

      {/* Form Provider */}
      <Card>
        <CardHeader>
          <CardTitle>Form Provider</CardTitle>
          <CardDescription>
            Choose between our built-in form or embed a third-party form (e.g. GHL / aCRM) for HIPAA-friendly direct submission.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFormProvider('native')}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                formProvider === 'native'
                  ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${formProvider === 'native' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                <Stethoscope className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Native form</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Built-in fields, submissions stored in your dashboard.
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormProvider('embed')}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                formProvider === 'embed'
                  ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${formProvider === 'embed' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                <Code className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Embed third-party form</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  GHL, aCRM, etc. Data goes straight to your provider.
                </p>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {formProvider === 'embed' ? (
        <Card>
          <CardHeader>
            <CardTitle>Embedded Form Configuration</CardTitle>
            <CardDescription>
              Paste the iframe URL of your third-party form and configure the post-submit redirect.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-emerald-700" />
              <div className="text-xs text-emerald-900">
                <p className="font-medium">HIPAA: form data bypasses our backend.</p>
                <p className="mt-0.5">Submissions are sent directly from the visitor&apos;s browser to your form provider. We never receive, store, or process PHI from this form.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="embed-url">Form iframe URL</Label>
              <Input
                id="embed-url"
                type="url"
                value={embedFormUrl}
                onChange={(e) => setEmbedFormUrl(e.target.value)}
                placeholder="https://api.leadconnectorhq.com/widget/form/YOUR_FORM_ID"
                className="text-sm font-mono"
              />
              <p className="text-xs text-muted-foreground">
                In GHL, open your form &rarr; <span className="font-medium">Integrate</span> &rarr; copy the <span className="font-medium">iframe src</span> URL.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="embed-height">Form height (pixels)</Label>
              <Input
                id="embed-height"
                type="number"
                min={200}
                max={2000}
                value={embedFormHeight}
                onChange={(e) => setEmbedFormHeight(Number(e.target.value) || 600)}
                className="text-sm w-32"
              />
              <p className="text-xs text-muted-foreground">
                Set this tall enough for your form to render without an inner scrollbar.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Post-submit signal (paste into your provider&apos;s &ldquo;Thank You&rdquo; message)</Label>
              <div className="relative">
                <pre className="text-xs font-mono bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto whitespace-pre">
{thankYouSnippet}
                </pre>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyThankYouSnippet}
                  className="absolute top-2 right-2 bg-white"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                In GHL: open your form &rarr; <span className="font-medium">Settings</span> &rarr; <span className="font-medium">On Submit</span> &rarr; choose <span className="font-medium">Show Thank You Message</span> &rarr; switch the editor to HTML view and paste the snippet above. (Avoid the &ldquo;Redirect to URL&rdquo; option — GHL redirects the whole tab, which breaks the iframe.)
              </p>
              <p className="text-xs text-muted-foreground">
                After submit, the snippet runs inside the form iframe, the widget detects it, and advances to your success flow. The &ldquo;Already submitted? Continue&rdquo; link below the form is the manual fallback if something blocks the signal.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <NativeFormSections />
      )}
    </div>
  );

  function NativeFormSections() {
    return (<>
      {/* Submission Target */}
      <Card>
        <CardHeader>
          <CardTitle>Submission Destination</CardTitle>
          <CardDescription>
            Choose where the form data is sent when a visitor submits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSubmissionTarget('backend')}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                submissionTarget === 'backend'
                  ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${submissionTarget === 'backend' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                <Stethoscope className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Backend (default)</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Stored in your dashboard. Optional outbound webhook fan-out.
                </p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setSubmissionTarget('webhook_direct')}
              className={`flex items-start gap-3 rounded-lg border p-4 text-left transition-colors ${
                submissionTarget === 'webhook_direct'
                  ? 'border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${submissionTarget === 'webhook_direct' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                <Code className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Direct to CRM webhook</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Visitor&apos;s browser POSTs straight to your CRM. Bypasses our backend.
                </p>
              </div>
            </button>
          </div>

          {submissionTarget === 'backend' && (
            <div className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-4">
              <div className="flex-1">
                <p className="text-sm font-medium">Store leads in your dashboard</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  When on, submissions are saved to your Submissions tab (and you can delete them there). When off, leads are forwarded to your webhook only and never stored on our servers.
                </p>
              </div>
              <Switch
                checked={storeSubmissions}
                onCheckedChange={setStoreSubmissions}
              />
            </div>
          )}

          {submissionTarget === 'webhook_direct' && (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-3">
                <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0 text-emerald-700" />
                <div className="text-xs text-emerald-900">
                  <p className="font-medium">HIPAA: form data bypasses our backend.</p>
                  <p className="mt-0.5">Submissions are sent directly from the visitor&apos;s browser to your CRM webhook. We never receive, store, or process the data. Submissions will not appear in your Submissions tab; check your CRM for them.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="crm-webhook-url">CRM webhook URL</Label>
                <Input
                  id="crm-webhook-url"
                  type="url"
                  value={crmWebhookUrl}
                  onChange={(e) => setCrmWebhookUrl(e.target.value)}
                  placeholder="https://services.leadconnectorhq.com/hooks/.../webhook-trigger/..."
                  className="text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  In GHL: <span className="font-medium">Automations</span> &rarr; create a workflow with an <span className="font-medium">Inbound Webhook</span> trigger &rarr; copy the URL. The webhook must accept CORS POSTs (GHL&apos;s do by default).
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Payload your webhook will receive</Label>
                <pre className="text-xs font-mono bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto whitespace-pre">
{`{
  "first_name": "...",
  "last_name": "...",
  "email": "...",
  "phone": "...",
  "gender": "female",
  "location_id": "oklahoma_city",   // slug from Locations page (or UUID if no slug)
  "location_uuid": "...",            // underlying UUID, for reference
  "location_name": "Main, Oklahoma City, OK",
  "regions_summary": "Lower Face, Neck",
  "concerns_summary": "Jowls, Loose skin",
  "selected_regions": [...],
  "selected_concerns": [...],
  "utm_source": "...", "utm_medium": "...",
  "utm_campaign": "...", "utm_content": "...", "utm_term": "...",
  "gclid": "...", "fbclid": "...",
  "source_url": "...",           // page where they submitted
  "landing_page": "...",         // first page of session (with UTMs)
  "referrer": "...",             // referrer at session start
  "session_source": "Paid Search",   // one of: Paid Search, Social media,
                                  //          Email Marketing, Organic Search,
                                  //          Referral, Direct traffic
  "sms_opt_in": true, "email_opt_in": true
}`}
                </pre>
                <p className="text-xs text-muted-foreground">
                  Map these to your CRM custom fields in the workflow&apos;s inbound webhook trigger. Field names match what&apos;s shown above. <span className="font-medium">session_source</span> already maps to GHL&apos;s &ldquo;First/Last Attribution Session Source&rdquo; dropdown values directly.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Cross-page attribution (recommended)</Label>
                <p className="text-xs text-muted-foreground">
                  If visitors land on one page (e.g. <code className="px-1 bg-slate-100 rounded">/spring-offer?utm_source=google</code>) and click through to a clean URL where the widget lives, UTMs are lost from the URL by the time they submit. Install this one-line helper in the <code className="px-1 bg-slate-100 rounded">&lt;head&gt;</code> of every page on your site to preserve them for the full session:
                </p>
                <pre className="text-xs font-mono bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto whitespace-pre">{`<script src="https://www.consultintake.com/track.js" defer></script>`}</pre>
                <p className="text-xs text-muted-foreground">
                  The helper captures UTMs, click IDs, referrer, and landing page on the visitor&apos;s <span className="font-medium">first</span> page of a browser session and stores them in <code className="px-1 bg-slate-100 rounded">sessionStorage</code>. The widget reads from there first, falling back to the current URL otherwise. Safe to install everywhere — does nothing harmful if visitors don&apos;t reach the widget.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Default Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            Default Fields
          </CardTitle>
          <CardDescription>
            These fields are always present and cannot be removed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {defaultFields.map((field) => (
              <div
                key={field.label}
                className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {field.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={fieldTypeStyles[field.type] ?? ''}
                  >
                    {field.type}
                  </Badge>
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    Required
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preset Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Preset Fields</CardTitle>
          <CardDescription>
            Common fields you can quickly toggle on or off
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {presetFields.map((preset, index) => {
            const enabled = enabledPresets[preset.key];
            const Icon = preset.icon;
            return (
              <div key={preset.key}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        enabled
                          ? 'bg-indigo-100 text-indigo-600'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{preset.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {preset.description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={enabled}
                    onCheckedChange={(checked) =>
                      setEnabledPresets({ ...enabledPresets, [preset.key]: checked })
                    }
                  />
                </div>

                {/* Procedure options — connected to active services */}
                {preset.key === 'procedure' && enabled && (
                  <div className="ml-12 mt-3 space-y-4">
                    {/* Active services from the Services page */}
                    {activeServices.length > 0 ? (
                      <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          Your Active Services
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Select which of your active services appear in the procedure dropdown
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                          {activeServices.map((svc) => {
                            const isSelected = selectedServiceIds.has(svc.id);
                            return (
                              <button
                                key={svc.id}
                                type="button"
                                onClick={() => toggleServiceOption(svc)}
                                className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                                  isSelected
                                    ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div
                                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                    isSelected
                                      ? 'border-indigo-500 bg-indigo-500'
                                      : 'border-slate-300'
                                  }`}
                                >
                                  {isSelected && <Check className="h-3 w-3 text-white" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <span className="block truncate font-medium">{svc.name}</span>
                                  <span className="block truncate text-xs text-muted-foreground">
                                    {svc.category_name}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedServiceIds.size} of {activeServices.length} services selected
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-amber-300 bg-amber-50 p-3">
                        <p className="text-xs text-amber-700">
                          No active services found. Enable services on the{' '}
                          <a href="/dashboard/widget/services" className="underline font-medium">
                            Services &amp; Procedures
                          </a>{' '}
                          page first.
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* Custom procedure options */}
                    <div className="space-y-3">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Custom Procedures
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Add custom options that aren&apos;t in your services list
                      </p>
                      {procedureOptions.filter((opt) => !activeServices.some((s) => s.name === opt)).length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {procedureOptions
                            .filter((opt) => !activeServices.some((s) => s.name === opt))
                            .map((opt) => (
                              <Badge
                                key={opt}
                                variant="secondary"
                                className="gap-1 pr-1"
                              >
                                {opt}
                                <button
                                  type="button"
                                  onClick={() => removeProcedureOption(opt)}
                                  className="ml-1 rounded-full p-0.5 hover:bg-slate-200"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Input
                          value={newProcedure}
                          onChange={(e) => setNewProcedure(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addProcedureOption();
                            }
                          }}
                          placeholder="e.g. Custom Treatment Name..."
                          className="flex-1 text-sm"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addProcedureOption}
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {index < presetFields.length - 1 && <Separator className="mt-4" />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Custom Fields */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Custom Fields</CardTitle>
              <CardDescription>
                Add any additional fields to your consultation form
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addCustomField}>
              <Plus className="h-4 w-4" />
              Add Field
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {fields.length > 0 ? (
            <div className="space-y-3">
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center gap-3 rounded-md border p-3"
                >
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <Input
                    value={field.label}
                    onChange={(e) =>
                      updateField(field.id, { label: e.target.value })
                    }
                    placeholder="Field label"
                    className="flex-1 text-sm"
                  />
                  <select
                    value={field.field_type}
                    onChange={(e) =>
                      updateField(field.id, { field_type: e.target.value })
                    }
                    className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select</option>
                    <option value="checkbox">Checkbox</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="date">Date</option>
                  </select>
                  <div className="flex items-center gap-1.5">
                    <Switch
                      checked={field.is_required}
                      onCheckedChange={(checked) =>
                        updateField(field.id, { is_required: checked })
                      }
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      Required
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(field.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No custom fields added. Click &quot;Add Field&quot; to create one.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Communication Consent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            Communication Consent
          </CardTitle>
          <CardDescription>
            The consent text shown next to the opt-in checkbox at the bottom of your form. Use your practice&apos;s exact legal language.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label className="text-xs">Consent text</Label>
          <textarea
            value={consentText}
            onChange={(e) => setConsentText(e.target.value)}
            rows={5}
            placeholder={DEFAULT_CONSENT_TEXT}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Leave blank to use the default. This text is specific to your practice and is not shared with other accounts.
          </p>
        </CardContent>
      </Card>
    </>);
  }
}
