#target aftereffects
#targetengine "DJIHUDBuilderRVV11"

/*
    dji_HUD_builder_RV v1.1
    Adobe After Effects 2022+

    Procedural DJI-style HUD builder.
    This script does not trace pixels. It builds a clean, editable HUD from
    native After Effects shape and text layers.
*/

(function DJIHUDBuilderRVV11() {
    var COMP_W = 3840;
    var COMP_H = 2160;
    var COMP_DURATION = 10;
    var FPS = 30;
    var COMP_BASE = "DJI_HUD_MAIN";
    var CTRL_NAME = "HUD_CONTROL";

    // Change this once, and every text layer will use the new HUD typeface.
    var HUD_FONT = "Consolas";

    var FX_HUD_SCALE = "HUD Scale (%)";
    var FX_GLOBAL_OPACITY = "HUD Opacity (%)";
    var FX_GUIDE_OPACITY = "Guide Opacity (%)";
    var FX_LAYOUT_PRESET = "Layout Preset";
    var FX_TEXT_COLOR = "Text Color";
    var FX_DIM_COLOR = "Dim Color";
    var FX_GREEN_COLOR = "Green Color";
    var FX_RED_COLOR = "Red Color";
    var FX_YELLOW_COLOR = "Yellow Color";

    var COLOR_TEXT = [0.62, 0.64, 0.60];
    var COLOR_DIM = [0.36, 0.38, 0.34];
    var COLOR_GREEN = [0.22, 0.72, 0.12];
    var COLOR_RED = [0.86, 0.08, 0.05];
    var COLOR_YELLOW = [0.86, 0.72, 0.05];
    var COLOR_BLACK = [0, 0, 0];

    function colorsMatch(a, b) {
        if (!a || !b) return false;
        return Math.abs(a[0] - b[0]) < 0.001 &&
            Math.abs(a[1] - b[1]) < 0.001 &&
            Math.abs(a[2] - b[2]) < 0.001;
    }

    function colorControlName(color) {
        if (colorsMatch(color, COLOR_TEXT)) return FX_TEXT_COLOR;
        if (colorsMatch(color, COLOR_DIM)) return FX_DIM_COLOR;
        if (colorsMatch(color, COLOR_GREEN)) return FX_GREEN_COLOR;
        if (colorsMatch(color, COLOR_RED)) return FX_RED_COLOR;
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

    function addDropdown(fx, name, items, value) {
        var item;
        try {
            item = fx.addProperty("ADBE Dropdown Control");
            item.name = name;
            try {
                item.property(1).setPropertyParameters(items);
            } catch (ignoredInner) {
            }
            item.property(1).setValue(value);
            return item;
        } catch (ignored) {
            return addSlider(fx, name, value);
        }
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
        addDropdown(fx, FX_LAYOUT_PRESET, ["DJI Classic", "Future Layout 02", "Future Layout 03"], 1);
        addColor(fx, FX_TEXT_COLOR, COLOR_TEXT);
        addColor(fx, FX_DIM_COLOR, COLOR_DIM);
        addColor(fx, FX_GREEN_COLOR, COLOR_GREEN);
        addColor(fx, FX_RED_COLOR, COLOR_RED);
        addColor(fx, FX_YELLOW_COLOR, COLOR_YELLOW);
        try {
            layer.moveToBeginning();
        } catch (ignored) {
        }
        return layer;
    }

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

    function addRectToContents(contents, x, y, w, h, roundness) {
        var rect = contents.addProperty("ADBE Vector Shape - Rect");
        rect.property("ADBE Vector Rect Size").setValue([w, h]);
        rect.property("ADBE Vector Rect Position").setValue([x + w * 0.5, y + h * 0.5]);
        if (roundness !== undefined) {
            rect.property("ADBE Vector Rect Roundness").setValue(roundness);
        }
        return rect;
    }

    function addEllipseToContents(contents, x, y, w, h) {
        var ellipse = contents.addProperty("ADBE Vector Shape - Ellipse");
        ellipse.property("ADBE Vector Ellipse Size").setValue([w, h]);
        ellipse.property("ADBE Vector Ellipse Position").setValue([x + w * 0.5, y + h * 0.5]);
        return ellipse;
    }

    function addText(comp, name, text, x, y, size, color, align) {
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
            doc.font = HUD_FONT;
        } catch (ignored) {
        }
        textProp.setValue(doc);
        layer.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);
        var colorControl = colorControlName(color) || FX_TEXT_COLOR;
        setExpression(
            textProp,
            'var c = ' + controlExpr(colorControl, "Color") + ';\ntext.sourceText.style.setFillColor(c);'
        );
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

    function drawCornerBrackets(comp) {
        var layer = makeShapeLayer(comp, "HUD_corner_brackets");
        var c = addGroup(layer, "corners");
        var m = 60;
        var l = 360;
        var top = 170;
        var bottom = COMP_H - 250;
        var right = COMP_W - 60;
        var left = 60;
        addLineToContents(c, left, top, left + l, top);
        addLineToContents(c, left, top, left, top + l);
        addLineToContents(c, right, top, right - l, top);
        addLineToContents(c, right, top, right, top + l);
        addLineToContents(c, left, bottom, left + l, bottom);
        addLineToContents(c, left, bottom, left, bottom - l);
        addLineToContents(c, right, bottom, right - l, bottom);
        addLineToContents(c, right, bottom, right, bottom - l);
        addStroke(c, COLOR_TEXT, 7, 100);
    }

    function drawGpsAndTopStatus(comp) {
        var layer = makeShapeLayer(comp, "HUD_top_status_shapes");
        var c = addGroup(layer, "gps_badge");
        addRectToContents(c, 64, 88, 130, 72, 10);
        addStroke(c, COLOR_GREEN, 4, 100);
        addFill(c, COLOR_BLACK, 0);
        addText(comp, "HUD_text_GPS", "GPS", 88, 142, 43, COLOR_GREEN);
        addText(comp, "HUD_text_mode", "MODE   P-GPS", 245, 140, 45, COLOR_TEXT);
        addText(comp, "HUD_text_sat_count", "18", 830, 140, 42, COLOR_TEXT);
        addText(comp, "HUD_text_battery", "82%\n15.6V", 3540, 118, 43, COLOR_GREEN);
    }

    function drawSignalBars(comp, name, x, y, color) {
        var layer = makeShapeLayer(comp, name);
        var c = addGroup(layer, "bars");
        for (var i = 0; i < 5; i++) {
            var h = 14 + i * 12;
            addRectToContents(c, x + i * 18, y - h, 10, h, 0);
        }
        addFill(c, color, 100);
    }

    function drawBattery(comp) {
        var layer = makeShapeLayer(comp, "HUD_battery_icon");
        var c = addGroup(layer, "battery");
        addRectToContents(c, 3430, 91, 126, 50, 5);
        addRectToContents(c, 3560, 106, 14, 20, 3);
        addStroke(c, COLOR_GREEN, 5, 100);
        var fill = addGroup(layer, "battery_fill");
        addRectToContents(fill, 3442, 103, 88, 26, 3);
        addFill(fill, COLOR_GREEN, 75);
    }

    function drawCompass(comp) {
        var layer = makeShapeLayer(comp, "HUD_compass_ticks");
        var c = addGroup(layer, "compass");
        var y = 128;
        var startX = 1280;
        var spacing = 79;
        for (var i = 0; i <= 16; i++) {
            var x = startX + i * spacing;
            var len = i % 4 === 0 ? 36 : 22;
            addLineToContents(c, x, y - len, x, y);
        }
        addStroke(c, COLOR_TEXT, 4, 100);
        addText(comp, "HUD_compass_W", "W", startX - 10, 170, 34, COLOR_TEXT);
        addText(comp, "HUD_compass_330", "330", startX + spacing * 4 - 35, 170, 36, COLOR_TEXT);
        addText(comp, "HUD_compass_345", "345", startX + spacing * 8 - 35, 170, 36, COLOR_TEXT);
        addText(comp, "HUD_compass_N", "N", startX + spacing * 10 - 12, 170, 40, COLOR_GREEN);
        addText(comp, "HUD_compass_15", "15", startX + spacing * 12 - 20, 170, 36, COLOR_TEXT);
        addText(comp, "HUD_compass_30", "30", startX + spacing * 14 - 20, 170, 36, COLOR_TEXT);
        addText(comp, "HUD_compass_E", "E", startX + spacing * 16 - 10, 170, 34, COLOR_TEXT);
        addText(comp, "HUD_compass_triangle", "▲", startX + spacing * 10 - 20, 92, 42, COLOR_TEXT);
    }

    function drawCenterReticle(comp) {
        var layer = makeShapeLayer(comp, "HUD_center_reticle");
        var c = addGroup(layer, "reticle");
        var cx = COMP_W * 0.5;
        var cy = COMP_H * 0.5 + 5;
        var s = 245;
        var l = 74;
        addLineToContents(c, cx - s, cy - s, cx - s + l, cy - s);
        addLineToContents(c, cx - s, cy - s, cx - s, cy - s + l);
        addLineToContents(c, cx + s, cy - s, cx + s - l, cy - s);
        addLineToContents(c, cx + s, cy - s, cx + s, cy - s + l);
        addLineToContents(c, cx - s, cy + s, cx - s + l, cy + s);
        addLineToContents(c, cx - s, cy + s, cx - s, cy + s - l);
        addLineToContents(c, cx + s, cy + s, cx + s - l, cy + s);
        addLineToContents(c, cx + s, cy + s, cx + s, cy + s - l);
        addLineToContents(c, cx - 55, cy, cx - 18, cy);
        addLineToContents(c, cx + 18, cy, cx + 55, cy);
        addLineToContents(c, cx, cy - 55, cx, cy - 18);
        addLineToContents(c, cx, cy + 18, cx, cy + 55);
        addEllipseToContents(c, cx - 34, cy - 34, 68, 68);
        addStroke(c, COLOR_TEXT, 5, 100);
    }

    function drawAltitudeScale(comp) {
        var layer = makeShapeLayer(comp, "HUD_left_altitude_scale");
        var c = addGroup(layer, "alt_ticks");
        var x = 250;
        var y0 = 720;
        var y1 = 1420;
        for (var i = 0; i <= 15; i++) {
            var y = y0 + (y1 - y0) * i / 15;
            var len = i % 5 === 0 ? 40 : 24;
            addLineToContents(c, x - len, y, x, y);
        }
        addStroke(c, COLOR_TEXT, 3, 100);
        addText(comp, "HUD_alt_label", "ALT", 125, 455, 36, COLOR_TEXT);
        addText(comp, "HUD_alt_value", "120", 125, 530, 76, COLOR_TEXT);
        addText(comp, "HUD_alt_unit", "m", 242, 530, 42, COLOR_TEXT);
        addText(comp, "HUD_alt_max", "MAX 125 m", 125, 605, 32, COLOR_TEXT);
        addText(comp, "HUD_alt_150", "150", 125, 725, 34, COLOR_TEXT);
        addText(comp, "HUD_alt_100", "100", 125, 965, 34, COLOR_TEXT);
        addText(comp, "HUD_alt_50", "50", 145, 1210, 34, COLOR_TEXT);
        addText(comp, "HUD_alt_0", "0", 160, 1445, 34, COLOR_TEXT);
        drawGreenPointer(comp, "HUD_alt_pointer", 230, 900, true);
        drawSmallValueBox(comp, "HUD_alt_box", "120", 302, 870, 120, 60, COLOR_GREEN);
    }

    function drawPitchScale(comp) {
        var layer = makeShapeLayer(comp, "HUD_right_pitch_scale");
        var c = addGroup(layer, "pitch_ticks");
        var x = 3468;
        var y0 = 720;
        var y1 = 1330;
        for (var i = 0; i <= 14; i++) {
            var y = y0 + (y1 - y0) * i / 14;
            var len = i % 3 === 0 ? 34 : 20;
            addLineToContents(c, x, y, x + len, y);
        }
        addStroke(c, COLOR_TEXT, 3, 100);
        addText(comp, "HUD_pitch_20", "20", 3540, 730, 34, COLOR_TEXT);
        addText(comp, "HUD_pitch_10", "10", 3540, 885, 34, COLOR_TEXT);
        addText(comp, "HUD_pitch_0", "0", 3540, 1035, 34, COLOR_TEXT);
        addText(comp, "HUD_pitch_m10", "-10", 3525, 1190, 34, COLOR_TEXT);
        addText(comp, "HUD_pitch_m20", "-20", 3525, 1340, 34, COLOR_TEXT);
        drawGreenPointer(comp, "HUD_pitch_pointer", 3450, 1190, false);
        drawSmallValueBox(comp, "HUD_pitch_box", "-12.5", 3290, 1160, 130, 58, COLOR_GREEN);
    }

    function drawGreenPointer(comp, name, x, y, right) {
        var layer = makeShapeLayer(comp, name);
        var c = addGroup(layer, "pointer");
        var shape = new Shape();
        if (right) {
            shape.vertices = [[x, y], [x + 44, y - 18], [x + 44, y + 18]];
        } else {
            shape.vertices = [[x, y], [x - 44, y - 18], [x - 44, y + 18]];
        }
        shape.inTangents = [[0, 0], [0, 0], [0, 0]];
        shape.outTangents = [[0, 0], [0, 0], [0, 0]];
        shape.closed = true;
        var pathGroup = c.addProperty("ADBE Vector Shape - Group");
        pathGroup.property("ADBE Vector Shape").setValue(shape);
        addFill(c, COLOR_GREEN, 100);
    }

    function drawSmallValueBox(comp, name, text, x, y, w, h, color) {
        var layer = makeShapeLayer(comp, name + "_shape");
        var c = addGroup(layer, "box");
        addRectToContents(c, x, y, w, h, 0);
        addStroke(c, color, 3, 100);
        addFill(c, COLOR_BLACK, 0);
        addText(comp, name + "_text", text, x + w * 0.5, y + h * 0.72, h * 0.48, color, ParagraphJustification.CENTER_JUSTIFY);
    }

    function drawSpeedAndDistance(comp) {
        addText(comp, "HUD_speed_label", "SPD", 120, 1590, 42, COLOR_TEXT);
        addText(comp, "HUD_speed_value", "28.6", 120, 1690, 88, COLOR_TEXT);
        addText(comp, "HUD_speed_unit", "m/s", 290, 1690, 42, COLOR_TEXT);
        addText(comp, "HUD_speed_max", "MAX 32.4 m/s", 120, 1770, 32, COLOR_TEXT);
        drawGreenPointer(comp, "HUD_speed_pointer", 500, 1665, false);
        drawMiniVerticalMeter(comp, "HUD_speed_meter", 445, 1530, 38, 275, COLOR_GREEN);

        addText(comp, "HUD_dist_label", "DIST", 3360, 1590, 42, COLOR_TEXT);
        addText(comp, "HUD_dist_value", "860", 3360, 1690, 88, COLOR_TEXT);
        addText(comp, "HUD_dist_unit", "m", 3510, 1690, 42, COLOR_TEXT);
        addText(comp, "HUD_dist_home", "HOME 1320 m", 3360, 1770, 32, COLOR_TEXT);
        drawMiniVerticalMeter(comp, "HUD_dist_meter", 3245, 1530, 38, 275, COLOR_YELLOW);
    }

    function drawMiniVerticalMeter(comp, name, x, y, w, h, color) {
        var layer = makeShapeLayer(comp, name);
        var c = addGroup(layer, "meter");
        addRectToContents(c, x, y, w, h, 4);
        addStroke(c, COLOR_TEXT, 2, 100);
        var f = addGroup(layer, "ticks");
        for (var i = 0; i < 16; i++) {
            addLineToContents(f, x + 8, y + h - 15 - i * 15, x + w - 8, y + h - 15 - i * 15);
        }
        addStroke(f, color, 3, 100);
    }

    function drawRecAndGimbal(comp) {
        var layer = makeShapeLayer(comp, "HUD_rec_dot");
        var c = addGroup(layer, "rec");
        addEllipseToContents(c, 3075, 373, 34, 34);
        addFill(c, COLOR_RED, 100);
        addText(comp, "HUD_rec_text", "REC", 3125, 405, 43, COLOR_RED);
        addText(comp, "HUD_timer", "00:02:34", 3075, 500, 46, COLOR_TEXT);
        addText(comp, "HUD_format", "4K 30", 3090, 590, 46, COLOR_TEXT);
        addText(comp, "HUD_gimbal_label", "GIMBAL", 3450, 445, 34, COLOR_TEXT);
        addText(comp, "HUD_gimbal_value", "-12.5°", 3400, 535, 60, COLOR_TEXT);
        addText(comp, "HUD_gimbal_pitch", "PITCH", 3450, 625, 34, COLOR_TEXT);
    }

    function drawBottomTelemetry(comp) {
        addText(comp, "HUD_bottom_hs", "H.S", 965, 2020, 38, COLOR_GREEN);
        addText(comp, "HUD_bottom_hs_v", "28.6 m/s", 1080, 2020, 38, COLOR_TEXT);
        addText(comp, "HUD_bottom_vs", "V.S", 1410, 2020, 38, COLOR_GREEN);
        addText(comp, "HUD_bottom_vs_v", "-0.3 m/s", 1530, 2020, 38, COLOR_TEXT);
        addText(comp, "HUD_bottom_h", "H", 1860, 2020, 38, COLOR_GREEN);
        addText(comp, "HUD_bottom_h_v", "120 m", 1935, 2020, 38, COLOR_TEXT);
        addText(comp, "HUD_bottom_d", "D", 2190, 2020, 38, COLOR_GREEN);
        addText(comp, "HUD_bottom_d_v", "860 m", 2265, 2020, 38, COLOR_TEXT);
        addText(comp, "HUD_bottom_desc", "↓", 2555, 2024, 44, COLOR_YELLOW);
        addText(comp, "HUD_bottom_desc_v", "1.2 m/s", 2635, 2020, 38, COLOR_TEXT);
        drawCompassBottom(comp);
    }

    function drawCompassBottom(comp) {
        var layer = makeShapeLayer(comp, "HUD_bottom_compass");
        var c = addGroup(layer, "bottom_ticks");
        var y = 1860;
        var startX = 1120;
        var spacing = 66;
        for (var i = 0; i <= 15; i++) {
            var x = startX + i * spacing;
            var len = i % 4 === 0 ? 44 : 24;
            addLineToContents(c, x, y, x, y + len);
        }
        addStroke(c, COLOR_TEXT, 4, 100);
        drawSmallValueBox(comp, "HUD_heading_box", "265°", 1772, 1880, 150, 70, COLOR_GREEN);
        addText(comp, "HUD_bottom_210", "210", 1085, 1925, 34, COLOR_TEXT);
        addText(comp, "HUD_bottom_240", "240", 1450, 1925, 34, COLOR_TEXT);
        addText(comp, "HUD_bottom_300", "300", 2195, 1925, 34, COLOR_TEXT);
        addText(comp, "HUD_bottom_330", "330", 2550, 1925, 34, COLOR_TEXT);
    }

    function drawTopRightRadio(comp) {
        drawSignalBars(comp, "HUD_rc_bars", 3030, 130, COLOR_GREEN);
        addText(comp, "HUD_rc", "RC", 3110, 140, 34, COLOR_GREEN);
        drawSignalBars(comp, "HUD_hd_bars", 3300, 130, COLOR_GREEN);
        addText(comp, "HUD_hd", "HD", 3215, 140, 34, COLOR_GREEN);
    }

    function drawSatelliteIcon(comp) {
        var layer = makeShapeLayer(comp, "HUD_satellite_icon");
        var c = addGroup(layer, "sat");
        addRectToContents(c, 725, 93, 42, 42, 0);
        addLineToContents(c, 695, 64, 795, 164);
        addLineToContents(c, 795, 64, 695, 164);
        addStroke(c, COLOR_TEXT, 5, 100);
    }

    function buildHUD(comp) {
        drawCornerBrackets(comp);
        drawGpsAndTopStatus(comp);
        drawSatelliteIcon(comp);
        drawSignalBars(comp, "HUD_sat_bars", 925, 132, COLOR_GREEN);
        drawTopRightRadio(comp);
        drawBattery(comp);
        drawCompass(comp);
        drawAltitudeScale(comp);
        drawPitchScale(comp);
        drawCenterReticle(comp);
        drawSpeedAndDistance(comp);
        drawRecAndGimbal(comp);
        drawBottomTelemetry(comp);
    }

    var guideFile = null;
    if (confirm("Add reference image as guide layer?")) {
        guideFile = File.openDialog(
            "Choose reference image",
            "Images:*.png;*.jpg;*.jpeg;*.tif;*.tiff;*.bmp;*.gif;*.psd"
        );
    }

    if (!app.project) app.newProject();
    app.beginUndoGroup("DJI HUD Builder RV v1.1");
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
        alert("DJI HUD Builder problems:\n\n- " + err.toString() + (err.line ? " line " + err.line : ""));
    } finally {
        app.endUndoGroup();
    }
})();
