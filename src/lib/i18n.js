export const ENGLISH = 'en';
export const TRADITIONAL_CHINESE = 'zh-HK';

const STORAGE_KEY = 'concert-locale';

const messages = {
  en: {
    siteName: 'Hong Kong Concert Guide',
    siteDescription: 'A bilingual Hong Kong concert portal with interactive 3D venue seating plans, transport guides and community features.',
    ogDescription: 'Plan your next Hong Kong concert with interactive 3D venue views and practical local guides.',
    shortBrand: 'HK CONCERT',
    navLabel: 'Primary navigation',
    navHome: 'Home',
    navGuide: 'Before You Go',
    navExplore: '3D Seat View',
    navVenues: 'Venues',
    navConcerts: 'What’s On',
    navCommunity: 'Community',
    backToPortal: 'Back to portal',
    arenaPageEyebrow: 'Venue guide',
    arenaPageBody: 'Explore the seating model now. Transport, upcoming shows and real seat-view reports will be added to this dedicated venue page.',
    currentLayout: 'Current layout',
    arenaQuickGuide: 'Plan your visit',
    arenaQuickGuideBody: 'The essentials for this venue will be collected here as the guide grows.',
    arenaTransportTitle: 'Transport',
    arenaTransportBody: 'MTR exits, walking routes and post-show travel details are coming soon.',
    arenaConcertsTitle: 'Upcoming concerts',
    arenaConcertsBody: 'Confirmed shows and on-sale reminders will appear here.',
    arenaCommunityTitle: 'Seat photos & comments',
    arenaCommunityBody: 'Real view angles and practical audience notes will be available here.',
    exploreOtherArenas: 'Explore other arenas',
    venueDetails: 'Venue details',
    openingHours: 'Opening hours',
    addressAndMap: 'Address & map',
    venueAddress: 'Address',
    photoAlbum: 'Photo album',
    coverPreview: 'Venue cover preview',
    openInOpenStreetMap: 'Open in OpenStreetMap',
    openingHoursValue: 'Event dependent',
    openingHoursBody: 'Public access and door times vary by event. Check the organiser’s latest notice before travelling.',
    venueFacilities: 'Facilities',
    venueFacilitiesBody: 'Entrance, accessibility, food, washroom and bag-policy notes will be collected here.',
    venueUpcoming: 'Upcoming at this venue',
    venueUpcomingBody: 'Confirmed concerts for this venue will appear here.',
    venueComments: 'Audience comments',
    venueCommentsBody: 'Local notes about queues, sound, sightlines and leaving the venue will appear here.',
    openDedicatedViewer: 'Open dedicated 3D viewer',
    viewerBackToVenue: 'Back to venue details',
    viewerModeLabel: '3D seat workspace',
    explore3d: 'Explore 3D seats',
    tonightInHongKong: 'Tonight in Hong Kong',
    cityNote: 'From Hung Hom to AsiaWorld-Expo',
    viewerEyebrow: 'Interactive venue explorer',
    viewerTitle: 'See the room from every angle.',
    viewerBody: 'Choose a venue and layout, then search or tap any seat to preview its position.',
    liveModel: 'Live 3D model',
    viewerPanelLabel: 'Current venue',
    open3dModel: 'Open 3D model',
    transportEyebrow: 'Plan the journey',
    transportTitle: 'Getting there should not be the hard part.',
    transportBody: 'A future transport guide will compare MTR exits, walking routes, special buses and post-show crowd plans.',
    mtrRoutes: 'MTR routes',
    mtrRoutesBody: 'Best station exits and realistic walking times.',
    afterShow: 'After the encore',
    afterShowBody: 'Last trains, special services and crowd-control notes.',
    accessibilityGuide: 'Accessible journeys',
    accessibilityGuideBody: 'Step-free routes from station to venue entrance.',
    comingFeature: 'Guide coming soon',
    whatsOnEyebrow: 'What’s on',
    whatsOnTitle: 'Your next loud night, all in one calendar.',
    whatsOnBody: 'Upcoming concert listings, venue alerts and on-sale reminders will live here.',
    communityEyebrow: 'Built by concertgoers',
    communityTitle: 'The view from your actual seat.',
    communityBody: 'Soon you will be able to upload real view-angle photos, leave practical comments and help the next person choose with confidence.',
    uploadPhotos: 'Upload seat photos',
    uploadPhotosBody: 'Tag a photo by venue, section, row and seat.',
    localComments: 'Share local tips',
    localCommentsBody: 'Talk about sightlines, sound, queues and exits.',
    communitySoon: 'Community features coming soon',
    canvasLabel: '3D view of the venue seating plan. Click or search for a seat, then switch between its stage and seating-area views.',
    venue: 'Venue',
    seatingLayout: 'Seating layout',
    comingSoon: 'coming soon',
    modelIntro: 'Interactive 3D seating model',
    hoverIntro: 'Hover any seat for its',
    seatReference: 'section · row · seat number',
    officialPlan: 'Official seating plan (PDF)',
    settings: 'Settings',
    autoRotate: 'Auto-rotate',
    roofStructure: 'Roof structure',
    sideLabels: 'Side labels',
    findSeat: 'Find a seat',
    sectionShort: 'Sec',
    section: 'Section',
    row: 'Row',
    seat: 'Seat',
    goToSeat: 'Go to seat',
    noSeatSelected: '— no seat selected —',
    selectSeatHint: 'Click a seat for its stage and seating-area views',
    viewFromSeat: 'Stage view',
    seatSurroundings: 'Seat area',
    unselectSeat: 'Unselect seat',
    controlsHint: 'Drag · orbit  |  Scroll · zoom  |  Right-drag · pan',
    resetView: 'Reset view',
    resetCamera: 'Reset camera position',
    seatNotFound: 'Seat not found — check Sec / Row / Seat.',
    performanceArea: 'Performance area',
    wheelchairPlatform: 'Wheelchair Platform',
    wheelchairDetails: 'Promenade · rows 14–15 · wheelchair patron + minder',
    language: 'Language',
    traditionalChinese: 'Traditional Chinese',
    english: 'English',
    sentenceEnd: '.',
  },
  'zh-HK': {
    siteName: '香港演唱會指南',
    siteDescription: '為香港樂迷而設的雙語演唱會資訊平台，提供互動 3D 座位表、交通指南及社群功能。',
    ogDescription: '以互動 3D 場館視圖及本地實用資訊，計劃你的下一場香港演唱會。',
    shortBrand: 'HK CONCERT',
    navLabel: '主要導覽',
    navHome: '主頁',
    navGuide: '入場須知',
    navExplore: '3D 座位視圖',
    navVenues: '場館',
    navConcerts: '演出日程',
    navCommunity: '社群',
    backToPortal: '返回主頁',
    arenaPageEyebrow: '場館指南',
    arenaPageBody: '立即探索座位模型。交通、即將舉行的演出及真實座位視角報告，將會加入這個場館專頁。',
    currentLayout: '目前座位配置',
    arenaQuickGuide: '計劃你的行程',
    arenaQuickGuideBody: '指南持續更新，這裡將集中整理這個場館的重要資訊。',
    arenaTransportTitle: '交通',
    arenaTransportBody: '港鐵出口、步行路線及散場交通詳情即將推出。',
    arenaConcertsTitle: '即將舉行的演唱會',
    arenaConcertsBody: '已確認演出及開售提醒將會在這裡出現。',
    arenaCommunityTitle: '座位相片及評語',
    arenaCommunityBody: '真實視角及觀眾實用資訊將會在這裡提供。',
    exploreOtherArenas: '探索其他場館',
    venueDetails: '場館詳情',
    openingHours: '開放時間',
    addressAndMap: '地址',
    venueAddress: '地址',
    photoAlbum: '相片集',
    coverPreview: '場館封面預覽',
    openInOpenStreetMap: '開啟地圖',
    openingHoursValue: '視乎活動安排',
    openingHoursBody: '公眾開放及入場時間因活動而異，出發前請查看主辦單位最新通知。',
    venueFacilities: '場館設施',
    venueFacilitiesBody: '入口、無障礙設施、飲食、洗手間及攜帶物品規定將整理在這裡。',
    venueUpcoming: '此場館即將舉行',
    venueUpcomingBody: '此場館已確認的演唱會將會在這裡出現。',
    venueComments: '觀眾評語',
    venueCommentsBody: '關於排隊、音響、視線及散場的本地經驗將會在這裡出現。',
    openDedicatedViewer: '開啟獨立 3D 座位視圖',
    viewerBackToVenue: '返回場館詳情',
    viewerModeLabel: '3D 座位工作區',
    explore3d: '探索 3D 座位',
    tonightInHongKong: '今夜香港',
    cityNote: '由紅磡到亞洲國際博覽館',
    viewerEyebrow: '互動場館探索',
    viewerTitle: '從每一個角度看清場館。',
    viewerBody: '選擇場館及座位配置，再搜尋或按下任何座位預覽位置。',
    liveModel: '即時 3D 模型',
    viewerPanelLabel: '目前場館',
    open3dModel: '開啟 3D 模型',
    transportEyebrow: '計劃行程',
    transportTitle: '去場館，不應該是最困難的一環。',
    transportBody: '稍後推出的交通指南將比較港鐵出口、步行路線、特別巴士及散場人流安排。',
    mtrRoutes: '港鐵路線',
    mtrRoutesBody: '最方便的車站出口及實際步行時間。',
    afterShow: '散場之後',
    afterShowBody: '尾班車、特別班次及人流管制資訊。',
    accessibilityGuide: '無障礙行程',
    accessibilityGuideBody: '由車站到場館入口的無梯級路線。',
    comingFeature: '指南即將推出',
    whatsOnEyebrow: '演出日程',
    whatsOnTitle: '下一個澎湃晚上，集中在一個日曆。',
    whatsOnBody: '即將舉行的演唱會、場館提示及開售提醒將會在這裡出現。',
    communityEyebrow: '由樂迷共同建立',
    communityTitle: '你真正坐過的座位視角。',
    communityBody: '稍後你可以上載真實座位視角相片、留下實用評語，讓下一位樂迷更有信心選擇。',
    uploadPhotos: '上載座位相片',
    uploadPhotosBody: '按場館、區域、行及座位標記相片。',
    localComments: '分享本地貼士',
    localCommentsBody: '交流視線、音響、排隊及散場出口資訊。',
    communitySoon: '社群功能即將推出',
    canvasLabel: '場館座位表的 3D 視圖。按一下或搜尋座位，即可切換舞台及座位周邊視角。',
    venue: '場館',
    seatingLayout: '座位配置',
    comingSoon: '即將推出',
    modelIntro: '互動 3D 座位模型',
    hoverIntro: '將游標移到任何座位上，即可查看',
    seatReference: '區域 · 行 · 座位號碼',
    officialPlan: '官方座位表（PDF）',
    settings: '設定',
    autoRotate: '自動旋轉',
    roofStructure: '上蓋結構',
    sideLabels: '區域標示',
    findSeat: '尋找座位',
    sectionShort: '區',
    section: '區域',
    row: '行',
    seat: '座位',
    goToSeat: '前往座位',
    noSeatSelected: '尚未選擇座位',
    selectSeatHint: '按一下座位，即可查看舞台及座位周邊視角',
    viewFromSeat: '舞台視角',
    seatSurroundings: '座位周邊',
    unselectSeat: '取消選擇座位',
    controlsHint: '拖曳 · 環繞  |  滾輪 · 縮放  |  右鍵拖曳 · 平移',
    resetView: '重設視角',
    resetCamera: '重設鏡頭位置',
    seatNotFound: '找不到座位 — 請檢查區域、行及座位號碼。',
    performanceArea: '表演區',
    wheelchairPlatform: '輪椅平台',
    wheelchairDetails: '平台層 · 第 14 至 15 行 · 輪椅使用者及陪同者',
    language: '語言',
    traditionalChinese: '繁體中文',
    english: 'English',
    sentenceEnd: '。',
  },
};

