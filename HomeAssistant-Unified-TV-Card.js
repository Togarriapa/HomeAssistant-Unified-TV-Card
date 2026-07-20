const CARD_VERSION = "1.4.0";
const CARD_TAG = "unified-tv-card";

const LABELS = {
  en: {
    app: "Application",
    selectApp: "Select an app",
    noApps: "No applications available",
    input: "Input",
    selectInput: "Select an input",
    activity: "Activity",
    selectActivity: "Run an activity",
    restart: "Restart",
    power: "Power",
    home: "Home",
    back: "Back",
    settings: "Settings",
    mute: "Mute",
    unmute: "Unmute",
    diagnostics: "Diagnostics",
    source: "Source",
    state: "State",
    application: "Application",
    volume: "Volume",
    health: "Health",
    features: "Supported features",
    noEntity: "Entity not found",
    confirmPowerOff: "Turn this device off?",
    confirmRestart: "Restart this device?",
    autoSkipAds: "Auto-skip YouTube ads",
    skipNow: "Skip ad now",
    on: "On",
    off: "Off",
    adResult: "Ad-skip result",
    actionFailed: "Action failed",
    actionSent: "Command sent",
    tvApps: "TV apps",
    castApps: "Cast apps",
    remoteUnavailable: "No navigation provider is available. Configure the physical-device entities in the integration.",
    navigationProvider: "Navigation provider",
    restartProvider: "Restart provider",
    linkedEntities: "Linked entities",
    applicationProviders: "Application providers",
    backendRelease: "Backend release",
    cardRelease: "Card release",
    backendOutdated: "Backend 8.4.0 or newer is required. Installed backend: {version}.",
  },
  pt: {
    app: "Aplicação",
    selectApp: "Selecionar aplicação",
    noApps: "Nenhuma aplicação disponível",
    input: "Entrada",
    selectInput: "Selecionar entrada",
    activity: "Atividade",
    selectActivity: "Executar atividade",
    restart: "Reiniciar",
    power: "Energia",
    home: "Início",
    back: "Voltar",
    settings: "Definições",
    mute: "Silenciar",
    unmute: "Ativar som",
    diagnostics: "Diagnóstico",
    source: "Fonte",
    state: "Estado",
    application: "Aplicação",
    volume: "Volume",
    health: "Saúde",
    features: "Funcionalidades suportadas",
    noEntity: "Entidade não encontrada",
    confirmPowerOff: "Desligar este dispositivo?",
    confirmRestart: "Reiniciar este dispositivo?",
    autoSkipAds: "Ignorar anúncios do YouTube",
    skipNow: "Ignorar anúncio agora",
    on: "Ativo",
    off: "Inativo",
    adResult: "Resultado dos anúncios",
    actionFailed: "A ação falhou",
    actionSent: "Comando enviado",
    tvApps: "Aplicações da TV",
    castApps: "Aplicações Cast",
    remoteUnavailable: "Não existe um fornecedor de navegação. Configure as entidades do dispositivo físico na integração.",
    navigationProvider: "Fornecedor de navegação",
    restartProvider: "Fornecedor de reinício",
    linkedEntities: "Entidades associadas",
    applicationProviders: "Fornecedores de aplicações",
    backendRelease: "Versão da integração",
    cardRelease: "Versão do cartão",
    backendOutdated: "É necessária a integração 8.4.0 ou superior. Versão instalada: {version}.",
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function sourceKind(value) {
  const source = String(value ?? "");
  if (source.startsWith("TV App · ")) return "tv_app";
  if (source.startsWith("Cast · ")) return "cast_app";
  if (source.startsWith("Input · ")) return "input";
  return "other";
}

function displaySource(value) {
  return String(value ?? "")
    .replace(/^TV App · /, "")
    .replace(/^Cast · /, "")
    .replace(/^Input · /, "");
}

function versionAtLeast(value, minimum) {
  const parse = (input) => String(input ?? "")
    .replace(/^v/i, "")
    .split(".")
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10));
  const current = parse(value);
  const required = parse(minimum);
  if (current.length < 3 || current.some((part) => !Number.isFinite(part))) return false;
  for (let index = 0; index < 3; index += 1) {
    if (current[index] > required[index]) return true;
    if (current[index] < required[index]) return false;
  }
  return true;
}

function cleanControllerTitle(value) {
  const raw = String(value ?? "");
  return raw.replace(/(?:\s+Controller)+$/i, "").trim() || raw;
}

class UnifiedTvCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = undefined;
    this._config = undefined;
    this._signature = "";
    this._draggingVolume = false;
    this._appActions = new Map();
    this._notice = undefined;
    this._noticeTimer = undefined;
  }

  disconnectedCallback() {
    clearTimeout(this._noticeTimer);
  }

  static getConfigForm() {
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: { domain: "media_player" } } },
        { name: "name", selector: { text: {} } },
        { name: "ad_skip_entity", selector: { entity: { domain: "switch" } } },
        {
          type: "grid",
          name: "",
          flatten: true,
          column_min_width: "150px",
          schema: [
            { name: "show_artwork", selector: { boolean: {} } },
            { name: "show_apps", selector: { boolean: {} } },
            { name: "show_inputs", selector: { boolean: {} } },
            { name: "show_transport", selector: { boolean: {} } },
            { name: "show_volume", selector: { boolean: {} } },
            { name: "show_power", selector: { boolean: {} } },
            { name: "show_restart", selector: { boolean: {} } },
            { name: "show_remote", selector: { boolean: {} } },
            { name: "show_diagnostics", selector: { boolean: {} } },
            { name: "show_favorites", selector: { boolean: {} } },
            { name: "show_activities", selector: { boolean: {} } },
            { name: "show_ad_skip", selector: { boolean: {} } },
            { name: "confirm_power_off", selector: { boolean: {} } },
            { name: "confirm_restart", selector: { boolean: {} } },
          ],
        },
        {
          type: "grid",
          name: "",
          flatten: true,
          column_min_width: "150px",
          schema: [
            { name: "seek_seconds", selector: { number: { min: 5, max: 120, step: 5, mode: "box" } } },
            { name: "max_favorites", selector: { number: { min: 0, max: 12, step: 1, mode: "box" } } },
          ],
        },
      ],
      computeLabel: (schema) => ({
        entity: "Controller entity",
        name: "Card title",
        ad_skip_entity: "Ad-skip switch override",
        show_artwork: "Show artwork",
        show_apps: "Show application selector",
        show_inputs: "Show input selector",
        show_transport: "Show playback controls",
        show_volume: "Show volume controls",
        show_power: "Show power control",
        show_restart: "Show restart control",
        show_remote: "Show directional remote",
        show_diagnostics: "Show diagnostics",
        show_favorites: "Show quick app buttons",
        show_activities: "Show activity selector",
        show_ad_skip: "Show YouTube ad controls",
        confirm_power_off: "Confirm power off",
        confirm_restart: "Confirm restart",
        seek_seconds: "Seek interval (seconds)",
        max_favorites: "Maximum quick app buttons",
      })[schema.name],
    };
  }

  static getStubConfig(hass) {
    const entity = Object.keys(hass?.states ?? {}).find((entityId) => {
      const state = hass.states[entityId];
      return entityId.startsWith("media_player.")
        && Array.isArray(state?.attributes?.source_list)
        && state.attributes.source_list.some((source) => /^(TV App|Cast|Input) · /.test(String(source)));
    });
    return {
      entity: entity ?? "media_player.living_room_tv_controller",
      show_artwork: true,
      show_apps: true,
      show_inputs: true,
      show_transport: true,
      show_volume: true,
      show_power: true,
      show_restart: true,
      show_remote: true,
      show_diagnostics: false,
      show_favorites: true,
      show_activities: true,
      show_ad_skip: true,
      confirm_power_off: true,
      confirm_restart: true,
      seek_seconds: 10,
      max_favorites: 6,
    };
  }

  setConfig(config) {
    if (!config?.entity || !String(config.entity).startsWith("media_player.")) {
      throw new Error("A media_player controller entity is required");
    }
    this._config = {
      show_artwork: true,
      show_apps: true,
      show_inputs: true,
      show_transport: true,
      show_volume: true,
      show_power: true,
      show_restart: true,
      show_remote: true,
      show_diagnostics: false,
      show_favorites: true,
      show_activities: true,
      show_ad_skip: true,
      confirm_power_off: true,
      confirm_restart: true,
      seek_seconds: 10,
      max_favorites: 6,
      ...config,
    };
    this._signature = "";
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return this._config?.show_remote === false ? 7 : 10;
  }

  getGridOptions() {
    return {
      columns: 12,
      min_columns: 4,
      rows: this._config?.show_remote === false ? 7 : 10,
      min_rows: 4,
    };
  }

  _language() {
    const language = this._hass?.locale?.language ?? this._hass?.language ?? "en";
    return String(language).toLowerCase().startsWith("pt") ? "pt" : "en";
  }

  _labels() {
    return LABELS[this._language()];
  }

  _state() {
    return this._hass?.states?.[this._config?.entity];
  }

  _findAdSkipEntity(state) {
    if (this._config.show_ad_skip === false) return undefined;
    const configured = String(this._config.ad_skip_entity ?? "").trim();
    if (configured && this._hass?.states?.[configured]) return configured;

    const states = this._hass?.states ?? {};
    const registry = this._hass?.entities ?? {};
    const controllerDeviceId = registry?.[this._config.entity]?.device_id;
    const physicalDeviceId = state?.attributes?.physical_device_id;
    let candidates = Object.keys(states).filter((entityId) => {
      const candidate = states[entityId];
      return entityId.startsWith("switch.")
        && candidate?.attributes?.positive_detection_only === true;
    });
    if (controllerDeviceId) {
      const sameDevice = candidates.filter(
        (entityId) => registry?.[entityId]?.device_id === controllerDeviceId,
      );
      if (sameDevice.length) candidates = sameDevice;
    } else if (physicalDeviceId) {
      const samePhysical = candidates.filter(
        (entityId) => states[entityId]?.attributes?.physical_device_id === physicalDeviceId,
      );
      if (samePhysical.length) candidates = samePhysical;
    }
    return candidates.length === 1 ? candidates[0] : undefined;
  }

  _resolveArtwork(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return undefined;
    if (/^(?:https?:)?\/\//i.test(raw) || raw.startsWith("data:")) return raw;
    try {
      return this._hass?.hassUrl ? this._hass.hassUrl(raw) : raw;
    } catch (_error) {
      return raw;
    }
  }

  _artworkUrl(attrs) {
    const sourceIds = Array.isArray(attrs?.source_entities)
      ? attrs.source_entities.map(String)
      : [];
    const sourceStates = sourceIds
      .map((entityId) => this._hass?.states?.[entityId])
      .filter(Boolean);
    const active = sourceStates.filter((candidate) =>
      ["playing", "paused", "buffering"].includes(candidate.state));
    const ordered = [
      ...active,
      ...sourceStates.filter((candidate) => !active.includes(candidate)),
    ];
    const candidates = [attrs?.entity_picture, attrs?.media_image_url];
    ordered.forEach((candidate) => {
      candidates.push(
        candidate.attributes?.entity_picture,
        candidate.attributes?.media_image_url,
      );
    });
    return this._resolveArtwork(
      candidates.find((value) => String(value ?? "").trim()),
    );
  }

  _signatureFor(state, adEntityId, adState) {
    if (!state || !this._config) return `${this._config?.entity ?? ""}:missing`;
    const attrs = state.attributes ?? {};
    const sourceArtwork = (Array.isArray(attrs.source_entities) ? attrs.source_entities : [])
      .map((entityId) => {
        const source = this._hass?.states?.[entityId];
        return [
          entityId,
          source?.state,
          source?.attributes?.entity_picture,
          source?.attributes?.media_image_url,
        ];
      });
    return JSON.stringify([
      state.state,
      attrs.friendly_name,
      attrs.media_title,
      attrs.media_artist,
      attrs.app_name,
      attrs.app_id,
      attrs.source,
      attrs.source_list,
      attrs.favorite_sources,
      attrs.activity_names,
      attrs.managed_apps,
      attrs.health,
      attrs.volume_level,
      attrs.is_volume_muted,
      attrs.entity_picture,
      attrs.media_image_url,
      attrs.supported_features,
      attrs.remote_available,
      attrs.navigation_provider,
      attrs.restart_provider,
      attrs.restart_available,
      attrs.linked_entities,
      attrs.application_providers,
      attrs.runtime_release,
      sourceArtwork,
      adEntityId,
      adState?.state,
      adState?.attributes?.last_result,
      adState?.attributes?.last_skip_at,
      this._notice,
      this._config,
    ]);
  }

  _buildAppOptions(sourceApps, managedApps, labels) {
    this._appActions = new Map();
    const options = [];
    const keys = new Set();
    const labelsByGroup = new Set();

    sourceApps.forEach((source, index) => {
      const kind = sourceKind(source);
      const id = `source-${index}`;
      const key = `${kind}:${source}`;
      if (keys.has(key)) return;
      keys.add(key);
      const group = kind === "cast_app" ? labels.castApps : labels.tvApps;
      const label = displaySource(source);
      labelsByGroup.add(`${group}:${label.toLowerCase()}`);
      this._appActions.set(id, { kind: "source", source });
      options.push({ id, label, source, group });
    });

    const supportedKinds = new Set([
      "tv_app",
      "cast_app",
      "adb_app",
      "native_source",
      "generic_app",
    ]);
    managedApps
      .filter((item) => item && item.visible !== false && supportedKinds.has(String(item.kind)))
      .sort((left, right) => Number(left.order ?? 1000) - Number(right.order ?? 1000))
      .forEach((item, index) => {
        const kind = String(item.kind);
        const appId = String(item.value ?? "");
        const label = String(item.name ?? item.default_name ?? appId).trim();
        const group = kind === "cast_app" ? labels.castApps : labels.tvApps;
        const key = `${kind}:${appId || label.toLowerCase()}`;
        const labelKey = `${group}:${label.toLowerCase()}`;
        if (!label || keys.has(key) || labelsByGroup.has(labelKey)) return;
        keys.add(key);
        labelsByGroup.add(labelKey);
        const id = `managed-${index}`;
        this._appActions.set(id, { kind, appId });
        options.push({ id, label, source: "", group });
      });
    return options;
  }

  _favoriteSources(apps, managedFavorites) {
    const configured = Array.isArray(this._config.favorites)
      ? this._config.favorites.map(String)
      : [];
    const backend = Array.isArray(managedFavorites)
      ? managedFavorites.map(String)
      : [];
    const preferred = configured.length ? configured : backend;
    const available = preferred.filter((source) => apps.includes(source));
    const max = Math.max(0, Number(this._config.max_favorites ?? 6));
    return (available.length ? available : apps).slice(0, max);
  }

  _appSelectBlock(options, activeSource, labels) {
    const disabled = options.length === 0 ? "disabled" : "";
    const placeholder = options.length === 0 ? labels.noApps : labels.selectApp;
    const groups = [...new Set(options.map((option) => option.group))];
    const optionHtml = groups.map((group) => {
      const children = options
        .filter((option) => option.group === group)
        .map((option) => `<option value="${escapeAttribute(option.id)}" ${option.source === activeSource ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
        .join("");
      return `<optgroup label="${escapeAttribute(group)}">${children}</optgroup>`;
    }).join("");
    return `<label class="select-control app-control" for="app-select"><span>${escapeHtml(labels.app)}</span><select id="app-select" ${disabled}><option value="">${escapeHtml(placeholder)}</option>${optionHtml}</select></label>`;
  }

  _selectBlock(id, label, placeholder, options, activeSource, stripPrefix = true) {
    if (!options.length) return "";
    const optionHtml = options.map((option) => `<option value="${escapeAttribute(option)}" ${option === activeSource ? "selected" : ""}>${escapeHtml(stripPrefix ? displaySource(option) : option)}</option>`).join("");
    return `<label class="select-control" for="${id}"><span>${escapeHtml(label)}</span><select id="${id}"><option value="">${escapeHtml(placeholder)}</option>${optionHtml}</select></label>`;
  }

  _iconButton(action, icon, title, extraClass = "") {
    return `<button class="icon-button ${extraClass}" data-action="${escapeAttribute(action)}" title="${escapeAttribute(title)}" aria-label="${escapeAttribute(title)}"><ha-icon icon="${escapeAttribute(icon)}"></ha-icon></button>`;
  }

  _commandButton(command, icon, title, extraClass = "") {
    return `<button class="icon-button command ${extraClass}" data-command="${escapeAttribute(command)}" title="${escapeAttribute(title)}" aria-label="${escapeAttribute(title)}"><ha-icon icon="${escapeAttribute(icon)}"></ha-icon></button>`;
  }

  _render() {
    if (!this.shadowRoot || !this._config || !this._hass) return;
    const state = this._state();
    const adEntityId = state ? this._findAdSkipEntity(state) : undefined;
    const adState = adEntityId ? this._hass.states?.[adEntityId] : undefined;
    const signature = this._signatureFor(state, adEntityId, adState);
    if (signature === this._signature && !this._draggingVolume) return;
    this._signature = signature;

    if (!state) {
      this.shadowRoot.innerHTML = `${this._styles()}<ha-card><div class="error">${escapeHtml(this._labels().noEntity)}: ${escapeHtml(this._config.entity)}</div></ha-card>`;
      return;
    }

    const labels = this._labels();
    const attrs = state.attributes ?? {};
    const sources = Array.isArray(attrs.source_list) ? attrs.source_list.map(String) : [];
    const sourceApps = sources.filter((source) => ["tv_app", "cast_app"].includes(sourceKind(source)));
    const inputs = sources.filter((source) => sourceKind(source) === "input");
    const managedApps = Array.isArray(attrs.managed_apps) ? attrs.managed_apps : [];
    const appOptions = this._buildAppOptions(sourceApps, managedApps, labels);
    const activities = Array.isArray(attrs.activity_names)
      ? attrs.activity_names.map(String).filter(Boolean)
      : [];
    const activeSource = String(attrs.source ?? "");
    const volume = Number.isFinite(Number(attrs.volume_level))
      ? Math.round(Number(attrs.volume_level) * 100)
      : 0;
    const muted = attrs.is_volume_muted === true;
    const isOff = ["off", "unavailable", "unknown"].includes(state.state);
    const title = attrs.media_title || attrs.app_name || displaySource(activeSource) || state.state;
    const subtitle = attrs.media_artist || attrs.media_album_name || attrs.app_id || "";
    const rawName = this._config.name || attrs.friendly_name || this._config.entity;
    const name = this._config.name ? rawName : cleanControllerTitle(rawName);
    const artwork = this._config.show_artwork !== false ? this._artworkUrl(attrs) : undefined;
    const health = String(attrs.health ?? (state.state === "unavailable" ? "unavailable" : "healthy"));
    const remoteAvailable = attrs.remote_available === true;
    const restartAvailable = attrs.restart_available === true || Boolean(attrs.restart_provider);
    const favorites = this._favoriteSources(sourceApps, attrs.favorite_sources);
    const adEnabled = adState?.state === "on";
    const backendRelease = String(attrs.runtime_release ?? "");
    const backendCompatible = versionAtLeast(backendRelease, "8.4.0");
    const backendWarning = backendCompatible
      ? ""
      : labels.backendOutdated.replace("{version}", backendRelease || "unknown");
    const manualAdSkipAvailable = attrs.manual_ad_skip_available === true;

    const artworkHtml = this._config.show_artwork === false
      ? ""
      : artwork
        ? `<div class="artwork" style="background-image:url('${escapeAttribute(artwork)}')"></div>`
        : `<div class="artwork placeholder"><ha-icon icon="mdi:television-play"></ha-icon></div>`;
    const appSelector = this._config.show_apps !== false
      ? this._appSelectBlock(appOptions, activeSource, labels)
      : "";
    const inputSelector = this._config.show_inputs !== false
      ? this._selectBlock("input-select", labels.input, labels.selectInput, inputs, activeSource)
      : "";
    const selectorsHtml = appSelector || inputSelector
      ? `<section class="selectors">${appSelector}${inputSelector}</section>`
      : "";

    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <ha-card>
        <div class="card ${isOff ? "is-off" : ""}">
          <header>
            <div class="identity">
              <div class="title">${escapeHtml(name)}</div>
              <div class="state health-${escapeAttribute(health)}"><span class="dot"></span>${escapeHtml(state.state)} · ${escapeHtml(health)}</div>
            </div>
            <div class="header-actions">
              ${this._config.show_restart !== false && restartAvailable ? this._iconButton("restart", "mdi:restart", labels.restart) : ""}
              ${this._config.show_power !== false ? this._iconButton("power", "mdi:power", labels.power, isOff ? "accent" : "danger") : ""}
            </div>
          </header>
          ${backendWarning ? `<div class="notice error">${escapeHtml(backendWarning)}</div>` : ""}
          ${this._notice ? `<div class="notice ${escapeAttribute(this._notice.type)}">${escapeHtml(this._notice.text)}</div>` : ""}
          <section class="now-playing ${this._config.show_artwork === false ? "without-artwork" : ""}">
            ${artworkHtml}
            <div class="media-copy">
              <div class="media-title">${escapeHtml(title)}</div>
              ${subtitle ? `<div class="media-subtitle">${escapeHtml(subtitle)}</div>` : ""}
              ${activeSource ? `<div class="media-source">${escapeHtml(activeSource)}</div>` : ""}
            </div>
          </section>
          ${this._config.show_activities !== false && activities.length ? `<section class="activity-row">${this._selectBlock("activity-select", labels.activity, labels.selectActivity, activities, "", false)}</section>` : ""}
          ${selectorsHtml}
          ${this._config.show_favorites !== false && favorites.length ? `<section class="favorites">${favorites.map((source) => `<button class="favorite" data-source="${escapeAttribute(source)}">${escapeHtml(displaySource(source))}</button>`).join("")}</section>` : ""}
          ${this._config.show_transport !== false ? `<section class="transport">${this._iconButton("previous", "mdi:skip-previous", "Previous")}${this._iconButton("rewind", "mdi:rewind-10", `-${this._config.seek_seconds}s`)}${this._iconButton("play-pause", state.state === "playing" ? "mdi:pause" : "mdi:play", state.state === "playing" ? "Pause" : "Play", "primary big")}${this._iconButton("forward", "mdi:fast-forward-10", `+${this._config.seek_seconds}s`)}${this._iconButton("next", "mdi:skip-next", "Next")}</section>` : ""}
          ${this._config.show_volume !== false ? `<section class="volume-row"><button class="icon-button mute ${muted ? "active" : ""}" data-action="mute" title="${escapeAttribute(muted ? labels.unmute : labels.mute)}" aria-label="${escapeAttribute(muted ? labels.unmute : labels.mute)}"><ha-icon icon="${muted ? "mdi:volume-off" : volume > 55 ? "mdi:volume-high" : "mdi:volume-medium"}"></ha-icon></button><input id="volume" type="range" min="0" max="100" step="1" value="${volume}" aria-label="${escapeAttribute(labels.volume)}" /><span class="volume-value">${volume}%</span></section>` : ""}
          ${adState ? `<section class="ad-skip-row"><button class="feature-toggle ${adEnabled ? "active" : ""}" data-action="toggle-ad-skip" aria-pressed="${adEnabled}" title="${escapeAttribute(labels.autoSkipAds)}"><ha-icon icon="mdi:advertisements-off"></ha-icon><span>${escapeHtml(labels.autoSkipAds)}</span><strong>${escapeHtml(adEnabled ? labels.on : labels.off)}</strong></button>${manualAdSkipAvailable ? `<button class="small-action" data-action="skip-ad-now"><ha-icon icon="mdi:skip-forward"></ha-icon><span>${escapeHtml(labels.skipNow)}</span></button>` : ""}</section>` : ""}
          ${this._config.show_remote !== false ? (remoteAvailable ? `<section class="remote"><div class="remote-top">${this._commandButton("BACK", "mdi:arrow-left", labels.back)}${this._commandButton("HOME", "mdi:home", labels.home)}${this._commandButton("SETTINGS", "mdi:cog", labels.settings)}</div><div class="dpad"><span></span>${this._commandButton("DPAD_UP", "mdi:chevron-up", "Up")}<span></span>${this._commandButton("DPAD_LEFT", "mdi:chevron-left", "Left")}${this._commandButton("DPAD_CENTER", "mdi:circle-outline", "OK", "ok")}${this._commandButton("DPAD_RIGHT", "mdi:chevron-right", "Right")}<span></span>${this._commandButton("DPAD_DOWN", "mdi:chevron-down", "Down")}<span></span></div></section>` : `<section class="remote-unavailable"><ha-icon icon="mdi:remote-off"></ha-icon><span>${escapeHtml(labels.remoteUnavailable)}</span></section>`) : ""}
          ${this._config.show_diagnostics ? `<details class="diagnostics"><summary>${escapeHtml(labels.diagnostics)}</summary><dl><dt>${escapeHtml(labels.state)}</dt><dd>${escapeHtml(state.state)}</dd><dt>${escapeHtml(labels.health)}</dt><dd>${escapeHtml(health)}</dd><dt>${escapeHtml(labels.application)}</dt><dd>${escapeHtml(attrs.app_name || attrs.app_id || "—")}</dd><dt>${escapeHtml(labels.source)}</dt><dd>${escapeHtml(activeSource || "—")}</dd><dt>${escapeHtml(labels.volume)}</dt><dd>${volume}%${muted ? " · muted" : ""}</dd>${adState ? `<dt>${escapeHtml(labels.autoSkipAds)}</dt><dd>${escapeHtml(adEnabled ? labels.on : labels.off)}</dd><dt>${escapeHtml(labels.adResult)}</dt><dd>${escapeHtml(adState.attributes?.last_result || "—")}</dd>` : ""}<dt>${escapeHtml(labels.navigationProvider)}</dt><dd>${escapeHtml(attrs.navigation_provider || "—")}</dd><dt>${escapeHtml(labels.restartProvider)}</dt><dd>${escapeHtml(attrs.restart_provider || "—")}</dd><dt>${escapeHtml(labels.linkedEntities)}</dt><dd>${escapeHtml(Array.isArray(attrs.linked_entities) && attrs.linked_entities.length ? attrs.linked_entities.join(", ") : "—")}</dd><dt>${escapeHtml(labels.applicationProviders)}</dt><dd>${escapeHtml(Array.isArray(attrs.application_providers) && attrs.application_providers.length ? attrs.application_providers.join(", ") : "—")}</dd><dt>${escapeHtml(labels.backendRelease)}</dt><dd>${escapeHtml(attrs.runtime_release || "—")}</dd><dt>${escapeHtml(labels.cardRelease)}</dt><dd>${escapeHtml(CARD_VERSION)}</dd><dt>${escapeHtml(labels.features)}</dt><dd>${escapeHtml(attrs.supported_features ?? 0)}</dd></dl></details>` : ""}
        </div>
      </ha-card>`;
    this._bindEvents(adEntityId);
  }

  _confirm(message) {
    return typeof window.confirm !== "function" || window.confirm(message);
  }

  _bindEvents(adEntityId) {
    const entityId = this._config.entity;
    this.shadowRoot.querySelectorAll("[data-action]").forEach((button) => {
      button.addEventListener("click", async () => {
        const action = button.dataset.action;
        const state = this._state();
        if (action === "power") {
          const isOff = ["off", "unavailable", "unknown"].includes(state?.state);
          if (!isOff && this._config.confirm_power_off !== false && !this._confirm(this._labels().confirmPowerOff)) return;
          await this._call("media_player", isOff ? "turn_on" : "turn_off", { entity_id: entityId });
        }
        if (action === "restart") {
          if (this._config.confirm_restart !== false && !this._confirm(this._labels().confirmRestart)) return;
          await this._call("cast_attribute_sensors", "restart_device", { entity_id: entityId });
        }
        if (action === "play-pause") await this._call("media_player", "media_play_pause", { entity_id: entityId });
        if (action === "previous") await this._call("media_player", "media_previous_track", { entity_id: entityId });
        if (action === "next") await this._call("media_player", "media_next_track", { entity_id: entityId });
        if (["rewind", "forward"].includes(action)) {
          await this._call("cast_attribute_sensors", "seek_relative", {
            entity_id: entityId,
            seconds: (action === "rewind" ? -1 : 1) * Number(this._config.seek_seconds),
          });
        }
        if (action === "mute") {
          await this._call("media_player", "volume_mute", {
            entity_id: entityId,
            is_volume_muted: this._state()?.attributes?.is_volume_muted !== true,
          });
        }
        if (action === "toggle-ad-skip" && adEntityId) {
          const enabled = this._hass.states?.[adEntityId]?.state === "on";
          await this._call("switch", enabled ? "turn_off" : "turn_on", { entity_id: adEntityId });
        }
        if (action === "skip-ad-now") {
          const ok = await this._call("cast_attribute_sensors", "skip_ad", { entity_id: entityId });
          if (ok) this._setNotice(this._labels().actionSent, "success");
        }
      });
    });

    this.shadowRoot.querySelectorAll("[data-command]").forEach((button) => {
      button.addEventListener("click", () => this._call(
        "cast_attribute_sensors",
        "send_command",
        { entity_id: entityId, command: button.dataset.command },
      ));
    });
    this.shadowRoot.querySelectorAll("[data-source]").forEach((button) => {
      button.addEventListener("click", () => this._selectSource(button.dataset.source));
    });

    const appSelect = this.shadowRoot.getElementById("app-select");
    appSelect?.addEventListener("change", async () => {
      const action = this._appActions.get(appSelect.value);
      if (!action) return;
      if (action.kind === "source") await this._selectSource(action.source);
      if (action.kind === "cast_app") {
        await this._call("cast_attribute_sensors", "launch_cast_app", {
          entity_id: entityId,
          app_id: action.appId,
        });
      }
      if (["tv_app", "adb_app", "native_source", "generic_app"].includes(action.kind)) {
        await this._call("cast_attribute_sensors", "launch_tv_app", {
          entity_id: entityId,
          app_id: action.appId,
        });
      }
    });

    const inputSelect = this.shadowRoot.getElementById("input-select");
    inputSelect?.addEventListener("change", () => {
      if (inputSelect.value) this._selectSource(inputSelect.value);
    });
    const activity = this.shadowRoot.getElementById("activity-select");
    activity?.addEventListener("change", async () => {
      if (!activity.value) return;
      await this._call("cast_attribute_sensors", "run_activity", {
        entity_id: entityId,
        activity: activity.value,
      });
      activity.value = "";
    });

    const volume = this.shadowRoot.getElementById("volume");
    if (volume) {
      volume.addEventListener("pointerdown", () => { this._draggingVolume = true; });
      volume.addEventListener("input", () => {
        const label = this.shadowRoot.querySelector(".volume-value");
        if (label) label.textContent = `${volume.value}%`;
      });
      volume.addEventListener("change", async () => {
        this._draggingVolume = false;
        await this._call("media_player", "volume_set", {
          entity_id: entityId,
          volume_level: Number(volume.value) / 100,
        });
      });
      volume.addEventListener("pointerup", () => { this._draggingVolume = false; });
    }
  }

  async _selectSource(source) {
    await this._call("media_player", "select_source", {
      entity_id: this._config.entity,
      source,
    });
  }

  async _call(domain, service, data) {
    try {
      await this._hass.callService(domain, service, data);
      return true;
    } catch (error) {
      console.error(`[Unified TV Card ${CARD_VERSION}] ${domain}.${service} failed`, error);
      const detail = String(error?.message ?? error?.body?.message ?? "").trim();
      this._setNotice(
        `${this._labels().actionFailed}: ${domain}.${service}${detail ? ` — ${detail}` : ""}`,
        "error",
      );
      return false;
    }
  }

  _setNotice(text, type) {
    this._notice = { text, type };
    this._signature = "";
    clearTimeout(this._noticeTimer);
    this._noticeTimer = setTimeout(() => {
      this._notice = undefined;
      this._signature = "";
      this._render();
    }, 5000);
    this._render();
  }

  _styles() {
    return `<style>
      :host{display:block;min-width:0}ha-card{overflow:hidden;container-type:inline-size;container-name:unified-tv}.card{--utc-accent:var(--primary-color,#03a9f4);--utc-surface:color-mix(in srgb,var(--card-background-color) 92%,var(--utc-accent) 8%);padding:18px;display:grid;gap:16px;min-width:0;box-sizing:border-box}header{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:10px}.identity{min-width:0}.title{font-size:1.2rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.state{display:flex;align-items:center;gap:6px;margin-top:3px;color:var(--secondary-text-color);text-transform:capitalize;font-size:.82rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dot{width:8px;height:8px;border-radius:50%;background:var(--success-color,#4caf50);flex:0 0 auto}.health-degraded .dot{background:var(--warning-color,#ff9800)}.health-unavailable .dot,.is-off .dot{background:var(--disabled-text-color)}.header-actions,.remote-top{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap}.icon-button{width:42px;height:42px;min-width:0;border-radius:50%;border:0;cursor:pointer;display:inline-grid;place-items:center;background:var(--secondary-background-color);color:var(--primary-text-color);transition:transform .12s ease,background .12s ease}.icon-button:hover,.small-action:hover,.feature-toggle:hover{transform:translateY(-1px);background:var(--utc-surface)}.icon-button:active,.small-action:active,.feature-toggle:active{transform:scale(.97)}.icon-button.primary{background:var(--utc-accent);color:var(--text-primary-color,white)}.icon-button.big{width:54px;height:54px}.icon-button.danger{color:var(--error-color,#f44336)}.icon-button.accent{color:var(--utc-accent)}.notice{padding:9px 12px;border-radius:10px;font-size:.82rem}.notice.error{background:color-mix(in srgb,var(--error-color) 16%,transparent);color:var(--error-color)}.notice.success{background:color-mix(in srgb,var(--success-color,#4caf50) 16%,transparent);color:var(--success-color,#4caf50)}.now-playing{display:grid;grid-template-columns:86px minmax(0,1fr);gap:14px;align-items:center}.now-playing.without-artwork{grid-template-columns:minmax(0,1fr)}.artwork{width:86px;height:86px;border-radius:14px;background-size:cover;background-position:center;background-color:var(--secondary-background-color)}.artwork.placeholder{display:grid;place-items:center;color:var(--secondary-text-color)}.artwork.placeholder ha-icon{--mdc-icon-size:38px}.media-copy{min-width:0}.media-title{font-weight:650;font-size:1.05rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.media-subtitle,.media-source{margin-top:4px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.media-source{font-size:.78rem}.selectors{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(190px,100%),1fr));gap:10px}.activity-row{display:grid}.select-control{display:grid;gap:5px;color:var(--secondary-text-color);font-size:.78rem;min-width:0}select{width:100%;max-width:100%;min-width:0;padding:10px 12px;border-radius:10px;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);font:inherit;box-sizing:border-box}.favorites{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;scrollbar-width:thin}.favorite{flex:0 0 auto;border:1px solid var(--divider-color);border-radius:999px;background:var(--secondary-background-color);color:var(--primary-text-color);padding:8px 12px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.transport{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));align-items:center;justify-items:center;gap:6px}.volume-row{display:grid;grid-template-columns:42px minmax(0,1fr) 48px;gap:10px;align-items:center}.mute.active{background:var(--utc-accent);color:var(--text-primary-color,white)}input[type=range]{width:100%;min-width:0;accent-color:var(--utc-accent)}.volume-value{text-align:right;font-variant-numeric:tabular-nums;color:var(--secondary-text-color)}.ad-skip-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}.feature-toggle,.small-action{border:1px solid var(--divider-color);border-radius:12px;background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer;display:flex;align-items:center;gap:9px;padding:9px 12px;min-width:0;transition:transform .12s ease,background .12s ease}.feature-toggle span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.feature-toggle strong{margin-left:auto;color:var(--secondary-text-color);font-size:.78rem}.feature-toggle.active{border-color:var(--utc-accent);background:color-mix(in srgb,var(--utc-accent) 16%,var(--card-background-color))}.feature-toggle.active strong{color:var(--utc-accent)}.small-action{justify-content:center}.remote{display:grid;gap:12px;padding-top:2px}.remote-unavailable{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:12px;background:var(--secondary-background-color);color:var(--secondary-text-color);font-size:.82rem}.dpad{display:grid;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(3,48px);justify-content:center;gap:4px;max-width:100%}.dpad .icon-button{width:48px;height:48px}.dpad .ok{background:var(--utc-accent);color:var(--text-primary-color,white)}.diagnostics{border-top:1px solid var(--divider-color);padding-top:12px;min-width:0}.diagnostics summary{cursor:pointer;color:var(--secondary-text-color)}.diagnostics dl{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:6px 12px;font-size:.82rem}.diagnostics dt{color:var(--secondary-text-color)}.diagnostics dd{margin:0;overflow-wrap:anywhere}.error{padding:20px;color:var(--error-color)}
      @container unified-tv (max-width:520px){.card{padding:14px;gap:14px}.now-playing{grid-template-columns:68px minmax(0,1fr)}.now-playing.without-artwork{grid-template-columns:minmax(0,1fr)}.artwork{width:68px;height:68px}.transport{gap:2px}.transport .icon-button{width:38px;height:38px}.transport .big{width:48px;height:48px}.ad-skip-row{grid-template-columns:1fr}.diagnostics dl{grid-template-columns:1fr;gap:2px}.diagnostics dd{margin-bottom:7px}}
      @container unified-tv (max-width:350px){header{grid-template-columns:1fr}.header-actions{justify-content:flex-start}.now-playing{grid-template-columns:1fr}.artwork{width:100%;height:auto;aspect-ratio:16/9}.transport .icon-button{width:34px;height:34px}.dpad{grid-template-columns:repeat(3,44px);grid-template-rows:repeat(3,44px)}.dpad .icon-button{width:44px;height:44px}}
    </style>`;
  }
}

if (!customElements.get(CARD_TAG)) {
  customElements.define(CARD_TAG, UnifiedTvCard);
}
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: "Unified TV Card",
    description: `Responsive physical-TV controller (${CARD_VERSION})`,
    preview: true,
  });
}
console.info(`%c Unified TV Card ${CARD_VERSION} `, "background:#03a9f4;color:white;font-weight:bold");
