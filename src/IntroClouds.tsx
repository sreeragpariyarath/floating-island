import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Clouds, Cloud } from "@react-three/drei";

const TEX = "/textures/cloud.png";
const HOLD = 0.4; // seconds fully covered before the fog starts parting
const DURATION = 3.2; // seconds the parting takes

// Cloud banks placed in front of the hero camera (local space: x right,
// y up, z toward the scene). ~60% exit along their direction on load;
// the rest stay behind as part of the scene.
const BANKS: {
  pos: [number, number, number];
  exit: [number, number, number];
  color: string;
  stays: boolean;
  opacity: number;
}[] = [
  { pos: [0, -0.4, -6], exit: [0, -7, 0], color: "#8a4a3f", stays: false, opacity: 0.55 },
  { pos: [-4.4, 0.8, -7.5], exit: [-10, 1.5, 0], color: "#7a3a33", stays: true, opacity: 0.28 },
  { pos: [3.5, 0.4, -6.5], exit: [10, 1.5, 0], color: "#84463a", stays: false, opacity: 0.55 },
  { pos: [-1.8, -1.9, -5.5], exit: [-6, -5, 0], color: "#6d4a52", stays: false, opacity: 0.55 },
  { pos: [2.6, -2.4, -6.5], exit: [6, -5, 0], color: "#75505a", stays: true, opacity: 0.26 },
  { pos: [0.4, 2, -7], exit: [1.5, 7, 0], color: "#7d4a44", stays: false, opacity: 0.55 },
];

function easeInOutCubic(x: number) {
  const t = Math.min(Math.max(x, 0), 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function IntroClouds() {
  const group = useRef<THREE.Group>(null);
  const banks = useRef<(THREE.Group | null)[]>([]);
  const [anchored, setAnchored] = useState(false);
  const [done, setDone] = useState(false);
  const frame = useRef(0);
  const start = useRef<number | null>(null);

  useFrame(({ camera, clock }) => {
    if (done || !group.current) return;
    frame.current += 1;
    // Anchor the fog wall on frame 2, after PathCamera has settled the hero pose
    if (frame.current === 2) {
      group.current.position.copy(camera.position);
      group.current.quaternion.copy(camera.quaternion);
      setAnchored(true);
      start.current = clock.elapsedTime;
    }
    if (start.current == null) return;
    const p = (clock.elapsedTime - start.current - HOLD) / DURATION;
    if (p >= 1) {
      setDone(true);
      return;
    }
    const k = easeInOutCubic(p);
    BANKS.forEach((b, i) => {
      if (b.stays) return;
      const g = banks.current[i];
      if (g) g.position.set(b.pos[0] + b.exit[0] * k, b.pos[1] + b.exit[1] * k, b.pos[2]);
    });
  });

  return (
    <group ref={group} visible={anchored}>
      <Clouds texture={TEX} material={THREE.MeshBasicMaterial} limit={200}>
        {BANKS.map((b, i) =>
          done && !b.stays ? null : (
            <group
              key={i}
              ref={(el) => {
                banks.current[i] = el;
              }}
              position={b.pos}
            >
              <Cloud
                seed={i + 10}
                bounds={[3.5, 1.8, 1.5]}
                segments={20}
                volume={5}
                opacity={b.opacity}
                speed={0.3}
                // Staying banks dissolve when the camera walks through them
                fade={b.stays ? 5 : 0.1}
                color={b.color}
              />
            </group>
          ),
        )}
      </Clouds>
    </group>
  );
}
