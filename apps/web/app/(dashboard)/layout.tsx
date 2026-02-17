import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard/app-sidebar';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Toaster } from '@/components/ui/sonner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <SidebarProvider>
      <AppSidebar role={session.profile.role} tenantName={session.tenant.name} />
      <SidebarInset>
        <DashboardHeader
          userName={session.profile.full_name}
          userEmail={session.email}
        />
        <main className="flex-1 bg-slate-50/50 p-6">{children}</main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
