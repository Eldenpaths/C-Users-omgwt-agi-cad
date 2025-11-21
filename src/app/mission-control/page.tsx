'use client'

export default function MissionControlPage() {
  return (
    <div className="h-screen w-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Mission Control</h1>
        <p className="text-gray-400 mb-8">
          Mission Control interface is under reconstruction after the /apps/hud migration.
        </p>
        <div className="space-y-4">
          <a
            href="/"
            className="block px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            ← Back to Home
          </a>
          <a
            href="/nexus"
            className="block px-6 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg transition"
          >
            Go to Nexus →
          </a>
        </div>
      </div>
    </div>
  )
}

