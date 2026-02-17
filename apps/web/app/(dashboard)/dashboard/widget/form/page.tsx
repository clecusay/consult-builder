'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
  Loader2,
  Save,
  Check,
  GripVertical,
  Phone,
  Calendar,
  Stethoscope,
} from 'lucide-react';

interface CustomField {
  id: string;
  label: string;
  field_type: string;
  is_required: boolean;
  display_order: number;
  options: string[] | null;
  isNew?: boolean;
}

interface PresetField {
  key: string;
  label: string;
  field_type: string;
  icon: React.ElementType;
  description: string;
  hasOptions?: boolean;
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
  const [fields, setFields] = useState<CustomField[]>([]);
  const [procedureOptions, setProcedureOptions] = useState<string[]>([]);
  const [newProcedure, setNewProcedure] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  // Track which presets are enabled
  const [enabledPresets, setEnabledPresets] = useState<Record<string, boolean>>({
    phone: false,
    date_of_birth: false,
    procedure: false,
  });

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;
      setTenantId(profile.tenant_id);

      const { data: existingFields } = await supabase
        .from('form_fields')
        .select('id, label, field_type, is_required, display_order, options')
        .eq('tenant_id', profile.tenant_id)
        .order('display_order', { ascending: true });

      const allFields = (existingFields ?? []) as CustomField[];

      // Detect which presets are already enabled
      const presetState: Record<string, boolean> = {
        phone: false,
        date_of_birth: false,
        procedure: false,
      };
      const customOnly: CustomField[] = [];

      for (const f of allFields) {
        if (f.label === 'Phone Number' && f.field_type === 'phone') {
          presetState.phone = true;
        } else if (f.label === 'Date of Birth' && f.field_type === 'date') {
          presetState.date_of_birth = true;
        } else if (f.label === 'Procedure' && f.field_type === 'select') {
          presetState.procedure = true;
          setProcedureOptions(f.options ?? []);
        } else {
          customOnly.push(f);
        }
      }

      setEnabledPresets(presetState);
      setFields(customOnly);
      setLoading(false);
    }

    load();
  }, [supabase]);

  function addProcedureOption() {
    const trimmed = newProcedure.trim();
    if (!trimmed || procedureOptions.includes(trimmed)) return;
    setProcedureOptions([...procedureOptions, trimmed]);
    setNewProcedure('');
  }

  function removeProcedureOption(opt: string) {
    setProcedureOptions(procedureOptions.filter((o) => o !== opt));
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
    setSaving(true);
    setSaved(false);

    // Delete all existing form_fields for this tenant and re-insert
    await supabase.from('form_fields').delete().eq('tenant_id', tenantId);

    const allRows: {
      tenant_id: string;
      label: string;
      field_type: string;
      is_required: boolean;
      display_order: number;
      options: string[] | null;
    }[] = [];

    let order = 1;

    // Add enabled presets
    if (enabledPresets.phone) {
      allRows.push({
        tenant_id: tenantId,
        label: 'Phone Number',
        field_type: 'phone',
        is_required: false,
        display_order: order++,
        options: null,
      });
    }
    if (enabledPresets.date_of_birth) {
      allRows.push({
        tenant_id: tenantId,
        label: 'Date of Birth',
        field_type: 'date',
        is_required: false,
        display_order: order++,
        options: null,
      });
    }
    if (enabledPresets.procedure) {
      allRows.push({
        tenant_id: tenantId,
        label: 'Procedure',
        field_type: 'select',
        is_required: false,
        display_order: order++,
        options: procedureOptions.length > 0 ? procedureOptions : null,
      });
    }

    // Add custom fields
    for (const f of fields) {
      if (!f.label.trim()) continue;
      allRows.push({
        tenant_id: tenantId,
        label: f.label.trim(),
        field_type: f.field_type,
        is_required: f.is_required,
        display_order: order++,
        options: f.options,
      });
    }

    if (allRows.length > 0) {
      await supabase.from('form_fields').insert(allRows);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Form Fields</h1>
          <p className="text-muted-foreground">
            Configure the consultation form in your widget
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
        </Button>
      </div>

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

      {/* Preset Custom Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Preset Fields</CardTitle>
          <CardDescription>
            Common fields you can quickly toggle on or off
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {presetFields.map((preset) => {
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

                {/* Procedure options when enabled */}
                {preset.key === 'procedure' && enabled && (
                  <div className="ml-12 mt-3 space-y-3">
                    <Label className="text-xs">Procedure Options</Label>
                    {procedureOptions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {procedureOptions.map((opt) => (
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
                        placeholder="e.g. Botox, Liposuction, Facelift..."
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
                    <p className="text-xs text-muted-foreground">
                      These options appear in the procedure dropdown on your
                      widget form. Press Enter to add.
                    </p>
                  </div>
                )}

                {preset.key !== 'procedure' && <Separator className="mt-4" />}
                {preset.key === 'procedure' && !enabled && (
                  <Separator className="mt-4" />
                )}
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
