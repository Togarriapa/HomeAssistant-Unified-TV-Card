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
assert.equal(stub.show_remote, true);

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
assert.equal(artworkCard._resolveArtwork("https://images.example/cover.jpg"), "https://images.example/cover.jpg");
