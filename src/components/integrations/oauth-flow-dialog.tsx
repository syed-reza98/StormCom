'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Copy, ExternalLink } from 'lucide-react';

const oauthSchema = z.object({
  provider: z.enum(['google', 'facebook', 'github', 'microsoft', 'twitter']),
  scopes: z.array(z.string()).min(1, 'Select at least one scope'),
});

type OAuthFormData = z.infer<typeof oauthSchema>;

interface OAuthFlowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthorize: (data: OAuthFormData) => Promise<{
    authUrl: string;
    token?: string;
    expiresAt?: Date;
  }>;
}

const providers = [
  { value: 'google', label: 'Google', icon: 'G' },
  { value: 'facebook', label: 'Facebook', icon: 'f' },
  { value: 'github', label: 'GitHub', icon: 'GH' },
  { value: 'microsoft', label: 'Microsoft', icon: 'M' },
  { value: 'twitter', label: 'Twitter', icon: 'T' },
];

const scopesByProvider: Record<string, Array<{ id: string; label: string; description: string }>> = {
  google: [
    { id: 'profile', label: 'Profile', description: 'Access to basic profile information' },
    { id: 'email', label: 'Email', description: 'Access to email address' },
    { id: 'calendar', label: 'Calendar', description: 'Manage calendar events' },
  ],
  facebook: [
    { id: 'public_profile', label: 'Public Profile', description: 'Basic profile info' },
    { id: 'email', label: 'Email', description: 'Email address' },
    { id: 'pages_read', label: 'Pages', description: 'Read page data' },
  ],
  github: [
    { id: 'user', label: 'User', description: 'Read user profile data' },
    { id: 'repo', label: 'Repositories', description: 'Access to repos' },
    { id: 'gist', label: 'Gists', description: 'Create and list gists' },
  ],
  microsoft: [
    { id: 'User.Read', label: 'User', description: 'Read user profile' },
    { id: 'Mail.Read', label: 'Mail', description: 'Read mail' },
    { id: 'Calendars.Read', label: 'Calendar', description: 'Read calendar' },
  ],
  twitter: [
    { id: 'tweet.read', label: 'Read Tweets', description: 'Read tweets' },
    { id: 'users.read', label: 'Read Users', description: 'Read user profiles' },
    { id: 'follows.read', label: 'Follows', description: 'Read follow lists' },
  ],
};

export function OAuthFlowDialog({
  open,
  onOpenChange,
  onAuthorize,
}: OAuthFlowDialogProps) {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authResult, setAuthResult] = useState<{
    authUrl: string;
    token?: string;
    expiresAt?: Date;
  } | null>(null);

  const form = useForm<OAuthFormData>({
    resolver: zodResolver(oauthSchema),
    defaultValues: {
      provider: 'google',
      scopes: [],
    },
  });

  const selectedProvider = form.watch('provider');
  const availableScopes = scopesByProvider[selectedProvider] || [];

  const onSubmit = async (data: OAuthFormData) => {
    setIsAuthorizing(true);
    try {
      const result = await onAuthorize(data);
      setAuthResult(result);
    } catch (error) {
      console.error('OAuth error:', error);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const handleCopyToken = () => {
    if (authResult?.token) {
      navigator.clipboard.writeText(authResult.token);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>OAuth Authorization</DialogTitle>
          <DialogDescription>
            Connect your account with an OAuth provider
          </DialogDescription>
        </DialogHeader>

        {!authResult ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {providers.map((provider) => (
                          <SelectItem key={provider.value} value={provider.value}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scopes"
                render={() => (
                  <FormItem>
                    <FormLabel>Permissions</FormLabel>
                    <FormDescription>
                      Select the permissions you want to grant
                    </FormDescription>
                    <div className="space-y-2">
                      {availableScopes.map((scope) => (
                        <FormField
                          key={scope.id}
                          control={form.control}
                          name="scopes"
                          render={({ field }) => (
                            <FormItem className="flex items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(scope.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, scope.id])
                                      : field.onChange(
                                          field.value?.filter((value) => value !== scope.id)
                                        );
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="font-normal">
                                  {scope.label}
                                </FormLabel>
                                <FormDescription>{scope.description}</FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAuthorizing}>
                  {isAuthorizing ? 'Authorizing...' : 'Authorize'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-2">
              <div className="font-medium">Authorization URL</div>
              <div className="flex gap-2">
                <Input value={authResult.authUrl} readOnly className="flex-1" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(authResult.authUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {authResult.token && (
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Access Token</div>
                  <Button variant="outline" size="sm" onClick={handleCopyToken}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
                <div className="font-mono text-xs bg-muted p-2 rounded break-all">
                  {authResult.token}
                </div>
                {authResult.expiresAt && (
                  <div className="text-xs text-muted-foreground">
                    Expires: {new Date(authResult.expiresAt).toLocaleString()}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
