// Neon Bay: Heat Run - boot, fixed-step loop, synchronous shot staging.
// ?shot=cover|chase|speed|vista (with &seed=N) stages that scene and sets window.__shotReady.
import * as THREE from 'three';
import { CFG, STEP } from './config.js';
import { mulberry32 } from './random.js';
import { initInput, takeActions } from './input.js';
import { createRenderer } from './rendering/renderer.js';
import { createPostfx } from './rendering/postfx.js';
import { createSky } from './world/sky.js';
import { createRoad } from './world/road.js';
import { createBuildings } from './world/buildings.js';
import { createPlayerCar } from './vehicles/cars.js';
import { createPolice } from './vehicles/police.js';
import { createHud } from './ui/hud.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 1;

const { renderer, scene, camera } = createRenderer();
const postfx = createPostfx(renderer, scene, camera);
const sky = createSky(scene);
const road = createRoad(scene);
const buildings = createBuildings(scene);
const playerCar = createPlayerCar(scene);
const police = createPolice(scene);
const hud = createHud();

// Checkpoint rings: glowing hoops the player drives through.
const ringGeo = new THREE.TorusGeometry(2.2, 0.18, 10, 28);
const ringMat = new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xffc21f, emissiveIntensity: 2.2 });
const ringMeshes = [];
for (let i = 0; i < 5; i++) {
  const m = new THREE.Mesh(ringGeo, ringMat);
  m.visible = false;
  scene.add(m);
  ringMeshes.push(m);
}

