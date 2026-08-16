import {
  ENGLISH,
  TRADITIONAL_CHINESE,
  initialLocale,
  saveLocale,
  translate,
  updateDocumentLocale,
} from '../lib/i18n.js';

let activeLocale = ENGLISH;
let initialized = false;

function storage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function localizedDataValue(element, locale) {
  return locale === TRADITIONAL_CHINESE ? element.dataset.zhHk : element.dataset.en;
}

function initialDocumentLocale() {
  const locale = document.documentElement.dataset.initialLocale;
  return locale === ENGLISH || locale === TRADITIONAL_CHINESE ? locale : undefined;
}

function revealLocalizedDocument() {
  document.documentElement.classList.remove('locale-pending');
  delete document.documentElement.dataset.initialLocale;
}

function updateLocalizedContent(locale) {
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = translate(locale, element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', translate(locale, element.dataset.i18nAriaLabel));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.setAttribute('placeholder', translate(locale, element.dataset.i18nPlaceholder));
  });
  document.querySelectorAll('[data-en][data-zh-hk]').forEach((element) => {
    element.textContent = localizedDataValue(element, locale);
  });
  document.querySelectorAll('[data-locale]').forEach((button) => {
    const selected = button.dataset.locale === locale;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  updateDocumentLocale(locale);
  document.title = (locale === TRADITIONAL_CHINESE
    ? document.body.dataset.titleZhHk
    : document.body.dataset.titleEn) || translate(locale, 'siteName');
}

export function getActiveLocale() {
  return activeLocale;
}

export function setLocale(locale) {
  activeLocale = locale === TRADITIONAL_CHINESE ? TRADITIONAL_CHINESE : ENGLISH;
  saveLocale(activeLocale, storage());
  updateLocalizedContent(activeLocale);
  dispatchEvent(new CustomEvent('concert:locale', { detail: activeLocale }));
}

export function initializeLocale() {
  if (initialized) {
    revealLocalizedDocument();
    return;
  }
  initialized = true;
  activeLocale = initialDocumentLocale() || initialLocale({
    storage: storage(),
    languages: navigator.languages || [navigator.language],
  });
  document.querySelectorAll('[data-locale]').forEach((button) => {
    button.addEventListener('click', () => setLocale(button.dataset.locale));
  });
  try {
    updateLocalizedContent(activeLocale);
  } finally {
    revealLocalizedDocument();
  }
  dispatchEvent(new CustomEvent('concert:locale', { detail: activeLocale }));
}