const zhVenueText = {
  hkc: {
    name: '香港體育館',
    subtitle: '四面台 360° 座位配置',
    dims: '場館 40 米 × 40 米 · 樓底高 23 米 · 41 米倒金字塔形上蓋',
    roofLabel: '場館上蓋結構',
    sides: ['紅閘 40 段', '藍閘 50 段', '綠閘 60 段', '黃閘 70 段'],
  },
  qes: {
    name: '伊利沙伯體育館',
    subtitle: '多用途場館 · 五種官方座位配置',
    dims: '場館設三層看台（3 樓地面層 · 4 樓 · 5 樓），圍繞中央場地',
    sides: ['北看台（6–7）', '東看台（1 · 8）', '南看台（2–3）', '西看台（4–5）'],
  },
  kta: {
    name: '啟德體藝館',
    subtitle: '正面舞台演唱會座位配置',
    dims: '102–113、207–208 區及場地 A–J 區 · 互動模型座位',
    roofLabel: '場館上蓋結構',
    sides: ['下層看台', '西面看台', '視線受阻區', '場地座位'],
  },
  kts: {
    name: '啟德主場館',
    subtitle: '固定主場館座位表',
    dims: '47,459 個看台座位 · 512 個陪同者及 512 個輪椅席位 · 101–110、201–240 及 501–540 區',
    roofLabel: '開合式上蓋結構',
    sides: ['內圈 101–110 區', '下層 201–240 區', '上層 501–540 區', '無障礙座位', '貴賓席'],
  },
  awe: {
    name: '亞洲國際博覽館（1 號展館）',
    subtitle: '1 號展館 AWA-ES-16 Draft 02 正面舞台座位表',
    dims: '看台 1–17 及場地 A–D 區 · 官方座位表座位',
    roofLabel: '展館上蓋結構',
    sides: ['座位區'],
  },
  'awe-halls': {
    name: '亞洲國際博覽館（6、8 及 10 號展館）',
    subtitle: 'VIVA TH8400 及 TH5600 正面舞台座位表',
    dims: '6、8 及 10 號展館 VIVA 正面舞台座位配置',
    roofLabel: '8 及 10 號展館上蓋結構',
    sides: ['8 號展館地面座位', '10 號展館梯級座位'],
  },
};