const game = {
  mode: 'title', shot: null, cameraPose: null, endReason: null,
  dist: 0, heat: 0, score: 0, best: 0, time: CFG.time.start,
  player: { x: 0, speed: 0, heading: 0 },
  rings: [],
  shake: 0, elapsed: 0,
  stars() {
    let s = 0;
    for (const t of CFG.heat.stars) if (this.heat >= t) s++;
    return s;
  },
  reset(rng) {
    this.dist = 0; this.heat = 0; this.score = 0; this.time = CFG.time.start;
    this.player.x = 0; this.player.speed = 0; this.player.heading = 0;
    this.rings = [];
    this.cameraPose = null; this.shake = 0; this.mode = 'drive';
    police.clear();
    for (let i = 0; i < 3; i++) this.spawnRingAt((rng() * 2 - 1) * 4, 60 + i * 50);
  },
  spawnRingAt(x, z) { this.rings.push({ x, z }); },
  spawnPoliceAt(x, z) { return police.spawn(x, z, false); },
  spawnRoadblock() {
    police.spawn(-2.6, this.dist + 60, true);
    police.spawn(2.6, this.dist + 60, true);
  },
  endRun(kind) {
    this.mode = 'over';
    this.endReason = kind;
    if (this.score > this.best) this.best = this.score;
    try { localStorage.setItem('neon-bay-heat-run.best', String(this.best)); } catch { /* private mode */ }
    hud.show(kind === 'busted' ? 'busted' : 'timeup', { score: this.score, best: this.best });
  },
  step(dt, input, rng) {
    if (this.mode !== 'drive') return;
    const p = this.player;
    if (input.up) p.speed += CFG.car.accel * dt;
    if (input.down || input.brake) p.speed -= (input.brake ? CFG.car.brake : CFG.car.accel * 0.7) * dt;
    if (!input.up && !input.down) p.speed -= Math.sign(p.speed) * 6 * dt;
    p.speed = Math.max(-CFG.car.maxReverse, Math.min(CFG.car.maxSpeed, p.speed));
    if (Math.abs(p.speed) < 0.05 && !input.up && !input.down) p.speed = 0;
    const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const spdFrac = Math.min(1, Math.abs(p.speed) / 20);
    p.heading += steer * CFG.car.steer * spdFrac * dt * Math.sign(p.speed || 1);
    p.heading = Math.max(-0.5, Math.min(0.5, p.heading));
    p.heading -= p.heading * 2.5 * dt;
    p.x += Math.sin(p.heading) * p.speed * dt;
    p.x = Math.max(-CFG.road.driveHalf, Math.min(CFG.road.driveHalf, p.x));
    this.dist += p.speed * dt;
    this.elapsed += dt;
    if (this.shake > 0) this.shake -= dt;
    this.time -= dt;
    if (this.time <= 0) { this.time = 0; this.endRun('time'); return; }
    const stars = this.stars();
    let nearPolice = false;
    for (const c of police.list) if (Math.abs(c.z - this.dist) < 30) nearPolice = true;
    if (p.speed > 24) this.heat += CFG.heat.riseFast * dt;
    if (nearPolice) this.heat += CFG.heat.riseSeen * dt;
    if (p.speed < 8 && !nearPolice) this.heat -= CFG.heat.decaySlow * dt;
    else this.heat -= CFG.heat.decaySeen * dt;
    this.heat = Math.max(0, Math.min(100, this.heat));
    // Rings: collect or recycle.
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      if (Math.abs(r.z - this.dist) < 2.2 && Math.abs(r.x - p.x) < 2.2) {
        this.score += CFG.score.ring; this.time += CFG.score.ringTime;
        hud.banner('RING +100');
        this.rings.splice(i, 1);
        this.spawnRingAt((rng() * 2 - 1) * 4, this.dist + 140 + rng() * 40);
      } else if (r.z < this.dist - 10) {
        this.rings.splice(i, 1);
        this.spawnRingAt((rng() * 2 - 1) * 4, this.dist + 140 + rng() * 40);
      }
    }
    // Cones: near-miss bonus when one passes close at speed.
    for (const c of road.cones) {
      if (!c.passed && c.z < this.dist) {
        c.passed = true;
        if (Math.abs(c.x - p.x) < 2.2 && p.speed > 15) {
          this.score += CFG.score.nearMiss; this.heat = Math.min(100, this.heat + 8);
          hud.banner('NEAR MISS +25');
        }
      }
    }
    // Police: maintain count, roadblock at 3+ stars, chase, ram, bust.
    const want = stars === 0 ? 0 : stars < 2 ? 1 : stars < 4 ? 2 : 3;
    const chasers = police.list.filter((c) => !c.block);
    const blocks = police.list.filter((c) => c.block);
    if (chasers.length < want) police.spawn((rng() * 2 - 1) * 4, this.dist - 25 - rng() * 15, false);
    if (stars >= 3 && blocks.length === 0) this.spawnRoadblock();
    for (let i = police.list.length - 1; i >= 0; i--) {
      const c = police.list[i];
      if (c.z < this.dist - 60 || (c.block && c.z < this.dist - 15)) police.remove(c);
    }
    for (const c of police.list) {
      if (c.block) continue;
      const dz = c.z - this.dist;
      const ddx = c.x - p.x;
      c.x += Math.max(-1, Math.min(1, ddx)) * 10 * dt;
      if (p.speed < 10) c.speed = 14;
      else if (dz < -15) c.speed = Math.min(CFG.police.baseSpeed + CFG.police.catchUp, p.speed + 6);
      else c.speed = Math.max(0, p.speed - 2);
      c.z += c.speed * dt;
      if (c.z > this.dist - 4) c.z = this.dist - 4;
      if (Math.abs(c.z - this.dist) < CFG.police.ramDist && Math.abs(c.x - p.x) < 1.8) {
        p.x -= Math.sign(c.x - p.x || 1) * 1.2 * dt * 10;
        this.shake = 0.4;
        this.heat = Math.min(100, this.heat + 4 * dt);
      }
      if (Math.abs(c.z - this.dist) < CFG.police.bustDist && Math.abs(c.x - p.x) < 1.6 && p.speed < CFG.police.bustSpeed) {
        this.endRun('busted');
        return;
      }
    }
    for (const c of police.list) {
      if (!c.block) continue;
      if (Math.abs(c.z - this.dist) < 2.2 && Math.abs(c.x - p.x) < 1.9) {
        p.speed *= 0.3;
        this.shake = 0.6;
        this.heat = Math.min(100, this.heat + 12);
        hud.banner('CRASH');
        c.z -= 6;
      }
    }
  },
};

// The shot stager reads game.police.list, so the controller must live on the
// game object itself, not only as a module-level const.
game.police = police;

function hudState() {
  return {
    player: game.player, dist: game.dist, heat: game.heat, stars: game.stars(),
    score: game.score, time: game.time,
    rings: game.rings, police: police.list,
  };
}

