# EtherCAT 图示教学网站 软件设计文档

设计者：总控 session「EtherCAT机器人关节电机控制架构 [3ef86f]」。在线版：https://claude.ai/code/artifact/bb924c46-f2cd-400c-8707-c167e81c2a90
执行者按本文件实现；接口有疑问先按本文件，再向总控提问。

## 1. 教学目标与学习者画像

目标：让一名机器人工程师在约 30 小时内，从零掌握 EtherCAT 关节控制主站侧与从站侧的全部机制，达到"看到任何寄存器值或故障现象，能说出它在哪一层、下一步查什么"。

学习者：有嵌入式或机器人软件基础，会 C 和 Linux，用过伺服驱动器，没系统学过现场总线。手边有一台 Linux 主站 PC（IgH 主站）和一台 CiA402 驱动器可验证。

直接读文档陡峭的原因：资料分散在五套互不引用的文档（ETG.1000 帧与 ESC；ETG.1020/5001 协议与 CoE；ESC 芯片手册寄存器；CiA 402 状态机；IgH 手册 API），每套都假设已懂其他四套。初学者三大卡点：
- 把"总线在 OP"和"驱动器在 Operation Enabled"当成一件事，其实是两台独立状态机；
- 分不清邮箱通路（SDO，一问一答）和过程数据通路（PDO，周期镜像拷贝）；
- 拿到一个寄存器值不知道属于哪一层。

完成标准：能从上电把驱动器带到 OP 并使能运动；能解释周期帧里每个字节的来历；能根据 AL 状态码、WKC、603F 定位故障所在层。

## 2. 教学法设计

| 原则 | 落实构件 |
| --- | --- |
| 先建心智模型再讲细节 | 每页顶部"系统总图"缩略图，高亮本课所在层和侧 |
| 具体先于抽象 | 每课一张可步进的"主动画"，每步一句话 |
| 主从对称 | "主站做什么 / 从站做什么"双栏对照 |
| 两台状态机、两条通路分开教再合 | ESM 和 CiA402 各一课，邮箱和过程数据各一课，u7-l2 用时序合体 |
| 学完就能真机验证 | 每课"在真机上看"区：命令、寄存器、期望值 |
| 提取练习优于重读 | 每课 4 道题即时反馈 |

课程骨架：8 个单元由硬到软、由底到顶：全景 → 物理层与帧 → ESC → 协议与状态机 → 时间同步 → CiA402 → 软件实现 → 综合诊断。

每课固定七段（顺序不变）：定位、主动画、机制拆解、主从对照、在真机上看、自测、误区与关联。

## 3. 课程矩阵

| 课号 | 课名 | 主动画演什么 | 在真机上看什么 |
| --- | --- | --- | --- |
| u0-l1 | 系统总图：主站、网线、从站、电机 | 一个目标位置从规划器一层层下到电流环，实际位置原路返回 | ethercat slaves、ethercat master |
| u1-l1 | 拓扑与端口：帧怎么走一圈 | ESC 四端口、自动闭环、帧沿处理方向去、沿返回方向回 | 0x0110 DL Status 端口位 |
| u1-l2 | 帧结构：以太网头到 WKC | 逐字节展开一帧 | Wireshark 抓一帧对照 |
| u1-l3 | 寻址与命令：飞行读写与 WKC | APRD/FPRD/BRD/LRW 各走一遍，WKC 怎么加 | ethercat reg_read；域 WKC 期望值 |
| u2-l1 | ESC 内存映射与关键寄存器 | 可点击的 4 KB 寄存器地图 | ethercat reg_read 0x0130 等 |
| u2-l2 | 同步管理器 SM：邮箱模式与三缓冲 | 邮箱满空握手；三缓冲轮转；看门狗到期 | SM 寄存器 0x0800 起；看门狗寄存器 |
| u2-l3 | FMMU 与逻辑地址空间 | 三台从站物理内存映射到连续逻辑地址，一帧 LRW 服务全部 | ethercat domains -v |
| u2-l4 | EEPROM/SII 与 ESI：从站的身份证 | 主站读 SII 得到厂商号、产品号、SM 默认配置，与 ESI XML 对照 | ethercat sii_read、ethercat xml |
| u3-l0 | 对象字典：从站的参数表与数据模型 | 一张表按分区着色，放大 VAR/RECORD/ARRAY 三种对象，SDO 与 PDO 两条路访问同一张表 | ethercat sdos、upload 0x1018/0x1008 |
| u3-l1 | ESM 状态机：INIT 到 OP | 每次转换主站写 0x0120，从站回 0x0130/0x0134，错误位确认 | ethercat states；AL 状态码表 |
| u3-l2 | 邮箱与 CoE SDO | SDO 上传下载请求应答序列，分段传输，abort code | ethercat upload/download |
| u3-l3 | PDO 映射与过程映像 | 1600/1A00 映射项 → 1C12/1C13 分配 → 域里的字节偏移 | ethercat pdos、ethercat cstruct |
| u4-l1 | 分布式时钟 DC | 传播延时测量、系统时间偏移、漂移补偿、SYNC0 对齐 | ethercat slaves -v 的 DC 行 |
| u4-l2 | 同步模式与主站周期 | Free-run / SM 同步 / DC 同步三种时序并排；主站周期锁到参考时钟 | 周期抖动统计 |
| u5-l1 | CiA402 状态机与控制字、状态字 | 8 状态、转换编号，6040 和 6041 逐位解码器 | 6041 读数对照 |
| u5-l2 | 运行模式：PP/PV/TQ/HM/CSP/CSV/CST | 同一目标在不同模式下走的控制环路径 | 6060/6061，607A/60FF/6071 |
| u5-l3 | 故障、急停与抱闸 | 故障反应、Quick Stop 选项码、抱闸时序、复位上升沿 | 603F、605A、605E |
| u6-l1 | 主站程序：IgH 架构与周期任务 | request_master → activate → 周期六步，逐行高亮 | 一个可运行的最小主站程序 |
| u6-l2 | 从站固件：协议栈与中断 | SSC 三层、主循环、PDI 中断、SYNC0 中断、ESM 回调、对象字典表 | 从站日志与 AL 状态码 |
| u6-l3 | 电机控制链：三环、FOC 与插补 | 位置/速度/电流环级联；总线周期与控制周期；插补与跟随误差 | 6065、6066、606C |
| u7-l1 | 诊断工具箱 | ethercat CLI 全命令对照，Wireshark 过滤器 | 全部 |
| u7-l2 | 故障案例集与诊断决策树 | 12 个症状，互动决策树：哪台状态机、哪条通路、哪一层 | 全部 |

