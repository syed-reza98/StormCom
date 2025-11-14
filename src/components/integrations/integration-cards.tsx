'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plug, CheckCircle2, XCircle, Settings } from 'lucide-react';

type IntegrationStatus = 'connected' | 'disconnected' | 'error';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  status: IntegrationStatus;
  popular?: boolean;
}

interface IntegrationCardsProps {
  integrations: Integration[];
  onConnect: (integrationId: string) => void;
  onDisconnect: (integrationId: string) => void;
  onConfigure: (integrationId: string) => void;
}

export function IntegrationCards({
  integrations,
  onConnect,
  onDisconnect,
  onConfigure,
}: IntegrationCardsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const categories = Array.from(new Set(integrations.map((i) => i.category)));

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch = integration.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || integration.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-muted-foreground" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusVariant = (status: IntegrationStatus): 'default' | 'secondary' | 'destructive' => {
    switch (status) {
      case 'connected':
        return 'default';
      case 'disconnected':
        return 'secondary';
      case 'error':
        return 'destructive';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterCategory(null)}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={filterCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterCategory(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className="relative">
            {integration.popular && (
              <Badge
                variant="default"
                className="absolute top-2 right-2"
              >
                Popular
              </Badge>
            )}
            <CardHeader>
              <div className="flex items-start gap-3">
                <div className="text-3xl">{integration.icon}</div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{integration.name}</CardTitle>
                  <div className="text-xs text-muted-foreground mt-1">
                    {integration.category}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {integration.description}
              </p>

              <div className="flex items-center justify-between">
                <Badge
                  variant={getStatusVariant(integration.status)}
                  className="gap-1"
                >
                  {getStatusIcon(integration.status)}
                  {integration.status.charAt(0).toUpperCase() +
                    integration.status.slice(1)}
                </Badge>

                <div className="flex gap-2">
                  {integration.status === 'connected' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onConfigure(integration.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDisconnect(integration.id)}
                      >
                        Disconnect
                      </Button>
                    </>
                  )}
                  {integration.status !== 'connected' && (
                    <Button
                      size="sm"
                      onClick={() => onConnect(integration.id)}
                    >
                      <Plug className="mr-2 h-4 w-4" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredIntegrations.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No integrations found
        </div>
      )}
    </div>
  );
}
