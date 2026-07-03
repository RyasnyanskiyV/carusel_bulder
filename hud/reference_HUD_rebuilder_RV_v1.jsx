#target aftereffects
#targetengine "ReferenceHUDRebuilderRVV1"

/*
    reference_HUD_rebuilder_RV v1
    Adobe After Effects 2022+

    Rebuilds HUD/UI references in a cleaner way than pixel vectorization:
    - imports the reference as a locked guide layer;
    - detects long horizontal/vertical HUD lines with an external Python helper;
    - creates lightweight native AE shape strokes;
    - optionally adds editable text layers from a compact manual table.

    Helper file required in the same folder:
    - rv_hud_line_detector.py
*/

(function ReferenceHUDRebuilderRVV1() {
    var COMP_W = 3840;
    var COMP_H = 2160;
    var COMP_DURATION = 10;
    var FPS = 30;
    var COMP_BASE = "HUD_REBUILD";
    var OUTPUT_FOLDER_NAME = "RV_HUD_Rebuild_Output";
    var HELPER_NAME = "rv_hud_line_detector.py";
    var LINES_PER_LAYER = 700;

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function parseNumber(value, fallback, min, max) {
        var n = parseFloat(value);
        if (isNaN(n)) n = fallback;
        return clamp(n, min, max);
    }

    function parseInteger(value, fallback, min, max) {
        return Math.round(parseNumber(value, fallback, min, max));
    }

    function trimString(value) {
        return String(value).replace(/^\s+|\s+$/g, "");
    }

    function quotePath(path) {
        return '"' + String(path).replace(/"/g, '\\"') + '"';
    }

    function colorFromHex(hex, fallback) {
        var s = trimString(hex || "");
        if (!s || s.toLowerCase() === "auto") return fallback;
        if (s.charAt(0) === "#") s = s.substring(1);
        if (!/^[0-9a-fA-F]{6}$/.test(s)) return fallback;
        return [
            parseInt(s.substring(0, 2), 16) / 255,
            parseInt(s.substring(2, 4), 16) / 255,
            parseInt(s.substring(4, 6), 16) / 255
        ];
    }

    function alignmentFromString(value) {
        var s = trimString(value || "left").toLowerCase();
        if (s === "center" || s === "centre" || s === "c") return ParagraphJustification.CENTER_JUSTIFY;
        if (s === "right" || s === "r") return ParagraphJustification.RIGHT_JUSTIFY;
        return ParagraphJustification.LEFT_JUSTIFY;
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

    function timestamp() {
        var d = new Date();
        function pad(v) {
            return ("0" + v).slice(-2);
        }
        return String(d.getFullYear()) + pad(d.getMonth() + 1) + pad(d.getDate()) +
            "_" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
    }

    function extensionOf(file) {
        var name = file.name || "";
        var dot = name.lastIndexOf(".");
        if (dot < 0) return ".png";
        return name.substring(dot);
    }

    function baseNameNoExt(file) {
        var name = file.displayName || file.name || "reference";
        var dot = name.lastIndexOf(".");
        if (dot > 0) name = name.substring(0, dot);
        return name.replace(/[\\\/:*?"<>|]+/g, "_");
    }

    function readFileText(file) {
        file.encoding = "UTF-8";
        if (!file.open("r")) throw new Error("Could not read file: " + file.fsName);
        var text = file.read();
        file.close();
        return text;
    }

    function writeFileText(file, text) {
        file.encoding = "UTF-8";
        if (!file.open("w")) throw new Error("Could not write file: " + file.fsName);
        file.write(text);
        file.close();
    }

    function copyFileChecked(source, dest) {
        if (dest.exists) dest.remove();
        if (!source.copy(dest.fsName)) {
            throw new Error("Could not copy " + source.fsName + " to " + dest.fsName);
        }
    }

    function findPython() {
        var candidates = [
            "C:/Users/beya/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe",
            "C:/Python312/python.exe",
            "C:/Python311/python.exe",
            "C:/Program Files/Python312/python.exe",
            "C:/Program Files/Python311/python.exe"
        ];
        for (var i = 0; i < candidates.length; i++) {
            var f = new File(candidates[i]);
            if (f.exists) return f.fsName;
        }
        return "python";
    }

    function outputFolder() {
        var folder = new Folder(Folder.desktop.fsName + "/" + OUTPUT_FOLDER_NAME);
        if (!folder.exists && !folder.create()) {
            throw new Error("Could not create output folder: " + folder.fsName);
        }
        return folder;
    }

    function makeTempFolder() {
        var folder = new Folder(Folder.temp.fsName + "/rv_hud_rebuild_" + timestamp());
        if (!folder.exists && !folder.create()) {
            throw new Error("Could not create temp folder: " + folder.fsName);
        }
        return folder;
    }

    function fitLayerToComp(layer, comp) {
        var sourceW = layer.source.width;
        var sourceH = layer.source.height;
        var scale = Math.min(comp.width / sourceW, comp.height / sourceH) * 100;
        var tr = layer.property("ADBE Transform Group");
        tr.property("ADBE Position").setValue([comp.width * 0.5, comp.height * 0.5]);
        tr.property("ADBE Scale").setValue([scale, scale]);
    }

    function showOptionsDialog() {
        var win = new Window("dialog", "HUD Rebuilder Options");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.margins = 14;
        win.spacing = 10;

        var info = win.add(
            "statictext",
            undefined,
            "Clean HUD rebuild: guide image + detected line strokes + optional editable text."
        );
        info.characters = 78;

        var panel = win.add("panel", undefined, "Detection");
        panel.orientation = "column";
        panel.alignChildren = ["left", "top"];
        panel.margins = 12;

        function addRow(label, value, chars) {
            var row = panel.add("group");
            row.add("statictext", undefined, label);
            var input = row.add("edittext", undefined, value);
            input.characters = chars || 8;
            return input;
        }

        var guideOpacityInput = addRow("Guide opacity %:", "30", 6);
        var thresholdInput = addRow("Foreground threshold:", "0.055", 7);
        var minLengthInput = addRow("Min line length px:", "42", 7);
        var minRatioInput = addRow("Line ratio:", "3.5", 7);
        var mergeGapInput = addRow("Merge gap px:", "8", 7);
        var maxLinesInput = addRow("Max lines:", "1200", 8);
        var strokeScaleInput = addRow("Stroke width scale:", "1.0", 7);
        var strokeColorInput = addRow("Line color HEX / auto:", "auto", 10);

        var manualPanel = win.add("panel", undefined, "Editable text (optional)");
        manualPanel.orientation = "column";
        manualPanel.alignChildren = ["fill", "top"];
        manualPanel.margins = 12;
        manualPanel.add(
            "statictext",
            undefined,
            "Format: text | x | y | size | align | color"
        );
        var textRows = manualPanel.add(
            "edittext",
            undefined,
            "# Examples:\n# 330 | 1920 | 890 | 64 | center | #AAB0A2\n# N | 2600 | 720 | 90 | center | #AAB0A2",
            {
                multiline: true,
                scrolling: true
            }
        );
        textRows.preferredSize = [720, 180];

        var buttons = win.add("group");
        buttons.alignment = ["right", "top"];
        var cancel = buttons.add("button", undefined, "Cancel");
        var ok = buttons.add("button", undefined, "OK");

        var result = null;
        ok.onClick = function () {
            result = {
                guideOpacity: parseNumber(guideOpacityInput.text, 30, 0, 100),
                threshold: parseNumber(thresholdInput.text, 0.055, 0, 1),
                minLength: parseInteger(minLengthInput.text, 42, 1, 10000),
                minRatio: parseNumber(minRatioInput.text, 3.5, 1, 100),
                mergeGap: parseNumber(mergeGapInput.text, 8, 0, 1000),
                maxLines: parseInteger(maxLinesInput.text, 1200, 1, 200000),
                strokeScale: parseNumber(strokeScaleInput.text, 1, 0.05, 50),
                strokeColorRaw: strokeColorInput.text,
                textRows: textRows.text
            };
            win.close(1);
        };
        cancel.onClick = function () {
            result = null;
            win.close(0);
        };

        win.center();
        win.show();
        return result;
    }

    function makeProgressWindow() {
        var win = new Window("palette", "HUD Rebuilder");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        var text = win.add("statictext", undefined, "Preparing...");
        text.characters = 70;
        win.center();
        win.show();
        return {
            win: win,
            text: text
        };
    }

    function runDetector(imageFile, options, progress) {
        var scriptFile = new File($.fileName);
        var helperSource = new File(scriptFile.parent.fsName + "/" + HELPER_NAME);
        if (!helperSource.exists) throw new Error("Missing helper: " + helperSource.fsName);

        var temp = makeTempFolder();
        var helperTemp = new File(temp.fsName + "/" + HELPER_NAME);
        var imageTemp = new File(temp.fsName + "/input" + extensionOf(imageFile));
        var jsonTemp = new File(temp.fsName + "/hud_lines.json");

        copyFileChecked(helperSource, helperTemp);
        copyFileChecked(imageFile, imageTemp);

        progress.text.text = "Detecting HUD lines...";
        progress.win.update();

        var cmd = quotePath(findPython()) + " " +
            quotePath(helperTemp.fsName) +
            " --input " + quotePath(imageTemp.fsName) +
            " --json " + quotePath(jsonTemp.fsName) +
            " --width " + COMP_W +
            " --height " + COMP_H +
            " --threshold " + options.threshold +
            " --min-length " + options.minLength +
            " --min-ratio " + options.minRatio +
            " --merge-gap " + options.mergeGap +
            " --max-lines " + options.maxLines;

        var output = system.callSystem(cmd);
        if (!jsonTemp.exists || output.indexOf("RV_HUD_LINES_OK") < 0) {
            throw new Error("HUD line detector failed.\n\nCommand output:\n" + output);
        }

        var out = outputFolder();
        var jsonFinal = new File(
            out.fsName + "/" + baseNameNoExt(imageFile) + "_hud_lines_" + timestamp() + ".json"
        );
        copyFileChecked(jsonTemp, jsonFinal);
        return {
            jsonFile: jsonFinal,
            output: output
        };
    }

    function makeLineShape(x1, y1, x2, y2) {
        var shape = new Shape();
        shape.vertices = [[x1, y1], [x2, y2]];
        shape.inTangents = [[0, 0], [0, 0]];
        shape.outTangents = [[0, 0], [0, 0]];
        shape.closed = false;
        return shape;
    }

    function createLineLayer(comp, name, color, strokeWidth) {
        var layer = comp.layers.addShape();
        layer.name = name;
        layer.label = 10;
        var tr = layer.property("ADBE Transform Group");
        tr.property("ADBE Position").setValue([0, 0]);
        tr.property("ADBE Anchor Point").setValue([0, 0]);

        var root = layer.property("ADBE Root Vectors Group");
        var group = root.addProperty("ADBE Vector Group");
        group.name = "hud_lines";
        var contents = group.property("ADBE Vectors Group");
        var stroke = contents.addProperty("ADBE Vector Graphic - Stroke");
        stroke.property("ADBE Vector Stroke Color").setValue(color);
        stroke.property("ADBE Vector Stroke Width").setValue(strokeWidth);
        stroke.property("ADBE Vector Stroke Opacity").setValue(100);
        try {
            stroke.property("ADBE Vector Stroke Line Cap").setValue(1);
            stroke.property("ADBE Vector Stroke Line Join").setValue(1);
        } catch (ignored) {
        }

        return {
            layer: layer,
            contents: contents,
            count: 0
        };
    }

    function addPathToLineLayer(lineLayer, line) {
        var pathGroup = lineLayer.contents.addProperty("ADBE Vector Shape - Group");
        pathGroup.property("ADBE Vector Shape").setValue(
            makeLineShape(line.x1, line.y1, line.x2, line.y2)
        );
        lineLayer.count++;
    }

    function lineBucketWidth(line, scale) {
        return Math.max(1, Math.round((line.width || 1) * scale));
    }

    function buildLineLayers(comp, lines, color, strokeScale, progress) {
        var buckets = {};
        var layerIndex = 1;
        for (var i = 0; i < lines.length; i++) {
            var width = lineBucketWidth(lines[i], strokeScale);
            var key = String(width);
            if (!buckets[key] || buckets[key].count >= LINES_PER_LAYER) {
                buckets[key] = createLineLayer(
                    comp,
                    "hud_lines_w" + width + "_" + ("000" + layerIndex).slice(-3),
                    color,
                    width
                );
                layerIndex++;
            }
            addPathToLineLayer(buckets[key], lines[i]);
            if (progress && i % 200 === 0) {
                progress.text.text = "Creating HUD lines: " + (i + 1) + " / " + lines.length;
                progress.win.update();
            }
        }
    }

    function parseManualTextRows(rawText, defaultColor, issues) {
        var rows = [];
        var lines = String(rawText || "").split(/\r?\n/);
        for (var i = 0; i < lines.length; i++) {
            var line = trimString(lines[i]);
            if (!line || line.charAt(0) === "#") continue;
            var parts = line.split("|");
            if (parts.length < 3) {
                issues.push("Text row " + (i + 1) + " skipped: use text | x | y | size | align | color.");
                continue;
            }
            var textValue = trimString(parts[0]);
            if (!textValue) continue;
            rows.push({
                text: textValue,
                x: parseNumber(parts[1], COMP_W * 0.5, -COMP_W, COMP_W * 2),
                y: parseNumber(parts[2], COMP_H * 0.5, -COMP_H, COMP_H * 2),
                size: parts.length > 3 && trimString(parts[3]) !== ""
                    ? parseNumber(parts[3], 72, 1, 1000)
                    : 72,
                align: parts.length > 4 ? alignmentFromString(parts[4]) : ParagraphJustification.LEFT_JUSTIFY,
                color: parts.length > 5 ? colorFromHex(parts[5], defaultColor) : defaultColor
            });
        }
        return rows;
    }

    function addTextLayers(comp, rows) {
        for (var i = rows.length - 1; i >= 0; i--) {
            var row = rows[i];
            var layer = comp.layers.addText(row.text);
            layer.name = "hud_text_" + ("000" + (rows.length - i)).slice(-3);
            layer.label = 2;
            var textProp = layer.property("ADBE Text Properties").property("ADBE Text Document");
            var doc = textProp.value;
            doc.text = row.text;
            doc.fontSize = row.size;
            doc.fillColor = row.color;
            doc.applyFill = true;
            doc.applyStroke = false;
            doc.justification = row.align;
            textProp.setValue(doc);
            layer.property("ADBE Transform Group").property("ADBE Position").setValue([row.x, row.y]);
        }
    }

    function addGuideLayer(comp, imageFile, opacity) {
        var importOptions = new ImportOptions(imageFile);
        var footage = app.project.importFile(importOptions);
        var layer = comp.layers.add(footage);
        layer.name = "REFERENCE_GUIDE";
        fitLayerToComp(layer, comp);
        layer.property("ADBE Transform Group").property("ADBE Opacity").setValue(opacity);
        layer.guideLayer = true;
        layer.locked = true;
        layer.moveToEnd();
        return layer;
    }

    function addInfoLayer(comp, jsonFile, data) {
        var info = comp.layers.addNull();
        info.name = "HUD_REBUILD_INFO";
        info.enabled = false;
        info.guideLayer = true;
        var stats = data.stats || {};
        info.comment =
            "Detector JSON: " + jsonFile.fsName + "\n" +
            "Detected lines: " + (stats.lineCount || 0) + "\n" +
            "Foreground pixels: " + (stats.foregroundPixels || 0);
    }

    var imageFile = File.openDialog(
        "Choose HUD reference image",
        "Images:*.png;*.jpg;*.jpeg;*.tif;*.tiff;*.bmp;*.gif;*.psd"
    );
    if (!imageFile) return;

    var options = showOptionsDialog();
    if (!options) return;

    if (!app.project) app.newProject();

    var progress = makeProgressWindow();
    var issues = [];

    app.beginUndoGroup("Reference HUD Rebuilder RV v1");
    try {
        var result = runDetector(imageFile, options, progress);
        progress.text.text = "Reading detector JSON...";
        progress.win.update();
        var data = JSON.parse(readFileText(result.jsonFile));

        var lineColor = colorFromHex(
            options.strokeColorRaw,
            data.suggestedLineColor || [0.67, 0.69, 0.64]
        );
        var lines = data.lines || [];

        progress.text.text = "Creating HUD composition...";
        progress.win.update();

        var comp = app.project.items.addComp(
            uniqueCompName(COMP_BASE),
            COMP_W,
            COMP_H,
            1,
            COMP_DURATION,
            FPS
        );
        comp.bgColor = data.background || [0, 0, 0];

        addGuideLayer(comp, imageFile, options.guideOpacity);
        buildLineLayers(comp, lines, lineColor, options.strokeScale, progress);
        addTextLayers(comp, parseManualTextRows(options.textRows, lineColor, issues));
        addInfoLayer(comp, result.jsonFile, data);
        comp.openInViewer();

        if (data.stats && data.stats.maxLinesReached) {
            issues.push("Max lines limit was reached. Increase Max lines if important details are missing.");
        }
        if (lines.length <= 0) {
            issues.push("No lines were detected. Try lowering Foreground threshold or Min line length.");
        }
    } catch (err) {
        issues.push(err.toString() + (err.line ? " line " + err.line : ""));
    } finally {
        try {
            progress.win.close();
        } catch (ignoredProgress) {
        }
        app.endUndoGroup();
    }

    if (issues.length) {
        alert("HUD Rebuilder problems:\n\n- " + issues.join("\n- "));
    }
})();
