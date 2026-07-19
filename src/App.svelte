<script>
  import { onMount } from 'svelte';
  import { createScene, HOVER, PIN } from './scene.js';
  import { venues } from './venues/index.js';
  import { parseHash, goTo, onRoute } from './lib/router.js';

  const siteName = 'Hong Kong Concert Seats View';

  let route = $state(parseHash());
  let venue = $derived(route.venue);
  let layout = $derived(route.layout);

  let canvas;
  let autoRotate = $state(false);
  let showRoof = $state(true);
  let showLabels = $state(true);
  let settingsOpen = $state(false);
  let inSec = $state(''), inRow = $state(''), inSeat = $state('');
  let searchMsg = $state('');
  let seatMain = $state('— no seat selected —');
  let seatSub = $state('Click a seat to select it');
  let pinned = $state(false);
  let tooltip = $state({ show: false, x: 0, y: 0, main: '', sub: '' });

  let engine, model, controlsRef, cameraRef;
  let hoveredId = -1, pinnedId = -1;
  let paintFn, restoreFn, pickFn, flyFn;

  onMount(() => {
    route = parseHash();
    const off = onRoute((r) => { route = r; });
    return off;
  });

  onMount(() => {
    engine = createScene(canvas);
    const { scene, camera, controls, flyTo } = engine;
    controlsRef = controls; cameraRef = camera;
    model = venue.build({ scene }, { layout: layout?.id });
    const { placements, seats, baseColors, seatIndex, wpMeshes, stage, roofGroup, labelGroup, describe } = model;

    const raycaster = new engine.THREE.Raycaster();
    const mouseNDC = new engine.THREE.Vector2();
    let mouseDirty = false;

    const setColor = (i, color) => { if (i < 0) return; seats.setColorAt(i, color); seats.instanceColor.needsUpdate = true; };
    const base = (i) => new engine.THREE.Color(baseColors[i * 3], baseColors[i * 3 + 1], baseColors[i * 3 + 2]);
    paintFn = setColor;
    restoreFn = (i) => { if (i < 0 || i === pinnedId) return; setColor(i, base(i)); };

    function showInfo(p) { const d = describe(p); seatMain = d.main; seatSub = d.sub; }
    function clearInfo() { seatMain = '— no seat selected —'; seatSub = 'Click a seat to select it'; }

    function clearPin() {
      // clear every highlighted seat (pinned + hovered)
      const hover = hoveredId; hoveredId = -1;
      if (hover >= 0) setColor(hover, base(hover));
      tooltip = { ...tooltip, show: false };
      if (pinnedId >= 0) {
        const i = pinnedId; pinnedId = -1;
        setColor(i, base(i));
      }
      pinned = false; clearInfo();
    }

    function selectSeat(i) {
      const previousPinnedId = pinnedId;
      pinnedId = i;
      restoreFn(previousPinnedId);
      setColor(i, PIN);
      const p = placements[i];
      showInfo(p);
      pinned = true;
      const target = new engine.THREE.Vector3(p.x, p.y + 0.5, p.z);
      const camPos = new engine.THREE.Vector3(p.x * 0.45, p.y + 15, p.z * 0.45);
      flyTo(target, camPos);
    }

    function onMove(e) {
      mouseNDC.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
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
        tooltip = { show: true, x: tooltip.x, y: tooltip.y, main: 'Centre Stage 中央舞台', sub: 'Performance area' };
        canvas.classList.add('hovering'); return;
      }
      if (hit.object.userData.wp) {
        if (hoveredId >= 0) { restoreFn(hoveredId); hoveredId = -1; }
        tooltip = { show: true, x: tooltip.x, y: tooltip.y, main: `Wheelchair Platform WP${hit.object.userData.wp}`, sub: 'Promenade · rows 14–15 · wheelchair patron + minder' };
        canvas.classList.add('hovering'); return;
      }
      const id = hit.instanceId;
      if (id !== hoveredId) {
        restoreFn(hoveredId); hoveredId = id;
        setColor(hoveredId, HOVER);
        const p = placements[hoveredId], d = describe(p);
        tooltip = { show: true, x: tooltip.x, y: tooltip.y, main: d.main, sub: d.sub };
        canvas.classList.add('hovering');
      }
    };

    flyFn = (target, camPos) => flyTo(target, camPos);

    // toggles
    $effect(() => { controls.autoRotate = autoRotate; });
    $effect(() => { roofGroup.visible = showRoof; });
    $effect(() => { labelGroup.visible = showLabels; });

    // search
    window.__goSeat = () => {
      const i = seatIndex.get(`${+inSec}-${+inRow}-${+inSeat}`);
      if (i === undefined) { searchMsg = 'Seat not found — check Sec / Row / Seat.'; return; }
      searchMsg = '';
      selectSeat(i);
    };
    window.__clearPin = clearPin;

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
    };
  });

  function goSeat() { window.__goSeat && window.__goSeat(); }
  function unselect() {
    window.__clearPin && window.__clearPin();
    resetCamera();
  }
  function resetCamera() {
    if (!engine || !flyFn) return;
    flyFn(
      new engine.THREE.Vector3(0, 4, 0),
      new engine.THREE.Vector3(76, 58, 76)
    );
  }
  function onKey(e) { if (e.key === 'Enter') goSeat(); }
  function selectVenue(e) { goTo(e.currentTarget.value, layout?.id); }
  function selectLayout(e) { goTo(venue.id, e.currentTarget.value); }
