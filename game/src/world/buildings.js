// Neon Bay skyline: pastel Art Deco towers on the east side of Ocean Drive,
// each with a procedurally painted facade (lit windows) and a glowing neon
// sign. Buildings recycle ahead as the distance grows. Streetlights line
// the sidewalk.
import * as THREE from 'three';
import { mulberry32, range, pick } from '../random.js';

const SPAN = 260;
const SIGN_COLORS = [0xff2d78, 0x22d3ee, 0xb5e61d, 0xffb347, 0xc084fc];
const FACADE_COLORS = ['#c98a94', '#d9b36a', '#7fb5a3', '#b57a92', '#8fa3d9', '#d9a06a'];

function facadeTexture(rng, base) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 256);
  // Lit windows: warm and cool, most lit at dusk.
  for (let y = 12; y < 244; y += 18) {
    for (let x = 10; x < 118; x += 18) {
      const lit = rng();
      g.fillStyle = lit < 0.55 ? '#ffe1a0' : lit < 0.8 ? '#9adfff' : '#1c1830';
      g.fillRect(x, y, 11, 12);
    }
  }
  // Dark roof band.
  g.fillStyle = '#1a1426';
  g.fillRect(0, 0, 128, 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createBuildings(scene) {
  const rng = mulberry32(777);
  const textures = FACADE_COLORS.slice(0, 3).map((c) => facadeTexture(rng, c));
  const buildings = [];
  for (let i = 0; i < 12; i++) {
    const w = range(rng, 8, 14);
    const h = range(rng, 10, 34);
    const d = range(rng, 8, 12);
    const mat = new THREE.MeshStandardMaterial({ map: pick(rng, textures), roughness: 0.85 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(range(rng, 12, 16), h / 2, 0);
    m.castShadow = true;
    scene.add(m);
    // Neon sign: a glowing bar on the road-facing side, near the top.
    const sign = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, range(rng, 1.2, 2.2), range(rng, 4, 7)),
      new THREE.MeshStandardMaterial({
        color: 0x111111,
        emissive: pick(rng, SIGN_COLORS),
        emissiveIntensity: 3.0,
      }),
    );
    sign.position.set(m.position.x - w / 2 - 0.2, h - range(rng, 1.5, 3.5), 0);
    scene.add(sign);
    buildings.push({ mesh: m, sign, z: -10 + i * 22, x: m.position.x });
  }
  // Streetlights along the sidewalk.
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x2a2a30, roughness: 0.7, metalness: 0.6 });
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffd98a, emissiveIntensity: 2.0 });
  const lights = [];
  for (let i = 0; i < 8; i++) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 5.2, 8), poleMat);
    pole.position.y = 2.6;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), lampMat);
    lamp.position.y = 5.3;
    g.add(pole, lamp);
    g.position.x = 8.2;
    scene.add(g);
    lights.push({ mesh: g, z: i * 32 });
  }
  return {
    update(dist) {
      for (const b of buildings) {
        while (b.z - dist < -30) b.z += SPAN;
        b.mesh.position.z = -(b.z - dist);
        b.sign.position.z = -(b.z - dist);
      }
      for (const l of lights) {
        while (l.z - dist < -15) l.z += SPAN;
        l.mesh.position.z = -(l.z - dist);
      }
    },
  };
}
