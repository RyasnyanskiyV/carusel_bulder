#target aftereffects
#targetengine "CinemaMonitorFrameHUDBuilderRVV1"

/*
    cinema_monitor_frame_HUD_builder_RV v1
    Adobe After Effects 2022+

    Procedural cinema monitor frame overlay.
    This preset does not use a reference image. It builds a lightweight,
    editable 3840 x 2160 HUD from native text layers and Bezier shape paths.
*/

(function CinemaMonitorFrameHUDBuilderRVV1() {
    var COMP_W = 3840;
    var COMP_H = 2160;
    var COMP_DURATION = 10;
    var FPS = 30;
    var COMP_BASE = "CINEMA_MONITOR_FRAME_MAIN";
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

    function drawCinemaPanel(comp, name, x, y, w, h, title) {
        var layer = makeShapeLayer(comp, name + "_panel");
        var c = addGroup(layer, "panel");
        addRectToContents(c, x, y, w, h, 8);
        addFill(c, COLOR_BLACK, 38);
        addStroke(c, COLOR_WHITE, 3, 80);
        if (title) {
            addText(comp, name + "_title", title, x + 22, y + 42, 28, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        }
    }

    function drawCinemaTopBar(comp) {
        drawFilledTag(comp, "HUD_cinema_rec_tag", "REC", 86, 64, 118, 60, COLOR_RED, COLOR_BLACK, 34);
        addText(comp, "HUD_cinema_tc", "01:23:45:12", 242, 116, 48, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 12);
        drawOutlinedTag(comp, "HUD_cinema_codec", "ARRIRAW", 770, 66, 190, 58, COLOR_WHITE, 32);
        drawOutlinedTag(comp, "HUD_cinema_res", "4.6K  OPEN GATE", 1000, 66, 330, 58, COLOR_ACCENT, 30);
        addText(comp, "HUD_cinema_fps", "23.976 fps", 1380, 116, 38, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 12);
        addText(comp, "HUD_cinema_lut", "LUT  REC709", 1765, 116, 38, COLOR_YELLOW, ParagraphJustification.LEFT_JUSTIFY, 12);
        addText(comp, "HUD_cinema_cam", "CAM A", 2550, 116, 38, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 12);
        addText(comp, "HUD_cinema_media", "MEDIA  47 min", 2815, 116, 38, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 10);
        addText(comp, "HUD_cinema_bat", "BAT  15.8V", 3330, 116, 38, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 10);
    }

    function drawCinemaSafeArea(comp) {
        var layer = makeShapeLayer(comp, "HUD_cinema_safe_area");
        var action = addGroup(layer, "action safe");
        addRectToContents(action, 290, 210, 3260, 1740, 0);
        addStroke(action, COLOR_WHITE, 3, 70);

        var title = addGroup(layer, "title safe");
        addRectToContents(title, 480, 330, 2880, 1500, 0);
        addStroke(title, COLOR_DIM, 2, 60);

        var crop239 = addGroup(layer, "2.39 crop");
        addRectToContents(crop239, 290, 552, 3260, 1056, 0);
        addStroke(crop239, COLOR_YELLOW, 2, 70);

        var crop185 = addGroup(layer, "1.85 crop");
        addRectToContents(crop185, 514, 210, 2812, 1740, 0);
        addStroke(crop185, COLOR_ACCENT, 2, 55);

        var thirds = addGroup(layer, "thirds");
        addLineToContents(thirds, 1376, 210, 1376, 1950);
        addLineToContents(thirds, 2464, 210, 2464, 1950);
        addLineToContents(thirds, 290, 790, 3550, 790);
        addLineToContents(thirds, 290, 1370, 3550, 1370);
        addStroke(thirds, COLOR_DIM, 2, 35);

        addText(comp, "HUD_cinema_action_label", "ACTION SAFE", 310, 246, 26, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_cinema_title_label", "TITLE SAFE", 500, 366, 24, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_cinema_crop239_label", "2.39:1", 3420, 592, 26, COLOR_YELLOW, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_cinema_crop185_label", "1.85:1", 3140, 252, 26, COLOR_ACCENT, ParagraphJustification.LEFT_JUSTIFY, 8);
    }

    function drawCinemaCenter(comp) {
        var layer = makeShapeLayer(comp, "HUD_cinema_center_marks");
        var c = addGroup(layer, "center");
        addLineToContents(c, 1848, 1080, 1895, 1080);
        addLineToContents(c, 1945, 1080, 1992, 1080);
        addLineToContents(c, 1920, 1008, 1920, 1055);
        addLineToContents(c, 1920, 1105, 1920, 1152);
        addEllipseToContents(c, 1892, 1052, 56, 56);
        addStroke(c, COLOR_WHITE, 3, 95);

        var horizon = addGroup(layer, "horizon");
        addLineToContents(horizon, 1600, 1215, 2240, 1215);
        for (var i = -4; i <= 4; i++) {
            var x = 1920 + i * 80;
            addLineToContents(horizon, x, 1202, x, 1228);
        }
        addStroke(horizon, COLOR_DIM, 2, 65);
        addText(comp, "HUD_cinema_roll", "ROLL  0.0", 1920, 1182, 28, COLOR_DIM, ParagraphJustification.CENTER_JUSTIFY, 8);
    }

    function drawCinemaWaveform(comp) {
        drawCinemaPanel(comp, "HUD_cinema_waveform", 88, 1570, 720, 310, "WAVEFORM");
        var layer = makeShapeLayer(comp, "HUD_cinema_waveform_trace");
        var grid = addGroup(layer, "grid");
        addLineToContents(grid, 130, 1645, 760, 1645);
        addLineToContents(grid, 130, 1710, 760, 1710);
        addLineToContents(grid, 130, 1775, 760, 1775);
        addStroke(grid, COLOR_DIM, 2, 55);

        var trace = addGroup(layer, "trace");
        for (var i = 0; i < 115; i++) {
            var x = 130 + i * 5.5;
            var a = Math.sin(i * 0.15) * 36 + Math.sin(i * 0.045) * 72 + Math.sin(i * 0.37) * 20;
            var h = 30 + Math.abs(a);
            addLineToContents(trace, x, 1832, x, 1832 - h);
        }
        addStroke(trace, COLOR_WHITE, 3, 72);

        var reference = addGroup(layer, "middle reference");
        addLineToContents(reference, 130, 1742, 760, 1742);
        addStroke(reference, COLOR_YELLOW, 2, 90);
        addText(comp, "HUD_cinema_wave_100", "100", 42, 1648, 22, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_cinema_wave_50", "50", 55, 1745, 22, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_cinema_wave_0", "0", 80, 1835, 22, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 0);
    }

    function drawCinemaAudioRow(layer, name, x, y) {
        var green = addGroup(layer, name + "_green");
        for (var i = 0; i < 23; i++) {
            var gx = x + i * 18;
            addRectToContents(green, gx, y, 10, 34, 0);
        }
        addFill(green, COLOR_GREEN, 100);

        var yellow = addGroup(layer, name + "_yellow");
        for (var j = 23; j < 28; j++) {
            var yx = x + j * 18;
            addRectToContents(yellow, yx, y, 10, 34, 0);
        }
        addFill(yellow, COLOR_YELLOW, 100);

        var red = addGroup(layer, name + "_red");
        for (var k = 28; k < 31; k++) {
            var rx = x + k * 18;
            addRectToContents(red, rx, y, 10, 34, 0);
        }
        addFill(red, COLOR_RED, 100);
    }

    function drawCinemaAudioMeters(comp) {
        drawCinemaPanel(comp, "HUD_cinema_audio", 2945, 1548, 800, 330, "AUDIO METERS");
        var layer = makeShapeLayer(comp, "HUD_cinema_audio_bars");
        drawCinemaAudioRow(layer, "mix_l", 3100, 1640);
        drawCinemaAudioRow(layer, "mix_r", 3100, 1725);
        addText(comp, "HUD_cinema_audio_l", "L", 3035, 1672, 30, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 4);
        addText(comp, "HUD_cinema_audio_r", "R", 3035, 1757, 30, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 4);
        var labels = ["-40", "-30", "-20", "-10", "0"];
        var xs = [3100, 3270, 3440, 3610, 3668];
        for (var i = 0; i < labels.length; i++) {
            addText(comp, "HUD_cinema_audio_mark_" + i, labels[i], xs[i], 1610, 22, COLOR_DIM, ParagraphJustification.CENTER_JUSTIFY, 0);
        }
    }

    function drawCinemaBottomStatus(comp) {
        var panel = makeShapeLayer(comp, "HUD_cinema_bottom_status");
        var c = addGroup(panel, "bottom rail");
        addRectToContents(c, 940, 1948, 1960, 130, 8);
        addFill(c, COLOR_BLACK, 45);
        addStroke(c, COLOR_WHITE, 3, 70);

        addText(comp, "HUD_cinema_lens_label", "LENS", 1025, 1985, 26, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 6);
        addText(comp, "HUD_cinema_lens", "35mm", 1025, 2050, 46, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
        addText(comp, "HUD_cinema_tstop_label", "T-STOP", 1355, 1985, 26, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 6);
        addText(comp, "HUD_cinema_tstop", "T2.8", 1355, 2050, 46, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
        addText(comp, "HUD_cinema_iso_label", "EI", 1695, 1985, 26, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 6);
        addText(comp, "HUD_cinema_iso", "800", 1695, 2050, 46, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
        addText(comp, "HUD_cinema_nd_label", "ND", 2015, 1985, 26, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 6);
        addText(comp, "HUD_cinema_nd", "0.6", 2015, 2050, 46, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
        addText(comp, "HUD_cinema_shutter_label", "SHUTTER", 2315, 1985, 26, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 6);
        addText(comp, "HUD_cinema_shutter", "180 deg", 2315, 2050, 46, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
    }

    function drawCinemaRightTools(comp) {
        drawOutlinedTag(comp, "HUD_cinema_false_color", "FALSE COLOR", 3160, 420, 330, 58, COLOR_ACCENT, 28);
        drawOutlinedTag(comp, "HUD_cinema_zebra", "ZEBRA 95%", 3160, 520, 330, 58, COLOR_YELLOW, 28);
        drawOutlinedTag(comp, "HUD_cinema_peaking", "PEAK HIGH", 3160, 620, 330, 58, COLOR_WHITE, 28);
        addText(comp, "HUD_cinema_scope_status", "MONITOR OUT  clean", 3160, 780, 30, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_cinema_aspect_status", "GUIDES  2.39 / 1.85 / 16:9", 3160, 850, 30, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
    }

    function drawCinemaMonitorFrame(comp) {
        drawCinemaTopBar(comp);
        drawCinemaSafeArea(comp);
        drawCinemaCenter(comp);
        drawCinemaWaveform(comp);
        drawCinemaAudioMeters(comp);
        drawCinemaBottomStatus(comp);
        drawCinemaRightTools(comp);
    }

    if (!app.project) app.newProject();
    app.beginUndoGroup("Cinema Monitor Frame HUD Builder RV v1");
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
        drawCinemaMonitorFrame(comp);
        try {
            ctrl.moveToBeginning();
        } catch (ignored) {
        }
        comp.openInViewer();
    } catch (err) {
        alert("Cinema Monitor Frame HUD Builder problems:\n\n- " + err.toString() + (err.line ? " line " + err.line : ""));
    } finally {
        app.endUndoGroup();
    }
})();
