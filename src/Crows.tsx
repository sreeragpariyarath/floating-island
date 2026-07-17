import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";

const COUNT = 6;
const WINGSPAN = 0.8; // target world-space wingspan
const FLY_CLIP = "SKM_Crow|SKM_Crow|Crow_Fly";
const SCENE_CENTER = new THREE.Vector3(2, 2.5, 1);

// Deterministic rng so each crow keeps the same path across renders
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A wobbly closed ring around the islands
function makeLoop(rng: () => number) {
  const points: THREE.Vector3[] = [];
  const n = 6;
  const baseR = 6 + rng() * 6;
  const phase = rng() * Math.PI * 2;
  for (let i = 0; i < n; i++) {
    const a = phase + (i / n) * Math.PI * 2;
    const r = baseR * (0.75 + rng() * 0.5);
    points.push(
      new THREE.Vector3(
        SCENE_CENTER.x + Math.cos(a) * r,
        SCENE_CENTER.y + (rng() - 0.35) * 7,
        SCENE_CENTER.z + Math.sin(a) * r * (0.7 + rng() * 0.5),
      ),
    );
  }
  if (rng() > 0.5) points.reverse();
  return new THREE.CatmullRomCurve3(points, true, "centripetal");
}

function Crow({ index }: { index: number }) {
  const { scene, animations } = useGLTF("/models/crow.glb");
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Group>(null);
  const calibrated = useRef(false);
  const frames = useRef(0);
  const maxSpan = useRef(0);
  const center = useRef(new THREE.Vector3());

  const { clone, skinnedMesh, curve, speed, offset, mixer, targetSpan } = useMemo(() => {
    const rng = mulberry32(index * 1013 + 7);
    const clone = skeletonClone(scene);

    let skinnedMesh: THREE.SkinnedMesh | null = null;
    clone.traverse((o) => {
      if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinnedMesh = o as THREE.SkinnedMesh;
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        mesh.frustumCulled = false;
        const mat = (mesh.material as THREE.MeshStandardMaterial).clone();
        mat.color.set("#1c1416");
        mesh.material = mat;
      }
    });

    const clip = animations.find((a) => a.name === FLY_CLIP) ?? animations[0];
    const mixer = new THREE.AnimationMixer(clone);
    const action = mixer.clipAction(clip);
    action.time = rng() * clip.duration;
    action.timeScale = 0.9 + rng() * 0.35;
    action.play();

    return {
      clone,
      skinnedMesh: skinnedMesh as THREE.SkinnedMesh | null,
      curve: makeLoop(rng),
      speed: 1 / (45 + rng() * 35), // seconds per lap → curve fraction per second
      offset: rng(),
      mixer,
      targetSpan: WINGSPAN * (0.8 + rng() * 0.5),
    };
  }, [scene, animations, index]);

  useFrame((state, delta) => {
    mixer.update(delta);
    const g = group.current;
    if (!g) return;

    // This rig bakes unit compensation into the animation itself, so the only
    // reliable size/origin is the skinned result. Sample the skinned bounds
    // across ~20 frames (to catch wings fully spread), then scale and
    // recenter the crow onto its path node. Hidden until calibrated.
    if (!calibrated.current) {
      g.visible = false;
      g.position.copy(curve.getPointAt(offset));
      frames.current += 1;
      if (frames.current >= 3 && skinnedMesh && inner.current) {
        skinnedMesh.updateWorldMatrix(true, false);
        skinnedMesh.computeBoundingBox(); // skinned-aware for SkinnedMesh
        const bb = skinnedMesh.boundingBox!.clone().applyMatrix4(skinnedMesh.matrixWorld);
        const size = bb.getSize(new THREE.Vector3());
        const span = Math.max(size.x, size.z);
        if (Number.isFinite(span) && span > maxSpan.current) {
          maxSpan.current = span;
          center.current.copy(bb.getCenter(new THREE.Vector3()));
        }
        if (frames.current >= 22 && maxSpan.current > 1e-4) {
          g.scale.setScalar(targetSpan / maxSpan.current);
          // Move the skinned center onto the group origin (measured at scale 1)
          inner.current.position.copy(g.position).sub(center.current);
          g.visible = true;
          calibrated.current = true;
        }
      }
      return;
    }

    const u = (state.clock.elapsedTime * speed + offset) % 1;
    g.position.copy(curve.getPointAt(u));
    g.lookAt(curve.getPointAt((u + 0.01) % 1));
  });

  return (
    <group ref={group}>
      <group ref={inner}>
        <primitive object={clone} />
      </group>
    </group>
  );
}

export function Crows() {
  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => (
        <Crow key={i} index={i} />
      ))}
    </>
  );
}

useGLTF.preload("/models/crow.glb");
