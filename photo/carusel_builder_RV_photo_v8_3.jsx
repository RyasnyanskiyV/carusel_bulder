#target aftereffects
#targetengine "CaruselBuilderRVPhotoV83"

/*
    carusel_builder_RV Photo v8.3
    ExtendScript for Adobe After Effects 2022+

    Design goals:
    - one clean panel for circular and linear carousel builds
    - photo/video card carousel only, no separate text-block rig
    - self-contained script with no external runtime dependency
    - preserve the stable v7.3.5 circular engine and v7.5.2 linear engine
    - keep UI language simple and predictable on macOS and Windows
*/

(function CaruselBuilderRVPhotoV83(thisObj) {
    var VERSION = "Photo 8.3";
    var FILM_SIZE_MM = 36;
    var CAMERA_PRESETS = [15, 20, 24, 28, 35, 50, 80, 100, 135, 200];
    var TYPE_CIRCULAR = "Circular carousel";
    var TYPE_LINEAR = "Linear carousel";

    // Keep the proven circular builder in its own private scope.
    function createCircularModule() {

    var VERSION = "7.3.5";
    var FILM_SIZE_MM = 36;
    var BASE_FOCAL_LENGTH_MM = 35;
    var MAX_CARD_SLOTS = 40;
    var CAMERA_PRESETS = [15, 20, 24, 28, 35, 50, 80, 100, 135, 200];

    var MOVE_CTRL = "main_control";
    var CARD_CTRL = "card_control";
    var LEGACY_CARD_CTRL = "card contol";
    var PHS_NAME = "PHS";
    var AUDIO_COMP_NAME = "audio";
    var AUDIO_LAYER_NAME = "audio";
    var CAMERA_NAME = "CR_CAMERA";
    var RIG_NAME = "CR_RIG";
    var SLIDE_ID = "CR Slide ID";
    var LEGACY_SLIDE_ID = "KR Slide ID";
    var DEPTH_AMOUNT = "CR Depth Amount";

    var FX_AUTO_RADIUS = "Auto Radius";
    var FX_SLIDE_COUNT = "Slide Count";
    var FX_SLIDE_INDEX = "Slide Index";
    var FX_PROGRESS = "Progress (%)";
    var FX_RADIUS = "Radius";
    var FX_RADIUS_OFFSET = "Radius Offset";
    var FX_ORBIT = "Orbit Rotation";
    var FX_CONSTANT_SPEED = "Constant Speed";
    var FX_SPEED = "Speed";
    var FX_CAMERA_DISTANCE_Z = "Camera Distance Z";
    var FX_AXIS = "Carousel Axis";
    var FX_TILT_X = "Tilt X";
    var FX_TILT_Y = "Tilt Y";
    var FX_TILT_Z = "Tilt Z";
    var FX_GLOBAL_SCALE = "Global Scale (%)";
    var FX_FAR_SCALE = "Far Scale (%)";
    var FX_POLYGON = "Polygon Orientation";
    var FX_SCALE_RADIUS = "Scale Cards With Radius";
    var FX_DEPTH_TILT_AXIS = "Depth Tilt Axis";
    var FX_DEPTH_CURVE = "Depth Tilt Curve";
    var FX_DEPTH_TILT_ANGLE = "Depth Tilt Angle";
    var FX_DEPTH_TILT_DIRECTION = "Depth Tilt Direction";

    var FX_CARD_ORIENTATION = "Card Orientation";
    var FX_CARD_W = "Card Width (px)";
    var FX_CARD_H = "Card Height (px)";
    var FX_CARD_RADIUS = "Card Radius (px)";
    var FX_CARD_FILL = "Card Fill";
    var FX_STROKE = "Stroke";
    var FX_STROKE_W = "Stroke Width";
    var FX_STROKE_NEAR = "Stroke Near";
    var FX_STROKE_W_NEAR = "Stroke Near Width";
    var FX_STROKE_REACTION = "Stroke Reaction Depth (%)";
    var FX_PHOTO_PAD_X = "Photo Pad X (px)";
    var FX_PHOTO_PAD_Y = "Photo Pad Y (px)";
    var FX_PHOTO_RADIUS = "Photo Radius (%)";
    var FX_SHOW_TEXT = "Show Text";
    var FX_TEXT_FILL = "Text Fill";
    var FX_TEXT_SIZE = "Text Size";
    var FX_TEXT_X = "Text X";
    var FX_TEXT_Y = "Text Y";

    function clamp(v, minV, maxV) {
        return Math.max(minV, Math.min(maxV, v));
    }

    function pad2(n) {
        return n < 10 ? "0" + n : String(n);
    }

    function ensureProject() {
        if (!app.project) app.newProject();
        return app.project;
    }

    function makePanel(thisObj) {
        var w = thisObj instanceof Panel
            ? thisObj
            : new Window(
                "palette",
                "carusel_builder_RV v" + VERSION,
                undefined,
                { resizeable: true }
            );
        w.orientation = "column";
        w.alignChildren = ["fill", "top"];

        var setup = w.add("panel", undefined, "Setup");
        setup.orientation = "column";
        setup.alignChildren = ["fill", "top"];

        var countRow = setup.add("group");
        countRow.add("statictext", undefined, "Cards:");
        var count = countRow.add("edittext", undefined, "8");
        count.characters = 7;

        var orientationRow = setup.add("group");
        orientationRow.add("statictext", undefined, "Main composition:");
        var orientation = orientationRow.add(
            "dropdownlist",
            undefined,
            ["Horizontal 3840 x 2160", "Vertical 2160 x 3840"]
        );
        orientation.selection = orientation.items[0];

        var durationRow = setup.add("group");
        durationRow.add("statictext", undefined, "Duration (seconds):");
        var duration = durationRow.add("edittext", undefined, "15");
        duration.characters = 7;

        var cardRow = setup.add("group");
        cardRow.add("statictext", undefined, "Card comp:");
        var cardW = cardRow.add("edittext", undefined, "1920");
        cardW.characters = 7;
        cardRow.add("statictext", undefined, "x");
        var cardH = cardRow.add("edittext", undefined, "1080");
        cardH.characters = 7;

        var importMedia = setup.add("checkbox", undefined, "Import photos/videos now");
        importMedia.value = false;

        var polygon = setup.add("checkbox", undefined, "Start with polygon orientation");
        polygon.value = false;

        var scaleWithRadius = setup.add(
            "checkbox",
            undefined,
            "Scale cards when radius changes"
        );
        scaleWithRadius.value = false;

        var showText = setup.add(
            "checkbox",
            undefined,
            "Add card text"
        );
        showText.value = true;

        var note = setup.add(
            "statictext",
            undefined,
            "Creates exactly the requested number of cards. Slide Count redistributes created cards.",
            { multiline: true }
        );
        note.preferredSize.width = 430;

        var cameraPanel = w.add("panel", undefined, "Camera");
        cameraPanel.orientation = "column";
        cameraPanel.alignChildren = ["fill", "top"];

        var cameraNameRow = cameraPanel.add("group");
        cameraNameRow.add("statictext", undefined, "Name:");
        var cameraName = cameraNameRow.add(
            "edittext",
            undefined,
            CAMERA_NAME
        );
        cameraName.characters = 18;
        cameraName.enabled = false;

        var lensRow = cameraPanel.add("group");
        lensRow.add("statictext", undefined, "Lens preset:");
        var lensItems = [];
        for (var lensIndex = 0;
            lensIndex < CAMERA_PRESETS.length;
            lensIndex++) {
            lensItems.push(CAMERA_PRESETS[lensIndex] + " mm");
        }
        var lensPreset = lensRow.add(
            "dropdownlist",
            undefined,
            lensItems
        );
        lensPreset.selection = lensPreset.items[5];

        var zoomInfo = cameraPanel.add(
            "statictext",
            undefined,
            "Zoom: automatic"
        );

        var depthOfField = cameraPanel.add(
            "checkbox",
            undefined,
            "Enable Depth of Field"
        );
        depthOfField.value = false;

        var focusCenter = cameraPanel.add(
            "checkbox",
            undefined,
            "Focus on carousel center"
        );
        focusCenter.value = true;

        var focusRow = cameraPanel.add("group");
        focusRow.add("statictext", undefined, "Focus distance:");
        var focusDistance = focusRow.add("edittext", undefined, "2500");
        focusDistance.characters = 9;
        focusRow.add("statictext", undefined, "px");

        var fStopRow = cameraPanel.add("group");
        fStopRow.add("statictext", undefined, "F-Stop:");
        var fStop = fStopRow.add("edittext", undefined, "5.6");
        fStop.characters = 7;

        var apertureRow = cameraPanel.add("group");
        apertureRow.add("statictext", undefined, "Aperture:");
        var aperture = apertureRow.add("edittext", undefined, "8.93");
        aperture.characters = 7;
        apertureRow.add("statictext", undefined, "mm");

        var blurRow = cameraPanel.add("group");
        blurRow.add("statictext", undefined, "Blur Level:");
        var blurLevel = blurRow.add("edittext", undefined, "100");
        blurLevel.characters = 7;
        blurRow.add("statictext", undefined, "%");

        function selectedFocalLength() {
            var selectedIndex = lensPreset.selection
                ? lensPreset.selection.index
                : 5;
            return CAMERA_PRESETS[selectedIndex];
        }

        function updateCameraUi() {
            var focalLength = selectedFocalLength();
            var compWidth = orientation.selection.index === 1
                ? 2160
                : 3840;
            var zoom = compWidth * focalLength / FILM_SIZE_MM;
            zoomInfo.text = "Zoom: " + zoom.toFixed(2) + " px";

            focusCenter.enabled = depthOfField.value;
            focusRow.enabled =
                depthOfField.value && !focusCenter.value;
            fStopRow.enabled = depthOfField.value;
            apertureRow.enabled = depthOfField.value;
            blurRow.enabled = depthOfField.value;
        }

        function uiNumber(field, fallback, minValue, maxValue) {
            var value = parseFloat(field.text);
            if (isNaN(value)) value = fallback;
            return clamp(value, minValue, maxValue);
        }

        function syncApertureFromFStop() {
            var focalLength = selectedFocalLength();
            var parsedFStop = uiNumber(fStop, 5.6, 0.1, 128);
            aperture.text = (
                focalLength / parsedFStop
            ).toFixed(2);
        }

        function syncFStopFromAperture() {
            var focalLength = selectedFocalLength();
            var parsedAperture = uiNumber(
                aperture,
                focalLength / 5.6,
                0.01,
                10000
            );
            fStop.text = (
                focalLength / parsedAperture
            ).toFixed(2);
        }

        function applyCameraUiToActiveComp() {
            var comp = app.project ? app.project.activeItem : null;
            if (!(comp instanceof CompItem)) return false;

            var camera = comp.layer(CAMERA_NAME) ||
                comp.layer("KR_CAMERA");
            if (!camera) return false;

            try {
                var focalLength = selectedFocalLength();
                var parsedAperture = uiNumber(
                    aperture,
                    focalLength / 5.6,
                    0.01,
                    10000
                );
                var parsedFocus = uiNumber(
                    focusDistance,
                    2500,
                    1,
                    1000000
                );
                var parsedBlur = uiNumber(
                    blurLevel,
                    100,
                    0,
                    1000
                );
                var cameraOptions = camera.property(
                    "ADBE Camera Options Group"
                );
                var transform = camera.property(
                    "ADBE Transform Group"
                );

                cameraOptions.property("ADBE Camera Zoom").setValue(
                    comp.width * focalLength / FILM_SIZE_MM
                );
                cameraOptions.property(
                    "ADBE Camera Depth of Field"
                ).setValue(depthOfField.value ? 1 : 0);
                cameraOptions.property("ADBE Camera Aperture").setValue(
                    parsedAperture
                );
                cameraOptions.property("ADBE Camera Blur Level").setValue(
                    parsedBlur
                );

                if (focusCenter.value && transform) {
                    var cameraPosition = transform.property(
                        "ADBE Position"
                    ).value;
                    var pointOfInterest = transform.property(
                        "ADBE Anchor Point"
                    );
                    if (!pointOfInterest) {
                        pointOfInterest = transform.property(
                            "Point of Interest"
                        );
                    }
                    if (pointOfInterest) {
                        var target = pointOfInterest.value;
                        var dx = cameraPosition[0] - target[0];
                        var dy = cameraPosition[1] - target[1];
                        var dz = cameraPosition[2] - target[2];
                        parsedFocus = Math.sqrt(
                            dx * dx + dy * dy + dz * dz
                        );
                    }
                }
                cameraOptions.property(
                    "ADBE Camera Focus Distance"
                ).setValue(parsedFocus);

                if (status) {
                    status.text =
                        CAMERA_NAME + " updated: " +
                        focalLength + " mm";
                }
                return true;
            } catch (cameraUiError) {
                if (status) status.text = "Camera update error";
                return false;
            }
        }

        function updateAndApplyCameraUi() {
            updateCameraUi();
            applyCameraUiToActiveComp();
        }

        lensPreset.onChange = function () {
            syncApertureFromFStop();
            updateAndApplyCameraUi();
        };
        orientation.onChange = updateCameraUi;
        depthOfField.onClick = updateAndApplyCameraUi;
        focusCenter.onClick = updateAndApplyCameraUi;
        fStop.onChanging = function () {
            syncApertureFromFStop();
            updateCameraUi();
        };
        fStop.onChange = function () {
            syncApertureFromFStop();
            updateAndApplyCameraUi();
        };
        aperture.onChanging = syncFStopFromAperture;
        aperture.onChange = function () {
            syncFStopFromAperture();
            updateAndApplyCameraUi();
        };
        focusDistance.onChange = updateAndApplyCameraUi;
        blurLevel.onChange = updateAndApplyCameraUi;
        updateCameraUi();

        var buttons = w.add("group");
        buttons.alignment = "right";
        var createButton = buttons.add("button", undefined, "Create Carousel");
        var updateButton = buttons.add(
            "button",
            undefined,
            "Update Active"
        );
        var resetButton = buttons.add(
            "button",
            undefined,
            "Reset Active"
        );

        var maintenanceButtons = w.add("group");
        maintenanceButtons.alignment = "right";
        var addCardsButton = maintenanceButtons.add(
            "button",
            undefined,
            "Add Cards"
        );
        var replaceMediaButton = maintenanceButtons.add(
            "button",
            undefined,
            "Replace Media"
        );
        var cleanCheckButton = maintenanceButtons.add(
            "button",
            undefined,
            "Clean/Check"
        );

        var status = w.add("statictext", undefined, "Ready");
        status.alignment = ["fill", "top"];

        return {
            win: w,
            count: count,
            orientation: orientation,
            duration: duration,
            cardW: cardW,
            cardH: cardH,
            importMedia: importMedia,
            polygon: polygon,
            scaleWithRadius: scaleWithRadius,
            showText: showText,
            lensPreset: lensPreset,
            depthOfField: depthOfField,
            focusCenter: focusCenter,
            focusDistance: focusDistance,
            fStop: fStop,
            aperture: aperture,
            blurLevel: blurLevel,
            createButton: createButton,
            updateButton: updateButton,
            resetButton: resetButton,
            addCardsButton: addCardsButton,
            replaceMediaButton: replaceMediaButton,
            cleanCheckButton: cleanCheckButton,
            status: status
        };
    }

    function nextInstanceNumber(proj) {
        var maxId = 0;
        var mainRe = /^MAIN_(\d+)$/;
        var legacyMainRe = /^(?:CR|KR|CL)_MAIN_(\d+)$/;
        var rootRe = /^CARRIG_CYLINDER_(\d+)$/;
        for (var i = 1; i <= proj.numItems; i++) {
            var item = proj.item(i);
            var match = mainRe.exec(item.name) ||
                legacyMainRe.exec(item.name) ||
                rootRe.exec(item.name);
            if (match) maxId = Math.max(maxId, parseInt(match[1], 10) || 0);
        }
        return maxId + 1;
    }

    function addFolder(proj, name, parent) {
        var folder = proj.items.addFolder(name);
        if (parent) folder.parentFolder = parent;
        return folder;
    }

    function findChildFolder(proj, parent, name) {
        if (!proj || !parent) return null;
        for (var i = 1; i <= proj.numItems; i++) {
            var item = proj.item(i);
            if (item instanceof FolderItem &&
                item.parentFolder === parent &&
                item.name === name) {
                return item;
            }
        }
        return null;
    }

    function ensureChildFolder(proj, parent, name) {
        var folder = findChildFolder(proj, parent, name);
        if (folder) return folder;
        return addFolder(proj, name, parent);
    }

    function rootFolderForMain(main) {
        if (!main || !main.parentFolder) return null;
        return main.parentFolder.parentFolder || null;
    }

    function itemIsInFolderTree(item, root) {
        if (!item || !root) return false;
        var folder = item.parentFolder;
        while (folder) {
            if (folder === root) return true;
            folder = folder.parentFolder;
        }
        return false;
    }

    function addAudioComp(proj, folder, main) {
        var audioComp = proj.items.addComp(
            AUDIO_COMP_NAME,
            main.width,
            main.height,
            1,
            main.duration,
            main.frameRate
        );
        if (folder) audioComp.parentFolder = folder;
        return audioComp;
    }

    function findPHSLayer(main) {
        if (!main) return null;
        try {
            var direct = main.layer(PHS_NAME);
            if (direct && direct.source instanceof CompItem) return direct;
        } catch (ignoredDirect) {
        }
        for (var i = 1; i <= main.numLayers; i++) {
            var layer = main.layer(i);
            try {
                if (layer.source instanceof CompItem &&
                    layer.source.name === PHS_NAME) {
                    return layer;
                }
            } catch (ignoredLayer) {
            }
        }
        return null;
    }

    function slideHostComp(main) {
        var phsLayer = findPHSLayer(main);
        return phsLayer && phsLayer.source instanceof CompItem
            ? phsLayer.source
            : main;
    }

    function enableCollapse(layer, issues) {
        if (!layer) return;
        try {
            layer.threeDLayer = true;
            layer.collapseTransformation = true;
        } catch (err) {
            if (issues) {
                issues.push(layer.name + " collapse: " + err.toString());
            }
        }
    }

    function attachPHSLayerToRig(main, phsLayer, issues) {
        if (!main || !phsLayer) return;
        var rig = null;
        try {
            rig = main.layer(RIG_NAME) || main.layer("KR_RIG");
        } catch (ignoredRig) {
            rig = null;
        }
        try {
            phsLayer.threeDLayer = true;
            if (rig) {
                phsLayer.parent = rig;
                phsLayer.property("ADBE Transform Group")
                    .property("ADBE Position")
                    .setValue([0, 0, 0]);
                phsLayer.property("ADBE Transform Group")
                    .property("ADBE Anchor Point")
                    .setValue([
                        phsLayer.source.width * 0.5,
                        phsLayer.source.height * 0.5,
                        0
                    ]);
            }
        } catch (err) {
            if (issues) {
                issues.push(PHS_NAME + " parent: " + err.toString());
            }
        }
    }

    function retargetNestedSlideExpressions(phs, mainName, issues) {
        if (!phs) return;
        migrateCompExpressions(
            phs,
            [
                [
                    'thisComp.layer("' + MOVE_CTRL + '")',
                    'comp("' + mainName + '").layer("' + MOVE_CTRL + '")'
                ],
                [
                    'thisComp.layer("' + CARD_CTRL + '")',
                    'comp("' + mainName + '").layer("' + CARD_CTRL + '")'
                ],
                [
                    'thisComp.layer("' + LEGACY_CARD_CTRL + '")',
                    'comp("' + mainName + '").layer("' + CARD_CTRL + '")'
                ],
                [
                    'thisComp.layer("' + CAMERA_NAME + '")',
                    'comp("' + mainName + '").layer("' + CAMERA_NAME + '")'
                ],
                [
                    'thisComp.layer("KR_CAMERA")',
                    'comp("' + mainName + '").layer("' + CAMERA_NAME + '")'
                ]
            ],
            issues
        );
    }

    function placePHSLayer(main, phsLayer) {
        if (!main || !phsLayer) return;
        var audioLayer = findAudioLayer(main);
        var cardCtrl = main.layer(CARD_CTRL) ||
            main.layer(LEGACY_CARD_CTRL);
        var moveCtrl = main.layer(MOVE_CTRL);

        if (audioLayer) {
            phsLayer.moveAfter(audioLayer);
        } else if (cardCtrl) {
            phsLayer.moveAfter(cardCtrl);
        } else if (moveCtrl) {
            phsLayer.moveAfter(moveCtrl);
        }
        attachPHSLayerToRig(main, phsLayer, null);
    }

    function precomposeSlidesIntoPHS(main, issues) {
        var existing = findPHSLayer(main);
        if (existing && existing.source instanceof CompItem) {
            existing.name = PHS_NAME;
            existing.source.name = PHS_NAME;
            enableCollapse(existing, issues);
            retargetNestedSlideExpressions(existing.source, main.name, issues);
            refreshSlideRuntimeExpressions(
                collectRigSlides(main),
                issues,
                main.name,
                true
            );
            placePHSLayer(main, existing);
            return existing.source;
        }

        var slides = collectRigSlides(main);
        if (slides.length === 0) return null;

        var indices = [];
        for (var i = 0; i < slides.length; i++) {
            indices.push(slides[i].layer.index);
        }

        var phs = null;
        try {
            phs = main.layers.precompose(indices, PHS_NAME, true);
            phs.name = PHS_NAME;
            phs.parentFolder = main.parentFolder;
        } catch (err) {
            issues.push("PHS precompose: " + err.toString());
            return null;
        }

        var phsLayer = findPHSLayer(main);
        if (phsLayer) {
            phsLayer.name = PHS_NAME;
            enableCollapse(phsLayer, issues);
            placePHSLayer(main, phsLayer);
        }
        retargetNestedSlideExpressions(phs, main.name, issues);
        refreshSlideRuntimeExpressions(
            collectRigSlides(main),
            issues,
            main.name,
            true
        );
        return phs;
    }

    function removeBackgroundLayer(main) {
        if (!main) return;
        try {
            var bg = main.layer("BG_MAIN");
            if (bg) bg.remove();
        } catch (ignored) {
        }
    }

    function addSlider(fx, name, value) {
        var effect = fx.addProperty("ADBE Slider Control");
        effect.name = name;
        effect.property(1).setValue(value);
        return effect;
    }

    function addAngle(fx, name, value) {
        var effect = fx.addProperty("ADBE Angle Control");
        effect.name = name;
        effect.property(1).setValue(value);
        return effect;
    }

    function addCheckbox(fx, name, checked) {
        var effect = fx.addProperty("ADBE Checkbox Control");
        effect.name = name;
        effect.property(1).setValue(checked ? 1 : 0);
        return effect;
    }

    function addColor(fx, name, value) {
        var effect = fx.addProperty("ADBE Color Control");
        effect.name = name;
        effect.property(1).setValue(value);
        return effect;
    }

    function addDropdown(fx, name, items, defaultIndex) {
        var effect = fx.addProperty("ADBE Dropdown Control");
        effect.name = name;

        var menu = effect.property(1);
        var configuredMenu = menu.setPropertyParameters(items);
        var configuredEffect = configuredMenu.propertyGroup(1);
        configuredEffect.name = name;
        configuredMenu.setValue(clamp(defaultIndex, 1, items.length));
        return configuredEffect;
    }

    function findEffect(layer, names) {
        if (!layer) return null;
        var fx = layer.property("ADBE Effect Parade");
        if (!fx) return null;
        for (var i = 0; i < names.length; i++) {
            var effect = fx.property(names[i]);
            if (effect) return effect;
        }
        return null;
    }

    function ensureSliderEffect(layer, name, value, legacyNames) {
        var names = [name];
        if (legacyNames) {
            for (var i = 0; i < legacyNames.length; i++) {
                names.push(legacyNames[i]);
            }
        }

        var effect = findEffect(layer, names);
        if (effect) {
            effect.name = name;
            return effect;
        }
        return addSlider(
            layer.property("ADBE Effect Parade"),
            name,
            value
        );
    }

    function ensureAngleEffect(layer, name, value, legacyNames) {
        var names = [name];
        if (legacyNames) {
            for (var i = 0; i < legacyNames.length; i++) {
                names.push(legacyNames[i]);
            }
        }

        var effect = findEffect(layer, names);
        if (effect) {
            effect.name = name;
            return effect;
        }
        return addAngle(
            layer.property("ADBE Effect Parade"),
            name,
            value
        );
    }

    function ensureCheckboxEffect(layer, name, checked, legacyNames) {
        var names = [name];
        if (legacyNames) {
            for (var i = 0; i < legacyNames.length; i++) {
                names.push(legacyNames[i]);
            }
        }

        var effect = findEffect(layer, names);
        if (effect) {
            effect.name = name;
            return effect;
        }
        return addCheckbox(
            layer.property("ADBE Effect Parade"),
            name,
            checked
        );
    }

    function ensureColorEffect(layer, name, value, legacyNames) {
        var names = [name];
        if (legacyNames) {
            for (var i = 0; i < legacyNames.length; i++) {
                names.push(legacyNames[i]);
            }
        }

        var effect = findEffect(layer, names);
        if (effect) {
            effect.name = name;
            return effect;
        }
        return addColor(
            layer.property("ADBE Effect Parade"),
            name,
            value
        );
    }

    function ensureDropdownEffect(
        layer,
        name,
        items,
        defaultIndex,
        legacyNames
    ) {
        var names = [name];
        if (legacyNames) {
            for (var i = 0; i < legacyNames.length; i++) {
                names.push(legacyNames[i]);
            }
        }

        var effect = findEffect(layer, names);
        if (!effect) {
            return addDropdown(
                layer.property("ADBE Effect Parade"),
                name,
                items,
                defaultIndex
            );
        }

        effect.name = name;
        try {
            var oldValue = clamp(
                Math.round(effect.property(1).value),
                1,
                items.length
            );
            var menu = effect.property(1);
            if (menu && menu.setPropertyParameters) {
                var configuredMenu = menu.setPropertyParameters(items);
                var configuredEffect = configuredMenu.propertyGroup(1);
                configuredEffect.name = name;
                configuredMenu.setValue(oldValue);
                return configuredEffect;
            }
        } catch (dropdownError) {
        }
        return effect;
    }

    function setEffectValue(layer, name, propName, value, issues) {
        try {
            var effect = findEffect(layer, [name]);
            if (!effect) {
                if (issues) issues.push(name + ": effect not found");
                return false;
            }
            effect.property(propName).setValue(value);
            return true;
        } catch (err) {
            if (issues) issues.push(name + ": " + err.toString());
            return false;
        }
    }

    function setMenuValue(layer, name, value, issues) {
        try {
            var effect = findEffect(layer, [name]);
            if (!effect) {
                if (issues) issues.push(name + ": dropdown not found");
                return false;
            }
            effect.property(1).setValue(value);
            return true;
        } catch (err) {
            if (issues) issues.push(name + ": " + err.toString());
            return false;
        }
    }

    function getSliderValue(layer, name, fallback) {
        try {
            var effect = findEffect(layer, [name]);
            return effect ? effect.property(1).value : fallback;
        } catch (err) {
            return fallback;
        }
    }

    function getMenuValue(layer, name, fallback) {
        try {
            var effect = findEffect(layer, [name]);
            return effect ? Math.round(effect.property(1).value) : fallback;
        } catch (err) {
            return fallback;
        }
    }

    function cardMetricsExpression(
        controllerRef,
        widthExpression,
        heightExpression,
        indent
    ) {
        var p = indent || "";
        return p + 'baseW=Math.max(1,' + controllerRef + '.effect("' +
            FX_CARD_W + '")("Slider"));\n' +
            p + 'baseH=Math.max(1,' + controllerRef + '.effect("' +
            FX_CARD_H + '")("Slider"));\n' +
            p + 'cardMode=Math.round(' + controllerRef + '.effect("' +
            FX_CARD_ORIENTATION + '")(1));\n' +
            p + 'if(cardMode==2){rawW=baseH;rawH=baseW;}' +
            'else{rawW=baseW;rawH=baseH;}\n' +
            p + 'cardFit=Math.min(1,' + widthExpression +
            '/rawW,' + heightExpression + '/rawH);\n' +
            p + 'cw=rawW*cardFit;ch=rawH*cardFit;\n';
    }

    function textVisibilityExpression(mainName) {
        return 'try{\n' +
            '  c=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            '  c.effect("' + FX_SHOW_TEXT + '")("Checkbox")>0?100:0;\n' +
            '}catch(e){100};';
    }

    function assignTextVisibility(comp, mainName, issues) {
        var label = null;
        try {
            label = comp.layer("LABEL");
        } catch (err) {
            label = null;
        }
        if (!label) {
            issues.push(comp.name + ": LABEL not found");
            return false;
        }
        return assignExpression(
            label.property("ADBE Transform Group")
                .property("ADBE Opacity"),
            textVisibilityExpression(mainName),
            comp.name + " label visibility",
            issues
        );
    }

    function circularStrokeAmountExpression(mainName, compName, indent) {
        var p = indent || "";
        return p + 'mainComp=comp("' + mainName + '");\n' +
            p + 'try{slide=mainComp.layer("' + PHS_NAME + '").source.layer("' +
            compName + '");}\n' +
            p + 'catch(eSlide){slide=mainComp.layer("' + compName + '");}\n' +
            p + 'depthAmount=Math.max(0,Math.min(1,slide.effect("' +
            DEPTH_AMOUNT + '")("Slider")));\n' +
            p + 'reaction=Math.max(0.001,c.effect("' +
            FX_STROKE_REACTION + '")("Slider")/100);\n' +
            p + 'nearAmount=Math.max(0,Math.min(1,1-depthAmount/reaction));\n' +
            p + 'nearAmount=nearAmount*nearAmount*(3-2*nearAmount);\n';
    }

    function circularStrokeWidthExpression(controllerRef, mainName, compName, indent) {
        var p = indent || "";
        return circularStrokeAmountExpression(mainName, compName, p) +
            p + 'swFar=Math.max(0,' + controllerRef + '.effect("' +
            FX_STROKE_W + '")("Slider"));\n' +
            p + 'swNear=Math.max(0,' + controllerRef + '.effect("' +
            FX_STROKE_W_NEAR + '")("Slider"));\n' +
            p + 'sw=swFar+(swNear-swFar)*nearAmount;\n';
    }

    function assignCircularBorderExpressions(comp, mainName, issues) {
        var border = null;
        try {
            border = comp.layer("CARD_BORDER");
        } catch (err) {
            border = null;
        }
        if (!border) {
            issues.push(comp.name + ": CARD_BORDER not found");
            return false;
        }

        try {
            var borderRect = border.property("ADBE Root Vectors Group")
                .property(1)
                .property("ADBE Vectors Group")
                .property("ADBE Vector Shape - Rect");
            var borderStroke = border.property("ADBE Root Vectors Group")
                .property(1)
                .property("ADBE Vectors Group")
                .property("ADBE Vector Graphic - Stroke");
            var ctrlRef = 'comp("' + mainName + '").layer("' +
                CARD_CTRL + '")';
            var cardMetrics = cardMetricsExpression(
                "c",
                "thisComp.width",
                "thisComp.height",
                "  "
            );
            var strokeWidth = circularStrokeWidthExpression(
                "c",
                mainName,
                comp.name,
                "  "
            );

            assignExpression(
                borderRect.property("ADBE Vector Rect Size"),
                'try{\n' +
                '  c=' + ctrlRef + ';\n' +
                cardMetrics +
                strokeWidth +
                '  [Math.max(1,cw-sw),Math.max(1,ch-sw)];\n' +
                '}catch(e){[thisComp.width-6,thisComp.height-6]};',
                comp.name + " border size",
                issues
            );
            assignExpression(
                borderRect.property("ADBE Vector Rect Roundness"),
                'try{\n' +
                '  c=' + ctrlRef + ';\n' +
                '  r=Math.max(0,c.effect("' + FX_CARD_RADIUS + '")("Slider"));\n' +
                strokeWidth +
                '  Math.max(0,r-sw/2);\n' +
                '}catch(e){57};',
                comp.name + " border radius",
                issues
            );
            assignExpression(
                borderStroke.property("ADBE Vector Stroke Color"),
                'try{\n' +
                '  c=' + ctrlRef + ';\n' +
                circularStrokeAmountExpression(mainName, comp.name, "  ") +
                '  far=c.effect("' + FX_STROKE + '")("Color");\n' +
                '  near=c.effect("' + FX_STROKE_NEAR + '")("Color");\n' +
                '  [far[0]+(near[0]-far[0])*nearAmount,' +
                'far[1]+(near[1]-far[1])*nearAmount,' +
                'far[2]+(near[2]-far[2])*nearAmount,1];\n' +
                '}catch(e){[0.25,0.25,0.27,1]};',
                comp.name + " stroke color",
                issues
            );
            assignExpression(
                borderStroke.property("ADBE Vector Stroke Width"),
                'try{\n' +
                '  c=' + ctrlRef + ';\n' +
                strokeWidth +
                '  sw;\n' +
                '}catch(e){6};',
                comp.name + " stroke width",
                issues
            );
            return true;
        } catch (err) {
            issues.push(comp.name + " border update: " + err.toString());
            return false;
        }
    }

    function addMovementController(
        comp,
        initialCount,
        initialRadius,
        initialCameraDistanceZ,
        polygonDefault,
        scaleWithRadiusDefault
    ) {
        var ctrl = comp.layers.addNull();
        ctrl.name = MOVE_CTRL;
        ctrl.label = 10;
        ctrl.property("ADBE Transform Group").property("ADBE Position")
            .setValue([comp.width * 0.5, 70]);

        var fx = ctrl.property("ADBE Effect Parade");
        addCheckbox(fx, FX_AUTO_RADIUS, true);
        addSlider(fx, FX_SLIDE_COUNT, initialCount);
        addSlider(fx, FX_SLIDE_INDEX, 1);
        addSlider(fx, FX_PROGRESS, 0);
        addSlider(fx, FX_RADIUS, Math.round(initialRadius));
        addSlider(fx, FX_RADIUS_OFFSET, 0);
        addAngle(fx, FX_ORBIT, 180);
        addCheckbox(fx, FX_CONSTANT_SPEED, false);
        addSlider(fx, FX_SPEED, 0);
        addSlider(
            fx,
            FX_CAMERA_DISTANCE_Z,
            Math.round(Math.abs(initialCameraDistanceZ || 2500))
        );
        addDropdown(
            fx,
            FX_AXIS,
            ["Y - circle in XZ", "Z - circle in XY", "X - circle in YZ"],
            1
        );
        addAngle(fx, FX_TILT_X, 0);
        addAngle(fx, FX_TILT_Y, 0);
        addAngle(fx, FX_TILT_Z, 0);
        addSlider(fx, FX_GLOBAL_SCALE, 100);
        addSlider(fx, FX_FAR_SCALE, 70);
        addCheckbox(fx, FX_POLYGON, polygonDefault);
        addCheckbox(fx, FX_SCALE_RADIUS, scaleWithRadiusDefault);
        addDropdown(
            fx,
            FX_DEPTH_TILT_AXIS,
            ["Off", "X", "Y", "Z"],
            1
        );
        addAngle(fx, FX_DEPTH_TILT_ANGLE, 25);
        addDropdown(
            fx,
            FX_DEPTH_TILT_DIRECTION,
            ["Same", "Symmetric", "Invert"],
            2
        );
        addDropdown(
            fx,
            FX_DEPTH_CURVE,
            ["Linear", "Smooth"],
            2
        );

        return ctrl;
    }

    function addCardController(comp, cardWidth, cardHeight, showTextDefault) {
        var ctrl = comp.layers.addNull();
        ctrl.name = CARD_CTRL;
        ctrl.label = 11;
        ctrl.property("ADBE Transform Group").property("ADBE Position")
            .setValue([comp.width * 0.5, 130]);

        var fx = ctrl.property("ADBE Effect Parade");
        addDropdown(
            fx,
            FX_CARD_ORIENTATION,
            ["Horizontal", "Vertical"],
            1
        );
        addSlider(fx, FX_CARD_W, cardWidth);
        addSlider(fx, FX_CARD_H, cardHeight);
        addSlider(fx, FX_CARD_RADIUS, 60);
        addColor(fx, FX_CARD_FILL, [0.12, 0.12, 0.13]);
        addColor(fx, FX_STROKE, [0.25, 0.25, 0.27]);
        addSlider(fx, FX_STROKE_W, 6);
        addColor(fx, FX_STROKE_NEAR, [1, 1, 1]);
        addSlider(fx, FX_STROKE_W_NEAR, 10);
        addSlider(fx, FX_STROKE_REACTION, 2);
        addSlider(fx, FX_PHOTO_PAD_X, 16);
        addSlider(fx, FX_PHOTO_PAD_Y, 16);
        addSlider(fx, FX_PHOTO_RADIUS, 85);
        addCheckbox(fx, FX_SHOW_TEXT, showTextDefault !== false);
        addColor(fx, FX_TEXT_FILL, [1, 1, 1]);
        addSlider(fx, FX_TEXT_SIZE, 140);
        addSlider(fx, FX_TEXT_X, 0);
        addSlider(fx, FX_TEXT_Y, 0);

        return ctrl;
    }

    function unwrapSilentFallback(expressionText) {
        if (!expressionText || expressionText.indexOf("try{") !== 0) {
            return expressionText;
        }

        var catchIndex = expressionText.lastIndexOf("}catch(e){");
        if (catchIndex < 0) return expressionText;
        if (expressionText.substring(expressionText.length - 2) !== "};") {
            return expressionText;
        }
        return expressionText.substring(4, catchIndex);
    }

    function assignExpression(prop, expressionText, label, issues) {
        if (!prop) {
            issues.push(label + ": property not found");
            return false;
        }

        try {
            expressionText = unwrapSilentFallback(expressionText);
            prop.expression = expressionText;
            prop.expressionEnabled = true;
            var evaluatedValue = prop.value;
            if (prop.expressionError && prop.expressionError !== "") {
                issues.push(label + ": " + prop.expressionError);
                return false;
            }
            return true;
        } catch (err) {
            issues.push(label + ": " + err.toString());
            return false;
        }
    }

    function setCameraOption(optionsGroup, matchName, value, label, issues) {
        try {
            var prop = optionsGroup
                ? optionsGroup.property(matchName)
                : null;
            if (!prop) {
                issues.push(label + " property not found");
                return;
            }
            prop.setValue(value);
        } catch (err) {
            issues.push(label + ": " + err.toString());
        }
    }

    function bindCameraDistance(camera, issues) {
        var transform = camera
            ? camera.property("ADBE Transform Group")
            : null;
        var position = transform
            ? transform.property("ADBE Position")
            : null;
        if (!position) return;
        assignExpression(
            position,
            'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'd=Math.max(1,Math.abs(c.effect("' +
            FX_CAMERA_DISTANCE_Z + '")("Slider")));\n' +
            '[thisComp.width*0.5,thisComp.height*0.5,-d];',
            "Camera Distance Z",
            issues
        );
    }

    function addCamera(comp, cameraZ, cameraSettings, issues) {
        var center = [comp.width * 0.5, comp.height * 0.5];
        var camera = comp.layers.addCamera(CAMERA_NAME, center);
        camera.label = 9;

        var transform = camera.property("ADBE Transform Group");
        var position = transform
            ? transform.property("ADBE Position")
            : null;
        if (position) {
            position.setValue([center[0], center[1], cameraZ]);
        } else {
            issues.push("Camera position property not found");
        }

        // Camera Point of Interest uses the internal Anchor Point match name.
        var pointOfInterest = transform
            ? transform.property("ADBE Anchor Point")
            : null;
        if (!pointOfInterest && transform) {
            pointOfInterest = transform.property("Point of Interest");
        }
        if (pointOfInterest) {
            pointOfInterest.setValue([center[0], center[1], 0]);
            try {
                camera.autoOrient =
                    AutoOrientType.CAMERA_OR_POINT_OF_INTEREST;
            } catch (autoOrientError) {
                issues.push(
                    "Camera auto-orient: " + autoOrientError.toString()
                );
            }
        } else {
            issues.push("Camera point of interest property not found");
        }

        bindCameraDistance(camera, issues);

        var cameraOptions = camera.property("ADBE Camera Options Group");
        setCameraOption(
            cameraOptions,
            "ADBE Camera Zoom",
            cameraSettings.zoom,
            "Camera zoom",
            issues
        );
        setCameraOption(
            cameraOptions,
            "ADBE Camera Depth of Field",
            cameraSettings.depthOfField ? 1 : 0,
            "Camera depth of field",
            issues
        );
        setCameraOption(
            cameraOptions,
            "ADBE Camera Focus Distance",
            cameraSettings.focusCenter
                ? Math.abs(cameraZ)
                : cameraSettings.focusDistance,
            "Camera focus distance",
            issues
        );
        setCameraOption(
            cameraOptions,
            "ADBE Camera Aperture",
            cameraSettings.aperture,
            "Camera aperture",
            issues
        );
        setCameraOption(
            cameraOptions,
            "ADBE Camera Blur Level",
            cameraSettings.blurLevel,
            "Camera blur level",
            issues
        );

        return camera;
    }

    function enforcePlaceholderOrder(comp, issues) {
        var card = null;
        var border = null;
        var photo = null;
        var matte = null;
        var label = null;

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer.name === "CARD") card = layer;
            else if (layer.name === "CARD_BORDER") border = layer;
            else if (layer.name === "PHOTO_REPLACE") photo = layer;
            else if (layer.name === "PHOTO_MATTE") matte = layer;
            else if (layer.name === "LABEL") label = layer;
        }

        if (!card || !border || !photo || !matte || !label) {
            issues.push(comp.name + ": incomplete placeholder layer set");
            return false;
        }

        var cardWasLocked = card.locked;
        var borderWasLocked = border.locked;
        var photoWasLocked = photo.locked;
        var labelWasLocked = label.locked;

        try {
            card.locked = false;
            border.locked = false;
            photo.locked = false;
            matte.locked = false;
            label.locked = false;

            card.moveToEnd();
            photo.moveBefore(card);
            matte.moveBefore(photo);
            border.moveBefore(matte);
            label.moveToBeginning();
            photo.trackMatteType = TrackMatteType.NO_TRACK_MATTE;
            photo.trackMatteType = TrackMatteType.ALPHA;
            matte.shy = true;
            return true;
        } catch (err) {
            issues.push(comp.name + " matte order: " + err.toString());
            return false;
        } finally {
            card.locked = cardWasLocked;
            border.locked = borderWasLocked;
            photo.locked = photoWasLocked;
            label.locked = labelWasLocked;
            matte.locked = true;
        }
    }

    function createPlaceholder(
        proj,
        folder,
        mainName,
        instanceTag,
        index,
        duration,
        fps,
        width,
        height,
        issues,
        canvasWidth,
        canvasHeight
    ) {
        var compName = "PH_" + pad2(index);
        var compWidth = Math.max(width, Math.round(canvasWidth || width));
        var compHeight = Math.max(height, Math.round(canvasHeight || height));
        var comp = proj.items.addComp(
            compName,
            compWidth,
            compHeight,
            1,
            duration,
            fps
        );
        comp.parentFolder = folder;

        var ctrlRef = 'comp("' + mainName + '").layer("' + CARD_CTRL + '")';
        var cardMetrics = cardMetricsExpression(
            "c",
            "thisComp.width",
            "thisComp.height",
            "  "
        );

        var card = comp.layers.addShape();
        card.name = "CARD";
        var cardGroup = card.property("ADBE Root Vectors Group")
            .addProperty("ADBE Vector Group");
        cardGroup.name = "CARD";
        var cardContents = cardGroup.property("ADBE Vectors Group");
        var cardRect = cardContents.addProperty("ADBE Vector Shape - Rect");

        assignExpression(
            cardRect.property("ADBE Vector Rect Size"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            cardMetrics +
            '  [cw,ch];\n' +
            '}catch(e){[thisComp.width,thisComp.height]};',
            compName + " card size",
            issues
        );

        assignExpression(
            cardRect.property("ADBE Vector Rect Roundness"),
            'try{Math.max(0,' + ctrlRef + '.effect("' + FX_CARD_RADIUS + '")("Slider"))}' +
            'catch(e){60};',
            compName + " card radius",
            issues
        );

        var cardFill = cardContents.addProperty("ADBE Vector Graphic - Fill");
        assignExpression(
            cardFill.property("ADBE Vector Fill Color"),
            'try{' + ctrlRef + '.effect("' + FX_CARD_FILL + '")("Color")}' +
            'catch(e){[0.12,0.12,0.13]};',
            compName + " card fill",
            issues
        );

        card.property("ADBE Transform Group").property("ADBE Position")
            .setValue([compWidth * 0.5, compHeight * 0.5]);

        var photo = comp.layers.addSolid(
            [0.2, 0.2, 0.22],
            "PHOTO_REPLACE",
            width,
            height,
            1,
            duration
        );
        photo.property("ADBE Transform Group").property("ADBE Position")
            .setValue([compWidth * 0.5, compHeight * 0.5]);

        assignExpression(
            photo.property("ADBE Transform Group").property("ADBE Scale"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            cardMetrics +
            '  px=Math.max(0,c.effect("' + FX_PHOTO_PAD_X + '")("Slider"));\n' +
            '  py=Math.max(0,c.effect("' + FX_PHOTO_PAD_Y + '")("Slider"));\n' +
            '  tw=Math.max(1,cw-2*px);\n' +
            '  th=Math.max(1,ch-2*py);\n' +
            '  s=Math.max(tw/thisLayer.source.width,th/thisLayer.source.height)*100;\n' +
            '  [s,s];\n' +
            '}catch(e){[100,100]};',
            compName + " photo scale",
            issues
        );

        var matte = comp.layers.addShape();
        matte.name = "PHOTO_MATTE";
        var matteGroup = matte.property("ADBE Root Vectors Group")
            .addProperty("ADBE Vector Group");
        matteGroup.name = "PHOTO_MATTE";
        var matteContents = matteGroup.property("ADBE Vectors Group");
        var matteRect = matteContents.addProperty("ADBE Vector Shape - Rect");

        assignExpression(
            matteRect.property("ADBE Vector Rect Size"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            cardMetrics +
            '  px=Math.max(0,c.effect("' + FX_PHOTO_PAD_X + '")("Slider"));\n' +
            '  py=Math.max(0,c.effect("' + FX_PHOTO_PAD_Y + '")("Slider"));\n' +
            '  [Math.max(1,cw-2*px),Math.max(1,ch-2*py)];\n' +
            '}catch(e){[thisComp.width,thisComp.height]};',
            compName + " matte size",
            issues
        );

        assignExpression(
            matteRect.property("ADBE Vector Rect Roundness"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            '  r=Math.max(0,c.effect("' + FX_CARD_RADIUS + '")("Slider"));\n' +
            '  p=Math.max(0,Math.min(100,c.effect("' + FX_PHOTO_RADIUS + '")("Slider")))/100;\n' +
            '  r*p;\n' +
            '}catch(e){50};',
            compName + " matte radius",
            issues
        );

        var matteFill = matteContents.addProperty("ADBE Vector Graphic - Fill");
        matteFill.property("ADBE Vector Fill Color").setValue([1, 1, 1]);
        matte.property("ADBE Transform Group").property("ADBE Position")
            .setValue([compWidth * 0.5, compHeight * 0.5]);

        var border = comp.layers.addShape();
        border.name = "CARD_BORDER";
        var borderGroup = border.property("ADBE Root Vectors Group")
            .addProperty("ADBE Vector Group");
        borderGroup.name = "CARD_BORDER";
        var borderContents = borderGroup.property("ADBE Vectors Group");
        var borderRect = borderContents.addProperty("ADBE Vector Shape - Rect");

        assignExpression(
            borderRect.property("ADBE Vector Rect Size"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            cardMetrics +
            '  sw=Math.max(0,c.effect("' + FX_STROKE_W + '")("Slider"));\n' +
            '  [Math.max(1,cw-sw),Math.max(1,ch-sw)];\n' +
            '}catch(e){[thisComp.width-6,thisComp.height-6]};',
            compName + " border size",
            issues
        );

        assignExpression(
            borderRect.property("ADBE Vector Rect Roundness"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            '  r=Math.max(0,c.effect("' + FX_CARD_RADIUS + '")("Slider"));\n' +
            '  sw=Math.max(0,c.effect("' + FX_STROKE_W + '")("Slider"));\n' +
            '  Math.max(0,r-sw/2);\n' +
            '}catch(e){57};',
            compName + " border radius",
            issues
        );

        var borderStroke = borderContents.addProperty(
            "ADBE Vector Graphic - Stroke"
        );
        assignExpression(
            borderStroke.property("ADBE Vector Stroke Color"),
            'try{' + ctrlRef + '.effect("' + FX_STROKE + '")("Color")}' +
            'catch(e){[0.25,0.25,0.27]};',
            compName + " stroke color",
            issues
        );
        assignExpression(
            borderStroke.property("ADBE Vector Stroke Width"),
            'try{Math.max(0,' + ctrlRef + '.effect("' + FX_STROKE_W + '")("Slider"))}' +
            'catch(e){6};',
            compName + " stroke width",
            issues
        );
        try {
            borderStroke.property("ADBE Vector Stroke Line Join").setValue(2);
        } catch (lineJoinError) {
            issues.push(
                compName + " border line join: " + lineJoinError.toString()
            );
        }
        border.property("ADBE Transform Group").property("ADBE Position")
            .setValue([compWidth * 0.5, compHeight * 0.5]);

        var label = comp.layers.addText("CARD " + pad2(index));
        label.name = "LABEL";
        label.property("ADBE Transform Group").property("ADBE Anchor Point")
            .setValue([0, 0]);

        var safeX = Math.round(width * 0.08);
        var safeY = Math.round(height * 0.08);
        assignExpression(
            label.property("ADBE Transform Group").property("ADBE Position"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            cardMetrics +
            '  left=(thisComp.width-cw)/2+cw*0.08;\n' +
            '  bottom=(thisComp.height+ch)/2-ch*0.08;\n' +
            '  [left+c.effect("' + FX_TEXT_X + '")("Slider"),' +
            'bottom+c.effect("' + FX_TEXT_Y + '")("Slider")];\n' +
            '}catch(e){[' + safeX + ',thisComp.height-' + safeY + ']};',
            compName + " label position",
            issues
        );

        var textProp = label.property("ADBE Text Properties")
            .property("ADBE Text Document");
        var baseFontSize = Math.round(height * 0.065);
        var textDocument = textProp.value;
        textDocument.applyFill = true;
        textDocument.fontSize = baseFontSize;
        textProp.setValue(textDocument);

        var textAnimator = label.property("ADBE Text Properties")
            .property("ADBE Text Animators")
            .addProperty("ADBE Text Animator");
        textAnimator.name = "TEXT_FILL";
        textAnimator.property("ADBE Text Selectors")
            .addProperty("ADBE Text Selector");
        var textAnimatorFill = textAnimator
            .property("ADBE Text Animator Properties")
            .addProperty("ADBE Text Fill Color");

        assignExpression(
            textAnimatorFill,
            'try{\n' +
            '  col=' + ctrlRef + '.effect("' + FX_TEXT_FILL + '")("Color");\n' +
            '  [col[0],col[1],col[2],col[3]];\n' +
            '}catch(e){[1,1,1,1]};',
            compName + " label fill",
            issues
        );

        assignExpression(
            label.property("ADBE Transform Group").property("ADBE Scale"),
            'try{\n' +
            '  s=Math.max(1,' + ctrlRef + '.effect("' + FX_TEXT_SIZE + '")("Slider"));\n' +
            '  k=s/' + baseFontSize + ';\n' +
            '  [100*k,100*k];\n' +
            '}catch(e){value};',
            compName + " label size",
            issues
        );
        assignTextVisibility(comp, mainName, issues);

        enforcePlaceholderOrder(comp, issues);
        return comp;
    }

    function makeDepthAmountExpression(count) {
        return 'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'maxN=' + count + ';\n' +
            'layoutN=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'activeLimit=Math.ceil(layoutN);\n' +
            'amount=0;\n' +
            'if(layoutN>1){\n' +
            '  cam=thisComp.layer("' + CAMERA_NAME + '");\n' +
            '  camPos=cam.toWorld([0,0,0]);\n' +
            '  camForward=normalize(cam.toWorldVec([0,0,1]));\n' +
            '  myWorld=hasParent?parent.toWorld(position):position;\n' +
            '  myDepth=dot(myWorld-camPos,camForward);\n' +
            '  minDepth=1e20;\n' +
            '  maxDepth=-1e20;\n' +
            '  for(i=1;i<=thisComp.numLayers;i++){\n' +
            '    try{\n' +
            '      slide=thisComp.layer(i);\n' +
            '      slideId=Math.round(slide.effect("' + SLIDE_ID + '")("Slider"));\n' +
            '      if(slideId>=1 && slideId<=activeLimit){\n' +
            '        slideWorld=slide.hasParent?' +
            'slide.parent.toWorld(slide.position):slide.position;\n' +
            '        slideDepth=dot(slideWorld-camPos,camForward);\n' +
            '        minDepth=Math.min(minDepth,slideDepth);\n' +
            '        maxDepth=Math.max(maxDepth,slideDepth);\n' +
            '      }\n' +
            '    }catch(eLayer){}\n' +
            '  }\n' +
            '  range=Math.max(0,maxDepth-minDepth);\n' +
            '  rawDepth=(range>0.0001)?(myDepth-minDepth)/range:0;\n' +
            '  rawDepth=Math.max(0,Math.min(1,rawDepth));\n' +
            '  amount=rawDepth;\n' +
            '  curveMode=Math.round(c.effect("' + FX_DEPTH_CURVE + '")(1));\n' +
            '  if(curveMode==2){\n' +
            '    amount=amount*amount*(3-2*amount);\n' +
            '  }\n' +
            '}\n' +
            'amount;';
    }

    function makeCardRotationExpression(
        count,
        targetAxis,
        nestedInPHS
    ) {
        var lateralExpression = nestedInPHS
            ? '    lateral=(axis==3)?position[1]-thisComp.height*0.5:' +
                'position[0]-thisComp.width*0.5;\n'
            : '    lateral=(axis==3)?position[1]:position[0];\n';
        return 'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'maxN=' + count + ';\n' +
            'layoutN=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'sid=Math.max(1,Math.round(effect("' + SLIDE_ID + '")("Slider")));\n' +
            'orbit=c.effect("' + FX_ORBIT + '")("Angle");\n' +
            'step=(layoutN<=1)?0:360/layoutN;\n' +
            'targetIndex=Math.max(1,Math.min(layoutN,Math.round(c.effect("' +
            FX_SLIDE_INDEX + '")("Slider"))));\n' +
            'progress=Math.max(0,Math.min(100,c.effect("' +
            FX_PROGRESS + '")("Slider")))/100;\n' +
            'orbit-=((targetIndex-1)+progress)*step;\n' +
            'if(c.effect("' + FX_CONSTANT_SPEED + '")("Checkbox")>0){\n' +
            '  orbit+=time*c.effect("' + FX_SPEED + '")("Slider");\n' +
            '}\n' +
            'a=(layoutN<=1)?0:((sid-1)*(360/layoutN)+orbit);\n' +
            'axis=Math.round(c.effect("' + FX_AXIS + '")(1));\n' +
            'polyOn=c.effect("' + FX_POLYGON + '")("Checkbox")>0;\n' +
            'result=0;\n' +
            'if(polyOn && layoutN>1){\n' +
            '  wanted=(axis==1)?1:((axis==2)?2:3);\n' +
            '  face=(axis==1)?a-180:a;\n' +
            '  result=(wanted==' + targetAxis + ')?face:0;\n' +
            '}\n' +
            'depthAxisChoice=Math.round(c.effect("' +
            FX_DEPTH_TILT_AXIS + '")(1));\n' +
            'wantedDepth=(depthAxisChoice==2)?3:' +
            '((depthAxisChoice==3)?1:' +
            '((depthAxisChoice==4)?2:0));\n' +
            'if(wantedDepth==' + targetAxis + ' && layoutN>1){\n' +
            '  requestedAngle=c.effect("' + FX_DEPTH_TILT_ANGLE +
            '")("Angle");\n' +
            '  maxVisualAngle=requestedAngle;\n' +
            '  directionMode=Math.round(c.effect("' +
            FX_DEPTH_TILT_DIRECTION + '")(1));\n' +
            '  depthSign=1;\n' +
            '  if(directionMode==2){\n' +
            lateralExpression +
            '    depthSign=(lateral<0)?-1:1;\n' +
            '  }else if(directionMode==3){\n' +
            '    depthSign=-1;\n' +
            '  }\n' +
            '  result+=maxVisualAngle*effect("' + DEPTH_AMOUNT +
            '")("Slider")*depthSign;\n' +
            '}\n' +
            'result;';
    }

    function makeCardPositionExpression(count, nestedInPHS) {
        var slideCardMetrics = cardMetricsExpression(
            "cardCtrl",
            "thisLayer.source.width",
            "thisLayer.source.height",
            ""
        );
        return 'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'maxN=' + count + ';\n' +
            'layoutN=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'sid=Math.max(1,Math.round(effect("' + SLIDE_ID + '")("Slider")));\n' +
            'autoR=c.effect("' + FX_AUTO_RADIUS + '")("Checkbox")>0;\n' +
            'manualR=Math.max(0,c.effect("' + FX_RADIUS + '")("Slider"));\n' +
            'offset=c.effect("' + FX_RADIUS_OFFSET + '")("Slider");\n' +
            'cardCtrl=thisComp.layer("' + CARD_CTRL + '");\n' +
            slideCardMetrics +
            'visibleW=cw;\n' +
            'visibleW=Math.max(1,visibleW);\n' +
            'safeR=(layoutN<=1)?0:(visibleW/2)/Math.sin(Math.PI/layoutN);\n' +
            'r=autoR?Math.max(0,safeR+offset):manualR;\n' +
            'orbit=c.effect("' + FX_ORBIT + '")("Angle");\n' +
            'step=(layoutN<=1)?0:360/layoutN;\n' +
            'targetIndex=Math.max(1,Math.min(layoutN,Math.round(c.effect("' +
            FX_SLIDE_INDEX + '")("Slider"))));\n' +
            'progress=Math.max(0,Math.min(100,c.effect("' +
            FX_PROGRESS + '")("Slider")))/100;\n' +
            'orbit-=((targetIndex-1)+progress)*step;\n' +
            'if(c.effect("' + FX_CONSTANT_SPEED + '")("Checkbox")>0){\n' +
            '  orbit+=time*c.effect("' + FX_SPEED + '")("Slider");\n' +
            '}\n' +
            'a=(layoutN<=1)?0:((sid-1)*(360/layoutN)+orbit);\n' +
            't=degreesToRadians(a);\n' +
            's=Math.sin(t)*r;\n' +
            'q=Math.cos(t)*r;\n' +
            'axis=Math.round(c.effect("' + FX_AXIS + '")(1));\n' +
            (nestedInPHS
                ? 'cx=thisComp.width*0.5;cy=thisComp.height*0.5;\n' +
                    'if(layoutN<=1){[cx,cy,0]}' +
                    'else if(axis==2){[cx+s,cy+q,0]}' +
                    'else if(axis==3){[cx,cy+s,q]}' +
                    'else{[cx+s,cy,q]};'
                : 'if(layoutN<=1){[0,0,0]}' +
                    'else if(axis==2){[s,q,0]}' +
                    'else if(axis==3){[0,s,q]}' +
                    'else{[s,0,q]};');
    }

    function makeCardScaleExpression(count) {
        var indentedSlideCardMetrics = cardMetricsExpression(
            "cardCtrl",
            "thisLayer.source.width",
            "thisLayer.source.height",
            "    "
        );
        return 'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'maxN=' + count + ';\n' +
            'activeN=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'layoutN=activeN;\n' +
            'sid=Math.max(1,Math.round(effect("' + SLIDE_ID + '")("Slider")));\n' +
            'reveal=Math.max(0,Math.min(1,activeN-sid+1));\n' +
            'reveal=reveal*reveal*(3-2*reveal);\n' +
            'farK=Math.max(0,c.effect("' + FX_FAR_SCALE + '")("Slider"))/100;\n' +
            'orbit=c.effect("' + FX_ORBIT + '")("Angle");\n' +
            'step=(layoutN<=1)?0:360/layoutN;\n' +
            'targetIndex=Math.max(1,Math.min(layoutN,Math.round(c.effect("' +
            FX_SLIDE_INDEX + '")("Slider"))));\n' +
            'progress=Math.max(0,Math.min(100,c.effect("' +
            FX_PROGRESS + '")("Slider")))/100;\n' +
            'orbit-=((targetIndex-1)+progress)*step;\n' +
            'if(c.effect("' + FX_CONSTANT_SPEED + '")("Checkbox")>0){\n' +
            '  orbit+=time*c.effect("' + FX_SPEED + '")("Slider");\n' +
            '}\n' +
            'a=(layoutN<=1)?0:((sid-1)*(360/layoutN)+orbit);\n' +
            'axis=Math.round(c.effect("' + FX_AXIS + '")(1));\n' +
            'depth=(Math.cos(degreesToRadians(a))+1)/2;\n' +
            'k=(layoutN<=1 || axis==2)?1:linear(depth,0,1,1,farK);\n' +
            'fit=1;\n' +
            'poly=c.effect("' + FX_POLYGON + '")("Checkbox")>0;\n' +
            'scaleR=c.effect("' + FX_SCALE_RADIUS + '")("Checkbox")>0;\n' +
            'if(poly && scaleR && layoutN>2){\n' +
            '  autoR=c.effect("' + FX_AUTO_RADIUS + '")("Checkbox")>0;\n' +
            '  manualR=Math.max(0,c.effect("' + FX_RADIUS + '")("Slider"));\n' +
            '  offset=c.effect("' + FX_RADIUS_OFFSET + '")("Slider");\n' +
            '  cardCtrl=thisComp.layer("' + CARD_CTRL + '");\n' +
            indentedSlideCardMetrics +
            '  visibleW=cw;\n' +
            '  visibleW=Math.max(1,visibleW);\n' +
            '  safeR=(visibleW/2)/Math.sin(Math.PI/layoutN);\n' +
            '  r=autoR?Math.max(0,safeR+offset):manualR;\n' +
            '  side=2*r*Math.tan(Math.PI/layoutN);\n' +
            '  fit=side/visibleW;\n' +
            '}\n' +
            'appear=linear(reveal,0,1,85,100)/100;\n' +
            '[100*k*fit*appear,100*k*fit*appear,100*k*fit*appear];';
    }

    function makeCardOpacityExpression(count) {
        return 'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'activeN=Math.max(1,Math.min(' + count + ',c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'sid=Math.max(1,Math.round(effect("' + SLIDE_ID + '")("Slider")));\n' +
            'reveal=Math.max(0,Math.min(1,activeN-sid+1));\n' +
            'reveal=reveal*reveal*(3-2*reveal);\n' +
            'reveal*100;';
    }

    function retargetCircularExpressionText(expressionText, mainName) {
        if (!mainName) return expressionText;
        return replaceExpressionNames(
            expressionText,
            [
                [
                    'thisComp.layer("' + MOVE_CTRL + '")',
                    'comp("' + mainName + '").layer("' + MOVE_CTRL + '")'
                ],
                [
                    'thisComp.layer("' + CARD_CTRL + '")',
                    'comp("' + mainName + '").layer("' + CARD_CTRL + '")'
                ],
                [
                    'thisComp.layer("' + LEGACY_CARD_CTRL + '")',
                    'comp("' + mainName + '").layer("' + CARD_CTRL + '")'
                ],
                [
                    'thisComp.layer("' + CAMERA_NAME + '")',
                    'comp("' + mainName + '").layer("' + CAMERA_NAME + '")'
                ],
                [
                    'thisComp.layer("KR_CAMERA")',
                    'comp("' + mainName + '").layer("' + CAMERA_NAME + '")'
                ]
            ]
        );
    }

    function assignSlideRuntimeExpressions(
        slide,
        count,
        issues,
        mainName,
        nestedInPHS
    ) {
        try {
            if (slide.source instanceof CompItem) {
                slide.property("ADBE Transform Group")
                    .property("ADBE Anchor Point")
                    .setValue([
                        slide.source.width * 0.5,
                        slide.source.height * 0.5,
                        0
                    ]);
            }
        } catch (anchorErr) {
            if (issues) {
                issues.push(slide.name + " anchor: " + anchorErr.toString());
            }
        }

        var depthEffect = ensureSliderEffect(
            slide,
            DEPTH_AMOUNT,
            0
        );
        assignExpression(
            depthEffect.property(1),
            retargetCircularExpressionText(
                makeDepthAmountExpression(count),
                mainName
            ),
            slide.name + " depth amount",
            issues
        );
        assignExpression(
            slide.property("ADBE Transform Group").property("ADBE Position"),
            retargetCircularExpressionText(
                makeCardPositionExpression(count, nestedInPHS),
                mainName
            ),
            slide.name + " position",
            issues
        );
        assignExpression(
            slide.property("ADBE Transform Group").property("ADBE Scale"),
            retargetCircularExpressionText(
                makeCardScaleExpression(count),
                mainName
            ),
            slide.name + " scale",
            issues
        );
        assignExpression(
            slide.property("ADBE Transform Group").property("ADBE Opacity"),
            retargetCircularExpressionText(
                makeCardOpacityExpression(count),
                mainName
            ),
            slide.name + " visibility",
            issues
        );
        assignExpression(
            slide.property("ADBE Transform Group").property("ADBE Rotate X"),
            retargetCircularExpressionText(
                makeCardRotationExpression(count, 3, nestedInPHS),
                mainName
            ),
            slide.name + " X rotation",
            issues
        );
        assignExpression(
            slide.property("ADBE Transform Group").property("ADBE Rotate Y"),
            retargetCircularExpressionText(
                makeCardRotationExpression(count, 1, nestedInPHS),
                mainName
            ),
            slide.name + " Y rotation",
            issues
        );
        assignExpression(
            slide.property("ADBE Transform Group").property("ADBE Rotate Z"),
            retargetCircularExpressionText(
                makeCardRotationExpression(count, 2, nestedInPHS),
                mainName
            ),
            slide.name + " Z rotation",
            issues
        );
    }

    function refreshSlideRuntimeExpressions(
        slides,
        issues,
        mainName,
        nestedInPHS
    ) {
        for (var i = 0; i < slides.length; i++) {
            assignSlideRuntimeExpressions(
                slides[i].layer,
                slides.length,
                issues,
                mainName,
                nestedInPHS
            );
        }
    }

    function addSlideLayer(
        main,
        sourceComp,
        rig,
        cardWidth,
        cardHeight,
        slideId
    ) {
        var slide = main.layers.add(sourceComp);
        slide.name = sourceComp.name;
        slide.threeDLayer = true;
        if (rig && rig.containingComp === main) {
            slide.parent = rig;
        }
        slide.property("ADBE Transform Group").property("ADBE Anchor Point")
            .setValue([sourceComp.width * 0.5, sourceComp.height * 0.5, 0]);
        slide.property("ADBE Transform Group").property("ADBE Position")
            .setValue([0, 0, 0]);
        var slideFx = slide.property("ADBE Effect Parade");
        addSlider(slideFx, SLIDE_ID, slideId);
        addSlider(slideFx, DEPTH_AMOUNT, 0);
        return slide;
    }

    function addRigAndSlides(
        main,
        placeholders,
        cardWidth,
        cardHeight,
        issues
    ) {
        var center = [main.width * 0.5, main.height * 0.5, 0];
        var count = placeholders.length;
        var slideCardMetrics = cardMetricsExpression(
            "cardCtrl",
            "thisLayer.source.width",
            "thisLayer.source.height",
            ""
        );
        var indentedSlideCardMetrics = cardMetricsExpression(
            "cardCtrl",
            "thisLayer.source.width",
            "thisLayer.source.height",
            "    "
        );

        var rig = main.layers.addNull();
        rig.name = RIG_NAME;
        rig.label = 12;
        rig.threeDLayer = true;
        rig.property("ADBE Transform Group").property("ADBE Position")
            .setValue(center);

        assignExpression(
            rig.property("ADBE Transform Group").property("ADBE Scale"),
            's=Math.max(0,thisComp.layer("' + MOVE_CTRL + '")' +
            '.effect("' + FX_GLOBAL_SCALE + '")("Slider"));\n' +
            '[s,s,s];',
            "Rig global scale",
            issues
        );

        assignExpression(
            rig.property("ADBE Transform Group").property("ADBE Rotate X"),
            'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'cam=thisComp.layer("' + CAMERA_NAME + '");\n' +
            'd=cam.toWorld([0,0,0])-thisLayer.toWorld(anchorPoint);\n' +
            'h=Math.sqrt(d[0]*d[0]+d[2]*d[2]);\n' +
            'radiansToDegrees(Math.atan2(d[1],h))+' +
            'c.effect("' + FX_TILT_X + '")("Angle");',
            "Rig X rotation",
            issues
        );

        assignExpression(
            rig.property("ADBE Transform Group").property("ADBE Rotate Y"),
            'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'cam=thisComp.layer("' + CAMERA_NAME + '");\n' +
            'd=cam.toWorld([0,0,0])-thisLayer.toWorld(anchorPoint);\n' +
            'radiansToDegrees(Math.atan2(-d[0],-d[2]))+' +
            'c.effect("' + FX_TILT_Y + '")("Angle");',
            "Rig Y rotation",
            issues
        );

        assignExpression(
            rig.property("ADBE Transform Group").property("ADBE Rotate Z"),
            'thisComp.layer("' + MOVE_CTRL + '")' +
            '.effect("' + FX_TILT_Z + '")("Angle");',
            "Rig Z rotation",
            issues
        );

        var positionExpression =
            'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'maxN=' + count + ';\n' +
            'layoutN=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'sid=Math.max(1,Math.round(effect("' + SLIDE_ID + '")("Slider")));\n' +
            'autoR=c.effect("' + FX_AUTO_RADIUS + '")("Checkbox")>0;\n' +
            'manualR=Math.max(0,c.effect("' + FX_RADIUS + '")("Slider"));\n' +
            'offset=c.effect("' + FX_RADIUS_OFFSET + '")("Slider");\n' +
            'cardCtrl=thisComp.layer("' + CARD_CTRL + '");\n' +
            slideCardMetrics +
            'visibleW=cw;\n' +
            'visibleW=Math.max(1,visibleW);\n' +
            'safeR=(layoutN<=1)?0:(visibleW/2)/Math.sin(Math.PI/layoutN);\n' +
            'r=autoR?Math.max(0,safeR+offset):manualR;\n' +
            'orbit=c.effect("' + FX_ORBIT + '")("Angle");\n' +
            'step=(layoutN<=1)?0:360/layoutN;\n' +
            'targetIndex=Math.max(1,Math.min(layoutN,Math.round(c.effect("' +
            FX_SLIDE_INDEX + '")("Slider"))));\n' +
            'progress=Math.max(0,Math.min(100,c.effect("' +
            FX_PROGRESS + '")("Slider")))/100;\n' +
            'orbit-=((targetIndex-1)+progress)*step;\n' +
            'if(c.effect("' + FX_CONSTANT_SPEED + '")("Checkbox")>0){\n' +
            '  orbit+=time*c.effect("' + FX_SPEED + '")("Slider");\n' +
            '}\n' +
            'a=(layoutN<=1)?0:((sid-1)*(360/layoutN)+orbit);\n' +
            't=degreesToRadians(a);\n' +
            's=Math.sin(t)*r;\n' +
            'q=Math.cos(t)*r;\n' +
            'axis=Math.round(c.effect("' + FX_AXIS + '")(1));\n' +
            'if(layoutN<=1){[0,0,0]}' +
            'else if(axis==2){[s,q,0]}' +
            'else if(axis==3){[0,s,q]}' +
            'else{[s,0,q]};';

        var scaleExpression =
            'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'maxN=' + count + ';\n' +
            'activeN=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'layoutN=activeN;\n' +
            'sid=Math.max(1,Math.round(effect("' + SLIDE_ID + '")("Slider")));\n' +
            'reveal=Math.max(0,Math.min(1,activeN-sid+1));\n' +
            'reveal=reveal*reveal*(3-2*reveal);\n' +
            'farK=Math.max(0,c.effect("' + FX_FAR_SCALE + '")("Slider"))/100;\n' +
            'orbit=c.effect("' + FX_ORBIT + '")("Angle");\n' +
            'step=(layoutN<=1)?0:360/layoutN;\n' +
            'targetIndex=Math.max(1,Math.min(layoutN,Math.round(c.effect("' +
            FX_SLIDE_INDEX + '")("Slider"))));\n' +
            'progress=Math.max(0,Math.min(100,c.effect("' +
            FX_PROGRESS + '")("Slider")))/100;\n' +
            'orbit-=((targetIndex-1)+progress)*step;\n' +
            'if(c.effect("' + FX_CONSTANT_SPEED + '")("Checkbox")>0){\n' +
            '  orbit+=time*c.effect("' + FX_SPEED + '")("Slider");\n' +
            '}\n' +
            'a=(layoutN<=1)?0:((sid-1)*(360/layoutN)+orbit);\n' +
            'axis=Math.round(c.effect("' + FX_AXIS + '")(1));\n' +
            'depth=(Math.cos(degreesToRadians(a))+1)/2;\n' +
            'k=(layoutN<=1 || axis==2)?1:linear(depth,0,1,1,farK);\n' +
            'fit=1;\n' +
            'poly=c.effect("' + FX_POLYGON + '")("Checkbox")>0;\n' +
            'scaleR=c.effect("' + FX_SCALE_RADIUS + '")("Checkbox")>0;\n' +
            'if(poly && scaleR && layoutN>2){\n' +
            '  autoR=c.effect("' + FX_AUTO_RADIUS + '")("Checkbox")>0;\n' +
            '  manualR=Math.max(0,c.effect("' + FX_RADIUS + '")("Slider"));\n' +
            '  offset=c.effect("' + FX_RADIUS_OFFSET + '")("Slider");\n' +
            '  cardCtrl=thisComp.layer("' + CARD_CTRL + '");\n' +
            indentedSlideCardMetrics +
            '  visibleW=cw;\n' +
            '  visibleW=Math.max(1,visibleW);\n' +
            '  safeR=(visibleW/2)/Math.sin(Math.PI/layoutN);\n' +
            '  r=autoR?Math.max(0,safeR+offset):manualR;\n' +
            '  side=2*r*Math.tan(Math.PI/layoutN);\n' +
            '  fit=side/visibleW;\n' +
            '}\n' +
            'appear=linear(reveal,0,1,85,100)/100;\n' +
            '[100*k*fit*appear,100*k*fit*appear,100*k*fit*appear];';

        var opacityExpression =
            'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'activeN=Math.max(1,Math.min(' + count + ',c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'sid=Math.max(1,Math.round(effect("' + SLIDE_ID + '")("Slider")));\n' +
            'reveal=Math.max(0,Math.min(1,activeN-sid+1));\n' +
            'reveal=reveal*reveal*(3-2*reveal);\n' +
            'reveal*100;';

        for (var i = 0; i < placeholders.length; i++) {
            var sourceComp = placeholders[i];
            var slide = main.layers.add(sourceComp);
            slide.name = sourceComp.name;
            slide.threeDLayer = true;
            slide.parent = rig;

            slide.property("ADBE Transform Group").property("ADBE Anchor Point")
                .setValue([sourceComp.width * 0.5, sourceComp.height * 0.5, 0]);
            slide.property("ADBE Transform Group").property("ADBE Position")
                .setValue([0, 0, 0]);

            var slideFx = slide.property("ADBE Effect Parade");
            addSlider(slideFx, SLIDE_ID, i + 1);
            var depthAmount = addSlider(slideFx, DEPTH_AMOUNT, 0);

            assignExpression(
                depthAmount.property(1),
                makeDepthAmountExpression(count),
                sourceComp.name + " depth amount",
                issues
            );

            assignExpression(
                slide.property("ADBE Transform Group").property("ADBE Position"),
                positionExpression,
                sourceComp.name + " position",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group").property("ADBE Scale"),
                scaleExpression,
                sourceComp.name + " scale",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group").property("ADBE Opacity"),
                opacityExpression,
                sourceComp.name + " visibility",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group").property("ADBE Rotate X"),
                makeCardRotationExpression(
                    count,
                    3
                ),
                sourceComp.name + " X rotation",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group").property("ADBE Rotate Y"),
                makeCardRotationExpression(
                    count,
                    1
                ),
                sourceComp.name + " Y rotation",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group").property("ADBE Rotate Z"),
                makeCardRotationExpression(
                    count,
                    2
                ),
                sourceComp.name + " Z rotation",
                issues
            );
            assignCircularBorderExpressions(sourceComp, main.name, issues);
        }

        return rig;
    }

    function isMediaFile(file) {
        if (!file || !(file instanceof File)) return false;
        return /\.(jpg|jpeg|png|tif|tiff|bmp|gif|psd|exr|mp4|mov|m4v|avi)$/i
            .test(file.name || "");
    }

    function getMediaFiles(folder) {
        if (!folder) return [];
        var files = folder.getFiles(function (file) {
            return isMediaFile(file);
        });
        files.sort(function (a, b) {
            var aa = (a.name || "").toLowerCase();
            var bb = (b.name || "").toLowerCase();
            if (aa < bb) return -1;
            if (aa > bb) return 1;
            return 0;
        });
        return files;
    }

    function importMedia(proj, files, folder, issues) {
        var imported = [];
        for (var i = 0; i < files.length; i++) {
            try {
                var options = new ImportOptions(files[i]);
                if (!options.canImportAs(ImportAsType.FOOTAGE)) {
                    issues.push("Skipped unsupported file: " + files[i].name);
                    continue;
                }
                options.importAs = ImportAsType.FOOTAGE;
                var item = proj.importFile(options);
                item.parentFolder = folder;
                imported.push(item);
            } catch (err) {
                issues.push("Import " + files[i].name + ": " + err.toString());
            }
        }
        return imported;
    }

    function replacePhoto(comp, footage, issues) {
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer.name !== "PHOTO_REPLACE") continue;
            try {
                layer.replaceSource(footage, false);
                layer.name = "PHOTO_REPLACE";
                enforcePlaceholderOrder(comp, issues);
                return true;
            } catch (err) {
                issues.push(comp.name + " replace source: " + err.toString());
                return false;
            }
        }
        issues.push(comp.name + ": PHOTO_REPLACE not found");
        return false;
    }

    function centerPlaceholderLayer(comp, layerName, issues) {
        try {
            var layer = comp.layer(layerName);
            var wasLocked = layer.locked;
            layer.locked = false;
            layer.property("ADBE Transform Group")
                .property("ADBE Position")
                .setValue([comp.width * 0.5, comp.height * 0.5]);
            layer.locked = wasLocked;
        } catch (err) {
            if (issues) {
                issues.push(
                    comp.name + " " + layerName +
                    " center: " + err.toString()
                );
            }
        }
    }

    function ensurePlaceholderCanvas(comp, main, issues) {
        if (!comp || !main) return;
        try {
            var targetW = Math.max(comp.width, main.width);
            var targetH = Math.max(comp.height, main.height);
            if (comp.width < targetW) comp.width = targetW;
            if (comp.height < targetH) comp.height = targetH;
        } catch (err) {
            if (issues) {
                issues.push(comp.name + " canvas: " + err.toString());
            }
        }
        centerPlaceholderLayer(comp, "CARD", issues);
        centerPlaceholderLayer(comp, "PHOTO_REPLACE", issues);
        centerPlaceholderLayer(comp, "PHOTO_MATTE", issues);
        centerPlaceholderLayer(comp, "CARD_BORDER", issues);
    }

    function getActiveRigComp() {
        var item = app.project ? app.project.activeItem : null;
        if (!(item instanceof CompItem)) return null;
        if (!/^(MAIN|CR_MAIN|KR_MAIN)_\d+$/.test(item.name)) return null;
        return item;
    }

    function collectRigSlides(main) {
        var slides = [];
        var host = slideHostComp(main);
        for (var i = 1; i <= host.numLayers; i++) {
            var layer = host.layer(i);
            var idEffect = findEffect(
                layer,
                [SLIDE_ID, LEGACY_SLIDE_ID]
            );
            if (!idEffect || !(layer.source instanceof CompItem)) continue;
            slides.push({
                layer: layer,
                idEffect: idEffect,
                id: Math.round(idEffect.property(1).value)
            });
        }
        slides.sort(function (a, b) {
            return a.id - b.id;
        });
        return slides;
    }

    function replaceExpressionNames(text, replacements) {
        var result = text;
        for (var i = 0; i < replacements.length; i++) {
            result = result.split(replacements[i][0])
                .join(replacements[i][1]);
        }
        return result;
    }

    function migratePropertyExpressions(
        group,
        replacements,
        issues,
        path
    ) {
        if (!group || !group.numProperties) return;
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);
            var propPath = path + "/" + prop.name;
            if (prop.canSetExpression && prop.expressionEnabled) {
                var expressionText = replaceExpressionNames(
                    prop.expression,
                    replacements
                );
                assignExpression(
                    prop,
                    expressionText,
                    "Update " + propPath,
                    issues
                );
            }
            if (prop.numProperties) {
                migratePropertyExpressions(
                    prop,
                    replacements,
                    issues,
                    propPath
                );
            }
        }
    }

    function migrateCompExpressions(comp, replacements, issues) {
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            migratePropertyExpressions(
                layer,
                replacements,
                issues,
                comp.name + "/" + layer.name
            );
        }
    }

    function collectExpressionIssues(comp, issues) {
        function inspect(group, path) {
            if (!group || !group.numProperties) return;
            for (var i = 1; i <= group.numProperties; i++) {
                var prop = group.property(i);
                var propPath = path + "/" + prop.name;
                if (prop.canSetExpression && prop.expressionEnabled) {
                    try {
                        var evaluatedValue = prop.value;
                        if (prop.expressionError &&
                            prop.expressionError !== "") {
                            issues.push(
                                propPath + ": " + prop.expressionError
                            );
                        }
                    } catch (err) {
                        issues.push(propPath + ": " + err.toString());
                    }
                }
                if (prop.numProperties) inspect(prop, propPath);
            }
        }

        for (var layerIndex = 1;
            layerIndex <= comp.numLayers;
            layerIndex++) {
            var layer = comp.layer(layerIndex);
            inspect(layer, comp.name + "/" + layer.name);
        }
    }

    function checkRig(main) {
        var issues = [];
        if (!main) {
            issues.push(
                "Activate a CR_MAIN or KR_MAIN composition first."
            );
            return issues;
        }

        if (!main.layer(MOVE_CTRL)) {
            issues.push(main.name + ": " + MOVE_CTRL + " not found");
        }
        if (!main.layer(CARD_CTRL) &&
            !main.layer(LEGACY_CARD_CTRL)) {
            issues.push(main.name + ": card controller not found");
        }
        if (!main.layer(CAMERA_NAME) &&
            !main.layer("KR_CAMERA")) {
            issues.push(main.name + ": camera not found");
        }
        if (!main.layer(RIG_NAME) &&
            !main.layer("KR_RIG")) {
            issues.push(main.name + ": rig null not found");
        }
        if (!findAudioLayer(main)) {
            issues.push(main.name + ": audio layer not found");
        }
        if (!findPHSLayer(main)) {
            issues.push(main.name + ": " + PHS_NAME + " precomp not found");
        }

        var slides = collectRigSlides(main);
        if (slides.length === 0) {
            issues.push(main.name + ": no carousel slides found");
        }

        collectExpressionIssues(main, issues);
        var host = slideHostComp(main);
        if (host !== main) collectExpressionIssues(host, issues);
        for (var i = 0; i < slides.length; i++) {
            collectExpressionIssues(slides[i].layer.source, issues);
        }
        return issues;
    }

    function migrateCardSizeControls(cardCtrl, slides) {
        if (!cardCtrl || slides.length === 0) return;
        var source = slides[0].layer.source;
        var widthEffect = findEffect(
            cardCtrl,
            [FX_CARD_W, "Card Width (%)"]
        );
        var heightEffect = findEffect(
            cardCtrl,
            [FX_CARD_H, "Card Height (%)"]
        );

        if (widthEffect && widthEffect.name === "Card Width (%)") {
            var widthPercent = widthEffect.property(1).value;
            widthEffect.name = FX_CARD_W;
            widthEffect.property(1).setValue(
                source.width * widthPercent / 100
            );
        }
        if (heightEffect && heightEffect.name === "Card Height (%)") {
            var heightPercent = heightEffect.property(1).value;
            heightEffect.name = FX_CARD_H;
            heightEffect.property(1).setValue(
                source.height * heightPercent / 100
            );
        }
    }

    function removeEffects(layer, names) {
        if (!layer) return;
        var fx = layer.property("ADBE Effect Parade");
        if (!fx) return;
        for (var propIndex = fx.numProperties; propIndex >= 1; propIndex--) {
            var effect = fx.property(propIndex);
            if (!effect) continue;
            for (var nameIndex = 0; nameIndex < names.length; nameIndex++) {
                if (effect.name === names[nameIndex]) {
                    effect.remove();
                    break;
                }
            }
        }
    }

    function findAudioLayer(main) {
        if (!main) return null;
        try {
            var direct = main.layer(AUDIO_LAYER_NAME);
            if (direct && direct.source instanceof CompItem) return direct;
        } catch (err) {
        }
        for (var i = 1; i <= main.numLayers; i++) {
            var layer = main.layer(i);
            if (layer.source instanceof CompItem &&
                layer.source.name === AUDIO_COMP_NAME) {
                return layer;
            }
        }
        return null;
    }

    function placeAudioLayer(main, audioLayer) {
        if (!main || !audioLayer) return;
        var moveCtrl = main.layer(MOVE_CTRL);
        var cardCtrl = main.layer(CARD_CTRL) ||
            main.layer(LEGACY_CARD_CTRL);

        if (cardCtrl) {
            audioLayer.moveAfter(cardCtrl);
        } else if (moveCtrl) {
            audioLayer.moveAfter(moveCtrl);
        }
    }

    function ensureAudioLayer(main, issues) {
        if (!main) return null;
        var audioLayer = findAudioLayer(main);
        if (!audioLayer) {
            try {
                var folder = main.parentFolder || null;
                var audioComp = addAudioComp(
                    ensureProject(),
                    folder,
                    main
                );
                audioLayer = main.layers.add(audioComp);
            } catch (err) {
                if (issues) {
                    issues.push("Audio comp: " + err.toString());
                }
                return null;
            }
        }

        audioLayer.name = AUDIO_LAYER_NAME;
        try {
            audioLayer.audioEnabled = true;
        } catch (audioError) {
        }
        placeAudioLayer(main, audioLayer);
        return audioLayer;
    }

    function cardSourceFromSlides(slides) {
        if (slides && slides.length > 0 &&
            slides[0].layer &&
            slides[0].layer.source instanceof CompItem) {
            return slides[0].layer.source;
        }
        return null;
    }

    function activeSlideCount(moveCtrl, slides) {
        var fallback = slides && slides.length > 0
            ? Math.min(8, slides.length)
            : 8;
        return clamp(
            Math.round(getSliderValue(moveCtrl, FX_SLIDE_COUNT, fallback)),
            1,
            MAX_CARD_SLOTS
        );
    }

    function visibleCardWidth(cardCtrl, slides) {
        var source = cardSourceFromSlides(slides);
        var baseW = getSliderValue(
            cardCtrl,
            FX_CARD_W,
            source ? source.width : 1920
        );
        var baseH = getSliderValue(
            cardCtrl,
            FX_CARD_H,
            source ? source.height : 1080
        );
        var mode = getMenuValue(cardCtrl, FX_CARD_ORIENTATION, 1);
        return Math.max(1, mode === 2 ? baseH : baseW);
    }

    function safeRadiusForActiveCount(moveCtrl, cardCtrl, slides) {
        var count = activeSlideCount(moveCtrl, slides);
        if (count <= 1) return 0;
        return (visibleCardWidth(cardCtrl, slides) / 2) /
            Math.sin(Math.PI / count);
    }

    function cameraDistanceFromComp(comp, fallback) {
        try {
            var camera = comp ? comp.layer(CAMERA_NAME) : null;
            var transform = camera
                ? camera.property("ADBE Transform Group")
                : null;
            var position = transform
                ? transform.property("ADBE Position")
                : null;
            if (position) return Math.max(1, Math.abs(position.value[2]));
        } catch (ignored) {
        }
        return fallback;
    }

    function ensureMovementControllerEffects(moveCtrl, cardCtrl, slides) {
        if (!moveCtrl) return;

        removeEffects(moveCtrl, [
            "Rig Version",
            "Depth Card Tilt",
            "Depth Tilt X",
            "Depth Tilt X Angle",
            "Depth Tilt Y",
            "Depth Tilt Y Angle",
            "Depth Tilt Z",
            "Depth Tilt Z Angle"
        ]);

        ensureCheckboxEffect(moveCtrl, FX_AUTO_RADIUS, true);
        ensureSliderEffect(moveCtrl, FX_SLIDE_COUNT, activeSlideCount(
            moveCtrl,
            slides
        ));
        ensureSliderEffect(moveCtrl, FX_SLIDE_INDEX, 1);
        ensureSliderEffect(moveCtrl, FX_PROGRESS, 0);
        ensureSliderEffect(
            moveCtrl,
            FX_RADIUS,
            Math.round(safeRadiusForActiveCount(moveCtrl, cardCtrl, slides))
        );
        ensureSliderEffect(moveCtrl, FX_RADIUS_OFFSET, 0);
        ensureAngleEffect(moveCtrl, FX_ORBIT, 180);
        ensureCheckboxEffect(moveCtrl, FX_CONSTANT_SPEED, false);
        ensureSliderEffect(moveCtrl, FX_SPEED, 0);
        ensureSliderEffect(
            moveCtrl,
            FX_CAMERA_DISTANCE_Z,
            Math.round(cameraDistanceFromComp(moveCtrl.containingComp, 2500))
        );
        ensureDropdownEffect(
            moveCtrl,
            FX_AXIS,
            ["Y - circle in XZ", "Z - circle in XY", "X - circle in YZ"],
            1
        );
        ensureAngleEffect(moveCtrl, FX_TILT_X, 0);
        ensureAngleEffect(moveCtrl, FX_TILT_Y, 0);
        ensureAngleEffect(moveCtrl, FX_TILT_Z, 0);
        ensureSliderEffect(moveCtrl, FX_GLOBAL_SCALE, 100);
        ensureSliderEffect(moveCtrl, FX_FAR_SCALE, 70);
        ensureCheckboxEffect(moveCtrl, FX_POLYGON, false);
        ensureCheckboxEffect(moveCtrl, FX_SCALE_RADIUS, false);
        ensureDropdownEffect(
            moveCtrl,
            FX_DEPTH_TILT_AXIS,
            ["Off", "X", "Y", "Z"],
            1
        );
        ensureAngleEffect(moveCtrl, FX_DEPTH_TILT_ANGLE, 25);
        ensureDropdownEffect(
            moveCtrl,
            FX_DEPTH_TILT_DIRECTION,
            ["Same", "Symmetric", "Invert"],
            2
        );
        ensureDropdownEffect(
            moveCtrl,
            FX_DEPTH_CURVE,
            ["Linear", "Smooth"],
            2
        );
    }

    function ensureCardControllerEffects(cardCtrl, slides) {
        if (!cardCtrl) return;
        var source = cardSourceFromSlides(slides);
        ensureDropdownEffect(
            cardCtrl,
            FX_CARD_ORIENTATION,
            ["Horizontal", "Vertical"],
            1
        );
        ensureSliderEffect(
            cardCtrl,
            FX_CARD_W,
            source ? source.width : 1920,
            ["Card Width (%)"]
        );
        ensureSliderEffect(
            cardCtrl,
            FX_CARD_H,
            source ? source.height : 1080,
            ["Card Height (%)"]
        );
        ensureSliderEffect(cardCtrl, FX_CARD_RADIUS, 60);
        ensureColorEffect(cardCtrl, FX_CARD_FILL, [0.12, 0.12, 0.13]);
        ensureColorEffect(cardCtrl, FX_STROKE, [0.25, 0.25, 0.27]);
        ensureSliderEffect(cardCtrl, FX_STROKE_W, 6);
        ensureColorEffect(cardCtrl, FX_STROKE_NEAR, [1, 1, 1]);
        ensureSliderEffect(cardCtrl, FX_STROKE_W_NEAR, 10);
        ensureSliderEffect(
            cardCtrl,
            FX_STROKE_REACTION,
            2,
            ["Stroke Reaction Depth Range"]
        );
        ensureSliderEffect(cardCtrl, FX_PHOTO_PAD_X, 16);
        ensureSliderEffect(cardCtrl, FX_PHOTO_PAD_Y, 16);
        ensureSliderEffect(cardCtrl, FX_PHOTO_RADIUS, 85);
        ensureCheckboxEffect(cardCtrl, FX_SHOW_TEXT, true);
        ensureColorEffect(cardCtrl, FX_TEXT_FILL, [1, 1, 1]);
        ensureSliderEffect(cardCtrl, FX_TEXT_SIZE, 140);
        ensureSliderEffect(cardCtrl, FX_TEXT_X, 0);
        ensureSliderEffect(cardCtrl, FX_TEXT_Y, 0);
    }

    function ensureControllerEffects(moveCtrl, cardCtrl, slides) {
        ensureCardControllerEffects(cardCtrl, slides);
        ensureMovementControllerEffects(moveCtrl, cardCtrl, slides);
    }

    function resetMovementController(moveCtrl, cardCtrl, slides, issues) {
        var count = activeSlideCount(moveCtrl, slides);
        var radius = Math.round(safeRadiusForActiveCount(
            moveCtrl,
            cardCtrl,
            slides
        ));
        setEffectValue(moveCtrl, FX_AUTO_RADIUS, "Checkbox", 1, issues);
        setEffectValue(moveCtrl, FX_SLIDE_COUNT, "Slider", count, issues);
        setEffectValue(moveCtrl, FX_SLIDE_INDEX, "Slider", 1, issues);
        setEffectValue(moveCtrl, FX_PROGRESS, "Slider", 0, issues);
        setEffectValue(moveCtrl, FX_RADIUS, "Slider", radius, issues);
        setEffectValue(moveCtrl, FX_RADIUS_OFFSET, "Slider", 0, issues);
        setEffectValue(moveCtrl, FX_ORBIT, "Angle", 180, issues);
        setEffectValue(moveCtrl, FX_CONSTANT_SPEED, "Checkbox", 0, issues);
        setEffectValue(moveCtrl, FX_SPEED, "Slider", 0, issues);
        setEffectValue(
            moveCtrl,
            FX_CAMERA_DISTANCE_Z,
            "Slider",
            Math.round(cameraDistanceFromComp(moveCtrl.containingComp, 2500)),
            issues
        );
        setMenuValue(moveCtrl, FX_AXIS, 1, issues);
        setEffectValue(moveCtrl, FX_TILT_X, "Angle", 0, issues);
        setEffectValue(moveCtrl, FX_TILT_Y, "Angle", 0, issues);
        setEffectValue(moveCtrl, FX_TILT_Z, "Angle", 0, issues);
        setEffectValue(moveCtrl, FX_GLOBAL_SCALE, "Slider", 100, issues);
        setEffectValue(moveCtrl, FX_FAR_SCALE, "Slider", 70, issues);
        setEffectValue(moveCtrl, FX_POLYGON, "Checkbox", 0, issues);
        setEffectValue(moveCtrl, FX_SCALE_RADIUS, "Checkbox", 0, issues);
        setMenuValue(moveCtrl, FX_DEPTH_TILT_AXIS, 1, issues);
        setEffectValue(moveCtrl, FX_DEPTH_TILT_ANGLE, "Angle", 25, issues);
        setMenuValue(moveCtrl, FX_DEPTH_TILT_DIRECTION, 2, issues);
        setMenuValue(moveCtrl, FX_DEPTH_CURVE, 2, issues);
    }

    function resetCardController(cardCtrl, issues) {
        setEffectValue(cardCtrl, FX_CARD_RADIUS, "Slider", 60, issues);
        setEffectValue(
            cardCtrl,
            FX_CARD_FILL,
            "Color",
            [0.12, 0.12, 0.13],
            issues
        );
        setEffectValue(
            cardCtrl,
            FX_STROKE,
            "Color",
            [0.25, 0.25, 0.27],
            issues
        );
        setEffectValue(cardCtrl, FX_STROKE_W, "Slider", 6, issues);
        setEffectValue(
            cardCtrl,
            FX_STROKE_NEAR,
            "Color",
            [1, 1, 1],
            issues
        );
        setEffectValue(cardCtrl, FX_STROKE_W_NEAR, "Slider", 10, issues);
        setEffectValue(cardCtrl, FX_STROKE_REACTION, "Slider", 2, issues);
        setEffectValue(cardCtrl, FX_PHOTO_PAD_X, "Slider", 16, issues);
        setEffectValue(cardCtrl, FX_PHOTO_PAD_Y, "Slider", 16, issues);
        setEffectValue(cardCtrl, FX_PHOTO_RADIUS, "Slider", 85, issues);
        setEffectValue(
            cardCtrl,
            FX_TEXT_FILL,
            "Color",
            [1, 1, 1],
            issues
        );
        setEffectValue(cardCtrl, FX_TEXT_SIZE, "Slider", 140, issues);
        setEffectValue(cardCtrl, FX_TEXT_X, "Slider", 0, issues);
        setEffectValue(cardCtrl, FX_TEXT_Y, "Slider", 0, issues);
    }

    function resetCamera(main, issues) {
        var camera = main.layer(CAMERA_NAME) ||
            main.layer("KR_CAMERA");
        if (!camera) {
            issues.push(main.name + ": camera not found");
            return;
        }

        var cameraOptions = camera.property("ADBE Camera Options Group");
        setCameraOption(
            cameraOptions,
            "ADBE Camera Zoom",
            main.width * 50 / FILM_SIZE_MM,
            "Camera zoom",
            issues
        );
        setCameraOption(
            cameraOptions,
            "ADBE Camera Depth of Field",
            0,
            "Camera depth of field",
            issues
        );
        setCameraOption(
            cameraOptions,
            "ADBE Camera Aperture",
            8.93,
            "Camera aperture",
            issues
        );
        setCameraOption(
            cameraOptions,
            "ADBE Camera Blur Level",
            100,
            "Camera blur level",
            issues
        );

        try {
            var transform = camera.property("ADBE Transform Group");
            var position = transform.property("ADBE Position").value;
            var pointOfInterest = transform.property("ADBE Anchor Point");
            if (!pointOfInterest) {
                pointOfInterest = transform.property("Point of Interest");
            }
            var target = pointOfInterest
                ? pointOfInterest.value
                : [main.width * 0.5, main.height * 0.5, 0];
            var dx = position[0] - target[0];
            var dy = position[1] - target[1];
            var dz = position[2] - target[2];
            setCameraOption(
                cameraOptions,
                "ADBE Camera Focus Distance",
                Math.sqrt(dx * dx + dy * dy + dz * dz),
                "Camera focus distance",
                issues
            );
        } catch (focusError) {
            setCameraOption(
                cameraOptions,
                "ADBE Camera Focus Distance",
                2500,
                "Camera focus distance",
                issues
            );
        }
    }

    function updateActiveRig() {
        var main = getActiveRigComp();
        var issues = [];
        if (!main) {
            issues.push(
                "Activate a CR_MAIN or KR_MAIN composition first."
            );
            return {
                mainName: "",
                cardCount: 0,
                issues: issues
            };
        }

        var oldMainName = main.name;
        var idMatch = /^(?:MAIN|CR_MAIN|KR_MAIN)_(\d+)$/.exec(oldMainName);
        var id = idMatch ? idMatch[1] : "01";
        var newMainName = "MAIN_" + id;
        var slides = collectRigSlides(main);
        var cardCtrl = main.layer(CARD_CTRL) ||
            main.layer(LEGACY_CARD_CTRL);
        var moveCtrl = main.layer(MOVE_CTRL);
        var camera = main.layer(CAMERA_NAME) ||
            main.layer("KR_CAMERA");
        var rig = main.layer(RIG_NAME) ||
            main.layer("KR_RIG");

        if (!cardCtrl || !moveCtrl || !camera || !rig ||
            slides.length === 0) {
            issues = checkRig(main);
            return {
                mainName: main.name,
                cardCount: slides.length,
                issues: issues
            };
        }

        cardCtrl.name = CARD_CTRL;
        camera.name = CAMERA_NAME;
        rig.name = RIG_NAME;
        main.name = newMainName;

        var root = main.parentFolder &&
            main.parentFolder.parentFolder
            ? main.parentFolder.parentFolder
            : null;
        if (root && /^KARRIG_CYLINDER_/.test(root.name)) {
            root.name = root.name.replace(
                /^KARRIG_CYLINDER_/,
                "CARRIG_CYLINDER_"
            );
        }

        migrateCardSizeControls(cardCtrl, slides);
        ensureControllerEffects(moveCtrl, cardCtrl, slides);
        bindCameraDistance(camera, issues);
        removeBackgroundLayer(main);

        var replacements = [
            [oldMainName, newMainName],
            [LEGACY_CARD_CTRL, CARD_CTRL],
            ["KR_CAMERA", CAMERA_NAME],
            ["KR_RIG", RIG_NAME],
            [LEGACY_SLIDE_ID, SLIDE_ID]
        ];

        for (var i = 0; i < slides.length; i++) {
            var slideInfo = slides[i];
            var slide = slideInfo.layer;
            var source = slide.source;
            slideInfo.idEffect.name = SLIDE_ID;

            var phMatch = /^(?:CR|KR)\d+_PH_(\d+)$/.exec(source.name);
            if (phMatch) {
                source.name = "PH_" + phMatch[1];
            }
            slide.name = source.name;

            ensurePlaceholderCanvas(source, main, issues);
            migrateCompExpressions(source, replacements, issues);
            assignTextVisibility(source, newMainName, issues);
            assignCircularBorderExpressions(source, newMainName, issues);
            assignSlideRuntimeExpressions(
                slide,
                slides.length,
                issues,
                slide.containingComp === main ? null : newMainName,
                slide.containingComp !== main
            );
        }

        migrateCompExpressions(main, replacements, issues);
        precomposeSlidesIntoPHS(main, issues);
        var audioLayer = ensureAudioLayer(main, issues);
        cardCtrl.moveToBeginning();
        moveCtrl.moveToBeginning();
        placeAudioLayer(main, audioLayer);
        placePHSLayer(main, findPHSLayer(main));

        var checkIssues = checkRig(main);
        for (var issueIndex = 0;
            issueIndex < checkIssues.length;
            issueIndex++) {
            issues.push(checkIssues[issueIndex]);
        }

        main.openInViewer();
        return {
            mainName: main.name,
            cardCount: slides.length,
            issues: issues
        };
    }

    function resetActiveRig() {
        var updateResult = updateActiveRig();
        var issues = updateResult.issues || [];
        var main = getActiveRigComp();
        if (!main) {
            return updateResult;
        }

        var slides = collectRigSlides(main);
        var cardCtrl = main.layer(CARD_CTRL) ||
            main.layer(LEGACY_CARD_CTRL);
        var moveCtrl = main.layer(MOVE_CTRL);
        if (!cardCtrl || !moveCtrl || slides.length === 0) {
            var checkIssues = checkRig(main);
            for (var i = 0; i < checkIssues.length; i++) {
                issues.push(checkIssues[i]);
            }
            return {
                mainName: main.name,
                cardCount: slides.length,
                issues: issues
            };
        }

        ensureControllerEffects(moveCtrl, cardCtrl, slides);
        resetMovementController(moveCtrl, cardCtrl, slides, issues);
        resetCardController(cardCtrl, issues);
        resetCamera(main, issues);

        var finalIssues = checkRig(main);
        for (var issueIndex = 0;
            issueIndex < finalIssues.length;
            issueIndex++) {
            issues.push(finalIssues[issueIndex]);
        }

        main.openInViewer();
        return {
            mainName: main.name,
            cardCount: slides.length,
            issues: issues
        };
    }

    function addCardsToActiveRig(addCount) {
        var normalizedAddCount = parseInt(addCount, 10);
        var issues = [];
        if (isNaN(normalizedAddCount) || normalizedAddCount < 1) {
            issues.push("Add Cards: enter a positive number.");
            return {
                mainName: "",
                cardCount: 0,
                addedCount: 0,
                issues: issues
            };
        }

        var updateResult = updateActiveRig();
        for (var updateIssue = 0;
            updateIssue < updateResult.issues.length;
            updateIssue++) {
            issues.push(updateResult.issues[updateIssue]);
        }

        var main = getActiveRigComp();
        if (!main) {
            issues.push("Activate a CR_MAIN composition first.");
            return {
                mainName: "",
                cardCount: 0,
                addedCount: 0,
                issues: issues
            };
        }

        var slides = collectRigSlides(main);
        var currentCount = slides.length;
        if (currentCount >= MAX_CARD_SLOTS) {
            issues.push("Add Cards: maximum " + MAX_CARD_SLOTS + " cards.");
            return {
                mainName: main.name,
                cardCount: currentCount,
                addedCount: 0,
                issues: issues
            };
        }

        var allowedAddCount = Math.min(
            normalizedAddCount,
            MAX_CARD_SLOTS - currentCount
        );
        if (allowedAddCount < normalizedAddCount) {
            issues.push(
                "Add Cards: limited to " +
                allowedAddCount +
                " because max is " +
                MAX_CARD_SLOTS +
                "."
            );
        }

        var proj = ensureProject();
        var root = rootFolderForMain(main);
        if (!root) {
            issues.push("Add Cards: root folder not found.");
            return {
                mainName: main.name,
                cardCount: currentCount,
                addedCount: 0,
                issues: issues
            };
        }
        var placeholdersFolder = ensureChildFolder(
            proj,
            root,
            "PLACEHOLDERS"
        );

        var idMatch = /^(?:MAIN|CR_MAIN|KR_MAIN)_(\d+)$/.exec(main.name);
        var id = idMatch ? idMatch[1] : "01";
        var instanceTag = "CR" + id;
        var slideHost = slideHostComp(main);
        var cardCtrl = main.layer(CARD_CTRL) ||
            main.layer(LEGACY_CARD_CTRL);
        var moveCtrl = main.layer(MOVE_CTRL);
        var rig = main.layer(RIG_NAME) ||
            main.layer("KR_RIG");
        if (!cardCtrl || !moveCtrl || !rig || slides.length === 0) {
            var checkIssues = checkRig(main);
            for (var checkIndex = 0;
                checkIndex < checkIssues.length;
                checkIndex++) {
                issues.push(checkIssues[checkIndex]);
            }
            return {
                mainName: main.name,
                cardCount: currentCount,
                addedCount: 0,
                issues: issues
            };
        }

        var source = slides[0].layer.source;
        var cardWidth = Math.round(
            getSliderValue(cardCtrl, FX_CARD_W, source ? source.width : 1920)
        );
        var cardHeight = Math.round(
            getSliderValue(cardCtrl, FX_CARD_H, source ? source.height : 1080)
        );

        for (var i = 1; i <= allowedAddCount; i++) {
            var index = currentCount + i;
            var placeholder = createPlaceholder(
                proj,
                placeholdersFolder,
                main.name,
                instanceTag,
                index,
                main.duration,
                main.frameRate,
                cardWidth,
                cardHeight,
                issues,
                main.width,
                main.height
            );
            addSlideLayer(
                slideHost,
                placeholder,
                slideHost === main ? rig : null,
                cardWidth,
                cardHeight,
                index
            );
        }

        slides = collectRigSlides(main);
        var newCount = slides.length;
        setEffectValue(
            moveCtrl,
            FX_SLIDE_COUNT,
            "Slider",
            newCount,
            issues
        );
        refreshSlideRuntimeExpressions(
            slides,
            issues,
            slideHost !== main ? main.name : null,
            slideHost !== main
        );
        if (slideHost !== main) {
            retargetNestedSlideExpressions(slideHost, main.name, issues);
        }
        ensureControllerEffects(moveCtrl, cardCtrl, slides);
        var audioLayer = ensureAudioLayer(main, issues);
        cardCtrl.moveToBeginning();
        moveCtrl.moveToBeginning();
        placeAudioLayer(main, audioLayer);
        placePHSLayer(main, findPHSLayer(main));

        var finalIssues = checkRig(main);
        for (var finalIndex = 0;
            finalIndex < finalIssues.length;
            finalIndex++) {
            issues.push(finalIssues[finalIndex]);
        }

        main.openInViewer();
        return {
            mainName: main.name,
            cardCount: newCount,
            addedCount: allowedAddCount,
            issues: issues
        };
    }

    function replaceMediaActiveRig(mediaFolder) {
        var issues = [];
        var main = getActiveRigComp();
        if (!main) {
            issues.push("Activate a CR_MAIN composition first.");
            return {
                mainName: "",
                cardCount: 0,
                replacedCount: 0,
                importedCount: 0,
                issues: issues
            };
        }

        if (typeof mediaFolder === "undefined") {
            mediaFolder = Folder.selectDialog(
                "Select a folder with replacement photos or videos."
            );
        }
        if (!mediaFolder) {
            return {
                mainName: main.name,
                cardCount: 0,
                replacedCount: 0,
                importedCount: 0,
                issues: issues
            };
        }

        var updateResult = updateActiveRig();
        for (var updateIssue = 0;
            updateIssue < updateResult.issues.length;
            updateIssue++) {
            issues.push(updateResult.issues[updateIssue]);
        }
        main = getActiveRigComp();
        var slides = collectRigSlides(main);
        var root = rootFolderForMain(main);
        var footageFolder = ensureChildFolder(
            ensureProject(),
            root,
            "FOOTAGE"
        );
        var mediaFiles = getMediaFiles(mediaFolder);
        if (mediaFiles.length === 0) {
            issues.push("Replace Media: no supported media files found.");
            return {
                mainName: main.name,
                cardCount: slides.length,
                replacedCount: 0,
                importedCount: 0,
                issues: issues
            };
        }

        var imported = importMedia(
            ensureProject(),
            mediaFiles,
            footageFolder,
            issues
        );
        var replaceCount = Math.min(imported.length, slides.length);
        for (var i = 0; i < replaceCount; i++) {
            replacePhoto(slides[i].layer.source, imported[i], issues);
        }
        if (imported.length < slides.length) {
            issues.push(
                "Replace Media: only " +
                imported.length +
                " files for " +
                slides.length +
                " cards."
            );
        }
        if (imported.length > slides.length) {
            issues.push(
                "Replace Media: imported " +
                imported.length +
                " files, used first " +
                slides.length +
                "."
            );
        }

        var finalIssues = checkRig(main);
        for (var finalIndex = 0;
            finalIndex < finalIssues.length;
            finalIndex++) {
            issues.push(finalIssues[finalIndex]);
        }
        main.openInViewer();
        return {
            mainName: main.name,
            cardCount: slides.length,
            replacedCount: replaceCount,
            importedCount: imported.length,
            issues: issues
        };
    }

    function collectMissingFootage(root, issues) {
        var proj = ensureProject();
        var missingCount = 0;
        for (var i = 1; i <= proj.numItems; i++) {
            var item = proj.item(i);
            if (root && !itemIsInFolderTree(item, root)) continue;
            try {
                if (item instanceof FootageItem && item.footageMissing) {
                    missingCount++;
                    issues.push("Missing footage: " + item.name);
                }
            } catch (err) {
            }
        }
        return missingCount;
    }

    function cleanCheckProject() {
        var updateResult = updateActiveRig();
        var issues = updateResult.issues || [];
        var main = getActiveRigComp();
        if (!main) {
            return updateResult;
        }

        var root = rootFolderForMain(main);
        var missingCount = collectMissingFootage(root, issues);
        var finalIssues = checkRig(main);
        for (var i = 0; i < finalIssues.length; i++) {
            issues.push(finalIssues[i]);
        }

        return {
            mainName: main.name,
            cardCount: collectRigSlides(main).length,
            missingFootageCount: missingCount,
            issues: issues
        };
    }

    function build(options) {
        var proj = ensureProject();
        var issues = [];
        var cameraSettings = options.camera || {
            focalLength: 50,
            depthOfField: false,
            focusCenter: true,
            focusDistance: 2500,
            fStop: 5.6,
            aperture: 8.93,
            blurLevel: 100
        };
        if (
            typeof cameraSettings.aperture !== "number" ||
            isNaN(cameraSettings.aperture)
        ) {
            cameraSettings.aperture =
                cameraSettings.focalLength / cameraSettings.fStop;
        }
        var instanceNo = nextInstanceNumber(proj);
        var id = pad2(instanceNo);
        var instanceTag = "CR" + id;
        var mainName = "MAIN_" + id;
        var rootName = "CARRIG_CYLINDER_" + id;

        var width = options.vertical ? 2160 : 3840;
        var height = options.vertical ? 3840 : 2160;
        var fps = 30;

        var visibleCardWidth = options.cardW;
        var safeRadius = options.count <= 1
            ? 0
            : (visibleCardWidth / 2) / Math.sin(Math.PI / options.count);
        var focalLength = cameraSettings.focalLength;
        var zoom = width * focalLength / FILM_SIZE_MM;
        // Keep camera distance independent from the selected lens.
        // Otherwise the distance cancels the visual effect of focal length.
        var framingZoom =
            width * BASE_FOCAL_LENGTH_MM / FILM_SIZE_MM;
        var frontDistance =
            options.cardW * framingZoom / (width * 0.65);
        var cameraZ = -Math.max(2500, safeRadius + frontDistance);

        var root = addFolder(proj, rootName, null);
        var compsFolder = addFolder(proj, "COMPS", root);
        var placeholdersFolder = addFolder(proj, "PLACEHOLDERS", root);
        var footageFolder = addFolder(proj, "FOOTAGE", root);

        var main = proj.items.addComp(
            mainName,
            width,
            height,
            1,
            options.duration,
            fps
        );
        main.parentFolder = compsFolder;

        var moveCtrl = addMovementController(
            main,
            options.count,
            safeRadius,
            Math.abs(cameraZ),
            options.polygon,
            options.scaleWithRadius
        );
        var cardCtrl = addCardController(
            main,
            options.cardW,
            options.cardH,
            options.showText !== false
        );
        addCamera(
            main,
            cameraZ,
            {
                focalLength: focalLength,
                zoom: zoom,
                depthOfField: cameraSettings.depthOfField,
                focusCenter: cameraSettings.focusCenter,
                focusDistance: cameraSettings.focusDistance,
                fStop: cameraSettings.fStop,
                aperture: cameraSettings.aperture,
                blurLevel: cameraSettings.blurLevel
            },
            issues
        );

        var placeholders = [];
        var reserveCount = options.count;
        for (var i = 1; i <= reserveCount; i++) {
            placeholders.push(createPlaceholder(
                proj,
                placeholdersFolder,
                mainName,
                instanceTag,
                i,
                options.duration,
                fps,
                options.cardW,
                options.cardH,
                issues,
                main.width,
                main.height
            ));
        }

        var importedCount = 0;
        if (options.mediaFolder) {
            var mediaFiles = getMediaFiles(options.mediaFolder);
            var imported = importMedia(proj, mediaFiles, footageFolder, issues);
            importedCount = Math.min(imported.length, placeholders.length);
            for (var k = 0; k < importedCount; k++) {
                replacePhoto(placeholders[k], imported[k], issues);
            }
        }

        addRigAndSlides(
            main,
            placeholders,
            options.cardW,
            options.cardH,
            issues
        );
        precomposeSlidesIntoPHS(main, issues);

        var audioLayer = ensureAudioLayer(main, issues);
        cardCtrl.moveToBeginning();
        moveCtrl.moveToBeginning();
        placeAudioLayer(main, audioLayer);
        placePHSLayer(main, findPHSLayer(main));
        main.hideShyLayers = true;
        main.openInViewer();

        return {
            mainName: mainName,
            rootName: rootName,
            cardCount: options.count,
            reserveCount: placeholders.length,
            importedCount: importedCount,
            issues: issues
        };
    }

    function showWarnings(issues) {
        if (!issues || issues.length === 0) return;

        var maxShown = Math.min(12, issues.length);
        var message = "CarRig warnings (" + issues.length + "):";
        for (var i = 0; i < maxShown; i++) {
            message += "\n- " + issues[i];
        }
        if (issues.length > maxShown) {
            message += "\n- ...and " + (issues.length - maxShown) + " more";
        }
        alert(message);
    }

    function createFromPanel(ui) {
        var count = parseInt(ui.count.text, 10);
        if (isNaN(count)) count = 8;
        count = clamp(count, 1, MAX_CARD_SLOTS);
        ui.count.text = String(count);

        var duration = parseFloat(ui.duration.text);
        if (isNaN(duration)) duration = 15;
        duration = clamp(duration, 1, 600);
        ui.duration.text = String(duration);

        var cardW = parseInt(ui.cardW.text, 10);
        if (isNaN(cardW)) cardW = 1920;
        cardW = clamp(cardW, 100, 10000);
        ui.cardW.text = String(cardW);

        var cardH = parseInt(ui.cardH.text, 10);
        if (isNaN(cardH)) cardH = 1080;
        cardH = clamp(cardH, 100, 10000);
        ui.cardH.text = String(cardH);

        var lensIndex = ui.lensPreset.selection
            ? ui.lensPreset.selection.index
            : 5;
        var focalLength = CAMERA_PRESETS[lensIndex];

        var focusDistance = parseFloat(ui.focusDistance.text);
        if (isNaN(focusDistance)) focusDistance = 2500;
        focusDistance = clamp(focusDistance, 1, 1000000);
        ui.focusDistance.text = String(focusDistance);

        var fStop = parseFloat(ui.fStop.text);
        if (isNaN(fStop)) fStop = 5.6;
        fStop = clamp(fStop, 0.1, 128);
        ui.fStop.text = String(fStop);

        var aperture = parseFloat(ui.aperture.text);
        if (isNaN(aperture)) aperture = focalLength / fStop;
        aperture = clamp(aperture, 0.01, 10000);
        ui.aperture.text = String(aperture);

        var blurLevel = parseFloat(ui.blurLevel.text);
        if (isNaN(blurLevel)) blurLevel = 100;
        blurLevel = clamp(blurLevel, 0, 1000);
        ui.blurLevel.text = String(blurLevel);

        var mediaFolder = null;
        if (ui.importMedia.value) {
            mediaFolder = Folder.selectDialog(
                "Select a folder with photos or videos."
            );
        }

        ui.createButton.enabled = false;
        if (ui.updateButton) ui.updateButton.enabled = false;
        if (ui.resetButton) ui.resetButton.enabled = false;
        if (ui.addCardsButton) ui.addCardsButton.enabled = false;
        if (ui.replaceMediaButton) ui.replaceMediaButton.enabled = false;
        if (ui.cleanCheckButton) ui.cleanCheckButton.enabled = false;
        ui.status.text = "Working...";
        app.beginUndoGroup("carusel_builder_RV v" + VERSION);
        try {
            var result = build({
                count: count,
                duration: duration,
                cardW: cardW,
                cardH: cardH,
                vertical: ui.orientation.selection.index === 1,
                polygon: ui.polygon.value,
                scaleWithRadius: ui.scaleWithRadius.value,
                showText: ui.showText.value,
                camera: {
                    focalLength: focalLength,
                    depthOfField: ui.depthOfField.value,
                    focusCenter: ui.focusCenter.value,
                    focusDistance: focusDistance,
                    fStop: fStop,
                    aperture: aperture,
                    blurLevel: blurLevel
                },
                mediaFolder: mediaFolder
            });

            ui.status.text = result.mainName;
            showWarnings(result.issues);
        } catch (err) {
            ui.status.text = "Error";
            alert(
                "carusel_builder_RV failed:\n" +
                err.toString() +
                (err.line ? "\nLine: " + err.line : "") +
                "\n\nUse Undo to remove a partial build."
            );
        } finally {
            app.endUndoGroup();
            ui.createButton.enabled = true;
            if (ui.updateButton) ui.updateButton.enabled = true;
            if (ui.resetButton) ui.resetButton.enabled = true;
            if (ui.addCardsButton) ui.addCardsButton.enabled = true;
            if (ui.replaceMediaButton) ui.replaceMediaButton.enabled = true;
            if (ui.cleanCheckButton) ui.cleanCheckButton.enabled = true;
        }
    }

    function setPanelButtonsEnabled(ui, enabled) {
        ui.createButton.enabled = enabled;
        ui.updateButton.enabled = enabled;
        ui.resetButton.enabled = enabled;
        ui.addCardsButton.enabled = enabled;
        ui.replaceMediaButton.enabled = enabled;
        ui.cleanCheckButton.enabled = enabled;
    }

    function runActiveRigPanelCommand(ui, statusText, undoName, command) {
        setPanelButtonsEnabled(ui, false);
        ui.status.text = statusText;
        app.beginUndoGroup(undoName);
        try {
            var result = command();
            if (result.issues && result.issues.length > 0) {
                ui.status.text = "Finished with warnings";
            } else {
                ui.status.text = result.mainName || "Ready";
            }
            showWarnings(result.issues);
        } catch (err) {
            ui.status.text = "Error";
            alert(
                undoName + " failed:\n" +
                err.toString() +
                (err.line ? "\nLine: " + err.line : "")
            );
        } finally {
            app.endUndoGroup();
            setPanelButtonsEnabled(ui, true);
        }
    }


    // Delete the entire circular rig folder after a clear user confirmation.
    function removeItemTree(item) {
        if (!item) return;
        if (item instanceof FolderItem) {
            while (item.numItems > 0) {
                removeItemTree(item.item(item.numItems));
            }
        }
        item.remove();
    }

    function deleteActiveRig(askConfirmation) {
        var main = getActiveRigComp();
        if (!main) {
            return {
                deleted: false,
                rootName: "",
                message: "Activate a CR_MAIN composition first."
            };
        }

        var root = rootFolderForMain(main);
        if (!root) {
            return {
                deleted: false,
                rootName: "",
                message: main.name + ": root folder not found."
            };
        }

        if (
            askConfirmation !== false &&
            !confirm(
                "Delete " + root.name +
                " and all of its comps and footage?"
            )
        ) {
            return {
                deleted: false,
                rootName: root.name,
                message: "Cancelled"
            };
        }

        var rootName = root.name;
        removeItemTree(root);
        return {
            deleted: true,
            rootName: rootName,
            message: ""
        };
    }


        return {
            type: TYPE_CIRCULAR,
            version: VERSION,
            build: build,
            updateActiveRig: updateActiveRig,
            resetActiveRig: resetActiveRig,
            deleteActiveRig: deleteActiveRig,
            addCardsToActiveRig: addCardsToActiveRig,
            replaceMediaActiveRig: replaceMediaActiveRig,
            cleanCheckProject: cleanCheckProject
        };
    }

    // Keep the proven linear builder in its own private scope.
    function createLinearModule() {

    var VERSION = "7.5.2";
    var FILM_SIZE_MM = 36;
    var BASE_FOCAL_LENGTH_MM = 35;
    var MAX_CARD_SLOTS = 40;
    var CAMERA_PRESETS = [15, 20, 24, 28, 35, 50, 80, 100, 135, 200];

    var MOVE_CTRL = "main_control";
    var CARD_CTRL = "card_control";
    var PHS_NAME = "PHS";
    var CAMERA_NAME = "CL_CAMERA";
    var RIG_NAME = "CL_RIG";
    var SLIDE_ID = "CL Slide ID";
    var AUDIO_COMP_NAME = "audio";
    var AUDIO_LAYER_NAME = "audio";

    var FX_SLIDE_COUNT = "Slide Count";
    var FX_SLIDE_INDEX = "Slide Index";
    var FX_PROGRESS = "Progress (%)";
    var FX_POSITION_X = "Position X (px)";
    var FX_POSITION_Y = "Position Y (px)";
    var FX_POSITION_Z = "Position Z (px)";
    var FX_LINE_DIRECTION = "Line Direction";
    var FX_CONSTANT_SPEED = "Constant Speed";
    var FX_SPEED = "Speed";
    var FX_CAMERA_DISTANCE_Z = "Camera Distance Z";
    var FX_CARD_DIRECTION = "Card Direction";
    var FX_CARD_SPACING = "Card Spacing (px)";
    var FX_FOCUS_SCALE = "Focus Scale (%)";
    var FX_SIDE_SCALE = "Side Scale (%)";
    var FX_FOCUS_WIDTH = "Focus Width (cards)";
    var FX_CAMERA_PUSH = "Camera Push (px)";
    var FX_SIDE_ANGLE = "Side Angle";

    var FX_CARD_ORIENTATION = "Card Orientation";
    var FX_CARD_W = "Card Width (px)";
    var FX_CARD_H = "Card Height (px)";
    var FX_CARD_RADIUS = "Card Radius (px)";
    var FX_CARD_FILL = "Card Fill";
    var FX_STROKE = "Stroke";
    var FX_STROKE_W = "Stroke Width";
    var FX_STROKE_NEAR = "Stroke Near";
    var FX_STROKE_W_NEAR = "Stroke Near Width";
    var FX_STROKE_REACTION = "Stroke Reaction Width (%)";
    var STROKE_PROXIMITY_AMOUNT = "CL Stroke Proximity";
    var FX_PHOTO_PADDING = "Photo Padding (px)";
    var FX_TEXT_FILL = "Text Fill";
    var FX_TEXT_SIZE = "Text Size";
    var FX_TEXT_X = "Text X";
    var FX_TEXT_Y = "Text Y";

    function clamp(v, minV, maxV) {
        return Math.max(minV, Math.min(maxV, v));
    }

    function pad2(n) {
        return n < 10 ? "0" + n : String(n);
    }

    function ensureProject() {
        if (!app.project) app.newProject();
        return app.project;
    }

    function makePanel(thisObj) {
        var w = thisObj instanceof Panel
            ? thisObj
            : new Window(
                "palette",
                "carusel_builder_RV Linear v" + VERSION,
                undefined,
                { resizeable: true }
            );
        w.orientation = "column";
        w.alignChildren = ["fill", "top"];

        var setup = w.add("panel", undefined, "Setup");
        setup.orientation = "column";
        setup.alignChildren = ["fill", "top"];

        var countRow = setup.add("group");
        countRow.add("statictext", undefined, "Cards:");
        var count = countRow.add("edittext", undefined, "8");
        count.characters = 7;

        var orientationRow = setup.add("group");
        orientationRow.add("statictext", undefined, "Main composition:");
        var orientation = orientationRow.add(
            "dropdownlist",
            undefined,
            ["Horizontal 3840 x 2160", "Vertical 2160 x 3840"]
        );
        orientation.selection = orientation.items[0];

        var durationRow = setup.add("group");
        durationRow.add("statictext", undefined, "Duration (seconds):");
        var duration = durationRow.add("edittext", undefined, "15");
        duration.characters = 7;

        var cardRow = setup.add("group");
        cardRow.add("statictext", undefined, "Card comp:");
        var cardW = cardRow.add("edittext", undefined, "1920");
        cardW.characters = 7;
        cardRow.add("statictext", undefined, "x");
        var cardH = cardRow.add("edittext", undefined, "1080");
        cardH.characters = 7;

        var importMedia = setup.add("checkbox", undefined, "Import photos/videos now");
        importMedia.value = false;

        var note = setup.add(
            "statictext",
            undefined,
            "Creates exactly the requested number of cards. Use Add Cards when you need more.",
            { multiline: true }
        );
        note.preferredSize.width = 430;

        var cameraPanel = w.add("panel", undefined, "Camera");
        cameraPanel.orientation = "column";
        cameraPanel.alignChildren = ["fill", "top"];

        var cameraNameRow = cameraPanel.add("group");
        cameraNameRow.add("statictext", undefined, "Name:");
        var cameraName = cameraNameRow.add(
            "edittext",
            undefined,
            CAMERA_NAME
        );
        cameraName.characters = 18;
        cameraName.enabled = false;

        var lensRow = cameraPanel.add("group");
        lensRow.add("statictext", undefined, "Lens preset:");
        var lensItems = [];
        for (var lensIndex = 0;
            lensIndex < CAMERA_PRESETS.length;
            lensIndex++) {
            lensItems.push(CAMERA_PRESETS[lensIndex] + " mm");
        }
        var lensPreset = lensRow.add(
            "dropdownlist",
            undefined,
            lensItems
        );
        lensPreset.selection = lensPreset.items[5];

        var zoomInfo = cameraPanel.add(
            "statictext",
            undefined,
            "Zoom: automatic"
        );

        var depthOfField = cameraPanel.add(
            "checkbox",
            undefined,
            "Enable Depth of Field"
        );
        depthOfField.value = false;

        var focusCenter = cameraPanel.add(
            "checkbox",
            undefined,
            "Focus on carousel center"
        );
        focusCenter.value = true;

        var focusRow = cameraPanel.add("group");
        focusRow.add("statictext", undefined, "Focus distance:");
        var focusDistance = focusRow.add("edittext", undefined, "2500");
        focusDistance.characters = 9;
        focusRow.add("statictext", undefined, "px");

        var fStopRow = cameraPanel.add("group");
        fStopRow.add("statictext", undefined, "F-Stop:");
        var fStop = fStopRow.add("edittext", undefined, "5.6");
        fStop.characters = 7;

        var apertureRow = cameraPanel.add("group");
        apertureRow.add("statictext", undefined, "Aperture:");
        var aperture = apertureRow.add("edittext", undefined, "8.93");
        aperture.characters = 7;
        apertureRow.add("statictext", undefined, "mm");

        var blurRow = cameraPanel.add("group");
        blurRow.add("statictext", undefined, "Blur Level:");
        var blurLevel = blurRow.add("edittext", undefined, "100");
        blurLevel.characters = 7;
        blurRow.add("statictext", undefined, "%");

        function selectedFocalLength() {
            var selectedIndex = lensPreset.selection
                ? lensPreset.selection.index
                : 5;
            return CAMERA_PRESETS[selectedIndex];
        }

        function updateCameraUi() {
            var focalLength = selectedFocalLength();
            var compWidth = orientation.selection.index === 1
                ? 2160
                : 3840;
            var zoom = compWidth * focalLength / FILM_SIZE_MM;
            zoomInfo.text = "Zoom: " + zoom.toFixed(2) + " px";

            focusCenter.enabled = depthOfField.value;
            focusRow.enabled =
                depthOfField.value && !focusCenter.value;
            fStopRow.enabled = depthOfField.value;
            apertureRow.enabled = depthOfField.value;
            blurRow.enabled = depthOfField.value;
        }

        function uiNumber(field, fallback, minValue, maxValue) {
            var value = parseFloat(field.text);
            if (isNaN(value)) value = fallback;
            return clamp(value, minValue, maxValue);
        }

        function syncApertureFromFStop() {
            var focalLength = selectedFocalLength();
            var parsedFStop = uiNumber(fStop, 5.6, 0.1, 128);
            aperture.text = (
                focalLength / parsedFStop
            ).toFixed(2);
        }

        function syncFStopFromAperture() {
            var focalLength = selectedFocalLength();
            var parsedAperture = uiNumber(
                aperture,
                focalLength / 5.6,
                0.01,
                10000
            );
            fStop.text = (
                focalLength / parsedAperture
            ).toFixed(2);
        }

        function applyCameraUiToActiveComp() {
            var comp = app.project ? app.project.activeItem : null;
            if (!(comp instanceof CompItem)) return false;

            var camera = comp.layer(CAMERA_NAME) ||
                comp.layer("KR_CAMERA");
            if (!camera) return false;

            try {
                var focalLength = selectedFocalLength();
                var parsedAperture = uiNumber(
                    aperture,
                    focalLength / 5.6,
                    0.01,
                    10000
                );
                var parsedFocus = uiNumber(
                    focusDistance,
                    2500,
                    1,
                    1000000
                );
                var parsedBlur = uiNumber(
                    blurLevel,
                    100,
                    0,
                    1000
                );
                var cameraOptions = camera.property(
                    "ADBE Camera Options Group"
                );
                var transform = camera.property(
                    "ADBE Transform Group"
                );

                cameraOptions.property("ADBE Camera Zoom").setValue(
                    comp.width * focalLength / FILM_SIZE_MM
                );
                cameraOptions.property(
                    "ADBE Camera Depth of Field"
                ).setValue(depthOfField.value ? 1 : 0);
                cameraOptions.property("ADBE Camera Aperture").setValue(
                    parsedAperture
                );
                cameraOptions.property("ADBE Camera Blur Level").setValue(
                    parsedBlur
                );

                if (focusCenter.value && transform) {
                    var cameraPosition = transform.property(
                        "ADBE Position"
                    ).value;
                    var pointOfInterest = transform.property(
                        "ADBE Anchor Point"
                    );
                    if (!pointOfInterest) {
                        pointOfInterest = transform.property(
                            "Point of Interest"
                        );
                    }
                    if (pointOfInterest) {
                        var target = pointOfInterest.value;
                        var dx = cameraPosition[0] - target[0];
                        var dy = cameraPosition[1] - target[1];
                        var dz = cameraPosition[2] - target[2];
                        parsedFocus = Math.sqrt(
                            dx * dx + dy * dy + dz * dz
                        );
                    }
                }
                cameraOptions.property(
                    "ADBE Camera Focus Distance"
                ).setValue(parsedFocus);

                if (status) {
                    status.text =
                        CAMERA_NAME + " updated: " +
                        focalLength + " mm";
                }
                return true;
            } catch (cameraUiError) {
                if (status) status.text = "Camera update error";
                return false;
            }
        }

        function updateAndApplyCameraUi() {
            updateCameraUi();
            applyCameraUiToActiveComp();
        }

        lensPreset.onChange = function () {
            syncApertureFromFStop();
            updateAndApplyCameraUi();
        };
        orientation.onChange = updateCameraUi;
        depthOfField.onClick = updateAndApplyCameraUi;
        focusCenter.onClick = updateAndApplyCameraUi;
        fStop.onChanging = function () {
            syncApertureFromFStop();
            updateCameraUi();
        };
        fStop.onChange = function () {
            syncApertureFromFStop();
            updateAndApplyCameraUi();
        };
        aperture.onChanging = syncFStopFromAperture;
        aperture.onChange = function () {
            syncFStopFromAperture();
            updateAndApplyCameraUi();
        };
        focusDistance.onChange = updateAndApplyCameraUi;
        blurLevel.onChange = updateAndApplyCameraUi;
        updateCameraUi();

        var buttons = w.add("group");
        buttons.alignment = "right";
        var createButton = buttons.add(
            "button",
            undefined,
            "Create Linear Carousel"
        );
        var updateButton = buttons.add(
            "button",
            undefined,
            "Update Active"
        );
        var resetButton = buttons.add(
            "button",
            undefined,
            "Reset Active"
        );
        var deleteButton = buttons.add(
            "button",
            undefined,
            "Delete Active"
        );

        var maintenanceButtons = w.add("group");
        maintenanceButtons.alignment = "right";
        var addCardsButton = maintenanceButtons.add(
            "button",
            undefined,
            "Add Cards"
        );
        var replaceMediaButton = maintenanceButtons.add(
            "button",
            undefined,
            "Replace Media"
        );
        var cleanCheckButton = maintenanceButtons.add(
            "button",
            undefined,
            "Clean/Check"
        );

        var status = w.add("statictext", undefined, "Ready");
        status.alignment = ["fill", "top"];

        return {
            win: w,
            count: count,
            orientation: orientation,
            duration: duration,
            cardW: cardW,
            cardH: cardH,
            importMedia: importMedia,
            lensPreset: lensPreset,
            depthOfField: depthOfField,
            focusCenter: focusCenter,
            focusDistance: focusDistance,
            fStop: fStop,
            aperture: aperture,
            blurLevel: blurLevel,
            createButton: createButton,
            updateButton: updateButton,
            resetButton: resetButton,
            deleteButton: deleteButton,
            addCardsButton: addCardsButton,
            replaceMediaButton: replaceMediaButton,
            cleanCheckButton: cleanCheckButton,
            status: status
        };
    }

    function nextInstanceNumber(proj) {
        var maxId = 0;
        var mainRe = /^MAIN_(\d+)$/;
        var legacyMainRe = /^(?:CR|KR|CL)_MAIN_(\d+)$/;
        var rootRe = /^CARUSEL_LINEAR_(\d+)$/;
        for (var i = 1; i <= proj.numItems; i++) {
            var item = proj.item(i);
            var match = mainRe.exec(item.name) ||
                legacyMainRe.exec(item.name) ||
                rootRe.exec(item.name);
            if (match) maxId = Math.max(maxId, parseInt(match[1], 10) || 0);
        }
        return maxId + 1;
    }

    function addFolder(proj, name, parent) {
        var folder = proj.items.addFolder(name);
        if (parent) folder.parentFolder = parent;
        return folder;
    }

    function findChildFolder(proj, parent, name) {
        if (!proj || !parent) return null;
        for (var i = 1; i <= proj.numItems; i++) {
            var item = proj.item(i);
            if (item instanceof FolderItem &&
                item.parentFolder === parent &&
                item.name === name) {
                return item;
            }
        }
        return null;
    }

    function ensureChildFolder(proj, parent, name) {
        var folder = findChildFolder(proj, parent, name);
        if (folder) return folder;
        return addFolder(proj, name, parent);
    }

    function addAudioComp(proj, folder, main) {
        var audioComp = proj.items.addComp(
            AUDIO_COMP_NAME,
            main.width,
            main.height,
            1,
            main.duration,
            main.frameRate
        );
        if (folder) audioComp.parentFolder = folder;
        return audioComp;
    }

    function findPHSLayer(main) {
        if (!main) return null;
        try {
            var direct = main.layer(PHS_NAME);
            if (direct && direct.source instanceof CompItem) return direct;
        } catch (ignoredDirect) {
        }
        for (var i = 1; i <= main.numLayers; i++) {
            var layer = main.layer(i);
            try {
                if (layer.source instanceof CompItem &&
                    layer.source.name === PHS_NAME) {
                    return layer;
                }
            } catch (ignoredLayer) {
            }
        }
        return null;
    }

    function slideHostComp(main) {
        var phsLayer = findPHSLayer(main);
        return phsLayer && phsLayer.source instanceof CompItem
            ? phsLayer.source
            : main;
    }

    function enableCollapse(layer, issues) {
        if (!layer) return;
        try {
            layer.threeDLayer = true;
            layer.collapseTransformation = true;
        } catch (err) {
            if (issues) {
                issues.push(layer.name + " collapse: " + err.toString());
            }
        }
    }

    function attachPHSLayerToRig(main, phsLayer, issues) {
        if (!main || !phsLayer) return;
        var rig = null;
        try {
            rig = main.layer(RIG_NAME);
        } catch (ignoredRig) {
            rig = null;
        }
        try {
            phsLayer.threeDLayer = true;
            if (rig) {
                phsLayer.parent = rig;
                phsLayer.property("ADBE Transform Group")
                    .property("ADBE Position")
                    .setValue([0, 0, 0]);
                phsLayer.property("ADBE Transform Group")
                    .property("ADBE Anchor Point")
                    .setValue([
                        phsLayer.source.width * 0.5,
                        phsLayer.source.height * 0.5,
                        0
                    ]);
            }
        } catch (err) {
            if (issues) {
                issues.push(PHS_NAME + " parent: " + err.toString());
            }
        }
    }

    function replaceAll(text, fromText, toText) {
        return text.split(fromText).join(toText);
    }

    function retargetLinearPropertyExpressions(group, mainName, issues, path) {
        if (!group || !group.numProperties) return;
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);
            var propPath = path + "/" + prop.name;
            if (prop.canSetExpression && prop.expressionEnabled) {
                var expressionText = prop.expression;
                expressionText = replaceAll(
                    expressionText,
                    'thisComp.layer("' + MOVE_CTRL + '")',
                    'comp("' + mainName + '").layer("' + MOVE_CTRL + '")'
                );
                expressionText = replaceAll(
                    expressionText,
                    'thisComp.layer("' + CARD_CTRL + '")',
                    'comp("' + mainName + '").layer("' + CARD_CTRL + '")'
                );
                expressionText = replaceAll(
                    expressionText,
                    'thisComp.layer("' + CAMERA_NAME + '")',
                    'comp("' + mainName + '").layer("' + CAMERA_NAME + '")'
                );
                assignExpression(
                    prop,
                    expressionText,
                    "Retarget " + propPath,
                    issues
                );
            }
            if (prop.numProperties) {
                retargetLinearPropertyExpressions(
                    prop,
                    mainName,
                    issues,
                    propPath
                );
            }
        }
    }

    function retargetNestedSlideExpressions(phs, mainName, issues) {
        if (!phs) return;
        for (var i = 1; i <= phs.numLayers; i++) {
            var layer = phs.layer(i);
            retargetLinearPropertyExpressions(
                layer,
                mainName,
                issues,
                phs.name + "/" + layer.name
            );
        }
    }

    function placePHSLayer(main, phsLayer) {
        if (!main || !phsLayer) return;
        var audioLayer = findAudioLayer(main);
        var cardCtrl = main.layer(CARD_CTRL);
        var moveCtrl = main.layer(MOVE_CTRL);

        if (audioLayer) {
            phsLayer.moveAfter(audioLayer);
        } else if (cardCtrl) {
            phsLayer.moveAfter(cardCtrl);
        } else if (moveCtrl) {
            phsLayer.moveAfter(moveCtrl);
        }
        attachPHSLayerToRig(main, phsLayer, null);
    }

    function precomposeSlidesIntoPHS(main, issues) {
        var existing = findPHSLayer(main);
        if (existing && existing.source instanceof CompItem) {
            existing.name = PHS_NAME;
            existing.source.name = PHS_NAME;
            enableCollapse(existing, issues);
            retargetNestedSlideExpressions(existing.source, main.name, issues);
            applySlideExpressions(
                collectLinearSlides(main),
                issues,
                main.name,
                true
            );
            placePHSLayer(main, existing);
            return existing.source;
        }

        var slides = collectLinearSlides(main);
        if (slides.length === 0) return null;

        var indices = [];
        for (var i = 0; i < slides.length; i++) {
            indices.push(slides[i].index);
        }

        var phs = null;
        try {
            phs = main.layers.precompose(indices, PHS_NAME, true);
            phs.name = PHS_NAME;
            phs.parentFolder = main.parentFolder;
        } catch (err) {
            issues.push("PHS precompose: " + err.toString());
            return null;
        }

        var phsLayer = findPHSLayer(main);
        if (phsLayer) {
            phsLayer.name = PHS_NAME;
            enableCollapse(phsLayer, issues);
            placePHSLayer(main, phsLayer);
        }
        retargetNestedSlideExpressions(phs, main.name, issues);
        applySlideExpressions(
            collectLinearSlides(main),
            issues,
            main.name,
            true
        );
        return phs;
    }

    function removeBackgroundLayer(main) {
        if (!main) return;
        try {
            var bg = main.layer("BG_MAIN");
            if (bg) bg.remove();
        } catch (ignored) {
        }
    }

    function addSlider(fx, name, value) {
        var effect = fx.addProperty("ADBE Slider Control");
        effect.name = name;
        effect.property(1).setValue(value);
        return effect;
    }

    function addAngle(fx, name, value) {
        var effect = fx.addProperty("ADBE Angle Control");
        effect.name = name;
        effect.property(1).setValue(value);
        return effect;
    }

    function addCheckbox(fx, name, checked) {
        var effect = fx.addProperty("ADBE Checkbox Control");
        effect.name = name;
        effect.property(1).setValue(checked ? 1 : 0);
        return effect;
    }

    function addColor(fx, name, value) {
        var effect = fx.addProperty("ADBE Color Control");
        effect.name = name;
        effect.property(1).setValue(value);
        return effect;
    }

    function addDropdown(fx, name, items, defaultIndex) {
        var effect = fx.addProperty("ADBE Dropdown Control");
        effect.name = name;

        var menu = effect.property(1);
        var configuredMenu = menu.setPropertyParameters(items);
        var configuredEffect = configuredMenu.propertyGroup(1);
        configuredEffect.name = name;
        configuredMenu.setValue(clamp(defaultIndex, 1, items.length));
        return configuredEffect;
    }

    function cardMetricsExpression(
        controllerRef,
        widthExpression,
        heightExpression,
        indent
    ) {
        var p = indent || "";
        return p + 'baseW=Math.max(1,' + controllerRef + '.effect("' +
            FX_CARD_W + '")("Slider"));\n' +
            p + 'baseH=Math.max(1,' + controllerRef + '.effect("' +
            FX_CARD_H + '")("Slider"));\n' +
            p + 'cardMode=Math.round(' + controllerRef + '.effect("' +
            FX_CARD_ORIENTATION + '")(1));\n' +
            p + 'if(cardMode==2){rawW=baseH;rawH=baseW;}' +
            'else{rawW=baseW;rawH=baseH;}\n' +
            p + 'cardFit=Math.min(1,' + widthExpression +
            '/rawW,' + heightExpression + '/rawH);\n' +
            p + 'cw=rawW*cardFit;ch=rawH*cardFit;\n';
    }

    function controlValue(values, name, fallback) {
        if (
            values &&
            typeof values[name] !== "undefined" &&
            values[name] !== null
        ) {
            return values[name];
        }
        return fallback;
    }

    function addMovementEffects(fx, initialCount, cardWidth, values) {
        addSlider(
            fx,
            FX_SLIDE_COUNT,
            controlValue(values, FX_SLIDE_COUNT, initialCount)
        );
        addSlider(
            fx,
            FX_SLIDE_INDEX,
            controlValue(values, FX_SLIDE_INDEX, 1)
        );
        addSlider(
            fx,
            FX_PROGRESS,
            controlValue(values, FX_PROGRESS, 0)
        );
        addSlider(
            fx,
            FX_POSITION_X,
            controlValue(values, FX_POSITION_X, 0)
        );
        addSlider(
            fx,
            FX_POSITION_Y,
            controlValue(values, FX_POSITION_Y, 0)
        );
        addSlider(
            fx,
            FX_POSITION_Z,
            controlValue(values, FX_POSITION_Z, 0)
        );
        addDropdown(
            fx,
            FX_LINE_DIRECTION,
            ["Horizontal X", "Vertical Y", "Depth Z"],
            controlValue(values, FX_LINE_DIRECTION, 1)
        );
        addCheckbox(
            fx,
            FX_CONSTANT_SPEED,
            controlValue(values, FX_CONSTANT_SPEED, false)
        );
        addSlider(
            fx,
            FX_SPEED,
            controlValue(values, FX_SPEED, 0)
        );
        addSlider(
            fx,
            FX_CAMERA_DISTANCE_Z,
            controlValue(values, FX_CAMERA_DISTANCE_Z, 2500)
        );
        addDropdown(
            fx,
            FX_CARD_DIRECTION,
            ["Front", "Toward Focus", "Away From Focus"],
            controlValue(values, FX_CARD_DIRECTION, 2)
        );
        addSlider(
            fx,
            FX_CARD_SPACING,
            controlValue(
                values,
                FX_CARD_SPACING,
                Math.round(cardWidth * 0.62)
            )
        );
        addSlider(
            fx,
            FX_FOCUS_SCALE,
            controlValue(values, FX_FOCUS_SCALE, 125)
        );
        addSlider(
            fx,
            FX_SIDE_SCALE,
            controlValue(values, FX_SIDE_SCALE, 72)
        );
        addSlider(
            fx,
            FX_FOCUS_WIDTH,
            controlValue(values, FX_FOCUS_WIDTH, 1.35)
        );
        addSlider(
            fx,
            FX_CAMERA_PUSH,
            controlValue(values, FX_CAMERA_PUSH, 350)
        );
        addAngle(
            fx,
            FX_SIDE_ANGLE,
            controlValue(values, FX_SIDE_ANGLE, 32)
        );
    }

    function addCardEffects(fx, cardWidth, cardHeight, values) {
        var legacyPadX = controlValue(
            values,
            "Photo Pad X (px)",
            16
        );
        var legacyPadY = controlValue(
            values,
            "Photo Pad Y (px)",
            legacyPadX
        );
        var photoPadding = controlValue(
            values,
            FX_PHOTO_PADDING,
            (legacyPadX + legacyPadY) / 2
        );

        addDropdown(
            fx,
            FX_CARD_ORIENTATION,
            ["Horizontal", "Vertical"],
            controlValue(values, FX_CARD_ORIENTATION, 1)
        );
        addSlider(
            fx,
            FX_CARD_W,
            controlValue(values, FX_CARD_W, cardWidth)
        );
        addSlider(
            fx,
            FX_CARD_H,
            controlValue(values, FX_CARD_H, cardHeight)
        );
        addSlider(
            fx,
            FX_CARD_RADIUS,
            controlValue(values, FX_CARD_RADIUS, 60)
        );
        addColor(
            fx,
            FX_CARD_FILL,
            controlValue(values, FX_CARD_FILL, [0.12, 0.12, 0.13])
        );
        addColor(
            fx,
            FX_STROKE,
            controlValue(values, FX_STROKE, [0.25, 0.25, 0.27])
        );
        addSlider(
            fx,
            FX_STROKE_W,
            controlValue(values, FX_STROKE_W, 6)
        );
        addColor(
            fx,
            FX_STROKE_NEAR,
            controlValue(values, FX_STROKE_NEAR, [1, 1, 1])
        );
        addSlider(
            fx,
            FX_STROKE_W_NEAR,
            controlValue(values, FX_STROKE_W_NEAR, 10)
        );
        addSlider(
            fx,
            FX_STROKE_REACTION,
            controlValue(values, FX_STROKE_REACTION, 35)
        );
        addSlider(fx, FX_PHOTO_PADDING, photoPadding);
        addColor(
            fx,
            FX_TEXT_FILL,
            controlValue(values, FX_TEXT_FILL, [1, 1, 1])
        );
        addSlider(
            fx,
            FX_TEXT_SIZE,
            controlValue(values, FX_TEXT_SIZE, 140)
        );
        addSlider(
            fx,
            FX_TEXT_X,
            controlValue(values, FX_TEXT_X, 0)
        );
        addSlider(
            fx,
            FX_TEXT_Y,
            controlValue(values, FX_TEXT_Y, 0)
        );
    }

    function addMovementController(
        comp,
        initialCount,
        cardWidth,
        initialCameraDistanceZ
    ) {
        var ctrl = comp.layers.addNull();
        ctrl.name = MOVE_CTRL;
        ctrl.label = 10;
        ctrl.property("ADBE Transform Group").property("ADBE Position")
            .setValue([comp.width * 0.5, 70]);

        var fx = ctrl.property("ADBE Effect Parade");
        addMovementEffects(
            fx,
            initialCount,
            cardWidth,
            { "Camera Distance Z": Math.round(Math.abs(
                initialCameraDistanceZ || 2500
            )) }
        );

        return ctrl;
    }

    function addCardController(comp, cardWidth, cardHeight) {
        var ctrl = comp.layers.addNull();
        ctrl.name = CARD_CTRL;
        ctrl.label = 11;
        ctrl.property("ADBE Transform Group").property("ADBE Position")
            .setValue([comp.width * 0.5, 130]);

        var fx = ctrl.property("ADBE Effect Parade");
        addCardEffects(fx, cardWidth, cardHeight, null);

        return ctrl;
    }

    function unwrapSilentFallback(expressionText) {
        if (!expressionText || expressionText.indexOf("try{") !== 0) {
            return expressionText;
        }

        var catchIndex = expressionText.lastIndexOf("}catch(e){");
        if (catchIndex < 0) return expressionText;
        if (expressionText.substring(expressionText.length - 2) !== "};") {
            return expressionText;
        }
        return expressionText.substring(4, catchIndex);
    }

    function assignExpression(prop, expressionText, label, issues) {
        if (!prop) {
            issues.push(label + ": property not found");
            return false;
        }

        try {
            expressionText = unwrapSilentFallback(expressionText);
            prop.expression = expressionText;
            prop.expressionEnabled = true;
            var evaluatedValue = prop.value;
            if (prop.expressionError && prop.expressionError !== "") {
                issues.push(label + ": " + prop.expressionError);
                return false;
            }
            return true;
        } catch (err) {
            issues.push(label + ": " + err.toString());
            return false;
        }
    }

    function setCameraOption(optionsGroup, matchName, value, label, issues) {
        try {
            var prop = optionsGroup
                ? optionsGroup.property(matchName)
                : null;
            if (!prop) {
                issues.push(label + " property not found");
                return;
            }
            prop.setValue(value);
        } catch (err) {
            issues.push(label + ": " + err.toString());
        }
    }

    function bindCameraDistance(camera, issues) {
        var transform = camera
            ? camera.property("ADBE Transform Group")
            : null;
        var position = transform
            ? transform.property("ADBE Position")
            : null;
        if (!position) return;
        assignExpression(
            position,
            'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'd=Math.max(1,Math.abs(c.effect("' +
            FX_CAMERA_DISTANCE_Z + '")("Slider")));\n' +
            '[thisComp.width*0.5,thisComp.height*0.5,-d];',
            "Camera Distance Z",
            issues
        );
    }

    function addCamera(comp, cameraZ, cameraSettings, issues) {
        var center = [comp.width * 0.5, comp.height * 0.5];
        var camera = comp.layers.addCamera(CAMERA_NAME, center);
        camera.label = 9;

        var transform = camera.property("ADBE Transform Group");
        var position = transform
            ? transform.property("ADBE Position")
            : null;
        if (position) {
            position.setValue([center[0], center[1], cameraZ]);
        } else {
            issues.push("Camera position property not found");
        }

        // Camera Point of Interest uses the internal Anchor Point match name.
        var pointOfInterest = transform
            ? transform.property("ADBE Anchor Point")
            : null;
        if (!pointOfInterest && transform) {
            pointOfInterest = transform.property("Point of Interest");
        }
        if (pointOfInterest) {
            pointOfInterest.setValue([center[0], center[1], 0]);
            try {
                camera.autoOrient =
                    AutoOrientType.CAMERA_OR_POINT_OF_INTEREST;
            } catch (autoOrientError) {
                issues.push(
                    "Camera auto-orient: " + autoOrientError.toString()
                );
            }
        } else {
            issues.push("Camera point of interest property not found");
        }

        bindCameraDistance(camera, issues);

        var cameraOptions = camera.property("ADBE Camera Options Group");
        setCameraOption(
            cameraOptions,
            "ADBE Camera Zoom",
            cameraSettings.zoom,
            "Camera zoom",
            issues
        );
        setCameraOption(
            cameraOptions,
            "ADBE Camera Depth of Field",
            cameraSettings.depthOfField ? 1 : 0,
            "Camera depth of field",
            issues
        );
        setCameraOption(
            cameraOptions,
            "ADBE Camera Focus Distance",
            cameraSettings.focusCenter
                ? Math.abs(cameraZ)
                : cameraSettings.focusDistance,
            "Camera focus distance",
            issues
        );
        setCameraOption(
            cameraOptions,
            "ADBE Camera Aperture",
            cameraSettings.aperture,
            "Camera aperture",
            issues
        );
        setCameraOption(
            cameraOptions,
            "ADBE Camera Blur Level",
            cameraSettings.blurLevel,
            "Camera blur level",
            issues
        );

        return camera;
    }

    function enforcePlaceholderOrder(comp, issues) {
        var card = null;
        var border = null;
        var photo = null;
        var matte = null;
        var label = null;

        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer.name === "CARD") card = layer;
            else if (layer.name === "CARD_BORDER") border = layer;
            else if (layer.name === "PHOTO_REPLACE") photo = layer;
            else if (layer.name === "PHOTO_MATTE") matte = layer;
            else if (layer.name === "LABEL") label = layer;
        }

        if (!card || !border || !photo || !matte || !label) {
            issues.push(comp.name + ": incomplete placeholder layer set");
            return false;
        }

        var cardWasLocked = card.locked;
        var borderWasLocked = border.locked;
        var photoWasLocked = photo.locked;
        var labelWasLocked = label.locked;

        try {
            card.locked = false;
            border.locked = false;
            photo.locked = false;
            matte.locked = false;
            label.locked = false;

            card.moveToEnd();
            photo.moveBefore(card);
            matte.moveBefore(photo);
            border.moveBefore(matte);
            label.moveToBeginning();
            photo.trackMatteType = TrackMatteType.NO_TRACK_MATTE;
            photo.trackMatteType = TrackMatteType.ALPHA;
            matte.shy = true;
            return true;
        } catch (err) {
            issues.push(comp.name + " matte order: " + err.toString());
            return false;
        } finally {
            card.locked = cardWasLocked;
            border.locked = borderWasLocked;
            photo.locked = photoWasLocked;
            label.locked = labelWasLocked;
            matte.locked = true;
        }
    }

    function createPlaceholder(
        proj,
        folder,
        mainName,
        instanceTag,
        index,
        duration,
        fps,
        width,
        height,
        issues,
        canvasWidth,
        canvasHeight
    ) {
        var compName = "PH_" + pad2(index);
        var compWidth = Math.max(width, Math.round(canvasWidth || width));
        var compHeight = Math.max(height, Math.round(canvasHeight || height));
        var comp = proj.items.addComp(
            compName,
            compWidth,
            compHeight,
            1,
            duration,
            fps
        );
        comp.parentFolder = folder;

        var ctrlRef = 'comp("' + mainName + '").layer("' + CARD_CTRL + '")';
        var cardMetrics = cardMetricsExpression(
            "c",
            "thisComp.width",
            "thisComp.height",
            "  "
        );

        var card = comp.layers.addShape();
        card.name = "CARD";
        var cardGroup = card.property("ADBE Root Vectors Group")
            .addProperty("ADBE Vector Group");
        cardGroup.name = "CARD";
        var cardContents = cardGroup.property("ADBE Vectors Group");
        var cardRect = cardContents.addProperty("ADBE Vector Shape - Rect");

        assignExpression(
            cardRect.property("ADBE Vector Rect Size"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            cardMetrics +
            '  [cw,ch];\n' +
            '}catch(e){[thisComp.width,thisComp.height]};',
            compName + " card size",
            issues
        );

        assignExpression(
            cardRect.property("ADBE Vector Rect Roundness"),
            'try{Math.max(0,' + ctrlRef + '.effect("' + FX_CARD_RADIUS + '")("Slider"))}' +
            'catch(e){60};',
            compName + " card radius",
            issues
        );

        var cardFill = cardContents.addProperty("ADBE Vector Graphic - Fill");
        assignExpression(
            cardFill.property("ADBE Vector Fill Color"),
            'try{' + ctrlRef + '.effect("' + FX_CARD_FILL + '")("Color")}' +
            'catch(e){[0.12,0.12,0.13]};',
            compName + " card fill",
            issues
        );

        card.property("ADBE Transform Group").property("ADBE Position")
            .setValue([compWidth * 0.5, compHeight * 0.5]);

        var photo = comp.layers.addSolid(
            [0.2, 0.2, 0.22],
            "PHOTO_REPLACE",
            width,
            height,
            1,
            duration
        );
        photo.property("ADBE Transform Group").property("ADBE Position")
            .setValue([compWidth * 0.5, compHeight * 0.5]);

        assignExpression(
            photo.property("ADBE Transform Group").property("ADBE Scale"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            cardMetrics +
            '  pad=Math.max(0,c.effect("' + FX_PHOTO_PADDING + '")("Slider"));\n' +
            '  tw=Math.max(1,cw-2*pad);\n' +
            '  th=Math.max(1,ch-2*pad);\n' +
            '  s=Math.max(tw/thisLayer.source.width,th/thisLayer.source.height)*100;\n' +
            '  [s,s];\n' +
            '}catch(e){[100,100]};',
            compName + " photo scale",
            issues
        );

        var matte = comp.layers.addShape();
        matte.name = "PHOTO_MATTE";
        var matteGroup = matte.property("ADBE Root Vectors Group")
            .addProperty("ADBE Vector Group");
        matteGroup.name = "PHOTO_MATTE";
        var matteContents = matteGroup.property("ADBE Vectors Group");
        var matteRect = matteContents.addProperty("ADBE Vector Shape - Rect");

        assignExpression(
            matteRect.property("ADBE Vector Rect Size"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            cardMetrics +
            '  pad=Math.max(0,c.effect("' + FX_PHOTO_PADDING + '")("Slider"));\n' +
            '  [Math.max(1,cw-2*pad),Math.max(1,ch-2*pad)];\n' +
            '}catch(e){[thisComp.width,thisComp.height]};',
            compName + " matte size",
            issues
        );

        assignExpression(
            matteRect.property("ADBE Vector Rect Roundness"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            '  r=Math.max(0,c.effect("' + FX_CARD_RADIUS + '")("Slider"));\n' +
            '  pad=Math.max(0,c.effect("' + FX_PHOTO_PADDING + '")("Slider"));\n' +
            '  Math.max(0,r-pad/2);\n' +
            '}catch(e){50};',
            compName + " matte radius",
            issues
        );

        var matteFill = matteContents.addProperty("ADBE Vector Graphic - Fill");
        matteFill.property("ADBE Vector Fill Color").setValue([1, 1, 1]);
        matte.property("ADBE Transform Group").property("ADBE Position")
            .setValue([compWidth * 0.5, compHeight * 0.5]);

        var border = comp.layers.addShape();
        border.name = "CARD_BORDER";
        var borderGroup = border.property("ADBE Root Vectors Group")
            .addProperty("ADBE Vector Group");
        borderGroup.name = "CARD_BORDER";
        var borderContents = borderGroup.property("ADBE Vectors Group");
        var borderRect = borderContents.addProperty("ADBE Vector Shape - Rect");

        assignExpression(
            borderRect.property("ADBE Vector Rect Size"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            cardMetrics +
            '  sw=Math.max(0,c.effect("' + FX_STROKE_W + '")("Slider"));\n' +
            '  [Math.max(1,cw-sw),Math.max(1,ch-sw)];\n' +
            '}catch(e){[thisComp.width-6,thisComp.height-6]};',
            compName + " border size",
            issues
        );

        assignExpression(
            borderRect.property("ADBE Vector Rect Roundness"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            '  r=Math.max(0,c.effect("' + FX_CARD_RADIUS + '")("Slider"));\n' +
            '  sw=Math.max(0,c.effect("' + FX_STROKE_W + '")("Slider"));\n' +
            '  Math.max(0,r-sw/2);\n' +
            '}catch(e){57};',
            compName + " border radius",
            issues
        );

        var borderStroke = borderContents.addProperty(
            "ADBE Vector Graphic - Stroke"
        );
        assignExpression(
            borderStroke.property("ADBE Vector Stroke Color"),
            'try{' + ctrlRef + '.effect("' + FX_STROKE + '")("Color")}' +
            'catch(e){[0.25,0.25,0.27]};',
            compName + " stroke color",
            issues
        );
        assignExpression(
            borderStroke.property("ADBE Vector Stroke Width"),
            'try{Math.max(0,' + ctrlRef + '.effect("' + FX_STROKE_W + '")("Slider"))}' +
            'catch(e){6};',
            compName + " stroke width",
            issues
        );
        try {
            borderStroke.property("ADBE Vector Stroke Line Join").setValue(2);
        } catch (lineJoinError) {
            issues.push(
                compName + " border line join: " + lineJoinError.toString()
            );
        }
        border.property("ADBE Transform Group").property("ADBE Position")
            .setValue([compWidth * 0.5, compHeight * 0.5]);

        var label = comp.layers.addText("CARD " + pad2(index));
        label.name = "LABEL";
        label.property("ADBE Transform Group").property("ADBE Anchor Point")
            .setValue([0, 0]);

        var safeX = Math.round(width * 0.08);
        var safeY = Math.round(height * 0.08);
        assignExpression(
            label.property("ADBE Transform Group").property("ADBE Position"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            cardMetrics +
            '  left=(thisComp.width-cw)/2+cw*0.08;\n' +
            '  bottom=(thisComp.height+ch)/2-ch*0.08;\n' +
            '  [left+c.effect("' + FX_TEXT_X + '")("Slider"),' +
            'bottom+c.effect("' + FX_TEXT_Y + '")("Slider")];\n' +
            '}catch(e){[' + safeX + ',thisComp.height-' + safeY + ']};',
            compName + " label position",
            issues
        );

        var textProp = label.property("ADBE Text Properties")
            .property("ADBE Text Document");
        var baseFontSize = Math.round(height * 0.065);
        var textDocument = textProp.value;
        textDocument.applyFill = true;
        textDocument.fontSize = baseFontSize;
        textProp.setValue(textDocument);

        var textAnimator = label.property("ADBE Text Properties")
            .property("ADBE Text Animators")
            .addProperty("ADBE Text Animator");
        textAnimator.name = "TEXT_FILL";
        textAnimator.property("ADBE Text Selectors")
            .addProperty("ADBE Text Selector");
        var textAnimatorFill = textAnimator
            .property("ADBE Text Animator Properties")
            .addProperty("ADBE Text Fill Color");

        assignExpression(
            textAnimatorFill,
            'try{\n' +
            '  col=' + ctrlRef + '.effect("' + FX_TEXT_FILL + '")("Color");\n' +
            '  [col[0],col[1],col[2],col[3]];\n' +
            '}catch(e){[1,1,1,1]};',
            compName + " label fill",
            issues
        );

        assignExpression(
            label.property("ADBE Transform Group").property("ADBE Scale"),
            'try{\n' +
            '  s=Math.max(1,' + ctrlRef + '.effect("' + FX_TEXT_SIZE + '")("Slider"));\n' +
            '  k=s/' + baseFontSize + ';\n' +
            '  [100*k,100*k];\n' +
            '}catch(e){value};',
            compName + " label size",
            issues
        );

        enforcePlaceholderOrder(comp, issues);
        return comp;
    }

    function makeLinearFocusExpression(count) {
        return 'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'maxN=' + count + ';\n' +
            'activeN=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'sid=Math.max(1,Math.round(effect("' + SLIDE_ID + '")("Slider")));\n' +
            'lineDir=Math.round(c.effect("' + FX_LINE_DIRECTION +
            '")(1));\n' +
            'spacing=Math.max(1,c.effect("' + FX_CARD_SPACING +
            '")("Slider"));\n' +
            'moveX=c.effect("' + FX_POSITION_X + '")("Slider");\n' +
            'moveY=c.effect("' + FX_POSITION_Y + '")("Slider");\n' +
            'moveZ=c.effect("' + FX_POSITION_Z + '")("Slider");\n' +
            'targetIndex=Math.max(1,Math.min(activeN,Math.round(c.effect("' +
            FX_SLIDE_INDEX + '")("Slider"))));\n' +
            'progress=Math.max(0,Math.min(100,c.effect("' +
            FX_PROGRESS + '")("Slider")))/100;\n' +
            'targetMove=((targetIndex-1)+progress)*spacing;\n' +
            'if(lineDir==2){moveY+=targetMove;}' +
            'else if(lineDir==3){moveZ+=targetMove;}' +
            'else{moveX+=targetMove;}\n' +
            'autoMove=(c.effect("' + FX_CONSTANT_SPEED +
            '")("Checkbox")>0)?time*c.effect("' + FX_SPEED +
            '")("Slider"):0;\n' +
            'if(lineDir==2){moveY+=autoMove;}' +
            'else if(lineDir==3){moveZ+=autoMove;}' +
            'else{moveX+=autoMove;}\n' +
            'baseOffset=(sid-1)*spacing;\n' +
            // Positive controller movement advances the carousel forward.
            'lineDistance=(lineDir==2)?baseOffset-moveY:' +
            '((lineDir==3)?baseOffset-moveZ:baseOffset-moveX);\n' +
            'focusWidth=Math.max(0.001,c.effect("' +
            FX_FOCUS_WIDTH + '")("Slider"));\n' +
            'focusRange=spacing*focusWidth;\n' +
            'focus=Math.max(0,Math.min(1,1-' +
            'Math.abs(lineDistance)/focusRange));\n' +
            'focus=focus*focus*(3-2*focus);\n';
    }

    function makeCardRotationExpression(count, targetAxis) {
        return makeLinearFocusExpression(count) +
            'cardDir=Math.round(c.effect("' + FX_CARD_DIRECTION +
            '")(1));\n' +
            'sideAngle=c.effect("' + FX_SIDE_ANGLE + '")("Angle");\n' +
            'sideSign=(lineDistance<0)?-1:' +
            '((lineDistance>0)?1:0);\n' +
            'directionSign=(cardDir==3)?-1:1;\n' +
            'angle=(cardDir==1)?0:' +
            'sideSign*directionSign*sideAngle*(1-focus);\n' +
            'result=0;\n' +
            'if(lineDir==1 && ' + targetAxis + '==1){result=angle;}\n' +
            'else if(lineDir==2 && ' + targetAxis +
            '==3){result=-angle;}\n' +
            'else if(lineDir==3 && ' + targetAxis +
            '==1){result=angle;}\n' +
            'result;';
    }

    function makePositionExpression(count, nestedInPHS) {
        return makeLinearFocusExpression(count) +
            'cameraPush=Math.max(0,c.effect("' + FX_CAMERA_PUSH +
            '")("Slider"));\n' +
            'push=-focus*cameraPush;\n' +
            'baseX=(lineDir==1)?baseOffset:0;\n' +
            'baseY=(lineDir==2)?baseOffset:0;\n' +
            'baseZ=(lineDir==3)?baseOffset:0;\n' +
            (nestedInPHS
                ? '[thisComp.width*0.5+baseX-moveX,' +
                    'thisComp.height*0.5+baseY-moveY,' +
                    'baseZ-moveZ+push];'
                : '[baseX-moveX,baseY-moveY,baseZ-moveZ+push];');
    }

    function makeScaleExpression(count) {
        return makeLinearFocusExpression(count) +
            'reveal=Math.max(0,Math.min(1,activeN-sid+1));\n' +
            'reveal=reveal*reveal*(3-2*reveal);\n' +
            'focusScale=Math.max(0,c.effect("' + FX_FOCUS_SCALE +
            '")("Slider"));\n' +
            'sideScale=Math.max(0,c.effect("' + FX_SIDE_SCALE +
            '")("Slider"));\n' +
            's=linear(focus,0,1,sideScale,focusScale);\n' +
            'appear=linear(reveal,0,1,85,100)/100;\n' +
            '[s*appear,s*appear,s*appear];';
    }

    function makeOpacityExpression(count) {
        return makeLinearFocusExpression(count) +
            'reveal=Math.max(0,Math.min(1,activeN-sid+1));\n' +
            'reveal=reveal*reveal*(3-2*reveal);\n' +
            'reveal*100;';
    }

    function makeStrokeProximityExpression(count) {
        return makeLinearFocusExpression(count) +
            'cardCtrl=thisComp.layer("' + CARD_CTRL + '");\n' +
            'reactionCards=Math.max(0.001,cardCtrl.effect("' +
            FX_STROKE_REACTION + '")("Slider")/100);\n' +
            'strokeRange=spacing*reactionCards;\n' +
            'nearAmount=Math.max(0,Math.min(1,1-Math.abs(lineDistance)/strokeRange));\n' +
            'nearAmount=nearAmount*nearAmount*(3-2*nearAmount);\n' +
            'nearAmount;';
    }

    function retargetLinearExpressionText(expressionText, mainName) {
        if (!mainName) return expressionText;
        expressionText = replaceAll(
            expressionText,
            'thisComp.layer("' + MOVE_CTRL + '")',
            'comp("' + mainName + '").layer("' + MOVE_CTRL + '")'
        );
        expressionText = replaceAll(
            expressionText,
            'thisComp.layer("' + CARD_CTRL + '")',
            'comp("' + mainName + '").layer("' + CARD_CTRL + '")'
        );
        expressionText = replaceAll(
            expressionText,
            'thisComp.layer("' + CAMERA_NAME + '")',
            'comp("' + mainName + '").layer("' + CAMERA_NAME + '")'
        );
        return expressionText;
    }

    function applySlideExpressions(slides, issues, mainName, nestedInPHS) {
        var count = slides.length;
        var positionExpression = retargetLinearExpressionText(
            makePositionExpression(count, nestedInPHS),
            mainName
        );
        var scaleExpression = retargetLinearExpressionText(
            makeScaleExpression(count),
            mainName
        );
        var opacityExpression = retargetLinearExpressionText(
            makeOpacityExpression(count),
            mainName
        );
        var strokeProximityExpression = retargetLinearExpressionText(
            makeStrokeProximityExpression(count),
            mainName
        );

        for (var i = 0; i < slides.length; i++) {
            var slide = slides[i];
            try {
                if (slide.source instanceof CompItem) {
                    slide.property("ADBE Transform Group")
                        .property("ADBE Anchor Point")
                        .setValue([
                            slide.source.width * 0.5,
                            slide.source.height * 0.5,
                            0
                        ]);
                }
            } catch (anchorErr) {
                if (issues) {
                    issues.push(
                        slide.name + " anchor: " + anchorErr.toString()
                    );
                }
            }

            var proximityEffect = ensureSliderControl(
                slide,
                STROKE_PROXIMITY_AMOUNT,
                0
            );
            assignExpression(
                proximityEffect.property(1),
                strokeProximityExpression,
                slide.name + " stroke proximity",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Position"),
                positionExpression,
                slide.name + " position",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Scale"),
                scaleExpression,
                slide.name + " scale",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Opacity"),
                opacityExpression,
                slide.name + " visibility",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Rotate X"),
                retargetLinearExpressionText(
                    makeCardRotationExpression(count, 3),
                    mainName
                ),
                slide.name + " X rotation",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Rotate Y"),
                retargetLinearExpressionText(
                    makeCardRotationExpression(count, 1),
                    mainName
                ),
                slide.name + " Y rotation",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Rotate Z"),
                retargetLinearExpressionText(
                    makeCardRotationExpression(count, 2),
                    mainName
                ),
                slide.name + " Z rotation",
                issues
            );
        }
    }

    function addLinearSlideLayer(
        main,
        sourceComp,
        rig,
        cardWidth,
        cardHeight,
        slideId
    ) {
        var slide = main.layers.add(sourceComp);
        slide.name = sourceComp.name;
        slide.threeDLayer = true;
        if (rig && rig.containingComp === main) {
            slide.parent = rig;
        }

        slide.property("ADBE Transform Group").property("ADBE Anchor Point")
            .setValue([sourceComp.width * 0.5, sourceComp.height * 0.5, 0]);
        slide.property("ADBE Transform Group").property("ADBE Position")
            .setValue([0, 0, 0]);

        var slideFx = slide.property("ADBE Effect Parade");
        addSlider(slideFx, SLIDE_ID, slideId);
        return slide;
    }

    function addRigAndSlides(
        main,
        placeholders,
        cardWidth,
        cardHeight,
        issues
    ) {
        var center = [main.width * 0.5, main.height * 0.5, 0];
        var count = placeholders.length;

        var rig = main.layers.addNull();
        rig.name = RIG_NAME;
        rig.label = 12;
        rig.threeDLayer = true;
        rig.property("ADBE Transform Group").property("ADBE Position")
            .setValue(center);
        var slides = [];

        for (var i = 0; i < placeholders.length; i++) {
            var sourceComp = placeholders[i];
            var slide = addLinearSlideLayer(
                main,
                sourceComp,
                rig,
                cardWidth,
                cardHeight,
                i + 1
            );
            slides.push(slide);
        }

        applySlideExpressions(slides, issues);
        for (var slideIndex = 0; slideIndex < slides.length; slideIndex++) {
            updatePlaceholderExpressions(
                slides[slideIndex].source,
                main.name,
                issues
            );
        }
        return rig;
    }

    function isMediaFile(file) {
        if (!file || !(file instanceof File)) return false;
        return /\.(jpg|jpeg|png|tif|tiff|bmp|gif|psd|exr|mp4|mov|m4v|avi)$/i
            .test(file.name || "");
    }

    function getMediaFiles(folder) {
        if (!folder) return [];
        var files = folder.getFiles(function (file) {
            return isMediaFile(file);
        });
        files.sort(function (a, b) {
            var aa = (a.name || "").toLowerCase();
            var bb = (b.name || "").toLowerCase();
            if (aa < bb) return -1;
            if (aa > bb) return 1;
            return 0;
        });
        return files;
    }

    function importMedia(proj, files, folder, issues) {
        var imported = [];
        for (var i = 0; i < files.length; i++) {
            try {
                var options = new ImportOptions(files[i]);
                if (!options.canImportAs(ImportAsType.FOOTAGE)) {
                    issues.push("Skipped unsupported file: " + files[i].name);
                    continue;
                }
                options.importAs = ImportAsType.FOOTAGE;
                var item = proj.importFile(options);
                item.parentFolder = folder;
                imported.push(item);
            } catch (err) {
                issues.push("Import " + files[i].name + ": " + err.toString());
            }
        }
        return imported;
    }

    function replacePhoto(comp, footage, issues) {
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            if (layer.name !== "PHOTO_REPLACE") continue;
            try {
                layer.replaceSource(footage, false);
                layer.name = "PHOTO_REPLACE";
                enforcePlaceholderOrder(comp, issues);
                return true;
            } catch (err) {
                issues.push(comp.name + " replace source: " + err.toString());
                return false;
            }
        }
        issues.push(comp.name + ": PHOTO_REPLACE not found");
        return false;
    }

    function effectByName(layer, name) {
        if (!layer) return null;
        var fx = layer.property("ADBE Effect Parade");
        return fx ? fx.property(name) : null;
    }

    function findLinearEffect(layer, names) {
        if (!layer) return null;
        var fx = layer.property("ADBE Effect Parade");
        if (!fx) return null;
        for (var i = 0; i < names.length; i++) {
            var effect = fx.property(names[i]);
            if (effect) return effect;
        }
        return null;
    }

    function effectNumber(layer, name, fallback) {
        var effect = effectByName(layer, name);
        if (!effect) return fallback;
        try {
            return effect.property(1).value;
        } catch (ignored) {
            return fallback;
        }
    }

    function setEffectValue(layer, name, propName, value, issues) {
        try {
            var effect = effectByName(layer, name);
            if (!effect) {
                if (issues) issues.push(name + ": effect not found");
                return false;
            }
            effect.property(propName).setValue(value);
            return true;
        } catch (err) {
            if (issues) issues.push(name + ": " + err.toString());
            return false;
        }
    }

    function setMenuValue(layer, name, value, issues) {
        try {
            var effect = effectByName(layer, name);
            if (!effect) {
                if (issues) issues.push(name + ": dropdown not found");
                return false;
            }
            effect.property(1).setValue(value);
            return true;
        } catch (err) {
            if (issues) issues.push(name + ": " + err.toString());
            return false;
        }
    }

    function ensureSliderControl(layer, name, value) {
        var effect = effectByName(layer, name);
        if (effect) return effect;
        return addSlider(layer.property("ADBE Effect Parade"), name, value);
    }

    function ensureAngleControl(layer, name, value) {
        var effect = effectByName(layer, name);
        if (effect) return effect;
        return addAngle(layer.property("ADBE Effect Parade"), name, value);
    }

    function ensureCheckboxControl(layer, name, checked) {
        var effect = effectByName(layer, name);
        if (effect) return effect;
        return addCheckbox(
            layer.property("ADBE Effect Parade"),
            name,
            checked
        );
    }

    function ensureColorControl(layer, name, value) {
        var effect = effectByName(layer, name);
        if (effect) return effect;
        return addColor(layer.property("ADBE Effect Parade"), name, value);
    }

    function ensureDropdownControl(
        layer,
        name,
        items,
        defaultIndex
    ) {
        var effect = effectByName(layer, name);
        if (effect) return effect;
        return addDropdown(
            layer.property("ADBE Effect Parade"),
            name,
            items,
            defaultIndex
        );
    }

    function removeNamedEffects(layer, names) {
        if (!layer) return;
        var fx = layer.property("ADBE Effect Parade");
        if (!fx) return;
        for (var i = fx.numProperties; i >= 1; i--) {
            var effect = fx.property(i);
            for (var nameIndex = 0;
                nameIndex < names.length;
                nameIndex++) {
                if (effect.name === names[nameIndex]) {
                    effect.remove();
                    break;
                }
            }
        }
    }

    function findLinearRoot(item) {
        if (!item) return null;
        var folder = item instanceof FolderItem
            ? item
            : item.parentFolder;
        while (folder) {
            if (/^CARUSEL_LINEAR_\d+$/.test(folder.name)) {
                return folder;
            }
            if (!folder.parentFolder ||
                folder.parentFolder === folder) {
                break;
            }
            folder = folder.parentFolder;
        }
        return null;
    }

    function itemBelongsToFolder(item, folder) {
        var parent = item ? item.parentFolder : null;
        while (parent) {
            if (parent === folder) return true;
            if (!parent.parentFolder ||
                parent.parentFolder === parent) {
                break;
            }
            parent = parent.parentFolder;
        }
        return false;
    }

    function findMainInRoot(root) {
        if (!root || !app.project) return null;
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (
                item instanceof CompItem &&
                /^(?:MAIN|CL_MAIN)_\d+$/.test(item.name) &&
                itemBelongsToFolder(item, root)
            ) {
                return item;
            }
        }
        return null;
    }

    function getActiveLinearRig() {
        var active = app.project ? app.project.activeItem : null;
        var root = findLinearRoot(active);
        if (!root) return null;
        var main = active instanceof CompItem &&
            /^(?:MAIN|CL_MAIN)_\d+$/.test(active.name)
            ? active
            : findMainInRoot(root);
        if (!main) return null;
        return {
            root: root,
            main: main,
            moveCtrl: main.layer(MOVE_CTRL),
            cardCtrl: main.layer(CARD_CTRL),
            rig: main.layer(RIG_NAME),
            camera: main.layer(CAMERA_NAME)
        };
    }

    function collectLinearSlides(main) {
        var slides = [];
        if (!main) return slides;
        var host = slideHostComp(main);
        for (var i = 1; i <= host.numLayers; i++) {
            var layer = host.layer(i);
            var idEffect = effectByName(layer, SLIDE_ID);
            if (!idEffect || !(layer.source instanceof CompItem)) continue;
            slides.push({
                layer: layer,
                id: Math.round(idEffect.property(1).value)
            });
        }
        slides.sort(function (a, b) {
            return a.id - b.id;
        });
        var result = [];
        for (var slideIndex = 0;
            slideIndex < slides.length;
            slideIndex++) {
            result.push(slides[slideIndex].layer);
        }
        return result;
    }

    function findAudioComp(root, main) {
        var proj = ensureProject();
        for (var i = 1; i <= proj.numItems; i++) {
            var item = proj.item(i);
            if (item instanceof CompItem &&
                item.name === AUDIO_COMP_NAME &&
                (!root || itemBelongsToFolder(item, root))) {
                return item;
            }
        }
        return addAudioComp(proj, main.parentFolder || null, main);
    }

    function findAudioLayer(main) {
        if (!main) return null;
        try {
            var direct = main.layer(AUDIO_LAYER_NAME);
            if (direct && direct.source instanceof CompItem) return direct;
        } catch (err) {
        }
        for (var i = 1; i <= main.numLayers; i++) {
            var layer = main.layer(i);
            try {
                if (layer.source instanceof CompItem &&
                    layer.source.name === AUDIO_COMP_NAME) {
                    return layer;
                }
            } catch (ignored) {
            }
        }
        return null;
    }

    function placeAudioLayer(main, audioLayer) {
        if (!main || !audioLayer) return;
        var cardCtrl = main.layer(CARD_CTRL);
        var moveCtrl = main.layer(MOVE_CTRL);
        if (cardCtrl) {
            audioLayer.moveAfter(cardCtrl);
        } else if (moveCtrl) {
            audioLayer.moveAfter(moveCtrl);
        }
    }

    function ensureAudioLayer(main, issues) {
        if (!main) return null;
        var audioLayer = findAudioLayer(main);
        if (!audioLayer) {
            try {
                var root = findLinearRoot(main);
                var audioComp = findAudioComp(root, main);
                audioLayer = main.layers.add(audioComp);
            } catch (err) {
                if (issues) issues.push("Audio comp: " + err.toString());
                return null;
            }
        }

        audioLayer.name = AUDIO_LAYER_NAME;
        try {
            audioLayer.audioEnabled = true;
        } catch (audioError) {
        }
        placeAudioLayer(main, audioLayer);
        return audioLayer;
    }

    function collectExpressionIssues(comp, issues) {
        function inspect(group, path) {
            if (!group || !group.numProperties) return;
            for (var i = 1; i <= group.numProperties; i++) {
                var prop = group.property(i);
                var propPath = path + "/" + prop.name;
                if (prop.canSetExpression && prop.expressionEnabled) {
                    try {
                        var evaluatedValue = prop.value;
                        if (prop.expressionError &&
                            prop.expressionError !== "") {
                            issues.push(
                                propPath + ": " + prop.expressionError
                            );
                        }
                    } catch (err) {
                        issues.push(propPath + ": " + err.toString());
                    }
                }
                if (prop.numProperties) inspect(prop, propPath);
            }
        }

        if (!comp) return;
        for (var layerIndex = 1;
            layerIndex <= comp.numLayers;
            layerIndex++) {
            var layer = comp.layer(layerIndex);
            inspect(layer, comp.name + "/" + layer.name);
        }
    }

    function checkRig(main) {
        var issues = [];
        if (!main) {
            issues.push(
                "Activate a composition inside CARUSEL_LINEAR first."
            );
            return issues;
        }

        if (!main.layer(MOVE_CTRL)) {
            issues.push(main.name + ": " + MOVE_CTRL + " not found");
        }
        if (!main.layer(CARD_CTRL)) {
            issues.push(main.name + ": " + CARD_CTRL + " not found");
        }
        if (!main.layer(CAMERA_NAME)) {
            issues.push(main.name + ": camera not found");
        }
        if (!main.layer(RIG_NAME)) {
            issues.push(main.name + ": rig null not found");
        }
        if (!findAudioLayer(main)) {
            issues.push(main.name + ": audio layer not found");
        }
        if (!findPHSLayer(main)) {
            issues.push(main.name + ": " + PHS_NAME + " precomp not found");
        }

        var slides = collectLinearSlides(main);
        if (slides.length === 0) {
            issues.push(main.name + ": no linear slides found");
        }

        collectExpressionIssues(main, issues);
        var host = slideHostComp(main);
        if (host !== main) collectExpressionIssues(host, issues);
        for (var i = 0; i < slides.length; i++) {
            collectExpressionIssues(slides[i].source, issues);
        }
        return issues;
    }

    function collectMissingFootage(root, issues) {
        var proj = ensureProject();
        var missingCount = 0;
        for (var i = 1; i <= proj.numItems; i++) {
            var item = proj.item(i);
            if (root && !itemBelongsToFolder(item, root)) continue;
            try {
                if (item instanceof FootageItem && item.footageMissing) {
                    missingCount++;
                    issues.push("Missing footage: " + item.name);
                }
            } catch (err) {
            }
        }
        return missingCount;
    }

    function bakeExpressionValue(property) {
        if (!property || !property.canSetExpression ||
            !property.expressionEnabled) {
            return;
        }
        try {
            var evaluated = property.value;
            property.expression = "";
            property.setValue(evaluated);
        } catch (ignored) {}
    }

    function cameraDistanceFromComp(comp, fallback) {
        try {
            var camera = comp ? comp.layer(CAMERA_NAME) : null;
            var transform = camera
                ? camera.property("ADBE Transform Group")
                : null;
            var position = transform
                ? transform.property("ADBE Position")
                : null;
            if (position) return Math.max(1, Math.abs(position.value[2]));
        } catch (ignored) {
        }
        return fallback;
    }

    function ensureMovementControls(moveCtrl, cardWidth) {
        var spacing = effectNumber(
            moveCtrl,
            FX_CARD_SPACING,
            Math.round(cardWidth * 0.62)
        );
        var lineDirection = effectNumber(
            moveCtrl,
            FX_LINE_DIRECTION,
            1
        );
        var oldPosition = effectByName(
            moveCtrl,
            "Carousel Position"
        );
        var convertedOffset = oldPosition
            ? -(oldPosition.property(1).value - 1) * spacing
            : 0;

        ensureSliderControl(moveCtrl, FX_SLIDE_COUNT, 8);
        ensureSliderControl(moveCtrl, FX_SLIDE_INDEX, 1);
        ensureSliderControl(moveCtrl, FX_PROGRESS, 0);
        ensureSliderControl(
            moveCtrl,
            FX_POSITION_X,
            lineDirection === 1 ? convertedOffset : 0
        );
        ensureSliderControl(
            moveCtrl,
            FX_POSITION_Y,
            lineDirection === 2 ? convertedOffset : 0
        );
        ensureSliderControl(
            moveCtrl,
            FX_POSITION_Z,
            lineDirection === 3 ? convertedOffset : 0
        );
        ensureDropdownControl(
            moveCtrl,
            FX_LINE_DIRECTION,
            ["Horizontal X", "Vertical Y", "Depth Z"],
            1
        );
        ensureCheckboxControl(moveCtrl, FX_CONSTANT_SPEED, false);
        ensureSliderControl(moveCtrl, FX_SPEED, 0);
        ensureSliderControl(
            moveCtrl,
            FX_CAMERA_DISTANCE_Z,
            Math.round(cameraDistanceFromComp(moveCtrl.containingComp, 2500))
        );
        ensureDropdownControl(
            moveCtrl,
            FX_CARD_DIRECTION,
            ["Front", "Toward Focus", "Away From Focus"],
            2
        );
        ensureSliderControl(moveCtrl, FX_CARD_SPACING, spacing);
        ensureSliderControl(moveCtrl, FX_FOCUS_SCALE, 125);
        ensureSliderControl(moveCtrl, FX_SIDE_SCALE, 72);
        ensureSliderControl(moveCtrl, FX_FOCUS_WIDTH, 1.35);
        ensureSliderControl(moveCtrl, FX_CAMERA_PUSH, 350);
        ensureAngleControl(moveCtrl, FX_SIDE_ANGLE, 32);

        removeNamedEffects(
            moveCtrl,
            [
                "Carousel Position",
                "Focus Curve",
                "Tilt X",
                "Tilt Y",
                "Tilt Z",
                "Global Scale (%)",
                "Rig Version"
            ]
        );
    }

    function ensureCardControls(cardCtrl, cardWidth, cardHeight) {
        var legacyPadX = effectNumber(
            cardCtrl,
            "Photo Pad X (px)",
            16
        );
        var legacyPadY = effectNumber(
            cardCtrl,
            "Photo Pad Y (px)",
            legacyPadX
        );

        ensureDropdownControl(
            cardCtrl,
            FX_CARD_ORIENTATION,
            ["Horizontal", "Vertical"],
            1
        );
        ensureSliderControl(cardCtrl, FX_CARD_W, cardWidth);
        ensureSliderControl(cardCtrl, FX_CARD_H, cardHeight);
        ensureSliderControl(cardCtrl, FX_CARD_RADIUS, 60);
        ensureColorControl(
            cardCtrl,
            FX_CARD_FILL,
            [0.12, 0.12, 0.13]
        );
        ensureColorControl(
            cardCtrl,
            FX_STROKE,
            [0.25, 0.25, 0.27]
        );
        ensureSliderControl(cardCtrl, FX_STROKE_W, 6);
        ensureColorControl(cardCtrl, FX_STROKE_NEAR, [1, 1, 1]);
        ensureSliderControl(cardCtrl, FX_STROKE_W_NEAR, 10);
        var reactionEffect = findLinearEffect(
            cardCtrl,
            [FX_STROKE_REACTION, "Stroke Reaction Width (cards)"]
        );
        if (reactionEffect) {
            reactionEffect.name = FX_STROKE_REACTION;
            if (reactionEffect.property(1).value < 1) {
                reactionEffect.property(1).setValue(35);
            }
        } else {
            ensureSliderControl(cardCtrl, FX_STROKE_REACTION, 35);
        }
        ensureSliderControl(
            cardCtrl,
            FX_PHOTO_PADDING,
            (legacyPadX + legacyPadY) / 2
        );
        ensureColorControl(cardCtrl, FX_TEXT_FILL, [1, 1, 1]);
        ensureSliderControl(cardCtrl, FX_TEXT_SIZE, 140);
        ensureSliderControl(cardCtrl, FX_TEXT_X, 0);
        ensureSliderControl(cardCtrl, FX_TEXT_Y, 0);
    }

    function replaceExpressionControlNames(group) {
        if (!group || !group.numProperties) return;
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);
            if (prop.canSetExpression && prop.expressionEnabled) {
                var expressionText = prop.expression;
                expressionText = expressionText
                    .split("Photo Pad X (px)")
                    .join(FX_PHOTO_PADDING);
                expressionText = expressionText
                    .split("Photo Pad Y (px)")
                    .join(FX_PHOTO_PADDING);
                if (expressionText !== prop.expression) {
                    prop.expression = expressionText;
                }
            }
            if (prop.numProperties) {
                replaceExpressionControlNames(prop);
            }
        }
    }

    function linearStrokeAmountExpression(mainName, compName, indent) {
        var p = indent || "";
        return p + 'mainComp=comp("' + mainName + '");\n' +
            p + 'try{slide=mainComp.layer("' + PHS_NAME + '").source.layer("' +
            compName + '");}\n' +
            p + 'catch(eSlide){slide=mainComp.layer("' + compName + '");}\n' +
            p + 'nearAmount=Math.max(0,Math.min(1,slide.effect("' +
            STROKE_PROXIMITY_AMOUNT + '")("Slider")));\n';
    }

    function linearStrokeWidthExpression(controllerRef, mainName, compName, indent) {
        var p = indent || "";
        return linearStrokeAmountExpression(mainName, compName, p) +
            p + 'swFar=Math.max(0,' + controllerRef + '.effect("' +
            FX_STROKE_W + '")("Slider"));\n' +
            p + 'swNear=Math.max(0,' + controllerRef + '.effect("' +
            FX_STROKE_W_NEAR + '")("Slider"));\n' +
            p + 'sw=swFar+(swNear-swFar)*nearAmount;\n';
    }

    function assignLinearBorderExpressions(comp, mainName, issues) {
        var border = null;
        try {
            border = comp.layer("CARD_BORDER");
        } catch (err) {
            border = null;
        }
        if (!border) {
            issues.push(comp.name + ": CARD_BORDER not found");
            return false;
        }

        try {
            var borderRect = border.property("ADBE Root Vectors Group")
                .property(1)
                .property("ADBE Vectors Group")
                .property("ADBE Vector Shape - Rect");
            var borderStroke = border.property("ADBE Root Vectors Group")
                .property(1)
                .property("ADBE Vectors Group")
                .property("ADBE Vector Graphic - Stroke");
            var ctrlRef = 'comp("' + mainName + '").layer("' +
                CARD_CTRL + '")';
            var cardMetrics = cardMetricsExpression(
                "c",
                "thisComp.width",
                "thisComp.height",
                "  "
            );
            var strokeWidth = linearStrokeWidthExpression(
                "c",
                mainName,
                comp.name,
                "  "
            );

            assignExpression(
                borderRect.property("ADBE Vector Rect Size"),
                'try{\n' +
                '  c=' + ctrlRef + ';\n' +
                cardMetrics +
                strokeWidth +
                '  [Math.max(1,cw-sw),Math.max(1,ch-sw)];\n' +
                '}catch(e){[thisComp.width-6,thisComp.height-6]};',
                comp.name + " border size",
                issues
            );
            assignExpression(
                borderRect.property("ADBE Vector Rect Roundness"),
                'try{\n' +
                '  c=' + ctrlRef + ';\n' +
                '  r=Math.max(0,c.effect("' + FX_CARD_RADIUS + '")("Slider"));\n' +
                strokeWidth +
                '  Math.max(0,r-sw/2);\n' +
                '}catch(e){57};',
                comp.name + " border radius",
                issues
            );
            assignExpression(
                borderStroke.property("ADBE Vector Stroke Color"),
                'try{\n' +
                '  c=' + ctrlRef + ';\n' +
                linearStrokeAmountExpression(mainName, comp.name, "  ") +
                '  far=c.effect("' + FX_STROKE + '")("Color");\n' +
                '  near=c.effect("' + FX_STROKE_NEAR + '")("Color");\n' +
                '  [far[0]+(near[0]-far[0])*nearAmount,' +
                'far[1]+(near[1]-far[1])*nearAmount,' +
                'far[2]+(near[2]-far[2])*nearAmount,1];\n' +
                '}catch(e){[0.25,0.25,0.27,1]};',
                comp.name + " stroke color",
                issues
            );
            assignExpression(
                borderStroke.property("ADBE Vector Stroke Width"),
                'try{\n' +
                '  c=' + ctrlRef + ';\n' +
                strokeWidth +
                '  sw;\n' +
                '}catch(e){6};',
                comp.name + " stroke width",
                issues
            );
            return true;
        } catch (err) {
            issues.push(comp.name + " border update: " + err.toString());
            return false;
        }
    }

    function centerPlaceholderLayer(comp, layerName, issues) {
        try {
            var layer = comp.layer(layerName);
            var wasLocked = layer.locked;
            layer.locked = false;
            layer.property("ADBE Transform Group")
                .property("ADBE Position")
                .setValue([comp.width * 0.5, comp.height * 0.5]);
            layer.locked = wasLocked;
        } catch (err) {
            if (issues) {
                issues.push(
                    comp.name + " " + layerName +
                    " center: " + err.toString()
                );
            }
        }
    }

    function ensurePlaceholderCanvas(comp, main, issues) {
        if (!comp || !main) return;
        try {
            var targetW = Math.max(comp.width, main.width);
            var targetH = Math.max(comp.height, main.height);
            if (comp.width < targetW) comp.width = targetW;
            if (comp.height < targetH) comp.height = targetH;
        } catch (err) {
            if (issues) {
                issues.push(comp.name + " canvas: " + err.toString());
            }
        }
        centerPlaceholderLayer(comp, "CARD", issues);
        centerPlaceholderLayer(comp, "PHOTO_REPLACE", issues);
        centerPlaceholderLayer(comp, "PHOTO_MATTE", issues);
        centerPlaceholderLayer(comp, "CARD_BORDER", issues);
    }

    function updatePlaceholderExpressions(comp, mainName, issues) {
        replaceExpressionControlNames(comp);
        var matte = comp.layer("PHOTO_MATTE");
        if (!matte) {
            issues.push(comp.name + ": PHOTO_MATTE not found");
            return;
        }
        try {
            var matteRect = matte.property("ADBE Root Vectors Group")
                .property(1)
                .property("ADBE Vectors Group")
                .property("ADBE Vector Shape - Rect");
            var ctrlRef = 'comp("' + mainName + '").layer("' +
                CARD_CTRL + '")';
            assignExpression(
                matteRect.property("ADBE Vector Rect Roundness"),
                'try{\n' +
                '  c=' + ctrlRef + ';\n' +
                '  r=Math.max(0,c.effect("' + FX_CARD_RADIUS +
                '")("Slider"));\n' +
                '  pad=Math.max(0,c.effect("' + FX_PHOTO_PADDING +
                '")("Slider"));\n' +
                '  Math.max(0,r-pad/2);\n' +
                '}catch(e){50};',
                comp.name + " matte radius",
                issues
            );
        } catch (err) {
            issues.push(
                comp.name + " matte update: " + err.toString()
            );
        }
        assignLinearBorderExpressions(comp, mainName, issues);
    }

    function updateActiveRig() {
        var context = getActiveLinearRig();
        var issues = [];
        if (!context) {
            issues.push(
                "Activate a composition inside CARUSEL_LINEAR first."
            );
            return { mainName: "", issues: issues };
        }
        if (!context.moveCtrl || !context.cardCtrl ||
            !context.rig || !context.camera) {
            issues.push(context.main.name + ": incomplete linear rig");
            return { mainName: context.main.name, issues: issues };
        }

        var oldMainName = context.main.name;
        var idMatch = /^(?:MAIN|CL_MAIN)_(\d+)$/.exec(oldMainName);
        var id = idMatch ? idMatch[1] : "01";
        context.main.name = "MAIN_" + id;

        var slides = collectLinearSlides(context.main);
        if (slides.length === 0) {
            issues.push(context.main.name + ": no linear slides found");
            return { mainName: context.main.name, issues: issues };
        }
        for (var renameIndex = 0; renameIndex < slides.length; renameIndex++) {
            var source = slides[renameIndex].source;
            var phMatch = /^CL\d+_PH_(\d+)$/.exec(source.name);
            if (phMatch) source.name = "PH_" + phMatch[1];
            slides[renameIndex].name = source.name;
        }

        var firstSource = slides[0].source;
        var cardWidth = effectNumber(
            context.cardCtrl,
            FX_CARD_W,
            firstSource.width
        );
        var cardHeight = effectNumber(
            context.cardCtrl,
            FX_CARD_H,
            firstSource.height
        );

        bakeExpressionValue(
            context.rig.property("ADBE Transform Group")
                .property("ADBE Scale")
        );
        bakeExpressionValue(
            context.rig.property("ADBE Transform Group")
                .property("ADBE Rotate X")
        );
        bakeExpressionValue(
            context.rig.property("ADBE Transform Group")
                .property("ADBE Rotate Y")
        );
        bakeExpressionValue(
            context.rig.property("ADBE Transform Group")
                .property("ADBE Rotate Z")
        );

        ensureMovementControls(context.moveCtrl, cardWidth);
        bindCameraDistance(context.camera, issues);
        removeBackgroundLayer(context.main);
        ensureCardControls(
            context.cardCtrl,
            cardWidth,
            cardHeight
        );
        applySlideExpressions(
            slides,
            issues,
            slides[0].containingComp === context.main
                ? null
                : context.main.name,
            slides[0].containingComp !== context.main
        );

        for (var i = 0; i < slides.length; i++) {
            ensurePlaceholderCanvas(
                slides[i].source,
                context.main,
                issues
            );
            updatePlaceholderExpressions(
                slides[i].source,
                context.main.name,
                issues
            );
        }
        removeNamedEffects(
            context.cardCtrl,
            [
                "Photo Pad X (px)",
                "Photo Pad Y (px)",
                "Photo Radius (%)"
            ]
        );
        precomposeSlidesIntoPHS(context.main, issues);
        slides = collectLinearSlides(context.main);
        var audioLayer = ensureAudioLayer(context.main, issues);
        context.cardCtrl.moveToBeginning();
        context.moveCtrl.moveToBeginning();
        placeAudioLayer(context.main, audioLayer);
        placePHSLayer(context.main, findPHSLayer(context.main));

        var checkIssues = checkRig(context.main);
        for (var checkIndex = 0;
            checkIndex < checkIssues.length;
            checkIndex++) {
            issues.push(checkIssues[checkIndex]);
        }

        context.main.openInViewer();
        return {
            mainName: context.main.name,
            cardCount: slides.length,
            issues: issues
        };
    }

    function removeItemTree(item) {
        if (!item) return;
        if (item instanceof FolderItem) {
            while (item.numItems > 0) {
                removeItemTree(item.item(item.numItems));
            }
        }
        item.remove();
    }

    function deleteActiveRig(askConfirmation) {
        var context = getActiveLinearRig();
        if (!context) {
            return {
                deleted: false,
                rootName: "",
                message:
                    "Activate a composition inside CARUSEL_LINEAR first."
            };
        }
        if (
            askConfirmation !== false &&
            !confirm(
                "Delete " + context.root.name +
                " and all of its comps and footage?"
            )
        ) {
            return {
                deleted: false,
                rootName: context.root.name,
                message: "Cancelled"
            };
        }
        var rootName = context.root.name;
        removeItemTree(context.root);
        return {
            deleted: true,
            rootName: rootName,
            message: ""
        };
    }

    function resetActiveRig() {
        var context = getActiveLinearRig();
        var issues = [];
        if (!context) {
            issues.push(
                "Activate a composition inside CARUSEL_LINEAR first."
            );
            return { mainName: "", cardCount: 0, issues: issues };
        }

        var slides = collectLinearSlides(context.main);
        if (!context.moveCtrl || !context.cardCtrl ||
            !context.rig || !context.camera || slides.length === 0) {
            issues = checkRig(context.main);
            return {
                mainName: context.main.name,
                cardCount: slides.length,
                issues: issues
            };
        }

        var firstSource = slides[0].source;
        var cardWidth = effectNumber(
            context.cardCtrl,
            FX_CARD_W,
            firstSource.width
        );
        var cardHeight = effectNumber(
            context.cardCtrl,
            FX_CARD_H,
            firstSource.height
        );
        var spacing = Math.round(cardWidth * 0.62);

        ensureMovementControls(context.moveCtrl, cardWidth);
        bindCameraDistance(context.camera, issues);
        ensureCardControls(context.cardCtrl, cardWidth, cardHeight);

        setEffectValue(
            context.moveCtrl,
            FX_SLIDE_COUNT,
            "Slider",
            slides.length,
            issues
        );
        setEffectValue(context.moveCtrl, FX_SLIDE_INDEX, "Slider", 1, issues);
        setEffectValue(context.moveCtrl, FX_PROGRESS, "Slider", 0, issues);
        setEffectValue(context.moveCtrl, FX_POSITION_X, "Slider", 0, issues);
        setEffectValue(context.moveCtrl, FX_POSITION_Y, "Slider", 0, issues);
        setEffectValue(context.moveCtrl, FX_POSITION_Z, "Slider", 0, issues);
        setMenuValue(context.moveCtrl, FX_LINE_DIRECTION, 1, issues);
        setEffectValue(context.moveCtrl, FX_CONSTANT_SPEED, "Checkbox", 0, issues);
        setEffectValue(context.moveCtrl, FX_SPEED, "Slider", 0, issues);
        setEffectValue(
            context.moveCtrl,
            FX_CAMERA_DISTANCE_Z,
            "Slider",
            Math.round(cameraDistanceFromComp(context.main, 2500)),
            issues
        );
        setMenuValue(context.moveCtrl, FX_CARD_DIRECTION, 2, issues);
        setEffectValue(
            context.moveCtrl,
            FX_CARD_SPACING,
            "Slider",
            spacing,
            issues
        );
        setEffectValue(context.moveCtrl, FX_FOCUS_SCALE, "Slider", 125, issues);
        setEffectValue(context.moveCtrl, FX_SIDE_SCALE, "Slider", 72, issues);
        setEffectValue(context.moveCtrl, FX_FOCUS_WIDTH, "Slider", 1.35, issues);
        setEffectValue(context.moveCtrl, FX_CAMERA_PUSH, "Slider", 350, issues);
        setEffectValue(context.moveCtrl, FX_SIDE_ANGLE, "Angle", 32, issues);

        setEffectValue(context.cardCtrl, FX_CARD_RADIUS, "Slider", 60, issues);
        setEffectValue(
            context.cardCtrl,
            FX_CARD_FILL,
            "Color",
            [0.12, 0.12, 0.13],
            issues
        );
        setEffectValue(
            context.cardCtrl,
            FX_STROKE,
            "Color",
            [0.25, 0.25, 0.27],
            issues
        );
        setEffectValue(context.cardCtrl, FX_STROKE_W, "Slider", 6, issues);
        setEffectValue(
            context.cardCtrl,
            FX_STROKE_NEAR,
            "Color",
            [1, 1, 1],
            issues
        );
        setEffectValue(context.cardCtrl, FX_STROKE_W_NEAR, "Slider", 10, issues);
        setEffectValue(
            context.cardCtrl,
            FX_STROKE_REACTION,
            "Slider",
            35,
            issues
        );
        setEffectValue(context.cardCtrl, FX_PHOTO_PADDING, "Slider", 16, issues);
        setEffectValue(
            context.cardCtrl,
            FX_TEXT_FILL,
            "Color",
            [1, 1, 1],
            issues
        );
        setEffectValue(context.cardCtrl, FX_TEXT_SIZE, "Slider", 140, issues);
        setEffectValue(context.cardCtrl, FX_TEXT_X, "Slider", 0, issues);
        setEffectValue(context.cardCtrl, FX_TEXT_Y, "Slider", 0, issues);

        applySlideExpressions(
            slides,
            issues,
            slideHost !== context.main ? context.main.name : null,
            slideHost !== context.main
        );
        for (var i = 0; i < slides.length; i++) {
            updatePlaceholderExpressions(
                slides[i].source,
                context.main.name,
                issues
            );
        }
        var audioLayer = ensureAudioLayer(context.main, issues);
        context.cardCtrl.moveToBeginning();
        context.moveCtrl.moveToBeginning();
        placeAudioLayer(context.main, audioLayer);

        var finalIssues = checkRig(context.main);
        for (var finalIndex = 0;
            finalIndex < finalIssues.length;
            finalIndex++) {
            issues.push(finalIssues[finalIndex]);
        }

        context.main.openInViewer();
        return {
            mainName: context.main.name,
            cardCount: slides.length,
            issues: issues
        };
    }

    function addCardsToActiveRig(addCount) {
        var issues = [];
        addCount = parseInt(addCount, 10);
        if (isNaN(addCount) || addCount < 1) {
            issues.push("Add Cards: enter a positive number.");
            return {
                mainName: "",
                cardCount: 0,
                addedCount: 0,
                issues: issues
            };
        }

        var updateResult = updateActiveRig();
        for (var updateIndex = 0;
            updateIndex < updateResult.issues.length;
            updateIndex++) {
            issues.push(updateResult.issues[updateIndex]);
        }

        var context = getActiveLinearRig();
        if (!context) {
            issues.push(
                "Activate a composition inside CARUSEL_LINEAR first."
            );
            return {
                mainName: "",
                cardCount: 0,
                addedCount: 0,
                issues: issues
            };
        }

        var slides = collectLinearSlides(context.main);
        var currentCount = slides.length;
        if (currentCount >= MAX_CARD_SLOTS) {
            issues.push(
                "Add Cards: maximum " + MAX_CARD_SLOTS +
                " cards already reached."
            );
            return {
                mainName: context.main.name,
                cardCount: currentCount,
                addedCount: 0,
                issues: issues
            };
        }

        var allowedAddCount = Math.min(
            addCount,
            MAX_CARD_SLOTS - currentCount
        );
        if (allowedAddCount < addCount) {
            issues.push(
                "Add Cards: added only " + allowedAddCount +
                " cards because the maximum is " + MAX_CARD_SLOTS + "."
            );
        }

        if (!context.moveCtrl || !context.cardCtrl || !context.rig ||
            slides.length === 0) {
            var checkIssues = checkRig(context.main);
            for (var checkIndex = 0;
                checkIndex < checkIssues.length;
                checkIndex++) {
                issues.push(checkIssues[checkIndex]);
            }
            return {
                mainName: context.main.name,
                cardCount: currentCount,
                addedCount: 0,
                issues: issues
            };
        }

        var proj = ensureProject();
        var placeholdersFolder = ensureChildFolder(
            proj,
            context.root,
            "PLACEHOLDERS"
        );
        var idMatch = /^(?:MAIN|CL_MAIN)_(\d+)$/.exec(context.main.name);
        var id = idMatch ? idMatch[1] : "01";
        var instanceTag = "CL" + id;
        var slideHost = slideHostComp(context.main);
        var firstSource = slides[0].source;
        var cardWidth = Math.round(effectNumber(
            context.cardCtrl,
            FX_CARD_W,
            firstSource.width
        ));
        var cardHeight = Math.round(effectNumber(
            context.cardCtrl,
            FX_CARD_H,
            firstSource.height
        ));

        for (var i = 1; i <= allowedAddCount; i++) {
            var index = currentCount + i;
            var placeholder = createPlaceholder(
                proj,
                placeholdersFolder,
                context.main.name,
                instanceTag,
                index,
                context.main.duration,
                context.main.frameRate,
                cardWidth,
                cardHeight,
                issues,
                context.main.width,
                context.main.height
            );
            addLinearSlideLayer(
                slideHost,
                placeholder,
                slideHost === context.main ? context.rig : null,
                cardWidth,
                cardHeight,
                index
            );
        }

        slides = collectLinearSlides(context.main);
        setEffectValue(
            context.moveCtrl,
            FX_SLIDE_COUNT,
            "Slider",
            slides.length,
            issues
        );
        ensureMovementControls(context.moveCtrl, cardWidth);
        ensureCardControls(context.cardCtrl, cardWidth, cardHeight);
        applySlideExpressions(
            slides,
            issues,
            slideHost !== context.main ? context.main.name : null,
            slideHost !== context.main
        );
        if (slideHost !== context.main) {
            retargetNestedSlideExpressions(slideHost, context.main.name, issues);
        }
        for (var slideIndex = 0; slideIndex < slides.length; slideIndex++) {
            updatePlaceholderExpressions(
                slides[slideIndex].source,
                context.main.name,
                issues
            );
        }
        var audioLayer = ensureAudioLayer(context.main, issues);
        context.cardCtrl.moveToBeginning();
        context.moveCtrl.moveToBeginning();
        placeAudioLayer(context.main, audioLayer);
        placePHSLayer(context.main, findPHSLayer(context.main));

        var finalIssues = checkRig(context.main);
        for (var finalIndex = 0;
            finalIndex < finalIssues.length;
            finalIndex++) {
            issues.push(finalIssues[finalIndex]);
        }

        context.main.openInViewer();
        return {
            mainName: context.main.name,
            cardCount: slides.length,
            addedCount: allowedAddCount,
            issues: issues
        };
    }

    function replaceMediaActiveRig(mediaFolder) {
        var issues = [];
        var context = getActiveLinearRig();
        if (!context) {
            issues.push(
                "Activate a composition inside CARUSEL_LINEAR first."
            );
            return {
                mainName: "",
                cardCount: 0,
                replacedCount: 0,
                importedCount: 0,
                issues: issues
            };
        }

        if (typeof mediaFolder === "undefined") {
            mediaFolder = Folder.selectDialog(
                "Select a folder with replacement photos or videos."
            );
        }
        if (!mediaFolder) {
            return {
                mainName: context.main.name,
                cardCount: collectLinearSlides(context.main).length,
                replacedCount: 0,
                importedCount: 0,
                issues: issues
            };
        }

        var updateResult = updateActiveRig();
        for (var updateIndex = 0;
            updateIndex < updateResult.issues.length;
            updateIndex++) {
            issues.push(updateResult.issues[updateIndex]);
        }

        context = getActiveLinearRig();
        var slides = collectLinearSlides(context.main);
        var footageFolder = ensureChildFolder(
            ensureProject(),
            context.root,
            "FOOTAGE"
        );
        var mediaFiles = getMediaFiles(mediaFolder);
        if (mediaFiles.length === 0) {
            issues.push("Replace Media: no supported media files found.");
            return {
                mainName: context.main.name,
                cardCount: slides.length,
                replacedCount: 0,
                importedCount: 0,
                issues: issues
            };
        }

        var imported = importMedia(
            ensureProject(),
            mediaFiles,
            footageFolder,
            issues
        );
        var replaceCount = Math.min(imported.length, slides.length);
        for (var i = 0; i < replaceCount; i++) {
            replacePhoto(slides[i].source, imported[i], issues);
        }
        if (imported.length < slides.length) {
            issues.push(
                "Replace Media: only " +
                imported.length +
                " files for " +
                slides.length +
                " cards."
            );
        }
        if (imported.length > slides.length) {
            issues.push(
                "Replace Media: imported " +
                imported.length +
                " files, used first " +
                slides.length +
                "."
            );
        }

        var finalIssues = checkRig(context.main);
        for (var finalIndex = 0;
            finalIndex < finalIssues.length;
            finalIndex++) {
            issues.push(finalIssues[finalIndex]);
        }
        context.main.openInViewer();
        return {
            mainName: context.main.name,
            cardCount: slides.length,
            replacedCount: replaceCount,
            importedCount: imported.length,
            issues: issues
        };
    }

    function cleanCheckProject() {
        var updateResult = updateActiveRig();
        var issues = updateResult.issues || [];
        var context = getActiveLinearRig();
        if (!context) return updateResult;

        var missingCount = collectMissingFootage(context.root, issues);
        var finalIssues = checkRig(context.main);
        for (var i = 0; i < finalIssues.length; i++) {
            issues.push(finalIssues[i]);
        }

        return {
            mainName: context.main.name,
            cardCount: collectLinearSlides(context.main).length,
            missingFootageCount: missingCount,
            issues: issues
        };
    }

    function build(options) {
        var proj = ensureProject();
        var issues = [];
        var cameraSettings = options.camera || {
            focalLength: 50,
            depthOfField: false,
            focusCenter: true,
            focusDistance: 2500,
            fStop: 5.6,
            aperture: 8.93,
            blurLevel: 100
        };
        if (
            typeof cameraSettings.aperture !== "number" ||
            isNaN(cameraSettings.aperture)
        ) {
            cameraSettings.aperture =
                cameraSettings.focalLength / cameraSettings.fStop;
        }
        var instanceNo = nextInstanceNumber(proj);
        var id = pad2(instanceNo);
        var instanceTag = "CL" + id;
        var mainName = "MAIN_" + id;
        var rootName = "CARUSEL_LINEAR_" + id;

        var width = options.vertical ? 2160 : 3840;
        var height = options.vertical ? 3840 : 2160;
        var fps = 30;

        var focalLength = cameraSettings.focalLength;
        var zoom = width * focalLength / FILM_SIZE_MM;
        // Keep camera distance independent from the selected lens.
        // Otherwise the distance cancels the visual effect of focal length.
        var framingZoom =
            width * BASE_FOCAL_LENGTH_MM / FILM_SIZE_MM;
        var frontDistance =
            options.cardW * framingZoom / (width * 0.65);
        var cameraZ = -Math.max(2500, frontDistance + 700);

        var root = addFolder(proj, rootName, null);
        var compsFolder = addFolder(proj, "COMPS", root);
        var placeholdersFolder = addFolder(proj, "PLACEHOLDERS", root);
        var footageFolder = addFolder(proj, "FOOTAGE", root);

        var main = proj.items.addComp(
            mainName,
            width,
            height,
            1,
            options.duration,
            fps
        );
        main.parentFolder = compsFolder;

        var moveCtrl = addMovementController(
            main,
            options.count,
            options.cardW,
            Math.abs(cameraZ)
        );
        var cardCtrl = addCardController(
            main,
            options.cardW,
            options.cardH
        );
        addCamera(
            main,
            cameraZ,
            {
                focalLength: focalLength,
                zoom: zoom,
                depthOfField: cameraSettings.depthOfField,
                focusCenter: cameraSettings.focusCenter,
                focusDistance: cameraSettings.focusDistance,
                fStop: cameraSettings.fStop,
                aperture: cameraSettings.aperture,
                blurLevel: cameraSettings.blurLevel
            },
            issues
        );

        var placeholders = [];
        var reserveCount = options.count;
        for (var i = 1; i <= reserveCount; i++) {
            placeholders.push(createPlaceholder(
                proj,
                placeholdersFolder,
                mainName,
                instanceTag,
                i,
                options.duration,
                fps,
                options.cardW,
                options.cardH,
                issues,
                main.width,
                main.height
            ));
        }

        var importedCount = 0;
        if (options.mediaFolder) {
            var mediaFiles = getMediaFiles(options.mediaFolder);
            var imported = importMedia(proj, mediaFiles, footageFolder, issues);
            importedCount = Math.min(imported.length, placeholders.length);
            for (var k = 0; k < importedCount; k++) {
                replacePhoto(placeholders[k], imported[k], issues);
            }
        }

        addRigAndSlides(
            main,
            placeholders,
            options.cardW,
            options.cardH,
            issues
        );
        precomposeSlidesIntoPHS(main, issues);

        var audioLayer = ensureAudioLayer(main, issues);
        cardCtrl.moveToBeginning();
        moveCtrl.moveToBeginning();
        placeAudioLayer(main, audioLayer);
        placePHSLayer(main, findPHSLayer(main));
        main.hideShyLayers = true;
        main.openInViewer();

        return {
            mainName: mainName,
            rootName: rootName,
            cardCount: options.count,
            reserveCount: placeholders.length,
            importedCount: importedCount,
            issues: issues
        };
    }

    function showWarnings(issues) {
        if (!issues || issues.length === 0) return;

        var maxShown = Math.min(12, issues.length);
        var message = "Linear carousel warnings (" + issues.length + "):";
        for (var i = 0; i < maxShown; i++) {
            message += "\n- " + issues[i];
        }
        if (issues.length > maxShown) {
            message += "\n- ...and " + (issues.length - maxShown) + " more";
        }
        alert(message);
    }

    function createFromPanel(ui) {
        var count = parseInt(ui.count.text, 10);
        if (isNaN(count)) count = 8;
        count = clamp(count, 1, MAX_CARD_SLOTS);
        ui.count.text = String(count);

        var duration = parseFloat(ui.duration.text);
        if (isNaN(duration)) duration = 15;
        duration = clamp(duration, 1, 600);
        ui.duration.text = String(duration);

        var cardW = parseInt(ui.cardW.text, 10);
        if (isNaN(cardW)) cardW = 1920;
        cardW = clamp(cardW, 100, 10000);
        ui.cardW.text = String(cardW);

        var cardH = parseInt(ui.cardH.text, 10);
        if (isNaN(cardH)) cardH = 1080;
        cardH = clamp(cardH, 100, 10000);
        ui.cardH.text = String(cardH);

        var lensIndex = ui.lensPreset.selection
            ? ui.lensPreset.selection.index
            : 5;
        var focalLength = CAMERA_PRESETS[lensIndex];

        var focusDistance = parseFloat(ui.focusDistance.text);
        if (isNaN(focusDistance)) focusDistance = 2500;
        focusDistance = clamp(focusDistance, 1, 1000000);
        ui.focusDistance.text = String(focusDistance);

        var fStop = parseFloat(ui.fStop.text);
        if (isNaN(fStop)) fStop = 5.6;
        fStop = clamp(fStop, 0.1, 128);
        ui.fStop.text = String(fStop);

        var aperture = parseFloat(ui.aperture.text);
        if (isNaN(aperture)) aperture = focalLength / fStop;
        aperture = clamp(aperture, 0.01, 10000);
        ui.aperture.text = String(aperture);

        var blurLevel = parseFloat(ui.blurLevel.text);
        if (isNaN(blurLevel)) blurLevel = 100;
        blurLevel = clamp(blurLevel, 0, 1000);
        ui.blurLevel.text = String(blurLevel);

        var mediaFolder = null;
        if (ui.importMedia.value) {
            mediaFolder = Folder.selectDialog(
                "Select a folder with photos or videos."
            );
        }

        setPanelButtonsEnabled(ui, false);
        ui.status.text = "Working...";
        app.beginUndoGroup("carusel_builder_RV Linear v" + VERSION);
        try {
            var result = build({
                count: count,
                duration: duration,
                cardW: cardW,
                cardH: cardH,
                vertical: ui.orientation.selection.index === 1,
                camera: {
                    focalLength: focalLength,
                    depthOfField: ui.depthOfField.value,
                    focusCenter: ui.focusCenter.value,
                    focusDistance: focusDistance,
                    fStop: fStop,
                    aperture: aperture,
                    blurLevel: blurLevel
                },
                mediaFolder: mediaFolder
            });

            ui.status.text = result.mainName;
            showWarnings(result.issues);
        } catch (err) {
            ui.status.text = "Error";
            alert(
                "carusel_builder_RV Linear failed:\n" +
                err.toString() +
                (err.line ? "\nLine: " + err.line : "") +
                "\n\nUse Undo to remove a partial build."
            );
        } finally {
            app.endUndoGroup();
            setPanelButtonsEnabled(ui, true);
        }
    }

    function setPanelButtonsEnabled(ui, enabled) {
        ui.createButton.enabled = enabled;
        ui.updateButton.enabled = enabled;
        ui.resetButton.enabled = enabled;
        ui.deleteButton.enabled = enabled;
        ui.addCardsButton.enabled = enabled;
        ui.replaceMediaButton.enabled = enabled;
        ui.cleanCheckButton.enabled = enabled;
    }

    function runActiveRigPanelCommand(ui, statusText, undoName, command) {
        setPanelButtonsEnabled(ui, false);
        ui.status.text = statusText;
        app.beginUndoGroup(undoName);
        try {
            var result = command();
            if (result.issues && result.issues.length > 0) {
                ui.status.text = "Finished with warnings";
            } else {
                ui.status.text = result.mainName || "Ready";
            }
            showWarnings(result.issues);
        } catch (err) {
            ui.status.text = "Error";
            alert(
                undoName + " failed:\n" +
                err.toString() +
                (err.line ? "\nLine: " + err.line : "")
            );
        } finally {
            app.endUndoGroup();
            setPanelButtonsEnabled(ui, true);
        }
    }

    function updateFromPanel(ui) {
        setPanelButtonsEnabled(ui, false);
        ui.status.text = "Updating...";
        app.beginUndoGroup(
            "Update carusel_builder_RV Linear v" + VERSION
        );
        try {
            var result = updateActiveRig();
            ui.status.text = result.mainName || "No active linear rig";
            showWarnings(result.issues);
        } catch (err) {
            ui.status.text = "Update error";
            alert(
                "Update Linear Rig failed:\n" +
                err.toString() +
                (err.line ? "\nLine: " + err.line : "")
            );
        } finally {
            app.endUndoGroup();
            setPanelButtonsEnabled(ui, true);
        }
    }

    function deleteFromPanel(ui) {
        setPanelButtonsEnabled(ui, false);
        app.beginUndoGroup(
            "Delete carusel_builder_RV Linear Rig"
        );
        try {
            var result = deleteActiveRig(true);
            if (result.deleted) {
                ui.status.text = result.rootName + " deleted";
            } else {
                ui.status.text = result.message || "Not deleted";
                if (result.message &&
                    result.message !== "Cancelled") {
                    alert(result.message);
                }
            }
        } catch (err) {
            ui.status.text = "Delete error";
            alert(
                "Delete Linear Rig failed:\n" +
                err.toString() +
                (err.line ? "\nLine: " + err.line : "")
            );
        } finally {
            app.endUndoGroup();
            setPanelButtonsEnabled(ui, true);
        }
    }

        return {
            type: TYPE_LINEAR,
            version: VERSION,
            build: build,
            updateActiveRig: updateActiveRig,
            resetActiveRig: resetActiveRig,
            deleteActiveRig: deleteActiveRig,
            addCardsToActiveRig: addCardsToActiveRig,
            replaceMediaActiveRig: replaceMediaActiveRig,
            cleanCheckProject: cleanCheckProject
        };
    }

    var circularModule = createCircularModule();
    var linearModule = createLinearModule();

    function clamp(v, minV, maxV) {
        return Math.max(minV, Math.min(maxV, v));
    }

    function selectedType(ui) {
        return ui.type.selection && ui.type.selection.index === 1
            ? TYPE_LINEAR
            : TYPE_CIRCULAR;
    }

    function selectedModule(ui) {
        return selectedType(ui) === TYPE_LINEAR
            ? linearModule
            : circularModule;
    }

    function selectedCameraName(ui) {
        return selectedType(ui) === TYPE_LINEAR
            ? "CL_CAMERA"
            : "CR_CAMERA";
    }

    function tryBoldText(label) {
        try {
            label.graphics.font = ScriptUI.newFont(
                label.graphics.font.name,
                "bold",
                label.graphics.font.size
            );
        } catch (fontError) {
        }
    }

    function setSectionVisible(section, visible) {
        section.visible = visible;
        section.maximumSize.height = visible ? 1000 : 0;
    }

    function makePanel(thisObj) {
        var w = thisObj instanceof Panel
            ? thisObj
            : new Window(
                "palette",
                "carusel_builder_RV v" + VERSION,
                undefined,
                { resizeable: true }
            );
        w.orientation = "column";
        w.alignChildren = ["fill", "top"];
        w.margins = 12;
        w.spacing = 8;

        var header = w.add("group");
        header.orientation = "column";
        header.alignChildren = ["fill", "top"];
        var title = header.add(
            "statictext",
            undefined,
            "carusel_builder_RV v" + VERSION
        );
        tryBoldText(title);
        var subtitle = header.add(
            "statictext",
            undefined,
            "One panel for circular and linear carousel rigs."
        );

        var setup = w.add("panel", undefined, "Build");
        setup.orientation = "column";
        setup.alignChildren = ["fill", "top"];
        setup.margins = 12;

        var typeRow = setup.add("group");
        typeRow.add("statictext", undefined, "Type:");
        var type = typeRow.add(
            "dropdownlist",
            undefined,
            [TYPE_CIRCULAR, TYPE_LINEAR]
        );
        type.selection = type.items[0];

        var countRow = setup.add("group");
        countRow.add("statictext", undefined, "Cards:");
        var count = countRow.add("edittext", undefined, "8");
        count.characters = 7;
        countRow.add("statictext", undefined, "Duration:");
        var duration = countRow.add("edittext", undefined, "15");
        duration.characters = 7;

        var compRow = setup.add("group");
        compRow.add("statictext", undefined, "Main comp:");
        var orientation = compRow.add(
            "dropdownlist",
            undefined,
            ["Horizontal 3840 x 2160", "Vertical 2160 x 3840"]
        );
        orientation.selection = orientation.items[0];

        var cardRow = setup.add("group");
        cardRow.add("statictext", undefined, "Card comp:");
        var cardW = cardRow.add("edittext", undefined, "1920");
        cardW.characters = 7;
        cardRow.add("statictext", undefined, "x");
        var cardH = cardRow.add("edittext", undefined, "1080");
        cardH.characters = 7;

        var importMedia = setup.add(
            "checkbox",
            undefined,
            "Import photos/videos now"
        );
        importMedia.value = false;

        var circularOptions = w.add("panel", undefined, "Circular Options");
        circularOptions.orientation = "column";
        circularOptions.alignChildren = ["fill", "top"];
        circularOptions.margins = 12;

        var polygon = circularOptions.add(
            "checkbox",
            undefined,
            "Start with polygon orientation"
        );
        polygon.value = false;

        var scaleWithRadius = circularOptions.add(
            "checkbox",
            undefined,
            "Scale cards when radius changes"
        );
        scaleWithRadius.value = false;

        var showText = circularOptions.add(
            "checkbox",
            undefined,
            "Add card text"
        );
        showText.value = true;

        var linearOptions = w.add("panel", undefined, "Linear Options");
        linearOptions.orientation = "column";
        linearOptions.alignChildren = ["fill", "top"];
        linearOptions.margins = 12;
        var linearNote = linearOptions.add(
            "statictext",
            undefined,
            "Animate Position X, Y or Z on main_control for smooth manual motion.",
            { multiline: true }
        );
        linearNote.preferredSize.width = 430;

        var cameraPanel = w.add("panel", undefined, "Camera");
        cameraPanel.orientation = "column";
        cameraPanel.alignChildren = ["fill", "top"];
        cameraPanel.margins = 12;

        var cameraNameRow = cameraPanel.add("group");
        cameraNameRow.add("statictext", undefined, "Name:");
        var cameraName = cameraNameRow.add(
            "edittext",
            undefined,
            "CR_CAMERA"
        );
        cameraName.characters = 18;
        cameraName.enabled = false;

        var lensRow = cameraPanel.add("group");
        lensRow.add("statictext", undefined, "Lens:");
        var lensItems = [];
        for (var lensIndex = 0;
            lensIndex < CAMERA_PRESETS.length;
            lensIndex++) {
            lensItems.push(CAMERA_PRESETS[lensIndex] + " mm");
        }
        var lensPreset = lensRow.add(
            "dropdownlist",
            undefined,
            lensItems
        );
        lensPreset.selection = lensPreset.items[5];

        var zoomInfo = cameraPanel.add(
            "statictext",
            undefined,
            "Zoom: automatic"
        );

        var depthOfField = cameraPanel.add(
            "checkbox",
            undefined,
            "Enable Depth of Field"
        );
        depthOfField.value = false;

        var focusCenter = cameraPanel.add(
            "checkbox",
            undefined,
            "Focus on carousel center"
        );
        focusCenter.value = true;

        var focusRow = cameraPanel.add("group");
        focusRow.add("statictext", undefined, "Focus distance:");
        var focusDistance = focusRow.add("edittext", undefined, "2500");
        focusDistance.characters = 9;
        focusRow.add("statictext", undefined, "px");

        var fStopRow = cameraPanel.add("group");
        fStopRow.add("statictext", undefined, "F-Stop:");
        var fStop = fStopRow.add("edittext", undefined, "5.6");
        fStop.characters = 7;

        var apertureRow = cameraPanel.add("group");
        apertureRow.add("statictext", undefined, "Aperture:");
        var aperture = apertureRow.add("edittext", undefined, "8.93");
        aperture.characters = 7;
        apertureRow.add("statictext", undefined, "mm");

        var blurRow = cameraPanel.add("group");
        blurRow.add("statictext", undefined, "Blur:");
        var blurLevel = blurRow.add("edittext", undefined, "100");
        blurLevel.characters = 7;
        blurRow.add("statictext", undefined, "%");

        var primaryButtons = w.add("group");
        primaryButtons.alignment = "right";
        var createButton = primaryButtons.add("button", undefined, "Create");
        var updateButton = primaryButtons.add("button", undefined, "Update");
        var resetButton = primaryButtons.add("button", undefined, "Reset");

        var maintenanceButtons = w.add("group");
        maintenanceButtons.alignment = "right";
        var addCardsButton = maintenanceButtons.add(
            "button",
            undefined,
            "Add Cards"
        );
        var replaceMediaButton = maintenanceButtons.add(
            "button",
            undefined,
            "Replace Media"
        );
        var cleanCheckButton = maintenanceButtons.add(
            "button",
            undefined,
            "Clean/Check"
        );
        var deleteButton = maintenanceButtons.add(
            "button",
            undefined,
            "Delete"
        );

        var status = w.add("statictext", undefined, "Ready");
        status.alignment = ["fill", "top"];

        function selectedFocalLength() {
            var selectedIndex = lensPreset.selection
                ? lensPreset.selection.index
                : 5;
            return CAMERA_PRESETS[selectedIndex];
        }

        function uiNumber(field, fallback, minValue, maxValue) {
            var value = parseFloat(field.text);
            if (isNaN(value)) value = fallback;
            return clamp(value, minValue, maxValue);
        }

        function syncApertureFromFStop() {
            var focalLength = selectedFocalLength();
            var parsedFStop = uiNumber(fStop, 5.6, 0.1, 128);
            aperture.text = (focalLength / parsedFStop).toFixed(2);
        }

        function syncFStopFromAperture() {
            var focalLength = selectedFocalLength();
            var parsedAperture = uiNumber(
                aperture,
                focalLength / 5.6,
                0.01,
                10000
            );
            fStop.text = (focalLength / parsedAperture).toFixed(2);
        }

        function updateCameraUi() {
            var focalLength = selectedFocalLength();
            var compWidth = orientation.selection.index === 1
                ? 2160
                : 3840;
            var zoom = compWidth * focalLength / FILM_SIZE_MM;
            zoomInfo.text = "Zoom: " + zoom.toFixed(2) + " px";

            focusCenter.enabled = depthOfField.value;
            focusRow.enabled =
                depthOfField.value && !focusCenter.value;
            fStopRow.enabled = depthOfField.value;
            apertureRow.enabled = depthOfField.value;
            blurRow.enabled = depthOfField.value;
        }

        function applyCameraUiToActiveComp() {
            var comp = app.project ? app.project.activeItem : null;
            if (!(comp instanceof CompItem)) return false;

            var expectedName = selectedCameraName({ type: type });
            var camera = comp.layer(expectedName) ||
                comp.layer("CR_CAMERA") ||
                comp.layer("CL_CAMERA") ||
                comp.layer("KR_CAMERA");
            if (!camera) return false;

            try {
                var focalLength = selectedFocalLength();
                var parsedAperture = uiNumber(
                    aperture,
                    focalLength / 5.6,
                    0.01,
                    10000
                );
                var parsedFocus = uiNumber(
                    focusDistance,
                    2500,
                    1,
                    1000000
                );
                var parsedBlur = uiNumber(
                    blurLevel,
                    100,
                    0,
                    1000
                );
                var cameraOptions = camera.property(
                    "ADBE Camera Options Group"
                );
                var transform = camera.property(
                    "ADBE Transform Group"
                );

                cameraOptions.property("ADBE Camera Zoom").setValue(
                    comp.width * focalLength / FILM_SIZE_MM
                );
                cameraOptions.property(
                    "ADBE Camera Depth of Field"
                ).setValue(depthOfField.value ? 1 : 0);
                cameraOptions.property("ADBE Camera Aperture").setValue(
                    parsedAperture
                );
                cameraOptions.property("ADBE Camera Blur Level").setValue(
                    parsedBlur
                );

                if (focusCenter.value && transform) {
                    var cameraPosition = transform.property(
                        "ADBE Position"
                    ).value;
                    var pointOfInterest = transform.property(
                        "ADBE Anchor Point"
                    );
                    if (!pointOfInterest) {
                        pointOfInterest = transform.property(
                            "Point of Interest"
                        );
                    }
                    if (pointOfInterest) {
                        var target = pointOfInterest.value;
                        var dx = cameraPosition[0] - target[0];
                        var dy = cameraPosition[1] - target[1];
                        var dz = cameraPosition[2] - target[2];
                        parsedFocus = Math.sqrt(
                            dx * dx + dy * dy + dz * dz
                        );
                    }
                }
                cameraOptions.property(
                    "ADBE Camera Focus Distance"
                ).setValue(parsedFocus);

                status.text =
                    camera.name + " updated: " + focalLength + " mm";
                return true;
            } catch (cameraUiError) {
                status.text = "Camera update error";
                return false;
            }
        }

        function refreshModeUi() {
            var isCircular = type.selection.index === 0;
            cameraName.text = isCircular ? "CR_CAMERA" : "CL_CAMERA";
            setSectionVisible(circularOptions, isCircular);
            setSectionVisible(linearOptions, !isCircular);
            updateCameraUi();
            w.layout.layout(true);
            w.layout.resize();
        }

        type.onChange = refreshModeUi;
        orientation.onChange = updateCameraUi;
        lensPreset.onChange = function () {
            syncApertureFromFStop();
            updateCameraUi();
            applyCameraUiToActiveComp();
        };
        depthOfField.onClick = function () {
            updateCameraUi();
            applyCameraUiToActiveComp();
        };
        focusCenter.onClick = function () {
            updateCameraUi();
            applyCameraUiToActiveComp();
        };
        fStop.onChanging = function () {
            syncApertureFromFStop();
            updateCameraUi();
        };
        fStop.onChange = function () {
            syncApertureFromFStop();
            updateCameraUi();
            applyCameraUiToActiveComp();
        };
        aperture.onChanging = syncFStopFromAperture;
        aperture.onChange = function () {
            syncFStopFromAperture();
            updateCameraUi();
            applyCameraUiToActiveComp();
        };
        focusDistance.onChange = applyCameraUiToActiveComp;
        blurLevel.onChange = applyCameraUiToActiveComp;

        refreshModeUi();

        return {
            win: w,
            type: type,
            count: count,
            orientation: orientation,
            duration: duration,
            cardW: cardW,
            cardH: cardH,
            importMedia: importMedia,
            polygon: polygon,
            scaleWithRadius: scaleWithRadius,
            showText: showText,
            lensPreset: lensPreset,
            depthOfField: depthOfField,
            focusCenter: focusCenter,
            focusDistance: focusDistance,
            fStop: fStop,
            aperture: aperture,
            blurLevel: blurLevel,
            createButton: createButton,
            updateButton: updateButton,
            resetButton: resetButton,
            addCardsButton: addCardsButton,
            replaceMediaButton: replaceMediaButton,
            cleanCheckButton: cleanCheckButton,
            deleteButton: deleteButton,
            status: status
        };
    }

    function parseIntegerField(field, fallback, minValue, maxValue) {
        var value = parseInt(field.text, 10);
        if (isNaN(value)) value = fallback;
        value = clamp(value, minValue, maxValue);
        field.text = String(value);
        return value;
    }

    function parseNumberField(field, fallback, minValue, maxValue) {
        var value = parseFloat(field.text);
        if (isNaN(value)) value = fallback;
        value = clamp(value, minValue, maxValue);
        field.text = String(value);
        return value;
    }

    function selectedFocalLength(ui) {
        var selectedIndex = ui.lensPreset.selection
            ? ui.lensPreset.selection.index
            : 5;
        return CAMERA_PRESETS[selectedIndex];
    }

    function cameraSettingsFromUi(ui) {
        var focalLength = selectedFocalLength(ui);
        var focusDistance = parseNumberField(
            ui.focusDistance,
            2500,
            1,
            1000000
        );
        var fStop = parseNumberField(ui.fStop, 5.6, 0.1, 128);
        var aperture = parseNumberField(
            ui.aperture,
            focalLength / fStop,
            0.01,
            10000
        );
        var blurLevel = parseNumberField(ui.blurLevel, 100, 0, 1000);

        return {
            focalLength: focalLength,
            depthOfField: ui.depthOfField.value,
            focusCenter: ui.focusCenter.value,
            focusDistance: focusDistance,
            fStop: fStop,
            aperture: aperture,
            blurLevel: blurLevel
        };
    }

    function buildOptionsFromUi(ui) {
        var count = parseIntegerField(ui.count, 8, 1, 40);
        var duration = parseNumberField(ui.duration, 15, 1, 600);
        var cardW = parseIntegerField(ui.cardW, 1920, 100, 10000);
        var cardH = parseIntegerField(ui.cardH, 1080, 100, 10000);
        var mediaFolder = null;

        if (ui.importMedia.value) {
            mediaFolder = Folder.selectDialog(
                "Select a folder with photos or videos."
            );
        }

        return {
            count: count,
            duration: duration,
            cardW: cardW,
            cardH: cardH,
            vertical: ui.orientation.selection.index === 1,
            polygon: ui.polygon.value,
            scaleWithRadius: ui.scaleWithRadius.value,
            showText: ui.showText.value,
            camera: cameraSettingsFromUi(ui),
            mediaFolder: mediaFolder
        };
    }

    function showWarnings(issues) {
        if (!issues || issues.length === 0) return;

        var maxShown = Math.min(12, issues.length);
        var message = "carusel_builder_RV v" + VERSION +
            " warnings (" + issues.length + "):";
        for (var i = 0; i < maxShown; i++) {
            message += "\n- " + issues[i];
        }
        if (issues.length > maxShown) {
            message += "\n- ...and " + (issues.length - maxShown) + " more";
        }
        alert(message);
    }

    function setPanelButtonsEnabled(ui, enabled) {
        ui.createButton.enabled = enabled;
        ui.updateButton.enabled = enabled;
        ui.resetButton.enabled = enabled;
        ui.addCardsButton.enabled = enabled;
        ui.replaceMediaButton.enabled = enabled;
        ui.cleanCheckButton.enabled = enabled;
        ui.deleteButton.enabled = enabled;
    }

    function createFromPanel(ui) {
        var module = selectedModule(ui);
        setPanelButtonsEnabled(ui, false);
        ui.status.text = "Creating " + selectedType(ui) + "...";
        app.beginUndoGroup("carusel_builder_RV v" + VERSION + " Create");
        try {
            var result = module.build(buildOptionsFromUi(ui));
            ui.status.text = result.mainName || "Ready";
            showWarnings(result.issues);
        } catch (err) {
            ui.status.text = "Error";
            alert(
                "carusel_builder_RV v" + VERSION + " failed:\n" +
                err.toString() +
                (err.line ? "\nLine: " + err.line : "") +
                "\n\nUse Undo to remove a partial build."
            );
        } finally {
            app.endUndoGroup();
            setPanelButtonsEnabled(ui, true);
        }
    }

    function runPanelCommand(ui, statusText, undoName, command) {
        setPanelButtonsEnabled(ui, false);
        ui.status.text = statusText;
        app.beginUndoGroup(undoName);
        try {
            var result = command();
            if (result.deleted) {
                ui.status.text = result.rootName + " deleted";
            } else if (result.issues && result.issues.length > 0) {
                ui.status.text = "Finished with warnings";
            } else {
                ui.status.text =
                    result.mainName || result.message || "Ready";
            }
            if (result.message &&
                result.message !== "Cancelled" &&
                !result.deleted) {
                alert(result.message);
            }
            showWarnings(result.issues);
        } catch (err) {
            ui.status.text = "Error";
            alert(
                undoName + " failed:\n" +
                err.toString() +
                (err.line ? "\nLine: " + err.line : "")
            );
        } finally {
            app.endUndoGroup();
            setPanelButtonsEnabled(ui, true);
        }
    }

    if (
        !(thisObj instanceof Panel) &&
        typeof $.global.__CaruselBuilderRVPanelV82 !== "undefined" &&
        $.global.__CaruselBuilderRVPanelV82
    ) {
        try {
            $.global.__CaruselBuilderRVPanelV82.close();
        } catch (oldPanelError) {
            $.global.__CaruselBuilderRVPanelV82 = null;
        }
        $.global.__CaruselBuilderRVPanelV82 = null;
    }

    var ui = makePanel(thisObj);
    ui.createButton.onClick = function () {
        createFromPanel(ui);
    };
    ui.updateButton.onClick = function () {
        runPanelCommand(
            ui,
            "Updating active carousel...",
            "Update Active Carousel",
            function () {
                return selectedModule(ui).updateActiveRig();
            }
        );
    };
    ui.resetButton.onClick = function () {
        runPanelCommand(
            ui,
            "Resetting active carousel...",
            "Reset Active Carousel",
            function () {
                return selectedModule(ui).resetActiveRig();
            }
        );
    };
    ui.addCardsButton.onClick = function () {
        var answer = prompt("How many cards should be added?", "1");
        if (answer === null) return;
        var addCount = parseInt(answer, 10);
        if (isNaN(addCount) || addCount < 1) {
            alert("Enter a positive number of cards.");
            return;
        }
        runPanelCommand(
            ui,
            "Adding cards...",
            "Add Cards",
            function () {
                return selectedModule(ui).addCardsToActiveRig(addCount);
            }
        );
    };
    ui.replaceMediaButton.onClick = function () {
        var folder = Folder.selectDialog(
            "Select a folder with replacement photos or videos."
        );
        if (!folder) return;
        runPanelCommand(
            ui,
            "Replacing media...",
            "Replace Media",
            function () {
                return selectedModule(ui).replaceMediaActiveRig(folder);
            }
        );
    };
    ui.cleanCheckButton.onClick = function () {
        runPanelCommand(
            ui,
            "Checking active carousel...",
            "Clean/Check Project",
            function () {
                return selectedModule(ui).cleanCheckProject();
            }
        );
    };
    ui.deleteButton.onClick = function () {
        runPanelCommand(
            ui,
            "Deleting active carousel...",
            "Delete Active Carousel",
            function () {
                return selectedModule(ui).deleteActiveRig(true);
            }
        );
    };
    ui.win.onResizing = ui.win.onResize = function () {
        this.layout.resize();
    };
    ui.win.layout.layout(true);

    if (ui.win instanceof Window) {
        $.global.__CaruselBuilderRVPanelV82 = ui.win;
        ui.win.onClose = function () {
            $.global.__CaruselBuilderRVPanelV82 = null;
        };
        ui.win.center();
        ui.win.show();
    } else {
        ui.win.layout.resize();
    }
})(this);
