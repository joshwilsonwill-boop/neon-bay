// Dusk sky: a gradient dome (deep violet up top, magenta band, orange glow
// at the horizon over the ocean) with a low sun disc. Follows the player.
import * as THREE from 'three';

const TOP = new THREE.Color(0x160a2e);
const MID = new THREE.Color(0x7a2d5e);
const LOW = new THREE.Color(0xff7a3d);

export function createSky(scene) {
  const geo = new THREE.SphereGeometry(380, 24, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: { top: { value: TOP }, mid: { value: MID }, low: { value: LOW } },
    vertexShader: 'varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 low; void main() { float h = normalize(vP).y; vec3 c = h > 0.25 ? mix(mid, top, smoothstep(0.25, 0.8, h)) : mix(low, mid, smoothstep(-0.05, 0.25, h)); gl_FragColor = vec4(c, 1.0); }',
  });
  const dome = new THREE.Mesh(geo, mat);
  scene.add(dome);
  // Sun disc low over the ocean (west), with a soft halo.
  const sunMat = new THREE.MeshBasicMaterial({ color: 0xffb347, fog: false });
  const sun = new THREE.Mesh(new THREE.CircleGeometry(16, 32), sunMat);
  sun.position.set(-190, 24, -300);
  sun.lookAt(0, 24, 0);
  scene.add(sun);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xff7a3d, transparent: true, opacity: 0.25, fog: false });
  const halo = new THREE.Mesh(new THREE.CircleGeometry(34, 32), haloMat);
  halo.position.set(-192, 24, -302);
  halo.lookAt(0, 24, 0);
  scene.add(halo);
  return {
    follow(dist) {
      dome.position.z = -dist;
      sun.position.z = -300 - dist;
      halo.position.z = -302 - dist;
    },
  };
}
