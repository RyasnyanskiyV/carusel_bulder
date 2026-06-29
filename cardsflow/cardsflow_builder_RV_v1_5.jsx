#target aftereffects
#targetengine "CardsFlowBuilderRVV15"

/*
    cardsflow_builder_RV v1.5
    ExtendScript for Adobe After Effects 2022+

    Clean first version inspired by a CardsFlow-style reference:
    - one main 3D composition
    - vertical rounded text/media placeholder cards
    - central card comes forward while side cards overlap, rotate and scale down
    - controller layers keep motion and visual design editable after creation
*/

(function CardsFlowBuilderRVV15(thisObj) {
    var VERSION = "1.5";
    var MAX_CARDS = 40;
    var FILM_SIZE_MM = 36;
    var CAMERA_PRESETS = [24, 35, 50, 80, 100];

    var ROOT_PREFIX = "CARDSFLOW_";
    var MAIN_PREFIX = "CF_MAIN_";
    var COMPS_FOLDER = "COMPS";
    var CARDS_FOLDER = "CARDS";

    var FLOW_CTRL = "flow_control";
    var CARD_CTRL = "card_control";
    var RIG_NAME = "CF_RIG";
    var CAMERA_NAME = "CF_CAMERA";
    var SLIDE_ID = "CF Slide ID";

    var FX_SLIDE_COUNT = "Slide Count";
    var FX_SLIDE_INDEX = "Slide Index";
    var FX_PROGRESS = "Progress (%)";
    var FX_CONSTANT_SPEED = "Constant Speed";
    var FX_SPEED = "Speed";
    var FX_DIRECTION = "Flow Direction";
    var FX_FLOW_MODE = "Flow Mode";
    var FX_SPACING = "Card Spacing (px)";
    var FX_DEPTH_Z = "Depth Z (px)";
    var FX_FOCUS_PUSH_Z = "Focus Push Z (px)";
    var FX_FOCUS_WIDTH = "Focus Width (cards)";
    var FX_VISIBLE_RANGE = "Visible Range (cards)";
    var FX_CENTER_SCALE = "Center Scale (%)";
    var FX_SIDE_SCALE = "Side Scale (%)";
    var FX_FAR_SCALE = "Far Scale (%)";
    var FX_SIDE_ROT_X = "Side Rotate X";
    var FX_SIDE_ROT_Y = "Side Rotate Y";
    var FX_SIDE_ROT_Z = "Side Rotate Z";
    var FX_FAN_ANGLE = "Fan Angle";
    var FX_CIRCLE_RADIUS = "Circle Radius (px)";
    var FX_CIRCLE_Y_SCALE = "Circle Y Scale (%)";
    var FX_GRID_COLUMNS = "Grid Columns";
    var FX_GRID_GAP_X = "Grid Gap X (px)";
    var FX_GRID_GAP_Y = "Grid Gap Y (px)";
    var FX_GRID_FIT = "Grid Fit (%)";
    var FX_CAMERA_LENS = "Camera Lens (mm)";
    var FX_CAMERA_DISTANCE_Z = "Camera Distance Z";
    var FX_MOTION_BLUR = "Motion Blur";
    var FX_SHUTTER_ANGLE = "Shutter Angle";
    var FX_MOTION_BLUR_SAMPLES = "Motion Blur Samples";

    var FX_CARD_W = "Card Width (px)";
    var FX_CARD_H = "Card Height (px)";
    var FX_CARD_RADIUS = "Card Radius (px)";
    var FX_FOCUS_FILL = "Focus Fill";
    var FX_SIDE_FILL = "Side Fill";
    var FX_FILL_OPACITY = "Fill Opacity (%)";
    var FX_FOCUS_STROKE = "Focus Stroke";
    var FX_SIDE_STROKE = "Side Stroke";
    var FX_STROKE_W = "Stroke Width";
    var FX_FOCUS_STROKE_W = "Focus Stroke Width";
    var FX_STROKE_OPACITY = "Stroke Opacity (%)";
    var FX_SHOW_TEXT = "Show Text";
    var FX_TEXT_FILL = "Text Fill";
    var FX_TEXT_SIZE = "Text Size";
    var FX_SUBTEXT_SIZE = "Subtext Size";
    var FX_TEXT_Y = "Text Y (px)";

    function clamp(value, minValue, maxValue) {
        return Math.max(minValue, Math.min(maxValue, value));
    }

    function pad2(value) {
        return value < 10 ? "0" + value : String(value);
    }

    function ensureProject() {
        if (!app.project) app.newProject();
        return app.project;
    }

    function addFolder(project, name, parent) {
        var folder = project.items.addFolder(name);
        if (parent) folder.parentFolder = parent;
        return folder;
    }

    function nextInstanceNumber(project) {
        var maxId = 0;
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            if (!(item instanceof FolderItem)) continue;
            var match = new RegExp("^" + ROOT_PREFIX + "(\\d+)$")
                .exec(item.name);
            if (match) maxId = Math.max(maxId, parseInt(match[1], 10));
        }
        return maxId + 1;
    }

    function addSlider(fx, name, value) {
        var effect = fx.addProperty("ADBE Slider Control");
        effect.name = name;
        effect.property(1).setValue(value);
        return effect;
    }

    function addAngle(fx, name, value) {
        var effect = fx.addProperty("ADBE Angle Control");
        effect.name = name;
        effect.property(1).setValue(value);
        return effect;
    }

    function addCheckbox(fx, name, checked) {
        var effect = fx.addProperty("ADBE Checkbox Control");
        effect.name = name;
        effect.property(1).setValue(checked ? 1 : 0);
        return effect;
    }

    function addColor(fx, name, value) {
        var effect = fx.addProperty("ADBE Color Control");
        effect.name = name;
        effect.property(1).setValue(value);
        return effect;
    }

    function addDropdown(fx, name, items, defaultIndex) {
        var effect = fx.addProperty("ADBE Dropdown Control");
        effect.name = name;
        var menu = effect.property(1);
        try {
            var configuredMenu = menu.setPropertyParameters(items);
            var configuredEffect = configuredMenu.propertyGroup(1);
            configuredEffect.name = name;
            configuredMenu.setValue(clamp(defaultIndex, 1, items.length));
            return configuredEffect;
        } catch (err) {
            menu.setValue(defaultIndex);
            return effect;
        }
    }

    function findEffect(layer, name) {
        if (!layer) return null;
        var fx = layer.property("ADBE Effect Parade");
        return fx ? fx.property(name) : null;
    }

    function ensureSlider(layer, name, value) {
        var effect = findEffect(layer, name);
        if (effect) return effect;
        return addSlider(layer.property("ADBE Effect Parade"), name, value);
    }

    function ensureAngle(layer, name, value) {
        var effect = findEffect(layer, name);
        if (effect) return effect;
        return addAngle(layer.property("ADBE Effect Parade"), name, value);
    }

    function ensureCheckbox(layer, name, checked) {
        var effect = findEffect(layer, name);
        if (effect) return effect;
        return addCheckbox(layer.property("ADBE Effect Parade"), name, checked);
    }

    function ensureColor(layer, name, value) {
        var effect = findEffect(layer, name);
        if (effect) return effect;
        return addColor(layer.property("ADBE Effect Parade"), name, value);
    }

    function ensureDropdown(layer, name, items, defaultIndex) {
        var effect = findEffect(layer, name);
        if (effect) return effect;
        return addDropdown(
            layer.property("ADBE Effect Parade"),
            name,
            items,
            defaultIndex
        );
    }

    function setEffectValue(layer, name, propName, value, issues) {
        try {
            var effect = findEffect(layer, name);
            if (!effect) {
                if (issues) issues.push(name + ": effect not found");
                return;
            }
            effect.property(propName).setValue(value);
        } catch (err) {
            if (issues) issues.push(name + ": " + err.toString());
        }
    }

    function assignExpression(prop, expressionText, label, issues) {
        if (!prop || !prop.canSetExpression) {
            issues.push(label + ": property cannot receive expression");
            return false;
        }
        try {
            prop.expression = expressionText;
            prop.expressionEnabled = true;
            var value = prop.value;
            if (prop.expressionError && prop.expressionError !== "") {
                issues.push(label + ": " + prop.expressionError);
                return false;
            }
            return true;
        } catch (err) {
            issues.push(label + ": " + err.toString());
            return false;
        }
    }

    function flowMathExpression(mainName, indent, sidExpression) {
        var p = indent || "";
        var sid = sidExpression || 'effect("' + SLIDE_ID + '")("Slider")';
        return p + 'c=comp("' + mainName + '").layer("' + FLOW_CTRL + '");\n' +
            p + 'maxN=' + MAX_CARDS + ';\n' +
            p + 'n=Math.max(1,Math.min(maxN,c.effect("' +
            FX_SLIDE_COUNT + '")("Slider")));\n' +
            p + 'sid=Math.max(1,Math.round(' + sid + '));\n' +
            p + 'idx=c.effect("' + FX_SLIDE_INDEX + '")("Slider")+' +
            'c.effect("' + FX_PROGRESS + '")("Slider")/100;\n' +
            p + 'if(c.effect("' + FX_CONSTANT_SPEED +
            '")("Checkbox")>0){idx+=time*c.effect("' + FX_SPEED +
            '")("Slider");}\n' +
            p + 'half=n/2;\n' +
            p + 'raw=sid-idx;\n' +
            p + 'o=((raw+half)%n+n)%n-half;\n' +
            p + 'a=Math.abs(o);\n' +
            p + 'fw=Math.max(0.001,c.effect("' + FX_FOCUS_WIDTH +
            '")("Slider"));\n' +
            p + 'focus=1-Math.min(1,a/fw);\n' +
            p + 'focus=focus*focus*(3-2*focus);\n';
    }

    function slidePositionExpression(mainName) {
        return flowMathExpression(mainName, "", null) +
            'mode=Math.round(c.effect("' + FX_FLOW_MODE + '")(1));\n' +
            'dir=Math.round(c.effect("' + FX_DIRECTION + '")(1));\n' +
            'spacing=c.effect("' + FX_SPACING + '")("Slider");\n' +
            'depth=c.effect("' + FX_DEPTH_Z + '")("Slider");\n' +
            'push=c.effect("' + FX_FOCUS_PUSH_Z + '")("Slider");\n' +
            'if(mode==2){\n' +
            '  x=o*spacing*0.42;y=a*spacing*0.035;' +
            'z=a*depth*0.62-focus*push;\n' +
            '}else if(mode==3){\n' +
            '  x=(dir==2)?0:o*spacing;y=(dir==2)?o*spacing:0;z=0;\n' +
            '}else if(mode==4){\n' +
            '  r=Math.max(1,c.effect("' + FX_CIRCLE_RADIUS +
            '")("Slider"));\n' +
            '  ys=c.effect("' + FX_CIRCLE_Y_SCALE + '")("Slider")/100;\n' +
            '  t=o*2*Math.PI/n;\n' +
            '  x=Math.sin(t)*r;y=(1-Math.cos(t))*r*ys;' +
            'z=(1-Math.cos(t))*depth*0.55-focus*push;\n' +
            '}else if(mode==5){\n' +
            '  cols=Math.max(1,Math.round(c.effect("' + FX_GRID_COLUMNS +
            '")("Slider")));\n' +
            '  gx=c.effect("' + FX_GRID_GAP_X + '")("Slider");\n' +
            '  gy=c.effect("' + FX_GRID_GAP_Y + '")("Slider");\n' +
            '  cw=comp("' + mainName + '").layer("' + CARD_CTRL +
            '").effect("' + FX_CARD_W + '")("Slider");\n' +
            '  ch=comp("' + mainName + '").layer("' + CARD_CTRL +
            '").effect("' + FX_CARD_H + '")("Slider");\n' +
            '  gx=Math.max(gx,cw*1.08);gy=Math.max(gy,ch*1.08);\n' +
            '  order=((sid-Math.round(idx))%n+n)%n;\n' +
            '  rows=Math.ceil(n/cols);\n' +
            '  col=order%cols;row=Math.floor(order/cols);\n' +
            '  x=(col-(cols-1)/2)*gx;y=(row-(rows-1)/2)*gy;z=0;\n' +
            '}else{\n' +
            '  x=(dir==2)?0:o*spacing;y=(dir==2)?o*spacing:0;' +
            'z=a*depth-focus*push;\n' +
            '}\n' +
            '[x,y,z];';
    }

    function slideScaleExpression(mainName) {
        return flowMathExpression(mainName, "", null) +
            'mode=Math.round(c.effect("' + FX_FLOW_MODE + '")(1));\n' +
            'centerS=c.effect("' + FX_CENTER_SCALE + '")("Slider");\n' +
            'sideS=c.effect("' + FX_SIDE_SCALE + '")("Slider");\n' +
            'farS=c.effect("' + FX_FAR_SCALE + '")("Slider");\n' +
            'farT=Math.min(1,Math.max(0,(a-1)/Math.max(1,half-1)));\n' +
            'base=sideS+(farS-sideS)*farT;\n' +
            'if(mode==5){\n' +
            '  cardCtrl=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            '  cw=Math.max(1,cardCtrl.effect("' + FX_CARD_W +
            '")("Slider"));\n' +
            '  ch=Math.max(1,cardCtrl.effect("' + FX_CARD_H +
            '")("Slider"));\n' +
            '  gx=Math.max(1,c.effect("' + FX_GRID_GAP_X +
            '")("Slider"));\n' +
            '  gy=Math.max(1,c.effect("' + FX_GRID_GAP_Y +
            '")("Slider"));\n' +
            '  fit=c.effect("' + FX_GRID_FIT + '")("Slider")/100;\n' +
            '  s=Math.min(100,Math.min(gx*0.92/cw,gy*0.92/ch)*100*fit);\n' +
            '}\n' +
            'else if(mode==3){s=sideS+(centerS-sideS)*focus;}\n' +
            'else{s=base+(centerS-base)*focus;}\n' +
            '[s,s,s];';
    }

    function slideOpacityExpression(mainName) {
        return flowMathExpression(mainName, "", null) +
            'mode=Math.round(c.effect("' + FX_FLOW_MODE + '")(1));\n' +
            'visible=Math.max(0.001,c.effect("' + FX_VISIBLE_RANGE +
            '")("Slider"));\n' +
            'fade=(mode==5)?1:Math.max(0,Math.min(1,(visible+1-a)));\n' +
            'fade=fade*fade*(3-2*fade);\n' +
            '100*fade;';
    }

    function slideRotationExpression(mainName, axisName) {
        var valueLine = axisName === "x"
            ? 'if(mode==5){v=0;}\n' +
                'else if(mode==4){v=sgn*rotX*0.18*(1-focus);}\n' +
                'else if(mode==2){v=0;}\n' +
                'else{v=(dir==2)?sgn*rotX*(1-focus):' +
                'sgn*rotX*0.25*(1-focus);}\n'
            : (axisName === "y"
                ? 'if(mode==5){v=0;}\n' +
                    'else if(mode==4){v=-o*(360/n)*0.22;}\n' +
                    'else if(mode==2){v=0;}\n' +
                    'else{v=(dir==2)?sgn*rotY*0.25*(1-focus):' +
                    '-sgn*rotY*(1-focus);}\n'
                : 'if(mode==2){v=o*c.effect("' + FX_FAN_ANGLE +
                    '")("Angle");}\n' +
                    'else if(mode==5){v=0;}\n' +
                    'else{v=sgn*rotZ*(1-focus);}\n');
        return flowMathExpression(mainName, "", null) +
            'mode=Math.round(c.effect("' + FX_FLOW_MODE + '")(1));\n' +
            'dir=Math.round(c.effect("' + FX_DIRECTION + '")(1));\n' +
            'rotX=c.effect("' + FX_SIDE_ROT_X + '")("Angle");\n' +
            'rotY=c.effect("' + FX_SIDE_ROT_Y + '")("Angle");\n' +
            'rotZ=c.effect("' + FX_SIDE_ROT_Z + '")("Angle");\n' +
            'sgn=(o<0)?-1:((o>0)?1:0);\n' +
            valueLine +
            'v;';
    }

    function cardFocusExpression(mainName) {
        return flowMathExpression(
            mainName,
            "",
            'parseInt(thisComp.name.split("_")[1],10)'
        );
    }

    function cardSizeExpression(mainName) {
        return 'ctrl=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            'w=Math.max(10,ctrl.effect("' + FX_CARD_W + '")("Slider"));\n' +
            'h=Math.max(10,ctrl.effect("' + FX_CARD_H + '")("Slider"));\n' +
            '[w,h];';
    }

    function cardPositionExpression() {
        return '[thisComp.width/2,thisComp.height/2];';
    }

    function cardRoundnessExpression(mainName) {
        return 'ctrl=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            'Math.max(0,ctrl.effect("' + FX_CARD_RADIUS + '")("Slider"));';
    }

    function fillColorExpression(mainName) {
        return 'ctrl=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            cardFocusExpression(mainName) +
            'a=ctrl.effect("' + FX_SIDE_FILL + '")("Color");\n' +
            'b=ctrl.effect("' + FX_FOCUS_FILL + '")("Color");\n' +
            '[a[0]+(b[0]-a[0])*focus,' +
            'a[1]+(b[1]-a[1])*focus,' +
            'a[2]+(b[2]-a[2])*focus,' +
            '1];';
    }

    function strokeColorExpression(mainName) {
        return 'ctrl=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            cardFocusExpression(mainName) +
            'a=ctrl.effect("' + FX_SIDE_STROKE + '")("Color");\n' +
            'b=ctrl.effect("' + FX_FOCUS_STROKE + '")("Color");\n' +
            '[a[0]+(b[0]-a[0])*focus,' +
            'a[1]+(b[1]-a[1])*focus,' +
            'a[2]+(b[2]-a[2])*focus,' +
            '1];';
    }

    function strokeWidthExpression(mainName) {
        return 'ctrl=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            cardFocusExpression(mainName) +
            'a=ctrl.effect("' + FX_STROKE_W + '")("Slider");\n' +
            'b=ctrl.effect("' + FX_FOCUS_STROKE_W + '")("Slider");\n' +
            'Math.max(0,a+(b-a)*focus);';
    }

    function fillOpacityExpression(mainName) {
        return 'ctrl=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            'Math.max(0,Math.min(100,ctrl.effect("' + FX_FILL_OPACITY +
            '")("Slider")));';
    }

    function strokeOpacityExpression(mainName) {
        return 'ctrl=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            'Math.max(0,Math.min(100,ctrl.effect("' + FX_STROKE_OPACITY +
            '")("Slider")));';
    }

    function textScaleExpression(mainName, baseSizeEffect, baseFontSize) {
        return 'ctrl=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            's=Math.max(1,ctrl.effect("' + baseSizeEffect +
            '")("Slider"));\n' +
            'k=s/' + baseFontSize + ';\n' +
            '[100*k,100*k];';
    }

    function textOpacityExpression(mainName) {
        return 'ctrl=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            'ctrl.effect("' + FX_SHOW_TEXT + '")("Checkbox")>0?100:0;';
    }

    function addFlowController(main, count, cardW, cardH, cameraDistance, cameraLens) {
        var ctrl = main.layers.addNull();
        ctrl.name = FLOW_CTRL;
        ctrl.label = 10;
        ctrl.property("ADBE Transform Group")
            .property("ADBE Position")
            .setValue([main.width * 0.5, 70]);

        var fx = ctrl.property("ADBE Effect Parade");
        addSlider(fx, FX_SLIDE_COUNT, count);
        addSlider(fx, FX_SLIDE_INDEX, 1);
        addSlider(fx, FX_PROGRESS, 0);
        addCheckbox(fx, FX_CONSTANT_SPEED, false);
        addSlider(fx, FX_SPEED, 0.4);
        addDropdown(fx, FX_DIRECTION, ["Horizontal X", "Vertical Y"], 1);
        addDropdown(
            fx,
            FX_FLOW_MODE,
            ["Cover Flow", "Fan Stack", "Line", "Circle Orbit", "Grid"],
            1
        );
        addSlider(fx, FX_SPACING, Math.round(cardW * 1.02));
        addSlider(fx, FX_DEPTH_Z, 320);
        addSlider(fx, FX_FOCUS_PUSH_Z, 260);
        addSlider(fx, FX_FOCUS_WIDTH, 1.05);
        addSlider(fx, FX_VISIBLE_RANGE, 4);
        addSlider(fx, FX_CENTER_SCALE, 112);
        addSlider(fx, FX_SIDE_SCALE, 82);
        addSlider(fx, FX_FAR_SCALE, 54);
        addAngle(fx, FX_SIDE_ROT_X, 10);
        addAngle(fx, FX_SIDE_ROT_Y, 24);
        addAngle(fx, FX_SIDE_ROT_Z, -2);
        addAngle(fx, FX_FAN_ANGLE, 6);
        addSlider(fx, FX_CIRCLE_RADIUS, Math.round(cardW * 1.75));
        addSlider(fx, FX_CIRCLE_Y_SCALE, 28);
        addSlider(fx, FX_GRID_COLUMNS, 4);
        addSlider(fx, FX_GRID_GAP_X, Math.round(cardW * 1.14));
        addSlider(fx, FX_GRID_GAP_Y, Math.round(cardH * 1.12));
        addSlider(fx, FX_GRID_FIT, 92);
        addSlider(fx, FX_CAMERA_LENS, cameraLens || 50);
        addSlider(fx, FX_CAMERA_DISTANCE_Z, cameraDistance);
        addCheckbox(fx, FX_MOTION_BLUR, true);
        addSlider(fx, FX_SHUTTER_ANGLE, 180);
        addSlider(fx, FX_MOTION_BLUR_SAMPLES, 16);
        return ctrl;
    }

    function addCardController(main, cardW, cardH) {
        var ctrl = main.layers.addNull();
        ctrl.name = CARD_CTRL;
        ctrl.label = 11;
        ctrl.property("ADBE Transform Group")
            .property("ADBE Position")
            .setValue([main.width * 0.5, 130]);

        var fx = ctrl.property("ADBE Effect Parade");
        addSlider(fx, FX_CARD_W, cardW);
        addSlider(fx, FX_CARD_H, cardH);
        addSlider(fx, FX_CARD_RADIUS, Math.round(Math.min(cardW, cardH) * 0.12));
        addColor(fx, FX_FOCUS_FILL, [0.96, 0.32, 0.03]);
        addColor(fx, FX_SIDE_FILL, [0.02, 0.12, 0.88]);
        addSlider(fx, FX_FILL_OPACITY, 100);
        addColor(fx, FX_FOCUS_STROKE, [1, 0.68, 0.2]);
        addColor(fx, FX_SIDE_STROKE, [0.08, 0.22, 1]);
        addSlider(fx, FX_STROKE_W, 0);
        addSlider(fx, FX_FOCUS_STROKE_W, 6);
        addSlider(fx, FX_STROKE_OPACITY, 100);
        addCheckbox(fx, FX_SHOW_TEXT, true);
        addColor(fx, FX_TEXT_FILL, [1, 1, 1]);
        addSlider(fx, FX_TEXT_SIZE, Math.round(cardH * 0.17));
        addSlider(fx, FX_SUBTEXT_SIZE, Math.round(cardH * 0.035));
        addSlider(fx, FX_TEXT_Y, Math.round(-cardH * 0.04));
        return ctrl;
    }

    function addCamera(main, cameraDistance, issues) {
        var center = [main.width * 0.5, main.height * 0.5];
        var camera = main.layers.addCamera(CAMERA_NAME, center);
        camera.label = 9;
        var transform = camera.property("ADBE Transform Group");
        transform.property("ADBE Position")
            .setValue([center[0], center[1], -cameraDistance]);
        try {
            transform.property("ADBE Anchor Point")
                .setValue([center[0], center[1], 0]);
            camera.autoOrient = AutoOrientType.CAMERA_OR_POINT_OF_INTEREST;
        } catch (err) {
            issues.push("Camera point of interest: " + err.toString());
        }
        assignExpression(
            transform.property("ADBE Position"),
            'c=thisComp.layer("' + FLOW_CTRL + '");\n' +
            'd=Math.max(1,c.effect("' + FX_CAMERA_DISTANCE_Z +
            '")("Slider"));\n' +
            '[thisComp.width/2,thisComp.height/2,-d];',
            "Camera distance",
            issues
        );
        try {
            var zoom = cameraZoomProperty(camera);
            if (zoom) {
                assignExpression(
                    zoom,
                    'c=thisComp.layer("' + FLOW_CTRL + '");\n' +
                    'lens=Math.max(1,c.effect("' + FX_CAMERA_LENS +
                    '")("Slider"));\n' +
                    'thisComp.width*lens/' + FILM_SIZE_MM + ';',
                    "Camera lens zoom",
                    issues
                );
            }
        } catch (zoomErr) {
            issues.push("Camera lens zoom: " + zoomErr.toString());
        }
        return camera;
    }

    function cameraOptionsProperty(camera) {
        if (!camera) return null;
        var options = camera.property("ADBE Camera Options Group") ||
            camera.property("ADBE Camera Options") ||
            camera.property("Camera Options");
        if (options) return options;
        try {
            for (var i = 1; i <= camera.numProperties; i++) {
                var prop = camera.property(i);
                var propName = (prop.name || "").toLowerCase();
                var matchName = (prop.matchName || "").toLowerCase();
                if (propName.indexOf("camera options") >= 0 ||
                        matchName.indexOf("camera options") >= 0) {
                    return prop;
                }
            }
        } catch (ignored) {
        }
        return null;
    }

    function cameraZoomProperty(camera) {
        var options = cameraOptionsProperty(camera);
        if (!options) return null;
        var zoom = options.property("ADBE Camera Zoom") ||
            options.property("ADBE Camera Zoom2") ||
            options.property("Zoom");
        if (zoom) return zoom;
        try {
            for (var i = 1; i <= options.numProperties; i++) {
                var prop = options.property(i);
                var propName = (prop.name || "").toLowerCase();
                var matchName = (prop.matchName || "").toLowerCase();
                if (propName.indexOf("zoom") >= 0 ||
                        matchName.indexOf("zoom") >= 0) {
                    return prop;
                }
            }
        } catch (ignored) {
        }
        return null;
    }

    function applyCameraLens(main, issues) {
        var flowCtrl = null;
        var camera = null;
        try {
            flowCtrl = main.layer(FLOW_CTRL);
            camera = main.layer(CAMERA_NAME);
        } catch (ignored) {
        }
        if (!flowCtrl || !camera) return;
        try {
            var lens = effectNumber(flowCtrl, FX_CAMERA_LENS, 50);
            var zoom = cameraZoomProperty(camera);
            if (zoom) {
                zoom.expression = "";
                zoom.setValue(main.width * lens / FILM_SIZE_MM);
                assignExpression(
                    zoom,
                    'c=thisComp.layer("' + FLOW_CTRL + '");\n' +
                    'lens=Math.max(1,c.effect("' + FX_CAMERA_LENS +
                    '")("Slider"));\n' +
                    'thisComp.width*lens/' + FILM_SIZE_MM + ';',
                    "Camera lens zoom",
                    issues
                );
            }
        } catch (err) {
            if (issues) issues.push("Apply camera lens: " + err.toString());
        }
    }

    function addRig(main) {
        var rig = main.layers.addNull();
        rig.name = RIG_NAME;
        rig.label = 12;
        rig.threeDLayer = true;
        rig.property("ADBE Transform Group")
            .property("ADBE Position")
            .setValue([main.width * 0.5, main.height * 0.5, 0]);
        return rig;
    }

    function createCardComp(project, folder, mainName, id, duration, fps, cardW, cardH, issues) {
        var compName = "PH_" + pad2(id);
        var compW = Math.round(cardW * 1.08);
        var compH = Math.round(cardH * 1.08);
        var comp = project.items.addComp(compName, compW, compH, 1, duration, fps);
        comp.parentFolder = folder;

        var card = comp.layers.addShape();
        card.name = "CARD";
        var cardContents = card.property("ADBE Root Vectors Group");
        var cardGroup = cardContents.addProperty("ADBE Vector Group");
        cardGroup.name = "CARD_SHAPE";
        var groupContents = cardGroup.property("ADBE Vectors Group");
        var rect = groupContents.addProperty("ADBE Vector Shape - Rect");
        assignExpression(
            rect.property("ADBE Vector Rect Size"),
            cardSizeExpression(mainName),
            compName + " card size",
            issues
        );
        assignExpression(
            rect.property("ADBE Vector Rect Roundness"),
            cardRoundnessExpression(mainName),
            compName + " card radius",
            issues
        );
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        assignExpression(
            fill.property("ADBE Vector Fill Color"),
            fillColorExpression(mainName),
            compName + " fill color",
            issues
        );
        assignExpression(
            fill.property("ADBE Vector Fill Opacity"),
            fillOpacityExpression(mainName),
            compName + " fill opacity",
            issues
        );
        var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
        assignExpression(
            stroke.property("ADBE Vector Stroke Color"),
            strokeColorExpression(mainName),
            compName + " stroke color",
            issues
        );
        assignExpression(
            stroke.property("ADBE Vector Stroke Width"),
            strokeWidthExpression(mainName),
            compName + " stroke width",
            issues
        );
        assignExpression(
            stroke.property("ADBE Vector Stroke Opacity"),
            strokeOpacityExpression(mainName),
            compName + " stroke opacity",
            issues
        );
        try {
            stroke.property("ADBE Vector Stroke Line Join").setValue(2);
        } catch (ignoredJoin) {
        }
        card.property("ADBE Transform Group")
            .property("ADBE Position")
            .setValue([compW * 0.5, compH * 0.5]);

        var numberText = comp.layers.addText(pad2(id));
        numberText.name = "NUMBER";
        var numberDoc = numberText.property("ADBE Text Properties")
            .property("ADBE Text Document").value;
        numberDoc.applyFill = true;
        numberDoc.fillColor = [1, 1, 1];
        numberDoc.fontSize = Math.round(cardH * 0.13);
        try {
            numberDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        } catch (ignoredJustification) {
        }
        numberText.property("ADBE Text Properties")
            .property("ADBE Text Document")
            .setValue(numberDoc);
        assignExpression(
            numberText.property("ADBE Transform Group")
                .property("ADBE Anchor Point"),
            'r=sourceRectAtTime(time,false);\n' +
            '[r.left+r.width/2,r.top+r.height/2];',
            compName + " number anchor",
            issues
        );
        assignExpression(
            numberText.property("ADBE Transform Group")
                .property("ADBE Position"),
            'ctrl=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            'y=ctrl.effect("' + FX_TEXT_Y + '")("Slider");\n' +
            '[thisComp.width/2,thisComp.height/2+y];',
            compName + " number position",
            issues
        );
        assignExpression(
            numberText.property("ADBE Transform Group")
                .property("ADBE Scale"),
            textScaleExpression(mainName, FX_TEXT_SIZE, numberDoc.fontSize),
            compName + " number size",
            issues
        );
        assignExpression(
            numberText.property("ADBE Transform Group")
                .property("ADBE Opacity"),
            textOpacityExpression(mainName),
            compName + " number opacity",
            issues
        );

        var subText = comp.layers.addText("insert video or image");
        subText.name = "SUBTITLE";
        var subDoc = subText.property("ADBE Text Properties")
            .property("ADBE Text Document").value;
        subDoc.applyFill = true;
        subDoc.fillColor = [1, 1, 1];
        subDoc.fontSize = Math.round(cardH * 0.025);
        try {
            subDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
        } catch (ignoredSubJustification) {
        }
        subText.property("ADBE Text Properties")
            .property("ADBE Text Document")
            .setValue(subDoc);
        assignExpression(
            subText.property("ADBE Transform Group")
                .property("ADBE Anchor Point"),
            'r=sourceRectAtTime(time,false);\n' +
            '[r.left+r.width/2,r.top+r.height/2];',
            compName + " subtitle anchor",
            issues
        );
        assignExpression(
            subText.property("ADBE Transform Group")
                .property("ADBE Position"),
            'ctrl=comp("' + mainName + '").layer("' + CARD_CTRL + '");\n' +
            'h=ctrl.effect("' + FX_CARD_H + '")("Slider");\n' +
            'y=ctrl.effect("' + FX_TEXT_Y + '")("Slider");\n' +
            '[thisComp.width/2,thisComp.height/2+y+h*0.16];',
            compName + " subtitle position",
            issues
        );
        assignExpression(
            subText.property("ADBE Transform Group")
                .property("ADBE Scale"),
            textScaleExpression(mainName, FX_SUBTEXT_SIZE, subDoc.fontSize),
            compName + " subtitle size",
            issues
        );
        assignExpression(
            subText.property("ADBE Transform Group")
                .property("ADBE Opacity"),
            textOpacityExpression(mainName),
            compName + " subtitle opacity",
            issues
        );

        return comp;
    }

    function addSlides(main, cardComps, rig, mainName, issues) {
        for (var i = cardComps.length - 1; i >= 0; i--) {
            var source = cardComps[i];
            var slide = main.layers.add(source);
            slide.name = source.name;
            slide.threeDLayer = true;
            slide.motionBlur = true;
            slide.parent = rig;
            slide.property("ADBE Transform Group")
                .property("ADBE Anchor Point")
                .setValue([source.width * 0.5, source.height * 0.5, 0]);
            var fx = slide.property("ADBE Effect Parade");
            addSlider(fx, SLIDE_ID, i + 1);
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Position"),
                slidePositionExpression(mainName),
                slide.name + " position",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Scale"),
                slideScaleExpression(mainName),
                slide.name + " scale",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Opacity"),
                slideOpacityExpression(mainName),
                slide.name + " opacity",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Rotate X"),
                slideRotationExpression(mainName, "x"),
                slide.name + " rotate x",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Rotate Y"),
                slideRotationExpression(mainName, "y"),
                slide.name + " rotate y",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Rotate Z"),
                slideRotationExpression(mainName, "z"),
                slide.name + " rotate z",
                issues
            );
        }
    }

    function configureMotionBlur(main) {
        try {
            main.motionBlur = true;
            main.shutterAngle = 180;
            main.shutterPhase = -90;
            main.motionBlurSamplesPerFrame = 16;
            main.motionBlurAdaptiveSampleLimit = 32;
        } catch (ignored) {
        }
    }

    function build(options) {
        var project = ensureProject();
        var issues = [];
        var instanceId = pad2(nextInstanceNumber(project));
        var rootName = ROOT_PREFIX + instanceId;
        var mainName = MAIN_PREFIX + instanceId;

        var mainW = options.vertical ? 2160 : 3840;
        var mainH = options.vertical ? 3840 : 2160;
        var fps = 30;
        var cameraDistance = Math.max(1200, Math.round(options.cardH * 2.8));

        var root = addFolder(project, rootName, null);
        var compsFolder = addFolder(project, COMPS_FOLDER, root);
        var cardsFolder = addFolder(project, CARDS_FOLDER, root);

        var main = project.items.addComp(
            mainName,
            mainW,
            mainH,
            1,
            options.duration,
            fps
        );
        main.parentFolder = compsFolder;
        configureMotionBlur(main);

        var flowCtrl = addFlowController(
            main,
            options.count,
            options.cardW,
            options.cardH,
            cameraDistance,
            options.cameraLens || 50
        );
        var cardCtrl = addCardController(main, options.cardW, options.cardH);
        var camera = addCamera(main, cameraDistance, issues);
        applyCameraLens(main, issues);
        var rig = addRig(main);

        var cards = [];
        for (var i = 1; i <= options.count; i++) {
            cards.push(createCardComp(
                project,
                cardsFolder,
                mainName,
                i,
                options.duration,
                fps,
                options.cardW,
                options.cardH,
                issues
            ));
        }
        addSlides(main, cards, rig, mainName, issues);

        try {
            camera.moveToEnd();
            rig.moveBefore(camera);
            cardCtrl.moveToBeginning();
            flowCtrl.moveToBeginning();
        } catch (ignoredOrder) {
        }

        main.openInViewer();
        return {
            rootName: rootName,
            mainName: mainName,
            cardCount: options.count,
            issues: issues
        };
    }

    function findCompInFolder(folder, namePattern) {
        if (!folder) return null;
        for (var i = 1; i <= folder.numItems; i++) {
            var item = folder.item(i);
            if (item instanceof CompItem && namePattern.test(item.name)) {
                return item;
            }
            if (item instanceof FolderItem) {
                var nested = findCompInFolder(item, namePattern);
                if (nested) return nested;
            }
        }
        return null;
    }

    function rootFolderForItem(item) {
        var folder = item ? item.parentFolder : null;
        while (folder) {
            if (new RegExp("^" + ROOT_PREFIX + "\\d+$").test(folder.name)) {
                return folder;
            }
            folder = folder.parentFolder;
        }
        return null;
    }

    function findActiveCardsFlowMain() {
        var item = app.project ? app.project.activeItem : null;
        if (!(item instanceof CompItem)) return null;
        var root = rootFolderForItem(item);
        if (!root) return null;
        if (new RegExp("^" + MAIN_PREFIX + "\\d+$").test(item.name)) {
            return item;
        }
        return findCompInFolder(
            root,
            new RegExp("^" + MAIN_PREFIX + "\\d+$")
        );
    }

    function effectNumber(layer, name, fallback) {
        try {
            var effect = findEffect(layer, name);
            return effect ? effect.property(1).value : fallback;
        } catch (ignored) {
            return fallback;
        }
    }

    function refreshCamera(main, issues) {
        var camera = null;
        try {
            camera = main.layer(CAMERA_NAME);
        } catch (ignoredCamera) {
        }
        if (!camera) {
            addCamera(
                main,
                effectNumber(main.layer(FLOW_CTRL), FX_CAMERA_DISTANCE_Z, 2500),
                issues
            );
            return;
        }

        var transform = camera.property("ADBE Transform Group");
        assignExpression(
            transform.property("ADBE Position"),
            'c=thisComp.layer("' + FLOW_CTRL + '");\n' +
            'd=Math.max(1,c.effect("' + FX_CAMERA_DISTANCE_Z +
            '")("Slider"));\n' +
            '[thisComp.width/2,thisComp.height/2,-d];',
            "Camera distance",
            issues
        );
        try {
            var zoom = cameraZoomProperty(camera);
            if (zoom) {
                assignExpression(
                    zoom,
                    'c=thisComp.layer("' + FLOW_CTRL + '");\n' +
                    'lens=Math.max(1,c.effect("' + FX_CAMERA_LENS +
                    '")("Slider"));\n' +
                    'thisComp.width*lens/' + FILM_SIZE_MM + ';',
                    "Camera lens zoom",
                    issues
                );
            }
        } catch (zoomErr) {
            issues.push("Camera lens zoom: " + zoomErr.toString());
        }
    }

    function collectSlideLayers(main) {
        var slides = [];
        for (var i = 1; i <= main.numLayers; i++) {
            var layer = main.layer(i);
            var idEffect = findEffect(layer, SLIDE_ID);
            if (idEffect && layer.source instanceof CompItem) {
                slides.push(layer);
            }
        }
        return slides;
    }

    function refreshCardComps(main, issues) {
        var cardCtrl = main.layer(CARD_CTRL);
        var cardW = Math.round(effectNumber(cardCtrl, FX_CARD_W, 720));
        var cardH = Math.round(effectNumber(cardCtrl, FX_CARD_H, 1080));
        var compW = Math.round(cardW * 1.08);
        var compH = Math.round(cardH * 1.08);
        var slides = collectSlideLayers(main);
        for (var i = 0; i < slides.length; i++) {
            try {
                var comp = slides[i].source;
                comp.width = compW;
                comp.height = compH;
                var cardLayer = comp.layer("CARD");
                if (cardLayer) {
                    cardLayer.property("ADBE Transform Group")
                        .property("ADBE Position")
                        .setValue([compW * 0.5, compH * 0.5]);
                }
            } catch (err) {
                issues.push(slides[i].name + " card comp resize: " + err.toString());
            }
        }
    }

    function refreshSlideExpressions(main, issues) {
        var slides = collectSlideLayers(main);
        for (var i = 0; i < slides.length; i++) {
            var slide = slides[i];
            try {
                slide.threeDLayer = true;
                slide.motionBlur = true;
                slide.property("ADBE Transform Group")
                    .property("ADBE Anchor Point")
                    .setValue([
                        slide.source.width * 0.5,
                        slide.source.height * 0.5,
                        0
                    ]);
            } catch (anchorErr) {
                issues.push(slide.name + " anchor: " + anchorErr.toString());
            }
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Position"),
                slidePositionExpression(main.name),
                slide.name + " position",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Scale"),
                slideScaleExpression(main.name),
                slide.name + " scale",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Opacity"),
                slideOpacityExpression(main.name),
                slide.name + " opacity",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Rotate X"),
                slideRotationExpression(main.name, "x"),
                slide.name + " rotate x",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Rotate Y"),
                slideRotationExpression(main.name, "y"),
                slide.name + " rotate y",
                issues
            );
            assignExpression(
                slide.property("ADBE Transform Group")
                    .property("ADBE Rotate Z"),
                slideRotationExpression(main.name, "z"),
                slide.name + " rotate z",
                issues
            );
        }
    }

    function ensureControllers(main, issues) {
        var flowCtrl = main.layer(FLOW_CTRL);
        var cardCtrl = main.layer(CARD_CTRL);
        if (!flowCtrl || !cardCtrl) {
            issues.push(main.name + ": controller layers not found");
            return;
        }

        var count = 0;
        for (var i = 1; i <= main.numLayers; i++) {
            var layer = main.layer(i);
            if (findEffect(layer, SLIDE_ID)) count++;
        }

        ensureSlider(flowCtrl, FX_SLIDE_COUNT, Math.max(1, count));
        ensureSlider(flowCtrl, FX_SLIDE_INDEX, 1);
        ensureSlider(flowCtrl, FX_PROGRESS, 0);
        ensureCheckbox(flowCtrl, FX_CONSTANT_SPEED, false);
        ensureSlider(flowCtrl, FX_SPEED, 0.4);
        ensureDropdown(flowCtrl, FX_DIRECTION, ["Horizontal X", "Vertical Y"], 1);
        ensureDropdown(
            flowCtrl,
            FX_FLOW_MODE,
            ["Cover Flow", "Fan Stack", "Line", "Circle Orbit", "Grid"],
            1
        );
        ensureSlider(flowCtrl, FX_SPACING, 735);
        ensureSlider(flowCtrl, FX_DEPTH_Z, 320);
        ensureSlider(flowCtrl, FX_FOCUS_PUSH_Z, 260);
        ensureSlider(flowCtrl, FX_FOCUS_WIDTH, 1.05);
        ensureSlider(flowCtrl, FX_VISIBLE_RANGE, 4);
        ensureSlider(flowCtrl, FX_CENTER_SCALE, 112);
        ensureSlider(flowCtrl, FX_SIDE_SCALE, 82);
        ensureSlider(flowCtrl, FX_FAR_SCALE, 54);
        ensureAngle(flowCtrl, FX_SIDE_ROT_X, 10);
        ensureAngle(flowCtrl, FX_SIDE_ROT_Y, 24);
        ensureAngle(flowCtrl, FX_SIDE_ROT_Z, -2);
        ensureAngle(flowCtrl, FX_FAN_ANGLE, 6);
        ensureSlider(flowCtrl, FX_CIRCLE_RADIUS, 1260);
        ensureSlider(flowCtrl, FX_CIRCLE_Y_SCALE, 28);
        ensureSlider(flowCtrl, FX_GRID_COLUMNS, 4);
        ensureSlider(flowCtrl, FX_GRID_GAP_X, 820);
        ensureSlider(flowCtrl, FX_GRID_GAP_Y, 1210);
        ensureSlider(flowCtrl, FX_GRID_FIT, 92);
        ensureSlider(flowCtrl, FX_CAMERA_LENS, 50);
        ensureSlider(flowCtrl, FX_CAMERA_DISTANCE_Z, 2500);
        ensureCheckbox(flowCtrl, FX_MOTION_BLUR, true);
        ensureSlider(flowCtrl, FX_SHUTTER_ANGLE, 180);
        ensureSlider(flowCtrl, FX_MOTION_BLUR_SAMPLES, 16);

        ensureSlider(cardCtrl, FX_CARD_W, 720);
        ensureSlider(cardCtrl, FX_CARD_H, 1080);
        ensureSlider(cardCtrl, FX_CARD_RADIUS, 90);
        ensureColor(cardCtrl, FX_FOCUS_FILL, [0.96, 0.32, 0.03]);
        ensureColor(cardCtrl, FX_SIDE_FILL, [0.02, 0.12, 0.88]);
        ensureSlider(cardCtrl, FX_FILL_OPACITY, 100);
        ensureColor(cardCtrl, FX_FOCUS_STROKE, [1, 0.68, 0.2]);
        ensureColor(cardCtrl, FX_SIDE_STROKE, [0.08, 0.22, 1]);
        ensureSlider(cardCtrl, FX_STROKE_W, 0);
        ensureSlider(cardCtrl, FX_FOCUS_STROKE_W, 6);
        ensureSlider(cardCtrl, FX_STROKE_OPACITY, 100);
        ensureCheckbox(cardCtrl, FX_SHOW_TEXT, true);
        ensureColor(cardCtrl, FX_TEXT_FILL, [1, 1, 1]);
        ensureSlider(cardCtrl, FX_TEXT_SIZE, 180);
        ensureSlider(cardCtrl, FX_SUBTEXT_SIZE, 38);
        ensureSlider(cardCtrl, FX_TEXT_Y, -45);
    }

    function updateActiveRig(options) {
        var issues = [];
        var main = findActiveCardsFlowMain();
        if (!main) {
            return {
                mainName: "",
                issues: ["Activate a CF_MAIN_XX composition inside CARDSFLOW_XX."]
            };
        }
        ensureControllers(main, issues);
        if (options && options.cameraLens) {
            setEffectValue(
                main.layer(FLOW_CTRL),
                FX_CAMERA_LENS,
                "Slider",
                options.cameraLens,
                issues
            );
        }
        refreshCardComps(main, issues);
        refreshSlideExpressions(main, issues);
        refreshCamera(main, issues);
        applyCameraLens(main, issues);
        configureMotionBlur(main);
        main.openInViewer();
        return {
            mainName: main.name,
            issues: issues
        };
    }

    function resetActiveRig() {
        var issues = [];
        var main = findActiveCardsFlowMain();
        if (!main) {
            return {
                mainName: "",
                issues: ["Activate a CF_MAIN_XX composition inside CARDSFLOW_XX."]
            };
        }
        ensureControllers(main, issues);
        var flowCtrl = main.layer(FLOW_CTRL);
        var cardCtrl = main.layer(CARD_CTRL);
        setEffectValue(flowCtrl, FX_SLIDE_INDEX, "Slider", 1, issues);
        setEffectValue(flowCtrl, FX_PROGRESS, "Slider", 0, issues);
        setEffectValue(flowCtrl, FX_CONSTANT_SPEED, "Checkbox", 0, issues);
        setEffectValue(flowCtrl, FX_SPEED, "Slider", 0.4, issues);
        setEffectValue(flowCtrl, FX_SPACING, "Slider", 735, issues);
        setEffectValue(flowCtrl, FX_DEPTH_Z, "Slider", 320, issues);
        setEffectValue(flowCtrl, FX_FOCUS_PUSH_Z, "Slider", 260, issues);
        setEffectValue(flowCtrl, FX_FOCUS_WIDTH, "Slider", 1.05, issues);
        setEffectValue(flowCtrl, FX_VISIBLE_RANGE, "Slider", 4, issues);
        setEffectValue(flowCtrl, FX_CENTER_SCALE, "Slider", 112, issues);
        setEffectValue(flowCtrl, FX_SIDE_SCALE, "Slider", 82, issues);
        setEffectValue(flowCtrl, FX_FAR_SCALE, "Slider", 54, issues);
        setEffectValue(flowCtrl, FX_SIDE_ROT_X, "Angle", 10, issues);
        setEffectValue(flowCtrl, FX_SIDE_ROT_Y, "Angle", 24, issues);
        setEffectValue(flowCtrl, FX_SIDE_ROT_Z, "Angle", -2, issues);
        setEffectValue(flowCtrl, FX_FAN_ANGLE, "Angle", 6, issues);
        setEffectValue(flowCtrl, FX_CIRCLE_RADIUS, "Slider", 1260, issues);
        setEffectValue(flowCtrl, FX_CIRCLE_Y_SCALE, "Slider", 28, issues);
        setEffectValue(flowCtrl, FX_GRID_COLUMNS, "Slider", 4, issues);
        setEffectValue(flowCtrl, FX_GRID_GAP_X, "Slider", 820, issues);
        setEffectValue(flowCtrl, FX_GRID_GAP_Y, "Slider", 1210, issues);
        setEffectValue(flowCtrl, FX_GRID_FIT, "Slider", 92, issues);
        setEffectValue(flowCtrl, FX_CAMERA_LENS, "Slider", 50, issues);
        setEffectValue(flowCtrl, FX_MOTION_BLUR, "Checkbox", 1, issues);
        setEffectValue(flowCtrl, FX_SHUTTER_ANGLE, "Slider", 180, issues);
        setEffectValue(flowCtrl, FX_MOTION_BLUR_SAMPLES, "Slider", 16, issues);

        setEffectValue(cardCtrl, FX_CARD_RADIUS, "Slider", 90, issues);
        setEffectValue(cardCtrl, FX_FOCUS_FILL, "Color", [0.96, 0.32, 0.03], issues);
        setEffectValue(cardCtrl, FX_SIDE_FILL, "Color", [0.02, 0.12, 0.88], issues);
        setEffectValue(cardCtrl, FX_FILL_OPACITY, "Slider", 100, issues);
        setEffectValue(cardCtrl, FX_FOCUS_STROKE, "Color", [1, 0.68, 0.2], issues);
        setEffectValue(cardCtrl, FX_SIDE_STROKE, "Color", [0.08, 0.22, 1], issues);
        setEffectValue(cardCtrl, FX_STROKE_W, "Slider", 0, issues);
        setEffectValue(cardCtrl, FX_FOCUS_STROKE_W, "Slider", 6, issues);
        setEffectValue(cardCtrl, FX_STROKE_OPACITY, "Slider", 100, issues);
        setEffectValue(cardCtrl, FX_SHOW_TEXT, "Checkbox", 1, issues);
        setEffectValue(cardCtrl, FX_TEXT_FILL, "Color", [1, 1, 1], issues);
        setEffectValue(cardCtrl, FX_TEXT_SIZE, "Slider", 180, issues);
        setEffectValue(cardCtrl, FX_SUBTEXT_SIZE, "Slider", 38, issues);
        setEffectValue(cardCtrl, FX_TEXT_Y, "Slider", -45, issues);
        refreshCardComps(main, issues);
        refreshSlideExpressions(main, issues);
        refreshCamera(main, issues);
        applyCameraLens(main, issues);
        configureMotionBlur(main);
        main.openInViewer();
        return {
            mainName: main.name,
            issues: issues
        };
    }

    function showWarnings(issues) {
        if (!issues || issues.length === 0) return;
        var maxShown = Math.min(12, issues.length);
        var message = "CardsFlow warnings (" + issues.length + "):";
        for (var i = 0; i < maxShown; i++) {
            message += "\n- " + issues[i];
        }
        if (issues.length > maxShown) {
            message += "\n- ...and " + (issues.length - maxShown) + " more";
        }
        alert(message);
    }

    function parsePanelOptions(ui) {
        var count = parseInt(ui.count.text, 10);
        if (isNaN(count)) count = 8;
        count = clamp(count, 1, MAX_CARDS);
        ui.count.text = String(count);

        var duration = parseFloat(ui.duration.text);
        if (isNaN(duration)) duration = 60;
        duration = clamp(duration, 1, 600);
        ui.duration.text = String(duration);

        var cardW = parseInt(ui.cardW.text, 10);
        if (isNaN(cardW)) cardW = 720;
        cardW = clamp(cardW, 100, 4000);
        ui.cardW.text = String(cardW);

        var cardH = parseInt(ui.cardH.text, 10);
        if (isNaN(cardH)) cardH = 1080;
        cardH = clamp(cardH, 100, 5000);
        ui.cardH.text = String(cardH);

        var lensIndex = ui.cameraPreset.selection
            ? ui.cameraPreset.selection.index
            : 2;
        var cameraLens = CAMERA_PRESETS[lensIndex] || 50;

        return {
            count: count,
            duration: duration,
            cardW: cardW,
            cardH: cardH,
            vertical: ui.orientation.selection.index === 1,
            cameraLens: cameraLens
        };
    }

    function setButtonsEnabled(ui, enabled) {
        ui.createButton.enabled = enabled;
        ui.updateButton.enabled = enabled;
        ui.resetButton.enabled = enabled;
    }

    function runPanelCommand(ui, statusText, undoName, command) {
        setButtonsEnabled(ui, false);
        ui.status.text = statusText;
        app.beginUndoGroup(undoName);
        try {
            var result = command();
            ui.status.text = result.mainName || "Ready";
            showWarnings(result.issues);
        } catch (err) {
            ui.status.text = "Error";
            alert(
                undoName + " failed:\n" +
                err.toString() +
                (err.line ? "\nLine: " + err.line : "")
            );
        } finally {
            app.endUndoGroup();
            setButtonsEnabled(ui, true);
        }
    }

    function makePanel(thisObj) {
        var win = thisObj instanceof Panel
            ? thisObj
            : new Window(
                "palette",
                "cardsflow_builder_RV v" + VERSION,
                undefined,
                { resizeable: true }
            );
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.margins = 12;
        win.spacing = 8;

        var title = win.add(
            "statictext",
            undefined,
            "CARDSFLOW BUILDER - v" + VERSION
        );

        var buildPanel = win.add("panel", undefined, "Build");
        buildPanel.orientation = "column";
        buildPanel.alignChildren = ["fill", "top"];
        buildPanel.margins = 12;

        var countRow = buildPanel.add("group");
        countRow.add("statictext", undefined, "Cards:");
        var count = countRow.add("edittext", undefined, "8");
        count.characters = 6;
        countRow.add("statictext", undefined, "Duration:");
        var duration = countRow.add("edittext", undefined, "60");
        duration.characters = 6;

        var orientationRow = buildPanel.add("group");
        orientationRow.add("statictext", undefined, "Main comp:");
        var orientation = orientationRow.add(
            "dropdownlist",
            undefined,
            ["Horizontal 3840 x 2160", "Vertical 2160 x 3840"]
        );
        orientation.selection = orientation.items[0];

        var sizeRow = buildPanel.add("group");
        sizeRow.add("statictext", undefined, "Card:");
        var cardW = sizeRow.add("edittext", undefined, "720");
        cardW.characters = 7;
        sizeRow.add("statictext", undefined, "x");
        var cardH = sizeRow.add("edittext", undefined, "1080");
        cardH.characters = 7;

        var cameraRow = buildPanel.add("group");
        cameraRow.add("statictext", undefined, "Camera:");
        var cameraItems = [];
        for (var lensIndex = 0; lensIndex < CAMERA_PRESETS.length; lensIndex++) {
            cameraItems.push(CAMERA_PRESETS[lensIndex] + " mm");
        }
        var cameraPreset = cameraRow.add(
            "dropdownlist",
            undefined,
            cameraItems
        );
        cameraPreset.selection = cameraPreset.items[2];

        var buttonRow = win.add("group");
        buttonRow.alignment = "right";
        var createButton = buttonRow.add("button", undefined, "Create");
        var updateButton = buttonRow.add("button", undefined, "Update");
        var resetButton = buttonRow.add("button", undefined, "Reset");

        var status = win.add("statictext", undefined, "Ready");
        status.characters = 32;

        return {
            win: win,
            count: count,
            duration: duration,
            orientation: orientation,
            cardW: cardW,
            cardH: cardH,
            cameraPreset: cameraPreset,
            createButton: createButton,
            updateButton: updateButton,
            resetButton: resetButton,
            status: status
        };
    }

    var api = {
        build: build,
        updateActiveRig: updateActiveRig,
        resetActiveRig: resetActiveRig
    };

    var ui = makePanel(thisObj);
    ui.createButton.onClick = function () {
        runPanelCommand(
            ui,
            "Creating CardsFlow...",
            "Create CardsFlow",
            function () {
                return build(parsePanelOptions(ui));
            }
        );
    };
    ui.updateButton.onClick = function () {
        runPanelCommand(
            ui,
            "Updating active CardsFlow...",
            "Update CardsFlow",
            function () {
                return updateActiveRig(parsePanelOptions(ui));
            }
        );
    };
    ui.resetButton.onClick = function () {
        runPanelCommand(
            ui,
            "Resetting active CardsFlow...",
            "Reset CardsFlow",
            resetActiveRig
        );
    };
    ui.win.onResizing = ui.win.onResize = function () {
        this.layout.resize();
    };
    ui.win.layout.layout(true);

    if (ui.win instanceof Window) {
        ui.win.center();
        ui.win.show();
    } else {
        ui.win.layout.resize();
    }
})(this);
