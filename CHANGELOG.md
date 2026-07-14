# Changelog

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
- Added a managed-application fallback when the controller temporarily exposes inputs but no application entries in `source_list`.
- Added a dynamic activity selector sourced from the controller's configured `activity_names`.
- Added automatic quick-app favourites from the backend-managed `favorite_sources` attribute.
- Retained optional card-level favourites as an override.
- Added controller health status to the header and diagnostics.
- Added optional confirmation before power-off and restart actions.
- Added visual-editor settings for activities and safety confirmations.
- Kept the separate input dropdown and mute control beside the volume slider.

## 1.0.0

- Initial HACS Dashboard release.
- Added a dynamic application dropdown sourced from the controller entity.
- Added a separate physical-input dropdown.
- Added mute directly beside the volume slider.
- Added power, restart, playback, previous/next, and relative-seek controls.
- Added Android/Google TV Home, Back, Settings, and directional-pad commands.
- Added artwork, metadata, quick applications, diagnostics, responsive styling, a visual editor, and Home Assistant card-picker registration.
