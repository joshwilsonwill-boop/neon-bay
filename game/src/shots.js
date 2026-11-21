// The four screenshot scenes behind ?shot=cover|chase|speed|vista. Each one
// plays the real rules forward from a seeded state for 60 steps, steered by
// a simple autopilot (hold speed, steer toward the nearest ring, dodge a
// roadblock cruiser ahead), so the frame is what a short game really looks
// like and the same seed always gives the same frame.
import { mulberry32 } from './random.js';
import { STEP } from './config.js';

const STEPS = { cover: 60, chase: 60, speed: 60, vista: 60 };
const POSES = {
  cover: { pos: [4.5, 2.2, 7.5], look: [0, 1.2, -14] },
  chase: { pos: [0, 4.2, 13], look: [0, 1.0, -30] },
  speed: { pos: [-3.5, 1.4, 6.5], look: [0.5, 1.0, -20] },
  vista: { pos: [-18, 11, 18], look: [5, 1.5, -35] },
};

// Steer toward the nearest ring ahead; if a roadblock cruiser sits ahead in
// our lane, steer around it. Reads game.police.list: the game object must
// carry the police controller (see main.js, game.police = police).
function autopilot(game, input) {
  const p = game.player;
  let ring = null;
  for (const r of game.rings) {
    if (r.z > game.dist && (!ring || r.z < ring.z)) ring = r;
  }
  let target = ring ? ring.x : 0;
  for (const c of game.police.list) {
    if (!c.block) continue;
    if (c.z > game.dist && c.z - game.dist < 40 && Math.abs(c.x - p.x) < 2.4) {
      target = c.x > 0 ? -3.2 : 3.2;
    }
  }
  input.up = true;
  input.left = target < p.x - 0.3;
  input.right = target > p.x + 0.3;
  input.down = false;
  input.brake = false;
}

export function stageShot(name, game) {
  const rng = mulberry32(1);
  game.reset(rng);
  game.mode = 'drive';
  const input = { up: true, down: false, left: false, right: false, brake: false };
  for (let i = 0; i < (STEPS[name] || 60); i += 1) {
    autopilot(game, input);
    game.step(STEP, input, rng);
    if (game.mode !== 'drive') game.mode = 'drive';
  }
  if (name === 'chase') {
    game.heat = 76;
    game.police.clear();
    // Chasers close behind the player (screen z +5/+9, inside the frame).
    game.spawnPoliceAt(-2.2, game.dist - 5, false);
    game.spawnPoliceAt(2.0, game.dist - 9, false);
    // Roadblock close enough to read (35 ahead, not 60).
    game.police.spawn(-2.6, game.dist + 35, true);
    game.police.spawn(2.6, game.dist + 35, true);
  }
  if (name === 'speed') {
    game.player.speed = 36;
    game.heat = 45;
  }
  game.cameraPose = POSES[name] || POSES.cover;
}
