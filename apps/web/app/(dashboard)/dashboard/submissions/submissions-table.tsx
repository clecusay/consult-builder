'use client';

import { Fragment, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  ChevronDown,
  MapPin,
  AlertCircle,
  Sparkles,
  Mail,
  Phone,
  Globe,
  User,
  MessageSquare,
  Clock,
} from 'lucide-react';

type Submission = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  gender: string;
  selected_regions: Array<{ region_id?: string; region_name?: string; region_slug?: string }>;
  selected_concerns: Array<{ concern_id?: string; concern_name?: string; region_id?: string; region_name?: string }>;
  selected_services: Array<{ service_id?: string; service_name?: string; category_name?: string }>;
  custom_fields: Record<string, unknown> | null;
  lead_status: string;
  source_url: string | null;
  created_at: string;
};

import { LEAD_STATUS_STYLES } from '@/lib/constants/badge-styles';

function DetailLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
      {children}
    </span>
  );
}

function DetailValue({ children }: { children: React.ReactNode }) {
  return <span className="text-sm text-foreground">{children}</span>;
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
      <div className="flex flex-col gap-0.5">
        <DetailLabel>{label}</DetailLabel>
        <DetailValue>{value}</DetailValue>
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day}/${year}, ${hours}:${mins} ${ampm}`;
}

function SubmissionDetail({ sub }: { sub: Submission }) {
  const regions = Array.isArray(sub.selected_regions)
    ? sub.selected_regions.filter((r) => r.region_name)
    : [];

  const concerns = Array.isArray(sub.selected_concerns)
    ? sub.selected_concerns.filter((c) => c.concern_name)
    : [];

  const services = Array.isArray(sub.selected_services)
    ? sub.selected_services.filter((s) => s.service_name)
    : [];

  // Group concerns by region
  const concernsByRegion = new Map<string, string[]>();
  for (const c of concerns) {
    const regionName = c.region_name || 'Other';
    const list = concernsByRegion.get(regionName) || [];
    list.push(c.concern_name!);
    concernsByRegion.set(regionName, list);
  }

  // Group services by category
  const servicesByCategory = new Map<string, string[]>();
  for (const s of services) {
    const cat = s.category_name || 'Other';
    const list = servicesByCategory.get(cat) || [];
    list.push(s.service_name!);
    servicesByCategory.set(cat, list);
  }

  // Custom fields (exclude internal opt-in keys stored at top level)
  const customEntries = sub.custom_fields
    ? Object.entries(sub.custom_fields).filter(
        ([key]) => !['SMS Opt-In', 'Email Opt-In'].includes(key)
      )
    : [];

  const smsOptIn = sub.custom_fields?.['SMS Opt-In'];
  const emailOptIn = sub.custom_fields?.['Email Opt-In'];

  return (
    <div className="space-y-5 px-2 py-4">
      {/* Contact Info Row */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
        <DetailItem icon={Mail} label="Email" value={sub.email || '--'} />
        <DetailItem icon={Phone} label="Phone" value={sub.phone || '--'} />
        <DetailItem icon={User} label="Gender" value={sub.gender ? sub.gender.charAt(0).toUpperCase() + sub.gender.slice(1) : '--'} />
        <DetailItem
          icon={Clock}
          label="Submitted"
          value={formatDateTime(sub.created_at)}
        />
      </div>

      <Separator />

      {/* Selected Regions */}
      {regions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground/60" />
            <DetailLabel>Selected Regions</DetailLabel>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {regions.map((r, i) => (
              <Badge key={i} variant="outline" className="text-xs font-normal">
                {r.region_name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Selected Concerns grouped by region */}
      {concerns.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
            <DetailLabel>Concerns</DetailLabel>
          </div>
          <div className="space-y-2">
            {Array.from(concernsByRegion.entries()).map(([regionName, names]) => (
              <div key={regionName} className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {regionName}:
                </span>
                {names.map((name, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                    {name}
                  </Badge>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Services grouped by category */}
      {services.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground/60" />
            <DetailLabel>Services</DetailLabel>
          </div>
          <div className="space-y-2">
            {Array.from(servicesByCategory.entries()).map(([cat, names]) => (
              <div key={cat} className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {cat}:
                </span>
                {names.map((name, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                    {name}
                  </Badge>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom fields */}
      {customEntries.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            {customEntries.map(([key, value]) => (
              <DetailItem
                key={key}
                icon={MessageSquare}
                label={key}
                value={String(value)}
              />
            ))}
          </div>
        </>
      )}

      {/* Opt-in & Source */}
      {(smsOptIn !== undefined || emailOptIn !== undefined || sub.source_url) && (
        <>
          <Separator />
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
            {smsOptIn !== undefined && (
              <div className="flex flex-col gap-0.5">
                <DetailLabel>SMS Opt-In</DetailLabel>
                <DetailValue>{smsOptIn ? 'Yes' : 'No'}</DetailValue>
              </div>
            )}
            {emailOptIn !== undefined && (
              <div className="flex flex-col gap-0.5">
                <DetailLabel>Email Opt-In</DetailLabel>
                <DetailValue>{emailOptIn ? 'Yes' : 'No'}</DetailValue>
              </div>
            )}
            {sub.source_url && (
              <div className="col-span-2 flex items-start gap-2">
                <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                <div className="flex flex-col gap-0.5">
                  <DetailLabel>Source URL</DetailLabel>
                  <span className="max-w-xs truncate text-sm text-muted-foreground">
                    {sub.source_url}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function SubmissionsTable({ submissions }: { submissions: Submission[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Regions</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {submissions.map((sub) => {
          const isExpanded = expandedId === sub.id;
          const regions = Array.isArray(sub.selected_regions)
            ? (sub.selected_regions as Array<{ region_name?: string }>)
                .map((r) => r.region_name)
                .filter(Boolean)
                .join(', ')
            : '';

          return (
            <Fragment key={sub.id}>
              <TableRow
                data-state={isExpanded ? 'selected' : undefined}
                className={`group cursor-pointer ${isExpanded ? 'border-b-0' : ''}`}
                onClick={() => setExpandedId(isExpanded ? null : sub.id)}
              >
                <TableCell className="w-8">
                  <ChevronDown
                    className={`h-4 w-4 text-muted-foreground/50 transition-transform duration-200 ${
                      isExpanded ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {sub.first_name} {sub.last_name}
                </TableCell>
                <TableCell className="text-muted-foreground">{sub.email}</TableCell>
                <TableCell className="text-muted-foreground">{sub.phone || '--'}</TableCell>
                <TableCell>
                  {regions ? (
                    <span className="text-sm text-muted-foreground">{regions}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground/50">--</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={LEAD_STATUS_STYLES[sub.lead_status] ?? ''}
                  >
                    {sub.lead_status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(sub.created_at)}
                </TableCell>
              </TableRow>
              {isExpanded && (
                <TableRow data-state="selected" className="hover:bg-transparent">
                  <TableCell colSpan={7} className="border-t-0 bg-muted/30 px-6 pt-0 pb-4">
                    <SubmissionDetail sub={sub} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
