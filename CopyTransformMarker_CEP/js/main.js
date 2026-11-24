(function () {
  'use strict';
  var VERSION = 'v2.1.1';
  var $ = function (id) { return document.getElementById(id); };
  var savedLang = 'en';
  try {
    savedLang = localStorage.getItem('ctm_lang') || ((navigator.language || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en');
  } catch (e) {}

  var state = { markerIndex: 1, layerKey: '', total: 0, ready: false, pasteMode: 'comp', lang: savedLang };

  var I18N = {
    en: {
      btnReadLayer: 'Read Layer',
      secCopyPasteReset: 'COPY / PASTE / RESET',
      btnCopy: 'Copy',
      btnPaste: 'Paste',
      btnReset: 'Reset',
      lblPasteAt: 'Paste at:',
      modeComp: 'Comp Start',
      modeCti: 'Playhead',
      modeInPoint: 'Layer In',
      hdrProperties: 'PROPERTIES',
      btnAll: 'All',
      btnNone: 'None',
      optAnchorPoint: 'Anchor Point',
      optPosition: 'Position',
      optScale: 'Scale',
      optRotation: 'Rotation',
      optOrientation: 'Orientation',
      optXRotation: 'X Rotation',
      optYRotation: 'Y Rotation',
      optZRotation: 'Z Rotation',
      optOpacity: 'Opacity',
      optThreeD: '3D Layer',
      optMaterial: '3D Material',
      optEffects: 'Effects',
      optLayerStyles: 'Layer Styles',
      optMasks: 'Masks',
      optContents: 'Shape Contents',
      optMarkers: 'Markers',
      optSwitches: 'Blend & Switches',
      subhdrText: 'TEXT',
      optSourceText: 'Source Text',
      optTextPath: 'Path Options',
      optTextMore: 'More Options',
      optTextAnimators: 'Animators',
      noteSwipe: 'Tip: Click & drag across checkboxes to batch check/uncheck.',
      secMarkerAlign: 'MARKER ALIGN',
      btnAlign: 'Align Marker to CTI',
      secLog: 'LOG',
      btnClear: 'Clear Log',
      noLayer: 'No layer selected',
      noMarker: 'No marker',
      noMarkers: 'No markers',
      selectLayerMarkers: 'Select a layer with markers',
      addMarkerHint: 'Add a layer marker with * (numeric keypad)',
      markerFmt: 'Marker {idx} / {total}',
      timeFmt: 'Time: {time}',
      titleSelectedLayer: 'Selected layer',
      titleReadLayer: 'Read selected layer / markers',
      titleChooseProps: 'Choose properties (drag across checkboxes to toggle)',
      titlePasteAt: 'Where keyframes start when pasting',
      titleModeComp: 'Original comp time (default)',
      titleModeCti: 'Shift earliest keyframe to Current Time Indicator (playhead)',
      titleModeInPoint: 'Shift earliest keyframe to target layer In Point',
      titlePrevMarker: 'Previous marker',
      titleSelectedMarker: 'Selected marker',
      titleNextMarker: 'Next marker',
      titleAlign: 'Move the entire layer so its selected marker lands at the playhead',
      titleClear: 'Clear log'
    },
    zh: {
      btnReadLayer: '读取图层',
      secCopyPasteReset: '复制 / 粘贴 / 重置',
      btnCopy: '复制',
      btnPaste: '粘贴',
      btnReset: '重置',
      lblPasteAt: '粘贴位置:',
      modeComp: '合成开始',
      modeCti: '播放头',
      modeInPoint: '图层入点',
      hdrProperties: '属性选择',
      btnAll: '全选',
      btnNone: '清空',
      optAnchorPoint: '锚点 (Anchor)',
      optPosition: '位置 (Position)',
      optScale: '缩放 (Scale)',
      optRotation: '旋转 (Rotation)',
      optOrientation: '方向 (Orientation)',
      optXRotation: 'X 轴旋转',
      optYRotation: 'Y 轴旋转',
      optZRotation: 'Z 轴旋转',
      optOpacity: '不透明度',
      optThreeD: '3D 图层',
      optMaterial: '3D 材质',
      optEffects: '效果 (Effects)',
      optLayerStyles: '图层样式',
      optMasks: '蒙版 (Masks)',
      optContents: '形状内容',
      optMarkers: '图层标记',
      optSwitches: '混合与开关',
      subhdrText: '文本属性 (TEXT)',
      optSourceText: '源文本',
      optTextPath: '路径选项',
      optTextMore: '更多选项',
      optTextAnimators: '文本动画器',
      noteSwipe: '提示：按住鼠标左键在选项上滑动可批量勾选/取消。',
      secMarkerAlign: '标记对齐',
      btnAlign: '将标记对齐到播放头',
      secLog: '运行日志',
      btnClear: '清空日志',
      noLayer: '未选中图层',
      noMarker: '无标记',
      noMarkers: '无标记',
      selectLayerMarkers: '请选择带有标记的图层',
      addMarkerHint: '按小键盘 * 键可添加图层标记',
      markerFmt: '标记 {idx} / {total}',
      timeFmt: '时间: {time}',
      titleSelectedLayer: '当前选中图层',
      titleReadLayer: '读取当前选中图层与标记',
      titleChooseProps: '选择要操作的属性（支持鼠标滑动批量勾选）',
      titlePasteAt: '粘贴关键帧与标记的时间起始基准',
      titleModeComp: '保持复制时的原始合成时间点（默认）',
      titleModeCti: '将最早的关键帧对齐到当前播放头 (CTI)',
      titleModeInPoint: '将最早的关键帧对齐到目标图层的入点',
      titlePrevMarker: '上一个标记',
      titleSelectedMarker: '当前选中标记',
      titleNextMarker: '下一个标记',
      titleAlign: '平移整个图层，使选中标记对齐到当前播放头',
      titleClear: '清空日志'
    }
  };

  function t(key) {
    var dict = I18N[state.lang] || I18N.en;
    return dict[key] !== undefined ? dict[key] : (I18N.en[key] || key);
  }

  function applyLanguage(lang) {
    state.lang = (lang === 'zh') ? 'zh' : 'en';
    try { localStorage.setItem('ctm_lang', state.lang); } catch (e) {}
    var textEls = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < textEls.length; i++) {
      var key = textEls[i].getAttribute('data-i18n');
      textEls[i].textContent = t(key);
    }
    var titleEls = document.querySelectorAll('[data-i18n-title]');
    for (var j = 0; j < titleEls.length; j++) {
      var tKey = titleEls[j].getAttribute('data-i18n-title');
      titleEls[j].title = t(tKey);
    }
    $('langToggle').textContent = state.lang === 'zh' ? 'EN' : '中文';
  }

  function pad(n) { return ('0' + n).slice(-2); }
  function log(s) {
    var d = new Date();
    var line = '[' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()) + '] ' + s;
    var box = $('log');
    box.textContent += (box.textContent ? '\n' : '') + line;
    var lines = box.textContent.split('\n');
    if (lines.length > 50) box.textContent = lines.slice(-50).join('\n');
    box.scrollTop = box.scrollHeight;
  }

  function evalHost(method, args, cb) {
    if (!window.__adobe_cep__) {
      log('CEP bridge unavailable. Open in After Effects.');
      return;
    }
    var code = '$._CTM.' + method + '(' + JSON.stringify(args || null) + ')';
    window.__adobe_cep__.evalScript(code, function (r) {
      if (r === 'EvalScript error.' || r === undefined) {
        log('Host script error (' + method + ')');
        return;
      }
      var result;
      try {
        result = JSON.parse(r);
      } catch (e) {
        log('Unexpected host response: ' + String(r).slice(0, 120));
        return;
      }
      if (cb) cb(result);
    });
  }

  function selectedOptions() {
    var o = {}, els = document.querySelectorAll('[data-option]');
    for (var i = 0; i < els.length; i++) {
      o[els[i].getAttribute('data-option')] = els[i].checked;
    }
    return o;
  }

  function setButtonState() {
    var ok = state.ready && state.total > 0;
    $('prev').disabled = !ok || state.markerIndex <= 1;
    $('next').disabled = !ok || state.markerIndex >= state.total;
    $('align').disabled = !ok;
  }

  function refresh(reset) {
    evalHost('getInfo', { index: reset ? 1 : state.markerIndex }, function (d) {
      if (!d.ok) {
        state.ready = false;
        state.total = 0;
        $('layerName').textContent = t('noLayer');
        $('markerInfo').textContent = t('noMarker');
        $('markerDetail').textContent = t('selectLayerMarkers');
        setButtonState();
        return;
      }
      if (state.layerKey !== d.layerKey) {
        state.markerIndex = 1;
        state.layerKey = d.layerKey;
        if (!reset) {
          refresh(true);
          return;
        }
      }
      state.ready = true;
      state.total = d.total;
      state.markerIndex = d.index || 1;
      $('layerName').textContent = (d.is3D ? '3D · ' : '2D · ') + d.name;
      $('layerName').title = d.name;
      $('markerInfo').textContent = d.total
        ? t('markerFmt').replace('{idx}', d.index).replace('{total}', d.total)
        : t('noMarkers');
      $('markerDetail').textContent = d.total
        ? (t('timeFmt').replace('{time}', d.timeText) + (d.comment ? '  ·  ' + d.comment : ''))
        : t('addMarkerHint');
      setButtonState();
    });
  }

  $('langToggle').addEventListener('click', function () {
    applyLanguage(state.lang === 'en' ? 'zh' : 'en');
    refresh(false);
  });

  // Paste timing mode segmented buttons
  var segBtns = document.querySelectorAll('[data-paste-mode]');
  for (var s = 0; s < segBtns.length; s++) {
    segBtns[s].addEventListener('click', function () {
      var mode = this.getAttribute('data-paste-mode');
      state.pasteMode = mode;
      for (var k = 0; k < segBtns.length; k++) {
        if (segBtns[k].getAttribute('data-paste-mode') === mode) {
          segBtns[k].classList.add('active');
        } else {
          segBtns[k].classList.remove('active');
        }
      }
    });
  }

  $('refresh').addEventListener('click', function () { refresh(true); });
  $('prev').addEventListener('click', function () { if (state.markerIndex > 1) { state.markerIndex--; refresh(false); } });
  $('next').addEventListener('click', function () { if (state.markerIndex < state.total) { state.markerIndex++; refresh(false); } });
  $('align').addEventListener('click', function () { evalHost('align', { index: state.markerIndex, lang: state.lang }, function (d) { log(d.message); refresh(false); }); });
  $('copy').addEventListener('click', function () { evalHost('copy', { options: selectedOptions(), lang: state.lang }, function (d) { log(d.message); refresh(false); }); });
  $('paste').addEventListener('click', function () { evalHost('paste', { options: selectedOptions(), pasteMode: state.pasteMode, lang: state.lang }, function (d) { log(d.message); refresh(false); }); });
  $('reset').addEventListener('click', function () { evalHost('reset', { options: selectedOptions(), lang: state.lang }, function (d) { log(d.message); refresh(false); }); });

  // Drag-to-toggle (swipe check/uncheck) across property labels
  var dragState = { active: false, targetValue: false };
  var optionLabels = document.querySelectorAll('#optionsPanel .options-grid label');
  for (var i = 0; i < optionLabels.length; i++) {
    (function (lbl) {
      var cb = lbl.querySelector('input[type="checkbox"]');
      if (!cb) return;
      lbl.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        e.preventDefault();
        dragState.active = true;
        dragState.targetValue = !cb.checked;
        cb.checked = dragState.targetValue;
      });
      lbl.addEventListener('mouseenter', function () {
        if (!dragState.active) return;
        cb.checked = dragState.targetValue;
      });
      lbl.addEventListener('click', function (e) {
        e.preventDefault();
      });
    })(optionLabels[i]);
  }
  document.addEventListener('mouseup', function () {
    dragState.active = false;
  });

  function showOptions(open) {
    var p = $('optionsPanel'), t = $('optionsToggle');
    if (open) {
      p.removeAttribute('hidden');
      t.setAttribute('aria-expanded', 'true');
      positionOptions();
    } else {
      p.setAttribute('hidden', '');
      t.setAttribute('aria-expanded', 'false');
      dragState.active = false;
    }
  }

  function positionOptions() {
    var p = $('optionsPanel');
    if (p.hasAttribute('hidden')) return;
    var b = $('optionsToggle').getBoundingClientRect();
    var width = Math.min(320, Math.max(180, window.innerWidth - 16));
    p.style.width = width + 'px';
    p.style.maxHeight = Math.max(60, window.innerHeight - 16) + 'px';
    var height = p.offsetHeight;
    var below = window.innerHeight - b.bottom - 6;
    var above = b.top - 6;
    var top;
    if (below >= Math.min(height, 180) || below >= above) {
      top = b.bottom + 5;
      p.style.maxHeight = Math.max(50, window.innerHeight - top - 8) + 'px';
    } else {
      p.style.maxHeight = Math.max(50, above - 8) + 'px';
      height = p.offsetHeight;
      top = Math.max(8, b.top - height - 5);
    }
    p.style.top = Math.max(8, top) + 'px';
    p.style.left = Math.max(8, Math.min(b.left, window.innerWidth - width - 8)) + 'px';
  }

  $('optionsToggle').addEventListener('click', function () { showOptions($('optionsPanel').hasAttribute('hidden')); });
  document.addEventListener('mousedown', function (e) {
    if ($('optionsPanel').hasAttribute('hidden')) return;
    if ($('optionsPanel').contains(e.target) || $('optionsToggle').contains(e.target)) return;
    showOptions(false);
  }, true);
  document.addEventListener('keydown', function (e) { if ((e.key === 'Escape' || e.keyCode === 27) && !$('optionsPanel').hasAttribute('hidden')) showOptions(false); });
  window.addEventListener('resize', positionOptions);
  window.addEventListener('blur', function () { showOptions(false); });
  $('selectAll').addEventListener('click', function () { var e = document.querySelectorAll('[data-option]'); for (var i = 0; i < e.length; i++) e[i].checked = true; });
  $('selectNone').addEventListener('click', function () { var e = document.querySelectorAll('[data-option]'); for (var i = 0; i < e.length; i++) e[i].checked = false; });
  $('clear').addEventListener('click', function () { $('log').textContent = ''; });

  applyLanguage(state.lang);
  log('Ready (' + VERSION + ')');
  refresh(true);
  setInterval(function () { refresh(false); }, 1100);
})();
