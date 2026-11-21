// The player's car: hot pink body, cream roof, magenta underglow, headlights.
import * as THREE from 'three';

export function createPlayerCar(scene) {
  const g = new THREE.Group();
  const pink = new THREE.MeshStandardMaterial({ color: 0xff4d8d, roughness: 0.35, metalness: 0.6, emissive: 0x881133, emissiveIntensity: 0.45 });
  const cream = new THREE.MeshStandardMaterial({ color: 0xfff2d9, roughness: 0.5, metalness: 0.2 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x14141a, roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.55, 4.2), pink);
  body.position.y = 0.55;
  body.castShadow = true;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.0), cream);
  cabin.position.set(0, 1.05, 0.2);
  cabin.castShadow = true;
  g.add(body, cabin);
  // Wheels.
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.28, 14);
  for (const [x, z] of [[-0.85, 1.35], [0.85, 1.35], [-0.85, -1.35], [0.85, -1.35]]) {
    const w = new THREE.Mesh(wheelGeo, dark);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.34, z);
    g.add(w);
  }
  // Headlights.
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xfff6d8, emissiveIntensity: 3 });
  for (const x of [-0.6, 0.6]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.16, 0.1), lampMat);
    lamp.position.set(x, 0.62, -2.12);
    g.add(lamp);
  }
  // Magenta underglow: a glowing plane plus a small point light.
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 4.4),
    new THREE.MeshBasicMaterial({ color: 0xff2d78, transparent: true, opacity: 0.22 }),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.y = 0.06;
  g.add(glow);
  const under = new THREE.PointLight(0xff2d78, 5, 7, 2);
  under.position.y = 0.4;
  g.add(under);
  // One forward headlight beam.
  const beam = new THREE.SpotLight(0xfff2cc, 30, 34, 0.55, 0.5, 1.2);
  beam.position.set(0, 0.8, -2);
  beam.target.position.set(0, 0, -20);
  g.add(beam, beam.target);
  scene.add(g);
  return {
    set(x, heading) {
      g.position.x = x;
      g.rotation.y = -heading;
    },
  };
}
