<script>
  import { translate } from '../lib/i18n.js';

  let { locale } = $props();
  const t = (key) => translate(locale, key);
</script>

<section class="page-hero concerts-hero">
  <p class="eyebrow">{t('concertPageEyebrow')}</p>
  <h1>{t('concertPageTitle')}</h1>
  <p>{t('concertPageBody')}</p>
</section>

<section class="concert-section standalone-concerts">
  <div class="concert-board">
    <div class="calendar-stamp"><span>AUG — DEC</span><strong>2026</strong><small>{t('calendarPreview')}</small></div>
    <div class="concert-list">
      <article><time>TBA</time><div><h3>{t('concertOne')}</h3><p>{t('concertOneMeta')}</p></div><span>01</span></article>
      <article><time>TBA</time><div><h3>{t('concertTwo')}</h3><p>{t('concertTwoMeta')}</p></div><span>02</span></article>
      <article><time>TBA</time><div><h3>{t('concertThree')}</h3><p>{t('concertThreeMeta')}</p></div><span>03</span></article>
    </div>
  </div>
</section>
