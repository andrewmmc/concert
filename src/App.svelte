<script>
  import { onMount } from 'svelte';
  import PortalFooter from './components/PortalFooter.svelte';
  import PortalHeader from './components/PortalHeader.svelte';
  import ConcertsPage from './pages/ConcertsPage.svelte';
  import GuidePage from './pages/GuidePage.svelte';
  import HomePage from './pages/HomePage.svelte';
  import VenueDetailPage from './pages/VenueDetailPage.svelte';
  import VenuesPage from './pages/VenuesPage.svelte';
  import ViewerPage from './pages/ViewerPage.svelte';
  import { getVenueText, initialLocale, saveLocale, translate, updateDocumentLocale } from './lib/i18n.js';
  import { goTo, goToPage, goToVenue, onRoute, parseHash } from './lib/router.js';
  import { venues } from './venues/index.js';

  function browserStorage() {
    try {
      return globalThis.localStorage;
    } catch {
      return undefined;
    }
  }

  const storage = browserStorage();
  const startingLocale = initialLocale({
    storage,
    languages: globalThis.navigator?.languages || [globalThis.navigator?.language],
  });

  let route = $state(parseHash());
  let locale = $state(startingLocale);

  $effect(() => {
    updateDocumentLocale(locale);
    document.documentElement.classList.toggle('viewer-open', route.page === 'viewer');
    if (route.page === 'venue' || route.page === 'viewer') {
      document.title = `${getVenueText(locale, route.venue, route.layout).name} — ${translate(locale, 'siteName')}`;
    }
  });

  onMount(() => {
    route = parseHash();
    return onRoute((nextRoute) => {
      route = nextRoute;
    });
  });

  function navigate(page) {
    goToPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function selectVenue(venue) {
    goToVenue(venue.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openViewer(venue = route.venue) {
    goTo(venue.id, venue.defaultLayout);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function changeLocale(nextLocale) {
    if (locale === nextLocale) return;
    locale = nextLocale;
    saveLocale(locale, storage);
  }
</script>

<svelte:body class:viewer-open={route.page === 'viewer'} />

<div class="portal" id="top">
  {#if route.page !== 'viewer'}
    <PortalHeader
      {locale}
      page={route.page}
      onNavigate={navigate}
      onLocaleChange={changeLocale}
    />
  {/if}

  <main class:viewer-main={route.page === 'viewer'}>
    {#if route.page === 'home'}
      <HomePage {locale} {venues} onNavigate={navigate} onSelectVenue={selectVenue} />
    {:else if route.page === 'guide'}
      <GuidePage {locale} />
    {:else if route.page === 'concerts'}
      <ConcertsPage {locale} />
    {:else if route.page === 'venues'}
      <VenuesPage {locale} {venues} onSelectVenue={selectVenue} />
    {:else if route.page === 'venue'}
      <VenueDetailPage
        {locale}
        venue={route.venue}
        {venues}
        onNavigate={navigate}
        onSelectVenue={selectVenue}
        onOpenViewer={openViewer}
      />
    {:else if route.page === 'viewer'}
      <ViewerPage
        {locale}
        venue={route.venue}
        layout={route.layout}
        onLocaleChange={changeLocale}
      />
    {/if}
  </main>

  {#if route.page !== 'viewer'}
    <PortalFooter {locale} />
  {/if}
</div>
