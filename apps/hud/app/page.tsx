'use client'
import DriftMapCanvas from '../components/DriftMapCanvas'

export default function HUDPage() {
  return (
    <main className="min-h-screen p-4 bg-black">
      <section className="panel relative" style={{ height: '80vh' }}>
        <DriftMapCanvas />
      </section>
    </main>
  )
}


