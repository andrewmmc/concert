<script>
  import { getVenueText, translate } from '../lib/i18n.js';

  let {
    venues,
    locale,
    onSelect,
    featuredFirst = false,
    compact = false,
  } = $props();

  const t = (key) => translate(locale, key);
</script>

<div class="venue-grid" class:compact-grid={compact}>
  {#each venues as venue, index}
    <article class="venue-card" class:featured={featuredFirst && index === 0}>
      <div class="venue-number">0{index + 1}</div>
      <div class="venue-graphic" aria-hidden="true"><span></span><span></span><span></span></div>
      <div class="venue-card-copy">
        <p>{venue.id.toUpperCase()}</p>
        <h3>{getVenueText(locale, venue).name}</h3>
        <span>{getVenueText(locale, venue).subtitle}</span>
      </div>
      <button onclick={() => onSelect(venue)} aria-label={`${t('venueDetails')}: ${getVenueText(locale, venue).name}`}>
        {t('venueDetails')} <span aria-hidden="true">↗</span>
      </button>
    </article>
  {/each}
</div>
