// Spline runtime: load known-good scene, allow drag, block wheel zoom, optional spin.
import { Application } from 'https://unpkg.com/@splinetool/runtime@latest/build/runtime.js';

// Known-good public scene URL (runtime JSON) — can be overridden with ?scene=...
const DEFAULT_SCENE = 'https://prod.spline.design/zOBPkx6itcuWM1m7/scene.splinecode';
const params = new URLSearchParams(location.search);
const SCENE_URL = params.get('scene') || DEFAULT_SCENE;

// Spin settings
const rpm = parseFloat(params.get('rpm') || '33.33');
const shouldSpin = params.get('spin') !== 'false';
const nameHint = params.get('name');

const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);

(async () => {
  // Visual cue while loading
  const status = document.createElement('div');
  status.id = 'status';
  status.textContent = 'Loading Spline…';
  status.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;color:#fff;font:16px/1.4 system-ui;pointer-events:none';
  document.body.appendChild(status);

  await app.load(SCENE_URL);
  status.remove();

  // Keep drag working; just block wheel zoom so camera stays put
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  canvas.addEventListener('wheel', stop, { passive: false });

  // Find likely record mesh
  let target = null;
  const candidates = (nameHint ? [nameHint] : ['Record','record','Vinyl','vinyl','Disc','disc','Platter','platter']);
  if (typeof app.findObjectByName === 'function') {
    for (const n of candidates) { try { const o = app.findObjectByName(n); if (o) { target = o; break; } } catch {} }
  }
  if (!target && Array.isArray(app.children)) {
    target = app.children.find(o => /record|vinyl|disc|platter/i.test(o?.name || '')) || null;
  }

  if (shouldSpin && target && target.rotation) {
    const omega = (rpm * Math.PI * 2) / 60;
    let last = performance.now();
    function loop(t){ const dt = Math.max(0,(t-last)/1000); last=t; target.rotation.y += omega*dt; requestAnimationFrame(loop);}
    requestAnimationFrame(loop);
  }

  // Canvas DPR handling
  const resize = () => { const dpr = Math.min(window.devicePixelRatio||1,2); canvas.width=Math.floor(canvas.clientWidth*dpr); canvas.height=Math.floor(canvas.clientHeight*dpr); };
  new ResizeObserver(resize).observe(canvas);
  resize();
})().catch(err => {
  console.error('Failed to load Spline scene:', err);
  const msg=document.createElement('div');
  msg.innerHTML='Oops — failed to load the Spline scene.<br/><small>Try adding ?scene=https://prod.spline.design/.../scene.splinecode</small>';
  msg.style.cssText='position:fixed;inset:0;display:grid;place-items:center;color:#fff;text-align:center;font:16px/1.4 system-ui;padding:24px';
  document.body.appendChild(msg);
});
