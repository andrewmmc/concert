<script>
  import { onMount } from 'svelte';
  import { createScene, getSeatSurroundingsView, getSeatView, HOVER, PIN } from './scene.js';
  import { venues } from './venues/index.js';
  import { parseHash, goHome as navigateHome, goTo, onRoute } from './lib/router.js';
  import {
    ENGLISH,
    TRADITIONAL_CHINESE,
    describeSeat,
    describeStage,
    describeWheelchair,
    getVenueText,
    initialLocale,
    saveLocale,
    translate,
    updateDocumentLocale,
  } from './lib/i18n.js';

  function browserStorage() {
    try {
      return globalThis.localStorage;
    } catch {
      return undefined;
    }
  }

  const storage = browserStorage();
  const startingLocale = initialLocale({
    storage,
    languages: globalThis.navigator?.languages || [globalThis.navigator?.language],
  });

  let route = $state(parseHash());
  let venue = $derived(route.venue);
  let layout = $derived(route.layout);
  let locale = $state(startingLocale);
  let text = $derived(getVenueText(locale, venue, layout));

  let canvas = $state();
  let autoRotate = $state(false);
  let showRoof = $state(true);
  let showLabels = $state(true);
  let settingsOpen = $state(false);
  let inSec = $state(''), inRow = $state(''), inSeat = $state('');
  let searchMsg = $state('');
  let seatMain = $state(translate(startingLocale, 'noSeatSelected'));
  let seatSub = $state(translate(startingLocale, 'selectSeatHint'));
  let pinned = $state(false);
  let seatViewMode = $state(null);
  let tooltip = $state({ show: false, x: 0, y: 0, main: '', sub: '' });
  let tooltipEl = $state();

  let engine;
  let modelGroup, buildSceneFn;
  let hoveredId = -1, pinnedId = -1;
  let restoreFn, pickFn, flyFn, goSeatFn, viewSeatFn, clearPinFn, refreshLocalizedInfoFn;

  const t = (key) => translate(locale, key);

  $effect(() => {
    updateDocumentLocale(locale);
    if (route.page === 'venue') document.title = `${text.name} — ${t('siteName')}`;
  });

  onMount(() => {
    route = parseHash();
    const off = onRoute((r) => {
      // The scene is built per venue/layout; a route that resolves to a
      // different one gets an in-place rebuild instead of a page reload.
      const changed = r.venue.id !== route.venue.id || r.layout?.id !== route.layout?.id;
      route = r;
      if (changed && buildSceneFn) {
        clearPinFn?.();
        buildSceneFn();
        // Venues without their own framing fly back to the default view.
        if (!venue.defaultCamera) resetCamera();
      }
    });
    return off;
  });

  onMount(() => {
    engine = createScene(canvas);
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
      const rect = canvas.getBoundingClientRect();
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
      canvas.classList.remove('hovering');
    }
    function onClick() {
      if (hoveredId >= 0) {
        selectSeat(hoveredId);
      } else {
        clearPin();
      }
    }

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', () => canvas.classList.add('dragging'));
    addEventListener('pointerup', () => canvas.classList.remove('dragging'));
    canvas.addEventListener('click', onClick);
    function onWindowKey(e) { if (e.key === 'Escape') clearPinFn?.(); }
    addEventListener('keydown', onWindowKey);

    pickFn = () => {
      raycaster.setFromCamera(mouseNDC, camera);
      const hit = raycaster.intersectObjects([seats, ...wpMeshes, stage], false)[0];
      if (!hit) {
        if (hoveredId >= 0) { restoreFn(hoveredId); hoveredId = -1; }
        tooltip = { ...tooltip, show: false };
        canvas.classList.remove('hovering');
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
        canvas.classList.add('hovering'); return;
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
        canvas.classList.add('hovering'); return;
      }
      const id = hit.instanceId;
      if (id !== hoveredId) {
        restoreFn(hoveredId); hoveredId = id;
        setColor(hoveredId, HOVER);
        const p = placements[hoveredId], d = localizedSeat(p);
        tooltip = { show: true, x: tooltip.x, y: tooltip.y, main: d.main, sub: d.sub };
        canvas.classList.add('hovering');
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
    (function loop() {
      requestAnimationFrame(loop);
      if (mouseDirty && !engine.isFlying()) { pickFn(); mouseDirty = false; }
    })();
    engine.animate();

    return () => {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick);
      removeEventListener('keydown', onWindowKey);
      engine.destroy();
    };
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
  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function goHome(sectionId = 'top') {
    navigateHome();
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection(sectionId)));
  }
  function selectVenue(e) {
    const nextVenue = venues.find((item) => item.id === e.currentTarget.value);
    if (nextVenue) goTo(nextVenue.id, nextVenue.defaultLayout);
  }
  function selectVenueFromCard(nextVenue) {
    goTo(nextVenue.id, nextVenue.defaultLayout);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function selectLayout(e) { goTo(venue.id, e.currentTarget.value); }
  function changeLocale(nextLocale) {
    if (locale === nextLocale) return;
    locale = nextLocale;
    saveLocale(locale, storage);
    refreshLocalizedInfoFn?.();
    if (!refreshLocalizedInfoFn) {
      seatMain = t('noSeatSelected');
      seatSub = t('selectSeatHint');
    }
  }
</script>

<div class="portal" id="top">
  <header class="topbar">
    <button class="brand" onclick={() => goHome()} aria-label={t('siteName')}>
      <span class="brand-mark" aria-hidden="true">
        <i></i><i></i><i></i><i></i>
      </span>
      <span>{t('shortBrand')}</span>
    </button>

    <nav aria-label={t('navLabel')}>
      <button onclick={() => scrollToSection('explore')}>{t('navExplore')}</button>
      <button onclick={() => goHome('venues')}>{t('navVenues')}</button>
      <button onclick={() => goHome('concerts')}>{t('navConcerts')}</button>
      <button onclick={() => goHome('community')}>{t('navCommunity')}</button>
    </nav>

    <div class="top-actions">
      <div class="language-switcher" role="group" aria-label={t('language')}>
        <button
          class:active={locale === TRADITIONAL_CHINESE}
          onclick={() => changeLocale(TRADITIONAL_CHINESE)}
          aria-label={t('traditionalChinese')}
          aria-pressed={locale === TRADITIONAL_CHINESE}
        >繁</button>
        <button
          class:active={locale === ENGLISH}
          onclick={() => changeLocale(ENGLISH)}
          aria-label={t('english')}
          aria-pressed={locale === ENGLISH}
        >EN</button>
      </div>
      <button class="top-cta" onclick={() => scrollToSection('explore')}>{t('explore3d')}</button>
    </div>
  </header>

  <main>
    {#if route.page === 'home'}
    <section class="hero">
      <div class="hero-copy reveal">
        <p class="eyebrow">{t('portalEyebrow')}</p>
        <h1>{t('heroTitle')} <em>{t('heroTitleAccent')}</em></h1>
        <p class="hero-body">{t('heroBody')}</p>
        <div class="hero-actions">
          <button class="button-primary" onclick={() => scrollToSection('explore')}>
            {t('explore3d')} <span aria-hidden="true">↘</span>
          </button>
          <button class="button-link" onclick={() => scrollToSection('venues')}>
            {t('browseVenues')} <span aria-hidden="true">→</span>
          </button>
        </div>
        <div class="hero-stats">
          <div><strong>{venues.length}</strong><span>{t('modelsAvailable')}</span></div>
          <div><strong>繁 / EN</strong><span>{t('bilingualGuide')}</span></div>
          <div><strong>852</strong><span>{t('builtForHongKong')}</span></div>
        </div>
      </div>

      <div class="hero-visual reveal delay-one" aria-hidden="true">
        <div class="city-card">
          <div class="city-card-head">
            <span>{t('tonightInHongKong')}</span>
            <span>20:15 HKT</span>
          </div>
          <div class="route-map">
            <div class="route-line"></div>
            <span class="station station-one"><i></i>HUNG HOM</span>
            <span class="station station-two"><i></i>KAI TAK</span>
            <span class="station station-three"><i></i>ASIAWORLD</span>
            <div class="pulse-ring"></div>
          </div>
          <div class="city-card-foot">
            <span>{t('cityNote')}</span>
            <b>22°19'N<br>114°10'E</b>
          </div>
        </div>
        <div class="ticket-strip">LIVE / SEAT / CITY / 852 / LIVE / SEAT / CITY</div>
        <div class="hero-orbit orbit-one"></div>
        <div class="hero-orbit orbit-two"></div>
      </div>
    </section>
    {:else}
      <section class="arena-hero">
        <div class="arena-hero-copy reveal">
          <button class="back-link" onclick={() => goHome('venues')}>
            <span aria-hidden="true">←</span> {t('backToPortal')}
          </button>
          <p class="eyebrow">{t('arenaPageEyebrow')} / {venue.id.toUpperCase()}</p>
          <h1>{text.name}</h1>
          <p class="arena-subtitle">{text.subtitle}</p>
          <p class="arena-intro">{t('arenaPageBody')}</p>
          <div class="arena-layout-line">
            <span>{t('currentLayout')}</span>
            <strong>{layout ? text.layoutName : text.subtitle}</strong>
          </div>
        </div>
        <div class="arena-index reveal delay-one" aria-hidden="true">
          <span>{venues.findIndex((item) => item.id === venue.id) + 1}</span>
          <div class="arena-rings"><i></i><i></i><i></i><b></b></div>
          <small>{venue.id.toUpperCase()} / 852</small>
        </div>
      </section>
    {/if}

    <section class="viewer-section" id="explore">
      <div class="section-heading">
        <div>
          <p class="eyebrow">{t('viewerEyebrow')}</p>
          <h2>{t('viewerTitle')}</h2>
        </div>
        <p>{t('viewerBody')}</p>
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

    {#if route.page === 'home'}
    <section class="venue-section" id="venues">
      <div class="section-heading venue-heading">
        <div>
          <p class="eyebrow">{t('venueDirectoryEyebrow')}</p>
          <h2>{t('venueDirectoryTitle')}</h2>
        </div>
        <p>{t('venueDirectoryBody')}</p>
      </div>

      <div class="venue-grid">
        {#each venues as v, i}
          <article class="venue-card" class:featured={i === 0}>
            <div class="venue-number">0{i + 1}</div>
            <div class="venue-graphic" aria-hidden="true">
              <span></span><span></span><span></span>
            </div>
            <div class="venue-card-copy">
              <p>{v.id.toUpperCase()}</p>
              <h3>{getVenueText(locale, v).name}</h3>
              <span>{getVenueText(locale, v).subtitle}</span>
            </div>
            <button onclick={() => selectVenueFromCard(v)} aria-label={`${t('open3dModel')}: ${getVenueText(locale, v).name}`}>
              {t('open3dModel')} <span aria-hidden="true">↗</span>
            </button>
          </article>
        {/each}
      </div>
    </section>

    <section class="transport-section">
      <div class="transport-intro">
        <p class="eyebrow">{t('transportEyebrow')}</p>
        <h2>{t('transportTitle')}</h2>
        <p>{t('transportBody')}</p>
      </div>
      <div class="transport-grid">
        <article>
          <span class="feature-icon">M</span>
          <div><h3>{t('mtrRoutes')}</h3><p>{t('mtrRoutesBody')}</p></div>
          <b>{t('comingFeature')}</b>
        </article>
        <article>
          <span class="feature-icon">N</span>
          <div><h3>{t('afterShow')}</h3><p>{t('afterShowBody')}</p></div>
          <b>{t('comingFeature')}</b>
        </article>
        <article>
          <span class="feature-icon">A</span>
          <div><h3>{t('accessibilityGuide')}</h3><p>{t('accessibilityGuideBody')}</p></div>
          <b>{t('comingFeature')}</b>
        </article>
      </div>
    </section>

    <section class="concert-section" id="concerts">
      <div class="section-heading">
        <div>
          <p class="eyebrow">{t('whatsOnEyebrow')}</p>
          <h2>{t('whatsOnTitle')}</h2>
        </div>
        <p>{t('whatsOnBody')}</p>
      </div>
      <div class="concert-board">
        <div class="calendar-stamp">
          <span>AUG — DEC</span>
          <strong>2026</strong>
          <small>{t('calendarPreview')}</small>
        </div>
        <div class="concert-list">
          <article><time>TBA</time><div><h3>{t('concertOne')}</h3><p>{t('concertOneMeta')}</p></div><span>01</span></article>
          <article><time>TBA</time><div><h3>{t('concertTwo')}</h3><p>{t('concertTwoMeta')}</p></div><span>02</span></article>
          <article><time>TBA</time><div><h3>{t('concertThree')}</h3><p>{t('concertThreeMeta')}</p></div><span>03</span></article>
        </div>
      </div>
    </section>

    <section class="community-section" id="community">
      <div class="community-copy">
        <p class="eyebrow">{t('communityEyebrow')}</p>
        <h2>{t('communityTitle')}</h2>
        <p>{t('communityBody')}</p>
        <span>{t('communitySoon')}</span>
      </div>
      <div class="community-cards">
        <article class="photo-card">
          <div class="photo-placeholder">
            <span>SECTION 42 · ROW 18</span>
            <i></i>
          </div>
          <h3>{t('uploadPhotos')}</h3>
          <p>{t('uploadPhotosBody')}</p>
        </article>
        <article class="comment-card">
          <div class="comment-lines" aria-hidden="true"><i></i><i></i><i></i></div>
          <blockquote>“{t('localCommentsBody')}”</blockquote>
          <h3>{t('localComments')}</h3>
        </article>
      </div>
    </section>
    {:else}
      <section class="arena-guide-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">{text.name}</p>
            <h2>{t('arenaQuickGuide')}</h2>
          </div>
          <p>{t('arenaQuickGuideBody')}</p>
        </div>
        <div class="arena-guide-grid">
          <article>
            <span>01</span>
            <h3>{t('arenaTransportTitle')}</h3>
            <p>{t('arenaTransportBody')}</p>
            <b>{t('comingFeature')}</b>
          </article>
          <article>
            <span>02</span>
            <h3>{t('arenaConcertsTitle')}</h3>
            <p>{t('arenaConcertsBody')}</p>
            <b>{t('comingFeature')}</b>
          </article>
          <article>
            <span>03</span>
            <h3>{t('arenaCommunityTitle')}</h3>
            <p>{t('arenaCommunityBody')}</p>
            <b>{t('comingFeature')}</b>
          </article>
        </div>
      </section>

      <section class="other-arenas" id="venues">
        <div class="section-heading">
          <div>
            <p class="eyebrow">{t('venueDirectoryEyebrow')}</p>
            <h2>{t('exploreOtherArenas')}</h2>
          </div>
        </div>
        <div class="venue-grid">
          {#each venues as v, i}
            {#if v.id !== venue.id}
              <article class="venue-card">
                <div class="venue-number">0{i + 1}</div>
                <div class="venue-graphic" aria-hidden="true">
                  <span></span><span></span><span></span>
                </div>
                <div class="venue-card-copy">
                  <p>{v.id.toUpperCase()}</p>
                  <h3>{getVenueText(locale, v).name}</h3>
                  <span>{getVenueText(locale, v).subtitle}</span>
                </div>
                <button onclick={() => selectVenueFromCard(v)} aria-label={`${t('open3dModel')}: ${getVenueText(locale, v).name}`}>
                  {t('open3dModel')} <span aria-hidden="true">↗</span>
                </button>
              </article>
            {/if}
          {/each}
        </div>
      </section>
    {/if}
  </main>

  <footer>
    <div class="brand footer-brand">
      <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span>{t('shortBrand')}</span>
    </div>
    <p>{t('footerLine')}</p>
    <span>© 2026 / 22°19'N 114°10'E</span>
  </footer>
</div>

{#if tooltip.show}
  <div id="tooltip" bind:this={tooltipEl} aria-hidden="true" style="left:{tooltip.x}px;top:{tooltip.y}px">
    <b>{tooltip.main}</b>{#if tooltip.sub}<br><span class="dim">{tooltip.sub}</span>{/if}
  </div>
{/if}

<style>
  :global(:root) {
    --paper: #fffdf8;
    --ink: #171714;
    --muted: #6e706a;
    --line: #d9dbd4;
    --soft: #f1f3ef;
    --signal: #ef3e2f;
    --signal-dark: #bd251d;
    --acid: #d9ff43;
    --blue: #1b4dff;
    --display: "Bodoni 72", "Didot", "Songti TC", "Noto Serif TC", serif;
    --sans: "Avenir Next", "Gill Sans", "PingFang HK", "Noto Sans TC", sans-serif;
  }

  :global(html) { scroll-behavior: smooth; background: var(--paper); }
  :global(html, body) {
    width: 100%;
    height: auto;
    min-height: 100%;
    overflow: visible;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--sans);
  }
  :global(body) { overflow-x: hidden; }
  :global(button, input, select) { font: inherit; }
  :global(button:focus-visible), :global(a:focus-visible), :global(input:focus-visible), :global(select:focus-visible) {
    outline: 3px solid rgba(27, 77, 255, .28);
    outline-offset: 3px;
  }
  :global(#app) { width: 100%; height: auto; min-height: 100%; }

  .portal { min-height: 100vh; background: var(--paper); overflow: hidden; }
  .topbar {
    width: min(1440px, calc(100% - 64px));
    height: 84px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    border-bottom: 1px solid var(--line);
    position: relative;
    z-index: 30;
  }
  .brand {
    border: 0;
    background: transparent;
    color: var(--ink);
    display: inline-flex;
    align-items: center;
    gap: 11px;
    width: fit-content;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: .16em;
    cursor: pointer;
  }
  .brand-mark { width: 27px; height: 27px; position: relative; display: grid; grid-template-columns: 1fr 1fr; gap: 2px; transform: rotate(45deg); }
  .brand-mark i { display: block; background: var(--signal); }
  .brand-mark i:nth-child(2), .brand-mark i:nth-child(3) { background: var(--ink); }
  .topbar nav { display: flex; align-items: center; gap: 30px; }
  .topbar nav button {
    border: 0;
    background: transparent;
    color: #50514c;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .03em;
    cursor: pointer;
    padding: 12px 0;
    position: relative;
  }
  .topbar nav button::after { content: ""; position: absolute; left: 0; right: 100%; bottom: 5px; height: 2px; background: var(--signal); transition: right .25s ease; }
  .topbar nav button:hover::after { right: 0; }
  .top-actions { display: flex; justify-content: flex-end; align-items: center; gap: 16px; }
  .language-switcher {
    display: flex;
    border: 1px solid var(--line);
    border-radius: 999px;
    padding: 3px;
    background: #fff;
  }
  .language-switcher button {
    border: 0;
    min-width: 38px;
    height: 30px;
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
  }
  .language-switcher button.active { color: #fff; background: var(--ink); }
  .top-cta {
    border: 1px solid var(--ink);
    background: var(--ink);
    color: #fff;
    padding: 11px 16px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    transition: transform .2s, background .2s;
  }
  .top-cta:hover { transform: translateY(-2px); background: var(--signal); border-color: var(--signal); }

  main { display: block; }
  .hero {
    width: min(1440px, calc(100% - 64px));
    min-height: 690px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1.03fr .97fr;
    align-items: center;
    gap: 70px;
    position: relative;
  }
  .hero::before {
    content: "";
    position: absolute;
    width: 380px;
    height: 380px;
    left: -230px;
    top: 30px;
    border: 1px solid var(--line);
    border-radius: 50%;
    box-shadow: 0 0 0 70px rgba(217, 219, 212, .22), 0 0 0 140px rgba(217, 219, 212, .1);
  }
  .hero-copy { position: relative; z-index: 2; padding: 70px 0; }
  .eyebrow {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--signal);
    font-size: 12px;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: .18em;
    font-weight: 800;
  }
  .eyebrow::before { content: ""; width: 24px; height: 2px; background: currentColor; }
  .hero h1 {
    max-width: 750px;
    margin-top: 26px;
    font-family: var(--display);
    font-size: clamp(58px, 6.4vw, 104px);
    font-weight: 500;
    line-height: .88;
    letter-spacing: -.055em;
  }
  .hero h1 em { display: block; color: var(--signal); font-weight: 500; }
  .hero-body {
    max-width: 570px;
    margin-top: 32px;
    color: #565852;
    font-size: 18px;
    line-height: 1.7;
  }
  .hero-actions { display: flex; align-items: center; gap: 28px; margin-top: 38px; }
  .button-primary {
    border: 0;
    background: var(--ink);
    color: #fff;
    padding: 17px 20px 17px 23px;
    min-width: 188px;
    display: flex;
    justify-content: space-between;
    gap: 26px;
    font-size: 13px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 7px 7px 0 var(--acid);
    transition: transform .2s, box-shadow .2s;
  }
  .button-primary:hover { transform: translate(3px, 3px); box-shadow: 4px 4px 0 var(--acid); }
  .button-primary span { color: var(--acid); font-size: 18px; }
  .button-link { border: 0; border-bottom: 1px solid var(--ink); background: transparent; padding: 10px 0 7px; color: var(--ink); font-size: 13px; font-weight: 800; cursor: pointer; }
  .button-link span { margin-left: 10px; color: var(--signal); }
  .hero-stats { margin-top: 62px; display: flex; gap: 0; border-top: 1px solid var(--line); max-width: 620px; }
  .hero-stats div { flex: 1; padding: 20px 24px 0 0; }
  .hero-stats div + div { border-left: 1px solid var(--line); padding-left: 24px; }
  .hero-stats strong { display: block; font-family: var(--display); font-size: 24px; font-weight: 500; }
  .hero-stats span { display: block; margin-top: 3px; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .1em; }

  .hero-visual { height: 520px; position: relative; display: grid; place-items: center; }
  .hero-visual::before {
    content: "";
    position: absolute;
    inset: 35px 20px 30px 80px;
    background: var(--soft);
    border: 1px solid var(--line);
    transform: rotate(4deg);
  }
  .city-card {
    width: min(490px, 85%);
    height: 390px;
    position: relative;
    z-index: 3;
    background: var(--ink);
    color: #fff;
    transform: rotate(-3deg);
    box-shadow: 28px 30px 70px rgba(23, 23, 20, .18);
    overflow: hidden;
  }
  .city-card::after { content: ""; position: absolute; inset: 0; opacity: .12; background-image: repeating-linear-gradient(0deg, transparent, transparent 3px, #fff 4px); pointer-events: none; }
  .city-card-head, .city-card-foot { position: relative; z-index: 2; display: flex; justify-content: space-between; padding: 22px 24px; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
  .city-card-head { border-bottom: 1px solid rgba(255,255,255,.17); }
  .city-card-head span:first-child { color: var(--acid); }
  .route-map { height: 246px; position: relative; overflow: hidden; }
  .route-map::before { content: "香港"; position: absolute; right: -10px; top: -34px; font-family: var(--display); font-size: 155px; color: rgba(255,255,255,.035); }
  .route-line { position: absolute; width: 330px; height: 128px; left: 65px; top: 48px; border: 4px solid var(--signal); border-left: 0; border-radius: 0 80px 80px 0; transform: rotate(-9deg); }
  .station { position: absolute; display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: .12em; }
  .station i { width: 13px; height: 13px; border: 3px solid var(--acid); border-radius: 50%; background: var(--ink); box-shadow: 0 0 0 3px var(--ink); }
  .station-one { left: 38px; top: 102px; }
  .station-two { left: 195px; top: 52px; }
  .station-three { right: 24px; top: 154px; }
  .pulse-ring { position: absolute; width: 78px; height: 78px; border: 1px solid rgba(217,255,67,.4); border-radius: 50%; left: 164px; top: 19px; animation: pulse 2.8s ease-out infinite; }
  .city-card-foot { align-items: flex-end; border-top: 1px solid rgba(255,255,255,.17); color: #b9bbb5; }
  .city-card-foot b { color: #fff; text-align: right; line-height: 1.45; }
  .ticket-strip { position: absolute; z-index: 5; right: -62px; bottom: 54px; width: 370px; padding: 11px; background: var(--acid); color: var(--ink); font-size: 12px; font-weight: 900; letter-spacing: .15em; transform: rotate(-38deg); white-space: nowrap; }
  .hero-orbit { position: absolute; border: 1px solid var(--signal); border-radius: 50%; z-index: 1; }
  .orbit-one { width: 82px; height: 82px; left: 12px; bottom: 12px; }
  .orbit-two { width: 32px; height: 32px; left: 37px; bottom: 37px; background: var(--signal); }
  .reveal { animation: reveal .75s cubic-bezier(.2,.8,.2,1) both; }
  .delay-one { animation-delay: .14s; }

  .arena-hero {
    width: min(1440px, calc(100% - 64px));
    min-height: 570px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 1fr 430px;
    gap: 80px;
    align-items: center;
    position: relative;
  }
  .arena-hero::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: var(--line);
  }
  .back-link {
    border: 0;
    border-bottom: 1px solid var(--ink);
    background: transparent;
    color: var(--ink);
    padding: 0 0 6px;
    margin-bottom: 48px;
    font-weight: 800;
    cursor: pointer;
  }
  .back-link span { color: var(--signal); margin-right: 8px; }
  .arena-hero h1 {
    margin-top: 22px;
    max-width: 900px;
    font-family: var(--display);
    font-size: clamp(62px, 7.5vw, 118px);
    font-weight: 500;
    line-height: .86;
    letter-spacing: -.06em;
  }
  .arena-subtitle { margin-top: 24px; color: var(--signal); font-size: 20px; font-weight: 800; }
  .arena-intro { max-width: 680px; margin-top: 18px; color: var(--muted); font-size: 16px; line-height: 1.7; }
  .arena-layout-line { display: flex; gap: 18px; align-items: center; margin-top: 32px; padding-top: 18px; border-top: 1px solid var(--line); max-width: 680px; }
  .arena-layout-line span { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
  .arena-layout-line strong { font-size: 14px; }
  .arena-index {
    height: 390px;
    position: relative;
    display: grid;
    place-items: center;
    background: var(--ink);
    color: #fff;
    overflow: hidden;
  }
  .arena-index > span { position: absolute; left: 24px; top: 14px; font-family: var(--display); font-size: 112px; color: var(--acid); line-height: 1; }
  .arena-index small { position: absolute; left: 26px; bottom: 24px; font-size: 12px; font-weight: 900; letter-spacing: .16em; }
  .arena-rings { width: 250px; height: 250px; position: relative; display: grid; place-items: center; transform: translate(70px, 35px) rotate(-12deg); }
  .arena-rings i { position: absolute; border: 2px solid rgba(255,255,255,.55); border-radius: 46% 54% 51% 49%; }
  .arena-rings i:nth-child(1) { width: 230px; height: 190px; }
  .arena-rings i:nth-child(2) { width: 170px; height: 135px; }
  .arena-rings i:nth-child(3) { width: 105px; height: 82px; }
  .arena-rings b { width: 46px; height: 46px; background: var(--signal); transform: rotate(45deg); }

  .viewer-section, .venue-section, .concert-section {
    scroll-margin-top: 24px;
    padding: 110px max(32px, calc((100vw - 1440px) / 2));
  }
  .viewer-section { background: #ecefea; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
  .section-heading { display: grid; grid-template-columns: 1fr minmax(280px, 430px); gap: 70px; align-items: end; margin-bottom: 48px; }
  .section-heading h2, .transport-intro h2, .community-copy h2 {
    margin-top: 18px;
    max-width: 820px;
    font-family: var(--display);
    font-size: clamp(42px, 5vw, 72px);
    font-weight: 500;
    line-height: .98;
    letter-spacing: -.045em;
  }
  .section-heading > p, .transport-intro > p:not(.eyebrow), .community-copy > p:not(.eyebrow) { color: var(--muted); font-size: 15px; line-height: 1.75; }
  .viewer-frame {
    min-height: 690px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 360px;
    background: #fff;
    border: 1px solid #cfd2ca;
    box-shadow: 0 30px 80px rgba(44, 51, 42, .12);
  }
  .canvas-stage { min-width: 0; min-height: 690px; position: relative; overflow: hidden; background: #f1f3ef; border-right: 1px solid #cfd2ca; }
  .portal #scene { position: absolute; inset: 0; width: 100%; height: 100%; display: block; cursor: grab; }
  :global(.portal #scene.dragging) { cursor: grabbing; }
  :global(.portal #scene.hovering) { cursor: pointer; }
  .canvas-label, .canvas-hint, .canvas-reset { position: absolute; z-index: 4; }
  .canvas-label {
    top: 20px;
    left: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 11px;
    border: 1px solid rgba(23,23,20,.15);
    background: rgba(255,253,248,.86);
    backdrop-filter: blur(8px);
    font-size: 12px;
    font-weight: 900;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .canvas-label i { width: 7px; height: 7px; background: var(--signal); border-radius: 50%; box-shadow: 0 0 0 4px rgba(239,62,47,.12); }
  .canvas-reset {
    top: 20px;
    right: 20px;
    border: 1px solid rgba(23,23,20,.15);
    background: rgba(255,253,248,.86);
    color: var(--ink);
    padding: 8px 11px;
    font-size: 12px;
    font-weight: 800;
    cursor: pointer;
    backdrop-filter: blur(8px);
  }
  .canvas-reset:hover { background: var(--ink); color: #fff; }
  .canvas-hint { left: 20px; bottom: 18px; padding: 7px 10px; background: rgba(23,23,20,.78); color: #fff; font-size: 12px; letter-spacing: .04em; }
  .viewer-panel { padding: 28px; background: var(--paper); overflow: auto; }
  .panel-kicker { color: var(--signal); font-size: 12px; text-transform: uppercase; letter-spacing: .16em; font-weight: 900; }
  .viewer-panel h3 { margin-top: 8px; font-family: var(--display); font-size: 28px; line-height: 1.05; font-weight: 500; }
  .venue-meta { margin-top: 7px; color: var(--muted); font-size: 12px; line-height: 1.5; }
  .picker-stack { display: grid; gap: 11px; margin-top: 22px; }
  .picker-stack label > span { display: block; margin-bottom: 6px; color: #777a73; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; font-weight: 800; }
  .portal .picker {
    width: 100%;
    min-width: 0;
    appearance: none;
    border: 1px solid var(--line);
    border-radius: 0;
    background: #fff linear-gradient(45deg, transparent 50%, var(--ink) 50%) calc(100% - 16px) 50% / 5px 5px no-repeat;
    color: var(--ink);
    padding: 11px 32px 11px 11px;
    font-size: 12px;
    outline: none;
  }
  .portal .picker:focus { border-color: var(--blue); }
  .model-note { margin-top: 15px; color: #777a73; font-size: 12px; line-height: 1.55; }
  .legend { display: flex; gap: 5px; margin-top: 13px; flex-wrap: wrap; }
  .portal .chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    border: 1px solid var(--line);
    border-radius: 999px;
    background: #fff;
    color: #50524d;
    padding: 4px 7px;
    font-size: 12px;
  }
  .portal .chip i { width: 7px; height: 7px; display: inline-block; border-radius: 50%; }
  .panel-rule { height: 1px; background: var(--line); margin: 22px 0; }
  .search-label { font-size: 14px; font-weight: 900; }
  .fields { display: grid; grid-template-columns: repeat(3, 1fr) 38px; gap: 6px; margin-top: 9px; }
  .fields input {
    min-width: 0;
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 0;
    background: #fff;
    color: var(--ink);
    padding: 9px 7px;
    font-size: 12px;
    outline: none;
  }
  .fields input:focus { border-color: var(--blue); }
  .search-go { border: 0; background: var(--signal); color: #fff; font-size: 18px; cursor: pointer; }
  .search-go:hover { background: var(--signal-dark); }
  .search-message { min-height: 15px; margin-top: 5px; color: var(--signal-dark); font-size: 12px; }
  .seat-card { margin-top: 14px; padding: 14px; border: 1px solid var(--line); background: #fff; }
  .seat-card.has-seat { border-color: var(--ink); box-shadow: 4px 4px 0 var(--acid); }
  .cap { color: var(--signal); font-size: 12px; text-transform: uppercase; letter-spacing: .15em; font-weight: 900; }
  .seat-name { margin-top: 5px; font-size: 14px; font-weight: 800; line-height: 1.35; }
  .seat-sub { margin-top: 3px; color: var(--muted); font-size: 12px; line-height: 1.45; }
  .portal .seat-actions { display: grid; grid-template-columns: 1fr 1fr 30px; gap: 5px; margin-top: 12px; }
  .portal button.view-seat { border: 1px solid var(--line); border-radius: 0; background: var(--soft); color: var(--ink); padding: 7px 5px; font-size: 12px; font-weight: 800; cursor: pointer; white-space: normal; }
  .portal button.view-seat:hover, .portal button.view-seat.active { border-color: var(--ink); background: var(--ink); color: #fff; }
  .portal button.clear { border: 1px solid var(--line); border-radius: 0; background: #fff; color: var(--signal); padding: 0; cursor: pointer; }
  .settings-toggle { width: 100%; margin-top: 16px; border: 0; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); background: transparent; display: flex; justify-content: space-between; padding: 10px 0; color: var(--ink); font-size: 12px; font-weight: 900; cursor: pointer; }
  .portal-settings { padding: 8px 0 3px; }
  .setting-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; color: #555750; font-size: 14px; }
  .portal .switch { position: relative; width: 32px; height: 18px; flex: 0 0 auto; }
  .portal .switch input { opacity: 0; width: 0; height: 0; }
  .portal .slider { position: absolute; inset: 0; background: #d6d8d1; border-radius: 999px; transition: .2s; cursor: pointer; }
  .portal .slider::before { content: ""; position: absolute; width: 12px; height: 12px; left: 3px; top: 3px; background: #fff; border-radius: 50%; transition: .2s; }
  .portal .switch input:checked + .slider { background: var(--signal); }
  .portal .switch input:checked + .slider::before { transform: translateX(14px); }
  .plan-link { display: flex; justify-content: space-between; margin-top: 14px; color: var(--ink); font-size: 14px; font-weight: 800; text-decoration: none; }
  .plan-link:hover { color: var(--signal); }

  .venue-section { background: var(--paper); }
  .venue-grid { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
  .venue-card { min-height: 330px; padding: 24px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); display: flex; flex-direction: column; position: relative; overflow: hidden; transition: background .25s, color .25s; }
  .venue-card:hover, .venue-card.featured { background: var(--ink); color: #fff; }
  .venue-number { font-family: var(--display); font-size: 18px; color: var(--signal); }
  .venue-graphic { position: absolute; right: 26px; top: 25px; width: 115px; height: 115px; border: 1px solid currentColor; border-radius: 50%; opacity: .18; display: grid; place-items: center; }
  .venue-graphic span { position: absolute; display: block; border: 1px solid currentColor; border-radius: 50%; }
  .venue-graphic span:nth-child(1) { width: 78px; height: 78px; }
  .venue-graphic span:nth-child(2) { width: 38px; height: 38px; background: var(--signal); border: 0; border-radius: 3px; transform: rotate(45deg); opacity: .8; }
  .venue-graphic span:nth-child(3) { width: 140px; height: 1px; border: 0; border-top: 1px dashed currentColor; transform: rotate(-35deg); }
  .venue-card-copy { margin-top: auto; max-width: 85%; }
  .venue-card-copy > p { color: var(--signal); font-size: 12px; font-weight: 900; letter-spacing: .16em; }
  .venue-card-copy h3 { margin-top: 7px; font-family: var(--display); font-size: 24px; font-weight: 500; line-height: 1.05; }
  .venue-card-copy > span { display: block; margin-top: 8px; color: var(--muted); font-size: 12px; line-height: 1.5; }
  .venue-card:hover .venue-card-copy > span, .venue-card.featured .venue-card-copy > span { color: #aaaDA6; }
  .venue-card button { margin-top: 22px; border: 0; border-top: 1px solid currentColor; background: transparent; color: inherit; padding: 11px 0 0; display: flex; justify-content: space-between; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .1em; cursor: pointer; }
  .venue-card button span { color: var(--signal); font-size: 15px; }

  .arena-guide-section, .other-arenas {
    padding: 110px max(32px, calc((100vw - 1440px) / 2));
  }
  .arena-guide-section { background: var(--acid); }
  .arena-guide-section .eyebrow { color: var(--ink); }
  .arena-guide-grid { display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid rgba(23,23,20,.4); border-left: 1px solid rgba(23,23,20,.4); }
  .arena-guide-grid article { min-height: 300px; padding: 26px; border-right: 1px solid rgba(23,23,20,.4); border-bottom: 1px solid rgba(23,23,20,.4); display: flex; flex-direction: column; }
  .arena-guide-grid article > span { font-family: var(--display); font-size: 28px; color: var(--signal-dark); }
  .arena-guide-grid h3 { margin-top: auto; font-family: var(--display); font-size: 30px; font-weight: 500; }
  .arena-guide-grid p { margin-top: 10px; color: #54564e; font-size: 14px; line-height: 1.6; }
  .arena-guide-grid b { width: fit-content; margin-top: 22px; padding: 6px 9px; border: 1px solid rgba(23,23,20,.45); font-size: 12px; text-transform: uppercase; letter-spacing: .1em; }
  .other-arenas { background: var(--paper); }

  .transport-section { display: grid; grid-template-columns: .8fr 1.2fr; gap: 90px; padding: 100px max(32px, calc((100vw - 1440px) / 2)); background: var(--acid); }
  .transport-intro h2 { font-size: clamp(40px, 4.4vw, 65px); }
  .transport-intro > p:not(.eyebrow) { margin-top: 24px; color: #4c4d45; max-width: 500px; }
  .transport-intro .eyebrow { color: var(--ink); }
  .transport-grid { border-top: 1px solid rgba(23,23,20,.35); }
  .transport-grid article { display: grid; grid-template-columns: 48px 1fr auto; gap: 20px; align-items: center; min-height: 130px; border-bottom: 1px solid rgba(23,23,20,.35); }
  .feature-icon { width: 38px; height: 38px; border: 2px solid var(--ink); border-radius: 50%; display: grid; place-items: center; font-family: var(--display); font-size: 18px; }
  .transport-grid h3 { font-size: 17px; }
  .transport-grid p { margin-top: 4px; color: #56574e; font-size: 12px; }
  .transport-grid b { padding: 5px 8px; border: 1px solid rgba(23,23,20,.4); font-size: 12px; text-transform: uppercase; letter-spacing: .1em; }

  .concert-section { background: var(--ink); color: #fff; }
  .concert-section .section-heading > p { color: #a6a8a2; }
  .concert-board { display: grid; grid-template-columns: 300px 1fr; border: 1px solid #45463f; }
  .calendar-stamp { padding: 30px; background: var(--signal); display: flex; flex-direction: column; min-height: 360px; }
  .calendar-stamp span { font-size: 12px; font-weight: 900; letter-spacing: .15em; }
  .calendar-stamp strong { margin-top: 20px; font-family: var(--display); font-size: 82px; line-height: .9; font-weight: 500; writing-mode: vertical-rl; }
  .calendar-stamp small { margin-top: auto; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
  .concert-list article { min-height: 120px; padding: 24px 28px; display: grid; grid-template-columns: 90px 1fr auto; align-items: center; border-bottom: 1px solid #45463f; }
  .concert-list article:last-child { border-bottom: 0; }
  .concert-list time { color: var(--acid); font-size: 12px; font-weight: 900; letter-spacing: .12em; }
  .concert-list h3 { font-family: var(--display); font-size: 27px; font-weight: 500; }
  .concert-list p { margin-top: 5px; color: #9c9e98; font-size: 12px; }
  .concert-list article > span { color: #64665e; font-family: var(--display); font-size: 42px; }

  .community-section { scroll-margin-top: 24px; padding: 120px max(32px, calc((100vw - 1440px) / 2)); display: grid; grid-template-columns: .8fr 1.2fr; gap: 90px; background: #f4f0ea; }
  .community-copy > p:not(.eyebrow) { margin-top: 26px; max-width: 520px; }
  .community-copy > span { display: inline-block; margin-top: 32px; padding: 8px 11px; border: 1px solid var(--ink); font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .12em; }
  .community-cards { display: grid; grid-template-columns: 1.05fr .95fr; gap: 18px; align-items: center; }
  .community-cards article { background: #fff; border: 1px solid var(--line); padding: 18px; box-shadow: 12px 12px 0 rgba(23,23,20,.07); }
  .photo-card { transform: rotate(-2deg); }
  .comment-card { transform: translateY(34px) rotate(2deg); }
  .photo-placeholder { height: 230px; background: #cfd4cc; position: relative; overflow: hidden; }
  .photo-placeholder::before { content: ""; position: absolute; width: 190px; height: 190px; border: 28px solid #a9b1a7; border-radius: 50%; left: 50%; top: 50%; transform: translate(-50%, -50%); }
  .photo-placeholder::after { content: ""; position: absolute; width: 80px; height: 55px; background: var(--signal); left: 50%; top: 50%; transform: translate(-50%, -32%) perspective(80px) rotateX(45deg); }
  .photo-placeholder span { position: absolute; z-index: 2; left: 12px; top: 12px; color: #fff; font-size: 12px; font-weight: 900; letter-spacing: .1em; }
  .photo-placeholder i { position: absolute; z-index: 2; inset: 0; background: linear-gradient(130deg, rgba(255,255,255,.3), transparent 45%); }
  .community-cards h3 { margin-top: 18px; font-family: var(--display); font-size: 25px; font-weight: 500; }
  .community-cards p { margin-top: 6px; color: var(--muted); font-size: 12px; line-height: 1.55; }
  .comment-card { padding-top: 30px !important; }
  .comment-lines { display: grid; gap: 9px; }
  .comment-lines i { height: 7px; background: #e7e8e3; }
  .comment-lines i:nth-child(2) { width: 82%; }
  .comment-lines i:nth-child(3) { width: 58%; }
  .comment-card blockquote { margin-top: 42px; font-family: var(--display); font-size: 21px; line-height: 1.35; color: var(--signal); }

  footer { min-height: 120px; padding: 34px max(32px, calc((100vw - 1440px) / 2)); display: flex; align-items: center; justify-content: space-between; gap: 30px; background: var(--paper); border-top: 1px solid var(--line); }
  .footer-brand { cursor: default; }
  footer p { color: var(--muted); font-size: 12px; }
  footer > span { color: #858780; font-size: 12px; letter-spacing: .1em; }

  .portal { font-size: 14px; }
  .portal button, .portal input, .portal select { font-size: 14px; }

  #tooltip {
    position: fixed;
    pointer-events: none;
    z-index: 50;
    background: rgba(23,23,20,.95);
    color: #fff;
    border: 1px solid var(--acid);
    border-radius: 0;
    padding: 9px 12px;
    font-size: 12px;
    line-height: 1.5;
    box-shadow: 7px 7px 0 rgba(217,255,67,.45);
    transform: translate(14px,14px);
    white-space: nowrap;
  }
  :global(#tooltip.flip-x) { transform: translate(calc(-100% - 14px), 14px); }
  :global(#tooltip.flip-y) { transform: translate(14px, calc(-100% - 14px)); }
  :global(#tooltip.flip-x.flip-y) { transform: translate(calc(-100% - 14px), calc(-100% - 14px)); }
  #tooltip b { color: var(--acid); font-size: 12px; }
  #tooltip .dim { color: #b4b6b0; }

  @keyframes reveal {
    from { opacity: 0; transform: translateY(18px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0% { transform: scale(.7); opacity: 0; }
    35% { opacity: 1; }
    100% { transform: scale(1.5); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    :global(html) { scroll-behavior: auto; }
    .reveal, .pulse-ring { animation: none; }
  }

  @media (max-width: 1100px) {
    .topbar { grid-template-columns: 1fr auto; }
    .topbar nav { display: none; }
    .hero { min-height: 640px; grid-template-columns: 1fr .8fr; gap: 30px; }
    .hero h1 { font-size: clamp(56px, 7vw, 80px); }
    .hero-visual { transform: scale(.88); transform-origin: right center; }
    .viewer-frame { grid-template-columns: minmax(0, 1fr) 330px; }
    .canvas-stage { min-height: 650px; }
    .arena-hero { grid-template-columns: 1fr 340px; gap: 40px; }
    .venue-grid { grid-template-columns: repeat(2, 1fr); }
    .transport-section, .community-section { gap: 50px; }
  }

  @media (max-width: 820px) {
    .topbar { width: calc(100% - 36px); height: 72px; }
    .top-cta { display: none; }
    .hero { width: calc(100% - 36px); grid-template-columns: 1fr; padding: 55px 0 70px; }
    .hero-copy { padding: 0; }
    .hero h1 { font-size: clamp(54px, 13vw, 84px); }
    .hero-visual { height: 470px; transform: none; }
    .arena-hero { width: calc(100% - 36px); grid-template-columns: 1fr; padding: 64px 0 72px; }
    .arena-index { height: 300px; }
    .arena-rings { transform: translate(80px, 25px) rotate(-12deg); }
    .section-heading { grid-template-columns: 1fr; gap: 20px; }
    .viewer-section, .venue-section, .concert-section, .arena-guide-section, .other-arenas { padding-top: 80px; padding-bottom: 80px; }
    .viewer-frame { grid-template-columns: 1fr; }
    .canvas-stage { min-height: 540px; border-right: 0; border-bottom: 1px solid #cfd2ca; }
    .viewer-panel { overflow: visible; }
    .arena-guide-grid { grid-template-columns: 1fr; }
    .arena-guide-grid article { min-height: 240px; }
    .transport-section, .community-section { grid-template-columns: 1fr; padding-top: 80px; padding-bottom: 80px; }
    .concert-board { grid-template-columns: 180px 1fr; }
    .calendar-stamp strong { font-size: 58px; }
    .community-cards { max-width: 650px; }
  }

  @media (max-width: 560px) {
    .brand { font-size: 12px; }
    .brand-mark { width: 23px; height: 23px; }
    .top-actions { gap: 8px; }
    .language-switcher button { min-width: 33px; }
    .hero { min-height: 0; }
    .hero h1 { font-size: clamp(49px, 15vw, 70px); }
    .hero-body { font-size: 15px; }
    .arena-hero h1 { font-size: clamp(52px, 16vw, 76px); }
    .arena-subtitle { font-size: 17px; }
    .arena-index > span { font-size: 86px; }
    .hero-actions { align-items: stretch; flex-direction: column; gap: 14px; }
    .button-primary { width: calc(100% - 7px); }
    .button-link { width: fit-content; }
    .hero-stats { margin-top: 48px; }
    .hero-stats div { padding-right: 10px; }
    .hero-stats div + div { padding-left: 10px; }
    .hero-stats strong { font-size: 18px; }
    .hero-stats span { font-size: 12px; }
    .hero-visual { height: 390px; }
    .hero-visual::before { inset: 25px 0 25px 30px; }
    .city-card { width: 92%; height: 330px; }
    .route-map { height: 188px; }
    .route-line { width: 260px; left: 35px; top: 32px; }
    .station-one { left: 20px; top: 82px; }
    .station-two { left: 140px; top: 38px; }
    .station-three { right: 10px; top: 122px; }
    .city-card-foot { font-size: 12px; }
    .ticket-strip { right: -90px; bottom: 26px; }
    .section-heading h2, .transport-intro h2, .community-copy h2 { font-size: 41px; }
    .viewer-section, .venue-section, .concert-section, .transport-section, .community-section, .arena-guide-section, .other-arenas { padding-left: 18px; padding-right: 18px; }
    .canvas-stage { min-height: 430px; }
    .canvas-hint { display: none; }
    .canvas-label { top: 12px; left: 12px; }
    .canvas-reset { top: 12px; right: 12px; }
    .viewer-panel { padding: 22px 18px; }
    .venue-grid { grid-template-columns: 1fr; }
    .venue-card { min-height: 285px; }
    .transport-grid article { grid-template-columns: 42px 1fr; padding: 16px 0; }
    .transport-grid b { grid-column: 2; width: fit-content; }
    .concert-board { grid-template-columns: 1fr; }
    .calendar-stamp { min-height: auto; display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 8px; }
    .calendar-stamp strong { writing-mode: initial; grid-row: 1 / 3; grid-column: 2; }
    .calendar-stamp small { margin-top: 0; }
    .concert-list article { grid-template-columns: 55px 1fr auto; padding: 20px 16px; }
    .concert-list h3 { font-size: 21px; }
    .concert-list article > span { font-size: 28px; }
    .community-cards { grid-template-columns: 1fr; }
    .comment-card { transform: rotate(1deg); }
    footer { align-items: flex-start; flex-direction: column; }
  }
</style>
