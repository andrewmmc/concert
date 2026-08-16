<script>
  import { untrack } from 'svelte';
  import { createScene, getSeatSurroundingsView, getSeatView, HOVER, PIN } from '../scene.js';
  import { venues } from '../venues/index.js';
  import { goTo, goToVenue } from '../lib/router.js';
  import {
    ENGLISH,
    TRADITIONAL_CHINESE,
    describeSeat,
    describeStage,
    describeWheelchair,
    getVenueText,
    translate,
  } from '../lib/i18n.js';

  let { venue, layout, locale, onLocaleChange } = $props();
  let text = $derived(getVenueText(locale, venue, layout));

  let canvas = $state();
  let autoRotate = $state(false);
  let showRoof = $state(true);
  let showLabels = $state(true);
  let settingsOpen = $state(false);
  let inSec = $state(''), inRow = $state(''), inSeat = $state('');
  let searchMsg = $state('');
  let seatMain = $state('');
  let seatSub = $state('');
  let pinned = $state(false);
  let seatViewMode = $state(null);
  let tooltip = $state({ show: false, x: 0, y: 0, main: '', sub: '' });
  let tooltipEl = $state();

  let engine;
  let modelGroup, buildSceneFn;
  let hoveredId = -1, pinnedId = -1;
  let restoreFn, pickFn, flyFn, goSeatFn, viewSeatFn, clearPinFn, refreshLocalizedInfoFn;

  const t = (key) => translate(locale, key);

  function initializeScene() {
    const sceneCanvas = canvas;
    const activeEngine = createScene(sceneCanvas);
    engine = activeEngine;
    const { scene, camera, controls, flyTo } = engine;
    modelGroup = new engine.THREE.Group();
    scene.add(modelGroup);

    let placements = [], seats, baseColors, seatIndex, wpMeshes = [], stage, roofGroup, labelGroup, describe;

    // Dispose the geometry, materials, textures and instance buffers of a
    // previous model before rebuilding the scene for a new venue/layout.
    function disposeGroup(group) {
      group.traverse((obj) => {
        if (obj.isInstancedMesh) obj.dispose();
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          for (const m of mats) { if (m.map) m.map.dispose(); m.dispose(); }
        }
      });
      group.clear();
    }

    // (Re)build the model for the current route into modelGroup and refresh
    // the references used by picking, search and the display toggles.
    function buildScene() {
      disposeGroup(modelGroup);
      const model = venue.build({ scene: modelGroup }, { layout: layout?.id });
      ({ placements, seats, baseColors, seatIndex, wpMeshes, stage, roofGroup, labelGroup, describe } = model);
      roofGroup.visible = showRoof;
      labelGroup.visible = showLabels;
      searchMsg = '';
      // Frame the venue with its own camera when one is configured.
      const dc = venue.defaultCamera;
      if (dc) {
        camera.position.set(...(dc.position ?? [76, 58, 76]));
        controls.target.set(...(dc.target ?? [0, 4, 0]));
      }
    }
    buildScene();
    buildSceneFn = buildScene;

    const raycaster = new engine.THREE.Raycaster();
    const mouseNDC = new engine.THREE.Vector2();
    let mouseDirty = false;

    const setColor = (i, color) => { if (i < 0) return; seats.setColorAt(i, color); seats.instanceColor.needsUpdate = true; };
    const base = (i) => new engine.THREE.Color(baseColors[i * 3], baseColors[i * 3 + 1], baseColors[i * 3 + 2]);
    restoreFn = (i) => { if (i < 0 || i === pinnedId) return; setColor(i, base(i)); };

    function localizedSeat(p) {
      return describeSeat(locale, venue, p, describe(p));
    }
    function showInfo(p) { const d = localizedSeat(p); seatMain = d.main; seatSub = d.sub; }
    function clearInfo() {
      seatMain = t('noSeatSelected');
      seatSub = t('selectSeatHint');
    }
    refreshLocalizedInfoFn = () => {
      searchMsg = '';
      tooltip = { ...tooltip, show: false };
      if (pinnedId >= 0) showInfo(placements[pinnedId]);
      else clearInfo();
      if (hoveredId >= 0) {
        restoreFn(hoveredId);
        hoveredId = -1;
      }
      mouseDirty = true;
    };

    function clearPin() {
      // clear every highlighted seat (pinned + hovered)
      const hover = hoveredId; hoveredId = -1;
      if (hover >= 0) setColor(hover, base(hover));
      tooltip = { ...tooltip, show: false };
      if (pinnedId >= 0) {
        const i = pinnedId; pinnedId = -1;
        setColor(i, base(i));
      }
      pinned = false;
      seatViewMode = null;
      clearInfo();
    }

    function viewFromSeat(i) {
      const view = getSeatView(placements[i], stage);
      seatViewMode = 'stage';
      flyTo(view.target, view.cameraPosition);
    }

    function viewSeatSurroundings(i) {
      const view = getSeatSurroundingsView(placements[i]);
      seatViewMode = 'surroundings';
      flyTo(view.target, view.cameraPosition);
    }

    function selectSeat(i) {
      const previousPinnedId = pinnedId;
      pinnedId = i;
      restoreFn(previousPinnedId);
      setColor(i, PIN);
      const p = placements[i];
      showInfo(p);
      pinned = true;
      viewFromSeat(i);
    }

    function onMove(e) {
      const rect = sceneCanvas.getBoundingClientRect();
      mouseNDC.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      mouseDirty = true;
      tooltip.x = e.clientX; tooltip.y = e.clientY;
    }
    function onLeave() {
      tooltip = { ...tooltip, show: false };
      restoreFn(hoveredId); hoveredId = -1;
      sceneCanvas.classList.remove('hovering');
    }
    function onClick() {
      if (hoveredId >= 0) {
        selectSeat(hoveredId);
      } else {
        clearPin();
      }
    }

    function onPointerDown() { sceneCanvas.classList.add('dragging'); }
    function onPointerUp() { sceneCanvas.classList.remove('dragging'); }
    sceneCanvas.addEventListener('pointermove', onMove);
    sceneCanvas.addEventListener('pointerleave', onLeave);
    sceneCanvas.addEventListener('pointerdown', onPointerDown);
    addEventListener('pointerup', onPointerUp);
    sceneCanvas.addEventListener('click', onClick);
    function onWindowKey(e) { if (e.key === 'Escape') clearPinFn?.(); }
    addEventListener('keydown', onWindowKey);

    pickFn = () => {
      raycaster.setFromCamera(mouseNDC, camera);
      const hit = raycaster.intersectObjects([seats, ...wpMeshes, stage], false)[0];
      if (!hit) {
        if (hoveredId >= 0) { restoreFn(hoveredId); hoveredId = -1; }
        tooltip = { ...tooltip, show: false };
        sceneCanvas.classList.remove('hovering');
        if (pinnedId >= 0) showInfo(placements[pinnedId]);
        return;
      }
      if (hit.object === stage) {
        if (hoveredId >= 0) { restoreFn(hoveredId); hoveredId = -1; }
        tooltip = {
          show: true,
          x: tooltip.x,
          y: tooltip.y,
          main: describeStage(locale, venue, layout, stage.userData.label),
          sub: t('performanceArea'),
        };
        sceneCanvas.classList.add('hovering'); return;
      }
      if (hit.object.userData.wp) {
        if (hoveredId >= 0) { restoreFn(hoveredId); hoveredId = -1; }
        const wheelchair = describeWheelchair(locale, {
          id: hit.object.userData.wp,
          main: hit.object.userData.main,
          sub: hit.object.userData.sub,
        });
        tooltip = {
          show: true,
          x: tooltip.x,
          y: tooltip.y,
          main: wheelchair.main || `${t('wheelchairPlatform')} WP${hit.object.userData.wp}`,
          sub: wheelchair.sub || t('wheelchairDetails'),
        };
        sceneCanvas.classList.add('hovering'); return;
      }
      const id = hit.instanceId;
      if (id !== hoveredId) {
        restoreFn(hoveredId); hoveredId = id;
        setColor(hoveredId, HOVER);
        const p = placements[hoveredId], d = localizedSeat(p);
        tooltip = { show: true, x: tooltip.x, y: tooltip.y, main: d.main, sub: d.sub };
        sceneCanvas.classList.add('hovering');
      }
    };

    flyFn = (target, camPos) => flyTo(target, camPos);

    // toggles
    $effect(() => { controls.autoRotate = autoRotate && !seatViewMode; });
    $effect(() => { roofGroup.visible = showRoof; });
    $effect(() => { labelGroup.visible = showLabels && !seatViewMode; });
    // Flip the tooltip away from the viewport edges once it is measured.
    $effect(() => {
      if (!tooltip.show || !tooltipEl) return;
      const rect = tooltipEl.getBoundingClientRect();
      tooltipEl.classList.toggle('flip-x', tooltip.x + rect.width + 28 > innerWidth);
      tooltipEl.classList.toggle('flip-y', tooltip.y + rect.height + 28 > innerHeight);
    });

    // search
    goSeatFn = () => {
      const key = `${inSec.trim().toUpperCase()}-${inRow.trim().toUpperCase()}-${inSeat.trim().toUpperCase()}`;
      const i = seatIndex.get(key);
      if (i === undefined) { searchMsg = t('seatNotFound'); return; }
      searchMsg = '';
      selectSeat(i);
    };
    viewSeatFn = (mode) => {
      if (pinnedId < 0) return;
      if (mode === 'surroundings') viewSeatSurroundings(pinnedId);
      else viewFromSeat(pinnedId);
    };
    clearPinFn = clearPin;

    // render loop with picking
    let pickingFrame = 0;
    let picking = true;
    function loop() {
      if (!picking) return;
      pickingFrame = requestAnimationFrame(loop);
      if (mouseDirty && !activeEngine.isFlying()) { pickFn(); mouseDirty = false; }
    }
    loop();
    activeEngine.animate();

    return () => {
      picking = false;
      cancelAnimationFrame(pickingFrame);
      sceneCanvas.removeEventListener('pointermove', onMove);
      sceneCanvas.removeEventListener('pointerleave', onLeave);
      sceneCanvas.removeEventListener('pointerdown', onPointerDown);
      sceneCanvas.removeEventListener('click', onClick);
      removeEventListener('pointerup', onPointerUp);
      removeEventListener('keydown', onWindowKey);
      activeEngine.destroy();
      if (engine === activeEngine) {
        engine = undefined;
        buildSceneFn = undefined;
        restoreFn = undefined;
        pickFn = undefined;
        flyFn = undefined;
        goSeatFn = undefined;
        viewSeatFn = undefined;
        clearPinFn = undefined;
        refreshLocalizedInfoFn = undefined;
      }
    };
  }

  $effect(() => {
    if (!canvas) return;
    return untrack(initializeScene);
  });

  $effect(() => {
    const venueId = venue.id;
    const layoutId = layout?.id;
    if (!buildSceneFn) return;
    untrack(() => {
      clearPinFn?.();
      buildSceneFn();
      if (!venue.defaultCamera) resetCamera();
    });
  });

  $effect(() => {
    const nextLocale = locale;
    if (refreshLocalizedInfoFn) {
      refreshLocalizedInfoFn();
    } else {
      seatMain = translate(nextLocale, 'noSeatSelected');
      seatSub = translate(nextLocale, 'selectSeatHint');
    }
  });

  function goSeat() { goSeatFn && goSeatFn(); }
  function viewFromSelectedSeat() { viewSeatFn && viewSeatFn('stage'); }
  function viewSelectedSeatSurroundings() { viewSeatFn && viewSeatFn('surroundings'); }
  function unselect() {
    clearPinFn && clearPinFn();
    resetCamera();
  }
  function resetCamera() {
    if (!engine || !flyFn) return;
    seatViewMode = null;
    const dc = venue.defaultCamera;
    flyFn(
      new engine.THREE.Vector3(...(dc?.target ?? [0, 4, 0])),
      new engine.THREE.Vector3(...(dc?.position ?? [76, 58, 76]))
    );
  }
  function onKey(e) { if (e.key === 'Enter') goSeat(); }

  function selectVenue(event) {
    const nextVenue = venues.find((item) => item.id === event.currentTarget.value);
    if (nextVenue) goTo(nextVenue.id, nextVenue.defaultLayout);
  }
  function selectLayout(event) { goTo(venue.id, event.currentTarget.value); }
  function changeLocale(nextLocale) {
    if (locale !== nextLocale) onLocaleChange(nextLocale);
  }
