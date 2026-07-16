// Prints world-space positions of the stepping-stone bones (step_*) and
// island roots baked into temple.glb, so the camera path can be authored
// from the model's own data.
import fs from 'node:fs'
import * as THREE from 'three'

const buf = fs.readFileSync(new URL('../public/models/temple.glb', import.meta.url))
const jsonLen = buf.readUInt32LE(12)
const json = JSON.parse(buf.toString('utf8', 20, 20 + jsonLen))

const world = new Array(json.nodes.length)

function localMatrix(node) {
  const m = new THREE.Matrix4()
  if (node.matrix) return m.fromArray(node.matrix)
  const t = node.translation ?? [0, 0, 0]
  const r = node.rotation ?? [0, 0, 0, 1]
  const s = node.scale ?? [1, 1, 1]
  return m.compose(new THREE.Vector3(...t), new THREE.Quaternion(...r), new THREE.Vector3(...s))
}

function walk(i, parent) {
  world[i] = parent.clone().multiply(localMatrix(json.nodes[i]))
  for (const c of json.nodes[i].children ?? []) walk(c, world[i])
}

for (const root of json.scenes[json.scene ?? 0].nodes) walk(root, new THREE.Matrix4())

json.nodes.forEach((n, i) => {
  if (/^(step_|helper_|island_[A-Z]|island_gate_039|sky_bone)/.test(n.name ?? '')) {
    const p = new THREE.Vector3().setFromMatrixPosition(world[i])
    console.log(n.name.padEnd(24), p.x.toFixed(2), p.y.toFixed(2), p.z.toFixed(2))
  }
})