首页 index.html：系统总图每一层都是入口，点一层看到对应课；下方按单元排列课表和完成进度。glossary.html：全站缩写与对象号，每条链回首次出现的课。

## 4. 信息架构与页面结构

导航：左侧固定侧栏列 8 单元 21 课，已完成打勾；手机宽度侧栏收进顶部菜单。页尾上一课/下一课。顶栏深浅主题切换和进度百分比。

课页七个区块，固定 class：

| 区块 | class | 内容约束 |
| --- | --- | --- |
| 定位 | lesson-locate | 总图缩略图（共享 SVG，按 data-highlight 高亮）、3 条目标、前置课链接 |
| 主动画 | lesson-anim | 一个 SVG + 步进条，通常 5–9 步；状态机、协议序列类课可到 12 步（含初始画面），"每步只改一件事"优先于步数上限 |
| 机制拆解 | lesson-mech | 2–4 个 h3 小节，每节一图或一表，段落 ≤3 句 |
| 主从对照 | lesson-duo | 两列，左主站右从站 |
| 在真机上看 | lesson-verify | 命令用代码块，期望值用表 |
| 自测 | lesson-quiz | 共享脚本从页内 JSON 渲染，4 题 |
| 误区与关联 | lesson-next | 2–3 条误区，下一课 |

进度：localStorage 键 ecat.progress，值为 {课号: ISO 时间}；测验全对才标记完成。测验题 JSON 写在 `<script type="application/json" id="quiz-data">` 里，字段 q、options[]、answer（序号）、explain。

**定位区布局修订（2026-09-27，v1.1.2，仅改 site.css）。** 加入"先知道这些"后，原两栏（缩略图 | 目标+前置课+前引卡）左下大片留空、右栏拥挤。新布局分两层：上层两栏只放缩略图与本课目标，缩略图在目标较长时随滚动吸顶；下层通栏依次放前置课与"先知道这些"，前引卡在宽屏为一行两对（术语列 | 说明列 | 术语列 | 说明列），中等宽度一行一对，手机单列。实现用 `.locate-grid > div { display: contents }` 把右栏子元素提升为网格项，再用 `h3:has(+ .prereq)`、`h3:has(+ .pre-terms)` 与 `.prereq`、`.pre-terms` 设为 `grid-column: 1 / -1`，整段规则放在 `@supports selector(:has(+ *))` 内，不支持时保持旧布局。页面 HTML 不改。

图示规范：主站侧在左，从站侧在右，网线在中间，全站不变。语义色：总线与帧蓝（--bus），邮箱与配置紫（--mail），驱动器与电机绿（--drive），故障红（--fault），电源琥珀（--power）。每一步动画只改变一件事并用一句话说明。

## 5. 技术架构

纯静态站，无构建，无框架，无外部脚本（仅 Google Fonts 样式表）。目录 web/academy/：

```
web/academy/
  index.html            首页地图
  glossary.html         术语表
  u0-l1.html … u7-l2.html   21 课
  assets/site.css       设计令牌、外壳、七个区块样式
  assets/site.js        导航、主题、进度、步进器、测验、总图缩略图
  assets/curriculum.js  课程目录（单元、课号、标题、总图高亮键）
  _template.html        课页模板，每课从它复制
  DESIGN.md             本文件
```

site.js 暴露全局 Academy：

| 接口 | 作用 |
| --- | --- |
| Academy.init(lessonId) | 渲染侧栏、顶栏、上下课、总图缩略图、测验；课页尾部调用一次 |
| Academy.stepper(el, steps) | steps = [{title, text, apply(svg)}]；上一步/下一步/自动播放/键盘左右键；每次先 reset 再依次 apply 到当前步，保证可回退。约定：steps[0] 为初始画面，apply 只做增量修改 |
| Academy.quiz(el, questions) | 渲染选择题，即时反馈，全对写进度 |
| Academy.progress.get()/done(id)/isDone(id) | localStorage 封装，全部 try/catch |
| Academy.hex(v, width)、Academy.bits(v, names) | 十六进制与逐位展开 |
| Academy.overview(el, highlightKeys) | 画系统总图缩略图并高亮指定层 |
| Academy.overview(el, keys, opts) | opts 可选 {interactive, onSelect, link}，首页用 |
| Academy.fx(svg) | 动画助手：show/hide/dim/undim/hot/cool/fault/flow/text/attr/move，全部按 id 操作 |
| Academy.bitsTable、Academy.check()、Academy.lesson(id) | 位表渲染、浏览器自检、按课号取目录项 |

两条实现约定：Academy.hex(v, digits) 第二参数是十六进制位数；stepper 每次跳转把 SVG 换成初始克隆，apply 必须通过参数 svg 查元素，不能缓存元素引用。

总图层键（curriculum.js 里每课声明 highlight 数组）：planner、rt-loop、cia402-m、master-stack、nic、cable、esc、slave-stack、cia402-s、motor-ctrl、power-stage、motor。

