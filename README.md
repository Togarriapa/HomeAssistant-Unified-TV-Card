# Unified TV Card

A responsive, helper-free Home Assistant dashboard card for controller entities created by [Cast Metadata & TV Controls](https://github.com/Togarriapa/HomeAssistant-Cast-Metadata-Controls).

[![Open in HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Togarriapa&repository=HomeAssistant-Unified-TV-Card&category=plugin)

## Features

- Dynamic application dropdown grouped into **TV apps** and **Cast apps**
- Separate physical-input dropdown
- Dynamic activity selector
- Mute directly beside the volume slider
- Responsive container-based layouts for narrow and wide dashboard columns
- Backend-managed favourite applications, visibility, names, and ordering
- Power and restart with optional confirmation
- Playback, previous/next, and corrected relative seeking
- Android/Google TV Home, Back, Settings, and directional pad
- Current artwork, title, artist, application, source, and controller health
- Automatic discovery of the per-device **Auto-skip YouTube ads** switch
- Manual **Skip ad now** action when positive detection is available
- Inline action-error feedback and optional diagnostics
- Visual dashboard editor and card-picker registration
- No helpers and no cloud dependency

## Requirements

- Home Assistant 2025.12 or newer
- Cast Metadata & TV Controls 7.4.0 or newer
- Cast Metadata & TV Controls **8.2.0 is recommended** for authoritative duplicate-device merging and reliable HACS release metadata
- HACS Dashboard support, or manual JavaScript resource installation

## HACS installation

1. Open **HACS → Dashboard**.
2. Open the three-dot menu and choose **Custom repositories**.
3. Add:

   ```text
   https://github.com/Togarriapa/HomeAssistant-Unified-TV-Card
   ```

4. Select **Dashboard**.
5. Install **Unified TV Card**.
6. Hard-refresh the browser after installation.

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
show_ad_skip: true
confirm_power_off: true
confirm_restart: true
seek_seconds: 10
max_favorites: 6
```

An explicit ad-skip switch override remains available for unusual registry states:

```yaml
ad_skip_entity: switch.living_room_tv_auto_skip_youtube_ads
```

## Backend V8 and duplicate devices

Cast Metadata & TV Controls V8 keeps the controller and metadata unique-ID namespace used by V7. Existing card YAML should therefore continue referencing the same entity IDs after an upgrade.

When two card/controller entities represent one television:

1. Open **Settings → Devices & services → Cast Metadata & TV Controls**.
2. Select **Configure**.
3. Choose **Review detected physical devices**.
4. Choose **Merge duplicate physical devices**.
5. Select the duplicate controller devices and save.
6. Wait for the integration reload, then select the surviving controller in this card if Home Assistant had previously assigned a custom duplicate entity ID.

The backend migrates capability routes, managed apps, activities, command timing, and Wake-on-LAN settings onto the surviving merged device.

## Application and input dropdowns

The card reads the controller dynamically:

- `TV App · ...` appears under **TV apps**.
- `Cast · ...` appears under **Cast apps**.
- `Input · ...` appears in the separate **Input** dropdown.
- `activity_names` creates the **Activity** dropdown.

Backend-managed fallback applications are used only when the same app is not already present in the live source list. Native and Cast versions of the same service remain distinct.

## Managed favourites

Configure applications under:

**Settings → Devices & services → Cast Metadata & TV Controls → Configure → Manage applications**

Applications marked as favourites appear automatically as quick buttons. A card-level override is also supported:

```yaml
favorites:
  - TV App · YouTube
  - TV App · Netflix
  - Cast · YouTube
```

## YouTube ad controls

The card displays ad controls only when it finds the device's `Auto-skip YouTube ads` switch.

- The left control enables or disables automatic positive-detection skipping.
- **Skip ad now** invokes `cast_attribute_sensors.skip_ad`.
- Diagnostics show the switch state and last result.

The backend acts only when Cast exposes the official skip capability or Android TV ADB positively identifies a visible Skip-ad control. Unskippable ads are not bypassed.

## Activities

Create activities under:

**Settings → Devices & services → Cast Metadata & TV Controls → Configure → Add or replace an activity**

An activity can power on the device, launch an app or input, set volume, and set mute.

## Safety controls

Power-off and restart confirmation are enabled by default:

```yaml
confirm_power_off: true
confirm_restart: true
```

## Responsive layout

The card uses CSS container queries, so it responds to its actual dashboard column width rather than the overall browser viewport. App/input controls, artwork, transport, volume, ad controls, and directional controls compact automatically in narrow tiles.

## When an update does not appear

HACS follows compatible full GitHub releases. Version 1.3.0 retains the self-healing release workflow and version-consistency checks.

1. Open **HACS → Dashboard → Unified TV Card**.
2. Select **Update information**.
3. Use **Redownload** when the local repository metadata is stale.
4. Confirm it was added as category **Dashboard**.
5. Hard-refresh the browser after updating:
   - macOS: `Cmd + Shift + R`
   - Windows/Linux: `Ctrl + F5`

## Licence

MIT License.
