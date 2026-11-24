/* Copy Transform + Marker CEP v2.1.1 | Host script */
if (!$._CTM) $._CTM = {};
(function (api) {
    var transformData = null;

    function quote(s) {
        return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r/g, '\\r').replace(/\n/g, '\\n').replace(/\t/g, '\\t') + '"';
    }

    function respond(o) {
        var a = [];
        for (var k in o) {
            if (!o.hasOwnProperty(k)) continue;
            var v = o[k];
            a.push(quote(k) + ':' + (typeof v === 'number' ? String(v) : typeof v === 'boolean' ? String(v) : quote(v === null ? '' : v)));
        }
        return '{' + a.join(',') + '}';
    }

    function result(ok, msg) { return respond({ ok: ok, message: msg }); }
    function comp() { var c = app.project.activeItem; return c instanceof CompItem ? c : null; }
    function prop(layer, name) { try { return layer.transform[name]; } catch (e) { return null; } }
    function markerProp(layer) { try { return layer.property('ADBE Marker'); } catch (e) { return null; } }
    function getGroup(layer, id) { try { return layer.property(id); } catch (e) { return null; } }

    function snapshot(p) {
        if (!p) return null;
        var d = { value: null, keys: [], expression: '', expressionEnabled: false };
        try {
            if (p.canSetExpression) {
                d.expression = p.expression || '';
                d.expressionEnabled = !!p.expressionEnabled;
            }
        } catch (e) {}
        try {
            if (p.numKeys === 0) d.value = p.value;
            for (var i = 1; i <= p.numKeys; i++) {
                var k = {
                    time: p.keyTime(i),
                    value: p.keyValue(i),
                    inType: p.keyInInterpolationType(i),
                    outType: p.keyOutInterpolationType(i),
                    easeIn: p.keyInTemporalEase(i),
                    easeOut: p.keyOutTemporalEase(i)
                };
                try {
                    k.temporalContinuous = p.keyTemporalContinuous(i);
                    k.temporalAutoBezier = p.keyTemporalAutoBezier(i);
                } catch (e) {}
                try {
                    k.inSpatial = p.keyInSpatialTangent(i);
                    k.outSpatial = p.keyOutSpatialTangent(i);
                    k.spatialContinuous = p.keySpatialContinuous(i);
                    k.spatialAutoBezier = p.keySpatialAutoBezier(i);
                    k.roving = p.keyRoving(i);
                } catch (e) {}
                d.keys.push(k);
            }
        } catch (e) { return null; }
        return d;
    }

    function restore(p, d, timeOffset) {
        if (!p || !d) return;
        var offset = timeOffset || 0;
        while (p.numKeys > 0) p.removeKey(1);
        if (!d.keys.length) {
            if (d.value !== null && d.value !== undefined) {
                try { p.setValue(d.value); } catch (e) {}
            }
        } else {
            for (var i = 0; i < d.keys.length; i++) {
                var k = d.keys[i];
                p.setValueAtTime(k.time + offset, k.value);
            }
            for (var j = 0; j < d.keys.length; j++) {
                var key = d.keys[j], n = j + 1;
                try { p.setInterpolationTypeAtKey(n, key.inType, key.outType); } catch (e) {}
                try { p.setTemporalEaseAtKey(n, key.easeIn, key.easeOut); } catch (e) {}
                try { if (key.inSpatial) p.setSpatialTangentsAtKey(n, key.inSpatial, key.outSpatial); } catch (e) {}
                try { if (key.spatialContinuous !== undefined) p.setSpatialContinuousAtKey(n, key.spatialContinuous); } catch (e) {}
                try { if (key.spatialAutoBezier !== undefined) p.setSpatialAutoBezierAtKey(n, key.spatialAutoBezier); } catch (e) {}
                try { if (key.temporalContinuous !== undefined) p.setTemporalContinuousAtKey(n, key.temporalContinuous); } catch (e) {}
                try { if (key.temporalAutoBezier !== undefined) p.setTemporalAutoBezierAtKey(n, key.temporalAutoBezier); } catch (e) {}
                try { if (key.roving) p.setRovingAtKey(n, true); } catch (e) {}
            }
        }
        try {
            if (p.canSetExpression) {
                p.expression = d.expression || '';
                if (d.expression) p.expressionEnabled = !!d.expressionEnabled;
            }
        } catch (e) {}
    }

    // Snapshot & Paste for Layer Markers (ADBE Marker)
    function snapshotMarkers(layer) {
        var m = markerProp(layer), items = [];
        if (!m) return items;
        for (var i = 1; i <= m.numKeys; i++) {
            try {
                var mv = m.keyValue(i);
                items.push({
                    time: m.keyTime(i),
                    comment: mv.comment || '',
                    chapter: mv.chapter || '',
                    url: mv.url || '',
                    frameTarget: mv.frameTarget || '',
                    cuePointName: mv.cuePointName || '',
                    eventCuePoint: !!mv.eventCuePoint,
                    duration: mv.duration || 0,
                    label: mv.label !== undefined ? mv.label : 0,
                    protectedRegion: !!mv.protectedRegion
                });
            } catch (e) {}
        }
        return items;
    }

    function pasteMarkers(layer, items, warnings, timeOffset) {
        var m = markerProp(layer);
        if (!m) { warnings.push(layer.name + ': markers unsupported'); return; }
        var offset = timeOffset || 0;
        while (m.numKeys > 0) m.removeKey(1);
        for (var i = 0; i < items.length; i++) {
            try {
                var d = items[i];
                var mv = new MarkerValue(d.comment || '');
                try { if (d.chapter) mv.chapter = d.chapter; } catch (e) {}
                try { if (d.url) mv.url = d.url; } catch (e) {}
                try { if (d.frameTarget) mv.frameTarget = d.frameTarget; } catch (e) {}
                try { if (d.cuePointName) mv.cuePointName = d.cuePointName; } catch (e) {}
                try { mv.eventCuePoint = !!d.eventCuePoint; } catch (e) {}
                try { if (d.duration) mv.duration = d.duration; } catch (e) {}
                try { if (d.label !== undefined) mv.label = d.label; } catch (e) {}
                try { mv.protectedRegion = !!d.protectedRegion; } catch (e) {}
                m.setValueAtTime(d.time + offset, mv);
            } catch (e) { warnings.push(layer.name + '/Marker ' + (i + 1) + ': ' + e.toString()); }
        }
    }

    function getEarliestKeyTime(data, args) {
        var minT = Infinity;
        function scanSnap(s) {
            if (!s || !s.keys || !s.keys.length) return;
            for (var i = 0; i < s.keys.length; i++) {
                if (s.keys[i].time < minT) minT = s.keys[i].time;
            }
        }
        function scanTree(entries) {
            if (!entries) return;
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].data) scanSnap(entries[i].data);
                if (entries[i].children && entries[i].children.length) scanTree(entries[i].children);
            }
        }

        for (var j = 0; j < basicNames.length; j++) {
            var n = basicNames[j];
            if (!picked(args, n)) continue;
            if (n === 'position' && data.separatedPos) {
                scanSnap(data.separatedPos.x);
                scanSnap(data.separatedPos.y);
                scanSnap(data.separatedPos.z);
            } else {
                scanSnap(data.values[n]);
            }
        }
        if (picked(args, 'effects')) scanTree(data.effects);
        if (picked(args, 'materialOptions')) scanTree(data.materialOptions);
        if (picked(args, 'sourceText') && data.text) scanSnap(data.text.sourceText);
        if (picked(args, 'textPath') && data.text) scanTree(data.text.pathOptions);
        if (picked(args, 'textMore') && data.text) scanTree(data.text.moreOptions);
        if (picked(args, 'textAnimators') && data.text && data.text.animators) {
            for (var a = 0; a < data.text.animators.length; a++) {
                var an = data.text.animators[a];
                scanTree(an.selectors);
                if (an.props) {
                    for (var p = 0; p < an.props.length; p++) scanSnap(an.props[p].data);
                }
            }
        }
        if (picked(args, 'contents')) scanTree(data.contents);
        if (picked(args, 'markers') && data.markers && data.markers.length) {
            for (var mk = 0; mk < data.markers.length; mk++) {
                if (data.markers[mk].time < minT) minT = data.markers[mk].time;
            }
        }
        if (picked(args, 'masks') && data.masks) {
            for (var m = 0; m < data.masks.length; m++) scanTree(data.masks[m].tree);
        }
        if (picked(args, 'layerStyles') && data.layerStyles) {
            if (data.layerStyles.blendingOptions) scanTree(data.layerStyles.blendingOptions);
            if (data.layerStyles.items) {
                for (var s = 0; s < data.layerStyles.items.length; s++) scanTree(data.layerStyles.items[s].tree);
            }
        }
        return (minT === Infinity) ? null : minT;
    }

    function resetProperty(p, defaultVal) {
        if (!p) return;
        try {
            if (p.canSetExpression) {
                p.expression = '';
            }
        } catch (e) {}
        try {
            while (p.numKeys > 0) p.removeKey(1);
        } catch (e) {}
        if (defaultVal !== undefined && defaultVal !== null) {
            try { p.setValue(defaultVal); } catch (e) {}
        }
    }

    function resetTree(group) {
        if (!group) return;
        for (var i = 1; i <= group.numProperties; i++) {
            var p = group.property(i);
            if (!p) continue;
            if (p.propertyType === PropertyType.PROPERTY) {
                if (p.canVaryOverTime) {
                    try { if (p.canSetExpression) p.expression = ''; } catch (e) {}
                    try { while (p.numKeys > 0) p.removeKey(1); } catch (e) {}
                }
            } else {
                resetTree(p);
            }
        }
    }

    api.getInfo = function (args) {
        try {
            var c = comp();
            if (!c || !c.selectedLayers.length) return respond({ ok: false, message: 'Select a layer' });
            var layer = c.selectedLayers[0], m = markerProp(layer), total = m ? m.numKeys : 0;
            var idx = Math.max(1, Math.min(total, Math.floor((args && args.index) || 1)));
            var fps = c.frameRate || 25;
            var t = total ? m.keyTime(idx) : 0;
            var frames = Math.round(t * fps);
            var timeText = t.toFixed(3) + 's  (' + frames + 'fr)';
            var comment = '';
            if (total) { try { comment = m.keyValue(idx).comment || ''; } catch (e) {} }
            return respond({
                ok: true,
                name: layer.name,
                layerKey: String(c.id || c.name) + '|' + String(layer.id || layer.index),
                is3D: !!layer.threeDLayer,
                total: total,
                index: total ? idx : 0,
                timeText: timeText,
                comment: comment
            });
        } catch (e) { return respond({ ok: false, message: 'Read failed: ' + e.toString() }); }
    };

    api.align = function (args) {
        var c = comp();
        if (!c || !c.selectedLayers.length) return result(false, 'Select a layer');
        var layer = c.selectedLayers[0];
        if (layer.locked) return result(false, 'Layer is locked');
        var m = markerProp(layer);
        if (!m || m.numKeys === 0) return result(false, 'Selected layer has no markers');
        var idx = Math.floor((args && args.index) || 1);
        if (idx < 1 || idx > m.numKeys) return result(false, 'Marker index out of range');
        try {
            app.beginUndoGroup('Align Layer Marker to CTI');
            var oldTime = m.keyTime(idx), delta = c.time - oldTime;
            layer.startTime = layer.startTime + delta;
            var isZh = (args && args.lang === 'zh');
            return result(true, isZh ? ('已将标记 ' + idx + ' 对齐到播放头 (' + c.time.toFixed(3) + 's)') : ('Marker ' + idx + ' aligned to CTI (' + c.time.toFixed(3) + 's)'));
        } catch (e) { return result(false, 'Align failed: ' + e.toString()); }
        finally { app.endUndoGroup(); }
    };

    var basicNames = ['anchorPoint', 'position', 'scale', 'opacity', 'rotation', 'orientation', 'xRotation', 'yRotation', 'zRotation'];

    function picked(args, n) { return !!(args && args.options && args.options[n]); }
    function propertiesSelected(args) {
        for (var n in args.options) {
            if (args.options.hasOwnProperty(n) && args.options[n]) return true;
        }
        return false;
    }

    function takeTree(group) {
        var out = [];
        if (!group) return out;
        for (var i = 1; i <= group.numProperties; i++) {
            var p = group.property(i), item = { match: p.matchName, name: p.name, enabled: true, children: [], data: null };
            try { item.enabled = p.enabled; } catch (e) {}
            if (p.propertyType === PropertyType.PROPERTY) item.data = snapshot(p);
            else item.children = takeTree(p);
            out.push(item);
        }
        return out;
    }

    function applyTree(group, entries, warnings, path, timeOffset) {
        if (!group) return;
        for (var i = 0; i < entries.length; i++) {
            var d = entries[i], p = null;
            try {
                if (group.propertyType === PropertyType.INDEXED_GROUP) {
                    if (group.canAddProperty(d.match)) {
                        p = group.addProperty(d.match);
                    } else {
                        try { p = group.addProperty(d.match); } catch (e) {}
                    }
                    if (!p) {
                        if (d.data || (d.children && d.children.length)) {
                            warnings.push(path + ': cannot create ' + d.name);
                        }
                        continue;
                    }
                } else {
                    p = group.property(d.match);
                    if (!p) {
                        try { p = group.addProperty(d.match); } catch (e) {}
                    }
                    if (!p) {
                        warnings.push(path + ': unsupported ' + d.name);
                        continue;
                    }
                }
                try { if (d.name && p.name !== d.name) p.name = d.name; } catch (e) {}
                try { p.enabled = d.enabled; } catch (e) {}
                if (d.data) {
                    try { restore(p, d.data, timeOffset); } catch (e) { warnings.push(path + '/' + d.name + ': ' + e.toString()); }
                } else if (d.children && d.children.length) {
                    applyTree(p, d.children, warnings, path + '/' + d.name, timeOffset);
                }
            } catch (e) { warnings.push(path + '/' + d.name + ': ' + e.toString()); }
        }
    }

    function removeAll(group, warnings, label) {
        if (!group) return;
        for (var i = group.numProperties; i >= 1; i--) {
            try { group.property(i).remove(); } catch (e) { warnings.push(label + ' item could not be removed: ' + e.toString()); }
        }
    }

    function snapshotMasks(layer) {
        var g = getGroup(layer, 'ADBE Mask Parade'), r = [];
        if (!g) return r;
        for (var i = 1; i <= g.numProperties; i++) {
            var m = g.property(i), d = { name: m.name, mode: null, inverted: false, rotoBezier: false, color: null, locked: false, tree: takeTree(m) };
            try { d.mode = m.maskMode; } catch (e) {}
            try { d.inverted = m.inverted; } catch (e) {}
            try { d.rotoBezier = m.rotoBezier; } catch (e) {}
            try { d.color = m.color; } catch (e) {}
            try { d.locked = m.locked; } catch (e) {}
            r.push(d);
        }
        return r;
    }

    function pasteMasks(layer, items, warnings, timeOffset) {
        var g = getGroup(layer, 'ADBE Mask Parade');
        if (!g) { warnings.push('Masks unsupported on target'); return; }
        removeAll(g, warnings, 'Masks');
        for (var i = 0; i < items.length; i++) {
            try {
                var d = items[i], m = g.addProperty('ADBE Mask Atom');
                try { m.name = d.name; } catch (e) {}
                try { if (d.mode !== null) m.maskMode = d.mode; } catch (e) {}
                try { m.inverted = d.inverted; } catch (e) {}
                try { m.rotoBezier = d.rotoBezier; } catch (e) {}
                try { if (d.color) m.color = d.color; } catch (e) {}
                applyTree(m, d.tree, warnings, 'Mask ' + (i + 1), timeOffset);
                try { m.locked = d.locked; } catch (e) {}
            } catch (e) { warnings.push('Mask ' + (i + 1) + ': ' + e.toString()); }
        }
    }

    function isAnimatorPropActive(ap) {
        if (!ap || ap.propertyType !== PropertyType.PROPERTY) return false;
        try {
            if (ap.numKeys > 0) return true;
        } catch (e) {}
        try {
            if (ap.canSetExpression && ap.expression && ap.expression.length > 0) return true;
        } catch (e) {}
        try {
            if (ap.isModified) return true;
        } catch (e) {}
        return false;
    }

    function snapshotTextAnimators(animGroup) {
        var list = [];
        if (!animGroup) return list;
        for (var i = 1; i <= animGroup.numProperties; i++) {
            var anim = animGroup.property(i);
            if (!anim) continue;
            var item = {
                match: anim.matchName,
                name: anim.name,
                enabled: true,
                selectors: [],
                props: []
            };
            try { item.enabled = anim.enabled; } catch (e) {}

            var selGroup = anim.property('ADBE Text Selectors');
            if (selGroup) {
                item.selectors = takeTree(selGroup);
            }

            var propGroup = anim.property('ADBE Text Animator Properties');
            if (propGroup) {
                for (var pIdx = 1; pIdx <= propGroup.numProperties; pIdx++) {
                    var ap = propGroup.property(pIdx);
                    if (!isAnimatorPropActive(ap)) continue;

                    var snap = snapshot(ap);
                    if (snap) {
                        item.props.push({
                            match: ap.matchName,
                            name: ap.name,
                            enabled: true,
                            data: snap
                        });
                    }
                }
            }
            list.push(item);
        }
        return list;
    }

    function pasteTextAnimators(tg, animList, warnings, timeOffset) {
        var animGroup = tg.property('ADBE Text Animators');
        if (!animGroup) return;
        removeAll(animGroup, warnings, 'Animators');
        for (var i = 0; i < animList.length; i++) {
            var d = animList[i];
            var anim = null;
            try {
                anim = animGroup.addProperty(d.match || 'ADBE Text Animator');
            } catch (e) {
                warnings.push('Text/Animators: cannot add ' + d.name);
                continue;
            }
            if (!anim) continue;
            try { if (d.name) anim.name = d.name; } catch (e) {}
            try { anim.enabled = d.enabled; } catch (e) {}

            var propGroup = anim.property('ADBE Text Animator Properties');
            if (propGroup && d.props) {
                for (var j = 0; j < d.props.length; j++) {
                    var pd = d.props[j];
                    var targetProp = null;
                    try {
                        targetProp = propGroup.addProperty(pd.match);
                    } catch (e) {
                        try { targetProp = propGroup.property(pd.match); } catch (e2) {}
                    }
                    if (targetProp && pd.data) {
                        try {
                            restore(targetProp, pd.data, timeOffset);
                        } catch (e) {
                            warnings.push('Animator/' + pd.name + ': ' + e.toString());
                        }
                    } else {
                        warnings.push('Animator: unsupported ' + pd.name);
                    }
                }
            }

            var selGroup = anim.property('ADBE Text Selectors');
            if (selGroup && d.selectors) {
                removeAll(selGroup, warnings, 'Selectors');
                applyTree(selGroup, d.selectors, warnings, 'Text/Animator/Selectors', timeOffset);
            }
        }
    }

    function snapshotText(layer) {
        var tg = getGroup(layer, 'ADBE Text Properties');
        if (!tg) return null;
        return {
            sourceText: snapshot(tg.property('ADBE Text Document')),
            pathOptions: takeTree(tg.property('ADBE Text Path Options')),
            moreOptions: takeTree(tg.property('ADBE Text More Options')),
            animators: snapshotTextAnimators(tg.property('ADBE Text Animators'))
        };
    }

    function transferDimension(value, source3D, target3D, name) {
        if (value === null || value === undefined) return value;
        if (!(value instanceof Array)) return value;
        var expected = (name === 'position' || name === 'anchorPoint' || name === 'scale') ? (target3D ? 3 : 2) : 0;
        if (!expected || value.length === expected) return value;
        var out = value.slice(0, expected);
        if (expected === 3 && out.length === 2) out.push(name === 'scale' ? 100 : 0);
        return out;
    }

    function adaptData(data, source3D, target3D, name) {
        if (!data || source3D === target3D) return data;
        var copy = { value: transferDimension(data.value, source3D, target3D, name), keys: [], expression: data.expression, expressionEnabled: data.expressionEnabled };
        for (var i = 0; i < data.keys.length; i++) {
            var k = data.keys[i], nk = {};
            for (var f in k) if (k.hasOwnProperty(f)) nk[f] = k[f];
            nk.value = transferDimension(k.value, source3D, target3D, name);
            if (k.inSpatial) nk.inSpatial = transferDimension(k.inSpatial, source3D, target3D, 'position');
            if (k.outSpatial) nk.outSpatial = transferDimension(k.outSpatial, source3D, target3D, 'position');
            if (k.easeIn && k.easeIn.length !== nk.value.length && nk.value instanceof Array) {
                nk.easeIn = k.easeIn.slice(0, nk.value.length);
                nk.easeOut = k.easeOut.slice(0, nk.value.length);
                while (nk.easeIn.length < nk.value.length) nk.easeIn.push(k.easeIn[k.easeIn.length - 1]);
                while (nk.easeOut.length < nk.value.length) nk.easeOut.push(k.easeOut[k.easeOut.length - 1]);
            }
            copy.keys.push(nk);
        }
        return copy;
    }

    var STYLE_MENU_MAP = {
        'dropShadow/enabled': { names: ['Drop Shadow', '投影'], ids: [9000] },
        'innerShadow/enabled': { names: ['Inner Shadow', '内阴影'], ids: [9001] },
        'outerGlow/enabled': { names: ['Outer Glow', '外发光'], ids: [9002] },
        'innerGlow/enabled': { names: ['Inner Glow', '内发光'], ids: [9003] },
        'bevelEmboss/enabled': { names: ['Bevel and Emboss', '斜面和浮雕'], ids: [9004] },
        'chromeFX/enabled': { names: ['Satin', '光泽'], ids: [9005] },
        'solidFill/enabled': { names: ['Color Overlay', '颜色叠加'], ids: [9006] },
        'gradientFill/enabled': { names: ['Gradient Overlay', '渐变叠加'], ids: [9007] },
        'patternFill/enabled': { names: ['Pattern Overlay', '图案叠加'], ids: [9008] },
        'frameFX/enabled': { names: ['Stroke', '描边'], ids: [9009] }
    };

    function execMenuEntry(entry) {
        if (!entry) return false;
        var names = entry.names || [];
        for (var i = 0; i < names.length; i++) {
            try {
                var id = app.findMenuCommandId(names[i]);
                if (id && id > 0) {
                    app.executeCommand(id);
                    return true;
                }
            } catch (e) {}
        }
        var ids = entry.ids || [];
        for (var j = 0; j < ids.length; j++) {
            try {
                app.executeCommand(ids[j]);
                return true;
            } catch (e) {}
        }
        return false;
    }

    function snapshotLayerStyles(layer) {
        var ls = getGroup(layer, 'ADBE Layer Styles');
        if (!ls) return { active: false, blendingOptions: null, items: [] };
        var items = [];
        var blendOpts = null;
        for (var i = 1; i <= ls.numProperties; i++) {
            var styleGroup = ls.property(i);
            if (!styleGroup) continue;
            if (styleGroup.matchName === 'ADBE Blend Options Group') {
                blendOpts = takeTree(styleGroup);
                continue;
            }
            var isEnabled = false;
            try { isEnabled = !!styleGroup.enabled; } catch (e) {}
            if (isEnabled) {
                items.push({
                    match: styleGroup.matchName,
                    name: styleGroup.name,
                    tree: takeTree(styleGroup)
                });
            }
        }
        return { active: items.length > 0, blendingOptions: blendOpts, items: items };
    }

    function removeExistingLayerStyles(layer) {
        var clearedByMenu = execMenuEntry({
            names: ['Remove All Layer Styles', '移去所有图层样式', '删除所有图层样式', '移除所有图层样式'],
            ids: []
        });
        var ls = getGroup(layer, 'ADBE Layer Styles');
        if (ls) {
            for (var m = 1; m <= ls.numProperties; m++) {
                var p = ls.property(m);
                if (!p || p.matchName === 'ADBE Blend Options Group') continue;
                try {
                    if (p.enabled) p.enabled = false;
                } catch (e) {}
            }
        }
        return clearedByMenu || !!ls;
    }

    function applyLayerStyles(compObj, layer, styleData, warnings, timeOffset) {
        var ls = getGroup(layer, 'ADBE Layer Styles');
        if (!ls) {
            warnings.push(layer.name + ': Layer Styles unsupported');
            return false;
        }
        var prevSel = [];
        for (var i = 0; i < compObj.selectedLayers.length; i++) prevSel.push(compObj.selectedLayers[i]);
        try {
            for (var j = 0; j < prevSel.length; j++) prevSel[j].selected = false;
            layer.selected = true;

            removeExistingLayerStyles(layer);

            if (!styleData || !styleData.active || !styleData.items.length) {
                return true;
            }

            for (var s = 0; s < styleData.items.length; s++) {
                var item = styleData.items[s];
                var targetGroup = ls.property(item.match);
                var isReady = false;
                try { isReady = targetGroup && targetGroup.enabled; } catch (e) {}

                if (!isReady) {
                    var entry = STYLE_MENU_MAP[item.match];
                    execMenuEntry(entry);
                    targetGroup = ls.property(item.match);
                }

                if (targetGroup) {
                    try { targetGroup.enabled = true; } catch (e) {}
                    applyTree(targetGroup, item.tree, warnings, 'Layer Styles/' + item.name, timeOffset);
                } else {
                    warnings.push(layer.name + ': could not add style ' + item.name);
                }
            }

            if (styleData.blendingOptions) {
                var boGroup = ls.property('ADBE Blend Options Group');
                if (boGroup) {
                    applyTree(boGroup, styleData.blendingOptions, warnings, 'Layer Styles/Blending Options', timeOffset);
                }
            }
            return true;
        } catch (e) {
            warnings.push(layer.name + '/Layer Styles: ' + e.toString());
            return false;
        } finally {
            try { layer.selected = false; } catch (e) {}
            for (var k = 0; k < prevSel.length; k++) {
                try { prevSel[k].selected = true; } catch (e) {}
            }
        }
    }

    function clearLayerStyles(compObj, layer) {
        var prevSel = [];
        for (var i = 0; i < compObj.selectedLayers.length; i++) prevSel.push(compObj.selectedLayers[i]);
        try {
            for (var j = 0; j < prevSel.length; j++) prevSel[j].selected = false;
            layer.selected = true;
            return removeExistingLayerStyles(layer);
        } catch (e) {
            return false;
        } finally {
            try { layer.selected = false; } catch (e) {}
            for (var k = 0; k < prevSel.length; k++) {
                try { prevSel[k].selected = true; } catch (e) {}
            }
        }
    }

    api.copy = function (args) {
        var c = comp();
        if (!c || !c.selectedLayers.length) return result(false, 'Select source layer');
        var layer = c.selectedLayers[0];
        try {
            var d = {
                threeD: !!layer.threeDLayer,
                selected: args.options,
                source: layer.name,
                values: {},
                separatedPos: null
            };
            var posProp = prop(layer, 'position');
            if (posProp && posProp.dimensionsSeparated) {
                d.separatedPos = {
                    x: snapshot(prop(layer, 'xPosition')),
                    y: snapshot(prop(layer, 'yPosition')),
                    z: snapshot(prop(layer, 'zPosition'))
                };
            }
            for (var i = 0; i < basicNames.length; i++) {
                var n = basicNames[i];
                var actual = (n === 'rotation' && d.threeD) ? 'zRotation' : n;
                if (!d.threeD && (n === 'orientation' || n === 'xRotation' || n === 'yRotation' || n === 'zRotation')) continue;
                d.values[n] = snapshot(prop(layer, actual));
            }
            d.effects = takeTree(getGroup(layer, 'ADBE Effect Parade'));
            d.masks = snapshotMasks(layer);
            d.layerStyles = snapshotLayerStyles(layer);
            d.materialOptions = takeTree(getGroup(layer, 'ADBE Material Options Group'));
            d.text = snapshotText(layer);
            d.contents = takeTree(getGroup(layer, 'ADBE Root Vectors Group'));
            d.markers = snapshotMarkers(layer);
            d.switches = {
                blendingMode: layer.blendingMode,
                trackMatteType: null,
                motionBlur: layer.motionBlur,
                adjustmentLayer: layer.adjustmentLayer,
                threeDLayer: layer.threeDLayer,
                collapseTransformation: layer.collapseTransformation,
                quality: layer.quality
            };
            try { d.switches.trackMatteType = layer.trackMatteType; } catch (e) {}

            transformData = d;
            var styleCount = d.layerStyles.items.length;
            var markerCount = d.markers.length;
            var notes = [];
            if (styleCount) notes.push('+' + styleCount + ' Style' + (styleCount > 1 ? 's' : ''));
            if (markerCount) notes.push('+' + markerCount + ' Marker' + (markerCount > 1 ? 's' : ''));
            var extraInfo = notes.length ? (' (' + notes.join(', ') + ')') : '';
            var isZhCopy = (args && args.lang === 'zh');
            return result(true, (isZhCopy ? '已复制: ' : 'Copied: ') + layer.name + extraInfo);
        } catch (e) { return result(false, 'Copy failed: ' + e.toString()); }
    };

    api.paste = function (args) {
        if (!transformData) return result(false, 'Nothing copied');
        if (!args || !args.options || !propertiesSelected(args)) return result(false, 'No properties checked');
        var c = comp();
        if (!c || !c.selectedLayers.length) return result(false, 'Select target layer(s)');

        var pasteMode = (args && args.pasteMode) || 'comp';
        var earliestKeyTime = getEarliestKeyTime(transformData, args);

        var count = 0, skipped = 0, warnings = [];
        app.beginUndoGroup('Paste Selected Properties');
        try {
            for (var i = 0; i < c.selectedLayers.length; i++) {
                var layer = c.selectedLayers[i];
                if (layer.locked) { skipped++; warnings.push(layer.name + ': locked'); continue; }

                var timeOffset = 0;
                if (earliestKeyTime !== null) {
                    if (pasteMode === 'cti') {
                        timeOffset = c.time - earliestKeyTime;
                    } else if (pasteMode === 'inPoint') {
                        timeOffset = layer.inPoint - earliestKeyTime;
                    }
                }

                var applied = 0;
                try {
                    if (picked(args, 'threeD')) {
                        try { layer.threeDLayer = transformData.threeD; applied++; }
                        catch (e) { warnings.push(layer.name + ': cannot change 3D state'); }
                    }
                    if (picked(args, 'switches') && transformData.switches) {
                        var sw = transformData.switches;
                        try { layer.blendingMode = sw.blendingMode; } catch (e) {}
                        try { layer.motionBlur = sw.motionBlur; } catch (e) {}
                        try { layer.adjustmentLayer = sw.adjustmentLayer; } catch (e) {}
                        try { if (layer.canSetCollapseTransformation) layer.collapseTransformation = sw.collapseTransformation; } catch (e) {}
                        try { layer.quality = sw.quality; } catch (e) {}
                        applied++;
                    }
                    for (var j = 0; j < basicNames.length; j++) {
                        var n = basicNames[j], v = transformData.values[n];
                        if (!picked(args, n)) continue;
                        if (n === 'position' && transformData.separatedPos) {
                            var targetPos = prop(layer, 'position');
                            if (targetPos) {
                                targetPos.dimensionsSeparated = true;
                                if (transformData.separatedPos.x) restore(prop(layer, 'xPosition'), transformData.separatedPos.x, timeOffset);
                                if (transformData.separatedPos.y) restore(prop(layer, 'yPosition'), transformData.separatedPos.y, timeOffset);
                                if (layer.threeDLayer && transformData.separatedPos.z) restore(prop(layer, 'zPosition'), transformData.separatedPos.z, timeOffset);
                                applied++;
                            }
                            continue;
                        }
                        if (!v) continue;
                        if (n === 'position') {
                            var tp = prop(layer, 'position');
                            if (tp && tp.dimensionsSeparated) tp.dimensionsSeparated = false;
                        }
                        var actual = (n === 'rotation' && layer.threeDLayer) ? 'zRotation' : n;
                        if (!layer.threeDLayer && (n === 'orientation' || n === 'xRotation' || n === 'yRotation' || n === 'zRotation')) {
                            warnings.push(layer.name + ': ' + n + ' requires 3D');
                            continue;
                        }
                        try {
                            restore(prop(layer, actual), adaptData(v, transformData.threeD, !!layer.threeDLayer, n), timeOffset);
                            applied++;
                        } catch (e) { warnings.push(layer.name + '/' + n + ': ' + e.toString()); }
                    }
                    if (picked(args, 'effects')) {
                        var eg = getGroup(layer, 'ADBE Effect Parade');
                        if (!eg) warnings.push(layer.name + ': effects unsupported');
                        else { removeAll(eg, warnings, 'Effects'); applyTree(eg, transformData.effects, warnings, 'Effects', timeOffset); applied++; }
                    }
                    if (picked(args, 'layerStyles')) {
                        if (applyLayerStyles(c, layer, transformData.layerStyles, warnings, timeOffset)) applied++;
                    }
                    if (picked(args, 'materialOptions')) {
                        var mg = getGroup(layer, 'ADBE Material Options Group');
                        if (!mg || !layer.threeDLayer) warnings.push(layer.name + ': 3D Material requires 3D layer');
                        else { applyTree(mg, transformData.materialOptions, warnings, '3D Material', timeOffset); applied++; }
                    }
                    if (picked(args, 'masks')) {
                        pasteMasks(layer, transformData.masks, warnings, timeOffset);
                        applied++;
                    }
                    if (picked(args, 'sourceText') || picked(args, 'textPath') || picked(args, 'textMore') || picked(args, 'textAnimators')) {
                        var tg = getGroup(layer, 'ADBE Text Properties');
                        if (!tg || !transformData.text) {
                            warnings.push(layer.name + ': not a text layer');
                        } else {
                            if (picked(args, 'sourceText') && transformData.text.sourceText) {
                                restore(tg.property('ADBE Text Document'), transformData.text.sourceText, timeOffset);
                                applied++;
                            }
                            if (picked(args, 'textPath') && transformData.text.pathOptions) {
                                applyTree(tg.property('ADBE Text Path Options'), transformData.text.pathOptions, warnings, 'Text/Path Options', timeOffset);
                                applied++;
                            }
                            if (picked(args, 'textMore') && transformData.text.moreOptions) {
                                applyTree(tg.property('ADBE Text More Options'), transformData.text.moreOptions, warnings, 'Text/More Options', timeOffset);
                                applied++;
                            }
                            if (picked(args, 'textAnimators') && transformData.text.animators) {
                                pasteTextAnimators(tg, transformData.text.animators, warnings, timeOffset);
                                applied++;
                            }
                        }
                    }
                    if (picked(args, 'contents')) {
                        var cg = getGroup(layer, 'ADBE Root Vectors Group');
                        if (!cg) warnings.push(layer.name + ': not a shape layer');
                        else { removeAll(cg, warnings, 'Contents'); applyTree(cg, transformData.contents, warnings, 'Contents', timeOffset); applied++; }
                    }
                    if (picked(args, 'markers')) {
                        pasteMarkers(layer, transformData.markers || [], warnings, timeOffset);
                        applied++;
                    }
                    if (applied) count++; else skipped++;
                } catch (e) { skipped++; warnings.push(layer.name + ': ' + e.toString()); }
            }
        } finally { app.endUndoGroup(); }

        var isZhPaste = (args && args.lang === 'zh');
        var modeTag = isZhPaste
            ? ((pasteMode === 'cti') ? ' @ 播放头' : (pasteMode === 'inPoint') ? ' @ 图层入点' : ' @ 合成开始')
            : ((pasteMode === 'cti') ? ' @ Playhead' : (pasteMode === 'inPoint') ? ' @ Layer In' : ' @ Comp Start');
        var summary = isZhPaste
            ? ('已粘贴到 ' + count + ' 个图层' + modeTag + (skipped ? '，跳过 ' + skipped + ' 个' : ''))
            : ('Pasted ' + count + ' layer(s)' + modeTag + (skipped ? ', skipped ' + skipped : ''));
        if (warnings.length) summary += ' | Warnings ' + warnings.length + ': ' + warnings.slice(0, 3).join(' ; ');
        return result(count > 0, summary);
    };

    api.reset = function (args) {
        if (!args || !args.options || !propertiesSelected(args)) return result(false, 'No properties checked');
        var c = comp();
        if (!c || !c.selectedLayers.length) return result(false, 'Select layer(s) to reset');
        var count = 0, skipped = 0, warnings = [];
        app.beginUndoGroup('Reset Selected Properties');
        try {
            for (var i = 0; i < c.selectedLayers.length; i++) {
                var layer = c.selectedLayers[i];
                if (layer.locked) { skipped++; warnings.push(layer.name + ': locked'); continue; }
                var applied = 0;
                var is3D = !!layer.threeDLayer;

                try {
                    if (picked(args, 'threeD') && is3D) {
                        try { layer.threeDLayer = false; is3D = false; applied++; } catch (e) {}
                    }
                    if (picked(args, 'switches')) {
                        try { layer.blendingMode = BlendingMode.NORMAL; } catch (e) {}
                        try { layer.motionBlur = false; } catch (e) {}
                        try { layer.adjustmentLayer = false; } catch (e) {}
                        applied++;
                    }
                    if (picked(args, 'anchorPoint')) {
                        var apDef = [0, 0];
                        try {
                            if (layer.source && layer.source.width && layer.source.height) {
                                apDef = [layer.source.width / 2, layer.source.height / 2];
                            }
                        } catch (e) {}
                        if (is3D) apDef.push(0);
                        resetProperty(prop(layer, 'anchorPoint'), apDef);
                        applied++;
                    }
                    if (picked(args, 'position')) {
                        var posProp = prop(layer, 'position');
                        if (posProp && posProp.dimensionsSeparated) posProp.dimensionsSeparated = false;
                        var posDef = is3D ? [c.width / 2, c.height / 2, 0] : [c.width / 2, c.height / 2];
                        resetProperty(posProp, posDef);
                        applied++;
                    }
                    if (picked(args, 'scale')) {
                        resetProperty(prop(layer, 'scale'), is3D ? [100, 100, 100] : [100, 100]);
                        applied++;
                    }
                    if (picked(args, 'rotation')) {
                        resetProperty(prop(layer, is3D ? 'zRotation' : 'rotation'), 0);
                        applied++;
                    }
                    if (picked(args, 'orientation') && is3D) {
                        resetProperty(prop(layer, 'orientation'), [0, 0, 0]);
                        applied++;
                    }
                    if (picked(args, 'xRotation') && is3D) {
                        resetProperty(prop(layer, 'xRotation'), 0);
                        applied++;
                    }
                    if (picked(args, 'yRotation') && is3D) {
                        resetProperty(prop(layer, 'yRotation'), 0);
                        applied++;
                    }
                    if (picked(args, 'zRotation') && is3D) {
                        resetProperty(prop(layer, 'zRotation'), 0);
                        applied++;
                    }
                    if (picked(args, 'opacity')) {
                        resetProperty(prop(layer, 'opacity'), 100);
                        applied++;
                    }
                    if (picked(args, 'effects')) {
                        var eg = getGroup(layer, 'ADBE Effect Parade');
                        if (eg) { removeAll(eg, warnings, 'Effects'); applied++; }
                    }
                    if (picked(args, 'layerStyles')) {
                        if (clearLayerStyles(c, layer)) applied++;
                    }
                    if (picked(args, 'materialOptions')) {
                        var mg = getGroup(layer, 'ADBE Material Options Group');
                        if (mg && is3D) {
                            resetTree(mg);
                            var matDefaults = {
                                'ADBE Casts Shadows': 0,
                                'ADBE Light Transmission': 0,
                                'ADBE Accepts Shadows': 1,
                                'ADBE Accepts Lights': 1,
                                'ADBE Appears in Reflections': 1,
                                'ADBE Ambient Coefficient': 100,
                                'ADBE Diffuse Coefficient': 100,
                                'ADBE Specular Coefficient': 50,
                                'ADBE Shininess Coefficient': 5,
                                'ADBE Metal Coefficient': 100,
                                'ADBE Reflection Coefficient': 0,
                                'ADBE Glossiness Coefficient': 100,
                                'ADBE Fresnel Coefficient': 0,
                                'ADBE Transparency Coefficient': 0,
                                'ADBE Index of Refraction': 1
                            };
                            for (var mMatch in matDefaults) {
                                if (matDefaults.hasOwnProperty(mMatch)) {
                                    resetProperty(mg.property(mMatch), matDefaults[mMatch]);
                                }
                            }
                            applied++;
                        }
                    }
                    if (picked(args, 'masks')) {
                        var maskG = getGroup(layer, 'ADBE Mask Parade');
                        if (maskG) { removeAll(maskG, warnings, 'Masks'); applied++; }
                    }
                    if (picked(args, 'sourceText') || picked(args, 'textPath') || picked(args, 'textMore') || picked(args, 'textAnimators')) {
                        var tg = getGroup(layer, 'ADBE Text Properties');
                        if (tg) {
                            if (picked(args, 'sourceText')) {
                                resetProperty(tg.property('ADBE Text Document'), null);
                                applied++;
                            }
                            if (picked(args, 'textPath')) {
                                var po = tg.property('ADBE Text Path Options');
                                if (po) {
                                    resetTree(po);
                                    resetProperty(po.property('ADBE Text Path'), 0);
                                    resetProperty(po.property('ADBE Text Reverse Path'), 0);
                                    resetProperty(po.property('ADBE Text Perpendicular To Path'), 1);
                                    resetProperty(po.property('ADBE Text Force Align Path'), 0);
                                    resetProperty(po.property('ADBE Text First Margin'), 0);
                                    resetProperty(po.property('ADBE Text Last Margin'), 0);
                                    applied++;
                                }
                            }
                            if (picked(args, 'textMore')) {
                                var mo = tg.property('ADBE Text More Options');
                                if (mo) {
                                    resetTree(mo);
                                    resetProperty(mo.property('ADBE Text Anchor Point Option'), 1);
                                    resetProperty(mo.property('ADBE Text Anchor Point Align'), [0, 0]);
                                    resetProperty(mo.property('ADBE Text Render Order'), 1);
                                    resetProperty(mo.property('ADBE Text Character Blend Mode'), 1);
                                    resetProperty(mo.property('ADBE Text Inter-Character Blending'), 1);
                                    applied++;
                                }
                            }
                            if (picked(args, 'textAnimators')) {
                                var animGrp = tg.property('ADBE Text Animators');
                                if (animGrp) {
                                    removeAll(animGrp, warnings, 'Animators');
                                    applied++;
                                }
                            }
                        }
                    }
                    if (picked(args, 'contents')) {
                        var cg = getGroup(layer, 'ADBE Root Vectors Group');
                        if (cg) { resetTree(cg); applied++; }
                    }
                    if (picked(args, 'markers')) {
                        var m = markerProp(layer);
                        if (m) {
                            while (m.numKeys > 0) m.removeKey(1);
                            applied++;
                        }
                    }

                    if (applied) count++; else skipped++;
                } catch (e) { skipped++; warnings.push(layer.name + ': ' + e.toString()); }
            }
        } finally { app.endUndoGroup(); }

        var isZhReset = (args && args.lang === 'zh');
        var summary = isZhReset
            ? ('已重置 ' + count + ' 个图层' + (skipped ? '，跳过 ' + skipped + ' 个' : ''))
            : ('Reset ' + count + ' layer(s)' + (skipped ? ', skipped ' + skipped : ''));
        if (warnings.length) summary += ' | Warnings ' + warnings.length + ': ' + warnings.slice(0, 3).join(' ; ');
        return result(count > 0, summary);
    };
})($._CTM);
