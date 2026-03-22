'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  MapPin,
  Plus,
  Trash2,
  Loader2,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Search,
  X,
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  is_primary: boolean;
  isNew?: boolean;
}

interface ServiceOption {
  id: string;
  name: string;
  category_name: string | null;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  // Tracks which services are DISABLED per location (opt-out model)
  const [disabledServices, setDisabledServices] = useState<Record<string, string[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [serviceSearch, setServiceSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

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

      // Load locations
      const { data: locs } = await supabase
        .from('tenant_locations')
        .select('id, name, address, city, state, zip, phone, is_primary')
        .eq('tenant_id', profile.tenant_id)
        .order('is_primary', { ascending: false });

      const allLocs = (locs ?? []).map((l) => ({
        id: l.id,
        name: l.name ?? '',
        address: l.address ?? '',
        city: l.city ?? '',
        state: l.state ?? '',
        zip: l.zip ?? '',
        phone: l.phone ?? '',
        is_primary: l.is_primary ?? false,
      }));
      setLocations(allLocs);

      // Load active services with category names
      const { data: svcData } = await supabase
        .from('services')
        .select('id, name, category_id, service_categories(name)')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      const svcs = (svcData ?? []).map((s) => ({
        id: s.id,
        name: s.name,
        category_name: (s.service_categories as unknown as { name: string } | null)?.name ?? null,
      }));
      setServices(svcs);

      // Load disabled services per location (opt-out model)
      const locationIds = allLocs.map((l) => l.id);
      if (locationIds.length > 0) {
        const { data: links } = await supabase
          .from('location_disabled_services')
          .select('location_id, service_id')
          .in('location_id', locationIds);

        const map: Record<string, string[]> = {};
        for (const link of links ?? []) {
          if (!map[link.location_id]) map[link.location_id] = [];
          map[link.location_id].push(link.service_id);
        }
        setDisabledServices(map);
      }

      setLoading(false);
    }

    load();
  }, [supabase]);

  // Group services by category for display
  const servicesByCategory = useMemo(() => {
    const groups: Record<string, ServiceOption[]> = {};
    for (const svc of services) {
      const cat = svc.category_name ?? 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(svc);
    }
    return groups;
  }, [services]);

  function addLocation() {
    setLocations([
      ...locations,
      {
        id: `new-${Date.now()}`,
        name: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        is_primary: false,
        isNew: true,
      },
    ]);
  }

  function updateLocation(id: string, updates: Partial<Location>) {
    setLocations(locations.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  }

  function removeLocation(id: string) {
    setLocations(locations.filter((l) => l.id !== id));
    const updated = { ...disabledServices };
    delete updated[id];
    setDisabledServices(updated);
  }

  function toggleServiceForLocation(locationId: string, serviceId: string) {
    const currentDisabled = disabledServices[locationId] || [];
    const updated = currentDisabled.includes(serviceId)
      ? currentDisabled.filter((s) => s !== serviceId) // re-enable
      : [...currentDisabled, serviceId]; // disable
    setDisabledServices({ ...disabledServices, [locationId]: updated });
  }

  function enableAllForLocation(locationId: string) {
    setDisabledServices({ ...disabledServices, [locationId]: [] });
  }

  function disableAllForLocation(locationId: string) {
    setDisabledServices({
      ...disabledServices,
      [locationId]: services.map((s) => s.id),
    });
  }

  async function handleSave() {
    if (!tenantId) return;
    setSaving(true);
    setSaved(false);

    const validLocations = locations.filter((l) => l.name.trim());

    // Separate existing locations (update) from new ones (insert)
    const toUpdate = validLocations.filter((l) => !l.isNew);
    const toInsert = validLocations.filter((l) => l.isNew);
    const keepIds = new Set(toUpdate.map((l) => l.id));

    // Delete locations that were removed (not in the current list)
    const { data: existingLocs } = await supabase
      .from('tenant_locations')
      .select('id')
      .eq('tenant_id', tenantId);

    const toDeleteIds = (existingLocs || [])
      .map((l) => l.id)
      .filter((id) => !keepIds.has(id));

    if (toDeleteIds.length > 0) {
      await supabase.from('tenant_locations').delete().in('id', toDeleteIds);
    }

    // Update existing locations
    for (const loc of toUpdate) {
      await supabase
        .from('tenant_locations')
        .update({
          name: loc.name.trim(),
          address: loc.address.trim() || null,
          city: loc.city.trim() || null,
          state: loc.state.trim() || null,
          zip: loc.zip.trim() || null,
          phone: loc.phone.trim() || null,
          is_primary: loc.is_primary,
        })
        .eq('id', loc.id);
    }

    // Insert new locations
    let insertedLocs: { id: string; name: string }[] = [];
    if (toInsert.length > 0) {
      const insertRows = toInsert.map((l) => ({
        tenant_id: tenantId,
        name: l.name.trim(),
        address: l.address.trim() || null,
        city: l.city.trim() || null,
        state: l.state.trim() || null,
        zip: l.zip.trim() || null,
        phone: l.phone.trim() || null,
        is_primary: l.is_primary,
      }));

      const { data } = await supabase
        .from('tenant_locations')
        .insert(insertRows)
        .select('id, name');

      insertedLocs = data || [];
    }

    // Rebuild disabled services for all locations
    // Delete existing disabled service links for this tenant's locations
    const allLocationIds = [
      ...toUpdate.map((l) => l.id),
      ...insertedLocs.map((l) => l.id),
    ];
    if (allLocationIds.length > 0) {
      await supabase.from('location_disabled_services').delete().in('location_id', allLocationIds);
    }

    const allDisabledLinks: { location_id: string; service_id: string }[] = [];

    // Existing locations keep their IDs
    for (const loc of toUpdate) {
      const disabled = disabledServices[loc.id] || [];
      for (const serviceId of disabled) {
        allDisabledLinks.push({ location_id: loc.id, service_id: serviceId });
      }
    }

    // New locations map from old temp ID to new DB ID
    for (let i = 0; i < toInsert.length; i++) {
      const oldId = toInsert[i].id;
      const newId = insertedLocs[i]?.id;
      if (!newId) continue;
      const disabled = disabledServices[oldId] || [];
      for (const serviceId of disabled) {
        allDisabledLinks.push({ location_id: newId, service_id: serviceId });
      }
    }

    // Insert disabled service links
    if (allDisabledLinks.length > 0) {
      await supabase.from('location_disabled_services').insert(allDisabledLinks);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Refresh locations to get correct IDs for newly inserted ones
    const { data: refreshed } = await supabase
      .from('tenant_locations')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('is_primary', { ascending: false })
      .order('name');
    if (refreshed) {
      setLocations(refreshed.map((l) => ({ ...l, address: l.address || '', city: l.city || '', state: l.state || '', zip: l.zip || '', phone: l.phone || '' })));
    }
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
          <h1 className="text-2xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">
            Manage your practice locations and assign services
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addLocation}>
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
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
      </div>

      {/* Locations */}
      {locations.length > 0 ? (
        <div className="space-y-4">
          {locations.map((loc) => {
            const isExpanded = expandedId === loc.id;
            const disabled = disabledServices[loc.id] || [];
            const disabledCount = disabled.length;
            const enabledCount = services.length - disabledCount;
            const searchLower = serviceSearch.toLowerCase();

            return (
              <Card key={loc.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                      <Input
                        value={loc.name}
                        onChange={(e) =>
                          updateLocation(loc.id, { name: e.target.value })
                        }
                        placeholder="Location name"
                        className="text-sm font-medium max-w-xs"
                      />
                      {loc.is_primary && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700"
                        >
                          Primary
                        </Badge>
                      )}
                      {services.length > 0 && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${disabledCount > 0 ? 'border-amber-300 text-amber-700 bg-amber-50' : ''}`}
                        >
                          <Stethoscope className="h-3 w-3 mr-1" />
                          {enabledCount}/{services.length} active
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <Switch
                          checked={loc.is_primary}
                          onCheckedChange={(checked) =>
                            updateLocation(loc.id, { is_primary: checked })
                          }
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Primary
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : loc.id)
                        }
                        className="h-8 w-8 p-0"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeLocation(loc.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="pt-0 space-y-4">
                    <Separator />

                    {/* Address fields */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Address</Label>
                        <Input
                          value={loc.address}
                          onChange={(e) =>
                            updateLocation(loc.id, { address: e.target.value })
                          }
                          placeholder="123 Main St"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Phone</Label>
                        <Input
                          value={loc.phone}
                          onChange={(e) =>
                            updateLocation(loc.id, { phone: e.target.value })
                          }
                          placeholder="(555) 555-5555"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">City</Label>
                        <Input
                          value={loc.city}
                          onChange={(e) =>
                            updateLocation(loc.id, { city: e.target.value })
                          }
                          placeholder="Los Angeles"
                          className="text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">State</Label>
                          <Input
                            value={loc.state}
                            onChange={(e) =>
                              updateLocation(loc.id, { state: e.target.value })
                            }
                            placeholder="CA"
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">ZIP</Label>
                          <Input
                            value={loc.zip}
                            onChange={(e) =>
                              updateLocation(loc.id, { zip: e.target.value })
                            }
                            placeholder="90210"
                            className="text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Services — opt-out model */}
                    {services.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                              Services Available
                            </h4>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => enableAllForLocation(loc.id)}
                              >
                                Enable All
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground"
                                onClick={() => disableAllForLocation(loc.id)}
                              >
                                Disable All
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mb-3">
                            All services from your catalog are enabled by default. Toggle off any services not available at this location.
                          </p>

                          {/* Search filter */}
                          {services.length > 8 && (
                            <div className="relative mb-3">
                              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                              <Input
                                value={serviceSearch}
                                onChange={(e) => setServiceSearch(e.target.value)}
                                placeholder="Filter services..."
                                className="pl-8 h-8 text-xs"
                              />
                              {serviceSearch && (
                                <button
                                  type="button"
                                  onClick={() => setServiceSearch('')}
                                  className="absolute right-2.5 top-2.5"
                                >
                                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              )}
                            </div>
                          )}

                          {disabledCount > 0 && (
                            <div className="mb-3 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                              {disabledCount} service{disabledCount !== 1 ? 's' : ''} disabled at this location
                            </div>
                          )}

                          <div className="space-y-4">
                            {Object.entries(servicesByCategory).map(([category, catServices]) => {
                              const filtered = searchLower
                                ? catServices.filter(
                                    (s) =>
                                      s.name.toLowerCase().includes(searchLower) ||
                                      (s.category_name ?? '').toLowerCase().includes(searchLower)
                                  )
                                : catServices;
                              if (filtered.length === 0) return null;

                              return (
                                <div key={category}>
                                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    {category}
                                  </h5>
                                  <div className="grid gap-1.5 sm:grid-cols-2">
                                    {filtered.map((svc) => {
                                      const isDisabled = disabled.includes(svc.id);
                                      const isEnabled = !isDisabled;
                                      return (
                                        <button
                                          key={svc.id}
                                          type="button"
                                          onClick={() =>
                                            toggleServiceForLocation(loc.id, svc.id)
                                          }
                                          className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                                            isEnabled
                                              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                              : 'border-slate-200 bg-slate-50 text-slate-400 line-through'
                                          }`}
                                        >
                                          <div
                                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                              isEnabled
                                                ? 'border-indigo-500 bg-indigo-500'
                                                : 'border-slate-300'
                                            }`}
                                          >
                                            {isEnabled && (
                                              <Check className="h-3 w-3 text-white" />
                                            )}
                                          </div>
                                          <span className="block truncate font-medium">
                                            {svc.name}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}

                    {services.length === 0 && (
                      <>
                        <Separator />
                        <p className="text-xs text-muted-foreground">
                          No services configured yet. Add services from the{' '}
                          <a href="/dashboard/widget/services" className="underline">
                            Services page
                          </a>{' '}
                          to manage availability per location.
                        </p>
                      </>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <MapPin className="mb-4 h-12 w-12 text-muted-foreground/40" />
              <h3 className="text-sm font-medium text-muted-foreground">
                No locations added
              </h3>
              <p className="mt-1 max-w-sm text-xs text-muted-foreground/70">
                Add your practice locations so visitors can find you. Click
                &quot;Add Location&quot; to get started.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
