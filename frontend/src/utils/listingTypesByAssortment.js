import { LISTING_TYPE_OPTIONS } from './listingTypes';
import { resolveAssortmentItem } from './assortmentIcons';
import * as C from './listingAppTypeConfigs';

export function allowedListingTypesForAssortment(gameOrItem) {
  const item = typeof gameOrItem === 'string'
    ? resolveAssortmentItem(gameOrItem)
    : gameOrItem;

  const name = C.normalizeName(item?.name || gameOrItem);
  const kind = item?.kind || 'app';

  if (C.isArenaBreakout(item?.name || name, item?.search)) {
    return C.ARENA_BREAKOUT_TYPES;
  }
  if (C.isPubgMobile(item?.name || name, item?.search)) {
    return C.PUBG_MOBILE_TYPES;
  }
  if (C.isPlaystation(item?.name || name, item?.search)) {
    return C.PLAYSTATION_TYPES;
  }
  if (C.isXbox(item?.name || name, item?.search)) {
    return C.XBOX_TYPES;
  }
  if (C.isGooglePlay(item?.name || name, item?.search)) {
    return C.GOOGLE_PLAY_TYPES;
  }
  if (C.isBattlenet(item?.name || name, item?.search)) {
    return C.BATTLENET_TYPES;
  }
  if (C.isAdobe(item?.name || name, item?.search)) {
    return C.ADOBE_TYPES;
  }
  if (C.isFaceit(item?.name || name, item?.search)) {
    return C.FACEIT_TYPES;
  }
  if (C.isRockstar(item?.name || name, item?.search)) {
    return C.ROCKSTAR_TYPES;
  }
  if (C.isWindows(item?.name || name, item?.search)) {
    return C.WINDOWS_TYPES;
  }
  if (C.isCapcut(item?.name || name, item?.search)) {
    return C.CAPCUT_TYPES;
  }
  if (C.isVkontakte(item?.name || name, item?.search)) {
    return C.VKONTAKTE_TYPES;
  }
  if (C.isTwitch(item?.name || name, item?.search)) {
    return C.TWITCH_TYPES;
  }
  if (C.isEsim(item?.name || name, item?.search)) {
    return C.ESIM_TYPES;
  }
  if (C.isExitlag(item?.name || name, item?.search)) {
    return C.EXITLAG_TYPES;
  }
  if (C.isPaxHistoria(item?.name || name, item?.search)) {
    return C.PAX_HISTORIA_TYPES;
  }
  if (C.isYoutube(item?.name || name, item?.search)) {
    return C.YOUTUBE_TYPES;
  }
  if (C.isTelegram(item?.name || name, item?.search)) {
    return C.TELEGRAM_TYPES;
  }
  if (C.isTiktok(item?.name || name, item?.search)) {
    return C.TIKTOK_TYPES;
  }
  if (C.isSteam(item?.name || name, item?.search)) {
    return C.STEAM_TYPES;
  }
  if (C.isApple(item?.name || name, item?.search)) {
    return C.APPLE_TYPES;
  }
  if (C.isSpotify(item?.name || name, item?.search)) {
    return C.SPOTIFY_TYPES;
  }
  if (C.isSoundcloud(item?.name || name, item?.search)) {
    return C.SOUNDCLOUD_TYPES;
  }
  if (C.GAME_PLATFORM_NAMES.has(name) || [...C.GAME_PLATFORM_NAMES].some((n) => name.includes(n))) {
    return C.GAME_PLATFORM_TYPES;
  }
  if (C.isDeepSeek(item?.name || name, item?.search)) {
    return C.DEEPSEEK_TYPES;
  }
  if (C.isKling(item?.name || name, item?.search)) {
    return C.KLING_TYPES;
  }
  if (C.isSuno(item?.name || name, item?.search)) {
    return C.SUNO_TYPES;
  }
  if (C.isNeiroseti(item?.name || name, item?.search)) {
    return C.NEIROSETI_TYPES;
  }
  if (C.isEaplay(item?.name || name, item?.search)) {
    return C.EAPLAY_TYPES;
  }
  if (C.isOculusQuest(item?.name || name, item?.search)) {
    return C.OCULUS_QUEST_TYPES;
  }
  if (C.isMicrosoftStore(item?.name || name, item?.search)) {
    return C.MICROSOFT_STORE_TYPES;
  }
  if (C.isLikee(item?.name || name, item?.search)) {
    return C.LIKEE_TYPES;
  }
  if (C.isFlStudio(item?.name || name, item?.search)) {
    return C.FL_STUDIO_TYPES;
  }
  if (C.isElevenlabs(item?.name || name, item?.search)) {
    return C.ELEVENLABS_TYPES;
  }
  if (C.isGearup(item?.name || name, item?.search)) {
    return C.GEARUP_TYPES;
  }
  if (C.isPolybuzz(item?.name || name, item?.search)) {
    return C.POLYBUZZ_TYPES;
  }
  if (C.isAutodesk(item?.name || name, item?.search)) {
    return C.AUTODESK_TYPES;
  }
  if (C.isNetflix(item?.name || name, item?.search)) {
    return C.NETFLIX_TYPES;
  }
  if (C.isChai(item?.name || name, item?.search)) {
    return C.CHAI_TYPES;
  }
  if (C.isZoom(item?.name || name, item?.search)) {
    return C.ZOOM_TYPES;
  }
  if (C.isZepeto(item?.name || name, item?.search)) {
    return C.ZEPETO_TYPES;
  }
  if (C.isReplit(item?.name || name, item?.search)) {
    return C.REPLIT_TYPES;
  }
  if (C.isDesignCatalog(item?.name || name, item?.search)) {
    return C.DESIGN_CATALOG_TYPES;
  }
  if (C.isVoicemod(item?.name || name, item?.search)) {
    return C.VOICEMOD_TYPES;
  }
  if (C.isHeygen(item?.name || name, item?.search)) {
    return C.HEYGEN_TYPES;
  }
  if (C.isDuolingo(item?.name || name, item?.search)) {
    return C.DUOLINGO_TYPES;
  }
  if (C.isRazerGold(item?.name || name, item?.search)) {
    return C.RAZER_GOLD_TYPES;
  }
  if (C.isSplice(item?.name || name, item?.search)) {
    return C.SPLICE_TYPES;
  }
  if (C.isGeoguessr(item?.name || name, item?.search)) {
    return C.GEOGUESSR_TYPES;
  }
  if (C.isMeshy(item?.name || name, item?.search)) {
    return C.MESHY_TYPES;
  }
  if (C.isEmochi(item?.name || name, item?.search)) {
    return C.EMOCHI_TYPES;
  }
  if (C.isSnapchat(item?.name || name, item?.search)) {
    return C.SNAPCHAT_TYPES;
  }
  if (C.isFigma(item?.name || name, item?.search)) {
    return C.FIGMA_TYPES;
  }
  if (C.isTradingview(item?.name || name, item?.search)) {
    return C.TRADINGVIEW_TYPES;
  }
  if (C.isJetbrains(item?.name || name, item?.search)) {
    return C.JETBRAINS_TYPES;
  }
  if (C.isHiggsfield(item?.name || name, item?.search)) {
    return C.HIGGSFIELD_TYPES;
  }
  if (C.isOpenrouter(item?.name || name, item?.search)) {
    return C.OPENROUTER_TYPES;
  }
  if (C.isCanva(item?.name || name, item?.search)) {
    return C.CANVA_TYPES;
  }
  if (C.isUbisoft(item?.name || name, item?.search)) {
    return C.UBISOFT_TYPES;
  }
  if (C.isWindsurf(item?.name || name, item?.search)) {
    return C.WINDSURF_TYPES;
  }
  if (C.isLagofast(item?.name || name, item?.search)) {
    return C.LAGOFAST_TYPES;
  }
  if (C.isLovable(item?.name || name, item?.search)) {
    return C.LOVABLE_TYPES;
  }
  if (C.isEpicGames(item?.name || name, item?.search)) {
    return C.EPIC_GAMES_TYPES;
  }
  if (C.isNotion(item?.name || name, item?.search)) {
    return C.NOTION_TYPES;
  }
  if (C.isPhotoroom(item?.name || name, item?.search)) {
    return C.PHOTOROOM_TYPES;
  }
  if (C.isPicsart(item?.name || name, item?.search)) {
    return C.PICSART_TYPES;
  }
  if (C.isN8n(item?.name || name, item?.search)) {
    return C.N8N_TYPES;
  }
  if (C.isCoursera(item?.name || name, item?.search)) {
    return C.COURSERA_TYPES;
  }
  if (C.isTripo(item?.name || name, item?.search)) {
    return C.TRIPO_TYPES;
  }
  if (C.isPixverse(item?.name || name, item?.search)) {
    return C.PIXVERSE_TYPES;
  }
  if (C.isWallpaperEngine(item?.name || name, item?.search)) {
    return C.WALLPAPER_ENGINE_TYPES;
  }
  if (C.isTeamspeak(item?.name || name, item?.search)) {
    return C.TEAMSPEAK_TYPES;
  }
  if (C.isSoundpad(item?.name || name, item?.search)) {
    return C.SOUNDPAD_TYPES;
  }
  if (C.isDzen(item?.name || name, item?.search)) {
    return C.DZEN_TYPES;
  }
  if (C.isAbleton(item?.name || name, item?.search)) {
    return C.ABLETON_TYPES;
  }
  if (C.isObsStudio(item?.name || name, item?.search)) {
    return C.OBS_STUDIO_TYPES;
  }
  if (C.isClipStudioPaint(item?.name || name, item?.search)) {
    return C.CLIP_STUDIO_PAINT_TYPES;
  }
  if (C.isCrunchyroll(item?.name || name, item?.search)) {
    return C.CRUNCHYROLL_TYPES;
  }
  if (C.isTangoLive(item?.name || name, item?.search)) {
    return C.TANGO_LIVE_TYPES;
  }
  if (C.isRunway(item?.name || name, item?.search)) {
    return C.RUNWAY_TYPES;
  }
  if (C.isBandicam(item?.name || name, item?.search)) {
    return C.BANDICAM_TYPES;
  }
  if (C.isBigoLive(item?.name || name, item?.search)) {
    return C.BIGO_LIVE_TYPES;
  }
  if (C.isKrea(item?.name || name, item?.search)) {
    return C.KREA_TYPES;
  }
  if (C.isCrosshairX(item?.name || name, item?.search)) {
    return C.CROSSHAIR_X_TYPES;
  }
  if (C.isBusuu(item?.name || name, item?.search)) {
    return C.BUSUU_TYPES;
  }
  if (C.isPrimeVideo(item?.name || name, item?.search)) {
    return C.PRIME_VIDEO_TYPES;
  }
  if (C.isKick(item?.name || name, item?.search)) {
    return C.KICK_TYPES;
  }
  if (C.isUdio(item?.name || name, item?.search)) {
    return C.UDIO_TYPES;
  }
  if (C.isAudioEditors(item?.name || name, item?.search)) {
    return C.AUDIO_EDITORS_TYPES;
  }
  if (C.isQuizlet(item?.name || name, item?.search)) {
    return C.QUIZLET_TYPES;
  }
  if (C.isMimo(item?.name || name, item?.search)) {
    return C.MIMO_TYPES;
  }
  if (C.isYappy(item?.name || name, item?.search)) {
    return C.YAPPY_TYPES;
  }
  if (C.isGeforceNow(item?.name || name, item?.search)) {
    return C.GEFORCE_NOW_TYPES;
  }
  if (C.isHosting(item?.name || name, item?.search)) {
    return C.HOSTING_TYPES;
  }
  if (C.isTrovo(item?.name || name, item?.search)) {
    return C.TROVO_TYPES;
  }
  if (C.isElement(item?.name || name, item?.search)) {
    return C.ELEMENT_TYPES;
  }
  if (C.isSlack(item?.name || name, item?.search)) {
    return C.SLACK_TYPES;
  }
  if (C.isHailuo(item?.name || name, item?.search)) {
    return C.HAILUO_TYPES;
  }
  if (C.isTidal(item?.name || name, item?.search)) {
    return C.TIDAL_TYPES;
  }
  if (C.isEnvatoElements(item?.name || name, item?.search)) {
    return C.ENVATO_ELEMENTS_TYPES;
  }
  if (C.isPico(item?.name || name, item?.search)) {
    return C.PICO_TYPES;
  }
  if (C.isQobuz(item?.name || name, item?.search)) {
    return C.QOBUZ_TYPES;
  }
  if (C.isManus(item?.name || name, item?.search)) {
    return C.MANUS_TYPES;
  }
  if (C.isAhrefs(item?.name || name, item?.search)) {
    return C.AHREFS_TYPES;
  }
  if (C.isImazing(item?.name || name, item?.search)) {
    return C.IMAZING_TYPES;
  }
  if (C.isRecraft(item?.name || name, item?.search)) {
    return C.RECRAFT_TYPES;
  }
  if (C.isHuggingFace(item?.name || name, item?.search)) {
    return C.HUGGING_FACE_TYPES;
  }
  if (C.isGog(item?.name || name, item?.search)) {
    return C.GOG_TYPES;
  }
  if (C.isNoping(item?.name || name, item?.search)) {
    return C.NOPING_TYPES;
  }
  if (C.isAiService(item?.name || name, item?.search)) {
    return C.AI_SERVICE_TYPES;
  }
  if (C.SOCIAL_APP_NAMES.has(name)) {
    return C.SOCIAL_APP_TYPES;
  }

  return C.TYPES_BY_KIND[kind] || C.TYPES_BY_KIND.app;
}

