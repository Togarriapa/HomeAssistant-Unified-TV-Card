# Changelog

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
