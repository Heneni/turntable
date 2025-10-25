// Spline runtime with drag enabled and optional spin; default scene set to updated platter.
import { Application } from 'https://unpkg.com/@splinetool/runtime/build/runtime.js';
const DEFAULT_SCENE = 'https://prod.spline.design/88b4bfa4-bcfb-40fc-9056-1748fe134cea/scene.splinecode';
const params = new URLSearchParams(location.search);
const SCENE_URL = params.get('scene') || DEFAULT_SCENE;
const rpm = parseFloat(params.get('rpm') || '33.33');
const preferredName = params.get('name');
const shouldSpin = params.get('spin') !== 'false';
const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);
(async () => {
  await app.load(SCENE_URL);
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  canvas.addEventListener('wheel', stop, { passive: false });
  let target = null;
  const candidates = preferredName ? [preferredName] : ['Record','record','Vinyl','vinyl','Disc','disc','Platter','platter'];
  if (typeof app.findObjectByName === 'function') {
    for (const n of candidates) { try { const obj = app.findObjectByName(n); if (obj) { target = obj; break; } } catch {} }
  }
  if (!target && Array.isArray(app.children)) { target = app.children.find(o => /record|vinyl|disc|platter/i.test(o?.name || '')) || null; }
  if (shouldSpin && target && target.rotation) {
    const omega = (rpm * Math.PI * 2) / 60;
    let last = performance.now();
    function loop(t){ const dt = Math.max(0,(t-last)/1000); last=t; target.rotation.y += omega*dt; requestAnimationFrame(loop);} requestAnimationFrame(loop);
  }
  const resize = () => { const dpr = Math.min(window.devicePixelRatio||1,2); canvas.width=Math.floor(canvas.clientWidth*dpr); canvas.height=Math.floor(canvas.clientHeight*dpr); };
  new ResizeObserver(resize).observe(canvas); resize();
})().catch(err => { console.error('Failed to load Spline scene:', err); const msg=document.createElement('div'); msg.textContent='Oops — failed to load the Spline scene.'; msg.style.cssText='position:fixed;inset:0;display:grid;place-items:center;color:#fff;font:16px/1.4 system-ui'; document.body.appendChild(msg); });
