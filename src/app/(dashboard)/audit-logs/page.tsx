// src/app/(dashboard)/audit-logs/page.tsx
// Audit Logs Dashboard Page - View system activity and changes

import { Metadata } from 'next';
import { Section, Container, Flex, Heading, Text, Card, Button } from '@radix-ui/themes';
import { FileTextIcon, DownloadIcon } from '@radix-ui/react-icons';
import { AuditLogsTable } from '@/components/audit-logs/audit-logs-table';
import { AuditLogsFilters } from '@/components/audit-logs/audit-logs-filters';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: 'Audit Logs | Dashboard',
  description: 'View system activity logs and track changes across your store',
};

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AuditLogsPageProps {
  searchParams: {
    page?: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default async function AuditLogsPage({ 
  searchParams 
}: { 
  searchParams: Promise<AuditLogsPageProps['searchParams']> 
}) {
  // Get session and verify authentication
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }

  // Only SUPER_ADMIN and STORE_ADMIN roles can access audit logs
  if (!['SUPER_ADMIN', 'STORE_ADMIN'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  const params = await searchParams;
  
  return (
    <Section size="2">
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Page Header */}
          <Flex direction="column" gap="2">
            <Flex align="center" gap="3" justify="between">
              <Flex align="center" gap="3">
                <FileTextIcon width="32" height="32" color="teal" />
                <div>
                  <Heading size="8">Audit Logs</Heading>
                  <Text size="3" color="gray">
                    Track system activity and changes across your store
                  </Text>
                </div>
              </Flex>
              
              <div className="flex items-center gap-3">
                {/* Export to CSV Action */}
                <form action="/api/audit-logs" method="GET" target="_blank">
                  <input type="hidden" name="export" value="csv" />
                  {session.user.role !== 'SUPER_ADMIN' && session.user.storeId && (
                    <input type="hidden" name="storeId" value={session.user.storeId} />
                  )}
                  {params.userId && <input type="hidden" name="userId" value={params.userId} />}
                  {params.entityType && <input type="hidden" name="entityType" value={params.entityType} />}
                  {params.entityId && <input type="hidden" name="entityId" value={params.entityId} />}
                  {params.action && <input type="hidden" name="action" value={params.action} />}
                  {params.startDate && <input type="hidden" name="startDate" value={params.startDate} />}
                  {params.endDate && <input type="hidden" name="endDate" value={params.endDate} />}
                  <Button type="submit" variant="outline" size="2">
                    <DownloadIcon width="16" height="16" />
                    Export CSV
                  </Button>
                </form>
              </div>
            </Flex>
          </Flex>

          {/* Filters Section */}
          <Card size="2">
            <AuditLogsFilters 
              searchParams={params}
              userRole={session.user.role}
              storeId={session.user.storeId || undefined}
            />
          </Card>

          {/* Audit Logs Data Table */}
          <Card>
            <AuditLogsTable 
              searchParams={params}
              userRole={session.user.role}
              storeId={session.user.storeId || undefined}
            />
          </Card>
        </Flex>
      </Container>
    </Section>
  );
}
