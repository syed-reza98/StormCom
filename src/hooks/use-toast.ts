// Minimal useToast hook used by components in tests/dev
// Provides a no-op toast in server/test environments and a simple wrapper in client

export default function useToast() {
  function toast({ title, description }: { title?: string; description?: string }) {
    if (typeof window !== 'undefined' && (window as any).console) {
      // Lightweight: log to console in dev; real app should replace with Radix toast
      // eslint-disable-next-line no-console
      console.info('[toast]', title, description);
    }
  }

  return { toast };
}
