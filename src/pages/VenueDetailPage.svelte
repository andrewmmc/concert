<script>
  import VenueGrid from '../components/VenueGrid.svelte';
  import { getVenueText, translate } from '../lib/i18n.js';

  let { locale, venue, venues, onNavigate, onSelectVenue, onOpenViewer } = $props();
  const t = (key) => translate(locale, key);
  let text = $derived(getVenueText(locale, venue));
  let venueNumber = $derived(venues.findIndex((item) => item.id === venue.id) + 1);
  let otherVenues = $derived(venues.filter((item) => item.id !== venue.id).slice(0, 3));
</script>

<section class="arena-hero">
  <div class="arena-hero-copy reveal">
    <button class="back-link" onclick={() => onNavigate('venues')}><span aria-hidden="true">←</span> {t('navVenues')}</button>
    <p class="eyebrow">{t('arenaPageEyebrow')} / {venue.id.toUpperCase()}</p>
    <h1>{text.name}</h1>
    <p class="arena-subtitle">{text.subtitle}</p>
    <p class="arena-intro">{text.dims}</p>
    <button class="button-primary venue-viewer-button" onclick={() => onOpenViewer(venue)}>{t('openDedicatedViewer')} <span aria-hidden="true">↗</span></button>
  </div>
  <div class="arena-index reveal delay-one" aria-hidden="true">
    <span>{venueNumber}</span>
    <div class="arena-rings"><i></i><i></i><i></i><b></b></div>
    <small>{venue.id.toUpperCase()} / 852</small>
  </div>
</section>

<section class="venue-detail-section">
  <div class="detail-grid">
    <article><span>01</span><h2>{t('openingHours')}</h2><strong>{t('openingHoursValue')}</strong><p>{t('openingHoursBody')}</p></article>
    <article><span>02</span><h2>{t('arenaTransportTitle')}</h2><p>{t('arenaTransportBody')}</p></article>
    <article><span>03</span><h2>{t('venueFacilities')}</h2><p>{t('venueFacilitiesBody')}</p></article>
    <article><span>04</span><h2>{t('venueUpcoming')}</h2><p>{t('venueUpcomingBody')}</p><b>{t('dateTba')}</b></article>
    <article><span>05</span><h2>{t('venueComments')}</h2><p>{t('venueCommentsBody')}</p><blockquote>“{t('localCommentsBody')}”</blockquote></article>
    <article class="viewer-callout"><span>3D</span><h2>{t('viewerTitle')}</h2><p>{t('viewerBody')}</p><button onclick={() => onOpenViewer(venue)}>{t('openDedicatedViewer')} →</button></article>
  </div>
</section>

<section class="other-arenas">
  <div class="section-heading"><div><p class="eyebrow">{t('venueDirectoryEyebrow')}</p><h2>{t('exploreOtherArenas')}</h2></div></div>
  <VenueGrid venues={otherVenues} {locale} onSelect={onSelectVenue} compact />
</section>
