const CARD_VERSION = "1.0.0";
const CARD_TAG = "unified-tv-card";

const LABELS = {
  en: {
    unavailable: "Unavailable",
    app: "Application",
    selectApp: "Select an app",
    input: "Input",
    selectInput: "Select an input",
    restart: "Restart",
    power: "Power",
    home: "Home",
    back: "Back",
    mute: "Mute",
    unmute: "Unmute",
    diagnostics: "Diagnostics",
    source: "Source",
    state: "State",
    application: "Application",
    volume: "Volume",
    features: "Supported features",
    noEntity: "Entity not found",
  },
  pt: {
    unavailable: "Indisponível",
    app: "Aplicação",
    selectApp: "Selecionar aplicação",
    input: "Entrada",
    selectInput: "Selecionar entrada",
    restart: "Reiniciar",
    power: "Energia",
    home: "Início",
    back: "Voltar",
    mute: "Silenciar",
    unmute: "Ativar som",
    diagnostics: "Diagnóstico",
    source: "Fonte",
    state: "Estado",
    application: "Aplicação",
    volume: "Volume",
    features: "Funcionalidades suportadas",
    noEntity: "Entidade não encontrada",
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
  if (value.startsWith("TV App · ")) return "app";
  if (value.startsWith("Cast · ")) return "app";
  if (value.startsWith("Input · ")) return "input";
  return "other";
}

function displaySource(value) {
  return value
    .replace(/^TV App · /, "")
    .replace(/^Cast · /, "")
    .replace(/^Input · /, "");
}

class UnifiedTvCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = undefined;
    this._config = undefined;
    this._signature = "";
    this._draggingVolume = false;
  }

  static getConfigForm() {
    return {
      schema: [
        { name: "entity", required: true, selector: { entity: { domain: "media_player" } } },
        { name: "name", selector: { text: {} } },
        {
          type: "grid",
          name: "",
          flatten: true,
          column_min_width: "150px",
          schema: [
            { name: "show_artwork", selector: { boolean: {} } },
            { name: "show_remote", selector: { boolean: {} } },
            { name: "show_diagnostics", selector: { boolean: {} } },
            { name: "show_favorites", selector: { boolean: {} } },
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
        show_artwork: "Show artwork",
        show_remote: "Show directional remote",
        show_diagnostics: "Show diagnostics",
        show_favorites: "Show quick app buttons",
        seek_seconds: "Seek interval (seconds)",
        max_favorites: "Maximum quick app buttons",
      })[schema.name],
    };
  }

  static getStubConfig(hass) {
    const entity = Object.keys(hass?.states ?? {}).find((entityId) => {
      const state = hass.states[entityId];
      return entityId.startsWith("media_player.") && Array.isArray(state?.attributes?.source_list) && state.attributes.source_list.some((source) => /^(TV App|Cast|Input) · /.test(String(source)));
    });
    return {
      entity: entity ?? "media_player.living_room_tv_controller",
      show_artwork: true,
      show_remote: true,
      show_diagnostics: false,
      show_favorites: true,
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
      show_remote: true,
      show_diagnostics: false,
      show_favorites: true,
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
    return this._config?.show_remote === false ? 6 : 9;
  }

  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: this._config?.show_remote === false ? 6 : 9, min_rows: 5 };
  }

  _language() {
    const language = this._hass?.locale?.language ?? this._hass?.language ?? "en";
    return String(language).toLowerCase().startsWith("pt") ? "pt" : "en";
  }

  _labels() { return LABELS[this._language()]; }
  _state() { return this._hass?.states?.[this._config?.entity]; }

  _signatureFor(state) {
    if (!state || !this._config) return `${this._config?.entity ?? ""}:missing`;
    const attrs = state.attributes ?? {};
    return JSON.stringify([state.state, attrs.friendly_name, attrs.media_title, attrs.media_artist, attrs.app_name, attrs.app_id, attrs.source, attrs.source_list, attrs.volume_level, attrs.is_volume_muted, attrs.media_position, attrs.media_duration, attrs.entity_picture, attrs.supported_features, this._config]);
  }

  _render() {
    if (!this.shadowRoot || !this._config || !this._hass) return;
    const state = this._state();
    const signature = this._signatureFor(state);
    if (signature === this._signature && !this._draggingVolume) return;
    this._signature = signature;

    if (!state) {
      this.shadowRoot.innerHTML = `${this._styles()}<ha-card><div class="error">${escapeHtml(this._labels().noEntity)}: ${escapeHtml(this._config.entity)}</div></ha-card>`;
      return;
    }

    const labels = this._labels();
    const attrs = state.attributes ?? {};
    const sources = Array.isArray(attrs.source_list) ? attrs.source_list.map(String) : [];
    const apps = sources.filter((source) => sourceKind(source) === "app");
    const inputs = sources.filter((source) => sourceKind(source) === "input");
    const activeSource = String(attrs.source ?? "");
    const volume = Number.isFinite(Number(attrs.volume_level)) ? Math.round(Number(attrs.volume_level) * 100) : 0;
    const muted = attrs.is_volume_muted === true;
    const isOff = ["off", "unavailable", "unknown"].includes(state.state);
    const title = attrs.media_title || attrs.app_name || displaySource(activeSource) || state.state;
    const subtitle = attrs.media_artist || attrs.media_album_name || attrs.app_id || "";
    const name = this._config.name || attrs.friendly_name || this._config.entity;
    const artwork = this._config.show_artwork !== false ? attrs.entity_picture : undefined;
    const favorites = this._favoriteSources(apps);

    this.shadowRoot.innerHTML = `
      ${this._styles()}
      <ha-card><div class="card ${isOff ? "is-off" : ""}">
        <header>
          <div class="identity"><div class="title">${escapeHtml(name)}</div><div class="state"><span class="dot"></span>${escapeHtml(state.state)}</div></div>
          <div class="header-actions">${this._iconButton("restart", "mdi:restart", labels.restart)}${this._iconButton("power", "mdi:power", labels.power, isOff ? "accent" : "danger")}</div>
        </header>
        <section class="now-playing">
          ${artwork ? `<div class="artwork" style="background-image:url('${escapeAttribute(artwork)}')"></div>` : `<div class="artwork placeholder"><ha-icon icon="mdi:television-play"></ha-icon></div>`}
          <div class="media-copy"><div class="media-title">${escapeHtml(title)}</div>${subtitle ? `<div class="media-subtitle">${escapeHtml(subtitle)}</div>` : ""}${activeSource ? `<div class="media-source">${escapeHtml(activeSource)}</div>` : ""}</div>
        </section>
        <section class="selectors">${this._selectBlock("app-select", labels.app, labels.selectApp, apps, activeSource)}${this._selectBlock("input-select", labels.input, labels.selectInput, inputs, activeSource)}</section>
        ${this._config.show_favorites !== false && favorites.length ? `<section class="favorites">${favorites.map((source) => `<button class="favorite" data-source="${escapeAttribute(source)}">${escapeHtml(displaySource(source))}</button>`).join("")}</section>` : ""}
        <section class="transport">${this._iconButton("previous", "mdi:skip-previous", "Previous")}${this._iconButton("rewind", "mdi:rewind-10", `-${this._config.seek_seconds}s`)}${this._iconButton("play-pause", state.state === "playing" ? "mdi:pause" : "mdi:play", state.state === "playing" ? "Pause" : "Play", "primary big")}${this._iconButton("forward", "mdi:fast-forward-10", `+${this._config.seek_seconds}s`)}${this._iconButton("next", "mdi:skip-next", "Next")}</section>
        <section class="volume-row">
          <button class="icon-button mute ${muted ? "active" : ""}" data-action="mute" title="${escapeAttribute(muted ? labels.unmute : labels.mute)}" aria-label="${escapeAttribute(muted ? labels.unmute : labels.mute)}"><ha-icon icon="${muted ? "mdi:volume-off" : volume > 55 ? "mdi:volume-high" : "mdi:volume-medium"}"></ha-icon></button>
          <input id="volume" type="range" min="0" max="100" step="1" value="${volume}" aria-label="${escapeAttribute(labels.volume)}" /><span class="volume-value">${volume}%</span>
        </section>
        ${this._config.show_remote !== false ? `<section class="remote"><div class="remote-top">${this._commandButton("BACK", "mdi:arrow-left", labels.back)}${this._commandButton("HOME", "mdi:home", labels.home)}${this._commandButton("SETTINGS", "mdi:cog", "Settings")}</div><div class="dpad"><span></span>${this._commandButton("DPAD_UP", "mdi:chevron-up", "Up")}<span></span>${this._commandButton("DPAD_LEFT", "mdi:chevron-left", "Left")}${this._commandButton("DPAD_CENTER", "mdi:circle-outline", "OK", "ok")}${this._commandButton("DPAD_RIGHT", "mdi:chevron-right", "Right")}<span></span>${this._commandButton("DPAD_DOWN", "mdi:chevron-down", "Down")}<span></span></div></section>` : ""}
        ${this._config.show_diagnostics ? `<details class="diagnostics"><summary>${escapeHtml(labels.diagnostics)}</summary><dl><dt>${escapeHtml(labels.state)}</dt><dd>${escapeHtml(state.state)}</dd><dt>${escapeHtml(labels.application)}</dt><dd>${escapeHtml(attrs.app_name || attrs.app_id || "—")}</dd><dt>${escapeHtml(labels.source)}</dt><dd>${escapeHtml(activeSource || "—")}</dd><dt>${escapeHtml(labels.volume)}</dt><dd>${volume}%${muted ? " · muted" : ""}</dd><dt>${escapeHtml(labels.features)}</dt><dd>${escapeHtml(attrs.supported_features ?? 0)}</dd></dl></details>` : ""}
      </div></ha-card>`;
    this._bindEvents();
  }

  _favoriteSources(apps) {
    const configured = Array.isArray(this._config.favorites) ? this._config.favorites.map(String) : [];
    const availableConfigured = configured.filter((source) => apps.includes(source));
    const max = Math.max(0, Number(this._config.max_favorites ?? 6));
    return (availableConfigured.length ? availableConfigured : apps).slice(0, max);
  }

  _selectBlock(id, label, placeholder, options, activeSource) {
    if (!options.length) return "";
    return `<label class="select-control" for="${id}"><span>${escapeHtml(label)}</span><select id="${id}"><option value="">${escapeHtml(placeholder)}</option>${options.map((option) => `<option value="${escapeAttribute(option)}" ${option === activeSource ? "selected" : ""}>${escapeHtml(displaySource(option))}</option>`).join("")}</select></label>`;
  }

  _iconButton(action, icon, title, extraClass = "") {
    return `<button class="icon-button ${extraClass}" data-action="${escapeAttribute(action)}" title="${escapeAttribute(title)}" aria-label="${escapeAttribute(title)}"><ha-icon icon="${escapeAttribute(icon)}"></ha-icon></button>`;
  }

  _commandButton(command, icon, title, extraClass = "") {
    return `<button class="icon-button command ${extraClass}" data-command="${escapeAttribute(command)}" title="${escapeAttribute(title)}" aria-label="${escapeAttribute(title)}"><ha-icon icon="${escapeAttribute(icon)}"></ha-icon></button>`;
  }

  _bindEvents() {
    const entityId = this._config.entity;
    this.shadowRoot.querySelectorAll("[data-action]").forEach((button) => button.addEventListener("click", async () => {
      const action = button.dataset.action;
      const state = this._state();
      if (action === "power") await this._call("media_player", ["off", "unavailable", "unknown"].includes(state?.state) ? "turn_on" : "turn_off", { entity_id: entityId });
      if (action === "restart") await this._call("cast_attribute_sensors", "restart_device", { entity_id: entityId });
      if (action === "play-pause") await this._call("media_player", "media_play_pause", { entity_id: entityId });
      if (action === "previous") await this._call("media_player", "media_previous_track", { entity_id: entityId });
      if (action === "next") await this._call("media_player", "media_next_track", { entity_id: entityId });
      if (action === "rewind" || action === "forward") await this._call("cast_attribute_sensors", "seek_relative", { entity_id: entityId, seconds: (action === "rewind" ? -1 : 1) * Number(this._config.seek_seconds) });
      if (action === "mute") await this._call("media_player", "volume_mute", { entity_id: entityId, is_volume_muted: this._state()?.attributes?.is_volume_muted !== true });
    }));
    this.shadowRoot.querySelectorAll("[data-command]").forEach((button) => button.addEventListener("click", () => this._call("cast_attribute_sensors", "send_command", { entity_id: entityId, command: button.dataset.command })));
    this.shadowRoot.querySelectorAll("[data-source]").forEach((button) => button.addEventListener("click", () => this._selectSource(button.dataset.source)));
    for (const id of ["app-select", "input-select"]) {
      const select = this.shadowRoot.getElementById(id);
      select?.addEventListener("change", () => { if (select.value) this._selectSource(select.value); });
    }
    const volume = this.shadowRoot.getElementById("volume");
    if (volume) {
      volume.addEventListener("pointerdown", () => { this._draggingVolume = true; });
      volume.addEventListener("input", () => { const label = this.shadowRoot.querySelector(".volume-value"); if (label) label.textContent = `${volume.value}%`; });
      volume.addEventListener("change", async () => { this._draggingVolume = false; await this._call("media_player", "volume_set", { entity_id: entityId, volume_level: Number(volume.value) / 100 }); });
      volume.addEventListener("pointerup", () => { this._draggingVolume = false; });
    }
  }

  async _selectSource(source) { await this._call("media_player", "select_source", { entity_id: this._config.entity, source }); }
  async _call(domain, service, data) { try { await this._hass.callService(domain, service, data); } catch (error) { console.error(`[Unified TV Card] ${domain}.${service} failed`, error); } }

  _styles() {
    return `<style>
      :host{display:block}ha-card{overflow:hidden}.card{--utc-accent:var(--primary-color,#03a9f4);--utc-surface:color-mix(in srgb,var(--card-background-color) 92%,var(--utc-accent) 8%);padding:18px;display:grid;gap:16px}header{display:flex;align-items:center;justify-content:space-between;gap:12px}.identity{min-width:0}.title{font-size:1.2rem;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.state{display:flex;align-items:center;gap:6px;margin-top:3px;color:var(--secondary-text-color);text-transform:capitalize;font-size:.82rem}.dot{width:8px;height:8px;border-radius:50%;background:var(--success-color,#4caf50)}.is-off .dot{background:var(--disabled-text-color)}.header-actions,.transport,.remote-top{display:flex;align-items:center;justify-content:center;gap:8px}.icon-button{width:42px;height:42px;border-radius:50%;border:0;cursor:pointer;display:inline-grid;place-items:center;background:var(--secondary-background-color);color:var(--primary-text-color);transition:transform .12s ease,background .12s ease}.icon-button:hover{transform:scale(1.05);background:var(--utc-surface)}.icon-button:active{transform:scale(.96)}.icon-button.primary{background:var(--utc-accent);color:var(--text-primary-color,white)}.icon-button.big{width:54px;height:54px}.icon-button.danger{color:var(--error-color,#f44336)}.icon-button.accent{color:var(--utc-accent)}.now-playing{display:grid;grid-template-columns:86px 1fr;gap:14px;align-items:center;min-width:0}.artwork{width:86px;height:86px;border-radius:14px;background-size:cover;background-position:center;background-color:var(--secondary-background-color)}.artwork.placeholder{display:grid;place-items:center;color:var(--secondary-text-color)}.artwork.placeholder ha-icon{--mdc-icon-size:38px}.media-copy{min-width:0}.media-title{font-weight:650;font-size:1.05rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.media-subtitle,.media-source{margin-top:4px;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.media-source{font-size:.78rem}.selectors{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.select-control{display:grid;gap:5px;color:var(--secondary-text-color);font-size:.78rem}select{width:100%;min-width:0;padding:10px 12px;border-radius:10px;border:1px solid var(--divider-color);background:var(--card-background-color);color:var(--primary-text-color);font:inherit}.favorites{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px;scrollbar-width:thin}.favorite{flex:0 0 auto;border:1px solid var(--divider-color);border-radius:999px;background:var(--secondary-background-color);color:var(--primary-text-color);padding:8px 12px;cursor:pointer}.transport{justify-content:space-evenly}.volume-row{display:grid;grid-template-columns:42px 1fr 48px;gap:10px;align-items:center}.mute.active{background:var(--utc-accent);color:var(--text-primary-color,white)}input[type=range]{width:100%;accent-color:var(--utc-accent)}.volume-value{text-align:right;font-variant-numeric:tabular-nums;color:var(--secondary-text-color)}.remote{display:grid;gap:12px;padding-top:2px}.dpad{display:grid;grid-template-columns:repeat(3,48px);grid-template-rows:repeat(3,48px);justify-content:center;gap:4px}.dpad .icon-button{width:48px;height:48px}.dpad .ok{background:var(--utc-accent);color:var(--text-primary-color,white)}.diagnostics{border-top:1px solid var(--divider-color);padding-top:12px}.diagnostics summary{cursor:pointer;color:var(--secondary-text-color)}.diagnostics dl{display:grid;grid-template-columns:max-content 1fr;gap:6px 12px;font-size:.82rem}.diagnostics dt{color:var(--secondary-text-color)}.diagnostics dd{margin:0;overflow-wrap:anywhere}.error{padding:20px;color:var(--error-color)}@media(max-width:520px){.card{padding:14px}.selectors{grid-template-columns:1fr}.now-playing{grid-template-columns:68px 1fr}.artwork{width:68px;height:68px}.transport{gap:4px}.transport .icon-button{width:38px;height:38px}.transport .big{width:50px;height:50px}}
    </style>`;
  }
}

if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, UnifiedTvCard);
window.customCards = window.customCards || [];
if (!window.customCards.some((card) => card.type === CARD_TAG)) {
  window.customCards.push({
    type: CARD_TAG,
    name: "Unified TV Card",
    description: "A compact TV, Cast, app, input, playback and remote controller.",
    preview: true,
    documentationURL: "https://github.com/Togarriapa/HomeAssistant-Unified-TV-Card",
    getEntitySuggestion: (hass, entityId) => {
      const state = hass.states?.[entityId];
      const sources = state?.attributes?.source_list;
      if (!entityId.startsWith("media_player.") || !Array.isArray(sources) || !sources.some((source) => /^(TV App|Cast|Input) · /.test(String(source)))) return null;
      return { config: { type: "custom:unified-tv-card", entity: entityId, show_artwork: true, show_remote: true, show_favorites: true, seek_seconds: 10 } };
    },
  });
}
console.info(`%c UNIFIED-TV-CARD %c v${CARD_VERSION} `,"color:white;background:#03a9f4;font-weight:700","color:#03a9f4;background:#eaf8ff");
