import React from 'react';

export default function Loading(): React.JSX.Element {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-primary"></div>
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
