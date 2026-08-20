'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles, Environment } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

function Orb() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.0025;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    // subtle mouse parallax
    const targetX = state.pointer.x * 0.3;
    const targetY = state.pointer.y * 0.3;
    meshRef.current.rotation.y += (targetX - meshRef.current.rotation.y) * 0.02;
    meshRef.current.rotation.x += (targetY - meshRef.current.rotation.x) * 0.02;
  });

  return (
    <Float speed={1.4} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[1.6, 8]} />
        <MeshDistortMaterial
          color="#10b981"
          emissive="#6ee7b7"
          emissiveIntensity={0.25}
          distort={0.35}
          speed={1.8}
          roughness={0.15}
          metalness={0.6}
        />
      </mesh>
    </Float>
  );
}

const FLOATING_CARDS = [
  'Booking', 'AI Analysis', 'Technician', 'Live Map', 'Invoice', 'Payment', 'Automation',
];

export default function AiOrbHero() {
  return (
    <section className="relative h-[90vh] w-full overflow-hidden bg-forest-950">
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <pointLight position={[5, 5, 5]} intensity={1.2} color="#bef264" />
          <Orb />
          <Sparkles count={80} scale={6} size={2} speed={0.3} color="#6ee7b7" />
          <Environment preset="night" />
        </Suspense>
      </Canvas>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl md:text-6xl font-semibold text-offwhite tracking-tight"
        >
          Your entire service business.
          <br />
          <span className="text-mint">One intelligent flow.</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="pointer-events-auto mt-8"
        >
          <a
            href="#book"
            className="inline-block rounded-xl bg-emerald-600 px-8 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-600/30"
          >
            Book a Service
          </a>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-0 hidden md:block">
        {FLOATING_CARDS.map((label, i) => {
          const angle = (i / FLOATING_CARDS.length) * Math.PI * 2;
          const radius = 38;
          const top = 50 + Math.sin(angle) * radius;
          const left = 50 + Math.cos(angle) * radius;
          return (
            <motion.div
              key={label}
              className="glass absolute rounded-xl px-4 py-2 text-sm text-mint"
              style={{ top: `${top}%`, left: `${left}%` }}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {label}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
