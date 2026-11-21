// WebGL renderer: ACES tone mapping, dusk fog, soft shadows, dusk sky colour.
import * as THREE from 'three';

export function createRenderer() {
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game'), antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x2a1a3a, 0.011);
  scene.background = new THREE.Color(0x1a0f24);
  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 900);
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  // Low dusk sun from the west (over the ocean) plus a soft ambient lift.
  const sun = new THREE.DirectionalLight(0xff9a4d, 1.7);
  sun.position.set(-60, 28, 40);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -30;
  sun.shadow.camera.right = 30;
  sun.shadow.camera.top = 40;
  sun.shadow.camera.bottom = -60;
  sun.shadow.camera.far = 200;
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0x8a5a9a, 0x1a2436, 1.3));
  return { renderer, scene, camera };
}
