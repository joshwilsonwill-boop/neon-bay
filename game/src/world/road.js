// Ocean Drive: asphalt with scrolling centre dashes, beach and teal ocean
// on the west side, sidewalk on the east, and the traffic cones the player
// threads for near-miss bonuses. The road itself never moves; dashes and
// cones recycle ahead as the distance grows.
import * as THREE from 'three';
import { mulberry32, range } from '../random.js';

const DASH_SPAN = 288;
const CONE_SPAN = 150;

export function createRoad(scene) {
  const rng = mulberry32(20261119);
  const asphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 420),
    new THREE.MeshStandardMaterial({ color: 0x212128, roughness: 0.92, metalness: 0.05 }),
  );
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.set(0, 0, -180);
  asphalt.receiveShadow = true;
  scene.add(asphalt);
  // Edge lines.
  for (const x of [-7, 7]) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.02, 420),
      new THREE.MeshStandardMaterial({ color: 0xd8d8e0, roughness: 0.6 }),
    );
    line.position.set(x, 0.02, -180);
    scene.add(line);
  }
  // Beach strip, then the ocean.
  const beach = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 420),
    new THREE.MeshStandardMaterial({ color: 0xb99b6b, roughness: 1 }),
  );
  beach.rotation.x = -Math.PI / 2;
  beach.position.set(-9, 0.01, -180);
  scene.add(beach);
  const ocean = new THREE.Mesh(
    new THREE.PlaneGeometry(120, 420),
    new THREE.MeshStandardMaterial({ color: 0x0d4a5e, roughness: 0.3, metalness: 0.25 }),
  );
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(-71, -0.05, -180);
  scene.add(ocean);
  // Sidewalk on the building side.
  const walk = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 420),
    new THREE.MeshStandardMaterial({ color: 0x23232c, roughness: 1 }),
  );
  walk.rotation.x = -Math.PI / 2;
  walk.position.set(9, 0.01, -180);
  scene.add(walk);
  // Centre dashes.
  const dashGeo = new THREE.PlaneGeometry(0.18, 3);
  const dashMat = new THREE.MeshStandardMaterial({ color: 0xe8e8f0, roughness: 0.6 });
  const dashes = [];
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(dashGeo, dashMat);
    m.rotation.x = -Math.PI / 2;
    m.position.y = 0.02;
    m.userData.z = i * 12;
    scene.add(m);
    dashes.push(m);
  }
  // Traffic cones.
  const coneGeo = new THREE.ConeGeometry(0.35, 0.9, 12);
  const coneMat = new THREE.MeshStandardMaterial({ color: 0xff6a1f, roughness: 0.7 });
  const baseGeo = new THREE.BoxGeometry(0.7, 0.08, 0.7);
  const baseMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.9 });
  const cones = [];
  for (let i = 0; i < 10; i++) {
    const g = new THREE.Group();
    const c = new THREE.Mesh(coneGeo, coneMat);
    c.position.y = 0.45;
    c.castShadow = true;
    const b = new THREE.Mesh(baseGeo, baseMat);
    b.position.y = 0.04;
    g.add(c, b);
    scene.add(g);
    cones.push({ x: range(rng, -4.5, 4.5), z: 30 + i * 15, passed: false, mesh: g });
  }
  return {
    cones,
    update(dist) {
      for (const d of dashes) {
        // worldZ ahead of dist shows far down the road (negative screen z).
        // A dash that falls behind the camera recycles far ahead.
        while (d.userData.z - dist < -15) d.userData.z += DASH_SPAN;
        d.position.z = -(d.userData.z - dist);
      }
      for (const c of cones) {
        if (c.z < dist - 10) {
          c.z += CONE_SPAN;
          c.x = range(rng, -4.5, 4.5);
          c.passed = false;
        }
        c.mesh.position.set(c.x, 0, -(c.z - dist));
      }
    },
  };
}
