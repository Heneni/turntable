// Spline runtime with drag enabled and optional spin; default scene set to KNOWN-GOOD prod URL.
import { Application } from 'https://unpkg.com/@splinetool/runtime@latest/build/runtime.js';

// Revert to the previously working prod scene.
const DEFAULT_SCENE = 'https://prod.spline.design/zOBPkx6itcuWM1m7/scene.splinecode';

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
  // Keep drag/touch working; block wheel zoom only.
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
})().catch(err => { console.error('Failed to load Spline scene:', err); const msg=document.createElement('div'); msg.innerHTML='Oops — failed to load the Spline scene.<br/><small>Tip: use a <code>prod.spline.design/.../scene.splinecode</code> URL via <code>?scene=</code></small>'; msg.style.cssText='position:fixed;inset:0;display:grid;place-items:center;color:#fff;text-align:center;font:16px/1.4 system-ui;padding:24px'; document.body.appendChild(msg); });
