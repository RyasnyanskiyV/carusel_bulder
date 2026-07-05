# carusel_bulder

Adobe After Effects ExtendScript tools for carousel rigs.

## Current scripts

- `photo/carusel_builder_RV_photo_v8_3.jsx` - photo/video carousel. This is the clean photo rig based on the stable v8.2 line.
- `text/carusel_builder_RV_text_v8_3.jsx` - standalone text-block carousel. It creates only the requested number of text blocks and keeps text radius in `text_control`.
- `cardsflow/cardsflow_builder_RV_v1_5.jsx` - CardsFlow-style rig with camera presets, 60 second default duration, and AE 2022-compatible update behavior.
- `hud/reference_HUD_rebuilder_RV_v1.jsx` - HUD/UI rebuild helper. It keeps the reference as a guide layer, detects clean horizontal/vertical lines via `hud/rv_hud_line_detector.py`, and creates lightweight AE shape strokes.
- `hud/dji_HUD_builder_RV_v1.jsx` - procedural DJI-style HUD builder. It creates a clean 3840 x 2160 native AE HUD from shape and text layers instead of tracing pixels.
- `hud/dji_HUD_builder_RV_v1_1.jsx` - controlled procedural DJI HUD. Adds `HUD_CONTROL`, global HUD scale/opacity, guide opacity, editable colors, and a single `HUD_FONT` constant.
- `hud/camcorder_HUD_builder_RV_v1.jsx` - procedural VHS/Hi8 camcorder HUD overlay with REC, battery, timecode, corner marks, CH1/CH2 meters, editable controls, and built-in shape-pixel text.
- `hud/svhs_camcorder_HUD_builder_RV_v1.jsx` - procedural minimal S-VHS camcorder HUD overlay with S-VHS badge, REC, tape remain, MF scale, zebra, camera readout, crosshair, and CH1/CH2 meters.
- `hud/drone_mission_HUD_builder_RV_v1.jsx` - procedural survey/mission drone HUD overlay with mission progress, mapping panels, viewfinder frame, minimap, compass, battery, satellites, and area grid.
- `hud/inspection_drone_HUD_builder_RV_v1.jsx` - procedural inspection drone HUD overlay with telemetry panels, central radar/attitude display, camera payload controls, obstacle avoidance, zoom, and signal histogram.
- `hud/canon_c70_HUD_builder_RV_v1.jsx` - procedural Canon C70-style HUD overlay with codec row, REC/media status, MF scale, frame marks, waveform monitor, exposure strip, and CH1/CH2 meters.
- `hud/clean_camera_viewfinder_HUD_builder_RV_v1.jsx` - universal clean camera viewfinder overlay without a reference image, with modern frame marks, REC/timecode, focus scale, exposure strip, audio meters, battery, histogram, and editable HUD controls.
- `hud/dslr_camera_ui_HUD_builder_RV_v1.jsx` - DSLR camera UI preset without a reference image, focused on ISO, shutter speed, aperture, battery, AF points, EV scale, RAW/WB status, and remaining shots.
- `hud/cinema_monitor_frame_HUD_builder_RV_v1.jsx` - cinema monitor frame preset without a reference image, with action/title safe areas, 2.39/1.85 guides, codec/timecode status, waveform, false color tools, and audio meters.
- `hud/minimal_rec_frame_HUD_builder_RV_v1.jsx` - premium minimal REC frame preset without a reference image, with thin corner marks, subtle safe ticks, REC/timecode, compact format/battery status, and restrained bottom lens/media readout.
- `hud/vlog_camera_frame_HUD_builder_RV_v1.jsx` - simple YouTube/vlog camera frame preset without a reference image, with friendly REC/timer, 4K status, face tracking box, mic meter, battery, stabilizer status, and compact bottom readout.
- `hud/phone_camera_vertical_HUD_builder_RV_v1.jsx` - vertical phone camera preset for Reels/Shorts without a reference image, with 2160 x 3840 comp, phone status bar, 9:16 frame, face tracking, lens selector, mic meter, battery, and mobile record controls.
- `hud/drone_basic_HUD_builder_RV_v1.jsx` - basic drone HUD preset without a reference image, focused on altitude, speed, GPS lock, satellites, RC signal, battery, compass/heading, home distance, and a small flight path map.

## Compatibility

- Adobe After Effects 2022 and newer.
- Windows and macOS ExtendScript-compatible workflow.

## Usage

Open the `.jsx` file in After Effects with `File > Scripts > Run Script File...`.

Use the photo script for image/video cards and the text script for independent rotating text blocks.
Use the CardsFlow script for the separate flow-style card layout.
Use the HUD rebuilder when automatic pixel vectorization looks too rough or too heavy.
Use the DJI HUD builder for the cleanest result when the target is the DJI/drone overlay style.

## Local status

Both current scripts were tested locally in Adobe After Effects 2022.
