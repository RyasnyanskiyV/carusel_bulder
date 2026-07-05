#target aftereffects
#targetengine "TechDataFrameHUDBuilderRVV1"

/*
    tech_data_frame_HUD_builder_RV v1
    Adobe After Effects 2022+

    Procedural tech data frame overlay.
    This preset does not use a reference image. It builds a lightweight,
    editable 3840 x 2160 HUD from native text layers and Bezier shape paths.
*/

(function TechDataFrameHUDBuilderRVV1() {
    var COMP_W = 3840;
    var COMP_H = 2160;
    var COMP_DURATION = 10;
    var FPS = 30;
    var COMP_BASE = "TECH_DATA_FRAME_MAIN";
    var CTRL_NAME = "HUD_CONTROL";

    var FONT_CANDIDATES = [
        "SFMono-Regular",
        "SF Mono",
        "RobotoMono-Regular",
        "Roboto Mono",
        "IBMPlexMono-Regular",
        "IBM Plex Mono",
        "JetBrainsMono-Regular",
        "JetBrains Mono",
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

    function drawDataPanel(comp, name, x, y, w, h, title, value, unit, accent) {
        var layer = makeShapeLayer(comp, name + "_panel");
        var c = addGroup(layer, "panel frame");
        addRectToContents(c, x, y, w, h, 10);
        addFill(c, COLOR_BLACK, 34);
        addStroke(c, COLOR_WHITE, 2.2, 46);

        var edge = addGroup(layer, "active edge");
        addLineToContents(edge, x, y, x + w * 0.42, y);
        addLineToContents(edge, x, y, x, y + h * 0.42);
        addLineToContents(edge, x + w, y + h, x + w - w * 0.42, y + h);
        addLineToContents(edge, x + w, y + h, x + w, y + h - h * 0.42);
        addStroke(edge, accent || COLOR_ACCENT, 3, 94);

        var hash = addGroup(layer, "hash marks");
        for (var i = 0; i < 6; i++) {
            var hx = x + 26 + i * 22;
            addLineToContents(hash, hx, y + h - 34, hx + 10, y + h - 34);
        }
        addStroke(hash, COLOR_DIM, 1.6, 50);

        addText(comp, name + "_title", title, x + 24, y + 46, 25, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 10);
        addText(comp, name + "_value", value, x + 24, y + 124, 62, accent || COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 3);
        if (unit) addText(comp, name + "_unit", unit, x + w - 24, y + 124, 25, COLOR_DIM, ParagraphJustification.RIGHT_JUSTIFY, 6);
    }

    function drawTechOuterFrame(comp) {
        var layer = makeShapeLayer(comp, "HUD_tech_outer_frame");
        var frame = addGroup(layer, "segmented frame");
        addRectToContents(frame, 175, 120, 3490, 1920, 12);
        addStroke(frame, COLOR_WHITE, 2.4, 50);

        var segments = addGroup(layer, "corner data rails");
        addLineToContents(segments, 175, 310, 175, 120);
        addLineToContents(segments, 175, 120, 645, 120);
        addLineToContents(segments, 3195, 120, 3665, 120);
        addLineToContents(segments, 3665, 120, 3665, 310);
        addLineToContents(segments, 175, 1850, 175, 2040);
        addLineToContents(segments, 175, 2040, 645, 2040);
        addLineToContents(segments, 3195, 2040, 3665, 2040);
        addLineToContents(segments, 3665, 1850, 3665, 2040);
        addStroke(segments, COLOR_ACCENT, 3, 88);

        var ticks = addGroup(layer, "edge ticks");
        for (var i = 0; i < 28; i++) {
            var x = 740 + i * 85;
            addLineToContents(ticks, x, 120, x, 146);
            addLineToContents(ticks, x, 2014, x, 2040);
        }
        for (var j = 0; j < 16; j++) {
            var y = 405 + j * 86;
            addLineToContents(ticks, 175, y, 202, y);
            addLineToContents(ticks, 3638, y, 3665, y);
        }
        addStroke(ticks, COLOR_WHITE, 1.5, 32);
    }

    function drawTechHeader(comp) {
        var layer = makeShapeLayer(comp, "HUD_tech_header");
        var c = addGroup(layer, "header rails");
        addLineToContents(c, 700, 210, 3140, 210);
        addLineToContents(c, 700, 300, 3140, 300);
        addLineToContents(c, 700, 210, 645, 255);
        addLineToContents(c, 3140, 210, 3195, 255);
        addLineToContents(c, 645, 255, 700, 300);
        addLineToContents(c, 3195, 255, 3140, 300);
        addStroke(c, COLOR_WHITE, 2.2, 52);

        var blocks = addGroup(layer, "header blocks");
        for (var i = 0; i < 34; i++) {
            var x = 846 + i * 48;
            var h = 18 + (i % 5) * 5;
            addRectToContents(blocks, x, 238, 28, h, 0);
        }
        addFill(blocks, COLOR_ACCENT, 72);

        addText(comp, "HUD_tech_title", "TECH DATA FRAME", 230, 216, 38, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 12);
        addText(comp, "HUD_tech_subtitle", "PANEL / NUMERIC / VECTOR BUS", 230, 270, 22, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_tech_status", "SYS ONLINE", 3420, 220, 30, COLOR_GREEN, ParagraphJustification.RIGHT_JUSTIFY, 10);
        addText(comp, "HUD_tech_clock", "TC 00:12:48:16", 3420, 270, 26, COLOR_WHITE, ParagraphJustification.RIGHT_JUSTIFY, 8);
    }

    function drawTechGrid(comp) {
        var layer = makeShapeLayer(comp, "HUD_tech_grid");
        var grid = addGroup(layer, "data grid");
        for (var i = 0; i <= 12; i++) {
            var x = 820 + i * 183;
            addLineToContents(grid, x, 420, x, 1660);
        }
        for (var j = 0; j <= 8; j++) {
            var y = 420 + j * 155;
            addLineToContents(grid, 820, y, 3020, y);
        }
        addStroke(grid, COLOR_DIM, 1, 15);

        var nodes = addGroup(layer, "data nodes");
        var coords = [[1120, 640], [1545, 560], [2060, 705], [2460, 610], [2780, 1010], [2260, 1260], [1700, 1365], [1240, 1160]];
        for (var n = 0; n < coords.length; n++) {
            addRectToContents(nodes, coords[n][0] - 10, coords[n][1] - 10, 20, 20, 2);
        }
        addFill(nodes, COLOR_ACCENT, 90);

        var links = addGroup(layer, "node links");
        addPolylineToContents(links, [[1120, 640], [1545, 560], [2060, 705], [2460, 610], [2780, 1010], [2260, 1260], [1700, 1365], [1240, 1160], [1120, 640]], false);
        addLineToContents(links, 1545, 560, 1700, 1365);
        addLineToContents(links, 2060, 705, 2260, 1260);
        addStroke(links, COLOR_ACCENT, 2, 70);
    }

    function drawTechCenter(comp) {
        var layer = makeShapeLayer(comp, "HUD_tech_center_processor");
        var c = addGroup(layer, "processor box");
        addRectToContents(c, 1510, 730, 820, 520, 14);
        addFill(c, COLOR_BLACK, 42);
        addStroke(c, COLOR_WHITE, 2.2, 50);

        var inner = addGroup(layer, "processor detail");
        addRectToContents(inner, 1605, 820, 630, 340, 6);
        addLineToContents(inner, 1605, 930, 2235, 930);
        addLineToContents(inner, 1605, 1045, 2235, 1045);
        addLineToContents(inner, 1815, 820, 1815, 1160);
        addLineToContents(inner, 2025, 820, 2025, 1160);
        addStroke(inner, COLOR_DIM, 1.6, 42);

        var pulse = addGroup(layer, "pulse line");
        addPolylineToContents(pulse, [[1635, 1020], [1700, 1020], [1740, 960], [1790, 1088], [1850, 1020], [1910, 1020], [1960, 970], [2020, 1060], [2090, 1020], [2205, 1020]], false);
        addStroke(pulse, COLOR_GREEN, 3, 92);

        addText(comp, "HUD_tech_core_label", "CORE BUS", 1920, 795, 28, COLOR_DIM, ParagraphJustification.CENTER_JUSTIFY, 10);
        addText(comp, "HUD_tech_core_value", "84.72", 1920, 1010, 92, COLOR_ACCENT, ParagraphJustification.CENTER_JUSTIFY, 4);
        addText(comp, "HUD_tech_core_unit", "DATA LOAD / MS", 1920, 1080, 24, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 8);
    }

    function drawTechSidePanels(comp) {
        drawDataPanel(comp, "HUD_tech_cpu", 245, 430, 445, 180, "CPU VECTOR", "72.4", "%", COLOR_ACCENT);
        drawDataPanel(comp, "HUD_tech_mem", 245, 655, 445, 180, "MEM STACK", "18.6", "GB", COLOR_WHITE);
        drawDataPanel(comp, "HUD_tech_temp", 245, 880, 445, 180, "THERMAL", "42.1", "C", COLOR_GREEN);
        drawDataPanel(comp, "HUD_tech_latency", 245, 1105, 445, 180, "LATENCY", "006", "MS", COLOR_YELLOW);
        drawDataPanel(comp, "HUD_tech_packet", 3150, 430, 445, 180, "PACKET FLOW", "1280", "K", COLOR_ACCENT);
        drawDataPanel(comp, "HUD_tech_signal", 3150, 655, 445, 180, "SIGNAL", "98.6", "%", COLOR_GREEN);
        drawDataPanel(comp, "HUD_tech_integrity", 3150, 880, 445, 180, "INTEGRITY", "0.997", "", COLOR_WHITE);
        drawDataPanel(comp, "HUD_tech_alert", 3150, 1105, 445, 180, "ALERT LEVEL", "LOW", "", COLOR_GREEN);
    }

    function drawTechMatrix(comp) {
        var layer = makeShapeLayer(comp, "HUD_tech_matrix_panel");
        var shell = addGroup(layer, "matrix shell");
        addRectToContents(shell, 245, 1385, 655, 370, 12);
        addFill(shell, COLOR_BLACK, 38);
        addStroke(shell, COLOR_WHITE, 2, 45);

        var cells = addGroup(layer, "matrix cells");
        for (var r = 0; r < 7; r++) {
            for (var col = 0; col < 12; col++) {
                if ((r * 5 + col * 3) % 7 < 4) {
                    addRectToContents(cells, 300 + col * 45, 1455 + r * 35, 26, 20, 2);
                }
            }
        }
        addFill(cells, COLOR_GREEN, 62);

        var cut = addGroup(layer, "matrix highlights");
        for (var i = 0; i < 9; i++) {
            addRectToContents(cut, 300 + i * 55, 1685, 34, 18, 2);
        }
        addFill(cut, COLOR_ACCENT, 80);
        addText(comp, "HUD_tech_matrix_title", "MATRIX INDEX", 300, 1430, 26, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_tech_matrix_value", "A9 / 44 / FF", 825, 1430, 25, COLOR_ACCENT, ParagraphJustification.RIGHT_JUSTIFY, 8);
    }

    function drawTechBottomGraph(comp) {
        var layer = makeShapeLayer(comp, "HUD_tech_bottom_graph");
        var shell = addGroup(layer, "graph shell");
        addRectToContents(shell, 1125, 1500, 1590, 255, 12);
        addFill(shell, COLOR_BLACK, 36);
        addStroke(shell, COLOR_WHITE, 2, 43);

        var baseline = addGroup(layer, "graph baseline");
        addLineToContents(baseline, 1185, 1688, 2655, 1688);
        for (var i = 0; i <= 18; i++) {
            var x = 1185 + i * 82;
            addLineToContents(baseline, x, 1674, x, 1702);
        }
        addStroke(baseline, COLOR_DIM, 1.6, 45);

        var bars = addGroup(layer, "graph bars");
        for (var j = 0; j < 48; j++) {
            var bx = 1210 + j * 29;
            var bh = 26 + Math.abs(Math.sin(j * 0.23) * 86) + Math.abs(Math.sin(j * 0.57) * 38);
            addLineToContents(bars, bx, 1668, bx, 1668 - bh);
        }
        addStroke(bars, COLOR_ACCENT, 5, 90);

        var yellow = addGroup(layer, "warning bars");
        for (var k = 38; k < 44; k++) {
            var yx = 1210 + k * 29;
            addLineToContents(yellow, yx, 1668, yx, 1588 - (k % 3) * 12);
        }
        addStroke(yellow, COLOR_YELLOW, 5, 90);

        addText(comp, "HUD_tech_graph_title", "SIGNAL HISTOGRAM", 1185, 1546, 26, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_tech_graph_value", "PEAK 91%    MEAN 64%    DROP 0.3%", 2638, 1546, 24, COLOR_WHITE, ParagraphJustification.RIGHT_JUSTIFY, 8);
    }

    function drawTechConnectors(comp) {
        var layer = makeShapeLayer(comp, "HUD_tech_connectors");
        var c = addGroup(layer, "panel connectors");
        addPolylineToContents(c, [[690, 520], [930, 520], [1120, 640]], false);
        addPolylineToContents(c, [[690, 745], [1040, 745], [1545, 560]], false);
        addPolylineToContents(c, [[690, 970], [1120, 970], [1700, 1365]], false);
        addPolylineToContents(c, [[690, 1195], [1040, 1195], [1240, 1160]], false);
        addPolylineToContents(c, [[3150, 520], [2910, 520], [2460, 610]], false);
        addPolylineToContents(c, [[3150, 745], [2820, 745], [2060, 705]], false);
        addPolylineToContents(c, [[3150, 970], [2860, 970], [2780, 1010]], false);
        addPolylineToContents(c, [[3150, 1195], [2805, 1195], [2260, 1260]], false);
        addStroke(c, COLOR_DIM, 1.8, 42);

        var dots = addGroup(layer, "connector dots");
        var points = [[930, 520], [1040, 745], [1120, 970], [1040, 1195], [2910, 520], [2820, 745], [2860, 970], [2805, 1195]];
        for (var i = 0; i < points.length; i++) {
            addEllipseToContents(dots, points[i][0] - 7, points[i][1] - 7, 14, 14);
        }
        addFill(dots, COLOR_WHITE, 52);
    }

    function drawTechFooter(comp) {
        addText(comp, "HUD_tech_footer_left", "NODE 00456     BUS A/C     VECTOR SYNC", 245, 1950, 24, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_tech_footer_mid", "DATA FRAME / 3840 x 2160 / LIVE OVERLAY", 1920, 1950, 24, COLOR_ACCENT, ParagraphJustification.CENTER_JUSTIFY, 8);
        addText(comp, "HUD_tech_footer_right", "CRC OK     STORAGE 256 GB     LINK STRONG", 3595, 1950, 24, COLOR_DIM, ParagraphJustification.RIGHT_JUSTIFY, 8);
    }

    function drawTechDataFrame(comp) {
        drawTechOuterFrame(comp);
        drawTechHeader(comp);
        drawTechGrid(comp);
        drawTechConnectors(comp);
        drawTechCenter(comp);
        drawTechSidePanels(comp);
        drawTechMatrix(comp);
        drawTechBottomGraph(comp);
        drawTechFooter(comp);
    }

    if (!app.project) app.newProject();
    app.beginUndoGroup("Tech Data Frame HUD Builder RV v1");
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
        drawTechDataFrame(comp);
        try {
            ctrl.moveToBeginning();
        } catch (ignored) {
        }
        comp.openInViewer();
    } catch (err) {
        alert("Tech Data Frame HUD Builder problems:\n\n- " + err.toString() + (err.line ? " line " + err.line : ""));
    } finally {
        app.endUndoGroup();
    }
})();