const zhLayoutText = {
  'hkc:center-stage': { name: '四面台' },
  'hkc:end-stage': { name: '三面台' },
  'qes:end-stage': { name: '正面舞台' },
  'qes:3-side-end-stage': { name: '三面舞台' },
  'qes:central-stage': { name: '中央舞台' },
  'qes:boxing-ring': { name: '擂台' },
  'qes:central-court': { name: '中央場地' },
  'kta:end-stage': { name: '正面舞台' },
  'kts:stadium': { name: '主場館' },
  'awe:end-stage': { name: '正面舞台' },
  'awe-halls:th8400': {
    name: '6、8 及 10 號展館 · 正面舞台',
    dims: '8 號展館地面 A–C 區及 10 號展館梯級 C–D 區',
  },
  'awe-halls:th5600': {
    name: '8 及 10 號展館 · 正面舞台',
    dims: '8 號展館地面 A–B 區及 10 號展館梯級 C–D 區',
  },
};

const zhKnownText = {
  'Lower Tier': '下層看台',
  'Promenade Level': '平台層',
  'Upper Tier': '上層看台',
  'Arena Floor': '場地座位',
  'Inner Bowl': '內圈看台',
  'Lower Bowl': '下層看台',
  'Upper West Stand': '西面上層看台',
  'Lower Level': '下層看台',
  'Upper Level': '上層看台',
  'Hall 8 floor': '8 號展館地面座位',
  'Hall 10 riser': '10 號展館梯級座位',
  'Seating': '座位區',
  'North Stand 北看台': '北看台',
  'East Stand 東看台': '東看台',
  'South Stand 南看台': '南看台',
  'West Stand 西看台': '西看台',
  'Arena Floor 場地': '場地座位',
  'Brown Gate 啡閘': '啡閘',
  'Red Gate 40s': '紅閘 40 段',
  'Blue Gate 50s': '藍閘 50 段',
  'Green Gate 60s': '綠閘 60 段',
  'Yellow Gate 70s': '黃閘 70 段',
};