设计令牌：颜色全在 :root CSS 变量；深色在 `@media (prefers-color-scheme: dark)` 内 `:root:not([data-theme="light"])` 和 `:root[data-theme="dark"]` 两处重定义；body 显式背景。变量：--bg --panel --panel2 --ink --muted --line --bus --bus-soft --mail --mail-soft --drive --drive-soft --fault --fault-soft --power --power-soft。字体：正文 Noto Sans SC，标题 Barlow Condensed，代码 JetBrains Mono。

SVG 约定：内联，viewBox 宽 960，高按需；颜色只用 CSS 变量；可变元素带 id；文字 ≥12px；role=img + aria-label；放在 .anim-stage 容器里，窄屏可横向滚动。

契约层在实现期增量修复（已纳入契约）：① .is-hot / .is-hot-fault 作用在 <g> 上时，site.css 用 g.is-hot > 图形 规则高亮子图形；② 暴露 Academy.steppers 供调试与自测；③ 行内 code 用 overflow-wrap:anywhere，.q-opt 列用 minmax(0,1fr)，避免撑出横向滚动；④ pager、next-card、侧栏、首页链接加 overflow-wrap:anywhere；⑤ SVG 内交互事件委托到 .anim-stage，hot/fault 宜作用在有描边的图形上。已知限制：fx 没有分段路径移动和宽度过渡；箭头 marker 只能每页自己定义。

**响应式规范（2026-09-26 增补，视觉需求：自适应屏幕分辨率）。** 目标是从 390px 手机到 2560px 及以上大屏都用同一套页面，内容列和字号随视口连续变化，而不是只在几个断点跳变。

| 档位 | 视口宽 | 侧栏 | 内容列 | 说明 |
| --- | --- | --- | --- | --- |
| 手机 | <600px | 抽屉 | 100%，边距 16px | 单列；主动画容器横向滚动，SVG 最小宽 640px |
| 平板 | 600–959px | 抽屉 | 100%，边距 clamp | locate/duo 在 ≥760px 恢复两栏 |
| 桌面 | 960–1599px | 固定 288px | clamp 取中 | 现状 |
| 大屏 | ≥1600px | 固定 320px | 上限 1520px | 内容列按 58vw 增长，字号同步放大 |

具体规则，全部写在 assets/site.css，课页不改：
1. 内容列宽：--content-w 从固定 980px 改为 clamp(880px, 58vw, 1520px)；.main 左右内边距 clamp(16px, 2.5vw, 48px)。
2. 流式字号：html font-size: clamp(15px, 0.35vw + 11.5px, 19px)，即 1440px 约 16.5px、1920px 约 18.2px、2560px 封顶 19px；全站尺寸改用 rem，不留固定 px 字号（SVG 内文字除外，它随 viewBox 等比缩放）。
3. 侧栏：≥1600px 时 --sidebar-w: 320px，字号随 html 一起变。
4. 主动画：.anim-stage svg 宽 100%，大屏不设最大宽，viewBox 960 在 1500px 列上放大约 1.5 倍，文字自然随之放大；窄屏 min-width 640px 横向滚动，保持现状。
5. 首页课表网格：grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))，大屏自然变 3–4 列。
6. 短视口高度（≤600px，横屏手机）：--topbar-h 48px，主动画区不做固定高度。
7. 系统缩放与高 DPR：全站无位图，不需额外处理；用户把系统字体放大时布局不破，因为一切用 rem/em。
8. 表格：.table-wrap 保持横向滚动兜底；列宽不写固定 px。

验收：headless Chrome 在 390、768、1024、1440、1920、2560 六档截图 index、u3-l1、u5-l1；检查无页面级横向溢出，内容列在大屏占视口 55%–62%，正文字号符合上表。

兼容：ES2020，无外部脚本；localStorage 读写包 try/catch；手机宽度单列，16px 边距，无页面级横向滚动。

## 6. 实现分工

执行 session 先串行完成外壳与契约（site.css、site.js、curriculum.js、_template.html、index.html），冻结接口，再并行派 7 个 agent，每个文件只有一个所有者：

| Agent | 文件 | 主题 |
| --- | --- | --- |
| A | u1-l1 u1-l2 u1-l3 | 拓扑、帧结构、寻址与 WKC |
| B | u2-l1 u2-l2 u2-l3 u2-l4 | ESC 寄存器、SM、FMMU、SII/ESI |
| C | u3-l1 u3-l2 u3-l3 | ESM、CoE SDO、PDO 映射 |
| D | u0-l1 u4-l1 u4-l2 | 系统总图、DC、同步模式 |
| E | u5-l1 u5-l2 u5-l3 | CiA402 状态机、模式、故障与抱闸 |
| F | u6-l1 u6-l2 u6-l3 | 主站程序、从站固件、电机控制链 |
| G | u7-l1 u7-l2 glossary.html | 诊断工具箱、故障案例与决策树、术语表 |

每个 agent 收到：本文件、_template.html、site.js 接口说明、附录 A 中本单元每课的规格。

验收标准（每页）：
- 从模板复制，七区块齐全且顺序不变，页尾调用 Academy.init 传入课号。
- 主动画 ≥5 步，每步只改一件事，可前进可后退，回到第 0 步与初始画面一致。
- 自测 4 题，每题有解释，全对后侧栏打勾。
- 技术内容以 ETG 规范、CiA 402、IgH 文档为准；寄存器地址、对象号、位定义不得臆造；不确定的写"因厂商而异"。
- 控制台无报错；深浅主题可读；手机宽度无页面级横向滚动。
- 不引入外部脚本，不修改 assets；契约缺陷写在汇报里由执行 session 总控修。

## 7. 验收

1. 静态检查：脚本遍历 21 课，确认七区块 class 齐全、调用了 Academy.init、quiz JSON 可解析且 4 题、无外部 script。
2. 浏览器实测：python3 -m http.server 起站，Chrome 逐页打开，控制台无报错，走完主动画，完成一页测验确认进度写入。
3. 内容审读：设计者抽查每单元一课的寄存器地址与对象号。

## 附录 A：每课规格（目标、主动画剧本、真机验证）

