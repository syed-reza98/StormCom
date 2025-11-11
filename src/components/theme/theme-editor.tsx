/**
 * Theme Editor Component
 * 
 * Interactive theme customization interface with live preview.
 * Allows editing colors, typography, layout, and provides color palette presets.
 * 
 * @module components/theme/theme-editor
 */

'use client';

import { useState, useEffect } from 'react';
import { Theme, ThemeMode } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useToast from '@/hooks/use-toast';
import { Loader2, Check, RotateCcw } from 'lucide-react';
import { getThemeStyles } from '@/lib/theme-utils';

interface ThemeEditorProps {
  storeId: string;
  initialTheme: Theme;
}

export function ThemeEditor({ storeId, initialTheme }: ThemeEditorProps) {
  const { toast } = useToast();
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Color palettes for quick selection
  const colorPalettes = [
    {
      name: 'Ocean Blue',
      primaryColor: '#3B82F6',
      secondaryColor: '#10B981',
      accentColor: '#F59E0B',
    },
    {
      name: 'Forest Green',
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      accentColor: '#F59E0B',
    },
    {
      name: 'Sunset Orange',
      primaryColor: '#F59E0B',
      secondaryColor: '#EF4444',
      accentColor: '#3B82F6',
    },
    {
      name: 'Royal Purple',
      primaryColor: '#8B5CF6',
      secondaryColor: '#A855F7',
      accentColor: '#EC4899',
    },
  ];

  const availableFonts = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
  ];

  useEffect(() => {
    setHasChanges(JSON.stringify(theme) !== JSON.stringify(initialTheme));
  }, [theme, initialTheme]);

  const handleChange = (field: keyof Theme, value: string | ThemeMode) => {
    setTheme((prev) => ({ ...prev, [field]: value }));
  };

  const applyPalette = (palette: typeof colorPalettes[0]) => {
    setTheme((prev) => ({
      ...prev,
      primaryColor: palette.primaryColor,
      secondaryColor: palette.secondaryColor,
      accentColor: palette.accentColor,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/stores/${storeId}/theme`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          accentColor: theme.accentColor,
          backgroundColor: theme.backgroundColor,
          textColor: theme.textColor,
          fontFamily: theme.fontFamily,
          headingFont: theme.headingFont,
          fontSize: theme.fontSize,
          layoutWidth: theme.layoutWidth,
          borderRadius: theme.borderRadius,
          mode: theme.mode,
          customCss: theme.customCss,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to save theme');
      }

      toast({
        title: 'Theme saved',
        description: 'Your theme has been updated successfully.',
      });
      setHasChanges(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save theme',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const response = await fetch(`/api/stores/${storeId}/theme`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to reset theme');
      }

      const { data } = await response.json();
      setTheme(data);
      setHasChanges(false);

      toast({
        title: 'Theme reset',
        description: 'Your theme has been reset to default values.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reset theme',
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Panel */}
      <div className="space-y-6">
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Color Palette</CardTitle>
                <CardDescription>Choose a preset or customize colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {colorPalettes.map((palette) => (
                    <Button
                      key={palette.name}
                      variant="outline"
                      onClick={() => applyPalette(palette)}
                      className="h-auto p-3"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: palette.primaryColor }}
                          />
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: palette.secondaryColor }}
                          />
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: palette.accentColor }}
                          />
                        </div>
                        <span className="text-sm">{palette.name}</span>
                      </div>
                    </Button>
                  ))}
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={theme.primaryColor}
                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={theme.primaryColor}
                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={theme.secondaryColor}
                        onChange={(e) => handleChange('secondaryColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={theme.secondaryColor}
                        onChange={(e) => handleChange('secondaryColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Accent Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={theme.accentColor}
                        onChange={(e) => handleChange('accentColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={theme.accentColor}
                        onChange={(e) => handleChange('accentColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={theme.backgroundColor}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={theme.backgroundColor}
                        onChange={(e) => handleChange('backgroundColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="textColor">Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="textColor"
                        type="color"
                        value={theme.textColor}
                        onChange={(e) => handleChange('textColor', e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={theme.textColor}
                        onChange={(e) => handleChange('textColor', e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Customize fonts and sizes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fontFamily">Body Font</Label>
                  <Select
                    value={theme.fontFamily}
                    onValueChange={(value) => handleChange('fontFamily', value)}
                  >
                    <SelectTrigger id="fontFamily">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFonts.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headingFont">Heading Font</Label>
                  <Select
                    value={theme.headingFont}
                    onValueChange={(value) => handleChange('headingFont', value)}
                  >
                    <SelectTrigger id="headingFont">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFonts.map((font) => (
                        <SelectItem key={font} value={font}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fontSize">Base Font Size</Label>
                  <Select
                    value={theme.fontSize}
                    onValueChange={(value) => handleChange('fontSize', value)}
                  >
                    <SelectTrigger id="fontSize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="14px">14px (Small)</SelectItem>
                      <SelectItem value="16px">16px (Medium)</SelectItem>
                      <SelectItem value="18px">18px (Large)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mode">Theme Mode</Label>
                  <Select
                    value={theme.mode}
                    onValueChange={(value) => handleChange('mode', value as ThemeMode)}
                  >
                    <SelectTrigger id="mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ThemeMode.LIGHT}>Light</SelectItem>
                      <SelectItem value={ThemeMode.DARK}>Dark</SelectItem>
                      <SelectItem value={ThemeMode.AUTO}>Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Layout Tab */}
          <TabsContent value="layout" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Layout</CardTitle>
                <CardDescription>Configure layout settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="layoutWidth">Maximum Width</Label>
                  <Select
                    value={theme.layoutWidth}
                    onValueChange={(value) => handleChange('layoutWidth', value)}
                  >
                    <SelectTrigger id="layoutWidth">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024px">1024px (Tablet)</SelectItem>
                      <SelectItem value="1280px">1280px (Desktop)</SelectItem>
                      <SelectItem value="1536px">1536px (Large)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borderRadius">Border Radius</Label>
                  <Select
                    value={theme.borderRadius}
                    onValueChange={(value) => handleChange('borderRadius', value)}
                  >
                    <SelectTrigger id="borderRadius">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0rem">0rem (Square)</SelectItem>
                      <SelectItem value="0.25rem">0.25rem (Small)</SelectItem>
                      <SelectItem value="0.5rem">0.5rem (Medium)</SelectItem>
                      <SelectItem value="0.75rem">0.75rem (Large)</SelectItem>
                      <SelectItem value="1rem">1rem (Extra Large)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            disabled={isResetting}
          >
            {isResetting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              <>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Preview Panel */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>See how your theme looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="p-6 rounded-lg border"
              style={getThemeStyles(theme)}
            >
              <div style={{ backgroundColor: 'var(--background-color)', color: 'var(--text-color)' }} className="space-y-4 p-4 rounded">
                <h1 style={{ fontFamily: 'var(--heading-font)', color: 'var(--primary-color)' }} className="text-3xl font-bold">
                  Preview Heading
                </h1>
                <p style={{ fontFamily: 'var(--font-family)', fontSize: 'var(--font-size)' }}>
                  This is how your body text will look with the selected font and size.
                </p>
                <div className="flex gap-2">
                  <button
                    style={{ backgroundColor: 'var(--primary-color)', borderRadius: 'var(--border-radius)' }}
                    className="px-4 py-2 text-white"
                  >
                    Primary Button
                  </button>
                  <button
                    style={{ backgroundColor: 'var(--secondary-color)', borderRadius: 'var(--border-radius)' }}
                    className="px-4 py-2 text-white"
                  >
                    Secondary Button
                  </button>
                  <button
                    style={{ backgroundColor: 'var(--accent-color)', borderRadius: 'var(--border-radius)' }}
                    className="px-4 py-2 text-white"
                  >
                    Accent Button
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
