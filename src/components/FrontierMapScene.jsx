import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "@/hooks/useReducedMotion";

function WireTorus() {
  const ref = useRef();

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.x += delta * 0.08;
      ref.current.rotation.y += delta * 0.12;
    }
  });

  return (
    <mesh ref={ref}>
      <torusGeometry args={[1.6, 0.02, 16, 80]} />
      <meshBasicMaterial color="#4a7fa8" transparent opacity={0.35} wireframe />
    </mesh>
  );
}

function InnerRing() {
  const ref = useRef();

  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.z -= delta * 0.06;
    }
  });

  return (
    <mesh ref={ref} rotation={[Math.PI / 3, 0, 0]}>
      <torusGeometry args={[1.1, 0.015, 12, 64]} />
      <meshBasicMaterial color="#9a8f6e" transparent opacity={0.25} wireframe />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <WireTorus />
      <InnerRing />
    </>
  );
}

export function FrontierMapScene({ className }) {
  const reduced = useReducedMotion();

  if (reduced) return null;

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