</script>

<canvas bind:this={canvas} id="scene" class:dragging={false}></canvas>

<div id="header" class="card">
  <div class="site">{siteName}</div>
  <h1><span class="zh">{venue.zh}</span> {venue.name}</h1>

  <div class="pickers">
    <select class="picker" value={venue.id} onchange={selectVenue} aria-label="Venue">
      {#each venues as v}
        <option value={v.id} selected={v.id === venue.id}>{v.zh} {v.name}</option>
      {/each}
    </select>
    {#if venue.layouts && venue.layouts.length}
      <select class="picker" value={layout?.id} onchange={selectLayout} aria-label="Seating layout">
        {#each venue.layouts as l}
          <option value={l.id} selected={l.id === layout?.id} disabled={l.comingSoon}>
            {l.label} {l.zh}{l.comingSoon ? ' (coming soon)' : ''}
          </option>
        {/each}
      </select>
    {/if}
  </div>

  <p>Interactive 3D seating model — <b>{layout ? `${layout.label} ${layout.zh}` : venue.subtitle}</b>.<br>{venue.dims}.<br>
     Hover any seat for its <b>section · row · seat number</b> (rows 1–39, seats 81–98).</p>

  {#if layout?.planUrl || venue.planUrl}
    <a class="plan" href={layout?.planUrl || venue.planUrl} target="_blank" rel="noopener noreferrer">
      📄 Official seating plan (PDF) ↗
    </a>
  {/if}

  <div id="legend">
    {#each venue.sides as s}
      <span class="chip"><i style="background:{s.color}"></i>{s.name.replace(' (', ' ').replace('s)', 's').replace('Gate (', 'Gate ')}</span>
    {/each}
  </div>
</div>

<button
  id="settings-button"
  class="card"
  class:active={settingsOpen}
  onclick={() => settingsOpen = !settingsOpen}
  aria-label="Settings"
  aria-expanded={settingsOpen}
  aria-controls="settings"
  title="Settings"
>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"></path>
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.09A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.12.38.33.72.6 1 .3.3.68.5 1.1.4h.09v4h-.09a1.7 1.7 0 0 0-1.7.6Z"></path>
  </svg>
</button>

{#if settingsOpen}
  <div id="settings" class="card">
    <div class="settings-title">Settings</div>
    <div class="row"><span>Auto-rotate</span>
      <label class="switch"><input type="checkbox" bind:checked={autoRotate}><span class="slider"></span></label></div>
    <div class="row"><span>Roof shell (inverted pyramid)</span>
      <label class="switch"><input type="checkbox" bind:checked={showRoof}><span class="slider"></span></label></div>
    <div class="row"><span>Side labels</span>
      <label class="switch"><input type="checkbox" bind:checked={showLabels}><span class="slider"></span></label></div>
  </div>
{/if}

<div id="search" class="card">
  <div class="search-label">Find a seat</div>
  <div class="search-content">
    <div class="fields">
      <input value={inSec}  oninput={e => inSec  = e.currentTarget.value} onkeydown={onKey} type="text" inputmode="numeric" placeholder="Sec"  maxlength="2" aria-label="Section">
      <input value={inRow}  oninput={e => inRow  = e.currentTarget.value} onkeydown={onKey} type="text" inputmode="numeric" placeholder="Row"  maxlength="2" aria-label="Row">
      <input value={inSeat} oninput={e => inSeat = e.currentTarget.value} onkeydown={onKey} type="text" inputmode="numeric" placeholder="Seat" maxlength="2" aria-label="Seat">
    </div>
    <button class="go" onclick={goSeat}>Go to seat</button>
  </div>
  <div id="searchmsg">{searchMsg}</div>
</div>

<div id="info" class="card">
  <div class="cap">Seat</div>
  <div class="seat">{seatMain}</div>
  <div class="sub">{seatSub}</div>
  {#if pinned}
    <button class="clear" onclick={unselect}>✕ Unselect seat</button>
  {/if}
</div>

<div id="hint" class="card">Drag · orbit&nbsp;&nbsp;|&nbsp;&nbsp;Scroll · zoom&nbsp;&nbsp;|&nbsp;&nbsp;Right-drag · pan</div>
<button id="reset-camera" class="card" onclick={resetCamera} aria-label="Reset camera position" title="Reset camera position">
  <span aria-hidden="true">↺</span> Reset view
</button>

{#if tooltip.show}
  <div id="tooltip" style="left:{tooltip.x}px;top:{tooltip.y}px">
    <b>{tooltip.main}</b>{#if tooltip.sub}<br><span class="dim">{tooltip.sub}</span>{/if}
  </div>
{/if}

<style>
  :global(*) { box-sizing: border-box; margin: 0; padding: 0; }
  :global(html, body) { width: 100%; height: 100%; overflow: hidden; background: #05070c;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang HK", "Microsoft YaHei", sans-serif;
    color: #dbe6f5; }
  :global(#app) { width: 100%; height: 100%; }

  #scene { position: fixed; inset: 0; display: block; cursor: grab; }
  :global(#scene.hovering) { cursor: pointer; }
  #scene.dragging { cursor: grabbing; }

  .card { position: fixed; background: rgba(13,18,28,.86); border: 1px solid rgba(120,150,200,.22);
    border-radius: 12px; backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    box-shadow: 0 8px 30px rgba(0,0,0,.45); z-index: 10; }

  #header { top: 16px; left: 16px; padding: 12px 16px; max-width: 350px; }
  #header .site { font-size: 10.5px; color: #7d8ca3; text-transform: uppercase; letter-spacing: 1.2px; margin-bottom: 4px; }
  #header h1 { font-size: 17px; font-weight: 700; letter-spacing: .3px; }
  #header h1 .zh { color: #ffd34d; }
  .pickers { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
  .picker { flex: 1; min-width: 0; background: #0b1120; border: 1px solid rgba(120,150,200,.22); color: #dbe6f5;
    border-radius: 7px; padding: 6px 7px; font-size: 12px; outline: none; }
  .picker:focus { border-color: #2f6fed; }
  a.plan { display: inline-block; margin-top: 8px; font-size: 12px; color: #ffd34d; text-decoration: none;
    border-bottom: 1px dashed rgba(255,211,77,.4); padding-bottom: 1px; }
  a.plan:hover { color: #ffe14d; border-bottom-color: #ffe14d; }
  #header p { font-size: 11.5px; color: #7d8ca3; margin-top: 4px; line-height: 1.45; }
  #legend { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
  .chip { display: flex; align-items: center; gap: 6px; font-size: 11px; color: #dbe6f5;
    padding: 3px 8px; border: 1px solid rgba(120,150,200,.22); border-radius: 999px; background: rgba(255,255,255,.03); }
  .chip i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }

  #settings-button { top: 16px; right: 16px; width: 42px; height: 42px; padding: 10px; color: #9fb2d0;
    cursor: pointer; transition: color .2s, border-color .2s, background .2s; }
  #settings-button:hover, #settings-button.active { color: #fff; border-color: rgba(47,111,237,.8); background: rgba(32,49,82,.92); }
  #settings-button svg { display: block; width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.7;
    stroke-linecap: round; stroke-linejoin: round; }
  #settings { top: 68px; right: 16px; padding: 12px 14px; width: 228px; }
  #settings .settings-title { color: #fff; font-size: 13px; font-weight: 700; margin-bottom: 5px; }
  #settings .row { display: flex; align-items: center; justify-content: space-between; font-size: 12px; padding: 5px 0; }
  .switch { position: relative; width: 34px; height: 19px; flex: 0 0 auto; }
  .switch input { opacity: 0; width: 0; height: 0; }
  .slider { position: absolute; inset: 0; background: #26314a; border-radius: 999px; transition: .2s; cursor: pointer; }
  .slider:before { content: ""; position: absolute; width: 13px; height: 13px; left: 3px; top: 3px; background: #9fb2d0; border-radius: 50%; transition: .2s; }
  .switch input:checked + .slider { background: #2f6fed; }
  .switch input:checked + .slider:before { transform: translateX(15px); background: #fff; }
  #search { left: 50%; bottom: 16px; transform: translateX(-50%); width: min(420px, calc(100vw - 32px)); padding: 11px 13px; }
  #search .search-label { font-size: 15px; font-weight: 600; color: #dbe6f5; margin-bottom: 8px; }
  #search .search-content { display: flex; gap: 7px; }
  #search .fields { display: flex; gap: 6px; }
  #search input { width: 68px; background: #0b1120; border: 1px solid rgba(120,150,200,.22); color: #dbe6f5;
    border-radius: 7px; padding: 7px; font-size: 14px; outline: none; }
  #search input:focus { border-color: #2f6fed; }
  button.go { flex: 1; white-space: nowrap; background: #2f6fed; border: none; color: #fff; font-size: 14px; font-weight: 600; padding: 7px 12px; border-radius: 7px; cursor: pointer; }
  button.go:hover { background: #3d7dff; }
  #searchmsg { font-size: 13px; color: #ff8a8a; margin-top: 5px; min-height: 0; }
  #searchmsg:not(:empty) { min-height: 13px; }

  #info { left: 16px; bottom: 16px; padding: 12px 16px; min-width: 230px; }
  #info .cap { font-size: 10.5px; color: #7d8ca3; text-transform: uppercase; letter-spacing: 1px; }
  #info .seat { font-size: 19px; font-weight: 700; margin-top: 3px; }
  #info .sub { font-size: 12px; color: #7d8ca3; margin-top: 3px; }
  button.clear { margin-top: 9px; width: 100%; background: rgba(34,211,238,.14); border: 1px solid rgba(34,211,238,.5);
    color: #22d3ee; font-size: 12px; font-weight: 600; padding: 6px 0; border-radius: 7px; cursor: pointer; }
  button.clear:hover { background: rgba(34,211,238,.28); }

  #hint { right: 16px; bottom: 62px; padding: 8px 12px; font-size: 11px; color: #7d8ca3; }
  #reset-camera { right: 16px; bottom: 16px; padding: 9px 13px; color: #dbe6f5; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: color .2s, border-color .2s, background .2s; }
  #reset-camera span { display: inline-block; margin-right: 4px; font-size: 17px; line-height: 10px; vertical-align: -1px; }
  #reset-camera:hover { color: #fff; border-color: rgba(47,111,237,.8); background: rgba(32,49,82,.92); }

  #tooltip { position: fixed; pointer-events: none; z-index: 20; background: rgba(8,12,20,.94);
    border: 1px solid rgba(255,211,77,.5); border-radius: 9px; padding: 8px 11px; font-size: 12px; line-height: 1.5;
    box-shadow: 0 6px 22px rgba(0,0,0,.5); transform: translate(14px,14px); white-space: nowrap; }
  #tooltip b { color: #ffd34d; font-size: 13px; }
  #tooltip .dim { color: #7d8ca3; }

  @media (max-width: 760px) {
    #header { max-width: 250px; }
    #hint { display: none; }
    #info { bottom: 112px; }
    #reset-camera { bottom: 112px; }
  }

  @media (max-width: 460px) {
    #search .search-content { display: block; }
    #search .fields { width: 100%; }
    #search input { flex: 1; min-width: 0; }
    button.go { width: 100%; margin-top: 7px; }
    #info { bottom: 145px; }
    #reset-camera { bottom: 145px; }
  }
</style>