格式：目标（3 条）/ 主动画步骤 / 真机验证 / 必讲要点。

### u0-l1 系统总图
目标：说出主站侧五层和从站侧五层各叫什么；指出两台状态机和两条通路在图上的位置；解释一个目标位置的往返路径。
动画（8 步）：0 全图静止 → 1 规划器产生目标 → 2 实时循环写入 607A → 3 主站栈打包进 LRW 帧 → 4 帧经网线到 ESC → 5 ESC 把数据放进 SM 缓冲，固件拷到对象字典 → 6 CiA402 层交给位置环、FOC、PWM → 7 编码器读实际位置，原路返回 6064。
真机：ethercat slaves；ethercat master。
要点：主站五层（规划、实时循环、CiA402 主侧、主站协议栈、网卡驱动）；从站五层（ESC、从站协议栈、CiA402、电机控制、功率级）；EtherType 0x88A4 不走 TCP/IP。

### u1-l1 拓扑与端口
目标：解释 ESC 端口 0–3 的处理顺序；解释为什么线形拓扑物理上是环；说出断线时帧怎么自动回环。
动画（7 步）：0 三台从站线形连接 → 1 帧从主站进入从站 1 端口 0 → 2 在处理单元被读写 → 3 从端口 1 出去到从站 2 → 4 到从站 3，端口 1 无链路自动闭环 → 5 帧沿返回路径原路返回，不再处理 → 6 回到主站，一圈耗时几十微秒。
真机：ethercat reg_read -p0 0x0110 2，看 DL Status 的端口链路位。
要点：处理方向 0→3→1→2 的顺序；闭环由 ESC 硬件自动完成；冗余环的概念一句带过。

### u1-l2 帧结构
目标：从外到内说出一帧的各字段；解释一帧可装多个数据报；解释 WKC 在帧尾的位置。
动画（8 步）：以太网头（目的、源、0x88A4）→ EtherCAT 头（长度 11 位、类型 4 位）→ 数据报头（cmd 8 位、idx、address 32 位、len 11 位、R、C、M、IRQ）→ data → WKC 16 位 → 第二个数据报接在后面 → M 位表示还有后续 → 帧尾 FCS。
真机：Wireshark 过滤 ecat，展开一帧。
要点：一帧内数据报区最多 1498 字节，单个数据报数据最多 1486 字节；一帧多个数据报的 M 位；WKC 是 16 位在每个数据报末尾。

### u1-l3 寻址与命令
目标：区分自增寻址、站地址寻址、广播、逻辑寻址；说出每种命令 WKC 的增量规则；解释"飞行读写"。
动画（8 步）：APRD 自增 addr=0 命中第 1 台后递增 → FPRD 按 0x0010 站地址匹配 → BRD 所有从站都回，WKC 累加 → LRW 按 FMMU 匹配逻辑地址，读加 1、写加 2、读写加 3 → 从站在帧经过时读/写，帧不停留 → WKC 对比期望值。
真机：ethercat reg_read；ethercat domains 看 WKC 期望值。
要点：命令码表（NOP 0、APRD 1、APWR 2、APRW 3、FPRD 4、FPWR 5、FPRW 6、BRD 7、BWR 8、BRW 9、LRD 10、LWR 11、LRW 12、ARMW 13、FRMW 14）；WKC 规则：只读命令每个命中从站 +1；只写命令每个命中从站 +1；读写命令（xRW/LRW）每个从站读成功 +1、写成功 +2、都成功 +3；ARMW/FRMW 被寻址的那台读成功 +1，其余每台写成功 +1。

### u2-l1 ESC 内存映射
目标：说出寄存器区和用户 RAM 的边界；列出十个最常用寄存器；解释 AL Control/Status 的位。
动画（6 步）：0 空白 4 KB 地图 → 1 0x0000–0x000F 信息区（类型、版本、端口数）→ 2 0x0010 站地址 → 3 0x0100–0x0111 DL 控制与状态 → 4 0x0120 AL Control、0x0130 AL Status、0x0134 AL Status Code → 5 0x0600 FMMU、0x0800 SM、0x0900 DC → 6 0x1000 起用户 RAM（过程数据与邮箱）。
真机：ethercat reg_read -p0 0x0130 2。
要点：AL Status bit0–3 状态、bit4 错误指示；AL Control bit4 错误确认；用户 RAM 大小因芯片而异（ET1100 8 KB，LAN9252 4 KB）。

### u2-l2 同步管理器 SM
目标：解释邮箱模式的满/空握手；解释三缓冲模式为何无锁；解释 SM 看门狗。
动画（8 步）：邮箱模式：主站写满 SM0 → 从站读空 → 从站写满 SM1 → 主站读空；缓冲模式：主站写缓冲 A → 从站读取时切换到 B → C 轮转不阻塞；看门狗：输出 SM 超时未更新 → 看门狗过期 → 从站 AL 退到 SAFEOP 报 0x001B。
真机：ethercat reg_read -p0 0x0800 8 看 SM0 配置；看门狗 0x0400/0x0420/0x0440。
要点：SM0 邮箱出、SM1 邮箱入、SM2 输出、SM3 输入的惯例；控制字节的模式位和方向位。

### u2-l3 FMMU 与逻辑地址
目标：解释 FMMU 把物理地址映射到逻辑地址；解释为什么一帧 LRW 能服务全部从站；解释域的过程映像布局。
动画（7 步）：三台从站各自的 SM2/SM3 物理区 → 主站分配逻辑地址（IgH 第一个域从 0x00000000 起） → 每台配置 FMMU（逻辑起始、长度、物理起始、类型）→ LRW 帧携带整段逻辑地址 → 每台只处理自己映射的片段 → 主站进程内存里的域数组与逻辑地址一一对应。
真机：ethercat domains -v。
要点：FMMU 寄存器结构（逻辑起始 4 字节、长度 2、起始位、结束位、物理起始 2、物理起始位、类型、激活）；位级映射。

