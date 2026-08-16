<script>
  import { translate } from '../lib/i18n.js';

  let { locale } = $props();
  const t = (key) => translate(locale, key);
</script>

<footer>
  <div class="brand footer-brand">
    <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
    <span>{t('shortBrand')}</span>
  </div>
  <p>{t('footerLine')}</p>
  <span>© 2026 / 22°19'N 114°10'E</span>
</footer>
