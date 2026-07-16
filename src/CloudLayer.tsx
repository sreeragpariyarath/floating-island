import * as THREE from "three";
import { Clouds, Cloud } from "@react-three/drei";

// Drifting mist around the islands, tinted from the model's palette.
// Positions reference the island world coords (see scripts/extract-path.mjs).
const TEX = "/textures/cloud.png";

export function CloudLayer() {
  return (
    <Clouds texture={TEX} material={THREE.MeshBasicMaterial} limit={400}>
      {/* fog bank below the main island cluster */}
      <Cloud seed={1} position={[2, -5.5, 0]} bounds={[9, 1.5, 7]} segments={35} volume={9} opacity={0.3} speed={0.15} fade={12} color="#7a3a33" />
      <Cloud seed={2} position={[8, -4.8, -3]} bounds={[6, 1.5, 5]} segments={25} volume={7} opacity={0.28} speed={0.15} fade={12} color="#84463a" />
      <Cloud seed={3} position={[-3, -4, 4]} bounds={[5, 1.5, 4]} segments={20} volume={6} opacity={0.28} speed={0.15} fade={12} color="#8a4a3f" />
      {/* mid-level wisps drifting between the islands */}
      <Cloud seed={4} position={[-5, 1.5, -2]} bounds={[4, 1.5, 4]} segments={18} volume={6} opacity={0.2} speed={0.2} fade={12} color="#6d4a52" />
      <Cloud seed={5} position={[9, 0.5, 3]} bounds={[5, 1.5, 4]} segments={18} volume={6} opacity={0.18} speed={0.2} fade={12} color="#75505a" />
      <Cloud seed={6} position={[0, 3.5, 9]} bounds={[6, 2, 3]} segments={20} volume={7} opacity={0.2} speed={0.2} fade={12} color="#7d4a44" />
      {/* high wisps around the upper islands */}
      <Cloud seed={7} position={[-3, 8.5, -2]} bounds={[6, 2, 5]} segments={22} volume={7} opacity={0.2} speed={0.25} fade={12} color="#66505e" />
      <Cloud seed={8} position={[-5, 12, 4]} bounds={[5, 2, 4]} segments={18} volume={6} opacity={0.18} speed={0.25} fade={12} color="#5d4a5c" />
    </Clouds>
  );
}
