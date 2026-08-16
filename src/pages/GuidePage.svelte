<script>
  import { translate } from '../lib/i18n.js';

  let { locale } = $props();
  const t = (key) => translate(locale, key);
</script>

<section class="page-hero guide-hero">
  <p class="eyebrow">{t('guidePageEyebrow')}</p>
  <h1>{t('guidePageTitle')}</h1>
  <p>{t('guidePageBody')}</p>
</section>

<section class="guide-grid">
  <article><span>01</span><h2>{t('guideTicketTitle')}</h2><p>{t('guideTicketBody')}</p></article>
  <article><span>02</span><h2>{t('guideArrivalTitle')}</h2><p>{t('guideArrivalBody')}</p></article>
  <article><span>03</span><h2>{t('guideInsideTitle')}</h2><p>{t('guideInsideBody')}</p></article>
  <article><span>04</span><h2>{t('guideAfterTitle')}</h2><p>{t('guideAfterBody')}</p></article>
  <article><span>05</span><h2>{t('guideAccessibilityTitle')}</h2><p>{t('guideAccessibilityBody')}</p></article>
</section>