</script>

<section class="viewer-section viewer-page">
  <div class="viewer-topbar">
    <button class="viewer-back" onclick={() => goToVenue(venue.id)}>← {t('viewerBackToVenue')}</button>
    <span>{t('viewerModeLabel')} / {venue.id.toUpperCase()}</span>
    <div class="viewer-language" role="group" aria-label={t('language')}>
      <button class:active={locale === TRADITIONAL_CHINESE} onclick={() => changeLocale(TRADITIONAL_CHINESE)}>繁</button>
      <button class:active={locale === ENGLISH} onclick={() => changeLocale(ENGLISH)}>EN</button>
    </div>
  </div>

  <div class="viewer-frame">
    <div class="canvas-stage">
      <div class="canvas-label"><i></i>{t('liveModel')}</div>
      <button class="canvas-reset" onclick={resetCamera} aria-label={t('resetCamera')} title={t('resetCamera')}>
        <span aria-hidden="true">↺</span> {t('resetView')}
      </button>
      <canvas bind:this={canvas} id="scene" aria-label={t('canvasLabel')}></canvas>
      <div class="canvas-hint">{t('controlsHint')}</div>
    </div>

    <aside class="viewer-panel">
      <div class="panel-kicker">{t('viewerPanelLabel')}</div>
      <h3>{text.name}</h3>
      <p class="venue-meta">{layout ? text.layoutName : text.subtitle}</p>

      <div class="picker-stack">
        <label>
          <span>{t('venue')}</span>
          <select class="picker" value={venue.id} onchange={selectVenue} aria-label={t('venue')}>
            {#each venues as v}
              <option value={v.id} selected={v.id === venue.id}>{getVenueText(locale, v).name}</option>
            {/each}
          </select>
        </label>
        {#if venue.layouts && venue.layouts.length}
          <label>
            <span>{t('seatingLayout')}</span>
            <select class="picker" value={layout?.id} onchange={selectLayout} aria-label={t('seatingLayout')}>
              {#each venue.layouts as l}
                <option value={l.id} selected={l.id === layout?.id} disabled={l.comingSoon}>
                  {getVenueText(locale, venue, l).layoutName}{l.comingSoon ? ` (${t('comingSoon')})` : ''}
                </option>
              {/each}
            </select>
          </label>
        {/if}
      </div>

      <p class="model-note">{text.dims}{t('sentenceEnd')}</p>

      <div class="legend">
        {#each venue.sides as s, i}
          <span class="chip"><i style="background:{s.color}"></i>{text.sides[i]}</span>
        {/each}
      </div>

      <div class="panel-rule"></div>

      <div class="search-block">
        <div class="search-label">{t('findSeat')}</div>
        <div class="fields">
          <input value={inSec} oninput={e => inSec = e.currentTarget.value} onkeydown={onKey} type="text" placeholder={t('sectionShort')} maxlength="3" aria-label={t('section')}>
          <input value={inRow} oninput={e => inRow = e.currentTarget.value} onkeydown={onKey} type="text" placeholder={t('row')} maxlength="3" aria-label={t('row')}>
          <input value={inSeat} oninput={e => inSeat = e.currentTarget.value} onkeydown={onKey} type="text" inputmode="numeric" placeholder={t('seat')} maxlength="4" aria-label={t('seat')}>
          <button class="search-go" onclick={goSeat} aria-label={t('goToSeat')}>→</button>
        </div>
        <div class="search-message" aria-live="polite">{searchMsg}</div>
      </div>

      <div class="seat-card" class:has-seat={pinned}>
        <div class="seat-copy" aria-live="polite">
          <div class="cap">{t('seat')}</div>
          <div class="seat-name">{seatMain}</div>
          <div class="seat-sub">{seatSub}</div>
        </div>
        {#if pinned}
          <div class="seat-actions">
            <button class:active={seatViewMode === 'stage'} class="view-seat stage" onclick={viewFromSelectedSeat}>
              {t('viewFromSeat')}
            </button>
            <button class:active={seatViewMode === 'surroundings'} class="view-seat surroundings" onclick={viewSelectedSeatSurroundings}>
              {t('seatSurroundings')}
            </button>
            <button class="clear" onclick={unselect} aria-label={t('unselectSeat')}>×</button>
          </div>
        {/if}
      </div>

      <button
        class="settings-toggle"
        class:active={settingsOpen}
        onclick={() => settingsOpen = !settingsOpen}
        aria-expanded={settingsOpen}
        aria-controls="portal-settings"
      >
        <span>{t('settings')}</span><span aria-hidden="true">{settingsOpen ? '−' : '+'}</span>
      </button>
      {#if settingsOpen}
        <div class="portal-settings" id="portal-settings">
          <div class="setting-row"><span>{t('autoRotate')}</span>
            <label class="switch"><input type="checkbox" bind:checked={autoRotate}><span class="slider"></span></label></div>
          <div class="setting-row"><span>{text.roofLabel || t('roofStructure')}</span>
            <label class="switch"><input type="checkbox" bind:checked={showRoof}><span class="slider"></span></label></div>
          <div class="setting-row"><span>{t('sideLabels')}</span>
            <label class="switch"><input type="checkbox" bind:checked={showLabels}><span class="slider"></span></label></div>
        </div>
      {/if}

      {#if layout?.planUrl || venue.planUrl}
        <a class="plan-link" href={layout?.planUrl || venue.planUrl} target="_blank" rel="noopener noreferrer">
          {t('officialPlan')} <span aria-hidden="true">↗</span>
        </a>
      {/if}
    </aside>
  </div>
</section>

{#if tooltip.show}
  <div id="tooltip" bind:this={tooltipEl} aria-hidden="true" style="left:{tooltip.x}px;top:{tooltip.y}px">
    <b>{tooltip.main}</b>{#if tooltip.sub}<br><span class="dim">{tooltip.sub}</span>{/if}
  </div>
{/if}
