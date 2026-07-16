import { useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";

// The user's hand-tuned landing view (scroll = 0).
const HERO_POS = new THREE.Vector3(16.4, 1, -6.8);
const HERO_TARGET = new THREE.Vector3(-12, -11, 9);

// Eye height above each stepping stone.
const EYE = 0.75;

// Mid-height of the Sanctuary gate pagoda — the walk's visual anchor.
const GATE_LOOK = new THREE.Vector3(-1.2, 1.6, 5.4);

// World positions of the step_* bones in temple.glb (see scripts/extract-path.mjs),
// ordered A -> T: from the far island up the stone path to the Sanctuary gate.
const STONES: [number, number, number][] = [
  [9.67, -2.76, -3.33], // A
  [9.08, -2.7, -3.17], // B
  [8.35, -2.66, -3.16], // C
  [7.65, -2.63, -3.16], // D
  [7.1, -2.49, -3.1], // E
  [6.24, -2.37, -3.06], // G
  [5.47, -2.04, -3.32], // H
  [4.33, -1.98, -0.48], // I
  [3.94, -2.13, 0.47], // J
  [3.63, -2.01, 1.15], // K
  [3.36, -1.84, 1.88], // L
  [3.07, -1.38, 2.49], // M
  [2.47, -1.1, 2.93], // N — finale: frames the whole gate (P/R/S/T end up too close to it)
];

// Fraction of the scroll spent flying from the hero view down to the first stone.
const INTRO = 0.15;
// How far ahead along the curve the camera looks (fraction of total length).
const LOOK_AHEAD = 0.04;

function smoothstep(x: number) {
  const t = Math.min(Math.max(x, 0), 1);
  return t * t * (3 - 2 * t);
}

export function PathCamera() {
  const scroll = useScroll();

  const { curve, introEnd } = useMemo(() => {
    const stones = STONES.map(([x, y, z]) => new THREE.Vector3(x, y + EYE, z));
    const points = [
      HERO_POS.clone(),
      new THREE.Vector3(12.5, -0.8, -5.0), // approach: swing down behind the first island
      ...stones.slice(0, 7), // A..H along the ridge
      new THREE.Vector3(6.2, -1.5, -1.8), // bow outward around the central rock's corner
      ...stones.slice(7), // I..S climbing to the gate
    ];
    const curve = new THREE.CatmullRomCurve3(points, false, "centripetal");
    // Arc-length fraction where the fly-in ends (at stone A).
    const lengths = curve.getLengths(200);
    const total = lengths[lengths.length - 1];
    const flyIn = new THREE.CatmullRomCurve3(points.slice(0, 3), false, "centripetal").getLength();
    return { curve, introEnd: flyIn / total };
  }, []);

  useFrame(({ camera }) => {
    const t = scroll.offset;
    // Remap scroll so the fly-in takes INTRO of the scroll, the walk the rest.
    const u =
      t < INTRO
        ? introEnd * (t / INTRO)
        : introEnd + (1 - introEnd) * ((t - INTRO) / (1 - INTRO));

    const pos = curve.getPointAt(Math.min(u, 1));

    // Look ahead along the path; past the end, extrapolate along the tangent.
    const ahead = u + LOOK_AHEAD;
    const look =
      ahead <= 1
        ? curve.getPointAt(ahead)
        : curve
            .getPointAt(1)
            .add(curve.getTangentAt(1).multiplyScalar((ahead - 1) * curve.getLength()));

    // Keep the Sanctuary (the destination) in frame during the walk,
    // ramping to a full gaze up at the gate for the finale.
    const gateBias = 0.3 + 0.7 * smoothstep((t - 0.85) / 0.15);
    look.lerp(GATE_LOOK, gateBias);

    // Preserve the exact hero framing at the very top of the page.
    look.lerp(HERO_TARGET, 1 - smoothstep(t / 0.08));

    camera.position.copy(pos);
    camera.lookAt(look);
  });

  return null;
}
