#target aftereffects
#targetengine "CaruselBuilderRVTextV83"

/*
    carusel_builder_RV Text v8.4
    ExtendScript for Adobe After Effects 2022+

    Goals:
    - one isolated rig per run
    - text blocks only, with no image or matte layers
    - independent text orbit/radius controls on text_control
    - safe radius uses the visible text block width
    - clear build diagnostics instead of silent failures
*/

(function CaruselBuilderRVTextV83(thisObj) {
    var VERSION = "Text 8.4";
    var FILM_SIZE_MM = 36;
    var BASE_FOCAL_LENGTH_MM = 35;
    var MAX_TEXT_BLOCKS = 40;
    var CAMERA_PRESETS = [15, 20, 24, 28, 35, 50, 80, 100, 135, 200];

    var MOVE_CTRL = "main_control";
    var CARD_CTRL = "text_control";
    var LEGACY_CARD_CTRL = "card_control";
    var CAMERA_NAME = "TC_CAMERA";
    var RIG_NAME = "TC_RIG";
    var SLIDE_ID = "TC Text ID";
    var LEGACY_SLIDE_ID = "KR Slide ID";
    var DEPTH_AMOUNT = "TC Depth Amount";

    var FX_AUTO_RADIUS = "Auto Radius";
    var FX_SLIDE_COUNT = "Slide Count";
    var FX_RADIUS = "Radius";
    var FX_RADIUS_OFFSET = "Radius Offset";
    var FX_ORBIT = "Orbit Rotation";
    var FX_AXIS = "Carousel Axis";
    var FX_TILT_X = "Tilt X";
    var FX_TILT_Y = "Tilt Y";
    var FX_TILT_Z = "Tilt Z";
    var FX_GLOBAL_SCALE = "Global Scale (%)";
    var FX_FAR_SCALE = "Far Scale (%)";
    var FX_FAR_OPACITY = "Far Opacity (%)";
    var FX_POLYGON = "Polygon Orientation";
    var FX_SCALE_RADIUS = "Scale Text With Radius";
    var FX_DEPTH_TILT_AXIS = "Depth Tilt Axis";
    var FX_DEPTH_CURVE = "Depth Tilt Curve";
    var FX_DEPTH_TILT_ANGLE = "Depth Tilt Angle";
    var FX_DEPTH_TILT_DIRECTION = "Depth Tilt Direction";
    var FX_TEXT_ORBIT = "Text Orbit Offset";
    var FX_TEXT_ROT_X = "Text Rotation X";
    var FX_TEXT_ROT_Y = "Text Rotation Y";
    var FX_TEXT_ROT_Z = "Text Rotation Z";
    var FX_TEXT_LOCAL_X = "Local Text Rotation X";
    var FX_TEXT_LOCAL_Y = "Local Text Rotation Y";
    var FX_TEXT_LOCAL_Z = "Local Text Rotation Z";

    var FX_CARD_ORIENTATION = "Block Orientation";
    var FX_CARD_W = "Block Width (px)";
    var FX_CARD_H = "Block Height (px)";
    var FX_CARD_RADIUS = "Block Radius (px)";
    var FX_CARD_FILL = "Block Fill";
    var FX_CARD_FILL_OPACITY = "Block Fill Opacity (%)";
    var FX_STROKE = "Stroke";
    var FX_STROKE_W = "Stroke Width";
    var FX_TEXT_FILL = "Text Fill";
    var FX_TEXT_SIZE = "Text Size";
    var FX_TEXT_X = "Text X";
    var FX_TEXT_Y = "Text Y";
    var FX_TEXT_SYNC_ORBIT = "Sync Main Orbit";
    var FX_TEXT_ORBIT_CONTROL = "Text Orbit Rotation";
    var FX_TEXT_AUTO_RADIUS = "Use Main Radius";
    var FX_TEXT_RADIUS = "Text Radius Override";
    var FX_TEXT_RADIUS_OFFSET = "Text Radius Offset";
    var LEGACY_FX_TEXT_AUTO_RADIUS = "Text Auto Radius";
    var LEGACY_FX_TEXT_RADIUS = "Text Radius";

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
        countRow.add("statictext", undefined, "Text blocks:");
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
        cardRow.add("statictext", undefined, "Text block comp:");
        var cardW = cardRow.add("edittext", undefined, "800");
        cardW.characters = 7;
        cardRow.add("statictext", undefined, "x");
        var cardH = cardRow.add("edittext", undefined, "200");
        cardH.characters = 7;

        var polygon = setup.add("checkbox", undefined, "Start with polygon orientation");
        polygon.value = false;

        var scaleWithRadius = setup.add(
            "checkbox",
            undefined,
            "Scale text blocks when radius changes"
        );
        scaleWithRadius.value = false;

        var note = setup.add(
            "statictext",
            undefined,
            "Creates the requested number of text blocks. Slide Count reveals and redistributes them.",
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
        lensPreset.selection = lensPreset.items[4];

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
        var aperture = apertureRow.add("edittext", undefined, "6.25");
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
                : 4;
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
            "Create Text Carousel"
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

        var status = w.add("statictext", undefined, "Ready");
        status.alignment = ["fill", "top"];

        return {
            win: w,
            count: count,
            orientation: orientation,
            duration: duration,
            cardW: cardW,
            cardH: cardH,
            polygon: polygon,
            scaleWithRadius: scaleWithRadius,
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
            status: status
        };
    }

    function nextInstanceNumber(proj) {
        var maxId = 0;
        var mainRe = /^TC_MAIN_(\d+)$/;
        var rootRe = /^TEXT_CAROUSEL_(\d+)$/;
        for (var i = 1; i <= proj.numItems; i++) {
            var item = proj.item(i);
            var match = mainRe.exec(item.name) || rootRe.exec(item.name);
            if (match) maxId = Math.max(maxId, parseInt(match[1], 10) || 0);
        }
        return maxId + 1;
    }

    function addFolder(proj, name, parent) {
        var folder = proj.items.addFolder(name);
        if (parent) folder.parentFolder = parent;
        return folder;
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

    function addMovementController(
        comp,
        initialCount,
        initialRadius,
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
        addSlider(fx, FX_RADIUS, Math.round(initialRadius));
        addSlider(fx, FX_RADIUS_OFFSET, 0);
        addAngle(fx, FX_ORBIT, 180);
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
        addSlider(fx, FX_FAR_OPACITY, 75);
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
        addAngle(fx, FX_TEXT_ORBIT, 0);
        addAngle(fx, FX_TEXT_ROT_X, 0);
        addAngle(fx, FX_TEXT_ROT_Y, 0);
        addAngle(fx, FX_TEXT_ROT_Z, 0);

        return ctrl;
    }

    function addTextController(comp, cardWidth, cardHeight) {
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
        addSlider(fx, FX_CARD_FILL_OPACITY, 100);
        addColor(fx, FX_STROKE, [0.25, 0.25, 0.27]);
        addSlider(fx, FX_STROKE_W, 6);
        addColor(fx, FX_TEXT_FILL, [1, 1, 1]);
        addSlider(fx, FX_TEXT_SIZE, 140);
        addSlider(fx, FX_TEXT_X, 0);
        addSlider(fx, FX_TEXT_Y, 0);
        addCheckbox(fx, FX_TEXT_SYNC_ORBIT, true);
        addAngle(fx, FX_TEXT_ORBIT_CONTROL, 180);
        addCheckbox(fx, FX_TEXT_AUTO_RADIUS, true);
        addSlider(fx, FX_TEXT_RADIUS, Math.max(cardWidth, cardHeight) * 1.5);
        addSlider(fx, FX_TEXT_RADIUS_OFFSET, 0);

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
        issues
    ) {
        var compName = instanceTag + "_TEXT_" + pad2(index);
        var comp = proj.items.addComp(compName, width, height, 1, duration, fps);
        comp.parentFolder = folder;

        var ctrlRef = 'comp("' + mainName + '").layer("' + CARD_CTRL + '")';
        var cardMetrics = cardMetricsExpression(
            "c",
            "thisComp.width",
            "thisComp.height",
            "  "
        );

        var background = comp.layers.addShape();
        background.name = "TEXT_BLOCK_BG";
        var backgroundGroup = background.property("ADBE Root Vectors Group")
            .addProperty("ADBE Vector Group");
        backgroundGroup.name = "TEXT_BLOCK_BG";
        var backgroundContents = backgroundGroup.property(
            "ADBE Vectors Group"
        );
        var backgroundRect = backgroundContents.addProperty(
            "ADBE Vector Shape - Rect"
        );

        assignExpression(
            backgroundRect.property("ADBE Vector Rect Size"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            cardMetrics +
            '  [cw,ch];\n' +
            '}catch(e){[thisComp.width,thisComp.height]};',
            compName + " block size",
            issues
        );

        assignExpression(
            backgroundRect.property("ADBE Vector Rect Roundness"),
            'try{Math.max(0,' + ctrlRef + '.effect("' + FX_CARD_RADIUS + '")("Slider"))}' +
            'catch(e){60};',
            compName + " block radius",
            issues
        );

        var backgroundFill = backgroundContents.addProperty(
            "ADBE Vector Graphic - Fill"
        );
        assignExpression(
            backgroundFill.property("ADBE Vector Fill Color"),
            'try{' + ctrlRef + '.effect("' + FX_CARD_FILL + '")("Color")}' +
            'catch(e){[0.12,0.12,0.13]};',
            compName + " block fill",
            issues
        );
        assignExpression(
            backgroundFill.property("ADBE Vector Fill Opacity"),
            'try{Math.max(0,Math.min(100,' + ctrlRef + '.effect("' +
            FX_CARD_FILL_OPACITY + '")("Slider")))}catch(e){100};',
            compName + " block fill opacity",
            issues
        );

        background.property("ADBE Transform Group").property("ADBE Position")
            .setValue([width * 0.5, height * 0.5]);

        var border = comp.layers.addShape();
        border.name = "TEXT_BLOCK_BORDER";
        var borderGroup = border.property("ADBE Root Vectors Group")
            .addProperty("ADBE Vector Group");
        borderGroup.name = "TEXT_BLOCK_BORDER";
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
            .setValue([width * 0.5, height * 0.5]);

        var label = comp.layers.addText("TEXT " + pad2(index));
        label.name = "TEXT_EDIT_" + pad2(index);

        assignExpression(
            label.property("ADBE Transform Group")
                .property("ADBE Anchor Point"),
            'r=sourceRectAtTime(time,false);\n' +
            '[r.left+r.width/2,r.top+r.height/2];',
            compName + " text anchor",
            issues
        );

        assignExpression(
            label.property("ADBE Transform Group").property("ADBE Position"),
            'try{\n' +
            '  c=' + ctrlRef + ';\n' +
            '  [thisComp.width/2+c.effect("' + FX_TEXT_X + '")("Slider"),' +
            'thisComp.height/2+c.effect("' + FX_TEXT_Y + '")("Slider")];\n' +
            '}catch(e){[thisComp.width/2,thisComp.height/2]};',
            compName + " text position",
            issues
        );

        var textProp = label.property("ADBE Text Properties")
            .property("ADBE Text Document");
        var baseFontSize = Math.round(height * 0.065);
        var textDocument = textProp.value;
        textDocument.applyFill = true;
        textDocument.fontSize = baseFontSize;
        try {
            textDocument.justification =
                ParagraphJustification.CENTER_JUSTIFY;
        } catch (justifyError) {}
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
            compName + " text fill",
            issues
        );

        assignExpression(
            label.property("ADBE Transform Group").property("ADBE Scale"),
            'try{\n' +
            '  s=Math.max(1,' + ctrlRef + '.effect("' + FX_TEXT_SIZE + '")("Slider"));\n' +
            '  k=s/' + baseFontSize + ';\n' +
            '  [100*k,100*k];\n' +
            '}catch(e){value};',
            compName + " text size",
            issues
        );

        return comp;
    }

    function makeDepthAmountExpression(count) {
        return 'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'maxN=' + count + ';\n' +
            'layoutN=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'activeLimit=Math.ceil(layoutN);\n' +
            'amount=0;\n' +
            'axisChoice=Math.round(c.effect("' + FX_DEPTH_TILT_AXIS +
            '")(1));\n' +
            'if(axisChoice>1 && layoutN>1){\n' +
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

    function makeTextRotationExpression(
        count,
        targetAxis,
        textRotationName,
        localRotationName
    ) {
        return 'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'tc=thisComp.layer("' + CARD_CTRL + '");\n' +
            'maxN=' + count + ';\n' +
            'layoutN=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'sid=Math.max(1,Math.round(effect("' + SLIDE_ID + '")("Slider")));\n' +
            'sync=tc.effect("' + FX_TEXT_SYNC_ORBIT + '")("Checkbox")>0;\n' +
            'orbit=sync?c.effect("' + FX_ORBIT + '")("Angle"):' +
            'tc.effect("' + FX_TEXT_ORBIT_CONTROL + '")("Angle");\n' +
            'orbit+=c.effect("' + FX_TEXT_ORBIT + '")("Angle");\n' +
            'a=(layoutN<=1)?0:((sid-1)*(360/layoutN)+orbit);\n' +
            'axis=Math.round(c.effect("' + FX_AXIS + '")(1));\n' +
            'polyOn=c.effect("' + FX_POLYGON + '")("Checkbox")>0;\n' +
            'result=c.effect("' + textRotationName + '")("Angle")+' +
            'effect("' + localRotationName + '")("Angle");\n' +
            'if(polyOn && layoutN>1){\n' +
            '  wanted=(axis==1)?1:((axis==2)?2:3);\n' +
            '  face=(axis==1)?a-180:a;\n' +
            '  if(wanted==' + targetAxis + '){result+=face;}\n' +
            '}\n' +
            'depthAxisChoice=Math.round(c.effect("' +
            FX_DEPTH_TILT_AXIS + '")(1));\n' +
            'wantedDepth=(depthAxisChoice==2)?3:' +
            '((depthAxisChoice==3)?1:' +
            '((depthAxisChoice==4)?2:0));\n' +
            'if(wantedDepth==' + targetAxis + ' && layoutN>1){\n' +
            '  maxVisualAngle=c.effect("' + FX_DEPTH_TILT_ANGLE +
            '")("Angle");\n' +
            '  directionMode=Math.round(c.effect("' +
            FX_DEPTH_TILT_DIRECTION + '")(1));\n' +
            '  depthSign=1;\n' +
            '  if(directionMode==2){\n' +
            '    lateral=(axis==3)?position[1]:position[0];\n' +
            '    depthSign=(lateral<0)?-1:1;\n' +
            '  }else if(directionMode==3){\n' +
            '    depthSign=-1;\n' +
            '  }\n' +
            '  result+=maxVisualAngle*effect("' + DEPTH_AMOUNT +
            '")("Slider")*depthSign;\n' +
            '}\n' +
            'result;';
    }

    function makeTextPositionExpression(count, slideCardMetrics) {
        return 'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'maxN=' + count + ';\n' +
            'layoutN=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'sid=Math.max(1,Math.round(effect("' + SLIDE_ID + '")("Slider")));\n' +
            'cardCtrl=thisComp.layer("' + CARD_CTRL + '");\n' +
            'mainAutoR=c.effect("' + FX_AUTO_RADIUS + '")("Checkbox")>0;\n' +
            'mainManualR=Math.max(0,c.effect("' + FX_RADIUS +
            '")("Slider"));\n' +
            'mainOffset=c.effect("' + FX_RADIUS_OFFSET + '")("Slider");\n' +
            'textAutoR=cardCtrl.effect("' + FX_TEXT_AUTO_RADIUS +
            '")("Checkbox")>0;\n' +
            'textManualR=Math.max(0,cardCtrl.effect("' + FX_TEXT_RADIUS +
            '")("Slider"));\n' +
            'textOffset=cardCtrl.effect("' + FX_TEXT_RADIUS_OFFSET +
            '")("Slider");\n' +
            slideCardMetrics +
            'visibleW=Math.max(1,cw);\n' +
            'safeR=(layoutN<=1)?0:(visibleW/2)/Math.sin(Math.PI/layoutN);\n' +
            'baseR=mainAutoR?Math.max(0,safeR+mainOffset):mainManualR;\n' +
            'r=textAutoR?Math.max(0,baseR+textOffset):textManualR;\n' +
            'sync=cardCtrl.effect("' + FX_TEXT_SYNC_ORBIT +
            '")("Checkbox")>0;\n' +
            'orbit=sync?c.effect("' + FX_ORBIT + '")("Angle"):' +
            'cardCtrl.effect("' + FX_TEXT_ORBIT_CONTROL + '")("Angle");\n' +
            'orbit+=c.effect("' + FX_TEXT_ORBIT + '")("Angle");\n' +
            'a=(layoutN<=1)?0:((sid-1)*(360/layoutN)+orbit);\n' +
            't=degreesToRadians(a);\n' +
            's=Math.sin(t)*r;\n' +
            'q=Math.cos(t)*r;\n' +
            'axis=Math.round(c.effect("' + FX_AXIS + '")(1));\n' +
            'if(layoutN<=1){[0,0,0]}' +
            'else if(axis==2){[s,q,0]}' +
            'else if(axis==3){[0,s,q]}' +
            'else{[s,0,q]};';
    }

    function makeTextScaleExpression(count, indentedSlideCardMetrics) {
        return 'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'maxN=' + count + ';\n' +
            'activeN=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'layoutN=activeN;\n' +
            'sid=Math.max(1,Math.round(effect("' + SLIDE_ID + '")("Slider")));\n' +
            'cardCtrl=thisComp.layer("' + CARD_CTRL + '");\n' +
            'reveal=Math.max(0,Math.min(1,activeN-sid+1));\n' +
            'reveal=reveal*reveal*(3-2*reveal);\n' +
            'farK=Math.max(0,c.effect("' + FX_FAR_SCALE + '")("Slider"))/100;\n' +
            'sync=cardCtrl.effect("' + FX_TEXT_SYNC_ORBIT +
            '")("Checkbox")>0;\n' +
            'orbit=sync?c.effect("' + FX_ORBIT + '")("Angle"):' +
            'cardCtrl.effect("' + FX_TEXT_ORBIT_CONTROL + '")("Angle");\n' +
            'orbit+=c.effect("' + FX_TEXT_ORBIT + '")("Angle");\n' +
            'a=(layoutN<=1)?0:((sid-1)*(360/layoutN)+orbit);\n' +
            'axis=Math.round(c.effect("' + FX_AXIS + '")(1));\n' +
            'depth=(Math.cos(degreesToRadians(a))+1)/2;\n' +
            'k=(layoutN<=1 || axis==2)?1:linear(depth,0,1,1,farK);\n' +
            'fit=1;\n' +
            'poly=c.effect("' + FX_POLYGON + '")("Checkbox")>0;\n' +
            'scaleR=c.effect("' + FX_SCALE_RADIUS + '")("Checkbox")>0;\n' +
            'if(poly && scaleR && layoutN>2){\n' +
            '  mainAutoR=c.effect("' + FX_AUTO_RADIUS +
            '")("Checkbox")>0;\n' +
            '  mainManualR=Math.max(0,c.effect("' + FX_RADIUS +
            '")("Slider"));\n' +
            '  mainOffset=c.effect("' + FX_RADIUS_OFFSET + '")("Slider");\n' +
            '  textAutoR=cardCtrl.effect("' + FX_TEXT_AUTO_RADIUS +
            '")("Checkbox")>0;\n' +
            '  textManualR=Math.max(0,cardCtrl.effect("' + FX_TEXT_RADIUS +
            '")("Slider"));\n' +
            '  textOffset=cardCtrl.effect("' + FX_TEXT_RADIUS_OFFSET +
            '")("Slider");\n' +
            indentedSlideCardMetrics +
            '  visibleW=Math.max(1,cw);\n' +
            '  safeR=(visibleW/2)/Math.sin(Math.PI/layoutN);\n' +
            '  baseR=mainAutoR?Math.max(0,safeR+mainOffset):mainManualR;\n' +
            '  r=textAutoR?Math.max(0,baseR+textOffset):textManualR;\n' +
            '  side=2*r*Math.tan(Math.PI/layoutN);\n' +
            '  fit=side/visibleW;\n' +
            '}\n' +
            'appear=linear(reveal,0,1,85,100)/100;\n' +
            '[100*k*fit*appear,100*k*fit*appear,100*k*fit*appear];';
    }

    function makeTextOpacityExpression(count) {
        return 'c=thisComp.layer("' + MOVE_CTRL + '");\n' +
            'maxN=' + count + ';\n' +
            'activeN=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            'layoutN=activeN;\n' +
            'sid=Math.max(1,Math.round(effect("' + SLIDE_ID + '")("Slider")));\n' +
            'cardCtrl=thisComp.layer("' + CARD_CTRL + '");\n' +
            'reveal=Math.max(0,Math.min(1,activeN-sid+1));\n' +
            'reveal=reveal*reveal*(3-2*reveal);\n' +
            'farOpacity=Math.max(0,Math.min(100,c.effect("' +
            FX_FAR_OPACITY + '")("Slider")))/100;\n' +
            'sync=cardCtrl.effect("' + FX_TEXT_SYNC_ORBIT +
            '")("Checkbox")>0;\n' +
            'orbit=sync?c.effect("' + FX_ORBIT + '")("Angle"):' +
            'cardCtrl.effect("' + FX_TEXT_ORBIT_CONTROL + '")("Angle");\n' +
            'orbit+=c.effect("' + FX_TEXT_ORBIT + '")("Angle");\n' +
            'a=(layoutN<=1)?0:((sid-1)*(360/layoutN)+orbit);\n' +
            'axis=Math.round(c.effect("' + FX_AXIS + '")(1));\n' +
            'depth=(Math.cos(degreesToRadians(a))+1)/2;\n' +
            'depthOpacity=(layoutN<=1 || axis==2)?1:' +
            'linear(depth,0,1,1,farOpacity);\n' +
            'reveal*100*depthOpacity;';
    }

    function enableCarouselMotionBlur(comp, issues) {
        try {
            var samples = comp.motionBlurSamplesPerFrame;
            if (typeof samples !== "number" || isNaN(samples)) samples = 16;
            var adaptiveLimit = comp.motionBlurAdaptiveSampleLimit;
            if (
                typeof adaptiveLimit !== "number" ||
                isNaN(adaptiveLimit)
            ) {
                adaptiveLimit = 128;
            }
            comp.motionBlur = true;
            comp.motionBlurSamplesPerFrame = Math.max(
                samples,
                16
            );
            comp.motionBlurAdaptiveSampleLimit = Math.max(
                adaptiveLimit,
                128
            );
        } catch (motionBlurError) {
            if (issues) {
                issues.push(
                    comp.name + " motion blur: " +
                    motionBlurError.toString()
                );
            }
        }
    }

    function enableLayerMotionBlur(layer) {
        try {
            layer.motionBlur = true;
        } catch (motionBlurError) {
        }
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

        var positionExpression = makeTextPositionExpression(
            count,
            slideCardMetrics
        );
        var scaleExpression = makeTextScaleExpression(
            count,
            indentedSlideCardMetrics
        );
        var opacityExpression = makeTextOpacityExpression(count);

        for (var i = 0; i < placeholders.length; i++) {
            var sourceComp = placeholders[i];
            var slide = main.layers.add(sourceComp);
            slide.name = sourceComp.name;
            slide.threeDLayer = true;
            enableLayerMotionBlur(slide);
            slide.parent = rig;

            slide.property("ADBE Transform Group").property("ADBE Anchor Point")
                .setValue([cardWidth * 0.5, cardHeight * 0.5, 0]);
            slide.property("ADBE Transform Group").property("ADBE Position")
                .setValue([0, 0, 0]);

            addSlider(
                slide.property("ADBE Effect Parade"),
                SLIDE_ID,
                i + 1
            );
            addSlider(
                slide.property("ADBE Effect Parade"),
                DEPTH_AMOUNT,
                0
            );
            addAngle(
                slide.property("ADBE Effect Parade"),
                FX_TEXT_LOCAL_X,
                0
            );
            addAngle(
                slide.property("ADBE Effect Parade"),
                FX_TEXT_LOCAL_Y,
                0
            );
            addAngle(
                slide.property("ADBE Effect Parade"),
                FX_TEXT_LOCAL_Z,
                0
            );
            var depthAmount = findEffect(slide, [DEPTH_AMOUNT]);

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
                makeTextRotationExpression(
                    count,
                    3,
                    FX_TEXT_ROT_X,
                    FX_TEXT_LOCAL_X
                ),
                sourceComp.name + " X rotation",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group").property("ADBE Rotate Y"),
                makeTextRotationExpression(
                    count,
                    1,
                    FX_TEXT_ROT_Y,
                    FX_TEXT_LOCAL_Y
                ),
                sourceComp.name + " Y rotation",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group").property("ADBE Rotate Z"),
                makeTextRotationExpression(
                    count,
                    2,
                    FX_TEXT_ROT_Z,
                    FX_TEXT_LOCAL_Z
                ),
                sourceComp.name + " Z rotation",
                issues
            );
        }

        return rig;
    }

    function getActiveRigComp() {
        var item = app.project ? app.project.activeItem : null;
        if (!(item instanceof CompItem)) return null;
        if (!/^(TC|CR|KR)_MAIN_\d+$/.test(item.name)) return null;
        return item;
    }

    function collectRigSlides(main) {
        var slides = [];
        for (var i = 1; i <= main.numLayers; i++) {
            var layer = main.layer(i);
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
                "Activate a TC_MAIN composition first."
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
            !main.layer("CR_CAMERA") &&
            !main.layer("KR_CAMERA")) {
            issues.push(main.name + ": camera not found");
        }
        if (!main.layer(RIG_NAME) &&
            !main.layer("CR_RIG") &&
            !main.layer("KR_RIG")) {
            issues.push(main.name + ": rig null not found");
        }

        var slides = collectRigSlides(main);
        if (slides.length === 0) {
            issues.push(main.name + ": no carousel slides found");
        }

        collectExpressionIssues(main, issues);
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

    function textSourceFromSlides(slides) {
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
        var maxCount = slides && slides.length > 0
            ? slides.length
            : MAX_TEXT_BLOCKS;
        return clamp(
            Math.round(getSliderValue(moveCtrl, FX_SLIDE_COUNT, fallback)),
            1,
            maxCount
        );
    }

    function visibleTextBlockWidth(textCtrl, slides) {
        var source = textSourceFromSlides(slides);
        var baseW = getSliderValue(
            textCtrl,
            FX_CARD_W,
            source ? source.width : 800
        );
        var baseH = getSliderValue(
            textCtrl,
            FX_CARD_H,
            source ? source.height : 200
        );
        var mode = getMenuValue(textCtrl, FX_CARD_ORIENTATION, 1);
        return Math.max(1, mode === 2 ? baseH : baseW);
    }

    function safeRadiusForActiveCount(moveCtrl, textCtrl, slides) {
        var count = activeSlideCount(moveCtrl, slides);
        if (count <= 1) return 0;
        return (visibleTextBlockWidth(textCtrl, slides) / 2) /
            Math.sin(Math.PI / count);
    }

    function ensureMovementControllerEffects(moveCtrl, textCtrl, slides) {
        if (!moveCtrl) return;

        removeEffects(moveCtrl, [
            "Rig Version",
            "Depth Text Tilt",
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
        ensureSliderEffect(
            moveCtrl,
            FX_RADIUS,
            Math.round(safeRadiusForActiveCount(moveCtrl, textCtrl, slides))
        );
        ensureSliderEffect(moveCtrl, FX_RADIUS_OFFSET, 0);
        ensureAngleEffect(moveCtrl, FX_ORBIT, 180);
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
        ensureSliderEffect(moveCtrl, FX_FAR_OPACITY, 75);
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
        ensureAngleEffect(moveCtrl, FX_TEXT_ORBIT, 0);
        ensureAngleEffect(moveCtrl, FX_TEXT_ROT_X, 0);
        ensureAngleEffect(moveCtrl, FX_TEXT_ROT_Y, 0);
        ensureAngleEffect(moveCtrl, FX_TEXT_ROT_Z, 0);
    }

    function ensureTextControllerEffects(textCtrl, slides) {
        if (!textCtrl) return;
        var source = textSourceFromSlides(slides);
        ensureDropdownEffect(
            textCtrl,
            FX_CARD_ORIENTATION,
            ["Horizontal", "Vertical"],
            1
        );
        ensureSliderEffect(
            textCtrl,
            FX_CARD_W,
            source ? source.width : 800,
            ["Card Width (%)"]
        );
        ensureSliderEffect(
            textCtrl,
            FX_CARD_H,
            source ? source.height : 200,
            ["Card Height (%)"]
        );
        ensureSliderEffect(textCtrl, FX_CARD_RADIUS, 60);
        ensureColorEffect(textCtrl, FX_CARD_FILL, [0.12, 0.12, 0.13]);
        ensureSliderEffect(textCtrl, FX_CARD_FILL_OPACITY, 100);
        ensureColorEffect(textCtrl, FX_STROKE, [0.25, 0.25, 0.27]);
        ensureSliderEffect(textCtrl, FX_STROKE_W, 6);
        ensureColorEffect(textCtrl, FX_TEXT_FILL, [1, 1, 1]);
        ensureSliderEffect(textCtrl, FX_TEXT_SIZE, 140);
        ensureSliderEffect(textCtrl, FX_TEXT_X, 0);
        ensureSliderEffect(textCtrl, FX_TEXT_Y, 0);
        ensureCheckboxEffect(textCtrl, FX_TEXT_SYNC_ORBIT, true);
        ensureAngleEffect(textCtrl, FX_TEXT_ORBIT_CONTROL, 180);
        ensureCheckboxEffect(
            textCtrl,
            FX_TEXT_AUTO_RADIUS,
            true,
            [LEGACY_FX_TEXT_AUTO_RADIUS]
        );
        ensureSliderEffect(
            textCtrl,
            FX_TEXT_RADIUS,
            Math.round(safeRadiusForActiveCount(null, textCtrl, slides)),
            [LEGACY_FX_TEXT_RADIUS]
        );
        ensureSliderEffect(textCtrl, FX_TEXT_RADIUS_OFFSET, 0);
    }

    function ensureControllerEffects(moveCtrl, textCtrl, slides) {
        ensureTextControllerEffects(textCtrl, slides);
        ensureMovementControllerEffects(moveCtrl, textCtrl, slides);
    }

    function resetMovementController(moveCtrl, textCtrl, slides, issues) {
        var count = activeSlideCount(moveCtrl, slides);
        var radius = Math.round(safeRadiusForActiveCount(
            moveCtrl,
            textCtrl,
            slides
        ));
        setEffectValue(moveCtrl, FX_AUTO_RADIUS, "Checkbox", 1, issues);
        setEffectValue(moveCtrl, FX_SLIDE_COUNT, "Slider", count, issues);
        setEffectValue(moveCtrl, FX_RADIUS, "Slider", radius, issues);
        setEffectValue(moveCtrl, FX_RADIUS_OFFSET, "Slider", 0, issues);
        setEffectValue(moveCtrl, FX_ORBIT, "Angle", 180, issues);
        setMenuValue(moveCtrl, FX_AXIS, 1, issues);
        setEffectValue(moveCtrl, FX_TILT_X, "Angle", 0, issues);
        setEffectValue(moveCtrl, FX_TILT_Y, "Angle", 0, issues);
        setEffectValue(moveCtrl, FX_TILT_Z, "Angle", 0, issues);
        setEffectValue(moveCtrl, FX_GLOBAL_SCALE, "Slider", 100, issues);
        setEffectValue(moveCtrl, FX_FAR_SCALE, "Slider", 70, issues);
        setEffectValue(moveCtrl, FX_FAR_OPACITY, "Slider", 75, issues);
        setEffectValue(moveCtrl, FX_POLYGON, "Checkbox", 0, issues);
        setEffectValue(moveCtrl, FX_SCALE_RADIUS, "Checkbox", 0, issues);
        setMenuValue(moveCtrl, FX_DEPTH_TILT_AXIS, 1, issues);
        setEffectValue(moveCtrl, FX_DEPTH_TILT_ANGLE, "Angle", 25, issues);
        setMenuValue(moveCtrl, FX_DEPTH_TILT_DIRECTION, 2, issues);
        setMenuValue(moveCtrl, FX_DEPTH_CURVE, 2, issues);
        setEffectValue(moveCtrl, FX_TEXT_ORBIT, "Angle", 0, issues);
        setEffectValue(moveCtrl, FX_TEXT_ROT_X, "Angle", 0, issues);
        setEffectValue(moveCtrl, FX_TEXT_ROT_Y, "Angle", 0, issues);
        setEffectValue(moveCtrl, FX_TEXT_ROT_Z, "Angle", 0, issues);
    }

    function resetTextController(textCtrl, moveCtrl, slides, issues) {
        var radius = Math.round(safeRadiusForActiveCount(
            moveCtrl,
            textCtrl,
            slides
        ));
        setEffectValue(textCtrl, FX_CARD_RADIUS, "Slider", 60, issues);
        setEffectValue(
            textCtrl,
            FX_CARD_FILL,
            "Color",
            [0.12, 0.12, 0.13],
            issues
        );
        setEffectValue(textCtrl, FX_CARD_FILL_OPACITY, "Slider", 100, issues);
        setEffectValue(
            textCtrl,
            FX_STROKE,
            "Color",
            [0.25, 0.25, 0.27],
            issues
        );
        setEffectValue(textCtrl, FX_STROKE_W, "Slider", 6, issues);
        setEffectValue(
            textCtrl,
            FX_TEXT_FILL,
            "Color",
            [1, 1, 1],
            issues
        );
        setEffectValue(textCtrl, FX_TEXT_SIZE, "Slider", 140, issues);
        setEffectValue(textCtrl, FX_TEXT_X, "Slider", 0, issues);
        setEffectValue(textCtrl, FX_TEXT_Y, "Slider", 0, issues);
        setEffectValue(textCtrl, FX_TEXT_SYNC_ORBIT, "Checkbox", 1, issues);
        setEffectValue(textCtrl, FX_TEXT_ORBIT_CONTROL, "Angle", 180, issues);
        setEffectValue(textCtrl, FX_TEXT_AUTO_RADIUS, "Checkbox", 1, issues);
        setEffectValue(textCtrl, FX_TEXT_RADIUS, "Slider", radius, issues);
        setEffectValue(textCtrl, FX_TEXT_RADIUS_OFFSET, "Slider", 0, issues);
    }

    function resetCamera(main, issues) {
        var camera = main.layer(CAMERA_NAME) ||
            main.layer("CR_CAMERA") ||
            main.layer("KR_CAMERA");
        if (!camera) {
            issues.push(main.name + ": camera not found");
            return;
        }

        var cameraOptions = camera.property("ADBE Camera Options Group");
        setCameraOption(
            cameraOptions,
            "ADBE Camera Zoom",
            main.width * BASE_FOCAL_LENGTH_MM / FILM_SIZE_MM,
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
            BASE_FOCAL_LENGTH_MM / 5.6,
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
                "Activate a TC_MAIN composition first."
            );
            return {
                mainName: "",
                cardCount: 0,
                issues: issues
            };
        }

        var oldMainName = main.name;
        var idMatch = /^(?:TC|CR|KR)_MAIN_(\d+)$/.exec(oldMainName);
        var id = idMatch ? idMatch[1] : "01";
        var newMainName = "TC_MAIN_" + id;
        var slides = collectRigSlides(main);
        var cardCtrl = main.layer(CARD_CTRL) ||
            main.layer(LEGACY_CARD_CTRL);
        var moveCtrl = main.layer(MOVE_CTRL);
        var camera = main.layer(CAMERA_NAME) ||
            main.layer("CR_CAMERA") ||
            main.layer("KR_CAMERA");
        var rig = main.layer(RIG_NAME) ||
            main.layer("CR_RIG") ||
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
        if (root && /^(KARRIG_CYLINDER_|CARRIG_CYLINDER_)/.test(root.name)) {
            root.name = root.name.replace(
                /^(KARRIG_CYLINDER_|CARRIG_CYLINDER_)/,
                "TEXT_CAROUSEL_"
            );
        }

        migrateCardSizeControls(cardCtrl, slides);
        ensureControllerEffects(moveCtrl, cardCtrl, slides);
        enableCarouselMotionBlur(main, issues);

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
        var positionExpression = makeTextPositionExpression(
            slides.length,
            slideCardMetrics
        );
        var scaleExpression = makeTextScaleExpression(
            slides.length,
            indentedSlideCardMetrics
        );
        var opacityExpression = makeTextOpacityExpression(slides.length);

        var replacements = [
            [oldMainName, newMainName],
            [LEGACY_CARD_CTRL, CARD_CTRL],
            ["CR_CAMERA", CAMERA_NAME],
            ["KR_CAMERA", CAMERA_NAME],
            ["CR_RIG", RIG_NAME],
            ["KR_RIG", RIG_NAME],
            [LEGACY_SLIDE_ID, SLIDE_ID]
        ];

        for (var i = 0; i < slides.length; i++) {
            var slideInfo = slides[i];
            var slide = slideInfo.layer;
            var source = slide.source;
            slideInfo.idEffect.name = SLIDE_ID;

            if (/^(KR|CR)\d+_PH_/.test(source.name)) {
                source.name = source.name
                    .replace(/^(KR|CR)/, "TC")
                    .replace("_PH_", "_TEXT_");
            } else if (/^(KR|CR)\d+_TEXT_/.test(source.name)) {
                source.name = source.name.replace(/^(KR|CR)/, "TC");
            }
            slide.name = source.name;
            enableLayerMotionBlur(slide);

            migrateCompExpressions(source, replacements, issues);

            ensureAngleEffect(slide, FX_TEXT_LOCAL_X, 0);
            ensureAngleEffect(slide, FX_TEXT_LOCAL_Y, 0);
            ensureAngleEffect(slide, FX_TEXT_LOCAL_Z, 0);

            var depthEffect = ensureSliderEffect(
                slide,
                DEPTH_AMOUNT,
                0
            );
            assignExpression(
                depthEffect.property(1),
                makeDepthAmountExpression(slides.length),
                slide.name + " depth amount",
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
                makeTextRotationExpression(
                    slides.length,
                    3,
                    FX_TEXT_ROT_X,
                    FX_TEXT_LOCAL_X
                ),
                slide.name + " X rotation",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Rotate Y"),
                makeTextRotationExpression(
                    slides.length,
                    1,
                    FX_TEXT_ROT_Y,
                    FX_TEXT_LOCAL_Y
                ),
                slide.name + " Y rotation",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Rotate Z"),
                makeTextRotationExpression(
                    slides.length,
                    2,
                    FX_TEXT_ROT_Z,
                    FX_TEXT_LOCAL_Z
                ),
                slide.name + " Z rotation",
                issues
            );
        }

        migrateCompExpressions(main, replacements, issues);
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
        var textCtrl = main.layer(CARD_CTRL) ||
            main.layer(LEGACY_CARD_CTRL);
        var moveCtrl = main.layer(MOVE_CTRL);
        if (!textCtrl || !moveCtrl || slides.length === 0) {
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

        ensureControllerEffects(moveCtrl, textCtrl, slides);
        resetMovementController(moveCtrl, textCtrl, slides, issues);
        resetTextController(textCtrl, moveCtrl, slides, issues);
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

    function build(options) {
        var proj = ensureProject();
        var issues = [];
        var cameraSettings = options.camera || {
            focalLength: 35,
            depthOfField: false,
            focusCenter: true,
            focusDistance: 2500,
            fStop: 5.6,
            aperture: 6.25,
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
        var instanceTag = "TC" + id;
        var mainName = "TC_MAIN_" + id;
        var rootName = "TEXT_CAROUSEL_" + id;

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
        var placeholdersFolder = addFolder(proj, "TEXT_BLOCKS", root);

        var main = proj.items.addComp(
            mainName,
            width,
            height,
            1,
            options.duration,
            fps
        );
        main.parentFolder = compsFolder;
        enableCarouselMotionBlur(main, issues);

        var background = main.layers.addSolid(
            [0.04, 0.04, 0.045],
            "BG_MAIN",
            width,
            height,
            1,
            options.duration
        );
        background.moveToEnd();

        var moveCtrl = addMovementController(
            main,
            options.count,
            safeRadius,
            options.polygon,
            options.scaleWithRadius
        );
        var cardCtrl = addTextController(
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
                issues
            ));
        }

        addRigAndSlides(
            main,
            placeholders,
            options.cardW,
            options.cardH,
            issues
        );

        cardCtrl.moveToBeginning();
        moveCtrl.moveToBeginning();
        main.hideShyLayers = true;
        main.openInViewer();

        return {
            mainName: mainName,
            rootName: rootName,
            cardCount: options.count,
            reserveCount: placeholders.length,
            issues: issues
        };
    }

    function showWarnings(issues) {
        if (!issues || issues.length === 0) return;

        var maxShown = Math.min(12, issues.length);
        var message = "Text Carousel warnings (" + issues.length + "):";
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
        count = clamp(count, 1, MAX_TEXT_BLOCKS);
        ui.count.text = String(count);

        var duration = parseFloat(ui.duration.text);
        if (isNaN(duration)) duration = 15;
        duration = clamp(duration, 1, 600);
        ui.duration.text = String(duration);

        var cardW = parseInt(ui.cardW.text, 10);
        if (isNaN(cardW)) cardW = 800;
        cardW = clamp(cardW, 100, 10000);
        ui.cardW.text = String(cardW);

        var cardH = parseInt(ui.cardH.text, 10);
        if (isNaN(cardH)) cardH = 200;
        cardH = clamp(cardH, 100, 10000);
        ui.cardH.text = String(cardH);

        var lensIndex = ui.lensPreset.selection
            ? ui.lensPreset.selection.index
            : 4;
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

        ui.createButton.enabled = false;
        if (ui.updateButton) ui.updateButton.enabled = false;
        if (ui.resetButton) ui.resetButton.enabled = false;
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
                camera: {
                    focalLength: focalLength,
                    depthOfField: ui.depthOfField.value,
                    focusCenter: ui.focusCenter.value,
                    focusDistance: focusDistance,
                    fStop: fStop,
                    aperture: aperture,
                    blurLevel: blurLevel
                }
            });

            ui.status.text = result.mainName;
            showWarnings(result.issues);
        } catch (err) {
            ui.status.text = "Error";
            alert(
                "Text Carousel v" + VERSION + " failed:\n" +
                err.toString() +
                (err.line ? "\nLine: " + err.line : "") +
                "\n\nUse Undo to remove a partial build."
            );
        } finally {
            app.endUndoGroup();
            ui.createButton.enabled = true;
            if (ui.updateButton) ui.updateButton.enabled = true;
            if (ui.resetButton) ui.resetButton.enabled = true;
        }
    }

    function setPanelButtonsEnabled(ui, enabled) {
        ui.createButton.enabled = enabled;
        ui.updateButton.enabled = enabled;
        ui.resetButton.enabled = enabled;
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

    if (
        !(thisObj instanceof Panel) &&
        typeof $.global.__CaruselBuilderRVTextPanelV83 !== "undefined" &&
        $.global.__CaruselBuilderRVTextPanelV83
    ) {
        try {
            $.global.__CaruselBuilderRVTextPanelV83.close();
        } catch (oldPanelError) {
            $.global.__CaruselBuilderRVTextPanelV83 = null;
        }
        $.global.__CaruselBuilderRVTextPanelV83 = null;
    }

    var ui = makePanel(thisObj);
    ui.createButton.onClick = function () {
        createFromPanel(ui);
    };
    ui.updateButton.onClick = function () {
        runActiveRigPanelCommand(
            ui,
            "Updating active text carousel...",
            "Update Active Text Carousel",
            updateActiveRig
        );
    };
    ui.resetButton.onClick = function () {
        runActiveRigPanelCommand(
            ui,
            "Resetting active text carousel...",
            "Reset Active Text Carousel",
            resetActiveRig
        );
    };
    ui.win.onResizing = ui.win.onResize = function () {
        this.layout.resize();
    };
    ui.win.layout.layout(true);

    if (ui.win instanceof Window) {
        $.global.__CaruselBuilderRVTextPanelV83 = ui.win;
        ui.win.onClose = function () {
            $.global.__CaruselBuilderRVTextPanelV83 = null;
        };
        ui.win.center();
        ui.win.show();
    } else {
        ui.win.layout.resize();
    }
})(this);
