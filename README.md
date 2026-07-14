# Unified TV Card

A compact, helper-free Home Assistant dashboard card designed for the controller entities created by [Cast Metadata & TV Controls](https://github.com/Togarriapa/HomeAssistant-Cast-Metadata-Controls).

## Features

- Dynamic application dropdown populated from the controller's live `source_list`
- Separate physical-input dropdown
- Mute control directly beside the volume slider
- Power and restart
- Playback, previous/next, and configurable relative seeking
- Android/Google TV Home, Back, Settings, and directional pad
- Current artwork, title, artist, application, and source
- Automatically generated quick-app buttons
- Optional diagnostics
- Responsive phone, tablet, and desktop layout
- Visual dashboard editor and card-picker registration
- No helpers and no cloud dependency

## Requirements

- Home Assistant 2026.7 or newer
- [Cast Metadata & TV Controls 7.0.0 or newer](https://github.com/Togarriapa/HomeAssistant-Cast-Metadata-Controls)
- HACS Dashboard support, or manual JavaScript resource installation

## HACS installation

1. Open **HACS → Dashboard**.
2. Open the three-dot menu and select **Custom repositories**.
3. Add:

   ```text
   https://github.com/Togarriapa/HomeAssistant-Unified-TV-Card
   ```

4. Select **Dashboard** as the category.
5. Install **Unified TV Card**.
6. Refresh the browser after installation.

## Basic configuration

```yaml
type: custom:unified-tv-card
entity: media_player.living_room_tv_controller
```

## Full configuration

```yaml
type: custom:unified-tv-card
entity: media_player.living_room_tv_controller
name: Living Room TV
show_artwork: true
show_remote: true
show_diagnostics: false
show_favorites: true
seek_seconds: 10
max_favorites: 6
favorites:
  - TV App · YouTube
  - TV App · Netflix
  - Cast · YouTube
```

`favorites` values must exactly match options currently published in the controller's `source_list`. When no favourites are configured, the card shows the first available applications dynamically.

## Dynamic dropdowns

The card reads the controller's `source_list` on every Home Assistant state update:

- `TV App · ...` and `Cast · ...` are placed in the **Application** dropdown.
- `Input · ...` is placed in the **Input** dropdown.

New applications and inputs therefore appear automatically without changing the dashboard configuration.

## Remote commands

The directional pad uses the local `cast_attribute_sensors.send_command` action and standard Android TV Remote commands such as `DPAD_UP`, `DPAD_CENTER`, `BACK`, and `HOME`.

## Licence

MIT License.
