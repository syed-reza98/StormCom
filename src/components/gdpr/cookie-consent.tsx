'use client';

// src/components/gdpr/cookie-consent.tsx
// Cookie Consent Banner - GDPR compliant consent management

import { useState, useEffect } from 'react';
import { Flex, Card, Heading, Text, Button, Switch, Separator } from '@radix-ui/themes';
import { CheckIcon, Cross2Icon } from '@radix-ui/react-icons';

type ConsentPreferences = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
};

const CONSENT_STORAGE_KEY = 'stormcom_cookie_consent';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [consent, setConsent] = useState<ConsentPreferences>({
    essential: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!storedConsent) {
      // Small delay to prevent flash on page load
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
    // Return undefined for the else path (TypeScript strict mode requirement)
    return undefined;
  }, []);

  /**
   * Save consent preferences to API and localStorage
   */
  const saveConsent = async (preferences: ConsentPreferences) => {
    setIsLoading(true);

    try {
      // Save each consent type to the API
      const consentTypes: Array<keyof ConsentPreferences> = ['essential', 'analytics', 'marketing', 'preferences'];
      
      for (const type of consentTypes) {
        const response = await fetch('/api/gdpr/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            consentType: type.toUpperCase(),
            granted: preferences[type],
          }),
        });

        if (!response.ok) {
          console.error(`Failed to save ${type} consent`);
        }
      }

      // Save to localStorage
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({
        ...preferences,
        timestamp: new Date().toISOString(),
      }));

      setShowBanner(false);
    } catch (error) {
      console.error('Error saving consent preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Accept all cookies
   */
  const handleAcceptAll = () => {
    const allConsent: ConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    saveConsent(allConsent);
  };

  /**
   * Reject all non-essential cookies
   */
  const handleRejectAll = () => {
    const minimalConsent: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    saveConsent(minimalConsent);
  };

  /**
   * Save custom preferences
   */
  const handleSavePreferences = () => {
    saveConsent(consent);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        aria-hidden="true"
      />

      {/* Banner */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
      >
        <Card size="3" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Flex direction="column" gap="4" p="4">
            {/* Header */}
            <Flex direction="column" gap="2">
              <Heading size="5" id="cookie-consent-title">
                🍪 We use cookies
              </Heading>
              <Text size="2" color="gray">
                We use cookies to enhance your browsing experience, analyze site traffic, 
                and personalize content. By clicking &quot;Accept All&quot;, you consent to our use of cookies.
              </Text>
            </Flex>

            {/* Details Section */}
            {showDetails ? (
              <Flex direction="column" gap="3">
                <Separator size="4" />
                
                {/* Essential Cookies */}
                <Flex justify="between" align="start" gap="3">
                  <Flex direction="column" gap="1" style={{ flex: 1 }}>
                    <Text size="2" weight="bold">
                      Essential Cookies (Required)
                    </Text>
                    <Text size="1" color="gray">
                      Necessary for the website to function. Cannot be disabled.
                    </Text>
                  </Flex>
                  <Switch
                    checked={true}
                    disabled={true}
                    aria-label="Essential cookies (required)"
                  />
                </Flex>

                {/* Analytics Cookies */}
                <Flex justify="between" align="start" gap="3">
                  <Flex direction="column" gap="1" style={{ flex: 1 }}>
                    <Text size="2" weight="bold">
                      Analytics Cookies
                    </Text>
                    <Text size="1" color="gray">
                      Help us understand how visitors interact with our website.
                    </Text>
                  </Flex>
                  <Switch
                    checked={consent.analytics}
                    onCheckedChange={(checked) => setConsent(prev => ({ ...prev, analytics: checked }))}
                    aria-label="Analytics cookies"
                  />
                </Flex>

                {/* Marketing Cookies */}
                <Flex justify="between" align="start" gap="3">
                  <Flex direction="column" gap="1" style={{ flex: 1 }}>
                    <Text size="2" weight="bold">
                      Marketing Cookies
                    </Text>
                    <Text size="1" color="gray">
                      Used to track visitors across websites for advertising purposes.
                    </Text>
                  </Flex>
                  <Switch
                    checked={consent.marketing}
                    onCheckedChange={(checked) => setConsent(prev => ({ ...prev, marketing: checked }))}
                    aria-label="Marketing cookies"
                  />
                </Flex>

                {/* Preferences Cookies */}
                <Flex justify="between" align="start" gap="3">
                  <Flex direction="column" gap="1" style={{ flex: 1 }}>
                    <Text size="2" weight="bold">
                      Preference Cookies
                    </Text>
                    <Text size="1" color="gray">
                      Remember your preferences and settings for a personalized experience.
                    </Text>
                  </Flex>
                  <Switch
                    checked={consent.preferences}
                    onCheckedChange={(checked) => setConsent(prev => ({ ...prev, preferences: checked }))}
                    aria-label="Preference cookies"
                  />
                </Flex>

                <Separator size="4" />
              </Flex>
            ) : null}

            {/* Actions */}
            <Flex gap="2" wrap="wrap" justify="end">
              <Button
                variant="ghost"
                color="gray"
                size="2"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide' : 'Customize'} Settings
              </Button>
              
              {showDetails ? (
                <>
                  <Button
                    variant="soft"
                    color="gray"
                    size="2"
                    onClick={handleRejectAll}
                    disabled={isLoading}
                  >
                    <Cross2Icon />
                    Reject All
                  </Button>
                  <Button
                    variant="solid"
                    color="teal"
                    size="2"
                    onClick={handleSavePreferences}
                    disabled={isLoading}
                  >
                    <CheckIcon />
                    {isLoading ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="soft"
                    color="gray"
                    size="2"
                    onClick={handleRejectAll}
                    disabled={isLoading}
                  >
                    <Cross2Icon />
                    Reject All
                  </Button>
                  <Button
                    variant="solid"
                    color="teal"
                    size="2"
                    onClick={handleAcceptAll}
                    disabled={isLoading}
                  >
                    <CheckIcon />
                    {isLoading ? 'Saving...' : 'Accept All'}
                  </Button>
                </>
              )}
            </Flex>

            {/* Privacy Policy Link */}
            <Text size="1" color="gray" align="center">
              Read our{' '}
              <a
                href="/privacy-policy"
                className="text-teal-600 hover:text-teal-700 underline"
              >
                Privacy Policy
              </a>
              {' '}and{' '}
              <a
                href="/settings/privacy"
                className="text-teal-600 hover:text-teal-700 underline"
              >
                Privacy Settings
              </a>
              {' '}for more information.
            </Text>
          </Flex>
        </Card>
      </div>
    </>
  );
}