### u2-l4 EEPROM/SII 与 ESI
目标：说出 SII 里有什么；解释主站怎么用它识别从站；解释 ESI XML 与 SII 的关系。
动画（6 步）：主站通过 0x0500 EEPROM 接口读字 → 得到 0x0008 厂商号、产品号、版本 → 读默认 SM 配置和邮箱大小 → TwinCAT 类工具与 ESI XML 里的 Vendor/Product 对照；IgH 不读 ESI，而是与 ecrt_master_slave_config() 给的厂商号、产品号比对 → 不匹配时不挂配置、从站不往上升。
真机：ethercat sii_read -p0 | hexdump；ethercat xml。
要点：SII 字地址（0x0008 厂商、0x000A 产品、0x000C 版本、0x0018 邮箱配置）；类别区（Strings、General、FMMU、SyncM、PDO）。

### u3-l0 对象字典：从站的参数表与数据模型（2026-09-27 增补，排在 U3 第一课，u3-l1 之前）
定位：CoE 的数据模型。SDO（u3-l2）和 PDO 映射（u3-l3）都是对这张表的两种访问方式，先讲表再讲路。前置课 u2-l1（ESC 寄存器，用来对比"寄存器 ≠ 对象"）。
目标：
1. 说出对象字典是什么：从站固件维护的一张按 16 位索引 + 8 位子索引编号的参数与数据表，是 SDO 与 PDO 共同的数据源，与 ESC 寄存器（物理内存 0x0000–0x0FFF）不是一回事。
2. 分清索引分区：0x0000–0x0FFF 数据类型区、0x1000–0x1FFF 通信区、0x2000–0x5FFF 厂商区、0x6000–0x9FFF 设备行规区（CiA402 占 0x6000–0x67FF）、0xA000–0xFFFF 保留或其他用途（ETG.5001 模块化设备行规只用 0xF000 起的一段）。
3. 读懂一条对象的属性：索引、子索引、名称、对象类型（VAR 7 / ARRAY 8 / RECORD 9）、数据类型编码、访问权限（ro/rw/wo，按 ESM 状态可能不同）、PDO 可映射性（RxPDO/TxPDO）、默认值、取值范围、单位；子索引 0 在 ARRAY/RECORD 中表示元素个数。
4. 说出主站从哪里知道这张表：ESI XML 的 <Objects>/<DataTypes>、从站在线提供的 SDO Info 服务（ethercat sdos 就是它），以及从站固件里的对象定义表；三者必须一致，不一致就是 u2-l4 里的身份/配置不匹配问题。
5. 理解"同一对象、两条路"的一致性规则：已映射进 RxPDO 的对象每周期被过程数据覆盖，用 SDO 写它会在下一周期被冲掉；TxPDO 映射的对象 SDO 读到的是同一份值。
动画（"一张表，两条路"，9 步含初始）：
0 主站在左，从站里一张空白大表。
1 表按索引分区着色：0x1000 通信区（紫）、0x2000 厂商区（灰）、0x6000 行规区（绿）。
2 放大一条 VAR：0x6041 状态字，属性卡片 UINT16、ro、TxPDO 可映射、无规范默认值（因厂商而异）。
3 放大一条 RECORD：0x1600 RxPDO 映射，子索引 0 = 条目数 2，:01 = 0x60400010，:02 = 0x607A0020。
4 放大一条 ARRAY：0x1C12 SM2 分配，:00 = 1，:01 = 0x1600。
5 SDO 读 0x1008 设备名：请求经邮箱到表，应答带回字符串（走紫色路）。
6 SDO 写 0x6060 = 8：表内值更新，固件回调切模式后把 0x6061 回填为 8。
7 PDO 周期路：每周期 6040/607A 从过程映像写进表，6041/6064 从表读出到映像（走蓝色路），强调同一张表。
8 固件视角：表在 RAM，有的对象直连变量，有的带读写回调（写 6060 触发模式切换、写 0x1010 触发存 NVRAM），越界或权限不符时固件返回 abort code。
机制拆解（4 节）：
- 编号与分区：分区表 + 每区 2 个例子；特别指出 0x1018 身份对象（:01 厂商 :02 产品 :03 版本 :04 序列号）与 SII 里的身份要一致。
- 一条对象长什么样：属性字段表；数据类型编码表（BOOL 0x0001、INT8 0x0002、INT16 0x0003、INT32 0x0004、UINT8 0x0005、UINT16 0x0006、UINT32 0x0007、REAL32 0x0008、VISIBLE_STRING 0x0009、OCTET_STRING 0x000A、UNICODE_STRING 0x000B、INT64 0x0015、UINT64 0x001B）；三种对象类型与子索引 0 的含义；Complete Access 一次读整个对象。
- 主站怎么知道这张表：ESI、SDO Info 服务（Get OD List / Get Object Description / Get Entry Description）、固件对象表三者的关系；IgH 的 ethercat sdos 输出格式讲清每一列。
- 两条路一张表：SDO 与 PDO 访问同一对象的时序图；一致性规则；单位与换算（6091/6092 齿轮比、60C2 插补周期、6065 位置单位）。
页内互动：对象浏览器，内置约 30 条常用对象（通信区 0x1000/1008/1009/100A/1018/1010/1011/1600/1A00/1C00/1C12/1C13/1C32/1C33；CiA402 区 603F/6040/6041/605A/605E/6060/6061/6064/606C/6065/607A/6081/6083/6084/6091/60C2/60FD/60FE/6502），可按分区筛选、按索引搜索，点一条显示属性卡片和"在哪一课用到"。数据写在页内 JSON。
主从对照：主站读 ESI/SDO Info 认识表、PREOP 用 SDO 配参数、把可映射对象装进 PDO；从站固件持有表、校验访问权限/范围/状态、执行回调、按 0x1010 持久化。
真机：ethercat sdos -p0（看整张表）；ethercat upload -p0 0x1018 1 --type uint32（厂商号，应与 ethercat slaves -v 一致）；ethercat upload -p0 0x1008 0 --type string；ethercat upload -p0 0x1600 0 --type uint8（条目数）；ethercat download -p0 0x6060 0 8 --type int8 后 upload 0x6061；期望值表。
自测 4 题：0x6040 属于哪个分区；RECORD 的子索引 0 是什么；已映射进 RxPDO 的对象用 SDO 写会怎样；主站从哪里知道对象字典的结构。
误区（≤3 条）：对象字典不是 ESC 寄存器；IgH CLI 按 C 规则解析数字，索引不写 0x 会被当十进制（6041 → 0x1799）；ESI 里有的对象从站不一定实现，以 SDO Info 为准。说明段：对象字典是 CANopen（CiA 301）的概念，EtherCAT 通过 CoE 借用，CiA 301 的规则适用。
关联：下一课 u3-l1；u3-l2 讲怎么用 SDO 访问这张表；u3-l3 讲怎么把表里的对象装进周期帧。

