import { useGLTF } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'

type TempleProps = Omit<ThreeElements['primitive'], 'object'>

export function Temple(props: TempleProps) {
  const { scene } = useGLTF('/models/temple.glb')
  return <primitive object={scene} {...props} />
}

useGLTF.preload('/models/temple.glb')
