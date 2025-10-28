import React from 'react';
import DashboardShell from '@/components/layout/dashboard-shell';

export default function DashboardLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <DashboardShell>{children}</DashboardShell>;
}
