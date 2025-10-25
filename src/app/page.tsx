import React from 'react';

export default function HomePage(): React.JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to StormCom
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Multi-tenant E-commerce SaaS Platform
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">🏪 Multi-tenant</h2>
            <p className="text-gray-600">
              Manage multiple stores from a single platform
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">🛒 E-commerce</h2>
            <p className="text-gray-600">
              Complete product catalog and checkout system
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">⚡ Next.js 16</h2>
            <p className="text-gray-600">
              Built with the latest Next.js App Router
            </p>
          </div>
        </div>
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            🚀 <strong>Status:</strong> Setup phase in progress. Installing dependencies...
          </p>
        </div>
      </div>
    </main>
  );
}
