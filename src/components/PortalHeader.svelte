<script>
  import { ENGLISH, TRADITIONAL_CHINESE, translate } from '../lib/i18n.js';

  let { locale, page, onNavigate, onLocaleChange } = $props();
  const t = (key) => translate(locale, key);
</script>

<header class="topbar">
  <button class="brand" onclick={() => onNavigate('home')} aria-label={t('siteName')}>
    <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
    <span>{t('shortBrand')}</span>
  </button>

  <nav aria-label={t('navLabel')}>
    <button class:active={page === 'home'} onclick={() => onNavigate('home')}>{t('navHome')}</button>
    <button class:active={page === 'guide'} onclick={() => onNavigate('guide')}>{t('navGuide')}</button>
    <button class:active={page === 'concerts'} onclick={() => onNavigate('concerts')}>{t('navConcerts')}</button>
    <button class:active={page === 'venues' || page === 'venue'} onclick={() => onNavigate('venues')}>{t('navVenues')}</button>
  </nav>

  <div class="top-actions">
    <div class="language-switcher" role="group" aria-label={t('language')}>
      <button
        class:active={locale === TRADITIONAL_CHINESE}
        onclick={() => onLocaleChange(TRADITIONAL_CHINESE)}
        aria-label={t('traditionalChinese')}
        aria-pressed={locale === TRADITIONAL_CHINESE}
      >繁</button>
      <button
        class:active={locale === ENGLISH}
        onclick={() => onLocaleChange(ENGLISH)}
        aria-label={t('english')}
        aria-pressed={locale === ENGLISH}
      >EN</button>
    </div>
    <button class="top-cta" onclick={() => onNavigate('concerts')}>{t('navConcerts')}</button>
  </div>
</header>
