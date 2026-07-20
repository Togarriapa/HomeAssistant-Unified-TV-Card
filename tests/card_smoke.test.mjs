import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const code = fs.readFileSync("HomeAssistant-Unified-TV-Card.js", "utf8");
const registry = new Map();

class HTMLElementStub {
  attachShadow() {
    this.shadowRoot = { innerHTML: "" };
    return this.shadowRoot;
  }
}

const sandbox = {
  HTMLElement: HTMLElementStub,
  customElements: {
    define(tag, constructor) {
      registry.set(tag, constructor);
    },
    get(tag) {
      return registry.get(tag);
    },
  },
  window: { customCards: [] },
  console,
  setTimeout,
  clearTimeout,
};

vm.runInNewContext(code, sandbox, {
  filename: "HomeAssistant-Unified-TV-Card.js",
});

const Card = registry.get("unified-tv-card");
assert.ok(Card, "custom element should be registered");
assert.equal(sandbox.window.customCards.length, 1);
assert.equal(sandbox.window.customCards[0].type, "unified-tv-card");
assert.match(sandbox.window.customCards[0].description, /1\.3\.2/);

assert.throws(
  () => new Card().setConfig({}),
  /media_player controller entity is required/,
);

const stub = Card.getStubConfig({
  states: {
    "media_player.unified_tv": {
      attributes: {
        source_list: ["TV App · YouTube", "Input · HDMI 1"],
      },
    },
  },
});
assert.equal(stub.entity, "media_player.unified_tv");
assert.equal(stub.show_artwork, true);
assert.equal(stub.show_apps, true);
assert.equal(stub.show_inputs, true);
assert.equal(stub.show_transport, true);
assert.equal(stub.show_volume, true);
assert.equal(stub.show_power, true);
assert.equal(stub.show_restart, true);
assert.equal(stub.show_remote, true);

const formNames = Card.getConfigForm().schema
  .flatMap((item) => item.schema ?? [item])
  .map((item) => item.name)
  .filter(Boolean);
for (const name of [
  "show_artwork",
  "show_apps",
  "show_inputs",
  "show_transport",
  "show_volume",
  "show_power",
  "show_restart",
  "show_remote",
  "show_diagnostics",
  "show_favorites",
  "show_activities",
  "show_ad_skip",
]) {
  assert.ok(formNames.includes(name), `${name} must be editable`);
}

const configured = new Card();
configured.setConfig({
  entity: "media_player.unified_tv",
  show_artwork: false,
  show_apps: false,
  show_inputs: false,
  show_transport: false,
  show_volume: false,
  show_power: false,
  show_restart: false,
  show_remote: false,
});
assert.equal(configured._config.show_artwork, false);
assert.equal(configured._config.show_apps, false);
assert.equal(configured._config.show_inputs, false);
assert.equal(configured._config.show_transport, false);
assert.equal(configured._config.show_volume, false);
assert.equal(configured._config.show_power, false);
assert.equal(configured._config.show_restart, false);
assert.equal(configured._config.show_remote, false);

const artworkCard = new Card();
artworkCard._hass = {
  hassUrl: (path) => `https://home.example${path}`,
  states: {
    "media_player.cast_source": {
      state: "playing",
      attributes: { media_image_url: "/api/media_player_proxy/source" },
    },
  },
};
assert.equal(
  artworkCard._artworkUrl({ source_entities: ["media_player.cast_source"] }),
  "https://home.example/api/media_player_proxy/source",
);
assert.equal(
  artworkCard._resolveArtwork("https://images.example/cover.jpg"),
  "https://images.example/cover.jpg",
);

const appCard = new Card();
const appOptions = appCard._buildAppOptions(
  ["TV App · YouTube", "Cast · YouTube"],
  [
    { kind: "generic_app", value: "com.example.app", name: "Example", visible: true },
    { kind: "native_source", value: "Plex", name: "Plex", visible: true },
  ],
  { tvApps: "TV apps", castApps: "Cast apps" },
);
assert.ok(appOptions.some((option) => option.label === "Example"));
assert.ok(appOptions.some((option) => option.label === "Plex"));

assert.match(code, /remote_available === true/);
assert.match(code, /generic_app/);
assert.match(code, /navigation_provider/);
assert.match(code, /restart_available/);
assert.match(code, /const CARD_VERSION = "1\.3\.2"/);
assert.doesNotMatch(code, /Android TV Remote is not linked/);
