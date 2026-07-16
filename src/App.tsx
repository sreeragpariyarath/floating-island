import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ScrollControls } from "@react-three/drei";
import { Temple } from "./Temple";
import { PathCamera } from "./PathCamera";
import { CloudLayer } from "./CloudLayer";
import { IntroClouds } from "./IntroClouds";

function App() {
  return (
    <Canvas camera={{ position: [16.4, 1, -7.8], fov: 50 }}>
      <ScrollControls pages={6} damping={0.3}>
        <Suspense fallback={null}>
          <Temple />
          <CloudLayer />
          <IntroClouds />
        </Suspense>
        <PathCamera />
      </ScrollControls>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 10, 5]} intensity={3} />
      <directionalLight position={[-5, -5, -5]} intensity={1} />
    </Canvas>
  );
}

export default App;