### u3-l1 ESM 状态机
目标：画出 INIT/PREOP/SAFEOP/OP/BOOT 转换；说出每次转换主站做什么、从站检查什么；解释错误确认。
动画（9 步）：INIT → 主站配 SM0/SM1 邮箱 → 写 0x0120=2 → 从站检查后 0x0130=2 PREOP → 主站 SDO 配置、配 SM2/SM3、FMMU、DC → 写 0x0120=4 → SAFEOP 输入有效输出忽略 → 写 0x0120=8 → OP；失败：0x0130 bit4 置 1、0x0134 报码、主站写 bit4 确认。
真机：ethercat states；ethercat slaves 看 E 标志；AL 状态码表（0x0011 请求的状态转换无效、0x0016 无效邮箱配置、0x0017 无效 SM 配置、0x001A 同步错误、0x001B 看门狗、0x001E 无效输入配置、0x0024 无效输入映射、0x002D 无 SYNC 等）。
要点：每个状态允许什么（PREOP 邮箱，SAFEOP 输入，OP 输出）；BOOT 状态用于 FoE 固件升级。

### u3-l2 邮箱与 CoE SDO
目标：解释 SDO 上传/下载帧格式；区分快速传输和分段传输；读懂 abort code。
动画（8 步）：主站写邮箱 SM0：邮箱头（长度、地址、通道、类型 CoE=3）→ CoE 头（服务 SDO 请求）→ SDO 命令（下载请求、索引、子索引、数据）→ 从站处理 → 从站写 SM1 应答 → 主站轮询读 → 大于 4 字节走普通传输（数据跟在总长度后），超过邮箱容量才分段 → 错误时 abort 0x06090011 子索引不存在等。
真机：ethercat upload -p0 0x6041 0 --type uint16；ethercat download。
要点：常见 abort code（0x05040000 超时、0x06010000 不支持访问、0x06020000 对象不存在、0x06070010 类型不匹配、0x06090011 子索引不存在、0x08000022 当前状态不可访问）。

### u3-l3 PDO 映射与过程映像
目标：解释 1600/1A00 映射项编码；解释 1C12/1C13 分配；从映射算出域偏移。
动画（8 步）：0x1600 子索引 1 = 0x60400010（6040:00，16 位）→ 子索引 2 = 0x607A0020 → 0x1C12 子索引 1 = 0x1600 → SM2 长度 = 6 字节 → 0x1A00 同理 6041、6064 → 0x1C13 → 主站把两段放进域 → 域内偏移 0、2、6、8（普通 C 结构体会对齐成 0/4/8/12，所以要用 EC_READ_*/EC_WRITE_* 按偏移访问）。
真机：ethercat pdos；ethercat cstruct。
要点：映射项 32 位编码（索引 16、子索引 8、位长 8）；动态映射需在 PREOP 且先清零子索引 0。

### u4-l1 分布式时钟
目标：解释参考时钟；解释传播延时测量；解释偏移与漂移补偿；说出 SYNC0 怎么产生。
动画（8 步）：每台 ESC 有本地时钟 0x0910 → 主站 BWR 0x0900 触发所有从站锁存接收时间 → 主站读各端口时间戳算延时 → 写 0x0928 传播延时 → 写 0x0920 系统时间偏移 → 周期 FRMW 0x0910（IgH 用 FRMW 读参考时钟、写其余从站）让各从站漂移补偿 → 主站写 0x0990 启动时间、0x09A0 周期 → SYNC0 在各从站同一系统时间脉冲。
真机：ethercat slaves -v 看 DC 支持和延时。
要点：第一台支持 DC 的从站作参考时钟；ns 精度；主站与参考时钟的关系有两个方向，IgH 默认用 ecrt_master_sync_reference_clock 把应用时间写给参考时钟。

### u4-l2 同步模式与主站周期
目标：区分 Free-run、SM-synchronous、DC-synchronous；解释主站周期如何锁相；说出抖动来源。
动画（7 步）：三条并排时间线 → Free-run 从站本地定时器自跑 → SM 同步以输出 SM 事件触发 → DC 同步以 SYNC0 触发，帧必须在 SYNC0 之前到达 → 主站周期任务在 SYNC0 前留出安全余量 → 主站抖动过大导致帧晚到 → 从站报 0x001A 同步错误。
真机：cyclictest；在应用里打印 ecrt_domain_state() 的 working_counter 与 wc_state。
要点：0x1C32/0x1C33 同步管理器参数对象（同步类型、周期、shift）；IgH 中 ecrt_slave_config_dc。

