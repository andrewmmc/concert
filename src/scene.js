// Shared 3D scene engine — builds an interactive seating bowl from a venue
// data module. Venue modules live in ./venues/*.js and export `build(ctx, opts)`,
// adding their geometry to `ctx.scene` (a THREE.Group) and returning the model
// references the app needs for picking, search and the display toggles.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const HOVER = new THREE.Color('#ffe14d');
export const PIN   = new THREE.Color('#22d3ee');

const SEATED_EYE_HEIGHT = 1.28;
const SEATED_FORWARD_OFFSET = 0.14;

export function getSeatView(placement, stage) {
  if (!placement || ![placement.x, placement.y, placement.z].every(Number.isFinite) || !stage?.isObject3D) {
    throw new TypeError('A seat placement and stage Object3D are required.');
  }

  const stageBounds = new THREE.Box3().setFromObject(stage);
  if (stageBounds.isEmpty()) {
    throw new TypeError('The stage Object3D must contain geometry.');
  }
  const target = stageBounds.getCenter(new THREE.Vector3());
  target.y = stageBounds.max.y;

  const cameraPosition = new THREE.Vector3(
    placement.x,
    placement.y + SEATED_EYE_HEIGHT,
    placement.z,
  );
  const towardStage = target.clone().sub(cameraPosition);
  towardStage.y = 0;
  if (towardStage.lengthSq() > 0) {
    cameraPosition.addScaledVector(towardStage.normalize(), SEATED_FORWARD_OFFSET);
  }

  return { target, cameraPosition };
}

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
  controls.minDistance = 1.5;
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

// Instanced seat mesh from placement data. Each placement supplies
// { x, y, z, yaw, sec, row, seat, color, widthScale?, alt? }; returns the mesh,
// its per-instance base colours, and the `sec-row-seat` → instance map used by
// the seat search. `boxes` lists the merged seat-shape boxes, `shade` the
// venue's per-placement colour multiplier, `altShade` the row-alternation step.
export function createSeatInstances(placements, { boxes, shade = () => 1, altShade = 0.035, roughness = 0.76, metalness = 0.04 } = {}) {
  const geoms = boxes.map((b) => {
    const g = new THREE.BoxGeometry(b.size[0], b.size[1], b.size[2]);
    if (b.pos) g.translate(b.pos[0], b.pos[1], b.pos[2]);
    return g;
  });
  const seats = new THREE.InstancedMesh(
    mergeGeometries(geoms),
    new THREE.MeshStandardMaterial({ roughness, metalness }),
    placements.length,
  );
  const baseColors = new Float32Array(placements.length * 3);
  const seatIndex = new Map();
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
  const V = new THREE.Vector3(), scale = new THREE.Vector3();
  placements.forEach((p, i) => {
    E.set(0, p.yaw, 0); Q.setFromEuler(E); V.set(p.x, p.y, p.z);
    scale.set(p.widthScale ?? 1, 1, 1);
    M.compose(V, Q, scale); seats.setMatrixAt(i, M);
    const c = new THREE.Color(p.color);
    const alt = p.alt ?? (typeof p.row === 'number' ? p.row % 2 : 0);
    c.multiplyScalar(shade(p) + alt * altShade);
    seats.setColorAt(i, c);
    baseColors.set([c.r, c.g, c.b], i * 3);
    seatIndex.set(`${p.sec}-${p.row}-${p.seat}`, i);
  });
  seats.instanceMatrix.needsUpdate = true;
  if (seats.instanceColor) seats.instanceColor.needsUpdate = true;
  return { seats, baseColors, seatIndex };
}

// Flat dark ground disc under the model.
export function addGround(scene, radius, color = 0x070b11, y = -0.04) {
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 64),
    new THREE.MeshStandardMaterial({ color, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = y;
  scene.add(ground);
}

// Rectangle outline on the floor, e.g. arena floor or seating-block bounds.
export function addOutline(scene, x, z, w, d, color = 0x58309b, y = 0.04) {
  const points = [
    new THREE.Vector3(x - w / 2, y, z - d / 2),
    new THREE.Vector3(x + w / 2, y, z - d / 2),
    new THREE.Vector3(x + w / 2, y, z + d / 2),
    new THREE.Vector3(x - w / 2, y, z + d / 2),
  ];
  scene.add(new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({ color }),
  ));
}

// Canvas texture for in-scene labels; opts tune the fonts and baselines.
export function labelTexture(text, sub, color, { font = '900 86px system-ui', subFont = '600 32px system-ui', subColor = '#d7deee', textY = 112, subY = 174 } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 256;
  const context = canvas.getContext('2d');
  context.textAlign = 'center';
  context.fillStyle = color;
  context.font = font;
  context.fillText(text, 256, textY);
  context.fillStyle = subColor;
  context.font = subFont;
  context.fillText(sub, 256, subY);
  return new THREE.CanvasTexture(canvas);
}
