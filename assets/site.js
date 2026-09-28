/* EtherCAT 学院共享脚本 —— 契约文件，课页 agent 不要修改。
 * 全局 Academy：
 *   init(lessonId)                 渲染外壳（侧栏、顶栏、上下课、总图缩略图、前置课、下一课卡片、测验）
 *   stepper(el, steps, opts)       主动画步进器，steps = [{title, text, apply(svg)}]
 *   quiz(el, questions, opts)      选择题，全对写进度（init 会自动从 #quiz-data 渲染，一般不用手动调）
 *   progress.get()/done(id)/isDone(id)/reset(id?)/percent()
 *   hex(v, digits)                 十六进制，digits = 十六进制位数，默认 4：hex(0x6041) → "0x6041"
 *   bits(v, names, width)          逐位展开，返回 [{bit, value, name}]，bit 0 在前
 *   bitsTable(el, v, names, width) 把 bits 结果画成表（高位在左）
 *   overview(el, highlightKeys, opts) 系统总图
 *   fx(svg)                        SVG 增量修改助手：show/hide/dim/undim/hot/cool/fault/text/cls/attr/move/flow
 *   curriculum / lessons / lesson(id) 课程目录查询
 */
(function () {
  'use strict';

  var CUR = window.ACADEMY_CURRICULUM;
  if (!CUR) { console.error('Academy: assets/curriculum.js 未在 site.js 之前加载'); return; }

  var LS_PROGRESS = 'ecat.progress';
  var LS_THEME = 'ecat.theme';
  var LS_SEEN = 'ecat.seenVersion';
  var LS_PATH = 'ecat.path';        // 'full' | 'fast'
  var LS_CAP = 'ecat.capstone';     // {items:{}, notes:{}, done: ISO}
  var LS_CH = 'ecat.challenges';    // {all: bool, units: {u0: bool…}, announced: {u0: true…}}
  var LS_REVIEW = 'ecat.review';    // {题 id: {right, wrong, last, lastOk}, _session: {at, right, total}}
  var FAST = CUR.fastPath || [];
  var PAGES = CUR.pages || {};
  function pathMode() { return lsGet(LS_PATH) === 'fast' ? 'fast' : 'full'; }
  function chState() {
    try {
      var v = JSON.parse(lsGet(LS_CH) || '{}');
      if (!v || typeof v !== 'object' || Array.isArray(v)) v = {};
      v.all = v.all === true; v.units = (v.units && typeof v.units === 'object') ? v.units : {};
      v.announced = (v.announced && typeof v.announced === 'object') ? v.announced : {};
      return v;
    } catch (e) { return { all: false, units: {}, announced: {} }; }
  }
  function unitRemaining(u, p) { return u.lessons.filter(function (l) { return !p[l.id]; }).length; }
  // 单元挑战可见：全部开启，或手动开启了该单元，或该单元的课全部完成
  function challengeVisible(u, st, p) {
    st = st || chState(); p = p || progress.get();
    return !!(u.challenge && (st.all || st.units[u.id] === true || unitRemaining(u, p) === 0));
  }
  function isChallengeId(id) {
    var m = /^(u\d)-c$/.exec(id || '');
    return !!(m && CUR.units.some(function (u) { return u.id === m[1] && u.challenge; }));
  }

  function lsGet(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } }

  // 尽早应用主题，避免闪烁（site.js 在 <head> 中同步加载）
  (function () {
    var t = lsGet(LS_THEME);
    if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  })();

  // ---------- 课程目录 ----------
  var LESSONS = [];
  CUR.units.forEach(function (u) {
    u.lessons.forEach(function (l) {
      LESSONS.push(Object.assign({}, l, { unit: u }));
    });
  });
  var BY_ID = {};
  LESSONS.forEach(function (l, i) { l.index = i; BY_ID[l.id] = l; });

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function h(tag, attrs, html) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] === false || attrs[k] == null) return;
      if (k === 'class') n.className = attrs[k]; else n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    if (html != null) n.innerHTML = html;
    return n;
  }
  function href(id) { return id + '.html'; }

  // ---------- 进度 ----------
  var progress = {
    get: function () {
      try {
        var v = JSON.parse(lsGet(LS_PROGRESS) || '{}');
        return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
      } catch (e) { return {}; }
    },
    isDone: function (id) { return Object.prototype.hasOwnProperty.call(progress.get(), id); },
    done: function (id) {
      if (!BY_ID[id] && !isChallengeId(id)) { console.warn('Academy.progress.done: 未知课号 ' + id); return false; }
      var p = progress.get();
      if (!p[id]) p[id] = new Date().toISOString();
      var ok = lsSet(LS_PROGRESS, JSON.stringify(p));
      refreshProgressUI();
      try { document.dispatchEvent(new CustomEvent('academy:progress', { detail: { id: id } })); } catch (e) { /* ignore */ }
      return ok;
    },
    reset: function (id) {
      var p = progress.get();
      if (id) delete p[id]; else p = {};
      lsSet(LS_PROGRESS, JSON.stringify(p));
      refreshProgressUI();
    },
    percent: function () {
      var p = progress.get();
      var n = LESSONS.filter(function (l) { return p[l.id]; }).length;
      return Math.round(n * 100 / LESSONS.length);
    }
  };

  function refreshProgressUI() {
    var p = progress.get();
    paintChallengeVisibility(p);
    document.querySelectorAll('[data-done-id]').forEach(function (n) {
      n.classList.toggle('is-done', !!p[n.getAttribute('data-done-id')]);
    });
    var pct = progress.percent();
    document.querySelectorAll('.top-progress .bar i').forEach(function (n) { n.style.width = pct + '%'; });
    document.querySelectorAll('.top-progress .pct').forEach(function (n) { n.textContent = pct + '%'; });
    document.querySelectorAll('[data-unit-bar]').forEach(function (n) {
      var u = CUR.units.filter(function (x) { return x.id === n.getAttribute('data-unit-bar'); })[0];
      if (!u) return;
      var d = u.lessons.filter(function (l) { return p[l.id]; }).length;
      var bar = n.querySelector('i'); if (bar) bar.style.width = (d * 100 / u.lessons.length) + '%';
      var lab = document.querySelector('[data-unit-count="' + u.id + '"]');
      if (lab) lab.textContent = d + ' / ' + u.lessons.length;
    });
  }

  // ---------- 数字工具 ----------
  function hex(v, digits) {
    digits = digits || 4;
    var s;
    if (typeof v === 'bigint') s = v.toString(16);
    else if (v < 0) s = (BigInt.asUintN(digits * 4, BigInt(v))).toString(16);
    else s = Math.floor(v).toString(16);
    s = s.toUpperCase();
    while (s.length < digits) s = '0' + s;
    return '0x' + s;
  }
  function nameOf(names, i) {
    if (!names) return '';
    if (Array.isArray(names)) return names[i] || '';
    return names[i] || '';
  }
  function bits(v, names, width) {
    var w = width;
    if (!w) {
      var maxIdx = -1;
      if (Array.isArray(names)) maxIdx = names.length - 1;
      else if (names) Object.keys(names).forEach(function (k) { maxIdx = Math.max(maxIdx, +k); });
      w = Math.max(16, maxIdx + 1);
      if (w > 16 && w <= 32) w = 32;
    }
    var big = BigInt(typeof v === 'bigint' ? v : Math.floor(v));
    var out = [];
    for (var i = 0; i < w; i++) out.push({ bit: i, value: Number((big >> BigInt(i)) & 1n), name: nameOf(names, i) });
    return out;
  }
  function bitsTable(el, v, names, width) {
    var b = bits(v, names, width).slice().reverse();
    var html = '<div class="table-wrap"><table class="bits-table"><tr>' +
      b.map(function (x) { return '<th>' + x.bit + '</th>'; }).join('') + '</tr><tr>' +
      b.map(function (x) { return '<td class="' + (x.value ? 'bit-1' : 'bit-0') + '">' + x.value + '</td>'; }).join('') + '</tr>';
    if (names) html += '<tr>' + b.map(function (x) { return '<td class="bit-name">' + esc(x.name) + '</td>'; }).join('') + '</tr>';
    el.innerHTML = html + '</table></div>';
    return el;
  }

  // ---------- 系统总图 ----------
  var LAYERS = [
    { key: 'planner',      side: 'm', row: 1, label: '轨迹规划',       sub: 'planner',          tone: 'ink' },
    { key: 'rt-loop',      side: 'm', row: 2, label: '实时周期循环',   sub: 'RT loop · 1 ms',   tone: 'ink' },
    { key: 'cia402-m',     side: 'm', row: 3, label: 'CiA402 主站侧',  sub: '6040 · 607A',      tone: 'drive' },
    { key: 'master-stack', side: 'm', row: 4, label: '主站协议栈',     sub: 'IgH · CoE 客户端', tone: 'mail' },
    { key: 'nic',          side: 'm', row: 5, label: '网卡驱动',       sub: 'NIC · 0x88A4',     tone: 'bus' },
    { key: 'cable',        side: 'c', row: 5, label: 'EtherCAT 网线',  sub: '',                 tone: 'bus' },
    { key: 'esc',          side: 's', row: 5, label: 'ESC 从站控制器', sub: 'SM · FMMU · DC',   tone: 'bus' },
    { key: 'slave-stack',  side: 's', row: 4, label: '从站协议栈',     sub: 'ESM · CoE 对象字典', tone: 'mail' },
    { key: 'cia402-s',     side: 's', row: 3, label: 'CiA402 驱动器',  sub: '6041 · 6064',      tone: 'drive' },
    { key: 'motor-ctrl',   side: 's', row: 2, label: '电机控制',       sub: '位置/速度/电流环', tone: 'drive' },
    { key: 'power-stage',  side: 's', row: 1, label: '功率级',         sub: '逆变器 · PWM',     tone: 'power' },
    { key: 'motor',        side: 's', row: 0, label: '电机 + 编码器',  sub: '',                 tone: 'drive' }
  ];
  var LAYER_NAMES = {};
  LAYERS.forEach(function (l) { LAYER_NAMES[l.key] = l.label; });

  function overviewSVG() {
    var X_M = 24, X_S = 616, W = 320, RH = 46, TOP = 40, GAP = 56;
    function y(row) { return TOP + row * GAP; }
    var s = '<svg viewBox="0 0 960 ' + (TOP + 6 * GAP + 4) + '" role="img" aria-label="EtherCAT 系统总图：左侧主站五层，中间网线，右侧从站五层与电机">';
    s += '<text class="ov-side" x="' + X_M + '" y="24">主站侧 · Linux PC</text>';
    s += '<text class="ov-side" x="' + (X_S + W) + '" y="24" text-anchor="end">从站侧 · 伺服驱动器</text>';
    // 逻辑链路（虚线）：两台状态机、两条通路
    var yc = function (row) { return y(row) + RH / 2; };
    s += '<path class="ov-link ov-link-drive" d="M' + (X_M + W) + ' ' + yc(3) + ' H' + X_S + '"/>';
    s += '<text class="ov-note" x="480" y="' + (yc(3) - 7) + '" text-anchor="middle">CiA402 状态机 · 6040 ⇄ 6041</text>';
    // 两协议栈之间：ESM 标签在上，下面两条并行虚线——紫色邮箱（CoE SDO）、蓝色过程数据（PDO），标签嵌在线中间
    var y4 = y(4), xa = X_M + W, xb = X_S;
    s += '<text class="ov-note" x="480" y="' + (y4 + 2) + '" text-anchor="middle">ESM 状态机</text>';
    [[y4 + 17, 'mail', 'CoE 邮箱 SDO'], [y4 + 38, 'bus', '过程数据 PDO']].forEach(function (ln) {
      s += '<path class="ov-link ov-link-' + ln[1] + '" d="M' + xa + ' ' + ln[0] + ' H' + (480 - 58) + ' M' + (480 + 58) + ' ' + ln[0] + ' H' + xb + '"/>';
      s += '<text class="ov-note ov-note-' + ln[1] + '" x="480" y="' + (ln[0] + 4) + '" text-anchor="middle">' + ln[2] + '</text>';
    });
    LAYERS.forEach(function (l) {
      var yy = y(l.row);
      var g = '<g class="ov-layer tone-' + l.tone + '" data-layer="' + l.key + '">';
      if (l.side === 'c') {
        g += '<rect x="' + (X_M + W) + '" y="' + yy + '" width="' + (X_S - X_M - W) + '" height="' + RH + '"/>';
        g += '<line class="ov-cable-line" x1="' + (X_M + W) + '" y1="' + yc(5) + '" x2="' + X_S + '" y2="' + yc(5) + '"/>';
        g += '<text x="480" y="' + (yc(5) - 7) + '" text-anchor="middle">' + l.label + '</text>';
        g += '<text class="ov-sub" x="480" y="' + (yy + RH + 4) + '" text-anchor="middle">以太网帧 EtherType 0x88A4</text>';
      } else {
        var x = l.side === 'm' ? X_M : X_S;
        g += '<rect x="' + x + '" y="' + yy + '" width="' + W + '" height="' + RH + '" rx="8"/>';
        g += '<text x="' + (x + 14) + '" y="' + (yy + 29) + '">' + l.label + '</text>';
        if (l.sub) g += '<text class="ov-sub" x="' + (x + W - 12) + '" y="' + (yy + 29) + '" text-anchor="end">' + l.sub + '</text>';
      }
      g += '<title>' + l.label + '（' + l.key + '）</title></g>';
      s += g;
    });
    return s + '</svg>';
  }

  /* overview(el, highlightKeys, opts)
   * opts.interactive: true 时各层可点击/键盘选择，回调 opts.onSelect(key)
   * opts.link: 字符串 URL。支持 <dialog> 时缩略图带"放大"按钮，点图或按钮打开放大对话框，对话框底部链到该 URL；
   *            不支持时整个缩略图作为该链接（课页缩略图默认链到首页对应层）
   * opts.zoomTitle: 放大对话框标题里的课名
   * 返回 {select(key)} */
  function overview(el, highlightKeys, opts) {
    opts = opts || {};
    var keys = (highlightKeys || []).filter(function (k) {
      if (!LAYER_NAMES[k]) { console.warn('Academy.overview: 未知层键 ' + k); return false; }
      return true;
    });
    var wrap = h('div', { class: 'overview' + (keys.length ? ' has-hot' : '') + (opts.interactive ? ' is-interactive' : '') });
    wrap.innerHTML = overviewSVG();
    wrap.querySelectorAll('.ov-layer').forEach(function (g) {
      var k = g.getAttribute('data-layer');
      if (keys.indexOf(k) >= 0) g.classList.add('ov-hot');
      if (opts.interactive) {
        g.setAttribute('tabindex', '0');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', LAYER_NAMES[k]);
        var fire = function () { if (opts.onSelect) opts.onSelect(k); };
        g.addEventListener('click', fire);
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
      }
    });
    el.innerHTML = '';
    var canZoom = opts.link && typeof HTMLDialogElement === 'function' && typeof HTMLDialogElement.prototype.showModal === 'function';
    if (canZoom) {
      // 课页缩略图：点图或点"放大"打开对话框；不支持 <dialog> 的浏览器走下面的整图链接
      wrap.classList.add('is-zoomable');
      el.appendChild(wrap);
      // "放大总图"按钮放在总图容器外、紧贴其下方的一行工具条里，图上不叠任何元素
      var old = el.nextElementSibling;
      if (old && old.classList.contains('ov-tools')) old.remove();
      var tools = h('div', { class: 'ov-tools' });
      var zb = h('button', { type: 'button', class: 'step-btn ov-zoom', 'aria-label': '放大系统总图', 'aria-haspopup': 'dialog' },
        '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>放大总图');
      tools.appendChild(zb);
      el.insertAdjacentElement('afterend', tools);
      var open = function () { openOverviewDialog(keys, opts, zb); };
      zb.addEventListener('click', open);
      wrap.addEventListener('click', open);
    } else if (opts.link) {
      var a = h('a', { href: opts.link, title: '在首页系统总图中查看' });
      a.appendChild(wrap); el.appendChild(a);
    } else el.appendChild(wrap);
    return {
      el: wrap,
      select: function (key) {
        wrap.classList.toggle('has-hot', !!key || keys.length > 0);
        wrap.querySelectorAll('.ov-layer').forEach(function (g) {
          var on = g.getAttribute('data-layer') === key;
          g.classList.toggle('ov-hot', on);
          g.classList.toggle('ov-selected', on);
        });
      }
    };
  }

  // 系统总图放大对话框：全页只建一个，每次打开时按当前缩略图的高亮重画
  var ovDialog = null, ovReturnFocus = null;
  function openOverviewDialog(keys, opts, returnTo) {
    if (!ovDialog) {
      ovDialog = h('dialog', { class: 'ov-dialog', 'aria-labelledby': 'ov-dlg-title' });
      ovDialog.innerHTML =
        '<div class="ov-dlg-inner">' +
        '<div class="ov-dlg-head"><h2 id="ov-dlg-title"></h2>' +
        '<button type="button" class="icon-btn ov-dlg-close" aria-label="关闭">✕</button></div>' +
        '<div class="ov-dlg-body"></div>' +
        '<div class="ov-dlg-foot"><a class="ov-dlg-link" href="index.html">到首页地图查看该层 →</a></div></div>';
      document.body.appendChild(ovDialog);
      ovDialog.querySelector('.ov-dlg-close').addEventListener('click', function () { ovDialog.close(); });
      // 点遮罩关闭：点击落在 dialog 自身（内容之外）时
      ovDialog.addEventListener('click', function (e) { if (e.target === ovDialog) ovDialog.close(); });
      ovDialog.addEventListener('close', function () {
        // 原生的焦点恢复发生在 close 事件之后，会覆盖这里的 focus()，所以推迟到下一轮
        var target = ovReturnFocus;
        setTimeout(function () { if (target && target.focus) target.focus(); }, 0);
      });
    }
    ovReturnFocus = returnTo || null;
    ovDialog.querySelector('#ov-dlg-title').textContent = '系统总图' + (opts.zoomTitle ? ' · ' + opts.zoomTitle : '');
    overview(ovDialog.querySelector('.ov-dlg-body'), keys, {});
    ovDialog.querySelector('.ov-dlg-link').setAttribute('href', opts.link);
    // 先把焦点放到按钮上，脚本调用 click() 时原生焦点恢复也会回到按钮
    if (returnTo && returnTo.focus) returnTo.focus();
    ovDialog.showModal();
    ovDialog.querySelector('.ov-dlg-close').focus();
  }

  // ---------- SVG 助手 ----------
  // hot/fault 最好作用在有描边的图形（rect/path…）上；作用在 <g> 上时 site.css 只加粗它的直接子图形。
  function fx(svg) {
    function q(id) {
      if (typeof id !== 'string') return id;
      return svg.querySelector('#' + (window.CSS && CSS.escape ? CSS.escape(id) : id));
    }
    function each(ids, fn) {
      [].concat(ids).forEach(function (id) {
        var n = q(id);
        if (!n) { console.warn('Academy.fx: 找不到 #' + id); return; }
        fn(n);
      });
      return api;
    }
    var api = {
      el: q,
      show: function (ids) { return each(ids, function (n) { n.classList.remove('is-hidden'); }); },
      hide: function (ids) { return each(ids, function (n) { n.classList.add('is-hidden'); }); },
      dim: function (ids) { return each(ids, function (n) { n.classList.add('is-dim'); }); },
      undim: function (ids) { return each(ids, function (n) { n.classList.remove('is-dim'); }); },
      hot: function (ids) { return each(ids, function (n) { n.classList.add('is-hot'); }); },
      cool: function (ids) { return each(ids, function (n) { n.classList.remove('is-hot', 'is-hot-fault'); }); },
      fault: function (ids) { return each(ids, function (n) { n.classList.add('is-hot-fault'); }); },
      flow: function (ids, on) { return each(ids, function (n) { n.classList.toggle('is-flow', on !== false); }); },
      cls: function (ids, c, on) { return each(ids, function (n) { n.classList.toggle(c, on !== false); }); },
      text: function (id, s) { return each(id, function (n) { n.textContent = s; }); },
      attr: function (ids, name, val) { return each(ids, function (n) { if (val == null) n.removeAttribute(name); else n.setAttribute(name, val); }); },
      move: function (ids, dx, dy) {
        return each(ids, function (n) { n.classList.add('movable'); n.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; });
      }
    };
    return api;
  }

  // ---------- 步进器 ----------
  var steppers = [];
  // 键盘 ← →：只作用于焦点所在的那个步进器；页面只有一个步进器时焦点在别处也作用于它（保持单步进器课页的旧行为）
  function keyTarget() {
    var a = document.activeElement;
    for (var i = 0; i < steppers.length; i++) {
      if (a && steppers[i]._zone.contains(a)) return steppers[i];
    }
    return steppers.length === 1 ? steppers[0] : null;
  }
  document.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (document.querySelector('dialog[open]')) return; // 对话框打开时不翻动画
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    var st = keyTarget();
    if (!st) return;
    e.preventDefault();
    if (e.key === 'ArrowRight') st.next(); else st.prev();
  });

  /* stepper(el, steps, opts)
   * el: .lesson-anim 区块或 .anim-stage 容器（内含一个 <svg>）。
   * steps[i].apply(svg) 只做本步的增量修改；每次跳转先把 SVG 恢复为初始克隆，再依次 apply 0..i。
   *   注意：因为 SVG 会被替换为克隆，apply 里必须通过参数 svg（或 Academy.fx(svg)）查元素，不要缓存元素引用。
 *   同理，SVG 内的点击等交互要把事件委托到 .anim-stage 容器上，不要直接绑在 SVG 元素上。
   * opts.interval 自动播放间隔 ms（默认 3000）；opts.onChange(i, svg) 每次渲染后回调。
   * 一页多个步进器 / 共用一张 SVG（v1.3.0 起）：
   *   opts.stage   要驱动的 .anim-stage 元素（默认从 el 里找）。多个步进器传同一个 stage 即共用一张 SVG，
   *                初始克隆在第一个步进器创建时保存在 stage 上，大家共用；谁被操作就由谁重画整张图。
   *   opts.bar     放控件的 .stepper 元素（共用 stage 时必须各传各的；默认 el 本身若是 .stepper，否则在 el/stage 附近找或新建）。
   *   opts.prelude 数组：复位后、第 0 步之前先依次 apply 的步骤（可直接传上一段的 steps），
   *                用来让"第二段的初始画面 = 第一段的末状态"。
   *   共用 stage 时，后创建的步进器不在加载时重画图，只显示自己的第 0 步说明，直到被操作。
   *   键盘 ← → 只作用于焦点所在的步进器（点控件或点它驱动的图都会把焦点给它）。
   *   opts.segments = [{label: '帧 1', from: 0, to: 9}, {label: '帧 2', from: 10, to: 18}]：点条按段分组，
   *                每段前有可点的段标签（跳到该段 from），当前所在段高亮；步号仍显示全局"步骤 n / 总数"。 */
  function stepper(el, steps, opts) {
    opts = opts || {};
    if (!el) { console.error('Academy.stepper: el 为空'); return null; }
    if (!Array.isArray(steps) || !steps.length) { console.error('Academy.stepper: steps 为空'); return null; }
    var stage = opts.stage || (el.classList.contains('anim-stage') ? el : el.querySelector('.anim-stage'));
    if (!stage) stage = el;
    var root = stage.parentElement || el;
    if (!stage.querySelector('svg')) { console.error('Academy.stepper: 找不到 svg'); return null; }
    // 初始克隆存在 stage 上：共用同一 stage 的步进器共用同一份初始画面
    if (!stage.__acPristine) stage.__acPristine = stage.querySelector('svg').cloneNode(true);
    var pristine = stage.__acPristine;
    var shared = !!stage.__acShared || steppers.some(function (x) { return x._stage === stage; });
    stage.__acShared = shared;
    var prelude = Array.isArray(opts.prelude) ? opts.prelude : [];

    var bar = opts.bar || (el.classList.contains('stepper') ? el : null) ||
      (opts.stage ? null : root.querySelector('.stepper'));
    if (!bar) { bar = h('div', { class: 'stepper' }); (opts.stage ? el : stage).insertAdjacentElement(opts.stage ? 'beforeend' : 'afterend', bar); }
    bar.setAttribute('tabindex', '0');
    bar.setAttribute('aria-label', '动画步进器：左右方向键切换步骤');
    bar.innerHTML =
      '<div class="step-caption" aria-live="polite"><span class="step-no"></span><strong class="step-title"></strong><p class="step-text"></p></div>' +
      '<div class="step-controls">' +
      '<button type="button" class="step-btn" data-act="prev">◀ 上一步</button>' +
      '<div class="step-dots"></div>' +
      '<button type="button" class="step-btn is-primary" data-act="next">下一步 ▶</button>' +
      '<button type="button" class="step-btn" data-act="play">自动播放</button>' +
      '<span class="step-hint">键盘 ← →</span></div>';
    var dots = bar.querySelector('.step-dots');
    // opts.segments：把点条按段分组，每段前一个可点的段标签（跳到该段第一个画面），段间一条细分隔；步号仍按全局计
    var segs = Array.isArray(opts.segments) ? opts.segments.filter(function (g) {
      var ok = g && typeof g.from === 'number' && typeof g.to === 'number' && g.from >= 0 && g.to < steps.length && g.from <= g.to;
      if (!ok) console.error('Academy.stepper: segments 项无效', g);
      return ok;
    }) : [];
    function makeDot(i) {
      var s = steps[i];
      var d = h('button', { type: 'button', class: 'step-dot', title: s.title || ('步骤 ' + i), 'aria-label': '跳到步骤 ' + i }, String(i));
      d.addEventListener('click', function () { pause(); go(i); });
      return d;
    }
    if (segs.length) {
      dots.classList.add('has-segments');
      var covered = {};
      segs.forEach(function (g) {
        var grp = h('div', { class: 'step-seg', role: 'group', 'aria-label': g.label || '' });
        var lab = h('button', { type: 'button', class: 'step-seg-label', title: '跳到' + (g.label || '') + '第一个画面（步骤 ' + g.from + '）' }, esc(g.label || ('步骤 ' + g.from)));
        lab.addEventListener('click', function () { pause(); go(g.from); });
        grp.appendChild(lab);
        for (var i = g.from; i <= g.to; i++) { grp.appendChild(makeDot(i)); covered[i] = true; }
        dots.appendChild(grp);
      });
      // 没被任何段覆盖的画面也要有点，放在最后，保证每个画面都能点到
      steps.forEach(function (s, i) { if (!covered[i]) dots.appendChild(makeDot(i)); });
    } else {
      steps.forEach(function (s, i) { dots.appendChild(makeDot(i)); });
    }
    var dotEls = function () { return bar.querySelectorAll('.step-dot'); };
    var cur = 0, timer = null;

    function applyOne(st, svg, label) {
      var fn = typeof st === 'function' ? st : (st && st.apply);
      if (typeof fn !== 'function') return;
      try { fn(svg); }
      catch (err) { console.error('Academy.stepper: ' + label + ' apply 出错', err); }
    }
    function render(i, animate) {
      // 每次都取 stage 里当前那张图替换（共用 stage 时另一个步进器可能刚换过）
      var fresh = pristine.cloneNode(true);
      var svg = stage.querySelector('svg');
      svg.replaceWith(fresh); svg = fresh;
      prelude.forEach(function (st, k) { applyOne(st, svg, '前置第 ' + k + ' 步'); });
      for (var k = 0; k < i; k++) applyOne(steps[k], svg, '第 ' + k + ' 步');
      if (animate) svg.getBoundingClientRect(); // 刷新样式，让第 i 步的变化产生过渡
      applyOne(steps[i], svg, '第 ' + i + ' 步');
      stage.__acOwner = api;
      steppers.forEach(function (x) { if (x._stage === stage) x._bar.classList.toggle('is-idle', x !== api); });
      renderBar(i, svg);
    }
    function renderBar(i, svg) {
      bar.querySelector('.step-no').textContent = '步骤 ' + i + ' / ' + (steps.length - 1);
      bar.querySelector('.step-title').textContent = steps[i].title || '';
      bar.querySelector('.step-text').textContent = steps[i].text || '';
      dotEls().forEach(function (d) {
        var k = +d.textContent;
        d.classList.toggle('is-current', k === i);
        d.classList.toggle('is-past', k < i);
        if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
      });
      bar.querySelectorAll('.step-seg').forEach(function (g, n) {
        g.classList.toggle('is-current', i >= segs[n].from && i <= segs[n].to);
      });
      bar.querySelector('[data-act="prev"]').disabled = i === 0;
      bar.querySelector('[data-act="next"]').disabled = i === steps.length - 1;
      if (svg && opts.onChange) { try { opts.onChange(i, svg); } catch (err) { console.error(err); } }
    }
    function go(i) {
      i = Math.max(0, Math.min(steps.length - 1, i | 0));
      var animate = i === cur + 1;
      cur = i; render(i, animate);
    }
    function next() { if (cur < steps.length - 1) go(cur + 1); else pause(); }
    function prev() { pause(); go(cur - 1); }
    function play() {
      if (timer) return;
      if (cur === steps.length - 1) go(0);
      timer = setInterval(function () { if (cur >= steps.length - 1) pause(); else go(cur + 1); }, opts.interval || 3000);
      bar.querySelector('[data-act="play"]').textContent = '暂停';
    }
    function pause() {
      if (timer) clearInterval(timer);
      timer = null;
      bar.querySelector('[data-act="play"]').textContent = '自动播放';
    }
    bar.querySelector('[data-act="prev"]').addEventListener('click', prev);
    bar.querySelector('[data-act="next"]').addEventListener('click', function () { pause(); next(); });
    bar.querySelector('[data-act="play"]').addEventListener('click', function () { if (timer) pause(); else play(); });

    var api = {
      go: go, next: next, prev: prev, play: play, pause: pause,
      get index() { return cur; },
      get svg() { return stage.querySelector('svg'); },
      count: steps.length,
      _stage: stage, _bar: bar,
      _zone: shared ? bar : root   // 键盘归属区域：独占 stage 时整个区块，共用时只算自己的控件条
    };
    // 点控件条时把焦点给它（Safari 点按钮不聚焦），键盘 ← → 才知道该翻哪一个
    bar.addEventListener('pointerdown', function (e) {
      if (!bar.contains(document.activeElement)) bar.focus({ preventScroll: true });
    });
    if (!stage.__acPointer) {
      stage.__acPointer = true;
      // 用 click 而不是 pointerdown：点不可聚焦的 SVG 时浏览器会在 mousedown 里把焦点移到 body，click 在那之后
      stage.addEventListener('click', function () {
        var owner = stage.__acOwner;
        if (owner && !owner._zone.contains(document.activeElement)) owner._bar.focus({ preventScroll: true });
      });
    }
    steppers.push(api);
    // 第二个步进器接入同一 stage 时，把先来的那个的键盘区域也收窄到它自己的控件条
    if (shared) steppers.forEach(function (x) { if (x._stage === stage) x._zone = x._bar; });
    if (shared && stage.__acOwner) { bar.classList.add('is-idle'); renderBar(0, null); }
    else render(0, false);
    return api;
  }

  // ---------- 测验 ----------
  function validQuestions(qs) {
    if (!Array.isArray(qs)) return 'quiz 数据不是数组';
    for (var i = 0; i < qs.length; i++) {
      var q = qs[i];
      if (!q || typeof q.q !== 'string') return '第 ' + (i + 1) + ' 题缺 q';
      if (!Array.isArray(q.options) || q.options.length < 2) return '第 ' + (i + 1) + ' 题 options 少于 2 项';
      if (typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.options.length || q.answer % 1) return '第 ' + (i + 1) + ' 题 answer 越界';
      if (typeof q.explain !== 'string' || !q.explain) return '第 ' + (i + 1) + ' 题缺 explain';
    }
    return '';
  }

  /* quiz(el, questions, opts) —— opts.lessonId：全对时写进度。
   * 答错可以重选；每题答对后锁定；4 题都答对即完成。q/options/explain 允许内联 HTML（如 <code>）。 */
  function quiz(el, questions, opts) {
    opts = opts || {};
    var err = validQuestions(questions);
    if (err) { console.error('Academy.quiz: ' + err); el.innerHTML = '<p class="warn">测验数据有误：' + esc(err) + '</p>'; return null; }
    var lessonId = opts.lessonId;
    var solved = questions.map(function () { return false; });
    var firstTry = questions.map(function () { return null; });
    var KEYS = 'ABCDEFGH';

    el.innerHTML = '';
    var list = h('ol', { class: 'quiz-list' });
    questions.forEach(function (q, qi) {
      var li = h('li', { class: 'quiz-q' });
      li.appendChild(h('p', { class: 'q-text' }, q.q));
      var box = h('div', { class: 'q-opts', role: 'group' });
      q.options.forEach(function (o, oi) {
        var b = h('button', { type: 'button', class: 'q-opt' }, '<span class="q-key">' + KEYS[oi] + '.</span><span>' + o + '</span>');
        b.addEventListener('click', function () { answer(qi, oi, li); });
        box.appendChild(b);
      });
      li.appendChild(box);
      var ex = h('div', { class: 'q-explain', hidden: true });
      li.appendChild(ex);
      list.appendChild(li);
    });
    el.appendChild(list);
    var bar = h('div', { class: 'quiz-bar' });
    var result = h('div', { class: 'quiz-result', 'aria-live': 'polite' });
    var reset = h('button', { type: 'button', class: 'step-btn' }, '重做');
    reset.addEventListener('click', function () { quiz(el, questions, opts); });
    bar.appendChild(result); bar.appendChild(reset);
    el.appendChild(bar);
    updateResult();

    function answer(qi, oi, li) {
      if (solved[qi]) return;
      var q = questions[qi];
      var ok = oi === q.answer;
      if (firstTry[qi] === null) firstTry[qi] = ok;
      var btns = li.querySelectorAll('.q-opt');
      btns.forEach(function (b, k) { b.classList.remove('is-wrong'); if (k === oi && !ok) b.classList.add('is-wrong'); });
      var ex = li.querySelector('.q-explain');
      ex.hidden = false;
      if (ok) {
        solved[qi] = true;
        btns[oi].classList.add('is-right');
        btns.forEach(function (b) { b.disabled = true; });
        ex.className = 'q-explain is-right';
        ex.innerHTML = '<strong>✓ 正确。</strong>' + q.explain;
      } else {
        ex.className = 'q-explain is-wrong';
        ex.innerHTML = '<strong>✗ 不对，再选一次。</strong>拿不准就回看上面的主动画和机制拆解。';
      }
      updateResult();
    }
    function updateResult() {
      var n = solved.filter(Boolean).length;
      var first = firstTry.filter(function (x) { return x === true; }).length;
      var all = n === questions.length;
      result.className = 'quiz-result' + (all ? ' is-done' : '');
      if (all) {
        var saved = lessonId ? progress.done(lessonId) : true;
        result.textContent = '全部答对（首次即对 ' + first + ' / ' + questions.length + '）' +
          (lessonId ? (saved ? '，本课已标记完成 ✓' : '，但浏览器禁止本地存储，进度未保存') : '');
      } else {
        var prevDone = lessonId && progress.get()[lessonId];
        result.textContent = '已答对 ' + n + ' / ' + questions.length +
          (prevDone ? '（本课已于 ' + String(prevDone).slice(0, 10) + ' 完成）' : '，全对后本课标记完成');
      }
    }
    return { reset: function () { quiz(el, questions, opts); } };
  }

  // ---------- 外壳 ----------
  function renderTopbar(lesson, pageLabel) {
    var tb = document.getElementById('topbar') || document.body.insertBefore(h('header', { class: 'topbar', id: 'topbar' }), document.body.firstChild);
    tb.innerHTML =
      '<button type="button" class="icon-btn menu-btn" aria-label="打开课程目录" aria-expanded="false">☰</button>' +
      '<a class="brand" href="index.html"><span class="brand-mark">EC</span><span class="brand-text">' + esc(CUR.title) + '</span></a>' +
      '<span class="crumb">' + (lesson ? esc(lesson.unit.no + ' ' + lesson.unit.title + ' · ' + lesson.id) : esc(pageLabel || '')) + '</span>' +
      '<span class="top-spacer"></span>' +
      '<span class="top-progress" title="课程完成进度"><span class="bar"><i></i></span><span class="pct">0%</span></span>' +
      (CUR.version ? '<a class="top-version" href="changelog.html" title="更新记录">v' + esc(CUR.version) + '<span class="new-badge" hidden>新</span></a>' : '') +
      '<button type="button" class="icon-btn theme-btn" aria-label="切换深浅主题" title="切换深浅主题">◐</button>';
    var menu = tb.querySelector('.menu-btn');
    menu.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      menu.setAttribute('aria-expanded', String(open));
    });
    tb.querySelector('.theme-btn').addEventListener('click', function () {
      var root = document.documentElement;
      var curTheme = root.getAttribute('data-theme');
      if (!curTheme) curTheme = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      var nt = curTheme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', nt);
      lsSet(LS_THEME, nt);
    });
  }

  function renderSidebar(currentId) {
    var sb = document.getElementById('sidebar');
    if (!sb) { sb = h('aside', { class: 'sidebar', id: 'sidebar' }); document.body.appendChild(sb); }
    sb.setAttribute('aria-label', '课程目录');
    var s = '<nav><a class="side-link' + (currentId === 'index' ? ' is-current' : '') + '" href="index.html">◎ 系统总图首页</a>';
    CUR.units.forEach(function (u) {
      var inUnit = u.lessons.some(function (l) { return l.id === currentId; });
      s += '<div class="side-unit' + (inUnit ? ' is-current-unit' : '') + '"><div class="side-unit-title"><span class="unit-no">' + esc(u.no) + '</span>' + esc(u.title) + '</div><ol>';
      u.lessons.forEach(function (l) {
        var cur = l.id === currentId;
        s += '<li><a class="side-lesson' + (cur ? ' is-current' : '') + (FAST.length && FAST.indexOf(l.id) < 0 ? ' off-path' : '') + '" data-done-id="' + l.id + '" href="' + href(l.id) + '"' + (cur ? ' aria-current="page"' : '') + '>' +
          '<span class="check" aria-hidden="true">✓</span><span><span class="lid">' + l.id + '</span>' + esc(l.title) + '</span></a></li>';
      });
      if (u.challenge) {
        s += '<li data-ch-unit="' + u.id + '"' + (challengeVisible(u) ? '' : ' hidden') + '><a class="side-lesson side-challenge" data-done-id="' + u.id + '-c" href="challenges.html#' + u.id + '" title="' + esc(u.no) + ' 单元诊断挑战">' +
          '<span class="check" aria-hidden="true">✓</span><span>⚑ 单元挑战</span></a></li>';
      }
      s += '</ol></div>';
    });
    s += '<div class="side-unit"><a class="side-link' + (currentId === 'glossary' ? ' is-current' : '') + '" href="glossary.html">≡ 术语表</a>' +
      '<a class="side-link' + (currentId === 'capstone' ? ' is-current' : '') + '" href="capstone.html">✦ 结业任务</a>' +
      '<a class="side-link' + (currentId === 'review' ? ' is-current' : '') + '" href="review.html">↻ 复习</a></div>' +
      (CUR.version ? '<a class="side-version' + (currentId === 'changelog' ? ' is-current' : '') + '" href="changelog.html" title="查看更新记录">v' +
        esc(CUR.version) + ' · 更新记录<span class="new-badge" hidden>新</span></a>' : '') + '</nav>';
    sb.innerHTML = s;
    if (!document.querySelector('.scrim')) {
      var scrim = h('div', { class: 'scrim' });
      scrim.addEventListener('click', function () { document.body.classList.remove('nav-open'); });
      document.body.appendChild(scrim);
    }
    var curLink = sb.querySelector('.is-current');
    if (curLink) {
      scrollSidebarTo(sb, curLink);
      // 网页字体加载后行高会变，字体就绪时再对中一次
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { scrollSidebarTo(sb, curLink); });
    }
  }

  // 只滚侧栏、不滚页面：把当前项放到侧栏可见区中部；减少动态效果时不平滑
  function scrollSidebarTo(sb, link) {
    try {
      var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      var top = sb.scrollTop + link.getBoundingClientRect().top - sb.getBoundingClientRect().top -
        (sb.clientHeight - link.offsetHeight) / 2;
      sb.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });
    } catch (e) { /* ignore */ }
  }

  function lessonLink(l, cls) {
    return '<a class="' + (cls || '') + '" data-done-id="' + l.id + '" href="' + href(l.id) + '"><span class="lid">' + l.id + '</span> · ' + esc(l.title) + '</a>';
  }

  var SECTION_ORDER = ['lesson-locate', 'lesson-anim', 'lesson-mech', 'lesson-duo', 'lesson-verify', 'lesson-quiz', 'lesson-next'];

  function renderLesson(lesson) {
    var main = document.querySelector('main.lesson') || document.querySelector('main');
    // 页头
    var kicker = document.querySelector('.lesson-kicker');
    if (kicker) kicker.innerHTML = esc(lesson.unit.no + ' · ' + lesson.unit.title) + ' · <span class="lid">' + lesson.id + '</span>' + (lesson.hours ? ' · 约 ' + lesson.hours + ' 小时' : '');
    var title = document.querySelector('.lesson-title');
    if (title && !title.textContent.trim()) title.textContent = lesson.title;
    if (!document.title || document.title.indexOf('课名') >= 0) document.title = lesson.title + ' · ' + CUR.title;
    // 区块编号
    SECTION_ORDER.forEach(function (c, i) {
      var sec = main.querySelector('.' + c);
      var h2 = sec && sec.querySelector('h2');
      if (h2) h2.setAttribute('data-no', '0' + (i + 1));
    });
    // 总图缩略图
    document.querySelectorAll('[data-overview]').forEach(function (n) {
      var attr = n.getAttribute('data-highlight');
      var keys = attr ? attr.split(/[\s,]+/).filter(Boolean) : lesson.highlight;
      overview(n, keys, { link: 'index.html#layer=' + (keys[0] || ''), zoomTitle: lesson.title });
    });
    // 前置课
    document.querySelectorAll('.prereq[data-auto]').forEach(function (n) {
      n.innerHTML = lesson.prereq.length
        ? lesson.prereq.map(function (id) { return BY_ID[id] ? '<li>' + lessonLink(BY_ID[id]) + '</li>' : ''; }).join('')
        : '<li><span class="chip">无，本课是起点</span></li>';
    });
    // 下一课卡片
    var nextL = LESSONS[lesson.index + 1], prevL = LESSONS[lesson.index - 1];
    document.querySelectorAll('[data-auto-next]').forEach(function (n) {
      n.innerHTML = nextL
        ? '<div class="next-card"><span><span class="lid">下一课 ' + nextL.id + '</span><br><strong>' + esc(nextL.title) + '</strong></span><a class="btn btn-primary" href="' + href(nextL.id) + '">继续 ▶</a></div>'
        : '<div class="next-card"><span><strong>全部 ' + LESSONS.length + ' 课已走完。</strong>回到首页看看还有哪课没打勾。</span><a class="btn btn-primary" href="index.html">回首页</a></div>';
    });
    // 上一课 / 下一课
    var pager = document.getElementById('pager');
    if (!pager) { pager = h('nav', { class: 'pager', id: 'pager' }); main.appendChild(pager); }
    pager.setAttribute('aria-label', '上一课与下一课');
    pager.innerHTML =
      (prevL ? '<a class="prev" href="' + href(prevL.id) + '"><span class="dir">◀ 上一课 ' + prevL.id + '</span>' + esc(prevL.title) + '</a>' : '') +
      (nextL ? '<a class="next" href="' + href(nextL.id) + '"><span class="dir">下一课 ' + nextL.id + ' ▶</span>' + esc(nextL.title) + '</a>' : '');
    // 测验
    var qdata = document.getElementById('quiz-data');
    var qel = document.querySelector('.lesson-quiz .quiz') || document.querySelector('.lesson-quiz');
    if (qdata && qel) {
      var qs = null;
      try { qs = JSON.parse(qdata.textContent); } catch (e) { console.error('Academy: #quiz-data 不是合法 JSON', e); }
      if (qs) {
        if (qs.length !== 4) console.warn('Academy: 测验应为 4 题，当前 ' + qs.length + ' 题');
        if (qel.classList.contains('lesson-quiz')) { var box = h('div', { class: 'quiz' }); qel.appendChild(box); qel = box; }
        quiz(qel, qs, { lessonId: lesson.id });
      }
    }
    // 复制按钮
    document.querySelectorAll('.lesson-verify pre').forEach(function (pre) {
      if (!navigator.clipboard || pre.querySelector('.copy-btn')) return;
      var b = h('button', { type: 'button', class: 'copy-btn' }, '复制');
      b.addEventListener('click', function () {
        var code = pre.querySelector('code') || pre;
        navigator.clipboard.writeText(code.textContent).then(function () { b.textContent = '已复制'; setTimeout(function () { b.textContent = '复制'; }, 1200); }, function () { b.textContent = '复制失败'; });
      });
      pre.appendChild(b);
    });
  }

  // ---------- 学习路径：完整 / 速通（ecat.path），html 上的 path-fast 类让侧栏与课表淡化路径外的课 ----------
  function applyPath() { document.documentElement.classList.toggle('path-fast', pathMode() === 'fast'); }
  function renderPathSwitch(unitsEl) {
    var box = document.getElementById('path-switch') || h('div', { id: 'path-switch', class: 'path-switch' });
    var mode = pathMode();
    box.innerHTML =
      '<div class="path-seg" role="group" aria-label="学习路径">' +
      '<button type="button" class="step-btn" data-path="full" aria-pressed="' + (mode === 'full') + '">完整路径 · ' + LESSONS.length + ' 课</button>' +
      '<button type="button" class="step-btn" data-path="fast" aria-pressed="' + (mode === 'fast') + '">速通路径 · ' + FAST.length + ' 课</button></div>' +
      '<p class="path-note">' + (mode === 'fast'
        ? '先把一台驱动器跑起来，其余课在需要时回来补。速通模式下路径外的课变淡，但仍可以点。'
        : '按单元由底到顶学完全部课。想先把一台驱动器跑起来，可以切到速通路径。') + '</p>' +
      (mode === 'fast' ? '<ol class="fast-path">' + FAST.map(function (id) { return BY_ID[id] ? '<li>' + lessonLink(BY_ID[id]) + '</li>' : ''; }).join('') + '</ol>' : '');
    if (!box.parentNode) unitsEl.parentNode.insertBefore(box, unitsEl);
    box.querySelectorAll('[data-path]').forEach(function (b) {
      b.addEventListener('click', function () {
        lsSet(LS_PATH, b.getAttribute('data-path'));
        applyPath(); renderPathSwitch(unitsEl); refreshProgressUI(); updateContinue();
      });
    });
    refreshProgressUI();
  }
  function updateContinue() {
    var cont = document.getElementById('continue-btn');
    if (!cont) return;
    var p = progress.get();
    var pool = pathMode() === 'fast' && FAST.length ? FAST.map(function (id) { return BY_ID[id]; }).filter(Boolean) : LESSONS;
    var nextUndone = pool.filter(function (l) { return !p[l.id]; })[0];
    if (nextUndone) { cont.href = href(nextUndone.id); cont.textContent = (Object.keys(p).length ? '继续学习：' : '从第一课开始：') + nextUndone.id; }
    else { cont.href = pool === LESSONS ? 'capstone.html' : 'index.html'; cont.textContent = pool === LESSONS ? LESSONS.length + ' 课全部完成 ✓ · 去做结业任务' : '速通 ' + pool.length + ' 课完成 ✓'; }
  }

  // ---------- 结业任务（ecat.capstone）----------
  function capState() {
    try { var v = JSON.parse(lsGet(LS_CAP) || '{}'); return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
    catch (e) { return {}; }
  }
  function renderCapstoneBadge() {
    var hero = document.querySelector('.home-hero h1');
    if (!hero) return;
    var st = capState(), old = document.getElementById('grad-badge');
    if (old) old.remove();
    if (st.done) hero.insertAdjacentHTML('beforeend', ' <span id="grad-badge" class="grad-badge" title="结业任务全部完成（' + esc(String(st.done).slice(0, 10)) + '，只记录在本机）">✦ 已结业</span>');
  }
  /* 结业任务页：页内每条任务 <section class="capstone-task" data-task="t1">，
   * 清单项 <input type="checkbox" data-item="t1-1">，读数记录 <textarea data-note="t1-6041"> 或 <input data-note=…>。
   * 勾选与记录存 ecat.capstone，全部勾完写 done（首页显示"已结业"）。 */
  function initCapstone() {
    var st = capState(); st.items = st.items || {}; st.notes = st.notes || {};
    var boxes = [].slice.call(document.querySelectorAll('.capstone-task input[type="checkbox"][data-item]'));
    var notes = [].slice.call(document.querySelectorAll('.capstone-task [data-note]'));
    boxes.forEach(function (b) { b.checked = !!st.items[b.getAttribute('data-item')]; });
    notes.forEach(function (n) { var v = st.notes[n.getAttribute('data-note')]; if (typeof v === 'string') n.value = v; });
    function save() {
      boxes.forEach(function (b) { st.items[b.getAttribute('data-item')] = b.checked; });
      notes.forEach(function (n) { st.notes[n.getAttribute('data-note')] = n.value; });
      var all = boxes.length > 0 && boxes.every(function (b) { return b.checked; });
      if (all && !st.done) st.done = new Date().toISOString();
      if (!all) delete st.done;
      lsSet(LS_CAP, JSON.stringify(st));
      paint();
    }
    function paint() {
      document.querySelectorAll('.capstone-task').forEach(function (t) {
        var bs = t.querySelectorAll('input[type="checkbox"][data-item]'), n = 0;
        bs.forEach(function (b) { if (b.checked) n++; });
        t.classList.toggle('is-done', bs.length > 0 && n === bs.length);
        var c = t.querySelector('.cap-count');
        if (!c) { c = h('p', { class: 'cap-count' }); var h2 = t.querySelector('h2'); if (h2) h2.insertAdjacentElement('afterend', c); else t.prepend(c); }
        c.textContent = '已完成 ' + n + ' / ' + bs.length + (n === bs.length && bs.length ? ' ✓' : '');
      });
      var res = document.getElementById('cap-result');
      if (res) res.textContent = st.done ? '三条任务全部完成（' + String(st.done).slice(0, 10) + '），首页已显示"已结业"。记录只保存在这台浏览器。' : '全部勾完后，首页会显示"已结业"徽章（只记录在这台浏览器）。';
    }
    boxes.forEach(function (b) { b.addEventListener('change', save); });
    notes.forEach(function (n) { n.addEventListener('input', save); });
    paint();
  }

  // ---------- 跨课复习（review.html，题库 assets/quizbank.js 由 _build_quizbank.py 生成）----------
  function reviewStats() {
    try { var v = JSON.parse(lsGet(LS_REVIEW) || '{}'); return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {}; }
    catch (e) { return {}; }
  }
  function renderReviewLast() {
    var cont = document.getElementById('continue-btn');
    if (!cont) return;
    var old = document.getElementById('review-last'); if (old) old.remove();
    var ses = reviewStats()._session;
    var p = h('p', { id: 'review-last', class: 'review-last' },
      ses && ses.total ? '上次复习：答对 ' + ses.right + ' / ' + ses.total + '（' + Math.round(ses.right * 100 / ses.total) + '%，' +
        esc(String(ses.at).slice(0, 10)) + '）· <a href="review.html">再复习 10 题</a>'
        : '还没有复习记录 · <a href="review.html">从学过的课里抽 10 题复习</a>');
    var actions = cont.closest('.home-actions') || cont.parentNode;
    actions.insertAdjacentElement('afterend', p);
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* 抽题：只从已完成的课抽（一课都没完成时从 u0-l1、u1-l1 抽）；
   * 优先级：最近答错（按时间新→旧）> 从未答过（随机）> 其余（正确率低、久未复习的在前）；同一轮不重复。 */
  function pickReview(bank, stats, n) {
    var p = progress.get();
    var done = LESSONS.filter(function (l) { return p[l.id]; }).map(function (l) { return l.id; });
    var fromLessons = done.length ? done : ['u0-l1', 'u1-l1'];
    var pool = bank.questions.filter(function (q) { return fromLessons.indexOf(q.lesson) >= 0; });
    var wrong = [], unseen = [], rest = [];
    pool.forEach(function (q) {
      var st = stats[q.id];
      if (!st) unseen.push(q); else if (st.lastOk === false) wrong.push(q); else rest.push(q);
    });
    wrong.sort(function (a, b) { return String(stats[b.id].last).localeCompare(String(stats[a.id].last)); });
    rest.sort(function (a, b) {
      var sa = stats[a.id], sb = stats[b.id];
      var ra = sa.right / Math.max(1, sa.right + sa.wrong), rb = sb.right / Math.max(1, sb.right + sb.wrong);
      return ra - rb || String(sa.last).localeCompare(String(sb.last));
    });
    var picked = wrong.concat(shuffle(unseen), rest).slice(0, n);
    return { questions: shuffle(picked.slice()), fromDone: done.length > 0, poolSize: pool.length };
  }
  function renderReviewStats(bank, stats) {
    var heat = document.getElementById('review-heat'), weak = document.getElementById('review-weak');
    var byLesson = {};
    bank.questions.forEach(function (q) {
      var st = stats[q.id]; if (!st) return;
      var b = byLesson[q.lesson] || (byLesson[q.lesson] = { right: 0, wrong: 0 });
      b.right += st.right || 0; b.wrong += st.wrong || 0;
    });
    if (heat) {
      heat.innerHTML = CUR.units.map(function (u) {
        var r = 0, w = 0;
        u.lessons.forEach(function (l) { var b = byLesson[l.id]; if (b) { r += b.right; w += b.wrong; } });
        var n = r + w, pct = n ? Math.round(r * 100 / n) : null;
        var tier = pct === null ? 'none' : pct >= 80 ? 'good' : pct >= 50 ? 'mid' : 'bad';
        return '<div class="heat-tile heat-' + tier + '" title="' + esc(u.no + ' ' + u.title) + '"><span class="heat-unit">' + esc(u.no) + '</span>' +
          '<span class="heat-title">' + esc(u.title) + '</span><span class="heat-pct">' + (pct === null ? '未复习' : pct + '%') + '</span>' +
          (n ? '<span class="heat-n">' + r + ' / ' + n + '</span>' : '') + '</div>';
      }).join('');
    }
    if (weak) {
      var ls = Object.keys(byLesson).map(function (id) {
        var b = byLesson[id]; return { id: id, right: b.right, n: b.right + b.wrong, pct: b.right / Math.max(1, b.right + b.wrong) };
      }).filter(function (x) { return x.n > 0 && BY_ID[x.id]; });
      ls.sort(function (a, b) { return a.pct - b.pct || b.n - a.n; });
      weak.innerHTML = ls.length
        ? '<h3>最弱的三课</h3><ol class="weak-list">' + ls.slice(0, 3).map(function (x) {
            return '<li>' + lessonLink(BY_ID[x.id]) + ' <span class="weak-pct">' + Math.round(x.pct * 100) + '%（' + x.right + ' / ' + x.n + '）</span></li>';
          }).join('') + '</ol>'
        : '<p class="step-hint">做完一轮复习后，这里会按正确率列出最需要回看的三课。</p>';
    }
  }
  function initReview() {
    var bank = window.ACADEMY_QUIZBANK, box = document.getElementById('review-quiz');
    if (!box) return;
    if (!bank || !Array.isArray(bank.questions)) { box.innerHTML = '<p class="warn">题库没有加载（assets/quizbank.js）。</p>'; return; }
    var stats = reviewStats();
    renderReviewStats(bank, stats);
    var KEYS = 'ABCDEFGH';
    function start() {
      var pick = pickReview(bank, stats, 10), qs = pick.questions, i = 0, right = 0, wrongList = [];
      var intro = pick.fromDone ? '从你已完成的课里抽了 ' + qs.length + ' 题（题库 ' + pick.poolSize + ' 题，优先抽最近答错和没答过的）。'
        : '你还没有完成任何一课，先从 u0-l1、u1-l1 里抽 ' + qs.length + ' 题。';
      function show() {
        if (i >= qs.length) return finish();
        var q = qs[i], L = BY_ID[q.lesson];
        box.innerHTML = '<p class="review-intro">' + esc(intro) + '</p>' +
          '<div class="quiz-q review-card"><p class="review-meta">第 ' + (i + 1) + ' / ' + qs.length + ' 题 · 出自 ' +
          (L ? lessonLink(L) : esc(q.lesson)) + '</p><p class="q-text review-q">' + q.q + '</p><div class="q-opts" role="group"></div>' +
          '<div class="q-explain" hidden></div><div class="review-next" hidden><button type="button" class="step-btn is-primary">' +
          (i === qs.length - 1 ? '看本轮结果' : '下一题 ▶') + '</button></div></div>';
        var opts = box.querySelector('.q-opts');
        q.options.forEach(function (o, oi) {
          var b = h('button', { type: 'button', class: 'q-opt' }, '<span class="q-key">' + KEYS[oi] + '.</span><span>' + o + '</span>');
          b.addEventListener('click', function () { answer(oi); });
          opts.appendChild(b);
        });
        box.querySelector('.review-next button').addEventListener('click', function () { i++; show(); });
        refreshProgressUI();
      }
      function answer(oi) {
        var q = qs[i], ok = oi === q.answer;
        var btns = box.querySelectorAll('.q-opt');
        btns.forEach(function (b, k) { b.disabled = true; if (k === q.answer) b.classList.add('is-right'); if (k === oi && !ok) b.classList.add('is-wrong'); });
        var st = stats[q.id] || (stats[q.id] = { right: 0, wrong: 0 });
        if (ok) { st.right++; right++; } else { st.wrong++; wrongList.push(q); }
        st.last = new Date().toISOString(); st.lastOk = ok;
        lsSet(LS_REVIEW, JSON.stringify(stats));
        var ex = box.querySelector('.q-explain'); ex.hidden = false;
        ex.className = 'q-explain ' + (ok ? 'is-right' : 'is-wrong');
        ex.innerHTML = '<strong>' + (ok ? '✓ 正确。' : '✗ 不对。') + '</strong>' + q.explain +
          ' <span class="ch-links">回看：<a class="lid-chip" href="' + href(q.lesson) + '">' + q.lesson + '</a></span>';
        box.querySelector('.review-next').hidden = false;
        box.querySelector('.review-next button').focus({ preventScroll: true });
      }
      function finish() {
        stats._session = { at: new Date().toISOString(), right: right, total: qs.length };
        lsSet(LS_REVIEW, JSON.stringify(stats));
        renderReviewStats(bank, stats);
        box.innerHTML = '<div class="review-done"><p class="quiz-result' + (right === qs.length ? ' is-done' : '') + '">本轮答对 ' + right + ' / ' + qs.length + '</p>' +
          (wrongList.length ? '<p>答错的题下次会优先出现。回看：</p><ul class="weak-list">' + wrongList.map(function (q) {
            return '<li>' + (BY_ID[q.lesson] ? lessonLink(BY_ID[q.lesson]) : esc(q.lesson)) + '</li>'; }).join('') + '</ul>' : '<p>全部答对。</p>') +
          '<button type="button" class="step-btn is-primary" id="review-again">再来 10 题</button></div>';
        box.querySelector('#review-again').addEventListener('click', start);
        refreshProgressUI();
      }
      show();
    }
    start();
  }

  // ---------- 单元挑战的解锁（ecat.challenges）----------
  function paintChallengeVisibility(p) {
    var st = chState(), n = 0;
    CUR.units.forEach(function (u) {
      if (!u.challenge) return;
      var vis = challengeVisible(u, st, p);
      if (vis) n++;
      document.querySelectorAll('[data-ch-unit="' + u.id + '"]').forEach(function (e) { e.hidden = !vis; });
      var sec = document.querySelector('main#challenges section#' + u.id);
      if (sec) {
        sec.classList.toggle('is-locked', !vis);
        var bar = sec.querySelector('.ch-lockbar');
        if (!vis) {
          if (!bar) {
            bar = h('div', { class: 'ch-lockbar' });
            var h2 = sec.querySelector('h2');
            if (h2) h2.insertAdjacentElement('afterend', bar); else sec.prepend(bar);
          }
          var k = unitRemaining(u, p);
          bar.innerHTML = '<span>🔒 完成本单元 ' + k + ' 课后自动开启</span><button type="button" class="step-btn">提前开启</button>';
          bar.querySelector('button').addEventListener('click', function () {
            var s2 = chState(); s2.units[u.id] = true; lsSet(LS_CH, JSON.stringify(s2)); refreshProgressUI();
          });
        } else if (bar) bar.remove();
      }
    });
    var total = CUR.units.filter(function (u) { return u.challenge; }).length;
    document.querySelectorAll('.ch-open-count').forEach(function (e) { e.textContent = '已开启 ' + n + ' / ' + total; });
    var tb = document.getElementById('ch-toolbar');
    if (tb) {
      tb.innerHTML = '<span class="ch-open-count">已开启 ' + n + ' / ' + total + '</span>' +
        (st.all ? '<button type="button" class="step-btn" data-ch-all="0">恢复自动解锁</button>'
                : '<button type="button" class="step-btn is-primary" data-ch-all="1">开启全部挑战</button>') +
        '<span class="step-hint">' + (st.all ? '全部单元挑战已开启。' : '默认锁定：学完一个单元的全部课，该单元挑战自动开启；也可以在锁定的单元上"提前开启"。') + '</span>';
      tb.querySelector('[data-ch-all]').addEventListener('click', function () {
        var s2 = chState(); s2.all = this.getAttribute('data-ch-all') === '1'; lsSet(LS_CH, JSON.stringify(s2)); refreshProgressUI();
      });
    }
  }
  // 首页：因学完而自动解锁的单元，在卡片上一次性提示
  function announceUnlocked() {
    var st = chState(), p = progress.get(), changed = false;
    CUR.units.forEach(function (u) {
      if (!u.challenge || st.all || st.units[u.id] === true) return;
      if (unitRemaining(u, p) === 0 && !st.announced[u.id]) {
        var foot = document.querySelector('.unit-foot[data-ch-unit="' + u.id + '"]');
        if (foot) foot.insertAdjacentHTML('beforeend', ' <span class="ch-new">本单元挑战已开启</span>');
        st.announced[u.id] = true; changed = true;
      }
    });
    if (changed) lsSet(LS_CH, JSON.stringify(st));
    var btn = document.querySelector('.home-actions a[href="challenges.html"]');
    if (btn && !btn.querySelector('.ch-open-count')) btn.insertAdjacentHTML('beforeend', ' <span class="ch-open-count btn-count"></span>');
    refreshProgressUI();
  }

  // ---------- 单元诊断挑战 ----------
  /* challenge(el, data)：data = {unit: 'u0', questions: [{q, options[], answer, explain, links: ['u3-l1', …]}]}
   * 逐题显示：前一题答对才出现下一题；答错立即给解释与回链课，可重答；三题全对写进度 uX-c。 */
  function challenge(el, data) {
    data = data || {};
    var qs = data.questions, unit = data.unit, id = unit + '-c';
    var err = validQuestions(qs);
    if (!err && qs.some(function (q) { return !Array.isArray(q.links) || !q.links.length || q.links.some(function (l) { return !BY_ID[l]; }); })) err = '每题需要 links（存在的课号）';
    if (!err && !isChallengeId(id)) err = '未知单元 ' + unit;
    if (err) { console.error('Academy.challenge: ' + err); el.innerHTML = '<p class="warn">挑战数据有误：' + esc(err) + '</p>'; return null; }
    var solved = qs.map(function () { return false; }), KEYS = 'ABCDEFGH';
    el.innerHTML = '';
    var list = h('ol', { class: 'quiz-list challenge-list' });
    var items = qs.map(function (q, qi) {
      var li = h('li', { class: 'quiz-q' + (qi > 0 ? ' is-locked' : '') });
      if (qi > 0) li.hidden = true;
      li.appendChild(h('p', { class: 'q-text' }, q.q));
      var box = h('div', { class: 'q-opts', role: 'group' });
      q.options.forEach(function (o, oi) {
        var b = h('button', { type: 'button', class: 'q-opt' }, '<span class="q-key">' + KEYS[oi] + '.</span><span>' + o + '</span>');
        b.addEventListener('click', function () { answer(qi, oi, li); });
        box.appendChild(b);
      });
      li.appendChild(box);
      li.appendChild(h('div', { class: 'q-explain', hidden: true }));
      list.appendChild(li);
      return li;
    });
    el.appendChild(list);
    var bar = h('div', { class: 'quiz-bar' });
    var result = h('div', { class: 'quiz-result', 'aria-live': 'polite' });
    var reset = h('button', { type: 'button', class: 'step-btn' }, '重做');
    reset.addEventListener('click', function () { challenge(el, data); });
    bar.appendChild(result); bar.appendChild(reset); el.appendChild(bar);
    function linksHtml(q) {
      return '<span class="ch-links">回看：' + q.links.map(function (l) { return '<a class="lid-chip" href="' + href(l) + '">' + l + '</a>'; }).join('') + '</span>';
    }
    function answer(qi, oi, li) {
      if (solved[qi]) return;
      var q = qs[qi], ok = oi === q.answer;
      var btns = li.querySelectorAll('.q-opt');
      btns.forEach(function (b, k) { b.classList.remove('is-wrong'); if (k === oi && !ok) b.classList.add('is-wrong'); });
      var ex = li.querySelector('.q-explain'); ex.hidden = false;
      if (ok) {
        solved[qi] = true;
        btns[oi].classList.add('is-right');
        btns.forEach(function (b) { b.disabled = true; });
        ex.className = 'q-explain is-right';
        ex.innerHTML = '<strong>✓ 正确。</strong>' + q.explain + ' ' + linksHtml(q);
        var nx = items[qi + 1];
        if (nx) { nx.hidden = false; nx.classList.remove('is-locked'); }
      } else {
        ex.className = 'q-explain is-wrong';
        ex.innerHTML = '<strong>✗ 不对，再选一次。</strong>' + q.explain + ' ' + linksHtml(q);
      }
      update();
    }
    function update() {
      var n = solved.filter(Boolean).length, all = n === qs.length;
      result.className = 'quiz-result' + (all ? ' is-done' : '');
      if (all) {
        var saved = progress.done(id);
        result.textContent = '三题全对' + (saved ? '，本单元挑战已记录 ✓' : '，但浏览器禁止本地存储，进度未保存');
      } else {
        var prev = progress.get()[id];
        result.textContent = '已答对 ' + n + ' / ' + qs.length + (prev ? '（本单元挑战已于 ' + String(prev).slice(0, 10) + ' 完成）' : '，三题全对记为完成');
      }
    }
    update();
    return { reset: function () { challenge(el, data); } };
  }
  function initChallenges() {
    var head = document.querySelector('main#challenges .lesson-head');
    if (head && !document.getElementById('ch-toolbar')) head.insertAdjacentElement('afterend', h('div', { id: 'ch-toolbar', class: 'ch-toolbar' }));
    document.querySelectorAll('.challenge[data-unit]').forEach(function (el) {
      var u = el.getAttribute('data-unit');
      var src = document.querySelector('script.challenge-data[data-unit="' + u + '"]');
      var data = null;
      try { data = JSON.parse(src ? src.textContent : 'null'); } catch (e) { console.error('Academy: 挑战 ' + u + ' 的 JSON 不合法', e); }
      if (data) { data.unit = u; challenge(el, data); }
      else el.innerHTML = '<p class="warn">找不到挑战数据：' + esc(u) + '</p>';
    });
    refreshProgressUI();
  }

  // 首页：#home-map 放总图 + 层面板，#home-units 放单元课表
  function renderHome() {
    var mapEl = document.getElementById('home-map-svg');
    var panel = document.getElementById('layer-panel');
    var ov = null;
    function showLayer(key) {
      if (!panel) return;
      if (!key || !LAYER_NAMES[key]) {
        panel.innerHTML = '<h3>点总图里的任意一层</h3><p>每一层都是入口：点主站侧、网线或从站侧的某一层，这里会列出讲它的课。</p>' +
          '<p class="legend"><span class="tag tag-bus">总线与帧</span><span class="tag tag-mail">邮箱与配置</span><span class="tag tag-drive">驱动器与电机</span><span class="tag tag-power">电源</span><span class="tag tag-fault">故障</span></p>';
        return;
      }
      var ls = LESSONS.filter(function (l) { return l.highlight.indexOf(key) >= 0 && l.highlight.length < CUR.layers.length; });
      var wide = LESSONS.filter(function (l) { return l.highlight.length === CUR.layers.length; });
      panel.innerHTML = '<h3>' + esc(LAYER_NAMES[key]) + '</h3><p class="step-hint">讲这一层的课（' + ls.length + '）：</p><ul>' +
        ls.map(function (l) { return '<li>' + lessonLink(l) + '</li>'; }).join('') + '</ul>' +
        '<p class="step-hint">贯穿全图的课：' + wide.map(function (l) { return '<a href="' + href(l.id) + '">' + l.id + '</a>'; }).join('、') + '</p>';
      refreshProgressUI();
    }
    if (mapEl) {
      ov = overview(mapEl, [], {
        interactive: true,
        onSelect: function (k) {
          ov.select(k); showLayer(k);
          try { history.replaceState(null, '', '#layer=' + k); } catch (e) { /* ignore */ }
        }
      });
      var m = /layer=([\w-]+)/.exec(location.hash);
      if (m && LAYER_NAMES[m[1]]) { ov.select(m[1]); showLayer(m[1]); } else showLayer(null);
    }
    var unitsEl = document.getElementById('home-units');
    if (unitsEl) {
      unitsEl.innerHTML = CUR.units.map(function (u) {
        return '<div class="unit-card"><h3><span><span class="unit-no" style="color:var(--bus)">' + esc(u.no) + '</span> ' + esc(u.title) + '</span><small data-unit-count="' + u.id + '"></small></h3>' +
          '<div class="ubar" data-unit-bar="' + u.id + '"><i></i></div><ol>' +
          u.lessons.map(function (l) { return '<li' + (FAST.length && FAST.indexOf(l.id) < 0 ? ' class="off-path"' : '') + '>' + lessonLink(l) + '</li>'; }).join('') + '</ol>' +
          (u.challenge ? '<p class="unit-foot" data-ch-unit="' + u.id + '"' + (challengeVisible(u) ? '' : ' hidden') + '><a class="unit-challenge" data-done-id="' + u.id + '-c" href="challenges.html#' + u.id + '">⚑ 挑战</a></p>' : '') + '</div>';
      }).join('');
      if (FAST.length) renderPathSwitch(unitsEl);
    }
    renderCapstoneBadge();
    renderReviewLast();
    announceUnlocked();
    updateContinue();
  }

  var inited = false;
  function init(lessonId) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { init(lessonId); });
      return;
    }
    if (inited) { console.warn('Academy.init 被调用了多次'); return; }
    inited = true;
    var lesson = BY_ID[lessonId];
    if (lessonId === 'uX-lY') // _template.html 预览用的假课
      lesson = { id: 'uX-lY', title: '课名', hours: 0, highlight: ['esc', 'slave-stack'], prereq: ['u0-l1'], index: -1, unit: { no: 'UX', title: '模板' } };
    if (!lesson && ['index', 'glossary', '404', 'changelog'].indexOf(lessonId) < 0 && !PAGES[lessonId]) console.error('Academy.init: 未知课号 ' + lessonId);
    applyPath();
    renderTopbar(lesson, { glossary: '术语表', index: '系统总图', '404': '页面不存在', changelog: '更新记录' }[lessonId] || PAGES[lessonId] || '');
    renderSidebar(lessonId);
    if (lesson) renderLesson(lesson);
    if (lessonId === 'index') renderHome();
    if (lessonId === 'challenges') initChallenges();
    if (lessonId === 'capstone') initCapstone();
    if (lessonId === 'review') initReview();
    // 新版本提示：读者上次看到的版本与当前不同时，在版本链接上显示"新"；打开更新记录页即视为已看
    if (CUR.version) {
      if (lessonId === 'changelog') lsSet(LS_SEEN, CUR.version);
      var seen = lsGet(LS_SEEN);
      var fresh = lessonId !== 'changelog' && seen !== CUR.version;
      document.querySelectorAll('.side-version, .top-version').forEach(function (a) {
        a.classList.toggle('has-new', fresh);
        var b = a.querySelector('.new-badge'); if (b) b.hidden = !fresh;
        if (fresh) a.setAttribute('title', '有新版本 v' + CUR.version + '，点开看更新记录');
      });
    }
    refreshProgressUI();
    window.addEventListener('storage', function (e) { if (e.key === LS_PROGRESS) refreshProgressUI(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.body.classList.remove('nav-open'); });
  }

  /* check() —— 浏览器里自检当前课页结构，结果打印到控制台并返回问题数组 */
  function check() {
    var issues = [];
    if (!document.querySelector('main.lesson')) { // 首页、术语表等非课页：只做通用检查
      if (!document.getElementById('sidebar') || !document.querySelector('#sidebar .side-lesson')) issues.push('侧栏未渲染');
      if (issues.length) console.warn('Academy.check:', issues); else console.info('Academy.check: OK（非课页，跳过课页专属检查）');
      return issues;
    }
    var secs = Array.prototype.map.call(document.querySelectorAll('main section'), function (s) {
      return SECTION_ORDER.filter(function (c) { return s.classList.contains(c); })[0];
    }).filter(Boolean);
    if (secs.join() !== SECTION_ORDER.join()) issues.push('七区块缺失或顺序不对：' + secs.join(' > '));
    var qd = document.getElementById('quiz-data');
    try { var qs = JSON.parse(qd ? qd.textContent : 'null'); if (!qs || qs.length !== 4) issues.push('测验不是 4 题'); else { var e = validQuestions(qs); if (e) issues.push(e); } }
    catch (e) { issues.push('quiz JSON 解析失败'); }
    steppers.forEach(function (s, i) { if (s.count < 6) issues.push('第 ' + (i + 1) + ' 个步进器只有 ' + (s.count - 1) + ' 步（初始画面外至少 5 步）'); });
    if (!steppers.length) issues.push('没有调用 Academy.stepper');
    if (issues.length) console.warn('Academy.check:', issues); else console.info('Academy.check: OK');
    return issues;
  }

  window.Academy = {
    init: init,
    stepper: stepper,
    quiz: quiz,
    challenge: challenge,
    progress: progress,
    hex: hex,
    bits: bits,
    bitsTable: bitsTable,
    overview: overview,
    fx: fx,
    check: check,
    steppers: steppers, // 本页所有步进器实例（调试/自测用）
    curriculum: CUR,
    lessons: LESSONS,
    lesson: function (id) { return BY_ID[id] || null; },
    layerNames: LAYER_NAMES
  };
})();
