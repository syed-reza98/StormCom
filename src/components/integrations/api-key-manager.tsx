'use client';

import * as React from 'react';
import { Key, Copy, Eye, EyeOff, Plus, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface APIKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  permissions: string[];
}

interface APIKeyManagerProps {
  keys: APIKey[];
  onCreateKey: (name: string) => Promise<APIKey>;
  onDeleteKey: (keyId: string) => Promise<void>;
  onRegenerateKey: (keyId: string) => Promise<string>;
  className?: string;
}

export function APIKeyManager({
  keys,
  onCreateKey,
  onDeleteKey,
  onRegenerateKey,
  className,
}: APIKeyManagerProps) {
  const [newKeyName, setNewKeyName] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [showKey, setShowKey] = React.useState<Record<string, boolean>>({});
  const [deleteKeyId, setDeleteKeyId] = React.useState<string | null>(null);
  const [regenerateKeyId, setRegenerateKeyId] = React.useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = React.useState<string | null>(null);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    try {
      const newKey = await onCreateKey(newKeyName);
      setNewKeyName('');
      setShowKey({ ...showKey, [newKey.id]: true });
    } catch (error) {
      console.error('Failed to create API key:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!deleteKeyId) return;

    try {
      await onDeleteKey(deleteKeyId);
      setDeleteKeyId(null);
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const handleRegenerateKey = async () => {
    if (!regenerateKeyId) return;

    try {
      await onRegenerateKey(regenerateKeyId);
      setRegenerateKeyId(null);
      setShowKey({ ...showKey, [regenerateKeyId]: true });
    } catch (error) {
      console.error('Failed to regenerate API key:', error);
    }
  };

  const handleCopyKey = (keyId: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const toggleShowKey = (keyId: string) => {
    setShowKey({ ...showKey, [keyId]: !showKey[keyId] });
  };

  const maskKey = (key: string) => {
    const visible = key.slice(0, 8);
    return `${visible}${'*'.repeat(32)}`;
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>API Key Management</CardTitle>
          </div>
          <CardDescription>
            Create and manage API keys for accessing your store's API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Create new key */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="key-name" className="sr-only">
                API Key Name
              </Label>
              <Input
                id="key-name"
                placeholder="e.g., Production API, Mobile App"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateKey();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleCreateKey}
              disabled={isCreating || !newKeyName.trim()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Key
            </Button>
          </div>

          {/* Keys table */}
          {keys.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {key.name}
                          {key.expiresAt &&
                            key.expiresAt < new Date() && (
                              <Badge variant="destructive" className="text-xs">
                                Expired
                              </Badge>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono">
                            {showKey[key.id] ? key.key : maskKey(key.key)}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleShowKey(key.id)}
                            className="h-6 w-6 p-0"
                          >
                            {showKey[key.id] ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyKey(key.id, key.key)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy
                              className={`h-3 w-3 ${
                                copiedKeyId === key.id ? 'text-green-600' : ''
                              }`}
                            />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {key.createdAt.toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {key.lastUsed
                          ? key.lastUsed.toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRegenerateKeyId(key.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteKeyId(key.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg">
              <Key className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No API keys yet. Create your first key to get started.
              </p>
            </div>
          )}

          {/* Security notice */}
          <div className="rounded-md bg-yellow-50 p-3 border border-yellow-200">
            <p className="text-xs text-yellow-700">
              <strong>Security Notice:</strong> Keep your API keys secure. Never share
              them in public repositories or client-side code. Regenerate keys
              immediately if compromised.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteKeyId} onOpenChange={() => setDeleteKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this API key? Applications using this
              key will stop working immediately. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteKey}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate confirmation dialog */}
      <AlertDialog
        open={!!regenerateKeyId}
        onOpenChange={() => setRegenerateKeyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate API Key</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new key and invalidate the old one. Applications
              using the old key will stop working immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateKey}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
