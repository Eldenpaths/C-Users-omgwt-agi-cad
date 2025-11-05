"use client";

//  TODO: This page is temporarily disabled due to Firebase SSR issues during build
// The original implementation caused build failures when Next.js tried to pre-render it
// Need to refactor to properly handle client-side only Firebase initialization

export default function OperatorTriageConsolePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-400 mb-4">
          Tesseract Operator Console
        </h1>
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
          <p className="text-gray-300 mb-4">
            This page is temporarily unavailable due to build configuration issues.
          </p>
          <p className="text-gray-400 text-sm">
            We're working on fixing Firebase initialization during server-side rendering.
            This page will be restored in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
