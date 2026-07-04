#target aftereffects
#targetengine "CanonC70HUDBuilderRVV1"

/*
    canon_c70_HUD_builder_RV v1
    Adobe After Effects 2022+

    Procedural Canon C70-style camera HUD overlay.
    The script builds a lightweight editable 3840 x 2160 composition using
    native text layers and Bezier shape paths for maximum AE 22+ compatibility.
*/

(function CanonC70HUDBuilderRVV1() {
    var COMP_W = 3840;
    var COMP_H = 2160;
    var COMP_DURATION = 10;
    var FPS = 30;
    var COMP_BASE = "CANON_C70_HUD_MAIN";
    var CTRL_NAME = "HUD_CONTROL";

    var FONT_CANDIDATES = [
        "ArialMT",
        "Arial",
        "Helvetica",
        "HelveticaNeue",
        "Consolas",
        "Courier New"
    ];

    var FX_HUD_SCALE = "HUD Scale (%)";
    var FX_GLOBAL_OPACITY = "HUD Opacity (%)";
    var FX_GUIDE_OPACITY = "Guide Opacity (%)";
    var FX_WHITE_COLOR = "White Color";
    var FX_DIM_COLOR = "Dim Color";
    var FX_CYAN_COLOR = "Cyan Color";
    var FX_GREEN_COLOR = "Green Color";
    var FX_YELLOW_COLOR = "Yellow Color";
    var FX_RED_COLOR = "Red Color";

    var COLOR_WHITE = [0.88, 0.92, 0.94];
    var COLOR_DIM = [0.45, 0.50, 0.52];
    var COLOR_CYAN = [0.00, 0.86, 1.00];
    var COLOR_GREEN = [0.18, 0.95, 0.22];
    var COLOR_YELLOW = [0.98, 0.85, 0.16];
    var COLOR_RED = [1.00, 0.08, 0.05];
    var COLOR_BLACK = [0, 0, 0];

    var LINE_W = 4;
    var THIN_W = 2;

    function uniqueCompName(base) {
        var n = 1;
        var name;
        var exists = true;
        while (exists) {
            name = base + "_" + ("0" + n).slice(-2);
            exists = false;
            for (var i = 1; i <= app.project.numItems; i++) {
                if (app.project.item(i).name === name) {
                    exists = true;
                    break;
                }
            }
            n++;
        }
        return name;
    }

    function colorsMatch(a, b) {
        if (!a || !b) return false;
        return Math.abs(a[0] - b[0]) < 0.001 &&
            Math.abs(a[1] - b[1]) < 0.001 &&
            Math.abs(a[2] - b[2]) < 0.001;
    }

    function colorControlName(color) {
        if (colorsMatch(color, COLOR_WHITE)) return FX_WHITE_COLOR;
        if (colorsMatch(color, COLOR_DIM)) return FX_DIM_COLOR;
        if (colorsMatch(color, COLOR_CYAN)) return FX_CYAN_COLOR;
        if (colorsMatch(color, COLOR_GREEN)) return FX_GREEN_COLOR;
        if (colorsMatch(color, COLOR_YELLOW)) return FX_YELLOW_COLOR;
        if (colorsMatch(color, COLOR_RED)) return FX_RED_COLOR;
        return null;
    }

    function q(s) {
        return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    }

    function controlExpr(effectName, propName) {
        return 'thisComp.layer(' + q(CTRL_NAME) + ').effect(' + q(effectName) + ')(' + q(propName) + ')';
    }

    function colorExpr(effectName) {
        return controlExpr(effectName, "Color") + ";";
    }

    function globalOpacityExpr() {
        return controlExpr(FX_GLOBAL_OPACITY, "Slider") + ";";
    }

    function guideOpacityExpr() {
        return controlExpr(FX_GUIDE_OPACITY, "Slider") + ";";
    }

    function scalePositionExpr() {
        return [
            'var s = ' + controlExpr(FX_HUD_SCALE, "Slider") + ' / 100;',
            'var cx = thisComp.width * 0.5;',
            'var cy = thisComp.height * 0.5;',
            'if (value.length > 2) {',
            '  [(value[0] - cx) * s + cx, (value[1] - cy) * s + cy, value[2]];',
            '} else {',
            '  [(value[0] - cx) * s + cx, (value[1] - cy) * s + cy];',
            '}'
        ].join("\n");
    }

    function scaleScaleExpr() {
        return [
            'var s = ' + controlExpr(FX_HUD_SCALE, "Slider") + ' / 100;',
            'if (value.length > 2) {',
            '  [value[0] * s, value[1] * s, value[2] * s];',
            '} else {',
            '  [value[0] * s, value[1] * s];',
            '}'
        ].join("\n");
    }

    function setExpression(prop, expr) {
        try {
            prop.expression = expr;
        } catch (ignored) {
        }
    }

    function registerHudLayer(layer) {
        var tr = layer.property("ADBE Transform Group");
        setExpression(tr.property("ADBE Position"), scalePositionExpr());
        setExpression(tr.property("ADBE Scale"), scaleScaleExpr());
        setExpression(tr.property("ADBE Opacity"), globalOpacityExpr());
    }

    function addSlider(fx, name, value) {
        var item = fx.addProperty("ADBE Slider Control");
        item.name = name;
        item.property(1).setValue(value);
        return item;
    }

    function addColor(fx, name, value) {
        var item = fx.addProperty("ADBE Color Control");
        item.name = name;
        item.property(1).setValue(value);
        return item;
    }

    function addHUDController(comp, guideOpacity) {
        var layer = comp.layers.addNull();
        layer.name = CTRL_NAME;
        layer.label = 11;
        var tr = layer.property("ADBE Transform Group");
        tr.property("ADBE Position").setValue([120, 120]);
        tr.property("ADBE Opacity").setValue(0);

        var fx = layer.property("ADBE Effect Parade");
        addSlider(fx, FX_HUD_SCALE, 100);
        addSlider(fx, FX_GLOBAL_OPACITY, 100);
        addSlider(fx, FX_GUIDE_OPACITY, guideOpacity);
        addColor(fx, FX_WHITE_COLOR, COLOR_WHITE);
        addColor(fx, FX_DIM_COLOR, COLOR_DIM);
        addColor(fx, FX_CYAN_COLOR, COLOR_CYAN);
        addColor(fx, FX_GREEN_COLOR, COLOR_GREEN);
        addColor(fx, FX_YELLOW_COLOR, COLOR_YELLOW);
        addColor(fx, FX_RED_COLOR, COLOR_RED);
        try {
            layer.moveToBeginning();
        } catch (ignored) {
        }
        return layer;
    }

    function makeShapeLayer(comp, name) {
        var layer = comp.layers.addShape();
        layer.name = name;
        layer.label = 10;
        var tr = layer.property("ADBE Transform Group");
        tr.property("ADBE Position").setValue([0, 0]);
        tr.property("ADBE Anchor Point").setValue([0, 0]);
        registerHudLayer(layer);
        return layer;
    }

    function rootContents(layer) {
        return layer.property("ADBE Root Vectors Group");
    }

    function addGroup(layer, name) {
        var group = rootContents(layer).addProperty("ADBE Vector Group");
        group.name = name;
        return group.property("ADBE Vectors Group");
    }

    function addStroke(contents, color, width, opacity) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue(color);
        var colorControl = colorControlName(color);
        if (colorControl) setExpression(stroke.property("ADBE Vector Stroke Color"), colorExpr(colorControl));
        stroke.property("ADBE Vector Stroke Width").setValue(width);
        stroke.property("ADBE Vector Stroke Opacity").setValue(opacity === undefined ? 100 : opacity);
        try {
            stroke.property("ADBE Vector Stroke Line Cap").setValue(1);
            stroke.property("ADBE Vector Stroke Line Join").setValue(1);
        } catch (ignored) {
        }
        return stroke;
    }

    function addFill(contents, color, opacity) {
        var fill = contents.addProperty("ADBE Vector Graphic - Fill");
        fill.property("ADBE Vector Fill Color").setValue(color);
        var colorControl = colorControlName(color);
        if (colorControl) setExpression(fill.property("ADBE Vector Fill Color"), colorExpr(colorControl));
        fill.property("ADBE Vector Fill Opacity").setValue(opacity === undefined ? 100 : opacity);
        return fill;
    }

    function addPathToContents(contents, vertices, inTangents, outTangents, closed) {
        var pathGroup = contents.addProperty("ADBE Vector Shape - Group");
        var path = pathGroup.property("ADBE Vector Shape");
        var shape = new Shape();
        shape.vertices = vertices;
        shape.inTangents = inTangents;
        shape.outTangents = outTangents;
        shape.closed = closed;
        path.setValue(shape);
        return pathGroup;
    }

    function addLineToContents(contents, x1, y1, x2, y2) {
        return addPathToContents(
            contents,
            [[x1, y1], [x2, y2]],
            [[0, 0], [0, 0]],
            [[0, 0], [0, 0]],
            false
        );
    }

    function addPolylineToContents(contents, points, closed) {
        var tangents = [];
        for (var i = 0; i < points.length; i++) {
            tangents.push([0, 0]);
        }
        return addPathToContents(contents, points, tangents, tangents, closed);
    }

    function addRectToContents(contents, x, y, w, h, roundness) {
        var r = Math.max(0, Math.min(roundness || 0, Math.min(w, h) * 0.5));
        if (r <= 0) {
            return addPolylineToContents(
                contents,
                [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
                true
            );
        }

        var k = 0.5522847498;
        return addPathToContents(
            contents,
            [
                [x + r, y],
                [x + w - r, y],
                [x + w, y + r],
                [x + w, y + h - r],
                [x + w - r, y + h],
                [x + r, y + h],
                [x, y + h - r],
                [x, y + r]
            ],
            [
                [0, 0], [0, 0], [0, -r * k], [0, 0],
                [r * k, 0], [0, 0], [0, r * k], [0, 0]
            ],
            [
                [0, 0], [r * k, 0], [0, 0], [0, r * k],
                [0, 0], [-r * k, 0], [0, 0], [0, -r * k]
            ],
            true
        );
    }

    function addEllipseToContents(contents, x, y, w, h) {
        var cx = x + w * 0.5;
        var cy = y + h * 0.5;
        var rx = w * 0.5;
        var ry = h * 0.5;
        var k = 0.5522847498;
        return addPathToContents(
            contents,
            [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]],
            [[-rx * k, 0], [0, -ry * k], [rx * k, 0], [0, ry * k]],
            [[rx * k, 0], [0, ry * k], [-rx * k, 0], [0, -ry * k]],
            true
        );
    }

    function firstColorProperty(group) {
        for (var i = 1; i <= group.numProperties; i++) {
            var prop = group.property(i);
            try {
                if (prop.propertyValueType === PropertyValueType.COLOR) return prop;
            } catch (ignored) {
            }
        }
        return null;
    }

    function applyFont(doc, bold) {
        for (var i = 0; i < FONT_CANDIDATES.length; i++) {
            try {
                doc.font = FONT_CANDIDATES[i];
                return;
            } catch (ignored) {
            }
        }
    }

    function applyTextColorControl(layer, color) {
        var colorControl = colorControlName(color);
        if (!colorControl) return;
        try {
            var fill = layer.property("ADBE Effect Parade").addProperty("ADBE Fill");
            fill.name = "HUD Text Color";
            var colorProp = firstColorProperty(fill);
            if (colorProp) {
                colorProp.setValue(color);
                setExpression(colorProp, colorExpr(colorControl));
            }
        } catch (ignored) {
        }
    }

    function addText(comp, name, text, x, y, size, color, align, tracking, bold) {
        var layer = comp.layers.addText(text);
        layer.name = name;
        layer.label = 2;
        var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
        var doc = textProp.value;
        doc.text = text;
        doc.fontSize = size;
        doc.fillColor = color;
        doc.applyFill = true;
        doc.applyStroke = false;
        doc.justification = align || ParagraphJustification.LEFT_JUSTIFY;
        try {
            doc.tracking = tracking === undefined ? 18 : tracking;
        } catch (ignoredTracking) {
        }
        applyFont(doc, bold);
        textProp.setValue(doc);
        layer.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        applyTextColorControl(layer, color);
        registerHudLayer(layer);
        return layer;
    }

    function addReferenceGuide(comp, file, opacity) {
        if (!file) return null;
        var importOptions = new ImportOptions(file);
        var footage = app.project.importFile(importOptions);
        var layer = comp.layers.add(footage);
        layer.name = "REFERENCE_GUIDE";
        var scale = Math.min(comp.width / footage.width, comp.height / footage.height) * 100;
        var tr = layer.property("ADBE Transform Group");
        tr.property("ADBE Position").setValue([comp.width * 0.5, comp.height * 0.5]);
        tr.property("ADBE Scale").setValue([scale, scale]);
        tr.property("ADBE Opacity").setValue(opacity);
        setExpression(tr.property("ADBE Opacity"), guideOpacityExpr());
        try {
            layer.moveToEnd();
            layer.guideLayer = true;
        } catch (ignored) {
        }
        return layer;
    }

    function drawPanel(comp, name, x, y, w, h, cut, strokeColor, opacity) {
        var layer = makeShapeLayer(comp, name);
        var c = addGroup(layer, "panel");
        var points = [
            [x + cut, y], [x + w - cut, y], [x + w, y + cut],
            [x + w, y + h - cut], [x + w - cut, y + h],
            [x + cut, y + h], [x, y + h - cut], [x, y + cut]
        ];
        addPolylineToContents(c, points, true);
        addStroke(c, strokeColor || COLOR_WHITE, LINE_W, opacity === undefined ? 100 : opacity);
        return layer;
    }

    function drawIconDrone(comp) {
        drawPanel(comp, "HUD_drone_icon_box", 52, 55, 170, 180, 16, COLOR_WHITE, 95);
        var layer = makeShapeLayer(comp, "HUD_drone_icon");
        var c = addGroup(layer, "drone");
        addLineToContents(c, 93, 106, 175, 188);
        addLineToContents(c, 175, 106, 93, 188);
        addLineToContents(c, 134, 147, 134, 147);
        addEllipseToContents(c, 80, 86, 34, 34);
        addEllipseToContents(c, 156, 86, 34, 34);
        addEllipseToContents(c, 80, 174, 34, 34);
        addEllipseToContents(c, 156, 174, 34, 34);
        addEllipseToContents(c, 121, 134, 26, 26);
        addStroke(c, COLOR_WHITE, 5, 100);
    }

    function drawTopMission(comp) {
        drawIconDrone(comp);
        drawPanel(comp, "HUD_mission_panel", 265, 55, 650, 210, 36, COLOR_WHITE, 92);
        addText(comp, "HUD_mission_label", "MISSION:", 310, 125, 40, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 10);
        addText(comp, "HUD_mission_value", "SURVEY_GRID_04", 500, 125, 42, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_mode_label", "MODE:", 310, 210, 40, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 10);
        addText(comp, "HUD_mode_value", "MAPPING", 500, 210, 42, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 8);
    }

    function drawProgressBar(comp, x, y) {
        var layer = makeShapeLayer(comp, "HUD_progress_bar");
        var green = addGroup(layer, "progress_on");
        var bw = 22;
        var gap = 5;
        for (var i = 0; i < 8; i++) {
            addRectToContents(green, x + i * (bw + gap), y, bw, 22, 0);
        }
        addFill(green, COLOR_GREEN, 100);

        var off = addGroup(layer, "progress_off");
        for (var j = 8; j < 12; j++) {
            addRectToContents(off, x + j * (bw + gap), y, bw, 22, 0);
        }
        addStroke(off, COLOR_DIM, THIN_W, 90);

        var tick = addGroup(layer, "progress_ticks");
        for (var k = 0; k <= 12; k++) {
            addLineToContents(tick, x + k * (bw + gap), y + 30, x + k * (bw + gap), y + 42);
        }
        addStroke(tick, COLOR_DIM, 2, 70);

        var pointer = addGroup(layer, "progress_pointer");
        addPolylineToContents(pointer, [[x + 8 * (bw + gap), y + 48], [x + 8 * (bw + gap) - 12, y + 65], [x + 8 * (bw + gap) + 12, y + 65]], true);
        addFill(pointer, COLOR_WHITE, 100);
    }

    function drawTopTelemetry(comp) {
        drawPanel(comp, "HUD_top_telemetry_shell", 900, 55, 2200, 260, 55, COLOR_WHITE, 88);

        var div = makeShapeLayer(comp, "HUD_top_telemetry_dividers");
        var c = addGroup(div, "dividers");
        var xs = [1605, 2070, 2430, 2775];
        for (var i = 0; i < xs.length; i++) {
            addLineToContents(c, xs[i], 80, xs[i], 285);
        }
        addStroke(c, COLOR_DIM, 3, 75);

        addText(comp, "HUD_progress_title", "MISSION PROGRESS", 1030, 105, 34, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 10);
        addText(comp, "HUD_progress_num", "62%", 1030, 205, 72, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);
        drawProgressBar(comp, 1210, 165);
        addText(comp, "HUD_waypoints", "312 / 500 WAYPOINTS", 1030, 280, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);

        addText(comp, "HUD_overlap_title", "OVERLAP", 1768, 105, 34, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 10);
        addText(comp, "HUD_overlap_front_label", "FRONT", 1690, 155, 24, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 5);
        addText(comp, "HUD_overlap_front", "80%", 1675, 235, 55, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_overlap_side_label", "SIDE", 1925, 155, 24, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 5);
        addText(comp, "HUD_overlap_side", "70%", 1900, 235, 55, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);

        addText(comp, "HUD_alt_title", "ALTITUDE", 2180, 110, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_alt_value", "120.0", 2140, 215, 70, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_alt_m", "m", 2332, 212, 32, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_alt_msl", "ALT MSL: 512.0 m", 2135, 280, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);

        addText(comp, "HUD_speed_title", "GROUND SPEED", 2490, 110, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_speed_value", "10.2", 2500, 215, 70, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_speed_unit", "m/s", 2655, 212, 32, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_speed_kmh", "36.7 km/h", 2535, 280, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);

        addText(comp, "HUD_heading_title", "HEADING", 2872, 110, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_heading_value", "045", 2860, 215, 70, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_heading_degree", "o", 3020, 180, 34, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_heading_ne", "NE", 2905, 282, 38, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);
    }

    function drawSatAndBattery(comp) {
        drawPanel(comp, "HUD_sat_panel", 3150, 55, 335, 260, 22, COLOR_WHITE, 92);
        addText(comp, "HUD_sat_title", "SAT", 3335, 102, 31, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 6);
        addText(comp, "HUD_sat_num", "25", 3335, 195, 75, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_sat_fix", "FIX 3D", 3335, 275, 29, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
        var satIcon = makeShapeLayer(comp, "HUD_sat_icon");
        var s = addGroup(satIcon, "sat_icon");
        addRectToContents(s, 3210, 120, 28, 18, 0);
        addRectToContents(s, 3245, 95, 28, 18, 0);
        addRectToContents(s, 3274, 70, 28, 18, 0);
        addLineToContents(s, 3224, 129, 3290, 80);
        addStroke(s, COLOR_WHITE, 3, 85);

        drawPanel(comp, "HUD_battery_panel", 3528, 55, 265, 300, 18, COLOR_WHITE, 92);
        addText(comp, "HUD_battery_title", "BATTERY", 3660, 100, 31, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 4);
        addText(comp, "HUD_battery_percent", "78%", 3660, 190, 70, COLOR_GREEN, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_battery_volt", "15.4 V", 3660, 250, 30, COLOR_GREEN, ParagraphJustification.CENTER_JUSTIFY, 0);
        var b = makeShapeLayer(comp, "HUD_battery_meter");
        var outline = addGroup(b, "outline");
        addRectToContents(outline, 3575, 285, 165, 46, 0);
        addRectToContents(outline, 3740, 298, 18, 20, 0);
        addStroke(outline, COLOR_WHITE, 3, 90);
        var cells = addGroup(b, "cells");
        for (var i = 0; i < 7; i++) {
            addRectToContents(cells, 3588 + i * 20, 296, 15, 25, 0);
        }
        addFill(cells, COLOR_GREEN, 100);
    }

    function drawLeftSidebar(comp) {
        function sideBox(name, y, label, value) {
            drawPanel(comp, "HUD_left_" + name + "_box", 52, y, 150, 160, 22, COLOR_WHITE, 92);
            addText(comp, "HUD_left_" + name + "_label", label, 127, y + 95, 27, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
            addText(comp, "HUD_left_" + name + "_value", value, 127, y + 143, 35, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        }
        sideBox("wp", 330, "WP", "312");
        sideBox("grid", 600, "GRID", "5.0 ha");
        sideBox("split", 870, "SPLIT", "4");
        sideBox("focus", 1140, "FOCUS", "AF");
        sideBox("rth", 1410, "RTH", "");

        var icons = makeShapeLayer(comp, "HUD_left_sidebar_icons");
        var c = addGroup(icons, "icons");
        addEllipseToContents(c, 112, 360, 34, 42);
        addLineToContents(c, 129, 402, 129, 432);
        addRectToContents(c, 99, 645, 18, 18, 0);
        addRectToContents(c, 125, 645, 18, 18, 0);
        addRectToContents(c, 151, 645, 18, 18, 0);
        addRectToContents(c, 99, 671, 18, 18, 0);
        addRectToContents(c, 125, 671, 18, 18, 0);
        addRectToContents(c, 151, 671, 18, 18, 0);
        addRectToContents(c, 98, 910, 42, 50, 8);
        addRectToContents(c, 120, 900, 42, 50, 8);
        addEllipseToContents(c, 105, 1184, 48, 48);
        addLineToContents(c, 129, 1160, 129, 1256);
        addLineToContents(c, 81, 1208, 177, 1208);
        addEllipseToContents(c, 103, 1452, 48, 48);
        addLineToContents(c, 127, 1476, 154, 1476);
        addStroke(c, COLOR_WHITE, 4, 95);
    }

    function drawRightSidebar(comp) {
        drawPanel(comp, "HUD_right_sidebar_shell", 3610, 415, 178, 1120, 24, COLOR_WHITE, 92);
        var div = makeShapeLayer(comp, "HUD_right_sidebar_dividers");
        var c = addGroup(div, "dividers");
        var ys = [735, 965, 1195, 1418];
        for (var i = 0; i < ys.length; i++) {
            addLineToContents(c, 3612, ys[i], 3788, ys[i]);
        }
        addStroke(c, COLOR_DIM, 3, 80);

        addText(comp, "HUD_camera_label", "CAMERA", 3699, 555, 25, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_camera_iso", "ISO 100", 3699, 610, 25, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_camera_shutter", "1/1000", 3699, 660, 25, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_camera_f", "f/2.8", 3699, 710, 25, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_video_label", "VIDEO", 3699, 865, 25, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_video_value", "4K 30", 3699, 920, 25, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_gimbal_label", "GIMBAL", 3699, 1088, 25, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_gimbal_value", "-15", 3699, 1145, 27, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_gimbal_degree", "o", 3740, 1116, 18, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_ev_label", "EV", 3699, 1310, 25, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_ev_value", "0.0", 3699, 1362, 27, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_more_label", "MORE", 3699, 1510, 25, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);

        var icons = makeShapeLayer(comp, "HUD_right_sidebar_icons");
        var g = addGroup(icons, "icons");
        addRectToContents(g, 3670, 465, 58, 40, 4);
        addEllipseToContents(g, 3686, 474, 25, 25);
        addRectToContents(g, 3676, 790, 48, 35, 2);
        addLineToContents(g, 3724, 800, 3748, 785);
        addEllipseToContents(g, 3672, 1012, 55, 55);
        addEllipseToContents(g, 3686, 1026, 27, 27);
        addEllipseToContents(g, 3683, 1238, 42, 42);
        addLineToContents(g, 3704, 1210, 3704, 1230);
        addLineToContents(g, 3704, 1288, 3704, 1310);
        addLineToContents(g, 3674, 1260, 3654, 1260);
        addLineToContents(g, 3734, 1260, 3754, 1260);
        addStroke(g, COLOR_WHITE, 4, 95);
    }

    function drawViewfinder(comp) {
        var layer = makeShapeLayer(comp, "HUD_viewfinder_frame");
        var c = addGroup(layer, "brackets");
        var x1 = 590;
        var x2 = 3250;
        var y1 = 420;
        var y2 = 1450;
        var len = 220;
        addLineToContents(c, x1, y1, x1 + len, y1);
        addLineToContents(c, x1, y1, x1, y1 + len);
        addLineToContents(c, x2 - len, y1, x2, y1);
        addLineToContents(c, x2, y1, x2, y1 + len);
        addLineToContents(c, x1, y2 - len, x1, y2);
        addLineToContents(c, x1, y2, x1 + len, y2);
        addLineToContents(c, x2, y2 - len, x2, y2);
        addLineToContents(c, x2 - len, y2, x2, y2);
        addStroke(c, COLOR_WHITE, 4, 88);

        var r = addGroup(layer, "reticle");
        addLineToContents(r, 1850, 970, 1990, 970);
        addLineToContents(r, 1920, 890, 1920, 1050);
        addLineToContents(r, 1795, 880, 1830, 880);
        addLineToContents(r, 1795, 880, 1795, 920);
        addLineToContents(r, 2045, 880, 2010, 880);
        addLineToContents(r, 2045, 880, 2045, 920);
        addLineToContents(r, 1795, 1060, 1830, 1060);
        addLineToContents(r, 1795, 1060, 1795, 1020);
        addLineToContents(r, 2045, 1060, 2010, 1060);
        addLineToContents(r, 2045, 1060, 2045, 1020);
        addStroke(r, COLOR_WHITE, 3, 86);

        drawVerticalScale(comp, 445, 600, 610, true);
        drawVerticalScale(comp, 3395, 670, 570, false);
    }

    function drawVerticalScale(comp, x, y, h, left) {
        var layer = makeShapeLayer(comp, left ? "HUD_left_scale" : "HUD_right_scale");
        var c = addGroup(layer, "ticks");
        for (var i = 0; i <= 28; i++) {
            var yy = y + (h / 28) * i;
            var len = (i % 5 === 0) ? 28 : 13;
            if (left) addLineToContents(c, x - len, yy, x, yy);
            else addLineToContents(c, x, yy, x + len, yy);
        }
        if (left) {
            addLineToContents(c, x + 35, y + h * 0.50, x + 55, y + h * 0.47);
            addLineToContents(c, x + 35, y + h * 0.50, x + 55, y + h * 0.53);
        } else {
            addLineToContents(c, x - 35, y + h * 0.44, x - 55, y + h * 0.41);
            addLineToContents(c, x - 35, y + h * 0.44, x - 55, y + h * 0.47);
        }
        addStroke(c, COLOR_WHITE, 3, 88);
    }

    function drawMapPanel(comp) {
        drawPanel(comp, "HUD_map_panel_shell", 52, 1595, 975, 405, 14, COLOR_WHITE, 92);
        var layer = makeShapeLayer(comp, "HUD_map_graphics");

        var map = addGroup(layer, "map_grid");
        addRectToContents(map, 72, 1615, 655, 365, 0);
        for (var i = 0; i < 15; i++) {
            addLineToContents(map, 100 + i * 42, 1620, 60 + i * 50, 1980);
        }
        for (var j = 0; j < 10; j++) {
            addLineToContents(map, 80, 1640 + j * 35, 720, 1615 + j * 40);
        }
        addStroke(map, COLOR_DIM, 2, 35);

        var area = addGroup(layer, "survey_area");
        addPolylineToContents(area, [[135, 1785], [270, 1715], [555, 1660], [650, 1805], [520, 1910], [230, 1900]], true);
        addStroke(area, COLOR_WHITE, 4, 100);

        var current = addGroup(layer, "current_path");
        addPolylineToContents(current, [[145, 1760], [250, 1710], [370, 1690], [500, 1648], [620, 1780], [535, 1860], [245, 1875]], false);
        addStroke(current, COLOR_CYAN, 4, 100);

        var sweep = addGroup(layer, "completed_sweep");
        for (var k = 0; k < 9; k++) {
            addLineToContents(sweep, 150 + k * 45, 1810 - k * 10, 575 + k * 5, 1710 + k * 24);
        }
        addStroke(sweep, COLOR_GREEN, 3, 85);

        var dots = addGroup(layer, "waypoints");
        var pts = [[145, 1760], [250, 1710], [370, 1690], [500, 1648], [620, 1780], [535, 1860], [245, 1875]];
        for (var p = 0; p < pts.length; p++) {
            addEllipseToContents(dots, pts[p][0] - 5, pts[p][1] - 5, 10, 10);
        }
        addFill(dots, COLOR_WHITE, 100);

        addText(comp, "HUD_map_n", "N", 95, 1655, 26, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_map_scale", "100 m", 640, 1948, 29, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_map_legend", "LEGEND", 765, 1642, 22, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_map_waypoint", "WAYPOINT", 815, 1695, 20, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_map_completed", "COMPLETED", 815, 1745, 20, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_map_current", "CURRENT", 815, 1795, 20, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_map_start", "START", 815, 1845, 20, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_map_home", "HOME", 815, 1895, 20, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
    }

    function drawCompass(comp) {
        var layer = makeShapeLayer(comp, "HUD_compass");
        var c = addGroup(layer, "circle_ticks");
        var cx = 1935;
        var cy = 1810;
        var r1 = 145;
        for (var i = 0; i < 72; i++) {
            var a = (Math.PI * 2 * i / 72) - Math.PI / 2;
            var len = (i % 6 === 0) ? 20 : 9;
            addLineToContents(
                c,
                cx + Math.cos(a) * (r1 - len),
                cy + Math.sin(a) * (r1 - len),
                cx + Math.cos(a) * r1,
                cy + Math.sin(a) * r1
            );
        }
        addStroke(c, COLOR_WHITE, 2, 88);

        var pointer = addGroup(layer, "north_pointer");
        addPolylineToContents(pointer, [[cx, cy - r1 - 25], [cx - 13, cy - r1 - 2], [cx + 13, cy - r1 - 2]], true);
        addFill(pointer, COLOR_GREEN, 100);

        addText(comp, "HUD_compass_n", "N", cx, cy - 96, 35, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_compass_e", "E", cx + 100, cy + 10, 35, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_compass_s", "S", cx, cy + 120, 35, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_compass_w", "W", cx - 100, cy + 10, 35, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_compass_heading", "045", cx, cy + 25, 58, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_compass_degree", "o", cx + 78, cy - 18, 25, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_compass_ne", "NE", cx, cy + 78, 32, COLOR_GREEN, ParagraphJustification.CENTER_JUSTIFY, 0);
    }

    function drawBottomCenter(comp) {
        drawPanel(comp, "HUD_dist_next_box", 1320, 1705, 330, 180, 28, COLOR_WHITE, 92);
        addText(comp, "HUD_dist_title", "DIST TO NEXT", 1485, 1765, 27, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_dist_value", "215", 1485, 1838, 55, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_dist_m", "m", 1558, 1835, 25, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        drawPanel(comp, "HUD_eta_box", 2220, 1705, 330, 180, 28, COLOR_WHITE, 92);
        addText(comp, "HUD_eta_title", "ETA NEXT", 2385, 1765, 27, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_eta_value", "00:01:24", 2385, 1838, 43, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);

        var links = makeShapeLayer(comp, "HUD_bottom_center_connectors");
        var c = addGroup(links, "connectors");
        addLineToContents(c, 1650, 1794, 1720, 1794);
        addLineToContents(c, 2150, 1794, 2220, 1794);
        addEllipseToContents(c, 1656, 1786, 16, 16);
        addEllipseToContents(c, 2198, 1786, 16, 16);
        addStroke(c, COLOR_WHITE, 3, 92);
    }

    function drawProgressGrid(comp) {
        drawPanel(comp, "HUD_area_panel", 2795, 1595, 1000, 405, 16, COLOR_WHITE, 92);
        addText(comp, "HUD_time_remaining_label", "TIME REMAINING", 2875, 1645, 25, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_time_remaining", "18:47", 2875, 1718, 55, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_dist_remaining_label", "DIST REMAINING", 2875, 1775, 25, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_dist_remaining", "2.45", 2875, 1848, 55, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_dist_km", "km", 3000, 1845, 24, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_area_remaining_label", "AREA REMAINING", 2875, 1905, 25, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_area_remaining", "1.62", 2875, 1978, 55, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_area_ha", "ha", 3000, 1975, 24, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 0);

        var layer = makeShapeLayer(comp, "HUD_area_grid");
        var on = addGroup(layer, "completed_cells");
        var sx = 3200;
        var sy = 1635;
        var cell = 34;
        var gap = 8;
        for (var row = 0; row < 7; row++) {
            for (var col = 0; col < 12; col++) {
                var index = row * 12 + col;
                if (index < 48) {
                    addRectToContents(on, sx + col * (cell + gap), sy + row * (cell + gap), cell, cell, 0);
                }
            }
        }
        addFill(on, COLOR_GREEN, 42);
        addStroke(on, COLOR_GREEN, 2, 100);

        var off = addGroup(layer, "remaining_cells");
        for (var offRow = 0; offRow < 7; offRow++) {
            for (var offCol = 0; offCol < 12; offCol++) {
                var offIndex = offRow * 12 + offCol;
                if (offIndex >= 48) {
                    addRectToContents(off, sx + offCol * (cell + gap), sy + offRow * (cell + gap), cell, cell, 0);
                }
            }
        }
        addStroke(off, COLOR_DIM, 2, 95);
        addText(comp, "HUD_total_area_label", "TOTAL AREA", 3235, 1972, 22, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_total_area", "4.06 ha", 3555, 1972, 30, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 0);
    }

    function drawFooter(comp) {
        addText(comp, "HUD_footer_log", "LOG: 00456", 52, 2105, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_footer_time", "TIME: 14:32:18", 398, 2105, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_footer_date", "DATE: 2025-05-24", 812, 2105, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_footer_rc", "RC SIGNAL", 2635, 2105, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_footer_link", "LINK", 3010, 2105, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_footer_strong", "STRONG", 3130, 2105, 31, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_footer_storage", "STORAGE", 3395, 2105, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_footer_storage_value", "256 GB", 3600, 2105, 31, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 0);
        var layer = makeShapeLayer(comp, "HUD_footer_signal_bars");
        var c = addGroup(layer, "bars");
        for (var i = 0; i < 5; i++) {
            addRectToContents(c, 2788 + i * 18, 2070 - i * 7, 10, 22 + i * 7, 0);
        }
        addFill(c, COLOR_CYAN, 100);
    }

    function drawInspectionDroneIcon(comp) {
        var layer = makeShapeLayer(comp, "HUD_inspection_drone_icon");
        var c = addGroup(layer, "drone");
        addEllipseToContents(c, 58, 82, 34, 34);
        addEllipseToContents(c, 145, 82, 34, 34);
        addEllipseToContents(c, 58, 154, 34, 34);
        addEllipseToContents(c, 145, 154, 34, 34);
        addEllipseToContents(c, 105, 120, 26, 26);
        addLineToContents(c, 75, 98, 118, 133);
        addLineToContents(c, 162, 98, 118, 133);
        addLineToContents(c, 75, 171, 118, 133);
        addLineToContents(c, 162, 171, 118, 133);
        addStroke(c, COLOR_WHITE, 5, 100);
    }

    function drawInspectionHeader(comp) {
        drawInspectionDroneIcon(comp);
        addText(comp, "HUD_inspection_title", "INSPECTION DRONE", 210, 118, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
        addText(comp, "HUD_inspection_id", "ID: DRN-AX7-22", 210, 178, 34, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 2);

        var div = makeShapeLayer(comp, "HUD_inspection_header_dividers");
        var d = addGroup(div, "dividers");
        addLineToContents(d, 730, 86, 730, 190);
        addLineToContents(d, 3060, 58, 3060, 238);
        addLineToContents(d, 3500, 58, 3500, 238);
        addStroke(d, COLOR_DIM, 3, 78);

        addText(comp, "HUD_flight_mode_label", "FLIGHT MODE", 780, 118, 36, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
        addText(comp, "HUD_flight_mode_value", "MANUAL", 780, 178, 42, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 2);

        drawHeadingTape(comp);

        addText(comp, "HUD_gps_label", "GPS", 2485, 110, 34, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2);
        addText(comp, "HUD_gps_lock", "3D LOCK", 2455, 175, 26, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_rc_label", "RC SIGNAL", 2800, 110, 32, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2);
        addText(comp, "HUD_rc_dbm", "-68 dBm", 2830, 220, 26, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_battery_label", "BATTERY", 3155, 110, 32, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2);
        addText(comp, "HUD_battery_value", "86%", 3182, 185, 62, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_battery_sub", "23.4V  7.2Ah", 3155, 235, 24, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_rec_label", "REC", 3628, 116, 42, COLOR_RED, ParagraphJustification.LEFT_JUSTIFY, 2);
        addText(comp, "HUD_rec_time", "00:07:42", 3570, 195, 44, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);

        var layer = makeShapeLayer(comp, "HUD_header_status_icons");
        var g = addGroup(layer, "icons");
        for (var i = 0; i < 4; i++) {
            addRectToContents(g, 2810 + i * 22, 165 - i * 10, 14, 28 + i * 10, 0);
        }
        addFill(g, COLOR_GREEN, 100);

        var gps = addGroup(layer, "gps_icon");
        addRectToContents(gps, 2590, 96, 22, 22, 3);
        addRectToContents(gps, 2622, 70, 22, 22, 3);
        addRectToContents(gps, 2650, 102, 22, 22, 3);
        addLineToContents(gps, 2600, 106, 2662, 112);
        addStroke(gps, COLOR_GREEN, 5, 100);

        var b = addGroup(layer, "battery_icon");
        addRectToContents(b, 3358, 86, 52, 142, 4);
        addRectToContents(b, 3370, 68, 28, 18, 2);
        addStroke(b, COLOR_GREEN, 5, 100);
        var bf = addGroup(layer, "battery_fill");
        addRectToContents(bf, 3370, 126, 28, 86, 0);
        addFill(bf, COLOR_GREEN, 100);
        var rec = addGroup(layer, "rec_dot");
        addEllipseToContents(rec, 3585, 102, 26, 26);
        addFill(rec, COLOR_RED, 100);
    }

    function drawHeadingTape(comp) {
        var layer = makeShapeLayer(comp, "HUD_heading_tape");
        var c = addGroup(layer, "ticks");
        var y = 126;
        var x0 = 1200;
        var step = 48;
        for (var i = 0; i <= 22; i++) {
            var x = x0 + i * step;
            var len = (i % 5 === 0) ? 58 : (i % 2 === 0 ? 32 : 18);
            addLineToContents(c, x, y - len * 0.5, x, y + len * 0.5);
        }
        addLineToContents(c, 1190, y, 2280, y);
        addStroke(c, COLOR_WHITE, 3, 78);

        var pointer = addGroup(layer, "north_box");
        addRectToContents(pointer, 1708, 148, 82, 58, 0);
        addPolylineToContents(pointer, [[1749, 86], [1734, 62], [1764, 62]], true);
        addStroke(pointer, COLOR_WHITE, 4, 95);
        addFill(pointer, COLOR_WHITE, 18);

        addText(comp, "HUD_heading_300", "300", 1256, 184, 28, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_heading_330", "330", 1495, 184, 28, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_heading_n", "N", 1749, 190, 28, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_heading_30", "30", 1988, 184, 28, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_heading_60", "60", 2220, 184, 28, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
    }

    function drawCollapsiblePanel(comp, name, x, y, w, h, title, arrowUp) {
        drawPanel(comp, "HUD_" + name + "_panel", x, y, w, h, 8, COLOR_WHITE, 85);
        var header = makeShapeLayer(comp, "HUD_" + name + "_header_line");
        var c = addGroup(header, "header");
        addLineToContents(c, x, y + 76, x + w, y + 76);
        addStroke(c, COLOR_DIM, 2, 80);
        addText(comp, "HUD_" + name + "_title", title, x + 35, y + 46, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2);
        var arrow = makeShapeLayer(comp, "HUD_" + name + "_arrow");
        var a = addGroup(arrow, "arrow");
        if (arrowUp) {
            addPolylineToContents(a, [[x + w - 66, y + 44], [x + w - 52, y + 30], [x + w - 38, y + 44]], true);
        } else {
            addPolylineToContents(a, [[x + w - 66, y + 30], [x + w - 52, y + 44], [x + w - 38, y + 30]], true);
        }
        addFill(a, COLOR_WHITE, 100);
    }

    function addMetricRow(comp, prefix, label, value, unit, x, y) {
        addText(comp, prefix + "_label", label, x + 80, y, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, prefix + "_value", value, x + 585, y, 42, COLOR_CYAN, ParagraphJustification.RIGHT_JUSTIFY, 0);
        if (unit) addText(comp, prefix + "_unit", unit, x + 605, y, 23, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
    }

    function drawInspectionLeftPanels(comp) {
        drawCollapsiblePanel(comp, "flight_telemetry", 45, 295, 720, 750, "FLIGHT TELEMETRY", false);
        var rows = [
            ["ALTITUDE", "120.4", "m"],
            ["DIST TO TARGET", "45.7", "m"],
            ["HORIZONTAL SPEED", "12.6", "m/s"],
            ["VERTICAL SPEED", "-1.2", "m/s"],
            ["GROUND SPEED", "12.7", "m/s"],
            ["WIND SPEED", "3.4", "m/s"],
            ["WIND DIRECTION", "128", "o"],
            ["TEMPERATURE", "28.6", "C"]
        ];
        for (var i = 0; i < rows.length; i++) {
            addMetricRow(comp, "HUD_telemetry_" + i, rows[i][0], rows[i][1], rows[i][2], 45, 425 + i * 82);
        }

        var icons = makeShapeLayer(comp, "HUD_telemetry_icons");
        var c = addGroup(icons, "icons");
        for (var j = 0; j < rows.length; j++) {
            addEllipseToContents(c, 100, 395 + j * 82, 32, 32);
            addLineToContents(c, 116, 385 + j * 82, 116, 435 + j * 82);
            addLineToContents(c, 91, 411 + j * 82, 141, 411 + j * 82);
        }
        addStroke(c, COLOR_WHITE, 3, 75);

        drawCollapsiblePanel(comp, "mission_info", 45, 1070, 720, 410, "MISSION INFO", true);
        addText(comp, "HUD_mission_label", "MISSION", 82, 1190, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_mission_value", "TOWER-INSPECT-06", 718, 1190, 31, COLOR_CYAN, ParagraphJustification.RIGHT_JUSTIFY, 0);
        addText(comp, "HUD_wp_label", "WAYPOINT", 82, 1255, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_wp_value", "07 / 12", 718, 1255, 34, COLOR_CYAN, ParagraphJustification.RIGHT_JUSTIFY, 0);
        addText(comp, "HUD_next_label", "NEXT WAYPOINT", 82, 1320, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_next_value", "186 m", 718, 1320, 34, COLOR_CYAN, ParagraphJustification.RIGHT_JUSTIFY, 0);
        addText(comp, "HUD_eta_label", "ETA NEXT WP", 82, 1385, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_eta_value", "00:01:28", 718, 1385, 34, COLOR_CYAN, ParagraphJustification.RIGHT_JUSTIFY, 0);
        addText(comp, "HUD_mission_time_label", "MISSION TIME", 82, 1450, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_mission_time_value", "00:12:36", 718, 1450, 34, COLOR_CYAN, ParagraphJustification.RIGHT_JUSTIFY, 0);

        drawCollapsiblePanel(comp, "system_status", 45, 1510, 720, 535, "SYSTEM STATUS", false);
        var status = ["IMU", "COMPASS", "VISION SYSTEM", "REMOTE ID", "GIMBAL", "PROPULSION"];
        for (var s = 0; s < status.length; s++) {
            addText(comp, "HUD_status_label_" + s, status[s], 82, 1635 + s * 70, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
            addText(comp, "HUD_status_ok_" + s, "OK", 718, 1635 + s * 70, 34, COLOR_GREEN, ParagraphJustification.RIGHT_JUSTIFY, 0);
        }
    }

    function drawInspectionScales(comp) {
        var layer = makeShapeLayer(comp, "HUD_inspection_side_scales");
        var left = addGroup(layer, "alt_scale");
        var x = 1150;
        var y0 = 720;
        var h = 700;
        addLineToContents(left, x, y0, x, y0 + h);
        for (var i = 0; i <= 20; i++) {
            var yy = y0 + i * (h / 20);
            var len = i % 5 === 0 ? 90 : 38;
            addLineToContents(left, x - len, yy, x, yy);
        }
        addStroke(left, COLOR_WHITE, 3, 85);

        var altMarker = addGroup(layer, "alt_marker");
        addPolylineToContents(altMarker, [[930, 1048], [1088, 1048], [1124, 1078], [1088, 1108], [930, 1108]], true);
        addStroke(altMarker, COLOR_CYAN, 4, 100);
        addFill(altMarker, COLOR_CYAN, 12);

        var right = addGroup(layer, "dist_scale");
        var rx = 2510;
        addLineToContents(right, rx, y0, rx, y0 + h);
        for (var j = 0; j <= 20; j++) {
            var ryy = y0 + j * (h / 20);
            var rlen = j % 5 === 0 ? 90 : 38;
            addLineToContents(right, rx, ryy, rx + rlen, ryy);
        }
        addStroke(right, COLOR_WHITE, 3, 85);

        var distMarker = addGroup(layer, "dist_marker");
        addPolylineToContents(distMarker, [[2542, 1048], [2700, 1048], [2700, 1108], [2542, 1108], [2505, 1078]], true);
        addStroke(distMarker, COLOR_YELLOW, 4, 100);
        addFill(distMarker, COLOR_YELLOW, 12);

        addText(comp, "HUD_alt_scale_title", "ALT (m)", 965, 665, 32, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_alt_160", "160", 955, 740, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_alt_140", "140", 955, 915, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_alt_100", "100", 955, 1265, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_alt_80", "80", 955, 1445, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_alt_marker_text", "120.4", 945, 1093, 38, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_agl", "AGL", 1026, 1500, 28, COLOR_CYAN, ParagraphJustification.LEFT_JUSTIFY, 0);

        addText(comp, "HUD_dist_scale_title", "DST (m)", 2555, 665, 32, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_dst_100", "100", 2630, 740, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_dst_75", "75", 2630, 915, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_dst_25", "25", 2630, 1265, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_dst_0", "0", 2630, 1445, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_dist_marker_text", "45.7", 2600, 1093, 38, COLOR_YELLOW, ParagraphJustification.LEFT_JUSTIFY, 0);
    }

    function drawInspectionCenter(comp) {
        var layer = makeShapeLayer(comp, "HUD_inspection_center");
        var c = addGroup(layer, "attitude");
        addPolylineToContents(c, [[1490, 350], [1690, 305], [1920, 300], [2150, 305], [2350, 350]], false);
        addLineToContents(c, 1540, 405, 2150, 405);
        addLineToContents(c, 1580, 465, 1820, 465);
        addLineToContents(c, 2020, 465, 2260, 465);
        addStroke(c, COLOR_WHITE, 3, 75);

        var horizon = addGroup(layer, "horizon");
        addPolylineToContents(horizon, [[1510, 475], [1570, 475], [1575, 460], [1830, 460], [1830, 438], [1855, 438], [1858, 475], [2095, 475], [2100, 485], [2280, 485]], false);
        addStroke(horizon, COLOR_CYAN, 5, 100);

        var yellow = addGroup(layer, "attitude_yellow");
        for (var i = 0; i < 8; i++) {
            addLineToContents(yellow, 1510 + i * 8, 520 + i * 13, 1550 + i * 8, 525 + i * 13);
            addLineToContents(yellow, 2290 - i * 8, 520 + i * 13, 2250 - i * 8, 525 + i * 13);
        }
        addStroke(yellow, COLOR_YELLOW, 3, 100);

        var radar = addGroup(layer, "radar");
        addEllipseToContents(radar, 1510, 760, 820, 820);
        addEllipseToContents(radar, 1572, 822, 696, 696);
        addLineToContents(radar, 1920, 760, 1920, 1580);
        addLineToContents(radar, 1510, 1170, 2330, 1170);
        addLineToContents(radar, 1920, 1170, 1920, 1170);
        addStroke(radar, COLOR_WHITE, 3, 70);

        var cyanCircle = addGroup(layer, "cyan_circle");
        addEllipseToContents(cyanCircle, 1595, 845, 650, 650);
        addStroke(cyanCircle, COLOR_CYAN, 3, 85);

        var target = addGroup(layer, "target_box");
        addRectToContents(target, 1894, 1144, 52, 52, 0);
        addLineToContents(target, 1842, 1170, 1882, 1170);
        addLineToContents(target, 1958, 1170, 1998, 1170);
        addLineToContents(target, 1920, 1095, 1920, 1134);
        addLineToContents(target, 1920, 1206, 1920, 1245);
        addStroke(target, COLOR_GREEN, 4, 100);

        var brackets = addGroup(layer, "target_lock_brackets");
        addLineToContents(brackets, 1718, 1068, 1758, 1068);
        addLineToContents(brackets, 1718, 1068, 1718, 1115);
        addLineToContents(brackets, 2122, 1068, 2082, 1068);
        addLineToContents(brackets, 2122, 1068, 2122, 1115);
        addLineToContents(brackets, 1718, 1272, 1758, 1272);
        addLineToContents(brackets, 1718, 1272, 1718, 1225);
        addLineToContents(brackets, 2122, 1272, 2082, 1272);
        addLineToContents(brackets, 2122, 1272, 2122, 1225);
        addStroke(brackets, COLOR_GREEN, 4, 100);

        addText(comp, "HUD_radar_n", "N", 1920, 705, 34, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_radar_e", "E", 2245, 1180, 34, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_radar_s", "S", 1920, 1565, 34, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_radar_w", "W", 1595, 1180, 34, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_target_lock", "TARGET LOCK", 1920, 1600, 42, COLOR_GREEN, ParagraphJustification.CENTER_JUSTIFY, 0);

        drawInspectionScales(comp);
    }

    function drawSignalExposure(comp) {
        drawPanel(comp, "HUD_signal_panel", 885, 1705, 1720, 400, 10, COLOR_WHITE, 88);
        var header = makeShapeLayer(comp, "HUD_signal_header");
        var h = addGroup(header, "header");
        addLineToContents(h, 885, 1785, 2605, 1785);
        addLineToContents(h, 2275, 1785, 2275, 2105);
        addStroke(h, COLOR_DIM, 3, 80);
        addText(comp, "HUD_signal_title", "SIGNAL / EXPOSURE", 925, 1760, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);

        var grid = makeShapeLayer(comp, "HUD_signal_grid");
        var g = addGroup(grid, "grid");
        for (var i = 0; i <= 8; i++) {
            addLineToContents(g, 1000 + i * 155, 1810, 1000 + i * 155, 2035);
        }
        for (var j = 0; j <= 4; j++) {
            addLineToContents(g, 1000, 2035 - j * 55, 2225, 2035 - j * 55);
        }
        addStroke(g, COLOR_DIM, 2, 45);

        var cyan = addGroup(grid, "cyan_bars");
        for (var b = 0; b < 62; b++) {
            var bh = Math.max(10, Math.sin((b / 62) * Math.PI) * 195 + (b % 5) * 8);
            addRectToContents(cyan, 1000 + b * 17, 2035 - bh, 8, bh, 0);
        }
        addFill(cyan, COLOR_CYAN, 100);

        var green = addGroup(grid, "green_bars");
        for (var gb = 0; gb < 9; gb++) {
            addRectToContents(green, 2058 + gb * 17, 1930 + gb * 6, 8, 105 - gb * 6, 0);
        }
        addFill(green, COLOR_GREEN, 100);

        var yellow = addGroup(grid, "yellow_bars");
        for (var yb = 0; yb < 8; yb++) {
            addRectToContents(yellow, 2215 + yb * 17, 1970 + yb * 5, 8, 65 - yb * 5, 0);
        }
        addFill(yellow, COLOR_YELLOW, 100);

        var red = addGroup(grid, "red_bars");
        for (var rb = 0; rb < 6; rb++) {
            addRectToContents(red, 2355 + rb * 17, 1995 + rb * 4, 8, 40 - rb * 4, 0);
        }
        addFill(red, COLOR_RED, 100);

        addText(comp, "HUD_signal_mean", "MEAN          112", 2315, 1845, 26, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_signal_median", "MEDIAN        108", 2315, 1905, 26, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_signal_peak", "PEAK          91%", 2315, 1965, 26, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_signal_over", "OVEREXP       1.2%", 2315, 2025, 26, COLOR_RED, ParagraphJustification.LEFT_JUSTIFY, 0);
    }

    function drawInspectionRightPanels(comp) {
        drawCollapsiblePanel(comp, "camera_payload", 2835, 295, 935, 645, "CAMERA / PAYLOAD", true);
        var labels = ["PAYLOAD", "RESOLUTION", "FPS", "ISO", "SHUTTER", "WB", "FOCUS MODE", "ZOOM"];
        var values = ["ZOOM CAM", "3840x2160", "30", "100", "1/1000", "5600K", "AUTO", "8.0x"];
        for (var i = 0; i < labels.length; i++) {
            addText(comp, "HUD_payload_label_" + i, labels[i], 2870, 420 + i * 70, 29, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
            addText(comp, "HUD_payload_value_" + i, values[i], 3715, 420 + i * 70, 34, COLOR_CYAN, ParagraphJustification.RIGHT_JUSTIFY, 0);
        }

        drawPanel(comp, "HUD_zoom_panel", 2835, 965, 935, 225, 10, COLOR_WHITE, 88);
        addText(comp, "HUD_zoom_title", "ZOOM", 2870, 1015, 29, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_zoom_minus", "-", 2908, 1090, 45, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_zoom_plus", "+", 3700, 1090, 45, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_zoom_value", "8.0x", 3288, 1160, 48, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
        var z = makeShapeLayer(comp, "HUD_zoom_bars");
        var on = addGroup(z, "zoom_on");
        for (var j = 0; j < 14; j++) addRectToContents(on, 2995 + j * 28, 1056, 18, 40, 0);
        addFill(on, COLOR_CYAN, 100);
        var off = addGroup(z, "zoom_off");
        for (var k = 14; k < 28; k++) addRectToContents(off, 2995 + k * 28, 1056, 18, 40, 0);
        addFill(off, COLOR_DIM, 50);

        drawObstaclePanel(comp);
        drawInspectionQuickTiles(comp);
    }

    function drawObstaclePanel(comp) {
        drawCollapsiblePanel(comp, "obstacle", 2835, 1220, 935, 575, "OBSTACLE AVOIDANCE", false);
        addText(comp, "HUD_obstacle_front", "FRONT", 3190, 1340, 26, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_obstacle_left", "LEFT", 2885, 1665, 26, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_obstacle_right", "RIGHT", 3515, 1665, 26, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_obstacle_status", "STATUS:", 2870, 1760, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_obstacle_active", "ACTIVE", 3015, 1760, 33, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);

        var layer = makeShapeLayer(comp, "HUD_obstacle_radar");
        var arcs = addGroup(layer, "arcs");
        addEllipseToContents(arcs, 2935, 1400, 510, 510);
        addEllipseToContents(arcs, 3010, 1475, 360, 360);
        addEllipseToContents(arcs, 3085, 1550, 210, 210);
        addLineToContents(arcs, 3190, 1400, 3190, 1690);
        addLineToContents(arcs, 2935, 1690, 3445, 1690);
        addStroke(arcs, COLOR_DIM, 3, 65);
        var cyan = addGroup(layer, "cyan_arcs");
        addEllipseToContents(cyan, 2960, 1425, 460, 460);
        addEllipseToContents(cyan, 3045, 1510, 290, 290);
        addStroke(cyan, COLOR_CYAN, 3, 80);
        var dots = addGroup(layer, "dots");
        addEllipseToContents(dots, 2994, 1605, 34, 34);
        addEllipseToContents(dots, 3385, 1390, 34, 34);
        addFill(dots, COLOR_RED, 100);
        var ydots = addGroup(layer, "yellow_dots");
        addEllipseToContents(ydots, 2998, 1435, 34, 34);
        addEllipseToContents(ydots, 3358, 1532, 30, 30);
        addFill(ydots, COLOR_YELLOW, 100);
        var center = addGroup(layer, "center_drone");
        addEllipseToContents(center, 3160, 1640, 60, 60);
        addLineToContents(center, 3190, 1605, 3190, 1695);
        addLineToContents(center, 3150, 1680, 3230, 1680);
        addStroke(center, COLOR_WHITE, 4, 100);

        addText(comp, "HUD_obstacle_1", "2.1 m", 3640, 1408, 29, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_obstacle_2", "4.3 m", 3640, 1472, 29, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_obstacle_3", "5.6 m", 3640, 1538, 29, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_obstacle_4", "9.8 m", 3640, 1604, 29, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        var legend = makeShapeLayer(comp, "HUD_obstacle_legend_dots");
        var l1 = addGroup(legend, "red");
        addEllipseToContents(l1, 3600, 1384, 32, 32);
        addFill(l1, COLOR_RED, 100);
        var l2 = addGroup(legend, "yellow");
        addEllipseToContents(l2, 3600, 1448, 32, 32);
        addEllipseToContents(l2, 3600, 1514, 32, 32);
        addFill(l2, COLOR_YELLOW, 100);
        var l3 = addGroup(legend, "green");
        addEllipseToContents(l3, 3600, 1580, 32, 32);
        addFill(l3, COLOR_GREEN, 100);
    }

    function drawInspectionQuickTiles(comp) {
        var tiles = [
            ["GPS", "12", "SAT", 2705, "green"],
            ["HOME POINT", "", "DIST\\n352 m", 3000, "cyan"],
            ["MAX ALT", "", "ALT\\n152 m", 3275, "cyan"],
            ["MAX DIST", "", "DIST\\n487 m", 3550, "cyan"]
        ];
        for (var i = 0; i < tiles.length; i++) {
            drawPanel(comp, "HUD_quick_tile_" + i, tiles[i][3], 1835, 245, 275, 10, COLOR_WHITE, 80);
            addText(comp, "HUD_tile_title_" + i, tiles[i][0], tiles[i][3] + 122, 1885, 28, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        }
        addText(comp, "HUD_tile_gps_num", "12", 2880, 1975, 54, COLOR_GREEN, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_tile_gps_sat", "SAT", 2880, 2035, 24, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_tile_home", "DIST", 3122, 1985, 24, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_tile_home_v", "352 m", 3122, 2050, 30, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_tile_alt", "ALT", 3400, 1985, 24, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_tile_alt_v", "152 m", 3400, 2050, 30, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_tile_dist", "DIST", 3675, 1985, 24, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_tile_dist_v", "487 m", 3675, 2050, 30, COLOR_CYAN, ParagraphJustification.CENTER_JUSTIFY, 0);
    }

    // Canon C70 layout: clean camera UI, built from editable text and Bezier paths.
    function drawCanonTag(comp, name, text, x, y, w, h, size) {
        var layer = makeShapeLayer(comp, name + "_box");
        var c = addGroup(layer, "tag");
        addRectToContents(c, x, y, w, h, 5);
        addFill(c, COLOR_WHITE, 100);
        addText(comp, name + "_text", text, x + w * 0.5, y + h - 9, size, COLOR_BLACK, ParagraphJustification.CENTER_JUSTIFY, 5, true);
    }

    function drawCanonGreenBox(comp, name, text, x, y, w, h, size) {
        var layer = makeShapeLayer(comp, name + "_box");
        var c = addGroup(layer, "green box");
        addRectToContents(c, x, y, w, h, 4);
        addFill(c, COLOR_GREEN, 100);
        addText(comp, name + "_text", text, x + w * 0.5, y + h - 7, size, COLOR_BLACK, ParagraphJustification.CENTER_JUSTIFY, 0, true);
    }

    function drawCanonBatteryIcon(comp) {
        var layer = makeShapeLayer(comp, "HUD_battery_icon_top");
        var c = addGroup(layer, "battery");
        addRectToContents(c, 92, 75, 96, 38, 5);
        addRectToContents(c, 188, 86, 12, 16, 2);
        addLineToContents(c, 112, 104, 125, 84);
        addLineToContents(c, 132, 104, 145, 84);
        addLineToContents(c, 152, 104, 165, 84);
        addStroke(c, COLOR_WHITE, 5, 100);
    }

    function drawCanonTopBar(comp) {
        drawCanonBatteryIcon(comp);
        addText(comp, "HUD_top_bat", "BAT 14.6V", 215, 108, 48, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 6, true);
        drawCanonTag(comp, "HUD_codec_tag", "XF-AVC 4K", 630, 64, 262, 66, 45);
        addText(comp, "HUD_top_resolution", "4096x2160", 922, 112, 48, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4, true);
        addText(comp, "HUD_top_fps", "23.98P", 1305, 112, 48, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4, true);
        addText(comp, "HUD_top_bit", "10 bit", 1585, 112, 48, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4, true);
        addText(comp, "HUD_top_log", "Canon Log 3", 1825, 112, 48, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4, true);
        drawCanonTag(comp, "HUD_lut_tag", "LUT", 2280, 64, 106, 66, 45);
        addText(comp, "HUD_top_lut_on", "ON", 2425, 112, 48, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4, true);

        var recDot = makeShapeLayer(comp, "HUD_top_rec_dot");
        var d = addGroup(recDot, "dot");
        addEllipseToContents(d, 3160, 66, 54, 54);
        addFill(d, COLOR_RED, 100);
        addText(comp, "HUD_top_rec", "REC", 3232, 112, 56, COLOR_RED, ParagraphJustification.LEFT_JUSTIFY, 5, true);

        drawCanonGreenBox(comp, "HUD_card_a", "A", 3505, 61, 44, 48, 38);
        addText(comp, "HUD_card_a_min", "35 min", 3582, 108, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, true);
        drawCanonGreenBox(comp, "HUD_card_b", "B", 3505, 130, 44, 48, 38);
        addText(comp, "HUD_card_b_min", "75 min", 3582, 176, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, true);
    }

    function drawCanonFrame(comp) {
        var layer = makeShapeLayer(comp, "HUD_frame_and_reticle");
        var c = addGroup(layer, "frame");
        var lx = 468;
        var rx = 3372;
        var ty = 242;
        var by = 1700;
        var len = 214;
        addLineToContents(c, lx, ty, lx + len, ty);
        addLineToContents(c, lx, ty, lx, ty + 188);
        addLineToContents(c, rx, ty, rx - len, ty);
        addLineToContents(c, rx, ty, rx, ty + 188);
        addLineToContents(c, lx, by, lx + len, by);
        addLineToContents(c, lx, by, lx, by - 188);
        addLineToContents(c, rx, by, rx - len, by);
        addLineToContents(c, rx, by, rx, by - 188);

        addLineToContents(c, 1800, 1062, 1895, 1062);
        addLineToContents(c, 1945, 1062, 2040, 1062);
        addLineToContents(c, 1920, 940, 1920, 1035);
        addLineToContents(c, 1920, 1089, 1920, 1187);
        addStroke(c, COLOR_WHITE, 5, 100);
    }

    function drawCanonMFScale(comp) {
        addText(comp, "HUD_mf_label", "MF", 90, 330, 46, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4, true);
        addText(comp, "HUD_mf_distance", "2.0 m", 124, 454, 38, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, true);

        var layer = makeShapeLayer(comp, "HUD_mf_scale");
        var c = addGroup(layer, "scale");
        var x = 205;
        var y0 = 525;
        var y1 = 990;
        addLineToContents(c, x, y0, x, y1);
        var labels = [
            ["INF", 0], ["10", 0.12], ["5", 0.25], ["3", 0.38],
            ["2", 0.52], ["1.5", 0.66], ["1", 0.80], ["0.7", 1.00]
        ];
        for (var i = 0; i < labels.length; i++) {
            var y = y0 + (y1 - y0) * labels[i][1];
            addLineToContents(c, x - 42, y, x, y);
            addText(comp, "HUD_mf_num_" + i, labels[i][0], 92, y + 13, 34, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0, false);
        }
        addPolylineToContents(c, [[230, 786], [256, 764], [256, 808]], true);
        addStroke(c, COLOR_WHITE, 4, 100);

        var pointer = makeShapeLayer(comp, "HUD_mf_pointer");
        var p = addGroup(pointer, "pointer");
        addPolylineToContents(p, [[232, 784], [258, 764], [258, 804]], true);
        addFill(p, COLOR_WHITE, 100);
    }

    function drawCanonLeftStatus(comp) {
        drawCanonMFScale(comp);
        drawCanonTag(comp, "HUD_fan_tag", "FAN", 92, 1112, 102, 52, 38);
        addText(comp, "HUD_fan_off", "OFF", 106, 1215, 40, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, true);
        drawCanonTag(comp, "HUD_kelvin_tag", "K", 78, 1365, 68, 50, 38);
        addText(comp, "HUD_kelvin_value", "5600K", 162, 1411, 40, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, true);
        drawCanonTag(comp, "HUD_nd_tag", "ND", 76, 1452, 74, 50, 36);
        addText(comp, "HUD_nd_value", "1/4", 162, 1498, 40, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, true);
        drawCanonTag(comp, "HUD_cp_tag", "CP", 76, 1538, 74, 50, 36);
        addText(comp, "HUD_cp_value", "2", 162, 1584, 40, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, true);
        drawCanonTag(comp, "HUD_wb_tag", "WB", 76, 1624, 74, 50, 34);
        addText(comp, "HUD_wb_value", "+0", 162, 1670, 40, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, true);
    }

    function drawCanonRightStatus(comp) {
        addText(comp, "HUD_sdi", "SDI 1/2", 3590, 332, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, true);
        drawCanonTag(comp, "HUD_sdi_look", "LOOK", 3624, 360, 118, 56, 38);
        addText(comp, "HUD_mon", "MON", 3616, 584, 44, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, true);
        drawCanonTag(comp, "HUD_mon_709", "709", 3620, 612, 128, 56, 38);
        addText(comp, "HUD_hdmi", "HDMI", 3608, 838, 44, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, true);
        drawCanonTag(comp, "HUD_hdmi_709", "709", 3620, 866, 128, 56, 38);
        addText(comp, "HUD_zebra", "ZEBRA", 3592, 1090, 44, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, true);
        addText(comp, "HUD_zebra_val", "70%", 3614, 1152, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, true);
        addText(comp, "HUD_peak", "PEAK1", 3596, 1318, 44, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, true);
        drawCanonTag(comp, "HUD_peak_on", "ON", 3602, 1344, 138, 58, 40);
    }

    function drawCanonWaveform(comp) {
        var frame = makeShapeLayer(comp, "HUD_waveform_frame");
        var f = addGroup(frame, "frame");
        addRectToContents(f, 86, 1752, 720, 260, 0);
        addLineToContents(f, 86, 1820, 806, 1820);
        addLineToContents(f, 86, 1882, 806, 1882);
        addLineToContents(f, 86, 1944, 806, 1944);
        addStroke(f, COLOR_WHITE, 2, 85);
        addText(comp, "HUD_wave_1023", "1023", 45, 1766, 22, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0, false);
        addText(comp, "HUD_wave_768", "768", 55, 1830, 22, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0, false);
        addText(comp, "HUD_wave_512", "512", 55, 1892, 22, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0, false);
        addText(comp, "HUD_wave_256", "256", 55, 1956, 22, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0, false);
        addText(comp, "HUD_wave_0", "0", 88, 2018, 22, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0, false);

        var trace = makeShapeLayer(comp, "HUD_waveform_trace");
        var white = addGroup(trace, "white trace");
        var x0 = 128;
        var yBase = 1960;
        for (var i = 0; i < 120; i++) {
            var x = x0 + i * 5.2;
            var a = Math.sin(i * 0.17) * 34 + Math.sin(i * 0.055) * 80 + Math.sin(i * 0.39) * 18;
            var h = 28 + Math.abs(a) + (i > 55 && i < 92 ? 55 : 0);
            addLineToContents(white, x, yBase, x, yBase - h);
        }
        addStroke(white, COLOR_WHITE, 3, 70);
        var yellow = addGroup(trace, "yellow reference");
        addLineToContents(yellow, 128, 1885, 760, 1885);
        addStroke(yellow, COLOR_YELLOW, 3, 100);
    }

    function drawCanonBottomStrip(comp) {
        addText(comp, "HUD_clip_id", "A001C012", 1080, 1872, 46, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4, true);
        var dot = makeShapeLayer(comp, "HUD_bottom_rec_dot");
        var d = addGroup(dot, "dot");
        addEllipseToContents(d, 1428, 1834, 42, 42);
        addFill(d, COLOR_RED, 100);
        addText(comp, "HUD_bottom_rec", "REC", 1488, 1872, 48, COLOR_RED, ParagraphJustification.LEFT_JUSTIFY, 5, true);
        addText(comp, "HUD_media_label", "MEDIA", 1795, 1871, 30, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 3, true);
        addText(comp, "HUD_media_value", "0:32 h", 1925, 1872, 48, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4, true);
        addText(comp, "HUD_tc_label", "TC", 2338, 1871, 30, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 3, true);
        addText(comp, "HUD_tc_value", "01:23:45:18", 2440, 1872, 48, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4, true);

        var lines = makeShapeLayer(comp, "HUD_exposure_separators");
        var s = addGroup(lines, "separators");
        var xs = [1365, 1890, 2480, 3010];
        for (var i = 0; i < xs.length; i++) addLineToContents(s, xs[i], 1985, xs[i], 2100);
        addStroke(s, COLOR_WHITE, 3, 75);

        addText(comp, "HUD_shutter_label", "SHUTTER", 1000, 2028, 34, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, false);
        addText(comp, "HUD_shutter_val", "1/48", 1025, 2088, 52, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, true);
        addText(comp, "HUD_iris_label", "IRIS", 1558, 2028, 34, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, false);
        addText(comp, "HUD_iris_val", "F2.8", 1535, 2088, 52, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, true);
        addText(comp, "HUD_iso_label", "ISO", 2148, 2028, 34, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, false);
        addText(comp, "HUD_iso_val", "800", 2138, 2088, 52, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, true);
        addText(comp, "HUD_nd_label", "ND", 2745, 2028, 34, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, false);
        addText(comp, "HUD_nd_val", "1/4", 2718, 2088, 52, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, true);
        addText(comp, "HUD_focus_label", "FOCUS", 3210, 2028, 34, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3, false);
        addText(comp, "HUD_focus_val", "2.00 m", 3195, 2088, 52, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, true);
    }

    function drawCanonAudioRow(layer, rowName, x, y) {
        var green = addGroup(layer, rowName + "_green");
        var yellow = addGroup(layer, rowName + "_yellow");
        var red = addGroup(layer, rowName + "_red");
        var bars = 34;
        var bw = 10;
        var gap = 8;
        for (var i = 0; i < bars; i++) {
            var bx = x + i * (bw + gap);
            var target = i < 27 ? green : (i < 31 ? yellow : red);
            addRectToContents(target, bx, y, bw, 30, 0);
        }
        addFill(green, COLOR_GREEN, 100);
        addFill(yellow, COLOR_YELLOW, 100);
        addFill(red, COLOR_RED, 100);
    }

    function drawCanonAudioMeters(comp) {
        var layer = makeShapeLayer(comp, "HUD_audio_meters");
        drawCanonAudioRow(layer, "ch1", 3080, 1800);
        drawCanonAudioRow(layer, "ch2", 3080, 1872);
        addText(comp, "HUD_audio_ch1", "CH1", 2975, 1828, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, false);
        addText(comp, "HUD_audio_ch2", "CH2", 2975, 1900, 31, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2, false);
        var marks = ["-40", "-30", "-20", "-10", "0"];
        var xs = [3080, 3242, 3406, 3570, 3750];
        for (var i = 0; i < marks.length; i++) {
            addText(comp, "HUD_audio_mark_" + i, marks[i], xs[i], 1770, 24, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0, false);
        }
    }

    function drawCanonHUD(comp) {
        drawCanonTopBar(comp);
        drawCanonFrame(comp);
        drawCanonLeftStatus(comp);
        drawCanonRightStatus(comp);
        drawCanonWaveform(comp);
        drawCanonBottomStrip(comp);
        drawCanonAudioMeters(comp);
    }

    function buildCanonHUD(comp) {
        drawCanonHUD(comp);
    }

    function buildHUD(comp) {
        buildCanonHUD(comp);
    }

    var guideFile = null;
    if (confirm("Add reference image as guide layer?")) {
        guideFile = File.openDialog(
            "Choose reference image",
            "Images:*.png;*.jpg;*.jpeg;*.tif;*.tiff;*.bmp;*.gif;*.psd"
        );
    }

    if (!app.project) app.newProject();
    app.beginUndoGroup("Canon C70 HUD Builder RV v1");
    try {
        var comp = app.project.items.addComp(
            uniqueCompName(COMP_BASE),
            COMP_W,
            COMP_H,
            1,
            COMP_DURATION,
            FPS
        );
        comp.bgColor = COLOR_BLACK;

        var ctrl = addHUDController(comp, guideFile ? 35 : 0);
        if (guideFile) addReferenceGuide(comp, guideFile, 35);
        buildHUD(comp);
        try {
            ctrl.moveToBeginning();
        } catch (ignored) {
        }
        comp.openInViewer();
    } catch (err) {
        alert("Canon C70 HUD Builder problems:\n\n- " + err.toString() + (err.line ? " line " + err.line : ""));
    } finally {
        app.endUndoGroup();
    }
})();
