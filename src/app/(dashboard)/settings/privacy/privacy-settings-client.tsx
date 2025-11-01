'use client';

// src/app/(dashboard)/settings/privacy/privacy-settings-client.tsx
// Client component for privacy settings with data export and deletion

import { useState } from 'react';
import { Flex, Card, Heading, Text, Button, Separator, Badge, Dialog } from '@radix-ui/themes';
import { DownloadIcon, TrashIcon, ReloadIcon } from '@radix-ui/react-icons';

type GdprRequest = {
  id: string;
  type: 'EXPORT' | 'DELETE';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  exportUrl?: string | null;
  createdAt: string;
};

export function PrivacySettingsClient() {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [requests, setRequests] = useState<GdprRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  /**
   * Handle data export request
   */
  const handleExportData = async () => {
    setIsExporting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/gdpr/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create export request');
      }

      setSuccess('Data export request created successfully. You will receive an email when your export is ready.');
      
      // Add the new request to the list
      if (data.data) {
        setRequests(prev => [data.data, ...prev]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the export request');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Handle account deletion request
   */
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE_MY_ACCOUNT') {
      setError('Please type DELETE_MY_ACCOUNT to confirm');
      return;
    }

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/gdpr/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          confirmation: 'DELETE_MY_ACCOUNT',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create deletion request');
      }

      setSuccess('Account deletion request created. Your account will be permanently deleted within 30 days.');
      setDeleteConfirmOpen(false);
      setDeleteConfirmation('');
      
      // Add the new request to the list
      if (data.data) {
        setRequests(prev => [data.data, ...prev]);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the deletion request');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Get status badge color
   */
  const getStatusColor = (status: string): 'gray' | 'blue' | 'green' | 'red' => {
    switch (status) {
      case 'PENDING':
        return 'gray';
      case 'PROCESSING':
        return 'blue';
      case 'COMPLETED':
        return 'green';
      case 'FAILED':
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <>
      {/* Error/Success Messages */}
      {error && (
        <Card variant="surface" style={{ backgroundColor: 'var(--red-3)', borderColor: 'var(--red-6)' }}>
          <Flex p="3" gap="2" align="center">
            <Text size="2" color="red" weight="medium">{error}</Text>
          </Flex>
        </Card>
      )}

      {success && (
        <Card variant="surface" style={{ backgroundColor: 'var(--green-3)', borderColor: 'var(--green-6)' }}>
          <Flex p="3" gap="2" align="center">
            <Text size="2" color="green" weight="medium">{success}</Text>
          </Flex>
        </Card>
      )}

      {/* Data Export Section */}
      <Card>
        <Flex direction="column" gap="4" p="4">
          <Flex align="center" gap="2">
            <DownloadIcon width="20" height="20" color="teal" />
            <Heading size="4">Export Your Data</Heading>
          </Flex>
          <Text size="2" color="gray">
            Request a copy of all your personal data in a machine-readable format (JSON). 
            This includes your profile, orders, addresses, and preferences.
          </Text>
          <Flex gap="2">
            <Button
              onClick={handleExportData}
              disabled={isExporting}
              size="2"
              variant="solid"
              color="teal"
            >
              {isExporting ? (
                <>
                  <ReloadIcon className="animate-spin" />
                  Creating Request...
                </>
              ) : (
                <>
                  <DownloadIcon />
                  Request Data Export
                </>
              )}
            </Button>
          </Flex>
          <Text size="1" color="gray">
            You will receive an email with a download link when your export is ready (within 72 hours).
          </Text>
        </Flex>
      </Card>

      {/* Account Deletion Section */}
      <Card>
        <Flex direction="column" gap="4" p="4">
          <Flex align="center" gap="2">
            <TrashIcon width="20" height="20" color="red" />
            <Heading size="4">Delete Your Account</Heading>
          </Flex>
          <Text size="2" color="gray">
            Permanently delete your account and personal data. This action cannot be undone.
          </Text>
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <Text size="2" weight="medium" color="amber">
              ⚠️ Warning: Account deletion is permanent
            </Text>
            <Text size="1" color="gray" mt="1">
              Your personal data will be anonymized within 30 days. Order history will be preserved 
              for accounting compliance, but will no longer be linked to your identity.
            </Text>
          </div>
          <Flex gap="2">
            <Dialog.Root open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
              <Dialog.Trigger>
                <Button
                  size="2"
                  variant="solid"
                  color="red"
                >
                  <TrashIcon />
                  Delete My Account
                </Button>
              </Dialog.Trigger>

              <Dialog.Content style={{ maxWidth: 450 }}>
                <Dialog.Title>Confirm Account Deletion</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                  This action is permanent and cannot be undone. All your personal data will be 
                  anonymized within 30 days.
                </Dialog.Description>

                <Flex direction="column" gap="3">
                  <label>
                    <Text as="div" size="2" mb="1" weight="bold">
                      Type <code>DELETE_MY_ACCOUNT</code> to confirm
                    </Text>
                    <input
                      type="text"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE_MY_ACCOUNT"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </label>
                </Flex>

                <Flex gap="3" mt="4" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray">
                      Cancel
                    </Button>
                  </Dialog.Close>
                  <Button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmation !== 'DELETE_MY_ACCOUNT'}
                    color="red"
                  >
                    {isDeleting ? (
                      <>
                        <ReloadIcon className="animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete Account'
                    )}
                  </Button>
                </Flex>
              </Dialog.Content>
            </Dialog.Root>
          </Flex>
        </Flex>
      </Card>

      {/* Request History */}
      {requests.length > 0 && (
        <Card>
          <Flex direction="column" gap="4" p="4">
            <Heading size="4">Recent Requests</Heading>
            <div className="space-y-3">
              {requests.map((request) => (
                <Flex key={request.id} justify="between" align="center" p="3" style={{ backgroundColor: 'var(--gray-2)', borderRadius: '8px' }}>
                  <Flex direction="column" gap="1">
                    <Flex align="center" gap="2">
                      <Text size="2" weight="medium">
                        {request.type === 'EXPORT' ? 'Data Export' : 'Account Deletion'}
                      </Text>
                      <Badge color={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </Flex>
                    <Text size="1" color="gray">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </Text>
                  </Flex>
                  {request.status === 'COMPLETED' && request.exportUrl && (
                    <Button size="1" variant="soft" asChild>
                      <a href={request.exportUrl} download>
                        <DownloadIcon />
                        Download
                      </a>
                    </Button>
                  )}
                </Flex>
              ))}
            </div>
          </Flex>
        </Card>
      )}
    </>
  );
}
