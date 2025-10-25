// Spline runtime with camera locked and a spinning record.
import { Application } from 'https://unpkg.com/@splinetool/runtime/build/runtime.js';

// Default scene (can be overridden via ?scene=... pointing to a .splinecode URL)
const DEFAULT_SCENE = 'https://prod.spline.design/zOBPkx6itcuWM1m7/scene.splinecode';
const params = new URLSearchParams(location.search);
const SCENE_URL = params.get('scene') || DEFAULT_SCENE;

// Spin config via query params: ?rpm=33.33&name=Record
const rpm = parseFloat(params.get('rpm') || '33.33');
const preferredName = params.get('name');

const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);

(async () => {
  await app.load(SCENE_URL);

  // Lock camera / user input
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  ['pointerdown','pointermove','pointerup','wheel','touchstart','touchmove','touchend','keydown'].forEach(type => {
    canvas.addEventListener(type, stop, { passive: false });
    window.addEventListener(type, stop, { passive: false });
  });

  // Try to find a plausible "record" mesh to spin
  const candidateNames = preferredName ? [preferredName] : ['Record','record','Vinyl','vinyl','Disc','disc','Platter','platter'];
  let target = null;
  if (typeof app.findObjectByName === 'function') {
    for (const n of candidateNames) {
      try {
        const obj = app.findObjectByName(n);
        if (obj) { target = obj; break; }
      } catch (_) {}
    }
  }

  // If no named match, fall back to first mesh found under the scene graph that looks circular by name heuristics
  if (!target && Array.isArray(app.children)) {
    target = app.children.find(o => /record|vinyl|disc|platter/i.test(o?.name || '')) || null;
  }

  // Animation loop for rotation (Y-axis), honoring device DPR for crispness
  const omega = (rpm * Math.PI * 2) / 60; // radians per second
  let last = performance.now();
  function loop(t) {
    const dt = Math.max(0, (t - last) / 1000);
    last = t;
    if (target && target.rotation) {
      target.rotation.y += omega * dt;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Pixel-perfect rendering across DPR and resizes
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
})().catch(err => {
  console.error('Failed to load Spline scene:', err);
  const msg = document.createElement('div');
  msg.textContent = 'Oops — failed to load the Spline scene.';
  msg.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;color:#fff;font:16px/1.4 system-ui';
  document.body.appendChild(msg);
});
