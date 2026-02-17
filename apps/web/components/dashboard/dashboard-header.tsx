'use client';

import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Settings, User, ChevronRight } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string | null;
  userEmail: string;
}

function getPageTitle(pathname: string): { section: string; page: string } {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length <= 1) {
    return { section: '', page: 'Dashboard' };
  }

  const labelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    submissions: 'Submissions',
    analytics: 'Analytics',
    widget: 'Widget',
    branding: 'Branding',
    diagram: 'Diagram',
    regions: 'Body Regions',
    concerns: 'Concerns',
    form: 'Form Fields',
    integration: 'Integration',
    preview: 'Preview',
    embed: 'Embed Code',
    locations: 'Locations',
    team: 'Team',
    settings: 'Settings',
    admin: 'Admin',
    tenants: 'Tenants',
    defaults: 'Default Regions',
    'audit-log': 'Audit Log',
  };

  if (segments.length === 2) {
    return {
      section: labelMap[segments[0]] || segments[0],
      page: labelMap[segments[1]] || segments[1],
    };
  }

  if (segments.length >= 3) {
    return {
      section: labelMap[segments[1]] || segments[1],
      page: labelMap[segments[2]] || segments[2],
    };
  }

  return { section: '', page: 'Dashboard' };
}

export function DashboardHeader({ userName, userEmail }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { section, page } = getPageTitle(pathname);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail[0].toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4">
      <SidebarTrigger className="text-slate-500 hover:text-slate-700" />
      <Separator orientation="vertical" className="h-5 bg-slate-200" />
      <nav className="flex items-center gap-1 text-sm">
        {section && (
          <>
            <span className="text-slate-400 font-medium">{section}</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
          </>
        )}
        <span className="text-slate-700 font-semibold">{page}</span>
      </nav>
      <div className="flex-1" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col space-y-1">
              {userName && <p className="text-sm font-medium">{userName}</p>}
              <p className="text-xs text-muted-foreground">{userEmail}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
