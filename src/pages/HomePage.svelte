<script>
  import VenueGrid from '../components/VenueGrid.svelte';
  import { translate } from '../lib/i18n.js';

  let { locale, venues, onNavigate, onSelectVenue } = $props();
  const t = (key) => translate(locale, key);
</script>

<section class="hero">
  <div class="hero-copy reveal">
    <p class="eyebrow">{t('portalEyebrow')}</p>
    <h1>{t('heroTitle')} <em>{t('heroTitleAccent')}</em></h1>
    <p class="hero-body">{t('heroBody')}</p>
    <div class="hero-actions">
      <button class="button-primary" onclick={() => onNavigate('guide')}>
        {t('beforeYouGo')} <span aria-hidden="true">↘</span>
      </button>
      <button class="button-link" onclick={() => onNavigate('concerts')}>
        {t('seeAllConcerts')} <span aria-hidden="true">→</span>
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
      <div class="city-card-head"><span>{t('tonightInHongKong')}</span><span>20:15 HKT</span></div>
      <div class="route-map">
        <div class="route-line"></div>
        <span class="station station-one"><i></i>HUNG HOM</span>
        <span class="station station-two"><i></i>KAI TAK</span>
        <span class="station station-three"><i></i>ASIAWORLD</span>
        <div class="pulse-ring"></div>
      </div>
      <div class="city-card-foot"><span>{t('cityNote')}</span><b>22°19'N<br>114°10'E</b></div>
    </div>
    <div class="ticket-strip">LIVE / PLAN / GO / 852 / LIVE / PLAN / GO</div>
    <div class="hero-orbit orbit-one"></div><div class="hero-orbit orbit-two"></div>
  </div>
</section>

<section class="portal-paths">
  <div class="section-heading">
    <div><p class="eyebrow">{t('homePathEyebrow')}</p><h2>{t('homePathTitle')}</h2></div>
    <p>{t('homePathBody')}</p>
  </div>
  <div class="path-grid">
    <article><span>01</span><h3>{t('beforeYouGo')}</h3><p>{t('beforeYouGoBody')}</p><button onclick={() => onNavigate('guide')}>{t('openPage')} ↗</button></article>
    <article><span>02</span><h3>{t('seeAllConcerts')}</h3><p>{t('seeAllConcertsBody')}</p><button onclick={() => onNavigate('concerts')}>{t('openPage')} ↗</button></article>
    <article><span>03</span><h3>{t('compareVenues')}</h3><p>{t('compareVenuesBody')}</p><button onclick={() => onNavigate('venues')}>{t('openPage')} ↗</button></article>
  </div>
</section>

<section class="home-venue-preview">
  <div class="section-heading">
    <div><p class="eyebrow">{t('venueDirectoryEyebrow')}</p><h2>{t('venueDirectoryTitle')}</h2></div>
    <p>{t('venueDirectoryBody')}</p>
  </div>
  <VenueGrid venues={venues.slice(0, 3)} {locale} onSelect={onSelectVenue} featuredFirst compact />
  <button class="wide-link" onclick={() => onNavigate('venues')}>{t('compareVenues')} <span>→</span></button>
</section>
