export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          StormCom
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Multi-Tenant E-Commerce Platform
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Development server is running. Visit{' '}
          <code className="rounded bg-muted px-2 py-1 font-mono text-sm">
            /api/stores
          </code>{' '}
          to test API endpoints.
        </p>
      </div>
    </main>
  );
}
