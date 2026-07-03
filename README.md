# carusel_bulder

Adobe After Effects ExtendScript tools for carousel rigs.

## Current scripts

- `photo/carusel_builder_RV_photo_v8_3.jsx` - photo/video carousel. This is the clean photo rig based on the stable v8.2 line.
- `text/carusel_builder_RV_text_v8_3.jsx` - standalone text-block carousel. It creates only the requested number of text blocks and keeps text radius in `text_control`.
- `cardsflow/cardsflow_builder_RV_v1_5.jsx` - CardsFlow-style rig with camera presets, 60 second default duration, and AE 2022-compatible update behavior.
- `hud/reference_HUD_rebuilder_RV_v1.jsx` - HUD/UI rebuild helper. It keeps the reference as a guide layer, detects clean horizontal/vertical lines via `hud/rv_hud_line_detector.py`, and creates lightweight AE shape strokes.
- `hud/dji_HUD_builder_RV_v1.jsx` - procedural DJI-style HUD builder. It creates a clean 3840 x 2160 native AE HUD from shape and text layers instead of tracing pixels.
- `hud/dji_HUD_builder_RV_v1_1.jsx` - controlled procedural DJI HUD. Adds `HUD_CONTROL`, global HUD scale/opacity, guide opacity, editable colors, and a single `HUD_FONT` constant.
- `hud/camcorder_HUD_builder_RV_v1.jsx` - procedural VHS/Hi8 camcorder HUD overlay with REC, battery, timecode, corner marks, CH1/CH2 meters, and editable controls.

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
