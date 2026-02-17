'use client';

import { useEffect, useState } from 'react';
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
  const [locationServices, setLocationServices] = useState<Record<string, string[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

      // Load services with category names
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

      // Load location-service links
      const locationIds = allLocs.map((l) => l.id);
      if (locationIds.length > 0) {
        const { data: links } = await supabase
          .from('location_services')
          .select('location_id, service_id')
          .in('location_id', locationIds);

        const map: Record<string, string[]> = {};
        for (const link of links ?? []) {
          if (!map[link.location_id]) map[link.location_id] = [];
          map[link.location_id].push(link.service_id);
        }
        setLocationServices(map);
      }

      setLoading(false);
    }

    load();
  }, [supabase]);

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
    const updated = { ...locationServices };
    delete updated[id];
    setLocationServices(updated);
  }

  function toggleServiceForLocation(locationId: string, serviceId: string) {
    const current = locationServices[locationId] || [];
    const updated = current.includes(serviceId)
      ? current.filter((s) => s !== serviceId)
      : [...current, serviceId];
    setLocationServices({ ...locationServices, [locationId]: updated });
  }

  async function handleSave() {
    if (!tenantId) return;
    setSaving(true);
    setSaved(false);

    // Delete all existing locations and re-insert
    await supabase.from('tenant_locations').delete().eq('tenant_id', tenantId);

    const locationRows = locations
      .filter((l) => l.name.trim())
      .map((l) => ({
        tenant_id: tenantId,
        name: l.name.trim(),
        address: l.address.trim() || null,
        city: l.city.trim() || null,
        state: l.state.trim() || null,
        zip: l.zip.trim() || null,
        phone: l.phone.trim() || null,
        is_primary: l.is_primary,
      }));

    if (locationRows.length > 0) {
      const { data: insertedLocs } = await supabase
        .from('tenant_locations')
        .insert(locationRows)
        .select('id, name');

      // Map old IDs to new IDs for service links
      if (insertedLocs) {
        const allServiceLinks: { location_id: string; service_id: string }[] = [];

        // Match by name order since we re-inserted in same order
        const validLocations = locations.filter((l) => l.name.trim());
        for (let i = 0; i < insertedLocs.length; i++) {
          const oldId = validLocations[i]?.id;
          const newId = insertedLocs[i].id;
          const serviceIds = locationServices[oldId] || [];
          for (const serviceId of serviceIds) {
            allServiceLinks.push({ location_id: newId, service_id: serviceId });
          }
        }

        // Delete old location_services and insert new ones
        if (allServiceLinks.length > 0) {
          await supabase.from('location_services').insert(allServiceLinks);
        }
      }
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
            const assignedCount = (locationServices[loc.id] || []).length;

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
                      {assignedCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Stethoscope className="h-3 w-3 mr-1" />
                          {assignedCount} service{assignedCount !== 1 ? 's' : ''}
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

                    {/* Services offered */}
                    {services.length > 0 && (
                      <>
                        <Separator />
                        <div>
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                            Services Offered
                          </h4>
                          <p className="text-xs text-muted-foreground mb-3">
                            Select which services are available at this location
                          </p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {services.map((svc) => {
                              const isAssigned = (
                                locationServices[loc.id] || []
                              ).includes(svc.id);
                              return (
                                <button
                                  key={svc.id}
                                  type="button"
                                  onClick={() =>
                                    toggleServiceForLocation(loc.id, svc.id)
                                  }
                                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                                    isAssigned
                                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                                      : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                  }`}
                                >
                                  <div
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                      isAssigned
                                        ? 'border-indigo-500 bg-indigo-500'
                                        : 'border-slate-300'
                                    }`}
                                  >
                                    {isAssigned && (
                                      <Check className="h-3 w-3 text-white" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="block truncate font-medium">
                                      {svc.name}
                                    </span>
                                    {svc.category_name && (
                                      <span className="block truncate text-xs opacity-70">
                                        {svc.category_name}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
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
