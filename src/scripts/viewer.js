import { createScene, getSeatSurroundingsView, getSeatView, HOVER, PIN } from '../scene.js';
import {
  describeSeat,
  describeStage,
  describeWheelchair,
  translate,
} from '../lib/i18n.js';
import { getVenue, resolveLayout, venues } from '../venues/index.js';
import { getActiveLocale, initializeLocale } from './locale.js';

function disposeGroup(group) {
  group.traverse((object) => {
    if (object.isInstancedMesh) object.dispose();
    object.geometry?.dispose();
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        material.map?.dispose();
        material.dispose();
      }
    }
  });
  group.clear();
}

function goToViewer(venueId, layoutId) {
  location.assign(`/viewer/${venueId}/${layoutId}/`);
}

export function shouldDestroyViewer(event) {
  return !event?.persisted;
}

export function initializeViewer() {
  initializeLocale();
  const root = document.querySelector('[data-viewer]');
  if (!root || root.dataset.initialized) return;
  root.dataset.initialized = 'true';

  const venue = getVenue(root.dataset.venueId);
  const layout = resolveLayout(venue, root.dataset.layoutId);
  const canvas = root.querySelector('#scene');
  const tooltip = document.querySelector('#tooltip');
  const tooltipMain = tooltip.querySelector('b');
  const tooltipSub = tooltip.querySelector('.dim');
  const seatCard = root.querySelector('[data-seat-card]');
  const seatActions = root.querySelector('[data-seat-actions]');
  const seatMain = root.querySelector('[data-seat-main]');
  const seatSub = root.querySelector('[data-seat-sub]');
  const searchMessage = root.querySelector('[data-search-message]');
  const searchInputs = [...root.querySelectorAll('[data-search]')];
  const stageButton = root.querySelector('[data-action="stage-view"]');
  const surroundingsButton = root.querySelector('[data-action="surroundings-view"]');
  const roofInput = root.querySelector('[data-setting="roof"]');
  const labelsInput = root.querySelector('[data-setting="labels"]');
  const autoRotateInput = root.querySelector('[data-setting="auto-rotate"]');
  const viewerPanel = root.querySelector('#viewer-controls');
  const panelButton = root.querySelector('[data-action="panel"]');
  const panelSymbol = root.querySelector('[data-panel-symbol]');

  const engine = createScene(canvas);
  const { camera, controls, flyTo, scene, THREE } = engine;
  const modelGroup = new THREE.Group();
  scene.add(modelGroup);

  let placements;
  let seats;
  let baseColors;
  let seatIndex;
  let wheelchairMeshes;
  let stage;
  let roofGroup;
  let labelGroup;
  let describe;
  let hoveredId = -1;
  let pinnedId = -1;
  let seatViewMode = null;
  let pointerX = 0;
  let pointerY = 0;
  let mouseDirty = false;
  let picking = true;
  let pickingFrame = 0;

  function t(key) {
    return translate(getActiveLocale(), key);
  }

  function setSeatColor(index, color) {
    if (index < 0) return;
    seats.setColorAt(index, color);
    seats.instanceColor.needsUpdate = true;
  }

  function baseColor(index) {
    return new THREE.Color(
      baseColors[index * 3],
      baseColors[index * 3 + 1],
      baseColors[index * 3 + 2],
    );
  }

  function restoreSeat(index) {
    if (index < 0 || index === pinnedId) return;
    setSeatColor(index, baseColor(index));
  }

  function hideTooltip() {
    tooltip.hidden = true;
    canvas.classList.remove('hovering');
  }

  function showTooltip(main, sub = '') {
    tooltipMain.textContent = main;
    tooltipSub.textContent = sub;
    tooltip.hidden = false;
    tooltip.style.left = `${pointerX}px`;
    tooltip.style.top = `${pointerY}px`;
    const rect = tooltip.getBoundingClientRect();
    tooltip.classList.toggle('flip-x', pointerX + rect.width + 28 > innerWidth);
    tooltip.classList.toggle('flip-y', pointerY + rect.height + 28 > innerHeight);
    canvas.classList.add('hovering');
  }

  function describePlacement(placement) {
    return describeSeat(getActiveLocale(), venue, placement, describe(placement));
  }

  function showSeatInfo(index) {
    const info = describePlacement(placements[index]);
    seatMain.textContent = info.main;
    seatSub.textContent = info.sub;
  }

  function clearSeatInfo() {
    seatMain.textContent = t('noSeatSelected');
    seatSub.textContent = t('selectSeatHint');
  }

  function setViewMode(mode) {
    seatViewMode = mode;
    stageButton.classList.toggle('active', mode === 'stage');
    surroundingsButton.classList.toggle('active', mode === 'surroundings');
    controls.autoRotate = autoRotateInput.checked && !mode;
    labelGroup.visible = labelsInput.checked && !mode;
  }

  function clearPin({ reset = false } = {}) {
    const hover = hoveredId;
    hoveredId = -1;
    if (hover >= 0) setSeatColor(hover, baseColor(hover));
    if (pinnedId >= 0) setSeatColor(pinnedId, baseColor(pinnedId));
    pinnedId = -1;
    hideTooltip();
    seatCard.classList.remove('has-seat');
    seatActions.hidden = true;
    setViewMode(null);
    clearSeatInfo();
    if (reset) resetCamera();
  }

  function viewFromSeat(index) {
    const view = getSeatView(placements[index], stage);
    setViewMode('stage');
    flyTo(view.target, view.cameraPosition);
  }

  function viewSeatSurroundings(index) {
    const view = getSeatSurroundingsView(placements[index]);
    setViewMode('surroundings');
    flyTo(view.target, view.cameraPosition);
  }

  function selectSeat(index) {
    const previousPinnedId = pinnedId;
    pinnedId = index;
    restoreSeat(previousPinnedId);
    setSeatColor(index, PIN);
    showSeatInfo(index);
    seatCard.classList.add('has-seat');
    seatActions.hidden = false;
    viewFromSeat(index);
    if (matchMedia('(max-width: 560px)').matches) setPanelOpen(true);
  }

  function resetCamera() {
    setViewMode(null);
    const defaultCamera = venue.defaultCamera;
    flyTo(
      new THREE.Vector3(...(defaultCamera?.target ?? [0, 4, 0])),
      new THREE.Vector3(...(defaultCamera?.position ?? [76, 58, 76])),
    );
  }

  function buildModel() {
    disposeGroup(modelGroup);
    const model = venue.build({ scene: modelGroup }, { layout: layout.id });
    ({
      placements,
      seats,
      baseColors,
      seatIndex,
      wpMeshes: wheelchairMeshes,
      stage,
      roofGroup,
      labelGroup,
      describe,
    } = model);
    roofGroup.visible = roofInput.checked;
    labelGroup.visible = labelsInput.checked;

    const defaultCamera = venue.defaultCamera;
    camera.position.set(...(defaultCamera?.position ?? [76, 58, 76]));
    controls.target.set(...(defaultCamera?.target ?? [0, 4, 0]));
    controls.update();
  }

  buildModel();

  const raycaster = new THREE.Raycaster();
  const mouseNDC = new THREE.Vector2();

  function pick() {
    raycaster.setFromCamera(mouseNDC, camera);
    const hit = raycaster.intersectObjects([seats, ...wheelchairMeshes, stage], false)[0];
    if (!hit) {
      restoreSeat(hoveredId);
      hoveredId = -1;
      hideTooltip();
      if (pinnedId >= 0) showSeatInfo(pinnedId);
      return;
    }

    if (hit.object === stage) {
      restoreSeat(hoveredId);
      hoveredId = -1;
      showTooltip(
        describeStage(getActiveLocale(), venue, layout, stage.userData.label),
        t('performanceArea'),
      );
      return;
    }

    if (hit.object.userData.wp) {
      restoreSeat(hoveredId);
      hoveredId = -1;
      const wheelchair = describeWheelchair(getActiveLocale(), {
        id: hit.object.userData.wp,
        main: hit.object.userData.main,
        sub: hit.object.userData.sub,
      });
      showTooltip(
        wheelchair.main || `${t('wheelchairPlatform')} WP${hit.object.userData.wp}`,
        wheelchair.sub || t('wheelchairDetails'),
      );
      return;
    }

    const index = hit.instanceId;
    if (index === hoveredId) return;
    restoreSeat(hoveredId);
    hoveredId = index;
    setSeatColor(index, HOVER);
    const info = describePlacement(placements[index]);
    showTooltip(info.main, info.sub);
  }

  function searchSeat() {
    const [section, row, seat] = searchInputs.map((input) => input.value.trim().toUpperCase());
    const index = seatIndex.get(`${section}-${row}-${seat}`);
    if (index === undefined) {
      searchMessage.textContent = t('seatNotFound');
      return;
    }
    searchMessage.textContent = '';
    selectSeat(index);
  }

  function onPointerMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouseNDC.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    pointerX = event.clientX;
    pointerY = event.clientY;
    mouseDirty = true;
  }

  function onPointerLeave() {
    hideTooltip();
    restoreSeat(hoveredId);
    hoveredId = -1;
  }

  function refreshLocale() {
    searchMessage.textContent = '';
    hideTooltip();
    if (pinnedId >= 0) showSeatInfo(pinnedId);
    else clearSeatInfo();
    if (hoveredId >= 0) {
      restoreSeat(hoveredId);
      hoveredId = -1;
    }
    mouseDirty = true;
  }

  root.querySelector('[data-picker="venue"]').addEventListener('change', (event) => {
    const nextVenue = venues.find((item) => item.id === event.currentTarget.value);
    if (nextVenue) goToViewer(nextVenue.id, nextVenue.defaultLayout);
  });
  root.querySelector('[data-picker="layout"]').addEventListener('change', (event) => {
    goToViewer(venue.id, event.currentTarget.value);
  });
  root.querySelector('[data-action="reset"]').addEventListener('click', resetCamera);
  root.querySelector('[data-action="search"]').addEventListener('click', searchSeat);
  root.querySelector('[data-action="clear"]').addEventListener('click', () => clearPin({ reset: true }));
  stageButton.addEventListener('click', () => pinnedId >= 0 && viewFromSeat(pinnedId));
  surroundingsButton.addEventListener('click', () => pinnedId >= 0 && viewSeatSurroundings(pinnedId));

  function setPanelOpen(open) {
    viewerPanel.classList.toggle('is-open', open);
    panelButton.setAttribute('aria-expanded', String(open));
    panelSymbol.textContent = open ? '↓' : '↑';
    viewerPanel.style.transform = '';
  }

  let panelDrag;
  let suppressPanelClick = false;
  panelButton.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const travel = viewerPanel.offsetHeight - panelButton.offsetHeight;
    panelDrag = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startOffset: viewerPanel.classList.contains('is-open') ? 0 : travel,
      travel,
    };
    suppressPanelClick = false;
    viewerPanel.classList.add('is-dragging');
    panelButton.setPointerCapture(event.pointerId);
  });
  panelButton.addEventListener('pointermove', (event) => {
    if (!panelDrag || event.pointerId !== panelDrag.pointerId) return;
    const delta = event.clientY - panelDrag.startY;
    const offset = Math.max(0, Math.min(panelDrag.travel, panelDrag.startOffset + delta));
    suppressPanelClick ||= Math.abs(delta) > 5;
    viewerPanel.style.transform = `translateY(${offset}px)`;
  });
  panelButton.addEventListener('pointerup', (event) => {
    if (!panelDrag || event.pointerId !== panelDrag.pointerId) return;
    const delta = event.clientY - panelDrag.startY;
    const wasOpen = panelDrag.startOffset === 0;
    const open = Math.abs(delta) > 30 ? delta < 0 : wasOpen;
    panelDrag = null;
    viewerPanel.classList.remove('is-dragging');
    setPanelOpen(open);
  });
  panelButton.addEventListener('pointercancel', () => {
    panelDrag = null;
    viewerPanel.classList.remove('is-dragging');
    setPanelOpen(viewerPanel.classList.contains('is-open'));
  });
  panelButton.addEventListener('click', (event) => {
    if (suppressPanelClick) {
      event.preventDefault();
      suppressPanelClick = false;
      return;
    }
    setPanelOpen(!viewerPanel.classList.contains('is-open'));
  });

  const settingsButton = root.querySelector('[data-action="settings"]');
  const settingsPanel = root.querySelector('#portal-settings');
  settingsButton.addEventListener('click', () => {
    const open = settingsPanel.hidden;
    settingsPanel.hidden = !open;
    settingsButton.classList.toggle('active', open);
    settingsButton.setAttribute('aria-expanded', String(open));
    root.querySelector('[data-settings-symbol]').textContent = open ? '−' : '+';
  });

  autoRotateInput.addEventListener('change', () => {
    controls.autoRotate = autoRotateInput.checked && !seatViewMode;
  });
  roofInput.addEventListener('change', () => {
    roofGroup.visible = roofInput.checked;
  });
  labelsInput.addEventListener('change', () => {
    labelGroup.visible = labelsInput.checked && !seatViewMode;
  });
  searchInputs.forEach((input) => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') searchSeat();
    });
  });

  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointerdown', () => canvas.classList.add('dragging'));
  canvas.addEventListener('click', () => {
    if (hoveredId >= 0) selectSeat(hoveredId);
    else clearPin();
  });
  addEventListener('pointerup', () => canvas.classList.remove('dragging'));
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape') clearPin({ reset: true });
  });
  addEventListener('concert:locale', refreshLocale);

  function pickingLoop() {
    if (!picking) return;
    pickingFrame = requestAnimationFrame(pickingLoop);
    if (mouseDirty && !engine.isFlying()) {
      pick();
      mouseDirty = false;
    }
  }

  clearSeatInfo();
  pickingLoop();
  engine.animate();

  addEventListener('pageshow', () => {
    engine.resize();
  });
  addEventListener('pagehide', (event) => {
    if (!shouldDestroyViewer(event)) return;
    picking = false;
    cancelAnimationFrame(pickingFrame);
    engine.destroy();
    disposeGroup(modelGroup);
  });
}
