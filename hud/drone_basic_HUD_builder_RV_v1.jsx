#target aftereffects
#targetengine "DroneBasicHUDBuilderRVV1"

/*
    drone_basic_HUD_builder_RV v1
    Adobe After Effects 2022+

    Procedural basic drone HUD overlay.
    This preset does not use a reference image. It builds a lightweight,
    editable 3840 x 2160 HUD from native text layers and Bezier shape paths.
*/

(function DroneBasicHUDBuilderRVV1() {
    var COMP_W = 3840;
    var COMP_H = 2160;
    var COMP_DURATION = 10;
    var FPS = 30;
    var COMP_BASE = "DRONE_BASIC_HUD_MAIN";
    var CTRL_NAME = "HUD_CONTROL";

    var FONT_CANDIDATES = [
        "Consolas",
        "Menlo-Regular",
        "Monaco",
        "CourierNewPSMT",
        "Courier New",
        "ArialMT",
        "Arial"
    ];

    var FX_HUD_SCALE = "HUD Scale (%)";
    var FX_GLOBAL_OPACITY = "HUD Opacity (%)";
    var FX_LINE_WIDTH = "Line Width";
    var FX_WHITE_COLOR = "White Color";
    var FX_DIM_COLOR = "Dim Color";
    var FX_ACCENT_COLOR = "Accent Color";
    var FX_GREEN_COLOR = "Green Color";
    var FX_YELLOW_COLOR = "Yellow Color";
    var FX_RED_COLOR = "REC Red";

    var COLOR_WHITE = [0.90, 0.95, 0.98];
    var COLOR_DIM = [0.42, 0.50, 0.54];
    var COLOR_ACCENT = [0.00, 0.82, 1.00];
    var COLOR_GREEN = [0.20, 0.95, 0.28];
    var COLOR_YELLOW = [0.98, 0.82, 0.12];
    var COLOR_RED = [1.00, 0.04, 0.04];
    var COLOR_BLACK = [0, 0, 0];

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
        if (colorsMatch(color, COLOR_ACCENT)) return FX_ACCENT_COLOR;
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

    function lineWidthExpr(width) {
        return '(' + controlExpr(FX_LINE_WIDTH, "Slider") + ') * ' + (width / 4).toFixed(4) + ';';
    }

    function scalePositionExpr() {
        return [
            'var s = ' + controlExpr(FX_HUD_SCALE, "Slider") + ' / 100;',
            'var cx = thisComp.width * 0.5;',
            'var cy = thisComp.height * 0.5;',
            '[(value[0] - cx) * s + cx, (value[1] - cy) * s + cy];'
        ].join("\n");
    }

    function scaleScaleExpr() {
        return [
            'var s = ' + controlExpr(FX_HUD_SCALE, "Slider") + ' / 100;',
            '[value[0] * s, value[1] * s];'
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

    function addHUDController(comp) {
        var layer = comp.layers.addNull();
        layer.name = CTRL_NAME;
        layer.label = 11;
        var tr = layer.property("ADBE Transform Group");
        tr.property("ADBE Position").setValue([120, 120]);
        tr.property("ADBE Opacity").setValue(0);

        var fx = layer.property("ADBE Effect Parade");
        addSlider(fx, FX_HUD_SCALE, 100);
        addSlider(fx, FX_GLOBAL_OPACITY, 100);
        addSlider(fx, FX_LINE_WIDTH, 4);
        addColor(fx, FX_WHITE_COLOR, COLOR_WHITE);
        addColor(fx, FX_DIM_COLOR, COLOR_DIM);
        addColor(fx, FX_ACCENT_COLOR, COLOR_ACCENT);
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
        setExpression(stroke.property("ADBE Vector Stroke Width"), lineWidthExpr(width));
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
                [x + r, y], [x + w - r, y], [x + w, y + r],
                [x + w, y + h - r], [x + w - r, y + h], [x + r, y + h],
                [x, y + h - r], [x, y + r]
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

    function applyFont(doc) {
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

    function addText(comp, name, text, x, y, size, color, align, tracking) {
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
            doc.tracking = tracking === undefined ? 35 : tracking;
        } catch (ignoredTracking) {
        }
        applyFont(doc);
        textProp.setValue(doc);
        layer.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        applyTextColorControl(layer, color);
        registerHudLayer(layer);
        return layer;
    }

    function drawOutlinedTag(comp, name, text, x, y, w, h, color, size) {
        var layer = makeShapeLayer(comp, name + "_box");
        var c = addGroup(layer, "outline");
        addRectToContents(c, x, y, w, h, 6);
        addStroke(c, color, 3, 100);
        addText(comp, name + "_text", text, x + w * 0.5, y + h - 12, size || 34, color, ParagraphJustification.CENTER_JUSTIFY, 20);
    }

    function drawFilledTag(comp, name, text, x, y, w, h, fillColor, textColor, size) {
        var layer = makeShapeLayer(comp, name + "_box");
        var c = addGroup(layer, "fill");
        addRectToContents(c, x, y, w, h, 7);
        addFill(c, fillColor, 100);
        addText(comp, name + "_text", text, x + w * 0.5, y + h - 10, size || 34, textColor, ParagraphJustification.CENTER_JUSTIFY, 10);
    }

    function drawCornerFrame(comp) {
        var layer = makeShapeLayer(comp, "HUD_clean_frame");
        var c = addGroup(layer, "corners");
        var x1 = 330;
        var x2 = 3510;
        var y1 = 255;
        var y2 = 1815;
        var h = 260;
        var v = 185;
        addLineToContents(c, x1, y1, x1 + h, y1);
        addLineToContents(c, x1, y1, x1, y1 + v);
        addLineToContents(c, x2, y1, x2 - h, y1);
        addLineToContents(c, x2, y1, x2, y1 + v);
        addLineToContents(c, x1, y2, x1 + h, y2);
        addLineToContents(c, x1, y2, x1, y2 - v);
        addLineToContents(c, x2, y2, x2 - h, y2);
        addLineToContents(c, x2, y2, x2, y2 - v);
        addStroke(c, COLOR_WHITE, 4, 100);

        var safe = addGroup(layer, "safe_marks");
        addLineToContents(safe, 960, 1080, 1120, 1080);
        addLineToContents(safe, 2720, 1080, 2880, 1080);
        addLineToContents(safe, 1920, 540, 1920, 680);
        addLineToContents(safe, 1920, 1480, 1920, 1620);
        addStroke(safe, COLOR_DIM, 2, 70);
    }

    function drawCenterReticle(comp) {
        var layer = makeShapeLayer(comp, "HUD_center_reticle");
        var c = addGroup(layer, "reticle");
        addLineToContents(c, 1848, 1080, 1900, 1080);
        addLineToContents(c, 1940, 1080, 1992, 1080);
        addLineToContents(c, 1920, 1008, 1920, 1060);
        addLineToContents(c, 1920, 1100, 1920, 1152);
        addRectToContents(c, 1878, 1038, 84, 84, 0);
        addStroke(c, COLOR_WHITE, 3, 95);

        var dot = makeShapeLayer(comp, "HUD_center_dot");
        var d = addGroup(dot, "dot");
        addEllipseToContents(d, 1908, 1068, 24, 24);
        addFill(d, COLOR_ACCENT, 100);
    }

    function drawTopStatus(comp) {
        drawFilledTag(comp, "HUD_clean_codec", "4K UHD", 465, 76, 185, 58, COLOR_WHITE, COLOR_BLACK, 34);
        addText(comp, "HUD_clean_resolution", "3840x2160", 700, 122, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 15);
        addText(comp, "HUD_clean_fps", "23.98P", 1038, 122, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 15);
        addText(comp, "HUD_clean_log", "LOG / FLAT", 1285, 122, 42, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 15);
        addText(comp, "HUD_clean_wb", "WB 5600K", 1690, 122, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 15);

        var recDot = makeShapeLayer(comp, "HUD_clean_rec_dot");
        var r = addGroup(recDot, "rec dot");
        addEllipseToContents(r, 2795, 77, 54, 54);
        addFill(r, COLOR_RED, 100);
        addText(comp, "HUD_clean_rec", "REC", 2875, 122, 50, COLOR_RED, ParagraphJustification.LEFT_JUSTIFY, 18);
        addText(comp, "HUD_clean_tc", "00:01:24:12", 3100, 122, 44, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 12);
    }

    function drawLeftScale(comp) {
        addText(comp, "HUD_clean_focus_mode", "MF", 92, 355, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 15);
        addText(comp, "HUD_clean_focus_dist", "2.00 m", 92, 435, 38, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);

        var layer = makeShapeLayer(comp, "HUD_clean_left_scale");
        var c = addGroup(layer, "focus scale");
        var x = 200;
        var y0 = 540;
        var step = 74;
        addLineToContents(c, x, y0, x, y0 + step * 7);
        for (var i = 0; i <= 7; i++) {
            var y = y0 + i * step;
            addLineToContents(c, x - (i % 2 === 0 ? 55 : 35), y, x, y);
        }
        addPolylineToContents(c, [[224, y0 + step * 3.4], [255, y0 + step * 3.15], [255, y0 + step * 3.65]], true);
        addStroke(c, COLOR_WHITE, 4, 100);

        addText(comp, "HUD_clean_focus_inf", "INF", 86, 548, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_clean_focus_5", "5", 130, 696, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_clean_focus_2", "2", 130, 844, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_clean_focus_1", "1", 130, 992, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_clean_focus_07", "0.7", 92, 1068, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);

        drawOutlinedTag(comp, "HUD_clean_af_tag", "AF HOLD", 72, 1260, 205, 58, COLOR_ACCENT, 30);
        addText(comp, "HUD_clean_zebra", "ZEBRA 70%", 72, 1428, 34, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 10);
        addText(comp, "HUD_clean_peaking", "PEAK ON", 72, 1510, 34, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 10);
    }

    function drawBottomExposure(comp) {
        var layer = makeShapeLayer(comp, "HUD_clean_bottom_separators");
        var c = addGroup(layer, "separators");
        var xs = [945, 1390, 1835, 2280, 2725, 3170];
        for (var i = 0; i < xs.length; i++) {
            addLineToContents(c, xs[i], 1955, xs[i], 2075);
        }
        addStroke(c, COLOR_DIM, 3, 85);

        addText(comp, "HUD_clean_shutter_label", "SHUTTER", 510, 1985, 28, COLOR_DIM, ParagraphJustification.CENTER_JUSTIFY, 6);
        addText(comp, "HUD_clean_shutter_value", "1/48", 510, 2055, 52, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 5);
        addText(comp, "HUD_clean_iris_label", "IRIS", 1168, 1985, 28, COLOR_DIM, ParagraphJustification.CENTER_JUSTIFY, 6);
        addText(comp, "HUD_clean_iris_value", "F2.8", 1168, 2055, 52, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 5);
        addText(comp, "HUD_clean_iso_label", "ISO", 1612, 1985, 28, COLOR_DIM, ParagraphJustification.CENTER_JUSTIFY, 6);
        addText(comp, "HUD_clean_iso_value", "800", 1612, 2055, 52, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 5);
        addText(comp, "HUD_clean_nd_label", "ND", 2058, 1985, 28, COLOR_DIM, ParagraphJustification.CENTER_JUSTIFY, 6);
        addText(comp, "HUD_clean_nd_value", "1/4", 2058, 2055, 52, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 5);
        addText(comp, "HUD_clean_gain_label", "GAIN", 2502, 1985, 28, COLOR_DIM, ParagraphJustification.CENTER_JUSTIFY, 6);
        addText(comp, "HUD_clean_gain_value", "0dB", 2502, 2055, 52, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 5);
        addText(comp, "HUD_clean_bat_label", "BATTERY", 2946, 1985, 28, COLOR_DIM, ParagraphJustification.CENTER_JUSTIFY, 6);
        addText(comp, "HUD_clean_bat_value", "82%", 2946, 2055, 52, COLOR_GREEN, ParagraphJustification.CENTER_JUSTIFY, 5);
        addText(comp, "HUD_clean_media_label", "MEDIA", 3390, 1985, 28, COLOR_DIM, ParagraphJustification.CENTER_JUSTIFY, 6);
        addText(comp, "HUD_clean_media_value", "46 min", 3390, 2055, 52, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 5);
    }

    function drawAudioMeters(comp) {
        addText(comp, "HUD_clean_audio_title", "AUDIO", 3240, 1410, 30, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_clean_ch1", "CH1", 3045, 1498, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
        addText(comp, "HUD_clean_ch2", "CH2", 3045, 1578, 30, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);

        var layer = makeShapeLayer(comp, "HUD_clean_audio_meters");
        var startX = 3140;
        var y1 = 1465;
        var y2 = 1545;
        var bw = 12;
        var gap = 9;

        var green = addGroup(layer, "green bars");
        for (var i = 0; i < 22; i++) {
            var x = startX + i * (bw + gap);
            addRectToContents(green, x, y1, bw, 32, 0);
            addRectToContents(green, x, y2, bw, 32, 0);
        }
        addFill(green, COLOR_GREEN, 100);

        var yellow = addGroup(layer, "yellow bars");
        for (var j = 22; j < 26; j++) {
            var yx = startX + j * (bw + gap);
            addRectToContents(yellow, yx, y1, bw, 32, 0);
            addRectToContents(yellow, yx, y2, bw, 32, 0);
        }
        addFill(yellow, COLOR_YELLOW, 100);

        var red = addGroup(layer, "red bars");
        for (var k = 26; k < 28; k++) {
            var rx = startX + k * (bw + gap);
            addRectToContents(red, rx, y1, bw, 32, 0);
            addRectToContents(red, rx, y2, bw, 32, 0);
        }
        addFill(red, COLOR_RED, 100);
    }

    function drawBatteryIcon(comp) {
        var layer = makeShapeLayer(comp, "HUD_clean_battery_icon");
        var c = addGroup(layer, "battery");
        addRectToContents(c, 3440, 250, 225, 84, 5);
        addRectToContents(c, 3665, 278, 18, 28, 2);
        addStroke(c, COLOR_WHITE, 4, 100);

        var fill = addGroup(layer, "battery fill");
        addRectToContents(fill, 3458, 268, 154, 48, 2);
        addFill(fill, COLOR_GREEN, 100);
        addText(comp, "HUD_clean_battery_text", "82%", 3553, 410, 42, COLOR_GREEN, ParagraphJustification.CENTER_JUSTIFY, 6);
    }

    function drawRightStatus(comp) {
        drawBatteryIcon(comp);
        addText(comp, "HUD_clean_card_a", "CARD A  128GB", 3180, 520, 36, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_clean_card_b", "CARD B  READY", 3180, 596, 36, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        drawOutlinedTag(comp, "HUD_clean_codec_tag", "PRORES", 3180, 730, 210, 58, COLOR_WHITE, 30);
        drawOutlinedTag(comp, "HUD_clean_stab_tag", "STAB ON", 3430, 730, 210, 58, COLOR_ACCENT, 30);
        addText(comp, "HUD_clean_hist_label", "HISTOGRAM", 3180, 1050, 30, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);

        var hist = makeShapeLayer(comp, "HUD_clean_histogram");
        var h = addGroup(hist, "hist bars");
        for (var i = 0; i < 42; i++) {
            var barX = 3180 + i * 12;
            var wave = Math.sin(i * 0.26) * 30 + Math.sin(i * 0.08) * 55;
            var barH = 18 + Math.abs(wave);
            addLineToContents(h, barX, 1185, barX, 1185 - barH);
        }
        addStroke(h, COLOR_WHITE, 3, 90);
    }

    function drawLevelGauge(comp) {
        var layer = makeShapeLayer(comp, "HUD_clean_level_gauge");
        var c = addGroup(layer, "level");
        addLineToContents(c, 1580, 1820, 2260, 1820);
        addLineToContents(c, 1920, 1790, 1920, 1850);
        for (var i = -4; i <= 4; i++) {
            var x = 1920 + i * 75;
            addLineToContents(c, x, 1810, x, 1830);
        }
        addStroke(c, COLOR_DIM, 3, 85);
        addText(comp, "HUD_clean_level", "LEVEL  0.0", 1920, 1760, 30, COLOR_ACCENT, ParagraphJustification.CENTER_JUSTIFY, 8);
    }

    function drawDronePanel(comp, name, x, y, w, h, title, value, unit, color) {
        var layer = makeShapeLayer(comp, name + "_panel");
        var c = addGroup(layer, "panel");
        addRectToContents(c, x, y, w, h, 12);
        addFill(c, COLOR_BLACK, 38);
        addStroke(c, COLOR_WHITE, 3, 76);
        addText(comp, name + "_title", title, x + 28, y + 48, 28, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, name + "_value", value, x + w * 0.5, y + 126, 66, color || COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 4);
        if (unit) addText(comp, name + "_unit", unit, x + w * 0.5 + 95, y + 126, 26, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 2);
    }

    function drawDroneTopStatus(comp) {
        drawFilledTag(comp, "HUD_drone_gps_lock", "GPS", 88, 62, 100, 58, COLOR_GREEN, COLOR_BLACK, 34);
        addText(comp, "HUD_drone_gps_text", "3D LOCK", 220, 110, 36, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_drone_sat", "SAT 18", 560, 110, 36, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_drone_rc", "RC  -62 dBm", 850, 110, 36, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_drone_mode", "NORMAL", 1800, 110, 38, COLOR_ACCENT, ParagraphJustification.CENTER_JUSTIFY, 10);
        addText(comp, "HUD_drone_record", "REC  00:04:12", 3155, 110, 36, COLOR_RED, ParagraphJustification.LEFT_JUSTIFY, 8);

        var batt = makeShapeLayer(comp, "HUD_drone_battery_icon");
        var b = addGroup(batt, "battery");
        addRectToContents(b, 3520, 66, 160, 58, 6);
        addRectToContents(b, 3680, 84, 14, 22, 3);
        addStroke(b, COLOR_WHITE, 4, 100);
        var fill = addGroup(batt, "battery fill");
        addRectToContents(fill, 3534, 80, 110, 30, 3);
        addFill(fill, COLOR_GREEN, 100);
        addText(comp, "HUD_drone_battery", "78%", 3488, 166, 32, COLOR_GREEN, ParagraphJustification.RIGHT_JUSTIFY, 4);
    }

    function drawDroneFrame(comp) {
        var layer = makeShapeLayer(comp, "HUD_drone_frame");
        var c = addGroup(layer, "frame corners");
        var x1 = 280;
        var x2 = 3560;
        var y1 = 245;
        var y2 = 1885;
        var h = 240;
        var v = 160;
        addLineToContents(c, x1, y1, x1 + h, y1);
        addLineToContents(c, x1, y1, x1, y1 + v);
        addLineToContents(c, x2, y1, x2 - h, y1);
        addLineToContents(c, x2, y1, x2, y1 + v);
        addLineToContents(c, x1, y2, x1 + h, y2);
        addLineToContents(c, x1, y2, x1, y2 - v);
        addLineToContents(c, x2, y2, x2 - h, y2);
        addLineToContents(c, x2, y2, x2, y2 - v);
        addStroke(c, COLOR_WHITE, 4, 92);

        var horizon = addGroup(layer, "horizon");
        addLineToContents(horizon, 1520, 1080, 1840, 1080);
        addLineToContents(horizon, 2000, 1080, 2320, 1080);
        addLineToContents(horizon, 1920, 920, 1920, 1020);
        addLineToContents(horizon, 1920, 1140, 1920, 1240);
        addStroke(horizon, COLOR_DIM, 3, 70);
    }

    function drawDroneCenterReticle(comp) {
        var layer = makeShapeLayer(comp, "HUD_drone_center_reticle");
        var c = addGroup(layer, "reticle");
        addRectToContents(c, 1848, 1008, 144, 144, 0);
        addLineToContents(c, 1775, 1080, 1855, 1080);
        addLineToContents(c, 1985, 1080, 2065, 1080);
        addLineToContents(c, 1920, 935, 1920, 1015);
        addLineToContents(c, 1920, 1145, 1920, 1225);
        addEllipseToContents(c, 1898, 1058, 44, 44);
        addStroke(c, COLOR_ACCENT, 4, 95);
        addText(comp, "HUD_drone_center_label", "HOME POINT LOCK", 1920, 1278, 30, COLOR_GREEN, ParagraphJustification.CENTER_JUSTIFY, 8);
    }

    function drawDroneTelemetry(comp) {
        drawDronePanel(comp, "HUD_drone_altitude", 82, 410, 420, 190, "ALTITUDE", "120.4", "m", COLOR_ACCENT);
        drawDronePanel(comp, "HUD_drone_speed", 82, 640, 420, 190, "SPEED", "12.6", "m/s", COLOR_WHITE);
        drawDronePanel(comp, "HUD_drone_distance", 82, 870, 420, 190, "DISTANCE", "860", "m", COLOR_WHITE);
        drawDronePanel(comp, "HUD_drone_vspeed", 82, 1100, 420, 190, "V-SPEED", "-0.3", "m/s", COLOR_YELLOW);

        drawDronePanel(comp, "HUD_drone_heading", 3338, 410, 420, 190, "HEADING", "045", "deg", COLOR_GREEN);
        drawDronePanel(comp, "HUD_drone_home", 3338, 640, 420, 190, "HOME", "312", "m", COLOR_WHITE);
        drawDronePanel(comp, "HUD_drone_signal", 3338, 870, 420, 190, "SIGNAL", "92", "%", COLOR_GREEN);
        drawDronePanel(comp, "HUD_drone_pitch", 3338, 1100, 420, 190, "GIMBAL", "-12", "deg", COLOR_DIM);
    }

    function drawDroneCompass(comp) {
        var cx = 1920;
        var cy = 1760;
        var layer = makeShapeLayer(comp, "HUD_drone_compass");
        var c = addGroup(layer, "compass");
        addEllipseToContents(c, cx - 155, cy - 155, 310, 310);
        addLineToContents(c, cx, cy - 180, cx, cy - 132);
        addLineToContents(c, cx + 180, cy, cx + 132, cy);
        addLineToContents(c, cx, cy + 180, cx, cy + 132);
        addLineToContents(c, cx - 180, cy, cx - 132, cy);
        for (var i = 0; i < 36; i++) {
            var a = (i * 10 - 90) * Math.PI / 180;
            var r1 = i % 3 === 0 ? 128 : 142;
            var r2 = 155;
            addLineToContents(c, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1, cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
        }
        addStroke(c, COLOR_WHITE, 3, 85);

        var pointer = makeShapeLayer(comp, "HUD_drone_compass_pointer");
        var p = addGroup(pointer, "pointer");
        addPolylineToContents(p, [[cx, cy - 225], [cx - 26, cy - 172], [cx + 26, cy - 172]], true);
        addFill(p, COLOR_GREEN, 100);

        addText(comp, "HUD_drone_compass_n", "N", cx, cy - 88, 34, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_drone_compass_e", "E", cx + 98, cy + 12, 34, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_drone_compass_s", "S", cx, cy + 116, 34, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_drone_compass_w", "W", cx - 98, cy + 12, 34, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HUD_drone_compass_heading", "045", cx, cy + 18, 56, COLOR_ACCENT, ParagraphJustification.CENTER_JUSTIFY, 2);
        addText(comp, "HUD_drone_compass_ne", "NE", cx, cy + 72, 30, COLOR_GREEN, ParagraphJustification.CENTER_JUSTIFY, 2);
    }

    function drawDroneMiniMap(comp) {
        var panel = makeShapeLayer(comp, "HUD_drone_minimap");
        var c = addGroup(panel, "map panel");
        addRectToContents(c, 2920, 1455, 640, 360, 10);
        addFill(c, COLOR_BLACK, 42);
        addStroke(c, COLOR_WHITE, 3, 75);

        var path = addGroup(panel, "flight path");
        addPolylineToContents(path, [[3000, 1700], [3110, 1605], [3240, 1660], [3375, 1545], [3480, 1620]], false);
        addEllipseToContents(path, 3095, 1590, 28, 28);
        addEllipseToContents(path, 3465, 1605, 28, 28);
        addStroke(path, COLOR_ACCENT, 4, 95);

        var home = addGroup(panel, "home dot");
        addEllipseToContents(home, 2985, 1685, 32, 32);
        addFill(home, COLOR_GREEN, 100);
        addText(comp, "HUD_drone_map_label", "HOME / PATH", 3240, 1508, 28, COLOR_DIM, ParagraphJustification.CENTER_JUSTIFY, 6);
    }

    function drawDroneBottomStatus(comp) {
        addText(comp, "HUD_drone_bottom_gps", "GPS 3D LOCK", 620, 2035, 32, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_drone_bottom_alt", "ALT 120.4 m", 1120, 2035, 32, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_drone_bottom_speed", "SPD 12.6 m/s", 1660, 2035, 32, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_drone_bottom_bat", "BAT 78%", 2260, 2035, 32, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_drone_bottom_rc", "RC STRONG", 2720, 2035, 32, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
    }

    function drawDroneBasicHUD(comp) {
        drawDroneTopStatus(comp);
        drawDroneFrame(comp);
        drawDroneCenterReticle(comp);
        drawDroneTelemetry(comp);
        drawDroneCompass(comp);
        drawDroneMiniMap(comp);
        drawDroneBottomStatus(comp);
    }

    if (!app.project) app.newProject();
    app.beginUndoGroup("Drone Basic HUD Builder RV v1");
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

        var ctrl = addHUDController(comp);
        drawDroneBasicHUD(comp);
        try {
            ctrl.moveToBeginning();
        } catch (ignored) {
        }
        comp.openInViewer();
    } catch (err) {
        alert("Drone Basic HUD Builder problems:\n\n- " + err.toString() + (err.line ? " line " + err.line : ""));
    } finally {
        app.endUndoGroup();
    }
})();
