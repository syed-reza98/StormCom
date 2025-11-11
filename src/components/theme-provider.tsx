'use client';

import React, { Suspense } from 'react';
import { Theme } from '@radix-ui/themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Client-side Theme Provider wrapper
 * Isolates Radix UI Theme's client-side hydration from server rendering
 * to prevent hydration mismatches caused by dynamic theme attributes
 * 
 * Wrapped with Suspense to prevent hydration errors from async theme loading
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <Theme
      appearance="inherit"
      accentColor="teal"
      grayColor="slate"
      panelBackground="solid"
      radius="medium"
      scaling="100%"
    >
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        {children}
      </Suspense>
    </Theme>
  );
}
