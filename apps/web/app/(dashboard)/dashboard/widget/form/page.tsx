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
} from 'lucide-react';
import { SaveButton } from '@/components/ui/save-button';
import { PageHeader } from '@/components/dashboard/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getActiveServices } from '@/lib/queries/services';

interface CustomField {
  id: string;
  field_key: string | null;
  label: string;
  field_type: string;
  is_required: boolean;
  display_order: number;
  options: string[] | null;
  isNew?: boolean;
}

/** field_keys that are always present (managed outside presets/custom) */
const SYSTEM_FIELD_KEYS = new Set(['first_name', 'last_name', 'email', 'sms_opt_in', 'email_opt_in', 'communication_opt_in']);
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
  const [dataLoading, setDataLoading] = useState(true);

  // Track which presets are enabled
  const [enabledPresets, setEnabledPresets] = useState<Record<string, boolean>>({
    phone: false,
    date_of_birth: false,
    procedure: false,
  });

  useEffect(() => {
    if (!tenantId) return;
    async function load() {
      // Fetch existing form fields
      const { data: existingFields } = await supabase
        .from('form_fields')
        .select('id, field_key, label, field_type, is_required, display_order, options')
        .eq('tenant_id', tenantId)
        .order('display_order', { ascending: true });

      // Fetch active services for this tenant
      const svcList = await getActiveServices(supabase, tenantId!);
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
    allRows.push({ tenant_id: tenantId, field_key: 'communication_opt_in', label: 'Communication Opt-In', field_type: 'checkbox', placeholder: 'I agree to receive communications including appointment reminders, promotions, and special offers via email and SMS. Message & data rates may apply. Unsubscribe anytime.', is_required: false, display_order: 100, options: null });

    const { error: insertError } = await supabase.from('form_fields').insert(allRows);
    if (insertError) throw new Error(insertError.message);
  }

  if (loading || dataLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Form Fields" description="Configure the consultation form in your widget">
        <SaveButton onSave={handleSave} />
      </PageHeader>

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
    </div>
  );
}
