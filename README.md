# Unified TV Card

A compact, helper-free Home Assistant dashboard card designed for the controller entities created by [Cast Metadata & TV Controls](https://github.com/Togarriapa/HomeAssistant-Cast-Metadata-Controls).

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Togarriapa&repository=HomeAssistant-Unified-TV-Card&category=plugin)

## Features

- Dynamic application dropdown populated from the controller's live `source_list`
- Separate physical-input dropdown
- Dynamic activity selector populated from backend-configured activities
- Mute control directly beside the volume slider
- Backend-managed favourite applications and ordering
- Optional card-level favourite override
- Power and restart with optional confirmation
- Playback, previous/next, and configurable relative seeking
- Android/Google TV Home, Back, Settings, and directional pad
- Current artwork, title, artist, application, source, and controller health
- Optional diagnostics
- Responsive phone, tablet, and desktop layout
- Visual dashboard editor and card-picker registration
- No helpers and no cloud dependency

## Requirements

- Home Assistant 2026.7 or newer
- [Cast Metadata & TV Controls 7.2.0 or newer](https://github.com/Togarriapa/HomeAssistant-Cast-Metadata-Controls) for managed favourites and activities
- HACS Dashboard support, or manual JavaScript resource installation

## HACS installation

Use the **Open in HACS** button above, or add the repository manually:

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
show_activities: true
confirm_power_off: true
confirm_restart: true
seek_seconds: 10
max_favorites: 6
```

## Managed favourites

Configure applications in:

**Settings → Devices & services → Cast Metadata & TV Controls → Configure → Manage applications**

Applications marked as favourites appear automatically as quick buttons. Their backend-defined name, visibility, and order are also respected by the dropdown.

A card-level override is still supported:

```yaml
favorites:
  - TV App · YouTube
  - TV App · Netflix
  - Cast · YouTube
```

Card-level favourites take priority over backend favourites. Values must exactly match options published in the controller's `source_list`.

## Dynamic dropdowns

The card reads the controller on every Home Assistant state update:

- `TV App · ...` and `Cast · ...` are placed in the **Application** dropdown.
- `Input · ...` is placed in the **Input** dropdown.
- `activity_names` creates the **Activity** dropdown.

New applications, inputs, and activities therefore appear automatically without changing dashboard YAML.

## Activities

Create activities under:

**Settings → Devices & services → Cast Metadata & TV Controls → Configure → Add or replace an activity**

An activity can power on the physical device, launch an app or input, set volume, and set mute. Selecting it in the card calls `cast_attribute_sensors.run_activity` locally.

## Safety controls

The card confirms power-off and restart by default:

```yaml
confirm_power_off: true
confirm_restart: true
```

Set either option to `false` to perform that action immediately.

## Remote commands

The directional pad uses the local `cast_attribute_sensors.send_command` action and standard Android TV Remote commands such as `DPAD_UP`, `DPAD_CENTER`, `BACK`, and `HOME`.

## Licence

MIT License.
