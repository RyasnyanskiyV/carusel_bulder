#target aftereffects
#targetengine "SVHSCamcorderHUDBuilderRVV1"

/*
    svhs_camcorder_HUD_builder_RV v1
    Adobe After Effects 2022+

    Procedural S-VHS camcorder-style HUD overlay.
    The script builds a clean, editable 3840 x 2160 composition from native
    shape and text layers. It does not trace pixels, so the result stays light.
*/

(function SVHSCamcorderHUDBuilderRVV1() {
    var COMP_W = 3840;
    var COMP_H = 2160;
    var COMP_DURATION = 10;
    var FPS = 30;
    var COMP_BASE = "SVHS_CAMCORDER_HUD_MAIN";
    var CTRL_NAME = "HUD_CONTROL";

    // Text is drawn as native shape pixels, so it does not depend on installed fonts.
    var PIXEL_FONT_ROWS = 7;
    var PIXEL_FILL = 0.82;

    var FX_HUD_SCALE = "HUD Scale (%)";
    var FX_GLOBAL_OPACITY = "HUD Opacity (%)";
    var FX_GUIDE_OPACITY = "Guide Opacity (%)";
    var FX_WHITE_COLOR = "White Color";
    var FX_DIM_COLOR = "Dim Color";
    var FX_RED_COLOR = "REC Red";
    var FX_GREEN_COLOR = "Meter Green";
    var FX_YELLOW_COLOR = "Meter Yellow";

    var COLOR_WHITE = [0.92, 0.95, 0.98];
    var COLOR_DIM = [0.50, 0.58, 0.62];
    var COLOR_RED = [1.00, 0.02, 0.03];
    var COLOR_GREEN = [0.16, 0.95, 0.16];
    var COLOR_YELLOW = [0.96, 0.82, 0.10];
    var COLOR_BLACK = [0, 0, 0];

    var LINE_W = 6;
    var THIN_W = 4;

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
        if (colorsMatch(color, COLOR_RED)) return FX_RED_COLOR;
        if (colorsMatch(color, COLOR_GREEN)) return FX_GREEN_COLOR;
        if (colorsMatch(color, COLOR_YELLOW)) return FX_YELLOW_COLOR;
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
        addColor(fx, FX_RED_COLOR, COLOR_RED);
        addColor(fx, FX_GREEN_COLOR, COLOR_GREEN);
        addColor(fx, FX_YELLOW_COLOR, COLOR_YELLOW);
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

    function addLineToContents(contents, x1, y1, x2, y2) {
        var pathGroup = contents.addProperty("ADBE Vector Shape - Group");
        var path = pathGroup.property("ADBE Vector Shape");
        var shape = new Shape();
        shape.vertices = [[x1, y1], [x2, y2]];
        shape.inTangents = [[0, 0], [0, 0]];
        shape.outTangents = [[0, 0], [0, 0]];
        shape.closed = false;
        path.setValue(shape);
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

    function addRectToContents(contents, x, y, w, h, roundness) {
        // Bezier paths are more stable than parametric Rect shapes across AE 22+.
        var r = Math.max(0, Math.min(roundness || 0, Math.min(w, h) * 0.5));
        if (r <= 0) {
            return addPathToContents(
                contents,
                [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
                [[0, 0], [0, 0], [0, 0], [0, 0]],
                [[0, 0], [0, 0], [0, 0], [0, 0]],
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
                [0, 0],
                [0, 0],
                [0, -r * k],
                [0, 0],
                [r * k, 0],
                [0, 0],
                [0, r * k],
                [0, 0]
            ],
            [
                [0, 0],
                [r * k, 0],
                [0, 0],
                [0, r * k],
                [0, 0],
                [-r * k, 0],
                [0, 0],
                [0, -r * k]
            ],
            true
        );
    }

    function addEllipseToContents(contents, x, y, w, h) {
        // Bezier ellipse avoids parametric Ellipse compatibility issues.
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

    var PIXEL_FONT = {
        "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
        "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
        "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
        "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
        "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
        "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
        "G": ["01111", "10000", "10000", "10011", "10001", "10001", "01110"],
        "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
        "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
        "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
        "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
        "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
        "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
        "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
        "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
        "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
        "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
        "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
        "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
        "V": ["10001", "10001", "10001", "10001", "01010", "01010", "00100"],
        "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
        "X": ["10001", "01010", "00100", "00100", "00100", "01010", "10001"],
        "Y": ["10001", "01010", "00100", "00100", "00100", "00100", "00100"],
        "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
        "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
        "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
        "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
        "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
        "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
        "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
        "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
        "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
        "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
        "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
        ":": ["00000", "00100", "00100", "00000", "00100", "00100", "00000"],
        "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
        "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
        ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
        "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
        "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
        " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
        "d": ["00001", "00001", "01101", "10011", "10001", "10011", "01101"],
        "m": ["00000", "00000", "11010", "10101", "10101", "10101", "10101"],
        "i": ["00100", "00000", "01100", "00100", "00100", "00100", "01110"],
        "n": ["00000", "00000", "11110", "10001", "10001", "10001", "10001"],
        "?": ["11111", "00001", "00010", "00100", "00000", "00100", "00000"]
    };

    function pixelPattern(ch) {
        if (PIXEL_FONT[ch]) return PIXEL_FONT[ch];
        var upper = String(ch).toUpperCase();
        return PIXEL_FONT[upper] || PIXEL_FONT["?"];
    }

    function measurePixelText(text, cell, letterGap) {
        if (!text || text.length === 0) return 0;
        var w = 0;
        for (var i = 0; i < text.length; i++) {
            var pattern = pixelPattern(text.charAt(i));
            w += pattern[0].length * cell;
            if (i < text.length - 1) w += letterGap;
        }
        return w;
    }

    function addText(comp, name, text, x, y, size, color, align, tracking) {
        var layer = makeShapeLayer(comp, name);
        layer.label = 2;
        var contents = addGroup(layer, "pixel_text");
        var cell = size / PIXEL_FONT_ROWS;
        var block = cell * PIXEL_FILL;
        var letterGap = tracking === undefined ? cell * 0.42 : tracking * 0.18;
        var drawX = x;
        var drawY = y - size;

        var textWidth = measurePixelText(text, cell, letterGap);
        if (align === ParagraphJustification.CENTER_JUSTIFY) {
            drawX -= textWidth * 0.5;
        } else if (align === ParagraphJustification.RIGHT_JUSTIFY) {
            drawX -= textWidth;
        }

        for (var i = 0; i < text.length; i++) {
            var pattern = pixelPattern(text.charAt(i));
            for (var row = 0; row < pattern.length; row++) {
                for (var col = 0; col < pattern[row].length; col++) {
                    if (pattern[row].charAt(col) === "1") {
                        addRectToContents(
                            contents,
                            drawX + col * cell,
                            drawY + row * cell,
                            block,
                            block,
                            0
                        );
                    }
                }
            }
            drawX += pattern[0].length * cell + letterGap;
        }
        addFill(contents, color, 100);
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

    function drawFrameCorners(comp) {
        var layer = makeShapeLayer(comp, "HUD_frame_corners");
        var c = addGroup(layer, "corners");

        var m = 150;
        var yTop = 80;
        var yBottom = COMP_H - 145;
        var hLen = 330;
        var vLen = 320;

        addLineToContents(c, m, yTop, m + hLen, yTop);
        addLineToContents(c, m, yTop, m, yTop + vLen);

        addLineToContents(c, COMP_W - m - hLen, yTop, COMP_W - m, yTop);
        addLineToContents(c, COMP_W - m, yTop, COMP_W - m, yTop + vLen);

        addLineToContents(c, m, yBottom - vLen, m, yBottom);
        addLineToContents(c, m, yBottom, m + hLen, yBottom);

        addLineToContents(c, COMP_W - m, yBottom - vLen, COMP_W - m, yBottom);
        addLineToContents(c, COMP_W - m - hLen, yBottom, COMP_W - m, yBottom);
        addStroke(c, COLOR_WHITE, LINE_W, 100);
    }

    function drawRecBlock(comp) {
        addText(comp, "HUD_rec_text", "REC", 250, 270, 100, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 40);

        var dot = makeShapeLayer(comp, "HUD_rec_dot");
        var d = addGroup(dot, "rec_dot");
        addEllipseToContents(d, 535, 177, 90, 90);
        addFill(d, COLOR_RED, 100);

        addText(comp, "HUD_timecode", "0:23:45", 250, 450, 92, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 24);
        addText(comp, "HUD_sp", "SP", 250, 590, 82, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 24);

        var line = makeShapeLayer(comp, "HUD_sp_underline");
        var c = addGroup(line, "underline");
        addLineToContents(c, 250, 630, 375, 630);
        addStroke(c, COLOR_WHITE, THIN_W, 100);
    }

    function drawBatteryBlock(comp) {
        var layer = makeShapeLayer(comp, "HUD_battery");
        var c = addGroup(layer, "battery");

        var x = 3300;
        var y = 180;
        var w = 275;
        var h = 95;
        addRectToContents(c, x, y, w, h, 0);
        addRectToContents(c, x - 22, y + 28, 22, 38, 0);
        addStroke(c, COLOR_WHITE, LINE_W, 100);

        var fillGroup = addGroup(layer, "battery_cells");
        for (var i = 0; i < 4; i++) {
            addRectToContents(fillGroup, x + 78 + i * 52, y + 20, 34, 55, 0);
        }
        addFill(fillGroup, COLOR_WHITE, 100);

        addText(comp, "HUD_68min", "68min", 3060, 450, 88, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 18);
        drawTapeIcon(comp);
    }

    function drawTapeIcon(comp) {
        var layer = makeShapeLayer(comp, "HUD_tape_icon");
        var c = addGroup(layer, "tape");
        addRectToContents(c, 3450, 355, 132, 78, 0);
        addEllipseToContents(c, 3485, 376, 36, 36);
        addEllipseToContents(c, 3540, 376, 36, 36);
        addLineToContents(c, 3520, 394, 3540, 394);
        addStroke(c, COLOR_WHITE, THIN_W, 100);
    }

    function drawLeftSettings(comp) {
        addText(comp, "HUD_blc", "BLC", 250, 1505, 76, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 28);
        addText(comp, "HUD_on", "ON", 250, 1615, 76, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 28);
        addText(comp, "HUD_white_bal", "WHITE BAL", 250, 1785, 76, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 28);
        addText(comp, "HUD_indoor", "INDOOR", 250, 1900, 76, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 28);
    }

    function drawAudioMeterRow(comp, name, y) {
        addText(comp, name + "_label", name, 2560, y + 60, 70, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 18);

        var layer = makeShapeLayer(comp, "HUD_" + name + "_meter");
        var x0 = 2760;
        var bw = 30;
        var bh = 70;
        var gap = 18;

        var white = addGroup(layer, name + "_white_bars");
        for (var i = 0; i < 12; i++) {
            addRectToContents(white, x0 + i * (bw + gap), y, bw, bh, 0);
        }
        addFill(white, COLOR_WHITE, 100);

        var yellow = addGroup(layer, name + "_yellow_bars");
        addRectToContents(yellow, x0 + 12 * (bw + gap), y, bw, bh, 0);
        addRectToContents(yellow, x0 + 13 * (bw + gap), y, bw, bh, 0);
        addFill(yellow, COLOR_YELLOW, 100);

        var red = addGroup(layer, name + "_red_bar");
        addRectToContents(red, x0 + 14 * (bw + gap), y, bw, bh, 0);
        addFill(red, COLOR_RED, 100);

        var dashes = addGroup(layer, name + "_dashes");
        var dx = x0 + 15 * (bw + gap) + 12;
        addLineToContents(dashes, dx, y + bh * 0.5, dx + 45, y + bh * 0.5);
        addLineToContents(dashes, dx + 65, y + bh * 0.5, dx + 110, y + bh * 0.5);
        addStroke(dashes, COLOR_WHITE, THIN_W, 100);
    }

    function drawAudioMeters(comp) {
        drawAudioMeterRow(comp, "CH1", 1410);
        drawAudioMeterRow(comp, "CH2", 1535);
    }

    function drawDateTime(comp) {
        addText(comp, "HUD_pm_time", "PM  7:28", 3060, 1850, 92, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 28);
        addText(comp, "HUD_date", "MAY 18 1996", 2730, 2015, 92, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 28);
    }

    function drawVhsScanNoise(comp) {
        var layer = makeShapeLayer(comp, "HUD_small_scanline_breaks");
        var c = addGroup(layer, "breaks");
        var ys = [74, 82, 1480, 1532, 1990, 2056];
        for (var i = 0; i < ys.length; i++) {
            addLineToContents(c, 175, ys[i], 455, ys[i] + (i % 2));
            addLineToContents(c, COMP_W - 455, ys[i], COMP_W - 175, ys[i] + (i % 2));
        }
        addStroke(c, COLOR_DIM, 2, 36);
    }

    function drawChromaticHints(comp) {
        var layer = makeShapeLayer(comp, "HUD_rgb_edge_hints");
        var red = addGroup(layer, "red_offset");
        addLineToContents(red, 153, 83, 153, 397);
        addLineToContents(red, 153, COMP_H - 462, 153, COMP_H - 147);
        addStroke(red, COLOR_RED, 2, 30);

        var cyan = addGroup(layer, "cyan_offset");
        addLineToContents(cyan, COMP_W - 147, 83, COMP_W - 147, 397);
        addLineToContents(cyan, COMP_W - 147, COMP_H - 462, COMP_W - 147, COMP_H - 147);
        addStroke(cyan, COLOR_DIM, 2, 35);
    }

    function drawSVHSLogo(comp) {
        var layer = makeShapeLayer(comp, "HUD_svhs_logo_box");
        var c = addGroup(layer, "box");
        addRectToContents(c, 175, 90, 405, 135, 0);
        addStroke(c, COLOR_WHITE, 6, 100);
        addText(comp, "HUD_svhs_logo_text", "S-VHS", 195, 198, 78, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 10);
    }

    function drawSVHSTopLeft(comp) {
        drawSVHSLogo(comp);
        addText(comp, "HUD_svhs_sp", "SP", 745, 195, 70, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 10);
        addText(comp, "HUD_svhs_rec", "REC", 175, 370, 104, COLOR_RED, ParagraphJustification.LEFT_JUSTIFY, 8);
        var dot = makeShapeLayer(comp, "HUD_svhs_rec_dot");
        var d = addGroup(dot, "dot");
        addEllipseToContents(d, 480, 275, 100, 100);
        addFill(d, COLOR_RED, 100);
        addText(comp, "HUD_svhs_timecode", "0:27:48", 175, 525, 84, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
    }

    function drawTapeRemain(comp) {
        addText(comp, "HUD_tape_remain_label", "TAPE REMAIN", 2845, 175, 72, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);
        addText(comp, "HUD_tape_remain_time", "1:23", 3070, 315, 82, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 8);

        var layer = makeShapeLayer(comp, "HUD_tape_battery");
        var c = addGroup(layer, "battery");
        addRectToContents(c, 3486, 238, 195, 72, 0);
        addRectToContents(c, 3462, 258, 24, 32, 0);
        addStroke(c, COLOR_WHITE, 6, 100);
        var fill = addGroup(layer, "fill");
        addPolylineToContents(fill, [[3530, 253], [3655, 253], [3635, 296], [3510, 296]], true);
        addFill(fill, COLOR_WHITE, 100);
    }

    function drawMFScale(comp) {
        addText(comp, "HUD_mf_label", "MF", 175, 790, 68, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
        addText(comp, "HUD_mf_inf", "INF", 175, 930, 36, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_mf_5", "5", 200, 1028, 43, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_mf_2", "2", 200, 1110, 43, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_mf_1", "1", 200, 1192, 43, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_mf_03", "0.3", 160, 1322, 43, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_mf_m", "m", 195, 1430, 55, COLOR_GREEN, ParagraphJustification.LEFT_JUSTIFY, 0);

        var layer = makeShapeLayer(comp, "HUD_mf_scale");
        var c = addGroup(layer, "ticks");
        var x = 315;
        addLineToContents(c, x, 900, x, 1288);
        var ys = [900, 970, 1038, 1108, 1178, 1248, 1288];
        for (var i = 0; i < ys.length; i++) {
            addLineToContents(c, x - 35, ys[i], x, ys[i]);
        }
        addStroke(c, COLOR_WHITE, 6, 100);
        var marker = addGroup(layer, "green_marker");
        addRectToContents(marker, x + 8, 1058, 62, 16, 0);
        addFill(marker, COLOR_GREEN, 100);
    }

    function drawSVHSCrosshair(comp) {
        var layer = makeShapeLayer(comp, "HUD_svhs_crosshair");
        var c = addGroup(layer, "crosshair");
        var cx = COMP_W * 0.5;
        var cy = COMP_H * 0.5 + 5;
        addLineToContents(c, cx - 185, cy, cx + 185, cy);
        addLineToContents(c, cx, cy - 185, cx, cy + 185);
        addStroke(c, COLOR_WHITE, 5, 86);
    }

    function drawZebraBlock(comp) {
        addText(comp, "HUD_zebra_label", "ZEBRA", 3400, 850, 67, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
        addText(comp, "HUD_zebra_percent", "70%", 3510, 960, 60, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);

        var layer = makeShapeLayer(comp, "HUD_zebra_box");
        var box = addGroup(layer, "box");
        addRectToContents(box, 3410, 985, 260, 130, 0);
        addStroke(box, COLOR_WHITE, 6, 100);
        var stripes = addGroup(layer, "stripes");
        for (var i = 0; i < 6; i++) {
            var x = 3420 + i * 48;
            addPolylineToContents(stripes, [[x, 1110], [x + 42, 990], [x + 78, 990], [x + 36, 1110]], true);
        }
        addFill(stripes, COLOR_WHITE, 100);
    }

    function drawCameraReadout(comp) {
        addText(comp, "HUD_svhs_wb", "WB 5600K", 3218, 1675, 70, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 6);
        addText(comp, "HUD_svhs_f", "F1.8", 3450, 1800, 66, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 6);
        addText(comp, "HUD_svhs_gain", "6dB", 3505, 1930, 66, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 6);
        addText(comp, "HUD_svhs_shutter", "1/60", 3445, 2060, 66, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 6);
    }

    function drawSVHSAudioMeter(comp, name, y) {
        addText(comp, "HUD_svhs_" + name + "_label", name, 175, y + 48, 58, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 4);
        var layer = makeShapeLayer(comp, "HUD_svhs_" + name + "_meter");
        var green = addGroup(layer, "green_bars");
        var x0 = 410;
        var bw = 42;
        var bh = 48;
        var gap = 12;
        for (var i = 0; i < 22; i++) {
            addRectToContents(green, x0 + i * (bw + gap), y, bw, bh, 0);
        }
        addFill(green, COLOR_GREEN, 100);

        var yellow = addGroup(layer, "yellow_bars");
        for (var j = 22; j < 31; j++) {
            addRectToContents(yellow, x0 + j * (bw + gap), y, bw, bh, 0);
        }
        addFill(yellow, COLOR_YELLOW, 100);

        var red = addGroup(layer, "red_bars");
        for (var r = 31; r < 36; r++) {
            addRectToContents(red, x0 + r * (bw + gap), y, bw, bh, 0);
        }
        addFill(red, COLOR_RED, 100);
    }

    function drawSVHSAudioMeters(comp) {
        addText(comp, "HUD_svhs_audio_inf", "-INF", 370, 1810, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_svhs_audio_20", "-20", 705, 1810, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_svhs_audio_10", "-10", 1015, 1810, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_svhs_audio_6", "-6", 1320, 1810, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_svhs_audio_3", "-3", 1605, 1810, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_svhs_audio_0", "0", 1890, 1810, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);
        addText(comp, "HUD_svhs_audio_p3", "+3", 2130, 1810, 42, COLOR_WHITE, ParagraphJustification.LEFT_JUSTIFY, 0);

        drawSVHSAudioMeter(comp, "CH1", 1855);
        drawSVHSAudioMeter(comp, "CH2", 1972);

        var layer = makeShapeLayer(comp, "HUD_svhs_audio_peak");
        var c = addGroup(layer, "peak");
        addLineToContents(c, 1908, 1845, 1908, 2048);
        addLineToContents(c, 1890, 1845, 1926, 1845);
        addStroke(c, COLOR_WHITE, 5, 88);
    }

    function drawSVHSHUD(comp) {
        drawSVHSTopLeft(comp);
        drawTapeRemain(comp);
        drawMFScale(comp);
        drawSVHSCrosshair(comp);
        drawZebraBlock(comp);
        drawCameraReadout(comp);
        drawSVHSAudioMeters(comp);
    }

    function buildHUD(comp) {
        drawSVHSHUD(comp);
    }

    var guideFile = null;
    if (confirm("Add reference image as guide layer?")) {
        guideFile = File.openDialog(
            "Choose reference image",
            "Images:*.png;*.jpg;*.jpeg;*.tif;*.tiff;*.bmp;*.gif;*.psd"
        );
    }

    if (!app.project) app.newProject();
    app.beginUndoGroup("S-VHS Camcorder HUD Builder RV v1");
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
        alert("S-VHS Camcorder HUD Builder problems:\n\n- " + err.toString() + (err.line ? " line " + err.line : ""));
    } finally {
        app.endUndoGroup();
    }
})();