export function normalizeLocale(locale) {
  return locale === TRADITIONAL_CHINESE ? TRADITIONAL_CHINESE : ENGLISH;
}

export function detectLocale(languages = []) {
  const list = Array.isArray(languages) ? languages : [languages];
  const traditional = list.some((language) => {
    const tag = String(language || '');
    return /(?:^|-)HK(?:-|$)/i.test(tag) ||
      /^zh-(?:Hant|TW|MO)(?:-|$)/i.test(tag);
  });
  return traditional ? TRADITIONAL_CHINESE : ENGLISH;
}

export function initialLocale({ storage, languages } = {}) {
  try {
    const saved = storage?.getItem(STORAGE_KEY);
    if (saved === ENGLISH || saved === TRADITIONAL_CHINESE) return saved;
  } catch {
    // Browser privacy settings can make localStorage unavailable.
  }
  return detectLocale(languages);
}

export function saveLocale(locale, storage) {
  try {
    storage?.setItem(STORAGE_KEY, normalizeLocale(locale));
  } catch {
    // Keep the active locale even when persistence is unavailable.
  }
}

export function translate(locale, key) {
  return messages[normalizeLocale(locale)][key] ?? messages.en[key] ?? key;
}

export function getVenueText(locale, venue, layout = null) {
  if (normalizeLocale(locale) === ENGLISH) {
    return {
      name: venue.name,
      subtitle: venue.subtitle,
      dims: layout?.dims || venue.dims,
      roofLabel: venue.roofLabel,
      sides: venue.sides.map((side) => side.name),
      layoutName: layout?.label,
    };
  }

  const venueText = zhVenueText[venue.id] || {};
  const layoutText = layout ? zhLayoutText[`${venue.id}:${layout.id}`] || {} : {};
  const sourceDims = layout?.dims || venue.dims || '';
  const seatCount = sourceDims.match(/([\d,]+) (?:modelled|PDF|drawn) seats/)?.[1];
  let dims = layoutText.dims || venueText.dims || sourceDims;
  if (seatCount && !dims.includes(seatCount)) dims += ` · ${seatCount} 個座位`;
  return {
    name: venueText.name || venue.zh || venue.name,
    subtitle: venueText.subtitle || venue.subtitle,
    dims,
    roofLabel: venueText.roofLabel,
    sides: venueText.sides || venue.sides.map((side) => side.name),
    layoutName: layoutText.name || layout?.zh || layout?.label,
  };
}

