<script>
  import VenueGrid from '../components/VenueGrid.svelte';
  import { translate } from '../lib/i18n.js';

  let { locale, venues, onSelectVenue } = $props();
  const t = (key) => translate(locale, key);
</script>

<section class="page-hero venues-hero">
  <p class="eyebrow">{t('venueDirectoryEyebrow')}</p>
  <h1>{t('venueIndexTitle')}</h1>
  <p>{t('venueIndexBody')}</p>
</section>

<section class="venue-directory-page">
  <VenueGrid {venues} {locale} onSelect={onSelectVenue} featuredFirst />
</section>
