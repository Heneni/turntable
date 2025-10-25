// Minimal Spline runtime bootstrap with camera interaction disabled.
import { Application } from 'https://unpkg.com/@splinetool/runtime/build/runtime.js';

const SCENE_URL = 'https://prod.spline.design/zOBPkx6itcuWM1m7/scene.splinecode';
const canvas = document.getElementById('canvas3d');
const app = new Application(canvas);

(async () => {
  await app.load(SCENE_URL);

  // Lock the camera so the turntable remains stationary.
  // Technique: swallow user input events that would drive orbit/zoom/pan.
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };
  const blockEvents = ['pointerdown','pointermove','pointerup','wheel','touchstart','touchmove','touchend','keydown'];
  blockEvents.forEach(type => {
    canvas.addEventListener(type, stop, { passive: false });
    window.addEventListener(type, stop, { passive: false });
  });

  // Ensure pixel-perfect rendering across DPR changes.
  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(canvas.clientWidth * dpr);
    canvas.height = Math.floor(canvas.clientHeight * dpr);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
})().catch(err => {
  console.error('Failed to load Spline scene:', err);
  const msg = document.createElement('div');
  msg.textContent = 'Oops — failed to load the Spline scene.';
  msg.style.cssText = 'position:fixed;inset:0;display:grid;place-items:center;color:#fff;font:16px/1.4 system-ui';
  document.body.appendChild(msg);
});
