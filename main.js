// Spline runtime with optional spin and drag-friendly input (keeps scroll-zoom off).
import { Application } from 'https://unpkg.com/@splinetool/runtime/build/runtime.js';

// Default scene remains the original; you can override with ?scene=<full .splinecode URL>
const DEFAULT_SCENE = 'https://prod.spline.design/zOBPkx6itcuWM1m7/scene.splinecode';
const params = new URLSearchParams(location.search);
const SCENE_URL = params.get('scene') || DEFAULT_SCENE;

// Spin tuning via query params (rpm, name). Example: ?rpm=33.33&name=Record
const rpm = parseFloat(params.get('rpm') || '33.33');
const preferredName = params.get('name');
const shouldSpin = params.get('spin') !== 'false'; // allow ?spin=false to disable

const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);

(async () => {
  await app.load(SCENE_URL);

  // Allow pointer/touch input so you can drag/place items in the scene.
  // We only disable scroll-zoom to avoid accidental camera changes.
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  canvas.addEventListener('wheel', stop, { passive: false });

  // Locate a plausible record object to spin. You can pass &name=ExactName to force it.
  let target = null;
  const candidates = preferredName ? [preferredName] : ['Record','record','Vinyl','vinyl','Disc','disc','Platter','platter'];
  if (typeof app.findObjectByName === 'function') {
    for (const n of candidates) {
      try { const obj = app.findObjectByName(n); if (obj) { target = obj; break; } } catch {}
    }
  }
  if (!target && Array.isArray(app.children)) {
    target = app.children.find(o => /record|vinyl|disc|platter/i.test(o?.name || '')) || null;
  }

  // Spin animation on Y axis (turntable-style), if a target is found and spin is enabled.
  if (shouldSpin && target && target.rotation) {
    const omega = (rpm * Math.PI * 2) / 60; // rad/s
    let last = performance.now();
    function loop(t) {
      const dt = Math.max(0, (t - last) / 1000);
      last = t;
      target.rotation.y += omega * dt;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // Keep the canvas crisp on resizes and DPR changes.
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
