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
      if (!BY_ID[id]) { console.warn('Academy.progress.done: 未知课号 ' + id); return false; }
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
    { key: 'master-stack', side: 'm', row: 4, label: '主站协议栈',     sub: 'IgH EtherCAT',     tone: 'mail' },
    { key: 'nic',          side: 'm', row: 5, label: '网卡驱动',       sub: 'NIC · 0x88A4',     tone: 'bus' },
    { key: 'cable',        side: 'c', row: 5, label: 'EtherCAT 网线',  sub: '',                 tone: 'bus' },
    { key: 'esc',          side: 's', row: 5, label: 'ESC 从站控制器', sub: 'SM · FMMU · DC',   tone: 'bus' },
    { key: 'slave-stack',  side: 's', row: 4, label: '从站协议栈',     sub: 'ESM · CoE',        tone: 'mail' },
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
    s += '<path class="ov-link ov-link-mail" d="M' + (X_M + W) + ' ' + yc(4) + ' H' + X_S + '"/>';
    s += '<text class="ov-note" x="480" y="' + (yc(4) - 7) + '" text-anchor="middle">ESM 状态机 · 邮箱 SDO / 过程数据 PDO</text>';
    LAYERS.forEach(function (l) {
      var yy = y(l.row);
      var g = '<g class="ov-layer tone-' + l.tone + '" data-layer="' + l.key + '">';
      if (l.side === 'c') {
        g += '<rect x="' + (X_M + W) + '" y="' + yy + '" width="' + (X_S - X_M - W) + '" height="' + RH + '"/>';
        g += '<line class="ov-cable-line" x1="' + (X_M + W) + '" y1="' + yc(5) + '" x2="' + X_S + '" y2="' + yc(5) + '"/>';
        g += '<text x="480" y="' + (yy - 2) + '" text-anchor="middle">' + l.label + '</text>';
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
   * opts.link: 字符串 URL，整个缩略图作为链接（课页缩略图默认链到首页对应层）
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
    if (opts.link) {
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
  var activeStepper = null;
  document.addEventListener('keydown', function (e) {
    if (!activeStepper || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    var t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); activeStepper.next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); activeStepper.prev(); }
  });

  /* stepper(el, steps, opts)
   * el: .lesson-anim 区块或 .anim-stage 容器（内含一个 <svg>）。
   * steps[i].apply(svg) 只做本步的增量修改；每次跳转先把 SVG 恢复为初始克隆，再依次 apply 0..i。
   *   注意：因为 SVG 会被替换为克隆，apply 里必须通过参数 svg（或 Academy.fx(svg)）查元素，不要缓存元素引用。
 *   同理，SVG 内的点击等交互要把事件委托到 .anim-stage 容器上，不要直接绑在 SVG 元素上。
   * opts.interval 自动播放间隔 ms（默认 3000）；opts.onChange(i, svg) 每次渲染后回调。 */
  function stepper(el, steps, opts) {
    opts = opts || {};
    if (!el) { console.error('Academy.stepper: el 为空'); return null; }
    if (!Array.isArray(steps) || !steps.length) { console.error('Academy.stepper: steps 为空'); return null; }
    var stage = el.classList.contains('anim-stage') ? el : el.querySelector('.anim-stage');
    if (!stage) stage = el;
    var root = stage.parentElement || el;
    var svg = stage.querySelector('svg');
    if (!svg) { console.error('Academy.stepper: 找不到 svg'); return null; }
    var pristine = svg.cloneNode(true);

    var bar = root.querySelector('.stepper');
    if (!bar) { bar = h('div', { class: 'stepper' }); stage.insertAdjacentElement('afterend', bar); }
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
    steps.forEach(function (s, i) {
      var d = h('button', { type: 'button', class: 'step-dot', title: s.title || ('步骤 ' + i), 'aria-label': '跳到步骤 ' + i }, String(i));
      d.addEventListener('click', function () { pause(); go(i); });
      dots.appendChild(d);
    });
    var cur = 0, timer = null;

    function safeApply(k) {
      if (typeof steps[k].apply !== 'function') return;
      try { steps[k].apply(svg); }
      catch (err) { console.error('Academy.stepper: 第 ' + k + ' 步 apply 出错', err); }
    }
    function render(i, animate) {
      var fresh = pristine.cloneNode(true);
      svg.replaceWith(fresh); svg = fresh;
      for (var k = 0; k < i; k++) safeApply(k);
      if (animate) svg.getBoundingClientRect(); // 刷新样式，让第 i 步的变化产生过渡
      safeApply(i);
      bar.querySelector('.step-no').textContent = '步骤 ' + i + ' / ' + (steps.length - 1);
      bar.querySelector('.step-title').textContent = steps[i].title || '';
      bar.querySelector('.step-text').textContent = steps[i].text || '';
      bar.querySelectorAll('.step-dot').forEach(function (d, k) {
        d.classList.toggle('is-current', k === i);
        d.classList.toggle('is-past', k < i);
        if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
      });
      bar.querySelector('[data-act="prev"]').disabled = i === 0;
      bar.querySelector('[data-act="next"]').disabled = i === steps.length - 1;
      if (opts.onChange) { try { opts.onChange(i, svg); } catch (err) { console.error(err); } }
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
      get svg() { return svg; },
      count: steps.length
    };
    [root, bar].forEach(function (n) {
      n.addEventListener('pointerdown', function () { activeStepper = api; });
      n.addEventListener('focusin', function () { activeStepper = api; });
    });
    steppers.push(api);
    if (!activeStepper) activeStepper = api;
    render(0, false);
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
        s += '<li><a class="side-lesson' + (cur ? ' is-current' : '') + '" data-done-id="' + l.id + '" href="' + href(l.id) + '"' + (cur ? ' aria-current="page"' : '') + '>' +
          '<span class="check" aria-hidden="true">✓</span><span><span class="lid">' + l.id + '</span>' + esc(l.title) + '</span></a></li>';
      });
      s += '</ol></div>';
    });
    s += '<div class="side-unit"><a class="side-link' + (currentId === 'glossary' ? ' is-current' : '') + '" href="glossary.html">≡ 术语表</a></div>' +
      (CUR.version ? '<div class="side-version" title="站点版本">v' + esc(CUR.version) + '</div>' : '') + '</nav>';
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
      overview(n, keys, { link: 'index.html#layer=' + (keys[0] || '') });
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
        : '<div class="next-card"><span><strong>全部 21 课已走完。</strong>回到首页看看还有哪课没打勾。</span><a class="btn btn-primary" href="index.html">回首页</a></div>';
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
          u.lessons.map(function (l) { return '<li>' + lessonLink(l) + '</li>'; }).join('') + '</ol></div>';
      }).join('');
    }
    var cont = document.getElementById('continue-btn');
    if (cont) {
      var p = progress.get();
      var nextUndone = LESSONS.filter(function (l) { return !p[l.id]; })[0];
      if (nextUndone) { cont.href = href(nextUndone.id); cont.textContent = (Object.keys(p).length ? '继续学习：' : '从第一课开始：') + nextUndone.id; }
      else { cont.href = 'u7-l2.html'; cont.textContent = '21 课全部完成 ✓'; }
    }
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
    if (!lesson && lessonId !== 'index' && lessonId !== 'glossary' && lessonId !== '404') console.error('Academy.init: 未知课号 ' + lessonId);
    renderTopbar(lesson, { glossary: '术语表', index: '系统总图', '404': '页面不存在' }[lessonId] || '');
    renderSidebar(lessonId);
    if (lesson) renderLesson(lesson);
    if (lessonId === 'index') renderHome();
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
