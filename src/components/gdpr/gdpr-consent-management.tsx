'use client';

import * as React from 'react';
import { Shield, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface ConsentCategory {
  id: string;
  name: string;
  description: string;
  required: boolean;
  enabled: boolean;
}

interface GDPRConsentManagementProps {
  consents: ConsentCategory[];
  onSave: (consents: ConsentCategory[]) => Promise<void>;
  onExportData?: () => Promise<void>;
  onDeleteAccount?: () => Promise<void>;
  className?: string;
}

export function GDPRConsentManagement({
  consents: initialConsents,
  onSave,
  onExportData,
  onDeleteAccount,
  className,
}: GDPRConsentManagementProps) {
  const [consents, setConsents] = React.useState(initialConsents);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  const handleToggle = (id: string) => {
    setConsents((prev) =>
      prev.map((consent) =>
        consent.id === id && !consent.required
          ? { ...consent, enabled: !consent.enabled }
          : consent
      )
    );
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await onSave(consents);
      setSaveStatus('success');
    } catch (error) {
      console.error('Failed to save consents:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    if (!onExportData) return;
    setIsExporting(true);
    try {
      await onExportData();
    } catch (error) {
      console.error('Failed to export data:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const allRequiredEnabled = consents
    .filter((c) => c.required)
    .every((c) => c.enabled);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Privacy &amp; Consent Management</CardTitle>
        </div>
        <CardDescription>
          Manage your data processing consents and privacy preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status indicator */}
        {saveStatus !== 'idle' && (
          <div
            className={`flex items-center gap-2 rounded-md p-3 ${
              saveStatus === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {saveStatus === 'success' ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Preferences saved successfully
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Failed to save preferences
                </span>
              </>
            )}
          </div>
        )}

        {/* Warning for required consents */}
        {!allRequiredEnabled && (
          <div className="flex items-start gap-2 rounded-md bg-yellow-50 p-3 border border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-700 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-700">
                Required consents
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Some consents are required for the service to function properly
              </p>
            </div>
          </div>
        )}

        {/* Consent categories */}
        <div className="space-y-4">
          {consents.map((consent) => (
            <div
              key={consent.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor={`consent-${consent.id}`}
                    className="font-medium cursor-pointer"
                  >
                    {consent.name}
                  </Label>
                  {consent.required && (
                    <Badge variant="secondary" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {consent.description}
                </p>
              </div>
              <Switch
                id={`consent-${consent.id}`}
                checked={consent.enabled}
                onCheckedChange={() => handleToggle(consent.id)}
                disabled={consent.required}
              />
            </div>
          ))}
        </div>

        <Separator />

        {/* Data rights */}
        <div className="space-y-3">
          <h4 className="font-medium">Your Data Rights</h4>
          <p className="text-sm text-muted-foreground">
            Under GDPR, you have the right to access, export, and delete your personal data.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            {onExportData && (
              <Button
                variant="outline"
                onClick={handleExportData}
                disabled={isExporting}
                className="flex-1"
              >
                {isExporting ? 'Exporting...' : 'Export My Data'}
              </Button>
            )}
            {onDeleteAccount && (
              <Button
                variant="destructive"
                onClick={onDeleteAccount}
                className="flex-1"
              >
                Delete My Account
              </Button>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardFooter>
    </Card>
  );
}
