// Shared 3D scene engine — builds an interactive seating bowl from a venue
// data module. Venue modules live in ./venues/*.js and export `build(THREE, helpers)`.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const HOVER = new THREE.Color('#ffe14d');
export const PIN   = new THREE.Color('#22d3ee');

/* superellipse ring radius at angle θ for "square size" S */
export function makeRingR(P) {
  return (theta, S) => {
    const c = Math.abs(Math.cos(theta)), s = Math.abs(Math.sin(theta));
    return S / Math.pow(Math.pow(c, P) + Math.pow(s, P), 1 / P);
  };
}

/* lofted ring strip from a list of {S, y} rings */
export function ringStripGeo(ringR, rings, segs = 200, th0 = 0, th1 = Math.PI * 2) {
  const pos = [], idx = [];
  const span = th1 - th0;
  rings.forEach((r, k) => {
    for (let i = 0; i <= segs; i++) {
      const t = th0 + (i / segs) * span, rad = ringR(t, r.S);
      pos.push(rad * Math.cos(t), r.y, rad * Math.sin(t));
    }
  });
  for (let k = 0; k < rings.length - 1; k++)
    for (let i = 0; i < segs; i++) {
      const a = k * (segs + 1) + i, b = a + segs + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.setClearColor(0x05070c);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x05070c, 220, 460);

  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 800);
  camera.position.set(76, 58, 76);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 12;
  controls.maxDistance = 300;
  controls.autoRotateSpeed = 0.7;
  controls.target.set(0, 4, 0);

  scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x1a1410, 1.0));
  const sun = new THREE.DirectionalLight(0xffffff, 1.35);
  sun.position.set(60, 95, 35);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x88aaff, 0.35);
  fill.position.set(-50, 40, -60);
  scene.add(fill);

  const clock = new THREE.Clock();
  let fly = null;

  function flyTo(target, camPos) {
    fly = { t: 0, fromT: controls.target.clone(), toT: target, fromC: camera.position.clone(), toC: camPos };
  }

  function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    if (fly) {
      fly.t = Math.min(1, fly.t + dt / 1.1);
      const k = fly.t < 0.5 ? 2 * fly.t * fly.t : 1 - Math.pow(-2 * fly.t + 2, 2) / 2;
      controls.target.lerpVectors(fly.fromT, fly.toT, k);
      camera.position.lerpVectors(fly.fromC, fly.toC, k);
      if (fly.t >= 1) fly = null;
    }
    controls.update();
    renderer.render(scene, camera);
  }

  function onResize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }
  addEventListener('resize', onResize);

  return { THREE, renderer, scene, camera, controls, animate, flyTo, isFlying: () => !!fly };
}
