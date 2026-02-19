'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Inbox,
  Palette,
  MapPin,
  Users,
  Settings,
  BarChart3,
  Code,
  Eye,
  Webhook,
  Layers,
  FormInput,
  Shield,
  ScrollText,
  Building2,
  Stethoscope,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import type { UserRole } from '@treatment-builder/shared';

interface AppSidebarProps {
  role: UserRole;
  tenantName: string;
}

export function AppSidebar({ role, tenantName }: AppSidebarProps) {
  const pathname = usePathname();

  const mainItems = [
    { title: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { title: 'Submissions', href: '/dashboard/submissions', icon: Inbox },
    { title: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  ];

  const widgetItems = [
    { title: 'Branding', href: '/dashboard/widget/branding', icon: Palette },
    { title: 'Services', href: '/dashboard/widget/services', icon: Stethoscope },
    { title: 'Regions', href: '/dashboard/widget/regions', icon: Layers },
    { title: 'Form Fields', href: '/dashboard/widget/form', icon: FormInput },
    { title: 'Integration', href: '/dashboard/widget/integration', icon: Webhook },
    { title: 'Preview', href: '/dashboard/widget/preview', icon: Eye },
    { title: 'Embed Code', href: '/dashboard/widget/embed', icon: Code },
  ];

  const managementItems = [
    { title: 'Locations', href: '/dashboard/locations', icon: MapPin },
    { title: 'Team', href: '/dashboard/team', icon: Users },
    { title: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const adminItems = [
    { title: 'Tenants', href: '/admin/tenants', icon: Building2 },
    { title: 'Default Regions', href: '/admin/defaults', icon: Shield },
    { title: 'Audit Log', href: '/admin/audit-log', icon: ScrollText },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const isAdmin = role === 'center_admin' || role === 'platform_admin';
  const isPlatformAdmin = role === 'platform_admin';

  const roleLabel =
    role === 'platform_admin'
      ? 'Platform Admin'
      : role === 'center_admin'
      ? 'Center Admin'
      : 'Staff';

  return (
    <Sidebar className="border-r-0">
      <SidebarHeader className="p-5 pb-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white text-sm font-bold shadow-sm">
            CB
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">Consult Builder</span>
            <span className="text-xs text-slate-400 truncate max-w-[150px]">
              {tenantName}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup className="py-3">
          <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {mainItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={
                        active
                          ? 'bg-white/10 text-white border-l-2 border-indigo-400 rounded-l-none font-medium'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent rounded-l-none'
                      }
                    >
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <>
            <SidebarSeparator className="mx-3 bg-slate-700" />
            <SidebarGroup className="py-3">
              <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Widget Configuration
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {widgetItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={
                            active
                              ? 'bg-white/10 text-white border-l-2 border-indigo-400 rounded-l-none font-medium'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent rounded-l-none'
                          }
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="mx-3 bg-slate-700" />
            <SidebarGroup className="py-3">
              <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Management
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {managementItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={
                            active
                              ? 'bg-white/10 text-white border-l-2 border-indigo-400 rounded-l-none font-medium'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent rounded-l-none'
                          }
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {isPlatformAdmin && (
          <>
            <SidebarSeparator className="mx-3 bg-slate-700" />
            <SidebarGroup className="py-3">
              <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Platform Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {adminItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          className={
                            active
                              ? 'bg-white/10 text-white border-l-2 border-indigo-400 rounded-l-none font-medium'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent rounded-l-none'
                          }
                        >
                          <Link href={item.href}>
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarFooter className="p-5 pt-3 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-md bg-indigo-500/20 px-2.5 py-1 text-xs font-medium text-indigo-300 ring-1 ring-inset ring-indigo-500/30">
            {roleLabel}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
