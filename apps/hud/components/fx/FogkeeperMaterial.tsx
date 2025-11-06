'use client'
import * as THREE from 'three'
import { useFrame, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import { useRef } from 'react'

// GLSL source
const frag = `
uniform float u_time;
uniform float u_pulse;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453123); }
float noise(in vec2 p){
  vec2 i = floor(p), f = fract(p);
  float a = hash(i), b = hash(i+vec2(1.,0.)), c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
  vec2 u = f*f*(3.-2.*f);
  return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
}
float fbm(vec2 x){
  float v=0.0; float a=0.5;
  for(int i=0;i<5;i++){ v+=a*noise(x); x*=2.0; a*=0.5; }
  return v;
}

void main(){
  vec2 uv = vUv*2.0-1.0;
  float t = u_time*0.05;
  float n = fbm(uv*1.5 + vec2(t*0.8, t*0.5));
  float m = fbm(uv*3.5 - vec2(t*0.3, t*0.9));
  float fog = smoothstep(0.2, 0.9, n+m*0.5);
  vec3 color = mix(vec3(0.02,0.05,0.09), vec3(0.2,0.8,1.0), fog);
  color += pow(fog,6.0)*vec3(0.5,0.9,1.0);
  color *= (1.0 + 0.3 * clamp(u_pulse, 0.0, 1.0));
  gl_FragColor = vec4(color, (0.6*fog)*(0.6 + 0.4*clamp(u_pulse,0.0,1.0)));
}
`;

const vert = `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;

const FogMat = shaderMaterial(
  { u_time: 0, u_pulse: 0 },
  vert,
  frag,
  (self: THREE.ShaderMaterial) => { self.transparent = true; }
);

extend({ FogMat });

export default function FogkeeperMaterial({ pulse = 0 }: { pulse?: number }) {
  const ref = useRef<any>(null);
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.u_time += dt;
    // decay pulse
    ref.current.u_pulse = Math.max(0, (ref.current.u_pulse || 0) - dt * 0.5);
  });

  // apply pulse kick on prop change
  if (ref.current && pulse > 0) {
    ref.current.u_pulse = Math.min(1, (ref.current.u_pulse || 0) + pulse);
  }

  return (
    <mesh position={[0,0,-3]}>
      <planeGeometry args={[16,9]} />
      {/* @ts-ignore */}
      <fogMat ref={ref} />
    </mesh>
  );
}
