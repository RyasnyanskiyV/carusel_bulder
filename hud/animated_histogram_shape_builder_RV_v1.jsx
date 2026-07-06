#target aftereffects
#targetengine "AnimatedHistogramShapeBuilderRVV1"

/*
    animated_histogram_shape_builder_RV v1
    Adobe After Effects 2022+

    Creates a lightweight animated histogram HUD panel.
    The histogram itself is one animated Bezier Shape Path, not many bars.
*/

(function AnimatedHistogramShapeBuilderRVV1() {
    var DEFAULT_W = 500;
    var DEFAULT_H = 300;
    var DEFAULT_DURATION = 10;
    var FPS = 30;
    var COMP_BASE = "ANIMATED_HISTOGRAM";
    var CTRL_NAME = "HIST_CONTROL";

    var COLOR_WHITE = [0.82, 0.86, 0.86];
    var COLOR_DIM = [0.36, 0.38, 0.38];
    var COLOR_PANEL = [0.03, 0.03, 0.03];
    var COLOR_FILL = [0.35, 0.36, 0.36];
    var COLOR_ACCENT = [0.90, 0.78, 0.12];
    var COLOR_BLACK = [0, 0, 0];

    var FX_FILL_OPACITY = "Fill Opacity (%)";
    var FX_STROKE_OPACITY = "Stroke Opacity (%)";
    var FX_LINE_WIDTH = "Line Width";
    var FX_FILL_COLOR = "Histogram Fill";
    var FX_STROKE_COLOR = "Histogram Stroke";
    var FX_FRAME_COLOR = "Frame Color";
    var FX_TEXT_COLOR = "Text Color";
    var FX_ACCENT_COLOR = "Accent Color";

    function askNumber(message, defaultValue, minValue, maxValue) {
        var raw = prompt(message, String(defaultValue));
        if (raw === null) return defaultValue;
        var value = parseFloat(String(raw).replace(",", "."));
        if (isNaN(value)) value = defaultValue;
        value = Math.max(minValue, Math.min(maxValue, value));
        return Math.round(value);
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

    function q(s) {
        return '"' + String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    }

    function ctrlExpr(effectName, propName) {
        return 'thisComp.layer(' + q(CTRL_NAME) + ').effect(' + q(effectName) + ')(' + q(propName) + ')';
    }

    function setExpression(prop, expr) {
        try {
            prop.expression = expr;
        } catch (ignored) {
        }
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

    function addHistogramController(comp) {
        var layer = comp.layers.addNull();
        layer.name = CTRL_NAME;
        layer.label = 11;
        layer.property("ADBE Transform Group").property("ADBE Position").setValue([30, 30]);
        layer.property("ADBE Transform Group").property("ADBE Opacity").setValue(0);

        var fx = layer.property("ADBE Effect Parade");
        addSlider(fx, FX_FILL_OPACITY, 82);
        addSlider(fx, FX_STROKE_OPACITY, 22);
        addSlider(fx, FX_LINE_WIDTH, 1.4);
        addColor(fx, FX_FILL_COLOR, COLOR_FILL);
        addColor(fx, FX_STROKE_COLOR, COLOR_WHITE);
        addColor(fx, FX_FRAME_COLOR, COLOR_WHITE);
        addColor(fx, FX_TEXT_COLOR, COLOR_DIM);
        addColor(fx, FX_ACCENT_COLOR, COLOR_ACCENT);

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

    function addPolylineToContents(contents, points, closed) {
        var tangents = [];
        for (var i = 0; i < points.length; i++) tangents.push([0, 0]);
        return addPathToContents(contents, points, tangents, tangents, closed);
    }

    function addLineToContents(contents, x1, y1, x2, y2) {
        return addPolylineToContents(contents, [[x1, y1], [x2, y2]], false);
    }

    function addRectToContents(contents, x, y, w, h, roundness) {
        var r = Math.max(0, Math.min(roundness || 0, Math.min(w, h) * 0.5));
        if (r <= 0) {
            return addPolylineToContents(contents, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], true);
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

    function addStroke(contents, color, width, opacity) {
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue(color);
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
        fill.property("ADBE Vector Fill Opacity").setValue(opacity === undefined ? 100 : opacity);
        return fill;
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
        var fonts = ["Consolas", "Menlo-Regular", "Monaco", "CourierNewPSMT", "ArialMT", "Arial"];
        for (var i = 0; i < fonts.length; i++) {
            try {
                doc.font = fonts[i];
                return;
            } catch (ignored) {
            }
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
            doc.tracking = tracking === undefined ? 20 : tracking;
        } catch (ignoredTracking) {
        }
        applyFont(doc);
        textProp.setValue(doc);
        layer.property("ADBE Transform Group").property("ADBE Position").setValue([x, y]);

        try {
            var fill = layer.property("ADBE Effect Parade").addProperty("ADBE Fill");
            fill.name = "Histogram Text Color";
            var colorProp = firstColorProperty(fill);
            if (colorProp) {
                colorProp.setValue(color);
                if (color === COLOR_ACCENT) {
                    setExpression(colorProp, ctrlExpr(FX_ACCENT_COLOR, "Color") + ";");
                } else {
                    setExpression(colorProp, ctrlExpr(FX_TEXT_COLOR, "Color") + ";");
                }
            }
        } catch (ignored) {
        }
        return layer;
    }

    function makeHistogramShape(left, top, w, h, n, phase) {
        var t = phase * Math.PI * 2;
        var drift = 0.055;
        var amp = 1.0;

        function g(x, c, s, a) {
            return Math.exp(-Math.pow((x - c) / s, 2)) * a;
        }

        function fixedNoise(i) {
            var v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
            return v - Math.floor(v);
        }

        var vertices = [];
        vertices.push([left, top + h]);

        for (var i = 0; i < n; i++) {
            var x = i / (n - 1);
            var d1 = Math.sin(t) * drift;
            var d2 = Math.sin(t + 1.9) * drift;
            var d3 = Math.sin(t * 2 + 0.7) * drift * 0.55;
            var v = 0;

            v += g(x, 0.16 + d1, 0.035 + Math.sin(t + 0.4) * 0.006, 0.88 + Math.sin(t + 0.2) * 0.16);
            v += g(x, 0.28 - d2, 0.088 + Math.sin(t + 1.2) * 0.010, 0.45 + Math.sin(t + 2.1) * 0.10);
            v += g(x, 0.43 + d2, 0.070 + Math.sin(t + 2.0) * 0.010, 0.62 + Math.sin(t + 3.0) * 0.13);
            v += g(x, 0.62 - d1 + d3, 0.055 + Math.sin(t + 0.9) * 0.008, 0.38 + Math.sin(t + 1.5) * 0.12);
            v += g(x, 0.78 + d2 - d3, 0.060 + Math.sin(t + 2.8) * 0.009, 0.31 + Math.sin(t + 2.4) * 0.10);
            v += g(x, 0.87 - d1, 0.040 + Math.sin(t + 0.5) * 0.006, 0.18 + Math.sin(t + 4.2) * 0.07);
            v += 0.05 + (fixedNoise(i) - 0.5) * 0.024;
            v += (Math.sin(t + i * 0.34) * 0.12 + Math.sin(t * 2 + i * 0.77) * 0.07) * 0.52;

            v = Math.max(0.025, Math.min(0.88, v * amp));
            vertices.push([left + x * w, top + h - v * h]);
        }

        vertices.push([left + w, top + h]);

        var inTangents = [];
        var outTangents = [];
        var handle = (w / (n - 1)) * 0.36;
        for (var p = 0; p < vertices.length; p++) {
            if (p >= 1 && p <= n) {
                inTangents.push(p === 1 ? [0, 0] : [-handle, 0]);
                outTangents.push(p === n ? [0, 0] : [handle, 0]);
            } else {
                inTangents.push([0, 0]);
                outTangents.push([0, 0]);
            }
        }

        var shape = new Shape();
        shape.vertices = vertices;
        shape.inTangents = inTangents;
        shape.outTangents = outTangents;
        shape.closed = true;
        return shape;
    }

    function applyHistogramKeyframes(pathProp, left, top, w, h, duration) {
        var points = 180;
        var loopDuration = 5;
        var step = 0.5;
        var t = 0;

        while (t <= duration + 0.001) {
            var phase = (t % loopDuration) / loopDuration;
            pathProp.setValueAtTime(t, makeHistogramShape(left, top, w, h, points, phase));
            t += step;
        }

        pathProp.setValueAtTime(duration, makeHistogramShape(left, top, w, h, points, 0));
    }

    function drawPanel(comp, graphLeft, graphTop, graphW, graphH) {
        var margin = Math.max(4, Math.round(Math.min(comp.width, comp.height) * 0.012));
        var layer = makeShapeLayer(comp, "HIST_PANEL_FRAME");
        var c = addGroup(layer, "panel");
        addRectToContents(c, margin, margin, comp.width - margin * 2, comp.height - margin * 2, 4);
        addFill(c, COLOR_PANEL, 80);
        var panelStroke = addStroke(c, COLOR_WHITE, 1.4, 72);
        setExpression(panelStroke.property("ADBE Vector Stroke Color"), ctrlExpr(FX_FRAME_COLOR, "Color") + ";");

        var box = addGroup(layer, "graph box");
        addRectToContents(box, graphLeft, graphTop, graphW, graphH, 0);
        addStroke(box, COLOR_DIM, 1.2, 38);

        var baseline = addGroup(layer, "baseline");
        addLineToContents(baseline, graphLeft, graphTop + graphH, graphLeft + graphW, graphTop + graphH);
        addStroke(baseline, COLOR_DIM, 1.4, 35);
    }

    function drawHistogram(comp, graphLeft, graphTop, graphW, graphH) {
        var layer = makeShapeLayer(comp, "HISTOGRAM_ANIMATED_AREA");
        var c = addGroup(layer, "animated histogram");
        var pathGroup = addPolylineToContents(c, [[0, 0], [1, 0], [1, 1], [0, 1]], true);
        applyHistogramKeyframes(pathGroup.property("ADBE Vector Shape"), graphLeft, graphTop, graphW, graphH, comp.duration);

        var fill = addFill(c, COLOR_FILL, 82);
        setExpression(fill.property("ADBE Vector Fill Color"), ctrlExpr(FX_FILL_COLOR, "Color") + ";");
        setExpression(fill.property("ADBE Vector Fill Opacity"), ctrlExpr(FX_FILL_OPACITY, "Slider") + ";");

        var stroke = addStroke(c, COLOR_WHITE, 1.4, 22);
        setExpression(stroke.property("ADBE Vector Stroke Color"), ctrlExpr(FX_STROKE_COLOR, "Color") + ";");
        setExpression(stroke.property("ADBE Vector Stroke Opacity"), ctrlExpr(FX_STROKE_OPACITY, "Slider") + ";");
        setExpression(stroke.property("ADBE Vector Stroke Width"), ctrlExpr(FX_LINE_WIDTH, "Slider") + ";");
    }

    function drawLabels(comp, graphLeft, graphTop, graphW, graphH) {
        var titleSize = Math.max(14, Math.round(comp.height * 0.085));
        var labelSize = Math.max(11, Math.round(comp.height * 0.070));
        addText(comp, "HIST_TITLE", "HISTOGRAM", graphLeft + 4, Math.max(28, graphTop - 26), titleSize, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 10);
        addText(comp, "HIST_ARROW", "v", graphLeft + 156, Math.max(28, graphTop - 26), titleSize, COLOR_DIM, ParagraphJustification.LEFT_JUSTIFY, 0);

        var y = graphTop + graphH + labelSize + 8;
        addText(comp, "HIST_0", "0", graphLeft, y, labelSize, COLOR_ACCENT, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HIST_25", "25", graphLeft + graphW * 0.25, y, labelSize, COLOR_ACCENT, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HIST_50", "50", graphLeft + graphW * 0.50, y, labelSize, COLOR_ACCENT, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HIST_75", "75", graphLeft + graphW * 0.75, y, labelSize, COLOR_ACCENT, ParagraphJustification.CENTER_JUSTIFY, 0);
        addText(comp, "HIST_100", "100", graphLeft + graphW, y, labelSize, COLOR_ACCENT, ParagraphJustification.CENTER_JUSTIFY, 0);
    }

    if (!app.project) app.newProject();
    app.beginUndoGroup("Animated Histogram Shape Builder RV v1");
    try {
        var compW = askNumber("Composition width (px)", DEFAULT_W, 120, 8000);
        var compH = askNumber("Composition height (px)", DEFAULT_H, 90, 8000);

        var comp = app.project.items.addComp(
            uniqueCompName(COMP_BASE),
            compW,
            compH,
            1,
            DEFAULT_DURATION,
            FPS
        );
        comp.bgColor = COLOR_BLACK;

        var graphLeft = Math.round(compW * 0.07);
        var graphTop = Math.round(compH * 0.27);
        var graphW = Math.round(compW * 0.86);
        var graphH = Math.round(compH * 0.53);

        var ctrl = addHistogramController(comp);
        drawPanel(comp, graphLeft, graphTop, graphW, graphH);
        drawHistogram(comp, graphLeft, graphTop, graphW, graphH);
        drawLabels(comp, graphLeft, graphTop, graphW, graphH);

        try {
            ctrl.moveToBeginning();
        } catch (ignoredMove) {
        }
        comp.openInViewer();
    } catch (err) {
        alert("Animated Histogram Builder problems:\n\n- " + err.toString() + (err.line ? " line " + err.line : ""));
    } finally {
        app.endUndoGroup();
    }
})();
