// Post-processing: bloom for the neon. Addons come from the vendored
// three-post.min.js bundle (esbuild, genuinely minified), never from a CDN.
import * as THREE from 'three';
import { EffectComposer, RenderPass, UnrealBloomPass, OutputPass } from '../../vendor/three-post.min.js';

export function createPostfx(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.85, 0.55, 0.78);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  return {
    render() {
      composer.render();
    },
  };
}