function syncVisuals() {
  sky.follow(game.dist);
  road.update(game.dist);
  buildings.update(game.dist);
  playerCar.set(game.player.x, game.player.heading);
  game.rings.forEach((r, i) => {
    const m = ringMeshes[i];
    if (!m) return;
    m.visible = true;
    m.position.set(r.x, 1.7, -(r.z - game.dist));
    m.rotation.z = game.elapsed * 0.5;
  });
  for (let i = game.rings.length; i < ringMeshes.length; i++) ringMeshes[i].visible = false;
  police.update(game.dist, game.elapsed);
}

function updateCamera(dt) {
  if (game.cameraPose) {
    camera.position.set(...game.cameraPose.pos);
    camera.lookAt(...game.cameraPose.look);
    return;
  }
  if (game.mode === 'title') {
    const a = game.elapsed * 0.12;
    camera.position.set(Math.sin(a) * 9, 3.2 + Math.sin(a * 0.7) * 0.6, Math.cos(a) * 9);
    camera.lookAt(0, 1, 0);
    return;
  }
  const p = game.player;
  const tx = p.x * 0.55;
  camera.position.x += (tx - camera.position.x) * Math.min(1, dt * 5);
  camera.position.y = CFG.cam.height;
  camera.position.z = CFG.cam.back;
  if (game.shake > 0) {
    camera.position.x += (Math.random() - 0.5) * game.shake * 0.5;
    camera.position.y += (Math.random() - 0.5) * game.shake * 0.3;
  }
  camera.lookAt(p.x * 0.8, 1.0, -12);
}

// Synchronous shot staging: no requestAnimationFrame, no timers, no await.
// Renders 3 frames on the main thread, flushes the GPU, then signals readiness.
function runShot(name) {
  try {
    stageShot(name, game);
    hud.show('drive', {});
    hud.update(hudState(), 0);
    for (let i = 0; i < 3; i++) {
      updateCamera(STEP);
      syncVisuals();
      postfx.render();
    }
    const gl = renderer.getContext();
    if (gl) gl.finish();
    window.__shotReady = true;
  } catch (err) {
    window.__shotError = String(err && err.stack ? err.stack : err);
    console.error('[shot-fail]', err);
  }
}

function runGame() {
  initInput();
  try { game.best = Number.parseInt(localStorage.getItem('neon-bay-heat-run.best') ?? '0', 10) || 0; } catch { game.best = 0; }
  game.mode = 'title';
  hud.show('title', {});
  camera.position.set(0, CFG.cam.height, CFG.cam.back);
  const liveRng = mulberry32(seed ^ 0x9e3779b9);
  let accumulator = 0;
  let last = performance.now();
  function startGame() {
    game.reset(mulberry32(seed));
    game.mode = 'drive';
    hud.show('drive', {});
    accumulator = 0;
  }
  addEventListener('keydown', (e) => {
    if (e.repeat) return;
    if (game.mode === 'title' && (e.code === 'Space' || e.code === 'Enter')) startGame();
    else if (game.mode === 'drive' && (e.code === 'KeyP' || e.code === 'Escape')) { game.mode = 'pause'; hud.show('pause', { score: game.score, stars: game.stars() }); }
    else if (game.mode === 'pause' && (e.code === 'KeyP' || e.code === 'Escape' || e.code === 'Space' || e.code === 'Enter')) { game.mode = 'drive'; hud.show('drive', {}); }
    else if (game.mode === 'over' && (e.code === 'KeyR' || e.code === 'Space' || e.code === 'Enter')) startGame();
  });
  addEventListener('pointerdown', () => {
    if (game.mode === 'title' || game.mode === 'over') startGame();
    else if (game.mode === 'pause') { game.mode = 'drive'; hud.show('drive', {}); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.mode === 'drive') { game.mode = 'pause'; hud.show('pause', { score: game.score, stars: game.stars() }); }
  });
  function frame(now) {
    requestAnimationFrame(frame);
    const dtms = Math.min((now - last) / 1000, 0.25);
    last = now;
    if (game.mode === 'drive') {
      accumulator += dtms;
      while (accumulator >= STEP) {
        game.step(STEP, takeActions(), liveRng);
        accumulator -= STEP;
        if (game.mode !== 'drive') break;
      }
    } else if (game.mode === 'title') {
      game.elapsed += dtms;
    }
    updateCamera(dtms);
    syncVisuals();
    if (game.mode === 'drive') hud.update(hudState(), dtms);
    postfx.render();
  }
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
