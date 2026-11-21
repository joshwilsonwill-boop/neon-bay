// HUD: score, wanted stars, timer, speed, minimap, banners and the menus.
// All DOM lives in index.html; this module only writes into it.
const STAR_ON = '\u2605';
const STAR_OFF = '\u2606';

export function createHud() {
  const el = (id) => document.getElementById(id);
  const speedEl = el('hud-speed');
  const heatEl = el('hud-heat');
  const scoreEl = el('hud-score');
  const timeEl = el('hud-time');
  const bannerEl = el('banner');
  const menuEl = el('menu');
  const menuTitle = el('menu-title');
  const menuBody = el('menu-body');
  const menuHint = el('menu-hint');
  const map = el('minimap');
  const mctx = map.getContext('2d');
  let bannerTimer = 0;

  function stars(n) {
    let s = '';
    for (let i = 0; i < 5; i++) s += i < n ? STAR_ON : STAR_OFF;
    return s;
  }
  return {
    show(screen, data) {
      if (screen === 'drive') {
        menuEl.classList.add('hidden');
        return;
      }
      menuEl.classList.remove('hidden');
      if (screen === 'title') {
        menuTitle.textContent = 'NEON BAY: HEAT RUN';
        menuBody.textContent = 'Drive the pink car down Ocean Drive at dusk. Outrun the police. Thread the glowing rings. Beat the clock.';
        menuHint.textContent = 'WASD or arrows to drive - Space to brake - P to pause';
      } else if (screen === 'pause') {
        menuTitle.textContent = 'PAUSED';
        menuBody.textContent = `Score ${data.score} - ${data.stars} star${data.stars === 1 ? '' : 's'} of heat.`;
        menuHint.textContent = 'P or Space to keep driving';
      } else if (screen === 'busted') {
        menuTitle.textContent = 'BUSTED';
        menuBody.textContent = `The police caught you. Score ${data.score}. Best ${data.best}.`;
        menuHint.textContent = 'R or Space to run it back';
      } else if (screen === 'timeup') {
        menuTitle.textContent = 'TIME UP';
        menuBody.textContent = `The clock beat you. Score ${data.score}. Best ${data.best}.`;
        menuHint.textContent = 'R or Space to run it back';
      }
    },
    banner(text) {
      bannerEl.textContent = text;
      bannerEl.classList.remove('hidden');
      clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => bannerEl.classList.add('hidden'), 1200);
    },
    update(state, dt) {
      speedEl.textContent = `${Math.round(Math.abs(state.player.speed) * 3.6)} km/h`;
      heatEl.textContent = stars(state.stars);
      scoreEl.textContent = String(Math.floor(state.score));
      timeEl.textContent = `${Math.max(0, Math.ceil(state.time))}s`;
      // Minimap: road strip, rings, police, player.
      const W = map.width;
      const H = map.height;
      mctx.fillStyle = 'rgba(10, 8, 24, 0.85)';
      mctx.fillRect(0, 0, W, H);
      mctx.fillStyle = '#3a3a48';
      mctx.fillRect(W / 2 - 9, 0, 18, H);
      mctx.fillStyle = '#e8e8f0';
      for (let y = 0; y < H; y += 16) mctx.fillRect(W / 2 - 1, y, 2, 8);
      const zToY = (z) => H - ((z - state.dist + 10) / 90) * H;
      const xToX = (x) => W / 2 + (x / 7) * (W / 2 - 4);
      mctx.fillStyle = '#ffd23a';
      for (const r of state.rings) {
        const y = zToY(r.z);
        if (y >= 0 && y <= H) {
          mctx.beginPath();
          mctx.arc(xToX(r.x), y, 3, 0, Math.PI * 2);
          mctx.fill();
        }
      }
      for (const c of state.police) {
        const y = zToY(c.z);
        if (y < 0 || y > H) continue;
        mctx.fillStyle = c.block ? '#ff4444' : '#ff2222';
        mctx.fillRect(xToX(c.x) - 3, y - 3, 6, 6);
      }
      mctx.fillStyle = '#ff4d8d';
      mctx.beginPath();
      mctx.arc(xToX(state.player.x), H - 18, 4, 0, Math.PI * 2);
      mctx.fill();
    },
  };
}
