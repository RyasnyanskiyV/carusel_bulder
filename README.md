# carusel_bulder

Adobe After Effects ExtendScript tools for carousel rigs.

## Current scripts

- `photo/carusel_builder_RV_photo_v8_3.jsx` - photo/video carousel. This is the clean photo rig based on the stable v8.2 line.
- `text/carusel_builder_RV_text_v8_3.jsx` - standalone text-block carousel. It creates only the requested number of text blocks and keeps text radius in `text_control`.
- `cardsflow/cardsflow_builder_RV_v1_5.jsx` - CardsFlow-style rig with camera presets, 60 second default duration, and AE 2022-compatible update behavior.

## Compatibility

- Adobe After Effects 2022 and newer.
- Windows and macOS ExtendScript-compatible workflow.

## Usage

Open the `.jsx` file in After Effects with `File > Scripts > Run Script File...`.

Use the photo script for image/video cards and the text script for independent rotating text blocks.
Use the CardsFlow script for the separate flow-style card layout.

## Local status

Both current scripts were tested locally in Adobe After Effects 2022.
