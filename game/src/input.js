// Keyboard state. Arrow keys or WASD to drive, Space to brake.
const keys = {};
const MAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  Space: 'brake',
};
export function initInput() {
  addEventListener('keydown', (e) => {
    const k = MAP[e.code];
    if (k) {
      keys[k] = true;
      e.preventDefault();
    }
  });
  addEventListener('keyup', (e) => {
    const k = MAP[e.code];
    if (k) keys[k] = false;
  });
  addEventListener('blur', () => {
    for (const k of Object.keys(keys)) keys[k] = false;
  });
}
export function takeActions() {
  return {
    up: !!keys.up,
    down: !!keys.down,
    left: !!keys.left,
    right: !!keys.right,
    brake: !!keys.brake,
  };
}
