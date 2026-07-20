# Changelog

## 1.3.2

- Reissued the rebuilt card as a clean semantic-version transition so HACS cannot remain pinned to stale 1.3.1 release metadata.
- Replaced shell-managed release creation with `softprops/action-gh-release` and made the configured JavaScript filename the authoritative release asset.
- Added post-publication verification that the release is non-draft, non-prerelease and contains a byte-identical `HomeAssistant-Unified-TV-Card.js` asset.
- Preserved all 1.3.1 card configuration, controls, diagnostics and YAML compatibility.

## 1.3.1

- Rebuilt the card around backend capability attributes instead of rendering controls that are guaranteed to fail.
- Added working visual-editor controls for applications, inputs, transport, volume, power and restart.
- Fixed `show_artwork: false` so the artwork block is removed rather than replaced by a placeholder.
- Added support for backend generic native application kinds and routed them through the generic application service.
- Rendered the directional remote only when the backend confirms a navigation provider.
- Added navigation, restart, linked-entity, application-provider and backend/card version diagnostics.
- Preserved the existing YAML options and defaults while improving narrow-card responsiveness.
- Hardened the HACS release workflow to verify the exact JavaScript asset after upload.

## 1.3.0

- Added artwork fallback from the controller and every grouped source using both `entity_picture` and `media_image_url`.
- Resolve Home Assistant-relative artwork URLs before rendering them in the card.
- Consume the backend `remote_available` capability and replace guaranteed-failing remote buttons with a clear linked-remote warning.
- Include the actual Home Assistant service error in inline action feedback.
- Updated compatibility guidance for backend 8.2.0 remote, native-app, and artwork routing.

## 1.2.1

- Confirmed compatibility with Cast Metadata & TV Controls V8; the backend preserves the controller and metadata unique-ID namespace, so existing card configurations remain valid after physical-device merges.
- Corrected the documented Home Assistant compatibility floor from 2026.7 to 2025.12.
- Added a dependency-free frontend smoke test covering custom-element registration, required controller validation, and automatic controller suggestion.
- Added CI validation that `package.json`, `CARD_VERSION`, and the changelog describe the same version.
- Rebuilt the GitHub release workflow to create or repair a full non-draft release, refresh the downloadable JavaScript asset, verify publication, and perform a daily self-heal check so HACS reliably exposes updates.
- Added V8 duplicate-device merge and update troubleshooting guidance.

## 1.2.0

- Added automatic discovery of the backend's per-device `Auto-skip YouTube ads` switch.
- Added a responsive ad-skip toggle and a manual **Skip ad now** action.
- Added optional `ad_skip_entity` override and `show_ad_skip` visual-editor setting.
- Added English and Portuguese ad-control labels and ad diagnostics.
- Grouped the application dropdown into native TV and Cast application sections.
- Kept native and Cast versions of the same service distinct while removing duplicate fallback entries.
- Excluded ADB-only fallback applications that do not expose a guaranteed package-launch route.
- Removed repeated `Controller` suffixes from the card title.
- Added inline service-error feedback and cleaned transient timers when the card is removed.
- Extended container-query responsiveness to the new ad controls.

## 1.1.0

- Reworked responsiveness around CSS container queries so the card adapts to its actual dashboard column width instead of the browser viewport.
- Added compact layouts for narrow tiles, including smaller artwork, controls, volume layout, and directional pad.
- Made the application dropdown permanently visible.
- Added managed-application fallback, dynamic activities, backend-managed favourites, health status, and safety confirmations.

## 1.0.0

- Initial HACS Dashboard release with dynamic app/input selection, mute beside volume, playback, remote navigation, artwork, diagnostics, responsive styling, and visual-editor support.
