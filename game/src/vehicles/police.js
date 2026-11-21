// Police cruisers: dark bodies with a flashing red/blue light bar. Chasers
// hunt from behind; roadblock cruisers sit still across the road. The game
// owns the chase logic; this module owns the meshes and the flashing.
import * as THREE from 'three';

export function createPolice(scene) {
  const list = [];
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x14142a, roughness: 0.4, metalness: 0.6 });
  const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1e2a44, roughness: 0.5, metalness: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x0c0c12, roughness: 0.9 });
  const bodyGeo = new THREE.BoxGeometry(1.9, 0.6, 4.4);
  const cabinGeo = new THREE.BoxGeometry(1.6, 0.5, 2.1);
  const wheelGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.28, 14);
  const barGeo = new THREE.BoxGeometry(0.55, 0.18, 0.3);

  function spawn(x, z, block) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.58;
    body.castShadow = true;
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.08, 0.2);
    g.add(body, cabin);
    for (const [wx, wz] of [[-0.85, 1.4], [0.85, 1.4], [-0.85, -1.4], [0.85, -1.4]]) {
      const w = new THREE.Mesh(wheelGeo, dark);
      w.rotation.z = Math.PI / 2;
      w.position.set(wx, 0.34, wz);
      g.add(w);
    }
    const redMat = new THREE.MeshStandardMaterial({ color: 0x220000, emissive: 0xff2222, emissiveIntensity: 3 });
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x000022, emissive: 0x2266ff, emissiveIntensity: 3 });
    const red = new THREE.Mesh(barGeo, redMat);
    red.position.set(-0.35, 1.42, 0.2);
    const blue = new THREE.Mesh(barGeo, blueMat);
    blue.position.set(0.35, 1.42, 0.2);
    g.add(red, blue);
    scene.add(g);
    const c = { x, z, speed: 0, block, mesh: g, redMat, blueMat };
    list.push(c);
    return c;
  }
  return {
    list,
    spawn,
    clear() {
      for (const c of list) scene.remove(c.mesh);
      list.length = 0;
    },
    remove(c) {
      scene.remove(c.mesh);
      const i = list.indexOf(c);
      if (i >= 0) list.splice(i, 1);
    },
    update(dist, elapsed) {
      const phase = Math.sin(elapsed * 7) > 0;
      for (const c of list) {
        c.mesh.position.set(c.x, 0, -(c.z - dist));
        // Chasers face the player (forward, -z); roadblock cruisers face the
        // player head-on, so they are turned around.
        c.mesh.rotation.y = c.block ? Math.PI : 0;
        c.redMat.emissiveIntensity = phase ? 3.5 : 0.25;
        c.blueMat.emissiveIntensity = phase ? 0.25 : 3.5;
      }
    },
  };
}
