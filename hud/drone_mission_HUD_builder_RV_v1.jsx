#target aftereffects
#targetengine "DroneMissionHUDBuilderRVV1"

/*
    drone_mission_HUD_builder_RV v1
    Adobe After Effects 2022+

    Procedural drone mission / survey HUD overlay.
    The script builds a lightweight editable 3840 x 2160 composition using
    native text layers and Bezier shape paths for maximum AE 22+ compatibility.
*/

(function DroneMissionHUDBuilderRVV1() {
    var COMP_W = 3840;
    var COMP_H = 2160;
    var COMP_DURATION = 10;
    var FPS = 30;
    var COMP_BASE = "DRONE_MISSION_HUD_MAIN";
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
        var colorControl = colorControlName(color) || FX_WHITE_COLOR;
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

    function buildHUD(comp) {
        drawTopMission(comp);
        drawTopTelemetry(comp);
        drawSatAndBattery(comp);
        drawLeftSidebar(comp);
        drawRightSidebar(comp);
        drawViewfinder(comp);
        drawMapPanel(comp);
        drawCompass(comp);
        drawBottomCenter(comp);
        drawProgressGrid(comp);
        drawFooter(comp);
    }

    var guideFile = null;
    if (confirm("Add reference image as guide layer?")) {
        guideFile = File.openDialog(
            "Choose reference image",
            "Images:*.png;*.jpg;*.jpeg;*.tif;*.tiff;*.bmp;*.gif;*.psd"
        );
    }

    if (!app.project) app.newProject();
    app.beginUndoGroup("Drone Mission HUD Builder RV v1");
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
        alert("Drone Mission HUD Builder problems:\n\n- " + err.toString() + (err.line ? " line " + err.line : ""));
    } finally {
        app.endUndoGroup();
    }
})();
