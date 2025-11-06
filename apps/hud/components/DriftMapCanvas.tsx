"use client";
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import FogkeeperMaterial from './fx/FogkeeperMaterial'

type DriftEvt = { file?: string; time?: string; timestamp?: string }

function DriftOrbs({ events }: { events: DriftEvt[] }) {
  const group = useRef<THREE.Group>(null!)
  const [orbs, setOrbs] = useState<Array<[string, { x: number; y: number; z: number; t: number }]>>([])

  useEffect(() => {
    const map = new Map<string, { x: number; y: number; z: number; t: number }>()
    events.forEach((e, i) => {
      if (!e?.file) return
      const seed = Math.sin(e.file.length * 9999) * 1000
      map.set(e.file, {
        x: Math.sin(seed + i) * 4,
        y: Math.cos(seed + i) * 2,
        z: Math.sin(seed / 2 + i) * 3,
        t: new Date(e.time || e.timestamp || Date.now()).getTime(),
      })
    })
    setOrbs([...map.entries()])
  }, [events])

  useFrame(() => {
    const now = Date.now()
    group.current?.children.forEach((m: any) => {
      const dt = (now - (m.userData?.t || now)) / 1000
      const intensity = Math.max(0.1, 1.4 - dt / 3)
      if (m.material) m.material.emissiveIntensity = intensity
      m.scale.setScalar(0.5 + 0.3 * Math.sin(intensity * 3))
    })
  })

  return (
    <group ref={group}>
      {orbs.map(([file, o]) => (
        <mesh key={file} position={[o.x, o.y, o.z]} userData={{ t: o.t }}>
          <sphereGeometry args={[0.2, 24, 24]} />
          <meshStandardMaterial
            color={'#57D3FF'}
            emissive={'#57D3FF'}
            emissiveIntensity={0.5}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function DriftMapCanvas() {
  const [events, setEvents] = useState<any[]>([])
  const [pulse, setPulse] = useState(0)
  const [auto, setAuto] = useState(true)
  useEffect(() => {
    const es = new EventSource('/api/drift/stream')
    es.onmessage = e => {
      try {
        const evt = JSON.parse(e.data)
        setEvents(evts => [...evts.slice(-200), evt])
        setPulse(p => Math.min(1, p + 0.35))
      } catch {}
    }
    return () => es.close()
  }, [])

  return (
    <div className="relative h-full w-full bg-[#05090d]">
      <Canvas camera={{ position: [0, 2, 8], fov: 65 }}>
        <fog attach="fog" args={["#05090d", 8, 20]} />
        <ambientLight intensity={0.2} />
        <pointLight position={[0, 5, 5]} intensity={1.5} color={'#57D3FF'} />
        <FogkeeperMaterial pulse={pulse} />
        <Stars radius={20} depth={50} count={3000} factor={4} fade speed={1} />
        <DriftOrbs events={events} />
        <OrbitControls enableZoom={false} autoRotate={auto} autoRotateSpeed={0.4} />
      </Canvas>
      <div className="absolute bottom-2 right-3 text-cyan-400 text-xs opacity-70">
        Live Drift Map • {events.length} updates
      </div>
      <button
        onClick={() => setAuto(a => !a)}
        className="absolute top-2 right-3 px-2 py-1 rounded bg-cyan-900/40 text-cyan-200 text-xs border border-cyan-600/40 hover:bg-cyan-800/50"
      >
        {auto ? 'Auto-rotate: On' : 'Auto-rotate: Off'}
      </button>
    </div>
  )
}