### u5-l1 CiA402 状态机
目标：画出 8 个状态和转换编号；解码 6040 与 6041；解释 bit4 电压使能与 bit9 远程。
动画（9 步）：上电 Not Ready → 自动到 Switch On Disabled → 0x06 Shutdown → Ready to Switch On → 0x07 Switch On → Switched On → 0x0F Enable Operation → Operation Enabled → 0x02 Quick Stop → 故障 → 0x80 复位。
真机：读 6041 对照掩码表。
要点：6041 判定掩码（0x004F/0x006F）；6040 bit0 Switch On、bit1 Enable Voltage、bit2 Quick Stop（低有效）、bit3 Enable Operation、bit7 Fault Reset；页内做逐位解码器。

### u5-l2 运行模式
目标：列出 7 种模式及 6060 取值；说出每种模式主站给什么、驱动器闭什么环；解释 CSP 为什么主站要插补。
动画（7 步）：同一目标在 PP 下驱动器自己规划轨迹 → CSP 下主站每周期给一个点 → CSV 给速度 → CST 给力矩 → HM 找零 → 环路径高亮 → 6061 显示当前模式。
真机：download 6060、upload 6061。
要点：6060 值（PP 1、VL 2、PV 3、TQ 4、HM 6、IP 7、CSP 8、CSV 9、CST 10）；6502 支持的模式位图。

### u5-l3 故障、急停与抱闸
目标：解释故障反应路径；解释 605A quick stop 选项码；解释抱闸时序和复位上升沿。
动画（8 步）：运行中过热 → Fault Reaction Active 按 605E 停车 → 抱闸吸合 → Fault → 读 603F → 0x00 → 0x80 上升沿复位 → 回到 Switch On Disabled；Quick Stop 分支按 605A。
真机：603F、605A、605E；标准 60FD 只有 bit0–3（负限位、正限位、原点、interlock），抱闸反馈因厂商而异，标准的抱闸输出是 60FE:01 bit0 set brake。
要点：605A 取值含义（0 关闭、1–4 停车后回 SOD、5–8 停车后停留 QSA）；复位是 bit7 的 0→1 边沿，前一周期必须为 0。

### u6-l1 主站程序
目标：画出 IgH 架构（ec_master 模块、网卡驱动、libethercat 用户库）；写出程序生命周期；说出周期任务六步。
动画（9 步）：ecrt_request_master → ecrt_master_create_domain → ecrt_master_slave_config → ecrt_slave_config_pdos → ecrt_domain_reg_pdo_entry_list → ecrt_slave_config_dc → ecrt_master_activate → ecrt_domain_data → 周期：receive、domain_process、读、算、写、domain_queue、send。
真机：给出最小可编译示例（单从站 CSP），含 mlockall 和 SCHED_FIFO。
要点：activate 后不能再配置；domain_state 里的 WKC；ecrt_master_sync_reference_clock / sync_slave_clocks 的调用位置。

### u6-l2 从站固件
目标：画出 SSC 三层；说出主循环和两个中断各做什么；列出 ESM 回调；解释对象字典表。
动画（8 步）：ESC 驱动层（SPI/并行）→ 协议层（ESM、邮箱、CoE）→ 应用层（APPL_）→ 主循环 MainLoop 处理邮箱 → PDI 中断收输出 → SYNC0 中断触发控制周期 → 主站请求 PREOP→SAFEOP 触发 APPL_StartInputHandler → 看门狗过期 → 协议层退回 SAFEOP 报码。
真机：从站串口日志；AL 状态码。
要点：APPL_StartMailboxHandler、APPL_StopMailboxHandler、APPL_StartInputHandler、APPL_StopInputHandler、APPL_StartOutputHandler、APPL_StopOutputHandler、APPL_InputMapping、APPL_OutputMapping、APPL_Application；自研栈的必备最小集。

### u6-l3 电机控制链
目标：画出三环级联和 FOC；解释总线周期与控制周期关系；解释插补与跟随误差。
动画（8 步）：607A 进位置环 → 速度指令进速度环 → 电流指令进电流环 → Clarke/Park 变换 → PWM → 电机 → 编码器 → 反馈闭环；总线 1 ms、位置环 1 ms、速度环 250 µs、电流环 62.5 µs；主站跳变 vs 插补对比。
真机：6065 跟随误差窗口（位置单位，经 6091/6092 换算）、6066 超时、606C 实际速度。
要点：CSP 下主站给的点应该是每周期可达；6065 单位是编码器 counts。

### u7-l1 诊断工具箱
目标：会用 ethercat CLI 的 12 个常用命令；会写 Wireshark 过滤器；会从三处读数定层。
动画（6 步）：一条命令一层：slaves 看 ESM → states 切状态 → upload/download 走邮箱 → pdos/cstruct 看映射 → reg_read 看 ESC → domains 看 WKC。
真机：全部命令对照表（命令、作用、看哪一层、示例输出）。

### u7-l2 故障案例集
目标：用决策树把症状分到状态机/通路/层；12 个案例。
动画：互动决策树（点击分支展开）。案例包括：slaves 显示 PREOP 不升 OP；E 标志与 0x001B；WKC 比期望少 1；6041=0x0668 这类判不出标准状态的读数（bit3 与 bit6 同为 1，按 bit3 当故障处理）；SDO abort 0x08000022；upload 超时；使能瞬间猛冲；间歇性 0x001A；DC 不同步；网线插错端口；ESI 不匹配；主站程序退出后从站停在 SAFEOP。
每案例：现象 → 先看哪里 → 推理 → 修复 → 关联课。

### glossary.html
全站缩写与对象号，字段：术语、全称、一句话解释、首次出现课链接。至少 80 条。

## 附录 B：知识孤岛排查与修法（2026-09-27）

排查方法：用术语表的“首次讲解课”与 22 课正文实际出现位置交叉比对，得到 73 条“先用后教”，再逐条判断是否实质依赖。总图预览、关联课提示、只在表格里顺带出现的不算孤岛。

### 结论：三类真孤岛

