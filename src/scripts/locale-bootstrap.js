(() => {
  const english = 'en';
  const traditionalChinese = 'zh-HK';
  let savedLocale;

  try {
    savedLocale = globalThis.localStorage?.getItem('concert-locale');
  } catch {
    savedLocale = undefined;
  }

  const languages = navigator.languages || [navigator.language];
  const prefersTraditionalChinese = languages.some((language) => {
    const tag = String(language || '');
    return /(?:^|-)HK(?:-|$)/i.test(tag) ||
      /^zh-(?:Hant|TW|MO)(?:-|$)/i.test(tag);
  });
  const locale = savedLocale === english || savedLocale === traditionalChinese
    ? savedLocale
    : prefersTraditionalChinese ? traditionalChinese : english;
  const root = document.documentElement;

  root.lang = locale;
  root.dataset.initialLocale = locale;

  if (locale === traditionalChinese) {
    root.classList.add('locale-pending');
    setTimeout(() => root.classList.remove('locale-pending'), 3000);
  }
})();
