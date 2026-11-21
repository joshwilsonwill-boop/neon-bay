// Neon Bay: Heat Run - tuning constants. One place for every number the
// rules, the car, the police and the camera use.
export const CFG = {
  time: { start: 60 },
  road: { half: 7, driveHalf: 5.2 },
  car: { accel: 26, brake: 42, maxSpeed: 38, maxReverse: 8, steer: 1.9 },
  heat: { stars: [15, 32, 52, 72, 88], riseFast: 9, riseSeen: 7, decaySlow: 7, decaySeen: 2 },
  police: { baseSpeed: 26, catchUp: 10, ramDist: 3.2, bustDist: 2.4, bustSpeed: 6 },
  score: { ring: 100, ringTime: 5, nearMiss: 25 },
  cam: { height: 3.4, back: 9.5 },
};
export const STEP = 1 / 60;
