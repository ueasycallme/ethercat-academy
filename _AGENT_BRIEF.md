# 课页 agent 共同说明（执行 session 冻结的契约）

工作目录：/home/wuql/wuql_ws/ethercat_ws/web/academy/
必读：DESIGN.md 全文（尤其第 2、4、5、6 节和附录 A 里你负责的课）、_template.html、assets/site.js 顶部注释、assets/site.css 第 5 节 SVG 工具类、assets/curriculum.js（你的课的 highlight 与前置课）。

## 硬规则
- 只写分配给你的文件，不改 assets/、_template.html、index.html、其他 agent 的课。不 git 提交。
- 每课从 _template.html 复制：`cp _template.html uX-lY.html`，然后改 <title>、data-lesson、.lesson-title、.lesson-lede、Academy.init('uX-lY')。
- 七个 section 的 class 与顺序不变：lesson-locate → lesson-anim → lesson-mech → lesson-duo → lesson-verify → lesson-quiz → lesson-next。
- 只用内联 <script>（不加任何 src，外部脚本一律禁止）。页面私有样式写本页 <style>，选择器加 .lesson 前缀。
- 主动画：steps[0] 是初始画面，另外至少 5 步（附录 A 写了几步就做几步），每步只改一件事，一句话说明。可前进后退，回到第 0 步与初始画面一致。
- 自测 4 题，每题有 explain；字段 q、options[]、answer（从 0 起的序号）、explain。可用内联 <code>。JSON 必须严格合法（双引号、无尾逗号）。
- 机制拆解 2–4 个 h3，每节一图或一表，段落 ≤3 句。主从对照左主站右从站。在真机上看：命令用 <pre><code>，期望值用 <table class="expect">。误区 2–3 条（ul.pitfalls），保留 <div data-auto-next></div>。
- 技术内容以 ETG.1000/ETG.1020、ESC 数据手册（ET1100/LAN9252）、CiA 402（IEC 61800-7-201）、IgH EtherCAT Master 1.5/1.6 手册为准。寄存器地址、对象号、位定义、命令码、错误码不得臆造；拿不准的写"因厂商而异"或不写。DESIGN.md 附录 A 若与规范冲突，以规范为准并在汇报里指出。
- 深浅主题都可读：SVG 颜色只用 CSS 变量或 site.css 工具类（box / box-bus / box-mail / box-drive / box-fault / box-power / box-muted、fill-*、stroke-*、t-*、wire、wire-bus），不要写死颜色（#fff 只允许在实心 fill-bus 等上面的文字，用 t-onfill）。
- SVG：放在 .anim-stage 内，viewBox 宽 960，高按需；role="img" + aria-label；文字 ≥12px；可变元素带唯一 id（id 在整页唯一，建议加课号前缀避免和机制图冲突）；主站在左、从站在右、网线在中间。
- 手机宽度无页面级横向滚动：宽表格包 <div class="table-wrap">，宽图用 <div class="fig-scroll">。

## site.js 接口（冻结）
- Academy.init('uX-lY')：页尾调用一次。自动渲染侧栏、顶栏、页头 kicker、[data-overview] 总图缩略图（按 curriculum highlight；可在元素上写 data-highlight="esc slave-stack" 覆盖）、.prereq[data-auto] 前置课、[data-auto-next] 下一课卡片、#pager、从 #quiz-data 渲染测验到 .lesson-quiz .quiz。
- Academy.stepper(el, steps, opts)：el 传 #anim 区块。steps = [{title, text, apply(svg)}]。每次跳转会把 SVG 替换成初始克隆再依次 apply 0..i，所以 apply 里只能通过参数 svg 查元素（Academy.fx(svg) 或 svg.querySelector），不要在外面缓存元素引用。opts.interval（自动播放 ms），opts.onChange(i, svg)。返回 {go,next,prev,play,pause,index,svg,count}。
- Academy.fx(svg)：链式助手，参数是 id 字符串或 id 数组：show / hide（切 .is-hidden）、dim / undim（.is-dim）、hot / cool（高亮描边）、fault（红色高亮）、flow(ids, on)（虚线流动）、cls(ids, className, on)、text(id, s)、attr(ids, name, val)、move(ids, dx, dy)（CSS translate，单位即 viewBox 用户单位，带过渡）。初始隐藏的元素直接在 SVG 里写 class="is-hidden"。
- Academy.hex(v, digits=4) → "0x6041"；Academy.bits(v, names, width) → [{bit,value,name}]（bit0 在前）；Academy.bitsTable(el, v, names, width) 画逐位表。
- Academy.overview(el, keys, opts)、Academy.progress.get/done/isDone、Academy.lesson(id)、Academy.check()（浏览器控制台自检）。
- 需要页内互动（如逐位解码器、决策树）可在本页内联脚本里自己写，但不要覆盖 window.Academy。

## 自检（交付前必须做）
1. `python3 _check.py 你的课号...` 全部 OK。
2. 本地服务器已在 http://127.0.0.1:8765/ 运行（若没有：`cd web/academy && python3 -m http.server 8765 --bind 127.0.0.1`）。如有浏览器工具可打开页面看控制台；没有就仔细人工核对 JS：每个 apply 引用的 id 在 SVG 里都存在（fx 找不到会 console.warn）。
3. 最终汇报（简短）：写了哪些文件；每课主动画步数；_check.py 结果；契约缺陷（site.js/site.css 不够用之处）；对 DESIGN.md 附录 A 的技术异议；未解决问题。不要贴整页内容。

## 汇报追加要求（设计方 2026-09-26 补充）
汇报里单列一节"待抽查条目"：凡是你在页面上写了"不确定 / 因厂商而异 / 以某版本为准"，或规格要求但未实现的内容，逐条列出（课号 + 所在区块 + 一句话内容）。没有就写"无"。
