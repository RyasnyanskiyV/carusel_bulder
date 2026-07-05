#target aftereffects
#targetengine "BodycamFrameHUDBuilderRVV1"

/*
    bodycam_frame_HUD_builder_RV v1
    Adobe After Effects 2022+

    Procedural rough documentary bodycam frame overlay.
    This preset does not use a reference image. It builds a lightweight,
    editable 3840 x 2160 HUD from native text layers and Bezier shape paths.
*/

(function BodycamFrameHUDBuilderRVV1() {
    var COMP_W = 3840;
    var COMP_H = 2160;
    var COMP_DURATION = 10;
    var FPS = 30;
    var COMP_BASE = "BODYCAM_FRAME_MAIN";
    var CTRL_NAME = "HUD_CONTROL";

    var FONT_CANDIDATES = [
        "ShareTechMono-Regular",
        "Share Tech Mono",
        "OCR-A",
        "OCR A Extended",
        "DINCondensed-Bold",
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

    function drawMinimalCorners(comp) {
        var layer = makeShapeLayer(comp, "HUD_minimal_frame");
        var c = addGroup(layer, "premium corners");
        var x1 = 235;
        var x2 = 3605;
        var y1 = 190;
        var y2 = 1970;
        var h = 270;
        var v = 175;
        addLineToContents(c, x1, y1, x1 + h, y1);
        addLineToContents(c, x1, y1, x1, y1 + v);
        addLineToContents(c, x2, y1, x2 - h, y1);
        addLineToContents(c, x2, y1, x2, y1 + v);
        addLineToContents(c, x1, y2, x1 + h, y2);
        addLineToContents(c, x1, y2, x1, y2 - v);
        addLineToContents(c, x2, y2, x2 - h, y2);
        addLineToContents(c, x2, y2, x2, y2 - v);
        addStroke(c, COLOR_WHITE, 3, 92);

        var safe = addGroup(layer, "subtle safe marks");
        addLineToContents(safe, 960, 1080, 1090, 1080);
        addLineToContents(safe, 2750, 1080, 2880, 1080);
        addLineToContents(safe, 1920, 565, 1920, 690);
        addLineToContents(safe, 1920, 1470, 1920, 1595);
        addStroke(safe, COLOR_DIM, 2, 42);
    }

    function drawMinimalRec(comp) {
        var dot = makeShapeLayer(comp, "HUD_minimal_rec_dot");
        var d = addGroup(dot, "rec dot");
        addEllipseToContents(d, 305, 295, 32, 32);
        addFill(d, COLOR_RED, 100);
        addText(comp, "HUD_minimal_rec", "REC", 360, 328, 34, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 20);
        addText(comp, "HUD_minimal_tc", "00:01:24:12", 306, 400, 36, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 12);
    }

    function drawMinimalTopRight(comp) {
        addText(comp, "HUD_minimal_format", "4K  23.98", 3340, 318, 30, COLOR_WHITE, ParagraphJustification.RIGHT_JUSTIFY, 12);
        addText(comp, "HUD_minimal_codec", "LOG  HQ", 3340, 390, 28, COLOR_DIM, ParagraphJustification.RIGHT_JUSTIFY, 12);

        var batt = makeShapeLayer(comp, "HUD_minimal_battery");
        var b = addGroup(batt, "battery");
        addRectToContents(b, 3420, 455, 132, 42, 3);
        addRectToContents(b, 3552, 469, 10, 16, 1);
        addStroke(b, COLOR_WHITE, 3, 80);
        var fill = addGroup(batt, "battery fill");
        addRectToContents(fill, 3431, 466, 88, 20, 1);
        addFill(fill, COLOR_GREEN, 100);
        addText(comp, "HUD_minimal_battery_text", "82%", 3340, 493, 26, COLOR_GREEN, ParagraphJustification.RIGHT_JUSTIFY, 6);
    }

    function drawMinimalCenter(comp) {
        var layer = makeShapeLayer(comp, "HUD_minimal_center");
        var c = addGroup(layer, "center mark");
        addLineToContents(c, 1888, 1080, 1910, 1080);
        addLineToContents(c, 1930, 1080, 1952, 1080);
        addLineToContents(c, 1920, 1048, 1920, 1070);
        addLineToContents(c, 1920, 1090, 1920, 1112);
        addStroke(c, COLOR_WHITE, 2, 60);
    }

    function drawMinimalBottom(comp) {
        var rail = makeShapeLayer(comp, "HUD_minimal_bottom_rail");
        var r = addGroup(rail, "rail");
        addLineToContents(r, 1385, 1904, 2455, 1904);
        addStroke(r, COLOR_DIM, 2, 55);

        addText(comp, "HUD_minimal_lens", "35mm", 1390, 1872, 28, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_minimal_aperture", "T2.8", 1645, 1872, 28, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_minimal_iso", "ISO 800", 1905, 1872, 28, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_minimal_media", "47 min", 2220, 1872, 28, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
    }

    function drawMinimalSideMarks(comp) {
        var layer = makeShapeLayer(comp, "HUD_minimal_side_ticks");
        var c = addGroup(layer, "side ticks");
        addLineToContents(c, 235, 1080, 285, 1080);
        addLineToContents(c, 3555, 1080, 3605, 1080);
        addLineToContents(c, 1920, 190, 1920, 240);
        addLineToContents(c, 1920, 1920, 1920, 1970);
        addStroke(c, COLOR_WHITE, 2, 70);

        addText(comp, "HUD_minimal_left_label", "STBY", 305, 1775, 24, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_minimal_right_label", "CINE", 3535, 1775, 24, COLOR_DIM, ParagraphJustification.RIGHT_JUSTIFY, 8);
    }

    function drawMinimalRECFrame(comp) {
        drawMinimalCorners(comp);
        drawMinimalRec(comp);
        drawMinimalTopRight(comp);
        drawMinimalCenter(comp);
        drawMinimalBottom(comp);
        drawMinimalSideMarks(comp);
    }

    function drawBodycamTag(comp, name, x, y, w, h, label, value, color) {
        var layer = makeShapeLayer(comp, name + "_tag");
        var c = addGroup(layer, "tag box");
        addRectToContents(c, x, y, w, h, 2);
        addFill(c, COLOR_BLACK, 40);
        addStroke(c, COLOR_WHITE, 2.2, 62);

        var edge = addGroup(layer, "tag edge");
        addLineToContents(edge, x, y + h, x + w, y + h);
        addStroke(edge, color || COLOR_ACCENT, 3, 92);

        addText(comp, name + "_label", label, x + 18, y + 32, 20, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 6);
        addText(comp, name + "_value", value, x + 18, y + h - 16, 34, color || COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
    }

    function drawBodycamFrame(comp) {
        var layer = makeShapeLayer(comp, "HUD_bodycam_frame");
        var c = addGroup(layer, "rough frame");
        addLineToContents(c, 128, 118, 780, 118);
        addLineToContents(c, 128, 118, 128, 410);
        addLineToContents(c, 112, 138, 112, 385);
        addLineToContents(c, 3062, 118, 3712, 118);
        addLineToContents(c, 3712, 118, 3712, 410);
        addLineToContents(c, 3728, 138, 3728, 385);
        addLineToContents(c, 128, 2042, 780, 2042);
        addLineToContents(c, 128, 2042, 128, 1750);
        addLineToContents(c, 112, 2022, 112, 1775);
        addLineToContents(c, 3062, 2042, 3712, 2042);
        addLineToContents(c, 3712, 2042, 3712, 1750);
        addLineToContents(c, 3728, 2022, 3728, 1775);
        addStroke(c, COLOR_WHITE, 4, 88);

        var safe = addGroup(layer, "sensor safe marks");
        addLineToContents(safe, 820, 1080, 980, 1080);
        addLineToContents(safe, 2860, 1080, 3020, 1080);
        addLineToContents(safe, 1920, 600, 1920, 735);
        addLineToContents(safe, 1920, 1425, 1920, 1560);
        addLineToContents(safe, 1850, 1080, 1900, 1080);
        addLineToContents(safe, 1940, 1080, 1990, 1080);
        addStroke(safe, COLOR_DIM, 2.4, 48);
    }

    function drawBodycamHeader(comp) {
        var rec = makeShapeLayer(comp, "HUD_bodycam_rec_dot");
        var d = addGroup(rec, "rec dot");
        addEllipseToContents(d, 178, 170, 42, 42);
        addFill(d, COLOR_RED, 100);

        addText(comp, "HUD_bodycam_rec", "REC", 242, 209, 46, COLOR_RED, ParagraphJustification.LEFT_JUSTIFY, 14);
        addText(comp, "HUD_bodycam_timecode", "00:17:42", 178, 285, 58, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_bodycam_date", "2026-07-05  18:24:09", 178, 342, 28, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 6);

        drawBodycamTag(comp, "HUD_bodycam_unit", 2558, 154, 460, 118, "UNIT", "BC-AX7-203", COLOR_ACCENT);
        drawBodycamTag(comp, "HUD_bodycam_case", 3068, 154, 560, 118, "CASE ID", "EV-2026-0719", COLOR_WHITE);
        addText(comp, "HUD_bodycam_pre_event", "PRE-EVENT BUFFER 30s", 3068, 332, 26, COLOR_YELLOW, ParagraphJustification.LEFT_JUSTIFY, 8);
    }

    function drawBodycamInfoPanels(comp) {
        drawBodycamTag(comp, "HUD_bodycam_gps", 178, 1500, 480, 120, "GPS", "13.7563 N / 100.5018 E", COLOR_GREEN);
        drawBodycamTag(comp, "HUD_bodycam_signal", 178, 1658, 480, 120, "SIGNAL", "LTE  -72 dBm", COLOR_ACCENT);
        drawBodycamTag(comp, "HUD_bodycam_storage", 178, 1816, 480, 120, "STORAGE", "128GB  41% USED", COLOR_WHITE);

        drawBodycamTag(comp, "HUD_bodycam_battery", 3182, 1500, 480, 120, "BATTERY", "74%", COLOR_GREEN);
        drawBodycamTag(comp, "HUD_bodycam_audio", 3182, 1658, 480, 120, "AUDIO", "MIC A+B  ON", COLOR_WHITE);
        drawBodycamTag(comp, "HUD_bodycam_chain", 3182, 1816, 480, 120, "CHAIN", "HASH OK", COLOR_GREEN);
    }

    function drawBodycamBattery(comp) {
        var layer = makeShapeLayer(comp, "HUD_bodycam_battery_icon");
        var c = addGroup(layer, "battery");
        addRectToContents(c, 3430, 306, 180, 58, 2);
        addRectToContents(c, 3610, 325, 15, 20, 1);
        addStroke(c, COLOR_WHITE, 3, 82);

        var fill = addGroup(layer, "battery fill");
        addRectToContents(fill, 3444, 320, 122, 30, 1);
        addFill(fill, COLOR_GREEN, 92);
        addText(comp, "HUD_bodycam_battery_top", "74%", 3385, 352, 27, COLOR_GREEN, ParagraphJustification.RIGHT_JUSTIFY, 6);
    }

    function drawBodycamAudioMeters(comp) {
        addText(comp, "HUD_bodycam_audio_label", "AUDIO", 1520, 1936, 24, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_bodycam_ch1", "L", 1520, 1995, 24, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
        addText(comp, "HUD_bodycam_ch2", "R", 1520, 2045, 24, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);

        var layer = makeShapeLayer(comp, "HUD_bodycam_audio_meters");
        var bars = addGroup(layer, "meter bars");
        for (var i = 0; i < 24; i++) {
            var x = 1580 + i * 22;
            addRectToContents(bars, x, 1972, 12, 24, 0);
            addRectToContents(bars, x, 2022, 12, 24, 0);
        }
        addFill(bars, COLOR_GREEN, 90);

        var hot = addGroup(layer, "meter hot");
        for (var j = 20; j < 24; j++) {
            var hx = 1580 + j * 22;
            addRectToContents(hot, hx, 1972, 12, 24, 0);
            addRectToContents(hot, hx, 2022, 12, 24, 0);
        }
        addFill(hot, COLOR_YELLOW, 92);
    }

    function drawBodycamDistortion(comp) {
        var layer = makeShapeLayer(comp, "HUD_bodycam_distortion_marks");
        var c = addGroup(layer, "scan tears");
        for (var i = 0; i < 34; i++) {
            var y = 435 + i * 42;
            var x1 = 510 + ((i * 137) % 230);
            var len = 38 + ((i * 29) % 96);
            addLineToContents(c, x1, y, x1 + len, y);
        }
        for (var j = 0; j < 28; j++) {
            var ry = 520 + j * 47;
            var rx = 3060 + ((j * 83) % 270);
            addLineToContents(c, rx, ry, rx + 28 + ((j * 19) % 70), ry);
        }
        addStroke(c, COLOR_WHITE, 1.4, 24);

        var noise = addGroup(layer, "sensor specks");
        for (var k = 0; k < 85; k++) {
            var nx = 420 + ((k * 211) % 3000);
            var ny = 420 + ((k * 157) % 1240);
            var s = 3 + (k % 3);
            addRectToContents(noise, nx, ny, s, s, 0);
        }
        addFill(noise, COLOR_WHITE, 22);
    }

    function drawBodycamCenter(comp) {
        var layer = makeShapeLayer(comp, "HUD_bodycam_center");
        var c = addGroup(layer, "center rough mark");
        addLineToContents(c, 1865, 1080, 1900, 1080);
        addLineToContents(c, 1940, 1080, 1975, 1080);
        addLineToContents(c, 1920, 1025, 1920, 1060);
        addLineToContents(c, 1920, 1100, 1920, 1135);
        addRectToContents(c, 1887, 1047, 66, 66, 0);
        addStroke(c, COLOR_WHITE, 2.6, 70);

        addText(comp, "HUD_bodycam_center_label", "AUTO EXP  /  WIDE", 1920, 1188, 24, COLOR_DIM, ParagraphJustification.CENTER_JUSTIFY, 8);
    }

    function drawBodycamFooter(comp) {
        var layer = makeShapeLayer(comp, "HUD_bodycam_footer_lines");
        var c = addGroup(layer, "footer lines");
        addLineToContents(c, 760, 1988, 1390, 1988);
        addLineToContents(c, 2450, 1988, 3080, 1988);
        addLineToContents(c, 1920, 1892, 1920, 1942);
        addStroke(c, COLOR_DIM, 2, 50);

        addText(comp, "HUD_bodycam_footer_left", "OFFICER: VR-204    DISTRICT: CENTRAL", 760, 2042, 25, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 6);
        addText(comp, "HUD_bodycam_footer_mid", "BODYCAM / DOCUMENTARY FRAME", 1920, 2042, 25, COLOR_WHITE, ParagraphJustification.CENTER_JUSTIFY, 8);
        addText(comp, "HUD_bodycam_footer_right", "GPS LOCK    EVIDENCE SYNCED", 3080, 2042, 25, COLOR_DIM, ParagraphJustification.RIGHT_JUSTIFY, 6);
    }

    function drawBodycamFrameHUD(comp) {
        drawBodycamFrame(comp);
        drawBodycamHeader(comp);
        drawBodycamBattery(comp);
        drawBodycamDistortion(comp);
        drawBodycamCenter(comp);
        drawBodycamInfoPanels(comp);
        drawBodycamAudioMeters(comp);
        drawBodycamFooter(comp);
    }

    if (!app.project) app.newProject();
    app.beginUndoGroup("Bodycam Frame HUD Builder RV v1");
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
        drawBodycamFrameHUD(comp);
        try {
            ctrl.moveToBeginning();
        } catch (ignored) {
        }
        comp.openInViewer();
    } catch (err) {
        alert("Bodycam Frame HUD Builder problems:\n\n- " + err.toString() + (err.line ? " line " + err.line : ""));
    } finally {
        app.endUndoGroup();
    }
})();