1. **前引概念无落脚点。** U2 四课大量使用 INIT/PREOP/SAFEOP/OP，但要到 u3-l1 才讲；u1-l3 用 FMMU/逻辑地址讲 LRW 的 WKC，u2-l3 才讲；U3 的例子全用 6040/6041/607A/6064，u5-l1 才讲；u4-l2 用 CSP/PREEMPT_RT/mlockall，分别在 u5-l2、u6-l1 才讲。
2. **贯穿全站却没有速览的骨架名词。** ESM 四态、CiA402 四个核心对象、SDO/PDO 两条路，从 u0-l1 起每课都用，却只有总图一句话。
3. **规范地图缺失。** 全站引用 ETG.1000.x、ETG.1020、ETG.2010、ETG.5001、CiA 301、CiA 402、IgH 手册，但没有一处告诉学习者哪份文档定义什么、遇到问题去哪查。

### 修法一：每课“先知道这些”卡（契约层 + 逐课内容）

定位区块在“前置课”之后增加固定小节 `<h3>先知道这些</h3><dl class="pre-terms">`：本课会用到、但要在后面才详讲的概念，每条一句话定义 + “详见 uX-lY”链接。规则：只列本课实质依赖的前引，一般 2–5 条，没有则省略整个小节。site.css 提供 .pre-terms 样式（紧凑两栏定义列表，链接用课号胶囊）。

各课清单（术语 → 一句话 → 详见）：
- u0-l1：本课所有名词都是预览。增加“名词速览卡”：ESM 四态（INIT 只能读写寄存器 → PREOP 邮箱可用 → SAFEOP 输入有效 → OP 输出生效）；CiA402 四对象（6040 控制字、6041 状态字、607A 目标位置、6064 实际位置）；SDO 一问一答走邮箱、PDO 周期镜像走过程数据。
- u1-l1：PDI（ESC 与从站 MCU 之间的接口，u2-l1）；SII/EEPROM（从站身份与默认配置所在，u2-l4）；飞行读写（帧经过时就地读写，u1-l3）。
- u1-l2：命令码 FPRD 等（u1-l3）；逻辑地址（主站分配的虚拟地址空间，u2-l3）；ESC 寄存器区（u2-l1）；MAC 与 EtherType（以太网基础，一句话）。
- u1-l3：FMMU 与逻辑地址（u2-l3）；站地址 0x0010、别名 0x0012（u2-l1）；RxPDO/TxPDO（周期输出/输入数据，u3-l3）；域 domain（主站里一块过程映像，u6-l1）；参考时钟（u4-l1）；SAFEOP/OP 对读写的影响（u3-l1）。
- u2-l1：ESM 四态（u3-l1）；SM、FMMU、DC 三类资源各一句（u2-l2、u2-l3、u4-l1）；看门狗（u2-l2）。
- u2-l2：ESM 四态（u3-l1）；SDO/PDO/CoE（u3-l0、u3-l2、u3-l3）；ESI（u2-l4）。
- u2-l3：域 domain（u6-l1）；PREOP/SAFEOP（u3-l1）；PDO 映射决定长度（u3-l3）。
- u2-l4：邮箱协议族 CoE/FoE（u3-l2）；INIT/BOOT（u3-l1）；PDO（u3-l3）。
- u3-l0：CiA402 对象 6040/6041/607A/6064/6060（u5-l1、u5-l2）；PDO 映射 0x1600/0x1C12（u3-l3）；1C32（u4-l2）；abort code（u3-l2）；6065/6091 位置单位（u6-l3）。
- u3-l1：SDO（u3-l2）；PDO 映射与 SM2/SM3 长度（u3-l3）；DC/SYNC0（u4-l1）；FoE 与 BOOT（u3-l2）。
- u3-l2：6060/6061 与 CSP（u5-l2）。
- u3-l3：域与 EC_READ_*（u6-l1）；6040/6041/607A/6064（u5-l1）。
- u4-l1：同步模式（u4-l2）；DC 同步（u4-l2）。
- u4-l2：CSP/CSV/CST（u5-l2）；PREEMPT_RT、SCHED_FIFO、mlockall（u6-l1）；1C32/1C33（已教于 u3-l0，回链）。
- u5-l2：插补与跟随误差（u6-l3）；位置单位与齿轮比 6091/6092（u6-l3）。
- u5-l3：PWM 与功率级（u6-l3）；Emergency（已教于 u3-l2，回链）。
- u5-l1、u6-l1、u6-l2、u6-l3、u7-l1、u7-l2：无实质前引，省略小节。

### 修法二：u0-l1 增加“名词速览卡”
见上表 u0-l1 条目，放在定位区块，作为全站骨架名词的第一次落脚点；总图动画不改。

### 修法三：u7-l1 增加“规范地图”小节
表格：文档 → 定义什么 → 本站哪些课用到。ETG.1000.2 物理层与拓扑（u1-l1）、ETG.1000.3 数据链路层服务定义、ETG.1000.4 数据链路层协议：帧格式、命令、WKC、FMMU、SM、DC（u1-l2、u1-l3、u2-l2、u2-l3、u4-l1）、ETG.1000.5 应用层服务定义（u3-l2）、ETG.6010 CiA402 实施指南（U5）、ETG.1000.6 应用层协议：ESM、CoE、AL 状态码（u3-l1、u3-l0、u3-l2）、ETG.1020 协议增强（同步模式 1C32、u4-l2）、ETG.2000 ESI 文件格式、ETG.2010 SII 内容（u2-l4）、ETG.5001 模块化设备行规（u3-l0 提及）、CiA 301 CANopen 应用层与对象字典（u3-l0）、CiA 402 驱动器行规（u5）、ESC 芯片手册（u2-l1）、IgH 主站手册（u6-l1、u7-l1）、SSC 文档（u6-l2）。附一句：规范在 ETG 官网会员区下载，CiA 规范在 can-cia.org。

### 术语表
“先知道这些”里出现的每个术语在术语表都要有条目，首次讲解课保持为详讲的那一课，不因预览而提前。