function zhSeatMain(venueId, placement) {
  const parts = [];
  if (venueId === 'awe-halls') parts.push(`${placement.hall} 號館`);
  const section = venueId === 'awe-halls' ? placement.block : placement.sec ?? placement.block;
  parts.push(`${section} 區`);
  parts.push(`${placement.row} 行`);
  parts.push(`${placement.seat} 號座位`);
  return parts.join(' · ');
}

function localizeKnownText(text) {
  if (!text) return '';
  if (zhKnownText[text]) return zhKnownText[text];
  return text
    .replace(/^Accessible seating · Section (\d+)$/, '無障礙座位 · $1 區')
    .replace(/^Wheelchair \/ accessible seating at the stadium concourse$/, '主場館大堂層的輪椅／無障礙座位')
    .replace(/^Inner Bowl ·/, '內圈看台 ·')
    .replace(/^Lower Level ·/, '下層看台 ·')
    .replace(/^Upper Level ·/, '上層看台 ·');
}

export function describeSeat(locale, venue, placement, fallback) {
  if (normalizeLocale(locale) === ENGLISH) return fallback;
  const venueText = getVenueText(locale, venue);
  const zone = localizeKnownText(placement.zone);
  const tier = localizeKnownText(placement.tier);
  const detail = [zone, tier].filter((value, index, values) => value && values.indexOf(value) === index).join(' — ');
  return {
    main: zhSeatMain(venue.id, placement),
    sub: detail || venueText.name,
  };
}

export function describeStage(locale, venue, layout, fallback) {
  if (normalizeLocale(locale) === ENGLISH) return fallback;
  if (venue.id === 'kts') return '球場';
  return getVenueText(locale, venue, layout).layoutName || fallback;
}

export function describeWheelchair(locale, data) {
  if (normalizeLocale(locale) === ENGLISH) {
    return {
      main: data.main,
      sub: data.sub,
    };
  }
  return {
    main: data.main ? localizeKnownText(data.main) : `${translate(locale, 'wheelchairPlatform')} ${data.id}`,
    sub: data.sub ? localizeKnownText(data.sub) : translate(locale, 'wheelchairDetails'),
  };
}

export function updateDocumentLocale(locale) {
  if (typeof document === 'undefined') return;
  const normalized = normalizeLocale(locale);
  document.documentElement.lang = normalized;
  document.title = translate(normalized, 'siteName');
  document.querySelector('meta[name="description"]')?.setAttribute('content', translate(normalized, 'siteDescription'));
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', translate(normalized, 'siteName'));
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', translate(normalized, 'ogDescription'));
}