export function listingTypeOptionsForAssortment(gameOrItem) {
  const allowed = allowedListingTypesForAssortment(gameOrItem);
  const byValue = Object.fromEntries(LISTING_TYPE_OPTIONS.map((o) => [o.value, o]));
  const itemName = typeof gameOrItem === 'string' ? gameOrItem : gameOrItem?.name;
  const itemSearch = typeof gameOrItem === 'object' ? gameOrItem?.search : '';
  const labelMap =
    (C.isArenaBreakout(itemName, itemSearch) && C.ARENA_BREAKOUT_LABELS)
    || (C.isPubgMobile(itemName, itemSearch) && C.PUBG_MOBILE_LABELS)
    || (C.isPlaystation(itemName, itemSearch) && C.PLAYSTATION_LABELS)
    || (C.isXbox(itemName, itemSearch) && C.XBOX_LABELS)
    || (C.isGooglePlay(itemName, itemSearch) && C.GOOGLE_PLAY_LABELS)
    || (C.isBattlenet(itemName, itemSearch) && C.BATTLENET_LABELS)
    || (C.isAdobe(itemName, itemSearch) && C.ADOBE_LABELS)
    || (C.isFaceit(itemName, itemSearch) && C.FACEIT_LABELS)
    || (C.isRockstar(itemName, itemSearch) && C.ROCKSTAR_LABELS)
    || (C.isWindows(itemName, itemSearch) && C.WINDOWS_LABELS)
    || (C.isCapcut(itemName, itemSearch) && C.CAPCUT_LABELS)
    || (C.isVkontakte(itemName, itemSearch) && C.VKONTAKTE_LABELS)
    || (C.isTwitch(itemName, itemSearch) && C.TWITCH_LABELS)
    || (C.isEsim(itemName, itemSearch) && C.ESIM_LABELS)
    || (C.isExitlag(itemName, itemSearch) && C.EXITLAG_LABELS)
    || (C.isPaxHistoria(itemName, itemSearch) && C.PAX_HISTORIA_LABELS)
    || (C.isYoutube(itemName, itemSearch) && C.YOUTUBE_LABELS)
    || (C.isTelegram(itemName, itemSearch) && C.TELEGRAM_LABELS)
    || (C.isTiktok(itemName, itemSearch) && C.TIKTOK_LABELS)
    || (C.isSteam(itemName, itemSearch) && C.STEAM_LABELS)
    || (C.isApple(itemName, itemSearch) && C.APPLE_LABELS)
    || (C.isSpotify(itemName, itemSearch) && C.SPOTIFY_LABELS)
    || (C.isSoundcloud(itemName, itemSearch) && C.SOUNDCLOUD_LABELS)
    || (C.isSuno(itemName, itemSearch) && C.SUNO_LABELS)
    || (C.isNeiroseti(itemName, itemSearch) && C.NEIROSETI_LABELS)
    || (C.isEaplay(itemName, itemSearch) && C.EAPLAY_LABELS)
    || (C.isOculusQuest(itemName, itemSearch) && C.OCULUS_QUEST_LABELS)
    || (C.isMicrosoftStore(itemName, itemSearch) && C.MICROSOFT_STORE_LABELS)
    || (C.isLikee(itemName, itemSearch) && C.LIKEE_LABELS)
    || (C.isFlStudio(itemName, itemSearch) && C.FL_STUDIO_LABELS)
    || (C.isElevenlabs(itemName, itemSearch) && C.ELEVENLABS_LABELS)
    || (C.isGearup(itemName, itemSearch) && C.GEARUP_LABELS)
    || (C.isPolybuzz(itemName, itemSearch) && C.POLYBUZZ_LABELS)
    || (C.isAutodesk(itemName, itemSearch) && C.AUTODESK_LABELS)
    || (C.isNetflix(itemName, itemSearch) && C.NETFLIX_LABELS)
    || (C.isChai(itemName, itemSearch) && C.CHAI_LABELS)
    || (C.isZoom(itemName, itemSearch) && C.ZOOM_LABELS)
    || (C.isZepeto(itemName, itemSearch) && C.ZEPETO_LABELS)
    || (C.isReplit(itemName, itemSearch) && C.REPLIT_LABELS)
    || (C.isDesignCatalog(itemName, itemSearch) && C.DESIGN_CATALOG_LABELS)
    || (C.isVoicemod(itemName, itemSearch) && C.VOICEMOD_LABELS)
    || (C.isHeygen(itemName, itemSearch) && C.HEYGEN_LABELS)
    || (C.isDuolingo(itemName, itemSearch) && C.DUOLINGO_LABELS)
    || (C.isRazerGold(itemName, itemSearch) && C.RAZER_GOLD_LABELS)
    || (C.isSplice(itemName, itemSearch) && C.SPLICE_LABELS)
    || (C.isGeoguessr(itemName, itemSearch) && C.GEOGUESSR_LABELS)
    || (C.isMeshy(itemName, itemSearch) && C.MESHY_LABELS)
    || (C.isEmochi(itemName, itemSearch) && C.EMOCHI_LABELS)
    || (C.isSnapchat(itemName, itemSearch) && C.SNAPCHAT_LABELS)
    || (C.isFigma(itemName, itemSearch) && C.FIGMA_LABELS)
    || (C.isTradingview(itemName, itemSearch) && C.TRADINGVIEW_LABELS)
    || (C.isJetbrains(itemName, itemSearch) && C.JETBRAINS_LABELS)
    || (C.isHiggsfield(itemName, itemSearch) && C.HIGGSFIELD_LABELS)
    || (C.isOpenrouter(itemName, itemSearch) && C.OPENROUTER_LABELS)
    || (C.isCanva(itemName, itemSearch) && C.CANVA_LABELS)
    || (C.isUbisoft(itemName, itemSearch) && C.UBISOFT_LABELS)
    || (C.isWindsurf(itemName, itemSearch) && C.WINDSURF_LABELS)
    || (C.isLagofast(itemName, itemSearch) && C.LAGOFAST_LABELS)
    || (C.isLovable(itemName, itemSearch) && C.LOVABLE_LABELS)
    || (C.isEpicGames(itemName, itemSearch) && C.EPIC_GAMES_LABELS)
    || (C.isNotion(itemName, itemSearch) && C.NOTION_LABELS)
    || (C.isPhotoroom(itemName, itemSearch) && C.PHOTOROOM_LABELS)
    || (C.isPicsart(itemName, itemSearch) && C.PICSART_LABELS)
    || (C.isN8n(itemName, itemSearch) && C.N8N_LABELS)
    || (C.isCoursera(itemName, itemSearch) && C.COURSERA_LABELS)
    || (C.isTripo(itemName, itemSearch) && C.TRIPO_LABELS)
    || (C.isPixverse(itemName, itemSearch) && C.PIXVERSE_LABELS)
    || (C.isWallpaperEngine(itemName, itemSearch) && C.WALLPAPER_ENGINE_LABELS)
    || (C.isTeamspeak(itemName, itemSearch) && C.TEAMSPEAK_LABELS)
    || (C.isSoundpad(itemName, itemSearch) && C.SOUNDPAD_LABELS)
    || (C.isDzen(itemName, itemSearch) && C.DZEN_LABELS)
    || (C.isAbleton(itemName, itemSearch) && C.ABLETON_LABELS)
    || (C.isObsStudio(itemName, itemSearch) && C.OBS_STUDIO_LABELS)
    || (C.isClipStudioPaint(itemName, itemSearch) && C.CLIP_STUDIO_PAINT_LABELS)
    || (C.isCrunchyroll(itemName, itemSearch) && C.CRUNCHYROLL_LABELS)
    || (C.isTangoLive(itemName, itemSearch) && C.TANGO_LIVE_LABELS)
    || (C.isRunway(itemName, itemSearch) && C.RUNWAY_LABELS)
    || (C.isBandicam(itemName, itemSearch) && C.BANDICAM_LABELS)
    || (C.isBigoLive(itemName, itemSearch) && C.BIGO_LIVE_LABELS)
    || (C.isKrea(itemName, itemSearch) && C.KREA_LABELS)
    || (C.isCrosshairX(itemName, itemSearch) && C.CROSSHAIR_X_LABELS)
    || (C.isBusuu(itemName, itemSearch) && C.BUSUU_LABELS)
    || (C.isPrimeVideo(itemName, itemSearch) && C.PRIME_VIDEO_LABELS)
    || (C.isKick(itemName, itemSearch) && C.KICK_LABELS)
    || (C.isUdio(itemName, itemSearch) && C.UDIO_LABELS)
    || (C.isAudioEditors(itemName, itemSearch) && C.AUDIO_EDITORS_LABELS)
    || (C.isQuizlet(itemName, itemSearch) && C.QUIZLET_LABELS)
    || (C.isMimo(itemName, itemSearch) && C.MIMO_LABELS)
    || (C.isYappy(itemName, itemSearch) && C.YAPPY_LABELS)
    || (C.isGeforceNow(itemName, itemSearch) && C.GEFORCE_NOW_LABELS)
    || (C.isHosting(itemName, itemSearch) && C.HOSTING_LABELS)
    || (C.isTrovo(itemName, itemSearch) && C.TROVO_LABELS)
    || (C.isElement(itemName, itemSearch) && C.ELEMENT_LABELS)
    || (C.isSlack(itemName, itemSearch) && C.SLACK_LABELS)
    || (C.isHailuo(itemName, itemSearch) && C.HAILUO_LABELS)
    || (C.isTidal(itemName, itemSearch) && C.TIDAL_LABELS)
    || (C.isEnvatoElements(itemName, itemSearch) && C.ENVATO_ELEMENTS_LABELS)
    || (C.isPico(itemName, itemSearch) && C.PICO_LABELS)
    || (C.isQobuz(itemName, itemSearch) && C.QOBUZ_LABELS)
    || (C.isManus(itemName, itemSearch) && C.MANUS_LABELS)
    || (C.isAhrefs(itemName, itemSearch) && C.AHREFS_LABELS)
    || (C.isImazing(itemName, itemSearch) && C.IMAZING_LABELS)
    || (C.isRecraft(itemName, itemSearch) && C.RECRAFT_LABELS)
    || (C.isHuggingFace(itemName, itemSearch) && C.HUGGING_FACE_LABELS)
    || (C.isGog(itemName, itemSearch) && C.GOG_LABELS)
    || (C.isNoping(itemName, itemSearch) && C.NOPING_LABELS)
    || null;

  return allowed
    .filter((value) => Boolean(byValue[value]))
    .map((value) => ({
      value,
      label: (labelMap && labelMap[value]) || byValue[value].label,
    }));
}
